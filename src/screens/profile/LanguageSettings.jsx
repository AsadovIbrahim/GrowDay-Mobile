import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft, faCheck, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { storage } from '../../utils/MMKVStore';

const LANGUAGES = [
  { code: 'az', label: 'Azerbaijani', native: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
  { code: 'ru', label: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'de', label: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  { code: 'ar', label: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'zh', label: 'Chinese', native: '中文', flag: '🇨🇳' },
];

const LanguageSettings = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState(i18n.language || 'en');

  const changeLanguage = (code) => {
    setSelected(code);
    i18n.changeLanguage(code);
    storage.set('userLanguage', code);

    import('../../utils/NotificationService')
      .then(({ getFcmToken, scheduleDailyMotivationalQuotes }) => {
        const token = storage.getString('accessToken');
        if (token) {
          getFcmToken(token);
        }
        scheduleDailyMotivationalQuotes();
      })
      .catch(err => console.log('Error updating FCM token / scheduling quotes after language change:', err));
  };

  const selectedLang = LANGUAGES.find(l => l.code === selected);

  return (
    <LinearGradient colors={colors.backgroundGradient} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: colors.card }]}
          >
            <FontAwesomeIcon icon={faChevronLeft} size={16} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('menu.settings')}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Active Language Banner */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark ?? '#2d7a3a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeBanner}
        >
          <View style={styles.activeBannerInner}>
            <View style={styles.activeBannerLeft}>
              <View style={styles.globeIcon}>
                <FontAwesomeIcon icon={faGlobe} size={18} color="#fff" />
              </View>
              <View>
                <Text style={styles.activeBannerLabel}>{t('profile.language_settings_screen.active_language')}</Text>
                <Text style={styles.activeBannerLang}>
                  {selectedLang?.flag}  {selectedLang?.native}
                </Text>
              </View>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>✓</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Section Title */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('profile.language_settings_screen.all_languages')}
        </Text>

        {/* Languages Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {LANGUAGES.map((lang, i) => {
            const isSelected = lang.code === selected;
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => changeLanguage(lang.code)}
                style={[
                  styles.row,
                  i < LANGUAGES.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                  isSelected && { backgroundColor: colors.primarySurface ?? 'rgba(78,168,84,0.08)' },
                ]}
                activeOpacity={0.7}
              >
                {/* Flag */}
                <Text style={styles.flag}>{lang.flag}</Text>

                {/* Text */}
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.langLabel,
                    { color: isSelected ? colors.primary : colors.text }
                  ]}>
                    {lang.native}
                  </Text>
                  <Text style={[styles.langSub, { color: colors.textSecondary }]}>
                    {lang.label}
                  </Text>
                </View>

                {/* Check */}
                {isSelected ? (
                  <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                    <FontAwesomeIcon icon={faCheck} size={11} color="#fff" />
                  </View>
                ) : (
                  <View style={[styles.emptyCircle, { borderColor: colors.border }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
          {t('profile.language_settings_screen.footer_note')}
        </Text>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20, fontFamily: 'RedditSans-Bold',
  },

  /* Active Banner */
  activeBanner: {
    borderRadius: 20,
    marginBottom: 28,
    shadowColor: '#4ea854',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  activeBannerInner: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  activeBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  globeIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  activeBannerLabel: {
    fontSize: 12, fontFamily: 'RedditSans-Regular',
    color: 'rgba(255,255,255,0.75)', marginBottom: 2,
  },
  activeBannerLang: {
    fontSize: 17, fontFamily: 'RedditSans-Bold', color: '#fff',
  },
  activeBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  activeBadgeText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  /* Section */
  sectionTitle: {
    fontSize: 11, fontFamily: 'RedditSans-Bold',
    letterSpacing: 1.2, marginBottom: 10, marginLeft: 4,
  },

  /* Card */
  card: { borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 15, paddingHorizontal: 18, gap: 14,
  },
  flag: { fontSize: 28 },
  langLabel: { fontSize: 15, fontFamily: 'RedditSans-Medium' },
  langSub: { fontSize: 12, fontFamily: 'RedditSans-Regular', marginTop: 1 },

  /* Radio / Check */
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyCircle: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
  },

  /* Footer */
  footerNote: {
    textAlign: 'center', fontSize: 12,
    fontFamily: 'RedditSans-Regular', paddingHorizontal: 20,
  },
});

export default LanguageSettings;
