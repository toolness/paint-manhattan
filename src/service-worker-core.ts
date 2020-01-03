function startServiceWorker(version: string) {
  console.log(`Service worker ${version} is running.`);

  self.addEventListener('install', event => {
    console.log(`Service worker ${version} is installing at ${self.location.href}!!`);
    (self as any).skipWaiting();
  });

  self.addEventListener('activate', event => {
    console.log(`Service worker ${version} is activated.`);
    return (self as any).clients.claim();
  });

  self.addEventListener('fetch', event => {
    const request: Request = (event as any).request;
    console.log(`Service worker ${version} is being asked to fetch:`, request.url);
    return fetch(request);
  });
}
