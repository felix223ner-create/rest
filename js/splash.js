/* splash.js — «биржевой» старт: тикер из топ-12 монет и искорки на фоне.
   Работает на ОБОИХ стартовых экранах — загрузка (#scr-loading) и
   приветствие (#scr-nick). Источник данных: Engine (engine.js) +
   ASSETS (data-coins.js). Мини-график убран по просьбе Димы — на
   приветствии он не имел смысла. */
'use strict';

var Splash = (function () {
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function fmtPrice(v, d) {
    if (v == null || !isFinite(v)) return '—';
    if (v >= 1) {
      /* Тот же разделитель разрядов (узкий пробел), что в money() —
         раньше на сплэше цена была «77,605.1», а в игре «77 605.1». */
      var s = v.toFixed(d);
      var parts = s.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
      return parts.join('.');
    }
    return v.toFixed(Math.max(d, 4));
  }

  /* Искорки — 22 div'а с рандомной позицией/скоростью. */
  function buildSparks(host) {
    if (!host || host.dataset.built) return;
    host.dataset.built = '1';
    if (reduced) return; /* при reduced-motion искорки не нужны */
    var html = '';
    for (var i = 0; i < 22; i++) {
      var left = (Math.random() * 100).toFixed(2);
      var top = (Math.random() * 100).toFixed(2);
      var dur = (5.5 + Math.random() * 4.5).toFixed(2);
      var delay = (Math.random() * 6).toFixed(2);
      var size = (3 + Math.random() * 3.5).toFixed(1);
      html += '<i class="splash-spark" style="left:' + left + '%;top:' + top +
              '%;width:' + size + 'px;height:' + size + 'px;' +
              'animation-duration:' + dur + 's;animation-delay:-' + delay + 's"></i>';
    }
    host.innerHTML = html;
  }

  /* Тикер — топ-12 монет, реальные цены и изменение за 24ч. */
  function buildTicker(track) {
    if (!track || track.dataset.built) return;
    if (!window.ASSETS || !window.Engine) return;
    track.dataset.built = '1';
    var now = Date.now();
    var items = [];
    var limit = Math.min(12, ASSETS.length);
    for (var i = 0; i < limit; i++) {
      var a = ASSETS[i];
      items.push({
        t: a.ticker,
        p: Engine.live(a, now),
        ch: Engine.change(a, now),
        d: a.dec || 2
      });
    }
    /* Два прохода подряд — чтобы animate translate3d(-50%) был seamless. */
    var html = '';
    for (var loop = 0; loop < 2; loop++) {
      for (var k = 0; k < items.length; k++) {
        var it = items[k];
        var cls = it.ch >= 0 ? 'up' : 'down';
        var arrow = it.ch >= 0 ? '▲' : '▼';
        var pct = Math.abs(it.ch * 100).toFixed(2);
        html += '<span class="splash-tk-item">' +
                  /* esc — тикер приходит из сгенерированного data-coins.js,
                     то есть не пользовательский. Но строка собирается в
                     innerHTML, и однажды чужой источник в этом поле станет
                     дырой; экранирование тут бесплатное. */
                  '<b>' + esc(it.t) + '</b>' +
                  '$' + fmtPrice(it.p, it.d) +
                  '<i class="' + cls + '">' + arrow + ' ' + pct + '%</i>' +
                '</span>' +
                '<span class="splash-tk-sep"></span>';
      }
    }
    track.innerHTML = html;
  }

  function init() {
    var bgs = document.querySelectorAll('.splash-bg');
    for (var i = 0; i < bgs.length; i++) buildSparks(bgs[i]);

    var tracks = document.querySelectorAll('.splash-tk-track');
    for (var j = 0; j < tracks.length; j++) buildTicker(tracks[j]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    requestAnimationFrame(init);
  }

  return { play: init };
})();
