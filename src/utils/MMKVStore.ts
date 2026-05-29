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

