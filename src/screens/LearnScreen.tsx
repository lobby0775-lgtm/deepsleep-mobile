import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Linking,
} from 'react-native';

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  url?: string;
}

const ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Understanding Sleep Cycles',
    description: 'Learn about the different stages of sleep and why each is important for your health.',
    category: 'Basics',
    readTime: '5 min',
  },
  {
    id: '2',
    title: 'Sleep Hygiene Tips',
    description: 'Practical strategies to improve your sleep environment and bedtime routine.',
    category: 'Tips',
    readTime: '7 min',
  },
  {
    id: '3',
    title: 'Managing Insomnia',
    description: 'Evidence-based techniques for dealing with chronic sleep difficulties.',
    category: 'Treatment',
    readTime: '10 min',
  },
  {
    id: '4',
    title: 'The Link Between Sleep and Mental Health',
    description: 'How sleep affects mood, anxiety, and overall mental wellbeing.',
    category: 'Health',
    readTime: '8 min',
  },
  {
    id: '5',
    title: 'Sleep and Nutrition',
    description: 'Foods that help or hinder sleep, and timing your meals for better rest.',
    category: 'Lifestyle',
    readTime: '6 min',
  },
  {
    id: '6',
    title: 'Creating a Sleep Schedule',
    description: 'How to establish and maintain a consistent sleep-wake cycle.',
    category: 'Routine',
    readTime: '5 min',
  },
];

const RESOURCES = [
  {
    title: 'National Sleep Foundation',
    url: 'https://www.sleepfoundation.org',
  },
  {
    title: 'American Academy of Sleep Medicine',
    url: 'https://aasm.org',
  },
  {
    title: 'Sleep Health Journal',
    url: 'https://www.sleephealthjournal.org',
  },
  {
    title: 'CBT-I Coach (App)',
    url: 'https://mobile.va.gov/app/cbt-i-coach',
  },
];

export default function LearnScreen() {
  const openResource = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Sleep Education</Text>
          <Text style={styles.subtitle}>Learn about sleep science and healthy habits</Text>
        </View>

        {/* Featured Article */}
        <View style={styles.featuredCard}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>Featured</Text>
          </View>
          <Text style={styles.featuredTitle}>The Science of Sleep</Text>
          <Text style={styles.featuredDescription}>
            A comprehensive guide to understanding how sleep works and why it's essential for your health.
          </Text>
          <View style={styles.featuredMeta}>
            <Text style={styles.featuredCategory}>Basics</Text>
            <Text style={styles.featuredTime}>15 min read</Text>
          </View>
        </View>

        {/* Articles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Articles</Text>
          <View style={styles.articlesList}>
            {ARTICLES.map((article) => (
              <TouchableOpacity key={article.id} style={styles.articleCard}>
                <View style={styles.articleHeader}>
                  <Text style={styles.articleCategory}>{article.category}</Text>
                  <Text style={styles.articleTime}>{article.readTime}</Text>
                </View>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleDescription}>{article.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>External Resources</Text>
          <View style={styles.resourcesList}>
            {RESOURCES.map((resource, index) => (
              <TouchableOpacity
                key={index}
                style={styles.resourceCard}
                onPress={() => resource.url && openResource(resource.url)}
              >
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                <Text style={styles.resourceUrl}>{resource.url}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Tips</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tipCard}>
              <Text style={styles.tipIcon}>🌙</Text>
              <Text style={styles.tipText}>Keep your bedroom cool, dark, and quiet</Text>
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipIcon}>⏰</Text>
              <Text style={styles.tipText}>Go to bed and wake up at the same time every day</Text>
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipIcon}>📱</Text>
              <Text style={styles.tipText}>Avoid screens 1 hour before bedtime</Text>
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipIcon}>☕</Text>
              <Text style={styles.tipText}>Limit caffeine after 2 PM</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  featuredCard: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  featuredBadge: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  featuredBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 14,
    color: '#dbeafe',
    marginBottom: 16,
    lineHeight: 20,
  },
  featuredMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredTime: {
    fontSize: 12,
    color: '#dbeafe',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  articlesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  articleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  articleCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  articleTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  articleDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  resourcesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  resourceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  resourceUrl: {
    fontSize: 12,
    color: '#3b82f6',
  },
  tipsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  tipCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
    lineHeight: 20,
  },
});