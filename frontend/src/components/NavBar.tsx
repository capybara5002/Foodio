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
            <path d="M 37.3 21.3 A 18 18 0 0 0 37.3 46.7" fill="none" stroke="#d49a6a" strokeWidth="3" strokeLinecap="round"/>
            <path d="M 31.6 15.6 A 26 26 0 0 0 31.6 52.4" fill="none" stroke="#d49a6a" strokeWidth="2.2" strokeLinecap="round" opacity="0.75"/>
            <path d="M 26 10 A 34 34 0 0 0 26 58" fill="none" stroke="#d49a6a" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>
            
            {/* Sound waves right */}
            <path d="M 62.7 21.3 A 18 18 0 0 1 62.7 46.7" fill="none" stroke="#d49a6a" strokeWidth="3" strokeLinecap="round"/>
            <path d="M 68.4 15.6 A 26 26 0 0 1 68.4 52.4" fill="none" stroke="#d49a6a" strokeWidth="2.2" strokeLinecap="round" opacity="0.75"/>
            <path d="M 74 10 A 34 34 0 0 1 74 58" fill="none" stroke="#d49a6a" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>
            
            {/* Microphone Capsule */}
            <rect x="42" y="20" width="16" height="28" rx="8" fill="#d49a6a"/>
            {/* Horizontal grilles */}
            <line x1="44" y1="25.5" x2="56" y2="25.5" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="44" y1="31" x2="56" y2="31" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="44" y1="36.5" x2="56" y2="36.5" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="44" y1="42" x2="56" y2="42" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
            
            {/* Stand Stem */}
            <line x1="50" y1="48" x2="50" y2="70" stroke="#d49a6a" strokeWidth="4.5" strokeLinecap="round"/>
            
            {/* Crossed Cutlery (Fork and Knife) */}
            {/* Fork (Crossing bottom-left to top-right) */}
            <g transform="translate(50, 60) rotate(-35) translate(-50, -60)">
              {/* Handle */}
              <line x1="50" y1="60" x2="50" y2="82" stroke="#d49a6a" strokeWidth="3.5" strokeLinecap="round"/>
              {/* Fork Head */}
              <path d="M 46.5 50 L 53.5 50 L 54.5 39 C 54.5 36.5 45.5 36.5 45.5 39 Z" fill="#d49a6a"/>
              {/* Tine cutouts */}
              <line x1="48.5" y1="36" x2="48.5" y2="43" stroke="#1a1a1a" strokeWidth="1"/>
              <line x1="50" y1="36" x2="50" y2="43" stroke="#1a1a1a" strokeWidth="1"/>
              <line x1="51.5" y1="36" x2="51.5" y2="43" stroke="#1a1a1a" strokeWidth="1"/>
            </g>
            
            {/* Knife (Crossing bottom-right to top-left) */}
            <g transform="translate(50, 60) rotate(35) translate(-50, -60)">
              {/* Handle */}
              <line x1="50" y1="60" x2="50" y2="82" stroke="#d49a6a" strokeWidth="3.5" strokeLinecap="round"/>
              {/* Knife Blade */}
              <path d="M 48 50 L 52 50 L 52 38 C 52 35 48 36 48 38 Z" fill="#d49a6a"/>
            </g>
          </svg>
          
          <span className="text-sm md:text-base tracking-[0.12em] font-black uppercase text-[#1a1a1a] font-sans flex items-center gap-[1px]">
            FOODI
            <span className="w-[0.72em] h-[0.72em] border-[1.6px] md:border-[2px] border-[#1a1a1a] rounded-full flex items-center justify-center text-[#1a1a1a] shrink-0 translate-y-[-0.04em] ml-[0.06em]">
              <Volume2 className="w-[0.44em] h-[0.44em] text-[#1a1a1a] stroke-[2.5]" />
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
