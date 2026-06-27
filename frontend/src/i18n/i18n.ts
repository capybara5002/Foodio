import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from './locales/en/translation.json';
import translationVI from './locales/vi/translation.json';
import { detectBrowserAppLanguage, hasBundledAppLanguage, normalizeAppLanguage } from './languages';
import { loadLanguageResources } from './translationLoader';

const resources = {
  en: {
    translation: translationEN,
  },
  vi: {
    translation: translationVI,
  },
};

const requestedLanguage =
  normalizeAppLanguage(localStorage.getItem('app_lang')) ||
  detectBrowserAppLanguage();
const initialLanguage = hasBundledAppLanguage(requestedLanguage) ? requestedLanguage : 'vi';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false, // React already safe from xss
    },
  });

if (requestedLanguage !== initialLanguage) {
  void loadLanguageResources(i18n, requestedLanguage).then((loaded) => {
    if (loaded) {
      localStorage.setItem('app_lang', requestedLanguage);
      void i18n.changeLanguage(requestedLanguage);
    }
  });
}

export default i18n;
