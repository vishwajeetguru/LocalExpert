import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../src/theme';
import { layout, radius, shadows, spacing } from '../../src/theme/tokens';
import { VendorService } from '../../src/services';
import { Review, Vendor } from '../../src/types/models';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useGateStore, useToastStore } from '../../src/stores/useUiStore';
import { useVendorActions } from '../../src/hooks/useVendorActions';
import { AppText } from '../../src/components/ui/AppText';
import { Stars } from '../../src/components/ui/bits';
import { StatusPill, VerifiedBadge } from '../../src/components/ui/Pills';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { SkeletonList } from '../../src/components/ui/Skeleton';
import { CallConfirmSheet } from '../../src/components/sheets/CallConfirmSheet';
import { ReviewSheet } from '../../src/components/sheets/ReviewSheet';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Pop } from '../../src/components/motion/AnimatedIcon';
import { CATEGORY_IMAGES } from '../../src/components/vendor/categoryImages';
import { formatDistance } from '../../src/utils/format';
import { tap } from '../../src/utils/device';
import { useT } from '../../src/i18n/store';

export default function VendorProfile() {
  const { colors } = useAppColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const openAuthGate = useGateStore((s) => s.openAuthGate);
  const { callVendor, setCallVendor, onCall, onChat, onRequest, onSave } = useVendorActions();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [stars, setStars] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [sendingReview, setSendingReview] = useState(false);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { t, catName } = useT();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const v = await VendorService.getById(String(id));
        setVendor(v);
        if (v) setReviews(await VendorService.reviewsFor(v.id));
        setErr(null);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, attempt]);

  // Live profile: rating / availability / approval changes appear on return.
  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const v = await VendorService.getById(String(id));
        if (v) {
          setVendor(v);
          setReviews(await VendorService.reviewsFor(v.id));
        }
      } catch {
        // keep cached profile visible; boot fetch surfaces errors
      }
    })();
  }, [id]));

  useEffect(() => {
    if (vendor && user) setSaved(user.savedVendorIds.includes(vendor.id));
  }, [vendor, user]);

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 60, paddingHorizontal: 16 }]}>
        <SkeletonList count={3} />
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        {err ? (
          <EmptyState icon="cloud-off" title={t('common.offline')} body={err} actionLabel={t('common.retry')} onAction={() => setAttempt((a) => a + 1)} />
        ) : (
          <EmptyState icon="store-remove" title="Vendor not found" body="This listing may have been removed." actionLabel="Go home" onAction={() => router.replace('/(tabs)')} />
        )}
      </View>
    );
  }

  const catImg = CATEGORY_IMAGES[vendor.categorySlug || ''] ?? CATEGORY_IMAGES[vendor.categoryId];
  const bannerImg = vendor.photos.length > 0 ? { uri: vendor.photos[0] } : catImg;

  const toggleSave = async () => {
    tap('medium');
    const res = await onSave(vendor);
    if (res === null) return;
    setSaved(res);
    showToast(res ? t('vendor.saved') : t('vendor.unsaved'));
  };

  const openReview = () => {
    if (!user) {
      openAuthGate(t('sheet.authBody'), t('review.write'));
      return;
    }
    if (!user.emailVerified) {
      showToast(t('verify.needed'), 'info');
      router.push({ pathname: '/auth/verify', params: { email: user.email } } as never);
      return;
    }
    setStars(5);
    setReviewText('');
    setReviewOpen(true);
  };

  const submitReview = async () => {
    if (!vendor || reviewText.trim().length < 4) return;
    setSendingReview(true);
    try {
      const r = await VendorService.submitReview(vendor.id, stars, reviewText.trim());
      setReviews((prev) => [r, ...prev]);
      const fresh = await VendorService.getById(vendor.id);
      if (fresh) setVendor(fresh);
      setReviewOpen(false);
      showToast(t('review.done'));
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('verify.wrong'), 'error');
    } finally {
      setSendingReview(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Photo banner with gradient + floating actions */}
        <View style={styles.banner}>
          {bannerImg !== undefined ? (
            <Image source={bannerImg as never} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary800, alignItems: 'center', justifyContent: 'center' }]}>
              <AppText variant="display" color="rgba(255,255,255,0.9)">
                {vendor.businessName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </AppText>
            </View>
          )}
          <LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.68)']} style={StyleSheet.absoluteFill} />
          <View style={[styles.topRow, { paddingTop: insets.top + 8 }]}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </Pressable>
            <Pressable onPress={toggleSave} hitSlop={12} style={styles.iconBtn}>
              <Pop popKey={saved}>
                <MaterialCommunityIcons name={saved ? 'bookmark' : 'bookmark-outline'} size={24} color={saved ? '#FF6A3D' : '#fff'} />
              </Pop>
            </Pressable>
          </View>
          <View style={styles.bannerFoot}>
            <View style={styles.bannerCat}>
              <AppText variant="captionStrong" color="#fff">
                {catName(vendor.categorySlug || vendor.categoryId, vendor.categoryName)}
              </AppText>
            </View>
            {vendor.isVerified ? <VerifiedBadge /> : null}
          </View>
        </View>

        {/* Floating identity card */}
        <View style={{ paddingHorizontal: layout.screenPad }}>
          <View style={[styles.idCard, { backgroundColor: colors.card }]}>
            <AppText variant="h1">
              {vendor.businessName}
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <Stars value={vendor.rating} size={16} />
              <AppText variant="calloutStrong">
                {vendor.rating ? vendor.rating.toFixed(1) : t('dash.new')}
              </AppText>
              <AppText variant="callout" color={colors.textSecondary}>
                ({vendor.reviewCount})
              </AppText>
              {vendor.distanceKm !== undefined ? (
                <AppText variant="callout" color={colors.textSecondary}>
                  • {formatDistance(vendor.distanceKm)}
                </AppText>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {vendor.homeVisitAvailable ? <StatusPill tone="success" label={t('card.homeVisit')} icon="home-account" /> : null}
              {vendor.availableToday ? <StatusPill tone="info" label={t('vendor.todayOn')} icon="clock-check" /> : null}
              {vendor.priceHint ? <StatusPill tone="gold" label={vendor.priceHint} icon="tag" /> : null}
              {vendor.responseTimeMin ? <StatusPill tone="neutral" label={vendor.responseTimeMin} icon="timer" /> : null}
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: layout.screenPad, marginTop: 4 }}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.statRow}>
              <Stat value={String(vendor.completedJobs > 100 ? `${Math.round(vendor.completedJobs / 100) / 10}k` : vendor.completedJobs)} label={t('vendor.jobs')} />
              <Divider />
              <Stat value={`${vendor.yearsExperience}+ yrs`} label={t('vendor.exp')} />
              <Divider />
              <Stat value={vendor.responseTimeMin ?? 'Fast'} label={t('vendor.resp')} />
            </View>
            {!vendor.availableToday ? (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <StatusPill tone="warning" label={t('vendor.tomorrow')} icon="calendar" />
              </View>
            ) : null}
          </View>

          <Section title={t('vendor.about')}>
            <AppText variant="body" color={colors.textSecondary}>
              {vendor.description}
            </AppText>
          </Section>

          <Section title={t('vendor.services')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {vendor.servicesOffered.map((s) => (
                <View key={s} style={[styles.serviceChip, { backgroundColor: colors.surface2 }]}>
                  <MaterialCommunityIcons name="check" size={15} color={colors.primary} />
                  <AppText variant="calloutStrong">{s}</AppText>
                </View>
              ))}
            </View>
          </Section>

          {vendor.photos.length > 0 ? (
            <Section title={t('photos.title')}>
              <FlatList
                horizontal
                data={vendor.photos}
                keyExtractor={(p) => p}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
                renderItem={({ item }) => (
                  <Image source={{ uri: item }} style={styles.photo} contentFit="cover" transition={300} />
                )}
              />
            </Section>
          ) : null}

          <Section title={t('vendor.visit')}>
            <InfoRow icon="map-marker" text={`${vendor.location.address}`} />
            <InfoRow icon="routes" text={`Serves: ${(vendor.location.serviceAreas ?? []).join(', ') || vendor.location.city}`} />
            <InfoRow icon="clock" text={vendor.workingHours.find((h) => h.day === new Date().getDay()) ? `Today: ${vendor.workingHours.find((h) => h.day === new Date().getDay())?.open} – ${vendor.workingHours.find((h) => h.day === new Date().getDay())?.close}` : 'Open all days'} />
            <InfoRow icon="phone" text={vendor.phone} />
          </Section>

          <Section title={`${t('vendor.reviews')} (${reviews.length})`}>
            <Pressable onPress={openReview} style={[styles.writeReview, { borderColor: colors.primaryBorder, backgroundColor: colors.primarySoft }]}>
              <MaterialCommunityIcons name="star-plus" size={20} color={colors.primary} />
              <AppText variant="calloutStrong" color={colors.primary}>
                {t('review.write')}
              </AppText>
            </Pressable>
            {reviews.length === 0 ? (
              <AppText variant="callout" color={colors.textSecondary}>
                {t('vendor.newNote')}
              </AppText>
            ) : (
              <View style={{ gap: 10 }}>
                {reviews.map((r) => (
                  <View key={r.id} style={[styles.review, { backgroundColor: colors.surface }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <AppText variant="calloutStrong">{r.authorName}</AppText>
                      <Stars value={r.rating} />
                    </View>
                    <AppText variant="callout" color={colors.textSecondary} style={{ marginTop: 4 }}>
                      {r.text}
                    </AppText>
                  </View>
                ))}
              </View>
            )}
          </Section>
        </View>
      </ScrollView>

      <View style={[styles.ctaBar, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 10 }]}>
        <Pressable style={[styles.ctaBtn, styles.callBtn, { borderColor: colors.primary }]} onPress={() => onCall(vendor)}>
          <MaterialCommunityIcons name="phone" size={20} color={colors.primary} />
          <AppText variant="button" color={colors.primary}>
            {t('vendor.call')}
          </AppText>
        </Pressable>
        <Pressable style={[styles.ctaBtn, styles.callBtn, { borderColor: colors.border }]} onPress={() => void onChat(vendor)}>
          <MaterialCommunityIcons name="chat" size={20} color={colors.text} />
          <AppText variant="button">{t('vendor.chat')}</AppText>
        </Pressable>
        <Pressable style={[styles.ctaBtn, { backgroundColor: colors.primary, flex: 1.4 }]} onPress={() => onRequest(vendor)}>
          <AppText variant="button" color="#fff">
            {t('common.requestService')}
          </AppText>
        </Pressable>
      </View>
      <CallConfirmSheet vendor={callVendor} visible={!!callVendor} onClose={() => setCallVendor(null)} />
      {/* Scoped review sheet: single keyboard lift, no keyboard-aware
          inner scroll (short content — an inner keyboard pad would double-
          compensate and push content off-screen). The input is height-
          capped so long reviews scroll INSIDE the field with the cursor
          always visible above the keyboard. */}
      <ReviewSheet visible={reviewOpen} onClose={() => setReviewOpen(false)}>
        <AppText variant="h3" align="center">
          {t('review.title')}
        </AppText>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 16 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Pressable key={i} onPress={() => setStars(i)} hitSlop={8}>
              <MaterialCommunityIcons
                name={i <= stars ? 'star' : 'star-outline'}
                size={38}
                color={i <= stars ? colors.star : colors.border}
              />
            </Pressable>
          ))}
        </View>
        <Input
          placeholder={t('review.hint')}
          value={reviewText}
          onChangeText={setReviewText}
          multiline
          numberOfLines={4}
          inputStyle={{ maxHeight: 132 }}
        />
        <Button label={t('review.submit')} loading={sendingReview} fullWidth onPress={submitReview} style={{ marginTop: 12 }} />
      </ReviewSheet>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 18 }}>
      <AppText variant="h3" style={{ marginBottom: 8 }}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const { colors } = useAppColors();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <AppText variant="h3">{value}</AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
}

function Divider() {
  const { colors } = useAppColors();
  return <View style={{ width: 1, backgroundColor: colors.borderSoft, marginVertical: 4 }} />;
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  const { colors } = useAppColors();
  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 7, alignItems: 'flex-start' }}>
      <MaterialCommunityIcons name={icon as never} size={19} color={colors.primary} style={{ marginTop: 2 }} />
      <AppText variant="callout" style={{ flex: 1 }}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: { height: 300, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(10,10,10,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerFoot: {
    position: 'absolute', left: 20, right: 20, bottom: 18,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  bannerCat: {
    backgroundColor: 'rgba(10,10,10,0.55)', borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  idCard: { borderRadius: radius.lg, padding: spacing.lg, marginTop: -26, ...shadows.raised },
  card: { borderRadius: radius.lg, padding: spacing.lg, ...shadows.card },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  serviceChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  review: { borderRadius: 12, padding: 12 },
  photo: { width: 150, height: 110, borderRadius: 16 },
  writeReview: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 14, paddingVertical: 13, marginBottom: 12,
  },
  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)',
  },
  ctaBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14, paddingVertical: 14 },
  callBtn: { borderWidth: 1.5 },
});
