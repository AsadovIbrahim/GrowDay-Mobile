import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();

export const clearUserSession = () => {
    storage.delete('accessToken');
    storage.delete('UsernameOrEmail');
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
    // Scoped keys are token-suffixed; cleared on next login scope change.
    storage.delete('local_push_notifications');
};
