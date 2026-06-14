import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Restaurant, Category, BookingMessagePayload, Notification } from '../../types';
import { Trash2, X, Plus, Store, Users, Calendar, Ban, QrCode, TrendingUp, Settings, Check, Clock, MapPin, Star, CheckCircle2, XCircle, FileText, Grid, Megaphone, Bell, AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OwnerDashboardProps {
  onRestaurantUpdated?: (updated: Restaurant) => void;
}

interface BookingDto {
  id: number;
  restaurantId: string;
  date: string;
  time: string;
  guests: number;
  seating: string;
  status: string;
  tableNumber?: string;
}

interface AnalyticsDto {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalReviews: number;
  averageRating: number;
}

export default function OwnerDashboard({ onRestaurantUpdated }: OwnerDashboardProps) {
  const { user, syncUser } = useAuth();
  const { t } = useTranslation();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodStreets, setFoodStreets] = useState<any[]>([]);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsDto | null>(null);
  const [activeTab, setActiveTab] = useState<'analytics' | 'bookings' | 'tables' | 'dishes' | 'reviews' | 'posts' | 'settings' | 'qr'>('analytics');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [tablesSaveSuccess, setTablesSaveSuccess] = useState(false);
  const [requestStatus, setRequestStatus] = useState<{ status: string; note?: string } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Edit Restaurant Form state
  const [restForm, setRestForm] = useState({
    name: '',
    priceRange: '$$',
    categoryId: 1,
    foodStreetId: 1,
    distance: '0.5 km away',
    address: '',
    area: '',
    openingHours: '',
    description: '',
    tableStatuses: '',
    image: '',
    isVerified: true,
    replySpeed: 'Usually replies in 5m',
    latitude: 10.759031,
    longitude: 106.706962
  });

  // Table map status list
  const [tablesList, setTablesList] = useState<any[]>([]);

  // Feed Posts creator state
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState('');

  // Create Restaurant Form state
  const [createForm, setCreateForm] = useState({
    name: '',
    priceRange: '$$',
    categoryId: 1,
    foodStreetId: 1,
    distance: '0.1 km away',
    address: '',
    area: 'Quận 4',
    openingHours: '16:00 - 23:00',
    image: '',
    latitude: 10.759031,
    longitude: 106.706962
  });

  // Add Dish state
  const [showDishModal, setShowDishModal] = useState(false);
  const [dishForm, setDishForm] = useState({
    name: '',
    price: 0,
    description: '',
    image: ''
  });

  // QR Generator state
  const [tableNumber, setTableNumber] = useState(5);
  const [generatedQrToken, setGeneratedQrToken] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // TTS state for reading restaurant description
  const [isSpeaking, setIsSpeaking] = useState(false);

  const restRegImageRef = useRef<HTMLInputElement>(null);
  const newsPostImageRef = useRef<HTMLInputElement>(null);
  const restSettingsImageRef = useRef<HTMLInputElement>(null);
  const dishImageRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleRestRegImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setCreateForm(prev => ({ ...prev, image: base64 }));
    } catch (err) {
      console.error("Failed to read registration image", err);
    }
  };

  const handleNewsPostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setPostImage(base64);
    } catch (err) {
      console.error("Failed to read news post image", err);
    }
  };

  const handleRestSettingsImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setRestForm(prev => ({ ...prev, image: base64 }));
    } catch (err) {
      console.error("Failed to read restaurant setting image", err);
    }
  };

  const handleDishImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setDishForm(prev => ({ ...prev, image: base64 }));
    } catch (err) {
      console.error("Failed to read dish image", err);
    }
  };

  const getTableActiveBooking = (t: any) => {
    const matchingBookings = bookings.filter(b => {
      if (!b.tableNumber) return false;
      const bTable = String(b.tableNumber).trim().toLowerCase();
      const tName = String(t.name || '').trim().toLowerCase();
      const tIdStr = String(t.id).trim().toLowerCase();
      return bTable === tName || bTable === tIdStr || bTable === tName.replace('bàn', '').trim();
    });

    return matchingBookings.find(b => {
      const status = b.status.toLowerCase();
      return status === 'pending' || status === 'chờ duyệt' || status === 'confirmed' || status === 'đã nhận' || status === 'đã duyệt';
    });
  };

  const getTableStatus = (t: any) => {
    const activeBooking = getTableActiveBooking(t);
    if (activeBooking) {
      const status = activeBooking.status.toLowerCase();
      if (status === 'pending' || status === 'chờ duyệt') {
        return 'reserved';
      }
      if (status === 'confirmed' || status === 'đã nhận' || status === 'đã duyệt') {
        return 'occupied';
      }
    }
    return t.status;
  };

  const handleToggleTTS = () => {
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ đọc giọng nói.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const text = restForm.description?.trim();
    if (!text) {
      alert('Vui lòng nhập mô tả quán ăn trước khi nghe audio!');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const activeRestaurantId = user?.restaurantId;
  const ownerQuery = user?.id ? `ownerId=${encodeURIComponent(user.id)}` : '';

  const fetchRestaurant = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Sync user profile first
      if (user) {
        try {
          const profileRes = await fetch(`${baseUrl}/api/auth/me/${user.id}`);
          if (profileRes.ok) {
            const updatedUser = await profileRes.json();
            if (updatedUser.restaurantId !== user.restaurantId || updatedUser.ownerStatus !== user.ownerStatus) {
              syncUser(updatedUser);
            }
          }
        } catch (e) {
          console.warn("Failed to sync user profile:", e);
        }
      }

      // Fetch categories and streets first
      const [catRes, streetRes] = await Promise.all([
        fetch(`${baseUrl}/api/cravemap/categories`),
        fetch(`${baseUrl}/api/food-streets`)
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
      if (streetRes.ok) {
        const streetData = await streetRes.json();
        setFoodStreets(streetData);
      }

      if (activeRestaurantId) {
        const [restRes, bookingsRes, analyticsRes, notificationsRes] = await Promise.all([
          fetch(`${baseUrl}/api/owner/restaurant/${activeRestaurantId}?${ownerQuery}`),
          fetch(`${baseUrl}/api/owner/restaurant/${activeRestaurantId}/bookings?${ownerQuery}`),
          fetch(`${baseUrl}/api/owner/restaurant/${activeRestaurantId}/analytics?${ownerQuery}`),
          fetch(`${baseUrl}/api/owner/notifications?${ownerQuery}`)
        ]);

        if (!restRes.ok) throw new Error('Failed to load restaurant details.');
        const restData: Restaurant = await restRes.json();
        setRestaurant(restData);

        // Setup tables list from DB or defaults
        const defaultTables = [
          { id: 1, name: 'Bàn 1', status: 'vacant', capacity: 2 },
          { id: 2, name: 'Bàn 2', status: 'vacant', capacity: 2 },
          { id: 3, name: 'Bàn 3', status: 'vacant', capacity: 4 },
          { id: 4, name: 'Bàn 4', status: 'vacant', capacity: 4 },
          { id: 5, name: 'Bàn 5', status: 'vacant', capacity: 4 },
          { id: 6, name: 'Bàn 6', status: 'vacant', capacity: 4 },
          { id: 7, name: 'Bàn 7', status: 'vacant', capacity: 6 },
          { id: 8, name: 'Bàn 8', status: 'vacant', capacity: 6 },
          { id: 9, name: 'Bàn 9', status: 'vacant', capacity: 8 },
          { id: 10, name: 'Bàn 10', status: 'vacant', capacity: 8 },
          { id: 11, name: 'Bàn 11', status: 'vacant', capacity: 10 },
          { id: 12, name: 'Bàn 12', status: 'vacant', capacity: 12 },
        ];

        let parsedTables = defaultTables;
        if (restData.tableStatuses) {
          try {
            parsedTables = JSON.parse(restData.tableStatuses);
          } catch (e) {
            console.error("Failed to parse table statuses:", e);
          }
        }
        setTablesList(parsedTables);

        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setBookings(bookingsData);
        }

        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData);
        }

        if (notificationsRes.ok) {
          const notificationsData = await notificationsRes.json();
          setNotifications(notificationsData);
        }

        setRestForm({
          name: restData.name,
          priceRange: restData.priceRange,
          categoryId: (restData as any).categoryId || 1,
          foodStreetId: (restData as any).foodStreetId || 1,
          distance: restData.distance,
          address: restData.address,
          area: restData.area,
          openingHours: restData.openingHours,
          description: restData.description || '',
          tableStatuses: restData.tableStatuses || '',
          image: restData.image,
          isVerified: restData.isVerified,
          replySpeed: restData.replySpeed,
          latitude: restData.latitude || 10.759031,
          longitude: restData.longitude || 106.706962
        });
      } else if (user) {
        // Fetch current owner request if any
        const requestRes = await fetch(`${baseUrl}/api/owner/restaurant-request/${user.id}`);
        if (requestRes.ok) {
          const requestData = await requestRes.json();
          setRequestStatus({ status: requestData.status, note: requestData.adminNote });
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchRestaurant();
  }, [activeRestaurantId, user]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl}/api/owner/restaurant-request?ownerId=${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to submit request.');
      }

      const requestData = await res.json();
      setRequestStatus({ status: requestData.status, note: requestData.adminNote });
      syncUser({ ownerStatus: 'Pending' });
    } catch (err: any) {
      setError(err.message || 'Error submitting request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    try {
      const res = await fetch(`${baseUrl}/api/owner/restaurant/${activeRestaurantId}?${ownerQuery}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...restForm,
          rating: restaurant?.rating || 4.8
        })
      });

      if (!res.ok) throw new Error('Failed to update restaurant.');
      const updatedRest = await res.json();
      setRestaurant(updatedRest);
      onRestaurantUpdated?.(updatedRest);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating details.');
    }
  };

  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${baseUrl}/api/owner/restaurant/${activeRestaurantId}/dishes?${ownerQuery}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: '',
          name: dishForm.name,
          price: Number(dishForm.price),
          description: dishForm.description,
          image: dishForm.image || 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b'
        })
      });

      if (!res.ok) throw new Error('Failed to add dish.');
      const updatedRest = await res.json();
      setRestaurant(updatedRest);
      onRestaurantUpdated?.(updatedRest);
      setShowDishModal(false);
      setDishForm({ name: '', price: 0, description: '', image: '' });
    } catch (err: any) {
      alert(err.message || 'Error adding dish.');
    }
  };

  const handleDeleteDish = async (dishId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa món ăn này?')) return;
    try {
      const res = await fetch(`${baseUrl}/api/owner/restaurant/${activeRestaurantId}/dishes/${dishId}?${ownerQuery}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete dish.');
      const updatedRest = await res.json();
      setRestaurant(updatedRest);
      onRestaurantUpdated?.(updatedRest);
    } catch (err: any) {
      alert(err.message || 'Error deleting dish.');
    }
  };

  const handleGenerateQr = async () => {
    setQrLoading(true);
    setGeneratedQrToken(null);
    try {
      const res = await fetch(`${baseUrl}/api/auth/qr/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          restaurantId: activeRestaurantId,
          tableNumber: Number(tableNumber)
        })
      });

      if (!res.ok) throw new Error('Failed to generate QR token.');
      const data = await res.json();
      setGeneratedQrToken(data.token);
    } catch (err: any) {
      alert(err.message || 'Failed to generate QR.');
    } finally {
      setQrLoading(false);
    }
  };

  const handleSaveTablesList = async (updatedTables: any[]) => {
    if (!activeRestaurantId) return;
    setTablesSaveSuccess(false);
    try {
      const jsonString = JSON.stringify(updatedTables);
      const res = await fetch(`${baseUrl}/api/owner/restaurant/${activeRestaurantId}?${ownerQuery}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...restForm,
          tableStatuses: jsonString,
          rating: restaurant?.rating || 4.8
        })
      });

      if (!res.ok) throw new Error('Failed to save table layout.');
      const updatedRest = await res.json();
      setRestaurant(updatedRest);
      onRestaurantUpdated?.(updatedRest);
      setRestForm(prev => ({ ...prev, tableStatuses: jsonString }));
      setTablesSaveSuccess(true);
      setTimeout(() => setTablesSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error saving layout.');
    }
  };

  const handleAddTable = () => {
    const nextId = tablesList.length > 0 ? Math.max(...tablesList.map(t => t.id)) + 1 : 1;
    const newTable = {
      id: nextId,
      name: `Bàn ${nextId}`,
      status: 'vacant',
      capacity: 4
    };
    const updated = [...tablesList, newTable];
    setTablesList(updated);
    void handleSaveTablesList(updated);
  };

  const handleDeleteTable = (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bàn này khỏi sơ đồ?')) return;
    const updated = tablesList.filter(t => t.id !== id);
    setTablesList(updated);
    void handleSaveTablesList(updated);
  };

  const handleUpdateTableStatus = (id: number, status: 'vacant' | 'reserved' | 'occupied') => {
    const updated = tablesList.map(t => t.id === id ? { ...t, status } : t);
    setTablesList(updated);
    void handleSaveTablesList(updated);
  };

  const handleUpdateTableCapacity = (id: number, capacity: number) => {
    const updated = tablesList.map(t => t.id === id ? { ...t, capacity: Number(capacity) } : t);
    setTablesList(updated);
    void handleSaveTablesList(updated);
  };

  const handleUpdateTableName = (id: number, name: string) => {
    const updated = tablesList.map(t => t.id === id ? { ...t, name } : t);
    setTablesList(updated);
    void handleSaveTablesList(updated);
  };

  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) {
      alert('Vui lòng nhập nội dung bài viết!');
      return;
    }
    try {
      const res = await fetch(`${baseUrl}/api/communityposts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: '',
          author: restaurant?.name || user?.username || 'Quán ăn',
          handle: restaurant ? `@${restaurant.id}` : '@quan_an_official',
          avatar: restaurant?.image || 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b',
          timeAgo: 'Just now',
          rating: restaurant?.rating || 4.8,
          image: postImage.trim() || restaurant?.image || 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b',
          content: postContent,
          locationName: restaurant?.name || 'Vĩnh Khánh',
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
          isSaved: false,
          isRestaurantPost: true
        })
      });
      if (!res.ok) throw new Error('Failed to publish post.');
      alert(t('owner.publish_success', 'Đã đăng bài viết thành công lên Feed!'));
      setPostContent('');
      setPostImage('');
    } catch (err: any) {
      alert(err.message || 'Error publishing post.');
    }
  };

  const handleUpdateBookingStatus = async (bookingId: number, status: string) => {
    const actionLabel = status === 'Confirmed' ? 'duyệt' : status === 'Completed' ? 'hoàn thành' : 'từ chối';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionLabel} đơn đặt bàn này?`)) return;

    try {
      const res = await fetch(`${baseUrl}/api/owner/bookings/${bookingId}/status?${ownerQuery}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!res.ok) throw new Error('Failed to update booking status.');
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));

      // Refresh analytics
      const analyticsRes = await fetch(`${baseUrl}/api/owner/restaurant/${activeRestaurantId}/analytics?${ownerQuery}`);
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status.');
    }
  };

  const handleReportReview = async (reviewId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn báo cáo đánh giá này không?")) return;
    try {
      const res = await fetch(`${baseUrl}/api/owner/reviews/${reviewId}/report?ownerId=${user?.id}`, {
        method: 'POST'
      });
      if (res.ok) {
        alert("Đã báo cáo đánh giá vi phạm thành công tới Admin!");
      } else {
        const msg = await res.text();
        alert("Lỗi: " + msg);
      }
    } catch (e: any) {
      alert("Lỗi báo cáo: " + e.message);
    }
  };

  const handleMarkNotificationAsRead = async (id: number) => {
    try {
      const res = await fetch(`${baseUrl}/api/owner/notifications/${id}/read?${ownerQuery}`, {
        method: 'POST'
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#1a1a1a]/60">
        <span className="animate-spin text-3xl">⏳</span>
        <span className="font-mono text-xs mt-2 uppercase tracking-widest font-bold">Loading owner dashboard...</span>
      </div>
    );
  }

  // View when no restaurant linked to owner
  if (!activeRestaurantId) {
    return (
      <div className="max-w-md mx-auto w-full px-4 py-6">
        {requestStatus ? (
          <div className="bg-white border-3 border-[#1a1a1a] shadow-[8px_8px_0px_0px_#1a1a1a] p-6 text-[#1a1a1a]">
            <div className="border-b-2 border-dashed border-[#1a1a1a]/20 pb-4 mb-4">
              <span className="text-[9px] tracking-[0.3em] uppercase text-[#e2533b] font-mono font-bold block mb-1">
                YÊU CẦU MỞ QUÁN
              </span>
              <h2 className="font-serif italic font-bold text-2xl uppercase">Trạng thái yêu cầu</h2>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="p-4 border-2 border-[#1a1a1a] bg-[#fdfcf9]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#1a1a1a]/60">Trạng thái:</span>
                  <span className={`px-2 py-0.5 font-mono text-[10px] uppercase font-bold border ${
                    requestStatus.status === 'Pending' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' :
                    requestStatus.status === 'Approved' ? 'bg-green-100 border-green-400 text-green-800' :
                    'bg-red-100 border-red-400 text-red-800'
                  }`}>
                    {requestStatus.status === 'Pending' ? 'Đang chờ duyệt' :
                     requestStatus.status === 'Approved' ? 'Đã duyệt' : 'Bị từ chối'}
                  </span>
                </div>
                {requestStatus.note && (
                  <div className="mt-3 pt-3 border-t border-dashed border-[#1a1a1a]/15">
                    <span className="font-mono text-[9px] uppercase font-bold text-[#1a1a1a]/60 block">Ghi chú từ admin:</span>
                    <p className="text-xs italic mt-1 text-[#1a1a1a]/85">{requestStatus.note}</p>
                  </div>
                )}
              </div>

              {requestStatus.status === 'Rejected' && (
                <button
                  onClick={() => setRequestStatus(null)}
                  className="w-full bg-[#1a1a1a] hover:bg-[#e2533b] text-white py-2.5 font-mono text-xs uppercase tracking-widest border-2 border-[#1a1a1a] transition-all cursor-pointer shadow-md"
                >
                  Gửi yêu cầu mới
                </button>
              )}

              {requestStatus.status === 'Pending' && (
                <p className="text-center font-sans text-xs text-[#1a1a1a]/60 italic">
                  Yêu cầu của bạn đã được ghi nhận. Vui lòng liên hệ Admin để duyệt hồ sơ.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border-3 border-[#1a1a1a] shadow-[8px_8px_0px_0px_#1a1a1a] p-6 text-[#1a1a1a]">
            <div className="mb-6 border-b-2 border-dashed border-[#1a1a1a]/20 pb-4">
              <span className="text-[9px] tracking-[0.3em] uppercase text-[#e2533b] font-mono font-bold block mb-1">
                CHỦ QUÁN MỚI
              </span>
              <h2 className="font-serif italic font-bold text-2xl uppercase">
                Yêu cầu đăng ký quán ăn
              </h2>
              <p className="text-xs text-[#1a1a1a]/60 mt-1 font-sans">
                Bạn chưa liên kết với quán ăn nào. Vui lòng điền thông tin đăng ký bên dưới để gửi yêu cầu phê duyệt tới Admin!
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 text-xs font-mono font-bold text-[#e2533b] p-3 mb-4">
                Lỗi: {error}
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Tên quán ăn</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ví dụ: Ốc Oanh Vinh Khánh"
                  className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none focus:bg-[#f9f7f2]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Mức giá</label>
                  <select
                    value={createForm.priceRange}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, priceRange: e.target.value }))}
                    className="w-full bg-white border-2 border-[#1a1a1a] px-2.5 py-1.5 text-sm focus:outline-none"
                  >
                    <option value="$">$ (Rẻ)</option>
                    <option value="$$">$$ (Trung bình)</option>
                    <option value="$$$">$$$ (Sang chảnh)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Thể loại ẩm thực</label>
                  <select
                    value={createForm.categoryId}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, categoryId: parseInt(e.target.value) }))}
                    className="w-full bg-white border-2 border-[#1a1a1a] px-2.5 py-1.5 text-sm focus:outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Phố ẩm thực</label>
                <select
                  value={createForm.foodStreetId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, foodStreetId: parseInt(e.target.value) }))}
                  className="w-full bg-white border-2 border-[#1a1a1a] px-2.5 py-1.5 text-sm focus:outline-none"
                >
                  {foodStreets.map(st => (
                    <option key={st.id} value={st.id}>{st.name} ({st.district})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Địa chỉ chi tiết</label>
                <input
                  type="text"
                  value={createForm.address}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Ví dụ: 530 Vĩnh Khánh, Phường 10"
                  className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Khu vực (Quận)</label>
                  <input
                    type="text"
                    value={createForm.area}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, area: e.target.value }))}
                    placeholder="Ví dụ: Quận 4"
                    className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Giờ mở cửa</label>
                  <input
                    type="text"
                    value={createForm.openingHours}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, openingHours: e.target.value }))}
                    placeholder="Ví dụ: 16:00 - 23:00"
                    className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Ảnh quán ăn từ thiết bị</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => restRegImageRef.current?.click()}
                    className="flex-1 py-2 bg-white text-[#1a1a1a] hover:bg-[#f9f7f2] border-2 border-dashed border-[#1a1a1a]/40 hover:border-[#e2533b] hover:text-[#e2533b] font-mono text-xs font-bold uppercase transition-all cursor-pointer text-center"
                  >
                    Chọn file ảnh quán ăn
                  </button>
                  {createForm.image && (
                    <img src={createForm.image} alt="Preview" className="w-12 h-12 object-cover border border-[#1a1a1a]/20 shrink-0" />
                  )}
                </div>
                <input
                  ref={restRegImageRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleRestRegImageUpload}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Vĩ độ (Latitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={createForm.latitude}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                    className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none font-mono"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Kinh độ (Longitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={createForm.longitude}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                    className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-[#1a1a1a] hover:bg-[#e2533b] text-white py-3 font-mono text-xs uppercase tracking-widest border-2 border-[#1a1a1a] transition-all cursor-pointer shadow-md"
              >
                Gửi yêu cầu phê duyệt
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  const simulateScanUrl = `${window.location.origin}/?qr=${generatedQrToken}`;

  return (
    <div className="flex flex-col gap-6 text-[#1a1a1a]">
      {/* Title Header */}
      <div className="bg-[#1a1a1a] text-white p-6 border-3 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#e2533b] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="font-mono text-[9px] text-[#e2533b] uppercase tracking-[0.3em] font-extrabold block mb-1">
            MANAGEMENT PANEL
          </span>
          <h2 className="font-serif italic font-bold text-3xl flex items-center gap-2">
            <Store size={26} className="text-[#e2533b]" />
            {restaurant.name}
          </h2>
          <p className="text-xs font-mono text-white/60 mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1"><MapPin size={12} /> {restaurant.area}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {restaurant.openingHours}</span>
          </p>
        </div>

        {/* Tab Headers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 border-2 border-white hover:bg-white/10 text-white transition-all cursor-pointer font-bold relative flex items-center justify-center h-10 w-10 active:translate-y-0.5"
              title="Thông báo"
            >
              <Bell size={16} />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#e2533b] border border-[#1a1a1a] text-[9px] font-black text-white flex items-center justify-center rounded-none shadow-md">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border-3 border-[#1a1a1a] shadow-[6px_6px_0px_0px_#1a1a1a] text-[#1a1a1a] z-[1000] p-3 max-h-96 overflow-y-auto animate-in fade-in duration-150">
                <div className="flex justify-between items-center border-b border-dashed border-[#1a1a1a]/15 pb-2 mb-2">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#1a1a1a]/60">Thông báo cho Chủ quán</span>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => setNotifications([])}
                      className="font-mono text-[8px] uppercase tracking-wider text-red-500 hover:underline font-bold"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs font-mono py-6 text-[#1a1a1a]/40 uppercase">Không có thông báo nào</p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.isRead) handleMarkNotificationAsRead(n.id);
                        }}
                        className={`p-2.5 border border-[#1a1a1a]/15 flex flex-col gap-1 cursor-pointer hover:bg-[#f9f7f2] transition-colors relative ${!n.isRead ? 'bg-amber-50/70 border-amber-300' : 'bg-white'}`}
                      >
                        {!n.isRead && <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-amber-500 rounded-full"></span>}
                        <h4 className="font-serif italic font-bold text-xs leading-tight pr-3">{n.title}</h4>
                        <p className="font-sans text-[10px] text-[#1a1a1a]/70 leading-normal">{n.body}</p>
                        <span className="font-mono text-[8px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {(['analytics', 'bookings', 'tables', 'dishes', 'reviews', 'posts', 'settings', 'qr'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 font-mono text-[10px] uppercase tracking-widest border-2 border-white transition-all cursor-pointer font-bold ${
                activeTab === tab 
                  ? 'bg-[#e2533b] text-white border-[#e2533b]' 
                  : 'bg-white text-[#1a1a1a] border-white hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab === 'analytics' ? t('admin.tabs.accounts', 'Thống kê') :
               tab === 'bookings' ? t('booking.title', 'Đặt bàn') :
               tab === 'tables' ? t('owner.table_map', 'Sơ đồ bàn') :
               tab === 'dishes' ? t('detail.signature_dishes', 'Món ăn') :
               tab === 'reviews' ? t('admin.tabs.moderation', 'Đánh giá') :
               tab === 'posts' ? t('owner.posts', 'Bài đăng') :
               tab === 'settings' ? t('profile.owner_console', 'Cấu hình') : 'Mã QR'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'analytics' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col justify-between">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/55 font-bold flex items-center gap-1">
                <Calendar size={12} /> Tổng đặt bàn
              </span>
              <span className="font-serif italic font-bold text-3xl mt-1 text-[#1a1a1a]">
                {analytics?.totalBookings ?? 0}
              </span>
            </div>

            <div className="bg-[#fef8e7] p-4 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col justify-between">
              <span className="font-mono text-[9px] uppercase tracking-wider text-amber-600 font-bold flex items-center gap-1">
                <Clock size={12} /> Chờ duyệt
              </span>
              <span className="font-serif italic font-bold text-3xl mt-1 text-amber-700">
                {analytics?.pendingBookings ?? 0}
              </span>
            </div>

            <div className="bg-[#e8fbf0] p-4 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col justify-between">
              <span className="font-mono text-[9px] uppercase tracking-wider text-green-600 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> Đã duyệt
              </span>
              <span className="font-serif italic font-bold text-3xl mt-1 text-green-700">
                {analytics?.confirmedBookings ?? 0}
              </span>
            </div>

            <div className="bg-[#edf6ff] p-4 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col justify-between">
              <span className="font-mono text-[9px] uppercase tracking-wider text-blue-600 font-bold flex items-center gap-1">
                <TrendingUp size={12} /> Hoàn thành
              </span>
              <span className="font-serif italic font-bold text-3xl mt-1 text-blue-700">
                {analytics?.completedBookings ?? 0}
              </span>
            </div>

            <div className="bg-[#fff0f0] p-4 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col justify-between">
              <span className="font-mono text-[9px] uppercase tracking-wider text-red-600 font-bold flex items-center gap-1">
                <XCircle size={12} /> Đã hủy / Từ chối
              </span>
              <span className="font-serif italic font-bold text-3xl mt-1 text-red-700">
                {analytics?.cancelledBookings ?? 0}
              </span>
            </div>

            <div className="bg-[#fdfaf2] p-4 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col justify-between col-span-2 md:col-span-1">
              <span className="font-mono text-[9px] uppercase tracking-wider text-amber-500 font-bold flex items-center gap-1">
                <Star size={12} /> Đánh giá TB
              </span>
              <span className="font-serif italic font-bold text-3xl mt-1 text-amber-600 flex items-center gap-1">
                {analytics?.averageRating.toFixed(1) ?? '0.0'}
                <span className="text-xs font-sans text-[#1a1a1a]/55 font-light">({analytics?.totalReviews ?? 0} reviews)</span>
              </span>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#1a1a1a] p-5">
            <h3 className="font-serif italic font-bold text-lg">Chào mừng quay trở lại, {user?.username}!</h3>
            <p className="text-xs text-[#1a1a1a]/70 mt-1 leading-relaxed">
              Đây là hệ thống quản lý quán ăn của bạn. Bạn có thể theo dõi thống kê đặt bàn, phê duyệt lịch hẹn, quản lý món ăn đặc trưng của quán, cập nhật địa chỉ/giờ mở cửa và tạo mã QR thông minh cho thực khách quét ngay tại bàn.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#1a1a1a] p-5 animate-in fade-in duration-200">
          <div className="border-b border-[#1a1a1a]/15 pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-serif italic font-bold text-lg">Danh sách đặt bàn</h3>
              <p className="font-mono text-[9px] text-[#1a1a1a]/55 uppercase tracking-wider mt-0.5">RESERVATION LIST MANAGER</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-[#1a1a1a] bg-[#f9f7f2] font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/60">
                  <th className="py-2.5 px-3">Mã đơn</th>
                  <th className="py-2.5 px-3">Ngày đặt</th>
                  <th className="py-2.5 px-3">Giờ</th>
                  <th className="py-2.5 px-3">Số khách</th>
                  <th className="py-2.5 px-3">Vị trí ngồi</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]/10">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center font-mono text-xs text-[#1a1a1a]/40 uppercase">
                      Chưa có đơn đặt bàn nào.
                    </td>
                  </tr>
                ) : (
                  bookings.map(b => (
                    <tr key={b.id} className="hover:bg-[#fcfbfa]/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold">#BK-{b.id}</td>
                      <td className="py-3 px-3 font-semibold">{b.date}</td>
                      <td className="py-3 px-3 font-mono">{b.time}</td>
                      <td className="py-3 px-3 font-bold text-sm">{b.guests}</td>
                      <td className="py-3 px-3 font-serif italic">{b.seating}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-extrabold tracking-wider border shadow-xs ${
                          b.status.toLowerCase() === 'confirmed' || b.status === 'Đã nhận' ? 'bg-green-100 text-green-800 border-green-300' :
                          b.status.toLowerCase() === 'pending' || b.status === 'Chờ duyệt' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                          b.status.toLowerCase() === 'completed' || b.status === 'Hoàn thành' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          'bg-red-100 text-red-800 border-red-300'
                        }`}>
                          {b.status === 'Pending' ? 'Chờ duyệt' :
                           b.status === 'Confirmed' ? 'Đã nhận' :
                           b.status === 'Completed' ? 'Hoàn thành' :
                           b.status === 'Rejected' ? 'Bị từ chối' : b.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex gap-2">
                          {(b.status.toLowerCase() === 'pending' || b.status === 'Chờ duyệt') && (
                            <>
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'Confirmed')}
                                className="px-2 py-1 flex items-center gap-1 border-2 border-[#1a1a1a] hover:bg-green-100 bg-white font-mono text-[9px] uppercase font-bold cursor-pointer transition-colors shadow-xs active:translate-y-0.5"
                                title="Nhận đơn đặt bàn"
                              >
                                <Check size={11} strokeWidth={3} className="text-green-600" /> Nhận
                              </button>
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'Rejected')}
                                className="px-2 py-1 flex items-center gap-1 border-2 border-[#1a1a1a] hover:bg-red-100 bg-white font-mono text-[9px] uppercase font-bold cursor-pointer transition-colors shadow-xs active:translate-y-0.5 text-red-500"
                                title="Từ chối đơn"
                              >
                                <X size={11} strokeWidth={3} className="text-red-500" /> Từ chối
                              </button>
                            </>
                          )}
                          {(b.status.toLowerCase() === 'confirmed' || b.status === 'Đã nhận') && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'Completed')}
                              className="px-2 py-1 flex items-center gap-1 border-2 border-[#1a1a1a] hover:bg-blue-100 bg-white font-mono text-[9px] uppercase font-bold cursor-pointer transition-colors shadow-xs active:translate-y-0.5"
                              title="Hoàn thành phục vụ"
                            >
                              <CheckCircle2 size={11} strokeWidth={3} className="text-blue-600" /> Hoàn thành
                            </button>
                          )}
                          {(b.status.toLowerCase() === 'completed' || b.status.toLowerCase() === 'rejected' || b.status.toLowerCase() === 'cancelled' || b.status === 'Hoàn thành' || b.status === 'Bị từ chối' || b.status === 'Đã hủy') && (
                            <span className="text-[10px] italic text-[#1a1a1a]/40 font-serif">Không có thao tác</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'dishes' && (
        <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#1a1a1a] p-5 animate-in fade-in duration-200">
          <div className="border-b border-[#1a1a1a]/15 pb-3 mb-4 flex justify-between items-center">
            <div>
              <h3 className="font-serif italic font-bold text-lg">Món ăn đặc trưng</h3>
              <p className="font-mono text-[9px] text-[#1a1a1a]/55 uppercase tracking-wider mt-0.5">SIGNATURE MENU MANAGEMENT</p>
            </div>

            <button
              onClick={() => setShowDishModal(true)}
              className="bg-[#1a1a1a] hover:bg-[#e2533b] text-white font-mono text-[10px] uppercase tracking-widest px-4 py-2 border-2 border-[#1a1a1a] transition-all cursor-pointer shadow flex items-center gap-1.5 active:translate-y-0.5 font-bold"
            >
              <Plus size={13} strokeWidth={3} /> Thêm món ăn
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurant.dishes.length === 0 ? (
              <div className="col-span-full py-12 text-center font-mono text-xs text-[#1a1a1a]/40 uppercase">
                Chưa có món ăn nào được thêm vào thực đơn đặc trưng.
              </div>
            ) : (
              restaurant.dishes.map(d => (
                <div
                  key={d.id}
                  className="bg-white border-2 border-[#1a1a1a] rounded-none overflow-hidden shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col relative group hover:border-[#e2533b] transition-all"
                >
                  <div
                    className="h-40 w-full bg-cover bg-center filter grayscale group-hover:grayscale-0 transition-all duration-300 border-b-2 border-[#1a1a1a]"
                    style={{ backgroundImage: `url('${d.image}')` }}
                  />

                  <div className="p-4 flex flex-col justify-between flex-1 gap-2">
                    <div>
                      <h3 className="font-serif italic font-bold text-base text-[#1a1a1a] truncate">{d.name}</h3>
                      <p className="font-sans text-xs text-[#1a1a1a]/60 line-clamp-2 mt-1 leading-normal font-light">{d.description || 'Không có mô tả món ăn.'}</p>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-[#1a1a1a]/10">
                      <p className="font-mono font-bold text-[#e2533b] text-sm">${d.price.toFixed(2)}</p>
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteDish(d.id)}
                        title="Xóa món ăn"
                        className="w-8 h-8 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-[#1a1a1a]/15 hover:border-red-500 flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'tables' && (
        <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#1a1a1a] p-5 animate-in fade-in duration-200">
          <div className="border-b border-[#1a1a1a]/15 pb-3 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-serif italic font-bold text-lg">{t('owner.table_layout', 'SƠ ĐỒ BÀN ĂN CHI TIẾT')}</h3>
              <p className="font-mono text-[9px] text-[#1a1a1a]/55 uppercase tracking-wider mt-0.5">HOTEL-STYLE SEATING MANAGER</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {tablesSaveSuccess && (
                <span className="bg-[#cbf3d2] text-green-900 border border-green-400 font-mono text-[9px] uppercase tracking-wider font-extrabold px-3 py-1 animate-pulse">
                  💾 {t('owner.layout_saved_success', 'Đã lưu thành công!')}
                </span>
              )}
              <span className="text-[10px] font-mono text-green-600 flex items-center gap-1.5 bg-green-50 border border-green-200 px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                Tự động đồng bộ // LIVE
              </span>
              <button
                onClick={handleAddTable}
                className="bg-[#1a1a1a] hover:bg-[#e2533b] text-white font-mono text-[10px] uppercase tracking-widest px-4 py-2 border-2 border-[#1a1a1a] transition-all cursor-pointer shadow flex items-center gap-1.5 font-bold active:translate-y-0.5"
              >
                <Plus size={13} strokeWidth={3} /> {t('owner.add_table', 'Thêm bàn ăn')}
              </button>
            </div>
          </div>

          {/* Table Map Statistics bar */}
          {(() => {
            const computedTables = tablesList.map(tbl => ({ ...tbl, status: getTableStatus(tbl) }));
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 font-mono text-[9px] uppercase tracking-wider">
                <div className="bg-[#f9f7f2] border border-[#1a1a1a]/10 p-3 flex flex-col gap-0.5">
                  <span className="text-[#1a1a1a]/55 font-bold">Tổng số bàn</span>
                  <span className="text-xl font-bold text-[#1a1a1a]">{computedTables.length}</span>
                </div>
                <div className="bg-[#e8fbf0] border border-emerald-200 p-3 flex flex-col gap-0.5 text-emerald-800">
                  <span className="font-bold">{t('owner.table_vacant', 'Bàn trống')}</span>
                  <span className="text-xl font-bold">{computedTables.filter(tbl => tbl.status === 'vacant').length}</span>
                </div>
                <div className="bg-[#fef8e7] border border-amber-200 p-3 flex flex-col gap-0.5 text-amber-800">
                  <span className="font-bold">{t('owner.table_reserved', 'Đã đặt')}</span>
                  <span className="text-xl font-bold">{computedTables.filter(tbl => tbl.status === 'reserved').length}</span>
                </div>
                <div className="bg-[#fff0f0] border border-rose-200 p-3 flex flex-col gap-0.5 text-rose-850">
                  <span className="font-bold">{t('owner.table_occupied', 'Có khách')}</span>
                  <span className="text-xl font-bold">{computedTables.filter(tbl => tbl.status === 'occupied').length}</span>
                </div>
              </div>
            );
          })()}

          {/* Interactive Seating Layout Grid */}
          {tablesList.length === 0 ? (
            <div className="text-center py-16 font-mono text-xs text-[#1a1a1a]/40 uppercase border-2 border-dashed border-[#1a1a1a]/15 bg-[#f9f7f2]">
              {t('owner.no_tables', 'Chưa thiết lập sơ đồ bàn. Nhấp \'Thêm bàn ăn\' để bắt đầu thiết kế!')}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tablesList.map(t => {
                const status = getTableStatus(t);
                const isVacant = status === 'vacant';
                const isReserved = status === 'reserved';
                const isOccupied = status === 'occupied';
                const activeBooking = getTableActiveBooking(t);

                return (
                  <div
                    key={t.id}
                    className={`border-2 border-[#1a1a1a] p-3 flex flex-col justify-between gap-3 relative shadow-[3px_3px_0px_0px_#1a1a1a] transition-all duration-300 ${
                      isVacant ? 'bg-[#e8fbf0]/65 border-emerald-700/80' :
                      isReserved ? 'bg-[#fef8e7]/70 border-amber-600/80' :
                      'bg-[#fff0f0]/65 border-rose-700/80'
                    }`}
                  >
                    {activeBooking && (
                      <span className="absolute -top-2.5 -right-2.5 bg-[#e2533b] text-white border border-[#1a1a1a] text-[7px] font-mono font-black px-1.5 py-0.5 shadow-md tracking-wider animate-pulse z-10" title={`Khách đặt: ${activeBooking.guests} khách`}>
                        #BK-{activeBooking.id}
                      </span>
                    )}
                    {/* Header: Name and capacity */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-start">
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => handleUpdateTableName(t.id, e.target.value)}
                          className="bg-transparent border-b border-dashed border-[#1a1a1a]/20 font-serif italic font-bold text-sm focus:outline-none w-24 text-[#1a1a1a] focus:border-[#e2533b]"
                        />
                        <button
                          onClick={() => handleDeleteTable(t.id)}
                          className="w-5 h-5 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white border border-transparent hover:border-[#1a1a1a] rounded-xs transition-colors cursor-pointer"
                          title="Xóa bàn"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1 mt-1 text-[10px]">
                        <span className="font-mono text-[#1a1a1a]/60">Sức chứa:</span>
                        <select
                          value={t.capacity}
                          onChange={(e) => handleUpdateTableCapacity(t.id, Number(e.target.value))}
                          className="bg-white border border-[#1a1a1a]/30 font-mono text-[10px] py-0.5 px-1 focus:outline-none"
                        >
                          {[2, 4, 6, 8, 10, 12, 16].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Status control toggle */}
                    <div className="flex border border-[#1a1a1a] overflow-hidden rounded-xs mt-1 text-[8px] font-mono font-bold">
                      <button
                        type="button"
                        onClick={() => handleUpdateTableStatus(t.id, 'vacant')}
                        className={`flex-1 py-1.5 text-center cursor-pointer transition-all ${
                          isVacant ? 'bg-emerald-600 text-white font-black' : 'bg-white text-emerald-800 hover:bg-emerald-50'
                        }`}
                      >
                        TRỐNG
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateTableStatus(t.id, 'reserved')}
                        className={`flex-1 py-1.5 text-center cursor-pointer transition-all border-x border-[#1a1a1a] ${
                          isReserved ? 'bg-amber-500 text-white font-black' : 'bg-white text-amber-800 hover:bg-amber-50'
                        }`}
                      >
                        ĐẶT
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateTableStatus(t.id, 'occupied')}
                        className={`flex-1 py-1.5 text-center cursor-pointer transition-all ${
                          isOccupied ? 'bg-rose-600 text-white font-black' : 'bg-white text-rose-800 hover:bg-rose-50'
                        }`}
                      >
                        KHÁCH
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#1a1a1a] p-5 animate-in fade-in duration-200">
          <div className="border-b border-[#1a1a1a]/15 pb-3 mb-4">
            <h3 className="font-serif italic font-bold text-lg">{t('owner.create_post', 'Đăng bài viết mới')}</h3>
            <p className="font-mono text-[9px] text-[#1a1a1a]/55 uppercase tracking-wider mt-0.5">OFFICIAL RESTAURANT FEED PUBLISHER</p>
          </div>

          <form onSubmit={handlePublishPost} className="flex flex-col gap-4 max-w-xl">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9px] uppercase font-bold tracking-wider">{t('owner.post_content', 'Nội dung bài viết')}</label>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder={t('owner.post_content_placeholder', 'Nhập thông báo, khuyến mãi hoặc tin tức từ quán của bạn...')}
                className="bg-white border-2 border-[#1a1a1a] px-3 py-2 text-sm focus:outline-none h-32 focus:bg-[#f9f7f2]"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Ảnh đính kèm từ thiết bị</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => newsPostImageRef.current?.click()}
                  className="flex-1 py-2 bg-white text-[#1a1a1a] hover:bg-[#f9f7f2] border-2 border-dashed border-[#1a1a1a]/40 hover:border-[#e2533b] hover:text-[#e2533b] font-mono text-xs font-bold uppercase transition-all cursor-pointer text-center"
                >
                  Chọn file ảnh đính kèm
                </button>
                {postImage && (
                  <img src={postImage} alt="Preview" className="w-12 h-12 object-cover border border-[#1a1a1a]/20 shrink-0" />
                )}
              </div>
              <input
                ref={newsPostImageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleNewsPostImageUpload}
              />
              <p className="text-[10px] text-[#1a1a1a]/40 italic font-sans mt-0.5">
                Bỏ trống nếu muốn sử dụng ảnh đại diện mặc định của quán ăn.
              </p>
            </div>

            <button
              type="submit"
              className="bg-[#1a1a1a] text-white hover:bg-[#e2533b] py-3 font-mono text-xs uppercase tracking-widest border-2 border-[#1a1a1a] transition-all cursor-pointer shadow-md active:translate-y-0.5 flex items-center justify-center gap-1.5 font-bold"
            >
              <Megaphone size={14} /> {t('owner.publish_btn', 'Đăng lên bảng tin // 📢')}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#1a1a1a] p-5 animate-in fade-in duration-200">
          <div className="border-b border-[#1a1a1a]/15 pb-3 mb-4 flex justify-between items-center">
            <div>
              <h3 className="font-serif italic font-bold text-lg">Cấu hình Quán ăn</h3>
              <p className="font-mono text-[9px] text-[#1a1a1a]/55 uppercase tracking-wider mt-0.5">OWNER PROFILE EDITOR</p>
            </div>

            {saveSuccess && (
              <span className="bg-[#cbf3d2] text-green-900 border border-green-400 font-mono text-[9px] uppercase tracking-wider font-extrabold px-3 py-1">
                💾 Đã lưu thành công!
              </span>
            )}
          </div>

          <form onSubmit={handleUpdateRestaurant} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Tên quán ăn</label>
                <input
                  type="text"
                  value={restForm.name}
                  onChange={(e) => setRestForm(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Ảnh biểu diễn từ thiết bị</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => restSettingsImageRef.current?.click()}
                    className="flex-1 py-2 bg-white text-[#1a1a1a] hover:bg-[#f9f7f2] border-2 border-dashed border-[#1a1a1a]/40 hover:border-[#e2533b] hover:text-[#e2533b] font-mono text-xs font-bold uppercase transition-all cursor-pointer text-center"
                  >
                    Chọn file ảnh biểu diễn
                  </button>
                  {restForm.image && (
                    <img src={restForm.image} alt="Preview" className="w-12 h-12 object-cover border border-[#1a1a1a]/20 shrink-0" />
                  )}
                </div>
                <input
                  ref={restSettingsImageRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleRestSettingsImageUpload}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9px] uppercase font-bold tracking-wider">{t('owner.description', 'Mô tả quán ăn')}</label>
              <textarea
                value={restForm.description}
                onChange={(e) => setRestForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('owner.description_placeholder', 'Nhập mô tả chi tiết của quán ăn...')}
                className="bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none h-20"
              />
              <button
                type="button"
                onClick={handleToggleTTS}
                className={`mt-1.5 flex items-center gap-2 px-4 py-2 border-2 border-[#1a1a1a] font-mono text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer shadow-xs active:translate-y-0.5 self-start ${
                  isSpeaking
                    ? 'bg-[#e2533b] text-white hover:bg-red-600'
                    : 'bg-white text-[#1a1a1a] hover:bg-[#f9f7f2]'
                }`}
              >
                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                {isSpeaking ? 'Dừng đọc' : '🔊 Nghe mô tả quán'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Mức giá</label>
                <select
                  value={restForm.priceRange}
                  onChange={(e) => setRestForm(prev => ({ ...prev, priceRange: e.target.value }))}
                  className="bg-white border-2 border-[#1a1a1a] px-2.5 py-1.5 text-sm focus:outline-none"
                >
                  <option value="$">$ (Bình dân)</option>
                  <option value="$$">$$ (Tầm trung)</option>
                  <option value="$$$">$$$ (Cao cấp)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Danh mục</label>
                <select
                  value={restForm.categoryId}
                  onChange={(e) => setRestForm(prev => ({ ...prev, categoryId: Number(e.target.value) }))}
                  className="bg-white border-2 border-[#1a1a1a] px-2.5 py-1.5 text-sm focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Giờ mở cửa</label>
                <input
                  type="text"
                  value={restForm.openingHours}
                  onChange={(e) => setRestForm(prev => ({ ...prev, openingHours: e.target.value }))}
                  className="bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Địa chỉ chính xác</label>
                <input
                  type="text"
                  value={restForm.address}
                  onChange={(e) => setRestForm(prev => ({ ...prev, address: e.target.value }))}
                  className="bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Khu vực (Quận / Huyện)</label>
                <input
                  type="text"
                  value={restForm.area}
                  onChange={(e) => setRestForm(prev => ({ ...prev, area: e.target.value }))}
                  className="bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-dashed border-[#1a1a1a]/15 pt-3">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Vĩ độ (Latitude)</label>
                <input
                  type="number"
                  step="0.000001"
                  value={restForm.latitude}
                  onChange={(e) => setRestForm(prev => ({ ...prev, latitude: Number(e.target.value) }))}
                  className="bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Kinh độ (Longitude)</label>
                <input
                  type="number"
                  step="0.000001"
                  value={restForm.longitude}
                  onChange={(e) => setRestForm(prev => ({ ...prev, longitude: Number(e.target.value) }))}
                  className="bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#1a1a1a] text-white hover:bg-[#e2533b] py-3 font-mono text-xs uppercase tracking-widest border-2 border-[#1a1a1a] transition-all cursor-pointer shadow-md active:translate-y-0.5"
            >
              Cập nhật thông tin quán
            </button>
          </form>
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#1a1a1a] p-5 animate-in fade-in duration-200">
          <div className="border-b border-[#1a1a1a]/15 pb-3 mb-4">
            <h3 className="font-serif italic font-bold text-lg leading-tight">Tạo QR Code bàn ăn</h3>
            <p className="font-mono text-[9px] text-[#1a1a1a]/55 uppercase tracking-wider mt-0.5">ENCRYPTED SCAN ACCESS</p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 flex flex-col gap-4">
              <p className="font-sans text-xs text-[#1a1a1a]/60 leading-relaxed font-light">
                Mỗi bàn ăn tại quán cần có một mã QR riêng. Khi thực khách quét mã này tại bàn ăn, họ sẽ được đăng nhập nhanh vào Foodio, kiểm tra thông tin thực đơn chuẩn và bắt đầu đặt bàn/tour trực tiếp tại bàn.
              </p>

              <div className="flex items-center border-2 border-[#1a1a1a] bg-white px-3 py-2 shadow-[2px_2px_0px_0px_#1a1a1a] max-w-xs">
                <span className="font-mono text-xs font-bold uppercase tracking-wider mr-2 text-[#1a1a1a]/50">Số bàn ăn</span>
                <input
                  type="number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(Number(e.target.value))}
                  className="bg-transparent text-sm font-mono font-bold outline-none flex-1 text-right"
                  min="1"
                />
              </div>

              <button
                onClick={handleGenerateQr}
                disabled={qrLoading}
                className="bg-[#1a1a1a] text-white hover:bg-[#e2533b] px-4 py-3 font-mono text-xs uppercase tracking-widest border-2 border-[#1a1a1a] transition-all cursor-pointer shadow-md active:translate-y-0.5 disabled:opacity-50 max-w-xs"
              >
                {qrLoading ? 'Đang tạo mã...' : 'Tạo mã QR bàn ăn // 🔑'}
              </button>
            </div>

            {generatedQrToken && (
              <div className="w-full md:w-[280px] border-2 border-[#1a1a1a] p-4 bg-[#f9f7f2] flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200">
                <div className="w-40 h-40 bg-white border-2 border-[#1a1a1a] p-2 flex items-center justify-center relative shadow-xs">
                  <div
                    className="w-full h-full bg-cover"
                    style={{
                      backgroundImage: `url('https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(simulateScanUrl)}&color=1a1a1a&bgcolor=ffffff')`,
                      backgroundPosition: 'center',
                      backgroundSize: 'contain'
                    }}
                  />
                </div>

                <div className="text-left w-full">
                  <span className="text-[8px] font-mono font-bold uppercase text-[#1a1a1a]/40 tracking-wider">Mã token mã hóa</span>
                  <p className="text-[9px] font-mono text-slate-500 break-all select-all line-clamp-2 bg-white border border-[#1a1a1a]/10 p-1 mt-0.5">
                    {generatedQrToken}
                  </p>
                </div>

                <a
                  href={simulateScanUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full text-center bg-[#e2533b] text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_0px_#1a1a1a] hover:shadow-none transition-all py-2 font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                >
                  📲 Giả lập quét mã QR
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#1a1a1a] p-5 animate-in fade-in duration-200">
          <div className="border-b border-[#1a1a1a]/15 pb-3 mb-4">
            <h3 className="font-serif italic font-bold text-lg">Đánh giá từ khách hàng</h3>
            <p className="font-mono text-[9px] text-[#1a1a1a]/55 uppercase tracking-wider mt-0.5">CUSTOMER REVIEWS & FEEDBACK</p>
          </div>

          <div className="flex flex-col gap-4">
            {!restaurant?.reviews || restaurant.reviews.length === 0 ? (
              <div className="text-center py-12 font-mono text-xs text-[#1a1a1a]/40 uppercase">
                Chưa có đánh giá nào cho quán ăn của bạn.
              </div>
            ) : (
              restaurant.reviews.map((rev: any) => (
                <div key={rev.id} className="p-4 border-2 border-[#1a1a1a] bg-[#fdfcf9] shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#e2533b] transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif italic font-bold text-sm">{rev.author}</span>
                      <span className="text-xs font-mono text-slate-400">({rev.role})</span>
                      <div className="flex text-[#e2533b] ml-2">
                        {Array.from({ length: 5 }).map((_, st) => (
                          <Star 
                            key={st} 
                            size={12} 
                            className={`select-none ${st < Math.floor(rev.rating) ? 'fill-[#e2533b] text-[#e2533b]' : 'text-slate-300'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#1a1a1a]/80 mt-1 leading-relaxed italic">"{rev.comment}"</p>
                    {rev.imageUrl && (
                      <img src={rev.imageUrl} alt="Attachment" className="mt-2 w-32 h-20 object-cover border border-[#1a1a1a]/20" />
                    )}
                    <span className="text-[10px] font-mono text-slate-400 mt-2 block">
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => handleReportReview(rev.id)}
                    className="px-3 py-1.5 flex items-center gap-1 border-2 border-[#1a1a1a] hover:bg-amber-100 bg-white font-mono text-[9px] uppercase font-bold cursor-pointer transition-colors shadow-xs active:translate-y-0.5 text-amber-600 shrink-0"
                  >
                    <AlertTriangle size={11} className="text-amber-500" /> Báo cáo vi phạm
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Signature Dish Addition Modal */}
      {showDishModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#fdfcf9] border-3 border-[#1a1a1a] shadow-[8px_8px_0px_0px_#1a1a1a] p-6 text-[#1a1a1a] relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowDishModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border-2 border-[#1a1a1a] bg-white hover:bg-[#e2533b] hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} strokeWidth={3} />
            </button>

            <div className="mb-4">
              <span className="text-[9px] tracking-[0.3em] uppercase text-[#e2533b] font-mono font-bold block mb-1">
                ADD SIGNATURE DISH TO MENU
              </span>
              <h2 className="font-serif italic font-bold text-xl uppercase">Thêm món ăn đặc trưng</h2>
            </div>

            <form onSubmit={handleAddDish} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Tên món ăn</label>
                <input
                  type="text"
                  value={dishForm.name}
                  onChange={(e) => setDishForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Cua sốt bơ tỏi"
                  className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Giá tiền ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={dishForm.price}
                  onChange={(e) => setDishForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                  placeholder="Ex: 12.50"
                  className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Mô tả ngắn</label>
                <textarea
                  value={dishForm.description}
                  onChange={(e) => setDishForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả tóm tắt món ăn..."
                  className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none h-20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Ảnh món ăn từ thiết bị</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => dishImageRef.current?.click()}
                    className="flex-1 py-2 bg-white text-[#1a1a1a] hover:bg-[#f9f7f2] border-2 border-dashed border-[#1a1a1a]/40 hover:border-[#e2533b] hover:text-[#e2533b] font-mono text-xs font-bold uppercase transition-all cursor-pointer text-center"
                  >
                    Chọn file ảnh món ăn
                  </button>
                  {dishForm.image && (
                    <img src={dishForm.image} alt="Preview" className="w-12 h-12 object-cover border border-[#1a1a1a]/20 shrink-0" />
                  )}
                </div>
                <input
                  ref={dishImageRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleDishImageUpload}
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-[#1a1a1a] text-white hover:bg-[#e2533b] py-2.5 font-mono text-xs uppercase tracking-widest border-2 border-[#1a1a1a] transition-all cursor-pointer shadow-md active:translate-y-0.5"
              >
                Lưu món ăn
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
