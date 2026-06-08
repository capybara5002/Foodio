/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';

import { Restaurant } from '../types';
import { X, BadgeCheck, Star, MapPin, Map, Clock, LocateFixed, Flame, ArrowRight, MessageSquare } from 'lucide-react';

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
  searchSelection: { restaurantId: string; requestId: number } | null;
}

// Coordinate constraints for Vinh Khanh Food Street
const VINH_KHANH_CENTER: [number, number] = [10.7580, 106.7020];
const MAP_ZOOM = 16;
const SW_BOUNDS: [number, number] = [10.7500, 106.6950];
const NE_BOUNDS: [number, number] = [10.7650, 106.7150];
const MAX_BOUNDS = L.latLngBounds(SW_BOUNDS, NE_BOUNDS);

// Custom teardrop pin shape for food stalls
const getIconSvg = (category: string, size: number) => {
  if (category.toLowerCase() === 'seafood') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-fish" style="transform: rotate(-45deg);"><path d="M2 16c.8-1 2-2.2 3.5-3 1.7.5 3.5.8 5.2.8 3.7 0 7.3-1.7 9.8-4.7L22 7l-1.9 1.2a15.7 15.7 0 0 1-9.8 3.5c-1.8 0-3.5-.3-5.2-.8-1.5-.8-2.7-2-3.5-3L2 6v10Z"/><path d="M16 8h.01"/><path d="M12 3h.01"/><path d="M22 17c-.8-1.2-2.2-2-3.5-2"/></svg>`;
  } else {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flame" style="transform: rotate(-45deg);"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
  }
};

const getRestaurantIcon = (category: string, isSelected: boolean) => {
  const bgColor = isSelected ? '#e2533b' : '#334155';
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
      <div class="animate-ping" style="position: absolute; width: 24px; height: 24px; background-color: #3b82f6; border-radius: 50%; opacity: 0.45;"></div>
      <div style="position: relative; width: 14px; height: 14px; background-color: #2563eb; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.35);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Helper component to add and remove leaflet-routing-machine controls dynamically
interface RoutingControlProps {
  userLocation: [number, number];
  destination: [number, number] | null;
}

function RoutingControl({ userLocation, destination }: RoutingControlProps) {
  const map = useMap();
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    if (!destination) return;

    try {
      const routingControl = (L as any).Routing.control({
        waypoints: [
          L.latLng(userLocation[0], userLocation[1]),
          L.latLng(destination[0], destination[1])
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        fitSelectedRoutes: false,
        showAlternatives: false,
        createMarker: () => null,
        lineOptions: {
          styles: [{ color: '#e2533b', weight: 6, opacity: 0.85 }]
        }
      }).addTo(map);

      const container = routingControl.getContainer();
      if (container) {
        container.style.display = 'none';
      }

      routingControlRef.current = routingControl;
    } catch (err) {
      console.error("Leaflet routing control initialization failed:", err);
    }

    return () => {
      if (map && routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [map, userLocation, destination]);

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
      const bounds = L.latLngBounds([userLocation[0], userLocation[1]], coords);

      const wasNull = prevSelectedRef.current === null;
      prevSelectedRef.current = selectedRestaurant;

      const performFitBounds = () => {
        map.invalidateSize();

        const isMobile = window.innerWidth < 768;
        // Shift visible center upward on mobile bottom sheet (50vh bottom padding)
        const paddingBottom = isMobile ? Math.floor(window.innerHeight * 0.5) + 40 : 80;

        map.fitBounds(bounds, {
          paddingTopLeft: [80, 80],
          paddingBottomRight: [80, paddingBottom],
          maxZoom: 17,
          animate: true,
          duration: 0.8
        });
      };

      if (wasNull && window.innerWidth >= 768) {
        // Desktop transition width (100% -> 70%) takes 300ms. Delay fitBounds until map resizing finishes.
        const timer = setTimeout(() => {
          performFitBounds();
        }, 300);
        return () => clearTimeout(timer);
      } else {
        // Fit immediately when selecting a restaurant on mobile
        performFitBounds();
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
    // NOTE: userLocation intentionally excluded — arrow-key walking must NOT re-trigger fitBounds.
    // fitBounds should only fire when selectedRestaurant changes (marker click / close).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurant, map, getCoordinates]);

  return null;
}

export default function PageMap({ restaurants, onSelectRestaurant, onSelectTour, onContactRestaurant, searchSelection }: PageMapProps) {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [locateTrigger, setLocateTrigger] = useState(false);
  const [gpsNotification, setGpsNotification] = useState(false);

  // Transition state for smooth sliding animations
  const [activeRestaurant, setActiveRestaurant] = useState<Restaurant | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (selectedRestaurant) {
      setActiveRestaurant(selectedRestaurant);
      setIsOpen(true);
    } else {
      setIsOpen(false);
      const timer = setTimeout(() => {
        setActiveRestaurant(null);
      }, 300); // Wait for transition duration (300ms) before unmounting content
      return () => clearTimeout(timer);
    }
  }, [selectedRestaurant]);

  // Keyboard movement state
  const [userLocation, setUserLocation] = useState<[number, number]>(VINH_KHANH_CENTER);

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

  // Listen to keyboard arrow key movements
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault(); // Prevent standard page scroll behavior
      }

      setUserLocation((prev) => {
        let [lat, lng] = prev;
        const delta = 0.00015;

        switch (e.key) {
          case 'ArrowUp':
            lat += delta;
            break;
          case 'ArrowDown':
            lat -= delta;
            break;
          case 'ArrowLeft':
            lng -= delta;
            break;
          case 'ArrowRight':
            lng += delta;
            break;
          default:
            return prev;
        }

        // Lock boundaries [10.7500, 106.6950] (SW) to [10.7650, 106.7150] (NE)
        lat = Math.max(10.7500, Math.min(10.7650, lat));
        lng = Math.max(106.6950, Math.min(106.7150, lng));

        return [lat, lng];
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
    setGpsNotification(true);
    setLocateTrigger(true);
    setTimeout(() => setLocateTrigger(false), 50);
    setTimeout(() => setGpsNotification(false), 2000);
  };

  const handleRestaurantSelection = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  useEffect(() => {
    if (!searchSelection) return;

    const restaurant = restaurants.find((r) => r.id === searchSelection.restaurantId);
    if (restaurant) {
      handleRestaurantSelection(restaurant);
    }
  }, [restaurants, searchSelection]);

  const selectedCoords = selectedRestaurant ? getCoordinates(selectedRestaurant) : null;

  return (
    <div className="fixed inset-x-0 bottom-0 top-[72px] bottom-16 md:bottom-0 flex bg-[#fdfcf9] overflow-hidden text-[#1a1a1a] z-40 transition-all duration-300">

      <style>{`
        .leaflet-container {
          background-color: #fcfbfa !important;
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
          height: 50vh;
          max-height: 50vh;
          border-top: 2px solid #1a1a1a;
          border-radius: 16px 16px 0 0;
          box-shadow: 0 -10px 25px -5px rgba(0, 0, 0, 0.1), 0 -8px 10px -6px rgba(0, 0, 0, 0.1);
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.3s ease-in-out;
          z-index: 1005;
          visibility: hidden;
        }
        .info-panel.open {
          transform: translateY(0);
          visibility: visible;
        }
        .info-panel.closed {
          transform: translateY(100%);
          visibility: hidden;
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
            border-top: none;
            border-right: 2px solid #1a1a1a;
            border-radius: 0;
            box-shadow: 10px 0 25px -5px rgba(0, 0, 0, 0.1), 8px 0 10px -6px rgba(0, 0, 0, 0.1);
            transform: translateX(-100%);
          }
          .info-panel.open {
            transform: translateX(0);
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
      `}</style>

      {/* Left/Bottom Section: Google Maps-Style Responsive Details Panel */}
      <aside className={`info-panel ${isOpen ? 'open' : 'closed'} bg-[#fdfcf9] flex flex-col`}>
        {/* Mobile bottom sheet drag handle */}
        <div
          onClick={() => setSelectedRestaurant(null)}
          className="md:hidden flex justify-center py-3 shrink-0 bg-[#fdfcf9] border-b border-[#1a1a1a]/5 cursor-pointer rounded-t-[16px]"
        >
          <div className="w-12 h-1 bg-[#1a1a1a]/20 rounded-full" />
        </div>

        {/* Scrollable Panel Content wrapper */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
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
              <div className="p-4 flex flex-col gap-4">

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
                    <div className="flex items-center gap-0.5 bg-[#e2533b] text-white px-2 py-0.5 shrink-0 select-none">
                      <Star size={10} className="fill-white text-white" />
                      <span className="font-mono text-[10px] font-bold">{activeRestaurant.rating}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-[8px] uppercase tracking-wider text-[#1a1a1a]/60 mt-1">
                    <span className="bg-[#f9f7f2] border border-[#1a1a1a]/10 px-2 py-0.5 font-bold text-[#1a1a1a]">{activeRestaurant.priceRange}</span>
                    <span className="bg-[#f9f7f2] border border-[#1a1a1a]/10 px-2 py-0.5 font-bold text-[#1a1a1a]">{activeRestaurant.category}</span>
                    <span className="flex items-center gap-0.5 text-[#e2533b] font-bold">
                      <MapPin size={10} className="text-[#e2533b]" />
                      {activeRestaurant.distance}
                    </span>
                  </div>
                </div>

                {/* View Full Page Details CTA */}
                <button
                  type="button"
                  onClick={() => onSelectRestaurant(activeRestaurant.id)}
                  className="w-full flex items-center justify-center gap-1 bg-[#1a1a1a] hover:bg-[#e2533b] text-white py-3 px-4 rounded-none shadow-md active:scale-98 transition-all font-mono text-[9px] uppercase tracking-widest cursor-pointer"
                >
                  View Full Info & Book // 🔗
                </button>

                <button
                  type="button"
                  onClick={() => onContactRestaurant(activeRestaurant.id)}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-[#f9f7f2] text-[#1a1a1a] py-3 px-4 rounded-none shadow-sm border-2 border-[#1a1a1a] active:scale-98 transition-all font-mono text-[9px] uppercase tracking-widest cursor-pointer"
                >
                  <MessageSquare size={15} />
                  Liên hệ quán
                </button>

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

                {/* Reviews Preview list */}
                <div className="flex flex-col gap-2 text-left pb-6">
                  <h3 className="font-serif italic font-bold text-sm text-[#1a1a1a] border-b border-[#1a1a1a]/10 pb-1">Reviews</h3>
                  <div className="flex flex-col gap-2">
                    {activeRestaurant.reviews.slice(0, 2).map((rev) => (
                      <div
                        key={rev.id}
                        className="bg-white p-2.5 rounded-none border border-[#1a1a1a]/10 relative text-left"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center font-mono font-bold text-[10px] select-none">
                            {rev.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[10px] text-[#1a1a1a] truncate">{rev.author}</p>
                            <p className="font-mono text-[8px] uppercase tracking-wider text-[#1a1a1a]/40">{rev.role}</p>
                          </div>
                        </div>
                        <p className="font-serif italic text-[10px] text-[#1a1a1a]/70 leading-relaxed font-light mt-1.5">
                          "{rev.comment}"
                        </p>
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
                <strong>Your Position</strong><br />
                Walk with Arrow Keys
              </div>
            </Popup>
          </Marker>

          {/* Render every backend restaurant marker regardless of active search text. */}
          {restaurants.map((restaurant) => {
            const coords = getCoordinates(restaurant);
            const isSelected = selectedRestaurant?.id === restaurant.id;

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
          <RoutingControl userLocation={userLocation} destination={selectedCoords} />

          {/* View Recenter handler */}
          <MapController
            userLocation={userLocation}
            selectedRestaurant={selectedRestaurant}
            locateTrigger={locateTrigger}
            getCoordinates={getCoordinates}
          />
        </MapContainer>

        {/* Live GPS Tracker Notification Popup */}
        {gpsNotification && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#e2533b] text-white font-mono text-[9px] uppercase tracking-wider px-3.5 py-2.5 rounded-none shadow-lg z-[1000] border border-white/15 animate-bounce">
            🎯 Recycled tracking on Vinh Khanh street...
          </div>
        )}

        {/* Bottom Left GPS control button & Tour Card overlay */}
        <div className="absolute bottom-6 left-0 w-full px-4 z-[1000] pointer-events-none flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={handleGeoLocate}
            aria-label="Align camera to current GPS location"
            className="w-12 h-12 bg-white text-[#1a1a1a] hover:text-[#e2533b] rounded-none shadow-xl flex items-center justify-center border-2 border-[#1a1a1a] hover:bg-[#f9f7f2] active:scale-90 transition-all pointer-events-auto cursor-pointer group"
          >
            <LocateFixed size={24} className="group-hover:scale-110 transition-transform" />
          </button>

          <div
            onClick={onSelectTour}
            className="w-full md:w-[380px] self-start md:self-end bg-white rounded-none p-3 shadow-xl border-2 border-[#1a1a1a] pointer-events-auto flex items-center gap-3 transform transition-transform hover:-translate-y-1 cursor-pointer"
          >
            <div
              className="w-16 h-16 rounded-none bg-cover bg-center shrink-0 border border-[#1a1a1a]/15 grayscale"
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBDjvGT6gPlZtXxuECzVxFZA8EEO6irjnnzNm5dhbe_NgWa3EeWsxrWIIABSP3XyA3AbrFQAcGEqIzhi9lKRnwGi034jy7uRSUQnjW6xBD1rrw_Uhe0CEF3qcPN_rno8GRzuVlD_sMExHBf5wQMGp5p6gBf1D5b1LmHi4frvclFfTPXEPz4UNk8BqaFVDrKmZ8uP51ERO88KQb-E2iqOYYwZy8oztX-MBx4M-EjtaSzoQaPOyZGRzc2OX8WB7ksMcxEzPKr2c09xA')" }}
            />
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5 mb-1 text-[9px] select-none font-semibold">
                <span className="px-1.5 py-0.5 bg-[#e2533b] text-white rounded-none font-mono uppercase tracking-wider text-[8px]">Curated</span>
                <span className="flex items-center text-[#e2533b] font-mono uppercase tracking-wider text-[8px] font-extrabold">
                  <Flame size={11} className="mr-1 inline-block align-middle fill-current" />Hot
                </span>
              </div>
              <h3 className="font-serif italic font-bold text-sm text-[#1a1a1a] mb-0.5 truncate">Vinh Khanh Night Tour</h3>
              <p className="font-sans font-light text-[11px] text-[#1a1a1a]/60 truncate">5 stops • Guided local tasting</p>
            </div>
            <button
              type="button"
              className="w-8 h-8 rounded-none bg-[#1a1a1a] hover:bg-[#e2533b] text-white flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
