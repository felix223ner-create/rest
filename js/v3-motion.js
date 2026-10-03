/* v3-motion — режим анимаций игры (вкладка «Настройки», concept/settings.html).

   Два независимых флага:
     fx: 'adv' | 'std' — продвинутые анимации (частицы, вспышки краёв,
         пружинистые переходы, блики и свечение, 3D-монеты, волна смены
         темы) или стандартные — короткие и лёгкие переходы без эффектов;
     rm: true | false  — «Меньше движения» поверх системной настройки.

   Модуль грузится ПЕРВЫМ из скриптов: остальные (fx.js, v3-kit.js,
   splash.js, tu-v2.js…) спрашивают window.matchMedia('(prefers-reduced-
   motion: reduce)') и кешируют результат. Поэтому для этого запроса
   отдаём свой объект: matches = система ИЛИ флаг игрока, а при смене
   флага рассылаем 'change' всем подписчикам — эффекты отключаются сразу,
   без перезагрузки.

   CSS-правила под @media (prefers-reduced-motion: reduce) браузер сам по
   флагу игрока не включит — их копируем в отдельный <style>, который
   включён только при rm (и выключен, если система уже это делает).
   Для 'std' так же собираем бесконечные декоративные анимации (блики,
   свечение, «дыхание») и гасим их под :root[data-fx="std"].

   Флаги живут в сейве (S.fx / S.rm), а копия — в localStorage tu_motion,
   чтобы режим применился до загрузки сейва (без вспышки анимаций). */
'use strict';

var Motion = (function () {
  var Q = '(prefers-reduced-motion: reduce)';
  var LS = 'tu_motion';
  var root = document.documentElement;
  var nativeMM = window.matchMedia ? window.matchMedia.bind(window) : null;
  var sys = null;
  try { sys = nativeMM ? nativeMM(Q) : null; } catch (e) { sys = null; }
  var st = { fx: 'adv', rm: false };
  try {
    var j = JSON.parse(localStorage.getItem(LS) || 'null');
    if (j) { st.fx = j.fx === 'std' ? 'std' : 'adv'; st.rm = !!j.rm; }
  } catch (e) { /* приватный режим — живём на дефолтах */ }

  function sysRm() { return !!(sys && sys.matches); }
  function rmOn() { return st.rm || sysRm(); }
  function adv() { return st.fx !== 'std' && !rmOn(); }

  /* ---- Подмена matchMedia для запроса reduced motion ---- */
  var subs = [];
  var fake = {
    media: Q,
    onchange: null,
    get matches() { return rmOn(); },
    addEventListener: function (type, fn) { if (type === 'change' && typeof fn === 'function' && subs.indexOf(fn) < 0) subs.push(fn); },
    removeEventListener: function (type, fn) { var i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); },
    addListener: function (fn) { this.addEventListener('change', fn); },
    removeListener: function (fn) { this.removeEventListener('change', fn); },
    dispatchEvent: function () { return true; }
  };
  if (nativeMM) {
    window.matchMedia = function (q) {
      if (String(q).replace(/\s+/g, ' ').trim() === Q) return fake;
      return nativeMM(q);
    };
  }
  var lastRm = rmOn();
  function notify() {
    var now = rmOn();
    if (now === lastRm) return;
    lastRm = now;
    var ev = { matches: now, media: Q };
    subs.slice().forEach(function (fn) { try { fn(ev); } catch (e) { /* чужой слушатель */ } });
    if (typeof fake.onchange === 'function') { try { fake.onchange(ev); } catch (e) { /* */ } }
  }
  if (sys) {
    var onSys = function () { apply(); };
    if (sys.addEventListener) sys.addEventListener('change', onSys);
    else if (sys.addListener) sys.addListener(onSys);
  }

  /* ---- Зеркала CSS ---- */
  var rmStyle = null, stdStyle = null, built = false;
  var DECOR = /shine|sheen|sweep|glow|breath|float|rays|bob|twinkle/i;
  function splitSel(s) { return s.split(/,(?![^(]*\))/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function scope(sel) {
    var a = ':root[data-fx="std"]';
    if (/^:root/.test(sel)) return sel.replace(/^:root/, a);
    if (/^html/.test(sel)) return sel.replace(/^html/, 'html[data-fx="std"]');
    return a + ' ' + sel;
  }
  function build() {
    if (built) return true;
    var rmCss = [], stdCss = [], seen = 0;
    var sheets = document.styleSheets;
    for (var i = 0; i < sheets.length; i++) {
      var rules;
      try { rules = sheets[i].cssRules; } catch (e) { continue; }
      if (!rules) continue;
      seen++;
      for (var k = 0; k < rules.length; k++) {
        var r = rules[k];
        if (r.type === 4 && r.media && /prefers-reduced-motion:\s*reduce/.test(r.media.mediaText)) {
          for (var m = 0; m < r.cssRules.length; m++) rmCss.push(r.cssRules[m].cssText);
        } else if (r.type === 1 && r.style) {
          var nm = r.style.animationName || '', it = r.style.animationIterationCount || '';
          if (!nm && r.style.animation) { nm = r.style.animation; it = /infinite/.test(nm) ? 'infinite' : ''; }
          if (nm && /infinite/.test(it) && DECOR.test(nm) && !/fr-/.test(r.selectorText)) {
            stdCss.push(splitSel(r.selectorText).map(scope).join(', ') + ' { animation: none !important; }');
          }
        }
      }
    }
    if (!seen) return false;
    built = true;
    rmStyle = document.createElement('style');
    rmStyle.id = 'motion-rm';
    rmStyle.textContent = rmCss.join('\n');
    stdStyle = document.createElement('style');
    stdStyle.id = 'motion-std';
    stdStyle.textContent = ':root[data-fx="std"] { --spring: var(--ease, cubic-bezier(0.2, 0.8, 0.2, 1)); }\n' + stdCss.join('\n');
    document.head.appendChild(rmStyle);
    document.head.appendChild(stdStyle);
    return true;
  }

  function apply() {
    root.setAttribute('data-fx', adv() ? 'adv' : 'std');
    root.setAttribute('data-rm', rmOn() ? '1' : '0');
    if (built || document.readyState !== 'loading') build();
    if (rmStyle) rmStyle.disabled = !(st.rm && !sysRm());
    if (stdStyle) stdStyle.disabled = adv();
    notify();
  }
  function persist() {
    try { localStorage.setItem(LS, JSON.stringify({ fx: st.fx, rm: st.rm ? 1 : 0 })); } catch (e) { /* */ }
  }

  /* Из сейва игры (после loadState) и из настроек. */
  function set(o, quiet) {
    if (!o) return;
    if (o.fx === 'adv' || o.fx === 'std') st.fx = o.fx;
    if (o.rm != null) st.rm = !!o.rm;
    persist();
    apply();
    if (!quiet && typeof S !== 'undefined' && S) { S.fx = st.fx; S.rm = st.rm ? 1 : 0; }
  }
  function fromSave(s) {
    if (!s) return;
    if (s.fx !== 'adv' && s.fx !== 'std') { s.fx = st.fx; s.rm = st.rm ? 1 : 0; }
    set({ fx: s.fx, rm: !!s.rm }, true);
  }

  root.setAttribute('data-fx', adv() ? 'adv' : 'std');
  root.setAttribute('data-rm', rmOn() ? '1' : '0');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
  window.addEventListener('load', function () { if (!built) apply(); });

  return {
    adv: adv,
    std: function () { return !adv(); },
    reduced: rmOn,
    sysReduced: sysRm,
    fx: function () { return st.fx; },
    userRm: function () { return st.rm; },
    set: set,
    fromSave: fromSave
  };
})();
