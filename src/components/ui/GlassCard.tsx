import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '../../lib/utils';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  glowColor?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  glowColor = 'rgba(0, 229, 255, 0.1)',
  intensity = 'medium',
  ...props
}) => {
  const getIntensityStyles = () => {
    switch (intensity) {
      case 'low':
        return 'bg-[rgba(255,255,255,0.03)] backdrop-blur-md border-white/5';
      case 'high':
        return 'bg-[rgba(255,255,255,0.1)] backdrop-blur-2xl border-white/20';
      case 'medium':
      default:
        return 'bg-[rgba(255,255,255,0.06)] backdrop-blur-xl border-white/10';
    }
  };

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-3xl border shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] group transition-all duration-500',
        getIntensityStyles(),
        className
      )}
      style={{
        boxShadow: `0 8px 32px 0 rgba(0,0,0,0.37), inset 0 0 20px ${glowColor}`,
      }}
      whileHover={{ y: -8 }}
      {...props}
    >
      {/* Subtle top reflection */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Liquid Shine Sweep */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shine_1.5s_ease-in-out] pointer-events-none z-0" style={{ transform: 'skewX(-25deg)' }} />

      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};
