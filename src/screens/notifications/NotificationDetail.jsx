import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowLeft,
  faTag,
  faEnvelopeOpen,
  faCalendarAlt,
  faCircleCheck,
  faCircleDot,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  getNotificationDetailFetch,
  readNotificationFetch,
} from "../../utils/fetch";
import { useMMKVString } from "react-native-mmkv";
import { storage } from "../../utils/MMKVStore";
import { useState, useEffect, useRef } from "react";
import { Animated } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

/* ─── constants ──────────────────────────────────────────────── */
const GREEN = "#20893A";
const GREEN_LIGHT = "#78C67E";
const GREEN_BG = "#F0FAF2";

/* ─── helper: format date ────────────────────────────────────── */
const formatDate = (iso, lang) => {
  if (!iso) return "N/A";
  
  // Force 'Z' if missing to ensure UTC-to-local conversion
  const isoStr = (iso.includes('T') || iso.includes(' ')) && !iso.endsWith('Z') && !iso.includes('+') 
      ? iso.replace(' ', 'T') + 'Z' 
      : iso;

  const localeMap = {
    az: 'az-AZ',
    ru: 'ru-RU',
    tr: 'tr-TR',
    en: 'en-US',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
    it: 'it-IT',
    ar: 'ar-AE',
    zh: 'zh-CN'
  };
  const locale = localeMap[lang] || lang || 'en-US';

  try {
    return new Date(isoStr).toLocaleString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (e) {
    return new Date(isoStr).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
};

/* ─── sub-components ─────────────────────────────────────────── */
const InfoRow = ({ icon, label, value, isLast = false, bold = false }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  return (
    <View style={[styles.infoRow, !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
      <View style={[styles.infoIcon, { backgroundColor: colors.cardSecondary }]}>
        <FontAwesomeIcon icon={icon} size={14} color={GREEN} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text
          style={[styles.infoValue, { color: colors.text }, bold && { fontFamily: "RedditSans-Bold" }]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
};

const StatusBadge = ({ isRead }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.badge, isRead ? (isDark ? { backgroundColor: 'rgba(32, 137, 58, 0.15)', borderColor: '#20893A', borderWidth: 1 } : styles.badgeRead) : (isDark ? { backgroundColor: 'rgba(229, 62, 62, 0.15)', borderColor: '#E53E3E', borderWidth: 1 } : styles.badgeUnread)]}>
      <FontAwesomeIcon
        icon={isRead ? faCircleCheck : faCircleDot}
        size={12}
        color={isRead ? GREEN : "#E53E3E"}
        style={{ marginRight: 6 }}
      />
      <Text style={[styles.badgeText, { color: isRead ? GREEN : "#E53E3E" }]}>
        {isRead ? t('notifications.status_read') : t('notifications.status_unread')}
      </Text>
    </View>
  );
};

/* ─── skeleton placeholder ───────────────────────────────────── */
const SkeletonBlock = ({ height = 16, width = "100%", mb = 12 }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        height,
        width,
        backgroundColor: theme.colors.cardSecondary,
        borderRadius: 8,
        marginBottom: mb,
      }}
    />
  );
};

/* ─── shared header component ────────────────────────────────── */
const Header = ({ onBack }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        onPress={onBack}
        style={[styles.backBtn, { backgroundColor: colors.cardSecondary }]}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.7}
      >
        <FontAwesomeIcon icon={faArrowLeft} size={18} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{t('notifications.detail_title')}</Text>
    </View>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Main Screen
═══════════════════════════════════════════════════════════════ */
const NotificationDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { notification: routeNotification } = route.params || {};

  const [notification, setNotification] = useState(routeNotification || null);
  const [token] = useMMKVString("accessToken");
  const [loading, setLoading] = useState(false);
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const { t, i18n } = useTranslation();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    if (routeNotification?.id) {
      if (typeof routeNotification.id === 'string' && routeNotification.id.startsWith('local_')) {
        markLocalAsRead();
      } else {
        getNotificationDetail();
        readNotification();
      }
    }
  }, []);

  /* animate in once data is ready */
  useEffect(() => {
    if (!loading && notification) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, notification]);

  const markLocalAsRead = () => {
    try {
      const raw = storage.getString('local_push_notifications');
      if (raw) {
        const list = JSON.parse(raw);
        const updated = list.map(n => n.id === routeNotification.id ? { ...n, isRead: true } : n);
        storage.set('local_push_notifications', JSON.stringify(updated));
      }
      setNotification((prev) => (prev ? { ...prev, isRead: true } : prev));
    } catch (err) {
      console.log("Error marking local notification as read:", err);
    }
  };

  const readNotification = async () => {
    if (!routeNotification?.id) return;
    try {
      await readNotificationFetch(token, routeNotification.id);
      setNotification((prev) => (prev ? { ...prev, isRead: true } : prev));
    } catch (err) {
      console.log("Error reading notification:", err);
    }
  };

  const getNotificationDetail = async () => {
    if (!routeNotification?.id) return;
    setLoading(true);
    try {
      const response = await getNotificationDetailFetch(
        token,
        routeNotification.id
      );
      setNotification(response);
    } catch (err) {
      console.log("Error fetching notification detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => navigation.goBack();

  /* ── Loading state ── */
  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <Header onBack={handleGoBack} />
        <ScrollView
          style={[styles.scroll, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <SkeletonBlock height={12} width="35%" mb={10} />
            <SkeletonBlock height={28} width="80%" mb={20} />
            <SkeletonBlock height={12} width="35%" mb={10} />
            <SkeletonBlock height={16} mb={6} />
            <SkeletonBlock height={16} width="70%" mb={20} />
            <SkeletonBlock height={12} width="35%" mb={10} />
            <SkeletonBlock height={16} width="60%" mb={20} />
            <SkeletonBlock height={30} width="28%" mb={0} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ── Not found state ── */
  if (!notification) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <Header onBack={handleGoBack} />
        <View style={styles.emptyContainer}>
          <FontAwesomeIcon
            icon={faEnvelopeOpen}
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('notifications.not_found_title')}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {t('notifications.not_found_desc')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Main content ── */
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <Header onBack={handleGoBack} />

      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* ── Main card ── */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {/* Accent strip */}
            <View style={styles.cardAccent} />

            {/* Habit Title section */}
            <View style={styles.titleSection}>
              <View style={[styles.titleIconWrap, { backgroundColor: colors.cardSecondary }]}>
                <FontAwesomeIcon icon={faTag} size={14} color={GREEN} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('notifications.label_habit')}</Text>
                <Text
                  style={[
                    styles.habitTitle,
                    { color: colors.text },
                    !notification.isRead && { fontFamily: "RedditSans-Bold" },
                  ]}
                >
                  {notification.habitTitle ? t(`habits.${notification.habitTitle.toLowerCase().replace(/ /g, '_')}`, { defaultValue: t(`backend_notifications.${notification.habitTitle}`, { defaultValue: notification.habitTitle }) }) : "N/A"}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Info rows */}
            <InfoRow
              icon={faEnvelopeOpen}
              label={t('notifications.label_message')}
              value={notification.message ? t(`backend_notifications.${notification.message}`, { defaultValue: notification.message }) : "No message"}
              bold={!notification.isRead}
            />

            <InfoRow
              icon={faCalendarAlt}
              label={t('notifications.label_datetime')}
              value={formatDate(notification.createdAt, i18n.language)}
            />

            {/* Status row */}
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.cardSecondary }]}>
                <FontAwesomeIcon
                  icon={notification.isRead ? faCircleCheck : faCircleDot}
                  size={14}
                  color={GREEN}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('notifications.label_status')}</Text>
                <StatusBadge isRead={notification.isRead} />
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Styles
═══════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },

  /* header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "RedditSans-Bold",
    color: "#111827",
    letterSpacing: -0.3,
  },

  /* scroll */
  scroll: {
    flex: 1,
    backgroundColor: "#F8FAF8",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  /* card */
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardAccent: {
    height: 4,
    backgroundColor: GREEN_LIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  /* title section */
  titleSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 20,
    paddingBottom: 16,
    gap: 12,
  },
  titleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: GREEN_BG,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "RedditSans-Medium",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  habitTitle: {
    fontSize: 22,
    fontFamily: "RedditSans-Regular",
    color: "#111827",
    lineHeight: 28,
  },

  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 20,
    marginBottom: 4,
  },

  /* info rows */
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: GREEN_BG,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: "RedditSans-Medium",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: "RedditSans-Regular",
    color: "#374151",
    lineHeight: 22,
  },

  /* badge */
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 2,
  },
  badgeRead: {
    backgroundColor: GREEN_BG,
    borderWidth: 1,
    borderColor: "#BBE8C4",
  },
  badgeUnread: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  badgeText: {
    fontSize: 13,
    fontFamily: "RedditSans-SemiBold",
  },

  /* empty / error */
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "RedditSans-Bold",
    color: "#1f2937",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "RedditSans-Regular",
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 22,
  },
});

export default NotificationDetail;
