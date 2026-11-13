'use client';

import React, { useEffect, useState } from 'react';
import { UserProfileRecord } from './userHostTypes';

interface EditUserModalProps {
  isOpen: boolean;
  user: UserProfileRecord | null;
  onClose: () => void;
  onSave: (updated: UserProfileRecord) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onSave,
}) => {
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [wealthLevel, setWealthLevel] = useState(1);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setNickname(user.nickname);
      setEmail(user.email);
      setCountry(user.country);
      setBio(user.bio);
      setWealthLevel(user.wealthLevel);
      setErrorNotice(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorNotice('Username cannot be empty.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorNotice('Please provide a valid email address.');
      return;
    }

    const updated: UserProfileRecord = {
      ...user,
      username: username.trim(),
      nickname: nickname.trim(),
      email: email.trim(),
      country: country.trim(),
      bio: bio.trim(),
      wealthLevel: Number(wealthLevel) || user.wealthLevel,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-[#160A2D] border border-purple-500/30 shadow-[0_0_50px_rgba(255,15,123,0.3)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0E061E]/90 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_10px_#FF0F7B]" />
            <div>
              <h3 className="text-base font-bold text-white">Edit Demo User Profile</h3>
              <p className="text-xs text-zinc-400">Update local state attributes for {user.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar">
          {errorNotice && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0E061E] border border-purple-500/25 text-white text-xs focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0E061E] border border-purple-500/25 text-white text-xs focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0E061E] border border-purple-500/25 text-white text-xs focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0E061E] border border-purple-500/25 text-white text-xs focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Wealth Level (1 - 50)</label>
            <input
              type="number"
              min={1}
              max={50}
              value={wealthLevel}
              onChange={(e) => setWealthLevel(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[#0E061E] border border-purple-500/25 text-white text-xs focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Bio Statement</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0E061E] border border-purple-500/25 text-white text-xs focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="px-6 py-4 bg-[#0E061E]/90 border-t border-purple-500/20 flex items-center justify-between -mx-6 -mb-6 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-semibold shadow-[0_0_15px_rgba(255,15,123,0.3)] transition-all"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
