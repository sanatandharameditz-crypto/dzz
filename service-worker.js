const CACHE_NAME = 'duelzone-cache-v7';
const URLS_TO_CACHE = [
  './',
  'index.html',
  'duelzone.css',
  'dz-core.js',
  'dz-games.js',
  'dz-game-shell.js',
  'dz-hub.js',
  'dz-router.js',
  'dz-theme.js',
  'dzshare.js',
  'manifest.json',
  'assets/icon-192.png',
  'assets/icon-512.png',
  // Standalone game HTML files
  'airhockey.html',
  'battleship.html',
  'blackjack.html',
  'bomberman.html',
  'checkers.html',
  'chess.html',
  'connect4.html',
  'darts.html',
  'game2048.html',
  'ludo.html',
  'memory.html',
  'minesweeper.html',
  'pingpong.html',
  'pong.html',
  'pool.html',
  'reaction.html',
  'snake.html',
  'spacedodge.html',
  'starcatcher.html',
  'sudoku.html',
  'tanks.html',
  'territory.html',
  'tetris.html',
  'wordduel.html',
  // Game JavaScript modules
  '/games/airhockey.js',
  '/games/battleship.js',
  '/games/blackjack.js',
  '/games/bomberman.js',
  '/games/boot.js',
  '/games/checkers.js',
  '/games/connect4.js',
  '/games/darts.js',
  '/games/game2048.js',
  '/games/memory.js',
  '/games/minesweeper.js',
  '/games/pingpong.js',
  '/games/pong.js',
  '/games/pool.js',
  '/games/reaction.js',
  '/games/runner.js',
  '/games/snake.js',
  '/games/spacedodge.js',
  '/games/starcatcher.js',
  '/games/sudoku.js',
  '/games/tanks.js',
  '/games/territory.js',
  '/games/wordduel.js',
  '/chess.js',
  '/ludo.js',
  '/tetris.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
