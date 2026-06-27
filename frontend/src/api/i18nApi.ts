import axios from 'axios';
import { apiBase } from './apiConfig';

export interface AppTranslationResponse {
  sourceLang: string;
  targetLang: string;
  entries: Record<string, string>;
  provider: string;
}

export async function translateAppResources(
  sourceLang: string,
  targetLang: string,
  entries: Record<string, string>
): Promise<AppTranslationResponse> {
  try {
    const response = await axios.post<AppTranslationResponse>(`${apiBase}/api/i18n/translate`, {
      sourceLang,
      targetLang,
      entries
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
