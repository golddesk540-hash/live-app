import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';

export interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  categories?: string[];
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      className,
      value,
      onChange,
      onClear,
      placeholder = 'Search by ID, username, room tag...',
      categories,
      activeCategory,
      onSelectCategory,
      ...props
    },
    ref
  ) => {
    const [internalVal, setInternalVal] = useState(value || '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalVal(e.target.value);
      if (onChange) onChange(e);
    };

    const handleClear = () => {
      setInternalVal('');
      if (onClear) onClear();
    };

    return (
      <div className="w-full flex flex-col gap-2.5">
        <div className="relative flex items-center w-full">
          <Search className="absolute left-3.5 w-4 h-4 text-popo-text-muted pointer-events-none" />
          <input
            ref={ref}
            type="text"
            value={value !== undefined ? value : internalVal}
            onChange={handleChange}
            placeholder={placeholder}
            className={cn(
              'w-full bg-popo-dark-850 hover:bg-popo-dark-800 text-white placeholder:text-popo-text-muted text-sm rounded-full pl-10 pr-10 py-2.5 border border-white/10 outline-none transition-all duration-200 focus:border-popo-pink focus:ring-2 focus:ring-popo-pink/25 focus:bg-popo-dark-900',
              className
            )}
            {...props}
          />
          {(value || internalVal) && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3.5 p-1 text-popo-text-muted hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {categories && categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelectCategory && onSelectCategory(cat)}
                  className={cn(
                    'text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap transition-all duration-150',
                    isActive
                      ? 'bg-popo-pink text-white shadow-glow-pink'
                      : 'bg-popo-dark-850 text-popo-text-secondary hover:text-white hover:bg-popo-dark-800 border border-white/5'
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';
