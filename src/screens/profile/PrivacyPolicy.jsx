import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
    const { theme } = useTheme();
    const { colors } = theme;
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { t } = useTranslation();

    const handleGoBack = () => {
        navigation.goBack();
    };

    const PolicySection = ({ title, children }) => (
        <View className="mb-6">
            <Text className="text-lg font-redditsans-bold mb-2" style={{ color: colors.text }}>
                {title}
            </Text>
            <Text className="text-base font-redditsans-regular leading-6" style={{ color: colors.textSecondary }}>
                {children}
            </Text>
        </View>
    );

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <View 
                className="flex-row items-center justify-between px-4 pb-4 border-b" 
                style={{ paddingTop: insets.top + 16, borderBottomColor: colors.border }}
            >
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity onPress={handleGoBack} className="mr-4 p-2 -ml-2" activeOpacity={0.7}>
                        <FontAwesomeIcon icon={faArrowLeft} size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text className="text-xl font-redditsans-bold" style={{ color: colors.text }}>
                        {t('profile.menu.privacy_policy', { defaultValue: 'Privacy Policy' })}
                    </Text>
                </View>
                <FontAwesomeIcon icon={faShieldHalved} size={20} color={colors.primary} />
            </View>

            <ScrollView 
                className="flex-1 px-5" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 20 }}
            >
                <PolicySection title={t('privacy_policy.intro_title')}>
                    {t('privacy_policy.intro_text')}
                </PolicySection>

                <PolicySection title={t('privacy_policy.info_collect_title')}>
                    {t('privacy_policy.info_collect_text')}
                </PolicySection>

                <PolicySection title={t('privacy_policy.info_use_title')}>
                    {t('privacy_policy.info_use_text')}
                </PolicySection>

                <PolicySection title={t('privacy_policy.info_share_title')}>
                    {t('privacy_policy.info_share_text')}
                </PolicySection>

                <PolicySection title={t('privacy_policy.info_keep_title')}>
                    {t('privacy_policy.info_keep_text')}
                </PolicySection>

                <PolicySection title={t('privacy_policy.info_safe_title')}>
                    {t('privacy_policy.info_safe_text')}
                </PolicySection>

                <PolicySection title={t('privacy_policy.privacy_rights_title')}>
                    {t('privacy_policy.privacy_rights_text')}
                </PolicySection>

                <PolicySection title={t('privacy_policy.contact_us_title')}>
                    {t('privacy_policy.contact_us_text')}
                </PolicySection>

                <View className="mt-4 mb-8">
                    <Text className="text-sm font-redditsans-regular italic" style={{ color: colors.textSecondary }}>
                        {t('privacy_policy.agreement_text')}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default PrivacyPolicy;
