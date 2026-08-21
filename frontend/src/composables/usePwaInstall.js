import { ref } from 'vue';

const deferredPrompt = ref(null);
const isInstalled = ref(false);

// Detect iOS
const isIos = ref(false);
const isStandalone = ref(false);

export function usePwaInstall() {
    const initPwaListener = () => {
        if (typeof window !== 'undefined') {
            // Check if iOS
            const userAgent = window.navigator.userAgent.toLowerCase();
            isIos.value = /iphone|ipad|ipod/.test(userAgent);

            // Check if already installed (Standalone mode)
            isStandalone.value = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

            // Listen for standalone mode change (e.g. after manual install)
            window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
                isStandalone.value = e.matches;
            });

            window.addEventListener('beforeinstallprompt', (e) => {
                // Prevent the mini-infobar from appearing on mobile
                e.preventDefault();
                // Stash the event so it can be triggered later.
                deferredPrompt.value = e;
                console.log('PWA Install Prompt Captured globally');
            });

            window.addEventListener('appinstalled', () => {
                deferredPrompt.value = null;
                isInstalled.value = true;
                isStandalone.value = true;
                console.log('PWA Application Installed');
            });
        }
    };

    const installPwa = async () => {
        if (!deferredPrompt.value) return;
        deferredPrompt.value.prompt();
        const { outcome } = await deferredPrompt.value.userChoice;
        if (outcome === 'accepted') {
            deferredPrompt.value = null;
        }
    };

    return {
        deferredPrompt,
        isInstalled,
        isIos,
        isStandalone,
        initPwaListener,
        installPwa
    };
}
