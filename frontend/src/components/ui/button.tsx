import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const baseStyle =
    'inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

  const variants = {
    primary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm dark:bg-teal-600 dark:hover:bg-teal-700',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100',
    outline: 'border border-slate-200 hover:bg-slate-50 text-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-slate-100 bg-transparent',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 bg-transparent',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-5 text-base'
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
