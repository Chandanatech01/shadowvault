import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

// Clear localStorage and sessionStorage on startup of a fresh session, so no old login survives
if (!sessionStorage.getItem('sv_session_active')) {
  try {
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('sv_session_active', '1');
  } catch {}
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);