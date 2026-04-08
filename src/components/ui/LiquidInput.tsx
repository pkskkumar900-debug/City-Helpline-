import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface LiquidInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
  glowColor?: string;
}

export const LiquidInput = React.forwardRef<HTMLInputElement, LiquidInputProps>(
  ({ className, icon, error, type, glowColor = 'rgba(0, 229, 255, 0.5)', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="relative w-full group">
        <div className="relative">
          {icon && (
            <div className={cn(
              "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300",
              isFocused ? "text-[#00E5FF]" : "text-gray-500",
              error && "text-[#FF3B3B]"
            )}>
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            type={inputType}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={cn(
              "w-full bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-2xl py-3.5 text-white placeholder-gray-500 backdrop-blur-xl outline-none transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
              icon ? "pl-11" : "pl-4",
              isPassword ? "pr-12" : "pr-4",
              isFocused && "border-[#00E5FF]/50 bg-[rgba(255,255,255,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
              error && "border-[#FF3B3B]/50",
              className
            )}
            style={{
              boxShadow: isFocused ? `0 0 15px ${error ? 'rgba(255, 59, 59, 0.3)' : glowColor}` : 'none',
            }}
            {...props}
          />

          {/* Liquid Shine Animation on Focus */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]"
                  initial={{ x: '-150%' }}
                  animate={{ x: '150%' }}
                  transition={{ duration: 1, ease: 'easeInOut' }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-[#00E5FF] transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}
        </div>
        
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 text-sm text-[#FF3B3B] drop-shadow-[0_0_8px_rgba(255,59,59,0.5)]"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

LiquidInput.displayName = 'LiquidInput';
