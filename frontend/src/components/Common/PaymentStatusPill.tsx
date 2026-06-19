import { useEffect, useState } from 'react';
import { Clock3, RotateCw } from 'lucide-react';
import { usePayment } from '../../context/PaymentContext';

interface PaymentStatusPillProps {
  placement?: 'floating' | 'header' | 'mobile-header';
}

const secondsUntil = (expiresAt?: string | null) => {
  if (!expiresAt) return 0;
  const expiresMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresMs)) return 0;
  return Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
};

const formatTimeLeft = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours <= 0) {
    return `${Math.max(1, minutes)}m`;
  }

  return `${hours}h ${minutes}m`;
};

export default function PaymentStatusPill({ placement = 'floating' }: PaymentStatusPillProps) {
  const { paymentSession, clearPayment } = usePayment();
  const [timeLeft, setTimeLeft] = useState(() => secondsUntil(paymentSession?.expiresAt));

  useEffect(() => {
    setTimeLeft(secondsUntil(paymentSession?.expiresAt));
    const timer = window.setInterval(() => {
      setTimeLeft(secondsUntil(paymentSession?.expiresAt));
    }, 60000);

    return () => window.clearInterval(timer);
  }, [paymentSession?.expiresAt]);

  if (!paymentSession?.isActive) {
    return null;
  }

  const wrapperClass =
    placement === 'header'
      ? 'hidden lg:flex h-10 shrink-0 items-center gap-2 rounded-full border border-[#4b362a]/10 bg-white/74 px-3 text-[#2c211b] shadow-[inset_0_1px_1px_rgba(255,255,255,0.75)] backdrop-blur-xl'
      : placement === 'mobile-header'
        ? 'flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-[#4b362a]/10 bg-white/74 px-2 text-[#2c211b] shadow-[inset_0_1px_1px_rgba(255,255,255,0.75)] backdrop-blur-xl md:hidden'
        : 'fixed right-3 top-[84px] z-[72] flex items-center gap-2 rounded-full border border-[#4b362a]/10 bg-[#fffaf4]/88 px-3 py-2 text-[#2c211b] shadow-[0_18px_46px_rgba(77,49,31,0.14)] backdrop-blur-xl md:hidden';
  const iconClass =
    placement === 'mobile-header'
      ? 'h-3.5 w-3.5 shrink-0 text-[#b76548] max-[360px]:hidden'
      : 'h-4 w-4 shrink-0 text-[#b76548]';
  const textClass =
    placement === 'mobile-header'
      ? 'min-w-0 whitespace-nowrap font-mono text-[9px] font-bold uppercase tracking-[0.14em]'
      : 'whitespace-nowrap font-mono text-[10px] font-bold uppercase tracking-wider';
  const buttonClass =
    placement === 'mobile-header'
      ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#8f4f3b] transition-colors hover:bg-[#f0e5d8] hover:text-[#2c211b]'
      : 'flex h-7 w-7 items-center justify-center rounded-full text-[#8f4f3b] transition-colors hover:bg-[#f0e5d8] hover:text-[#2c211b]';

  return (
    <div className={wrapperClass}>
      <Clock3 className={iconClass} />
      <span className={textClass}>
        Pass {formatTimeLeft(timeLeft)}
      </span>
      <button
        type="button"
        onClick={clearPayment}
        className={buttonClass}
        aria-label="Renew payment pass"
        title="Thanh toan lai"
      >
        <RotateCw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
