'use client';

import React, { useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { InboxAvatar } from './InboxAvatar';
import { InboxMessageRequest, InboxUserProfile } from './types';
import { Check, Trash2, MoreVertical, Ban, Flag, MailQuestion } from 'lucide-react';

interface RequestsTabPanelProps {
  requests: InboxMessageRequest[];
  onAcceptRequest: (reqId: string) => void;
  onDeleteRequest: (reqId: string) => void;
  onPreviewProfile: (user: InboxUserProfile) => void;
  onOpenSafetyAction: (user: InboxUserProfile, mode: 'block' | 'report') => void;
  onRestoreDemo?: () => void;
}

export const RequestsTabPanel: React.FC<RequestsTabPanelProps> = ({
  requests,
  onAcceptRequest,
  onDeleteRequest,
  onPreviewProfile,
  onOpenSafetyAction,
  onRestoreDemo,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={<MailQuestion className="w-7 h-7" />}
        title="No Message Requests"
        description="New message requests from hosts and viewers outside your contacts list will appear here."
        actionLabel={onRestoreDemo ? 'Restore Demo Requests' : undefined}
        onAction={onRestoreDemo}
        className="bg-[#160B2C]/80 border-purple-400/15 py-10 mt-2"
      />
    );
  }

  return (
    <div className="space-y-2.5">
      <p className="text-[11px] text-purple-200/60 px-1">
        Accept a request to move the chat to your main Chats tab, or delete/block unwanted senders.
      </p>

      <div className="space-y-2.5">
        {requests.map((req) => {
          const menuOpen = openMenuId === req.id;
          return (
            <div
              key={req.id}
              data-testid={`request-card-${req.id}`}
              className="relative rounded-2xl bg-[#180B33]/95 border border-purple-400/20 p-3.5 transition-all hover:border-[#FF1A6C]/40"
            >
              <div className="flex items-start gap-3">
                <InboxAvatar
                  user={req.user}
                  size="md"
                  onClick={() => onPreviewProfile(req.user)}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onPreviewProfile(req.user)}
                      className="text-left min-w-0 flex items-center gap-1.5 group"
                    >
                      <span className="text-sm font-extrabold text-white group-hover:text-[#FF4D8D] transition-colors truncate">
                        {req.user.name}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-purple-200/75 font-semibold shrink-0">
                        Lv.{req.user.level}
                      </span>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] text-purple-200/55">{req.receivedAt}</span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(menuOpen ? null : req.id)}
                          aria-label={`Safety options for ${req.user.name}`}
                          className="p-1.5 rounded-full text-purple-200/70 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {menuOpen && (
                          <div className="absolute right-0 mt-1 w-44 rounded-2xl bg-[#110624] border border-purple-400/25 shadow-2xl p-1.5 z-30">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onPreviewProfile(req.user);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10"
                            >
                              View Sender Profile
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onOpenSafetyAction(req.user, 'block');
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/15 flex items-center gap-2"
                            >
                              <Ban className="w-3.5 h-3.5" /> Block Sender
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onOpenSafetyAction(req.user, 'report');
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/15 flex items-center gap-2"
                            >
                              <Flag className="w-3.5 h-3.5" /> Report Request
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-purple-100/80 mt-1.5 leading-relaxed line-clamp-2 bg-[#110624]/70 rounded-xl px-3 py-2 border border-white/5">
                    {req.previewMessage}
                  </p>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onAcceptRequest(req.id)}
                      data-testid={`accept-request-${req.id}`}
                      className="flex-1 min-w-[100px] py-1.5 px-3 rounded-full text-xs font-bold bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] text-white shadow-glow-pink hover:brightness-110 active:scale-95 transition-all inline-flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRequest(req.id)}
                      data-testid={`delete-request-${req.id}`}
                      className="flex-1 min-w-[90px] py-1.5 px-3 rounded-full text-xs font-bold bg-[#231247] hover:bg-red-500/20 text-purple-100 hover:text-red-200 border border-white/10 hover:border-red-400/30 active:scale-95 transition-all inline-flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
