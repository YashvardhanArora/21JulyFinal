import { createContext, useContext, useState, ReactNode } from 'react';

interface AsmSidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const AsmSidebarContext = createContext<AsmSidebarContextType | undefined>(undefined);

interface AsmSidebarProviderProps {
  children: ReactNode;
}

export function AsmSidebarProvider({ children }: AsmSidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <AsmSidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </AsmSidebarContext.Provider>
  );
}

export function useAsmSidebarContext() {
  const context = useContext(AsmSidebarContext);
  if (context === undefined) {
    throw new Error('useAsmSidebarContext must be used within an AsmSidebarProvider');
  }
  return context;
}