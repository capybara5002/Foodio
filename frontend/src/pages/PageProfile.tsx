import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/Admin/AdminDashboard';
import OwnerDashboard from '../components/Owner/OwnerDashboard';
import { Restaurant } from '../types';
import { UserCircle, BadgeCheck, FileText, Star, Globe, LogOut, User, Shield, Store, Edit2, Key, ChevronRight, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';

interface PageProfileProps {
  userEmail: string;
  onLoginTrigger: () => void;
  onRestaurantUpdated?: (updated: Restaurant) => void;
}

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150&auto=format&fit=crop&q=60", // Pizza
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150&auto=format&fit=crop&q=60", // Cafe
  "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=150&auto=format&fit=crop&q=60", // Sushi
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&auto=format&fit=crop&q=60", // Burger
  "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=150&auto=format&fit=crop&q=60", // Ramen
  "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=150&auto=format&fit=crop&q=60"  // Seafood/Snails
];

export default function PageProfile({ onLoginTrigger, onRestaurantUpdated }: PageProfileProps) {
  const { user, logout, updateAvatar, updatePassword } = useAuth();
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const [showStatus, setShowStatus] = useState<string | null>(null);
  const [postsCount, setPostsCount] = useState<number>(0);
  
  // Tab control: profile, admin (if admin), owner (if owner)
  const [activeConsole, setActiveConsole] = useState<'profile' | 'admin' | 'owner'>('profile');

  // Avatar edit states
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState('');
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  // Password update states
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setSelectedAvatarUrl(user.avatar || '');
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.role === 'Guest') return;
    
    const fetchPostsCount = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${baseUrl}/api/communityposts`);
        if (!response.ok) throw new Error("Failed to fetch posts count");
        const data = await response.json();
        const userPosts = data.filter((p: any) => p.author === user.username);
        setPostsCount(userPosts.length);
      } catch (error) {
        console.error("Failed to load user posts count in profile:", error);
      }
    };
    void fetchPostsCount();
  }, [user]);

  const handleToggleLanguage = async () => {
    const nextLang = language === 'en' ? 'vi' : 'en';
    await changeLanguage(nextLang);
    setShowStatus(nextLang === 'vi' ? '🌐 Đã chuyển ngôn ngữ sang Tiếng Việt' : `🌐 Changed app language to English`);
    setTimeout(() => setShowStatus(null), 2000);
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
      setIsEditingPassword(false);
    } catch (err: any) {
      console.error(err);
      setShowStatus(t('profile.update_password_error'));
    } finally {
      setIsSavingPassword(false);
      setTimeout(() => setShowStatus(null), 2500);
    }
  };

  // 1. If not logged in at all or is guest session, show a beautiful login card
  if (!user || user.role === 'Guest') {
    return (
      <div className="w-full min-h-[calc(100vh-72px)] bg-[#fdfcf9] pb-24 text-[#1a1a1a]">
        <div className="max-w-md mx-auto px-4 py-16 flex flex-col gap-6 text-center animate-in fade-in duration-300">
          <div className="bg-white border-2 border-[#1a1a1a] p-8 shadow-[6px_6px_0px_0px_#1a1a1a] flex flex-col items-center gap-4">
            <UserCircle size={48} className="text-[#e2533b]" />
            <h2 className="font-serif italic font-bold text-2xl uppercase">{t('profile.login_required')}</h2>
            <p className="text-xs text-[#1a1a1a]/60 leading-relaxed max-w-xs">
              {t('profile.login_required_desc')}
            </p>
            <button
              onClick={onLoginTrigger}
              className="mt-2 w-full bg-[#1a1a1a] text-white hover:bg-[#e2533b] py-3.5 border-2 border-[#1a1a1a] font-mono text-xs uppercase tracking-widest transition-all cursor-pointer shadow active:translate-y-0.5"
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

  const defaultAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.username) + "&background=1a1a1a&color=ffffff&size=128";

  return (
    <div className="w-full min-h-[calc(100vh-72px)] bg-[#fdfcf9] pb-24 text-[#1a1a1a]">
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
        
        {/* Navigation Tabs if User has Admin/Owner roles */}
        {(isAdmin || isOwner) && (
          <div className="flex flex-wrap gap-3 font-mono text-xs uppercase tracking-wider font-extrabold pb-3 border-b border-[#1a1a1a]/10">
            <button
              onClick={() => setActiveConsole('profile')}
              className={`px-5 py-3 border-2 transition-all cursor-pointer flex items-center gap-2 font-bold ${
                activeConsole === 'profile' 
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[3px_3px_0px_0px_#e2533b]' 
                  : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-[#f9f7f2] shadow-[3px_3px_0px_0px_#1a1a1a] active:translate-y-0.5 active:shadow-none'
              }`}
            >
              <User size={15} className={activeConsole === 'profile' ? 'fill-current text-[#e2533b]' : 'text-[#1a1a1a]/60'} />
              <span>{t('profile.personal')}</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveConsole('admin')}
                className={`px-5 py-3 border-2 transition-all cursor-pointer flex items-center gap-2 font-bold ${
                  activeConsole === 'admin' 
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[3px_3px_0px_0px_#e2533b]' 
                    : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-[#f9f7f2] shadow-[3px_3px_0px_0px_#1a1a1a] active:translate-y-0.5 active:shadow-none'
                }`}
              >
                <Shield size={15} className={activeConsole === 'admin' ? 'fill-current text-[#e2533b]' : 'text-[#1a1a1a]/60'} />
                <span>{t('profile.admin_console')}</span>
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => setActiveConsole('owner')}
                className={`px-5 py-3 border-2 transition-all cursor-pointer flex items-center gap-2 font-bold ${
                  activeConsole === 'owner' 
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[3px_3px_0px_0px_#e2533b]' 
                    : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-[#f9f7f2] shadow-[3px_3px_0px_0px_#1a1a1a] active:translate-y-0.5 active:shadow-none'
                }`}
              >
                <Store size={15} className={activeConsole === 'owner' ? 'fill-current text-[#e2533b]' : 'text-[#1a1a1a]/60'} />
                <span>{t('profile.owner_console')}</span>
              </button>
            )}
          </div>
        )}

        {/* Tab 1: Profile View */}
        {activeConsole === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full animate-in fade-in duration-300">
            
            {/* Left column - Avatar & Stats */}
            <div className="md:col-span-5 flex flex-col gap-6">
              
              {/* User Card Segment */}
              <div className="bg-white border-2 border-[#1a1a1a] rounded-none p-6 shadow-[4px_4px_0px_0px_#1a1a1a] text-center flex flex-col items-center gap-4 relative">
                
                {/* Avatar Display with Edit overlay */}
                <div className="relative group">
                  <div className="w-24 h-24 rounded-none overflow-hidden border-2 border-[#1a1a1a] shadow-sm bg-[#f9f7f2]">
                    <img 
                      src={user.avatar || defaultAvatar} 
                      alt="Profile Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button 
                    onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                    className="absolute -bottom-1 -right-1 bg-[#1a1a1a] hover:bg-[#e2533b] text-white p-2 border border-[#1a1a1a] cursor-pointer transition-colors shadow active:translate-y-0.5"
                    title={t('profile.change_avatar')}
                  >
                    <Edit2 size={12} />
                  </button>
                </div>

                <div>
                  <h2 className="font-serif italic font-bold text-xl text-[#1a1a1a] uppercase">{user.username}</h2>
                  <p className="font-mono text-[10px] uppercase text-[#1a1a1a]/50 font-bold tracking-wider mt-1">{user.email}</p>
                </div>

                <div className="flex gap-1.5 items-center bg-[#e2533b] text-white px-3 py-1 rounded-none text-[10px] font-mono uppercase tracking-wider select-none shadow">
                  <BadgeCheck size={14} className="fill-white text-[#e2533b]" />
                  <span>{user.role} {t('profile.member_suffix')}</span>
                </div>
              </div>

              {/* Avatar Selector Panel */}
              {isEditingAvatar && (
                <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[4px_4px_0px_0px_#1a1a1a] flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
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

                  {/* Custom URL Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] text-[#1a1a1a]/60 uppercase tracking-wider font-extrabold">
                      {t('profile.custom_avatar_url')}
                    </label>
                    <input
                      type="text"
                      value={selectedAvatarUrl}
                      onChange={(e) => setSelectedAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.png"
                      className="w-full px-3 py-2 border-2 border-[#1a1a1a] font-mono text-xs focus:outline-none focus:border-[#e2533b] bg-white rounded-none"
                    />
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
                <div className="bg-white p-4 rounded-none border-2 border-[#1a1a1a] flex flex-col gap-1 items-center shadow-[4px_4px_0px_0px_#1a1a1a]">
                  <FileText size={20} className="text-[#e2533b]" />
                  <span className="font-serif italic font-bold text-2xl text-[#1a1a1a]">{postsCount}</span>
                  <span className="font-mono text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider font-extrabold">{t('profile.posts_count')}</span>
                </div>

                <div className="bg-white p-4 rounded-none border-2 border-[#1a1a1a] flex flex-col gap-1 items-center shadow-[4px_4px_0px_0px_#1a1a1a]">
                  <Star size={20} className="fill-[#e2533b] text-[#e2533b]" />
                  <span className="font-serif italic font-bold text-2xl text-[#1a1a1a]">5</span>
                  <span className="font-mono text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider font-extrabold">{t('profile.saved_places')}</span>
                </div>
              </div>

            </div>

            {/* Right column - Change Password & Language settings */}
            <div className="md:col-span-7 flex flex-col gap-6">
              
              {/* Language Settings Card */}
              <div className="bg-white border-2 border-[#1a1a1a] rounded-none overflow-hidden shadow-[4px_4px_0px_0px_#1a1a1a]">
                <div 
                  onClick={handleToggleLanguage}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#f9f7f2] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-[#1a1a1a]" />
                    <span className="font-mono text-xs text-[#1a1a1a] font-bold uppercase tracking-wider">{t('profile.app_language')}</span>
                  </div>
                  <span className="text-[10px] font-mono font-extrabold uppercase text-[#e2533b]">
                    {language === 'vi' ? 'Tiếng Việt 🇻🇳' : 'English 🇺🇸'}
                  </span>
                </div>
              </div>

              {/* Change Password Form Card */}
              {!isEditingPassword ? (
                <div 
                  onClick={() => setIsEditingPassword(true)}
                  className="bg-white border-2 border-[#1a1a1a] p-4 cursor-pointer hover:bg-[#f9f7f2] transition-colors shadow-[4px_4px_0px_0px_#1a1a1a] flex items-center justify-between"
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
                <div className="bg-white border-2 border-[#1a1a1a] p-6 shadow-[4px_4px_0px_0px_#1a1a1a] flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
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
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2.5 border-2 border-[#1a1a1a] font-mono text-xs focus:outline-none focus:border-[#e2533b] bg-white rounded-none"
                      />
                    </div>

                    {/* New Password */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-[9px] text-[#1a1a1a]/60 uppercase tracking-wider font-extrabold">
                        {t('profile.new_password')}
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2.5 border-2 border-[#1a1a1a] font-mono text-xs focus:outline-none focus:border-[#e2533b] bg-white rounded-none"
                      />
                    </div>

                    {/* Confirm New Password */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-[9px] text-[#1a1a1a]/60 uppercase tracking-wider font-extrabold">
                        {t('profile.confirm_new_password')}
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2.5 border-2 border-[#1a1a1a] font-mono text-xs focus:outline-none focus:border-[#e2533b] bg-white rounded-none"
                      />
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

              {/* Logout button */}
              <button
                onClick={logout}
                className="w-full bg-[#fdfcf9] hover:bg-red-50 text-red-600 py-3.5 border-2 border-red-600 font-mono text-xs uppercase tracking-widest transition-all cursor-pointer shadow-[4px_4px_0px_0px_#dc2626] active:translate-y-0.5 flex items-center justify-center gap-2 font-bold"
              >
                <LogOut size={16} />
                {t('profile.logout')}
              </button>

            </div>

          </div>
        )}

        {/* Tab 2: Admin Dashboard Console */}
        {activeConsole === 'admin' && isAdmin && (
          <div className="animate-in fade-in duration-300">
            <AdminDashboard />
          </div>
        )}

        {/* Tab 3: Owner Dashboard Console */}
        {activeConsole === 'owner' && isOwner && (
          <div className="animate-in fade-in duration-300">
            <OwnerDashboard onRestaurantUpdated={onRestaurantUpdated} />
          </div>
        )}

      </div>

      {/* Dynamic Toast Status indicators */}
      {showStatus && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white px-5 py-3 rounded-none text-xs font-mono tracking-wide shadow-2xl z-[100] border border-white/10 animate-in fade-in slide-in-from-bottom-3 select-none">
          {showStatus}
        </div>
      )}

    </div>
  );
}
