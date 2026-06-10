import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

export type Language = 'vi' | 'en';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const currentLanguage = (i18n.language || 'vi') as Language;

  const changeLanguage = useCallback(
    async (lang: Language) => {
      await i18n.changeLanguage(lang);
      localStorage.setItem('app_lang', lang);
    },
    [i18n]
  );

  return {
    language: currentLanguage,
    changeLanguage,
    isVietnamese: currentLanguage === 'vi',
    isEnglish: currentLanguage === 'en',
  };
};
