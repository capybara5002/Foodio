/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Search, X, MapPin, Star, Map as MapIcon, Compass, Mail, User, Globe, Volume2 } from 'lucide-react';
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

const normalizeString = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();

const navItems = [
  { id: 'map' as const, icon: MapIcon, labelKey: 'nav.food_map' },
  { id: 'discover' as const, icon: Compass, labelKey: 'nav.discover' },
  { id: 'inbox' as const, icon: Mail, labelKey: 'nav.inbox' },
  { id: 'profile' as const, icon: User, labelKey: 'nav.profile' }
];

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
      <header className="fixed inset-x-0 top-0 z-[80] h-[72px] px-3 pt-3 pointer-events-none md:px-6">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 rounded-[1.75rem] border border-white/70 bg-[#fffaf4]/84 px-2.5 shadow-[0_18px_46px_rgba(77,49,31,0.16)] backdrop-blur-2xl pointer-events-auto">
          <button
            type="button"
            onClick={() => onChangeTab('map')}
            className="foodio-logo-container rounded-[1.4rem] px-1.5 py-1 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            aria-label="Open Foodio map"
          >
            <div className="foodio-logo-box">
              <img src="/logo.png" alt="Foodio Logo" className="foodio-svg-icon object-contain select-none rounded-md" />
            </div>

            <div className="foodio-text-group">
              <span className="foodio-main-brand">Foodio</span>
              <span className="foodio-speaker-badge">
                <Volume2 className="h-2.5 w-2.5 fill-current text-white" />
              </span>
            </div>
          </button>

          {currentTab === 'map' && (
            <div className="relative z-[90] min-w-0 flex-1 md:max-w-[440px]">
              <div className="flex h-11 items-center gap-3 rounded-full border border-[#4b362a]/10 bg-white/86 px-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-within:border-[#b76548]/45 focus-within:bg-white focus-within:shadow-[0_12px_30px_rgba(77,49,31,0.12)]">
                <Search size={18} className="shrink-0 text-[#6f655b]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    onSearchQueryChange(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 180)}
                  placeholder={t('search.placeholder')}
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#2c211b] outline-none placeholder:text-[#8d8074]"
                  aria-label="Search restaurants on the map"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchQueryChange('')}
                    aria-label="Clear map search text"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6f655b] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#f0e5d8] hover:text-[#2c211b] active:scale-95"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {showSearchSuggestions && (
                <div className="absolute left-0 right-0 top-[calc(100%+10px)] max-h-[360px] overflow-y-auto rounded-[1.5rem] border border-[#4b362a]/10 bg-[#fffaf4] p-2 shadow-[0_24px_70px_rgba(77,49,31,0.2)] hide-scrollbar">
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
                        className="group flex w-full items-start gap-3 rounded-[1.15rem] px-3 py-3 text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white active:scale-[0.99]"
                      >
                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0d5c8] text-[#8f4f3b]">
                          <MapPin size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[#2c211b]">{restaurant.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-[#6f655b]">
                            {restaurant.category} · {restaurant.area}
                          </span>
                        </span>
                        <span className="mt-1 flex shrink-0 items-center gap-1 rounded-full bg-[#f5eadf] px-2.5 py-1 text-xs font-semibold text-[#2c211b]">
                          <Star size={12} className="fill-[#b76548] text-[#b76548]" />
                          {restaurant.rating}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-5 py-6 text-center text-sm text-[#6f655b]">{t('search.no_results')}</div>
                  )}
                </div>
              )}
            </div>
          )}

          <nav className="ml-auto hidden items-center gap-1 rounded-full bg-[#f0e5d8]/72 p-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChangeTab(item.id)}
                  className={`relative flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${isActive
                      ? 'bg-[#fffaf4] text-[#8f4f3b] shadow-[0_8px_22px_rgba(77,49,31,0.12)]'
                      : 'text-[#6f655b] hover:bg-[#fffaf4]/74 hover:text-[#2c211b]'
                    }`}
                >
                  <Icon size={17} />
                  <span>{t(item.labelKey)}</span>
                  {item.id === 'inbox' && unreadInboxCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#b76548] px-1 text-[10px] font-bold text-white ring-2 ring-[#fffaf4]">
                      {unreadInboxCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => changeLanguage(language === 'vi' ? 'en' : 'vi')}
            className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-[#4b362a]/10 bg-white/74 px-3 text-xs font-bold text-[#2c211b] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white active:scale-[0.98]"
            aria-label="Toggle language"
          >
            <Globe size={15} className="text-[#b76548]" />
            <span>{language.toUpperCase()}</span>
          </button>
        </div>
      </header>

      <nav className="fixed bottom-3 left-1/2 z-[80] flex h-16 w-[calc(100%-24px)] max-w-md -translate-x-1/2 items-center justify-around rounded-[1.75rem] border border-white/70 bg-[#fffaf4]/86 px-2 shadow-[0_18px_46px_rgba(77,49,31,0.18)] backdrop-blur-2xl md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeTab(item.id)}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95"
            >
              <div
                className={`relative flex h-8 min-w-14 items-center justify-center rounded-full px-4 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isActive ? 'bg-[#2c211b] text-[#fffaf4]' : 'text-[#6f655b] hover:bg-[#f0e5d8]'
                  }`}
              >
                <Icon size={18} />
                {item.id === 'inbox' && unreadInboxCount > 0 && (
                  <span className="absolute right-2 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#b76548] px-1 text-[9px] font-bold text-white">
                    {unreadInboxCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-[#2c211b]' : 'text-[#6f655b]'}`}>
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
