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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft, faEye, faEyeSlash, faLock, faCheckCircle, faCircle } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../context/ThemeContext';

import { changePasswordFetch } from '../../utils/fetch';
import { useMMKVString } from 'react-native-mmkv';

const PasswordField = ({ label, value, onChangeText, show, onToggleShow, error, placeholder, colors }) => (
  <View style={styles.fieldWrap}>
    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
    <View style={[
      styles.inputRow,
      { backgroundColor: colors.inputBackground, borderColor: error ? colors.danger : colors.inputBorder },
    ]}>
      <FontAwesomeIcon icon={faLock} size={15} color={colors.textMuted} style={{ marginLeft: 14 }} />
      <TextInput
        style={[styles.input, { color: colors.inputText }]}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={!show}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={onToggleShow} style={styles.eyeBtn}>
        <FontAwesomeIcon icon={show ? faEye : faEyeSlash} size={16} color={colors.textMuted} />
      </TouchableOpacity>

    </View>
    {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
  </View>
);

const RequirementItem = ({ label, met, colors }) => (
  <View style={[
    styles.requirementChip, 
    { backgroundColor: met ? (colors.success + '15' || '#4ade8015') : colors.background + '50' }
  ]}>
    <FontAwesomeIcon 
      icon={met ? faCheckCircle : faCircle} 
      size={12} 
      color={met ? colors.success || '#4ade80' : colors.textMuted} 
    />
    <Text style={[
      styles.requirementText, 
      { color: met ? colors.text : colors.textMuted, fontWeight: met ? '600' : '400' }
    ]}>
      {label}
    </Text>
  </View>
);



const ChangePassword = ({ navigation, route }) => {
  const hasPassword = route.params?.hasPassword ?? true;
  const [token] = useMMKVString('accessToken');
  const { theme } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const requirements = [
    { label: '8+ chars', met: newPassword.length >= 8 },
    { label: 'Uppercase', met: /[A-Z]/.test(newPassword) },
    { label: 'Lowercase', met: /[a-z]/.test(newPassword) },
    { label: 'Number', met: /[0-9]/.test(newPassword) },
    { label: 'Special', met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
  ];


  const allMet = requirements.every(r => r.met);


  const validate = () => {
    const e = {};
    if (hasPassword && !currentPassword) e.currentPassword = 'Current password is required';
    if (!allMet) e.newPassword = 'Password does not meet requirements';
    if (newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };


  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    
    try {
      const payload = {
        currentPassword: hasPassword ? currentPassword : null,
        newPassword,
        confirmPassword,
      };
      const res = await changePasswordFetch(token, payload);
      
      if (res.success) {
        Alert.alert('Success', 'Password saved successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', res.message || 'Failed to save password.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network request failed.');
    } finally {
      setLoading(false);
    }
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {hasPassword ? 'Change Password' : 'Set Password'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {hasPassword && (
            <>
              <PasswordField
                label="Current Password"
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                show={showCurrent}
                onToggleShow={() => setShowCurrent(p => !p)}
                error={errors.currentPassword}
                colors={colors}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </>
          )}
          <PasswordField
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            show={showNew}
            onToggleShow={() => setShowNew(p => !p)}
            error={errors.newPassword}
            colors={colors}
          />
          
          <View style={styles.requirementsWrap}>
            {requirements.map((req, i) => (
              <RequirementItem key={i} label={req.label} met={req.met} colors={colors} />
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <PasswordField
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            show={showConfirm}
            onToggleShow={() => setShowConfirm(p => !p)}
            error={errors.confirmPassword}
            colors={colors}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Save Changes</Text>
          )}
        </TouchableOpacity>
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
  card: { borderRadius: 24, padding: 20, marginBottom: 20 },
  fieldWrap: { marginBottom: 4 },
  fieldLabel: {
    fontSize: 12, fontFamily: 'RedditSans-Medium',
    fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 14, height: 52,
  },
  input: {
    flex: 1, paddingHorizontal: 12, fontSize: 15,
    fontFamily: 'RedditSans-Regular',
  },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  divider: { height: 1, marginVertical: 16 },
  errorText: { fontSize: 12, marginTop: 4, fontFamily: 'RedditSans-Regular' },
  submitBtn: {
    borderRadius: 18, height: 54,
    alignItems: 'center', justifyContent: 'center',
  },
  submitText: {
    color: '#fff', fontSize: 16,
    fontFamily: 'RedditSans-Bold', fontWeight: '700',
  },
  requirementsWrap: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  requirementChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  requirementText: {
    fontSize: 11,
    fontFamily: 'RedditSans-Medium',
  },
});



export default ChangePassword;
