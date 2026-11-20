/* ============================================================
   CINDERWARD — world.js
   Maps (procedural grids), tiles, collision, transitions,
   encounter zones, interactive events. Original world design.
   ============================================================ */
window.SB = window.SB || {};

SB.WORLD = (function () {
  'use strict';

  /* ---------- tile properties ---------- */
  const TILES = {
    '.': { t: 'grass', solid: false }, ',': { t: 'tallgrass', solid: false, enc: true },
    'T': { t: 'tree', solid: true }, '~': { t: 'water', solid: true },
    '#': { t: 'path', solid: false }, 's': { t: 'sand', solid: false },
    'F': { t: 'floor', solid: false }, 'W': { t: 'wall', solid: true },
    'h': { t: 'hfloor', solid: false }, 'w': { t: 'hwall', solid: true },
    'R': { t: 'roof', solid: true }, 'D': { t: 'door', solid: false },
    'f': { t: 'fence', solid: true }, 'O': { t: 'well', solid: true },
    'S': { t: 'sign', solid: true, act: 'sign' }, 'C': { t: 'chest', solid: true, act: 'chest' },
    'c': { t: 'chestopen', solid: true }, 'H': { t: 'herb', solid: false, act: 'herb' },
    'U': { t: 'stump', solid: true, act: 'stump' }, 'L': { t: 'lantern', solid: true },
    'B': { t: 'bridge', solid: false }, 'G': { t: 'gate', solid: true, act: 'gate' },
    'A': { t: 'shrine', solid: true, act: 'shrine' }, 'E': { t: 'hearth', solid: true, act: 'hearth' },
    'r': { t: 'carpet', solid: false }, 't': { t: 'table', solid: true },
    'b': { t: 'bed', solid: true, act: 'bed' }, 'k': { t: 'counter', solid: true },
    'X': { t: 'hatch', solid: false }, 'K': { t: 'sack', solid: true },
    'P': { t: 'pillar', solid: true }, 'u': { t: 'rubble', solid: true },
    'd': { t: 'dwater', solid: true }, ' ': { t: 'void', solid: true },
    'M': { t: 'floor', solid: true, act: 'mirror' }
  };

  /* ---------- grid builder helpers ---------- */
  function base(w, h, fill) { const g = []; for (let y = 0; y < h; y++) { const row = []; for (let x = 0; x < w; x++) row.push(fill); g.push(row); } return { w, h, g }; }
  function rect(m, x, y, w, h, ch) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (m.g[j] && m.g[j][i] !== undefined) m.g[j][i] = ch; }
  function border(m, ch) { rect(m, 0, 0, m.w, 1, ch); rect(m, 0, m.h - 1, m.w, 1, ch); rect(m, 0, 0, 1, m.h, ch); rect(m, m.w - 1, 0, 1, m.h, ch); }
  function set(m, x, y, ch) { if (m.g[y] && m.g[y][x] !== undefined) m.g[y][x] = ch; }
  // building: roof top, walls, door at bottom
  function building(m, x, y, w, h, doorX) {
    rect(m, x, y, w, h - 2, 'R');
    rect(m, x, y + h - 2, w, 2, 'w');
    set(m, doorX, y + h - 1, 'D');
    set(m, doorX, y + h - 2, 'w');
  }
  function scatter(m, ch, n, seed, avoid) {
    let s = seed; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    for (let i = 0; i < n; i++) {
      const x = 1 + ((rnd() * (m.w - 2)) | 0), y = 1 + ((rnd() * (m.h - 2)) | 0);
      if (m.g[y][x] === '.' && !(avoid && avoid(x, y))) m.g[y][x] = ch;
    }
  }

  const MAPS = {};

  /* ================= EMBERWICK (town) 40x32 ================= */
  (function () {
    const m = base(40, 32, '.');
    border(m, 'T'); border(m, 'T');
    // main roads
    rect(m, 2, 10, 37, 2, '#');
    rect(m, 19, 10, 2, 19, '#');
    rect(m, 6, 18, 28, 2, '#'); // plaza cross
    // buildings (roof + wall + door)
    building(m, 4, 4, 8, 6, 7);    // inn -> door (7,9)
    building(m, 14, 4, 8, 6, 17);  // forge -> door (17,9)
    building(m, 24, 4, 8, 6, 27);  // remedies -> door (27,9)
    building(m, 32, 12, 6, 6, 34); // mirror cottage -> door (34,17)
    building(m, 30, 22, 8, 6, 33); // granary -> door (33,27) but hatch beside
    set(m, 33, 27, 'w'); set(m, 33, 28, 'X'); // granary hatch outside
    // elder hall (decorative, Maren outside)
    building(m, 14, 22, 10, 6, 19); set(m, 19, 27, 'w'); set(m, 19, 26, 'w');
    // well + plaza decor
    set(m, 22, 18, 'O');
    set(m, 16, 18, 'L'); set(m, 24, 18, 'L');
    set(m, 19, 12, 'L'); set(m, 20, 12, 'L');
    // farm fences (Odie)
    rect(m, 26, 24, 1, 5, 'f'); rect(m, 26, 24, 3, 1, 'f');
    // signs
    set(m, 5, 11, 'S'); set(m, 36, 11, 'S');
    // herb garden near Sela
    set(m, 33, 9, 'H'); set(m, 34, 9, 'H');
    // trees & lanterns
    scatter(m, 'T', 26, 42, (x, y) => (y >= 9 && y <= 12) || (x >= 18 && x <= 21));
    set(m, 3, 10, 'L'); set(m, 38, 10, 'L');
    // east exit
    set(m, 39, 10, '#'); set(m, 39, 11, '#');
    MAPS.emberwick = {
      id: 'emberwick', name: 'Emberwick', w: m.w, h: m.h, grid: m.g, outdoor: true, music: 'town',
      npcs: [
        { id: 'maren', x: 20, y: 16, dir: 0 },
        { id: 'ivo', x: 12, y: 18, dir: 0 },
        { id: 'pip', x: 24, y: 20, dir: 1 },
        { id: 'tor', x: 37, y: 10, dir: 1 },
        { id: 'odie', x: 28, y: 26, dir: 1 }
      ],
      transitions: [
        { x: 7, y: 9, to: 'inn', tx: 5, ty: 7 },
        { x: 17, y: 9, to: 'forge', tx: 5, ty: 7 },
        { x: 27, y: 9, to: 'remedies', tx: 5, ty: 7 },
        { x: 34, y: 17, to: 'mirror', tx: 4, ty: 7 },
        { x: 33, y: 28, to: 'cellar', tx: 10, ty: 15 },
        { x: 39, y: 10, to: 'emberwood', tx: 1, ty: 24 },
        { x: 39, y: 11, to: 'emberwood', tx: 1, ty: 25 }
      ],
      events: [
        { x: 5, y: 11, type: 'sign', text: 'EMBERWICK — "Where the hearth remembers." Inn to the west, Forge and Remedies to the north.' },
        { x: 36, y: 11, type: 'sign', text: 'East gate → the Emberwood. Wild Cindren roam the tall grass. Travel prepared, Warden.' },
        { x: 22, y: 18, type: 'sign', text: 'The village well. The water still runs warm, though the Flame thins.' },
        { x: 33, y: 9, type: 'herb' }, { x: 34, y: 9, type: 'herb' }
      ],
      encounters: null
    };
  })();

  /* ================= interiors ================= */
  function room(id, name, w, h, exitTo, exitX, exitY, doorX) {
    const m = base(w, h, 'h');
    border(m, 'w');
    set(m, doorX, h - 1, 'D');
    MAPS[id] = {
      id, name, w, h, grid: m.g, outdoor: false, music: 'town',
      npcs: [], transitions: [{ x: doorX, y: h - 1, to: exitTo, tx: exitX, ty: exitY }],
      events: [], encounters: null
    };
    return MAPS[id];
  }
  (function () {
    const inn = room('inn', 'The Ember Rest', 12, 9, 'emberwick', 7, 10, 5);
    rect(inn.grid ? { g: inn.grid, w: inn.w, h: inn.h } : inn, 0, 0, 0, 0, 'h');
    const mm = { g: inn.grid, w: inn.w, h: inn.h };
    set(mm, 2, 2, 'b'); set(mm, 9, 2, 'b');
    rect(mm, 3, 4, 6, 1, 'k');
    set(mm, 6, 6, 't'); set(mm, 10, 6, 'E');
    rect(mm, 4, 7, 4, 1, 'r');
    inn.npcs = [{ id: 'rosa', x: 6, y: 3, dir: 0 }];
    inn.events = [{ x: 10, y: 6, type: 'hearth' }, { x: 2, y: 2, type: 'bed' }, { x: 9, y: 2, type: 'bed' }];

    const forge = room('forge', "Brokk's Forge", 12, 9, 'emberwick', 17, 10, 5);
    const fm = { g: forge.grid, w: forge.w, h: forge.h };
    rect(fm, 3, 4, 6, 1, 'k'); set(fm, 9, 6, 't'); set(fm, 2, 6, 'K'); set(fm, 2, 7, 'K');
    forge.npcs = [{ id: 'brokk', x: 6, y: 3, dir: 0 }];

    const rem = room('remedies', "Sela's Remedies", 12, 9, 'emberwick', 27, 10, 5);
    const rm = { g: rem.grid, w: rem.w, h: rem.h };
    rect(rm, 3, 4, 6, 1, 'k'); set(rm, 2, 2, 'K'); set(rm, 9, 2, 'K'); set(rm, 10, 6, 'H');
    rem.npcs = [{ id: 'sela', x: 6, y: 3, dir: 0 }];

    const mir = room('mirror', "Warden's Cottage", 10, 9, 'emberwick', 34, 18, 4);
    const mr = { g: mir.grid, w: mir.w, h: mir.h };
    set(mr, 5, 2, 'M'); set(mr, 2, 6, 'b'); set(mr, 7, 6, 't');
    mir.events = [{ x: 5, y: 2, type: 'mirror' }];
  })();

  /* ================= EMBERWOOD (overworld) 56x48 ================= */
  (function () {
    const m = base(56, 48, '.');
    border(m, 'T');
    // paths
    rect(m, 1, 24, 30, 2, '#');           // west-east main
    rect(m, 30, 12, 18, 2, '#');          // to shrine
    rect(m, 30, 12, 2, 14, '#');          // connector
    rect(m, 26, 26, 2, 20, '#');          // south to gate
    // pond
    rect(m, 22, 22, 11, 9, '~');
    rect(m, 23, 21, 9, 1, 's'); rect(m, 23, 31, 9, 1, 's');
    set(m, 27, 20, 's'); // firefly shore marker (north)
    // bridge over pond narrows
    rect(m, 26, 26, 2, 2, 'B');
    // tall grass patches
    rect(m, 6, 14, 10, 8, ',');
    rect(m, 36, 16, 12, 8, ',');
    rect(m, 8, 30, 12, 8, ',');
    rect(m, 38, 32, 12, 8, ',');
    rect(m, 24, 6, 12, 5, ',');
    // shrine
    set(m, 47, 12, 'A');
    rect(m, 45, 11, 5, 4, '#'); set(m, 47, 12, 'A');
    // stump (Pip's locket)
    set(m, 20, 32, 'U');
    // herbs
    set(m, 10, 10, 'H'); set(m, 38, 34, 'H'); set(m, 14, 38, 'H'); set(m, 44, 26, 'H');
    // gate to Hollowmere (south)
    set(m, 27, 46, 'G'); set(m, 26, 46, 'W'); set(m, 28, 46, 'W');
    rect(m, 24, 45, 7, 1, 'W'); set(m, 27, 46, 'G');
    // lanterns along roads
    set(m, 8, 23, 'L'); set(m, 18, 23, 'L'); set(m, 30, 23, 'L'); set(m, 26, 34, 'L'); set(m, 26, 42, 'L');
    set(m, 40, 11, 'L');
    // signs
    set(m, 2, 23, 'S'); set(m, 27, 44, 'S'); set(m, 45, 14, 'S');
    // trees
    scatter(m, 'T', 90, 7, (x, y) => (y >= 23 && y <= 27) || (x >= 25 && x <= 29 && y > 26) || (x >= 22 && x <= 32 && y >= 21 && y <= 31));
    // west exit
    set(m, 0, 24, '#'); set(m, 0, 25, '#');
    MAPS.emberwood = {
      id: 'emberwood', name: 'The Emberwood', w: m.w, h: m.h, grid: m.g, outdoor: true, music: 'wood',
      npcs: [],
      transitions: [
        { x: 0, y: 24, to: 'emberwick', tx: 38, ty: 10 },
        { x: 0, y: 25, to: 'emberwick', tx: 38, ty: 11 },
        { x: 27, y: 46, to: 'hollowmere', tx: 18, ty: 3, req: 'hollowkey', msg: 'The Hollowmere gate is sealed. A tide-worn keyhole waits.' }
      ],
      events: [
        { x: 2, y: 23, type: 'sign', text: 'The Emberwood. East: the Shrine Stone. South: Hollowmere\'s sealed gate. Beware the tall grass.' },
        { x: 27, y: 44, type: 'sign', text: 'HOLLOWMERE — the drowned temple. Sealed by the tide-priests. Their key was lost to the granary stores.' },
        { x: 45, y: 14, type: 'sign', text: 'The Shrine Stone. Lay your hand upon it and feel the First Flame\'s heartbeat.' },
        { x: 47, y: 12, type: 'shrine' },
        { x: 20, y: 32, type: 'stump' },
        { x: 27, y: 20, type: 'firefly' },
        { x: 10, y: 10, type: 'herb' }, { x: 38, y: 34, type: 'herb' }, { x: 14, y: 38, type: 'herb' }, { x: 44, y: 26, type: 'herb' }
      ],
      encounters: {
        rate: 0.13,
        tables: [
          { x: 6, y: 14, w: 10, h: 8, list: [['cindpup', 3, 5, 3], ['sproutle', 3, 5, 3], ['gnawbit', 3, 4, 2], ['gustling', 3, 5, 2]] },
          { x: 36, y: 16, w: 12, h: 8, list: [['voltail', 4, 6, 3], ['gustling', 4, 6, 3], ['cindpup', 4, 6, 2], ['pebblit', 4, 6, 2]] },
          { x: 8, y: 30, w: 12, h: 8, list: [['sproutle', 4, 6, 3], ['dewbit', 4, 6, 3], ['murkfin', 4, 6, 2], ['gnawbit', 4, 5, 2]] },
          { x: 38, y: 32, w: 12, h: 8, list: [['cindermaw', 7, 9, 1], ['voltail', 5, 7, 3], ['pebblit', 5, 7, 3], ['zephryx', 6, 8, 2]] },
          { x: 24, y: 6, w: 12, h: 5, list: [['gustling', 3, 5, 3], ['zephryx', 5, 7, 2], ['cindpup', 3, 5, 3], ['dewbit', 3, 5, 2]] }
        ]
      }
    };
  })();

  /* ================= GRANARY CELLAR 22x18 ================= */
  (function () {
    const m = base(22, 18, 'F');
    border(m, 'W');
    // sacks & rubble
    rect(m, 2, 2, 3, 2, 'K'); rect(m, 17, 2, 3, 2, 'K');
    rect(m, 2, 12, 2, 3, 'K'); rect(m, 18, 12, 2, 3, 'K');
    set(m, 9, 9, 'u'); set(m, 13, 10, 'u'); set(m, 6, 6, 'u');
    // chests
    set(m, 3, 3, 'C'); set(m, 18, 3, 'C'); set(m, 3, 14, 'C');
    // hatch exit
    set(m, 10, 16, 'X');
    // broodmother lair
    set(m, 11, 4, 'F');
    MAPS.cellar = {
      id: 'cellar', name: 'Granary Cellar', w: m.w, h: m.h, grid: m.g, outdoor: false, music: 'dungeon',
      npcs: [],
      transitions: [{ x: 10, y: 16, to: 'emberwick', tx: 33, ty: 29 }],
      events: [
        { x: 3, y: 3, type: 'chest', loot: { items: [['hollowkey', 1]], gold: 15 }, flag: 'cellar_chest1', msg: 'You found the Hollowmere Key! It is cold as deep water.' },
        { x: 18, y: 3, type: 'chest', loot: { gear: ['rathide_vest'], items: [['salve', 2]], gold: 25 }, flag: 'cellar_chest2' },
        { x: 3, y: 14, type: 'chest', loot: { items: [['finesalve', 1], ['essencedraught', 1]], gold: 20 }, flag: 'cellar_chest3' },
        { x: 11, y: 4, type: 'boss', sp: 'broodmother', flag: 'broodmother', level: 7, intro: ['The grain sacks tremble. Something vast uncoils in the dark — the Broodmother, gorged on stolen cinders.', 'Her eyes are wet stones. She will not let you pass.'] }
      ],
      encounters: { rate: 0.08, tables: [{ x: 1, y: 1, w: 20, h: 16, list: [['gnawbit', 4, 6, 5], ['pebblit', 4, 6, 2]] }] }
    };
  })();

  /* ================= HOLLOWMERE DEPTHS 40x40 ================= */
  (function () {
    const m = base(40, 40, 'F');
    border(m, 'W');
    // water channels
    rect(m, 8, 8, 24, 2, 'd');
    rect(m, 8, 24, 24, 2, 'd');
    rect(m, 8, 8, 2, 18, 'd');
    rect(m, 30, 8, 2, 18, 'd');
    // bridges across channels
    rect(m, 18, 8, 3, 2, 'B'); rect(m, 18, 24, 3, 2, 'B');
    rect(m, 8, 15, 2, 3, 'B'); rect(m, 30, 15, 2, 3, 'B');
    // pillars
    for (let x = 12; x <= 28; x += 4) { set(m, x, 12, 'P'); set(m, x, 20, 'P'); }
    set(m, 12, 30, 'P'); set(m, 28, 30, 'P'); set(m, 12, 34, 'P'); set(m, 28, 34, 'P');
    // rubble
    set(m, 5, 5, 'u'); set(m, 34, 5, 'u'); set(m, 5, 35, 'u'); set(m, 34, 35, 'u');
    // entrance
    set(m, 18, 1, 'F'); set(m, 18, 2, 'F');
    // chests
    set(m, 5, 10, 'C'); set(m, 34, 12, 'C'); set(m, 6, 30, 'C'); set(m, 33, 30, 'C');
    // Hearthspire (Vael arena)
    rect(m, 15, 33, 10, 6, 'r');
    set(m, 19, 37, 'E'); set(m, 20, 37, 'E');
    // sentinel blocks mid corridor
    set(m, 19, 18, 'F');
    MAPS.hollowmere = {
      id: 'hollowmere', name: 'Hollowmere Depths', w: m.w, h: m.h, grid: m.g, outdoor: false, music: 'dungeon',
      npcs: [],
      transitions: [{ x: 18, y: 1, to: 'emberwood', tx: 27, ty: 45 }],
      events: [
        { x: 5, y: 10, type: 'chest', loot: { gear: ['lumen_circlet'], gold: 40 }, flag: 'hm_chest1' },
        { x: 34, y: 12, type: 'chest', loot: { gear: ['wispcore_pendant'], items: [['essencedraught', 2]], gold: 40 }, flag: 'hm_chest2' },
        { x: 6, y: 30, type: 'chest', loot: { items: [['finesalve', 2], ['rekindlecharm', 1]], gold: 50 }, flag: 'hm_chest3' },
        { x: 33, y: 30, type: 'chest', loot: { gear: ['tidal_signet'], gold: 60 }, flag: 'hm_chest4' },
        { x: 19, y: 18, type: 'boss', sp: 'hollowsentinel', flag: 'sentinel', level: 11, intro: ['The stone warden grinds to life, dust cascading from its joints.', 'It still obeys a king who drowned ages ago. Its gaze is hollow, its purpose absolute.'] },
        { x: 19, y: 35, type: 'boss', sp: 'vael', flag: 'vael', level: 14, intro: ['At the Hearthspire, a grey-cloaked figure turns. Ash falls from his shoulders like snow.', 'Vael, the Ashen Hand: "Another Warden. Come to feed the Flame? I have a better use for it — a crown of stolen dawn."', 'The drained Cindren flicker in his idol. End this.'] },
        { x: 19, y: 37, type: 'hearth' }, { x: 20, y: 37, type: 'hearth' }
      ],
      encounters: { rate: 0.09, tables: [{ x: 1, y: 1, w: 38, h: 38, list: [['wispling', 8, 11, 3], ['gloomwing', 8, 11, 3], ['murkfin', 8, 10, 2], ['pebblit', 8, 10, 2]] }] }
    };
  })();

  /* ---------- access helpers ---------- */
  function tileAt(mapId, x, y) {
    const m = MAPS[mapId];
    if (!m || y < 0 || y >= m.h || x < 0 || x >= m.w) return 'W';
    return m.grid[y][x];
  }
  function isSolid(mapId, x, y) {
    const ch = tileAt(mapId, x, y);
    const tp = TILES[ch];
    if (!tp) return true;
    if (tp.solid) return true;
    return false;
  }
  function eventAt(mapId, x, y) {
    const m = MAPS[mapId];
    if (!m) return null;
    return m.events.find(e => e.x === x && e.y === y) || null;
  }
  function npcAt(mapId, x, y) {
    const m = MAPS[mapId];
    if (!m) return null;
    return m.npcs.find(n => n.x === x && n.y === y) || null;
  }
  function transitionAt(mapId, x, y) {
    const m = MAPS[mapId];
    if (!m) return null;
    return m.transitions.find(t => t.x === x && t.y === y) || null;
  }
  // boss events block movement until defeated
  function bossBlocks(mapId, x, y, flags) {
    const e = eventAt(mapId, x, y);
    return e && e.type === 'boss' && !flags[e.flag];
  }

  return { TILES, MAPS, tileAt, isSolid, eventAt, npcAt, transitionAt, bossBlocks };
})();
