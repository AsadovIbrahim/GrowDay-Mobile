import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faSearch, faChevronDown, faChevronUp, faTrash, faCheckSquare, faSquare } from '@fortawesome/free-solid-svg-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getUnreadNotificationCountFetch, getUserHabitByFrequencyFetch, deleteUserHabitFetch, getTodaysUserHabitFetch } from '../../utils/fetch';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useMMKVString } from 'react-native-mmkv';
import HabitListItem from '../../components/HabitListItem';
import NotificationIcon from '../../components/NotificationIcon';
import { useTheme } from '../../context/ThemeContext';


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

    const frequencyOptions = ['Today', 'All', 'Daily', 'Weekly', 'Monthly', 'Custom'];

    const navigation = useNavigation();
    const { theme } = useTheme();
    const { colors } = theme;

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
                const allPromises = frequencyList.map(frequency =>
                    getUserHabitByFrequencyFetch(token, frequency)
                );
                const responses = await Promise.all(allPromises);
                habits = responses.reduce((acc, response) => {
                    let h = [];
                    if (response && response.data) {
                        h = Array.isArray(response.data) ? response.data : [];
                    } else if (Array.isArray(response)) {
                        h = response;
                    }
                    return acc.concat(h);
                }, []);
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

    useFocusEffect(
        useCallback(() => {
            if (token) {
                getUserHabitsByFrequency();
                getUnreadNotificationCount();
            }
        }, [token, selectedFrequency])
    );

    const handleGoBack = () => {
        navigation.goBack();
    };

    const handleHabitPress = (habit) => {
        // Navigate to habit detail or handle press
        if (!isSelectionMode) {
            navigation.navigate("UserHabitDetails", {
                habitId: habit.userHabitId || habit.id || habit.habitId,
                date: new Date().toISOString(),
                isFuture: false
            });
        }
    };

    const handleLongPress = (habit) => {
        // Enter selection mode and select the pressed habit
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

    const handleSelectAll = () => {
        if (!filteredHabits || filteredHabits.length === 0) return;
        const allHabitIds = filteredHabits.map(habit => habit.userHabitId || habit.id || habit.habitId);
        setSelectedHabits(new Set(allHabitIds));
    };

    const handleDeselectAll = () => {
        setSelectedHabits(new Set());
    };

    const isAllSelected = useMemo(() => {
        if (!filteredHabits || filteredHabits.length === 0) return false;
        const allHabitIds = filteredHabits.map(habit => habit.userHabitId || habit.id || habit.habitId);
        return allHabitIds.every(id => selectedHabits.has(id));
    }, [filteredHabits, selectedHabits]);

    const handleToggleSelectAll = () => {
        if (isAllSelected) {
            handleDeselectAll();
        } else {
            handleSelectAll();
        }
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
                deleteUserHabitFetch(token, userHabitId)
            );

            const responses = await Promise.all(deletePromises);
            console.log('Delete responses:', responses);

            // Check if all deletions were successful
            const allSuccessful = responses.every(response =>
                response && (response.ok || response.status === 200 || response.status === 204) && !response.error
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

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            habits = habits.filter(habit => {
                const title = (habit.title || '').toLowerCase();
                const description = (habit.description || '').toLowerCase();
                return title.includes(query) || description.includes(query);
            });
        }

        return habits;
    }, [userHabitsByFrequency, searchQuery, selectedFrequency]);

    // Apply pagination to filtered habits
    const filteredHabits = useMemo(() => {
        if (!searchQuery.trim()) {
            return allFilteredHabits.slice(0, displayLimit);
        }
        return allFilteredHabits;
    }, [allFilteredHabits, searchQuery, displayLimit]);

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
                            My Habits
                        </Text>
                    </View>

                    <NotificationIcon count={unreadNotificationCount} />
                </View>

                {/* Search Bar */}
                <View className="px-4 mb-4">
                    <View className="rounded-xl px-4 py-3 flex-row items-center" style={{ backgroundColor: colors.card }}>
                        <FontAwesomeIcon icon={faSearch} color={colors.textSecondary} size={16} />
                        <TextInput
                            placeholder="Search habits..."
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            className="flex-1 ml-3 text-base font-redditsans-regular"
                            style={{ color: colors.text }}
                        />
                    </View>
                </View>

                {/* Filter Chips Section — always visible */}
                <View className="px-4 mb-3">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 4 }}
                    >
                        {frequencyOptions.map((option) => (
                            <TouchableOpacity
                                key={option}
                                onPress={() => {
                                    setSelectedFrequency(option);
                                    setDisplayLimit(pageSize);
                                    setSelectedHabits(new Set());
                                    setIsSelectionMode(false);
                                }}
                                className="px-5 py-2.5 rounded-full mr-2 shadow-sm border"
                                style={{
                                    backgroundColor: selectedFrequency === option ? colors.primary : colors.card,
                                    borderColor: selectedFrequency === option ? colors.primary : colors.border
                                }}
                                activeOpacity={0.8}
                            >
                                <Text
                                    className="text-sm font-redditsans-medium"
                                    style={{
                                        color: selectedFrequency === option ? '#FFFFFF' : colors.textSecondary
                                    }}
                                >
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Content */}
                <ScrollView
                    className="flex-1 px-4"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    {loading ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text className="mt-4 font-redditsans-regular" style={{ color: colors.textSecondary }}>
                                Loading habits...
                            </Text>
                        </View>
                    ) : filteredHabits.length === 0 ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <Text className="text-gray-600 text-lg font-redditsans-medium text-center">
                                {searchQuery.trim()
                                    ? 'No habits found matching your search'
                                    : 'No habits found'
                                }
                            </Text>
                            {!searchQuery.trim() && (
                                <Text className="text-gray-500 text-sm mt-2 font-redditsans-regular text-center">
                                    Start by adding some habits to track
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
                                                Load More
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Selection Mode Actions */}
                                {isSelectionMode && (
                                    <View className="mb-2">
                                        <View className="rounded-xl px-4 py-2 mb-2 flex-row items-center">
                                            <TouchableOpacity
                                                onPress={handleToggleSelectAll}
                                                onLongPress={handleSelectAll}
                                                activeOpacity={0.7}
                                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                            >
                                                <FontAwesomeIcon
                                                    icon={isAllSelected ? faCheckSquare : faSquare}
                                                    color={isAllSelected ? colors.primary : colors.textSecondary}
                                                    size={20}
                                                />
                                            </TouchableOpacity>
                                            <Text className="text-sm font-redditsans-medium ml-2" style={{ color: colors.text }}>
                                                {isAllSelected ? 'Deselect All' : 'Select All'}
                                            </Text>
                                        </View>

                                        <View className="flex-row gap-2">
                                            <TouchableOpacity
                                                onPress={exitSelectionMode}
                                                className="rounded-full py-2 px-4 items-center"
                                                style={{ backgroundColor: colors.cardSecondary }}
                                                activeOpacity={0.7}
                                            >
                                                <Text className="text-sm font-redditsans-medium" style={{ color: colors.text }}>
                                                    Cancel
                                                </Text>
                                            </TouchableOpacity>
                                            {selectedHabits.size > 0 && (
                                                <TouchableOpacity
                                                    onPress={handleDeleteSelected}
                                                    className="rounded-full py-2 px-4 flex-row items-center justify-center"
                                                    style={{ backgroundColor: colors.danger }}
                                                    activeOpacity={0.7}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} color="#ffffff" size={14} />
                                                    <Text className="text-white text-sm font-redditsans-medium ml-1.5">
                                                        Delete ({selectedHabits.size})
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                )}
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
                                            Delete Habits
                                        </Text>
                                        <Text className="text-base font-redditsans-regular mb-6" style={{ color: colors.textSecondary }}>
                                            Are you sure you want to delete {selectedHabits.size} habit{selectedHabits.size > 1 ? 's' : ''}? This action cannot be undone.
                                        </Text>
                                        <View className="flex-row gap-3">
                                            <TouchableOpacity
                                                onPress={handleCancelDelete}
                                                className="flex-1 rounded-full py-3 items-center"
                                                style={{ backgroundColor: colors.cardSecondary }}
                                                activeOpacity={0.7}
                                            >
                                                <Text className="text-base font-redditsans-medium" style={{ color: colors.text }}>
                                                    Cancel
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={handleConfirmDelete}
                                                className="flex-1 rounded-full py-3 items-center"
                                                style={{ backgroundColor: colors.danger }}
                                                activeOpacity={0.7}
                                            >
                                                <Text className="text-white text-base font-redditsans-medium">
                                                    Yes
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
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