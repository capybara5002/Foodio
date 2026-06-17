import { useState, type ReactNode } from 'react';
import { CheckCircle2, Clock3, Loader2, LockKeyhole, QrCode, ShieldCheck, WalletCards } from 'lucide-react';
import { PaymentAccessType } from '../../types';
import { usePayment } from '../../context/PaymentContext';

interface PaymentGateProps {
  children: ReactNode;
}

const plans: Array<{
  type: PaymentAccessType;
  label: string;
  description: string;
  price: number;
}> = [
  {
    type: 'Customer',
    label: 'Khach hang',
    description: 'Mo Food Map, Discover, Inbox va dat ban trong 24h.',
    price: 19000
  },
  {
    type: 'Owner',
    label: 'Chu quan',
    description: 'Mo app va khu quan ly quan trong 24h.',
    price: 49000
  }
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

export default function PaymentGate({ children }: PaymentGateProps) {
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

  if (isCheckingPayment) {
    return (
      <div className="foodio-shell flex min-h-screen items-center justify-center bg-[#f6efe7] px-4 text-[#2c211b]">
        <div className="flex items-center gap-3 rounded-full border border-[#4b362a]/10 bg-[#fffaf4]/90 px-5 py-3 shadow-[0_18px_46px_rgba(77,49,31,0.14)]">
          <Loader2 className="h-5 w-5 animate-spin text-[#b76548]" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">Dang kiem tra payment pass</span>
        </div>
      </div>
    );
  }

  if (hasActivePayment) {
    return <>{children}</>;
  }

  const selectedPlan = plans.find((plan) => plan.type === accessType) ?? plans[0];
  const intentPlan = plans.find((plan) => plan.type === paymentIntent?.accessType);
  const qrImageUrl = paymentIntent
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(paymentIntent.qrPayload)}&color=2c211b&bgcolor=fffaf4`
    : '';

  const handleCreateQr = async () => {
    setNotice('');
    try {
      await startPayment(accessType);
      setNotice('QR da san sang. Quet ma va xac nhan de mo app 24h.');
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
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#b76548]">Foodio Access</p>
              <h1 className="font-serif text-3xl font-black italic leading-tight md:text-5xl">Thanh toan de vao app</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#4b362a]/10 bg-[#fffaf4]/82 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#6f655b] shadow-[0_12px_32px_rgba(77,49,31,0.12)] md:flex">
            <Clock3 className="h-4 w-4 text-[#b76548]" />
            <span>Mo trong 24h</span>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
          <div className="rounded-[1.5rem] border border-[#4b362a]/10 bg-[#fffaf4]/90 p-4 shadow-[0_24px_70px_rgba(77,49,31,0.14)] md:p-6">
            <div className="mb-5 flex items-center gap-2">
              <WalletCards className="h-5 w-5 text-[#b76548]" />
              <h2 className="font-serif text-2xl font-black italic">Chon goi truy cap</h2>
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
                      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#8f4f3b]">{plan.label}</span>
                      {selected && <CheckCircle2 className="h-5 w-5 text-[#b76548]" />}
                    </span>
                    <span className="block font-serif text-3xl font-black italic">{formatCurrency(plan.price)}</span>
                    <span className="mt-3 block text-sm leading-6 text-[#6f655b]">{plan.description}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-[1rem] border border-[#4b362a]/10 bg-white/70 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#b76548]" />
                <div>
                  <p className="text-sm font-semibold text-[#2c211b]">Cookie payment pass het han sau 24h.</p>
                  <p className="mt-1 text-sm leading-6 text-[#6f655b]">Het han thi Foodio tu dong khoa app va yeu cau thanh toan lai.</p>
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
              <span>{paymentIntent ? 'Tao QR moi' : 'Tao QR thanh toan'}</span>
            </button>
          </div>

          <aside className="rounded-[1.5rem] border border-[#4b362a]/10 bg-[#fffaf4]/90 p-4 shadow-[0_24px_70px_rgba(77,49,31,0.14)] md:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-[#4b362a]/10 pb-4">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#b76548]">QR Payment</p>
                <h2 className="mt-1 font-serif text-2xl font-black italic">Quet ma</h2>
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
                    alt="Foodio payment QR"
                    className="h-full w-full rounded-[0.9rem] object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-[0.9rem] bg-[#f5eadf] text-center text-[#6f655b]">
                    <QrCode className="mb-3 h-12 w-12 text-[#b76548]" />
                    <p className="max-w-44 text-sm font-semibold leading-6">Tao QR de bat dau thanh toan</p>
                  </div>
                )}
              </div>

              {paymentIntent ? (
                <div className="w-full rounded-[1rem] border border-[#4b362a]/10 bg-white/72 p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#8d8074]">Goi</p>
                      <p className="mt-1 font-semibold">{intentPlan?.label ?? paymentIntent.accessType}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#8d8074]">So tien</p>
                      <p className="mt-1 font-semibold">{formatCurrency(paymentIntent.amount)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#8d8074]">Noi dung</p>
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
                <span>Toi da thanh toan</span>
              </button>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
