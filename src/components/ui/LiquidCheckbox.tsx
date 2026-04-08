import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LiquidCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export const LiquidCheckbox: React.FC<LiquidCheckboxProps> = ({
  checked,
  onChange,
  label,
  className
}) => {
  return (
    <div className={cn("flex items-center gap-3 cursor-pointer group", className)} onClick={() => onChange(!checked)}>
      <div className="relative flex items-center justify-center w-6 h-6 rounded-md bg-[rgba(255,255,255,0.06)] border border-white/10 overflow-hidden transition-colors duration-300 group-hover:border-[#00E5FF]/50">
        <motion.div
          initial={false}
          animate={{
            scale: checked ? 1 : 0,
            opacity: checked ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="absolute inset-0 bg-gradient-to-br from-[#00E5FF] to-[#8A2BE2] flex items-center justify-center"
          style={{
            boxShadow: checked ? '0 0 10px rgba(0, 229, 255, 0.5)' : 'none'
          }}
        >
          <Check className="w-4 h-4 text-white" strokeWidth={3} />
        </motion.div>
      </div>
      {label && (
        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
          {label}
        </span>
      )}
    </div>
  );
};
