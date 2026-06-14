import { AudioTour, ChatMessage, ChatThread, CommunityPost, FoodieReview, PostComment, Restaurant } from '../types';
import { apiBase } from './apiConfig';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      'Accept-Language': localStorage.getItem('app_lang') || 'vi'
    }
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': localStorage.getItem('app_lang') || 'vi'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let errMsg = `Request failed: ${response.status}`;
    try {
      const text = await response.text();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          errMsg = parsed.message || parsed.error || text;
        } catch {
          errMsg = text;
        }
      }
    } catch (_) {}
    throw new Error(errMsg);
  }

  return response.json() as Promise<T>;
}

export function getRestaurants() {
  const lang = localStorage.getItem('app_lang') || 'vi';
  return getJson<Restaurant[]>(`/api/public/pois?lang=${encodeURIComponent(lang)}`);
}

export function getCommunityPosts() {
  return getJson<CommunityPost[]>('/api/cravemap/community-posts');
}

export function getChatThreads(params?: { userId?: string; restaurantId?: string } | string) {
  const searchParams = new URLSearchParams();
  if (typeof params === 'string') {
    searchParams.set('userId', params);
  } else if (params) {
    if (params.userId) searchParams.set('userId', params.userId);
    if (params.restaurantId) searchParams.set('restaurantId', params.restaurantId);
  }

  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return getJson<ChatThread[]>(`/api/cravemap/chat-threads${query}`);
}

export function getAudioTours() {
  return getJson<AudioTour[]>('/api/cravemap/audio-tours');
}

export function createCommunityPost(post: CommunityPost) {
  return postJson<CommunityPost>('/api/cravemap/community-posts', post);
}

export function createReview(restaurantId: string, review: Omit<FoodieReview, 'id'>) {
  return postJson<FoodieReview>(`/api/restaurants/${restaurantId}/reviews`, review);
}

export function getPostComments(postId: string) {
  return getJson<PostComment[]>(`/api/cravemap/community-posts/${postId}/comments`);
}

export function createPostComment(postId: string, content: string) {
  return postJson<PostComment>(`/api/cravemap/community-posts/${postId}/comments`, { content });
}

export function sendChatMessage(threadId: string, message: ChatMessage) {
  return postJson<ChatMessage>(`/api/cravemap/chat-threads/${threadId}/messages`, message);
}

export function ensureChatThread(restaurantId: string, userId: string) {
  return postJson<ChatThread>('/api/cravemap/chat-threads/ensure', { restaurantId, userId });
}

export function createBooking(booking: {
  restaurantId: string;
  date: string;
  time: string;
  guests: number;
  seating: string;
  userId?: string;
  tableNumber?: string;
}) {
  return postJson('/api/cravemap/bookings', booking);
}
