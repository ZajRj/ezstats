import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function Header() {
  return (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        <Image 
          source={{ uri: 'https://i.pravatar.cc/100?img=11' }} 
          style={styles.avatar} 
        />
        <View>
          <Text style={styles.greeting}>Welcome back, Alex</Text>
          <Text style={styles.date}>JUN 4, 2026 • 19:39</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.calendarButton}>
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60, // Safe area roughly
    paddingBottom: 20,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
