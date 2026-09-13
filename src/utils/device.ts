import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';

export function tap(style: 'light' | 'medium' | 'success' = 'light') {
  try {
    if (style === 'success') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else void Haptics.impactAsync(style === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // haptics optional
  }
}

export async function callPhoneNumber(phone: string): Promise<void> {
  const url = `tel:${phone.replace(/\s/g, '')}`;
  const ok = await Linking.canOpenURL(url);
  if (ok) await Linking.openURL(url);
}
