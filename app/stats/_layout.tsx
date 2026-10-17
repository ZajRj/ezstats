import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function StatsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
        headerBackTitle: 'Atrás',
      }}
    />
  );
}
