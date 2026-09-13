import { create } from 'zustand';

interface ToastState {
  message: string | null;
  kind: 'success' | 'info' | 'error';
  show: (message: string, kind?: ToastState['kind']) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  kind: 'success',
  show: (message, kind = 'success') => set({ message, kind }),
  hide: () => set({ message: null }),
}));

interface GateState {
  authSheetVisible: boolean;
  authSheetReason: string;
  pendingActionLabel?: string;
  openAuthGate: (reason?: string, actionLabel?: string) => void;
  closeAuthGate: () => void;
}

export const useGateStore = create<GateState>((set) => ({
  authSheetVisible: false,
  authSheetReason: 'Login to contact local service providers and request services.',
  pendingActionLabel: undefined,
  openAuthGate: (reason, actionLabel) =>
    set({
      authSheetVisible: true,
      authSheetReason: reason ?? 'Login to contact local service providers and request services.',
      pendingActionLabel: actionLabel,
    }),
  closeAuthGate: () => set({ authSheetVisible: false, pendingActionLabel: undefined }),
}));
