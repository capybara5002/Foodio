import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function translateText(text: string, targetLang: string, signal?: AbortSignal): Promise<string> {
  const response = await axios.post<string>(
    `${apiBase}/api/translate`,
    { text, targetLang },
    { signal }
  );

  return typeof response.data === 'string' ? response.data : String(response.data ?? '');
}
