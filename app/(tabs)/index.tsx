import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../src/theme/colors';
import Header from '../../src/components/Header';
import CourseCard from '../../src/components/CourseCard';
import ActionCard from '../../src/components/ActionCard';
import TargetCard from '../../src/components/TargetCard';

import { router } from 'expo-router';

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Clutter commented out for now
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>recent actions</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>View History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          <CourseCard
            title="Probability Basics"
            icon="bar-chart"
            iconBgColor={colors.primaryLight}
            iconColor={colors.primary}
            progress={85}
          />
          <CourseCard
            title="Normal Distribution"
            icon="pulse"
            iconBgColor="#E0F2FE"
            iconColor="#0EA5E9"
            progress={40}
            progressColor="#38BDF8"
          />
          <CourseCard
            title="Hypothesis Testing"
            icon="help-circle"
            iconBgColor={colors.successLight}
            iconColor={colors.success}
            bottomText="Quiz: 18/20"
          />
          <CourseCard
            title="Regression Analysis"
            icon="calculator"
            iconBgColor="#E2E8F0"
            iconColor="#475569"
            bottomText="Last studied: 2h ago"
          />
        </View>
        */}

        <View style={styles.modulesContainer}>
          <ActionCard title="Theory & Concepts" icon="book" onPress={() => {}} />
          <ActionCard title="Utilities" icon="calculator" onPress={() => router.push('/tools')} />
        </View>
        
        {/*
        <TargetCard />
        */}
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
    textTransform: 'lowercase',
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
    marginTop: 20,
    gap: 10,
  },
});
