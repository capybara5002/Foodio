import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/Admin/AdminDashboard';
import OwnerDashboard from '../components/Owner/OwnerDashboard';

import { Restaurant } from '../types';

interface PageProfileProps {
  userEmail: string;
  onLoginTrigger: () => void;
  onRestaurantUpdated?: (updated: Restaurant) => void;
}

export default function PageProfile({ onLoginTrigger, onRestaurantUpdated }: PageProfileProps) {
  const { user, logout } = useAuth();
  const [appLanguage, setAppLanguage] = useState<'vi' | 'en'>('vi');
  const [showStatus, setShowStatus] = useState<string | null>(null);
  const [postsCount, setPostsCount] = useState<number>(0);
  
  // Tab control: profile, admin (if admin), owner (if owner)
  const [activeConsole, setActiveConsole] = useState<'profile' | 'admin' | 'owner'>('profile');

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

  const handleToggleLanguage = () => {
    const nextLang = appLanguage === 'en' ? 'vi' : 'en';
    setAppLanguage(nextLang);
    setShowStatus(`🌐 Changed app language to ${nextLang === 'vi' ? 'Tiếng Việt' : 'English'}`);
    setTimeout(() => setShowStatus(null), 2000);
  };

  // 1. If not logged in at all or is guest session, show a beautiful login card
  if (!user || user.role === 'Guest') {
    return (
      <div className="w-full min-h-[calc(100vh-72px)] bg-[#fdfcf9] pb-24 text-[#1a1a1a]">
        <div className="max-w-md mx-auto px-4 py-16 flex flex-col gap-6 text-center animate-in fade-in duration-300">
          <div className="bg-white border-2 border-[#1a1a1a] p-8 shadow-[6px_6px_0px_0px_#1a1a1a] flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-5xl text-[#e2533b]">account_circle</span>
            <h2 className="font-serif italic font-bold text-2xl uppercase">Yêu cầu Đăng nhập</h2>
            <p className="text-xs text-[#1a1a1a]/60 leading-relaxed max-w-xs">
              Vui lòng đăng nhập tài khoản của bạn để xem thông tin cá nhân hoặc truy cập các công cụ quản trị/chủ quán.
            </p>
            <button
              onClick={onLoginTrigger}
              className="mt-2 w-full bg-[#1a1a1a] text-white hover:bg-[#e2533b] py-3.5 border-2 border-[#1a1a1a] font-mono text-xs uppercase tracking-widest transition-all cursor-pointer shadow active:translate-y-0.5"
            >
              Đăng nhập ngay // 🔑
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine available tabs
  const isOwner = user.role === 'Owner';
  const isAdmin = user.role === 'Admin';

  return (
    <div className="w-full min-h-[calc(100vh-72px)] bg-[#fdfcf9] pb-24 text-[#1a1a1a]">
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
        
        {/* Navigation Tabs if User has Admin/Owner roles */}
        {(isAdmin || isOwner) && (
          <div className="flex border-b-2 border-[#1a1a1a] gap-2 font-mono text-[10px] uppercase tracking-wider font-extrabold pb-0.5">
            <button
              onClick={() => setActiveConsole('profile')}
              className={`px-4 py-2 border-t-2 border-x-2 border-transparent transition-all cursor-pointer ${
                activeConsole === 'profile' 
                  ? 'bg-white border-[#1a1a1a] text-[#e2533b] relative top-[2px] font-black' 
                  : 'text-[#1a1a1a]/60 hover:text-[#1a1a1a]'
              }`}
            >
              👤 Cá nhân
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveConsole('admin')}
                className={`px-4 py-2 border-t-2 border-x-2 border-transparent transition-all cursor-pointer ${
                  activeConsole === 'admin' 
                    ? 'bg-white border-[#1a1a1a] text-[#e2533b] relative top-[2px] font-black' 
                    : 'text-[#1a1a1a]/60 hover:text-[#1a1a1a]'
                }`}
              >
                🛡️ Admin Console
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => setActiveConsole('owner')}
                className={`px-4 py-2 border-t-2 border-x-2 border-transparent transition-all cursor-pointer ${
                  activeConsole === 'owner' 
                    ? 'bg-white border-[#1a1a1a] text-[#e2533b] relative top-[2px] font-black' 
                    : 'text-[#1a1a1a]/60 hover:text-[#1a1a1a]'
                }`}
              >
                🏪 Quản lý Quán
              </button>
            )}
          </div>
        )}

        {/* Tab 1: Profile View */}
        {activeConsole === 'profile' && (
          <div className="max-w-md mx-auto w-full flex flex-col gap-6 animate-in fade-in duration-300">
            {/* User Card Segment */}
            <div className="bg-white border-2 border-[#1a1a1a] rounded-none p-6 shadow-md text-center flex flex-col items-center gap-4">
              
              {/* Avatar Ring */}
              <div className="w-20 h-20 rounded-none overflow-hidden border-2 border-[#1a1a1a] shadow-sm bg-[#f9f7f2]">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRKZRdFtQr7QINgok2cIIj_I4mo7HJMI7i5ywrSs9Z-FpldNZJam-o0Inzqk-l4q9x7dEjZCSdbxyBG9GTzUHdlbB2drKAOGcd6-cTW4zsrmvKvckSZ_1jZyK1kaIqAl8k8O49SYBJO_04AYp1RJCKM-MbF7mPfP2ft_oHP4dPdDBwslbmjGzpvcU0A5pEyWXm837Es0Z7AgcbTvM2zx2gftDZiniFueWJf8phqDltfzBrhQiLeouhVErO1tWNv5-n1WvtpIAvlw" 
                  alt="Profile Avatar" 
                  className="w-full h-full object-cover grayscale"
                />
              </div>

              <div>
                <h2 className="font-serif italic font-bold text-xl text-[#1a1a1a] uppercase">{user.username}</h2>
                <p className="font-mono text-[10px] uppercase text-[#1a1a1a]/50 font-bold tracking-wider mt-1">{user.email}</p>
              </div>

              <div className="flex gap-1.5 items-center bg-[#e2533b] text-white px-3 py-1 rounded-none text-[10px] font-mono uppercase tracking-wider select-none shadow">
                <span className="material-symbols-outlined text-[14px] filled">verified</span>
                <span>{user.role} Member</span>
              </div>
            </div>

            {/* Counts indicators bento grid */}
            <div className="grid grid-cols-2 gap-3.5 text-center">
              <div className="bg-white p-4 rounded-none border-2 border-[#1a1a1a] flex flex-col gap-1 items-center shadow">
                <span className="material-symbols-outlined text-[#e2533b] text-xl">reviews</span>
                <span className="font-serif italic font-bold text-2xl text-[#1a1a1a]">{postsCount}</span>
                <span className="font-mono text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider font-extrabold">Posts Published</span>
              </div>

              <div className="bg-white p-4 rounded-none border-2 border-[#1a1a1a] flex flex-col gap-1 items-center shadow">
                <span className="material-symbols-outlined text-[#e2533b] text-xl font-bold">star</span>
                <span className="font-serif italic font-bold text-2xl text-[#1a1a1a]">5</span>
                <span className="font-mono text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider font-extrabold">Saved Places</span>
              </div>
            </div>

            {/* Profile Settings and details link lists */}
            <div className="bg-white border-2 border-[#1a1a1a] rounded-none overflow-hidden divide-y divide-[#1a1a1a]/15 shadow-md">
              
              <div 
                onClick={handleToggleLanguage}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#f9f7f2] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#1a1a1a] text-lg">language</span>
                  <span className="font-mono text-xs text-[#1a1a1a] font-bold uppercase tracking-wider">App Language</span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#e2533b]">
                  {appLanguage === 'vi' ? 'Tiếng Việt 🇻🇳' : 'English 🇺🇸'}
                </span>
              </div>

              <div 
                onClick={() => {
                  setShowStatus('🌙 Light theme is optimized for daylight outdoor snacking!');
                  setTimeout(() => setShowStatus(null), 2500);
                }}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#f9f7f2] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#1a1a1a] text-lg">dark_mode</span>
                  <span className="font-mono text-xs text-[#1a1a1a] font-bold uppercase tracking-wider">Active Theme</span>
                </div>
                <span className="text-[10px] font-mono text-[#1a1a1a]/45 uppercase font-bold tracking-wider">Light Default</span>
              </div>

              {/* Logout Action row */}
              <div 
                onClick={logout}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-red-50 text-red-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">logout</span>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">Đăng xuất tài khoản</span>
                </div>
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </div>
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
