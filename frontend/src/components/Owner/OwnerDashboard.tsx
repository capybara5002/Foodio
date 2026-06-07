import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Restaurant, Category, RestaurantRequest } from '../../types';
import { Trash2, X, Clock, AlertCircle } from 'lucide-react';

interface OwnerDashboardProps {
  onRestaurantUpdated?: (updated: Restaurant) => void;
}

export default function OwnerDashboard({ onRestaurantUpdated }: OwnerDashboardProps) {
  const { user, updateUserRestaurantId } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restaurantRequest, setRestaurantRequest] = useState<RestaurantRequest | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodStreets, setFoodStreets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
    image: '',
    isVerified: true,
    replySpeed: 'Usually replies in 5m',
    latitude: 10.759031,
    longitude: 106.706962
  });

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
    isVerified: true,
    replySpeed: 'Usually replies in 5m',
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

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  const activeRestaurantId = user?.restaurantId;

  const fetchRestaurant = async () => {
    setIsLoading(true);
    setError(null);
    try {
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
        const restRes = await fetch(`${baseUrl}/api/owner/restaurant/${activeRestaurantId}`);
        if (!restRes.ok) throw new Error('Failed to load restaurant details.');
        const restData: Restaurant = await restRes.json();
        setRestaurant(restData);

        setRestForm({
          name: restData.name,
          priceRange: restData.priceRange,
          categoryId: (restData as any).categoryId || 1,
          foodStreetId: (restData as any).foodStreetId || 1,
          distance: restData.distance,
          address: restData.address,
          area: restData.area,
          openingHours: restData.openingHours,
          image: restData.image,
          isVerified: restData.isVerified,
          replySpeed: restData.replySpeed,
          latitude: restData.latitude || 10.759031,
          longitude: restData.longitude || 106.706962
        });
      } else if (user?.id) {
        // Fetch pending request if no restaurant is linked
        const reqRes = await fetch(`${baseUrl}/api/owner/restaurant-request/${user.id}`);
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setRestaurantRequest(reqData);
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
  }, [activeRestaurantId, user?.id]);

  const handleCreateRestaurant = async (e: React.FormEvent) => {
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

      const newRequest: RestaurantRequest = await res.json();
      setRestaurantRequest(newRequest);
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
      const res = await fetch(`${baseUrl}/api/owner/restaurant/${activeRestaurantId}`, {
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
      const res = await fetch(`${baseUrl}/api/owner/restaurant/${activeRestaurantId}/dishes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: '', // Generated on server
          name: dishForm.name,
          price: Number(dishForm.price),
          description: dishForm.description,
          image: dishForm.image || 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b'
        })
      });

      if (!res.ok) throw new Error('Failed to add signature dish.');
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa món ăn này khỏi danh sách đặc trưng?')) return;
    try {
      const res = await fetch(`${baseUrl}/api/owner/restaurant/${activeRestaurantId}/dishes/${dishId}`, {
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#1a1a1a]/60">
        <span className="animate-spin text-3xl">⏳</span>
        <span className="font-mono text-xs mt-2 uppercase tracking-widest font-bold">Loading restaurant details...</span>
      </div>
    );
  }

  if (!activeRestaurantId) {
    if (restaurantRequest && restaurantRequest.status !== 'Rejected') {
      return (
        <div className="max-w-md mx-auto w-full px-4 py-6">
          <div className="bg-white border-3 border-[#1a1a1a] shadow-[8px_8px_0px_0px_#1a1a1a] p-6 text-[#1a1a1a] text-center">
            <Clock size={40} className="mx-auto text-[#1a1a1a] mb-4" strokeWidth={1.5} />
            <h2 className="font-serif italic font-bold text-2xl uppercase mb-2">
              Đang chờ duyệt
            </h2>
            <p className="text-sm text-[#1a1a1a]/70 font-sans mb-4">
              Yêu cầu đăng ký quán ăn <strong>{restaurantRequest.name}</strong> của bạn đã được gửi thành công. Vui lòng chờ Admin phê duyệt.
            </p>
            <div className="bg-[#f9f7f2] border-2 border-[#1a1a1a] p-3 text-left">
              <p className="text-[10px] font-mono uppercase font-bold text-[#1a1a1a]/50 mb-1">Mã yêu cầu</p>
              <p className="font-mono text-xs">{restaurantRequest.id}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto w-full px-4 py-6">
        <div className="bg-white border-3 border-[#1a1a1a] shadow-[8px_8px_0px_0px_#1a1a1a] p-6 text-[#1a1a1a]">
          <div className="mb-6 border-b-2 border-dashed border-[#1a1a1a]/20 pb-4">
            <span className="text-[9px] tracking-[0.3em] uppercase text-[#e2533b] font-mono font-bold block mb-1">
              CHỦ QUÁN MỚI
            </span>
            <h2 className="font-serif italic font-bold text-2xl uppercase">
              Đăng ký quán ăn
            </h2>
            <p className="text-xs text-[#1a1a1a]/60 mt-1 font-sans">
              Điền thông tin bên dưới để gửi yêu cầu mở quán trên CraveMap. Yêu cầu của bạn sẽ được Admin xét duyệt.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 text-xs font-mono font-bold text-[#e2533b] p-3 mb-4">
              Error: {error}
            </div>
          )}

          {restaurantRequest?.status === 'Rejected' && (
            <div className="bg-red-50 border-2 border-[#e2533b] p-4 mb-6 flex gap-3 items-start">
              <AlertCircle className="text-[#e2533b] shrink-0" size={20} />
              <div>
                <p className="font-mono text-[10px] uppercase font-bold text-[#e2533b] mb-1">Yêu cầu bị từ chối</p>
                <p className="text-xs text-[#1a1a1a]/80">{restaurantRequest.adminNote || 'Không có lý do cụ thể.'}</p>
                <p className="text-[10px] text-[#1a1a1a]/50 mt-2 italic">Vui lòng chỉnh sửa thông tin và gửi lại yêu cầu.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleCreateRestaurant} className="flex flex-col gap-4">
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
              <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Link ảnh quán ăn</label>
              <input 
                type="text"
                value={createForm.image}
                onChange={(e) => setCreateForm(prev => ({ ...prev, image: e.target.value }))}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-xs focus:outline-none font-mono"
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
              className="w-full mt-4 bg-[#1a1a1a] hover:bg-[#e2533b] text-white py-3 font-mono text-xs uppercase tracking-widest border-2 border-[#1a1a1a] transition-all cursor-pointer shadow-md hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-xs active:scale-[0.98]"
            >
              Gửi yêu cầu đăng ký quán
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="text-center py-20 text-[#e2533b] font-mono text-xs uppercase font-bold">
        ⚠️ {error || 'Restaurant details could not be loaded.'}
      </div>
    );
  }

  const simulateScanUrl = `${window.location.origin}/?qr=${generatedQrToken}`;

  return (
    <div className="flex flex-col lg:flex-row gap-6 text-[#1a1a1a]">
      
      {/* Left: Info Update Form */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#1a1a1a] p-5">
          <div className="border-b border-[#1a1a1a]/15 pb-3 mb-4 flex justify-between items-center">
            <div>
              <h3 className="font-serif italic font-bold text-lg">Chỉnh sửa Thông tin Quán ăn</h3>
              <p className="font-mono text-[9px] text-[#1a1a1a]/55 uppercase tracking-wider mt-0.5">OWNER TERMINAL</p>
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
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Ảnh biểu diễn (URL)</label>
                <input 
                  type="text"
                  value={restForm.image}
                  onChange={(e) => setRestForm(prev => ({ ...prev, image: e.target.value }))}
                  className="bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none"
                  required
                />
              </div>
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
                  placeholder="Ex: 10:00 AM - 11:00 PM"
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

        {/* Signature Dishes List Box */}
        <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#1a1a1a] p-5">
          <div className="border-b border-[#1a1a1a]/15 pb-3 mb-4 flex justify-between items-center">
            <div>
              <h3 className="font-serif italic font-bold text-lg">Món ăn đặc trưng</h3>
              <p className="font-mono text-[9px] text-[#1a1a1a]/55 uppercase tracking-wider mt-0.5">SIGNATURE MENU MANAGEMENT</p>
            </div>
            
            <button
              onClick={() => setShowDishModal(true)}
              className="bg-white hover:bg-[#f9f7f2] font-mono text-[9px] uppercase tracking-widest px-3 py-2 border-2 border-[#1a1a1a] transition-all cursor-pointer shadow flex items-center gap-1 active:translate-y-0.5 font-bold"
            >
              Thêm món ăn
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {restaurant.dishes.map(d => (
              <div 
                key={d.id}
                className="bg-white border border-[#1a1a1a]/15 rounded-none overflow-hidden shadow-xs flex flex-col relative group hover:border-[#e2533b]/45 transition-colors"
              >
                {/* Image panel */}
                <div 
                  className="h-28 w-full bg-cover bg-center filter grayscale group-hover:grayscale-0 transition-all duration-300"
                  style={{ backgroundImage: `url('${d.image}')` }}
                />
                
                <div className="p-3.5 flex flex-col justify-between flex-1 gap-1">
                  <div>
                    <h3 className="font-serif italic font-bold text-xs md:text-sm text-[#1a1a1a] truncate">{d.name}</h3>
                    <p className="font-sans text-[10px] text-[#1a1a1a]/55 line-clamp-1 mt-1 font-light leading-tight">{d.description}</p>
                  </div>
                  <p className="font-mono font-bold text-[#e2533b] text-xs mt-1.5">${d.price.toFixed(2)}</p>
                </div>

                {/* Delete button (floating red trash icon instead of + button) */}
                <button
                  type="button"
                  onClick={() => handleDeleteDish(d.id)}
                  title="Xóa món ăn"
                  className="absolute bottom-3 right-3 w-7 h-7 bg-[#e2533b]/10 hover:bg-[#e2533b] text-[#e2533b] hover:text-white rounded-none flex items-center justify-center shadow-xs active:scale-90 transition-all cursor-pointer"
                >
                  <Trash2 size={13} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: QR Code Generator Card */}
      <div className="w-full lg:w-[360px] flex flex-col gap-6">
        <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_0px_#1a1a1a] p-5 text-center flex flex-col items-center gap-4">
          <div className="w-full border-b border-[#1a1a1a]/15 pb-3 text-left">
            <h3 className="font-serif italic font-bold text-lg leading-tight">Tạo QR Code bàn ăn</h3>
            <p className="font-mono text-[9px] text-[#1a1a1a]/55 uppercase tracking-wider mt-0.5">ENCRYPTED SCAN ACCESS</p>
          </div>

          <p className="text-left font-sans text-xs text-[#1a1a1a]/60 leading-relaxed font-light">
            Nhập số bàn để tạo mã QR chứa token mã hóa AES. Khách hàng quét mã này sẽ được tự động đăng nhập vào ứng dụng và nghe audio tour không giới hạn.
          </p>

          <div className="w-full flex items-center border-2 border-[#1a1a1a] bg-white px-3 py-1.5 shadow-[2px_2px_0px_0px_#1a1a1a] mt-2">
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
            className="w-full bg-[#1a1a1a] text-white hover:bg-[#e2533b] py-3 font-mono text-xs uppercase tracking-widest border-2 border-[#1a1a1a] transition-all cursor-pointer shadow-md active:translate-y-0.5 disabled:opacity-50"
          >
            {qrLoading ? 'Đang tạo mã...' : 'Tạo mã QR bàn ăn // 🔑'}
          </button>

          {/* Render Mock QR Code and Simulation Link */}
          {generatedQrToken && (
            <div className="w-full border-2 border-[#1a1a1a] p-4 bg-[#f9f7f2] flex flex-col items-center gap-3 mt-4 animate-in zoom-in-95 duration-200">
              <div className="w-40 h-40 bg-white border-2 border-[#1a1a1a] p-2 flex items-center justify-center relative shadow-xs">
                {/* Simulated QR Visual Design */}
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

              {/* Simulation scanning CTA link */}
              <a 
                href={simulateScanUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full text-center bg-[#e2533b] text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_0px_#1a1a1a] hover:shadow-none transition-all py-2 font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer"
              >
                📲 Giả lập quét mã QR // Link
              </a>
            </div>
          )}
        </div>
      </div>

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
                <label className="font-mono text-[9px] uppercase font-bold tracking-wider">Ảnh món ăn (URL)</label>
                <input 
                  type="text"
                  value={dishForm.image}
                  onChange={(e) => setDishForm(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="Link ảnh món ăn..."
                  className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none"
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
