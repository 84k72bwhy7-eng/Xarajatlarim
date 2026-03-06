import WebApp from '@twa-dev/sdk';

export function initializeTelegramApp() {
    if (typeof window !== 'undefined') {
        WebApp.ready();
        WebApp.expand();
        try {
            if (WebApp.disableVerticalSwipes) {
                WebApp.disableVerticalSwipes();
            }
        } catch (e) {
            console.error('Disable vertical swipes failed:', e);
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
