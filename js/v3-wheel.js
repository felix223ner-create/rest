/* v3 — поведенческий слой «wheel» по concept/wheel.html: выпадение приза.
   Монета отрывается от выигравшего сектора, по дуге летит к центру,
   переворачиваясь; на приземлении — вспышка, волна, лучи и фонтан монет,
   из-под монеты раскрывается карточка. Закрытие уносит монету в капитал
   в шапке. Начисление приза не трогаем — только показ. */
'use strict';

var V3W = (function () {
  V3.i18n({
    ru: {
      wr_balance: 'Баланс:', wr_total: 'Всего:', wr_fee: 'Комиссия:', wr_near: 'Совсем рядом был',
      wr_fee_chip1: 'на {n} сделку', wr_fee_chip2: 'на {n} сделки', wr_fee_chip5: 'на {n} сделок',
      wr_toast_cap: 'Капитал {x}'
    },
    en: {
      wr_balance: 'Balance:', wr_total: 'Total:', wr_fee: 'Fee:', wr_near: 'So close:',
      wr_fee_chip1: 'for {n} trade', wr_fee_chip2: 'for {n} trades', wr_fee_chip5: 'for {n} trades',
      wr_toast_cap: 'Capital {x}'
    }
  });

  var SZ = 104;  // размер монеты приза, px (совпадает с .wr-medal)
  var RV = { open: false, closing: false, ctx: null, timers: [], m: null, trail: 0, hold: false, capShown: 0, capBefore: null, capStop: null };

  /* Длительности подчиняются --k, как в концепте (V3.D). */
  function D(ms) { return V3.D(ms); }
  function el(id) { return document.getElementById(id); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function restart(node, c) { if (!node) return; node.classList.remove(c); V3.reflow(node); node.classList.add(c); }
  function ctr(node) { var r = node.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }
  function later(fn, ms) { RV.timers.push(setTimeout(fn, D(ms))); }
  function clearTimers() { RV.timers.forEach(clearTimeout); RV.timers = []; cancelAnimationFrame(RV.trail); RV.trail = 0; }
  function T(x, y, s) { return 'translate(' + (x - SZ / 2).toFixed(1) + 'px,' + (y - SZ / 2).toFixed(1) + 'px) scale(' + s.toFixed(3) + ')'; }
  /* Web Animations с запасным путём: без el.animate или при «меньше
     движения» сразу ставим последний кадр и зовём onfinish. */
  function anim(node, frames, o) {
    var dur = D(o.duration);
    if (!node.animate || !dur) {
      var fake = { onfinish: null, cancel: function () {} };
      if (o.fill === 'forwards') { var last = frames[frames.length - 1]; for (var k in last) if (k !== 'offset') node.style[k] = last[k]; }
      setTimeout(function () { if (fake.onfinish) fake.onfinish(); }, 0);
      return fake;
    }
    var c = {}; for (var j in o) c[j] = o[j];
    c.duration = dur;
    if (c.delay) c.delay = D(c.delay);
    return node.animate(frames, c);
  }
  function coinImg(id) {
    var a = id && typeof assetById === 'function' ? assetById(id) : null;
    return a ? (a.img || 'img/coins/' + a.id + '.png') : '';
  }

  /* ---------------- Частицы на canvas ---------------- */

  var P = { cv: null, ctx: null, parts: [], raf: 0, last: 0, w: 0, h: 0, dpr: 1, spr: {}, light: false };
  function fxSize() {
    if (!P.cv) {
      P.cv = document.createElement('canvas');
      P.cv.className = 'wr-fx';
      P.cv.setAttribute('aria-hidden', 'true');
      document.body.appendChild(P.cv);
      P.ctx = P.cv.getContext('2d');
    }
    var w = window.innerWidth, h = window.innerHeight, d = Math.min(2, window.devicePixelRatio || 1);
    if (w === P.w && h === P.h && d === P.dpr) return;
    P.w = w; P.h = h; P.dpr = d;
    P.cv.width = Math.round(w * d);
    P.cv.height = Math.round(h * d);
  }
  /* Спрайт монеты рисуется один раз, дальше — только drawImage. */
  function coinSprite(id) {
    var key = id || 'gold';
    if (P.spr[key]) return P.spr[key];
    var c = document.createElement('canvas'), x = c.getContext('2d');
    c.width = c.height = 64;
    var g = x.createRadialGradient(22, 18, 4, 32, 32, 32);
    g.addColorStop(0, '#fff2b0'); g.addColorStop(0.45, '#eab63c'); g.addColorStop(1, '#9a650c');
    x.fillStyle = '#7a4d08'; x.beginPath(); x.arc(32, 32, 31, 0, 7); x.fill();
    x.fillStyle = g; x.beginPath(); x.arc(32, 32, 28, 0, 7); x.fill();
    x.strokeStyle = 'rgba(255,240,190,.7)'; x.lineWidth = 2; x.beginPath(); x.arc(32, 32, 22, 0, 7); x.stroke();
    var src = coinImg(id);
    if (src) {
      var img = new Image();
      img.onload = function () { x.save(); x.beginPath(); x.arc(32, 32, 19, 0, 7); x.clip(); x.drawImage(img, 13, 13, 38, 38); x.restore(); };
      img.src = src;
    } else {
      x.fillStyle = '#6b4306'; x.font = '900 30px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$', 32, 34);
    }
    P.spr[key] = c;
    return c;
  }
  function fxAdd(p) {
    if (V3.lite()) return;
    p.age = 0;
    P.parts.push(p);
    if (!P.raf) { P.last = 0; P.raf = requestAnimationFrame(fxLoop); }
  }
  function fxLoop(ts) {
    var dt = P.last ? Math.min(0.05, (ts - P.last) / 1000) / (V3.D(1) || 1) : 0.016, ctx = P.ctx;
    P.last = ts;
    ctx.setTransform(P.dpr, 0, 0, P.dpr, 0, 0);
    ctx.clearRect(0, 0, P.w, P.h);
    for (var i = P.parts.length - 1; i >= 0; i--) {
      var p = P.parts[i];
      p.age += dt;
      if (p.age >= p.life) { P.parts.splice(i, 1); continue; }
      var k = Math.pow(p.drag, dt * 60);
      p.vx *= k; p.vy = p.vy * k + p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += p.vr * dt;
      var life = p.age / p.life, al = life < 0.7 ? 1 : 1 - (life - 0.7) / 0.3;
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.kind === 'spark') {
        /* На светлой теме «lighter» даёт белое на белом — рисуем обычным наложением. */
        ctx.globalCompositeOperation = P.light ? 'source-over' : 'lighter';
        ctx.globalAlpha = (1 - life) * 0.9;
        var r0 = p.size * (1 - life * 0.5), gr = ctx.createRadialGradient(0, 0, 0, 0, 0, r0 * 3);
        gr.addColorStop(0, p.color); gr.addColorStop(0.35, p.color); gr.addColorStop(1, 'rgba(255,190,60,0)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(0, 0, r0 * 3, 0, 7); ctx.fill();
      } else if (p.kind === 'coin') {
        ctx.globalAlpha = al;
        ctx.rotate(p.rot);
        ctx.scale(Math.abs(Math.cos(p.age * p.flip)) * 0.85 + 0.15, 1);
        ctx.drawImage(coinSprite(p.id), -p.size, -p.size, p.size * 2, p.size * 2);
      } else if (p.kind === 'conf') {
        ctx.globalAlpha = al;
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.age * p.flip));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.globalAlpha = (1 - life) * 0.55;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(0, 0, p.size * (1 + life * 1.6), 0, 7); ctx.fill();
      }
      ctx.restore();
    }
    P.raf = P.parts.length ? requestAnimationFrame(fxLoop) : 0;
    if (!P.raf) ctx.clearRect(0, 0, P.w, P.h);
  }
  var SPARK = ['#fff7d6', '#ffe08a', '#ffc94d', '#fff'];
  var SPARK_L = ['#f2b73a', '#e0a020', '#c98f1b', '#ffd35a'];
  function sparks(x, y, n, speed) {
    if (V3.reduced()) return;
    var pal = P.light ? SPARK_L : SPARK;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = rnd(speed * 0.4, speed);
      fxAdd({ kind: 'spark', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0, drag: 0.9, life: rnd(0.4, 0.75), size: rnd(1.6, 3.2), rot: 0, vr: 0, color: pal[i % 4] });
    }
  }
  function fountain(x, y, n, id) {
    if (V3.reduced()) return;
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + rnd(-1, 1), v = rnd(420, 860);
      fxAdd({ kind: 'coin', x: x, y: y, vx: Math.cos(a) * v * 0.8, vy: Math.sin(a) * v, g: 1500, drag: 0.992, life: rnd(1.3, 1.9), size: rnd(7, 12), rot: rnd(-1, 1), vr: rnd(-6, 6), flip: rnd(6, 14), id: id && i % 3 === 0 ? id : null });
    }
  }
  var CONF = ['#ffd35a', '#fff3c4', '#e9b640', '#2fbe6e', '#4da3ff', '#ff7a90', '#b57bff'];
  function confetti(n, ms) {
    if (V3.reduced()) return;
    var i = 0, per = Math.max(1, Math.round(n / (D(ms) / 50 || 1))), iv = setInterval(function () {
      for (var j = 0; j < per && i < n; j++, i++) fxAdd({ kind: 'conf', x: rnd(0, P.w), y: -10, vx: rnd(-40, 40), vy: rnd(90, 190), g: 160, drag: 0.99, life: rnd(2.2, 3.4), size: rnd(7, 11), rot: rnd(0, 6), vr: rnd(-5, 5), flip: rnd(5, 10), color: CONF[(i * 7) % CONF.length] });
      if (i >= n) clearInterval(iv);
    }, 50);
  }
  function dust(x, y, n) {
    if (V3.reduced()) return;
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + rnd(-1.3, 1.3), v = rnd(30, 120);
      fxAdd({ kind: 'dust', x: x + rnd(-10, 10), y: y + rnd(-4, 4), vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: -20, drag: 0.94, life: rnd(0.7, 1.1), size: rnd(3, 6), rot: 0, vr: 0, color: P.light ? 'rgba(120,110,90,1)' : 'rgba(170,180,200,1)' });
    }
  }

  /* ---------------- Монета приза ---------------- */

  var tok = null, tok3d = null;
  function token() {
    if (tok) return tok;
    tok = document.createElement('div');
    tok.className = 'wr-tok';
    tok.hidden = true;
    tok.setAttribute('aria-hidden', 'true');
    tok.innerHTML = '<div class="wr-tok-3d"><span class="wr-tf f"></span><span class="wr-te"></span><span class="wr-tf b"></span></div><span class="wr-tok-shine"></span>';
    document.body.appendChild(tok);
    tok3d = tok.firstChild;
    return tok;
  }
  function stopTok() {
    [tok, tok3d].forEach(function (n) { if (n && n.getAnimations) n.getAnimations().forEach(function (a) { a.cancel(); }); });
  }
  function hideTok() { if (!tok) return; stopTok(); tok.hidden = true; tok.className = 'wr-tok'; }
  function faceHtml(res, sec) {
    if (res.kind === 'crypto') return '<img src="' + V3.esc(coinImg(sec && sec.id)) + '" alt="" draggable="false">';
    return res.kind === 'commission' ? '%' : '$';
  }

  /* Точка на колесе под стрелкой: r — радиус в единицах viewBox (0..200). */
  function wheelPt(r) {
    var p = spinScreenPt(SPIN_C, SPIN_C - r), svg = el('spin-svg');
    var w = svg ? svg.getBoundingClientRect().width : 200;
    return { x: p.x, y: p.y, k: (w || 200) / 200 };
  }
  function restoreIcons() {
    var gone = document.querySelectorAll('#spin-sectors .spin-sic.gone');
    for (var i = 0; i < gone.length; i++) gone[i].classList.remove('gone');
  }

  /* ---------------- Карточка ---------------- */

  var ICO = {
    wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M20 7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/><circle cx="16.5" cy="13.5" r="1.4" fill="currentColor" stroke="none"/>',
    bag: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
    tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  };
  function icoSvg(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICO[k] + '</svg>'; }
  function smallIcon(sec) {
    if (sec && sec.type === 'crypto' && sec.id) return '<img src="' + V3.esc(coinImg(sec.id)) + '" alt="" draggable="false">';
    return '<span class="dl">' + (sec && sec.type === 'commission' ? '%' : '$') + '</span>';
  }
  function secLabel(s) { return String((s && s.label && (s.label[LANG] || s.label.en)) || ''); }
  function letters(node, text) {
    node.setAttribute('aria-label', text);
    node.innerHTML = Array.prototype.map.call(text, function (ch, i) {
      return '<span class="wr-lt" aria-hidden="true" style="--i:' + i + '">' + (ch === ' ' ? '&nbsp;' : V3.esc(ch)) + '</span>';
    }).join('');
  }
  function feeChip(n) {
    var k = 'wr_fee_chip5';
    if (LANG === 'ru') { var m10 = n % 10, m100 = n % 100; if (m10 === 1 && m100 !== 11) k = 'wr_fee_chip1'; else if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) k = 'wr_fee_chip2'; }
    else if (n === 1) k = 'wr_fee_chip1';
    return t(k, { n: n });
  }
  function pctStr(rate) { return (Math.round(rate * 10000) / 100) + '%'; }
  function valFmt(res) {
    if (res.kind === 'commission') return function (v) { return '\u2212' + Math.round(v) + '%'; };
    return function (v) { return '+' + money(Math.round(v), 0); };
  }
  function valNum(res) { return res.kind === 'commission' ? res.pct : res.usd; }

  /* Баланс «до → после» для строки под суммой. */
  function balPair(ctx) {
    var res = ctx.res;
    if (res.kind === 'usd') return { a: S.balance - res.usd, b: S.balance, fmt: function (x) { return t('wr_balance') + ' ' + money(x, 0); } };
    var pos = ctx.sec && ctx.sec.id ? S.positions[ctx.sec.id] : null, q = pos ? pos.qty : res.qty;
    return { a: Math.max(0, q - res.qty), b: q, fmt: function (x) { return t('wr_total') + ' ' + fmtQty(x) + ' ' + res.ticker; } };
  }

  function fill(ctx) {
    var res = ctx.res, sec = ctx.sec, near = el('sp-near'), chip = el('sp-chip'), bal = el('sp-balance'), val = el('sr-value');
    el('sr-label').textContent = res ? t('spin_congrats') : '';
    letters(el('sp-title'), ctx.jack ? t('spin_jackpot') : res ? t('spin_win') : t('spin_miss'));
    el('sp-panel').hidden = !res;
    near.hidden = !!res;
    chip.hidden = !res || res.kind === 'usd';
    if (bal.__v3stop) bal.__v3stop();
    bal.innerHTML = '';
    if (!res) {
      /* Честная подсказка: из двух соседей — тот, что с призом крупнее. */
      var secs = ctx.secs, n = secs.length, i = ctx.idx < 0 ? 0 : ctx.idx;
      var a = secs[(i + n - 1) % n], b = secs[(i + 1) % n], best = (b && (b.usd || 0)) > (a && (a.usd || 0)) ? b : a;
      near.innerHTML = best && best.type !== 'miss'
        ? V3.esc(t('wr_near')) + ' ' + smallIcon(best) + '<b>' + V3.esc(secLabel(best)) + '</b>' : '';
      near.hidden = !near.innerHTML;
      el('sp-ico').innerHTML = icoSvg('clock');
      el('sr-sub').textContent = t('spin_miss_sub');
      return;
    }
    /* Табло заранее собрано из нулей: сумма докрутится при раскрытии. */
    var zero = valFmt(res)(valNum(res)).replace(/\d/g, '0');
    val.innerHTML = V3.odoHTML(zero);
    /* Барабаны докручиваются лесенкой по цифрам, а не по символам. */
    var reels = val.querySelectorAll('.odo-d > span');
    for (var r = 0; r < reels.length; r++) reels[r].style.transitionDelay = 'calc(var(--k) * ' + (r * 70) + 'ms)';
    val.__odoTxt = zero;
    val.__odoV = null;
    val.setAttribute('aria-label', valFmt(res)(valNum(res)));
    if (res.kind === 'crypto') {
      chip.innerHTML = smallIcon(sec) + '<b class="mono">+' + V3.esc(fmtQty(res.qty) + ' ' + res.ticker) + '</b>';
      el('sp-ico').innerHTML = icoSvg('bag');
      el('sr-sub').textContent = t('spin_added_pf');
    } else if (res.kind === 'commission') {
      chip.innerHTML = smallIcon(sec) + '<b>' + V3.esc(feeChip(res.trades)) + '</b>';
      el('sp-ico').innerHTML = icoSvg('tag');
      el('sr-sub').textContent = t('spin_fee_sub', { n: res.trades });
      var now = tradeFeeRate(), fixed = typeof FEE_FIXED !== 'undefined' && FEE_FIXED > 0;
      var base = !fixed && S.feeDiscPct > 0 && S.feeDiscPct < 100 ? now / (1 - S.feeDiscPct / 100) : now;
      bal.innerHTML = V3.esc(t('wr_fee')) + ' ' + (base !== now ? '<s>' + pctStr(base) + '</s>\u2192 ' : '') + pctStr(now);
    } else {
      el('sp-ico').innerHTML = icoSvg('wallet');
      el('sr-sub').textContent = t('spin_added_cash');
    }
    if (res.kind !== 'commission') { var p = balPair(ctx); bal.__v3v = p.a; bal.textContent = p.fmt(p.a); }
  }

  /* ---------------- Выпадение ---------------- */

  function modal() { return el('modal-spin-prize'); }
  function card() { return el('wr-card'); }
  function body() { return el('spin-body'); }

  function show(sec, res, jack) {
    var m0 = modal(), c = card();
    if (!m0 || !c) return;
    hardClose();
    var secs = spinSectors();
    var ctx = RV.ctx = { sec: sec, res: res, jack: !!jack, secs: secs, idx: secs.indexOf(sec) };
    RV.open = true;
    RV.closing = false;
    var th = document.documentElement.getAttribute('data-theme');
    P.light = th === 'light' || th === 'dawn';
    /* Капитал в шапке держим на «до», пока монета не долетит до него. */
    RV.hold = !!(res && res.kind !== 'commission' && RV.capBefore != null);
    RV.capShown = RV.capBefore != null ? RV.capBefore : capital();
    fill(ctx);
    m0.classList.remove('wr-on', 'wr-hit', 'wr-closing');
    m0.classList.toggle('is-miss', !res);
    m0.classList.toggle('is-jackpot', !!jack);
    c.className = 'spin-prize wr-card';
    openModal('modal-spin-prize');
    Snd.play(jack ? 'win_big' : res ? 'win_small' : 'near_miss');
    fxSize();
    var m = RV.m = ctr(el('sp-medal'));
    m0.style.setProperty('--mx', m.x + 'px');
    m0.style.setProperty('--my', m.y + 'px');
    V3.reflow(m0);
    m0.classList.add('wr-on');
    if (body()) body().classList.add('is-deep');
    if (!res) { missSeq(); return; }
    token();
    tok.className = 'wr-tok' + (jack ? ' jack' : '') + (res.kind === 'commission' ? ' fee' : '');
    var faces = tok.querySelectorAll('.wr-tf'), fh = faceHtml(res, sec);
    for (var i = 0; i < faces.length; i++) faces[i].innerHTML = fh;
    stopTok();
    tok.hidden = false;
    if (V3.reduced()) { tok.style.transform = T(m.x, m.y, 1); impact(ctx, true); return; }
    fly(ctx, m);
  }

  /* Монета отрывается от сектора, подскакивает и по дуге летит в центр. */
  function fly(ctx, m) {
    var s = wheelPt(SPIN_ICON_R), s0 = (8.4 + 1.6) * 2 * s.k / SZ, jack = ctx.jack;
    var sic = el('spin-sic-' + ctx.idx);
    if (sic) sic.classList.add('gone');
    tok.style.transform = T(s.x, s.y, s0);
    sparks(s.x, s.y, 12, 160);
    var lx = s.x, ly = s.y - 30;
    var pop = anim(tok, [
      { transform: T(s.x, s.y, s0) },
      { transform: T(s.x, s.y - 14, s0 * 1.7), offset: 0.5 },
      { transform: T(lx, ly, s0 * 1.5) }
    ], { duration: 320, easing: 'cubic-bezier(.3,1.5,.5,1)', fill: 'forwards' });
    anim(tok3d, [{ transform: 'rotateZ(0)' }, { transform: 'rotateZ(-14deg)', offset: 0.4 }, { transform: 'rotateZ(10deg)', offset: 0.75 }, { transform: 'rotateZ(0)' }], { duration: 320 });
    pop.onfinish = function () {
      if (!RV.open || RV.closing) return;
      var side = (Math.random() < 0.5 ? -1 : 1) * rnd(50, 90), cx = V3.lerp(lx, m.x, 0.5) + side, cy = Math.min(ly, m.y) - rnd(70, 110), fr = [];
      for (var i = 0; i <= 20; i++) {
        var q = i / 20, u = 1 - q, x = u * u * lx + 2 * u * q * cx + q * q * m.x, y = u * u * ly + 2 * u * q * cy + q * q * m.y;
        fr.push({ transform: T(x, y, V3.lerp(s0 * 1.5, 1, V3.easeOut(q))) });
      }
      var dur = jack ? 1050 : 880, turns = jack ? 1080 : 720;
      var fl = anim(tok, fr, { duration: dur, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'forwards' });
      anim(tok3d, [{ transform: 'rotateY(0) rotateZ(0)' }, { transform: 'rotateY(' + turns * 0.8 + 'deg) rotateZ(-10deg)', offset: 0.7 }, { transform: 'rotateY(' + turns + 'deg) rotateZ(0)' }], { duration: dur, easing: 'cubic-bezier(.3,.6,.35,1)', fill: 'forwards' });
      var n = 0;
      (function trail() {
        var c = ctr(tok);
        if (n++ % 2 === 0) sparks(c.x, c.y, 2, 60);
        RV.trail = requestAnimationFrame(trail);
      })();
      fl.onfinish = function () {
        cancelAnimationFrame(RV.trail);
        if (!RV.open || RV.closing) return;
        tok.style.transform = T(m.x, m.y, 1);
        stopTok();
        impact(ctx, false);
      };
    };
  }

  function impact(ctx, instant) {
    var m = RV.m, res = ctx.res, jack = ctx.jack, m0 = modal(), c = card();
    m0.classList.add('wr-hit');
    if (!instant) {
      anim(tok, [{ transform: T(m.x, m.y, 1.18) }, { transform: T(m.x, m.y + 3, 0.92) }, { transform: T(m.x, m.y, 1.04) }, { transform: T(m.x, m.y, 1) }], { duration: 520, easing: 'ease-out' });
      sparks(m.x, m.y, jack ? 40 : 26, jack ? 520 : 380);
      fountain(m.x, m.y, jack ? 34 : 18, res.kind === 'crypto' ? ctx.sec.id : null);
      FX.vibrate(jack ? [16, 46, 16, 46, 30] : [10, 32, 18]);
      if (jack) {
        FX.edgeFlash('gold');
        var b = body();
        if (b) anim(b, [{ transform: 'none' }, { transform: 'translate(-6px,3px)' }, { transform: 'translate(5px,-4px)' }, { transform: 'translate(-4px,2px)' }, { transform: 'translate(2px,-1px)' }, { transform: 'none' }], { duration: 440 });
        later(function () { confetti(110, 1600); }, 120);
        later(function () { fountain(m.x, m.y, 24, res.kind === 'crypto' ? ctx.sec.id : null); sparks(m.x, m.y, 20, 420); }, 560);
      }
    }
    later(function () { tok.classList.add('idle'); }, 600);
    later(function () { c.classList.add('open', 'go'); }, instant ? 0 : 60);
    later(function () { V3.odo(el('sr-value'), valNum(res), { fmt: valFmt(res) }); }, 380);
    later(function () {
      var v = el('sr-value'), pr = ctr(v);
      restart(v, 'pop');
      restart(el('sp-panel'), 'shine');
      sparks(pr.x - pr.w / 2, pr.y, 8, 140);
      sparks(pr.x + pr.w / 2, pr.y, 8, 140);
    }, 1500);
    if (res.kind !== 'commission') {
      later(function () { var p = balPair(ctx); V3.countTo(el('sp-balance'), p.b, p.fmt, 900); }, 820);
    }
    later(focusCta, 900);
  }

  /* «Мимо» без праздника: из пустого сектора — пыль, карточка тяжело падает. */
  function missSeq() {
    var s = wheelPt(63);
    hideTok();
    dust(s.x, s.y, 18);
    later(function () { card().classList.add('drop', 'go'); }, 200);
    later(function () { restart(el('sp-miss'), 'shake'); }, 820);
    later(focusCta, 700);
  }
  function focusCta() {
    var a = el('spin-again'), b = el('spin-claim'), f = a && !a.classList.contains('hidden') ? a : b;
    if (f && RV.open && !RV.closing) try { f.focus({ preventScroll: true }); } catch (e) { /* фокус не критичен */ }
  }

  /* ---------------- Закрытие ---------------- */

  function setCap(v) { var c = el('spin-cap'); if (c) c.textContent = money(v, 0); }
  /* Капитал в шапке докручивается от «до» к текущему. */
  function capRoll(onScreen) {
    var from = RV.capShown;
    if (RV.capStop) RV.capStop();
    if (!onScreen || !RV.hold || Math.abs(capital() - from) < 0.5) { RV.hold = false; spinRenderCap(); return; }
    RV.capStop = V3.tween(800, function (p) { RV.capShown = V3.lerp(from, capital(), V3.easeOut(p)); setCap(RV.capShown); },
      function () { RV.hold = false; RV.capStop = null; spinRenderCap(); });
  }
  function hit(ctx, onScreen) {
    var res = ctx.res, cap = el('spin-cap');
    if (onScreen && cap) {
      restart(cap, 'wr-caphit');
      var c = ctr(cap);
      sparks(c.x, c.y, 14, 200);
    }
    capRoll(onScreen);
    var sub = res.kind === 'commission' ? '' : t('wr_toast_cap', { x: money(capital(), 0) });
    toast(res.kind === 'crypto'
      ? t('spin_toast_crypto', { q: fmtQty(res.qty), k: res.ticker })
      : (res.kind === 'commission'
        ? t('spin_toast_fee', { p: res.pct, n: res.trades })
        : t('spin_toast_usd', { x: money(res.usd, 0) })), 'gold', { sub: sub, img: res.kind === 'crypto' ? coinImg(ctx.sec.id) : null });
  }
  function claim() {
    if (!RV.open || RV.closing) return;
    RV.closing = true;
    clearTimers();
    var ctx = RV.ctx, res = ctx.res, m0 = modal(), c = card();
    holdModal(m0);
    var shown = c.classList.contains('open') || c.classList.contains('drop');
    c.classList.remove('open', 'drop');
    if (shown) c.classList.add('closing');
    m0.classList.remove('wr-on');
    m0.classList.add('wr-closing');
    if (body()) body().classList.remove('is-deep');
    /* После closeModal игра может сразу сменить экран (closeSpin) —
       тогда лететь в шапку колеса некуда: только тост. */
    setTimeout(function () {
      var onScreen = typeof currentScreen === 'undefined' || currentScreen === 'scr-spin';
      var cap = el('spin-cap'), cr = cap ? cap.getBoundingClientRect() : null;
      if (res && onScreen && tok && !tok.hidden && !V3.reduced() && cr && cr.width) {
        tok.classList.remove('idle');
        /* Старт — текущая точка монеты: закрыть могли ещё в полёте. */
        var m = ctr(tok), s1 = Math.max(0.2, m.w / SZ), cc = ctr(cap), cx = V3.lerp(m.x, cc.x, 0.5) - 40, cy = Math.min(m.y, cc.y) - 50, fr = [];
        for (var i = 0; i <= 16; i++) {
          var q = i / 16, u = 1 - q, x = u * u * m.x + 2 * u * q * cx + q * q * cc.x, y = u * u * m.y + 2 * u * q * cy + q * q * cc.y;
          fr.push({ transform: T(x, y, V3.lerp(Math.min(1.2, s1), 0.22, V3.easeOut(q))), opacity: q > 0.9 ? 0.4 : 1 });
        }
        stopTok();
        anim(tok3d, [{ transform: 'rotateY(0)' }, { transform: 'rotateY(540deg)' }], { duration: 640, easing: 'ease-in' });
        var fl = anim(tok, fr, { duration: 640, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' });
        fl.onfinish = function () { hideTok(); hit(ctx, true); };
      } else {
        hideTok();
        if (res) hit(ctx, onScreen); else RV.hold = false;
      }
      setTimeout(done, D(360));
    }, 0);
  }
  /* closeModal прячет окно через 195 мс — на выход по концепту нужно 360:
     карточка сворачивается 300 мс, фон и лучи гаснут. Таймер кладём в
     __closeTimer, чтобы openModal по-прежнему мог его отменить. */
  function holdModal(m0) {
    if (!m0 || !m0.__closeTimer) return;
    clearTimeout(m0.__closeTimer);
    m0.__closeTimer = setTimeout(function () {
      m0.__closeTimer = 0;
      m0.classList.add('hidden');
      m0.classList.remove('modal-out');
    }, D(360));
  }
  function done() {
    var m0 = modal(), c = card();
    if (m0) m0.classList.remove('wr-closing', 'wr-hit', 'wr-on');
    if (c) c.className = 'spin-prize wr-card';
    restoreIcons();
    RV.open = false;
    RV.closing = false;
  }
  /* Мгновенная уборка без анимаций (новая крутка, уход с экрана). */
  function hardClose() {
    clearTimers();
    hideTok();
    if (body()) body().classList.remove('is-deep');
    if (RV.open) done();
  }

  /* ---------------- Хуки игры ---------------- */

  /* Капитал до начисления — для докрутки в шапке. Сама награда не меняется. */
  var origApply = window.applySpinReward;
  if (typeof origApply === 'function') {
    window.applySpinReward = function () {
      try { RV.capBefore = capital(); } catch (e) { RV.capBefore = null; }
      return origApply.apply(this, arguments);
    };
  }
  V3.after('spinRenderCap', function () { if (RV.hold) setCap(RV.capShown); });
  V3.after('closeModal', function (r, args) { if (args[0] === 'modal-spin-prize') claim(); });
  /* «В лобби»: сначала монета улетает в капитал в шапке и сумма
     докручивается (полёт 640 + докрутка 800 мс), потом уходим с экрана.
     Перехватываем клик до onclick из main.js, сам closeSpin не меняем. */
  /* Пока ждём отложенный уход, повторный тап «В лобби» глотаем; новая
     крутка или повторное открытие экрана отменяют уход. */
  var leaveT = 0;
  function cancelLeave() { if (leaveT) { clearTimeout(leaveT); leaveT = 0; } }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('#spin-claim') : null;
    if (!b) return;
    if (leaveT) { e.stopImmediatePropagation(); e.preventDefault(); return; }
    if (!RV.open || RV.closing || !RV.ctx || !RV.ctx.res || V3.reduced()) return;
    if (typeof closeSpin !== 'function' || typeof closeModal !== 'function') return;
    e.stopImmediatePropagation();
    e.preventDefault();
    closeModal('modal-spin-prize');
    leaveT = setTimeout(function () { leaveT = 0; if (typeof currentScreen === 'undefined' || currentScreen === 'scr-spin') closeSpin(); }, D(1500));
  }, true);
  V3.after('openSpin', cancelLeave);
  V3.after('spinGo', cancelLeave);
  /* .catch в v3-wheel.css стоит позже .windup из style.css и перебил бы замах. */
  V3.after('runSpin', function () {
    cancelLeave();
    var ptr = document.querySelector('.spin-pointer');
    if (ptr) ptr.classList.remove('catch');
    if (!RV.open) restoreIcons();
  });
  V3.after('closeSpin', function () {
    if (typeof currentScreen !== 'undefined' && currentScreen !== 'scr-spin' && !RV.closing) { hardClose(); RV.hold = false; }
  });

  /* Смена режима тапом по пилюле — как applyMode в концепте: колесо
     уходит (200 мс), пересобирается и возвращается пружиной (480 мс).
     Пилюли переключаются сразу. Программные вызовы spinSelect (openSpin,
     «Ещё раз» → золотой + spinGo) остаются синхронными. */
  var SW = { busy: false, tap: false };
  var origSelect = window.spinSelect;
  if (typeof origSelect === 'function') {
    window.spinSelect = function (mode) {
      var self = this, args = arguments, wh = el('spin-wheel'), m = mode === 'vip' ? 'vip' : 'free', tap = SW.tap;
      SW.tap = false;
      if (SW.busy) return;
      if (!tap || !wh || !wh.animate || V3.reduced() || spinBusy || m === spinMode) return origSelect.apply(self, args);
      SW.busy = true;
      ['free', 'vip'].forEach(function (k) {
        var b = el('spin-mode-' + k);
        if (b) { b.classList.toggle('is-on', k === m); b.setAttribute('aria-selected', k === m ? 'true' : 'false'); }
      });
      var out = wh.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(.9) rotate(-10deg)', opacity: 0.3 }],
        { duration: D(200), easing: 'ease-in', fill: 'forwards' });
      out.onfinish = function () {
        SW.busy = false;
        try { origSelect.apply(self, args); } finally {
          out.cancel();
          wh.animate([{ transform: 'scale(.9) rotate(10deg)', opacity: 0.3 }, { transform: 'none', opacity: 1 }],
            { duration: D(480), easing: 'cubic-bezier(.2,1.3,.4,1)' });
        }
      };
    };
  }
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null;
    if (!t) return;
    /* Пока колесо пересобирается, крутить нельзя: сектора ещё старые. */
    if (SW.busy && t.closest('#spin-go, #spin-hub')) { e.stopImmediatePropagation(); e.preventDefault(); return; }
    if (t.closest('#spin-mode-free, #spin-mode-vip')) { SW.tap = true; setTimeout(function () { SW.tap = false; }, 0); }
  }, true);
  window.addEventListener('resize', function () {
    if (!P.cv) return;
    fxSize();
    if (!RV.open || RV.closing) return;
    var md = el('sp-medal'), m0 = modal();
    if (!md || !m0) return;
    var m = RV.m = ctr(md);
    m0.style.setProperty('--mx', m.x + 'px');
    m0.style.setProperty('--my', m.y + 'px');
    if (tok && !tok.hidden && tok.classList.contains('idle')) tok.style.transform = T(m.x, m.y, 1);
  });

  return { show: show, claim: claim, hardClose: hardClose };
})();
'use strict';
