import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../src/theme/colors';
import Header from '../../src/components/Header';
import CourseCard from '../../src/components/CourseCard';
import ActionCard from '../../src/components/ActionCard';
import TargetCard from '../../src/components/TargetCard';

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { getRecentActivities } from '../../src/db/database';

export default function Dashboard() {
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function loadActivities() {
        const activities = await getRecentActivities(5);
        setRecentActivities(activities);
      }
      loadActivities();
    }, [])
  );

  const getIconProps = (type: string) => {
    if (type === 'ARTICLE') {
      return {
        icon: 'book' as any,
        iconBgColor: colors.primaryLight,
        iconColor: colors.primary,
      };
    }
    return {
      icon: 'calculator' as any,
      iconBgColor: colors.successLight,
      iconColor: colors.success,
    };
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor(Date.now() / 1000) - timestamp;
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.modulesContainer}>
          <ActionCard title="Theory & Concepts" icon="book" onPress={() => router.push('/concepts')} />
          <ActionCard title="Utilities" icon="calculator" onPress={() => router.push('/tools')} />
        </View>

        {recentActivities.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 32 }]}>
              <Text style={styles.sectionTitle}>Recent actions</Text>
              <TouchableOpacity onPress={() => router.push('/history')}>
                <Text style={styles.sectionLink}>View History</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.grid}>
              {recentActivities.map((activity) => {
                const iconProps = getIconProps(activity.type);
                return (
                  <CourseCard
                    key={activity.id}
                    title={activity.title}
                    icon={iconProps.icon}
                    iconBgColor={iconProps.iconBgColor}
                    iconColor={iconProps.iconColor}
                    bottomText={getTimeAgo(activity.timestamp)}
                    onPress={() => router.push(activity.path)}
                  />
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modulesContainer: {
    gap: 10,
  },
});
