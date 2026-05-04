import React, { useContext, useEffect, useRef,useState } from 'react';
import { useMMKVString } from 'react-native-mmkv';
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
import { getAllHabitsFetch } from '../utils/fetch';
import { ICONS } from '../constants/icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CreateHabitBottomSheet = () => {
  const { isCreateModalOpen, setIsCreateModalOpen } = useContext(MenuContext);
  const navigation = useNavigation();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;
   const [accessToken] = useMMKVString('accessToken');
   const [popularHabits, setPopularHabits] = useState([]);
   const [pageIndex, setPageIndex] = useState(0);
   const [isLoading, setIsLoading] = useState(false);
   const [isLoadingMore, setIsLoadingMore] = useState(false);
   const [hasMore, setHasMore] = useState(true);
   const [pageSize, setPageSize] = useState(3);
   const { theme } = useTheme();
   const { colors } = theme;
   const { t } = useTranslation();

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
      const response = await getAllHabitsFetch(accessToken, currentIndex, pageSize);
      
      if (response && response.data) {
        const newData = response.data;
        if (isLoadMore) {
          setPopularHabits(prev => [...prev, ...newData]);
          setPageIndex(currentIndex);
        } else {
          setPopularHabits(newData);
          setPageIndex(0);
        }
        
        if (newData.length < pageSize) {
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
      
      
  useEffect(() => {
    if (isCreateModalOpen) {
      fetchPopularHabits();
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
    >
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <Animated.View style={[styles.overlay, { opacity }]} />
        </TouchableWithoutFeedback>
        
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY }], backgroundColor: colors.card }
          ]}
        >
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.cardSecondary }]} />
          </View>

          <View style={styles.content}>
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
                style={[styles.inputShadowContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text className="flex-1 font-redditsans-black" style={{ color: colors.textGray }}>
                  {t("create_habit.create_custom")}
                </Text>
                <View style={[styles.addIconContainer, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
                   <FontAwesomeIcon icon={faPlus} size={14} color={colors.text} />
                </View>
              </TouchableOpacity>
            </View>

            <Text className='font-redditsans-bold mb-5 mt-5' style={{ color: colors.textSecondary }}>{t("create_habit.popular_habits")}</Text>
            
            <FlatList
              horizontal
              data={popularHabits}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
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
              renderItem={({ item: habit }) => (
                <TouchableOpacity
                  key={habit.id}
                  activeOpacity={0.8}
                  style={[styles.habitCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    closeModal();
                    navigation.navigate('Home', { 
                      screen: 'CreateCustomHabit',
                      params: { habitData: habit, isCustom: false, isSuggested: false } 
                    });
                  }}
                >
                  <View style={[styles.habitIconContainer, { backgroundColor: colors.cardSecondary }]}>
                    <Text style={{ fontSize: 24 }}>{ICONS[habit.icon]}</Text>
                  </View>
                  <View>
                    <Text className='font-redditsans-bold' style={[styles.habitTitle, { color: colors.text }]}>{habit.title}</Text>
                    <Text className='font-redditsans-regular' style={[styles.habitSubtitle, { color: colors.textSecondary }]}>{t(`my_habits.filters.${habit.frequency.toLowerCase()}`)}</Text>
                  </View>
                </TouchableOpacity>
              )}
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
    marginBottom:2,
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
