/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AudioTour, CommunityPost, PostComment } from '../types';
import { getPostComments, createPostComment } from '../api/cravemapApi';
import { apiBase } from '../api/apiConfig';
import { initialCommunityFeed } from '../data';
import { Flame, MapPin, Star, Heart, MessageSquare, Bookmark, Volume2, Users, Plus, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ImageGallery from '../components/Common/ImageGallery';

interface PageDiscoverProps {
  tours: AudioTour[];
  onPlayTour: (tour: AudioTour) => void;
  searchText: string;
  sessionCommunityPosts?: CommunityPost[];
  onCreatePost?: () => void;
}

const mergeFeedPosts = (...groups: CommunityPost[][]) => {
  const seen = new Set<string>();
  return groups.flat().filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
};

const emptySessionPosts: CommunityPost[] = [];

const getPostImages = (post: CommunityPost) =>
  post.images && post.images.length > 0 ? post.images : post.image ? [post.image] : [];

export default function PageDiscover({ tours, onPlayTour, searchText, sessionCommunityPosts = emptySessionPosts, onCreatePost }: PageDiscoverProps) {
  const { t } = useTranslation();
  const [subTab, setSubTab] = useState<'tours' | 'feed'>('tours');
  const [feedFilter, setFeedFilter] = useState<'forYou' | 'following'>('forYou');
  const [tourFilter, setTourFilter] = useState('All');

  const [posts, setPosts] = useState<CommunityPost[]>(() =>
    mergeFeedPosts(sessionCommunityPosts, initialCommunityFeed)
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Record<string, PostComment[]>>({});
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (sessionCommunityPosts.length === 0) return;
    setPosts((prevPosts) => mergeFeedPosts(sessionCommunityPosts, prevPosts, initialCommunityFeed));
    setSubTab('feed');
  }, [sessionCommunityPosts]);

  useEffect(() => {
    let active = true;
    if (subTab === 'feed') {
      const fetchPosts = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`${apiBase}/api/communityposts`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (active) {
            setPosts((currentPosts) =>
              mergeFeedPosts(
                sessionCommunityPosts,
                data,
                initialCommunityFeed,
                currentPosts.filter((post) => post.id.startsWith('post_user_'))
              )
            );
          }
        } catch (err: any) {
          console.error("Error fetching community posts:", err);
          if (active) {
            setPosts((currentPosts) =>
              mergeFeedPosts(
                sessionCommunityPosts,
                currentPosts,
                initialCommunityFeed
              )
            );
            setError("Showing local feed while the community server is unavailable.");
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
  }, [subTab, sessionCommunityPosts]);

  const savedPostsCount = posts.filter((post) => post.isSaved).length;
  const visiblePosts = feedFilter === 'following'
    ? posts.filter((post) => post.isSaved)
    : posts;

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
    <div className="foodio-page w-full min-h-[calc(100vh-72px)] pb-32">

      {/* Dynamic Sub Tab Toggle Controller */}
      <div className="sticky top-[84px] z-30 max-w-md mx-auto px-4 pt-4">
        <div className="flex p-1.5 bg-[#fffaf4]/88 border border-white/70 rounded-full shadow-[0_18px_46px_rgba(77,49,31,0.12)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setSubTab('tours')}
            className={`flex-grow py-2.5 rounded-full font-extrabold text-[10px] uppercase tracking-[0.16em] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer flex items-center justify-center gap-1.5 ${subTab === 'tours'
              ? 'bg-[#2c211b] text-white shadow-[0_12px_28px_rgba(77,49,31,0.16)] font-black'
              : 'text-[#6f655b] hover:bg-white/70'
              }`}
          >
            <Volume2 size={12} /> Tours
          </button>
          <button
            type="button"
            onClick={() => setSubTab('feed')}
            className={`flex-grow py-2.5 rounded-full font-extrabold text-[10px] uppercase tracking-[0.16em] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer flex items-center justify-center gap-1.5 ${subTab === 'feed'
              ? 'bg-[#2c211b] text-white shadow-[0_12px_28px_rgba(77,49,31,0.16)] font-black'
              : 'text-[#6f655b] hover:bg-white/70'
              }`}
          >
            <Users size={12} /> Feed
          </button>
        </div>
      </div>

      {subTab === 'tours' ? (
        /* ==================== SCREEN 3: CURATED AUDIO TOURS ==================== */
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 flex flex-col gap-8 foodio-reveal">

          {/* Header Introduction Block */}
          <div className="flex flex-col gap-4 pt-4 border-b border-[#4b362a]/10 pb-8">
            <span className="foodio-eyebrow self-start">{t('discover.collection')}</span>
            <h1 className="font-serif font-bold text-5xl md:text-7xl tracking-[-0.07em] text-[#2c211b] leading-[0.92] max-w-5xl">
              {t('discover.audio_tours_title')}
            </h1>
            <p className="font-sans text-sm md:text-base text-[#6f655b] leading-relaxed max-w-2xl">
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
                className={`whitespace-nowrap px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider border rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${(cat === 'All' && tourFilter === 'All') || tourFilter === cat
                  ? 'bg-[#2c211b] text-white border-transparent shadow-[0_12px_28px_rgba(77,49,31,0.16)] font-black'
                  : 'bg-[#fffaf4] text-[#6f655b] border-[#4b362a]/10 hover:bg-white hover:text-[#2c211b]'
                  }`}
              >
                {cat === 'All' ? t('discover.all_tours') : cat}
              </button>
            ))}
          </div>

          {/* Cards Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 grid-flow-dense">
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
                    className="bg-[#fffaf4] border border-white/70 rounded-[2rem] shadow-[0_24px_70px_rgba(77,49,31,0.12)] overflow-hidden flex flex-col group transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 relative"
                  >
                    {/* Decorative faint background trace */}
                    <div className="absolute top-2 right-4 text-[#2c211b]/5 font-serif text-8xl select-none pointer-events-none font-bold">
                      T
                    </div>

                    <div className="relative h-56 w-full overflow-hidden bg-[#f0e5d8]">
                      <img
                        src={tour.mapImage}
                        alt="Local explorer street trace route"
                        className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-multiply filter grayscale contrast-125"
                      />

                      {/* Floating image preview */}
                      <div className="absolute inset-3 rounded-[1.5rem] shadow-inner overflow-hidden border border-white/35">
                        <img src={tour.image} alt={tour.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]" />
                      </div>

                      {tour.isTrending && (
                        <div className="absolute top-5 left-5 bg-[#2c211b]/92 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow border border-white/10 backdrop-blur-xl">
                          <Flame size={12} className="fill-[#e2533b] text-[#e2533b]" />
                          <span className="text-[9px] font-mono uppercase tracking-widest font-bold">{t('discover.trending')}</span>
                        </div>
                      )}
                    </div>

                    {/* Body textual information */}
                    <div className="p-6 flex flex-col gap-5 flex-1">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h2 className="font-serif font-bold text-xl md:text-2xl tracking-[-0.045em] text-[#2c211b] group-hover:text-[#8f4f3b] transition-colors leading-tight">
                            {tour.title}
                          </h2>
                          <p className="font-sans text-xs text-[#6f655b] flex items-center gap-1 mt-1 font-medium tracking-wide">
                            <MapPin size={12} className="text-[#6f655b]" />
                            {tour.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 bg-[#b76548] text-white px-2.5 py-1 rounded-full font-semibold select-none">
                          <Star size={11} className="fill-white text-white" />
                          <span className="font-mono text-[10px]">{tour.rating}</span>
                        </div>
                      </div>

                      <p className="font-sans text-sm text-[#4c4038] leading-relaxed">
                        {tour.description}
                      </p>

                      {/* Numeric meta counters */}
                      <div className="grid grid-cols-3 gap-2 border-y border-[#4b362a]/10 py-4 text-[10px]">
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
                        className="foodio-btn foodio-btn-primary w-full mt-auto font-mono text-[10px] uppercase tracking-widest cursor-pointer flex items-center justify-center gap-1.5"
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
        <div className="max-w-md mx-auto px-4 py-8 flex flex-col gap-6 foodio-reveal">

          {/* Feed Local Secondary Toggle Links */}
          <div className="flex p-1 bg-[#fffaf4]/88 rounded-full border border-white/70 shadow-[0_18px_46px_rgba(77,49,31,0.1)]">
            <button
              type="button"
              onClick={() => setFeedFilter('forYou')}
              className={`flex-1 py-1.5 text-center rounded-none font-sans text-[10px] tracking-wider uppercase transition-all cursor-pointer ${feedFilter === 'forYou'
                ? 'bg-[#2c211b] text-white font-bold rounded-full'
                : 'text-[#6f655b] hover:bg-white/70 rounded-full'
                }`}
            >
              {t('discover.for_you')}
            </button>
            <button
              type="button"
              onClick={() => setFeedFilter('following')}
              className={`flex-1 py-1.5 text-center rounded-none font-sans text-[10px] tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${feedFilter === 'following'
                ? 'bg-[#2c211b] text-white font-bold rounded-full'
                : 'text-[#6f655b] hover:bg-white/70 rounded-full'
                }`}
            >
              <span>{t('discover.saved_feed', 'Saved')}</span>
              {savedPostsCount > 0 && (
                <span className={`min-w-4 rounded-full px-1.5 py-0.5 text-[8px] leading-none ${feedFilter === 'following' ? 'bg-white/20 text-white' : 'bg-[#2c211b]/10 text-[#2c211b]'
                  }`}>
                  {savedPostsCount}
                </span>
              )}
            </button>
          </div>

          {onCreatePost && (
            <button
              type="button"
              onClick={onCreatePost}
              className="group overflow-hidden rounded-[2rem] border border-white/70 bg-[#fffaf4]/92 p-4 text-left shadow-[0_18px_46px_rgba(77,49,31,0.1)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-white cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#2c211b] text-white shadow-[0_12px_28px_rgba(77,49,31,0.18)]">
                  <Camera size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-lg font-bold tracking-[-0.04em] text-[#2c211b]">
                    {t('discover.create_prompt_title', 'Share a food moment')}
                  </p>
                  <p className="mt-0.5 truncate font-sans text-xs text-[#6f655b]">
                    {t('discover.create_prompt_desc', 'Post a dish, rate the place, and save it to your local trail.')}
                  </p>
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#b76548] text-white transition-transform group-hover:rotate-90">
                  <Plus size={16} strokeWidth={3} />
                </span>
              </div>
            </button>
          )}

          {loading && posts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-[#1a1a1a]/60">
              <span className="animate-spin text-2xl">⏳</span>
              <span className="font-mono text-[10px] mt-2 uppercase tracking-widest font-bold">{t('discover.loading_feed')}</span>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-[#b76548]/20 bg-[#fffaf4]/80 px-4 py-3 text-center font-mono text-[9px] uppercase tracking-wider text-[#8f4f3b] font-bold">
              {t('discover.local_feed_notice', error)}
            </div>
          )}

          {!loading && visiblePosts.length === 0 && (
            <div className="rounded-[2rem] border border-white/70 bg-[#fffaf4]/88 px-6 py-10 text-center shadow-[0_18px_46px_rgba(77,49,31,0.08)]">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#f0e5d8] text-[#8f4f3b]">
                <Bookmark size={18} />
              </div>
              <p className="font-serif text-xl font-bold tracking-[-0.04em] text-[#2c211b]">
                {feedFilter === 'following'
                  ? t('discover.no_saved_posts_title', 'No saved posts yet')
                  : t('discover.no_posts')}
              </p>
              <p className="mx-auto mt-2 max-w-xs font-sans text-xs leading-relaxed text-[#6f655b]">
                {feedFilter === 'following'
                  ? t('discover.no_saved_posts_desc', 'Tap the bookmark on any post and it will appear here.')
                  : t('discover.no_posts_desc', 'Start the board with your own food story.')}
              </p>
            </div>
          )}

          {/* Social Posts lists */}
          {visiblePosts.map((post) => (
            <article
              key={post.id}
              className={`bg-[#fffaf4] rounded-[2rem] border shadow-[0_24px_70px_rgba(77,49,31,0.12)] overflow-hidden flex flex-col transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${post.isRestaurantPost
                  ? 'border-[#b76548]/35 bg-amber-50/20'
                  : 'border-white/70'
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

                <div className="rounded-full bg-[#f0e5d8] px-2.5 py-1 font-mono text-[8px] font-black uppercase tracking-wider text-[#8f4f3b]">
                  {post.postType === 'promotion' ? 'Offer' : 'Post'}
                </div>
              </div>

              <div className="relative">
                <ImageGallery
                  images={getPostImages(post)}
                  alt={`${post.locationName} post photos`}
                  className="aspect-[4/3]"
                />
                <div className="absolute bottom-3 left-3 bg-[#1a1a1a] text-white px-3 py-1 rounded-sm flex items-center gap-1 border border-white/5 select-none">
                  <MapPin size={12} className="text-[#e2533b]" />
                  <span className="font-mono text-[9px] uppercase tracking-wider font-bold">{post.locationName}</span>
                </div>
              </div>

              {/* Text review comment block & Action bars */}
              <div className="p-4 flex flex-col gap-3">
                <p className="font-sans text-sm text-[#2c211b] leading-relaxed line-clamp-5">
                  {post.content}
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
