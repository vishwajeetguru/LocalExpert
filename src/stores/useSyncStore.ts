import { create } from 'zustand';

export interface MaintenanceState {
  enabled: boolean;
  message: string;
}

/**
 * Live-sync revision bus. The global poller (useLiveSync) bumps `rev` whenever
 * the server fingerprint changes — lists subscribe and refetch, so new
 * categories, vendors, approvals, requests and messages appear with no reload.
 * It also carries maintenance mode, which gates the whole app.
 */
interface SyncState {
  rev: string | null;
  updatedAt: number;
  maintenance: MaintenanceState;
  setBaseline: (rev: string, maintenance: MaintenanceState) => void;
  bump: (rev: string, maintenance: MaintenanceState) => void;
}

const OFF: MaintenanceState = { enabled: false, message: '' };

export const useSyncStore = create<SyncState>((set) => ({
  rev: null,
  updatedAt: 0,
  maintenance: OFF,
  setBaseline: (rev, maintenance) => set((s) => (s.rev === null ? { rev, updatedAt: Date.now(), maintenance } : s)),
  bump: (rev, maintenance) =>
    set((s) => (s.rev === rev && s.maintenance.enabled === maintenance.enabled && s.maintenance.message === maintenance.message
      ? s
      : { rev, updatedAt: Date.now(), maintenance })),
}));
