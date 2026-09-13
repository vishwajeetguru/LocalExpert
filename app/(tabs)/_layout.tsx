import { Pressable, View } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '../../src/theme';
import { radius, shadows } from '../../src/theme/tokens';
import { AppText } from '../../src/components/ui/AppText';
import { Pop } from '../../src/components/motion/AnimatedIcon';
import { useT } from '../../src/i18n/store';

const ICONS: Record<string, { on: string; off: string }> = {
  index: { on: 'home-variant', off: 'home-variant-outline' },
  explore: { on: 'compass', off: 'compass-outline' },
  requests: { on: 'clipboard-text', off: 'clipboard-text-outline' },
  chats: { on: 'chat', off: 'chat-outline' },
  profile: { on: 'account-circle', off: 'account-circle-outline' },
};

/** Dribbble floating dock — in-flow pill, springing active icon, ember signal dot. */
interface DockProps {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: {
    emit: (e: { type: string; target: string; canPreventDefault?: boolean }) => { defaultPrevented?: boolean };
    navigate: (name: string) => void;
  };
}

function PremiumTabBar({ state, descriptors, navigation }: DockProps) {
  const { colors, isDark } = useAppColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: colors.background }}>
      <View
        style={[
          {
            flexDirection: 'row',
            marginHorizontal: 14,
            marginBottom: Math.max(insets.bottom, 10) + 4,
            backgroundColor: colors.tabBar,
            borderColor: isDark ? colors.borderSoft : 'transparent',
            borderWidth: 1,
            borderRadius: 34,
            paddingVertical: 10,
            paddingHorizontal: 8,
          },
          isDark ? shadows.raised : shadows.clay,
        ]}
      >
        {state.routes.map((route: { key: string; name: string }, i: number) => {
          const focused = state.index === i;
          const { options } = descriptors[route.key];
          const label = typeof options.title === 'string' ? options.title : route.name;
          const icons = ICONS[route.name] ?? { on: 'circle', off: 'circle-outline' };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6, borderRadius: 16 }}
            >
              <Pop popKey={focused ? `on-${route.name}` : `off-${route.name}`}>
                <View
                  style={{
                    backgroundColor: focused ? colors.primary : colors.surface2,
                    borderRadius: 18,
                    paddingHorizontal: 15,
                    paddingVertical: 8,
                    ...(focused ? shadows.glow : {}),
                  }}
                >
                  <MaterialCommunityIcons
                    name={(focused ? icons.on : icons.off) as never}
                    size={23}
                    color={focused ? '#fff' : colors.textTertiary}
                  />
                </View>
              </Pop>
              <AppText variant="tiny" color={focused ? colors.primary : colors.textTertiary}>
                {label}
              </AppText>
              <View style={{ height: 4, alignItems: 'center' }}>
                {focused ? <View style={{ width: 16, height: 4, borderRadius: 2, backgroundColor: colors.primary }} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useT();
  return (
    <Tabs tabBar={(props: unknown) => <PremiumTabBar {...(props as unknown as DockProps)} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="explore" options={{ title: t('tabs.explore') }} />
      <Tabs.Screen name="requests" options={{ title: t('tabs.requests') }} />
      <Tabs.Screen name="chats" options={{ title: t('tabs.chats') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
