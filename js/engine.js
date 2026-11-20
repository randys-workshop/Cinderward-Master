/* ============================================================
   CINDERWARD — engine.js
   Input, loop, camera, world render, movement, day/night,
   particles, procedural audio. No external assets.
   ============================================================ */
window.SB = window.SB || {};

/* ---------------- AUDIO (procedural chiptune) ---------------- */
SB.AUDIO = (function () {
  'use strict';
  let ctx = null, master = null, musicGain = null, sfxGain = null;
  let muted = false, musicOn = true, sfxOn = true;
  let curTrack = null, seqTimer = null, step = 0;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.32; musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(master);
      return true;
    } catch (e) { return false; }
  }
  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  const TRACKS = {
    title:  { tempo: 420, wave: 'triangle', base: 220, notes: [0, 4, 7, 12, 7, 4, 0, -5, 0, 4, 7, 11, 7, 4, 2, -1], bass: [0, -5, -3, -5] },
    town:   { tempo: 300, wave: 'triangle', base: 262, notes: [0, 2, 4, 7, 4, 2, 0, 2, 4, 7, 9, 7, 4, 2, 0, -1], bass: [0, 5, 3, 5] },
    wood:   { tempo: 340, wave: 'sine', base: 294, notes: [0, 4, 7, 9, 7, 4, 2, 4, 0, 4, 7, 12, 9, 7, 4, 2], bass: [0, -3, 2, -3] },
    dungeon:{ tempo: 520, wave: 'sine', base: 147, notes: [0, -1, 3, -1, 0, -1, 5, 3, 0, -1, 3, -1, -2, -1, 0, -1], bass: [0, 0, -2, -2] },
    battle: { tempo: 180, wave: 'square', base: 220, notes: [0, 0, 7, 0, 3, 0, 7, 5, 0, 0, 7, 0, 10, 7, 5, 3], bass: [0, 0, 3, 3] },
    boss:   { tempo: 160, wave: 'sawtooth', base: 196, notes: [0, 3, 0, 6, 0, 3, 0, 7, 0, 3, 0, 6, 10, 7, 6, 3], bass: [0, 0, -2, -2] },
    victory:{ tempo: 260, wave: 'triangle', base: 262, notes: [0, 4, 7, 12, 12, 7, 12, 16, 12, 7, 4, 7, 12, 12, 12, 12], bass: [0, 5, 0, 5] }
  };
  function freq(base, semi) { return base * Math.pow(2, semi / 12); }

  function playNote(f, dur, wave, gain, when) {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = wave; o.frequency.value = f;
    const t = when || ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(musicGain);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function schedule() {
    if (!curTrack || !musicOn || muted) { seqTimer = null; return; }
    const T = TRACKS[curTrack];
    const semi = T.notes[step % T.notes.length];
    const dur = T.tempo / 1000 * 0.9;
    playNote(freq(T.base, semi), dur, T.wave, 0.5);
    if (step % 4 === 0) {
      const b = T.bass[(step / 4) % T.bass.length];
      playNote(freq(T.base / 2, b), dur * 3.5, 'triangle', 0.35);
    }
    step++;
    seqTimer = setTimeout(schedule, T.tempo);
  }

  function setMusic(name) {
    if (curTrack === name) return;
    curTrack = name; step = 0;
    if (seqTimer) { clearTimeout(seqTimer); seqTimer = null; }
    if (ensure() && name && TRACKS[name] && musicOn && !muted) { resume(); schedule(); }
  }
  function stopMusic() { curTrack = null; if (seqTimer) { clearTimeout(seqTimer); seqTimer = null; } }

  function sfx(name) {
    if (!sfxOn || muted || !ensure()) return;
    resume();
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(sfxGain);
    let f0 = 440, f1 = 440, dur = 0.1, wave = 'square', vol = 0.3;
    switch (name) {
      case 'menu': f0 = 660; f1 = 660; dur = 0.04; vol = 0.15; break;
      case 'confirm': f0 = 520; f1 = 780; dur = 0.08; wave = 'triangle'; break;
      case 'cancel': f0 = 400; f1 = 260; dur = 0.08; wave = 'triangle'; break;
      case 'hit': f0 = 220; f1 = 90; dur = 0.12; wave = 'sawtooth'; vol = 0.35; break;
      case 'crit': f0 = 320; f1 = 60; dur = 0.18; wave = 'sawtooth'; vol = 0.4; break;
      case 'heal': f0 = 520; f1 = 880; dur = 0.2; wave = 'sine'; vol = 0.3; break;
      case 'bind': f0 = 300; f1 = 900; dur = 0.4; wave = 'sine'; vol = 0.35; break;
      case 'level': f0 = 440; f1 = 1320; dur = 0.35; wave = 'triangle'; vol = 0.35; break;
      case 'quest': f0 = 523; f1 = 1046; dur = 0.3; wave = 'triangle'; vol = 0.3; break;
      case 'chest': f0 = 392; f1 = 784; dur = 0.25; wave = 'triangle'; vol = 0.3; break;
      case 'hurt': f0 = 180; f1 = 70; dur = 0.15; wave = 'square'; vol = 0.3; break;
      case 'flee': f0 = 600; f1 = 200; dur = 0.2; wave = 'triangle'; break;
      case 'summon': f0 = 200; f1 = 1200; dur = 0.5; wave = 'sawtooth'; vol = 0.35; break;
      case 'step': f0 = 120; f1 = 90; dur = 0.03; wave = 'triangle'; vol = 0.06; break;
      case 'error': f0 = 200; f1 = 150; dur = 0.12; wave = 'square'; vol = 0.2; break;
    }
    o.type = wave;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.5; if (!muted && curTrack) setMusic(curTrack); return muted; }
  function setMusicOn(v) { musicOn = v; if (!v) stopMusic(); else if (curTrack) { const n = curTrack; curTrack = null; setMusic(n); } }
  function setSfxOn(v) { sfxOn = v; }

  return { ensure, resume, setMusic, stopMusic, sfx, toggleMute, setMusicOn, setSfxOn, isMuted: () => muted };
})();

/* ---------------- ENGINE ---------------- */
SB.ENGINE = (function () {
  'use strict';
  const W = SB.WORLD, SPR = SB.SPR, D = SB.DATA;
  const VIEW_W = 480, VIEW_H = 320, TILE = 16;
  let canvas, ctx, last = 0, acc = 0;
  const keys = {};
  let pressed = {};
  const cam = { x: 0, y: 0 };
  let fade = 0, fadeDir = 0, fadeCb = null;
  const particles = [];
  let shake = 0;

  function init(cv) {
    canvas = cv; ctx = cv.getContext('2d');
    canvas.width = VIEW_W; canvas.height = VIEW_H;
    ctx.imageSmoothingEnabled = false;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  }

  function norm(e) {
    const k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') return 'up';
    if (k === 'ArrowDown' || k === 's' || k === 'S') return 'down';
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') return 'left';
    if (k === 'ArrowRight' || k === 'd' || k === 'D') return 'right';
    if (k === 'z' || k === 'Z' || k === 'Enter' || k === ' ') return 'confirm';
    if (k === 'x' || k === 'X' || k === 'Escape') return 'cancel';
    if (k === 'Shift') return 'run';
    if (k === 'm' || k === 'M') return 'mute';
    if (k === 'c' || k === 'C') return 'char';
    if (k === 'b' || k === 'B') return 'beasts';
    if (k === 'g' || k === 'G') return 'gear';
    if (k === 'i' || k === 'I') return 'bag';
    if (k === 'q' || k === 'Q') return 'quests';
    return null;
  }

  function onKeyDown(e) {
    const ae = document.activeElement;
    if (ae && ae.tagName === 'INPUT') {
      if (e.key === 'Escape' || e.key === 'Enter') { ae.blur(); e.preventDefault(); }
      return; // let the text field handle typing
    }
    const n = norm(e);
    if (!n) return;
    if (['up', 'down', 'left', 'right', 'confirm', 'cancel', ' '].includes(n) || e.key === ' ') e.preventDefault();
    SB.AUDIO.ensure(); SB.AUDIO.resume();
    if (!keys[n]) pressed[n] = true;
    keys[n] = true;
    // discrete dispatch
    const G = SB.G;
    if (n === 'mute') { const m = SB.AUDIO.toggleMute(); SB.UI.toast(m ? 'Sound muted' : 'Sound on'); return; }
    if (G.mode === 'title') SB.UI.titleKey(n);
    else if (G.mode === 'create') SB.UI.createKey(n);
    else if (G.mode === 'dialogue') SB.UI.dialogueKey(n);
    else if (G.mode === 'battle') SB.BATTLE.key(n);
    else if (G.mode === 'menu') SB.UI.menuKey(n);
    else if (G.mode === 'shop') SB.UI.shopKey(n);
    else if (G.mode === 'gameover') SB.UI.gameoverKey(n);
    else if (G.mode === 'world') worldKey(n);
  }
  function onKeyUp(e) { const n = norm(e); if (n) keys[n] = false; }
  function consume(n) { const v = pressed[n]; pressed[n] = false; return v; }

  function worldKey(n) {
    const G = SB.G;
    if (G.moving || fadeDir !== 0) return;
    if (n === 'confirm') interact();
    else if (n === 'cancel') SB.UI.openMenu('main');
    else if (n === 'char' || n === 'gear') SB.UI.openMenu('gear');
    else if (n === 'beasts') SB.UI.openMenu('beasts');
    else if (n === 'bag') SB.UI.openMenu('bag');
    else if (n === 'quests') SB.UI.openMenu('quests');
  }

  /* ---------- movement ---------- */
  const DIRV = [[0, 1], [-1, 0], [1, 0], [0, -1]]; // down,left,right,up
  function dirFromInput() {
    if (keys.up) return 3; if (keys.down) return 0; if (keys.left) return 1; if (keys.right) return 2; return -1;
  }

  function tryMove(dir) {
    const G = SB.G;
    G.dir = dir;
    if (G.moving) return;
    const [dx, dy] = DIRV[dir];
    const tx = G.x + dx, ty = G.y + dy;
    // NPC bump
    if (W.npcAt(G.map, tx, ty)) return;
    // boss bump
    if (W.bossBlocks(G.map, tx, ty, G.flags)) { const e = W.eventAt(G.map, tx, ty); SB.MAIN.startBoss(e); return; }
    if (W.isSolid(G.map, tx, ty)) return;
    G.moving = true; G.moveT = 0; G.fx = G.x; G.fy = G.y; G.tx = tx; G.ty = ty;
    G.walkFrame = (G.walkFrame + 1) % 2;
  }

  function finishMove() {
    const G = SB.G;
    G.x = G.tx; G.y = G.ty; G.moving = false;
    G.time = (G.time + 0.4) % 1440;
    SB.MAIN.onReach(G.map, G.x, G.y);
    // transition
    const tr = W.transitionAt(G.map, G.x, G.y);
    if (tr) {
      if (tr.req && !hasItem(tr.req)) { SB.UI.toast(tr.msg || 'It is sealed.'); SB.AUDIO.sfx('error'); return; }
      if (tr.req) removeItem(tr.req);
      changeMap(tr.to, tr.tx, tr.ty);
      return;
    }
    // encounter
    const ch = W.tileAt(G.map, G.x, G.y);
    const tp = W.TILES[ch];
    const m = W.MAPS[G.map];
    if (tp && tp.enc && m.encounters) {
      if (Math.random() < m.encounters.rate) { SB.MAIN.startWildEncounter(); return; }
    }
    // dungeon floor encounters
    if (!m.outdoor && m.encounters && (ch === 'F' || ch === 'r')) {
      if (Math.random() < m.encounters.rate * 0.6) { SB.MAIN.startWildEncounter(); return; }
    }
  }

  function hasItem(id) { return (SB.G.bag[id] || 0) > 0; }
  function removeItem(id) { if (SB.G.bag[id]) { SB.G.bag[id]--; if (SB.G.bag[id] <= 0) delete SB.G.bag[id]; } }

  function interact() {
    const G = SB.G;
    const [dx, dy] = DIRV[G.dir];
    const fx = G.x + dx, fy = G.y + dy;
    // NPC
    const npc = W.npcAt(G.map, fx, fy);
    if (npc) { SB.MAIN.talkTo(npc); return; }
    // event on faced tile
    let e = W.eventAt(G.map, fx, fy);
    if (e) { SB.MAIN.interactEvent(e); return; }
    // event on standing tile (herb)
    e = W.eventAt(G.map, G.x, G.y);
    if (e) { SB.MAIN.interactEvent(e); return; }
    // tile action
    const ch = W.tileAt(G.map, fx, fy);
    const tp = W.TILES[ch];
    if (tp && tp.act) SB.MAIN.tileAction(tp.act, fx, fy);
  }

  function changeMap(to, tx, ty) {
    fadeOut(() => {
      const G = SB.G;
      G.map = to; G.x = tx; G.y = ty; G.moving = false; G.dir = 0;
      const m = W.MAPS[to];
      SB.AUDIO.setMusic(m.music);
      SB.MAIN.onReach(to, tx, ty);
      SB.MAIN.autosave();
      fadeIn();
    });
  }
  function fadeOut(cb) { fadeDir = 1; fadeCb = cb; }
  function fadeIn() { fadeDir = -1; }

  /* ---------- particles ---------- */
  function spawn(x, y, opts) {
    particles.push(Object.assign({ x, y, vx: 0, vy: 0, life: 1, max: 1, color: '#fff', size: 2, grav: 0 }, opts));
  }
  function burst(x, y, color, n, spd) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = (0.3 + Math.random()) * (spd || 1);
      spawn(x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6 + Math.random() * 0.4, max: 1, color, size: 1 + (Math.random() * 2 | 0), grav: 0.02 });
    }
  }
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += p.grav; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  /* ---------- update ---------- */
  function update(dt) {
    const G = SB.G;
    if (fadeDir !== 0) {
      fade += fadeDir * dt * 3;
      if (fade >= 1 && fadeDir === 1) { fade = 1; fadeDir = 0; if (fadeCb) { const cb = fadeCb; fadeCb = null; cb(); } }
      if (fade <= 0 && fadeDir === -1) { fade = 0; fadeDir = 0; }
    }
    if (shake > 0) shake = Math.max(0, shake - dt * 30);
    updateParticles(dt);
    if (G.mode === 'battle') { SB.BATTLE.update(dt); return; }
    if (G.mode !== 'world') return;
    if (G.moving) {
      const spd = keys.run ? 7 : 4.5;
      G.moveT += dt * spd;
      if (G.moveT >= 1) { G.moveT = 1; finishMove(); }
    } else if (fadeDir === 0) {
      const d = dirFromInput();
      if (d >= 0) tryMove(d);
      else G.walkFrame = 0;
    }
    // time flows
    G.time = (G.time + dt * 1.2) % 1440;
    G.playtime += dt;
    // fireflies at night near pond
    const m = W.MAPS[G.map];
    if (m.outdoor && isNight() && G.map === 'emberwood' && Math.random() < 0.15) {
      spawn(22 * 16 + Math.random() * 11 * 16, 20 * 16 + Math.random() * 12 * 16, { vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, life: 1.5, max: 1.5, color: '#ffd94a', size: 1 });
    }
  }

  function isNight() { const t = SB.G.time; return t < 330 || t > 1170; }
  function darkness() {
    const t = SB.G.time;
    if (t >= 390 && t <= 1080) return 0; // day
    if (t > 1080 && t < 1200) return (t - 1080) / 120 * 0.5; // dusk
    if (t > 300 && t < 390) return (1 - (t - 300) / 90) * 0.5; // dawn
    return 0.5;
  }

  /* ---------- render ---------- */
  function playerPixel() {
    const G = SB.G;
    let px = G.x * TILE, py = G.y * TILE;
    if (G.moving) { px = (G.fx + (G.tx - G.fx) * G.moveT) * TILE; py = (G.fy + (G.ty - G.fy) * G.moveT) * TILE; }
    return { px, py };
  }

  function render() {
    const G = SB.G;
    ctx.fillStyle = '#101018'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (G.mode === 'battle') { SB.BATTLE.render(ctx); }
    else if (G.mode === 'world' || G.mode === 'dialogue' || G.mode === 'menu' || G.mode === 'shop') { renderWorld(); }
    else if (G.mode === 'title' || G.mode === 'create' || G.mode === 'gameover') { renderTitleBG(); }
    // fade
    if (fade > 0) { ctx.fillStyle = 'rgba(5,5,10,' + fade + ')'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
  }

  function renderTitleBG() {
    const t = performance.now() / 1000;
    const grd = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    grd.addColorStop(0, '#1a1428'); grd.addColorStop(0.6, '#2a1a20'); grd.addColorStop(1, '#3a2018');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // drifting embers
    for (let i = 0; i < 40; i++) {
      const x = (i * 97 + t * 20 * (1 + i % 3)) % VIEW_W;
      const y = VIEW_H - ((i * 53 + t * 30 * (1 + i % 2)) % VIEW_H);
      ctx.fillStyle = i % 3 === 0 ? '#ff9a5a' : '#ffd94a';
      ctx.globalAlpha = 0.3 + 0.3 * Math.sin(t + i);
      ctx.fillRect(x | 0, y | 0, 2, 2);
    }
    ctx.globalAlpha = 1;
    // big flame silhouette
    const fx = VIEW_W / 2, fy = VIEW_H * 0.72;
    for (let i = 0; i < 3; i++) {
      const h = 60 + i * 20 + Math.sin(t * 2 + i) * 6;
      ctx.fillStyle = ['#3a1a10', '#5a2a14', '#7a3a1a'][i];
      ctx.beginPath(); ctx.ellipse(fx, fy, 40 - i * 10, h / 2, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawGlyph(ctx, g, x, y) {
    if (g === '!') { ctx.fillRect(x - 1, y, 2, 5); ctx.fillRect(x - 1, y + 6, 2, 2); }
    else { ctx.fillRect(x - 2, y, 4, 1); ctx.fillRect(x + 1, y + 1, 1, 2); ctx.fillRect(x - 1, y + 3, 2, 1); ctx.fillRect(x - 1, y + 4, 1, 1); ctx.fillRect(x - 1, y + 6, 1, 1); }
  }

  function renderWorld() {
    const G = SB.G, m = W.MAPS[G.map];
    const { px, py } = playerPixel();
    const mapW = m.w * TILE, mapH = m.h * TILE;
    cam.x = Math.max(0, Math.min(px + 8 - VIEW_W / 2, mapW - VIEW_W));
    cam.y = Math.max(0, Math.min(py + 12 - VIEW_H / 2, mapH - VIEW_H));
    if (mapW < VIEW_W) cam.x = (mapW - VIEW_W) / 2;
    if (mapH < VIEW_H) cam.y = (mapH - VIEW_H) / 2;
    let sx = 0, sy = 0;
    if (shake > 0) { sx = (Math.random() - 0.5) * shake; sy = (Math.random() - 0.5) * shake; }
    ctx.save();
    ctx.translate((-cam.x + sx) | 0, (-cam.y + sy) | 0);

    const x0 = Math.max(0, (cam.x / TILE | 0) - 1), y0 = Math.max(0, (cam.y / TILE | 0) - 1);
    const x1 = Math.min(m.w - 1, ((cam.x + VIEW_W) / TILE | 0) + 1), y1 = Math.min(m.h - 1, ((cam.y + VIEW_H) / TILE | 0) + 1);
    const animT = performance.now() / 400 | 0;
    // tiles
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const ch = m.grid[y][x];
      const tp = W.TILES[ch] || W.TILES[' '];
      let variant = (x * 7 + y * 13) % 4;
      if (ch === '~' || ch === 'd') variant = animT % 3;
      const img = SPR.drawTile(tp.t, variant);
      ctx.drawImage(img, x * TILE, y * TILE);
    }
    // event overlays (chest state, herbs picked, bosses)
    for (const e of m.events) {
      if (e.x < x0 - 1 || e.x > x1 + 1 || e.y < y0 - 1 || e.y > y1 + 1) continue;
      if (e.type === 'chest' && G.flags[e.flag]) ctx.drawImage(SPR.drawTile('chestopen', 0), e.x * TILE, e.y * TILE);
      if (e.type === 'boss' && !G.flags[e.flag]) {
        const img = SPR.drawBeast(e.sp, animT % 2);
        const s = D.SPECIES[e.sp].boss ? 28 : 20;
        ctx.drawImage(img, e.x * TILE + 8 - s / 2, e.y * TILE + 12 - s, s, s);
        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(e.x * TILE + 2, e.y * TILE + 12, 12, 3);
      }
      if (e.type === 'herb' && G.flags['herb_' + G.map + '_' + e.x + '_' + e.y]) {
        ctx.drawImage(SPR.drawTile('grass', 0), e.x * TILE, e.y * TILE);
      }
    }
    // NPCs + player sorted by y
    const drawables = [];
    for (const n of m.npcs) drawables.push({ y: n.y, kind: 'npc', n });
    drawables.push({ y: G.moving ? (G.fy + (G.ty - G.fy) * G.moveT) : G.y, kind: 'player' });
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) {
      if (d.kind === 'npc') {
        const n = d.n;
        const img = SPR.drawNPC(n.id, n.dir, 0);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(n.x * TILE + 3, n.y * TILE + 21, 10, 3);
        ctx.drawImage(img, n.x * TILE, n.y * TILE - 8);
        const marker = SB.MAIN.questMarker(n.id);
        if (marker) {
          const bob = Math.round(Math.sin(performance.now() / 250) * 2);
          const mx = n.x * TILE + 8, my = n.y * TILE - 18 + bob;
          ctx.fillStyle = 'rgba(0,0,0,0.65)'; drawGlyph(ctx, marker, mx + 1, my + 1);
          ctx.fillStyle = marker === '!' ? '#ffd94a' : '#9fd4ff'; drawGlyph(ctx, marker, mx, my);
        }
      } else {
        const { px: ppx, py: ppy } = playerPixel();
        const frame = G.moving ? (G.walkFrame + 1) : 0;
        const img = SPR.drawHero(G.hero.look, G.hero, G.dir, frame);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(ppx + 3, ppy + 21, 10, 3);
        ctx.drawImage(img, ppx, ppy - 8);
      }
    }
    // particles (world space)
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color; ctx.fillRect(p.x | 0, p.y | 0, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // day/night tint (screen space)
    if (m.outdoor) {
      const dk = darkness();
      if (dk > 0) { ctx.fillStyle = 'rgba(15,20,55,' + dk + ')'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
      // lantern glow at night
      if (dk > 0.2) {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          if (m.grid[y][x] === 'L') {
            const gx = x * TILE + 8 - cam.x, gy = y * TILE + 5 - cam.y;
            const grd = ctx.createRadialGradient(gx, gy, 2, gx, gy, 34);
            grd.addColorStop(0, 'rgba(255,190,110,0.35)'); grd.addColorStop(1, 'rgba(255,190,110,0)');
            ctx.fillStyle = grd; ctx.fillRect(gx - 34, gy - 34, 68, 68);
          }
        }
      }
    }
    // HUD
    renderHUD();
  }

  function renderHUD() {
    const G = SB.G;
    // top-left location + time
    ctx.font = '10px monospace'; ctx.textAlign = 'left';
    const m = W.MAPS[G.map];
    ctx.fillStyle = 'rgba(10,10,18,0.6)'; ctx.fillRect(4, 4, 150, 26);
    ctx.fillStyle = '#ffd9a0'; ctx.fillText(m.name, 10, 15);
    const hh = String(Math.floor(G.time / 60)).padStart(2, '0'), mm = String(Math.floor(G.time % 60)).padStart(2, '0');
    ctx.fillStyle = isNight() ? '#9fb8ff' : '#ffe89a';
    ctx.fillText((isNight() ? '☾ ' : '☀ ') + hh + ':' + mm, 10, 26);
    // gold
    ctx.fillStyle = 'rgba(10,10,18,0.6)'; ctx.fillRect(VIEW_W - 90, 4, 86, 14);
    ctx.fillStyle = '#ffd94a'; ctx.textAlign = 'right'; ctx.fillText('◈ ' + G.hero.gold, VIEW_W - 10, 15);
    ctx.textAlign = 'left';
    // tracked quest
    const tq = SB.MAIN.trackedQuestText();
    if (tq) {
      ctx.fillStyle = 'rgba(10,10,18,0.55)'; ctx.fillRect(4, VIEW_H - 20, Math.min(VIEW_W - 8, tq.length * 6 + 16), 16);
      ctx.fillStyle = '#9fd4ff'; ctx.font = '9px monospace'; ctx.fillText('▸ ' + tq, 10, VIEW_H - 9);
    }
  }

  /* ---------- loop ---------- */
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    update(dt);
    render();
    pressed = {};
    requestAnimationFrame(frame);
  }
  function start() { last = performance.now(); requestAnimationFrame(frame); }

  return { init, start, keys, consume, cam, changeMap, fadeOut, fadeIn, spawn, burst, shake: (v) => shake = v, isNight, darkness, VIEW_W, VIEW_H, TILE, playerPixel, interact, tryMove };
})();
