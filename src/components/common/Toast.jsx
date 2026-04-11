import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

const CONFIGS = {
  success: {
    bg: "#1a2e1a",
    accent: "#4ade80",
    iconColor: "#4ade80",
    icon: faCircleCheck,
  },
  error: {
    bg: "#2e1a1a",
    accent: "#f87171",
    iconColor: "#f87171",
    icon: faCircleExclamation,
  },
  info: {
    bg: "#1a1f2e",
    accent: "#60a5fa",
    iconColor: "#60a5fa",
    icon: faCircleInfo,
  },
  warning: {
    bg: "#2e2a1a",
    accent: "#fbbf24",
    iconColor: "#fbbf24",
    icon: faTriangleExclamation,
  },
};

/**
 * Toast component — ekranın ALT hissəsindən slide-up
 * @param {boolean}  visible
 * @param {string}   message
 * @param {string}   type      'success' | 'error' | 'info' | 'warning'
 * @param {Function} onHide
 * @param {number}   duration  ms, default 2500
 */
const Toast = ({ visible, message, type = "success", onHide, duration = 2500 }) => {
  const translateY = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  const cfg = CONFIGS[type] || CONFIGS.success;

  useEffect(() => {
    if (!visible) return;

    // Slide-up + fade-in + scale-up
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 70,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 70,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      // Slide-down + fade-out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 120,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.92,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start(() => onHide?.());
    }, duration);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 48,
        left: 20,
        right: 20,
        zIndex: 9999,
        transform: [{ translateY }, { scale }],
        opacity,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: cfg.bg,
          borderRadius: 18,
          paddingVertical: 14,
          paddingHorizontal: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 20,
          elevation: 16,
          borderWidth: 1,
          borderColor: cfg.accent + "33",
        }}
      >
        {/* Icon badge */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: cfg.accent + "22",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
            borderWidth: 1,
            borderColor: cfg.accent + "44",
          }}
        >
          <FontAwesomeIcon icon={cfg.icon} size={20} color={cfg.accent} />
        </View>

        {/* Message */}
        <Text
          style={{
            flex: 1,
            color: "#fff",
            fontFamily: "RedditSans-SemiBold",
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          {message}
        </Text>

        {/* Right accent dot */}
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: cfg.accent,
            marginLeft: 12,
          }}
        />
      </View>
    </Animated.View>
  );
};

export default Toast;
