import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/MMKVStore';

const THEME_KEY = 'app_theme_mode';

export const lightTheme = {
  isDark: false,
  colors: {
    background: '#FCFBF9',
    backgroundGradient: ['#FCFBF9', '#FAF6F0'],
    card: '#FFFFFF',
    cardSecondary: '#F3F4F6',
    text: '#111827',
    textSecondary: '#4B5563', // Increased contrast from #6B7280
    textMuted: '#6B7280',      // Increased contrast from #9CA3AF
    textGray: '#676666',
    primary: '#2f6f3f',
    primaryLight: '#4caf66',
    primarySurface: '#e7f5ec',
    border: '#E5E7EB',
    sectionLabel: '#374151',
    icon: '#111827',
    iconMuted: '#6B7280',      // Increased contrast from #9CA3AF
    switchTrackOn: '#4caf66',
    switchTrackOff: '#D1D5DB',
    danger: '#EF4444',
    dangerSurface: '#FEE2E2',
    white: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.5)',
    inputBackground: '#F9FAFB',
    inputBorder: '#D1D5DB',
    inputText: '#111827',
    placeholder: '#6B7280',    // Increased contrast from #9CA3AF
    pointsBadge: '#FFF4E6',
    pointsText: '#F5A623',
  },
};

export const darkTheme = {
  isDark: true,
  colors: {
    background: '#0F172A',
    backgroundGradient: ['#0F172A', '#1a3a2a'],
    card: '#1E293B',
    cardSecondary: '#273549',
    text: '#F1F5F9',
    textSecondary: '#E2E8F0', // Increased contrast from #94A3B8
    textMuted: '#94A3B8',      // Increased contrast from #64748B
    textGray: '#CBD5E1',
    primary: '#4caf66',
    primaryLight: '#6fcf85',
    primarySurface: '#132b1c',
    border: '#334155',
    sectionLabel: '#CBD5E1',
    icon: '#E2E8F0',
    iconMuted: '#94A3B8',      // Increased contrast from #64748B
    switchTrackOn: '#4caf66',
    switchTrackOff: '#475569',
    danger: '#F87171',
    dangerSurface: '#3b1414',
    white: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.7)',
    inputBackground: '#273549',
    inputBorder: '#334155',
    inputText: '#F1F5F9',
    placeholder: '#94A3B8',    // Increased contrast from #64748B
    pointsBadge: '#2d1f06',
    pointsText: '#F5A623',
  },
};

export const sunsetTheme = {
  isDark: false,
  colors: {
    background: '#fff7ed',
    backgroundGradient: ['#fff7ed', '#fed7aa', '#fdba74', '#f97316'],
    card: '#FFFFFF',
    cardSecondary: '#FFF1F2',
    text: '#431407',
    textSecondary: '#9A3412',
    textMuted: '#C2410C',
    textGray: '#EA580C',
    primary: '#ea580c',
    primaryLight: '#f97316',
    primarySurface: '#ffedd5',
    border: '#FED7AA',
    sectionLabel: '#431407',
    icon: '#431407',
    iconMuted: '#9A3412',
    switchTrackOn: '#ea580c',
    switchTrackOff: '#E5E7EB',
    danger: '#EF4444',
    dangerSurface: '#FEE2E2',
    white: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.5)',
    inputBackground: '#FFFDFB',
    inputBorder: '#FED7AA',
    inputText: '#431407',
    placeholder: '#9A3412',
    pointsBadge: '#FFF4E6',
    pointsText: '#F5A623',
  }
};

export const oceanTheme = {
  isDark: false,
  colors: {
    background: '#ecfeff',
    backgroundGradient: ['#ecfeff', '#a5f3fc', '#06b6d4', '#0891b2'],
    card: '#FFFFFF',
    cardSecondary: '#F6FEFF',
    text: '#083344',
    textSecondary: '#0891b2',
    textMuted: '#0e7490',
    textGray: '#06b6d4',
    primary: '#0891b2',
    primaryLight: '#22d3ee',
    primarySurface: '#cffafe',
    border: '#A5F3FC',
    sectionLabel: '#083344',
    icon: '#083344',
    iconMuted: '#0891b2',
    switchTrackOn: '#0891b2',
    switchTrackOff: '#E5E7EB',
    danger: '#EF4444',
    dangerSurface: '#FEE2E2',
    white: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.5)',
    inputBackground: '#F6FEFF',
    inputBorder: '#A5F3FC',
    inputText: '#083344',
    placeholder: '#0891b2',
    pointsBadge: '#FFF4E6',
    pointsText: '#F5A623',
  }
};

export const cyberTheme = {
  isDark: true,
  colors: {
    background: '#090514',
    backgroundGradient: ['#090514', '#1e0b36', '#2d0b5a', '#180126'],
    card: '#1b0e3a',
    cardSecondary: '#291754',
    text: '#F1F5F9',
    textSecondary: '#F472B6',
    textMuted: '#A78BFA',
    textGray: '#D8B4FE',
    primary: '#EC4899',
    primaryLight: '#F472B6',
    primarySurface: '#3c1236',
    border: '#4c2b9a',
    sectionLabel: '#F1F5F9',
    icon: '#F1F5F9',
    iconMuted: '#A78BFA',
    switchTrackOn: '#EC4899',
    switchTrackOff: '#3b2075',
    danger: '#F87171',
    dangerSurface: '#3b1414',
    white: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.7)',
    inputBackground: '#291754',
    inputBorder: '#4c2b9a',
    inputText: '#F1F5F9',
    placeholder: '#A78BFA',
    pointsBadge: '#2d1f06',
    pointsText: '#F5A623',
  }
};

export const roseTheme = {
  isDark: false,
  colors: {
    background: '#fff5f5',
    backgroundGradient: ['#fff5f5', '#fecaca', '#fca5a5', '#db2777'],
    card: '#FFFFFF',
    cardSecondary: '#FFF1F2',
    text: '#500724',
    textSecondary: '#db2777',
    textMuted: '#be185d',
    textGray: '#ec4899',
    primary: '#db2777',
    primaryLight: '#f43f5e',
    primarySurface: '#ffe4e6',
    border: '#FECACA',
    sectionLabel: '#500724',
    icon: '#500724',
    iconMuted: '#db2777',
    switchTrackOn: '#db2777',
    switchTrackOff: '#E5E7EB',
    danger: '#EF4444',
    dangerSurface: '#FEE2E2',
    white: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.5)',
    inputBackground: '#FFFDFD',
    inputBorder: '#FECACA',
    inputText: '#500724',
    placeholder: '#db2777',
    pointsBadge: '#FFF4E6',
    pointsText: '#F5A623',
  }
};

const THEMES = {
  light: lightTheme,
  dark: darkTheme,
  sunset: sunsetTheme,
  ocean: oceanTheme,
  cyber: cyberTheme,
  rose: roseTheme,
};

export const ThemeContext = createContext({
  theme: lightTheme,
  isDark: false,
  themeName: 'light',
  toggleTheme: () => { },
  setThemeByName: (name) => { },
});

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState(() => {
    try {
      const saved = storage.getString(THEME_KEY);
      // Backwards compatibility for 'dark' and 'light' boolean representations
      if (saved === 'dark') return 'dark';
      if (saved === 'light') return 'light';
      return saved || 'light';
    } catch {
      return 'light';
    }
  });

  const setThemeByName = (name) => {
    if (THEMES[name]) {
      setThemeName(name);
      try {
        storage.set(THEME_KEY, name);
      } catch (e) {
        console.warn('ThemeContext: failed to persist theme name', e);
      }
    }
  };

  const toggleTheme = () => {
    const next = themeName === 'dark' ? 'light' : 'dark';
    setThemeByName(next);
  };

  const theme = THEMES[themeName] || lightTheme;
  const isDark = theme.isDark;

  return (
    <ThemeContext.Provider value={{ theme, isDark, themeName, toggleTheme, setThemeByName }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
