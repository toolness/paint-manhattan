"use strict";
function startServiceWorker(version) {
    console.log(`Service worker ${version} is running.`);
    self.addEventListener('install', event => {
        console.log(`Service worker ${version} is installing at ${self.location.href}!!`);
        self.skipWaiting();
    });
    self.addEventListener('activate', event => {
        console.log(`Service worker ${version} is activated.`);
        return self.clients.claim();
    });
    self.addEventListener('fetch', event => {
        const request = event.request;
        console.log(`Service worker ${version} is being asked to fetch:`, request.url);
        return fetch(request);
    });
}
