import { create } from 'zustand';
import { Category, Vendor } from '../types/models';
import { CategoryService, VendorService } from '../services';

interface AppState {
  city: string;
  categories: Category[];
  popularVendors: Vendor[];
  loadingHome: boolean;
  /** Set when the home feed fails (dead backend) — screens show retry UI. */
  homeError: string | null;
  recentSearches: string[];
  loadHome: (coords?: { lat: number; lng: number } | null) => Promise<boolean>;
  pushRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  setCity: (city: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  city: 'Shegaon',
  categories: [],
  popularVendors: [],
  loadingHome: true,
  homeError: null,
  recentSearches: ['Cooler repair', 'Electrician', 'Dentist'],
  loadHome: async (coords) => {
    set({ loadingHome: true });
    try {
      // GPS → server recomputes distanceKm live per vendor (haversine);
      // without it the stored seed distances are used.
      const [categories, page] = await Promise.all([
        CategoryService.list(),
        VendorService.list({ page: 0, ...(coords ? { lat: coords.lat, lng: coords.lng } : {}) }),
      ]);
      // Nearby is computed live on Home with true GPS distance (vendorKm) —
      // the static distanceKm sort used to live here but nothing reads it.
      const popular = [...page.items].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8);
      set({ categories, popularVendors: popular, homeError: null });
      return true;
    } catch (e) {
      set({ homeError: e instanceof Error ? e.message : 'Something went wrong.' });
      return false;
    } finally {
      set({ loadingHome: false });
    }
  },
  pushRecentSearch: (q) => {
    const query = q.trim();
    if (!query) return;
    const list = [query, ...get().recentSearches.filter((s) => s.toLowerCase() !== query.toLowerCase())].slice(0, 8);
    set({ recentSearches: list });
  },
  clearRecentSearches: () => set({ recentSearches: [] }),
  setCity: (city) => set({ city }),
}));

