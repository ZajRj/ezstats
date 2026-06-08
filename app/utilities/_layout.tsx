import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function UtilitiesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false, // clean flat look
      }}
    >
      <Stack.Screen name="normal" options={{ title: 'Normal Distribution' }} />
      <Stack.Screen name="binomial" options={{ title: 'Binomial Distribution' }} />
      <Stack.Screen name="poisson" options={{ title: 'Poisson Distribution' }} />
      <Stack.Screen name="carwash" options={{ title: 'Simulación Autolavado' }} />
    </Stack>
  );
}
