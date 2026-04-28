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
import { useTheme } from '../../context/ThemeContext';

const NotificationsSettings = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();

  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [emailEnabled, setEmailEnabled] = React.useState(false);
  const [remindersEnabled, setRemindersEnabled] = React.useState(true);

  const rows = [
    { icon: faBell, title: 'Push Notifications', value: pushEnabled, setter: setPushEnabled },
    { icon: faVolumeHigh, title: 'Sound Alerts', value: soundEnabled, setter: setSoundEnabled },
    { icon: faEnvelope, title: 'Email Updates', value: emailEnabled, setter: setEmailEnabled },
    { icon: faMobileAlt, title: 'Daily Reminders', value: remindersEnabled, setter: setRemindersEnabled },
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
                onValueChange={row.setter}
                trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
                thumbColor={colors.white}
              />
            </View>
          ))}
        </View>
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
});

export default NotificationsSettings;
