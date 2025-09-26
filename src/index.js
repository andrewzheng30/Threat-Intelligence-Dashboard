// Import core React libraries
import React from 'react';
import ReactDOM from 'react-dom/client';

// Import global styles and main App component
import './index.css';
import App from './App';

// ===== Root Setup =====
// Find the root DOM element in index.html
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the React application
// - React.StrictMode helps catch issues in development
// - <App /> is the main component of your dashboard
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
