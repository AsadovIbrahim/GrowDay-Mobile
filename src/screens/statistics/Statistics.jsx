import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, RefreshControl } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faChartLine, faCalendarAlt, faCalendarCheck, faChevronLeft, faChevronRight, faTrophy, faFire, faChartBar } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';
import { useMMKVString } from "react-native-mmkv";
import Svg, { Circle, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, useAnimatedStyle, interpolateColor } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getDailyStatisticsFetch, getWeeklyStatisticsFetch, getMonthlyStatisticsFetch } from "../../utils/fetch";
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const Statistics = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const [token] = useMMKVString('accessToken');

  const [activeTab, setActiveTab] = useState('weekly'); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Animation shared values
  const progressValue = useSharedValue(0);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    progressValue.value = 0; // Reset animation
    try {
      let response;
      if (activeTab === 'daily') {
        const dateStr = selectedDate.toISOString().split('T')[0];
        response = await getDailyStatisticsFetch(token, dateStr);
      } else if (activeTab === 'weekly') {
        const day = selectedDate.getDay();
        const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(selectedDate);
        monday.setDate(diff);
        const weekStartStr = monday.toISOString().split('T')[0];
        response = await getWeeklyStatisticsFetch(token, weekStartStr);
      } else {
        response = await getMonthlyStatisticsFetch(token, selectedDate.getFullYear(), selectedDate.getMonth() + 1);
      }

      if (response && response.success) {
        setStats(response.data);
        // Trigger animation
        progressValue.value = withTiming(response.data.completionRate, { duration: 1500 });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, activeTab, selectedDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handlePrev = () => {
    const newDate = new Date(selectedDate);
    if (activeTab === 'daily') newDate.setDate(selectedDate.getDate() - 1);
    else if (activeTab === 'weekly') newDate.setDate(selectedDate.getDate() - 7);
    else newDate.setMonth(selectedDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    if (activeTab === 'daily') newDate.setDate(selectedDate.getDate() + 1);
    else if (activeTab === 'weekly') newDate.setDate(selectedDate.getDate() + 7);
    else newDate.setMonth(selectedDate.getMonth() + 1);
    
    if (newDate > new Date()) return;
    setSelectedDate(newDate);
  };

  const getHeaderText = () => {
    if (activeTab === 'daily') {
      return selectedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
    } else if (activeTab === 'weekly') {
      const day = selectedDate.getDay();
      const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(selectedDate);
      monday.setDate(diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return `${monday.getDate()} ${monday.toLocaleDateString(undefined, { month: 'short' })} - ${sunday.getDate()} ${sunday.toLocaleDateString(undefined, { month: 'short' })}`;
    } else {
      return selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
  };

  const CircularProgress = ({ label }) => {
    const size = width * 0.5;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const animatedProps = useAnimatedProps(() => ({
      strokeDashoffset: circumference - (progressValue.value / 100) * circumference,
    }));

    return (
      <View className="items-center py-6">
        <View style={{ width: size, height: size }} className="justify-center items-center">
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.border}
              strokeWidth={strokeWidth}
              fill="none"
              opacity={0.2}
            />
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.primary}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              animatedProps={animatedProps}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <View className="absolute items-center">
            <Animated.Text style={{ color: colors.text }} className="text-4xl font-redditsans-bold">
               {Math.round(stats?.completionRate || 0)}%
            </Animated.Text>
            <Text style={{ color: colors.textSecondary }} className="text-sm font-redditsans-medium">
              {label}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={colors.backgroundGradient} className="flex-1">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-2 mb-6">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full items-center justify-center mr-4 shadow-sm"
              style={{ backgroundColor: colors.card }}
            >
              <FontAwesomeIcon icon={faArrowLeft} color={colors.text} size={20} />
            </TouchableOpacity>
            <Text style={{ color: colors.text }} className="text-2xl font-redditsans-bold">
              {t('statistics.header')}
            </Text>
          </View>
          <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
            <FontAwesomeIcon icon={faChartLine} color={colors.primary} size={18} />
          </View>
        </View>

        {/* Tab Switcher */}
        <View className="flex-row mx-5 p-1 rounded-2xl mb-6 shadow-sm" style={{ backgroundColor: colors.card }}>
          {['daily', 'weekly', 'monthly'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                setActiveTab(tab);
                setSelectedDate(new Date());
              }}
              className="flex-1 py-3 items-center rounded-xl"
              style={{ 
                backgroundColor: activeTab === tab ? colors.primary : 'transparent',
                elevation: activeTab === tab ? 4 : 0,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: activeTab === tab ? 0.3 : 0,
                shadowRadius: 4
              }}
            >
              <Text 
                className={`font-redditsans-bold text-xs ${activeTab === tab ? 'text-white' : ''}`}
                style={{ color: activeTab === tab ? '#FFF' : colors.textSecondary }}
              >
                {t(`statistics.${tab}`).toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView 
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Date Selector */}
          <View className="flex-row justify-between items-center mb-8 p-4 rounded-3xl shadow-sm" style={{ backgroundColor: colors.card }}>
            <TouchableOpacity onPress={handlePrev} className="w-10 h-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.backgroundGradient[0] }}>
              <FontAwesomeIcon icon={faChevronLeft} color={colors.primary} size={16} />
            </TouchableOpacity>
            <Text style={{ color: colors.text }} className="text-base font-redditsans-bold">
              {getHeaderText()}
            </Text>
            <TouchableOpacity 
              onPress={handleNext} 
              className="w-10 h-10 items-center justify-center rounded-full"
              style={{ backgroundColor: selectedDate < new Date() ? colors.backgroundGradient[0] : 'transparent' }}
              disabled={selectedDate.toDateString() === new Date().toDateString()}
            >
              <FontAwesomeIcon 
                icon={faChevronRight} 
                color={selectedDate < new Date() ? colors.primary : colors.textMuted} 
                size={16} 
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.textSecondary }} className="mt-4 font-redditsans-medium">{t('common.loading')}</Text>
            </View>
          ) : stats ? (
            <>
              {/* Circular Progress Section */}
              <View className="items-center mb-6">
                <CircularProgress label={t('statistics.completion_rate')} />
              </View>

              {/* Stats Grid */}
              <View className="flex-row gap-4 mb-6">
                <View className="flex-1 p-5 rounded-3xl shadow-sm" style={{ backgroundColor: colors.card }}>
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="w-10 h-10 rounded-2xl items-center justify-center" style={{ backgroundColor: '#22c55e20' }}>
                      <FontAwesomeIcon icon={faCalendarCheck} color="#22c55e" size={20} />
                    </View>
                    <Text className="text-[10px] font-redditsans-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">+{Math.round(stats.completionRate)}%</Text>
                  </View>
                  <Text style={{ color: colors.text }} className="text-3xl font-redditsans-bold">{stats.completedCount}</Text>
                  <Text style={{ color: colors.textSecondary }} className="text-xs font-redditsans-medium">{t('statistics.habits_completed')}</Text>
                </View>

                <View className="flex-1 p-5 rounded-3xl shadow-sm" style={{ backgroundColor: colors.card }}>
                   <View className="flex-row justify-between items-start mb-4">
                    <View className="w-10 h-10 rounded-2xl items-center justify-center" style={{ backgroundColor: '#ef444420' }}>
                      <FontAwesomeIcon icon={faCalendarAlt} color="#ef4444" size={20} />
                    </View>
                    <Text className="text-[10px] font-redditsans-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-full">-{Math.round(stats.missedRate)}%</Text>
                  </View>
                  <Text style={{ color: colors.text }} className="text-3xl font-redditsans-bold">{stats.missedCount}</Text>
                  <Text style={{ color: colors.textSecondary }} className="text-xs font-redditsans-medium">{t('statistics.habits_missed')}</Text>
                </View>
              </View>

              {/* Advanced Insights */}
              <View className="p-6 rounded-3xl mb-6 shadow-sm" style={{ backgroundColor: colors.card }}>
                <View className="flex-row items-center mb-6">
                   <View className="w-8 h-8 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: '#f59e0b20' }}>
                      <FontAwesomeIcon icon={faTrophy} color="#f59e0b" size={16} />
                   </View>
                   <Text style={{ color: colors.text }} className="text-lg font-redditsans-bold">
                    {t('statistics.performance_overview')}
                  </Text>
                </View>
                
                <View className="space-y-6">
                  {/* Progress Bar Item */}
                  <View className="mb-6">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center">
                        <FontAwesomeIcon icon={faFire} color={colors.primary} size={14} className="mr-2" />
                        <Text style={{ color: colors.textSecondary }} className="text-sm font-redditsans-medium">
                          {t('statistics.consistency_score')}
                        </Text>
                      </View>
                      <Text style={{ color: colors.primary }} className="text-base font-redditsans-bold">
                        {Math.round(stats.completionRate)}/100
                      </Text>
                    </View>
                    <View className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <Animated.View 
                        style={{ 
                          width: `${stats.completionRate}%`, 
                          backgroundColor: colors.primary,
                          height: '100%' 
                        }} 
                      />
                    </View>
                  </View>

                  <View style={{ backgroundColor: colors.primary + '08' }} className="p-4 rounded-2xl border border-primary/10">
                    <Text style={{ color: colors.textSecondary }} className="text-sm italic font-redditsans-regular leading-6 text-center">
                      {stats.completionRate >= 80 
                        ? t('statistics.keep_going')
                        : t('statistics.improve_hint')
                      }
                    </Text>
                  </View>
                </View>
              </View>

              {/* Extra Summary Row */}
              <View className="flex-row gap-4 mb-8">
                 <View className="flex-1 p-5 rounded-3xl flex-row items-center shadow-sm" style={{ backgroundColor: colors.card }}>
                    <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.primary + '15' }}>
                       <FontAwesomeIcon icon={faChartBar} color={colors.primary} size={18} />
                    </View>
                    <View>
                       <Text style={{ color: colors.textSecondary }} className="text-[10px] font-redditsans-bold uppercase tracking-wider">{t('statistics.daily_average')}</Text>
                       <Text style={{ color: colors.text }} className="text-lg font-redditsans-bold">
                          {activeTab === 'daily' ? '1.0' : (stats.completedCount / (activeTab === 'weekly' ? 7 : 30)).toFixed(1)}
                       </Text>
                    </View>
                 </View>
              </View>
            </>
          ) : (
            <View className="items-center py-20 bg-white/5 rounded-3xl border border-white/10 mx-5">
              <FontAwesomeIcon icon={faChartLine} color={colors.textMuted} size={48} />
              <Text style={{ color: colors.textSecondary }} className="mt-4 font-redditsans-medium">
                {t('common.none_found')}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Statistics;
