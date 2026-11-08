'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

export interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select option',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative w-full text-left', className)} ref={dropdownRef}>
      {label && (
        <span className="block text-xs font-semibold uppercase tracking-wider text-popo-text-secondary mb-1.5">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-popo-dark-850 hover:bg-popo-dark-800 text-white text-sm rounded-xl px-4 py-2.5 border border-white/10 transition-all duration-150 focus:border-popo-pink focus:ring-2 focus:ring-popo-pink/20"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown
          className={cn('w-4 h-4 text-popo-text-muted transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="absolute z-40 mt-1.5 w-full bg-popo-dark-900 border border-white/10 rounded-2xl shadow-2xl p-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-colors text-left',
                  isSelected
                    ? 'bg-popo-pink/15 text-popo-pink font-semibold'
                    : 'text-popo-text-secondary hover:text-white hover:bg-white/5'
                )}
              >
                <div className="flex items-center gap-2.5">
                  {option.icon}
                  <span>{option.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-popo-pink shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
