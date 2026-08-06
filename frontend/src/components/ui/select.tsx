import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>;
}

export function Select({ options, className = '', ...props }: SelectProps) {
  return (
    <select
      className={`flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 cursor-pointer ${className}`}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200">
          {opt.label}
        </option>
      ))}
    </select>
  );
}
