import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './theme/tokens.css';
import './theme/base.css';
import { App } from './app/App';

// Block the context menu (long-press on touch, right-click on desktop).
window.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
