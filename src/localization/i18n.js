import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { storage } from '../utils/MMKVStore';
import en from './en.json';
import az from './az.json';
import tr from './tr.json';
import ru from './ru.json';
import de from './de.json';
import fr from './fr.json';
import es from './es.json';
import it from './it.json';
import ar from './ar.json';
import zh from './zh.json';


const resources = {
  en: { translation: en },
  az: { translation: az },
  tr: { translation: tr },
  ru: { translation: ru },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  it: { translation: it },
  ar: { translation: ar },
  zh: { translation: zh },
};

const getStoredLanguage = () => {
  const language = storage.getString('userLanguage');
  return language || 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
