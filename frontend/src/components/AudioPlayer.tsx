/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { AudioTour } from '../types';
import { X, RotateCcw, RotateCw, Play, Pause } from 'lucide-react';
import MultiLanguageAudioGuide from './MultiLanguageAudioGuide';

interface AudioPlayerProps {
  tour: AudioTour | null;
  onClose: () => void;
}

export default function AudioPlayer({ tour, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [durationSec, setDurationSec] = useState(150);
  const [narrative, setNarrative] = useState('');
  const [isLoadingNarrative, setIsLoadingNarrative] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Keep progress in a ref to access the latest value in the useEffect without causing dependency triggers
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio object if tour.audioData is present
  useEffect(() => {
    if (!tour) return;

    if (tour.audioData) {
      const audio = new Audio(tour.audioData);
      audioRef.current = audio;

      const onLoadedMetadata = () => {
        setDurationSec(Math.ceil(audio.duration));
      };

      const onTimeUpdate = () => {
        if (audio.duration > 0) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      const onEnded = () => {
        setIsPlaying(false);
        setProgress(100);
      };

      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('ended', onEnded);

      // Trigger initial load metadata
      if (audio.readyState >= 1) {
        setDurationSec(Math.ceil(audio.duration));
      }

      return () => {
        audio.pause();
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('ended', onEnded);
        audioRef.current = null;
      };
    }
  }, [tour]);

  // High-frequency interval timer (every 50ms) to update the progress bar visually with 60fps-like smoothness (Only for TTS)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && tour && durationSec > 0 && !tour.audioData && !isDragging) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + (5 / durationSec);
          if (next >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + (100 / durationSec);
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, tour, durationSec, isDragging]);

  // Load source narrative when tour changes. Multi-language TTS is handled by MultiLanguageAudioGuide.
  useEffect(() => {
    if (!tour) return;
    setNarrative(tour.description);
    setProgress(0);
    setIsPlaying(false);
    setIsLoadingNarrative(false);
    setDurationSec(Math.max(10, Math.ceil(tour.description.length / 14)));

    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [tour]);

  // Handle TTS or HTML5 Audio play / pause when state changes
  useEffect(() => {
    if (!tour) return;

    if (tour.audioData) {
      const audio = audioRef.current;
      if (!audio) return;
      
      if (isPlaying) {
        audio.play().catch(err => console.error("Audio playback error:", err));
      } else {
        audio.pause();
      }
      return;
    }

    // TTS Fallback
    if (!narrative || !('speechSynthesis' in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      const currentProgress = progressRef.current;
      const startIndex = Math.floor((currentProgress / 100) * narrative.length);
      const subText = narrative.substring(startIndex);
      
      if (!subText.trim()) {
        setIsPlaying(false);
        setProgress(100);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(subText);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.lang = 'en-US';
      utterance.onend = () => {
        setIsPlaying(false);
        setProgress(100);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
    }
  }, [isPlaying, narrative, tour]);


  const togglePlay = () => {
    if (tour?.audioData) {
      if (progress >= 100) {
        handleSeek(0);
        setIsPlaying(true);
      } else {
        setIsPlaying((current) => !current);
      }
      return;
    }

    if (!('speechSynthesis' in window)) return;
    
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (progress >= 100) {
        handleSeek(0);
      } else {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      }
    }
  };

  // Seek handler called on user interactions
  const handleSeek = (newProgress: number) => {
    const clampedProgress = Math.max(0, Math.min(100, newProgress));
    setProgress(clampedProgress);
    
    if (tour?.audioData) {
      const audio = audioRef.current;
      if (audio && audio.duration > 0) {
        audio.currentTime = (clampedProgress / 100) * audio.duration;
      }
      return;
    }

    // TTS Fallback
    if (isPlaying && narrative && ('speechSynthesis' in window)) {
      window.speechSynthesis.cancel();
      const startIndex = Math.floor((clampedProgress / 100) * narrative.length);
      const subText = narrative.substring(startIndex);
      
      if (subText.trim()) {
        const utterance = new SpeechSynthesisUtterance(subText);
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.lang = 'en-US';
        utterance.onend = () => {
          setIsPlaying(false);
          setProgress(100);
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlaying(false);
        setProgress(100);
      }
    }
  };

  const handlePlayPause = () => {
    if (progress >= 100) {
      handleSeek(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  if (!tour) return null;

  // Format progression text
  const currentSec = Math.floor((progress * durationSec) / 100);
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-[70] animate-in fade-in slide-in-from-bottom duration-300">
      <style>{`
        @keyframes visualizer-bounce {
          0%, 100% {
            height: 15%;
          }
          50% {
            height: 95%;
          }
        }
      `}</style>

      <div className="bg-[#fffaf4]/94 border border-white/70 rounded-[2rem] p-5 shadow-[0_24px_70px_rgba(77,49,31,0.22)] flex flex-col gap-4 backdrop-blur-xl">
        {/* Header Title Information */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/70 shadow-[0_12px_30px_rgba(77,49,31,0.12)]">
            <img src={tour.image} alt={tour.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-[8px] tracking-widest text-white bg-[#b76548] uppercase px-2.5 py-1 rounded-full font-bold select-none">
                  Live Audio Guide
                </span>
                <h3 className="font-serif font-bold text-base tracking-[-0.035em] text-[#2c211b] truncate mt-1">
                  {tour.title}
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="text-[#6f655b] hover:text-[#8f4f3b] transition-colors p-1 rounded-full"
              >
                <X size={15} strokeWidth={3} />
              </button>
            </div>
            <p className="font-sans text-[11px] text-[#6f655b] truncate tracking-wide">
              {tour.location} • {tour.vibe}
            </p>
          </div>
        </div>

        <MultiLanguageAudioGuide
          title={tour.title}
          sourceText={tour.description}
          defaultLang={localStorage.getItem('app_lang')?.split('-')[0] || 'en'}
        />

        {/* Animated Audio Soundwave Visualizer for uploaded tour audio files */}
        {tour.audioData && <div className="h-8 flex items-end justify-center gap-[3px] py-1 select-none">
          {Array.from({ length: 28 }).map((_, i) => {
            return (
              <div
                key={i}
                style={{
                  height: isPlaying ? undefined : '20%',
                  animation: isPlaying 
                    ? `visualizer-bounce ${(0.4 + (i % 7) * 0.12).toFixed(2)}s ease-in-out infinite` 
                    : 'none',
                  animationDelay: isPlaying 
                    ? `-${((i % 13) * 0.08).toFixed(2)}s` 
                    : undefined,
                }}
                className={`w-[4px] rounded-none transition-all duration-300 ${
                  isPlaying 
                    ? 'bg-[#e2533b]' 
                    : 'bg-[#1a1a1a]/15'
                }`}
              />
            );
          })}
        </div>}

        {tour.audioData && <div className="bg-[#fffdf8] border border-[#4b362a]/10 p-3 max-h-24 overflow-y-auto rounded-2xl">
          <p className="font-mono text-[9px] uppercase tracking-wider text-[#8f4f3b] font-bold mb-1">
            {isLoadingNarrative ? 'Generating audio narration...' : 'Audio narration'}
          </p>
          <p className="font-sans text-[11px] leading-relaxed text-[#1a1a1a]/75">
            {narrative || tour.description}
          </p>
        </div>}

        {/* Scrubbing slider & progress ticks */}
        {tour.audioData && <div className="flex flex-col gap-1">
          <div className="relative w-full h-2 bg-[#4b362a]/12 rounded-full overflow-hidden cursor-pointer group">
            <div 
              style={{ width: `${progress}%` }}
              className="absolute left-0 top-0 h-full bg-[#2c211b] rounded-full group-hover:bg-[#b76548] transition-all"
            />
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress} 
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={(e) => {
                setIsDragging(false);
                handleSeek(Number(e.currentTarget.value));
              }}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={(e) => {
                setIsDragging(false);
                handleSeek(Number(e.currentTarget.value));
              }}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-[#1a1a1a]/60 select-none">
            <span>{formatTime(currentSec)}</span>
            <span>{formatTime(durationSec)}</span>
          </div>
        </div>}

        {/* Control row */}
        {tour.audioData && <div className="flex items-center justify-center gap-6">
          <button 
            type="button"
            className="text-[#6f655b] hover:text-[#8f4f3b] active:scale-95 transition-transform"
            onClick={() => handleSeek(progress - 10)}
          >
            <RotateCcw size={20} />
          </button>

          <button
            type="button"
            className="w-11 h-11 bg-[#b76548] hover:bg-[#2c211b] text-white rounded-full flex items-center justify-center shadow active:scale-95 transition-all cursor-pointer"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current" />}
          </button>

          <button 
            type="button"
            className="text-[#6f655b] hover:text-[#8f4f3b] active:scale-95 transition-transform"
            onClick={() => handleSeek(progress + 10)}
          >
            <RotateCw size={20} />
          </button>
        </div>}
      </div>
    </div>
  );
}
