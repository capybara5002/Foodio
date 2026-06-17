import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { confirmPayment, createPaymentIntent, validatePayment } from '../api/paymentApi';
import { PaymentAccessType, PaymentSession } from '../types';

interface PaymentContextType {
  paymentSession: PaymentSession | null;
  paymentIntent: PaymentSession | null;
  isCheckingPayment: boolean;
  isProcessingPayment: boolean;
  paymentError: string;
  hasActivePayment: boolean;
  startPayment: (accessType: PaymentAccessType) => Promise<PaymentSession>;
  completePayment: () => Promise<PaymentSession>;
  clearPayment: () => void;
  refreshPayment: () => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

const tokenCookie = 'foodio_payment_token';
const expiresCookie = 'foodio_payment_expires_at';
const accessCookie = 'foodio_payment_access_type';
const authResetStorageKey = 'foodio_payment_auth_reset_token';

const readCookie = (name: string) => {
  if (typeof document === 'undefined') return '';
  const prefix = `${name}=`;
  const item = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return item ? decodeURIComponent(item.slice(prefix.length)) : '';
};

const writeCookie = (name: string, value: string, maxAgeSeconds: number) => {
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}; Path=/; SameSite=Lax`;
};

const removeCookie = (name: string) => {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
};

const secondsUntil = (expiresAt?: string | null) => {
  if (!expiresAt) return 0;
  const expiresMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresMs)) return 0;
  return Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
};

const isSessionActive = (session: PaymentSession | null) =>
  Boolean(session?.isActive && secondsUntil(session.expiresAt) > 0);

const persistPaymentSession = (session: PaymentSession) => {
  const maxAge = session.remainingSeconds > 0 ? session.remainingSeconds : secondsUntil(session.expiresAt);
  if (!session.expiresAt || maxAge <= 0) return;

  writeCookie(tokenCookie, session.clientToken, maxAge);
  writeCookie(expiresCookie, session.expiresAt, maxAge);
  writeCookie(accessCookie, session.accessType, maxAge);
};

const clearPaymentCookies = () => {
  removeCookie(tokenCookie);
  removeCookie(expiresCookie);
  removeCookie(accessCookie);
};

const clearSavedAuthSession = () => {
  localStorage.removeItem('foodio_user');
  window.dispatchEvent(new Event('foodio_auth_cleared'));
};

const markAuthResetForPayment = (clientToken: string) => {
  localStorage.setItem(authResetStorageKey, clientToken);
};

const clearPaymentResetMarker = () => {
  localStorage.removeItem(authResetStorageKey);
};

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentSession | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const clearPayment = useCallback(() => {
    clearPaymentCookies();
    clearPaymentResetMarker();
    clearSavedAuthSession();
    setPaymentSession(null);
    setPaymentIntent(null);
  }, []);

  const refreshPayment = useCallback(async () => {
    const token = readCookie(tokenCookie);
    const expiresAt = readCookie(expiresCookie);

    if (!token || !expiresAt || secondsUntil(expiresAt) <= 0) {
      clearPayment();
      return;
    }

    const validated = await validatePayment(token);
    if (validated && isSessionActive(validated)) {
      if (localStorage.getItem(authResetStorageKey) !== validated.clientToken) {
        clearSavedAuthSession();
        markAuthResetForPayment(validated.clientToken);
      }

      persistPaymentSession(validated);
      setPaymentSession(validated);
      setPaymentError('');
      return;
    }

    clearPayment();
  }, [clearPayment]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        await refreshPayment();
      } catch (error) {
        if (!cancelled) {
          clearPayment();
          setPaymentError(error instanceof Error ? error.message : 'Could not verify payment pass.');
        }
      } finally {
        if (!cancelled) {
          setIsCheckingPayment(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [clearPayment, refreshPayment]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPaymentSession((current) => {
        if (!current) return current;
        const remainingSeconds = secondsUntil(current.expiresAt);
        if (remainingSeconds <= 0) {
          clearPaymentCookies();
          clearPaymentResetMarker();
          clearSavedAuthSession();
          return null;
        }

        return { ...current, remainingSeconds };
      });
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const startPayment = useCallback(async (accessType: PaymentAccessType) => {
    setIsProcessingPayment(true);
    setPaymentError('');
    try {
      const intent = await createPaymentIntent(accessType);
      setPaymentIntent(intent);
      return intent;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create payment QR.';
      setPaymentError(message);
      throw error;
    } finally {
      setIsProcessingPayment(false);
    }
  }, []);

  const completePayment = useCallback(async () => {
    if (!paymentIntent) {
      throw new Error('Create a payment QR before confirming payment.');
    }

    setIsProcessingPayment(true);
    setPaymentError('');
    try {
      const session = await confirmPayment(paymentIntent.clientToken);
      if (!isSessionActive(session)) {
        throw new Error('Payment was confirmed but the pass is not active.');
      }

      persistPaymentSession(session);
      clearSavedAuthSession();
      markAuthResetForPayment(session.clientToken);
      setPaymentSession(session);
      setPaymentIntent(null);
      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not confirm payment.';
      setPaymentError(message);
      throw error;
    } finally {
      setIsProcessingPayment(false);
    }
  }, [paymentIntent]);

  const value = useMemo<PaymentContextType>(() => ({
    paymentSession,
    paymentIntent,
    isCheckingPayment,
    isProcessingPayment,
    paymentError,
    hasActivePayment: isSessionActive(paymentSession),
    startPayment,
    completePayment,
    clearPayment,
    refreshPayment
  }), [
    paymentSession,
    paymentIntent,
    isCheckingPayment,
    isProcessingPayment,
    paymentError,
    startPayment,
    completePayment,
    clearPayment,
    refreshPayment
  ]);

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }

  return context;
};
