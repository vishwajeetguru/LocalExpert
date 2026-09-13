import { memo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useAppColors } from '../../theme';
import { layout, radius, shadows } from '../../theme/tokens';
import { Category, Vendor } from '../../types/models';
import { formatDistance } from '../../utils/format';
import { tap } from '../../utils/device';
import { AppText } from '../ui/AppText';
import { RatingPill, VerifiedBadge, StatusPill } from '../ui/Pills';
import { Float, Pop, StaggerItem } from '../motion/AnimatedIcon';
import { CATEGORY_IMAGES } from './categoryImages';
import { formatKm, vendorKm } from '../../utils/distance';
import { useLocationStore } from '../../stores/useLocationStore';
import { useT } from '../../i18n/store';
import { useAuthStore } from '../../stores/useAuthStore';
import { useVendorActions } from '../../hooks/useVendorActions';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function usePressSpring() {
  const s = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return {
    style,
    onIn: () => (s.value = withSpring(0.965, { damping: 18, stiffness: 380 })),
    onOut: () => (s.value = withSpring(1, { damping: 18, stiffness: 380 })),
  };
}

function goCategory(item: Category, onPress?: () => void) {
  tap('light');
  if (onPress) onPress();
  else router.push(`/category/${item.id}`);
}

/** Bundled photo with graceful fallback to the glyph behind it. */
function CategoryPhoto({ source }: { source: { uri?: string } | number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Image
      source={source as never}
      style={StyleSheet.absoluteFill}
      contentFit="contain"
      transition={250}
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Rail tile (home) — tinted glyph tile with the name set OUTSIDE below,
 * equal heights, snap-carousel friendly. Showcase (explore) — tall card
 * with pro-count pill + arrow affordance, fluid in the 3-col grid.
 */
export const CategoryTile = memo(function CategoryTile({
  item,
  index = 0,
  onPress,
  fluid,
  variant = 'rail',
}: {
  item: Category;
  index?: number;
  onPress?: () => void;
  fluid?: boolean;
  variant?: 'rail' | 'showcase';
}) {
  const press = usePressSpring();
  const { t, catName } = useT();
  const name = catName(item.slug || item.id, item.name);

  if (variant === 'showcase') {
    const img = CATEGORY_IMAGES[item.slug] as { uri?: string } | number | undefined;
    return (
      <StaggerItem index={index} style={fluid ? { flex: 1 } : undefined}>
        <AnimatedPressable
          onPress={() => goCategory(item, onPress)}
          onPressIn={press.onIn}
          onPressOut={press.onOut}
          style={[
            press.style,
            styles.showcase,
            fluid && { width: '100%', marginRight: 0 },
            { backgroundColor: item.tint },
          ]}
        >
          <View style={styles.showcaseArt}>
            {/* Glyph stays mounted behind the photo as the offline fallback. */}
            <MaterialCommunityIcons name={item.icon as never} size={44} color="rgba(19,19,19,0.35)" />
            {img !== undefined ? (
              <CategoryPhoto source={img} />
            ) : null}
          </View>
          <AppText variant="bodyStrong" numberOfLines={2} style={styles.showcaseName}>
            {name}
          </AppText>
          <View style={styles.showcaseFoot}>
            <View style={styles.showcaseCount}>
              <AppText variant="tiny" color="#5F6368">
                {item.vendorCount} {t('common.pros')}
              </AppText>
            </View>
            <View style={styles.showcaseArrow}>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#131313" />
            </View>
          </View>
        </AnimatedPressable>
      </StaggerItem>
    );
  }

  return (
    <StaggerItem index={index}>
      <AnimatedPressable
        onPress={() => goCategory(item, onPress)}
        onPressIn={press.onIn}
        onPressOut={press.onOut}
        style={[press.style, styles.railWrap]}
      >
        <View style={[styles.railTile, { backgroundColor: item.tint }]}>
          <MaterialCommunityIcons name={item.icon as never} size={30} color="#131313" />
        </View>
        <AppText variant="captionStrong" align="center" numberOfLines={2} style={styles.railName}>
          {name}
        </AppText>
      </AnimatedPressable>
    </StaggerItem>
  );
});

/**
 * Bento vendor card — identity band, meta strip, Call/Chat/Profile actions.
 * Used in search, category and saved lists.
 */
export const VendorCard = memo(function VendorCard({
  vendor,
  index = 0,
  onCall,
  onChat,
}: {
  vendor: Vendor;
  index?: number;
  onCall?: () => void;
  onChat?: () => void;
}) {
  const { colors, isDark } = useAppColors();
  const { t, catName } = useT();
  const press = usePressSpring();
  const open = () => router.push(`/vendor/${vendor.id}`);
  const initials = vendor.businessName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <StaggerItem index={index}>
      <AnimatedPressable
        onPress={open}
        onPressIn={press.onIn}
        onPressOut={press.onOut}
        style={[press.style, styles.card, { backgroundColor: colors.card, borderColor: isDark ? colors.borderSoft : 'transparent' }, isDark ? shadows.card : shadows.clay]}
      >
        {/* Identity band */}
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <View style={[styles.mono, { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder }]}>
            <AppText variant="h2" color={colors.primary}>
              {initials}
            </AppText>
            {vendor.availableToday ? <View style={styles.liveDot} /> : null}
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {vendor.businessName}
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
              {vendor.isVerified ? <VerifiedBadge compact /> : null}
              <AppText variant="caption" color={colors.textSecondary}>
                {catName(vendor.categorySlug || vendor.categoryId, vendor.categoryName)}
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <RatingPill rating={vendor.rating} count={vendor.reviewCount} />
              {vendor.distanceKm !== undefined ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <MaterialCommunityIcons name="map-marker" size={13} color={colors.textTertiary} />
                  <AppText variant="caption" color={colors.textSecondary}>
                    {formatDistance(vendor.distanceKm)}
                  </AppText>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Meta strip */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {vendor.homeVisitAvailable ? <StatusPill tone="success" label={t('card.homeVisit')} icon="home-account" /> : null}
          {vendor.availableToday ? <StatusPill tone="info" label={t('card.today')} icon="clock-check" /> : null}
          {vendor.responseTimeMin ? <StatusPill tone="neutral" label={vendor.responseTimeMin} icon="timer" /> : null}
          {vendor.priceHint ? <StatusPill tone="gold" label={vendor.priceHint} icon="tag" /> : null}
        </View>

        {/* Action row */}
        <View style={[styles.actions, { borderTopColor: colors.borderSoft }]}>
          <Pressable
            onPress={() => {
              tap('medium');
              onCall?.();
            }}
            style={[styles.callPill, { backgroundColor: colors.primary }]}
          >
            <MaterialCommunityIcons name="phone" size={17} color="#fff" />
            <AppText variant="calloutStrong" color="#fff">
              {t('card.call')}
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => {
              tap('light');
              onChat?.();
            }}
            style={[styles.ghostPill, { borderColor: colors.border }]}
          >
            <MaterialCommunityIcons name="chat" size={17} color={colors.text} />
            <AppText variant="calloutStrong">{t('card.chat')}</AppText>
          </Pressable>
          <Pressable onPress={open} hitSlop={12} style={styles.goArrow} accessibilityLabel={t('card.profile')}>
            <MaterialCommunityIcons name="arrow-right" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      </AnimatedPressable>
    </StaggerItem>
  );
});

/**
 * Pro card (home rail) — screenshot spec: related photo left with availability
 * badge, name + rosette, rating, distance, service tags; heart, price and
 * Book Now right. Photo falls back to the category's related mock image,
 * then to a monogram — never a random picture.
 */
export const ProCard = memo(function ProCard({ vendor, index = 0 }: { vendor: Vendor; index?: number }) {
  const { colors, isDark } = useAppColors();
  const { t, catName } = useT();
  const press = usePressSpring();
  const { onRequest, onSave } = useVendorActions();
  const user = useAuthStore((s) => s.user);
  const gps = useLocationStore((s) => s.coords);
  const saved = !!user?.savedVendorIds.includes(vendor.id);
  const open = () => router.push(`/vendor/${vendor.id}`);
  const catKey = vendor.categorySlug || vendor.categoryId;
  const related = CATEGORY_IMAGES[catKey] as { uri?: string } | number | undefined;
  const photo = vendor.photos[0];
  const initials = vendor.businessName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const freebie = !!vendor.priceHint && /free/i.test(vendor.priceHint);
  const km = vendorKm(vendor, gps);

  return (
    <StaggerItem index={index}>
      <AnimatedPressable
        onPress={open}
        onPressIn={press.onIn}
        onPressOut={press.onOut}
        style={[press.style, styles.pro, { backgroundColor: colors.card, borderColor: isDark ? colors.borderSoft : 'transparent' }, isDark ? shadows.card : shadows.clay]}
      >
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Related photo with availability badge */}
          <View>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.proPhoto} contentFit="cover" transition={250} />
            ) : related !== undefined ? (
              <Image source={related as never} style={styles.proPhoto} contentFit="cover" transition={250} />
            ) : (
              <View style={[styles.proPhoto, styles.proFallback, { backgroundColor: colors.primarySoft }]}>
                <AppText variant="h2" color={colors.primary}>
                  {initials}
                </AppText>
              </View>
            )}
            {vendor.availableToday ? (
              <View style={styles.proBadge}>
                <View style={styles.proDot} />
                <AppText variant="tiny" color="#fff" numberOfLines={1}>
                  {t('vendor.todayOn')}
                </AppText>
              </View>
            ) : null}
          </View>

          {/* Middle info */}
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <AppText variant="h3" numberOfLines={1} style={{ flexShrink: 1 }}>
                {vendor.businessName}
              </AppText>
              {vendor.isVerified ? (
                <MaterialCommunityIcons name="check-decagram" size={17} color={colors.primary} />
              ) : null}
            </View>
            <AppText variant="callout" color={colors.textSecondary} numberOfLines={1} style={{ marginTop: 2 }}>
              {catName(catKey, vendor.categoryName)}
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <MaterialCommunityIcons name="star" size={15} color={colors.star} />
              <AppText variant="calloutStrong">{vendor.rating ? vendor.rating.toFixed(1) : t('dash.new')}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                ({vendor.reviewCount})
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 }}>
              <MaterialCommunityIcons name="map-marker" size={13} color={colors.textTertiary} />
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {km !== undefined ? `${formatKm(km)} away • ` : ''}{vendor.location.city}
              </AppText>
            </View>
            {vendor.servicesOffered.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {vendor.servicesOffered.slice(0, 3).map((s) => (
                  <View key={s} style={[styles.tagChip, { backgroundColor: colors.surface2 }]}>
                    <AppText variant="tiny" color={colors.textSecondary} numberOfLines={1}>
                      {s}
                    </AppText>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {/* Right rail: fav heart + price + CTA */}
          <View style={styles.proRight}>
            <Pressable
              hitSlop={10}
              onPress={() => void onSave(vendor)}
              style={{ alignSelf: 'flex-end', padding: 2 }}
              accessibilityLabel={t('profile.saved')}
            >
              <Pop popKey={saved}>
                <MaterialCommunityIcons
                  name={saved ? 'heart' : 'heart-outline'}
                  size={23}
                  color={saved ? colors.primary : colors.textTertiary}
                />
              </Pop>
            </Pressable>
            <View style={{ alignItems: 'flex-end', gap: 7 }}>
              {vendor.priceHint ? (
                <AppText variant="bodyStrong" color={freebie ? colors.success : colors.text} numberOfLines={1}>
                  {vendor.priceHint}
                </AppText>
              ) : null}
              <Pressable
                onPress={() => onRequest(vendor)}
                style={[styles.bookBtn, { backgroundColor: colors.primary }]}
              >
                <AppText variant="calloutStrong" color="#fff" numberOfLines={1}>
                  {vendor.priceHint ? t('home.book') : t('common.requestService')}
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </StaggerItem>
  );
});

const styles = StyleSheet.create({
  // Rail (home horizontal)
  railWrap: { width: 88, alignItems: 'center', marginRight: 12 },
  railTile: {
    width: 72, height: 72, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.claySm,
  },
  railName: { marginTop: 8, minHeight: 32 },
  // Showcase (explore grid)
  showcase: { borderRadius: 32, padding: 16, minHeight: 182, marginRight: 12, ...shadows.clay },
  showcaseArt: { height: 96, alignItems: 'center', justifyContent: 'center' },
  showcaseName: { marginTop: 6, minHeight: 44 },
  showcaseFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  showcaseCount: { backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  showcaseArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  // Bento vendor card
  card: { borderRadius: 28, padding: layout.cardPad, borderWidth: 1 },
  mono: {
    width: 62, height: 62, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  liveDot: {
    position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#16A34A', borderWidth: 2.5, borderColor: '#fff',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, borderTopWidth: 1, paddingTop: 14 },
  callPill: { flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 18, paddingVertical: 13 },
  ghostPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 18, paddingVertical: 13, borderWidth: 1 },
  goArrow: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  // Pro card (home)
  pro: { borderRadius: 22, padding: 12, borderWidth: 1 },
  proPhoto: { width: 122, height: 152, borderRadius: 16, backgroundColor: '#F0EEEB' },
  proFallback: { alignItems: 'center', justifyContent: 'center' },
  proBadge: {
    position: 'absolute', left: 6, bottom: 6, right: 6,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(19,19,19,0.78)', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  proDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  proRight: { justifyContent: 'space-between', alignItems: 'flex-end', paddingVertical: 2 },
  bookBtn: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  tagChip: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, maxWidth: '100%' },
});
