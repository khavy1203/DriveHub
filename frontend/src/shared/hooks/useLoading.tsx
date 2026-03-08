/**
 * Loading state context and hook
 * @module shared/hooks/useLoading
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextProps {
  loading: boolean;
  setLoading: (state: boolean) => void;
}

const LoadingContext = createContext<LoadingContextProps>({
  loading: false,
  setLoading: () => {},
});

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  
  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextProps => {
  return useContext(LoadingContext);
};
