/* Звук рождается прямо в браузере, файлы не нужны.
   На суше поют птицы, у воды слышно подводный мир, нажатия звучат мягкими нотами и ветерком.
   Каждый раз ноты и птичьи песни выбираются заново, поэтому звук не повторяется. */
(function () {
  const S = { on: true, ctx: null, master: null, wet: null, amb: null, kind: "birds", lastNote: -1, unlocked: false };
  try { const v = localStorage.getItem("zoo8:sound"); if (v != null) S.on = v === "1"; } catch (e) {}
  const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51]; // пентатоника до мажор

  function ctx() {
    if (!S.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      const c = S.ctx = new AC();
      S.master = c.createGain(); S.master.gain.value = 0.55; S.master.connect(c.destination);
      // мягкое эхо: делает ноты тёплыми и не резкими
      S.wet = c.createGain(); S.wet.gain.value = 0.22;
      const d1 = c.createDelay(); d1.delayTime.value = 0.19;
      const fb = c.createGain(); fb.gain.value = 0.32;
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2400;
      S.wet.connect(d1); d1.connect(lp); lp.connect(fb); fb.connect(d1); lp.connect(S.master);
    }
    if (S.ctx.state === "suspended") S.ctx.resume();
    return S.ctx;
  }
  const out = (node, wet) => { node.connect(S.master); if (wet) node.connect(S.wet); };

  function note(freq, opt) {
    const c = ctx(); if (!c || !S.on) return;
    const o = opt || {}, t = c.currentTime + (o.delay || 0), dur = o.dur || 1.1, vol = o.vol || 0.12;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const a = c.createOscillator(); a.type = "sine"; a.frequency.value = freq;
    const b = c.createOscillator(); b.type = "triangle"; b.frequency.value = freq * 2.01;
    const bg = c.createGain(); bg.gain.value = 0.18;
    a.connect(g); b.connect(bg); bg.connect(g);
    let node = g;
    if (o.pan != null && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = o.pan; g.connect(p); node = p; }
    out(node, true);
    a.start(t); b.start(t); a.stop(t + dur + 0.05); b.stop(t + dur + 0.05);
  }
  function randomNote(shift) {
    let i; do { i = Math.floor(Math.random() * SCALE.length); } while (i === S.lastNote);
    S.lastNote = i;
    return SCALE[i] * (shift || 1);
  }
  function noise(dur, opt) {
    const c = ctx(); if (!c || !S.on) return;
    const o = opt || {}, t = c.currentTime + (o.delay || 0);
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = o.type || "bandpass"; f.Q.value = o.q || 0.7;
    f.frequency.setValueAtTime(o.from || 500, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.05, t + (o.attack || dur * 0.4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); out(g, false);
    src.start(t); src.stop(t + dur);
  }
  function chirp(f0, f1, dur, opt) {
    const c = ctx(); if (!c || !S.on) return;
    const o = opt || {}, t = c.currentTime + (o.delay || 0);
    const osc = c.createOscillator(); osc.type = "sine";
    osc.frequency.setValueAtTime(f0, t); osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || 0.03, t + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = g;
    if (o.pan != null && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = o.pan; g.connect(p); node = p; }
    osc.connect(g); out(node, true);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  /* Птичьи песни: каждый раз случайный «вид» и рисунок */
  function birdSong() {
    const pan = Math.random() * 1.6 - 0.8, kind = Math.floor(Math.random() * 4), base = 2300 + Math.random() * 1500;
    if (kind === 0) { // трель
      const n = 5 + Math.floor(Math.random() * 6);
      for (let i = 0; i < n; i++) chirp(base * (i % 2 ? 1.12 : 1), base * (i % 2 ? 1.25 : 1.05), 0.07, { delay: i * 0.075, pan, vol: 0.022 });
    } else if (kind === 1) { // свист «фиу-фиу»
      chirp(base * 0.8, base * 1.25, 0.22, { pan, vol: 0.026 });
      chirp(base * 1.2, base * 0.85, 0.26, { delay: 0.32, pan, vol: 0.024 });
    } else if (kind === 2) { // переливы
      for (let i = 0; i < 4; i++) { const f = base * (1 + Math.random() * 0.35); chirp(f, f * (0.85 + Math.random() * 0.4), 0.12, { delay: i * 0.15, pan, vol: 0.02 }); }
    } else { // короткие «чик-чирик»
      chirp(base * 1.3, base, 0.06, { pan, vol: 0.024 }); chirp(base * 1.1, base * 1.4, 0.09, { delay: 0.1, pan, vol: 0.022 });
    }
  }

  function stopAmb() {
    if (!S.amb) return;
    clearTimeout(S.amb.timer);
    try { S.amb.gain.gain.setTargetAtTime(0.0001, S.ctx.currentTime, 0.4); const src = S.amb.src; setTimeout(() => { try { src.stop(); } catch (e) {} }, 1500); } catch (e) {}
    S.amb = null;
  }
  function startAmb() {
    stopAmb();
    if (!S.on || !S.unlocked || S.kind === "quiet") return;
    const c = ctx(); if (!c) return;
    const len = c.sampleRate * 4, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = S.kind === "water" ? 360 : 520;
    const gain = c.createGain(); gain.gain.value = 0.0001;
    gain.gain.setTargetAtTime(S.kind === "water" ? 0.2 : 0.035, c.currentTime, 0.8);
    const lfo = c.createOscillator(); lfo.frequency.value = S.kind === "water" ? 0.08 : 0.12;
    const lfoG = c.createGain(); lfoG.gain.value = S.kind === "water" ? 60 : 160;
    lfo.connect(lfoG); lfoG.connect(f.frequency); lfo.start();
    src.connect(f); f.connect(gain); gain.connect(S.master); src.start();
    const amb = S.amb = { src, gain, timer: 0 };
    const kind = S.kind;
    (function loop() {
      if (S.amb !== amb) return;
      if (kind === "water") { if (Math.random() < 0.7) fx.bubble(); amb.timer = setTimeout(loop, 500 + Math.random() * 1400); }
      else { birdSong(); amb.timer = setTimeout(loop, 1600 + Math.random() * 3200); }
    })();
  }

  const fx = {
    click() { note(randomNote(), { vol: 0.08, dur: 0.9 }); },
    flip() { note(randomNote(), { vol: 0.09, dur: 1.2 }); noise(0.5, { from: 400, to: 1400, vol: 0.025, attack: 0.18 }); },
    slide() { noise(0.9, { from: 300, to: 1100, vol: 0.035, attack: 0.35, q: 0.5 }); note(randomNote(0.5), { vol: 0.05, dur: 1.4, delay: 0.08 }); },
    correct() { const f = randomNote(); note(f, { vol: 0.1 }); note(f * 1.5, { vol: 0.09, delay: 0.13 }); },
    wrong() { note(261.63 * (Math.random() < 0.5 ? 1 : 0.89), { vol: 0.08, dur: 0.7 }); },
    found() { const s = Math.floor(Math.random() * 3); for (let i = 0; i < 4; i++) note(SCALE[s + i], { vol: 0.09, delay: i * 0.09 }); },
    fanfare() { for (let i = 0; i < SCALE.length; i++) note(SCALE[i], { vol: 0.08, delay: i * 0.1, dur: 1.4 }); },
    stamp() { note(randomNote(0.5), { vol: 0.08, dur: 0.6 }); noise(0.12, { type: "lowpass", from: 900, vol: 0.04, attack: 0.01 }); },
    tear() { noise(0.45, { type: "highpass", from: 2000, vol: 0.035, attack: 0.05 }); },
    tick() { note(randomNote(2), { vol: 0.025, dur: 0.25 }); },
    bubble() { chirp(260 + Math.random() * 200, 700 + Math.random() * 500, 0.12, { vol: 0.05, pan: Math.random() * 1.4 - 0.7 }); },
    chomp() { chirp(300, 900, 0.15, { vol: 0.08 }); note(randomNote(), { vol: 0.07, delay: 0.05 }); }
  };

  function unlock() {
    if (S.unlocked) return;
    S.unlocked = true;
    if (S.on) { ctx(); startAmb(); }
  }
  ["pointerdown", "keydown", "touchstart"].forEach((e) => addEventListener(e, unlock, { once: false, passive: true }));

  window.Sound = {
    get on() { return S.on; },
    toggle(v) {
      S.on = v == null ? !S.on : !!v;
      try { localStorage.setItem("zoo8:sound", S.on ? "1" : "0"); } catch (e) {}
      if (S.on) { ctx(); S.unlocked = true; startAmb(); fx.click(); } else stopAmb();
      return S.on;
    },
    ambient(kind) { if (kind === S.kind) return; S.kind = kind; if (S.on && S.unlocked) startAmb(); },
    play(name) { try { if (fx[name]) fx[name](); } catch (e) {} }
  };
})();
