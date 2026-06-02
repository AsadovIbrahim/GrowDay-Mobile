import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faChevronLeft,
  faSnowflake,
  faMedal,
  faUser,
  faClock,
  faStar,
  faPalette,
  faQuoteRight,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { storage } from '../../utils/MMKVStore';
import { getUserTotalXPFetch, getAccountDataFetch, buyStoreItemFetch } from '../../utils/fetch';

const StoreScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();

  const [points, setPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [freezes, setFreezes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [inventory, setInventory] = useState({
    hasPremiumBorder: false,
    xpBoosterActiveUntil: null,
    hasCustomHabitIcon: false,
    hasProfileBadge: false,
    hasThemePack: false,
    hasMotivationPack: false,
  });

  const [boosterTimeRemaining, setBoosterTimeRemaining] = useState(null);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const token = storage.getString('accessToken');
      if (token) {
        const [pointsRes, accountRes] = await Promise.all([
          getUserTotalXPFetch(token),
          getAccountDataFetch(token),
        ]);

        if (pointsRes?.success) {
          setPoints(pointsRes.data ?? 0);
        }
        if (accountRes?.success) {
          setFreezes(accountRes.data?.streakFreezes ?? 0);
          setTotalPoints(accountRes.data?.totalExperiencePoints ?? pointsRes.data ?? 0);
          setInventory({
            hasPremiumBorder: accountRes.data?.hasPremiumBorder ?? false,
            xpBoosterActiveUntil: accountRes.data?.xpBoosterActiveUntil ?? null,
            hasCustomHabitIcon: accountRes.data?.hasCustomHabitIcon ?? false,
            hasProfileBadge: accountRes.data?.hasProfileBadge ?? false,
            hasThemePack: accountRes.data?.hasThemePack ?? false,
            hasMotivationPack: accountRes.data?.hasMotivationPack ?? false,
          });
        }
      }
    } catch (e) {
      console.log('Error fetching store metadata:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Real-time XP Booster Countdown Timer
  useEffect(() => {
    if (!inventory.xpBoosterActiveUntil) {
      setBoosterTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const expiry = new Date(inventory.xpBoosterActiveUntil);
      const now = new Date();
      const diff = expiry - now;
      if (diff <= 0) {
        setBoosterTimeRemaining(null);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const lang = i18n.language || 'en';
        if (lang === 'az') {
          setBoosterTimeRemaining(`${hours}saat ${minutes}dəq ${seconds}san`);
        } else if (lang === 'tr') {
          setBoosterTimeRemaining(`${hours}saat ${minutes}dk ${seconds}sn`);
        } else if (lang === 'ru') {
          setBoosterTimeRemaining(`${hours}ч ${minutes}м ${seconds}с`);
        } else {
          setBoosterTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [inventory.xpBoosterActiveUntil, i18n.language]);

  const handleBuyItem = async (itemType, cost, name) => {
    // Guard: streak freeze cap
    if (itemType === 'streak_freeze' && freezes >= 3) {
      Vibration.vibrate(50);
      Alert.alert(
        t('store.streak_freeze_limit_title', 'Limit Dolub ❄️'),
        t('store.streak_freeze_limit_desc', 'Eyni anda maksimum 3 Zəncir Dondurucuya sahib ola bilərsiniz. Yenisini almaq üçün əvvəlcə mövcud olanları istifadə etməlisiniz!')
      );
      return;
    }

    // Guard: 2x XP booster duration cap (max 72 hours, cannot extend if remaining >= 48 hours)
    if (itemType === 'xp_booster' && inventory.xpBoosterActiveUntil) {
      const expiry = new Date(inventory.xpBoosterActiveUntil);
      const now = new Date();
      const diffHours = (expiry - now) / (1000 * 60 * 60);
      if (diffHours >= 48.0) {
        Vibration.vibrate(50);
        Alert.alert(
          t('store.booster_limit_title', 'Müddət Limiti Dolub ⚡'),
          t('store.booster_limit_desc', 'XP Gücləndiricinin maksimum aktiv müddəti 72 saat ola bilər. Mövcud müddət azalana qədər yenisini ala bilməzsiniz!')
        );
        return;
      }
    }

    if (points < cost) {
      Vibration.vibrate(50);
      Alert.alert(
        t('store.insufficient_xp_title', 'Kifayət qədər XP yoxdur'),
        t('store.insufficient_xp_desc_custom', {
          item: name,
          cost: cost,
          defaultValue: `${name} almaq üçün ən az ${cost} XP lazımdır. Vərdişlərinizi yerinə yetirərək daha çox xal qazanın! 🎯`
        })
      );
      return;
    }

    Alert.alert(
      t('store.confirm_buy_title', 'Satın almanı təsdiqləyin'),
      t('store.confirm_buy_desc_custom', {
        item: name,
        cost: cost,
        defaultValue: `1 ədəd ${name} almaq üçün ${cost} XP xalınızdan istifadə olunacaq. Təsdiq edirsiniz?`
      }),
      [
        { text: t('common.cancel', 'Ləğv et'), style: 'cancel' },
        {
          text: t('store.buy_btn', 'Satın Al'),
          onPress: async () => {
            setPurchaseLoading(true);
            try {
              const token = storage.getString('accessToken');
              if (token) {
                const res = await buyStoreItemFetch(token, itemType);

                // Backend may return PascalCase (Message) or camelCase (message)
                const resMessage = res?.message || res?.Message || '';
                const isSuccess = res?.success === true || resMessage.toLowerCase().includes('successfully');

                if (isSuccess) {
                  Vibration.vibrate([0, 10, 50, 100]); // Play success haptic

                  // Read both camelCase and PascalCase variants
                  setPoints(
                    res?.experiencePoints ?? res?.ExperiencePoints ?? (points - cost)
                  );
                  setFreezes(
                    res?.streakFreezes ?? res?.StreakFreezes ?? freezes
                  );
                  setInventory({
                    hasPremiumBorder: res?.hasPremiumBorder ?? res?.HasPremiumBorder ?? inventory.hasPremiumBorder,
                    xpBoosterActiveUntil: res?.xpBoosterActiveUntil ?? res?.XpBoosterActiveUntil ?? inventory.xpBoosterActiveUntil,
                    hasCustomHabitIcon: res?.hasCustomHabitIcon ?? res?.HasCustomHabitIcon ?? inventory.hasCustomHabitIcon,
                    hasProfileBadge: res?.hasProfileBadge ?? res?.HasProfileBadge ?? inventory.hasProfileBadge,
                    hasThemePack: res?.hasThemePack ?? res?.HasThemePack ?? inventory.hasThemePack,
                    hasMotivationPack: res?.hasMotivationPack ?? res?.HasMotivationPack ?? inventory.hasMotivationPack,
                  });

                  Alert.alert(
                    t('store.buy_success_title', 'Təbriklər! 🎉'),
                    t('store.buy_success_desc_custom', {
                      item: name,
                      defaultValue: `${name} uğurla alındı! Yenilik dərhal tətbiq edildi.`
                    })
                  );
                } else {
                  const isLimitError = resMessage.toLowerCase().includes('maximum') || resMessage.toLowerCase().includes('limit');
                  if (isLimitError) {
                    Vibration.vibrate(50);
                    if (itemType === 'xp_booster') {
                      Alert.alert(
                        t('store.booster_limit_title', 'Müddət Limiti Dolub ⚡'),
                        t('store.booster_limit_desc', 'XP Gücləndiricinin maksimum aktiv müddəti 72 saat ola bilər. Mövcud müddət azalana qədər yenisini ala bilməzsiniz!')
                      );
                    } else {
                      Alert.alert(
                        t('store.streak_freeze_limit_title', 'Limit Dolub ❄️'),
                        t('store.streak_freeze_limit_desc', 'Eyni anda maksimum 3 Zəncir Dondurucuya sahib ola bilərsiniz.')
                      );
                    }
                  } else {
                    Alert.alert(t('common.error'), resMessage || t('store.buy_failed'));
                  }
                }
              }
            } catch (err) {
              console.error('Error buying store item:', err);
              Alert.alert(t('common.error'), t('store.buy_failed'));
            } finally {
              setPurchaseLoading(false);
            }
          }
        }
      ]
    );
  };

  const calculationPoints = totalPoints !== undefined && totalPoints !== null ? totalPoints : points;
  const userLevel = Math.floor(Math.sqrt(calculationPoints / 50)) + 1;
  const currentLvlPoints = 50 * Math.pow(userLevel - 1, 2);
  const nextLvlPoints = 50 * Math.pow(userLevel, 2);
  const totalLvlRange = nextLvlPoints - currentLvlPoints;
  const pointsInCurrentLvl = calculationPoints - currentLvlPoints;
  const progressRatio = totalLvlRange > 0 ? Math.min(Math.max(pointsInCurrentLvl / totalLvlRange, 0), 1) : 0;

  const storeItems = [
    {
      id: 'streak_freeze',
      title: t('store.items.streak_freeze.title', 'Zəncir Dondurucu'),
      desc: t('store.items.streak_freeze.desc', 'Günün sonunda vərdişi tamamlamağı unutsanız belə ardıcıllıq zəncirini (streak) qoruyan sehirli qalxan. Hər buraxılmış gün avtomatik 1 ədəd istifadə olunur.'),
      cost: 200,
      icon: faSnowflake,
      colors: ['#3b82f6', '#1d4ed8'],
      isConsumable: true,
      ownedText: freezes > 0 ? `${freezes} ${t('store.owned', 'ədəd aktivdir')}` : null,
      isAtLimit: freezes >= 3,
    },
    {
      id: 'premium_border',
      title: t('store.items.premium_border.title', 'Premium Profil Çərçivəsi'),
      desc: t('store.items.premium_border.desc', 'Profil şəklinizin ətrafında parıldayan və fırlanan çoxrəngli sehirli gradient halqa aktivləşdirir. Bütün istifadəçilərə fərqinizi göstərin!'),
      cost: 500,
      icon: faUser,
      colors: ['#a855f7', '#6b21a8'],
      isPermanent: true,
      isOwned: inventory.hasPremiumBorder,
    },
    {
      id: 'xp_booster',
      title: t('store.items.xp_booster.title', '2x XP Gücləndirici (24s)'),
      desc: t('store.items.xp_booster.desc', 'Dəqiq 24 saat ərzində tamamlanan hər vərdişdən və tapşırıqdan tam 2 QAT daha çox təcrübə xalı (XP) qazandırır. Sürətlə Level atlayın!'),
      cost: 300,
      icon: faClock,
      colors: ['#eab308', '#ca8a04'],
      isBooster: true,
      boosterCountdown: boosterTimeRemaining,
    },
    {
      id: 'custom_habit_icon',
      title: t('store.items.custom_habit_icon.title', 'Xüsusi Vərdiş İkonu'),
      desc: t('store.items.custom_habit_icon.desc', 'Yeni vərdiş yaradarkən və ya redaktə edərkən xüsusi premium emojilər və rəngli ikonlar seçməyə imkan verən gizli paneli aktivləşdirir.'),
      cost: 150,
      icon: faStar,
      colors: ['#f43f5e', '#be123c'],
      isPermanent: true,
      isOwned: inventory.hasCustomHabitIcon,
    },
    {
      id: 'profile_badge',
      title: t('store.items.profile_badge.title', 'VIP Profil Nişanı'),
      desc: t('store.items.profile_badge.desc', 'Profilinizdə adınızın tam yanında xüsusi parıldayan VIP kral tacı (👑) ikonu göstərir və profilinizi ultra-premium edir.'),
      cost: 400,
      icon: faMedal,
      colors: ['#10b981', '#047857'],
      isPermanent: true,
      isOwned: inventory.hasProfileBadge,
    },
    {
      id: 'theme_pack',
      title: t('store.items.theme_pack.title', 'Premium Tema Paketi'),
      desc: t('store.items.theme_pack.desc', 'Tətbiqə Sunset Glow, Ocean Wave, Cyber Neon və Rose Gold premium rəng temalarını əlavə edərək görünüşünü tamamilə dəyişir.'),
      cost: 600,
      icon: faPalette,
      colors: ['#ec4899', '#db2777'],
      isPermanent: true,
      isOwned: inventory.hasThemePack,
    },
    {
      id: 'motivation_pack',
      title: t('store.items.motivation_pack.title', 'Motivasiya Paketi'),
      desc: t('store.items.motivation_pack.desc', 'Dashboard-a və ya bildirişlərə fərdiləşdirilmiş gündəlik premium motivasiya sitatları və hədəf tövsiyələri toplusunu əlavə edir.'),
      cost: 200,
      icon: faQuoteRight,
      colors: ['#06b6d4', '#0891b2'],
      isPermanent: true,
      isOwned: inventory.hasMotivationPack,
    },
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('store.header_title', 'XP Mağazası')}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 100 }} />
        ) : (
          <>
            {/* Status Card: Level, XP & Owned Freezes */}
            <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
              <View style={styles.levelRow}>
                <View style={[styles.medalCircle, { backgroundColor: colors.primary + '15' }]}>
                  <FontAwesomeIcon icon={faMedal} size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.levelLabel, { color: colors.textSecondary }]}>
                    {t('profile.level', 'Səviyyə')}
                  </Text>
                  <Text style={[styles.levelValue, { color: colors.text }]}>
                    {t('common.level_short', { level: userLevel })}
                  </Text>
                </View>
                <View style={styles.xpBadge}>
                  <Text style={[styles.xpText, { color: colors.text }]}>
                    {points} XP
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressSection}>
                <View style={{ height: 6, width: '100%', backgroundColor: colors.border + '30', borderRadius: 3, overflow: 'hidden' }}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ height: '100%', width: `${progressRatio * 100}%`, borderRadius: 3 }}
                  />
                </View>
              </View>

              {/* Owned items status bar */}
              <View style={[styles.divider, { backgroundColor: colors.border + '30' }]} />

              <View style={styles.inventoryRow}>
                <Text style={[styles.inventoryTitle, { color: colors.text }]}>
                  {t('store.my_perks', 'Aktiv Üstünlükləriniz')}
                </Text>
                <View style={styles.badgesContainer}>
                  {freezes > 0 && (
                    <View style={[styles.inventoryBadge, { backgroundColor: '#3b82f620' }]}>
                      <Text style={{ color: '#3b82f6', fontSize: 11, fontFamily: 'RedditSans-Bold' }}>❄️ {freezes}</Text>
                    </View>
                  )}
                  {inventory.hasPremiumBorder && (
                    <View style={[styles.inventoryBadge, { backgroundColor: '#a855f720' }]}>
                      <Text style={{ color: '#a855f7', fontSize: 11, fontFamily: 'RedditSans-Bold' }}>{t('store.perks.border', '🎨 Çərçivə')}</Text>
                    </View>
                  )}
                  {boosterTimeRemaining && (
                    <View style={[styles.inventoryBadge, { backgroundColor: '#eab30820' }]}>
                      <Text style={{ color: '#eab308', fontSize: 11, fontFamily: 'RedditSans-Bold' }}>⏰ 2x XP</Text>
                    </View>
                  )}
                  {inventory.hasCustomHabitIcon && (
                    <View style={[styles.inventoryBadge, { backgroundColor: '#f43f5e20' }]}>
                      <Text style={{ color: '#f43f5e', fontSize: 11, fontFamily: 'RedditSans-Bold' }}>{t('store.perks.icon', '🎯 İkon')}</Text>
                    </View>
                  )}
                  {inventory.hasProfileBadge && (
                    <View style={[styles.inventoryBadge, { backgroundColor: '#10b98120' }]}>
                      <Text style={{ color: '#10b981', fontSize: 11, fontFamily: 'RedditSans-Bold' }}>👑 VIP</Text>
                    </View>
                  )}
                  {inventory.hasThemePack && (
                    <View style={[styles.inventoryBadge, { backgroundColor: '#ec489920' }]}>
                      <Text style={{ color: '#ec4899', fontSize: 11, fontFamily: 'RedditSans-Bold' }}>{t('store.perks.themes', '🌈 Temalar')}</Text>
                    </View>
                  )}
                  {inventory.hasMotivationPack && (
                    <View style={[styles.inventoryBadge, { backgroundColor: '#06b6d420' }]}>
                      <Text style={{ color: '#06b6d4', fontSize: 11, fontFamily: 'RedditSans-Bold' }}>{t('store.perks.motivation', '💬 Motiv.')}</Text>
                    </View>
                  )}
                  {!freezes &&
                    !inventory.hasPremiumBorder &&
                    !boosterTimeRemaining &&
                    !inventory.hasCustomHabitIcon &&
                    !inventory.hasProfileBadge &&
                    !inventory.hasThemePack &&
                    !inventory.hasMotivationPack && (
                      <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'RedditSans-Italic' }}>
                        {t('store.no_active_perks', 'Hələlik heç bir perk yoxdur.')}
                      </Text>
                    )}
                </View>
              </View>
            </View>

            {/* Store items section */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('store.items_section', 'PREMİUM XP MƏHSULLARI')}
            </Text>

            {/* Dynamic Store Catalog */}
            {storeItems.map((item) => (
              <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.card }]}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemIconContainer}>
                    <LinearGradient
                      colors={item.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.itemGradientCircle}
                    >
                      <FontAwesomeIcon icon={item.icon} size={26} color="#fff" />
                    </LinearGradient>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[styles.itemTitle, { color: colors.text }]}>
                        {item.title}
                      </Text>
                      {item.isOwned && (
                        <FontAwesomeIcon icon={faCheckCircle} size={15} color="#10b981" />
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
                      <View style={[styles.priceContainer, { backgroundColor: colors.primary + '10' }]}>
                        <Text style={[styles.priceText, { color: colors.primary }]}>{item.cost} XP</Text>
                      </View>
                      {item.ownedText && (
                        <View style={styles.perkActiveBadge}>
                          <Text style={styles.perkActiveText}>{item.ownedText}</Text>
                        </View>
                      )}
                      {item.isBooster && item.boosterCountdown && (
                        <View style={[styles.perkActiveBadge, { backgroundColor: '#eab30820' }]}>
                          <Text style={[styles.perkActiveText, { color: '#ca8a04' }]}>
                            {item.boosterCountdown}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                  {item.desc}
                </Text>

                {item.isOwned ? (
                  <View style={[styles.ownedBtn, { borderColor: colors.border }]}>
                    <Text style={[styles.ownedBtnText, { color: colors.textSecondary }]}>
                      {t('store.owned_btn', 'Sizə Məxsusdur ✓')}
                    </Text>
                  </View>
                ) : item.isAtLimit ? (
                  <TouchableOpacity
                    onPress={() => handleBuyItem(item.id, item.cost, item.title)}
                    disabled={purchaseLoading}
                    style={[styles.ownedBtn, { borderColor: '#f97316', backgroundColor: '#f9731610' }]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.ownedBtnText, { color: '#f97316' }]}>
                      🔒 {t('store.streak_freeze_limit_title', 'Limit Dolub')} (3/3)
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleBuyItem(item.id, item.cost, item.title)}
                    disabled={purchaseLoading}
                    style={[styles.buyBtn, { backgroundColor: colors.primary }]}
                    activeOpacity={0.8}
                  >
                    {purchaseLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buyBtnText}>
                        {item.isBooster && item.boosterCountdown
                          ? `${t('store.buy_again', 'Vaxtı Artır')} - ${item.cost} XP`
                          : `${t('store.buy_btn_action', 'Satın Al')} - ${item.cost} XP`}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Extra items placeholder */}
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border + '30' }]}>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {t('store.feedback_items', 'Yeni fikirləriniz və ya təklif etmək istədiyiniz digər maraqlı XP store məhsulları var? Dəstək bölməsindən bizə yazın! 🚀')}
              </Text>
            </View>
          </>
        )}
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
  headerTitle: {
    fontSize: 20, fontFamily: 'RedditSans-Bold',
  },

  /* Status Card */
  statusCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  medalCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  levelLabel: { fontSize: 11, fontFamily: 'RedditSans-Regular', marginBottom: 2 },
  levelValue: { fontSize: 18, fontFamily: 'RedditSans-Bold' },
  xpBadge: {
    backgroundColor: 'rgba(78,168,84,0.1)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12,
  },
  xpText: { fontSize: 14, fontFamily: 'RedditSans-Bold' },
  progressSection: { marginTop: 14 },
  divider: { height: 1, marginVertical: 18 },

  inventoryRow: { gap: 10 },
  inventoryTitle: { fontSize: 13, fontFamily: 'RedditSans-Bold' },
  badgesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  inventoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 11, fontFamily: 'RedditSans-Bold',
    letterSpacing: 1.2, marginBottom: 16, marginLeft: 4,
  },

  /* Item Card */
  itemCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  itemIconContainer: {
    width: 54, height: 54, borderRadius: 27,
    overflow: 'hidden',
  },
  itemGradientCircle: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  itemTitle: { fontSize: 16, fontFamily: 'RedditSans-Bold' },
  priceContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8,
  },
  priceText: { fontSize: 12, fontFamily: 'RedditSans-Bold' },

  perkActiveBadge: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8,
  },
  perkActiveText: { fontSize: 11, color: '#3b82f6', fontFamily: 'RedditSans-Bold' },

  itemDescription: {
    fontSize: 13, fontFamily: 'RedditSans-Regular',
    lineHeight: 18, marginTop: 14, marginBottom: 18,
  },
  buyBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: {
    color: '#fff', fontSize: 15, fontFamily: 'RedditSans-Bold',
  },
  ownedBtn: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ownedBtnText: {
    fontSize: 14, fontFamily: 'RedditSans-Bold',
  },

  /* Info Card */
  infoCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 10,
  },
  infoText: {
    fontSize: 12, fontFamily: 'RedditSans-Medium',
    textAlign: 'center', lineHeight: 18,
  },
});

export default StoreScreen;
