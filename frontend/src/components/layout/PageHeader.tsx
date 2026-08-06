import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
      <div>
        <h1 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider leading-none">
          {title}
        </h1>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-normal">
          {description}
        </p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
