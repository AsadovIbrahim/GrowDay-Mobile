import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
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
  faPaperPlane,
  faPen,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../context/ThemeContext';

const localTranslations = {
  az: {
    hero_title: 'Dəstək Mərkəzi',
    select_topic: 'Mövzu Seçin',
    category_bug: 'Bug 🐛',
    category_suggestion: 'Təklif 💡',
    category_question: 'Sual ❓',
    category_other: 'Digər ⚙️',
    subject_bug: 'Bug / Xəta',
    subject_suggestion: 'Təklif / İstək',
    subject_question: 'Sual / Kömək',
    subject_other: 'Digər',
    success_title: 'Göndərildi',
    success_message: 'Mesajınız uğurla göndərildi. Sizinlə ən qısa zamanda əlaqə saxlayacağıq.',
  },
  en: {
    hero_title: 'Support Center',
    select_topic: 'Select Topic',
    category_bug: 'Bug 🐛',
    category_suggestion: 'Suggestion 💡',
    category_question: 'Question ❓',
    category_other: 'Other ⚙️',
    subject_bug: 'Bug / Issue',
    subject_suggestion: 'Suggestion / Request',
    subject_question: 'Question / Help',
    subject_other: 'Other',
    success_title: 'Message Sent',
    success_message: 'Your message has been sent successfully. We will get back to you as soon as possible.',
  },
  ru: {
    hero_title: 'Центр поддержки',
    select_topic: 'Выберите тему',
    category_bug: 'Баг 🐛',
    category_suggestion: 'Предложение 💡',
    category_question: 'Вопрос ❓',
    category_other: 'Другое ⚙️',
    subject_bug: 'Баг / Ошибка',
    subject_suggestion: 'Предложение / Пожелание',
    subject_question: 'Вопрос / Помощь',
    subject_other: 'Другое',
    success_title: 'Сообщение отправлено',
    success_message: 'Ваше сообщение успешно отправлено. Мы свяжемся с вами в ближайшее время.',
  },
  tr: {
    hero_title: 'Destek Merkezi',
    select_topic: 'Konu Seçin',
    category_bug: 'Hata 🐛',
    category_suggestion: 'Öneri 💡',
    category_question: 'Soru ❓',
    category_other: 'Diğer ⚙️',
    subject_bug: 'Hata / Arıza',
    subject_suggestion: 'Öneri / İstek',
    subject_question: 'Soru / Yardım',
    subject_other: 'Diğer',
    success_title: 'Gönderildi',
    success_message: 'Mesajınız başarıyla gönderildi. En kısa sürede sizinle iletişime geçeceğiz.',
  },
  de: {
    hero_title: 'Support-Center',
    select_topic: 'Thema auswählen',
    category_bug: 'Fehler 🐛',
    category_suggestion: 'Vorschlag 💡',
    category_question: 'Frage ❓',
    category_other: 'Andere ⚙️',
    subject_bug: 'Fehler / Problem',
    subject_suggestion: 'Vorschlag / Wunsch',
    subject_question: 'Frage / Hilfe',
    subject_other: 'Andere',
    success_title: 'Nachricht gesendet',
    success_message: 'Ihre Nachricht wurde erfolgreich gesendet. Wir werden uns so schnell wie möglich bei Ihnen melden.',
  },
  fr: {
    hero_title: 'Centre d\'assistance',
    select_topic: 'Sélectionnez un sujet',
    category_bug: 'Bogue 🐛',
    category_suggestion: 'Suggestion 💡',
    category_question: 'Question ❓',
    category_other: 'Autre ⚙️',
    subject_bug: 'Bogue / Problème',
    subject_suggestion: 'Suggestion / Demande',
    subject_question: 'Question / Aide',
    subject_other: 'Autre',
    success_title: 'Message envoyé',
    success_message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
  },
  es: {
    hero_title: 'Centro de soporte',
    select_topic: 'Seleccione un tema',
    category_bug: 'Error 🐛',
    category_suggestion: 'Sugerencia 💡',
    category_question: 'Pregunta ❓',
    category_other: 'Otro ⚙️',
    subject_bug: 'Error / Problema',
    subject_suggestion: 'Sugerencia / Solicitud',
    subject_question: 'Pregunta / Ayuda',
    subject_other: 'Otro',
    success_title: 'Mensaje enviado',
    success_message: 'Su mensaje ha sido enviado con éxito. Nos pondremos en contacto con usted lo antes posible.',
  },
  it: {
    hero_title: 'Centro di supporto',
    select_topic: 'Seleziona un argomento',
    category_bug: 'Errore 🐛',
    category_suggestion: 'Suggerimento 💡',
    category_question: 'Domanda ❓',
    category_other: 'Altro ⚙️',
    subject_bug: 'Errore / Problema',
    subject_suggestion: 'Suggerimento / Richiesta',
    subject_question: 'Domanda / Aiuto',
    subject_other: 'Altro',
    success_title: 'Messaggio inviato',
    success_message: 'Il tuo messaggio è stato inviato con successo. Ti risponderemo il prima possibile.',
  },
  ar: {
    hero_title: 'مركز الدعم',
    select_topic: 'اختر الموضوع',
    category_bug: 'خطأ 🐛',
    category_suggestion: 'اقتراح 💡',
    category_question: 'سؤال ❓',
    category_other: 'آخر ⚙️',
    subject_bug: 'خطأ / مشكلة',
    subject_suggestion: 'اقتراح / طلب',
    subject_question: 'سؤال / مساعدة',
    subject_other: 'آخر',
    success_title: 'تم إرسال الرسالة',
    success_message: 'تم إرسال رسالتك بنجاح. سنتواصل معك في أقرب وقت ممكن.',
  },
  zh: {
    hero_title: '支持中心',
    select_topic: '选择主题',
    category_bug: '漏洞 🐛',
    category_suggestion: '建议 💡',
    category_question: '问题 ❓',
    category_other: '其他 ⚙️',
    subject_bug: '漏洞 / 错误',
    subject_suggestion: '建议 / 要求',
    subject_question: '问题 / 帮助',
    subject_other: '其他',
    success_title: '消息已发送',
    success_message: '您的消息已成功发送。我们会尽快回复您。',
  }
};

const ContactSupport = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || 'en').split('-')[0];
  const trans = localTranslations[currentLang] || localTranslations.en;

  const screenHeight = Dimensions.get("screen").height;
  const windowHeight = Dimensions.get("window").height;
  const navBarHeight = screenHeight - windowHeight;

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const scrollViewRef = useRef(null);

  const handleInputFocus = (offset) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: offset, animated: true });
    }, 150);
  };

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Focus states for custom input fields
  const [subjectFocused, setSubjectFocused] = useState(false);
  const [messageFocused, setMessageFocused] = useState(false);
  const [activeChip, setActiveChip] = useState(null);

  const categories = [
    { id: 'bug', label: trans.category_bug, subjectValue: trans.subject_bug },
    { id: 'suggestion', label: trans.category_suggestion, subjectValue: trans.subject_suggestion },
    { id: 'question', label: trans.category_question, subjectValue: trans.subject_question },
    { id: 'other', label: trans.category_other, subjectValue: trans.subject_other },
  ];

  const handleChipPress = (category) => {
    setActiveChip(category.id);
    setSubject(category.subjectValue);
    // Clear subject error if it exists
    if (errors.subject) {
      setErrors(prev => ({ ...prev, subject: null }));
    }
  };

  const validate = () => {
    const e = {};
    if (!subject.trim()) e.subject = t('support.subject_error', { defaultValue: 'Subject is required' });
    if (message.trim().length < 10) e.message = t('support.message_error', { defaultValue: 'Message must be at least 10 characters' });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSend = async () => {
    Keyboard.dismiss();
    if (!validate()) return;
    setLoading(true);
    try {
      const token = storage.getString('accessToken');
      const response = await sendSupportMessageFetch(token, {
        subject: subject,
        message: message
      });

      if (response.success || response.Success) {
        Alert.alert(trans.success_title, trans.success_message, [
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
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

        {/* Premium Hero Banner */}
        <View style={[styles.heroContainer, { backgroundColor: colors.card, borderColor: colors.primary + '30' }]}>
          <LinearGradient
            colors={[colors.primary + '18', colors.primary + '05']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.headsetOuterCircle, { borderColor: colors.primary + '20' }]}>
              <View style={[styles.headsetCircle, { backgroundColor: colors.primary + '20' }]}>
                <FontAwesomeIcon icon={faHeadset} size={30} color={colors.primary} />
              </View>
            </View>
            <View style={styles.heroTextContainer}>
              <Text style={[styles.heroTitleText, { color: colors.text }]}>
                {trans.hero_title}
              </Text>
              <Text style={[styles.heroSubtitleText, { color: colors.textSecondary }]}>
                {t('support.footer', { defaultValue: 'Have a question or feedback? Send us a message and we will get back to you as soon as possible.' })}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Mövzu seçin (Chips) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {trans.select_topic}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContainer}
        >
          {categories.map((cat) => {
            const isSelected = activeChip === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleChipPress(cat)}
                activeOpacity={0.8}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.inputBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? '#fff' : colors.text },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Message Card Form */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.formIconRow}>
            <FontAwesomeIcon icon={faCommentDots} size={18} color={colors.primary} />
            <Text style={[styles.formTitle, { color: colors.text }]}>{t('support.send_message')}</Text>
          </View>

          {/* Subject Field */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('support.subject')}</Text>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.inputBackground,
                borderColor: errors.subject
                  ? colors.danger
                  : subjectFocused
                  ? colors.primary
                  : colors.inputBorder,
              },
            ]}
          >
            <FontAwesomeIcon
              icon={faPen}
              size={14}
              color={subjectFocused ? colors.primary : colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.textField, { color: colors.inputText }]}
              placeholder={t('support.subject_placeholder')}
              placeholderTextColor={colors.placeholder}
              value={subject}
              onChangeText={(text) => {
                setSubject(text);
                setActiveChip(null); // Reset active chip if manually typing
                if (errors.subject) setErrors(prev => ({ ...prev, subject: null }));
              }}
              onFocus={() => {
                setSubjectFocused(true);
                handleInputFocus(280);
              }}
              onBlur={() => setSubjectFocused(false)}
            />
          </View>
          {errors.subject && <Text style={[styles.errorText, { color: colors.danger }]}>{errors.subject}</Text>}

          {/* Message Field */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 18 }]}>{t('support.message')}</Text>
          <View
            style={[
              styles.inputWrapper,
              styles.textAreaWrapper,
              {
                backgroundColor: colors.inputBackground,
                borderColor: errors.message
                  ? colors.danger
                  : messageFocused
                  ? colors.primary
                  : colors.inputBorder,
              },
            ]}
          >
            <FontAwesomeIcon
              icon={faEnvelope}
              size={14}
              color={messageFocused ? colors.primary : colors.textSecondary}
              style={[styles.inputIcon, { marginTop: 16 }]}
            />
            <TextInput
              style={[styles.textArea, { color: colors.inputText }]}
              placeholder={t('support.message_placeholder')}
              placeholderTextColor={colors.placeholder}
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                if (errors.message) setErrors(prev => ({ ...prev, message: null }));
              }}
              onFocus={() => {
                setMessageFocused(true);
                handleInputFocus(400);
              }}
              onBlur={() => setMessageFocused(false)}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>
          {errors.message && <Text style={[styles.errorText, { color: colors.danger }]}>{errors.message}</Text>}

          {/* Send Button */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={loading}
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.btnContent}>
                <FontAwesomeIcon icon={faPaperPlane} size={16} color="#fff" style={styles.btnIcon} />
                <Text style={styles.sendText}>{t('support.send_btn')}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        {Platform.OS === "android" && (
          <View style={{ height: keyboardHeight > 0 ? keyboardHeight - insets.bottom + navBarHeight : 0 }} />
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontFamily: 'RedditSans-Bold', fontWeight: '700' },
  
  // Hero Container styling
  heroContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 22,
  },
  heroGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  headsetOuterCircle: {
    padding: 4,
    borderRadius: 35,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  headsetCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextContainer: { flex: 1 },
  heroTitleText: { fontSize: 16, fontFamily: 'RedditSans-Bold', fontWeight: '700', marginBottom: 4 },
  heroSubtitleText: { fontSize: 13, fontFamily: 'RedditSans-Regular', lineHeight: 18 },

  // Chips/Categories styling
  sectionHeader: { marginBottom: 10, paddingLeft: 4 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'RedditSans-Bold',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chipsScroll: { marginBottom: 20 },
  chipsContainer: { gap: 8, paddingLeft: 2 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: 'RedditSans-Medium', fontWeight: '600' },

  // Card Form styling
  card: { borderRadius: 24, padding: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  formIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  formTitle: { fontSize: 16, fontFamily: 'RedditSans-Bold', fontWeight: '700' },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'RedditSans-Bold',
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  
  // Custom Input wrappers
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  textAreaWrapper: {
    height: 140,
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginRight: 10,
  },
  textField: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontFamily: 'RedditSans-Regular',
    padding: 0,
  },
  textArea: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontFamily: 'RedditSans-Regular',
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 0,
    paddingRight: 0,
  },
  errorText: { fontSize: 12, marginTop: 4, fontFamily: 'RedditSans-Regular', paddingLeft: 4 },
  
  // Submit button styling
  sendBtn: {
    borderRadius: 18,
    height: 54,
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    marginRight: 8,
  },
  sendText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'RedditSans-Bold',
    fontWeight: '700',
  },
});

export default ContactSupport;
