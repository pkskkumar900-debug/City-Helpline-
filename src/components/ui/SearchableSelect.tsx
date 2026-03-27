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
    <div className="relative" ref={dropdownRef}>
      <div 
        className="w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white cursor-pointer flex items-center justify-between hover:bg-gray-800/80 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
        <span className={`truncate ${!selectedOption ? 'text-gray-400' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-2 border-b border-gray-700 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-8 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
              <div 
                className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between text-sm ${value === '' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-gray-700'}`}
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
                      className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between text-sm mt-1 ${value === option.value ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-gray-700'}`}
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
