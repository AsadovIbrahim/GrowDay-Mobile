/**
 * Dynamic AI Task Translator across 10 supported languages:
 * en, az, tr, ru, es, de, fr, it, ar, zh
 */

const PHRASE_MAPPINGS = [
  // Identify X Triggers / Triggers
  {
    regex: /identify (.*) triggers/i,
    translations: {
      en: "Identify $1 Triggers",
      az: "$1 tətikləyicilərini müəyyən edin",
      tr: "$1 tetikleyicilerini belirleyin",
      ru: "Определите триггеры $1",
      es: "Identifica desencadenantes de $1",
      de: "Identifizieren Sie $1-Auslöser",
      fr: "Identifiez les déclencheurs de $1",
      it: "Identifica i fattori scatenanti di $1",
      ar: "حدد محفزات $1",
      zh: "识别 $1 诱因"
    }
  },
  // Implement X Control / Control
  {
    regex: /implement (.*) control/i,
    translations: {
      en: "Implement $1 Control",
      az: "$1 nəzarətini tətbiq edin",
      tr: "$1 kontrolünü uygulayın",
      ru: "Внедрите контроль $1",
      es: "Implementa el control de $1",
      de: "Implementieren Sie die $1-Kontrolle",
      fr: "Mettez en œuvre le contrôle de $1",
      it: "Implementa il controllo di $1",
      ar: "تطبيق التحكم في $1",
      zh: "实施 $1 控制"
    }
  },
  // Schedule X-Free Zones
  {
    regex: /schedule (.*)-free zones/i,
    translations: {
      en: "Schedule $1-Free Zones",
      az: "$1-siz zonalar planlaşdırın",
      tr: "$1-sız bölgeler planlayın",
      ru: "Запланируйте зоны без $1",
      es: "Programa zonas libres de $1",
      de: "Planen Sie $1-freie Zonen",
      fr: "Planifiez des zones sans $1",
      it: "Pianifica zone libere da $1",
      ar: "جدولة مناطق خالية من $1",
      zh: "安排无 $1 区域"
    }
  },
  // Identify Triggers and Avoid Them
  {
    regex: /identify triggers and avoid them/i,
    translations: {
      en: "Identify Triggers and Avoid Them",
      az: "Tətikləyici amilləri müəyyən edin və onlardan qaçının",
      tr: "Tetikleyicileri belirleyin ve kaçının",
      ru: "Определите триггеры и избегайте их",
      es: "Identifica y evita los desencadenantes",
      de: "Identifizieren und vermeiden Sie Auslöser",
      fr: "Identifiez et évitez les déclencheurs",
      it: "Identifica ed evita i fattori scatenanti",
      ar: "حدد المحفزات وتجنبها",
      zh: "识别并避免诱因"
    }
  },
  // Engage in Alternative Activities
  {
    regex: /engage in alternative activities/i,
    translations: {
      en: "Engage in Alternative Activities",
      az: "Alternativ fəaliyyətlərə qoşulun",
      tr: "Alternatif faaliyetlerle ilgilenin",
      ru: "Занимайтесь альтернативными видами деятельности",
      es: "Participa en actividades alternativas",
      de: "Engagieren Sie sich in alternativen Aktivitäten",
      fr: "Engagez-vous dans des activités alternatives",
      it: "Svolgi attività alternative",
      ar: "مارس أنشطة بديلة",
      zh: "参与替代活动"
    }
  },
  // Practice Mindfulness and Self-Regulation
  {
    regex: /practice mindfulness and self-regulation/i,
    translations: {
      en: "Practice Mindfulness and Self-Regulation",
      az: "Fərqindəlik və özünü nizamlamanı tətbiq edin",
      tr: "Farkındalık ve öz düzenleme pratiği yapın",
      ru: "Практикуйте осознанность и саморегуляцию",
      es: "Practica la atención plena y la autorregulación",
      de: "Üben Sie Achtsamkeit und Selbstregulierung",
      fr: "Pratiquez la pleine conscience et l'autorégulation",
      it: "Pratica la consapevolezza e l'autoregolazione",
      ar: "مارس اليقظة والتمكين الذاتي",
      zh: "练习正念与自我调节"
    }
  },
  // Start working on X
  {
    regex: /^start working on (.*)/i,
    translations: {
      en: "Start working on $1",
      az: "$1 üzərində işləməyə başlayın",
      tr: "$1 üzerinde çalışmaya başlayın",
      ru: "Начните работать над $1",
      es: "Comienza a trabajar en $1",
      de: "Beginnen Sie mit der Arbeit an $1",
      fr: "Commencez à travailler sur $1",
      it: "Inizia a lavorare su $1",
      ar: "ابدأ العمل على $1",
      zh: "开始致力于 $1"
    }
  },
  // Practice & Build X
  {
    regex: /^practice & build (.*)/i,
    translations: {
      en: "Practice & Build $1",
      az: "$1 üzərində məşq edin və inkişaf etdirin",
      tr: "$1 üzerinde pratik yapın ve geliştirin",
      ru: "Практикуйтесь и развивайте $1",
      es: "Practica y desarrolla $1",
      de: "Üben und bauen Sie $1 auf",
      fr: "Pratiquez et développez $1",
      it: "Pratica e sviluppa $1",
      ar: "مارس وطوّر $1",
      zh: "练习并提升 $1"
    }
  },
  // Master & Review X
  {
    regex: /^master & review (.*)/i,
    translations: {
      en: "Master & Review $1",
      az: "$1 mövzusunu mənimsəyin və nəzərdən keçirin",
      tr: "$1 konusunu ustalaşın ve gözden geçirin",
      ru: "Освойте и повторите $1",
      es: "Domina y revisa $1",
      de: "Meistern und überprüfen Sie $1",
      fr: "Maîtrisez et révisez $1",
      it: "Padroneggia e ripassa $1",
      ar: "أتقن وراجع $1",
      zh: "精通并复习 $1"
    }
  }
];

export const getTranslatedTask = (task, currentLanguage, t) => {
  if (!task) return { title: '', description: '' };
  const langKey = currentLanguage ? currentLanguage.split('-')[0].split('_')[0].toLowerCase() : 'en';

  // 1. Check titleTranslations object if present
  const titleTrans = typeof task === 'object' ? (task.titleTranslations || task.TitleTranslations) : null;
  if (titleTrans && typeof titleTrans === 'object' && titleTrans[langKey]) {
    return { title: titleTrans[langKey], description: '' };
  }

  let title = typeof task === 'string' ? task : (task.title || '');
  if (!title) return { title: '', description: '' };

  // 2. Check dynamic phrase mappings
  if (langKey !== 'en') {
    for (const mapping of PHRASE_MAPPINGS) {
      const match = title.match(mapping.regex);
      if (match && mapping.translations[langKey]) {
        let res = mapping.translations[langKey];
        if (match[1]) {
          res = res.replace('$1', match[1]);
        }
        return { title: res, description: '' };
      }
    }
  }

  // 3. Fallback to i18n t(...) key if available
  if (t) {
    const titleKey = title.toLowerCase().replace(/[^\w\s]/g, '').trim().replace(/\s+/g, '_');
    const translated = t(`tasks.${titleKey}`, { defaultValue: title });
    if (translated !== title) return { title: translated, description: '' };
  }

  return { title, description: '' };
};

export const getLocalizedTaskTitle = (originalText, currentLanguage, t) => {
  const taskObj = (originalText && typeof originalText === 'object') ? originalText : { title: originalText };
  const { title } = getTranslatedTask(taskObj, currentLanguage, t);
  return title;
};
