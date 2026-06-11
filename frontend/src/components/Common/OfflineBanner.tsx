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
    <div className="fixed top-[72px] left-0 w-full z-45 bg-[#fee2e2] border-b-2 border-[#1a1a1a] px-4 py-2.5 flex items-center justify-center gap-2 font-mono text-[10px] sm:text-xs font-bold text-red-800 shadow-sm animate-in slide-in-from-top-4 select-none">
      <WifiOff size={14} className="animate-pulse" />
      <span>{t('offline.banner_text')}</span>
    </div>
  );
}
