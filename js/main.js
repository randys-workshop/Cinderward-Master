/* ============================================================
   CINDERWARD — main.js
   Game state, stats, quest engine, save/load, interactions,
   encounters, boot. Wires all modules.
   ============================================================ */
window.SB = window.SB || {};

SB.MAIN = (function () {
  'use strict';
  const D = SB.DATA, W = SB.WORLD, SPR = SB.SPR, ENG = SB.ENGINE, UI = SB.UI;
  const SAVEKEY = 'cinderward.v1.';
  let uidC = 1;

  /* ---------------- state ---------------- */
  function freshState() {
    return {
      mode: 'title', map: 'emberwick', x: 20, y: 18, dir: 0,
      moving: false, moveT: 0, fx: 0, fy: 0, tx: 0, ty: 0, walkFrame: 0,
      time: 480, playtime: 0,
      hero: { name: 'Warden', look: {}, level: 1, xp: 0, hp: 38, ep: 13, gear: {}, hidden: {}, gold: 30 },
      party: [], bag: {}, quests: {}, flags: {}, tracked: null, codex: {},
      settings: { textSpeed: 1, music: true, sfx: true }
    };
  }

  /* ---------------- stats ---------------- */
  function gearSum(stat) {
    let s = 0;
    for (const slot in SB.G.hero.gear) { const id = SB.G.hero.gear[slot]; if (id && D.GEAR[id] && D.GEAR[id].st[stat]) s += D.GEAR[id].st[stat]; }
    return s;
  }
  function bondedAura() {
    const a = { hp: 0, atk: 0, def: 0, mag: 0, res: 0, spd: 0 };
    for (let i = 0; i < 3 && i < SB.G.party.length; i++) {
      const b = SB.G.party[i];
      if (b.state !== 'bonded' || b.hp <= 0) continue;
      const st = beastStats(b);
      for (const k in a) a[k] += Math.floor(st[k === 'hp' ? 'maxHp' : k] * 0.12);
    }
    return a;
  }
  function heroStats() {
    const h = SB.G.hero, l = h.level, a = bondedAura();
    return {
      maxHp: 30 + l * 8 + gearSum('hp') + a.hp,
      maxEp: 10 + l * 3 + gearSum('ep'),
      atk: 6 + l * 2 + gearSum('atk') + a.atk,
      def: 5 + Math.floor(l * 1.5) + gearSum('def') + a.def,
      mag: 6 + l * 2 + gearSum('mag') + a.mag,
      res: 5 + Math.floor(l * 1.5) + gearSum('res') + a.res,
      spd: 5 + Math.floor(l * 1.5) + gearSum('spd') + a.spd
    };
  }
  function beastStats(inst) {
    const b = D.SPECIES[inst.sp].base, l = inst.level;
    const f = 1 + (l - 1) * 0.09;
    return {
      maxHp: Math.floor(b.hp * (1 + (l - 1) * 0.12)) + l * 2,
      atk: Math.floor(b.atk * f), def: Math.floor(b.def * f),
      mag: Math.floor(b.mag * f), res: Math.floor(b.res * f), spd: Math.floor(b.spd * f)
    };
  }
  function clampHero() { const st = heroStats(); SB.G.hero.hp = Math.min(SB.G.hero.hp, st.maxHp); SB.G.hero.ep = Math.min(SB.G.hero.ep, st.maxEp); }
  function heroMoves() {
    const l = SB.G.hero.level;
    const arts = D.HERO_ARTS.filter(a => a[0] <= l).map(a => a[1]);
    return ['strike'].concat(arts);
  }
  function beastMoves(inst) {
    const sp = D.SPECIES[inst.sp];
    const learned = sp.learn.filter(a => a[0] <= inst.level).map(a => a[1]);
    return learned.slice(-4);
  }
  function xpNext(l) { return Math.floor(25 * Math.pow(l, 1.5)); }

  function makeBeast(spId, level) {
    const inst = { uid: uidC++, sp: spId, level, xp: 0, state: 'bonded', nick: null, hp: 1 };
    inst.hp = beastStats(inst).maxHp;
    return inst;
  }

  /* ---------------- XP / level / evolution ---------------- */
  function addXpHero(amt) {
    const h = SB.G.hero, msgs = [];
    h.xp += amt;
    while (h.xp >= xpNext(h.level)) {
      h.xp -= xpNext(h.level); h.level++;
      const st = heroStats(); h.hp = st.maxHp; h.ep = st.maxEp;
      msgs.push(h.name + ' reached Lv ' + h.level + '!');
      const newArts = D.HERO_ARTS.filter(a => a[0] === h.level);
      newArts.forEach(a => msgs.push('Learned ' + D.MOVES[a[1]].name + '!'));
      SB.AUDIO.sfx('level');
    }
    return msgs;
  }
  function addXpBeast(inst, amt) {
    const msgs = [];
    inst.xp += amt;
    while (inst.xp >= xpNext(inst.level)) {
      inst.xp -= xpNext(inst.level); inst.level++;
      const sp = D.SPECIES[inst.sp];
      msgs.push((inst.nick || sp.name) + ' reached Lv ' + inst.level + '!');
      if (sp.evo && inst.level >= sp.evo.lvl) {
        inst.sp = sp.evo.into;
        const ns = D.SPECIES[inst.sp];
        msgs.push((inst.nick || sp.name) + ' evolved into ' + ns.name + '!');
        SB.AUDIO.sfx('level');
      }
      inst.hp = beastStats(inst).maxHp;
    }
    return msgs;
  }

  /* ---------------- items / gear ---------------- */
  function addItem(id, n) {
    SB.G.bag[id] = (SB.G.bag[id] || 0) + n;
    if (SB.G.bag[id] <= 0) delete SB.G.bag[id];
    if (n > 0 && D.ITEMS[id]) progressQuests('collect', { item: id, n });
  }
  function equip(slot, id) { SB.G.hero.gear[slot] = id; clampHero(); }
  function unequip(slot) { SB.G.hero.gear[slot] = null; clampHero(); }
  function toggleHide(slot) { SB.G.hero.hidden[slot] = !SB.G.hero.hidden[slot]; }
  function useItem(id, target) {
    const it = D.ITEMS[id];
    if (!it || !(SB.G.bag[id] > 0)) return;
    let t;
    if (target === 'hero') t = { hp: SB.G.hero.hp, max: heroStats().maxHp, isHero: true };
    else { const b = SB.G.party[target]; if (!b) return; t = { hp: b.hp, max: beastStats(b).maxHp, inst: b }; }
    let used = false;
    if (it.use === 'heal' && t.hp > 0) { const nh = Math.min(t.max, t.hp + it.heal); if (nh > t.hp) { t.hp = nh; used = true; UI.toast('Recovered ' + (nh - (t.hp - (nh - t.hp))) + ' HP.'); } }
    if (it.use === 'ep' && t.isHero) { SB.G.hero.ep = Math.min(heroStats().maxEp, SB.G.hero.ep + it.ep); used = true; }
    if (it.use === 'revive' && t.hp <= 0) { t.hp = Math.floor(t.max / 2); used = true; }
    if (it.use === 'cleanse') { used = true; }
    if (it.use === 'wake') { used = true; }
    if (used) {
      if (t.isHero) SB.G.hero.hp = t.hp; else t.inst.hp = t.hp;
      SB.G.bag[id]--; if (SB.G.bag[id] <= 0) delete SB.G.bag[id];
      SB.AUDIO.sfx('heal');
    } else UI.toast('No effect.');
  }
  function reorderParty(from, to) {
    if (to < 0 || to >= SB.G.party.length) return;
    const p = SB.G.party; const t = p[from]; p[from] = p[to]; p[to] = t;
    SB.AUDIO.sfx('menu');
  }

  /* ---------------- quest engine ---------------- */
  function qDone(id) { return SB.G.quests[id] && SB.G.quests[id].state === 'done'; }
  function offerable(q) { return !SB.G.quests[q.id] && (!q.req || qDone(q.req)); }
  function ready(q) { const st = SB.G.quests[q.id]; return st && st.state === 'active' && st.stage >= q.stages.length; }

  function questMarker(npcId) {
    let offer = false;
    for (const id in D.QUESTS) {
      const q = D.QUESTS[id];
      if (q.giver !== npcId) continue;
      if (ready(q)) return '?';
      if (offerable(q)) offer = true;
    }
    return offer ? '!' : null;
  }
  function trackedQuestText() {
    let id = SB.G.tracked;
    if (!id || !SB.G.quests[id] || SB.G.quests[id].state === 'done') {
      id = Object.keys(SB.G.quests).find(k => SB.G.quests[k].state === 'active' && D.QUESTS[k].kind === 'main') || Object.keys(SB.G.quests).find(k => SB.G.quests[k].state === 'active');
    }
    if (!id) return null;
    const q = D.QUESTS[id], st = SB.G.quests[id];
    if (st.stage >= q.stages.length) return 'Return to ' + D.NPCS[q.giver].name + ' — ' + q.name;
    return q.stages[st.stage].txt;
  }

  function fmt(lines) { return lines.map(l => l.replace(/\{name\}/g, SB.G.hero.name)); }

  function offerQuest(q, npc) {
    UI.say(fmt(q.offer), npc.name, () => {
      UI.choose('Accept "' + q.name + '"?', [{ label: 'Accept', value: true }, { label: 'Decline', value: false }], (v) => {
        if (v) {
          SB.G.quests[q.id] = { stage: 0, counts: {}, set: [], state: 'active' };
          SB.G.tracked = q.id;
          SB.AUDIO.sfx('quest'); UI.toast('Quest accepted: ' + q.name, '#ffd94a');
          autosave();
        }
        SB.G.mode = 'world'; UI.sync();
      });
    });
  }
  function completeQuest(q, npc) {
    UI.say(fmt(q.complete), npc.name, () => {
      const st = SB.G.quests[q.id]; st.state = 'done';
      const r = q.reward;
      const lu = addXpHero(r.xp);
      SB.G.hero.gold += r.gold;
      if (r.items) r.items.forEach(([id, n]) => addItem(id, n));
      if (r.gear) r.gear.forEach(id => addItem(id, 1));
      SB.AUDIO.sfx('quest');
      UI.toast('Quest complete: ' + q.name + '  (+' + r.xp + ' XP, ◈' + r.gold + ')', '#7fffb0');
      lu.forEach(m => UI.toast(m, '#ffd94a'));
      if (r.gear) r.gear.forEach(id => UI.toast('Received ' + D.GEAR[id].name + '!', D.RARITY[D.GEAR[id].rar].color));
      SB.G.mode = 'world'; UI.sync(); autosave();
      if (q.id === 'm5') epilogue();
      if (q.id === 'm10') setTimeout(() => UI.showEnding(), 700);
    });
  }

  function progressQuests(evt, data) {
    for (const id in SB.G.quests) {
      const st = SB.G.quests[id];
      if (st.state !== 'active') continue;
      const q = D.QUESTS[id];
      if (st.stage >= q.stages.length) continue;
      const obj = q.stages[st.stage].obj;
      let done = false;
      if (obj.type === 'kill') {
        if (obj.battles) { if (evt === 'win') { st.counts.k = (st.counts.k || 0) + 1; done = st.counts.k >= obj.n; } }
        else if (evt === 'kill' && (!obj.sp || obj.sp === data.sp)) { st.counts.k = (st.counts.k || 0) + 1; done = st.counts.k >= obj.n; }
      } else if (obj.type === 'bind') {
        if (evt === 'bind') {
          st.counts.b = (st.counts.b || 0) + 1;
          if (obj.unique) { if (!st.set.includes(data.sp)) st.set.push(data.sp); done = st.set.length >= obj.n; }
          else done = st.counts.b >= obj.n;
        }
      } else if (obj.type === 'collect') {
        if (evt === 'collect' && data.item === obj.item && data.n > 0) { st.counts.c = (st.counts.c || 0) + data.n; done = st.counts.c >= obj.n; }
      } else if (obj.type === 'reach') {
        if (evt === 'reach' && data.map === obj.map && Math.abs(data.x - obj.x) <= 1 && Math.abs(data.y - obj.y) <= 1) done = true;
      } else if (obj.type === 'night') {
        if (evt === 'reach' && data.map === obj.map && ENG.isNight() && Math.abs(data.x - obj.x) <= 2 && Math.abs(data.y - obj.y) <= 2) done = true;
      } else if (obj.type === 'boss') {
        if (evt === 'boss' && data.flag === obj.flag) done = true;
      } else if (obj.type === 'have') {
        if (evt === 'have' || evt === 'bind' || evt === 'talk') done = SB.G.party.some(b => obj.sp.includes(b.sp) && b.hp > 0);
      } else if (obj.type === 'talk') {
        if (evt === 'talk' && data.npc === obj.npc) done = true;
      }
      if (done) {
        st.stage++;
        SB.AUDIO.sfx('quest');
        if (st.stage >= q.stages.length) UI.toast('"' + q.name + '" — return to ' + D.NPCS[q.giver].name + '!', '#9fd4ff');
        else UI.toast('Quest update: ' + q.name, '#9fd4ff');
        autosave();
      }
    }
  }

  function onReach(map, x, y) { progressQuests('reach', { map, x, y }); }
  function markCodex(sp, bound) { const c = SB.G.codex; if (bound) c[sp] = 'bound'; else if (!c[sp]) c[sp] = 'seen'; }
  function onBind(sp) { markCodex(sp, true); progressQuests('bind', { sp }); progressQuests('have', {}); }
  function onCollect(item, n) { if (n > 0) progressQuests('collect', { item, n }); }
  function onBattleWin(B) {
    progressQuests('win', {});
    if (B.wild) for (const foe of B.enemies) if (!foe.alive && !foe.bound) progressQuests('kill', { sp: foe.sp });
  }
  function onBossDefeated(flag) {
    SB.G.flags[flag] = true;
    progressQuests('boss', { flag });
    UI.toast('The ' + D.SPECIES[flag === 'vael' ? 'vael' : flag === 'sentinel' ? 'hollowsentinel' : 'broodmother'].name + ' falls!', '#ff9a5a');
    autosave();
  }

  /* ---------------- NPC interaction ---------------- */
  function talkTo(npc) {
    const def = D.NPCS[npc.id];
    npc.dir = facePlayer(npc);
    progressQuests('talk', { npc: npc.id });
    progressQuests('have', {});
    // ready quest turn-in
    for (const id in D.QUESTS) { const q = D.QUESTS[id]; if (q.giver === npc.id && ready(q)) { completeQuest(q, def); return; } }
    // offerable quest
    for (const id in D.QUESTS) { const q = D.QUESTS[id]; if (q.giver === npc.id && offerable(q)) { offerQuest(q, def); return; } }
    // shop / rest / base
    if (def.shop) { UI.say(fmt(def.lines), def.name, () => { UI.openShop(def.shop); }); return; }
    if (def.rest) {
      UI.say(fmt(def.lines), def.name, () => {
        UI.choose('Rest at the inn? (Heals party & saves)', [{ label: 'Rest', value: true }, { label: 'Not now', value: false }], (v) => {
          if (v) rest();
          else { SB.G.mode = 'world'; UI.sync(); }
        });
      });
      return;
    }
    UI.say(fmt(def.lines), def.name, () => { SB.G.mode = 'world'; UI.sync(); });
  }
  function facePlayer(npc) {
    const dx = SB.G.x - npc.x, dy = SB.G.y - npc.y;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 2 : 1;
    return dy > 0 ? 0 : 3;
  }
  function rest() {
    SB.G.hero.hp = heroStats().maxHp; SB.G.hero.ep = heroStats().maxEp;
    SB.G.party.forEach(b => b.hp = beastStats(b).maxHp);
    SB.G.time = 420;
    SB.AUDIO.sfx('heal');
    saveGame(0);
    UI.say(['You rest by the rekindled hearth. Warmth returns to your bones.', 'Party fully healed. Progress saved.'], 'The Ember Rest', () => { SB.G.mode = 'world'; UI.sync(); });
  }

  /* ---------------- events ---------------- */
  function interactEvent(e) {
    const G = SB.G;
    if (e.type === 'chest') {
      if (G.flags[e.flag]) { UI.toast('The chest is empty.'); return; }
      G.flags[e.flag] = true;
      const loot = e.loot; let msgs = [];
      if (loot.gold) { G.hero.gold += loot.gold; msgs.push('Found ◈ ' + loot.gold + '.'); }
      if (loot.items) loot.items.forEach(([id, n]) => { addItem(id, n); msgs.push('Found ' + (D.ITEMS[id] || D.GEAR[id]).name + ' ×' + n + '.'); });
      if (loot.gear) loot.gear.forEach(id => { addItem(id, 1); msgs.push('Found ' + D.GEAR[id].name + '!'); });
      SB.AUDIO.sfx('chest');
      if (e.msg) UI.say([e.msg].concat(msgs), 'Chest', () => { G.mode = 'world'; UI.sync(); });
      else { msgs.forEach(m => UI.toast(m, '#ffd94a')); }
      autosave();
      return;
    }
    if (e.type === 'herb') {
      const fk = 'herb_' + G.map + '_' + e.x + '_' + e.y;
      if (G.flags[fk]) { UI.toast('Nothing left to forage.'); return; }
      G.flags[fk] = true; const item = e.item || 'bitterroot'; addItem(item, 1); SB.AUDIO.sfx('chest'); UI.toast('Foraged ' + D.ITEMS[item].name + '.', '#6fce5a');
      return;
    }
    if (e.type === 'stump') {
      if (G.flags.stump_looted) { UI.toast('Just an old hollow stump.'); return; }
      G.flags.stump_looted = true; addItem('pip_locket', 1); SB.AUDIO.sfx('chest');
      UI.say(['Inside the hollow stump, something glints — a child\'s locket with a painted sun.', 'Found Pip\'s Locket!'], 'Old Stump', () => { G.mode = 'world'; UI.sync(); });
      return;
    }
    if (e.type === 'shrine') {
      progressQuests('reach', { map: G.map, x: e.x, y: e.y });
      UI.say(['You lay your hand on the Shrine Stone.', 'A heartbeat of warmth, faint as a moth\'s wing. The First Flame lives... but barely.'], 'Shrine Stone', () => { G.mode = 'world'; UI.sync(); });
      return;
    }
    if (e.type === 'firefly') {
      if (ENG.isNight()) {
        progressQuests('reach', { map: G.map, x: e.x, y: e.y });
        ENG.burst(e.x * 16 + 8, e.y * 16 + 8, '#ffd94a', 20, 1.5);
        UI.say(['The fireflies rise in a slow golden tide, dancing over the dark water.', 'Some things the dimming cannot take.'], 'Firefly Shore', () => { G.mode = 'world'; UI.sync(); });
      } else UI.toast('The fireflies only gather after dark.');
      return;
    }
    if (e.type === 'hearth') {
      progressQuests('have', {});
      UI.say(['The hearth flickers, remembering warmer days. A bonded Ember Cindren could wake it fully.'], 'Hearth', () => { G.mode = 'world'; UI.sync(); });
      return;
    }
    if (e.type === 'bed') { rest(); return; }
    if (e.type === 'mirror') { openMirror(); return; }
    if (e.type === 'sign') { UI.say([e.text], 'Sign', () => { G.mode = 'world'; UI.sync(); }); return; }
    if (e.type === 'beacon') {
      if (ENG.isNight()) {
        progressQuests('reach', { map: G.map, x: e.x, y: e.y });
        ENG.burst(e.x * 16 + 8, e.y * 16 + 4, '#ffd94a', 24, 1.6);
        UI.say(['You lay your hand on the beacon. It kindles with a warm, steady light.', 'Out in the ash, a dozen small lights answer — refugees, turning toward home. Duskhaven still stands.'], 'Beacon', () => { G.mode = 'world'; UI.sync(); });
      } else UI.toast('The beacon only lights after dark.');
      return;
    }
    if (e.type === 'idol') {
      UI.say(['The idol of a dead sun. Stolen Cindren light flickers in its cracks like a trapped heartbeat.', 'It is cold. It is waiting. End this, Warden.'], 'Idol', () => { G.mode = 'world'; UI.sync(); });
      return;
    }
    if (e.type === 'boss') { startBoss(e); return; }
  }
  function tileAction(act, x, y) {
    const e = W.eventAt(SB.G.map, x, y);
    if (e) { interactEvent(e); return; }
    if (act === 'gate') {
      if (SB.G.bag['hollowkey'] > 0) { delete SB.G.bag['hollowkey']; ENG.changeMap('hollowmere', 18, 3); }
      else UI.toast('The gate is sealed. A tide-worn keyhole waits.');
    } else if (act === 'bed') rest();
    else if (act === 'mirror') openMirror();
  }
  function openMirror() {
    // re-customize existing hero
    UI.say(['The old glass shows who you are — and who you could be.'], "Warden's Mirror", () => {
      SB.G.mode = 'world'; UI.sync();
      // open creator in edit mode
      const c = { idx: 0, dir: 0, look: Object.assign({}, SB.G.hero.look), name: SB.G.hero.name, starter: SB.G.party[0] ? SB.G.party[0].sp : null, sub: null, subIdx: 0, edit: true };
      // reuse creator via a lightweight hook
      SB.UI.openCreatorEdit(c);
    });
  }

  /* ---------------- encounters ---------------- */
  function levelBonus() { return (SB.G.flags.broodmother ? 1 : 0) + (SB.G.flags.sentinel ? 1 : 0) + (SB.G.flags.vael ? 2 : 0) + (SB.G.flags.kael ? 2 : 0); }
  function startWildEncounter() {
    const m = W.MAPS[SB.G.map];
    if (!m.encounters) return;
    const G = SB.G;
    let table = m.encounters.tables.find(t => G.x >= t.x && G.x < t.x + t.w && G.y >= t.y && G.y < t.y + t.h) || m.encounters.tables[0];
    const total = table.list.reduce((s, e) => s + e[3], 0);
    function pick() { let r = Math.random() * total; for (const e of table.list) { r -= e[3]; if (r <= 0) return e; } return table.list[0]; }
    const n = Math.random() < 0.25 ? 2 : 1;
    const enemies = [];
    for (let i = 0; i < n; i++) { const e = pick(); const lvl = e[1] + ((Math.random() * (e[2] - e[1] + 1)) | 0) + levelBonus(); enemies.push(makeBeast(e[0], lvl)); }
    enemies.forEach(e => markCodex(e.sp));
    const bg = SB.G.map === 'hollowmere' ? 'temple' : SB.G.map === 'sunsgrave' ? 'grave' : SB.G.map === 'cellar' ? 'cave' : SB.G.map === 'scorchlands' ? 'scorch' : 'wood';
    SB.BATTLE.start({ enemies, wild: true, canFlee: true, bg });
  }
  function startBoss(e) {
    if (SB.G.flags[e.flag]) return;
    markCodex(e.sp);
    const bg = SB.G.map === 'sunsgrave' ? 'grave' : SB.G.map === 'scorchlands' ? 'scorch' : SB.G.map === 'hollowmere' ? 'temple' : 'cave';
    UI.say(e.intro, D.SPECIES[e.sp].name, () => {
      SB.BATTLE.start({ enemies: [makeBeast(e.sp, e.level)], wild: false, canFlee: false, bossFlag: e.flag, bg });
    });
  }

  /* ---------------- game over / respawn ---------------- */
  function gameOver() { UI.showGameOver(); }
  function respawn() {
    SB.G.hero.hp = heroStats().maxHp; SB.G.hero.ep = heroStats().maxEp;
    SB.G.party.forEach(b => b.hp = beastStats(b).maxHp);
    SB.G.hero.gold = Math.floor(SB.G.hero.gold / 2);
    SB.G.map = 'inn'; SB.G.x = 5; SB.G.y = 6; SB.G.dir = 0; SB.G.moving = false;
    SB.G.mode = 'world'; SB.AUDIO.setMusic('town'); UI.sync();
    UI.say(['You wake at the Ember Rest. Rosa presses a warm cloth to your brow.', '"The Flame still needs you, Warden. Rest, then rise." (Half your shards were lost.)'], 'Rosa', () => { SB.G.mode = 'world'; UI.sync(); });
    autosave();
  }

  function epilogue() {
    setTimeout(() => {
      UI.say([
        'The ash settles over Hollowmere. The drained Cindren stream home like sparks up a chimney.',
        'In Emberwick, the hearthshrine\'s light stands tall again. Children chase a sky full of returning flame.',
        'You did what the songs will argue about for a hundred years, {name}.',
        'The Flame remembers. Emberwick remembers. And the road goes on — beyond the wood, beyond the mere, toward a wider world still dimming.',
        '— CINDERWARD: The Dying Flame — end of the first chapter. Thank you for playing.'
      ].map(l => l.replace(/\{name\}/g, SB.G.hero.name)), 'Epilogue', () => { SB.G.mode = 'world'; UI.sync(); });
    }, 600);
  }

  /* ---------------- save / load ---------------- */
  function serialize() { return JSON.stringify(SB.G); }
  function saveGame(slot) {
    try {
      const meta = { name: SB.G.hero.name, level: SB.G.hero.level, map: W.MAPS[SB.G.map].name, playtime: SB.G.playtime, time: Date.now() };
      localStorage.setItem(SAVEKEY + 's' + slot, serialize());
      localStorage.setItem(SAVEKEY + 'm' + slot, JSON.stringify(meta));
    } catch (e) { UI.toast('Save failed (storage unavailable).', '#ff5a4a'); }
  }
  function autosave() { saveGame(0); }
  function saves() {
    const out = {};
    for (let s = 0; s <= 3; s++) { try { const m = localStorage.getItem(SAVEKEY + 'm' + s); out[s] = m ? JSON.parse(m) : null; } catch (e) { out[s] = null; } }
    return out;
  }
  function loadGame(slot) {
    try {
      const raw = localStorage.getItem(SAVEKEY + 's' + slot);
      if (!raw) { UI.toast('No save in that slot.'); return; }
      const g = JSON.parse(raw);
      g.mode = 'world'; g.moving = false; g.codex = g.codex || {};
      SB.G = g;
      uidC = Math.max(uidC, ...g.party.map(b => b.uid || 0)) + 1;
      SB.AUDIO.setMusicOn(g.settings.music); SB.AUDIO.setSfxOn(g.settings.sfx);
      SB.AUDIO.setMusic(W.MAPS[g.map].music);
      UI.sync(); UI.toast('Loaded ' + g.hero.name + ' · Lv ' + g.hero.level, '#7fffb0');
    } catch (e) { UI.toast('Load failed.', '#ff5a4a'); }
  }

  /* ---------------- new game / boot ---------------- */
  function newGame(look, name, starter) {
    SB.G = freshState();
    SB.G.hero.name = name; SB.G.hero.look = look;
    SB.G.hero.hp = heroStats().maxHp; SB.G.hero.ep = heroStats().maxEp;
    SB.G.party = [makeBeast(starter, 5)];
    SB.G.hero.hp = heroStats().maxHp; SB.G.hero.ep = heroStats().maxEp;
    SB.G.bag = { salve: 3 };
    SB.G.hero.gold = 30;
    SB.G.map = 'emberwick'; SB.G.x = 20; SB.G.y = 18; SB.G.dir = 3;
    SB.G.mode = 'world';
    SB.AUDIO.setMusicOn(SB.G.settings.music); SB.AUDIO.setSfxOn(SB.G.settings.sfx);
    SB.AUDIO.setMusic('town');
    UI.sync();
    autosave();
    UI.say([
      'The First Flame is dying. Its light, which warmed the world since the first dawn, thins to a thread.',
      'The Cindren — living fragments of that Flame — are vanishing from their groves, stolen by grey-cloaked hands.',
      'You are ' + name + ', a young Warden of Emberwick. The order\'s last blade rests at your hip; your first Cindren walks at your side.',
      'Elder Maren waits by the plaza. Seek the ! marks. The Flame remembers those who fight for it.'
    ], 'Cinderward', () => { SB.G.mode = 'world'; UI.sync(); });
  }

  function init() {
    SB.G = freshState();
    UI.init();
    const cv = document.getElementById('game');
    ENG.init(cv);
    // restore settings
    try { const s = localStorage.getItem(SAVEKEY + 'settings'); if (s) SB.G.settings = JSON.parse(s); } catch (e) { }
    ENG.start();
    UI.showTitle();
    fitStage();
    window.addEventListener('resize', fitStage);
  }
  function fitStage() {
    const stage = document.getElementById('stage');
    const s = Math.min(window.innerWidth / 480, window.innerHeight / 320);
    stage.style.transform = 'scale(' + s + ')';
  }

  return {
    init, newGame, loadGame, saveGame, autosave, saves, respawn, gameOver,
    heroStats, beastStats, heroMoves, beastMoves, makeBeast, addXpHero, addXpBeast,
    addItem, equip, unequip, toggleHide, useItem, reorderParty,
    questMarker, trackedQuestText, talkTo, interactEvent, tileAction,
    startBoss, startWildEncounter, onReach, onBind, onCollect, onBattleWin, onBossDefeated,
    progressQuests
  };
})();

window.addEventListener('DOMContentLoaded', () => SB.MAIN.init());
