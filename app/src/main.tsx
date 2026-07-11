import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

// Apply saved theme before first paint to prevent flash.
// Default is 'hood' (electric green x matte black). 'dark' and 'light' are options.
// Light mode is desktop-only, so a phone never resolves to light.
try {
  const saved = localStorage.getItem('trenchos.theme'); // 'hood' | 'dark' | 'light'
  const isMobile = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  let theme = saved || 'hood';
  if (isMobile && theme === 'light') theme = 'hood';
  document.documentElement.setAttribute('data-theme', theme);
} catch {}

createRoot(document.getElementById('root')!).render(<App />);
