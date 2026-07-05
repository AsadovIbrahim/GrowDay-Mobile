import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { getTranslatedCategory, getTranslatedHabit } from '../../utils/habitTranslations';
import { useMMKVString } from 'react-native-mmkv';
import { markLearningContentAsReadFetch, getUserSuggestedHabitsFetch, getUserHabitFetch } from '../../utils/fetch';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faCheckCircle, faClock, faBrain } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import SuggestedHabitCard from '../../components/SuggestedHabitCard';

const ArticleDetailScreen = () => {
  const { theme } = useTheme();
  const { colors } = theme;
  const navigation = useNavigation();
  const route = useRoute();

  // Extract article data passed from Explore screen
  const { article } = route.params || {};
  const { t, i18n } = useTranslation();

  const { height } = Dimensions.get('window');

  const [token] = useMMKVString('accessToken');
  const [isReadLocal, setIsReadLocal] = useState(article?.isRead || false);

  useEffect(() => {
    if (article && !article.isRead && token && article.id) {
      markLearningContentAsReadFetch(token, article.id)
        .then(res => {
          if (res.success !== false) { // it might just return the updated DTO, checking strictly false is safer if format varies
            setIsReadLocal(true);
          }
        })
        .catch(err => console.log('Error marking as read:', err));
    }
  }, [article, token]);

  const [relatedHabits, setRelatedHabits] = useState([]);
  const [loadingHabits, setLoadingHabits] = useState(true);

  useEffect(() => {
    if (!token || !article.category) return;

    const loadRelatedHabits = async () => {
      try {
        setLoadingHabits(true);
        const suggestedRes = await getUserSuggestedHabitsFetch(token, 0, 100);
        const suggestedList = suggestedRes?.data || [];

        const userHabitsRes = await getUserHabitFetch(token, 0, 100);
        const userHabitsList = userHabitsRes?.data || [];

        const isHabitAlreadyAdded = (suggestedHabit, currentUserHabits) => {
          if (!currentUserHabits || currentUserHabits.length === 0) return false;
          const normalize = (str) => {
            if (!str) return "";
            return str.toString()
              .toLowerCase()
              .replace(/[.,/#!$%^&*;:{}=\-_`~()\s]/g, "")
              .trim();
          };
          const { title: suggestedTitle } = getTranslatedHabit(suggestedHabit, i18n.language, t);
          const normalizedSuggested = normalize(suggestedTitle);
          const normalizedSuggestedRaw = normalize(suggestedHabit.title);
          const suggestedId = String(suggestedHabit.id);

          return currentUserHabits.some(userHabit => {
            if (
              String(userHabit.suggestedHabitId) === suggestedId ||
              String(userHabit.habitId) === suggestedId ||
              String(userHabit.id) === suggestedId
            ) {
              return true;
            }
            const { title: userHabitTitle } = getTranslatedHabit(userHabit, i18n.language, t);
            const normalizedUserHabit = normalize(userHabitTitle);
            const normalizedUserHabitRaw = normalize(userHabit.title);

            if (normalizedSuggested && normalizedUserHabit && normalizedSuggested === normalizedUserHabit) return true;
            if (normalizedSuggestedRaw && normalizedUserHabitRaw && normalizedSuggestedRaw === normalizedUserHabitRaw) return true;
            if (normalizedSuggested && normalizedUserHabitRaw && normalizedSuggested === normalizedUserHabitRaw) return true;
            if (normalizedSuggestedRaw && normalizedUserHabit && normalizedSuggestedRaw === normalizedUserHabit) return true;

            if (userHabit.habit) {
              const nestedHabitTitle = normalize(userHabit.habit.title);
              if (nestedHabitTitle && (nestedHabitTitle === normalizedSuggested || nestedHabitTitle === normalizedSuggestedRaw)) return true;
            }
            return false;
          });
        };

        const articleCategory = (article.category || 'General').toLowerCase().trim();
        const filtered = suggestedList.filter(h => {
          if (!h) return false;
          if (isHabitAlreadyAdded(h, userHabitsList)) return false;
          const habitCategory = (h.category || h.categoryDetails?.name || '').toLowerCase().trim();
          return habitCategory === articleCategory;
        });

        setRelatedHabits(filtered);
      } catch (err) {
        console.log('Error loading related habits:', err);
      } finally {
        setLoadingHabits(false);
      }
    };

    loadRelatedHabits();
  }, [article.category, token, i18n.language, t]);

  const handleSuggestedHabitPress = (habit) => {
    navigation.navigate("CreateCustomHabit", {
      habitData: {
        id: habit.id,
        title: habit.title,
        description: habit.description || habit.title,
        icon: habit.icon || "star",
        category: habit.category || "General",
        categoryId: habit.categoryId || null,
        frequency: habit.frequency || "Daily",
        targetValue: habit.targetValue || 1,
        unit: habit.unit || "times",
        incrementValue: habit.incrementValue || 1,
        durationInMinutes: habit.durationInMinutes,
        notificationTime: habit.notificationTime || habit.NotificationTime,
        titleTranslations: habit.titleTranslations || habit.TitleTranslations,
        descriptionTranslations: habit.descriptionTranslations || habit.DescriptionTranslations,
      },
      isCustom: false,
      isSuggested: true
    });
  };

  if (!article) return null;

  // Calculate read time based on word count (avg 200 words per minute)
  const wordCount = article.content ? article.content.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  // Try to force high resolution for known image providers (like Unsplash) by replacing width parameters
  const getHighResImageUrl = (url) => {
    if (!url) return null;
    // Replace w=400 with w=2000 for higher quality
    if (url.includes('w=') || url.includes('width=')) {
      return url.replace(/w=\d+/g, 'w=2000').replace(/width=\d+/g, 'width=2000');
    }
    return url;
  };

  const highResImage = getHighResImageUrl(article.imageUrl || article.image);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />

      {/* ── Fixed Header ── */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('explore.article_header')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Hero Image ── */}
        <View style={[styles.imageContainer, { height: height * 0.32 }]}>
          <Image
            source={{ uri: highResImage }}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.categoryText}>{getTranslatedCategory(article.category || 'General', i18n.language, t)}</Text>
            </View>
          </View>
        </View>

        {/* ── Content ── */}
        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {article.title}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <FontAwesomeIcon icon={faClock} size={14} color={colors.textSecondary || '#888'} />
              <Text style={[styles.metaText, { color: colors.textSecondary || '#888' }]}>
                {t('explore.read_time', { count: readTime })}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <FontAwesomeIcon icon={faCheckCircle} size={14} color={isReadLocal ? colors.primary : (colors.textSecondary || '#888')} />
              <Text style={[styles.metaText, { color: isReadLocal ? colors.primary : (colors.textSecondary || '#888') }]}>
                {isReadLocal ? t('explore.read') : t('explore.unread')}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border || '#333' }]} />

          <Text style={[styles.bodyText, { color: colors.text }]}>
            {article.content}
          </Text>

          {/* Related Habits Carousel */}
          {loadingHabits ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            relatedHabits.length > 0 && (
              <View style={styles.relatedSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('explore.related_habits')}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.relatedList}
                >
                  {relatedHabits.map((habit) => (
                    <SuggestedHabitCard
                      key={habit.id}
                      habit={habit}
                      icon={habit.icon}
                      name={habit.title}
                      frequency={habit.frequency}
                      onPress={() => handleSuggestedHabitPress(habit)}
                    />
                  ))}
                </ScrollView>
              </View>
            )
          )}

          {/* Ask AI Mentor Card */}
          <TouchableOpacity
            style={[styles.aiMentorCard, { backgroundColor: colors.card, borderColor: colors.border || '#333' }]}
            onPress={() => {
              navigation.navigate('Home', {
                screen: 'AIMentorChat',
                params: {
                  initialPrompt: t('explore.ask_ai_prompt', { title: article.title })
                }
              });
            }}
          >
            <View style={styles.aiMentorHeader}>
              <View style={[styles.aiMentorIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <FontAwesomeIcon icon={faBrain} size={20} color={colors.primary} />
              </View>
              <View style={styles.aiMentorTextContainer}>
                <Text style={[styles.aiMentorTitle, { color: colors.text }]}>
                  {t('explore.ask_ai_mentor')}
                </Text>
                <Text style={[styles.aiMentorDesc, { color: colors.textSecondary }]}>
                  {t('explore.ask_ai_mentor_desc')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    zIndex: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'RedditSans-SemiBold',
  },
  headerRight: {
    width: 30, // to balance the flex space with back button
  },
  scrollContent: {
    paddingBottom: 120,
  },
  imageContainer: {
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.1)', // Subtle gradient/darken effect could go here
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'RedditSans-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentContainer: {
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontFamily: 'RedditSans-Bold',
    lineHeight: 34,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontFamily: 'RedditSans-Medium',
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 24,
    opacity: 0.5,
  },
  bodyText: {
    fontSize: 16,
    fontFamily: 'RedditSans-Regular',
    lineHeight: 28,
    marginBottom: 20,
  },
  loaderContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'RedditSans-Bold',
    marginBottom: 15,
  },
  relatedList: {
    paddingRight: 20,
  },
  aiMentorCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  aiMentorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  aiMentorIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiMentorTextContainer: {
    flex: 1,
    gap: 4,
  },
  aiMentorTitle: {
    fontSize: 16,
    fontFamily: 'RedditSans-Bold',
  },
  aiMentorDesc: {
    fontSize: 12,
    fontFamily: 'RedditSans-Regular',
    lineHeight: 16,
  }
});

export default ArticleDetailScreen;
