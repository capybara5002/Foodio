/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';

import { Restaurant } from '../types';
import { X, BadgeCheck, Star, Bookmark, MapPin, Map, Clock, LocateFixed, Flame, ArrowRight, MessageSquare, Volume2, VolumeX, Compass, Keyboard, ListOrdered, Navigation, ChevronRight, Ruler, Check, RotateCcw } from 'lucide-react';
import { startLocationTracking, stopLocationTracking, LocationMode } from '../services/locationService';
import { checkGeofences } from '../services/geofenceEngine';
import { playNarration, stopNarration, onNarrationStart, onNarrationEnd, getMuted, setMuted } from '../services/narrationEngine';
import MultiLanguageAudioGuide from '../components/MultiLanguageAudioGuide';
import ImageGallery from '../components/Common/ImageGallery';

// Standard Leaflet asset fixes for Vite builds to prevent broken image references
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface PageMapProps {
  restaurants: Restaurant[];
  onSelectRestaurant: (id: string) => void;
  onSelectTour: () => void;
  onContactRestaurant: (restaurantId: string) => void;
  savedRestaurantIds: string[];
  onToggleSavedRestaurant: (restaurantId: string) => void;
  searchSelection: { restaurantId: string; requestId: number } | null;
}

// Coordinate constraints for Vinh Khanh Food Street
const VINH_KHANH_CENTER: [number, number] = [10.7580, 106.7020];
const MAP_ZOOM = 16;
const SW_BOUNDS: [number, number] = [10.7500, 106.6950];
const NE_BOUNDS: [number, number] = [10.7650, 106.7150];
const MAX_BOUNDS = L.latLngBounds(SW_BOUNDS, NE_BOUNDS);
type SheetStage = 'peek' | 'expanded';

// Custom teardrop pin shape for food stalls
const getIconSvg = (category: string, size: number) => {
  if (category.toLowerCase() === 'seafood') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-fish" style="transform: rotate(-45deg);"><path d="M2 16c.8-1 2-2.2 3.5-3 1.7.5 3.5.8 5.2.8 3.7 0 7.3-1.7 9.8-4.7L22 7l-1.9 1.2a15.7 15.7 0 0 1-9.8 3.5c-1.8 0-3.5-.3-5.2-.8-1.5-.8-2.7-2-3.5-3L2 6v10Z"/><path d="M16 8h.01"/><path d="M12 3h.01"/><path d="M22 17c-.8-1.2-2.2-2-3.5-2"/></svg>`;
  } else {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flame" style="transform: rotate(-45deg);"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
  }
};

const getRestaurantIcon = (category: string, isSelected: boolean) => {
  const bgColor = isSelected ? '#b76548' : '#3b2a21';
  const size = isSelected ? 42 : 34;
  const innerSize = isSelected ? 22 : 18;

  return L.divIcon({
    className: `custom-restaurant-pin-${category}`,
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s;">
        <div style="display: flex; align-items: center; justify-content: center; width: ${size}px; height: ${size}px; background-color: ${bgColor}; border: 2px solid white; border-radius: 50% 50% 0 50%; transform: rotate(45deg); box-shadow: 0 4px 6px rgba(0,0,0,0.15);">
          ${getIconSvg(category, innerSize)}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size]
  });
};

// Pulsing user location Blue Dot icon
const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;">
      <div class="animate-ping" style="position: absolute; width: 24px; height: 24px; background-color: #7d826b; border-radius: 50%; opacity: 0.38;"></div>
      <div style="position: relative; width: 14px; height: 14px; background-color: #7d826b; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 8px 18px rgba(77,49,31,0.28);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Helper component to add and remove leaflet-routing-machine controls dynamically
type RouteDistanceResult = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  distanceMeters: number | null;
};

interface RoutingControlProps {
  userLocation: [number, number];
  destination: [number, number] | null;
  onResult: (result: RouteDistanceResult) => void;
}

function RoutingControl({ userLocation, destination, onResult }: RoutingControlProps) {
  const map = useMap();
  const routingControlRef = useRef<any>(null);
  const userLat = userLocation[0];
  const userLng = userLocation[1];
  const destinationLat = destination?.[0] ?? null;
  const destinationLng = destination?.[1] ?? null;

  useEffect(() => {
    if (!map) return;

    let settled = false;
    let timeoutId: number | undefined;

    const finish = (result: RouteDistanceResult) => {
      if (settled) return;
      settled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      onResult(result);
    };

    if (routingControlRef.current) {
      try {
        routingControlRef.current.setWaypoints([]);
        map.removeControl(routingControlRef.current);
      } catch (e) {}
      routingControlRef.current = null;
    }

    if (destinationLat === null || destinationLng === null) {
      onResult({ status: 'idle', distanceMeters: null });
      return;
    }

    onResult({ status: 'loading', distanceMeters: null });

    try {
      const routingControl = (L as any).Routing.control({
        waypoints: [
          L.latLng(userLat, userLng),
          L.latLng(destinationLat, destinationLng)
        ],
        router: (L as any).Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1'
        }),
        routeWhileDragging: false,
        addWaypoints: false,
        fitSelectedRoutes: false,
        showAlternatives: false,
        createMarker: () => null,
        lineOptions: {
          styles: [{ color: '#b76548', weight: 6, opacity: 0.85 }]
        }
      });

      routingControl.on('routesfound', (event: any) => {
        const distanceMeters = event.routes?.[0]?.summary?.totalDistance;
        finish(typeof distanceMeters === 'number'
          ? { status: 'ready', distanceMeters }
          : { status: 'error', distanceMeters: null });
      });

      routingControl.on('routingerror', () => {
        finish({ status: 'error', distanceMeters: null });
      });

      routingControl.addTo(map);

      const container = routingControl.getContainer();
      if (container) {
        container.style.display = 'none';
      }

      routingControlRef.current = routingControl;
      timeoutId = window.setTimeout(() => {
        finish({ status: 'error', distanceMeters: null });
      }, 10000);
    } catch (err) {
      console.error("Leaflet routing control initialization failed:", err);
      finish({ status: 'error', distanceMeters: null });
    }

    return () => {
      settled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      if (map && routingControlRef.current) {
        try {
          routingControlRef.current.setWaypoints([]);
          map.removeControl(routingControlRef.current);
        } catch (e) {}
        routingControlRef.current = null;
      }
    };
  }, [map, userLat, userLng, destinationLat, destinationLng, onResult]);

  return null;
}

// Sub-component to force map center ONCE on mount — prevents Leaflet caching stale viewport
function MapViewUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const hasFired = useRef(false);
  useEffect(() => {
    if (!hasFired.current) {
      hasFired.current = true;
      map.setView(center, zoom, { animate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

// Controller component to center viewport dynamically
interface MapControllerProps {
  userLocation: [number, number];
  selectedRestaurant: Restaurant | null;
  locateTrigger: boolean;
  getCoordinates: (r: Restaurant) => [number, number];
}

function MapController({ userLocation, selectedRestaurant, locateTrigger, getCoordinates }: MapControllerProps) {
  const map = useMap();
  const prevSelectedRef = useRef<Restaurant | null>(null);

  useEffect(() => {
    if (locateTrigger) {
      map.setView(userLocation, 16, { animate: true });
    }
  }, [locateTrigger, map, userLocation]);

  useEffect(() => {
    if (selectedRestaurant) {
      const coords = getCoordinates(selectedRestaurant);

      const wasNull = prevSelectedRef.current === null;
      prevSelectedRef.current = selectedRestaurant;

      const performPan = () => {
        map.invalidateSize();

        const isMobile = window.innerWidth < 768;
        // Shift visible center upward on mobile bottom sheet (offset latitude by about -0.0018 degrees)
        const offsetLat = isMobile ? -0.0018 : 0;

        map.setView([coords[0] + offsetLat, coords[1]], 17, {
          animate: true,
          duration: 0.8
        });
      };

      if (wasNull && window.innerWidth >= 768) {
        // Desktop transition width (100% -> 70%) takes 300ms. Delay pan until map resizing finishes.
        const timer = setTimeout(() => {
          performPan();
        }, 300);
        return () => clearTimeout(timer);
      } else {
        // Pan immediately when selecting a restaurant on mobile
        performPan();
      }
    } else {
      prevSelectedRef.current = null;
      if (window.innerWidth >= 768) {
        // Desktop transition width back to 100% takes 300ms. Invalidate size after width expands.
        const timer = setTimeout(() => {
          map.invalidateSize();
        }, 300);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurant, map, getCoordinates]);

  return null;
}

// Haversine formula — returns distance in meters between two lat/lng points
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface DistanceRoutingControlProps {
  positions: [number, number][];
  onResult: (result: RouteDistanceResult) => void;
}

function DistanceRoutingControl({ positions, onResult }: DistanceRoutingControlProps) {
  const map = useMap();
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (routingControlRef.current) {
      try {
        routingControlRef.current.setWaypoints([]);
        map.removeControl(routingControlRef.current);
      } catch (error) {}
      routingControlRef.current = null;
    }

    if (positions.length !== 2) {
      onResult({ status: 'idle', distanceMeters: null });
      return;
    }

    onResult({ status: 'loading', distanceMeters: null });

    try {
      const routingControl = (L as any).Routing.control({
        waypoints: positions.map(([lat, lng]) => L.latLng(lat, lng)),
        router: (L as any).Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1'
        }),
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        showAlternatives: false,
        createMarker: () => null,
        lineOptions: {
          styles: [
            { color: '#fffaf4', weight: 9, opacity: 0.9 },
            { color: '#e2533b', weight: 6, opacity: 0.95 }
          ]
        }
      });

      routingControl.on('routesfound', (event: any) => {
        const route = event.routes?.[0];
        const distanceMeters = route?.summary?.totalDistance;

        if (typeof distanceMeters !== 'number') {
          onResult({ status: 'error', distanceMeters: null });
          return;
        }

        onResult({ status: 'ready', distanceMeters });

        if (route.coordinates?.length) {
          map.fitBounds(L.latLngBounds(route.coordinates), {
            animate: true,
            duration: 0.6,
            maxZoom: 17,
            paddingTopLeft: [48, 48],
            paddingBottomRight: [window.innerWidth >= 768 ? 440 : 80, 96]
          });
        }
      });

      routingControl.on('routingerror', () => {
        onResult({ status: 'error', distanceMeters: null });
      });

      routingControl.addTo(map);
      const container = routingControl.getContainer();
      if (container) container.style.display = 'none';
      routingControlRef.current = routingControl;
    } catch (error) {
      onResult({ status: 'error', distanceMeters: null });
    }

    return () => {
      if (routingControlRef.current) {
        try {
          routingControlRef.current.setWaypoints([]);
          map.removeControl(routingControlRef.current);
        } catch (error) {}
        routingControlRef.current = null;
      }
    };
  }, [map, onResult, positions]);

  return null;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function PageMap({ restaurants, onSelectRestaurant, onSelectTour, onContactRestaurant, savedRestaurantIds, onToggleSavedRestaurant, searchSelection }: PageMapProps) {
  const { t, i18n } = useTranslation();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedRouteResult, setSelectedRouteResult] = useState<RouteDistanceResult>({
    status: 'idle',
    distanceMeters: null
  });
  const [locateTrigger, setLocateTrigger] = useState(false);
  const [gpsNotification, setGpsNotification] = useState(false);

  // Transition state for smooth sliding animations
  const [activeRestaurant, setActiveRestaurant] = useState<Restaurant | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [sheetStage, setSheetStage] = useState<SheetStage>('peek');
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const sheetDragStartRef = useRef<{ y: number; moved: boolean } | null>(null);

  // Nearby restaurants panel state
  const [isNearbyOpen, setIsNearbyOpen] = useState(false);

  // Restaurant-to-restaurant distance measurement state
  const [isDistancePanelOpen, setIsDistancePanelOpen] = useState(false);
  const [distanceRestaurantIds, setDistanceRestaurantIds] = useState<string[]>([]);
  const [distanceRouteResult, setDistanceRouteResult] = useState<RouteDistanceResult>({
    status: 'idle',
    distanceMeters: null
  });

  useEffect(() => {
    if (selectedRestaurant) {
      setActiveRestaurant(selectedRestaurant);
      setIsOpen(true);
      setSheetStage('peek');
      setSheetDragOffset(0);
    } else {
      setIsOpen(false);
      setSheetDragOffset(0);
      setIsSheetDragging(false);
      const timer = setTimeout(() => {
        setActiveRestaurant(null);
      }, 300); // Wait for transition duration (300ms) before unmounting content
      return () => clearTimeout(timer);
    }
  }, [selectedRestaurant]);

  // Location and narration guide states
  const [userLocation, setUserLocation] = useState<[number, number]>(VINH_KHANH_CENTER);
  const [locationMode, setLocationMode] = useState<LocationMode>('mock');
  const [currentNarration, setCurrentNarration] = useState<{ restaurant: Restaurant; text: string } | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(getMuted());

  // Freeze layouts and disable background scrolling dynamically when Map mounts
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;

    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
    };
  }, []);

  // Hook location service tracking
  useEffect(() => {
    startLocationTracking(locationMode, (pos) => {
      setUserLocation([pos.lat, pos.lng]);

      // Verify geofence trigger
      const triggered = checkGeofences(pos, restaurants);
      if (triggered) {
        const lang = localStorage.getItem('app_lang') || 'vi';
        void playNarration(triggered, lang);
      }
    });

    return () => {
      stopLocationTracking();
    };
  }, [locationMode, restaurants]);

  // Subscribe to active audio guide narrations
  useEffect(() => {
    const unsubStart = onNarrationStart((res, text) => {
      setCurrentNarration({ restaurant: res, text });
    });
    const unsubEnd = onNarrationEnd(() => {
      setCurrentNarration(null);
    });

    return () => {
      unsubStart();
      unsubEnd();
    };
  }, []);

  const toggleMute = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    setMuted(nextMuted);
  };

  const toggleLocationMode = () => {
    setLocationMode((prev) => (prev === 'real' ? 'mock' : 'real'));
  };

  // Project coordinates of items onto Vinh Khanh Food Street if they are seeded outside maps bounds
  const getCoordinates = (r: Restaurant): [number, number] => {
    const lat = r.latitude;
    const lng = r.longitude;
    if (lat && lng && lat >= 10.7500 && lat <= 10.7650 && lng >= 106.6950 && lng <= 106.7150) {
      return [lat, lng];
    }
    // Specific logical fallbacks along Vinh Khanh street bounds for consistency
    if (r.id === 'oc_dao') return [10.7589, 106.7082];
    if (r.id === 'oc_oanh') return [10.7590, 106.7070];
    if (r.id === 'pho_quynh') return [10.7562, 106.7025];
    if (r.id === 'banh_mi_25') return [10.7578, 106.7042];
    return [10.7592, 106.7066];
  };

  const handleGeoLocate = () => {
    setLocationMode('real');
    setGpsNotification(true);
    setLocateTrigger(true);
    setTimeout(() => setLocateTrigger(false), 50);
    setTimeout(() => setGpsNotification(false), 2000);
  };

  const toggleDistanceRestaurant = (restaurantId: string) => {
    setDistanceRestaurantIds((current) => {
      if (current.includes(restaurantId)) {
        return current.filter((id) => id !== restaurantId);
      }
      if (current.length < 2) {
        return [...current, restaurantId];
      }
      return [current[1], restaurantId];
    });
  };

  const handleRestaurantSelection = (restaurant: Restaurant) => {
    if (isDistancePanelOpen) {
      toggleDistanceRestaurant(restaurant.id);
      return;
    }
    setSelectedRestaurant(restaurant);
  };

  const handleSheetDragStart = (event: PointerEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 768) return;
    sheetDragStartRef.current = { y: event.clientY, moved: false };
    setIsSheetDragging(true);
    setSheetDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSheetDragMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragStart = sheetDragStartRef.current;
    if (!dragStart) return;

    const deltaY = event.clientY - dragStart.y;
    if (Math.abs(deltaY) > 4) {
      dragStart.moved = true;
      event.preventDefault();
    }

    setSheetDragOffset(Math.max(-180, deltaY));
  };

  const handleSheetDragEnd = (event: PointerEvent<HTMLDivElement>) => {
    const dragStart = sheetDragStartRef.current;
    if (!dragStart) return;

    const deltaY = event.clientY - dragStart.y;
    sheetDragStartRef.current = null;
    setIsSheetDragging(false);
    setSheetDragOffset(0);

    if (deltaY > 120) {
      setSelectedRestaurant(null);
      return;
    }

    if (deltaY > 56 && sheetStage === 'expanded') {
      setSheetStage('peek');
      return;
    }

    if (deltaY < -56) {
      setSheetStage('expanded');
    }
  };

  const sheetStyle = {
    '--sheet-drag-offset': `${sheetDragOffset}px`
  } as CSSProperties;

  useEffect(() => {
    if (!searchSelection) return;

    const restaurant = restaurants.find((r) => r.id === searchSelection.restaurantId);
    if (restaurant) {
      handleRestaurantSelection(restaurant);
    }
  }, [restaurants, searchSelection]);

  const selectedCoords = selectedRestaurant ? getCoordinates(selectedRestaurant) : null;
  const getReviewImages = (review: { imageUrl?: string; imageUrls?: string[] }) =>
    review.imageUrls && review.imageUrls.length > 0
      ? review.imageUrls
      : review.imageUrl
        ? [review.imageUrl]
        : [];

  // Sort restaurants by distance from user's current location
  const nearbyRestaurants = useMemo(() => {
    return restaurants
      .map((r) => {
        const coords = getCoordinates(r);
        const dist = haversineDistance(userLocation[0], userLocation[1], coords[0], coords[1]);
        return { restaurant: r, distanceMeters: dist };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [restaurants, userLocation]);

  const distanceRestaurants = useMemo(
    () => restaurants
      .filter((restaurant) => restaurant.isActive !== false)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [restaurants]
  );

  const selectedDistanceRestaurants = useMemo(
    () => distanceRestaurantIds
      .map((id) => restaurants.find((restaurant) => restaurant.id === id))
      .filter((restaurant): restaurant is Restaurant => Boolean(restaurant)),
    [distanceRestaurantIds, restaurants]
  );

  const distancePositions = useMemo<[number, number][]>(
    () => selectedDistanceRestaurants.map((restaurant) => getCoordinates(restaurant)),
    [selectedDistanceRestaurants]
  );

  return (
    <div className="foodio-map-shell fixed inset-x-0 top-[72px] bottom-0 flex bg-[#f7efe4] overflow-hidden text-[#2c211b] z-40 transition-all duration-300">

      {/* Live Audio Narration Guide Overlay (Glassmorphism + mini player styling) */}
      {currentNarration && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-[#1a1a1a]/95 backdrop-blur-md border border-white/20 text-white p-4 shadow-2xl flex items-start gap-3.5 z-[1005] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-12 h-12 shrink-0 overflow-hidden border border-white/10 bg-white/5">
            <img 
              src={currentNarration.restaurant.image} 
              alt={currentNarration.restaurant.name} 
              className="w-full h-full object-cover grayscale brightness-90"
            />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-[8px] font-bold tracking-widest text-[#e2533b] bg-white/10 px-1.5 py-0.5 rounded-none uppercase select-none">
                  {t('map.narration_active', 'Audio Narration')}
                </span>
                <h4 className="font-serif italic font-bold text-xs text-white mt-1 truncate">
                  {currentNarration.restaurant.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => stopNarration()}
                className="text-white/60 hover:text-white transition-colors p-1 cursor-pointer"
              >
                <X size={14} strokeWidth={3} />
              </button>
            </div>
            <p className="font-sans text-[10px] leading-relaxed text-white/80 line-clamp-3 mt-1.5 font-light">
              {currentNarration.text}
            </p>
          </div>
        </div>
      )}
      <style>{`
        .leaflet-container {
          background-color: #f7efe4 !important;
          font-family: inherit;
        }
        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          70%, 100% { transform: scale(2.2); opacity: 0; }
        }
        .animate-ping {
          animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .info-panel {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: min(58dvh, 620px);
          max-height: 100%;
          border: 1px solid rgba(75, 54, 42, 0.12);
          border-bottom: none;
          border-radius: 28px 28px 0 0;
          box-shadow: 0 -24px 70px rgba(77, 49, 31, 0.18);
          transform: translateY(calc(100% + var(--sheet-drag-offset, 0px)));
          transition:
            height 0.32s cubic-bezier(0.32, 0.72, 0, 1),
            transform 0.42s cubic-bezier(0.32, 0.72, 0, 1),
            visibility 0.42s cubic-bezier(0.32, 0.72, 0, 1);
          z-index: 1005;
          visibility: hidden;
          will-change: height, transform;
        }
        .info-panel.open {
          transform: translateY(var(--sheet-drag-offset, 0px));
          visibility: visible;
        }
        .info-panel.expanded {
          height: 100%;
          max-height: 100%;
        }
        .info-panel.dragging {
          transition: none;
        }
        .info-panel.closed {
          transform: translateY(calc(100% + var(--sheet-drag-offset, 0px)));
          visibility: hidden;
        }
        .sheet-scroll {
          overscroll-behavior: contain;
        }
        .map-container-wrap {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (min-width: 768px) {
          .info-panel {
            top: 0;
            bottom: 0;
            left: 0;
            width: 30%;
            height: 100%;
            max-height: 100%;
            border: 1px solid rgba(75, 54, 42, 0.12);
            border-radius: 28px;
            margin: 16px 0 16px 16px;
            height: calc(100% - 32px);
            box-shadow: 0 24px 70px rgba(77, 49, 31, 0.18);
            transform: translateX(-100%);
          }
          .info-panel.open {
            transform: translateX(0);
          }
          .info-panel.expanded {
            height: calc(100% - 32px);
            max-height: calc(100% - 32px);
          }
          .info-panel.closed {
            transform: translateX(-100%);
          }
          .map-container-wrap {
            right: 0;
            left: auto;
            width: 100%;
          }
          .map-container-wrap.panel-open {
            width: 70%;
          }
        }

        /* ===== Nearby Restaurants Panel ===== */
        .nearby-panel {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 55dvh;
          max-height: 100%;
          border: 1px solid rgba(75, 54, 42, 0.12);
          border-bottom: none;
          border-radius: 28px 28px 0 0;
          box-shadow: 0 -24px 70px rgba(77, 49, 31, 0.18);
          transform: translateY(100%);
          transition:
            transform 0.42s cubic-bezier(0.32, 0.72, 0, 1),
            visibility 0.42s cubic-bezier(0.32, 0.72, 0, 1);
          z-index: 1004;
          visibility: hidden;
          will-change: transform;
          bottom: 0;
          top: auto;
        }
        .nearby-panel.nearby-open {
          transform: translateY(0);
          visibility: visible;
        }
        @media (min-width: 768px) {
          .nearby-panel {
            top: 0;
            bottom: 0;
            left: 0;
            width: 340px;
            height: calc(100% - 32px);
            max-height: calc(100% - 32px);
            border: 1px solid rgba(75, 54, 42, 0.12);
            border-radius: 28px;
            margin: 16px 0 16px 16px;
            box-shadow: 0 24px 70px rgba(77, 49, 31, 0.18);
            transform: translateX(calc(-100% - 16px));
          }
          .nearby-panel.nearby-open {
            transform: translateX(0);
          }
        }
        .nearby-card {
          transition: all 0.2s ease;
        }
        .nearby-card:hover {
          background-color: #f9f3ea;
          transform: translateX(4px);
        }
        .nearby-card:active {
          transform: scale(0.98);
        }
        @keyframes nearbyPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .nearby-rank-badge {
          animation: nearbyPulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* ===== Nearby Restaurants Panel ===== */}
      <aside
        className={`nearby-panel ${isNearbyOpen && !isOpen ? 'nearby-open' : ''} bg-[#fffaf4]/97 backdrop-blur-xl flex flex-col overflow-hidden`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#1a1a1a]/8 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#e2533b] flex items-center justify-center shadow-md">
              <Navigation size={14} className="text-white" />
            </div>
            <div>
              <h2 className="font-serif italic font-bold text-sm text-[#1a1a1a] leading-tight">
                {t('map.nearby_title', 'Quán gần bạn')}
              </h2>
              <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#1a1a1a]/45 font-bold mt-0.5">
                {nearbyRestaurants.length} {t('map.nearby_count_suffix', 'quán được tìm thấy')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsNearbyOpen(false)}
            className="w-8 h-8 flex items-center justify-center bg-white border border-[#1a1a1a]/15 text-[#1a1a1a] hover:bg-[#f9f7f2] hover:border-[#e2533b] hover:text-[#e2533b] active:scale-90 transition-all cursor-pointer shadow-sm"
          >
            <X size={14} strokeWidth={3} />
          </button>
        </div>

        {/* Scrollable Restaurant List */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-3 py-3 flex flex-col gap-2">
          {nearbyRestaurants.map(({ restaurant: r, distanceMeters }, index) => {
            const isActive = selectedRestaurant?.id === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  handleRestaurantSelection(r);
                  if (window.innerWidth < 768) setIsNearbyOpen(false);
                }}
                className={`nearby-card w-full flex items-center gap-3 p-2.5 rounded-2xl border text-left cursor-pointer ${
                  isActive
                    ? 'border-[#e2533b]/40 bg-[#e2533b]/5 shadow-md'
                    : 'border-[#1a1a1a]/6 bg-white/60 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Rank Badge */}
                <div className="relative shrink-0">
                  <div
                    className="w-14 h-14 rounded-xl bg-cover bg-center border border-[#1a1a1a]/10 shadow-inner"
                    style={{ backgroundImage: `url('${r.image}')` }}
                  />
                  <span className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-black shadow-md border border-white ${
                    index === 0
                      ? 'bg-[#e2533b] text-white nearby-rank-badge'
                      : index < 3
                        ? 'bg-[#b76548] text-white'
                        : 'bg-[#2c211b] text-white'
                  }`}>
                    {index + 1}
                  </span>
                </div>

                {/* Restaurant Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 className="font-serif italic font-bold text-xs text-[#1a1a1a] truncate leading-tight">
                      {r.name}
                    </h3>
                    {r.isVerified && (
                      <BadgeCheck size={12} className="shrink-0 fill-[#e2533b] text-white" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-[#1a1a1a]/50 bg-[#f9f7f2] border border-[#1a1a1a]/8 px-1.5 py-0.5">
                      {r.category}
                    </span>
                    <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-[#1a1a1a]/50 bg-[#f9f7f2] border border-[#1a1a1a]/8 px-1.5 py-0.5">
                      {r.priceRange}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="flex items-center gap-0.5">
                      <Star size={9} className="fill-[#e2533b] text-[#e2533b]" />
                      <span className="font-mono text-[9px] font-bold text-[#1a1a1a]">{r.rating}</span>
                    </span>
                    <span className="text-[#1a1a1a]/15">|</span>
                    <span className="flex items-center gap-0.5 text-[#e2533b]">
                      <MapPin size={9} />
                      <span className="font-mono text-[9px] font-bold">{formatDistance(distanceMeters)}</span>
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight size={16} className={`shrink-0 transition-colors ${
                  isActive ? 'text-[#e2533b]' : 'text-[#1a1a1a]/20'
                }`} />
              </button>
            );
          })}
        </div>
      </aside>

      {/* Left/Bottom Section: Google Maps-Style Responsive Details Panel */}
      <aside
        className={`info-panel ${isOpen ? 'open' : 'closed'} ${sheetStage === 'expanded' ? 'expanded' : ''} ${isSheetDragging ? 'dragging' : ''} bg-[#fffaf4]/95 flex flex-col overflow-hidden`}
        style={sheetStyle}
      >
        {/* Mobile bottom sheet drag handle */}
        <div
          onPointerDown={handleSheetDragStart}
          onPointerMove={handleSheetDragMove}
          onPointerUp={handleSheetDragEnd}
          onPointerCancel={handleSheetDragEnd}
          className="md:hidden flex justify-center py-3 shrink-0 bg-[#fdfcf9] border-b border-[#1a1a1a]/5 cursor-grab active:cursor-grabbing rounded-t-[16px] touch-none"
          aria-label="Drag restaurant details panel"
        >
          <div className="w-12 h-1 bg-[#1a1a1a]/20 rounded-full" />
        </div>

        {/* Scrollable Panel Content wrapper */}
        <div className="sheet-scroll flex-1 overflow-y-auto hide-scrollbar">
          {activeRestaurant && (
            <div className="w-full flex flex-col">
              {/* Header Banner Image */}
              <div
                className="relative w-full h-[180px] bg-cover bg-center border-b border-[#1a1a1a]/15"
                style={{ backgroundImage: `url('${activeRestaurant.image}')` }}
              >
                {/* Close Button overlay */}
                <button
                  type="button"
                  onClick={() => setSelectedRestaurant(null)}
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white border border-[#1a1a1a]/20 text-on-surface hover:bg-[#f9f7f2] active:scale-95 transition-all z-20 cursor-pointer shadow-sm"
                >
                  <X size={14} strokeWidth={3} />
                </button>
                <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-[#fdfcf9] to-transparent pointer-events-none" />
              </div>

              {/* Info details wrapper */}
              <div className="p-4 pb-28 md:pb-4 flex flex-col gap-4">

                {/* Header Title Section */}
                <div className="flex flex-col gap-1.5 text-left">
                  <span className="text-[8px] tracking-[0.25em] uppercase text-[#e2533b] font-extrabold block">STREET STALL SELECTION</span>
                  <div className="flex justify-between items-start gap-2">
                    <h2 className="font-serif italic font-bold text-lg text-[#1a1a1a] leading-none truncate">
                      {activeRestaurant.name}
                      {activeRestaurant.isVerified && (
                        <BadgeCheck size={15} className="ml-1 inline-block fill-[#e2533b] text-white select-none align-middle" />
                      )}
                    </h2>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <div className="flex items-center gap-0.5 bg-[#e2533b] text-white px-2 py-1 select-none">
                        <Star size={10} className="fill-white text-white" />
                        <span className="font-mono text-[10px] font-bold">{activeRestaurant.rating}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleSavedRestaurant(activeRestaurant.id)}
                        aria-label={savedRestaurantIds.includes(activeRestaurant.id)
                          ? t('detail.unsave_place', 'Bỏ lưu quán')
                          : t('detail.save_place', 'Lưu quán')}
                        title={savedRestaurantIds.includes(activeRestaurant.id)
                          ? t('detail.unsave_place', 'Bỏ lưu quán')
                          : t('detail.save_place', 'Lưu quán')}
                        className={`grid h-7 w-7 place-items-center border transition-all active:scale-90 cursor-pointer ${savedRestaurantIds.includes(activeRestaurant.id)
                          ? 'border-[#2c211b] bg-[#2c211b] text-white'
                          : 'border-[#4b362a]/20 bg-white text-[#2c211b] hover:border-[#e2533b] hover:text-[#e2533b]'
                          }`}
                      >
                        <Bookmark
                          size={13}
                          className={savedRestaurantIds.includes(activeRestaurant.id) ? 'fill-current' : ''}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-[8px] uppercase tracking-wider text-[#1a1a1a]/60 mt-1">
                    <span className="bg-[#f9f7f2] border border-[#1a1a1a]/10 px-2 py-0.5 font-bold text-[#1a1a1a]">{activeRestaurant.priceRange}</span>
                    <span className="bg-[#f9f7f2] border border-[#1a1a1a]/10 px-2 py-0.5 font-bold text-[#1a1a1a]">{activeRestaurant.category}</span>
                    <span className="flex items-center gap-0.5 text-[#e2533b] font-bold">
                      <MapPin size={10} className="text-[#e2533b]" />
                      {selectedRouteResult.status === 'loading'
                        ? t('map.distance_calculating')
                        : selectedRouteResult.status === 'ready' && selectedRouteResult.distanceMeters !== null
                          ? formatDistance(selectedRouteResult.distanceMeters)
                          : '—'}
                    </span>
                  </div>
                </div>

                {/* View Full Page Details CTA */}
                <button
                  type="button"
                  onClick={() => onSelectRestaurant(activeRestaurant.id)}
                  className="w-full flex items-center justify-center gap-1 bg-[#1a1a1a] hover:bg-[#e2533b] text-white py-3 px-4 rounded-none shadow-md active:scale-98 transition-all font-mono text-[9px] uppercase tracking-widest cursor-pointer"
                >
                  {t('map.view_full_info')}
                </button>

                <button
                  type="button"
                  onClick={() => onContactRestaurant(activeRestaurant.id)}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-[#f9f7f2] text-[#1a1a1a] py-3 px-4 rounded-none shadow-sm border-2 border-[#1a1a1a] active:scale-98 transition-all font-mono text-[9px] uppercase tracking-widest cursor-pointer"
                >
                  <MessageSquare size={15} />
                  {t('map.contact_restaurant')}
                </button>

                {/* Keep the restaurant audio guide available directly in the map details panel. */}
                <MultiLanguageAudioGuide
                  key={activeRestaurant.id}
                  title={`${activeRestaurant.name} audio guide`}
                  sourceText={activeRestaurant.description || `${activeRestaurant.name}. ${activeRestaurant.category} restaurant located at ${activeRestaurant.address}, ${activeRestaurant.area}. Recommended dishes include ${activeRestaurant.dishes.map((dish) => dish.name).slice(0, 3).join(', ') || 'local specialties'}.`}
                  defaultLang={i18n.language?.split('-')[0] || 'en'}
                  className="!rounded-none !p-3 !shadow-none"
                />

                {/* Address Card details */}
                <div className="flex flex-col gap-2.5 p-3 bg-[#f9f7f2] border border-[#1a1a1a]/15 text-[11px] text-[#1a1a1a] text-left">
                  <div className="flex items-start gap-2.5">
                    <Map size={16} className="text-[#e2533b] mt-0.5 select-none" />
                    <div>
                      <p className="font-bold leading-snug">{activeRestaurant.address}</p>
                      <p className="text-[#1a1a1a]/60 text-[9px] mt-0.5">{activeRestaurant.area}</p>
                    </div>
                  </div>
                  <hr className="border-[#1a1a1a]/10" />
                  <div className="flex items-start gap-2.5">
                    <Clock size={16} className="text-[#e2533b] mt-0.5 select-none" />
                    <p className="font-bold">
                      Open Now <span className="text-[#1a1a1a]/60 font-normal ml-1.5">{activeRestaurant.openingHours}</span>
                    </p>
                  </div>
                </div>

                {/* Dishes Preview Bento */}
                <div className="flex flex-col gap-2 text-left">
                  <h3 className="font-serif italic font-bold text-sm text-[#1a1a1a] border-b border-[#1a1a1a]/10 pb-1">Signature Dishes</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {activeRestaurant.dishes.map((dish) => (
                      <div
                        key={dish.id}
                        className="bg-white border border-[#1a1a1a]/10 rounded-none overflow-hidden shadow-xs flex items-center p-2 gap-2"
                      >
                        <div
                          className="h-12 w-12 bg-cover bg-center shrink-0 border border-[#1a1a1a]/15 grayscale hover:grayscale-0 transition-all"
                          style={{ backgroundImage: `url('${dish.image}')` }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif italic font-bold text-xs text-[#1a1a1a] truncate">{dish.name}</h4>
                          <p className="font-mono font-bold text-[#e2533b] text-[10px] mt-0.5">${dish.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Full review details, matching the restaurant detail page. */}
                <div className="flex flex-col gap-2 text-left pb-6">
                  <h3 className="font-serif italic font-bold text-sm text-[#1a1a1a] border-b border-[#1a1a1a]/10 pb-1">
                    {t('detail.foodie_reviews')}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {activeRestaurant.reviews.length === 0 && (
                      <div className="w-full py-5 text-center font-mono text-[9px] font-bold uppercase text-[#1a1a1a]/40">
                        {t('detail.no_reviews')}
                      </div>
                    )}
                    {activeRestaurant.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="relative flex flex-col gap-2.5 overflow-hidden rounded-none border border-[#4b362a]/10 bg-[#fffdf8] p-3.5 text-left shadow-[0_8px_24px_rgba(77,49,31,0.07)]"
                      >
                        <span className="pointer-events-none absolute right-2 top-2 select-none font-serif text-5xl font-black italic leading-none text-[#1a1a1a]/5">“</span>

                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-[#1a1a1a] font-mono text-[10px] font-bold text-white">
                            {rev.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-[10px] font-bold text-[#1a1a1a]">{rev.author}</p>
                            <p className="font-mono text-[8px] uppercase tracking-wider text-[#1a1a1a]/40">{rev.role}</p>
                          </div>
                          <div className="flex shrink-0 text-[#e2533b]">
                            {Array.from({ length: 5 }).map((_, starIndex) => (
                              <Star
                                key={starIndex}
                                size={10}
                                className={starIndex < Math.floor(rev.rating) ? 'fill-[#e2533b] text-[#e2533b]' : 'text-slate-300'}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="font-serif text-[11px] font-light italic leading-relaxed text-[#1a1a1a]/70">
                          "{rev.comment}"
                        </p>

                        {getReviewImages(rev).length > 0 && (
                          <div className="w-full overflow-hidden border border-[#1a1a1a]/10 bg-[#f9f7f2]">
                            <ImageGallery
                              images={getReviewImages(rev)}
                              alt={`${rev.author} review photos`}
                              className="h-32"
                            />
                          </div>
                        )}

                        {rev.ownerReply && (
                          <div className="mt-0.5 flex flex-col gap-1.5 border-l-2 border-[#b76548] bg-[#fffcf8] p-3 text-xs shadow-[0_2px_8px_rgba(77,49,31,0.04)]">
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1 font-mono text-[8px] font-bold uppercase tracking-wider text-[#b76548]">
                                <BadgeCheck size={10} className="fill-[#b76548] text-white" />
                                {t('review_form.owner_reply')}
                              </span>
                              {rev.ownerReplyCreatedAt && (
                                <span className="shrink-0 font-mono text-[7px] uppercase tracking-widest text-[#1a1a1a]/45">
                                  {new Date(rev.ownerReplyCreatedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p className="font-sans text-[10px] font-light italic leading-relaxed text-[#4c4038]">
                              "{rev.ownerReply}"
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Right Section: Map View Container */}
      <div
        className={`map-container-wrap ${selectedRestaurant ? 'panel-open' : ''} flex flex-col`}
      >
        {/* Real Leaflet Map — dynamic key ensures map remounts when default center changes */}
        <MapContainer
          key="vinh-khanh-map-stable-v3"
          center={VINH_KHANH_CENTER}
          zoom={MAP_ZOOM}
          maxBounds={MAX_BOUNDS}
          maxBoundsViscosity={1.0}
          className="w-full h-full z-10"
          zoomControl={false}
        >
          <MapViewUpdater center={VINH_KHANH_CENTER} zoom={MAP_ZOOM} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Render keyboard user walk Blue Dot location */}
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="font-mono text-[10px] text-center uppercase tracking-wider">
                <strong>{t('map.your_position')}</strong><br />
                {t('map.walk_instruction')}
              </div>
            </Popup>
          </Marker>

          {/* Render every backend restaurant marker regardless of active search text. */}
          {restaurants.map((restaurant) => {
            const coords = getCoordinates(restaurant);
            const isSelected = selectedRestaurant?.id === restaurant.id ||
              currentNarration?.restaurant.id === restaurant.id ||
              (isDistancePanelOpen && distanceRestaurantIds.includes(restaurant.id));

            return (
              <Marker
                key={restaurant.id}
                position={coords}
                icon={getRestaurantIcon(restaurant.category, isSelected)}
                eventHandlers={{
                  click: () => {
                    handleRestaurantSelection(restaurant);
                  }
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-serif italic font-bold leading-tight">{restaurant.name}</p>
                    <p className="text-[10px] text-[#1a1a1a]/60 mt-0.5">{restaurant.category} • {restaurant.rating}★</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Leaflet Routing Controller wrapper */}
          <RoutingControl
            userLocation={userLocation}
            destination={selectedCoords}
            onResult={setSelectedRouteResult}
          />

          {/* View Recenter handler */}
          <MapController
            userLocation={userLocation}
            selectedRestaurant={selectedRestaurant}
            locateTrigger={locateTrigger}
            getCoordinates={getCoordinates}
          />

          {isDistancePanelOpen && (
            <DistanceRoutingControl positions={distancePositions} onResult={setDistanceRouteResult} />
          )}
        </MapContainer>

        {/* Restaurant distance measurement panel */}
        {isDistancePanelOpen && (
          <section className="absolute bottom-24 left-4 right-20 z-[1002] flex max-h-[58dvh] flex-col overflow-hidden border-2 border-[#1a1a1a] bg-[#fffaf4]/97 shadow-[6px_6px_0px_0px_#1a1a1a] backdrop-blur-xl md:bottom-6 md:left-auto md:right-20 md:w-[370px] md:max-h-[calc(100%-3rem)]">
            <header className="flex shrink-0 items-center justify-between border-b-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 py-3 text-white">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center bg-[#e2533b]">
                  <Ruler size={16} />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-serif text-sm font-bold italic">{t('map.distance_title')}</h2>
                  <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-white/55">
                    {t('map.distance_instruction')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDistancePanelOpen(false)}
                aria-label={t('map.distance_close')}
                className="grid h-8 w-8 shrink-0 place-items-center border border-white/25 text-white transition-colors hover:border-[#e2533b] hover:bg-[#e2533b]"
              >
                <X size={15} strokeWidth={3} />
              </button>
            </header>

            <div className="shrink-0 border-b border-[#1a1a1a]/15 bg-[#f4eadf] p-3">
              <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
                {[0, 1].map((slot) => {
                  const restaurant = selectedDistanceRestaurants[slot];
                  return (
                    <div key={slot} className="flex min-h-16 min-w-0 items-center gap-2 border border-[#1a1a1a]/15 bg-white px-2.5 py-2">
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[10px] font-black ${restaurant ? 'bg-[#e2533b] text-white' : 'bg-[#1a1a1a]/10 text-[#1a1a1a]/40'}`}>
                        {slot + 1}
                      </span>
                      <span className={`line-clamp-2 text-[10px] font-bold leading-tight ${restaurant ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/35'}`}>
                        {restaurant?.name ?? t(`map.distance_select_${slot + 1}`)}
                      </span>
                    </div>
                  );
                }).reduce<ReactNode[]>((items, slot, index) => {
                  if (index > 0) items.push(<ArrowRight key={`arrow-${index}`} size={15} className="self-center text-[#e2533b]" />);
                  items.push(slot);
                  return items;
                }, [])}
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-[#1a1a1a]/45">
                    {t('map.distance_result')}
                  </p>
                  <p className={`font-serif text-2xl font-black italic leading-none ${distanceRouteResult.status === 'ready' ? 'text-[#e2533b]' : 'text-[#1a1a1a]/25'}`}>
                    {distanceRouteResult.status === 'loading'
                      ? t('map.distance_calculating')
                      : distanceRouteResult.status === 'error'
                        ? t('map.distance_error')
                        : distanceRouteResult.distanceMeters === null
                          ? '—'
                          : formatDistance(distanceRouteResult.distanceMeters)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDistanceRestaurantIds([])}
                  disabled={distanceRestaurantIds.length === 0}
                  className="flex items-center gap-1.5 border border-[#1a1a1a]/20 bg-white px-2.5 py-2 font-mono text-[8px] font-bold uppercase tracking-wider transition-colors hover:border-[#e2533b] hover:text-[#e2533b] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <RotateCcw size={11} /> {t('map.distance_clear')}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 hide-scrollbar">
              <div className="flex flex-col gap-2">
                {distanceRestaurants.map((restaurant) => {
                  const selectedIndex = distanceRestaurantIds.indexOf(restaurant.id);
                  const isSelectedForDistance = selectedIndex >= 0;
                  return (
                    <button
                      key={restaurant.id}
                      type="button"
                      onClick={() => toggleDistanceRestaurant(restaurant.id)}
                      className={`flex w-full items-center gap-3 border p-2 text-left transition-all active:scale-[0.99] ${isSelectedForDistance ? 'border-[#e2533b] bg-[#fff1ec] shadow-sm' : 'border-[#1a1a1a]/10 bg-white hover:border-[#1a1a1a]/35'}`}
                    >
                      <div
                        className="h-11 w-11 shrink-0 border border-[#1a1a1a]/10 bg-cover bg-center"
                        style={{ backgroundImage: `url('${restaurant.image}')` }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif text-xs font-bold italic text-[#1a1a1a]">{restaurant.name}</p>
                        <p className="mt-0.5 truncate text-[9px] text-[#1a1a1a]/50">{restaurant.address}</p>
                      </div>
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border font-mono text-[10px] font-black ${isSelectedForDistance ? 'border-[#e2533b] bg-[#e2533b] text-white' : 'border-[#1a1a1a]/20 text-[#1a1a1a]/25'}`}>
                        {isSelectedForDistance ? selectedIndex + 1 : <Check size={12} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Live GPS Tracker Notification Popup */}
        {gpsNotification && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#e2533b] text-white font-mono text-[9px] uppercase tracking-wider px-3.5 py-2.5 rounded-none shadow-lg z-[1000] border border-white/15 animate-bounce">
            {t('map.gps_toast')}
          </div>
        )}

        {/* Bottom Right Controls (Narration, Mode Toggle, GPS Locator) & Tour Card overlay */}
        <div className="absolute bottom-24 md:bottom-6 left-0 w-full px-4 z-[1000] pointer-events-none flex flex-col items-end gap-3">
          <div className="flex flex-col gap-2.5">
            {/* Narration Mute/Unmute */}
            <button
              type="button"
              onClick={toggleMute}
              title={isAudioMuted ? t('map.narration_unmuted', 'Enable Audio Guide') : t('map.narration_muted', 'Disable Audio Guide')}
              className={`w-12 h-12 ${isAudioMuted ? 'bg-[#e2533b] text-white border-[#e2533b] hover:bg-[#e2533b]/90' : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-[#f9f7f2]'} rounded-none shadow-xl flex items-center justify-center border-2 active:scale-90 transition-all pointer-events-auto cursor-pointer`}
            >
              {isAudioMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
            </button>

            {/* Nearby Restaurants Panel Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsNearbyOpen((current) => {
                  const willOpen = !current;
                  if (willOpen) setIsDistancePanelOpen(false);
                  return willOpen;
                });
                if (isOpen) setSelectedRestaurant(null);
              }}
              title={t('map.nearby_toggle', 'Quán gần đây')}
              className={`w-12 h-12 ${isNearbyOpen ? 'bg-[#e2533b] text-white border-[#e2533b] hover:bg-[#c9412f]' : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-[#f9f7f2]'} rounded-none shadow-xl flex items-center justify-center border-2 active:scale-90 transition-all pointer-events-auto cursor-pointer`}
            >
              <ListOrdered size={22} />
            </button>

            {/* Tracking Mode Switcher */}
            <button
              type="button"
              onClick={toggleLocationMode}
              title={locationMode === 'real' ? t('map.mode_walk', 'Switch to Walk Mode') : t('map.mode_gps', 'Switch to GPS Mode')}
              className={`w-12 h-12 ${locationMode === 'real' ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] hover:bg-black' : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-[#f9f7f2]'} rounded-none shadow-xl flex items-center justify-center border-2 active:scale-90 transition-all pointer-events-auto cursor-pointer`}
            >
              {locationMode === 'real' ? <Compass size={22} /> : <Keyboard size={22} />}
            </button>

            {/* GPS Recenter View */}
            <button
              type="button"
              onClick={handleGeoLocate}
              aria-label="Align camera to current location"
              className="w-12 h-12 bg-white text-[#1a1a1a] hover:text-[#e2533b] rounded-none shadow-xl flex items-center justify-center border-2 border-[#1a1a1a] hover:bg-[#f9f7f2] active:scale-90 transition-all pointer-events-auto cursor-pointer group"
            >
              <LocateFixed size={22} className="group-hover:scale-110 transition-transform" />
            </button>

            {/* Restaurant distance measurement */}
            <button
              type="button"
              onClick={() => {
                setIsDistancePanelOpen((current) => {
                  const willOpen = !current;
                  if (willOpen) {
                    setIsNearbyOpen(false);
                    setSelectedRestaurant(null);
                  }
                  return willOpen;
                });
              }}
              title={t('map.distance_tool')}
              aria-label={t('map.distance_tool')}
              className={`h-12 w-12 border-2 shadow-xl flex items-center justify-center transition-all active:scale-90 pointer-events-auto cursor-pointer ${isDistancePanelOpen ? 'border-[#e2533b] bg-[#e2533b] text-white hover:bg-[#c9412f]' : 'border-[#1a1a1a] bg-white text-[#1a1a1a] hover:bg-[#f9f7f2] hover:text-[#e2533b]'}`}
            >
              <Ruler size={22} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
