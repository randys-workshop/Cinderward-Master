/* ============================================================
   CINDERWARD — battle.js
   Hybrid turn-based combat: hero + 3 Cindren, Aether Arts (EP),
   elemental type chart, Bonded/Roused, Confluence summons,
   Bind ritual (rune sigil — no thrown object), statuses, loot.
   ============================================================ */
window.SB = window.SB || {};

SB.BATTLE = (function () {
  'use strict';
  const D = SB.DATA, SPR = SB.SPR, ENG = SB.ENGINE;
  let B = null;

  function active() { return !!B; }

  /* ---------- combatant construction ---------- */
  function mkHero() {
    const G = SB.G, st = SB.MAIN.heroStats();
    return {
      side: 'player', kind: 'hero', ref: G.hero, name: G.hero.name, level: G.hero.level,
      hp: G.hero.hp, maxHp: st.maxHp, ep: G.hero.ep, maxEp: st.maxEp,
      stats: { atk: st.atk, def: st.def, mag: st.mag, res: st.res, spd: st.spd },
      moves: SB.MAIN.heroMoves(), stages: { atk: 0, def: 0, mag: 0, res: 0, spd: 0 },
      status: null, statusTurns: 0, guarding: false, alive: G.hero.hp > 0, flash: 0, shake: 0
    };
  }
  function mkBeast(inst, side) {
    const sp = D.SPECIES[inst.sp], st = SB.MAIN.beastStats(inst);
    return {
      side, kind: 'beast', ref: inst, name: inst.nick || sp.name, level: inst.level, sp: inst.sp, el: sp.el,
      hp: inst.hp, maxHp: st.maxHp, ep: 0, maxEp: 0,
      stats: { atk: st.atk, def: st.def, mag: st.mag, res: st.res, spd: st.spd },
      moves: SB.MAIN.beastMoves(inst), stages: { atk: 0, def: 0, mag: 0, res: 0, spd: 0 },
      status: null, statusTurns: 0, guarding: false, alive: inst.hp > 0, flash: 0, shake: 0,
      state: inst.state
    };
  }

  function layout() {
    // player positions (bottom-left arc)
    const pp = [[70, 208], [150, 224], [222, 236], [292, 246]];
    B.party.forEach((c, i) => { c.rx = pp[i][0]; c.ry = pp[i][1]; });
    const ep = B.enemies.length === 1 ? [[318, 172]] : B.enemies.length === 2 ? [[296, 150], [392, 184]] : [[262, 138], [340, 162], [412, 190]];
    B.enemies.forEach((c, i) => { c.rx = ep[i][0]; c.ry = ep[i][1]; });
  }

  /* ---------- start ---------- */
  function start(opts) {
    const G = SB.G;
    const party = [mkHero()];
    for (let i = 0; i < 3 && i < G.party.length; i++) if (G.party[i].hp > 0) party.push(mkBeast(G.party[i], 'player'));
    const enemies = opts.enemies.map(e => mkBeast(e, 'foe'));
    B = {
      party, enemies, wild: opts.wild !== false, canFlee: opts.canFlee !== false,
      bossFlag: opts.bossFlag || null, bg: opts.bg || 'wood',
      phase: 'intro', round: 1, timer: 1.0, queue: [], qi: 0,
      menu: null, actorIdx: 0, log: ['Battle start!'], fx: [], result: null,
      boundThisBattle: [], time: 0
    };
    layout();
    G.mode = 'battle';
    SB.AUDIO.setMusic(opts.bossFlag ? 'boss' : 'battle');
    SB.UI.refreshBattle();
  }

  /* ---------- command round ---------- */
  function livingParty() { return B.party.filter(c => c.alive); }
  function livingFoes() { return B.enemies.filter(c => c.alive); }

  function startCommandRound() {
    B.phase = 'command'; B.actorIdx = 0;
    B.party.forEach(c => c.guarding = false);
    nextActor();
  }
  function nextActor() {
    while (B.actorIdx < B.party.length && !B.party[B.actorIdx].alive) B.actorIdx++;
    if (B.actorIdx >= B.party.length) { buildQueue(); return; }
    openRoot(B.party[B.actorIdx]);
  }
  function openRoot(actor) {
    const opts = [];
    if (actor.kind === 'hero') {
      opts.push({ label: 'Arts', act: 'moves' });
      if (B.wild) opts.push({ label: 'Bind', act: 'bind' });
      const conf = confluenceReady();
      opts.push({ label: 'Confluence', act: 'confluence', disabled: !conf, sub: conf ? conf.el : 'need 2 Roused' });
      opts.push({ label: 'Item', act: 'item' });
      opts.push({ label: 'Defend', act: 'defend' });
      if (B.canFlee) opts.push({ label: 'Flee', act: 'flee' });
    } else {
      opts.push({ label: 'Fight', act: 'moves' });
      opts.push({ label: actor.state === 'roused' ? 'Bond' : 'Rouse', act: 'rouse', sub: actor.state === 'roused' ? '→ passive' : '→ fuel' });
      if (SB.G.party.length > 3) opts.push({ label: 'Swap', act: 'swap' });
      opts.push({ label: 'Defend', act: 'defend' });
    }
    B.menu = { type: 'root', actor, opts, idx: 0 };
    SB.UI.refreshBattle();
  }

  function confluenceReady() {
    const roused = B.party.filter(c => c.kind === 'beast' && c.alive && c.state === 'roused');
    const byEl = {};
    for (const c of roused) byEl[c.el] = (byEl[c.el] || 0) + 1;
    for (const el in byEl) if (byEl[el] >= 2) return { el, n: byEl[el] };
    return null;
  }

  function openMoves(actor) {
    const opts = actor.moves.map(id => {
      const m = D.MOVES[id];
      const cost = m.cost || 0;
      const disabled = actor.kind === 'hero' && cost > actor.ep;
      return { label: m.name, act: 'move', move: id, sub: (m.el !== 'none' ? D.EL[m.el].name : 'Phys') + (cost ? ' · ' + cost + ' EP' : ''), disabled, desc: m.desc };
    });
    B.menu = { type: 'moves', actor, opts, idx: 0 };
    SB.UI.refreshBattle();
  }
  function openTarget(actor, action) {
    const targets = action.tgt === 'foe' ? livingFoes() : livingParty();
    if (targets.length === 1) { commit(Object.assign({}, action, { target: targets[0] })); return; }
    B.menu = { type: 'target', actor, action, targets, idx: 0 };
    SB.UI.refreshBattle();
  }
  function openItem(actor) {
    const bag = SB.G.bag;
    const opts = [];
    for (const id in bag) {
      const it = D.ITEMS[id];
      if (it && it.use !== 'none' && bag[id] > 0) opts.push({ label: it.name + ' ×' + bag[id], act: 'useitem', item: id, sub: it.desc });
    }
    if (!opts.length) opts.push({ label: '(no usable items)', disabled: true });
    B.menu = { type: 'item', actor, opts, idx: 0 };
    SB.UI.refreshBattle();
  }
  function openSwap(actor) {
    const reserve = SB.G.party.slice(3).filter(b => b.hp > 0);
    const opts = reserve.map(b => ({ label: (b.nick || D.SPECIES[b.sp].name) + ' Lv' + b.level, act: 'doswap', inst: b }));
    if (!opts.length) opts.push({ label: '(no reserve)', disabled: true });
    B.menu = { type: 'swap', actor, opts, idx: 0 };
    SB.UI.refreshBattle();
  }

  function commit(action) {
    action.actor = B.menu.actor;
    B.commands = B.commands || {};
    B.commands[B.actorIdx] = action;
    B.menu = null;
    B.actorIdx++;
    nextActor();
  }

  /* ---------- input ---------- */
  function key(n) {
    if (!B) return;
    if (B.phase === 'intro') { if (n === 'confirm') B.timer = 0; return; }
    if (B.phase === 'end') { if (n === 'confirm') finish(); return; }
    if (B.phase === 'resolve' || B.phase === 'endround') { if (n === 'confirm') B.timer = 0; return; }
    if (B.phase !== 'command' || !B.menu) return;
    const M = B.menu;
    const list = M.type === 'target' ? M.targets : M.opts;
    if (n === 'up') { M.idx = (M.idx - 1 + list.length) % list.length; SB.AUDIO.sfx('menu'); SB.UI.refreshBattle(); }
    else if (n === 'down') { M.idx = (M.idx + 1) % list.length; SB.AUDIO.sfx('menu'); SB.UI.refreshBattle(); }
    else if (n === 'confirm') selectMenu(M);
    else if (n === 'cancel') backMenu(M);
  }
  function selectMenu(M) {
    if (M.type === 'target') {
      const t = M.targets[M.idx];
      SB.AUDIO.sfx('confirm');
      commit(Object.assign({}, M.action, { target: t }));
      return;
    }
    const o = M.opts[M.idx];
    if (!o || o.disabled) { SB.AUDIO.sfx('error'); return; }
    SB.AUDIO.sfx('confirm');
    const actor = M.actor;
    switch (o.act) {
      case 'moves': openMoves(actor); break;
      case 'move': {
        const m = D.MOVES[o.move];
        const action = { type: 'move', move: o.move, tgt: m.tgt };
        if (m.tgt === 'foe' || m.tgt === 'ally') openTarget(actor, action);
        else commit(action);
        break;
      }
      case 'bind': openTarget(actor, { type: 'bind', tgt: 'foe' }); break;
      case 'confluence': commit({ type: 'confluence' }); break;
      case 'item': openItem(actor); break;
      case 'useitem': {
        const it = D.ITEMS[o.item];
        if (it.use === 'heal' || it.use === 'revive' || it.use === 'cleanse' || it.use === 'wake' || it.use === 'ep') openTarget(actor, { type: 'item', item: o.item, tgt: 'ally' });
        else commit({ type: 'item', item: o.item, target: actor });
        break;
      }
      case 'swap': openSwap(actor); break;
      case 'doswap': commit({ type: 'swap', inst: o.inst }); break;
      case 'rouse': commit({ type: 'rouse' }); break;
      case 'defend': commit({ type: 'defend' }); break;
      case 'flee': commit({ type: 'flee' }); break;
    }
  }
  function backMenu(M) {
    SB.AUDIO.sfx('cancel');
    if (M.type === 'root') { // cancel on root: reopen previous actor or do nothing
      if (B.actorIdx > 0) { B.actorIdx--; delete B.commands[B.actorIdx]; while (B.actorIdx > 0 && !B.party[B.actorIdx].alive) B.actorIdx--; openRoot(B.party[B.actorIdx]); }
      return;
    }
    if (M.type === 'target' || M.type === 'moves' || M.type === 'item' || M.type === 'swap') openRoot(M.actor);
  }

  /* ---------- queue & resolution ---------- */
  function buildQueue() {
    const q = [];
    B.party.forEach((c, i) => { if (B.commands[i]) q.push(B.commands[i]); });
    // enemy AI
    for (const foe of livingFoes()) {
      const targets = livingParty();
      if (!targets.length) break;
      const mv = foe.moves[(Math.random() * foe.moves.length) | 0];
      const m = D.MOVES[mv];
      let target = targets[(Math.random() * targets.length) | 0];
      q.push({ actor: foe, type: 'move', move: mv, tgt: m.tgt, target });
    }
    q.sort((a, b) => {
      const pa = (D.MOVES[a.move] && D.MOVES[a.move].prio) || 0;
      const pb = (D.MOVES[b.move] && D.MOVES[b.move].prio) || 0;
      if (pa !== pb) return pb - pa;
      const sa = effSpd(a.actor), sb = effSpd(b.actor);
      return sb - sa || Math.random() - 0.5;
    });
    B.queue = q; B.qi = 0; B.commands = {};
    B.phase = 'resolve';
    doNextAction();
  }
  function effSpd(c) { let s = c.stats.spd * stageMul(c.stages.spd); if (c.status === 'static') s *= 0.5; return s; }
  function stageMul(n) { return Math.max(0.4, 1 + 0.25 * n); }

  function doNextAction() {
    if (checkEnd()) return;
    if (B.qi >= B.queue.length) { endRound(); return; }
    const a = B.queue[B.qi++];
    executeAction(a);
    B.timer = 0.62;
    SB.UI.refreshBattle();
  }

  function canAct(c) {
    if (!c.alive) return false;
    if (c.status === 'slumber') {
      if (Math.random() < 0.35) { c.status = null; log(c.name + ' wakes up!'); return true; }
      log(c.name + ' is lost in slumber...'); return false;
    }
    if (c.status === 'static' && Math.random() < 0.25) { log(c.name + ' is paralyzed by static!'); return false; }
    return true;
  }

  function executeAction(a) {
    const c = a.actor;
    if (!c.alive) return;
    if (!canAct(c)) return;
    switch (a.type) {
      case 'move': doMove(c, a); break;
      case 'bind': doBind(c, a.target); break;
      case 'confluence': doConfluence(c); break;
      case 'item': doItem(c, a); break;
      case 'swap': doSwap(c, a); break;
      case 'rouse': doRouse(c); break;
      case 'defend': c.guarding = true; log(c.name + ' braces for impact.'); break;
      case 'flee': doFlee(c); break;
    }
  }

  function targetsFor(c, m, a) {
    if (m.tgt === 'foes') return livingFoes();
    if (m.tgt === 'allies') return livingParty();
    if (m.tgt === 'self') return [c];
    if (a.target && a.target.alive) return [a.target];
    const pool = m.tgt === 'foe' ? livingFoes() : livingParty();
    return pool.length ? [pool[(Math.random() * pool.length) | 0]] : [];
  }

  function doMove(c, a) {
    const m = D.MOVES[a.move];
    if (c.kind === 'hero' && m.cost) c.ep = Math.max(0, c.ep - m.cost);
    const targets = targetsFor(c, m, a);
    log(c.name + ' uses ' + m.name + '!');
    if (m.kind === 'heal') {
      for (const t of targets) {
        if (m.revive) {
          if (!t.alive) { t.alive = true; t.hp = Math.floor(t.maxHp * (m.pow / 100)); log(t.name + ' is rekindled!'); fx('heal', t); SB.AUDIO.sfx('heal'); }
        } else if (m.cleanse) { t.status = null; t.statusTurns = 0; log(t.name + ' is cleansed.'); fx('heal', t); SB.AUDIO.sfx('heal'); }
        else if (t.alive) { const amt = Math.floor(m.pow + c.stats.mag * 0.5); t.hp = Math.min(t.maxHp, t.hp + amt); log(t.name + ' recovers ' + amt + ' HP.'); fx('heal', t); SB.AUDIO.sfx('heal'); }
      }
      return;
    }
    if (m.kind === 'buff') {
      for (const t of targets) {
        if (m.guard) { c.guarding = true; }
        if (m.buff) { t.stages[m.buff.stat] = Math.max(-3, Math.min(3, t.stages[m.buff.stat] + m.buff.n)); log(t.name + '\'s ' + m.buff.stat.toUpperCase() + (m.buff.n > 0 ? ' rose!' : ' fell!')); fx('buff', t); }
        if (m.st && m.st.friendly) { if (!t.status) { t.status = m.st.id; t.statusTurns = 3; log(t.name + ' is kindled with regen!'); } }
        else if (m.st && Math.random() < m.st.ch && t.alive && !t.status) { t.status = m.st.id; t.statusTurns = 3; log(t.name + ' is ' + D.STATUS[m.st.id].name + '!'); }
      }
      SB.AUDIO.sfx('heal');
      return;
    }
    // damaging
    for (const t of targets) {
      if (!t.alive) continue;
      const dmg = calcDamage(c, t, m);
      t.hp = Math.max(0, t.hp - dmg.amount);
      t.flash = 1; t.shake = 6;
      fx(m.kind === 'art' ? 'art' : 'hit', t, m.el);
      SB.AUDIO.sfx(dmg.crit ? 'crit' : (t.side === 'player' ? 'hurt' : 'hit'));
      ENG.shake(dmg.crit ? 5 : 2);
      let msg = t.name + ' takes ' + dmg.amount + ' damage.';
      if (dmg.crit) msg += ' Critical!';
      if (dmg.mod > 1) msg += ' It\'s super effective!';
      else if (dmg.mod < 1) msg += ' It barely grazes...';
      log(msg);
      if (m.st && Math.random() < m.st.ch && t.alive && t.hp > 0 && !t.status) { t.status = m.st.id; t.statusTurns = 3; log(t.name + ' is ' + D.STATUS[m.st.id].name + '!'); }
      if (t.hp <= 0) { t.alive = false; log(t.name + ' is defeated!'); fx('faint', t); }
    }
  }

  function calcDamage(c, t, m) {
    const isArt = m.kind === 'art';
    const atkStat = isArt ? c.stats.mag * stageMul(c.stages.mag) : c.stats.atk * stageMul(c.stages.atk);
    const defStat = isArt ? t.stats.res * stageMul(t.stages.res) : t.stats.def * stageMul(t.stages.def);
    let base = Math.max(1, atkStat * 2 - defStat);
    let dmg = base * (m.pow / 100);
    const mod = D.elMod(m.el, t.el || (t.kind === 'beast' ? D.SPECIES[t.sp].el : 'none'));
    dmg *= mod;
    if (c.status === 'scorch' && !isArt) dmg *= 0.75;
    if (t.guarding) dmg *= 0.5;
    const crit = Math.random() < 0.06;
    if (crit) dmg *= 1.5;
    dmg *= 0.85 + Math.random() * 0.15;
    return { amount: Math.max(1, Math.floor(dmg)), crit, mod };
  }

  function doBind(c, target) {
    if (!target || !target.alive) { log('No target to Bind.'); return; }
    const sp = D.SPECIES[target.sp];
    if (sp.bind <= 0) { log(target.name + ' cannot be Bound!'); SB.AUDIO.sfx('error'); return; }
    log(c.name + ' channels the Bind sigil...');
    fx('bind', target);
    SB.AUDIO.sfx('bind');
    const hpFrac = target.hp / target.maxHp;
    let chance = sp.bind * (1.7 - 1.2 * hpFrac) + (target.status ? 0.15 : 0);
    chance = Math.max(0.05, Math.min(0.95, chance));
    if (Math.random() < chance) {
      target.alive = false; target.bound = true;
      const inst = target.ref;
      inst.state = 'bonded';
      SB.G.party.push(inst);
      B.boundThisBattle.push(inst);
      SB.MAIN.onBind(inst.sp);
      log('The sigil holds! ' + sp.name + ' joins your side!');
      fx('bindok', target);
      SB.AUDIO.sfx('bind');
    } else {
      log('The sigil flickers and fails... ' + sp.name + ' resists!');
      fx('bindfail', target);
      SB.AUDIO.sfx('error');
    }
  }

  function doConfluence(c) {
    const conf = confluenceReady();
    if (!conf) { log('No Confluence is ready.'); return; }
    const roused = B.party.filter(x => x.kind === 'beast' && x.alive && x.state === 'roused' && x.el === conf.el);
    let mag = 0; roused.forEach(x => { mag += x.stats.mag; x.state = 'bonded'; x.ref.state = 'bonded'; });
    log('CONFLUENCE! ' + D.EL[conf.el].name + ' spirits surge as one!');
    SB.AUDIO.sfx('summon'); ENG.shake(8);
    fx('summon', null, conf.el);
    const foes = livingFoes();
    for (const t of foes) {
      const mod = D.elMod(conf.el, D.SPECIES[t.sp].el);
      const dmg = Math.max(1, Math.floor(mag * 1.4 * mod * (0.9 + Math.random() * 0.2)));
      t.hp = Math.max(0, t.hp - dmg); t.flash = 1; t.shake = 8;
      log(t.name + ' is engulfed for ' + dmg + '!');
      if (t.hp <= 0) { t.alive = false; log(t.name + ' is defeated!'); fx('faint', t); }
    }
  }

  function doItem(c, a) {
    const it = D.ITEMS[a.item];
    if (!it || !(SB.G.bag[a.item] > 0)) { log('No item left.'); return; }
    SB.G.bag[a.item]--; if (SB.G.bag[a.item] <= 0) delete SB.G.bag[a.item];
    const t = a.target && a.target.alive ? a.target : (a.target || c);
    log(c.name + ' uses ' + it.name + '.');
    if (it.use === 'heal' && t.alive) { t.hp = Math.min(t.maxHp, t.hp + it.heal); log(t.name + ' recovers ' + it.heal + ' HP.'); fx('heal', t); SB.AUDIO.sfx('heal'); }
    else if (it.use === 'ep' && t.kind === 'hero') { t.ep = Math.min(t.maxEp, t.ep + it.ep); log(t.name + ' recovers ' + it.ep + ' EP.'); fx('heal', t); SB.AUDIO.sfx('heal'); }
    else if (it.use === 'revive' && !t.alive) { t.alive = true; t.hp = Math.floor(t.maxHp / 2); log(t.name + ' is rekindled!'); fx('heal', t); SB.AUDIO.sfx('heal'); }
    else if (it.use === 'cleanse') { t.status = null; t.statusTurns = 0; log(t.name + ' is cleansed.'); fx('heal', t); }
    else if (it.use === 'wake') { if (t.status === 'slumber') { t.status = null; log(t.name + ' wakes!'); } }
    SB.MAIN.onCollect(a.item, -1);
  }

  function doSwap(c, a) {
    const idx = SB.G.party.indexOf(a.inst);
    const curIdx = SB.G.party.indexOf(c.ref);
    if (idx < 0 || curIdx < 0) return;
    // swap positions in party array
    SB.G.party[curIdx] = a.inst; SB.G.party[idx] = c.ref;
    const newC = mkBeast(a.inst, 'player');
    newC.rx = c.rx; newC.ry = c.ry;
    const pi = B.party.indexOf(c);
    B.party[pi] = newC;
    log(c.name + ' withdraws; ' + newC.name + ' enters!');
  }

  function doRouse(c) {
    c.state = c.state === 'roused' ? 'bonded' : 'roused';
    c.ref.state = c.state;
    log(c.name + (c.state === 'roused' ? ' is Roused — its light burns bright!' : ' settles into a Bonded calm.'));
    fx('buff', c);
    SB.AUDIO.sfx('confirm');
  }

  function doFlee(c) {
    if (!B.canFlee) { log('Cannot flee this battle!'); return; }
    const chance = 0.5 + (effSpd(c) - effSpd(livingFoes()[0] || c)) * 0.03;
    if (Math.random() < Math.max(0.2, Math.min(0.95, chance))) {
      log('You slipped away safely.');
      SB.AUDIO.sfx('flee');
      B.result = 'flee'; B.phase = 'end'; B.timer = 0.8;
    } else { log('Couldn\'t escape!'); }
  }

  /* ---------- end of round ---------- */
  function endRound() {
    B.phase = 'endround';
    for (const c of [...B.party, ...B.enemies]) {
      if (!c.alive || !c.status) continue;
      const st = D.STATUS[c.status];
      if (st.dot) { const d = Math.max(1, Math.floor(c.maxHp * st.dot)); c.hp = Math.max(0, c.hp - d); log(c.name + ' ' + st.msg + ' (-' + d + ').'); if (c.hp <= 0) { c.alive = false; log(c.name + ' is defeated!'); } }
      if (st.hot) { const h = Math.floor(c.maxHp * st.hot); c.hp = Math.min(c.maxHp, c.hp + h); }
      if (c.status !== 'slumber') { c.statusTurns--; if (c.statusTurns <= 0) { c.status = null; } }
    }
    B.timer = 0.5;
    SB.UI.refreshBattle();
    // after timer, advance() checks end / next round
  }

  function checkEnd() {
    if (!livingFoes().length) { victory(); return true; }
    if (!livingParty().length) { defeat(); return true; }
    return false;
  }

  function victory() {
    B.phase = 'end'; B.result = 'win';
    SB.AUDIO.setMusic('victory');
    // XP
    let totalXp = 0, gold = 0;
    const loot = [];
    for (const foe of B.enemies) {
      const sp = D.SPECIES[foe.sp];
      totalXp += Math.floor(sp.xp * (1 + foe.level * 0.08));
      gold += Math.floor(sp.xp * 0.6 * (0.8 + Math.random() * 0.4));
      for (const [id, ch] of sp.loot) if (Math.random() < ch) loot.push(id);
    }
    B.rewards = { xp: totalXp, gold, loot, levelups: [], binds: B.boundThisBattle };
    // distribute XP
    const survivors = B.party.filter(c => c.alive);
    const share = Math.floor(totalXp / Math.max(1, survivors.length));
    for (const c of survivors) {
      if (c.kind === 'hero') { const lu = SB.MAIN.addXpHero(share); B.rewards.levelups.push(...lu); }
      else { const lu = SB.MAIN.addXpBeast(c.ref, share); B.rewards.levelups.push(...lu); }
    }
    SB.G.hero.gold += gold;
    for (const id of loot) SB.MAIN.addItem(id, 1);
    SB.MAIN.onBattleWin(B);
    SB.UI.refreshBattle();
  }

  function defeat() {
    B.phase = 'end'; B.result = 'lose';
    SB.AUDIO.stopMusic();
    log('Your flame gutters out...');
    SB.UI.refreshBattle();
  }

  function finish() {
    const res = B.result;
    // sync HP/EP back to refs
    for (const c of B.party) {
      if (c.kind === 'hero') { SB.G.hero.hp = c.hp; SB.G.hero.ep = c.ep; }
      else { c.ref.hp = c.hp; }
    }
    const bossFlag = B.bossFlag;
    B = null;
    if (res === 'lose') { SB.MAIN.gameOver(); return; }
    SB.G.mode = 'world';
    const m = SB.WORLD.MAPS[SB.G.map];
    SB.AUDIO.setMusic(m.music);
    if (bossFlag) SB.MAIN.onBossDefeated(bossFlag);
    SB.UI.refreshBattle();
    SB.MAIN.autosave();
  }

  /* ---------- fx & log ---------- */
  function log(t) { B.log.push(t); if (B.log.length > 30) B.log.shift(); }
  function fx(type, target, el) {
    B.fx.push({ type, x: target ? target.rx : 240, y: target ? target.ry : 120, t: 0, dur: type === 'summon' ? 0.9 : type === 'bind' ? 0.8 : 0.5, el: el || 'none', target });
  }

  /* ---------- update ---------- */
  function update(dt) {
    if (!B) return;
    B.time += dt;
    for (const c of [...B.party, ...B.enemies]) { if (c.flash > 0) c.flash = Math.max(0, c.flash - dt * 4); if (c.shake > 0) c.shake = Math.max(0, c.shake - dt * 30); }
    for (let i = B.fx.length - 1; i >= 0; i--) { B.fx[i].t += dt; if (B.fx[i].t > B.fx[i].dur) B.fx.splice(i, 1); }
    if (B.timer > 0) { B.timer -= dt; if (B.timer <= 0) advance(); }
  }
  function advance() {
    if (B.phase === 'intro') { startCommandRound(); }
    else if (B.phase === 'resolve') { doNextAction(); }
    else if (B.phase === 'endround') { if (!checkEnd()) { B.round++; startCommandRound(); } }
    else if (B.phase === 'end') { /* wait for confirm */ }
  }

  /* ---------- render ---------- */
  function render(ctx) {
    if (!B) return;
    const W = ENG.VIEW_W, H = ENG.VIEW_H;
    // background
    const bgs = {
      wood: ['#2a4a2a', '#1a2a18', '#3a5a3a'],
      cave: ['#2a2a35', '#1a1a22', '#3a3a45'],
      temple: ['#1a2a3a', '#0a1520', '#2a3a4a'],
      scorch: ['#3a2a20', '#1a1210', '#5a4a38'],
      grave: ['#241c30', '#0e0a16', '#3a3048'],
      town: ['#3a3a4a', '#2a2a35', '#4a4a5a']
    };
    const bg = bgs[B.bg] || bgs.wood;
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, bg[0]); grd.addColorStop(1, bg[1]);
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    // battlefield floor with a horizon line (foes farther up, party nearer)
    const hy = 106;
    const fg = ctx.createLinearGradient(0, hy, 0, H);
    fg.addColorStop(0, SPR.shade(bg[2], 1.3));
    fg.addColorStop(1, SPR.shade(bg[2], 0.75));
    ctx.fillStyle = fg; ctx.fillRect(0, hy, W, H - hy);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(0, hy, W, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, H - 26, W, 26);
    // ambient motes
    for (let i = 0; i < 16; i++) {
      const x = (i * 61 + B.time * 12) % W, y = (i * 37 + Math.sin(B.time + i) * 20) % (H * 0.6);
      ctx.fillStyle = 'rgba(255,220,150,0.12)'; ctx.fillRect(x | 0, y | 0, 2, 2);
    }
    // enemies
    for (const c of B.enemies) drawCombatant(ctx, c, true);
    // party
    for (const c of B.party) drawCombatant(ctx, c, false);
    // fx
    for (const f of B.fx) drawFx(ctx, f);
    // enemy HP bars
    for (const c of B.enemies) if (c.alive) drawHpBar(ctx, c.rx - 20, c.ry - (D.SPECIES[c.sp].boss ? 104 : 52), 40, c.hp / c.maxHp, c);
  }

  function drawCombatant(ctx, c, foe) {
    if (!c.alive && !c.bound) {
      // faint: faded sprite
      ctx.globalAlpha = 0.25;
    }
    const bob = Math.sin(B.time * 2 + (c.rx || 0)) * 2;
    const shx = c.shake > 0 ? (Math.random() - 0.5) * c.shake : 0;
    let img, w, h;
    if (c.kind === 'hero') {
      img = SPR.drawHero(SB.G.hero.look, SB.G.hero, foe ? 1 : 2, 0);
      w = 32; h = 48;
    } else {
      img = SPR.drawBeast(c.sp, (B.time * 2 | 0) % 2);
      const s = D.SPECIES[c.sp].boss ? 28 : 20;
      const scale = D.SPECIES[c.sp].boss ? 3.4 : 2.2;
      w = s * scale; h = s * scale;
    }
    const x = c.rx - w / 2 + shx, y = c.ry - h + bob;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(c.rx, c.ry + 2, w * 0.35, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(img, x, y, w, h);
    if (c.flash > 0) { ctx.globalAlpha = c.flash * 0.7; ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1; }
    ctx.globalAlpha = 1;
    // status icon
    if (c.status && c.alive) {
      ctx.fillStyle = D.STATUS[c.status].color; ctx.font = '9px monospace'; ctx.textAlign = 'center';
      ctx.fillText(D.STATUS[c.status].name.charAt(0), c.rx, y - 4);
    }
    // roused indicator
    if (c.kind === 'beast' && c.state === 'roused' && c.alive) {
      ctx.fillStyle = '#ffd94a'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
      ctx.fillText('▲', c.rx + w / 2 - 2, y + 6);
    }
  }

  function drawHpBar(ctx, x, y, w, frac, c) {
    ctx.fillStyle = 'rgba(10,10,18,0.7)'; ctx.fillRect(x - 1, y - 1, w + 2, 6);
    ctx.fillStyle = '#3a3a45'; ctx.fillRect(x, y, w, 4);
    ctx.fillStyle = frac > 0.5 ? '#5ad65a' : frac > 0.25 ? '#ffd94a' : '#ff5a4a';
    ctx.fillRect(x, y, Math.max(0, w * frac), 4);
    ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
    ctx.fillText(c.name + ' Lv' + c.level, x + w / 2, y - 3);
  }

  function drawFx(ctx, f) {
    const p = f.t / f.dur;
    const col = D.EL[f.el] ? D.EL[f.el].color : '#fff';
    ctx.save();
    if (f.type === 'hit' || f.type === 'art') {
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(f.x, f.y - 20, 8 + p * 26, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + p * 2; ctx.fillStyle = col; ctx.fillRect(f.x + Math.cos(a) * (10 + p * 24), f.y - 20 + Math.sin(a) * (10 + p * 24), 3, 3); }
    } else if (f.type === 'heal' || f.type === 'buff') {
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = f.type === 'heal' ? '#7fffb0' : '#9fd4ff';
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ctx.fillRect(f.x + Math.cos(a) * 16, f.y - 20 - p * 30 + Math.sin(a) * 8, 2, 4); }
    } else if (f.type === 'bind' || f.type === 'bindok' || f.type === 'bindfail') {
      ctx.globalAlpha = 1 - p * 0.5;
      const ok = f.type === 'bindok', fail = f.type === 'bindfail';
      ctx.strokeStyle = fail ? '#ff5a4a' : ok ? '#7fffb0' : '#ffd94a'; ctx.lineWidth = 2;
      const r = 24 + (ok ? -p * 18 : p * 6);
      ctx.beginPath(); ctx.arc(f.x, f.y - 20, r, 0, Math.PI * 2); ctx.stroke();
      // rotating runes (no projectile)
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2 + B.time * 3;
        const rx = f.x + Math.cos(a) * r, ry = f.y - 20 + Math.sin(a) * r;
        ctx.fillStyle = fail ? '#ff5a4a' : ok ? '#7fffb0' : '#ffd94a';
        ctx.fillRect(rx - 2, ry - 2, 4, 4);
      }
    } else if (f.type === 'summon') {
      ctx.globalAlpha = (1 - p) * 0.8;
      ctx.fillStyle = col;
      ctx.fillRect(0, 0, ENG.VIEW_W, ENG.VIEW_H);
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(240, 120, 20 + p * 160, 0, Math.PI * 2); ctx.stroke();
    } else if (f.type === 'faint') {
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = '#888';
      for (let i = 0; i < 10; i++) ctx.fillRect(f.x + (Math.random() - 0.5) * 30, f.y - 20 - p * 40 + (Math.random() - 0.5) * 20, 2, 2);
    }
    ctx.restore();
  }

  return { active, start, key, update, render, get: () => B };
})();
