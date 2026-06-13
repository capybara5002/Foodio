import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Pause, Play, RotateCcw, RotateCw, Square } from 'lucide-react';
import { translateText } from '../api/translateApi';

type LanguageOption = {
  code: string;
  label: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: 'Korean' },
  { code: 'ja', label: 'Japanese' },
  { code: 'fr', label: 'French' },
  { code: 'zh', label: 'Chinese' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'ur', label: 'Urdu' },
  { code: 'id', label: 'Indonesian' },
  { code: 'ms', label: 'Malay' },
  { code: 'th', label: 'Thai' },
  { code: 'lo', label: 'Lao' },
  { code: 'km', label: 'Khmer' },
  { code: 'my', label: 'Burmese' },
  { code: 'tl', label: 'Filipino' },
  { code: 'nl', label: 'Dutch' },
  { code: 'sv', label: 'Swedish' },
  { code: 'no', label: 'Norwegian' },
  { code: 'da', label: 'Danish' },
  { code: 'fi', label: 'Finnish' },
  { code: 'pl', label: 'Polish' },
  { code: 'cs', label: 'Czech' },
  { code: 'sk', label: 'Slovak' },
  { code: 'hu', label: 'Hungarian' },
  { code: 'ro', label: 'Romanian' },
  { code: 'bg', label: 'Bulgarian' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'tr', label: 'Turkish' },
  { code: 'el', label: 'Greek' },
  { code: 'he', label: 'Hebrew' },
  { code: 'fa', label: 'Persian' },
  { code: 'sw', label: 'Swahili' },
  { code: 'am', label: 'Amharic' },
  { code: 'ha', label: 'Hausa' },
  { code: 'yo', label: 'Yoruba' },
  { code: 'zu', label: 'Zulu' },
  { code: 'af', label: 'Afrikaans' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'mr', label: 'Marathi' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'ne', label: 'Nepali' },
  { code: 'si', label: 'Sinhala' },
  { code: 'mn', label: 'Mongolian' },
  { code: 'kk', label: 'Kazakh' },
  { code: 'uz', label: 'Uzbek' },
  { code: 'az', label: 'Azerbaijani' },
  { code: 'ka', label: 'Georgian' },
  { code: 'hy', label: 'Armenian' },
  { code: 'sr', label: 'Serbian' },
  { code: 'hr', label: 'Croatian' },
  { code: 'sl', label: 'Slovenian' }
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
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressRef = useRef(progress);

  const cleanSourceText = useMemo(() => sourceText.trim(), [sourceText]);

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

    if (!cleanSourceText) {
      setTranslatedText('');
      return;
    }

    if (targetLang === 'vi') {
      setTranslatedText(cleanSourceText);
      return;
    }

    const controller = new AbortController();
    setIsTranslating(true);

    translateText(cleanSourceText, targetLang, controller.signal)
      .then((text) => {
        setTranslatedText(text.trim() || cleanSourceText);
      })
      .catch((error) => {
        if (error?.name !== 'CanceledError' && error?.code !== 'ERR_CANCELED') {
          console.warn('Translation failed, using source text.', error);
          setTranslatedText(cleanSourceText);
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

  const createUtterance = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith(targetLang.toLowerCase()));
    if (matchingVoice) utterance.voice = matchingVoice;
    utterance.lang = matchingVoice?.lang || targetLang;
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
        <select
          value={targetLang}
          onChange={(event) => setTargetLang(event.target.value)}
          className="min-w-0 bg-[#fdfcf9] border-2 border-[#1a1a1a] px-2 py-2 font-mono text-[10px] uppercase tracking-wider focus:outline-none"
          aria-label="Select narration language"
        >
          {LANGUAGE_OPTIONS.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label} ({language.code})
            </option>
          ))}
        </select>

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
    </section>
  );
}
