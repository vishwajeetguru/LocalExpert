import { create } from 'zustand';

export interface OnboardDraft {
  categoryId: string;
  businessName: string;
  description: string;
  servicesOffered: string[];
  phone: string;
  email: string;
  address: string;
  area: string;
  homeVisitAvailable: boolean;
  photos: string[];
  /** Captured shop GPS (optional, improves distance ranking). */
  lat: number | null;
  lng: number | null;
}

interface OnboardState extends OnboardDraft {
  set: (patch: Partial<OnboardDraft>) => void;
  toggleService: (s: string) => void;
  reset: () => void;
}

const initial: OnboardDraft = {
  categoryId: '',
  businessName: '',
  description: '',
  servicesOffered: [],
  phone: '',
  email: '',
  address: '',
  area: '',
  homeVisitAvailable: true,
  photos: [],
  lat: null,
  lng: null,
};

export const useOnboardStore = create<OnboardState>((set) => ({
  ...initial,
  set: (patch) => set(patch),
  toggleService: (s) =>
    set((st) => ({
      servicesOffered: st.servicesOffered.includes(s)
        ? st.servicesOffered.filter((x) => x !== s)
        : [...st.servicesOffered, s],
    })),
  reset: () => set(initial),
}));
