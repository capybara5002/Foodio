import { PaymentAccessType, PaymentSession } from '../types';
import { apiBase } from './apiConfig';

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Accept-Language': localStorage.getItem('app_lang') || 'vi'
};

const readResponse = async (response: Response) => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Payment request failed.');
  }

  return response.json();
};

export const createPaymentIntent = async (accessType: PaymentAccessType): Promise<PaymentSession> => {
  const response = await fetch(`${apiBase}/api/payments/intent`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ accessType })
  });

  return readResponse(response);
};

export const confirmPayment = async (clientToken: string): Promise<PaymentSession> => {
  const response = await fetch(`${apiBase}/api/payments/confirm`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ clientToken, method: 'DemoQR' })
  });

  return readResponse(response);
};

export const validatePayment = async (clientToken: string): Promise<PaymentSession | null> => {
  const response = await fetch(`${apiBase}/api/payments/validate`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ clientToken })
  });

  return readResponse(response);
};
