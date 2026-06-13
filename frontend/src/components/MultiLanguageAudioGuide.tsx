import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Loader2, Pause, Play, RotateCcw, RotateCw, Search, Square } from 'lucide-react';
import { translateText } from '../api/translateApi';

type LanguageOption = {
  code: string;
  label: string;
  speechLangs: string[];
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', speechLangs: ['en-US', 'en-GB', 'en'] },
  { code: 'ko', label: 'Korean', speechLangs: ['ko-KR', 'ko'] },
  { code: 'ja', label: 'Japanese', speechLangs: ['ja-JP', 'ja'] },
  { code: 'fr', label: 'French', speechLangs: ['fr-FR', 'fr-CA', 'fr'] },
  { code: 'zh', label: 'Chinese', speechLangs: ['zh-CN', 'zh-TW', 'zh-HK', 'zh'] },
  { code: 'vi', label: 'Vietnamese', speechLangs: ['vi-VN', 'vi'] },
  { code: 'es', label: 'Spanish', speechLangs: ['es-ES', 'es-MX', 'es-US', 'es'] },
  { code: 'de', label: 'German', speechLangs: ['de-DE', 'de'] },
  { code: 'it', label: 'Italian', speechLangs: ['it-IT', 'it'] },
  { code: 'pt', label: 'Portuguese', speechLangs: ['pt-BR', 'pt-PT', 'pt'] },
  { code: 'ru', label: 'Russian', speechLangs: ['ru-RU', 'ru'] },
  { code: 'ar', label: 'Arabic', speechLangs: ['ar-SA', 'ar-EG', 'ar'] },
  { code: 'hi', label: 'Hindi', speechLangs: ['hi-IN', 'hi'] },
  { code: 'bn', label: 'Bengali', speechLangs: ['bn-BD', 'bn-IN', 'bn'] },
  { code: 'ur', label: 'Urdu', speechLangs: ['ur-PK', 'ur-IN', 'ur'] },
  { code: 'id', label: 'Indonesian', speechLangs: ['id-ID', 'id'] },
  { code: 'ms', label: 'Malay', speechLangs: ['ms-MY', 'ms'] },
  { code: 'th', label: 'Thai', speechLangs: ['th-TH', 'th'] },
  { code: 'lo', label: 'Lao', speechLangs: ['lo-LA', 'lo'] },
  { code: 'km', label: 'Khmer', speechLangs: ['km-KH', 'km'] },
  { code: 'my', label: 'Burmese', speechLangs: ['my-MM', 'my'] },
  { code: 'tl', label: 'Filipino', speechLangs: ['fil-PH', 'tl-PH', 'fil', 'tl'] },
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

interface MultiLanguageAudioGuideProps {
  sourceText: string;
  title: string;
  defaultLang?: string;
  className?: string;
}

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
  const [translationNotice, setTranslationNotice] = useState('');
  const [voiceNotice, setVoiceNotice] = useState('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressRef = useRef(progress);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);

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
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setIsTranslating(false);
    setTranslationNotice('');
    setVoiceNotice('');

    if (!cleanSourceText) {
      setTranslatedText('');
      return;
    }

    const controller = new AbortController();
    setIsTranslating(true);

    translateText(cleanSourceText, targetLang, controller.signal)
      .then((text) => {
        const nextText = text.trim();
        setTranslatedText(nextText || cleanSourceText);
        if (targetLang !== 'en' && nextText && nextText.toLowerCase() === cleanSourceText.toLowerCase()) {
          setTranslationNotice('Translation returned the original text. Check the Gemini API key on the backend.');
        }
      })
      .catch((error) => {
        if (error?.name !== 'CanceledError' && error?.code !== 'ERR_CANCELED') {
          console.warn('Translation failed, using source text.', error);
          setTranslatedText(cleanSourceText);
          setTranslationNotice('Translation failed. Check the backend Gemini API key or network connection.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsTranslating(false);
        }
      });

    return () => {
      controller.abort();
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
    setProgress(0);
    setDurationSec(Math.max(10, Math.ceil((translatedText || cleanSourceText).length / 14)));
  }, [cleanSourceText, translatedText]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const warmVoices = () => window.speechSynthesis.getVoices();
    warmVoices();
    window.speechSynthesis.addEventListener('voiceschanged', warmVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', warmVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || isPaused || isDragging || durationSec <= 0) return;

    const intervalMs = 250;
    const interval = window.setInterval(() => {
      setProgress((current) => Math.min(100, current + (intervalMs / 1000 / durationSec) * 100));
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [durationSec, isDragging, isPaused, isPlaying]);

  const clampProgress = (value: number) => Math.max(0, Math.min(100, value));

  const findMatchingVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const preferredLangs = selectedLanguage.speechLangs.map((lang) => lang.toLowerCase());

    return voices.find((voice) => {
      const voiceLang = voice.lang.toLowerCase();
      return preferredLangs.some(
        (preferred) => voiceLang === preferred || voiceLang.startsWith(preferred) || preferred.startsWith(voiceLang)
      );
    });
  };

  const createUtterance = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const matchingVoice = findMatchingVoice();
    if (matchingVoice) utterance.voice = matchingVoice;
    utterance.lang = matchingVoice?.lang || selectedLanguage.speechLangs[0] || targetLang;
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => {
      setProgress(100);
      setIsPlaying(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };
    return utterance;
  };

  const startSpeakingFrom = (nextProgress: number) => {
    if (!translatedText.trim() || !('speechSynthesis' in window) || isTranslating) return;
    const matchingVoice = findMatchingVoice();
    setVoiceNotice(
      matchingVoice
        ? ''
        : `No ${selectedLanguage.label} voice is installed in this browser. The text is translated, but the browser may use its default voice.`
    );

    const normalizedProgress = clampProgress(nextProgress >= 100 ? 0 : nextProgress);
    const startIndex = Math.floor((normalizedProgress / 100) * translatedText.length);
    const textToSpeak = translatedText.substring(startIndex).trim();

    if (!textToSpeak) {
      setProgress(100);
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = createUtterance(textToSpeak);

    utteranceRef.current = utterance;
    setProgress(normalizedProgress);
    setIsPlaying(true);
    setIsPaused(false);
    window.speechSynthesis.speak(utterance);
  };

  const speak = () => {
    if (!translatedText.trim() || !('speechSynthesis' in window) || isTranslating) return;

    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    if (isPlaying && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    startSpeakingFrom(progressRef.current);
  };

  const stop = () => {
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
  };

  const seekTo = (nextProgress: number) => {
    const clampedProgress = clampProgress(nextProgress);
    const shouldKeepPlaying = isPlaying && !isPaused;

    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(clampedProgress);

    if (shouldKeepPlaying) {
      window.setTimeout(() => startSpeakingFrom(clampedProgress), 0);
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

  const disabled = isTranslating || !translatedText.trim();
  const currentSec = Math.floor((progress * durationSec) / 100);
  const selectLanguage = (language: LanguageOption) => {
    setTargetLang(language.code);
    setLanguageQuery('');
    setIsLanguageMenuOpen(false);
  };

  return (
    <section className={`bg-white border border-[#1a1a1a]/15 p-3 flex flex-col gap-3 text-left ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#e2533b] font-extrabold">
            AI multi-language audio
          </p>
          <h3 className="font-serif italic font-bold text-sm text-[#1a1a1a] truncate">{title}</h3>
        </div>
        {isTranslating && <Loader2 size={16} className="animate-spin text-[#e2533b] shrink-0" />}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
        <div className="relative min-w-0" ref={languageMenuRef}>
          <button
            type="button"
            onClick={() => setIsLanguageMenuOpen((open) => !open)}
            className="w-full min-w-0 bg-[#fdfcf9] border-2 border-[#1a1a1a] px-2 py-2 font-mono text-[10px] uppercase tracking-wider focus:outline-none flex items-center justify-between gap-2"
            aria-label="Select narration language"
            aria-expanded={isLanguageMenuOpen}
          >
            <span className="truncate">{selectedLanguage.label} ({selectedLanguage.code})</span>
            <ChevronDown size={14} className="shrink-0" />
          </button>

          {isLanguageMenuOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[80] bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_#1a1a1a]">
              <div className="p-2 border-b border-[#1a1a1a]/15 flex items-center gap-2">
                <Search size={14} className="text-[#e2533b] shrink-0" />
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
                    className={`w-full px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider hover:bg-[#f9f7f2] flex items-center justify-between ${
                      language.code === targetLang ? 'bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]' : 'text-[#1a1a1a]'
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
          className="w-10 h-10 bg-white disabled:bg-[#1a1a1a]/5 text-[#1a1a1a] disabled:text-[#1a1a1a]/25 hover:text-[#e2533b] flex items-center justify-center border-2 border-[#1a1a1a] transition-colors cursor-pointer disabled:cursor-not-allowed"
          aria-label="Stop narration"
        >
          <Square size={14} className="fill-current" />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <div className="relative w-full h-1.5 bg-[#1a1a1a]/15 overflow-hidden cursor-pointer group">
          <div
            style={{ width: `${progress}%` }}
            className="absolute left-0 top-0 h-full bg-[#1a1a1a] group-hover:bg-[#e2533b] transition-colors"
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
          className="w-9 h-9 text-[#1a1a1a]/65 disabled:text-[#1a1a1a]/25 hover:text-[#e2533b] flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed"
          aria-label="Rewind narration 10 seconds"
        >
          <RotateCcw size={20} />
        </button>

        <button
          type="button"
          onClick={speak}
          disabled={disabled}
          className="w-10 h-10 bg-[#1a1a1a] disabled:bg-[#1a1a1a]/25 text-white hover:bg-[#e2533b] flex items-center justify-center border-2 border-[#1a1a1a] transition-colors cursor-pointer disabled:cursor-not-allowed"
          aria-label={isPlaying && !isPaused ? 'Pause narration' : 'Play narration'}
        >
          {isPlaying && !isPaused ? <Pause size={17} className="fill-current" /> : <Play size={17} className="fill-current" />}
        </button>

        <button
          type="button"
          onClick={() => seekBySeconds(10)}
          disabled={disabled || progress >= 100}
          className="w-9 h-9 text-[#1a1a1a]/65 disabled:text-[#1a1a1a]/25 hover:text-[#e2533b] flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed"
          aria-label="Forward narration 10 seconds"
        >
          <RotateCw size={20} />
        </button>
      </div>

      <div className="bg-[#fdfcf9] border border-[#1a1a1a]/10 p-3 max-h-28 overflow-y-auto">
        <p className="font-sans text-[11px] leading-relaxed text-[#1a1a1a]/75">
          {isTranslating ? 'Translating narration...' : translatedText || cleanSourceText}
        </p>
      </div>

      {(translationNotice || voiceNotice) && (
        <p className="font-mono text-[9px] uppercase tracking-wider text-[#e2533b] leading-relaxed">
          {translationNotice || voiceNotice}
        </p>
      )}
    </section>
  );
}
