import WebApp from '@twa-dev/sdk';

export function initializeTelegramApp() {
    if (typeof window !== 'undefined') {
        WebApp.ready();
        WebApp.expand();

        try {
            if (WebApp.requestFullscreen) {
                WebApp.requestFullscreen();
            } else if (window.Telegram?.WebApp?.postEvent) {
                window.Telegram.WebApp.postEvent('web_app_request_fullscreen');
            }
        } catch (e) {
            console.error('Fullscreen request failed:', e);
        }

        try {
            WebApp.setHeaderColor('#1a4d3a'); // Forest Green var
            WebApp.setBackgroundColor('#f0f5f2'); // Main bg
        } catch (e) {
            console.error('Color set failed:', e);
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
