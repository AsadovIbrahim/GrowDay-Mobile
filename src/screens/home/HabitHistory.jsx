import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faChevronLeft, faChevronRight, faFire, faTrophy, faCheckCircle, faTimesCircle, faNoteSticky } from "@fortawesome/free-solid-svg-icons";

import { Calendar, LocaleConfig } from 'react-native-calendars';

import { useTheme } from '../../context/ThemeContext';
import { useMMKVString } from "react-native-mmkv";
import { getMonthlyProgressFetch } from "../../utils/fetch";
import { ICONS } from "../../constants/icons";
import { useTranslation } from "react-i18next";

const HabitHistory = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { theme, isDark } = useTheme();
    const { colors } = theme;
    const { t, i18n } = useTranslation();
    const [token] = useMMKVString("accessToken");
    
    const { habitId, habitTitle, habitIcon } = route.params;
    
    const [loading, setLoading] = useState(true);
    const [monthlyData, setMonthlyData] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [markedDates, setMarkedDates] = useState({});
    const [selectedDayData, setSelectedDayData] = useState(null);
    const [isYearPickerVisible, setYearPickerVisible] = useState(false);
    const [calendarKey, setCalendarKey] = useState(0);
    
    const currentYear = new Date().getFullYear();
    const startYear = 2024;
    const yearsList = Array.from({length: Math.max(1, currentYear - startYear + 1)}, (_, i) => currentYear - i);


    useEffect(() => {
        const lang = i18n.language;
        LocaleConfig.locales[lang] = {
            monthNames: t('calendar.monthNames', { returnObjects: true }),
            monthNamesShort: t('calendar.monthNamesShort', { returnObjects: true }),
            dayNames: t('calendar.dayNames', { returnObjects: true }),
            dayNamesShort: t('calendar.dayNamesShort', { returnObjects: true }),
            today: t('calendar.today')
        };
        LocaleConfig.defaultLocale = lang;
        fetchHistory(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    }, [currentMonth, i18n.language]);

    const fetchHistory = async (year, month) => {
        try {
            setLoading(true);
            const response = await getMonthlyProgressFetch(token, habitId, year, month);
            if (response?.data) {
                setMonthlyData(response.data);
                generateMarkedDates(response.data.monthlyProgress);
            }
        } catch (error) {
            console.error("History fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateMarkedDates = (progress, selectedDateString = null) => {
        const marks = {};
        progress.forEach(day => {
            const dateString = day.date.split('T')[0];
            const isSelected = selectedDateString === dateString;
            
            if (day.isCompleted) {
                marks[dateString] = {
                    selected: true,
                    selectedColor: isSelected ? colors.primary : `${colors.primary}80`, // semi-transparent if not the focused selection
                    customStyles: {
                        container: {
                            borderRadius: 8,
                            borderWidth: isSelected ? 2 : 0,
                            borderColor: colors.text
                        },
                        text: {
                            color: '#fff',
                            fontWeight: 'bold'
                        }
                    }
                };
            } else if (new Date(day.date) < new Date().setHours(0,0,0,0)) {
                marks[dateString] = {
                    selected: isSelected,
                    selectedColor: colors.cardSecondary,
                    customStyles: {
                        container: {
                            borderWidth: isSelected ? 2 : 1,
                            borderColor: isSelected ? colors.primary : colors.border,
                            borderRadius: 8,
                        },
                        text: {
                            color: isSelected ? colors.primary : colors.textSecondary
                        }
                    }
                };
            } else if (isSelected) {
                marks[dateString] = {
                    selected: true,
                    selectedColor: colors.cardSecondary,
                    customStyles: {
                        container: {
                            borderWidth: 2,
                            borderColor: colors.primary,
                            borderRadius: 8,
                        }
                    }
                };
            }
        });
        setMarkedDates(marks);
    };


    const onMonthChange = (month) => {
        setCurrentMonth(new Date(month.year, month.month - 1));
        setSelectedDayData(null);
    };

    const onDayPress = (day) => {
        const dayData = monthlyData?.monthlyProgress.find(p => p.date.split('T')[0] === day.dateString);
        setSelectedDayData(dayData);
        
        // Update marked dates to show selection
        generateMarkedDates(monthlyData.monthlyProgress, day.dateString);
    };


    return (
        <LinearGradient colors={colors.backgroundGradient} style={{ flex: 1 }}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={[styles.iconCircle, { backgroundColor: colors.card }]} hitSlop={10}>
                    <FontAwesomeIcon icon={faArrowLeft} color={colors.text} size={18} />
                </Pressable>
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text className='font-redditsans-bold text-2xl' style={{ color: colors.text }}>{t("habit_history.header")}</Text>
                    <Text className='font-redditsans-medium text-lg' style={{ color: colors.textSecondary }}>
                        {t(`habits.${habitTitle?.toLowerCase().replace(/\s+/g, '_')}`, { defaultValue: habitTitle })} {ICONS[habitIcon]}
                    </Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Calendar
                        key={`${i18n.language}-${calendarKey}`}
                        current={currentMonth.toISOString().split('T')[0]}
                        onMonthChange={onMonthChange}
                        onDayPress={onDayPress}
                        markedDates={markedDates}

                        markingType={'custom'}
                        renderHeader={(date) => {
                            const monthName = LocaleConfig.locales[i18n.language]?.monthNames[date.getMonth()] || 'Month';
                            return (
                                <Pressable onPress={() => setYearPickerVisible(true)} hitSlop={10}>
                                    <Text style={{
                                        color: isDark ? colors.text : '#1f2937',
                                        fontSize: 18,
                                        fontFamily: 'RedditSans-Bold'
                                    }}>
                                        {monthName} {date.getFullYear()}
                                    </Text>
                                </Pressable>
                            );
                        }}
                        theme={{
                            calendarBackground: 'transparent',
                            textSectionTitleColor: isDark ? colors.textSecondary : '#4b5563',
                            monthTextColor: isDark ? colors.text : '#1f2937',
                            selectedDayBackgroundColor: colors.primary,
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: colors.primary,
                            dayTextColor: colors.text,
                            textDisabledColor: colors.textMuted,
                            dotColor: colors.primary,
                            selectedDotColor: '#ffffff',
                            arrowColor: colors.primary,
                            textMonthFontWeight: '700',
                            indicatorColor: colors.primary,


                            textDayFontFamily: 'RedditSans-Regular',
                            textMonthFontFamily: 'RedditSans-Bold',
                            textDayHeaderFontFamily: 'RedditSans-Medium',
                            textDayFontSize: 14,
                            textMonthFontSize: 18,
                            textDayHeaderFontSize: 12,
                        }}
                    />
                </View>

                {selectedDayData && (
                    <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
                        <View style={styles.detailHeader}>
                            <Text style={[styles.detailDate, { color: colors.text }]}>
                                {new Date(selectedDayData.date).toLocaleDateString(i18n.language === 'az' ? 'az-AZ' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: selectedDayData.isCompleted ? `${colors.primary}20` : `${colors.danger}20` }]}>
                                <FontAwesomeIcon 
                                    icon={selectedDayData.isCompleted ? faCheckCircle : faTimesCircle} 
                                    color={selectedDayData.isCompleted ? colors.primary : colors.danger} 
                                    size={14} 
                                />
                                <Text style={[styles.statusText, { color: selectedDayData.isCompleted ? colors.primary : colors.danger }]}>
                                    {selectedDayData.isCompleted ? t("habit_history.status_completed") : t("habit_history.status_not_completed")}
                                </Text>
                            </View>
                        </View>
                        
                        {selectedDayData.note ? (
                            <View style={[styles.noteContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>

                                <View style={styles.noteHeader}>
                                    <FontAwesomeIcon icon={faNoteSticky} color={colors.primary} size={14} />
                                    <Text style={[styles.noteTitle, { color: colors.textSecondary }]}>{t("habit_history.notes_title")}</Text>
                                </View>
                                <Text style={[styles.noteText, { color: colors.text }]}>
                                    {selectedDayData.note}
                                </Text>
                            </View>
                        ) : (
                            <Text style={[styles.noNoteText, { color: colors.textMuted }]}>
                                {t("habit_history.no_notes")}
                            </Text>
                        )}
                    </View>
                )}


                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                ) : (
                    <>
                        <View style={styles.statsRow}>
                            <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                                <Text className="font-redditsans-bold text-xs uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>{t("habit_history.completion")}</Text>
                                <Text className="font-redditsans-bold text-2xl" style={{ color: colors.text }}>
                                    {Math.round(monthlyData?.completionPercentage || 0)}%
                                </Text>
                            </View>
                            <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                                <Text className="font-redditsans-bold text-xs uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>{t("habit_history.days_done")}</Text>
                                <Text className="font-redditsans-bold text-2xl" style={{ color: colors.text }}>
                                    {monthlyData?.completedDays || 0}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.streakCard, { backgroundColor: colors.card }]}>
                            <View style={styles.streakItem}>
                                <View style={[styles.streakIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                    <FontAwesomeIcon icon={faFire} color="#f59e0b" size={20} />
                                </View>
                                <View>
                                    <Text className="font-redditsans-bold text-[10px] uppercase tracking-wider" style={{ color: colors.textSecondary }}>{t("habit_history.current_streak")}</Text>
                                    <Text className="font-redditsans-bold text-lg" style={{ color: colors.text }}>
                                        {monthlyData?.currentStreak || 0} {t("habit_history.days")}
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <View style={styles.streakItem}>
                                <View style={[styles.streakIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                    <FontAwesomeIcon icon={faTrophy} color="#10b981" size={20} />
                                </View>
                                <View>
                                    <Text className="font-redditsans-bold text-[10px] uppercase tracking-wider" style={{ color: colors.textSecondary }}>{t("habit_history.best_streak")}</Text>
                                    <Text className="font-redditsans-bold text-lg" style={{ color: colors.text }}>
                                        {monthlyData?.longestStreak || 0} {t("habit_history.days")}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            <Modal
                visible={isYearPickerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setYearPickerVisible(false)}
            >
                <TouchableOpacity 
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    activeOpacity={1}
                    onPress={() => setYearPickerVisible(false)}
                >
                    <View style={{ width: 320, borderRadius: 24, padding: 20, backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
                        <Text className="font-redditsans-bold text-xl mb-6 text-center" style={{ color: colors.text }}>
                            {t('statistics.select_month_year', 'Ay və İli seçin')}
                        </Text>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', maxHeight: 240 }}>
                            {/* Months Column */}
                            <ScrollView style={{ flex: 1, marginRight: 8 }} showsVerticalScrollIndicator={false}>
                                {LocaleConfig.locales[i18n.language]?.monthNames.map((monthName, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={{ paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.05)' }}
                                        onPress={() => {
                                            const newDate = new Date(currentMonth);
                                            newDate.setMonth(index);
                                            setCurrentMonth(newDate);
                                            setSelectedDayData(null);
                                            setCalendarKey(prev => prev + 1);
                                        }}
                                    >
                                        <Text 
                                            className={currentMonth.getMonth() === index ? "font-redditsans-bold text-base" : "font-redditsans-medium text-base"}
                                            style={{ 
                                                color: currentMonth.getMonth() === index ? colors.primary : colors.text,
                                            }} 
                                        >
                                            {monthName}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Separator */}
                            <View style={{ width: 1, backgroundColor: 'rgba(150,150,150,0.1)', marginVertical: 10 }} />

                            {/* Years Column */}
                            <ScrollView style={{ flex: 1, marginLeft: 8 }} showsVerticalScrollIndicator={false}>
                                {yearsList.map((year) => (
                                    <TouchableOpacity
                                        key={year}
                                        style={{ paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.05)' }}
                                        onPress={() => {
                                            const newDate = new Date(currentMonth);
                                            newDate.setFullYear(year);
                                            setCurrentMonth(newDate);
                                            setSelectedDayData(null);
                                            setCalendarKey(prev => prev + 1);
                                        }}
                                    >
                                        <Text 
                                            className={currentMonth.getFullYear() === year ? "font-redditsans-bold text-base" : "font-redditsans-medium text-base"}
                                            style={{ 
                                                color: currentMonth.getFullYear() === year ? colors.primary : colors.text,
                                            }} 
                                        >
                                            {year}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <TouchableOpacity 
                            style={{ marginTop: 20, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 16, alignItems: 'center' }}
                            onPress={() => setYearPickerVisible(false)}
                        >
                            <Text className="font-redditsans-bold text-base text-white">{t('common.confirm')}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14,
    },
    headerTitle: {
        fontSize: 22, fontWeight: "700", letterSpacing: 0.1
    },
    headerSubtitle: {
        fontSize: 14, marginTop: 2, fontWeight: "500"
    },
    iconCircle: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: "center", justifyContent: "center",
        elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15, shadowRadius: 2
    },
    scrollContent: {
        paddingHorizontal: 20, paddingBottom: 120
    },
    card: {
        borderRadius: 24, padding: 12, marginBottom: 20,
        elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 6
    },
    statsRow: {
        flexDirection: 'row', gap: 12, marginBottom: 12
    },
    statBox: {
        flex: 1, borderRadius: 20, padding: 16,
        elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4
    },
    statLabel: {
        fontSize: 12, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5
    },
    statValue: {
        fontSize: 20, fontWeight: '800'
    },
    streakCard: {
        borderRadius: 24, padding: 20, marginBottom: 20,
        flexDirection: 'row', alignItems: 'center',
        elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 6
    },
    streakItem: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12
    },
    streakIcon: {
        width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center'
    },
    divider: {
        width: 1, height: 40, marginHorizontal: 12
    },
    legendCard: {
        borderRadius: 20, padding: 16,
        elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4
    },
    legendTitle: {
        fontSize: 14, fontWeight: '700', marginBottom: 12
    },
    legendItem: {
        flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8
    },
    legendDot: {
        width: 12, height: 12, borderRadius: 4
    },
    legendText: {
        fontSize: 13, fontWeight: '500'
    },
    detailCard: {

        borderRadius: 24, padding: 20, marginBottom: 20,
        elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 6
    },
    detailHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16
    },
    detailDate: {
        fontSize: 16, fontWeight: '700'
    },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12
    },
    statusText: {
        fontSize: 12, fontWeight: '600'
    },
    noteContainer: {
        marginTop: 8, padding: 12, borderRadius: 16, 
    },

    noteHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8
    },
    noteTitle: {
        fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5
    },
    noteText: {
        fontSize: 14, lineHeight: 22, fontWeight: '500'
    },
    noNoteText: {
        fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 8, opacity: 0.7
    }
});



export default HabitHistory;
