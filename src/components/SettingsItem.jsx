import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Animated,
  StyleSheet,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';

/**
 * SettingsItem – reusable settings row
 *
 * Props:
 *  icon        – FontAwesome icon object
 *  title       – string label
 *  type        – 'toggle' | 'navigation' | 'text'  (default: 'navigation')
 *  value       – boolean (for toggle) or string (for text right side)
 *  onToggle    – callback for toggle change
 *  onPress     – callback for navigation tap
 *  hideBorder  – hide bottom separator
 *  rightText   – string shown on right side when type='text'
 */
const SettingsItem = ({
  icon,
  title,
  type = 'navigation',
  value,
  onToggle,
  onPress,
  hideBorder = false,
  rightText,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (type !== 'toggle') {
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
    }
  };

  const handlePressOut = () => {
    if (type !== 'toggle') {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={type !== 'toggle' ? onPress : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={type === 'toggle'}
        activeOpacity={type === 'toggle' ? 1 : 0.85}
        style={[
          styles.row,
          !hideBorder && { borderBottomWidth: 1, borderBottomColor: colors.border },
        ]}
      >
        {/* Icon */}
        <View style={styles.iconWrap}>
          <FontAwesomeIcon icon={icon} size={19} color={colors.icon} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

        {/* Right element */}
        {type === 'toggle' && (
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.switchTrackOff}
          />
        )}
        {type === 'navigation' && (
          <FontAwesomeIcon icon={faChevronRight} size={13} color={colors.iconMuted} />
        )}
        {type === 'text' && (
          <Text style={[styles.rightText, { color: colors.textMuted }]}>{rightText}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 26,
    alignItems: 'center',
  },
  title: {
    flex: 1,
    marginLeft: 14,
    fontSize: 15,
    fontFamily: 'RedditSans-Medium',
    fontWeight: '500',
  },
  rightText: {
    fontSize: 13,
    fontFamily: 'RedditSans-Regular',
  },
});

export default SettingsItem;
