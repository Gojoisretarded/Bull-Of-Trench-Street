import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

// Apply saved theme before first paint to prevent flash.
// Mobile is dark-only — light mode is a desktop-only option, so we never
// apply a saved 'light' theme on a phone/narrow screen.
try {
  const saved = localStorage.getItem('trenchos.theme');
  const isMobile = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  const theme = isMobile ? 'dark' : saved;
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
  }
} catch {}

createRoot(document.getElementById('root')!).render(<App />);
