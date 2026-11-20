/* ============================================================
   CINDERWARD — ui.js
   DOM overlay: dialogue, menus, character creator, shop, title,
   game-over, battle panel, toasts. Keyboard + click.
   ============================================================ */
window.SB = window.SB || {};

SB.UI = (function () {
  'use strict';
  const D = SB.DATA, SPR = SB.SPR;
  let U = { panel: 'main', idx: 0, sub: null, subIdx: 0, gearSlot: null, beastIdx: 0, questIdx: 0 };
  let dlg = null; // {lines, i, speaker, cb, charI, full, choices, choiceIdx}
  let creator = null;
  let shop = null;
  let titleIdx = 0, gameoverReady = false;
  const SLOTS = ['weapon', 'offhand', 'head', 'shoulders', 'chest', 'hands', 'waist', 'legs', 'feet', 'back', 'neck', 'ring', 'trinket'];
  const SLOTNAME = { weapon: 'Weapon', offhand: 'Offhand', head: 'Head', shoulders: 'Shoulders', chest: 'Chest', hands: 'Hands', waist: 'Waist', legs: 'Legs', feet: 'Feet', back: 'Back', neck: 'Neck', ring: 'Ring', trinket: 'Trinket' };

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function init() {
    // click delegation for menu items
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-click]');
      if (!t) return;
      const kind = t.getAttribute('data-click');
      const i = parseInt(t.getAttribute('data-i') || '0', 10);
      handleClick(kind, i, t);
    });
  }

  function handleClick(kind, i, t) {
    const G = SB.G;
    if (kind === 'menu') { U.idx = i; menuKey('confirm'); }
    else if (kind === 'sub') { U.subIdx = i; menuKey('confirm'); }
    else if (kind === 'title') { titleIdx = i; titleKey('confirm'); }
    else if (kind === 'creator') { creator.idx = i; createKey('confirm'); }
    else if (kind === 'cr-left') { creator.idx = i; createKey('left'); }
    else if (kind === 'cr-right') { creator.idx = i; createKey('right'); }
    else if (kind === 'shop') { shop.idx = i; shopKey('confirm'); }
    else if (kind === 'battle') { const B = SB.BATTLE.get(); if (B && B.menu) { B.menu.idx = i; SB.BATTLE.key('confirm'); } }
    else if (kind === 'dlg') { dialogueKey('confirm'); }
    else if (kind === 'choice') { dlg.choiceIdx = i; dialogueKey('confirm'); }
    else if (kind === 'gameover') { gameoverKey('confirm'); }
    else if (kind === 'ending') { endingKey('confirm'); }
  }

  /* ---------------- visibility ---------------- */
  function sync() {
    const G = SB.G;
    $('title').style.display = G.mode === 'title' ? 'flex' : 'none';
    $('creator').style.display = G.mode === 'create' ? 'flex' : 'none';
    $('dialogue').style.display = G.mode === 'dialogue' ? 'block' : 'none';
    $('menu').style.display = G.mode === 'menu' ? 'block' : 'none';
    $('shop').style.display = G.mode === 'shop' ? 'block' : 'none';
    $('gameover').style.display = G.mode === 'gameover' ? 'flex' : 'none';
    $('ending').style.display = G.mode === 'ending' ? 'flex' : 'none';
    $('hud-battle').style.display = G.mode === 'battle' ? 'block' : 'none';
    $('controls-hint').style.display = (G.mode === 'world') ? 'block' : 'none';
  }

  /* ---------------- toast ---------------- */
  function toast(msg, color) {
    const box = $('toasts');
    const d = document.createElement('div');
    d.className = 'toast'; d.style.borderColor = color || '#ffd9a0';
    d.textContent = msg;
    box.appendChild(d);
    setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 400); }, 2600);
  }

  /* ---------------- dialogue ---------------- */
  function say(lines, speaker, cb) {
    dlg = { lines: lines.slice(), i: 0, speaker: speaker || '', cb: cb || null, charI: 0, full: false, choices: null, choiceIdx: 0 };
    SB.G.mode = 'dialogue';
    advanceChar();
    sync(); renderDialogue();
  }
  function choose(prompt, options, cb) {
    dlg = { lines: [prompt], i: 0, speaker: '', cb, charI: 999, full: true, choices: options, choiceIdx: 0 };
    SB.G.mode = 'dialogue'; sync(); renderDialogue();
  }
  let charTimer = null;
  function advanceChar() {
    if (charTimer) clearInterval(charTimer);
    const speed = [40, 22, 8][SB.G.settings.textSpeed || 1];
    dlg.charI = 0; dlg.full = false;
    charTimer = setInterval(() => {
      dlg.charI += 2;
      const cur = dlg.lines[dlg.i] || '';
      if (dlg.charI >= cur.length) { dlg.charI = cur.length; dlg.full = true; clearInterval(charTimer); charTimer = null; }
      renderDialogue();
    }, speed);
  }
  function dialogueKey(n) {
    if (!dlg) return;
    if (dlg.choices && dlg.full) {
      if (n === 'up') { dlg.choiceIdx = (dlg.choiceIdx - 1 + dlg.choices.length) % dlg.choices.length; SB.AUDIO.sfx('menu'); renderDialogue(); }
      else if (n === 'down') { dlg.choiceIdx = (dlg.choiceIdx + 1) % dlg.choices.length; SB.AUDIO.sfx('menu'); renderDialogue(); }
      else if (n === 'confirm') { const c = dlg.choices[dlg.choiceIdx]; const cb = dlg.cb; dlg = null; SB.AUDIO.sfx('confirm'); if (c.cb) c.cb(); else if (cb) cb(c.value); sync(); }
      else if (n === 'cancel') { const cb = dlg.cb; dlg = null; if (cb) cb(null); sync(); }
      return;
    }
    if (n === 'confirm' || n === 'cancel') {
      if (!dlg.full) { dlg.charI = (dlg.lines[dlg.i] || '').length; dlg.full = true; if (charTimer) { clearInterval(charTimer); charTimer = null; } renderDialogue(); return; }
      dlg.i++;
      if (dlg.i >= dlg.lines.length) { const cb = dlg.cb; dlg = null; SB.AUDIO.sfx('confirm'); if (cb) cb(); sync(); }
      else { SB.AUDIO.sfx('menu'); advanceChar(); }
    }
  }
  function renderDialogue() {
    if (!dlg) return;
    const cur = (dlg.lines[dlg.i] || '').slice(0, dlg.charI);
    let html = '<div class="dlg-speaker">' + esc(dlg.speaker) + '</div>';
    html += '<div class="dlg-text">' + esc(cur) + (dlg.full ? '' : '<span class="cursor">▌</span>') + '</div>';
    if (dlg.choices && dlg.full) {
      html += '<div class="dlg-choices">';
      dlg.choices.forEach((c, i) => { html += '<div class="choice ' + (i === dlg.choiceIdx ? 'sel' : '') + '" data-click="choice" data-i="' + i + '">' + esc(c.label) + '</div>'; });
      html += '</div>';
    } else if (dlg.full) {
      html += '<div class="dlg-next" data-click="dlg">▼ Z</div>';
    }
    $('dialogue').innerHTML = html;
  }

  /* ---------------- menus ---------------- */
  function openMenu(panel) {
    SB.G.mode = 'menu'; U.panel = panel || 'main'; U.idx = 0; U.sub = null; U.subIdx = 0;
    SB.AUDIO.sfx('confirm'); sync(); renderMenu();
  }
  function closeMenu() { SB.G.mode = 'world'; SB.AUDIO.sfx('cancel'); sync(); }

  function mainOpts() {
    return [
      { label: 'Cindren', act: 'beasts', sub: 'party & Bond/Rouse' },
      { label: 'Gear', act: 'gear', sub: 'equip & appearance' },
      { label: 'Bag', act: 'bag', sub: 'items' },
      { label: 'Arts', act: 'arts', sub: 'aether arts' },
      { label: 'Quests', act: 'quests', sub: 'journal' },
      { label: 'Codex', act: 'codex', sub: 'Cindren records' },
      { label: 'Save', act: 'save', sub: 'record progress' },
      { label: 'Options', act: 'options', sub: 'settings' },
      { label: 'Close', act: 'close', sub: 'return' }
    ];
  }

  function menuKey(n) {
    if (U.sub) { subKey(n); return; }
    const list = currentList();
    if (n === 'up') { U.idx = (U.idx - 1 + list.length) % list.length; SB.AUDIO.sfx('menu'); renderMenu(); }
    else if (n === 'down') { U.idx = (U.idx + 1) % list.length; SB.AUDIO.sfx('menu'); renderMenu(); }
    else if (n === 'confirm') { activate(list[U.idx]); }
    else if (n === 'cancel') { if (U.panel === 'main') closeMenu(); else { U.panel = 'main'; U.idx = 0; SB.AUDIO.sfx('cancel'); renderMenu(); } }
    else if (U.panel === 'beasts') {
      if (n === 'left') { SB.MAIN.reorderParty(U.idx, U.idx - 1); renderMenu(); }
      else if (n === 'right') { SB.MAIN.reorderParty(U.idx, U.idx + 1); renderMenu(); }
    }
  }

  function currentList() {
    if (U.panel === 'main') return mainOpts();
    if (U.panel === 'beasts') return SB.G.party.map((b, i) => ({ label: (b.nick || D.SPECIES[b.sp].name), beast: b, i }));
    if (U.panel === 'gear') return SLOTS.map(s => ({ label: SLOTNAME[s], slot: s }));
    if (U.panel === 'bag') return bagList();
    if (U.panel === 'arts') return SB.MAIN.heroMoves().map(id => ({ label: D.MOVES[id].name, move: id }));
    if (U.panel === 'quests') return questList();
    if (U.panel === 'codex') return Object.keys(D.SPECIES).map(id => ({ label: SB.G.codex[id] ? D.SPECIES[id].name : '???', sp: id, status: SB.G.codex[id] || 'unknown' }));
    if (U.panel === 'save') return [1, 2, 3].map(s => ({ label: 'Slot ' + s, slot: s }));
    if (U.panel === 'options') return optionList();
    return [];
  }

  function activate(o) {
    if (!o) return;
    SB.AUDIO.sfx('confirm');
    if (U.panel === 'main') {
      if (o.act === 'close') closeMenu();
      else { U.panel = o.act; U.idx = 0; renderMenu(); }
      return;
    }
    if (U.panel === 'beasts') {
      const b = o.beast;
      U.sub = 'beast'; U.subIdx = 0; U.beastIdx = o.i; renderMenu(); return;
    }
    if (U.panel === 'gear') { U.sub = 'slot'; U.subIdx = 0; U.gearSlot = o.slot; renderMenu(); return; }
    if (U.panel === 'bag') {
      if (o.item && D.ITEMS[o.item] && D.ITEMS[o.item].use !== 'none') { U.sub = 'useitem'; U.subIdx = 0; U.useItem = o.item; renderMenu(); }
      else toast('Cannot use that here.');
      return;
    }
    if (U.panel === 'arts') { toast(D.MOVES[o.move].desc); return; }
    if (U.panel === 'codex') { if (o.sp && SB.G.codex[o.sp]) toast(D.SPECIES[o.sp].desc); return; }
    if (U.panel === 'quests') { U.sub = 'quest'; U.subIdx = 0; U.questId = o.id; renderMenu(); return; }
    if (U.panel === 'save') { SB.MAIN.saveGame(o.slot); toast('Saved to Slot ' + o.slot + '.', '#7fffb0'); renderMenu(); return; }
    if (U.panel === 'options') { cycleOption(o); renderMenu(); return; }
  }

  function subKey(n) {
    const opts = subOpts();
    if (n === 'up') { U.subIdx = (U.subIdx - 1 + opts.length) % opts.length; SB.AUDIO.sfx('menu'); renderMenu(); }
    else if (n === 'down') { U.subIdx = (U.subIdx + 1) % opts.length; SB.AUDIO.sfx('menu'); renderMenu(); }
    else if (n === 'cancel') { U.sub = null; U.subIdx = 0; SB.AUDIO.sfx('cancel'); renderMenu(); }
    else if (n === 'confirm') { const o = opts[U.subIdx]; if (o && !o.disabled) subActivate(o); }
  }
  function subOpts() {
    if (U.sub === 'beast') {
      const b = SB.G.party[U.beastIdx];
      return [
        { label: b.state === 'roused' ? 'Set Bonded (passive aura)' : 'Set Roused (Confluence fuel)', act: 'toggle' },
        { label: 'Rename', act: 'rename' },
        { label: 'Back', act: 'back' }
      ];
    }
    if (U.sub === 'slot') {
      const id = SB.G.hero.gear[U.gearSlot];
      const hidden = SB.G.hero.hidden[U.gearSlot];
      const o = [];
      o.push({ label: 'Equip item...', act: 'pick' });
      if (id) o.push({ label: 'Unequip (' + D.GEAR[id].name + ')', act: 'unequip' });
      if (id) o.push({ label: (hidden ? 'Show' : 'Hide') + ' visual', act: 'hide' });
      o.push({ label: 'Back', act: 'back' });
      return o;
    }
    if (U.sub === 'pick') {
      const items = Object.keys(SB.G.bag).filter(id => D.GEAR[id] && D.GEAR[id].slot === U.gearSlot);
      const o = items.map(id => ({ label: D.GEAR[id].name, id, rar: D.GEAR[id].rar }));
      o.push({ label: '(cancel)', act: 'back' });
      return o;
    }
    if (U.sub === 'useitem') {
      const it = D.ITEMS[U.useItem];
      if (it.use === 'ep') return [{ label: 'Use on ' + SB.G.hero.name, act: 'use', target: 'hero' }, { label: 'Back', act: 'back' }];
      const targets = [{ label: SB.G.hero.name + ' (HP ' + SB.G.hero.hp + ')', act: 'use', target: 'hero' }];
      SB.G.party.forEach((b, i) => targets.push({ label: (b.nick || D.SPECIES[b.sp].name) + ' (HP ' + b.hp + ')', act: 'use', target: i }));
      targets.push({ label: 'Back', act: 'back' });
      return targets;
    }
    if (U.sub === 'quest') return [{ label: 'Track this quest', act: 'track' }, { label: 'Back', act: 'back' }];
    return [{ label: 'Back', act: 'back' }];
  }
  function subActivate(o) {
    SB.AUDIO.sfx('confirm');
    if (o.act === 'back') { U.sub = null; U.subIdx = 0; renderMenu(); return; }
    if (U.sub === 'beast') {
      const b = SB.G.party[U.beastIdx];
      if (o.act === 'toggle') { b.state = b.state === 'roused' ? 'bonded' : 'roused'; toast((b.nick || D.SPECIES[b.sp].name) + ' is now ' + b.state + '.'); renderMenu(); }
      else if (o.act === 'rename') { const n = prompt('Nickname for this Cindren:', b.nick || D.SPECIES[b.sp].name); if (n) b.nick = n.slice(0, 12); renderMenu(); }
      return;
    }
    if (U.sub === 'slot') {
      if (o.act === 'pick') { U.sub = 'pick'; U.subIdx = 0; renderMenu(); }
      else if (o.act === 'unequip') { SB.MAIN.unequip(U.gearSlot); renderMenu(); }
      else if (o.act === 'hide') { SB.MAIN.toggleHide(U.gearSlot); renderMenu(); }
      return;
    }
    if (U.sub === 'pick') { if (o.id) { SB.MAIN.equip(U.gearSlot, o.id); U.sub = 'slot'; U.subIdx = 0; toast('Equipped ' + D.GEAR[o.id].name + '.'); } else { U.sub = 'slot'; U.subIdx = 0; } renderMenu(); return; }
    if (U.sub === 'useitem') {
      if (o.act === 'use') { SB.MAIN.useItem(U.useItem, o.target); U.sub = null; renderMenu(); }
      return;
    }
    if (U.sub === 'quest') { if (o.act === 'track') { SB.G.tracked = U.questId; toast('Tracking: ' + D.QUESTS[U.questId].name); } U.sub = null; renderMenu(); return; }
  }

  function bagList() {
    const o = [];
    for (const id in SB.G.bag) {
      const it = D.ITEMS[id] || D.GEAR[id];
      if (!it) continue;
      if (D.GEAR[id]) continue; // gear shown in gear panel
      o.push({ label: it.name + ' ×' + SB.G.bag[id], item: id, sub: it.desc });
    }
    if (!o.length) o.push({ label: '(empty)', disabled: true });
    return o;
  }
  function questList() {
    const o = [];
    for (const id in SB.G.quests) {
      const q = D.QUESTS[id], st = SB.G.quests[id];
      if (st.state === 'done') o.push({ label: '✓ ' + q.name, id, done: true });
      else o.push({ label: (q.kind === 'main' ? '★ ' : '· ') + q.name, id });
    }
    if (!o.length) o.push({ label: '(no quests yet)', disabled: true });
    return o;
  }
  function optionList() {
    const s = SB.G.settings;
    return [
      { label: 'Text Speed: ' + ['Slow', 'Normal', 'Fast'][s.textSpeed || 1], opt: 'textSpeed' },
      { label: 'Music: ' + (s.music ? 'On' : 'Off'), opt: 'music' },
      { label: 'Sound FX: ' + (s.sfx ? 'On' : 'Off'), opt: 'sfx' },
      { label: 'Back', opt: 'back' }
    ];
  }
  function cycleOption(o) {
    const s = SB.G.settings;
    if (o.opt === 'textSpeed') s.textSpeed = ((s.textSpeed || 1) + 1) % 3;
    else if (o.opt === 'music') { s.music = !s.music; SB.AUDIO.setMusicOn(s.music); }
    else if (o.opt === 'sfx') { s.sfx = !s.sfx; SB.AUDIO.setSfxOn(s.sfx); }
    else if (o.opt === 'back') { U.panel = 'main'; U.idx = 0; }
  }

  function renderMenu() {
    const G = SB.G;
    let html = '<div class="menu-head"><span class="menu-title">' + panelTitle() + '</span><span class="menu-gold">◈ ' + G.hero.gold + '</span></div>';
    html += '<div class="menu-body">';
    // left list
    html += '<div class="menu-list">';
    if (U.sub) {
      const opts = subOpts();
      opts.forEach((o, i) => {
        const col = o.rar != null ? D.RARITY[o.rar].color : '';
        html += '<div class="menu-item ' + (i === U.subIdx ? 'sel' : '') + ' ' + (o.disabled ? 'disabled' : '') + '" data-click="sub" data-i="' + i + '" style="' + (col ? 'color:' + col : '') + '">' + esc(o.label) + '</div>';
      });
    } else {
      const list = currentList();
      list.forEach((o, i) => {
        let col = '';
        if (U.panel === 'beasts' && o.beast) col = D.EL[D.SPECIES[o.beast.sp].el].color;
        html += '<div class="menu-item ' + (i === U.idx ? 'sel' : '') + ' ' + (o.disabled ? 'disabled' : '') + '" data-click="menu" data-i="' + i + '">';
        html += '<span style="' + (col ? 'color:' + col : '') + '">' + esc(o.label) + '</span>';
        if (o.sub) html += '<span class="mi-sub">' + esc(o.sub) + '</span>';
        if (U.panel === 'beasts' && o.beast) html += '<span class="mi-state ' + o.beast.state + '">' + (o.beast.state === 'roused' ? '▲R' : '●B') + '</span>';
        html += '</div>';
      });
    }
    html += '</div>';
    // right detail
    html += '<div class="menu-detail">' + renderDetail() + '</div>';
    html += '</div>';
    html += '<div class="menu-foot">' + footHint() + '</div>';
    $('menu').innerHTML = html;
    // hero preview canvas
    const pv = $('menu-preview');
    if (pv) drawHeroPreview(pv, 3);
  }

  function panelTitle() {
    return { main: 'MENU', beasts: 'CINDREN', gear: 'GEAR & APPEARANCE', bag: 'BAG', arts: 'AETHER ARTS', quests: 'QUEST JOURNAL', codex: 'CINDREN CODEX', save: 'SAVE', options: 'OPTIONS' }[U.panel] || 'MENU';
  }
  function footHint() {
    if (U.sub === 'pick') return 'Z equip · X back';
    if (U.panel === 'beasts' && !U.sub) return 'Z details · ←/→ reorder · X back';
    if (U.sub) return 'Z select · X back';
    return 'Z select · X back/close';
  }

  function renderDetail() {
    const G = SB.G;
    if (U.panel === 'gear' || U.panel === 'main') {
      const st = SB.MAIN.heroStats();
      let h = '<canvas id="menu-preview" width="64" height="80"></canvas>';
      h += '<div class="stat-name">' + esc(G.hero.name) + ' · Lv ' + G.hero.level + '</div>';
      h += statBlock(st, G.hero.hp, st.maxHp, G.hero.ep, st.maxEp);
      return h;
    }
    if (U.panel === 'beasts') {
      const b = U.sub ? G.party[U.beastIdx] : (currentList()[U.idx] && currentList()[U.idx].beast);
      if (!b) return '<div class="hint">No Cindren yet. Bind wild ones in battle.</div>';
      const sp = D.SPECIES[b.sp], st = SB.MAIN.beastStats(b);
      let h = '<canvas id="beast-preview" width="60" height="60"></canvas>';
      h += '<div class="stat-name" style="color:' + D.EL[sp.el].color + '">' + esc(b.nick || sp.name) + ' · Lv ' + b.level + '</div>';
      h += '<div class="stat-line">' + D.EL[sp.el].name + ' · ' + (b.state === 'roused' ? 'Roused ▲' : 'Bonded ●') + '</div>';
      h += statBlock(st, b.hp, st.maxHp);
      h += '<div class="moves">' + SB.MAIN.beastMoves(b).map(id => '<span>' + D.MOVES[id].name + '</span>').join('') + '</div>';
      h += '<div class="hint">' + esc(sp.desc) + '</div>';
      setTimeout(() => { const c = $('beast-preview'); if (c) { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; const img = SPR.drawBeast(b.sp, 0); const s = sp.boss ? 28 : 20; g.drawImage(img, 30 - s * 1.4, 60 - s * 2.6, s * 2.8, s * 2.8); } }, 0);
      return h;
    }
    if (U.panel === 'bag') {
      const o = currentList()[U.idx];
      if (o && o.item) { const it = D.ITEMS[o.item]; return '<div class="stat-name">' + esc(it.name) + '</div><div class="hint">' + esc(it.desc) + '</div><div class="stat-line">Value ◈ ' + it.val + '</div>'; }
      return '<div class="hint">Consumables and quest items. Gear is managed in the Gear panel.</div>';
    }
    if (U.panel === 'arts') {
      const o = currentList()[U.idx];
      if (o && o.move) { const m = D.MOVES[o.move]; return '<div class="stat-name" style="color:' + D.EL[m.el].color + '">' + esc(m.name) + '</div><div class="stat-line">' + (m.el !== 'none' ? D.EL[m.el].name : 'Physical') + ' · ' + m.kind + (m.cost ? ' · ' + m.cost + ' EP' : '') + '</div><div class="hint">' + esc(m.desc) + '</div>'; }
      return '';
    }
    if (U.panel === 'codex') {
      const o = currentList()[U.idx];
      const total = Object.keys(D.SPECIES).length;
      const bound = Object.values(SB.G.codex).filter(v => v === 'bound').length;
      const seen = Object.keys(SB.G.codex).length;
      let h = '<div class="stat-name">Seen ' + seen + '/' + total + ' · Bound ' + bound + '</div>';
      if (o && o.sp) {
        const sp = D.SPECIES[o.sp], st = SB.G.codex[o.sp];
        if (st) {
          h += '<canvas id="codex-preview" width="60" height="60"></canvas>';
          h += '<div class="stat-name" style="color:' + D.EL[sp.el].color + '">' + esc(sp.name) + (st === 'bound' ? ' ●' : ' ○') + '</div>';
          h += '<div class="stat-line">' + D.EL[sp.el].name + (sp.boss ? ' · Boss' : '') + (sp.evo ? ' · Evolves Lv' + sp.evo.lvl : '') + '</div>';
          h += '<div class="hint">' + esc(sp.desc) + '</div>';
          setTimeout(() => { const c = $('codex-preview'); if (c) { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; const img = SPR.drawBeast(o.sp, 0); const s = sp.boss ? 28 : 20; g.drawImage(img, 30 - s * 1.4, 60 - s * 2.6, s * 2.8, s * 2.8); } }, 0);
        } else h += '<div class="hint center">???<br><br>Not yet encountered. Explore and battle to record this Cindren.</div>';
      }
      return h;
    }
    if (U.panel === 'quests') {
      const o = U.sub === 'quest' ? { id: U.questId } : currentList()[U.idx];
      if (o && o.id) {
        const q = D.QUESTS[o.id], st = G.quests[o.id];
        let h = '<div class="stat-name">' + (q.kind === 'main' ? '★ ' : '· ') + esc(q.name) + '</div>';
        h += '<div class="stat-line">' + (st.state === 'done' ? 'Completed' : 'Active') + '</div>';
        if (st.state !== 'done') { const stage = q.stages[Math.min(st.stage, q.stages.length - 1)]; h += '<div class="hint">▸ ' + esc(stage.txt) + '</div>'; }
        h += '<div class="hint">Reward: ' + q.reward.xp + ' XP · ◈ ' + q.reward.gold + (q.reward.gear ? ' · ' + q.reward.gear.map(g => D.GEAR[g].name).join(', ') : '') + '</div>';
        return h;
      }
      return '<div class="hint">Talk to villagers marked ! to find quests.</div>';
    }
    if (U.panel === 'save') {
      const saves = SB.MAIN.saves();
      let h = '<div class="stat-name">Records</div>';
      [0, 1, 2, 3].forEach(s => { const m = saves[s]; h += '<div class="stat-line">' + (s === 0 ? 'Auto' : 'Slot ' + s) + ': ' + (m ? esc(m.name) + ' Lv' + m.level + ' · ' + m.map : '— empty —') + '</div>'; });
      h += '<div class="hint">Select a slot and press Z to save. Load from the title screen.</div>';
      return h;
    }
    if (U.panel === 'options') return '<div class="hint">Adjust text speed and audio. Progress autosaves on map changes and quest completion.</div>';
    return '';
  }

  function statBlock(st, hp, maxHp, ep, maxEp) {
    let h = '<div class="bars">';
    h += bar('HP', hp, maxHp, '#5ad65a');
    if (ep != null) h += bar('EP', ep, maxEp, '#5ab0ff');
    h += '</div><div class="stat-grid">';
    h += '<span>ATK ' + st.atk + '</span><span>DEF ' + st.def + '</span><span>MAG ' + st.mag + '</span><span>RES ' + st.res + '</span><span>SPD ' + st.spd + '</span>';
    h += '</div>';
    return h;
  }
  function bar(label, v, max, col) {
    const pct = Math.max(0, Math.min(100, (v / max) * 100));
    return '<div class="bar-row"><span class="bar-l">' + label + '</span><div class="bar"><div class="bar-fill" style="width:' + pct + '%;background:' + col + '"></div></div><span class="bar-v">' + v + '/' + max + '</span></div>';
  }
  function drawHeroPreview(cv, scale) {
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, cv.width, cv.height);
    const img = SPR.drawHero(SB.G.hero.look, SB.G.hero, 0, 0);
    g.drawImage(img, (cv.width - 16 * scale) / 2, (cv.height - 24 * scale) / 2, 16 * scale, 24 * scale);
  }

  /* ---------------- character creator ---------------- */
  const CR = {
    body: ['Lithe', 'Sturdy'],
    skin: ['Dawn', 'Sand', 'Honey', 'Amber', 'Umber', 'Dusk'],
    hair: ['Windswept', 'Crop', 'Long', 'Sweep', 'Topknot', 'Braids'],
    hairColor: ['Raven', 'Chestnut', 'Oak', 'Gold', 'Silver', 'Ember', 'Sky', 'Violet'],
    eyes: ['Dark', 'Sky', 'Grove', 'Amber'],
    tunic: ['Vest', 'Robe', 'Hauberk'],
    tunicColor: ['Ember', 'Tide', 'Grove', 'Gold', 'Violet', 'Linen', 'Slate', 'Night'],
    trim: ['Ember', 'Tide', 'Grove', 'Gold', 'Violet', 'Linen', 'Slate', 'Night'],
    pants: ['Night', 'Oak', 'Tide', 'Violet', 'Slate', 'Grove'],
    boots: ['Oak', 'Tan', 'Night', 'Ember'],
    cape: ['None', 'Short', 'Long', 'Tattered'],
    capeColor: ['Ember', 'Tide', 'Grove', 'Gold', 'Violet', 'Linen', 'Slate', 'Night'],
    accessory: ['None', 'Scarf', 'Goggles', 'Flower', 'Hood']
  };
  const CR_ROWS = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'body', label: 'Build', type: 'cycle' },
    { key: 'skin', label: 'Skin', type: 'cycle' },
    { key: 'hair', label: 'Hair', type: 'cycle' },
    { key: 'hairColor', label: 'Hair Color', type: 'cycle' },
    { key: 'eyes', label: 'Eyes', type: 'cycle' },
    { key: 'tunic', label: 'Tunic', type: 'cycle' },
    { key: 'tunicColor', label: 'Tunic Color', type: 'cycle' },
    { key: 'trim', label: 'Trim', type: 'cycle' },
    { key: 'pants', label: 'Pants', type: 'cycle' },
    { key: 'boots', label: 'Boots', type: 'cycle' },
    { key: 'cape', label: 'Cape', type: 'cycle' },
    { key: 'capeColor', label: 'Cape Color', type: 'cycle' },
    { key: 'accessory', label: 'Accessory', type: 'cycle' },
    { key: 'starter', label: 'First Cindren', type: 'starter' },
    { key: 'begin', label: '▶ Begin the Journey', type: 'begin' }
  ];

  function openCreator() {
    creator = { idx: 0, dir: 0, look: { body: 0, skin: 0, hair: 0, hairColor: 2, eyes: 0, tunic: 0, tunicColor: 0, trim: 3, pants: 0, boots: 0, cape: 0, capeColor: 0, accessory: 0 }, name: '', starter: null, sub: null, subIdx: 0 };
    SB.G.mode = 'create'; sync(); renderCreator();
    setTimeout(() => { const inp = $('cname'); if (inp) inp.focus(); }, 50);
  }
  function createKey(n) {
    if (!creator) return;
    if (creator.sub === 'starter') {
      if (n === 'up' || n === 'left') { creator.subIdx = (creator.subIdx + 2) % 3; SB.AUDIO.sfx('menu'); renderCreator(); }
      else if (n === 'down' || n === 'right') { creator.subIdx = (creator.subIdx + 1) % 3; SB.AUDIO.sfx('menu'); renderCreator(); }
      else if (n === 'confirm') { creator.starter = D.STARTERS[creator.subIdx]; creator.sub = null; SB.AUDIO.sfx('confirm'); renderCreator(); }
      else if (n === 'cancel') { creator.sub = null; renderCreator(); }
      return;
    }
    const active = document.activeElement;
    if (active && active.id === 'cname') {
      if (n === 'confirm' || n === 'cancel') { active.blur(); creator.name = active.value; renderCreator(); }
      return; // let input handle typing
    }
    if (n === 'up') { creator.idx = (creator.idx - 1 + CR_ROWS.length) % CR_ROWS.length; SB.AUDIO.sfx('menu'); renderCreator(); }
    else if (n === 'down') { creator.idx = (creator.idx + 1) % CR_ROWS.length; SB.AUDIO.sfx('menu'); renderCreator(); }
    else if (n === 'left' || n === 'right') {
      const row = CR_ROWS[creator.idx];
      if (row.type === 'cycle') {
        const arr = CR[row.key]; const d = n === 'right' ? 1 : -1;
        creator.look[row.key] = (creator.look[row.key] + d + arr.length) % arr.length;
        SB.AUDIO.sfx('menu'); renderCreator();
      } else if (row.key === 'name') { const inp = $('cname'); if (inp) inp.focus(); }
    }
    else if (n === 'confirm') {
      const row = CR_ROWS[creator.idx];
      if (row.type === 'text') { const inp = $('cname'); if (inp) inp.focus(); }
      else if (row.type === 'starter') { creator.sub = 'starter'; creator.subIdx = creator.starter ? D.STARTERS.indexOf(creator.starter) : 0; renderCreator(); }
      else if (row.type === 'begin') {
        const inp = $('cname'); if (inp) creator.name = inp.value;
        if (creator.edit) {
          SB.G.hero.look = Object.assign({}, creator.look);
          SB.G.hero.name = creator.name.trim() || SB.G.hero.name;
          SB.G.mode = 'world'; SB.AUDIO.sfx('confirm'); UI.sync(); toast('Appearance updated.');
          return;
        }
        if (!creator.starter) { toast('Choose your first Cindren.', '#ff9a5a'); creator.idx = CR_ROWS.findIndex(r => r.key === 'starter'); renderCreator(); return; }
        SB.MAIN.newGame(creator.look, creator.name.trim() || 'Warden', creator.starter);
      }
    }
    else if (n === 'cancel') { /* stay */ }
  }
  function renderCreator() {
    let html = '<div class="cr-title">FORGE YOUR WARDEN</div><div class="cr-body">';
    html += '<div class="cr-left"><canvas id="cr-preview" width="96" height="120"></canvas>';
    html += '<div class="cr-dir">← / → rotate view</div>';
    if (creator.starter) { html += '<canvas id="cr-starter" width="60" height="60"></canvas><div class="cr-stname" style="color:' + D.EL[D.SPECIES[creator.starter].el].color + '">' + D.SPECIES[creator.starter].name + '</div>'; }
    html += '</div>';
    html += '<div class="cr-rows">';
    CR_ROWS.forEach((row, i) => {
      const sel = i === creator.idx && !creator.sub;
      let val = '';
      if (row.type === 'text') val = '<input id="cname" maxlength="12" placeholder="Warden" value="' + esc(creator.name) + '" />';
      else if (row.type === 'cycle') {
        const arr = CR[row.key], v = creator.look[row.key];
        val = '<span class="cr-arrow" data-click="cr-left" data-i="' + i + '">◀</span><span class="cr-val">' + arr[v] + '</span><span class="cr-arrow" data-click="cr-right" data-i="' + i + '">▶</span>';
      } else if (row.type === 'starter') val = '<span class="cr-val">' + (creator.starter ? D.SPECIES[creator.starter].name : 'choose...') + '</span>';
      else if (row.type === 'begin') val = '';
      html += '<div class="cr-row ' + (sel ? 'sel' : '') + ' ' + (row.type === 'begin' ? 'begin' : '') + '" data-click="creator" data-i="' + i + '"><span class="cr-label">' + row.label + '</span><span class="cr-control">' + val + '</span></div>';
    });
    html += '</div></div>';
    if (creator.sub === 'starter') {
      html += '<div class="cr-starterpick">';
      D.STARTERS.forEach((sp, i) => {
        const s = D.SPECIES[sp];
        html += '<div class="sp-card ' + (i === creator.subIdx ? 'sel' : '') + '" data-click="creator" data-i="' + i + '"><canvas class="sp-cv" data-sp="' + sp + '" width="48" height="48"></canvas><div class="sp-name" style="color:' + D.EL[s.el].color + '">' + s.name + '</div><div class="sp-el">' + D.EL[s.el].name + '</div></div>';
      });
      html += '</div><div class="hint center">' + esc(D.SPECIES[D.STARTERS[creator.subIdx]].desc) + ' — Z to choose</div>';
    }
    html += '<div class="menu-foot">↑/↓ row · ←/→ change · Z select</div>';
    $('creator').innerHTML = html;
    // draw previews
    const pv = $('cr-preview');
    if (pv) { const g = pv.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 96, 120); const img = SPR.drawHero(creator.look, null, creator.dir, 0); g.drawImage(img, 0, 0, 96, 120); }
    const st = $('cr-starter');
    if (st && creator.starter) { const g = st.getContext('2d'); g.imageSmoothingEnabled = false; const img = SPR.drawBeast(creator.starter, 0); g.drawImage(img, 0, 0, 60, 60); }
    document.querySelectorAll('.sp-cv').forEach(cv => { const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; const img = SPR.drawBeast(cv.getAttribute('data-sp'), 0); g.drawImage(img, 4, 4, 40, 40); });
    const inp = $('cname');
    if (inp) { inp.addEventListener('input', () => { creator.name = inp.value; }); }
  }

  function openCreatorEdit(c) {
    creator = c; creator.edit = true;
    SB.G.mode = 'create'; sync(); renderCreator();
  }

  /* ---------------- shop ---------------- */
  function openShop(shopId) {
    shop = { id: shopId, idx: 0 };
    SB.G.mode = 'shop'; SB.AUDIO.sfx('confirm'); sync(); renderShop();
  }
  function shopKey(n) {
    const stock = D.SHOPS[shop.id].stock;
    if (n === 'up') { shop.idx = (shop.idx - 1 + stock.length) % stock.length; SB.AUDIO.sfx('menu'); renderShop(); }
    else if (n === 'down') { shop.idx = (shop.idx + 1) % stock.length; SB.AUDIO.sfx('menu'); renderShop(); }
    else if (n === 'confirm') {
      const id = stock[shop.idx]; const it = D.GEAR[id] || D.ITEMS[id];
      if (SB.G.hero.gold >= it.val) { SB.G.hero.gold -= it.val; SB.MAIN.addItem(id, 1); SB.AUDIO.sfx('chest'); toast('Bought ' + it.name + '.'); renderShop(); }
      else { SB.AUDIO.sfx('error'); toast('Not enough shards.'); }
    }
    else if (n === 'cancel') { SB.G.mode = 'world'; SB.AUDIO.sfx('cancel'); sync(); }
  }
  function renderShop() {
    const s = D.SHOPS[shop.id];
    let html = '<div class="menu-head"><span class="menu-title">' + esc(s.name) + '</span><span class="menu-gold">◈ ' + SB.G.hero.gold + '</span></div><div class="shop-list">';
    s.stock.forEach((id, i) => {
      const it = D.GEAR[id] || D.ITEMS[id];
      const col = it.rar != null ? D.RARITY[it.rar].color : '#fff';
      const afford = SB.G.hero.gold >= it.val;
      html += '<div class="menu-item ' + (i === shop.idx ? 'sel' : '') + ' ' + (afford ? '' : 'disabled') + '" data-click="shop" data-i="' + i + '"><span style="color:' + col + '">' + esc(it.name) + '</span><span class="mi-sub">' + (it.slot ? SLOTNAME[it.slot] : 'item') + '</span><span class="shop-price">◈ ' + it.val + '</span></div>';
    });
    html += '</div><div class="menu-foot">Z buy · X leave</div>';
    $('shop').innerHTML = html;
  }

  /* ---------------- title ---------------- */
  function showTitle() { SB.G.mode = 'title'; titleIdx = 0; SB.AUDIO.setMusic('title'); sync(); renderTitle(); }
  function titleOpts() {
    const saves = SB.MAIN.saves();
    const has = saves[0] || saves[1] || saves[2] || saves[3];
    const o = [{ label: 'New Game', act: 'new' }];
    if (has) o.push({ label: 'Continue', act: 'continue' });
    o.push({ label: 'Controls', act: 'controls' });
    return o;
  }
  function titleKey(n) {
    const o = titleOpts();
    if (n === 'up') { titleIdx = (titleIdx - 1 + o.length) % o.length; SB.AUDIO.sfx('menu'); renderTitle(); }
    else if (n === 'down') { titleIdx = (titleIdx + 1) % o.length; SB.AUDIO.sfx('menu'); renderTitle(); }
    else if (n === 'confirm') {
      const a = o[titleIdx].act; SB.AUDIO.sfx('confirm');
      if (a === 'new') openCreator();
      else if (a === 'continue') { const s = SB.MAIN.saves(); const slot = s[0] ? 0 : s[1] ? 1 : s[2] ? 2 : 3; SB.MAIN.loadGame(slot); }
      else if (a === 'controls') showControls();
    }
  }
  function renderTitle() {
    const o = titleOpts();
    let html = '<div class="title-logo">CINDERWARD</div><div class="title-sub">— The Dying Flame —</div><div class="title-menu">';
    o.forEach((x, i) => { html += '<div class="title-item ' + (i === titleIdx ? 'sel' : '') + '" data-click="title" data-i="' + i + '">' + x.label + '</div>'; });
    html += '</div><div class="title-foot">An original pixel RPG · keyboard played</div>';
    $('title').innerHTML = html;
  }
  function showControls() {
    say([
      'CONTROLS — Move: WASD / Arrow Keys. Run: hold Shift.',
      'Interact / Confirm: Z, Enter, or Space. Menu / Back: X or Esc.',
      'Quick menus: C Gear, B Cindren, I Bag, Q Quests. M mute.',
      'In battle: ↑/↓ choose, Z confirm, X back. Weaken wild Cindren, then Bind them with the rune sigil.',
      'Rouse two same-element Cindren to unleash a Confluence. Bonded Cindren lend you their strength.'
    ], 'Controls', () => { SB.G.mode = 'title'; sync(); renderTitle(); });
  }

  /* ---------------- game over ---------------- */
  function showGameOver() { SB.G.mode = 'gameover'; gameoverReady = false; sync(); $('gameover').innerHTML = '<div class="go-title">The Flame Gutters...</div><div class="go-sub">Darkness takes the field. But embers remember.</div><div class="go-prompt" data-click="gameover">Press Z to wake at the inn</div>'; setTimeout(() => gameoverReady = true, 800); }
  function gameoverKey(n) { if (n === 'confirm' && gameoverReady) { SB.AUDIO.sfx('confirm'); SB.MAIN.respawn(); } }

  /* ---------------- ending ---------------- */
  function showEnding() {
    SB.G.mode = 'ending'; SB.AUDIO.setMusic('victory'); sync();
    const bound = Object.values(SB.G.codex).filter(v => v === 'bound').length;
    const total = Object.keys(D.SPECIES).length;
    const mins = Math.floor(SB.G.playtime / 60);
    $('ending').innerHTML =
      '<div class="end-logo">THE FLAME ENDURES</div>' +
      '<div class="end-sub">Cinderward — The Dying Flame</div>' +
      '<div class="end-text">The dead sun sleeps again. The stolen Cindren stream home, and the First Flame stands tall over a world that remembers blue.<br><br>You began as one Warden with one small spark. You end as the reason the dawn came back.</div>' +
      '<div class="end-stats">' + esc(SB.G.hero.name) + ' · Lv ' + SB.G.hero.level + ' · Codex ' + bound + '/' + total + ' bound · ' + mins + ' min</div>' +
      '<div class="end-credit">An original pixel RPG · all art, code &amp; music generated in-browser<br>Thank you for playing.</div>' +
      '<div class="end-prompt" data-click="ending">Press Z to keep exploring</div>';
  }
  function endingKey(n) {
    if (n === 'confirm') { SB.G.mode = 'world'; SB.AUDIO.setMusic(SB.WORLD.MAPS[SB.G.map].music); SB.AUDIO.sfx('confirm'); sync(); }
  }

  /* ---------------- battle panel ---------------- */
  function refreshBattle() {
    const B = SB.BATTLE.get();
    const box = $('hud-battle');
    if (!B) { box.innerHTML = ''; box.style.display = 'none'; return; }
    box.style.display = 'block';
    let html = '<div class="bt-log">';
    B.log.slice(-3).forEach(l => { html += '<div class="bt-line">' + esc(l) + '</div>'; });
    html += '</div>';
    if (B.phase === 'command' && B.menu) {
      const M = B.menu;
      html += '<div class="bt-cmd"><div class="bt-actor">' + esc(M.actor.name) + (M.actor.kind === 'hero' ? ' · EP ' + M.actor.ep + '/' + M.actor.maxEp : '') + '</div><div class="bt-opts">';
      if (M.type === 'target') {
        M.targets.forEach((t, i) => { html += '<div class="bt-opt ' + (i === M.idx ? 'sel' : '') + '" data-click="battle" data-i="' + i + '">' + esc(t.name) + ' <span class="bt-hp">HP ' + t.hp + '/' + t.maxHp + '</span></div>'; });
      } else {
        M.opts.forEach((o, i) => { html += '<div class="bt-opt ' + (i === M.idx ? 'sel' : '') + ' ' + (o.disabled ? 'disabled' : '') + '" data-click="battle" data-i="' + i + '">' + esc(o.label) + (o.sub ? '<span class="bt-sub">' + esc(o.sub) + '</span>' : '') + '</div>'; });
      }
      html += '</div></div>';
    } else if (B.phase === 'end') {
      html += '<div class="bt-cmd">';
      if (B.result === 'win') {
        html += '<div class="bt-actor">VICTORY</div><div class="bt-reward">+' + B.rewards.xp + ' XP · ◈ ' + B.rewards.gold + '</div>';
        if (B.rewards.loot.length) html += '<div class="bt-loot">Loot: ' + B.rewards.loot.map(id => { const it = D.GEAR[id] || D.ITEMS[id]; const col = it.rar != null ? D.RARITY[it.rar].color : '#fff'; return '<span style="color:' + col + '">' + esc(it.name) + '</span>'; }).join(', ') + '</div>';
        B.rewards.levelups.forEach(l => { html += '<div class="bt-lu">' + esc(l) + '</div>'; });
        B.rewards.binds.forEach(b => { html += '<div class="bt-lu">' + esc(D.SPECIES[b.sp].name) + ' joined!</div>'; });
        html += '<div class="bt-opt sel" data-click="battle" data-i="0">Z continue</div>';
      } else if (B.result === 'lose') {
        html += '<div class="bt-actor">DEFEAT</div><div class="bt-opt sel" data-click="battle" data-i="0">Z continue</div>';
      } else {
        html += '<div class="bt-opt sel" data-click="battle" data-i="0">Z continue</div>';
      }
      html += '</div>';
    } else {
      html += '<div class="bt-cmd"><div class="bt-actor">Round ' + B.round + '</div><div class="bt-wait">...</div></div>';
    }
    // party strip
    html += '<div class="bt-party">';
    B.party.forEach(c => {
      const pct = Math.max(0, (c.hp / c.maxHp) * 100);
      html += '<div class="bt-p ' + (c.alive ? '' : 'dead') + '"><span>' + esc(c.name) + '</span><div class="bar"><div class="bar-fill" style="width:' + pct + '%;background:' + (pct > 50 ? '#5ad65a' : pct > 25 ? '#ffd94a' : '#ff5a4a') + '"></div></div><span class="bt-pv">' + c.hp + '</span>' + (c.kind === 'hero' ? '<span class="bt-ep">EP ' + c.ep + '</span>' : (c.state === 'roused' ? '<span class="bt-r">▲</span>' : '')) + '</div>';
    });
    html += '</div>';
    box.innerHTML = html;
  }

  return { init, sync, toast, say, choose, dialogueKey, openMenu, closeMenu, menuKey, openCreator, openCreatorEdit, createKey, openShop, shopKey, showTitle, titleKey, showGameOver, gameoverKey, showEnding, endingKey, refreshBattle, renderMenu };
})();
