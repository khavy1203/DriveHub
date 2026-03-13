// index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './assets/fonts/font-awesome-4.7.0/css/font-awesome.min.css';

// Sử dụng React 18 createRoot API
const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(container);
root.render(
  <App />
);
