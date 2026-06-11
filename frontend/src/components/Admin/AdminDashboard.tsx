import React, { useEffect, useRef, useState } from 'react';
import { User, Restaurant, Category, AudioTour, RestaurantRequest, CommunityPost, AuditLog } from '../../types';
import { Plus, Pencil, Trash2, X, Shield, Store, User as UserIcon, Ban, Users, Unlock, MapPin, Calendar, MessageSquare, AlertTriangle, FileText, Check, Navigation, CheckCircle2, XCircle, UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AdminReviewDto {
  id: string;
  restaurantId: string;
  restaurantName: string;
  author: string;
  role: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Predefined Vĩnh Khánh location list
const LOCATION_OPTIONS = [
  'Vĩnh Khánh, Quận 4, TP.HCM',
  'Đường Vĩnh Khánh (đoạn gần Kênh Tẻ)',
  'Đường Vĩnh Khánh (đoạn Hoàng Diệu)',
  'Hẻm ốc Vĩnh Khánh',
  'Khu ẩm thực cuối đường Vĩnh Khánh',
];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'accounts' | 'requests' | 'categories' | 'tours' | 'moderation' | 'audit_logs'>('accounts');
  
  // Data lists
  const [users, setUsers] = useState<User[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [requests, setRequests] = useState<RestaurantRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tours, setTours] = useState<AudioTour[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [reviews, setReviews] = useState<AdminReviewDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Sub Tab for Moderation
  const [modSubTab, setModSubTab] = useState<'posts' | 'reviews'>('posts');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Modal & Form States ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'User' as 'Admin' | 'Owner' | 'User',
    restaurantId: '',
    ownerStatus: 'None',
    isActive: true
  });

  // Category Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', icon: '' });

  // Audio Tour Modal
  const [showTourModal, setShowTourModal] = useState(false);
  const [editingTour, setEditingTour] = useState<AudioTour | null>(null);
  const [tourForm, setTourForm] = useState({
    title: '',
    location: LOCATION_OPTIONS[0],
    isTrending: false,
    rating: 4.5,
    duration: '1.5 hrs',
    stopsCount: 4,
    vibe: 'Premium',
    description: ''
  });
  const [tourImageFile, setTourImageFile] = useState<File | null>(null);
  const [tourImagePreview, setTourImagePreview] = useState<string>('');
  const [tourMapFile, setTourMapFile] = useState<File | null>(null);
  const [tourMapPreview, setTourMapPreview] = useState<string>('');
  const [tourAudioFile, setTourAudioFile] = useState<File | null>(null);
  const [tourAudioName, setTourAudioName] = useState<string>('');
  const tourImageRef = useRef<HTMLInputElement>(null);
  const tourMapRef = useRef<HTMLInputElement>(null);
  const tourAudioRef = useRef<HTMLInputElement>(null);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchTabContent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'accounts') {
        const [usersRes, restRes] = await Promise.all([
          fetch(`${baseUrl}/api/admin/users`),
          fetch(`${baseUrl}/api/cravemap/restaurants`)
        ]);
        if (!usersRes.ok || !restRes.ok) throw new Error('Failed to fetch account data.');
        setUsers(await usersRes.json());
        setRestaurants(await restRes.json());
      } else if (activeTab === 'requests') {
        const res = await fetch(`${baseUrl}/api/admin/restaurant-requests`);
        if (!res.ok) throw new Error('Failed to fetch restaurant requests.');
        setRequests(await res.json());
      } else if (activeTab === 'categories') {
        const res = await fetch(`${baseUrl}/api/categories`);
        if (!res.ok) throw new Error('Failed to fetch categories.');
        setCategories(await res.json());
      } else if (activeTab === 'tours') {
        const res = await fetch(`${baseUrl}/api/admin/audio-tours`);
        if (!res.ok) throw new Error('Failed to fetch audio tours.');
        setTours(await res.json());
      } else if (activeTab === 'moderation') {
        const [postsRes, reviewsRes] = await Promise.all([
          fetch(`${baseUrl}/api/admin/posts`),
          fetch(`${baseUrl}/api/admin/reviews`)
        ]);
        if (!postsRes.ok || !reviewsRes.ok) throw new Error('Failed to fetch moderation data.');
        setPosts(await postsRes.json());
        setReviews(await reviewsRes.json());
      } else if (activeTab === 'audit_logs') {
        const res = await fetch(`${baseUrl}/api/admin/audit-logs`);
        if (!res.ok) throw new Error('Failed to fetch audit logs.');
        setAuditLogs(await res.json());
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTabContent();
  }, [activeTab]);

  // --- File to Base64 helper ---
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // --- Accounts Management Handlers ---
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserFormData({ username: '', email: '', password: '', role: 'User', restaurantId: '', ownerStatus: 'None', isActive: true });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role as 'Admin' | 'Owner' | 'User',
      restaurantId: user.restaurantId || '',
      ownerStatus: user.ownerStatus || 'None',
      isActive: user.isActive
    });
    setIsUserModalOpen(true);
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const res = await fetch(`${baseUrl}/api/admin/users/${userId}/toggle-status`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to toggle user status.');
      const updatedUser = await res.json();
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleLockUser = async (userId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn khóa tài khoản này?')) return;
    try {
      const res = await fetch(`${baseUrl}/api/admin/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to lock user.');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: false } : u));
    } catch (err: any) {
      alert(err.message || 'Failed to lock user.');
    }
  };

  const handleUnlockUser = async (userId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn mở khóa tài khoản này?')) return;
    try {
      const res = await fetch(`${baseUrl}/api/admin/users/${userId}/toggle-status`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to unlock user.');
      const updatedUser = await res.json();
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch (err: any) {
      alert(err.message || 'Failed to unlock user.');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser
        ? `${baseUrl}/api/admin/users/${editingUser.id}`
        : `${baseUrl}/api/admin/users`;
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userFormData)
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
      setIsUserModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error saving user.');
    }
  };

  // --- Restaurant Requests Handlers ---
  const handleApproveRequest = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn duyệt yêu cầu mở quán này?')) return;
    try {
      const res = await fetch(`${baseUrl}/api/admin/restaurant-requests/${id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to approve request.');
      alert('Đã duyệt yêu cầu và kích hoạt quán ăn thành công!');
      void fetchTabContent();
    } catch (err: any) {
      alert(err.message || 'Error approving request.');
    }
  };

  const handleRejectRequest = async (id: string) => {
    const note = window.prompt('Nhập lý do từ chối yêu cầu này:');
    if (note === null) return;
    try {
      const res = await fetch(`${baseUrl}/api/admin/restaurant-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote: note })
      });
      if (!res.ok) throw new Error('Failed to reject request.');
      alert('Đã từ chối yêu cầu.');
      void fetchTabContent();
    } catch (err: any) {
      alert(err.message || 'Error rejecting request.');
    }
  };

  // --- Categories CRUD ---
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', slug: '', icon: 'store' });
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, slug: (cat as any).slug || '', icon: (cat as any).icon || 'store' });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCategory
        ? `${baseUrl}/api/categories/${editingCategory.id}`
        : `${baseUrl}/api/categories`;
      const method = editingCategory ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory?.id || 0,
          name: categoryForm.name,
          slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          icon: categoryForm.icon || 'store'
        })
      });
      if (!res.ok) throw new Error('Failed to save category.');
      setShowCategoryModal(false);
      void fetchTabContent();
    } catch (err: any) {
      alert(err.message || 'Error saving category.');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      const res = await fetch(`${baseUrl}/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete category.');
      void fetchTabContent();
    } catch (err: any) {
      alert(err.message || 'Error deleting category.');
    }
  };

  // --- Audio Tours CRUD ---
  const resetTourFiles = () => {
    setTourImageFile(null);
    setTourImagePreview('');
    setTourMapFile(null);
    setTourMapPreview('');
    setTourAudioFile(null);
    setTourAudioName('');
  };

  const handleOpenAddTour = () => {
    setEditingTour(null);
    setTourForm({ title: '', location: LOCATION_OPTIONS[0], isTrending: false, rating: 4.8, duration: '2.0 hrs', stopsCount: 5, vibe: 'Energetic', description: '' });
    resetTourFiles();
    setShowTourModal(true);
  };

  const handleOpenEditTour = (tour: AudioTour) => {
    setEditingTour(tour);
    setTourForm({
      title: tour.title,
      location: LOCATION_OPTIONS.includes(tour.location) ? tour.location : LOCATION_OPTIONS[0],
      isTrending: tour.isTrending,
      rating: tour.rating,
      duration: tour.duration,
      stopsCount: tour.stopsCount,
      vibe: tour.vibe,
      description: tour.description
    });
    setTourImagePreview(tour.image || '');
    setTourMapPreview(tour.mapImage || '');
    setTourAudioFile(null);
    setTourAudioName(tour.audioData ? '(Đã có file âm thanh)' : '');
    setTourImageFile(null);
    setTourMapFile(null);
    setShowTourModal(true);
  };

  const handleTourImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTourImageFile(file);
    setTourImagePreview(URL.createObjectURL(file));
  };

  const handleTourMapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTourMapFile(file);
    setTourMapPreview(URL.createObjectURL(file));
  };

  const handleTourAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTourAudioFile(file);
    setTourAudioName(file.name);
  };

  const handleSaveTour = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert files to base64
      const imageData = tourImageFile ? await fileToBase64(tourImageFile) : (editingTour?.image || '');
      const mapImageData = tourMapFile ? await fileToBase64(tourMapFile) : (editingTour?.mapImage || '');
      const audioData = tourAudioFile ? await fileToBase64(tourAudioFile) : (editingTour?.audioData || null);

      const url = editingTour
        ? `${baseUrl}/api/admin/audio-tours/${editingTour.id}`
        : `${baseUrl}/api/admin/audio-tours`;
      const method = editingTour ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTour?.id || '',
          title: tourForm.title,
          location: tourForm.location,
          image: imageData,
          mapImage: mapImageData,
          isTrending: tourForm.isTrending,
          rating: Number(tourForm.rating),
          duration: tourForm.duration,
          stopsCount: Number(tourForm.stopsCount),
          vibe: tourForm.vibe,
          description: tourForm.description,
          audioData
        })
      });
      if (!res.ok) throw new Error('Failed to save audio tour.');
      setShowTourModal(false);
      void fetchTabContent();
    } catch (err: any) {
      alert(err.message || 'Error saving audio tour.');
    }
  };

  const handleDeleteTour = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tour này?')) return;
    try {
      const res = await fetch(`${baseUrl}/api/admin/audio-tours/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete audio tour.');
      void fetchTabContent();
    } catch (err: any) {
      alert(err.message || 'Error deleting audio tour.');
    }
  };

  // --- Moderation System ---
  const handleApprovePost = async (id: string) => {
    try {
      const res = await fetch(`${baseUrl}/api/admin/posts/${id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to approve post.');
      setPosts(prev => prev.map(p => p.id === id ? { ...p, isApproved: true } : p));
    } catch (err: any) {
      alert(err.message || 'Error approving post.');
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết cộng đồng này?')) return;
    try {
      const res = await fetch(`${baseUrl}/api/admin/posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete post.');
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting post.');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
    try {
      const res = await fetch(`${baseUrl}/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete review.');
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting review.');
    }
  };

  // Stats Counters
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'Admin').length;
  const ownerCount = users.filter(u => u.role === 'Owner').length;
  const customerCount = users.filter(u => u.role === 'User').length;
  const suspendedCount = users.filter(u => !u.isActive).length;
  const pendingPostsCount = posts.filter(p => !p.isApproved).length;

  return (
    <div className="flex flex-col gap-6 text-[#1a1a1a]">
      {/* Tab Navigation header */}
      <div className="bg-[#1a1a1a] text-white p-6 border-3 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#e2533b] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="font-mono text-[9px] text-[#e2533b] uppercase tracking-[0.3em] font-extrabold block mb-1">
            {t('admin.control_center')}
          </span>
          <h2 className="font-serif italic font-bold text-3xl flex items-center gap-2">
            <Shield size={26} className="text-[#e2533b]" /> {t('admin.dashboard')}
          </h2>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {(['accounts', 'requests', 'categories', 'tours', 'moderation', 'audit_logs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 font-mono text-[10px] uppercase tracking-widest border-2 border-white transition-all cursor-pointer font-bold relative ${
                activeTab === tab 
                  ? 'bg-[#e2533b] text-white border-[#e2533b]' 
                  : 'bg-white text-[#1a1a1a] border-white hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab === 'accounts' ? t('admin.tabs.accounts') :
               tab === 'requests' ? t('admin.tabs.requests') :
               tab === 'categories' ? t('admin.tabs.categories') :
               tab === 'tours' ? t('admin.tabs.tours') :
               tab === 'moderation' ? t('admin.tabs.moderation') :
               tab === 'audit_logs' ? t('admin.tabs.audit_logs') : tab}
              {tab === 'moderation' && pendingPostsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#e2533b] border border-white rounded-full text-[8px] font-extrabold text-white flex items-center justify-center leading-none">
                  {pendingPostsCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#1a1a1a]/60">
          <span className="animate-spin text-3xl">⏳</span>
          <span className="font-mono text-xs mt-2 uppercase tracking-widest font-bold">{t('admin.common.saving')}</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-300 text-xs font-mono font-bold text-[#e2533b] p-3">
          Error: {error}
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          {/* TAB 1: ACCOUNTS */}
          {activeTab === 'accounts' && (
            <div className="flex flex-col gap-6">
              {/* Bento Grid Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                <div className="bg-white p-4 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/55 font-bold flex items-center gap-1">
                    <Users size={12} /> {t('admin.stats.total_accounts')}
                  </span>
                  <span className="font-serif italic font-bold text-3xl text-[#1a1a1a] mt-1">{totalUsers}</span>
                </div>
                <div className="bg-white p-4 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/55 font-bold flex items-center gap-1">
                    <Shield size={12} /> {t('admin.stats.admin')}
                  </span>
                  <span className="font-serif italic font-bold text-3xl text-[#1a1a1a] mt-1">{adminCount}</span>
                </div>
                <div className="bg-white p-4 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/55 font-bold flex items-center gap-1">
                    <Store size={12} /> {t('admin.stats.owner')}
                  </span>
                  <span className="font-serif italic font-bold text-3xl text-[#1a1a1a] mt-1">{ownerCount}</span>
                </div>
                <div className="bg-white p-4 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/55 font-bold flex items-center gap-1">
                    <UserIcon size={12} /> {t('admin.stats.customer')}
                  </span>
                  <span className="font-serif italic font-bold text-3xl text-[#1a1a1a] mt-1">{customerCount}</span>
                </div>
                <div className="bg-[#fff0f0] p-4 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col justify-between col-span-2 md:col-span-1">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#e2533b] font-bold flex items-center gap-1">
                    <Ban size={12} /> {t('admin.stats.suspended')}
                  </span>
                  <span className="font-serif italic font-bold text-3xl text-[#e2533b] mt-1">{suspendedCount}</span>
                </div>
              </div>

              {/* Main List Box */}
              <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#1a1a1a] p-4 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#1a1a1a]/15 pb-4">
                  <div>
                    <h3 className="font-serif italic font-bold text-lg">{t('admin.accounts.list_title')}</h3>
                    <p className="font-mono text-[9px] text-[#1a1a1a]/55 uppercase tracking-wider mt-0.5">ADMIN SECURITY TERMINAL</p>
                  </div>
                  <button
                    onClick={handleOpenAddUser}
                    className="bg-[#1a1a1a] hover:bg-[#e2533b] text-white font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 shadow border-2 border-[#1a1a1a] transition-all cursor-pointer flex items-center gap-1.5 active:translate-y-0.5"
                  >
                    <Plus size={13} strokeWidth={3} /> {t('admin.accounts.add_btn')}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#1a1a1a] bg-[#f9f7f2] font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/60">
                        <th className="py-2.5 px-3">{t('admin.accounts.username')}</th>
                        <th className="py-2.5 px-3">{t('admin.accounts.email')}</th>
                        <th className="py-2.5 px-3">{t('admin.accounts.role')}</th>
                        <th className="py-2.5 px-3">{t('admin.accounts.linked_restaurant')}</th>
                        <th className="py-2.5 px-3">{t('admin.accounts.status')}</th>
                        <th className="py-2.5 px-3 text-right">{t('admin.accounts.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]/10">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-[#fcfbfa]/50 transition-colors">
                          <td className="py-3 px-3 font-semibold">{u.username}</td>
                          <td className="py-3 px-3 font-mono">{u.email}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-extrabold tracking-wider border shadow-xs ${
                              u.role === 'Admin' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                              u.role === 'Owner' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              'bg-gray-100 text-gray-800 border border-gray-300'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-serif italic text-xs text-[#1a1a1a]/60">
                            {u.role === 'Owner'
                              ? (restaurants.find(r => r.id === u.restaurantId)?.name || u.restaurantId || t('admin.accounts.unassigned'))
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
                              {u.isActive ? t('admin.accounts.active') : t('admin.accounts.locked')}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="w-7 h-7 flex items-center justify-center border border-[#1a1a1a]/20 hover:border-[#1a1a1a] hover:bg-[#f9f7f2] bg-white cursor-pointer transition-colors shadow-xs"
                                title={t('admin.common.edit')}
                              >
                                <Pencil size={13} />
                              </button>
                              {u.isActive ? (
                                <button
                                  onClick={() => handleLockUser(u.id)}
                                  className="w-7 h-7 flex items-center justify-center border border-[#1a1a1a]/20 hover:border-red-500 hover:bg-red-50 bg-white cursor-pointer transition-colors text-red-500 shadow-xs"
                                  title={t('admin.accounts.locked')}
                                >
                                  <Ban size={13} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUnlockUser(u.id)}
                                  className="w-7 h-7 flex items-center justify-center border border-[#1a1a1a]/20 hover:border-green-500 hover:bg-green-50 bg-white cursor-pointer transition-colors text-green-600 shadow-xs"
                                  title={t('admin.accounts.active')}
                                >
                                  <Unlock size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RESTAURANT REQUESTS */}
          {activeTab === 'requests' && (
            <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#1a1a1a] p-5">
              <div className="border-b border-[#1a1a1a]/15 pb-3 mb-4">
                <h3 className="font-serif italic font-bold text-lg">{t('admin.requests.title')}</h3>
                <p className="font-mono text-[9px] text-[#1a1a1a]/55 uppercase tracking-wider mt-0.5">RESTAURANT APPROVAL PIPELINE</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-[#1a1a1a] bg-[#f9f7f2] font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/60">
                      <th className="py-2.5 px-3">{t('admin.requests.restaurant')}</th>
                      <th className="py-2.5 px-3">{t('admin.requests.owner')}</th>
                      <th className="py-2.5 px-3">{t('admin.requests.area')}</th>
                      <th className="py-2.5 px-3">{t('admin.requests.price')}</th>
                      <th className="py-2.5 px-3">{t('admin.requests.street')}</th>
                      <th className="py-2.5 px-3">{t('admin.requests.status')}</th>
                      <th className="py-2.5 px-3 text-right">{t('admin.requests.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]/10">
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center font-mono text-xs text-[#1a1a1a]/40 uppercase">
                          {t('admin.requests.no_requests')}
                        </td>
                      </tr>
                    ) : (
                      requests.map(r => (
                        <tr key={r.id} className="hover:bg-[#fcfbfa]/50 transition-colors">
                          <td className="py-3 px-3 font-semibold">
                            <div className="flex items-center gap-2">
                              {r.image && (
                                <img src={r.image} alt={r.name} className="w-8 h-8 object-cover border border-[#1a1a1a]/20" />
                              )}
                              <div>
                                <p className="font-bold">{r.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">{r.address}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-semibold">{r.ownerName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{r.ownerEmail}</p>
                          </td>
                          <td className="py-3 px-3">{r.area}</td>
                          <td className="py-3 px-3 font-mono font-bold text-amber-600">{r.priceRange}</td>
                          <td className="py-3 px-3">{r.foodStreetName}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold border ${
                              r.status === 'Pending' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' :
                              r.status === 'Approved' ? 'bg-green-100 border-green-400 text-green-800' :
                              'bg-red-100 border-red-400 text-red-800'
                            }`}>
                              {r.status === 'Pending' ? t('admin.requests.pending') : r.status === 'Approved' ? t('admin.requests.approved') : t('admin.requests.rejected')}
                            </span>
                            {r.adminNote && (
                              <p className="text-[9px] text-red-500 italic mt-0.5">Note: {r.adminNote}</p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {r.status === 'Pending' && (
                              <div className="inline-flex gap-2">
                                <button
                                  onClick={() => handleApproveRequest(r.id)}
                                  className="px-2 py-1 flex items-center gap-1 border-2 border-[#1a1a1a] hover:bg-green-100 bg-white font-mono text-[9px] uppercase font-bold cursor-pointer transition-colors shadow-xs active:translate-y-0.5"
                                >
                                  <Check size={11} strokeWidth={3} className="text-green-600" /> {t('admin.requests.approve')}
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(r.id)}
                                  className="px-2 py-1 flex items-center gap-1 border-2 border-[#1a1a1a] hover:bg-red-100 bg-white font-mono text-[9px] uppercase font-bold cursor-pointer transition-colors shadow-xs active:translate-y-0.5 text-red-500"
                                >
                                  <X size={11} strokeWidth={3} className="text-red-500" /> {t('admin.requests.reject')}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#1a1a1a] p-5">
              <div className="border-b border-[#1a1a1a]/15 pb-3 mb-4 flex justify-between items-center">
                <div>
                  <h3 className="font-serif italic font-bold text-lg">{t('admin.categories.title')}</h3>
                  <p className="font-mono text-[9px] text-[#1a1a1a]/55 uppercase tracking-wider mt-0.5">RESTAURANT CATEGORIES</p>
                </div>
                <button
                  onClick={handleOpenAddCategory}
                  className="bg-[#1a1a1a] hover:bg-[#e2533b] text-white font-mono text-[10px] uppercase tracking-widest px-4 py-2 border-2 border-[#1a1a1a] transition-all cursor-pointer shadow flex items-center gap-1.5 active:translate-y-0.5 font-bold"
                >
                  <Plus size={13} strokeWidth={3} /> {t('admin.categories.add_btn')}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map(cat => (
                  <div key={cat.id} className="p-4 border-2 border-[#1a1a1a] bg-[#fdfcf9] shadow-[3px_3px_0px_0px_#1a1a1a] flex justify-between items-center group hover:border-[#e2533b] transition-all">
                    <div>
                      <p className="font-serif italic font-bold text-base">{cat.name}</p>
                      <p className="text-[10px] font-mono text-slate-500 font-light mt-0.5">Slug: {(cat as any).slug || cat.name.toLowerCase()}</p>
                      <p className="text-[10px] font-mono text-slate-500 font-light">Icon: {(cat as any).icon || 'store'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="w-7 h-7 flex items-center justify-center border border-[#1a1a1a]/15 hover:border-[#1a1a1a] hover:bg-white bg-transparent cursor-pointer transition-all"
                        title={t('admin.common.edit')}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="w-7 h-7 flex items-center justify-center border border-[#1a1a1a]/15 hover:border-red-500 hover:bg-red-50 text-red-500 cursor-pointer transition-all"
                        title={t('admin.common.delete')}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: AUDIO TOURS */}
          {activeTab === 'tours' && (
            <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#1a1a1a] p-5">
              <div className="border-b border-[#1a1a1a]/15 pb-3 mb-4 flex justify-between items-center">
                <div>
                  <h3 className="font-serif italic font-bold text-lg">{t('admin.tours.title')}</h3>
                  <p className="font-mono text-[9px] text-[#1a1a1a]/55 uppercase tracking-wider mt-0.5">GPS AUDIO GUIDE TOURS</p>
                </div>
                <button
                  onClick={handleOpenAddTour}
                  className="bg-[#1a1a1a] hover:bg-[#e2533b] text-white font-mono text-[10px] uppercase tracking-widest px-4 py-2 border-2 border-[#1a1a1a] transition-all cursor-pointer shadow flex items-center gap-1.5 active:translate-y-0.5 font-bold"
                >
                  <Plus size={13} strokeWidth={3} /> {t('admin.tours.add_btn')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tours.map(tour => (
                  <div key={tour.id} className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_#1a1a1a] flex flex-col group hover:border-[#e2533b] transition-all relative">
                    {tour.image ? (
                      <img src={tour.image} alt={tour.title} className="h-36 w-full object-cover border-b-2 border-[#1a1a1a]" />
                    ) : (
                      <div className="h-36 w-full bg-[#f0ede8] border-b-2 border-[#1a1a1a] flex items-center justify-center">
                        <span className="font-mono text-[9px] text-slate-400 uppercase">Chưa có ảnh</span>
                      </div>
                    )}
                    <div className="p-4 flex flex-col justify-between flex-1 gap-2">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[8px] bg-amber-100 border border-amber-300 text-amber-800 px-1.5 py-0.5 uppercase tracking-wider font-extrabold">{tour.vibe}</span>
                          <span className="font-mono text-[9px] text-slate-500 font-bold">{tour.duration} // {tour.stopsCount} stops</span>
                        </div>
                        <h4 className="font-serif italic font-bold text-base mt-2">{tour.title}</h4>
                        <p className="text-[10px] font-mono text-[#e2533b] mt-1 flex items-center gap-1"><MapPin size={10} /> {tour.location}</p>
                        <p className="text-xs font-sans text-slate-600 mt-2 line-clamp-2 leading-relaxed font-light">{tour.description}</p>
                        {tour.audioData && (
                          <span className="mt-2 inline-flex items-center gap-1 font-mono text-[8px] bg-green-50 border border-green-300 text-green-700 px-1.5 py-0.5 uppercase tracking-wider">
                            ♪ Có file âm thanh
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-3 mt-2 border-t border-dashed border-[#1a1a1a]/10">
                        <span className="font-mono font-bold text-xs text-amber-500">⭐ {tour.rating.toFixed(1)}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEditTour(tour)}
                            className="w-7 h-7 flex items-center justify-center border border-[#1a1a1a]/15 hover:border-[#1a1a1a] bg-white transition-all cursor-pointer"
                            title={t('admin.common.edit')}
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteTour(tour.id)}
                            className="w-7 h-7 flex items-center justify-center border border-[#1a1a1a]/15 hover:border-red-500 hover:bg-red-50 text-red-500 bg-white transition-all cursor-pointer"
                            title={t('admin.common.delete')}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: MODERATION SYSTEM */}
          {activeTab === 'moderation' && (
            <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#1a1a1a] p-5">
              <div className="border-b border-[#1a1a1a]/15 pb-3 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-serif italic font-bold text-lg">{t('admin.moderation.title')}</h3>
                  <p className="font-mono text-[9px] text-[#1a1a1a]/55 uppercase tracking-wider mt-0.5">CONTENT MODERATION TERMINAL</p>
                </div>
                
                {/* Mod Sub Tabs */}
                <div className="flex border border-[#1a1a1a]">
                  <button
                    onClick={() => setModSubTab('posts')}
                    className={`px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider font-extrabold cursor-pointer transition-colors ${
                      modSubTab === 'posts' ? 'bg-[#1a1a1a] text-white' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {t('admin.moderation.posts')} ({posts.length})
                    {pendingPostsCount > 0 && (
                      <span className="ml-1.5 bg-[#e2533b] text-white text-[8px] px-1 py-0.5 font-extrabold">
                        {pendingPostsCount} chờ
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setModSubTab('reviews')}
                    className={`px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider font-extrabold cursor-pointer transition-colors ${
                      modSubTab === 'reviews' ? 'bg-[#1a1a1a] text-white' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {t('admin.moderation.reviews')} ({reviews.length})
                  </button>
                </div>
              </div>

              {modSubTab === 'posts' ? (
                <div className="flex flex-col gap-4">
                  {/* Filter notice */}
                  {pendingPostsCount > 0 && (
                    <div className="bg-amber-50 border border-amber-300 p-3 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
                      <span className="font-mono text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                        Có {pendingPostsCount} bài đăng của khách chờ duyệt để hiển thị lên feed
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {posts.length === 0 ? (
                      <p className="col-span-full py-8 text-center font-mono text-xs text-[#1a1a1a]/40 uppercase">{t('admin.moderation.no_posts')}</p>
                    ) : (
                      posts.map(p => (
                        <div key={p.id} className={`p-4 border-2 bg-[#fdfcf9] shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col justify-between gap-3 transition-all ${
                          p.isApproved ? 'border-[#1a1a1a]' : 'border-amber-400'
                        }`}>
                          <div>
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <img src={p.avatar} alt={p.author} className="w-8 h-8 rounded-none border border-[#1a1a1a]/20 object-cover" />
                                <div>
                                  <p className="font-bold text-xs">{p.author}</p>
                                  <p className="text-[9px] text-slate-400 font-mono">{p.handle} // {p.timeAgo}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold text-amber-500">⭐ {p.rating.toFixed(1)}</span>
                                {p.isApproved ? (
                                  <span className="flex items-center gap-0.5 font-mono text-[8px] bg-green-50 border border-green-300 text-green-700 px-1.5 py-0.5 uppercase font-extrabold">
                                    <CheckCircle2 size={9} /> Đã duyệt
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-0.5 font-mono text-[8px] bg-amber-50 border border-amber-300 text-amber-700 px-1.5 py-0.5 uppercase font-extrabold">
                                    <AlertTriangle size={9} /> Chờ duyệt
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-xs text-slate-700 mt-2 font-sans leading-relaxed">{p.content}</p>
                            
                            {p.image && (
                              <img src={p.image} alt="Post content" className="w-full h-32 object-cover border border-[#1a1a1a]/10 mt-3" />
                            )}
                            <p className="text-[10px] font-serif italic text-slate-400 mt-2 flex items-center gap-1"><MapPin size={10} /> {p.locationName}</p>
                          </div>
                          
                          <div className="pt-3 border-t border-dashed border-[#1a1a1a]/10 flex justify-between items-center">
                            <span className="font-mono text-[9px] text-slate-400">Likes: {p.likesCount} // Comments: {p.commentsCount}</span>
                            <div className="flex items-center gap-2">
                              {!p.isApproved && (
                                <button
                                  onClick={() => handleApprovePost(p.id)}
                                  className="px-2.5 py-1 flex items-center gap-1 border-2 border-green-500 hover:bg-green-50 text-green-700 font-mono text-[9px] uppercase font-bold cursor-pointer transition-all active:translate-y-0.5 bg-white"
                                >
                                  <Check size={11} strokeWidth={3} /> Duyệt lên Feed
                                </button>
                              )}
                              <button
                                onClick={() => handleDeletePost(p.id)}
                                className="px-2.5 py-1 flex items-center gap-1 border-2 border-red-500 hover:bg-red-50 text-red-500 font-mono text-[9px] uppercase font-bold cursor-pointer transition-all active:translate-y-0.5 bg-white"
                              >
                                <Trash2 size={11} /> {t('admin.moderation.delete_post')}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#1a1a1a] bg-[#f9f7f2] font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/60">
                        <th className="py-2.5 px-3">{t('admin.requests.restaurant')}</th>
                        <th className="py-2.5 px-3">{t('admin.requests.owner')}</th>
                        <th className="py-2.5 px-3">{t('admin.accounts.role')}</th>
                        <th className="py-2.5 px-3">{t('admin.moderation.reviews')}</th>
                        <th className="py-2.5 px-3">Bình luận</th>
                        <th className="py-2.5 px-3 text-right">{t('admin.accounts.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]/10">
                      {reviews.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center font-mono text-xs text-[#1a1a1a]/40 uppercase">
                            {t('admin.moderation.no_reviews')}
                          </td>
                        </tr>
                      ) : (
                        reviews.map(r => (
                          <tr key={r.id} className="hover:bg-[#fcfbfa]/50 transition-colors">
                            <td className="py-3 px-3 font-semibold">{r.restaurantName}</td>
                            <td className="py-3 px-3 font-bold">{r.author}</td>
                            <td className="py-3 px-3 font-mono text-[10px] text-slate-400">{r.role}</td>
                            <td className="py-3 px-3 font-mono font-bold text-amber-500">⭐ {r.rating.toFixed(1)}</td>
                            <td className="py-3 px-3 italic font-sans max-w-xs truncate">{r.comment}</td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleDeleteReview(r.id)}
                                className="px-2 py-1 flex items-center gap-1 border-2 border-red-500 hover:bg-red-50 text-red-500 font-mono text-[9px] uppercase font-bold cursor-pointer transition-all active:translate-y-0.5 bg-white ml-auto"
                              >
                                <Trash2 size={11} /> {t('admin.moderation.delete_review')}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: AUDIT LOGS */}
          {activeTab === 'audit_logs' && (
            <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#1a1a1a] p-5">
              <div className="border-b border-[#1a1a1a]/15 pb-3 mb-4">
                <h3 className="font-serif italic font-bold text-lg">{t('admin.tabs.audit_logs')}</h3>
                <p className="font-mono text-[9px] text-[#1a1a1a]/55 uppercase tracking-wider mt-0.5">SYSTEM AUDIT TRAIL</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-[#1a1a1a] bg-[#f9f7f2] font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/60">
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-3">Tác nhân</th>
                      <th className="py-2.5 px-3">Hành động</th>
                      <th className="py-2.5 px-3">Đối tượng</th>
                      <th className="py-2.5 px-3">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]/10">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center font-mono text-xs text-[#1a1a1a]/40 uppercase">
                          Chưa có nhật ký hoạt động nào.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-[#fcfbfa]/50 transition-colors">
                          <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3 px-3 font-bold">{log.actor}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 text-[9px] font-mono uppercase font-bold bg-amber-50 border border-amber-300 text-amber-800">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            {log.entityType} ({log.entityId})
                          </td>
                          <td className="py-3 px-3 italic font-sans">{log.details || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL DIALOGS --- */}

      {/* 1. Account Add/Edit Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#fdfcf9] border-3 border-[#1a1a1a] shadow-[8px_8px_0px_0px_#1a1a1a] p-6 text-[#1a1a1a] relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsUserModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border-2 border-[#1a1a1a] bg-white hover:bg-[#e2533b] hover:text-white transition-colors cursor-pointer">
              <X size={14} strokeWidth={3} />
            </button>
            <div className="mb-4">
              <span className="text-[9px] tracking-[0.3em] uppercase text-[#e2533b] font-mono font-bold block mb-1">USER ACCOUNT CONFIGURATION</span>
              <h2 className="font-serif italic font-bold text-xl uppercase">{editingUser ? 'Sửa thông tin tài khoản' : 'Thêm tài khoản mới'}</h2>
            </div>
            <form onSubmit={handleSaveUser} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Tên người dùng</label>
                <input type="text" value={userFormData.username} onChange={(e) => setUserFormData(prev => ({ ...prev, username: e.target.value }))} className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none" required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Địa chỉ Email</label>
                <input type="email" value={userFormData.email} onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none" required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Mật khẩu {editingUser && '(để trống nếu không đổi)'}</label>
                <input type="password" value={userFormData.password} onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))} className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none" required={!editingUser} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Vai trò</label>
                  <select value={userFormData.role} onChange={(e) => setUserFormData(prev => ({ ...prev, role: e.target.value as any }))} className="w-full bg-white border-2 border-[#1a1a1a] px-2.5 py-1.5 text-sm focus:outline-none">
                    <option value="User">User (Thực khách)</option>
                    <option value="Owner">Owner (Chủ quán)</option>
                    <option value="Admin">Admin (Quản trị viên)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Trạng thái</label>
                  <select value={userFormData.isActive ? 'true' : 'false'} onChange={(e) => setUserFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))} className="w-full bg-white border-2 border-[#1a1a1a] px-2.5 py-1.5 text-sm focus:outline-none">
                    <option value="true">Hoạt động</option>
                    <option value="false">Khóa tài khoản</option>
                  </select>
                </div>
              </div>
              {userFormData.role === 'Owner' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Quán ăn được gán</label>
                    <select value={userFormData.restaurantId} onChange={(e) => setUserFormData(prev => ({ ...prev, restaurantId: e.target.value }))} className="w-full bg-white border-2 border-[#1a1a1a] px-2.5 py-1.5 text-sm focus:outline-none">
                      <option value="">-- Chọn quán ăn --</option>
                      {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Trạng thái Chủ quán</label>
                    <select value={userFormData.ownerStatus} onChange={(e) => setUserFormData(prev => ({ ...prev, ownerStatus: e.target.value }))} className="w-full bg-white border-2 border-[#1a1a1a] px-2.5 py-1.5 text-sm focus:outline-none">
                      <option value="None">None (Chưa đăng ký)</option>
                      <option value="Pending">Pending (Chờ duyệt)</option>
                      <option value="Verified">Verified (Đã xác minh)</option>
                      <option value="Rejected">Rejected (Bị từ chối)</option>
                    </select>
                  </div>
                </>
              )}
              <button type="submit" className="w-full mt-2 bg-[#1a1a1a] text-white hover:bg-[#e2533b] py-2.5 font-mono text-xs uppercase tracking-widest border-2 border-[#1a1a1a] transition-all cursor-pointer shadow-md">Lưu tài khoản</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#fdfcf9] border-3 border-[#1a1a1a] shadow-[8px_8px_0px_0px_#1a1a1a] p-6 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowCategoryModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border-2 border-[#1a1a1a] bg-white hover:bg-[#e2533b] hover:text-white transition-colors cursor-pointer">
              <X size={14} strokeWidth={3} />
            </button>
            <div className="mb-4">
              <span className="text-[9px] tracking-[0.3em] uppercase text-[#e2533b] font-mono font-bold block mb-1">RESTAURANT CATEGORY CONFIG</span>
              <h2 className="font-serif italic font-bold text-xl uppercase">{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h2>
            </div>
            <form onSubmit={handleSaveCategory} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Tên danh mục</label>
                <input type="text" value={categoryForm.name} onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Hải sản" className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none" required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Slug (Đường dẫn tĩnh)</label>
                <input type="text" value={categoryForm.slug} onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))} placeholder="Ex: hai-san (để trống tự sinh)" className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Icon (Tên Lucide Icon)</label>
                <input type="text" value={categoryForm.icon} onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))} placeholder="Ex: waves, coffee, soup" className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none" required />
              </div>
              <button type="submit" className="w-full mt-2 bg-[#1a1a1a] text-white hover:bg-[#e2533b] py-2.5 font-mono text-xs uppercase tracking-widest border-2 border-[#1a1a1a] transition-all cursor-pointer shadow-md">Lưu danh mục</button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Audio Tour Modal — with file uploads */}
      {showTourModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-[#fdfcf9] border-3 border-[#1a1a1a] shadow-[8px_8px_0px_0px_#1a1a1a] p-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowTourModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border-2 border-[#1a1a1a] bg-white hover:bg-[#e2533b] hover:text-white transition-colors cursor-pointer z-10">
              <X size={14} strokeWidth={3} />
            </button>
            <div className="mb-4">
              <span className="text-[9px] tracking-[0.3em] uppercase text-[#e2533b] font-mono font-bold block mb-1">GPS GUIDED TOURS EDITOR</span>
              <h2 className="font-serif italic font-bold text-xl uppercase">{editingTour ? 'Sửa Audio Tour' : 'Thêm Audio Tour mới'}</h2>
            </div>
            <form onSubmit={handleSaveTour} className="flex flex-col gap-3">
              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Tiêu đề Tour</label>
                <input type="text" value={tourForm.title} onChange={(e) => setTourForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Ex: Tour Ốc Đêm Quận 4" className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none" required />
              </div>

              {/* Location — Select list */}
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Khu vực địa lý (Vĩnh Khánh)</label>
                <select
                  value={tourForm.location}
                  onChange={(e) => setTourForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none"
                  required
                >
                  {LOCATION_OPTIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Duration & Stops */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Thời lượng</label>
                  <input type="text" value={tourForm.duration} onChange={(e) => setTourForm(prev => ({ ...prev, duration: e.target.value }))} placeholder="Ex: 2.0 hrs" className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Số điểm dừng (Stops)</label>
                  <input type="number" value={tourForm.stopsCount} onChange={(e) => setTourForm(prev => ({ ...prev, stopsCount: Number(e.target.value) }))} className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none font-mono" required />
                </div>
              </div>

              {/* Vibe & Rating */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Không khí (Vibe)</label>
                  <input type="text" value={tourForm.vibe} onChange={(e) => setTourForm(prev => ({ ...prev, vibe: e.target.value }))} placeholder="Ex: Nhộn nhịp, Trải nghiệm" className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Điểm đánh giá (Rating)</label>
                  <input type="number" step="0.1" max="5" value={tourForm.rating} onChange={(e) => setTourForm(prev => ({ ...prev, rating: Number(e.target.value) }))} className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none font-mono" required />
                </div>
              </div>

              {/* Cover Image File Upload */}
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Ảnh bìa Tour</label>
                <div
                  onClick={() => tourImageRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#1a1a1a]/40 hover:border-[#e2533b] bg-white cursor-pointer transition-colors group"
                >
                  {tourImagePreview ? (
                    <div className="relative">
                      <img src={tourImagePreview} alt="Preview" className="w-full h-28 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <UploadCloud size={20} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                      <UploadCloud size={22} className="text-[#1a1a1a]/40 group-hover:text-[#e2533b] transition-colors" />
                      <span className="font-mono text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider group-hover:text-[#e2533b] transition-colors">Chọn file ảnh bìa</span>
                    </div>
                  )}
                </div>
                <input ref={tourImageRef} type="file" accept="image/*" className="hidden" onChange={handleTourImageChange} />
              </div>

              {/* Map Image File Upload */}
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Ảnh bản đồ Tour</label>
                <div
                  onClick={() => tourMapRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#1a1a1a]/40 hover:border-[#e2533b] bg-white cursor-pointer transition-colors group"
                >
                  {tourMapPreview ? (
                    <div className="relative">
                      <img src={tourMapPreview} alt="Map Preview" className="w-full h-28 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <UploadCloud size={20} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                      <UploadCloud size={22} className="text-[#1a1a1a]/40 group-hover:text-[#e2533b] transition-colors" />
                      <span className="font-mono text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider group-hover:text-[#e2533b] transition-colors">Chọn file ảnh bản đồ</span>
                    </div>
                  )}
                </div>
                <input ref={tourMapRef} type="file" accept="image/*" className="hidden" onChange={handleTourMapChange} />
              </div>

              {/* Audio File Upload */}
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">File âm thanh (Audio)</label>
                <div
                  onClick={() => tourAudioRef.current?.click()}
                  className={`w-full border-2 border-dashed hover:border-[#e2533b] bg-white cursor-pointer transition-colors group px-4 py-4 flex items-center gap-3 ${
                    tourAudioName ? 'border-green-400' : 'border-[#1a1a1a]/40'
                  }`}
                >
                  <UploadCloud size={18} className={`flex-shrink-0 transition-colors ${tourAudioName ? 'text-green-600' : 'text-[#1a1a1a]/40 group-hover:text-[#e2533b]'}`} />
                  <span className={`font-mono text-[9px] uppercase tracking-wider transition-colors truncate ${tourAudioName ? 'text-green-700 font-bold' : 'text-[#1a1a1a]/50 group-hover:text-[#e2533b]'}`}>
                    {tourAudioName || 'Chọn file âm thanh (.mp3, .wav, .ogg...)'}
                  </span>
                </div>
                <input ref={tourAudioRef} type="file" accept="audio/*" className="hidden" onChange={handleTourAudioChange} />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Mô tả chi tiết hành trình</label>
                <textarea value={tourForm.description} onChange={(e) => setTourForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Tour đi bộ dọc bờ kênh..." className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-xs focus:outline-none h-20" required />
              </div>

              {/* Trending */}
              <div className="flex items-center gap-2 py-1.5">
                <input type="checkbox" id="isTrending" checked={tourForm.isTrending} onChange={(e) => setTourForm(prev => ({ ...prev, isTrending: e.target.checked }))} className="border-2 border-[#1a1a1a] w-4 h-4" />
                <label htmlFor="isTrending" className="font-mono text-[10px] uppercase font-bold tracking-wider">Tour nổi bật (Trending)</label>
              </div>

              <button type="submit" className="w-full mt-2 bg-[#1a1a1a] text-white hover:bg-[#e2533b] py-2.5 font-mono text-xs uppercase tracking-widest border-2 border-[#1a1a1a] transition-all cursor-pointer shadow-md">Lưu Audio Tour</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
