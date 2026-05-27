import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCheck, faFire, faTrophy, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { ICONS } from '../../constants/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Sound from 'react-native-sound';
import { useTranslation } from 'react-i18next';
import { useInterstitialAd, TestIds } from 'react-native-google-mobile-ads';

Sound.setCategory('Playback');

const { width } = Dimensions.get('window');

const interstitialAdUnitId = __DEV__ ? TestIds.INTERSTITIAL : "ca-app-pub-8430015420939329/2948302979";

const HabitCelebration = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const habit = route.params?.habit;

    const { isLoaded, isClosed, load, show } = useInterstitialAd(interstitialAdUnitId, {
        requestNonPersonalizedAdsOnly: true,
    });

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (isClosed) {
            navigation.goBack();
        }
    }, [isClosed, navigation]);

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    
    // Confetti setup
    const confettiCount = 40;
    const confettiAnims = useRef([...Array(confettiCount)].map(() => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 6,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();

        confettiAnims.forEach((anim, i) => {
            Animated.timing(anim, {
                toValue: 1,
                duration: 1200 + Math.random() * 1000,
                easing: Easing.out(Easing.cubic),
                delay: Math.random() * 200,
                useNativeDriver: true,
            }).start();
        });

        // Play applause sound
        let applause = new Sound('congrats.mp3', Sound.MAIN_BUNDLE, (error) => {
            if (error) {
                console.log('failed to load the applause sound', error);
                return;
            }
            applause.play((success) => {
                if (!success) {
                    console.log('sound playback failed');
                }
                applause.release();
            });
        });

        return () => {
            if (applause) {
                applause.stop();
                applause.release();
            }
        };
    }, []);

    const handleContinue = () => {
        if (isLoaded) {
            show();
        } else {
            navigation.goBack();
        }
    };

    if (!habit) return null;

    const formatValue = (val) => {
        if (!val) return "";
        if (Number.isInteger(val)) return val.toString();
        const withDec = ["km", "m", "hour", "hr", "hrs"];
        return val.toFixed(withDec.includes(habit.unit?.toLowerCase()) ? 2 : 1);
    };

    const targetValue = habit.targetValue ?? 1;
    const isBoolean = !habit.unit || !habit.targetValue || habit.targetValue <= 0;
    
    // Translate unit if available, otherwise use default
    const unitKey = habit.unit?.toLowerCase().replace(/s$/, ''); // try to singularize for lookup if needed, but units in en.json are like 'glasses', 'pages'
    const translatedUnit = isBoolean ? t("habit_celebration.default_unit") : t(`units.${habit.unit?.toLowerCase()}`, { defaultValue: habit.unit || t("habit_celebration.default_unit") });
    
    const descText = isBoolean ? t("habit_celebration.completed_today") : t("habit_celebration.value_completed", { value: formatValue(targetValue), unit: translatedUnit });

    const displayTitle = habit.title ? t(`habits.${habit.title.toLowerCase().replace(/ /g, '_')}`, { defaultValue: habit.title }) : "HABIT";
    const titleUpper = displayTitle.toUpperCase();

    // Optimistically calculate new streak
    const isAlreadyDone = habit.lastCompletedDate && new Date(habit.lastCompletedDate).toDateString() === new Date().toDateString();
    const streakAdd = isAlreadyDone ? 0 : 1;
    const newStreak = (habit.currentStreak || 0) + streakAdd;
    const highestStreak = Math.max(habit.longestStreak || 0, newStreak);

    return (
        <LinearGradient 
            colors={['#e6f2dc', '#2f6f3f']} 
            style={[styles.container, { paddingTop: insets.top + 20 }]}
        >
            {/* Confetti Background Layer */}
            <View style={StyleSheet.absoluteFillObject}>
                {confettiAnims.map((anim, i) => {
                    const angle = (i / confettiCount) * Math.PI * 2;
                    const distance = width * 0.4 + Math.random() * width * 0.3;
                    
                    const translateX = anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, Math.cos(angle) * distance]
                    });
                    const translateY = anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, Math.sin(angle) * distance]
                    });
                    const rotate = anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', `${180 + Math.random() * 360}deg`]
                    });
                    const scale = anim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 1.2, 0.8]
                    });
                    
                    const colors = ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#3b82f6'];
                    const color = colors[i % colors.length];

                    return (
                        <Animated.View
                            key={i}
                            style={[
                                styles.confetti,
                                { 
                                    backgroundColor: color,
                                    width: i % 3 === 0 ? 8 : 12,
                                    height: i % 2 === 0 ? 8 : 16,
                                    transform: [
                                        { translateX }, 
                                        { translateY }, 
                                        { rotate },
                                        { scale }
                                    ],
                                    opacity: fadeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 0.8]
                                    }),
                                    position: 'absolute',
                                    top: '30%',
                                    left: '48%'
                                }
                            ]}
                        />
                    );
                })}
            </View>

            {/* Checkmark Icon */}
            <Animated.View style={[styles.checkCircleWrapper, { transform: [{ scale: scaleAnim }] }]}>
                <View style={styles.checkCircle}>
                    <FontAwesomeIcon icon={faCheck} color="#fff" size={54} />
                </View>
            </Animated.View>

            <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', marginTop: 24, zIndex: 10 }}>
                <Text className="font-redditsans-black" style={styles.completedLabel}>{displayTitle.toUpperCase()} {t("habit_celebration.completed_label")}</Text>
                <Text className="font-redditsans-black" style={styles.title}>{t("habit_celebration.title")}</Text>
                <Text className="font-redditsans-medium" style={styles.subtitle}>{t("habit_celebration.subtitle")}</Text>
            </Animated.View>

            {/* Stats Card */}
            <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.iconCircle}>
                        <Text style={styles.iconText}>{ICONS[habit.icon] || '🎯'}</Text>
                    </View>
                    <View style={styles.cardHeaderText}>
                        <Text className="font-redditsans-black" style={styles.habitName}>{displayTitle}</Text>
                        <Text className="font-redditsans-medium" style={styles.habitDesc}>{descText}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <FontAwesomeIcon icon={faFire} color="#f59e0b" size={26} />
                        <View style={styles.statTextCol}>
                            <Text className="font-redditsans-bold" style={styles.statLabel}>{t("habit_celebration.streak")}</Text>
                            <Text className="font-redditsans-black" style={styles.statValue}>{newStreak} {t("habit_celebration.days")}</Text>
                        </View>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <FontAwesomeIcon icon={faTrophy} color="#f59e0b" size={26} />
                        <View style={styles.statTextCol}>
                            <Text className="font-redditsans-bold" style={styles.statLabel}>{t("habit_celebration.best")}</Text>
                            <Text className="font-redditsans-black" style={styles.statValue}>{highestStreak} {t("habit_celebration.days")}</Text>
                        </View>
                    </View>
                </View>
            </Animated.View>

            <View style={{ flex: 1 }} />

            {/* Footer */}
            <Animated.View style={[styles.footer, { opacity: fadeAnim, paddingBottom: Math.max(insets.bottom + 20, 40) }]}>
                <Text className="font-redditsans-medium" style={styles.quoteText}>
                    {t("habit_celebration.quote")}
                </Text>

                <Pressable style={styles.continueBtn} onPress={handleContinue}>
                    <Text className="font-redditsans-bold" style={styles.continueText}>{t("habit_celebration.continue")}</Text>
                    <FontAwesomeIcon icon={faArrowRight} color="#fff" size={16} />
                </Pressable>
            </Animated.View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    // Icon
    checkCircleWrapper: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: width < 380 ? 20 : 30,
        zIndex: 10,
    },
    checkCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#2A7A40',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    // Titles
    completedLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#115e59',
        letterSpacing: 2,
        marginBottom: 8,
    },
    title: {
        fontSize: width < 380 ? 28 : 34,
        fontWeight: '900',
        color: '#064e3b',
        textAlign: 'center',
        lineHeight: width < 380 ? 34 : 40,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: width < 380 ? 14 : 15,
        color: '#4b5563',
        fontWeight: '500',
        marginBottom: width < 380 ? 20 : 30,
    },
    // Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: width < 380 ? 18 : 24,
        width: width < 380 ? '90%' : '85%',
        elevation: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        zIndex: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f0fdf4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconText: {
        fontSize: 30,
    },
    cardHeaderText: {
        flex: 1,
    },
    habitName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    habitDesc: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginVertical: 20,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    statTextCol: {
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9ca3af',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    statDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#f3f4f6',
        marginHorizontal: 16,
    },
    // Footer
    footer: {
        width: '100%',
        paddingHorizontal: 30,
        alignItems: 'center',
        zIndex: 10,
    },
    quoteText: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    continueBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderRadius: 100,
        paddingVertical: 18,
        width: '100%',
        gap: 12,
    },
    continueText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    confetti: {
        position: 'absolute',
        borderRadius: 4,
    }
});

export default HabitCelebration;
