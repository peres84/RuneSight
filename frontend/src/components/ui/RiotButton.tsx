import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface RiotButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function RiotButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  disabled = false 
}: RiotButtonProps) {
  const baseClasses = "relative font-bold uppercase tracking-wider transition-all duration-300 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-runesight-accent via-runesight-secondary to-runesight-accent text-white hover:from-runesight-accent/90 hover:via-runesight-secondary/90 hover:to-runesight-accent/90 shadow-lg hover:shadow-xl",
    secondary: "bg-gradient-to-r from-runesight-primary via-runesight-primary/80 to-runesight-primary text-white border border-runesight-accent/50 hover:from-runesight-primary/90 hover:via-runesight-primary/70 hover:to-runesight-primary/90 hover:border-runesight-accent/70",
    gold: "bg-gradient-to-r from-runesight-secondary via-runesight-accent to-runesight-secondary text-white hover:from-runesight-secondary/90 hover:via-runesight-accent/90 hover:to-runesight-secondary/90 shadow-lg hover:shadow-xl"
  };
  
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-8 py-3 text-base",
    lg: "px-12 py-4 text-lg"
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      whileHover={{ scale: disabled ? 1 : 1.05, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      style={{
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 12px 100%)'
      }}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center space-x-2">
        {children}
      </span>
      
      {/* Border accent */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 transition-colors duration-300" 
           style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 12px 100%)' }} />
    </motion.button>
  );
}