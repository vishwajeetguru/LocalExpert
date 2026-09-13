import { useState } from 'react';
import { router } from 'expo-router';
import { Vendor } from '../types/models';
import { useAuthStore } from '../stores/useAuthStore';
import { useGateStore, useToastStore } from '../stores/useUiStore';
import { useLocale } from '../i18n/store';
import { translate } from '../i18n/locales';
import { ChatService } from '../services';

/**
 * Central gate: browse free → login wall (bottom sheet) → OTP wall (verify
 * screen). Verification is mandatory before any platform action.
 */
export function useVendorActions() {
  const user = useAuthStore((s) => s.user);
  const openAuthGate = useGateStore((s) => s.openAuthGate);
  const showToast = useToastStore((s) => s.show);
  const locale = useLocale((s) => s.locale) ?? 'en';
  const [callVendor, setCallVendor] = useState<Vendor | null>(null);

  const guard = (actionLabel: string): boolean => {
    if (!user) {
      openAuthGate(translate(locale, 'sheet.authBody'), actionLabel);
      return false;
    }
    if (!user.emailVerified) {
      showToast(translate(locale, 'verify.needed'), 'info');
      router.push({ pathname: '/auth/verify', params: { email: user.email } } as never);
      return false;
    }
    return true;
  };

  const onCall = (vendor: Vendor) => {
    if (!guard(`Call ${vendor.businessName}`)) return;
    setCallVendor(vendor);
  };

  const onChat = async (vendor: Vendor) => {
    if (!guard(`Chat with ${vendor.businessName}`)) return;
    try {
      const me = useAuthStore.getState().user!;
      const conv = await ChatService.ensureConversation(me.id, me.name, vendor);
      router.push(`/chat/${conv.id}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : translate(locale, 'verify.wrong'), 'error');
    }
  };

  const onRequest = (vendor: Vendor) => {
    if (!guard(`Request ${vendor.categoryName} service`)) return;
    router.push({ pathname: '/vendor/[id]/request', params: { id: vendor.id } } as never);
  };

  const onSave = async (vendor: Vendor): Promise<boolean | null> => {
    if (!guard(`Save ${vendor.businessName}`)) return null;
    try {
      const toggle = useAuthStore.getState().toggleSaved;
      return toggle(vendor.id);
    } catch (e) {
      showToast(e instanceof Error ? e.message : translate(locale, 'verify.wrong'), 'error');
      return null;
    }
  };

  return { user, callVendor, setCallVendor, onCall, onChat, onRequest, onSave };
}
