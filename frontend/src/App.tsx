import { useCallback, useEffect, useState } from 'react';
import { initialRestaurants, initialChatThreads, initialAudioTours } from './data';
import { Restaurant, ChatThread, AudioTour } from './types';
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
import PageMap from './pages/PageMap';
import PageDiscover from './pages/PageDiscover';
import PageDetail from './pages/PageDetail';
import PageCreate from './pages/PageCreate';
import PageInbox from './pages/PageInbox';
import PageProfile from './pages/PageProfile';

import { AuthProvider, useAuth } from './context/AuthContext';
import { useTranslation } from 'react-i18next';

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

  const [activeThreadId, setActiveThreadId] = useState<string>('oc_oanh_thread');

  // Authentication interception states
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // QR verification status banner states
  const [qrStatus, setQrStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const userEmail = user ? user.email : t('auth.not_logged_in');
  const activeChatUserId = user?.id ?? 'usr_3';
  const activeChatRestaurantId = user?.role === 'Owner' ? user.restaurantId : undefined;

  const getThreadSortTime = (value: string) => {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  const sortThreads = (items: ChatThread[]) =>
    [...items].sort((a, b) => getThreadSortTime(b.lastMessageTime) - getThreadSortTime(a.lastMessageTime));

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
      try {
        const [remoteRestaurants, remoteThreads, remoteTours] = await Promise.all([
          getRestaurants(),
          getChatThreads(
            activeChatRestaurantId
              ? { restaurantId: activeChatRestaurantId }
              : { userId: activeChatUserId }
          ),
          getAudioTours()
        ]);

        if (cancelled) return;

        if (remoteRestaurants.length > 0) setRestaurants(remoteRestaurants);
        replaceChatThreads(remoteThreads);
        if (remoteTours.length > 0) setAudioTours(remoteTours);
      } catch (error) {
        console.warn('CraveMap API unavailable, using local seed data.', error);
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
    if (user && user.role !== 'Guest') {
      action();
    } else {
      setLoginMessage(message);
      setPendingAction(() => action);
      setIsLoginOpen(true);
    }
  };

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

  const handleMapSearchSelect = (restaurantId: string) => {
    setSelectedRestaurantId(null);
    setCurrentTab('map');
    setMapSearchSelection({ restaurantId, requestId: Date.now() });
  };

  const handleRefreshThreads = async () => {
    try {
      const remoteThreads = await getChatThreads(
        activeChatRestaurantId
          ? { restaurantId: activeChatRestaurantId }
          : { userId: activeChatUserId }
      );
      replaceChatThreads(remoteThreads);
    } catch (error) {
      console.warn('Failed to refresh chat threads:', error);
    }
  };

  const handleContactRestaurant = async (restaurantId: string) => {
    requireAuth(t('auth.require_login_chat'), async () => {
      try {
        const thread = await ensureChatThread(restaurantId, activeChatUserId);
        upsertThread(thread);
        setActiveThreadId(thread.id);
        setSelectedRestaurantId(null);
        setCurrentTab('inbox');
      } catch (error) {
        console.error('Failed to open restaurant chat:', error);
      }
    });
  };

  const handleAddPost = async (newPost: { content: string; image: string; rating: number; locationName: string }) => {
    const freshPost = {
      id: `post_user_${Date.now()}`,
      author: user?.username || 'user_anonymous',
      handle: `@${user?.username || 'user_anonymous'}`,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRKz2YnyvZVLIBglb9f9NCrquX4dKnpC6f_I1bacYnGKPkCdd4BK4ec4NSU3T0QDdjyD09txLee_GTY0faM2F7c2iZtVrQ5AWBSRzGLIRZO8qylHZIKMAGiBCW0yPydeRXezrelYofwryiKBLEy4t0THRWH9807xh6L2T4xl221ZBFmgNwcC8Xqx34_V1ZveUHvBcv4cs9R-oNv4eYz9I-wfJoaK1POgGMvhhjPVERdEp3OZI9gxH39c_gaG667-MpaMfEpaiArA',
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

    setCurrentTab('discover');
    try {
      await createCommunityPost(freshPost);
    } catch (error) {
      console.error('Failed to create community post:', error);
    }
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
      seating: bookingDetails.seating,
      userId: activeChatUserId
    })
      .then(() => handleRefreshThreads())
      .catch(() => undefined);
  };

  const handleRestaurantUpdated = (updated: Restaurant) => {
    setRestaurants((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const unreadInboxCount = chatThreads.reduce((total, t) => total + t.unreadCount, 0);

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
          onStartAudio={() => {
            const relevantTour = audioTours.find((t) => t.title.toLowerCase().includes('seafood')) || audioTours[0];
            setActiveAudioTour(relevantTour);
          }}
          onGoToChat={() => void handleContactRestaurant(selectedRestaurant.id)}
          requireAuth={requireAuth}
          onRestaurantUpdated={handleRestaurantUpdated}
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
          />
        );
      case 'create':
        return <PageCreate onAddPost={handleAddPost} onCancel={() => setCurrentTab('discover')} />;
      case 'inbox':
        return (
          <PageInbox
            threads={chatThreads}
            activeThreadId={activeThreadId}
            userId={activeChatUserId}
            restaurantId={activeChatRestaurantId}
            currentUserRole={user?.role ?? 'User'}
            onSelectThread={(tid) => {
              setActiveThreadId(tid);
              setChatThreads((prev) => sortThreads(prev.map((t) => (t.id === tid ? { ...t, unreadCount: 0 } : t))));
            }}
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
            onRestaurantUpdated={handleRestaurantUpdated}
          />
        );
      default:
        return (
          <PageMap
            restaurants={restaurants}
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
    <div className="min-h-screen pb-16 md:pb-0 pt-[72px] flex flex-col font-sans text-on-surface bg-[#f8f9fa]">
      <NavBar
        currentTab={currentTab}
        onChangeTab={(tab) => {
          if (tab === 'create') {
            requireAuth(t('auth.require_login_post'), () => {
              setSelectedRestaurantId(null);
              setCurrentTab('create');
            });
          } else {
            setSelectedRestaurantId(null);
            setCurrentTab(tab);
          }
        }}
        unreadInboxCount={unreadInboxCount}
        restaurants={restaurants}
        searchQuery={mapSearchQuery}
        onSearchQueryChange={setMapSearchQuery}
        onSearchRestaurantSelect={handleMapSearchSelect}
      />

      {/* Floating QR scan notification banner */}
      {qrStatus && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_#1a1a1a] font-mono text-xs font-bold z-[9999] animate-in slide-in-from-top-4 ${
          qrStatus.type === 'success' ? 'bg-[#cbf3d2] text-green-900' : 'bg-[#f8d7da] text-red-900'
        }`}>
          {qrStatus.message}
        </div>
      )}

      {/* Guest Mode Active indicator on bottom left */}
      {user?.role === 'Guest' && (
        <div className="fixed bottom-20 left-4 md:bottom-6 md:left-4 z-[45] bg-[#ffe0b2] border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] px-3.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#e65100] flex items-center gap-1.5 select-none">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span>{t('auth.guest_mode', { table: user.tableNumber })}</span>
          <button 
            onClick={logout}
            className="ml-2 underline text-[#1a1a1a] hover:text-[#e2533b]"
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

      {currentTab !== 'map' && (
        <footer className="hidden md:flex bg-surface-container-high text-on-surface-variant font-label-sm text-[11px] py-4 border-t border-outline-variant/20 items-center justify-center gap-2 select-none z-40 relative">
          <span>{t('footer.copyright')}</span>
          <span className="w-1.5 h-1.5 bg-primary rounded-full" />
          <span>
            {t('auth.active_user')}: <strong className="font-bold">{userEmail}</strong>
          </span>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
