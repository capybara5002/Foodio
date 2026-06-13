/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Restaurant } from '../types';
import { ArrowLeft, Share2, Heart, BadgeCheck, Star, MapPin, MessageSquare, Map, Clock, Plus, Volume2, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { createReview } from '../api/cravemapApi';
import { PRESET_IMAGES } from '../data';
import MultiLanguageAudioGuide from '../components/MultiLanguageAudioGuide';

interface PageDetailProps {
  restaurant: Restaurant;
  onBack: () => void;
  onOpenBooking: () => void;
  onGoToChat: () => void;
  requireAuth: (message: string, action: () => void) => void;
  onRestaurantUpdated: (updated: Restaurant) => void;
}

export default function PageDetail({ restaurant, onBack, onOpenBooking, onGoToChat, requireAuth, onRestaurantUpdated }: PageDetailProps) {
  const { t, i18n } = useTranslation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAllDishes, setShowAllDishes] = useState(false);
  const [showAudioGuide, setShowAudioGuide] = useState(false);

  // Write Review State
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newPhotoIndex, setNewPhotoIndex] = useState<number | null>(null);
  const { user } = useAuth();

  const handleCyclePhoto = () => {
    if (newPhotoIndex === null) {
      setNewPhotoIndex(0);
    } else {
      setNewPhotoIndex((prev) => (prev! + 1) % PRESET_IMAGES.length);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setToastMessage(t('review_form.validation_comment'));
      setTimeout(() => setToastMessage(null), 2000);
      return;
    }

    try {
      const reviewPayload = {
        author: user?.username || (i18n.language === 'vi' ? 'Khách ẩn danh' : 'Anonymous'),
        role: user?.role ? (user.role === 'Guest' ? 'Guest' : 'Foodie') : (i18n.language === 'vi' ? 'Khách' : 'Visitor'),
        rating: newRating,
        comment: newComment.trim(),
        avatar: (user?.username || 'AN').slice(0, 2).toUpperCase(),
        imageUrl: newPhotoIndex !== null ? PRESET_IMAGES[newPhotoIndex] : undefined,
      };

      const addedReview = await createReview(restaurant.id, reviewPayload);

      // Append review locally
      const updatedReviews = [addedReview, ...(restaurant.reviews || [])];
      
      // Recalculate rating
      const avgRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;

      const updatedRestaurant = {
        ...restaurant,
        reviews: updatedReviews,
        rating: Math.round(avgRating * 10) / 10
      };

      onRestaurantUpdated(updatedRestaurant);
      
      // Reset form
      setNewComment('');
      setNewRating(5);
      setNewPhotoIndex(null);
      setShowReviewForm(false);
      setToastMessage(t('review_form.success_toast'));
      setTimeout(() => setToastMessage(null), 2500);
    } catch (error) {
      console.error('Lỗi khi gửi đánh giá:', error);
      setToastMessage(t('review_form.error_toast'));
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // Advanced Review Filters State
  const [starFilter, setStarFilter] = useState<number | 'All'>('All');
  const [hasImageFilter, setHasImageFilter] = useState<boolean>(false);

  const filteredReviews = (restaurant.reviews || []).filter((rev) => {
    if (starFilter !== 'All' && Math.floor(rev.rating) !== starFilter) return false;
    if (hasImageFilter && !rev.imageUrl) return false;
    return true;
  });

  const handleShare = () => {
    setToastMessage(t('detail.share_copied'));
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAddDish = (dishName: string) => {
    setToastMessage(t('detail.added_dish', { name: dishName }));
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="w-full bg-[#fdfcf9] pb-24 text-on-surface">
      
      {/* Immersive Photo Hero Header Banner Section */}
      <div 
        className="relative w-full h-[320px] bg-cover bg-center border-b border-[#1a1a1a]/10"
        style={{ backgroundImage: `url('${restaurant.image}')` }}
      >
        {/* Absolute Floating Controllers */}
        <div className="absolute top-4 left-0 w-full flex justify-between items-center px-4 z-10 pt-4">
          <button 
            type="button"
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-sm bg-white border border-[#1a1a1a]/25 shadow text-on-surface hover:bg-[#f9f7f2] active:scale-95 transition-transform cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={handleShare}
              className="w-10 h-10 flex items-center justify-center rounded-sm bg-white border border-[#1a1a1a]/25 shadow text-on-surface hover:bg-[#f9f7f2] active:scale-95 transition-transform cursor-pointer"
            >
              <Share2 size={20} />
            </button>
            <button 
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className="w-10 h-10 flex items-center justify-center rounded-sm bg-white border border-[#1a1a1a]/25 shadow hover:bg-[#f9f7f2] active:scale-95 transition-transform cursor-pointer"
            >
              {isFavorite ? (
                <Heart size={20} className="fill-[#e2533b] text-[#e2533b]" />
              ) : (
                <Heart size={20} className="text-on-surface" />
              )}
            </button>
          </div>
        </div>

        {/* Bottom fading vignette */}
        <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-[#fdfcf9] to-transparent pointer-events-none" />
      </div>

      {/* Main Content Layout Sheet Container - Magazine open spread aesthetic */}
      <main className="relative -mt-10 bg-white border-t-2 border-[#1a1a1a] pt-8 px-5 md:px-8 flex flex-col gap-6 z-20 max-w-2xl mx-auto shadow-md">
        
        {/* Title and Badge specifications */}
        <section className="flex flex-col gap-2">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#e2533b] font-extrabold block mb-1">STREET FOOD SELECTION</span>
              <h1 className="font-serif italic font-bold text-headline-lg-mobile md:text-headline-lg text-[#1a1a1a] leading-none">
                {restaurant.name}
                {restaurant.isVerified && (
                  <BadgeCheck size={18} className="ml-2 inline-block fill-[#e2533b] text-white select-none align-middle" />
                )}
              </h1>
            </div>
            
            <div className="flex items-center gap-1.5 bg-[#e2533b] text-white px-3 py-1.5 rounded-none shadow-sm shrink-0 select-none">
              <Star size={15} className="fill-white text-white" />
              <span className="font-mono text-xs font-black">{restaurant.rating}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/60 pt-2 border-t border-[#1a1a1a]/10 mt-2">
            <span className="bg-[#f9f7f2] border border-[#1a1a1a]/10 px-2.5 py-1 rounded-none font-bold text-[#1a1a1a]">{restaurant.priceRange}</span>
            <span className="bg-[#f9f7f2] border border-[#1a1a1a]/10 px-2.5 py-1 rounded-none font-bold text-[#1a1a1a]">{restaurant.category}</span>
            <span className="bg-[#f9f7f2] border border-[#1a1a1a]/10 px-2.5 py-1 rounded-none font-bold text-[#1a1a1a]">Vietnamese</span>
            <span className="flex items-center gap-1 text-[#e2533b] font-bold ml-1">
              <MapPin size={14} className="text-[#e2533b]" />
              {restaurant.distance}
            </span>
          </div>
        </section>

        {/* Action Row CTA: Audio Guide and Chat triggers */}
        <section className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setShowAudioGuide((current) => !current)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#1a1a1a] hover:bg-[#e2533b] text-white py-3.5 px-4 rounded-none shadow-md active:scale-98 transition-all font-mono text-[10px] uppercase tracking-widest cursor-pointer"
          >
            <Volume2 size={14} /> {t('detail.play_audio')}
          </button>
          
          <button 
            type="button"
            onClick={onGoToChat}
            aria-label="Direct message with restaurant owner"
            className="flex items-center justify-center gap-2 bg-white border border-[#1a1a1a]/25 text-on-surface hover:bg-[#f9f7f2] rounded-none shadow-sm active:scale-95 transition-transform cursor-pointer px-4 h-12 font-mono text-[10px] uppercase tracking-widest font-bold"
          >
            <MessageSquare size={18} />
            {t('nav.contact')}
          </button>
        </section>

        {showAudioGuide && (
          <MultiLanguageAudioGuide
            title={`${restaurant.name} audio guide`}
            sourceText={restaurant.description || `${restaurant.name}. ${restaurant.category} restaurant located at ${restaurant.address}, ${restaurant.area}. Recommended dishes include ${restaurant.dishes.map((dish) => dish.name).slice(0, 3).join(', ') || 'local specialties'}.`}
            defaultLang={i18n.language?.split('-')[0] || 'en'}
          />
        )}

        {restaurant.description && (
          <section className="text-xs md:text-sm text-[#1a1a1a]/80 leading-relaxed font-sans border-l-3 border-[#e2533b] pl-3.5 italic py-1 bg-[#fdfcf9] border border-[#1a1a1a]/10 rounded-sm">
            {restaurant.description}
          </section>
        )}

        {/* Contact and address specification box */}
        <section className="flex flex-col gap-3 p-4 bg-[#f9f7f2] border border-[#1a1a1a]/15 text-xs text-[#1a1a1a]">
          
          <div className="flex items-start gap-3">
            <Map size={18} className="text-[#e2533b] mt-0.5 select-none" />
            <div>
              <p className="font-bold">{restaurant.address}</p>
              <p className="text-[#1a1a1a]/60 text-[11px] font-sans mt-0.5">{restaurant.area}</p>
            </div>
          </div>
          
          <hr className="border-[#1a1a1a]/10" />

          <div className="flex items-start gap-3">
            <Clock size={18} className="text-[#e2533b] mt-0.5 select-none" />
            <div>
              <p className="font-bold">
                Open Now <span className="text-[#1a1a1a]/60 font-normal ml-2">{restaurant.openingHours}</span>
              </p>
            </div>
          </div>

        </section>

        {/* Menu signature dishes highlighting bento lists */}
        <section className="flex flex-col gap-3">
          <div className="flex justify-between items-baseline border-b border-[#1a1a1a]/10 pb-2 mb-2">
            <h2 className="font-serif italic font-bold text-base md:text-lg text-[#1a1a1a]">{t('detail.signature_dishes')}</h2>
            {restaurant.dishes.length > 2 && (
              <button 
                onClick={() => setShowAllDishes(!showAllDishes)}
                className="font-mono text-[9px] uppercase tracking-wider font-extrabold text-[#e2533b] hover:underline cursor-pointer"
              >
                {showAllDishes ? t('detail.show_less') : t('detail.see_all')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(showAllDishes ? restaurant.dishes : restaurant.dishes.slice(0, 2)).map((dish) => (
              <div 
                key={dish.id} 
                className="bg-white border border-[#1a1a1a]/15 rounded-none overflow-hidden shadow-xs flex flex-col relative group hover:border-[#e2533b]/45 transition-colors"
              >
                {/* Image panel */}
                <div 
                  className="h-28 w-full bg-cover bg-center filter grayscale group-hover:grayscale-0 transition-all duration-300"
                  style={{ backgroundImage: `url('${dish.image}')` }}
                />
                
                <div className="p-3.5 flex flex-col justify-between flex-1 gap-1">
                  <div>
                    <h3 className="font-serif italic font-bold text-xs md:text-sm text-[#1a1a1a] truncate">{dish.name}</h3>
                    <p className="font-sans text-[10px] text-[#1a1a1a]/55 line-clamp-1 mt-1 font-light leading-tight">{dish.description}</p>
                  </div>
                  <p className="font-mono font-bold text-[#e2533b] text-xs mt-1.5">${dish.price.toFixed(2)}</p>
                </div>

                {/* Add target floating button */}
                <button 
                  type="button"
                  onClick={() => handleAddDish(dish.name)}
                  className="absolute bottom-3 right-3 w-7 h-7 bg-[#1a1a1a] hover:bg-[#e2533b] text-white rounded-none flex items-center justify-center shadow active:scale-90 transition-all cursor-pointer"
                >
                  <Plus size={13} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Foodie list reviews */}
        <section className="flex flex-col gap-3 pb-12">
          <div className="border-b border-[#1a1a1a]/10 pb-2 mb-2 flex items-center justify-between gap-3">
            <h2 className="font-serif italic font-bold text-base md:text-lg text-[#1a1a1a]">{t('detail.foodie_reviews')}</h2>
            <button
              type="button"
              onClick={() => {
                requireAuth(t('auth.require_login_post'), () => {
                  setShowReviewForm((current) => !current);
                });
              }}
              className="bg-[#1a1a1a] hover:bg-[#e2533b] text-white font-mono text-[9px] uppercase tracking-wider px-3.5 py-1.5 shadow-xs active:scale-95 transition-all cursor-pointer font-bold shrink-0"
            >
              {showReviewForm ? t('detail.close_review_form') : t('detail.write_review')}
            </button>
          </div>

          {/* Write Review Form */}
          {showReviewForm && (
            <form onSubmit={handleCreateReview} className="bg-white p-5 border border-[#1a1a1a]/15 shadow-sm flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/60 font-extrabold select-none">
                  {t('review_form.question')}
                </span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setNewRating(stars)}
                      className="hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star 
                        size={22} 
                        className={`select-none transition-all ${
                          stars <= newRating ? 'fill-[#e2533b] text-[#e2533b]' : 'text-[#1a1a1a]/25'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Text comment input */}
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/60 font-extrabold select-none">
                  {t('review_form.experience')}
                </span>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value.slice(0, 500))}
                  placeholder={t('review_form.placeholder')}
                  className="w-full bg-[#fdfcf9] border border-[#1a1a1a]/15 p-3 font-sans text-xs text-[#1a1a1a] placeholder:text-[#1a1a1a]/45 focus:outline-none focus:border-[#e2533b] resize-none min-h-[90px] leading-relaxed font-light"
                />
                <span className="font-mono text-[9px] text-[#1a1a1a]/40 font-bold self-end mt-0.5">
                  {newComment.length}/500
                </span>
              </div>

              {/* Optional Photo Attachment */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/60 font-extrabold select-none">
                    {t('review_form.photo_attachment')}
                  </span>
                  {newPhotoIndex !== null && (
                    <button 
                      type="button" 
                      onClick={() => setNewPhotoIndex(null)}
                      className="text-red-500 font-mono text-[9px] uppercase font-bold tracking-wider hover:underline"
                    >
                      {t('review_form.photo_delete')}
                    </button>
                  )}
                </div>
                
                {newPhotoIndex !== null ? (
                  <div className="relative aspect-video w-full max-w-[200px] border border-[#1a1a1a]/15 overflow-hidden group cursor-pointer" onClick={handleCyclePhoto}>
                    <img 
                      src={PRESET_IMAGES[newPhotoIndex]} 
                      alt="Preset Food" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-[9px] uppercase font-mono tracking-wider font-bold">{t('review_form.photo_change')}</span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleCyclePhoto}
                    className="flex items-center justify-center gap-1.5 border border-dashed border-[#1a1a1a]/25 py-3 text-[#1a1a1a]/60 hover:text-[#e2533b] hover:border-[#e2533b] transition-all cursor-pointer font-mono text-[10px] uppercase tracking-wider font-bold max-w-[200px] self-start"
                  >
                    <Camera size={14} />
                    <span>{t('review_form.photo_preset')}</span>
                  </button>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 border-t border-[#1a1a1a]/10 pt-3 mt-1">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="bg-white border border-[#1a1a1a]/15 text-[#1a1a1a] font-mono text-[10px] uppercase tracking-wider px-4 py-2 hover:bg-[#fdfcf9] active:scale-95 transition-all cursor-pointer font-bold"
                >
                  {t('review_form.cancel')}
                </button>
                <button
                  type="submit"
                  className="bg-[#1a1a1a] hover:bg-[#e2533b] text-white font-mono text-[10px] uppercase tracking-widest px-6 py-2 shadow-xs active:scale-95 transition-all cursor-pointer font-bold"
                >
                  {t('review_form.submit')}
                </button>
              </div>
            </form>
          )}

          {/* Advanced Filter UI */}
          <div className="flex flex-col gap-3 p-3.5 bg-[#f9f7f2] border border-[#1a1a1a]/15 text-xs font-mono text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[10px] text-[#1a1a1a]/55">{t('detail.stars_filter')}</span>
              <div className="flex flex-wrap gap-1">
                {(['All', 5, 4, 3, 2, 1] as const).map(stars => (
                  <button
                    key={stars}
                    onClick={() => setStarFilter(stars)}
                    className={`px-2.5 py-1 border transition-all cursor-pointer font-bold text-[9px] uppercase tracking-wider ${
                      starFilter === stars 
                        ? 'bg-[#e2533b] text-white border-transparent shadow-xs' 
                        : 'bg-white text-[#1a1a1a] border-[#1a1a1a]/15 hover:bg-[#fdfcf9]'
                    }`}
                  >
                    {stars === 'All' ? t('detail.all_stars') : `${stars} ★`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-[#1a1a1a]/10 pt-2.5 mt-0.5">
              <input
                id="photoFilter"
                type="checkbox"
                checked={hasImageFilter}
                onChange={(e) => setHasImageFilter(e.target.checked)}
                className="w-4 h-4 border-2 border-[#1a1a1a] rounded-none focus:ring-0 checked:bg-[#e2533b] cursor-pointer"
              />
              <label htmlFor="photoFilter" className="font-bold uppercase tracking-wider text-[10px] text-[#1a1a1a]/70 select-none cursor-pointer">
                {t('detail.reviews_with_images')}
              </label>
            </div>
          </div>

          <div className="flex overflow-x-auto gap-3 hide-scrollbar -mx-5 px-5 pb-2">
            {filteredReviews.length === 0 ? (
              <div className="min-w-full text-center py-8 font-mono text-[10px] uppercase text-[#1a1a1a]/40 font-bold">
                {t('detail.no_reviews')}
              </div>
            ) : (
              filteredReviews.map((rev) => (
                <div 
                  key={rev.id}
                  className="min-w-[280px] md:min-w-[340px] bg-white p-4 rounded-none shadow-xs border border-[#1a1a1a]/15 flex flex-col gap-2 shrink-0 relative text-left"
                >
                  {/* Visual quotation mark mark */}
                  <span className="absolute right-3 top-3 font-serif italic text-6xl text-[#1a1a1a]/5 select-none font-black leading-none">“</span>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center font-mono font-bold text-xs select-none">
                      {rev.avatar}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-bold text-xs text-[#1a1a1a]">{rev.author}</p>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/40 mt-0.5">{rev.role}</p>
                    </div>

                    {/* Stars indicators */}
                    <div className="flex text-[#e2533b]">
                      {Array.from({ length: 5 }).map((_, st) => (
                        <Star 
                          key={st} 
                          size={12} 
                          className={`select-none ${st < Math.floor(rev.rating) ? 'fill-[#e2533b] text-[#e2533b]' : 'text-slate-300'}`} 
                        />
                      ))}
                    </div>
                  </div>

                  <p className="font-serif italic text-[11px] md:text-xs text-[#1a1a1a]/70 leading-relaxed font-light mt-1 flex-1">
                    "{rev.comment}"
                  </p>

                  {/* Review Image Preview */}
                  {rev.imageUrl && (
                    <div className="mt-2 border border-[#1a1a1a]/10 overflow-hidden aspect-video w-full bg-[#f9f7f2]">
                      <img 
                        src={rev.imageUrl} 
                        alt="Review Attachment" 
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

      </main>

      {/* Sticky Bottom Action Sheet Row */}
      <div className="fixed bottom-0 left-0 w-full bg-[#fdfcf9] border-t border-[#1a1a1a]/10 px-4 py-3 shadow-lg z-40 flex justify-center pb-safe">
        <button 
          onClick={onOpenBooking}
          className="w-full max-w-md bg-[#1a1a1a] hover:bg-[#e2533b] text-white font-mono text-[10px] uppercase tracking-widest py-3.5 rounded-none shadow-md active:scale-[0.98] transition-all text-center cursor-pointer"
        >
          {t('detail.book_table')}
        </button>
      </div>

      {/* Glowing dynamic notification toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white px-5 py-2.5 rounded-none text-xs font-semibold tracking-wider uppercase border border-[#e2533b]/20 shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-4">
          {toastMessage}
        </div>
      )}

    </div>
  );
}
