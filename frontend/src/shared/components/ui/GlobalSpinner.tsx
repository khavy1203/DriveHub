/**
 * Global loading spinner component
 * @module shared/components/ui/GlobalSpinner
 */

import React from 'react';
import { useLoading } from '../../hooks/useLoading';
import './GlobalSpinner.scss';

export const GlobalSpinner: React.FC = () => {
  const { loading } = useLoading();

  if (!loading) return null;

  return (
    <div className="global-spinner-container">
      <div className="spinner" />
    </div>
  );
};

export default GlobalSpinner;
