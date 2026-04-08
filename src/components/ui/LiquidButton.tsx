import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  glowColor?: string;
  children: React.ReactNode;
  isLoading?: boolean;
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({
  variant = 'primary',
  glowColor,
  children,
  className,
  isLoading,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-[#00E5FF]/20 to-[#8A2BE2]/20 border-[#00E5FF]/50 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]';
      case 'secondary':
        return 'bg-[rgba(255,255,255,0.05)] border-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]';
      case 'danger':
        return 'bg-[#FF3B3B]/20 border-[#FF3B3B]/50 text-[#FF3B3B] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]';
      case 'ghost':
        return 'bg-transparent border-transparent text-gray-300 hover:text-white';
      default:
        return 'bg-[rgba(255,255,255,0.05)] border-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]';
    }
  };

  const defaultGlow = variant === 'primary' ? 'rgba(0, 229, 255, 0.5)' : 
                      variant === 'danger' ? 'rgba(255, 59, 59, 0.5)' : 
                      'rgba(255, 255, 255, 0.2)';
  
  const activeGlowColor = glowColor || defaultGlow;

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative overflow-hidden rounded-[40px] px-6 py-3 font-medium backdrop-blur-md border transition-all duration-300 ease-out',
        getVariantStyles(),
        className
      )}
      style={{
        boxShadow: isHovered ? `0 0 20px ${activeGlowColor}, inset 0 0 10px ${activeGlowColor}` : 'none',
      }}
      {...props}
    >
      {/* Liquid Shine Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[40px]">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
          initial={{ x: '-150%' }}
          animate={isHovered ? { x: '150%' } : { x: '-150%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      </div>

      {/* Dynamic Lighting / Ripple */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 2 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute z-0 pointer-events-none rounded-full"
            style={{
              left: mousePos.x,
              top: mousePos.y,
              width: '100px',
              height: '100px',
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${activeGlowColor} 0%, transparent 70%)`,
              mixBlendMode: 'screen',
            }}
          />
        )}
      </AnimatePresence>

      <span className="relative z-10 flex items-center justify-center gap-2">
        {isLoading ? (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : children}
      </span>
    </motion.button>
  );
};
