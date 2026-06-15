import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Easing, NativeModules } from 'react-native';
import Sound from 'react-native-sound';

const { RNSound } = NativeModules;
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faHeadphones, faVolumeHigh, faVolumeLow } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

Sound.setCategory('Playback');

const FOCUS_SOUNDS = [
  { id: 'rain', emoji: '🌧️', url: 'focus_rain.mp3' },
  { id: 'forest', emoji: '🌲', url: 'focus_forest.mp3' },
  { id: 'ocean', emoji: '🌊', url: 'focus_ocean.mp3' },
  { id: 'fireplace', emoji: '🔥', url: 'focus_fireplace.mp3' },
  { id: 'night', emoji: '🌙', url: 'focus_night.mp3' },
  { id: 'river', emoji: '💧', url: 'focus_river.mp3' },
];

let activeSoundInstance = null;
let activeSoundId = null;
let activeVolume = 0.5;
let activeHabitId = null;
let isGlobalSoundPlaying = false;
let listeners = new Set();

const subscribe = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notify = () => {
  listeners.forEach(l => l({ activeSoundId, activeVolume, activeHabitId, isGlobalSoundPlaying }));
};

export const stopGlobalFocusSound = () => {
  if (activeSoundInstance) {
    try {
      if (RNSound && typeof activeSoundInstance._key === 'number') {
        RNSound.cancelStopAfter(activeSoundInstance._key);
      }
      activeSoundInstance.stop();
      activeSoundInstance.release();
    } catch (e) {
      console.log('Error stopping global focus sound:', e);
    }
    activeSoundInstance = null;
    activeSoundId = null;
    activeHabitId = null;
    isGlobalSoundPlaying = false;
    notify();
  }
};

const FocusSoundsPanel = ({ timerActive, habitId, remainingSeconds }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();

  const [activeSoundIdState, setActiveSoundIdState] = useState(activeSoundId);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(activeVolume);
  const [isPlayingState, setIsPlayingState] = useState(isGlobalSoundPlaying);
  const isMountedRef = useRef(true);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Sync state with singleton
  useEffect(() => {
    isMountedRef.current = true;
    const unsubscribe = subscribe(({ activeSoundId: newId, activeVolume: newVol, isGlobalSoundPlaying: newPlaying }) => {
      if (isMountedRef.current) {
        setActiveSoundIdState(newId);
        setVolume(newVol);
        setIsPlayingState(newPlaying);
      }
    });
    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []);

  // React to timer state changes
  useEffect(() => {
    if (!activeSoundInstance || !activeSoundId) return;

    if (timerActive) {
      // Claim sound for current habit when timer is active
      activeHabitId = habitId;
      activeSoundInstance.play();
      isGlobalSoundPlaying = true;
      if (RNSound && typeof activeSoundInstance._key === 'number' && typeof remainingSeconds === 'number' && remainingSeconds > 0) {
        RNSound.stopAfter(activeSoundInstance._key, remainingSeconds);
      }
      notify();
    } else {
      // Only pause if this habit owns the sound
      if (activeHabitId === habitId) {
        activeSoundInstance.pause();
        if (RNSound && typeof activeSoundInstance._key === 'number') {
          RNSound.cancelStopAfter(activeSoundInstance._key);
        }
        isGlobalSoundPlaying = false;
        notify();
      }
    }
  }, [timerActive, habitId, remainingSeconds]);

  // Pulse animation for now-playing indicator
  useEffect(() => {
    if (activeSoundIdState && isPlayingState) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
    }
  }, [activeSoundIdState, isPlayingState, pulseAnim]);

  const handleSelectSound = (sound) => {
    if (activeSoundIdState === sound.id) {
      stopGlobalFocusSound();
      return;
    }

    if (activeSoundInstance) {
      try {
        activeSoundInstance.stop();
        activeSoundInstance.release();
      } catch (e) { }
      activeSoundInstance = null;
    }

    activeSoundId = sound.id;
    activeHabitId = habitId; // Claim ownership on selection
    setIsLoading(true);
    notify();

    const newSound = new Sound(sound.url, Sound.MAIN_BUNDLE, (error) => {
      if (isMountedRef.current) {
        setIsLoading(false);
      }

      if (error) {
        console.log('Failed to load focus sound:', error);
        activeSoundId = null;
        activeHabitId = null;
        isGlobalSoundPlaying = false;
        notify();
        return;
      }

      newSound.setNumberOfLoops(-1);
      newSound.setVolume(activeVolume);
      activeSoundInstance = newSound;

      if (timerActive) {
        newSound.play();
        isGlobalSoundPlaying = true;
        if (RNSound && typeof newSound._key === 'number' && typeof remainingSeconds === 'number' && remainingSeconds > 0) {
          RNSound.stopAfter(newSound._key, remainingSeconds);
        }
      } else {
        isGlobalSoundPlaying = false;
      }
      notify();
    });
  };

  const adjustVolume = (direction) => {
    const step = 0.15;
    const newVol = direction === 'up'
      ? Math.min(1, activeVolume + step)
      : Math.max(0.1, activeVolume - step);

    activeVolume = newVol;
    setVolume(newVol);
    if (activeSoundInstance) {
      activeSoundInstance.setVolume(newVol);
    }
    notify();
  };

  const activeSound = FOCUS_SOUNDS.find(s => s.id === activeSoundIdState);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: activeSoundId ? colors.primary + '40' : colors.border || colors.textSecondary + '15' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: (activeSoundId ? colors.primary : colors.textSecondary) + '15' }]}>
          <FontAwesomeIcon icon={faHeadphones} color={activeSoundId ? colors.primary : colors.textSecondary} size={12} />
        </View>
        <Text className="font-redditsans-bold" style={[styles.title, { color: colors.text }]}>
          {t('focus_sounds.title', { defaultValue: 'Focus Sounds' })}
        </Text>
        {isLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 'auto' }} />}
      </View>

      {/* Sound Options — 3x2 Grid */}
      <View style={styles.soundsGrid}>
        {FOCUS_SOUNDS.map((sound) => {
          const isActive = activeSoundId === sound.id;
          return (
            <TouchableOpacity
              key={sound.id}
              onPress={() => handleSelectSound(sound)}
              activeOpacity={0.7}
              style={[
                styles.soundBtn,
                {
                  backgroundColor: isActive ? colors.primary + '18' : colors.cardSecondary || colors.background,
                  borderColor: isActive ? colors.primary : colors.textSecondary + '12',
                },
              ]}
            >
              {isActive && isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.soundEmoji}>{sound.emoji}</Text>
              )}
              <Text
                className="font-redditsans-medium"
                style={[styles.soundLabel, { color: isActive ? colors.primary : colors.textSecondary }]}
                numberOfLines={1}
              >
                {t(`focus_sounds.${sound.id}`, { defaultValue: sound.id })}
              </Text>
              {isActive && isPlayingState && (
                <Animated.View style={[styles.liveIndicator, { backgroundColor: colors.primary, transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Now Playing + Volume */}
      {activeSound && (
        <View style={[styles.nowPlaying, { backgroundColor: colors.primary + '0C', borderColor: colors.primary + '20' }]}>
          <View style={styles.nowPlayingLeft}>
            <Text style={styles.nowPlayingEmoji}>{activeSound.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text className="font-redditsans-bold" style={[styles.nowPlayingStatus, { color: colors.primary }]}>
                {isPlayingState
                  ? t('focus_sounds.now_playing', { defaultValue: 'Now Playing' })
                  : t('focus_sounds.ready', { defaultValue: 'Ready to Play' })}
              </Text>
              <Text className="font-redditsans-medium" style={[styles.nowPlayingName, { color: colors.textSecondary }]}>
                {t(`focus_sounds.${activeSound.id}`, { defaultValue: activeSound.id })}
              </Text>
            </View>
          </View>
          <View style={styles.volumeControls}>
            <TouchableOpacity onPress={() => adjustVolume('down')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.volumeBtn}>
              <FontAwesomeIcon icon={faVolumeLow} color={colors.textSecondary} size={12} />
            </TouchableOpacity>
            <View style={[styles.volumeTrack, { backgroundColor: colors.textSecondary + '20' }]}>
              <View style={[styles.volumeFill, { width: `${volume * 100}%`, backgroundColor: colors.primary }]} />
            </View>
            <TouchableOpacity onPress={() => adjustVolume('up')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.volumeBtn}>
              <FontAwesomeIcon icon={faVolumeHigh} color={colors.textSecondary} size={12} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  soundsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  soundBtn: {
    flexBasis: '31%',
    flexGrow: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderWidth: 1,
    position: 'relative',
  },
  soundEmoji: {
    fontSize: 20,
  },
  soundLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  liveIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  nowPlaying: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  nowPlayingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  nowPlayingEmoji: {
    fontSize: 16,
  },
  nowPlayingStatus: {
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  nowPlayingName: {
    fontSize: 11,
    marginTop: 1,
  },
  volumeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  volumeBtn: {
    padding: 3,
  },
  volumeTrack: {
    width: 44,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    borderRadius: 2,
  },
});

FocusSoundsPanel.displayName = 'FocusSoundsPanel';

export default FocusSoundsPanel;
