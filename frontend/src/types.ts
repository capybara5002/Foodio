/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Dish {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

export interface FoodieReview {
  id: string;
  author: string;
  role: string;
  rating: number;
  comment: string;
  avatar: string;
  imageUrl?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'Admin' | 'Owner' | 'User' | 'Guest';
  restaurantId?: string;
  tableNumber?: number;
  isActive: boolean;
  createdAt?: string;
  avatar?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  rating: number;
  priceRange: string;
  category: string;
  distance: string;
  address: string;
  area: string;
  openingHours: string;
  description?: string;
  tableStatuses?: string;
  image: string;
  isVerified: boolean;
  replySpeed: string;
  latitude?: number;
  longitude?: number;
  dishes: Dish[];
  reviews: FoodieReview[];
}

export interface CommunityPost {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  timeAgo: string;
  rating: number;
  image: string;
  content: string;
  locationName: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isRestaurantPost?: boolean;
}

export interface PostComment {
  id: string;
  communityPostId: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  chatThreadId?: string;
  sender: 'user' | 'restaurant' | 'system';
  senderId?: string;
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  messageType?: 'Text' | 'Booking' | 'Image';
  isSystemNotification?: boolean;
  booking?: BookingMessagePayload | null;
  imageData?: string | null;
  imageFileName?: string | null;
  createdAt?: string;
}

export interface ChatThread {
  id: string;
  restaurantId: string;
  userId?: string;
  name: string;
  avatar: string;
  customerName?: string;
  customerAvatar?: string;
  statusText: string;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export interface BookingMessagePayload {
  bookingId: number;
  date: string;
  time: string;
  guests: number;
  seating: string;
  status: string;
}

export interface AudioTour {
  id: string;
  title: string;
  location: string;
  image: string;
  mapImage: string;
  isTrending: boolean;
  rating: number;
  duration: string;
  stopsCount: number;
  vibe: string;
  description: string;
}

export interface Category {
  id: number;
  name: string;
  slug?: string;
  icon?: string;
}

export interface FoodStreet {
  id: number;
  name: string;
  district: string;
  description: string;
  centerLatitude: number;
  centerLongitude: number;
  openingWindow: string;
}

export interface RestaurantRequest {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  name: string;
  priceRange: string;
  categoryName: string;
  foodStreetName: string;
  distance: string;
  address: string;
  area: string;
  openingHours: string;
  image: string;
  latitude: number;
  longitude: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  adminNote?: string;
  createdAt: string;
  reviewedAt?: string;
}
