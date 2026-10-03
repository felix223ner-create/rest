/* sw.js — кеш картинок для экрана загрузки (js/loader.js).
   Только img/: скрипты и стили версионируются через ?v и идут мимо.
   Ключ кеша — путь без ?v, поэтому одна картинка под разными ?v лежит
   один раз. Замену файла лоадер видит по хешу в манифесте и сам удаляет
   старую запись — тогда здесь будет промах и свежая загрузка из сети. */
'use strict';
var CACHE = 'tradeup-img-v1';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('tradeup-img-') === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var scope = self.registration.scope;
  if (req.url.indexOf(scope) !== 0) return;
  var rel = req.url.slice(scope.length).split('#')[0].split('?')[0];
  if (rel.indexOf('img/') !== 0) return;
  var key = scope + rel;
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(key).then(function (hit) {
      if (hit) return hit;
      /* no-cache: сверка с сервером. Иначе после замены файла HTTP-кеш
         мог бы снова отдать старую версию. */
      return fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') c.put(key, res.clone()).catch(function () {});
        return res;
      });
    });
  }).catch(function () { return fetch(req); }));
});
