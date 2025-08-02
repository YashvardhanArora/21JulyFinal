import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface YearContextType {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
}

const YearContext = createContext<YearContextType | undefined>(undefined);

export function YearProvider({ children }: { children: ReactNode }) {
  const [selectedYear, setSelectedYear] = useState(() => {
    // Get initial value from localStorage or default to "2025"
    return localStorage.getItem('selectedYear') || '2025';
  });

  // Save to localStorage whenever selectedYear changes
  useEffect(() => {
    localStorage.setItem('selectedYear', selectedYear);
  }, [selectedYear]);

  return (
    <YearContext.Provider value={{ selectedYear, setSelectedYear }}>
      {children}
    </YearContext.Provider>
  );
}

export function useYear() {
  const context = useContext(YearContext);
  if (context === undefined) {
    throw new Error('useYear must be used within a YearProvider');
  }
  return context;
}