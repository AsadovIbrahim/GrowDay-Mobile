import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faScaleBalanced } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const TermsOfService = () => {
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
                        {t('profile.menu.terms', { defaultValue: 'Terms of Service' })}
                    </Text>
                </View>
                <FontAwesomeIcon icon={faScaleBalanced} size={20} color={colors.primary} />
            </View>

            <ScrollView 
                className="flex-1 px-5" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 20 }}
            >
                <PolicySection title={t('terms_of_service.intro_title')}>
                    {t('terms_of_service.intro_text')}
                </PolicySection>

                <PolicySection title={t('terms_of_service.accounts_title')}>
                    {t('terms_of_service.accounts_text')}
                </PolicySection>

                <PolicySection title={t('terms_of_service.prohibited_title')}>
                    {t('terms_of_service.prohibited_text')}
                </PolicySection>

                <PolicySection title={t('terms_of_service.property_title')}>
                    {t('terms_of_service.property_text')}
                </PolicySection>

                <PolicySection title={t('terms_of_service.liability_title')}>
                    {t('terms_of_service.liability_text')}
                </PolicySection>

                <PolicySection title={t('terms_of_service.termination_title')}>
                    {t('terms_of_service.termination_text')}
                </PolicySection>

                <PolicySection title={t('terms_of_service.changes_title')}>
                    {t('terms_of_service.changes_text')}
                </PolicySection>

                <View className="mt-4 mb-8">
                    <Text className="text-sm font-redditsans-regular italic" style={{ color: colors.textSecondary }}>
                        {t('terms_of_service.agreement_text')}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default TermsOfService;
