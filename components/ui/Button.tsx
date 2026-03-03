import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  className = "", 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  icon: Icon,
  disabled,
  ...props 
}) => {
  const baseStyles = "font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 rounded-2xl disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200",
    secondary: "bg-slate-900 text-white hover:bg-slate-800 shadow-xl",
    outline: "bg-white text-slate-900 border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
  };

  const sizes = {
    sm: "text-[10px] px-4 py-2.5",
    md: "text-xs px-6 py-4",
    lg: "text-sm px-8 py-5"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin" size={size === 'lg' ? 20 : 16} /> : Icon && <Icon size={size === 'lg' ? 20 : 16} />}
      {children}
    </button>
  );
};
