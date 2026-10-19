const CONFIG = {
  name: "Dhaks",

  opening: [
    { text: "Hey Dhaks...", hold: 1800 },
    { text: "Wanna play a game?", hold: 2000 },
    { text: "Wanna escape reality for a while?", hold: 1500, focus: true }
  ],

  noSequence: [
    { text: "You came all the way here just to choose NO?", scale: 0.95 },
    { text: "Dhaks.", scale: 0.9, dodge: true },
    { text: "Stop.", scale: 0.85, dodge: true },
    { text: "I'm not accepting that answer. 😭", scale: 0.8, dodge: true },
    { text: "The NO button is nervous now.", scale: 0.7, dodge: true },
    { text: "Okay fine. You win.", scale: 0.6, then: { text: "...NOPE.", delay: 2000 } }
  ],
  maxDodges: 3,
  yesReply: "I knew you'd say yes.",

  stories: [
    { 
      id: "royal", 
      theme: "t-royal",
      title: "Heirs of the Crown", 
      genre: "Historical Romance",
      tagline: "Three heirs. Three hearts. One crown.",
      image: "assets/images/fantasy-cover.png", 
      alt: "Heirs of the Crown cover",
      route: "stories/fantasy/",
      audio: "fantasy"
    },
    { 
      id: "mafia", 
      theme: "t-mafia",
      title: "Blood Bound", 
      genre: "Dark Romance • Mafia",
      tagline: "Everyone fears him. Until she walks into his world.",
      image: "assets/images/mafia-cover.png", 
      alt: "Blood Bound mafia romance cover",
      route: "stories/mafia/",
      audio: "mafia"
    },
    { 
      id: "still", 
      theme: "t-still",
      title: "Still With You", 
      genre: "High School Romance",
      tagline: "Some people enter your life as strangers... and become your forever.",
      image: "assets/images/still-with-you-cover.png", 
      alt: "Still With You cover",
      route: "stories/still-with-you/",
      audio: "still-with-you"
    },
    { 
      id: "reality", 
      theme: "t-reality",
      title: "Reality", 
      genre: "Birthday Special",
      tagline: "Some stories aren't fiction. They are meant to be lived.",
      image: "assets/images/reality-cover.png", 
      alt: "Reality cover",
      route: "stories/reality/",
      audio: "reality"
    }
  ],

  audio: {
    opening: "assets/audio/opening.mp3",
    selection: "assets/audio/selection.mp3",
    fantasy: "assets/audio/fantasy.mp3",
    mafia: "assets/audio/mafia.mp3",
    "still-with-you": "assets/audio/still-with-you.mp3",
    reality: "assets/audio/reality.mp3"
  }
};

const $ = id => document.getElementById(id);
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Audio Engine ---------- */
const Sound = {
  current: null,
  play(key) {
    const src = CONFIG.audio[key];
    if (!src) return;
    try {
      const next = new Audio(src);
      next.loop = true;
      next.volume = 0;
      next.addEventListener("error", () => {}, { once: true });
      const p = next.play();
      if (p && p.catch) p.catch(() => {});
      this.fade(next, 0.6, 2000);
      if (this.current) {
        const old = this.current;
        this.fade(old, 0, 1500, () => old.pause());
      }
      this.current = next;
    } catch (e) {}
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

/* ---------- Canvas Particle Dust Engine ---------- */
const Atmosphere = (() => {
  const c = $("atmosphere");
  if (!c) return { boost: () => {} };
  const ctx = c.getContext("2d");
  let w, h, dots = [], speed = 1, target = 1;

  const resize = () => {
    const d = Math.min(devicePixelRatio || 1, 2);
    w = window.innerWidth; 
    h = window.innerHeight;
    c.width = w * d; 
    c.height = h * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  };

  const make = () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.4 + 0.3,
    vx: (Math.random() - 0.5) * 0.08,
    vy: -Math.random() * 0.12 - 0.02,
    a: Math.random() * 0.55 + 0.15,
    t: Math.random() * 6,
    gold: Math.random() < 0.3
  });

  resize();
  window.addEventListener("resize", resize);
  dots = Array.from({ length: window.innerWidth < 700 ? 35 : 65 }, make);

  (function frame() {
    speed += (target - speed) * 0.02;
    ctx.clearRect(0, 0, w, h);
    for (const p of dots) {
      p.x += p.vx * speed; 
      p.y += p.vy * speed; 
      p.t += 0.02;
      if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
      if (p.x < -5) p.x = w + 5; 
      if (p.x > w + 5) p.x = -5;
      const tw = p.a * (0.6 + 0.4 * Math.sin(p.t));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.gold ? `rgba(212,175,106,${tw})` : `rgba(245,239,230,${tw})`;
      ctx.shadowBlur = p.r * 4;
      ctx.shadowColor = ctx.fillStyle;
      ctx.fill();
    }
    requestAnimationFrame(frame);
  })();

  return { boost: v => (target = v) };
})();

/* ---------- Opening & Interactive Sequence ---------- */
const linesEl = $("lines");
const choices = $("choices");
const yesBtn = $("yesBtn");
const noBtn = $("noBtn");

let noCount = 0, dodges = 0, locked = false, audioStarted = false;
let noConfirm = false, noSequenceStarted = false;

async function transitionLine(text, focus) {
  const old = linesEl.querySelector(".line");
  if (old) {
    old.classList.remove("show");
    old.classList.add("out");
    await wait(600);
  }
  linesEl.innerHTML = "";
  
  const el = document.createElement("p");
  el.className = "line" + (focus ? " focus" : "");
  el.textContent = text;
  linesEl.append(el);
  
  // Force browser layout repaint so opacity transition fires reliably
  void el.offsetHeight;
  el.classList.add("show");
}

async function playOpening() {
  await wait(200);
  for (const item of CONFIG.opening) {
    await transitionLine(item.text, item.focus);
    await wait(item.hold);
  }
  choices.hidden = false;
  yesBtn.focus();
}

function startAudioOnce() {
  if (audioStarted) return;
  audioStarted = true;
  Sound.play("opening");
}

function dodge() {
  if (!noBtn.dataset.dodge || dodges >= CONFIG.maxDodges || locked) return;
  dodges++;
  const dx = (Math.random() < 0.5 ? -1 : 1) * (35 + Math.random() * 45);
  const dy = (Math.random() - 0.5) * 50;
  noBtn.style.transform = `translate(${dx}px, ${dy}px) scale(0.85)`;
}
noBtn.addEventListener("pointerenter", dodge);

noBtn.addEventListener("click", async () => {
  if (locked) return;
  startAudioOnce();
  locked = true;

  if (noConfirm) {
    noConfirm = false;
    noSequenceStarted = false;
    noCount = 0;
    yesBtn.textContent = "YES";
    noBtn.textContent = "NO";
    noBtn.dataset.dodge = "";
    noBtn.style.transform = "scale(1)";
    await transitionLine("Wanna escape reality for a while?", true);
    locked = false;
    return;
  }

  if (!noSequenceStarted) {
    noConfirm = true;
    await transitionLine("Are you sure?", true);
    yesBtn.textContent = "YES, I'M SURE";
    noBtn.textContent = "I CHANGED MY MIND";
    locked = false;
    return;
  }

  const s = CONFIG.noSequence[noCount];
  if (!s) { locked = false; return; }
  noCount++;
  await transitionLine(s.text, true);

  noBtn.style.transform = `scale(${s.scale})`;
  noBtn.dataset.dodge = s.dodge ? "1" : "";
  dodges = 0;
  if (noCount >= 3) yesBtn.classList.add("inviting");

  if (s.then) {
    await wait(s.then.delay);
    await transitionLine(s.then.text, true);
    noBtn.classList.add("gone");
    yesBtn.classList.add("inviting", "big");
  }
  locked = false;
});

yesBtn.addEventListener("click", async () => {
  if (locked) return;

  if (noConfirm) {
    locked = true;
    noConfirm = false;
    noSequenceStarted = true;
    yesBtn.textContent = "YES";
    noBtn.textContent = "NO";
    noCount = 0;
    await transitionLine("Really? 😐", true);
    locked = false;
    return;
  }

  locked = true;
  startAudioOnce();
  choices.classList.add("fading");
  await wait(600);
  choices.hidden = true;

  await transitionLine(CONFIG.yesReply, true);
  await wait(1800);

  Atmosphere.boost(5);
  $("sweep").classList.add("go");

  const reply = linesEl.querySelector(".line");
  if (reply) {
    reply.classList.remove("show");
    reply.classList.add("out");
  }

  await wait(800);
  $("opening").classList.add("leaving");
  await wait(1200);
  $("opening").hidden = true;
  Atmosphere.boost(1);
  showLibrary(true);
});

/* ---------- Library Cards Builder ---------- */
function buildCards() {
  const wrap = $("cards");
  if (!wrap) return;
  wrap.innerHTML = "";
  CONFIG.stories.forEach(s => {
    const a = document.createElement("a");
    a.className = `card ${s.theme}`;
    a.href = s.route;
    a.setAttribute("aria-label", `${s.title} — ${s.genre}`);
    a.innerHTML = `
      <div class="fallback"></div>
      <img src="${s.image}" alt="${s.alt}" loading="lazy">
      <div class="meta">
        <div class="genre">${s.genre}</div>
        <div class="title">${s.title}</div>
        <div class="tagline">${s.tagline}</div>
      </div>
    `;
    const img = a.querySelector("img");
    img.addEventListener("error", () => a.classList.add("no-image"));
    wrap.append(a);
  });
}

async function showLibrary(withAudio) {
  const lib = $("library");
  lib.hidden = false;
  window.scrollTo(0, 0);
  if (withAudio) Sound.play("selection");

  await wait(300);
  const header = document.querySelector(".library-header");
  if (header) header.classList.add("in");

  await wait(400);
  const cards = document.querySelectorAll(".card");
  cards.forEach((c, i) => {
    setTimeout(() => c.classList.add("in"), i * 180);
  });
}

/* ---------- Boot On DOM Ready ---------- */
function init() {
  buildCards();
  if (location.hash === "#library") {
    $("opening").hidden = true;
    showLibrary(false);
  } else {
    playOpening();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
