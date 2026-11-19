'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Sparkles,
  Radio,
  Eye,
  Heart,
  Crown,
  Mic,
  MicOff,
  Flame,
  X,
  Plus,
  Send,
  Smile,
  ShieldCheck,
  ChevronDown,
  Globe,
  Check,
  Smartphone,
  Volume2,
} from 'lucide-react';
import {
  DesignFixtures,
  FixturePartyRoom,
  FixturePartySeat,
  FixtureLiveChatMessage,
} from '@/lib/design/designFixtures';
import {
  COUNTRIES_LIST,
  POPULAR_COUNTRY_SHORTCUTS,
  getCountryFlag,
  getCountryName,
} from '@/lib/countries';

export interface WebPartyPanelProps {
  isUr?: boolean;
  onOpenAppModal?: () => void;
}

export const WebPartyPanel: React.FC<WebPartyPanelProps> = ({
  isUr = false,
  onOpenAppModal,
}) => {
  // Discovery Tabs: 'all' vs 'following'
  const [subTab, setSubTab] = useState<'party' | 'following'>('party');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Active Selected Party Room for 9-Seat Room Experience
  const [activeRoom, setActiveRoom] = useState<FixturePartyRoom | null>(null);

  // In-room states
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [seatRequestStatus, setSeatRequestStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [chatMessages, setChatMessages] = useState<FixtureLiveChatMessage[]>([]);
  const [chatInputText, setChatInputText] = useState('');
  const [selectedSeat, setSelectedSeat] = useState<FixturePartySeat | null>(null);

  // Create Room Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomCategory, setNewRoomCategory] = useState('ChitChat');
  const [newRoomNotice, setNewRoomNotice] = useState('');

  // Retrieve Party Rooms from DesignFixtures
  const { allPartyRooms, partyError } = useMemo(() => {
    try {
      if (DesignFixtures.isError) {
        throw new Error('Party audio cluster offline. Please check network connection.');
      }
      return { allPartyRooms: DesignFixtures.partyRooms, partyError: null };
    } catch (err: any) {
      return { allPartyRooms: [] as FixturePartyRoom[], partyError: err?.message || 'Failed to load party rooms.' };
    }
  }, []);

  // Filter party rooms by tab & country
  const filteredPartyRooms = useMemo(() => {
    return allPartyRooms.filter((room) => {
      const matchesCountry =
        selectedCountry === 'ALL' ||
        room.countryCode.toUpperCase() === selectedCountry.toUpperCase();
      const matchesSubTab =
        subTab === 'party' || room.hostNickname === 'Amina Noor'; // Following demo
      return matchesCountry && matchesSubTab;
    });
  }, [allPartyRooms, selectedCountry, subTab]);

  // When a room is opened, load its initial chat
  const handleOpenRoom = (room: FixturePartyRoom) => {
    setActiveRoom(room);
    setChatMessages([
      {
        id: 'pmsg_1',
        senderNickname: room.hostNickname,
        senderAvatar: room.hostAvatar,
        senderLevel: 32,
        isVip: true,
        content: `Welcome to ${room.title}! 💖`,
        timestamp: '10:02 AM',
      },
      {
        id: 'pmsg_2',
        senderNickname: 'Bilal Ahmed',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        senderLevel: 14,
        isVip: false,
        content: 'Great sound quality on this 9-seat stage! 🎧',
        timestamp: '10:05 AM',
      },
    ]);
    setSeatRequestStatus('none');
    setIsMicMuted(true);
    setSelectedSeat(null);
  };

  const handleCloseRoom = () => {
    setActiveRoom(null);
    setSelectedSeat(null);
  };

  const handleToggleSeatRequest = () => {
    if (seatRequestStatus === 'none') {
      setSeatRequestStatus('pending');
    } else {
      setSeatRequestStatus('none');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !activeRoom) return;

    const newMessage: FixtureLiveChatMessage = {
      id: `chat_${Date.now()}`,
      senderNickname: DesignFixtures.currentUserProfile.nickname,
      senderAvatar: DesignFixtures.currentUserProfile.avatarUrl,
      senderLevel: 32,
      isVip: true,
      content: chatInputText.trim(),
      timestamp: 'Just now',
    };

    setChatMessages((prev) => [...prev, newMessage]);
    setChatInputText('');
  };

  const handleCreateRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomTitle.trim()) return;

    // Create a local party room preview
    const createdRoom: FixturePartyRoom = {
      id: `party_custom_${Date.now()}`,
      roomNumber: `${Math.floor(100000 + Math.random() * 900000)}`,
      title: newRoomTitle.trim(),
      hostNickname: DesignFixtures.currentUserProfile.nickname,
      hostAvatar: DesignFixtures.currentUserProfile.avatarUrl,
      hostUserId: DesignFixtures.currentUserProfile.userId,
      coverUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600',
      category: newRoomCategory,
      country: 'Pakistan',
      countryCode: 'PK',
      flagEmoji: '🇵🇰',
      viewerCount: 420,
      maxSeats: 9,
      occupiedSeatCount: 1,
      joinStatus: 'open',
      seats: [
        {
          index: 1,
          userId: DesignFixtures.currentUserProfile.userId,
          nickname: DesignFixtures.currentUserProfile.nickname,
          avatarUrl: DesignFixtures.currentUserProfile.avatarUrl,
          isHost: true,
          isMuted: false,
          isSpeaking: true,
          giftPoints: 0,
          isOccupied: true,
          isLocked: false,
          canJoin: false,
          joinRequestStatus: 'none',
        },
        ...Array.from({ length: 8 }, (_, i) => ({
          index: i + 2,
          userId: null,
          nickname: null,
          avatarUrl: null,
          isHost: false,
          isMuted: true,
          isSpeaking: false,
          giftPoints: 0,
          isOccupied: false,
          isLocked: false,
          canJoin: true,
          joinRequestStatus: 'none',
        })),
      ],
    };

    setShowCreateModal(false);
    setNewRoomTitle('');
    setNewRoomNotice('');
    handleOpenRoom(createdRoom);
  };

  // Filter countries for modal
  const modalCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRIES_LIST;
    const q = countrySearch.toLowerCase();
    return COUNTRIES_LIST.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  // =========================================================================
  // VIEW A: 9-SEAT PARTY ROOM INTERIOR EXPERIENCE
  // =========================================================================
  if (activeRoom) {
    const occupiedCount = activeRoom.seats.filter((s) => s.isOccupied).length;

    return (
      <div className="space-y-4 animate-in fade-in duration-200" data-testid="party-room-view">
        {/* ROOM TOP HEADER */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={activeRoom.hostAvatar}
              alt={activeRoom.hostNickname}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-[#FF1A6C] shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-gray-900 truncate">
                  {activeRoom.title}
                </h1>
                <span className="text-xs">{activeRoom.flagEmoji}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="font-bold text-gray-700">{activeRoom.hostNickname}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200 text-[10px]">
                  {activeRoom.category}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[#FF1A6C] font-semibold">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>{occupiedCount * 280 + 340} heat</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Seat Request Action Button */}
            <button
              type="button"
              onClick={handleToggleSeatRequest}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5 ${
                seatRequestStatus === 'pending'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-[#FF1A6C] hover:bg-[#e0125c] text-white'
              }`}
            >
              {seatRequestStatus === 'pending' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Request Sent (Waiting)</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5" />
                  <span>Request Seat</span>
                </>
              )}
            </button>

            {/* Microphone Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMicMuted(!isMicMuted)}
              className={`p-2.5 rounded-xl border transition-colors ${
                isMicMuted
                  ? 'bg-gray-100 text-gray-500 border-gray-200 hover:text-gray-800'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-300 ring-2 ring-emerald-200'
              }`}
              title={isMicMuted ? 'Microphone Muted' : 'Microphone Active'}
            >
              {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 animate-pulse" />}
            </button>

            {/* Leave Room Button */}
            <button
              type="button"
              onClick={handleCloseRoom}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              title="Close Party Room"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PINNED ANNOUNCEMENT */}
        <div className="px-4 py-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-bold">Lounge Notice:</span>
          <span className="truncate">Welcome to {activeRoom.title}! Follow community guidelines & enjoy voice chat.</span>
        </div>

        {/* 9-SEATS GRID & PARTY CHAT SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT 2 COLUMNS: 9-SEAT AUDIO STAGE */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-gray-900 via-[#15162c] to-purple-950 text-white shadow-lg border border-white/10">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                    9-Seat Voice Lounge Active
                  </span>
                </div>
                <span className="text-xs text-white/60 font-medium">
                  {occupiedCount} / 9 Occupied
                </span>
              </div>

              {/* 3x3 SEATS GRID */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                {activeRoom.seats.map((seat) => {
                  const isHost = seat.isHost || seat.index === 1;
                  const isOccupied = seat.isOccupied;

                  return (
                    <div
                      key={seat.index}
                      onClick={() => {
                        if (isOccupied) {
                          setSelectedSeat(seat);
                        } else {
                          handleToggleSeatRequest();
                        }
                      }}
                      className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all cursor-pointer ${
                        isOccupied
                          ? 'bg-white/10 hover:bg-white/15 border border-white/20'
                          : 'bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/20 hover:border-pink-400/60'
                      }`}
                    >
                      {/* Seat Number Tag */}
                      <span className="absolute top-2 left-2 text-[10px] font-bold text-white/50 px-1.5 py-0.5 rounded-md bg-black/40">
                        #{seat.index}
                      </span>

                      {/* Seat Avatar or Empty Icon */}
                      <div className="relative my-1">
                        {isOccupied ? (
                          <>
                            <img
                              src={seat.avatarUrl || activeRoom.hostAvatar}
                              alt={seat.nickname || `Seat ${seat.index}`}
                              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-2 ${
                                isHost ? 'ring-amber-400' : 'ring-pink-500'
                              } ${seat.isSpeaking ? 'scale-105 ring-emerald-400' : ''}`}
                            />
                            {isHost && (
                              <div className="absolute -top-2 -right-1 bg-amber-400 text-black p-1 rounded-full shadow-md">
                                <Crown className="w-3 h-3 fill-current" />
                              </div>
                            )}
                            {seat.isSpeaking && (
                              <span className="absolute -bottom-1 inset-x-0 mx-auto w-fit text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.2 rounded-full animate-bounce">
                                TALKING
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-pink-400 hover:scale-105 transition-all">
                            <Plus className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Nickname or Empty label */}
                      <p className="text-xs font-bold text-white truncate max-w-[90px] text-center mt-1">
                        {isOccupied ? seat.nickname : 'Available'}
                      </p>

                      {/* Status / Points */}
                      <span className="text-[10px] text-white/50">
                        {isOccupied
                          ? isHost
                            ? 'Lounge Host'
                            : `${seat.giftPoints || 0} pts`
                          : 'Tap to sit'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* SEAT NOTICE / DISCLAIMER */}
              <div className="mt-6 p-3 rounded-2xl bg-black/40 border border-white/10 text-xs text-white/70 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-pink-400 shrink-0" />
                  <span className="text-[11px]">
                    Live camera streaming & full multi-user audio seats are hosted on mobile app. Desktop web operates in interactive lounge mode.
                  </span>
                </div>
                {onOpenAppModal && (
                  <button
                    type="button"
                    onClick={onOpenAppModal}
                    className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold shrink-0 transition-colors"
                  >
                    Get Mobile App
                  </button>
                )}
              </div>
            </div>

            {/* SEAT DETAILS MODAL IF CLICKED */}
            {selectedSeat && (
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedSeat.avatarUrl || ''}
                    alt={selectedSeat.nickname || ''}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{selectedSeat.nickname}</h4>
                    <p className="text-[11px] text-gray-500">Seat #{selectedSeat.index} · {selectedSeat.giftPoints} Gift Points</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAppModal) onOpenAppModal();
                    }}
                    className="px-3 py-1 rounded-xl bg-pink-50 text-[#FF1A6C] text-xs font-bold hover:bg-pink-100 transition-colors"
                  >
                    Send Gift
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSeat(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: PARTY ROOM CHAT */}
          <div className="flex flex-col h-[520px] rounded-3xl bg-white border border-gray-200/90 shadow-xs overflow-hidden">
            {/* Chat Header */}
            <div className="p-3.5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">Party Lounge Chat</span>
              <span className="text-[10px] text-gray-400">{chatMessages.length} messages</span>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p>Welcome to {activeRoom.title}!</p>
                  <p className="text-[11px] mt-1">Be the first to say hello.</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-2">
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderNickname}
                      className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900 truncate">
                          {msg.senderNickname}
                        </span>
                        {msg.isVip && (
                          <span className="px-1 py-0.2 rounded text-[8px] font-black bg-amber-100 text-amber-800">
                            VIP
                          </span>
                        )}
                        <span className="text-[9px] text-gray-400 ml-auto">{msg.timestamp}</span>
                      </div>
                      <p className="text-gray-700 font-medium break-words mt-0.5">{msg.content || (msg as any).text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="p-2.5 border-t border-gray-100 bg-white flex items-center gap-2">
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder="Say something in party..."
                className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#FF1A6C]"
              />
              <button
                type="submit"
                disabled={!chatInputText.trim()}
                className="p-2 rounded-xl bg-[#FF1A6C] hover:bg-[#e0125c] disabled:opacity-40 text-white transition-colors"
                title="Send"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: PARTY DISCOVERY SCREEN
  // =========================================================================
  return (
    <div className="space-y-6 animate-in fade-in duration-150" data-testid="party-discovery-screen">
      {/* 1. TOP HEADER BANNER WITH 'PARTY' / 'CREATE ROOM' BUTTON */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border border-purple-100 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
              {isUr ? '9 سیٹ پارٹی لاؤنجز' : '9-Seat Party Lounges'}
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              {filteredPartyRooms.length} Rooms
            </span>
          </div>
          <p className="text-xs text-gray-600 max-w-md">
            {isUr
              ? 'دوستوں کے ساتھ آڈیو رومز میں شامل ہوں، گانے سنیں اور بات چیت کریں'
              : 'Join themed audio lounges, hang out with creators, and share real-time voice moments.'}
          </p>
        </div>

        {/* PARTY / CREATE ROOM BUTTON */}
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] hover:opacity-95 text-white text-xs font-black tracking-wide shadow-md transition-all flex items-center gap-2 shrink-0 active:scale-95"
          data-testid="party-create-btn"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isUr ? 'روم بنائیں' : 'PARTY · Create Lounge'}</span>
        </button>
      </div>

      {/* 2. SUB TABS: PARTY vs FOLLOWING */}
      <div className="flex items-center justify-between border-b border-gray-200/80 pb-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setSubTab('party')}
            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all ${
              subTab === 'party'
                ? 'bg-[#FF1A6C] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {isUr ? 'تمام پارٹیاں' : 'Party'}
          </button>
          <button
            type="button"
            onClick={() => setSubTab('following')}
            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'following'
                ? 'bg-[#FF1A6C] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>{isUr ? 'فالوئنگ پارٹیاں' : 'Following'}</span>
          </button>
        </div>
      </div>

      {/* 3. COUNTRY FILTER CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
        {POPULAR_COUNTRY_SHORTCUTS.map((c) => {
          const isSelected = selectedCountry === c.code;
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => setSelectedCountry(c.code)}
              className={`px-3.5 py-1.5 rounded-full font-bold flex items-center gap-1.5 shrink-0 transition-all ${
                isSelected
                  ? 'bg-pink-50 text-[#FF1A6C] border border-pink-300 shadow-2xs'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200/80'
              }`}
            >
              <span className="text-sm leading-none">{c.flag}</span>
              <span>{c.name}</span>
            </button>
          );
        })}

        {/* More Countries Trigger */}
        <button
          type="button"
          onClick={() => setShowCountryModal(true)}
          className="px-3.5 py-1.5 rounded-full bg-white hover:bg-gray-100 text-gray-700 border border-gray-200/80 font-bold flex items-center gap-1.5 shrink-0 transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-[#FF1A6C]" />
          <span>More Countries</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
      </div>

      {/* 4. PARTY ROOMS LIST / CARDS */}
      {partyError ? (
        <div className="p-10 text-center rounded-3xl bg-white border border-red-200 shadow-xs space-y-3">
          <Users className="w-10 h-10 text-red-400 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">Failed to connect to party rooms</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">{partyError}</p>
        </div>
      ) : filteredPartyRooms.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-white border border-gray-200 shadow-xs space-y-3">
          <Users className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">
            {selectedCountry !== 'ALL'
              ? `No party lounges in ${getCountryName(selectedCountry)} right now`
              : 'No party lounges currently available'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try switching to All Countries or create your own 9-seat voice lounge!
          </p>
          <button
            type="button"
            onClick={() => setSelectedCountry('ALL')}
            className="px-4 py-2 rounded-xl bg-[#FF1A6C] text-white text-xs font-bold shadow-xs hover:bg-[#e0125c]"
          >
            View All Countries (🔥)
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredPartyRooms.map((room) => {
            const occupiedSeats = room.seats.filter((s) => s.isOccupied);
            const occupiedCount = occupiedSeats.length;

            return (
              <div
                key={room.id}
                onClick={() => handleOpenRoom(room)}
                className="group p-4 rounded-3xl bg-white border border-gray-200/90 hover:border-pink-300 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3.5 select-none"
                data-testid={`party-card-${room.id}`}
              >
                {/* Top Section: Cover & Info */}
                <div className="flex items-start gap-3.5">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200/80 shrink-0">
                    <img
                      src={room.coverUrl}
                      alt={room.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded-md bg-black/60 text-white text-[9px] font-bold">
                      {room.category}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-[#FF1A6C] transition-colors">
                        {room.title}
                      </h3>
                      <span className="text-xs shrink-0">{room.flagEmoji}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <img
                        src={room.hostAvatar}
                        alt={room.hostNickname}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span className="truncate">{room.hostNickname}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                        {occupiedCount} / 9 Seats
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Flame className="w-3 h-3 text-[#FF1A6C] fill-current" />
                        <span>{occupiedCount * 280 + 340}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Seat Faces & Enter Button */}
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {occupiedSeats.slice(0, 5).map((seat, i) => (
                        <img
                          key={i}
                          src={seat.avatarUrl || room.hostAvatar}
                          alt={seat.nickname || 'Seat'}
                          className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
                        />
                      ))}
                    </div>
                    {occupiedCount > 5 && (
                      <span className="text-[10px] font-bold text-gray-400">
                        +{occupiedCount - 5}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenRoom(room);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-pink-50 hover:bg-[#FF1A6C] text-[#FF1A6C] hover:text-white text-xs font-bold border border-pink-200/80 transition-all shadow-2xs"
                  >
                    Enter Room
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. CREATE PARTY ROOM MODAL */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FF1A6C]" />
                <h3 className="text-base font-extrabold text-gray-900">Create Party Lounge</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoomSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Lounge Title
                </label>
                <input
                  type="text"
                  required
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  placeholder="e.g. Midnight Music & Friendly ChitChat 🎶☕"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#FF1A6C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newRoomCategory}
                  onChange={(e) => setNewRoomCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#FF1A6C] bg-white"
                >
                  <option value="ChitChat">ChitChat ☕</option>
                  <option value="Singing">Singing 🎤</option>
                  <option value="Gaming">Gaming 🎮</option>
                  <option value="Music">Music 🪕</option>
                  <option value="Comedy">Comedy 😂</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Pinned Announcement (Optional)
                </label>
                <input
                  type="text"
                  value={newRoomNotice}
                  onChange={(e) => setNewRoomNotice(e.target.value)}
                  placeholder="Welcome everyone! Keep it friendly."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#FF1A6C]"
                />
              </div>

              <div className="p-3 rounded-2xl bg-pink-50 border border-pink-200 text-gray-600 space-y-1">
                <p className="font-bold text-[#FF1A6C]">9-Seat Voice Lounge Mode</p>
                <p className="text-[11px]">
                  You will automatically occupy Seat #1 as host. Other users can request available seats.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#FF1A6C] hover:bg-[#e0125c] text-white text-xs font-extrabold shadow-md transition-colors"
              >
                Launch 9-Seat Party Lounge
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. COUNTRY SELECT MODAL */}
      {showCountryModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowCountryModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-gray-900">Select Country</h3>
              <button
                type="button"
                onClick={() => setShowCountryModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              placeholder="Search country..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#FF1A6C]"
            />

            <div className="max-h-60 overflow-y-auto space-y-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedCountry('ALL');
                  setShowCountryModal(false);
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 text-left font-bold text-gray-800"
              >
                <span>🔥 All Countries</span>
                {selectedCountry === 'ALL' && <Check className="w-4 h-4 text-[#FF1A6C]" />}
              </button>
              {modalCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setSelectedCountry(c.code);
                    setShowCountryModal(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 text-left text-gray-800"
                >
                  <span className="flex items-center gap-2">
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                  </span>
                  {selectedCountry === c.code && <Check className="w-4 h-4 text-[#FF1A6C]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebPartyPanel;
