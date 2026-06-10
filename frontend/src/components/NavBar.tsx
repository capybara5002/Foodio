/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Search, X, MapPin, Star, Map, Compass, PlusCircle, Mail, User, Globe } from 'lucide-react';
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
            onClick={() => onChangeTab('create')}
            className={`cursor-pointer pb-1 border-b-2 transition-all duration-150 flex items-center gap-1.5 ${currentTab === 'create' ? 'border-[#e2533b] text-[#e2533b]' : 'border-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a]'}`}
          >
            <PlusCircle size={14} className={currentTab === 'create' ? 'fill-current' : ''} /> {t('nav.review')}
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
            {t('nav.review')}
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
