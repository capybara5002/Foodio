import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, User, Store, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  message?: string;
}

export default function LoginModal({ isOpen, onClose, onSuccess, message }: LoginModalProps) {
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        if (!username.trim()) throw new Error(t('login.error_username'));
        await register(username, email, password);
      } else {
        await login(email, password);
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || t('login.error_general'));
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setIsRegister(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div
        className="w-full max-w-md bg-[#fdfcf9] border-3 border-[#1a1a1a] shadow-[8px_8px_0px_0px_#1a1a1a] p-6 text-[#1a1a1a] relative animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border-2 border-[#1a1a1a] bg-white hover:bg-[#e2533b] hover:text-white transition-colors cursor-pointer"
        >
          <X size={14} strokeWidth={3} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <span className="text-[9px] tracking-[0.3em] uppercase text-[#e2533b] font-mono font-bold block mb-1">
            SECURE TERMINAL ACCESS // AUTH
          </span>
          <h2 className="font-serif italic font-bold text-2xl uppercase">
            {isRegister ? t('login.register_title') : t('login.login_title')}
          </h2>
          {message && (
            <p className="mt-2 text-xs font-mono text-[#e2533b] bg-[#e2533b]/10 border border-[#e2533b]/25 p-2 font-semibold">
              ⚠️ {message}
            </p>
          )}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 bg-red-100 border-2 border-[#1a1a1a] p-3 text-xs font-mono font-bold text-[#e2533b]">
            Error: {error}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] uppercase font-bold tracking-wider">{t('login.username')}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: son_hoang"
                className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-2 text-sm focus:outline-none focus:bg-[#f9f7f2]"
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] uppercase font-bold tracking-wider">{t('login.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@foodio.com"
              className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-2 text-sm focus:outline-none focus:bg-[#f9f7f2]"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] uppercase font-bold tracking-wider">{t('login.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-2 text-sm focus:outline-none focus:bg-[#f9f7f2]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1a1a1a] text-white hover:bg-[#e2533b] py-3 font-mono text-xs uppercase tracking-widest border-2 border-[#1a1a1a] transition-all cursor-pointer shadow-md active:translate-y-0.5 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : (isRegister ? t('login.register_button') : t('login.login_button'))}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs font-mono font-bold text-[#e2533b] hover:underline cursor-pointer"
          >
            {isRegister ? t('login.switch_login') : t('login.switch_register')}
          </button>
        </div>

        {/* Quick Testing logins */}
        <div className="mt-6 border-t-2 border-dashed border-[#1a1a1a]/25 pt-4">
          <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-[#1a1a1a]/60 block mb-2">
            DEVELOPMENT QUICK ACCESS CREDENTIALS:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => fillQuickLogin('customer@foodio.com', '123456')}
              className="px-2 py-1.5 bg-white border border-[#1a1a1a]/25 hover:border-[#1a1a1a] text-[9px] font-mono font-bold uppercase transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <User size={10} /> Customer
            </button>
            <button
              onClick={() => fillQuickLogin('owner@foodio.com', '123456')}
              className="px-2 py-1.5 bg-white border border-[#1a1a1a]/25 hover:border-[#1a1a1a] text-[9px] font-mono font-bold uppercase transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <Store size={10} /> Owner
            </button>
            <button
              onClick={() => fillQuickLogin('admin@foodio.com', '123456')}
              className="px-2 py-1.5 bg-white border border-[#1a1a1a]/25 hover:border-[#1a1a1a] text-[9px] font-mono font-bold uppercase transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <Shield size={10} /> Admin
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
