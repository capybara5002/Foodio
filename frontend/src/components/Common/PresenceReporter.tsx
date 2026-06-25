import { useEffect } from 'react';
import { apiBase } from '../../api/apiConfig';
import { useAuth } from '../../context/AuthContext';

const visitorStorageKey = 'foodio_presence_visitor_id';
const heartbeatIntervalMs = 1_000;

const getVisitorId = () => {
  const existing = localStorage.getItem(visitorStorageKey);
  if (existing) return existing;

  const id = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  localStorage.setItem(visitorStorageKey, id);
  return id;
};

export default function PresenceReporter() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const visitorId = getVisitorId();
    const sendHeartbeat = () => {
      if (document.visibilityState === 'hidden') return;

      void fetch(`${apiBase}/api/presence/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, role: user?.role ?? 'Visitor' }),
        keepalive: true
      }).catch(() => undefined);
    };

    sendHeartbeat();
    const intervalId = window.setInterval(sendHeartbeat, heartbeatIntervalMs);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') sendHeartbeat();
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoading, user?.role]);

  return null;
}
