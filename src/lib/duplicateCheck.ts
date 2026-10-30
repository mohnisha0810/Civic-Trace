import { Complaint, ComplaintCategory } from '../types';

const EARTH_RADIUS_METERS = 6371000;

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

export interface DuplicateCheckResult {
  hasDuplicate: boolean;
  duplicateComplaint?: Complaint;
  distanceMeters?: number;
}

/**
 * Checks if an active complaint exists within 50 meters in the same category.
 */
export function checkDuplicateComplaint(
  latitude: number,
  longitude: number,
  category: ComplaintCategory,
  existingComplaints: Complaint[],
  excludeId?: string
): DuplicateCheckResult {
  for (const c of existingComplaints) {
    if (excludeId && c.id === excludeId) continue;
    if (c.status === 'verified' || c.status === 'rejected') continue;
    if (c.category !== category) continue;

    const dist = calculateDistanceMeters(latitude, longitude, c.latitude, c.longitude);
    if (dist <= 50) {
      return {
        hasDuplicate: true,
        duplicateComplaint: c,
        distanceMeters: Math.round(dist * 10) / 10,
      };
    }
  }

  return { hasDuplicate: false };
}
