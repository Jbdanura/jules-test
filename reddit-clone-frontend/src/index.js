import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/css/main.css'; // Optional: if not already in App.js
import RootApp from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);
