import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import Sound from 'react-native-sound';

Sound.setCategory('Playback');
import { faCheckDouble, faStar } from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { getTranslatedTask } from '../utils/taskTranslations';

const CelebrationModal = ({ visible, taskData, onClose }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) {
      const coinSound = new Sound('success.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log('failed to load the sound', error);
          return;
        }
        coinSound.play((success) => {
          coinSound.release();
        });
      });
    }
  }, [visible]);

  if (!taskData) return null;

  const { title: displayTitle } = getTranslatedTask(taskData, t);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View 
        className="flex-1 items-center justify-center bg-black/60 px-8"
      >
        <View 
          className="rounded-[32px] p-8 w-full items-center shadow-2xl overflow-hidden border border-white/10"
          style={{ backgroundColor: colors.card }}
        >
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            className="w-20 h-20 rounded-full items-center justify-center mb-6"
          >
            <FontAwesomeIcon icon={faCheckDouble} size={36} color="#fff" />
          </LinearGradient>
          
          <Text className="text-3xl font-redditsans-bold text-center mb-2" style={{ color: colors.text }}>
            {t("common.congratulations", { defaultValue: "Congratulations!" })}
          </Text>
          
          <Text className="text-base font-redditsans-regular text-center mb-1 px-2" style={{ color: colors.textSecondary }}>
            {t("tasks.completed_msg", { 
              defaultValue: "You've successfully completed the task:", 
            })}
          </Text>
          <Text className="text-lg font-redditsans-bold text-center mb-8 px-2" style={{ color: colors.primary }}>
             {displayTitle}
          </Text>
          
          <View className="bg-yellow-500/10 rounded-2xl px-10 py-4 flex-row items-center mb-8 border border-yellow-500/20">
            <FontAwesomeIcon icon={faStar} size={24} color="#f59e0b" />
            <View className="ml-4">
              <Text className="text-xl font-redditsans-bold text-yellow-600 dark:text-yellow-500">
                +{taskData.xpReward || 50} XP
              </Text>
              <Text className="text-[10px] font-redditsans-medium uppercase tracking-wider" style={{ color: colors.textSecondary }}>
                {t("tasks.reward_earned", { defaultValue: "Reward Earned" })}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={onClose}
            className="w-full bg-green-500 rounded-2xl py-4 items-center shadow-lg shadow-green-500/30"
            activeOpacity={0.8}
          >
            <Text className="text-white font-redditsans-bold text-lg">
              {t("common.continue", { defaultValue: "Continue" })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CelebrationModal;
