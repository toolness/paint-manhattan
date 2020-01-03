importScripts("./service-worker-metadata.js");

const PREFIX = 'paint-manhattan-';

const VERSION = `${PREFIX}${FILE_CONTENT_HASH}`;

const SHORT_VER = FILE_CONTENT_HASH.slice(0, 10);

function isOldCache(cacheName) {
  return cacheName.startsWith(PREFIX) && cacheName !== VERSION;
}

console.log(`Service worker ${SHORT_VER} is running.`);

self.addEventListener('install', event => {
  console.log(`Service worker ${SHORT_VER} is installing at ${self.location.href}.`);
  const install = async () => {
    await self.skipWaiting();
    const cache = await caches.open(VERSION);
    await cache.addAll(['/', ...FILE_LIST]);
    console.log(`Service worker ${SHORT_VER} cached ${FILE_LIST.length} files.`);
  };
  event.waitUntil(install());
});

self.addEventListener('activate', event => {
  console.log(`Service worker ${SHORT_VER} is activating.`);
  const activate = async () => {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(isOldCache);
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
    const response = await caches.match(event.request);
    if (response) {
      return response;
    }
    console.log(`Fetching ${event.request.url} from the network.`);
    return fetch(event.request);
  };
  event.respondWith(respond());
});
