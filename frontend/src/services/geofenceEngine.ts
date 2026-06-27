import { Restaurant } from '../types';
import { UserPosition } from './locationService';

let pendingPOI: { id: string; enteredAt: number } | null = null;
const cooldowns: Record<string, number> = {};
const DEFAULT_GEOFENCE_RADIUS_METERS = 30;
const GEOFENCE_RADIUS_BUFFER_METERS = 15;

export function getCoordinates(r: Restaurant): [number, number] {
  const lat = r.latitude;
  const lng = r.longitude;
  if (lat && lng && lat >= 10.7500 && lat <= 10.7650 && lng >= 106.6950 && lng <= 106.7150) {
    return [lat, lng];
  }
  if (r.id === 'oc_dao') return [10.7589, 106.7082];
  if (r.id === 'oc_oanh') return [10.7590, 106.7070];
  if (r.id === 'pho_quynh') return [10.7562, 106.7025];
  if (r.id === 'banh_mi_25') return [10.7578, 106.7042];
  return [10.7592, 106.7066];
}

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export function checkGeofences(position: UserPosition, restaurants: Restaurant[]): Restaurant | null {
  const now = Date.now();

  const candidates = restaurants
    .map((r) => {
      const coords = getCoordinates(r);
      const dist = calculateHaversineDistance(position.lat, position.lng, coords[0], coords[1]);
      const baseRadius = r.geofenceRadiusMeters || DEFAULT_GEOFENCE_RADIUS_METERS;
      const radius = baseRadius + GEOFENCE_RADIUS_BUFFER_METERS;
      const inBounds = dist <= radius;
      const isOnCooldown = cooldowns[r.id] && now < cooldowns[r.id];
      return { restaurant: r, distance: dist, inBounds, isOnCooldown };
    })
    .filter((item) => item.inBounds && !item.isOnCooldown);

  if (candidates.length === 0) {
    pendingPOI = null;
    return null;
  }

  // Resolve tie breaks
  // 1. Audio Priority desc
  // 2. Distance asc
  // 3. Rating desc
  candidates.sort((a, b) => {
    const prioA = a.restaurant.audioPriority || 0;
    const prioB = b.restaurant.audioPriority || 0;
    if (prioB !== prioA) {
      return prioB - prioA;
    }
    if (a.distance !== b.distance) {
      return a.distance - b.distance;
    }
    const ratA = a.restaurant.rating || 0;
    const ratB = b.restaurant.rating || 0;
    return ratB - ratA;
  });

  const best = candidates[0].restaurant;

  if (pendingPOI === null || pendingPOI.id !== best.id) {
    pendingPOI = { id: best.id, enteredAt: now };
    return null;
  }

  if (now - pendingPOI.enteredAt >= 3000) {
    // Confirmed entry!
    cooldowns[best.id] = now + 5 * 60 * 1000; // 5-minute cooldown
    pendingPOI = null;
    return best;
  }

  return null;
}

export function resetCooldown(restaurantId: string) {
  delete cooldowns[restaurantId];
}

export function clear() {
  pendingPOI = null;
  for (const key in cooldowns) {
    delete cooldowns[key];
  }
}
