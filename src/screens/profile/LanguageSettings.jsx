import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../context/ThemeContext';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'az', label: 'Azerbaijani', native: 'Azərbaycan' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe' },
  { code: 'ru', label: 'Russian', native: 'Русский' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'es', label: 'Spanish', native: 'Español' },
];

const LanguageSettings = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState('en');

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Language</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {LANGUAGES.map((lang, i) => {
            const isSelected = lang.code === selected;
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => setSelected(lang.code)}
                style={[
                  styles.row,
                  i < LANGUAGES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  isSelected && { backgroundColor: colors.primarySurface },
                ]}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.langLabel, { color: colors.text }]}>{lang.native}</Text>
                  <Text style={[styles.langSub, { color: colors.textMuted }]}>{lang.label}</Text>
                </View>
                {isSelected && (
                  <FontAwesomeIcon icon={faCheck} size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
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
  card: { borderRadius: 24, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 20,
  },
  langLabel: { fontSize: 15, fontFamily: 'RedditSans-Medium', fontWeight: '600' },
  langSub: { fontSize: 12, fontFamily: 'RedditSans-Regular', marginTop: 2 },
});

export default LanguageSettings;
