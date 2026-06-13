import 'react-i18next';
import translationVI from './locales/vi/translation.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof translationVI;
    };
  }
}
