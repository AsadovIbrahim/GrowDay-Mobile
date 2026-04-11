export const theme = {
  colors: {
    primary: "#22C55E",
    primaryLight: "#DCFCE7",
    primaryDark: "#166534",
    background: "#F9FAFB",
    surface: "#FFFFFF",
    textPrimary: "#111827",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    error: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6",
    white: "#FFFFFF",
    black: "#000000",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
  },
  typography: {
    h1: {
      fontSize: 24,
      fontWeight: 'bold',
      fontFamily: 'redditsans-bold',
    },
    h2: {
      fontSize: 20,
      fontWeight: 'bold',
      fontFamily: 'redditsans-bold',
    },
    bodyLarge: {
      fontSize: 18,
      fontWeight: '500',
      fontFamily: 'redditsans-medium',
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      fontFamily: 'redditsans-regular',
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      fontFamily: 'redditsans-regular',
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
      color: "#94a3b8",
      fontFamily: "redditsans-bold",
      letterSpacing: 1,
    }
  }
};

export const useTheme = () => theme;
