import React from 'react';

export function Table({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto">
      <table className={`w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400 ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 ${className}`} {...props}>{children}</thead>;
}

export function TableBody({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`divide-y divide-slate-200/60 dark:divide-slate-800/60 ${className}`} {...props}>{children}</tbody>;
}

export function TableRow({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors ${className}`} {...props}>{children}</tr>;
}

export function TableHead({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`h-9 px-4 text-left align-middle font-medium text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`p-3 px-4 align-middle text-slate-700 dark:text-slate-300 text-xs font-normal border-t border-slate-100 dark:border-slate-800/45 ${className}`} {...props}>
      {children}
    </td>
  );
}
