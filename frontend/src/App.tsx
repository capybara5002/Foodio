/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { initialRestaurants, initialCommunityFeed, initialChatThreads, initialAudioTours } from './data';
import { Restaurant, CommunityPost, ChatThread, AudioTour, ChatMessage } from './types';
import {
  createBooking,
  createCommunityPost,
  getAudioTours,
  getChatThreads,
  getCommunityPosts,
  getRestaurants,
  sendChatMessage
} from './api/cravemapApi';

import NavBar from './components/NavBar';
import AudioPlayer from './components/AudioPlayer';
import BookingModal from './components/BookingModal';
import PageMap from './pages/PageMap';
import PageDiscover from './pages/PageDiscover';
import PageDetail from './pages/PageDetail';
import PageCreate from './pages/PageCreate';
import PageInbox from './pages/PageInbox';
import PageProfile from './pages/PageProfile';

function App() {
  const [currentTab, setCurrentTab] = useState<'map' | 'discover' | 'create' | 'inbox' | 'profile'>('map');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [activeAudioTour, setActiveAudioTour] = useState<AudioTour | null>(null);

  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants);
  const [posts, setPosts] = useState<CommunityPost[]>(initialCommunityFeed);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>(initialChatThreads);
  const [audioTours, setAudioTours] = useState<AudioTour[]>(initialAudioTours);

  const [activeThreadId, setActiveThreadId] = useState<string>('oc_oanh_thread');

  const userEmail = 'hoangsonle1805@gmail.com';

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [remoteRestaurants, remotePosts, remoteThreads, remoteTours] = await Promise.all([
          getRestaurants(),
          getCommunityPosts(),
          getChatThreads(),
          getAudioTours()
        ]);

        if (cancelled) return;

        if (remoteRestaurants.length > 0) setRestaurants(remoteRestaurants);
        if (remotePosts.length > 0) setPosts(remotePosts);
        if (remoteThreads.length > 0) setChatThreads(remoteThreads);
        if (remoteTours.length > 0) setAudioTours(remoteTours);
      } catch (error) {
        console.warn('CraveMap API unavailable, using local seed data.', error);
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectRestaurant = (id: string) => {
    setSelectedRestaurantId(id);
  };

  const handleSelectTour = () => {
    setCurrentTab('discover');
    const firstTour = audioTours[0];
    if (firstTour) {
      setActiveAudioTour(firstTour);
    }
  };

  const handleSendMessage = (threadId: string, text: string) => {
    setChatThreads((prevThreads) =>
      prevThreads.map((thread) => {
        if (thread.id === threadId) {
          const newMsg: ChatMessage = {
            id: `msg_user_${Date.now()}`,
            sender: 'user',
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent'
          };

          void sendChatMessage(threadId, newMsg).catch(() => undefined);

          return {
            ...thread,
            lastMessageText: text,
            lastMessageTime: 'Now',
            messages: [...thread.messages, newMsg]
          };
        }
        return thread;
      })
    );
  };

  const handleReceiveResponse = (threadId: string, responseText: string) => {
    setChatThreads((prevThreads) =>
      prevThreads.map((thread) => {
        if (thread.id === threadId) {
          const newMsg: ChatMessage = {
            id: `msg_res_${Date.now()}`,
            sender: 'restaurant',
            text: responseText,
            timestamp: 'Just now'
          };
          return {
            ...thread,
            lastMessageText: responseText,
            lastMessageTime: 'Now',
            unreadCount: currentTab === 'inbox' && activeThreadId === threadId ? 0 : thread.unreadCount + 1,
            messages: [...thread.messages, newMsg]
          };
        }
        return thread;
      })
    );
  };

  const handleLikePost = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const isCurrentlyLiked = post.isLiked;
          return {
            ...post,
            isLiked: !isCurrentlyLiked,
            likesCount: isCurrentlyLiked ? post.likesCount - 1 : post.likesCount + 1
          };
        }
        return post;
      })
    );
  };

  const handleSavePost = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isSaved: !post.isSaved
          };
        }
        return post;
      })
    );
  };

  const handleAddPost = (newPost: { content: string; image: string; rating: number; locationName: string }) => {
    const freshPost: CommunityPost = {
      id: `post_user_${Date.now()}`,
      author: 'hoangsonle1805',
      handle: '@son_hoang_foodie',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRKZRdFtQr7QINgok2cIIj_I4mo7HJMI7i5ywrSs9Z-FpldNZJam-o0Inzqk-l4q9x7dEjZCSdbxyBG9GTzUHdlbB2drKAOGcd6-cTW4zsrmvKvckSZ_1jZyK1kaIqAl8k8O49SYBJO_04AYp1RJCKM-MbF7mPfP2ft_oHP4dPdDBwslbmjGzpvcU0A5pEyWXm837Es0Z7AgcbTvM2zx2gftDZiniFueWJf8phqDltfzBrhQiLeouhVErO1tWNv5-n1WvtpIAvlw',
      timeAgo: 'Vừa xong',
      rating: Number(newPost.rating.toFixed(1)),
      image: newPost.image,
      content: newPost.content,
      locationName: newPost.locationName,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isSaved: false
    };

    setPosts([freshPost, ...posts]);
    setCurrentTab('discover');

    void createCommunityPost(freshPost).catch(() => undefined);
  };

  const handleConfirmBooking = (bookingDetails: { date: string; time: string; guests: number; seating: string }) => {
    const bookingRestaurant = selectedRestaurantId
      ? restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0]
      : restaurants.find((r) => r.id === 'oc_oanh') || restaurants[0];

    void createBooking({
      restaurantId: bookingRestaurant.id,
      date: bookingDetails.date,
      time: bookingDetails.time,
      guests: bookingDetails.guests,
      seating: bookingDetails.seating
    }).catch(() => undefined);

    const bookingMessageText = `📅 BOOKING CONFIRMED: Table for ${bookingDetails.guests} on ${bookingDetails.date} at ${bookingDetails.time} (${bookingDetails.seating} choice)`;

    setTimeout(() => {
      setChatThreads((prevThreads) =>
        prevThreads.map((thread) => {
          if (thread.restaurantId === 'oc_oanh') {
            const bookingMsg: ChatMessage = {
              id: `booking_notif_${Date.now()}`,
              sender: 'restaurant',
              text: bookingMessageText,
              timestamp: 'Just now'
            };
            return {
              ...thread,
              lastMessageText: bookingMessageText,
              lastMessageTime: 'Now',
              unreadCount: thread.unreadCount + 1,
              messages: [...thread.messages, bookingMsg]
            };
          }
          return thread;
        })
      );
    }, 1200);
  };

  const unreadInboxCount = chatThreads.reduce((total, t) => total + t.unreadCount, 0);

  const renderMainContent = () => {
    if (selectedRestaurantId) {
      const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0];
      return (
        <PageDetail
          restaurant={selectedRestaurant}
          onBack={() => setSelectedRestaurantId(null)}
          onOpenBooking={() => setIsBookingOpen(true)}
          onStartAudio={() => {
            const relevantTour = audioTours.find((t) => t.title.toLowerCase().includes('seafood')) || audioTours[0];
            setActiveAudioTour(relevantTour);
          }}
          onGoToChat={() => {
            const matchOanh = chatThreads.find((t) => t.restaurantId === 'oc_oanh');
            if (matchOanh) {
              setActiveThreadId(matchOanh.id);
            }
            setSelectedRestaurantId(null);
            setCurrentTab('inbox');
          }}
        />
      );
    }

    switch (currentTab) {
      case 'map':
        return (
          <PageMap
            restaurants={restaurants}
            onSelectRestaurant={handleSelectRestaurant}
            onSelectTour={handleSelectTour}
          />
        );
      case 'discover':
        return (
          <PageDiscover
            tours={audioTours}
            posts={posts}
            onPlayTour={(tour) => setActiveAudioTour(tour)}
            onLikePost={handleLikePost}
            onSavePost={handleSavePost}
          />
        );
      case 'create':
        return <PageCreate onAddPost={handleAddPost} onCancel={() => setCurrentTab('discover')} />;
      case 'inbox':
        return (
          <PageInbox
            threads={chatThreads}
            activeThreadId={activeThreadId}
            onSelectThread={(tid) => {
              setActiveThreadId(tid);
              setChatThreads((prev) => prev.map((t) => (t.id === tid ? { ...t, unreadCount: 0 } : t)));
            }}
            onSendMessage={handleSendMessage}
            onReceiveResponse={handleReceiveResponse}
          />
        );
      case 'profile':
        return <PageProfile userEmail={userEmail} totalPostsCount={posts.filter((p) => p.author === 'hoangsonle1805').length} />;
      default:
        return (
          <PageMap
            restaurants={restaurants}
            onSelectRestaurant={handleSelectRestaurant}
            onSelectTour={handleSelectTour}
          />
        );
    }
  };

  const selectedRestaurantForBooking = selectedRestaurantId
    ? restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0]
    : restaurants.find((r) => r.id === 'oc_oanh') || restaurants[0];

  return (
    <div className="min-h-screen pb-16 md:pb-0 pt-[72px] flex flex-col font-sans text-on-surface bg-[#f8f9fa]">
      <NavBar
        currentTab={currentTab}
        onChangeTab={(tab) => {
          setSelectedRestaurantId(null);
          setCurrentTab(tab);
        }}
        unreadInboxCount={unreadInboxCount}
      />

      <main className="flex-1 w-full animate-fade-in duration-300">{renderMainContent()}</main>

      <AudioPlayer tour={activeAudioTour} onClose={() => setActiveAudioTour(null)} />

      <BookingModal
        restaurant={selectedRestaurantForBooking}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onConfirm={handleConfirmBooking}
      />

      <footer className="hidden md:flex bg-surface-container-high text-on-surface-variant font-label-sm text-[11px] py-4 border-t border-outline-variant/20 items-center justify-center gap-2 select-none z-40 relative">
        <span>© 2026 CraveMap Food Exploration System. Match visual mockup layouts.</span>
        <span className="w-1.5 h-1.5 bg-primary rounded-full" />
        <span>
          User Active: <strong className="font-bold">{userEmail}</strong>
        </span>
      </footer>
    </div>
  );
}

export default App;
