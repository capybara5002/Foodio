/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { Restaurant } from '../types';
import { ArrowLeft, Share2, Heart, BadgeCheck, Star, MapPin, MessageSquare, Map, Clock, Plus, Volume2, Camera, X, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { createReview, replyToReview } from '../api/cravemapApi';
import MultiLanguageAudioGuide from '../components/MultiLanguageAudioGuide';
import ImageGallery from '../components/Common/ImageGallery';

interface PageDetailProps {
  restaurant: Restaurant;
  onBack: () => void;
  onOpenBooking: () => void;
  onGoToChat: () => void;
  requireAuth: (message: string, action: () => void) => void;
  onRestaurantUpdated: (updated: Restaurant) => void;
  onContactUser?: (reviewerUsername: string) => void;
}

export default function PageDetail({ restaurant, onBack, onOpenBooking, onGoToChat, requireAuth, onRestaurantUpdated, onContactUser }: PageDetailProps) {
  const { t, i18n } = useTranslation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAllDishes, setShowAllDishes] = useState(false);
  const [showAudioGuide, setShowAudioGuide] = useState(false);

  // Write Review State
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newPhotoBase64s, setNewPhotoBase64s] = useState<string[]>([]);
  const { user } = useAuth();
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Reply states for owner
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyValue, setReplyValue] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const handleSendDetailReply = async (reviewId: string) => {
    if (!replyValue.trim()) {
      setToastMessage(t('review_form.validation_comment'));
      setTimeout(() => setToastMessage(null), 2000);
      return;
    }
    if (!user?.id) return;
    setReplySubmitting(true);
    try {
      const updatedReview = await replyToReview(reviewId, replyValue.trim(), user.id);
      
      const updatedReviews = (restaurant.reviews || []).map(r => r.id === reviewId ? { ...r, ownerReply: updatedReview.ownerReply, ownerReplyCreatedAt: updatedReview.ownerReplyCreatedAt } : r);
      
      onRestaurantUpdated({
        ...restaurant,
        reviews: updatedReviews
      });

      setActiveReplyId(null);
      setReplyValue('');
      setToastMessage(t('review_form.reply_success'));
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err: any) {
      console.error("Failed to send reply", err);
      setToastMessage(t('review_form.reply_error'));
      setTimeout(() => setToastMessage(null), 2500);
    } finally {
      setReplySubmitting(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((file) => file.type.startsWith('image/'));
    if (files.length === 0) return;
    try {
      const base64Photos = await Promise.all(files.map(fileToBase64));
      setNewPhotoBase64s((currentPhotos) => [...currentPhotos, ...base64Photos]);
    } catch (err) {
      console.error("Failed to read image files", err);
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = '';
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
        imageUrl: newPhotoBase64s[0] || undefined,
        imageUrls: newPhotoBase64s.length > 0 ? newPhotoBase64s : undefined,
      };

      const addedReviewFromApi = await createReview(restaurant.id, reviewPayload);
      const addedReview = {
        ...addedReviewFromApi,
        imageUrl: addedReviewFromApi.imageUrl || newPhotoBase64s[0],
        imageUrls: newPhotoBase64s.length > 0 ? newPhotoBase64s : addedReviewFromApi.imageUrl ? [addedReviewFromApi.imageUrl] : undefined
      };

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
      setNewPhotoBase64s([]);
      if (photoInputRef.current) photoInputRef.current.value = '';
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

  const getReviewImages = (review: { imageUrl?: string; imageUrls?: string[] }) =>
    review.imageUrls && review.imageUrls.length > 0
      ? review.imageUrls
      : review.imageUrl
        ? [review.imageUrl]
        : [];

  const filteredReviews = (restaurant.reviews || []).filter((rev) => {
    if (starFilter !== 'All' && Math.floor(rev.rating) !== starFilter) return false;
    if (hasImageFilter && getReviewImages(rev).length === 0) return false;
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
    <div className="foodio-page w-full pb-32 text-on-surface">
      
      {/* Immersive Photo Hero Header Banner Section */}
      <div 
        className="relative w-full h-[420px] bg-cover bg-center"
        style={{ backgroundImage: `url('${restaurant.image}')` }}
      >
        {/* Absolute Floating Controllers */}
        <div className="absolute top-5 left-0 w-full flex justify-between items-center px-4 md:px-8 z-10 pt-4">
          <button 
            type="button"
            onClick={onBack}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-[#fffaf4]/90 border border-white/60 shadow-[0_18px_46px_rgba(77,49,31,0.18)] text-on-surface hover:bg-white active:scale-95 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer backdrop-blur-xl"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={handleShare}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-[#fffaf4]/90 border border-white/60 shadow-[0_18px_46px_rgba(77,49,31,0.18)] text-on-surface hover:bg-white active:scale-95 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer backdrop-blur-xl"
            >
              <Share2 size={20} />
            </button>
            <button 
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-[#fffaf4]/90 border border-white/60 shadow-[0_18px_46px_rgba(77,49,31,0.18)] hover:bg-white active:scale-95 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer backdrop-blur-xl"
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
        <div className="absolute inset-0 bg-gradient-to-b from-[#2c211b]/25 via-transparent to-[#f7efe4] pointer-events-none" />
      </div>

      {/* Main Content Layout Sheet Container - Magazine open spread aesthetic */}
      <main className="relative -mt-24 bg-[#fffaf4]/96 border border-white/70 pt-8 px-5 md:px-8 flex flex-col gap-7 z-20 max-w-3xl mx-4 md:mx-auto shadow-[0_24px_70px_rgba(77,49,31,0.16)] rounded-[2rem] backdrop-blur-sm foodio-reveal">
        
        {/* Title and Badge specifications */}
        <section className="flex flex-col gap-2">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="foodio-eyebrow mb-3">Local favourite</span>
              <h1 className="font-serif font-bold text-4xl md:text-6xl tracking-[-0.06em] text-[#2c211b] leading-[0.95] text-wrap-balance">
                {restaurant.name}
                {restaurant.isVerified && (
                  <BadgeCheck size={22} className="ml-2 inline-block fill-[#b76548] text-white select-none align-middle" />
                )}
              </h1>
            </div>
            
            <div className="flex items-center gap-1.5 bg-[#2c211b] text-white px-3 py-2 rounded-full shadow-sm shrink-0 select-none">
              <Star size={15} className="fill-white text-white" />
              <span className="font-mono text-xs font-black">{restaurant.rating}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#6f655b] pt-4 border-t border-[#4b362a]/10 mt-4">
            <span className="bg-[#f5eadf] border border-[#4b362a]/10 px-3 py-1 rounded-full font-bold text-[#2c211b]">{restaurant.priceRange}</span>
            <span className="bg-[#f5eadf] border border-[#4b362a]/10 px-3 py-1 rounded-full font-bold text-[#2c211b]">{restaurant.category}</span>
            <span className="bg-[#f5eadf] border border-[#4b362a]/10 px-3 py-1 rounded-full font-bold text-[#2c211b]">Vietnamese</span>
            <span className="flex items-center gap-1 text-[#e2533b] font-bold ml-1">
              <MapPin size={14} className="text-[#e2533b]" />
              {restaurant.distance}
            </span>
          </div>
        </section>

        {/* Action Row CTA: Audio guide and chat triggers */}
        <section className="grid grid-cols-2 gap-3">
          <button 
            type="button"
            onClick={() => setShowAudioGuide((current) => !current)}
            className="foodio-btn foodio-btn-primary group h-12 min-w-0 !px-3 !py-0 font-mono text-[9px] uppercase tracking-wider cursor-pointer"
          >
            <Volume2 size={22} className="shrink-0" />
            <span className="min-w-0 leading-tight text-wrap-balance">{t('detail.play_audio')}</span>
          </button>
          
          <button 
            type="button"
            onClick={onGoToChat}
            aria-label="Direct message with restaurant owner"
            className="foodio-btn foodio-btn-secondary h-12 min-w-0 !px-3 !py-0 font-mono text-[9px] uppercase tracking-wider cursor-pointer"
          >
            <MessageSquare size={19} className="shrink-0" />
            <span className="min-w-0 leading-tight text-wrap-balance">{t('nav.contact')}</span>
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
          <section className="text-sm md:text-base text-[#4c4038] leading-relaxed font-sans border-l border-[#b76548]/40 pl-4 py-2 bg-[#fff8ef] rounded-2xl">
            {restaurant.description}
          </section>
        )}

        {/* Contact and address specification box */}
        <section className="flex flex-col gap-3 p-4 bg-[#f5eadf] border border-[#4b362a]/10 text-sm text-[#2c211b] rounded-3xl">
          
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
            <h2 className="font-serif font-bold text-xl md:text-2xl tracking-[-0.04em] text-[#2c211b]">{t('detail.signature_dishes')}</h2>
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
                className="bg-[#fffdf8] border border-[#4b362a]/10 rounded-[1.5rem] overflow-hidden shadow-[0_18px_46px_rgba(77,49,31,0.1)] flex flex-col relative group hover:border-[#b76548]/35 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                {/* Image panel */}
                <div 
                  className="h-32 w-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
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
            <h2 className="font-serif font-bold text-xl md:text-2xl tracking-[-0.04em] text-[#2c211b]">{t('detail.foodie_reviews')}</h2>
            <button
              type="button"
              onClick={() => {
                requireAuth(t('auth.require_login_post'), () => {
                  setShowReviewForm((current) => !current);
                });
              }}
              className="rounded-full bg-[#2c211b] hover:bg-[#8f4f3b] text-white font-mono text-[10px] uppercase tracking-wider px-4 py-2 shadow-xs active:scale-95 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer font-bold shrink-0"
            >
              {showReviewForm ? t('detail.close_review_form') : t('detail.write_review')}
            </button>
          </div>

          {/* Write Review Form */}
          {showReviewForm && (
            <form onSubmit={handleCreateReview} className="bg-[#fffdf8] p-5 border border-[#4b362a]/10 shadow-[0_18px_46px_rgba(77,49,31,0.1)] rounded-3xl flex flex-col gap-4 text-left">
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
                  {newPhotoBase64s.length > 0 && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setNewPhotoBase64s([]);
                        if (photoInputRef.current) photoInputRef.current.value = '';
                      }}
                      className="text-red-500 font-mono text-[9px] uppercase font-bold tracking-wider hover:underline"
                    >
                      {t('review_form.photo_delete')}
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2 pt-1 sm:grid-cols-5">
                  {newPhotoBase64s.map((photo, index) => (
                    <div key={`${photo}-${index}`} className="relative aspect-square overflow-hidden rounded-xl border border-[#1a1a1a]/10 bg-[#f9f7f2]">
                      <img src={photo} alt={`Review upload ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewPhotoBase64s((photos) => photos.filter((_, currentIndex) => currentIndex !== index))}
                        className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-[#2c211b]/80 text-white hover:bg-[#e2533b]"
                        aria-label="Remove review photo"
                      >
                        <X size={11} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="flex aspect-square items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#1a1a1a]/25 px-2 text-[#1a1a1a]/60 hover:text-[#e2533b] hover:border-[#e2533b] transition-all cursor-pointer font-mono text-[9px] uppercase tracking-wider font-bold"
                  >
                    <Camera size={14} />
                    <span>{newPhotoBase64s.length > 0 ? t('review_form.photo_add_more') : t('review_form.photo_upload')}</span>
                  </button>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
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

          <div className="flex flex-col gap-4 pb-2">
            {filteredReviews.length === 0 ? (
              <div className="w-full text-center py-8 font-mono text-[10px] uppercase text-[#1a1a1a]/40 font-bold">
                {t('detail.no_reviews')}
              </div>
            ) : (
              filteredReviews.map((rev) => (
                <div 
                  key={rev.id}
                  className="w-full bg-[#fffdf8] p-5 rounded-[1.5rem] shadow-[0_18px_46px_rgba(77,49,31,0.1)] border border-[#4b362a]/10 flex flex-col gap-3 relative text-left overflow-hidden"
                >
                  {/* Visual quotation mark mark */}
                  <span className="absolute right-3 top-3 font-serif italic text-6xl text-[#1a1a1a]/5 select-none font-black leading-none">“</span>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center font-mono font-bold text-xs select-none">
                      {rev.avatar}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-xs text-[#1a1a1a]">{rev.author}</p>
                        {user && user.role === 'Owner' && user.restaurantId === restaurant.id && (
                          <button
                            type="button"
                            onClick={() => onContactUser?.(rev.author)}
                            className="w-5 h-5 inline-flex items-center justify-center rounded-full bg-[#e2533b]/10 hover:bg-[#e2533b]/20 text-[#e2533b] border border-[#e2533b]/20 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                            title="Liên hệ"
                          >
                            <Send size={9} />
                          </button>
                        )}
                      </div>
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

                <p className="font-serif italic text-sm text-[#1a1a1a]/70 leading-relaxed font-light mt-1">
                  "{rev.comment}"
                </p>

                {getReviewImages(rev).length > 0 && (
                  <div className="mt-2 w-full max-w-sm overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-[#f9f7f2]">
                    <ImageGallery
                      images={getReviewImages(rev)}
                      alt={`${rev.author} review photos`}
                      className="h-40"
                    />
                  </div>
                )}

                {/* Existing Owner Reply */}
                {rev.ownerReply && (
                  <div className="mt-2.5 p-4 bg-[#fffcf8] border-l-2 border-[#b76548] rounded-r-2xl text-xs flex flex-col gap-1.5 shadow-[0_2px_8px_rgba(77,49,31,0.04)] animate-in slide-in-from-top-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-[#b76548] flex items-center gap-1">
                        <BadgeCheck size={11} className="fill-[#b76548] text-white" />
                        {t('review_form.owner_reply', 'Phản hồi từ chủ quán')}
                      </span>
                      {rev.ownerReplyCreatedAt && (
                        <span className="font-mono text-[8px] uppercase tracking-widest text-[#1a1a1a]/45">
                          {new Date(rev.ownerReplyCreatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-xs text-[#4c4038] leading-relaxed font-light italic">
                      "{rev.ownerReply}"
                    </p>
                  </div>
                )}

                {/* Owner Reply Button (only if logged-in user is the owner of this restaurant) */}
                {user && user.role === 'Owner' && user.restaurantId === restaurant.id && (
                  <div className="mt-2 flex flex-col gap-2 border-t border-dashed border-[#4b362a]/10 pt-2">
                    {activeReplyId !== rev.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveReplyId(rev.id);
                          setReplyValue(rev.ownerReply || '');
                        }}
                        className="self-start text-[10px] font-mono uppercase tracking-wider font-extrabold text-[#e2533b] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <MessageSquare size={12} />
                        {rev.ownerReply ? t('review_form.edit_reply_btn', 'Sửa phản hồi') : t('review_form.reply_btn', 'Phản hồi')}
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2 mt-1 animate-in slide-in-from-top-1">
                        <span className="font-mono text-[9px] uppercase font-bold text-[#b76548]">
                          {rev.ownerReply ? t('review_form.edit_reply_btn', 'Sửa phản hồi') : t('review_form.reply_btn', 'Phản hồi')}
                        </span>
                        <textarea
                          value={replyValue}
                          onChange={(e) => setReplyValue(e.target.value.slice(0, 1000))}
                          placeholder={t('review_form.reply_placeholder', 'Nhập lời cảm ơn hoặc phản hồi của chủ quán...')}
                          className="w-full bg-[#fdfcf9] border border-[#1a1a1a]/15 p-2 font-sans text-xs text-[#1a1a1a] focus:outline-none focus:border-[#e2533b] min-h-[60px] resize-none"
                        />
                        <div className="flex justify-end gap-2 font-mono text-[9px] uppercase font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReplyId(null);
                              setReplyValue('');
                            }}
                            className="px-3 py-1 border border-[#1a1a1a]/15 bg-white text-[#1a1a1a] hover:bg-[#fdfcf9] cursor-pointer"
                          >
                            {t('review_form.cancel', 'Hủy')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendDetailReply(rev.id)}
                            disabled={replySubmitting}
                            className="px-4 py-1 bg-[#1a1a1a] hover:bg-[#e2533b] text-white cursor-pointer disabled:opacity-50"
                          >
                            {replySubmitting ? t('profile.saving', 'Đang lưu...') : t('review_form.submit', 'Gửi')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
            )}
          </div>
        </section>

      </main>

      {/* Sticky Bottom Action Sheet Row */}
      <div className="fixed bottom-20 left-0 w-full bg-[#fffaf4]/86 border-t border-white/70 px-4 py-3 shadow-[0_-18px_46px_rgba(77,49,31,0.12)] z-[70] flex justify-center pb-safe backdrop-blur-xl md:bottom-0">
        <button 
          onClick={onOpenBooking}
          className="foodio-btn foodio-btn-primary h-12 w-full max-w-md !py-0 font-mono text-[10px] uppercase tracking-widest text-center cursor-pointer"
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
