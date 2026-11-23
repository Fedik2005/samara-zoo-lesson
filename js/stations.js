/* Интерактивы на слайдах. */
(function () {
  const { $, $$, reduced } = App;
  const CFG = window.ZOO_CONFIG || {};
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mix = (c1, c2, t) => {
    const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const a = p(c1), b = p(c2);
    return "#" + a.map((v, i) => Math.round(lerp(v, b[i], clamp(t, 0, 1))).toString(16).padStart(2, "0")).join("");
  };

  /* ================= БИОЛОГИЧЕСКИЙ ПОРТРЕТ ================= */
  (function portrait() {
    const wall = $("#wall"), card = $("#ptCard"); if (!wall) return;
    wall.innerHTML = ZOO.portrait.map((a, i) => `<button class="tile" type="button" data-i="${i}" aria-label="${a.name}"><img src="${a.photo}" alt="" loading="lazy" style="object-position:${a.pos}"><span>${a.name}</span></button>`).join("");
    const tiles = $$(".tile", wall), opened = new Set();
    function show(i) {
      const a = ZOO.portrait[i];
      tiles.forEach((t) => t.classList.toggle("is-current", +t.dataset.i === i));
      tiles[i].classList.add("is-open"); opened.add(i);
      card.innerHTML = `<img class="pt__photo" src="${a.photo}" alt="${a.name}" style="object-position:${a.pos}">
        <div class="pt__info"><p class="pt__name">${a.name}<small>${a.group}</small></p><p class="pt__power"><b>Суперсила.</b> ${a.power}</p><p class="pt__you">Если ты выбрал это животное: ${a.you.charAt(0).toLowerCase() + a.you.slice(1)}</p></div>`;
      $("#beastCount").textContent = `Открыто ${opened.size} из ${tiles.length}`;
      if (opened.size >= 3) $("#wallMoral").hidden = false;
      Sound.play("flip");
    }
    wall.addEventListener("click", (e) => { const t = e.target.closest(".tile"); if (t) show(+t.dataset.i); });
    let busy = false;
    $("#randomBeast").addEventListener("click", () => {
      if (busy) return; busy = true;
      const pool = tiles.filter((t) => !t.classList.contains("is-open"));
      const target = (pool.length ? pool : tiles)[(Math.random() * (pool.length || tiles.length)) | 0];
      let n = reduced ? 0 : 11, prev;
      (function hop() {
        if (prev) prev.classList.remove("is-hop");
        if (n-- <= 0) { show(+target.dataset.i); busy = false; return; }
        prev = tiles[(Math.random() * tiles.length) | 0]; prev.classList.add("is-hop"); Sound.play("tick");
        setTimeout(hop, 70 + (11 - n) * 14);
      })();
    });
  })();

  /* ================= ВОПРОСЫ СМОТРИТЕЛЯ ================= */
  (function riddles() {
    const list = $("#riddleList"); if (!list) return;
    list.innerHTML = ZOO.riddles.map((r, i) => `<li><button class="riddle" type="button" aria-expanded="false" aria-controls="ra${i}">${r.q}</button>
      <div class="riddle__a" id="ra${i}" hidden><span>${r.hint}</span><a class="riddle__go" href="#${r.where}" data-go="${r.where}">Ответ ждёт: ${r.whereName}</a></div></li>`).join("");
    list.addEventListener("click", (e) => {
      const go = e.target.closest("[data-go]");
      if (go) { e.preventDefault(); App.goId(go.dataset.go); return; }
      const b = e.target.closest(".riddle"); if (!b) return;
      const open = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", open); $("#" + b.getAttribute("aria-controls")).hidden = !open;
      Sound.play("flip");
    });
  })();

  /* ================= НАПРАВЛЕНИЯ ЗООЛОГИИ ================= */
  (function acc() {
    const box = $("#acc"); if (!box) return;
    box.addEventListener("click", (e) => {
      const tab = e.target.closest(".acc__tab"); if (!tab) return;
      const panel = tab.parentElement; if (panel.classList.contains("is-open")) return;
      $$(".acc__panel", box).forEach((p) => { p.classList.toggle("is-open", p === panel); $(".acc__tab", p).setAttribute("aria-expanded", p === panel); });
      Sound.play("flip");
    });
  })();

  /* ================= ТЫСЯЧА КЛЕТОК ================= */
  (function cells() {
    const svg = $("#cells"), legend = $("#legend"), out = $("#cellsOut"); if (!svg) return;
    let html = "", k = 0;
    ZOO.diversity.forEach((g) => { for (let i = 0; i < g.n; i++) { html += `<rect class="cell" x="${(k % 40) * 10}" y="${Math.floor(k / 40) * 10}" width="8.4" height="8.4" rx="1.5" fill="${g.color}" data-g="${g.id}" style="--d:${(k * 1.2) | 0}"/>`; k++; } });
    svg.innerHTML = html;
    const btn = (g) => `<button type="button" data-g="${g.id}" aria-pressed="false" style="--c:${g.color}"><i></i><span>${g.name}</span><b>${g.n}</b></button>`;
    legend.innerHTML = `<h4>Беспозвоночные</h4>${ZOO.diversity.filter((g) => !g.vert).map(btn).join("")}<h4>Позвоночные (хордовые)</h4>${ZOO.diversity.filter((g) => g.vert).map(btn).join("")}`;
    const all = $$(".cell", svg), def = out.textContent;
    legend.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const on = b.getAttribute("aria-pressed") !== "true";
      $$("button", legend).forEach((x) => x.setAttribute("aria-pressed", "false"));
      const g = ZOO.diversity.find((x) => x.id === b.dataset.g);
      if (on) {
        b.setAttribute("aria-pressed", "true");
        all.forEach((c) => { const me = c.dataset.g === g.id; c.classList.toggle("is-dim", !me); c.classList.toggle("is-hi", me && g.n <= 30); });
        out.textContent = g.id === "mamm" ? "Млекопитающие: 4 клетки из 1000. В них тигр, жираф, волк, заяц и мы с вами." : `${g.name}: ${g.n} клеток из 1000, это ${g.species} описанных видов.`;
      } else { all.forEach((c) => c.classList.remove("is-dim", "is-hi")); out.textContent = def; }
      Sound.play("click");
    });
    App.whenSlide(svg, () => { if (reduced) return; svg.classList.remove("is-play"); void svg.getBoundingClientRect(); svg.classList.add("is-play"); });
  })();

  /* ================= ЛИСА И ТЕРМОМЕТР ================= */
  (function fox() {
    const svg = $("#foxSvg"), input = $("#temp"); if (!svg) return;
    const slide = $("#fox"), out = $("#tempOut"), text = $("#foxText");
    const hotEl = $(".fox__end--hot"), coldEl = $(".fox__end--cold");
    const FOX = {
      hot: { n: "Фенек", t: "Пустыня Сахара. Уши длиной до 15 см отдают лишнее тепло. Светлая шерсть не перегревается, а мохнатые подошвы не обжигаются о горячий песок." },
      mid: { n: "Обыкновенная лиса", t: "Леса и степи средней полосы. Ни сильной жары, ни лютых морозов: уши, мех и морда у неё средние." },
      cold: { n: "Песец", t: "Тундра. Маленькие уши и короткая морда теряют меньше тепла. Густой мех уменьшает теплоотдачу: песец спокойно спит прямо в снегу." }
    };
    let zone = "";
    function earPath(bx1, by1, bx2, by2, dirx, len) {
      const mx = (bx1 + bx2) / 2, my = (by1 + by2) / 2, ax = mx + dirx * len * 0.42, ay = my - len;
      return { outer: `M${bx1},${by1} Q${(bx1 + ax) / 2 - dirx * 6},${(by1 + ay) / 2} ${ax},${ay} Q${(bx2 + ax) / 2 + dirx * 4},${(by2 + ay) / 2} ${bx2},${by2} Z`,
        inner: `M${lerp(bx1, mx, 0.35)},${lerp(by1, my, 0.35)} L${lerp(ax, mx, 0.22)},${lerp(ay, my, 0.22)} L${lerp(bx2, mx, 0.35)},${lerp(by2, my, 0.35)} Z` };
    }
    function draw(T) {
      const h = (T + 50) / 100, ear = lerp(48, 150, h), fur = 1 - h;
      const kc = clamp((T + 35) / 45, 0, 1);
      const furC = T >= 10 ? mix("#D9642B", "#E7C38C", (T - 10) / 40) : mix("#F4F6F7", "#D9642B", kc);
      const innerC = T >= 10 ? mix("#F2D6C6", "#F7DCCB", (T - 10) / 40) : mix("#DCE4E8", "#F2D6C6", kc);
      const muzzle = T >= 10 ? mix("#FFFFFF", "#FFF2DC", (T - 10) / 40) : "#FFFFFF";
      const L = earPath(132, 176, 186, 146, -1, ear), R = earPath(214, 146, 268, 176, 1, ear);
      const n = 11, cx = 200, cy = 232, rx = 104 + fur * 30, ry = 70 + fur * 26, bump = 8 + fur * 16;
      let ruff = `M${cx - rx},${cy - 30}`;
      for (let i = 0; i <= n; i++) {
        const a = Math.PI * (1 - i / n), x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry * 0.95 + 4;
        if (i === 0) { ruff += ` L${x.toFixed(1)},${y.toFixed(1)}`; continue; }
        const am = Math.PI * (1 - (i - 0.5) / n);
        ruff += ` Q${(cx + Math.cos(am) * (rx + bump)).toFixed(1)},${(cy + Math.sin(am) * (ry * 0.95 + bump) + 4).toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
      }
      ruff += ` L${cx + rx},${cy - 30} Z`;
      svg.innerHTML = `
        <path d="${ruff}" fill="${furC}" stroke="#2B2520" stroke-width="3" stroke-linejoin="round" opacity="${clamp(fur * 1.3 - 0.25, 0, 1).toFixed(2)}"/>
        <path d="${L.outer}" fill="${furC}" stroke="#2B2520" stroke-width="3" stroke-linejoin="round"/>
        <path d="${R.outer}" fill="${furC}" stroke="#2B2520" stroke-width="3" stroke-linejoin="round"/>
        <path d="${L.inner}" fill="${innerC}"/><path d="${R.inner}" fill="${innerC}"/>
        <path d="M128,172 Q200,120 272,172 L${306 + fur * 18},238 Q252,252 232,288 L200,322 L168,288 Q148,252 ${94 - fur * 18},238 Z" fill="${furC}" stroke="#2B2520" stroke-width="3" stroke-linejoin="round"/>
        <path d="M200,322 L168,288 Q150,254 ${108 - fur * 12},240 Q170,244 200,266 Q230,244 ${292 + fur * 12},240 Q250,254 232,288 Z" fill="${muzzle}" stroke="#2B2520" stroke-width="3" stroke-linejoin="round"/>
        <path d="M146,214 Q164,194 186,212 Q166,228 146,214 Z" fill="#2B2520"/><path d="M214,212 Q236,194 254,214 Q234,228 214,212 Z" fill="#2B2520"/>
        <circle cx="172" cy="209" r="4" fill="#FFFFFF"/><circle cx="240" cy="209" r="4" fill="#FFFFFF"/>
        <path d="M188,300 Q200,292 212,300 Q206,314 200,316 Q194,314 188,300 Z" fill="#2B2520"/>`;
      const z = T >= 25 ? "hot" : T > -10 ? "mid" : "cold";
      if (z !== zone) { zone = z; text.innerHTML = `<b>${FOX[z].n}.</b> ${FOX[z].t}`; if (draw.ready) Sound.play("tick"); }
      out.textContent = (T > 0 ? "+" : T < 0 ? "−" : "") + Math.abs(T) + " °C";
      slide.style.setProperty("--eco", T >= 10 ? mix("#E3E4D2", "#EAD2A4", (T - 10) / 40) : mix("#D3E3EA", "#E3E4D2", (T + 50) / 60));
      hotEl.classList.toggle("is-far", T < 0); coldEl.classList.toggle("is-far", T > 10);
      if (App.slideId === "fox") document.documentElement.style.setProperty("--page", getComputedStyle(slide).backgroundColor);
    }
    input.addEventListener("input", () => draw(+input.value));
    draw(+input.value); draw.ready = true;
  })();

  /* ================= ГОНКА ФОРМ ================= */
  (function race() {
    const go = $("#raceGo"), lanes = $$("#race .lane"); if (!go) return;
    let running = false;
    go.addEventListener("click", () => {
      if (running) return; running = true; go.disabled = true; Sound.play("slide");
      const items = lanes.map((ln) => {
        const shape = $(".lane__shape", ln), cd = parseFloat(ln.dataset.cd);
        $(".lane__time", ln).textContent = "";
        const D = ln.clientWidth - 76 - 72 - 14;
        return { ln, shape, D, T: 1.4 * Math.sqrt(cd / 0.04), done: false };
      });
      const t0 = performance.now(); let lastB = 0, fin = 0;
      (function frame(now) {
        const t = (now - t0) / 1000;
        items.forEach((it) => {
          if (it.done) return;
          const k = Math.min(1, t / it.T), x = it.D * (k < 0.12 ? (k * k) / 0.24 : (k - 0.06) / 0.94);
          it.shape.style.transform = `translateX(${Math.min(it.D, x).toFixed(1)}px)`;
          if (!reduced && now - lastB > 80) { const b = document.createElement("span"); b.className = "bubble"; b.style.left = (Math.min(it.D, x) + 80) + "px"; b.style.top = (25 + (Math.random() - 0.5) * 20) + "px"; it.ln.appendChild(b); setTimeout(() => b.remove(), 900); }
          if (k >= 1) { it.done = true; fin++; $(".lane__time", it.ln).textContent = it.T.toFixed(1).replace(".", ",") + " с"; Sound.play(fin === 1 ? "correct" : "click"); }
        });
        if (now - lastB > 80) lastB = now;
        if (fin < items.length) requestAnimationFrame(frame);
        else {
          const [b, s, tp] = items.map((i) => i.T.toFixed(1).replace(".", ","));
          $("#raceOut").textContent = `Торпеда приплыла первой за ${tp} с. Шару понадобилось ${s} с, бруску ${b} с.`;
          setTimeout(() => { items.forEach((i) => (i.shape.style.transform = "")); running = false; go.disabled = false; go.textContent = "Ещё раз"; }, 2200);
        }
      })(t0);
    });
  })();

  /* ================= ЖИРАФ ТЯНЕТСЯ ================= */
  (function reach() {
    const svg = $("#reachSvg"), input = $("#neck"); if (!svg) return;
    const Y = (m) => 500 - m * 80;
    const T = (x, y, t, a) => `<text x="${x}" y="${y}" text-anchor="${a || "middle"}" font-family="Onest, sans-serif" font-weight="700" font-size="15" fill="#2B2520">${t}</text>`;
    const LEAVES = [[452, 1.15, "r"], [466, 1.5, "r"], [474, 1.9, "r"], [338, 2.05, "l"], [318, 2.6, "l"], [312, 3.1, "l"], [306, 3.7, "l"], [300, 4.2, "l"], [318, 4.75, "l"], [292, 5.15, "l"]];
    function draw(h) {
      let s = `<rect x="0" y="500" width="620" height="40" rx="6" fill="#C9A86A"/>`;
      for (let m = 1; m <= 5; m++) s += `<rect x="30" y="${Y(m) - 1.5}" width="14" height="3" fill="#2B2520"/>` + T(4, Y(m) + 5, m + " м", "start");
      s += `<g stroke="#6B4A1F" stroke-width="10" stroke-linecap="round" fill="none"><path d="M400,${Y(4.7)} L318,${Y(4.25)}"/><path d="M400,${Y(3.6)} L318,${Y(3.1)}"/><path d="M398,${Y(2.5)} L340,${Y(2.05)}"/><path d="M404,${Y(2.2)} L474,${Y(1.9)}"/><path d="M404,${Y(1.6)} L456,${Y(1.15)}"/></g>`;
      s += `<rect x="392" y="${Y(5.35)}" width="18" height="${500 - Y(5.35)}" fill="#6B4A1F"/><ellipse cx="392" cy="${Y(5.45)}" rx="128" ry="22" fill="#5E8A4A"/><ellipse cx="366" cy="${Y(5.08)}" rx="88" ry="16" fill="#4C7A3E"/>`;
      LEAVES.forEach(([x, m, side]) => { const r = side === "l" && m <= h + 0.25; s += `<circle cx="${x}" cy="${Y(m)}" r="${r ? 17 : 14}" fill="${r ? "#3E6B34" : side === "r" ? "#9CC38A" : "#6FA05C"}"/>`; });
      s += `<g fill="#B8692E"><ellipse cx="482" cy="${Y(0.78)}" rx="29" ry="12"/><rect x="462" y="${Y(0.78)}" width="4" height="${0.78 * 80}"/><rect x="470" y="${Y(0.78)}" width="4" height="${0.78 * 80}"/><rect x="492" y="${Y(0.78)}" width="4" height="${0.78 * 80}"/><rect x="500" y="${Y(0.78)}" width="4" height="${0.78 * 80}"/><path d="M458,${Y(0.86)} L462,${Y(0.7)} L452,${Y(1.28)} L444,${Y(1.26)} Z"/><ellipse cx="442" cy="${Y(1.3)}" rx="11" ry="6" transform="rotate(-18 442 ${Y(1.3)})"/></g><path d="M448,${Y(1.36)} q2,-14 8,-24 M444,${Y(1.36)} q-2,-14 2,-24" stroke="#3B2410" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      s += `<g fill="#7D6A55"><ellipse cx="572" cy="${Y(1.15)}" rx="38" ry="16"/><rect x="544" y="${Y(1.15)}" width="6" height="${1.15 * 80}"/><rect x="556" y="${Y(1.15)}" width="6" height="${1.15 * 80}"/><rect x="584" y="${Y(1.15)}" width="6" height="${1.15 * 80}"/><rect x="596" y="${Y(1.15)}" width="6" height="${1.15 * 80}"/><path d="M540,${Y(1.25)} L552,${Y(1.05)} L530,${Y(1.92)} L518,${Y(1.9)} Z"/><ellipse cx="514" cy="${Y(1.95)}" rx="14" ry="8" transform="rotate(-20 514 ${Y(1.95)})"/></g><path d="M546,${Y(1.08)} v18 M566,${Y(1.1)} v20 M586,${Y(1.1)} v20" stroke="#FBF8F1" stroke-width="3"/><path d="M522,${Y(2.04)} l6,-10 l-6,-8 l7,-9 l-4,-9 M516,${Y(2.05)} l2,-10 l-6,-8 l4,-9" stroke="#3B2410" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
      const S = { x: 190, y: 280 }, Ln = 230, dy = (h - 0.15 - 2.75) * 80;
      const sinA = clamp(dy / Ln, -0.85, 0.96), cosA = Math.sqrt(1 - sinA * sinA);
      const H = { x: S.x + cosA * Ln * 0.62, y: S.y - sinA * Ln };
      const len = Math.hypot(H.x - S.x, H.y - S.y), d = { x: (H.x - S.x) / len, y: (H.y - S.y) / len }, p = { x: -d.y, y: d.x };
      const P = (o, k) => `${(o.x + p.x * k).toFixed(1)},${(o.y + p.y * k).toFixed(1)}`;
      const S2 = { x: S.x + 2, y: S.y + 14 }, hc = { x: H.x + d.x * 10 + 8, y: H.y + d.y * 10 + 2 };
      s += `<g fill="#E3B35B" stroke="#2B2520" stroke-width="3" stroke-linejoin="round"><rect x="98" y="${Y(1.9)}" width="12" height="${1.9 * 80}"/><rect x="114" y="${Y(1.9)}" width="12" height="${1.9 * 80}"/><rect x="170" y="${Y(1.9)}" width="12" height="${1.9 * 80}"/><rect x="186" y="${Y(1.9)}" width="12" height="${1.9 * 80}"/><path d="M92,354 Q84,318 116,312 L176,286 Q206,280 204,318 L200,356 Q146,368 96,362 Z"/><polygon points="${P(S2, 16)} ${P(H, 9)} ${P(H, -9)} ${P(S2, -16)}"/><ellipse cx="${hc.x.toFixed(1)}" cy="${hc.y.toFixed(1)}" rx="25" ry="12" transform="rotate(22 ${hc.x.toFixed(1)} ${hc.y.toFixed(1)})"/><rect x="${(H.x - 6).toFixed(1)}" y="${(H.y - 22).toFixed(1)}" width="6" height="14" rx="3"/><rect x="${(H.x + 4).toFixed(1)}" y="${(H.y - 24).toFixed(1)}" width="6" height="14" rx="3"/></g>`;
      s += `<path d="M94,326 Q80,352 84,388" stroke="#2B2520" stroke-width="4" fill="none"/><circle cx="84" cy="392" r="6" fill="#2B2520"/><g fill="#9A5B1E"><circle cx="122" cy="330" r="10"/><circle cx="150" cy="318" r="11"/><circle cx="178" cy="306" r="9"/><circle cx="140" cy="346" r="8"/><circle cx="174" cy="336" r="9"/><circle cx="${(S.x + (H.x - S.x) * 0.35).toFixed(1)}" cy="${(S.y + (H.y - S.y) * 0.35 + 8).toFixed(1)}" r="7"/><circle cx="${(S.x + (H.x - S.x) * 0.68).toFixed(1)}" cy="${(S.y + (H.y - S.y) * 0.68 + 4).toFixed(1)}" r="6"/></g><circle cx="${(hc.x + 6).toFixed(1)}" cy="${(hc.y - 4).toFixed(1)}" r="3.5" fill="#2B2520"/>`;
      s += T(148, 524, "жираф") + T(478, 524, "импала") + T(572, 524, "куду");
      svg.innerHTML = s;
      $("#neckOut").textContent = h.toFixed(1).replace(".", ",") + " м";
      $("#reachOut").textContent = h < 1.6 ? "Здесь листья едят импалы, куду и многие другие. За каждую ветку идёт соревнование."
        : h < 2.4 ? "До двух метров дотягиваются только куду. Соседей у кормушки меньше."
        : h < 4.4 ? "Выше двух с половиной метров жираф ест почти один." : "Пять метров и выше: верхушка акации целиком принадлежит жирафу.";
    }
    let last = -1;
    input.addEventListener("input", () => { const v = +input.value; draw(v); const z = v < 1.6 ? 0 : v < 2.4 ? 1 : v < 4.4 ? 2 : 3; if (z !== last) { last = z; Sound.play("tick"); } });
    draw(+input.value);
  })();

  /* ================= ТЕРРАРИУМ ================= */
  (function camo() {
    const frame = $("#camoFrame"), img = $("#camoImg"), marks = $("#camoMarks"); if (!frame) return;
    const tabs = $("#camoTabs"), timer = $("#camoTimer"), msg = $("#camoMsg");
    let idx = 0, t0 = 0, acc = 0, tick = null, found = false, active = false;
    const done = new Set();
    tabs.innerHTML = ZOO.camo.map((c, i) => `<button class="camo__tab" role="tab" type="button" data-i="${i}" aria-selected="${i === 0}">${c.label}</button>`).join("");
    const fmt = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
    const start = () => { if (tick || found || !active) return; t0 = performance.now() - acc; tick = setInterval(() => (timer.textContent = fmt((performance.now() - t0) / 1000)), 250); };
    const stop = () => { if (tick) { clearInterval(tick); tick = null; acc = performance.now() - t0; } };
    function load(i) {
      stop(); idx = i; found = false; acc = 0;
      const c = ZOO.camo[i];
      img.src = c.img; img.alt = "Фотография: " + c.label.toLowerCase() + ", на ней прячется животное";
      marks.setAttribute("viewBox", `0 0 ${c.w} ${c.h}`); marks.innerHTML = "";
      timer.textContent = "0:00"; msg.textContent = "Ищем...";
      $$(".camo__tab", tabs).forEach((b) => b.setAttribute("aria-selected", +b.dataset.i === i));
      start();
    }
    function reveal(win) {
      const c = ZOO.camo[idx], h = c.hot; found = true; stop();
      const cx = (h.x / 100) * c.w, cy = (h.y / 100) * c.h, rx = (h.rx / 100) * c.w, ry = (h.ry / 100) * c.h;
      const len = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
      marks.insertAdjacentHTML("beforeend", `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${h.rot} ${cx} ${cy})" fill="none" stroke="#E9CF9A" stroke-width="${c.w / 150}" stroke-dasharray="${len}" stroke-dashoffset="${len}" style="transition:stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)"/>`);
      requestAnimationFrame(() => requestAnimationFrame(() => { const el = marks.lastElementChild; if (el) el.style.strokeDashoffset = "0"; }));
      msg.innerHTML = `<b>${win ? "Нашли за " + timer.textContent + "! " : ""}${esc(c.title)}</b>${esc(c.text)}`;
      done.add(idx); $$(".camo__tab", tabs)[idx].classList.add("is-done");
      Sound.play(win ? "found" : "flip");
      if (win && done.size === ZOO.camo.length) setTimeout(() => App.confetti(110), 400);
    }
    frame.addEventListener("click", (e) => {
      if (found) return;
      const c = ZOO.camo[idx], r = img.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * c.w, py = ((e.clientY - r.top) / r.height) * c.h;
      const h = c.hot, cx = (h.x / 100) * c.w, cy = (h.y / 100) * c.h, rx = (h.rx / 100) * c.w, ry = (h.ry / 100) * c.h;
      const a = (-h.rot * Math.PI) / 180, dx = px - cx, dy = py - cy;
      const x = dx * Math.cos(a) - dy * Math.sin(a), y = dx * Math.sin(a) + dy * Math.cos(a);
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) reveal(true);
      else {
        const s = c.w / 60;
        marks.insertAdjacentHTML("beforeend", `<g transform="translate(${px} ${py})"><circle r="${s}" fill="none" stroke="#FBF8F1" stroke-width="${s / 4}"/><animate attributeName="opacity" from="1" to="0" dur="1.1s" fill="freeze"/></g>`);
        msg.textContent = "Мимо. Присмотритесь к фактуре и контурам."; Sound.play("wrong");
      }
    });
    tabs.addEventListener("click", (e) => { const b = e.target.closest(".camo__tab"); if (b) { load(+b.dataset.i); Sound.play("click"); } });
    $("#camoGive").addEventListener("click", () => { if (!found) reveal(false); });
    $("#camoNext").addEventListener("click", () => { load((idx + 1) % ZOO.camo.length); Sound.play("click"); });
    App.whenSlide(frame, () => { active = true; start(); }, () => { active = false; stop(); });
    load(0);
  })();

  /* ================= СТАНЬ ХИЩНИКОМ ================= */
  (function school() {
    const cv = $("#schoolCanvas"); if (!cv) return;
    const cx = cv.getContext("2d"), W = 1280, H = 720;
    let fish = [], running = false, raf = 0, eaten = 0;
    const pred = { x: 900, y: 300, tx: 900, ty: 300, vx: 0, vy: 0, user: false, last: 0, mouth: 0 };
    const bubbles = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const spawn = (edge) => { const a = Math.random() * Math.PI * 2; return { x: edge ? (Math.random() < 0.5 ? -20 : W + 20) : 300 + Math.random() * 800, y: 80 + Math.random() * 560, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2, s: 0.85 + Math.random() * 0.5, tone: 195 + Math.random() * 40 }; };
    fish = Array.from({ length: 110 }, () => spawn(false));
    function step(t) {
      if (!pred.user || t - pred.last > 2500) { pred.tx = W * (0.55 + 0.33 * Math.sin(t / 2300)); pred.ty = H * (0.5 + 0.3 * Math.sin(t / 1700 + 1)); }
      const k = pred.user ? 0.22 : 0.06;
      pred.vx = (pred.tx - pred.x) * k; pred.vy = (pred.ty - pred.y) * k; pred.x += pred.vx; pred.y += pred.vy;
      pred.mouth = Math.max(0, pred.mouth - 0.08);
      const R2 = 46 * 46, FLEE = 130;
      for (let i = 0; i < fish.length; i++) {
        const f = fish[i];
        let ax = 0, ay = 0, sx = 0, sy = 0, avx = 0, avy = 0, n = 0;
        for (let j = 0; j < fish.length; j++) {
          if (i === j) continue; const o = fish[j], dx = o.x - f.x, dy = o.y - f.y, d2 = dx * dx + dy * dy;
          if (d2 < R2) { n++; sx += o.x; sy += o.y; avx += o.vx; avy += o.vy; if (d2 < 200) { ax -= dx / (d2 + 1) * 14; ay -= dy / (d2 + 1) * 14; } }
        }
        if (n) { ax += (sx / n - f.x) * 0.004 + (avx / n - f.vx) * 0.06; ay += (sy / n - f.y) * 0.004 + (avy / n - f.vy) * 0.06; }
        const dxp = f.x - pred.x, dyp = f.y - pred.y, dp = Math.hypot(dxp, dyp);
        if (dp < FLEE) { const q = (FLEE - dp) / FLEE; ax += (dxp / (dp + 1)) * q * 1.1; ay += (dyp / (dp + 1)) * q * 1.1; }
        if (f.x < 60) ax += 0.25; if (f.x > W - 60) ax -= 0.25; if (f.y < 90) ay += 0.25; if (f.y > H - 60) ay -= 0.25;
        f.vx += ax; f.vy += ay;
        const sp = Math.hypot(f.vx, f.vy), max = dp < FLEE ? 3.6 : 2.4;
        if (sp > max) { f.vx *= max / sp; f.vy *= max / sp; } else if (sp < 1.1) { f.vx *= 1.1 / sp; f.vy *= 1.1 / sp; }
        f.x += f.vx; f.y += f.vy;
        if (pred.user && dp < 34) {
          fish.splice(i, 1); i--; eaten++; pred.mouth = 1;
          const sc = $("#schoolScore"); sc.textContent = "Поймано: " + eaten; sc.classList.remove("is-pop"); void sc.offsetWidth; sc.classList.add("is-pop");
          Sound.play("chomp"); setTimeout(() => fish.push(spawn(true)), 1400);
        }
      }
      if (Math.random() < 0.08) bubbles.push({ x: Math.random() * W, y: H + 10, r: 2 + Math.random() * 4, v: 0.6 + Math.random() * 0.8 });
      for (let i = bubbles.length - 1; i >= 0; i--) { bubbles[i].y -= bubbles[i].v; if (bubbles[i].y < -10) bubbles.splice(i, 1); }
    }
    function drawFish(f) {
      const a = Math.atan2(f.vy, f.vx), s = 7 * f.s;
      cx.save(); cx.translate(f.x, f.y); cx.rotate(a); cx.fillStyle = `hsl(${f.tone} 22% 84%)`;
      cx.beginPath(); cx.ellipse(0, 0, s * 1.8, s * 0.6, 0, 0, Math.PI * 2); cx.fill();
      cx.beginPath(); cx.moveTo(-s * 1.5, 0); cx.lineTo(-s * 2.7, -s * 0.8); cx.lineTo(-s * 2.7, s * 0.8); cx.closePath(); cx.fill();
      cx.fillStyle = "#2B2520"; cx.beginPath(); cx.arc(s * 1.1, -s * 0.12, s * 0.16, 0, Math.PI * 2); cx.fill(); cx.restore();
    }
    function drawPred() {
      const a = Math.atan2(pred.vy, Math.abs(pred.vx) < 0.01 && Math.abs(pred.vy) < 0.01 ? 1 : pred.vx), s = 22;
      cx.save(); cx.translate(pred.x, pred.y); cx.rotate(a); cx.fillStyle = "#0D2A40";
      const m = pred.mouth * 0.5;
      cx.beginPath(); cx.moveTo(s * 2.2, -s * m); cx.quadraticCurveTo(s * 1.4, -s * 0.95, 0, -s * 0.85); cx.quadraticCurveTo(-s * 1.6, -s * 0.7, -s * 2, 0); cx.quadraticCurveTo(-s * 1.6, s * 0.7, 0, s * 0.85); cx.quadraticCurveTo(s * 1.4, s * 0.95, s * 2.2, s * m); cx.lineTo(s * 1.2, 0); cx.closePath(); cx.fill();
      cx.beginPath(); cx.moveTo(-s * 1.8, 0); cx.lineTo(-s * 3.2, -s * 1.3); cx.lineTo(-s * 2.6, 0); cx.lineTo(-s * 3.2, s * 1.3); cx.closePath(); cx.fill();
      cx.beginPath(); cx.moveTo(-s * 0.2, -s * 0.75); cx.lineTo(-s * 0.9, -s * 1.7); cx.lineTo(-s * 1.1, -s * 0.6); cx.fill();
      cx.fillStyle = "#E9CF9A"; cx.beginPath(); cx.arc(s * 1.3, -s * 0.28, s * 0.17, 0, Math.PI * 2); cx.fill(); cx.restore();
    }
    function render() {
      cx.clearRect(0, 0, W, H); cx.fillStyle = "rgba(251,248,241,0.16)";
      bubbles.forEach((b) => { cx.beginPath(); cx.arc(b.x, b.y, b.r, 0, Math.PI * 2); cx.fill(); });
      fish.forEach(drawFish); drawPred();
    }
    function loop(t) { step(t); render(); if (running) raf = requestAnimationFrame(loop); }
    function pointer(e) { const p = e.touches ? e.touches[0] : e; const l = App.local(p, cv); pred.tx = l.x; pred.ty = l.y; pred.user = true; pred.last = performance.now(); }
    cv.addEventListener("pointermove", pointer);
    cv.addEventListener("pointerdown", pointer);
    cv.addEventListener("touchmove", (e) => { e.preventDefault(); pointer(e); }, { passive: false });
    cv.addEventListener("pointerleave", () => (pred.user = false));
    render();
    App.whenSlide(cv, () => { if (reduced) { for (let i = 0; i < 60; i++) step(i * 16); render(); return; } if (!running) { running = true; raf = requestAnimationFrame(loop); } }, () => { running = false; cancelAnimationFrame(raf); });
  })();

  /* ================= ОПРЕДЕЛИ ВЗАИМОДЕЙСТВИЕ ================= */
  (function relations() {
    const list = $("#relList"); if (!list) return;
    let right = 0;
    list.innerHTML = ZOO.relations.map((r, i) => `<li class="rel__item" data-i="${i}"><p class="rel__pair">${r.pair}</p>
      <div class="rel__opts" role="group" aria-label="Тип взаимодействия: ${r.pair}">${ZOO.relationTypes.map((t) => `<button type="button" data-t="${t}">${t}</button>`).join("")}</div><p class="rel__why" aria-live="polite"></p></li>`).join("");
    list.addEventListener("click", (e) => {
      const b = e.target.closest(".rel__opts button"); if (!b) return;
      const li = b.closest(".rel__item"); if (li.dataset.done) return;
      const r = ZOO.relations[li.dataset.i]; li.dataset.done = "1";
      const ok = b.dataset.t === r.answer;
      b.classList.add("is-pick");
      $$(".rel__opts button", li).forEach((x) => { if (x.dataset.t === r.answer) x.classList.add("is-answer"); x.setAttribute("aria-disabled", "true"); });
      li.classList.add(ok ? "is-right" : "is-wrong");
      $(".rel__why", li).textContent = (ok ? "Верно. " : `Это ${r.answer.toLowerCase()}. `) + r.why;
      if (ok) right++;
      $("#relScore").textContent = `Верно ${right} из ${ZOO.relations.length}`;
      Sound.play(ok ? "correct" : "wrong");
      if ($$("[data-done]", list).length === ZOO.relations.length && right >= 5) App.confetti(100);
    });
  })();

  /* ================= МОДЕЛЬ ЛЕСА ================= */
  (function model() {
    const svg = $("#simSvg"); if (!svg) return;
    const P = { r: 0.8, a: 1.0, b: 1.6, m: 0.35, c: 2.2, d: 1.4, e: 0.42 };
    const W0 = 640, H0 = 330, pad = { l: 50, r: 14, t: 14, b: 30 }, span = 30;
    let st, hist, wolves, running = false, raf, last = 0, phase = "eq", tRem = 0;
    const out = $("#simOut"), btn = $("#simWolves");
    function reset() {
      st = { t: 0, G: 0.62, H: 0.3, W: 0.295 }; hist = []; wolves = true; phase = "eq";
      btn.textContent = "Убрать волков"; btn.setAttribute("aria-pressed", "false");
      out.textContent = "Волки, зайцы и растения в равновесии. Численность немного колеблется год от года.";
      for (let i = 0; i < span * 10; i++) advance(0.1);
      draw();
    }
    function advance(dt) {
      const steps = 5, h = dt / steps;
      for (let i = 0; i < steps; i++) {
        const season = 1 + 0.06 * Math.sin(st.t * 2.1), { G, H, W } = st;
        const dG = P.r * season * G * (1 - G) - P.a * G * H, dH = P.b * G * H - P.c * H * W - P.m * H, dW = wolves ? P.d * H * W - P.e * W : 0;
        st.G = Math.max(0.01, G + dG * h); st.H = Math.max(0.005, H + dH * h); st.W = wolves ? Math.max(0, W + dW * h) : 0; st.t += h;
      }
      hist.push({ t: st.t, G: st.G, H: st.H, W: st.W });
      while (hist.length && hist[0].t < st.t - span) hist.shift();
      if (!wolves) {
        if (phase === "removed" && st.H > 0.6) { phase = "boom"; out.textContent = "Зайцев становится всё больше: их никто не ловит."; }
        else if (phase === "boom" && st.G < 0.2) { phase = "crash"; out.textContent = "Зайцы объели траву, кору и побеги. Корма всё меньше."; }
        else if (phase === "crash" && st.H < 0.6 && st.t - tRem > 4) { phase = "after"; out.textContent = "Корма не хватает, и зайцев стало меньше. Изменилась вся пищевая цепь."; }
      } else if (phase === "back" && st.t - tRem > 8) { phase = "eq"; out.textContent = "Волки вернулись, и через несколько лет численности снова выровнялись."; }
    }
    function line(key, color) {
      const t1 = st.t, t0 = t1 - span, x = (t) => pad.l + ((t - t0) / span) * (W0 - pad.l - pad.r), y = (v) => H0 - pad.b - (Math.min(1.2, v) / 1.2) * (H0 - pad.t - pad.b);
      return `<polyline fill="none" stroke="${color}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" points="${hist.map((p) => x(p.t).toFixed(1) + "," + y(p[key]).toFixed(1)).join(" ")}"/>`;
    }
    function draw() {
      let s = `<rect x="${pad.l}" y="${pad.t}" width="${W0 - pad.l - pad.r}" height="${H0 - pad.t - pad.b}" rx="10" fill="#F4ECDD"/>`;
      s += `<text x="${pad.l - 8}" y="${pad.t + 14}" text-anchor="end" font-family="Onest, sans-serif" font-size="13" fill="#5A4E44">много</text><text x="${pad.l - 8}" y="${H0 - pad.b}" text-anchor="end" font-family="Onest, sans-serif" font-size="13" fill="#5A4E44">0</text><text x="${W0 - pad.r}" y="${H0 - 8}" text-anchor="end" font-family="Onest, sans-serif" font-size="13" fill="#5A4E44">годы</text>`;
      s += line("G", "#4C7A3E") + line("H", "#9A8F84") + line("W", "#2B2520");
      if (!wolves) s += `<text x="${pad.l + 14}" y="${pad.t + 28}" font-family="Unbounded, sans-serif" font-weight="700" font-size="17" fill="#A8485A">Волков нет</text>`;
      svg.innerHTML = s;
    }
    function loop(t) { if (!running) return; if (t - last > 40) { advance(0.12); draw(); last = t; } raf = requestAnimationFrame(loop); }
    btn.addEventListener("click", () => {
      if (wolves) { wolves = false; tRem = st.t; phase = "removed"; btn.textContent = "Вернуть волков"; btn.setAttribute("aria-pressed", "true"); out.textContent = "Волков убрали. Следите за серой линией зайцев."; Sound.play("slide"); }
      else { wolves = true; st.W = 0.08; tRem = st.t; phase = "back"; btn.textContent = "Убрать волков"; btn.setAttribute("aria-pressed", "false"); out.textContent = "Волков вернули в лес. Смотрим, что будет дальше."; Sound.play("correct"); }
      if (reduced) { for (let i = 0; i < 120; i++) advance(0.12); draw(); }
    });
    $("#simReset").addEventListener("click", () => { reset(); Sound.play("click"); });
    reset();
    App.whenSlide(svg, () => { if (!reduced && !running) { running = true; raf = requestAnimationFrame(loop); } }, () => { running = false; cancelAnimationFrame(raf); });
  })();

  /* ================= КИНОЗАЛ ================= */
  (function cinema() {
    const v = $("#zooVideo"); if (!v) return;
    const vc = CFG.video || {}, animals = CFG.videoAnimals || [];
    const empty = $("#playerEmpty"), stopBox = $("#playerStop"), play = $("#vPlay"), track = $("#vTrack"), fill = $("#vFill"), time = $("#vTime");
    const stops = (vc.stops || []).slice().sort((a, b) => a.time - b.time), fired = new Set();
    let cur = null;
    const fmt = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
    App.mediaNote = "";
    const grid = $("#signsGrid");
    grid.innerHTML = animals.map((a, i) => `<button class="sign" type="button" data-i="${i}" aria-pressed="false"><span class="sign__in">
      <span class="sign__face sign__front"><span><span class="sign__name">${esc(a.name)}</span><br><span class="sign__latin">${esc(a.latin || "")}</span></span><span class="sign__q">Группа? Строение? Питание? Приспособление?</span><span class="sign__hint">Нажмите, чтобы открыть табличку</span></span>
      <span class="sign__face sign__back" aria-hidden="true"><span class="sign__name">${esc(a.name)}</span><dl class="sign__rows"><dt>Группа</dt><dd>${esc(a.group || "")}</dd><dt>Где живёт</dt><dd>${esc(a.home || "")}</dd><dt>Строение</dt><dd>${esc(a.look || "")}</dd><dt>Питание</dt><dd>${esc(a.food || "")}</dd><dt>Приспособление</dt><dd>${esc(a.trick || "")}</dd><dt>Роль в природе</dt><dd>${esc(a.role || "")}</dd></dl></span></span></button>`).join("");
    function flipSign(i, on) { const s = grid.children[i]; if (!s) return; const open = on != null ? on : !s.classList.contains("is-open"); s.classList.toggle("is-open", open); s.setAttribute("aria-pressed", open); $(".sign__back", s).setAttribute("aria-hidden", !open); Sound.play("flip"); }
    grid.addEventListener("click", (e) => { const s = e.target.closest(".sign"); if (s) flipSign(+s.dataset.i); });
    function noVideo() { empty.hidden = false; play.disabled = true; App.mediaNote = `Видео пока не подключено. Положите файл в папку assets/video и впишите его имя в js/config.js (сейчас: ${vc.src || "пусто"}).`; App.renderTeacher(); }
    if (vc.src) {
      v.src = vc.src; if (vc.poster) v.poster = vc.poster;
      v.addEventListener("error", noVideo);
      v.addEventListener("loadedmetadata", () => {
        empty.hidden = true; play.disabled = false;
        stops.forEach((s) => { if (s.time < v.duration) track.insertAdjacentHTML("beforeend", `<span class="player__mark" style="left:${(s.time / v.duration) * 100}%" title="${esc(s.question)}"></span>`); });
        time.textContent = "0:00 / " + fmt(v.duration);
        App.mediaNote = `Видео подключено: ${fmt(v.duration)}, остановок с вопросами: ${stops.filter((s) => s.time < v.duration).length}.`; App.renderTeacher();
      });
    } else noVideo();
    play.addEventListener("click", () => { if (v.paused) { stopBox.hidden = true; v.play(); } else v.pause(); });
    v.addEventListener("play", () => (play.textContent = "Пауза"));
    v.addEventListener("pause", () => (play.textContent = "Смотреть"));
    v.addEventListener("click", () => play.click());
    v.addEventListener("timeupdate", () => {
      if (!v.duration) return;
      fill.style.width = (v.currentTime / v.duration) * 100 + "%"; time.textContent = fmt(v.currentTime) + " / " + fmt(v.duration);
      const s = stops.find((x) => !fired.has(x.time) && v.currentTime >= x.time && v.currentTime < x.time + 1.5);
      if (s) { fired.add(s.time); v.pause(); cur = s; $("#stopQ").textContent = s.question; stopBox.hidden = false; Sound.play("tick"); }
    });
    v.addEventListener("seeked", () => stops.forEach((s) => { if (s.time > v.currentTime) fired.delete(s.time); }));
    track.addEventListener("click", (e) => { if (!v.duration) return; const r = track.getBoundingClientRect(); v.currentTime = ((e.clientX - r.left) / r.width) * v.duration; });
    $("#stopGo").addEventListener("click", () => { stopBox.hidden = true; v.play(); });
    $("#stopCard").addEventListener("click", () => { if (!cur) return; const a = animals[cur.animal]; if (a) { $("#stopQ").textContent = `${a.name}. ${a.group}. ${a.trick}.`; flipSign(cur.animal, true); } });
    $("#vFull").addEventListener("click", () => { const p = $("#player"); if (!document.fullscreenElement) p.requestFullscreen && p.requestFullscreen().catch(() => {}); else document.exitFullscreen(); });
    App.whenSlide(v, null, () => { if (!v.paused) v.pause(); });
    const au = CFG.audio || {};
    if (au.src) {
      const a = $("#zooAudio"); a.src = au.src; $("#audioTitle").textContent = au.title || "Аудиодорожка";
      a.addEventListener("loadedmetadata", () => ($("#audioBox").hidden = false));
      a.addEventListener("error", () => { App.mediaNote += ` Аудио не найдено: ${au.src}.`; });
      a.preload = "metadata"; a.load();
    }
  })();
})();
