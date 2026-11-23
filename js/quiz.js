/* Викторина: командный режим для класса и одиночный для телефона. */
(function () {
  const { $, $$, store, reduced } = App;
  const app = $("#quizApp"); if (!app) return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const Q = ZOO.quiz;
  const TEAM_DEF = [
    { name: "Тигры", color: "#E8C9A0" },
    { name: "Пингвины", color: "#D6E7EA" },
    { name: "Жирафы", color: "#E9CF9A" },
    { name: "Волки", color: "#D5DCC6" }
  ];
  const S = {
    mode: App.phone ? "solo" : "team", count: 2, names: store.get("quizNames", TEAM_DEF.map((t) => t.name)), timer: false,
    teams: [], qi: 0, revealed: false, awards: new Set(), solo: 0, left: 30, tick: null, tie: null
  };

  function stopTimer() { if (S.tick) { clearInterval(S.tick); S.tick = null; } }

  /* ---------- Настройка ---------- */
  function setup() {
    stopTimer();
    app.innerHTML = `<div class="qz__panel">
      <div class="qz__row qz__seg" role="group" aria-label="Режим">
        <span class="qz__label">Режим</span>
        <button type="button" data-mode="team" aria-pressed="${S.mode === "team"}">Команды</button>
        <button type="button" data-mode="solo" aria-pressed="${S.mode === "solo"}">Играю один</button>
      </div>
      ${S.mode === "team" ? `
      <div class="qz__row qz__seg" role="group" aria-label="Количество команд">
        <span class="qz__label">Сколько команд</span>
        ${[2, 3, 4].map((n) => `<button type="button" data-count="${n}" aria-pressed="${S.count === n}">${n}</button>`).join("")}
      </div>
      <div class="qz__teams">${Array.from({ length: S.count }, (_, i) => `<label class="qz__team-in">Команда<input type="text" data-team="${i}" value="${esc(S.names[i] || TEAM_DEF[i].name)}" maxlength="24"></label>`).join("")}</div>` : ""}
      <div class="qz__row qz__seg" role="group" aria-label="Таймер">
        <span class="qz__label">Таймер 30 секунд</span>
        <button type="button" data-timer="1" aria-pressed="${S.timer}">Включить</button>
        <button type="button" data-timer="0" aria-pressed="${!S.timer}">Без таймера</button>
      </div>
      <div class="qz__nav"><button class="btn btn--ink" type="button" id="qzStart">Начать викторину</button></div>
    </div>`;
  }
  app.addEventListener("input", (e) => {
    const t = e.target.closest("[data-team]");
    if (t) { S.names[+t.dataset.team] = t.value; store.set("quizNames", S.names); }
  });

  /* ---------- Вопрос ---------- */
  function scoreboard() {
    if (S.mode !== "team") return `<p class="qz__count">Верных ответов: ${S.solo} из ${Q.length}</p>`;
    return `<div class="score">${S.teams.map((t, i) => `<div class="score__team" data-t="${i}" style="background:${t.color};color:#2B2520"><span>${esc(t.name)}</span><b>${t.score}</b></div>`).join("")}</div>`;
  }
  function question() {
    stopTimer();
    const q = Q[S.qi];
    S.revealed = false; S.awards = new Set();
    app.innerHTML = `<div class="qz__panel">
      <div class="qz__top">
        <p class="qz__count">Вопрос ${S.qi + 1} из ${Q.length}</p>
        ${S.timer ? `<div class="qz__timer" aria-live="off"><svg viewBox="0 0 46 46" aria-hidden="true"><circle class="ring-bg" cx="23" cy="23" r="19"/><circle class="ring" cx="23" cy="23" r="19" stroke-dasharray="119.4" stroke-dashoffset="0"/></svg><span id="qzLeft">30</span></div>` : ""}
      </div>
      <p class="qz__q">${esc(q.q)}</p>
      <div class="qz__opts" role="group" aria-label="Варианты ответа">${q.options.map((o, i) => `<button class="qz__opt" type="button" data-o="${i}">${esc(o)}</button>`).join("")}</div>
      <div id="qzAfter" aria-live="polite"></div>
      <div class="qz__nav">${S.mode === "team" ? `<button class="btn btn--ink" type="button" id="qzReveal">Показать ответ</button>` : ""}</div>
    </div>${scoreboard()}`;
    if (S.timer) {
      S.left = 30;
      const ring = $(".ring", app);
      S.tick = setInterval(() => {
        S.left--;
        const el = $("#qzLeft"); if (!el) return stopTimer();
        el.textContent = S.left;
        ring.style.strokeDashoffset = (119.4 * (1 - S.left / 30)).toFixed(1);
        if (S.left <= 5 && S.left > 0) Sound.play("tick");
        if (S.left <= 0) { stopTimer(); if (!S.revealed) reveal(null); }
      }, 1000);
    }
  }
  function reveal(picked) {
    if (S.revealed) return;
    S.revealed = true; stopTimer();
    const q = Q[S.qi];
    $$(".qz__opt", app).forEach((b) => {
      const i = +b.dataset.o;
      b.setAttribute("aria-disabled", "true");
      if (i === q.correct) b.classList.add("is-correct");
      else if (i === picked) b.classList.add("is-wrong");
      else b.classList.add("is-faded");
    });
    const ok = picked === q.correct;
    if (S.mode === "solo") { if (ok) S.solo++; Sound.play(ok ? "correct" : "wrong"); }
    else Sound.play("correct");
    const last = S.qi === Q.length - 1;
    $("#qzAfter").innerHTML = `<div class="qz__explain">${S.mode === "solo" ? `<b>${ok ? "Верно!" : "Не совсем."}</b> ` : ""}${esc(q.explain)}</div>
      ${S.mode === "team" ? `<div class="qz__award"><p class="qz__label">Кто ответил верно? Отметьте команды</p><div class="qz__award-btns">${S.teams.map((t, i) => `<button type="button" data-award="${i}" aria-pressed="false">${esc(t.name)} +1</button>`).join("")}</div></div>` : ""}`;
    const nav = $(".qz__nav", app);
    nav.innerHTML = `<button class="btn btn--ink" type="button" id="qzNext">${last ? "Итоги" : "Следующий вопрос"}</button>`;
    const sc = app.querySelector(":scope > .qz__count"); if (sc) sc.textContent = `Верных ответов: ${S.solo} из ${Q.length}`;
    $("#qzNext").focus({ preventScroll: true });
  }
  function award(i, btn) {
    const on = !S.awards.has(i);
    on ? S.awards.add(i) : S.awards.delete(i);
    S.teams[i].score += on ? 1 : -1;
    btn.setAttribute("aria-pressed", on);
    const tile = $(`.score__team[data-t="${i}"]`, app);
    if (tile) { $("b", tile).textContent = S.teams[i].score; tile.classList.remove("is-bump"); void tile.offsetWidth; tile.classList.add("is-bump"); setTimeout(() => tile.classList.remove("is-bump"), 320); }
    Sound.play(on ? "stamp" : "click");
  }

  /* ---------- Итоги ---------- */
  function results() {
    stopTimer();
    if (S.mode === "solo") {
      const n = S.solo;
      const word = n >= 7 ? "Настоящий зоолог!" : n >= 5 ? "Отличный результат!" : n >= 3 ? "Неплохо, но есть куда расти." : "Самое время пройти экскурсию ещё раз.";
      app.innerHTML = `<div class="qz__panel"><p class="qz__final">${n} из ${Q.length}</p><p class="lead">${word}</p>
        <div class="qz__nav"><button class="btn btn--ink" type="button" id="qzAgain">Сыграть ещё раз</button></div></div>`;
      if (n >= 5) { App.confetti(180); Sound.play("fanfare"); }
      return;
    }
    const sorted = S.teams.map((t, i) => ({ ...t, i })).sort((a, b) => b.score - a.score);
    const top = sorted[0].score;
    const tied = sorted.filter((t) => t.score === top);
    const max = Math.max(1, top);
    app.innerHTML = `<div class="qz__panel">
      <p class="qz__final">${tied.length > 1 && !S.tie ? "Ничья!" : "Победили " + esc(sorted[0].name)}</p>
      <div class="podium">${sorted.map((t) => `<div class="podium__col"><p class="podium__name">${esc(t.name)}</p><div class="podium__bar" data-h="${Math.max(14, (t.score / max) * 240)}" style="background:${t.color};color:#2B2520">${t.score}</div></div>`).join("")}</div>
      <div class="qz__nav">
        ${tied.length > 1 && !S.tie ? `<button class="btn btn--ink" type="button" id="qzTie">Вопрос на рассуждение</button>` : ""}
        <button class="btn btn--line" type="button" id="qzAgain">Новая игра</button>
      </div></div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => $$(".podium__bar", app).forEach((b) => (b.style.height = b.dataset.h + "px"))));
    if (!(tied.length > 1 && !S.tie)) { App.confetti(220); Sound.play("fanfare"); }
  }
  function tiebreak() {
    const top = Math.max(...S.teams.map((t) => t.score));
    S.tie = S.teams.map((t, i) => ({ ...t, i })).filter((t) => t.score === top);
    app.innerHTML = `<div class="qz__panel">
      <p class="qz__count">Дополнительный вопрос</p>
      <p class="qz__q">${esc(ZOO.tiebreak.q)}</p>
      <p class="lead">Командам минута на обсуждение. Побеждает самое убедительное объяснение с примером.</p>
      <div id="qzSample"></div>
      <div class="qz__award"><p class="qz__label">Чьё объяснение лучше?</p><div class="qz__award-btns">${S.tie.map((t) => `<button type="button" data-win="${t.i}">${esc(t.name)}</button>`).join("")}</div></div>
      <div class="qz__nav"><button class="btn btn--line" type="button" id="qzShowSample">Пример хорошего ответа</button></div>
    </div>`;
  }

  /* ---------- Клики ---------- */
  app.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.mode) { S.mode = b.dataset.mode; setup(); Sound.play("click"); return; }
    if (b.dataset.count) { S.count = +b.dataset.count; setup(); Sound.play("click"); return; }
    if (b.dataset.timer) { S.timer = b.dataset.timer === "1"; setup(); Sound.play("click"); return; }
    if (b.id === "qzStart") {
      S.teams = Array.from({ length: S.count }, (_, i) => ({ name: (S.names[i] || TEAM_DEF[i].name).trim() || TEAM_DEF[i].name, color: TEAM_DEF[i].color, score: 0 }));
      S.qi = 0; S.solo = 0; S.tie = null; Sound.play("whoosh"); question(); return;
    }
    if (b.classList.contains("qz__opt")) { if (!S.revealed) reveal(+b.dataset.o); return; }
    if (b.id === "qzReveal") { reveal(null); return; }
    if (b.dataset.award != null) { award(+b.dataset.award, b); return; }
    if (b.id === "qzNext") { if (S.qi < Q.length - 1) { S.qi++; question(); Sound.play("whoosh"); } else results(); return; }
    if (b.id === "qzTie") { tiebreak(); return; }
    if (b.id === "qzShowSample") { $("#qzSample").innerHTML = `<div class="qz__explain">${esc(ZOO.tiebreak.sample)}</div>`; b.remove(); return; }
    if (b.dataset.win != null) { S.teams[+b.dataset.win].score += 1; results(); return; }
    if (b.id === "qzAgain") { setup(); return; }
  });

  /* Клавиши 1-4 выбирают ответ, когда викторина на экране */
  document.addEventListener("keydown", (e) => {
    if (App.slideId !== "quiz") return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    if (/^[1-4]$/.test(e.key)) {
      const b = $(`.qz__opt[data-o="${+e.key - 1}"]`, app);
      if (b && !S.revealed) { e.preventDefault(); reveal(+b.dataset.o); }
    }
  });

  setup();
})();
