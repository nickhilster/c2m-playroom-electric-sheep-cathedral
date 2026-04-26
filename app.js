const canvas = document.getElementById("cathedralCanvas");
const ctx = canvas.getContext("2d", { alpha: false });

const phaseLabel = document.getElementById("phaseLabel");
const seedLabel = document.getElementById("seedLabel");

const micToggle = document.getElementById("micToggle");
const contrastToggle = document.getElementById("contrastToggle");
const motionToggle = document.getElementById("motionToggle");
const captureButton = document.getElementById("captureButton");
const shareButton = document.getElementById("shareButton");

const params = new URLSearchParams(window.location.search);
const seedFromUrl = Number.parseInt(params.get("seed"), 10);
const seed = Number.isInteger(seedFromUrl) ? seedFromUrl : Math.floor(Math.random() * 1_000_000_000);

if (!Number.isInteger(seedFromUrl)) {
  params.set("seed", String(seed));
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
}

seedLabel.textContent = `Seed ${seed}`;

function mulberry32(a) {
  return function rng() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(seed);
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
  pointer: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5, active: false },
  pseudoBreath: 0,
  breath: 0,
  micEnabled: false,
  highContrast: false,
  reduceMotion: prefersReduced,
  startMs: performance.now(),
  coherence: 0,
};

let particles = [];
let rings = [];
let mic = null;

function resize() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(state.width * state.pixelRatio);
  canvas.height = Math.floor(state.height * state.pixelRatio);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.pixelRatio, 0, 0, state.pixelRatio, 0, 0);
}

function resetParticles() {
  const mobile = state.width < 800;
  const count = mobile ? 260 : 460;
  particles = [];

  for (let i = 0; i < count; i += 1) {
    const band = i % 3;
    const angle = random() * Math.PI * 2;
    const radius = Math.pow(random(), 0.6) * Math.min(state.width, state.height) * 0.38;
    const orbit = 0.0015 + random() * 0.0026;

    particles.push({
      x: state.width * 0.5 + Math.cos(angle) * radius,
      y: state.height * 0.5 + Math.sin(angle) * radius * (0.75 + band * 0.12),
      vx: (random() - 0.5) * 0.4,
      vy: (random() - 0.5) * 0.4,
      size: 1.3 + random() * 2.2,
      hueBase: [198, 42, 28][band],
      sat: 72 - band * 10,
      light: 58 + band * 8,
      orbit,
      ring: band,
      drift: random() * Math.PI * 2,
    });
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function hsl(h, s, l, a) {
  return `hsla(${h} ${s}% ${l}% / ${a})`;
}

function updatePhase(now) {
  const elapsed = (now - state.startMs) / 1000;
  if (elapsed < 10) {
    phaseLabel.textContent = "Onboarding by Spectacle";
  } else if (elapsed < 45) {
    phaseLabel.textContent = "Attraction + Repulsion Discovery";
  } else if (elapsed < 75) {
    phaseLabel.textContent = "Breath Coupling Pulse";
  } else {
    phaseLabel.textContent = "Poster Capture Window";
  }
}

function updateBreath(dt) {
  const target = clamp(state.pseudoBreath + (mic?.level || 0), 0, 1);
  state.breath = lerp(state.breath, target, 1 - Math.exp(-dt * 4.6));
}

function addRing(x, y, intensity) {
  rings.push({
    x,
    y,
    radius: 8,
    alpha: clamp(intensity * 0.5 + 0.1, 0.1, 0.72),
    life: 1.0,
  });
}

function updateParticles(dt, now) {
  const centerX = state.width * 0.5;
  const centerY = state.height * 0.5;
  const attractionBase = state.reduceMotion ? 0.006 : 0.01;
  const pointerStrength = state.pointer.active ? 0.08 : 0.028;
  const breathBoost = 1 + state.breath * 1.9;

  let speedAccumulator = 0;

  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i];
    const t = now * p.orbit + p.drift;

    const driftX = Math.cos(t * 2.1 + p.ring) * 0.1;
    const driftY = Math.sin(t * 2.4 + p.ring * 1.3) * 0.1;

    const toCenterX = centerX - p.x;
    const toCenterY = centerY - p.y;

    p.vx += toCenterX * attractionBase * dt;
    p.vy += toCenterY * attractionBase * dt;

    const pointerDx = state.pointer.x - p.x;
    const pointerDy = state.pointer.y - p.y;
    const pointerDistSq = pointerDx * pointerDx + pointerDy * pointerDy + 0.0001;

    p.vx += (pointerDx / pointerDistSq) * pointerStrength * 110 * dt;
    p.vy += (pointerDy / pointerDistSq) * pointerStrength * 110 * dt;

    p.vx += driftX * breathBoost * dt;
    p.vy += driftY * breathBoost * dt;

    const damp = state.reduceMotion ? 0.955 : 0.968;
    p.vx *= damp;
    p.vy *= damp;

    p.x += p.vx * 60 * dt;
    p.y += p.vy * 60 * dt;

    if (p.x < -80) p.x = state.width + 80;
    if (p.x > state.width + 80) p.x = -80;
    if (p.y < -80) p.y = state.height + 80;
    if (p.y > state.height + 80) p.y = -80;

    speedAccumulator += Math.hypot(p.vx, p.vy);
  }

  const avgSpeed = speedAccumulator / particles.length;
  state.coherence = clamp(1 - avgSpeed * 1.3, 0, 1);

  if (state.coherence > 0.75 && Math.random() < 0.04) {
    const x = lerp(state.width * 0.35, state.width * 0.65, random());
    const y = lerp(state.height * 0.25, state.height * 0.75, random());
    addRing(x, y, state.coherence);
  }
}

function updateRings(dt) {
  for (let i = rings.length - 1; i >= 0; i -= 1) {
    const r = rings[i];
    r.radius += 42 * dt;
    r.life -= dt * 0.7;
    r.alpha *= 0.985;

    if (r.life <= 0.02) {
      rings.splice(i, 1);
    }
  }
}

function drawBackground() {
  const warmth = state.breath;
  const grad = ctx.createLinearGradient(0, 0, 0, state.height);

  const top = state.highContrast
    ? hsl(223, 74, lerp(10, 19, warmth), 1)
    : hsl(230, 62, lerp(7, 17, warmth), 1);
  const mid = state.highContrast
    ? hsl(248, 62, lerp(14, 28, warmth), 1)
    : hsl(244, 54, lerp(13, 31, warmth), 1);
  const bottom = state.highContrast
    ? hsl(29, 92, lerp(14, 34, warmth), 1)
    : hsl(34, 83, lerp(12, 29, warmth), 1);

  grad.addColorStop(0, top);
  grad.addColorStop(0.55, mid);
  grad.addColorStop(1, bottom);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, state.width, state.height);

  const bloom = ctx.createRadialGradient(
    state.pointer.x,
    state.pointer.y,
    0,
    state.pointer.x,
    state.pointer.y,
    Math.max(state.width, state.height) * 0.5
  );

  const bloomAlpha = state.highContrast ? 0.14 : 0.2;
  bloom.addColorStop(0, hsl(46 + warmth * 18, 92, 72, bloomAlpha));
  bloom.addColorStop(1, hsl(230, 74, 4, 0));

  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, state.width, state.height);
}

function drawMandalaLines(now) {
  const lines = state.reduceMotion ? 14 : 24;
  const pulse = 1 + state.breath * 0.12;
  const cx = state.width * 0.5;
  const cy = state.height * 0.5;
  const radius = Math.min(state.width, state.height) * 0.36 * pulse;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(now * 0.000035 * (state.reduceMotion ? 1 : 1.7));
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < lines; i += 1) {
    const angle = (Math.PI * 2 * i) / lines;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    ctx.strokeStyle = hsl(188 + i * 2 + state.breath * 24, 68, 66, state.highContrast ? 0.18 : 0.1);
    ctx.lineWidth = state.highContrast ? 1.3 : 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

function drawParticles() {
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i];
    const warmth = state.breath;
    const hue = p.hueBase + warmth * 26;
    const sat = p.sat + warmth * 12;
    const light = p.light + warmth * 10;
    const alpha = state.highContrast ? 0.9 : 0.68;

    ctx.fillStyle = hsl(hue, sat, light, alpha);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size + warmth * 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = "source-over";
}

function drawRings() {
  for (let i = 0; i < rings.length; i += 1) {
    const r = rings[i];
    ctx.strokeStyle = hsl(46 + state.breath * 26, 90, 75, r.alpha);
    ctx.lineWidth = state.highContrast ? 2.2 : 1.4;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function frame(now) {
  const last = frame.lastNow || now;
  const dt = clamp((now - last) / 1000, 0.001, 0.05);
  frame.lastNow = now;

  updatePhase(now);
  updateBreath(dt);
  updateParticles(dt, now);
  updateRings(dt);

  drawBackground();
  drawMandalaLines(now);
  drawParticles();
  drawRings();

  requestAnimationFrame(frame);
}

window.addEventListener("resize", () => {
  resize();
  resetParticles();
});

window.addEventListener("pointermove", (event) => {
  state.pointer.x = event.clientX;
  state.pointer.y = event.clientY;
  state.pointer.active = true;
});

window.addEventListener("pointerdown", (event) => {
  state.pointer.x = event.clientX;
  state.pointer.y = event.clientY;
  state.pointer.active = true;
  state.pseudoBreath = 1;
});

window.addEventListener("pointerup", () => {
  state.pseudoBreath = 0;
});

window.addEventListener("pointercancel", () => {
  state.pseudoBreath = 0;
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    state.pseudoBreath = 1;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "Space") {
    state.pseudoBreath = 0;
  }
});

captureButton.addEventListener("click", () => {
  const data = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = data;
  a.download = `electric-sheep-cathedral-seed-${seed}.png`;
  a.click();
});

shareButton.addEventListener("click", async () => {
  const url = `${window.location.origin}${window.location.pathname}?seed=${seed}`;

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    shareButton.textContent = "Seed Link Copied";
    setTimeout(() => {
      shareButton.textContent = "Copy Seed Link";
    }, 1400);
    return;
  }

  window.prompt("Copy this seed URL", url);
});

contrastToggle.addEventListener("click", () => {
  state.highContrast = !state.highContrast;
  document.body.classList.toggle("high-contrast", state.highContrast);
  contrastToggle.textContent = `High Contrast: ${state.highContrast ? "On" : "Off"}`;
});

motionToggle.addEventListener("click", () => {
  state.reduceMotion = !state.reduceMotion;
  motionToggle.textContent = `Reduce Motion: ${state.reduceMotion ? "On" : "Off"}`;
});

async function enableMicrophone() {
  if (state.micEnabled) {
    return;
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.82;
  source.connect(analyser);

  const data = new Uint8Array(analyser.frequencyBinCount);

  mic = {
    stream,
    analyser,
    data,
    level: 0,
    interval: setInterval(() => {
      analyser.getByteTimeDomainData(data);

      let sum = 0;
      for (let i = 0; i < data.length; i += 1) {
        const centered = (data[i] - 128) / 128;
        sum += centered * centered;
      }

      const rms = Math.sqrt(sum / data.length);
      mic.level = clamp((rms - 0.02) * 8, 0, 1);
    }, 60),
  };

  state.micEnabled = true;
  micToggle.textContent = "Breath Mic Enabled";
}

micToggle.addEventListener("click", async () => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      micToggle.textContent = "Mic Not Supported";
      return;
    }

    await enableMicrophone();
  } catch {
    micToggle.textContent = "Mic Permission Denied";
  }
});

resize();
resetParticles();
motionToggle.textContent = `Reduce Motion: ${state.reduceMotion ? "On" : "Off"}`;
requestAnimationFrame(frame);
