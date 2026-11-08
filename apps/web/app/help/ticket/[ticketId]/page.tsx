'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  Ticket,
  Clock,
  Send,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  X,
  ShieldCheck,
  User,
  Headphones,
  Lock,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';

interface TicketData {
  id: string;
  ticket_number: string;
  user_id: string | null;
  full_name: string;
  email: string;
  poppo_id: string | null;
  category: string;
  subject: string;
  description: string;
  attachment_url: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface ReplyItem {
  id: string;
  sender_id: string | null;
  sender_type: 'user' | 'support';
  sender_name: string;
  message: string;
  attachment_url: string | null;
  created_at: string;
}

const STATUS_BADGES: Record<string, { label_en: string; label_ur: string; color: string; bg: string }> = {
  open: { label_en: 'Open', label_ur: 'اوپن', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  in_progress: { label_en: 'In Progress', label_ur: 'زیر غور', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  waiting_for_user: { label_en: 'Waiting for User', label_ur: 'صارف کے جواب کا انتظار', color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30' },
  resolved: { label_en: 'Resolved', label_ur: 'حل شدہ', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30' },
  closed: { label_en: 'Closed', label_ur: 'بند', color: 'text-gray-400', bg: 'bg-white/10 border-white/15' },
};

function TicketDetailContent() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.ticketId as string;
  const { isUr } = useLanguage();

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [replies, setReplies] = useState<ReplyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reply form state
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachmentUrl, setReplyAttachmentUrl] = useState('');
  const [replyAttachmentName, setReplyAttachmentName] = useState<string | null>(null);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyUploadProgress, setReplyUploadProgress] = useState<number | null>(null);

  // Closing ticket state
  const [isClosing, setIsClosing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/help/tickets/${ticketId}`);
      if (res.status === 401) {
        router.push(`/login?redirect=/help/ticket/${ticketId}`);
        return;
      }
      if (res.status === 403) {
        setErrorMsg(isUr ? 'آپ کو اس ٹکٹ تک رسائی کی اجازت نہیں ہے۔' : 'You do not have permission to view this ticket.');
        return;
      }
      if (res.status === 404) {
        setErrorMsg(isUr ? 'سپورٹ ٹکٹ نہیں مل سکی۔' : 'Support ticket not found.');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setTicket(data.ticket);
        setReplies(data.replies || []);
      } else {
        setErrorMsg(data.error || 'Failed to load ticket.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to support system.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      loadTicketData();
    }
  }, [ticketId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(isUr ? 'فائل کا سائز 5MB سے کم ہونا چاہیے۔' : 'File size must be under 5MB.');
      return;
    }

    try {
      setReplyUploadProgress(30);
      const fd = new FormData();
      fd.append('file', file);
      setReplyUploadProgress(70);

      const res = await fetch('/api/help/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setReplyUploadProgress(100);
      setReplyAttachmentUrl(data.url);
      setReplyAttachmentName(file.name);
      setTimeout(() => setReplyUploadProgress(null), 1000);
    } catch (err: any) {
      setReplyUploadProgress(null);
      alert(err.message || 'Failed to upload attachment.');
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setIsSubmittingReply(true);
    try {
      const res = await fetch(`/api/help/tickets/${ticketId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyMessage,
          attachmentUrl: replyAttachmentUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit reply');
      }

      // Append new reply
      setReplies((prev) => [...prev, data.reply]);
      setReplyMessage('');
      setReplyAttachmentUrl('');
      setReplyAttachmentName(null);
      if (ticket) {
        setTicket({ ...ticket, status: 'open' });
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting reply.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleCloseTicket = async () => {
    setIsClosing(true);
    try {
      const res = await fetch(`/api/help/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCloseConfirm(false);
        if (ticket) setTicket({ ...ticket, status: 'closed' });
        loadTicketData();
      } else {
        alert(data.error || 'Failed to close ticket.');
      }
    } catch (err) {
      alert('Error updating ticket.');
    } finally {
      setIsClosing(false);
    }
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString(isUr ? 'ur-PK' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isClosed = ticket?.status === 'closed';
  const badge = ticket ? STATUS_BADGES[ticket.status] || STATUS_BADGES.open : STATUS_BADGES.open;

  return (
    <main
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#070514] text-white selection:bg-[#ff2d55] selection:text-white pb-20 ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#b81dff]/20 via-[#ff2d55]/15 to-transparent blur-3xl opacity-75" />
      </div>

      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#070514]/90 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/help/my-tickets')}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors text-white"
            aria-label="Back to Tickets"
          >
            <ArrowLeft className={`w-5 h-5 ${isUr ? 'rotate-180' : ''}`} />
          </button>

          <div className="text-center">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
              {ticket?.ticket_number || (isUr ? 'سپورٹ ٹکٹ' : 'Support Ticket')}
            </h1>
            <p className="text-[10px] text-white/50">{ticket?.category?.replace('_', ' ')}</p>
          </div>

          {!isClosed && ticket && (
            <button
              type="button"
              onClick={() => setShowCloseConfirm(true)}
              className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
            >
              {isUr ? 'بند کریں' : 'Close Ticket'}
            </button>
          )}
          {isClosed && <div className="w-9" />}
        </div>
      </header>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-4 sm:pt-6 space-y-4">

        {loading ? (
          <div className="py-20 text-center text-white/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-500" />
            <p className="text-xs">{isUr ? 'ٹکٹ کی تفصیلات لوڈ ہو رہی ہیں...' : 'Loading ticket details...'}</p>
          </div>
        ) : errorMsg ? (
          <div className="p-8 rounded-3xl bg-[#140f2b] border border-white/10 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <p className="text-sm font-semibold text-white/90">{errorMsg}</p>
            <Link
              href="/help/my-tickets"
              className="inline-block mt-2 px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
            >
              {isUr ? 'میری ٹکٹس پر واپس جائیں' : 'Back to My Tickets'}
            </Link>
          </div>
        ) : ticket ? (
          <>
            {/* TICKET HEADER SUMMARY CARD */}
            <div className="p-5 rounded-3xl bg-[#140f2b] border border-white/10 shadow-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold text-pink-400">
                    {ticket.ticket_number}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {ticket.subject}
                  </h2>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide shrink-0 ${badge.bg} ${badge.color}`}>
                  {isUr ? badge.label_ur : badge.label_en}
                </span>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between flex-wrap gap-2 text-xs text-white/60">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDate(ticket.created_at)}</span>
                </span>
                {ticket.poppo_id && (
                  <span className="font-mono text-[11px] bg-white/5 px-2 py-0.5 rounded text-white/80">
                    User ID: {ticket.poppo_id}
                  </span>
                )}
              </div>
            </div>

            {/* CONVERSATION THREAD */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider px-1">
                {isUr ? 'گفتگو کی تاریخ' : 'Conversation Thread'}
              </h3>

              {replies.map((reply, idx) => {
                const isSupport = reply.sender_type === 'support';

                return (
                  <div
                    key={reply.id || idx}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isSupport
                        ? 'bg-gradient-to-br from-[#1d1645] to-[#140e33] border-purple-500/40 shadow-lg shadow-purple-950/40'
                        : 'bg-[#140f2b] border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                            isSupport
                              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                              : 'bg-white/10 text-white/80'
                          }`}
                        >
                          {isSupport ? <Headphones className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            {reply.sender_name}
                            {isSupport && (
                              <span className="px-1.5 py-0.2 rounded bg-pink-500/20 border border-pink-500/30 text-[9px] text-pink-300 font-semibold uppercase">
                                Staff
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] text-white/40">
                        {formatDate(reply.created_at)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                      {reply.message}
                    </p>

                    {/* Attachment preview */}
                    {reply.attachment_url && (
                      <div className="mt-3 pt-2 border-t border-white/10">
                        {reply.attachment_url.match(/\.(jpeg|jpg|png|webp)$/i) ? (
                          <a
                            href={reply.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block max-w-xs rounded-xl overflow-hidden border border-white/10 hover:border-pink-500/50 transition-colors"
                          >
                            <img
                              src={reply.attachment_url}
                              alt="Attachment"
                              className="w-full h-auto object-cover max-h-48"
                            />
                          </a>
                        ) : (
                          <a
                            href={reply.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 font-medium"
                          >
                            <FileText className="w-4 h-4" />
                            <span>{isUr ? 'منسلک فائل کھولیں' : 'View Attachment Document'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CLOSED TICKET BANNER */}
            {isClosed ? (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-gray-400 mx-auto" />
                <p className="text-xs font-semibold text-white/80">
                  {isUr
                    ? 'یہ سپورٹ ٹکٹ بند کر دی گئی ہے اور اب مزید پیغامات قبول نہیں کر رہی۔'
                    : 'This support ticket has been closed and cannot receive further replies.'}
                </p>
                <Link
                  href="/help/contact"
                  className="inline-block text-xs font-bold text-pink-400 hover:text-pink-300"
                >
                  {isUr ? 'نیا سوال؟ نئی سپورٹ ٹکٹ درج کریں →' : 'Have a new question? Open a new ticket →'}
                </Link>
              </div>
            ) : (
              /* REPLY FORM */
              <form onSubmit={handleSendReply} className="p-4 sm:p-5 rounded-3xl bg-[#140f2b] border border-white/10 shadow-xl space-y-3">
                <h4 className="text-xs font-bold text-white/80">
                  {isUr ? 'جواب لکھیں' : 'Send a Reply'}
                </h4>

                <textarea
                  rows={3}
                  required
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder={
                    isUr
                      ? 'سپورٹ ٹیم کو اپنا پیغام یا اضافی معلومات لکھیں...'
                      : 'Type your message or provide additional details...'
                  }
                  className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/15 focus:border-pink-500 focus:outline-none text-xs sm:text-sm text-white placeholder:text-white/30 resize-y"
                />

                {/* Optional attachment upload */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {replyAttachmentUrl ? (
                    <div className="p-2.5 rounded-xl bg-white/5 border border-pink-500/30 flex items-center justify-between text-xs">
                      <span className="text-white/80 truncate max-w-[200px]">
                        {replyAttachmentName || 'Attachment added'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyAttachmentUrl('');
                          setReplyAttachmentName(null);
                        }}
                        className="text-white/40 hover:text-rose-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-white/60 hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-pink-400" />
                      <span>{isUr ? 'اسکرین شاٹ شامل کریں' : 'Attach Screenshot (Optional)'}</span>
                    </button>
                  )}

                  {replyUploadProgress !== null && (
                    <div className="mt-1 w-full bg-white/10 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-pink-500 h-1 transition-all"
                        style={{ width: `${replyUploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingReply || !replyMessage.trim()}
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-xs font-bold text-white shadow-md shadow-pink-600/30 transition-all flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {isSubmittingReply ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{isUr ? 'بھیجا جا رہا ہے...' : 'Sending...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{isUr ? 'جواب بھیجیں' : 'Send Reply'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* CLOSE CONFIRMATION MODAL */}
            {showCloseConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
                <div className="relative w-full max-w-sm rounded-3xl bg-[#181135] border border-white/15 p-6 shadow-2xl text-center space-y-3">
                  <h3 className="text-sm font-bold text-white">
                    {isUr ? 'کیا آپ اس ٹکٹ کو بند کرنا چاہتے ہیں؟' : 'Close This Support Ticket?'}
                  </h3>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {isUr
                      ? 'بند کرنے کے بعد اس ٹکٹ میں مزید پیغامات شامل نہیں کیے جا سکیں گے۔'
                      : 'Once closed, this ticket will be marked as resolved and cannot receive further messages.'}
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCloseConfirm(false)}
                      className="w-1/2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
                    >
                      {isUr ? 'منسوخ' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      disabled={isClosing}
                      onClick={handleCloseTicket}
                      className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
                    >
                      {isClosing ? (isUr ? 'بند ہو رہا ہے...' : 'Closing...') : (isUr ? 'ٹکٹ بند کریں' : 'Confirm Close')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : null}

      </div>
    </main>
  );
}

export default function TicketDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      }
    >
      <TicketDetailContent />
    </Suspense>
  );
}
