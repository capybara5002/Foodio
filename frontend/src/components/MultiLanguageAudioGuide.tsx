import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Loader2, Pause, Play, RotateCcw, RotateCw, Search, Square } from 'lucide-react';
import { createAudioGuideNarration, type AudioGuideNarration } from '../api/audioGuideApi';

type LanguageOption = {
  code: string;
  label: string;
  speechLangs: string[];
  voiceTerms?: string[];
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', speechLangs: ['en-US', 'en-GB', 'en'], voiceTerms: ['english'] },
  { code: 'ko', label: 'Korean', speechLangs: ['ko-KR', 'ko'], voiceTerms: ['korean', '한국', '한국어'] },
  { code: 'ja', label: 'Japanese', speechLangs: ['ja-JP', 'ja'], voiceTerms: ['japanese', '日本', '日本語'] },
  { code: 'fr', label: 'French', speechLangs: ['fr-FR', 'fr-CA', 'fr'], voiceTerms: ['french', 'francais', 'français'] },
  { code: 'zh', label: 'Chinese', speechLangs: ['zh-CN', 'zh-TW', 'zh-HK', 'zh'], voiceTerms: ['chinese', '中文', '普通话', '國語'] },
  { code: 'vi', label: 'Vietnamese', speechLangs: ['vi-VN', 'vi'], voiceTerms: ['vietnamese', 'tiếng việt', 'viet'] },
  { code: 'es', label: 'Spanish', speechLangs: ['es-ES', 'es-MX', 'es-US', 'es'], voiceTerms: ['spanish', 'espanol', 'español'] },
  { code: 'de', label: 'German', speechLangs: ['de-DE', 'de'], voiceTerms: ['german', 'deutsch'] },
  { code: 'it', label: 'Italian', speechLangs: ['it-IT', 'it'], voiceTerms: ['italian', 'italiano'] },
  { code: 'pt', label: 'Portuguese', speechLangs: ['pt-BR', 'pt-PT', 'pt'], voiceTerms: ['portuguese', 'portugues', 'português'] },
  { code: 'ru', label: 'Russian', speechLangs: ['ru-RU', 'ru'], voiceTerms: ['russian', 'русский'] },
  { code: 'ar', label: 'Arabic', speechLangs: ['ar-SA', 'ar-EG', 'ar'], voiceTerms: ['arabic', 'العربية'] },
  { code: 'hi', label: 'Hindi', speechLangs: ['hi-IN', 'hi'], voiceTerms: ['hindi', 'हिन्दी', 'हिंदी'] },
  { code: 'bn', label: 'Bengali', speechLangs: ['bn-BD', 'bn-IN', 'bn'], voiceTerms: ['bengali', 'bangla', 'বাংলা'] },
  { code: 'ur', label: 'Urdu', speechLangs: ['ur-PK', 'ur-IN', 'ur'], voiceTerms: ['urdu', 'اردو'] },
  { code: 'id', label: 'Indonesian', speechLangs: ['id-ID', 'id'], voiceTerms: ['indonesian', 'bahasa indonesia'] },
  { code: 'ms', label: 'Malay', speechLangs: ['ms-MY', 'ms'], voiceTerms: ['malay', 'bahasa melayu', 'melayu', 'malaysia'] },
  { code: 'th', label: 'Thai', speechLangs: ['th-TH', 'th'], voiceTerms: ['thai', 'ไทย'] },
  { code: 'lo', label: 'Lao', speechLangs: ['lo-LA', 'lo'], voiceTerms: ['lao', 'laos', 'ລາວ'] },
  { code: 'km', label: 'Khmer', speechLangs: ['km-KH', 'km'], voiceTerms: ['khmer', 'cambodian', 'ខ្មែរ'] },
  { code: 'my', label: 'Burmese', speechLangs: ['my-MM', 'my'], voiceTerms: ['burmese', 'myanmar', 'မြန်မာ'] },
  { code: 'tl', label: 'Filipino', speechLangs: ['fil-PH', 'tl-PH', 'fil', 'tl'], voiceTerms: ['filipino', 'tagalog'] },
  { code: 'nl', label: 'Dutch', speechLangs: ['nl-NL', 'nl-BE', 'nl'] },
  { code: 'sv', label: 'Swedish', speechLangs: ['sv-SE', 'sv'] },
  { code: 'no', label: 'Norwegian', speechLangs: ['nb-NO', 'nn-NO', 'no'] },
  { code: 'da', label: 'Danish', speechLangs: ['da-DK', 'da'] },
  { code: 'fi', label: 'Finnish', speechLangs: ['fi-FI', 'fi'] },
  { code: 'pl', label: 'Polish', speechLangs: ['pl-PL', 'pl'] },
  { code: 'cs', label: 'Czech', speechLangs: ['cs-CZ', 'cs'] },
  { code: 'sk', label: 'Slovak', speechLangs: ['sk-SK', 'sk'] },
  { code: 'hu', label: 'Hungarian', speechLangs: ['hu-HU', 'hu'] },
  { code: 'ro', label: 'Romanian', speechLangs: ['ro-RO', 'ro'] },
  { code: 'bg', label: 'Bulgarian', speechLangs: ['bg-BG', 'bg'] },
  { code: 'uk', label: 'Ukrainian', speechLangs: ['uk-UA', 'uk'] },
  { code: 'tr', label: 'Turkish', speechLangs: ['tr-TR', 'tr'] },
  { code: 'el', label: 'Greek', speechLangs: ['el-GR', 'el'] },
  { code: 'he', label: 'Hebrew', speechLangs: ['he-IL', 'he'] },
  { code: 'fa', label: 'Persian', speechLangs: ['fa-IR', 'fa'] },
  { code: 'sw', label: 'Swahili', speechLangs: ['sw-KE', 'sw-TZ', 'sw'] },
  { code: 'am', label: 'Amharic', speechLangs: ['am-ET', 'am'] },
  { code: 'ha', label: 'Hausa', speechLangs: ['ha-NG', 'ha'] },
  { code: 'yo', label: 'Yoruba', speechLangs: ['yo-NG', 'yo'] },
  { code: 'zu', label: 'Zulu', speechLangs: ['zu-ZA', 'zu'] },
  { code: 'af', label: 'Afrikaans', speechLangs: ['af-ZA', 'af'] },
  { code: 'ta', label: 'Tamil', speechLangs: ['ta-IN', 'ta-LK', 'ta'] },
  { code: 'te', label: 'Telugu', speechLangs: ['te-IN', 'te'] },
  { code: 'mr', label: 'Marathi', speechLangs: ['mr-IN', 'mr'] },
  { code: 'gu', label: 'Gujarati', speechLangs: ['gu-IN', 'gu'] },
  { code: 'pa', label: 'Punjabi', speechLangs: ['pa-IN', 'pa'] },
  { code: 'kn', label: 'Kannada', speechLangs: ['kn-IN', 'kn'] },
  { code: 'ml', label: 'Malayalam', speechLangs: ['ml-IN', 'ml'] },
  { code: 'ne', label: 'Nepali', speechLangs: ['ne-NP', 'ne'] },
  { code: 'si', label: 'Sinhala', speechLangs: ['si-LK', 'si'] },
  { code: 'mn', label: 'Mongolian', speechLangs: ['mn-MN', 'mn'] },
  { code: 'kk', label: 'Kazakh', speechLangs: ['kk-KZ', 'kk'] },
  { code: 'uz', label: 'Uzbek', speechLangs: ['uz-UZ', 'uz'] },
  { code: 'az', label: 'Azerbaijani', speechLangs: ['az-AZ', 'az'] },
  { code: 'ka', label: 'Georgian', speechLangs: ['ka-GE', 'ka'] },
  { code: 'hy', label: 'Armenian', speechLangs: ['hy-AM', 'hy'] },
  { code: 'sr', label: 'Serbian', speechLangs: ['sr-RS', 'sr'] },
  { code: 'hr', label: 'Croatian', speechLangs: ['hr-HR', 'hr'] },
  { code: 'sl', label: 'Slovenian', speechLangs: ['sl-SI', 'sl'] }
];

const narrationCache = new Map<string, AudioGuideNarration>();

const FALLBACK_LANGUAGE_FAMILIES: Record<string, string[]> = {
  ms: ['id', 'fil', 'tl', 'en'],
  id: ['ms', 'fil', 'tl', 'en'],
  th: ['vi', 'id', 'en'],
  lo: ['th', 'vi', 'en'],
  km: ['th', 'vi', 'en'],
  my: ['th', 'hi', 'en'],
  ko: ['ja', 'zh', 'en'],
  ja: ['ko', 'zh', 'en'],
  zh: ['ja', 'ko', 'en'],
  vi: ['id', 'ms', 'en'],
  fa: ['ar', 'ur', 'en'],
  ur: ['hi', 'ar', 'fa', 'en'],
  hi: ['ur', 'bn', 'en'],
  ar: ['fa', 'ur', 'en']
};

interface MultiLanguageAudioGuideProps {
  sourceText: string;
  title: string;
  defaultLang?: string;
  className?: string;
}

type PlaybackMode = 'idle' | 'cloud' | 'speech';

export default function MultiLanguageAudioGuide({
  sourceText,
  title,
  defaultLang = 'en',
  className = ''
}: MultiLanguageAudioGuideProps) {
  const [targetLang, setTargetLang] = useState(defaultLang);
  const [translatedText, setTranslatedText] = useState(sourceText);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [durationSec, setDurationSec] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [languageQuery, setLanguageQuery] = useState('');
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('idle');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressRef = useRef(progress);
  const draggingRef = useRef(isDragging);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const spokenTextRef = useRef('');
  const spokenLangRef = useRef(defaultLang);
  const playbackRunRef = useRef(0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const playbackModeRef = useRef<PlaybackMode>('idle');
  const cloudSegmentsRef = useRef<string[]>([]);
  const cloudMimeTypeRef = useRef('audio/mpeg');
  const cloudDurationsRef = useRef<number[]>([]);
  const cloudTotalDurationRef = useRef(0);

  const cleanSourceText = useMemo(() => sourceText.trim(), [sourceText]);
  const selectedLanguage = useMemo(
    () => LANGUAGE_OPTIONS.find((language) => language.code === targetLang) ?? LANGUAGE_OPTIONS[0],
    [targetLang]
  );
  const filteredLanguages = useMemo(() => {
    const query = languageQuery.trim().toLowerCase();
    if (!query) return LANGUAGE_OPTIONS;

    return LANGUAGE_OPTIONS.filter((language) => {
      const haystack = `${language.label} ${language.code} ${language.speechLangs.join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [languageQuery]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    draggingRef.current = isDragging;
  }, [isDragging]);

  const getLanguageOption = (languageCode: string) =>
    LANGUAGE_OPTIONS.find((language) => language.code === languageCode) ?? LANGUAGE_OPTIONS[0];

  const getNarrationCacheKey = (languageCode: string, text: string) => `${languageCode}:${text}`;

  const updatePlaybackMode = (mode: PlaybackMode) => {
    playbackModeRef.current = mode;
    setPlaybackMode(mode);
  };

  const clearCloudPlaybackMetadata = () => {
    cloudSegmentsRef.current = [];
    cloudMimeTypeRef.current = 'audio/mpeg';
    cloudDurationsRef.current = [];
    cloudTotalDurationRef.current = 0;
  };

  useEffect(() => {
    playbackRunRef.current += 1;
    audioElementRef.current?.pause();
    audioElementRef.current = null;
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    updatePlaybackMode('idle');
    clearCloudPlaybackMetadata();
    spokenTextRef.current = '';
    spokenLangRef.current = targetLang;
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setIsTranslating(false);

    if (!cleanSourceText) {
      setTranslatedText('');
      return;
    }

    const cacheKey = getNarrationCacheKey(targetLang, cleanSourceText);
    const cachedNarration = narrationCache.get(cacheKey);
    if (cachedNarration) {
      setTranslatedText(cachedNarration.translatedText);
      return;
    }

    let isActive = true;
    setIsTranslating(true);

    createAudioGuideNarration(cleanSourceText, targetLang)
      .then((narration) => {
        if (!isActive) return;
        narrationCache.set(cacheKey, narration);
        setTranslatedText(narration.translatedText || cleanSourceText);
      })
      .catch((error) => {
        if (!isActive) return;
        console.warn('[Audio Guide] Cloud narration preview failed, using source text until playback:', error);
        setTranslatedText(cleanSourceText);
      })
      .finally(() => {
        if (isActive) {
          setIsTranslating(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [cleanSourceText, targetLang]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!languageMenuRef.current?.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (playbackModeRef.current !== 'cloud') {
      setDurationSec(Math.max(10, Math.ceil((translatedText || cleanSourceText).length / 14)));
    }
  }, [cleanSourceText, translatedText]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const synth = window.speechSynthesis;
    const captureVoices = (voices: SpeechSynthesisVoice[]) => {
      if (voices.length === 0) return;
      voicesRef.current = voices;
    };

    const forceLoadChromeVoices = () => {
      const voices = synth.getVoices();
      captureVoices(voices);

      synth.onvoiceschanged = () => {
        captureVoices(synth.getVoices());
      };
    };

    forceLoadChromeVoices();

    // Chrome can expose remote Google voices later than the event; poll briefly to catch those engines.
    let attempts = 0;
    const voicePoller = window.setInterval(() => {
      attempts += 1;
      forceLoadChromeVoices();
      if (attempts >= 20 || voicesRef.current.length >= 50) {
        window.clearInterval(voicePoller);
      }
    }, 250);

    return () => {
      window.clearInterval(voicePoller);
      synth.onvoiceschanged = null;
      synth.cancel();
    };
  }, []);

  useEffect(() => {
    if (playbackMode !== 'speech' || !isPlaying || isPaused || isDragging || durationSec <= 0) return;

    const intervalMs = 250;
    const interval = window.setInterval(() => {
      setProgress((current) => Math.min(100, current + (intervalMs / 1000 / durationSec) * 100));
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [durationSec, isDragging, isPaused, isPlaying, playbackMode]);

  const clampProgress = (value: number) => Math.max(0, Math.min(100, value));

  const loadCloudSegmentDuration = (segment: string, mimeType: string) =>
    new Promise<number>((resolve) => {
      const audio = new Audio();
      let settled = false;
      const timeoutId = window.setTimeout(() => finish(0), 2500);

      function finish(duration: number) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        audio.onloadedmetadata = null;
        audio.onerror = null;
        resolve(Number.isFinite(duration) && duration > 0 ? duration : 0);
      }

      audio.preload = 'metadata';
      audio.onloadedmetadata = () => finish(audio.duration);
      audio.onerror = () => finish(0);
      audio.src = `data:${mimeType};base64,${segment}`;
      audio.load();
    });

  const prepareCloudPlaybackMetadata = async (
    audioSegments: string[],
    mimeType: string,
    narrationText: string
  ) => {
    if (
      cloudSegmentsRef.current === audioSegments &&
      cloudMimeTypeRef.current === mimeType &&
      cloudTotalDurationRef.current > 0
    ) {
      return;
    }

    const measuredDurations = await Promise.all(
      audioSegments.map((segment) => loadCloudSegmentDuration(segment, mimeType))
    );
    const fallbackTotal = Math.max(10, Math.ceil((narrationText || cleanSourceText).length / 14));
    const fallbackSegmentDuration = fallbackTotal / Math.max(audioSegments.length, 1);
    const normalizedDurations = measuredDurations.map((duration) =>
      duration > 0 ? duration : fallbackSegmentDuration
    );
    const totalDuration = normalizedDurations.reduce((sum, duration) => sum + duration, 0);

    cloudSegmentsRef.current = audioSegments;
    cloudMimeTypeRef.current = mimeType;
    cloudDurationsRef.current = normalizedDurations;
    cloudTotalDurationRef.current = totalDuration;
    setDurationSec(Math.max(1, Math.ceil(totalDuration)));
  };

  const getCloudSeekPosition = (normalizedProgress: number) => {
    const durations = cloudDurationsRef.current;
    const totalDuration = cloudTotalDurationRef.current;
    const targetSecond = (clampProgress(normalizedProgress) / 100) * totalDuration;
    let elapsedBeforeSegment = 0;

    for (let index = 0; index < durations.length; index += 1) {
      const segmentDuration = durations[index];
      if (targetSecond <= elapsedBeforeSegment + segmentDuration || index === durations.length - 1) {
        return {
          index,
          offset: Math.max(0, Math.min(segmentDuration - 0.05, targetSecond - elapsedBeforeSegment)),
          elapsedBeforeSegment
        };
      }
      elapsedBeforeSegment += segmentDuration;
    }

    return { index: 0, offset: 0, elapsedBeforeSegment: 0 };
  };

  const waitForVoices = () =>
    new Promise<SpeechSynthesisVoice[]>((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve([]);
        return;
      }

      const synth = window.speechSynthesis;
      const existingVoices = voicesRef.current.length > 0 ? voicesRef.current : synth.getVoices();
      if (existingVoices.length > 0) {
        voicesRef.current = existingVoices;
        resolve(existingVoices);
        return;
      }

      const startedAt = Date.now();
      const interval = window.setInterval(() => {
        const voices = synth.getVoices();
        if (voices.length > 0 || Date.now() - startedAt >= 2000) {
          window.clearInterval(interval);
          voicesRef.current = voices;
          resolve(voices);
        }
      }, 100);
    });

  const findMatchingVoice = (
    languageCode: string,
    voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices()
  ) => {
    const language = getLanguageOption(languageCode);
    const targetCode = languageCode.toLowerCase();
    const preferredLangs = [targetCode, ...language.speechLangs.map((lang) => lang.toLowerCase())];
    const voiceTerms = [
      targetCode,
      language.label.toLowerCase(),
      ...language.speechLangs.map((lang) => lang.toLowerCase()),
      ...(language.voiceTerms ?? []).map((term) => term.toLowerCase())
    ];

    const exactLanguageVoice = voices.find((voice) => {
      const voiceLang = voice.lang.toLowerCase();
      return preferredLangs.some(
        (preferred) => voiceLang === preferred || voiceLang.startsWith(`${preferred}-`)
      );
    });

    if (exactLanguageVoice) return exactLanguageVoice;

    return voices.find((voice) => {
      const voiceLang = voice.lang.toLowerCase();
      const voiceName = voice.name.toLowerCase();
      return voiceTerms.some((term) =>
        voiceLang.includes(term) ||
        voiceName.includes(term)
      );
    });
  };

  const findFallbackVoice = (languageCode: string, voices: SpeechSynthesisVoice[]) => {
    const fallbackCodes = FALLBACK_LANGUAGE_FAMILIES[languageCode.toLowerCase()] ?? ['en'];

    for (const fallbackCode of fallbackCodes) {
      const fallbackVoice = findMatchingVoice(fallbackCode, voices);
      if (fallbackVoice) return fallbackVoice;
    }

    return voices.find((voice) => voice.default) ?? voices[0] ?? null;
  };

  const splitSpeechChunks = (textToSpeak: string) => {
    const sentenceChunks = textToSpeak.match(/[^.!?。！？]+[.!?。！？]*|.{1,120}/g) ?? [textToSpeak];
    return sentenceChunks
      .map((chunk) => chunk.trim())
      .filter(Boolean);
  };

  const speakChunk = (
    chunk: string,
    languageCode: string,
    voice: SpeechSynthesisVoice | null,
    normalizedProgress: number,
    runId: number
  ) =>
    new Promise<void>((resolve) => {
      if (!('speechSynthesis' in window) || playbackRunRef.current !== runId) {
        resolve();
        return;
      }

      const language = getLanguageOption(languageCode);
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = language.speechLangs[0] || languageCode;
      utterance.rate = 0.95;
      utterance.pitch = 1;

      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        console.warn('[Audio Guide] Chunk playback warning, proceeding to next stream chunk:', event.error);
        resolve();
      };

      utteranceRef.current = utterance;
      setProgress(normalizedProgress);
      setIsPlaying(true);
      setIsPaused(false);
      window.speechSynthesis.speak(utterance);
    });

  const executeSpeechEngine = async (
    textToSpeak: string,
    languageCode: string,
    normalizedProgress: number,
    voices?: SpeechSynthesisVoice[]
  ) => {
    if (!textToSpeak || !('speechSynthesis' in window)) return;

    const language = getLanguageOption(languageCode);
    const availableVoiceList = voices?.length ? voices : voicesRef.current;
    const matchingVoice = findMatchingVoice(languageCode, voices);
    const fallbackVoice = matchingVoice ? null : findFallbackVoice(languageCode, availableVoiceList);
    const selectedVoice = matchingVoice ?? fallbackVoice;
    const runId = playbackRunRef.current + 1;
    playbackRunRef.current = runId;
    updatePlaybackMode('speech');

    window.speechSynthesis.cancel();

    if (matchingVoice) {
      console.info(`[Audio Guide] Speaking with matched voice: ${matchingVoice.name} (${matchingVoice.lang})`);
    } else if (fallbackVoice) {
      console.warn(
        `[Audio Guide] Native voice package for '${languageCode}' not found. Using fallback voice: ${fallbackVoice.name} (${fallbackVoice.lang}).`
      );
    } else {
      console.warn(`[Audio Guide] No voices exposed by this browser for '${languageCode}'. Speaking without explicit voice.`);
    }

    const chunks = splitSpeechChunks(textToSpeak);
    console.info(`[Audio Guide] Starting chunked playback for ${language.label}: ${chunks.length} chunk(s).`);

    try {
      for (let index = 0; index < chunks.length; index += 1) {
        if (playbackRunRef.current !== runId) break;
        const chunkProgress = normalizedProgress + ((100 - normalizedProgress) * index) / Math.max(chunks.length, 1);
        await speakChunk(chunks[index], languageCode, selectedVoice, chunkProgress, runId);
      }
    } catch (error) {
      console.error('[Audio Guide Critical] Failed to execute speech stream:', error);
    } finally {
      if (playbackRunRef.current === runId) {
        setProgress(100);
        setIsPlaying(false);
        setIsPaused(false);
        utteranceRef.current = null;
        updatePlaybackMode('idle');
      }
    }
  };

  const executeCloudAudioEngine = async (
    audioSegments: string[],
    mimeType: string,
    normalizedProgress: number,
    narrationText: string
  ) => {
    if (audioSegments.length === 0) return;

    if (normalizedProgress >= 100) {
      setProgress(100);
      setIsPlaying(false);
      setIsPaused(false);
      updatePlaybackMode('idle');
      return;
    }

    await prepareCloudPlaybackMetadata(audioSegments, mimeType, narrationText);

    const runId = playbackRunRef.current + 1;
    playbackRunRef.current = runId;
    window.speechSynthesis?.cancel();
    audioElementRef.current?.pause();
    audioElementRef.current = null;
    updatePlaybackMode('cloud');
    setIsPlaying(true);
    setIsPaused(false);
    setProgress(clampProgress(normalizedProgress));

    const startPosition = getCloudSeekPosition(normalizedProgress);
    const durations = cloudDurationsRef.current;
    const totalDuration = cloudTotalDurationRef.current;

    try {
      for (let index = startPosition.index; index < audioSegments.length; index += 1) {
        if (playbackRunRef.current !== runId) break;

        const elapsedBeforeSegment = durations
          .slice(0, index)
          .reduce((sum, duration) => sum + duration, 0);
        const initialOffset = index === startPosition.index ? startPosition.offset : 0;
        const audio = new Audio(`data:${mimeType};base64,${audioSegments[index]}`);
        audio.preload = 'auto';
        audioElementRef.current = audio;

        await new Promise<void>((resolve) => {
          let started = false;
          let resolved = false;
          let cancelWatcher = 0;
          let fallbackStartTimer = 0;

          const resolveOnce = () => {
            if (resolved) return;
            resolved = true;
            window.clearInterval(cancelWatcher);
            window.clearTimeout(fallbackStartTimer);
            audio.onloadedmetadata = null;
            audio.ontimeupdate = null;
            audio.onended = null;
            audio.onerror = null;
            resolve();
          };

          cancelWatcher = window.setInterval(() => {
            if (playbackRunRef.current !== runId) {
              resolveOnce();
            }
          }, 100);

          const updateProgressFromAudio = () => {
            if (playbackRunRef.current !== runId || draggingRef.current) return;
            const elapsedSeconds = elapsedBeforeSegment + audio.currentTime;
            const activeTotalDuration = cloudTotalDurationRef.current || totalDuration;
            const nextProgress = activeTotalDuration > 0 ? (elapsedSeconds / activeTotalDuration) * 100 : normalizedProgress;
            setProgress(clampProgress(nextProgress));
          };

          const beginPlayback = () => {
            if (started || resolved || playbackRunRef.current !== runId) return;
            started = true;

            if (initialOffset > 0 && Number.isFinite(audio.duration) && audio.duration > 0) {
              try {
                audio.currentTime = Math.min(initialOffset, Math.max(0, audio.duration - 0.05));
              } catch (error) {
                console.warn('[Audio Guide] Failed to apply cloud seek offset, continuing playback:', error);
              }
            }

            void audio.play().catch((error) => {
              console.warn('[Audio Guide] Browser blocked cloud audio segment playback:', error);
              resolveOnce();
            });
          };

          audio.onloadedmetadata = () => {
            if (Number.isFinite(audio.duration) && audio.duration > 0) {
              cloudDurationsRef.current[index] = audio.duration;
              const refreshedTotal = cloudDurationsRef.current.reduce((sum, duration) => sum + duration, 0);
              cloudTotalDurationRef.current = refreshedTotal;
              setDurationSec(Math.max(1, Math.ceil(refreshedTotal)));
            }
            beginPlayback();
          };
          audio.ontimeupdate = updateProgressFromAudio;
          audio.onended = () => {
            if (playbackRunRef.current === runId) {
              const completedSeconds = elapsedBeforeSegment + (durations[index] || audio.duration || 0);
              const activeTotalDuration = cloudTotalDurationRef.current || totalDuration;
              setProgress(clampProgress((completedSeconds / Math.max(activeTotalDuration, 1)) * 100));
            }
            resolveOnce();
          };
          audio.onerror = () => {
            console.warn('[Audio Guide] Cloud audio segment failed, proceeding to next segment.');
            resolveOnce();
          };
          audio.load();
          fallbackStartTimer = window.setTimeout(beginPlayback, 1500);
        });
      }
    } finally {
      if (playbackRunRef.current === runId) {
        setProgress(100);
        setIsPlaying(false);
        setIsPaused(false);
        audioElementRef.current = null;
        updatePlaybackMode('idle');
      }
    }
  };

  const startSpeakingFrom = async (nextProgress: number, languageCode = targetLang) => {
    if (!cleanSourceText || isTranslating) return;

    setIsTranslating(true);
    window.speechSynthesis?.cancel();
    audioElementRef.current?.pause();
    audioElementRef.current = null;
    utteranceRef.current = null;

    try {
      try {
        const cacheKey = getNarrationCacheKey(languageCode, cleanSourceText);
        const cloudNarration = narrationCache.get(cacheKey) ?? await createAudioGuideNarration(cleanSourceText, languageCode);
        narrationCache.set(cacheKey, cloudNarration);
        if (cloudNarration.audioSegments.length > 0) {
          console.info(`[Audio Guide] Cloud narration ready via ${cloudNarration.provider} (${cloudNarration.locale}).`);
          setTranslatedText(cloudNarration.translatedText);
          spokenTextRef.current = cloudNarration.translatedText;
          spokenLangRef.current = languageCode;
          setIsTranslating(false);
          await executeCloudAudioEngine(
            cloudNarration.audioSegments,
            cloudNarration.audioMimeType || 'audio/mpeg',
            clampProgress(nextProgress >= 100 ? 0 : nextProgress),
            cloudNarration.translatedText || cleanSourceText
          );
          return;
        }
      } catch (cloudError) {
        console.warn('[Audio Guide] Cloud narration unavailable, falling back to browser speech synthesis:', cloudError);
      }

      const voices = await waitForVoices();
      const fallbackText = translatedText.trim() || cleanSourceText;
      console.info(`[Audio Guide] Browser fallback playback using available text (${fallbackText.length} chars).`);
      setTranslatedText(fallbackText);
      spokenTextRef.current = fallbackText;
      spokenLangRef.current = languageCode;

      const normalizedProgress = clampProgress(nextProgress >= 100 ? 0 : nextProgress);
      const startIndex = Math.floor((normalizedProgress / 100) * fallbackText.length);
      const textToSpeak = fallbackText.substring(startIndex).trim();

      if (!textToSpeak) {
        setProgress(100);
        setIsPlaying(false);
        setIsPaused(false);
        return;
      }

      setIsTranslating(false);
      void executeSpeechEngine(textToSpeak, languageCode, normalizedProgress, voices);
    } catch (error: any) {
      console.error('[Audio Guide] Audio guide stream failed:', error);
      setTranslatedText(cleanSourceText);
    } finally {
      setIsTranslating(false);
    }
  };

  const speak = () => {
    if (!cleanSourceText || isTranslating) return;

    if (isPlaying && !isPaused) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      } else {
        window.speechSynthesis.pause();
      }
      setIsPaused(true);
      return;
    }

    if (isPlaying && isPaused) {
      if (audioElementRef.current) {
        void audioElementRef.current.play().catch((error) => {
          console.warn('[Audio Guide] Failed to resume cloud audio playback:', error);
        });
      } else {
        window.speechSynthesis.resume();
      }
      setIsPaused(false);
      return;
    }

    void startSpeakingFrom(progressRef.current);
  };

  const stop = () => {
    playbackRunRef.current += 1;
    audioElementRef.current?.pause();
    audioElementRef.current = null;
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    updatePlaybackMode('idle');
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
  };

  const seekTo = (nextProgress: number) => {
    const clampedProgress = clampProgress(nextProgress);
    const shouldKeepPlaying = isPlaying && !isPaused;
    const activePlaybackMode = playbackModeRef.current;
    const activeCloudSegments = cloudSegmentsRef.current;
    const activeCloudMimeType = cloudMimeTypeRef.current;
    const activeCloudText = spokenTextRef.current || translatedText || cleanSourceText;

    playbackRunRef.current += 1;
    audioElementRef.current?.pause();
    audioElementRef.current = null;
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    updatePlaybackMode('idle');
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(clampedProgress);

    if (shouldKeepPlaying) {
      if (activePlaybackMode === 'cloud' && activeCloudSegments.length > 0) {
        window.setTimeout(() => {
          void executeCloudAudioEngine(
            activeCloudSegments,
            activeCloudMimeType,
            clampedProgress,
            activeCloudText
          );
        }, 0);
      } else {
        window.setTimeout(() => void startSpeakingFrom(clampedProgress), 0);
      }
    }
  };

  const seekBySeconds = (seconds: number) => {
    if (durationSec <= 0) return;
    seekTo(progressRef.current + (seconds / durationSec) * 100);
  };

  const formatTime = (totalSeconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const disabled = isTranslating || !cleanSourceText;
  const currentSec = Math.floor((progress * durationSec) / 100);
  const selectLanguage = (language: LanguageOption) => {
    playbackRunRef.current += 1;
    audioElementRef.current?.pause();
    audioElementRef.current = null;
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    updatePlaybackMode('idle');
    clearCloudPlaybackMetadata();
    spokenTextRef.current = '';
    spokenLangRef.current = language.code;
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setDurationSec(Math.max(10, Math.ceil(cleanSourceText.length / 14)));
    setTranslatedText(cleanSourceText);
    setTargetLang(language.code);
    setLanguageQuery('');
    setIsLanguageMenuOpen(false);
  };

  return (
    <section className={`bg-[#fffdf8] border border-[#4b362a]/10 p-4 flex flex-col gap-3 text-left rounded-3xl shadow-[0_18px_46px_rgba(77,49,31,0.08)] ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif font-bold text-base tracking-[-0.035em] text-[#2c211b] truncate">{title}</h3>
        </div>
        {isTranslating && <Loader2 size={16} className="animate-spin text-[#b76548] shrink-0" />}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
        <div className="relative min-w-0" ref={languageMenuRef}>
          <button
            type="button"
            onClick={() => setIsLanguageMenuOpen((open) => !open)}
            className="w-full min-w-0 bg-[#fffaf4] border border-[#4b362a]/10 px-3 py-2.5 font-mono text-[10px] uppercase tracking-wider focus:outline-none flex items-center justify-between gap-2 rounded-full"
            aria-label="Select narration language"
            aria-expanded={isLanguageMenuOpen}
          >
            <span className="truncate">{selectedLanguage.label} ({selectedLanguage.code})</span>
            <ChevronDown size={14} className="shrink-0" />
          </button>

          {isLanguageMenuOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[80] bg-[#fffaf4] border border-[#4b362a]/10 shadow-[0_18px_46px_rgba(77,49,31,0.18)] rounded-2xl overflow-hidden">
              <div className="p-2 border-b border-[#4b362a]/10 flex items-center gap-2">
                <Search size={14} className="text-[#b76548] shrink-0" />
                <input
                  value={languageQuery}
                  onChange={(event) => setLanguageQuery(event.target.value)}
                  autoFocus
                  placeholder="Search language..."
                  className="w-full bg-transparent focus:outline-none font-mono text-[10px] uppercase tracking-wider"
                />
              </div>
              <div className="max-h-56 overflow-y-auto py-1">
                {filteredLanguages.map((language) => (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => selectLanguage(language)}
                    className={`w-full px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider hover:bg-[#f5eadf] flex items-center justify-between ${
                      language.code === targetLang ? 'bg-[#2c211b] text-white hover:bg-[#2c211b]' : 'text-[#2c211b]'
                    }`}
                  >
                    <span>{language.label}</span>
                    <span>{language.code}</span>
                  </button>
                ))}
                {filteredLanguages.length === 0 && (
                  <div className="px-3 py-4 font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/45">
                    No languages found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={stop}
          disabled={!isPlaying && !isPaused && progress === 0}
          className="w-10 h-10 bg-white disabled:bg-[#4b362a]/5 text-[#2c211b] disabled:text-[#2c211b]/25 hover:text-[#8f4f3b] flex items-center justify-center border border-[#4b362a]/10 transition-colors cursor-pointer disabled:cursor-not-allowed rounded-full"
          aria-label="Stop narration"
        >
          <Square size={14} className="fill-current" />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <div className="relative w-full h-2 bg-[#4b362a]/12 overflow-hidden cursor-pointer group rounded-full">
          <div
            style={{ width: `${progress}%` }}
            className="absolute left-0 top-0 h-full bg-[#2c211b] group-hover:bg-[#b76548] transition-colors rounded-full"
          />
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            disabled={disabled}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={(event) => {
              setIsDragging(false);
              seekTo(Number(event.currentTarget.value));
            }}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={(event) => {
              setIsDragging(false);
              seekTo(Number(event.currentTarget.value));
            }}
            onChange={(event) => setProgress(Number(event.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Narration progress"
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-[#1a1a1a]/60 select-none">
          <span>{formatTime(currentSec)}</span>
          <span>{formatTime(durationSec)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => seekBySeconds(-10)}
          disabled={disabled || progress <= 0}
          className="w-9 h-9 text-[#6f655b] disabled:text-[#2c211b]/25 hover:text-[#8f4f3b] flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed"
          aria-label="Rewind narration 10 seconds"
        >
          <RotateCcw size={20} />
        </button>

        <button
          type="button"
          onClick={speak}
          disabled={disabled}
          className="w-11 h-11 bg-[#2c211b] disabled:bg-[#2c211b]/25 text-white hover:bg-[#8f4f3b] flex items-center justify-center border border-[#2c211b] transition-colors cursor-pointer disabled:cursor-not-allowed rounded-full"
          aria-label={isPlaying && !isPaused ? 'Pause narration' : 'Play narration'}
        >
          {isPlaying && !isPaused ? <Pause size={17} className="fill-current" /> : <Play size={17} className="fill-current" />}
        </button>

        <button
          type="button"
          onClick={() => seekBySeconds(10)}
          disabled={disabled || progress >= 100}
          className="w-9 h-9 text-[#6f655b] disabled:text-[#2c211b]/25 hover:text-[#8f4f3b] flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed"
          aria-label="Forward narration 10 seconds"
        >
          <RotateCw size={20} />
        </button>
      </div>

      <div className="bg-[#f7efe4] border border-[#4b362a]/10 p-3 max-h-28 overflow-y-auto rounded-2xl">
        <p className="font-sans text-[11px] leading-relaxed text-[#4c4038]">
          {isTranslating ? 'Translating narration...' : translatedText || cleanSourceText}
        </p>
      </div>
    </section>
  );
}
