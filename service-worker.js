self.addEventListener('install', event => {
    console.log(`Service worker is installing at ${self.location.href}.`);    
    const install = async () => {
        await self.skipWaiting();
    };
    event.waitUntil(install());
});
self.addEventListener('activate', event => {
    console.log(`Service worker is activating.`);
    const activate = async () => {
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames;
        await Promise.all(oldCaches.map(name => {
            console.log(`Deleting old cache ${name}.`);
            return caches.delete(name);
        }));
        await self.clients.claim();
    };
    event.waitUntil(activate());
});
self.addEventListener('fetch', event => {
    const respond = async () => {
        let request = event.request;
        return fetch(request);
    };
    event.respondWith(respond());
});
