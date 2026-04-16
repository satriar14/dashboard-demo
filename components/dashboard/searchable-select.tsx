"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  options: string[] | Option[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  width?: string;
}

export function SearchableSelect({ 
  options, 
  value, 
  onValueChange, 
  placeholder = "Pilih...", 
  disabled = false,
  className,
  width = "w-[180px]"
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to { label, value } array
  const normalizedOptions = useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'string') {
        return { label: opt, value: opt };
      }
      return opt;
    });
  }, [options]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return normalizedOptions;
    const lowerQuery = searchQuery.toLowerCase();
    return normalizedOptions.filter(opt => 
      opt.label.toLowerCase().includes(lowerQuery)
    );
  }, [normalizedOptions, searchQuery]);

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search when opening
  useEffect(() => {
    if (isOpen) setSearchQuery('');
  }, [isOpen]);

  return (
    <div className={cn("relative", width, className)} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full h-10 px-3 py-2 text-xs font-semibold bg-white border rounded-lg transition-all",
          "hover:bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50",
          isOpen && "border-indigo-500 ring-2 ring-indigo-500/20"
        )}
      >
        <span className="truncate uppercase">{selectedOption?.label || placeholder}</span>
        <ChevronDown size={14} className={cn("text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-[100] w-full min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <input
                  autoFocus
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-[11px] bg-white border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="max-h-[250px] overflow-y-auto overflow-x-hidden p-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onValueChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-2.5 py-2 text-[11px] font-medium transition-colors rounded-lg text-left uppercase",
                      value === opt.value 
                        ? "bg-indigo-50 text-indigo-700" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {value === opt.value && <Check size={12} className="text-indigo-600 shrink-0" />}
                  </button>
                ))
              ) : (
                <div className="px-3 py-6 text-center text-slate-400 text-[11px] italic">
                  Tidak ada hasil ditemukan.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
