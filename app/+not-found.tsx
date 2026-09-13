import { View } from 'react-native';
import { Link } from 'expo-router';
import { AppText } from '../src/components/ui/AppText';

export default function NotFound() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <AppText variant="h1">Page not found</AppText>
      <Link href="/(tabs)" style={{ marginTop: 12 }}>
        <AppText variant="calloutStrong" color="#0F766E">
          Go home →
        </AppText>
      </Link>
    </View>
  );
}
