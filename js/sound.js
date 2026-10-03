/* TradeUp — звук и музыка. Всё синтезируется на Web Audio (0 КБ ассетов),
   движок и звуки — из concept/sounds.html. Выбор материалов — CFG ниже.
   API: Snd.play(id[, f 0..1]), Snd.pause/resume(причина), Snd.set('s'|'m'|'vs'|'vm', v). */
var Snd = (function () {
'use strict';
var m = function (n) { return 440 * Math.pow(2, (n - 69) / 12); };
var hr = function (a, b) { var x = Math.sin(a * 12.9898 + b * 78.233 + 0.5) * 43758.5453; return x - Math.floor(x); };
var NB = new WeakMap(), IR = new WeakMap();
function noiseBuf(c) {
  var b = NB.get(c); if (b) return b;
  b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  var d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  NB.set(c, b); return b;
}
function impulse(c, dur, dec) {
  var len = Math.floor(c.sampleRate * dur), b = c.createBuffer(2, len, c.sampleRate);
  for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, dec); }
  return b;
}
function env(g, t, a, s, d, pk) {
  a = Math.max(0.002, a); s = Math.max(0, Math.min(s || 0, d - a - 0.01));
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, pk), t + a);
  if (s > 0) g.gain.setValueAtTime(Math.max(0.0002, pk), t + a + s);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(d, a + 0.01));
}
function route(b, g, o) {
  g.connect(b.in);
  if (o.rv) { var s = b.c.createGain(); s.gain.value = o.rv; g.connect(s); s.connect(b.rev); }
  if (o.dl) { var s2 = b.c.createGain(); s2.gain.value = o.dl; g.connect(s2); s2.connect(b.dly); }
}
function filt(c, src, t, o) {
  if (!o.fc) return src;
  var f = c.createBiquadFilter(); f.type = o.ft || 'lowpass'; f.Q.value = o.q || 0.7;
  f.frequency.setValueAtTime(o.fc, t);
  if (o.fc2) f.frequency.exponentialRampToValueAtTime(o.fc2, t + (o.d || 0.2));
  src.connect(f); return f;
}
/* Тон: f→f2, тип волны, огибающая, фильтр, вибрато, посылы. */
function T(b, t, o) {
  var c = b.c, d = o.d || 0.2, osc = c.createOscillator();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(o.f, t);
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t + (o.pt || d));
  if (o.det) osc.detune.value = o.det;
  if (o.vib) { var l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib; lg.gain.value = o.f * 0.008; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + d + 0.05); }
  var g = c.createGain(); env(g, t, o.a || 0.004, o.s, d, o.g == null ? 0.3 : o.g);
  filt(c, osc, t, o).connect(g); route(b, g, o);
  osc.start(t); osc.stop(t + d + 0.05);
}
function N(b, t, o) {
  var c = b.c, d = o.d || 0.1, src = c.createBufferSource();
  src.buffer = noiseBuf(c); src.loop = true;
  var g = c.createGain(); env(g, t, o.a || 0.002, o.s, d, o.g == null ? 0.2 : o.g);
  filt(c, src, t, o).connect(g); route(b, g, o);
  src.start(t, Math.random()); src.stop(t + d + 0.05);
}
/* FM-колокол: несущая + модулятор с затухающим индексом. */
function FM(b, t, o) {
  var c = b.c, d = o.d || 1, car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain();
  car.frequency.value = o.f; mod.frequency.value = o.f * (o.r || 3.5);
  mg.gain.setValueAtTime(o.f * (o.ix || 2), t); mg.gain.exponentialRampToValueAtTime(o.f * (o.ix || 2) * 0.04 + 0.01, t + d);
  mod.connect(mg); mg.connect(car.frequency);
  var g = c.createGain(); env(g, t, o.a || 0.002, 0, d, o.g == null ? 0.2 : o.g);
  car.connect(g); route(b, g, o);
  car.start(t); mod.start(t); car.stop(t + d + 0.05); mod.stop(t + d + 0.05);
}
/* Граф: мастер с компрессором, две шины (звуки/музыка) с реверберацией и дилеем. */
function makeGraph(c, dest) {
  var G = { c: c };
  G.master = c.createGain(); G.master.gain.value = 0.9;
  var comp = c.createDynamicsCompressor();
  comp.threshold.value = -6; comp.knee.value = 10; comp.ratio.value = 3; comp.attack.value = 0.002; comp.release.value = 0.18;
  G.master.connect(comp); comp.connect(dest); G.comp = comp;
  function bus(vol, dlt) {
    var post = c.createGain(); post.connect(G.master);
    var out = c.createGain(); out.gain.value = vol; out.connect(post);
    var inp = c.createGain(); inp.connect(out);
    var rev = c.createConvolver(); rev.buffer = impulse(c, 2.4, 3); rev.connect(out);
    var dly = c.createDelay(1.5); dly.delayTime.value = dlt;
    var fb = c.createGain(); fb.gain.value = 0.32; var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2800;
    dly.connect(lp); lp.connect(fb); fb.connect(dly); var dg = c.createGain(); dg.gain.value = 0.5; lp.connect(dg); dg.connect(out);
    return { c: c, in: inp, out: out, post: post, rev: rev, dly: dly };
  }
  G.sfx = bus(0.85, 0.16); G.music = bus(0.45, 0.3);
  /* У звуков свой лимитер: громкий эффект сжимается сам и не «продавливает»
     общий компрессор — раньше от этого фоновая музыка проваливалась. */
  var sl = c.createDynamicsCompressor();
  sl.threshold.value = -10; sl.knee.value = 6; sl.ratio.value = 8; sl.attack.value = 0.002; sl.release.value = 0.12;
  G.sfx.post.disconnect(); G.sfx.post.connect(sl); sl.connect(G.master);
  return G;
}
/* ===================== Материалы (три стиля звука) =====================
   Никаких нот и аккордов: клики, удары, металл, бумага, шум. */
/* Металл: негармонические обертона — звенит, но не «играет мелодию». */
function METAL(b, t, f, g, d, rv) { [1, 2.76, 5.4, 8.93].forEach(function (r, i) { T(b, t, { f: f * r, d: d * (1 - i * 0.18), g: g * [1, 0.6, 0.4, 0.25][i], rv: rv || 0.15 }); }); }
function WOOD(b, t, f, g, d) { T(b, t, { f: f, f2: f * 0.6, pt: 0.02, d: d || 0.05, g: g }); N(b, t, { d: 0.012, g: g * 0.6, ft: 'bandpass', fc: f * 2.2, q: 3 }); }
function scatter(n, d, seed, fn) { for (var i = 0; i < n; i++) fn(hr(i, seed) * d, i, hr(i, seed + 7)); }
var PACKS = [
  { id: 'metal', name: 'Металл', hint: 'монеты, сталь, щелчки затвора',
    click: function (b, t, g, f) { N(b, t, { d: 0.012, g: g * 0.9, ft: 'highpass', fc: 4500 }); METAL(b, t, f || 3200, g * 0.2, 0.05); },
    knock: function (b, t, g, f) { METAL(b, t, f || 1400, g * 0.45, 0.12); N(b, t, { d: 0.01, g: g * 0.5, ft: 'bandpass', fc: 3000 }); },
    coin: function (b, t, g, k) { k = k || 1; METAL(b, t, 2400 * k, g, 0.35, 0.25); N(b, t, { d: 0.008, g: g * 0.5, ft: 'highpass', fc: 6000 }); },
    sparkle: function (b, t, d, g) { scatter(Math.round(8 + d * 10), d, 3, function (o, i, r) { METAL(b, t + o, 4200 + r * 4500, g * (0.4 + r * 0.6) * 0.5, 0.08, 0.3); }); },
    thud: function (b, t, f, g, d) { T(b, t, { f: f, f2: f * 0.4, pt: d * 0.6, d: d, g: g }); N(b, t, { d: 0.05, g: g * 0.35, ft: 'lowpass', fc: 700 }); },
    buzz: function (b, t, d, g) { T(b, t, { f: 92, d: d, g: g, type: 'sawtooth', fc: 1500, s: d * 0.7 }); T(b, t, { f: 97, d: d, g: g * 0.8, type: 'sawtooth', fc: 1500, s: d * 0.7 }); },
    pop: function (b, t, g, f) { METAL(b, t, f || 5200, g * 0.4, 0.07); },
    rustle: function (b, t, d, g) { scatter(Math.round(6 + d * 30), d, 11, function (o, i, r) { METAL(b, t + o, 2500 + r * 3500, g * 0.18, 0.04); }); },
    crack: function (b, t, g) { METAL(b, t, 320, g, 1.2, 0.4); N(b, t, { d: 0.35, g: g, ft: 'highpass', fc: 2000, rv: 0.3 }); },
    swoosh: function (b, t, up, d, g) { N(b, t, { d: d, a: d * 0.45, g: g, ft: 'bandpass', fc: up ? 500 : 3500, fc2: up ? 3500 : 500, q: 1.4, rv: 0.2 }); }
  },
  { id: 'paper', name: 'Бумага и дерево', hint: 'купюры, деревянные кнопки, войлок',
    click: function (b, t, g, f) { WOOD(b, t, (f || 3200) * 0.34, g * 0.9, 0.04); },
    knock: function (b, t, g, f) { WOOD(b, t, (f || 1400) * 0.3, g, 0.08); },
    coin: function (b, t, g, k) { k = k || 1; WOOD(b, t, 1500 * k, g * 0.8, 0.04); WOOD(b, t + 0.04, 1300 * k, g * 0.6, 0.05); },
    sparkle: function (b, t, d, g) { scatter(Math.round(10 + d * 14), d, 5, function (o, i, r) { N(b, t + o, { d: 0.02 + r * 0.03, g: g * 0.5, ft: 'bandpass', fc: 2500 + r * 4000, q: 1.5 }); }); },
    thud: function (b, t, f, g, d) { T(b, t, { f: f * 0.8, f2: f * 0.45, pt: d * 0.5, d: d * 1.1, g: g, fc: 500 }); N(b, t, { d: 0.08, g: g * 0.3, ft: 'lowpass', fc: 300 }); },
    buzz: function (b, t, d, g) { T(b, t, { f: 140, d: d, g: g * 1.2, type: 'triangle', s: d * 0.6, vib: 26 }); N(b, t, { d: d, g: g * 0.25, ft: 'lowpass', fc: 600, s: d * 0.6 }); },
    pop: function (b, t, g, f) { T(b, t, { f: (f || 5200) * 0.09, f2: (f || 5200) * 0.26, pt: 0.04, d: 0.05, g: g }); },
    rustle: function (b, t, d, g) { scatter(Math.round(8 + d * 40), d, 13, function (o, i, r) { N(b, t + o, { d: 0.015 + r * 0.04, g: g * (0.4 + r * 0.6), ft: 'bandpass', fc: 1800 + r * 4500, q: 1.2 }); }); },
    crack: function (b, t, g) { N(b, t, { d: 0.25, g: g, ft: 'lowpass', fc: 2500, fc2: 300, rv: 0.25 }); [0, 0.03, 0.07].forEach(function (o, i) { WOOD(b, t + o, 260 - i * 40, g * 0.7, 0.1); }); },
    swoosh: function (b, t, up, d, g) { N(b, t, { d: d, a: d * 0.5, g: g * 1.2, ft: 'lowpass', fc: up ? 250 : 1800, fc2: up ? 1800 : 250, q: 0.8 }); }
  },
  { id: 'digital', name: 'Цифровой', hint: 'чистый UI, глитч, саб-удары',
    click: function (b, t, g, f) { T(b, t, { f: (f || 3200) * 0.7, d: 0.008, g: g * 0.35, type: 'square', fc: 6000 }); T(b, t, { f: (f || 3200) * 0.35, d: 0.02, g: g * 0.5 }); },
    knock: function (b, t, g, f) { T(b, t, { f: f || 1300, f2: (f || 1300) * 0.4, pt: 0.02, d: 0.035, g: g }); },
    coin: function (b, t, g, k) { k = k || 1; T(b, t, { f: 700 * k, f2: 2600 * k, pt: 0.06, d: 0.09, g: g * 0.7 }); T(b, t, { f: 1400 * k, f2: 5200 * k, pt: 0.06, d: 0.07, g: g * 0.15, type: 'square', fc: 7000 }); },
    sparkle: function (b, t, d, g) { scatter(Math.round(8 + d * 16), d, 9, function (o, i, r) { T(b, t + o, { f: 2000 + r * 6000, d: 0.01 + r * 0.015, g: g * 0.22, type: 'square', fc: 9000, dl: 0.1 }); }); },
    thud: function (b, t, f, g, d) { T(b, t, { f: f * 0.7, f2: 28, pt: d * 0.8, d: d * 1.2, g: g * 1.1 }); T(b, t, { f: 1800, d: 0.006, g: g * 0.2, type: 'square' }); },
    buzz: function (b, t, d, g) { T(b, t, { f: 82, d: d, g: g * 0.5, type: 'square', fc: 1800, det: -12, s: d * 0.7 }); T(b, t, { f: 82, d: d, g: g * 0.5, type: 'square', fc: 1800, det: 12, s: d * 0.7 }); },
    pop: function (b, t, g, f) { T(b, t, { f: (f || 5200) * 0.06, f2: (f || 5200) * 0.18, pt: 0.03, d: 0.05, g: g }); },
    rustle: function (b, t, d, g) { scatter(Math.round(6 + d * 30), d, 17, function (o, i, r) { T(b, t + o, { f: 3000 + r * 5000, d: 0.006, g: g * 0.3, type: 'square', fc: 8000 }); }); },
    crack: function (b, t, g) { N(b, t, { d: 0.3, g: g, ft: 'highpass', fc: 1200, rv: 0.2 }); scatter(14, 0.35, 21, function (o, i, r) { T(b, t + o, { f: 200 + r * 3000, d: 0.02, g: g * 0.25, type: 'square', fc: 5000 }); }); },
    swoosh: function (b, t, up, d, g) { T(b, t, { f: up ? 90 : 900, f2: up ? 900 : 90, pt: d, d: d, g: g * 0.6, type: 'sawtooth', fc: up ? 400 : 4000, fc2: up ? 4000 : 400, q: 6, a: d * 0.3 }); }
  }
];
var SFX = [];
function DEF(id, g, name, when, dur, fn) { SFX.push({ id: id, g: g, name: name, when: when, dur: dur, fn: fn }); }
function each(arr, fn) { for (var i = 0; i < arr.length; i++) fn(arr[i], i); }
/* Россыпь монет: неровные интервалы, чуть разная «величина» монеты. */
function coins(P, b, t, n, d, g, seed) { scatter(n, d, seed || 1, function (o, i, r) { P.coin(b, t + o, g * (0.55 + r * 0.45), 0.85 + r * 0.35); }); }
/* Сдувание: шум с опускающимся фильтром (без тона). */
function deflate(b, t, d, g) { N(b, t, { d: d, a: 0.02, g: g, ft: 'bandpass', fc: 2400, fc2: 180, q: 2.5 }); }
/* Толпа/шум зала: полосовой шум с медленной атакой. */
function crowd(b, t, d, g) { N(b, t, { d: d, a: d * 0.3, g: g, ft: 'bandpass', fc: 900, fc2: 1400, q: 0.9, rv: 0.4 }); N(b, t, { d: d * 0.8, a: d * 0.25, g: g * 0.6, ft: 'bandpass', fc: 2600, q: 1.5, rv: 0.4 }); }

/* Интерфейс */
DEF('tap', 'global', 'Тап по кнопке', 'Любая кнопка, чип, пункт списка', 0.4, function (P, b, t) { P.click(b, t, 0.22); });
DEF('tab', 'global', 'Смена вкладки', 'Нижняя панель: Меню → Рынок → …', 0.5, function (P, b, t) { P.click(b, t, 0.16, 2600); P.swoosh(b, t + 0.01, true, 0.12, 0.05); P.click(b, t + 0.05, 0.12, 3800); });
DEF('sheet_open', 'global', 'Шторка открылась', 'Шит покупки, сортировка, настройки', 0.6, function (P, b, t) { P.swoosh(b, t, true, 0.2, 0.12); P.knock(b, t + 0.17, 0.12, 1600); });
DEF('sheet_close', 'global', 'Шторка закрылась', 'Смахивание вниз, тап по затемнению', 0.6, function (P, b, t) { P.swoosh(b, t, false, 0.17, 0.11); P.thud(b, t + 0.13, 160, 0.14, 0.1); });
DEF('toggle', 'global', 'Переключатель', 'Тумблеры и сегменты (тема, язык)', 0.4, function (P, b, t) { P.click(b, t, 0.2, 2400); P.knock(b, t + 0.035, 0.12, 1800); });
DEF('error', 'global', 'Ошибка / нельзя', 'FX.nudge: не хватает денег, неверное имя', 0.6, function (P, b, t) { P.buzz(b, t, 0.1, 0.13); P.buzz(b, t + 0.14, 0.14, 0.11); });
DEF('toast', 'global', 'Тост', 'Обычное уведомление сверху', 0.6, function (P, b, t) { P.swoosh(b, t, false, 0.12, 0.06); P.pop(b, t + 0.09, 0.16); });
DEF('popup', 'global', 'Окно поверх', 'Модалка (выбор аватарки, подтверждение)', 0.6, function (P, b, t) { P.swoosh(b, t, true, 0.16, 0.09); P.pop(b, t + 0.13, 0.14, 4200); P.click(b, t + 0.15, 0.08); });

/* Меню */
DEF('bonus', 'lobby', 'Ежедневный бонус', '«Забрать бонус» — монеты сыплются в капитал', 2, function (P, b, t) { P.swoosh(b, t, true, 0.25, 0.08); coins(P, b, t + 0.2, 14, 0.9, 0.12, 3); P.thud(b, t + 1.15, 110, 0.2, 0.25); P.sparkle(b, t + 1.15, 0.5, 0.12); });
DEF('coin_hit', 'lobby', 'Монета долетела', 'FX.fly: монета попала в счётчик', 0.5, function (P, b, t) { P.coin(b, t, 0.16); P.click(b, t + 0.01, 0.08); });
DEF('streak', 'lobby', 'Серия дней', 'Огонёк серии вырос', 1.1, function (P, b, t) { N(b, t, { d: 0.6, a: 0.25, g: 0.12, ft: 'bandpass', fc: 400, fc2: 2600, q: 1.2 }); P.rustle(b, t + 0.1, 0.5, 0.08); P.pop(b, t + 0.6, 0.18); });
DEF('quest_done', 'lobby', 'Задание выполнено', 'Галочка в «Заданиях дня»', 1, function (P, b, t) { P.knock(b, t, 0.16, 1500); P.swoosh(b, t + 0.02, true, 0.12, 0.06); P.click(b, t + 0.12, 0.18, 3600); P.sparkle(b, t + 0.15, 0.3, 0.08); });
DEF('chest', 'lobby', 'Сундук открыт', 'Награда за этап пропуска', 2, function (P, b, t) { P.knock(b, t, 0.2, 900); P.knock(b, t + 0.09, 0.16, 800); P.thud(b, t + 0.3, 90, 0.28, 0.3); P.swoosh(b, t + 0.3, true, 0.35, 0.1); coins(P, b, t + 0.45, 9, 0.6, 0.1, 5); P.sparkle(b, t + 0.5, 0.8, 0.1); });
DEF('xp', 'lobby', 'Опыт +XP', 'Полоска пропуска заполнилась', 0.6, function (P, b, t) { P.rustle(b, t, 0.25, 0.07); P.pop(b, t + 0.25, 0.12, 6000); });

/* Рынок */
DEF('tick_up', 'market', 'Тик цены вверх', 'Цена в строке мигнула зелёным (очень тихо)', 0.3, function (P, b, t) { P.click(b, t, 0.06, 4200); });
DEF('tick_down', 'market', 'Тик цены вниз', 'Цена мигнула красным', 0.3, function (P, b, t) { P.click(b, t, 0.06, 2200); });
DEF('open_coin', 'market', 'Открыть монету', 'Тап по строке — шторка графика', 0.6, function (P, b, t) { P.click(b, t, 0.14); P.swoosh(b, t + 0.02, true, 0.2, 0.1); P.knock(b, t + 0.2, 0.1, 1700); });
DEF('fav_add', 'market', 'В избранное', 'Звёздочка включена', 0.6, function (P, b, t) { P.pop(b, t, 0.16, 5600); P.sparkle(b, t + 0.03, 0.22, 0.08); });
DEF('fav_remove', 'market', 'Из избранного', 'Звёздочка выключена', 0.4, function (P, b, t) { P.pop(b, t, 0.12, 3600); P.swoosh(b, t + 0.02, false, 0.1, 0.04); });
DEF('sort', 'market', 'Сортировка / фильтр', 'Смена сортировки и чипов категорий', 0.4, function (P, b, t) { P.rustle(b, t, 0.1, 0.1); P.click(b, t + 0.1, 0.14); });
DEF('news_strong', 'market', 'Сильная новость', '«Сильное событие» в ленте', 1.5, function (P, b, t) { P.rustle(b, t, 0.35, 0.12); P.thud(b, t + 0.35, 120, 0.22, 0.3); P.knock(b, t + 0.35, 0.16, 1100); P.knock(b, t + 0.5, 0.12, 1100); });

/* Сделка */
DEF('chip', 'trade', 'Чип / шаг ползунка', '10% · 25% · 50%, ползунок суммы', 0.3, function (P, b, t) { P.click(b, t, 0.16, 3000); });
DEF('slider', 'trade', 'Ползунок суммы (демо)', 'Щелчки при протягивании — плотнее и ярче с суммой', 0.9, function (P, b, t) { for (var i = 0; i < 12; i++) P.click(b, t + i * 0.06, 0.06 + i * 0.008, 2000 + i * 220); });
DEF('buy', 'trade', 'Покупка', 'doBuy: монеты летят в портфель', 1.2, function (P, b, t) { P.swoosh(b, t, true, 0.18, 0.08); P.thud(b, t + 0.16, 120, 0.3, 0.22); P.knock(b, t + 0.16, 0.18); coins(P, b, t + 0.2, 6, 0.35, 0.11, 7); });
DEF('sell_profit', 'trade', 'Продажа в плюс', 'doSell с pnl > 0 — «ка-чинг»', 1.8, function (P, b, t) { P.knock(b, t, 0.2, 1200); P.knock(b, t + 0.07, 0.16, 1000); P.rustle(b, t + 0.12, 0.3, 0.1); P.coin(b, t + 0.42, 0.2, 1.1); coins(P, b, t + 0.47, 8, 0.5, 0.1, 9); P.sparkle(b, t + 0.45, 0.7, 0.1); });
DEF('sell_loss', 'trade', 'Продажа в минус', 'doSell с pnl < 0 — без «наказания», мягко', 1.1, function (P, b, t) { P.knock(b, t, 0.14, 1100); deflate(b, t + 0.05, 0.55, 0.12); P.thud(b, t + 0.5, 90, 0.18, 0.25); });
DEF('limit_place', 'trade', 'Лимитный ордер выставлен', 'Ордер «приколот» к цене', 0.6, function (P, b, t) { P.click(b, t, 0.14, 2400); P.knock(b, t + 0.07, 0.2, 1500); P.thud(b, t + 0.07, 200, 0.1, 0.08); });
DEF('limit_fill', 'trade', 'Лимитный ордер исполнен', 'Срабатывает в фоне — заметный, но короткий', 1, function (P, b, t) { P.pop(b, t, 0.14); P.pop(b, t + 0.09, 0.14, 6500); coins(P, b, t + 0.18, 4, 0.25, 0.1, 11); });
DEF('order_cancel', 'trade', 'Отмена ордера', 'Ордер снят', 0.5, function (P, b, t) { P.rustle(b, t, 0.12, 0.1); P.swoosh(b, t + 0.05, false, 0.15, 0.07); });

/* Фьючерсы */
DEF('long', 'futures', 'Открыть лонг', 'Ставка на рост', 1, function (P, b, t) { P.click(b, t, 0.16); P.swoosh(b, t + 0.02, true, 0.35, 0.12); P.thud(b, t + 0.36, 140, 0.24, 0.2); P.knock(b, t + 0.36, 0.14, 1800); });
DEF('short', 'futures', 'Открыть шорт', 'Ставка на падение', 1, function (P, b, t) { P.click(b, t, 0.16); P.swoosh(b, t + 0.02, false, 0.35, 0.12); P.thud(b, t + 0.36, 80, 0.28, 0.25); P.knock(b, t + 0.36, 0.14, 900); });
DEF('leverage', 'futures', 'Плечо ×N', 'Ползунок плеча — щелчки плотнее и жёстче с риском', 1.1, function (P, b, t) { var tt = 0, gap = 0.11; for (var i = 0; i < 10; i++) { P.click(b, t + tt, 0.07 + i * 0.012, 1800 + i * 300); tt += gap; gap *= 0.86; } P.thud(b, t + tt, 100, 0.18, 0.2); });
DEF('tp', 'futures', 'Тейк-профит', 'TP сработал', 1.4, function (P, b, t) { P.knock(b, t, 0.2, 1400); P.pop(b, t + 0.08, 0.16, 6000); coins(P, b, t + 0.15, 7, 0.45, 0.1, 13); P.sparkle(b, t + 0.2, 0.6, 0.09); });
DEF('sl', 'futures', 'Стоп-лосс', 'SL сработал — позиция спасена', 1, function (P, b, t) { P.knock(b, t, 0.2, 900); P.thud(b, t + 0.01, 110, 0.22, 0.2); P.swoosh(b, t + 0.1, false, 0.3, 0.07); });
DEF('liquidation', 'futures', 'Ликвидация', 'Маржа сгорела — драматично, но без жести', 2.2, function (P, b, t) { for (var k = 0; k < 3; k++) P.buzz(b, t + k * 0.2, 0.12, 0.1); P.crack(b, t + 0.65, 0.2); deflate(b, t + 0.7, 1.1, 0.14); P.thud(b, t + 0.65, 60, 0.4, 0.6); });
DEF('funding', 'futures', 'Фандинг', 'Раз в час: списание/начисление', 0.5, function (P, b, t) { P.rustle(b, t, 0.15, 0.08); P.coin(b, t + 0.15, 0.1, 0.9); });
DEF('margin', 'futures', 'Долить маржу / перевод', 'Деньги спот → фьючерсы', 0.7, function (P, b, t) { P.swoosh(b, t, true, 0.2, 0.08); coins(P, b, t + 0.1, 4, 0.2, 0.09, 15); P.knock(b, t + 0.35, 0.14); });

/* Портфель */
DEF('period', 'portfolio', 'Период графика', '30м · 1ч · 3ч · Всё', 0.3, function (P, b, t) { P.click(b, t, 0.15, 2800); });
DEF('pnl_count', 'portfolio', 'Счётчик капитала', 'Одометр докручивает сумму', 1.3, function (P, b, t) { var tt = 0, gap = 0.03; while (tt < 0.95) { P.click(b, t + tt, 0.07, 3400); tt += gap; gap *= 1.07; } P.knock(b, t + tt + 0.02, 0.16); });
DEF('scrub', 'portfolio', 'Скраб по графику', 'Палец ведёт по кривой капитала', 0.7, function (P, b, t) { P.rustle(b, t, 0.55, 0.06); for (var i = 0; i < 6; i++) P.click(b, t + i * 0.09, 0.04, 2500 + (i % 3) * 600); });
DEF('pie', 'portfolio', 'Сектор распределения', 'Тап по сектору диаграммы', 0.4, function (P, b, t) { P.pop(b, t, 0.15, 4400); P.click(b, t + 0.02, 0.08); });

/* Рейтинг */
DEF('rank_up', 'rating', 'Место выросло', 'Обогнал соседа / новый ранг', 1.3, function (P, b, t) { P.swoosh(b, t, true, 0.3, 0.12); P.knock(b, t + 0.3, 0.18, 1600); P.thud(b, t + 0.3, 150, 0.2, 0.15); P.sparkle(b, t + 0.32, 0.5, 0.08); });
DEF('rank_down', 'rating', 'Место упало', 'Тебя обогнали', 0.8, function (P, b, t) { P.swoosh(b, t, false, 0.28, 0.1); P.thud(b, t + 0.28, 90, 0.16, 0.2); });
DEF('podium', 'rating', 'Пьедестал (топ-3)', 'Попал на пьедестал', 2.6, function (P, b, t) { each([0, 0.3, 0.6], function (o, i) { P.thud(b, t + o, 80, 0.22 + i * 0.04, 0.25); P.knock(b, t + o, 0.1, 900); }); crowd(b, t + 0.6, 1.8, 0.07); P.sparkle(b, t + 0.62, 1.2, 0.1); coins(P, b, t + 0.7, 8, 0.8, 0.07, 17); });
DEF('refresh', 'rating', 'Обновить рейтинг', 'Кнопка «сейчас» / потянуть вниз', 0.5, function (P, b, t) { P.rustle(b, t, 0.2, 0.08); P.swoosh(b, t + 0.05, true, 0.18, 0.06); P.click(b, t + 0.24, 0.14); });

/* Профиль */
DEF('achievement', 'profile', 'Достижение открыто', 'Окно «Достижение открыто»', 2, function (P, b, t) { P.swoosh(b, t, true, 0.3, 0.1); P.thud(b, t + 0.3, 100, 0.26, 0.3); P.knock(b, t + 0.3, 0.16, 1300); P.sparkle(b, t + 0.32, 1, 0.12); });
DEF('level_up', 'profile', 'Новый класс трейдера', 'Новичок → Ученик → … → Легенда', 2.8, function (P, b, t) { P.rustle(b, t, 0.5, 0.08); P.swoosh(b, t + 0.1, true, 0.55, 0.14); P.thud(b, t + 0.65, 70, 0.36, 0.5); P.crack(b, t + 0.65, 0.06); coins(P, b, t + 0.75, 12, 1, 0.09, 19); P.sparkle(b, t + 0.7, 1.5, 0.12); });
DEF('equip', 'profile', 'Надеть титул / рамку', 'Примерочная: «Надеть»', 0.5, function (P, b, t) { P.swoosh(b, t, true, 0.1, 0.05); P.knock(b, t + 0.08, 0.18, 1500); P.click(b, t + 0.12, 0.1); });
DEF('avatar', 'profile', 'Выбор аватарки', 'Тап по аватарке в сетке', 0.4, function (P, b, t) { P.pop(b, t, 0.15, 4800); });
DEF('ach_points', 'profile', 'Очки достижений', '«Забрать» — скидка комиссии растёт', 0.9, function (P, b, t) { P.knock(b, t, 0.16); coins(P, b, t + 0.08, 5, 0.3, 0.1, 21); P.pop(b, t + 0.45, 0.12, 6000); });

/* Колесо */
DEF('spin_start', 'wheel', 'Старт колеса', 'Колесо сорвалось с места', 1, function (P, b, t) { P.knock(b, t, 0.2, 800); P.swoosh(b, t + 0.02, true, 0.6, 0.14); for (var i = 0; i < 8; i++) P.click(b, t + 0.1 + i * 0.07 * (1 - i * 0.07), 0.08, 2600); });
DEF('wheel_ticks', 'wheel', 'Щелчки по секторам', 'Замедляются вместе с колесом', 4, function (P, b, t) { var tt = 0, gap = 0.04; while (tt < 3.6) { P.click(b, t + tt, 0.1, 2800); tt += gap; gap *= 1.085; } P.knock(b, t + tt, 0.14, 1200); });
DEF('win_small', 'wheel', 'Обычный приз', '$, скидка комиссии', 1.4, function (P, b, t) { P.thud(b, t, 130, 0.2, 0.2); P.pop(b, t + 0.05, 0.14, 5600); coins(P, b, t + 0.1, 6, 0.5, 0.1, 23); });
DEF('win_big', 'wheel', 'Джекпот-сектор', 'Самый крупный приз', 3, function (P, b, t) { P.thud(b, t, 70, 0.34, 0.5); P.crack(b, t, 0.05); P.swoosh(b, t + 0.05, true, 0.4, 0.12); coins(P, b, t + 0.3, 26, 1.8, 0.1, 25); P.sparkle(b, t + 0.35, 2, 0.12); crowd(b, t + 0.4, 1.6, 0.05); });
DEF('near_miss', 'wheel', '«Совсем рядом был»', 'Стрелка остановилась у джекпота', 1.2, function (P, b, t) { P.click(b, t, 0.14, 2800); P.click(b, t + 0.28, 0.12, 2800); P.click(b, t + 0.62, 0.1, 2800); deflate(b, t + 0.65, 0.45, 0.08); });

/* Уведомления */
DEF('price_alert', 'alerts', 'Алерт цены', 'Цена дошла до уровня', 1, function (P, b, t) { P.pop(b, t, 0.2, 5600); P.pop(b, t + 0.12, 0.2, 5600); P.knock(b, t + 0.24, 0.12, 1800); P.sparkle(b, t + 0.25, 0.25, 0.07); });
DEF('move_alert', 'alerts', 'Резкое движение', 'Монета ±5% за короткое время', 0.8, function (P, b, t) { P.swoosh(b, t, true, 0.22, 0.13); P.knock(b, t + 0.2, 0.18, 1400); P.knock(b, t + 0.28, 0.14, 1400); });
DEF('news_alert', 'alerts', 'Новость по монете', 'Новость по избранной монете', 1, function (P, b, t) { P.rustle(b, t, 0.4, 0.12); P.pop(b, t + 0.4, 0.16); });
DEF('alert_set', 'alerts', 'Алерт создан', 'Колокольчик на монете включён', 0.6, function (P, b, t) { P.click(b, t, 0.14); P.pop(b, t + 0.06, 0.14, 6500); });
/* ===================== Музыка ===================== */
function mkI(b) {
  return {
    kick: function (t, g) { g = g == null ? 0.8 : g; T(b, t, { f: 160, f2: 42, pt: 0.11, d: 0.38, g: g }); N(b, t, { d: 0.02, g: g * 0.2, ft: 'highpass', fc: 3000 }); },
    snare: function (t, g, rv) { g = g == null ? 0.35 : g; N(b, t, { d: 0.2, g: g, ft: 'bandpass', fc: 1900, q: 0.8, rv: rv == null ? 0.25 : rv }); T(b, t, { f: 200, f2: 150, d: 0.11, g: g * 0.6, type: 'triangle' }); },
    clap: function (t, g) { g = g || 0.3; for (var i = 0; i < 3; i++) N(b, t + i * 0.011, { d: i === 2 ? 0.16 : 0.02, g: g, ft: 'bandpass', fc: 1300, q: 1.2, rv: 0.3 }); },
    hat: function (t, g, open) { N(b, t, { d: open ? 0.22 : 0.045, g: g || 0.1, ft: 'highpass', fc: 7500 }); },
    shaker: function (t, g) { N(b, t, { d: 0.07, a: 0.02, g: g || 0.06, ft: 'bandpass', fc: 5000, q: 0.6 }); },
    tick: function (t, g) { T(b, t, { f: 4200, d: 0.018, g: g || 0.05 }); },
    rim: function (t, g) { T(b, t, { f: 1700, d: 0.03, g: g || 0.1, type: 'triangle' }); N(b, t, { d: 0.012, g: (g || 0.1) * 0.5, ft: 'highpass', fc: 2500 }); },
    tom: function (t, f, g) { f = f || 110; T(b, t, { f: f * 1.6, f2: f, pt: 0.08, d: 0.45, g: g || 0.45, rv: 0.3 }); },
    timp: function (t, f, g) { f = f || 65; g = g || 0.55; T(b, t, { f: f * 1.3, f2: f, pt: 0.05, d: 1.1, g: g, rv: 0.5 }); N(b, t, { d: 0.08, g: g * 0.2, ft: 'lowpass', fc: 500 }); },
    crackle: function (t, d) { N(b, t, { d: d, a: 0.05, s: d * 0.8, g: 0.01, ft: 'highpass', fc: 2500 }); },
    sub: function (t, f, d, g) { T(b, t, { f: f, d: d, g: g || 0.35, a: 0.01, s: d * 0.6 }); },
    bass: function (t, f, d, g, type, fc) { fc = fc || 700; T(b, t, { f: f, d: d, g: g || 0.3, type: type || 'sawtooth', fc: fc, fc2: fc * 0.4, q: 3, a: 0.006, s: d * 0.5 }); },
    tri: function (t, f, d, g) { T(b, t, { f: f, d: d, g: g || 0.22, type: 'triangle', a: 0.005, s: d * 0.7 }); },
    sq: function (t, f, d, g) { T(b, t, { f: f, d: d, g: g || 0.06, type: 'square', fc: 2800, a: 0.004, s: d * 0.6, dl: 0.2 }); },
    pad: function (t, ns, d, g, type, fc) { each(ns, function (n) { [-9, 9].forEach(function (det) { T(b, t, { f: m(n), det: det, d: d, g: g || 0.06, type: type || 'sawtooth', fc: fc || 1400, a: Math.min(0.6, d * 0.3), s: d * 0.4, rv: 0.5 }); }); }); },
    rhodes: function (t, ns, d, g) { each(ns, function (n, i) { FM(b, t + i * 0.008, { f: m(n), r: 1, ix: 0.8, d: d, g: g || 0.08, rv: 0.3 }); }); },
    stab: function (t, ns, g, fc) { each(ns, function (n) { T(b, t, { f: m(n), d: 0.22, g: g || 0.05, type: 'sawtooth', fc: fc || 2200, fc2: 300, rv: 0.25 }); }); },
    pluck: function (t, f, g, type, d) { T(b, t, { f: f, d: d || 0.3, g: g || 0.1, type: type || 'sawtooth', fc: 4000, fc2: 300, dl: 0.25, rv: 0.15 }); },
    bell: function (t, f, g, d) { FM(b, t, { f: f, r: 3.5, ix: 2, d: d || 1.2, g: g || 0.08, rv: 0.45 }); },
    mar: function (t, f, g, d) { T(b, t, { f: f, d: d || 0.5, g: g || 0.16, rv: 0.2 }); T(b, t, { f: f * 4, d: 0.07, g: (g || 0.16) * 0.3 }); },
    lead: function (t, f, d, g, type) { T(b, t, { f: f, d: d, g: g || 0.07, type: type || 'triangle', a: 0.02, s: d * 0.6, vib: 5, rv: 0.3, dl: 0.25 }); },
    brass: function (t, ns, d, g) { each(ns, function (n) { T(b, t, { f: m(n), d: d, g: g || 0.05, type: 'sawtooth', fc: 500, fc2: 2600, a: 0.06, s: d * 0.5, rv: 0.4 }); }); },
    riser: function (t, d, g) { N(b, t, { d: d, a: d * 0.9, g: g || 0.1, ft: 'bandpass', fc: 400, fc2: 6000, q: 2, rv: 0.4 }); }
  };
}
var PENT = [72, 74, 76, 79, 81, 84];
function pk(arr, a, b) { return arr[Math.floor(hr(a, b) * arr.length) % arr.length]; }

/* Фоновая тема — Lo-fi, ~2:15 до повтора (44 такта по 78 BPM).
   Части: вступление → грув A → грув B с мелодией → брейк → грув C на
   второй гармонии → грув B → аутро. На стыках частей — сбивки и подъёмы,
   внутри частей — вариации ритма и комповки, чтобы петля не надоедала. */
/* Аккорд: r — корень для баса, n — голоса для клавиш. */
var PROG = [
  { r: 41, n: [53, 57, 60, 64] },  // Fmaj7
  { r: 40, n: [52, 55, 59, 62] },  // Em7
  { r: 38, n: [50, 53, 57, 60] },  // Dm7
  { r: 36, n: [48, 52, 55, 59] }   // Cmaj7
];
var PROG2 = [
  { r: 38, n: [53, 57, 60, 64] },  // Dm9
  { r: 43, n: [53, 57, 59, 64] },  // G13
  { r: 36, n: [52, 55, 59, 62] },  // Cmaj9
  { r: 45, n: [55, 60, 64, 67] }   // Am7
];
/* Мелодии: [шаг 16-х в двухтактовой фразе, нота, длина в 16-х]. */
var MEL = {
  b1: [[0, 76, 3], [3, 74, 1], [4, 72, 4], [10, 69, 2], [12, 72, 4], [16, 74, 3], [19, 76, 1], [20, 79, 6], [28, 76, 4]],
  b2: [[2, 81, 2], [4, 79, 2], [6, 76, 4], [12, 74, 2], [14, 72, 2], [16, 74, 6], [24, 72, 2], [26, 69, 6]],
  c1: [[0, 77, 2], [2, 76, 2], [4, 74, 4], [8, 72, 2], [10, 74, 6], [16, 71, 2], [18, 72, 2], [20, 74, 4], [24, 79, 8]],
  c2: [[0, 81, 3], [3, 79, 1], [4, 77, 4], [10, 74, 2], [12, 76, 4], [16, 72, 6], [24, 74, 2], [26, 76, 2], [28, 72, 4]]
};
var SONG = [
  { id: 'in', bars: 4, p: PROG }, { id: 'a', bars: 8, p: PROG }, { id: 'b', bars: 8, p: PROG },
  { id: 'brk', bars: 4, p: PROG2 }, { id: 'c', bars: 8, p: PROG2 }, { id: 'b', bars: 8, p: PROG },
  { id: 'out', bars: 4, p: PROG }
];
var SONG_LEN = SONG.reduce(function (a, x) { return a + x.bars; }, 0);
function where(bar) {
  var b = bar % SONG_LEN;
  for (var i = 0; i < SONG.length; i++) { if (b < SONG[i].bars) return { sec: SONG[i], i: b, last: b === SONG[i].bars - 1, lap: Math.floor(bar / SONG_LEN) }; b -= SONG[i].bars; }
  return { sec: SONG[0], i: 0, last: false, lap: 0 };
}
function melody(I, t, s, w, sp, key, g) {
  var ph = (w.i % 2) * 16 + s, ns = MEL[key];
  for (var i = 0; i < ns.length; i++) if (ns[i][0] === ph) I.lead(t, m(ns[i][1]), ns[i][2] * sp * 1.1, g, 'triangle');
}
var LOFI = { bpm: 78, swing: 0.18, step: function (I, t, s, bar, ch0, k, sp) {
    var w = where(bar), id = w.sec.id, P = w.sec.p, ch = P[w.i % P.length], nx = P[(w.i + 1) % P.length];
    var drums = id === 'a' || id === 'b' || id === 'c' || (id === 'out' && w.i < 2);
    var full = id === 'b' || id === 'c';
    /* Винил шуршит всегда. */
    if (s === 0) I.crackle(t, sp * 16);
    /* Клавиши: длинный аккорд на «раз», в грувах — подхват на 11-ю шестнадцатую. */
    if (s === 0) I.rhodes(t, ch.n, sp * (full ? 9 : 15), id === 'in' || id === 'out' ? 0.05 : 0.06);
    if (full && s === 10) I.rhodes(t, ch.n.slice(1), sp * 5, 0.04);
    if (id === 'a' && s === 14 && w.i % 2) I.rhodes(t, ch.n.slice(2), sp * 2, 0.035);
    /* Бас: во вступлении и A — мягкий саб, в грувах — партия с подходом к следующему корню. */
    if (id === 'in' || id === 'a' || id === 'out') {
      if (s === 0) I.sub(t, m(ch.r), sp * 7, 0.3);
      if (s === 8 && id !== 'in') I.sub(t, m(ch.r), sp * 6, 0.24);
    } else if (full) {
      if (s === 0) I.sub(t, m(ch.r), sp * 5, 0.3);
      if (s === 6) I.sub(t, m(ch.r), sp * 2, 0.2);
      if (s === 10) I.sub(t, m(ch.r + 7), sp * 3, 0.22);
      if (s === 14) I.sub(t, m(nx.r + (nx.r > ch.r ? -1 : 1)), sp * 2, 0.18);
    }
    /* Ударные. */
    if (drums) {
      var fill = w.last && id !== 'out';
      if (s === 0 || s === 10 || (s === 7 && (full || bar % 2))) I.kick(t, 0.55);
      if (full && s === 3 && w.i % 4 === 3) I.kick(t, 0.35);
      if ((s === 4 || s === 12) && !(fill && s === 12)) I.snare(t, 0.16, 0.3);
      if (full && s === 15 && w.i % 2 && !fill) I.snare(t, 0.05, 0.15);
      if (full) { if (s !== 14 || w.i % 2 === 0) I.hat(t, s % 4 === 0 ? 0.05 : s % 2 ? 0.018 : 0.032); if (s === 14 && w.i % 2) I.hat(t, 0.04, true); }
      else if (s % 2 === 0) I.hat(t, s % 4 ? 0.03 : 0.05);
      if (fill) {
        if (s === 12) I.snare(t, 0.1, 0.2);
        if (s === 13) I.snare(t, 0.08, 0.2);
        if (s === 14) I.tom(t, 150, 0.22);
        if (s === 15) I.tom(t, 110, 0.24);
      }
    } else if (id === 'in') {
      if (s % 4 === 2) I.shaker(t, 0.04);
      if (w.i >= 2 && (s === 4 || s === 12)) I.rim(t, 0.06);
      if (w.last && s === 0) I.riser(t, sp * 16, 0.05);
    } else if (id === 'brk') {
      if (s === 0) I.pad(t, ch.n, sp * 16, 0.025, 'sawtooth', 900);
      if (s % 2 === 0) I.mar(t, m(ch.n[(s / 2) % ch.n.length] + 12), 0.07, 0.4);
      if (s === 4 || s === 12) I.rim(t, 0.07);
      if (s % 4 === 2) I.shaker(t, 0.035);
      if (w.last && s === 0) I.riser(t, sp * 16, 0.06);
    } else if (id === 'out') {
      if (s === 0 && w.last) I.bell(t + sp * 8, m(72), 0.04, 2.5);
    }
    /* Мелодия. */
    if (id === 'b') melody(I, t, s, w, sp, w.i < 4 ? 'b1' : 'b2', 0.055);
    if (id === 'c') melody(I, t, s, w, sp, w.i < 4 ? 'c1' : 'c2', 0.055);
    /* Колокольчики-«блёстки» в тихих местах. */
    if ((id === 'a' || id === 'in' || id === 'out') && k > 0.35 && [2, 6, 9, 14].indexOf(s) >= 0 && hr(bar, s) > (id === 'a' ? 0.45 : 0.6)) I.bell(t, m(pk(PENT, s, bar)), 0.04, 1);
  } };

/* ===================== Игра: выбор звуков (утверждён по концепту) ===================== */
var CFG = {
  pack: 'metal',
  sfx: {
    tap: 'metal', tab: 'paper', sheet_open: 'digital', sheet_close: 'digital', toggle: 'paper', error: 'paper',
    toast: 'metal', popup: 'paper', bonus: 'metal', coin_hit: 'digital', streak: 'paper', quest_done: 'metal',
    chest: 'metal', xp: 'metal', tick_up: 'metal', tick_down: 'metal', open_coin: 'paper', fav_add: 'paper',
    fav_remove: 'paper', sort: 'metal', news_strong: 'metal', chip: 'paper', slider: 'metal', buy: 'metal',
    sell_profit: 'metal', sell_loss: 'paper', limit_place: 'metal', limit_fill: 'digital', order_cancel: 'metal',
    long: 'metal', short: 'metal', leverage: 'metal', tp: 'metal', sl: 'metal', liquidation: 'paper',
    funding: 'metal', margin: 'metal', period: 'metal', pnl_count: 'metal', scrub: 'metal', pie: 'paper',
    rank_up: 'paper', rank_down: 'metal', podium: 'metal', refresh: 'metal', achievement: 'metal',
    level_up: 'metal', equip: 'metal', avatar: 'metal', ach_points: 'metal', spin_start: 'metal',
    wheel_ticks: 'metal', win_small: 'metal', win_big: 'metal', near_miss: 'metal', price_alert: 'metal',
    move_alert: 'metal', news_alert: 'metal', alert_set: 'metal', pass_level: 'metal', daily_stamp: 'metal'
  },
  music: 'Lo-fi'
};
var PIDX = { metal: 0, paper: 1, digital: 2 };
/* Одиночные «шаги» для живых жестов: ползунок, плечо, щелчок сектора колеса.
   Материал — как у соответствующего полного звука. */
DEF('slider_step', 'trade', '', '', 0.2, function (P, b, t, v, f) { P.click(b, t, 0.05 + f * 0.08, 2000 + f * 2600); });
DEF('lev_step', 'futures', '', '', 0.2, function (P, b, t, v, f) { P.click(b, t, 0.07 + f * 0.12, 1800 + f * 2700); });
DEF('wheel_tick', 'wheel', '', '', 0.2, function (P, b, t) { P.click(b, t, 0.1, 2800); });
DEF('wheel_stop', 'wheel', '', '', 0.3, function (P, b, t) { P.knock(b, t, 0.14, 1200); });
DEF('scrub_step', 'portfolio', '', '', 0.2, function (P, b, t, v, f) { P.click(b, t, 0.035, 2500 + f * 1200); });
/* Новый уровень пропуска заданий (в концепте не было): взлёт, три
   нарастающих «пинга» ступенькой, удар-печать, искры и пара монет. */
DEF('pass_level', 'lobby', 'Новый уровень пропуска', 'Опыт перевалил за порог уровня', 1.8, function (P, b, t) {
  P.swoosh(b, t, true, 0.26, 0.1);
  each([0, 0.11, 0.22], function (o, i) { P.pop(b, t + 0.2 + o, 0.13 + i * 0.03, 4000 + i * 1200); });
  P.thud(b, t + 0.52, 110, 0.24, 0.26); P.knock(b, t + 0.52, 0.16, 1500);
  P.sparkle(b, t + 0.55, 0.7, 0.1); coins(P, b, t + 0.6, 5, 0.4, 0.08, 27);
});
/* «Печать» ежедневного бонуса: плитка дня получила галочку — удар,
   звонкий щелчок и короткие искры. Играет по приземлению монет. */
DEF('daily_stamp', 'lobby', 'Печать дня', 'Плитка сегодняшнего дня отмечена', 0.9, function (P, b, t) {
  P.thud(b, t, 150, 0.2, 0.14); P.knock(b, t, 0.18, 1500); P.click(b, t + 0.03, 0.14, 3600);
  P.pop(b, t + 0.12, 0.12, 6000); P.sparkle(b, t + 0.14, 0.4, 0.08);
});
var ALIAS = { slider_step: 'slider', lev_step: 'leverage', wheel_tick: 'wheel_ticks', wheel_stop: 'wheel_ticks', scrub_step: 'scrub' };
var BY = {}; SFX.forEach(function (s) { BY[s.id] = s; });
function packOf(id) { var k = CFG.sfx[ALIAS[id] || id] || CFG.pack; return PIDX[k] != null ? PIDX[k] : 0; }

/* ===================== Состояние и настройки ===================== */
var DEF_ST = { s: 1, m: 1, vs: 80, vm: 40 };
function st() {
  var G0 = window.S;
  if (!G0 || typeof G0 !== 'object') return DEF_ST;
  if (!G0.snd || typeof G0.snd !== 'object') G0.snd = {};
  return G0.snd;
}
function get(k) { var v = st()[k]; return (v == null || (typeof v === 'number' && !isFinite(v))) ? DEF_ST[k] : v; }

var ctx = null, G = null, paused = {}, INT = 0.5;
function isPaused() { for (var k in paused) if (paused[k]) return true; return false; }
function supported() { return !!(window.AudioContext || window.webkitAudioContext); }
function applyVol() {
  if (!G) return;
  var t = ctx.currentTime;
  G.sfx.out.gain.setTargetAtTime(get('s') ? get('vs') / 100 : 0, t, 0.05);
  G.music.out.gain.setTargetAtTime(get('m') ? 0.9 * get('vm') / 100 : 0, t, 0.05);
}
/* Контекст создаём только по жесту пользователя — иначе браузер
   оставит его в suspended и напишет предупреждение в консоль. */
function unlock() {
  if (!supported()) return;
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; return; }
    G = makeGraph(ctx, ctx.destination);
    applyVol();
  }
  if (ctx.state === 'suspended' && !isPaused()) { try { ctx.resume(); } catch (e) { /* */ } }
  syncMusic();
}
function live() { return ctx && G && ctx.state === 'running' && !isPaused(); }

/* ===================== Звуки ===================== */
var LOG = [], lastAt = {}, lastHard = 0, soft = null, softTimer = 0, duckTimer = 0;
var GAP = { tick_up: 1.5, tick_down: 1.5, tap: 0.04, slider_step: 0.03, lev_step: 0.03, scrub_step: 0.06, wheel_tick: 0.02, toast: 0.25, coin_hit: 0.08 };
function fire(id, f) {
  var s = BY[id]; if (!s || !get('s')) return;
  var now = ctx.currentTime, gap = GAP[id] != null ? GAP[id] : 0.06;
  if (lastAt[id] && now - lastAt[id] < gap) return;
  lastAt[id] = now;
  LOG.push(id); if (LOG.length > 60) LOG.shift();
  var t = now + 0.01, v = packOf(id);
  try { s.fn(PACKS[v], G.sfx, t, v, f == null ? 0.5 : f); } catch (e) { /* */ }
  /* Лёгкий дакинг музыки под крупные звуки. Держим текущее значение
     (cancelAndHoldAtTime), а не обрываем автоматизацию: при наложении
     звуков подряд громкость музыки раньше могла «зависнуть» внизу. */
  if (s.dur >= 0.9) duck(t, Math.min(1.2, s.dur * 0.5));
}
function duck(t, hold) {
  var p = G.music.post.gain;
  try {
    if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t);
    else { p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); }
  } catch (e) { p.cancelScheduledValues(t); }
  p.setTargetAtTime(0.75, t, 0.04);
  p.setTargetAtTime(1, t + hold, 0.3);
  /* Страховка: через секунду после хвоста музыка гарантированно на месте. */
  clearTimeout(duckTimer);
  duckTimer = setTimeout(function () { try { var n = ctx.currentTime; if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(n); else { p.cancelScheduledValues(n); p.setValueAtTime(p.value, n); } p.setTargetAtTime(1, n, 0.2); } catch (e) { /* */ } }, (hold + 1.5) * 1000);
}
/* tap и toast — «мягкие»: звучат, только если в тот же момент не
   прозвучало ничего содержательнее (покупка, ошибка, вкладка…). */
var SOFT = { tap: 1, chip: 1, period: 1, toggle: 1, sort: 1, equip: 1, toast: 2 };
function flushSoft() {
  softTimer = 0; var id = soft; soft = null;
  if (!id || !live()) return;
  var ago = (performance.now() - lastHard);
  if (ago < (id === 'toast' ? 1500 : 90)) return;
  fire(id);
}
/* Окна: шторки — sheet_open/close, центральные окна — popup,
   у наградных окон свой звук (или его играет вызывающий код). */
var MOD = { 'modal-ach': 'achievement', 'modal-levelup': 'level_up', 'modal-spin-prize': '', 'modal-qs-cer': '' };
var POP = { 'modal-avatar': 1, 'modal-name': 1, 'modal-v3p-item': 1, 'modal-qs-prem': 1, 'modal-aln': 1, 'modal-alc': 1, 'modal-rt': 1 };
function modal(id, open) {
  if (Object.prototype.hasOwnProperty.call(MOD, id)) { if (open && MOD[id]) play(MOD[id]); return; }
  if (POP[id]) { if (open) play('popup'); return; }
  play(open ? 'sheet_open' : 'sheet_close');
}
function play(id, f) {
  if (!live()) return;
  if (SOFT[id]) {
    if (!soft || SOFT[id] >= SOFT[soft]) soft = id;
    if (!softTimer) softTimer = setTimeout(flushSoft, 30);
    return;
  }
  if (id.slice(-5) !== '_step' && id !== 'wheel_tick' && id.slice(0, 5) !== 'tick_') lastHard = performance.now();
  if (soft && SOFT[soft] <= 2 && id.slice(0, 5) !== 'tick_') soft = null;
  fire(id, f);
}

/* ===================== Музыка ===================== */
var SEQ = null, seqTimer = 0;
function startMusic() {
  if (SEQ || !ctx) return;
  var now = ctx.currentTime, g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(1, now + 2);
  g.connect(G.music.in);
  G.music.dly.delayTime.setValueAtTime(60 / LOFI.bpm * 0.75, now);
  SEQ = { g: g, I: mkI({ c: ctx, in: g, rev: G.music.rev, dly: G.music.dly }), next: now + 0.1, step: 0 };
  if (!seqTimer) seqTimer = setInterval(seqTick, 50);
}
function stopMusic() {
  if (!SEQ) return;
  var s = SEQ; SEQ = null;
  try { s.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3); } catch (e) { /* */ }
  setTimeout(function () { try { s.g.disconnect(); } catch (e) { /* */ } }, 1800);
  if (seqTimer) { clearInterval(seqTimer); seqTimer = 0; }
}
function seqTick() {
  if (!SEQ || !ctx || ctx.state !== 'running') return;
  var now = ctx.currentTime, sp = 60 / LOFI.bpm / 4;
  /* После долгой паузы не догоняем пропущенные такты пачкой. */
  if (SEQ.next < now - 0.5) SEQ.next = now + 0.05;
  while (SEQ.next < now + 0.25) {
    var s = SEQ.step % 16, bar = Math.floor(SEQ.step / 16), t = SEQ.next;
    if (LOFI.swing && s % 2) t += sp * LOFI.swing;
    try { LOFI.step(SEQ.I, t, s, bar, null, INT, sp); } catch (e) { /* */ }
    SEQ.next += sp; SEQ.step++;
  }
}
function syncMusic() {
  if (!ctx) return;
  if (get('m') && get('vm') > 0) startMusic(); else stopMusic();
}

/* ===================== Пауза (реклама, фон, платформа) ===================== */
function pause(why) {
  paused[why || 'x'] = true;
  if (ctx && ctx.state === 'running') { try { ctx.suspend(); } catch (e) { /* */ } }
}
function resume(why) {
  paused[why || 'x'] = false;
  if (ctx && !isPaused() && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* */ } }
}
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') pause('hidden'); else resume('hidden'); });

/* Первый жест разблокирует звук. Тап по любой кнопке — мягкий «tap». */
['pointerdown', 'keydown', 'touchend'].forEach(function (ev) {
  window.addEventListener(ev, unlock, { capture: true, passive: true });
});
/* Смысловые щелчки интерфейса — по селектору; всё прочее кликабельное — tap.
   Все они «мягкие»: содержательный звук из кода игры их перекрывает. */
var UI = [
  ['toggle', '[role="switch"], .sg-seg button, [data-sg-th], [data-sg-lang], #fc-ctype button'],
  ['period', '[data-tf], #pf-periods button, #fc-tfs button'],
  ['chip', '#tr-pcts button, [data-pct], #fs-pcts button, #xf-pcts button, .fs-chips button, #fs-tp button, [data-offset], #fs-lev-ticks button, #fs-side button'],
  ['sort', '.mk-chip, .sort-opt, .dir-opt, .cat-opt, #fsort-apply'],
  ['equip', '[data-wear]']
];
document.addEventListener('click', function (e) {
  var tg = e.target && e.target.closest ? e.target : null;
  var el = tg && tg.closest('button, [role="button"], [role="tab"], [role="switch"], a, .tap, [data-tab], .asset-row, .fut-row');
  if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
  for (var i = 0; i < UI.length; i++) if (el.closest(UI[i][1])) { play(UI[i][0]); return; }
  play('tap');
}, true);
/* Ползунки: щелчок на шаг, выше и ярче к краю. Плечо — жёстче. */
document.addEventListener('input', function (e) {
  var r = e.target;
  if (!r || r.type !== 'range' || r.id === 'fs-lev-range') return;
  var lo = +r.min || 0, hi = r.max === '' ? 100 : +r.max, f = hi > lo ? (+r.value - lo) / (hi - lo) : 0;
  play('slider_step', Math.max(0, Math.min(1, f)));
}, true);

function set(k, v) {
  st()[k] = v;
  applyVol();
  if (k === 'm' || k === 'vm') syncMusic();
}

return {
  play: play,
  modal: modal,
  pause: pause,
  resume: resume,
  unlock: unlock,
  get: get,
  set: set,
  supported: supported,
  /* Для тестов: что сейчас звучит. */
  _log: LOG,
  _state: function () { return { ctx: ctx ? ctx.state : 'none', music: !!SEQ, paused: isPaused() }; }
};
})();
