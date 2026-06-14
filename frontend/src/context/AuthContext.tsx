import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiBase } from '../api/apiConfig';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (username: string, email: string, password: string) => Promise<User>;
  qrLogin: (token: string) => Promise<User>;
  logout: () => void;
  clearQrSession: () => void;
  updateUserRestaurantId: (restaurantId: string) => void;
  updateAvatar: (avatarUrl: string) => Promise<User>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  syncUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load persisted user session from localStorage
    const savedUser = localStorage.getItem('foodio_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse cached user session', e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await fetch(`${apiBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Invalid email or password.');
    }

    const userData: User = await response.json();
    setUser(userData);
    localStorage.setItem('foodio_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (username: string, email: string, password: string): Promise<User> => {
    const response = await fetch(`${apiBase}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Registration failed.');
    }

    const userData: User = await response.json();
    setUser(userData);
    localStorage.setItem('foodio_user', JSON.stringify(userData));
    return userData;
  };

  const qrLogin = async (token: string): Promise<User> => {
    const response = await fetch(`${apiBase}/api/auth/qr/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'QR verification failed.');
    }

    const qrData = await response.json();
    const guestUser: User = {
      id: `guest_${Date.now()}`,
      username: `Guest (Table ${qrData.tableNumber})`,
      email: `guest_table${qrData.tableNumber}@foodio.com`,
      role: 'Guest',
      restaurantId: qrData.restaurantId,
      tableNumber: qrData.tableNumber,
      isActive: true,
    };

    setUser(guestUser);
    localStorage.setItem('foodio_user', JSON.stringify(guestUser));
    return guestUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('foodio_user');
  };

  const clearQrSession = () => {
    if (user?.role === 'Guest') {
      logout();
    }
  };

  const updateUserRestaurantId = (restaurantId: string) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, restaurantId };
      localStorage.setItem('foodio_user', JSON.stringify(updated));
      return updated;
    });
  };

  const syncUser = (updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedData };
      localStorage.setItem('foodio_user', JSON.stringify(updated));
      return updated;
    });
  };

  const updateAvatar = async (avatarUrl: string): Promise<User> => {
    if (!user) throw new Error('Not logged in');
    const response = await fetch(`${apiBase}/api/auth/update-avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: user.email, avatar: avatarUrl }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to update avatar.');
    }

    const updatedUser = await response.json();
    setUser(updatedUser);
    localStorage.setItem('foodio_user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!user) throw new Error('Not logged in');
    const response = await fetch(`${apiBase}/api/auth/update-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: user.email, currentPassword, newPassword }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to update password.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, qrLogin, logout, clearQrSession, updateUserRestaurantId, updateAvatar, updatePassword, syncUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
