import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storage } from '../../utils/MMKVStore';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getUserTotalXPFetch, getAccountDataFetch } from '../../utils/fetch';
import {
  faMedal,
  faMoon,
  faBell,
  faGlobe,
  faMobileAlt,
  faLock,
  faFileAlt,
  faScaleBalanced,
  faComment,
  faStar,
  faPencil,
  faCircleExclamation,
  faArrowRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import SettingsItem from '../../components/SettingsItem';
import { useTheme } from '../../context/ThemeContext';

// App version – read from constants ideally
const APP_VERSION = '1.0.0';

/* ------------------------------------------------------------------ */
/*  Section label                                                        */
/* ------------------------------------------------------------------ */
const SectionLabel = ({ label, colors }) => (
  <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>{label}</Text>
);

/* ------------------------------------------------------------------ */
/*  Profile Card                                                         */
/* ------------------------------------------------------------------ */
const ProfileCard = ({ firstName, lastName, points, loading, error, colors, onEditPress }) => (
  <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
    <View style={{ flex: 1 }}>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start', marginBottom: 8 }} />
      ) : error ? (
        <View style={styles.errorRow}>
          <FontAwesomeIcon icon={faCircleExclamation} size={16} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.danger }]}>Failed to load profile</Text>
        </View>
      ) : (
        <>
          <Text className='font-redditsans-bold' style={[styles.profileName, { color: colors.text }]}>
            {firstName ?? '—'} {lastName ?? ''}
          </Text>
          <View style={[styles.pointsBadge, { backgroundColor: colors.pointsBadge }]}>
            <FontAwesomeIcon icon={faMedal} size={15} color={colors.pointsText} />
            <Text style={[styles.pointsText, { color: colors.pointsText }]}>{points} Points</Text>
          </View>
        </>
      )}
    </View>
    <TouchableOpacity
      onPress={onEditPress}
      style={[styles.editBtn, { backgroundColor: colors.cardSecondary }]}
      activeOpacity={0.8}
    >
      <FontAwesomeIcon icon={faPencil} size={13} color={colors.textSecondary} />
      <Text style={[styles.editText, { color: colors.text }]}>Edit Profile</Text>
    </TouchableOpacity>
  </View>
);

/* ------------------------------------------------------------------ */
/*  Dark Mode animated toggle button                                    */
/* ------------------------------------------------------------------ */
const DarkModeToggleRow = ({ isDark, onToggle, colors }) => {
  const slideAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isDark ? 1 : 0,
      useNativeDriver: false,
      speed: 20,
      bounciness: 8,
    }).start();
  }, [isDark]);

  const trackBg = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.switchTrackOff, colors.switchTrackOn],
  });
  const thumbLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[
        styles.settingsRow,
        { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
      activeOpacity={0.85}
    >
      <View style={styles.iconWrap}>
        <FontAwesomeIcon icon={faMoon} size={19} color={colors.icon} />
      </View>
      <Text style={[styles.rowTitle, { color: colors.text }]}>Dark Mode</Text>
      {/* Custom animated toggle */}
      <Animated.View style={[styles.track, { backgroundColor: trackBg }]}>
        <Animated.View style={[styles.thumb, { left: thumbLeft }]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Profile Screen                                                  */
/* ------------------------------------------------------------------ */
const Profile = ({ navigation }) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();

  const [points, setPoints] = useState(0);
  const [accountData, setAccountData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);

  // Animate background gradient transition
  const themeAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(themeAnim, {
      toValue: isDark ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isDark]);

  const handleLogOut = async () => {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.log('Google sign out error:', error);
    }
    storage.delete('accessToken');
  };

  const fetchData = async () => {
    setProfileLoading(true);
    setProfileError(false);
    try {
      const token = storage.getString('accessToken');
      const [pointsRes, accountRes] = await Promise.all([
        getUserTotalXPFetch(token),
        getAccountDataFetch(token),
      ]);
      setPoints(pointsRes.data ?? 0);
      setAccountData(accountRes.data);
    } catch (err) {
      console.error('Profile fetch error', err);
      setProfileError(true);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text className='font-redditsans-bold' style={[styles.pageTitle, { color: colors.text }]}>Your Profile</Text>

        {/* Profile Card */}
        <ProfileCard
          firstName={accountData?.firstName}
          lastName={accountData?.lastName}
          points={points}
          loading={profileLoading}
          error={profileError}
          colors={colors}
          onEditPress={() => {}}
        />

        {/* ── General ── */}
        <SectionLabel label="General" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <DarkModeToggleRow isDark={isDark} onToggle={toggleTheme} colors={colors} />
          <SettingsItem
            icon={faBell}
            title="Notifications"
            onPress={() => navigation.navigate('NotificationsSettings')}
          />
          <SettingsItem
            icon={faGlobe}
            title="Languages"
            onPress={() => navigation.navigate('LanguageSettings')}
          />
          <SettingsItem
            icon={faMobileAlt}
            title="App Version"
            type="text"
            rightText={`v${APP_VERSION}`}
            hideBorder
          />
        </View>

        {/* ── Privacy ── */}
        <SectionLabel label="Privacy" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <SettingsItem
            icon={faLock}
            title="Change Password"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <SettingsItem
            icon={faFileAlt}
            title="Privacy Policy"
            onPress={() => {}}
          />
          <SettingsItem
            icon={faScaleBalanced}
            title="Terms of Service"
            onPress={() => {}}
            hideBorder
          />
        </View>

        {/* ── Support ── */}
        <SectionLabel label="Support" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <SettingsItem
            icon={faComment}
            title="Contact Support"
            onPress={() => navigation.navigate('ContactSupport')}
          />
          <SettingsItem
            icon={faStar}
            title="Rate The App"
            onPress={() => {}}
            hideBorder
          />
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogOut}
          style={[styles.logoutBtn, { backgroundColor: colors.card, borderColor: colors.dangerSurface }]}
          activeOpacity={0.85}
        >
          <FontAwesomeIcon icon={faArrowRightFromBracket} size={18} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

/* ------------------------------------------------------------------ */
/*  Styles                                                               */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingBottom: 100 },
  pageTitle: { fontSize: 26, marginBottom: 20 },

  /* Profile card */
  profileCard: {
    borderRadius: 24, padding: 20, marginBottom: 28,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
    elevation: 4,
  },
  profileName: { fontSize: 20, marginBottom: 8 },
  pointsBadge: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, gap: 6,
  },
  pointsText: { fontSize: 13, fontFamily: 'RedditSans-Bold', fontWeight: '700' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
  },
  editText: { fontSize: 13, fontFamily: 'RedditSans-Medium', fontWeight: '600' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { fontSize: 13, fontFamily: 'RedditSans-Regular' },

  /* Section */
  sectionLabel: {
    fontSize: 12, fontFamily: 'RedditSans-Bold', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginLeft: 4, marginBottom: 10,
  },
  card: {
    borderRadius: 24, overflow: 'hidden', marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
    elevation: 2,
  },

  /* Dark mode custom toggle */
  settingsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 15, paddingHorizontal: 16,
  },
  iconWrap: { width: 26, alignItems: 'center' },
  rowTitle: { flex: 1, marginLeft: 14, fontSize: 15, fontFamily: 'RedditSans-Medium', fontWeight: '500' },
  track: {
    width: 44, height: 24, borderRadius: 12, justifyContent: 'center',
  },
  thumb: {
    position: 'absolute', width: 20, height: 20,
    borderRadius: 10, backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 2, elevation: 2,
  },

  /* Logout */
  logoutBtn: {
    borderRadius: 20, padding: 16, marginTop: 4, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderWidth: 1,
  },
  logoutText: { fontSize: 16, fontFamily: 'RedditSans-Bold', fontWeight: '700' },
});

export default Profile;