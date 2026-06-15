import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, RefreshControl, Modal, Alert, Share, Linking } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faChartLine, faCalendarAlt, faCalendarCheck, faChevronLeft, faChevronRight, faTrophy, faFire, faChartBar, faBrain } from '@fortawesome/free-solid-svg-icons';
import { API_URL } from '@env';
import { useNavigation } from '@react-navigation/native';
import { useMMKVString } from "react-native-mmkv";
import { storage } from '../../utils/MMKVStore';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, useAnimatedStyle, interpolateColor } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getDailyStatisticsFetch, getWeeklyStatisticsFetch, getMonthlyStatisticsFetch, getYearlyStatisticsFetch, getUserTotalXPFetch, getMoodHistoryFetch, getUserHabitFetch } from "../../utils/fetch";
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLocalMoodHistory } from '../../utils/MoodLocalStore';



const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const Statistics = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const { t, i18n } = useTranslation();
  const [token] = useMMKVString('accessToken');

  const [activeTab, setActiveTab] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isYearPickerVisible, setYearPickerVisible] = useState(false);
  const [points, setPoints] = useState(0);
  const [moodHistory, setMoodHistory] = useState([]);
  const [habits, setHabits] = useState([]);
  const [prevStats, setPrevStats] = useState(null);


  const loadMoodData = useCallback(async () => {
    // 1. Load from MMKV local storage
    const localData = getLocalMoodHistory(token);
    setMoodHistory(localData);

    // 2. Fetch from backend API if available
    if (token) {
      try {
        const response = await getMoodHistoryFetch(token, 30);
        if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
          const normalized = response.data.map(entry => ({
            date: entry.date ? entry.date.split('T')[0] : '',
            mood: entry.mood.toLowerCase(),
            emoji: entry.emoji
          }));
          setMoodHistory(normalized);
        }
      } catch (err) {
        console.log("Backend mood fetch failed, using local history fallback:", err);
      }
    }
  }, [token]);

  useEffect(() => {
    loadMoodData();
  }, [loadMoodData]);

  // Helper to get last 7 days strings and names
  const getLast7DaysList = () => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dayOfWeek = d.getDay();
      const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayLabel = t(`home.day_names.${dayKeys[dayOfWeek]}`).slice(0, 3);
      list.push({ dateStr, dayLabel });
    }
    return list;
  };

  // Helper to map mood key to emoji and color
  const getMoodMeta = (moodKey) => {
    const meta = {
      energetic: { emoji: '😄', color: '#F59E0B' },
      happy: { emoji: '😊', color: '#EC4899' },
      peaceful: { emoji: '😌', color: '#10B981' },
      neutral: { emoji: '😐', color: '#6B7280' },
      sad: { emoji: '😔', color: '#8B5CF6' },
      tired: { emoji: '😫', color: '#3B82F6' },
      stressed: { emoji: '😡', color: '#EF4444' },
    };
    return meta[moodKey] || null;
  };

  // Helper to get distribution breakdown
  const getMoodStatsBreakdown = () => {
    const counts = {
      energetic: 0,
      happy: 0,
      peaceful: 0,
      neutral: 0,
      sad: 0,
      tired: 0,
      stressed: 0
    };

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const entriesWithin30Days = moodHistory.filter(entry => entry.date >= thirtyDaysAgoStr);
    const total = entriesWithin30Days.length;

    if (total === 0) return { total: 0, distribution: [] };

    entriesWithin30Days.forEach(entry => {
      if (counts[entry.mood] !== undefined) {
        counts[entry.mood]++;
      }
    });

    const moodsMetadata = [
      { key: 'energetic', emoji: '😄', label: t('home.mood_labels.energetic'), color: '#F59E0B' },
      { key: 'happy', emoji: '😊', label: t('home.mood_labels.happy'), color: '#EC4899' },
      { key: 'peaceful', emoji: '😌', label: t('home.mood_labels.peaceful'), color: '#10B981' },
      { key: 'neutral', emoji: '😐', label: t('home.mood_labels.neutral'), color: '#6B7280' },
      { key: 'sad', emoji: '😔', label: t('home.mood_labels.sad'), color: '#8B5CF6' },
      { key: 'tired', emoji: '😫', label: t('home.mood_labels.tired'), color: '#3B82F6' },
      { key: 'stressed', emoji: '😡', label: t('home.mood_labels.stressed'), color: '#EF4444' },
    ];

    const distribution = moodsMetadata.map(mood => {
      const count = counts[mood.key];
      const percentage = Math.round((count / total) * 100);
      return {
        ...mood,
        count,
        percentage
      };
    }).sort((a, b) => b.percentage - a.percentage);

    return { total, distribution };
  };

  // Production best practice: Show years from app launch year (e.g. 2024) up to current year
  const currentYear = new Date().getFullYear();
  const startYear = 2024; // You can change this to the user's registration year if available
  const yearsList = Array.from({ length: Math.max(1, currentYear - startYear + 1) }, (_, i) => currentYear - i);

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
        setPrevStats(null);
      } else if (activeTab === 'weekly') {
        const day = selectedDate.getDay();
        const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(selectedDate);
        monday.setDate(diff);
        const weekStartStr = monday.toISOString().split('T')[0];
        response = await getWeeklyStatisticsFetch(token, weekStartStr);

        try {
          const prevMonday = new Date(monday);
          prevMonday.setDate(prevMonday.getDate() - 7);
          const prevWeekStartStr = prevMonday.toISOString().split('T')[0];
          const prevRes = await getWeeklyStatisticsFetch(token, prevWeekStartStr);
          if (prevRes && prevRes.success) {
            setPrevStats(prevRes.data);
          } else {
            setPrevStats(null);
          }
        } catch (err) {
          console.log("Failed to fetch previous week stats:", err);
          setPrevStats(null);
        }
      } else if (activeTab === 'monthly') {
        response = await getMonthlyStatisticsFetch(token, selectedDate.getFullYear(), selectedDate.getMonth() + 1);

        try {
          const prevMonthDate = new Date(selectedDate);
          prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
          const prevRes = await getMonthlyStatisticsFetch(token, prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1);
          if (prevRes && prevRes.success) {
            setPrevStats(prevRes.data);
          } else {
            setPrevStats(null);
          }
        } catch (err) {
          console.log("Failed to fetch previous month stats:", err);
          setPrevStats(null);
        }
      } else {
        response = await getYearlyStatisticsFetch(token, selectedDate.getFullYear());
        setPrevStats(null);
      }

      if (response && response.success) {
        setStats(response.data);
        // Trigger animation
        progressValue.value = withTiming(response.data.completionRate, { duration: 1500 });
      }

      const ptsRes = await getUserTotalXPFetch(token);
      if (ptsRes && ptsRes.success) {
        setPoints(ptsRes.data ?? 0);
      }

      if (activeTab === 'monthly' || activeTab === 'yearly') {
        try {
          const habitsRes = await getUserHabitFetch(token, 0, 100);
          if (habitsRes && habitsRes.success && Array.isArray(habitsRes.data)) {
            setHabits(habitsRes.data);
          }
        } catch (habitsErr) {
          console.log("Failed to fetch habits for extra statistics:", habitsErr);
        }
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, activeTab, selectedDate, progressValue]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  // Future Enhancements: Structure for Mood Score and Mood Trend Calculations
  const getMoodScore = () => {
    // TODO: Implement scoring logic for daily mood logs (e.g. happy = 5, stressed = 1)
    return null;
  };

  const getMoodTrend = () => {
    // TODO: Implement trend analysis over last 30 days (e.g. rising, falling, stable)
    return null;
  };

  const getAICoachInsight = () => {
    if (!stats) return [];

    // Find the most frequent mood from last 30 days breakdown
    const { total, distribution } = getMoodStatsBreakdown();
    const topMood = distribution.length > 0 ? distribution[0] : null;

    const candidateInsights = [];

    // 1. Mood Based Candidate
    if (topMood) {
      candidateInsights.push({
        emoji: topMood.emoji,
        text: t('statistics.insight_most_common_mood', { mood: topMood.label })
      });
    }

    // 2. Habit Completion Rate Change Candidate
    if (prevStats) {
      const change = Math.round(stats.completionRate - prevStats.completionRate);
      if (change > 0) {
        candidateInsights.push({
          emoji: '📈',
          text: t('statistics.insight_completion_improved', { change })
        });
      } else if (change < 0) {
        candidateInsights.push({
          emoji: '📉',
          text: t('statistics.insight_completion_decreased', { change: Math.abs(change) })
        });
      } else {
        candidateInsights.push({
          emoji: '📊',
          text: t('statistics.insight_completion_stable')
        });
      }
    } else {
      candidateInsights.push({
        emoji: '📈',
        text: t('statistics.insight_completion_rate', { rate: Math.round(stats.completionRate) })
      });
    }

    // 3. Best Streak Candidate
    if (bestStreakVal > 0) {
      candidateInsights.push({
        emoji: '🔥',
        text: t('statistics.insight_best_streak', { streak: bestStreakVal })
      });
    }

    // 4. Combined / Stability Candidate
    const isMoodStable = topMood && total > 0 && (distribution[0].count / total) >= 0.5;
    if (topMood && (topMood.key === 'peaceful' || topMood.key === 'happy' || topMood.key === 'energetic') && stats.completionRate >= 70) {
      candidateInsights.push({
        emoji: '🧠',
        text: t('statistics.insight_positive_mood_completion', { mood: topMood.label, emoji: topMood.emoji })
      });
    } else if (isMoodStable) {
      candidateInsights.push({
        emoji: '📊',
        text: t('statistics.insight_mood_stable_consistency')
      });
    } else if (bestStreakVal >= 5 && topMood && (topMood.key === 'happy' || topMood.key === 'peaceful' || topMood.key === 'energetic')) {
      candidateInsights.push({
        emoji: '🎯',
        text: t('statistics.insight_longest_streak_positive_mood')
      });
    } else if (topMood && (topMood.key === 'tired' || topMood.key === 'stressed' || topMood.key === 'sad')) {
      candidateInsights.push({
        emoji: '😴',
        text: t('statistics.insight_harder_on_difficult_days')
      });
    }

    return candidateInsights.slice(0, 3);
  };

  const handlePrev = () => {
    const newDate = new Date(selectedDate);
    if (activeTab === 'daily') newDate.setDate(selectedDate.getDate() - 1);
    else if (activeTab === 'weekly') newDate.setDate(selectedDate.getDate() - 7);
    else if (activeTab === 'monthly') newDate.setMonth(selectedDate.getMonth() - 1);
    else newDate.setFullYear(selectedDate.getFullYear() - 1);
    setSelectedDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    if (activeTab === 'daily') newDate.setDate(selectedDate.getDate() + 1);
    else if (activeTab === 'weekly') newDate.setDate(selectedDate.getDate() + 7);
    else if (activeTab === 'monthly') newDate.setMonth(selectedDate.getMonth() + 1);
    else newDate.setFullYear(selectedDate.getFullYear() + 1);

    if (newDate > new Date()) return;
    setSelectedDate(newDate);
  };

  const getHeaderText = () => {
    const monthNames = t('calendar.monthNames', { returnObjects: true });
    const monthNamesShort = t('calendar.monthNamesShort', { returnObjects: true });

    if (activeTab === 'daily') {
      const day = selectedDate.getDate();
      const month = Array.isArray(monthNames) ? monthNames[selectedDate.getMonth()] : selectedDate.toLocaleDateString(undefined, { month: 'long' });
      const year = selectedDate.getFullYear();
      return `${day} ${month} ${year}`;
    } else if (activeTab === 'weekly') {
      const dayOfWeek = selectedDate.getDay();
      const diff = selectedDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(selectedDate);
      monday.setDate(diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const monMonth = Array.isArray(monthNamesShort) ? monthNamesShort[monday.getMonth()] : monday.toLocaleDateString(undefined, { month: 'short' });
      const sunMonth = Array.isArray(monthNamesShort) ? monthNamesShort[sunday.getMonth()] : sunday.toLocaleDateString(undefined, { month: 'short' });
      return `${monday.getDate()} ${monMonth} - ${sunday.getDate()} ${sunMonth}`;
    } else if (activeTab === 'monthly') {
      const month = Array.isArray(monthNames) ? monthNames[selectedDate.getMonth()] : selectedDate.toLocaleDateString(undefined, { month: 'long' });
      return `${month} ${selectedDate.getFullYear()}`;
    } else {
      return selectedDate.getFullYear().toString();
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

  const bestStreakVal = habits.length > 0
    ? Math.max(...habits.map(h => Math.max(h.longestStreak || 0, h.currentStreak || 0)))
    : 0;

  const sortedHabits = [...habits].sort((a, b) => {
    const streakA = Math.max(a.longestStreak || 0, a.currentStreak || 0);
    const streakB = Math.max(b.longestStreak || 0, b.currentStreak || 0);
    return streakB - streakA;
  });
  const mostConsistentHabit = sortedHabits.length > 0 ? sortedHabits[0].title : null;

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
          {['daily', 'weekly', 'monthly', 'yearly'].map((tab) => (
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
            <TouchableOpacity
              onPress={() => {
                if (activeTab === 'yearly' || activeTab === 'monthly') {
                  setYearPickerVisible(true);
                }
              }}
              disabled={activeTab !== 'yearly' && activeTab !== 'monthly'}
            >
              <Text style={{ color: colors.text }} className="text-base font-redditsans-bold px-4 py-2">
                {getHeaderText()}
              </Text>
            </TouchableOpacity>
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

              {/* Extra Monthly/Yearly Stats Grid */}
              {(activeTab === 'monthly' || activeTab === 'yearly') && (
                <View className="flex-row flex-wrap justify-between mb-4">
                  {/* Card 1: Best Streak */}
                  <View style={{ width: '48%', backgroundColor: colors.card, marginBottom: 12 }} className="p-4 rounded-3xl shadow-sm">
                    <Text style={{ color: colors.textSecondary }} className="text-[10px] font-redditsans-bold uppercase tracking-wider mb-1">
                      {t('habit_history.best_streak', 'Best Streak')}
                    </Text>
                    <Text style={{ color: colors.text }} className="text-lg font-redditsans-bold">
                      {bestStreakVal} {t('habit_history.days', 'days')}
                    </Text>
                  </View>

                  {/* Card 2: Total XP Earned */}
                  <View style={{ width: '48%', backgroundColor: colors.card, marginBottom: 12 }} className="p-4 rounded-3xl shadow-sm">
                    <Text style={{ color: colors.textSecondary }} className="text-[10px] font-redditsans-bold uppercase tracking-wider mb-1">
                      {t('statistics.total_xp', 'Total XP Earned')}
                    </Text>
                    <Text style={{ color: colors.text }} className="text-lg font-redditsans-bold">
                      {points} XP
                    </Text>
                  </View>

                  {/* Card 3: Average Completion Rate */}
                  <View style={{ width: '48%', backgroundColor: colors.card, marginBottom: 12 }} className="p-4 rounded-3xl shadow-sm">
                    <Text style={{ color: colors.textSecondary }} className="text-[10px] font-redditsans-bold uppercase tracking-wider mb-1">
                      {t('statistics.avg_completion', 'Avg Completion')}
                    </Text>
                    <Text style={{ color: colors.text }} className="text-lg font-redditsans-bold">
                      {Math.round(stats.completionRate)}%
                    </Text>
                  </View>

                  {/* Card 4: Most Consistent Habit */}
                  <View style={{ width: '48%', backgroundColor: colors.card, marginBottom: 12 }} className="p-4 rounded-3xl shadow-sm">
                    <Text style={{ color: colors.textSecondary }} className="text-[10px] font-redditsans-bold uppercase tracking-wider mb-1">
                      {t('statistics.most_consistent', 'Consistent Habit')}
                    </Text>
                    <Text style={{ color: colors.text }} className="text-sm font-redditsans-bold" numberOfLines={1} ellipsizeMode="tail">
                      {mostConsistentHabit || '—'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Performance Overview (Consistency Score) */}
              <View className="p-5 rounded-3xl mb-6 shadow-sm" style={{ backgroundColor: colors.card }}>
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <FontAwesomeIcon icon={faFire} color={colors.primary} size={16} className="mr-2" />
                    <Text style={{ color: colors.text }} className="text-base font-redditsans-bold">
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

              {/* Mood History & Distribution Card */}
              {(() => {
                const last7Days = getLast7DaysList();
                const { total, distribution } = getMoodStatsBreakdown();

                return (
                  <View className="p-6 rounded-3xl mb-6 shadow-sm border" style={{ backgroundColor: colors.card, borderColor: colors.primary + '20' }}>

                    {/* Header */}
                    <View className="flex-row items-center mb-6">
                      <View className="w-8 h-8 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: colors.primary + '20' }}>
                        <FontAwesomeIcon icon={faBrain} color={colors.primary} size={16} />
                      </View>
                      <Text style={{ color: colors.text }} className="text-lg font-redditsans-bold flex-1">
                        {t('home.mood_title_history')}
                      </Text>
                    </View>

                    {/* Section 1: 7-Day History */}
                    <View className="flex-row justify-between items-center mb-8 mt-2">
                      {last7Days.map((day) => {
                        const entry = moodHistory.find(e => e.date === day.dateStr);
                        const loggedMood = entry ? getMoodMeta(entry.mood) : null;

                        return (
                          <View key={day.dateStr} className="items-center flex-1">
                            <Text style={{ color: colors.textSecondary }} className="text-[9px] font-redditsans-bold mb-2 uppercase">
                              {day.dayLabel}
                            </Text>
                            <View
                              className="w-10 h-10 rounded-full items-center justify-center border"
                              style={{
                                backgroundColor: loggedMood ? loggedMood.color + '15' : colors.cardSecondary,
                                borderColor: loggedMood ? loggedMood.color : colors.border,
                                opacity: loggedMood ? 1 : 0.35,
                              }}
                            >
                              {loggedMood ? (
                                <Text className="text-lg">
                                  {loggedMood.emoji}
                                </Text>
                              ) : (
                                <Text style={{ color: colors.textSecondary, fontSize: 16 }}>•</Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    {/* Divider */}
                    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8, opacity: 0.5 }} />

                    {/* Section 2: 30-Day Distribution */}
                    <Text style={{ color: colors.text }} className="text-base font-redditsans-bold mb-4 mt-4">
                      {t('home.mood_title_distribution')}
                    </Text>

                    {total === 0 ? (
                      <View className="py-6 items-center justify-center">
                        <Text style={{ color: colors.textSecondary }} className="text-sm font-redditsans-medium">
                          {t('home.mood_no_data')}
                        </Text>
                      </View>
                    ) : (
                      <View className="space-y-4">
                        {distribution.map((item) => {
                          if (item.percentage === 0) return null; // Only show moods that have been logged
                          return (
                            <View key={item.key} className="mb-3">
                              <View className="flex-row justify-between items-center mb-1.5">
                                <Text style={{ color: colors.text }} className="text-sm font-redditsans-medium">
                                  {item.emoji} {item.label}
                                </Text>
                                <Text style={{ color: colors.textSecondary }} className="text-xs font-redditsans-bold">
                                  {item.percentage}%
                                </Text>
                              </View>
                              <View className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.cardSecondary }}>
                                <View
                                  style={{
                                    width: `${item.percentage}%`,
                                    backgroundColor: item.color,
                                    height: '100%'
                                  }}
                                />
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}

                  </View>
                );
              })()}

              {/* Optimized AI Insight Card */}
              {stats && (() => {
                const insights = getAICoachInsight();
                if (!insights || insights.length === 0) return null;
                return (
                  <View className="p-5 rounded-3xl mb-6 shadow-sm border" style={{ backgroundColor: colors.card, borderColor: colors.primary + '20' }}>
                    <View className="flex-row items-center mb-4">
                      <View className="w-8 h-8 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: '#a855f720' }}>
                        <FontAwesomeIcon icon={faBrain} color="#a855f7" size={16} />
                      </View>
                      <Text style={{ color: colors.text }} className="text-base font-redditsans-bold flex-1">
                        {t('statistics.ai_insight_title', 'AI Insight')}
                      </Text>
                    </View>
                    <View className="space-y-3">
                      {insights.map((insight, index) => (
                        <View key={index} className="flex-row items-start">
                          <Text className="text-base mr-3">{insight.emoji}</Text>
                          <Text style={{ color: colors.textSecondary }} className="text-sm font-redditsans-medium leading-5 flex-1">
                            {insight.text}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })()}



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

      <Modal
        visible={isYearPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setYearPickerVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 justify-center items-center bg-black/50"
          activeOpacity={1}
          onPress={() => setYearPickerVisible(false)}
        >
          <View className="rounded-3xl p-4 shadow-lg" style={{ backgroundColor: colors.card, width: activeTab === 'monthly' ? 260 : 256 }}>
            <Text style={{ color: colors.text }} className="text-lg font-redditsans-bold mb-4 text-center">
              {activeTab === 'monthly'
                ? t('statistics.select_month', 'Select Month')
                : t('statistics.select_year', 'Select Year')}
            </Text>

            <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
              {activeTab === 'monthly'
                ? t('calendar.monthNames', { returnObjects: true })?.map((monthName, index) => (
                  <TouchableOpacity
                    key={index}
                    className="py-3 items-center border-b border-gray-500/5"
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(index);
                      setSelectedDate(newDate);
                      setYearPickerVisible(false);
                    }}
                  >
                    <Text
                      style={{ color: selectedDate.getMonth() === index ? colors.primary : colors.text }}
                      className={`text-base ${selectedDate.getMonth() === index ? 'font-redditsans-bold' : 'font-redditsans-medium'}`}
                    >
                      {monthName}
                    </Text>
                  </TouchableOpacity>
                ))
                : yearsList.map((year) => (
                  <TouchableOpacity
                    key={year}
                    className="py-3 items-center border-b border-gray-500/5"
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setFullYear(year);
                      setSelectedDate(newDate);
                      setYearPickerVisible(false);
                    }}
                  >
                    <Text
                      style={{ color: selectedDate.getFullYear() === year ? colors.primary : colors.text }}
                      className={`text-base ${selectedDate.getFullYear() === year ? 'font-redditsans-bold' : 'font-redditsans-medium'}`}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))
              }
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>



    </LinearGradient>
  );
};

export default Statistics;
