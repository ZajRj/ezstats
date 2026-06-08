import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { db, recordActivity } from '../../src/db/database';
import * as schema from '../../src/db/schema';
import { eq, asc } from 'drizzle-orm';
import { Ionicons } from '@expo/vector-icons';
import InteractiveFormula from '../../src/components/ui/InteractiveFormula';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ArticleWithBlocks = {
  id: number;
  title: string;
  blocks: {
    id: number;
    type: 'TEXT' | 'FORMULA' | 'TIP';
    bodyContent: string;
    metadataJson: any;
  }[];
};

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [article, setArticle] = useState<ArticleWithBlocks | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadArticle() {
      if (!id) return;
      try {
        const data = await db.query.articles.findFirst({
          where: eq(schema.articles.id, parseInt(id, 10)),
          with: {
            blocks: {
              orderBy: [asc(schema.articleBlocks.orderIndex)]
            }
          }
        });
        setArticle(data as unknown as ArticleWithBlocks);
        if (data) {
          recordActivity(data.title, 'ARTICLE', `/article/${id}`);
        }
      } catch (error) {
        console.error("Error loading article", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadArticle();
  }, [id]);

  const renderBlock = (block: ArticleWithBlocks['blocks'][0]) => {
    switch (block.type) {
      case 'TEXT':
        return (
          <Text key={block.id} style={styles.textBlock}>
            {block.bodyContent}
          </Text>
        );
      case 'FORMULA':
        return (
          <View key={block.id} style={{ marginVertical: 10 }}>
            <InteractiveFormula 
              formulaLatex={block.bodyContent} 
              tokensMetadata={block.metadataJson || {}} 
            />
          </View>
        );
      case 'TIP':
        return (
          <View key={block.id} style={styles.tipBlock}>
            <Ionicons name="bulb-outline" size={20} color={colors.primary} style={{marginRight: 8, marginTop: 2}} />
            <Text style={styles.tipText}>{block.bodyContent}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Error</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>Article not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {article.title}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{article.title}</Text>
        <View style={styles.blocksContainer}>
          {article.blocks.map(renderBlock)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  blocksContainer: {
    gap: 20,
  },
  textBlock: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  formulaBlock: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  formulaText: {
    fontSize: 18,
    fontFamily: 'monospace',
    color: colors.text,
    marginBottom: 12,
  },
  metadataContainer: {
    alignSelf: 'stretch',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  metadataText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  tipBlock: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: colors.primary,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  }
});
