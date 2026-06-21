import Text from '../../src/components/ui/Text';
import { View, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../src/theme/colors';
import ActionCard from '../../src/components/ActionCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import Background from '../../src/components/ui/Background';

export default function Utilities() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Background />
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.headerTitle}>Utilities</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Analysis</Text>
          <View style={styles.cardsContainer}>
            <ActionCard 
              title="Descriptive Statistics" 
              icon="calculator" 
              onPress={() => router.push('/utilities/descriptive')} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distributions</Text>
          <View style={styles.cardsContainer}>
            <ActionCard 
              title="Normal Distribution" 
              icon="stats-chart" 
              onPress={() => router.push('/utilities/normal')} 
            />
            <ActionCard 
              title="Binomial Distribution" 
              icon="pie-chart" 
              onPress={() => router.push('/utilities/binomial')} 
            />
            <ActionCard 
              title="Poisson Distribution" 
              icon="pulse" 
              onPress={() => router.push('/utilities/poisson')} 
            />
            <ActionCard 
              title="Exponential Distribution" 
              icon="trending-down" 
              onPress={() => router.push('/utilities/exponential')} 
            />
            <ActionCard 
              title="Student's t-Distribution" 
              icon="school" 
              onPress={() => router.push('/utilities/student_t')} 
            />
            <ActionCard 
              title="F-Distribution" 
              icon="analytics" 
              onPress={() => router.push('/utilities/f_distribution')} 
            />
            <ActionCard 
              title="Uniform Distribution" 
              icon="swap-horizontal" 
              onPress={() => router.push('/utilities/uniform')} 
            />
            <ActionCard 
              title="Geometric Distribution" 
              icon="git-commit" 
              onPress={() => router.push('/utilities/geometric')} 
            />
            <ActionCard 
              title="Chi-Square Distribution" 
              icon="git-network" 
              onPress={() => router.push('/utilities/chisquare')} 
            />
            <ActionCard 
              title="Weibull Distribution" 
              icon="water" 
              onPress={() => router.push('/utilities/weibull')} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistical Tables</Text>
          <View style={styles.cardsContainer}>
            <ActionCard 
              title="Z-Table (Normal)" 
              icon="grid" 
              onPress={() => router.push('/utilities/ztable')} 
            />
            <ActionCard 
              title="T-Table (Student's t)" 
              icon="grid" 
              onPress={() => router.push('/utilities/ttable')} 
            />
            <ActionCard 
              title="Chi-Square Table" 
              icon="grid" 
              onPress={() => router.push('/utilities/chitable')} 
            />
            <ActionCard 
              title="F-Table" 
              icon="grid" 
              onPress={() => router.push('/utilities/ftable')} 
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Simulations</Text>
          <View style={styles.cardsContainer}>
            <ActionCard 
              title="Sampling Distributions (CLT)" 
              icon="layers" 
              onPress={() => router.push('/utilities/sampling_distribution')} 
            />
            <ActionCard 
              title="Process Simulator" 
              icon="cog" 
              onPress={() => router.push('/utilities/process_simulator')} 
            />
          </View>
        </View>

        {/* We can add more sections here like Hypothesis Tests, Descriptive Stats, etc. */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100, // accommodate bottom tab bar
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  cardsContainer: {
    gap: 0, // Gap is handled by ActionCard marginBottom, or we can remove marginBottom there and use gap here
  },
});
