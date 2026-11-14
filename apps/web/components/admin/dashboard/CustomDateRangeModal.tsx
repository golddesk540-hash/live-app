'use client';

import React, { useState } from 'react';
import { Calendar, X, Check, Clock, AlertCircle } from 'lucide-react';

interface CustomDateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (start: string, end: string) => void;
  initialStart?: string;
  initialEnd?: string;
}

export const CustomDateRangeModal: React.FC<CustomDateRangeModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialStart = '2026-11-01',
  initialEnd = '2026-11-14'
}) => {
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApply = () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }

    setError(null);
    onApply(startDate, endDate);
    onClose();
  };

  const handlePreset = (daysBack: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysBack);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#130728] border border-purple-800/60 rounded-2xl p-6 shadow-2xl space-y-5 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Select Custom Date Range</h3>
              <p className="text-xs text-purple-300/60">Filter executive metrics across custom timeframe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-purple-300">Quick Presets</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Past 7 Days', days: 7 },
              { label: 'Past 14 Days', days: 14 },
              { label: 'Past 30 Days', days: 30 }
            ].map(p => (
              <button
                key={p.days}
                type="button"
                onClick={() => handlePreset(p.days)}
                className="px-2.5 py-1.5 rounded-lg bg-purple-950/60 border border-purple-900/40 hover:border-pink-500/40 text-xs text-purple-200 hover:text-white transition-all text-center"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-purple-300">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-black/40 border border-purple-900/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-purple-300">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-black/40 border border-purple-900/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-900/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-purple-300 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg shadow-pink-500/25 flex items-center gap-1.5 transition-all"
          >
            <Check className="w-4 h-4" /> Apply Date Range
          </button>
        </div>
      </div>
    </div>
  );
};
