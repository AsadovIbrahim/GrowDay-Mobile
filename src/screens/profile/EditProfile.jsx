import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storage } from '../../utils/MMKVStore';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft, faUser, faEnvelope, faSignature, faCheck } from '@fortawesome/free-solid-svg-icons';
import { updateAccountFetch } from '../../utils/fetch';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const InputField = ({ label, value, onChangeText, placeholder, icon, error, colors, keyboardType = 'default' }) => (
  <View style={styles.inputContainer}>
    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
    <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: error ? colors.danger : colors.border }]}>
      <View style={styles.inputIcon}>
        <FontAwesomeIcon icon={icon} size={16} color={colors.icon} />
      </View>
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary + '80'}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
    {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}
  </View>
);

const EditProfile = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { initialData } = route.params || {};

  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    username: initialData?.username || '',
    email: initialData?.email || '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = t("profile.edit_profile_screen.validation.first_name_required");
    if (!formData.lastName.trim()) newErrors.lastName = t("profile.edit_profile_screen.validation.last_name_required");
    if (!formData.username.trim()) newErrors.username = t("profile.edit_profile_screen.validation.username_required");
    if (!formData.email.trim()) {
      newErrors.email = t("profile.edit_profile_screen.validation.email_required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("profile.edit_profile_screen.validation.email_invalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const token = storage.getString('accessToken');
      const response = await updateAccountFetch(token, formData);

      if (response.success) {
        const data = response.data;
        if (data) {
          const newToken = data.newToken || data.NewToken;
          if (newToken) {
            storage.set('accessToken', newToken);
          }
        }
        Alert.alert(t("common.success"), t("profile.edit_profile_screen.save_success"));
        navigation.goBack();
      } else {
        Alert.alert(t("common.error"), response.message || t("profile.edit_profile_screen.save_error"));
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert(t("common.error"), t("profile.edit_profile_screen.save_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={colors.backgroundGradient} style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: colors.card }]} 
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faChevronLeft} size={16} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t("profile.edit_profile_screen.title")}</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <InputField
          label={t("profile.edit_profile_screen.first_name")}
          value={formData.firstName}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
          placeholder="John"
          icon={faUser}
          error={errors.firstName}
          colors={colors}
        />
        <InputField
          label={t("profile.edit_profile_screen.last_name")}
          value={formData.lastName}
          onChangeText={(text) => setFormData({ ...formData, lastName: text })}
          placeholder="Doe"
          icon={faUser}
          error={errors.lastName}
          colors={colors}
        />
        <InputField
          label={t("profile.edit_profile_screen.username")}
          value={formData.username}
          onChangeText={(text) => setFormData({ ...formData, username: text })}
          placeholder="johndoe"
          icon={faSignature}
          error={errors.username}
          colors={colors}
        />
        <InputField
          label={t("profile.edit_profile_screen.email")}
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          placeholder="john@example.com"
          icon={faEnvelope}
          error={errors.email}
          colors={colors}
          keyboardType="email-address"
        />

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <FontAwesomeIcon icon={faCheck} size={16} color="#fff" />
              <Text style={styles.saveBtnText}>{t("common.save")}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: 'RedditSans-Bold',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'RedditSans-Bold',
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'RedditSans-Medium',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'RedditSans-Regular',
    marginTop: 4,
    marginLeft: 4,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    marginTop: 10,
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'RedditSans-Bold',
    fontWeight: '700',
  },
});

export default EditProfile;
