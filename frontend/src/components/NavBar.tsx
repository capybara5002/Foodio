/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Search, X, SlidersHorizontal, Map, Compass, PlusCircle, Mail, User } from 'lucide-react';

interface NavBarProps {
  currentTab: 'map' | 'discover' | 'create' | 'inbox' | 'profile';
  onChangeTab: (tab: 'map' | 'discover' | 'create' | 'inbox' | 'profile') => void;
  unreadInboxCount: number;
  searchText: string;
  onSearchChange: (text: string) => void;
}

export default function NavBar({ currentTab, onChangeTab, unreadInboxCount, searchText, onSearchChange }: NavBarProps) {
  const [showSearchInput, setShowSearchInput] = useState(false);

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
            className={`cursor-pointer pb-1 border-b-2 transition-all duration-150 flex items-center gap-1.5 ${currentTab === 'map' ? 'border-[#e2533b] text-[#e2533b]' : 'border-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a]'}`}
          >
            <Map size={14} className={currentTab === 'map' ? 'fill-current' : ''} /> Food Map
          </button>
          <button 
            type="button"
            onClick={() => onChangeTab('discover')}
            className={`cursor-pointer pb-1 border-b-2 transition-all duration-150 flex items-center gap-1.5 ${currentTab === 'discover' ? 'border-[#e2533b] text-[#e2533b]' : 'border-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a]'}`}
          >
            <Compass size={14} className={currentTab === 'discover' ? 'fill-current' : ''} /> Discover
          </button>
          <button 
            type="button"
            onClick={() => onChangeTab('create')}
            className={`cursor-pointer pb-1 border-b-2 transition-all duration-150 flex items-center gap-1.5 ${currentTab === 'create' ? 'border-[#e2533b] text-[#e2533b]' : 'border-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a]'}`}
          >
            <PlusCircle size={14} className={currentTab === 'create' ? 'fill-current' : ''} /> Review
          </button>
          <button 
            type="button"
            onClick={() => onChangeTab('inbox')}
            className={`cursor-pointer pb-1 border-b-2 transition-all duration-150 relative flex items-center gap-1.5 ${currentTab === 'inbox' ? 'border-[#e2533b] text-[#e2533b]' : 'border-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a]'}`}
          >
            <Mail size={14} className={currentTab === 'inbox' ? 'fill-current' : ''} /> Inbox
            {unreadInboxCount > 0 && (
              <span className="absolute -top-2.5 -right-4 bg-[#e2533b] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-[#fdfcf9] shadow-xs">
                {unreadInboxCount}
              </span>
            )}
          </button>
          <button 
            type="button"
            onClick={() => onChangeTab('profile')}
            className={`cursor-pointer pb-1 border-b-2 transition-all duration-150 flex items-center gap-1.5 ${currentTab === 'profile' ? 'border-[#e2533b] text-[#e2533b]' : 'border-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a]'}`}
          >
            <User size={14} className={currentTab === 'profile' ? 'fill-current' : ''} /> Profile
          </button>
        </div>

        {/* Right Search & Filter Action Bar */}
        <div className="flex items-center gap-2">
          {showSearchInput ? (
            <div className="flex items-center border-2 border-[#1a1a1a] bg-white px-2 py-1 shadow-[2px_2px_0px_0px_#1a1a1a] transition-all duration-200">
              <Search size={14} className="text-[#1a1a1a]/60 mr-1" />
              <input 
                type="text" 
                value={searchText} 
                onChange={(e) => onSearchChange(e.target.value)} 
                placeholder="Tìm món ăn, địa điểm..." 
                className="text-xs font-mono bg-transparent outline-none w-36 sm:w-56"
                autoFocus
              />
              <button 
                onClick={() => {
                  onSearchChange('');
                  setShowSearchInput(false);
                }}
                className="hover:text-[#e2533b] cursor-pointer ml-1 select-none font-bold"
              >
                <X size={14} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowSearchInput(true)}
              aria-label="Search food locations"
              className="text-[#e2533b] hover:bg-[#1a1a1a]/5 transition-colors p-2 rounded-full flex items-center justify-center cursor-pointer"
            >
              <Search size={20} className="font-semibold" />
            </button>
          )}

          <button 
            onClick={() => setShowSearchInput(!showSearchInput)}
            aria-label="Filter category types"
            className="text-[#e2533b] hover:bg-[#1a1a1a]/5 transition-colors p-2 rounded-full flex items-center justify-center cursor-pointer"
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>
      </header>

      {/* Bottom Layout Menu Tab Navigation (Mobile only, visible on < md breakpoint, centered on full width) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-[#fdfcf9] border-t border-[#1a1a1a]/10 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex justify-around items-center h-16 md:hidden pb-safe">
        
        {/* Map Tab */}
        <button 
          onClick={() => onChangeTab('map')}
          className={`flex flex-col items-center justify-center py-1 flex-1 relative cursor-pointer group`}
        >
          {currentTab === 'map' ? (
            <div className="bg-[#e2533b] text-white rounded px-4 py-1 flex items-center justify-center shadow-md select-none">
              <Map size={18} className="fill-current" />
            </div>
          ) : (
            <div className="p-1 rounded text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5 transition-colors duration-150 select-none">
              <Map size={18} />
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
              <Compass size={18} className="fill-current" />
            </div>
          ) : (
            <div className="p-1 rounded text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5 transition-colors duration-150 select-none">
              <Compass size={18} />
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
              <PlusCircle size={18} className="fill-current" />
            </div>
          ) : (
            <div className="p-1 rounded text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5 transition-colors duration-150 select-none">
              <PlusCircle size={18} />
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
              <Mail size={18} className="fill-current" />
            </div>
          ) : (
            <div className="p-1 rounded text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5 transition-colors duration-150 relative select-none">
              <Mail size={18} />
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
              <User size={18} className="fill-current" />
            </div>
          ) : (
            <div className="p-1 rounded text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5 transition-colors duration-150 select-none">
              <User size={18} />
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
