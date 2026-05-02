import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMinus } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';

// Verified fallback images per category — used when remote image fails
const FALLBACKS = {
  Fitness:      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
  Health:       'https://images.unsplash.com/photo-1505751172107-573225a91717?w=400',
  Mindfulness:  'https://images.unsplash.com/photo-1508672019048-805c876b67bd?w=400',
  Productivity: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400',
  Sleep:        'https://images.unsplash.com/photo-1511295742364-911243512971?w=400',
  default:      'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400',
};

const LearningCard = ({ title, image, category, onPress }) => {
  const { theme } = useTheme();
  const { colors } = theme;

  const [imageLoading, setImageLoading] = useState(true);
  const [imageError,   setImageError]   = useState(false);
  const [imgSource,    setImgSource]    = useState({ uri: image });

  const fallbackUri = FALLBACKS[category] ?? FALLBACKS.default;

  const handleLoadEnd = () => setImageLoading(false);

  const handleError = () => {
    setImageLoading(false);
    if (!imageError) {
      // First failure → try category fallback
      setImageError(true);
      setImgSource({ uri: fallbackUri });
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, { backgroundColor: colors.card }]}
      activeOpacity={0.88}
    >
      {/* ── Image area with skeleton ── */}
      <View style={styles.imageContainer}>
        {/* Skeleton shown while image loads */}
        {imageLoading && (
          <View style={[styles.skeleton, { backgroundColor: colors.border ?? '#2a2a2a' }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        <Image
          source={imgSource}
          style={[styles.image, imageLoading && styles.imageHidden]}
          resizeMode="cover"
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          // Lazy load — React Native defers off-screen images automatically
          fadeDuration={200}
        />

        {/* Subtle category badge */}
        {category && (
          <View style={[styles.badge, { backgroundColor: colors.primary + 'CC' }]}>
            <Text style={styles.badgeText}>{category}</Text>
          </View>
        )}
      </View>

      {/* ── Text body ── */}
      <View style={styles.body}>
        <View style={styles.row}>
          <View style={[styles.iconBadge, { backgroundColor: colors.primary + '22' }]}>
            <FontAwesomeIcon icon={faMinus} size={12} color={colors.primary} />
          </View>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={3}
          >
            {title}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    minHeight: 230,
  },
  imageContainer: {
    height: 148,
    width: '100%',
    backgroundColor: '#1a1a1a',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageHidden: {
    opacity: 0,
    position: 'absolute',
  },
  skeleton: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'RedditSans-SemiBold',
    letterSpacing: 0.3,
  },
  body: {
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  title: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'RedditSans-SemiBold',
    lineHeight: 19,
  },
});

export default LearningCard;
