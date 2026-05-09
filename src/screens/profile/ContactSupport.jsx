import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { storage } from '../../utils/MMKVStore';
import { sendSupportMessageFetch } from '../../utils/fetch';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faChevronLeft,
  faEnvelope,
  faCommentDots,
  faHeadset,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../context/ThemeContext';



const ContactSupport = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!subject.trim()) e.subject = t('support.subject_error');
    if (message.trim().length < 10) e.message = t('support.message_error');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSend = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const token = storage.getString('accessToken');
      const response = await sendSupportMessageFetch(token, {
        subject: subject,
        message: message
      });

      if (response.success || response.Success) {
        Alert.alert(t('support.success_title'), t('support.success_message'), [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(t('common.error'), response.message || t('auth.messages.something_wrong'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('auth.messages.network_error'));
    } finally {
      setLoading(false);
    }
  };



  return (
    <LinearGradient colors={colors.backgroundGradient} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: colors.card }]}
          >
            <FontAwesomeIcon icon={faChevronLeft} size={16} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('support.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Form Description */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
            {t('support.footer', { defaultValue: 'Have a question or feedback? Send us a message and we will get back to you as soon as possible.' })}
          </Text>
        </View>

        {/* Form */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.formIconRow}>
            <FontAwesomeIcon icon={faCommentDots} size={18} color={colors.primary} />
            <Text style={[styles.formTitle, { color: colors.text }]}>{t('support.send_message')}</Text>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('support.subject')}</Text>
          <TextInput
            style={[
              styles.textField,
              {
                backgroundColor: colors.inputBackground,
                borderColor: errors.subject ? colors.danger : colors.inputBorder,
                color: colors.inputText,
              },
            ]}
            placeholder={t('support.subject_placeholder')}
            placeholderTextColor={colors.placeholder}
            value={subject}
            onChangeText={setSubject}
          />
          {errors.subject && <Text style={[styles.errorText, { color: colors.danger }]}>{errors.subject}</Text>}

          <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 16 }]}>{t('support.message')}</Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.inputBackground,
                borderColor: errors.message ? colors.danger : colors.inputBorder,
                color: colors.inputText,
              },
            ]}
            placeholder={t('support.message_placeholder')}
            placeholderTextColor={colors.placeholder}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          {errors.message && <Text style={[styles.errorText, { color: colors.danger }]}>{errors.message}</Text>}

          <TouchableOpacity
            onPress={handleSend}
            disabled={loading}
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendText}>{t('support.send_btn')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 100 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 24,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontFamily: 'RedditSans-Bold', fontWeight: '700' },
  subTitle: { fontSize: 14, fontFamily: 'RedditSans-Regular', lineHeight: 20 },
  card: { borderRadius: 24, padding: 20 },
  formIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  formTitle: { fontSize: 16, fontFamily: 'RedditSans-Bold', fontWeight: '700' },
  fieldLabel: {
    fontSize: 12, fontFamily: 'RedditSans-Medium',
    fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  textField: {
    borderWidth: 1, borderRadius: 14, height: 50,
    paddingHorizontal: 14, fontSize: 15, fontFamily: 'RedditSans-Regular',
  },
  textArea: {
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, paddingTop: 12, fontSize: 15,
    fontFamily: 'RedditSans-Regular', minHeight: 120,
  },
  errorText: { fontSize: 12, marginTop: 4, fontFamily: 'RedditSans-Regular' },
  sendBtn: {
    borderRadius: 16, height: 52, marginTop: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  sendText: {
    color: '#fff', fontSize: 16,
    fontFamily: 'RedditSans-Bold', fontWeight: '700',
  },
});

export default ContactSupport;
