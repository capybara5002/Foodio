import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, CheckCircle2, ChevronDown, Clock3, Globe, Loader2, LockKeyhole, QrCode, Search, ShieldCheck, WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PaymentAccessType } from '../../types';
import { usePayment } from '../../context/PaymentContext';
import { useLanguage } from '../../hooks/useLanguage';

interface PaymentGateProps {
  children: ReactNode;
}

const plans: Array<{
  type: PaymentAccessType;
  labelKey: string;
  descriptionKey: string;
  price: number;
}> = [
  {
    type: 'Customer',
    labelKey: 'payment.plans.customer.label',
    descriptionKey: 'payment.plans.customer.description',
    price: 19000
  },
  {
    type: 'Owner',
    labelKey: 'payment.plans.owner.label',
    descriptionKey: 'payment.plans.owner.description',
    price: 49000
  }
];

const normalizeString = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0111\u0110]/g, 'd')
    .toLowerCase();

const formatCurrency = (value: number) => {
  try {
    return `${new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: 0
    }).format(value)} đ`;
  } catch {
    return `${value.toLocaleString('vi-VN')} đ`;
  }
};

export default function PaymentGate({ children }: PaymentGateProps) {
  const { t } = useTranslation();
  const { language, languages, changeLanguage, isLoadingLanguage } = useLanguage();
  const {
    hasActivePayment,
    isCheckingPayment,
    isProcessingPayment,
    paymentIntent,
    paymentError,
    startPayment,
    completePayment
  } = usePayment();
  const [accessType, setAccessType] = useState<PaymentAccessType>('Customer');
  const [notice, setNotice] = useState('');
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [languageQuery, setLanguageQuery] = useState('');
  const languageMenuRef = useRef<HTMLDivElement | null>(null);

  const filteredLanguages = useMemo(() => {
    const query = normalizeString(languageQuery.trim());
    if (!query) return languages;

    return languages.filter((item) => {
      const searchText = normalizeString(`${item.code} ${item.label} ${item.nativeLabel}`);
      return searchText.includes(query);
    });
  }, [languageQuery, languages]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!languageMenuRef.current?.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const selectLanguage = async (nextLanguage: string) => {
    const changed = await changeLanguage(nextLanguage);
    if (changed) {
      setIsLanguageMenuOpen(false);
      setLanguageQuery('');
    }
  };

  if (isCheckingPayment) {
    return (
      <div className="foodio-shell flex min-h-screen items-center justify-center bg-[#f6efe7] px-4 text-[#2c211b]">
        <div className="flex items-center gap-3 rounded-full border border-[#4b362a]/10 bg-[#fffaf4]/90 px-5 py-3 shadow-[0_18px_46px_rgba(77,49,31,0.14)]">
          <Loader2 className="h-5 w-5 animate-spin text-[#b76548]" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">{t('payment.checking')}</span>
        </div>
      </div>
    );
  }

  if (hasActivePayment) {
    return <>{children}</>;
  }

  const intentPlan = plans.find((plan) => plan.type === paymentIntent?.accessType);
  const qrImageUrl = paymentIntent
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(paymentIntent.qrPayload)}&color=2c211b&bgcolor=fffaf4`
    : '';

  const handleCreateQr = async () => {
    setNotice('');
    try {
      await startPayment(accessType);
      setNotice(t('payment.qr_ready'));
    } catch {
      setNotice('');
    }
  };

  const handleConfirm = async () => {
    setNotice('');
    try {
      await completePayment();
    } catch {
      setNotice('');
    }
  };

  return (
    <main className="foodio-shell min-h-screen bg-[#f6efe7] px-4 py-6 text-[#2c211b] md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-6xl flex-col justify-center gap-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2c211b] text-[#fffaf4] shadow-[0_14px_34px_rgba(44,33,27,0.24)]">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#b76548]">{t('payment.access_label')}</p>
              <h1 className="font-serif text-3xl font-black italic leading-tight md:text-5xl">{t('payment.title')}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="relative shrink-0" ref={languageMenuRef}>
              <button
                type="button"
                onClick={() => setIsLanguageMenuOpen((open) => !open)}
                disabled={isLoadingLanguage}
                className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-[#4b362a]/10 bg-[#fffaf4]/82 px-3 text-xs font-bold text-[#2c211b] shadow-[0_12px_32px_rgba(77,49,31,0.12)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white active:scale-[0.98] disabled:cursor-wait disabled:text-[#1a1a1a]/35"
                aria-label={t('profile.app_language')}
                aria-expanded={isLanguageMenuOpen}
              >
                <Globe size={15} className="text-[#b76548]" />
                <span>{language.toUpperCase()}</span>
                <ChevronDown size={13} className={`transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLanguageMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] z-[120] w-72 overflow-hidden rounded-[1.35rem] border border-[#4b362a]/10 bg-[#fffaf4] shadow-[0_24px_70px_rgba(77,49,31,0.2)]">
                  <div className="flex items-center gap-2 border-b border-[#4b362a]/10 px-3 py-2.5">
                    <Search size={14} className="shrink-0 text-[#b76548]" />
                    <input
                      value={languageQuery}
                      onChange={(event) => setLanguageQuery(event.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#2c211b] outline-none placeholder:text-[#8d8074]"
                      placeholder="Search language..."
                      autoFocus
                    />
                  </div>

                  <div className="max-h-80 overflow-y-auto py-1 hide-scrollbar">
                    {filteredLanguages.map((item) => {
                      const isActive = item.code === language;

                      return (
                        <button
                          key={item.code}
                          type="button"
                          disabled={isLoadingLanguage}
                          onClick={() => void selectLanguage(item.code)}
                          className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors disabled:cursor-wait ${isActive ? 'bg-[#2c211b] text-[#fffaf4]' : 'text-[#2c211b] hover:bg-white'}`}
                        >
                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-black uppercase ${isActive ? 'bg-[#fffaf4] text-[#2c211b]' : 'bg-[#f0e5d8] text-[#8f4f3b]'}`}>
                            {item.code}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold">{item.nativeLabel}</span>
                            <span className={`block truncate text-[10px] font-semibold ${isActive ? 'text-[#fffaf4]/70' : 'text-[#6f655b]'}`}>
                              {item.label}
                            </span>
                          </span>
                          {isActive && <Check size={15} className="shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-[#4b362a]/10 bg-[#fffaf4]/82 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#6f655b] shadow-[0_12px_32px_rgba(77,49,31,0.12)] md:flex">
              <Clock3 className="h-4 w-4 text-[#b76548]" />
              <span>{t('payment.open_24h')}</span>
            </div>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
          <div className="rounded-[1.5rem] border border-[#4b362a]/10 bg-[#fffaf4]/90 p-4 shadow-[0_24px_70px_rgba(77,49,31,0.14)] md:p-6">
            <div className="mb-5 flex items-center gap-2">
              <WalletCards className="h-5 w-5 text-[#b76548]" />
              <h2 className="font-serif text-2xl font-black italic">{t('payment.choose_plan')}</h2>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {plans.map((plan) => {
                const selected = accessType === plan.type;
                return (
                  <button
                    key={plan.type}
                    type="button"
                    onClick={() => setAccessType(plan.type)}
                    className={`min-h-36 rounded-[1.15rem] border p-4 text-left transition-all duration-500 active:scale-[0.99] ${selected
                        ? 'border-[#b76548] bg-[#f5e3d8] shadow-[0_14px_34px_rgba(183,101,72,0.18)]'
                        : 'border-[#4b362a]/10 bg-white/74 hover:border-[#b76548]/40'
                      }`}
                  >
                    <span className="mb-4 flex items-center justify-between gap-3">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#8f4f3b]">{t(plan.labelKey)}</span>
                      {selected && <CheckCircle2 className="h-5 w-5 text-[#b76548]" />}
                    </span>
                    <span className="block font-serif text-3xl font-black italic">{formatCurrency(plan.price)}</span>
                    <span className="mt-3 block text-sm leading-6 text-[#6f655b]">{t(plan.descriptionKey)}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-[1rem] border border-[#4b362a]/10 bg-white/70 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#b76548]" />
                <div>
                  <p className="text-sm font-semibold text-[#2c211b]">{t('payment.pass_note_title')}</p>
                  <p className="mt-1 text-sm leading-6 text-[#6f655b]">{t('payment.pass_note_body')}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateQr}
              disabled={isProcessingPayment}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2c211b] px-5 text-sm font-black uppercase tracking-[0.18em] text-[#fffaf4] shadow-[0_18px_46px_rgba(44,33,27,0.22)] transition-all duration-500 hover:bg-[#3c2b23] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isProcessingPayment ? <Loader2 className="h-5 w-5 animate-spin" /> : <QrCode className="h-5 w-5" />}
              <span>{paymentIntent ? t('payment.create_new_qr') : t('payment.create_qr')}</span>
            </button>
          </div>

          <aside className="rounded-[1.5rem] border border-[#4b362a]/10 bg-[#fffaf4]/90 p-4 shadow-[0_24px_70px_rgba(77,49,31,0.14)] md:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-[#4b362a]/10 pb-4">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#b76548]">{t('payment.qr_label')}</p>
                <h2 className="mt-1 font-serif text-2xl font-black italic">{t('payment.scan_title')}</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0e5d8] text-[#8f4f3b]">
                <QrCode className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 flex flex-col items-center gap-4">
              <div className="flex aspect-square w-full max-w-[260px] items-center justify-center rounded-[1.25rem] border border-[#4b362a]/10 bg-white p-3">
                {paymentIntent ? (
                  <img
                    src={qrImageUrl}
                    alt={t('payment.qr_alt')}
                    className="h-full w-full rounded-[0.9rem] object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-[0.9rem] bg-[#f5eadf] text-center text-[#6f655b]">
                    <QrCode className="mb-3 h-12 w-12 text-[#b76548]" />
                    <p className="max-w-44 text-sm font-semibold leading-6">{t('payment.qr_placeholder')}</p>
                  </div>
                )}
              </div>

              {paymentIntent ? (
                <div className="w-full rounded-[1rem] border border-[#4b362a]/10 bg-white/72 p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#8d8074]">{t('payment.plan_label')}</p>
                      <p className="mt-1 font-semibold">{intentPlan ? t(intentPlan.labelKey) : paymentIntent.accessType}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#8d8074]">{t('payment.amount_label')}</p>
                      <p className="mt-1 font-semibold">{formatCurrency(paymentIntent.amount)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#8d8074]">{t('payment.reference_label')}</p>
                      <p className="mt-1 break-all font-mono text-xs font-bold text-[#2c211b]">{paymentIntent.paymentReference}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {(paymentError || notice) && (
                <p className={`w-full rounded-full px-4 py-2 text-center text-xs font-semibold ${paymentError ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
                  {paymentError || notice}
                </p>
              )}

              <button
                type="button"
                onClick={handleConfirm}
                disabled={!paymentIntent || isProcessingPayment}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#b76548] px-5 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_46px_rgba(183,101,72,0.22)] transition-all duration-500 hover:bg-[#9e533c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessingPayment ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                <span>{t('payment.confirm_paid')}</span>
              </button>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
