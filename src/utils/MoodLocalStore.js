import { storage, getMoodHistoryKey } from './MMKVStore';

/**
 * Gets the current local date string in YYYY-MM-DD format.
 * @returns {string} Local date string.
 */
export const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Retrieves the local mood history array from MMKV.
 * @param {string} [token] optional token to isolate scope.
 * @returns {Array<{date: string, mood: string, emoji: string}>} Mood history array.
 */
export const getLocalMoodHistory = (token) => {
  try {
    const key = getMoodHistoryKey(token);
    const stored = storage.getString(key);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading local mood history:', error);
    return [];
  }
};

/**
 * Checks if the user has already logged a mood today.
 * @param {string} [token] optional token to isolate scope.
 * @returns {boolean} True if a mood is already logged for today.
 */
export const hasLoggedMoodToday = (token) => {
  const history = getLocalMoodHistory(token);
  const todayStr = getLocalDateString();
  return history.some(entry => entry.date === todayStr);
};

/**
 * Retrieves the mood logged on a specific date string (YYYY-MM-DD).
 * @param {string} [token] optional token.
 * @param {string} dateStr date string to find.
 * @returns {{date: string, mood: string, emoji: string} | null} The mood entry or null.
 */
export const getMoodForDate = (token, dateStr) => {
  const history = getLocalMoodHistory(token);
  return history.find(entry => entry.date === dateStr) || null;
};

/**
 * Saves a new mood entry for today.
 * @param {string} [token] optional token.
 * @param {string} mood the mood key/name.
 * @param {string} emoji the emoji symbol.
 * @returns {{success: boolean, alreadyLogged: boolean, entry: object | null}} Results of operation.
 */
export const saveLocalMood = (token, mood, emoji) => {
  try {
    const todayStr = getLocalDateString();
    const history = getLocalMoodHistory(token);
    
    // Check if already logged today
    const alreadyLogged = history.some(entry => entry.date === todayStr);
    if (alreadyLogged) {
      return { success: false, alreadyLogged: true, entry: null };
    }
    
    const newEntry = {
      date: todayStr,
      mood: mood,
      emoji: emoji
    };
    
    // Prepend to show newest first, and limit to last 30 entries
    const updatedHistory = [newEntry, ...history].slice(0, 30);
    const key = getMoodHistoryKey(token);
    storage.set(key, JSON.stringify(updatedHistory));
    
    return { success: true, alreadyLogged: false, entry: newEntry };
  } catch (error) {
    console.error('Error saving local mood:', error);
    return { success: false, alreadyLogged: false, entry: null };
  }
};
