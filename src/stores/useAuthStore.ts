import { create } from 'zustand';
import { User } from '../types/models';
import { AuthService, VendorService } from '../services';
import { AuthResult } from '../api/repository';

interface AuthState {
  user: User | null;
  hydrated: boolean;
  loading: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, name?: string) => Promise<AuthResult>;
  register: (name: string, email: string, phone?: string) => Promise<AuthResult>;
  verify: (email: string, code: string) => Promise<User>;
  changeEmail: (newEmail: string) => Promise<{ sent: boolean; demoCode?: string }>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
  toggleSaved: (vendorId: ID) => Promise<boolean>;
  requireAuth: () => boolean;
}

type ID = string;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  hydrated: false,
  loading: false,
  hydrate: async () => {
    try {
      const user = await AuthService.currentUser();
      set({ user, hydrated: true });
    } catch {
      // Storage-layer failure must never block boot.
      set({ user: null, hydrated: true });
    }
  },
  login: async (email, name) => {
    set({ loading: true });
    try {
      const res = await AuthService.loginWithEmail(email, name);
      // Unverified users hold NO token until OTP passes — still stage the
      // profile so the verify screen can greet them by name.
      set({ user: res.user });
      return res;
    } finally {
      set({ loading: false });
    }
  },
  register: async (name, email, phone) => {
    set({ loading: true });
    try {
      const res = await AuthService.register(name, email, phone);
      set({ user: res.user });
      return res;
    } finally {
      set({ loading: false });
    }
  },
  verify: async (email, code) => {
    set({ loading: true });
    try {
      const res = await AuthService.verifyOtp(email, code);
      set({ user: res.user });
      return res.user;
    } finally {
      set({ loading: false });
    }
  },
  changeEmail: async (newEmail) => {
    set({ loading: true });
    try {
      const res = await AuthService.changeEmail(newEmail);
      set({ user: res.user });
      return { sent: res.sent, demoCode: res.demoCode };
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
    await AuthService.logout();
    set({ user: null });
  },
  updateProfile: async (patch) => {
    const user = await AuthService.updateProfile(patch);
    set({ user });
  },
  toggleSaved: async (vendorId) => {
    const { user } = get();
    if (!user) return false;
    const next = await VendorService.toggleSaved(user, vendorId);
    set({ user: next });
    return next.savedVendorIds.includes(vendorId);
  },
  requireAuth: () => get().user !== null,
}));
