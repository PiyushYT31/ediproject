import { DEFAULT_RADIUS_KM } from "@/src/constants";

/**
 * Geofencing & Mapping Logic for WorkSphere
 * Ensures search results are restricted to a 5-10km radius.
 */

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isWithinRadius(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  radiusKm: number = DEFAULT_RADIUS_KM
): boolean {
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon);
  return distance <= radiusKm;
}

export function filterByRadius<T extends { location?: { latitude: number; longitude: number } }>(
  items: T[],
  userLat: number,
  userLon: number,
  radiusKm: number = DEFAULT_RADIUS_KM
): T[] {
  return items.filter((item) => {
    if (!item.location) return true; // Include items without location (e.g., remote workers)
    return isWithinRadius(userLat, userLon, item.location.latitude, item.location.longitude, radiusKm);
  });
}
