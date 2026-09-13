import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/useAuthStore';
import { AuthService } from '../services';

/**
 * Push notifications (Expo Push Service).
 * - Registers the device token once per login and sends it to WordPress
 *   (PATCH /users/me {push_token}) — the plugin pushes on new requests,
 *   status changes, chat messages and vendor approval.
 * - Tapping a notification deep-links: chat → thread, request → detail,
 *   vendor → listing.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const SENT_KEY = 'sevasathi.push.sent';

function routeFor(data: Record<string, unknown> | undefined) {
  const type = typeof data?.type === 'string' ? data.type : '';
  const id = typeof data?.id === 'string' ? data.id : '';
  if (!type || !id) return;
  if (type === 'chat') router.push(`/chat/${id}`);
  else if (type === 'request') router.push(`/request/${id}`);
  else if (type === 'vendor') router.push({ pathname: '/vendor/[id]', params: { id } } as never);
}

export function usePush() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const routedRef = useRef(false);

  // Register token shortly after login (once per device+account).
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        if (!Device.isDevice) return;
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'SevaSathi updates',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }
        const { status: existing } = await Notifications.getPermissionsAsync();
        const { status } = existing === 'granted'
          ? { status: existing }
          : await Notifications.requestPermissionsAsync();
        if (status !== 'granted' || cancelled) return;
        const { data: token } = await Notifications.getExpoPushTokenAsync();
        if (!token || cancelled) return;
        const sentKey = `${SENT_KEY}:${userId}`;
        const sent = await AsyncStorage.getItem(sentKey);
        if (sent === token) return;
        await AuthService.updatePushToken(token);
        await AsyncStorage.setItem(sentKey, token);
      } catch {
        // Push is best-effort — in-app live sync already covers updates.
      }
    }, 4000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [userId]);

  // Foreground taps (cold start handled once below) + last-response routing.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      routeFor(res.notification.request.content.data as Record<string, unknown>);
    });
    if (!routedRef.current) {
      routedRef.current = true;
      Notifications.getLastNotificationResponseAsync()
        .then((res) => {
          if (res) routeFor(res.notification.request.content.data as Record<string, unknown>);
        })
        .catch(() => {});
    }
    return () => sub.remove();
  }, []);
}
