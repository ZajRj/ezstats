import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../../src/components/ui/Text';
import { colors } from '../../src/theme/colors';
import { FAMILIES, TESTS } from '../../src/stats/registry';

const FAMILY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  normalidad: 'pulse',
  varianza: 'resize',
  aleatoriedad: 'shuffle',
  anova: 'git-compare',
};

export default function StatsCatalog() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
    >
      <Stack.Screen options={{ title: 'Pruebas estadísticas' }} />

      <Pressable
        onPress={() => router.push('/stats/completo')}
        style={({ pressed }) => [styles.hero, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
      >
        <View style={styles.heroIcon}>
          <Ionicons name="checkmark-done" size={24} color={colors.card} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.heroTitle}>Análisis completo (supuestos + ANOVA)</Text>
          <Text style={styles.heroText}>
            Ingresa los grupos una vez: verifica aleatoriedad, normalidad y varianzas, y elige ANOVA + Tukey o Kruskal-Wallis.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.card} />
      </Pressable>

      {FAMILIES.map((f) => (
        <View key={f.id} style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name={FAMILY_ICON[f.id]} size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>{f.title}</Text>
          </View>
          <Text style={styles.sectionDesc}>{f.description}</Text>
          <View style={styles.list}>
            {TESTS.filter((t) => t.family === f.id).map((t, i, arr) => (
              <Pressable
                key={t.id}
                onPress={() => router.push({ pathname: '/stats/[testId]', params: { testId: t.id } })}
                style={({ pressed }) => [styles.item, i < arr.length - 1 && styles.itemBorder, pressed && styles.itemPressed]}
                accessibilityRole="button"
                accessibilityHint={t.when}
              >
                <View style={styles.flex}>
                  <Text style={styles.itemName}>{t.name}</Text>
                  <Text style={styles.itemWhen}>{t.when}</Text>
                  <Text style={styles.itemReq}>Requiere: {t.requirements}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 20 },
  flex: { flex: 1 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.primary,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroTitle: { fontSize: 17, fontWeight: 'bold', color: colors.card },
  heroText: { fontSize: 14, lineHeight: 20, color: colors.primaryLight, marginTop: 4 },
  section: { gap: 6 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  sectionDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  list: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, minHeight: 60 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemPressed: { backgroundColor: colors.surface },
  itemName: { fontSize: 16, fontWeight: '600', color: colors.text },
  itemWhen: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 2 },
  itemReq: { fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: '600' },
});
