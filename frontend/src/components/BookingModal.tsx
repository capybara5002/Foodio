/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { Restaurant } from '../types';
import { BadgeCheck, X, Calendar, CheckCircle2, Ticket, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BookingModalProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bookingDetails: {
    date: string;
    time: string;
    guests: number;
    seating: string;
    tableNumber?: string;
  }) => void;
}

// Fixed 12-table layout
const FIXED_TABLES = [
  { id: 1, name: 'Bàn 1', capacity: 2 },
  { id: 2, name: 'Bàn 2', capacity: 2 },
  { id: 3, name: 'Bàn 3', capacity: 2 },
  { id: 4, name: 'Bàn 4', capacity: 4 },
  { id: 5, name: 'Bàn 5', capacity: 4 },
  { id: 6, name: 'Bàn 6', capacity: 4 },
  { id: 7, name: 'Bàn 7', capacity: 6 },
  { id: 8, name: 'Bàn 8', capacity: 6 },
  { id: 9, name: 'Bàn 9', capacity: 6 },
  { id: 10, name: 'Bàn 10', capacity: 8 },
  { id: 11, name: 'Bàn 11', capacity: 8 },
  { id: 12, name: 'Bàn 12', capacity: 8 },
];

export default function BookingModal({ restaurant, isOpen, onClose, onConfirm }: BookingModalProps) {
  const { t } = useTranslation();
  const [date, setDate] = useState('2026-05-27');
  const [selectedTime, setSelectedTime] = useState('7:00 PM');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [step, setStep] = useState<'form' | 'success'>('form');

  if (!isOpen || !restaurant) return null;

  const timeSlots = ['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:30 PM'];

  const selectedTable = FIXED_TABLES.find(t => t.id === selectedTableId);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;
    setStep('success');
    onConfirm({
      date,
      time: selectedTime,
      guests: selectedTable.capacity,
      seating: selectedTable.name,
      tableNumber: selectedTable.name,
    });
  };

  const handleDone = () => {
    setStep('form');
    setSelectedTableId(null);
    onClose();
  };

  // Generate chair dots around a table
  const renderChairs = (capacity: number, isSelected: boolean) => {
    const chairColor = isSelected ? 'bg-white' : 'bg-[#1a1a1a]/30';
    const chairs = [];
    
    if (capacity === 2) {
      chairs.push(
        <span key="t" className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full ${chairColor} transition-colors`} />,
        <span key="b" className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full ${chairColor} transition-colors`} />
      );
    } else if (capacity === 4) {
      chairs.push(
        <span key="t" className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full ${chairColor} transition-colors`} />,
        <span key="b" className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full ${chairColor} transition-colors`} />,
        <span key="l" className={`absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${chairColor} transition-colors`} />,
        <span key="r" className={`absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${chairColor} transition-colors`} />
      );
    } else if (capacity === 6) {
      chairs.push(
        <span key="tl" className={`absolute -top-1.5 left-1/4 -translate-x-1/2 w-2 h-2 rounded-full ${chairColor} transition-colors`} />,
        <span key="tr" className={`absolute -top-1.5 left-3/4 -translate-x-1/2 w-2 h-2 rounded-full ${chairColor} transition-colors`} />,
        <span key="bl" className={`absolute -bottom-1.5 left-1/4 -translate-x-1/2 w-2 h-2 rounded-full ${chairColor} transition-colors`} />,
        <span key="br" className={`absolute -bottom-1.5 left-3/4 -translate-x-1/2 w-2 h-2 rounded-full ${chairColor} transition-colors`} />,
        <span key="l" className={`absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-2 rounded-full ${chairColor} transition-colors`} />,
        <span key="r" className={`absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-2 rounded-full ${chairColor} transition-colors`} />
      );
    } else {
      // 8 seats
      chairs.push(
        <span key="tl" className={`absolute -top-1.5 left-[20%] w-2 h-2 rounded-full ${chairColor} transition-colors`} />,
        <span key="tc" className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${chairColor} transition-colors`} />,
        <span key="tr" className={`absolute -top-1.5 left-[75%] w-2 h-2 rounded-full ${chairColor} transition-colors`} />,
        <span key="bl" className={`absolute -bottom-1.5 left-[20%] w-2 h-2 rounded-full ${chairColor} transition-colors`} />,
        <span key="bc" className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${chairColor} transition-colors`} />,
        <span key="br" className={`absolute -bottom-1.5 left-[75%] w-2 h-2 rounded-full ${chairColor} transition-colors`} />,
        <span key="l" className={`absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-2 rounded-full ${chairColor} transition-colors`} />,
        <span key="r" className={`absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-2 rounded-full ${chairColor} transition-colors`} />
      );
    }
    return chairs;
  };

  // Get table sizing class based on capacity
  const getTableSize = (capacity: number) => {
    switch(capacity) {
      case 2: return 'w-12 h-10';
      case 4: return 'w-14 h-12';
      case 6: return 'w-16 h-12';
      case 8: return 'w-[72px] h-14';
      default: return 'w-14 h-12';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1a1a1a]/80 backdrop-blur-xs transition-opacity"
        onClick={step === 'form' ? onClose : undefined}
      />

      {/* Sheet Container */}
      <div className="relative bg-[#fdfcf9] border-2 border-[#1a1a1a] rounded-none w-full max-w-lg shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Subtle decorative accent bar */}
        <div className="h-1.5 bg-[#e2533b]" />

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-serif italic font-bold text-lg text-[#1a1a1a]">{t('booking.title')}</h3>
                <p className="font-sans text-[11px] text-[#1a1a1a]/60 flex items-center gap-1.5 mt-1 font-light">
                  <BadgeCheck size={14} className="fill-[#e2533b] text-white" />
                  {t('booking.at_restaurant', { name: restaurant.name })}
                </p>
              </div>
              <button 
                type="button" 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-none bg-white border border-[#1a1a1a]/15 text-[#1a1a1a] hover:text-[#e2533b] hover:bg-[#f9f7f2] active:scale-95 transition-all"
              >
                <X size={15} strokeWidth={3} />
              </button>
            </div>

            <hr className="border-[#1a1a1a]/10" />

            {/* Date Input */}
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/60 font-extrabold">
                {t('booking.select_date')}
              </label>
              <div className="relative flex items-center bg-white border border-[#1a1a1a]/15 rounded-none px-3 py-1.5">
                <Calendar size={16} className="text-[#e2533b] mr-2" />
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent border-none p-0 font-mono text-[11px] text-[#1a1a1a] focus:outline-none focus:ring-0 w-full"
                  required
                />
              </div>
            </div>

            {/* Time Slot Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/60 font-extrabold">
                {t('booking.select_time')}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`px-2.5 py-1.5 rounded-none font-mono text-[10px] uppercase tracking-wider border transition-all cursor-pointer ${
                      selectedTime === time
                        ? 'bg-[#1a1a1a] text-white border-transparent shadow'
                        : 'bg-white text-[#1a1a1a] border-[#1a1a1a]/15 hover:bg-[#f9f7f2]'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Table Floor Plan ─── */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/60 font-extrabold">
                Chọn bàn — Sơ đồ nhà hàng
              </label>
              
              <div className="bg-[#f9f7f2] border border-[#1a1a1a]/15 p-4 relative">
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mb-4 text-[8px] font-mono uppercase tracking-wider text-[#1a1a1a]/55 font-bold">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-white border border-[#1a1a1a]/20" /> Trống
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-[#e2533b]" /> Đã chọn
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={10} /> Sức chứa
                  </span>
                </div>

                {/* Floor plan grid — grouped by capacity */}
                <div className="flex flex-col gap-6">
                  {/* Row 1: 2-seat tables */}
                  <div>
                    <span className="font-mono text-[8px] uppercase tracking-widest text-[#1a1a1a]/40 font-bold mb-2 block">
                      ● Bàn 2 chỗ
                    </span>
                    <div className="flex items-center justify-around gap-4">
                      {FIXED_TABLES.filter(t => t.capacity === 2).map(table => {
                        const isSelected = selectedTableId === table.id;
                        return (
                          <button
                            key={table.id}
                            type="button"
                            onClick={() => setSelectedTableId(table.id)}
                            className="flex flex-col items-center gap-2 group cursor-pointer"
                          >
                            <div className={`relative ${getTableSize(table.capacity)} rounded-sm flex items-center justify-center transition-all duration-200 ${
                              isSelected
                                ? 'bg-[#e2533b] border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] scale-110'
                                : 'bg-white border-2 border-[#1a1a1a]/25 group-hover:border-[#e2533b] group-hover:shadow-md'
                            }`}>
                              {renderChairs(table.capacity, isSelected)}
                              <span className={`font-mono text-[9px] font-black transition-colors ${isSelected ? 'text-white' : 'text-[#1a1a1a]/70'}`}>
                                {table.capacity}
                              </span>
                            </div>
                            <span className={`font-mono text-[8px] uppercase tracking-wider font-bold transition-colors ${
                              isSelected ? 'text-[#e2533b]' : 'text-[#1a1a1a]/50'
                            }`}>
                              {table.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 2: 4-seat tables */}
                  <div>
                    <span className="font-mono text-[8px] uppercase tracking-widest text-[#1a1a1a]/40 font-bold mb-2 block">
                      ● Bàn 4 chỗ
                    </span>
                    <div className="flex items-center justify-around gap-4">
                      {FIXED_TABLES.filter(t => t.capacity === 4).map(table => {
                        const isSelected = selectedTableId === table.id;
                        return (
                          <button
                            key={table.id}
                            type="button"
                            onClick={() => setSelectedTableId(table.id)}
                            className="flex flex-col items-center gap-2 group cursor-pointer"
                          >
                            <div className={`relative ${getTableSize(table.capacity)} rounded-sm flex items-center justify-center transition-all duration-200 ${
                              isSelected
                                ? 'bg-[#e2533b] border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] scale-110'
                                : 'bg-white border-2 border-[#1a1a1a]/25 group-hover:border-[#e2533b] group-hover:shadow-md'
                            }`}>
                              {renderChairs(table.capacity, isSelected)}
                              <span className={`font-mono text-[9px] font-black transition-colors ${isSelected ? 'text-white' : 'text-[#1a1a1a]/70'}`}>
                                {table.capacity}
                              </span>
                            </div>
                            <span className={`font-mono text-[8px] uppercase tracking-wider font-bold transition-colors ${
                              isSelected ? 'text-[#e2533b]' : 'text-[#1a1a1a]/50'
                            }`}>
                              {table.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 3: 6-seat tables */}
                  <div>
                    <span className="font-mono text-[8px] uppercase tracking-widest text-[#1a1a1a]/40 font-bold mb-2 block">
                      ● Bàn 6 chỗ
                    </span>
                    <div className="flex items-center justify-around gap-4">
                      {FIXED_TABLES.filter(t => t.capacity === 6).map(table => {
                        const isSelected = selectedTableId === table.id;
                        return (
                          <button
                            key={table.id}
                            type="button"
                            onClick={() => setSelectedTableId(table.id)}
                            className="flex flex-col items-center gap-2 group cursor-pointer"
                          >
                            <div className={`relative ${getTableSize(table.capacity)} rounded-sm flex items-center justify-center transition-all duration-200 ${
                              isSelected
                                ? 'bg-[#e2533b] border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] scale-110'
                                : 'bg-white border-2 border-[#1a1a1a]/25 group-hover:border-[#e2533b] group-hover:shadow-md'
                            }`}>
                              {renderChairs(table.capacity, isSelected)}
                              <span className={`font-mono text-[9px] font-black transition-colors ${isSelected ? 'text-white' : 'text-[#1a1a1a]/70'}`}>
                                {table.capacity}
                              </span>
                            </div>
                            <span className={`font-mono text-[8px] uppercase tracking-wider font-bold transition-colors ${
                              isSelected ? 'text-[#e2533b]' : 'text-[#1a1a1a]/50'
                            }`}>
                              {table.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 4: 8-seat tables */}
                  <div>
                    <span className="font-mono text-[8px] uppercase tracking-widest text-[#1a1a1a]/40 font-bold mb-2 block">
                      ● Bàn 8 chỗ
                    </span>
                    <div className="flex items-center justify-around gap-4">
                      {FIXED_TABLES.filter(t => t.capacity === 8).map(table => {
                        const isSelected = selectedTableId === table.id;
                        return (
                          <button
                            key={table.id}
                            type="button"
                            onClick={() => setSelectedTableId(table.id)}
                            className="flex flex-col items-center gap-2 group cursor-pointer"
                          >
                            <div className={`relative ${getTableSize(table.capacity)} rounded-sm flex items-center justify-center transition-all duration-200 ${
                              isSelected
                                ? 'bg-[#e2533b] border-2 border-[#1a1a1a] shadow-[3px_3px_0px_0px_#1a1a1a] scale-110'
                                : 'bg-white border-2 border-[#1a1a1a]/25 group-hover:border-[#e2533b] group-hover:shadow-md'
                            }`}>
                              {renderChairs(table.capacity, isSelected)}
                              <span className={`font-mono text-[9px] font-black transition-colors ${isSelected ? 'text-white' : 'text-[#1a1a1a]/70'}`}>
                                {table.capacity}
                              </span>
                            </div>
                            <span className={`font-mono text-[8px] uppercase tracking-wider font-bold transition-colors ${
                              isSelected ? 'text-[#e2533b]' : 'text-[#1a1a1a]/50'
                            }`}>
                              {table.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Selected table info banner */}
                {selectedTable && (
                  <div className="mt-4 bg-white border border-[#e2533b]/30 px-3 py-2 flex items-center justify-between animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#e2533b] rounded-full animate-pulse" />
                      <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-[#1a1a1a]">
                        {selectedTable.name}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-[#e2533b] font-bold flex items-center gap-1">
                      <Users size={12} /> {selectedTable.capacity} khách
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={!selectedTable}
              className={`mt-2 w-full font-mono text-[10px] uppercase tracking-widest py-3 rounded-none shadow-md active:scale-[0.98] transition-all cursor-pointer ${
                selectedTable
                  ? 'bg-[#1a1a1a] hover:bg-[#e2533b] text-white'
                  : 'bg-[#1a1a1a]/30 text-white/60 cursor-not-allowed'
              }`}
            >
              {selectedTable 
                ? `${t('booking.confirm_button')} — ${selectedTable.name} (${selectedTable.capacity} khách)`
                : 'Vui lòng chọn bàn trước'}
            </button>
          </form>
        ) : (
          <div className="p-8 text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Success icon banner */}
            <div className="w-16 h-16 rounded-full bg-secondary-container text-[#785900] flex items-center justify-center shadow-lg relative">
              <div className="absolute inset-0 bg-secondary-container/30 rounded-full animate-ping" />
              <CheckCircle2 size={32} className="fill-[#785900] text-white" />
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <h3 className="font-headline-lg font-bold text-xl text-on-surface">{t('booking.success_title')}</h3>
              <p className="font-body-md text-sm text-on-surface-variant max-w-xs">
                {t('booking.success_message', { name: restaurant.name, date, time: selectedTime, guests: selectedTable?.capacity ?? 0 })}
              </p>
            </div>

            {/* Voucher status detail */}
            <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 w-full text-left flex gap-3 items-center mt-2">
              <Ticket size={20} className="text-[#1a1a1a]/70" />
              <div>
                <p className="font-label-lg text-[13px] text-on-surface font-bold">
                  {selectedTable?.name} — {selectedTable?.capacity} khách
                </p>
                <p className="font-body-sm text-[11px] text-on-surface-variant">{t('booking.ticket_desc')}</p>
              </div>
            </div>

            <button
              onClick={handleDone}
              className="mt-3 w-full bg-primary hover:bg-primary-container text-on-primary font-label-lg text-sm uppercase py-3 rounded-full shadow-md active:scale-95 transition-all text-center"
            >
              {t('booking.done_button')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
