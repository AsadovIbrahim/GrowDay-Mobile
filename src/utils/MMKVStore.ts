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
        if (key.startsWith('growy.') || key.startsWith('user_my_goals_ai_quests')) {
            storage.delete(key);
        }
    });
    storage.delete('userScope');
    storage.delete('UsernameOrEmail');
    storage.delete('user_my_goals_ai_quests');
    storage.delete('user_deleted_habit_ids');
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
    if (_token) {
        try {
            const parts = _token.split('.');
            if (parts.length >= 2) {
                const payloadStr = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                const decodedJson = unescape(encodeURIComponent(atob(payloadStr)));
                const parsed = JSON.parse(decodedJson);
                const uid = parsed.nameid || parsed.sub || parsed.email || parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
                if (uid) {
                    const scope = String(uid).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || 'user';
                    storage.set('userScope', scope);
                    return scope;
                }
            }
        } catch (e) {
            // ignore token parse fallback errors
        }
    }
    return 'guest';
};

export const getAiMentorRemainingMessagesKey = (token?: string) => `aiMentorRemainingMessages.${getStorageScope(token)}`;
export const getAiMentorLastActiveDateKey = (token?: string) => `aiMentorLastActiveDate.${getStorageScope(token)}`;
export const getAiMentorChatHistoryKey = (token?: string) => `aiMentorChatHistory.${getStorageScope(token)}`;
export const getMoodHistoryKey = (token?: string) => `user.moodHistory.${getStorageScope(token)}`;
export const getMyGoalsKey = (token?: string) => `user_my_goals_ai_quests_${getStorageScope(token)}`;


