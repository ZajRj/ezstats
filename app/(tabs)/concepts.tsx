import Text from '../../src/components/ui/Text';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../../src/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../src/db/database';
import * as schema from '../../src/db/schema';
import { isNull } from 'drizzle-orm';
import TaxonomyNodeItem, { TaxonomyNode } from '../../src/components/ui/TaxonomyNodeItem';

import Background from '../../src/components/ui/Background';

export default function ConceptsLibrary() {
  const insets = useSafeAreaInsets();
  const [nodes, setNodes] = useState<TaxonomyNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTaxonomy() {
      try {
        const rootNodes = await db.query.taxonomyTags.findMany({
          where: isNull(schema.taxonomyTags.parentId),
          with: {
            children: {
              with: {
                children: {
                  with: {
                    articles: true,
                  }
                }
              }
            }
          }
        });
        
        // Cast the result to our UI interface type. Drizzle infers it very closely.
        setNodes(rootNodes as unknown as TaxonomyNode[]);
      } catch (error) {
        console.error("Error loading taxonomy", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Slight delay to ensure DB setup/seeding is done
    setTimeout(loadTaxonomy, 500);
  }, []);

  return (
    <View style={styles.container}>
      <Background />
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.headerTitle}>Concepts Library</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {nodes.length === 0 ? (
            <Text style={styles.emptyText}>No concepts available yet.</Text>
          ) : (
            nodes.map(node => (
              <TaxonomyNodeItem key={node.id} node={node} />
            ))
          )}
        </ScrollView>
      )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 40,
  }
});
