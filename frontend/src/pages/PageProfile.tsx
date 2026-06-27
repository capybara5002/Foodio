import { lazy, Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { CommunityPost, Restaurant } from '../types';
import { UserCircle, BadgeCheck, FileText, Star, Bookmark, MapPin, Globe, LogOut, User, Shield, Store, Edit2, Key, ChevronRight, ChevronDown, Eye, EyeOff, LockKeyhole, WalletCards, Search, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';
import { apiBase } from '../api/apiConfig';
import { usePayment } from '../context/PaymentContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';

interface PageProfileProps {
  userEmail: string;
  onLoginTrigger: () => void;
  sessionCommunityPosts?: CommunityPost[];
  savedRestaurants?: Restaurant[];
  onSelectSavedRestaurant?: (restaurantId: string) => void;
  onRestaurantUpdated?: (updated: Restaurant) => void;
  onRefreshRestaurants?: () => void;
}

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150&auto=format&fit=crop&q=60", // Pizza
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150&auto=format&fit=crop&q=60", // Cafe
  "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=150&auto=format&fit=crop&q=60", // Sushi
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&auto=format&fit=crop&q=60", // Burger
  "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=150&auto=format&fit=crop&q=60", // Ramen
  "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=150&auto=format&fit=crop&q=60"  // Seafood/Snails
];

const normalizeString = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0111\u0110]/g, 'd')
    .toLowerCase();

const AdminDashboard = lazy(() => import('../components/Admin/AdminDashboard'));
const OwnerDashboard = lazy(() => import('../components/Owner/OwnerDashboard'));

export default function PageProfile({ onLoginTrigger, sessionCommunityPosts = [], savedRestaurants = [], onSelectSavedRestaurant, onRestaurantUpdated, onRefreshRestaurants }: PageProfileProps) {
  const { user, logout, updateAvatar, updateUsername, updatePassword } = useAuth();
  const { paymentSession, clearPayment } = usePayment();
  const { t } = useTranslation();
  const { language, languages, changeLanguage, isLoadingLanguage } = useLanguage();
  const [showStatus, setShowStatus] = useState<string | null>(null);
  const [remotePostIds, setRemotePostIds] = useState<Set<string>>(new Set());
  const [showSavedPlaces, setShowSavedPlaces] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [languageQuery, setLanguageQuery] = useState('');
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  
  // Tab control: profile, admin (if admin), owner (if owner)
  const [activeConsole, setActiveConsole] = useState<'profile' | 'admin' | 'owner'>('profile');

  // Avatar edit states
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState('');
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setSelectedAvatarUrl(base64);
    } catch (err) {
      console.error("Failed to read avatar file", err);
    }
  };

  // Password update states
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Display name update states
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameValue, setUsernameValue] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  const filteredLanguages = useMemo(() => {
    const query = normalizeString(languageQuery.trim());
    if (!query) return languages;

    return languages.filter((item) => {
      const searchText = normalizeString(`${item.code} ${item.label} ${item.nativeLabel}`);
      return searchText.includes(query);
    });
  }, [languageQuery, languages]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!languageMenuRef.current?.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (user) {
      setSelectedAvatarUrl(user.avatar || '');
      setUsernameValue(user.username || '');
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.role === 'Guest') return;
    
    const fetchPostsCount = async () => {
      try {
        let response = await fetch(`${apiBase}/api/admin/posts`);
        if (!response.ok) {
          response = await fetch(`${apiBase}/api/communityposts`);
        }
        if (!response.ok) throw new Error("Failed to fetch posts count");
        const data = await response.json();
        const userPosts = data.filter((p: any) =>
          p.author === user.username ||
          p.handle === `@${user.username}` ||
          (user.restaurantId && p.handle === `@${user.restaurantId}`)
        );
        setRemotePostIds(new Set(userPosts.map((post: any) => post.id)));
      } catch (error) {
        console.error("Failed to load user posts count in profile:", error);
      }
    };
    void fetchPostsCount();
  }, [user]);

  const handleSelectLanguage = async (nextLang: string) => {
    const nextLanguage = languages.find((item) => item.code === nextLang);
    const changed = await changeLanguage(nextLang);
    setShowStatus(changed
      ? `${t('profile.app_language')}: ${nextLanguage?.nativeLabel ?? nextLang.toUpperCase()}`
      : 'Could not load this language. Check Google Cloud API key.');
    if (changed) {
      setIsLanguageMenuOpen(false);
      setLanguageQuery('');
    }
    setTimeout(() => setShowStatus(null), 2500);
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatarUrl.trim()) return;
    setIsSavingAvatar(true);
    try {
      await updateAvatar(selectedAvatarUrl.trim());
      setShowStatus(t('profile.update_avatar_success'));
      setIsEditingAvatar(false);
    } catch (err: any) {
      console.error(err);
      setShowStatus(err.message || 'Error updating avatar');
    } finally {
      setIsSavingAvatar(false);
      setTimeout(() => setShowStatus(null), 2500);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setShowStatus(t('profile.password_length_error'));
      setTimeout(() => setShowStatus(null), 2500);
      return;
    }
    if (newPassword !== confirmPassword) {
      setShowStatus(t('profile.password_mismatch'));
      setTimeout(() => setShowStatus(null), 2500);
      return;
    }

    setIsSavingPassword(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setShowStatus(t('profile.update_password_success'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setIsEditingPassword(false);
    } catch (err: any) {
      console.error(err);
      setShowStatus(t('profile.update_password_error'));
    } finally {
      setIsSavingPassword(false);
      setTimeout(() => setShowStatus(null), 2500);
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = usernameValue.trim();
    if (username.length < 2) {
      setShowStatus(t('profile.username_length_error'));
      setTimeout(() => setShowStatus(null), 2500);
      return;
    }

    setIsSavingUsername(true);
    try {
      await updateUsername(username);
      setShowStatus(t('profile.update_username_success'));
      setIsEditingUsername(false);
    } catch (err: any) {
      console.error(err);
      setShowStatus(err.message || t('profile.update_username_error'));
    } finally {
      setIsSavingUsername(false);
      setTimeout(() => setShowStatus(null), 2500);
    }
  };

  const hasDashboardPass = paymentSession?.accessType === 'Owner';

  const handleConsoleSelect = (consoleName: 'profile' | 'admin' | 'owner') => {
    setActiveConsole(consoleName);
    if (consoleName !== 'profile' && !hasDashboardPass) {
      setShowStatus('Goi 19k chi mo app thuong. Can goi Chu quan de mo dashboard.');
      setTimeout(() => setShowStatus(null), 2800);
    }
  };

  const renderDashboardLock = (title: string) => (
    <div className="animate-in fade-in duration-300">
      <div className="rounded-[1.5rem] border border-[#b76548]/20 bg-[#fffaf4]/92 p-6 shadow-[0_24px_70px_rgba(77,49,31,0.14)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2c211b] text-[#fffaf4]">
              <LockKeyhole size={20} />
            </div>
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#b76548]">Dashboard locked</p>
              <h3 className="mt-1 font-serif text-2xl font-black italic text-[#2c211b]">{title}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f655b]">
                Ban dang dung goi 19k Customer, goi nay chi mo ung dung Foodio nhu khach binh thuong. Hay thanh toan goi Chu quan de quan ly dashboard.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearPayment}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#2c211b] px-5 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#fffaf4] shadow-[0_18px_46px_rgba(44,33,27,0.18)] transition-all hover:bg-[#3c2b23] active:scale-[0.98]"
          >
            <WalletCards size={15} />
            <span>Doi goi Chu quan</span>
          </button>
        </div>
      </div>
    </div>
  );

  // 1. If not logged in at all or is guest session, show a beautiful login card
  if (!user || user.role === 'Guest') {
    return (
      <div className="foodio-page w-full min-h-[calc(100vh-72px)] pb-32 text-[#2c211b]">
        <div className="max-w-md mx-auto px-4 py-20 flex flex-col gap-6 text-center foodio-reveal">
          <div className="bg-[#fffaf4]/92 border border-white/70 p-8 shadow-[0_24px_70px_rgba(77,49,31,0.16)] flex flex-col items-center gap-4 rounded-[2rem]">
            <UserCircle size={48} className="text-[#b76548]" />
            <h2 className="font-serif font-bold text-3xl tracking-[-0.055em]">{t('profile.login_required')}</h2>
            <p className="text-sm text-[#6f655b] leading-relaxed max-w-xs">
              {t('profile.login_required_desc')}
            </p>
            <button
              onClick={onLoginTrigger}
              className="foodio-btn foodio-btn-primary mt-2 w-full font-mono text-xs uppercase tracking-widest cursor-pointer"
            >
              {t('profile.login_now')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine available tabs
  const isOwner = user.role === 'Owner';
  const isAdmin = user.role === 'Admin';

  const sessionUserPosts = sessionCommunityPosts.filter((post) =>
    post.author === user.username ||
    post.handle === `@${user.username}` ||
    (user.restaurantId && (post.restaurantId === user.restaurantId || post.handle === `@${user.restaurantId}`))
  );
  const postsCount = remotePostIds.size + sessionUserPosts.filter((post) => !remotePostIds.has(post.id)).length;
  const defaultAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.username) + "&background=1a1a1a&color=ffffff&size=128";

  return (
    <div className="foodio-page w-full min-h-[calc(100vh-72px)] pb-32 text-[#2c211b]">
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14 flex flex-col gap-8">
        
        {/* Navigation Tabs if User has Admin/Owner roles */}
        {(isAdmin || isOwner) && (
          <div className="flex flex-wrap gap-3 font-mono text-xs uppercase tracking-wider font-extrabold pb-4 border-b border-[#4b362a]/10 foodio-reveal">
            <button
              onClick={() => handleConsoleSelect('profile')}
              className={`px-5 py-3 border-2 transition-all cursor-pointer flex items-center gap-2 font-bold ${
                activeConsole === 'profile' 
                  ? 'bg-[#2c211b] text-white border-[#2c211b] shadow-[0_16px_30px_rgba(77,49,31,0.16)] rounded-full' 
                  : 'bg-[#fffaf4] text-[#2c211b] border-[#4b362a]/10 hover:bg-white shadow-[0_12px_30px_rgba(77,49,31,0.08)] active:scale-[0.98] rounded-full'
              }`}
            >
              <User size={15} className={activeConsole === 'profile' ? 'fill-current text-[#e2533b]' : 'text-[#1a1a1a]/60'} />
              <span>{t('profile.personal')}</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => handleConsoleSelect('admin')}
                className={`px-5 py-3 border-2 transition-all cursor-pointer flex items-center gap-2 font-bold ${
                  activeConsole === 'admin' 
                    ? 'bg-[#2c211b] text-white border-[#2c211b] shadow-[0_16px_30px_rgba(77,49,31,0.16)] rounded-full' 
                    : 'bg-[#fffaf4] text-[#2c211b] border-[#4b362a]/10 hover:bg-white shadow-[0_12px_30px_rgba(77,49,31,0.08)] active:scale-[0.98] rounded-full'
                }`}
              >
                {hasDashboardPass ? (
                  <Shield size={15} className={activeConsole === 'admin' ? 'fill-current text-[#e2533b]' : 'text-[#1a1a1a]/60'} />
                ) : (
                  <LockKeyhole size={15} className={activeConsole === 'admin' ? 'fill-current text-[#e2533b]' : 'text-[#1a1a1a]/60'} />
                )}
                <span>{t('profile.admin_console')}</span>
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => handleConsoleSelect('owner')}
                className={`px-5 py-3 border-2 transition-all cursor-pointer flex items-center gap-2 font-bold ${
                  activeConsole === 'owner' 
                    ? 'bg-[#2c211b] text-white border-[#2c211b] shadow-[0_16px_30px_rgba(77,49,31,0.16)] rounded-full' 
                    : 'bg-[#fffaf4] text-[#2c211b] border-[#4b362a]/10 hover:bg-white shadow-[0_12px_30px_rgba(77,49,31,0.08)] active:scale-[0.98] rounded-full'
                }`}
              >
                {hasDashboardPass ? (
                  <Store size={15} className={activeConsole === 'owner' ? 'fill-current text-[#e2533b]' : 'text-[#1a1a1a]/60'} />
                ) : (
                  <LockKeyhole size={15} className={activeConsole === 'owner' ? 'fill-current text-[#e2533b]' : 'text-[#1a1a1a]/60'} />
                )}
                <span>{t('profile.owner_console')}</span>
              </button>
            )}
          </div>
        )}

        {/* Tab 1: Profile View */}
        {activeConsole === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full foodio-reveal">
            
            {/* Left column - Avatar & Stats */}
            <div className="md:col-span-5 flex flex-col gap-6">
              
              {/* User Card Segment */}
              <div className="bg-[#fffaf4]/92 border border-white/70 rounded-[2rem] p-6 shadow-[0_24px_70px_rgba(77,49,31,0.14)] text-center flex flex-col items-center gap-4 relative overflow-hidden">
                
                {/* Avatar Display with Edit overlay */}
                <div className="relative group">
                  <div className="w-28 h-28 rounded-[2rem] overflow-hidden border border-white/70 shadow-[0_18px_46px_rgba(77,49,31,0.14)] bg-[#f5eadf]">
                    <img 
                      src={user.avatar || defaultAvatar} 
                      alt="Profile Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button 
                    onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                    className="absolute -bottom-1 -right-1 bg-[#2c211b] hover:bg-[#8f4f3b] text-white p-2 border border-white/60 cursor-pointer transition-all rounded-full shadow active:scale-95"
                    title={t('profile.change_avatar')}
                  >
                    <Edit2 size={12} />
                  </button>
                </div>

                <div>
                  <h2 className="font-serif font-bold text-3xl tracking-[-0.055em] text-[#2c211b]">{user.username}</h2>
                  <p className="font-mono text-[10px] uppercase text-[#6f655b] font-bold tracking-wider mt-1">{user.email}</p>
                </div>

                <div className="flex gap-1.5 items-center bg-[#b76548] text-white px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider select-none shadow">
                  <BadgeCheck size={14} className="fill-white text-[#e2533b]" />
                  <span>{user.role} {t('profile.member_suffix')}</span>
                </div>
              </div>

              {/* Avatar Selector Panel */}
              {isEditingAvatar && (
                <div className="bg-[#fffaf4] border border-white/70 p-4 shadow-[0_18px_46px_rgba(77,49,31,0.12)] flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200 rounded-[1.5rem]">
                  <h3 className="font-mono text-xs uppercase font-extrabold tracking-wider border-b border-[#1a1a1a]/15 pb-2 text-[#e2533b]">
                    {t('profile.change_avatar')}
                  </h3>

                  {/* Preset list */}
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-[9px] text-[#1a1a1a]/60 uppercase tracking-wider font-extrabold">
                      {t('profile.preset_avatars')}
                    </span>
                    <div className="grid grid-cols-6 gap-2">
                      {AVATAR_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedAvatarUrl(preset)}
                          className={`w-10 h-10 border-2 overflow-hidden transition-all cursor-pointer ${
                            selectedAvatarUrl === preset 
                              ? 'border-[#e2533b] scale-110 shadow-sm' 
                              : 'border-[#1a1a1a]/30 hover:border-[#e2533b]'
                          }`}
                        >
                          <img src={preset} alt="preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                   {/* Custom File Upload Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] text-[#1a1a1a]/60 uppercase tracking-wider font-extrabold">
                      Ảnh đại diện từ thiết bị
                    </label>
                    <button
                      type="button"
                      onClick={() => avatarFileRef.current?.click()}
                      className="w-full py-2 bg-white text-[#1a1a1a] hover:bg-[#f9f7f2] border-2 border-dashed border-[#1a1a1a]/40 hover:border-[#e2533b] hover:text-[#e2533b] font-mono text-xs font-bold uppercase transition-all cursor-pointer text-center"
                    >
                      Chọn file ảnh từ thiết bị
                    </button>
                    <input
                      ref={avatarFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileUpload}
                    />
                    {selectedAvatarUrl && selectedAvatarUrl.startsWith('data:') && (
                      <span className="text-[10px] text-green-600 font-mono font-bold mt-1 text-center">✓ Đã chọn ảnh từ máy</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end font-mono text-[9px] uppercase font-extrabold tracking-wider">
                    <button
                      onClick={() => setIsEditingAvatar(false)}
                      className="px-3 py-2 border-2 border-[#1a1a1a] hover:bg-[#f9f7f2] cursor-pointer bg-white transition-colors"
                    >
                      {t('profile.cancel')}
                    </button>
                    <button
                      onClick={handleSaveAvatar}
                      disabled={isSavingAvatar}
                      className="px-4 py-2 bg-[#1a1a1a] text-white hover:bg-[#e2533b] border-2 border-[#1a1a1a] cursor-pointer transition-colors"
                    >
                      {isSavingAvatar ? t('profile.saving') : t('profile.save')}
                    </button>
                  </div>
                </div>
              )}

              {/* Counts indicators bento grid */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-[#fffaf4] p-5 rounded-[1.5rem] border border-white/70 flex flex-col gap-1 items-center shadow-[0_18px_46px_rgba(77,49,31,0.1)]">
                  <FileText size={20} className="text-[#e2533b]" />
                  <span className="font-serif italic font-bold text-2xl text-[#1a1a1a]">{postsCount}</span>
                  <span className="font-mono text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider font-extrabold">{t('profile.posts_count')}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSavedPlaces((current) => !current)}
                  aria-expanded={showSavedPlaces}
                  className="bg-[#fffaf4] p-5 rounded-[1.5rem] border border-white/70 flex flex-col gap-1 items-center shadow-[0_18px_46px_rgba(77,49,31,0.1)] cursor-pointer transition-all hover:-translate-y-0.5 hover:bg-white"
                >
                  <Bookmark size={20} className={savedRestaurants.length > 0 ? 'fill-[#e2533b] text-[#e2533b]' : 'text-[#e2533b]'} />
                  <span className="font-serif italic font-bold text-2xl text-[#1a1a1a]">{savedRestaurants.length}</span>
                  <span className="font-mono text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider font-extrabold">{t('profile.saved_places')}</span>
                </button>
              </div>

              {showSavedPlaces && (
                <div className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-[#fffaf4] shadow-[0_18px_46px_rgba(77,49,31,0.1)] foodio-reveal">
                  <div className="flex items-center justify-between border-b border-[#4b362a]/10 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Bookmark size={15} className="text-[#e2533b]" />
                      <h3 className="font-mono text-[10px] font-black uppercase tracking-wider text-[#2c211b]">
                        {t('profile.saved_places')}
                      </h3>
                    </div>
                    <span className="rounded-full bg-[#2c211b] px-2 py-0.5 font-mono text-[9px] font-bold text-white">
                      {savedRestaurants.length}
                    </span>
                  </div>

                  {savedRestaurants.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <Bookmark size={24} className="mx-auto mb-2 text-[#b76548]/60" />
                      <p className="font-sans text-xs leading-relaxed text-[#6f655b]">
                        {t('profile.no_saved_places', 'Bạn chưa lưu quán nào. Hãy mở một quán và bấm biểu tượng bookmark.')}
                      </p>
                    </div>
                  ) : (
                    <div className="flex max-h-[360px] flex-col overflow-y-auto p-2">
                      {savedRestaurants.map((restaurant) => (
                        <button
                          key={restaurant.id}
                          type="button"
                          onClick={() => onSelectSavedRestaurant?.(restaurant.id)}
                          className="group flex w-full items-center gap-3 rounded-[1rem] p-2 text-left transition-colors hover:bg-[#f5eadf] cursor-pointer"
                        >
                          <img
                            src={restaurant.image}
                            alt={restaurant.name}
                            className="h-14 w-14 shrink-0 rounded-xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-serif text-base font-bold tracking-[-0.03em] text-[#2c211b]">
                              {restaurant.name}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 truncate font-sans text-[10px] text-[#6f655b]">
                              <MapPin size={11} className="shrink-0 text-[#b76548]" />
                              {restaurant.address || restaurant.area}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#2c211b] px-2 py-1 text-white">
                            <Star size={10} className="fill-current" />
                            <span className="font-mono text-[9px] font-bold">{restaurant.rating}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Right column - Change Password & Language settings */}
            <div className="md:col-span-7 flex flex-col gap-6">
              
              {/* Language Settings Card */}
              <div className="relative z-[70] overflow-visible rounded-[1.5rem] border border-white/70 bg-[#fffaf4] shadow-[0_18px_46px_rgba(77,49,31,0.1)]">
                <div 
                  className="flex items-center justify-between gap-4 p-5 hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-[#1a1a1a]" />
                    <span className="font-mono text-xs text-[#1a1a1a] font-bold uppercase tracking-wider">{t('profile.app_language')}</span>
                  </div>
                  <div className="relative shrink-0" ref={languageMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsLanguageMenuOpen((open) => !open)}
                      disabled={isLoadingLanguage}
                      className="flex h-10 min-w-[104px] items-center justify-center gap-2 rounded-full border border-[#4b362a]/10 bg-white/74 px-3 text-xs font-bold text-[#2c211b] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white active:scale-[0.98] disabled:cursor-wait disabled:text-[#1a1a1a]/35"
                      aria-label={t('profile.app_language')}
                      aria-expanded={isLanguageMenuOpen}
                    >
                      <Globe size={15} className="text-[#b76548]" />
                      <span>{language.toUpperCase()}</span>
                      <ChevronDown size={13} className={`transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isLanguageMenuOpen && (
                      <div className="absolute right-0 top-[calc(100%+10px)] z-[120] w-72 overflow-hidden rounded-[1.35rem] border border-[#4b362a]/10 bg-[#fffaf4] shadow-[0_24px_70px_rgba(77,49,31,0.2)]">
                        <div className="flex items-center gap-2 border-b border-[#4b362a]/10 px-3 py-2.5">
                          <Search size={14} className="shrink-0 text-[#b76548]" />
                          <input
                            value={languageQuery}
                            onChange={(event) => setLanguageQuery(event.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#2c211b] outline-none placeholder:text-[#8d8074]"
                            placeholder="Search language..."
                            autoFocus
                          />
                        </div>

                        <div className="max-h-80 overflow-y-auto py-1 hide-scrollbar">
                          {filteredLanguages.map((item) => {
                            const isActive = item.code === language;

                            return (
                              <button
                                key={item.code}
                                type="button"
                                disabled={isLoadingLanguage}
                                onClick={() => void handleSelectLanguage(item.code)}
                                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors disabled:cursor-wait ${isActive ? 'bg-[#2c211b] text-[#fffaf4]' : 'text-[#2c211b] hover:bg-white'}`}
                              >
                                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-black uppercase ${isActive ? 'bg-[#fffaf4] text-[#2c211b]' : 'bg-[#f0e5d8] text-[#8f4f3b]'}`}>
                                  {item.code}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-bold">{item.nativeLabel}</span>
                                  <span className={`block truncate text-[10px] font-semibold ${isActive ? 'text-[#fffaf4]/70' : 'text-[#6f655b]'}`}>
                                    {item.label}
                                  </span>
                                </span>
                                {isActive && <Check size={15} className="shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Change Password Form Card */}
              {!isEditingPassword ? (
                <div 
                  onClick={() => setIsEditingPassword(true)}
                  className="bg-[#fffaf4] border border-white/70 p-5 cursor-pointer hover:bg-white transition-colors shadow-[0_18px_46px_rgba(77,49,31,0.1)] flex items-center justify-between rounded-[1.5rem]"
                >
                  <div className="flex items-center gap-3">
                    <Key size={18} className="text-[#1a1a1a]" />
                    <span className="font-mono text-xs text-[#1a1a1a] font-bold uppercase tracking-wider">
                      {t('profile.update_password')}
                    </span>
                  </div>
                  <ChevronRight size={16} />
                </div>
              ) : (
                <div className="bg-[#fffaf4] border border-white/70 p-6 shadow-[0_18px_46px_rgba(77,49,31,0.1)] flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200 rounded-[1.5rem]">
                  <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Key size={18} className="text-[#e2533b]" />
                      <h3 className="font-serif italic font-bold text-lg text-[#1a1a1a] uppercase">
                        {t('profile.update_password')}
                      </h3>
                    </div>
                    <button 
                      onClick={() => setIsEditingPassword(false)}
                      className="text-[#1a1a1a]/50 hover:text-[#1a1a1a] p-1 cursor-pointer transition-colors"
                      type="button"
                    >
                      <ChevronDown size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
                    {/* Current Password */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-[9px] text-[#1a1a1a]/60 uppercase tracking-wider font-extrabold">
                        {t('profile.current_password')}
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-3 py-2.5 pr-11 border-2 border-[#1a1a1a] font-mono text-xs focus:outline-none focus:border-[#e2533b] bg-white rounded-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword((current) => !current)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6f655b] hover:text-[#2c211b] cursor-pointer transition-colors"
                          aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                        >
                          {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-[9px] text-[#1a1a1a]/60 uppercase tracking-wider font-extrabold">
                        {t('profile.new_password')}
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2.5 pr-11 border-2 border-[#1a1a1a] font-mono text-xs focus:outline-none focus:border-[#e2533b] bg-white rounded-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((current) => !current)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6f655b] hover:text-[#2c211b] cursor-pointer transition-colors"
                          aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-[9px] text-[#1a1a1a]/60 uppercase tracking-wider font-extrabold">
                        {t('profile.confirm_new_password')}
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2.5 pr-11 border-2 border-[#1a1a1a] font-mono text-xs focus:outline-none focus:border-[#e2533b] bg-white rounded-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((current) => !current)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6f655b] hover:text-[#2c211b] cursor-pointer transition-colors"
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 font-mono text-[9px] uppercase font-extrabold tracking-wider mt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingPassword(false)}
                        className="px-4 py-2 border-2 border-[#1a1a1a] hover:bg-[#f9f7f2] cursor-pointer bg-white transition-colors flex-1"
                      >
                        {t('profile.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingPassword}
                        className="px-5 py-2.5 bg-[#1a1a1a] text-white hover:bg-[#e2533b] border-2 border-[#1a1a1a] cursor-pointer transition-colors flex-[2] shadow active:translate-y-0.5"
                      >
                        {isSavingPassword ? t('profile.saving') : t('profile.change_password_btn')}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Change display name card */}
              {!isEditingUsername ? (
                <button
                  type="button"
                  onClick={() => setIsEditingUsername(true)}
                  className="bg-[#fffaf4] border border-white/70 p-5 cursor-pointer hover:bg-white transition-colors shadow-[0_18px_46px_rgba(77,49,31,0.1)] flex items-center justify-between rounded-[1.5rem]"
                >
                  <span className="flex items-center gap-3">
                    <Edit2 size={18} className="text-[#1a1a1a]" />
                    <span className="font-mono text-xs text-[#1a1a1a] font-bold uppercase tracking-wider">
                      {t('profile.update_username')}
                    </span>
                  </span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <div className="bg-[#fffaf4] border border-white/70 p-6 shadow-[0_18px_46px_rgba(77,49,31,0.1)] flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200 rounded-[1.5rem]">
                  <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Edit2 size={18} className="text-[#e2533b]" />
                      <h3 className="font-serif italic font-bold text-lg text-[#1a1a1a] uppercase">
                        {t('profile.update_username')}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUsernameValue(user?.username || '');
                        setIsEditingUsername(false);
                      }}
                      className="text-[#1a1a1a]/50 hover:text-[#1a1a1a] p-1 cursor-pointer transition-colors"
                    >
                      <ChevronDown size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateUsername} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-[9px] text-[#1a1a1a]/60 uppercase tracking-wider font-extrabold">
                        {t('profile.new_username')}
                      </label>
                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={100}
                        value={usernameValue}
                        onChange={(event) => setUsernameValue(event.target.value)}
                        className="w-full px-3 py-2.5 border-2 border-[#1a1a1a] font-mono text-xs focus:outline-none focus:border-[#e2533b] bg-white rounded-none"
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-2 font-mono text-[9px] uppercase font-extrabold tracking-wider mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUsernameValue(user?.username || '');
                          setIsEditingUsername(false);
                        }}
                        className="px-4 py-2 border-2 border-[#1a1a1a] hover:bg-[#f9f7f2] cursor-pointer bg-white transition-colors flex-1"
                      >
                        {t('profile.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingUsername || usernameValue.trim() === user?.username}
                        className="px-5 py-2.5 bg-[#1a1a1a] text-white hover:bg-[#e2533b] disabled:bg-[#1a1a1a]/40 border-2 border-[#1a1a1a] cursor-pointer disabled:cursor-not-allowed transition-colors flex-[2] shadow active:translate-y-0.5"
                      >
                        {isSavingUsername ? t('profile.saving') : t('profile.save_username')}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Logout button */}
              <button
                onClick={logout}
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 py-3.5 border border-red-200 font-mono text-xs uppercase tracking-widest transition-all cursor-pointer shadow-[0_18px_46px_rgba(127,29,29,0.08)] active:scale-[0.98] flex items-center justify-center gap-2 font-bold rounded-full"
              >
                <LogOut size={16} />
                {t('profile.logout')}
              </button>

            </div>

          </div>
        )}

        {/* Tab 2: Admin Dashboard Console */}
        {activeConsole === 'admin' && isAdmin && (
          hasDashboardPass ? (
            <div className="animate-in fade-in duration-300">
              <Suspense fallback={<LoadingSpinner />}>
                <AdminDashboard onRestaurantUpdated={onRestaurantUpdated} onRefreshRestaurants={onRefreshRestaurants} />
              </Suspense>
            </div>
          ) : renderDashboardLock(t('profile.admin_console'))
        )}

        {/* Tab 3: Owner Dashboard Console */}
        {activeConsole === 'owner' && isOwner && (
          hasDashboardPass ? (
            <div className="animate-in fade-in duration-300">
              <Suspense fallback={<LoadingSpinner />}>
                <OwnerDashboard onRestaurantUpdated={onRestaurantUpdated} />
              </Suspense>
            </div>
          ) : renderDashboardLock(t('profile.owner_console'))
        )}

      </div>

      {/* Dynamic Toast Status indicators */}
      {showStatus && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#2c211b] text-white px-5 py-3 rounded-full text-xs font-mono tracking-wide shadow-[0_18px_46px_rgba(77,49,31,0.22)] z-[100] border border-white/10 animate-in fade-in slide-in-from-bottom-3 select-none">
          {showStatus}
        </div>
      )}

    </div>
  );
}
