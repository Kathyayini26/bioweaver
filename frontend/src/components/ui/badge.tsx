import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'gene' | 'disease';
  children: React.ReactNode;
}

export function Badge({ children, variant = 'primary', className = '', ...props }: BadgeProps) {
  const baseStyle = 'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none';

  const variants = {
    primary: 'border-teal-200/50 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800/30',
    secondary: 'border-transparent bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-800',
    outline: 'text-slate-900 dark:text-slate-200 border-slate-200 dark:border-slate-800',
    success: 'border-emerald-200/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/30',
    warning: 'border-amber-200/50 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30',
    danger: 'border-rose-200/50 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/30',
    gene: 'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-500/30',
    disease: 'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30'
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
export type BadgeVariant = keyof typeof Badge;
