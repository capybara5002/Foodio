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
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'restaurant';
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface ChatThread {
  id: string;
  restaurantId: string;
  name: string;
  avatar: string;
  statusText: string;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
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
