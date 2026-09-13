import { create } from 'zustand';
import { Category, Vendor } from '../types/models';
import { CategoryService, VendorService } from '../services';

interface AppState {
  city: string;
  categories: Category[];
  popularVendors: Vendor[];
  nearbyVendors: Vendor[];
  loadingHome: boolean;
  /** Set when the home feed fails (dead backend) — screens show retry UI. */
  homeError: string | null;
  recentSearches: string[];
  loadHome: () => Promise<boolean>;
  pushRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  setCity: (city: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  city: 'Shegaon',
  categories: [],
  popularVendors: [],
  nearbyVendors: [],
  loadingHome: true,
  homeError: null,
  recentSearches: ['Cooler repair', 'Electrician', 'Dentist'],
  loadHome: async () => {
    set({ loadingHome: true });
    try {
      const [categories, page] = await Promise.all([CategoryService.list(), VendorService.list({ page: 0 })]);
      const sorted = [...page.items];
      const popular = [...sorted].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8);
      const nearby = [...sorted].sort((a, b) => (a.distanceKm ?? 9) - (b.distanceKm ?? 9)).slice(0, 8);
      set({ categories, popularVendors: popular, nearbyVendors: nearby, homeError: null });
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

