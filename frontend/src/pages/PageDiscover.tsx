/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AudioTour, CommunityPost, PostComment } from '../types';
import { getPostComments, createPostComment } from '../api/cravemapApi';
import { Flame, MapPin, Star, Heart, MessageSquare, Bookmark, Volume2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PageDiscoverProps {
  tours: AudioTour[];
  onPlayTour: (tour: AudioTour) => void;
  searchText: string;
}

export default function PageDiscover({ tours, onPlayTour, searchText }: PageDiscoverProps) {
  const { t } = useTranslation();
  const [subTab, setSubTab] = useState<'tours' | 'feed'>('tours');
  const [feedFilter, setFeedFilter] = useState<'forYou' | 'following'>('forYou');
  const [tourFilter, setTourFilter] = useState('All');

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Record<string, PostComment[]>>({});
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    let active = true;
    if (subTab === 'feed') {
      const fetchPosts = async () => {
        setLoading(true);
        setError(null);
        try {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const response = await fetch(`${baseUrl}/api/communityposts`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (active) {
            setPosts(data);
          }
        } catch (err: any) {
          console.error("Error fetching community posts:", err);
          if (active) {
            setError("Could not load posts. Please try again later.");
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };
      void fetchPosts();
    }
    return () => {
      active = false;
    };
  }, [subTab]);

  const handleLikePost = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const isCurrentlyLiked = post.isLiked;
          return {
            ...post,
            isLiked: !isCurrentlyLiked,
            likesCount: isCurrentlyLiked ? post.likesCount - 1 : post.likesCount + 1
          };
        }
        return post;
      })
    );
  };

  const handleSavePost = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isSaved: !post.isSaved
          };
        }
        return post;
      })
    );
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }
    setExpandedPostId(postId);
    if (!postComments[postId]) {
      try {
        const comments = await getPostComments(postId);
        setPostComments(prev => ({ ...prev, [postId]: comments }));
      } catch (err) {
        console.error("Failed to load comments:", err);
      }
    }
  };

  const handleSubmitComment = async (postId: string) => {
    if (!commentInput.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const newComment = await createPostComment(postId, commentInput.trim());
      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
      ));
      setCommentInput('');
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const tourCategories = ['All', 'Night Markets', 'Seafood', 'Street Food', 'Fine Dining'];

  return (
    <div className="w-full min-h-[calc(100vh-72px)] bg-[#fdfcf9] pb-24">

      {/* Dynamic Sub Tab Toggle Controller */}
      <div className="sticky top-[12px] z-30 max-w-md mx-auto px-4 pt-3">
        <div className="flex p-1.5 bg-[#f9f7f2] border border-[#1a1a1a]/10 rounded shadow-sm backdrop-blur-md">
          <button
            type="button"
            onClick={() => setSubTab('tours')}
            className={`flex-grow py-2 rounded font-extrabold text-[10px] uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${subTab === 'tours'
                ? 'bg-[#1a1a1a] text-white shadow-md font-black'
                : 'text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5'
              }`}
          >
            <Volume2 size={12} /> Tours
          </button>
          <button
            type="button"
            onClick={() => setSubTab('feed')}
            className={`flex-grow py-2 rounded font-extrabold text-[10px] uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${subTab === 'feed'
                ? 'bg-[#1a1a1a] text-white shadow-md font-black'
                : 'text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5'
              }`}
          >
            <Users size={12} /> Feed
          </button>
        </div>
      </div>

      {subTab === 'tours' ? (
        /* ==================== SCREEN 3: CURATED AUDIO TOURS ==================== */
        <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6 animate-in fade-in duration-350">

          {/* Header Introduction Block */}
          <div className="flex flex-col gap-2 pt-2 border-b border-[#1a1a1a]/10 pb-6">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#e2533b] font-extrabold">{t('discover.collection')} // 02</span>
            <h1 className="font-serif italic font-light text-headline-lg-mobile md:text-headline-lg text-[#1a1a1a] leading-none">
              {t('discover.audio_tours_title')}
            </h1>
            <p className="font-sans text-xs md:text-sm text-[#1a1a1a]/60 leading-relaxed font-light max-w-xl">
              {t('discover.audio_tours_desc')}
            </p>
          </div>
 
          {/* Scollable Categories Horizon Filters */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 py-1">
            {tourCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setTourFilter(cat)}
                className={`whitespace-nowrap px-4 py-2 font-mono text-[10px] uppercase tracking-wider border rounded-none transition-all cursor-pointer ${(cat === 'All' && tourFilter === 'All') || tourFilter === cat
                    ? 'bg-[#e2533b] text-white border-transparent shadow-sm font-black'
                    : 'bg-white text-[#1a1a1a] border-[#1a1a1a]/15 hover:bg-[#f9f7f2]'
                  }`}
              >
                {cat === 'All' ? t('discover.all_tours') : cat}
              </button>
            ))}
          </div>

          {/* Cards Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            {tours
              .filter((tour) => {
                // Category match simulation
                if (tourFilter !== 'All') {
                  if (tourFilter === 'Seafood' && !tour.title.toLowerCase().includes('seafood')) return false;
                  if (tourFilter === 'Night Markets' && !tour.title.toLowerCase().includes('snacking')) return false;
                  if (tourFilter === 'Street Food' && !tour.title.toLowerCase().includes('snacking')) return false;
                }

                // Search query match
                if (searchText) {
                  const q = searchText.toLowerCase();
                  return tour.title.toLowerCase().includes(q) ||
                    tour.location.toLowerCase().includes(q) ||
                    tour.description.toLowerCase().includes(q);
                }

                return true;
              })
              .map((tour) => {

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
                          <Flame size={12} className="fill-[#e2533b] text-[#e2533b]" />
                          <span className="text-[9px] font-mono uppercase tracking-widest font-bold">{t('discover.trending')}</span>
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
                            <MapPin size={12} className="text-[#1a1a1a]/50" />
                            {tour.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 bg-[#e2533b] text-white px-2 py-0.5 rounded-sm font-semibold select-none">
                          <Star size={11} className="fill-white text-white" />
                          <span className="font-mono text-[10px]">{tour.rating}</span>
                        </div>
                      </div>

                      <p className="font-sans text-xs text-[#1a1a1a]/70 leading-relaxed font-light">
                        {tour.description}
                      </p>

                      {/* Numeric meta counters */}
                      <div className="grid grid-cols-3 gap-2 border-y border-[#1a1a1a]/10 py-3 text-[10px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-sans text-[8px] text-[#1a1a1a]/40 uppercase tracking-widest font-extrabold">{t('discover.duration')}</span>
                          <span className="font-mono font-bold text-[#1a1a1a]">
                            {tour.duration}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 border-l border-[#1a1a1a]/10 pl-2">
                          <span className="font-sans text-[8px] text-[#1a1a1a]/40 uppercase tracking-widest font-extrabold">{t('discover.stops')}</span>
                          <span className="font-mono font-bold text-[#1a1a1a]">
                            {tour.stopsCount} {t('discover.stops_suffix')}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 border-l border-[#1a1a1a]/10 pl-2">
                          <span className="font-sans text-[8px] text-[#1a1a1a]/40 uppercase tracking-widest font-extrabold">{t('discover.atmos')}</span>
                          <span className="font-mono font-bold text-[#1a1a1a] truncate">
                            {tour.vibe}
                          </span>
                        </div>
                      </div>

                      {/* Start Play CTA */}
                      <button
                        type="button"
                        onClick={() => onPlayTour(tour)}
                        className="w-full mt-auto bg-[#1a1a1a] hover:bg-[#e2533b] text-white font-mono text-[10px] uppercase tracking-widest py-3 rounded-none shadow transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Volume2 size={12} /> {t('discover.start_audio')}
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
              className={`flex-1 py-1.5 text-center rounded-none font-sans text-[10px] tracking-wider uppercase transition-all cursor-pointer ${feedFilter === 'forYou'
                  ? 'bg-[#1a1a1a] text-white font-bold'
                  : 'text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5'
                }`}
            >
              {t('discover.for_you')}
            </button>
            <button
              type="button"
              onClick={() => setFeedFilter('following')}
              className={`flex-1 py-1.5 text-center rounded-none font-sans text-[10px] tracking-wider uppercase transition-all cursor-pointer ${feedFilter === 'following'
                  ? 'bg-[#1a1a1a] text-white font-bold'
                  : 'text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5'
                }`}
            >
              {t('discover.following')}
            </button>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-[#1a1a1a]/60">
              <span className="animate-spin text-2xl">⏳</span>
              <span className="font-mono text-[10px] mt-2 uppercase tracking-widest font-bold">{t('discover.loading_feed')}</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12 font-mono text-[10px] uppercase text-[#e2533b] font-bold">
              ⚠️ {t('discover.error_feed')}
            </div>
          )}

          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-12 font-mono text-[10px] uppercase text-[#1a1a1a]/40 font-bold">
              {t('discover.no_posts')}
            </div>
          )}

          {/* Social Posts lists */}
          {!loading && !error && posts.map((post) => (
            <article
              key={post.id}
              className={`bg-white rounded-none border-2 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${
                post.isRestaurantPost
                  ? 'border-[#e2533b] shadow-[4px_4px_0px_0px_rgba(226,83,59,0.15)] bg-amber-50/5'
                  : 'border-[#1a1a1a]/15'
              }`}
            >
              {/* User profile header badge row */}
              <div className="p-4 flex items-center gap-3 border-b border-[#1a1a1a]/5">
                <img
                  src={post.avatar}
                  alt={post.author}
                  className="w-9 h-9 rounded-full object-cover border border-[#1a1a1a]/10 p-[1px] bg-white text-center text-[10px]"
                />

                <div className="flex-1 min-w-0">
                  <h3 className="font-mono text-xs font-bold text-[#1a1a1a] truncate flex items-center gap-1.5 flex-wrap">
                    <span>{post.handle}</span>
                    {post.isRestaurantPost && (
                      <span className="bg-[#e2533b] text-white text-[8px] font-mono uppercase px-1 py-0.5 font-black tracking-wider flex items-center gap-0.5 select-none shrink-0 rounded-xs">
                        👑 {t('owner.official_badge', 'CHÍNH THỨC')}
                      </span>
                    )}
                  </h3>
                  <p className="font-sans text-[9px] uppercase tracking-wider text-[#1a1a1a]/40 mt-0.5">
                    {post.timeAgo}
                  </p>
                </div>

                <div className="flex items-center gap-0.5 bg-[#e2533b] text-white px-2 py-0.5 rounded-xs">
                  <Star size={11} className="fill-white text-white" />
                  <span className="font-mono text-[10px] font-bold">{post.rating}</span>
                </div>
              </div>

              {/* Delicious Loaded Food Picture area */}
              <div className="relative w-full aspect-[4/3] bg-[#f9f7f2] overflow-hidden">
                <img src={post.image} alt="Vietnam food street dish mockup visual" className="w-full h-full object-cover" />

                {/* Embedded Floating coordinate chip */}
                <div className="absolute bottom-3 left-3 bg-[#1a1a1a] text-white px-3 py-1 rounded-sm flex items-center gap-1 border border-white/5 select-none">
                  <MapPin size={12} className="text-[#e2533b]" />
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
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-1 px-1 py-1 rounded transition-colors cursor-pointer ${post.isLiked ? 'text-[#e2533b]' : 'text-[#1a1a1a]/55 hover:text-[#e2533b]'
                        }`}
                    >
                      {post.isLiked ? (
                        <Heart size={18} className="fill-[#e2533b] text-[#e2533b]" />
                      ) : (
                        <Heart size={18} />
                      )}
                      <span className="font-mono text-[10px] font-bold">{post.likesCount}</span>
                    </button>

                    <button 
                      onClick={() => handleToggleComments(post.id)}
                      className="flex items-center gap-1 text-[#1a1a1a]/55 hover:text-[#e2533b] px-1 py-1 cursor-pointer"
                    >
                      <MessageSquare size={18} />
                      <span className="font-mono text-[10px] font-bold">{post.commentsCount}</span>
                    </button>
                  </div>

                  {/* Bookmark Save Action */}
                  <button
                    onClick={() => handleSavePost(post.id)}
                    className={`p-1 hover:bg-[#1a1a1a]/5 rounded transition-colors cursor-pointer ${post.isSaved ? 'text-[#e2533b]' : 'text-[#1a1a1a]/60'
                      }`}
                  >
                    {post.isSaved ? (
                      <Bookmark size={18} className="fill-[#e2533b] text-[#e2533b]" />
                    ) : (
                      <Bookmark size={18} />
                    )}
                  </button>

                </div>

                {/* Expanded Comments Section */}
                {expandedPostId === post.id && (
                  <div className="mt-2 border-t border-[#1a1a1a]/10 pt-3 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-48 overflow-y-auto pr-2 flex flex-col gap-3">
                      {(postComments[post.id] || []).length === 0 ? (
                        <p className="font-sans text-[10px] text-[#1a1a1a]/40 text-center py-2">No comments yet. Be the first!</p>
                      ) : (
                        (postComments[post.id] || []).map(comment => (
                          <div key={comment.id} className="flex gap-2 items-start">
                            <img src={comment.avatar} alt={comment.author} className="w-6 h-6 rounded-full object-cover border border-[#1a1a1a]/10 bg-white" />
                            <div className="flex-1 bg-[#f9f7f2] rounded-md p-2 border border-[#1a1a1a]/5">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="font-mono text-[9px] font-bold text-[#1a1a1a]">{comment.author}</span>
                                <span className="font-sans text-[8px] text-[#1a1a1a]/40 uppercase tracking-widest">{new Date(comment.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="font-sans text-[10px] text-[#1a1a1a]/80 leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="flex gap-2 items-center mt-1">
                      <input 
                        type="text"
                        value={commentInput}
                        onChange={e => setCommentInput(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 border border-[#1a1a1a]/20 rounded-sm px-3 py-1.5 font-sans text-xs focus:outline-none focus:border-[#e2533b] transition-colors"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSubmitComment(post.id);
                        }}
                      />
                      <button 
                        onClick={() => handleSubmitComment(post.id)}
                        disabled={!commentInput.trim() || isSubmittingComment}
                        className="bg-[#1a1a1a] hover:bg-[#e2533b] disabled:bg-[#1a1a1a]/40 text-white px-3 py-1.5 rounded-sm font-mono text-[9px] font-bold uppercase tracking-widest transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </article>
          ))}

        </div>
      )}

    </div>
  );
}
