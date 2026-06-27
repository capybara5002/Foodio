export type AppLanguageOption = {
  code: string;
  label: string;
  nativeLabel: string;
};

export const DEFAULT_APP_LANGUAGE = 'vi';

export const APP_LANGUAGES: AppLanguageOption[] = [
  { code: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو' },
  { code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia' },
  { code: 'ms', label: 'Malay', nativeLabel: 'Bahasa Melayu' },
  { code: 'th', label: 'Thai', nativeLabel: 'ไทย' },
  { code: 'lo', label: 'Lao', nativeLabel: 'ລາວ' },
  { code: 'km', label: 'Khmer', nativeLabel: 'ខ្មែរ' },
  { code: 'my', label: 'Burmese', nativeLabel: 'မြန်မာ' },
  { code: 'tl', label: 'Filipino', nativeLabel: 'Filipino' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands' },
  { code: 'sv', label: 'Swedish', nativeLabel: 'Svenska' },
  { code: 'no', label: 'Norwegian', nativeLabel: 'Norsk' },
  { code: 'da', label: 'Danish', nativeLabel: 'Dansk' },
  { code: 'fi', label: 'Finnish', nativeLabel: 'Suomi' },
  { code: 'pl', label: 'Polish', nativeLabel: 'Polski' },
  { code: 'cs', label: 'Czech', nativeLabel: 'Čeština' },
  { code: 'sk', label: 'Slovak', nativeLabel: 'Slovenčina' },
  { code: 'hu', label: 'Hungarian', nativeLabel: 'Magyar' },
  { code: 'ro', label: 'Romanian', nativeLabel: 'Română' },
  { code: 'bg', label: 'Bulgarian', nativeLabel: 'Български' },
  { code: 'uk', label: 'Ukrainian', nativeLabel: 'Українська' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe' },
  { code: 'el', label: 'Greek', nativeLabel: 'Ελληνικά' },
  { code: 'he', label: 'Hebrew', nativeLabel: 'עברית' },
  { code: 'fa', label: 'Persian', nativeLabel: 'فارسی' },
  { code: 'sw', label: 'Swahili', nativeLabel: 'Kiswahili' },
  { code: 'am', label: 'Amharic', nativeLabel: 'አማርኛ' },
  { code: 'ha', label: 'Hausa', nativeLabel: 'Hausa' },
  { code: 'yo', label: 'Yoruba', nativeLabel: 'Yorùbá' },
  { code: 'zu', label: 'Zulu', nativeLabel: 'IsiZulu' },
  { code: 'af', label: 'Afrikaans', nativeLabel: 'Afrikaans' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'ne', label: 'Nepali', nativeLabel: 'नेपाली' },
  { code: 'si', label: 'Sinhala', nativeLabel: 'සිංහල' },
  { code: 'mn', label: 'Mongolian', nativeLabel: 'Монгол' },
  { code: 'kk', label: 'Kazakh', nativeLabel: 'Қазақ' },
  { code: 'uz', label: 'Uzbek', nativeLabel: 'Oʻzbek' },
  { code: 'az', label: 'Azerbaijani', nativeLabel: 'Azərbaycanca' },
  { code: 'ka', label: 'Georgian', nativeLabel: 'ქართული' },
  { code: 'hy', label: 'Armenian', nativeLabel: 'Հայերեն' },
  { code: 'sr', label: 'Serbian', nativeLabel: 'Srpski' },
  { code: 'hr', label: 'Croatian', nativeLabel: 'Hrvatski' },
  { code: 'sl', label: 'Slovenian', nativeLabel: 'Slovenščina' }
];

const LANGUAGE_ALIASES: Record<string, string> = {
  cmn: 'zh',
  yue: 'zh',
  nb: 'no',
  nn: 'no',
  fil: 'tl'
};

export const BUNDLED_APP_LANGUAGES = new Set(['en', 'vi']);

export function normalizeAppLanguage(value?: string | null): string {
  const normalizedValue = value?.trim().toLowerCase();
  if (!normalizedValue) return '';

  const exactMatch = APP_LANGUAGES.find((language) => language.code === normalizedValue);
  if (exactMatch) return exactMatch.code;

  const baseCode = normalizedValue.split(/[-_]/)[0];
  const aliasedCode = LANGUAGE_ALIASES[baseCode] ?? baseCode;
  return APP_LANGUAGES.some((language) => language.code === aliasedCode) ? aliasedCode : '';
}

export function detectBrowserAppLanguage(fallbackLang = DEFAULT_APP_LANGUAGE): string {
  if (typeof navigator !== 'undefined') {
    const browserLanguages = [
      ...(Array.isArray(navigator.languages) ? navigator.languages : []),
      navigator.language
    ];

    for (const browserLanguage of browserLanguages) {
      const languageCode = normalizeAppLanguage(browserLanguage);
      if (languageCode) return languageCode;
    }
  }

  return normalizeAppLanguage(fallbackLang) || DEFAULT_APP_LANGUAGE;
}

export function getAppLanguageOption(languageCode: string): AppLanguageOption {
  return APP_LANGUAGES.find((language) => language.code === languageCode) ?? APP_LANGUAGES[0];
}

export function hasBundledAppLanguage(languageCode: string): boolean {
  return BUNDLED_APP_LANGUAGES.has(normalizeAppLanguage(languageCode));
}
