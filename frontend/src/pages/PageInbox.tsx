/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import * as signalR from '@microsoft/signalr';
import { ChatThread, ChatMessage, Restaurant } from '../types';
import { ensureChatThread } from '../api/cravemapApi';
import { ArrowLeft, BadgeCheck, Phone, MoreVertical, CheckCheck, Image, Send, PhoneOff, MessageSquare } from 'lucide-react';

interface PageInboxProps {
  threads: ChatThread[];
  activeThreadId: string;
  userId: string;
  restaurantId?: string;
  restaurants?: Restaurant[];
  currentUserRole: 'Admin' | 'Owner' | 'User' | 'Guest';
  onSelectThread: (threadId: string) => void;
  onStartThread?: (restaurantId: string) => void | Promise<void>;
  onThreadUpdated: (thread: ChatThread) => void;
}

export default function PageInbox({
  threads,
  activeThreadId,
  userId,
  restaurantId,
  restaurants = [],
  currentUserRole,
  onSelectThread,
  onStartThread,
  onThreadUpdated
}: PageInboxProps) {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [mobileView, setMobileView] = useState<'threads' | 'chat'>('threads');
  const [mockCallState, setMockCallState] = useState<'idle' | 'calling'>('idle');
  const [startingRestaurantId, setStartingRestaurantId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];
  const effectiveThreadId = activeThread?.id ?? '';
  const isOwnerView = currentUserRole === 'Owner';

  // Refs and sync effect to prevent reconnection spam on thread/identity changes
  const effectiveThreadIdRef = useRef(effectiveThreadId);
  const threadsRef = useRef(threads);
  const restaurantIdRef = useRef(restaurantId);

  useEffect(() => {
    effectiveThreadIdRef.current = effectiveThreadId;
    threadsRef.current = threads;
    restaurantIdRef.current = restaurantId;
  }, [effectiveThreadId, threads, restaurantId]);

  const canStartRestaurantThread = !isOwnerView && currentUserRole !== 'Guest';

  const getThreadIdentity = (thread: ChatThread) => ({
    name: isOwnerView ? thread.customerName || thread.userId || 'Customer' : thread.name,
    avatar: isOwnerView ? thread.customerAvatar || thread.avatar : thread.avatar,
    statusText: isOwnerView ? 'Customer conversation' : thread.statusText
  });
  const activeIdentity = activeThread ? getThreadIdentity(activeThread) : null;
  const getThreadSortTime = (value: string) => {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  };
  const formatThreadTime = (value: string) => {
    const time = new Date(value);
    if (Number.isNaN(time.getTime())) return value;
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const sortedThreads = [...threads].sort(
    (a, b) => getThreadSortTime(b.lastMessageTime) - getThreadSortTime(a.lastMessageTime)
  );
  const threadRestaurantIds = new Set(threads.map((thread) => thread.restaurantId));
  const contactableRestaurants = restaurants.filter((restaurant) => !threadRestaurantIds.has(restaurant.id));
  const visibleRestaurants = contactableRestaurants.slice(0, 12);

  const fetchMessages = async (threadId: string) => {
    if (!threadId) {
      setMessages([]);
      setErrorMessages(null);
      return;
    }
    setLoadingMessages(true);
    setErrorMessages(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/chatthreads/${threadId}/messages`);
      if (response.status === 404 && canStartRestaurantThread && activeThread?.restaurantId) {
        const ensuredThread = await ensureChatThread(activeThread.restaurantId, userId);
        onThreadUpdated(ensuredThread);
        onSelectThread(ensuredThread.id);
        setMessages(ensuredThread.messages ?? []);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMessages(data);
    } catch (err: any) {
      console.error("Error fetching chat messages:", err);
      setErrorMessages("Failed to load chat history.");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    void fetchMessages(effectiveThreadId);
  }, [effectiveThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/chat`)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.on('ReceiveMessage', (message: ChatMessage) => {
      setMessages((prev) => {
        if (message.chatThreadId !== effectiveThreadIdRef.current) return prev;
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    connection.on('ThreadUpdated', (thread: ChatThread) => {
      onThreadUpdated(thread);
    });

    connection
      .start()
      .then(async () => {
        await Promise.all(threadsRef.current.map((thread) => connection.invoke('JoinThread', thread.id)));
        if (restaurantIdRef.current) {
          await connection.invoke('JoinRestaurant', restaurantIdRef.current);
        }
      })
      .catch((error) => {
        // Suppress expected negotiation abort errors from React StrictMode double-mounting
        const isAbort = error && (error.name === 'AbortError' || error.toString().includes('stopped') || error.toString().includes('negotiation'));
        if (isAbort) {
          console.warn('SignalR connection setup aborted during component unmount (expected under React StrictMode).');
          return;
        }
        console.error('SignalR chat connection failed:', error);
      });

    return () => {
      void connection.stop();
      connectionRef.current = null;
    };
  }, [onThreadUpdated]);

  useEffect(() => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) return;

    void Promise.all(threads.map((thread) => connection.invoke('JoinThread', thread.id))).catch((error) => {
      console.error('Failed to join chat groups:', error);
    });
    if (restaurantId) {
      void connection.invoke('JoinRestaurant', restaurantId).catch((error) => {
        console.error('Failed to join restaurant chat group:', error);
      });
    }
  }, [threads, restaurantId]);

  const handleStartThread = async (targetRestaurantId: string) => {
    if (!onStartThread || startingRestaurantId) return;

    setStartingRestaurantId(targetRestaurantId);
    setErrorMessages(null);
    try {
      await onStartThread(targetRestaurantId);
      setMobileView('chat');
    } catch (error) {
      console.error('Failed to start inbox thread:', error);
      setErrorMessages('Failed to open this restaurant conversation.');
    } finally {
      setStartingRestaurantId(null);
    }
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (!effectiveThreadId) {
      setErrorMessages('Select a conversation before sending a message.');
      return;
    }

    const query = inputText.trim();
    setInputText('');

    const connection = connectionRef.current;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      setErrorMessages('Chat connection is not ready. Please try again.');
      return;
    }

    await connection.invoke('SendMessage', effectiveThreadId, userId, query);
  };

  const handleImageSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!effectiveThreadId) {
      setErrorMessages('Select a conversation before sending an image.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessages('Only image files are allowed.');
      return;
    }

    const connection = connectionRef.current;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      setErrorMessages('Chat connection is not ready. Please try again.');
      return;
    }

    const imageData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    await connection.invoke('SendImageMessage', effectiveThreadId, userId, imageData, file.name);
  };

  const startMockCall = () => {
    setMockCallState('calling');
    setTimeout(() => {
      setMockCallState('idle');
    }, 3500); // ring for 3.5s then fade out
  };

  return (
    <div className="w-full h-[calc(100vh-72px)] flex bg-[#f7efe4] overflow-hidden text-[#2c211b]">
      {/* Left Column Sidebar: Conversations List (Hidden on mobile if actively chatting) */}
      <aside className={`w-full md:w-[320px] lg:w-[390px] bg-[#fffaf4]/86 border-r border-[#4b362a]/10 flex-col shrink-0 h-full shadow-[18px_0_46px_rgba(77,49,31,0.08)] ${
        mobileView === 'chat' ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Sidebar Header */}
        <div className="px-5 py-3 bg-[#fffaf4]/94 border-b border-[#4b362a]/10 flex justify-between items-center h-[72px]">
          <h1 className="font-serif font-bold text-2xl tracking-[-0.05em] text-[#2c211b]">Inbox</h1>
          <span className="bg-[#b76548] text-white font-mono text-[9px] uppercase font-bold px-3 py-1 rounded-full shadow-xs">
            {threads.filter(t => t.unreadCount > 0).length} New
          </span>
        </div>

        {/* Channels scroll container */}
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-outline-variant/15">
            {sortedThreads.map((thread) => {
              const isSelected = thread.id === effectiveThreadId;
              const identity = getThreadIdentity(thread);
              return (
                <div
                  key={thread.id}
                  onClick={() => {
                    onSelectThread(thread.id);
                    setMobileView('chat');
                  }}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-white/70 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] select-none ${
                    isSelected ? 'bg-white/82 border-l-4 border-[#b76548]' : 'border-l-4 border-transparent'
                  }`}
                >
                  {/* Channel Avatar badge */}
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-white/70 bg-white shadow-[0_12px_30px_rgba(77,49,31,0.1)]">
                    <img src={identity.avatar} alt={identity.name} className="w-full h-full object-cover" />
                    {thread.id === 'oc_oanh_thread' && (
                    <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-[#b76548] rounded-full border border-white" />
                    )}
                  </div>

                  {/* Info Text snippet previews */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-serif font-bold text-sm tracking-[-0.03em] text-[#2c211b] truncate">
                        {identity.name}
                      </h3>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#8d8074] shrink-0">
                        {formatThreadTime(thread.lastMessageTime)}
                      </span>
                    </div>
                    <p className={`font-sans text-[11px] truncate font-light ${
                      thread.unreadCount > 0 ? 'text-[#2c211b] font-black' : 'text-[#6f655b]'
                    }`}>
                      {thread.lastMessageText}
                    </p>
                  </div>

                  {/* Unread circle bubble */}
                  {thread.unreadCount > 0 && (
                    <div className="w-2 h-2 bg-[#b76548] rounded-full shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {canStartRestaurantThread && visibleRestaurants.length > 0 && (
            <div className="border-t border-[#4b362a]/10 p-4">
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#8d8074] mb-3">
                Contact another restaurant
              </p>
              <div className="space-y-2">
                {visibleRestaurants.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    type="button"
                    onClick={() => void handleStartThread(restaurant.id)}
                    disabled={startingRestaurantId !== null}
                    className="w-full bg-[#fffdf8] border border-[#4b362a]/10 hover:border-[#b76548]/40 disabled:opacity-60 text-left p-3 flex items-center gap-2.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer disabled:cursor-not-allowed rounded-2xl"
                  >
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-10 h-10 object-cover rounded-xl border border-[#4b362a]/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif italic font-bold text-xs text-[#1a1a1a] truncate">{restaurant.name}</h3>
                      <p className="font-mono text-[8px] uppercase tracking-wider text-[#1a1a1a]/50 truncate">
                        {restaurant.area || restaurant.category}
                      </p>
                    </div>
                    <MessageSquare size={14} className="text-[#e2533b] shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {sortedThreads.length === 0 && visibleRestaurants.length === 0 && (
            <div className="p-4 py-10 text-center text-[#1a1a1a]/40">
              <MessageSquare size={28} className="mx-auto mb-3" />
              <p className="font-mono text-[9px] uppercase tracking-widest">
                {canStartRestaurantThread ? 'No restaurants available.' : 'Inbox is empty.'}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Column Chat Window Frame */}
      <section className={`flex-1 flex flex-col h-full bg-[#f7efe4] relative ${
        mobileView === 'threads' ? 'hidden md:flex' : 'flex'
      }`}>
        {!activeThread ? (
          <div className="flex-1 flex flex-col bg-[#f7efe4]">
            <div className="h-[72px] px-5 border-b border-[#4b362a]/10 bg-[#fffaf4]/88 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-serif font-bold text-xl tracking-[-0.04em] text-[#2c211b]">Start a conversation</h2>
                <p className="font-mono text-[9px] uppercase tracking-wider text-[#b76548]">
                  {canStartRestaurantThread ? 'Choose a restaurant to inbox' : 'No customer conversations yet'}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {canStartRestaurantThread && visibleRestaurants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {visibleRestaurants.map((restaurant) => (
                    <button
                      key={restaurant.id}
                      type="button"
                      onClick={() => void handleStartThread(restaurant.id)}
                      disabled={startingRestaurantId !== null}
                      className="bg-[#fffaf4] border border-white/70 hover:border-[#b76548]/40 disabled:opacity-60 text-left p-4 flex items-center gap-3 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer disabled:cursor-not-allowed rounded-[1.5rem] shadow-[0_18px_46px_rgba(77,49,31,0.1)]"
                    >
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="w-12 h-12 object-cover rounded-2xl border border-white/70 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-serif italic font-bold text-sm text-[#1a1a1a] truncate">{restaurant.name}</h3>
                        <p className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/50 truncate">
                          {restaurant.area || restaurant.category}
                        </p>
                      </div>
                      <MessageSquare size={16} className="text-[#e2533b] shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-[#1a1a1a]/50">
                  <MessageSquare size={32} className="mb-3" />
                  <p className="font-mono text-[10px] uppercase tracking-widest">
                    {canStartRestaurantThread ? 'No restaurants available to contact.' : 'No inbox messages yet.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header panel, matches layout specs */}
            <div className="h-[72px] px-5 border-b border-[#4b362a]/10 bg-[#fffaf4]/90 flex items-center justify-between shrink-0 z-10 shadow-xs">
              
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile Back button */}
                <button 
                  onClick={() => setMobileView('threads')}
                  className="md:hidden p-1.5 -ml-1 text-[#6f655b] hover:bg-[#f0e5d8] rounded-full transition-colors flex items-center justify-center cursor-pointer"
                >
                  <ArrowLeft size={18} />
                </button>

                {/* User header avatar */}
                <div className="relative w-11 h-11 rounded-2xl overflow-hidden shrink-0 border border-white/70 bg-white shadow-[0_12px_30px_rgba(77,49,31,0.1)]">
                  <img src={activeIdentity?.avatar} alt={activeIdentity?.name} className="w-full h-full object-cover" />
                </div>

                <div className="min-w-0">
                  <h2 className="font-serif font-bold text-base tracking-[-0.035em] text-[#2c211b] flex items-center gap-1.5">
                    {activeIdentity?.name}
                    {!isOwnerView && activeThread.restaurantId === 'oc_oanh' && (
                      <BadgeCheck size={15} className="fill-[#b76548] text-white inline-block select-none" />
                    )}
                  </h2>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-[#b76548] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#b76548] rounded-full animate-pulse" />
                    {activeIdentity?.statusText}
                  </p>
                </div>
              </div>

              {/* Call & detail dropdown options */}
              <div className="flex gap-1.5">
                <button 
                  onClick={startMockCall}
                  className="p-2 text-[#2c211b] hover:text-[#8f4f3b] hover:bg-[#f0e5d8] rounded-full transition-all flex items-center justify-center cursor-pointer"
                >
                  <Phone size={18} />
                </button>
                <button className="p-2 text-[#6f655b] hover:text-[#2c211b] hover:bg-[#f0e5d8] rounded-full transition-colors flex items-center justify-center cursor-pointer">
                  <MoreVertical size={18} />
                </button>
              </div>

            </div>

            {/* Messages Stream viewport area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 flex flex-col bg-[radial-gradient(circle_at_12%_0%,rgba(183,101,72,0.08),transparent_28rem),#f7efe4]">
              
              {/* Calendar separator */}
              <div className="flex justify-center my-1 select-none">
                <span className="bg-[#fffaf4]/88 text-[#6f655b] font-mono text-[9px] uppercase tracking-wider px-4 py-1.5 rounded-full shadow-xs border border-white/70">
                  Today
                </span>
              </div>

              {loadingMessages && (
                <div className="flex flex-col items-center justify-center py-8 text-[#1a1a1a]/60">
                  <span className="animate-spin text-xl">⏳</span>
                  <span className="font-mono text-[9px] mt-1.5 uppercase tracking-widest font-medium">Loading history...</span>
                </div>
              )}

              {errorMessages && (
                <div className="text-center py-8 font-mono text-[9px] uppercase text-[#e2533b]">
                  {errorMessages}
                </div>
              )}

              {!loadingMessages && !errorMessages && messages.length === 0 && (
                <div className="text-center py-8 font-mono text-[9px] uppercase text-[#1a1a1a]/40">
                  No messages yet. Start the conversation!
                </div>
              )}

              {/* Actual streams rendering */}
              {!loadingMessages && !errorMessages && messages.map((msg) => {
                const isSystem = msg.isSystemNotification || msg.messageType === 'Booking';
                const isOwnMessage = msg.senderId === userId || (!msg.senderId && msg.sender === 'user' && !isOwnerView);
                const isBooking = msg.messageType === 'Booking' && msg.booking;
                const isImage = msg.messageType === 'Image' && msg.imageData;
                return (
                  <div 
                    key={msg.id}
                    className={`flex flex-col group ${isSystem ? 'items-center' : isOwnMessage ? 'items-end' : 'items-start'}`}
                  >
                    {isBooking ? (
                      <div className="w-full max-w-[360px] bg-[#fff7ed] text-[#2c211b] border border-[#b76548]/30 p-4 shadow-[0_18px_46px_rgba(77,49,31,0.1)] rounded-3xl">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-[#8f4f3b] font-black mb-2">
                          Booking Confirmed
                        </p>
                        <div className="grid grid-cols-2 gap-2 font-sans text-xs">
                          <span className="text-[#1a1a1a]/55">Date</span>
                          <strong>{msg.booking!.date}</strong>
                          <span className="text-[#1a1a1a]/55">Time</span>
                          <strong>{msg.booking!.time}</strong>
                          <span className="text-[#1a1a1a]/55">Guests</span>
                          <strong>{msg.booking!.guests}</strong>
                          <span className="text-[#1a1a1a]/55">Seating</span>
                          <strong>{msg.booking!.seating}</strong>
                        </div>
                        <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/60">
                          Status: {msg.booking!.status} // #{msg.booking!.bookingId}
                        </p>
                      </div>
                    ) : isImage ? (
                      <div className={`max-w-[85%] md:max-w-[70%] p-2 shadow-[0_18px_46px_rgba(77,49,31,0.1)] rounded-3xl border ${
                        isOwnMessage
                          ? 'bg-[#2c211b] text-white border-[#2c211b]'
                          : 'bg-[#fffaf4] text-[#2c211b] border-white/70'
                      }`}>
                        <img
                          src={msg.imageData!}
                          alt={msg.imageFileName || 'Chat attachment'}
                          className="max-h-[280px] max-w-full object-contain border border-white/10"
                        />
                        {msg.imageFileName && (
                          <p className="mt-2 font-mono text-[9px] uppercase tracking-wider opacity-70 truncate">
                            {msg.imageFileName}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className={`max-w-[85%] md:max-w-[70%] text-xs md:text-sm px-4 py-3 shadow-[0_18px_46px_rgba(77,49,31,0.1)] transition-transform transform origin-bottom rounded-3xl border ${
                        isOwnMessage 
                          ? 'bg-[#2c211b] text-white border-[#2c211b]' 
                          : 'bg-[#fffaf4] text-[#2c211b] border-white/70'
                      }`}>
                        <p className="font-sans leading-relaxed font-light">{msg.text}</p>
                      </div>
                    )}
                    
                    <span className={`font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/40 mt-1 flex items-center gap-1 ${
                      isSystem ? '' : isOwnMessage ? 'mr-1' : 'ml-1'
                    }`}>
                      {msg.timestamp}
                      {isOwnMessage && !isSystem && (
                        <CheckCheck size={12} className="text-[#e2533b] font-bold" />
                      )}
                    </span>
                  </div>
                );
              })}

              {/* Auto Scroll block */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input layout frame text-input box, matches screenshot fully */}
            <div className="p-3 md:p-4 bg-[#fffaf4]/88 border-t border-white/70 shrink-0 backdrop-blur-xl">
              <form onSubmit={handleSend} className="flex items-center gap-2 bg-white/88 rounded-full border border-[#4b362a]/10 pr-2 pl-3 py-1.5 shadow-[0_12px_30px_rgba(77,49,31,0.1)] transition-all">
                <button 
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-1.5 text-[#8d8074] hover:text-[#8f4f3b] transition-colors flex items-center justify-center rounded-full cursor-pointer"
                  aria-label="Upload image"
                >
                  <Image size={20} />
                </button>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelected}
                />

                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 font-sans text-xs md:text-sm text-[#2c211b] placeholder:text-[#8d8074] py-2"
                  placeholder={`Message ${activeIdentity?.name || 'conversation'}...`}
                />

                <button 
                  type="submit"
                  aria-label="Send text messages"
                  className="bg-[#2c211b] hover:bg-[#8f4f3b] text-white p-2.5 rounded-full flex items-center justify-center transition-all shadow active:scale-90 cursor-pointer"
                >
                  <Send size={14} className="fill-current" />
                </button>

              </form>
            </div>
          </>
        )}
      </section>

      {/* Mock Dialing calling modal overlays */}
      {mockCallState === 'calling' && (
        <div className="fixed inset-0 bg-[#1a1a1a] z-[99] flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
          <div className="w-24 h-24 rounded-none overflow-hidden border-2 border-[#e2533b] shadow-2xl relative select-none">
            <img src={activeIdentity?.avatar} alt="Calling recipient" className="w-full h-full object-cover grayscale" />
            <div className="absolute inset-0 bg-[#e2533b]/25 animate-ping" />
          </div>

          <h3 className="font-serif italic font-bold text-lg mt-6">{activeIdentity?.name}</h3>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#e2533b] mt-2 animate-pulse font-bold">
            Calling via CraveMap Voice...
          </p>

          <button
            onClick={() => setMockCallState('idle')}
            className="mt-16 w-12 h-12 bg-[#e2533b] hover:bg-red-800 rounded-none flex items-center justify-center active:scale-90 cursor-pointer text-white"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      )}

    </div>
  );
}
