/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent, useRef } from 'react';
import { PRESET_IMAGES } from '../data';
import { X, Camera, MapPin, Star, Utensils, Tag, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PageCreateProps {
  onAddPost: (newPost: {
    content: string;
    image: string;
    rating: number;
    locationName: string;
  }) => void;
  onCancel: () => void;
}

export default function PageCreate({ onAddPost, onCancel }: PageCreateProps) {
  const { t } = useTranslation();
  const [photoBase64, setPhotoBase64] = useState<string>(PRESET_IMAGES[0]);
  const [rating, setRating] = useState(4);
  const [content, setContent] = useState('');
  const [hasLocation, setHasLocation] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Dynamic feedback phrase mapping
  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 1: return t('create.rating_label_1');
      case 2: return t('create.rating_label_2');
      case 3: return t('create.rating_label_3');
      case 4: return t('create.rating_label_4');
      case 5: return t('create.rating_label_5');
      default: return t('create.select_stars');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setPhotoBase64(base64);
      setToast("Đã tải ảnh lên thành công!");
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error("Failed to read image file", err);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setToast(t('create.toast_write_experience'));
      setTimeout(() => setToast(null), 2000);
      return;
    }

    onAddPost({
      content: content.trim(),
      image: photoBase64,
      rating: rating + 0.8, // align to foodie fractional ranges, e.g. 4.8
      locationName: hasLocation ? 'Phở Quỳnh' : 'Hẻm Bùi Viện'
    });
  };

  return (
    <div className="w-full min-h-[calc(100vh-72px)] bg-[#fdfcf9] pb-24 pt-4 text-on-surface">
      
      {/* Visual top app bar structure for sub-view layout */}
      <div className="max-w-xl mx-auto px-4 flex justify-between items-center py-3 bg-white border border-[#1a1a1a]/15 rounded-none shadow-sm mb-6">
        <button 
          onClick={onCancel}
          className="text-[#1a1a1a]/60 hover:text-[#e2533b] transition-colors p-2 active:scale-95 duration-150 flex items-center justify-center cursor-pointer"
        >
          <X size={14} strokeWidth={3} className="select-none" />
        </button>
        <span className="font-serif italic font-bold text-sm text-[#1a1a1a]">{t('create.new_post_title')}</span>
        <button 
          onClick={handleSubmit}
          className="bg-[#1a1a1a] hover:bg-[#e2533b] text-white font-[#fdfcf9] font-mono text-[10px] uppercase tracking-widest px-5 py-2 rounded-none shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          {t('create.post_button')}
        </button>
      </div>

      <main className="w-full max-w-xl mx-auto px-4 flex flex-col gap-6">
        
        {/* Image Preview and Upload */}
        <div 
          onClick={() => photoInputRef.current?.click()}
          className="relative w-full aspect-video rounded-none overflow-hidden bg-[#f9f7f2] group cursor-pointer shadow-sm border border-[#1a1a1a]/15"
        >
          <img 
            src={photoBase64} 
            alt={t('create.alt_food')} 
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-transform duration-500" 
          />
          
          {/* Upload overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
            <div className="bg-white text-on-surface px-4 py-2 rounded-none flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider font-bold shadow-lg border border-[#1a1a1a]">
              <Camera size={16} />
              <span>Tải ảnh lên từ thiết bị</span>
            </div>
          </div>
 
          {/* Snail location tag badges matches image */}
          <div className="absolute bottom-4 right-4 bg-white text-[#1a1a1a] px-3 py-1.5 rounded-none flex items-center gap-1.5 shadow border border-[#1a1a1a]/15">
            <MapPin size={16} className="text-[#e2533b]" />
            <span className="font-mono text-[9px] uppercase tracking-wider font-bold">{t('create.near_bui_vien')}</span>
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>

        {/* Rating Stars specification */}
        <div className="bg-white rounded-none p-5 shadow-sm border border-[#1a1a1a]/15 flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/60 font-extrabold select-none">
            {t('create.rating_question')}
          </span>
          
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((stars) => (
              <button
                key={stars}
                type="button"
                onClick={() => setRating(stars)}
                className="hover:scale-110 transition-transform cursor-pointer"
              >
                <Star 
                  size={28} 
                  className={`select-none transition-all ${
                    stars <= rating ? 'fill-[#e2533b] text-[#e2533b]' : 'text-[#1a1a1a]/25'
                  }`} 
                />
              </button>
            ))}
          </div>

          <span className="font-serif italic font-bold text-xs text-[#e2533b] mt-1">
            {getRatingLabel(rating)}
          </span>
        </div>

        {/* Review Input Box section */}
        <div className="bg-white rounded-none shadow-sm border border-[#1a1a1a]/15 overflow-hidden transition-all">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 500))}
            className="w-full bg-transparent border-0 p-4 font-sans text-xs text-[#1a1a1a] placeholder:text-[#1a1a1a]/40 resize-none focus:ring-0 min-h-[140px] leading-relaxed font-light" 
            placeholder={t('create.placeholder')}
          />
          
          {/* Metadata action tools row */}
          <div className="bg-[#f9f7f2] px-4 py-2.5 flex items-center justify-between border-t border-[#1a1a1a]/10 select-none text-xs">
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => {
                  setToast(t('create.toast_tag_restaurant'));
                  setTimeout(() => setToast(null), 2000);
                }}
                className="flex items-center gap-1.5 bg-white rounded-none px-2.5 py-1 text-[#1a1a1a] border border-[#1a1a1a]/15 hover:bg-[#f9f7f2] transition-colors shadow-xs cursor-pointer text-[9px] font-mono uppercase tracking-wider font-extrabold"
              >
                <Utensils size={14} className="text-[#e2533b]" />
                <span>{t('create.tag_restaurant_btn')}</span>
              </button>
 
              <button 
                type="button"
                onClick={() => {
                  setToast(t('create.toast_select_category'));
                  setTimeout(() => setToast(null), 2000);
                }}
                className="flex items-center gap-1.5 bg-white rounded-none px-2.5 py-1 text-[#1a1a1a] border border-[#1a1a1a]/15 hover:bg-[#f9f7f2] transition-colors shadow-xs cursor-pointer text-[9px] font-mono uppercase tracking-wider font-extrabold"
              >
                <Tag size={14} className="text-secondary" />
                <span>{t('create.category_btn')}</span>
              </button>
            </div>

            <span className="font-mono text-[9px] text-[#1a1a1a]/40 font-bold">
              {content.length}/500
            </span>
          </div>

        </div>

        {/* Selected location context block attachment, interactive */}
        {hasLocation && (
          <div className="bg-[#f9f7f2] rounded-none p-3.5 flex items-center justify-between border border-[#1a1a1a]/15 shadow-xs relative overflow-hidden transition-all duration-300">
            {/* Left accent border */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#e2533b]" />
            
            <div className="flex items-center gap-3 pl-2">
              <div className="w-9 h-9 rounded-sm bg-[#1a1a1a] text-white flex items-center justify-center shrink-0 select-none">
                <Store size={14} className="text-white" />
              </div>
              <div>
                <h4 className="font-serif italic font-bold text-xs text-[#1a1a1a] leading-tight">Phở Quỳnh</h4>
                <p className="font-sans text-[10px] text-[#1a1a1a]/60 mt-0.5 max-w-xs truncate">323 Phạm Ngũ Lão, Quận 1</p>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => setHasLocation(false)}
              className="text-[#1a1a1a]/60 hover:text-[#e2533b] transition-colors p-1 rounded-full cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Re-attach custom store attachment */}
        {!hasLocation && (
          <button
            type="button"
            onClick={() => setHasLocation(true)}
            className="text-[#e2533b] hover:underline font-mono text-[9px] uppercase tracking-wider font-extrabold text-left self-start text-[#e2533b]"
          >
            {t('create.re_tag_location')}
          </button>
        )}

      </main>

      {/* Floating alert toast notifications */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white px-5 py-2.5 rounded-none text-xs font-semibold tracking-wider uppercase border border-[#e2533b]/20 shadow-2xl z-50 animate-bounce">
          {toast}
        </div>
      )}

    </div>
  );
}
