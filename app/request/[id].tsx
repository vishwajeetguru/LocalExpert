import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../src/theme';
import { layout, radius, shadows, spacing } from '../../src/theme/tokens';
import { RequestService } from '../../src/services';
import { ServiceRequest } from '../../src/types/models';
import { useT } from '../../src/i18n/store';
import { statusLabel } from '../../src/i18n/status';
import { AppText } from '../../src/components/ui/AppText';
import { StatusPill } from '../../src/components/ui/Pills';
import { Button } from '../../src/components/ui/Button';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { LottieMoment } from '../../src/components/motion/LottieMoment';
import { Animations } from '../../src/components/motion/animations';

const STEPS: ServiceRequest['status'][] = ['pending', 'accepted', 'in_progress', 'completed'];

export default function RequestDetail() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [req, setReq] = useState<ServiceRequest | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

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
            <StatusPill tone={req.status === 'completed' ? 'success' : req.status === 'cancelled' ? 'error' : req.status === 'pending' ? 'warning' : 'info'} label={statusLabel(t, req.status)} icon="pulse" />
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

        {req.status === 'completed' ? (
          <View style={{ alignItems: 'center', marginBottom: 2 }}>
            <LottieMoment source={Animations.successCheck} size={110} loop={false} fallbackIcon="check-decagram" />
          </View>
        ) : null}
        {req.status !== 'cancelled' ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <AppText variant="calloutStrong" style={{ marginBottom: 10 }}>
              {t('reqDetail.track')}
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
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.errorBg }]}>
            <AppText variant="bodyStrong" color={colors.error}>
              {t('reqDetail.cancelled')}
            </AppText>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Row icon="store" label={t('reqDetail.vendor')} value={`${req.vendorName} • ${req.categoryName}`} />
          <Row icon="calendar" label={t('reqDetail.slot')} value={`${req.preferredDate} • ${req.preferredTime}`} />
          <Row icon="map-marker" label={t('reqDetail.address')} value={req.address} />
          <Row icon="phone" label={t('reqDetail.phone')} value={req.phone} />
        </View>

        <Button label={t('reqDetail.chatBtn')} variant="secondary" icon="chat" fullWidth onPress={() => router.push('/(tabs)/chats')} />
      </ScrollView>
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
