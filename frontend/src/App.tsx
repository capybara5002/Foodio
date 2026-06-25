import { useCallback, useEffect, useRef, useState } from 'react';
import { initialRestaurants, initialChatThreads, initialAudioTours } from './data';
import { Restaurant, ChatThread, AudioTour, CommunityPost } from './types';
import {
  createBooking,
  createCommunityPost,
  ensureChatThread,
  getAudioTours,
  getChatThreads,
  getRestaurants,
  getSavedPlaces,
  removeSavedPlace,
  savePlace
} from './api/cravemapApi';

import NavBar from './components/NavBar';
import AudioPlayer from './components/AudioPlayer';
import BookingModal from './components/BookingModal';
import LoginModal from './components/Common/LoginModal';
import PaymentGate from './components/Common/PaymentGate';
import PaymentStatusPill from './components/Common/PaymentStatusPill';
import LoadingSpinner from './components/Common/LoadingSpinner';
import PresenceReporter from './components/Common/PresenceReporter';
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
import { matchPath, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

type AppTab = 'map' | 'discover' | 'create' | 'inbox' | 'profile';

const getTabFromPath = (pathname: string): AppTab => {
  if (pathname === '/discover') return 'discover';
  if (pathname === '/posts/new') return 'create';
  if (pathname === '/inbox') return 'inbox';
  if (pathname === '/profile' || pathname === '/admin' || pathname === '/owner') return 'profile';
  return 'map';
};

function AppContent() {
  const { t, i18n } = useTranslation();
  const { user, isLoading: isAuthLoading, qrLogin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentTab = getTabFromPath(location.pathname);
  const restaurantRoute = matchPath('/restaurants/:restaurantId', location.pathname);
  const selectedRestaurantId = restaurantRoute?.params.restaurantId ?? null;
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [activeAudioTour, setActiveAudioTour] = useState<AudioTour | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchSelection, setMapSearchSelection] = useState<{ restaurantId: string; requestId: number } | null>(null);

  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants);
  const [hasLoadedRestaurantData, setHasLoadedRestaurantData] = useState(false);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>(initialChatThreads);
  const [audioTours, setAudioTours] = useState<AudioTour[]>(initialAudioTours);
  const [sessionCommunityPosts, setSessionCommunityPosts] = useState<CommunityPost[]>([]);
  const [savedRestaurantIds, setSavedRestaurantIds] = useState<string[]>([]);

  // User location for real distance calculations (default: Vinh Khanh center)
  const [userLocation, setUserLocation] = useState<[number, number]>([10.7580, 106.7020]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {/* keep default */},
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  const [activeThreadId, setActiveThreadId] = useState<string>('');

  // Authentication interception states
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // QR verification status banner states
  const [qrStatus, setQrStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const handledQrTokenRef = useRef<string | null>(null);

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
      } finally {
        if (!cancelled) {
          setHasLoadedRestaurantData(true);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [activeChatRestaurantId, activeChatUserId]);

  useEffect(() => {
    let cancelled = false;

    if (!isSignedInUser || !user) {
      setSavedRestaurantIds([]);
      return () => {
        cancelled = true;
      };
    }

    getSavedPlaces(user.id)
      .then((savedPlaces) => {
        if (!cancelled) {
          setSavedRestaurantIds(savedPlaces.map((savedPlace) => savedPlace.restaurantId));
        }
      })
      .catch((error) => {
        console.warn('Failed to load saved places:', error);
        if (!cancelled) setSavedRestaurantIds([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isSignedInUser, user]);

  // Detect QR Token inside URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qrToken = params.get('qr');
    if (qrToken && handledQrTokenRef.current !== qrToken) {
      handledQrTokenRef.current = qrToken;
      const verifySession = async () => {
        try {
          const guestUser = await qrLogin(qrToken);
          setQrStatus({
            type: 'success',
            message: t('qr.verify_success', { table: guestUser.tableNumber })
          });
          // Redirect to the restaurant scanned if possible
          if (guestUser.restaurantId) {
            navigate(`/restaurants/${encodeURIComponent(guestUser.restaurantId)}`, { replace: true });
          } else {
            navigate(location.pathname, { replace: true });
          }
          setTimeout(() => setQrStatus(null), 5000);
        } catch (err: any) {
          setQrStatus({
            type: 'error',
            message: t('qr.verify_error', { error: err.message || (i18n.language === 'vi' ? 'Mã hết hạn hoặc không hợp lệ' : 'Code expired or invalid') })
          });
          navigate(location.pathname, { replace: true });
          setTimeout(() => setQrStatus(null), 5000);
        }
      };
      void verifySession();
    }
  }, [i18n.language, location.pathname, navigate, qrLogin, t]);

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
    if (isAuthLoading || isSignedInUser) return;

    const protectedRoute = location.pathname === '/inbox'
      ? { message: t('auth.require_login_chat'), path: '/inbox' }
      : location.pathname === '/posts/new'
        ? { message: t('auth.require_login_post'), path: '/posts/new' }
        : null;

    if (!protectedRoute) return;

    navigate('/map', { replace: true });
    setLoginMessage(protectedRoute.message);
    setPendingAction(() => () => navigate(protectedRoute.path));
    setIsLoginOpen(true);
  }, [isAuthLoading, isSignedInUser, location.pathname, navigate, t]);

  const handleSelectRestaurant = (id: string) => {
    navigate(`/restaurants/${encodeURIComponent(id)}`);
  };

  const handleSelectTour = () => {
    navigate('/discover');
    const firstTour = audioTours[0];
    if (firstTour) {
      setActiveAudioTour(firstTour);
    }
  };

  const handleOpenCreatePost = () => {
    requireAuth(t('auth.require_login_post'), () => {
      navigate('/posts/new');
    });
  };

  const handleChangeTab = (tab: AppTab) => {
    try {
      stopNarration();
    } catch (e) { }

    if (tab === 'create') {
      handleOpenCreatePost();
      return;
    }

    if (tab === 'inbox') {
      requireAuth(t('auth.require_login_chat'), () => {
        navigate('/inbox');
      });
      return;
    }

    if (tab === 'profile') {
      navigate(user?.role === 'Admin' ? '/admin' : user?.role === 'Owner' ? '/owner' : '/profile');
      return;
    }

    navigate(tab === 'discover' ? '/discover' : '/map');
  };

  const handleMapSearchSelect = (restaurantId: string) => {
    navigate('/map');
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
    navigate('/inbox');
  };

  const handleContactRestaurant = async (restaurantId: string) => {
    if (user?.role === 'Owner' && user.restaurantId === restaurantId) {
      navigate('/inbox');
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
      navigate('/inbox');
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
    navigate('/discover');
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

  const handleToggleSavedPlace = async (restaurantId: string) => {
    let savingUser = user;
    if (!savingUser) {
      try {
        savingUser = JSON.parse(localStorage.getItem('foodio_user') || 'null');
      } catch {
        savingUser = null;
      }
    }

    if (!savingUser || savingUser.role === 'Guest') {
      throw new Error(t('auth.require_login_save', 'Bạn cần đăng nhập để lưu quán.'));
    }

    const wasSaved = savedRestaurantIds.includes(restaurantId);
    setSavedRestaurantIds((current) => (
      wasSaved
        ? current.filter((id) => id !== restaurantId)
        : [restaurantId, ...current.filter((id) => id !== restaurantId)]
    ));

    try {
      if (wasSaved) {
        await removeSavedPlace(savingUser.id, restaurantId);
      } else {
        await savePlace(savingUser.id, restaurantId);
      }
    } catch (error) {
      setSavedRestaurantIds((current) => (
        wasSaved
          ? [restaurantId, ...current.filter((id) => id !== restaurantId)]
          : current.filter((id) => id !== restaurantId)
      ));
      throw error;
    }
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

  const activeRestaurants = restaurants.filter((restaurant) => restaurant.isActive !== false);
  const savedRestaurants = savedRestaurantIds
    .map((id) => activeRestaurants.find((restaurant) => restaurant.id === id))
    .filter((restaurant): restaurant is Restaurant => Boolean(restaurant));
  const selectedRestaurant = selectedRestaurantId
    ? restaurants.find((restaurant) => restaurant.id === selectedRestaurantId)
    : undefined;

  const renderMap = () => (
    <PageMap
      restaurants={activeRestaurants}
      onSelectRestaurant={handleSelectRestaurant}
      onSelectTour={handleSelectTour}
      onContactRestaurant={handleContactRestaurant}
      savedRestaurantIds={savedRestaurantIds}
      onToggleSavedRestaurant={(restaurantId) => {
        requireAuth(t('auth.require_login_save'), () => {
          void handleToggleSavedPlace(restaurantId).catch((error) => {
            console.error('Failed to update saved place:', error);
          });
        });
      }}
      searchSelection={mapSearchSelection}
    />
  );

  const renderProfile = () => (
    <PageProfile
      userEmail={userEmail}
      onLoginTrigger={() => {
        setLoginMessage(t('auth.login_title'));
        setPendingAction(null);
        setIsLoginOpen(true);
      }}
      sessionCommunityPosts={sessionCommunityPosts}
      savedRestaurants={savedRestaurants}
      onSelectSavedRestaurant={handleSelectRestaurant}
      onRestaurantUpdated={handleRestaurantUpdated}
      onRefreshRestaurants={handleRefreshRestaurants}
    />
  );

  const renderMainContent = () => (
    <Routes>
      <Route path="/" element={<Navigate to="/map" replace />} />
      <Route path="/map" element={renderMap()} />
      <Route
        path="/discover"
        element={(
          <PageDiscover
            tours={audioTours}
            onPlayTour={(tour) => setActiveAudioTour(tour)}
            searchText=""
            sessionCommunityPosts={sessionCommunityPosts}
            onCreatePost={handleOpenCreatePost}
          />
        )}
      />
      <Route
        path="/posts/new"
        element={isAuthLoading ? <LoadingSpinner /> : isSignedInUser ? (
          <PageCreate
            restaurants={activeRestaurants}
            onAddPost={handleAddPost}
            onCancel={() => navigate('/discover')}
          />
        ) : <Navigate to="/map" replace />}
      />
      <Route
        path="/inbox"
        element={isAuthLoading ? <LoadingSpinner /> : isSignedInUser ? (
          <PageInbox
            threads={chatThreads}
            activeThreadId={activeThreadId}
            userId={activeChatUserId}
            restaurantId={activeChatRestaurantId}
            restaurants={restaurants}
            currentUserRole={user?.role ?? 'Guest'}
            onSelectThread={(tid) => {
              setActiveThreadId(tid);
              setChatThreads((prev) => sortThreads(prev.map((thread) => (
                thread.id === tid ? { ...thread, unreadCount: 0 } : thread
              ))));
            }}
            onStartThread={user && user.role !== 'Guest' ? openRestaurantChat : undefined}
            onThreadUpdated={upsertThread}
          />
        ) : <Navigate to="/map" replace />}
      />
      <Route path="/profile" element={renderProfile()} />
      <Route
        path="/admin"
        element={isAuthLoading
          ? <LoadingSpinner />
          : user?.role === 'Admin' ? renderProfile() : <Navigate to="/profile" replace />}
      />
      <Route
        path="/owner"
        element={isAuthLoading
          ? <LoadingSpinner />
          : user?.role === 'Owner' ? renderProfile() : <Navigate to="/profile" replace />}
      />
      <Route
        path="/restaurants/:restaurantId"
        element={selectedRestaurant ? (
          <PageDetail
            restaurant={selectedRestaurant}
            onBack={() => {
              const historyIndex = window.history.state?.idx;
              if (typeof historyIndex === 'number' && historyIndex > 0) {
                navigate(-1);
              } else {
                navigate('/map', { replace: true });
              }
            }}
            onOpenBooking={() => {
              requireAuth(t('auth.require_login_booking'), () => {
                setIsBookingOpen(true);
              });
            }}
            onGoToChat={() => void handleContactRestaurant(selectedRestaurant.id)}
            requireAuth={requireAuth}
            onRestaurantUpdated={handleRestaurantUpdated}
            isSaved={savedRestaurantIds.includes(selectedRestaurant.id)}
            onToggleSaved={() => handleToggleSavedPlace(selectedRestaurant.id)}
            onContactUser={handleContactUser}
            userLocation={userLocation}
          />
        ) : hasLoadedRestaurantData ? <Navigate to="/map" replace /> : <LoadingSpinner />}
      />
      <Route path="*" element={<Navigate to="/map" replace />} />
    </Routes>
  );

  const selectedRestaurantForBooking = selectedRestaurantId
    ? restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0]
    : restaurants.find((r) => r.id === 'oc_oanh') || restaurants[0];
  const showMobileHeaderPaymentStatus = currentTab !== 'map';

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
        paymentStatus={(
          <>
            <PaymentStatusPill placement="header" />
            {showMobileHeaderPaymentStatus && <PaymentStatusPill placement="mobile-header" />}
          </>
        )}
      />

      <OfflineBanner />
      {!showMobileHeaderPaymentStatus && <PaymentStatusPill placement="floating" />}

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
      <AuthProvider>
        <PresenceReporter />
        <PaymentGate>
          <AppContent />
        </PaymentGate>
      </AuthProvider>
    </PaymentProvider>
  );
}
