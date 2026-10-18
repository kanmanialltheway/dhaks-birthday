/* =====================================================================
   DHAKS — PART 1 : opening, YES/NO, story selection
   Everything you may want to edit lives in CONFIG (top of this file).
   ===================================================================== */

const CONFIG = {
  name: "Dhaks",

  /* ---- Opening lines. `hold` = ms the line stays before the next one. ---- */
  opening: [
    { text: "Hey Dhaks...",                       hold: 2800 },
    { text: "Wanna play a game?",                 hold: 3000 },
    { text: "Wanna escape reality for a while?",  hold: 1800, focus: true }
  ],

  /* ---- NO sequence. One entry per NO click, in order.
        text  : message shown after that click
        label : what the NO button says NEXT
        dodge : button runs from the cursor (max `maxDodges` times per click)
        scale : size of the NO button
        then  : optional auto follow-up line (ends the sequence, YES takes over) ---- */
 noSequence: [
  { text: "You came all the way here just to choose NO?", label: "NO", scale: .95 },
  { text: "Dhaks.", label: "NO", scale: .9, dodge: true },
  { text: "Stop.", label: "NO", scale: .85, dodge: true },
  { text: "I'm not accepting that answer. 😭", label: "NO", scale: .8, dodge: true },
  { text: "The NO button is getting nervous, by the way.", label: "NO", scale: .7, dodge: true },
  { text: "Okay fine. You win.", label: "NO", scale: .6, then: { text: "...NOPE.", delay: 2600 } }
],
  maxDodges: 3,            // how many times the NO button may flee per click (keeps it fair)
  yesReply: "I knew you'd say yes.",

  /* ---- Story cards. Change titles, taglines, image paths, routes here. ---- */
  stories: [
    { id: "fantasy", theme: "t-fantasy", title: "YOU ARE MY FANTASY", genre: "Dark Fantasy • Supernatural Romance",
      tagline: "Some stories are written by fate.",
      image: "assets/images/fantasy-cover.png", alt: "Cover of You Are My Fantasy, a dark fantasy supernatural romance",
      route: "stories/fantasy/", audio: "fantasy" },
    { id: "mafia", theme: "t-mafia", title: "THE MAFIA KING", genre: "Dark Romance • Mafia",
      tagline: "Everyone fears him. Until she walks into his world.",
      image: "assets/images/mafia-cover.png", alt: "Cover of The Mafia King, a dark mafia romance",
      route: "stories/mafia/", audio: "mafia" },
    { id: "still", theme: "t-still", title: "STILL WITH YOU", genre: "School • College • Romance",
      tagline: "Some people enter your life as strangers... and become your forever.",
      image: "assets/images/still-with-you-cover.png", alt: "Cover of Still With You, a school and college romance",
      route: "stories/still-with-you/", audio: "still-with-you" },
    { id: "reality", theme: "t-reality", title: "REALITY", genre: "Real Life • Birthday",
      tagline: "Some stories are meant to be lived.",
      image: "assets/images/reality-cover.png", alt: "Cover of Reality, an open storybook leading toward warm golden light",
      route: "stories/reality/", audio: "reality" }
  ],

  /* ---- Audio paths. Files may be missing — the site works fine without them. ---- */
  audio: {
    opening: "assets/audio/opening.mp3",
    selection: "assets/audio/selection.mp3",
    fantasy: "assets/audio/fantasy.mp3",
    mafia: "assets/audio/mafia.mp3",
    "still-with-you": "assets/audio/still-with-you.mp3",
    reality: "assets/audio/reality.mp3"
  }
};

/* ---------------------------------------------------------------------
   Helpers
   --------------------------------------------------------------------- */
const $ = id => document.getElementById(id);
const wait = ms => new Promise(r => setTimeout(r, ms));
const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------------------------------------------------------------
   Audio manager — silent no-op if a file is missing; never auto-plays
   before the first click. Later stories can call Sound.play("fantasy").
   --------------------------------------------------------------------- */
const Sound = {
  current: null,
  play(key) {
    const src = CONFIG.audio[key];
    if (!src) return;
    try {
      const next = new Audio(src);
      next.loop = true; next.volume = 0;
      next.addEventListener("error", () => {}, { once: true });
      const p = next.play();
      if (p && p.catch) p.catch(() => {});
      this.fade(next, .6, 2000);
      if (this.current) { const old = this.current; this.fade(old, 0, 1500, () => old.pause()); }
      this.current = next;
    } catch (e) { /* ignore */ }
  },
  fade(a, to, ms, done) {
    const from = a.volume, t0 = performance.now();
    (function step(t) {
      const k = Math.min(1, (t - t0) / ms);
      a.volume = from + (to - from) * k;
      k < 1 ? requestAnimationFrame(step) : done && done();
    })(t0);
  }
};

/* ---------------------------------------------------------------------
   Atmosphere — one lightweight canvas: stars + drifting dust (~70 dots)
   --------------------------------------------------------------------- */
const Atmosphere = (() => {
  const c = $("atmosphere"), ctx = c.getContext("2d");
  let w, h, dots = [], speed = 1, target = 1;
  const resize = () => {
    const d = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight; c.width = w * d; c.height = h * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  const make = () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.4 + .3,
    vx: (Math.random() - .5) * .08, vy: -Math.random() * .12 - .02, a: Math.random() * .6 + .15,
    t: Math.random() * 6, gold: Math.random() < .25 });
  resize(); addEventListener("resize", resize);
  dots = Array.from({ length: innerWidth < 700 ? 45 : 75 }, make);
  (function frame() {
    speed += (target - speed) * .02;
    ctx.clearRect(0, 0, w, h);
    for (const p of dots) {
      p.x += p.vx * speed; p.y += p.vy * speed; p.t += .02;
      if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
      if (p.x < -5) p.x = w + 5; if (p.x > w + 5) p.x = -5;
      const tw = p.a * (.6 + .4 * Math.sin(p.t));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fillStyle = p.gold ? `rgba(231,184,102,${tw})` : `rgba(230,225,255,${tw})`;
      ctx.shadowBlur = p.r * 5; ctx.shadowColor = ctx.fillStyle; ctx.fill();
    }
    requestAnimationFrame(frame);
  })();
  return { boost: v => (target = v) };
})();

/* ---------------------------------------------------------------------
   Opening + YES / NO
   --------------------------------------------------------------------- */
const linesEl = $("lines"), choices = $("choices"), yesBtn = $("yesBtn"), noBtn = $("noBtn");
let noCount = 0, dodges = 0, locked = false, audioStarted = false;
let noConfirm = false;
let noSequenceStarted = false;

function addLine(text, opts = {}) {
  const el = document.createElement("p");
  el.className = "line" + (opts.focus ? " focus" : "");
  el.textContent = text;
  linesEl.append(el);
  return el;
}
async function setMessage(text, shake) {          // swap the single message line
  const old = linesEl.querySelector(".line");
  if (old) { old.style.transition = "opacity .3s"; old.style.opacity = 0; await wait(320); }
  linesEl.innerHTML = "";
  const el = addLine(text, { focus: true });
  if (shake) el.classList.add("shake");
}

async function playOpening() {
  await wait(1200);

  for (const l of CONFIG.opening) {
    // Remove the previous line before showing the next one
    const old = linesEl.querySelector(".line");

    if (old) {
      old.style.transition = "opacity .6s ease";
      old.style.opacity = "0";
      await wait(650);
      linesEl.innerHTML = "";
    }

    // Show the new line
    const el = addLine(l.text, l);

    // Small cinematic entrance
    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";

    await wait(50);

    el.style.transition = "opacity .7s ease, transform .7s ease";
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";

    await wait(l.hold);
  }

  choices.hidden = false;
  yesBtn.focus({ preventScroll: true });
}

function startAudioOnce() {                       // YES/NO click = user interaction
  if (audioStarted) return; audioStarted = true; Sound.play("opening");
}

/* NO button behaviour */
function applyNoStage(index) {
  const s = CONFIG.noSequence[index];
  if (!s) return;

  noBtn.textContent = "NO";
  noBtn.style.transform = `scale(${s.scale})`;
  noBtn.dataset.dodge = s.dodge ? "1" : "";

  noBtn.classList.remove("wiggle");
  void noBtn.offsetWidth;
  noBtn.classList.add("wiggle");

  dodges = 0;
  noBtn.style.translate = "0 0";

  if (index >= 3) {
    yesBtn.classList.add("inviting");
  }
}
function dodge() {
  if (!noBtn.dataset.dodge || dodges >= CONFIG.maxDodges || locked) return;
  dodges++;
  const r = noBtn.getBoundingClientRect(), pad = 16;
  const dx = (Math.random() < .5 ? -1 : 1) * (60 + Math.random() * 90);
  const dy = (Math.random() - .5) * 100;
  const x = Math.min(Math.max(r.left + dx, pad), innerWidth - r.width - pad) - r.left;
  const y = Math.min(Math.max(r.top + dy, pad), innerHeight - r.height - pad) - r.top;
  const cur = (noBtn.style.translate || "0 0").split(" ").map(parseFloat);
  noBtn.style.translate = `${(cur[0] || 0) + x}px ${(cur[1] || 0) + y}px`;
  if (dodges === CONFIG.maxDodges) {              // blink out/in once, then it settles
    noBtn.classList.add("vanish"); setTimeout(() => noBtn.classList.remove("vanish"), 700);
  }
}
noBtn.addEventListener("pointerenter", dodge);

noBtn.addEventListener("click", async () => {
  if (locked) return;

  startAudioOnce();
  locked = true;

  // -----------------------------------------
  // "I CHANGED MY MIND" → return to original
  // -----------------------------------------
  if (noConfirm) {
    noConfirm = false;
    noSequenceStarted = false;
    noCount = 0;

    yesBtn.textContent = "YES";
    noBtn.textContent = "NO";

    yesBtn.classList.remove("confirm");
    noBtn.classList.remove("confirm");

    noBtn.dataset.dodge = "";
    noBtn.style.transform = "scale(1)";
    noBtn.style.translate = "0 0";

    await setMessage("Wanna escape reality for a while?", true);

    locked = false;
    return;
  }

  // -----------------------------------------
  // FIRST NO → "Are you sure?"
  // -----------------------------------------
  if (!noSequenceStarted) {
    noConfirm = true;

    await setMessage("Are you sure?", true);

    yesBtn.textContent = "YES, I'M SURE";
    noBtn.textContent = "I CHANGED MY MIND";

    yesBtn.classList.add("confirm");
    noBtn.classList.add("confirm");

    locked = false;
    return;
  }

  // -----------------------------------------
  // NORMAL NO SEQUENCE
  // -----------------------------------------
  const s = CONFIG.noSequence[noCount];

  if (!s) {
    locked = false;
    return;
  }

  noCount++;

  await setMessage(s.text, true);

  applyNoStage(noCount - 1);

  // Final "Okay fine. You win." → "...NOPE."
  if (s.then) {
    noBtn.classList.add("vanish");

    await wait(s.then.delay);

    await setMessage(s.then.text, true);

    noBtn.classList.add("gone");
    yesBtn.classList.add("inviting", "big");
  }

  locked = false;
});
yesBtn.addEventListener("click", async () => {
  if (locked) return;

  // If we're on the NO confirmation screen,
  // YES means "I'm sure I want NO"
  if (noConfirm) {
  locked = true;

  noConfirm = false;
  noSequenceStarted = true;

  yesBtn.textContent = "YES";
  noBtn.textContent = "NO";

  yesBtn.classList.remove("confirm");
  noBtn.classList.remove("confirm");

  noCount = 0;

  await setMessage("Really? 😐", true);

  // Prepare the first actual NO stage
  applyNoStage(0);

  locked = false;
  return;
}

  // Normal YES → enter the game
  locked = true;

  startAudioOnce();

  choices.classList.add("fading");

  await wait(1000);

  choices.hidden = true;

  await setMessage(CONFIG.yesReply);

  await wait(3200);

  Atmosphere.boost(7);

  $("sweep").classList.add("go");

  const reply = linesEl.querySelector(".line");
  reply.classList.add("out");

  await wait(1400);

  $("opening").classList.add("leaving");

  await wait(2000);

  $("opening").hidden = true;

  Atmosphere.boost(1);

  showLibrary(true);
});

/* ---------------------------------------------------------------------
   Story selection
   --------------------------------------------------------------------- */
function buildCards() {
  const wrap = $("cards");
  CONFIG.stories.forEach(s => {
    const a = document.createElement("a");
    a.className = `card ${s.theme}`; a.href = s.route; a.dataset.story = s.id;
    a.setAttribute("aria-label", `${s.title} — ${s.genre}`);
    a.innerHTML = `
      <div class="fallback"></div>
      <img src="${s.image}" alt="${s.alt}" loading="lazy" decoding="async">
      <div class="glint"></div>
      <div class="meta">
        <div class="genre">${s.genre}</div>
        <div class="title">${s.title}</div>
        <div class="tagline">${s.tagline}</div>
      </div>`;
    a.querySelector("img").addEventListener("error", () => a.classList.add("no-image"));
    wrap.append(a);
  });
}
async function showLibrary(withAudio) {
  const lib = $("library"); lib.hidden = false; window.scrollTo(0, 0);
  if (withAudio) Sound.play("selection");
  await wait(rm ? 0 : 1800);                      // title fades in first
  const cards = [...document.querySelectorAll(".card")];
  for (const c of cards) { c.classList.add("in"); await wait(rm ? 0 : 450); }
  setTimeout(() => cards.forEach(c => c.classList.add("float")), 1500);
}

/* ---------------------------------------------------------------------
   Boot — add #library to the URL to skip straight to the selection screen
   (placeholder story pages use this for their "Back" button).
   --------------------------------------------------------------------- */
buildCards();
if (location.hash === "#library") { $("opening").hidden = true; showLibrary(false); }
else playOpening();
