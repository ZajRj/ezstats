import Text from './ui/Text';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { getUserProfile, UserProfile } from '../db/database';
import { LinearGradient } from 'expo-linear-gradient';

export default function Header() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      const user = getUserProfile();
      setProfile(user);
      setCurrentDate(new Date());
    }, [])
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const dateString = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  const timeString = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  const avatarSource = profile?.profile_pic_uri 
    ? { uri: profile.profile_pic_uri } 
    : { uri: 'https://i.pravatar.cc/100?img=11' }; // Fallback

  const userName = profile?.name || 'User';

  return (
    <LinearGradient 
      colors={['#FFFFFF', '#F7F9FC']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.leftContent}>
        <View style={styles.avatarContainer}>
          <Image 
            source={avatarSource} 
            style={styles.avatar} 
          />
        </View>
        <View>
          <Text style={styles.greeting}>Welcome back, {userName}</Text>
          <Text style={styles.date}>{dateString} • {timeString}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.calendarButton}>
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
    </LinearGradient>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginRight: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  greeting: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  date: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  calendarButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
  },
});
