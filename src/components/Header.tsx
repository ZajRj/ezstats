import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { getUserProfile, UserProfile } from '../db/database';

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

  // Update time every minute
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
    <View style={styles.container}>
      <View style={styles.leftContent}>
        <Image 
          source={avatarSource} 
          style={styles.avatar} 
        />
        <View>
          <Text style={styles.greeting}>Welcome back, {userName}</Text>
          <Text style={styles.date}>{dateString} • {timeString}</Text>
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
