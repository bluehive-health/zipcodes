import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const container = document.getElementById('root') as HTMLElement;
const app = (
    <StrictMode>
        <App />
    </StrictMode>
);

// Production pages are prerendered (see scripts/prerender.mjs), so hydrate them.
// The dev server serves an empty root.
if (container.hasChildNodes()) {
    hydrateRoot(container, app);
} else {
    createRoot(container).render(app);
}
