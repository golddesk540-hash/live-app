'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  Volume2,
  VolumeX,
  MoreHorizontal,
  Plus,
  Cast,
  Sparkles,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  LogOut,
  Send,
  UserPlus,
  Clock,
  Check,
  ShieldAlert,
  ShieldCheck,
  SwitchCamera,
  Gift,
  Grid,
  Palette,
  Settings2,
  Shield,
  FileText,
  Swords,
} from 'lucide-react';
import {
  PartySeat,
  PartyRoomResponse,
  PartySeatRequest,
  PartySeatInvitation,
  PartyMessage,
  PartyAudienceMember,
  PartyTheme,
  CANONICAL_PARTY_THEMES,
  getPartyThemeById,
} from '@/lib/party';
import PartyThemesScreen from './PartyThemesScreen';
import OrderAndClosingScreen from './OrderAndClosingScreen';
import RoomLimitsScreen from './RoomLimitsScreen';
import PartyRulesScreen from './PartyRulesScreen';
import PKBattleTypeScreen from '../pk/PKBattleTypeScreen';
import PKStartingBattleScreen from '../pk/PKStartingBattleScreen';

interface SeatGridScreenProps {
  roomId: string;
  initialRoom?: PartyRoomResponse;
}

export default function SeatGridScreen({ roomId, initialRoom }: SeatGridScreenProps) {
  const router = useRouter();

  // State
  const [room, setRoom] = useState<PartyRoomResponse | null>(initialRoom || null);
  const [seats, setSeats] = useState<PartySeat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // View Mode: 'chat' (Module 5.5 reference 05_05_audience_and_chat.png) or 'grid' (Module 5.4 reference)
  const [viewMode, setViewMode] = useState<'chat' | 'grid'>('chat');

  // Segmented Tab in Chat view: 'chat' vs 'audience'
  const [chatTab, setChatTab] = useState<'chat' | 'audience'>('chat');

  // Module 5.5 Chat Messages state
  const [messages, setMessages] = useState<PartyMessage[]>([
    {
      id: 'msg-seed-1',
      roomNumber: roomId,
      senderId: 'aud_ali_khan',
      senderName: 'Ali Khan',
      senderAvatar: '/assets/party/chat_avatar_ali_khan.png',
      senderRole: 'audience',
      messageText: 'Great party! 🎉',
      emoji: '🎉',
      createdAt: new Date(Date.now() - 30000).toISOString(),
    },
    {
      id: 'msg-seed-2',
      roomNumber: roomId,
      senderId: 'aud_sana',
      senderName: 'Sana',
      senderAvatar: '/assets/party/chat_avatar_sana.png',
      senderRole: 'audience',
      messageText: 'Can I join a seat? 😀',
      emoji: '😀',
      createdAt: new Date(Date.now() - 20000).toISOString(),
    },
    {
      id: 'msg-seed-3',
      roomNumber: roomId,
      senderId: 'aud_bilal',
      senderName: 'Bilal',
      senderAvatar: '/assets/party/chat_avatar_bilal.png',
      senderRole: 'audience',
      messageText: 'Amazing vibes 💜',
      emoji: '💜',
      createdAt: new Date(Date.now() - 10000).toISOString(),
    },
    {
      id: 'msg-seed-4',
      roomNumber: roomId,
      senderId: 'aud_zoya',
      senderName: 'Zoya',
      senderAvatar: '/assets/party/chat_avatar_zoya.png',
      senderRole: 'audience',
      messageText: 'Love this room! ❤️',
      emoji: '❤️',
      createdAt: new Date(Date.now() - 2000).toISOString(),
    },
  ]);
  const [chatInputText, setChatInputText] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Module 5.5 Audience state
  const [audienceCount, setAudienceCount] = useState<number>(256);
  const [audienceMembers, setAudienceMembers] = useState<PartyAudienceMember[]>([
    {
      id: 'aud-1',
      roomNumber: roomId,
      userId: 'aud_ali_khan',
      userName: 'Ali Khan',
      userAvatar: '/assets/party/chat_avatar_ali_khan.png',
      userLevel: 5,
      isActive: true,
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'aud-2',
      roomNumber: roomId,
      userId: 'aud_sana',
      userName: 'Sana',
      userAvatar: '/assets/party/chat_avatar_sana.png',
      userLevel: 4,
      isActive: true,
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'aud-3',
      roomNumber: roomId,
      userId: 'aud_bilal',
      userName: 'Bilal',
      userAvatar: '/assets/party/chat_avatar_bilal.png',
      userLevel: 7,
      isActive: true,
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'aud-4',
      roomNumber: roomId,
      userId: 'aud_zoya',
      userName: 'Zoya',
      userAvatar: '/assets/party/chat_avatar_zoya.png',
      userLevel: 6,
      isActive: true,
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'aud-5',
      roomNumber: roomId,
      userId: 'aud_tariq',
      userName: 'Tariq Vance',
      userAvatar: '/assets/chat/avatar_rizwan.png',
      userLevel: 3,
      isActive: true,
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'aud-6',
      roomNumber: roomId,
      userId: 'aud_nadia',
      userName: 'Nadia Khan',
      userAvatar: '/assets/chat/avatar_sana.png',
      userLevel: 8,
      isActive: true,
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'aud-7',
      roomNumber: roomId,
      userId: 'aud_arjun',
      userName: 'Arjun Verma',
      userAvatar: '/assets/chat/avatar_bilal.png',
      userLevel: 2,
      isActive: true,
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'aud-8',
      roomNumber: roomId,
      userId: 'aud_hina',
      userName: 'Hina Malik',
      userAvatar: '/assets/chat/avatar_mehak.png',
      userLevel: 9,
      isActive: true,
      joinedAt: new Date().toISOString(),
    },
  ]);

  // Selected seat for modal (request, occupy, vacate, media actions)
  const [selectedSeat, setSelectedSeat] = useState<PartySeat | null>(null);

  // Module 5.3 Seat Requests and Invitations state
  const [seatRequests, setSeatRequests] = useState<PartySeatRequest[]>([]);
  const [seatInvitations, setSeatInvitations] = useState<PartySeatInvitation[]>([]);
  const [isRequestPanelOpen, setIsRequestPanelOpen] = useState<boolean>(false);
  const [panelTab, setPanelTab] = useState<'requests' | 'invite'>('requests');
  const [inviteTargetSeat, setInviteTargetSeat] = useState<number>(2);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Module 5.4 Sound & Camera state
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

  // Module 5.6 Party Theme state
  const [activeTheme, setActiveTheme] = useState<PartyTheme>(CANONICAL_PARTY_THEMES[0]);
  const [isThemesOpen, setIsThemesOpen] = useState<boolean>(false);

  // Module 5.8 Order and Closing state
  const [isRoomControlsOpen, setIsRoomControlsOpen] = useState<boolean>(false);
  const [isPartyClosed, setIsPartyClosed] = useState<boolean>(false);

  // Module 5.9 Limits that Protect the Room state
  const [isLimitsOpen, setIsLimitsOpen] = useState<boolean>(false);

  // Module 5.10 Party Rules state
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);

  // Module 6.1 PK Battle Types state
  const [isPKBattleOpen, setIsPKBattleOpen] = useState<boolean>(false);
  const [pkModalStep, setPkModalStep] = useState<'types' | 'starting'>('types');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // 1. Fetch Room, Seats, Chat Messages, and Audience
  const fetchRoomData = useCallback(async () => {
    try {
      // Room info
      const roomRes = await fetch(`/api/party/${roomId}`);
      if (roomRes.ok) {
        const roomData = await roomRes.json();
        if (roomData.success && roomData.party) {
          setRoom(roomData.party);
        }
      }

      // Seats info
      const seatsRes = await fetch(`/api/party/${roomId}/seats`);
      if (seatsRes.ok) {
        const seatsData = await seatsRes.json();
        if (seatsData.success && Array.isArray(seatsData.seats)) {
          setSeats(seatsData.seats);
          const hostSeat = seatsData.seats.find((s: PartySeat) => s.seatNumber === 1);
          if (hostSeat) {
            setIsMicOn(!hostSeat.isMuted);
            setIsCameraOn(hostSeat.isCameraOn);
          }
        }
      }

      // Chat Messages
      const chatRes = await fetch(`/api/party/${roomId}/chat/messages`);
      if (chatRes.ok) {
        const chatData = await chatRes.json();
        if (chatData.success && Array.isArray(chatData.messages) && chatData.messages.length > 0) {
          setMessages(chatData.messages);
        }
      }

      // Audience List
      const audRes = await fetch(`/api/party/${roomId}/audience`);
      if (audRes.ok) {
        const audData = await audRes.json();
        if (audData.success) {
          if (audData.audienceCount) setAudienceCount(audData.audienceCount);
          if (Array.isArray(audData.members) && audData.members.length > 0) {
            setAudienceMembers(audData.members);
          }
        }
      }

      // Requests & Invitations
      const reqRes = await fetch(`/api/party/${roomId}/seats/requests`);
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        if (reqData.success) {
          if (Array.isArray(reqData.requests)) setSeatRequests(reqData.requests);
          if (Array.isArray(reqData.invitations)) setSeatInvitations(reqData.invitations);
        }
      }

      // Party Theme
      const themeRes = await fetch(`/api/party/${roomId}/theme`);
      if (themeRes.ok) {
        const themeData = await themeRes.json();
        if (themeData.success && themeData.theme) {
          setActiveTheme(themeData.theme);
        }
      }
    } catch (err: any) {
      console.error('Error fetching party room data:', err);
      setError('Failed to connect to party room');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // 2. Real-time background polling every 2.5 seconds
  useEffect(() => {
    fetchRoomData();
    const interval = setInterval(async () => {
      try {
        // Poll Chat Messages
        const chatRes = await fetch(`/api/party/${roomId}/chat/messages`);
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          if (chatData.success && Array.isArray(chatData.messages)) {
            setMessages(chatData.messages);
          }
        }

        // Poll Audience
        const audRes = await fetch(`/api/party/${roomId}/audience`);
        if (audRes.ok) {
          const audData = await audRes.json();
          if (audData.success) {
            if (audData.audienceCount) setAudienceCount(audData.audienceCount);
            if (Array.isArray(audData.members)) setAudienceMembers(audData.members);
          }
        }

        // Poll Seats Status
        const res = await fetch(`/api/party/${roomId}/seats/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.seats)) {
            setSeats((prev) =>
              prev.map((s) => {
                const updated = data.seats.find((us: any) => us.seat_number === s.seatNumber);
                if (updated) {
                  return {
                    ...s,
                    participantId: updated.participant_id,
                    participantName: updated.participant_name,
                    participantAvatar: updated.participant_avatar,
                    isHost: Boolean(updated.is_host),
                    isMuted: Boolean(updated.is_muted),
                    isCameraOn: Boolean(updated.is_camera_on),
                    isHostMuted: Boolean(updated.is_host_muted),
                    isVideoDisabled: Boolean(updated.is_video_disabled),
                    cameraFacing: updated.camera_facing || 'user',
                    status: updated.status,
                    occupiedAt: updated.occupied_at,
                    updatedAt: updated.updated_at,
                  };
                }
                return s;
              })
            );
          }
        }

        // Poll Requests
        const reqRes = await fetch(`/api/party/${roomId}/seats/requests`);
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          if (reqData.success) {
            if (Array.isArray(reqData.requests)) setSeatRequests(reqData.requests);
            if (Array.isArray(reqData.invitations)) setSeatInvitations(reqData.invitations);
          }
        }

        // Poll Party Theme
        const themeRes = await fetch(`/api/party/${roomId}/theme`);
        if (themeRes.ok) {
          const themeData = await themeRes.json();
          if (themeData.success && themeData.theme) {
            setActiveTheme((prev) => (prev.id !== themeData.theme.id ? themeData.theme : prev));
          }
        }

        // Poll Party Room Status (Module 5.8: Detect if room has closed)
        const statusRes = await fetch(`/api/party/${roomId}/status`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.success && statusData.isClosed) {
            setIsPartyClosed(true);
            setIsRoomControlsOpen(false);
          }
        }
      } catch (e) {
        // Silent background polling
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [roomId, fetchRoomData]);

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatTab]);

  // 3. Send Party Chat Message (Module 5.5)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = chatInputText.trim();
    if (!trimmed || isSendingMessage) return;

    if (trimmed.length > 300) {
      showToast('Message exceeds maximum 300 characters');
      return;
    }

    setIsSendingMessage(true);
    try {
      const res = await fetch(`/api/party/${roomId}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'user_viewer_demo',
          senderName: 'You',
          senderAvatar: '/assets/studio/user_avatar_default.png',
          senderRole: 'audience',
          messageText: trimmed,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setChatInputText('');
        showToast('Message sent');
      } else {
        showToast(data.error || 'Failed to send message');
      }
    } catch (err: any) {
      showToast('Network error sending message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // 4. Media Controls (Toggle Mic, Toggle Camera, Flip Camera)
  const handleToggleMedia = async (
    seatNum: number,
    type: 'mic' | 'camera' | 'facing',
    enabledVal?: boolean,
    facingVal?: 'user' | 'environment'
  ) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/party/${roomId}/seats/media/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumber: seatNum,
          type,
          enabled: enabledVal,
          facing: facingVal,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Media updated');
        setSeats((prev) =>
          prev.map((s) => {
            if (s.seatNumber === seatNum) {
              return {
                ...s,
                isMuted: data.seat.isMuted,
                isCameraOn: data.seat.isCameraOn,
                isHostMuted: data.seat.isHostMuted,
                isVideoDisabled: data.seat.isVideoDisabled,
                cameraFacing: data.seat.cameraFacing,
              };
            }
            return s;
          })
        );

        if (seatNum === 1) {
          if (type === 'mic') setIsMicOn(Boolean(enabledVal));
          if (type === 'camera') setIsCameraOn(Boolean(enabledVal));
          if (type === 'facing') setCameraFacing(facingVal || 'user');
        }

        if (selectedSeat && selectedSeat.seatNumber === seatNum) {
          setSelectedSeat((prev) =>
            prev
              ? {
                  ...prev,
                  isMuted: data.seat.isMuted,
                  isCameraOn: data.seat.isCameraOn,
                  isHostMuted: data.seat.isHostMuted,
                  isVideoDisabled: data.seat.isVideoDisabled,
                  cameraFacing: data.seat.cameraFacing,
                }
              : null
          );
        }
      } else {
        showToast(data.error || 'Failed to update media');
      }
    } catch (err: any) {
      showToast('Network error while toggling media');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Host Moderation (Host Mute, Disable Video, Kick)
  const handleModerateSeat = async (
    seatNum: number,
    action: 'host_mute' | 'disable_video' | 'kick'
  ) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/party/${roomId}/seats/media/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumber: seatNum,
          action,
          isHostAction: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Seat moderated successfully');
        if (action === 'kick') {
          setSeats((prev) =>
            prev.map((s) =>
              s.seatNumber === seatNum
                ? {
                    ...s,
                    participantId: null,
                    participantName: null,
                    participantAvatar: null,
                    isHost: false,
                    isMuted: false,
                    isCameraOn: false,
                    isHostMuted: false,
                    isVideoDisabled: false,
                    status: 'available',
                  }
                : s
            )
          );
        } else if (data.moderatedSeat) {
          setSeats((prev) =>
            prev.map((s) =>
              s.seatNumber === seatNum
                ? {
                    ...s,
                    isMuted: data.moderatedSeat.isMuted,
                    isCameraOn: data.moderatedSeat.isCameraOn,
                    isHostMuted: data.moderatedSeat.isHostMuted,
                    isVideoDisabled: data.moderatedSeat.isVideoDisabled,
                  }
                : s
            )
          );
        }
        setSelectedSeat(null);
      } else {
        showToast(data.error || 'Host moderation action failed');
      }
    } catch (err: any) {
      showToast('Error executing moderation action');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Toggle bottom bar mic button
  const toggleBottomMic = () => {
    const nextVal = !isMicOn;
    setIsMicOn(nextVal);
    handleToggleMedia(1, 'mic', nextVal);
  };

  // 7. Toggle bottom bar camera button
  const toggleBottomCamera = () => {
    const nextVal = !isCameraOn;
    setIsCameraOn(nextVal);
    handleToggleMedia(1, 'camera', nextVal);
  };

  // 8. Toggle room speaker sound
  const toggleSpeaker = () => {
    const nextVal = !isSpeakerOn;
    setIsSpeakerOn(nextVal);
    showToast(nextVal ? 'Party room sound enabled' : 'Party room sound muted');
  };

  // 9. Handle Request Seat
  const handleRequestSeat = async (seatNumber: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/party/${roomId}/seats/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumber,
          userId: 'user_viewer_' + Math.floor(Math.random() * 1000),
          userName: 'Viewer (You)',
          userAvatar: '/assets/studio/user_avatar_default.png',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Request sent for Seat #${seatNumber}! Awaiting host approval.`);
        setSelectedSeat(null);
        fetchRoomData();
      } else {
        showToast(data.error || 'Failed to submit seat request');
      }
    } catch (err: any) {
      showToast('Error requesting seat');
    } finally {
      setActionLoading(false);
    }
  };

  // 10. Respond to Request (Host Action)
  const handleRespondRequest = async (requestId: string, action: 'accept' | 'reject') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/party/${roomId}/seats/requests/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Request ${action}ed`);
        fetchRoomData();
      } else {
        showToast(data.error || `Failed to ${action} request`);
      }
    } catch (err: any) {
      showToast('Error responding to request');
    } finally {
      setActionLoading(false);
    }
  };

  // 11. Send Invitation to Audience member
  const handleSendInvitation = async (
    seatNumber: number,
    viewer: { id?: string; userId?: string; name?: string; userName?: string; avatar?: string; userAvatar?: string }
  ) => {
    setActionLoading(true);
    const targetUserId = viewer.userId || viewer.id || 'aud_user';
    const targetUserName = viewer.userName || viewer.name || 'Audience Member';
    const targetAvatar = viewer.userAvatar || viewer.avatar || '/assets/studio/user_avatar_default.png';

    try {
      const res = await fetch(`/api/party/${roomId}/seats/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumber,
          invitedUserId: targetUserId,
          invitedUserName: targetUserName,
          invitedUserAvatar: targetAvatar,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Invitation sent to ${targetUserName} for Seat #${seatNumber}!`);
        fetchRoomData();
      } else {
        showToast(data.error || 'Failed to send invitation');
      }
    } catch (err: any) {
      showToast('Error sending invitation');
    } finally {
      setActionLoading(false);
    }
  };

  // 12. Respond to Invitation (Viewer Action)
  const handleRespondInvitation = async (invitationId: string, action: 'accept' | 'decline') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/party/${roomId}/seats/invite/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, action }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Invitation ${action}ed`);
        fetchRoomData();
      } else {
        showToast(data.error || `Failed to ${action} invitation`);
      }
    } catch (err: any) {
      showToast('Error responding to invitation');
    } finally {
      setActionLoading(false);
    }
  };

  // 13. Occupy Seat directly
  const handleOccupySeat = async (seatNumber: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/party/${roomId}/seats/occupy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumber,
          participantId: 'user_dev_' + Math.floor(Math.random() * 1000),
          participantName: `Alex ${seatNumber}`,
          participantAvatar: `/assets/party/seat_avatar_${seatNumber <= 6 ? seatNumber : 2}.png`,
          isMuted: false,
          isCameraOn: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Joined Seat #${seatNumber} successfully!`);
        setSelectedSeat(null);
        fetchRoomData();
      } else {
        showToast(data.error || 'Failed to take seat');
      }
    } catch (err: any) {
      showToast('Error joining seat');
    } finally {
      setActionLoading(false);
    }
  };

  // 14. Vacate Seat
  const handleVacateSeat = async (seatNumber: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/party/${roomId}/seats/vacate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumber,
          isHostAction: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Seat #${seatNumber} vacated`);
        setSelectedSeat(null);
        fetchRoomData();
      } else {
        showToast(data.error || 'Failed to vacate seat');
      }
    } catch (err: any) {
      showToast('Error vacating seat');
    } finally {
      setActionLoading(false);
    }
  };

  // Ensure 9 seats exist for rendering
  const displaySeats: PartySeat[] = [];
  for (let i = 1; i <= 9; i++) {
    const found = seats.find((s) => s.seatNumber === i);
    if (found) {
      displaySeats.push(found);
    } else {
      displaySeats.push({
        id: `seat-${roomId}-${i}`,
        roomNumber: roomId,
        seatNumber: i,
        participantId: i <= 6 ? `user_${i}` : null,
        participantName: i === 1 ? 'Maria Live' : i <= 6 ? `Participant ${i}` : null,
        participantAvatar: `/assets/party/seat_avatar_${i <= 6 ? i : 1}.png`,
        isHost: i === 1,
        isMuted: false,
        isCameraOn: i <= 6,
        isHostMuted: false,
        isVideoDisabled: false,
        cameraFacing: 'user',
        status: i <= 6 ? 'occupied' : 'available',
        occupiedAt: i <= 6 ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  const availableSeatNumbers = displaySeats
    .filter((s) => s.seatNumber >= 2 && s.status === 'available')
    .map((s) => s.seatNumber);

  return (
    <div
      className="min-h-screen text-white flex flex-col justify-between max-w-sm sm:max-w-md mx-auto select-none font-sans relative overflow-hidden shadow-2xl border-x border-[#1a123f] transition-all duration-500"
      style={{
        background: activeTheme.backgroundGradient,
      }}
      data-testid="seat-grid-screen"
      data-active-theme={activeTheme.id}
    >
      {/* Ambient background glows dynamically matching activeTheme.accentColor */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: `${activeTheme.accentColor}25` }}
      />
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: `${activeTheme.accentColor}20` }}
      />

      {/* TOP STATUS BAR (9:41, Cellular, WiFi, Battery) */}
      <div className="w-full pt-3 px-6 pb-2 flex items-center justify-between text-xs text-white/90 z-20 font-medium">
        <span>9:41</span>
        <div className="flex items-center gap-1.5 text-white/90">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9zm0 2c3.87 0 7 3.13 7 7 0 1.62-.56 3.11-1.5 4.31L12 19.78l-5.5-3.47C5.56 15.11 5 13.62 5 12c0-3.87 3.13-7 7-7z" />
          </svg>
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.22c3.78 0 7.22 1.48 9.77 3.92L12 19.01 2.23 11.14C4.78 8.7 8.22 7.22 12 7.22z" />
          </svg>
          <div className="w-5 h-2.5 border border-white/80 rounded-sm p-0.5 flex items-center">
            <div className="w-full h-full bg-white rounded-2xs" />
          </div>
        </div>
      </div>

      {/* TOP HEADER: < Back, Popo Live Branding, Audio Cast Icon, View Mode Switch */}
      <header className="px-4 py-2 flex items-center justify-between z-20" data-testid="seat-grid-header">
        {/* Back Button */}
        <Link
          href="/party/create?preview=demo"
          data-action="back"
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>

        {/* Popo Live Branding matching 05_05 */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/40">
            <span className="font-extrabold text-white text-sm tracking-tighter">P</span>
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-200 bg-clip-text text-transparent">
            Popo Live
          </span>
        </div>

        {/* Right Section: Themes, Mode Toggle & Audio Cast */}
        <div className="flex items-center gap-1.5">
          {/* Party Themes Button matching Module 5.6 */}
          <button
            onClick={() => setIsThemesOpen(true)}
            data-action="open-themes"
            className="px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-purple-500/30 text-[11px] font-bold text-purple-200 flex items-center gap-1 transition-all active:scale-95"
            title="Party Themes"
          >
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden xs:inline">Theme</span>
          </button>

          {/* Room Controls Button matching Module 5.8 */}
          <button
            onClick={() => setIsRoomControlsOpen(true)}
            data-action="open-room-controls"
            data-testid="header-room-controls-button"
            className="px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-purple-500/30 text-[11px] font-bold text-purple-200 flex items-center gap-1 transition-all active:scale-95"
            title="Room Controls (Order & Closing)"
          >
            <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden xs:inline">Controls</span>
          </button>

          {/* Room Limits Button matching Module 5.9 */}
          <button
            onClick={() => setIsLimitsOpen(true)}
            data-action="open-room-limits"
            data-testid="header-room-limits-button"
            className="px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-purple-500/30 text-[11px] font-bold text-purple-200 flex items-center gap-1 transition-all active:scale-95"
            title="Room Limits & Protection"
          >
            <Shield className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden xs:inline">Limits</span>
          </button>

          {/* Party Rules Button matching Module 5.10 */}
          <button
            onClick={() => setIsRulesOpen(true)}
            data-action="open-party-rules"
            data-testid="header-party-rules-button"
            className="px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-purple-500/30 text-[11px] font-bold text-purple-200 flex items-center gap-1 transition-all active:scale-95"
            title="Party Rules & Guidelines"
          >
            <FileText className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden xs:inline">Rules</span>
          </button>

          {/* PK Battle Button matching Module 6.1 */}
          <button
            onClick={() => setIsPKBattleOpen(true)}
            data-action="open-pk-battle"
            data-testid="header-pk-battle-button"
            className="px-2 py-1 rounded-full bg-gradient-to-r from-pink-600/40 to-rose-600/40 hover:from-pink-600/60 hover:to-rose-600/60 border border-pink-500/40 text-[11px] font-bold text-pink-200 flex items-center gap-1 transition-all active:scale-95 shadow-md shadow-pink-900/20"
            title="PK Battle Types (Module 6.1)"
          >
            <Swords className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden xs:inline">PK</span>
          </button>

          {/* Web Party Gateway Button matching Module 5.7 */}
          <Link
            href={`/party/web?roomId=${roomId}`}
            data-action="open-web-party"
            className="px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-purple-500/30 text-[11px] font-bold text-purple-200 flex items-center gap-1 transition-all active:scale-95"
            title="Join on Web"
          >
            <span>🌐</span>
            <span className="hidden xs:inline">Web</span>
          </Link>

          {/* Quick Toggle between Chat View (05_05) and Grid View (05_04) */}
          <button
            onClick={() => setViewMode((prev) => (prev === 'chat' ? 'grid' : 'chat'))}
            data-action="toggle-view-mode"
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-purple-500/30 text-[11px] font-bold text-purple-200 flex items-center gap-1 transition-all active:scale-95"
            title="Toggle between Chat and 9-Seat Grid"
          >
            {viewMode === 'chat' ? (
              <>
                <Grid className="w-3.5 h-3.5 text-pink-400" />
                <span>Seats</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
                <span>Chat</span>
              </>
            )}
          </button>

          {/* Cast Icon matching {•} in 05_05 */}
          <button
            onClick={() => showToast('Audio cast active')}
            data-action="cast"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all text-white/90"
            title="Party Cast"
          >
            <Cast className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* PARTY & HOST INFO BAR (Maria Live 👑, Party Room #7001, 👥 256) */}
      <div className="px-4 py-1.5 z-20">
        <div className="bg-[#120a32]/90 border border-[#261759] rounded-2xl px-3 py-2 flex items-center justify-between shadow-lg backdrop-blur-md">
          {/* Host Info */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[2px] shadow-md shadow-purple-500/30">
                <div className="w-full h-full rounded-full overflow-hidden bg-purple-950 flex items-center justify-center">
                  <Image
                    src={room?.hostAvatar || '/assets/party/seat_avatar_1.png'}
                    alt="Host"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as any).src = '/assets/party/seat_avatar_1.png';
                    }}
                  />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 rounded-full w-4 h-4 flex items-center justify-center shadow-sm text-[10px]">
                👑
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white tracking-tight" data-testid="host-name">
                  {displaySeats[0]?.participantName || room?.hostNickname || 'Maria Live'}
                </span>
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-purple-300/80">
                <span className="text-pink-400 font-semibold">🎉 Party Room</span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400 text-[11px] font-mono">#{room?.roomNumber || roomId}</span>
              </div>
            </div>
          </div>

          {/* Audience Count Pill matching 05_05 */}
          <button
            onClick={() => {
              setViewMode('chat');
              setChatTab('audience');
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/30 text-xs text-purple-200 transition-all cursor-pointer shadow-md"
            title="View Audience"
            data-testid="request-panel-toggle"
          >
            <Users className="w-3.5 h-3.5 text-purple-300" />
            <span className="font-semibold text-xs" data-testid="audience-count">
              {audienceCount}
            </span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: CHAT & AUDIENCE VIEW (STRICT 1:1 RECREATION OF 05_05_audience_and_chat.png) */}
      {viewMode === 'chat' && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden z-20" data-testid="chat-audience-view">
          {/* SEGMENTED PILL TABS: [ Chat ] vs [ Audience (1.2K) ] */}
          <div className="px-4 pt-2.5 pb-2">
            <div className="flex items-center gap-3">
              {/* Tab 1: Chat (Active by default in 05_05) */}
              <button
                onClick={() => setChatTab('chat')}
                data-testid="tab-chat"
                data-action="tab-chat"
                className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all shadow-md active:scale-98 ${
                  chatTab === 'chat'
                    ? 'bg-gradient-to-r from-[#9333ea] via-[#c026d3] to-[#a855f7] text-white shadow-purple-600/40 ring-1 ring-purple-400/50'
                    : 'bg-[#180e3c]/90 text-purple-300/70 hover:text-white border border-[#2b1765]/60'
                }`}
              >
                Chat
              </button>

              {/* Tab 2: Audience (1.2K) */}
              <button
                onClick={() => setChatTab('audience')}
                data-testid="tab-audience"
                data-action="tab-audience"
                className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all shadow-md active:scale-98 ${
                  chatTab === 'audience'
                    ? 'bg-gradient-to-r from-[#9333ea] via-[#c026d3] to-[#a855f7] text-white shadow-purple-600/40 ring-1 ring-purple-400/50'
                    : 'bg-[#180e3c]/90 text-purple-300/80 hover:text-white border border-[#2b1765]/60'
                }`}
              >
                Audience (1.2K)
              </button>
            </div>
          </div>

          {/* TAB CONTENT 1: LIVE CHAT STREAM matching 05_05_audience_and_chat.png */}
          {chatTab === 'chat' && (
            <div
              className="flex-1 overflow-y-auto px-4 py-2 space-y-3.5 scroll-smooth"
              data-testid="party-chat-stream"
            >
              {messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-400">
                  No messages yet. Say hello to the party!
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    data-testid={`chat-message-${msg.id || idx}`}
                    className="flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150"
                  >
                    {/* User Avatar */}
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-purple-950 border border-purple-500/30 shrink-0 shadow-md">
                      <Image
                        src={msg.senderAvatar || '/assets/party/chat_avatar_ali_khan.png'}
                        alt={msg.senderName}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as any).src = '/assets/party/chat_avatar_ali_khan.png';
                        }}
                      />
                    </div>

                    {/* Sender Nickname & Chat Bubble */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold text-purple-300/90" data-testid="chat-sender-name">
                          {msg.senderName}
                        </span>
                        {msg.senderRole === 'host' && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                            Host
                          </span>
                        )}
                        {msg.seatNumber && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-800/60 text-purple-200 text-[9px] font-bold">
                            Seat #{msg.seatNumber}
                          </span>
                        )}
                      </div>

                      {/* Bubble with Text & Emoji */}
                      <div
                        data-testid="chat-bubble"
                        className="bg-[#180e3c]/90 border border-[#2d195e]/60 rounded-2xl rounded-tl-sm px-3.5 py-2 shadow-lg backdrop-blur-sm max-w-xs text-xs font-bold text-white tracking-wide"
                      >
                        <span>{msg.messageText}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* TAB CONTENT 2: AUDIENCE LIST VIEW */}
          {chatTab === 'audience' && (
            <div
              className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scroll-smooth"
              data-testid="audience-list-view"
            >
              <div className="flex items-center justify-between text-xs text-purple-300/80 pb-1 border-b border-purple-900/30">
                <span>Active Audience Members</span>
                <span className="font-semibold text-pink-400">{audienceCount} Online</span>
              </div>

              {audienceMembers.map((aud) => (
                <div
                  key={aud.userId}
                  data-testid={`audience-member-${aud.userId}`}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-[#180e3c]/85 border border-purple-900/40 shadow-md backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-950 border border-purple-500/30 shadow-md">
                        <Image
                          src={aud.userAvatar || '/assets/studio/user_avatar_default.png'}
                          alt={aud.userName}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).src = '/assets/studio/user_avatar_default.png';
                          }}
                        />
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#07031b]" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white" data-testid="audience-user-name">
                          {aud.userName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-md bg-purple-800/80 border border-purple-400/30 text-[9px] font-bold text-purple-200">
                          Lv.{aud.userLevel || 1}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400">Listening to party audio</span>
                    </div>
                  </div>

                  {/* Invite to Available Seat Button */}
                  <button
                    onClick={() => handleSendInvitation(availableSeatNumbers[0] || 2, aud)}
                    disabled={availableSeatNumbers.length === 0}
                    data-action="invite-audience-btn"
                    className="py-1 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1 disabled:opacity-40"
                  >
                    <UserPlus className="w-3 h-3" /> Invite
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* BOTTOM MESSAGE INPUT & GIFT BUTTON matching 05_05_audience_and_chat.png */}
          <div className="px-4 pt-1 pb-3 z-20">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2.5 max-w-sm mx-auto">
              {/* Rounded Elongated Input Capsule */}
              <div className="flex-1 bg-[#1a1042]/95 border border-[#331c77]/70 rounded-full px-4 py-1.5 flex items-center justify-between shadow-xl backdrop-blur-md">
                <input
                  type="text"
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={300}
                  data-testid="chat-input"
                  className="bg-transparent text-white placeholder-purple-300/60 text-xs focus:outline-none w-full pr-2"
                />

                {/* Send Button inside Input Capsule with Chevron Right (>) */}
                <button
                  type="submit"
                  disabled={!chatInputText.trim() || isSendingMessage}
                  data-testid="chat-send-btn"
                  data-action="send-chat"
                  className="w-7 h-7 rounded-full bg-purple-600 hover:bg-purple-500 active:scale-95 text-white flex items-center justify-center shrink-0 shadow-md transition-all disabled:opacity-40"
                  title="Send message"
                >
                  {isSendingMessage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  )}
                </button>
              </div>

              {/* Pink/Magenta Glowing Circular Gift Button matching 05_05 */}
              <button
                type="button"
                onClick={() => showToast('🎁 Gift Shop active in Phase 6!')}
                data-testid="btn-gift"
                data-action="open-gift"
                className="w-11 h-11 rounded-full bg-gradient-to-tr from-fuchsia-600 to-pink-500 hover:from-fuchsia-500 hover:to-pink-400 active:scale-95 text-white flex items-center justify-center shrink-0 shadow-lg shadow-fuchsia-600/40 transition-all border border-pink-300/30"
                title="Send Gift"
              >
                <Gift className="w-5 h-5 text-white" />
              </button>
            </form>

            {/* Footer Reference Banner matching 05_05_audience_and_chat.png */}
            <div className="mt-2 text-center" data-testid="footer-reference-banner">
              <span className="inline-block px-3 py-1 rounded-full bg-purple-950/80 border border-purple-700/40 text-[11px] font-semibold text-purple-300/90 tracking-wide">
                05_05 Audience and Chat
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: 9-SEAT GRID VIEW (PRESERVED FROM MODULE 5.4) */}
      {viewMode === 'grid' && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden z-20" data-testid="nine-seat-grid-view">
          {/* MAIN 9-SEAT 3x3 GRID */}
          <main className="px-4 py-2 flex flex-col justify-center" data-testid="nine-seat-grid">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {displaySeats.map((seat) => {
                const isHostSeat = seat.seatNumber === 1;
                const isOccupied = seat.status === 'occupied';
                const hasPendingRequest = seatRequests.some((r) => r.seatNumber === seat.seatNumber);

                // SEAT 1: HOST SEAT
                if (isHostSeat) {
                  return (
                    <div
                      key={seat.seatNumber}
                      data-testid="seat-1-host"
                      data-seat-number="1"
                      onClick={() => setSelectedSeat(seat)}
                      className="aspect-square rounded-2xl relative overflow-hidden bg-[#180e3c] border-2 border-fuchsia-500 shadow-xl shadow-fuchsia-600/30 ring-2 ring-fuchsia-500/40 flex flex-col justify-between p-2 cursor-pointer group transition-all"
                    >
                      <div className="absolute inset-0 z-0">
                        <Image
                          src={seat.participantAvatar || '/assets/party/seat_avatar_1.png'}
                          alt="Host Maria"
                          fill
                          className={`object-cover ${
                            seat.isCameraOn ? 'opacity-95' : 'opacity-40 grayscale'
                          } group-hover:scale-105 transition-all duration-300`}
                          onError={(e) => {
                            (e.target as any).src = '/assets/party/seat_avatar_1.png';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                      </div>

                      <div className="relative z-10 flex items-center justify-between w-full">
                        <span className="text-sm drop-shadow-md">👑</span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md ${
                            seat.isMuted
                              ? 'bg-red-500/90 shadow-red-500/40'
                              : 'bg-emerald-500/90 shadow-emerald-500/40 ring-1 ring-emerald-300'
                          }`}
                          data-testid="host-mic-badge"
                        >
                          {seat.isMuted ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5" />}
                        </div>
                      </div>

                      <div className="relative z-10 flex items-center justify-center gap-1 w-full pb-0.5">
                        <span className="text-xs font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wide">
                          Host
                        </span>
                        <span className="text-amber-400 text-xs drop-shadow">🎙️</span>
                      </div>
                    </div>
                  );
                }

                // OCCUPIED PARTICIPANT SEATS
                if (isOccupied) {
                  return (
                    <div
                      key={seat.seatNumber}
                      data-testid={`seat-${seat.seatNumber}-occupied`}
                      data-seat-number={seat.seatNumber}
                      onClick={() => setSelectedSeat(seat)}
                      className={`aspect-square rounded-2xl relative overflow-hidden bg-[#180e3c] border ${
                        seat.isCameraOn
                          ? 'border-purple-400/60 shadow-lg shadow-purple-900/30'
                          : 'border-zinc-700/60 opacity-80'
                      } flex flex-col justify-between p-2 cursor-pointer group transition-all`}
                    >
                      <div className="absolute inset-0 z-0">
                        <Image
                          src={
                            seat.participantAvatar ||
                            `/assets/party/seat_avatar_${seat.seatNumber <= 6 ? seat.seatNumber : 2}.png`
                          }
                          alt={seat.participantName || `Seat ${seat.seatNumber}`}
                          fill
                          className={`object-cover ${
                            seat.isCameraOn ? 'opacity-95' : 'opacity-40 grayscale'
                          } group-hover:scale-105 transition-all duration-300`}
                          onError={(e) => {
                            (e.target as any).src = `/assets/party/seat_avatar_${seat.seatNumber <= 6 ? seat.seatNumber : 2}.png`;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                      </div>

                      <div className="relative z-10 flex items-center justify-between w-full">
                        <span className="text-[10px] font-bold text-purple-200/90 px-1.5 py-0.2 rounded-md bg-black/50 backdrop-blur-sm border border-purple-500/30">
                          #{seat.seatNumber}
                        </span>
                      </div>

                      <div className="relative z-10 flex items-end justify-between w-full">
                        <div className="flex items-center">
                          {seat.isCameraOn ? (
                            <div
                              className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white shadow-sm"
                              data-testid={`seat-${seat.seatNumber}-camera-badge`}
                            >
                              <Video className="w-2.5 h-2.5" />
                            </div>
                          ) : (
                            <div
                              className="w-5 h-5 rounded-full bg-red-600/80 backdrop-blur-sm border border-red-400/40 flex items-center justify-center text-white shadow-sm"
                              data-testid={`seat-${seat.seatNumber}-camera-off-badge`}
                            >
                              <VideoOff className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md ${
                              seat.isMuted
                                ? 'bg-red-500/90 shadow-red-500/30'
                                : 'bg-emerald-500/90 shadow-emerald-500/30 ring-1 ring-emerald-300 animate-pulse'
                            }`}
                            title={seat.isMuted ? 'Muted' : 'Speaking'}
                            data-testid={`seat-${seat.seatNumber}-mic-badge`}
                          >
                            {seat.isMuted ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // AVAILABLE EMPTY SEATS
                return (
                  <div
                    key={seat.seatNumber}
                    data-testid={`seat-${seat.seatNumber}-empty`}
                    data-seat-number={seat.seatNumber}
                    onClick={() => setSelectedSeat(seat)}
                    className="aspect-square rounded-2xl bg-[#140b32]/85 hover:bg-[#1a0f42] border border-[#291759] hover:border-purple-500/50 shadow-inner shadow-purple-950/60 backdrop-blur-md flex flex-col items-center justify-between p-2 cursor-pointer transition-all group active:scale-95 relative"
                  >
                    <span className="text-xs font-semibold text-purple-300/80">{seat.seatNumber}</span>
                    <div
                      className="w-10 h-10 rounded-full bg-[#361e68] group-hover:bg-[#4b2a91] text-purple-200 group-hover:text-white flex items-center justify-center shadow-md shadow-purple-950/70 border border-purple-400/20 group-hover:scale-105 transition-all"
                      data-action="add-participant"
                    >
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-[10px] text-zinc-500">Available</span>
                  </div>
                );
              })}
            </div>
          </main>

          {/* BOTTOM CONTROL BAR IN GRID VIEW (6 Buttons matching 05_04) */}
          <footer className="px-4 pt-1 pb-3 z-20" data-testid="bottom-control-bar">
            <div className="flex items-center justify-between gap-2 max-w-sm mx-auto">
              {/* 1. Mic Button */}
              <button
                onClick={toggleBottomMic}
                data-testid="control-mic"
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                  isMicOn
                    ? 'bg-[#291b52] hover:bg-[#38256e] text-white border border-purple-600/50 shadow-purple-900/30'
                    : 'bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 shadow-rose-900/30'
                }`}
                title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {isMicOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-rose-300" />}
              </button>

              {/* 2. Camera Button */}
              <button
                onClick={toggleBottomCamera}
                data-testid="control-camera"
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                  isCameraOn
                    ? 'bg-[#291b52] hover:bg-[#38256e] text-white border border-purple-600/50 shadow-purple-900/30'
                    : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-600/50 text-zinc-400'
                }`}
                title={isCameraOn ? 'Turn Video Off' : 'Turn Video On'}
              >
                {isCameraOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-zinc-400" />}
              </button>

              {/* 3. Speaker Button */}
              <button
                onClick={toggleSpeaker}
                data-testid="control-sound"
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                  isSpeakerOn
                    ? 'bg-[#291b52] hover:bg-[#38256e] text-zinc-200 border border-purple-700/40'
                    : 'bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300'
                }`}
                title={isSpeakerOn ? 'Mute Room Audio' : 'Unmute Room Audio'}
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-amber-300" />}
              </button>

              {/* 4. Audience Button (Switches to Chat & Audience view) */}
              <button
                onClick={() => {
                  setViewMode('chat');
                  setChatTab('audience');
                }}
                data-testid="control-audience"
                className="w-11 h-11 rounded-full bg-[#291b52] hover:bg-[#38256e] text-zinc-200 border border-purple-700/40 flex items-center justify-center transition-all shadow-lg active:scale-95 relative"
                title="Audience & Guests"
              >
                <Users className="w-5 h-5 text-zinc-200" />
                <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-pink-500 text-[9px] font-bold text-white">
                  {audienceCount}
                </span>
              </button>

              {/* 5. Chat Button (Switches to Chat view) */}
              <button
                onClick={() => {
                  setViewMode('chat');
                  setChatTab('chat');
                }}
                data-testid="control-chat"
                className="w-11 h-11 rounded-full bg-[#291b52] hover:bg-[#38256e] text-zinc-200 border border-purple-700/40 flex items-center justify-center transition-all shadow-lg active:scale-95"
                title="Party Chat"
              >
                <MessageSquare className="w-5 h-5 text-zinc-200" />
              </button>

              {/* 6. More Options / Room Controls Button */}
              <button
                onClick={() => setIsRoomControlsOpen(true)}
                data-testid="control-more"
                data-action="open-room-controls-bottom"
                className="w-11 h-11 rounded-full bg-[#291b52] hover:bg-[#38256e] text-zinc-200 border border-purple-700/40 flex items-center justify-center transition-all shadow-lg active:scale-95"
                title="Room Controls (Order & Closing)"
              >
                <MoreHorizontal className="w-5 h-5 text-zinc-200" />
              </button>
            </div>

            {/* Footer Reference Banner */}
            <div className="mt-2 text-center" data-testid="footer-reference-banner">
              <span className="inline-block px-3 py-1 rounded-full bg-purple-950/80 border border-purple-700/40 text-[11px] font-semibold text-purple-300/90 tracking-wide">
                05_05 Audience and Chat
              </span>
            </div>
          </footer>
        </div>
      )}

      {/* SEAT MODAL: SOUND, CAMERA & HOST MODERATION DRAWER */}
      {selectedSeat && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end justify-center p-4 animate-in fade-in duration-150"
          data-testid="seat-modal"
          onClick={() => setSelectedSeat(null)}
        >
          <div
            className="w-full max-w-sm bg-[#140b33] border border-purple-500/40 rounded-3xl p-5 shadow-2xl relative animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedSeat(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 p-[2px] flex items-center justify-center overflow-hidden">
                {selectedSeat.status === 'occupied' && selectedSeat.participantAvatar ? (
                  <Image
                    src={selectedSeat.participantAvatar}
                    alt={selectedSeat.participantName || 'Seat'}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                ) : (
                  <div className="w-full h-full rounded-[14px] bg-[#1d1045] flex items-center justify-center font-bold text-lg text-purple-200">
                    #{selectedSeat.seatNumber}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-base text-white">
                    {selectedSeat.status === 'occupied'
                      ? selectedSeat.participantName
                      : `Seat #${selectedSeat.seatNumber}`}
                  </h3>
                  {selectedSeat.seatNumber === 1 && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                </div>
                <div className="flex items-center gap-2 text-xs text-purple-300/80 mt-0.5">
                  <span className="px-1.5 py-0.2 rounded bg-purple-900/60 border border-purple-500/30 text-[10px]">
                    {selectedSeat.status === 'occupied' ? 'Voice & Video Seat' : 'Available'}
                  </span>
                  {selectedSeat.status === 'occupied' && (
                    <span className="text-[10px] text-zinc-400">
                      {selectedSeat.isMuted ? '🔇 Muted' : '🔊 Speaking'} • {selectedSeat.isCameraOn ? '📹 Camera On' : '📷 Camera Off'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {selectedSeat.status === 'occupied' ? (
              <div className="space-y-2 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleToggleMedia(selectedSeat.seatNumber, 'mic', selectedSeat.isMuted)}
                    disabled={actionLoading}
                    data-action="toggle-seat-mic"
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      selectedSeat.isMuted
                        ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 hover:bg-rose-900/70'
                        : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/70'
                    }`}
                  >
                    {selectedSeat.isMuted ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{selectedSeat.isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                  </button>

                  <button
                    onClick={() => handleToggleMedia(selectedSeat.seatNumber, 'camera', !selectedSeat.isCameraOn)}
                    disabled={actionLoading}
                    data-action="toggle-seat-camera"
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      selectedSeat.isCameraOn
                        ? 'bg-purple-950/60 border-purple-500/50 text-purple-200 hover:bg-purple-900/70'
                        : 'bg-zinc-800/60 border-zinc-600/50 text-zinc-300 hover:bg-zinc-700/70'
                    }`}
                  >
                    {selectedSeat.isCameraOn ? <Video className="w-3.5 h-3.5 text-purple-300" /> : <VideoOff className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>{selectedSeat.isCameraOn ? 'Turn Video Off' : 'Turn Video On'}</span>
                  </button>
                </div>

                <button
                  onClick={() =>
                    handleToggleMedia(
                      selectedSeat.seatNumber,
                      'facing',
                      undefined,
                      selectedSeat.cameraFacing === 'user' ? 'environment' : 'user'
                    )
                  }
                  disabled={actionLoading}
                  data-action="flip-seat-camera"
                  className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 text-xs font-semibold text-purple-200 flex items-center justify-center gap-2 transition-all"
                >
                  <SwitchCamera className="w-3.5 h-3.5 text-pink-400" />
                  <span>
                    Flip Camera ({selectedSeat.cameraFacing === 'user' ? 'Front' : 'Back'})
                  </span>
                </button>

                {selectedSeat.seatNumber > 1 && (
                  <div className="pt-2 border-t border-purple-900/40 space-y-1.5">
                    <p className="text-[11px] font-bold text-purple-300/90 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-pink-400" /> Host Moderation
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleModerateSeat(selectedSeat.seatNumber, 'host_mute')}
                        disabled={actionLoading || selectedSeat.isMuted}
                        data-action="host-mute"
                        className="py-2 px-2.5 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 border border-purple-500/30 text-[11px] font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-1"
                      >
                        <MicOff className="w-3 h-3 text-pink-400" /> Host Mute
                      </button>

                      <button
                        onClick={() => handleModerateSeat(selectedSeat.seatNumber, 'disable_video')}
                        disabled={actionLoading || !selectedSeat.isCameraOn}
                        data-action="disable-video"
                        className="py-2 px-2.5 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 border border-purple-500/30 text-[11px] font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-1"
                      >
                        <VideoOff className="w-3 h-3 text-pink-400" /> Disable Video
                      </button>
                    </div>

                    <button
                      onClick={() => handleVacateSeat(selectedSeat.seatNumber)}
                      disabled={actionLoading}
                      data-action="confirm-vacate-seat"
                      className="w-full py-2.5 px-3 rounded-xl bg-red-600/80 hover:bg-red-500 active:scale-98 text-white font-bold text-xs shadow-md shadow-red-600/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Vacate Participant from Seat #{selectedSeat.seatNumber}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                <button
                  onClick={() => handleRequestSeat(selectedSeat.seatNumber)}
                  disabled={actionLoading}
                  data-action="request-seat"
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 active:scale-98 text-white font-bold text-sm shadow-lg shadow-purple-600/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Request Seat #{selectedSeat.seatNumber}
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleOccupySeat(selectedSeat.seatNumber)}
                  disabled={actionLoading}
                  data-action="confirm-take-seat"
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Direct Join (Host/Demo)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODULE 5.6: Party Themes Drawer / Modal */}
      {isThemesOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center animate-fade-in"
          data-testid="themes-modal-overlay"
        >
          <div className="w-full max-w-md mx-auto max-h-[92vh] bg-[#0B081E] rounded-t-3xl sm:rounded-3xl border border-white/15 overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setIsThemesOpen(false)}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
              aria-label="Close Themes"
            >
              <X className="w-4 h-4" />
            </button>
            <PartyThemesScreen
              roomId={roomId}
              isHost={true}
              initialThemeId={activeTheme.id}
              isModal={true}
              onThemeApplied={(newTheme) => {
                setActiveTheme(newTheme);
                showToast(`Theme "${newTheme.name}" applied to party room!`);
              }}
              onClose={() => setIsThemesOpen(false)}
            />
          </div>
        </div>
      )}

      {/* MODULE 5.8: Room Controls & Closing Modal */}
      {isRoomControlsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center animate-fade-in"
          data-testid="room-controls-modal-overlay"
        >
          <div className="w-full max-w-md mx-auto max-h-[92vh] bg-[#0B081E] rounded-t-3xl sm:rounded-3xl border border-white/15 overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setIsRoomControlsOpen(false)}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
              aria-label="Close Room Controls"
            >
              <X className="w-4 h-4" />
            </button>
            <OrderAndClosingScreen
              roomId={roomId}
              isHost={true}
              isModal={true}
              initialSeats={seats}
              onSeatsUpdated={(updatedSeats) => {
                setSeats(updatedSeats);
                fetchRoomData();
              }}
              onPartyClosed={() => {
                setIsRoomControlsOpen(false);
                setIsPartyClosed(true);
              }}
              onClose={() => setIsRoomControlsOpen(false)}
            />
          </div>
        </div>
      )}

      {/* MODULE 5.8: Party Closed Modal Overlay for all Viewers */}
      {isPartyClosed && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in"
          data-testid="party-closed-overlay"
        >
          <div className="w-full max-w-sm rounded-3xl p-6 bg-[#160e32] border border-purple-500/30 text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <Sparkles className="w-7 h-7 text-purple-300" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1.5" data-testid="party-closed-heading">Party Ended</h3>
            <p className="text-xs text-zinc-300 mb-6 leading-relaxed">
              The host has ended this party session. All seats and audio channels are now closed.
            </p>
            <Link
              href="/party"
              data-testid="btn-closed-return-home"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-sm font-bold text-white shadow-lg block text-center transition-all"
            >
              Return to Discovery
            </Link>
          </div>
        </div>
      )}

      {/* MODULE 5.9: Room Limits & Protection Drawer / Modal */}
      {isLimitsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center animate-fade-in"
          data-testid="limits-modal-overlay"
        >
          <div className="w-full max-w-md mx-auto max-h-[92vh] bg-[#0B081E] rounded-t-3xl sm:rounded-3xl border border-white/15 overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setIsLimitsOpen(false)}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
              aria-label="Close Limits"
            >
              <X className="w-4 h-4" />
            </button>
            <RoomLimitsScreen
              roomId={roomId}
              isHost={true}
              isModal={true}
              onLimitsUpdated={() => {
                showToast('Room limits updated successfully!');
              }}
              onClose={() => setIsLimitsOpen(false)}
            />
          </div>
        </div>
      )}

      {/* MODULE 5.10: Party Rules Modal Drawer */}
      {isRulesOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center animate-fade-in"
          data-testid="rules-modal-overlay"
        >
          <div className="w-full max-w-md mx-auto max-h-[92vh] bg-[#0B081E] rounded-t-3xl sm:rounded-3xl border border-white/15 overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setIsRulesOpen(false)}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
              aria-label="Close Rules"
            >
              <X className="w-4 h-4" />
            </button>
            <PartyRulesScreen
              roomId={roomId}
              userId="host_maria_7001"
              userName={room?.hostNickname || 'Maria Live'}
              isHost={true}
              isModal={true}
              onClose={() => setIsRulesOpen(false)}
              onAccept={() => {
                showToast('Party rules accepted successfully!');
                setIsRulesOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* MODULE 6.1: PK Battle Types Modal Drawer */}
      {isPKBattleOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center animate-fade-in"
          data-testid="pk-modal-overlay"
        >
          <div className="w-full max-w-md mx-auto max-h-[92vh] bg-[#0c0822] rounded-t-3xl sm:rounded-3xl border border-pink-500/30 overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setIsPKBattleOpen(false)}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
              aria-label="Close PK"
            >
              <X className="w-4 h-4" />
            </button>
            {pkModalStep === 'types' ? (
              <PKBattleTypeScreen
                roomNumber={roomId}
                hostId={room?.hostNickname || 'host_maria_7001'}
                isModal={true}
                onClose={() => setIsPKBattleOpen(false)}
                onContinue={(battleType) => {
                  showToast(`1v1 PK Battle selected! Opening Host Invite & Matchmaking...`);
                  setPkModalStep('starting');
                }}
              />
            ) : (
              <PKStartingBattleScreen
                currentHostId="00000000-0000-0000-0000-000000088201"
                currentRoomNumber={roomId}
                currentHostNickname={room?.hostNickname || 'Host Maria'}
                onBack={() => setPkModalStep('types')}
                onBattleConfirmed={(battleId) => {
                  showToast('1v1 PK Battle confirmed! Connecting battle...');
                  setIsPKBattleOpen(false);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          data-testid="seat-grid-toast"
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-purple-950/90 border border-purple-400/50 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-150 flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
