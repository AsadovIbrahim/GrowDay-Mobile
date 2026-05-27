import { storage } from './MMKVStore';

const getStorageScope = () => {
  const token = storage.getString('accessToken');
  return token && token.length >= 8 ? token.slice(-12) : 'guest';
};

export const suggestedHabitsCacheKey = () =>
  `explore.suggested_habits_cache.${getStorageScope()}`;

export const aiCoachCountKey = () =>
  `ai_coach.generation_count.${getStorageScope()}`;

export const aiCoachDateKey = () =>
  `ai_coach.last_generation_date.${getStorageScope()}`;

export const loadCachedSuggestedHabits = () => {
  try {
    const raw = storage.getString(suggestedHabitsCacheKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const saveSuggestedHabitsCache = (habits) => {
  try {
    storage.set(suggestedHabitsCacheKey(), JSON.stringify(habits ?? []));
  } catch (e) {
    console.log('Failed to cache suggested habits:', e);
  }
};

export const clearSuggestedHabitsCache = () => {
  try {
    storage.delete(suggestedHabitsCacheKey());
    storage.delete('explore.suggested_habits_cache');
  } catch (e) {
    console.log('Failed to clear suggested habits cache:', e);
  }
};
