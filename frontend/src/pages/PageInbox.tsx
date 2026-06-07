/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, FormEvent } from 'react';
import { ChatThread, ChatMessage } from '../types';
import { ArrowLeft, BadgeCheck, Phone, MoreVertical, CheckCheck, PlusCircle, Image, Send, PhoneOff } from 'lucide-react';

interface PageInboxProps {
  threads: ChatThread[];
  activeThreadId: string;
  onSelectThread: (threadId: string) => void;
  onRefreshThreads?: () => void;
}

export default function PageInbox({ threads, activeThreadId, onSelectThread, onRefreshThreads }: PageInboxProps) {
  const [inputText, setInputText] = useState('');
  const [mobileView, setMobileView] = useState<'threads' | 'chat'>('threads');
  const [isTyping, setIsTyping] = useState(false);
  const [mockCallState, setMockCallState] = useState<'idle' | 'calling'>('idle');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  const fetchMessages = async (threadId: string) => {
    if (!threadId) return;
    setLoadingMessages(true);
    setErrorMessages(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/chatthreads/${threadId}/messages`);
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

  const postMessage = async (sender: string, text: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/chatmessages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender,
          text,
          chatThreadId: activeThreadId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchMessages(activeThreadId);
      
      if (onRefreshThreads) {
        onRefreshThreads();
      }
    } catch (err: any) {
      console.error("Error sending message to backend:", err);
    }
  };

  useEffect(() => {
    void fetchMessages(activeThreadId);
  }, [activeThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const query = inputText.trim();
    setInputText('');

    await postMessage('user', query);

    setIsTyping(true);
    setTimeout(async () => {
      let automatedResponse = "Perfect! Let us know if you need any adjustments or recommendations. We'll have your street-side table ready! 🐌🍻";
      
      const qLower = query.toLowerCase();
      if (qLower.includes('menu') || qLower.includes('món') || qLower.includes('ăn')) {
        automatedResponse = "Our top dishes tonight are Garlic Butter Crab ($15.00) and Scallion Oil Oysters ($12.50). Would you like to add any to your pre-order? 🦀💨";
      } else if (qLower.includes('vegetarian') || qLower.includes('chay')) {
        automatedResponse = "We have sautéed morning glory and veggie soft noodles available! Let our staff know upon checking in. 🌱";
      } else if (qLower.includes('discount') || qLower.includes('giảm') || qLower.includes('khuyến mãi')) {
        automatedResponse = "Show this chat upon arrival to receive a complimentary dessert! 🎁✨";
      } else if (qLower.includes('trễ') || qLower.includes('late') || qLower.includes('đến muộn')) {
        automatedResponse = "No worries, we hold tables up to 15 minutes. Just text us if you will be delayed! 👍";
      }

      setIsTyping(false);
      await postMessage('restaurant', automatedResponse);
    }, 2500);
  };

  const startMockCall = () => {
    setMockCallState('calling');
    setTimeout(() => {
      setMockCallState('idle');
    }, 3500); // ring for 3.5s then fade out
  };

  return (
    <div className="w-full h-[calc(100vh-72px)] flex bg-[#fdfcf9] overflow-hidden text-[#1a1a1a]">
      
      {/* Left Column Sidebar: Conversations List (Hidden on mobile if actively chatting) */}
      <aside className={`w-[320px] lg:w-[380px] bg-[#fdfcf9] border-r border-[#1a1a1a]/15 flex-col shrink-0 h-full ${
        mobileView === 'chat' ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Sidebar Header */}
        <div className="px-5 py-3 bg-[#fdfcf9] border-b border-[#1a1a1a]/15 flex justify-between items-center h-[72px]">
          <h1 className="font-serif italic font-bold text-lg text-[#1a1a1a]">Inbox // Conversations</h1>
          <span className="bg-[#e2533b] text-white font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded-none shadow-xs">
            {threads.filter(t => t.unreadCount > 0).length} New
          </span>
        </div>

        {/* Channels scroll container */}
        <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/15">
          {threads.map((thread) => {
            const isSelected = thread.id === activeThreadId;
            return (
              <div
                key={thread.id}
                onClick={() => {
                  onSelectThread(thread.id);
                  setMobileView('chat');
                }}
                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-[#f9f7f2] transition-colors select-none ${
                  isSelected ? 'bg-[#f9f7f2] border-l-4 border-[#e2533b]' : 'border-l-4 border-transparent'
                }`}
              >
                {/* Channel Avatar badge */}
                <div className="relative w-11 h-11 rounded-none overflow-hidden shrink-0 border border-[#1a1a1a]/15 bg-white">
                  <img src={thread.avatar} alt={thread.name} className="w-full h-full object-cover grayscale" />
                  {thread.id === 'oc_oanh_thread' && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#e2533b] rounded-full border border-white" />
                  )}
                </div>

                {/* Info Text snippet previews */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-serif italic font-bold text-xs text-[#1a1a1a] truncate">
                      {thread.name}
                    </h3>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/40 shrink-0">
                      {thread.lastMessageTime}
                    </span>
                  </div>
                  <p className={`font-sans text-[11px] truncate font-light ${
                    thread.unreadCount > 0 ? 'text-[#1a1a1a] font-black' : 'text-[#1a1a1a]/60'
                  }`}>
                    {thread.lastMessageText}
                  </p>
                </div>

                {/* Unread circle bubble */}
                {thread.unreadCount > 0 && (
                  <div className="w-2 h-2 bg-[#e2533b] rounded-none shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Column Chat Window Frame */}
      <section className={`flex-1 flex flex-col h-full bg-surface relative ${
        mobileView === 'threads' ? 'hidden md:flex' : 'flex'
      }`}>
        
        {/* Chat Header panel, matches layout specs */}
        <div className="h-[72px] px-5 border-b border-[#1a1a1a]/15 bg-white flex items-center justify-between shrink-0 z-10 shadow-xs">
          
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Back button */}
            <button 
              onClick={() => setMobileView('threads')}
              className="md:hidden p-1.5 -ml-1 text-[#1a1a1a]/70 hover:bg-[#f9f7f2] rounded-none transition-colors flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>

            {/* User header avatar */}
            <div className="relative w-10 h-10 rounded-none overflow-hidden shrink-0 border border-[#1a1a1a]/15 bg-white">
              <img src={activeThread.avatar} alt={activeThread.name} className="w-full h-full object-cover grayscale" />
            </div>

            <div className="min-w-0">
              <h2 className="font-serif italic font-bold text-xs text-[#1a1a1a] flex items-center gap-1.5">
                {activeThread.name}
                {activeThread.restaurantId === 'oc_oanh' && (
                  <BadgeCheck size={15} className="fill-[#e2533b] text-white inline-block select-none" />
                )}
              </h2>
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#e2533b] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#e2533b] rounded-full animate-pulse" />
                {activeThread.statusText}
              </p>
            </div>
          </div>

          {/* Call & detail dropdown options */}
          <div className="flex gap-1.5">
            <button 
              onClick={startMockCall}
              className="p-2 text-[#1a1a1a] hover:text-[#e2533b] hover:bg-[#f9f7f2] rounded-none transition-all flex items-center justify-center cursor-pointer"
            >
              <Phone size={18} />
            </button>
            <button className="p-2 text-[#1a1a1a]/60 hover:text-[#1a1a1a] hover:bg-[#f9f7f2] rounded-none transition-colors flex items-center justify-center cursor-pointer">
              <MoreVertical size={18} />
            </button>
          </div>

        </div>

        {/* Messages Stream viewport area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col bg-[#fcfbfa]">
          
          {/* Calendar separator */}
          <div className="flex justify-center my-1 select-none">
            <span className="bg-[#f9f7f2] text-[#1a1a1a]/60 font-mono text-[9px] uppercase tracking-wider px-3.5 py-1 rounded-none shadow-xs border border-[#1a1a1a]/10">
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
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id}
                className={`flex flex-col group ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[85%] md:max-w-[70%] text-xs md:text-sm p-3.5 shadow-xs transition-transform transform origin-bottom rounded-none border ${
                  isUser 
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' 
                    : 'bg-white text-[#1a1a1a] border-[#1a1a1a]/15'
                }`}>
                  <p className="font-sans leading-relaxed font-light">{msg.text}</p>
                </div>
                
                <span className={`font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/40 mt-1 flex items-center gap-1 ${
                  isUser ? 'mr-1' : 'ml-1'
                }`}>
                  {msg.timestamp}
                  {isUser && (
                    <CheckCheck size={12} className="text-[#e2533b] font-bold" />
                  )}
                </span>
              </div>
            );
          })}

          {/* Typing dynamic simulator bubble */}
          {isTyping && (
            <div className="flex flex-col items-start animate-pulse">
              <div className="flex items-end gap-2 max-w-[85%]">
                <div className="bg-white/80 text-on-surface p-3 rounded-2xl rounded-tl-xs shadow-xs border border-outline-variant/15 flex items-center gap-2">
                  <span className="font-body-sm text-xs text-on-surface-variant flex items-center gap-1.5">
                    Oc Oanh is typing
                    <span className="inline-flex gap-0.5">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                    </span>
                  </span>
                </div>
              </div>
              <span className="font-label-sm text-[10px] text-on-surface-variant mt-1 ml-1 select-none">
                Typing...
              </span>
            </div>
          )}

          {/* Auto Scroll block */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input layout frame text-input box, matches screenshot fully */}
        <div className="p-3 bg-[#fdfcf9] border-t border-[#1a1a1a]/15 shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-2 bg-white rounded-none border border-[#1a1a1a]/15 pr-2 pl-3 py-1 shadow-xs transition-all">
            
            <button 
              type="button"
              onClick={() => {
                setInputText("Is outdoor seating still available for tonight?");
              }}
              className="p-1.5 text-[#1a1a1a]/40 hover:text-[#e2533b] transition-colors flex items-center justify-center rounded-none cursor-pointer"
            >
              <PlusCircle size={20} />
            </button>

            <button 
              type="button"
              onClick={() => {
                setInputText("We will arrive on time around 7 PM sharp. Thanks!");
              }}
              className="p-1.5 text-[#1a1a1a]/40 hover:text-[#e2533b] transition-colors flex items-center justify-center rounded-none cursor-pointer"
            >
              <Image size={20} />
            </button>

            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 font-sans text-xs md:text-sm text-[#1a1a1a] placeholder:text-[#1a1a1a]/45 py-1.5 font-light"
              placeholder={`Message ${activeThread.name}...`}
            />

            <button 
              type="submit"
              aria-label="Send text messages"
              className="bg-[#1a1a1a] hover:bg-[#e2533b] text-white p-2 rounded-none flex items-center justify-center transition-all shadow active:scale-90 cursor-pointer"
            >
              <Send size={14} className="fill-current" />
            </button>

          </form>
        </div>

      </section>

      {/* Mock Dialing calling modal overlays */}
      {mockCallState === 'calling' && (
        <div className="fixed inset-0 bg-[#1a1a1a] z-[99] flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
          <div className="w-24 h-24 rounded-none overflow-hidden border-2 border-[#e2533b] shadow-2xl relative select-none">
            <img src={activeThread.avatar} alt="Calling recipient" className="w-full h-full object-cover grayscale" />
            <div className="absolute inset-0 bg-[#e2533b]/25 animate-ping" />
          </div>
          
          <h3 className="font-serif italic font-bold text-lg mt-6">{activeThread.name}</h3>
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
