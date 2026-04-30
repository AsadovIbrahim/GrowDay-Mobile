import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/MMKVStore';

const THEME_KEY = 'app_theme_mode';

export const lightTheme = {
  isDark: false,
  colors: {
    // Backgrounds
    background: '#e7f0df',
    backgroundGradient: ['#e7f0df', '#5a9e6f'],
    card: '#FFFFFF',
    cardSecondary: '#F3F4F6',
    // Text
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textGray:'#676666',
    // Primary (green)
    primary: '#2f6f3f',
    primaryLight: '#4caf66',
    primarySurface: '#e7f5ec',
    // Border
    border: '#E5E7EB',
    // Section label
    sectionLabel: '#374151',
    // Icons
    icon: '#111827',
    iconMuted: '#9CA3AF',
    // Switch
    switchTrackOn: '#4caf66',
    switchTrackOff: '#D1D5DB',
    // Danger
    danger: '#EF4444',
    dangerSurface: '#FEE2E2',
    // Misc
    white: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.5)',
    // Input
    inputBackground: '#F9FAFB',
    inputBorder: '#D1D5DB',
    inputText: '#111827',
    placeholder: '#9CA3AF',
    // Points badge
    pointsBadge: '#FFF4E6',
    pointsText: '#F5A623',
  },
};

export const darkTheme = {
  isDark: true,
  colors: {
    // Backgrounds
    background: '#0F172A',
    backgroundGradient: ['#0F172A', '#1a3a2a'],
    card: '#1E293B',
    cardSecondary: '#273549',
    // Text
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textGray: '#CBD5E1',
    // Primary (green)
    primary: '#4caf66',
    primaryLight: '#6fcf85',
    primarySurface: '#132b1c',
    // Border
    border: '#334155',
    // Section label
    sectionLabel: '#CBD5E1',
    // Icons
    icon: '#E2E8F0',
    iconMuted: '#64748B',
    // Switch
    switchTrackOn: '#4caf66',
    switchTrackOff: '#475569',
    // Danger
    danger: '#F87171',
    dangerSurface: '#3b1414',
    // Misc
    white: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.7)',
    // Input
    inputBackground: '#273549',
    inputBorder: '#334155',
    inputText: '#F1F5F9',
    placeholder: '#64748B',
    // Points badge
    pointsBadge: '#2d1f06',
    pointsText: '#F5A623',
  },
};

export const ThemeContext = createContext({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  // Load persisted preference synchronously from MMKV
  const [isDark, setIsDark] = useState(() => {
    try {
      return storage.getString(THEME_KEY) === 'dark';
    } catch {
      return false;
    }
  });

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      storage.set(THEME_KEY, next ? 'dark' : 'light');
    } catch (e) {
      console.warn('ThemeContext: failed to persist theme', e);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
