import React, { useContext, useEffect, useRef, useState } from 'react';
import { useMMKVString, useMMKVBoolean } from 'react-native-mmkv';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';
import { MenuContext } from '../context/MenuContext';
import { getAllHabitsFetch, getCategoriesFetch } from '../utils/fetch';
import { ICONS } from '../constants/icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getTranslatedHabit } from '../utils/habitTranslations';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const getOnboardingHabitTitle = (lang) => {
  const code = (lang || 'en').substring(0, 2).toLowerCase();
  switch (code) {
    case 'az': return 'Dərin Nəfəsalma';
    case 'tr': return 'Derin Nefes';
    case 'ru': return 'Глубокое дыхание';
    case 'es': return 'Respiración profunda';
    case 'fr': return 'Respiration profonde';
    case 'it': return 'Respirazione profonda';
    case 'de': return 'Tiefes Atmen';
    case 'zh': return '深呼吸';
    case 'ar': return 'التنفس العميق';
    default: return 'Deep Breathing';
  }
};

const CATEGORY_ICONS = [
  { key: 'default', icon: '⭐' },
  { key: 'health', icon: '❤️' },
  { key: 'fitness', icon: '💪' },
  { key: 'mindfulness', icon: '🧘' },
  { key: 'productivity', icon: '📈' },
  { key: 'learning', icon: '📚' },
  { key: 'social', icon: '👥' },
  { key: 'finance', icon: '💰' },
  { key: 'nutrition', icon: '🍎' },
  { key: 'sleep', icon: '😴' },
  { key: 'creativity', icon: '🎨' },
  { key: 'selfcare', icon: '💅' },
  { key: 'hydration', icon: '💧' },
  { key: 'work', icon: '💼' },
  { key: 'music', icon: '🎵' },
  { key: 'sports', icon: '⚽' },
  { key: 'nature', icon: '🌱' },
  { key: 'meditation', icon: '🕊️' },
  { key: 'coding', icon: '💻' },
  { key: 'travel', icon: '✈️' },
];

const getCategoryIcon = (iconKey) => {
  if (!iconKey) return '⭐';
  if ([...iconKey].length <= 2 && iconKey.codePointAt(0) > 255) return iconKey;
  const found = CATEGORY_ICONS.find(i => i.key === iconKey.toLowerCase());
  return found ? found.icon : '⭐';
};

const CreateHabitBottomSheet = () => {
  const { isCreateModalOpen, setIsCreateModalOpen } = useContext(MenuContext);
  const navigation = useNavigation();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [accessToken] = useMMKVString('accessToken');
  const [checklistCompleted] = useMMKVString("user.onboarding_checklist_completed");
  const [checklistSkipped] = useMMKVBoolean("user.onboarding_checklist_skipped");
  const guideScale = useRef(new Animated.Value(1)).current;
  const arrowTranslateY = useRef(new Animated.Value(0)).current;
  const [popularHabits, setPopularHabits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageSize, setPageSize] = useState(3);
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { colors } = theme;
  const { t, i18n } = useTranslation();

  const fetchPopularHabits = async (isLoadMore = false) => {
    if (!accessToken || (!hasMore && isLoadMore) || (isLoading || isLoadingMore)) return;

    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setPageIndex(0);
      }

      const currentIndex = isLoadMore ? pageIndex + 1 : 0;
      const currentPageSize = (checklistCompleted !== "true" && checklistSkipped !== true) ? 15 : pageSize;
      const response = await getAllHabitsFetch(accessToken, currentIndex, currentPageSize);

      if (response && response.data) {
        const newData = response.data;
        
        // Find if Deep Breathing template exists in the fetched list
        const deepBreathingIndex = newData.findIndex(h => {
          const titleLower = (h.title || "").toLowerCase();
          const matches = [
            "deep breathing", "deep-breathing", "dərin nəfəsalma", "dərin nəfəs", "derin nefes", "derin nefes alma",
            "глубокое дыхание", "respiración profunda", "respiration profonde", "respirazione profonda", "tiefes atmen",
            "深呼吸", "التنفس العميق"
          ];
          return matches.some(m => titleLower.includes(m) || m.includes(titleLower));
        });

        let sortedData = [...newData];
        if (deepBreathingIndex !== -1 && checklistCompleted !== "true" && checklistSkipped !== true) {
          // Remove from original position and prepend to index 0
          const [deepBreathingItem] = sortedData.splice(deepBreathingIndex, 1);
          sortedData = [deepBreathingItem, ...sortedData];
        }

        if (isLoadMore) {
          setPopularHabits(prev => [...prev, ...sortedData]);
          setPageIndex(currentIndex);
        } else {
          setPopularHabits(sortedData);
          setPageIndex(0);
        }

        if (newData.length < currentPageSize) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
    } catch (error) {
      console.log("Error fetching popular habits:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoading && !isLoadingMore && hasMore) {
      fetchPopularHabits(true);
    }
  };

  const fetchCategories = async () => {
    if (!accessToken) return;
    try {
      const response = await getCategoriesFetch(accessToken);
      if (response) {
        const list = Array.isArray(response) ? response : (response.data || []);
        setCategories(list);
      }
    } catch (error) {
      console.log("Error fetching categories in bottom sheet:", error);
    }
  };


  useEffect(() => {
    if (isCreateModalOpen) {
      fetchPopularHabits();
      fetchCategories();
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => setIsCreateModalOpen(false));
    }
  }, [isCreateModalOpen]);

  useEffect(() => {
    if (isCreateModalOpen && checklistCompleted !== "true" && checklistSkipped !== true) {
      const animation = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(guideScale, {
              toValue: 1.05,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(guideScale, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(arrowTranslateY, {
              toValue: 8,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(arrowTranslateY, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      guideScale.setValue(1);
      arrowTranslateY.setValue(0);
    }
  }, [isCreateModalOpen, checklistCompleted, checklistSkipped]);

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => setIsCreateModalOpen(false));
  };

  if (!isCreateModalOpen) return null;



  return (
    <Modal
      transparent
      visible={true}
      animationType="none"
      onRequestClose={closeModal}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <Animated.View style={[styles.overlay, { opacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
              backgroundColor: colors.card,
              paddingBottom: 20 + (insets.bottom > 0 ? insets.bottom : 20)
            }
          ]}
        >
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.cardSecondary }]} />
          </View>

          <View style={styles.content}>
            {(checklistCompleted === "true" || checklistSkipped === true) && (
              <>
                <Text className='font-redditsans-bold mb-5' style={{ color: colors.textSecondary }}>{t("create_habit.new_good_habit")}</Text>

                <View style={styles.inputContainer}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      closeModal();
                      navigation.navigate('Home', {
                        screen: 'CreateCustomHabit',
                        params: { isCustom: true }
                      });
                    }}
                    style={[
                      styles.inputShadowContainer, 
                      { 
                        backgroundColor: colors.card, 
                        borderColor: colors.border,
                        opacity: 1
                      }
                    ]}
                  >
                    <Text className="flex-1 font-redditsans-black" style={{ color: colors.textGray }}>
                      {t("create_habit.create_custom")}
                    </Text>
                    <View style={[styles.addIconContainer, { backgroundColor: colors.cardSecondary, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontSize: 20, color: colors.text, fontWeight: 'bold', lineHeight: 22, textAlign: 'center' }}>+</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {(checklistCompleted === "true" || checklistSkipped === true) && (
              <Text className='font-redditsans-bold mb-5 mt-5' style={{ color: colors.textSecondary }}>{t("create_habit.popular_habits")}</Text>
            )}

            <FlatList
                horizontal
                data={popularHabits}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                style={{ overflow: 'visible' }}
                contentContainerStyle={styles.popularHabitsList}
                onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={() => (
                isLoadingMore && (
                  <View style={styles.loaderFooter}>
                    <ActivityIndicator color={colors.primary} size="small" />
                  </View>
                )
              )}
              renderItem={({ item: habit }) => {
                const habitCategory = categories.find(c => c.id === habit.categoryId || c.name === habit.category);
                const titleLower = (habit.title || "").toLowerCase();
                const matches = [
                  "deep breathing", "deep-breathing", "dərin nəfəsalma", "dərin nəfəs", "derin nefes", "derin nefes alma",
                  "глубокое дыхание", "respiración profunda", "respiration profonde", "respirazione profonda", "tiefes atmen",
                  "深呼吸", "التنفس العميق"
                ];
                const isDeepBreathing = matches.some(m => titleLower.includes(m) || m.includes(titleLower));
                const isGuidanceActive = checklistCompleted !== "true" && checklistSkipped !== true && isDeepBreathing;

                return (
                  <View>
                    {isGuidanceActive && (
                      <View style={{ height: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                        <Animated.View 
                          style={{ 
                            alignItems: 'center',
                            transform: [{ translateY: arrowTranslateY }]
                          }}
                        >
                          <Text style={{ fontSize: 20 }}>👇</Text>
                        </Animated.View>
                      </View>
                    )}
                    {!isGuidanceActive && checklistCompleted !== "true" && checklistSkipped !== true && (
                      <View style={{ height: 45 }} />
                    )}
                  <Animated.View key={habit.id} style={{ transform: [{ scale: isGuidanceActive ? guideScale : 1 }] }}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.habitCard, 
                        { 
                          backgroundColor: (checklistCompleted !== "true" && checklistSkipped !== true && !isDeepBreathing) 
                            ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)') 
                            : colors.card, 
                          borderColor: isGuidanceActive ? colors.primary : colors.border,
                          borderWidth: isGuidanceActive ? 2 : 1,
                          opacity: (checklistCompleted !== "true" && checklistSkipped !== true && !isDeepBreathing) ? 0.3 : 1
                        }
                      ]}
                      onPress={() => {
                        closeModal();
                        navigation.navigate('Home', {
                          screen: 'CreateCustomHabit',
                          params: { 
                            habitData: habit, 
                            isCustom: false, 
                            isSuggested: false 
                          }
                        });
                      }}
                      disabled={checklistCompleted !== "true" && checklistSkipped !== true && !isDeepBreathing}
                      needsOffscreenAlphaCompositing={checklistCompleted !== "true" && checklistSkipped !== true && !isDeepBreathing}
                    >
                      <View style={[styles.habitIconContainer, { backgroundColor: colors.cardSecondary }]}>
                        <Text style={{ fontSize: 24 }}>{ICONS[habit.icon]}</Text>
                      </View>
                      <View>
                        <Text className='font-redditsans-bold' style={[styles.habitTitle, { color: colors.text }]} numberOfLines={1}>
                          {getTranslatedHabit(habit, i18n.language, t).title}
                        </Text>
                        <Text className='font-redditsans-regular' style={[styles.habitSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                          {t(`my_habits.filters.${habit.frequency.toLowerCase()}`)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                  </View>
                );
              }}
            />
          </View>

          <View style={styles.bottomSpacing} />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    paddingBottom: 40,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#f1f5f9',
  },
  content: {
    paddingHorizontal: 28,
    marginTop: 10,
  },
  sectionTitle: {

  },
  inputContainer: {
    marginBottom: 8,
  },
  inputShadowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  addIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  popularHabitsList: {
    paddingRight: 28,
    paddingTop: 10,
    paddingBottom: 10,
    marginBottom: 2,
  },
  habitCard: {
    width: 170,
    height: 120,
    borderRadius: 28,
    padding: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 16,
    justifyContent: 'space-between',
  },
  habitIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  habitTitle: {

  },

  bottomSpacing: {
    height: 20,
  },
  loaderFooter: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 120,
  }
});

export default CreateHabitBottomSheet;
