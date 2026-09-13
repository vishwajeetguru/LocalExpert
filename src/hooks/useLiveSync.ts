import { useEffect } from 'react';
import { AppState } from 'react-native';
import { config, isMockMode } from '../api/config';
import { wpGet } from '../api/wordpress/client';
import { MaintenanceState, useSyncStore } from '../stores/useSyncStore';

interface SyncFingerprint {
  rev: string;
  maintenance?: MaintenanceState;
}

async function pollOnce(): Promise<boolean> {
  try {
    const fp = await wpGet<SyncFingerprint>('/sync/state');
    if (!fp?.rev) return false;
    const maintenance = fp.maintenance ?? { enabled: false, message: '' };
    const { rev, setBaseline, bump } = useSyncStore.getState();
    if (rev === null) setBaseline(fp.rev, maintenance);
    else bump(fp.rev, maintenance);
    return true;
  } catch {
    // Offline / site asleep — stay on cached data, retry next tick.
    return false;
  }
}

/** Manual re-check (maintenance screen retry button). */
export function refreshSyncNow(): Promise<boolean> {
  if (isMockMode) return Promise.resolve(true);
  return pollOnce();
}

/**
 * Global live-sync poller — mount ONCE in the root layout.
 * Developer thinking: WordPress has no socket server without extra infra, so
 * the honest real-time pattern is a cheap fingerprint poll (one tiny JSON,
 * every 20s, app-foreground only) + refetch-on-focus everywhere. Battery and
 * data impact are negligible; UX feels instant. Mock mode never changes
 * externally, so polling is skipped there.
 */
export function useLiveSync() {
  useEffect(() => {
    if (isMockMode) return;
    let alive = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      if (!alive) return;
      await pollOnce();
    };

    void poll();
    timer = setInterval(() => void poll(), config.syncIntervalMs);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void poll();
    });
    return () => {
      alive = false;
      if (timer) clearInterval(timer);
      sub.remove();
    };
  }, []);
}
