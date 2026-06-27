import type { i18n as I18nInstance } from 'i18next';
import translationEN from './locales/en/translation.json';
import { translateAppResources } from '../api/i18nApi';
import { hasBundledAppLanguage, normalizeAppLanguage } from './languages';

type TranslationValue = string | TranslationTree;
type TranslationTree = {
  [key: string]: TranslationValue;
};

const CACHE_VERSION = 'v1';
const CACHE_PREFIX = `foodio_app_i18n_${CACHE_VERSION}`;
const pendingLoads = new Map<string, Promise<boolean>>();

const baseFlatResources = flattenTranslations(translationEN as TranslationTree);

export function flattenTranslations(
  tree: TranslationTree,
  prefix = '',
  output: Record<string, string> = {}
): Record<string, string> {
  Object.entries(tree).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      output[path] = value;
      return;
    }

    flattenTranslations(value, path, output);
  });

  return output;
}

export function unflattenTranslations(entries: Record<string, string>): TranslationTree {
  const root: TranslationTree = {};

  Object.entries(entries).forEach(([path, value]) => {
    const parts = path.split('.');
    let cursor = root;

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        cursor[part] = value;
        return;
      }

      const nextValue = cursor[part];
      if (!nextValue || typeof nextValue === 'string') {
        cursor[part] = {};
      }

      cursor = cursor[part] as TranslationTree;
    });
  });

  return root;
}

export async function loadLanguageResources(i18n: I18nInstance, requestedLanguage: string): Promise<boolean> {
  const language = normalizeAppLanguage(requestedLanguage);
  if (!language) return false;

  if (hasBundledAppLanguage(language) || i18n.hasResourceBundle(language, 'translation')) {
    return true;
  }

  const existingLoad = pendingLoads.get(language);
  if (existingLoad) return await existingLoad;

  const loadPromise = loadDynamicLanguageResources(i18n, language)
    .finally(() => pendingLoads.delete(language));

  pendingLoads.set(language, loadPromise);
  return await loadPromise;
}

async function loadDynamicLanguageResources(i18n: I18nInstance, language: string): Promise<boolean> {
  const cachedEntries = readCachedEntries(language);
  if (cachedEntries) {
    i18n.addResourceBundle(language, 'translation', unflattenTranslations(cachedEntries), true, true);
    return true;
  }

  try {
    const response = await translateAppResources('en', language, baseFlatResources);
    if (response.entries && Object.keys(response.entries).length > 0) {
      i18n.addResourceBundle(language, 'translation', unflattenTranslations(response.entries), true, true);
      cacheEntries(language, response.entries);
      return true;
    }
  } catch (error) {
    console.warn(`[i18n] Failed to load dynamic translations for '${language}'.`, error);
  }

  return false;
}

function getCacheKey(language: string) {
  return `${CACHE_PREFIX}_${language}`;
}

function readCachedEntries(language: string): Record<string, string> | null {
  try {
    const rawValue = localStorage.getItem(getCacheKey(language));
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.entries !== 'object') {
      return null;
    }

    return parsed.entries as Record<string, string>;
  } catch (error) {
    console.warn(`[i18n] Failed to read cached translations for '${language}'.`, error);
    return null;
  }
}

function cacheEntries(language: string, entries: Record<string, string>) {
  try {
    localStorage.setItem(getCacheKey(language), JSON.stringify({
      cachedAt: Date.now(),
      entries
    }));
  } catch (error) {
    console.warn(`[i18n] Failed to cache translations for '${language}'.`, error);
  }
}
