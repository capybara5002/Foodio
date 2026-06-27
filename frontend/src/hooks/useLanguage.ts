import { useTranslation } from 'react-i18next';
import { useCallback, useMemo, useState } from 'react';
import {
  APP_LANGUAGES,
  DEFAULT_APP_LANGUAGE,
  getAppLanguageOption,
  normalizeAppLanguage
} from '../i18n/languages';
import { loadLanguageResources } from '../i18n/translationLoader';

export type Language = string;

export const useLanguage = () => {
  const { i18n } = useTranslation();
  const [isLoadingLanguage, setIsLoadingLanguage] = useState(false);

  const currentLanguage = normalizeAppLanguage(i18n.language) || DEFAULT_APP_LANGUAGE;
  const selectedLanguage = useMemo(() => getAppLanguageOption(currentLanguage), [currentLanguage]);

  const changeLanguage = useCallback(
    async (lang: Language) => {
      const nextLanguage = normalizeAppLanguage(lang) || DEFAULT_APP_LANGUAGE;
      setIsLoadingLanguage(true);

      try {
        const loaded = await loadLanguageResources(i18n, nextLanguage);
        if (!loaded) return false;

        await i18n.changeLanguage(nextLanguage);
        localStorage.setItem('app_lang', nextLanguage);
        return true;
      } finally {
        setIsLoadingLanguage(false);
      }
    },
    [i18n]
  );

  return {
    language: currentLanguage,
    selectedLanguage,
    languages: APP_LANGUAGES,
    changeLanguage,
    isLoadingLanguage,
    isVietnamese: currentLanguage === 'vi',
    isEnglish: currentLanguage === 'en',
  };
};
