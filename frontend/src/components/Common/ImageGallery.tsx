import { useState } from 'react';
import { X } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  previewCount?: number;
}

export default function ImageGallery({
  images,
  alt,
  className = 'aspect-[4/3]',
  imageClassName = '',
  previewCount = 4
}: ImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const cleanImages = images.filter(Boolean);
  const previewImages = cleanImages.slice(0, previewCount);
  const extraCount = Math.max(cleanImages.length - previewImages.length, 0);

  if (cleanImages.length === 0) return null;

  const tileClass = (index: number) => {
    if (previewImages.length === 1) return 'col-span-2 row-span-2';
    if (previewImages.length === 2) return 'row-span-2';
    if (previewImages.length === 3 && index === 0) return 'row-span-2';
    return '';
  };

  return (
    <>
      <div className={`grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden bg-[#f0e5d8] ${className}`}>
        {previewImages.map((src, index) => (
          <button
            key={`${src}-${index}`}
            type="button"
            onClick={() => setIsOpen(true)}
            className={`relative min-h-0 overflow-hidden bg-[#efe2d3] ${tileClass(index)}`}
            aria-label="Open image gallery"
          >
            <img
              src={src}
              alt={alt}
              className={`h-full w-full object-cover transition-transform duration-700 hover:scale-105 ${imageClassName}`}
            />
            {extraCount > 0 && index === previewImages.length - 1 && (
              <span className="absolute inset-0 grid place-items-center bg-[#2c211b]/62 font-mono text-sm font-black uppercase tracking-wider text-white">
                +{extraCount} more
              </span>
            )}
          </button>
        ))}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-[#2c211b]/82 px-4 py-6 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative max-h-full w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/20 bg-[#fffaf4] shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#4b362a]/10 px-5 py-4">
              <div>
                <p className="font-serif text-xl font-bold tracking-[-0.04em] text-[#2c211b]">All photos</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#6f655b]">
                  {cleanImages.length} images
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-[#2c211b] text-white transition-colors hover:bg-[#8f4f3b]"
                aria-label="Close image gallery"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cleanImages.map((src, index) => (
                  <img
                    key={`${src}-full-${index}`}
                    src={src}
                    alt={`${alt} ${index + 1}`}
                    className="h-64 w-full rounded-2xl object-cover"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
