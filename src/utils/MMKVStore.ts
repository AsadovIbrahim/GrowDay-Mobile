import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();

export const clearUserSession = () => {
    storage.delete('accessToken');
    storage.delete('hasCompletedPreferences');
    storage.delete('firstName');
    storage.delete('lastName');
    storage.delete('username');
    storage.delete('email');
    storage.delete('user.lastKnownLevel');
    storage.delete('user.pendingLevelUp');
    storage.delete('user.totalPoints');
    storage.delete('user.activeBorder');
    storage.delete('ai_coach.generation_count');
    storage.delete('ai_coach.last_generation_date');
    storage.delete('explore.suggested_habits_cache');
    storage.delete('aiMentorRemainingMessages');
    storage.delete('aiMentorLastActiveDate');
    storage.delete('aiMentorChatHistory');
    storage.delete('local_push_notifications');
    storage.delete('user.lastMoodDate');
    storage.delete('user.checklist.played_game');
    storage.delete('user.checklist.habit_completed');
    storage.delete('user.onboarding_checklist_completed');
    storage.delete('user.onboarding_checklist_bonus_awarded');
    storage.delete('user.onboarding_checklist_bonus_awarded_server');
    storage.delete('user.checklist.create_habit_xp_awarded');
    storage.delete('user.checklist.create_habit_xp_awarded_server');
    storage.delete('user.checklist.played_game_xp_awarded');
    storage.delete('user.checklist.played_game_xp_awarded_server');
    storage.delete('user.checklist.complete_habit_xp_awarded');
    storage.delete('user.checklist.complete_habit_xp_awarded_server');
    storage.delete('user.onboarding.has_seen_ai_mentor_intro');
    storage.delete('user.mentor_tutorial_completed');
    storage.delete('user.session_initialized');
    
    // Clear home screen caches
    storage.delete('home.cached.accountData');
    storage.delete('home.cached.todaysUserHabit');
    storage.delete('home.cached.userHabitCount');
    storage.delete('home.cached.dailyStatistics');
    storage.delete('home.cached.unreadNotificationCount');
    storage.delete('home.cached.date');

    // Clear all virtual plant (growy) keys dynamically
    const keys = storage.getAllKeys();
    keys.forEach(key => {
        if (key.startsWith('growy.')) {
            storage.delete(key);
        }
    });
};


export const getStorageScope = (_token?: string) => {
    const userScope = storage.getString('userScope');
    if (userScope && userScope.length > 0) return userScope;
    const identity = storage.getString('UsernameOrEmail');
    if (identity && identity.length > 0) {
        const scope = identity.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || 'user';
        storage.set('userScope', scope);
        return scope;
    }
    return 'guest';
};

export const getAiMentorRemainingMessagesKey = (token?: string) => `aiMentorRemainingMessages.${getStorageScope(token)}`;
export const getAiMentorLastActiveDateKey = (token?: string) => `aiMentorLastActiveDate.${getStorageScope(token)}`;
export const getAiMentorChatHistoryKey = (token?: string) => `aiMentorChatHistory.${getStorageScope(token)}`;
export const getMoodHistoryKey = (token?: string) => `user.moodHistory.${getStorageScope(token)}`;


