import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faChevronLeft,
  faChevronDown,
  faChevronUp,
  faQuestionCircle,
  faBookOpen,
  faListCheck,
  faStar,
  faChartLine,
  faTrophy,
  faBell,
  faComment,
  faEnvelope,
  faLightbulb,
  faRocket,
  faShieldHalved,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../context/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ── FAQ Item ─────────────────────────────────────────────── */
const FAQItem = ({ question, answer, colors }) => {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(prev => !prev);
  };

  return (
    <TouchableOpacity
      onPress={toggle}
      activeOpacity={0.85}
      style={[styles.faqItem, { borderBottomColor: colors.border || '#2a2a3a' }]}
    >
      <View style={styles.faqHeader}>
        <Text style={[styles.faqQuestion, { color: colors.text }]}>{question}</Text>
        <FontAwesomeIcon
          icon={open ? faChevronUp : faChevronDown}
          size={14}
          color={colors.primary}
        />
      </View>
      {open && (
        <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{answer}</Text>
      )}
    </TouchableOpacity>
  );
};

/* ── Feature Card ─────────────────────────────────────────── */
const FeatureCard = ({ icon, title, description, colors }) => (
  <View style={[styles.featureCard, { backgroundColor: colors.cardSecondary || colors.card }]}>
    <View style={[styles.featureIconWrap, { backgroundColor: colors.primary + '20' }]}>
      <FontAwesomeIcon icon={icon} size={20} color={colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  </View>
);

/* ── Quick Link ───────────────────────────────────────────── */
const QuickLink = ({ icon, label, onPress, colors, danger = false }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[styles.quickLink, { backgroundColor: colors.card }]}
  >
    <View style={[styles.quickLinkIcon, { backgroundColor: (danger ? colors.danger : colors.primary) + '20' }]}>
      <FontAwesomeIcon icon={icon} size={18} color={danger ? colors.danger : colors.primary} />
    </View>
    <Text style={[styles.quickLinkLabel, { color: colors.text }]}>{label}</Text>
    <FontAwesomeIcon icon={faChevronDown} size={12} color={colors.textSecondary} style={{ transform: [{ rotate: '-90deg' }] }} />
  </TouchableOpacity>
);

/* ── Section Label ────────────────────────────────────────── */
const SectionLabel = ({ label, colors }) => (
  <Text style={[styles.sectionLabel, { color: colors.sectionLabel || colors.textSecondary }]}>{label}</Text>
);

/* ── Main Screen ──────────────────────────────────────────── */
const HelpCenter = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const faqs = [
    {
      q: t('help.faq.q1'),
      a: t('help.faq.a1'),
    },
    {
      q: t('help.faq.q2'),
      a: t('help.faq.a2'),
    },
    {
      q: t('help.faq.q3'),
      a: t('help.faq.a3'),
    },
    {
      q: t('help.faq.q4'),
      a: t('help.faq.a4'),
    },
    {
      q: t('help.faq.q5'),
      a: t('help.faq.a5'),
    },
    {
      q: t('help.faq.q6'),
      a: t('help.faq.a6'),
    },
    {
      q: t('help.faq.q7'),
      a: t('help.faq.a7'),
    },
  ];

  const features = [
    {
      icon: faListCheck,
      title: t('help.features.habits_title'),
      desc: t('help.features.habits_desc'),
    },
    {
      icon: faRocket,
      title: t('help.features.tasks_title'),
      desc: t('help.features.tasks_desc'),
    },
    {
      icon: faChartLine,
      title: t('help.features.stats_title'),
      desc: t('help.features.stats_desc'),
    },
    {
      icon: faTrophy,
      title: t('help.features.achievements_title'),
      desc: t('help.features.achievements_desc'),
    },
    {
      icon: faBookOpen,
      title: t('help.features.explore_title'),
      desc: t('help.features.explore_desc'),
    },
    {
      icon: faBell,
      title: t('help.features.reminders_title'),
      desc: t('help.features.reminders_desc'),
    },
  ];

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('help.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero banner */}
        <View style={[styles.heroBanner, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
          <FontAwesomeIcon icon={faLightbulb} size={28} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>{t('help.hero_title')}</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>{t('help.hero_subtitle')}</Text>
          </View>
        </View>

        {/* Quick Links */}
        <SectionLabel label={t('help.quick_links')} colors={colors} />
        <QuickLink
          icon={faComment}
          label={t('profile.menu.contact_support')}
          onPress={() => navigation.navigate('ContactSupport')}
          colors={colors}
        />
        <QuickLink
          icon={faShieldHalved}
          label={t('profile.menu.privacy_policy')}
          onPress={() => navigation.navigate('PrivacyPolicy')}
          colors={colors}
        />
        <QuickLink
          icon={faCircleInfo}
          label={t('profile.menu.terms')}
          onPress={() => navigation.navigate('TermsOfService')}
          colors={colors}
        />
        <QuickLink
          icon={faEnvelope}
          label={t('help.email_us')}
          onPress={() => Linking.openURL('mailto:growday.support@gmail.com')}
          colors={colors}
        />

        {/* App features guide */}
        <SectionLabel label={t('help.features_title')} colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {features.map((f, i) => (
            <FeatureCard
              key={i}
              icon={f.icon}
              title={f.title}
              description={f.desc}
              colors={colors}
            />
          ))}
        </View>

        {/* FAQ */}
        <SectionLabel label={t('help.faq_title')} colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {faqs.map((item, i) => (
            <FAQItem
              key={i}
              question={item.q}
              answer={item.a}
              colors={colors}
            />
          ))}
        </View>

        {/* Tips */}
        <View style={[styles.tipBanner, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
          <FontAwesomeIcon icon={faStar} size={14} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>{t('help.tip')}</Text>
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

  heroBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderRadius: 20, padding: 18, marginBottom: 24,
    borderWidth: 1,
  },
  heroTitle: { fontSize: 16, fontFamily: 'RedditSans-Bold', fontWeight: '700', marginBottom: 4 },
  heroSubtitle: { fontSize: 13, fontFamily: 'RedditSans-Regular', lineHeight: 18 },

  sectionLabel: {
    fontSize: 12, fontFamily: 'RedditSans-Bold', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginLeft: 4, marginBottom: 10, marginTop: 4,
  },

  card: { borderRadius: 24, overflow: 'hidden', marginBottom: 20 },

  /* Quick links */
  quickLink: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 16, marginBottom: 10,
  },
  quickLinkIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLinkLabel: { flex: 1, fontSize: 15, fontFamily: 'RedditSans-Medium', fontWeight: '500' },

  /* Feature cards */
  featureCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  featureIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 14, fontFamily: 'RedditSans-Bold', fontWeight: '700', marginBottom: 4 },
  featureDesc: { fontSize: 13, fontFamily: 'RedditSans-Regular', lineHeight: 18 },

  /* FAQ */
  faqItem: { padding: 16, borderBottomWidth: 1 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  faqQuestion: { flex: 1, fontSize: 14, fontFamily: 'RedditSans-SemiBold', fontWeight: '600', lineHeight: 20 },
  faqAnswer: { fontSize: 13, fontFamily: 'RedditSans-Regular', lineHeight: 20, marginTop: 10 },

  /* Tip */
  tipBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: 16, padding: 16, borderLeftWidth: 4, marginBottom: 10,
  },
  tipText: { flex: 1, fontSize: 13, fontFamily: 'RedditSans-Regular', lineHeight: 20 },
});

export default HelpCenter;
