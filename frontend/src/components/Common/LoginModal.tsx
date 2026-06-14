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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2c211b]/55 p-4 backdrop-blur-xl">
      <div className="relative w-full max-w-md rounded-[2rem] border border-white/70 bg-[#fffaf4] p-6 text-[#2c211b] shadow-[0_24px_70px_rgba(44,33,27,0.3)] animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#4b362a]/10 bg-white transition-colors hover:bg-[#f0e5d8] hover:text-[#8f4f3b]"
          aria-label="Close login modal"
        >
          <X size={15} />
        </button>

        <div className="mb-6">
          <span className="foodio-eyebrow mb-3">Secure access</span>
          <h2 className="font-serif text-4xl font-bold tracking-[-0.06em]">
            {isRegister ? t('login.register_title') : t('login.login_title')}
          </h2>
          {message && (
            <p className="mt-3 rounded-2xl border border-[#b76548]/20 bg-[#f0d5c8]/45 p-3 font-mono text-xs font-semibold text-[#8f4f3b]">
              {message}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 font-mono text-xs font-bold text-red-700">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#6f655b]">
                {t('login.username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: son_hoang"
                className="foodio-input w-full px-4 py-3 text-sm focus:outline-none"
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#6f655b]">
              {t('login.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@foodio.com"
              className="foodio-input w-full px-4 py-3 text-sm focus:outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#6f655b]">
              {t('login.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="foodio-input w-full px-4 py-3 text-sm focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="foodio-btn foodio-btn-primary w-full cursor-pointer font-mono text-xs uppercase tracking-widest disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : isRegister ? t('login.register_button') : t('login.login_button')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="cursor-pointer font-mono text-xs font-bold text-[#8f4f3b] hover:underline"
          >
            {isRegister ? t('login.switch_login') : t('login.switch_register')}
          </button>
        </div>

        <div className="mt-6 border-t border-dashed border-[#4b362a]/20 pt-4">
          <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-[#6f655b]">
            Development quick access
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => fillQuickLogin('customer@foodio.com', '123456')}
              className="flex cursor-pointer items-center justify-center gap-1 rounded-full border border-[#4b362a]/10 bg-white px-2 py-2 font-mono text-[9px] font-bold uppercase shadow-xs transition-all hover:border-[#b76548]/30"
            >
              <User size={10} /> Customer
            </button>
            <button
              onClick={() => fillQuickLogin('owner@foodio.com', '123456')}
              className="flex cursor-pointer items-center justify-center gap-1 rounded-full border border-[#4b362a]/10 bg-white px-2 py-2 font-mono text-[9px] font-bold uppercase shadow-xs transition-all hover:border-[#b76548]/30"
            >
              <Store size={10} /> Owner
            </button>
            <button
              onClick={() => fillQuickLogin('admin@foodio.com', '123456')}
              className="flex cursor-pointer items-center justify-center gap-1 rounded-full border border-[#4b362a]/10 bg-white px-2 py-2 font-mono text-[9px] font-bold uppercase shadow-xs transition-all hover:border-[#b76548]/30"
            >
              <Shield size={10} /> Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
