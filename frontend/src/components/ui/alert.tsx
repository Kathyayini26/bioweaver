import React from 'react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}

export function Alert({ children, variant = 'info', className = '', ...props }: AlertProps) {
  const styles = {
    info: 'bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800',
    success: 'bg-emerald-50/50 text-emerald-800 border-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50',
    warning: 'bg-amber-50/50 text-amber-800 border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50',
    danger: 'bg-rose-50/50 text-rose-800 border-rose-200/60 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50'
  };

  return (
    <div
      className={`p-4 border rounded-md text-sm flex flex-col gap-1.5 ${styles[variant]} ${className}`}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ children, className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5 className={`font-semibold tracking-tight text-slate-900 dark:text-slate-200 leading-none ${className}`} {...props}>
      {children}
    </h5>
  );
}

export function AlertDescription({ children, className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div className={`text-xs leading-relaxed text-slate-600 dark:text-slate-400 ${className}`} {...props}>
      {children}
    </div>
  );
}
