import React, { useEffect, useState } from 'react';
import { User, Restaurant } from '../../types';
import { Plus, Pencil, Trash2, X, Shield, Store, User as UserIcon, Ban, Users } from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'User' as 'Admin' | 'Owner' | 'User',
    restaurantId: '',
    isActive: true
  });

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersRes, restRes] = await Promise.all([
        fetch(`${baseUrl}/api/admin/users`),
        fetch(`${baseUrl}/api/cravemap/restaurants`)
      ]);

      if (!usersRes.ok || !restRes.ok) throw new Error('Failed to fetch dashboard data.');

      const usersData = await usersRes.json();
      const restData = await restRes.json();

      setUsers(usersData);
      setRestaurants(restData);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'User',
      restaurantId: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Leave blank unless changing
      role: user.role as 'Admin' | 'Owner' | 'User',
      restaurantId: user.restaurantId || '',
      isActive: user.isActive
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const res = await fetch(`${baseUrl}/api/admin/users/${userId}/toggle-status`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to toggle user status.');
      const updatedUser = await res.json();
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;
    try {
      const res = await fetch(`${baseUrl}/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete user.');
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser
        ? `${baseUrl}/api/admin/users/${editingUser.id}`
        : `${baseUrl}/api/admin/users`;

      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to save user.');
      }

      const savedUser = await res.json();
      if (editingUser) {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? savedUser : u));
      } else {
        setUsers(prev => [savedUser, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error saving user.');
    }
  };

  // Stats
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'Admin').length;
  const ownerCount = users.filter(u => u.role === 'Owner').length;
  const customerCount = users.filter(u => u.role === 'User').length;
  const suspendedCount = users.filter(u => !u.isActive).length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#1a1a1a]/60">
        <span className="animate-spin text-3xl">⏳</span>
        <span className="font-mono text-xs mt-2 uppercase tracking-widest font-bold">Loading accounts list...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-[#1a1a1a]">
      {/* Bento Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col justify-between">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/55 font-bold flex items-center gap-1">
            <Users size={12} /> Tổng tài khoản
          </span>
          <span className="font-serif italic font-bold text-3xl text-[#1a1a1a] mt-1">{totalUsers}</span>
        </div>
        <div className="bg-white p-4 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col justify-between">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/55 font-bold flex items-center gap-1">
            <Shield size={12} /> Admin
          </span>
          <span className="font-serif italic font-bold text-3xl text-[#1a1a1a] mt-1">{adminCount}</span>
        </div>
        <div className="bg-white p-4 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col justify-between">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/55 font-bold flex items-center gap-1">
            <Store size={12} /> Chủ quán
          </span>
          <span className="font-serif italic font-bold text-3xl text-[#1a1a1a] mt-1">{ownerCount}</span>
        </div>
        <div className="bg-white p-4 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col justify-between">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/55 font-bold flex items-center gap-1">
            <UserIcon size={12} /> Thực khách
          </span>
          <span className="font-serif italic font-bold text-3xl text-[#1a1a1a] mt-1">{customerCount}</span>
        </div>
        <div className="bg-[#fff0f0] p-4 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#e2533b] font-bold flex items-center gap-1">
            <Ban size={12} /> Đang khóa
          </span>
          <span className="font-serif italic font-bold text-3xl text-[#e2533b] mt-1">{suspendedCount}</span>
        </div>
      </div>

      {/* Main List Box */}
      <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#1a1a1a] p-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#1a1a1a]/15 pb-4">
          <div>
            <h3 className="font-serif italic font-bold text-lg">Danh sách Tài khoản</h3>
            <p className="font-mono text-[9px] text-[#1a1a1a]/55 uppercase tracking-wider mt-0.5">ADMIN SECURITY TERMINAL</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="bg-[#1a1a1a] hover:bg-[#e2533b] text-white font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 shadow border-2 border-[#1a1a1a] transition-all cursor-pointer flex items-center gap-1.5 active:translate-y-0.5"
          >
            <Plus size={13} strokeWidth={3} />
            Thêm tài khoản
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-xs font-mono font-bold text-[#e2533b] p-3">
            Error: {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-[#1a1a1a] bg-[#f9f7f2] font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/60">
                <th className="py-2.5 px-3">Tên đăng nhập</th>
                <th className="py-2.5 px-3">Địa chỉ Email</th>
                <th className="py-2.5 px-3">Vai trò</th>
                <th className="py-2.5 px-3">Liên kết quán</th>
                <th className="py-2.5 px-3">Trạng thái</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]/10">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-[#fcfbfa]/50 transition-colors">
                  <td className="py-3 px-3 font-semibold">{u.username}</td>
                  <td className="py-3 px-3 font-mono">{u.email}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-extrabold tracking-wider shadow-xs ${u.role === 'Admin' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                        u.role === 'Owner' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                          'bg-gray-100 text-gray-800 border border-gray-300'
                      }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-serif italic text-xs text-[#1a1a1a]/60">
                    {u.role === 'Owner'
                      ? (restaurants.find(r => r.id === u.restaurantId)?.name || u.restaurantId || 'Chưa liên kết')
                      : '-'
                    }
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => handleToggleStatus(u.id)}
                      className={`px-2 py-0.5 rounded-none font-mono text-[8px] uppercase tracking-wider font-extrabold cursor-pointer border shadow-xs ${u.isActive
                          ? 'bg-[#cbf3d2] text-green-900 border-green-400 hover:bg-green-200'
                          : 'bg-[#f8d7da] text-red-900 border-red-400 hover:bg-red-200'
                        }`}
                    >
                      {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="w-7 h-7 flex items-center justify-center border border-[#1a1a1a]/20 hover:border-[#1a1a1a] hover:bg-[#f9f7f2] bg-white cursor-pointer transition-colors shadow-xs"
                        title="Chỉnh sửa"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="w-7 h-7 flex items-center justify-center border border-[#1a1a1a]/20 hover:border-red-500 hover:bg-red-50 bg-white cursor-pointer transition-colors text-red-500 shadow-xs"
                        title="Xóa tài khoản"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Add/Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#fdfcf9] border-3 border-[#1a1a1a] shadow-[8px_8px_0px_0px_#1a1a1a] p-6 text-[#1a1a1a] relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border-2 border-[#1a1a1a] bg-white hover:bg-[#e2533b] hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} strokeWidth={3} />
            </button>

            <div className="mb-4">
              <span className="text-[9px] tracking-[0.3em] uppercase text-[#e2533b] font-mono font-bold block mb-1">
                USER ACCOUNT CONFIGURATION
              </span>
              <h2 className="font-serif italic font-bold text-xl uppercase">
                {editingUser ? 'Sửa thông tin tài khoản' : 'Thêm tài khoản mới'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Tên người dùng</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Ex: son_hoang"
                  className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none focus:bg-[#f9f7f2]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Địa chỉ Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="name@foodio.com"
                  className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none focus:bg-[#f9f7f2]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">
                  Mật khẩu {editingUser && '(để trống nếu không đổi)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none"
                  required={!editingUser}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Vai trò</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full bg-white border-2 border-[#1a1a1a] px-2.5 py-1.5 text-sm focus:outline-none"
                  >
                    <option value="User">User (Thực khách)</option>
                    <option value="Owner">Owner (Chủ quán)</option>
                    <option value="Admin">Admin (Quản trị viên)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Trạng thái</label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                    className="w-full bg-white border-2 border-[#1a1a1a] px-2.5 py-1.5 text-sm focus:outline-none"
                  >
                    <option value="true">Hoạt động</option>
                    <option value="false">Khóa tài khoản</option>
                  </select>
                </div>
              </div>

              {formData.role === 'Owner' && (
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Quán ăn được gán</label>
                  <select
                    value={formData.restaurantId}
                    onChange={(e) => setFormData(prev => ({ ...prev, restaurantId: e.target.value }))}
                    className="w-full bg-white border-2 border-[#1a1a1a] px-2.5 py-1.5 text-sm focus:outline-none"
                    required
                  >
                    <option value="">-- Chọn quán ăn --</option>
                    {restaurants.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 bg-[#1a1a1a] text-white hover:bg-[#e2533b] py-2.5 font-mono text-xs uppercase tracking-widest border-2 border-[#1a1a1a] transition-all cursor-pointer shadow-md active:translate-y-0.5"
              >
                Lưu tài khoản
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
