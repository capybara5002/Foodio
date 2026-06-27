export type AppLanguageOption = {
  code: string;
  label: string;
  nativeLabel: string;
};

export const DEFAULT_APP_LANGUAGE = 'vi';

export const APP_LANGUAGES: AppLanguageOption[] = [
  { code: 'vi', label: 'Vietnamese', nativeLabel: 'Ti\u1ebfng Vi\u1ec7t' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ko', label: 'Korean', nativeLabel: '\ud55c\uad6d\uc5b4' },
  { code: 'ja', label: 'Japanese', nativeLabel: '\u65e5\u672c\u8a9e' },
  { code: 'fr', label: 'French', nativeLabel: 'Fran\u00e7ais' },
  { code: 'zh', label: 'Chinese', nativeLabel: '\u4e2d\u6587' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Espa\u00f1ol' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Portugu\u00eas' },
  { code: 'ru', label: 'Russian', nativeLabel: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439' },
  { code: 'ar', label: 'Arabic', nativeLabel: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
  { code: 'hi', label: 'Hindi', nativeLabel: '\u0939\u093f\u0928\u094d\u0926\u0940' },
  { code: 'bn', label: 'Bengali', nativeLabel: '\u09ac\u09be\u0982\u09b2\u09be' },
  { code: 'ur', label: 'Urdu', nativeLabel: '\u0627\u0631\u062f\u0648' },
  { code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia' },
  { code: 'ms', label: 'Malay', nativeLabel: 'Bahasa Melayu' },
  { code: 'th', label: 'Thai', nativeLabel: '\u0e44\u0e17\u0e22' },
  { code: 'lo', label: 'Lao', nativeLabel: '\u0ea5\u0eb2\u0ea7' },
  { code: 'km', label: 'Khmer', nativeLabel: '\u1781\u17d2\u1798\u17c2\u179a' },
  { code: 'my', label: 'Burmese', nativeLabel: '\u1019\u103c\u1014\u103a\u1019\u102c' },
  { code: 'tl', label: 'Filipino', nativeLabel: 'Filipino' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands' },
  { code: 'sv', label: 'Swedish', nativeLabel: 'Svenska' },
  { code: 'no', label: 'Norwegian', nativeLabel: 'Norsk' },
  { code: 'da', label: 'Danish', nativeLabel: 'Dansk' },
  { code: 'fi', label: 'Finnish', nativeLabel: 'Suomi' },
  { code: 'pl', label: 'Polish', nativeLabel: 'Polski' },
  { code: 'cs', label: 'Czech', nativeLabel: '\u010ce\u0161tina' },
  { code: 'sk', label: 'Slovak', nativeLabel: 'Sloven\u010dina' },
  { code: 'hu', label: 'Hungarian', nativeLabel: 'Magyar' },
  { code: 'ro', label: 'Romanian', nativeLabel: 'Rom\u00e2n\u0103' },
  { code: 'bg', label: 'Bulgarian', nativeLabel: '\u0411\u044a\u043b\u0433\u0430\u0440\u0441\u043a\u0438' },
  { code: 'uk', label: 'Ukrainian', nativeLabel: '\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'T\u00fcrk\u00e7e' },
  { code: 'el', label: 'Greek', nativeLabel: '\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac' },
  { code: 'he', label: 'Hebrew', nativeLabel: '\u05e2\u05d1\u05e8\u05d9\u05ea' },
  { code: 'fa', label: 'Persian', nativeLabel: '\u0641\u0627\u0631\u0633\u06cc' },
  { code: 'sw', label: 'Swahili', nativeLabel: 'Kiswahili' },
  { code: 'am', label: 'Amharic', nativeLabel: '\u12a0\u121b\u122d\u129b' },
  { code: 'ha', label: 'Hausa', nativeLabel: 'Hausa' },
  { code: 'yo', label: 'Yoruba', nativeLabel: 'Yor\u00f9b\u00e1' },
  { code: 'zu', label: 'Zulu', nativeLabel: 'IsiZulu' },
  { code: 'af', label: 'Afrikaans', nativeLabel: 'Afrikaans' },
  { code: 'ta', label: 'Tamil', nativeLabel: '\u0ba4\u0bae\u0bbf\u0bb4\u0bcd' },
  { code: 'te', label: 'Telugu', nativeLabel: '\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41' },
  { code: 'mr', label: 'Marathi', nativeLabel: '\u092e\u0930\u093e\u0920\u0940' },
  { code: 'gu', label: 'Gujarati', nativeLabel: '\u0a97\u0ac1\u0a9c\u0ab0\u0abe\u0aa4\u0ac0' },
  { code: 'pa', label: 'Punjabi', nativeLabel: '\u0a2a\u0a70\u0a1c\u0a3e\u0a2c\u0a40' },
  { code: 'kn', label: 'Kannada', nativeLabel: '\u0c95\u0ca8\u0ccd\u0ca8\u0ca1' },
  { code: 'ml', label: 'Malayalam', nativeLabel: '\u0d2e\u0d32\u0d2f\u0d3e\u0d33\u0d02' },
  { code: 'ne', label: 'Nepali', nativeLabel: '\u0928\u0947\u092a\u093e\u0932\u0940' },
  { code: 'si', label: 'Sinhala', nativeLabel: '\u0dc3\u0dd2\u0d82\u0dc4\u0dbd' },
  { code: 'mn', label: 'Mongolian', nativeLabel: '\u041c\u043e\u043d\u0433\u043e\u043b' },
  { code: 'kk', label: 'Kazakh', nativeLabel: '\u049a\u0430\u0437\u0430\u049b' },
  { code: 'uz', label: 'Uzbek', nativeLabel: 'O\u02bbzbek' },
  { code: 'az', label: 'Azerbaijani', nativeLabel: 'Az\u0259rbaycanca' },
  { code: 'ka', label: 'Georgian', nativeLabel: '\u10e5\u10d0\u10e0\u10d7\u10e3\u10da\u10d8' },
  { code: 'hy', label: 'Armenian', nativeLabel: '\u0540\u0561\u0575\u0565\u0580\u0565\u0576' },
  { code: 'sr', label: 'Serbian', nativeLabel: 'Srpski' },
  { code: 'hr', label: 'Croatian', nativeLabel: 'Hrvatski' },
  { code: 'sl', label: 'Slovenian', nativeLabel: 'Sloven\u0161\u010dina' }
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
