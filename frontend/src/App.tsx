import { useCallback, useEffect, useState } from 'react';
import { initialRestaurants, initialChatThreads, initialAudioTours } from './data';
import { Restaurant, ChatThread, AudioTour, CommunityPost } from './types';
import {
  createBooking,
  createCommunityPost,
  ensureChatThread,
  getAudioTours,
  getChatThreads,
  getRestaurants
} from './api/cravemapApi';

import NavBar from './components/NavBar';
import AudioPlayer from './components/AudioPlayer';
import BookingModal from './components/BookingModal';
import LoginModal from './components/Common/LoginModal';
import PaymentGate from './components/Common/PaymentGate';
import PaymentStatusPill from './components/Common/PaymentStatusPill';
import PageMap from './pages/PageMap';
import PageDiscover from './pages/PageDiscover';
import PageDetail from './pages/PageDetail';
import PageCreate from './pages/PageCreate';
import PageInbox from './pages/PageInbox';
import PageProfile from './pages/PageProfile';

import OfflineBanner from './components/Common/OfflineBanner';
import { getCachedRestaurants, saveRestaurants, getCachedAudioTours, saveAudioTours, saveLastSyncInfo } from './services/offlineStore';

import { AuthProvider, useAuth } from './context/AuthContext';
import { PaymentProvider } from './context/PaymentContext';
import { useTranslation } from 'react-i18next';
import { stopNarration } from './services/narrationEngine';

function AppContent() {
  const { t, i18n } = useTranslation();
  const { user, qrLogin, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<'map' | 'discover' | 'create' | 'inbox' | 'profile'>('map');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [activeAudioTour, setActiveAudioTour] = useState<AudioTour | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchSelection, setMapSearchSelection] = useState<{ restaurantId: string; requestId: number } | null>(null);

  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>(initialChatThreads);
  const [audioTours, setAudioTours] = useState<AudioTour[]>(initialAudioTours);
  const [sessionCommunityPosts, setSessionCommunityPosts] = useState<CommunityPost[]>([]);

  const [activeThreadId, setActiveThreadId] = useState<string>('');

  // Authentication interception states
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // QR verification status banner states
  const [qrStatus, setQrStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const userEmail = user ? user.email : t('auth.not_logged_in');
  const activeChatUserId = user?.id ?? 'usr_3';
  const activeChatRestaurantId = user?.role === 'Owner' ? user.restaurantId : undefined;
  const isSignedInUser = Boolean(user && user.role !== 'Guest');

  const getThreadSortTime = (value: string) => {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  const sortThreads = (items: ChatThread[]) =>
    [...items].sort((a, b) => getThreadSortTime(b.lastMessageTime) - getThreadSortTime(a.lastMessageTime));

  const mergeThreads = (...groups: ChatThread[][]) => {
    const merged = new Map<string, ChatThread>();
    groups.flat().forEach((thread) => {
      merged.set(thread.id, thread);
    });
    return [...merged.values()];
  };

  const getRelevantChatThreads = async () => {
    if (!activeChatRestaurantId) {
      return getChatThreads({ userId: activeChatUserId });
    }

    const [ownerThreads, customerThreads] = await Promise.all([
      getChatThreads({ restaurantId: activeChatRestaurantId }),
      getChatThreads({ userId: activeChatUserId })
    ]);

    return mergeThreads(ownerThreads, customerThreads).filter(
      (thread) => !(thread.restaurantId === activeChatRestaurantId && thread.userId === activeChatUserId)
    );
  };

  const replaceChatThreads = (items: ChatThread[]) => {
    const sorted = sortThreads(items);
    setChatThreads(sorted);
    setActiveThreadId((prev) => (sorted.some((thread) => thread.id === prev) ? prev : sorted[0]?.id ?? ''));
  };

  const upsertThread = useCallback((incoming: ChatThread) => {
    setChatThreads((prev) => {
      const exists = prev.some((thread) => thread.id === incoming.id);
      const next = exists
        ? prev.map((thread) => (thread.id === incoming.id ? { ...thread, ...incoming } : thread))
        : [incoming, ...prev];

      return sortThreads(next);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      // Step 1: Attempt to load from IndexedDB cache first
      try {
        const [cachedRest, cachedTours] = await Promise.all([
          getCachedRestaurants(),
          getCachedAudioTours()
        ]);
        if (!cancelled) {
          if (cachedRest && cachedRest.length > 0) {
            setRestaurants(cachedRest);
          }
          if (cachedTours && cachedTours.length > 0) {
            setAudioTours(cachedTours);
          }
        }
      } catch (cacheErr) {
        console.warn('Failed to load from IndexedDB cache on start:', cacheErr);
      }

      // Step 2: Fetch fresh data from remote API
      try {
        const [remoteRestaurants, remoteThreads, remoteTours] = await Promise.all([
          getRestaurants(),
          getRelevantChatThreads(),
          getAudioTours()
        ]);

        if (cancelled) return;

        if (remoteRestaurants.length > 0) {
          setRestaurants(remoteRestaurants);
          void saveRestaurants(remoteRestaurants);
        }
        replaceChatThreads(remoteThreads);
        if (remoteTours.length > 0) {
          setAudioTours(remoteTours);
          void saveAudioTours(remoteTours);
        }
        void saveLastSyncInfo({ timestamp: Date.now() });
      } catch (error) {
        console.warn('CraveMap API unavailable, using local/cached data.', error);
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [activeChatRestaurantId, activeChatUserId]);

  // Detect QR Token inside URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qrToken = params.get('qr');
    if (qrToken) {
      const verifySession = async () => {
        try {
          const guestUser = await qrLogin(qrToken);
          setQrStatus({
            type: 'success',
            message: t('qr.verify_success', { table: guestUser.tableNumber })
          });
          // Redirect to the restaurant scanned if possible
          if (guestUser.restaurantId) {
            setSelectedRestaurantId(guestUser.restaurantId);
          }
          setTimeout(() => setQrStatus(null), 5000);
        } catch (err: any) {
          setQrStatus({
            type: 'error',
            message: t('qr.verify_error', { error: err.message || (i18n.language === 'vi' ? 'Mã hết hạn hoặc không hợp lệ' : 'Code expired or invalid') })
          });
          setTimeout(() => setQrStatus(null), 5000);
        } finally {
          // Clear query params to clean URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      };
      void verifySession();
    }
  }, [qrLogin]);

  const requireAuth = (message: string, action: () => void) => {
    if (isSignedInUser) {
      action();
    } else {
      setLoginMessage(message);
      setPendingAction(() => action);
      setIsLoginOpen(true);
    }
  };

  useEffect(() => {
    if (currentTab !== 'inbox' || isSignedInUser) return;

    setSelectedRestaurantId(null);
    setCurrentTab('map');
    setLoginMessage(t('auth.require_login_chat'));
    setPendingAction(() => () => {
      setSelectedRestaurantId(null);
      setCurrentTab('inbox');
    });
    setIsLoginOpen(true);
  }, [currentTab, isSignedInUser, t]);

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

  const handleOpenCreatePost = () => {
    requireAuth(t('auth.require_login_post'), () => {
      setSelectedRestaurantId(null);
      setCurrentTab('create');
    });
  };

  const handleChangeTab = (tab: 'map' | 'discover' | 'create' | 'inbox' | 'profile') => {
    try {
      stopNarration();
    } catch (e) { }

    if (tab === 'create') {
      handleOpenCreatePost();
      return;
    }

    if (tab === 'inbox') {
      requireAuth(t('auth.require_login_chat'), () => {
        setSelectedRestaurantId(null);
        setCurrentTab('inbox');
      });
      return;
    }

    setSelectedRestaurantId(null);
    setCurrentTab(tab);
  };

  const handleMapSearchSelect = (restaurantId: string) => {
    setSelectedRestaurantId(null);
    setCurrentTab('map');
    setMapSearchSelection({ restaurantId, requestId: Date.now() });
  };

  const handleRefreshThreads = async () => {
    try {
      const remoteThreads = await getRelevantChatThreads();
      replaceChatThreads(remoteThreads);
    } catch (error) {
      console.warn('Failed to refresh chat threads:', error);
    }
  };

  const openRestaurantChat = async (restaurantId: string) => {
    const thread = await ensureChatThread(restaurantId, activeChatUserId);
    upsertThread(thread);
    setActiveThreadId(thread.id);
    setSelectedRestaurantId(null);
    setCurrentTab('inbox');
  };

  const handleContactRestaurant = async (restaurantId: string) => {
    if (user?.role === 'Owner' && user.restaurantId === restaurantId) {
      setSelectedRestaurantId(null);
      setCurrentTab('inbox');
      return;
    }

    requireAuth(t('auth.require_login_chat'), async () => {
      try {
        await openRestaurantChat(restaurantId);
      } catch (error) {
        console.error('Failed to open restaurant chat:', error);
      }
    });
  };

  const handleContactUser = async (reviewerUsername: string) => {
    if (!user || user.role !== 'Owner' || !user.restaurantId) return;
    try {
      const thread = await ensureChatThread(user.restaurantId, reviewerUsername);
      upsertThread(thread);
      setActiveThreadId(thread.id);
      setSelectedRestaurantId(null);
      setCurrentTab('inbox');
    } catch (error) {
      console.error('Failed to contact reviewer:', error);
    }
  };

  const handleAddPost = async (newPost: {
    content: string;
    image: string;
    images: string[];
    locationName: string;
    restaurantId?: string;
    postType: 'story' | 'promotion';
  }) => {
    const taggedRestaurant = restaurants.find((restaurant) => restaurant.id === newPost.restaurantId);
    const isRestaurantPost = user?.role === 'Owner';
    const postImages = newPost.images.length > 0 ? newPost.images : [newPost.image];

    const freshPost: CommunityPost = {
      id: `post_user_${Date.now()}`,
      author: isRestaurantPost && taggedRestaurant ? taggedRestaurant.name : user?.username || 'user_anonymous',
      handle: isRestaurantPost && taggedRestaurant ? `@${taggedRestaurant.id}` : `@${user?.username || 'user_anonymous'}`,
      avatar: user?.avatar || taggedRestaurant?.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRKz2YnyvZVLIBglb9f9NCrquX4dKnpC6f_I1bacYnGKPkCdd4BK4ec4NSU3T0QDdjyD09txLee_GTY0faM2F7c2iZtVrQ5AWBSRzGLIRZO8qylHZIKMAGiBCW0yPydeRXezrelYofwryiKBLEy4t0THRWH9807xh6L2T4xl221ZBFmgNwcC8Xqx34_V1ZveUHvBcv4cs9R-oNv4eYz9I-wfJoaK1POgGMvhhjPVERdEp3OZI9gxH39c_gaG667-MpaMfEpaiArA',
      timeAgo: 'Vừa xong',
      rating: 0,
      image: postImages[0],
      images: postImages,
      content: newPost.content,
      locationName: taggedRestaurant?.name || newPost.locationName,
      restaurantId: taggedRestaurant?.id,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isSaved: false,
      isRestaurantPost,
      isApproved: isRestaurantPost,
      postType: newPost.postType
    };

    setSessionCommunityPosts((prevPosts) => [
      freshPost,
      ...prevPosts.filter((post) => post.id !== freshPost.id)
    ]);
    setCurrentTab('discover');
    try {
      await createCommunityPost(freshPost);
    } catch (error) {
      console.error('Failed to create community post:', error);
    }
  };

  const handleConfirmBooking = (bookingDetails: { date: string; time: string; guests: number; seating: string; tableNumber?: string }) => {
    const bookingRestaurant = selectedRestaurantId
      ? restaurants.find((r) => r.id === selectedRestaurantId)
      : restaurants.find((r) => r.id === 'oc_oanh') || restaurants[0];

    if (!bookingRestaurant) {
      return Promise.reject(new Error(t('booking.no_restaurant', 'No restaurant available for booking.')));
    }

    return createBooking({
      restaurantId: bookingRestaurant.id,
      date: bookingDetails.date,
      time: bookingDetails.time,
      guests: bookingDetails.guests,
      seating: bookingDetails.seating,
      userId: activeChatUserId,
      tableNumber: bookingDetails.tableNumber
    })
      .then(() => handleRefreshThreads());
  };

  const handleRestaurantUpdated = (updated: Restaurant) => {
    setRestaurants((prev) => {
      const next = prev.map((r) => (r.id === updated.id ? updated : r));
      void saveRestaurants(next);
      return next;
    });
  };

  const handleRefreshRestaurants = useCallback(async () => {
    try {
      const remoteRestaurants = await getRestaurants();
      if (remoteRestaurants.length > 0) {
        setRestaurants(remoteRestaurants);
        void saveRestaurants(remoteRestaurants);
      }
    } catch (error) {
      console.warn('Failed to refresh restaurants:', error);
    }
  }, []);

  const unreadInboxCount = isSignedInUser ? chatThreads.reduce((total, t) => total + t.unreadCount, 0) : 0;

  const renderMainContent = () => {
    if (selectedRestaurantId) {
      const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0];
      return (
        <PageDetail
          restaurant={selectedRestaurant}
          onBack={() => setSelectedRestaurantId(null)}
          onOpenBooking={() => {
            requireAuth(t('auth.require_login_booking'), () => {
              setIsBookingOpen(true);
            });
          }}
          onGoToChat={() => void handleContactRestaurant(selectedRestaurant.id)}
          requireAuth={requireAuth}
          onRestaurantUpdated={handleRestaurantUpdated}
          onContactUser={handleContactUser}
        />
      );
    }

    switch (currentTab) {
      case 'map':
        return (
          <PageMap
            restaurants={restaurants.filter(r => r.isActive !== false)}
            onSelectRestaurant={handleSelectRestaurant}
            onSelectTour={handleSelectTour}
            onContactRestaurant={handleContactRestaurant}
            searchSelection={mapSearchSelection}
          />
        );
      case 'discover':
        return (
          <PageDiscover
            tours={audioTours}
            onPlayTour={(tour) => setActiveAudioTour(tour)}
            searchText=""
            sessionCommunityPosts={sessionCommunityPosts}
            onCreatePost={handleOpenCreatePost}
          />
        );
      case 'create':
        return <PageCreate restaurants={restaurants.filter(r => r.isActive !== false)} onAddPost={handleAddPost} onCancel={() => setCurrentTab('discover')} />;
      case 'inbox':
        if (!isSignedInUser) {
          return (
            <PageMap
              restaurants={restaurants.filter(r => r.isActive !== false)}
              onSelectRestaurant={handleSelectRestaurant}
              onSelectTour={handleSelectTour}
              onContactRestaurant={handleContactRestaurant}
              searchSelection={mapSearchSelection}
            />
          );
        }

        return (
          <PageInbox
            threads={chatThreads}
            activeThreadId={activeThreadId}
            userId={activeChatUserId}
            restaurantId={activeChatRestaurantId}
            restaurants={restaurants}
            currentUserRole={user?.role ?? 'Guest'}
            onSelectThread={(tid) => {
              setActiveThreadId(tid);
              setChatThreads((prev) => sortThreads(prev.map((t) => (t.id === tid ? { ...t, unreadCount: 0 } : t))));
            }}
            onStartThread={user && user.role !== 'Guest' ? openRestaurantChat : undefined}
            onThreadUpdated={upsertThread}
          />
        );
      case 'profile':
        return (
          <PageProfile
            userEmail={userEmail}
            onLoginTrigger={() => {
              setLoginMessage(t('auth.login_title'));
              setPendingAction(null);
              setIsLoginOpen(true);
            }}
            sessionCommunityPosts={sessionCommunityPosts}
            onRestaurantUpdated={handleRestaurantUpdated}
            onRefreshRestaurants={handleRefreshRestaurants}
          />
        );
      default:
        return (
          <PageMap
            restaurants={restaurants.filter(r => r.isActive !== false)}
            onSelectRestaurant={handleSelectRestaurant}
            onSelectTour={handleSelectTour}
            onContactRestaurant={handleContactRestaurant}
            searchSelection={mapSearchSelection}
          />
        );
    }
  };

  const selectedRestaurantForBooking = selectedRestaurantId
    ? restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0]
    : restaurants.find((r) => r.id === 'oc_oanh') || restaurants[0];

  return (
    <div className="foodio-shell min-h-screen pb-24 md:pb-0 pt-[72px] flex flex-col font-sans text-on-surface">
      <NavBar
        currentTab={currentTab}
        onChangeTab={handleChangeTab}
        unreadInboxCount={unreadInboxCount}
        restaurants={restaurants.filter(r => r.isActive !== false)}
        searchQuery={mapSearchQuery}
        onSearchQueryChange={setMapSearchQuery}
        onSearchRestaurantSelect={handleMapSearchSelect}
      />

      <OfflineBanner />
      <PaymentStatusPill />

      {qrStatus && (
        <div className={`fixed top-24 left-1/2 z-[90] -translate-x-1/2 rounded-full border px-5 py-3 shadow-[0_18px_46px_rgba(77,49,31,0.16)] backdrop-blur-xl font-mono text-[11px] font-bold tracking-wide animate-in slide-in-from-top-4 ${qrStatus.type === 'success' ? 'border-emerald-600/20 bg-emerald-50/90 text-emerald-900' : 'border-red-600/20 bg-red-50/90 text-red-900'
          }`}>
          {qrStatus.message}
        </div>
      )}

      {user?.role === 'Guest' && (
        <div className="fixed bottom-24 left-4 z-[70] flex items-center gap-2 rounded-full border border-[#b76548]/20 bg-[#fffaf4]/88 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#8f4f3b] shadow-[0_18px_46px_rgba(77,49,31,0.14)] backdrop-blur-xl select-none md:bottom-6">
          <span className="w-2 h-2 rounded-full bg-[#b76548] animate-pulse" />
          <span>{t('auth.guest_mode', { table: user.tableNumber })}</span>
          <button
            onClick={logout}
            className="ml-1 rounded-full px-2 py-0.5 text-[#2c211b] transition-colors hover:bg-[#f0e5d8] hover:text-[#8f4f3b]"
          >
            {t('auth.login')}
          </button>
        </div>
      )}

      <main className="flex-1 w-full animate-fade-in duration-300">{renderMainContent()}</main>

      <AudioPlayer tour={activeAudioTour} onClose={() => setActiveAudioTour(null)} />

      <BookingModal
        restaurant={selectedRestaurantForBooking}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onConfirm={handleConfirmBooking}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        message={loginMessage}
        onSuccess={() => {
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
      />

    </div>
  );
}

export default function App() {
  return (
    <PaymentProvider>
      <PaymentGate>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </PaymentGate>
    </PaymentProvider>
  );
}
