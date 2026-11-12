'use client';

import React, { useState, useMemo } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBar } from '@/components/ui/SearchBar';
import { InboxAvatar } from './InboxAvatar';
import { InboxUserProfile } from './types';
import { MessageCircle, Users, Sparkles, UserCheck } from 'lucide-react';

interface ContactsTabPanelProps {
  contacts: InboxUserProfile[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onMessageContact: (user: InboxUserProfile) => void;
  onPreviewProfile: (user: InboxUserProfile) => void;
  onRestoreDemo?: () => void;
}

export const ContactsTabPanel: React.FC<ContactsTabPanelProps> = ({
  contacts,
  searchQuery,
  onSearchChange,
  onMessageContact,
  onPreviewProfile,
  onRestoreDemo,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'online'>('all');

  const onlineCount = useMemo(
    () => contacts.filter((c) => c.status === 'online' || c.status === 'live').length,
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return contacts.filter((c) => {
      if (filterMode === 'online' && c.status === 'offline') return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.poppoId.toLowerCase().includes(q) ||
        c.roleTag.toLowerCase().includes(q)
      );
    });
  }, [contacts, filterMode, searchQuery]);

  return (
    <div className="flex flex-col gap-3">
      {/* Contacts Search + Online Toggle */}
      <div className="space-y-2.5">
        <SearchBar
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange('')}
          placeholder="Search contacts by name, handle or ID..."
          className="bg-[#180C32] border-purple-400/20 text-xs py-2"
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-[#FF1A6C] text-white shadow-glow-pink'
                  : 'bg-[#1D0F39] text-purple-200/70 hover:text-white border border-white/10'
              }`}
            >
              All ({contacts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('online')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                filterMode === 'online'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'bg-[#1D0F39] text-purple-200/70 hover:text-white border border-white/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              Online ({onlineCount})
            </button>
          </div>
          <span className="text-[11px] text-purple-200/50 font-medium">Tap profile or Message</span>
        </div>
      </div>

      {/* Contacts List or Empty States */}
      {contacts.length === 0 ? (
        <EmptyState
          icon={<Users className="w-7 h-7" />}
          title="No Contacts Yet"
          description="Follow hosts or accept incoming requests to build your Popo Live contact circle."
          actionLabel={onRestoreDemo ? 'Load Sample Contacts' : undefined}
          onAction={onRestoreDemo}
          className="bg-[#160B2C]/80 border-purple-400/15 py-8"
        />
      ) : filteredContacts.length === 0 ? (
        <EmptyState
          icon={<UserCheck className="w-7 h-7" />}
          title={searchQuery.trim() ? 'No matching contacts' : 'No contacts online right now'}
          description={
            searchQuery.trim()
              ? `No contacts matched "${searchQuery}". Try another name or Popo ID.`
              : 'All saved hosts are currently offline. Switch to All Contacts to start a chat.'
          }
          actionLabel={searchQuery.trim() ? 'Clear Search' : 'Show All Contacts'}
          onAction={() => {
            if (searchQuery.trim()) onSearchChange('');
            else setFilterMode('all');
          }}
          className="bg-[#160B2C]/80 border-purple-400/15 py-8"
        />
      ) : (
        <div className="divide-y divide-purple-300/10">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              data-testid={`contact-row-${contact.id}`}
              className="flex items-center justify-between gap-3 py-3 px-2 rounded-2xl hover:bg-[#1D0F39]/75 transition-colors"
            >
              <div
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                onClick={() => onPreviewProfile(contact)}
              >
                <InboxAvatar user={contact} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white truncate">{contact.name}</span>
                    <span className="text-xs">{contact.countryFlag}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-purple-200/65 mt-0.5 truncate">
                    <span className="text-[#FF4D8D] font-semibold inline-flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      {contact.roleTag}
                    </span>
                    <span>•</span>
                    <span
                      className={
                        contact.status === 'online'
                          ? 'text-emerald-400 font-medium'
                          : contact.status === 'live'
                          ? 'text-[#FF4D8D] font-medium'
                          : 'text-purple-200/50'
                      }
                    >
                      {contact.lastSeenText}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onPreviewProfile(contact)}
                  className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-[#1E103B] hover:bg-[#291752] text-purple-100 border border-white/10 transition-colors hidden sm:inline-flex"
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => onMessageContact(contact)}
                  data-testid={`contact-msg-${contact.id}`}
                  className="px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] text-white shadow-glow-pink hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Message</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
