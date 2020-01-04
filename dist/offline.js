/** Location of the service worker script relative to our web pages. */
const SERVICE_WORKER_SCRIPT = './service-worker.js';
/** Returns whether the user wants offline support. */
export function wantsOfflineSupport() {
    const qs = new URLSearchParams(window.location.search);
    // Note that the service worker script uses the same logic to determine
    // if the requesting/requested page wants offline support, so if this
    // logic changes, make sure it changes in the service worker too.
    return qs.get('offline') === 'on';
}
/** Returns whether the browser can support offline mode. */
export function canSupportOffline() {
    return 'serviceWorker' in window.navigator && 'caches' in window;
}
/**
 * Enable offline support, but only if the user wants it *and* the browser supports it.
 */
export async function enableOfflineSupport() {
    if (!canSupportOffline() || !wantsOfflineSupport())
        return;
    const pageURL = new URL(window.location.href);
    const workerURL = new URL(SERVICE_WORKER_SCRIPT, pageURL);
    const registration = await window.navigator.serviceWorker.register(workerURL.href);
    console.log('Service worker registration succeeded.');
    window.navigator.serviceWorker.oncontrollerchange = () => {
        console.log("Controller changed.");
        // For some reason this event seems to fire prematurely, so we won't reload here.
        // window.location.reload();
    };
    registration.onupdatefound = () => {
        console.log("A service worker update was found.");
        const { installing } = registration;
        if (installing) {
            console.log("Service worker is installing.");
            installing.onstatechange = () => {
                if (installing.state === 'installed') {
                    console.log("Service worker installed.");
                }
                else if (installing.state === 'activated') {
                    console.log("Service worker is ACTIVE.");
                    window.location.reload();
                }
            };
        }
    };
    registration.update();
}
