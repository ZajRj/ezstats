import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';

import { useEffect } from 'react';
import { setupDatabase, seedDatabase } from '../src/db/database';

export default function RootLayout() {
  useEffect(() => {
    async function init() {
      try {
        await setupDatabase();
        await seedDatabase();
      } catch (e) {
        console.warn("Error setting up DB", e);
      }
    }
    init();
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
