import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';

import { useEffect } from 'react';
import { setupDatabase } from '../src/db/database';

export default function RootLayout() {
  useEffect(() => {
    try {
      setupDatabase();
    } catch (e) {
      console.warn("Error setting up DB", e);
    }
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
