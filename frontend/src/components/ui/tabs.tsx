import React, { createContext, useContext, useState } from 'react';

interface TabsContextProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextProps | undefined>(undefined);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export function Tabs({ defaultValue, value, onValueChange, children, className = '', ...props }: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultValue || '');
  const activeTab = value !== undefined ? value : internalTab;
  const setActiveTab = (val: string) => {
    if (onValueChange) {
      onValueChange(val);
    }
    setInternalTab(val);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`w-full ${className}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({ children, className = '', ...props }: TabsListProps) {
  return (
    <div
      className={`inline-flex h-9 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ value, children, className = '', ...props }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  const isActive = context.activeTab === value;

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-semibold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${
        isActive
          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
          : 'hover:text-slate-900 dark:hover:text-slate-200 bg-transparent'
      } ${className}`}
      onClick={() => context.setActiveTab(value)}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, children, className = '', ...props }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');
  const isActive = context.activeTab === value;

  if (!isActive) return null;
  return (
    <div className={`mt-3 focus-visible:outline-none ${className}`} {...props}>
      {children}
    </div>
  );
}
