import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Vibration,
  Dimensions,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faStar, faLockOpen, faTrophy, faMedal } from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import Sound from 'react-native-sound';
import AvatarWithBorder from './AvatarWithBorder';

Sound.setCategory('Playback');

const PREDEFINED_AVATARS = [
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Felix', level: 1, name: 'Felix' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Aneka', level: 1, name: 'Aneka' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Jack', level: 1, name: 'Jack' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Luna', level: 1, name: 'Luna' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Bella', level: 1, name: 'Bella' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Toby', level: 1, name: 'Toby' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Oliver', level: 2, name: 'Oliver' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Sophie', level: 2, name: 'Sophie' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Charlie', level: 2, name: 'Charlie' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Emily', level: 2, name: 'Emily' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Buster', level: 3, name: 'Buster' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Zoe', level: 3, name: 'Zoe' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Sammy', level: 3, name: 'Sammy' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Amber', level: 3, name: 'Amber' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Leo', level: 5, name: 'Leo' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Mia', level: 5, name: 'Mia' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Max', level: 5, name: 'Max' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Ruby', level: 5, name: 'Ruby' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Milo', level: 8, name: 'Milo' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Lily', level: 8, name: 'Lily' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Jasper', level: 8, name: 'Jasper' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Chloe', level: 8, name: 'Chloe' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Oscar', level: 12, name: 'Oscar' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Daisy', level: 12, name: 'Daisy' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Shadow', level: 12, name: 'Shadow' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Cookie', level: 12, name: 'Cookie' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Simba', level: 15, name: 'Simba' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Nala', level: 15, name: 'Nala' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Rocky', level: 15, name: 'Rocky' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Coco', level: 15, name: 'Coco' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Thor', level: 20, name: 'Thor' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Freya', level: 20, name: 'Freya' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Zeus', level: 20, name: 'Zeus' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Hera', level: 20, name: 'Hera' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Odin', level: 25, name: 'Odin' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Athena', level: 25, name: 'Athena' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Arthur', level: 30, name: 'Arthur' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Guinevere', level: 30, name: 'Guinevere' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Merlin', level: 40, name: 'Merlin' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Morgana', level: 40, name: 'Morgana' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Phoenix', level: 50, name: 'Phoenix' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Valkyrie', level: 50, name: 'Valkyrie' }
];

const PREDEFINED_BORDERS = [
  { level: 5, name: 'Bronze' },
  { level: 10, name: 'Silver' },
  { level: 15, name: 'Gold' },
  { level: 20, name: 'Cyber' },
  { level: 25, name: 'Glacial' },
  { level: 30, name: 'Devil' },
  { level: 40, name: 'Dragon' },
  { level: 50, name: 'Cosmic' }
];

const { width } = Dimensions.get('window');

const LevelUpModal = ({ visible, level, onClose }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const avatarScaleAnim = useRef(new Animated.Value(0)).current;

  // Star animations
  const star1Anim = useRef(new Animated.Value(0)).current;
  const star2Anim = useRef(new Animated.Value(0)).current;
  const star3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Vibrate on level up
      Vibration.vibrate([0, 150, 80, 150]);

      // Play glorious success sound
      const levelUpSound = new Sound('success.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (!error) {
          levelUpSound.play(() => {
            levelUpSound.release();
          });
        }
      });

      // Reset values
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);
      floatAnim.setValue(0);
      avatarScaleAnim.setValue(0);
      star1Anim.setValue(0);
      star2Anim.setValue(0);
      star3Anim.setValue(0);

      // Entrance animation
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 30,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Star pop sequences
        Animated.sequence([
          Animated.delay(100),
          Animated.spring(star1Anim, { toValue: 1, tension: 50, useNativeDriver: true }),
          Animated.spring(star2Anim, { toValue: 1, tension: 50, useNativeDriver: true }),
          Animated.spring(star3Anim, { toValue: 1, tension: 50, useNativeDriver: true }),
        ]).start();

        // Unlock list pop-in
        Animated.spring(avatarScaleAnim, {
          toValue: 1,
          tension: 40,
          useNativeDriver: true,
        }).start();
      });

      // Infinite loop background shine rotation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Soft infinite floating for the badge
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -8,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  if (!visible || !level) return null;

  // Derive unlocked avatars and borders for this specific level
  const unlockedAvatars = PREDEFINED_AVATARS.filter(a => a.level === level);
  const unlockedBorder = PREDEFINED_BORDERS.find(b => b.level === level);
  const hasUnlocked = unlockedAvatars.length > 0 || !!unlockedBorder;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Full screen backdrop blur simulated with overlay */}
        <View style={styles.blurBackdrop} />

        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.card,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Glowing Radial Halo effect */}
          <Animated.View style={[styles.haloContainer, { transform: [{ rotate: spin }] }]}>
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.4)', 'rgba(168, 85, 247, 0.2)', 'transparent']}
              style={styles.haloGradient}
            />
          </Animated.View>

          {/* Floating Stars */}
          <Animated.View style={[styles.starBubble1, { transform: [{ scale: star1Anim }] }]}>
            <FontAwesomeIcon icon={faStar} size={22} color="#f59e0b" />
          </Animated.View>
          <Animated.View style={[styles.starBubble2, { transform: [{ scale: star2Anim }] }]}>
            <FontAwesomeIcon icon={faStar} size={30} color="#eab308" />
          </Animated.View>
          <Animated.View style={[styles.starBubble3, { transform: [{ scale: star3Anim }] }]}>
            <FontAwesomeIcon icon={faStar} size={18} color="#f59e0b" />
          </Animated.View>

          {/* Level Shield/Badge Section */}
          <Animated.View style={{ transform: [{ translateY: floatAnim }], alignItems: 'center' }}>
            <LinearGradient
              colors={['#fbbf24', '#d97706']}
              style={styles.badgeOuter}
            >
              <LinearGradient
                colors={['#8b5cf6', '#6d28d9']}
                style={styles.badgeInner}
              >
                <FontAwesomeIcon icon={faTrophy} size={36} color="#fbbf24" style={styles.trophyIcon} />
                <Text style={styles.badgeLevelLabel}>
                  {t("levelup.badge_label", { defaultValue: "LEVEL" })}
                </Text>
                <Text style={styles.badgeLevelNum}>{level}</Text>
              </LinearGradient>
            </LinearGradient>
          </Animated.View>

          {/* Congratulations Heading */}
          <Text className="font-redditsans-bold" style={[styles.title, { color: colors.text }]}>
            {t("levelup.title", { defaultValue: "LEVEL UP!" })}
          </Text>

          <Text className="font-redditsans-regular" style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("levelup.subtitle", { level, defaultValue: `Congratulations! You've reached Level ${level}!` })}
          </Text>

          {/* Unlocked Avatars Container (Production-grade gamification detail) */}
          {hasUnlocked ? (
            <Animated.View
              style={[
                styles.unlockContainer,
                {
                  transform: [{ scale: avatarScaleAnim }],
                  backgroundColor: colors.cardSecondary || 'rgba(0,0,0,0.03)',
                  borderColor: 'rgba(234, 179, 8, 0.3)',
                },
              ]}
            >
              <View style={styles.unlockHeader}>
                <FontAwesomeIcon icon={faLockOpen} size={16} color="#eab308" />
                <Text className="font-redditsans-bold" style={[styles.unlockTitle, { color: colors.text }]}>
                  {unlockedAvatars.length > 0 && unlockedBorder
                    ? t("levelup.unlocked_all", { defaultValue: "New Avatars & Border Unlocked! 🎉" })
                    : unlockedBorder
                    ? t("levelup.unlocked_border", { defaultValue: "New Border Unlocked! 🎉" })
                    : t("levelup.unlocked_avatars", { defaultValue: "New Avatars Unlocked!" })
                  }
                </Text>
              </View>

              <View style={styles.avatarRow}>
                {unlockedAvatars.map((avatar, idx) => (
                  <View key={`avatar-${idx}`} style={styles.avatarWrapper}>
                    <LinearGradient
                      colors={['rgba(251, 191, 36, 0.3)', 'transparent']}
                      style={styles.avatarGlow}
                    >
                      <Image source={{ uri: avatar.url }} style={styles.avatarImg} />
                    </LinearGradient>
                    <Text className="font-redditsans-medium" style={[styles.avatarName, { color: colors.textSecondary }]} numberOfLines={1}>
                      {avatar.name}
                    </Text>
                  </View>
                ))}

                {unlockedBorder && (
                  <View style={styles.avatarWrapper}>
                    <View
                      style={[
                        styles.avatarGlow,
                        {
                          backgroundColor: 'transparent',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: 0
                        }
                      ]}
                    >
                      <AvatarWithBorder
                        avatarUrl="https://api.dicebear.com/7.x/adventurer/png?seed=Felix"
                        level={unlockedBorder.level}
                        size={40}
                      />
                    </View>
                    <Text className="font-redditsans-medium" style={[styles.avatarName, { color: colors.textSecondary }]} numberOfLines={1}>
                      {t(`levelup.border_name_${unlockedBorder.name.toLowerCase()}`, { defaultValue: `${unlockedBorder.name} Border` })}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          ) : (
            <Text className="font-redditsans-regular" style={[styles.keepGoingText, { color: colors.textSecondary }]}>
              {t("levelup.keep_going", { defaultValue: "Keep crushing your habits to unlock new legendary avatars!" })}
            </Text>
          )}

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              style={styles.primaryBtn}
            >
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.primaryGradient}
              >
                <Text className="font-redditsans-bold" style={styles.btnText}>
                  {t("levelup.awesome", { defaultValue: "Awesome!" })}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.82)',
    paddingHorizontal: 24,
  },
  blurBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 36,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    position: 'relative',
    overflow: 'hidden',
  },
  haloContainer: {
    position: 'absolute',
    top: -90,
    width: 320,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  haloGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 160,
  },
  badgeOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  badgeInner: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  trophyIcon: {
    marginBottom: -4,
  },
  badgeLevelLabel: {
    color: '#fbbf24',
    fontSize: 9,
    fontFamily: 'RedditSans-Bold',
    fontWeight: '800',
    letterSpacing: 2,
  },
  badgeLevelNum: {
    color: '#ffffff',
    fontSize: 34,
    fontFamily: 'RedditSans-Bold',
    fontWeight: '900',
    lineHeight: 38,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  starBubble1: {
    position: 'absolute',
    top: 50,
    left: 45,
  },
  starBubble2: {
    position: 'absolute',
    top: 30,
    right: 50,
  },
  starBubble3: {
    position: 'absolute',
    bottom: 220,
    right: 35,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 20,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    lineHeight: 20,
  },
  keepGoingText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  unlockContainer: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginTop: 20,
    marginBottom: 8,
    alignItems: 'center',
  },
  unlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  unlockTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  avatarWrapper: {
    alignItems: 'center',
  },
  avatarGlow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarName: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  btnRow: {
    width: '100%',
    marginTop: 24,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default LevelUpModal;
