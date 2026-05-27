import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faSeedling, faFire, faBolt, faSkull } from '@fortawesome/free-solid-svg-icons';

const { width } = Dimensions.get('window');

const DIFFICULTIES = [
  { id: 'easy', icon: faSeedling, color: '#10B981', mult: 1.0, titleKey: 'games.diff_easy', defaultTitle: 'Easy' },
  { id: 'medium', icon: faFire, color: '#F59E0B', mult: 1.5, titleKey: 'games.diff_medium', defaultTitle: 'Medium' },
  { id: 'hard', icon: faBolt, color: '#EF4444', mult: 2.0, titleKey: 'games.diff_hard', defaultTitle: 'Hard' },
  { id: 'expert', icon: faSkull, color: '#8B5CF6', mult: 3.0, titleKey: 'games.diff_expert', defaultTitle: 'Expert' }
];

export default function GameDifficultyModal({ visible, onClose, onSelect }) {
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 50, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, [visible]);

  if (!visible && fadeAnim._value === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim, backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <View className="flex-1 justify-center items-center px-6">
        <Animated.View 
          className="w-full rounded-3xl overflow-hidden"
          style={{
            backgroundColor: colors.card,
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10
          }}
        >
          {/* Header */}
          <LinearGradient
            colors={[colors.primary + '20', 'transparent']}
            className="px-6 py-6 items-center border-b"
            style={{ borderBottomColor: colors.border }}
          >
            <TouchableOpacity 
              onPress={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.background }}
            >
              <FontAwesomeIcon icon={faTimes} color={colors.textSecondary} size={16} />
            </TouchableOpacity>
            
            <View className="w-14 h-14 rounded-full items-center justify-center mb-3" style={{ backgroundColor: colors.primary + '20' }}>
              <Text className="text-2xl">🎮</Text>
            </View>
            <Text className="text-xl font-redditsans-bold text-center" style={{ color: colors.text }}>
              {t('games.select_diff_title', 'Select Difficulty')}
            </Text>
            <Text className="text-sm font-redditsans-regular text-center mt-2" style={{ color: colors.textSecondary }}>
              {t('games.diff_desc', 'Higher difficulty grants higher score multipliers!')}
            </Text>
          </LinearGradient>

          {/* Options */}
          <View className="p-4 space-y-3">
            {DIFFICULTIES.map((diff, index) => (
              <TouchableOpacity
                key={diff.id}
                onPress={() => {
                  onClose();
                  setTimeout(() => onSelect(diff), 300);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.cardSecondary, colors.cardSecondary]}
                  className="flex-row items-center p-4 rounded-2xl border"
                  style={{ borderColor: diff.color + '40' }}
                >
                  <View className="w-12 h-12 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: diff.color + '15' }}>
                    <FontAwesomeIcon icon={diff.icon} size={22} color={diff.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-redditsans-bold mb-1" style={{ color: diff.color }}>
                      {t(diff.titleKey, diff.defaultTitle)}
                    </Text>
                    <Text className="text-xs font-redditsans-medium text-gray-500">
                      {t('games.score_multiplier', 'Score Multiplier: ')}<Text className="font-redditsans-bold" style={{ color: colors.text }}>x{diff.mult.toFixed(1)}</Text>
                    </Text>
                  </View>
                  <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: diff.color + '20' }}>
                    <Text className="font-redditsans-bold text-xs" style={{ color: diff.color }}>GO</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
