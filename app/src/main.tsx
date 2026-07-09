import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

// Apply saved theme before first paint to prevent flash
try {
  const saved = localStorage.getItem('trenchos.theme');
  if (saved === 'light' || saved === 'dark') {
    document.documentElement.setAttribute('data-theme', saved);
  }
} catch {}

createRoot(document.getElementById('root')!).render(<App />);
