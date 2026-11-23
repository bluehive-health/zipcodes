// Server entry used only at build time to prerender the page to static HTML.
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './App';

export { api, faq, site } from './content';

export function render(): string {
    return renderToString(
        <StrictMode>
            <App />
        </StrictMode>,
    );
}
