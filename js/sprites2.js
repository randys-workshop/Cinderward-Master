/* ============================================================
   CINDERWARD — sprites2.js  (Chapter 2 art)
   New Cindren renderers + Scorchlands/grave tiles. Wraps the
   original SPR functions; Chapter 1 art untouched.
   ============================================================ */
(function () {
  'use strict';
  const SPR = SB.SPR, D = SB.DATA;
  const px = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, w, h); };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  const PAL = {
    ashkit:     { a: '#b08a6a', b: '#7a5a3a', c: '#e8d0b0', eye: '#2a1a10', glow: '#ff9a5a' },
    ashjackal:  { a: '#c87a4a', b: '#7a3a1a', c: '#ffcf8a', eye: '#2a1a10', glow: '#ff7a3c' },
    dunepup:    { a: '#d8b888', b: '#a8895a', c: '#f0e0c0', eye: '#3a2a1a', glow: '#c9a06a' },
    dunerekk:   { a: '#c9a06a', b: '#8a6a3a', c: '#e8d0a8', eye: '#3a2a1a', glow: '#ffd94a' },
    cindervolt: { a: '#ffd94a', b: '#c89a2a', c: '#fff2b0', eye: '#3a2a10', glow: '#ffffff' },
    blightwing: { a: '#6a5a7a', b: '#3a2a4a', c: '#9fd45a', eye: '#9fd45a', glow: '#b48aff' },
    solmoth:    { a: '#fff2b0', b: '#c8a03a', c: '#ffffff', eye: '#5a4a10', glow: '#ffffff' },
    magmaw:     { a: '#e85a2e', b: '#7a2a10', c: '#ffcf8a', eye: '#2a0a05', glow: '#ffd94a' },
    kael:       { a: '#8a8a98', b: '#4a4a58', c: '#b8b8c8', eye: '#b48aff', glow: '#b48aff' },
    morvane:    { a: '#3a3050', b: '#1a1428', c: '#ffe89a', eye: '#fff2b0', glow: '#ff9a5a' }
  };

  const cache = new Map();
  function drawNew(spId, frame) {
    const key = spId + '|' + frame;
    if (cache.has(key)) return cache.get(key);
    const sp = D.SPECIES[spId];
    const boss = sp.boss, S = boss ? 28 : 20;
    const c = mk(S, S), g = c.getContext('2d');
    const bob = frame === 1 ? 1 : 0;
    const C = PAL[sp.spr];
    const P = (x, y, w, h, col) => px(g, x, y + bob, w, h, col);
    switch (sp.spr) {
      case 'ashkit':
        P(5, 10, 10, 6, C.a); P(6, 9, 8, 2, C.a);
        P(3, 7, 5, 6, C.a);
        P(2, 4, 2, 4, C.b); P(6, 4, 2, 4, C.b);
        P(4, 9, 1, 1, C.eye); P(6, 9, 1, 1, C.eye);
        P(3, 11, 1, 1, C.c);
        P(15, 9, 3, 2, C.b); P(17, 7, 2, 2, C.glow);
        P(6, 16, 2, 1, C.b); P(12, 16, 2, 1, C.b);
        P(7, 12, 6, 3, C.c);
        break;
      case 'ashjackal':
        P(3, 11, 14, 6, C.a); P(4, 10, 12, 2, C.a);
        P(2, 6, 7, 7, C.a);
        P(1, 3, 2, 4, C.b); P(7, 3, 2, 4, C.b);
        P(3, 8, 1, 1, C.eye); P(6, 8, 1, 1, C.eye);
        P(4, 10, 2, 1, C.c);
        P(9, 8, 8, 2, C.glow); P(12, 6, 4, 2, C.b);
        P(16, 9, 3, 2, C.b); P(18, 7, 1, 3, C.glow);
        P(4, 17, 2, 2, C.b); P(13, 17, 2, 2, C.b);
        P(5, 13, 9, 3, C.c);
        break;
      case 'dunepup':
        P(5, 10, 10, 7, C.a); P(6, 9, 8, 2, C.a);
        P(3, 7, 6, 6, C.a);
        P(2, 5, 2, 3, C.b); P(7, 5, 2, 3, C.b);
        P(4, 9, 1, 1, C.eye); P(7, 9, 1, 1, C.eye);
        P(4, 11, 2, 1, C.c);
        P(15, 11, 3, 2, C.b);
        P(6, 17, 2, 1, C.b); P(12, 17, 2, 1, C.b);
        P(7, 12, 6, 3, C.c);
        P(9, 8, 2, 1, C.glow);
        break;
      case 'dunerekk':
        P(4, 12, 12, 6, C.a); P(5, 10, 10, 3, C.b); P(6, 8, 8, 3, C.a);
        P(3, 8, 5, 6, C.a);
        P(4, 10, 1, 1, C.eye); P(6, 10, 1, 1, C.eye);
        P(8, 6, 4, 2, C.b); P(12, 7, 3, 2, C.a);
        P(15, 12, 3, 2, C.b);
        P(5, 18, 3, 1, C.b); P(12, 18, 3, 1, C.b);
        P(8, 13, 5, 3, C.glow);
        break;
      case 'cindervolt':
        P(5, 10, 10, 6, C.a); P(6, 9, 8, 2, C.a);
        P(3, 7, 5, 6, C.a);
        P(2, 2, 2, 6, C.b); P(6, 2, 2, 6, C.b); // long hare ears
        P(2, 2, 1, 2, C.glow); P(7, 2, 1, 2, C.glow);
        P(4, 9, 1, 1, C.eye); P(6, 9, 1, 1, C.eye);
        P(15, 8, 2, 2, C.glow); P(17, 6, 1, 3, C.glow); P(16, 10, 2, 1, C.glow);
        P(6, 16, 2, 1, C.b); P(12, 16, 2, 1, C.b);
        P(7, 12, 6, 3, C.c);
        break;
      case 'blightwing':
        P(8, 8, 4, 6, C.a); P(8, 6, 4, 3, C.a);
        P(7, 4, 1, 3, C.b); P(12, 4, 1, 3, C.b);
        P(9, 7, 1, 1, C.eye); P(11, 7, 1, 1, C.eye);
        P(2, 7, 6, 5, C.b); P(12, 7, 6, 5, C.b);
        P(1, 8, 2, 3, C.a); P(17, 8, 2, 3, C.a);
        P(3, 12, 1, 2, C.c); P(16, 12, 1, 2, C.c); // miasma drips
        P(9, 10, 2, 2, C.glow);
        break;
      case 'solmoth':
        P(8, 8, 4, 7, C.b); P(8, 6, 4, 3, C.a); // body
        P(9, 7, 1, 1, C.eye); P(11, 7, 1, 1, C.eye);
        P(7, 4, 1, 3, C.b); P(12, 4, 1, 3, C.b); // antennae
        P(2, 5, 6, 8, C.a); P(12, 5, 6, 8, C.a); // wings
        P(3, 6, 4, 5, C.c); P(13, 6, 4, 5, C.c);
        P(4, 7, 2, 2, C.glow); P(14, 7, 2, 2, C.glow);
        P(8, 15, 4, 1, C.b);
        break;
      case 'magmaw':
        P(3, 10, 14, 8, C.a); P(4, 9, 12, 2, C.a);
        P(2, 6, 8, 7, C.a);
        P(1, 3, 2, 4, C.b); P(8, 3, 2, 4, C.b);
        P(3, 8, 2, 1, C.eye); P(6, 8, 2, 1, C.eye);
        P(2, 11, 7, 2, C.b);
        P(3, 11, 1, 1, C.glow); P(5, 11, 1, 1, C.glow); P(7, 11, 1, 1, C.glow);
        P(16, 8, 3, 3, C.b); P(18, 6, 1, 3, C.glow);
        P(4, 18, 3, 1, C.b); P(12, 18, 3, 1, C.b);
        P(6, 13, 8, 4, C.glow); P(8, 14, 4, 2, C.c);
        break;
      case 'kael':
        P(9, 2, 10, 8, C.a); P(8, 1, 12, 3, C.b); // helm
        P(11, 5, 2, 2, C.eye); P(15, 5, 2, 2, C.eye);
        P(7, 10, 14, 12, C.b); P(9, 10, 10, 12, C.a); // armor
        P(12, 12, 4, 5, C.c);
        P(4, 11, 3, 8, C.b); P(21, 11, 3, 8, C.b);
        P(3, 18, 2, 3, C.a); P(23, 18, 2, 3, C.a);
        P(2, 6, 1, 14, C.c); P(1, 5, 3, 2, C.glow); // grey blade
        P(9, 22, 4, 3, C.b); P(15, 22, 4, 3, C.b);
        P(6, 10, 2, 10, C.glow);
        break;
      case 'morvane':
        // a vast dead sun filling the frame: dark disc, long corona, closed eye, cracks of stolen light
        P(4, 4, 20, 20, C.b); P(6, 2, 16, 2, C.b); P(6, 24, 16, 2, C.b);
        P(2, 6, 2, 16, C.b); P(24, 6, 2, 16, C.b);
        P(6, 6, 16, 16, C.a);
        P(0, 12, 3, 4, C.glow); P(25, 12, 3, 4, C.glow); P(12, 0, 4, 3, C.glow); P(12, 25, 4, 3, C.glow);
        P(3, 3, 2, 2, C.glow); P(23, 3, 2, 2, C.glow); P(3, 23, 2, 2, C.glow); P(23, 23, 2, 2, C.glow);
        P(9, 12, 10, 1, C.eye); P(11, 13, 6, 1, C.eye); P(13, 14, 2, 1, C.eye);
        P(8, 8, 1, 5, C.c); P(19, 15, 1, 5, C.c); P(12, 19, 4, 1, C.c); P(15, 7, 1, 3, C.c);
        P(13, 9, 2, 2, C.glow);
        break;
      default:
        P(5, 6, 10, 10, C.a); P(7, 8, 2, 2, C.eye); P(11, 8, 2, 2, C.eye);
    }
    cache.set(key, c);
    return c;
  }

  const origBeast = SPR.drawBeast;
  SPR.drawBeast = function (spId, frame, scale) {
    const sp = D.SPECIES[spId];
    if (sp && PAL[sp.spr]) return drawNew(spId, frame);
    return origBeast(spId, frame, scale);
  };

  /* ---------- new tiles ---------- */
  function rnd(seed) { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
  const tcache = new Map();
  const NEW_TILES = {
    ash(g, r) { px(g, 0, 0, 16, 16, '#8a7a68'); for (let i = 0; i < 6; i++) px(g, (r() * 16) | 0, (r() * 16) | 0, 1, 1, r() > 0.5 ? '#9a8a78' : '#6a5a48'); },
    scorched(g, r) { px(g, 0, 0, 16, 16, '#6a5a48'); for (let i = 0; i < 5; i++) { const x = (r() * 14) | 0; px(g, x, 6 + (r() * 4 | 0), 2, 8, '#4a3a28'); px(g, x, 5 + (r() * 3 | 0), 1, 3, '#8a6a4a'); } },
    blight(g, r) { px(g, 0, 0, 16, 16, '#4a4a3a'); for (let i = 0; i < 5; i++) { const x = (r() * 14) | 0; px(g, x, 6 + (r() * 4 | 0), 2, 8, '#3a4a2a'); px(g, x, 5, 1, 3, '#6a8a3a'); } px(g, 4, 4, 2, 2, '#9fd45a'); },
    deadtree(g) { px(g, 0, 0, 16, 16, '#8a7a68'); px(g, 6, 6, 4, 10, '#4a3a28'); px(g, 3, 4, 3, 2, '#4a3a28'); px(g, 10, 3, 3, 2, '#4a3a28'); px(g, 7, 2, 2, 4, '#3a2a18'); },
    bone(g) { px(g, 0, 0, 16, 16, '#8a7a68'); px(g, 3, 9, 10, 2, '#d8d0c0'); px(g, 2, 8, 2, 4, '#e8e0d0'); px(g, 12, 8, 2, 4, '#e8e0d0'); px(g, 6, 6, 4, 2, '#d8d0c0'); },
    gravewall(g) { px(g, 0, 0, 16, 16, '#3a3040'); px(g, 0, 0, 16, 1, '#5a4a60'); px(g, 0, 7, 16, 1, '#241c30'); px(g, 7, 0, 1, 7, '#241c30'); px(g, 3, 8, 1, 8, '#241c30'); px(g, 11, 8, 1, 8, '#241c30'); },
    gravefloor(g, r) { px(g, 0, 0, 16, 16, '#4a4050'); px(g, 0, 0, 16, 1, '#5a5060'); px(g, 0, 15, 16, 1, '#342c40'); px(g, 7, 0, 1, 16, '#3a3244'); for (let i = 0; i < 3; i++) px(g, (r() * 15) | 0, (r() * 15) | 0, 1, 1, '#342c40'); },
    beacon(g) { px(g, 0, 0, 16, 16, '#8a7a68'); px(g, 6, 6, 4, 10, '#5a5a68'); px(g, 4, 3, 8, 4, '#6a6a78'); px(g, 5, 4, 6, 2, '#ffcf8a'); px(g, 6, 2, 4, 2, '#ffd94a'); },
    idol(g) { px(g, 0, 0, 16, 16, '#4a4050'); px(g, 4, 4, 8, 11, '#3a3040'); px(g, 5, 5, 6, 6, '#241c30'); px(g, 6, 6, 4, 3, '#ffe89a'); px(g, 7, 6, 2, 2, '#fff2b0'); px(g, 4, 4, 8, 1, '#5a4a60'); },
    ashsand(g, r) { px(g, 0, 0, 16, 16, '#a89878'); for (let i = 0; i < 4; i++) px(g, (r() * 15) | 0, (r() * 15) | 0, 1, 1, '#8a7a58'); }
  };
  function newTile(type, variant) {
    const key = type + '|' + variant;
    if (tcache.has(key)) return tcache.get(key);
    const c = mk(16, 16), g = c.getContext('2d');
    NEW_TILES[type](g, rnd(variant * 7919 + type.charCodeAt(0) * 131));
    tcache.set(key, c);
    return c;
  }
  const origTile = SPR.drawTile;
  SPR.drawTile = function (type, variant) {
    if (NEW_TILES[type]) return newTile(type, variant);
    return origTile(type, variant);
  };
})();
