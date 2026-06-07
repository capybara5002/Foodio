import { AudioTour, ChatMessage, ChatThread, CommunityPost, Restaurant } from '../types';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY ?? '';
const geminiModel = 'gemini-2.5-flash';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getRestaurants() {
  return getJson<Restaurant[]>('/api/cravemap/restaurants');
}

export function getCommunityPosts() {
  return getJson<CommunityPost[]>('/api/cravemap/community-posts');
}

export function getChatThreads() {
  return getJson<ChatThread[]>('/api/cravemap/chat-threads');
}

export function getAudioTours() {
  return getJson<AudioTour[]>('/api/cravemap/audio-tours');
}

export function createCommunityPost(post: CommunityPost) {
  return postJson<CommunityPost>('/api/cravemap/community-posts', post);
}

export function sendChatMessage(threadId: string, message: ChatMessage) {
  return postJson<ChatMessage>(`/api/cravemap/chat-threads/${threadId}/messages`, message);
}

export function createBooking(booking: {
  restaurantId: string;
  date: string;
  time: string;
  guests: number;
  seating: string;
}) {
  return postJson('/api/cravemap/bookings', booking);
}

async function generateGeminiText(prompt: string): Promise<string> {
  if (!geminiApiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not configured.');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': geminiApiKey
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 220
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini returned an empty narrative.');
  }

  return text;
}

export async function generateAudioTourNarrative(tour: AudioTour): Promise<string> {
  const fallback = `${tour.title}. ${tour.description} This ${tour.vibe.toLowerCase()} route around ${tour.location} includes ${tour.stopsCount} stops and lasts about ${tour.duration}.`;

  try {
    return await generateGeminiText(
      `Write a warm 60-second street-food audio guide narration for this tour.
Title: ${tour.title}
Location: ${tour.location}
Vibe: ${tour.vibe}
Duration: ${tour.duration}
Stops: ${tour.stopsCount}
Description: ${tour.description}
Keep it concise, sensory, and suitable for playback in a food map app.`
    );
  } catch (error) {
    console.warn('Gemini audio tour narrative unavailable, using fallback.', error);
    return fallback;
  }
}

export async function generateMapMarkerNarrative(restaurant: Restaurant): Promise<string> {
  const dishNames = restaurant.dishes.map((dish) => dish.name).slice(0, 3).join(', ');
  const fallback = `${restaurant.name} is a ${restaurant.category} stop in ${restaurant.area}, rated ${restaurant.rating}. Try ${dishNames || 'the house specials'} and check the opening hours before you go.`;

  try {
    return await generateGeminiText(
      `Write a short street-food map marker narration for a user who clicked this stall.
Name: ${restaurant.name}
Category: ${restaurant.category}
Area: ${restaurant.area}
Address: ${restaurant.address}
Rating: ${restaurant.rating}
Price range: ${restaurant.priceRange}
Opening hours: ${restaurant.openingHours}
Recommended dishes: ${dishNames || 'house specials'}
Keep it under 55 words and practical.`
    );
  } catch (error) {
    console.warn('Gemini marker narrative unavailable, using fallback.', error);
    return fallback;
  }
}
