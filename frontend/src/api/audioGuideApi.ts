import axios from 'axios';
import { apiBase } from './apiConfig';

export interface AudioGuideNarration {
  translatedText: string;
  audioSegments: string[];
  audioMimeType: string;
  provider: string;
  locale: string;
}

export async function createAudioGuideNarration(text: string, targetLang: string): Promise<AudioGuideNarration> {
  try {
    const response = await axios.post<AudioGuideNarration>(`${apiBase}/api/audio-guide/narrate`, {
      text,
      targetLang
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const message = typeof error.response.data === 'string'
        ? error.response.data
        : JSON.stringify(error.response.data);
      throw new Error(message);
    }
    throw error;
  }
}
