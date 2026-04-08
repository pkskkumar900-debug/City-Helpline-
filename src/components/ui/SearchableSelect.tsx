import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Option {
  value: string;
  label: string;
  group?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: React.ReactNode;
}

export function SearchableSelect({ options, value, onChange, placeholder, icon }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.group && option.group.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group options
  const groupedOptions = filteredOptions.reduce((acc, option) => {
    const group = option.group || 'Ungrouped';
    if (!acc[group]) acc[group] = [];
    acc[group].push(option);
    return acc;
  }, {} as Record<string, Option[]>);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative h-full" ref={dropdownRef}>
      <div 
        className="w-full h-full pl-12 pr-10 py-4 bg-transparent text-white cursor-pointer flex items-center justify-between transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00E5FF] transition-colors">
          {icon}
        </div>
        <span className={`truncate ${!selectedOption ? 'text-gray-500' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-[rgba(13,13,13,0.95)] backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="p-3 border-b border-white/10 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2.5 bg-[rgba(255,255,255,0.06)] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]/50 transition-colors text-sm"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
              <div 
                className={`px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between text-sm transition-colors ${value === '' ? 'bg-[#00E5FF]/10 text-[#00E5FF]' : 'text-gray-300 hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                <span>{placeholder}</span>
                {value === '' && <Check className="h-4 w-4" />}
              </div>

              {Object.entries(groupedOptions).map(([group, opts]) => (
                <div key={group} className="mt-2">
                  {group !== 'Ungrouped' && (
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {group}
                    </div>
                  )}
                  {opts.map(option => (
                    <div
                      key={option.value}
                      className={`px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between text-sm mt-1 transition-colors ${value === option.value ? 'bg-[#00E5FF]/10 text-[#00E5FF]' : 'text-gray-300 hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                    >
                      <span>{option.label}</span>
                      {value === option.value && <Check className="h-4 w-4" />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
