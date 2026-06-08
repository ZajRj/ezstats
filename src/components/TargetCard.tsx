import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function TargetCard() {
  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.title}>Weekly Target</Text>
        <Text style={styles.subtitle}>You're 2 hours away from your goal!</Text>
        
        <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>MATHEMATICS</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>STATISTICS</Text>
          </View>
        </View>
      </View>
      <Ionicons 
        name="trending-up" 
        size={120} 
        color="rgba(255, 255, 255, 0.05)" 
        style={styles.bgIcon} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.success,
    borderRadius: 16,
    padding: 20,
    marginBottom: 100, // extra padding for bottom tab navigation
    overflow: 'hidden',
    position: 'relative',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    zIndex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.successLight,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    color: colors.successLight,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  bgIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    zIndex: 0,
    transform: [{ rotate: '-10deg' }]
  },
});
