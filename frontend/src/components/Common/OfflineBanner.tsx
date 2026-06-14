import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-[82px] left-1/2 z-[75] -translate-x-1/2 rounded-full bg-red-50/92 border border-red-200 px-4 py-2.5 flex items-center justify-center gap-2 font-mono text-[10px] sm:text-xs font-bold text-red-800 shadow-[0_18px_46px_rgba(77,49,31,0.14)] backdrop-blur-xl animate-in slide-in-from-top-4 select-none">
      <WifiOff size={14} className="animate-pulse" />
      <span>{t('offline.banner_text')}</span>
    </div>
  );
}
