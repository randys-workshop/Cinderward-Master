/* ============================================================
   CINDERWARD — The Dying Flame
   data.js : elements, moves, species (Cindren), gear, items,
             quests, NPCs. All names/art/code original.
   ============================================================ */
window.SB = window.SB || {};

SB.DATA = (function () {
  'use strict';

  /* ---------- Elements & type chart ---------- */
  const EL = {
    none:  { name: 'Physical', color: '#c8c8c8' },
    ember: { name: 'Ember',    color: '#ff7a3c' },
    grove: { name: 'Grove',    color: '#6fce5a' },
    tide:  { name: 'Tide',     color: '#4aa8ff' },
    stone: { name: 'Stone',    color: '#c9a06a' },
    spark: { name: 'Spark',    color: '#ffd94a' },
    gale:  { name: 'Gale',     color: '#9fe8d8' },
    lumen: { name: 'Lumen',    color: '#fff2b0' },
    umbra: { name: 'Umbra',    color: '#b48aff' }
  };
  // attacker -> defender : multiplier (2 = strong, .5 = resisted)
  const STRONG = {
    ember: ['grove'], grove: ['stone'], stone: ['spark'],
    spark: ['tide'], tide: ['gale'], gale: ['ember'],
    lumen: ['umbra'], umbra: ['lumen']
  };
  function elMod(atkEl, defEl) {
    if (!atkEl || atkEl === 'none' || !defEl || defEl === 'none') return 1;
    if (atkEl === defEl) return 0.5;
    if (STRONG[atkEl] && STRONG[atkEl].includes(defEl)) return 2;
    if (STRONG[defEl] && STRONG[defEl].includes(atkEl)) return 0.5;
    return 1;
  }

  /* ---------- Statuses ---------- */
  const STATUS = {
    scorch:  { name: 'Scorched',  dot: 0.06, atkMul: 0.75, color: '#ff7a3c', msg: 'is scorched by embers' },
    blight:  { name: 'Blighted',  dot: 0.08, color: '#9fd45a', msg: 'suffers the blight' },
    static:  { name: 'Static',    spdMul: 0.5, skip: 0.25, color: '#ffd94a', msg: 'crackles with static' },
    slumber: { name: 'Slumbering', skip: 1, wakeOnHit: true, wakeChance: 0.35, color: '#b48aff', msg: 'is lost in slumber' },
    regen:   { name: 'Kindled',   hot: 0.08, color: '#7fffb0', msg: 'is wreathed in kindling light' }
  };

  /* ---------- Moves ----------
     kind: phys (atk vs def) | art (mag vs res) | heal | buff
     tgt : foe | foes | ally | allies | self
     st  : {id, ch} status inflict; buff: {stat, n, tgt} stage shift
  */
  const M = (id, name, el, kind, pow, cost, acc, tgt, desc, extra) =>
    Object.assign({ id, name, el, kind, pow, cost, acc, tgt, desc }, extra || {});

  const MOVES = {
    strike:      M('strike', 'Strike', 'none', 'phys', 40, 0, 100, 'foe', 'A trusty weapon blow.'),
    rend:        M('rend', 'Rend', 'none', 'phys', 65, 0, 95, 'foe', 'A savage tearing strike.'),
    crush:       M('crush', 'Crush', 'stone', 'phys', 75, 0, 90, 'foe', 'A heavy crushing blow.'),
    swiftjab:    M('swiftjab', 'Swift Jab', 'none', 'phys', 35, 0, 100, 'foe', 'A quick strike that always lands first.', { prio: 1 }),
    // Ember arts
    emberlash:   M('emberlash', 'Ember Lash', 'ember', 'art', 45, 4, 100, 'foe', 'A whip of living flame.', { st: { id: 'scorch', ch: 0.15 } }),
    cinderburst: M('cinderburst', 'Cinder Burst', 'ember', 'art', 70, 8, 95, 'foe', 'A bursting mote of hearthfire.', { st: { id: 'scorch', ch: 0.25 } }),
    pyreclasm:   M('pyreclasm', 'Pyreclasm', 'ember', 'art', 95, 14, 90, 'foes', 'A rain of fire on all foes.', { st: { id: 'scorch', ch: 0.2 } }),
    // Grove arts
    thornwhip:   M('thornwhip', 'Thorn Whip', 'grove', 'art', 45, 4, 100, 'foe', 'Lashing briars.', { st: { id: 'blight', ch: 0.15 } }),
    rootsnare:   M('rootsnare', 'Root Snare', 'grove', 'buff', 0, 6, 90, 'foe', 'Roots drag at the foe.', { buff: { stat: 'spd', n: -1, tgt: 'foe' }, st: { id: 'blight', ch: 0.3 } }),
    verdantwrath:M('verdantwrath', 'Verdant Wrath', 'grove', 'art', 90, 13, 90, 'foes', 'The wild itself strikes.', { st: { id: 'blight', ch: 0.2 } }),
    // Tide arts
    tidalpull:   M('tidalpull', 'Tidal Pull', 'tide', 'art', 45, 4, 100, 'foe', 'A dragging undertow.'),
    frostmantle: M('frostmantle', 'Frost Mantle', 'tide', 'buff', 0, 6, 100, 'ally', 'Icy armor raises defense.', { buff: { stat: 'def', n: 1, tgt: 'ally' } }),
    maelstrom:   M('maelstrom', 'Maelstrom', 'tide', 'art', 92, 14, 90, 'foes', 'A crushing spiral of water.'),
    // Stone arts
    pebbleshot:  M('pebbleshot', 'Pebble Shot', 'stone', 'art', 42, 3, 100, 'foe', 'A hurled stone shard.'),
    bulwark:     M('bulwark', 'Bulwark', 'stone', 'buff', 0, 7, 100, 'allies', 'Stoneskin guards the party.', { buff: { stat: 'def', n: 1, tgt: 'allies' } }),
    quakefall:   M('quakefall', 'Quakefall', 'stone', 'art', 95, 14, 90, 'foes', 'The ground itself collapses.'),
    // Spark arts
    zapdart:     M('zapdart', 'Zap Dart', 'spark', 'art', 42, 3, 100, 'foe', 'A dart of crackling light.', { st: { id: 'static', ch: 0.15 } }),
    stormcall:   M('stormcall', 'Stormcall', 'spark', 'art', 72, 8, 95, 'foe', 'A bolt from a clear sky.', { st: { id: 'static', ch: 0.3 } }),
    tempestroar: M('tempestroar', 'Tempest Roar', 'spark', 'art', 95, 14, 85, 'foes', 'Thunder shakes the field.', { st: { id: 'static', ch: 0.25 } }),
    // Gale arts
    windslice:   M('windslice', 'Wind Slice', 'gale', 'art', 42, 3, 100, 'foe', 'A blade of compressed air.'),
    tailwind:    M('tailwind', 'Tailwind', 'gale', 'buff', 0, 6, 100, 'allies', 'A favoring wind quickens all.', { buff: { stat: 'spd', n: 1, tgt: 'allies' } }),
    skyrend:     M('skyrend', 'Skyrend', 'gale', 'art', 92, 13, 90, 'foes', 'The sky tears open.'),
    // Lumen arts
    glimmer:     M('glimmer', 'Glimmer', 'lumen', 'art', 45, 4, 100, 'foe', 'A searing mote of dawnlight.'),
    dawnward:    M('dawnward', 'Dawnward', 'lumen', 'buff', 0, 7, 100, 'allies', 'Dawnlight hardens resolve.', { buff: { stat: 'res', n: 1, tgt: 'allies' } }),
    solarlance:  M('solarlance', 'Solar Lance', 'lumen', 'art', 98, 15, 90, 'foe', 'A spear of concentrated sun.'),
    // Umbra arts
    nightfang:   M('nightfang', 'Nightfang', 'umbra', 'art', 48, 4, 100, 'foe', 'Biting shadow.', { st: { id: 'slumber', ch: 0.1 } }),
    veilgloom:   M('veilgloom', 'Veil of Gloom', 'umbra', 'buff', 0, 6, 90, 'foe', 'Gloom saps the foe\'s might.', { buff: { stat: 'atk', n: -1, tgt: 'foe' } }),
    eclipse:     M('eclipse', 'Eclipse', 'umbra', 'art', 98, 15, 85, 'foes', 'A devouring darkness.', { st: { id: 'slumber', ch: 0.15 } }),
    // Support
    mend:        M('mend', 'Mend', 'lumen', 'heal', 40, 5, 100, 'ally', 'Kindling light closes wounds.'),
    greatmend:   M('greatmend', 'Great Mend', 'lumen', 'heal', 90, 11, 100, 'ally', 'A strong restorative light.'),
    cleansingwave:M('cleansingwave', 'Cleansing Wave', 'tide', 'heal', 0, 6, 100, 'allies', 'Washes away all ailments.', { cleanse: true }),
    rekindle:    M('rekindle', 'Rekindle', 'ember', 'heal', 50, 12, 100, 'ally', 'Revives a fallen ally at half health.', { revive: true }),
    guardstance: M('guardstance', 'Guard Stance', 'none', 'buff', 0, 0, 100, 'self', 'Brace: halve damage this turn.', { guard: true }),
    rally:       M('rally', 'Rally', 'none', 'buff', 0, 5, 100, 'allies', 'A rousing cry raises attack.', { buff: { stat: 'atk', n: 1, tgt: 'allies' } }),
    kindleaura:  M('kindleaura', 'Kindle Aura', 'ember', 'buff', 0, 8, 100, 'allies', 'Warm light regenerates the party.', { st: { id: 'regen', ch: 1, friendly: true } }),
    // Boss signature
    ashenwave:   M('ashenwave', 'Ashen Wave', 'umbra', 'art', 80, 0, 95, 'foes', 'A tide of covenant ash.', { st: { id: 'blight', ch: 0.3 } }),
    soulcinder:  M('soulcinder', 'Soul Cinder', 'ember', 'art', 110, 0, 90, 'foe', 'Fire that burns the spirit.'),
    hollowgaze:  M('hollowgaze', 'Hollow Gaze', 'umbra', 'buff', 0, 0, 90, 'foe', 'A gaze that weakens resolve.', { buff: { stat: 'mag', n: -1, tgt: 'foe' } })
  };

  /* ---------- Cindren species ----------
     base stats at level 1; learn: [level, moveId];
     loot: [gearOrItemId, chance]; bind: base capture rate;
     spr: sprite key; evo: {lvl, into}
  */
  const SPECIES = {
    cindpup: {
      id: 'cindpup', name: 'Cindpup', el: 'ember', spr: 'cindpup',
      base: { hp: 34, atk: 12, def: 9, mag: 13, res: 9, spd: 11 },
      learn: [[1, 'strike'], [1, 'emberlash'], [6, 'swiftjab'], [10, 'cinderburst'], [15, 'rally']],
      loot: [['pupfang_charm', 0.18], ['emberhide_vest', 0.12], ['salve', 0.3]],
      bind: 0.55, xp: 16, evo: { lvl: 16, into: 'emberhound' },
      desc: 'A hearth-pup born from a spark of the First Flame. Loyal, warm, and brave beyond its size.'
    },
    emberhound: {
      id: 'emberhound', name: 'Emberhound', el: 'ember', spr: 'emberhound',
      base: { hp: 52, atk: 18, def: 13, mag: 19, res: 14, spd: 16 },
      learn: [[1, 'rend'], [1, 'cinderburst'], [18, 'kindleaura'], [22, 'pyreclasm']],
      loot: [['houndplate', 0.15], ['cinderbrand', 0.1], ['finesalve', 0.25]],
      bind: 0.3, xp: 42,
      desc: 'A Cindpup grown into a blazing guardian. Its mane is a living hearthfire.'
    },
    dewbit: {
      id: 'dewbit', name: 'Dewbit', el: 'tide', spr: 'dewbit',
      base: { hp: 36, atk: 10, def: 11, mag: 14, res: 12, spd: 10 },
      learn: [[1, 'strike'], [1, 'tidalpull'], [6, 'frostmantle'], [11, 'mend'], [16, 'maelstrom']],
      loot: [['dewglass_pendant', 0.18], ['tidecaller_orb', 0.1], ['salve', 0.3]],
      bind: 0.55, xp: 16, evo: { lvl: 16, into: 'torrentail' },
      desc: 'A droplet-sprite from the morning mere. It hums when rain is coming.'
    },
    torrentail: {
      id: 'torrentail', name: 'Torrentail', el: 'tide', spr: 'torrentail',
      base: { hp: 54, atk: 14, def: 16, mag: 21, res: 18, spd: 14 },
      learn: [[1, 'tidalpull'], [1, 'frostmantle'], [18, 'greatmend'], [22, 'maelstrom']],
      loot: [['torrent_scale', 0.15], ['tidal_signet', 0.1], ['finesalve', 0.25]],
      bind: 0.3, xp: 42,
      desc: 'A river-serpent whose tail carries a small, obedient storm.'
    },
    sproutle: {
      id: 'sproutle', name: 'Sproutle', el: 'grove', spr: 'sproutle',
      base: { hp: 38, atk: 11, def: 12, mag: 12, res: 11, spd: 9 },
      learn: [[1, 'strike'], [1, 'thornwhip'], [6, 'rootsnare'], [10, 'mend'], [15, 'rally']],
      loot: [['briarweave_cloak', 0.18], ['rootwood_staff', 0.12], ['bitterroot', 0.45]],
      bind: 0.55, xp: 16, evo: { lvl: 16, into: 'thornmaw' },
      desc: 'A seedling-sprite that took root in a cinder. It flowers when it trusts you.'
    },
    thornmaw: {
      id: 'thornmaw', name: 'Thornmaw', el: 'grove', spr: 'thornmaw',
      base: { hp: 58, atk: 19, def: 18, mag: 16, res: 15, spd: 12 },
      learn: [[1, 'rend'], [1, 'thornwhip'], [18, 'bulwark'], [22, 'verdantwrath']],
      loot: [['thornmail', 0.15], ['briar_crown', 0.1], ['bitterroot', 0.4]],
      bind: 0.3, xp: 44,
      desc: 'A bramble-beast with a heart of warm coal. Gardens grow where it sleeps.'
    },
    gnawbit: {
      id: 'gnawbit', name: 'Gnawbit', el: 'stone', spr: 'gnawbit',
      base: { hp: 30, atk: 13, def: 10, mag: 7, res: 8, spd: 13 },
      learn: [[1, 'strike'], [1, 'pebbleshot'], [7, 'swiftjab'], [12, 'crush']],
      loot: [['gnawbone_charm', 0.2], ['rathide_vest', 0.15], ['salve', 0.25]],
      bind: 0.6, xp: 12,
      desc: 'A cellar-rat that nibbled a cinder and gained a spark of stone-magic. Mostly still a rat.'
    },
    broodmother: {
      id: 'broodmother', name: 'Broodmother', el: 'stone', spr: 'broodmother', boss: true,
      base: { hp: 90, atk: 17, def: 14, mag: 10, res: 12, spd: 12 },
      learn: [[1, 'crush'], [1, 'pebbleshot'], [1, 'rally'], [1, 'rend']],
      loot: [['broodfang_dirk', 1], ['rathide_vest', 0.5], ['finesalve', 1]],
      bind: 0, xp: 80,
      desc: 'The granary\'s swollen matriarch, gorged on stolen cinders.'
    },
    pebblit: {
      id: 'pebblit', name: 'Pebblit', el: 'stone', spr: 'pebblit',
      base: { hp: 40, atk: 12, def: 16, mag: 9, res: 12, spd: 7 },
      learn: [[1, 'strike'], [1, 'pebbleshot'], [8, 'bulwark'], [13, 'crush']],
      loot: [['pebble_plate', 0.15], ['stoneshard_ring', 0.15], ['salve', 0.25]],
      bind: 0.5, xp: 18,
      desc: 'A walking cairn with a cinder for a heart. Patient as geology.'
    },
    gustling: {
      id: 'gustling', name: 'Gustling', el: 'gale', spr: 'gustling',
      base: { hp: 30, atk: 12, def: 8, mag: 13, res: 10, spd: 16 },
      learn: [[1, 'swiftjab'], [1, 'windslice'], [8, 'tailwind'], [13, 'skyrend']],
      loot: [['featherwind_cape', 0.18], ['talon_dirk', 0.14], ['salve', 0.25]],
      bind: 0.5, xp: 17,
      desc: 'A fledgling wind-sprite. It never quite lands, even when sleeping.'
    },
    zephryx: {
      id: 'zephryx', name: 'Zephryx', el: 'gale', spr: 'zephryx',
      base: { hp: 46, atk: 17, def: 12, mag: 19, res: 14, spd: 21 },
      learn: [[1, 'windslice'], [1, 'tailwind'], [16, 'skyrend'], [20, 'swiftjab']],
      loot: [['stormfeather_mantle', 0.14], ['galecrest_helm', 0.12], ['finesalve', 0.25]],
      bind: 0.3, xp: 40,
      desc: 'A raptor of the high thermals, trailing ribbons of cloud.'
    },
    voltail: {
      id: 'voltail', name: 'Voltail', el: 'spark', spr: 'voltail',
      base: { hp: 32, atk: 14, def: 9, mag: 15, res: 10, spd: 17 },
      learn: [[1, 'swiftjab'], [1, 'zapdart'], [9, 'stormcall'], [14, 'rally']],
      loot: [['staticweave_gloves', 0.18], ['volt_charm', 0.15], ['salve', 0.25]],
      bind: 0.45, xp: 20,
      desc: 'A fox-sprite whose tail is a fork of lightning. Do not pet against the grain.'
    },
    murkfin: {
      id: 'murkfin', name: 'Murkfin', el: 'tide', spr: 'murkfin',
      base: { hp: 36, atk: 14, def: 11, mag: 11, res: 10, spd: 12 },
      learn: [[1, 'strike'], [1, 'tidalpull'], [9, 'rend'], [14, 'maelstrom']],
      loot: [['murkscale_leggings', 0.16], ['finblade', 0.12], ['salve', 0.25]],
      bind: 0.5, xp: 19,
      desc: 'A pond-lurker with a cinder glowing in its belly like a lantern.'
    },
    wispling: {
      id: 'wispling', name: 'Wispling', el: 'lumen', spr: 'wispling',
      base: { hp: 34, atk: 8, def: 10, mag: 18, res: 16, spd: 13 },
      learn: [[1, 'glimmer'], [1, 'mend'], [10, 'dawnward'], [15, 'solarlance']],
      loot: [['lumen_circlet', 0.16], ['wispcore_pendant', 0.14], ['essencedraught', 0.3]],
      bind: 0.4, xp: 26,
      desc: 'A lantern-soul of the drowned temple. It remembers the sun before the dimming.'
    },
    gloomwing: {
      id: 'gloomwing', name: 'Gloomwing', el: 'umbra', spr: 'gloomwing',
      base: { hp: 38, atk: 15, def: 11, mag: 16, res: 12, spd: 15 },
      learn: [[1, 'nightfang'], [1, 'veilgloom'], [12, 'eclipse'], [16, 'rend']],
      loot: [['gloomweave_hood', 0.16], ['nightfang_ring', 0.13], ['essencedraught', 0.25]],
      bind: 0.4, xp: 27,
      desc: 'A bat-sprite woven from the temple\'s shadows. It hoards forgotten prayers.'
    },
    cindermaw: {
      id: 'cindermaw', name: 'Cindermaw', el: 'ember', spr: 'cindermaw',
      base: { hp: 60, atk: 22, def: 16, mag: 20, res: 15, spd: 14 },
      learn: [[1, 'rend'], [1, 'cinderburst'], [18, 'pyreclasm'], [22, 'soulcinder']],
      loot: [['mawplate', 0.14], ['cinderbrand', 0.12], ['finesalve', 0.3]],
      bind: 0.2, xp: 55,
      desc: 'A furnace-beast that swallowed a whole hearth. Rare, proud, and very hot.'
    },
    hollowsentinel: {
      id: 'hollowsentinel', name: 'Hollow Sentinel', el: 'stone', spr: 'sentinel', boss: true,
      base: { hp: 130, atk: 20, def: 24, mag: 14, res: 18, spd: 8 },
      learn: [[1, 'crush'], [1, 'bulwark'], [1, 'quakefall'], [1, 'hollowgaze']],
      loot: [['sentinel_greaves', 1], ['sentinel_shield', 0.6], ['finesalve', 1]],
      bind: 0, xp: 140,
      desc: 'The drowned temple\'s stone warden, still obeying a king who drowned ages ago.'
    },
    vael: {
      id: 'vael', name: 'Vael, the Ashen Hand', el: 'umbra', spr: 'vael', boss: true,
      base: { hp: 220, atk: 24, def: 18, mag: 26, res: 20, spd: 16 },
      learn: [[1, 'ashenwave'], [1, 'nightfang'], [1, 'soulcinder'], [1, 'eclipse'], [1, 'hollowgaze']],
      loot: [['ashenbrand', 1], ['vaels_mantle', 1], ['covenant_signet', 1]],
      bind: 0, xp: 400,
      desc: 'Magistrate of the Ashen Covenant. He drains the Cindren to rekindle a dead god — and crown himself in its light.'
    }
  };

  /* ---------- Gear ----------
     slot: weapon offhand head shoulders chest hands waist legs feet back neck ring trinket
     rar : 0 Worn, 1 Common, 2 Fine, 3 Rare, 4 Mythic, 5 Sunforged
     st  : stat bonuses; vis: sprite layer params (see sprites.js)
  */
  const RARITY = [
    { name: 'Worn', color: '#9d9d9d' }, { name: 'Common', color: '#ffffff' },
    { name: 'Fine', color: '#3fd66c' }, { name: 'Rare', color: '#3f9dff' },
    { name: 'Mythic', color: '#c06bff' }, { name: 'Sunforged', color: '#ff9a2e' }
  ];
  const G = (id, name, slot, rar, st, vis, desc, val) =>
    ({ id, name, slot, rar, st, vis, desc, val: val || 10, gear: true });

  const GEAR = {
    // weapons
    warden_blade:   G('warden_blade', 'Warden\'s Blade', 'weapon', 1, { atk: 4 }, { k: 'sword', c1: '#cfd6e0', c2: '#8a5a2b' }, 'The standard blade of the Cinderward order.', 20),
    talon_dirk:     G('talon_dirk', 'Talon Dirk', 'weapon', 2, { atk: 6, spd: 2 }, { k: 'dagger', c1: '#d8e8e0', c2: '#4a7a5a' }, 'Light as a feather, sharp as a dive.', 45),
    broodfang_dirk: G('broodfang_dirk', 'Broodfang Dirk', 'weapon', 3, { atk: 9, spd: 3 }, { k: 'dagger', c1: '#e8d8c0', c2: '#7a4a3a', glow: '#ffcf8a' }, 'Carved from the Broodmother\'s own fang.', 90),
    rootwood_staff: G('rootwood_staff', 'Rootwood Staff', 'weapon', 2, { atk: 3, mag: 7 }, { k: 'staff', c1: '#8a6a3a', c2: '#6fce5a', glow: '#9fff8a' }, 'A living branch that still dreams of leaves.', 50),
    finblade:       G('finblade', 'Finblade', 'weapon', 2, { atk: 7, spd: 1 }, { k: 'sword', c1: '#9fc8e8', c2: '#2a5a7a' }, 'A blade shaped like a leaping fish.', 48),
    cinderbrand:    G('cinderbrand', 'Cinderbrand', 'weapon', 4, { atk: 12, mag: 6 }, { k: 'sword', c1: '#ffb066', c2: '#5a2a1a', glow: '#ff7a3c' }, 'Its edge is a banked coal that never cools.', 220),
    ashenbrand:     G('ashenbrand', 'Ashenbrand', 'weapon', 5, { atk: 18, mag: 10, spd: 4 }, { k: 'sword', c1: '#d8c8f0', c2: '#3a2a4a', glow: '#b48aff' }, 'Vael\'s own blade. The ash on it whispers.', 999),
    // offhand
    sentinel_shield:G('sentinel_shield', 'Sentinel\'s Shield', 'offhand', 3, { def: 8, res: 4 }, { k: 'shield', c1: '#a8b0b8', c2: '#5a6a72' }, 'Still bearing the drowned king\'s sigil.', 110),
    tidecaller_orb: G('tidecaller_orb', 'Tidecaller Orb', 'offhand', 3, { mag: 8, res: 3 }, { k: 'orb', c1: '#7fd4ff', c2: '#2a5a8a', glow: '#4aa8ff' }, 'A drop of the first rain, held in glass.', 120),
    ward_charm:     G('ward_charm', 'Ward Charm', 'offhand', 1, { def: 2, res: 2 }, { k: 'charm', c1: '#d8c8a0', c2: '#8a6a3a' }, 'A simple ward against ill fortune.', 18),
    // head
    galecrest_helm: G('galecrest_helm', 'Galecrest Helm', 'head', 3, { def: 5, spd: 4 }, { k: 'helm', c1: '#bfe8d8', c2: '#4a8a7a' }, 'Crested like a diving raptor.', 95),
    lumen_circlet:  G('lumen_circlet', 'Lumen Circlet', 'head', 3, { mag: 6, res: 4 }, { k: 'circlet', c1: '#ffe89a', c2: '#c8a03a', glow: '#fff2b0' }, 'A ring of captured dawn.', 100),
    gloomweave_hood:G('gloomweave_hood', 'Gloomweave Hood', 'head', 3, { res: 6, spd: 3 }, { k: 'hood', c1: '#4a3a5a', c2: '#b48aff' }, 'Shadows pool comfortably in its folds.', 95),
    briar_crown:    G('briar_crown', 'Briar Crown', 'head', 4, { def: 6, mag: 6, res: 4 }, { k: 'circlet', c1: '#6fce5a', c2: '#3a6a2a', glow: '#9fff8a' }, 'A crown of living thorns that blooms for its wearer.', 200),
    leather_cap:    G('leather_cap', 'Leather Cap', 'head', 1, { def: 2 }, { k: 'hat', c1: '#8a5a2b', c2: '#5a3a1a' }, 'Honest leather, honest protection.', 15),
    // shoulders
    ember_pauldrons:G('ember_pauldrons', 'Ember Pauldrons', 'shoulders', 2, { def: 4, atk: 2 }, { k: 'pauldrons', c1: '#c86a3a', c2: '#ff9a5a' }, 'Shoulder-plates warm to the touch.', 55),
    stormfeather_mantle: G('stormfeather_mantle', 'Stormfeather Mantle', 'shoulders', 4, { def: 6, spd: 6, res: 3 }, { k: 'pauldrons', c1: '#9fe8d8', c2: '#e8fff8', glow: '#9fe8d8' }, 'Feathers that remember the storm.', 190),
    // chest
    rathide_vest:   G('rathide_vest', 'Rathide Vest', 'chest', 1, { def: 3, hp: 8 }, { k: 'vest', c1: '#9a7a5a', c2: '#6a4a2a' }, 'Scratchy, but it stops a bite.', 20),
    emberhide_vest: G('emberhide_vest', 'Emberhide Vest', 'chest', 2, { def: 5, hp: 12, res: 2 }, { k: 'vest', c1: '#c87a4a', c2: '#8a3a1a' }, 'Hide shed by a Cindpup, still warm.', 55),
    houndplate:     G('houndplate', 'Houndplate', 'chest', 3, { def: 8, hp: 20, atk: 3 }, { k: 'plate', c1: '#d88a5a', c2: '#7a2a1a', glow: '#ff7a3c' }, 'Plate forged in an Emberhound\'s mane-fire.', 110),
    thornmail:      G('thornmail', 'Thornmail', 'chest', 3, { def: 9, res: 5, hp: 15 }, { k: 'plate', c1: '#5a8a4a', c2: '#2a4a1a' }, 'Mail woven from briars. Hugs back, carefully.', 115),
    mawplate:       G('mawplate', 'Mawplate', 'chest', 4, { def: 12, hp: 30, atk: 5 }, { k: 'plate', c1: '#e8a066', c2: '#5a1a0a', glow: '#ff5a2e' }, 'Furnace-hot plate from a Cindermaw\'s gullet.', 230),
    linen_tunic:    G('linen_tunic', 'Linen Tunic', 'chest', 1, { def: 1, hp: 5 }, { k: 'robe', c1: '#d8d0b8', c2: '#a89878' }, 'Simple Emberwick linen.', 12),
    // hands
    staticweave_gloves: G('staticweave_gloves', 'Staticweave Gloves', 'hands', 2, { atk: 3, mag: 3, spd: 2 }, { c1: '#e8d878', c2: '#8a7a2a' }, 'They crackle when you flex.', 50),
    // waist
    cinder_belt:    G('cinder_belt', 'Cinder Belt', 'waist', 2, { def: 3, hp: 10 }, { c1: '#7a4a2a', c2: '#ff9a5a' }, 'A belt with a coal for a buckle.', 45),
    // legs
    murkscale_leggings: G('murkscale_leggings', 'Murkscale Leggings', 'legs', 2, { def: 4, res: 3, spd: 1 }, { c1: '#4a7a9a', c2: '#2a4a6a' }, 'Scales that shed water and doubt.', 52),
    sentinel_greaves:G('sentinel_greaves', 'Sentinel Greaves', 'legs', 3, { def: 7, hp: 15, spd: -1 }, { c1: '#a8b0b8', c2: '#5a6a72' }, 'Heavy stone-plate. Worth the weight.', 105),
    // feet
    featherstep_boots: G('featherstep_boots', 'Featherstep Boots', 'feet', 2, { spd: 5, def: 2 }, { c1: '#bfe8d8', c2: '#4a8a7a' }, 'You barely hear your own footsteps.', 55),
    // back
    briarweave_cloak:G('briarweave_cloak', 'Briarweave Cloak', 'back', 2, { def: 3, res: 3 }, { k: 'cape', c1: '#4a7a3a', c2: '#6fce5a' }, 'A cloak that smells of deep green woods.', 50),
    featherwind_cape:G('featherwind_cape', 'Featherwind Cape', 'back', 2, { spd: 4, res: 2 }, { k: 'cape', c1: '#9fe8d8', c2: '#e8fff8' }, 'It billows even indoors.', 52),
    stormfeather_wings: G('stormfeather_wings', 'Stormfeather Wings', 'back', 4, { spd: 8, mag: 5 }, { k: 'wings', c1: '#bfe8ff', c2: '#7fb8e8', glow: '#9fe8d8' }, 'Not for flying. For falling with style.', 210),
    vaels_mantle:   G('vaels_mantle', 'Vael\'s Mantle', 'back', 5, { def: 8, res: 8, mag: 8 }, { k: 'cape', c1: '#3a2a4a', c2: '#b48aff', glow: '#b48aff' }, 'The Ashen Hand\'s mantle. It no longer whispers. It listens.', 999),
    // neck
    dewglass_pendant:G('dewglass_pendant', 'Dewglass Pendant', 'neck', 2, { mag: 4, res: 3 }, { c1: '#7fd4ff', gem: '#bfe8ff' }, 'A dewdrop that never falls.', 48),
    wispcore_pendant:G('wispcore_pendant', 'Wispcore Pendant', 'neck', 3, { mag: 7, res: 4, ep: 8 }, { c1: '#ffe89a', gem: '#fff2b0', glow: '#fff2b0' }, 'A lantern-soul\'s last warm memory.', 105),
    pip_locket:     G('pip_locket', 'Pip\'s Locket', 'neck', 2, { hp: 10, res: 2 }, { c1: '#d8b06a', gem: '#ff9a9a' }, 'A child\'s locket. Inside: a painted sun.', 0),
    // ring
    stoneshard_ring:G('stoneshard_ring', 'Stoneshard Ring', 'ring', 2, { def: 4, atk: 2 }, { gem: '#c9a06a' }, 'A ring cut from a single pebble.', 46),
    nightfang_ring: G('nightfang_ring', 'Nightfang Ring', 'ring', 3, { mag: 5, atk: 4, spd: 2 }, { gem: '#b48aff' }, 'It bites, gently, when you sleep.', 98),
    tidal_signet:   G('tidal_signet', 'Tidal Signet', 'ring', 3, { mag: 6, ep: 10 }, { gem: '#4aa8ff' }, 'Signet of the drowned temple\'s tide-priests.', 100),
    covenant_signet:G('covenant_signet', 'Covenant Signet', 'ring', 5, { atk: 8, mag: 8, spd: 5 }, { gem: '#ff5a2e', glow: '#b48aff' }, 'The Ashen Covenant\'s mark, broken and re-bound to you.', 999),
    // trinket
    pupfang_charm:  G('pupfang_charm', 'Pupfang Charm', 'trinket', 1, { atk: 2, hp: 6 }, { k: 'charm', c1: '#e8d8c0' }, 'A milk-fang on a cord. Braver than it looks.', 16),
    gnawbone_charm: G('gnawbone_charm', 'Gnawbone Charm', 'trinket', 1, { def: 2, spd: 2 }, { k: 'charm', c1: '#d8c8a0' }, 'A gnawed bone. Oddly comforting.', 15),
    volt_charm:     G('volt_charm', 'Volt Charm', 'trinket', 2, { spd: 4, mag: 3 }, { k: 'orb', c1: '#ffd94a', glow: '#ffd94a', orbit: true }, 'A crackling bead that circles your wrist.', 54),
    hearth_lantern: G('hearth_lantern', 'Hearth Lantern', 'trinket', 3, { res: 5, ep: 12, hp: 10 }, { k: 'lantern', c1: '#ffcf8a', glow: '#ff9a5a', orbit: true }, 'A tiny hearth that follows you like a friend.', 120)
  };

  /* ---------- Consumables & quest items ---------- */
  const ITEMS = {
    salve:          { id: 'salve', name: 'Healing Salve', heal: 40, desc: 'Restores 40 HP.', val: 12, use: 'heal' },
    finesalve:      { id: 'finesalve', name: 'Fine Salve', heal: 120, desc: 'Restores 120 HP.', val: 35, use: 'heal' },
    essencedraught: { id: 'essencedraught', name: 'Essence Draught', ep: 30, desc: 'Restores 30 EP.', val: 25, use: 'ep' },
    cleansingsalt:  { id: 'cleansingsalt', name: 'Cleansing Salt', desc: 'Cures all ailments.', val: 18, use: 'cleanse' },
    wakingincense:  { id: 'wakingincense', name: 'Waking Incense', desc: 'Rouses a slumbering ally.', val: 15, use: 'wake' },
    rekindlecharm:  { id: 'rekindlecharm', name: 'Rekindle Charm', desc: 'Revives a fallen ally at half HP.', val: 60, use: 'revive' },
    bitterroot:     { id: 'bitterroot', name: 'Bitterroot', heal: 15, desc: 'A bitter herb. Heals 15 HP; Sela wants some.', val: 5, use: 'heal', quest: true },
    smokedhoney:    { id: 'smokedhoney', name: 'Smoked Honey', heal: 60, desc: 'Emberwick comfort food. Heals 60 HP.', val: 20, use: 'heal' },
    hollowkey:      { id: 'hollowkey', name: 'Hollowmere Key', desc: 'A tide-worn key. Opens the Hollowmere gate.', val: 0, use: 'none', quest: true }
  };

  /* ---------- Hero Arts learnset ---------- */
  const HERO_ARTS = [
    [1, 'emberlash'], [1, 'mend'], [3, 'guardstance'], [5, 'tidalpull'],
    [7, 'rally'], [9, 'cinderburst'], [11, 'frostmantle'], [13, 'greatmend'],
    [15, 'kindleaura'], [17, 'pyreclasm'], [19, 'cleansingwave'], [21, 'rekindle'],
    [24, 'solarlance']
  ];

  /* ---------- Quests ----------
     obj types: talk{npc} kill{sp|el,n} bind{n,unique} collect{item,n}
                reach{map,x,y} boss{flag} night{map,x,y} have{sp}
  */
  const QUESTS = {
    m1: {
      id: 'm1', name: 'The Dying Flame', kind: 'main', giver: 'maren',
      offer: [
        'Warden {name}... you felt it too, didn\'t you? The First Flame is guttering.',
        'Three nights ago the hearthshrine\'s light thinned to a thread. The Cindren — the little flame-souls — have gone quiet in their groves.',
        'Go to the Shrine Stone in the Emberwood, east of the village. Lay your hand on it. If any warmth remains, we still have time.'
      ],
      stages: [
        { txt: 'Touch the Shrine Stone in the Emberwood (east of Emberwick).', obj: { type: 'reach', map: 'emberwood', x: 47, y: 12 } }
      ],
      progress: ['The Shrine Stone stands east, past the tall grass. Follow the lantern posts.'],
      complete: [
        'You felt it — a heartbeat of warmth, faint as a moth\'s wing. The Flame lives, but barely.',
        'Then it is as the old songs warn: someone is stealing the Cindren, and the Flame dies with each one taken. You must learn to fight, and to Bind.'
      ],
      reward: { xp: 30, gold: 20, items: [['salve', 2]] }
    },
    m2: {
      id: 'm2', name: 'Iron and Ember', kind: 'main', giver: 'maren', req: 'm1',
      offer: [
        'The Ashen Covenant moves in the wood — I\'ve seen their grey cloaks between the trees.',
        'Prove yourself, Warden. Best three wild Cindren in the tall grass, then Bind one to your side. A Cindren bound by choice is worth ten taken by force.'
      ],
      stages: [
        { txt: 'Defeat 3 wild Cindren in the Emberwood.', obj: { type: 'kill', n: 3 } },
        { txt: 'Bind a wild Cindren (weaken it, then use Bind).', obj: { type: 'bind', n: 1 } }
      ],
      progress: ['The tall grass rustles with wild Cindren. Weaken them before you Bind — a proud flame will not join a weak hand.'],
      complete: [
        'You fight like the old Wardens, and your new companion\'s light is steady. Good.',
        'Take this — a Warden\'s Blade, and my blessing. Farmer Odie has been begging for help at the granary. Start there.'
      ],
      reward: { xp: 60, gold: 40, gear: ['warden_blade'], items: [['salve', 2]] }
    },
    m3: {
      id: 'm3', name: 'What Gnaws Below', kind: 'main', giver: 'odie', req: 'm2',
      offer: [
        'Warden! Thank the Flame. Something\'s in the granary cellar — big as a hound, eyes like wet stones.',
        'It\'s eaten half the winter grain and the cinders we kept for the hearth. The village starves by spring if it stays. Clear the cellar, I\'m begging you.'
      ],
      stages: [
        { txt: 'Defeat the Broodmother in the Granary Cellar.', obj: { type: 'boss', flag: 'broodmother' } }
      ],
      progress: ['The cellar hatch is beside the granary, north of my farm. Take a salve. Take two.'],
      complete: [
        'You... you actually did it. The grain\'s safe. Emberwick eats this winter because of you.',
        'Take this dirk — my grandfather\'s. And tell Elder Maren: the thing had a covenant brand burned into its hide. Grey ash, in a spiral.'
      ],
      reward: { xp: 90, gold: 60, gear: ['broodfang_dirk'], items: [['finesalve', 2]] }
    },
    m4: {
      id: 'm4', name: 'The Hollowmere Road', kind: 'main', giver: 'maren', req: 'm3',
      offer: [
        'A covenant brand on a cellar rat. They are experimenting — twisting the Cindren into weapons.',
        'Their trail leads to Hollowmere, the drowned temple south of the wood. The gate is sealed; the old tide-priests\' key was lost in the granary stores. Odie may have it.',
        'Go. Whatever they are building down there, it is eating the Flame itself.'
      ],
      stages: [
        { txt: 'Find the Hollowmere Key (search the granary cellar chests).', obj: { type: 'collect', item: 'hollowkey', n: 1 } },
        { txt: 'Open the Hollowmere gate in the south of the Emberwood.', obj: { type: 'reach', map: 'hollowmere', x: 18, y: 2 } }
      ],
      progress: ['The key lies in a granary cellar chest. The Hollowmere gate stands at the south edge of the wood, past the pond.'],
      complete: [
        'So the gate opens. The temple\'s wisps have been seen from the ridge — pale lights, mourning.',
        'Steel yourself, Warden. The Covenant\'s hand is down there.'
      ],
      reward: { xp: 120, gold: 80, items: [['finesalve', 2], ['essencedraught', 2]] }
    },
    m5: {
      id: 'm5', name: 'The Ashen Hand', kind: 'main', giver: 'maren', req: 'm4',
      offer: [
        'The scouts confirm it: Magistrate Vael himself holds the Hearthspire at the temple\'s heart.',
        'He drains the Cindren into a dead sun-god\'s idol, hoarding their light to crown himself. Every soul he takes, our Flame thins.',
        'End this, Warden. Break the Ashen Hand, and bring the dawn back to Emberwick.'
      ],
      stages: [
        { txt: 'Defeat Vael, the Ashen Hand, at the Hearthspire.', obj: { type: 'boss', flag: 'vael' } }
      ],
      progress: ['Vael waits at the Hearthspire, deep in Hollowmere. Rouse your Cindren — a Confluence may turn the tide.'],
      complete: [
        'The ash settles. The drained Cindren stream home like sparks up a chimney, and the hearthshrine\'s light stands tall again.',
        'You did what the songs will argue about for a hundred years, {name}. The Flame remembers. Emberwick remembers. Rest now — the dawn is yours.'
      ],
      reward: { xp: 300, gold: 300, gear: ['hearth_lantern'], items: [['rekindlecharm', 2]] }
    },
    s1: {
      id: 's1', name: 'Bitterroot Harvest', kind: 'side', giver: 'sela',
      offer: ['Warden! My knees say rain and my shelves say empty. Bring me 3 bitterroots — the grove Cindren drop them, or forage the herb patches.'],
      stages: [{ txt: 'Bring Sela 3 bitterroots.', obj: { type: 'collect', item: 'bitterroot', n: 3 } }],
      progress: ['Grove Cindren shed bitterroots like autumn leaves. The herb patches in the wood have some too.'],
      complete: ['Bless you! These will keep the village\'s coughs quiet all winter. Take this cloak — I woven it myself.'],
      reward: { xp: 40, gold: 30, gear: ['briarweave_cloak'], items: [['salve', 2]] }
    },
    s2: {
      id: 's2', name: 'A Scholar\'s Plea', kind: 'side', giver: 'ivo',
      offer: ['The Cindren are the Flame\'s own memory, Warden. I must study them — gently! Bind 3 different kinds and show me their lights. No harm, I swear it.'],
      stages: [{ txt: 'Bind 3 different species of Cindren.', obj: { type: 'bind', n: 3, unique: true } }],
      progress: ['Different kinds, mind you — a pup and a hound are one light, grown. The wood holds many.'],
      complete: ['Remarkable! Each one hums a different note of the same chord. Here — my tide-glass pendant. It listens to water, and now to you.'],
      reward: { xp: 70, gold: 50, gear: ['dewglass_pendant'], items: [['essencedraught', 2]] }
    },
    s3: {
      id: 's3', name: 'Pip\'s Lost Locket', kind: 'side', giver: 'pip',
      offer: ['Warden!! I lost my locket in the Emberwood — the one with the painted sun! Mama says it\'s just a thing but it\'s NOT, it\'s my sun, please find it!'],
      stages: [{ txt: 'Find Pip\'s locket in the Emberwood (check the old stump).', obj: { type: 'collect', item: 'pip_locket', n: 1 } }],
      progress: ['I was playing by the hollow stump near the pond! The one with the face carved in it!'],
      complete: ['MY SUN!! You found it!! Here — you can borrow it forever. Mama says sharing is the biggest magic.'],
      reward: { xp: 35, gold: 15, gear: ['pip_locket'] }
    },
    s4: {
      id: 's4', name: 'The Smith\'s Test', kind: 'side', giver: 'brokk',
      offer: ['Hah! Another Warden with soft hands. Prove the order still means something: best 5 Cindren in the wild, then come back and I\'ll forge you proper steel.'],
      stages: [{ txt: 'Defeat 5 wild Cindren.', obj: { type: 'kill', n: 5 } }],
      progress: ['Five! Not four, not "mostly five". The anvil knows the difference.'],
      complete: ['...Hah. HAH! The order lives! Take these pauldrons — ember-quenched, my best work. And my forge is open to you, always.'],
      reward: { xp: 60, gold: 45, gear: ['ember_pauldrons'] }
    },
    s5: {
      id: 's5', name: 'The Night Lights', kind: 'side', giver: 'rosa',
      offer: ['The fireflies still gather at the pond\'s north shore after dark, Warden. See them for me — my legs won\'t make the walk anymore. Tell me they still dance.'],
      stages: [{ txt: 'Visit the firefly shore at the pond\'s north edge at night.', obj: { type: 'night', map: 'emberwood', x: 27, y: 20 } }],
      progress: ['After sundown, dear. The north shore of the pond — you\'ll know it by the lights.'],
      complete: ['They still dance... oh, thank you. Some things the dimming can\'t take. Take my hearth-lantern recipe\'s first fruit — and a warm meal, on the house, always.'],
      reward: { xp: 50, gold: 35, items: [['smokedhoney', 3], ['finesalve', 1]] }
    },
    s6: {
      id: 's6', name: 'Tor\'s Trial', kind: 'side', giver: 'tor',
      offer: ['Guard\'s work is mostly boredom, Warden, but the wood\'s gone dangerous. Win 3 battles out there and I\'ll know the village sleeps safe. Then we talk armor.'],
      stages: [{ txt: 'Win 3 battles in the wild.', obj: { type: 'kill', n: 3, battles: true } }],
      progress: ['Three clean wins. The gate watch sees everything, Warden. Everything.'],
      complete: ['Three wins, clean as a whistle. The village sleeps safe. These greaves are yours — sentinel-make, from the old temple watch.'],
      reward: { xp: 55, gold: 40, gear: ['sentinel_greaves'] }
    },
    s7: {
      id: 's7', name: 'Ember for the Hearth', kind: 'side', giver: 'rosa', req: 'm2',
      offer: ['The inn\'s hearth has been cold since the dimming, Warden. A bonded Ember Cindren could wake it — a Cindpup or Emberhound, if you have one. May I ask?'],
      stages: [{ txt: 'Bring a bonded Cindpup or Emberhound to Rosa.', obj: { type: 'have', sp: ['cindpup', 'emberhound'] } }],
      progress: ['A little ember-soul, bonded and willing. The hearth misses its friends.'],
      complete: ['Oh... oh, look at it. The hearth\'s singing again. The whole room\'s warm. Take this, Warden — the inn\'s first rekindled bread, and my deepest thanks.'],
      reward: { xp: 45, gold: 30, items: [['smokedhoney', 2], ['essencedraught', 1]] }
    }
  };

  /* ---------- NPCs ---------- */
  const NPCS = {
    maren: { id: 'maren', name: 'Elder Maren', look: { skin: 3, hair: 4, hairColor: 7, tunic: 1, tunicColor: 4, trim: 7, pants: 2, cape: 1, capeColor: 4, accessory: 0 }, lines: ['The Flame thins, Warden. But while one Warden stands, it does not die.'] },
    brokk: { id: 'brokk', name: 'Brokk the Smith', look: { skin: 1, hair: 1, hairColor: 0, tunic: 0, tunicColor: 6, trim: 1, pants: 0, accessory: 0 }, lines: ['The forge doesn\'t lie, Warden. Steel tells you exactly what it thinks of you.'], shop: 'brokk' },
    sela:  { id: 'sela', name: 'Sela the Herbalist', look: { skin: 2, hair: 3, hairColor: 3, tunic: 1, tunicColor: 2, trim: 5, pants: 1, accessory: 3 }, lines: ['Every herb is a small kindness, Warden. Remember that when the world gets loud.'], shop: 'sela' },
    ivo:   { id: 'ivo', name: 'Ivo the Scholar', look: { skin: 0, hair: 2, hairColor: 1, tunic: 1, tunicColor: 5, trim: 6, pants: 3, accessory: 2 }, lines: ['The Cindren hum in chords, Warden. Chords! The Flame is not fire — it is music.'] },
    pip:   { id: 'pip', name: 'Pip', look: { skin: 2, hair: 0, hairColor: 2, tunic: 0, tunicColor: 3, trim: 0, pants: 2, accessory: 0 }, lines: ['When I grow up I\'m gonna Bind a WHOLE sky of Cindren. A sky!!'] },
    rosa:  { id: 'rosa', name: 'Rosa the Innkeeper', look: { skin: 1, hair: 5, hairColor: 4, tunic: 1, tunicColor: 0, trim: 3, pants: 1, accessory: 1 }, lines: ['A warm bed and a warmer hearth, Warden. Rest here — the inn remembers its Wardens.'], rest: true },
    tor:   { id: 'tor', name: 'Guard Tor', look: { skin: 3, hair: 1, hairColor: 0, tunic: 2, tunicColor: 7, trim: 6, pants: 0, accessory: 0 }, lines: ['Gate\'s watched, Warden. Wood\'s not. That\'s your department.'] },
    odie:  { id: 'odie', name: 'Farmer Odie', look: { skin: 1, hair: 0, hairColor: 5, tunic: 0, tunicColor: 5, trim: 2, pants: 2, accessory: 0 }, lines: ['Grain\'s the real magic, Warden. No grain, no heroes.'] },
    mirror:{ id: 'mirror', name: 'Warden\'s Mirror', look: null, lines: ['The old glass shows who you are — and who you could be. (Change your appearance.)'], mirror: true }
  };

  const SHOPS = {
    brokk: { name: 'Brokk\'s Forge', stock: ['warden_blade', 'leather_cap', 'linen_tunic', 'rathide_vest', 'ward_charm', 'cinder_belt'] },
    sela:  { name: 'Sela\'s Remedies', stock: ['salve', 'finesalve', 'essencedraught', 'cleansingsalt', 'wakingincense', 'rekindlecharm', 'smokedhoney'] }
  };

  const STARTERS = ['cindpup', 'dewbit', 'sproutle'];

  return { EL, elMod, STATUS, MOVES, SPECIES, GEAR, ITEMS, RARITY, HERO_ARTS, QUESTS, NPCS, SHOPS, STARTERS };
})();
