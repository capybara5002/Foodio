import { Restaurant } from '../types';
import { apiBase } from '../api/apiConfig';

type StartCallback = (restaurant: Restaurant, text: string) => void;
type EndCallback = () => void;

type BasicNarrationResponse = {
  text?: string;
};

type CloudNarrationResponse = {
  translatedText?: string;
  audioSegments?: string[];
  audioMimeType?: string;
};

const startSubscribers = new Set<StartCallback>();
const endSubscribers = new Set<EndCallback>();

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let activeRestaurant: Restaurant | null = null;
let activeText = '';
let isMuted = false;
let playbackRunId = 0;

const BASIC_NARRATION_LANGUAGES = new Set(['en', 'vi']);

const SUPPORTED_NARRATION_LANGUAGES = new Set([
  'en',
  'ko',
  'ja',
  'fr',
  'zh',
  'vi',
  'es',
  'de',
  'it',
  'pt',
  'ru',
  'ar',
  'hi',
  'bn',
  'ur',
  'id',
  'ms',
  'th',
  'nl',
  'sv',
  'da',
  'fi',
  'pl',
  'cs',
  'sk',
  'hu',
  'ro',
  'bg',
  'uk',
  'tr',
  'el',
  'he',
  'ta',
  'te',
  'mr',
  'gu',
  'pa',
  'kn',
  'ml',
  'ne',
  'sr',
  'hr'
]);

const LANGUAGE_ALIASES: Record<string, string> = {
  cmn: 'zh',
  yue: 'zh'
};

const SPEECH_LOCALES: Record<string, string> = {
  en: 'en-US',
  ko: 'ko-KR',
  ja: 'ja-JP',
  fr: 'fr-FR',
  zh: 'zh-CN',
  vi: 'vi-VN',
  es: 'es-ES',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-BR',
  ru: 'ru-RU',
  ar: 'ar-SA',
  hi: 'hi-IN',
  bn: 'bn-IN',
  ur: 'ur-IN',
  id: 'id-ID',
  ms: 'ms-MY',
  th: 'th-TH',
  nl: 'nl-NL',
  sv: 'sv-SE',
  da: 'da-DK',
  fi: 'fi-FI',
  pl: 'pl-PL',
  cs: 'cs-CZ',
  sk: 'sk-SK',
  hu: 'hu-HU',
  ro: 'ro-RO',
  bg: 'bg-BG',
  uk: 'uk-UA',
  tr: 'tr-TR',
  el: 'el-GR',
  he: 'he-IL',
  ta: 'ta-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  ne: 'ne-NP',
  sr: 'sr-RS',
  hr: 'hr-HR'
};

const VOICE_NAME_HINTS: Record<string, string[]> = {
  en: ['english'],
  vi: ['vietnamese', 'viet', 'ti\u1ebfng vi\u1ec7t'],
  zh: ['chinese', 'mandarin', 'zhongwen'],
  ja: ['japanese'],
  ko: ['korean'],
  fr: ['french'],
  es: ['spanish'],
  de: ['german'],
  it: ['italian'],
  pt: ['portuguese'],
  th: ['thai'],
  id: ['indonesian'],
  ms: ['malay']
};

export function onNarrationStart(cb: StartCallback) {
  startSubscribers.add(cb);
  return () => startSubscribers.delete(cb);
}

export function onNarrationEnd(cb: EndCallback) {
  endSubscribers.add(cb);
  return () => endSubscribers.delete(cb);
}

function notifyStart(restaurant: Restaurant, text: string) {
  startSubscribers.forEach((cb) => cb(restaurant, text));
}

function notifyEnd() {
  endSubscribers.forEach((cb) => cb());
}

export function isNarrating(): boolean {
  return activeRestaurant !== null;
}

export function getActiveNarration() {
  return activeRestaurant ? { restaurant: activeRestaurant, text: activeText } : null;
}

export function normalizeNarrationLanguage(value?: string | null): string {
  const normalizedValue = value?.trim().toLowerCase();
  if (!normalizedValue) return '';

  if (SUPPORTED_NARRATION_LANGUAGES.has(normalizedValue)) {
    return normalizedValue;
  }

  const baseCode = normalizedValue.split(/[-_]/)[0];
  const aliasedCode = LANGUAGE_ALIASES[baseCode] ?? baseCode;

  return SUPPORTED_NARRATION_LANGUAGES.has(aliasedCode) ? aliasedCode : '';
}

export function resolveBrowserNarrationLanguage(fallbackLang = 'vi'): string {
  if (typeof navigator !== 'undefined') {
    const browserLanguages = [
      ...(Array.isArray(navigator.languages) ? navigator.languages : []),
      navigator.language
    ];

    for (const browserLanguage of browserLanguages) {
      const languageCode = normalizeNarrationLanguage(browserLanguage);
      if (languageCode) return languageCode;
    }
  }

  return normalizeNarrationLanguage(fallbackLang) || 'vi';
}

export function setMuted(muted: boolean) {
  isMuted = muted;
  if (isMuted) {
    stopNarration();
  }
}

export function getMuted(): boolean {
  return isMuted;
}

export function stopNarration() {
  playbackRunId += 1;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  currentUtterance = null;
  if (activeRestaurant) {
    activeRestaurant = null;
    activeText = '';
    notifyEnd();
  }
}

export async function playNarration(restaurant: Restaurant, lang = resolveBrowserNarrationLanguage()) {
  if (isMuted) return;

  stopNarration();
  const targetLang = normalizeNarrationLanguage(lang) || resolveBrowserNarrationLanguage();
  const runId = playbackRunId;

  activeRestaurant = restaurant;

  // Stored restaurant audio is the default English asset, so skip it for other browser languages.
  if (restaurant.audioUrl && targetLang === 'en') {
    activeText = `Playing audio guide for ${restaurant.name}`;
    notifyStart(restaurant, activeText);

    try {
      const audio = new Audio(restaurant.audioUrl);
      currentAudio = audio;
      audio.onended = () => {
        if (currentAudio === audio && playbackRunId === runId) {
          stopNarration();
        }
      };
      await audio.play();
      return;
    } catch (err) {
      console.warn('Failed to play audioUrl, falling back to generated narration', err);
    }
  }

  if (targetLang !== 'en') {
    try {
      const cloudNarration = await fetchCloudNarration(restaurant, targetLang);
      if (playbackRunId !== runId || isMuted) return;

      const translatedText = cloudNarration.translatedText?.trim();
      const audioSegments = cloudNarration.audioSegments ?? [];

      if (translatedText) {
        activeText = translatedText;
        notifyStart(restaurant, translatedText);
      }

      if (audioSegments.length > 0) {
        try {
          await playAudioSegments(audioSegments, cloudNarration.audioMimeType || 'audio/mpeg', runId);
          return;
        } catch (audioError) {
          console.warn('Cloud narration audio failed, falling back to browser speech synthesis', audioError);
        }
      }

      if (translatedText) {
        await speakText(restaurant, translatedText, targetLang, runId);
        return;
      }
    } catch (err) {
      console.warn('Failed to create browser-language cloud narration, using local fallback', err);
    }
  }

  let text = '';
  let speechLang = targetLang;
  try {
    text = await fetchBasicNarrationText(restaurant, targetLang);
  } catch (err) {
    console.warn('Failed to call backend narration endpoint, using client fallback', err);
    text = buildFallbackText(restaurant, targetLang);
  }

  if (!BASIC_NARRATION_LANGUAGES.has(targetLang)) {
    speechLang = 'en';
  }

  if (playbackRunId !== runId || isMuted) return;

  activeText = text;
  notifyStart(restaurant, text);
  await speakText(restaurant, text, speechLang, runId);
}

async function fetchBasicNarrationText(restaurant: Restaurant, lang: string): Promise<string> {
  const narrationLang = BASIC_NARRATION_LANGUAGES.has(lang) ? lang : 'en';
  const response = await fetch(`${apiBase}/api/audio/narration`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': narrationLang
    },
    body: JSON.stringify({
      restaurantId: restaurant.id,
      language: narrationLang
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  const data = await response.json() as BasicNarrationResponse;
  return data.text?.trim() || buildFallbackText(restaurant, narrationLang);
}

async function fetchCloudNarration(restaurant: Restaurant, lang: string): Promise<CloudNarrationResponse> {
  const response = await fetch(`${apiBase}/api/audio-guide/narrate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': lang
    },
    body: JSON.stringify({
      text: buildCloudSourceText(restaurant),
      targetLang: lang
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch cloud narration: ${response.status}`);
  }

  return await response.json() as CloudNarrationResponse;
}

async function playAudioSegments(audioSegments: string[], mimeType: string, runId: number) {
  for (const segment of audioSegments) {
    if (playbackRunId !== runId || isMuted) return;
    await playAudioSegment(segment, mimeType, runId);
  }

  if (playbackRunId === runId) {
    stopNarration();
  }
}

function playAudioSegment(segment: string, mimeType: string, runId: number) {
  return new Promise<void>((resolve, reject) => {
    const audio = new Audio(`data:${mimeType};base64,${segment}`);
    let settled = false;
    const cancelWatcher = window.setInterval(() => {
      if (playbackRunId !== runId || currentAudio !== audio) {
        cleanup();
        resolve();
      }
    }, 100);

    const cleanup = () => {
      if (settled) return;
      settled = true;
      window.clearInterval(cancelWatcher);
      audio.onended = null;
      audio.onerror = null;
      if (currentAudio === audio) {
        currentAudio = null;
      }
    };

    currentAudio = audio;
    audio.onended = () => {
      cleanup();
      resolve();
    };
    audio.onerror = () => {
      cleanup();
      reject(new Error('Audio segment failed to play.'));
    };

    void audio.play().catch((error) => {
      cleanup();
      reject(error);
    });
  });
}

async function waitForSpeechVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }

  const synth = window.speechSynthesis;
  const loadedVoices = synth.getVoices();
  if (loadedVoices.length > 0) {
    return loadedVoices;
  }

  return await new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      synth.removeEventListener('voiceschanged', finish);
      resolve(synth.getVoices());
    };

    const timeoutId = window.setTimeout(finish, 1800);
    synth.addEventListener('voiceschanged', finish);
  });
}

function findMatchingVoice(lang: string, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const targetLocale = (SPEECH_LOCALES[lang] ?? lang).toLowerCase();
  const targetBase = targetLocale.split(/[-_]/)[0];
  const hints = [
    lang.toLowerCase(),
    targetLocale,
    targetBase,
    ...(VOICE_NAME_HINTS[lang] ?? [])
  ];

  const exactLocaleVoice = voices.find((voice) => voice.lang.toLowerCase() === targetLocale);
  if (exactLocaleVoice) return exactLocaleVoice;

  const sameLanguageVoice = voices.find((voice) => {
    const voiceLang = voice.lang.toLowerCase();
    return voiceLang === targetBase || voiceLang.startsWith(`${targetBase}-`);
  });
  if (sameLanguageVoice) return sameLanguageVoice;

  return voices.find((voice) => {
    const voiceName = voice.name.toLowerCase();
    const voiceLang = voice.lang.toLowerCase();
    return hints.some((hint) => voiceName.includes(hint) || voiceLang.includes(hint));
  }) ?? null;
}

async function speakText(restaurant: Restaurant, text: string, lang: string, runId: number) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const voices = await waitForSpeechVoices();
    if (playbackRunId !== runId || isMuted) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;
    const matchingVoice = findMatchingVoice(lang, voices);

    if (!matchingVoice && lang !== 'en') {
      console.warn(`[Audio Narration] No browser voice found for '${lang}'. Skipping Web Speech fallback to avoid English playback.`);
      window.setTimeout(() => {
        if (activeRestaurant === restaurant && playbackRunId === runId) {
          stopNarration();
        }
      }, 3000);
      return;
    }

    utterance.lang = SPEECH_LOCALES[lang] ?? lang;
    utterance.voice = matchingVoice;
    utterance.rate = lang === 'vi' ? 0.95 : 0.9;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (currentUtterance === utterance && playbackRunId === runId) {
        stopNarration();
      }
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      if (currentUtterance === utterance && playbackRunId === runId) {
        stopNarration();
      }
    };

    window.speechSynthesis.speak(utterance);
    return;
  }

  console.warn('window.speechSynthesis is not supported on this browser.');
  setTimeout(() => {
    if (activeRestaurant === restaurant && playbackRunId === runId) {
      stopNarration();
    }
  }, 5000);
}

function buildCloudSourceText(restaurant: Restaurant): string {
  const dishes = restaurant.dishes?.map((dish) => dish.name).slice(0, 3).join(', ');
  const recommendedDishes = dishes || 'local specialties';
  const description = restaurant.description?.trim();

  return [
    `${restaurant.name} is a food spot in ${restaurant.area}, located at ${restaurant.address}.`,
    description,
    `It has a rating of ${restaurant.rating} stars and a ${restaurant.priceRange} price range.`,
    `Recommended dishes include ${recommendedDishes}.`,
    `Opening hours: ${restaurant.openingHours}.`
  ].filter(Boolean).join(' ');
}

function buildFallbackText(restaurant: Restaurant, lang: string): string {
  const narrationLang = normalizeNarrationLanguage(lang) || 'en';
  const dishes = restaurant.dishes ? restaurant.dishes.map((d) => d.name).slice(0, 3).join(', ') : '';
  const dishesStr = dishes || (narrationLang === 'vi' ? 'c\u00e1c m\u00f3n \u0103n \u0111\u1eb7c tr\u01b0ng' : 'signature dishes');

  if (narrationLang === 'vi') {
    return `${restaurant.name} l\u00e0 qu\u00e1n \u0103n n\u1ed5i ti\u1ebfng t\u1ea1i khu v\u1ef1c ${restaurant.area}, \u0111\u1ecba ch\u1ec9 ${restaurant.address}. Qu\u00e1n \u0111\u01b0\u1ee3c \u0111\u00e1nh gi\u00e1 ${restaurant.rating} sao. B\u1ea1n n\u00ean gh\u00e9 qua \u0111\u1ec3 th\u01b0\u1edfng th\u1ee9c c\u00e1c m\u00f3n \u0103n n\u1ed5i ti\u1ebfng nh\u01b0 ${dishesStr}.`;
  }

  return `${restaurant.name} is a famous stall located in ${restaurant.area}, at address ${restaurant.address}. It has a rating of ${restaurant.rating} stars. Make sure to try ${dishesStr}.`;
}
