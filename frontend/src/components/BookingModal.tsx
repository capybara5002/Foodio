/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { Restaurant } from '../types';
import { BadgeCheck, X, Calendar, Flame, Store, CheckCircle2, Ticket } from 'lucide-react';

interface BookingModalProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bookingDetails: {
    date: string;
    time: string;
    guests: number;
    seating: string;
  }) => void;
}

export default function BookingModal({ restaurant, isOpen, onClose, onConfirm }: BookingModalProps) {
  const [date, setDate] = useState('2026-05-27');
  const [selectedTime, setSelectedTime] = useState('7:00 PM');
  const [guests, setGuests] = useState(4);
  const [seating, setSeating] = useState('Outdoor Street-side');
  const [step, setStep] = useState<'form' | 'success'>('form');

  if (!isOpen || !restaurant) return null;

  const timeSlots = ['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:30 PM'];
  const capacities = [2, 3, 4, 5, 6, 8];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setStep('success');
    // Trigger confirm logic
    onConfirm({ date, time: selectedTime, guests, seating });
  };

  const handleDone = () => {
    setStep('form');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1a1a1a]/80 backdrop-blur-xs transition-opacity"
        onClick={step === 'form' ? onClose : undefined}
      />

      {/* Sheet Container */}
      <div className="relative bg-[#fdfcf9] border-2 border-[#1a1a1a] rounded-none w-full max-w-sm shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Subtle decorative accent bar */}
        <div className="h-1.5 bg-[#e2533b]" />

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-serif italic font-bold text-lg text-[#1a1a1a]">Book a Table</h3>
                <p className="font-sans text-[11px] text-[#1a1a1a]/60 flex items-center gap-1.5 mt-1 font-light">
                  <BadgeCheck size={14} className="fill-[#e2533b] text-white" />
                  At {restaurant.name}
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
                Select Date
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
                Select Time Slot
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

            {/* Capacity Options */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/60 font-extrabold">
                Number of Guests
              </label>
              <div className="grid grid-cols-6 gap-1">
                {capacities.map((capacity) => (
                  <button
                    key={capacity}
                    type="button"
                    onClick={() => setGuests(capacity)}
                    className={`py-1 rounded-none font-mono text-xs transition-all text-center cursor-pointer ${
                      guests === capacity
                        ? 'bg-[#e2533b] text-white font-black shadow'
                        : 'bg-white text-[#1a1a1a]/65 border border-[#1a1a1a]/10 hover:bg-[#f9f7f2]'
                    }`}
                  >
                    {capacity}
                  </button>
                ))}
              </div>
            </div>

            {/* Seating Preference Toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/60 font-extrabold">
                Seating Choice
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSeating('Outdoor Street-side')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-none border transition-all cursor-pointer ${
                    seating.includes('Outdoor')
                      ? 'border-[#e2533b] bg-[#e2533b]/5 text-[#e2533b] font-bold'
                      : 'border-[#1a1a1a]/10 bg-white text-[#1a1a1a]/70 hover:bg-[#f9f7f2]'
                  }`}
                >
                  <Flame size={16} />
                  <span className="font-mono text-[9px] uppercase tracking-wider">Street outdoor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSeating('Indoor Seating')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-none border transition-all cursor-pointer ${
                    seating.includes('Indoor')
                      ? 'border-[#e2533b] bg-[#e2533b]/5 text-[#e2533b] font-bold'
                      : 'border-[#1a1a1a]/10 bg-white text-[#1a1a1a]/70 hover:bg-[#f9f7f2]'
                  }`}
                >
                  <Store size={16} />
                  <span className="font-mono text-[9px] uppercase tracking-wider">Indoor Room</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              className="mt-2 w-full bg-[#1a1a1a] hover:bg-[#e2533b] text-white font-mono text-[10px] uppercase tracking-widest py-3 rounded-none shadow-md active:scale-[0.98] transition-all cursor-pointer"
            >
              Confirm Reservation // 📝
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
              <h3 className="font-headline-lg font-bold text-xl text-on-surface">Đặt bàn thành công!</h3>
              <p className="font-body-md text-sm text-on-surface-variant max-w-xs">
                {restaurant.name} is waiting for you! We have secured an outdoor spot at our street-side tables on <strong>{date} at {selectedTime}</strong> for <strong>{guests} guests</strong>.
              </p>
            </div>

            {/* Voucher status detail */}
            <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 w-full text-left flex gap-3 items-center mt-2">
              <Ticket size={20} className="text-[#1a1a1a]/70" />
              <div>
                <p className="font-label-lg text-[13px] text-on-surface font-bold">Booking Reference: #CM-79352</p>
                <p className="font-body-sm text-[11px] text-on-surface-variant">Present this ticket when checking in</p>
              </div>
            </div>

            <button
              onClick={handleDone}
              className="mt-3 w-full bg-primary hover:bg-primary-container text-on-primary font-label-lg text-sm uppercase py-3 rounded-full shadow-md active:scale-95 transition-all text-center"
            >
              Cám ơn rùi!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
