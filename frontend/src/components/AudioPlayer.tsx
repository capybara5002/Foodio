/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { AudioTour } from '../types';
import { generateAudioTourNarrative } from '../api/cravemapApi';
import { X, RotateCcw, RotateCw, Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  tour: AudioTour | null;
  onClose: () => void;
}

export default function AudioPlayer({ tour, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0); 
  const [durationSec, setDurationSec] = useState(150); // total seconds representation
  const [narrative, setNarrative] = useState('');
  const [isLoadingNarrative, setIsLoadingNarrative] = useState(false);

  // Keep progress in a ref to access the latest value in the useEffect without causing dependency triggers
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // High-frequency interval timer (every 50ms) to update the progress bar visually with 60fps-like smoothness
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && tour && durationSec > 0) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + (5 / durationSec);
          if (next >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return next;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, tour, durationSec]);

  // Load narrative when tour changes
  useEffect(() => {
    if (!tour) return;

    let cancelled = false;
    setNarrative('');
    setProgress(0);
    setIsPlaying(true);
    setIsLoadingNarrative(true);

    void generateAudioTourNarrative(tour)
      .then((generatedNarrative) => {
        if (cancelled) return;
        setNarrative(generatedNarrative);
        setDurationSec(Math.max(5, Math.min(240, Math.ceil(generatedNarrative.length / 12))));
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingNarrative(false);
        }
      });

    return () => {
      cancelled = true;
      window.speechSynthesis?.cancel();
    };
  }, [tour]);

  // Handle TTS play / pause when state changes (decoupled from progress updates)
  useEffect(() => {
    if (!tour || !narrative || !('speechSynthesis' in window)) return;

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

    return () => window.speechSynthesis.cancel();
  }, [isPlaying, narrative, tour]);

  // Seek handler called on user interactions
  const handleSeek = (newProgress: number) => {
    const clampedProgress = Math.max(0, Math.min(100, newProgress));
    setProgress(clampedProgress);
    
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
    <div className="fixed bottom-[72px] md:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-[60] animate-in fade-in slide-in-from-bottom duration-300">
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

      <div className="bg-[#fdfcf9] border-2 border-[#1a1a1a] rounded-none p-5 shadow-2xl flex flex-col gap-4">
        {/* Header Title Information */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-none overflow-hidden shrink-0 border border-[#1a1a1a]">
            <img src={tour.image} alt={tour.title} className="w-full h-full object-cover grayscale" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-[8px] tracking-widest text-white bg-[#e2533b] uppercase px-2 py-0.5 rounded-none font-bold select-none">
                  Live Audio Guide
                </span>
                <h3 className="font-serif italic font-bold text-sm text-[#1a1a1a] truncate mt-1">
                  {tour.title}
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="text-[#1a1a1a]/60 hover:text-[#e2533b] transition-colors p-1"
              >
                <X size={15} strokeWidth={3} />
              </button>
            </div>
            <p className="font-sans text-[10px] text-[#1a1a1a]/60 truncate font-light tracking-wide">
              {tour.location} • {tour.vibe}
            </p>
          </div>
        </div>

        {/* Animated Audio Soundwave Visualizer */}
        <div className="h-8 flex items-end justify-center gap-[3px] py-1 select-none">
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
        </div>

        <div className="bg-white border border-[#1a1a1a]/10 p-3 max-h-24 overflow-y-auto">
          <p className="font-mono text-[9px] uppercase tracking-wider text-[#e2533b] font-bold mb-1">
            {isLoadingNarrative ? 'Generating Gemini narration...' : 'Gemini narration'}
          </p>
          <p className="font-sans text-[11px] leading-relaxed text-[#1a1a1a]/75">
            {narrative || tour.description}
          </p>
        </div>

        {/* Scrubbing slider & progress ticks */}
        <div className="flex flex-col gap-1">
          <div className="relative w-full h-1.5 bg-[#1a1a1a]/15 rounded-none overflow-hidden cursor-pointer group">
            <div 
              style={{ width: `${progress}%` }}
              className="absolute left-0 top-0 h-full bg-[#1a1a1a] rounded-none group-hover:bg-[#e2533b] transition-all"
            />
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress} 
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-[#1a1a1a]/60 select-none">
            <span>{formatTime(currentSec)}</span>
            <span>{formatTime(durationSec)}</span>
          </div>
        </div>

        {/* Control row */}
        <div className="flex items-center justify-center gap-6">
          <button 
            type="button"
            className="text-[#1a1a1a]/60 hover:text-[#e2533b] active:scale-95 transition-transform"
            onClick={() => handleSeek(progress - 10)}
          >
            <RotateCcw size={20} />
          </button>

          <button
            type="button"
            className="w-10 h-10 bg-[#e2533b] hover:bg-[#1a1a1a] text-white rounded-none flex items-center justify-center shadow active:scale-95 transition-all cursor-pointer"
            onClick={handlePlayPause}
          >
            {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current" />}
          </button>

          <button 
            type="button"
            className="text-[#1a1a1a]/60 hover:text-[#e2533b] active:scale-95 transition-transform"
            onClick={() => handleSeek(progress + 10)}
          >
            <RotateCw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
