/**
 * Public layout component with header and footer
 * @module layouts/PublicLayout
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { isBuildLocal } from '../core/config/environment';

export const PublicLayout: React.FC = () => {
  const isLocal = isBuildLocal();

  return (
    <>
      {!isLocal && <Header />}
      <div className="main-content">
        <Outlet />
      </div>
      {!isLocal && <Footer />}
    </>
  );
};

export default PublicLayout;
