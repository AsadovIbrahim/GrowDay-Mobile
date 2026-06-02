import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faSearch, faChevronDown, faChevronUp, faTrash, faCheckSquare, faSquare, faCheck, faFilter } from '@fortawesome/free-solid-svg-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getUnreadNotificationCountFetch, getUserHabitByFrequencyFetch, removeUserHabitFetch, getTodaysUserHabitFetch, getUserHabitFetch, getCategoriesFetch } from '../../utils/fetch';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useMMKVString } from 'react-native-mmkv';
import HabitListItem from '../../components/HabitListItem';
import NotificationIcon from '../../components/NotificationIcon';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getTranslatedHabit, getTranslatedCategory } from '../../utils/habitTranslations';

const CATEGORY_ICON_MAP = {
  default: '⭐', health: '❤️', fitness: '💪', mindfulness: '🧘',
  productivity: '📈', learning: '📚', social: '👥', finance: '💰',
  nutrition: '🍎', sleep: '😴', creativity: '🎨', selfcare: '💅',
  hydration: '💧', work: '💼', music: '🎵', sports: '⚽',
  nature: '🌱', meditation: '🕊️', coding: '💻', travel: '✈️',
};

const getCategoryIcon = (iconKey) => {
  if (!iconKey) return '⭐';
  if ([...iconKey].length <= 2 && iconKey.codePointAt(0) > 255) return iconKey;
  return CATEGORY_ICON_MAP[iconKey.toLowerCase()] || '⭐';
};

const UserHabits = ({ route }) => {
    const [token] = useMMKVString('accessToken');
    const [userHabitsByFrequency, setUserHabitsByFrequency] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [frequencyList] = useState(['Daily', 'Weekly', 'Monthly', 'Custom']);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [displayLimit, setDisplayLimit] = useState(10);
    const [pageSize] = useState(10);
    
    // Default to 'Today' if coming from Home's VIEW ALL, otherwise 'All'
    const [selectedFrequency, setSelectedFrequency] = useState(route.params?.initialFilter || 'All');
    
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedHabits, setSelectedHabits] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('All');
    const [tempCategoryId, setTempCategoryId] = useState('All');
    const [tempFrequency, setTempFrequency] = useState('All');
    const [filterModalVisible, setFilterModalVisible] = useState(false);

    const frequencyOptions = ['Today', 'All', 'Daily', 'Weekly', 'Monthly', 'Custom'];

    const navigation = useNavigation();
    const { theme } = useTheme();
    const { colors } = theme;
    const { t, i18n } = useTranslation();

    const getUserHabitsByFrequency = async () => {
        if (!token) return;

        setLoading(true);
        setDisplayLimit(10);
        try {
            let habits = [];
            
            if (selectedFrequency === 'Today') {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                
                const response = await getTodaysUserHabitFetch(token, dateStr, 0, 100);
                habits = response && response.data ? (Array.isArray(response.data) ? response.data : []) : [];
            } else if (selectedFrequency === 'All') {
                const response = await getUserHabitFetch(token, 0, 100);
                habits = response && response.data ? (Array.isArray(response.data) ? response.data : []) : [];
            } else {
                const response = await getUserHabitByFrequencyFetch(token, selectedFrequency);
                habits = response && response.data ? (Array.isArray(response.data) ? response.data : []) : 
                         (Array.isArray(response) ? response : []);
            }

            // Deduplication
            const uniqueHabits = habits.filter((habit, index, self) => {
                const habitId = habit.userHabitId || habit.id;
                const firstIndex = self.findIndex(h =>
                    (h.userHabitId || h.id) === habitId
                );
                return index === firstIndex;
            });

            setUserHabitsByFrequency(uniqueHabits);
        } catch (error) {
            console.log('Error fetching user habits:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUnreadNotificationCount = async () => {
        if (!token) return;

        try {
            const response = await getUnreadNotificationCountFetch(token);
            setUnreadNotificationCount(response || 0);
        } catch (error) {
            console.log('Error fetching notification count:', error);
        }
    };

    const fetchCategories = async () => {
        if (!token) return;
        try {
            const response = await getCategoriesFetch(token);
            if (response) {
                const list = Array.isArray(response) ? response : (response.data || []);
                setCategories(list);
            }
        } catch (error) {
            console.log('Error fetching categories:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (token) {
                getUserHabitsByFrequency();
                getUnreadNotificationCount();
                fetchCategories();
            }
        }, [token, selectedFrequency])
    );

    const handleGoBack = () => {
        navigation.goBack();
    };

    const handleHabitPress = (habit) => {
        if (!isSelectionMode) {
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            navigation.navigate("UserHabitDetails", {
                habitId: habit.userHabitId || habit.id || habit.habitId,
                date: dateStr,
                isFuture: false
            });
        }
    };

    const handleLongPress = (habit) => {
        if (!isSelectionMode) {
            setIsSelectionMode(true);
        }
        const habitId = habit.userHabitId || habit.id || habit.habitId;
        setSelectedHabits(prev => {
            const newSet = new Set(prev);
            if (!newSet.has(habitId)) {
                newSet.add(habitId);
            }
            return newSet;
        });
    };

    const handleToggleSelect = (habit) => {
        const habitId = habit.userHabitId || habit.id || habit.habitId;
        setSelectedHabits(prev => {
            const newSet = new Set(prev);
            if (newSet.has(habitId)) {
                newSet.delete(habitId);
            } else {
                newSet.add(habitId);
            }
            return newSet;
        });
    };

    const exitSelectionMode = () => {
        setIsSelectionMode(false);
        setSelectedHabits(new Set());
    };

    const handleDeleteSelected = () => {
        if (selectedHabits.size === 0) return;
        setDeleteDialogVisible(true);
    };

    const handleConfirmDelete = async () => {
        if (selectedHabits.size === 0 || !token) {
            setDeleteDialogVisible(false);
            return;
        }

        try {
            setLoading(true);
            const habitIds = Array.from(selectedHabits);
            const deletePromises = habitIds.map(userHabitId =>
                removeUserHabitFetch(token, userHabitId)
            );


            const responses = await Promise.all(deletePromises);
            console.log('Delete responses:', responses);

            // Check if all deletions were successful
            const allSuccessful = responses.every(response =>
                response && (response.success || response.ok || response.status === 200 || response.status === 204)
            );


            if (allSuccessful) {
                // Clear selections, exit selection mode and refresh the habits list
                setSelectedHabits(new Set());
                setIsSelectionMode(false);
                await getUserHabitsByFrequency();
            } else {
                console.log('Some deletions failed');
            }
        } catch (error) {
            console.log('Error deleting habits:', error);
        } finally {
            setLoading(false);
            setDeleteDialogVisible(false);
        }
    };

    const handleCancelDelete = () => {
        setDeleteDialogVisible(false);
    };
    const handleLoadMore = () => {
        if (!loading) {
            setDisplayLimit(prev => prev + pageSize);
        }
    };

    // Filter habits based on search query and frequency (without pagination)
    const allFilteredHabits = useMemo(() => {
        let habits = userHabitsByFrequency;

        // Filter by frequency (Note: 'Today' and 'All' are handled by API call logic now)
        if (selectedFrequency !== 'All' && selectedFrequency !== 'Today') {
            habits = habits.filter(habit => {
                const habitFrequency = habit.frequency || habit.frequencyType || habit.type || '';
                return habitFrequency.toLowerCase() === selectedFrequency.toLowerCase();
            });
        }

        // Filter by dynamic category id
        if (selectedCategoryId && selectedCategoryId !== 'All') {
            habits = habits.filter(habit => {
                return habit.categoryId === selectedCategoryId;
            });
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            habits = habits.filter(habit => {
                const { title, description } = getTranslatedHabit(habit, i18n.language, t);
                return title.toLowerCase().includes(query) || description.toLowerCase().includes(query);
            });
        }

        return habits;
    }, [userHabitsByFrequency, searchQuery, selectedFrequency, selectedCategoryId, i18n.language, t]);

    // Apply pagination to filtered habits
    const filteredHabits = useMemo(() => {
        if (!searchQuery.trim()) {
            return allFilteredHabits.slice(0, displayLimit);
        }
        return allFilteredHabits;
    }, [allFilteredHabits, searchQuery, displayLimit]);

    const isAllSelected = (filteredHabits && filteredHabits.length > 0) && filteredHabits.every(habit => 
        selectedHabits.has(habit.userHabitId || habit.id || habit.habitId)
    );

    const handleSelectAll = () => {
        if (!filteredHabits || filteredHabits.length === 0) return;
        const allHabitIds = filteredHabits.map(habit => habit.userHabitId || habit.id || habit.habitId);
        setSelectedHabits(new Set(allHabitIds));
    };

    const handleDeselectAll = () => {
        setSelectedHabits(new Set());
    };

    const handleToggleSelectAll = () => {
        if (isAllSelected) {
            handleDeselectAll();
        } else {
            handleSelectAll();
        }
    };

    // Check if there are more items to load
    const hasMore = !searchQuery.trim() && allFilteredHabits.length > displayLimit;

    return (
        <LinearGradient colors={colors.backgroundGradient} className="flex-1">
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 pt-4 mb-4">
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity onPress={handleGoBack} className="mr-4">
                            <FontAwesomeIcon icon={faArrowLeft} size={20} color={colors.text} />
                        </TouchableOpacity>
                        <Text className="text-2xl font-redditsans-bold" style={{ color: colors.text }}>
                            {t('my_habits.header')}
                        </Text>
                    </View>

                    <NotificationIcon count={unreadNotificationCount} />
                </View>

                {/* Search Bar & Filter Button */}
                <View className="px-4 mb-4 flex-row items-center gap-3">
                    <View className="flex-1 rounded-xl px-4 py-3 flex-row items-center" style={{ backgroundColor: colors.card }}>
                        <FontAwesomeIcon icon={faSearch} color={colors.textSecondary} size={16} />
                        <TextInput
                            placeholder={t('my_habits.search_habits')}
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            className="flex-1 ml-3 text-base font-redditsans-regular"
                            style={{ color: colors.text }}
                        />
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            setTempCategoryId(selectedCategoryId);
                            setTempFrequency(selectedFrequency);
                            setFilterModalVisible(true);
                        }}
                        className="p-3.5 rounded-xl justify-center items-center"
                        style={{ 
                            backgroundColor: (selectedCategoryId !== 'All' || selectedFrequency !== 'All') ? colors.primary : colors.card,
                            borderWidth: 1,
                            borderColor: (selectedCategoryId !== 'All' || selectedFrequency !== 'All') ? colors.primary : colors.border
                        }}
                        activeOpacity={0.8}
                    >
                        <FontAwesomeIcon 
                            icon={faFilter} 
                            color={(selectedCategoryId !== 'All' || selectedFrequency !== 'All') ? '#FFFFFF' : colors.text} 
                            size={18} 
                        />
                    </TouchableOpacity>
                </View>

                {/* Active Filter Chips or Selection Actions */}
                <View className="px-4 mb-3">
                    {isSelectionMode ? (
                        <View className="flex-row items-center justify-between">
                            <TouchableOpacity 
                                onPress={handleToggleSelectAll} 
                                className="flex-row items-center gap-2"
                                activeOpacity={0.7}
                            >
                                <View 
                                    className="w-5 h-5 rounded items-center justify-center border"
                                    style={{ 
                                        borderColor: isAllSelected ? colors.primary : colors.textSecondary,
                                        backgroundColor: isAllSelected ? colors.primary : 'transparent',
                                        borderRadius: 4,
                                        borderWidth: isAllSelected ? 0 : 2
                                    }}
                                >
                                    {isAllSelected && (
                                        <FontAwesomeIcon icon={faCheck} size={12} color="#FFFFFF" />
                                    )}
                                </View>
                                <Text className="text-base font-redditsans-medium" style={{ color: colors.text }}>
                                    {isAllSelected ? t('my_habits.deselect_all') : t('my_habits.select_all')}
                                </Text>
                            </TouchableOpacity>

                            <View className="flex-row items-center gap-2">
                                <TouchableOpacity
                                    onPress={handleDeleteSelected}
                                    className="bg-red-500 rounded-full px-4 py-2 flex-row items-center"
                                    disabled={selectedHabits.size === 0}
                                    style={{ opacity: selectedHabits.size === 0 ? 0.6 : 1 }}
                                >
                                    <FontAwesomeIcon icon={faTrash} color="#ffffff" size={14} />
                                    <Text className="text-white text-xs font-redditsans-bold ml-1.5">
                                        {t('my_habits.delete_count', { count: selectedHabits.size })}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="bg-gray-500/20 rounded-full px-4 py-2"
                                    onPress={exitSelectionMode}
                                >
                                    <Text className="text-sm font-redditsans-medium" style={{ color: colors.textSecondary }}>
                                        {t('common.cancel')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (selectedCategoryId !== 'All' || selectedFrequency !== 'All') ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <Text className="font-redditsans-medium" style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>
                                {t('my_habits.active_filters', 'Active Filters:')}
                            </Text>
                            {selectedFrequency !== 'All' && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedFrequency('All');
                                        setDisplayLimit(pageSize);
                                    }}
                                    style={{ 
                                        flexDirection: 'row', 
                                        alignItems: 'center', 
                                        gap: 6, 
                                        backgroundColor: colors.primary + '15', 
                                        borderWidth: 1, 
                                        borderColor: colors.primary,
                                        paddingHorizontal: 12,
                                        paddingVertical: 5,
                                        borderRadius: 15
                                    }}
                                >
                                    <Text className="font-redditsans-medium" style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                                        {t(`my_habits.filters.${selectedFrequency.toLowerCase()}`)}
                                    </Text>
                                    <Text className="font-redditsans-medium" style={{ color: colors.primary, fontSize: 10 }}>✕</Text>
                                </TouchableOpacity>
                            )}
                            {selectedCategoryId !== 'All' && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedCategoryId('All');
                                        setDisplayLimit(pageSize);
                                    }}
                                    style={{ 
                                        flexDirection: 'row', 
                                        alignItems: 'center', 
                                        gap: 6, 
                                        backgroundColor: colors.primary + '15', 
                                        borderWidth: 1, 
                                        borderColor: colors.primary,
                                        paddingHorizontal: 12,
                                        paddingVertical: 5,
                                        borderRadius: 15
                                    }}
                                >
                                    <Text className="font-redditsans-medium" style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                                        {getTranslatedCategory(categories.find(c => c.id === selectedCategoryId), i18n.language, t) || t('my_habits.category', 'Category')}
                                    </Text>
                                    <Text className="font-redditsans-medium" style={{ color: colors.primary, fontSize: 10 }}>✕</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedFrequency('All');
                                    setSelectedCategoryId('All');
                                    setDisplayLimit(pageSize);
                                }}
                                style={{
                                    backgroundColor: colors.cardSecondary,
                                    paddingHorizontal: 12,
                                    paddingVertical: 5,
                                    borderRadius: 15
                                }}
                            >
                                <Text className="font-redditsans-medium" style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '500' }}>
                                    {t('my_habits.clear_all', 'Clear All')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>

                {/* Content */}
                <ScrollView
                    className="flex-1 px-4"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {loading ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text className="mt-4 font-redditsans-regular" style={{ color: colors.textSecondary }}>
                                {t('common.loading')}
                            </Text>
                        </View>
                    ) : filteredHabits.length === 0 ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <Text className="text-gray-600 text-lg font-redditsans-medium text-center">
                                {searchQuery.trim()
                                    ? t('my_habits.no_habits_search')
                                    : t('my_habits.no_habits_found')
                                }
                            </Text>
                            {!searchQuery.trim() && (
                                <Text className="text-gray-500 text-sm mt-2 font-redditsans-regular text-center">
                                    {t('my_habits.add_habits_track')}
                                </Text>
                            )}
                        </View>
                    ) : (
                        <>
                            <View className="mb-3">
                                <View className="flex-row items-center justify-end mb-2">
                                    {/* Load More */}
                                    {hasMore && !loading && !isSelectionMode && (
                                        <TouchableOpacity
                                            onPress={handleLoadMore}
                                            activeOpacity={0.7}
                                        >
                                            <Text className="text-base font-redditsans-medium" style={{ color: colors.primary }}>
                                                {t('my_habits.load_more')}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            {/* Habit List */}
                            {filteredHabits.map((habit) => {
                                const habitId = habit.userHabitId || habit.id || habit.habitId;
                                return (
                                    <HabitListItem
                                        key={habitId}
                                        habit={habit}
                                        onPress={() => handleHabitPress(habit)}
                                        onLongPress={() => handleLongPress(habit)}
                                        isSelected={selectedHabits.has(habitId)}
                                        isSelectionMode={isSelectionMode}
                                        onToggleSelect={() => handleToggleSelect(habit)}
                                        showStatus={selectedFrequency === 'Today'}
                                    />
                                );
                            })}

                            {/* Delete Confirmation Dialog */}
                            <Modal
                                visible={deleteDialogVisible}
                                transparent={true}
                                animationType="fade"
                                onRequestClose={handleCancelDelete}
                            >
                                <View className="flex-1 bg-black/50 justify-center items-center px-6">
                                    <View className="rounded-2xl px-6 py-5 w-full max-w-sm" style={{ backgroundColor: colors.card }}>
                                        <Text className="text-xl font-redditsans-bold mb-2" style={{ color: colors.text }}>
                                            {t('my_habits.delete_habits')}
                                        </Text>
                                        <Text className="text-base font-redditsans-regular mb-6" style={{ color: colors.textSecondary }}>
                                            {t('my_habits.delete_confirm', { count: selectedHabits.size })}
                                        </Text>
                                        <View className="flex-row gap-3">
                                            <TouchableOpacity
                                                onPress={handleCancelDelete}
                                                className="flex-1 rounded-full py-3 items-center"
                                                style={{ backgroundColor: colors.cardSecondary }}
                                                activeOpacity={0.7}
                                            >
                                                <Text className="text-base font-redditsans-medium" style={{ color: colors.text }}>
                                                    {t('common.cancel')}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={handleConfirmDelete}
                                                className="flex-1 rounded-full py-3 items-center"
                                                style={{ backgroundColor: colors.danger }}
                                                activeOpacity={0.7}
                                            >
                                                <Text className="text-white text-base font-redditsans-medium">
                                                    {t('home.yes')}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </Modal>

                            {/* Filter Bottom Sheet */}
                            <Modal
                                visible={filterModalVisible}
                                transparent={true}
                                animationType="slide"
                                onRequestClose={() => setFilterModalVisible(false)}
                            >
                                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                                    <TouchableOpacity 
                                        style={{ flex: 1 }} 
                                        activeOpacity={1} 
                                        onPress={() => setFilterModalVisible(false)} 
                                    />
                                    <View 
                                        style={{ 
                                            backgroundColor: colors.card, 
                                            borderTopLeftRadius: 30, 
                                            borderTopRightRadius: 30, 
                                            paddingHorizontal: 24, 
                                            paddingTop: 16, 
                                            paddingBottom: 40,
                                            maxHeight: '80%'
                                        }}
                                    >
                                        {/* Handle bar */}
                                        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 20 }} />
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                            <Text className="font-redditsans-bold" style={{ color: colors.text, fontSize: 20 }}>
                                                {t('my_habits.filters_title', 'Filters')}
                                            </Text>
                                            <TouchableOpacity 
                                                onPress={() => {
                                                    setTempFrequency('All');
                                                    setTempCategoryId('All');
                                                }}
                                            >
                                                <Text className="font-redditsans-medium" style={{ color: colors.primary, fontSize: 14 }}>
                                                    {t('my_habits.reset', 'Reset')}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        {/* Section: Frequency */}
                                        <Text className="font-redditsans-medium" style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 12 }}>
                                            {t('my_habits.frequency', 'Frequency')}
                                        </Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                                            {frequencyOptions.map((opt) => {
                                                const isSel = tempFrequency === opt;
                                                return (
                                                    <TouchableOpacity
                                                        key={opt}
                                                        onPress={() => setTempFrequency(opt)}
                                                        style={{
                                                            paddingHorizontal: 16,
                                                            paddingVertical: 8,
                                                            borderRadius: 20,
                                                            backgroundColor: isSel ? colors.primary : colors.cardSecondary,
                                                            borderWidth: 1,
                                                            borderColor: isSel ? colors.primary : colors.border
                                                        }}
                                                    >
                                                        <Text className="font-redditsans-medium" style={{ color: isSel ? '#FFFFFF' : colors.text, fontSize: 14 }}>
                                                            {t(`my_habits.filters.${opt.toLowerCase()}`)}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>

                                        {/* Section: Category */}
                                        <Text className="font-redditsans-medium" style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 12 }}>
                                            {t('my_habits.category', 'Category')}
                                        </Text>
                                        <ScrollView 
                                            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} 
                                            style={{ maxHeight: 200, marginBottom: 24 }}
                                            showsVerticalScrollIndicator={false}
                                        >
                                            <TouchableOpacity
                                                onPress={() => setTempCategoryId('All')}
                                                style={{
                                                    paddingHorizontal: 16,
                                                    paddingVertical: 8,
                                                    borderRadius: 20,
                                                    backgroundColor: tempCategoryId === 'All' ? colors.primary : colors.cardSecondary,
                                                    borderWidth: 1,
                                                    borderColor: tempCategoryId === 'All' ? colors.primary : colors.border
                                                }}
                                            >
                                                <Text className="font-redditsans-medium" style={{ color: tempCategoryId === 'All' ? '#FFFFFF' : colors.text, fontSize: 14 }}>
                                                    {t('my_habits.filters.all_categories', 'All Categories')}
                                                </Text>
                                            </TouchableOpacity>
                                            {categories.map((cat) => {
                                                const isSel = tempCategoryId === cat.id;
                                                return (
                                                    <TouchableOpacity
                                                        key={cat.id}
                                                        onPress={() => setTempCategoryId(cat.id)}
                                                        style={{
                                                            paddingHorizontal: 16,
                                                            paddingVertical: 8,
                                                            borderRadius: 20,
                                                            backgroundColor: isSel ? colors.primary : colors.cardSecondary,
                                                            borderWidth: 1,
                                                            borderColor: isSel ? colors.primary : colors.border,
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: 6
                                                        }}
                                                    >
                                                        <Text style={{ fontSize: 14 }}>{getCategoryIcon(cat.icon)}</Text>
                                                        <Text className="font-redditsans-medium" style={{ color: isSel ? '#FFFFFF' : colors.text, fontSize: 14 }}>
                                                            {getTranslatedCategory(cat, i18n.language, t)}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>

                                        {/* Apply Button */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                setSelectedFrequency(tempFrequency);
                                                setSelectedCategoryId(tempCategoryId);
                                                setFilterModalVisible(false);
                                                setDisplayLimit(pageSize);
                                            }}
                                            style={{
                                                backgroundColor: colors.primary,
                                                paddingVertical: 14,
                                                borderRadius: 25,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                shadowColor: colors.primary,
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.2,
                                                shadowRadius: 8,
                                                elevation: 4
                                            }}
                                        >
                                            <Text className="font-redditsans-bold" style={{ color: '#FFFFFF', fontSize: 16 }}>
                                                {t('my_habits.apply_filters', 'Apply Filters')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Modal>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default UserHabits;