/* ============================================================
   CINDERWARD — data2.js  (Chapter 2: The Ashen Crown)
   Extends SB.DATA: new Cindren, gear, items, moves, quests,
   NPCs, shops. All original. Loaded after data.js.
   ============================================================ */
(function () {
  'use strict';
  const D = SB.DATA;
  const M = (id, name, el, kind, pow, cost, acc, tgt, desc, extra) =>
    Object.assign({ id, name, el, kind, pow, cost, acc, tgt, desc }, extra || {});

  /* ---------- new moves ---------- */
  Object.assign(D.MOVES, {
    ashcloud:   M('ashcloud', 'Ash Cloud', 'ember', 'art', 60, 7, 95, 'foes', 'A choking cloud of hot ash.', { st: { id: 'scorch', ch: 0.2 } }),
    magmaerupt: M('magmaerupt', 'Magma Erupt', 'ember', 'art', 105, 15, 90, 'foes', 'The ground bursts into lava.', { st: { id: 'scorch', ch: 0.3 } }),
    dunesurge:  M('dunesurge', 'Dune Surge', 'stone', 'art', 70, 8, 95, 'foe', 'A crushing wave of sand.'),
    gravewind:  M('gravewind', 'Grave Wind', 'umbra', 'art', 72, 8, 95, 'foe', 'A wind that smells of tombs.', { st: { id: 'slumber', ch: 0.15 } }),
    blightcloud:M('blightcloud', 'Blight Cloud', 'umbra', 'art', 62, 7, 95, 'foes', 'A spreading miasma.', { st: { id: 'blight', ch: 0.3 } }),
    voltstorm:  M('voltstorm', 'Volt Storm', 'spark', 'art', 88, 12, 90, 'foes', 'A storm of lashing bolts.', { st: { id: 'static', ch: 0.25 } }),
    sunflare:   M('sunflare', 'Sun Flare', 'lumen', 'art', 100, 15, 90, 'foes', 'A blinding flare of dawn.'),
    mothdust:   M('mothdust', 'Moth Dust', 'lumen', 'heal', 55, 8, 100, 'allies', 'Soothing scales mend the party.'),
    deadsun:    M('deadsun', 'Dead Sun', 'lumen', 'art', 100, 0, 90, 'foes', 'The light of a sun that died.', { st: { id: 'scorch', ch: 0.3 } }),
    greyblade:  M('greyblade', 'Grey Blade', 'umbra', 'phys', 95, 0, 95, 'foe', 'A sword-cut of covenant ash.'),
    crownfire:  M('crownfire', 'Crown Fire', 'ember', 'art', 115, 0, 90, 'foes', 'Fire shaped like a crown.')
  });

  /* ---------- new Cindren ---------- */
  Object.assign(D.SPECIES, {
    ashkit: {
      id: 'ashkit', name: 'Ashkit', el: 'ember', spr: 'ashkit',
      base: { hp: 36, atk: 14, def: 10, mag: 14, res: 10, spd: 14 },
      learn: [[1, 'strike'], [1, 'emberlash'], [7, 'swiftjab'], [12, 'ashcloud'], [16, 'cinderburst']],
      loot: [['ashstriders', 0.16], ['ashcore', 0.14], ['salve', 0.3]],
      bind: 0.5, xp: 24, evo: { lvl: 18, into: 'ashjackal' },
      desc: 'A fox-kit born in the ash-drifts. It sneezes sparks and trusts no one quickly.'
    },
    ashjackal: {
      id: 'ashjackal', name: 'Ashjackal', el: 'ember', spr: 'ashjackal',
      base: { hp: 56, atk: 21, def: 15, mag: 20, res: 15, spd: 19 },
      learn: [[1, 'rend'], [1, 'ashcloud'], [19, 'kindleaura'], [23, 'magmaerupt']],
      loot: [['ashjackal_plate', 0.15], ['cinderbrand', 0.1], ['finesalve', 0.25]],
      bind: 0.28, xp: 52,
      desc: 'An ashjackal whose fur smolders like banked coals. It hunts the blight by scent.'
    },
    dunepup: {
      id: 'dunepup', name: 'Dunepup', el: 'stone', spr: 'dunepup',
      base: { hp: 42, atk: 13, def: 16, mag: 9, res: 13, spd: 9 },
      learn: [[1, 'strike'], [1, 'pebbleshot'], [8, 'bulwark'], [13, 'dunesurge']],
      loot: [['dunerekk_greaves', 0.12], ['stoneshard_ring', 0.15], ['salve', 0.25]],
      bind: 0.5, xp: 25, evo: { lvl: 18, into: 'dunerekk' },
      desc: 'A pup of living sandstone. It burrows when frightened and leaves small glass flowers.'
    },
    dunerekk: {
      id: 'dunerekk', name: 'Dunerekk', el: 'stone', spr: 'dunerekk',
      base: { hp: 64, atk: 20, def: 24, mag: 13, res: 19, spd: 11 },
      learn: [[1, 'crush'], [1, 'dunesurge'], [20, 'bulwark'], [24, 'quakefall']],
      loot: [['dunerekk_pauldrons', 0.15], ['pebble_plate', 0.12], ['finesalve', 0.25]],
      bind: 0.25, xp: 56,
      desc: 'A dune-beast of stacked stone. Caravans follow it because it always finds water.'
    },
    cindervolt: {
      id: 'cindervolt', name: 'Cindervolt', el: 'spark', spr: 'cindervolt',
      base: { hp: 44, atk: 17, def: 12, mag: 20, res: 13, spd: 20 },
      learn: [[1, 'zapdart'], [1, 'swiftjab'], [14, 'stormcall'], [19, 'voltstorm']],
      loot: [['cindervolt_grips', 0.16], ['volt_charm', 0.14], ['essencedraught', 0.3]],
      bind: 0.32, xp: 48,
      desc: 'A hare of crackling cinder-light. It runs so fast it leaves afterimages of flame.'
    },
    blightwing: {
      id: 'blightwing', name: 'Blightwing', el: 'umbra', spr: 'blightwing',
      base: { hp: 46, atk: 16, def: 12, mag: 18, res: 13, spd: 16 },
      learn: [[1, 'nightfang'], [1, 'veilgloom'], [13, 'blightcloud'], [18, 'gravewind']],
      loot: [['blightwing_shroud', 0.16], ['nightfang_ring', 0.13], ['essencedraught', 0.25]],
      bind: 0.35, xp: 46,
      desc: 'A bat-winged sprite woven from the Scorchlands blight. It mourns the green it lost.'
    },
    solmoth: {
      id: 'solmoth', name: 'Solmoth', el: 'lumen', spr: 'solmoth',
      base: { hp: 42, atk: 9, def: 12, mag: 22, res: 18, spd: 14 },
      learn: [[1, 'glimmer'], [1, 'mend'], [12, 'mothdust'], [17, 'dawnward'], [21, 'sunflare']],
      loot: [['solmoth_circlet', 0.15], ['solmoth_wings', 0.12], ['essencedraught', 0.3]],
      bind: 0.3, xp: 54,
      desc: 'A dawn-moth that survived the dimming. Its wings hold the last memory of full sunlight.'
    },
    magmaw: {
      id: 'magmaw', name: 'Magmaw', el: 'ember', spr: 'magmaw',
      base: { hp: 70, atk: 25, def: 19, mag: 22, res: 17, spd: 13 },
      learn: [[1, 'rend'], [1, 'cinderburst'], [20, 'magmaerupt'], [24, 'soulcinder']],
      loot: [['magmaw_plate', 0.14], ['ember_cincture', 0.12], ['finesalve', 0.3]],
      bind: 0.18, xp: 68,
      desc: 'A furnace-beast that drank a lava vein. The ground cools where it sleeps.'
    },
    kael: {
      id: 'kael', name: 'Kael, the Grey Blade', el: 'umbra', spr: 'kael', boss: true,
      base: { hp: 140, atk: 26, def: 20, mag: 22, res: 18, spd: 19 },
      learn: [[1, 'greyblade'], [1, 'gravewind'], [1, 'eclipse'], [1, 'veilgloom'], [1, 'rend']],
      loot: [['greyblade', 1], ['grey_signet', 1], ['gravekey', 1]],
      bind: 0, xp: 260,
      desc: 'The Covenant\'s lieutenant, who carries the grave-key. His blade remembers every Warden it has broken.'
    },
    morvane: {
      id: 'morvane', name: 'Morvane, the Dead Sun', el: 'lumen', spr: 'morvane', boss: true,
      base: { hp: 200, atk: 28, def: 22, mag: 30, res: 24, spd: 15 },
      learn: [[1, 'deadsun'], [1, 'sunflare'], [1, 'crownfire'], [1, 'eclipse'], [1, 'hollowgaze']],
      loot: [['sunspear', 1], ['deadsun_pendant', 1], ['ashcrown', 1]],
      bind: 0, xp: 600,
      desc: 'A sun-god that died before the first dawn, now stirred by stolen Cindren light. It does not want to live. It wants everything else to stop.'
    }
  });

  /* ---------- new gear ---------- */
  const G = (id, name, slot, rar, st, vis, desc, val) =>
    ({ id, name, slot, rar, st, vis, desc, val: val || 10, gear: true });
  Object.assign(D.GEAR, {
    greyblade:      G('greyblade', 'Grey Blade', 'weapon', 4, { atk: 15, spd: 5 }, { k: 'sword', c1: '#b8b8c8', c2: '#3a3a45', glow: '#b48aff' }, 'Kael\'s ash-steel blade. It hums a funeral note.', 260),
    sunspear:       G('sunspear', 'Sunspear', 'weapon', 5, { atk: 16, mag: 14 }, { k: 'staff', c1: '#ffe89a', c2: '#c8a03a', glow: '#fff2b0' }, 'A spear of captured dawn, taken from a dead god\'s heart.', 999),
    ashward:        G('ashward', 'Ashward', 'offhand', 3, { def: 7, res: 5 }, { k: 'shield', c1: '#8a7a6a', c2: '#5a4a3a' }, 'A shield of packed ash that never scatters.', 110),
    ashcrown:       G('ashcrown', 'Ashen Crown', 'head', 5, { def: 8, mag: 10, res: 6 }, { k: 'circlet', c1: '#ff9a5a', c2: '#5a2a14', glow: '#ffd94a' }, 'The crown the Covenant sought. It chooses its wearer now.', 999),
    solmoth_circlet:G('solmoth_circlet', 'Solmoth Circlet', 'head', 4, { mag: 9, res: 5, ep: 10 }, { k: 'circlet', c1: '#fff2b0', c2: '#c8a03a', glow: '#ffffff' }, 'A ring of dawn-moth wings that never dim.', 210),
    dunerekk_pauldrons: G('dunerekk_pauldrons', 'Dunerekk Pauldrons', 'shoulders', 4, { def: 9, hp: 20 }, { k: 'pauldrons', c1: '#c9a06a', c2: '#8a6a3a' }, 'Shoulder-stones worn smooth by a thousand dunes.', 200),
    ashjackal_plate:G('ashjackal_plate', 'Ashjackal Plate', 'chest', 4, { def: 11, hp: 24, atk: 4 }, { k: 'plate', c1: '#c87a4a', c2: '#5a2a14', glow: '#ff7a3c' }, 'Plate that smolders faintly, warm as a living hearth.', 230),
    magmaw_plate:   G('magmaw_plate', 'Magmaw Plate', 'chest', 5, { def: 14, hp: 34, atk: 6 }, { k: 'plate', c1: '#ff7a3c', c2: '#5a1a0a', glow: '#ffd94a' }, 'Forged in a Magmaw\'s throat. Rivers of light run through it.', 999),
    cindervolt_grips:G('cindervolt_grips', 'Cindervolt Grips', 'hands', 3, { atk: 5, mag: 5, spd: 4 }, { c1: '#ffd94a', c2: '#8a7a2a' }, 'Gloves that crackle with each heartbeat.', 105),
    ember_cincture: G('ember_cincture', 'Ember Cincture', 'waist', 3, { def: 5, hp: 16, mag: 3 }, { c1: '#7a3a1a', c2: '#ff9a5a' }, 'A belt whose buckle is a never-cooling coal.', 100),
    dunerekk_greaves:G('dunerekk_greaves', 'Dunerekk Greaves', 'legs', 3, { def: 8, hp: 16, spd: 1 }, { c1: '#c9a06a', c2: '#8a6a3a' }, 'Sandstone greaves. Heavy, patient, unbreakable.', 105),
    ashstriders:    G('ashstriders', 'Ashstriders', 'feet', 3, { spd: 7, def: 3 }, { c1: '#8a7a6a', c2: '#5a4a3a' }, 'Boots that leave no footprint in the ash.', 100),
    blightwing_shroud:G('blightwing_shroud', 'Blightwing Shroud', 'back', 4, { res: 8, spd: 5, mag: 4 }, { k: 'cape', c1: '#4a3a5a', c2: '#b48aff', glow: '#b48aff' }, 'A shroud of woven blight, turned against the dark.', 210),
    solmoth_wings:  G('solmoth_wings', 'Solmoth Wings', 'back', 5, { spd: 9, mag: 8, res: 4 }, { k: 'wings', c1: '#fff2b0', c2: '#ffe89a', glow: '#ffffff' }, 'Dawn-moth wings. They remember how to fly toward the sun.', 999),
    deadsun_pendant:G('deadsun_pendant', 'Deadsun Pendant', 'neck', 5, { mag: 12, res: 8, ep: 16 }, { c1: '#c8a03a', gem: '#fff2b0', glow: '#ffffff' }, 'A shard of the dead sun, now warm again because of you.', 999),
    grey_signet:    G('grey_signet', 'Grey Signet', 'ring', 4, { atk: 7, mag: 7, spd: 3 }, { gem: '#b8b8c8', glow: '#b48aff' }, 'The Covenant\'s signet, its ash-grey oath broken.', 220),
    ashcore:        G('ashcore', 'Ashcore', 'trinket', 3, { atk: 4, mag: 4, hp: 10 }, { k: 'orb', c1: '#ff9a5a', glow: '#ff7a3c', orbit: true }, 'A coal-heart that circles you like a loyal spark.', 110),
    sunmote:        G('sunmote', 'Sunmote', 'trinket', 4, { mag: 7, ep: 12, res: 3 }, { k: 'lantern', c1: '#fff2b0', glow: '#ffd94a', orbit: true }, 'A mote of the First Flame, freely given.', 200)
  });

  /* ---------- new items ---------- */
  Object.assign(D.ITEMS, {
    sunkey:    { id: 'sunkey', name: 'Sunkey', desc: 'A key of warm brass. Opens the east gate to the Scorchlands.', val: 0, use: 'none', quest: true },
    gravekey:  { id: 'gravekey', name: 'Grave Key', desc: 'A key of cold bone. Opens the Sun\'s Grave.', val: 0, use: 'none', quest: true },
    ashbloom:  { id: 'ashbloom', name: 'Ashbloom', heal: 25, desc: 'A flower that grows in ash. Heals 25 HP; Mara wants some.', val: 8, use: 'heal', quest: true },
    greaterdraught: { id: 'greaterdraught', name: 'Greater Draught', ep: 60, desc: 'Restores 60 EP.', val: 55, use: 'ep' }
  });

  /* ---------- higher hero arts ---------- */
  D.HERO_ARTS.push([27, 'tempestroar'], [30, 'eclipse'], [33, 'sunflare']);

  /* ---------- bridge chapter 1 -> 2: sunkey from m5 ---------- */
  D.QUESTS.m5.reward.items.push(['sunkey', 1]);

  /* ---------- Chapter 2 main quests ---------- */
  Object.assign(D.QUESTS, {
    m6: {
      id: 'm6', name: 'Beyond the Wood', kind: 'main', giver: 'maren', req: 'm5',
      offer: [
        'Vael was only a hand, {name}. The head still lives: Hierophant Malachar, who fled east with the last stolen Cindren.',
        'Beyond the Emberwood lie the Scorchlands — a region the Covenant\'s ritual already blighted. There, at the Sun\'s Grave, Malachar means to wake Morvane, a sun-god that died before the first dawn.',
        'Take the Sunkey. Go east. If Morvane wakes, no flame — not ours, not any — will ever burn again.'
      ],
      stages: [{ txt: 'Pass the east gate into the Scorchlands.', obj: { type: 'reach', map: 'scorchlands', x: 2, y: 24 } }],
      progress: ['The east gate of the Emberwood opens with the Sunkey. The Scorchlands lie beyond.'],
      complete: ['You\'ve crossed into the ash. The sky here is the color of a bruise, and the Cindren that remain are flickering, frightened.', 'Find Duskhaven — the last refuge. Its elder, Vex, has been waiting for a Warden.'],
      reward: { xp: 150, gold: 100, items: [['finesalve', 2], ['greaterdraught', 1]] }
    },
    m7: {
      id: 'm7', name: 'Duskhaven\'s Plea', kind: 'main', giver: 'vex', req: 'm6',
      offer: [
        'A Warden, at last. The blight creeps closer each night — it is the Covenant\'s doing, a wound in the land that will not close.',
        'Blightwings carry the miasma on their wings. Cull three of them and the shrine\'s light will hold a little longer. Please.'
      ],
      stages: [{ txt: 'Defeat 3 Blightwings in the Scorchlands.', obj: { type: 'kill', sp: 'blightwing', n: 3 } }],
      progress: ['Blightwings roost in the blighted patches, south and east. Their wings drip the miasma.'],
      complete: ['The shrine breathes again. You\'ve bought us time, Warden — but time is all the Covenant wants to spend.', 'Their lieutenant, Kael the Grey Blade, camps at the bone-field. He carries the key to the Sun\'s Grave. End him, and take it.'],
      reward: { xp: 180, gold: 120, gear: ['ashward'], items: [['finesalve', 2]] }
    },
    m8: {
      id: 'm8', name: 'The Grey Blade', kind: 'main', giver: 'vex', req: 'm7',
      offer: ['Kael has broken three Wardens before you. His blade is grey ash-steel, and his heart is greyer.', 'He camps at the bone-field in the north Scorchlands. Take the Grave Key from him. We cannot reach the Sun\'s Grave without it.'],
      stages: [{ txt: 'Defeat Kael, the Grey Blade, at the bone-field.', obj: { type: 'boss', flag: 'kael' } }],
      progress: ['Kael waits at the bone-field, north of the ash-drifts. Rouse your strongest Cindren.'],
      complete: ['Kael kneels, his grey blade dim. "The Hierophant... is already inside," he whispers. "The dead sun is dreaming of waking."', 'You have the Grave Key. The Sun\'s Grave opens at the south of the Scorchlands. Go, Warden — before the dream becomes a dawn.'],
      reward: { xp: 220, gold: 150, gear: ['grey_signet'], items: [['greaterdraught', 2]] }
    },
    m9: {
      id: 'm9', name: 'The Sun\'s Grave', kind: 'main', giver: 'vex', req: 'm8',
      offer: ['The Sun\'s Grave is a tomb older than the First Flame. Morvane lies there — a sun that died, wrapped in the Covenant\'s stolen light.', 'Open the grave-gate at the south of the Scorchlands with the Grave Key. Descend. Whatever you find, do not let it finish waking.'],
      stages: [
        { txt: 'Open the grave-gate and enter the Sun\'s Grave.', obj: { type: 'reach', map: 'sunsgrave', x: 19, y: 2 } }
      ],
      progress: ['The grave-gate stands at the south edge of the Scorchlands. The Grave Key will open it.'],
      complete: ['You\'ve stepped into the dark of a dead sun. The air hums with stolen Cindren light, and something vast turns in its sleep.', 'Malachar is at the heart, feeding the last stolen flames to the idol. Stop him — and whatever wakes in his place.'],
      reward: { xp: 250, gold: 180, items: [['finesalve', 3], ['rekindlecharm', 2]] }
    },
    m10: {
      id: 'm10', name: 'The Ashen Crown', kind: 'main', giver: 'vex', req: 'm9',
      offer: ['This is the end of the road, Warden. Morvane does not want to live — it wants everything else to stop. The Covenant only lit the match.', 'Break the ritual. Free the stolen Cindren. And if the dead sun opens its eyes... put it back to sleep. Gently, if you can.'],
      stages: [{ txt: 'Defeat Morvane, the Dead Sun, at the heart of the grave.', obj: { type: 'boss', flag: 'morvane' } }],
      progress: ['Morvane stirs at the heart of the Sun\'s Grave. Every Cindren you\'ve bonded will feel this. Make them count.'],
      complete: ['The dead sun sighs, and its stolen light streams home — a river of Cindren rising through the grave, through the ash, into a sky that remembers blue.', 'The blight recedes like a tide. Somewhere, a green thing pushes up through the ash. The First Flame stands tall. You did not just save it, {name}. You gave it back its future.'],
      reward: { xp: 500, gold: 500, gear: ['sunmote'], items: [['rekindlecharm', 3]] }
    },
    /* ---------- Chapter 2 side quests ---------- */
    s8: {
      id: 's8', name: 'Ashbloom Harvest', kind: 'side', giver: 'mara',
      offer: ['Ashblooms grow where the blight has been beaten back — little defiant flowers. Bring me 3; I\'ll brew something that keeps the cough out of Duskhaven\'s children.'],
      stages: [{ txt: 'Bring Mara 3 Ashblooms.', obj: { type: 'collect', item: 'ashbloom', n: 3 } }],
      progress: ['Ashblooms dot the ash-drifts, and some Cindren shed them. Look for the pale petals.'],
      complete: ['Bless you. These will keep the little ones breathing easy. Take these boots — ash-woven, light as a whisper.'],
      reward: { xp: 90, gold: 60, gear: ['ashstriders'], items: [['finesalve', 2]] }
    },
    s9: {
      id: 's9', name: 'The Lost Caravan', kind: 'side', giver: 'bram',
      offer: ['Dunepups raided my caravan — scattered the goods across the dunes. They\'re not evil, just hungry and scared. Drive off 4 of them and I\'ll recover what\'s mine.'],
      stages: [{ txt: 'Defeat 4 Dunepups (or Dunerekks).', obj: { type: 'kill', sp: 'dunepup', n: 4 } }],
      progress: ['The dunepups burrow in the ash-drifts east of town. Four should scatter the rest.'],
      complete: ['The caravan\'s safe. You\'ve got a caravaneer\'s thanks, Warden — and this belt. Coal-buckle, keeps the cold out.'],
      reward: { xp: 100, gold: 70, gear: ['ember_cincture'] }
    },
    s10: {
      id: 's10', name: 'Embers of the Dead', kind: 'side', giver: 'oren',
      offer: ['The Scorchlands Cindren are dying out, Warden. I must record them before they\'re gone. Bind 2 different kinds of the ash-born and let me study their light. Gently, I swear.'],
      stages: [{ txt: 'Bind 2 different Scorchlands Cindren species.', obj: { type: 'bind', n: 2, unique: true } }],
      progress: ['Any two different ash-born kinds — ashkit, dunepup, cindervolt, blightwing, solmoth. Their lights are fading.'],
      complete: ['Recorded. Each one a verse of a song the world almost lost. Take this charm — an ashcore, a coal-heart that will not go out.'],
      reward: { xp: 120, gold: 80, gear: ['ashcore'], items: [['greaterdraught', 1]] }
    },
    s11: {
      id: 's11', name: 'Light the Beacon', kind: 'side', giver: 'vex',
      offer: ['The old beacon on the north ridge still works, but only a Warden\'s hand can light it after dark. Kindling it tells the scattered refugees that Duskhaven still stands. Go at night.'],
      stages: [{ txt: 'Light the beacon on the north ridge at night.', obj: { type: 'night', map: 'scorchlands', x: 44, y: 8 } }],
      progress: ['The beacon stands on the north ridge. After sundown, lay your hand on it.'],
      complete: ['The beacon burns. Out in the ash, a dozen small lights answer — refugees, coming home. You\'ve given them a direction, Warden.'],
      reward: { xp: 110, gold: 70, items: [['finesalve', 2], ['greaterdraught', 1]] }
    },
    s12: {
      id: 's12', name: 'The Smith\'s Last Forge', kind: 'side', giver: 'garr',
      offer: ['My forge is the last in the Scorchlands, and I\'ll not let it die quiet. Prove the ash hasn\'t beaten us — best 6 Cindren in the wild, and I\'ll forge you something worth the heat.'],
      stages: [{ txt: 'Defeat 6 wild Cindren.', obj: { type: 'kill', n: 6 } }],
      progress: ['Six. The forge counts every one, Warden. Come back when the anvil\'s heard enough.'],
      complete: ['...The ash hasn\'t won. Not while Wardens like you breathe. Take these grips — cinder-volt woven, my finest work. The forge lives.'],
      reward: { xp: 130, gold: 90, gear: ['cindervolt_grips'] }
    }
  });

  /* ---------- new NPCs ---------- */
  Object.assign(D.NPCS, {
    vex:  { id: 'vex', name: 'Elder Vex', look: { skin: 4, hair: 4, hairColor: 4, tunic: 1, tunicColor: 7, trim: 3, pants: 0, cape: 1, capeColor: 7, accessory: 0 }, lines: ['Duskhaven stands because its people refuse to kneel. Keep that refusal burning, Warden.'] },
    mara: { id: 'mara', name: 'Mara the Herbalist', look: { skin: 3, hair: 3, hairColor: 3, tunic: 1, tunicColor: 2, trim: 5, pants: 1, accessory: 3 }, lines: ['Even ash grows flowers, Warden. Remember that when the world looks dead.'], shop: 'mara' },
    bram: { id: 'bram', name: 'Bram the Caravaneer', look: { skin: 1, hair: 1, hairColor: 5, tunic: 0, tunicColor: 5, trim: 2, pants: 2, accessory: 0 }, lines: ['The dunes take the careless and keep the careful. Be careful, Warden.'] },
    oren: { id: 'oren', name: 'Oren the Scholar', look: { skin: 0, hair: 2, hairColor: 1, tunic: 1, tunicColor: 5, trim: 6, pants: 3, accessory: 2 }, lines: ['Every Cindren is a memory of light. Lose them, and the world forgets how to shine.'] },
    garr: { id: 'garr', name: 'Garr the Smith', look: { skin: 2, hair: 1, hairColor: 0, tunic: 0, tunicColor: 6, trim: 1, pants: 0, accessory: 0 }, lines: ['The last forge in the Scorchlands, Warden. I\'ll keep it hot till the sun comes back.'], shop: 'garr' },
    sula: { id: 'sula', name: 'Sula the Innkeeper', look: { skin: 2, hair: 5, hairColor: 4, tunic: 1, tunicColor: 0, trim: 3, pants: 1, accessory: 1 }, lines: ['A warm bed at the edge of the world, Warden. Rest. The ash can wait.'], rest: true }
  });

  /* ---------- new shops ---------- */
  Object.assign(D.SHOPS, {
    mara: { name: 'Mara\'s Remedies', stock: ['salve', 'finesalve', 'greaterdraught', 'cleansingsalt', 'wakingincense', 'rekindlecharm', 'ashbloom'] },
    garr: { name: 'Garr\'s Last Forge', stock: ['greyblade', 'ashward', 'ashjackal_plate', 'dunerekk_greaves', 'ember_cincture', 'ashstriders'] }
  });
})();
