/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Search, X, MapPin, Star, Map, Compass, Mail, User, Globe, Volume2 } from 'lucide-react';
import { Restaurant } from '../types';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';

interface NavBarProps {
  currentTab: 'map' | 'discover' | 'create' | 'inbox' | 'profile';
  onChangeTab: (tab: 'map' | 'discover' | 'create' | 'inbox' | 'profile') => void;
  unreadInboxCount: number;
  restaurants: Restaurant[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearchRestaurantSelect: (restaurantId: string) => void;
}

// Strip Vietnamese diacritics so searches like "oc", "Óc", and "Ốc" match the same restaurants.
const normalizeString = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd');

export default function NavBar({
  currentTab,
  onChangeTab,
  unreadInboxCount,
  restaurants,
  searchQuery,
  onSearchQueryChange,
  onSearchRestaurantSelect
}: NavBarProps) {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const normalizedSearchQuery = normalizeString(searchQuery.trim());
  const searchSuggestions = normalizedSearchQuery
    ? restaurants
        .filter((restaurant) => {
          const searchableText = normalizeString(
            `${restaurant.name} ${restaurant.category} ${restaurant.address} ${restaurant.area}`
          );
          return searchableText.includes(normalizedSearchQuery);
        })
        .slice(0, 8)
    : [];

  const showSearchSuggestions = currentTab === 'map' && isSearchFocused && normalizedSearchQuery.length > 0;

  return (
    <>
      {/* Top Header App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#fdfcf9] border-b border-[#1a1a1a]/10 flex justify-between items-center px-4 md:px-12 py-2 h-[72px]">
        
        {/* Left Search/Logo section */}
        <div 
          onClick={() => onChangeTab('map')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <svg viewBox="0 0 100 100" className="w-9 h-9 shrink-0 select-none transition-transform group-hover:scale-105 duration-200">
            {/* Background round square */}
            <rect width="100" height="100" rx="20" fill="#1a1a1a"/>
            
            {/* Sound waves left */}
            <path d="M 28 35 A 18 18 0 0 0 28 65" fill="none" stroke="#d49a6a" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M 21 28 A 28 28 0 0 0 21 72" fill="none" stroke="#d49a6a" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
            
            {/* Sound waves right */}
            <path d="M 72 35 A 18 18 0 0 1 72 65" fill="none" stroke="#d49a6a" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M 79 28 A 28 28 0 0 1 79 72" fill="none" stroke="#d49a6a" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
            
            {/* Microphone Capsule */}
            <rect x="42" y="24" width="16" height="26" rx="8" fill="#d49a6a"/>
            {/* Horizontal grilles */}
            <line x1="45" y1="30" x2="55" y2="30" stroke="#1a1a1a" strokeWidth="2" />
            <line x1="45" y1="36" x2="55" y2="36" stroke="#1a1a1a" strokeWidth="2" />
            <line x1="45" y1="42" x2="55" y2="42" stroke="#1a1a1a" strokeWidth="2" />
            
            {/* Stand base & ring */}
            <path d="M 36 37 A 14 14 0 0 0 64 37" fill="none" stroke="#d49a6a" strokeWidth="3.5" strokeLinecap="round"/>
            <line x1="50" y1="51" x2="50" y2="65" stroke="#d49a6a" strokeWidth="4" />
            <path d="M 38 66 L 62 66" stroke="#d49a6a" strokeWidth="4" strokeLinecap="round"/>
            
            {/* Fork & Knife crossing */}
            {/* Fork (Crossing from left-bottom to right-top) */}
            <g transform="translate(50, 50) rotate(-45) translate(-50, -50)">
              {/* Handle */}
              <line x1="50" y1="35" x2="50" y2="65" stroke="#d49a6a" strokeWidth="3.5" strokeLinecap="round"/>
              {/* Head */}
              <path d="M 46 32 C 46 25 54 25 54 32 Z" fill="#d49a6a"/>
              {/* Prongs */}
              <line x1="48" y1="28" x2="48" y2="33" stroke="#1a1a1a" strokeWidth="1"/>
              <line x1="50" y1="28" x2="50" y2="33" stroke="#1a1a1a" strokeWidth="1"/>
              <line x1="52" y1="28" x2="52" y2="33" stroke="#1a1a1a" strokeWidth="1"/>
            </g>
            
            {/* Knife (Crossing from right-bottom to left-top) */}
            <g transform="translate(50, 50) rotate(45) translate(-50, -50)">
              {/* Handle */}
              <line x1="50" y1="35" x2="50" y2="65" stroke="#d49a6a" strokeWidth="3.5" strokeLinecap="round"/>
              {/* Blade */}
              <path d="M 48 35 L 48 24 C 48 24 53 24 53 29 L 51 35 Z" fill="#d49a6a"/>
            </g>
          </svg>
          
          <span className="text-sm md:text-base tracking-[0.12em] font-black uppercase text-[#1a1a1a] font-sans flex items-center gap-[1px]">
            FOODI
            <span className="w-[14px] h-[14px] md:w-[17px] md:h-[17px] bg-[#1a1a1a] rounded-full flex items-center justify-center text-[#fdfcf9] shrink-0 translate-y-[-0.5px] ml-[2px]">
              <Volume2 className="w-[8px] h-[8px] md:w-[10px] md:h-[10px] fill-current text-white stroke-[3]" />
            </span>
          </span>
        </div>

        {/* Center navigation links for Tablet and Desktop */}
        <div className="hidden md:flex items-center gap-8 text-[10px] tracking-[0.25em] font-extrabold uppercase select-none font-sans">
          <button 
            type="button"
            onClick={() => onChangeTab('map')}
            className={`cursor-pointer pb-1 border-b-2 transition-all duration-150 flex items-center gap-1.5 ${currentTab === 'map' ? 'border-[#e2533b] text-[#e2533b]' : 'border-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a]'}`}
          >
            <Map size={14} className={currentTab === 'map' ? 'fill-current' : ''} /> {t('nav.food_map')}
          </button>
          <button 
            type="button"
            onClick={() => onChangeTab('discover')}
            className={`cursor-pointer pb-1 border-b-2 transition-all duration-150 flex items-center gap-1.5 ${currentTab === 'discover' ? 'border-[#e2533b] text-[#e2533b]' : 'border-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a]'}`}
          >
            <Compass size={14} className={currentTab === 'discover' ? 'fill-current' : ''} /> {t('nav.discover')}
          </button>
          <button 
            type="button"
            onClick={() => onChangeTab('inbox')}
            className={`cursor-pointer pb-1 border-b-2 transition-all duration-150 relative flex items-center gap-1.5 ${currentTab === 'inbox' ? 'border-[#e2533b] text-[#e2533b]' : 'border-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a]'}`}
          >
            <Mail size={14} className={currentTab === 'inbox' ? 'fill-current' : ''} /> {t('nav.inbox')}
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
            <User size={14} className={currentTab === 'profile' ? 'fill-current' : ''} /> {t('nav.profile')}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {currentTab === 'map' ? (
            <div className="relative w-[40vw] max-w-[390px] min-w-[150px] z-[9999]">
              <div className="flex items-center gap-2 bg-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] px-3 py-2">
                <Search size={17} className="text-[#e2533b] shrink-0" strokeWidth={2.5} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    onSearchQueryChange(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  placeholder={t('search.placeholder')}
                  className="min-w-0 flex-1 bg-transparent outline-none font-mono text-[10px] sm:text-[11px] text-[#1a1a1a] placeholder:text-[#1a1a1a]/45"
                  aria-label="Search restaurants on the map"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchQueryChange('')}
                    aria-label="Clear map search text"
                    className="w-7 h-7 flex items-center justify-center text-[#1a1a1a]/60 hover:text-[#e2533b] active:scale-90 transition-all cursor-pointer"
                  >
                    <X size={16} strokeWidth={3} />
                  </button>
                )}
              </div>

              {showSearchSuggestions && (
                <div className="absolute top-[calc(100%+10px)] right-0 left-0 bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_#1a1a1a] max-h-[320px] overflow-y-auto z-[9999] hide-scrollbar">
                  {searchSuggestions.length > 0 ? (
                    searchSuggestions.map((restaurant) => (
                      <button
                        key={restaurant.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          onSearchRestaurantSelect(restaurant.id);
                          setIsSearchFocused(false);
                        }}
                        className="w-full p-3 text-left border-b border-[#1a1a1a]/10 last:border-b-0 hover:bg-[#f9f7f2] active:bg-[#f2eee6] transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-2.5">
                          <MapPin size={16} className="mt-0.5 text-[#e2533b] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-serif italic font-bold text-sm text-[#1a1a1a] truncate">{restaurant.name}</p>
                            <p className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/55 truncate">
                              {restaurant.category} // {restaurant.area}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 bg-[#e2533b] text-white px-1.5 py-0.5 shrink-0">
                            <Star size={9} className="fill-white text-white" />
                            <span className="font-mono text-[9px] font-bold">{restaurant.rating}</span>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/50">
                      {t('search.no_results')}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {/* Toggle language button */}
          <button
            type="button"
            onClick={() => changeLanguage(language === 'vi' ? 'en' : 'vi')}
            className="flex items-center gap-1.5 px-3 py-2 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#1a1a1a] font-mono text-[10px] font-bold bg-white text-[#1a1a1a] hover:bg-[#f9f7f2] transition-all cursor-pointer shrink-0"
            aria-label="Toggle language"
          >
            <Globe size={13} className="text-[#e2533b]" />
            <span>{language.toUpperCase()}</span>
          </button>
        </div>
      </header>      {/* Bottom Layout Menu Tab Navigation (Mobile only, visible on < md breakpoint, centered on full width) */}
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
            {t('nav.food_map')}
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
            {t('nav.discover')}
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
            {t('nav.inbox')}
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
            {t('nav.profile')}
          </span>
        </button>
 
      </nav>
    </>
  );
}
