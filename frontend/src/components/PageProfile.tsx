/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';

interface PageProfileProps {
  userEmail: string;
  totalPostsCount: number;
}

export default function PageProfile({ userEmail, totalPostsCount }: PageProfileProps) {
  const [appLanguage, setAppLanguage] = useState<'vi' | 'en'>('vi');
  const [showStatus, setShowStatus] = useState<string | null>(null);

  const handleToggleLanguage = () => {
    const nextLang = appLanguage === 'en' ? 'vi' : 'en';
    setAppLanguage(nextLang);
    setShowStatus(`🌐 Changed app language to ${nextLang === 'vi' ? 'Tiếng Việt' : 'English'}`);
    setTimeout(() => setShowStatus(null), 2000);
  };

  return (
    <div className="w-full min-h-[calc(100vh-72px)] bg-[#fdfcf9] pb-24 text-[#1a1a1a]">
      <div className="max-w-md mx-auto px-4 py-8 flex flex-col gap-6 animate-in fade-in duration-350">
        
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
            <h2 className="font-serif italic font-bold text-xl text-[#1a1a1a]">Son Hoang</h2>
            <p className="font-mono text-[10px] uppercase text-[#1a1a1a]/50 font-bold tracking-wider mt-1">{userEmail}</p>
          </div>

          <div className="flex gap-1.5 items-center bg-[#e2533b] text-white px-3 py-1 rounded-none text-[10px] font-mono uppercase tracking-wider select-none shadow">
            <span className="material-symbols-outlined text-[14px] filled">verified</span>
            <span>Level 4 Snail Master</span>
          </div>

        </div>

        {/* Counts indicators bento grid */}
        <div className="grid grid-cols-2 gap-3.5 text-center">
          <div className="bg-white p-4 rounded-none border-2 border-[#1a1a1a] flex flex-col gap-1 items-center shadow">
            <span className="material-symbols-outlined text-[#e2533b] text-xl">reviews</span>
            <span className="font-serif italic font-bold text-2xl text-[#1a1a1a]">{totalPostsCount}</span>
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

          <div 
            onClick={() => {
              setShowStatus('🎁 You have 1 street food snail voucher pending tonight!');
              setTimeout(() => setShowStatus(null), 2500);
            }}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#f9f7f2] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#1a1a1a] text-lg">confirmation_number</span>
              <span className="font-mono text-xs text-[#1a1a1a] font-bold uppercase tracking-wider">My Vouchers & Rewards</span>
            </div>
            <span className="bg-[#e2533b] text-white text-[9px] uppercase font-mono tracking-widest font-bold px-2.5 py-1 rounded-none shadow">
              1 Active
            </span>
          </div>

        </div>

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
