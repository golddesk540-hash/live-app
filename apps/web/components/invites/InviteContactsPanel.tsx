'use client';

import React, { useMemo, useState } from 'react';
import { DemoInviteContact } from './types';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Check, Phone, SearchX, Send, Users, UserPlus } from 'lucide-react';

interface InviteContactsPanelProps {
  contacts: DemoInviteContact[];
  onInviteContacts: (selected: DemoInviteContact[]) => void;
  onRestoreDemoContacts: () => void;
}

export const InviteContactsPanel: React.FC<InviteContactsPanelProps> = ({
  contacts,
  onInviteContacts,
  onRestoreDemoContacts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.phoneNumber.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleContact = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const visibleIds = filteredContacts.map((c) => c.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleInviteSelected = () => {
    const picked = contacts.filter((c) => selectedSet.has(c.id));
    if (picked.length === 0) return;
    onInviteContacts(picked);
    setSelectedIds([]);
  };

  return (
    <div
      data-testid="invite-contacts-panel"
      className="rounded-3xl bg-[#16092D]/95 border border-purple-400/20 p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FF4D8D]" />
            <span>Demo Contacts</span>
          </h2>
          <p className="text-[11px] text-purple-200/65 mt-0.5">
            Local mock directory only — Popo Live does not read private device contacts without permission.
          </p>
        </div>

        {filteredContacts.length > 0 && (
          <button
            type="button"
            data-testid="contacts-select-all-btn"
            onClick={handleSelectAllFiltered}
            className="px-3 py-1 rounded-full bg-[#241046] hover:bg-[#311761] border border-white/10 text-[11px] font-bold text-purple-100"
          >
            {filteredContacts.every((c) => selectedSet.has(c.id))
              ? 'Deselect All'
              : `Select All (${filteredContacts.length})`}
          </button>
        )}
      </div>

      <SearchBar
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onClear={() => setSearchQuery('')}
        placeholder="Search contacts by name or phone..."
        data-testid="invite-contacts-search"
      />

      {contacts.length === 0 ? (
        <div
          data-testid="empty-invite-contacts"
          className="rounded-2xl bg-[#110523] border border-purple-400/15 p-4"
        >
          <EmptyState
            icon={<UserPlus className="w-7 h-7" />}
            title="No contacts available"
            description="Your demo contacts list is empty right now. Restore mock contacts to preview multi-select invitations."
            actionLabel="Restore Demo Contacts"
            onAction={onRestoreDemoContacts}
          />
        </div>
      ) : filteredContacts.length === 0 ? (
        <div
          data-testid="empty-invite-contacts-search"
          className="rounded-2xl bg-[#110523] border border-purple-400/15 p-4"
        >
          <EmptyState
            icon={<SearchX className="w-7 h-7" />}
            title="No search results"
            description={`No demo contact matched "${searchQuery}".`}
            actionLabel="Clear Search"
            onAction={() => setSearchQuery('')}
          />
        </div>
      ) : (
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5" data-testid="invite-contacts-list">
          {filteredContacts.map((contact) => {
            const isSelected = selectedSet.has(contact.id);
            return (
              <button
                key={contact.id}
                type="button"
                data-testid={`invite-contact-row-${contact.id}`}
                data-selected={isSelected ? 'true' : 'false'}
                onClick={() => toggleContact(contact.id)}
                className={`w-full text-left rounded-2xl p-3 border flex items-center justify-between gap-3 transition-all ${
                  isSelected
                    ? 'bg-[#28124F] border-[#FF1A6C]/65 shadow-sm'
                    : 'bg-[#110523]/90 border-purple-400/15 hover:border-purple-400/35'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr ${contact.avatarColor} flex items-center justify-center text-xs font-black text-white shrink-0 border-2 ${
                      isSelected ? 'border-[#FF4D8D]' : 'border-white/15'
                    }`}
                  >
                    {contact.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={contact.avatarUrl}
                        alt={contact.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{contact.initials}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                        {contact.name}
                      </span>
                      {contact.statusTag && (
                        <span className="px-1.5 py-0.5 rounded-full bg-white/5 text-[9px] font-semibold text-purple-200/75">
                          {contact.statusTag}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-purple-200/65 truncate flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-purple-300/60 shrink-0" />
                      <span>{contact.phoneNumber}</span>
                    </p>
                  </div>
                </div>

                <span
                  aria-hidden="true"
                  className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[#FF1A6C] border-[#FF1A6C] text-white'
                      : 'bg-[#1D0D39] border-purple-400/30 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {contacts.length > 0 && (
        <div className="pt-1 flex items-center justify-between gap-3 flex-wrap">
          <span data-testid="contacts-selected-count" className="text-xs font-bold text-purple-200/75">
            {selectedIds.length} contact{selectedIds.length === 1 ? '' : 's'} selected
          </span>

          <Button
            variant="primary"
            size="sm"
            disabled={selectedIds.length === 0}
            data-testid="invite-selected-contacts-btn"
            leftIcon={<Send className="w-3.5 h-3.5" />}
            onClick={handleInviteSelected}
          >
            Invite Selected ({selectedIds.length})
          </Button>
        </div>
      )}
    </div>
  );
};
