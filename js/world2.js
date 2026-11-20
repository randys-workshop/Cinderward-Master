/* ============================================================
   CINDERWARD — world2.js  (Chapter 2 maps)
   Duskhaven, the Scorchlands, the Sun's Grave + interiors.
   Extends SB.WORLD. Loaded after world.js.
   ============================================================ */
(function () {
  'use strict';
  const W = SB.WORLD;

  /* ---------- new tile types ---------- */
  Object.assign(W.TILES, {
    'a': { t: 'ash', solid: false },
    'q': { t: 'scorched', solid: false, enc: true },
    'g': { t: 'blight', solid: false, enc: true },
    'Y': { t: 'deadtree', solid: true },
    'n': { t: 'bone', solid: true },
    'V': { t: 'gravewall', solid: true },
    'v': { t: 'gravefloor', solid: false },
    'N': { t: 'beacon', solid: true, act: 'beacon' },
    'I': { t: 'idol', solid: true, act: 'idol' },
    'j': { t: 'ashsand', solid: false }
  });

  /* ---------- builders ---------- */
  function base(w, h, fill) { const g = []; for (let y = 0; y < h; y++) { const r = []; for (let x = 0; x < w; x++) r.push(fill); g.push(r); } return { w, h, g }; }
  function rect(m, x, y, w, h, ch) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (m.g[j] && m.g[j][i] !== undefined) m.g[j][i] = ch; }
  function border(m, ch) { rect(m, 0, 0, m.w, 1, ch); rect(m, 0, m.h - 1, m.w, 1, ch); rect(m, 0, 0, 1, m.h, ch); rect(m, m.w - 1, 0, 1, m.h, ch); }
  function set(m, x, y, ch) { if (m.g[y] && m.g[y][x] !== undefined) m.g[y][x] = ch; }
  function building(m, x, y, w, h, doorX) { rect(m, x, y, w, h - 2, 'R'); rect(m, x, y + h - 2, w, 2, 'w'); set(m, doorX, y + h - 1, 'D'); set(m, doorX, y + h - 2, 'w'); }
  function scatter(m, ch, n, seed, avoid) { let s = seed; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; for (let i = 0; i < n; i++) { const x = 1 + ((rnd() * (m.w - 2)) | 0), y = 1 + ((rnd() * (m.h - 2)) | 0); if (m.g[y][x] === 'a' && !(avoid && avoid(x, y))) m.g[y][x] = ch; } }

  /* ---------- link Emberwood east -> Scorchlands ---------- */
  (function () {
    const ew = W.MAPS.emberwood;
    set({ g: ew.grid, w: ew.w, h: ew.h }, 55, 24, '#');
    set({ g: ew.grid, w: ew.w, h: ew.h }, 55, 25, '#');
    set({ g: ew.grid, w: ew.w, h: ew.h }, 54, 24, '#');
    set({ g: ew.grid, w: ew.w, h: ew.h }, 54, 25, '#');
    ew.transitions.push({ x: 55, y: 24, to: 'scorchlands', tx: 1, ty: 24, req: 'sunkey', msg: 'The east gate is sealed. A warm brass keyhole waits.' });
    ew.transitions.push({ x: 55, y: 25, to: 'scorchlands', tx: 1, ty: 25, req: 'sunkey', msg: 'The east gate is sealed. A warm brass keyhole waits.' });
    ew.events.push({ x: 53, y: 23, type: 'sign', text: 'East gate → the Scorchlands, blighted by the Covenant. Only the Sunkey opens it. Turn back if your flame is not ready.' });
    set({ g: ew.grid, w: ew.w, h: ew.h }, 53, 23, 'S');
  })();

  /* ================= THE SCORCHLANDS 56x48 ================= */
  (function () {
    const m = base(56, 48, 'a');
    border(m, 'Y');
    // paths
    rect(m, 1, 24, 26, 2, 'j');
    rect(m, 10, 12, 2, 14, 'j');     // to Duskhaven gate
    rect(m, 26, 24, 2, 22, 'j');     // south to grave-gate
    rect(m, 26, 8, 20, 2, 'j');      // north ridge to beacon/bone-field
    rect(m, 44, 8, 2, 16, 'j');
    // blight patches (encounters)
    rect(m, 34, 30, 12, 9, 'g');
    rect(m, 6, 34, 12, 8, 'g');
    // ash-drifts / scorched (encounters)
    rect(m, 16, 16, 12, 7, 'q');
    rect(m, 36, 16, 12, 7, 'q');
    rect(m, 14, 38, 10, 6, 'q');
    rect(m, 40, 38, 10, 6, 'q');
    // bone-field (north)
    rect(m, 38, 4, 8, 4, 'n');
    // Duskhaven gate facade
    rect(m, 8, 10, 6, 2, 'w'); set(m, 10, 11, 'D'); set(m, 10, 12, 'j');
    // grave-gate (south)
    rect(m, 24, 45, 7, 1, 'V'); set(m, 27, 46, 'G');
    // beacon (north ridge)
    set(m, 44, 8, 'N');
    // chests
    set(m, 48, 6, 'C'); set(m, 5, 28, 'C'); set(m, 50, 40, 'C');
    // ashbloom herbs
    set(m, 12, 20, 'H'); set(m, 32, 28, 'H'); set(m, 20, 42, 'H'); set(m, 46, 30, 'H');
    // signs
    set(m, 2, 23, 'S'); set(m, 27, 44, 'S'); set(m, 10, 13, 'S');
    // dead trees + bones scatter
    scatter(m, 'Y', 70, 11, (x, y) => (y >= 23 && y <= 27) || (x >= 25 && x <= 29 && y > 24) || (x >= 9 && x <= 12 && y >= 10 && y <= 14));
    scatter(m, 'n', 20, 23, (x, y) => (y >= 23 && y <= 27));
    // west exit
    set(m, 0, 24, 'j'); set(m, 0, 25, 'j');
    W.MAPS.scorchlands = {
      id: 'scorchlands', name: 'The Scorchlands', w: m.w, h: m.h, grid: m.g, outdoor: true, music: 'scorch',
      npcs: [],
      transitions: [
        { x: 0, y: 24, to: 'emberwood', tx: 54, ty: 24 },
        { x: 0, y: 25, to: 'emberwood', tx: 54, ty: 25 },
        { x: 10, y: 11, to: 'duskhaven', tx: 18, ty: 26 },
        { x: 27, y: 46, to: 'sunsgrave', tx: 19, ty: 3, req: 'gravekey', msg: 'The grave-gate is sealed. A keyhole of cold bone waits.' }
      ],
      events: [
        { x: 2, y: 23, type: 'sign', text: 'The Scorchlands. West: the Emberwood. North: Duskhaven. South: the Sun\'s Grave. The blight spreads from the east.' },
        { x: 27, y: 44, type: 'sign', text: 'THE SUN\'S GRAVE — tomb of a dead sun. Sealed with a bone key. What sleeps here must not wake.' },
        { x: 10, y: 13, type: 'sign', text: 'Duskhaven — the last refuge of the Scorchlands. Its forge still burns.' },
        { x: 44, y: 8, type: 'beacon' },
        { x: 48, y: 6, type: 'chest', loot: { gear: ['dunerekk_pauldrons'], gold: 60 }, flag: 'sc_chest1' },
        { x: 5, y: 28, type: 'chest', loot: { items: [['finesalve', 2], ['greaterdraught', 1]], gold: 50 }, flag: 'sc_chest2' },
        { x: 50, y: 40, type: 'chest', loot: { gear: ['blightwing_shroud'], gold: 70 }, flag: 'sc_chest3' },
        { x: 12, y: 20, type: 'herb', item: 'ashbloom' }, { x: 32, y: 28, type: 'herb', item: 'ashbloom' },
        { x: 20, y: 42, type: 'herb', item: 'ashbloom' }, { x: 46, y: 30, type: 'herb', item: 'ashbloom' },
        { x: 40, y: 5, type: 'boss', sp: 'kael', flag: 'kael', level: 13, intro: ['At the bone-field, a grey-armored figure rises. Ash falls from his blade like snow.', 'Kael, the Grey Blade: "Three Wardens before you. Their light is in my sword now. Yours will join them."'] }
      ],
      encounters: {
        rate: 0.13,
        tables: [
          { x: 16, y: 16, w: 12, h: 7, list: [['ashkit', 9, 12, 3], ['dunepup', 9, 12, 3], ['cindervolt', 9, 12, 2], ['blightwing', 9, 12, 2]] },
          { x: 36, y: 16, w: 12, h: 7, list: [['ashkit', 10, 13, 3], ['cindervolt', 10, 13, 3], ['blightwing', 10, 13, 2], ['solmoth', 10, 13, 2]] },
          { x: 34, y: 30, w: 12, h: 9, list: [['blightwing', 11, 14, 4], ['solmoth', 11, 14, 2], ['magmaw', 12, 15, 1], ['ashjackal', 12, 15, 2]] },
          { x: 6, y: 34, w: 12, h: 8, list: [['blightwing', 10, 13, 3], ['dunepup', 10, 13, 3], ['dunerekk', 12, 15, 2], ['solmoth', 10, 13, 2]] },
          { x: 14, y: 38, w: 10, h: 6, list: [['ashkit', 10, 13, 3], ['dunepup', 10, 13, 3], ['magmaw', 13, 16, 1], ['cindervolt', 10, 13, 2]] },
          { x: 40, y: 38, w: 10, h: 6, list: [['ashjackal', 12, 15, 3], ['blightwing', 11, 14, 3], ['magmaw', 13, 16, 2], ['solmoth', 11, 14, 2]] }
        ]
      }
    };
  })();

  /* ================= DUSKHAVEN 36x28 ================= */
  (function () {
    const m = base(36, 28, 'a');
    border(m, 'Y');
    rect(m, 2, 14, 32, 2, 'j');
    rect(m, 17, 14, 2, 13, 'j');
    building(m, 4, 5, 8, 6, 7);     // inn -> door (7,10)
    building(m, 14, 5, 8, 6, 17);   // forge -> door (17,10)
    building(m, 24, 5, 8, 6, 27);   // remedies -> door (27,10)
    building(m, 28, 18, 6, 6, 30);  // mirror -> door (30,23)
    set(m, 20, 16, 'N');            // town beacon (decor)
    set(m, 14, 16, 'L'); set(m, 22, 16, 'L');
    set(m, 5, 15, 'S'); set(m, 30, 15, 'S');
    scatter(m, 'Y', 18, 5, (x, y) => (y >= 13 && y <= 17) || (x >= 16 && x <= 20));
    set(m, 18, 27, 'j');
    W.MAPS.duskhaven = {
      id: 'duskhaven', name: 'Duskhaven', w: m.w, h: m.h, grid: m.g, outdoor: true, music: 'scorch',
      npcs: [
        { id: 'vex', x: 18, y: 12, dir: 0 },
        { id: 'bram', x: 10, y: 18, dir: 0 },
        { id: 'oren', x: 26, y: 16, dir: 1 }
      ],
      transitions: [
        { x: 7, y: 10, to: 'dusk_inn', tx: 5, ty: 7 },
        { x: 17, y: 10, to: 'dusk_forge', tx: 5, ty: 7 },
        { x: 27, y: 10, to: 'dusk_remedies', tx: 5, ty: 7 },
        { x: 30, y: 23, to: 'dusk_mirror', tx: 4, ty: 7 },
        { x: 18, y: 27, to: 'scorchlands', tx: 10, ty: 13 }
      ],
      events: [
        { x: 5, y: 15, type: 'sign', text: 'Duskhaven — the last refuge. Inn, Forge, and Remedies to the north. Elder Vex keeps the shrine.' },
        { x: 30, y: 15, type: 'sign', text: 'The Scorchlands stretch east and south. The blight is worst in the low places. Travel armed.' }
      ],
      encounters: null
    };
  })();

  /* ---------- Duskhaven interiors ---------- */
  function room(id, name, w, h, exitTo, exitX, exitY, doorX) {
    const m = base(w, h, 'h'); border(m, 'w'); set(m, doorX, h - 1, 'D');
    W.MAPS[id] = { id, name, w, h, grid: m.g, outdoor: false, music: 'scorch', npcs: [], transitions: [{ x: doorX, y: h - 1, to: exitTo, tx: exitX, ty: exitY }], events: [], encounters: null };
    return { map: W.MAPS[id], m };
  }
  (function () {
    let r = room('dusk_inn', 'The Ashen Rest', 12, 9, 'duskhaven', 7, 11, 5);
    set(r.m, 2, 2, 'b'); set(r.m, 9, 2, 'b'); rect(r.m, 3, 4, 6, 1, 'k'); set(r.m, 6, 6, 't'); set(r.m, 10, 6, 'E'); rect(r.m, 4, 7, 4, 1, 'r');
    r.map.npcs = [{ id: 'sula', x: 6, y: 3, dir: 0 }];
    r.map.events = [{ x: 10, y: 6, type: 'hearth' }, { x: 2, y: 2, type: 'bed' }, { x: 9, y: 2, type: 'bed' }];
    r = room('dusk_forge', "Garr's Last Forge", 12, 9, 'duskhaven', 17, 11, 5);
    rect(r.m, 3, 4, 6, 1, 'k'); set(r.m, 9, 6, 't'); set(r.m, 2, 6, 'K'); set(r.m, 2, 7, 'K');
    r.map.npcs = [{ id: 'garr', x: 6, y: 3, dir: 0 }];
    r = room('dusk_remedies', "Mara's Remedies", 12, 9, 'duskhaven', 27, 11, 5);
    rect(r.m, 3, 4, 6, 1, 'k'); set(r.m, 2, 2, 'K'); set(r.m, 9, 2, 'K'); set(r.m, 10, 6, 'H');
    r.map.npcs = [{ id: 'mara', x: 6, y: 3, dir: 0 }];
    r.map.events = [{ x: 10, y: 6, type: 'herb', item: 'ashbloom' }];
    r = room('dusk_mirror', "Warden's Glass", 10, 9, 'duskhaven', 30, 24, 4);
    set(r.m, 5, 2, 'M'); set(r.m, 2, 6, 'b'); set(r.m, 7, 6, 't');
    r.map.events = [{ x: 5, y: 2, type: 'mirror' }];
  })();

  /* ================= THE SUN'S GRAVE 40x40 ================= */
  (function () {
    const m = base(40, 40, 'v');
    border(m, 'V');
    // inner sanctum walls
    rect(m, 10, 26, 20, 1, 'V'); set(m, 19, 26, 'v'); set(m, 20, 26, 'v');
    // channels of dead light
    rect(m, 6, 10, 28, 2, 'd');
    rect(m, 18, 10, 3, 2, 'B');
    // pillars
    for (let x = 12; x <= 28; x += 4) { set(m, x, 16, 'P'); set(m, x, 22, 'P'); }
    set(m, 12, 30, 'P'); set(m, 28, 30, 'P'); set(m, 12, 36, 'P'); set(m, 28, 36, 'P');
    set(m, 5, 5, 'u'); set(m, 34, 5, 'u'); set(m, 5, 35, 'u'); set(m, 34, 35, 'u');
    // entrance
    set(m, 19, 1, 'v'); set(m, 19, 2, 'v');
    // chests
    set(m, 5, 14, 'C'); set(m, 34, 14, 'C'); set(m, 6, 32, 'C'); set(m, 33, 32, 'C');
    // heart: idol + Morvane
    rect(m, 15, 33, 10, 6, 'r');
    set(m, 19, 37, 'I'); set(m, 20, 37, 'I');
    W.MAPS.sunsgrave = {
      id: 'sunsgrave', name: "The Sun's Grave", w: m.w, h: m.h, grid: m.g, outdoor: false, music: 'grave',
      npcs: [],
      transitions: [{ x: 19, y: 1, to: 'scorchlands', tx: 27, ty: 45 }],
      events: [
        { x: 5, y: 14, type: 'chest', loot: { gear: ['solmoth_circlet'], gold: 80 }, flag: 'sg_chest1' },
        { x: 34, y: 14, type: 'chest', loot: { gear: ['magmaw_plate'], gold: 80 }, flag: 'sg_chest2' },
        { x: 6, y: 32, type: 'chest', loot: { items: [['finesalve', 3], ['rekindlecharm', 2]], gold: 100 }, flag: 'sg_chest3' },
        { x: 33, y: 32, type: 'chest', loot: { gear: ['solmoth_wings'], gold: 100 }, flag: 'sg_chest4' },
        { x: 19, y: 34, type: 'boss', sp: 'morvane', flag: 'morvane', level: 16, intro: ['At the heart of the grave, the idol blazes with stolen Cindren light. Hierophant Malachar turns, his crown of ash incomplete.', 'Malachar: "Too late, Warden. The dead sun opens its eyes—" The light tears free of him, and something VAST unfolds.', 'MORVANE, THE DEAD SUN, wakes. It does not want to live. It wants everything else to stop.'] },
        { x: 19, y: 37, type: 'idol' }, { x: 20, y: 37, type: 'idol' }
      ],
      encounters: { rate: 0.10, tables: [{ x: 1, y: 1, w: 38, h: 38, list: [['blightwing', 12, 15, 3], ['solmoth', 12, 15, 3], ['gloomwing', 12, 15, 2], ['magmaw', 13, 16, 2], ['cindervolt', 12, 15, 2]] }] }
    };
  })();
})();
