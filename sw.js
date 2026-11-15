// Small Crown offline support, built on Workbox (MIT, Google): https://github.com/GoogleChrome/workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');
const {routing, strategies, expiration, cacheableResponse, core} = workbox;
core.setCacheNameDetails({prefix: 'smallcrown'});
self.addEventListener('install', () => self.skipWaiting());
core.clientsClaim();

// The page itself: fresh when online, cached copy when offline.
routing.registerRoute(({request}) => request.mode === 'navigate',
  new strategies.NetworkFirst({cacheName: 'smallcrown-pages', networkTimeoutSeconds: 4}));

// Models, textures and icons: serve from cache, refresh in the background.
routing.registerRoute(({url}) => url.origin === self.location.origin && /\/(models|icons)\//.test(url.pathname),
  new strategies.StaleWhileRevalidate({cacheName: 'smallcrown-assets',
    plugins: [new cacheableResponse.CacheableResponsePlugin({statuses: [0, 200]})]}));

// The game script, Spanish text and story data: cached copy at once, refreshed in the background.
routing.registerRoute(({url}) => url.origin === self.location.origin && /\.(js|json)$/.test(url.pathname) && !url.pathname.endsWith('/sw.js'),
  new strategies.StaleWhileRevalidate({cacheName: 'smallcrown-game',
    plugins: [new cacheableResponse.CacheableResponsePlugin({statuses: [0, 200]})]}));

// Libraries and fonts are pinned to exact versions, so the cached copy never goes stale.
routing.registerRoute(({url}) => ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname),
  new strategies.CacheFirst({cacheName: 'smallcrown-libs',
    plugins: [new cacheableResponse.CacheableResponsePlugin({statuses: [0, 200]}),
              new expiration.ExpirationPlugin({maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365})]}));
