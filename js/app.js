/* Ядро: слайды со стрелками, масштаб сцены, карта, штампы, панель учителя. */
(function () {
  document.documentElement.classList.add("js");
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const CFG = window.ZOO_CONFIG || {};
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem("zoo8:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("zoo8:" + k, JSON.stringify(v)); } catch (e) {} }
  };
  const App = window.App = { $, $$, store, reduced, index: 0, slideId: "", listeners: [], scale: 1 };
  const stage = $("#stage"), slides = $$(".slide");
  const meta = Object.fromEntries(ZOO.slides.map((s) => [s.id, s]));
  const zones = ZOO.zones;

  /* ---------- Масштаб сцены под экран ----------
     Компьютер и проектор: сцена 1280×720 масштабируется целиком.
     Телефон вертикально: своя раскладка, слайд прокручивается сам (тот же запрос, что в style.css). */
  const PHONE = matchMedia("(max-width: 900px) and (orientation: portrait)");
  function fit() {
    App.phone = PHONE.matches;
    const s = App.phone ? 1 : Math.min(innerWidth / 1280, innerHeight / 720);
    App.scale = s;
    stage.style.setProperty("--scale", s.toFixed(4));
    document.dispatchEvent(new CustomEvent("zoo:fit"));
  }
  addEventListener("resize", fit); fit();
  /* перевод координат экрана в координаты элемента на сцене */
  App.local = (e, el) => { const r = el.getBoundingClientRect(); return { x: (e.clientX - r.left) / App.scale, y: (e.clientY - r.top) / App.scale, w: r.width / App.scale, h: r.height / App.scale }; };

  /* ---------- Тост и конфетти ---------- */
  let toastT;
  App.toast = (msg) => { const t = $("#toast"); t.textContent = msg; t.classList.add("is-on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("is-on"), 2400); };
  App.confetti = (amount) => {
    if (reduced) return;
    const cv = $("#confetti"); cv.hidden = false;
    const cx = cv.getContext("2d"), W = stage.clientWidth, H = stage.clientHeight; cv.width = W; cv.height = H;
    const colors = ["#E9CF9A", "#EBD3C1", "#D6E7EA", "#C7825F", "#4C7A3E", "#FBF8F1", "#A8485A"];
    const parts = Array.from({ length: amount || 140 }, () => ({ x: W / 2 + (Math.random() - 0.5) * Math.min(600, W * 0.8), y: H * 0.39, vx: (Math.random() - 0.5) * 13, vy: -Math.random() * 13 - 4, w: 8 + Math.random() * 9, h: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: colors[(Math.random() * colors.length) | 0] }));
    let f = 0;
    (function loop() {
      cx.clearRect(0, 0, W, H);
      parts.forEach((p) => { p.vy += 0.34; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2))); cx.restore(); });
      if (++f < 200) requestAnimationFrame(loop); else { cx.clearRect(0, 0, W, H); cv.hidden = true; }
    })();
  };

  /* ---------- Настройки и штрихкод ---------- */
  $$("[data-cfg]").forEach((el) => { const v = CFG[el.dataset.cfg]; if (v) el.textContent = v; });
  (function barcode() {
    let x = 0, seed = 8, out = ""; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    while (x < 220) { const w = 1 + Math.floor(rnd() * 4); if (rnd() > 0.38) out += `<rect x="${x}" y="0" width="${w}" height="34"/>`; x += w + 1; }
    $("#barcode").innerHTML = out;
  })();

  /* ---------- Маршрут и штампы (по вольерам) ---------- */
  const zoneIndex = (name) => zones.findIndex((z) => z.name === name);
  $("#route").innerHTML = zones.map((z, i) => `<button class="bar__dot" type="button" data-zone="${i}" aria-label="${z.name}" title="${z.name}"></button>`).join("");
  let seen = new Set(store.get("seenZones", []));
  function updateStamps() {
    const n = seen.size, t = zones.length;
    $("#mapCount").textContent = `Штампы: ${n} из ${t}`;
    $("#byeStamps").textContent = `Штампов в паспорте: ${n} из ${t}`;
    $$(".bar__dot").forEach((d) => d.classList.toggle("is-seen", seen.has(+d.dataset.zone)));
  }
  function stamp(zi) {
    if (seen.has(zi)) return;
    seen.add(zi); store.set("seenZones", Array.from(seen)); updateStamps();
    if (zi > 0) { App.toast(`Штамп в паспорт: ${zones[zi].name}`); Sound.play("stamp"); }
    if (seen.size === zones.length) setTimeout(() => { App.toast("Все штампы собраны!"); App.confetti(180); Sound.play("fanfare"); }, 900);
  }
  updateStamps();
  $("#route").addEventListener("click", (e) => { const d = e.target.closest("[data-zone]"); if (d) goZone(+d.dataset.zone); });

  /* ---------- Появление элементов внутри слайда ---------- */
  slides.forEach((sl) => {
    let i = 0;
    $$(".title, h1, .entrance__lead, .rules__quote, .pt__task, .keeper__lead, .topic__text, .topic__goal, .zl__def, .zl__note, .zl__photo, .acc, .dv__figs, .legend, .cells, .adapt > li, .ec__lead, .scheme, .factors > div, .fox__end, .fox__center, .fox__info, .pg__lead, .pg__photo, .race, .answer, .gf__photo, .gf__lead, .gf__facts, .reach__svg, .camo__frame, .link, .links__out, .rel__list, .chain, .model, .mission, .player, .signs, .signs__quote, .zoos__photo, .zoos__list > li, .qz__app, .three > li, .three__note, .sum > li, .bye__title, .hw, .bye__where, .plaques > li, .wall, .pt__card, .keeper__art, .riddles, .entrance__photo, .school__ui", sl)
      .forEach((el) => { el.classList.add("rv"); el.style.setProperty("--i", i++); });
  });

  /* ---------- Переходы между слайдами ---------- */
  const ambientFor = { penguin: "water", links: "water", school: "water", relgame: "water", cinema: "quiet", quiz: "quiet" };
  let dwell;
  function apply(i, dir) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    const prev = slides[App.index], next = slides[i];
    if (prev && prev !== next && App.slideId) {
      prev.classList.remove("is-active", "is-enter-next", "is-enter-prev");
      prev.classList.add("is-leave"); setTimeout(() => prev.classList.remove("is-leave"), 560);
    }
    next.classList.remove("is-leave", "is-enter-next", "is-enter-prev");
    void next.offsetWidth;
    next.classList.add("is-active");
    if (dir) next.classList.add(dir > 0 ? "is-enter-next" : "is-enter-prev");
    App.index = i; App.slideId = next.id;
    const m = meta[next.id] || {};
    const cs = getComputedStyle(next);
    document.documentElement.style.setProperty("--page", cs.backgroundColor);
    stage.style.setProperty("--bar-fg", cs.color);
    $('meta[name="theme-color"]').setAttribute("content", cs.backgroundColor);
    $("#barZone").textContent = m.zone || "";
    const zi = zoneIndex(m.zone);
    $$(".bar__dot").forEach((d) => d.classList.toggle("is-here", +d.dataset.zone === zi));
    $("#progress").style.width = ((i + 1) / slides.length * 100).toFixed(1) + "%";
    $("#barCount").textContent = `${i + 1} / ${slides.length}`;
    if (App.phone) next.scrollTop = 0;
    $("#prev").disabled = i === 0; $("#next").disabled = i === slides.length - 1;
    history.replaceState(null, "", "#" + next.id);
    Sound.ambient(ambientFor[next.id] || "birds");
    renderTeacher();
    clearTimeout(dwell); dwell = setTimeout(() => { if (App.slideId === next.id && zi >= 0) stamp(zi); }, 1200);
    App.listeners.forEach((fn) => { try { fn(next.id, next, prev && prev.id); } catch (e) { console.error(e); } });
  }
  App.go = (i, silent) => { if (i === App.index) return; const dir = i > App.index ? 1 : -1; apply(i, dir); if (!silent) Sound.play("slide"); };
  App.next = () => App.go(Math.min(slides.length - 1, App.index + 1));
  App.prev = () => App.go(Math.max(0, App.index - 1));
  App.goId = (id) => { const i = slides.findIndex((s) => s.id === id); if (i >= 0) App.go(i); };
  function goZone(zi) { const s = ZOO.slides.find((x) => x.zone === zones[zi].name); if (s) App.goId(s.id); }
  App.onSlide = (fn) => App.listeners.push(fn);
  App.whenSlide = (el, on, off) => { const sl = el.closest(".slide"); App.onSlide((id, cur, prevId) => { if (id === sl.id) on && on(); else if (prevId === sl.id) off && off(); }); };
  $("#prev").addEventListener("click", App.prev);
  $("#next").addEventListener("click", App.next);

  /* Клавиатура */
  document.addEventListener("keydown", (e) => {
    const t = e.target, tag = (t.tagName || "").toLowerCase();
    if (tag === "textarea" || (tag === "input" && t.type !== "range") || t.isContentEditable) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (!$("#map").hidden) { if (k === "Escape" || /^[mMьЬ]$/.test(k)) { e.preventDefault(); closeMap(); } return; }
    if (tag === "input" && t.type === "range" && k.startsWith("Arrow")) return;
    if (App.phone && ["ArrowDown", "ArrowUp", "PageDown", "PageUp", " "].includes(k)) return;
    if (["ArrowRight", "ArrowDown", "PageDown"].includes(k) || (k === " " && tag !== "button" && tag !== "a")) { e.preventDefault(); App.next(); }
    else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(k)) { e.preventDefault(); App.prev(); }
    else if (k === "Home") { e.preventDefault(); App.go(0); }
    else if (k === "End") { e.preventDefault(); App.go(slides.length - 1); }
    else if (/^[mMьЬ]$/.test(k)) openMap();
    else if (/^[tTеЕ]$/.test(k)) toggleTeacher();
    else if (/^[sSыЫ]$/.test(k)) toggleSound();
    else if (/^[fFаА]$/.test(k)) toggleFull();
  });
  /* после перетаскивания ползунка стрелки снова листают слайды */
  $$('input[type="range"]').forEach((r) => r.addEventListener("pointerup", () => r.blur()));

  /* Колёсико мыши */
  let wheelLock = 0;
  addEventListener("wheel", (e) => {
    if (App.phone || e.target.closest(".teacher, .map")) return;
    if (Math.abs(e.deltaY) < 30 && Math.abs(e.deltaX) < 30) return;
    const now = Date.now(); if (now < wheelLock) return; wheelLock = now + 750;
    if ((e.deltaY || e.deltaX) > 0) App.next(); else App.prev();
  }, { passive: true });

  /* Свайп пальцем */
  let sx = 0, sy = 0, sOk = false;
  stage.addEventListener("touchstart", (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; sOk = !e.target.closest("canvas, input, .camo__frame, .map, .teacher, .player__track"); }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (!sOk) return; const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) { if (dx < 0) App.next(); else App.prev(); }
  }, { passive: true });

  function toggleFull() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen && document.exitFullscreen();
  }

  /* ---------- Звук ---------- */
  function syncSound() { $("#btnSound").setAttribute("aria-pressed", Sound.on ? "true" : "false"); $("#btnSound").textContent = Sound.on ? "Звук" : "Без звука"; }
  function toggleSound() { Sound.toggle(); syncSound(); App.toast(Sound.on ? "Звук включён" : "Звук выключен"); }
  $("#btnSound").addEventListener("click", toggleSound); syncSound();

  /* ---------- Билет ---------- */
  $("#ticket").classList.add("is-in");
  $("#enter").addEventListener("click", () => {
    const tk = $("#ticket");
    if (tk.classList.contains("is-torn")) { App.next(); return; }
    tk.classList.add("is-torn"); Sound.play("tear");
    setTimeout(() => Sound.play("stamp"), 320);
    stamp(0);
    setTimeout(() => App.next(), reduced ? 0 : 1200);
  });
  /* лёгкий наклон билета за курсором */
  if (!reduced && matchMedia("(hover: hover)").matches) {
    const tk = $("#ticket"), sl = $("#entrance");
    sl.addEventListener("pointermove", (e) => { const p = App.local(e, sl); tk.style.transform = `perspective(900px) rotateY(${((p.x / 1280 - 0.3) * 10).toFixed(2)}deg) rotateX(${((0.7 - p.y / 720) * 8).toFixed(2)}deg)`; });
    sl.addEventListener("pointerleave", () => { tk.style.transform = ""; });
  }

  /* ---------- Карта зоопарка ---------- */
  function catmull(pts) {
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]},${p2[1]}`;
    }
    return d;
  }
  function drawMap() {
    const pts = zones.map((z) => z.map);
    let seed = 3; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    let trees = "";
    for (let i = 0; i < 150; i++) {
      const x = rnd() * 1000, y = rnd() * 700;
      if (pts.some((p) => Math.abs(p[0] - x) < 105 && Math.abs(p[1] - y) < 55)) continue;
      trees += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(10 + rnd() * 18).toFixed(0)}" fill="${rnd() > 0.5 ? "#557A4F" : "#2F4A3A"}"/>`;
    }
    const water = `<path d="M560,420 C620,380 760,390 790,440 C820,500 720,540 640,520 C570,505 520,460 560,420 Z" fill="#8FB3BC"/><text x="672" y="470" text-anchor="middle" font-family="Onest, sans-serif" font-size="13" fill="#1F4F72" font-weight="700">пруд</text>`;
    const path = `<path d="${catmull(pts)}" fill="none" stroke="#E9D6AE" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>`;
    const cur = zoneIndex((meta[App.slideId] || {}).zone);
    const zs = zones.map((z, i) => {
      const [x, y] = z.map, w = Math.max(116, z.short.length * 10.5 + 42), h = 54, done = seen.has(i);
      return `<g class="map__zone" tabindex="0" role="link" data-zone="${i}" aria-label="${z.name}${done ? ", штамп получен" : ""}">
        <rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="27" fill="${z.field}" stroke="#2B2520" stroke-width="2"/>
        <text x="${x}" y="${y + 6}" text-anchor="middle" fill="${z.ink || "#2B2520"}">${z.short}</text>
        ${done ? `<g transform="translate(${x + w / 2 - 6},${y - h / 2 + 2}) rotate(-12)"><circle r="15" fill="#C7825F" stroke="#FBF8F1" stroke-width="2"/><path d="M-6,0 L-2,5 L7,-5" fill="none" stroke="#FBF8F1" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></g>` : ""}
        ${i === cur ? `<g class="map__me" transform="translate(${x},${y - h / 2 - 24})"><path d="M0,20 L-11,4 A13,13 0 1,1 11,4 Z" fill="#A8485A" stroke="#FBF8F1" stroke-width="2"/><circle cy="-4" r="4.5" fill="#FBF8F1"/></g>` : ""}
      </g>`;
    }).join("");
    $("#mapSvg").innerHTML = trees + water + path + zs + `<text x="40" y="650" fill="#FBF8F1" font-family="Unbounded, sans-serif" font-weight="700" font-size="20">Вход</text>`;
    $("#mapList").innerHTML = zones.map((z, i) => `<li><button class="map__item${i === cur ? " is-here" : ""}" type="button" data-zone="${i}" style="--zc:${z.field};--zi:${z.ink || "#2B2520"}"><span>${z.name}</span><b>${seen.has(i) ? "штамп ✓" : i === cur ? "вы здесь" : ""}</b></button></li>`).join("");
  }
  let lastFocus;
  function openMap() { lastFocus = document.activeElement; drawMap(); $("#map").hidden = false; Sound.play("flip"); $("#mapClose").focus(); }
  function closeMap() { $("#map").hidden = true; if (lastFocus) lastFocus.focus(); }
  App.openMap = openMap;
  $("#btnMap").addEventListener("click", openMap);
  $("#btnMap2").addEventListener("click", openMap);
  $("#mapClose").addEventListener("click", closeMap);
  $("#mapSvg").addEventListener("click", (e) => { const g = e.target.closest("[data-zone]"); if (g) { closeMap(); goZone(+g.dataset.zone); } });
  $("#mapList").addEventListener("click", (e) => { const g = e.target.closest("[data-zone]"); if (g) { closeMap(); goZone(+g.dataset.zone); } });
  $("#mapSvg").addEventListener("keydown", (e) => { if (e.key !== "Enter" && e.key !== " ") return; const g = e.target.closest("[data-zone]"); if (g) { e.preventDefault(); closeMap(); goZone(+g.dataset.zone); } });

  /* ---------- Панель учителя ---------- */
  const T = { start: store.get("lessonStart", null) };
  const fmt = (sec) => { sec = Math.max(0, Math.floor(sec)); return String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0"); };
  function renderTeacher() {
    const m = meta[App.slideId]; if (!m) return;
    const n = ZOO.notes[App.slideId] || {};
    $("#tStage").textContent = `Этап ${m.stage} из 8. ${ZOO.stages[m.stage]}`;
    $("#tStop").textContent = (slides[App.index].getAttribute("aria-label") || "") + ` (слайд ${App.index + 1} из ${slides.length})`;
    $("#tWindow").textContent = m.window;
    $("#tSpeech").textContent = (ZOO.speech || {})[App.slideId] || "";
    $("#tDo").textContent = n.do || ""; $("#tSay").textContent = n.say || ""; $("#tTip").textContent = n.tip || "";
    $("#tMedia").textContent = App.slideId === "cinema" ? (App.mediaNote || "") : "";
    tick();
  }
  App.renderTeacher = renderTeacher;
  function tick() {
    const el = $("#tLesson"); if (!el) return;
    if (!T.start) { el.textContent = "00:00"; el.classList.remove("is-late"); return; }
    const sec = (Date.now() - T.start) / 1000; el.textContent = fmt(sec);
    const m = meta[App.slideId]; const end = m ? parseFloat(m.window.split("-")[1]) : 45;
    el.classList.toggle("is-late", sec / 60 > end + 0.5);
  }
  setInterval(tick, 1000);
  $("#tStart").addEventListener("click", () => {
    if (T.start) { T.start = null; $("#tStart").textContent = "Старт урока"; } else { T.start = Date.now(); $("#tStart").textContent = "Сбросить"; }
    store.set("lessonStart", T.start); tick();
  });
  if (T.start) $("#tStart").textContent = "Сбросить";
  function toggleTeacher(force) { const p = $("#teacher"), show = force == null ? p.hidden : force; p.hidden = !show; $("#btnTeacher").setAttribute("aria-pressed", show ? "true" : "false"); if (show) renderTeacher(); }
  $("#btnTeacher").addEventListener("click", () => toggleTeacher());
  $("#tClose").addEventListener("click", () => toggleTeacher(false));

  /* ---------- Начать заново ---------- */
  $("#restart").addEventListener("click", () => {
    seen = new Set(); store.set("seenZones", []); updateStamps();
    $("#ticket").classList.remove("is-torn");
    document.dispatchEvent(new CustomEvent("zoo:restart"));
    App.go(0);
  });

  addEventListener("hashchange", () => { const id = location.hash.slice(1); if (id && id !== App.slideId) App.goId(id); });

  /* ---------- Старт ---------- */
  const startId = (location.hash || "").slice(1);
  const startIdx = Math.max(0, slides.findIndex((s) => s.id === startId));
  App.index = startIdx;
  requestAnimationFrame(() => apply(startIdx, 0));
})();
