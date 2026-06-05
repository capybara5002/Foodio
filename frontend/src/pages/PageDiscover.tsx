/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AudioTour, CommunityPost } from '../types';

interface PageDiscoverProps {
  tours: AudioTour[];
  posts: CommunityPost[];
  onPlayTour: (tour: AudioTour) => void;
  onLikePost: (postId: string) => void;
  onSavePost: (postId: string) => void;
}

export default function PageDiscover({ tours, posts, onPlayTour, onLikePost, onSavePost }: PageDiscoverProps) {
  const [subTab, setSubTab] = useState<'tours' | 'feed'>('tours');
  const [feedFilter, setFeedFilter] = useState<'forYou' | 'following'>('forYou');
  const [tourFilter, setTourFilter] = useState('All');

  const tourCategories = ['All', 'Night Markets', 'Seafood', 'Street Food', 'Fine Dining'];

  return (
    <div className="w-full min-h-[calc(100vh-72px)] bg-[#fdfcf9] pb-24">
      
      {/* Dynamic Sub Tab Toggle Controller */}
      <div className="sticky top-[12px] z-30 max-w-md mx-auto px-4 pt-3">
        <div className="flex p-1.5 bg-[#f9f7f2] border border-[#1a1a1a]/10 rounded shadow-sm backdrop-blur-md">
          <button
            type="button"
            onClick={() => setSubTab('tours')}
            className={`flex-1 py-2 text-center rounded font-extrabold text-[10px] uppercase tracking-[0.2em] transition-all cursor-pointer ${
              subTab === 'tours'
                ? 'bg-[#1a1a1a] text-white shadow-md font-black'
                : 'text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5'
            }`}
          >
            🔊 Tours
          </button>
          <button
            type="button"
            onClick={() => setSubTab('feed')}
            className={`flex-1 py-2 text-center rounded font-extrabold text-[10px] uppercase tracking-[0.2em] transition-all cursor-pointer ${
              subTab === 'feed'
                ? 'bg-[#1a1a1a] text-white shadow-md font-black'
                : 'text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5'
            }`}
          >
            👥 Feed
          </button>
        </div>
      </div>

      {subTab === 'tours' ? (
        /* ==================== SCREEN 3: CURATED AUDIO TOURS ==================== */
        <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6 animate-in fade-in duration-350">
          
          {/* Header Introduction Block */}
          <div className="flex flex-col gap-2 pt-2 border-b border-[#1a1a1a]/10 pb-6">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#e2533b] font-extrabold">Collection // 02</span>
            <h1 className="font-serif italic font-light text-headline-lg-mobile md:text-headline-lg text-[#1a1a1a] leading-none">
              Curated Audio Tours
            </h1>
            <p className="font-sans text-xs md:text-sm text-[#1a1a1a]/60 leading-relaxed font-light max-w-xl">
              Immersive, high-density culinary journeys guided by local culinary experts. Plug in your headphones and explore the sensory trace of street setups.
            </p>
          </div>

          {/* Scollable Categories Horizon Filters */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 py-1">
            {tourCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setTourFilter(cat)}
                className={`whitespace-nowrap px-4 py-2 font-mono text-[10px] uppercase tracking-wider border rounded-none transition-all cursor-pointer ${
                  (cat === 'All' && tourFilter === 'All') || tourFilter === cat
                    ? 'bg-[#e2533b] text-white border-transparent shadow-sm font-black'
                    : 'bg-white text-[#1a1a1a] border-[#1a1a1a]/15 hover:bg-[#f9f7f2]'
                }`}
              >
                {cat === 'All' ? 'All Tours' : cat}
              </button>
            ))}
          </div>

          {/* Cards Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            {tours.map((tour) => {
              // Custom category match simulation
              if (tourFilter !== 'All') {
                if (tourFilter === 'Seafood' && !tour.title.toLowerCase().includes('seafood')) return null;
                if (tourFilter === 'Night Markets' && !tour.title.toLowerCase().includes('snacking')) return null;
                if (tourFilter === 'Street Food' && !tour.title.toLowerCase().includes('snacking')) return null;
              }

              return (
                <article 
                  key={tour.id}
                  className="bg-white border border-[#1a1a1a]/10 rounded shadow-sm overflow-hidden flex flex-col group transition-transform hover:-translate-y-1 duration-300 relative"
                >
                  {/* Decorative faint background trace */}
                  <div className="absolute top-2 right-2 text-[#1a1a1a]/5 font-serif text-8xl italic select-none pointer-events-none font-bold">
                    T
                  </div>

                  <div className="relative h-48 w-full overflow-hidden bg-[#f9f7f2]">
                    <img 
                      src={tour.mapImage} 
                      alt="Local explorer street trace route" 
                      className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-multiply filter grayscale" 
                    />
                    
                    {/* Floating image preview */}
                    <div className="absolute inset-3 rounded shadow-inner overflow-hidden border border-[#1a1a1a]/5">
                      <img src={tour.image} alt={tour.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                    </div>

                    {tour.isTrending && (
                      <div className="absolute top-5 left-5 bg-[#1a1a1a] text-white px-2.5 py-0.5 rounded-sm flex items-center gap-1 shadow border border-transparent">
                        <span className="material-symbols-outlined text-[12px] text-[#e2533b] filled">local_fire_department</span>
                        <span className="text-[9px] font-mono uppercase tracking-widest font-bold">Trending</span>
                      </div>
                    )}
                  </div>

                  {/* Body textual information */}
                  <div className="p-5 flex flex-col gap-4 flex-1">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h2 className="font-serif italic font-bold text-base md:text-lg text-[#1a1a1a] group-hover:text-[#e2533b] transition-colors leading-tight">
                          {tour.title}
                        </h2>
                        <p className="font-sans text-[10px] text-[#1a1a1a]/50 flex items-center gap-1 mt-1 font-medium tracking-wide">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          {tour.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-[#e2533b] text-white px-2 py-0.5 rounded-sm font-semibold select-none">
                        <span className="material-symbols-outlined text-[11px] filled">star</span>
                        <span className="font-mono text-[10px]">{tour.rating}</span>
                      </div>
                    </div>

                    <p className="font-sans text-xs text-[#1a1a1a]/70 leading-relaxed font-light">
                      {tour.description}
                    </p>

                    {/* Numeric meta counters */}
                    <div className="grid grid-cols-3 gap-2 border-y border-[#1a1a1a]/10 py-3 text-[10px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-sans text-[8px] text-[#1a1a1a]/40 uppercase tracking-widest font-extrabold">Duration</span>
                        <span className="font-mono font-bold text-[#1a1a1a]">
                          {tour.duration}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 border-l border-[#1a1a1a]/10 pl-2">
                        <span className="font-sans text-[8px] text-[#1a1a1a]/40 uppercase tracking-widest font-extrabold">Stops</span>
                        <span className="font-mono font-bold text-[#1a1a1a]">
                          {tour.stopsCount} Spots
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 border-l border-[#1a1a1a]/10 pl-2">
                        <span className="font-sans text-[8px] text-[#1a1a1a]/40 uppercase tracking-widest font-extrabold">Atmos</span>
                        <span className="font-mono font-bold text-[#1a1a1a] truncate">
                          {tour.vibe}
                        </span>
                      </div>
                    </div>

                    {/* Start Play CTA */}
                    <button
                      type="button"
                      onClick={() => onPlayTour(tour)}
                      className="w-full mt-auto bg-[#1a1a1a] hover:bg-[#e2533b] text-white font-mono text-[10px] uppercase tracking-widest py-3 rounded-none shadow transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Start Audio Tour // 🔊
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

        </div>
      ) : (
        /* ==================== SCREEN 5: COMMUNITY FOOD FEED ==================== */
        <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-6 animate-in fade-in duration-350">
          
          {/* Feed Local Secondary Toggle Links */}
          <div className="flex p-0.5 bg-[#f9f7f2] rounded border border-[#1a1a1a]/10 shadow-inner">
            <button
              type="button"
              onClick={() => setFeedFilter('forYou')}
              className={`flex-1 py-1.5 text-center rounded-none font-sans text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                feedFilter === 'forYou'
                  ? 'bg-[#1a1a1a] text-white font-bold'
                  : 'text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5'
              }`}
            >
              Dành cho bạn
            </button>
            <button
              type="button"
              onClick={() => setFeedFilter('following')}
              className={`flex-1 py-1.5 text-center rounded-none font-sans text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                feedFilter === 'following'
                  ? 'bg-[#1a1a1a] text-white font-bold'
                  : 'text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5'
              }`}
            >
              Đang theo dõi
            </button>
          </div>

          {/* Social Posts lists */}
          {posts.map((post) => (
            <article 
              key={post.id}
              className="bg-white rounded-none border border-[#1a1a1a]/15 shadow-sm overflow-hidden flex flex-col"
            >
              {/* User profile header badge row */}
              <div className="p-4 flex items-center gap-3 border-b border-[#1a1a1a]/5">
                <img 
                  src={post.avatar} 
                  alt={post.author} 
                  className="w-9 h-9 rounded-full object-cover border border-[#1a1a1a]/10 p-[1px] bg-white text-center text-[10px]" 
                />
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-mono text-xs font-bold text-[#1a1a1a] truncate">
                    {post.handle}
                  </h3>
                  <p className="font-sans text-[9px] uppercase tracking-wider text-[#1a1a1a]/40 mt-0.5">
                    {post.timeAgo}
                  </p>
                </div>

                <div className="flex items-center gap-0.5 bg-[#e2533b] text-white px-2 py-0.5 rounded-xs">
                  <span className="material-symbols-outlined text-[11px] filled text-white">star</span>
                  <span className="font-mono text-[10px] font-bold">{post.rating}</span>
                </div>
              </div>

              {/* Delicious Loaded Food Picture area */}
              <div className="relative w-full aspect-[4/3] bg-[#f9f7f2] overflow-hidden">
                <img src={post.image} alt="Vietnam food street dish mockup visual" className="w-full h-full object-cover" />
                
                {/* Embedded Floating coordinate chip */}
                <div className="absolute bottom-3 left-3 bg-[#1a1a1a] text-white px-3 py-1 rounded-sm flex items-center gap-1 border border-white/5 select-none">
                  <span className="material-symbols-outlined text-xs text-[#e2533b]">location_on</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider font-bold">{post.locationName}</span>
                </div>
              </div>

              {/* Text review comment block & Action bars */}
              <div className="p-4 flex flex-col gap-3">
                <p className="font-serif italic text-xs md:text-sm text-[#1a1a1a]/90 leading-relaxed line-clamp-4 font-light">
                  "{post.content}"
                </p>

                <hr className="border-[#1a1a1a]/10 mt-1" />

                <div className="flex items-center justify-between pt-1">
                  
                  {/* Likes and Comment metrics */}
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => onLikePost(post.id)}
                      className={`flex items-center gap-1 px-1 py-1 rounded transition-colors cursor-pointer ${
                        post.isLiked ? 'text-[#e2533b]' : 'text-[#1a1a1a]/55 hover:text-[#e2533b]'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-lg ${post.isLiked ? 'filled' : ''}`}>
                        favorite
                      </span>
                      <span className="font-mono text-[10px] font-bold">{post.likesCount}</span>
                    </button>

                    <button className="flex items-center gap-1 text-[#1a1a1a]/55 hover:text-[#e2533b] px-1 py-1 cursor-pointer">
                      <span className="material-symbols-outlined text-lg">mode_comment</span>
                      <span className="font-mono text-[10px] font-bold">{post.commentsCount}</span>
                    </button>
                  </div>

                  {/* Bookmark Save Action */}
                  <button 
                    onClick={() => onSavePost(post.id)}
                    className={`p-1 hover:bg-[#1a1a1a]/5 rounded transition-colors cursor-pointer ${
                      post.isSaved ? 'text-[#e2533b]' : 'text-[#1a1a1a]/60'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-lg ${post.isSaved ? 'filled' : ''}`}>
                      bookmark
                    </span>
                  </button>

                </div>
              </div>

            </article>
          ))}

        </div>
      )}

    </div>
  );
}
