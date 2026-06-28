import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet, Easing, Modal, ScrollView, TextInput, Pressable, Alert } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faTint, faStar, faLeaf, faPalette, faSun, faHeart, faTimes, faPen, faTree } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useMMKVString } from "react-native-mmkv";
import { storage } from "../utils/MMKVStore";
import { schedulePlantWateringReminder } from "../utils/NotificationService";
import Svg, { Polyline } from "react-native-svg";

const LOCAL_TRANSLATIONS = {
  az: {
    actions: {
      pet: "Sığalla",
      water: "Sula",
      sun: "Günəş",
      fertilize: "Gübrələ"
    },
    dialogues: {
      pet_happy: "Gıdıqlanıram! Bu çox xoşdur! 🥰 (+2 XP)",
      pet_tired: "Bu günlük bu qədər sevgi bəs edər! Təşəkkürlər! 😊",
      water_happy: "Çox sağ ol! Canlandım! 💧🌱 (+5 XP)",
      sun_happy: "Günəş vannası superdir! Fotosintez edirəm! ☀️🌿 (+8 XP)",
      fertilize_happy: "Vay! Möhtəşəm gübrə! Çox güclü hiss edirəm! ⚡🌳 (+15 XP)",
      water_disabled: "Məni sulamaq üçün vərdişlərini tamamlamalısan! Hər tamamlanan vərdiş mənə 1 sulama haqqı verir. 💧",
      sun_disabled: "Günəş vermək üçün bu gün vərdişlərinin ən azı 50%-ni tamamlamalısan! ☀️",
      fertilize_disabled: "Gübrələmək üçün bu gün bütün vərdişlərini tamamlamalısan! ⚡",
      sun_already: "Bu gün artıq kifayət qədər günəş vannası qəbul etmişəm! ☀️",
      fertilize_already: "Bu gün artıq gübrələnmişəm! 🌿",
      level_up: "Ura! Mən böyüdüm və Level {{level}} oldum! 🌱✨",
      all_done: "Bu gün bütün vərdişlərini tamamladın! Möhtəşəmsən! 🌟",
      status_water: "Bu gün {{completed}}/{{total}} dəfə sulandım. 💧",
      growing_with_you: "Mən böyüyürəm, sən də böyüyürsən 🌱",
      streak_7: "{{streak}} günlük möhtəşəm ardıcıllıq! Yeni dibçəklərin kilidi açıldı! 🏺",
      streak_30: "Vay! Artıq {{streak}} gündür ki, ardıcıl davam edirsən! Yeni bitkilər açıldı! 🌵🌹",
      streak_100: "Aman Allahım! {{streak}} günlük möhtəşəm ardıcıllıq! Sən əfsanəsən! 👑🔥"
    },
    status: {
      watered_today: "Bu gün {{completed}}/{{total}} dəfə sulandım.",
      thirsty_today: "Susamışam... 🥺"
    },
    xp_remaining: "Level {{level}} üçün {{count}} XP qalıb",
    max_level: "Maksimum Səviyyə ✨",
    levels: {
      1: "Toxum 🌱",
      2: "Filiz 🌿",
      3: "Dibçək Bitkisi 🪴",
      4: "Çiçəklənən Bitki 🌸",
      5: "Möhtəşəm Ağac 🌳✨"
    },
    customizer: {
      header: "{{name}} Sazla 🎨",
      streak_info: "Hazırkı ən yüksək ardıcıllığınız: {{streak}} gün. Ardıcıllığınız artdıqca yeni görünüşlər açılır!",
      pots_title: "Dibçək Dizaynları",
      species_title: "Bitki Növləri",
      active: "Aktiv",
      unlocked: "Kilid açıq",
      locked_by: "Kilidli: {{val}}",
      streak_days: "{{count}} gün streak",
      rename_title: "Bitkinin adını dəyiş",
      rename_welcome: "Yeni virtual bitkinə ad ver! 🪴",
      rename_placeholder: "Yeni ad daxil edin...",
      rename_save: "Yadda saxla",
      rename_cancel: "Ləğv et"
    },
    pots: {
      classic: "Klassik dibçək",
      bronze: "Bürünc dibçək 🏺",
      silver: "Gümüş dibçək 🏺",
      gold: "Qızıl dibçək 🏺",
      gold_glow: "Parlaq Qızıl 🏺✨"
    },
    species: {
      fern: "Otaq bitkisi 🌿",
      cactus: "Kaktus 🌵",
      rose: "Qızılgül 🌹",
      bonsai: "Bonsay 🌳",
      rare: "Nadir Bitki 🌴✨"
    },
    garden: {
      title: "Mənim Bağım 🌳",
      empty: "Bağınız hələlik boşdur. Səviyyə 5-ə çatan ağaclarınızı buraya əkə bilərsiniz! 🌳",
      plant_btn: "Bağa ək 🌳",
      alert_title: "Bağa Əkmək İstəyirsiniz?",
      alert_desc: "Bu möhtəşəm ağacı bağınıza əkib yeni bir bitki yetişdirməyə başlamaq istəyirsiniz? (Yeni bitki 1-ci səviyyədən başlayacaq).",
      planted_date: "Əkildi: {{date}}",
      level_5_max: "Səviyyə 5 (Maks)",
      active_plant: "Aktiv Bitki",
      level_label: "Səviyyə",
      currently_growing: "Hazırda yetişdirilir. Səviyyə 5-ə çatdıqda bağda daimi olaraq kilidlənəcək!",
      locked_plot: "Kilidli sahə 🔒",
      not_accessible: "Hələlik istifadəyə verilmir",
      unlock_instructions: "Öncəki boş sahələri doldurduqca növbəti sahələrin kilidi açılacaq."
    }
  },
  tr: {
    actions: {
      pet: "Sev",
      water: "Sula",
      sun: "Güneş",
      fertilize: "Gübrele"
    },
    dialogues: {
      pet_happy: "Gıdıklanıyorum! Bu çok hoş! 🥰 (+2 XP)",
      pet_tired: "Bugünlük bu kadar sevgi yeter! Teşekkürler! 😊",
      water_happy: "Çok teşekkürler! Canlandım! 💧🌱 (+5 XP)",
      sun_happy: "Güneş banyosu harika! Fotosentez yapıyorum! ☀️🌿 (+8 XP)",
      fertilize_happy: "Vay! Harika gübre! Çok güçlü hissediyorum! ⚡🌳 (+15 XP)",
      water_disabled: "Beni sulamak için alışkanlıklarını tamamlamalısın! Her tamamlanan alışkanlık bana 1 sulama hakkı verir. 💧",
      sun_disabled: "Güneş vermek için bugün alışkanlıklarının en az %50'sini tamamlamalısın! ☀️",
      fertilize_disabled: "Gübrelemek için bugün tüm alışkanlıklarını tamamlamalısın! ⚡",
      sun_already: "Bugün zaten yeterince güneş aldım! ☀️",
      fertilize_already: "Bugün zaten gübrelendim! 🌿",
      level_up: "Harika! Büyüdüm ve Seviye {{level}} oldum! 🌱✨",
      all_done: "Bugün tüm alışkanlıklarını tamamladın! Harikasın! 🌟",
      status_water: "Bugün {{completed}}/{{total}} kez sulandım. 💧",
      growing_with_you: "Ben büyüyorum, sen de büyüyorsun 🌱",
      streak_7: "{{streak}} günlük harika seri! Yeni saksıların kilidi açıldı! 🏺",
      streak_30: "Vay! Artık {{streak}} gündür üst üste devam ediyorsun! Yeni bitkiler açıldı! 🌵🌹",
      streak_100: "Aman Tanrım! {{streak}} günlük harika seri! Sen bir efsanesin! 👑🔥"
    },
    status: {
      watered_today: "Bugün {{completed}}/{{total}} sulandı.",
      thirsty_today: "Susadım... 🥺"
    },
    xp_remaining: "Lv. {{level}} için {{count}} XP",
    max_level: "Maksimum Seviye ✨",
    levels: {
      1: "Filiz 🌱",
      2: "Genç Bitki 🌿",
      3: "Büyük Bitki 🪴",
      4: "Çiçekli Bitki 🌸",
      5: "Nadir Bitki 🌳✨"
    },
    customizer: {
      header: "{{name}} Özelleştir 🎨",
      streak_info: "Mevcut en yüksek seriniz: {{streak}} gün. Seriniz arttıkça yeni görünümler açılır!",
      pots_title: "Saksı Tasarımları",
      species_title: "Bitki Türleri",
      active: "Aktif",
      unlocked: "Kilit Açık",
      locked_by: "Kilitli: {{val}}",
      streak_days: "{{count}} gün seri",
      rename_title: "Bitkinin adını değiştir",
      rename_welcome: "Yeni sanal bitkine isim ver! 🪴",
      rename_placeholder: "Yeni ad girin...",
      rename_save: "Kaydet",
      rename_cancel: "İptal"
    },
    pots: {
      classic: "Klasik Saksı",
      bronze: "Bronz Saksı 🏺",
      silver: "Gümüş Saksı 🏺",
      gold: "Altın Saksı 🏺",
      gold_glow: "Parlayan Altın Saksı 🏺✨"
    },
    species: {
      fern: "Eğrelti Otu 🌿",
      cactus: "Kaktüs 🌵",
      rose: "Gül 🌹",
      bonsai: "Bonsai 🌳",
      rare: "Nadir Bitki 🌴✨"
    },
    garden: {
      title: "Benim Bahçem 🌳",
      empty: "Bahçeniz henüz boş. Seviye 5'e ulaşan ağaçlarınızı buraya dikebilirsiniz! 🌳",
      plant_btn: "Bahçeye Dik 🌳",
      alert_title: "Bahçeye Dikmek İstiyor musunuz?",
      alert_desc: "Bu harika ağacı bahçenize dikip yeni bir bitki yetiştirmeye başlamak istiyor musunuz? (Yeni bitki 1. seviyeden başlayacak).",
      planted_date: "Dikildi: {{date}}",
      level_5_max: "Seviye 5 (Maks)",
      active_plant: "Aktif Bitki",
      level_label: "Seviye",
      currently_growing: "Şu anda yetiştiriliyor. 5. Seviyeye ulaştığında bahçeye kalıcı olarak dikilecektir!",
      locked_plot: "Kilitli alan 🔒",
      not_accessible: "Henüz kullanılamaz",
      unlock_instructions: "Önceki boş alanları doldurdukça bu alanın kilidi açılacaktır."
    }
  },
  ru: {
    actions: {
      pet: "Ласка",
      water: "Полить",
      sun: "Солнце",
      fertilize: "Удобрить"
    },
    dialogues: {
      pet_happy: "Щекотно! Это так приятно! 🥰 (+2 XP)",
      pet_tired: "На сегодня достаточно любви! Спасибо! 😊",
      water_happy: "Спасибо большое! Я ожил! 💧🌱 (+5 XP)",
      sun_happy: "Солнечные ванны — это супер! Я фотосинтезирую! ☀️🌿 (+8 XP)",
      fertilize_happy: "Вау! Отличное удобрение! Чувствую себя сильным! ⚡🌳 (+15 XP)",
      water_disabled: "Выполняй привычки, чтобы полить меня! Каждая выполненная привычка дает 1 полив. 💧",
      sun_disabled: "Выполни хотя бы 50% сегодняшних привычек, чтобы дать мне солнца! ☀️",
      fertilize_disabled: "Выполни все сегодняшние привычки на 100%, чтобы удобрить меня! ⚡",
      sun_already: "Я уже погрелся на солнышке сегодня! ☀️",
      fertilize_already: "Меня уже удобрили сегодня! 🌿",
      level_up: "Ура! Я вырос и достиг Уровня {{level}}! 🌱✨",
      all_done: "Сегодня ты выполнил все привычки! Ты супер! 🌟",
      status_water: "Сегодня меня полили {{completed}}/{{total}} раз. 💧",
      growing_with_you: "Я расту, и ты растешь 🌱",
      streak_7: "Отличная серия из {{streak}} дней! Разблокированы новые горшки! 🏺",
      streak_30: "Ого! Ты держишь серию уже {{streak}} дней! Открыты новые растения! 🌵🌹",
      streak_100: "Боже мой! Великолепная серия в {{streak}} дней! Ты легенда! 👑🔥"
    },
    status: {
      watered_today: "Сегодня полит: {{completed}}/{{total}}.",
      thirsty_today: "Хочу пить... 🥺"
    },
    xp_remaining: "{{count}} XP до Lv. {{level}}",
    max_level: "Макс. Уровень ✨",
    levels: {
      1: "Росток 🌱",
      2: "Молодое растение 🌿",
      3: "Большое растение 🪴",
      4: "Цветущее растение 🌸",
      5: "Редкое растение 🌳✨"
    },
    customizer: {
      header: "Настроить {{name}} 🎨",
      streak_info: "Ваша лучшая серия: {{streak}} дн. Увеличивайте серию для разблокировки нового!",
      pots_title: "Дизайн горшков",
      species_title: "Виды растений",
      active: "Активен",
      unlocked: "Доступно",
      locked_by: "Закрыто: {{val}}",
      streak_days: "Серия {{count}} дн.",
      rename_title: "Переименовать растение",
      rename_welcome: "Дай имя своему новому виртуальному растению! 🪴",
      rename_placeholder: "Введите новое имя...",
      rename_save: "Сохранить",
      rename_cancel: "Отмена"
    },
    pots: {
      classic: "Классический горшок",
      bronze: "Бронзовый горшок 🏺",
      silver: "Серебряный горшок 🏺",
      gold: "Золотой горшок 🏺",
      gold_glow: "Сияющий золотой 🏺✨"
    },
    species: {
      fern: "Папоротник 🌿",
      cactus: "Кактус 🌵",
      rose: "Роза 🌹",
      bonsai: "Бонсай 🌳",
      rare: "Редкое растение 🌴✨"
    },
    garden: {
      title: "Мой Сад 🌳",
      empty: "Ваш сад пока пуст. Вы можете посадить сюда деревья, когда они достигнут Уровня 5! 🌳",
      plant_btn: "Посадить в сад 🌳",
      alert_title: "Посадить в сад?",
      alert_desc: "Вы хотите посадить это чудесное дерево в свой сад и начать выращивать новое? (Новое растение начнется с Уровня 1).",
      planted_date: "Посажено: {{date}}",
      level_5_max: "Уровень 5 (Макс.)",
      active_plant: "Активное растение",
      level_label: "Уровень",
      currently_growing: "Сейчас выращивается. Будет навсегда посажено в сад по достижении 5-го уровня!",
      locked_plot: "Закрытый участок 🔒",
      not_accessible: "Пока недоступно",
      unlock_instructions: "Этот участок разблокируется по мере заполнения предыдущих пустых участков."
    }
  },
  en: {
    actions: {
      pet: "Pet",
      water: "Water",
      sun: "Sun",
      fertilize: "Fertilize"
    },
    dialogues: {
      pet_happy: "Ticklish! That feels so good! 🥰 (+2 XP)",
      pet_tired: "That's enough love for today! Thank you! 😊",
      water_happy: "Thank you so much! I feel refreshed! 💧🌱 (+5 XP)",
      sun_happy: "Sunbathing is great! I'm photosynthesizing! ☀️🌿 (+8 XP)",
      fertilize_happy: "Wow! Amazing fertilizer! I feel so strong! ⚡🌳 (+15 XP)",
      water_disabled: "Complete your habits to water me! Each completed habit gives me 1 watering charge. 💧",
      sun_disabled: "You need to complete at least 50% of today's habits to give me sun! ☀️",
      fertilize_disabled: "You need to complete all of today's habits to fertilize me! ⚡",
      sun_already: "I've had enough sun today! ☀️",
      fertilize_already: "I've already been fertilized today! 🌿",
      level_up: "Hooray! I grew and reached Level {{level}}! 🌱✨",
      all_done: "You completed all your habits today! You're amazing! 🌟",
      status_water: "Watered {{completed}}/{{total}} times today. 💧",
      growing_with_you: "I'm growing, and you are growing too 🌱",
      streak_7: "Splendid {{streak}}-day streak! New pots unlocked! 🏺",
      streak_30: "Wow! You've maintained a streak for {{streak}} days! New plants unlocked! 🌵🌹",
      streak_100: "Oh my god! Magnificent {{streak}}-day streak! You are a legend! 👑🔥"
    },
    status: {
      watered_today: "Watered {{completed}}/{{total}} today.",
      thirsty_today: "I'm thirsty... 🥺"
    },
    xp_remaining: "{{count}} XP to Lv. {{level}}",
    max_level: "Max Level ✨",
    levels: {
      1: "Sprout 🌱",
      2: "Young Plant 🌿",
      3: "Big Plant 🪴",
      4: "Blooming Plant 🌸",
      5: "Rare Plant 🌳✨"
    },
    customizer: {
      header: "Customize {{name}} 🎨",
      streak_info: "Your current best streak: {{streak}} days. Reach higher streaks to unlock new looks!",
      pots_title: "Pot Designs",
      species_title: "Plant Species",
      active: "Active",
      unlocked: "Unlocked",
      locked_by: "Locked: {{val}}",
      streak_days: "{{count}} day streak",
      rename_title: "Rename your plant",
      rename_welcome: "Name your new virtual plant! 🪴",
      rename_placeholder: "Enter a new name...",
      rename_save: "Save",
      rename_cancel: "Cancel"
    },
    pots: {
      classic: "Classic Pot",
      bronze: "Bronze Pot 🏺",
      silver: "Silver Pot 🏺",
      gold: "Gold Pot 🏺",
      gold_glow: "Glowing Gold Pot 🏺✨"
    },
    species: {
      fern: "Fern 🌿",
      cactus: "Cactus 🌵",
      rose: "Rose 🌹",
      bonsai: "Bonsai 🌳",
      rare: "Rare Plant 🌴✨"
    },
    garden: {
      title: "My Garden 🌳",
      empty: "Your garden is empty. You can plant your trees here when they reach Level 5! 🌳",
      plant_btn: "Plant in Garden 🌳",
      alert_title: "Plant in Garden?",
      alert_desc: "Do you want to plant this wonderful tree in your garden and start growing a new one? (The new plant will start from Level 1).",
      planted_date: "Planted: {{date}}",
      level_5_max: "Level 5 (Max)",
      active_plant: "Active Plant",
      level_label: "Level",
      currently_growing: "Currently growing. Will be permanently planted once it reaches Level 5!",
      locked_plot: "Locked Plot 🔒",
      not_accessible: "Not accessible yet",
      unlock_instructions: "This plot will unlock as you fill the preceding empty plots."
    }
  },
  de: {
    actions: {
      pet: "Streicheln",
      water: "Gießen",
      sun: "Sonne",
      fertilize: "Düngen"
    },
    dialogues: {
      pet_happy: "Kitzelig! Das fühlt sich so gut an! 🥰 (+2 XP)",
      pet_tired: "Genug Liebe für heute! Danke! 😊",
      water_happy: "Vielen Dank! Ich fühle mich erfrischt! 💧🌱 (+5 XP)",
      sun_happy: "Sonnenbaden ist toll! Ich betreibe Photosynthese! ☀️🌿 (+8 XP)",
      fertilize_happy: "Wow! Toller Dünger! Ich fühle mich so stark! ⚡🌳 (+15 XP)",
      water_disabled: "Vervollständige deine Gewohnheiten, um mich zu gießen! Jede abgeschlossene Gewohnheit gibt mir 1 Gießladung. 💧",
      sun_disabled: "Du musst mindestens 50 % der heutigen Gewohnheiten abschließen, um mir Sonne zu geben! ☀️",
      fertilize_disabled: "Du musst alle heutigen Gewohnheiten abschließen, um mich zu düngen! ⚡",
      sun_already: "Ich hatte heute schon genug Sonne! ☀️",
      fertilize_already: "Ich wurde heute bereits gedüngt! 🌿",
      level_up: "Hurra! Ich bin gewachsen und habe Level {{level}} erreicht! 🌱✨",
      all_done: "Du hast heute alle Gewohnheiten abgeschlossen! Du bist fantastisch! 🌟",
      status_water: "Heute {{completed}}/{{total}} Mal gegossen. 💧",
      growing_with_you: "Ich wachse, und du wächst auch 🌱",
      streak_7: "Großartige Serie von {{streak}} Tagen! Neue Töpfe freigeschaltet! 🏺",
      streak_30: "Wow! Du hast die Serie seit {{streak}} Tagen gehalten! Neue Pflanzen freigeschaltet! 🌵🌹",
      streak_100: "Mein Gott! Großartige Serie von {{streak}} Tagen! Du bist eine Legende! 👑🔥"
    },
    status: {
      watered_today: "Gegossen: {{completed}}/{{total}}.",
      thirsty_today: "Ich habe Durst... 🥺"
    },
    xp_remaining: "{{count}} XP bis Lv. {{level}}",
    max_level: "Max. Level ✨",
    levels: {
      1: "Keimling 🌱",
      2: "Junge Pflanze 🌿",
      3: "Große Pflanze 🪴",
      4: "Blühende Pflanze 🌸",
      5: "Seltene Pflanze 🌳✨"
    },
    customizer: {
      header: "{{name}} anpassen 🎨",
      streak_info: "Deine beste Serie: {{streak}} Tage. Erhöhe deine Serie für neue Designs!",
      pots_title: "Topf-Designs",
      species_title: "Pflanzenarten",
      active: "Aktiv",
      unlocked: "Freigeschaltet",
      locked_by: "Gesperrt: {{val}}",
      streak_days: "{{count}} Tage Serie",
      rename_title: "Pflanze umbenennen",
      rename_welcome: "Gib deiner neuen virtuellen Pflanze einen Namen! 🪴",
      rename_placeholder: "Neuen Namen eingeben...",
      rename_save: "Speichern",
      rename_cancel: "Abbrechen"
    },
    pots: {
      classic: "Klassischer Topf",
      bronze: "Bronzetopf 🏺",
      silver: "Silbertopf 🏺",
      gold: "Goldtopf 🏺",
      gold_glow: "Leuchtendes Gold 🏺✨"
    },
    species: {
      fern: "Farn 🌿",
      cactus: "Kaktus 🌵",
      rose: "Rose 🌹",
      bonsai: "Bonsai 🌳",
      rare: "Seltene Pflanze 🌴✨"
    },
    garden: {
      title: "Mein Garten 🌳",
      empty: "Dein Garten ist noch leer. Du kannst deine Bäume hier pflanzen, wenn sie Level 5 erreichen! 🌳",
      plant_btn: "Im Garten pflanzen 🌳",
      alert_title: "Im Garten pflanzen?",
      alert_desc: "Möchtest du diesen wunderschönen Baum in deinem Garten pflanzen und einen neuen züchten? (Die neue Pflanze startet bei Level 1).",
      planted_date: "Gepflanzt: {{date}}",
      level_5_max: "Level 5 (Max.)",
      active_plant: "Aktive Pflanze",
      level_label: "Level",
      currently_growing: "Wächst gerade. Wird dauerhaft gepflanzt, sobald Level 5 erreicht ist!",
      locked_plot: "Gesperrtes Grundstück 🔒",
      not_accessible: "Noch nicht zugänglich",
      unlock_instructions: "Dieses Grundstück wird freigeschaltet, wenn du die vorherigen leeren Grundstücke ausfüllst."
    }
  },
  es: {
    actions: {
      pet: "Mimar",
      water: "Regar",
      sun: "Sol",
      fertilize: "Abonar"
    },
    dialogues: {
      pet_happy: "¡Cosquillas! ¡Eso se siente tan bien! 🥰 (+2 XP)",
      pet_tired: "¡Suficiente amor por hoy! ¡Gracias! 😊",
      water_happy: "¡Muchas gracias! ¡Me siento refrescado! 💧🌱 (+5 XP)",
      sun_happy: "¡Tomar el sol es genial! ¡Hago fotosíntesis! ☀️🌿 (+8 XP)",
      fertilize_happy: "¡Guau! ¡Fertilizante increíble! ¡Me siento muy fuerte! ⚡🌳 (+15 XP)",
      water_disabled: "¡Completa tus hábitos para regarme! Cada hábito completado me da 1 carga de riego. 💧",
      sun_disabled: "¡Debes completar al menos el 50% de los hábitos de hoy para darme sol! ☀️",
      fertilize_disabled: "¡Debes completar todos los hábitos de hoy para fertilizarme! ⚡",
      sun_already: "¡Ya he tomado suficiente sol hoy! ☀️",
      fertilize_already: "¡Ya he sido fertilizado hoy! 🌿",
      level_up: "¡Hurra! ¡Crecí y alcancé el Nivel {{level}}! 🌱✨",
      all_done: "¡Completaste todos tus hábitos hoy! ¡Eres increíble! 🌟",
      status_water: "Regado {{completed}}/{{total}} veces hoy. 💧",
      growing_with_you: "¡Yo crezco y tú también creces! 🌱",
      streak_7: "¡Gran racha de {{streak}} días! ¡Nuevas macetas desbloqueadas! 🏺",
      streak_30: "¡Vaya! ¡Llevas una racha de {{streak}} días! ¡Nuevas plantas desbloqueadas! 🌵🌹",
      streak_100: "¡Oh Dios mío! ¡Magnífica racha de {{streak}} días! ¡Eres una leyenda! 👑🔥"
    },
    status: {
      watered_today: "Regado: {{completed}}/{{total}}.",
      thirsty_today: "Tengo sed... 🥺"
    },
    xp_remaining: "{{count}} XP para Lv. {{level}}",
    max_level: "Nivel Máx. ✨",
    levels: {
      1: "Brote 🌱",
      2: "Planta Joven 🌿",
      3: "Planta Grande 🪴",
      4: "Planta Floreciente 🌸",
      5: "Planta Rara 🌳✨"
    },
    customizer: {
      header: "Personalizar {{name}} 🎨",
      streak_info: "Tu mejor racha: {{streak}} días. ¡Aumenta tu racha para desbloquear nuevos aspectos!",
      pots_title: "Diseños de macetas",
      species_title: "Especies de plantas",
      active: "Activo",
      unlocked: "Desbloqueado",
      locked_by: "Bloqueado: {{val}}",
      streak_days: "racha de {{count}} días",
      rename_title: "Renombrar planta",
      rename_welcome: "¡Dale un nombre a tu nueva planta virtual! 🪴",
      rename_placeholder: "Ingrese un nuevo nombre...",
      rename_save: "Guardar",
      rename_cancel: "Cancelar"
    },
    pots: {
      classic: "Maceta Clásica",
      bronze: "Maceta de Bronce 🏺",
      silver: "Maceta de Plata 🏺",
      gold: "Maceta de Oro 🏺",
      gold_glow: "Oro Brillante 🏺✨"
    },
    species: {
      fern: "Helecho 🌿",
      cactus: "Cactus 🌵",
      rose: "Rosa 🌹",
      bonsai: "Bonsái 🌳",
      rare: "Planta Rara 🌴✨"
    },
    garden: {
      title: "Mi Jardín 🌳",
      empty: "Tu jardín está vacío. ¡Puedes plantar tus árboles aquí cuando alcancen el Nivel 5! 🌳",
      plant_btn: "Plantar en el Jardín 🌳",
      alert_title: "¿Plantar en el Jardín?",
      alert_desc: "¿Quieres plantar este maravilloso árbol en tu jardín y empezar a cultivar uno nuevo? (La nueva planta comenzará desde el Nivel 1).",
      planted_date: "Plantado: {{date}}",
      level_5_max: "Nivel 5 (Máx.)",
      active_plant: "Planta Activa",
      level_label: "Nivel",
      currently_growing: "Creciendo actualmente. ¡Se plantará permanentemente una vez que alcance el Nivel 5!",
      locked_plot: "Terreno Bloqueado 🔒",
      not_accessible: "No accesible todavía",
      unlock_instructions: "Este terreno se desbloqueará a medida que llenes los terrenos vacíos anteriores."
    }
  },
  fr: {
    actions: {
      pet: "Caresse",
      water: "Arrose",
      sun: "Soleil",
      fertilize: "Engrais"
    },
    dialogues: {
      pet_happy: "Chatouilleux! Ça fait du bien! 🥰 (+2 XP)",
      pet_tired: "C'est assez d'amour pour aujourd'hui! Merci! 😊",
      water_happy: "Merci beaucoup! Je me sens rafraîchi! 💧🌱 (+5 XP)",
      sun_happy: "Le bain de soleil est génial! Je fais de la photosynthèse! ☀️🌿 (+8 XP)",
      fertilize_happy: "Wow! Super engrais! Je me sens si fort! ⚡🌳 (+15 XP)",
      water_disabled: "Complétez vos habitudes pour m'arroser! Chaque habitude complétée me donne 1 charge d'arrosage. 💧",
      sun_disabled: "Vous devez compléter au moins 50% des habitudes d'aujourd'hui pour me donner du soleil! ☀️",
      fertilize_disabled: "Vous devez compléter toutes les habitudes d'aujourd'hui pour me fertiliser! ⚡",
      sun_already: "J'ai eu assez de soleil aujourd'hui! ☀️",
      fertilize_already: "J'ai déjà été fertilisé aujourd'hui! 🌿",
      level_up: "Hourra! J'ai grandi et atteint le Niveau {{level}}! 🌱✨",
      all_done: "Tu as complété toutes tes habitudes aujourd'hui! Tu es génial! 🌟",
      status_water: "Arrosé {{completed}}/{{total}} fois aujourd'hui. 💧",
      growing_with_you: "Je grandis, et tu grandis aussi 🌱",
      streak_7: "Superbe série de {{streak}} jours! Nouveaux pots débloqués! 🏺",
      streak_30: "Wow! Tu as maintenu ta série pendant {{streak}} jours! Nouvelles plantes débloquées! 🌵🌹",
      streak_100: "Mon Dieu! Magnifique série de {{streak}} jours! Tu es une légende! 👑🔥"
    },
    status: {
      watered_today: "Arrosé: {{completed}}/{{total}}.",
      thirsty_today: "J'ai soif... 🥺"
    },
    xp_remaining: "{{count}} XP vers Lv. {{level}}",
    max_level: "Niveau Max. ✨",
    levels: {
      1: "Pousse 🌱",
      2: "Jeune Plante 🌿",
      3: "Grande Plante 🪴",
      4: "Plante en Fleur 🌸",
      5: "Plante Rare 🌳✨"
    },
    customizer: {
      header: "Personnaliser {{name}} 🎨",
      streak_info: "Votre meilleure série: {{streak}} jours. Augmentez-la pour débloquer de nouveaux styles!",
      pots_title: "Modèles de pots",
      species_title: "Espèces de plantes",
      active: "Actif",
      unlocked: "Déverrouillé",
      locked_by: "Verrouillé: {{val}}",
      streak_days: "série de {{count}} jours",
      rename_title: "Renommer la plante",
      rename_welcome: "Donne un nom à ta nouvelle plante virtuelle ! 🪴",
      rename_placeholder: "Entrez un nouveau nom...",
      rename_save: "Enregistrer",
      rename_cancel: "Annuler"
    },
    pots: {
      classic: "Pot Classique",
      bronze: "Pot en Bronze 🏺",
      silver: "Pot en Argent 🏺",
      gold: "Pot en Or 🏺",
      gold_glow: "Or Brillant 🏺✨"
    },
    species: {
      fern: "Fougère 🌿",
      cactus: "Cactus 🌵",
      rose: "Rose 🌹",
      bonsai: "Bonsaï 🌳",
      rare: "Plante Rare 🌴✨"
    },
    garden: {
      title: "Mon Jardin 🌳",
      empty: "Votre jardin est vide. Vous pouvez planter vos arbres ici lorsqu'ils atteignent le Niveau 5 ! 🌳",
      plant_btn: "Planter dans le Jardin 🌳",
      alert_title: "Planter dans le Jardin ?",
      alert_desc: "Voulez-vous planter ce magnifique arbre dans votre jardin et commencer à en cultiver un nouveau ? (La nouvelle plante commencera au Niveau 1).",
      planted_date: "Planté : {{date}}",
      level_5_max: "Niveau 5 (Max)",
      active_plant: "Plante Active",
      level_label: "Niveau",
      currently_growing: "En cours de croissance. Sera plantée de manière permanente une fois qu'elle aura atteint le Niveau 5 !",
      locked_plot: "Terrain Verrouillé 🔒",
      not_accessible: "Pas encore accessible",
      unlock_instructions: "Ce terrain se déverrouillera au fur et à mesure que vous remplirez les terrains vides précédents."
    }
  },
  it: {
    actions: {
      pet: "Accarezza",
      water: "Annaffia",
      sun: "Sole",
      fertilize: "Concima"
    },
    dialogues: {
      pet_happy: "Solletico! È così bello! 🥰 (+2 XP)",
      pet_tired: "Basta amore per oggi! Grazie! 😊",
      water_happy: "Grazie mille! Mi sento rinfrescato! 💧🌱 (+5 XP)",
      sun_happy: "Prendere il sole è fantastico! Sto fotosintetizzando! ☀️🌿 (+8 XP)",
      fertilize_happy: "Wow! Concime fantastico! Mi sento così forte! ⚡🌳 (+15 XP)",
      water_disabled: "Completa le tue abitudini per annaffiarmi! Ogni abitudine completata mi dà 1 carica di annaffiatura. 💧",
      sun_disabled: "Devi completare almeno il 50% delle abitudini di oggi per darmi il sole! ☀️",
      fertilize_disabled: "Devi completare tutte le abitudini di oggi per concimarmi! ⚡",
      sun_already: "Ho già preso abbastanza sole oggi! ☀️",
      fertilize_already: "Sono già stato concimato oggi! 🌿",
      level_up: "Evviva! Sono cresciuto e ho raggiunto il Livello {{level}}! 🌱✨",
      all_done: "Hai completato tutte le tue abitudini oggi! Sei fantastico! 🌟",
      status_water: "Annaffiato {{completed}}/{{total}} volte oggi. 💧",
      growing_with_you: "Io cresco, e cresci anche tu 🌱",
      streak_7: "Splendida serie di {{streak}} giorni! Nuovi vasi sbloccati! 🏺",
      streak_30: "Wow! Hai mantenuto la serie per {{streak}} giorni! Nuove piante sbloccate! 🌵🌹",
      streak_100: "Mio Dio! Magnifica serie di {{streak}} giorni! Sei una leggenda! 👑🔥"
    },
    status: {
      watered_today: "Annaffiato: {{completed}}/{{total}}.",
      thirsty_today: "Ho sete... 🥺"
    },
    xp_remaining: "{{count}} XP a Lv. {{level}}",
    max_level: "Livello Max. ✨",
    levels: {
      1: "Germoglio 🌱",
      2: "Pianta Giovane 🌿",
      3: "Pianta Grande 🪴",
      4: "Pianta Fiorita 🌸",
      5: "Pianta Rara 🌳✨"
    },
    customizer: {
      header: "Personalizza {{name}} 🎨",
      streak_info: "La tua serie migliore: {{streak}} giorni. Continua per sbloccare nuovi stili!",
      pots_title: "Design dei vasi",
      species_title: "Specie di piante",
      active: "Attivo",
      unlocked: "Sbloccato",
      locked_by: "Bloccato: {{val}}",
      streak_days: "serie di {{count}} giorni",
      rename_title: "Rinomina la pianta",
      rename_welcome: "Dai un nome alla tua nuova pianta virtuale! 🪴",
      rename_placeholder: "Inserisci un nuovo nome...",
      rename_save: "Salva",
      rename_cancel: "Annulla"
    },
    pots: {
      classic: "Vaso Classico",
      bronze: "Vaso di Bronzo 🏺",
      silver: "Vaso d'Argento 🏺",
      gold: "Vaso d'Oro 🏺",
      gold_glow: "Oro Brillante 🏺✨"
    },
    species: {
      fern: "Felce 🌿",
      cactus: "Cactus 🌵",
      rose: "Rosa 🌹",
      bonsai: "Bonsai 🌳",
      rare: "Piante Rare 🌴✨"
    },
    garden: {
      title: "Il Mio Giardino 🌳",
      empty: "Il tuo giardino è vuoto. Puoi piantare i tuoi alberi qui quando raggiungono il Livello 5! 🌳",
      plant_btn: "Pianta nel Giardino 🌳",
      alert_title: "Pianta nel Giardino?",
      alert_desc: "Vuoi piantare questo meraviglioso albero nel tuo giardino e iniziare a coltivarne uno nuovo? (La nuova pianta inizierà dal Livello 1).",
      planted_date: "Piantato: {{date}}",
      level_5_max: "Livello 5 (Max)",
      active_plant: "Pianta Attiva",
      level_label: "Livello",
      currently_growing: "Attualmente in crescita. Verrà piantata permanentemente una volta raggiunto il Livello 5!",
      locked_plot: "Terreno Bloccato 🔒",
      not_accessible: "Non ancora accessibile",
      unlock_instructions: "Questo terreno si sbloccherà man mano che riempirai i terreni vuoti precedenti."
    }
  },
  zh: {
    actions: {
      pet: "抚摸",
      water: "浇水",
      sun: "晒太阳",
      fertilize: "施肥"
    },
    dialogues: {
      pet_happy: "好痒啊！这太舒服了！ 🥰 (+2 XP)",
      pet_tired: "今天的爱意足够了！谢谢！ 😊",
      water_happy: "非常感谢！我觉得焕然一新！ 💧🌱 (+5 XP)",
      sun_happy: "日光浴太棒了！我正在进行光合作用！ ☀️🌿 (+8 XP)",
      fertilize_happy: "哇！神奇的肥料！我感觉好强壮！ ⚡🌳 (+15 XP)",
      water_disabled: "完成你的习惯来为我浇水！每个完成的习惯都会给我 1 次浇水次数。 💧",
      sun_disabled: "你需要完成今天至少 50% 的习惯才能让我晒太阳！ ☀️",
      fertilize_disabled: "你需要完成今天所有的习惯才能为我施肥！ ⚡",
      sun_already: "今天晒的太阳已经够多了！ ☀️",
      fertilize_already: "今天已经施过肥了！ 🌿",
      level_up: "太好了！我长大并达到了等级 {{level}}！ 🌱✨",
      all_done: "你今天完成了所有的习惯！太棒了！ 🌟",
      status_water: "今天浇水 {{completed}}/{{total}} 次。 💧",
      growing_with_you: "我在成长，你也在成长 🌱",
      streak_7: "棒极了的 {{streak}} 天连续！新花盆已解锁！ 🏺",
      streak_30: "哇！你已经连续坚持了 {{streak}} 天！新植物已解锁！ 🌵🌹",
      streak_100: "我的天啊！宏伟 of {{streak}} 天连续！你就是传奇！ 👑🔥"
    },
    status: {
      watered_today: "今天浇水: {{completed}}/{{total}}。",
      thirsty_today: "我很渴... 🥺"
    },
    xp_remaining: "距 Lv. {{level}} 还需 {{count}} XP",
    max_level: "最高等级 ✨",
    levels: {
      1: "幼苗 🌱",
      2: "幼株 🌿",
      3: "大植株 🪴",
      4: "开花植株 🌸",
      5: "稀有植物 🌳✨"
    },
    customizer: {
      header: "自定义 {{name}} 🎨",
      streak_info: "你当前最高连续天数: {{streak}} 天。连续天数越高，解锁的外观越多！",
      pots_title: "花盆设计",
      species_title: "植物种类",
      active: "已启用",
      unlocked: "已解锁",
      locked_by: "未解锁: {{val}}",
      streak_days: "连续 {{count}} 天",
      rename_title: "重命名植物",
      rename_welcome: "给你的新虚拟植物起个名字吧！ 🪴",
      rename_placeholder: "输入新名称...",
      rename_save: "保存",
      rename_cancel: "取消"
    },
    pots: {
      classic: "经典花盆",
      bronze: "青铜花盆 🏺",
      silver: "白银花盆 🏺",
      gold: "黄金花盆 🏺",
      gold_glow: "发光的黄金盆 🏺✨"
    },
    species: {
      fern: "蕨类植物 🌿",
      cactus: "仙人掌 🌵",
      rose: "玫瑰 🌹",
      bonsai: "盆景树 🌳",
      rare: "珍稀植物 🌴✨"
    },
    garden: {
      title: "我的花园 🌳",
      empty: "你的花园还是空的。当你的树达到等级 5 时，你可以把它们种植在这里！ 🌳",
      plant_btn: "种植在花园中 🌳",
      alert_title: "种植在花园中？",
      alert_desc: "你想把这棵神奇的树种植在你的花园里并开始培育一棵新树吗？（新植物将从等级 1 开始）。",
      planted_date: "种植时间: {{date}}",
      level_5_max: "等级 5 (最高)",
      active_plant: "活动植物",
      level_label: "等级",
      currently_growing: "目前正在生长。一旦达到等级 5，将永久种植在花园中！",
      locked_plot: "未解锁区域 🔒",
      not_accessible: "尚不可访问",
      unlock_instructions: "当你填满前面的空区域时，该区域将被解锁。"
    }
  },
  ar: {
    actions: {
      pet: "مداعبة",
      water: "ريّ",
      sun: "شمس",
      fertilize: "تسميد"
    },
    dialogues: {
      pet_happy: "أشعر بالدغدغة! هذا لطيف جداً! 🥰 (+2 XP)",
      pet_tired: "هذا يكفي من الحب لليوم! شكراً لك! 😊",
      water_happy: "شكراً جزيلاً لك! أشعر بالانتعاش! 💧🌱 (+5 XP)",
      sun_happy: "حمام الشمس رائع! أنا أقوم بالتمثيل الضوئي! ☀️🌿 (+8 XP)",
      fertilize_happy: "واو! سماد مذهل! أشعر بقوة كبيرة! ⚡🌳 (+15 XP)",
      water_disabled: "أكمل عاداتك لتسقيني! كل عادة مكتملة تمنحني شحنة سقاية واحدة. 💧",
      sun_disabled: "تحتاج إلى إكمال 50% على الأقل من عادات اليوم لتعطيني شمسًا! ☀️",
      fertilize_disabled: "تحتاج إلى إكمال جميع عادات اليوم لتسميدي! ⚡",
      sun_already: "لقد حصلت على ما يكفي من الشمس اليوم! ☀️",
      fertilize_already: "لقد تم تسميدي اليوم بالفعل! 🌿",
      level_up: "مرحى! لقد كبرت ووصلت للمستوى {{level}}! 🌱✨",
      all_done: "لقد أكملت جميع عاداتك اليوم! أنت رائع! 🌟",
      status_water: "سقي {{completed}}/{{total}} مرات اليوم. 💧",
      growing_with_you: "أنا أنمو، وأنت تنمو أيضاً 🌱",
      streak_7: "سلسلة رائعة من {{streak}} أيام! تم فتح أحواض جديدة! 🏺",
      streak_30: "واو! لقد حافظت على سلسلة متتالية لمدة {{streak}} يوماً! تم فتح نباتات جديدة! 🌵🌹",
      streak_100: "يا إلهي! سلسلة متتالية رائعة من {{streak}} يوماً! أنت أسطورة! 👑🔥"
    },
    status: {
      watered_today: "سقي: {{completed}}/{{total}} اليوم.",
      thirsty_today: "أنا عطشان... 🥺"
    },
    xp_remaining: "{{count}} XP إلى Lv. {{level}}",
    max_level: "المستوى الأقصى ✨",
    levels: {
      1: "برعم 🌱",
      2: "نبتة صغيرة 🌿",
      3: "نبتة كبيرة 🪴",
      4: "نبتة مزهرة 🌸",
      5: "نبتة نادرة 🌳✨"
    },
    customizer: {
      header: "تخصيص {{name}} 🎨",
      streak_info: "أفضل سلسلة متتالية حالية: {{streak}} أيام. حقق سلاسل أطول لفتح أشكال جديدة!",
      pots_title: "تصاميم الأحواض",
      species_title: "أنواع النباتات",
      active: "نشط",
      unlocked: "تم إلغاء القفل",
      locked_by: "مغلق: {{val}}",
      streak_days: "سلسلة {{count}} أيام",
      rename_title: "إعادة تسمية النبات",
      rename_welcome: "سمِّ نبتتك الافتراضية الجديدة! 🪴",
      rename_placeholder: "أدخل اسمًا جديدًا...",
      rename_save: "حفظ",
      rename_cancel: "إلغاء"
    },
    pots: {
      classic: "حوض كلاسيكي",
      bronze: "حوض برونزي 🏺",
      silver: "حوض فضي 🏺",
      gold: "حوض ذهبي 🏺",
      gold_glow: "حوض ذهبي متوهج 🏺✨"
    },
    species: {
      fern: "سرخس 🌿",
      cactus: "صبار 🌵",
      rose: "وردة 🌹",
      bonsai: "بونساي 🌳",
      rare: "نبتة نادرة 🌴✨"
    },
    garden: {
      title: "حديقتي 🌳",
      empty: "حديقتك فارغة. يمكنك زراعة أشجارك هنا عندما تصل إلى المستوى 5! 🌳",
      plant_btn: "ازرع في الحديقة 🌳",
      alert_title: "ازرع في الحديقة؟",
      alert_desc: "هل تريد زراعة هذه الشجرة الرائعة في حديقتك والبدء في زراعة واحدة جديدة؟ (النبتة الجديدة ستبدأ من المستوى 1).",
      planted_date: "تمت الزراعة: {{date}}",
      level_5_max: "المستوى 5 (الأقصى)",
      active_plant: "النبتة النشطة",
      level_label: "المستوى",
      currently_growing: "تنمو حالياً. ستزرع بشكل دائم بمجرد وصولها إلى المستوى 5!",
      locked_plot: "موقع مغلق 🔒",
      not_accessible: "غير متاح بعد",
      unlock_instructions: "سيتم فتح هذا الموقع عندما تملأ المواقع الفارغة السابقة."
    }
  }
};

const translateLocal = (key, currentLang, variables = {}) => {
  const lang = (currentLang || "en").split("-")[0].toLowerCase();
  const dict = LOCAL_TRANSLATIONS[lang] || LOCAL_TRANSLATIONS.en;
  let val = dict;
  const parts = key.split(".");
  for (const part of parts) {
    if (val && val[part] !== undefined) {
      val = val[part];
    } else {
      val = null;
      break;
    }
  }
  if (val === null || val === undefined) {
    val = LOCAL_TRANSLATIONS.en;
    for (const part of parts) {
      if (val && val[part] !== undefined) {
        val = val[part];
      } else {
        val = key;
        break;
      }
    }
  }
  if (typeof val === "string") {
    let result = val;
    Object.keys(variables).forEach(k => {
      result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), variables[k]);
    });
    return result;
  }
  return val;
};

const VirtualPlant = ({ userId = "", virtualPlantState = null, onSyncState = null, totalExperiencePoints = 0, todaysUserHabit = [], onAwardXP = null }) => {
  const { t, i18n } = useTranslation();
  const { theme, isDark } = useTheme();
  const { colors } = theme;

  const getStorageKey = useCallback((subKey) => {
    return userId ? `growy.${userId.toLowerCase()}.${subKey}` : `growy.${subKey}`;
  }, [userId]);

  const tLocal = useCallback((key, options = {}) => {
    const hasTranslation = i18n.exists(key);
    if (hasTranslation) {
      return t(key, options);
    }
    const localKey = key.startsWith("virtual_plant.") ? key.replace("virtual_plant.", "") : key;
    const currentLang = i18n.language || "az";
    return translateLocal(localKey, currentLang, options);
  }, [t, i18n]);

  // Migrate any mixed-case growy keys to lowercase (synchronous on first render)
  const isMigrated = useRef(false);
  if (!isMigrated.current && userId) {
    isMigrated.current = true;
    const lowerUserId = userId.toLowerCase();
    if (userId !== lowerUserId) {
      try {
        const keys = storage.getAllKeys();
        keys.forEach(key => {
          const oldPrefix = `growy.${userId}.`;
          if (key.startsWith(oldPrefix)) {
            const suffix = key.slice(oldPrefix.length);
            const newKey = `growy.${lowerUserId}.${suffix}`;
            if (storage.contains(key)) {
              if (
                suffix === "xp" ||
                suffix === "level" ||
                suffix === "wateredCountToday" ||
                suffix === "maxHabitsToday" ||
                suffix === "maxCompletedHabitsToday" ||
                suffix === "petCountToday" ||
                suffix.startsWith("completedCount.")
              ) {
                const val = storage.getNumber(key);
                if (typeof val === "number") storage.set(newKey, val);
              } else if (
                suffix === "hasNamedPlant" ||
                suffix === "sunnedToday" ||
                suffix === "fertilizedToday"
              ) {
                const val = storage.getBoolean(key);
                if (typeof val === "boolean") storage.set(newKey, val);
              } else {
                const val = storage.getString(key);
                if (typeof val === "string") storage.set(newKey, val);
              }
              storage.delete(key);
            }
          }
        });
      } catch (e) {
        console.error("Error migrating MMKV keys to lowercase:", e);
      }
    }
  }

  // Seed local storage from backend state on initial render if no local data exists/is higher
  const isSeeded = useRef(false);
  if (!isSeeded.current && userId) {
    isSeeded.current = true;
    const localXP = storage.getNumber(getStorageKey("xp"));
    const hasLocal = typeof localXP === "number" && storage.contains(getStorageKey("xp"));

    let shouldSeed = !hasLocal;
    if (virtualPlantState) {
      try {
        const parsed = JSON.parse(virtualPlantState);
        if (parsed && typeof parsed.xp === "number") {
          if (!hasLocal || localXP < parsed.xp) {
            shouldSeed = true;
          }
        }
      } catch (e) {
        console.error("Error parsing virtualPlantState for seeding check:", e);
      }
    }

    if (shouldSeed && virtualPlantState) {
      try {
        const parsed = JSON.parse(virtualPlantState);
        if (parsed) {
          if (typeof parsed.xp === "number") storage.set(getStorageKey("xp"), parsed.xp);
          if (typeof parsed.level === "number") storage.set(getStorageKey("level"), parsed.level);
          if (parsed.selectedPot) storage.set(getStorageKey("selectedPot"), parsed.selectedPot);
          if (parsed.selectedPlant) storage.set(getStorageKey("selectedPlant"), parsed.selectedPlant);
          if (parsed.plantName) storage.set(getStorageKey("plantName"), parsed.plantName);
          if (typeof parsed.hasNamedPlant === "boolean") storage.set(getStorageKey("hasNamedPlant"), parsed.hasNamedPlant);
          if (parsed.lastActionDate) storage.set(getStorageKey("lastActionDate"), parsed.lastActionDate);
          if (typeof parsed.wateredCountToday === "number") storage.set(getStorageKey("wateredCountToday"), parsed.wateredCountToday);
          if (typeof parsed.sunnedToday === "boolean") storage.set(getStorageKey("sunnedToday"), parsed.sunnedToday);
          if (typeof parsed.fertilizedToday === "boolean") storage.set(getStorageKey("fertilizedToday"), parsed.fertilizedToday);
          if (typeof parsed.maxHabitsToday === "number") storage.set(getStorageKey("maxHabitsToday"), parsed.maxHabitsToday);
          if (typeof parsed.maxCompletedHabitsToday === "number") storage.set(getStorageKey("maxCompletedHabitsToday"), parsed.maxCompletedHabitsToday);
          if (parsed.lastCompletedDate) storage.set(getStorageKey("lastCompletedDate"), parsed.lastCompletedDate);
          if (parsed.lastPetDate) storage.set(getStorageKey("lastPetDate"), parsed.lastPetDate);
          if (typeof parsed.petCountToday === "number") storage.set(getStorageKey("petCountToday"), parsed.petCountToday);
          if (parsed.completedCountTodayMap && typeof parsed.completedCountTodayMap === "object") {
            Object.keys(parsed.completedCountTodayMap).forEach(k => {
              storage.set(getStorageKey(`completedCount.${k}`), parsed.completedCountTodayMap[k]);
            });
          }
        }
      } catch (e) {
        console.error("Error seeding Virtual Plant state from backend:", e);
      }
    }
  }

  // Determine today's date string
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Calculate Habit Completion Today
  const { totalHabits, completedHabits, completionRate } = useMemo(() => {
    const total = todaysUserHabit ? todaysUserHabit.length : 0;
    const completed = todaysUserHabit
      ? todaysUserHabit.filter(h => {
        const s = h.status?.toLowerCase();
        return s === "completed" || s === "done";
      }).length
      : 0;
    const rate = total > 0 ? completed / total : 0;
    return { totalHabits: total, completedHabits: completed, completionRate: rate };
  }, [todaysUserHabit]);

  // Retrieve arrays of strings dynamically using i18next
  const thirstyDialogues = useMemo(() => t("virtual_plant.thirsty", { returnObjects: true }) || [], [t]);
  const growingDialogues = useMemo(() => t("virtual_plant.growing", { returnObjects: true }) || [], [t]);
  const bloomingDialogues = useMemo(() => t("virtual_plant.blooming", { returnObjects: true }) || [], [t]);
  const generalDialogues = useMemo(() => t("virtual_plant.general", { returnObjects: true }) || [], [t]);

  // MMKV Persistent states for Growy
  const [checklistCompleted] = useMMKVString("user.onboarding_checklist_completed");
  const [plantXP, setPlantXP] = useState(() => storage.getNumber(getStorageKey("xp")) || 0);
  const [plantLevel, setPlantLevel] = useState(() => storage.getNumber(getStorageKey("level")) || 1);
  const [selectedPot, setSelectedPot] = useState(() => storage.getString(getStorageKey("selectedPot")) || "classic");
  const [selectedPlant, setSelectedPlant] = useState(() => storage.getString(getStorageKey("selectedPlant")) || "fern");
  const [garden, setGarden] = useState(() => {
    const saved = storage.getString(getStorageKey("garden"));
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing local garden data on init:", e);
      }
    }
    return [];
  });
  const [plantName, setPlantName] = useState(() => storage.getString(getStorageKey("plantName")) || "...");
  const [hasNamedPlant, setHasNamedPlant] = useState(() => storage.getBoolean(getStorageKey("hasNamedPlant")) || false);
  const [isRenameModalVisible, setRenameModalVisible] = useState(false);
  const [renameInput, setRenameInput] = useState("");

  const [wateredCount, setWateredCount] = useState(() => {
    const lastDate = storage.getString(getStorageKey("lastActionDate")) || "";
    return lastDate === todayStr ? (storage.getNumber(getStorageKey("wateredCountToday")) || 0) : 0;
  });
  const [sunnedToday, setSunnedToday] = useState(() => {
    const lastDate = storage.getString(getStorageKey("lastActionDate")) || "";
    return lastDate === todayStr ? (storage.getBoolean(getStorageKey("sunnedToday")) || false) : false;
  });
  const [fertilizedToday, setFertilizedToday] = useState(() => {
    const lastDate = storage.getString(getStorageKey("lastActionDate")) || "";
    return lastDate === todayStr ? (storage.getBoolean(getStorageKey("fertilizedToday")) || false) : false;
  });

  const [maxHabitsToday, setMaxHabitsToday] = useState(() => {
    const lastDate = storage.getString(getStorageKey("lastActionDate")) || "";
    const currentTotal = todaysUserHabit ? todaysUserHabit.length : 0;
    if (lastDate === todayStr) {
      const storedMax = storage.getNumber(getStorageKey("maxHabitsToday"));
      return typeof storedMax === "number" ? Math.max(storedMax, currentTotal) : currentTotal;
    }
    return currentTotal;
  });

  const [maxCompletedHabitsToday, setMaxCompletedHabitsToday] = useState(() => {
    const lastDate = storage.getString(getStorageKey("lastActionDate")) || "";
    const currentCompleted = todaysUserHabit
      ? todaysUserHabit.filter(h => {
        const s = h.status?.toLowerCase();
        return s === "completed" || s === "done";
      }).length
      : 0;
    if (lastDate === todayStr) {
      const storedMax = storage.getNumber(getStorageKey("maxCompletedHabitsToday"));
      return typeof storedMax === "number" ? Math.max(storedMax, currentCompleted) : currentCompleted;
    }
    return currentCompleted;
  });

  useEffect(() => {
    const lastActionDate = storage.getString(getStorageKey("lastActionDate")) || "";
    if (lastActionDate !== todayStr) {
      storage.set(getStorageKey("lastActionDate"), todayStr);
      storage.set(getStorageKey("wateredCountToday"), 0);
      storage.set(getStorageKey("sunnedToday"), false);
      storage.set(getStorageKey("fertilizedToday"), false);
      storage.set(getStorageKey("maxHabitsToday"), totalHabits);
      storage.set(getStorageKey("maxCompletedHabitsToday"), completedHabits);
      setWateredCount(0);
      setSunnedToday(false);
      setFertilizedToday(false);
      setMaxHabitsToday(totalHabits);
      setMaxCompletedHabitsToday(completedHabits);
    }
  }, [todayStr, totalHabits, completedHabits, getStorageKey]);

  useEffect(() => {
    if (totalHabits > maxHabitsToday) {
      storage.set(getStorageKey("maxHabitsToday"), totalHabits);
      setMaxHabitsToday(totalHabits);
    }
  }, [totalHabits, maxHabitsToday, getStorageKey]);

  useEffect(() => {
    if (completedHabits > maxCompletedHabitsToday) {
      storage.set(getStorageKey("maxCompletedHabitsToday"), completedHabits);
      setMaxCompletedHabitsToday(completedHabits);
    }
  }, [completedHabits, maxCompletedHabitsToday, getStorageKey]);

  const lastSyncedRef = useRef(virtualPlantState);

  useEffect(() => {
    // Auto-prompt naming modal for new plants on mount
    const alreadyNamed = storage.getBoolean(getStorageKey("hasNamedPlant")) || false;
    if (!alreadyNamed) {
      setRenameInput("");
      setRenameModalVisible(true);
    }
  }, [userId, getStorageKey]);

  useEffect(() => {
    // Schedule a plant watering push notification reminder based on watered status
    try {
      schedulePlantWateringReminder(wateredCount > 0, plantName);
    } catch (e) {
      console.error("Error scheduling plant watering reminder:", e);
    }
  }, [wateredCount, plantName]);

  // Note: We no longer synchronize totalExperiencePoints directly to plantXP and plantLevel.
  // The plant now has its own separate XP and Level progression.

  // Synchronize MMKV storage and React state with incoming virtualPlantState from the server
  useEffect(() => {
    if (!userId || !virtualPlantState) return;
    try {
      const parsed = JSON.parse(virtualPlantState);
      if (parsed) {
        const localXP = storage.getNumber(getStorageKey("xp")) || 0;
        const localLevel = storage.getNumber(getStorageKey("level")) || 1;

        if (parsed.xp !== undefined && parsed.xp !== localXP) {
          storage.set(getStorageKey("xp"), parsed.xp);
          setPlantXP(parsed.xp);
        }
        if (parsed.level !== undefined && parsed.level !== localLevel) {
          storage.set(getStorageKey("level"), parsed.level);
          setPlantLevel(parsed.level);
        }
        if (parsed.garden !== undefined) {
          const localGardenStr = storage.getString(getStorageKey("garden")) || "[]";
          const incomingGardenStr = JSON.stringify(parsed.garden);
          if (incomingGardenStr !== localGardenStr) {
            storage.set(getStorageKey("garden"), incomingGardenStr);
            setGarden(parsed.garden);
          }
        }
        if (parsed.selectedPot !== undefined) {
          const localPot = storage.getString(getStorageKey("selectedPot")) || "classic";
          if (parsed.selectedPot !== localPot) {
            storage.set(getStorageKey("selectedPot"), parsed.selectedPot);
            setSelectedPot(parsed.selectedPot);
          }
        }
        if (parsed.selectedPlant !== undefined) {
          const localPlant = storage.getString(getStorageKey("selectedPlant")) || "fern";
          if (parsed.selectedPlant !== localPlant) {
            storage.set(getStorageKey("selectedPlant"), parsed.selectedPlant);
            setSelectedPlant(parsed.selectedPlant);
          }
        }
        if (parsed.plantName !== undefined) {
          const localName = storage.getString(getStorageKey("plantName")) || "...";
          if (parsed.plantName !== localName) {
            storage.set(getStorageKey("plantName"), parsed.plantName);
            setPlantName(parsed.plantName);
          }
        }
        if (parsed.hasNamedPlant !== undefined) {
          const localHasNamed = storage.getBoolean(getStorageKey("hasNamedPlant")) || false;
          if (parsed.hasNamedPlant !== localHasNamed) {
            storage.set(getStorageKey("hasNamedPlant"), parsed.hasNamedPlant);
            setHasNamedPlant(parsed.hasNamedPlant);
          }
        }

        if (parsed.lastActionDate !== undefined) {
          const localLastActionDate = storage.getString(getStorageKey("lastActionDate")) || "";
          if (parsed.lastActionDate !== localLastActionDate) {
            storage.set(getStorageKey("lastActionDate"), parsed.lastActionDate);
          }
        }
        if (parsed.wateredCountToday !== undefined) {
          const localWateredCount = storage.getNumber(getStorageKey("wateredCountToday")) || 0;
          if (parsed.wateredCountToday !== localWateredCount) {
            storage.set(getStorageKey("wateredCountToday"), parsed.wateredCountToday);
            setWateredCount(parsed.wateredCountToday);
          }
        }
        if (parsed.sunnedToday !== undefined) {
          const localSunnedToday = storage.getBoolean(getStorageKey("sunnedToday")) || false;
          if (parsed.sunnedToday !== localSunnedToday) {
            storage.set(getStorageKey("sunnedToday"), parsed.sunnedToday);
            setSunnedToday(parsed.sunnedToday);
          }
        }
        if (parsed.fertilizedToday !== undefined) {
          const localFertilizedToday = storage.getBoolean(getStorageKey("fertilizedToday")) || false;
          if (parsed.fertilizedToday !== localFertilizedToday) {
            storage.set(getStorageKey("fertilizedToday"), parsed.fertilizedToday);
            setFertilizedToday(parsed.fertilizedToday);
          }
        }
        if (parsed.maxHabitsToday !== undefined) {
          const localMaxHabits = storage.getNumber(getStorageKey("maxHabitsToday")) || 0;
          if (parsed.maxHabitsToday !== localMaxHabits) {
            storage.set(getStorageKey("maxHabitsToday"), parsed.maxHabitsToday);
            setMaxHabitsToday(parsed.maxHabitsToday);
          }
        }
        if (parsed.maxCompletedHabitsToday !== undefined) {
          const localMaxCompleted = storage.getNumber(getStorageKey("maxCompletedHabitsToday")) || 0;
          if (parsed.maxCompletedHabitsToday !== localMaxCompleted) {
            storage.set(getStorageKey("maxCompletedHabitsToday"), parsed.maxCompletedHabitsToday);
            setMaxCompletedHabitsToday(parsed.maxCompletedHabitsToday);
          }
        }
        if (parsed.lastCompletedDate !== undefined) {
          const localLastCompletedDate = storage.getString(getStorageKey("lastCompletedDate")) || "";
          if (parsed.lastCompletedDate !== localLastCompletedDate) {
            storage.set(getStorageKey("lastCompletedDate"), parsed.lastCompletedDate);
          }
        }
        if (parsed.lastPetDate !== undefined) {
          const localLastPetDate = storage.getString(getStorageKey("lastPetDate")) || "";
          if (parsed.lastPetDate !== localLastPetDate) {
            storage.set(getStorageKey("lastPetDate"), parsed.lastPetDate);
          }
        }
        if (parsed.petCountToday !== undefined) {
          const localPetCount = storage.getNumber(getStorageKey("petCountToday")) || 0;
          if (parsed.petCountToday !== localPetCount) {
            storage.set(getStorageKey("petCountToday"), parsed.petCountToday);
          }
        }
        if (parsed.completedCountTodayMap && typeof parsed.completedCountTodayMap === "object") {
          Object.keys(parsed.completedCountTodayMap).forEach(k => {
            const localVal = storage.getNumber(getStorageKey(`completedCount.${k}`)) || 0;
            if (parsed.completedCountTodayMap[k] !== localVal) {
              storage.set(getStorageKey(`completedCount.${k}`), parsed.completedCountTodayMap[k]);
            }
          });
        }

        lastSyncedRef.current = virtualPlantState;
      }
    } catch (e) {
      console.error("Error syncing virtualPlantState to local state:", e);
    }
  }, [virtualPlantState, userId, getStorageKey]);

  useEffect(() => {
    const completedCountTodayMap = {};
    completedCountTodayMap[todayStr] = storage.getNumber(getStorageKey(`completedCount.${todayStr}`)) || 0;

    const stateObj = {
      xp: storage.getNumber(getStorageKey("xp")) || 0,
      level: storage.getNumber(getStorageKey("level")) || 1,
      selectedPot: storage.getString(getStorageKey("selectedPot")) || "classic",
      selectedPlant: storage.getString(getStorageKey("selectedPlant")) || "fern",
      plantName: storage.getString(getStorageKey("plantName")) || "...",
      hasNamedPlant: storage.getBoolean(getStorageKey("hasNamedPlant")) || false,
      lastActionDate: storage.getString(getStorageKey("lastActionDate")) || "",
      wateredCountToday: storage.getNumber(getStorageKey("wateredCountToday")) || 0,
      sunnedToday: storage.getBoolean(getStorageKey("sunnedToday")) || false,
      fertilizedToday: storage.getBoolean(getStorageKey("fertilizedToday")) || false,
      maxHabitsToday: storage.getNumber(getStorageKey("maxHabitsToday")) || 0,
      maxCompletedHabitsToday: storage.getNumber(getStorageKey("maxCompletedHabitsToday")) || 0,
      lastCompletedDate: storage.getString(getStorageKey("lastCompletedDate")) || "",
      lastPetDate: storage.getString(getStorageKey("lastPetDate")) || "",
      petCountToday: storage.getNumber(getStorageKey("petCountToday")) || 0,
      completedCountTodayMap,
      onboardingChecklistCompleted: checklistCompleted === "true",
      garden: garden
    };

    const stateStr = JSON.stringify(stateObj);
    if (stateStr !== lastSyncedRef.current) {
      lastSyncedRef.current = stateStr;
      if (onSyncState) {
        onSyncState(stateStr);
      }
    }
  }, [
    plantXP,
    plantLevel,
    selectedPot,
    selectedPlant,
    plantName,
    hasNamedPlant,
    wateredCount,
    sunnedToday,
    fertilizedToday,
    maxHabitsToday,
    maxCompletedHabitsToday,
    todayStr,
    getStorageKey,
    onSyncState,
    virtualPlantState,
    checklistCompleted,
    garden
  ]);


  // Compute best streak of active habits
  const bestStreak = useMemo(() => {
    if (!todaysUserHabit || todaysUserHabit.length === 0) return 0;
    return Math.max(...todaysUserHabit.map(h => Math.max(h.longestStreak || 0, h.currentStreak || 0)), 0);
  }, [todaysUserHabit]);

  // Auto-XP award system when habits are completed
  const addPlantXP = useCallback((amount, message = null) => {
    // 1. Update the plant's own XP and Level locally (which will sync to backend via virtualPlantState)
    const currentXP = storage.getNumber(getStorageKey("xp")) || 0;
    const newXP = currentXP + amount;
    storage.set(getStorageKey("xp"), newXP);
    setPlantXP(newXP);

    // Level Curve calculation
    let newLevel = 1;
    if (newXP >= 450) newLevel = 5;
    else if (newXP >= 200) newLevel = 4;
    else if (newXP >= 80) newLevel = 3;
    else if (newXP >= 20) newLevel = 2;
    else newLevel = 1;

    const currentLevel = storage.getNumber(getStorageKey("level")) || 1;
    if (newLevel > currentLevel) {
      storage.set(getStorageKey("level"), newLevel);
      setPlantLevel(newLevel);
      setSpeechText(tLocal("virtual_plant.dialogues.level_up", { level: newLevel }));
    }

    // 2. Award XP to the user's main profile as a reward for caring for the plant
    if (onAwardXP) {
      onAwardXP(amount, message);
    }
  }, [onAwardXP, tLocal, getStorageKey]);

  // Plant Development Level Requirements
  const levelRequirements = {
    1: { min: 0, max: 20, name: tLocal("virtual_plant.levels.1") },
    2: { min: 20, max: 80, name: tLocal("virtual_plant.levels.2") },
    3: { min: 80, max: 200, name: tLocal("virtual_plant.levels.3") },
    4: { min: 200, max: 450, name: tLocal("virtual_plant.levels.4") },
    5: { min: 450, max: 800, name: tLocal("virtual_plant.levels.5") },
  };

  const currentLevelReq = levelRequirements[plantLevel] || levelRequirements[5];
  const plantXPProgress = plantXP - currentLevelReq.min;
  const plantXPTotal = currentLevelReq.max - currentLevelReq.min;
  const plantXPPercentage = Math.min(Math.max((plantXPProgress / plantXPTotal) * 100, 0), 100);
  const xpRemaining = Math.max(0, currentLevelReq.max - plantXP);

  // Selected Plant Emojis Mapping
  const plantEmoji = useMemo(() => {
    if (selectedPlant === "cactus") {
      if (plantLevel === 1) return "🌵";
      if (plantLevel === 2) return "🌵";
      if (plantLevel === 3) return "🏜️";
      if (plantLevel === 4) return "🌵✨";
      return "🌵👑";
    }
    if (selectedPlant === "rose") {
      if (plantLevel === 1) return "🌱";
      if (plantLevel === 2) return "🌿";
      if (plantLevel === 3) return "🌹";
      if (plantLevel === 4) return "💐";
      return "🌺✨";
    }
    if (selectedPlant === "bonsai") {
      if (plantLevel === 1) return "🌱";
      if (plantLevel === 2) return "🪴";
      if (plantLevel === 3) return "🌳";
      if (plantLevel === 4) return "🌲";
      return "🌳✨";
    }
    if (selectedPlant === "rare") {
      if (plantLevel === 1) return "🌱";
      if (plantLevel === 2) return "🌿";
      if (plantLevel === 3) return "🌴";
      if (plantLevel === 4) return "🌴✨";
      return "🌴👑";
    }
    // Default: Fern
    if (plantLevel === 1) return "🌱";
    if (plantLevel === 2) return "🌿";
    if (plantLevel === 3) return "🪴";
    if (plantLevel === 4) return "🍀";
    return "🌳";
  }, [selectedPlant, plantLevel]);


  // Selected Pot Styles Mapping
  const potStyle = useMemo(() => {
    switch (selectedPot) {
      case "bronze":
        return { bg: "#cd7f32", border: "#a05822", name: tLocal("virtual_plant.pots.bronze") };
      case "silver":
        return { bg: "#cbd5e1", border: "#94a3b8", name: tLocal("virtual_plant.pots.silver") };
      case "gold":
        return { bg: "#fbbf24", border: "#d97706", name: tLocal("virtual_plant.pots.gold") };
      case "gold_glow":
        return { bg: "#fbbf24", border: "#f59e0b", name: tLocal("virtual_plant.pots.gold_glow") };
      default:
        return { bg: "#d97706", border: "#b45309", name: tLocal("virtual_plant.pots.classic") };
    }
  }, [selectedPot, tLocal]);

  const displayWateredCount = Math.min(wateredCount, maxHabitsToday);
  const wateringProgressRate = maxHabitsToday > 0 ? displayWateredCount / maxHabitsToday : 0;

  // Determine Plant State (thirsty, growing, blooming)
  const healthState = useMemo(() => {
    if (maxHabitsToday === 0) return "growing";
    if (displayWateredCount === 0) return "thirsty";
    if (displayWateredCount === maxHabitsToday) return "blooming";
    return "growing";
  }, [maxHabitsToday, displayWateredCount]);


  // Handle Speech Bubble Dialogues
  const [speechText, setSpeechText] = useState("");
  const [dialogueList, setDialogueList] = useState([]);
  const [dialogueIndex, setDialogueIndex] = useState(0);

  // Dynamic status messages pool
  const activeDialogues = useMemo(() => {
    const list = [];
    if (healthState === "thirsty") {
      list.push(...thirstyDialogues);
    } else if (healthState === "blooming") {
      list.push(...bloomingDialogues);
    } else {
      list.push(...growingDialogues);
    }
    list.push(...generalDialogues);

    if (maxHabitsToday > 0) {
      if (maxCompletedHabitsToday === maxHabitsToday) {
        list.push(tLocal("virtual_plant.dialogues.all_done"));
      } else {
        list.push(tLocal("virtual_plant.dialogues.status_water", { completed: maxCompletedHabitsToday, total: maxHabitsToday }));
      }
    }
    list.push(tLocal("virtual_plant.dialogues.growing_with_you"));

    if (bestStreak >= 100) {
      list.push(tLocal("virtual_plant.dialogues.streak_100", { streak: bestStreak }));
    } else if (bestStreak >= 30) {
      list.push(tLocal("virtual_plant.dialogues.streak_30", { streak: bestStreak }));
    } else if (bestStreak >= 7) {
      list.push(tLocal("virtual_plant.dialogues.streak_7", { streak: bestStreak }));
    }
    return list;
  }, [healthState, maxCompletedHabitsToday, maxHabitsToday, bestStreak, thirstyDialogues, bloomingDialogues, growingDialogues, generalDialogues, tLocal]);

  useEffect(() => {
    setDialogueList(activeDialogues);
    if (activeDialogues.length > 0) {
      setSpeechText(activeDialogues[0]);
      setDialogueIndex(0);
    }
  }, [activeDialogues]);

  const cycleDialogue = () => {
    if (dialogueList.length === 0) return;
    const nextIndex = (dialogueIndex + 1) % dialogueList.length;
    setDialogueIndex(nextIndex);

    Animated.sequence([
      Animated.timing(bubbleOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.delay(50),
      Animated.timing(bubbleOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      setSpeechText(dialogueList[nextIndex]);
    }, 120);
  };

  // Animated values
  const floatAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const bubbleOpacity = useRef(new Animated.Value(1)).current;
  const petRotateAnim = useRef(new Animated.Value(0)).current;
  const sunScaleAnim = useRef(new Animated.Value(0)).current;
  const sunOpacityAnim = useRef(new Animated.Value(0)).current;

  // Rain/Water drops
  const dropAnims = useRef([
    { y: new Animated.Value(-30), opacity: new Animated.Value(0), scale: new Animated.Value(0.5) },
    { y: new Animated.Value(-30), opacity: new Animated.Value(0), scale: new Animated.Value(0.5) },
    { y: new Animated.Value(-30), opacity: new Animated.Value(0), scale: new Animated.Value(0.5) },
    { y: new Animated.Value(-30), opacity: new Animated.Value(0), scale: new Animated.Value(0.5) },
  ]).current;

  // Fertilizer sparkles
  const sparkleAnims = useRef([
    { y: new Animated.Value(-30), x: new Animated.Value(0), opacity: new Animated.Value(0), scale: new Animated.Value(0.5) },
    { y: new Animated.Value(-30), x: new Animated.Value(0), opacity: new Animated.Value(0), scale: new Animated.Value(0.5) },
    { y: new Animated.Value(-30), x: new Animated.Value(0), opacity: new Animated.Value(0), scale: new Animated.Value(0.5) },
    { y: new Animated.Value(-30), x: new Animated.Value(0), opacity: new Animated.Value(0), scale: new Animated.Value(0.5) },
  ]).current;

  // Floating Loop Animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [floatAnim]);

  // Pet swaying rotation calculation
  const petRotation = petRotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-12deg", "12deg"]
  });

  // Action Animations triggers
  const triggerPetAnimation = () => {
    petRotateAnim.setValue(0);
    Animated.sequence([
      Animated.timing(petRotateAnim, { toValue: 1, duration: 150, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(petRotateAnim, { toValue: -1, duration: 250, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(petRotateAnim, { toValue: 0.5, duration: 150, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(petRotateAnim, { toValue: -0.5, duration: 150, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(petRotateAnim, { toValue: 0, duration: 100, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  };

  const triggerSunAnimation = () => {
    sunScaleAnim.setValue(0.5);
    sunOpacityAnim.setValue(0);
    Animated.parallel([
      Animated.timing(sunScaleAnim, { toValue: 1.4, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(sunOpacityAnim, { toValue: 0.8, duration: 300, useNativeDriver: true }),
        Animated.timing(sunOpacityAnim, { toValue: 0, duration: 700, useNativeDriver: true })
      ]),
      Animated.sequence([
        Animated.spring(bounceAnim, { toValue: 1.15, friction: 3, useNativeDriver: true }),
        Animated.spring(bounceAnim, { toValue: 1, friction: 4, useNativeDriver: true })
      ])
    ]).start();
  };

  const triggerWatering = () => {
    dropAnims.forEach((drop) => {
      drop.y.setValue(-25);
      drop.opacity.setValue(0);
      drop.scale.setValue(0.5);
    });

    const animations = dropAnims.map((drop, index) => {
      return Animated.parallel([
        Animated.timing(drop.y, { toValue: 35, duration: 500, delay: index * 100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(drop.opacity, { toValue: 0.8, duration: 150, delay: index * 100, useNativeDriver: true }),
          Animated.timing(drop.opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]),
        Animated.timing(drop.scale, { toValue: 1.2, duration: 500, delay: index * 100, useNativeDriver: true }),
      ]);
    });

    Animated.parallel([
      Animated.stagger(100, animations),
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(bounceAnim, { toValue: 1.2, friction: 3, tension: 100, useNativeDriver: true }),
        Animated.spring(bounceAnim, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true })
      ])
    ]).start(() => {
      cycleDialogue();
    });
  };

  const triggerFertilizeAnimation = () => {
    sparkleAnims.forEach((sparkle, index) => {
      sparkle.y.setValue(-25);
      sparkle.opacity.setValue(0);
      sparkle.scale.setValue(0.5);
      sparkle.x.setValue((index * 20) - 30);
    });

    const animations = sparkleAnims.map((sparkle, index) => {
      return Animated.parallel([
        Animated.timing(sparkle.y, { toValue: 45, duration: 700, delay: index * 100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(sparkle.opacity, { toValue: 0.9, duration: 200, delay: index * 100, useNativeDriver: true }),
          Animated.timing(sparkle.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
        Animated.timing(sparkle.scale, { toValue: 1.2, duration: 700, delay: index * 100, useNativeDriver: true }),
      ]);
    });

    Animated.parallel([
      Animated.stagger(80, animations),
      Animated.sequence([
        Animated.delay(150),
        Animated.spring(bounceAnim, { toValue: 1.25, friction: 3, tension: 100, useNativeDriver: true }),
        Animated.spring(bounceAnim, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true })
      ])
    ]).start();
  };

  // Button Action Handlers
  const handlePet = () => {
    const lastPet = storage.getString(getStorageKey("lastPetDate")) || "";
    let count = storage.getNumber(getStorageKey("petCountToday")) || 0;

    if (lastPet !== todayStr) {
      count = 0;
      storage.set(getStorageKey("lastPetDate"), todayStr);
    }

    triggerPetAnimation();

    if (count < 3) {
      count += 1;
      storage.set(getStorageKey("petCountToday"), count);
      const msg = tLocal("virtual_plant.dialogues.pet_happy");
      addPlantXP(2, msg);
      setSpeechText(msg);
    } else {
      setSpeechText(tLocal("virtual_plant.dialogues.pet_tired"));
    }
  };

  const waterChargesLeft = Math.max(0, completedHabits - wateredCount);

  const handleWater = () => {
    if (waterChargesLeft <= 0) {
      setSpeechText(tLocal("virtual_plant.dialogues.water_disabled"));
      return;
    }
    const newCount = wateredCount + 1;
    storage.set(getStorageKey("wateredCountToday"), newCount);
    storage.set(getStorageKey("lastActionDate"), todayStr);
    setWateredCount(newCount);

    triggerWatering();
    const msg = tLocal("virtual_plant.dialogues.water_happy");
    addPlantXP(5, msg);
    setSpeechText(msg);
  };

  const handleSun = () => {
    if (sunnedToday) {
      setSpeechText(tLocal("virtual_plant.dialogues.sun_already"));
      return;
    }
    if (completionRate < 0.5) {
      setSpeechText(tLocal("virtual_plant.dialogues.sun_disabled"));
      return;
    }
    storage.set(getStorageKey("sunnedToday"), true);
    storage.set(getStorageKey("lastActionDate"), todayStr);
    setSunnedToday(true);

    triggerSunAnimation();
    const msg = tLocal("virtual_plant.dialogues.sun_happy");
    addPlantXP(8, msg);
    setSpeechText(msg);
  };

  const handleFertilize = () => {
    if (fertilizedToday) {
      setSpeechText(tLocal("virtual_plant.dialogues.fertilize_already"));
      return;
    }
    if (completionRate < 1.0) {
      setSpeechText(tLocal("virtual_plant.dialogues.fertilize_disabled"));
      return;
    }
    storage.set(getStorageKey("fertilizedToday"), true);
    storage.set(getStorageKey("lastActionDate"), todayStr);
    setFertilizedToday(true);

    triggerFertilizeAnimation();
    const msg = tLocal("virtual_plant.dialogues.fertilize_happy");
    addPlantXP(15, msg);
    setSpeechText(msg);
  };

  const handlePlantInGarden = () => {
    Alert.alert(
      tLocal("virtual_plant.garden.alert_title"),
      tLocal("virtual_plant.garden.alert_desc"),
      [
        {
          text: tLocal("virtual_plant.customizer.rename_cancel"),
          style: "cancel"
        },
        {
          text: tLocal("virtual_plant.garden.plant_btn"),
          style: "default",
          onPress: () => {
            const newPlantedItem = {
              id: `plant-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name: plantName,
              species: selectedPlant,
              pot: selectedPot,
              level: plantLevel,
              xp: plantXP,
              emoji: plantEmoji,
              plantedDate: new Date().toLocaleDateString(i18n.language || "az", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
              })
            };

            const updatedGarden = [...garden, newPlantedItem];
            
            // Update garden state and storage
            storage.set(getStorageKey("garden"), JSON.stringify(updatedGarden));
            setGarden(updatedGarden);

            // Reset current plant state in storage
            storage.set(getStorageKey("xp"), 0);
            storage.set(getStorageKey("level"), 1);
            storage.set(getStorageKey("selectedPot"), "classic");
            storage.set(getStorageKey("selectedPlant"), "fern");
            storage.set(getStorageKey("plantName"), "");
            storage.set(getStorageKey("hasNamedPlant"), false);

            storage.set(getStorageKey("wateredCountToday"), 0);
            storage.set(getStorageKey("sunnedToday"), false);
            storage.set(getStorageKey("fertilizedToday"), false);
            storage.set(getStorageKey("maxCompletedHabitsToday"), 0);

            // Update local React state
            setPlantXP(0);
            setPlantLevel(1);
            setSelectedPot("classic");
            setSelectedPlant("fern");
            setPlantName("");
            setHasNamedPlant(false);
            setWateredCount(0);
            setSunnedToday(false);
            setFertilizedToday(false);
            setMaxCompletedHabitsToday(0);

            // Trigger naming modal automatically for the new plant
            setRenameInput("");
            setRenameModalVisible(true);
          }
        }
      ]
    );
  };

  // Customize Panel Modal state
  const [isCustomizeModalVisible, setCustomizeModalVisible] = useState(false);
  const [isGardenModalVisible, setGardenModalVisible] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
  const gardenScrollRef = useRef(null);

  // Map animation values
  const butterflyAnim1 = useRef(new Animated.Value(0)).current;
  const butterflyAnim2 = useRef(new Animated.Value(0)).current;
  const butterflyAnim3 = useRef(new Animated.Value(0)).current;
  const decorSwayAnim = useRef(new Animated.Value(0)).current;
  const cloudAnim1 = useRef(new Animated.Value(0)).current;
  const cloudAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isGardenModalVisible) {
      setTimeout(() => {
        gardenScrollRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [isGardenModalVisible]);

  // Garden map animations (butterflies, swaying flowers, clouds, active node pulsing glow)
  useEffect(() => {
    const loop = (anim, dur) => Animated.loop(Animated.timing(anim, { toValue: 1, duration: dur, easing: Easing.linear, useNativeDriver: true }));
    
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    );

    const anims = [
      loop(butterflyAnim1, 6000),
      loop(butterflyAnim2, 8500),
      loop(butterflyAnim3, 5200),
      loop(decorSwayAnim, 2500),
      loop(cloudAnim1, 35000),
      loop(cloudAnim2, 45000),
      pulseLoop
    ];
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rewards unlock status
  const isBronzePotUnlocked = bestStreak >= 7;
  const isSilverPotUnlocked = bestStreak >= 15;
  const isGoldPotUnlocked = bestStreak >= 30;
  const isGoldGlowPotUnlocked = bestStreak >= 100;

  const isCactusUnlocked = bestStreak >= 30;
  const isRoseUnlocked = bestStreak >= 30;
  const isBonsaiUnlocked = bestStreak >= 50;
  const isRareUnlocked = bestStreak >= 100;

  // Theme gradient colors
  const gradientColors = useMemo(() => {
    if (healthState === "blooming") {
      return isDark ? ["#1e1b4b", "#311042"] : ["#FFFbeb", "#FEf3c7"];
    } else if (healthState === "thirsty") {
      return isDark ? ["#0f172a", "#1e293b"] : ["#F0f9ff", "#E0f2fe"];
    }
    return isDark ? ["#022c22", "#064e3b"] : ["#F0fdf4", "#DCfce7"];
  }, [healthState, isDark]);

  const borderGlowColor = useMemo(() => {
    if (healthState === "blooming") return "rgba(245, 158, 11, 0.25)";
    if (healthState === "thirsty") return "rgba(14, 165, 233, 0.15)";
    return "rgba(16, 185, 129, 0.2)";
  }, [healthState]);

  // Action buttons active states
  const isWaterable = waterChargesLeft > 0;
  const isSunable = wateringProgressRate >= 0.5 && !sunnedToday;
  const isFertilizable = wateringProgressRate === 1.0 && !fertilizedToday;

  // Winding roadmap geometry calculations
  const MAP_WIDTH = 320;
  const totalNodes = Math.max(12, garden.length + 3);
  const nodeStepY = 110;
  const mapHeight = totalNodes * nodeStepY + 120;

  // Smooth rounded sine-wave node positions
  const nodes = useMemo(() => {
    const list = [];
    for (let i = 0; i < totalNodes; i++) {
      const y = mapHeight - 80 - (i * nodeStepY);
      let x = MAP_WIDTH / 2;
      if (i > 0) {
        const direction = i % 2 === 1 ? 1 : -1;
        const offset = 75 + (i % 3) * 10;
        x = MAP_WIDTH / 2 + direction * offset;
      }
      list.push({ x, y, index: i });
    }
    return list;
  }, [totalNodes, mapHeight]);

  // Cosine-interpolated smooth polyline (rounded curves between nodes)
  const pointsString = useMemo(() => {
    if (nodes.length < 2) return '';
    const allPts = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const curr = nodes[i];
      const next = nodes[i + 1];
      const segs = 10;
      for (let s = 0; s <= (i === nodes.length - 2 ? segs : segs - 1); s++) {
        const t = s / segs;
        // Cosine interpolation for smooth S-curves
        const smoothX = curr.x + (next.x - curr.x) * (0.5 - 0.5 * Math.cos(t * Math.PI));
        const y = curr.y + (next.y - curr.y) * t;
        allPts.push(`${Math.round(smoothX)},${Math.round(y)}`);
      }
    }
    return allPts.join(' ');
  }, [nodes]);

  // Richer decorative elements
  const decors = useMemo(() => {
    const list = [];
    const decorSets = [
      { emoji: "🌸", sz: 14 }, { emoji: "🍄", sz: 13 }, { emoji: "🪨", sz: 15 },
      { emoji: "🌿", sz: 14 }, { emoji: "🌼", sz: 13 }, { emoji: "🌻", sz: 16 },
      { emoji: "🌲", sz: 18 }, { emoji: "🐞", sz: 11 }, { emoji: "🌺", sz: 14 },
      { emoji: "🍀", sz: 12 }, { emoji: "🐝", sz: 11 }, { emoji: "🌷", sz: 13 },
    ];
    for (let i = 0; i < totalNodes - 1; i++) {
      const nodeY = mapHeight - 80 - (i * nodeStepY) - 55;
      const d1 = decorSets[(i * 3) % decorSets.length];
      const d2 = decorSets[(i * 7 + 2) % decorSets.length];
      const d3 = decorSets[(i * 5 + 1) % decorSets.length];
      list.push({ id: `dl-${i}`, emoji: d1.emoji, sz: d1.sz, x: 8 + (i % 4) * 14, y: nodeY + (i % 2 === 0 ? 8 : -12), sway: i % 3 === 0 });
      list.push({ id: `dr-${i}`, emoji: d2.emoji, sz: d2.sz, x: MAP_WIDTH - 30 - (i % 3) * 12, y: nodeY + (i % 2 === 0 ? -18 : 12), sway: i % 2 === 0 });
      if (i % 2 === 0) {
        list.push({ id: `dm-${i}`, emoji: d3.emoji, sz: d3.sz, x: MAP_WIDTH / 2 + (i % 4 === 0 ? -55 : 55), y: nodeY + 30, sway: false });
      }
    }
    return list;
  }, [totalNodes, mapHeight]);

  // Dense forest trees to make the ground look like a dense forest (meşəlik)
  const grassPatches = useMemo(() => {
    const list = [];
    const count = totalNodes * 28; // Rich density for thick forest canopy
    const forestEmojis = ["🌲", "🌳", "🌲", "🌳", "🌲", "🌳"];
    
    // Helper to calculate smooth road path X coordinate at a given Y coordinate
    const getPathX = (yVal) => {
      if (!nodes || nodes.length === 0) return MAP_WIDTH / 2;
      const bottomNode = nodes[0];
      const topNode = nodes[nodes.length - 1];
      if (yVal >= bottomNode.y) return bottomNode.x;
      if (yVal <= topNode.y) return topNode.x;
      for (let i = 0; i < nodes.length - 1; i++) {
        const curr = nodes[i];
        const next = nodes[i + 1];
        if (yVal <= curr.y && yVal >= next.y) {
          const t = (yVal - curr.y) / (next.y - curr.y);
          return curr.x + (next.x - curr.x) * (0.5 - 0.5 * Math.cos(t * Math.PI));
        }
      }
      return MAP_WIDTH / 2;
    };

    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random placements using sine hash
      const rawX = Math.sin(i * 17.11 + 3.1) * 43758.5453;
      const initialX = Math.floor((rawX - Math.floor(rawX)) * (MAP_WIDTH - 20));
      
      const rawY = Math.sin(i * 87.43 + 7.5) * 43758.5453;
      const y = Math.floor((rawY - Math.floor(rawY)) * (mapHeight - 40));
      
      const emoji = forestEmojis[i % forestEmojis.length];
      const size = 20 + (i % 6) * 5; // Sizes: 20, 25, 30, 35, 40, 45
      
      // Make sure trees stay clear of the road path center
      let x = initialX;
      const pathX = getPathX(y);
      const minDistance = 45; // clearance from road center
      
      if (Math.abs(x - pathX) < minDistance) {
        // Push tree away from the road center
        if (x < pathX) {
          x = pathX - minDistance - ((i * 3) % 20) - 10;
        } else {
          x = pathX + minDistance + ((i * 3) % 20) + 10;
        }
      }
      
      // Allow trees to slightly overlap the edge of the map layout for a full-bleed look
      if (x < -20) x = -20;
      if (x > MAP_WIDTH - 15) x = MAP_WIDTH - 15;
      
      list.push({
        id: `forest-${i}`,
        emoji,
        x,
        y,
        sz: size,
        opacity: 0.65 + (i % 4) * 0.08 // More solid opacities: 0.65 to 0.89
      });
    }
    return list;
  }, [totalNodes, mapHeight, nodes]);

  const toRoman = (num) => {
    const lookup = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
    return lookup[num] || num.toString();
  };

  const getSlotDetails = useCallback((index) => {
    const isOccupied = index < garden.length;
    const isNextEmpty = index === garden.length;

    if (isOccupied) {
      const item = garden[index];
      return {
        title: item.name,
        subtitle: `${tLocal("virtual_plant.garden.level_5_max")} • ${tLocal(`virtual_plant.species.${item.species}`)} • ${tLocal(`virtual_plant.pots.${item.pot}`)}`,
        description: tLocal("virtual_plant.garden.planted_date", { date: item.plantedDate }),
        extra: `🏆 ${item.xp} XP`,
        emoji: item.emoji || "🌳"
      };
    } else if (isNextEmpty) {
      return {
        title: plantName || tLocal("virtual_plant.garden.active_plant"),
        subtitle: `${tLocal("virtual_plant.garden.level_label")} ${plantLevel} (${tLocal(`virtual_plant.levels.${plantLevel}`)}) • ${potStyle.name}`,
        description: tLocal("virtual_plant.garden.currently_growing"),
        extra: `${plantXP} XP`,
        emoji: plantEmoji
      };
    } else {
      return {
        title: tLocal("virtual_plant.garden.locked_plot"),
        subtitle: tLocal("virtual_plant.garden.not_accessible"),
        description: tLocal("virtual_plant.garden.unlock_instructions"),
        extra: "",
        emoji: "🔒"
      };
    }
  }, [garden, tLocal, plantName, plantLevel, potStyle.name, plantXP, plantEmoji]);



  return (
    <View
      className="mx-4 mb-4"
      style={{
        shadowColor: healthState === "blooming" ? "#f59e0b" : colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: borderGlowColor,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={{ padding: 16 }}>
        {/* Title, Badge and Customize Icon */}
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-1 mr-2 flex-row items-center gap-1.5">
            <FontAwesomeIcon icon={faLeaf} size={15} color={healthState === "blooming" ? "#f59e0b" : "#10b981"} />
            <TouchableOpacity
              onPress={() => {
                setRenameInput(plantName);
                setRenameModalVisible(true);
              }}
              activeOpacity={0.7}
              className="flex-row items-center gap-1 flex-1"
            >
              <Text numberOfLines={1} className="font-redditsans-bold text-[15px] flex-shrink" style={{ color: colors.text }}>
                {plantName}
              </Text>
              <FontAwesomeIcon icon={faPen} size={9} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-2">
            {/* Garden Trigger */}
            <TouchableOpacity
              onPress={() => setGardenModalVisible(true)}
              className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/25"
              activeOpacity={0.7}
            >
              <FontAwesomeIcon icon={faTree} size={11} color={isDark ? "#34d399" : "#059669"} />
              <Text className="text-[10px] font-redditsans-bold" style={{ color: isDark ? "#34d399" : "#059669" }}>
                {tLocal("virtual_plant.garden.title")}
              </Text>
            </TouchableOpacity>

            {/* Customize Palette Trigger */}
            <TouchableOpacity
              onPress={() => setCustomizeModalVisible(true)}
              className="w-7 h-7 rounded-full items-center justify-center bg-black/5 dark:bg-white/10"
              activeOpacity={0.7}
            >
              <FontAwesomeIcon icon={faPalette} size={12} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Plant & Speech Bubble Container */}
        <View className="flex-row items-center justify-between min-h-[120px] py-1">
          <TouchableOpacity activeOpacity={0.9} onPress={handlePet} className="w-[100px] h-[100px] items-center justify-end relative">
            {/* Sun Glow Behind Plant */}
            <Animated.View
              style={{
                position: "absolute",
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "rgba(253, 224, 71, 0.4)",
                transform: [{ scale: sunScaleAnim }],
                opacity: sunOpacityAnim,
                bottom: 15,
                zIndex: -1,
              }}
            />

            {/* Glowing stars for blooming/gold pots */}
            {(healthState === "blooming" || selectedPot === "gold_glow") && (
              <View className="absolute top-1 left-2 flex-row gap-8">
                <FontAwesomeIcon icon={faStar} size={10} color="#f59e0b" style={{ opacity: 0.6 }} />
                <FontAwesomeIcon icon={faStar} size={14} color="#f59e0b" style={{ opacity: 0.8 }} />
              </View>
            )}

            {/* Falling Water Drops */}
            {dropAnims.map((drop, idx) => (
              <Animated.View
                key={`drop-${idx}`}
                style={{
                  position: "absolute",
                  top: "20%",
                  transform: [{ translateY: drop.y }, { scale: drop.scale }],
                  opacity: drop.opacity,
                  zIndex: 2,
                }}
              >
                <FontAwesomeIcon icon={faTint} color="#0ea5e9" size={14} />
              </Animated.View>
            ))}

            {/* Falling Fertilize Sparkles */}
            {sparkleAnims.map((sparkle, idx) => (
              <Animated.View
                key={`sparkle-${idx}`}
                style={{
                  position: "absolute",
                  top: "20%",
                  transform: [{ translateY: sparkle.y }, { translateX: sparkle.x }, { scale: sparkle.scale }],
                  opacity: sparkle.opacity,
                  zIndex: 2,
                }}
              >
                <FontAwesomeIcon icon={faStar} color="#22c55e" size={12} />
              </Animated.View>
            ))}

            {/* Floating and Bouncing Plant Emoji */}
            <Animated.Text
              allowFontScaling={false}
              style={{
                fontSize: 56,
                transform: [
                  { translateY: floatAnim },
                  { scale: bounceAnim },
                  { rotate: petRotation }
                ],
              }}
            >
              {plantEmoji}
            </Animated.Text>

            {/* Configured Pot Graphic */}
            <View
              className="w-14 h-5 rounded-b-lg border-t items-center justify-center mt-0.5 shadow-sm"
              style={{
                backgroundColor: potStyle.bg,
                borderColor: potStyle.border,
                shadowColor: selectedPot === "gold_glow" ? "#fbbf24" : "transparent",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 4,
              }}
            />
          </TouchableOpacity>

          {/* Speech Dialogue Bubble */}
          <Animated.View style={{ opacity: bubbleOpacity }} className="flex-1 ml-4 justify-center">
            <TouchableOpacity activeOpacity={0.9} onPress={cycleDialogue} className="p-3 rounded-2xl relative shadow-sm border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <View
                style={[
                  styles.bubbleTriangle,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderBottomWidth: 1,
                    borderLeftWidth: 1,
                  },
                ]}
              />
              <Text className="font-redditsans-medium text-[12px] leading-4" style={{ color: colors.text }}>
                {speechText}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Dashboard Progress Details */}
        <View className="mt-3 pt-3 border-t" style={{ borderColor: colors.border }}>
          {/* Today's Watering Progress Bar */}
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-[11px] font-redditsans-bold" style={{ color: colors.textSecondary }}>
              💧 {t("virtual_plant.wateringLevel")}: {Math.round(wateringProgressRate * 100)}% ({displayWateredCount}/{maxHabitsToday})
            </Text>


            <Text className="text-[10px] font-redditsans-medium italic" style={{ color: colors.textMuted }}>
              {maxCompletedHabitsToday > 0
                ? tLocal("virtual_plant.status.watered_today", { completed: Math.min(wateredCount, maxCompletedHabitsToday), total: maxCompletedHabitsToday })
                : tLocal("virtual_plant.status.thirsty_today")
              }
            </Text>
          </View>

          <View className="w-full h-1.5 rounded-full overflow-hidden mb-3 bg-slate-200 dark:bg-slate-700">
            <LinearGradient
              colors={["#0ea5e9", "#38bdf8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: `${Math.max(wateringProgressRate * 100, 3)}%` }}
              className="h-full rounded-full"
            />
          </View>


          {/* Plant Level Growth Bar */}
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-[10px] font-redditsans-medium" style={{ color: colors.textSecondary }}>
              🌱 {t("virtual_plant.stageName")} {plantLevel} ({currentLevelReq.name})
            </Text>

            {plantLevel < 5 ? (
              <Text className="text-[10px] font-redditsans-bold" style={{ color: colors.textMuted }}>
                {tLocal("virtual_plant.xp_remaining", { count: xpRemaining, level: plantLevel + 1 })}
              </Text>
            ) : (
              <View className="flex-row items-center gap-2">
                <Text className="text-[10px] font-redditsans-bold" style={{ color: "#fbbf24" }}>
                  {tLocal("virtual_plant.max_level")}
                </Text>
                <TouchableOpacity
                  onPress={handlePlantInGarden}
                  style={{
                    backgroundColor: "#10b981",
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: "#fff", fontSize: 9, fontFamily: "RedditSans-Bold" }}>
                    {tLocal("virtual_plant.garden.plant_btn")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View className="w-full h-1 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
            <LinearGradient
              colors={["#10b981", "#34d399"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: `${Math.max(plantXPPercentage, 2)}%` }}
              className="h-full rounded-full"
            />
          </View>
        </View>

        {/* Gamified Pet Action Button Row */}
        <View className="flex-row justify-between items-center gap-1.5 mt-3.5 pt-3 border-t" style={{ borderColor: colors.border }}>
          {/* Action 1: Pet */}
          <TouchableOpacity
            onPress={handlePet}
            className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 active:scale-95"
            activeOpacity={0.7}
          >
            <FontAwesomeIcon icon={faHeart} size={11} color="#ef4444" />
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} className="text-[10px] font-redditsans-bold" style={{ color: colors.textSecondary }}>
              {tLocal("virtual_plant.actions.pet")}
            </Text>
          </TouchableOpacity>

          {/* Action 2: Water */}
          <TouchableOpacity
            onPress={handleWater}
            disabled={false}
            style={{
              backgroundColor: isWaterable ? "rgba(14, 165, 233, 0.12)" : "rgba(148, 163, 184, 0.05)",
              opacity: isWaterable ? 1 : 0.45,
            }}
            className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-xl active:scale-95"
            activeOpacity={0.7}
          >
            <FontAwesomeIcon icon={faTint} size={11} color={isWaterable ? "#0ea5e9" : "#94a3b8"} />
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} className="text-[10px] font-redditsans-bold" style={{ color: isWaterable ? (isDark ? "#38bdf8" : "#0284c7") : "#94a3b8" }}>
              {tLocal("virtual_plant.actions.water")}
            </Text>
          </TouchableOpacity>

          {/* Action 3: Sun */}
          <TouchableOpacity
            onPress={handleSun}
            disabled={false}
            style={{
              backgroundColor: isSunable ? "rgba(234, 179, 8, 0.12)" : "rgba(148, 163, 184, 0.05)",
              opacity: isSunable ? 1 : 0.45,
            }}
            className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-xl active:scale-95"
            activeOpacity={0.7}
          >
            <FontAwesomeIcon icon={faSun} size={11} color={isSunable ? "#eab308" : "#94a3b8"} />
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} className="text-[10px] font-redditsans-bold" style={{ color: isSunable ? (isDark ? "#fde047" : "#a16207") : "#94a3b8" }}>
              {tLocal("virtual_plant.actions.sun")}
            </Text>
          </TouchableOpacity>

          {/* Action 4: Fertilize */}
          <TouchableOpacity
            onPress={handleFertilize}
            disabled={false}
            style={{
              backgroundColor: isFertilizable ? "rgba(34, 197, 94, 0.12)" : "rgba(148, 163, 184, 0.05)",
              opacity: isFertilizable ? 1 : 0.45,
            }}
            className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-xl active:scale-95"
            activeOpacity={0.7}
          >
            <FontAwesomeIcon icon={faStar} size={11} color={isFertilizable ? "#22c55e" : "#94a3b8"} />
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} className="text-[10px] font-redditsans-bold" style={{ color: isFertilizable ? (isDark ? "#4ade80" : "#16a34a") : "#94a3b8" }}>
              {tLocal("virtual_plant.actions.fertilize")}
            </Text>
          </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>

      <Modal
        visible={isCustomizeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomizeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCustomizeModalVisible(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.card }]}
            onPress={() => { }}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-lg font-redditsans-bold" style={{ color: colors.text }}>
                {tLocal("virtual_plant.customizer.header", { name: plantName })}
              </Text>
              <TouchableOpacity onPress={() => setCustomizeModalVisible(false)} className="p-1">
                <FontAwesomeIcon icon={faTimes} color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* Streak Info */}
              <View className="p-3 rounded-2xl mb-5 flex-row items-center gap-2" style={{ backgroundColor: colors.cardSecondary }}>
                <Text className="text-lg">🔥</Text>
                <Text className="text-xs font-redditsans-medium leading-4 flex-1" style={{ color: colors.textSecondary }}>
                  {tLocal("virtual_plant.customizer.streak_info", { streak: bestStreak })}
                </Text>
              </View>

              {/* Category 1: Pot Designs */}
              <Text className="text-[13px] font-redditsans-bold uppercase tracking-wider mb-3" style={{ color: colors.textSecondary }}>
                {tLocal("virtual_plant.customizer.pots_title")}
              </Text>
              <View className="gap-2.5 mb-6">
                {[
                  { id: "classic", name: tLocal("virtual_plant.pots.classic"), unlock: "Default", isUnlocked: true },
                  { id: "bronze", name: tLocal("virtual_plant.pots.bronze"), unlock: tLocal("virtual_plant.customizer.streak_days", { count: 7 }), isUnlocked: isBronzePotUnlocked },
                  { id: "silver", name: tLocal("virtual_plant.pots.silver"), unlock: tLocal("virtual_plant.customizer.streak_days", { count: 15 }), isUnlocked: isSilverPotUnlocked },
                  { id: "gold", name: tLocal("virtual_plant.pots.gold"), unlock: tLocal("virtual_plant.customizer.streak_days", { count: 30 }), isUnlocked: isGoldPotUnlocked },
                  { id: "gold_glow", name: tLocal("virtual_plant.pots.gold_glow"), unlock: tLocal("virtual_plant.customizer.streak_days", { count: 100 }), isUnlocked: isGoldGlowPotUnlocked },
                ].map((pot) => (
                  <Pressable
                    key={pot.id}
                    onPress={() => {
                      if (!pot.isUnlocked) return;
                      storage.set(getStorageKey("selectedPot"), pot.id);
                      setSelectedPot(pot.id);
                    }}
                    android_ripple={pot.isUnlocked ? { color: colors.border } : null}
                    style={{
                      borderWidth: 1,
                      borderColor: selectedPot === pot.id ? colors.primary : colors.border,
                      backgroundColor: selectedPot === pot.id ? colors.primary + "12" : colors.background,
                      opacity: pot.isUnlocked ? 1 : 0.65,
                    }}
                    className="flex-row justify-between items-center p-3.5 rounded-2xl"
                  >
                    <View>
                      <Text className="font-redditsans-bold text-sm" style={{ color: colors.text }}>
                        {pot.name}
                      </Text>
                      <Text className="text-[10px] font-redditsans-medium mt-0.5" style={{ color: colors.textMuted }}>
                        {pot.isUnlocked
                          ? (selectedPot === pot.id ? tLocal("virtual_plant.customizer.active") : tLocal("virtual_plant.customizer.unlocked"))
                          : tLocal("virtual_plant.customizer.locked_by", { val: pot.unlock })}
                      </Text>
                    </View>
                    {!pot.isUnlocked && <Text className="text-xs">🔒</Text>}
                  </Pressable>
                ))}
              </View>

              {/* Category 2: Plant Types */}
              <Text className="text-[13px] font-redditsans-bold uppercase tracking-wider mb-3" style={{ color: colors.textSecondary }}>
                {tLocal("virtual_plant.customizer.species_title")}
              </Text>
              <View className="gap-2.5">
                {[
                  { id: "fern", name: tLocal("virtual_plant.species.fern"), unlock: "Default", isUnlocked: true },
                  { id: "cactus", name: tLocal("virtual_plant.species.cactus"), unlock: tLocal("virtual_plant.customizer.streak_days", { count: 30 }), isUnlocked: isCactusUnlocked },
                  { id: "rose", name: tLocal("virtual_plant.species.rose"), unlock: tLocal("virtual_plant.customizer.streak_days", { count: 30 }), isUnlocked: isRoseUnlocked },
                  { id: "bonsai", name: tLocal("virtual_plant.species.bonsai"), unlock: tLocal("virtual_plant.customizer.streak_days", { count: 50 }), isUnlocked: isBonsaiUnlocked },
                  { id: "rare", name: tLocal("virtual_plant.species.rare"), unlock: tLocal("virtual_plant.customizer.streak_days", { count: 100 }), isUnlocked: isRareUnlocked },
                ].map((plant) => (

                  <Pressable
                    key={plant.id}
                    onPress={() => {
                      if (!plant.isUnlocked) return;
                      storage.set(getStorageKey("selectedPlant"), plant.id);
                      setSelectedPlant(plant.id);
                    }}
                    android_ripple={plant.isUnlocked ? { color: colors.border } : null}
                    style={{
                      borderWidth: 1,
                      borderColor: selectedPlant === plant.id ? colors.primary : colors.border,
                      backgroundColor: selectedPlant === plant.id ? colors.primary + "12" : colors.background,
                      opacity: plant.isUnlocked ? 1 : 0.65,
                    }}
                    className="flex-row justify-between items-center p-3.5 rounded-2xl"
                  >
                    <View>
                      <Text className="font-redditsans-bold text-sm" style={{ color: colors.text }}>
                        {plant.name}
                      </Text>
                      <Text className="text-[10px] font-redditsans-medium mt-0.5" style={{ color: colors.textMuted }}>
                        {plant.isUnlocked
                          ? (selectedPlant === plant.id ? tLocal("virtual_plant.customizer.active") : tLocal("virtual_plant.customizer.unlocked"))
                          : tLocal("virtual_plant.customizer.locked_by", { val: plant.unlock })}
                      </Text>
                    </View>
                    {!plant.isUnlocked && <Text className="text-xs">🔒</Text>}
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </Pressable>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={isGardenModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => {
          setGardenModalVisible(false);
          setSelectedSlotIndex(null);
        }}
      >
        <View style={{ flex: 1, backgroundColor: isDark ? "#022c22" : "#166534" }}>
          {/* Static Full Screen Backdrop Gradient */}
          <LinearGradient
            colors={isDark ? ["#064e3b", "#022c22"] : ["#bbf7d0", "#166534"]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Scrollable Meadow Winding Map (full screen) */}
          <ScrollView 
            ref={gardenScrollRef}
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ alignItems: 'center', paddingTop: 76, paddingBottom: 160 }}
            style={StyleSheet.absoluteFillObject}
          >
            <View style={{ width: MAP_WIDTH, height: mapHeight, position: 'relative' }}>
              {/* Dense Forest Canopy Background */}
              {grassPatches.map(g => (
                <Text
                  key={g.id}
                  style={{
                    position: 'absolute',
                    left: g.x,
                    top: g.y,
                    fontSize: g.sz,
                    opacity: g.opacity,
                    textShadowColor: 'rgba(0,0,0,0.15)',
                    textShadowOffset: { width: 1, height: 1.5 },
                    textShadowRadius: 2,
                  }}
                >
                  {g.emoji}
                </Text>
              ))}

              {/* SVG Paths representing the winding dirt road */}
              <Svg width={MAP_WIDTH} height={mapHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
                {/* Path shadow / Grass blend */}
                <Polyline
                  points={pointsString}
                  fill="none"
                  stroke={isDark ? "#064e3b" : "#bbf7d0"}
                  strokeWidth={38}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.6}
                />
                {/* Road dark border / Dirt edge */}
                <Polyline
                  points={pointsString}
                  fill="none"
                  stroke="#78350f"
                  strokeWidth={30}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Main road body (warm brown) */}
                <Polyline
                  points={pointsString}
                  fill="none"
                  stroke="#d97706"
                  strokeWidth={24}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Light inner path (sandy/dirt texture) */}
                <Polyline
                  points={pointsString}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={18}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Stepping trails/footprints inside */}
                <Polyline
                  points={pointsString}
                  fill="none"
                  stroke="#fef08a"
                  strokeWidth={6}
                  strokeDasharray="8, 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.7}
                />
              </Svg>

              {/* Scenery Scenes */}

              {/* 1. Large Tree & Wooden Bench Scene (Top-Left) */}
              <View style={{ position: 'absolute', left: 15, top: 70, alignItems: 'center' }}>
                <Text style={{ fontSize: 44 }}>🌳</Text>
                <View style={{ flexDirection: 'row', marginTop: -8, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12 }}>🪵</Text>
                  <View style={{ width: 22, height: 6, backgroundColor: '#b45309', borderRadius: 2, borderWidth: 1, borderColor: '#78350f' }} />
                  <Text style={{ fontSize: 12 }}>🪵</Text>
                </View>
                <Animated.Text style={{
                  position: 'absolute',
                  top: -15,
                  left: 10,
                  fontSize: 12,
                  transform: [{
                    translateY: decorSwayAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, -4, 0]
                    })
                  }]
                }}>
                  🐝
                </Animated.Text>
              </View>

              {/* 2. Water Pond Scene (Top-Right) */}
              <View style={{ position: 'absolute', left: MAP_WIDTH - 85, top: 80, width: 70, height: 55, alignItems: 'center', justifyContent: 'center' }}>
                {/* Grey rock background */}
                <View style={{ position: 'absolute', width: 66, height: 46, borderRadius: 23, backgroundColor: '#94a3b8', borderWidth: 2, borderColor: '#64748b' }} />
                {/* Blue water */}
                <View style={{ position: 'absolute', width: 54, height: 34, borderRadius: 17, backgroundColor: '#0ea5e9', borderWidth: 1, borderColor: '#38bdf8' }}>
                  <Text style={{ fontSize: 9, position: 'absolute', left: 4, top: 2 }}>✨</Text>
                  <Text style={{ fontSize: 13, position: 'absolute', left: 16, top: 4 }}>🦆</Text>
                </View>
                {/* Surrounding plants */}
                <Text style={{ fontSize: 12, position: 'absolute', bottom: -2, right: 2 }}>🌿</Text>
                <Text style={{ fontSize: 10, position: 'absolute', top: -4, left: 12 }}>🌸</Text>
              </View>

              {/* 3. Wooden Fence (Middle) */}
              <View style={{ position: 'absolute', left: MAP_WIDTH / 2 - 20, top: mapHeight - 245, flexDirection: 'row' }}>
                <Text style={{ fontSize: 12 }}>🪵</Text>
                <Text style={{ fontSize: 12, marginLeft: -4 }}>🪵</Text>
                <Text style={{ fontSize: 12, marginLeft: -4 }}>🪵</Text>
              </View>

              {/* 4. Garden Bed Scene (Bottom-Left) */}
              <View style={{ position: 'absolute', left: 15, top: mapHeight - 185, width: 65, height: 50 }}>
                {/* Wooden container */}
                <View style={{ width: 50, height: 34, backgroundColor: '#78350f', borderRadius: 4, borderWidth: 2, borderColor: '#451a03', flexDirection: 'row', flexWrap: 'wrap', padding: 2, justifyContent: 'space-around', alignItems: 'center' }}>
                  <Text style={{ fontSize: 9 }}>🌱</Text>
                  <Text style={{ fontSize: 9 }}>🌱</Text>
                  <Text style={{ fontSize: 9 }}>🌱</Text>
                  <Text style={{ fontSize: 9 }}>🌱</Text>
                </View>
                {/* Watering can next to it */}
                <Text style={{ fontSize: 14, position: 'absolute', bottom: 0, right: 0 }}>🚿</Text>
              </View>

              {/* 5. Cherry Blossom & Stone Lantern Scene (Bottom-Right) */}
              <View style={{ position: 'absolute', left: MAP_WIDTH - 65, top: mapHeight - 175, alignItems: 'center', width: 50 }}>
                {/* Cherry blossom tree */}
                <View style={{ width: 44, height: 44, position: 'relative' }}>
                  <Text style={{ fontSize: 34, position: 'absolute', bottom: 0, left: 5 }}>🌳</Text>
                  <Text style={{ fontSize: 15, position: 'absolute', top: 0, left: 0 }}>🌸</Text>
                  <Text style={{ fontSize: 13, position: 'absolute', top: 8, left: 20 }}>🌸</Text>
                  <Text style={{ fontSize: 11, position: 'absolute', top: -4, left: 12 }}>🌸</Text>
                </View>
                {/* Stone lantern / Japanese lantern */}
                <View style={{ marginTop: -4, alignItems: 'center' }}>
                  <View style={{ width: 14, height: 16, backgroundColor: '#475569', borderRadius: 3, borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#f59e0b' }} />
                  </View>
                  <View style={{ width: 18, height: 4, backgroundColor: '#334155', borderRadius: 1 }} />
                </View>
              </View>

              {/* 6. Grazing Sheep (Bottom-Center) */}
              <Animated.View style={{
                position: 'absolute',
                left: MAP_WIDTH / 2 - 35,
                top: mapHeight - 110,
                flexDirection: 'row',
                alignItems: 'center',
                transform: [
                  {
                    translateY: decorSwayAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, -3, 0]
                    })
                  },
                  {
                    translateX: decorSwayAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 4, 0]
                    })
                  }
                ]
              }}>
                <Text style={{ fontSize: 20 }}>🐑</Text>
                <Text style={{ fontSize: 8, color: '#16a34a', marginLeft: -2, marginTop: 10 }}>🌾</Text>
              </Animated.View>

              {/* Floating Clouds */}
              <Animated.Text style={{
                position: 'absolute',
                top: mapHeight * 0.15,
                fontSize: 34,
                opacity: 0.35,
                transform: [{
                  translateX: cloudAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-60, MAP_WIDTH + 60]
                  })
                }]
              }}>
                ☁️
              </Animated.Text>
              <Animated.Text style={{
                position: 'absolute',
                top: mapHeight * 0.5,
                fontSize: 28,
                opacity: 0.3,
                transform: [{
                  translateX: cloudAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [MAP_WIDTH + 60, -60]
                  })
                }]
              }}>
                ☁️
              </Animated.Text>

              {/* Decorative Elements (some swaying) */}
              {decors.map(dec => (
                <Animated.Text
                  key={dec.id}
                  style={{
                    position: 'absolute',
                    left: dec.x,
                    top: dec.y,
                    fontSize: dec.sz || 16,
                    textShadowColor: 'rgba(0,0,0,0.15)',
                    textShadowOffset: { width: 1, height: 1.5 },
                    textShadowRadius: 1.5,
                    transform: dec.sway ? [{
                      translateX: decorSwayAnim.interpolate({
                        inputRange: [0, 0.25, 0.5, 0.75, 1],
                        outputRange: [0, 2, 0, -2, 0],
                      })
                    }] : [],
                  }}
                >
                  {dec.emoji}
                </Animated.Text>
              ))}

              {/* Animated Butterflies */}
              <Animated.Text style={{
                position: 'absolute', left: 55, top: mapHeight * 0.3, fontSize: 20,
                transform: [
                  { translateX: butterflyAnim1.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 35, 0, -35, 0] }) },
                  { translateY: butterflyAnim1.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -25, -5, 25, 0] }) },
                  { rotate: butterflyAnim1.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['0deg', '15deg', '0deg', '-15deg', '0deg'] }) },
                ],
              }}>🦋</Animated.Text>
              <Animated.Text style={{
                position: 'absolute', left: MAP_WIDTH - 70, top: mapHeight * 0.55, fontSize: 16,
                transform: [
                  { translateX: butterflyAnim2.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -30, 5, 30, 0] }) },
                  { translateY: butterflyAnim2.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 20, 0, -20, 0] }) },
                  { rotate: butterflyAnim2.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['0deg', '-10deg', '0deg', '10deg', '0deg'] }) },
                ],
              }}>🦋</Animated.Text>
              <Animated.Text style={{
                position: 'absolute', left: MAP_WIDTH / 2 - 10, top: mapHeight * 0.78, fontSize: 18,
                transform: [
                  { translateX: butterflyAnim3.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 25, 5, -25, 0] }) },
                  { translateY: butterflyAnim3.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -30, 0, 30, 0] }) },
                  { rotate: butterflyAnim3.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['0deg', '20deg', '0deg', '-20deg', '0deg'] }) },
                ],
              }}>🦋</Animated.Text>

              {/* Path Nodes */}
              {nodes.map(n => {
                const item = garden[n.index];
                const isOccupied = !!item;
                const isNextEmpty = !isOccupied && n.index === garden.length;
                const isLocked = !isOccupied && n.index > garden.length;
                const isSelected = selectedSlotIndex === n.index;

                return (
                  <Animated.View
                    key={`node-${n.index}`}
                    style={{
                      position: 'absolute',
                      left: n.x - 34,
                      top: n.y - 34,
                      width: 68,
                      height: 68,
                      transform: isNextEmpty ? [{
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.08]
                        })
                      }] : []
                    }}
                  >
                    {isNextEmpty && (
                      <Animated.View
                        style={{
                          position: 'absolute',
                          width: 84,
                          height: 84,
                          borderRadius: 42,
                          backgroundColor: 'rgba(245, 158, 11, 0.35)',
                          left: -8,
                          top: -8,
                          zIndex: -1,
                          transform: [{
                            scale: pulseAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.9, 1.3]
                            })
                          }],
                          opacity: pulseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.7, 0]
                          })
                        }}
                      />
                    )}

                    <TouchableOpacity
                      activeOpacity={isOccupied || isNextEmpty ? 0.7 : 0.95}
                      onPress={() => setSelectedSlotIndex(n.index)}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 34,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isOccupied 
                          ? "#ffffff" 
                          : (isNextEmpty ? "#ffffff" : (isDark ? "#374151" : "#e5e7eb")),
                        borderWidth: isSelected ? 4 : 3,
                        borderColor: isSelected 
                          ? "#d97706" 
                          : (isOccupied 
                              ? "#10b981" 
                              : (isNextEmpty ? "#f59e0b" : (isDark ? "#4b5563" : "#9ca3af"))),
                        borderStyle: isNextEmpty ? "dashed" : "solid",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.15,
                        shadowRadius: 3,
                        elevation: isSelected ? 6 : 4,
                      }}
                    >
                      {isOccupied ? (
                        <Animated.View 
                          style={{ 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            position: 'relative', 
                            width: '100%', 
                            height: '100%',
                            transform: [{
                              translateY: decorSwayAnim.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [0, -2, 0]
                              })
                            }]
                          }}
                        >
                          {/* Plant Emoji */}
                          <Text style={{ fontSize: 30, marginBottom: 2 }}>{item.emoji || "🌳"}</Text>

                          {/* Tiny Pot Representation */}
                          <View
                            style={{
                              width: 20,
                              height: 7,
                              borderRadius: 2,
                              backgroundColor: (() => {
                                if (item.pot === "bronze") return "#cd7f32";
                                if (item.pot === "silver") return "#cbd5e1";
                                if (item.pot === "gold" || item.pot === "gold_glow") return "#fbbf24";
                                return "#d97706";
                              })(),
                              borderWidth: 0.5,
                              borderColor: "#fff",
                              marginTop: -4
                            }}
                          />
                        </Animated.View>
                      ) : isNextEmpty ? (
                        <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%', height: '100%' }}>
                          {/* Growing Active Plant Emoji */}
                          <Text allowFontScaling={false} style={{ fontSize: 30, marginBottom: 2 }}>{plantEmoji}</Text>

                          {/* Active Pot Style */}
                          <View
                            style={{
                              width: 20,
                              height: 7,
                              borderRadius: 2,
                              backgroundColor: potStyle.bg,
                              borderWidth: 0.5,
                              borderColor: "#fff",
                              marginTop: -4
                            }}
                          />
                        </View>
                      ) : (
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 18, opacity: 0.5 }}>🔒</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Brown Plate with Roman Numeral underneath (for completed or active nodes) */}
                    {!isLocked && (
                      <View 
                        style={{
                          position: "absolute",
                          bottom: -14,
                          alignSelf: 'center',
                          backgroundColor: "#854d0e",
                          paddingHorizontal: 8,
                          paddingVertical: 1.5,
                          borderRadius: 5,
                          borderWidth: 1,
                          borderColor: "#a16207",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.15,
                          shadowRadius: 1,
                          elevation: 2,
                          zIndex: 5,
                        }}
                      >
                        <Text 
                          style={{ 
                            color: "#fef3c7", 
                            fontSize: 7.5, 
                            fontFamily: "RedditSans-Bold", 
                            textAlign: "center",
                            letterSpacing: 0.5
                          }}
                        >
                          {toRoman(n.index + 1)}
                        </Text>
                      </View>
                    )}

                    {/* Top-Left Level Badge */}
                    <View
                      style={{
                        position: 'absolute',
                        top: -4,
                        left: -4,
                        backgroundColor: isOccupied ? '#3b82f6' : (isNextEmpty ? '#f97316' : '#6b7280'),
                        borderRadius: 9,
                        width: 18,
                        height: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1.5,
                        borderColor: '#fff',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.2,
                        shadowRadius: 1,
                        elevation: 3,
                        zIndex: 10,
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 9, fontFamily: 'RedditSans-Bold' }}>
                        {n.index + 1}
                      </Text>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>

          {/* Floating Glassy Header */}
          <View 
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              flexDirection: "row", 
              justifyContent: "space-between", 
              alignItems: "center", 
              paddingHorizontal: 20, 
              paddingTop: 16, 
              paddingBottom: 16,
              backgroundColor: isDark ? "#022c22" : "#16a34a",
              borderBottomWidth: 1,
              borderColor: isDark ? "rgba(6, 95, 70, 0.3)" : "rgba(134, 239, 172, 0.3)",
              zIndex: 10,
            }}
          >
            <Text className="text-lg font-redditsans-bold" style={{ color: "#fff" }}>
              {tLocal("virtual_plant.garden.title")}
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setGardenModalVisible(false);
                setSelectedSlotIndex(null);
              }} 
              className="p-1"
            >
              <FontAwesomeIcon icon={faTimes} color="#fff" size={20} />
            </TouchableOpacity>
          </View>

          {/* Floating Bottom Panel */}
          <View 
            style={{ 
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16,
              zIndex: 10,
            }}
          >
            {selectedSlotIndex !== null ? (() => {
              const details = getSlotDetails(selectedSlotIndex);
              return (
                <View 
                  className="p-3 rounded-2xl border"
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border + "40",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-2" style={{ flex: 1 }}>
                      <View 
                        style={{ 
                          width: 36, 
                          height: 36, 
                          borderRadius: 18, 
                          backgroundColor: selectedSlotIndex < garden.length 
                            ? (isDark ? "#065f46" : "#dcfce7") 
                            : (isDark ? "#78350f" : "#fef3c7"),
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Text allowFontScaling={false} style={{ fontSize: 20 }}>{details.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text className="text-[13px] font-redditsans-bold" style={{ color: colors.text }}>
                          {details.title}
                        </Text>
                        <Text className="text-[10px] font-redditsans-medium" style={{ color: colors.textMuted }}>
                          {details.subtitle}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setSelectedSlotIndex(null)}
                      className="w-5 h-5 rounded-full items-center justify-center"
                      style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)" }}
                    >
                      <FontAwesomeIcon icon={faTimes} size={10} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Speech bubble / feedback box inside the details card for active growing plant */}
                  {selectedSlotIndex === garden.length && speechText ? (
                    <View 
                      className="p-2 rounded-xl border mt-2.5" 
                      style={{ 
                        backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", 
                        borderColor: colors.border + "20" 
                      }}
                    >
                      <Text className="text-[11px] font-redditsans-medium italic" style={{ color: colors.textSecondary }}>
                        💬 {speechText}
                      </Text>
                    </View>
                  ) : null}

                  {/* Progress dashboard inside the details card for active growing plant */}
                  {selectedSlotIndex === garden.length ? (
                    <View className="mt-2.5 pt-2.5 border-t" style={{ borderColor: colors.border + "30" }}>
                      {/* Today's Watering Progress Bar */}
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-[10px] font-redditsans-bold" style={{ color: colors.textSecondary }}>
                          💧 {t("virtual_plant.wateringLevel")}: {Math.round(wateringProgressRate * 100)}% ({displayWateredCount}/{maxHabitsToday})
                        </Text>
                        <Text className="text-[9px] font-redditsans-medium italic" style={{ color: colors.textMuted }}>
                          {maxCompletedHabitsToday > 0
                            ? tLocal("virtual_plant.status.watered_today", { completed: Math.min(wateredCount, maxCompletedHabitsToday), total: maxCompletedHabitsToday })
                            : tLocal("virtual_plant.status.thirsty_today")
                          }
                        </Text>
                      </View>
                      <View className="w-full h-1 rounded-full overflow-hidden mb-2 bg-slate-200 dark:bg-slate-700">
                        <View style={{ flex: 1 }}>
                          <LinearGradient
                            colors={["#0ea5e9", "#38bdf8"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ width: `${Math.max(wateringProgressRate * 100, 3)}%`, height: '100%' }}
                          />
                        </View>
                      </View>

                      {/* Plant Level Growth Bar */}
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-[10px] font-redditsans-medium" style={{ color: colors.textSecondary }}>
                          🌱 {t("virtual_plant.stageName")} {plantLevel} ({currentLevelReq.name})
                        </Text>

                        {plantLevel < 5 ? (
                          <Text className="text-[9px] font-redditsans-bold" style={{ color: colors.textMuted }}>
                            {tLocal("virtual_plant.xp_remaining", { count: xpRemaining, level: plantLevel + 1 })}
                          </Text>
                        ) : (
                          <View className="flex-row items-center gap-1.5">
                            <Text className="text-[9px] font-redditsans-bold" style={{ color: "#fbbf24" }}>
                              {tLocal("virtual_plant.max_level")}
                            </Text>
                            <TouchableOpacity
                              onPress={handlePlantInGarden}
                              style={{
                                backgroundColor: "#10b981",
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 6,
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={{ color: "#fff", fontSize: 8, fontFamily: "RedditSans-Bold" }}>
                                {tLocal("virtual_plant.garden.plant_btn")}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                      <View className="w-full h-1 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                        <View style={{ flex: 1 }}>
                          <LinearGradient
                            colors={["#10b981", "#34d399"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ width: `${Math.max(plantXPPercentage, 2)}%`, height: '100%' }}
                          />
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View className="flex-row justify-between items-center pt-2 mt-2 border-t" style={{ borderColor: colors.border + "30" }}>
                      <Text className="text-[11px] font-redditsans-medium flex-1 mr-2" style={{ color: colors.textSecondary }}>
                        {details.description}
                      </Text>
                      {details.extra ? (
                        <Text className="text-[11px] font-redditsans-bold" style={{ color: "#f59e0b" }}>
                          {details.extra}
                        </Text>
                      ) : null}
                    </View>
                  )}

                  {/* Care Action Buttons Row inside the level map card */}
                  {selectedSlotIndex === garden.length && (
                    <View className="flex-row justify-between items-center gap-1.5 mt-3 pt-3 border-t" style={{ borderColor: colors.border + "30" }}>
                      {/* Action 1: Pet */}
                      <TouchableOpacity
                        onPress={handlePet}
                        className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 active:scale-95"
                        activeOpacity={0.7}
                      >
                        <FontAwesomeIcon icon={faHeart} size={11} color="#ef4444" />
                        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} className="text-[10px] font-redditsans-bold" style={{ color: colors.textSecondary }}>
                          {tLocal("virtual_plant.actions.pet")}
                        </Text>
                      </TouchableOpacity>

                      {/* Action 2: Water */}
                      <TouchableOpacity
                        onPress={handleWater}
                        style={{
                          backgroundColor: isWaterable ? "rgba(14, 165, 233, 0.12)" : "rgba(148, 163, 184, 0.05)",
                          opacity: isWaterable ? 1 : 0.45,
                        }}
                        className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-xl active:scale-95"
                        activeOpacity={0.7}
                      >
                        <FontAwesomeIcon icon={faTint} size={11} color={isWaterable ? "#0ea5e9" : "#94a3b8"} />
                        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} className="text-[10px] font-redditsans-bold" style={{ color: isWaterable ? (isDark ? "#38bdf8" : "#0284c7") : "#94a3b8" }}>
                          {tLocal("virtual_plant.actions.water")}
                        </Text>
                      </TouchableOpacity>

                      {/* Action 3: Sun */}
                      <TouchableOpacity
                        onPress={handleSun}
                        style={{
                          backgroundColor: isSunable ? "rgba(234, 179, 8, 0.12)" : "rgba(148, 163, 184, 0.05)",
                          opacity: isSunable ? 1 : 0.45,
                        }}
                        className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-xl active:scale-95"
                        activeOpacity={0.7}
                      >
                        <FontAwesomeIcon icon={faSun} size={11} color={isSunable ? "#eab308" : "#94a3b8"} />
                        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} className="text-[10px] font-redditsans-bold" style={{ color: isSunable ? (isDark ? "#fde047" : "#a16207") : "#94a3b8" }}>
                          {tLocal("virtual_plant.actions.sun")}
                        </Text>
                      </TouchableOpacity>

                      {/* Action 4: Fertilize */}
                      <TouchableOpacity
                        onPress={handleFertilize}
                        style={{
                          backgroundColor: isFertilizable ? "rgba(34, 197, 94, 0.12)" : "rgba(148, 163, 184, 0.05)",
                          opacity: isFertilizable ? 1 : 0.45,
                        }}
                        className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-xl active:scale-95"
                        activeOpacity={0.7}
                      >
                        <FontAwesomeIcon icon={faStar} size={11} color={isFertilizable ? "#22c55e" : "#94a3b8"} />
                        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} className="text-[10px] font-redditsans-bold" style={{ color: isFertilizable ? (isDark ? "#4ade80" : "#16a34a") : "#94a3b8" }}>
                          {tLocal("virtual_plant.actions.fertilize")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })() : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={isRenameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (hasNamedPlant) {
            setRenameModalVisible(false);
          }
        }}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { justifyContent: "center" }]}
          activeOpacity={1}
          onPress={() => {
            if (hasNamedPlant) {
              setRenameModalVisible(false);
            }
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.renameModalContent, { backgroundColor: colors.card }]}
          >
            <Text className="text-base font-redditsans-bold mb-4 text-center" style={{ color: colors.text }}>
              {hasNamedPlant ? `${tLocal("virtual_plant.customizer.rename_title")} ✏️` : tLocal("virtual_plant.customizer.rename_welcome")}
            </Text>
            {/* Visual Plant Preview for Naming */}
            <View style={{ alignItems: "center", marginBottom: 20, marginTop: 10 }}>
              <Text allowFontScaling={false} style={{ fontSize: 64, transform: [{ scale: 1.1 }] }}>{plantEmoji}</Text>
              <View
                style={{
                  width: 56,
                  height: 20,
                  borderRadius: 6,
                  borderWidth: 1.5,
                  backgroundColor: potStyle.bg,
                  borderColor: potStyle.border,
                  marginTop: 4,
                }}
              />
            </View>
            <TextInput
              value={renameInput}
              onChangeText={setRenameInput}
              maxLength={20}
              placeholder={tLocal("virtual_plant.customizer.rename_placeholder")}
              placeholderTextColor={colors.textMuted}
              className="font-redditsans-medium text-sm px-4 py-3 rounded-xl border mb-4"
              style={{
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.background,
              }}
              autoFocus
            />
            <View className="flex-row gap-3">
              {hasNamedPlant && (
                <TouchableOpacity
                  onPress={() => {
                    setRenameModalVisible(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl items-center border"
                  style={{ borderColor: colors.border }}
                  activeOpacity={0.7}
                >
                  <Text className="font-redditsans-bold text-sm" style={{ color: colors.textSecondary }}>
                    {tLocal("virtual_plant.customizer.rename_cancel")}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                disabled={renameInput.trim().length === 0}
                onPress={() => {
                  const newName = renameInput.trim();
                  if (newName.length === 0) return;
                  storage.set(getStorageKey("plantName"), newName);
                  storage.set(getStorageKey("hasNamedPlant"), true);
                  setPlantName(newName);
                  setHasNamedPlant(true);
                  setRenameModalVisible(false);
                }}
                className="flex-1 py-2.5 rounded-xl items-center"
                style={{
                  backgroundColor: renameInput.trim().length === 0 ? colors.border : "#10b981",
                  opacity: renameInput.trim().length === 0 ? 0.65 : 1
                }}
                activeOpacity={0.7}
              >
                <Text className="font-redditsans-bold text-sm" style={{ color: "#fff" }}>
                  {tLocal("virtual_plant.customizer.rename_save")}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleTriangle: {
    position: "absolute",
    left: -6,
    top: "40%",
    width: 10,
    height: 10,
    transform: [{ rotate: "45deg" }],
    zIndex: -1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
    elevation: 20,
  },
  renameModalContent: {
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 32,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
});

export default VirtualPlant;
