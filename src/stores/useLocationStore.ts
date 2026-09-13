import { create } from 'zustand';
import * as Location from 'expo-location';

export interface LatLng {
  lat: number;
  lng: number;
}

type LocStatus = 'unknown' | 'requesting' | 'granted' | 'denied';

interface LocationState {
  coords: LatLng | null;
  place: string | null;
  status: LocStatus;
  error: string | null;
  /** Ask for foreground permission (never called at launch) and capture GPS. */
  request: () => Promise<LatLng | null>;
  /** One-shot capture for vendor forms. Returns coords or throws. */
  captureOnce: () => Promise<LatLng>;
  deny: () => void;
  clear: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  coords: null,
  place: null,
  status: 'unknown',
  error: null,

  request: async () => {
    set({ status: 'requesting', error: null });
    try {
      const existing = await Location.getForegroundPermissionsAsync();
      let granted = existing.granted;
      if (!granted && existing.canAskAgain) {
        const asked = await Location.requestForegroundPermissionsAsync();
        granted = asked.granted;
      }
      if (!granted) {
        set({ status: 'denied' });
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      let place: string | null = null;
      try {
        const [rev] = await Location.reverseGeocodeAsync({ latitude: coords.lat, longitude: coords.lng });
        place = rev?.city ?? rev?.district ?? rev?.subregion ?? null;
      } catch {
        // reverse-geocode is best-effort; GPS still counts.
      }
      set({ coords, place, status: 'granted' });
      return coords;
    } catch (e) {
      set({ status: 'denied', error: e instanceof Error ? e.message : 'Location failed.' });
      return null;
    }
  },

  captureOnce: async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) throw new Error('Location permission denied.');
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  },

  deny: () => set({ status: 'denied' }),
  clear: () => set({ coords: null, place: null, status: 'unknown', error: null }),
}));
