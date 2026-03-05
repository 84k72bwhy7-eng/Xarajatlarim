import WebApp from '@twa-dev/sdk';

export function initializeTelegramApp() {
    if (typeof window !== 'undefined') {
        WebApp.ready();
        WebApp.expand();

        try {
            if (WebApp.requestFullscreen) {
                WebApp.requestFullscreen();
            }
        } catch (e) {
            console.error('Fullscreen request failed:', e);
        }

        // Theme colors synchronization
        const applyTheme = () => {
            document.body.style.backgroundColor = WebApp.backgroundColor || '#f8fafc';
            document.body.style.color = WebApp.textColor || '#0f172a';
        };

        // Initial theme apply
        applyTheme();

        // Listen to theme changes
        WebApp.onEvent('themeChanged', applyTheme);

        return WebApp.initDataUnsafe?.user || null;
    }
    return null;
}

export const tg = WebApp;
