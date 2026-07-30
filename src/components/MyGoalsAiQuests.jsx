import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  Alert,
  Vibration,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faPlus,
  faChevronUp,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faTrash,
  faCheckCircle,
  faTimes,
  faFlag,
  faClock,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import { useMMKVString } from 'react-native-mmkv';
import { useTranslation } from 'react-i18next';
import { getLocalizedTaskTitle, getSyncTaskTitle } from '../utils/aiTaskTranslations';
import { storage, getMyGoalsKey } from '../utils/MMKVStore';
import {
  createMandalaGoalFetch,
  getMandalaGoalFetch,
  completeMandalaTaskFetch,
  deleteMandalaGoalFetch,
} from '../utils/fetch';

const CATEGORIES = [
  { id: 'learning', name: 'Learning', icon: '📚' },
  { id: 'health', name: 'Health & Fitness', icon: '🏃' },
  { id: 'mindset', name: 'Mindset', icon: '🧘' },
  { id: 'career', name: 'Career & Work', icon: '💼' },
  { id: 'finance', name: 'Finance', icon: '💰' },
  { id: 'social', name: 'Social', icon: '🤝' },
  { id: 'routine', name: 'Routine', icon: '⏰' },
  { id: 'focus', name: 'Focus', icon: '🎯' },
  { id: 'wellness', name: 'Wellness', icon: '💤' },
];

const DEFAULT_GOALS = [];

// Helper: get/set deleted goal IDs to prevent backend from re-adding them
const getDeletedGoalIds = (token) => {
  try {
    const key = `deleted_goal_ids_${token || 'local'}`;
    const raw = storage.getString(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};
const addDeletedGoalId = (token, goalId) => {
  try {
    const key = `deleted_goal_ids_${token || 'local'}`;
    const existing = getDeletedGoalIds(token);
    if (!existing.includes(goalId)) {
      existing.push(goalId);
      storage.set(key, JSON.stringify(existing));
    }
  } catch { }
};
const removeDeletedGoalId = (token, goalId) => {
  try {
    const key = `deleted_goal_ids_${token || 'local'}`;
    const existing = getDeletedGoalIds(token).filter(id => id !== goalId);
    storage.set(key, JSON.stringify(existing));
  } catch { }
};

const BouncingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createBounce = (anim, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: -5,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const a1 = createBounce(dot1, 0);
    const a2 = createBounce(dot2, 120);
    const a3 = createBounce(dot3, 240);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 6 }}>
      <Animated.View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: '#FFFFFF',
          transform: [{ translateY: dot1 }],
        }}
      />
      <Animated.View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: '#FFFFFF',
          transform: [{ translateY: dot2 }],
        }}
      />
      <Animated.View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: '#FFFFFF',
          transform: [{ translateY: dot3 }],
        }}
      />
    </View>
  );
};

const getTaskDifficultyInfo = (xpInput, priorityInput, index = 0) => {
  const p = (priorityInput || '').toString().toLowerCase();
  const xp = typeof xpInput === 'number' && xpInput > 0 ? xpInput : (index === 0 ? 50 : index === 1 ? 100 : 200);

  if (xp >= 150 || p === 'hard' || (p === 'high' && index === 2)) {
    return {
      tier: 'hard',
      xp: 200,
      color: '#EF4444',
      bgColor: 'rgba(239, 68, 68, 0.15)',
      label: {
        az: 'Çətin',
        tr: 'Zor',
        ru: 'Сложный',
        en: 'Hard',
        es: 'Difícil',
        de: 'Schwer',
        fr: 'Difficile',
        it: 'Difficile',
        ar: 'صعب',
        zh: '困难',
      },
    };
  }

  if (xp >= 80 || p === 'medium' || (p === 'high' && index === 1) || (p === 'low' && index === 1)) {
    return {
      tier: 'medium',
      xp: 100,
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.15)',
      label: {
        az: 'Orta',
        tr: 'Orta',
        ru: 'Средний',
        en: 'Medium',
        es: 'Medio',
        de: 'Mittel',
        fr: 'Moyen',
        it: 'Medio',
        ar: 'متوسط',
        zh: '中等',
      },
    };
  }

  return {
    tier: 'easy',
    xp: 50,
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    label: {
      az: 'Asan',
      tr: 'Kolay',
      ru: 'Легкий',
      en: 'Easy',
      es: 'Fácil',
      de: 'Einfach',
      fr: 'Facile',
      it: 'Facile',
      ar: 'سهل',
      zh: '简单',
    },
  };
};

const checkIsTaskOverdue = (task) => {
  if (!task || task.completed) return false;
  if (task.isOverdue || task.IsOverdue) return true;

  const raw = task.rawDate || task.date;
  if (!raw) return false;

  const taskDate = new Date(raw);
  if (isNaN(taskDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  taskDate.setHours(0, 0, 0, 0);

  return taskDate < today;
};

const checkIsTaskToday = (task) => {
  if (!task || task.completed) return false;
  const raw = task.rawDate || task.date;
  if (!raw) return false;

  const taskDate = new Date(raw);
  if (isNaN(taskDate.getTime())) return false;

  const today = new Date();
  return (
    taskDate.getDate() === today.getDate() &&
    taskDate.getMonth() === today.getMonth() &&
    taskDate.getFullYear() === today.getFullYear()
  );
};

const cleanTaskText = (text) => {
  if (!text || typeof text !== 'string') return text || '';
  return text
    .replace(/\s*(Phase|Mərhələ)\s*\d+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const MyGoalsAiQuests = ({ colors, isDark, t: tProp, searchQuery = '', onTaskComplete }) => {
  const { t: tHook, i18n } = useTranslation();
  const t = tProp || tHook;
  const activeLang = i18n?.language || 'en';

  const [token] = useMMKVString('accessToken');
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [deletingGoalId, setDeletingGoalId] = useState(null);
  const [generatingGoalId, setGeneratingGoalId] = useState(null);
  const [taskPageByGoal, setTaskPageByGoal] = useState({});
  const [phaseCompletedModal, setPhaseCompletedModal] = useState(null);

  useEffect(() => {
    let interval;
    if (isGenerating) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 1600);
    } else {
      setLoadingStep(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  const getGeneratingText = (step, lang) => {
    const langKey = lang ? lang.split('-')[0].toLowerCase() : 'en';
    const messages = {
      az: [
        '🤖 AI məqsədinizi təhlil edir...',
        '✨ Özəl gündəlik tapşırıqlar hazırlanır...',
        '🌐 Tapşırıqlar tərcümə olunur...',
        '🎯 Mandala matrisi tamamlanır...',
      ],
      tr: [
        '🤖 AI hedefinizi analiz ediyor...',
        '✨ Kişisel günlük görevler hazırlanıyor...',
        '🌐 Görevler tercüme ediliyor...',
        '🎯 Mandala matrisi tamamlanıyor...',
      ],
      ru: [
        '🤖 ИИ анализирует вашу цель...',
        '✨ Создаются ежедневные квесты...',
        '🌐 Перевод задач на ваш язык...',
        '🎯 Завершение матрицы Мандалы...',
      ],
      en: [
        '🤖 AI is analyzing your goal...',
        '✨ Generating personalized daily quests...',
        '🌐 Localizing tasks in your language...',
        '🎯 Finalizing your Mandala matrix...',
      ],
      es: [
        '🤖 La IA está analizando tu meta...',
        '✨ Generando misiones diarias personalizadas...',
        '🌐 Traduciendo tareas a tu idioma...',
        '🎯 Finalizando la matriz Mandala...',
      ],
      de: [
        '🤖 KI analysiert dein Ziel...',
        '✨ Erstelle personalisierte Tages-Quests...',
        '🌐 Übersetze Aufgaben in deine Sprache...',
        '🎯 Mandala-Matrix wird fertiggestellt...',
      ],
      fr: [
        '🤖 L’IA analyse votre objectif...',
        '✨ Génération de quêtes quotidiennes...',
        '🌐 Traduction dans votre langue...',
        '🎯 Finalisation de la matrice Mandala...',
      ],
      it: [
        '🤖 L’IA sta analizzando il tuo obiettivo...',
        '✨ Generazione delle missioni giornaliere...',
        '🌐 Traduzione delle attività nella tua lingua...',
        '🎯 Finalizzazione della matrice Mandala...',
      ],
      ar: [
        '🤖 الذكاء الاصطناعي يحلل هدفك...',
        '✨ يتم إنشاء المهام اليومية المخصصة...',
        '🌐 ترجمة المهام إلى لغتك...',
        '🎯 إكمال مصفوفة الماندالا...',
      ],
      zh: [
        '🤖 AI 正在分析您的目标...',
        '✨ 正在生成个性化每日任务...',
        '🌐 正在翻译任务至您的语言...',
        '🎯 正在完成曼陀罗矩阵...',
      ],
    };
    const list = messages[langKey] || messages.en;
    return list[step % list.length];
  };

  const CATEGORY_LOCALIZATION = {
    learning: { az: 'Təhsil', tr: 'Eğitim', ru: 'Обучение', en: 'Learning', es: 'Aprendizaje', de: 'Lernen', fr: 'Apprentissage', it: 'Apprendimento', ar: 'التعليم', zh: '学习' },
    health: { az: 'Sağlamlıq və İdman', tr: 'Sağlık & Spor', ru: 'Здоровье и спорт', en: 'Health & Fitness', es: 'Salud y Deporte', de: 'Gesundheit & Fitness', fr: 'Santé & Forme', it: 'Salute e Fitness', ar: 'الصحة واللياقة', zh: '健康与健身' },
    mindset: { az: 'Dünya Görüşü', tr: 'Zihniyet', ru: 'Мышление', en: 'Mindset', es: 'Mentalidad', de: 'Denkweise', fr: 'Mentalité', it: 'Mentalità', ar: 'العقلية', zh: '心态与思维' },
    career: { az: 'Karyera və İş', tr: 'Kariyer & İş', ru: 'Карьера и работа', en: 'Career & Work', es: 'Carrera y Trabajo', de: 'Karriere & Arbeit', fr: 'Carrière & Travail', it: 'Carriera e Lavoro', ar: 'المهنة والعمل', zh: '事业与工作' },
    finance: { az: 'Maliyyə', tr: 'Finans', ru: 'Финансы', en: 'Finance', es: 'Finanzas', de: 'Finanzen', fr: 'Finances', it: 'Finanza', ar: 'المالية', zh: '财务与理财' },
    social: { az: 'Sosial və Ünsiyyət', tr: 'Sosyal & İlişkiler', ru: 'Общение', en: 'Social', es: 'Social y Relaciones', de: 'Soziales & Beziehungen', fr: 'Social & Relations', it: 'Sociale e Relazioni', ar: 'العلاقات الاجتماعية', zh: '社交与人际' },
    routine: { az: 'Gündəlik Rejim', tr: 'Rutin', ru: 'Рутина', en: 'Routine', es: 'Rutina', de: 'Routine', fr: 'Routine', it: 'Routine', ar: 'الروتين اليومي', zh: '日常作息' },
    focus: { az: 'Fokus və Diqqət', tr: 'Odaklanma', ru: 'Фокус', en: 'Focus', es: 'Enfoque', de: 'Fokus', fr: 'Concentration', it: 'Focus', ar: 'التركيز', zh: '专注与效率' },
    wellness: { az: 'Yuxu və İstirahət', tr: 'Yaşam & İyilik', ru: 'Благополучие', en: 'Wellness', es: 'Bienestar', de: 'Wohlbefinden', fr: 'Bien-être', it: 'Benessere', ar: 'الراحة والعافية', zh: '身心康养' },
  };

  const getCategoryLocalizedName = (catId, lang) => {
    const langKey = lang ? lang.split('-')[0].toLowerCase() : 'en';
    const catDict = CATEGORY_LOCALIZATION[catId];
    return (catDict && catDict[langKey]) || (catDict && catDict.en) || catId;
  };

  const MODAL_LOCALIZATION = {
    goal_title: { az: 'Hədəf Başlığı *', tr: 'Hedef Başlığı *', ru: 'Название цели *', en: 'Goal Title *', es: 'Título del objetivo *', de: 'Ziel-Titel *', fr: 'Titre de l’objectif *', it: 'Titolo dell’obiettivo *', ar: 'عنوان الهدف *', zh: '目标名称 *' },
    goal_title_placeholder: { az: 'məs.: Hər gün 20 səhifə oxumaq, İdman etmək...', tr: 'örn.: Her gün 20 sayfa oku, Koşuya başla...', ru: 'напр.: Читать 30 страниц каждый день, Начать бегать...', en: 'e.g. Read 20 pages every day, Start running...', es: 'ej.: Leer 20 páginas cada día, Empezar a correr...', de: 'z.B. Jeden Tag 20 Seiten lesen, Laufen beginnen...', fr: 'ex. : Lire 20 pages chaque jour, Commencer à courir...', it: 'es. Leggere 20 pagine ogni giorno, Iniziare a correre...', ar: 'مثال: قراءة 20 صفحة يومياً، البدء بالجري...', zh: '例：每天阅读20页，开始跑步...' },
    description: { az: 'Təsvir / Motivasiya', tr: 'Açıklama / Motivasyon', ru: 'Описание / Мотивация', en: 'Description / Motivation', es: 'Descripción / Motivación', de: 'Beschreibung / Motivation', fr: 'Description / Motivation', it: 'Descrizione / Motivazione', ar: 'الوصف / الدافع', zh: '描述 / 动机' },
    description_placeholder: { az: 'Bu hədəfə çatmaq sizin üçün niyə vacibdir?', tr: 'Bu hedefe ulaşmak sizin için neden önemli?', ru: 'Почему достижение этой цели важно для вас?', en: 'Why is achieving this goal important to you?', es: '¿Por qué es importante para ti lograr este objetivo?', de: 'Warum ist es wichtig für dich, dieses Ziel zu erreichen?', fr: 'Pourquoi est-il important pour vous d’atteindre cet objectif ?', it: 'Perché è importante per te raggiungere questo obiettivo?', ar: 'لماذا يعد تحقيق هذا الهدف مهماً بالنسبة لك؟', zh: '为什么实现这个目标对您很重要？' },
    select_category: { az: 'Kateqoriya Seçin', tr: 'Kategori Seçin', ru: 'Выберите категорию', en: 'Select Category', es: 'Seleccionar categoría', de: 'Kategorie auswählen', fr: 'Sélectionner la catégorie', it: 'Seleziona categoria', ar: 'اختر الفئة', zh: '选择分类' },
    create_goal_btn: { az: '✨ Hədəf və AI Tapşırıqları Yarat', tr: '✨ Hedef ve AI Görevleri Oluştur', ru: '✨ Создать цель и ИИ-задачи', en: '✨ Create Goal & AI Tasks', es: '✨ Crear objetivo y tareas de IA', de: '✨ Ziel & KI-Aufgaben erstellen', fr: '✨ Créer un objectif et des tâches IA', it: '✨ Crea obiettivo e attività IA', ar: '✨ إنشاء الهدف ومهمات الذكاء الاصطناعي', zh: '✨ 创建目标与 AI 任务' },
    create_modal_title: { az: 'Yeni Hədəf Yaradın', tr: 'Yeni Hedef Oluşturun', ru: 'Создайте новую цель', en: 'Create New Goal', es: 'Crear nuevo objetivo', de: 'Neues Ziel erstellen', fr: 'Créer un nouvel objectif', it: 'Crea nuovo obiettivo', ar: 'إنشاء هدف جديد', zh: '创建新目标' },
    create_modal_desc: { az: 'Hədəfinizi təyin edin, AI bələdçiniz onu günlük tapşırıqlara böləcək!', tr: 'Hedefinizi belirleyin, AI rehberiniz onu günlük görevlere bölsün!', ru: 'Задайте цель, и ваш ИИ-наставник разобьет ее на ежедневные квесты!', en: 'Set your target, and your AI coach will break it down into daily quests!', es: '¡Establece tu objetivo y tu guía de IA lo dividirá en misiones diarias!', de: 'Setze dein Ziel, und dein KI-Begleiter teilt es in tägliche Quests auf!', fr: 'Définissez votre objectif, et votre guide IA le divisera en quêtes quotidiennes !', it: 'Imposta il tuo obiettivo e la tua guida IA lo dividerà in missioni giornaliere!', ar: 'حدد هدفك، وسيقوم مرشد الذكاء الاصطناعي بتقسيمه إلى مهام يومية!', zh: '设定您的目标，您的 AI 导师将其拆解为每日任务！' },
  };

  const getModalText = (key, lang) => {
    const langKey = lang ? lang.split('-')[0].toLowerCase() : 'en';
    const dict = MODAL_LOCALIZATION[key];
    return (dict && dict[langKey]) || (dict && dict.en) || '';
  };

  useEffect(() => {
    loadGoals();
  }, [token, activeLang]);

  const mergeDuplicateGoals = (goalsList) => {
    if (!Array.isArray(goalsList)) return [];

    const goalMap = new Map();

    goalsList.forEach((g) => {
      if (!g || !g.title) return;
      const cleanTitle = g.title.replace(/\s*(Phase|Mərhələ)\s*\d+/gi, '').trim();
      if (!cleanTitle || g.id === 'default_goal_1') return;

      const key = cleanTitle.toLowerCase();

      const sanitizedTasks = (g.tasks || []).map((t, idx) => {
        return {
          ...t,
          title: cleanTaskText(t.title),
          description: cleanTaskText(t.description),
        };
      });

      if (!goalMap.has(key)) {
        goalMap.set(key, {
          ...g,
          title: cleanTitle,
          description: g.description && !g.description.startsWith('Generate 3') ? g.description : `${cleanTitle} planı`,
          tasks: sanitizedTasks,
        });
      } else {
        const existing = goalMap.get(key);
        const existingTaskIds = new Set(existing.tasks.map((t) => t.id || t.title));
        const newUniqueTasks = sanitizedTasks.filter((t) => !existingTaskIds.has(t.id || t.title));

        existing.tasks = [...existing.tasks, ...newUniqueTasks];
        if (existing.description.includes('planı') && g.description && !g.description.includes('planı') && !g.description.startsWith('Generate 3')) {
          existing.description = g.description;
        }
      }
    });

    return Array.from(goalMap.values());
  };

  const loadGoals = async () => {
    try {
      const currentLang = (activeLang || 'en').split('-')[0].toLowerCase();
      const currentKey = getMyGoalsKey(token);
      let saved = storage.getString(currentKey);

      if (!saved) {
        const legacySaved = storage.getString('user_my_goals_ai_quests');
        if (legacySaved) {
          saved = legacySaved;
          storage.set(currentKey, legacySaved);
          storage.delete('user_my_goals_ai_quests');
        }
      }

      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out any default sample goals and merge duplicate cards by clean title
          const userOnly = parsed.filter(g => g.id !== 'default_goal_1').map(g => {
            const cleanTitle = (g.title || '').replace(/\s*(Phase|Mərhələ)\s*\d+/gi, '').trim();
            const cleanDesc = g.description && g.description.startsWith('Generate 3')
              ? `${cleanTitle} planı`
              : g.description;

            return {
              ...g,
              title: cleanTitle || g.title,
              description: cleanDesc,
              tasks: (g.tasks || []).map((t, idx) => {
                let title = (t.title || '').replace(/\s*Phase\s*\d+/gi, '').trim();
                let description = t.description;
                const titleDict = t.titleTranslations || t.titleTranslationsJson;
                if (titleDict && typeof titleDict === 'object') {
                  if (titleDict[currentLang]) title = titleDict[currentLang];
                  else if (titleDict['en']) title = titleDict['en'];
                }
                const descDict = t.descriptionTranslations || t.descriptionTranslationsJson;
                if (descDict && typeof descDict === 'object') {
                  if (descDict[currentLang]) description = descDict[currentLang];
                  else if (descDict['en']) description = descDict['en'];
                }

                const diff = getTaskDifficultyInfo(t.xp, t.priority, idx);
                return {
                  ...t,
                  title: title || t.title,
                  description,
                  xp: diff.xp,
                  priority: diff.tier === 'hard' ? 'Hard' : diff.tier === 'medium' ? 'Medium' : 'Easy',
                  priorityColor: diff.color,
                };
              })
            };
          });

          const mergedLocal = mergeDuplicateGoals(userOnly);
          setGoals(mergedLocal);
          saveGoals(mergedLocal);
          checkAndAutoRenewExpiredGoals(mergedLocal);
        }
      } else {
        setGoals([]);
      }

      if (token) {
        const deletedIds = getDeletedGoalIds(token);
        const res = await getMandalaGoalFetch(token);
        if (res && res.success && res.data) {
          const bg = res.data;
          // Skip if this goal was previously deleted by the user
          if (bg.title && !deletedIds.includes(bg.id)) {
            const rawTasks = bg.tasks?.length > 0
              ? bg.tasks
              : (bg.directions || []).flatMap((d) => d.tasks || []);

            const realAiTasks = rawTasks.map((t, idx) => {
              let taskTitle = t.title;
              let taskDesc = t.description || `AI Quest for ${bg.title}`;

              const titleDict = t.titleTranslations || t.titleTranslationsJson;
              if (titleDict && typeof titleDict === 'object') {
                if (titleDict[currentLang]) taskTitle = titleDict[currentLang];
                else if (titleDict['en']) taskTitle = titleDict['en'];
              }

              const descDict = t.descriptionTranslations || t.descriptionTranslationsJson;
              if (descDict && typeof descDict === 'object') {
                if (descDict[currentLang]) taskDesc = descDict[currentLang];
                else if (descDict['en']) taskDesc = descDict['en'];
              }

              const defaultXP = idx === 0 ? 50 : idx === 1 ? 100 : 200;
              const taskXP = t.xp || t.XP || defaultXP;
              const taskPriority = taskXP >= 150 ? 'Hard' : taskXP >= 80 ? 'Medium' : 'Easy';

              return {
                id: t.id || `task_${idx}`,
                title: taskTitle,
                description: taskDesc,
                titleTranslations: titleDict || null,
                descriptionTranslations: descDict || null,
                priority: taskPriority,
                priorityColor: taskXP >= 150 ? '#EF4444' : taskXP >= 80 ? '#F59E0B' : '#10B981',
                xp: taskXP,
                date: new Date(t.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
                rawDate: t.date || t.Date || new Date().toISOString(),
                isOverdue: t.isOverdue || t.IsOverdue || false,
                completed: t.isCompleted || false,
              };
            });

            const catId = bg.category || 'learning';
            const foundCat = CATEGORIES.find((c) => c.id === catId || c.name.toLowerCase() === catId.toLowerCase()) || CATEGORIES[0];

            const serverGoal = {
              id: bg.id || `goal_${Date.now()}`,
              title: bg.title,
              description: bg.description || 'AI Mandala Plan',
              category: catId,
              categoryIcon: foundCat.icon,
              createdAt: new Date().toISOString(),
              isExpanded: true,
              tasks: realAiTasks,
            };
            if (serverGoal.tasks.length > 0) {
              setGoals(prev => {
                const merged = mergeDuplicateGoals([serverGoal, ...prev]);
                saveGoals(merged);
                checkAndAutoRenewExpiredGoals(merged);
                return merged;
              });
            }
          }
        }
      }
    } catch (e) {
      console.log('Error loading my goals:', e);
    }
  };

  const saveGoals = (updatedGoals) => {
    try {
      storage.set(getMyGoalsKey(token), JSON.stringify(updatedGoals));
    } catch (e) {
      console.log('Error saving my goals:', e);
    }
  };

  const checkAndAutoRenewExpiredGoals = async (goalsList) => {
    if (!Array.isArray(goalsList) || goalsList.length === 0) return;
    let hasChanges = false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updatedGoals = await Promise.all(
      goalsList.map(async (goal) => {
        if (!goal.tasks || goal.tasks.length === 0) return goal;

        const lastTask = goal.tasks[goal.tasks.length - 1];
        const raw = lastTask.rawDate || lastTask.date;
        let lastTaskDate = raw ? new Date(raw) : null;

        const isLastTaskExpired =
          lastTaskDate &&
          !isNaN(lastTaskDate.getTime()) &&
          (lastTaskDate < today || checkIsTaskOverdue(lastTask));

        const hasUpcomingPending = goal.tasks.some(
          (t) => !t.completed && !checkIsTaskOverdue(t)
        );

        if (isLastTaskExpired && !hasUpcomingPending) {
          hasChanges = true;
          return await generateNextPhaseForGoal(goal);
        }

        return goal;
      })
    );

    if (hasChanges) {
      setGoals(updatedGoals);
      saveGoals(updatedGoals);
    }
  };

  const handleToggleExpand = (goalId) => {
    const updated = goals.map((g) =>
      g.id === goalId ? { ...g, isExpanded: !g.isExpanded } : g
    );
    setGoals(updated);
    saveGoals(updated);
  };

  const generateNextPhaseForGoal = async (targetGoal) => {
    const currentPhase = (targetGoal.phase || 1) + 1;
    const cleanTitle = (targetGoal.title || 'Goal')
      .replace(/\s*(Phase|Mərhələ)\s*\d+/gi, '')
      .trim();

    const langKey = activeLang ? activeLang.split('-')[0].toLowerCase() : 'en';

    let aiTasksFromBackend = [];

    if (token) {
      try {
        const res = await createMandalaGoalFetch(token, {
          goalText: cleanTitle,
          description: `Generate 3 next-level actionable quests for goal: ${cleanTitle}`,
          category: targetGoal.category || 'learning',
          language: activeLang,
        });

        if (res && res.data) {
          const rawTasks = res.data.tasks?.length > 0
            ? res.data.tasks
            : (res.data.directions || []).flatMap((d) => d.tasks || []);

          if (rawTasks.length > 0) {
            aiTasksFromBackend = rawTasks.slice(0, 3).map((tItem, idx) => {
              const taskXP = tItem.xp || tItem.XP || (idx === 0 ? 50 : idx === 1 ? 100 : 200);
              const taskPriority = taskXP >= 150 ? 'Hard' : taskXP >= 80 ? 'Medium' : 'Easy';
              const daysOffset = idx === 0 ? 1 : idx === 1 ? 3 : 5;
              const targetDateObj = new Date(Date.now() + 86400000 * daysOffset);

              const cleanTaskTitle = cleanTaskText(tItem.title || '');
              const cleanTaskDesc = cleanTaskText(tItem.description || `Step ${idx + 1} for ${cleanTitle}`);

              return {
                id: tItem.id || `task_${Date.now()}_p${currentPhase}_${idx}`,
                title: cleanTaskTitle || tItem.title,
                titleTranslations: tItem.titleTranslations || tItem.TitleTranslations,
                description: cleanTaskDesc,
                descriptionTranslations: tItem.descriptionTranslations || tItem.DescriptionTranslations,
                priority: taskPriority,
                priorityColor: taskXP >= 150 ? '#EF4444' : taskXP >= 80 ? '#F59E0B' : '#10B981',
                xp: taskXP,
                date: targetDateObj.toLocaleDateString(activeLang, { month: 'short', day: '2-digit' }),
                rawDate: targetDateObj.toISOString(),
                isOverdue: false,
                completed: false,
              };
            });
          }
        }
      } catch (e) {
        console.log('Backend next phase AI task generation note (using smart local AI fallback):', e);
      }
    }

    if (aiTasksFromBackend.length === 0) {
      const lowerTitle = title.toLowerCase();

      let localTitles = null;
      let localDescs = null;

      if (lowerTitle.includes('oxu') || lowerTitle.includes('kitab') || lowerTitle.includes('read') || lowerTitle.includes('book')) {
        localTitles = {
          az: [
            'Kitabda diqqət çəkən 3 əsas fikri qeyd edin',
            'Gündəlik oxuma həcmini 30-40 dəqiqəyə çatdırın',
            'Həftəlik oxuduğunuz mövzu üzrə qısa xülasə yazın',
          ],
          tr: [
            'Okuduğunuz bölümden 3 önemli fikri not alın',
            'Günlük okuma süresini 30-40 dakikaya çıkarın',
            'Haftalık okuduğunuz konu hakkında kısa bir özet yazın',
          ],
          ru: [
            'Выпишите 3 ключевые мысли из прочитанной главы',
            'Увеличьте время ежедневного чтения до 30-40 минут',
            'Напишите краткое резюме по прочитанной теме за неделю',
          ],
          en: [
            'Take notes on 3 key insights from your reading',
            'Increase daily reading duration to 30-40 minutes',
            'Write a brief summary of the weekly chapter',
          ],
        };
        localDescs = {
          az: [
            'Qeydlər götürərək oxumaq qavramanı 70% artırır.',
            'Oxuma tempinizi dincələrək tənzimləyin.',
            'Öyrəndiklərinizi öz sözlərinizlə ifadə edin.',
          ],
          en: [
            'Taking notes increases retention by up to 70%.',
            'Pace your reading session comfortably.',
            'Summarize learnings in your own words.',
          ],
          tr: [
            'Not almak kavrama oranını %70 artırır.',
            'Okuma temponuzu rahatça ayarlayın.',
            'Öğrendiklerinizi kendi cümlelerinizle ifade edin.',
          ],
          ru: [
            'Заметки повышают запоминание до 70%.',
            'Комфортно регулируйте темп чтения.',
            'Сформулируйте выводы своими словами.',
          ],
        };
      } else if (lowerTitle.includes('idman') || lowerTitle.includes('sağlam') || lowerTitle.includes('spor') || lowerTitle.includes('run') || lowerTitle.includes('fit') || lowerTitle.includes('workout')) {
        localTitles = {
          az: [
            'Məşq intensivliyini və set sayını 15% artırın',
            'Gündəlik 30 dəqiqə bərpaedici gəzinti edin',
            'Həftəlik nəticələrinizi ölçüb yeni nəticə qeyd edin',
          ],
          tr: [
            'Antrenman yoğunluğunu ve set sayısını %15 artırın',
            'Günlük 30 dakika toparlanma yürüyüşü yapın',
            'Haftalık sonuçlarınızı ölçüp yeni hedef belirleyin',
          ],
          ru: [
            'Увеличьте интенсивность тренировки и сеты на 15%',
            'Делайте ежедневную 30-минутную восстановительную прогулку',
            'Зафиксируйте результаты недели и поставьте новый рекорд',
          ],
          en: [
            'Increase workout intensity and set count by 15%',
            'Take a daily 30-minute recovery walk',
            'Log your weekly progress and set a new benchmark',
          ],
        };
        localDescs = {
          az: ['Əzələlərin inkişafı üçün yüklənməni artırın.', 'Gündəlik hərəkətlilik bərpa üçün çox vacibdir.', 'Göstəriciləri müqayisə edin.'],
          en: ['Progressive overload builds endurance.', 'Active recovery maintains energy levels.', 'Compare your key performance metrics.'],
          tr: ['Gelişim için yüklenmeyi kademeli artırın.', 'Aktif dinlenme enerji seviyenizi korur.', 'Performans metriklerinizi karşılaştırın.'],
          ru: ['Прогрессивная нагрузка развивает выносливость.', 'Активный отдых поддерживает уровень энергии.', 'Сравните ключевые показатели за неделю.'],
        };
      } else {
        localTitles = {
          az: [
            `Öyrəndiklərinizi tətbiq edin və vərdişi dərinləşdirin`,
            `İntizamı gücləndirin və icra temposunu artırın`,
            `Nəticələri analiz edin və ustalığa doğru addımlayın`,
          ],
          en: [
            `Apply insights & deepen daily routine`,
            `Strengthen discipline & boost daily pace`,
            `Evaluate progress & master key skills`,
          ],
          tr: [
            `Bilgileri uygula ve günlük rutini derinleştir`,
            `Disiplini güçlendir ve uygulama temposunu artır`,
            `Sonuçları değerlendir ve ustalığa adım at`,
          ],
          ru: [
            `Применяйте знания и углубляйте привычку`,
            `Укрепляйте дисциплину и повышайте темп`,
            `Оценивайте результаты и совершенствуйте мастерство`,
          ],
        };
        localDescs = {
          az: [
            `Gündəlik fəaliyyətinizə ${title} üzrə fokuslu seanslar əlavə edin.`,
            `Nəticələrinizi izləyin və tempinizi bərpa edin.`,
            `Öyrəndiklərinizi tətbiq edərək vərdişi tam otuzdurun.`,
          ],
          en: [
            `Add focused sessions for ${title} to your daily routine.`,
            `Track your output and maintain a steady pace.`,
            `Solidify your habit by applying key insights.`,
          ],
          tr: [
            `Günlük rutininize ${title} için odaklanmış seanslar ekleyin.`,
            `Sonuçlarınızı takip edin ve temponuzu koruyun.`,
            `Edindiğiniz bilgileri uygulayarak alışkanlığı pekiştirin.`,
          ],
          ru: [
            `Добавьте фокусированные сессии для ${title} в свой день.`,
            `Отслеживайте результаты и сохраняйте устойчивый темп.`,
            `Закрепите привычку, применяя ключевые навыки.`,
          ],
        };
      }

      const selectedTitles = localTitles[langKey] || localTitles.en;
      const selectedDescs = localDescs[langKey] || localDescs.en;

      const t1Date = new Date(Date.now() + 86400000 * 1);
      const t2Date = new Date(Date.now() + 86400000 * 3);
      const t3Date = new Date(Date.now() + 86400000 * 5);

      aiTasksFromBackend = [
        {
          id: `task_${Date.now()}_p${currentPhase}_1`,
          title: cleanTaskText(selectedTitles[0]),
          description: cleanTaskText(selectedDescs[0]),
          priority: 'Easy',
          priorityColor: '#10B981',
          xp: 50,
          date: t1Date.toLocaleDateString(activeLang, { month: 'short', day: '2-digit' }),
          rawDate: t1Date.toISOString(),
          isOverdue: false,
          completed: false,
        },
        {
          id: `task_${Date.now()}_p${currentPhase}_2`,
          title: cleanTaskText(selectedTitles[1]),
          description: cleanTaskText(selectedDescs[1]),
          priority: 'Medium',
          priorityColor: '#F59E0B',
          xp: 100,
          date: t2Date.toLocaleDateString(activeLang, { month: 'short', day: '2-digit' }),
          rawDate: t2Date.toISOString(),
          isOverdue: false,
          completed: false,
        },
        {
          id: `task_${Date.now()}_p${currentPhase}_3`,
          title: cleanTaskText(selectedTitles[2]),
          description: cleanTaskText(selectedDescs[2]),
          priority: 'Hard',
          priorityColor: '#EF4444',
          xp: 200,
          date: t3Date.toLocaleDateString(activeLang, { month: 'short', day: '2-digit' }),
          rawDate: t3Date.toISOString(),
          isOverdue: false,
          completed: false,
        },
      ];
    }

    return {
      ...targetGoal,
      title: cleanTitle,
      description: targetGoal.description && !targetGoal.description.startsWith('Generate 3')
        ? targetGoal.description
        : `${cleanTitle} planı`,
      phase: currentPhase,
      tasks: [...(targetGoal.tasks || []), ...aiTasksFromBackend],
    };
  };

  const handleToggleTask = async (goalId, taskId) => {
    Vibration.vibrate(50);
    let wasCompleted = false;
    let taskXP = 50;
    let isGoalAllCompleted = false;
    let completedGoalObj = null;

    const updated = goals.map((goal) => {
      if (goal.id !== goalId) return goal;
      const updatedTasks = goal.tasks.map((task) => {
        if (task.id === taskId) {
          wasCompleted = !!task.completed;
          taskXP = task.xp || 50;
          return { ...task, completed: !task.completed };
        }
        return task;
      });

      const allDone = updatedTasks.length > 0 && updatedTasks.every((t) => t.completed);
      if (!wasCompleted && allDone) {
        isGoalAllCompleted = true;
        completedGoalObj = { ...goal, tasks: updatedTasks };
      }

      return { ...goal, tasks: updatedTasks };
    });
    setGoals(updated);
    saveGoals(updated);

    // If task was just marked as completed, award XP immediately
    if (!wasCompleted && onTaskComplete) {
      onTaskComplete(taskXP);
    }

    // If all tasks in goal phase were completed just now:
    if (isGoalAllCompleted && completedGoalObj) {
      Vibration.vibrate([100, 100, 100]);
      if (onTaskComplete) {
        onTaskComplete(100); // Bonus +100 XP for completing phase
      }

      setPhaseCompletedModal({
        goalId: goalId,
        goalTitle: completedGoalObj?.title || '',
      });
    }

    if (token) {
      try {
        await completeMandalaTaskFetch(token, taskId);
      } catch (e) {
        console.log('Backend task complete sync note:', e);
      }
    }
  };

  const handleManualGenerateNextPhase = async (goalId) => {
    const targetGoal = goals.find((g) => g.id === goalId);
    if (!targetGoal) return;

    setGeneratingGoalId(goalId);
    Vibration.vibrate(50);

    try {
      const nextGoalObj = await generateNextPhaseForGoal(targetGoal);
      setGoals((prevGoals) => {
        const rawGoalsList = prevGoals.map((g) => (g.id === goalId ? nextGoalObj : g));
        const mergedList = mergeDuplicateGoals(rawGoalsList);
        saveGoals(mergedList);
        return mergedList;
      });
      Vibration.vibrate([100, 100]);
    } catch (e) {
      console.log('Error generating next phase quests:', e);
    } finally {
      setGeneratingGoalId(null);
    }
  };

  const handleDeleteGoal = (goalId) => {
    setDeletingGoalId(goalId);
  };

  const confirmDeleteGoal = async () => {
    if (!deletingGoalId) return;
    const targetId = deletingGoalId;
    setDeletingGoalId(null);

    // Add to deleted IDs blocklist so backend can't re-add it
    addDeletedGoalId(token, targetId);

    const updated = goals.filter((g) => g.id !== targetId);
    setGoals(updated);
    saveGoals(updated);

    if (token) {
      try {
        await deleteMandalaGoalFetch(token, targetId);
      } catch (e) {
        console.log('Backend delete goal sync note:', e);
      }
    }
  };

  const renderTaskDescription = (taskObj) => {
    if (!taskObj) return '';

    if (typeof taskObj === 'object') {
      const descTrans = taskObj.descriptionTranslations || taskObj.DescriptionTranslations;
      const langKey = activeLang ? activeLang.split('-')[0].toLowerCase() : 'en';
      if (descTrans && descTrans[langKey]) return descTrans[langKey];
      return taskObj.description || '';
    }

    return typeof taskObj === 'string' ? taskObj : '';
  };

  const handleCreateGoal = async () => {
    if (!goalTitle.trim()) {
      Alert.alert(
        t ? t('common.error', 'Error') : 'Error',
        t ? t('goals.title_required', 'Please enter a goal title!') : 'Please enter a goal title!'
      );
      return;
    }

    setIsGenerating(true);

    try {
      let aiTasksFromBackend = [];
      let goalId = `goal_${Date.now()}`;
      let finalTitle = goalTitle.trim();
      let finalDesc = goalDesc.trim() || goalTitle.trim();

      if (token) {
        try {
          const res = await createMandalaGoalFetch(token, {
            goalText: goalTitle.trim(),
            description: goalDesc.trim(),
            category: selectedCategory.id,
            language: activeLang,
          });

          if (res && res.data) {
            const bg = res.data;
            goalId = bg.id || goalId;
            finalTitle = bg.title || finalTitle;
            finalDesc = bg.description || finalDesc;

            const rawTasks = bg.tasks?.length > 0
              ? bg.tasks
              : (bg.directions || []).flatMap((d) => d.tasks || []);

            if (rawTasks.length > 0) {
              aiTasksFromBackend = rawTasks.map((tItem, idx) => {
                const defaultXP = idx === 0 ? 50 : idx === 1 ? 100 : 200;
                const taskXP = tItem.xp || tItem.XP || defaultXP;
                const taskPriority = taskXP >= 150 ? 'Hard' : taskXP >= 80 ? 'Medium' : 'Easy';
                return {
                  id: tItem.id || `task_${Date.now()}_${idx}`,
                  title: tItem.title,
                  titleTranslations: tItem.titleTranslations || tItem.TitleTranslations,
                  description: tItem.description && tItem.description !== tItem.title
                    ? tItem.description
                    : `Actionable step ${idx + 1} to accomplish ${finalTitle}`,
                  descriptionTranslations: tItem.descriptionTranslations || tItem.DescriptionTranslations,
                  priority: taskPriority,
                  priorityColor: taskXP >= 150 ? '#EF4444' : taskXP >= 80 ? '#F59E0B' : '#10B981',
                  xp: taskXP,
                  date: new Date(tItem.date || Date.now()).toLocaleDateString(activeLang, { month: 'short', day: '2-digit' }),
                  rawDate: tItem.date || tItem.Date || new Date().toISOString(),
                  isOverdue: tItem.isOverdue || tItem.IsOverdue || false,
                  completed: tItem.isCompleted || false,
                };
              });
            }
          }
        } catch (apiErr) {
          console.log('Backend create goal note (using smart local AI fallback):', apiErr);
        }
      }

      // Fallback: If backend tasks are empty or offline, generate 3 smart AI quests locally
      if (aiTasksFromBackend.length === 0) {
        aiTasksFromBackend = [
          {
            id: `task_${Date.now()}_1`,
            title: `Identify & Plan ${finalTitle}`,
            description: `Identify key triggers, eliminate initial distractions, and set a clear starting plan for ${finalTitle}`,
            priority: 'Easy',
            priorityColor: '#10B981',
            xp: 50,
            date: new Date().toLocaleDateString(activeLang, { month: 'short', day: '2-digit' }),
            completed: false,
          },
          {
            id: `task_${Date.now()}_2`,
            title: `Practice & Build ${finalTitle}`,
            description: `Dedicate focused daily sessions to building strong habits and tracking your progress for ${finalTitle}`,
            priority: 'Medium',
            priorityColor: '#F59E0B',
            xp: 100,
            date: new Date(Date.now() + 86400000 * 2).toLocaleDateString(activeLang, { month: 'short', day: '2-digit' }),
            completed: false,
          },
          {
            id: `task_${Date.now()}_3`,
            title: `Master & Review ${finalTitle}`,
            description: `Evaluate your milestones, refine your routine, and ensure long-term consistency for ${finalTitle}`,
            priority: 'Hard',
            priorityColor: '#EF4444',
            xp: 200,
            date: new Date(Date.now() + 86400000 * 4).toLocaleDateString(activeLang, { month: 'short', day: '2-digit' }),
            completed: false,
          },
        ];
      }

      const createdGoal = {
        id: goalId,
        title: finalTitle,
        description: finalDesc,
        category: selectedCategory.id,
        categoryIcon: selectedCategory.icon,
        createdAt: new Date().toISOString(),
        isExpanded: true,
        tasks: aiTasksFromBackend,
      };

      const updated = [createdGoal, ...goals.filter((g) => g.id !== createdGoal.id)];
      // Remove from deleted blocklist in case backend reuses the same ID
      removeDeletedGoalId(token, createdGoal.id);
      setGoals(updated);
      saveGoals(updated);
    } catch (e) {
      console.log('Error creating AI goal:', e);
    } finally {
      setIsGenerating(false);
      setShowModal(false);
      setGoalTitle('');
      setGoalDesc('');
    }
  };

  // Filter goals by search query if needed
  const filteredGoals = goals.filter((g) =>
    searchQuery
      ? g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <View style={{ marginBottom: 24 }}>
      {/* Header Row: My Goals & AI Quests + Add Goal button */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontFamily: 'RedditSans-Bold',
            color: colors.text,
            flexShrink: 1,
          }}
          numberOfLines={1}
        >
          {t('goals.title', 'Goals & AI')}
        </Text>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setShowModal(true)}
        >
          <View
            style={{
              backgroundColor: '#6366F1',
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              shadowColor: '#6366F1',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <FontAwesomeIcon icon={faPlus} size={11} color="#FFFFFF" />
            <Text
              style={{
                color: '#FFFFFF',
                fontFamily: 'RedditSans-Bold',
                fontSize: 13,
                includeFontPadding: false,
              }}
            >
              {t('goals.add_goal', 'Add Goal')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Empty State */}
      {filteredGoals.length === 0 ? (
        <View
          style={{
            backgroundColor: isDark ? '#141E30' : '#FFFFFF',
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🎯</Text>
          <Text style={{ fontSize: 16, fontFamily: 'RedditSans-Bold', color: colors.text, marginBottom: 4, textAlign: 'center' }}>
            {t('goals.no_goals_title', 'No goals set yet')}
          </Text>
          <Text style={{ fontSize: 13, fontFamily: 'RedditSans-Regular', color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
            {t('goals.no_goals_desc', 'Set your target and your AI coach will break it down into daily quests!')}
          </Text>

          <TouchableOpacity onPress={() => setShowModal(true)} activeOpacity={0.8}>
            <View
              style={{
                backgroundColor: '#6366F1',
                borderRadius: 16,
                paddingHorizontal: 20,
                paddingVertical: 11,
                shadowColor: '#6366F1',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontFamily: 'RedditSans-Bold', fontSize: 13 }}>
                {t('goals.create_first_goal', '+ Create Your First Goal')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        /* Goals List Accordion Cards */
        filteredGoals.map((goal) => {
          const completedTasksCount = goal.tasks.filter((t) => t.completed).length;
          const totalTasksCount = goal.tasks.length;
          const progressPct =
            totalTasksCount > 0
              ? Math.round((completedTasksCount / totalTasksCount) * 100)
              : 0;

          return (
            <View
              key={goal.id}
              style={{
                backgroundColor: isDark ? '#141E30' : '#FFFFFF',
                borderRadius: 24,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.06,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {/* Header: Icon, Title, Description, Progress Pill, Expand Chevron */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleToggleExpand(goal.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{goal.categoryIcon || '🎯'}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'RedditSans-Bold',
                        color: colors.text,
                      }}
                      numberOfLines={1}
                    >
                      {goal.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'RedditSans-Regular',
                        color: colors.textSecondary,
                        marginTop: 2,
                      }}
                      numberOfLines={1}
                    >
                      {goal.description}
                    </Text>
                  </View>
                </View>

                {/* Progress Percentage Badge & Accordion Toggle */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.12)',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: '#818CF8',
                        fontFamily: 'RedditSans-Bold',
                        fontSize: 12,
                      }}
                    >
                      {progressPct}%
                    </Text>
                  </View>

                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FontAwesomeIcon
                      icon={goal.isExpanded ? faChevronUp : faChevronDown}
                      size={13}
                      color={colors.textSecondary}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Horizontal Progress Bar */}
              <View
                style={{
                  height: 4,
                  width: '100%',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  borderRadius: 2,
                  marginTop: 14,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${progressPct}%`,
                    height: '100%',
                    backgroundColor: '#818CF8',
                    borderRadius: 2,
                  }}
                />
              </View>

              {/* Sub-info bar: tasks done count + Trash button */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 12,
                  marginBottom: goal.isExpanded ? 14 : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'RedditSans-Medium',
                    color: colors.textSecondary,
                  }}
                >
                  {t('goals.tasks_done', { done: completedTasksCount, total: totalTasksCount, defaultValue: `${completedTasksCount}/${totalTasksCount} tasks done` })}
                </Text>

                <TouchableOpacity
                  onPress={() => handleDeleteGoal(goal.id)}
                  activeOpacity={0.7}
                  style={{
                    padding: 6,
                    borderRadius: 8,
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} size={13} color="#EF4444" />
                </TouchableOpacity>
              </View>

              {/* Expanded Accordion: List of Sub-tasks with 3-per-page Pagination */}
              {goal.isExpanded && (() => {
                const totalTasks = goal.tasks || [];
                const totalPages = Math.max(1, Math.ceil(totalTasks.length / 3));

                let currentPage = taskPageByGoal[goal.id];
                if (!currentPage) {
                  const firstUncompletedIdx = totalTasks.findIndex(t => !t.completed);
                  if (firstUncompletedIdx !== -1) {
                    currentPage = Math.floor(firstUncompletedIdx / 3) + 1;
                  } else {
                    currentPage = totalPages;
                  }
                }
                currentPage = Math.min(Math.max(1, currentPage), totalPages);

                const paginatedTasks = totalTasks.slice((currentPage - 1) * 3, currentPage * 3);

                return (
                  <View style={{ gap: 12 }}>
                    {paginatedTasks.map((task, idx) => {
                      const absoluteIdx = (currentPage - 1) * 3 + idx;
                      const diffInfo = getTaskDifficultyInfo(task.xp, task.priority, absoluteIdx);
                      const langKey = activeLang ? activeLang.split('-')[0].toLowerCase() : 'en';

                      return (
                        <TouchableOpacity
                          key={task.id}
                          activeOpacity={0.85}
                          onPress={() => handleToggleTask(goal.id, task.id)}
                          style={{
                            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                            borderRadius: 18,
                            padding: 14,
                            borderWidth: 1,
                            borderColor: task.completed
                              ? 'rgba(76, 175, 102, 0.3)'
                              : isDark
                                ? '#334155'
                                : '#E2E8F0',
                            borderLeftWidth: 4,
                            borderLeftColor: diffInfo.color,
                            position: 'relative',
                          }}
                        >
                          {/* Main Row: Checkbox + Task Title */}
                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                            <TouchableOpacity
                              onPress={() => handleToggleTask(goal.id, task.id)}
                              activeOpacity={0.8}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 11,
                                backgroundColor: task.completed ? '#4caf66' : 'transparent',
                                borderWidth: task.completed ? 0 : 2,
                                borderColor: task.completed ? '#4caf66' : colors.textSecondary,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: 2,
                              }}
                            >
                              {task.completed && (
                                <FontAwesomeIcon icon={faCheckCircle} size={14} color="#FFFFFF" />
                              )}
                            </TouchableOpacity>

                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontFamily: 'RedditSans-Bold',
                                  color: task.completed ? colors.textSecondary : colors.text,
                                  textDecorationLine: task.completed ? 'line-through' : 'none',
                                }}
                              >
                                {getLocalizedTaskTitle(task, activeLang, t)}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontFamily: 'RedditSans-Regular',
                                  color: colors.textSecondary,
                                  marginTop: 4,
                                  lineHeight: 18,
                                }}
                              >
                                {renderTaskDescription(task)}
                              </Text>

                              {/* Badges / Tags Row: Priority | Completed | XP | Date */}
                              <View
                                style={{
                                  flexDirection: 'row',
                                  flexWrap: 'wrap',
                                  alignItems: 'center',
                                  gap: 6,
                                  marginTop: 10,
                                }}
                              >
                                {/* Priority Badge */}
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: diffInfo.bgColor,
                                    paddingHorizontal: 8,
                                    paddingVertical: 3,
                                    borderRadius: 8,
                                    gap: 4,
                                  }}
                                >
                                  <FontAwesomeIcon icon={faFlag} size={9} color={diffInfo.color} />
                                  <Text
                                    style={{
                                      color: diffInfo.color,
                                      fontSize: 10,
                                      fontFamily: 'RedditSans-Bold',
                                    }}
                                  >
                                    {diffInfo.label[langKey] || diffInfo.label.en}
                                  </Text>
                                </View>

                                {/* Status Badge */}
                                {(() => {
                                  const isOverdue = checkIsTaskOverdue(task);
                                  const isToday = checkIsTaskToday(task);
                                  return (
                                    <View
                                      style={{
                                        backgroundColor: task.completed
                                          ? 'rgba(76, 175, 102, 0.15)'
                                          : isOverdue
                                            ? 'rgba(239, 68, 68, 0.15)'
                                            : isToday
                                              ? 'rgba(245, 158, 11, 0.18)'
                                              : isDark
                                                ? 'rgba(255,255,255,0.08)'
                                                : 'rgba(0,0,0,0.05)',
                                        paddingHorizontal: 8,
                                        paddingVertical: 3,
                                        borderRadius: 8,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 4,
                                      }}
                                    >
                                      <Text
                                        style={{
                                          color: task.completed
                                            ? '#4caf66'
                                            : isOverdue
                                              ? '#EF4444'
                                              : isToday
                                                ? '#F59E0B'
                                                : colors.textSecondary,
                                          fontSize: 10,
                                          fontFamily: 'RedditSans-Bold',
                                        }}
                                      >
                                        {task.completed
                                          ? t('common.completed', 'Completed')
                                          : isOverdue
                                            ? t('common.overdue', 'Overdue')
                                            : isToday
                                              ? t('common.today', 'Today')
                                              : t('common.pending', 'Pending')}
                                      </Text>
                                    </View>
                                  );
                                })()}

                                {/* XP Badge */}
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(245, 166, 35, 0.15)',
                                    paddingHorizontal: 8,
                                    paddingVertical: 3,
                                    borderRadius: 8,
                                    gap: 3,
                                  }}
                                >
                                  <FontAwesomeIcon icon={faStar} size={9} color="#F5A623" />
                                  <Text
                                    style={{
                                      color: '#F5A623',
                                      fontSize: 10,
                                      fontFamily: 'RedditSans-Bold',
                                    }}
                                  >
                                    +{task.xp || diffInfo.xp} XP
                                  </Text>
                                </View>

                                {/* Date Badge */}
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: isDark
                                      ? 'rgba(255, 255, 255, 0.08)'
                                      : 'rgba(0, 0, 0, 0.05)',
                                    paddingHorizontal: 8,
                                    paddingVertical: 3,
                                    borderRadius: 8,
                                    gap: 4,
                                  }}
                                >
                                  <FontAwesomeIcon icon={faClock} size={9} color={colors.textSecondary} />
                                  <Text
                                    style={{
                                      color: colors.textSecondary,
                                      fontSize: 10,
                                      fontFamily: 'RedditSans-Medium',
                                    }}
                                  >
                                    {task.date}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Task Pagination Controls */}
                    {totalPages > 1 && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                          borderRadius: 14,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          marginTop: 4,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => setTaskPageByGoal(prev => ({ ...prev, [goal.id]: Math.max(1, currentPage - 1) }))}
                          disabled={currentPage === 1}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 10,
                            backgroundColor: currentPage === 1 ? 'transparent' : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                            opacity: currentPage === 1 ? 0.3 : 1,
                          }}
                        >
                          <FontAwesomeIcon icon={faChevronLeft} size={12} color={colors.text} />
                        </TouchableOpacity>

                        <Text style={{ fontFamily: 'RedditSans-Bold', fontSize: 12, color: colors.textSecondary }}>
                          {t('goals.page_info', { current: currentPage, total: totalPages, defaultValue: `Səhifə ${currentPage} / ${totalPages}` })}
                        </Text>

                        <TouchableOpacity
                          onPress={() => setTaskPageByGoal(prev => ({ ...prev, [goal.id]: Math.min(totalPages, currentPage + 1) }))}
                          disabled={currentPage === totalPages}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 10,
                            backgroundColor: currentPage === totalPages ? 'transparent' : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                            opacity: currentPage === totalPages ? 0.3 : 1,
                          }}
                        >
                          <FontAwesomeIcon icon={faChevronRight} size={12} color={colors.text} />
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Button: Generate Next Quests with AI */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleManualGenerateNextPhase(goal.id)}
                      disabled={generatingGoalId === goal.id}
                      style={{
                        marginTop: 4,
                        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                        borderWidth: 1,
                        borderColor: 'rgba(99, 102, 241, 0.3)',
                        borderStyle: 'dashed',
                        borderRadius: 16,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      {generatingGoalId === goal.id ? (
                        <>
                          <BouncingDots />
                          <Text style={{ color: '#818CF8', fontFamily: 'RedditSans-Bold', fontSize: 13 }}>
                            {t('goals.generating_next', '🤖 AI yeni tapşırıqları hazırlayır...')}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text style={{ fontSize: 13 }}>✨</Text>
                          <Text style={{ color: '#818CF8', fontFamily: 'RedditSans-Bold', fontSize: 13 }}>
                            {t('goals.generate_next_quests', 'AI ilə Növbəti Tapşırıqları Yarat')}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })()}
            </View>
          );
        })
      )}

      {/* Set New Goal Bottom Sheet Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View
                style={{
                  backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  borderWidth: 1,
                  borderColor: colors.border,
                  maxHeight: '85%',
                }}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{ padding: 24, paddingBottom: 0 }}
                  contentContainerStyle={{ paddingBottom: 8 }}
                >
                  {/* Modal Header */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 10 }}>
                      <Text
                        style={{
                          fontSize: 20,
                          fontFamily: 'RedditSans-Bold',
                          color: colors.text,
                        }}
                        numberOfLines={1}
                      >
                        {t('goals.create_modal_title', getModalText('create_modal_title', activeLang))}
                      </Text>
                    </View>

                    <TouchableOpacity onPress={() => setShowModal(false)}>
                      <FontAwesomeIcon icon={faTimes} size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textSecondary,
                      marginBottom: 20,
                      fontFamily: 'RedditSans-Regular',
                      lineHeight: 18,
                    }}
                  >
                    {t('goals.create_modal_desc', getModalText('create_modal_desc', activeLang))}
                  </Text>

                  {/* Field 1: Goal Title */}
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'RedditSans-Bold',
                      color: colors.text,
                      marginBottom: 8,
                    }}
                  >
                    {t('goals.goal_title', getModalText('goal_title', activeLang))}
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      color: colors.text,
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      fontSize: 14,
                      fontFamily: 'RedditSans-Medium',
                      borderWidth: 1,
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                      marginBottom: 16,
                    }}
                    placeholder={t('goals.goal_title_placeholder', getModalText('goal_title_placeholder', activeLang))}
                    placeholderTextColor={colors.textSecondary + '80'}
                    value={goalTitle}
                    onChangeText={setGoalTitle}
                  />

                  {/* Field 2: Description / Motivation */}
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'RedditSans-Bold',
                      color: colors.text,
                      marginBottom: 8,
                    }}
                  >
                    {t('goals.description', getModalText('description', activeLang))}
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      color: colors.text,
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      fontSize: 14,
                      fontFamily: 'RedditSans-Medium',
                      borderWidth: 1,
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                      height: 80,
                      textAlignVertical: 'top',
                      marginBottom: 20,
                    }}
                    multiline
                    placeholder={t('goals.goal_desc_placeholder', getModalText('description_placeholder', activeLang))}
                    placeholderTextColor={colors.textSecondary + '80'}
                    value={goalDesc}
                    onChangeText={setGoalDesc}
                  />

                  {/* Field 3: Life Category (3x3 grid) */}
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'RedditSans-Bold',
                      color: colors.text,
                      marginBottom: 12,
                    }}
                  >
                    {t('goals.select_category', getModalText('select_category', activeLang))}
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 10,
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    {CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory.id === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          activeOpacity={0.8}
                          onPress={() => setSelectedCategory(cat)}
                          style={{
                            width: '31%',
                            height: 64,
                            borderRadius: 16,
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden',
                            borderWidth: 1,
                            borderColor: isSelected
                              ? '#6366F1'
                              : isDark
                                ? '#334155'
                                : '#E2E8F0',
                          }}
                        >
                          {isSelected ? (
                            <LinearGradient
                              colors={['#6366F1', '#4F46E5']}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                              }}
                            />
                          ) : (
                            <View
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                              }}
                            />
                          )}

                          <Text style={{ fontSize: 20, marginBottom: 2 }}>{cat.icon}</Text>
                          <Text
                            style={{
                              fontSize: 10,
                              fontFamily: 'RedditSans-Bold',
                              color: isSelected ? '#FFFFFF' : colors.text,
                              textAlign: 'center',
                            }}
                            numberOfLines={1}
                          >
                            {getCategoryLocalizedName(cat.id, activeLang)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Create Button - Fixed at bottom, outside ScrollView */}
                <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 34 }}>
                  <TouchableOpacity
                    onPress={handleCreateGoal}
                    activeOpacity={0.8}
                    disabled={isGenerating}
                  >
                    <View
                      style={{
                        backgroundColor: '#4F46E5',
                        borderRadius: 20,
                        paddingVertical: 15,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#4F46E5',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 5,
                      }}
                    >
                      {isGenerating ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12 }}>
                          <BouncingDots />
                          <Text
                            style={{
                              color: '#FFFFFF',
                              fontFamily: 'RedditSans-Bold',
                              fontSize: 13,
                            }}
                            numberOfLines={1}
                          >
                            {getGeneratingText(loadingStep, activeLang)}
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={{
                            color: '#FFFFFF',
                            fontFamily: 'RedditSans-Bold',
                            fontSize: 15,
                          }}
                        >
                          {t('goals.create_btn', getModalText('create_goal_btn', activeLang))}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Custom Delete Goal Modal Dialog */}
      <Modal
        visible={!!deletingGoalId}
        transparent
        animationType="fade"
        onRequestClose={() => setDeletingGoalId(null)}
      >
        <TouchableWithoutFeedback onPress={() => setDeletingGoalId(null)}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 24,
            }}
          >
            <TouchableWithoutFeedback onPress={() => { }}>
              <View
                style={{
                  width: '100%',
                  maxWidth: 340,
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderRadius: 24,
                  padding: 22,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 19,
                    fontFamily: 'RedditSans-Bold',
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  {t ? t('goals.delete_title', 'Delete Goal') : 'Delete Goal'}
                </Text>

                <Text
                  style={{
                    fontSize: 13.5,
                    fontFamily: 'RedditSans-Regular',
                    color: colors.textSecondary,
                    lineHeight: 20,
                    marginBottom: 20,
                  }}
                >
                  {t ? t('goals.delete_confirm', 'Are you sure you want to delete this goal?\nThis action cannot be undone.') : 'Are you sure you want to delete this goal?\nThis action cannot be undone.'}
                </Text>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {/* Cancel Button */}
                  <TouchableOpacity
                    onPress={() => setDeletingGoalId(null)}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      paddingVertical: 12,
                      borderRadius: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'RedditSans-Bold',
                        color: colors.text,
                        fontSize: 14.5,
                      }}
                    >
                      {t ? t('common.cancel', 'Cancel') : 'Cancel'}
                    </Text>
                  </TouchableOpacity>

                  {/* Yes / Delete Button */}
                  <TouchableOpacity
                    onPress={confirmDeleteGoal}
                    activeOpacity={0.85}
                    style={{
                      flex: 1,
                      backgroundColor: '#FF6B6B',
                      paddingVertical: 12,
                      borderRadius: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#FF6B6B',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                      elevation: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'RedditSans-Bold',
                        color: '#FFFFFF',
                        fontSize: 14.5,
                      }}
                    >
                      {t ? t('goals.delete_btn', 'Yes, Delete') : 'Yes, Delete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Gamified Phase Completion Celebration Modal */}
      <Modal
        visible={!!phaseCompletedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setPhaseCompletedModal(null)}
      >
        <TouchableWithoutFeedback onPress={() => setPhaseCompletedModal(null)}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.82)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 24,
            }}
          >
            <TouchableWithoutFeedback onPress={() => { }}>
              <View
                style={{
                  width: '100%',
                  maxWidth: 340,
                  backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                  borderRadius: 28,
                  padding: 24,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.2)',
                  shadowColor: '#6366F1',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.4,
                  shadowRadius: 20,
                  elevation: 12,
                }}
              >
                {/* Floating Trophy Badge */}
                <LinearGradient
                  colors={['#6366F1', '#10B981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: -48,
                    marginBottom: 16,
                    borderWidth: 4,
                    borderColor: isDark ? '#0F172A' : '#FFFFFF',
                    shadowColor: '#10B981',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.5,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <Text style={{ fontSize: 36 }}>🏆</Text>
                </LinearGradient>

                {/* Bonus XP Pill */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 20,
                    gap: 6,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <FontAwesomeIcon icon={faStar} size={12} color="#F59E0B" />
                  <Text style={{ color: '#F59E0B', fontFamily: 'RedditSans-Bold', fontSize: 13 }}>
                    +100 XP BONUS
                  </Text>
                </View>

                {/* Modal Title */}
                <Text
                  style={{
                    fontSize: 20,
                    fontFamily: 'RedditSans-Bold',
                    color: colors.text,
                    textAlign: 'center',
                    marginBottom: 8,
                  }}
                >
                  {t('goals.phase_completed_modal_title', '🎉 Mərhələ Tamamlandı!')}
                </Text>

                {/* Modal Description */}
                <Text
                  style={{
                    fontSize: 13.5,
                    fontFamily: 'RedditSans-Regular',
                    color: colors.textSecondary,
                    textAlign: 'center',
                    lineHeight: 20,
                    marginBottom: 24,
                  }}
                >
                  {t('goals.phase_completed_desc', 'Təbriklər! Bütün tapşırıqları tamamladınız. Növbəti tapşırıqları aşağıdakı düymə ilə yarada və ya deadline-ın bitməsini gözləyə bilərsiniz. 🚀')}
                </Text>

                {/* Buttons Stack */}
                <View style={{ width: '100%', gap: 10 }}>
                  {/* Primary Action Button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      const targetId = phaseCompletedModal?.goalId;
                      setPhaseCompletedModal(null);
                      if (targetId) {
                        handleManualGenerateNextPhase(targetId);
                      }
                    }}
                    style={{ borderRadius: 18, overflow: 'hidden' }}
                  >
                    <LinearGradient
                      colors={['#6366F1', '#4F46E5']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        paddingVertical: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 8,
                      }}
                    >
                      <Text style={{ fontSize: 14 }}>✨</Text>
                      <Text style={{ color: '#FFFFFF', fontFamily: 'RedditSans-Bold', fontSize: 14 }}>
                        {t('goals.generate_next_quests', 'AI ilə Növbəti Tapşırıqları Yarat')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Secondary Close Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setPhaseCompletedModal(null)}
                    style={{
                      paddingVertical: 12,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <Text style={{ color: colors.textSecondary, fontFamily: 'RedditSans-Bold', fontSize: 14 }}>
                      {t('common.got_it', 'Anladım')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default MyGoalsAiQuests;
