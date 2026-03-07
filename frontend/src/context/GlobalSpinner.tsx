import React from 'react';
import './GlobalSpinner.css';
import { useLoading } from './LoadingContext'; // Import LoadingContext

const GlobalSpinner: React.FC = () => {
  const { loading, setLoading } = useLoading();
  console.log('check loading', loading)
  
  if (!loading) return null; // Chỉ hiển thị spinner khi loading là true

  return (
    <div className="global-spinner-container">
      <div className="spinner"></div>
    </div>
  );
};

export default GlobalSpinner;
