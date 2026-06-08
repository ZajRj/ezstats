import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface ActionCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}

export default function ActionCard({ title, icon, onPress }: ActionCardProps) {
  const isNavigating = useRef(false);

  const handlePress = () => {
    if (!onPress || isNavigating.current) return;
    isNavigating.current = true;
    onPress();
    // Re-enable tapping after 500ms to prevent double-navigation
    setTimeout(() => {
      isNavigating.current = false;
    }, 500);
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={handlePress}>
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={colors.card} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Ionicons name="arrow-forward" size={24} color={colors.card} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.card,
  },
});
