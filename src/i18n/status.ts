import type { Key } from './locales';
import type { RequestStatus } from '../types/models';

/** Localized request-status pill text shared by customer + vendor screens. */
export function statusLabel(t: (k: Key) => string, s: RequestStatus): string {
  if (s === 'pending') return t('status.pending');
  if (s === 'accepted') return t('status.accepted');
  if (s === 'in_progress') return t('status.inProgress');
  if (s === 'completed') return t('status.completed');
  return t('status.cancelled');
}
