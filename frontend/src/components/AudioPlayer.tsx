/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AudioTour } from '../types';
import { generateAudioTourNarrative } from '../api/cravemapApi';

interface AudioPlayerProps {
  tour: AudioTour | null;
  onClose: () => void;
}

export default function AudioPlayer({ tour, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(12); // start with some progress
  const [durationSec, setDurationSec] = useState(150); // total seconds representation
  const [narrative, setNarrative] = useState('');
  const [isLoadingNarrative, setIsLoadingNarrative] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && tour) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, tour]);

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
        setDurationSec(Math.max(60, Math.min(240, Math.ceil(generatedNarrative.length / 12))));
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

  useEffect(() => {
    if (!tour || !narrative || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    if (!isPlaying) return;

    const utterance = new SpeechSynthesisUtterance(narrative);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.lang = 'en-US';
    utterance.onend = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    window.speechSynthesis.speak(utterance);

    return () => window.speechSynthesis.cancel();
  }, [isPlaying, narrative, tour]);

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
                <span className="material-symbols-outlined text-[18px] font-black">close</span>
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
            // dynamic random height based on playing state
            const rHeight = isPlaying 
              ? Math.max(15, Math.floor(Math.sin((progress * 0.5) + i) * 60) + 40)
              : 20;
            return (
              <div
                key={i}
                style={{ height: `${Math.min(100, rHeight)}%` }}
                className={`w-[4px] rounded-none transition-all duration-350 ${
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
              onChange={(e) => setProgress(Number(e.target.value))}
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
            onClick={() => setProgress(Math.max(0, progress - 10))}
          >
            <span className="material-symbols-outlined text-xl">replay_10</span>
          </button>

          <button
            type="button"
            className="w-10 h-10 bg-[#e2533b] hover:bg-[#1a1a1a] text-white rounded-none flex items-center justify-center shadow active:scale-95 transition-all cursor-pointer"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            <span className="material-symbols-outlined filled text-xl text-white">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <button 
            type="button"
            className="text-[#1a1a1a]/60 hover:text-[#e2533b] active:scale-95 transition-transform"
            onClick={() => setProgress(Math.min(100, progress + 10))}
          >
            <span className="material-symbols-outlined text-xl">forward_10</span>
          </button>
        </div>
      </div>
    </div>
  );
}
