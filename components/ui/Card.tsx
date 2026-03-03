import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  animate?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = "", noPadding = false, animate = true }) => {
  return (
    <div className={`
      bg-white 
      rounded-[2.5rem] sm:rounded-[3rem] 
      shadow-2xl 
      border-4 border-white 
      ${noPadding ? '' : 'p-5 sm:p-10'} 
      ${animate ? 'animate-in fade-in zoom-in-95 duration-500' : ''} 
      ${className}
    `}>
      {children}
    </div>
  );
};

export const GlassCard: React.FC<CardProps> = ({ children, className = "", noPadding = false, animate = true }) => {
  return (
    <div className={`
      bg-white/80 backdrop-blur-xl 
      rounded-[2.5rem] 
      shadow-2xl 
      border border-white/50 
      ${noPadding ? '' : 'p-8'} 
      ${animate ? 'animate-in fade-in zoom-in-95 duration-500' : ''} 
      ${className}
    `}>
      {children}
    </div>
  );
};
