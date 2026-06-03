/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Restaurant } from '../types';

interface PageMapProps {
  restaurants: Restaurant[];
  onSelectRestaurant: (id: string) => void;
  onSelectTour: () => void;
}

export default function PageMap({ restaurants, onSelectRestaurant, onSelectTour }: PageMapProps) {
  const [activeFilter, setActiveFilter] = useState<'trending' | 'seafood' | 'bbq' | 'snails'>('trending');
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [mylocateStatus, setMylocateStatus] = useState(false);

  // Trigger brief alert when checking location
  const handleGeoLocate = () => {
    setMylocateStatus(true);
    setTimeout(() => {
      setMylocateStatus(false);
    }, 2000);
  };

  return (
    <div className="relative w-full h-[calc(100vh-72px)] overflow-hidden">
      
      {/* Live OpenStreetMap tile background */}
      <div className="absolute inset-0 z-0 animate-fade-in duration-500">
        <iframe
          title="Street food map – District 4, HCMC"
          src="https://www.openstreetmap.org/export/embed.html?bbox=106.6950%2C10.7520%2C106.7120%2C10.7650&layer=mapnik"
          className="w-full h-full border-0"
          loading="eager"
          allowFullScreen
        />
        {/* Subtle overlay so markers pop over the tiles */}
        <div className="absolute inset-0 bg-surface/5 pointer-events-none" />
      </div>

      {/* Top Floating Filter Chips */}
      <div className="absolute top-4 w-full z-[30] px-4 pointer-events-none">
        <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto no-scrollbar pb-2 pointer-events-auto">
          
          <button 
            type="button"
            onClick={() => setActiveFilter('trending')}
            className={`shrink-0 px-4 py-2 rounded-none font-mono text-[10px] uppercase tracking-wider border-2 shadow transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'trending'
                ? 'bg-[#e2533b] text-white border-transparent font-bold scale-102'
                : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-[#f9f7f2]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px] filled">local_fire_department</span>
            Trending
          </button>

          <button 
            type="button"
            onClick={() => setActiveFilter('seafood')}
            className={`shrink-0 px-4 py-2 rounded-none font-mono text-[10px] uppercase tracking-wider border-2 shadow transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'seafood'
                ? 'bg-[#e2533b] text-white border-transparent font-bold scale-102'
                : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-[#f9f7f2]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px] filled">set_meal</span>
            Seafood
          </button>

          <button 
            type="button"
            onClick={() => setActiveFilter('bbq')}
            className={`shrink-0 px-4 py-2 rounded-none font-mono text-[10px] uppercase tracking-wider border-2 shadow transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'bbq'
                ? 'bg-[#e2533b] text-white border-transparent font-bold scale-102'
                : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-[#f9f7f2]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">outdoor_grill</span>
            BBQ
          </button>

          <button 
            type="button"
            onClick={() => setActiveFilter('snails')}
            className={`shrink-0 px-4 py-2 rounded-none font-mono text-[10px] uppercase tracking-wider border-2 shadow transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'snails'
                ? 'bg-[#e2533b] text-white border-transparent font-bold scale-102'
                : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-[#f9f7f2]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">water_drop</span>
            Snails
          </button>
        </div>
      </div>

      {/* Map Interactive Marker Points */}
      
      {/* Marker 1: Oc Oanh (Active Seafood, matches mockup screenshot coordinate) */}
      <div 
        onClick={() => {
          setSelectedPin('oc_oanh');
          // Wait briefly, then let user view restaurant details or focus
        }}
        className="absolute top-[43%] left-[54%] -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
      >
        <div className="relative flex flex-col items-center">
          
          {/* Teardrop geometry */}
          <div className="w-12 h-12 bg-primary rounded-t-full rounded-bl-full rounded-br-sm rotate-45 flex items-center justify-center shadow-lg border-2 border-surface transition-transform duration-200 group-hover:scale-110 marker-pulse">
            <span className="material-symbols-outlined -rotate-45 text-on-primary text-[22px] filled">set_meal</span>
          </div>

          {/* Floating location tag banner */}
          <div className={`mt-2 px-3 py-1 bg-surface/95 backdrop-blur-md text-on-surface font-label-sm text-[11px] rounded-full shadow-md whitespace-nowrap border border-outline-variant/30 transition-opacity duration-250 ${
            selectedPin === 'oc_oanh' ? 'opacity-100 flex items-center gap-1' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <span>Oc Oanh • 4.8★</span>
            <span className="text-primary-container material-symbols-outlined text-[12px] filled">verified</span>
          </div>

          {/* Snail preview bubble popup */}
          {selectedPin === 'oc_oanh' && (
            <div className="absolute -top-16 bg-[#ffffff] rounded-xl p-2 shadow-xl border border-primary/20 flex gap-2 w-48 z-40 animate-in fade-in zoom-in-95 pointer-events-auto">
              <div className="flex-1">
                <p className="text-[11px] font-bold text-on-surface truncate">Oc Oanh Snails</p>
                <p className="text-[9px] text-on-surface-variant leading-tight">Usually replies in 5m</p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRestaurant('oc_dao'); // can jump to detail
                  }}
                  className="mt-1 text-[9px] text-primary font-bold hover:underline block"
                >
                  View Detail &rarr;
                </button>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedPin(null); }}
                className="text-on-surface-variant p-0.5"
              >
                <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Marker 2: Restaurant Oc Dao (matchesdetail spec) */}
      <div 
        onClick={() => setSelectedPin('oc_dao')}
        className="absolute top-[32%] left-[28%] -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer group"
      >
        <div className="relative flex flex-col items-center">
          <div className="w-10 h-10 bg-secondary-container rounded-t-full rounded-bl-full rounded-br-sm rotate-45 flex items-center justify-center shadow-md border-2 border-surface transition-transform duration-200 group-hover:scale-110">
            <span className="material-symbols-outlined -rotate-45 text-on-secondary-container text-lg filled">outdoor_grill</span>
          </div>
          
          <div className={`mt-2 px-3 py-1 bg-surface/95 backdrop-blur-md text-on-surface font-label-sm text-[11px] rounded-full shadow-sm whitespace-nowrap border border-outline-variant/30 transition-opacity ${
            selectedPin === 'oc_dao' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <span>Oc Dao • 4.8★</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onSelectRestaurant('oc_dao');
              }}
              className="ml-1 text-primary font-bold hover:underline"
            >
              Go
            </button>
          </div>
        </div>
      </div>

      {/* Marker 3: General Snails pin (matches mockup coordinate) */}
      <div 
        onClick={() => setSelectedPin('spot_3')}
        className="absolute top-[68%] left-[36%] -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer group"
      >
        <div className="relative flex flex-col items-center">
          <div className="w-10 h-10 bg-secondary-container rounded-t-full rounded-bl-full rounded-br-sm rotate-45 flex items-center justify-center shadow-md border-2 border-surface transition-transform duration-200 group-hover:scale-110">
            <span className="material-symbols-outlined -rotate-45 text-on-secondary-container text-lg filled">water_drop</span>
          </div>
          <div className={`mt-2 px-3 py-1 bg-surface/95 backdrop-blur-md text-on-surface font-label-sm text-[11px] rounded-full shadow-sm whitespace-nowrap border border-outline-variant/30 transition-opacity ${
            selectedPin === 'spot_3' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <span>Bếp Ốc Hẻm 4.2★</span>
          </div>
        </div>
      </div>

      {/* Location overlay notification */}
      {mylocateStatus && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#e2533b] text-white font-mono text-[9px] uppercase tracking-wider px-3.5 py-2.5 rounded-none shadow-lg z-50 border border-white/15 animate-bounce">
          🎯 Tracking your GPS on Vinh Khanh food street...
        </div>
      )}

      {/* Floating UI controls (Bottom section) */}
      <div className="absolute bottom-6 left-0 w-full px-4 z-[30] pointer-events-none flex flex-col items-end gap-3">
        
        {/* Floating Action Button: Current Location */}
        <button 
          type="button"
          onClick={handleGeoLocate}
          aria-label="Align camera to current GPS location"
          className="w-12 h-12 bg-white text-[#1a1a1a] hover:text-[#e2533b] rounded-none shadow-xl flex items-center justify-center border-2 border-[#1a1a1a] hover:bg-[#f9f7f2] active:scale-90 transition-all pointer-events-auto cursor-pointer group"
        >
          <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">my_location</span>
        </button>

        {/* Floating Curated Food Tour Card, matching mockup layout */}
        <div 
          onClick={onSelectTour}
          className="w-full md:w-[380px] self-start md:self-end bg-white rounded-none p-3 shadow-xl border-2 border-[#1a1a1a] pointer-events-auto flex items-center gap-3 transform transition-transform hover:-translate-y-1 cursor-pointer"
        >
          {/* Slices representation */}
          <div 
            className="w-16 h-16 rounded-none bg-cover bg-center shrink-0 border border-[#1a1a1a]/15 grayscale"
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBDjvGT6gPlZtXxuECzVxFZA8EEO6irjnnzNm5dhbe_NgWa3EeWsxrWIIABSP3XyA3AbrFQAcGEqIzhi9lKRnwGi034jy7uRSUQnjW6xBD1rrw_Uhe0CEF3qcPN_rno8GRzuVlD_sMExHBf5wQMGp5p6gBf1D5b1LmHi4frvclFfTPXEPz4UNk8BqaFVDrKmZ8uP51ERO88KQb-E2iqOYYwZy8oztX-MBx4M-EjtaSzoQaPOyZGRzc2OX8WB7ksMcxEzPKr2c09xA')" }}
          />

          {/* Info Details */}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1.5 mb-1 text-[9px] select-none font-semibold">
              <span className="px-1.5 py-0.5 bg-[#e2533b] text-white rounded-none font-mono uppercase tracking-wider text-[8px]">
                Curated
              </span>
              <span className="flex items-center text-[#e2533b] font-mono uppercase tracking-wider text-[8px] font-extrabold">
                <span className="material-symbols-outlined text-[11px] mr-1">local_fire_department</span>
                Hot
              </span>
            </div>
            
            <h3 className="font-serif italic font-bold text-sm text-[#1a1a1a] mb-0.5 truncate">
              Vinh Khanh Night Tour
            </h3>
            <p className="font-sans font-light text-[11px] text-[#1a1a1a]/60 truncate">
              5 epic stops • Guided local tasting
            </p>
          </div>

          {/* Action Button trigger */}
          <button 
            type="button"
            className="w-8 h-8 rounded-none bg-[#1a1a1a] hover:bg-[#e2533b] text-white flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>

        </div>
      </div>

    </div>
  );
}
