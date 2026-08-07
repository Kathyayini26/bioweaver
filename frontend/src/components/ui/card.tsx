import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm p-5 transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }: CardProps) {
  return <div className={`flex flex-col space-y-1.5 pb-3 ${className}`} {...props}>{children}</div>;
}

export function CardTitle({ children, className = '', ...props }: CardProps) {
  return (
    <h3 className={`text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50 transition-colors duration-300 ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }: CardProps) {
  return (
    <p className={`text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }: CardProps) {
  return <div className={`pt-2 ${className}`} {...props}>{children}</div>;
}

export function CardFooter({ children, className = '', ...props }: CardProps) {
  return <div className={`flex items-center pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 ${className}`} {...props}>{children}</div>;
}
