import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';

const AvatarWithBorder = ({ avatarUrl, level = 1, size = 50, style }) => {
  const { theme } = useTheme();
  const { colors } = theme;

  // Define border styles based on user level (TopTop app rewarding frame styles)
  let colorsList = null;
  let isGradient = false;
  let simpleBorderColor = colors.border || '#cbd5e1';
  let glowColor = 'transparent';
  let shadowRadiusVal = 0;
  let shadowOpacityVal = 0;

  if (level >= 50) {
    // Level 50+: Cosmic Emperor (Deep space portal)
    colorsList = ['#0f172a', '#a855f7', '#6366f1', '#090d16'];
    isGradient = true;
    glowColor = '#a855f7';
    shadowRadiusVal = 12;
    shadowOpacityVal = 0.95;
  } else if (level >= 40) {
    // Level 40-49: Dragon Warlord (Fiery Gold & Dragon)
    colorsList = ['#ffd700', '#ea580c', '#c2410c', '#7c2d12'];
    isGradient = true;
    glowColor = '#ea580c';
    shadowRadiusVal = 12;
    shadowOpacityVal = 0.95;
  } else if (level >= 30) {
    // Level 30-39: Devil Flame (Fiery flames engulfing the avatar ring + devil horns)
    colorsList = ['#ef4444', '#7f1d1d', '#000000'];
    isGradient = true;
    glowColor = '#ef4444';
    shadowRadiusVal = 10;
    shadowOpacityVal = 0.85;
  } else if (level >= 25) {
    // Level 25-29: Glacial Knight (Ice blue gradient)
    colorsList = ['#f0f9ff', '#bae6fd', '#38bdf8', '#0284c7'];
    isGradient = true;
    glowColor = '#38bdf8';
    shadowRadiusVal = 8;
    shadowOpacityVal = 0.75;
  } else if (level >= 20) {
    // Level 20-24: Cyber Neon (Cyberpunk neon ring with lightning bolt and diamond)
    colorsList = ['#06b6d4', '#ec4899', '#3b82f6'];
    isGradient = true;
    glowColor = '#ec4899';
    shadowRadiusVal = 7;
    shadowOpacityVal = 0.7;
  } else if (level >= 15) {
    // Level 15-19: Golden Royalty (Gold crown and medal)
    colorsList = ['#fbbf24', '#f59e0b', '#d97706'];
    isGradient = true;
    glowColor = '#fbbf24';
    shadowRadiusVal = 6;
    shadowOpacityVal = 0.6;
  } else if (level >= 10) {
    // Level 10-14: Silver Shield (Sparkles and protective metallic shield)
    colorsList = ['#94a3b8', '#e2e8f0', '#475569'];
    isGradient = true;
    glowColor = '#e2e8f0';
    shadowRadiusVal = 5;
    shadowOpacityVal = 0.45;
  } else if (level >= 5) {
    // Level 5-9: Bronze Star (Warm bronze with gold star)
    colorsList = ['#d97706', '#b45309', '#78350f'];
    isGradient = true;
    glowColor = '#d97706';
    shadowRadiusVal = 4;
    shadowOpacityVal = 0.3;
  } else {
    // Level 1-4: Newbie (Simple Border with leaf for progression)
    simpleBorderColor = level >= 2 ? '#22c55e' : colors.border || '#cbd5e1';
  }

  const paddingAmount = isGradient ? Math.max(2, size * (level >= 40 ? 0.08 : 0.05)) : 0;
  const containerSize = size + paddingAmount * 2;
  const borderRadius = containerSize / 2;
  const imageSize = size;
  const imageBorderRadius = size / 2;

  const renderAvatarImage = () => {
    if (avatarUrl) {
      return (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: imageSize, height: imageSize, borderRadius: imageBorderRadius }}
          resizeMode="cover"
        />
      );
    }
    return <FontAwesomeIcon icon={faUser} size={size * 0.45} color={colors.textSecondary} />;
  };

  const renderThemedDecorations = () => {
    if (level === 1) return null;

    const decorations = [];

    const addItem = (key, content, styleOptions) => {
      decorations.push(
        <View 
          key={key} 
          style={[
            styles.overlayWrapper, 
            { zIndex: 40 },
            styleOptions
          ]}
        >
          <Text style={{ fontSize: styleOptions.fontSize || size * 0.25 }}>
            {content}
          </Text>
        </View>
      );
    };

    if (level >= 50) {
      // Level 50: Cosmic Emperor (Deep space with planet, rocket, ufo, galaxy)
      addItem('top-planet', '🪐', { top: -size * 0.18, fontSize: size * 0.35 });
      addItem('bottom-galaxy', '🌌', { bottom: -size * 0.12, fontSize: size * 0.28 });
      addItem('bottom-l', '🚀', { bottom: -size * 0.08, left: size * 0.06, fontSize: size * 0.24, transform: [{ rotate: '-45deg' }] });
      addItem('bottom-r', '🛸', { bottom: -size * 0.08, right: size * 0.06, fontSize: size * 0.24, transform: [{ rotate: '25deg' }] });
      addItem('mid-l', '☄️', { bottom: size * 0.10, left: -size * 0.08, fontSize: size * 0.22, transform: [{ rotate: '-45deg' }] });
      addItem('mid-r', '☄️', { bottom: size * 0.10, right: -size * 0.08, fontSize: size * 0.22, transform: [{ rotate: '45deg' }] });
    } else if (level >= 40) {
      // Level 40: Dragon Warlord (Gold frame + dragon + swords + fire)
      addItem('top-crown', '👑', { top: -size * 0.20, fontSize: size * 0.38 });
      addItem('bottom-c', '🐲', { bottom: -size * 0.12, fontSize: size * 0.28 });
      addItem('bottom-l', '⚔️', { bottom: -size * 0.08, left: size * 0.06, fontSize: size * 0.22, transform: [{ rotate: '-25deg' }] });
      addItem('bottom-r', '⚔️', { bottom: -size * 0.08, right: size * 0.06, fontSize: size * 0.22, transform: [{ rotate: '25deg' }] });
      addItem('mid-l', '🔥', { bottom: size * 0.08, left: -size * 0.08, fontSize: size * 0.22, transform: [{ rotate: '-45deg' }] });
      addItem('mid-r', '🔥', { bottom: size * 0.08, right: -size * 0.08, fontSize: size * 0.22, transform: [{ rotate: '45deg' }] });
    } else if (level >= 30) {
      // Level 30: Devil Flame (Fiery flames engulfing the avatar ring + devil horns)
      addItem('top-horns', '😈', { top: -size * 0.18, fontSize: size * 0.32 });
      addItem('flame-tl', '🔥', { top: size * 0.05, left: -size * 0.10, fontSize: size * 0.25, transform: [{ rotate: '-35deg' }] });
      addItem('flame-tr', '🔥', { top: size * 0.05, right: -size * 0.10, fontSize: size * 0.25, transform: [{ rotate: '35deg' }] });
      addItem('flame-bl', '🔥', { bottom: size * 0.05, left: -size * 0.10, fontSize: size * 0.25, transform: [{ rotate: '-145deg' }] });
      addItem('flame-br', '🔥', { bottom: size * 0.05, right: -size * 0.10, fontSize: size * 0.25, transform: [{ rotate: '145deg' }] });
      addItem('bottom-fire', '💥', { bottom: -size * 0.10, fontSize: size * 0.28 });
    } else if (level >= 25) {
      // Level 25: Glacial Knight (Ice blue border + snowflake + shield + ice cubes)
      addItem('top-snow', '❄️', { top: -size * 0.16, fontSize: size * 0.30 });
      addItem('bottom-c', '🛡️', { bottom: -size * 0.08, fontSize: size * 0.24 });
      addItem('bottom-l', '🧊', { bottom: -size * 0.06, left: size * 0.08, fontSize: size * 0.20 });
      addItem('bottom-r', '🧊', { bottom: -size * 0.06, right: size * 0.08, fontSize: size * 0.20 });
      addItem('mid-l', '✨', { bottom: size * 0.25, left: -size * 0.12, fontSize: size * 0.22, transform: [{ rotate: '-20deg' }] });
      addItem('mid-r', '✨', { bottom: size * 0.25, right: -size * 0.12, fontSize: size * 0.22, transform: [{ rotate: '20deg' }] });
    } else if (level >= 20) {
      // Level 20: Cyber Neon (Cyberpunk neon ring with lightning bolt and diamond)
      addItem('top-lightning', '⚡', { top: -size * 0.16, fontSize: size * 0.30 });
      addItem('bottom-gem', '💎', { bottom: -size * 0.08, fontSize: size * 0.25 });
      addItem('mid-l', '🌌', { bottom: size * 0.20, left: -size * 0.10, fontSize: size * 0.20 });
      addItem('mid-r', '🌌', { bottom: size * 0.20, right: -size * 0.10, fontSize: size * 0.20 });
    } else if (level >= 15) {
      // Level 15: Golden Royalty (Gold crown and medal)
      addItem('top-crown', '👑', { top: -size * 0.16, fontSize: size * 0.32 });
      addItem('bottom-medal', '🏅', { bottom: -size * 0.08, fontSize: size * 0.25 });
      addItem('star-l', '⭐', { bottom: size * 0.25, left: -size * 0.08, fontSize: size * 0.16 });
      addItem('star-r', '⭐', { bottom: size * 0.25, right: -size * 0.08, fontSize: size * 0.16 });
    } else if (level >= 10) {
      // Level 10: Silver Shield (Sparkles and protective metallic shield)
      addItem('top-sparkles', '✨', { top: -size * 0.14, fontSize: size * 0.25 });
      addItem('bottom-shield', '🛡️', { bottom: -size * 0.08, fontSize: size * 0.25 });
      addItem('star-l', '✨', { bottom: size * 0.25, left: -size * 0.08, fontSize: size * 0.16 });
      addItem('star-r', '✨', { bottom: size * 0.25, right: -size * 0.08, fontSize: size * 0.16 });
    } else if (level >= 5) {
      // Level 5: Bronze Star (Warm bronze with gold star)
      addItem('bottom-star', '⭐', { bottom: -size * 0.08, fontSize: size * 0.25 });
      addItem('sparkle-l', '✨', { bottom: size * 0.20, left: -size * 0.08, fontSize: size * 0.16 });
      addItem('sparkle-r', '✨', { bottom: size * 0.20, right: -size * 0.08, fontSize: size * 0.16 });
    } else if (level >= 2) {
      // Level 2: Newbie Sprout
      addItem('bottom-sprout', '🌱', { bottom: -size * 0.08, fontSize: size * 0.25 });
    }

    return decorations;
  };

  if (isGradient && colorsList) {
    return (
      <View 
        style={[
          styles.outerContainer, 
          { 
            width: containerSize, 
            height: containerSize,
            shadowColor: glowColor,
            shadowRadius: shadowRadiusVal,
            shadowOpacity: shadowOpacityVal,
          }, 
          style
        ]}
      >
        <LinearGradient
          colors={colorsList}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientContainer,
            {
              width: containerSize,
              height: containerSize,
              borderRadius: borderRadius,
              padding: paddingAmount,
            },
          ]}
        >
          <View
            style={[
              styles.innerCircle,
              {
                width: imageSize,
                height: imageSize,
                borderRadius: imageBorderRadius,
                backgroundColor: colors.card,
              },
            ]}
          >
            {renderAvatarImage()}
          </View>
        </LinearGradient>
        {renderThemedDecorations()}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.simpleContainer,
        {
          width: size,
          height: size,
          borderRadius: imageBorderRadius,
          borderColor: simpleBorderColor,
          borderWidth: level >= 2 ? 2.5 : 1.5,
          backgroundColor: colors.cardSecondary || 'rgba(0,0,0,0.03)',
        },
        style,
      ]}
    >
      {renderAvatarImage()}
      {renderThemedDecorations()}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
  },
  gradientContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  simpleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  overlayWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
});

export default AvatarWithBorder;
