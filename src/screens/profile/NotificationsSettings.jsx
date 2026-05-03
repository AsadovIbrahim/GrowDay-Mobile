import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faChevronLeft,
  faBell,
  faVolumeHigh,
  faEnvelope,
  faMobileAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useMMKVBoolean, useMMKVString } from 'react-native-mmkv';
import { useTheme } from '../../context/ThemeContext';
import { getAccountDataFetch, updateAccountFetch } from '../../utils/fetch';
import { displayLocalNotification } from '../../utils/NotificationService';

const NotificationsSettings = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const [token] = useMMKVString('accessToken');

  const [pushEnabled, setPushEnabled] = useMMKVBoolean('settings.pushEnabled');
  const [soundEnabled, setSoundEnabled] = useMMKVBoolean('settings.soundEnabled');
  const [emailEnabled, setEmailEnabled] = useMMKVBoolean('settings.emailEnabled');
  const [remindersEnabled, setRemindersEnabled] = useMMKVBoolean('settings.remindersEnabled');

  const [accountData, setAccountData] = React.useState(null);

  React.useEffect(() => {
    const fetchSettings = async () => {
      const res = await getAccountDataFetch(token);
      if (res.success && res.data) {
        const d = res.data;
        setAccountData(d);
        setPushEnabled(d.pushNotificationsEnabled);
        setSoundEnabled(d.soundAlertsEnabled);
        setEmailEnabled(d.emailUpdatesEnabled);
        setRemindersEnabled(d.dailyRemindersEnabled);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = async (key, value, setter) => {
    setter(value); // Update local MMKV immediately
    
    // Prepare backend update payload
    const payload = {
      firstName: accountData?.firstName || '',
      lastName: accountData?.lastName || '',
      email: accountData?.email || '',
      username: accountData?.username || '',
      pushNotificationsEnabled: key === 'push' ? value : (pushEnabled ?? true),
      soundAlertsEnabled: key === 'sound' ? value : (soundEnabled ?? true),
      emailUpdatesEnabled: key === 'email' ? value : (emailEnabled ?? false),
      dailyRemindersEnabled: key === 'reminders' ? value : (remindersEnabled ?? true),
    };

    try {
      await updateAccountFetch(token, payload);
    } catch (error) {
      console.log('Failed to sync settings with backend', error);
    }
  };

  const pushVal = pushEnabled ?? true;
  const soundVal = soundEnabled ?? true;
  const emailVal = emailEnabled ?? false;
  const remindersVal = remindersEnabled ?? true;

  const rows = [
    { icon: faBell, title: 'Push Notifications', value: pushVal, setter: (v) => handleToggle('push', v, setPushEnabled) },
    { icon: faVolumeHigh, title: 'Sound Alerts', value: soundVal, setter: (v) => handleToggle('sound', v, setSoundEnabled) },
    { icon: faEnvelope, title: 'Email Updates', value: emailVal, setter: (v) => handleToggle('email', v, setEmailEnabled) },
    { icon: faMobileAlt, title: 'Daily Reminders', value: remindersVal, setter: (v) => handleToggle('reminders', v, setRemindersEnabled) },
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {rows.map((row, i) => (
            <View
              key={row.title}
              style={[
                styles.row,
                i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.primarySurface }]}>
                <FontAwesomeIcon icon={row.icon} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{row.title}</Text>
              <Switch
                value={row.value}
                onValueChange={(val) => {
                   row.setter(val);
                }}
                trackColor={{ false: colors.switchTrackOff, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.switchTrackOff}
              />
            </View>
          ))}
        </View>

        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Manage how you receive updates and reminders from GrowDay.
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
  headerTitle: { fontSize: 20, fontFamily: 'RedditSans-Bold', fontWeight: '700' },
  card: { borderRadius: 24, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  rowTitle: { flex: 1, fontSize: 15, fontFamily: 'RedditSans-Medium', fontWeight: '500' },
  footerText: {
    fontSize: 13,
    fontFamily: 'RedditSans-Regular',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});

export default NotificationsSettings;
