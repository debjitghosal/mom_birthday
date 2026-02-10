// ===============================
// Candle start (hold 5 sec) -> flame out -> BOOM + fireworks (WITH SOUND) -> start music -> start movie
// Movie: full images (no crop), lower-third cursive typewriter, floating emojis
// ===============================

// Slides (kept as your order, with nice titles)
const SLIDES = [
  { file: "img14.jpeg", title: "Happy Birthday, Ma ❤️", quote: "Ma… the sky tried its best,\nbut you still stole the scene." },
  { file: "img9.jpeg",  title: "Me & You", quote: "In front of Saraswati Maa,\nI didn’t ask for anything.\nI already had my blessing: you." },
  { file: "img1.jpeg",  title: "Laal Pari ❤️", quote: "Laal Pari energy, Ma…\nsoft heart, strong soul,\nand grace that shines." },
  { file: "img3.jpeg",  title: "The Trio", quote: "Durga Pujo lights… golden memories…\nand you in the middle —\nour home in human form." },
  { file: "img2.jpeg",  title: "Cool Mom 😎", quote: "Sunglasses on, confidence loud…\nMa, you didn’t pose —\nyou owned the moment." },
  { file: "img4.jpeg",  title: "Sunflower Vibes 🌻", quote: "You looked like a sunflower —\nbright, warm,\nand making everyone feel okay." },
  { file: "img5.jpeg",  title: "Himachal Trip", quote: "Mountains were huge…\nbut with you there,\neverything felt safe." },
  { file: "img6.jpeg",  title: "With Your Best Friends", quote: "With Satarupa and Sunanda,\nI see your happiest version —\nreal smile, pure joy." },
  { file: "img7.jpeg",  title: "Golden Glow ✨", quote: "Golden saree… golden aura…\nMa, this is not a look,\nit’s royalty." },
  { file: "img8.jpeg",  title: "Blue Saree Beauty", quote: "Some photos don’t need filters…\nthis one has only grace,\nconfidence,\nand you." },
  { file: "img10.jpeg", title: "Birthday Memory", quote: "A cake can hold a photo…\nbut it can’t hold\nhow much we love you." },
  { file: "img11.jpeg", title: "Soft & Lovely", quote: "Like flowers in a calm room…\nyou carry beauty\nin the quietest way." },
  { file: "img13.jpeg", title: "You Deserve This", quote: "Pool, palms, peace…\nMa, I love seeing you\nlive for yourself." },
  { file: "img12.jpeg", title: "Family ❤️", quote: "All four of us together…\nMa, you’re the reason\nthis feels like a family." },
];

// Timing
const SLIDE_MS = 9500;
const TYPE_SPEED = 26;
const TYPE_DELAY = 420;

const MOTIONS = ["motion-fade","motion-float","motion-flyL","motion-flyR","motion-zoom","motion-drift"];

// Music (starts AFTER candle + celebration)
const MUSIC_VOLUME = 0.58;
const LOOP_SEGMENT = true;
const LOOP_START_SEC = 18;
const LOOP_END_SEC   = 175;

// Candle hold timing
const HOLD_TOTAL_MS = 5000; // ✅ 5 seconds

const $ = (id) => document.getElementById(id);

// Start overlay candle
const startOverlay = $("startOverlay");
const blowBtn = $("blowBtn");
const blowText = $("blowText");
const holdFill = $("holdFill");
const flame = $("flame");

// Controls / HUD
const prevBtn = $("prevBtn");
const nextBtn = $("nextBtn");
const pauseBtn = $("pauseBtn");
const muteBtn = $("muteBtn");
const hudText = $("hudText");

// Slides DOM
const slideA = $("slideA");
const slideB = $("slideB");
const imgA = $("imgA");
const imgB = $("imgB");
const titleA = $("titleA");
const titleB = $("titleB");
const quoteA = $("quoteA");
const quoteB = $("quoteB");
const cursorA = $("cursorA");
const cursorB = $("cursorB");

// Ending
const ending = $("ending");
const replayBtn = $("replayBtn");

// Progress
const barFill = $("barFill");
const countText = $("countText");

// Music
const bgm = $("bgm");

// Floating emojis
const floatLayer = $("floatLayer");

// Fireworks canvas
const fxCanvas = $("fxCanvas");
const fxCtx = fxCanvas.getContext("2d");

// State
let i = 0;
let usingA = true;
let playing = false;
let muted = false;
let timer = null;
let typingAbort = { abort: false };

// Candle state
let holding = false;
let holdStart = 0;
let holdRaf = null;
let candleDone = false;

// --------------- Resize canvas ---------------
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  fxCanvas.width = Math.floor(window.innerWidth * dpr);
  fxCanvas.height = Math.floor(window.innerHeight * dpr);
  fxCanvas.style.width = window.innerWidth + "px";
  fxCanvas.style.height = window.innerHeight + "px";
  fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// =====================================================
// Celebration Sounds (no external files; works offline)
// =====================================================
let _sfxCtx = null;
function getSfxCtx() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!_sfxCtx) _sfxCtx = new AudioCtx();
  if (_sfxCtx.state === "suspended") _sfxCtx.resume().catch(()=>{});
  return _sfxCtx;
}

function makeNoiseBuffer(ctx, durationSec = 0.25) {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1);
  return buffer;
}

function playBoom(at = 0) {
  const ctx = getSfxCtx();
  const t0 = ctx.currentTime + at;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = "sine";
  osc.frequency.setValueAtTime(85, t0);
  osc.frequency.exponentialRampToValueAtTime(32, t0 + 0.35);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(180, t0);

  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(t0);
  osc.stop(t0 + 0.6);

  // thump noise
  const noise = ctx.createBufferSource();
  noise.buffer = makeNoiseBuffer(ctx, 0.18);

  const nFilter = ctx.createBiquadFilter();
  nFilter.type = "bandpass";
  nFilter.frequency.setValueAtTime(110, t0);
  nFilter.Q.value = 0.8;

  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.0001, t0);
  nGain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
  nGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);

  noise.connect(nFilter);
  nFilter.connect(nGain);
  nGain.connect(ctx.destination);

  noise.start(t0);
  noise.stop(t0 + 0.25);
}

function playPop(at = 0, pitch = 520) {
  const ctx = getSfxCtx();
  const t0 = ctx.currentTime + at;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(pitch, t0);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.8, t0 + 0.10);

  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.10, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(t0);
  osc.stop(t0 + 0.18);
}

function playCrackle(at = 0, duration = 0.35) {
  const ctx = getSfxCtx();
  const t0 = ctx.currentTime + at;

  const noise = ctx.createBufferSource();
  noise.buffer = makeNoiseBuffer(ctx, duration);

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(900, t0);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.09, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  // spark pops
  const sparks = 6 + Math.floor(Math.random()*5);
  for (let k = 0; k < sparks; k++) {
    const dt = (Math.random() * duration) * 0.9;
    playPop(at + dt, 420 + Math.random()*520);
  }

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(t0);
  noise.stop(t0 + duration + 0.02);
}

function playFireworkBurst(at = 0) {
  playBoom(at);
  playCrackle(at + 0.10, 0.45 + Math.random()*0.25);
  playPop(at + 0.06, 650 + Math.random()*350);
}

// --------------- Music ---------------
function fadeVolumeTo(target, ms, cb) {
  const startV = bgm.volume;
  const steps = 28;
  let n = 0;
  const stepMs = Math.max(16, Math.floor(ms / steps));
  const t = setInterval(() => {
    n++;
    const v = startV + (target - startV) * (n / steps);
    bgm.volume = Math.max(0, Math.min(1, v));
    if (n >= steps) {
      clearInterval(t);
      bgm.volume = target;
      if (cb) cb();
    }
  }, stepMs);
}

async function startMusic() {
  if (muted) return;
  try {
    bgm.volume = 0;
    bgm.loop = !LOOP_SEGMENT;
    if (LOOP_SEGMENT) bgm.currentTime = LOOP_START_SEC;
    await bgm.play();
    fadeVolumeTo(MUSIC_VOLUME, 900);
  } catch {
    muted = true;
    muteBtn.textContent = "Unmute";
  }
}

function stopMusic() {
  fadeVolumeTo(0, 350, () => bgm.pause());
}

bgm.addEventListener("timeupdate", () => {
  if (!LOOP_SEGMENT) return;
  if (bgm.currentTime >= LOOP_END_SEC) {
    bgm.currentTime = LOOP_START_SEC;
    if (!bgm.paused) bgm.play().catch(()=>{});
  }
});

// --------------- Floating Emojis ---------------
const EMOJIS = ["❤️","💖","💗","💞","💕","💘","✨","🌸","🫶","😘","🎉"];

function spawnFloatEmoji(strong = false) {
  const el = document.createElement("div");
  el.className = "floatEmoji";
  el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

  const x = Math.random() * 100;
  const size = strong ? (26 + Math.random()*16) : (16 + Math.random()*16);
  const dur = strong ? (2.2 + Math.random()*1.2) : (4.0 + Math.random()*3.2);
  const drift = (Math.random() - 0.5) * 160;

  el.style.left = `${x}%`;
  el.style.fontSize = `${size}px`;

  floatLayer.appendChild(el);

  el.animate(
    [
      { transform: "translateY(0) translateX(0) scale(0.9)", opacity: 0 },
      { opacity: 0.95, offset: 0.15 },
      { transform: `translateY(-120vh) translateX(${drift}px) scale(1.25)`, opacity: 0 }
    ],
    { duration: dur * 1000, easing: "linear", fill: "forwards" }
  );

  setTimeout(() => el.remove(), dur * 1000 + 200);
}

let floatLoop = null;
function startFloatLoop() {
  stopFloatLoop();
  floatLoop = setInterval(() => spawnFloatEmoji(false), 360);
}
function stopFloatLoop() {
  if (floatLoop) clearInterval(floatLoop);
  floatLoop = null;
}
function burstEmojis() {
  for (let k = 0; k < 18; k++) setTimeout(() => spawnFloatEmoji(true), k * 55);
}

// --------------- Fireworks (visual) ---------------
let fireworks = [];

function launchFirework() {
  const x = 0.2 + Math.random()*0.6;
  const y = 0.18 + Math.random()*0.30;
  const color = `hsl(${Math.floor(Math.random()*360)}, 92%, 66%)`;
  const particles = [];
  const count = 85 + Math.floor(Math.random()*55);

  for (let i=0;i<count;i++){
    const a = Math.random() * Math.PI * 2;
    const s = 1.6 + Math.random()*3.6;
    particles.push({
      x: x*window.innerWidth,
      y: y*window.innerHeight,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 70 + Math.random()*55,
      color,
      size: 1.2 + Math.random()*2.6
    });
  }
  fireworks.push(...particles);
}

function tickFireworks() {
  fxCtx.clearRect(0,0,window.innerWidth, window.innerHeight);

  fireworks = fireworks.filter(p => p.life > 0);
  for (const p of fireworks) {
    p.life -= 1;
    p.vx *= 0.985;
    p.vy *= 0.985;
    p.vy += 0.03;
    p.x += p.vx * 4;
    p.y += p.vy * 4;

    const alpha = Math.min(1, p.life / 46);
    fxCtx.beginPath();
    fxCtx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    fxCtx.fillStyle = p.color.replace(")", `, ${alpha})`).replace("hsl", "hsla");
    fxCtx.fill();
  }

  requestAnimationFrame(tickFireworks);
}
tickFireworks();

async function celebrationSequence() {
  // ✅ visuals + emojis + REAL firework sounds (~3.2 sec)
  burstEmojis();
  burstEmojis();

  const burstTimes = [0.00, 0.22, 0.45, 0.70, 0.95, 1.20, 1.45, 1.70, 1.95, 2.20, 2.45, 2.70];
  burstTimes.forEach((t, idx) => {
    setTimeout(() => {
      playFireworkBurst(0);   // sound now
      launchFirework();       // visual now
      if (idx % 3 === 0) launchFirework();
    }, Math.floor(t * 1000));
  });

  for (let k = 0; k < 8; k++) {
    setTimeout(() => launchFirework(), 150 + k * 180);
  }

  await new Promise(r => setTimeout(r, 3200));
}

// --------------- Typewriter ---------------
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function typeText(el, cursorEl, text) {
  typingAbort.abort = true;
  await sleep(10);
  typingAbort = { abort: false };

  el.textContent = "";
  cursorEl.style.display = "block";

  await sleep(TYPE_DELAY);
  if (typingAbort.abort) return;

  for (let k = 0; k <= text.length; k++) {
    if (typingAbort.abort) return;
    el.textContent = text.slice(0, k);
    await sleep(TYPE_SPEED);
  }

  await sleep(300);
  if (!typingAbort.abort) cursorEl.style.display = "none";
}

// --------------- Slides ---------------
function setProgress() {
  countText.textContent = `${i + 1} / ${SLIDES.length}`;
  const pct = Math.round((i / Math.max(1, SLIDES.length - 1)) * 100);
  barFill.style.width = `${pct}%`;
}

function applyMotion(slideEl, motionClass) {
  slideEl.classList.remove(...MOTIONS);
  slideEl.classList.add(motionClass);
}

function renderSlide(index) {
  ending.classList.add("hidden");
  setProgress();

  const slide = SLIDES[index];
  const active = usingA ? slideA : slideB;
  const next = usingA ? slideB : slideA;

  const nextImg = usingA ? imgB : imgA;
  const nextTitle = usingA ? titleB : titleA;
  const nextQuote = usingA ? quoteB : quoteA;
  const nextCursor = usingA ? cursorB : cursorA;

  nextImg.src = `photos/${slide.file}`;
  nextTitle.textContent = slide.title;

  const motion = MOTIONS[index % MOTIONS.length];
  applyMotion(next, motion);

  next.classList.remove("active");
  void next.offsetWidth;
  next.classList.add("active");
  active.classList.remove("active");
  usingA = !usingA;

  typeText(nextQuote, nextCursor, slide.quote);

  if (index % 2 === 0) spawnFloatEmoji(true);
}

function showEnding() {
  ending.classList.remove("hidden");
  burstEmojis();
  for (let k=0;k<6;k++) setTimeout(() => launchFirework(), k*250);
}

// --------------- Playback ---------------
function startTimer() {
  stopTimer();
  timer = setInterval(() => {
    if (!playing) return;
    if (i >= SLIDES.length - 1) {
      stopTimer();
      hudText.textContent = "Finished ❤️";
      showEnding();
      return;
    }
    i++;
    renderSlide(i);
  }, SLIDE_MS);
}

function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}

function setPlaying(val) {
  playing = val;
  pauseBtn.textContent = playing ? "Pause" : "Play";
  hudText.textContent = playing ? "Playing…" : "Paused";
  if (playing) startTimer();
  else stopTimer();
}

// --------------- Candle hold logic ---------------
function updateHold() {
  if (!holding) return;
  const now = performance.now();
  const elapsed = now - holdStart;
  const pct = Math.min(100, (elapsed / HOLD_TOTAL_MS) * 100);

  holdFill.style.width = `${pct}%`;

  // flame shrinks as you “blow”
  flame.classList.add("dim");
  const scale = Math.max(0.18, 1.15 - (pct/100) * 0.97);
  flame.style.transform = `scale(${scale})`;

  if (pct >= 100 && !candleDone) {
    candleDone = true;
    endHold(true);
    onCandleBlown();
    return;
  }

  holdRaf = requestAnimationFrame(updateHold);
}

function startHold() {
  if (candleDone) return;

  // ensure SFX context is allowed (user gesture)
  try { getSfxCtx(); } catch {}

  holding = true;
  holdStart = performance.now();
  blowText.textContent = "Keep blowing… ❤️";
  if (holdRaf) cancelAnimationFrame(holdRaf);
  holdRaf = requestAnimationFrame(updateHold);
}

function endHold(completed = false) {
  holding = false;
  if (holdRaf) cancelAnimationFrame(holdRaf);
  holdRaf = null;

  if (!completed && !candleDone) {
    holdFill.style.width = "0%";
    blowText.textContent = "Blow the candle ❤️ (hold for 5 seconds)";
    flame.classList.remove("dim");
    flame.style.transform = "scale(1)";
  }
}

async function onCandleBlown() {
  flame.classList.add("out");
  blowText.textContent = "Yay! ❤️";

  // dims the card so fireworks are super visible (CSS .startOverlay.celebrate .startCard)
  startOverlay.classList.add("celebrate");

  await sleep(250);

  await celebrationSequence();

  startOverlay.style.display = "none";

  startFloatLoop();

  await startMusic();

  hudText.textContent = "Playing…";
  i = 0;
  renderSlide(i);
  setPlaying(true);
}

// bind hold button (mouse + touch)
function wireHold(btn) {
  btn.addEventListener("mousedown", startHold);
  btn.addEventListener("mouseup", () => endHold(false));
  btn.addEventListener("mouseleave", () => endHold(false));
  btn.addEventListener("touchstart", (e) => { e.preventDefault(); startHold(); }, { passive:false });
  btn.addEventListener("touchend", () => endHold(false));
  btn.addEventListener("touchcancel", () => endHold(false));
}
wireHold(blowBtn);

// --------------- Controls ---------------
prevBtn.addEventListener("click", () => {
  if (!playing) return;
  i = Math.max(0, i - 1);
  renderSlide(i);
  startTimer();
});

nextBtn.addEventListener("click", () => {
  if (!playing) return;
  if (i >= SLIDES.length - 1) {
    showEnding();
    return;
  }
  i++;
  renderSlide(i);
  startTimer();
});

pauseBtn.addEventListener("click", () => {
  if (!playing) return;
  setPlaying(!playing);
});

muteBtn.addEventListener("click", async () => {
  muted = !muted;
  muteBtn.textContent = muted ? "Unmute" : "Mute";
  if (muted) stopMusic();
  else await startMusic();
});

replayBtn.addEventListener("click", () => {
  i = 0;
  renderSlide(i);
  setPlaying(true);
  startTimer();
});

// Preload first image (won’t show until movie starts)
imgA.src = `photos/${SLIDES[0].file}`;
titleA.textContent = "";
quoteA.textContent = "";
cursorA.style.display = "none";
setProgress();
blowText.textContent = "Blow the candle ❤️ (hold for 5 seconds)";
