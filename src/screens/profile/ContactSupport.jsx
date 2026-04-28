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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faChevronLeft,
  faEnvelope,
  faCommentDots,
  faHeadset,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../context/ThemeContext';

const SUPPORT_EMAIL = 'support@growday.app';

const ContactSupport = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!subject.trim()) e.subject = 'Subject is required';
    if (message.trim().length < 10) e.message = 'Please provide more detail (min 10 chars)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSend = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    Alert.alert('Message Sent', 'Our team will get back to you within 24 hours.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const handleEmailDirect = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('GrowDay Support')}`);
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Contact Support</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Quick options */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            onPress={handleEmailDirect}
            style={[styles.quickCard, { backgroundColor: colors.card }]}
            activeOpacity={0.85}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.primarySurface }]}>
              <FontAwesomeIcon icon={faEnvelope} size={20} color={colors.primary} />
            </View>
            <Text style={[styles.quickLabel, { color: colors.text }]}>Email Us</Text>
            <Text style={[styles.quickSub, { color: colors.textMuted }]}>{SUPPORT_EMAIL}</Text>
          </TouchableOpacity>

          <View style={[styles.quickCard, { backgroundColor: colors.card }]}>
            <View style={[styles.quickIcon, { backgroundColor: colors.primarySurface }]}>
              <FontAwesomeIcon icon={faHeadset} size={20} color={colors.primary} />
            </View>
            <Text style={[styles.quickLabel, { color: colors.text }]}>Live Chat</Text>
            <Text style={[styles.quickSub, { color: colors.textMuted }]}>Coming soon</Text>
          </View>
        </View>

        {/* Form */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.formIconRow}>
            <FontAwesomeIcon icon={faCommentDots} size={18} color={colors.primary} />
            <Text style={[styles.formTitle, { color: colors.text }]}>Send a Message</Text>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Subject</Text>
          <TextInput
            style={[
              styles.textField,
              {
                backgroundColor: colors.inputBackground,
                borderColor: errors.subject ? colors.danger : colors.inputBorder,
                color: colors.inputText,
              },
            ]}
            placeholder="What can we help you with?"
            placeholderTextColor={colors.placeholder}
            value={subject}
            onChangeText={setSubject}
          />
          {errors.subject && <Text style={[styles.errorText, { color: colors.danger }]}>{errors.subject}</Text>}

          <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 16 }]}>Message</Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.inputBackground,
                borderColor: errors.message ? colors.danger : colors.inputBorder,
                color: colors.inputText,
              },
            ]}
            placeholder="Describe your issue in detail..."
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
              <Text style={styles.sendText}>Send Message</Text>
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
  quickRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  quickCard: {
    flex: 1, borderRadius: 20, padding: 16, alignItems: 'center',
  },
  quickIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  quickLabel: { fontSize: 14, fontFamily: 'RedditSans-Bold', fontWeight: '700' },
  quickSub: { fontSize: 11, fontFamily: 'RedditSans-Regular', marginTop: 2, textAlign: 'center' },
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
