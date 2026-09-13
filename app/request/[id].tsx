import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../src/theme';
import { layout, radius, shadows, spacing } from '../../src/theme/tokens';
import { RequestService, ChatService, VendorService } from '../../src/services';
import { ServiceRequest, Vendor } from '../../src/types/models';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useGateStore, useToastStore } from '../../src/stores/useUiStore';
import { useT } from '../../src/i18n/store';
import { statusLabel } from '../../src/i18n/status';
import { AppText } from '../../src/components/ui/AppText';
import { Avatar } from '../../src/components/ui/bits';
import { StatusPill } from '../../src/components/ui/Pills';
import { Button } from '../../src/components/ui/Button';
import { ConfirmDialog } from '../../src/components/feedback/ConfirmDialog';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { LottieMoment } from '../../src/components/motion/LottieMoment';
import { Animations } from '../../src/components/motion/animations';
import { callPhoneNumber } from '../../src/utils/device';

const STEPS: ServiceRequest['status'][] = ['pending', 'accepted', 'in_progress', 'completed'];

export default function RequestDetail() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const openAuthGate = useGateStore((s) => s.openAuthGate);
  const showToast = useToastStore((s) => s.show);
  const [req, setReq] = useState<ServiceRequest | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [chatting, setChatting] = useState(false);
  const [acting, setActing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Vendors manage the job here (accept → start → complete); customers
  // track progress. The two roles see deliberately different screens.
  const isVendorView = !!user && user.role === 'vendor';

  useEffect(() => {
    (async () => {
      try {
        setReq(await RequestService.getById(String(id)));
        setErr(null);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Something went wrong.');
      }
    })();
  }, [id, attempt]);

  if (!req) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        {err ? (
          <EmptyState icon="cloud-off" title={t('common.offline')} body={err} actionLabel={t('common.retry')} onAction={() => setAttempt((a) => a + 1)} />
        ) : (
          <EmptyState icon="clipboard-search" title={t('reqDetail.title')} body="" actionLabel={t('common.back')} onAction={() => router.back()} />
        )}
      </View>
    );
  }

  const stepIdx = STEPS.indexOf(req.status === 'cancelled' ? 'pending' : req.status);

  /** Open the real thread for this request — vendor ↔ customer, persisted server-side. */
  const openChat = async () => {
    if (!user) {
      openAuthGate(t('sheet.authBody'), t('reqDetail.chatBtn'));
      return;
    }
    setChatting(true);
    try {
      if (user.role === 'vendor') {
        const own = user.vendorId ? await VendorService.getById(user.vendorId) : await VendorService.myVendor(user.id);
        if (!own) throw new Error('Vendor profile not found.');
        const conv = await ChatService.ensureConversation(req.customerId, req.customerName, own);
        router.push(`/chat/${conv.id}`);
      } else {
        const stub = { id: req.vendorId, businessName: req.vendorName, categoryName: req.categoryName } as Vendor;
        const conv = await ChatService.ensureConversation(user.id, user.name, stub);
        router.push(`/chat/${conv.id}`);
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('verify.wrong'), 'error');
    } finally {
      setChatting(false);
    }
  };

  /** Vendor status transitions + customer cancellation, reflected instantly. */
  const act = async (status: ServiceRequest['status']) => {
    setActing(true);
    try {
      setReq(await RequestService.updateStatus(req.id, status));
      showToast(status === 'cancelled' ? t('reqDetail.cancelDone') : t('dash.updated'));
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('verify.wrong'), 'error');
    } finally {
      setActing(false);
    }
  };

  const cancelled = req.status === 'cancelled';

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.back, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <AppText variant="h2">{t('reqDetail.title')}</AppText>
        <View style={{ width: 42 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: layout.screenPad, gap: 12 }}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <StatusPill tone={req.status === 'completed' ? 'success' : cancelled ? 'error' : req.status === 'pending' ? 'warning' : 'info'} label={statusLabel(t, req.status)} icon="pulse" />
            <AppText variant="caption" color={colors.textSecondary}>
              #{req.id.slice(-6).toUpperCase()}
            </AppText>
          </View>
          <AppText variant="h3" style={{ marginTop: 10 }}>
            {req.serviceSummary}
          </AppText>
          <AppText variant="callout" color={colors.textSecondary} style={{ marginTop: 4 }}>
            {req.description}
          </AppText>
        </View>

        {isVendorView ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Avatar name={req.customerName} size={52} />
              <View style={{ flex: 1 }}>
                <AppText variant="tiny" color={colors.textSecondary}>
                  {t('reqDetail.customer').toUpperCase()}
                </AppText>
                <AppText variant="bodyStrong" style={{ marginTop: 2 }}>
                  {req.customerName}
                </AppText>
                <AppText variant="callout" color={colors.textSecondary}>
                  {req.preferredDate} • {req.preferredTime}
                </AppText>
              </View>
            </View>
            <Row icon="phone" label={t('reqDetail.phone')} value={req.phone} />
            <Row icon="map-marker" label={t('reqDetail.address')} value={req.address} />
            {!cancelled ? (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Button label={t('reqDetail.callBtn')} variant="outline" icon="phone" fullWidth onPress={() => void callPhoneNumber(req.phone)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label={t('reqDetail.chatCustomer')} variant="secondary" icon="chat" fullWidth loading={chatting} onPress={() => void openChat()} />
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {req.status === 'completed' ? (
          <View style={{ alignItems: 'center', marginBottom: 2 }}>
            <LottieMoment source={Animations.successCheck} size={110} loop={false} fallbackIcon="check-decagram" />
          </View>
        ) : null}
        {!cancelled ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <AppText variant="calloutStrong" style={{ marginBottom: 10 }}>
              {isVendorView ? t('reqDetail.manage') : t('reqDetail.track')}
            </AppText>
            <View style={{ gap: 0 }}>
              {STEPS.map((s, i) => {
                const done = i <= stepIdx;
                const current = i === stepIdx;
                return (
                  <View key={s} style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ alignItems: 'center' }}>
                      <View
                        style={[
                          styles.dot,
                          {
                            backgroundColor: done ? colors.success : colors.surface2,
                            borderWidth: current ? 3 : 1.5,
                            borderColor: current ? colors.primary : done ? colors.success : colors.border,
                          },
                        ]}
                      >
                        {done ? <MaterialCommunityIcons name="check" size={14} color="#fff" /> : null}
                      </View>
                      {i < STEPS.length - 1 ? <View style={[styles.line, { backgroundColor: i < stepIdx ? colors.success : colors.borderSoft }]} /> : null}
                    </View>
                    <AppText variant={current ? 'bodyStrong' : 'callout'} color={done ? colors.text : colors.textTertiary} style={{ paddingBottom: 18 }}>
                      {statusLabel(t, s)}
                    </AppText>
                  </View>
                );
              })}
            </View>
            {isVendorView && req.status === 'pending' ? (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Button label={t('dash.accept')} fullWidth loading={acting} onPress={() => void act('accepted')} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label={t('dash.decline')} variant="outline" fullWidth loading={acting} onPress={() => void act('cancelled')} />
                </View>
              </View>
            ) : null}
            {isVendorView && req.status === 'accepted' ? (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Button label={t('dash.start')} variant="secondary" fullWidth loading={acting} onPress={() => void act('in_progress')} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label={t('dash.complete')} fullWidth loading={acting} onPress={() => void act('completed')} />
                </View>
              </View>
            ) : null}
            {isVendorView && req.status === 'in_progress' ? (
              <View style={{ marginTop: 4 }}>
                <Button label={t('dash.doneBtn')} fullWidth loading={acting} onPress={() => void act('completed')} />
              </View>
            ) : null}
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.errorBg }]}>
            <AppText variant="bodyStrong" color={colors.error}>
              {t('reqDetail.cancelled')}
            </AppText>
          </View>
        )}

        {isVendorView ? null : (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Row icon="store" label={t('reqDetail.vendor')} value={`${req.vendorName} • ${req.categoryName}`} />
            <Row icon="calendar" label={t('reqDetail.slot')} value={`${req.preferredDate} • ${req.preferredTime}`} />
            <Row icon="map-marker" label={t('reqDetail.address')} value={req.address} />
            <Row icon="phone" label={t('reqDetail.phone')} value={req.phone} />
          </View>
        )}

        {isVendorView ? null : (
          <>
            <Button label={t('reqDetail.chatBtn')} variant="secondary" icon="chat" fullWidth loading={chatting} onPress={() => void openChat()} />
            {req.status === 'pending' ? (
              <Button label={t('reqDetail.cancelBtn')} variant="outline" fullWidth onPress={() => setConfirmCancel(true)} />
            ) : null}
          </>
        )}
      </ScrollView>
      <ConfirmDialog
        visible={confirmCancel}
        title={t('reqDetail.cancelTitle')}
        body={t('reqDetail.cancelBody')}
        confirmLabel={t('reqDetail.cancelBtn')}
        destructive
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => void act('cancelled')}
      />
    </View>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { colors } = useAppColors();
  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 8 }}>
      <MaterialCommunityIcons name={icon as never} size={19} color={colors.primary} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <AppText variant="tiny" color={colors.textSecondary}>
          {label.toUpperCase()}
        </AppText>
        <AppText variant="calloutStrong">{value}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: radius.lg, padding: spacing.lg, ...shadows.card },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  line: { width: 2.5, flex: 1, minHeight: 16, marginVertical: 3, borderRadius: 2 },
});
