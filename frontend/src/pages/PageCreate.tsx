/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, FormEvent } from 'react';
import { PRESET_IMAGES } from '../data';
import { Restaurant } from '../types';
import { X, Camera, MapPin, Utensils, Tag, Store, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ImageGallery from '../components/Common/ImageGallery';

interface PageCreateProps {
  restaurants: Restaurant[];
  onAddPost: (newPost: {
    content: string;
    image: string;
    images: string[];
    locationName: string;
    restaurantId?: string;
    postType: 'story' | 'promotion';
  }) => void;
  onCancel: () => void;
}

export default function PageCreate({ restaurants, onAddPost, onCancel }: PageCreateProps) {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<string[]>([PRESET_IMAGES[0]]);
  const [content, setContent] = useState('');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(restaurants[0]?.id ?? '');
  const [showRestaurantPicker, setShowRestaurantPicker] = useState(false);
  const [postType, setPostType] = useState<'story' | 'promotion'>('story');
  const [toast, setToast] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const selectedRestaurant = restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? restaurants[0];

  useEffect(() => {
    if (!selectedRestaurantId && restaurants[0]) {
      setSelectedRestaurantId(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurantId]);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/'));
    if (files.length === 0) return;

    try {
      const base64Photos = await Promise.all(files.map(fileToBase64));
      setPhotos((currentPhotos) => {
        const withoutPreset = currentPhotos.length === 1 && currentPhotos[0] === PRESET_IMAGES[0]
          ? []
          : currentPhotos;
        return [...withoutPreset, ...base64Photos];
      });
      setToast(`Added ${files.length} photo${files.length > 1 ? 's' : ''}`);
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error("Failed to read image files", err);
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((currentPhotos) => {
      const nextPhotos = currentPhotos.filter((_, currentIndex) => currentIndex !== index);
      return nextPhotos.length > 0 ? nextPhotos : [PRESET_IMAGES[0]];
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) {
      setToast(t('create.toast_write_experience'));
      setTimeout(() => setToast(null), 2000);
      return;
    }

    const finalPhotos = photos.length > 0 ? photos : [PRESET_IMAGES[0]];

    onAddPost({
      content: content.trim(),
      image: finalPhotos[0],
      images: finalPhotos,
      locationName: selectedRestaurant?.name || 'Foodio',
      restaurantId: selectedRestaurant?.id,
      postType
    });
  };

  return (
    <div className="foodio-page w-full min-h-[calc(100vh-72px)] pb-32 pt-8 text-on-surface">
      <div className="max-w-2xl mx-auto px-4 flex justify-between items-center py-3 bg-[#fffaf4]/88 border border-white/70 rounded-[1.75rem] shadow-[0_18px_46px_rgba(77,49,31,0.12)] mb-8 backdrop-blur-xl foodio-reveal">
        <button
          type="button"
          onClick={onCancel}
          className="text-[#6f655b] hover:text-[#8f4f3b] hover:bg-[#f0e5d8] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] p-2 active:scale-95 flex items-center justify-center cursor-pointer rounded-full"
        >
          <X size={14} strokeWidth={3} className="select-none" />
        </button>
        <span className="font-serif font-bold text-xl tracking-[-0.04em] text-[#2c211b]">
          {t('create.new_post_title', 'Create Post')}
        </span>
        <button
          type="button"
          onClick={handleSubmit}
          className="foodio-btn foodio-btn-primary py-2 px-5 font-mono text-[10px] uppercase tracking-widest cursor-pointer"
        >
          {t('create.post_button')}
        </button>
      </div>

      <main className="w-full max-w-2xl mx-auto px-4 flex flex-col gap-6 foodio-reveal foodio-reveal-delay-1">
        <div className="relative rounded-[2rem] overflow-hidden shadow-[0_24px_70px_rgba(77,49,31,0.15)] border border-white/70">
          <ImageGallery images={photos} alt={t('create.alt_food')} className="aspect-[16/10]" />

          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="absolute left-4 top-4 bg-[#fffaf4]/92 text-on-surface px-4 py-2 rounded-full flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider font-bold shadow-[0_18px_46px_rgba(77,49,31,0.18)] border border-white/70 backdrop-blur-xl cursor-pointer"
          >
            <Camera size={16} />
            <span>Add photos</span>
          </button>

          {selectedRestaurant && (
            <div className="absolute bottom-4 right-4 bg-[#fffaf4]/90 text-[#2c211b] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_12px_30px_rgba(77,49,31,0.14)] border border-white/60 backdrop-blur-xl">
              <MapPin size={16} className="text-[#e2533b]" />
              <span className="font-mono text-[9px] uppercase tracking-wider font-bold">{selectedRestaurant.name}</span>
            </div>
          )}

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>

        <div className="bg-[#fffaf4]/92 rounded-[1.5rem] p-4 border border-white/70 shadow-[0_18px_46px_rgba(77,49,31,0.1)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#6f655b] font-extrabold">Photos</p>
              <p className="font-sans text-xs text-[#6f655b] mt-0.5">Upload as many images as you need. Feed will preview a few and open the full gallery.</p>
            </div>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#2c211b] text-white hover:bg-[#8f4f3b] transition-colors cursor-pointer"
              aria-label="Add more photos"
            >
              <Plus size={16} strokeWidth={3} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {photos.map((photo, index) => (
              <div key={`${photo}-${index}`} className="relative aspect-square overflow-hidden rounded-xl border border-[#4b362a]/10 bg-[#f0e5d8]">
                <img src={photo} alt={`Selected ${index + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-[#2c211b]/80 text-white hover:bg-[#e2533b]"
                  aria-label="Remove photo"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#fffaf4]/92 rounded-[2rem] shadow-[0_18px_46px_rgba(77,49,31,0.1)] border border-white/70 overflow-hidden transition-all">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 700))}
            className="w-full bg-transparent border-0 p-5 font-sans text-sm text-[#2c211b] placeholder:text-[#8d8074] resize-none focus:ring-0 min-h-[180px] leading-relaxed"
            placeholder={t('create.placeholder', 'Share a food story, a new dish, or a restaurant promotion...')}
          />

          <div className="bg-[#f5eadf] px-4 py-3 flex flex-col gap-3 border-t border-[#4b362a]/10 select-none text-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowRestaurantPicker((current) => !current)}
                className="flex items-center gap-1.5 bg-[#fffaf4] rounded-full px-3 py-1.5 text-[#2c211b] border border-[#4b362a]/10 hover:bg-white transition-colors shadow-xs cursor-pointer text-[9px] font-mono uppercase tracking-wider font-extrabold"
              >
                <Utensils size={14} className="text-[#e2533b]" />
                <span>{selectedRestaurant ? selectedRestaurant.name : t('create.tag_restaurant_btn')}</span>
              </button>

              <button
                type="button"
                onClick={() => setPostType((current) => current === 'story' ? 'promotion' : 'story')}
                className="flex items-center gap-1.5 bg-[#fffaf4] rounded-full px-3 py-1.5 text-[#2c211b] border border-[#4b362a]/10 hover:bg-white transition-colors shadow-xs cursor-pointer text-[9px] font-mono uppercase tracking-wider font-extrabold"
              >
                <Tag size={14} className="text-secondary" />
                <span>{postType === 'story' ? 'Story' : 'Promotion'}</span>
              </button>
            </div>

            <span className="font-mono text-[9px] text-[#1a1a1a]/40 font-bold">
              {content.length}/700
            </span>
          </div>
        </div>

        {showRestaurantPicker && (
          <div className="bg-[#fffaf4] rounded-[1.5rem] border border-white/70 shadow-[0_18px_46px_rgba(77,49,31,0.12)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#4b362a]/10 px-4 py-3">
              <div>
                <p className="font-serif text-lg font-bold tracking-[-0.04em] text-[#2c211b]">Tag restaurant</p>
                <p className="font-mono text-[9px] uppercase tracking-wider text-[#6f655b]">{restaurants.length} places available</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRestaurantPicker(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-[#f0e5d8] text-[#2c211b] hover:bg-[#2c211b] hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {restaurants.map((restaurant) => (
                <button
                  key={restaurant.id}
                  type="button"
                  onClick={() => {
                    setSelectedRestaurantId(restaurant.id);
                    setShowRestaurantPicker(false);
                  }}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all hover:bg-white cursor-pointer ${
                    selectedRestaurantId === restaurant.id
                      ? 'border-[#b76548] bg-[#fff8ef]'
                      : 'border-[#4b362a]/10 bg-[#fffaf4]'
                  }`}
                >
                  <img src={restaurant.image} alt={restaurant.name} className="h-11 w-11 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="truncate font-serif text-sm font-bold text-[#2c211b]">{restaurant.name}</p>
                    <p className="truncate font-sans text-[10px] text-[#6f655b]">{restaurant.category} - {restaurant.area}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedRestaurant && (
          <div className="bg-[#f5eadf] rounded-[1.5rem] p-4 flex items-center justify-between border border-[#4b362a]/10 shadow-xs relative overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#b76548]" />
            <div className="flex items-center gap-3 pl-2">
              <div className="w-10 h-10 rounded-2xl bg-[#2c211b] text-white flex items-center justify-center shrink-0 select-none">
                <Store size={14} className="text-white" />
              </div>
              <div>
                <h4 className="font-serif italic font-bold text-xs text-[#1a1a1a] leading-tight">{selectedRestaurant.name}</h4>
                <p className="font-sans text-[10px] text-[#1a1a1a]/60 mt-0.5 max-w-xs truncate">{selectedRestaurant.address}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#2c211b] text-white px-5 py-3 rounded-full text-xs font-semibold tracking-wider border border-white/10 shadow-[0_18px_46px_rgba(77,49,31,0.22)] z-50 animate-in fade-in slide-in-from-bottom-3">
          {toast}
        </div>
      )}
    </div>
  );
}
