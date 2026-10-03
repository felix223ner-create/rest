/* v3-settings — шторка «Настройки» по concept/settings.html.

   Профиль-полоска, темы живыми миниатюрами («Полночь» с замком, наградная
   тема из витрины — плашкой), «Продвинутые анимации» с живым превью и
   «Меньше движения» (js/v3-motion.js), язык, пошаговое «Как играть» со
   словарём внутри той же шторки и сброс прогресса удержанием 2 секунды.

   Разметка-каркас — #modal-settings в index.html; содержимое строится
   здесь. Тему, язык и сброс применяют функции main.js (setTheme, setLang,
   resetProgress), модуль только вызывает их и перерисовывается из
   syncSettingsUI(). Цифры в «Как играть» берутся из CONFIG / CLASSES. */
'use strict';

V3.i18n({
  ru: {
    sg_guest: 'Гость · прогресс сохраняется', sg_auth: 'Аккаунт Яндекса · прогресс в облаке',
    sg_look: 'Оформление',
    sg_ext: 'Надета тема <b>«{x}»</b> из витрины', sg_shop: 'Витрина ›',
    sg_anim: 'Анимации', sg_new: 'Новое',
    sg_adv_t: 'Продвинутые анимации', sg_adv_d: 'Частицы, свечение, 3D-монеты и пружинистые переходы. Чуть больше нагрузки на устройство',
    sg_pv: 'Превью', sg_pv_live: 'живая цена', sg_pv_adv: 'Продвинутые', sg_pv_std: 'Стандартные', sg_pv_rm: 'Меньше движения',
    sg_pv_1: 'Табло и цвет цены', sg_pv_2: 'Частицы и вспышки', sg_pv_3: '3D-монета и свечение', sg_pv_4: 'Пружинистые шторки',
    sg_rm_t: 'Меньше движения', sg_rm_d: 'Почти без анимаций — для слабых устройств и чувствительных глаз. Включается само, если так настроено в системе',
    sg_rm_sys: 'Включено в настройках системы',
    sg_snd: 'Звук', sg_sfx_t: 'Звуки', sg_sfx_d: 'Клики, сделки, награды', sg_mus_t: 'Музыка', sg_mus_d: 'Фоновая тема в стиле lo-fi', sg_vol: 'Громкость',
    sg_help: 'Помощь', sg_how_new: '6 коротких шагов · около минуты', sg_how_cont: 'Пройдено {n} из 6 · продолжить', sg_how_done: 'Пройдено · можно повторить',
    sg_gloss_t: 'Словарь трейдера', sg_gloss_d: 'Спред, плечо, ликвидация — простыми словами',
    sg_data: 'Прогресс', sg_hold_d: 'Удерживайте 2 секунды — имя, аватар, тема и язык останутся', sg_hold_go: 'Держите… отпустите, чтобы отменить', sg_hold_done: 'Готово — начинаем с {x}',
    sg_prev: 'Предыдущий шаг', sg_next: 'Дальше', sg_finish: 'Понятно, играть', sg_step: 'Шаг {n}',
    sg_buy: 'Купить', sg_entry: 'цена входа', sg_daily: 'каждый день', sg_6h: 'раз в 6 ч', sg_wheel: 'колесо удачи', sg_ad: 'за рекламу', sg_3m: 'раз в 3 мин',
    sg_short: 'Шорт', sg_long: 'Лонг', sg_lev: 'Плечо', sg_liq: 'Ликвидация', sg_goal: 'Цель',
    sg_to: 'До «{x}»', sg_left: 'ещё {x}', sg_top: 'Высший класс', sg_top_d: 'вы на вершине', sg_sell: 'Продать', sg_bought: 'Куплено', sg_th_dark: 'Классика', sg_th_light: 'Дневная',
    sg_tip: '<b>Совет:</b> не вкладывайте весь капитал в одну монету — рынок умеет удивлять. А если всё пошло не так, прогресс можно начать заново здесь же, в настройках.',
    sg_t_adv_on: 'Продвинутые анимации включены', sg_t_adv_off: 'Стандартные анимации', sg_t_adv_sub: 'Сравните в превью',
    sg_t_rm_on: 'Меньше движения', sg_t_rm_sub: 'Продвинутые анимации приостановлены', sg_t_rm_off: 'Анимации снова в обычном режиме',
    sg_t_blocked: 'Сначала выключите «Меньше движения»', sg_t_sys: 'Так настроено в системе устройства',
    sg_t_how: 'Удачных сделок!', sg_t_how_sub: 'Вернуться к подсказкам можно в любой момент',
    sg_s1_t: 'Выберите монету', sg_s1_p: 'На вкладке <b>«Рынок»</b> — {n} монет с живыми ценами. Коснитесь любой — откроется график с 5 таймфреймами и новостями актива.',
    sg_s1_c: '{n} монет|5 таймфреймов|Поиск и сортировка',
    sg_s2_t: 'Купите на нужную сумму', sg_s2_p: 'Выберите сумму — кнопками 10–100% или вручную — и нажмите <b>«Купить»</b>. Минимальная сделка — <b>{min}</b>. Покупка идёт по цене ask: она на {sp} выше рыночной.',
    sg_s2_c: 'Старт — {start}|От {min}|Спред {sp}',
    sg_s3_t: 'Продайте дороже', sg_s3_p: 'Цены меняются в реальном времени и реагируют на <b>новости</b>. Когда цена выше вашей цены входа — продайте часть или всю позицию, разница станет прибылью.',
    sg_s3_c: 'Новости двигают цену|Продажа частями|Лимитные ордера',
    sg_s4_t: 'Забирайте бонусы', sg_s4_p: '<b>Ежедневный</b> — {d} и +{st} за каждый день серии, до {mx}. <b>Колесо удачи</b> — бесплатно раз в 6 часов, золотое — за рекламу. <b>Бонус за рекламу</b> — {ad} раз в 3 минуты.',
    sg_s4_c: 'До {mx} в день|Колесо ×2',
    sg_s5_t: 'Фьючерсы — для смелых', sg_s5_p: '<b>Лонг</b> зарабатывает на росте, <b>шорт</b> — на падении. Плечо до <b>50×</b> умножает и прибыль, и убыток. Если убыток съест маржу — позицию ликвидируют. Страхуйтесь стоп-лоссом.',
    sg_s5_c: 'Плечо до 50×|TP / SL|Отдельный кошелёк',
    sg_s6_t: 'Растите капитал', sg_s6_p: 'Капитал — это деньги плюс стоимость всех позиций. Он открывает <b>6 классов трейдера</b> с наградами и поднимает вас в <b>рейтинге</b>. Главная цель — первый миллион.',
    sg_s6_c: '6 классов|Рейтинг|Достижения',
    sg_g1: 'Спред|ask / bid|Разница между ценой покупки и продажи — в игре <b>{sp}</b>. Покупаете по ask (чуть выше рынка), продаёте по bid (чуть ниже). Поэтому сразу после покупки позиция в небольшом минусе — это нормально.',
    sg_g2: 'Позиция||Монеты, которые вы держите. Средняя цена входа видна линией на графике; продать можно часть или всё сразу.',
    sg_g3: 'Лонг и шорт|фьючерсы|<b>Лонг</b> — ставка на рост цены, <b>шорт</b> — на падение. Во фьючерсах заработать можно в обе стороны.',
    sg_g4: 'Плечо|до 50×|Умножает размер позиции: с плечом 10× и маржой $100 вы торгуете на $1 000 — и прибыль, и убыток тоже ×10. Максимум — <b>50×</b> у крупнейших монет, у мемкоинов — до <b>10×</b>.',
    sg_g5: 'Ликвидация||Если убыток почти съел маржу, позиция закрывается принудительно. Маржа изолированная: сгорает только маржа этой позиции, остальной кошелёк цел.',
    sg_g6: 'TP / SL||<b>Тейк-профит</b> и <b>стоп-лосс</b> — автоматическое закрытие при заданной прибыли или убытке (в % ROE). Стоп нельзя поставить дальше цены ликвидации.',
    sg_g7: 'Фандинг|раз в час|Платёж между лонгами и шортами. Если цена за сутки выросла — лонги платят шортам, упала — наоборот.',
    sg_g8: 'Класс трейдера||Звание по капиталу: {cls}. За каждый новый класс — денежная награда.'
  },
  en: {
    sg_snd: 'Sound', sg_sfx_t: 'Sound effects', sg_sfx_d: 'Taps, trades, rewards', sg_mus_t: 'Music', sg_mus_d: 'Lo-fi background theme', sg_vol: 'Volume',
    sg_guest: 'Guest · progress is saved', sg_auth: 'Yandex account · progress in the cloud',
    sg_look: 'Appearance',
    sg_ext: 'Wearing the <b>{x}</b> theme from the showcase', sg_shop: 'Showcase ›',
    sg_anim: 'Animations', sg_new: 'New',
    sg_adv_t: 'Advanced animations', sg_adv_d: 'Particles, glow, 3D coins and springy transitions. Slightly heavier on the device',
    sg_pv: 'Preview', sg_pv_live: 'live price', sg_pv_adv: 'Advanced', sg_pv_std: 'Standard', sg_pv_rm: 'Reduced motion',
    sg_pv_1: 'Price ticker and colour', sg_pv_2: 'Particles and flashes', sg_pv_3: '3D coin and glow', sg_pv_4: 'Springy sheets',
    sg_rm_t: 'Reduce motion', sg_rm_d: 'Almost no animation — for slower devices and sensitive eyes. Turns on by itself if set in the system',
    sg_rm_sys: 'Turned on in system settings',
    sg_help: 'Help', sg_how_new: '6 short steps · about a minute', sg_how_cont: '{n} of 6 done · continue', sg_how_done: 'Completed · replay any time',
    sg_gloss_t: 'Trader glossary', sg_gloss_d: 'Spread, leverage, liquidation — in plain words',
    sg_data: 'Progress', sg_hold_d: 'Hold for 2 seconds — name, avatar, theme and language stay', sg_hold_go: 'Hold… release to cancel', sg_hold_done: 'Done — starting over with {x}',
    sg_prev: 'Previous step', sg_next: 'Next', sg_finish: 'Got it, let’s play', sg_step: 'Step {n}',
    sg_buy: 'Buy', sg_entry: 'entry price', sg_daily: 'every day', sg_6h: 'every 6 h', sg_wheel: 'lucky wheel', sg_ad: 'for an ad', sg_3m: 'every 3 min',
    sg_short: 'Short', sg_long: 'Long', sg_lev: 'Leverage', sg_liq: 'Liquidation', sg_goal: 'Goal',
    sg_to: 'To {x}', sg_left: '{x} to go', sg_top: 'Top class', sg_top_d: 'you are at the top', sg_sell: 'Sell', sg_bought: 'Bought', sg_th_dark: 'Classic', sg_th_light: 'Daylight',
    sg_tip: '<b>Tip:</b> don’t put all your capital into one coin — the market loves surprises. And if things go wrong, you can start over right here in Settings.',
    sg_t_adv_on: 'Advanced animations on', sg_t_adv_off: 'Standard animations', sg_t_adv_sub: 'Compare in the preview',
    sg_t_rm_on: 'Reduce motion', sg_t_rm_sub: 'Advanced animations paused', sg_t_rm_off: 'Animations back to normal',
    sg_t_blocked: 'Turn off Reduce motion first', sg_t_sys: 'Set in your device’s system settings',
    sg_t_how: 'Happy trading!', sg_t_how_sub: 'Tips are always one tap away',
    sg_s1_t: 'Pick a coin', sg_s1_p: 'The <b>Market</b> tab has {n} coins with live prices. Tap any of them to open its chart with 5 timeframes and asset news.',
    sg_s1_c: '{n} coins|5 timeframes|Search & sort',
    sg_s2_t: 'Buy the amount you want', sg_s2_p: 'Choose an amount — with the 10–100% buttons or manually — and tap <b>Buy</b>. The minimum trade is <b>{min}</b>. You buy at the ask price, {sp} above the market.',
    sg_s2_c: 'Start — {start}|From {min}|{sp} spread',
    sg_s3_t: 'Sell higher', sg_s3_p: 'Prices move in real time and react to <b>news</b>. When the price is above your entry, sell part or all of the position — the difference is your profit.',
    sg_s3_c: 'News moves prices|Partial sells|Limit orders',
    sg_s4_t: 'Collect bonuses', sg_s4_p: '<b>Daily</b> — {d} plus {st} per streak day, up to {mx}. <b>Lucky wheel</b> — free every 6 hours, golden for an ad. <b>Ad bonus</b> — {ad} every 3 minutes.',
    sg_s4_c: 'Up to {mx} a day|2 wheels',
    sg_s5_t: 'Futures — for the bold', sg_s5_p: '<b>Long</b> earns when the price rises, <b>short</b> when it falls. Leverage up to <b>50×</b> multiplies both profit and loss. If losses eat the margin, the position is liquidated. Use a stop-loss.',
    sg_s5_c: 'Up to 50×|TP / SL|Separate wallet',
    sg_s6_t: 'Grow your capital', sg_s6_p: 'Capital is cash plus the value of all positions. It unlocks <b>6 trader classes</b> with rewards and lifts you in the <b>leaderboard</b>. The big goal is your first million.',
    sg_s6_c: '6 classes|Leaderboard|Achievements',
    sg_g1: 'Spread|ask / bid|The gap between buy and sell prices — <b>{sp}</b> in the game. You buy at the ask (a bit above market) and sell at the bid (a bit below), so a fresh position starts slightly red. That’s normal.',
    sg_g2: 'Position||The coins you hold. The average entry price is shown as a line on the chart; sell part or all of it at once.',
    sg_g3: 'Long & short|futures|<b>Long</b> bets on the price going up, <b>short</b> on it going down. With futures you can profit both ways.',
    sg_g4: 'Leverage|up to 50×|Multiplies position size: at 10× with a $100 margin you trade $1,000 — profit and loss are ×10 too. Max <b>50×</b> for the largest coins, up to <b>10×</b> for meme coins.',
    sg_g5: 'Liquidation||If losses nearly eat the margin, the position is force-closed. Margin is isolated: only this position’s margin burns, the rest of the wallet is safe.',
    sg_g6: 'TP / SL||<b>Take-profit</b> and <b>stop-loss</b> close the position automatically at a set gain or loss (in % ROE). A stop can’t be placed beyond the liquidation price.',
    sg_g7: 'Funding|hourly|A payment between longs and shorts. If the price rose over 24h, longs pay shorts; if it fell — the other way round.',
    sg_g8: 'Trader class||Rank by capital: {cls}. Each new class pays a cash reward.'
  }
});

var V3Set = (function () {
  var N = 6, HOLD_MS = 2000;
  /* В настройках — только базовые темы. «Полночь» и прочие наградные
     надеваются исключительно в витрине профиля; если надета такая —
     показываем плашку со ссылкой на витрину. */
  var OWN = ['dark', 'light'];
  var IC = {
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    tick: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 4.9L19 9.7l-4.2 3.1L16.2 18 12 15l-4.2 3 1.4-5.2L5 9.7l5.2-1.8z"/></svg>',
    rm: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>',
    sfx: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    mus: '<svg viewBox="0 0 24 24"><path d="M9 18V5.5l10-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M4 19V5a2 2 0 0 1 2-2h13v14H6a2 2 0 0 0-2 2zm0 0a2 2 0 0 0 2 2h13"/><path d="M9 8.5l2 2 4-4"/></svg>',
    gloss: '<svg viewBox="0 0 24 24"><path d="M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z"/></svg>',
    reset: '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
    ad: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor"/></svg>',
    bulb: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>'
  };

  var V = { view: 'set', step: 0, built: false, pv: null, pvT: 0, pvPrev: 0, hold: null };

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return V3.esc(s == null ? '' : s); }
  function modal() { return document.getElementById('modal-settings'); }
  function isOpen() { var m = modal(); return !!m && !m.classList.contains('hidden') && !m.classList.contains('modal-out'); }
  function adv() { return typeof Motion === 'undefined' || Motion.adv(); }
  function usd(n) { return money(n, 0); }
  function pctS(x) { return (Math.round(x * 1000) / 10).toString().replace('.', LANG === 'ru' ? ',' : '.') + '%'; }
  function vars() {
    var c = typeof CONFIG !== 'undefined' ? CONFIG : {};
    return {
      n: typeof ASSETS !== 'undefined' ? ASSETS.length : 200,
      min: usd(c.minTrade || 10), sp: pctS(c.spread || 0.001), start: usd(c.startBalance || 1000),
      d: usd(c.dailyBase || 500), st: usd(c.dailyStreakStep || 100), mx: usd(c.dailyMax || 1500), ad: usd(c.adReward || 500)
    };
  }
  function themeName(th) {
    var k = 'theme_' + th, v = t(k);
    if (v !== k) return v;
    v = t('item_theme_' + th + '_t');
    return v === 'item_theme_' + th + '_t' ? th : v;
  }
  function clsIdx() { try { return classFor(capital()); } catch (e) { return 0; } }
  function seen() { return Math.max(0, +S.howSeen || 0); }
  function ptOf(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }
  function burstAt(el, o) { if (!el) return; var p = ptOf(el); try { FX.burst(p.x, p.y, o || { kind: 'coin', count: 14, spread: 80 }); } catch (e) { /* */ } }
  function shake(el) { try { FX.nudge(el); } catch (e) { /* */ } }

  /* ---------------- Разметка: настройки ---------------- */

  function sw(id, on, dis, label) {
    return '<button type="button" class="sg-sw" id="' + id + '" role="switch" aria-checked="' + (on ? 'true' : 'false') + '"' + (dis ? ' aria-disabled="true"' : '') + ' aria-label="' + esc(label) + '"></button>';
  }
  /* Строка звука: тумблер + ползунок громкости (S.snd через Snd.set). */
  function sndRow(k, col) {
    return '<div class="sg-opt sg-snd" id="sg-opt-' + k + '"><span class="sg-ico ' + col + '">' + IC[k] + '</span><div class="sg-txt"><b>' + esc(t('sg_' + k + '_t')) + '</b><i>' + esc(t('sg_' + k + '_d')) + '</i>' +
      '<input type="range" class="slider sg-vol" id="sg-v-' + k + '" min="0" max="100" step="5" aria-label="' + esc(t('sg_vol') + ' · ' + t('sg_' + k + '_t')) + '"></div>' + sw('sg-sw-' + k, true, false, t('sg_' + k + '_t')) + '</div>';
  }
  function syncSnd() {
    var m = modal();
    if (!m || typeof Snd === 'undefined') return;
    [['sfx', 's', 'vs'], ['mus', 'm', 'vm']].forEach(function (r) {
      var b = $('#sg-sw-' + r[0], m), v = $('#sg-v-' + r[0], m);
      if (!b || !v) return;
      var on = !!Snd.get(r[1]);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      v.value = Snd.get(r[2]);
      v.style.setProperty('--p', Snd.get(r[2]) + '%');
      $('#sg-opt-' + r[0], m).classList.toggle('off', !on);
    });
  }
  function themeBtn(th) {
    /* Мини-экран лобби в палитре темы: шапка, капитал, график, таббар. */
    return '<button type="button" class="sg-th" data-sg-th="' + th + '" aria-pressed="false">' +
      '<span class="sg-mini t-' + th + '">' +
        '<span class="m-top"><i></i><b></b><em></em></span>' +
        '<span class="m-cap"><b></b><i></i></span>' +
        '<svg class="m-ch" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="M0 24 L12 20 L24 23 L38 14 L52 17 L66 9 L80 12 L100 3 L100 30 L0 30Z"/><path class="l" pathLength="100" d="M0 24 L12 20 L24 23 L38 14 L52 17 L66 9 L80 12 L100 3"/></svg>' +
        '<span class="m-tab"><i class="on"></i><i></i><i></i><i></i></span>' +
      '</span>' +
      '<span class="sg-th-f"><span class="sg-th-t"><b>' + esc(themeName(th)) + '</b><i>' + esc(t('sg_th_' + th)) + '</i></span>' +
      '<span class="sg-radio">' + IC.tick + '</span></span></button>';
  }
  function whoHtml() {
    var ci = clsIdx(), c = CLASSES[ci] || CLASSES[0];
    var auth = false;
    try { auth = !!(YaGame && YaGame.isAuthorized && YaGame.isAuthorized()); } catch (e) { auth = false; }
    var ava = '';
    try { ava = avatarHTML(S.avatar); } catch (e) { ava = esc((S.name || '?').charAt(0)); }
    /* Рамка из витрины — те же классы fr-*, что у аватарки профиля. */
    var fr = '';
    try { fr = achFrameClass({ me: true }); } catch (e) { fr = ''; }
    return '<button type="button" class="sg-card sg-who sg-rv" style="--d:0" data-sg="profile">' +
      '<span class="avatar sg-ava' + fr + '">' + ava + '</span>' +
      '<span class="sg-who-t"><b>' + esc(S.name || '—') + '</b><i>' + esc(t(auth ? 'sg_auth' : 'sg_guest')) + '</i></span>' +
      '<span class="sg-chip gold" style="--cc:' + esc(c.color) + '">' + esc(c.name[LANG] || c.name.ru) + '</span></button>';
  }
  function setHtml() {
    var h = whoHtml();
    h += '<div class="sg-sec sg-rv" style="--d:40"><span class="sg-kick">' + esc(t('sg_look')) + '</span><span class="sg-chip" id="sg-th-chip"></span></div>';
    h += '<div class="sg-card sg-rv" style="--d:60"><div class="sg-themes">' + OWN.map(themeBtn).join('') + '</div>' +
      '<div class="sg-ext" id="sg-ext" hidden><span class="sg-ext-dot"></span><span id="sg-ext-t"></span><button type="button" data-sg="shop">' + esc(t('sg_shop')) + '</button></div></div>';
    h += '<div class="sg-sec sg-rv" style="--d:100"><span class="sg-kick">' + esc(t('sg_anim')) + '</span><span class="sg-chip gold">' + esc(t('sg_new')) + '</span></div>';
    h += '<div class="sg-card sg-rv" style="--d:120">' +
      '<div class="sg-opt" id="sg-opt-adv"><span class="sg-ico gold">' + IC.star + '</span><div class="sg-txt"><b>' + esc(t('sg_adv_t')) + '</b><i>' + esc(t('sg_adv_d')) + '</i></div>' + sw('sg-sw-adv', false, false, t('sg_adv_t')) + '</div>' +
      '<div class="sg-pv"><div class="sg-pv-top"><span class="sg-kick">' + esc(t('sg_pv')) + '</span><span class="sg-chip" id="sg-pv-mode"></span></div>' +
      '<div class="sg-pv-box" id="sg-pv-box"><div class="sg-pv-coin" id="sg-pv-coin"><div><img src="img/coins/bitcoin.png" alt="" draggable="false"></div></div>' +
      '<div class="sg-pv-mid"><i>BTC · ' + esc(t('sg_pv_live')) + '</i><b class="sg-pv-price mono" id="sg-pv-price"></b><span class="sg-chip up mono" id="sg-pv-chg">+0.00%</span></div>' +
      '<svg class="sg-pv-spark" id="sg-pv-spark" viewBox="0 0 120 64" aria-hidden="true"><defs><linearGradient id="sgPvGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".45"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><path class="a"/><path class="l"/><circle r="4" cx="0" cy="0"/></svg></div>' +
      '<div class="sg-pv-cmp"><span>' + esc(t('sg_pv_1')) + '</span><span class="adv-only">' + esc(t('sg_pv_2')) + '</span><span class="adv-only">' + esc(t('sg_pv_3')) + '</span><span class="adv-only">' + esc(t('sg_pv_4')) + '</span></div></div>' +
      '<div class="sg-opt" id="sg-opt-rm"><span class="sg-ico blue">' + IC.rm + '</span><div class="sg-txt"><b>' + esc(t('sg_rm_t')) + '</b><i id="sg-rm-d">' + esc(t('sg_rm_d')) + '</i></div>' + sw('sg-sw-rm', false, false, t('sg_rm_t')) + '</div></div>';
    h += '<div class="sg-sec sg-rv" style="--d:160"><span class="sg-kick">' + esc(t('language')) + '</span></div>';
    h += '<div class="sg-card sg-rv" style="--d:180"><div class="sg-seg" id="sg-lang" style="--n:2">' +
      '<button type="button" data-sg-lang="ru"><span class="fl">RU</span>Русский</button><button type="button" data-sg-lang="en"><span class="fl">EN</span>English</button><i></i></div></div>';
    if (typeof Snd !== 'undefined' && Snd.supported()) {
      h += '<div class="sg-sec sg-rv" style="--d:190"><span class="sg-kick">' + esc(t('sg_snd')) + '</span></div>';
      h += '<div class="sg-card sg-rv" style="--d:200">' + sndRow('sfx', 'gold') + sndRow('mus', 'violet') + '</div>';
    }
    h += '<div class="sg-sec sg-rv" style="--d:220"><span class="sg-kick">' + esc(t('sg_help')) + '</span></div>';
    h += '<button type="button" class="sg-card sg-how sg-rv" style="--d:240" data-sg="howto"><span class="sg-how-ill">' + IC.book + '</span>' +
      '<div class="sg-txt"><b>' + esc(t('howto')) + '</b><i id="sg-how-sub"></i><div class="sg-how-prog" id="sg-how-prog"></div></div><span class="sg-chev">›</span></button>';
    h += '<div class="sg-card sg-rv" style="--d:260"><button type="button" class="sg-opt link" data-sg="gloss"><span class="sg-ico violet">' + IC.gloss + '</span>' +
      '<div class="sg-txt"><b>' + esc(t('sg_gloss_t')) + '</b><i>' + esc(t('sg_gloss_d')) + '</i></div><span class="sg-chev">›</span></button></div>';
    h += '<div class="sg-sec sg-rv" style="--d:300"><span class="sg-kick">' + esc(t('sg_data')) + '</span></div>';
    h += '<button type="button" class="sg-card sg-hold sg-rv" style="--d:320" id="sg-hold"><span class="fill"></span><span class="sg-ico red">' + IC.reset + '</span>' +
      '<div class="sg-txt"><b>' + esc(t('reset')) + '</b><i id="sg-hold-sub">' + esc(t('sg_hold_d')) + '</i></div>' +
      '<svg class="sg-ring" viewBox="0 0 34 34" aria-hidden="true"><circle class="t" cx="17" cy="17" r="14"/><circle class="p" cx="17" cy="17" r="14"/></svg></button>';
    return h;
  }

  /* ---------------- Разметка: «Как играть» ---------------- */

  function chips(k) { return t(k, vars()).split('|'); }
  function clsGoal() {
    var ci = clsIdx(), cap = 0;
    try { cap = capital(); } catch (e) { cap = 0; }
    var cur = CLASSES[ci], nx = CLASSES[ci + 1];
    if (!nx) return { w: 1, to: t('sg_top'), left: t('sg_top_d') };
    var w = Math.max(0.04, Math.min(1, (cap - cur.cap) / (nx.cap - cur.cap)));
    return { w: w, to: t('sg_to', { x: nx.name[LANG] || nx.name.ru }), left: t('sg_left', { x: usd(Math.max(0, nx.cap - cap)) }) };
  }
  function slidesHtml() {
    var ci = clsIdx(), g = clsGoal();
    var lad = CLASSES.map(function (c, i) {
      return '<span class="' + (i === ci ? 'cur' : i < ci ? 'done' : '') + '" style="--c:' + esc(c.color) + ';--j:' + i + '"><i><img src="' + esc(c.img) + '" alt="" draggable="false"></i><b>' + esc(c.name[LANG] || c.name.ru) + '</b></span>';
    }).join('');
    var spark = '<svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path d="M0 22 L14 18 L26 21 L40 12 L54 15 L68 8 L82 11 L100 4"/></svg>';
    return '' +
      /* 1. Тап по Bitcoin → открывается его график. */
      '<div class="sg-slide" data-s="0"><div class="sg-il sg-il-1"><div class="il-list">' +
        '<div class="il-row"><img src="img/coins/solana.png" alt="">Solana<em class="up">+4.1%</em></div>' +
        '<div class="il-row b"><img src="img/coins/bitcoin.png" alt="">Bitcoin<em class="up">+1.8%</em></div>' +
        '<div class="il-row"><img src="img/coins/ethereum.png" alt="">Ethereum<em class="dn">−0.6%</em></div></div>' +
        '<div class="il-sheet"><img src="img/coins/bitcoin.png" alt=""><span><b>BTC</b><i class="up">+1.8%</i></span>' + spark + '</div>' +
        '<span class="finger"></span></div></div>' +
      /* 2. Выбор доли → «Купить» → позиция открыта. */
      '<div class="sg-slide" data-s="1"><div class="sg-il sg-il-2"><div class="il-ch">' +
        '<i style="--x:0;--b:20;--h:26"></i><i class="r" style="--x:12;--b:28;--h:18"></i><i style="--x:24;--b:24;--h:30"></i><i style="--x:36;--b:40;--h:22"></i><i class="r" style="--x:48;--b:44;--h:14"></i><i style="--x:60;--b:42;--h:30"></i><i style="--x:72;--b:58;--h:24"></i><i style="--x:84;--b:66;--h:20"></i>' +
        '</div><div class="il-ask"><span>ask +' + esc(vars().sp) + '</span></div>' +
        '<div class="il-buy"><div class="amt mono"><span class="a1">$250</span><span class="a2">$500</span></div><div class="pc"><span>25%</span><span class="p2">50%</span><span>100%</span></div><b>' + esc(t('sg_buy')) + '</b></div>' +
        '<span class="il-done">✓ ' + esc(t('sg_bought')) + ' 0.0059 BTC</span><span class="finger"></span></div></div>' +
      /* 3. Цена растёт → «Продать» → прибыль. */
      '<div class="sg-slide" data-s="2"><div class="sg-il sg-il-3"><div class="il-pnl"><svg viewBox="0 0 254 134" preserveAspectRatio="none">' +
        '<defs><linearGradient id="sgPnlG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".35"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>' +
        '<path class="ar" d="M4 104 L40 92 L70 100 L104 78 L134 84 L168 58 L198 64 L226 34 L250 26 L250 134 L4 134Z"/>' +
        '<line class="en" x1="0" y1="96" x2="254" y2="96"/><text x="2" y="90">' + esc(t('sg_entry')) + '</text>' +
        '<path class="ln" d="M4 104 L40 92 L70 100 L104 78 L134 84 L168 58 L198 64 L226 34 L250 26"/></svg>' +
        '<span class="il-dot"></span><span class="il-tag mono">+$84 · +8.4%</span><b class="il-sell">' + esc(t('sg_sell')) + '</b></div></div></div>' +
      '<div class="sg-slide" data-s="3"><div class="sg-il"><div class="il-bon">' +
        '<div><span class="ic">' + IC.cal + '</span><b class="mono">' + esc(vars().d) + '+</b><span>' + esc(t('sg_daily')) + '</span></div>' +
        '<div><span class="il-wheel"></span><b>' + esc(t('sg_6h')) + '</b><span>' + esc(t('sg_wheel')) + '</span></div>' +
        '<div><span class="ic">' + IC.ad + '</span><b class="mono">+' + esc(vars().ad) + '</b><span>' + esc(t('sg_3m')) + '</span></div></div></div></div>' +
      /* 5. Плечо и расстояние до ликвидации считаются по формуле фьючерсов. */
      '<div class="sg-slide" data-s="4"><div class="sg-il"><div class="il-fut"><div class="il-ls"><span class="s">' + esc(t('sg_short')) + '</span><span class="l">' + esc(t('sg_long')) + '</span></div>' +
        '<div class="il-lev"><span>' + esc(t('sg_lev')) + '</span><span class="tr"><u></u></span><b class="mono" id="sg-lev-v">10×</b></div>' +
        '<div class="il-liq" id="sg-liq"><span>' + esc(t('sg_liq')) + '</span><b class="mono" id="sg-liq-v">−9.5%</b><i class="il-liq-bar"><u id="sg-liq-u"></u></i></div></div></div></div>' +
      /* 6. Лестница классов и реальный прогресс игрока до следующего. */
      '<div class="sg-slide" data-s="5"><div class="sg-il"><div class="il-cls"><div class="il-lad">' + lad + '</div>' +
        '<div class="il-bar" style="--w:' + g.w.toFixed(3) + '"><u></u></div>' +
        '<div class="il-goal"><span>' + esc(g.to) + '</span><b class="mono">' + esc(g.left) + '</b></div></div></div></div>';
  }
  function glossHtml() {
    var cls = CLASSES.map(function (c, i) { var n = c.name[LANG] || c.name.ru; return i ? n + ' (' + moneyShort(c.cap).replace('.0 ', ' ') + ')' : n; }).join(' → ');
    var h = '';
    for (var i = 1; i <= 8; i++) {
      var p = t('sg_g' + i, { sp: vars().sp, cls: esc(cls) }).split('|');
      h += '<div class="gl-i"><button type="button" class="gl-q" data-sg-gl="' + i + '" aria-expanded="false">' + esc(p[0]) + (p[1] ? ' <span class="tg">' + esc(p[1]) + '</span>' : '') +
        '<span class="pl">+</span></button><div class="gl-a"><div><p>' + p[2] + '</p></div></div></div>';
    }
    return h;
  }
  function howHtml() {
    return '<div class="sg-card sg-st"><div class="sg-st-ill" id="sg-st-ill"><span class="n mono" id="sg-st-n">1</span>' + slidesHtml() + '</div>' +
      '<div class="sg-st-txt" id="sg-st-txt"><h3></h3><p></p><div class="sg-st-chips"></div></div>' +
      '<div class="sg-st-nav"><button type="button" class="sg-btn sq" data-sg="prev" aria-label="' + esc(t('sg_prev')) + '">‹</button><div class="sg-dots" id="sg-dots"></div>' +
      '<button type="button" class="sg-btn primary" data-sg="next" id="sg-next"></button></div></div>' +
      '<div class="sg-sec" id="sg-gloss-a"><span class="sg-kick">' + esc(t('sg_gloss_t')) + '</span></div>' +
      '<div class="sg-card sg-gl">' + glossHtml() + '</div>' +
      '<div class="sg-card sg-tip"><span class="sg-ico gold">' + IC.bulb + '</span><span>' + t('sg_tip') + '</span></div>' +
      '<p class="sg-foot">' + esc(t('disclaimer')) + '</p>';
  }

  /* ---------------- Синхронизация ---------------- */

  function build() {
    var m = modal();
    if (!m) return false;
    var a = $('#sg-set-dyn', m), b = $('#sg-how-body', m);
    if (!a || !b) return false;
    a.innerHTML = setHtml();
    b.innerHTML = howHtml();
    try { bindAvatarFallbacks(a); } catch (e) { dbg('settings:ava', e); }
    V.built = true;
    bindHold();
    bindSwipe();
    renderStep(0, true);
    sync();
    return true;
  }
  function sync() {
    var m = modal();
    if (!m || !V.built) return;
    var known = OWN.indexOf(S.theme) >= 0;
    $$('[data-sg-th]', m).forEach(function (b) {
      var on = b.getAttribute('data-sg-th') === S.theme;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var ext = $('#sg-ext', m);
    if (ext) {
      ext.hidden = known;
      if (!known) $('#sg-ext-t', m).innerHTML = t('sg_ext', { x: esc(themeName(S.theme)) });
    }
    var chip = $('#sg-th-chip', m);
    if (chip) chip.textContent = themeName(S.theme);
    syncAnim();
    syncSnd();
    var seg = $('#sg-lang', m);
    if (seg) $$('button', seg).forEach(function (b, i) {
      var on = b.getAttribute('data-sg-lang') === LANG;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) seg.style.setProperty('--i', i);
    });
    syncHowCard();
  }
  function syncAnim() {
    var m = modal();
    if (!m) return;
    var sysRm = typeof Motion !== 'undefined' && Motion.sysReduced();
    var rm = typeof Motion !== 'undefined' && Motion.reduced();
    var fx = typeof Motion !== 'undefined' ? Motion.fx() : 'adv';
    var a = $('#sg-sw-adv', m), r = $('#sg-sw-rm', m);
    if (!a || !r) return;
    a.setAttribute('aria-checked', fx === 'adv' && !rm ? 'true' : 'false');
    a.setAttribute('aria-disabled', rm ? 'true' : 'false');
    $('#sg-opt-adv', m).classList.toggle('dis', rm);
    r.setAttribute('aria-checked', rm ? 'true' : 'false');
    r.setAttribute('aria-disabled', sysRm ? 'true' : 'false');
    $('#sg-opt-rm', m).classList.toggle('dis', sysRm);
    $('#sg-rm-d', m).textContent = sysRm ? t('sg_rm_sys') : t('sg_rm_d');
    var mode = $('#sg-pv-mode', m);
    mode.textContent = rm ? t('sg_pv_rm') : fx === 'adv' ? t('sg_pv_adv') : t('sg_pv_std');
    mode.className = 'sg-chip' + (adv() ? ' gold' : '');
    m.classList.toggle('sg-std', !adv());
  }
  function syncHowCard() {
    var m = modal();
    var sub = m && $('#sg-how-sub', m);
    if (!sub) return;
    var s = seen(), done = Math.min(s, N);
    sub.textContent = s > N ? t('sg_how_done') : s > 1 ? t('sg_how_cont', { n: done }) : t('sg_how_new');
    $('#sg-how-prog', m).innerHTML = Array.apply(null, Array(N)).map(function (_, i) { return '<i class="' + (i < done ? 'on' : '') + '"></i>'; }).join('');
  }

  /* ---------------- Превью анимаций ---------------- */

  function btc() { try { return assetById('bitcoin'); } catch (e) { return null; } }
  function pvStart() {
    pvStop();
    var a = btc();
    if (!a) return;
    var ts = Date.now(), vals = [];
    try { vals = (Engine.candles(a, 12, 3, ts) || []).map(function (c) { return c.c; }); } catch (e) { vals = []; }
    var p = Engine.live(a, ts);
    if (vals.length < 2) vals = [p, p];
    vals.push(p);
    V.pv = { a: a, vals: vals.slice(-14), p0: vals[0] };
    V.pvPrev = p;
    var el = $('#sg-pv-price');
    if (el) { el.__odoTxt = null; V3.odo(el, p, { fmt: function (x) { return money(x, 2); } }); }
    pvDraw(true, false);
    pvChip(p);
    V.pvT = setInterval(pvTick, 2400);
  }
  function pvStop() { if (V.pvT) { clearInterval(V.pvT); V.pvT = 0; } }
  function pvChip(p) {
    var chip = $('#sg-pv-chg');
    if (!chip || !V.pv) return;
    var d = p / V.pv.p0 - 1;
    chip.textContent = (d >= 0 ? '+' : '\u2212') + Math.abs(d * 100).toFixed(2) + '%';
    chip.className = 'sg-chip mono ' + (d >= 0 ? 'up' : 'down');
    return d;
  }
  function pvDraw(up, anim) {
    var sp = $('#sg-pv-spark');
    if (!sp || !V.pv) return;
    var g = V3.sparkPaths(V.pv.vals, 114, 58, 4);
    var l = $('path.l', sp), ar = $('path.a', sp), c = $('circle', sp);
    sp.classList.toggle('dn', !up);
    l.setAttribute('d', g.line);
    ar.setAttribute('d', g.area);
    c.setAttribute('cx', g.last.x); c.setAttribute('cy', g.last.y);
    if (anim && adv() && l.getTotalLength) {
      var len = l.getTotalLength();
      l.style.setProperty('--len', len);
      l.style.strokeDasharray = len;
      l.classList.remove('draw'); V3.reflow(l); l.classList.add('draw');
    } else { l.style.strokeDasharray = 'none'; l.classList.remove('draw'); }
  }
  function pvTick() {
    if (!isOpen() || V.view !== 'set' || document.hidden || !V.pv) return;
    var p = Engine.live(V.pv.a, Date.now()), prev = V.pvPrev;
    V.pvPrev = p;
    V.pv.vals.push(p);
    if (V.pv.vals.length > 14) V.pv.vals.shift();
    var up = p >= prev;
    var pr = $('#sg-pv-price');
    V3.odo(pr, p, { fmt: function (x) { return money(x, 2); } });
    pr.classList.remove('up', 'dn'); V3.reflow(pr); pr.classList.add(up ? 'up' : 'dn');
    pvChip(p);
    var chip = $('#sg-pv-chg'), coin = $('#sg-pv-coin');
    chip.classList.remove('pop'); coin.classList.remove('flip', 'dn'); V3.reflow(coin);
    if (adv()) {
      chip.classList.add('pop');
      var box = $('#sg-pv-box');
      if (box) { box.classList.remove('ping-up', 'ping-dn'); V3.reflow(box); box.classList.add(up ? 'ping-up' : 'ping-dn'); }
      coin.classList.add('flip');
      if (!up) coin.classList.add('dn');
      var pt = ptOf(coin), body = $('#sg-set-body').getBoundingClientRect();
      /* Монетка уехала под шапку или за низ шторки — частицы не пускаем. */
      if (pt.y > body.top + 10 && pt.y < body.bottom - 10) try { FX.burst(pt.x, pt.y, { kind: 'coin', count: 10, spread: 60, colors: up ? ['#2fbe6e', '#8ff0b8', '#f7d879'] : ['#f0524f', '#ff9a8f'] }); } catch (e) { /* */ }
    }
    pvDraw(up, true);
  }

  /* ---------------- «Как играть» ---------------- */

  function renderStep(dir, quiet) {
    var m = modal();
    if (!m || !V.built) return;
    var k = V.step + 1;
    $$('.sg-slide', m).forEach(function (sl, i) {
      sl.style.setProperty('--dir', dir < 0 ? -1 : 1);
      sl.classList.toggle('was', dir !== 0 && sl.classList.contains('on') && i !== V.step);
      sl.classList.toggle('on', i === V.step);
    });
    setTimeout(function () { $$('.sg-slide.was', m).forEach(function (x) { x.classList.remove('was'); }); }, V3.D(600));
    var tx = $('#sg-st-txt', m);
    $('h3', tx).textContent = t('sg_s' + k + '_t');
    $('p', tx).innerHTML = t('sg_s' + k + '_p', vars());
    $('.sg-st-chips', tx).innerHTML = chips('sg_s' + k + '_c').map(function (c) { return '<span class="sg-chip gold">' + esc(c) + '</span>'; }).join('');
    tx.classList.remove('in', 'in-std'); V3.reflow(tx);
    if (!quiet) tx.classList.add(adv() ? 'in' : 'in-std');
    var n = $('#sg-st-n', m);
    n.textContent = k;
    n.classList.remove('bump'); V3.reflow(n); if (!quiet) n.classList.add('bump');
    $('#sg-step-n', m).textContent = k + ' / ' + N;
    $('#sg-dots', m).innerHTML = Array.apply(null, Array(N)).map(function (_, i) {
      return '<button type="button" data-sg-dot="' + i + '" class="' + (i === V.step ? 'on' : i < V.step ? 'done' : '') + '" aria-label="' + esc(t('sg_step', { n: i + 1 })) + '"></button>';
    }).join('');
    $('[data-sg="prev"]', m).disabled = V.step === 0;
    $('#sg-next', m).textContent = V.step === N - 1 ? t('sg_finish') : t('sg_next') + ' ›';
    if (!quiet && V.view === 'how' && seen() < V.step + 1) { S.howSeen = V.step + 1; save(); }
  }
  function go(to) {
    if (to < 0 || to >= N || to === V.step) return;
    var dir = to > V.step ? 1 : -1;
    V.step = to;
    renderStep(dir);
    if (V.step === 4 && !V.levRaf) V.levRaf = requestAnimationFrame(levLoop);
  }
  function finishHow() {
    S.howSeen = N + 1;
    save();
    var b = $('#sg-next');
    if (b) { var p = ptOf(b); try { FX.burst(p.x, p.y, { kind: 'confetti', count: 40, spread: 130 }); FX.edgeFlash('gold'); } catch (e) { /* */ } }
    toast(t('sg_t_how'), 'gold', { sub: t('sg_t_how_sub') });
    setTimeout(function () { setView('set'); }, V3.D(350));
  }
  function setView(v, toGloss) {
    var m = modal();
    if (!m) return;
    V.view = v;
    $('#sg-views', m).classList.toggle('push', v === 'how');
    $$('.sg-view', m).forEach(function (x) {
      var on = x.classList.contains(v === 'how' ? 'sg-v-how' : 'sg-v-set');
      x.setAttribute('aria-hidden', on ? 'false' : 'true');
      if ('inert' in x) x.inert = !on;
    });
    if (v === 'how') {
      if (!toGloss) { V.step = seen() > N ? 0 : Math.min(Math.max(seen() - 1, 0), N - 1); }
      renderStep(0, !!toGloss);
      if (!toGloss && seen() < V.step + 1) { S.howSeen = V.step + 1; save(); }
      var body = $('#sg-how-body', m);
      if (toGloss) setTimeout(function () { var a = $('#sg-gloss-a', m); if (a) body.scrollTo({ top: a.offsetTop - 8, behavior: adv() ? 'smooth' : 'auto' }); }, V3.D(380));
      else body.scrollTop = 0;
    }
    syncHowCard();
  }
  /* Плечо на иллюстрации шага 5 бежит вслед за ползунком. */
  function levLoop() {
    if (!isOpen() || V.view !== 'how' || V.step !== 4) { V.levRaf = 0; return; }
    var u = $('#modal-settings .il-lev .tr u'), tr = $('#modal-settings .il-lev .tr'), v = $('#sg-lev-v');
    if (u && tr && v) {
      var lev = Math.max(1, Math.round(1 + 49 * (u.offsetWidth / (tr.offsetWidth || 1))));
      v.textContent = lev + '\u00D7';
      /* Как в futures.js (previewLiq, лонг): ликвидация, когда equity
         падает до поддерживающей маржи mmr. */
      var mmr = lev >= 25 ? 0.01 : lev >= 10 ? 0.005 : 0.004;
      var mv = lev <= 1 ? 1 : 1 - (1 - 1 / lev) / (1 - mmr);
      var lv = $('#sg-liq-v'), lu = $('#sg-liq-u'), lb = $('#sg-liq');
      if (lv) lv.textContent = '\u2212' + (mv * 100 >= 10 ? Math.round(mv * 100) : (mv * 100).toFixed(1)) + '%';
      if (lu) lu.style.width = Math.max(3, Math.min(100, mv * 100)) + '%';
      if (lb) lb.classList.toggle('hot', lev >= 25);
    }
    V.levRaf = requestAnimationFrame(levLoop);
  }
  function bindSwipe() {
    var el = $('#sg-st-ill');
    if (!el || el.__sg) return;
    el.__sg = 1;
    var x0 = null;
    el.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    el.addEventListener('pointerup', function (e) {
      if (x0 == null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) go(V.step + (dx < 0 ? 1 : -1));
    });
    el.addEventListener('pointercancel', function () { x0 = null; });
  }

  /* ---------------- Сброс удержанием ---------------- */

  function bindHold() {
    var btn = $('#sg-hold');
    if (!btn || btn.__sg) return;
    btn.__sg = 1;
    var H = { p: 0, on: false, last: 0, raf: 0, done: false };
    V.hold = H;
    function sub(txt) { var s = $('#sg-hold-sub'); if (s) s.textContent = txt; }
    function loop(ts) {
      var dt = H.last ? ts - H.last : 16;
      H.last = ts;
      H.p = H.on ? Math.min(1, H.p + dt / HOLD_MS) : Math.max(0, H.p - dt / 350);
      btn.style.setProperty('--p', H.p.toFixed(3));
      if (H.on && H.p >= 1) { complete(); return; }
      if (H.on && adv() && Math.random() < 0.3) {
        var r = btn.getBoundingClientRect();
        try { FX.burst(r.left + r.width * H.p, r.top + r.height * (0.3 + Math.random() * 0.4), { kind: 'paper', count: 1, spread: 30, colors: ['#f0524f', '#ff9a8f'] }); } catch (e) { /* */ }
      }
      if (H.on || H.p > 0) H.raf = requestAnimationFrame(loop);
      else { H.raf = 0; H.last = 0; }
    }
    function start(e) {
      if (H.done) return;
      if (e && e.cancelable) e.preventDefault();
      H.on = true;
      btn.classList.add('holding');
      sub(t('sg_hold_go'));
      try { FX.vibrate(10); } catch (er) { /* */ }
      if (!H.raf) { H.last = 0; H.raf = requestAnimationFrame(loop); }
    }
    function stop() {
      if (!H.on) return;
      H.on = false;
      btn.classList.remove('holding');
      if (!H.done) sub(t('sg_hold_d'));
      if (!H.raf) { H.last = 0; H.raf = requestAnimationFrame(loop); }
    }
    function complete() {
      H.on = false; H.done = true; H.raf = 0; H.last = 0;
      btn.classList.remove('holding');
      btn.classList.add('done');
      try { FX.vibrate([20, 40, 30]); FX.edgeFlash('down'); } catch (e) { /* */ }
      burstAt(btn, { kind: 'paper', count: 26, spread: 120, colors: ['#f0524f', '#ff9a8f', '#98a2b3'] });
      try { resetProgress(true); } catch (e) { dbg('settings:reset', e); }
      sub(t('sg_hold_done', { x: usd(CONFIG.startBalance) }));
      V.step = 0;
      sync();
      var who = $('#modal-settings .sg-who');
      if (who) who.outerHTML = whoHtml();
      setTimeout(function () {
        H.done = false; H.p = 0;
        btn.style.setProperty('--p', 0);
        btn.classList.remove('done');
        sub(t('sg_hold_d'));
      }, 2600);
    }
    btn.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { btn.addEventListener(ev, stop); });
    btn.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); });
    btn.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') stop(); });
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  /* ---------------- Действия ---------------- */

  function save() { try { saveState(true); } catch (e) { dbg('settings:save', e); } }
  function pickTheme(th, el) {
    if (th === S.theme) return;
    setTheme(th, el);
    if (adv()) setTimeout(function () { burstAt(el, { kind: 'coin', count: 14, spread: 70 }); }, V3.D(420));
  }
  function toggleAdv(el) {
    if (typeof Motion === 'undefined') return;
    if (Motion.reduced()) { shake(el); toast(t('sg_t_blocked'), 'bad'); return; }
    var nx = Motion.fx() === 'adv' ? 'std' : 'adv';
    Motion.set({ fx: nx });
    save();
    syncAnim();
    if (nx === 'adv') pvTick();
    toast(t(nx === 'adv' ? 'sg_t_adv_on' : 'sg_t_adv_off'), 'gold', { sub: t('sg_t_adv_sub') });
  }
  function toggleRm(el) {
    if (typeof Motion === 'undefined') return;
    if (Motion.sysReduced()) { shake(el); toast(t('sg_t_sys')); return; }
    var on = !Motion.userRm();
    Motion.set({ rm: on });
    save();
    syncAnim();
    toast(t(on ? 'sg_t_rm_on' : 'sg_t_rm_off'), on ? '' : 'gold', on ? { sub: t('sg_t_rm_sub') } : {});
  }
  function toShop() {
    closeSettings();
    try { setTab('profile'); } catch (e) { dbg('settings:shop', e); }
    setTimeout(function () {
      var b = document.querySelector('#v3p-vseg [data-cat="themes"]');
      if (b) b.click();
      var v = document.getElementById('v3p-vit');
      if (v && !v.classList.contains('hidden')) v.scrollIntoView({ behavior: adv() ? 'smooth' : 'auto', block: 'start' });
    }, V3.D(260) + 40);
  }

  function onClick(e) {
    var m = modal();
    var el = e.target.closest('[data-sg], [data-sg-th], [data-sg-lang], [data-sg-dot], [data-sg-gl], #sg-sw-adv, #sg-sw-rm, #sg-sw-sfx, #sg-sw-mus');
    if (!el || !m.contains(el)) return;
    if (el.id === 'sg-sw-sfx' || el.id === 'sg-sw-mus') {
      var k = el.id === 'sg-sw-sfx' ? 's' : 'm';
      Snd.unlock();
      Snd.set(k, Snd.get(k) ? 0 : 1);
      /* Включили и громкость на нуле — сразу слышимое значение. */
      if (Snd.get(k) && !Snd.get(k === 's' ? 'vs' : 'vm')) Snd.set(k === 's' ? 'vs' : 'vm', 50);
      if (k === 's' && Snd.get('s')) Snd.play('toggle');
      save();
      syncSnd();
      return;
    }
    if (el.id === 'sg-sw-adv') { toggleAdv(el); return; }
    if (el.id === 'sg-sw-rm') { toggleRm(el); return; }
    if (el.hasAttribute('data-sg-th')) { pickTheme(el.getAttribute('data-sg-th'), el); return; }
    if (el.hasAttribute('data-sg-lang')) {
      var l = el.getAttribute('data-sg-lang');
      if (l !== LANG) { setLang(l); if (adv()) burstAt(el, { kind: 'coin', count: 10, spread: 60 }); }
      return;
    }
    if (el.hasAttribute('data-sg-dot')) { go(+el.getAttribute('data-sg-dot')); return; }
    if (el.hasAttribute('data-sg-gl')) {
      var it = el.parentNode, op = !it.classList.contains('open');
      it.classList.toggle('open', op);
      el.setAttribute('aria-expanded', op ? 'true' : 'false');
      return;
    }
    var act = el.getAttribute('data-sg');
    if (act === 'close') closeSettings();
    else if (act === 'howto') { setView('how'); if (!V.levRaf) V.levRaf = requestAnimationFrame(levLoop); }
    else if (act === 'gloss') setView('how', true);
    else if (act === 'back') setView('set');
    else if (act === 'prev') { go(V.step - 1); if (!V.levRaf) V.levRaf = requestAnimationFrame(levLoop); }
    else if (act === 'next') { if (V.step === N - 1) finishHow(); else { go(V.step + 1); if (!V.levRaf) V.levRaf = requestAnimationFrame(levLoop); } }
    else if (act === 'shop') toShop();
    else if (act === 'profile') { closeSettings(); try { setTab('profile'); } catch (er) { dbg('settings:profile', er); } }
  }
  function onKey(e) {
    if (!isOpen() || V.view !== 'how') return;
    if (e.key === 'ArrowRight') go(V.step + 1);
    else if (e.key === 'ArrowLeft') go(V.step - 1);
  }

  /* ---------------- Открытие / закрытие ---------------- */

  function replay() {
    var m = modal();
    $$('.sg-rv', m).forEach(function (r) { r.style.animation = 'none'; V3.reflow(r); r.style.animation = ''; });
  }
  function open(view) {
    var m = modal();
    if (!m) return;
    /* Пересобираем при каждом открытии: язык мог определиться уже
       после init, а класс игрока (полоска профиля, лестница шага 6)
       и владение «Полночью» — измениться с прошлого раза. */
    if (!build()) return;
    setView(view === 'how' ? 'how' : 'set');
    $('#sg-set-body', m).scrollTop = 0;
    m.classList.add('sg-in');
    replay();
    openModal('modal-settings');
    pvStart();
    if (view === 'how' && !V.levRaf) V.levRaf = requestAnimationFrame(levLoop);
  }
  function onClosed() { pvStop(); }
  /* Перерисовка при смене языка: тексты строятся здесь, а не data-i18n. */
  function relang() {
    if (!V.built) return;
    var keepView = V.view, keepStep = V.step;
    var m = modal();
    m.classList.remove('sg-in');
    build();
    V.step = keepStep;
    renderStep(0, true);
    V.view = keepView;
    $('#sg-views', m).classList.toggle('push', keepView === 'how');
    if (isOpen()) pvStart();
  }

  function init() {
    var m = modal();
    if (!m || m.__sg) return;
    m.__sg = 1;
    m.addEventListener('click', onClick);
    m.addEventListener('input', function (e) {
      var v = e.target;
      if (!v || (v.id !== 'sg-v-sfx' && v.id !== 'sg-v-mus') || typeof Snd === 'undefined') return;
      var k = v.id === 'sg-v-sfx' ? 's' : 'm', n = +v.value || 0;
      Snd.unlock();
      Snd.set(k === 's' ? 'vs' : 'vm', n);
      if (n > 0 && !Snd.get(k)) Snd.set(k, 1);
      syncSnd();
    });
    m.addEventListener('change', function (e) { if (e.target && /^sg-v-/.test(e.target.id || '')) save(); });
    document.addEventListener('keydown', onKey);
    build();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { open: open, sync: sync, relang: relang, closed: onClosed, built: function () { return V.built; } };
})();
