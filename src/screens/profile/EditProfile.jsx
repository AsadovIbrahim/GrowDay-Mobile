import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storage } from '../../utils/MMKVStore';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft, faUser, faEnvelope, faSignature, faCheck, faPencil, faLock } from '@fortawesome/free-solid-svg-icons';
import { updateAccountFetch } from '../../utils/fetch';
import { translateAuthError } from '../../utils/translateAuthError';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import AvatarWithBorder from '../../components/AvatarWithBorder';

const PREDEFINED_AVATARS = [
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Felix', level: 1, name: 'Felix' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Aneka', level: 1, name: 'Aneka' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Jack', level: 1, name: 'Jack' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Luna', level: 1, name: 'Luna' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Bella', level: 1, name: 'Bella' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Toby', level: 1, name: 'Toby' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Oliver', level: 2, name: 'Oliver' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Sophie', level: 2, name: 'Sophie' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Charlie', level: 2, name: 'Charlie' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Emily', level: 2, name: 'Emily' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Buster', level: 3, name: 'Buster' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Zoe', level: 3, name: 'Zoe' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Sammy', level: 3, name: 'Sammy' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Amber', level: 3, name: 'Amber' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Leo', level: 5, name: 'Leo' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Mia', level: 5, name: 'Mia' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Max', level: 5, name: 'Max' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Ruby', level: 5, name: 'Ruby' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Milo', level: 8, name: 'Milo' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Lily', level: 8, name: 'Lily' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Jasper', level: 8, name: 'Jasper' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Chloe', level: 8, name: 'Chloe' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Oscar', level: 12, name: 'Oscar' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Daisy', level: 12, name: 'Daisy' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Shadow', level: 12, name: 'Shadow' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Cookie', level: 12, name: 'Cookie' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Simba', level: 15, name: 'Simba' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Nala', level: 15, name: 'Nala' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Rocky', level: 15, name: 'Rocky' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Coco', level: 15, name: 'Coco' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Thor', level: 20, name: 'Thor' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Freya', level: 20, name: 'Freya' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Zeus', level: 20, name: 'Zeus' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Hera', level: 20, name: 'Hera' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Odin', level: 25, name: 'Odin' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Athena', level: 25, name: 'Athena' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Arthur', level: 30, name: 'Arthur' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Guinevere', level: 30, name: 'Guinevere' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Merlin', level: 40, name: 'Merlin' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Morgana', level: 40, name: 'Morgana' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Phoenix', level: 50, name: 'Phoenix' },
  { url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Valkyrie', level: 50, name: 'Valkyrie' }
];

const InputField = ({ label, value, onChangeText, placeholder, icon, error, colors, keyboardType = 'default', onFocus }) => (
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
        onFocus={onFocus}
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
  const { initialData, points = 0 } = route.params || {};
  const calculationPoints = initialData?.totalExperiencePoints !== undefined && initialData?.totalExperiencePoints !== null ? initialData.totalExperiencePoints : points;
  const userLevel = Math.floor(Math.sqrt(calculationPoints / 50)) + 1;

  const PREDEFINED_BORDERS = [
    { level: 1, name: 'Normal' },
    { level: 5, name: 'Bronze' },
    { level: 10, name: 'Silver' },
    { level: 15, name: 'Gold' },
    { level: 20, name: 'Cyber' },
    { level: 25, name: 'Glacial' },
    { level: 30, name: 'Devil' },
    { level: 40, name: 'Dragon' },
    { level: 50, name: 'Cosmic' }
  ];

  const getInitialBorder = () => {
    const saved = storage.getNumber('user.activeBorder');
    if (saved && saved <= userLevel) {
      return saved;
    }
    return userLevel;
  };

  const [activeBorder, setActiveBorder] = useState(getInitialBorder());

  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    username: initialData?.username || '',
    email: initialData?.email || '',
    profilePicture: initialData?.profilePicture || '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let newErrors = {};
    const nameRegex = /^[\p{L}\s'\-]+$/u;
    const usernameRegex = /^[a-zA-Z0-9._]{3,30}$/;

    if (!formData.firstName.trim()) {
      newErrors.firstName = t("profile.edit_profile_screen.validation.first_name_required");
    } else if (!nameRegex.test(formData.firstName.trim())) {
      newErrors.firstName = t("profile.edit_profile_screen.validation.first_name_invalid", { defaultValue: "Ad yalnız hərflərdən ibarət olmalıdır" });
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t("profile.edit_profile_screen.validation.last_name_required");
    } else if (!nameRegex.test(formData.lastName.trim())) {
      newErrors.lastName = t("profile.edit_profile_screen.validation.last_name_invalid", { defaultValue: "Soyad yalnız hərflərdən ibarət olmalıdır" });
    }

    if (!formData.username.trim()) {
      newErrors.username = t("profile.edit_profile_screen.validation.username_required");
    } else if (!usernameRegex.test(formData.username.trim())) {
      newErrors.username = t("profile.edit_profile_screen.validation.username_invalid", { defaultValue: "İstifadəçi adı yalnız hərflər, rəqəmlər, nöqtə və alt xəttdən ibarət olmalıdır" });
    }

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

    // Check if selected avatar is level-locked
    const selectedPredefined = PREDEFINED_AVATARS.find(av => av.url === formData.profilePicture);
    if (selectedPredefined && userLevel < selectedPredefined.level) {
      Alert.alert(
        t("levelup.locked_avatar_title", { defaultValue: "Kilidli Avatar 🔒" }),
        t("levelup.locked_avatar_desc", { 
          level: selectedPredefined.level, 
          userLevel: userLevel,
          defaultValue: `Bu avatarı saxlamaq üçün ən azı Level ${selectedPredefined.level} olmalısınız!\n(Sizin Leveliniz: ${userLevel})`
        })
      );
      return;
    }

    // Check if selected border is level-locked
    if (userLevel < activeBorder) {
      Alert.alert(
        t("levelup.locked_border_title", { defaultValue: "Kilidli Çərçivə 🔒" }),
        t("levelup.locked_border_desc", { 
          level: activeBorder, 
          userLevel: userLevel,
          defaultValue: `Bu çərçivəni saxlamaq üçün ən azı Level ${activeBorder} olmalısınız!\n(Sizin Leveliniz: ${userLevel})`
        })
      );
      return;
    }

    setLoading(true);
    try {
      const token = storage.getString('accessToken');
      const response = await updateAccountFetch(token, formData);

      if (response.success) {
        storage.set('user.activeBorder', activeBorder);
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
        const errorMsg = translateAuthError(response.message, t) || t("profile.edit_profile_screen.save_error");
        Alert.alert(t("common.error"), errorMsg);
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={{ flex: 1 }} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        {/* Avatar Selection Section */}
        <View style={{ alignItems: 'center', marginBottom: 26 }}>
          <View style={{ position: 'relative' }}>
            <AvatarWithBorder
              avatarUrl={formData.profilePicture}
              level={initialData?.hasPremiumBorder ? 999 : activeBorder}
              size={80}
            />
            <View style={[styles.avatarEditBadge, { backgroundColor: colors.primary, zIndex: 10 }]}>
              <FontAwesomeIcon icon={faPencil} size={10} color="#fff" />
            </View>
          </View>
          
          <Text style={[styles.avatarLabel, { color: colors.text }]}>{t("profile.edit_profile_screen.choose_avatar", "Avatar Seçin")} (Level {userLevel})</Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.avatarList}
          >
            {PREDEFINED_AVATARS.map((avatar, index) => {
              const isLocked = userLevel < avatar.level;
              const isSelected = formData.profilePicture === avatar.url;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setFormData({ ...formData, profilePicture: avatar.url });
                  }}
                  style={[
                    styles.avatarOption,
                    { 
                      borderColor: isSelected ? colors.primary : 'transparent',
                      borderWidth: isSelected ? 2 : 0,
                      backgroundColor: 'transparent',
                      opacity: isLocked ? 0.5 : 1,
                      padding: 2,
                      borderRadius: 26,
                    }
                  ]}
                  activeOpacity={0.8}
                >
                  <AvatarWithBorder
                    avatarUrl={avatar.url}
                    level={avatar.level}
                    size={48}
                  />
                  {isLocked ? (
                    <View style={styles.lockOverlay}>
                      <FontAwesomeIcon icon={faLock} size={11} color="#fff" />
                      <Text style={styles.lockLevelText}>Lv.{avatar.level}</Text>
                    </View>
                  ) : isSelected ? (
                    <View style={[styles.checkBadge, { backgroundColor: colors.primary, zIndex: 12 }]}>
                      <FontAwesomeIcon icon={faCheck} size={8} color="#fff" />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.avatarLabel, { color: colors.text, marginTop: 22, alignSelf: 'center' }]}>
            {t("levelup.choose_border", "Çərçivə Seçin")}
          </Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.avatarList}
          >
            {PREDEFINED_BORDERS.map((border, index) => {
              const isLocked = userLevel < border.level;
              const isSelected = activeBorder === border.level;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setActiveBorder(border.level);
                  }}
                  style={[
                    styles.avatarOption,
                    { 
                      borderColor: isSelected ? colors.primary : 'transparent',
                      borderWidth: isSelected ? 2 : 0,
                      backgroundColor: 'transparent',
                      opacity: isLocked ? 0.4 : 1,
                      padding: 2,
                      borderRadius: 26,
                    }
                  ]}
                  activeOpacity={0.8}
                >
                  <AvatarWithBorder
                    avatarUrl={formData.profilePicture}
                    level={border.level}
                    size={48}
                  />
                  {isLocked ? (
                    <View style={styles.lockOverlay}>
                      <FontAwesomeIcon icon={faLock} size={11} color="#fff" />
                      <Text style={styles.lockLevelText}>Lv.{border.level}</Text>
                    </View>
                  ) : isSelected ? (
                    <View style={[styles.checkBadge, { backgroundColor: colors.primary, zIndex: 12 }]}>
                      <FontAwesomeIcon icon={faCheck} size={8} color="#fff" />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        <InputField
          label={t("profile.edit_profile_screen.first_name")}
          value={formData.firstName}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
          placeholder="John"
          icon={faUser}
          error={errors.firstName}
          colors={colors}
          onFocus={() => handleInputFocus(240)}
        />
        <InputField
          label={t("profile.edit_profile_screen.last_name")}
          value={formData.lastName}
          onChangeText={(text) => setFormData({ ...formData, lastName: text })}
          placeholder="Doe"
          icon={faUser}
          error={errors.lastName}
          colors={colors}
          onFocus={() => handleInputFocus(340)}
        />
        <InputField
          label={t("profile.edit_profile_screen.username")}
          value={formData.username}
          onChangeText={(text) => setFormData({ ...formData, username: text })}
          placeholder="johndoe"
          icon={faSignature}
          error={errors.username}
          colors={colors}
          onFocus={() => handleInputFocus(440)}
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
          onFocus={() => handleInputFocus(540)}
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
        {Platform.OS === "android" && (
          <View style={{ height: keyboardHeight > 0 ? keyboardHeight - insets.bottom + navBarHeight : 0 }} />
        )}
      </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 120,
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
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarLabel: {
    fontSize: 14,
    fontFamily: 'RedditSans-Bold',
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 14,
  },
  avatarList: {
    paddingHorizontal: 4,
    gap: 12,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    position: 'relative',
    padding: 2,
  },
  checkBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockLevelText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'RedditSans-Bold',
    fontWeight: '700',
    marginTop: 2,
  },
});

export default EditProfile;
