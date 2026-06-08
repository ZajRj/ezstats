import { View, Text, StyleSheet } from 'react-native';
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
};

export default function CourseCard({
  title,
  icon,
  iconBgColor,
  iconColor,
  progress,
  bottomText,
  progressColor = colors.progressFill,
}: CourseCardProps) {
  return (
    <View style={styles.card}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '48%', // For 2-column grid
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    minHeight: 40, // keep height consistent for 2 lines
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
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
