/* ============================================================
   CINDERWARD — sprites.js
   Procedural pixel art: hero (13 gear layers), Cindren, tiles.
   Everything drawn in code — no external assets. Original art.
   ============================================================ */
window.SB = window.SB || {};

SB.SPR = (function () {
  'use strict';
  const D = SB.DATA;

  /* ---------- palettes ---------- */
  const SKIN = ['#f2c9a0', '#e0a878', '#c68863', '#a06a48', '#7a4a30', '#5a3423'];
  const HAIRC = ['#2a2a35', '#5a3a22', '#8a5a2b', '#c8a03a', '#d8d8e0', '#b04a3a', '#5a7a9a', '#7a5a9a'];
  const CLOTH = ['#b04a3a', '#3a6ab0', '#3a9a5a', '#c8a03a', '#7a5ab0', '#d8d0b8', '#5a5a68', '#3a3a45'];
  const PANTC = ['#3a3a45', '#5a4a32', '#2a4a6a', '#4a3a5a', '#6a6a72', '#3a5a4a'];
  const BOOTC = ['#3a2a1a', '#5a4a32', '#2a2a35', '#6a3a2a'];
  const EYEC = ['#2a2a35', '#3a6ab0', '#3a9a5a', '#8a5a2b'];

  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function px(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(x | 0, y | 0, w, h); }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, Math.round(r * f)));
    gg = Math.max(0, Math.min(255, Math.round(gg * f)));
    b = Math.max(0, Math.min(255, Math.round(b * f)));
    return '#' + ((r << 16) | (gg << 8) | b).toString(16).padStart(6, '0');
  }

  /* ============================================================
     HERO — 16 x 24, dirs: 0 down 1 left 2 right 3 up, frames 0/1/2
     ============================================================ */
  const heroCache = new Map();

  function resolveLook(look) {
    const L = Object.assign({ body: 0, skin: 0, hair: 0, hairColor: 0, eyes: 0, tunic: 0, tunicColor: 0, trim: 1, pants: 0, boots: 0, cape: 0, capeColor: 0, accessory: 0 }, look || {});
    return L;
  }

  function gearVis(hero, slot) {
    const id = hero.gear && hero.gear[slot];
    if (!id || (hero.hidden && hero.hidden[slot])) return null;
    const g = D.GEAR[id];
    return g ? g.vis : null;
  }

  function drawHero(look, hero, dir, frame) {
    const L = resolveLook(look);
    const gear = hero ? hero.gear : null;
    const hidden = hero ? hero.hidden : null;
    const key = JSON.stringify([L, gear, hidden, dir, frame]);
    if (heroCache.has(key)) return heroCache.get(key);

    const c = mk(16, 24), g = c.getContext('2d');
    const skin = SKIN[L.skin % SKIN.length];
    const skinD = shade(skin, 0.8);
    const hair = HAIRC[L.hairColor % HAIRC.length];
    const hairD = shade(hair, 0.75);
    const eye = EYEC[L.eyes % EYEC.length];
    const gv = (slot) => {
      const id = gear && gear[slot];
      if (!id || (hidden && hidden[slot])) return null;
      const it = D.GEAR[id]; return it ? it.vis : null;
    };

    // resolved clothing colors (gear overrides base)
    const chestV = gv('chest'), legV = gv('legs'), feetV = gv('feet'), handV = gv('hands');
    let tunic = CLOTH[L.tunicColor % CLOTH.length];
    let trim = CLOTH[L.trim % CLOTH.length];
    let tunicStyle = L.tunic; // 0 vest 1 robe 2 hauberk
    if (chestV) { tunic = chestV.c1; trim = chestV.c2 || shade(chestV.c1, 0.7); tunicStyle = chestV.k === 'plate' ? 2 : chestV.k === 'robe' ? 1 : 0; }
    const pants = legV ? legV.c1 : PANTC[L.pants % PANTC.length];
    const boots = feetV ? feetV.c1 : BOOTC[L.boots % BOOTC.length];
    const gloves = handV ? handV.c1 : skin;

    const step = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    const side = dir === 1 || dir === 2;
    const flip = dir === 2;

    // ---- back layer: cape / wings ----
    const backV = gv('back');
    const capeN = backV ? 2 : L.cape; // gear cape forces on
    const capeCol = backV ? backV.c1 : CLOTH[L.capeColor % CLOTH.length];
    const capeCol2 = backV ? (backV.c2 || shade(capeCol, 0.7)) : shade(capeCol, 0.7);
    if (backV && backV.k === 'wings') {
      const wc = backV.c1, wc2 = backV.c2 || shade(wc, 0.7);
      const wob = frame === 0 ? 0 : 1;
      px(g, 0, 8 + wob, 3, 7, wc); px(g, 13, 8 + wob, 3, 7, wc);
      px(g, 0, 9 + wob, 2, 5, wc2); px(g, 14, 9 + wob, 2, 5, wc2);
      px(g, 1, 7 + wob, 2, 2, wc); px(g, 13, 7 + wob, 2, 2, wc);
    } else if (capeN > 0) {
      const len = capeN === 1 ? 8 : capeN === 2 ? 13 : 11;
      const sway = step;
      if (dir === 3) { // up: cape covers back fully
        px(g, 3, 8, 10, len, capeCol);
        px(g, 3, 8, 10, 1, capeCol2);
        px(g, 4 + sway, 8 + len - 2, 8, 2, capeCol2);
      } else if (side) {
        px(g, flip ? 9 : 3, 8, 4, len, capeCol);
        px(g, flip ? 10 : 3, 8 + len - 2, 3, 2, capeCol2);
      } else {
        px(g, 1, 8, 3, len, capeCol); px(g, 12, 8, 3, len, capeCol);
        px(g, 1, 8 + len - 2, 3, 2, capeCol2); px(g, 12, 8 + len - 2, 3, 2, capeCol2);
        px(g, 2, 8, 1, len - 2, capeCol2); px(g, 13, 8, 1, len - 2, capeCol2);
      }
      if (capeN === 3) { // tattered edge
        px(g, 1, 8 + len - 1, 1, 1, capeCol2); px(g, 14, 8 + len - 1, 1, 1, capeCol2);
      }
    }

    // ---- legs / boots ----
    const legY = 16;
    if (side) {
      const lx = 6;
      px(g, lx, legY, 4, 6, pants);
      px(g, lx + step, legY + 5, 4, 2, boots);
      px(g, lx - step, legY + 1, 3, 4, shade(pants, 0.85));
    } else {
      px(g, 5, legY, 3, 6 + (step > 0 ? 0 : 0), pants);
      px(g, 8, legY, 3, 6, pants);
      px(g, 5, legY + 5 + (step > 0 ? 1 : 0), 3, 2, boots);
      px(g, 8, legY + 5 + (step < 0 ? 1 : 0), 3, 2, boots);
      if (dir === 3) px(g, 5, legY, 6, 1, shade(pants, 0.8));
    }

    // ---- torso / tunic ----
    const torsoY = 8;
    if (side) {
      px(g, 5, torsoY, 6, 8, tunic);
      px(g, 5, torsoY, 6, 1, trim);
      if (tunicStyle === 1) px(g, 5, torsoY + 6, 6, 2, tunic); // robe flare
      if (tunicStyle === 2) { px(g, 5, torsoY + 2, 6, 1, shade(tunic, 1.2)); px(g, 5, torsoY + 4, 6, 1, shade(tunic, 1.2)); }
      // arm
      px(g, flip ? 9 : 4, torsoY + 1, 3, 5, tunic);
      px(g, flip ? 9 : 4, torsoY + 5, 3, 2, gloves);
    } else {
      px(g, 4, torsoY, 8, 8, tunic);
      px(g, 4, torsoY, 8, 1, trim);
      px(g, 7, torsoY + 1, 2, 6, shade(tunic, 0.9)); // center seam
      if (tunicStyle === 1) { px(g, 3, torsoY + 6, 10, 2, tunic); px(g, 3, torsoY + 7, 10, 1, trim); }
      if (tunicStyle === 2) { px(g, 4, torsoY + 2, 8, 1, shade(tunic, 1.25)); px(g, 4, torsoY + 4, 8, 1, shade(tunic, 1.25)); }
      // arms
      px(g, 2, torsoY + 1 + (step > 0 ? 1 : 0), 2, 5, tunic);
      px(g, 12, torsoY + 1 + (step < 0 ? 1 : 0), 2, 5, tunic);
      px(g, 2, torsoY + 5 + (step > 0 ? 1 : 0), 2, 2, gloves);
      px(g, 12, torsoY + 5 + (step < 0 ? 1 : 0), 2, 2, gloves);
    }

    // ---- waist belt ----
    const waistV = gv('waist');
    if (waistV) {
      px(g, side ? 5 : 4, 15, side ? 6 : 8, 1, waistV.c1);
      px(g, 7, 15, 2, 1, waistV.c2 || shade(waistV.c1, 1.4));
    }

    // ---- shoulders ----
    const shV = gv('shoulders');
    if (shV) {
      const sc = shV.c1, sc2 = shV.c2 || shade(sc, 1.3);
      if (side) { px(g, 4, torsoY, 4, 2, sc); px(g, 4, torsoY, 4, 1, sc2); }
      else { px(g, 2, torsoY, 3, 2, sc); px(g, 11, torsoY, 3, 2, sc); px(g, 2, torsoY, 3, 1, sc2); px(g, 11, torsoY, 3, 1, sc2); }
    }

    // ---- neck pendant ----
    const neckV = gv('neck');
    if (neckV && dir !== 3) {
      px(g, 7, torsoY + 1, 2, 1, neckV.c1);
      px(g, 7, torsoY + 2, 2, 1, neckV.gem || neckV.c1);
      if (neckV.glow) px(g, 7, torsoY + 2, 1, 1, '#ffffff');
    }

    // ---- head ----
    const headY = 0;
    const hx = side ? 5 : 4;
    const hw = side ? 7 : 8;
    // hair back
    px(g, hx, headY, hw, 8, hair);
    // face
    if (dir !== 3) {
      if (side) {
        px(g, flip ? 5 : 6, headY + 3, 5, 5, skin);
        px(g, flip ? 5 : 9, headY + 4, 1, 1, eye);
        px(g, flip ? 5 : 9, headY + 6, 2, 1, skinD);
      } else {
        px(g, 5, headY + 3, 6, 5, skin);
        px(g, 6, headY + 4, 1, 1, eye); px(g, 9, headY + 4, 1, 1, eye);
        px(g, 7, headY + 6, 2, 1, skinD);
      }
    } else {
      px(g, hx, headY, hw, 8, hair); // full back of head
      px(g, hx, headY + 7, hw, 1, hairD);
    }
    // hairstyle
    const hs = L.hair;
    if (hs === 0) { px(g, hx, headY, hw, 3, hair); px(g, hx, headY + 3, 1, 2, hair); px(g, hx + hw - 1, headY + 3, 1, 2, hair); }
    else if (hs === 1) { px(g, hx, headY, hw, 4, hair); px(g, hx + 1, headY + 4, hw - 2, 1, hair); } // short crop
    else if (hs === 2) { px(g, hx, headY, hw, 3, hair); px(g, hx - 1, headY + 2, 1, 6, hair); px(g, hx + hw, headY + 2, 1, 6, hair); } // long sides
    else if (hs === 3) { px(g, hx, headY, hw, 3, hair); px(g, hx + hw - 2, headY + 3, 2, 7, hair); } // side sweep
    else if (hs === 4) { px(g, hx, headY, hw, 2, hair); px(g, hx + 2, headY - 0, 4, 1, hair); px(g, hx + hw - 1, headY + 2, 1, 4, hair); } // topknot-ish
    else if (hs === 5) { px(g, hx, headY, hw, 3, hair); px(g, hx + 1, headY + 3, 1, 3, hair); px(g, hx + hw - 2, headY + 3, 1, 3, hair); px(g, hx + 3, headY + 3, 2, 1, hair); } // braids
    if (dir !== 3 && !side) px(g, hx, headY, hw, 2, hair); // fringe
    if (dir !== 3 && side) px(g, hx, headY, hw, 3, hair);

    // ---- accessory ----
    const acc = L.accessory;
    if (acc === 1) { px(g, 4, 8, 8, 2, CLOTH[(L.capeColor + 2) % 8]); } // scarf
    else if (acc === 2) { // goggles on forehead
      px(g, hx, headY + 2, hw, 1, '#3a3a45');
      px(g, hx + 1, headY + 2, 2, 1, '#7fd4ff'); px(g, hx + hw - 3, headY + 2, 2, 1, '#7fd4ff');
    } else if (acc === 3) { px(g, hx + hw - 2, headY + 1, 2, 2, '#e86a8a'); px(g, hx + hw - 1, headY + 1, 1, 1, '#ffd94a'); } // flower
    else if (acc === 4) { px(g, hx - 1, headY + 3, 1, 3, hair); px(g, hx + hw, headY + 3, 1, 3, hair); } // hood hint

    // ---- head gear ----
    const headV = gv('head');
    if (headV) {
      const hc = headV.c1, hc2 = headV.c2 || shade(hc, 0.7);
      if (headV.k === 'helm') {
        px(g, hx - 1, headY, hw + 2, 4, hc);
        px(g, hx - 1, headY, hw + 2, 1, hc2);
        px(g, hx - 1, headY + 3, 1, 3, hc); px(g, hx + hw, headY + 3, 1, 3, hc);
        if (dir !== 3) px(g, hx + 1, headY + 3, hw - 2, 1, hc2);
        px(g, hx + 2, headY - 1, hw - 4, 1, hc2); // crest
      } else if (headV.k === 'circlet') {
        px(g, hx, headY + 2, hw, 1, hc);
        px(g, hx + 3, headY + 1, 2, 2, headV.glow || hc2);
        if (headV.glow) px(g, hx + 3, headY + 1, 1, 1, '#ffffff');
      } else if (headV.k === 'hood') {
        px(g, hx - 1, headY, hw + 2, 5, hc);
        px(g, hx - 1, headY + 4, 1, 4, hc); px(g, hx + hw, headY + 4, 1, 4, hc);
        if (dir !== 3) px(g, hx + 1, headY + 4, hw - 2, 1, shade(hc, 0.5));
        px(g, hx, headY, hw, 1, hc2);
      } else if (headV.k === 'hat') {
        px(g, hx - 1, headY + 1, hw + 2, 2, hc);
        px(g, hx, headY - 1, hw, 2, hc);
        px(g, hx - 2, headY + 2, hw + 4, 1, hc2);
      }
    }

    // ---- weapon + offhand ----
    const wV = gv('weapon'), oV = gv('offhand');
    const handX = side ? (flip ? 10 : 3) : 12;
    const handY = torsoY + 5;
    if (wV) {
      const bc = wV.c1, hc = wV.c2 || '#8a5a2b';
      const glow = wV.glow;
      if (side) {
        const wx = flip ? 12 : 1;
        if (wV.k === 'staff') { px(g, wx, 3, 1, 16, hc); px(g, wx - 1, 2, 3, 3, bc); if (glow) px(g, wx, 2, 1, 1, '#ffffff'); }
        else if (wV.k === 'dagger') { px(g, wx, handY - 3, 1, 4, bc); px(g, wx, handY + 1, 1, 2, hc); if (glow) px(g, wx, handY - 3, 1, 1, glow); }
        else if (wV.k === 'axe') { px(g, wx, handY - 4, 1, 7, hc); px(g, wx + (flip ? -2 : 1), handY - 4, 2, 3, bc); }
        else if (wV.k === 'mace') { px(g, wx, handY - 3, 1, 6, hc); px(g, wx - 1, handY - 4, 3, 2, bc); }
        else { px(g, wx, handY - 6, 1, 7, bc); px(g, wx - 1, handY + 1, 3, 1, hc); px(g, wx, handY + 2, 1, 2, hc); if (glow) px(g, wx, handY - 6, 1, 2, glow); }
      } else {
        const wx = 13;
        if (wV.k === 'staff') { px(g, wx, 2, 1, 18, hc); px(g, wx - 1, 1, 3, 3, bc); if (glow) px(g, wx, 1, 1, 1, '#ffffff'); }
        else if (wV.k === 'dagger') { px(g, wx, handY - 2, 1, 3, bc); px(g, wx, handY + 1, 1, 2, hc); }
        else if (wV.k === 'axe') { px(g, wx, handY - 3, 1, 6, hc); px(g, wx + 1, handY - 3, 2, 3, bc); }
        else if (wV.k === 'mace') { px(g, wx, handY - 2, 1, 5, hc); px(g, wx - 1, handY - 3, 3, 2, bc); }
        else { px(g, wx, handY - 5, 1, 6, bc); px(g, wx - 1, handY + 1, 3, 1, hc); px(g, wx, handY + 2, 1, 2, hc); if (glow) px(g, wx, handY - 5, 1, 2, glow); }
      }
    }
    if (oV) {
      const oc = oV.c1, oc2 = oV.c2 || shade(oc, 0.7);
      const ox = side ? (flip ? 3 : 10) : 2;
      if (oV.k === 'shield') { px(g, ox - 1, torsoY + 2, 3, 5, oc); px(g, ox - 1, torsoY + 2, 3, 1, oc2); px(g, ox, torsoY + 4, 1, 1, oc2); }
      else if (oV.k === 'orb') { px(g, ox, torsoY + 4, 2, 2, oc); if (oV.glow) px(g, ox, torsoY + 4, 1, 1, '#ffffff'); }
      else { px(g, ox, torsoY + 4, 2, 2, oc); px(g, ox, torsoY + 3, 1, 1, oc2); }
    }

    // ---- ring sparkle ----
    const ringV = gv('ring');
    if (ringV && frame !== 0) { px(g, handX, handY, 1, 1, ringV.gem); if (ringV.glow) px(g, handX, handY - 1, 1, 1, ringV.glow); }

    // ---- trinket (orbiting) ----
    const trV = gv('trinket');
    if (trV) {
      const ang = (frame / 3) * Math.PI * 2;
      const tx = Math.round(8 + Math.cos(ang) * 7);
      const ty = Math.round(12 + Math.sin(ang) * 4);
      if (trV.k === 'lantern') { px(g, tx, ty, 2, 2, trV.c1); px(g, tx, ty - 1, 1, 1, trV.c2 || '#5a4a32'); if (trV.glow) px(g, tx, ty, 1, 1, '#ffffff'); }
      else if (trV.k === 'orb') { px(g, tx, ty, 1, 1, trV.c1); if (trV.glow) px(g, tx, ty, 1, 1, '#ffffff'); }
      else { px(g, tx, ty, 1, 2, trV.c1); }
    }

    heroCache.set(key, c);
    if (heroCache.size > 400) { const first = heroCache.keys().next().value; heroCache.delete(first); }
    return c;
  }

  /* ============================================================
     CINDREN — procedural creatures, 20x20 (bosses 28x28)
     ============================================================ */
  const beastCache = new Map();

  function drawBeast(spId, frame, scale) {
    const sp = D.SPECIES[spId];
    const boss = sp.boss;
    const S = boss ? 28 : 20;
    const key = spId + '|' + frame + '|' + (scale || 1);
    if (beastCache.has(key)) return beastCache.get(key);
    const c = mk(S, S), g = c.getContext('2d');
    const bob = frame === 1 ? 1 : 0;
    const C = BEAST_PAL[spId] || { a: '#ff7a3c', b: '#c85a2a', c: '#ffd9a0', eye: '#2a2a35', glow: '#ffcf8a' };
    const P = (x, y, w, h, col) => px(g, x, y + bob, w, h, col);

    switch (sp.spr) {
      case 'cindpup':
        P(4, 10, 12, 7, C.a); P(5, 9, 10, 2, C.a); // body
        P(3, 6, 6, 6, C.a); // head
        P(2, 4, 2, 3, C.b); P(7, 4, 2, 3, C.b); // flame ears
        P(3, 3, 1, 2, C.glow); P(8, 3, 1, 2, C.glow);
        P(4, 8, 1, 1, C.eye); P(7, 8, 1, 1, C.eye);
        P(5, 10, 1, 1, C.c); // nose
        P(15, 8, 3, 2, C.b); P(17, 6, 2, 3, C.glow); // flame tail
        P(5, 17, 2, 2, C.b); P(12, 17, 2, 2, C.b); // paws
        P(6, 12, 8, 3, C.c); // belly
        break;
      case 'emberhound':
        P(3, 11, 14, 6, C.a); P(4, 10, 12, 2, C.a);
        P(2, 6, 7, 7, C.a);
        P(1, 3, 2, 4, C.b); P(7, 3, 2, 4, C.b);
        P(2, 2, 1, 2, C.glow); P(8, 2, 1, 2, C.glow);
        P(3, 8, 1, 1, C.eye); P(6, 8, 1, 1, C.eye);
        P(4, 10, 2, 1, C.c);
        P(9, 8, 8, 3, C.glow); P(11, 6, 5, 2, C.b); P(13, 5, 3, 1, C.glow); // mane
        P(16, 9, 3, 2, C.b); P(18, 7, 1, 3, C.glow);
        P(4, 17, 2, 2, C.b); P(13, 17, 2, 2, C.b);
        P(5, 13, 9, 3, C.c);
        break;
      case 'dewbit':
        P(6, 6, 8, 10, C.a); P(7, 5, 6, 2, C.a); P(8, 4, 4, 1, C.b); // droplet
        P(5, 9, 1, 5, C.a); P(14, 9, 1, 5, C.a);
        P(8, 8, 1, 2, C.eye); P(11, 8, 1, 2, C.eye);
        P(9, 12, 2, 1, C.c);
        P(7, 6, 2, 2, C.glow); // highlight
        P(8, 16, 4, 1, C.b);
        break;
      case 'torrentail':
        P(3, 8, 12, 6, C.a); P(4, 7, 10, 2, C.a);
        P(2, 6, 5, 6, C.a); // head
        P(3, 8, 1, 1, C.eye); P(5, 8, 1, 1, C.eye);
        P(14, 7, 3, 3, C.b); P(16, 5, 2, 3, C.glow); P(17, 8, 2, 3, C.glow); // storm tail
        P(6, 14, 2, 2, C.b); P(11, 14, 2, 2, C.b);
        P(5, 10, 8, 3, C.c);
        P(7, 5, 3, 1, C.glow);
        break;
      case 'sproutle':
        P(6, 9, 8, 8, C.a); P(7, 8, 6, 2, C.a); // bulb body
        P(8, 3, 2, 5, C.b); // stem
        P(5, 2, 4, 3, C.c); P(10, 2, 4, 3, C.c); // leaves
        P(6, 1, 3, 2, C.glow); P(11, 1, 3, 2, C.glow);
        P(8, 11, 1, 1, C.eye); P(11, 11, 1, 1, C.eye);
        P(9, 13, 2, 1, C.b);
        P(7, 17, 2, 1, C.b); P(11, 17, 2, 1, C.b);
        break;
      case 'thornmaw':
        P(4, 9, 12, 8, C.a); P(5, 8, 10, 2, C.a);
        P(3, 6, 6, 6, C.a);
        P(2, 4, 2, 3, C.b); P(7, 3, 2, 4, C.b); // thorns
        P(4, 8, 1, 1, C.eye); P(7, 8, 1, 1, C.eye);
        P(4, 10, 4, 1, C.c); // maw
        P(5, 10, 1, 1, '#fff'); P(7, 10, 1, 1, '#fff');
        P(14, 7, 3, 2, C.b); P(16, 5, 2, 2, C.c);
        P(10, 6, 2, 2, C.b); P(13, 5, 1, 2, C.b);
        P(5, 17, 2, 2, C.b); P(12, 17, 2, 2, C.b);
        P(8, 12, 5, 3, C.glow); // coal heart
        break;
      case 'gnawbit':
        P(5, 10, 10, 6, C.a); P(6, 9, 8, 2, C.a);
        P(3, 8, 5, 5, C.a); // head
        P(2, 6, 2, 3, C.b); P(6, 6, 2, 3, C.b); // ears
        P(4, 9, 1, 1, C.eye);
        P(2, 11, 2, 1, C.c); // nose
        P(15, 11, 4, 1, C.b); P(18, 10, 1, 2, C.b); // tail
        P(6, 16, 2, 1, C.b); P(12, 16, 2, 1, C.b);
        P(7, 12, 6, 3, C.c);
        break;
      case 'broodmother':
        P(5, 12, 18, 10, C.a); P(6, 11, 16, 2, C.a);
        P(3, 8, 9, 9, C.a);
        P(2, 4, 3, 5, C.b); P(9, 4, 3, 5, C.b);
        P(4, 11, 2, 2, C.eye); P(8, 11, 2, 2, C.eye);
        P(3, 14, 4, 2, C.c);
        P(4, 15, 1, 1, '#fff'); P(6, 15, 1, 1, '#fff');
        P(22, 14, 5, 2, C.b); P(26, 12, 1, 3, C.b);
        P(7, 22, 3, 2, C.b); P(17, 22, 3, 2, C.b);
        P(9, 15, 10, 5, C.c);
        P(12, 6, 4, 3, C.glow); // cinder growth
        break;
      case 'pebblit':
        P(6, 12, 8, 5, C.a); P(7, 10, 6, 3, C.b); P(8, 8, 4, 3, C.a); // stacked rocks
        P(9, 6, 2, 2, C.b);
        P(8, 12, 1, 1, C.eye); P(11, 12, 1, 1, C.eye);
        P(5, 14, 2, 3, C.b); P(13, 14, 2, 3, C.b);
        P(9, 14, 2, 2, C.glow); // cinder heart
        break;
      case 'gustling':
        P(7, 8, 6, 7, C.a); P(8, 7, 4, 2, C.a); // body
        P(8, 5, 4, 4, C.a); // head
        P(9, 6, 1, 1, C.eye); P(11, 6, 1, 1, C.eye);
        P(12, 7, 2, 1, C.c); // beak
        P(4, 8, 3, 4, C.b); P(13, 8, 3, 4, C.b); // wings
        P(3, 7 + bob, 2, 2, C.glow); P(15, 7 + bob, 2, 2, C.glow);
        P(8, 15, 1, 2, C.b); P(11, 15, 1, 2, C.b);
        P(8, 10, 4, 3, C.c);
        break;
      case 'zephryx':
        P(6, 8, 8, 8, C.a); P(7, 7, 6, 2, C.a);
        P(7, 4, 6, 5, C.a);
        P(8, 5, 1, 1, C.eye); P(11, 5, 1, 1, C.eye);
        P(13, 6, 3, 1, C.c); P(15, 6, 1, 1, C.b);
        P(2, 7, 4, 6, C.b); P(14, 7, 4, 6, C.b);
        P(1, 6, 2, 3, C.glow); P(17, 6, 2, 3, C.glow);
        P(7, 16, 2, 2, C.b); P(11, 16, 2, 2, C.b);
        P(8, 11, 4, 3, C.c);
        P(9, 2, 2, 2, C.glow); // crest
        break;
      case 'voltail':
        P(5, 10, 10, 6, C.a); P(6, 9, 8, 2, C.a);
        P(3, 7, 5, 6, C.a);
        P(2, 4, 2, 4, C.b); P(6, 4, 2, 4, C.b); // pointed ears
        P(4, 9, 1, 1, C.eye); P(6, 9, 1, 1, C.eye);
        P(3, 11, 1, 1, C.c);
        P(15, 8, 2, 2, C.glow); P(17, 6, 1, 3, C.glow); P(16, 9, 2, 1, C.glow); P(18, 10, 1, 2, C.glow); // lightning tail
        P(6, 16, 2, 1, C.b); P(12, 16, 2, 1, C.b);
        P(7, 12, 6, 3, C.c);
        break;
      case 'murkfin':
        P(4, 9, 12, 6, C.a); P(5, 8, 10, 2, C.a);
        P(3, 10, 2, 4, C.a);
        P(5, 10, 1, 1, C.eye);
        P(15, 8, 3, 3, C.b); P(15, 13, 3, 3, C.b); // tail fin
        P(8, 6, 4, 2, C.b); // dorsal
        P(7, 13, 6, 2, C.glow); // glowing belly
        P(9, 14, 2, 1, C.c);
        break;
      case 'wispling':
        P(7, 6, 6, 8, C.a); P(8, 5, 4, 2, C.glow); P(9, 4, 2, 1, C.glow); // flame body
        P(6, 8, 1, 4, C.a); P(13, 8, 1, 4, C.a);
        P(8, 8, 1, 2, C.eye); P(11, 8, 1, 2, C.eye);
        P(9, 12, 2, 1, C.b);
        P(8, 14, 4, 2, C.b); P(9, 16, 2, 1, C.b); // tail wisp
        P(7, 6, 2, 2, '#ffffff');
        break;
      case 'gloomwing':
        P(8, 8, 4, 6, C.a); // body
        P(8, 6, 4, 3, C.a); // head
        P(7, 4, 1, 3, C.b); P(12, 4, 1, 3, C.b); // ears
        P(9, 7, 1, 1, C.eye); P(11, 7, 1, 1, C.eye);
        P(2, 7, 6, 5, C.b); P(12, 7, 6, 5, C.b); // wings
        P(1, 8, 2, 3, C.a); P(17, 8, 2, 3, C.a);
        P(3, 12, 2, 1, C.b); P(15, 12, 2, 1, C.b);
        P(9, 10, 2, 2, C.glow);
        break;
      case 'cindermaw':
        P(3, 10, 14, 8, C.a); P(4, 9, 12, 2, C.a);
        P(2, 6, 8, 7, C.a);
        P(1, 3, 2, 4, C.b); P(8, 3, 2, 4, C.b);
        P(3, 8, 2, 1, C.eye); P(6, 8, 2, 1, C.eye);
        P(2, 11, 7, 2, C.b); // maw
        P(3, 11, 1, 1, C.glow); P(5, 11, 1, 1, C.glow); P(7, 11, 1, 1, C.glow);
        P(16, 8, 3, 3, C.b); P(18, 6, 1, 3, C.glow);
        P(4, 18, 3, 1, C.b); P(12, 18, 3, 1, C.b);
        P(6, 13, 8, 4, C.glow); // furnace belly
        P(8, 14, 4, 2, C.c);
        break;
      case 'sentinel':
        P(8, 4, 12, 8, C.a); // head block
        P(6, 12, 16, 10, C.a); // torso
        P(10, 6, 2, 2, C.glow); P(16, 6, 2, 2, C.glow); // eyes
        P(11, 10, 6, 1, C.b);
        P(3, 13, 3, 8, C.b); P(22, 13, 3, 8, C.b); // arms
        P(8, 22, 4, 4, C.b); P(16, 22, 4, 4, C.b); // legs
        P(12, 14, 4, 4, C.glow); // core
        P(9, 12, 10, 1, C.c);
        P(12, 2, 4, 2, C.b); // crown
        break;
      case 'vael':
        P(9, 2, 10, 8, C.a); // hooded head
        P(8, 1, 12, 3, C.b);
        P(11, 5, 2, 2, C.glow); P(15, 5, 2, 2, C.glow); // eyes
        P(7, 10, 14, 12, C.b); // robe
        P(9, 10, 10, 12, C.a);
        P(12, 12, 4, 6, C.c); // chest sigil
        P(13, 13, 2, 2, C.glow);
        P(4, 11, 3, 8, C.b); P(21, 11, 3, 8, C.b); // arms
        P(3, 18, 2, 3, C.a); P(23, 18, 2, 3, C.a); // hands
        P(24, 8, 1, 12, C.c); P(23, 7, 3, 2, C.glow); // ash staff
        P(9, 22, 4, 3, C.b); P(15, 22, 4, 3, C.b);
        P(6, 10, 2, 10, C.glow); // ash drift
        break;
      default:
        P(5, 6, 10, 10, C.a); P(7, 8, 2, 2, C.eye); P(11, 8, 2, 2, C.eye);
    }
    beastCache.set(key, c);
    return c;
  }

  const BEAST_PAL = {
    cindpup: { a: '#ff8a4a', b: '#c85a2a', c: '#ffd9a0', eye: '#2a1a10', glow: '#ffd94a' },
    emberhound: { a: '#ff7a3c', b: '#b04a1a', c: '#ffcf8a', eye: '#2a1a10', glow: '#ffe89a' },
    dewbit: { a: '#5ab0ff', b: '#2a6ab0', c: '#bfe8ff', eye: '#10203a', glow: '#e8f8ff' },
    torrentail: { a: '#4aa8ff', b: '#2a5a9a', c: '#9fd4ff', eye: '#10203a', glow: '#bfe8ff' },
    sproutle: { a: '#6fce5a', b: '#3a7a2a', c: '#9fe88a', eye: '#1a2a10', glow: '#d8ff9a' },
    thornmaw: { a: '#5a9a4a', b: '#3a5a2a', c: '#c8e8a0', eye: '#1a2a10', glow: '#ff9a5a' },
    gnawbit: { a: '#9a8a72', b: '#6a5a42', c: '#d8c8a8', eye: '#2a1a10', glow: '#c9a06a' },
    broodmother: { a: '#8a7a62', b: '#5a4a32', c: '#c8b898', eye: '#3a1a1a', glow: '#ff9a5a' },
    pebblit: { a: '#a8a098', b: '#7a7268', c: '#d8d0c8', eye: '#2a2a25', glow: '#ff9a5a' },
    gustling: { a: '#9fe8d8', b: '#4a9a8a', c: '#e8fff8', eye: '#103028', glow: '#ffffff' },
    zephryx: { a: '#7fd4c8', b: '#3a7a6a', c: '#d8fff4', eye: '#103028', glow: '#ffffff' },
    voltail: { a: '#ffd94a', b: '#c89a2a', c: '#fff2b0', eye: '#3a2a10', glow: '#ffffff' },
    murkfin: { a: '#3a6a8a', b: '#2a4a6a', c: '#7fb0d0', eye: '#0a1a2a', glow: '#ffcf8a' },
    wispling: { a: '#fff2b0', b: '#c8a03a', c: '#ffffff', eye: '#5a4a10', glow: '#ffffff' },
    gloomwing: { a: '#7a5a9a', b: '#4a3a6a', c: '#b48aff', eye: '#ffd94a', glow: '#b48aff' },
    cindermaw: { a: '#e85a2e', b: '#8a2a10', c: '#ffcf8a', eye: '#2a0a05', glow: '#ffd94a' },
    sentinel: { a: '#8a9098', b: '#5a6068', c: '#c8d0d8', eye: '#7fd4ff', glow: '#7fd4ff' },
    vael: { a: '#5a4a6a', b: '#3a2a4a', c: '#b48aff', eye: '#ff5a2e', glow: '#b48aff' }
  };

  /* ============================================================
     TILES — 16x16 procedural
     ============================================================ */
  const tileCache = new Map();
  function rnd(seed) { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }

  function drawTile(type, variant) {
    const key = type + '|' + variant;
    if (tileCache.has(key)) return tileCache.get(key);
    const c = mk(16, 16), g = c.getContext('2d');
    const r = rnd(variant * 7919 + type.charCodeAt(0) * 131);
    switch (type) {
      case 'grass':
        px(g, 0, 0, 16, 16, '#4a8a3a');
        for (let i = 0; i < 6; i++) px(g, (r() * 16) | 0, (r() * 16) | 0, 1, 2, r() > 0.5 ? '#5a9a4a' : '#3a7a2a');
        break;
      case 'tallgrass':
        px(g, 0, 0, 16, 16, '#4a8a3a');
        for (let i = 0; i < 5; i++) { const x = (r() * 14) | 0; px(g, x, 6 + (r() * 4 | 0), 2, 8, '#3a7a2a'); px(g, x, 5 + (r() * 3 | 0), 1, 4, '#5aaa4a'); }
        break;
      case 'path':
        px(g, 0, 0, 16, 16, '#c8a878');
        for (let i = 0; i < 5; i++) px(g, (r() * 15) | 0, (r() * 15) | 0, 2, 1, '#b09060');
        px(g, 0, 0, 16, 1, '#d8b888');
        break;
      case 'sand':
        px(g, 0, 0, 16, 16, '#e0c890');
        for (let i = 0; i < 4; i++) px(g, (r() * 15) | 0, (r() * 15) | 0, 1, 1, '#c8b078');
        break;
      case 'water': {
        px(g, 0, 0, 16, 16, '#3a7ab0');
        const ph = variant % 3;
        px(g, 2 + ph, 4, 5, 1, '#5a9ad0'); px(g, 9 - ph, 10, 4, 1, '#5a9ad0');
        px(g, 0, 0, 16, 1, '#4a8ac0');
        break;
      }
      case 'tree':
        px(g, 0, 0, 16, 16, '#4a8a3a');
        px(g, 6, 10, 4, 6, '#6a4a2a');
        px(g, 2, 2, 12, 9, '#2a6a2a'); px(g, 3, 1, 10, 3, '#3a7a3a');
        px(g, 4, 3, 3, 2, '#4a9a4a'); px(g, 9, 5, 2, 2, '#4a9a4a');
        break;
      case 'wall':
        px(g, 0, 0, 16, 16, '#6a6a72');
        px(g, 0, 0, 16, 1, '#8a8a92'); px(g, 0, 7, 16, 1, '#4a4a52');
        px(g, 7, 0, 1, 7, '#4a4a52'); px(g, 3, 8, 1, 8, '#4a4a52'); px(g, 11, 8, 1, 8, '#4a4a52');
        break;
      case 'floor':
        px(g, 0, 0, 16, 16, '#8a8278');
        px(g, 0, 0, 16, 1, '#9a9288'); px(g, 0, 15, 16, 1, '#6a6258');
        px(g, 7, 0, 1, 16, '#7a7268');
        for (let i = 0; i < 3; i++) px(g, (r() * 15) | 0, (r() * 15) | 0, 1, 1, '#6a6258');
        break;
      case 'hfloor':
        px(g, 0, 0, 16, 16, '#a8895a');
        px(g, 0, 0, 16, 1, '#b8996a'); px(g, 0, 7, 16, 1, '#8a6a3a');
        px(g, 4, 0, 1, 7, '#8a6a3a'); px(g, 11, 8, 1, 8, '#8a6a3a');
        break;
      case 'hwall':
        px(g, 0, 0, 16, 16, '#b09878');
        px(g, 0, 0, 16, 2, '#8a6a4a'); px(g, 0, 14, 16, 2, '#8a6a4a');
        px(g, 0, 6, 16, 1, '#9a8262');
        break;
      case 'roof':
        px(g, 0, 0, 16, 16, '#b04a3a');
        px(g, 0, 0, 16, 2, '#c85a4a'); px(g, 0, 5, 16, 1, '#8a3a2a'); px(g, 0, 10, 16, 1, '#8a3a2a');
        px(g, 4, 2, 1, 3, '#8a3a2a'); px(g, 11, 7, 1, 3, '#8a3a2a');
        break;
      case 'door':
        px(g, 0, 0, 16, 16, '#b09878');
        px(g, 3, 2, 10, 14, '#6a4a2a'); px(g, 4, 3, 8, 12, '#8a6a3a');
        px(g, 10, 9, 1, 2, '#ffd94a'); px(g, 3, 2, 10, 1, '#4a3a1a');
        break;
      case 'fence':
        px(g, 0, 0, 16, 16, '#4a8a3a');
        px(g, 1, 5, 2, 9, '#8a6a3a'); px(g, 13, 5, 2, 9, '#8a6a3a');
        px(g, 0, 7, 16, 2, '#9a7a4a'); px(g, 0, 11, 16, 1, '#7a5a2a');
        break;
      case 'well':
        px(g, 0, 0, 16, 16, '#4a8a3a');
        px(g, 2, 6, 12, 8, '#8a8a92'); px(g, 3, 7, 10, 6, '#3a5a7a');
        px(g, 2, 6, 12, 1, '#a8a8b0'); px(g, 7, 2, 2, 5, '#6a4a2a'); px(g, 3, 2, 10, 1, '#6a4a2a');
        break;
      case 'sign':
        px(g, 0, 0, 16, 16, '#4a8a3a');
        px(g, 7, 8, 2, 7, '#6a4a2a'); px(g, 3, 3, 10, 6, '#9a7a4a'); px(g, 4, 4, 8, 4, '#b8996a');
        px(g, 5, 5, 6, 1, '#6a4a2a'); px(g, 5, 7, 4, 1, '#6a4a2a');
        break;
      case 'chest':
        px(g, 0, 0, 16, 16, '#8a8278');
        px(g, 3, 6, 10, 8, '#8a5a2b'); px(g, 3, 6, 10, 3, '#a87a3b');
        px(g, 3, 8, 10, 1, '#5a3a1a'); px(g, 7, 9, 2, 2, '#ffd94a');
        break;
      case 'chestopen':
        px(g, 0, 0, 16, 16, '#8a8278');
        px(g, 3, 8, 10, 6, '#6a4a2a'); px(g, 3, 4, 10, 3, '#8a5a2b'); px(g, 4, 9, 8, 3, '#2a2a25');
        break;
      case 'herb':
        px(g, 0, 0, 16, 16, '#4a8a3a');
        px(g, 5, 8, 2, 6, '#3a7a2a'); px(g, 9, 7, 2, 7, '#3a7a2a');
        px(g, 4, 6, 4, 3, '#6fce5a'); px(g, 8, 5, 4, 3, '#9fe88a');
        px(g, 5, 5, 1, 1, '#e86a8a'); px(g, 10, 4, 1, 1, '#ffd94a');
        break;
      case 'stump':
        px(g, 0, 0, 16, 16, '#4a8a3a');
        px(g, 4, 8, 8, 7, '#6a4a2a'); px(g, 4, 7, 8, 3, '#8a6a3a'); px(g, 6, 8, 4, 1, '#a8895a');
        px(g, 7, 8, 2, 1, '#6a4a2a');
        break;
      case 'lantern':
        px(g, 0, 0, 16, 16, '#4a8a3a');
        px(g, 7, 6, 2, 9, '#3a3a45'); px(g, 5, 3, 6, 4, '#5a5a68');
        px(g, 6, 4, 4, 2, '#ffcf8a'); px(g, 5, 3, 6, 1, '#3a3a45');
        break;
      case 'bridge':
        px(g, 0, 0, 16, 16, '#3a7ab0');
        px(g, 0, 3, 16, 10, '#9a7a4a'); px(g, 0, 3, 16, 1, '#b8996a');
        px(g, 3, 3, 1, 10, '#7a5a2a'); px(g, 12, 3, 1, 10, '#7a5a2a');
        break;
      case 'gate':
        px(g, 0, 0, 16, 16, '#4a8a3a');
        px(g, 1, 2, 3, 14, '#6a6a72'); px(g, 12, 2, 3, 14, '#6a6a72');
        px(g, 1, 2, 14, 3, '#8a8a92'); px(g, 5, 5, 6, 11, '#3a3a45');
        px(g, 7, 8, 2, 2, '#7fd4ff');
        break;
      case 'shrine':
        px(g, 0, 0, 16, 16, '#4a8a3a');
        px(g, 4, 8, 8, 7, '#8a8a92'); px(g, 5, 4, 6, 5, '#a8a8b0');
        px(g, 6, 5, 4, 3, '#ff9a5a'); px(g, 7, 5, 2, 2, '#ffd94a');
        px(g, 4, 8, 8, 1, '#c8c8d0');
        break;
      case 'hearth':
        px(g, 0, 0, 16, 16, '#6a6258');
        px(g, 3, 6, 10, 9, '#5a5a68'); px(g, 4, 7, 8, 7, '#2a2a35');
        px(g, 5, 9, 6, 4, '#ff7a3c'); px(g, 6, 8, 4, 3, '#ffd94a'); px(g, 7, 7, 2, 2, '#fff2b0');
        px(g, 3, 6, 10, 1, '#8a8a92');
        break;
      case 'carpet':
        px(g, 0, 0, 16, 16, '#a04a3a');
        px(g, 0, 0, 16, 1, '#b85a4a'); px(g, 0, 15, 16, 1, '#803a2a');
        px(g, 7, 7, 2, 2, '#c8a03a');
        break;
      case 'table':
        px(g, 0, 0, 16, 16, '#a8895a');
        px(g, 2, 4, 12, 8, '#8a6a3a'); px(g, 2, 4, 12, 2, '#a87a3b');
        px(g, 3, 12, 2, 3, '#6a4a2a'); px(g, 11, 12, 2, 3, '#6a4a2a');
        break;
      case 'bed':
        px(g, 0, 0, 16, 16, '#a8895a');
        px(g, 2, 2, 12, 13, '#6a4a2a'); px(g, 3, 3, 10, 11, '#b04a3a');
        px(g, 3, 3, 10, 3, '#d8d0b8'); px(g, 3, 6, 10, 1, '#8a3a2a');
        break;
      case 'counter':
        px(g, 0, 0, 16, 16, '#a8895a');
        px(g, 1, 5, 14, 9, '#8a6a3a'); px(g, 1, 5, 14, 2, '#b8996a');
        px(g, 1, 13, 14, 1, '#6a4a2a');
        break;
      case 'hatch':
        px(g, 0, 0, 16, 16, '#4a8a3a');
        px(g, 3, 5, 10, 9, '#5a4a32'); px(g, 4, 6, 8, 7, '#3a2a1a');
        px(g, 4, 6, 8, 1, '#6a5a42'); px(g, 7, 9, 2, 1, '#8a6a3a');
        break;
      case 'sack':
        px(g, 0, 0, 16, 16, '#8a8278');
        px(g, 4, 6, 8, 9, '#c8b088'); px(g, 5, 4, 6, 3, '#b09878');
        px(g, 6, 4, 4, 1, '#8a6a3a'); px(g, 5, 9, 6, 1, '#a8895a');
        break;
      case 'pillar':
        px(g, 0, 0, 16, 16, '#6a6258');
        px(g, 4, 1, 8, 14, '#8a8a92'); px(g, 3, 1, 10, 2, '#a8a8b0'); px(g, 3, 13, 10, 2, '#a8a8b0');
        px(g, 6, 3, 1, 10, '#6a6a72'); px(g, 10, 3, 1, 10, '#6a6a72');
        break;
      case 'rubble':
        px(g, 0, 0, 16, 16, '#6a6258');
        px(g, 3, 9, 5, 5, '#8a8a92'); px(g, 9, 10, 4, 4, '#7a7a82'); px(g, 6, 6, 4, 3, '#9a9aa2');
        break;
      case 'dwater':
        px(g, 0, 0, 16, 16, '#2a4a6a');
        px(g, 2, 5, 5, 1, '#3a6a8a'); px(g, 9, 11, 4, 1, '#3a6a8a');
        break;
      case 'void':
        px(g, 0, 0, 16, 16, '#1a1a22');
        break;
      default:
        px(g, 0, 0, 16, 16, '#ff00ff');
    }
    tileCache.set(key, c);
    return c;
  }

  /* ---------- NPC sprite (reuse hero renderer, no gear) ---------- */
  function drawNPC(npcId, dir, frame) {
    const npc = D.NPCS[npcId];
    if (!npc || !npc.look) return drawHero({ skin: 0, hair: 0, hairColor: 0, tunic: 0, tunicColor: 6, trim: 1, pants: 0 }, null, dir, frame);
    return drawHero(npc.look, null, dir, frame);
  }

  return { SKIN, HAIRC, CLOTH, PANTC, BOOTC, EYEC, drawHero, drawBeast, drawTile, drawNPC, shade, BEAST_PAL };
})();
