#!/usr/bin/env python3
"""Собирает js/assets-manifest.js — список ресурсов для экрана первой загрузки.

Запуск из корня репозитория:  python3 tools/make_manifest.py

Перезапускать после добавления, удаления или замены картинок (и перед
релизом вместе с подъёмом ?v). Лоадер (js/loader.js) сравнивает хеши из
манифеста с сохранёнными на устройстве и докачивает только изменённое.

URL пишем ровно в том виде, в каком их запрашивает игра (с ?v=…):
браузер кладёт картинку в память под полным адресом, и тогда <img> с тем
же src показывается сразу, без постепенной прорисовки.
"""
import hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)


def rd(p):
    with open(p, encoding='utf-8-sig') as f:
        return f.read()


def ent(url):
    path = url.split('?')[0]
    if not os.path.isfile(path):
        print('  нет файла, пропуск:', url, file=sys.stderr)
        return None
    b = open(path, 'rb').read()
    return [url, len(b), hashlib.sha1(b).hexdigest()[:8]]


def grp(urls):
    out, seen = [], set()
    for u in urls:
        if u in seen:
            continue
        seen.add(u)
        e = ent(u)
        if e:
            out.append(e)
    return out


def ls(d, ext=('.png', '.svg')):
    return sorted(f for f in os.listdir(d) if f.endswith(ext) and not f.startswith('.'))


html = rd('index.html')
# core: стили и скрипты из index.html (dev-скрипты и SDK не считаем).
core = re.findall(r'<link rel="stylesheet" href="(css/[^"]+)"', html) + \
       re.findall(r'<script src="(js/[^"]+)"', html)
# Сам манифест в core не кладём: его хеш зависел бы от него же.
core = [u for u in core if not u.startswith('js/assets-manifest.js')]

# Логотипы монет — ровно как в data-coins.js.
coins = re.findall(r"img: '([^']+)'", rd('js/data-coins.js'))

cat_ver = re.search(r'var CAT_ICON_VER = (\d+);', rd('js/main.js')).group(1)
qs_ver = re.search(r"var IMG_V = '([^']*)';", rd('js/quests.js')).group(1)
icons = ['img/logo-small.png?v=139'] + \
    ['img/tab-%s.png?v=139' % t for t in ('home', 'market', 'portfolio', 'rating', 'profile')] + \
    ['img/sort-%s.png?v=14' % s for s in ('cap', 'price', 'change', 'volume', 'az')] + \
    ['img/cats/%s?v=%s' % (f, cat_ver) for f in ls('img/cats')] + \
    ['img/icons/%s?v=2' % f for f in ls('img/icons', ('.png',)) if f.startswith('class-')] + \
    ['img/qs/%s%s' % (f, qs_ver) for f in ls('img/qs', ('.svg',))] + \
    ['img/best.png', 'img/best.png?v=139'] + \
    ['img/avatars/%s?v=1' % f for f in ls('img/avatars', ('.png',))]


def fx(t):
    return ['img/gift-%s.png?v=139' % t, 'img/play-%s.png?v=139' % t, 'img/spin-%s.png?v=139' % t]


m = {
    'core': grp(core),
    'coins': grp(coins),
    'icons': grp(icons),
    'ach_dark': grp('img/ach-dark/' + f for f in ls('img/ach-dark', ('.png',))),
    'ach_light': grp('img/ach-light/' + f for f in ls('img/ach-light', ('.png',))),
    'fx': grp(['img/transaction-buy.png', 'img/transaction-sell.png', 'img/transaction-meta.json']),
    'fx_dark': grp(fx('dark')),
    'fx_light': grp(fx('light')),
}
ver = hashlib.sha1(json.dumps(m, sort_keys=True).encode()).hexdigest()[:10]
body = ('/* Сгенерировано tools/make_manifest.py — руками не править.\n'
        '   [url, байты, хеш]. Группы: core (уже загружено страницей), coins, icons,\n'
        '   ach_* и fx_* (по семейству темы), fx (общие анимации сделки). */\n'
        'var ASSET_MANIFEST = { v: \'%s\', groups: {\n' % ver)
body += ',\n'.join('  %s: %s' % (k, json.dumps(v, separators=(',', ':'))) for k, v in m.items())
body += '\n} };\n'
open('js/assets-manifest.js', 'w', encoding='utf-8', newline='\n').write(body)
tot = sum(e[1] for v in m.values() for e in v)
print('assets-manifest.js: v=%s, файлов %d, %.1f МБ' % (ver, sum(len(v) for v in m.values()), tot / 1048576))
for k, v in m.items():
    print('  %-10s %4d  %6.2f МБ' % (k, len(v), sum(e[1] for e in v) / 1048576))
