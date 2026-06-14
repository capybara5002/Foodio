import { Restaurant } from '../types';
import { apiBase } from '../api/apiConfig';

type StartCallback = (restaurant: Restaurant, text: string) => void;
type EndCallback = () => void;

const startSubscribers = new Set<StartCallback>();
const endSubscribers = new Set<EndCallback>();

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let activeRestaurant: Restaurant | null = null;
let activeText = '';
let isMuted = false;

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
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
  if (activeRestaurant) {
    activeRestaurant = null;
    activeText = '';
    notifyEnd();
  }
}

export async function playNarration(restaurant: Restaurant, lang = 'vi') {
  if (isMuted) return;

  // Stop any ongoing narration first
  stopNarration();

  activeRestaurant = restaurant;

  // 1. If audioUrl exists, play it
  if (restaurant.audioUrl) {
    activeText = lang === 'vi' ? `Đang phát âm thanh của quán ${restaurant.name}` : `Playing audio guide for ${restaurant.name}`;
    notifyStart(restaurant, activeText);

    try {
      const audio = new Audio(restaurant.audioUrl);
      currentAudio = audio;
      audio.onended = () => {
        if (currentAudio === audio) {
          stopNarration();
        }
      };
      await audio.play();
      return;
    } catch (err) {
      console.warn('Failed to play audioUrl, falling back to TTS API', err);
    }
  }

  // 2. Fetch from backend narration API
  let text = '';
  try {
    const response = await fetch(`${apiBase}/api/audio/narration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': lang
      },
      body: JSON.stringify({
        restaurantId: restaurant.id,
        language: lang
      })
    });

    if (response.ok) {
      const data = await response.json();
      text = data.text;
    } else {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
  } catch (err) {
    console.warn('Failed to call backend narration endpoint, using client fallback', err);
    // 3. Fallback client-side text generator
    text = buildFallbackText(restaurant, lang);
  }

  activeText = text;
  notifyStart(restaurant, text);

  // 4. TTS speech synthesis
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    // Pick appropriate voice language
    utterance.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
    utterance.rate = lang === 'vi' ? 0.95 : 0.9;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (currentUtterance === utterance) {
        stopNarration();
      }
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      if (currentUtterance === utterance) {
        stopNarration();
      }
    };

    window.speechSynthesis.speak(utterance);
  } else {
    // If SpeechSynthesis not supported, end immediately or set a timer
    console.warn('window.speechSynthesis is not supported on this browser.');
    setTimeout(() => {
      if (activeRestaurant === restaurant) {
        stopNarration();
      }
    }, 5000);
  }
}

function buildFallbackText(restaurant: Restaurant, lang: string): string {
  const dishes = restaurant.dishes ? restaurant.dishes.map((d) => d.name).slice(0, 3).join(', ') : '';
  const dishesStr = dishes || (lang === 'vi' ? 'các món ăn đặc trưng' : 'signature dishes');
  if (lang === 'vi') {
    return `${restaurant.name} là quán ăn nổi tiếng tại khu vực ${restaurant.area}, địa chỉ ${restaurant.address}. Quán được đánh giá ${restaurant.rating} sao. Bạn nên ghé qua để thưởng thức các món ăn nổi tiếng như ${dishesStr}.`;
  } else {
    return `${restaurant.name} is a famous stall located in ${restaurant.area}, at address ${restaurant.address}. It has a rating of ${restaurant.rating} stars. Make sure to try ${dishesStr}.`;
  }
}
