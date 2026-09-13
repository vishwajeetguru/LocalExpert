import { LatLng } from '../stores/useLocationStore';
import { Vendor } from '../types/models';

const EARTH_KM = 6371;

/** Great-circle distance between two GPS points. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const h = s1 * s1 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * s2 * s2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

/** Live GPS distance when available, otherwise the stored estimate. */
export function vendorKm(vendor: Vendor, user: LatLng | null): number | undefined {
  const g = vendor.location.geo;
  if (user && g && typeof g.lat === 'number' && typeof g.lng === 'number') {
    return Math.round(haversineKm(user, g) * 10) / 10;
  }
  return vendor.distanceKm;
}

export function formatKm(km: number | undefined): string {
  if (km === undefined) return '';
  if (km < 1) return `${Math.max(50, Math.round(km * 1000))} m`;
  return `${km.toFixed(1)} km`;
}
