import Text from './ui/Text';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type CourseCardProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBgColor: string;
  iconColor: string;
  progress?: number; // 0 to 100
  bottomText?: string;
  progressColor?: string;
  onPress?: () => void;
};

export default function CourseCard({
  title,
  icon,
  iconBgColor,
  iconColor,
  progress,
  bottomText,
  progressColor = colors.progressFill,
  onPress,
}: CourseCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isNavigating = useRef(false);

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!onPress || isNavigating.current) return;
    isNavigating.current = true;
    onPress();
    setTimeout(() => {
      isNavigating.current = false;
    }, 500);
  };

  return (
    <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity 
        style={styles.card} 
        onPress={handlePress} 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={onPress ? 0.9 : 1}
        disabled={!onPress}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
          {progress !== undefined && (
            <Text style={styles.progressText}>{progress}%</Text>
          )}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        
        <View style={styles.footer}>
          {progress !== undefined ? (
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: progressColor }]} />
            </View>
          ) : (
            <Text style={styles.bottomText}>{bottomText}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '48%', // For 2-column grid
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: colors.primary,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    minHeight: 40,
    lineHeight: 20,
  },
  footer: {
    height: 16,
    justifyContent: 'center',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.progressBg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  bottomText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
