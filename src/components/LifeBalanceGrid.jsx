import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  TouchableWithoutFeedback,
  Alert,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faPlus,
  faSyncAlt,
  faCheckCircle,
  faTimes,
  faBrain,
  faChartLine,
  faSparkles,
  faHeartPulse,
  faHeart,
  faBriefcase,
  faUsers,
  faBookOpen,
  faGamepad,
  faLeaf,
  faGraduationCap,
  faUser,
  faPuzzlePiece,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';
import Svg, { Circle, Line, Path, G, Rect, Defs, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { storage } from '../utils/MMKVStore';
import { getUserHabitFetch, getTodaysUserHabitFetch } from '../utils/fetch';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const getSmoothSplinePath = (pts) => {
  if (!pts || pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

  let path = `M ${pts[0].x} ${pts[0].y}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i === 0 ? pts[0] : pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i + 2 < pts.length ? pts[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
};

const getSegmentSplinePath = (pts, i) => {
  if (!pts || pts.length < 2 || i >= pts.length - 1) return '';
  const p0 = i === 0 ? pts[0] : pts[i - 1];
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const p3 = i + 2 < pts.length ? pts[i + 2] : p2;

  const cp1x = p1.x + (p2.x - p0.x) / 6;
  const cp1y = p1.y + (p2.y - p0.y) / 6;
  const cp2x = p2.x - (p3.x - p1.x) / 6;
  const cp2y = p2.y - (p3.y - p1.y) / 6;

  return `M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
};

const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ');
};

const RADAR_CATEGORY_CONFIG = [
  {
    key: 'health',
    angleDeg: 0, // 12:00 Top
    color: '#FF6B4A',
    bgGradient: ['#FF6B4A', '#E04828'],
    emoji: '🏃',
    faIcon: faHeartPulse || faHeart,
    titleKey: 'health',
    az: 'Sağlamlıq və İdman',
    en: 'Health & Fitness',
    tr: 'Sağlık & Spor',
    ru: 'Здоровье и спорт',
  },
  {
    key: 'mindset',
    angleDeg: 45, // 1:30 Top-Right
    color: '#8B5CF6',
    bgGradient: ['#A855F7', '#7E22CE'],
    emoji: '🧘',
    faIcon: faBrain,
    titleKey: 'mindset',
    az: 'Dünya Görüşü',
    en: 'Mindset',
    tr: 'Zihniyet',
    ru: 'Мышление',
  },
  {
    key: 'career',
    angleDeg: 90, // 3:00 Right
    color: '#E11D48',
    bgGradient: ['#E11D48', '#BE123C'],
    emoji: '💼',
    faIcon: faBriefcase,
    titleKey: 'career',
    az: 'Karyera və İş',
    en: 'Career & Work',
    tr: 'Kariyer & İş',
    ru: 'Карьера и работа',
  },
  {
    key: 'social',
    angleDeg: 135, // 4:30 Bottom-Right
    color: '#9333EA',
    bgGradient: ['#9333EA', '#7E22CE'],
    emoji: '🤝',
    faIcon: faUsers,
    titleKey: 'social',
    az: 'Sosial',
    en: 'Social',
    tr: 'Sosyal',
    ru: 'Общение',
  },
  {
    key: 'finance',
    angleDeg: 180, // 6:00 Bottom
    color: '#D97706',
    bgGradient: ['#D97706', '#B45309'],
    emoji: '💰',
    faIcon: faBookOpen,
    titleKey: 'finance',
    az: 'Maliyyə',
    en: 'Finance',
    tr: 'Finans',
    ru: 'Финансы',
  },
  {
    key: 'routine',
    angleDeg: 225, // 7:30 Bottom-Left
    color: '#4F46E5',
    bgGradient: ['#4F46E5', '#4338CA'],
    emoji: '⏰',
    faIcon: faGamepad,
    titleKey: 'routine',
    az: 'Gündəlik Rejim',
    en: 'Routine',
    tr: 'Rutin',
    ru: 'Рутина',
  },
  {
    key: 'focus',
    angleDeg: 270, // 9:00 Left
    color: '#DC2626',
    bgGradient: ['#DC2626', '#B91C1C'],
    emoji: '🎯',
    faIcon: faLeaf,
    titleKey: 'focus',
    az: 'Fokus və Diqqət',
    en: 'Focus',
    tr: 'Odaklanma',
    ru: 'Фокус',
  },
  {
    key: 'learning',
    angleDeg: 315, // 10:30 Top-Left
    color: '#2563EB',
    bgGradient: ['#2563EB', '#1D4ED8'],
    emoji: '📚',
    faIcon: faGraduationCap,
    titleKey: 'learning',
    az: 'Təhsil',
    en: 'Learning',
    tr: 'Eğitim',
    ru: 'Обучение',
  },
];

const CATEGORY_LOCALIZATION = {
  learning: { az: 'Təhsil', tr: 'Eğitim', ru: 'Обучение', en: 'Learning', es: 'Aprendizaje', fr: 'Apprentissage', de: 'Lernen', it: 'Apprendimento', ar: 'التعلم', zh: '学习' },
  health: { az: 'Sağlamlıq və İdman', tr: 'Sağlık & Spor', ru: 'Здоровье и спорт', en: 'Health & Fitness', es: 'Salud y Deporte', fr: 'Santé et Forme', de: 'Gesundheit & Fitness', it: 'Salute e Fitness', ar: 'الصحة واللياقة', zh: '健康与健身' },
  mindset: { az: 'Zəka və Ruhiyyə', tr: 'Zihin & Mental', ru: 'Разум и дух', en: 'Mind & Mental', es: 'Mente y Espíritu', fr: 'Mental et Esprit', de: 'Geist & Mentalität', it: 'Mente e Spirito', ar: 'العقل والروح', zh: '心态与精神' },
  career: { az: 'Karyera və Maliyyə', tr: 'Kariyer & Finans', ru: 'Карьера и финансы', en: 'Career & Finance', es: 'Carrera y Finanzas', fr: 'Carrière et Finances', de: 'Karriere & Finanzen', it: 'Carriera e Finanze', ar: 'المهنة والمالية', zh: '职业与财务' },
  finance: { az: 'Maliyyə', tr: 'Finans', ru: 'Финансы', en: 'Finance', es: 'Finanzas', fr: 'Finances', de: 'Finanzen', it: 'Finanze', ar: 'المالية', zh: '财务' },
  social: { az: 'Münasibətlər', tr: 'İlişkiler', ru: 'Отношения', en: 'Relationships', es: 'Relaciones', fr: 'Relations', de: 'Beziehungen', it: 'Relazioni', ar: 'العلاقات', zh: '人际关系' },
  growth: { az: 'Şəxsi İnkişaf', tr: 'Kişisel Gelişim', ru: 'Личный рост', en: 'Personal Growth', es: 'Crecimiento Personal', fr: 'Développement Personnel', de: 'Persönliches Wachstum', it: 'Crescita Personale', ar: 'النمو الشخصي', zh: '个人成长' },
  leisure: { az: 'Əyləncə və İstirahət', tr: 'Eğlence & Dinlenme', ru: 'Досуг и отдых', en: 'Fun & Leisure', es: 'Ocio y Diversión', fr: 'Loisirs et Détente', de: 'Freizeit & Spaß', it: 'Tempo Libero e Svago', ar: 'الترفيه والاستجمام', zh: '娱乐与休闲' },
  environment: { az: 'Ətraf Mühit', tr: 'Çevre & Ortam', ru: 'Окружение', en: 'Environment', es: 'Entorno', fr: 'Environnement', de: 'Umgebung', it: 'Ambiente', ar: 'البيئة', zh: '环境' },
  routine: { az: 'Gündəlik Rejim', tr: 'Rutin', ru: 'Рутина', en: 'Routine', es: 'Rutina', fr: 'Routine', de: 'Routine', it: 'Routine', ar: 'الروتين', zh: '日常作息' },
  focus: { az: 'Fokus və Diqqət', tr: 'Odaklanma', ru: 'Фокус', en: 'Focus', es: 'Enfoque', fr: 'Focus', de: 'Fokus', it: 'Focus', ar: 'التركيز', zh: '专注' },
  wellness: { az: 'Yuxu və İstirahət', tr: 'Yaşam & İyilik', ru: 'Благополучие', en: 'Wellness', es: 'Bienestar', fr: 'Bien-être', de: 'Wohlbefinden', it: 'Benessere', ar: 'العافية', zh: '身心健康' },
};

const getCategoryName = (catConfig, lang) => {
  const langKey = lang ? lang.split('-')[0].toLowerCase() : 'en';
  return catConfig[langKey] || catConfig['en'] || catConfig.defaultTitle;
};

const WEEKDAY_LOCALIZATION = {
  az: ['B.e', 'Ç.a', 'Çəş', 'C.a', 'Cüm', 'Şən', 'Bazar'],
  tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  es: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  fr: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  it: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
  ar: ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'],
  zh: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
};

const getWeekdayLabels = (lang) => {
  const langKey = lang ? lang.split('-')[0].toLowerCase() : 'en';
  return WEEKDAY_LOCALIZATION[langKey] || WEEKDAY_LOCALIZATION.en;
};

const MONTH_LOCALIZATION = {
  az: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'],
  tr: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  fr: ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'],
  de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  it: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
};

const getMonthNames = (lang) => {
  const langKey = lang ? lang.split('-')[0].toLowerCase() : 'en';
  return MONTH_LOCALIZATION[langKey] || MONTH_LOCALIZATION.en;
};

const GRID_TEXTS = {
  title: {
    az: 'Həyat Balansı Xəritəsi',
    tr: 'Yaşam Dengesi Haritası',
    ru: 'Карта баланса жизни',
    en: 'Life Balance Map',
    es: 'Mapa de Equilibrio de Vida',
    fr: 'Carte de l\'Équilibre de Vie',
    de: 'Lebensbalance-Karte',
    it: 'Mappa dell\'Equilibrio di Vita',
    ar: 'خريطة توازن الحياة',
    zh: '生活平衡图',
  },
  subtitle: {
    az: (n) => `${n} sahəli həyat matrisiniz`,
    tr: (n) => `${n} alanlı yaşam matrisiniz`,
    ru: (n) => `Ваша матрица жизни из ${n} сфер`,
    en: (n) => `Your ${n}-area life matrix`,
    es: (n) => `Tu matriz de vida de ${n} áreas`,
    fr: (n) => `Votre matrice de vie en ${n} domaines`,
    de: (n) => `Deine ${n}-Bereiche-Lebensmatrix`,
    it: (n) => `La tua matrice di vita in ${n} aree`,
    ar: (n) => `مصفوفة حياتك المكونة من ${n} مجالات`,
    zh: (n) => `您的 ${n} 个领域生活矩阵`,
  },
  legend_improved: {
    az: 'Yaxşılaşıb',
    tr: 'Gelişti',
    ru: 'Улучшилось',
    en: 'Improved',
    es: 'Mejoró',
    fr: 'Amélioré',
    de: 'Verbessert',
    it: 'Migliorato',
    ar: 'تحسن',
    zh: '有所提升',
  },
  legend_declined: {
    az: 'Aşağı düşüb',
    tr: 'Düştü',
    ru: 'Снизилось',
    en: 'Declined',
    es: 'Disminuyó',
    fr: 'En baisse',
    de: 'Verschlechtert',
    it: 'Calato',
    ar: 'انخفض',
    zh: '有所下降',
  },
  legend_no_change: {
    az: 'Dəyişiklik yoxdur',
    tr: 'Değişim yok',
    ru: 'Без изменений',
    en: 'No Change',
    es: 'Sin cambios',
    fr: 'Aucun changement',
    de: 'Keine Änderung',
    it: 'Nessun cambiamento',
    ar: 'لا تغيير',
    zh: '持平',
  },
  weekly_trend: {
    az: 'İnkişaf Trendi və Tarixçə',
    tr: 'Gelişim Trendi ve Geçmiş',
    ru: 'Тренд развития и история',
    en: 'Growth Trend & History',
    es: 'Tendencia de Crecimiento e Historial',
    fr: 'Tendance de Croissance & Historique',
    de: 'Wachstumstrend & Verlauf',
    it: 'Tendenza di Crescita e Cronologia',
    ar: 'اتجاه النمو والتاريخ',
    zh: '成长趋势与历史',
  },
  climbing_sub: {
    az: 'Dövr üzrə addım-addım inkişaf dinamikanız',
    tr: 'Dönem içi adım adım gelişim haritanız',
    ru: 'Динамика развития по периодам',
    en: 'Your step-by-step progress over time',
    es: 'Tu progreso paso a paso en el tiempo',
    fr: 'Votre progression étape par étape au fil du temps',
    de: 'Dein Schritt-für-Schritt-Fortschritt im Laufe der Zeit',
    it: 'I tuoi progressi passo dopo passo nel tempo',
    ar: 'تقدمك خطوة بخطوة عبر الزمن',
    zh: '随着时间的推移逐步取得进步',
  },
  rise: {
    az: 'Yüksəliş',
    tr: 'Yükseliş',
    ru: 'Рост',
    en: 'Growth',
    es: 'Crecimiento',
    fr: 'Croissance',
    de: 'Wachstum',
    it: 'Crescita',
    ar: 'نمو',
    zh: '增长',
  },
  decline: {
    az: 'Düşüş',
    tr: 'Düşüş',
    ru: 'Спад',
    en: 'Decline',
    es: 'Caída',
    fr: 'Baisse',
    de: 'Rückgang',
    it: 'Calo',
    ar: 'تراجع',
    zh: '下降',
  },
  mastered: {
    az: '🏆 Usta',
    tr: '🏆 Usta',
    ru: '🏆 Освоено',
    en: '🏆 Mastered',
    es: '🏆 Dominado',
    fr: '🏆 Maîtrisé',
    de: '🏆 Meisterhaft',
    it: '🏆 Padroneggiato',
    ar: '🏆 متمكن',
    zh: '🏆 精通',
  },
  active: {
    az: '⚡ Aktiv',
    tr: '⚡ Aktif',
    ru: '⚡ Активно',
    en: '⚡ Active',
    es: '⚡ Activo',
    fr: '⚡ Actif',
    de: '⚡ Aktiv',
    it: '⚡ Attivo',
    ar: '⚡ نشط',
    zh: '⚡ 活跃',
  },
  needs_focus: {
    az: '🌱 Diqqət Tələb Edir',
    tr: '🌱 Odaklanma Gerektiriyor',
    ru: '🌱 Требует внимания',
    en: '🌱 Needs Focus',
    es: '🌱 Requiere Atención',
    fr: '🌱 Demande de l\'Attention',
    de: '🌱 Braucht Fokus',
    it: '🌱 Richiede Attenzione',
    ar: '🌱 يحتاج تركيز',
    zh: '🌱 需要关注',
  },
  overall_progress: {
    az: 'Ümumi Tərəqqi',
    tr: 'Genel İlerleme',
    ru: 'Общий прогресс',
    en: 'Overall Progress',
    es: 'Progreso General',
    fr: 'Progrès Global',
    de: 'Gesamtfortschritt',
    it: 'Progresso Generale',
    ar: 'التقدم العام',
    zh: '整体进度',
  },
  active_goals: {
    az: 'Aktiv Hədəflər',
    tr: 'Aktif Hedefler',
    ru: 'Активные цели',
    en: 'Active Goals',
    es: 'Objetivos Activos',
    fr: 'Objectifs Actifs',
    de: 'Aktive Ziele',
    it: 'Obiettivi Attivi',
    ar: 'الأهداف النشطة',
    zh: '活跃目标',
  },
  active_habits: {
    az: 'Aktiv Vərdişlər',
    tr: 'Aktif Alışkanlıklar',
    ru: 'Активные привычки',
    en: 'Active Habits',
    es: 'Hábitos Activos',
    fr: 'Habitudes Actives',
    de: 'Aktive Gewohnheiten',
    it: 'Abitudini Attive',
    ar: 'العادات النشطة',
    zh: '习惯中',
  },
  got_it: {
    az: 'Aydındır',
    tr: 'Anlaşıldı',
    ru: 'Понятно',
    en: 'Got It',
    es: 'Entendido',
    fr: 'Compris',
    de: 'Verstanden',
    it: 'Ho capito',
    ar: 'حسناً',
    zh: '知道了',
  },
  no_activity: {
    az: 'Aktivlik yoxdur',
    tr: 'Aktivite yok',
    ru: 'Нет активности',
    en: 'No Activity',
    es: 'Sin actividad',
    fr: 'Pas d\'activité',
    de: 'Keine Aktivität',
    it: 'Nessuna attività',
    ar: 'لا يوجد نشاط',
    zh: '无动态',
  },
  select_history_scope: {
    az: 'Tarix və Dövr Seçin',
    tr: 'Tarih ve Dönem Seçin',
    ru: 'Выберите период и историю',
    en: 'Select History Scope',
    es: 'Seleccionar Período de Historial',
    fr: 'Sélectionner la Période',
    de: 'Verlaufszeitraum auswählen',
    it: 'Seleziona Periodo Cronologia',
    ar: 'حدد نطاق السجل',
    zh: '选择历史范围',
  },
  select_year: {
    az: 'İl Seçin',
    tr: 'Yıl Seçin',
    ru: 'Выберите год',
    en: 'Select Year',
    es: 'Seleccionar Año',
    fr: 'Sélectionner l\'Année',
    de: 'Jahr auswählen',
    it: 'Seleziona Anno',
    ar: 'اختر السنة',
    zh: '选择年份',
  },
  select_month: {
    az: 'Ay Seçin (Aylıq Biri)',
    tr: 'Ay Seçin (Aylık Görünüm)',
    ru: 'Выберите месяц',
    en: 'Select Month',
    es: 'Seleccionar Mes',
    fr: 'Sélectionner le Mois',
    de: 'Monat auswählen',
    it: 'Seleziona Mese',
    ar: 'اختر الشهر',
    zh: '选择月份',
  },
  yearly_overview: {
    az: (y) => `🗓️ ${y}-ci İlin İcmalı`,
    tr: (y) => `🗓️ ${y} Yılı Genel Bakış`,
    ru: (y) => `🗓️ Обзор ${y} года`,
    en: (y) => `🗓️ ${y} Yearly Overview`,
    es: (y) => `🗓️ Resumen Anual ${y}`,
    fr: (y) => `🗓️ Aperçu Annuel ${y}`,
    de: (y) => `🗓️ Jahresübersicht ${y}`,
    it: (y) => `🗓️ Panoramica Annuale ${y}`,
    ar: (y) => `🗓️ نظرة عامة لعام ${y}`,
    zh: (y) => `🗓️ ${y} 年度概览`,
  },
  period_7d: {
    az: '7g',
    tr: '7g',
    ru: '7д',
    en: '7d',
    es: '7d',
    fr: '7j',
    de: '7t',
    it: '7g',
    ar: '7أ',
    zh: '7天',
  },
  period_1m: {
    az: '1a',
    tr: '1a',
    ru: '1м',
    en: '1m',
    es: '1m',
    fr: '1m',
    de: '1m',
    it: '1m',
    ar: '1ش',
    zh: '1月',
  },
  period_1y: {
    az: '1i',
    tr: '1y',
    ru: '1г',
    en: '1y',
    es: '1a',
    fr: '1a',
    de: '1j',
    it: '1a',
    ar: '1س',
    zh: '1年',
  },
};

const getGridText = (key, lang, param) => {
  const langKey = lang ? lang.split('-')[0].toLowerCase() : 'en';
  const dict = GRID_TEXTS[key];
  if (!dict) return '';
  const val = dict[langKey] || dict['en'];
  if (typeof val === 'function') {
    return val(param);
  }
  return val;
};

const mapHabitCategoryToGridKey = (catNameInput, habitTitleInput) => {
  const catStr = typeof catNameInput === 'string' ? catNameInput : catNameInput?.name || catNameInput?.title || '';
  const titleStr = typeof habitTitleInput === 'string' ? habitTitleInput : habitTitleInput?.name || habitTitleInput?.title || '';
  const str = `${catStr} ${titleStr}`.toLowerCase();

  if (str.includes('mind') || str.includes('meditat') || str.includes('mental') || str.includes('gratitude') || str.includes('breath') || str.includes('calm') || str.includes('dünya') || str.includes('zək') || str.includes('ruhi') || str.includes('мысл') || str.includes('дух') || str.includes('zihin')) {
    return 'mindset';
  }
  if (str.includes('nutrition') || str.includes('diet') || str.includes('water') || str.includes('health') || str.includes('fitness') || str.includes('sport') || str.includes('workout') || str.includes('exercise') || str.includes('gym') || str.includes('sağlam') || str.includes('idman') || str.includes('здоров') || str.includes('спорт')) {
    return 'health';
  }
  if (str.includes('career') || str.includes('work') || str.includes('job') || str.includes('business') || str.includes('financ') || str.includes('money') || str.includes('save') || str.includes('karyera') || str.includes('iş') || str.includes('maliyyə') || str.includes('работа') || str.includes('карьер')) {
    return 'career';
  }
  if (str.includes('social') || str.includes('friend') || str.includes('family') || str.includes('people') || str.includes('connect') || str.includes('relat') || str.includes('sosial') || str.includes('münasibət') || str.includes('общени') || str.includes('семь')) {
    return 'social';
  }
  if (str.includes('growth') || str.includes('self') || str.includes('skill') || str.includes('personal') || str.includes('şəxsi') || str.includes('inkişaf') || str.includes('развит') || str.includes('рост')) {
    return 'growth';
  }
  if (str.includes('fun') || str.includes('leisure') || str.includes('game') || str.includes('hobby') || str.includes('relax') || str.includes('əyləncə') || str.includes('istirahət') || str.includes('досуг') || str.includes('отдых')) {
    return 'leisure';
  }
  if (str.includes('environ') || str.includes('clean') || str.includes('nature') || str.includes('space') || str.includes('ətraf') || str.includes('окруж')) {
    return 'environment';
  }
  if (str.includes('learn') || str.includes('book') || str.includes('read') || str.includes('educat') || str.includes('study') || str.includes('təhsil') || str.includes('oxu') || str.includes('обучен') || str.includes('книг')) {
    return 'learning';
  }
  if (str.includes('focus') || str.includes('diqqət') || str.includes('fokus') || str.includes('фокус')) {
    return 'focus';
  }

  const directKey = (catStr || titleStr).trim().toLowerCase();
  if (['health', 'mindset', 'career', 'social', 'growth', 'leisure', 'environment', 'learning', 'focus', 'finance', 'wellness', 'routine'].includes(directKey)) {
    return directKey;
  }

  return 'mindset';
};

const StaircasePersonUp = () => (
  <View style={{ width: 34, height: 34, justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>
    <Text style={{ fontSize: 16, position: 'absolute', top: -4, left: 8, transform: [{ scaleX: -1 }] }}>
      🚶‍♂️
    </Text>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 14 }}>
      <View style={{ width: 6, height: 5, backgroundColor: '#10B981', borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
      <View style={{ width: 6, height: 9, backgroundColor: '#10B981', borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
      <View style={{ width: 6, height: 14, backgroundColor: '#10B981', borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
    </View>
  </View>
);

const StaircasePersonDown = () => (
  <View style={{ width: 34, height: 34, justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>
    <Text style={{ fontSize: 16, position: 'absolute', top: -4, left: 8, transform: [{ scaleX: -1 }] }}>
      🚶‍♂️
    </Text>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 14 }}>
      <View style={{ width: 6, height: 14, backgroundColor: '#F43F5E', borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
      <View style={{ width: 6, height: 9, backgroundColor: '#F43F5E', borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
      <View style={{ width: 6, height: 5, backgroundColor: '#F43F5E', borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
    </View>
  </View>
);

const getInitialCategoryDataMap = () => {
  try {
    const catMap = {};
    const deletedIdsRaw = storage.getString('user_deleted_habit_ids');
    const deletedIds = new Set(deletedIdsRaw ? JSON.parse(deletedIdsRaw) : []);

    const savedGoals = storage.getString('user_my_goals_ai_quests');
    if (savedGoals) {
      const goals = JSON.parse(savedGoals);
      if (Array.isArray(goals)) {
        goals.forEach((goal) => {
          const catKey = mapHabitCategoryToGridKey(goal.category, goal.title);
          if (!catMap[catKey]) {
            catMap[catKey] = { totalItems: 0, completedItems: 0, goalsCount: 0, habitsCount: 0 };
          }
          catMap[catKey].goalsCount += 1;
          const gTasks = goal.tasks || [];
          catMap[catKey].totalItems += gTasks.length;
          catMap[catKey].completedItems += gTasks.filter((t) => t.completed).length;
        });
      }
    }

    const localCachedHabitsStr = storage.getString('home.cached.todaysUserHabit');
    if (localCachedHabitsStr) {
      const localCachedHabits = JSON.parse(localCachedHabitsStr);
      if (Array.isArray(localCachedHabits)) {
        localCachedHabits.forEach((habit) => {
          const hId = String(habit.id || habit.userHabitId || habit.userHabitRecordId || habit.habitId || '');
          if (hId && deletedIds.has(hId)) return;

          const catName = habit.categoryName || habit.category?.name || (typeof habit.category === 'string' ? habit.category : '') || habit.userHabit?.category?.name || habit.userHabit?.categoryName || habit.habitCategoryName || habit.categoryDetails?.name || '';
          const titleName = habit.title || habit.name || habit.habitTitle || habit.userHabitTitle || habit.userHabit?.title || habit.userHabit?.name || habit.habit?.title || habit.habit?.name || '';
          const catKey = mapHabitCategoryToGridKey(catName, titleName);
          if (!catMap[catKey]) {
            catMap[catKey] = { totalItems: 0, completedItems: 0, goalsCount: 0, habitsCount: 0 };
          }
          catMap[catKey].habitsCount += 1;
          catMap[catKey].totalItems += 1;
          const statusStr = String(habit.status || habit.habitStatus || habit.state || '').toLowerCase();
          if (statusStr === 'completed' || statusStr === 'done' || habit.isCompleted === true || habit.completed === true) {
            catMap[catKey].completedItems += 1;
          }
        });
      }
    }
    return catMap;
  } catch (e) {
    return {};
  }
};

const LifeBalanceGrid = ({ colors, isDark, t: tProp, searchQuery = '' }) => {
  const { t: tHook, i18n } = useTranslation();
  const t = tProp || tHook;
  const activeLang = i18n?.language || 'en';

  const [categoryDataMap, setCategoryDataMap] = useState(getInitialCategoryDataMap);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(6);
  const [selectedPeriod, setSelectedPeriod] = useState('7d'); // '7d' | '1m' | '1y'
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0..11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [activeLang])
  );

  useEffect(() => {
    loadData();
  }, [activeLang]);

  const loadData = async () => {
    try {
      const token = storage.getString('accessToken');
      const catMap = {};

      const savedGoals = storage.getString('user_my_goals_ai_quests');
      if (savedGoals) {
        const goals = JSON.parse(savedGoals);
        if (Array.isArray(goals)) {
          goals.forEach((goal) => {
            const catKey = mapHabitCategoryToGridKey(goal.category, goal.title);
            if (!catMap[catKey]) {
              catMap[catKey] = { totalItems: 0, completedItems: 0, goalsCount: 0, habitsCount: 0 };
            }
            catMap[catKey].goalsCount += 1;
            const gTasks = goal.tasks || [];
            catMap[catKey].totalItems += gTasks.length;
            catMap[catKey].completedItems += gTasks.filter((t) => t.completed).length;
          });
        }
      }

      const habitMap = new Map();
      const localCachedHabitsStr = storage.getString('home.cached.todaysUserHabit');
      if (localCachedHabitsStr) {
        try {
          const localCachedHabits = JSON.parse(localCachedHabitsStr);
          if (Array.isArray(localCachedHabits)) {
            localCachedHabits.forEach((h) => {
              const hId = h.id || h.userHabitId || h.userHabitRecordId || h.habitId;
              if (hId) habitMap.set(String(hId), h);
            });
          }
        } catch (e) { }
      }

      if (token) {
        try {
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const day = String(today.getDate()).padStart(2, '0');
          const todayDateStr = `${year}-${month}-${day}`;

          const [todayRes, allHabitsRes] = await Promise.all([
            getTodaysUserHabitFetch(token, todayDateStr, 0, 100).catch(() => null),
            getUserHabitFetch(token, 0, 100).catch(() => null),
          ]);

          const todayList = todayRes && todayRes.data ? (Array.isArray(todayRes.data) ? todayRes.data : todayRes.data.items || []) : [];
          const allList = allHabitsRes && allHabitsRes.data ? (Array.isArray(allHabitsRes.data) ? allHabitsRes.data : allHabitsRes.data.items || []) : [];

          allList.forEach((h) => {
            const hId = h.id || h.userHabitId || h.userHabitRecordId;
            if (hId) {
              const existing = habitMap.get(String(hId)) || {};
              habitMap.set(String(hId), { ...existing, ...h });
            }
          });

          todayList.forEach((h) => {
            const hId = h.id || h.userHabitId || h.userHabitRecordId;
            const key = hId ? String(hId) : String(h.habitId || Math.random());
            const existing = habitMap.get(key) || {};
            habitMap.set(key, { ...existing, ...h });
          });
        } catch (hErr) {
          console.log('Error fetching habits for LifeBalanceGrid:', hErr);
        }
      }

      const deletedIdsRaw = storage.getString('user_deleted_habit_ids');
      const deletedIds = new Set(deletedIdsRaw ? JSON.parse(deletedIdsRaw) : []);

      habitMap.forEach((habit, key) => {
        const hId = String(habit.id || habit.userHabitId || habit.userHabitRecordId || habit.habitId || key);
        const altId = String(habit.userHabitId || habit.habitId || '');
        if (deletedIds.has(hId) || (altId && deletedIds.has(altId))) {
          return;
        }

        const catName = habit.categoryName || habit.category?.name || (typeof habit.category === 'string' ? habit.category : '') || habit.userHabit?.category?.name || habit.userHabit?.categoryName || habit.habitCategoryName || habit.categoryDetails?.name || '';
        const titleName = habit.title || habit.name || habit.habitTitle || habit.userHabitTitle || habit.userHabit?.title || habit.userHabit?.name || habit.habit?.title || habit.habit?.name || '';

        const catKey = mapHabitCategoryToGridKey(catName, titleName);
        if (!catMap[catKey]) {
          catMap[catKey] = { totalItems: 0, completedItems: 0, goalsCount: 0, habitsCount: 0 };
        }
        catMap[catKey].habitsCount += 1;
        catMap[catKey].totalItems += 1;

        const statusStr = String(habit.status || habit.habitStatus || habit.state || '').toLowerCase();
        const isDone = statusStr === 'completed' || statusStr === 'done' || habit.isCompleted === true || habit.completed === true;

        if (isDone) {
          catMap[catKey].completedItems += 1;
        }
      });

      const activeKeys = Object.keys(catMap).filter((k) => catMap[k] && catMap[k].totalItems > 0);
      setActiveAreaCount(activeKeys.length);
      setCategoryDataMap(catMap);
    } catch (e) {
      console.log('Error loading balance data:', e);
    }
  };

  const handleRebalance = async () => {
    loadData();
  };

  let activeCatConfigs = RADAR_CATEGORY_CONFIG.filter((catConfig) => {
    const userStats = categoryDataMap[catConfig.key];
    return userStats && userStats.totalItems > 0;
  });

  const N = activeCatConfigs.length;

  const radarItems = activeCatConfigs.map((catConfig, idx) => {
    const angleDeg = N === 1 ? 0 : Math.round((idx * 360) / N);
    const userStats = categoryDataMap[catConfig.key];
    const name = getCategoryName(catConfig, activeLang);

    let progress = 0;
    let goalsCount = 0;
    let habitsCount = 0;
    let trend = 0;

    if (userStats && userStats.totalItems > 0) {
      progress = Math.round((userStats.completedItems / userStats.totalItems) * 100);
      goalsCount = userStats.goalsCount || 0;
      habitsCount = userStats.habitsCount || 0;
      trend = userStats.completedItems > 0 ? Math.round((userStats.completedItems / userStats.totalItems) * 100) : 0;
    }

    const isUp = trend >= 0;

    return {
      ...catConfig,
      angleDeg,
      name,
      progress,
      trend,
      isUp,
      goalsCount,
      habitsCount,
    };
  });

  const overallProgress = Math.round(radarItems.reduce((sum, item) => sum + item.progress, 0) / radarItems.length);

  // Real 7-day completion tracking for current week
  const todayObj = new Date();
  const currentDayOfWeek = (todayObj.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const dayLabels = getWeekdayLabels(activeLang);

  const weeklyCompletionMapStr = storage.getString('user.weekly.completion_map');
  let weeklyMap = {};
  if (weeklyCompletionMapStr) {
    try { weeklyMap = JSON.parse(weeklyCompletionMapStr); } catch (e) { }
  }

  const todayDateStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
  weeklyMap[todayDateStr] = overallProgress;
  try { storage.set('user.weekly.completion_map', JSON.stringify(weeklyMap)); } catch (e) { }

  const mondayDate = new Date(todayObj);
  mondayDate.setDate(todayObj.getDate() - currentDayOfWeek);

  // Multi-period completion tracking ('7d' | '1m' | '1y')
  const activeMonthNames = getMonthNames(activeLang);

  let periodData = [];

  if (selectedPeriod === '1m') {
    // Monthly View: 6 checkpoints across selected month
    const checkpoints = [1, 6, 12, 18, 24, 30];
    periodData = checkpoints.map((dayNum, idx) => {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      let val = 0;
      if (weeklyMap[dateStr] != null) {
        val = Number(weeklyMap[dateStr]) || 0;
      } else if (selectedYear === todayObj.getFullYear() && selectedMonth === todayObj.getMonth() && dayNum <= todayObj.getDate()) {
        val = Math.max(0, overallProgress - (todayObj.getDate() - dayNum) * 2);
      } else {
        val = 0;
      }
      return {
        dayIndex: idx,
        dayName: `${dayNum} ${activeMonthNames[selectedMonth]}`,
        dateStr,
        val,
      };
    });
  } else if (selectedPeriod === '1y') {
    // Yearly View: 12 months (Jan - Dec)
    periodData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((mIdx) => {
      let val = 0;
      if (selectedYear === todayObj.getFullYear() && mIdx === todayObj.getMonth()) {
        val = overallProgress;
      } else if (selectedYear < todayObj.getFullYear() || (selectedYear === todayObj.getFullYear() && mIdx < todayObj.getMonth())) {
        const monthKeys = Object.keys(weeklyMap).filter((k) => k.startsWith(`${selectedYear}-${String(mIdx + 1).padStart(2, '0')}`));
        if (monthKeys.length > 0) {
          const sum = monthKeys.reduce((acc, k) => acc + (Number(weeklyMap[k]) || 0), 0);
          val = Math.round(sum / monthKeys.length);
        } else {
          val = Math.max(0, overallProgress - (todayObj.getMonth() - mIdx) * 5);
        }
      } else {
        val = 0;
      }
      return {
        dayIndex: mIdx,
        dayName: activeMonthNames[mIdx],
        val,
      };
    });
  } else {
    // Weekly View ('7d'): 7 days of current week
    periodData = [0, 1, 2, 3, 4, 5, 6].map((idx) => {
      const dDate = new Date(mondayDate);
      dDate.setDate(mondayDate.getDate() + idx);
      const dateStr = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}-${String(dDate.getDate()).padStart(2, '0')}`;

      let val = 0;
      if (idx === currentDayOfWeek) {
        val = overallProgress;
      } else if (weeklyMap[dateStr] != null) {
        val = Number(weeklyMap[dateStr]) || 0;
      } else {
        val = 0;
      }

      return {
        dayIndex: idx,
        dayName: dayLabels[idx] || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx],
        dateStr,
        val,
      };
    });
  }

  const weeklyData = periodData;

  weeklyData.forEach((d, idx) => {
    const prevVal = idx === 0 ? 0 : weeklyData[idx - 1].val;
    const diff = d.val - prevVal;
    d.diff = diff;
    d.isUp = diff >= 0;
    d.hasActivity = d.val > 0;
    d.diffText = d.hasActivity ? (diff >= 0 ? `+${diff}%` : `${diff}%`) : '–';
  });

  const activeSelectedDay = weeklyData[selectedDayIndex] || weeklyData[weeklyData.length - 1] || { val: 0, dayName: '', diffText: '–', isUp: true, hasActivity: false };

  const MAP_SIZE = 320;
  const CENTER = MAP_SIZE / 2; // 160
  const RADAR_RADIUS = 76;

  return (
    <View style={{ gap: 16 }}>
      {/* Card Container: Life Balance Wheel Radar Map */}
      <View
        style={{
          backgroundColor: isDark ? '#141E30' : '#FFFFFF',
          borderRadius: 28,
          paddingVertical: 18,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.4 : 0.08,
          shadowRadius: 14,
          elevation: 6,
        }}
      >
        {/* Top Card Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, paddingHorizontal: 4 }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FontAwesomeIcon icon={faPuzzlePiece} size={18} color="#10B981" />
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'RedditSans-Bold',
                  color: colors.text,
                }}
              >
                {t('grid.title', getGridText('title', activeLang))}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'RedditSans-Regular',
                color: colors.textSecondary,
                marginTop: 3,
                marginLeft: 40,
              }}
            >
              {t('grid.subtitle', getGridText('subtitle', activeLang, N))}
            </Text>
          </View>

          {/* Sync / Refresh Button */}
          <TouchableOpacity
            onPress={handleRebalance}
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
            }}
          >
            <FontAwesomeIcon icon={faSyncAlt} size={16} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {/* Circular Radar Map Canvas */}
        <View style={{ width: '100%', height: MAP_SIZE, alignItems: 'center', justifyContent: 'center', marginVertical: 2 }}>
          <View style={{ position: 'relative', width: MAP_SIZE, height: MAP_SIZE }}>
            {/* SVG Layer: Spokes, Dashed Circle, Progress Arcs & Center Standing Person */}
            <Svg width={MAP_SIZE} height={MAP_SIZE}>
              <G>
                {/* Outer Connecting Dashed Circle */}
                <Circle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADAR_RADIUS}
                  stroke={isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0'}
                  strokeWidth={1.2}
                  strokeDasharray="2 3"
                  fill="none"
                />

                {/* Center Backdrop Ring */}
                <Circle
                  cx={CENTER}
                  cy={CENTER}
                  r={36}
                  stroke={isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9'}
                  strokeWidth={5}
                  fill="none"
                />

                {/* Spokes Lines & Colored Segment Progress Arcs */}
                {radarItems.map((item) => {
                  const radPt = polarToCartesian(CENTER, CENTER, RADAR_RADIUS, item.angleDeg);
                  const innerPt = polarToCartesian(CENTER, CENTER, 38, item.angleDeg);

                  const arcSpan = 38;
                  const startAng = item.angleDeg - arcSpan / 2;
                  const endAng = item.angleDeg + arcSpan / 2;
                  const arcPath = describeArc(CENTER, CENTER, 36, startAng, endAng);

                  return (
                    <G key={`spoke-${item.key}`}>
                      {/* Radial Spoke Line */}
                      <Line
                        x1={innerPt.x}
                        y1={innerPt.y}
                        x2={radPt.x}
                        y2={radPt.y}
                        stroke={isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1'}
                        strokeWidth={1.2}
                      />

                      {/* Colored Segment Progress Arc */}
                      <Path
                        d={arcPath}
                        stroke={item.color}
                        strokeWidth={4.5}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </G>
                  );
                })}

                {/* Center Standing Person Pictogram (Exact match to User Image) */}
                <G fill={isDark ? '#FFFFFF' : '#000000'}>
                  {/* Head Circle */}
                  <Circle cx={CENTER} cy={CENTER - 20} r={6.5} fill={isDark ? '#FFFFFF' : '#000000'} stroke="none" />

                  {/* Torso & Shoulders */}
                  <Rect
                    x={CENTER - 7}
                    y={CENTER - 11}
                    width={14}
                    height={18}
                    rx={3.5}
                    ry={3.5}
                    fill={isDark ? '#FFFFFF' : '#000000'}
                    stroke="none"
                  />

                  {/* Left Arm */}
                  <Rect
                    x={CENTER - 11.5}
                    y={CENTER - 10}
                    width={3.5}
                    height={17}
                    rx={1.75}
                    ry={1.75}
                    fill={isDark ? '#FFFFFF' : '#000000'}
                    stroke="none"
                  />

                  {/* Right Arm */}
                  <Rect
                    x={CENTER + 8.0}
                    y={CENTER - 10}
                    width={3.5}
                    height={17}
                    rx={1.75}
                    ry={1.75}
                    fill={isDark ? '#FFFFFF' : '#000000'}
                    stroke="none"
                  />

                  {/* Left Leg */}
                  <Rect
                    x={CENTER - 6.2}
                    y={CENTER + 6}
                    width={5.2}
                    height={20}
                    rx={2.6}
                    ry={2.6}
                    fill={isDark ? '#FFFFFF' : '#000000'}
                    stroke="none"
                  />

                  {/* Right Leg */}
                  <Rect
                    x={CENTER + 1.0}
                    y={CENTER + 6}
                    width={5.2}
                    height={20}
                    rx={2.6}
                    ry={2.6}
                    fill={isDark ? '#FFFFFF' : '#000000'}
                    stroke="none"
                  />
                </G>
              </G>
            </Svg>

            {/* 8 Radar Category Nodes with Bounded Non-Overlapping Titles, Icons, %, and Trend indicators */}
            {radarItems.map((item) => {
              const nodePos = polarToCartesian(CENTER, CENTER, RADAR_RADIUS, item.angleDeg);

              const normalized = ((item.angleDeg % 360) + 360) % 360;
              let textBlockStyle = {};
              let alignText = 'center';

              if (normalized < 25 || normalized >= 335) {
                textBlockStyle = { position: 'absolute', top: 12, left: CENTER - 60, width: 120, alignItems: 'center' };
                alignText = 'center';
              } else if (normalized >= 155 && normalized <= 205) {
                textBlockStyle = { position: 'absolute', top: 257, left: CENTER - 60, width: 120, alignItems: 'center' };
                alignText = 'center';
              } else if (normalized >= 25 && normalized < 155) {
                let topPos = nodePos.y - 18;
                if (normalized < 70) topPos = 88;
                else if (normalized > 110) topPos = 196;
                textBlockStyle = { position: 'absolute', top: topPos, left: nodePos.x + 18, width: 85, alignItems: 'flex-start' };
                alignText = 'left';
              } else {
                let topPos = nodePos.y - 18;
                if (normalized > 290) topPos = 88;
                else if (normalized < 250) topPos = 196;
                textBlockStyle = { position: 'absolute', top: topPos, right: MAP_SIZE - nodePos.x + 18, width: 85, alignItems: 'flex-end' };
                alignText = 'right';
              }

              const q = searchQuery ? searchQuery.trim().toLowerCase() : '';
              const isMatch = !q || item.name.toLowerCase().includes(q) || item.key.toLowerCase().includes(q);

              return (
                <View key={`node-group-${item.key}`} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: isMatch ? 1 : 0.2 }} pointerEvents="box-none">
                  {/* Bounded Compact Text Block (Title + Percentage + Trend) */}
                  <View style={textBlockStyle} pointerEvents="none">
                    <Text
                      style={{
                        fontSize: 10.5,
                        fontFamily: 'RedditSans-Bold',
                        color: item.color,
                        textAlign: alignText,
                      }}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12.5,
                        fontFamily: 'RedditSans-Bold',
                        color: colors.text,
                        textAlign: alignText,
                        marginTop: 1,
                      }}
                    >
                      {item.progress}%
                    </Text>
                    <Text
                      style={{
                        fontSize: 9.5,
                        fontFamily: 'RedditSans-Bold',
                        color: item.isUp ? '#10B981' : '#F43F5E',
                        marginTop: 1,
                        textAlign: alignText,
                      }}
                    >
                      {item.isUp ? `▲ ${item.trend}%` : `▼ ${Math.abs(item.trend)}%`}
                    </Text>
                  </View>

                  {/* Interactive Node Icon Button with Category Emoji */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedDirection(item)}
                    style={{
                      position: 'absolute',
                      top: nodePos.y - 18,
                      left: nodePos.x - 18,
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: item.color,
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.25,
                      shadowRadius: 5,
                      elevation: 5,
                      borderWidth: 2.5,
                      borderColor: item.color,
                    }}
                  >
                    <Text style={{ fontSize: 17 }}>{item.emoji}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Legend Bar at Bottom of Card */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6',
            borderRadius: 16,
            paddingVertical: 7,
            paddingHorizontal: 16,
            gap: 18,
            alignSelf: 'center',
            marginTop: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={{ color: '#10B981', fontSize: 11, fontFamily: 'RedditSans-Bold' }}>▲</Text>
            <Text style={{ color: '#10B981', fontSize: 11, fontFamily: 'RedditSans-Bold' }}>
              {t('grid.legend_improved', getGridText('legend_improved', activeLang))}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={{ color: '#F43F5E', fontSize: 11, fontFamily: 'RedditSans-Bold' }}>▼</Text>
            <Text style={{ color: '#F43F5E', fontSize: 11, fontFamily: 'RedditSans-Bold' }}>
              {t('grid.legend_declined', getGridText('legend_declined', activeLang))}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: 'RedditSans-Bold' }}>–</Text>
            <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: 'RedditSans-Bold' }}>
              {t('grid.legend_no_change', getGridText('legend_no_change', activeLang))}
            </Text>
          </View>
        </View>
      </View>

      {/* Card Container: Modern Smooth Curved Line Chart (Matching User Reference) */}
      <View
        style={{
          backgroundColor: isDark ? '#141E30' : '#FFFFFF',
          borderRadius: 24,
          padding: 20,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        {/* Card Header & Time Filter Pills */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'RedditSans-Bold',
                color: colors.text,
              }}
            >
              {t('grid.weekly_trend', getGridText('weekly_trend', activeLang))}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: 'RedditSans-Regular', marginTop: 2 }}>
              {getGridText('climbing_sub', activeLang)}
            </Text>
          </View>

          {/* Time Range Pills (7d | 1m | 1y | 📅) */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F3F4F6',
              borderRadius: 12,
              padding: 3,
              gap: 2,
            }}
          >
            {[
              { id: '7d', label: getGridText('period_7d', activeLang) },
              { id: '1m', label: getGridText('period_1m', activeLang) },
              { id: '1y', label: getGridText('period_1y', activeLang) },
            ].map((p) => {
              const isActive = selectedPeriod === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedPeriod(p.id);
                    setSelectedDayIndex(0);
                  }}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 9,
                    backgroundColor: isActive ? colors.primary : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10.5,
                      fontFamily: 'RedditSans-Bold',
                      color: isActive ? '#FFFFFF' : colors.textSecondary,
                    }}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Calendar Icon Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowCalendarModal(true)}
              style={{
                paddingHorizontal: 7,
                paddingVertical: 4,
                borderRadius: 9,
                backgroundColor: showCalendarModal ? colors.primary : 'transparent',
              }}
            >
              <FontAwesomeIcon icon={faCalendarAlt} size={12} color={showCalendarModal ? '#FFFFFF' : colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Selected Day Stats Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Text
            style={{
              fontSize: 32,
              fontFamily: 'RedditSans-Bold',
              color: colors.text,
            }}
          >
            {activeSelectedDay.val}%
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: activeSelectedDay.hasActivity
                ? (activeSelectedDay.isUp ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)')
                : (isDark ? 'rgba(100, 116, 139, 0.2)' : 'rgba(156, 163, 175, 0.15)'),
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 14,
              gap: 5,
            }}
          >
            <Text
              style={{
                color: activeSelectedDay.hasActivity
                  ? (activeSelectedDay.isUp ? '#10B981' : '#F43F5E')
                  : (isDark ? '#94A3B8' : '#6B7280'),
                fontSize: 12,
                fontFamily: 'RedditSans-Bold',
              }}
            >
              {activeSelectedDay.hasActivity
                ? (activeSelectedDay.isUp ? `▲ ${activeSelectedDay.diffText}` : `▼ ${activeSelectedDay.diffText}`)
                : '–'}
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: activeSelectedDay.hasActivity
                  ? (activeSelectedDay.isUp ? '#10B981' : '#F43F5E')
                  : (isDark ? '#94A3B8' : '#6B7280'),
                fontFamily: 'RedditSans-Bold',
              }}
            >
              {activeSelectedDay.hasActivity
                ? (activeSelectedDay.isUp ? getGridText('rise', activeLang) : getGridText('decline', activeLang))
                : getGridText('no_activity', activeLang)}
            </Text>
          </View>
        </View>

        {/* SVG Curved Area Line Chart Container */}
        {(() => {
          const isManyItems = weeklyData.length > 8;
          const svgW = Math.min(310, SCREEN_WIDTH - 64);
          const svgH = 120;
          const padX = isManyItems ? 14 : 18;
          const padTop = 22;
          const padBottom = 16;
          const plotW = svgW - padX * 2;
          const plotH = svgH - padTop - padBottom;

          const pts = weeklyData.map((d, i) => {
            const x = padX + (i * plotW) / (weeklyData.length - 1);
            const y = (svgH - padBottom) - (Math.max(0, Math.min(100, d.val)) / 100) * plotH;
            return { x, y, ...d };
          });

          const curveLinePath = getSmoothSplinePath(pts);
          const areaFillPath = `${curveLinePath} L ${pts[pts.length - 1].x} ${svgH - padBottom} L ${pts[0].x} ${svgH - padBottom} Z`;
          const selectedPt = pts[selectedDayIndex] || pts[pts.length - 1];

          // Dynamic theme color based on selected day trend
          const chartThemeColor = selectedPt.hasActivity
            ? (selectedPt.isUp ? '#10B981' : '#F43F5E')
            : (isDark ? '#64748B' : '#6366F1');

          return (
            <View style={{ alignItems: 'center', marginTop: 4 }}>
              <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
                <Defs>
                  <SvgLinearGradient id="smoothAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={chartThemeColor} stopOpacity={isDark ? 0.35 : 0.22} />
                    <Stop offset="100%" stopColor={chartThemeColor} stopOpacity={0.0} />
                  </SvgLinearGradient>
                </Defs>

                {/* Horizontal Gridlines */}
                <Line
                  x1={padX}
                  y1={padTop}
                  x2={svgW - padX}
                  y2={padTop}
                  stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <Line
                  x1={padX}
                  y1={padTop + plotH / 2}
                  x2={svgW - padX}
                  y2={padTop + plotH / 2}
                  stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <Line
                  x1={padX}
                  y1={svgH - padBottom}
                  x2={svgW - padX}
                  y2={svgH - padBottom}
                  stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}
                  strokeWidth={1}
                />

                {/* Active Column Highlight behind selected day */}
                <Rect
                  x={selectedPt.x - (isManyItems ? 10 : 14)}
                  y={padTop - 4}
                  width={isManyItems ? 20 : 28}
                  height={plotH + 8}
                  rx={6}
                  fill={selectedPt.hasActivity ? (selectedPt.isUp ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)') : (isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(99, 102, 241, 0.08)')}
                />

                {/* Smooth Area Gradient Fill */}
                <Path d={areaFillPath} fill="url(#smoothAreaGrad)" />

                {/* Smooth Curved Spline Line Segments (Green for Rise, Red for Drop) */}
                {pts.map((pt, i) => {
                  if (i === pts.length - 1) return null;
                  const nextPt = pts[i + 1];
                  const isSegmentUp = nextPt.val >= pt.val;
                  const segColor = nextPt.hasActivity
                    ? (isSegmentUp ? '#10B981' : '#F43F5E')
                    : (isDark ? '#475569' : '#CBD5E1');

                  const segPath = getSegmentSplinePath(pts, i);

                  return (
                    <Path
                      key={`seg-${i}`}
                      d={segPath}
                      fill="none"
                      stroke={segColor}
                      strokeWidth={isManyItems ? 2.6 : 3.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                })}

                {/* Concentric Active Point Dot */}
                <Circle cx={selectedPt.x} cy={selectedPt.y} r={isManyItems ? 7 : 9} fill={chartThemeColor + '40'} />
                <Circle
                  cx={selectedPt.x}
                  cy={selectedPt.y}
                  r={isManyItems ? 3.5 : 4.5}
                  fill={chartThemeColor}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              </Svg>

              {/* Day / Month Touch Targets & Axis Labels */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: svgW,
                  paddingHorizontal: isManyItems ? 0 : padX - 12,
                  marginTop: 4,
                }}
              >
                {weeklyData.map((d, index) => {
                  const isSelected = index === selectedDayIndex;
                  const itemFontSize = isManyItems ? 8.2 : 10;
                  const itemPadH = isManyItems ? 1.5 : 5;

                  return (
                    <TouchableOpacity
                      key={`chart-day-${d.dayIndex}`}
                      activeOpacity={0.7}
                      onPress={() => setSelectedDayIndex(index)}
                      style={{
                        alignItems: 'center',
                        paddingHorizontal: itemPadH,
                        paddingVertical: 3,
                        borderRadius: 6,
                        backgroundColor: isSelected ? (isDark ? '#1E293B' : '#E0E7FF') : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: itemFontSize,
                          color: isSelected ? colors.primary : colors.textSecondary,
                          fontFamily: isSelected ? 'RedditSans-Bold' : 'RedditSans-Regular',
                        }}
                      >
                        {d.dayName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })()}
      </View>

      {/* Direction Detail Modal */}
      {selectedDirection && (
        <Modal visible={!!selectedDirection} transparent animationType="fade" onRequestClose={() => setSelectedDirection(null)}>
          <TouchableWithoutFeedback onPress={() => setSelectedDirection(null)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 }}>
              <TouchableWithoutFeedback onPress={() => { }}>
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 28,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                    shadowColor: selectedDirection.color || '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.35,
                    shadowRadius: 16,
                    elevation: 10,
                  }}
                >
                  <LinearGradient
                    colors={selectedDirection.bgGradient || ['#455A64', '#263238']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ padding: 24, paddingBottom: 28, position: 'relative' }}
                  >
                    <TouchableOpacity
                      onPress={() => setSelectedDirection(null)}
                      activeOpacity={0.7}
                      style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                      }}
                    >
                      <FontAwesomeIcon icon={faTimes} size={15} color="#FFFFFF" />
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 20,
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: 'rgba(255, 255, 255, 0.35)',
                        }}
                      >
                        <Text style={{ fontSize: 28 }}>{selectedDirection.emoji || '🎯'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 22,
                            fontFamily: 'RedditSans-Bold',
                            fontWeight: '800',
                            color: '#FFFFFF',
                          }}
                        >
                          {selectedDirection.name}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <View
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.25)',
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 10,
                            }}
                          >
                            <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: 'RedditSans-Bold', fontWeight: '700' }}>
                              {selectedDirection.progress === 100
                                ? getGridText('mastered', activeLang)
                                : selectedDirection.progress > 0
                                  ? getGridText('active', activeLang)
                                  : getGridText('needs_focus', activeLang)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>

                  <View style={{ padding: 22 }}>
                    <View
                      style={{
                        backgroundColor: colors.inputBackground,
                        borderRadius: 18,
                        padding: 16,
                        marginBottom: 18,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: 'RedditSans-Medium' }}>
                          {t('grid.overall_progress', getGridText('overall_progress', activeLang))}
                        </Text>
                        <Text
                          style={{
                            fontSize: 20,
                            fontFamily: 'RedditSans-Bold',
                            color: selectedDirection.color || colors.primary,
                          }}
                        >
                          {selectedDirection.progress}%
                        </Text>
                      </View>

                      <View
                        style={{
                          height: 10,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                          borderRadius: 5,
                          overflow: 'hidden',
                        }}
                      >
                        <LinearGradient
                          colors={[selectedDirection.color || colors.primary, (selectedDirection.color || colors.primary) + 'B3']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            width: `${Math.min(100, Math.max(0, selectedDirection.progress))}%`,
                            height: '100%',
                            borderRadius: 5,
                          }}
                        />
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 22 }}>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                          borderRadius: 18,
                          paddingVertical: 14,
                          paddingHorizontal: 12,
                          borderWidth: 1,
                          borderColor: colors.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 22, marginBottom: 4 }}>🎯</Text>
                        <Text
                          style={{
                            fontSize: 18,
                            fontFamily: 'RedditSans-Bold',
                            color: colors.text,
                          }}
                        >
                          {selectedDirection.goalsCount || 0}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: colors.textSecondary,
                            fontFamily: 'RedditSans-Medium',
                            marginTop: 2,
                          }}
                        >
                          {t('grid.active_goals', getGridText('active_goals', activeLang))}
                        </Text>
                      </View>

                      <View
                        style={{
                          flex: 1,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                          borderRadius: 18,
                          paddingVertical: 14,
                          paddingHorizontal: 12,
                          borderWidth: 1,
                          borderColor: colors.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 22, marginBottom: 4 }}>⚡</Text>
                        <Text
                          style={{
                            fontSize: 18,
                            fontFamily: 'RedditSans-Bold',
                            color: colors.text,
                          }}
                        >
                          {selectedDirection.habitsCount || 0}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: colors.textSecondary,
                            fontFamily: 'RedditSans-Medium',
                            marginTop: 2,
                          }}
                        >
                          {t('grid.active_habits', getGridText('active_habits', activeLang))}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity onPress={() => setSelectedDirection(null)} activeOpacity={0.85}>
                      <LinearGradient
                        colors={selectedDirection.bgGradient || ['#4F46E5', '#3730A3']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          paddingVertical: 15,
                          borderRadius: 18,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: selectedDirection.color || '#6366F1',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.5,
                          shadowRadius: 8,
                          elevation: 6,
                        }}
                      >
                        <Text style={{ fontFamily: 'RedditSans-Bold', color: '#FFFFFF', fontSize: 16, letterSpacing: 0.3 }}>
                          {t('grid.got_it', getGridText('got_it', activeLang))}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Calendar Scope Selector Modal */}
      {showCalendarModal && (
        <Modal visible={showCalendarModal} transparent animationType="fade" onRequestClose={() => setShowCalendarModal(false)}>
          <TouchableWithoutFeedback onPress={() => setShowCalendarModal(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 }}>
              <TouchableWithoutFeedback onPress={() => { }}>
                <View
                  style={{
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderRadius: 24,
                    padding: 24,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    elevation: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(99, 102, 241, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                        <FontAwesomeIcon icon={faCalendarAlt} size={18} color={colors.primary || '#6366F1'} />
                      </View>
                      <Text style={{ fontSize: 17, fontFamily: 'RedditSans-Bold', color: colors.text }}>
                        {getGridText('select_history_scope', activeLang)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowCalendarModal(false)} activeOpacity={0.7}>
                      <FontAwesomeIcon icon={faTimes} size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Year Selection */}
                  <Text style={{ fontSize: 12, fontFamily: 'RedditSans-Bold', color: colors.textSecondary, marginBottom: 8 }}>
                    {getGridText('select_year', activeLang)}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    {[2024, 2025, 2026].map((yr) => (
                      <TouchableOpacity
                        key={yr}
                        onPress={() => setSelectedYear(yr)}
                        style={{
                          flex: 1,
                          paddingVertical: 9,
                          borderRadius: 12,
                          alignItems: 'center',
                          backgroundColor: selectedYear === yr ? colors.primary : (isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
                        }}
                      >
                        <Text style={{ fontSize: 13, fontFamily: 'RedditSans-Bold', color: selectedYear === yr ? '#FFFFFF' : colors.text }}>
                          {yr}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Month Selection Grid */}
                  <Text style={{ fontSize: 12, fontFamily: 'RedditSans-Bold', color: colors.textSecondary, marginBottom: 8 }}>
                    {getGridText('select_month', activeLang)}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    {getMonthNames(activeLang).map((mName, mIdx) => {
                      const isSelM = selectedMonth === mIdx;
                      return (
                        <TouchableOpacity
                          key={mName}
                          onPress={() => {
                            setSelectedMonth(mIdx);
                            setSelectedPeriod('1m');
                            setShowCalendarModal(false);
                          }}
                          style={{
                            width: '23%',
                            paddingVertical: 9,
                            borderRadius: 10,
                            alignItems: 'center',
                            backgroundColor: isSelM ? colors.primary : (isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
                          }}
                        >
                          <Text style={{ fontSize: 12, fontFamily: 'RedditSans-Bold', color: isSelM ? '#FFFFFF' : colors.text }}>
                            {mName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Quick Action Buttons */}
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedPeriod('1y');
                      setShowCalendarModal(false);
                    }}
                    activeOpacity={0.8}
                    style={{
                      paddingVertical: 13,
                      borderRadius: 14,
                      alignItems: 'center',
                      backgroundColor: colors.primary || '#6366F1',
                    }}
                  >
                    <Text style={{ fontFamily: 'RedditSans-Bold', color: '#FFFFFF', fontSize: 14, letterSpacing: 0.2 }}>
                      {getGridText('yearly_overview', activeLang, selectedYear)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
};

export default LifeBalanceGrid;

