/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';

interface NavBarProps {
  currentTab: 'map' | 'discover' | 'create' | 'inbox' | 'profile';
  onChangeTab: (tab: 'map' | 'discover' | 'create' | 'inbox' | 'profile') => void;
  unreadInboxCount: number;
}

export default function NavBar({ currentTab, onChangeTab, unreadInboxCount }: NavBarProps) {
  const [showSearchAlert, setShowSearchAlert] = useState(false);

  const handleSearchClick = () => {
    setShowSearchAlert(true);
    setTimeout(() => {
      setShowSearchAlert(false);
    }, 2500);
  };

  return (
    <>
      {/* Top Header App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#fdfcf9] border-b border-[#1a1a1a]/10 flex justify-between items-center px-4 md:px-12 py-2 h-[72px]">
        
        {/* Left Search/Logo section */}
        <div 
          onClick={() => onChangeTab('map')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-8 h-8 bg-[#1a1a1a] rounded-sm flex items-center justify-center text-white font-serif italic text-lg shadow-sm transition-transform group-hover:rotate-12 duration-200">
            C
          </div>
          <span className="text-[10px] tracking-[0.35em] font-extrabold uppercase hidden sm:inline-block text-[#1a1a1a] font-sans">
            CRAVEMAP // ARCHIVE
          </span>
          <span className="text-xs tracking-widest font-extrabold uppercase sm:hidden text-[#1a1a1a] font-sans">
            CRAVEMAP
          </span>
        </div>

        {/* Center navigation links for Tablet and Desktop */}
        <div className="hidden md:flex items-center gap-8 text-[10px] tracking-[0.25em] font-extrabold uppercase select-none font-sans">
          <button 
            type="button"
            onClick={() => onChangeTab('map')}
            className={`cursor-pointer pb-1 border-b-2 transition-all duration-150 ${currentTab === 'map' ? 'border-[#e2533b] text-[#e2533b]' : 'border-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a]'}`}
          >
            🗺️ Food Map
          </button>
          <button 
            type="button"
            onClick={() => onChangeTab('discover')}
            className={`cursor-pointer pb-1 border-b-2 transition-all duration-150 ${currentTab === 'discover' ? 'border-[#e2533b] text-[#e2533b]' : 'border-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a]'}`}
          >
            🔊 Discover
          </button>
          <button 
            type="button"
            onClick={() => onChangeTab('create')}
            className={`cursor-pointer pb-1 border-b-2 transition-all duration-150 ${currentTab === 'create' ? 'border-[#e2533b] text-[#e2533b]' : 'border-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a]'}`}
          >
            ✍️ Review
          </button>
          <button 
            type="button"
            onClick={() => onChangeTab('inbox')}
            className={`cursor-pointer pb-1 border-b-2 transition-all duration-150 relative ${currentTab === 'inbox' ? 'border-[#e2533b] text-[#e2533b]' : 'border-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a]'}`}
          >
            💬 Inbox
            {unreadInboxCount > 0 && (
              <span className="absolute -top-2.5 -right-4 bg-[#e2533b] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-[#fdfcf9] shadow-xs">
                {unreadInboxCount}
              </span>
            )}
          </button>
          <button 
            type="button"
            onClick={() => onChangeTab('profile')}
            className={`cursor-pointer pb-1 border-b-2 transition-all duration-150 ${currentTab === 'profile' ? 'border-[#e2533b] text-[#e2533b]' : 'border-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a]'}`}
          >
            👤 Profile
          </button>
        </div>

        {/* Right Search & Filter Action Bar */}
        <div className="flex items-center gap-1">
          <button 
            onClick={handleSearchClick}
            aria-label="Search food locations"
            className="text-[#e2533b] hover:bg-[#1a1a1a]/5 transition-colors p-2 rounded-full flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined font-semibold select-none text-xl">search</span>
          </button>

          <button 
            onClick={handleSearchClick}
            aria-label="Filter category types"
            className="text-[#e2533b] hover:bg-[#1a1a1a]/5 transition-colors p-2 rounded-full flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined select-none text-xl">tune</span>
          </button>
        </div>
      </header>

      {/* Floating search status alert overlay */}
      {showSearchAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase border border-[#e2533b]/20 shadow-xl z-[100] animate-in fade-in slide-in-from-top-4">
          🔍 Enter snack name or street to search Vinh Khanh...
        </div>
      )}

      {/* Bottom Layout Menu Tab Navigation (Mobile only, visible on < md breakpoint, centered on full width) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-[#fdfcf9] border-t border-[#1a1a1a]/10 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex justify-around items-center h-16 md:hidden pb-safe">
        
        {/* Map Tab */}
        <button 
          onClick={() => onChangeTab('map')}
          className={`flex flex-col items-center justify-center py-1 flex-1 relative cursor-pointer group`}
        >
          {currentTab === 'map' ? (
            <div className="bg-[#e2533b] text-white rounded px-4 py-1 flex items-center justify-center shadow-md select-none">
              <span className="material-symbols-outlined filled text-lg">map</span>
            </div>
          ) : (
            <div className="p-1 rounded text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5 transition-colors duration-150 select-none">
              <span className="material-symbols-outlined text-lg">map</span>
            </div>
          )}
          <span className={`font-label-sm text-[9px] uppercase tracking-wider mt-0.5 ${currentTab === 'map' ? 'font-black text-[#e2533b]' : 'text-[#1a1a1a]/60'}`}>
            Map
          </span>
        </button>

        {/* Discover Tab */}
        <button 
          onClick={() => onChangeTab('discover')}
          className={`flex flex-col items-center justify-center py-1 flex-1 relative cursor-pointer group`}
        >
          {currentTab === 'discover' ? (
            <div className="bg-[#e2533b] text-white rounded px-4 py-1 flex items-center justify-center shadow-md select-none">
              <span className="material-symbols-outlined filled text-lg">explore</span>
            </div>
          ) : (
            <div className="p-1 rounded text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5 transition-colors duration-150 select-none">
              <span className="material-symbols-outlined text-lg">explore</span>
            </div>
          )}
          <span className={`font-label-sm text-[9px] uppercase tracking-wider mt-0.5 ${currentTab === 'discover' ? 'font-black text-[#e2533b]' : 'text-[#1a1a1a]/60'}`}>
            Discover
          </span>
        </button>

        {/* Create Tab */}
        <button 
          onClick={() => onChangeTab('create')}
          className={`flex flex-col items-center justify-center py-1 flex-1 relative cursor-pointer group`}
        >
          {currentTab === 'create' ? (
            <div className="bg-[#e2533b] text-white rounded px-4 py-1 flex items-center justify-center shadow-md select-none">
              <span className="material-symbols-outlined filled text-lg">add_circle</span>
            </div>
          ) : (
            <div className="p-1 rounded text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5 transition-colors duration-150 select-none">
              <span className="material-symbols-outlined text-lg">add_circle</span>
            </div>
          )}
          <span className={`font-label-sm text-[9px] uppercase tracking-wider mt-0.5 ${currentTab === 'create' ? 'font-black text-[#e2533b]' : 'text-[#1a1a1a]/60'}`}>
            Create
          </span>
        </button>

        {/* Inbox Tab */}
        <button 
          onClick={() => onChangeTab('inbox')}
          className={`flex flex-col items-center justify-center py-1 flex-1 relative cursor-pointer group`}
        >
          {currentTab === 'inbox' ? (
            <div className="bg-[#e2533b] text-white rounded px-4 py-1 flex items-center justify-center shadow-md select-none">
              <span className="material-symbols-outlined filled text-lg">mail</span>
            </div>
          ) : (
            <div className="p-1 rounded text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5 transition-colors duration-150 relative select-none">
              <span className="material-symbols-outlined text-lg">mail</span>
              {unreadInboxCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#e2533b] rounded-full" />
              )}
            </div>
          )}
          <span className={`font-label-sm text-[9px] uppercase tracking-wider mt-0.5 ${currentTab === 'inbox' ? 'font-black text-[#e2533b]' : 'text-[#1a1a1a]/60'}`}>
            Inbox
          </span>
          {currentTab !== 'inbox' && unreadInboxCount > 0 && (
            <span className="absolute top-1.5 right-6 bg-[#e2533b] text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center shadow-xs pointer-events-none">
              {unreadInboxCount}
            </span>
          )}
        </button>

        {/* Profile Tab */}
        <button 
          onClick={() => onChangeTab('profile')}
          className={`flex flex-col items-center justify-center py-1 flex-1 relative cursor-pointer group`}
        >
          {currentTab === 'profile' ? (
            <div className="bg-[#e2533b] text-white rounded px-4 py-1 flex items-center justify-center shadow-md select-none">
              <span className="material-symbols-outlined filled text-lg">person</span>
            </div>
          ) : (
            <div className="p-1 rounded text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5 transition-colors duration-150 select-none">
              <span className="material-symbols-outlined text-lg">person</span>
            </div>
          )}
          <span className={`font-label-sm text-[9px] uppercase tracking-wider mt-0.5 ${currentTab === 'profile' ? 'font-black text-[#e2533b]' : 'text-[#1a1a1a]/60'}`}>
            Profile
          </span>
        </button>

      </nav>
    </>
  );
}
