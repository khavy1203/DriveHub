import React, { createContext, useContext, useState } from 'react';

// Tạo type cho LoadingContext
interface LoadingContextProps {
  loading: boolean;
  setLoading: (state: boolean) => void;
}

// Tạo context
const LoadingContext = createContext<LoadingContextProps>({
  loading: false,
  setLoading: () => {},
});

// Tạo provider
export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

// Custom hook để sử dụng context
export const useLoading = () => {
  return useContext(LoadingContext);
};
