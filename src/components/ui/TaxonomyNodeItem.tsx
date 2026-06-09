import Text from './Text';
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { router } from 'expo-router';

// Interfaces matching the DB schema relations
export interface Article {
  id: number;
  title: string;
}

export interface TaxonomyNode {
  id: number;
  name: string;
  type: 'MAIN_TOPIC' | 'CHAPTER' | 'CONCEPT';
  children?: TaxonomyNode[];
  articles?: Article[];
}

interface TaxonomyNodeItemProps {
  node: TaxonomyNode;
  level?: number;
}

export default function TaxonomyNodeItem({ node, level = 0 }: TaxonomyNodeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasChildren = node.children && node.children.length > 0;
  const hasArticles = node.articles && node.articles.length > 0;
  const isExpandable = hasChildren || hasArticles;

  const toggleExpand = () => {
    if (isExpandable) {
      setIsExpanded(!isExpanded);
    }
  };

  const renderNodeContent = () => {
    switch (node.type) {
      case 'MAIN_TOPIC':
        return (
          <TouchableOpacity 
            style={[styles.nodeContainer, styles.mainTopicContainer]} 
            onPress={toggleExpand}
            disabled={!isExpandable}
            activeOpacity={0.7}
          >
            <View style={styles.row}>
              <Text style={styles.mainTopicText}>{node.name}</Text>
              {isExpandable && (
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={colors.text} />
              )}
            </View>
          </TouchableOpacity>
        );

      case 'CHAPTER':
        return (
          <TouchableOpacity 
            style={[styles.nodeContainer, styles.chapterContainer]} 
            onPress={toggleExpand}
            disabled={!isExpandable}
            activeOpacity={0.7}
          >
            <View style={styles.row}>
              <Text style={styles.chapterText}>{node.name}</Text>
              {isExpandable && (
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color={colors.textSecondary} />
              )}
            </View>
          </TouchableOpacity>
        );

      case 'CONCEPT':
        return (
          <TouchableOpacity 
            style={[styles.nodeContainer, styles.conceptContainer]} 
            onPress={toggleExpand}
            disabled={!isExpandable}
            activeOpacity={0.7}
          >
            <View style={styles.row}>
              <View style={styles.conceptTitleRow}>
                <Ionicons name="git-commit" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.conceptText}>{node.name}</Text>
              </View>
              {isExpandable && (
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.primary} />
              )}
            </View>
          </TouchableOpacity>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={{ paddingLeft: level > 0 ? 16 : 0, marginBottom: node.type === 'MAIN_TOPIC' ? 16 : 0 }}>
      {renderNodeContent()}
      
      {isExpanded && (
        <View style={styles.childrenContainer}>
          {hasChildren && node.children!.map(child => (
            <TaxonomyNodeItem key={child.id} node={child} level={level + 1} />
          ))}

          {!hasChildren && hasArticles && (
            <View style={styles.articlesContainer}>
              {node.articles!.map(article => (
                <TouchableOpacity 
                  key={article.id} 
                  style={styles.articleCard}
                  onPress={() => router.push(`/article/${article.id}`)}
                >
                  <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.articleTitle}>{article.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  nodeContainer: {
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conceptTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainTopicContainer: {
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    paddingBottom: 8,
    marginBottom: 8,
  },
  mainTopicText: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginRight: 10,
  },
  chapterContainer: {
    paddingVertical: 10,
  },
  chapterText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: 10,
  },
  conceptContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  conceptText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginRight: 10,
  },
  childrenContainer: {
    marginTop: 4,
  },
  articlesContainer: {
    paddingLeft: 24,
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  articleTitle: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  }
});
