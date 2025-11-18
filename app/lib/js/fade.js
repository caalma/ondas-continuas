function fade(sources, target, paramKey = 'vol', duration = 1000, interpolation = t => t) {
  const startTime = performance.now();
  const initialValues = sources.map(s => {
    return typeof s.params[paramKey] === 'number' ? s.params[paramKey] : 0;
  });
  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    let progress = elapsed / duration;
    if (progress >= 1) progress = 1;
    const easedProgress = interpolation(progress);
    sources.forEach((s, i) => {
      const startValue = initialValues[i];
      s[paramKey](startValue + (target - startValue) * easedProgress);
    });
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  requestAnimationFrame(animate);
}

var EASING = {
  // ──────────────── Lineal ────────────────
  linear: t => t,

  // ──────────────── Polinómicas (potencias) ────────────────
  inQuad:   t => t * t,
  outQuad:  t => 1 - (1 - t) ** 2,
  inOutQuad: t => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2,

  inCubic:   t => t ** 3,
  outCubic:  t => 1 - (1 - t) ** 3,
  inOutCubic: t => t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2,

  inQuart:   t => t ** 4,
  outQuart:  t => 1 - (1 - t) ** 4,
  inOutQuart: t => t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2,

  inQuint:   t => t ** 5,
  outQuint:  t => 1 - (1 - t) ** 5,
  inOutQuint: t => t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2,

  // ──────────────── Trigonométricas (suaves) ────────────────
  inSine:    t => 1 - Math.cos((t * Math.PI) / 2),
  outSine:   t => Math.sin((t * Math.PI) / 2),
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2, // = 0.5 - 0.5 * Math.cos(πt)

  // ──────────────── Exponenciales ────────────────
  inExpo:  t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  outExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inOutExpo: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  // ──────────────── Elásticas (rebote con overshoot) ────────────────
  inElastic: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c4 = (2 * Math.PI) / 3;
    return -Math.pow(2, 10 * t - 10) * Math.sin((10 * t - 10.75) * c4);
  },
  outElastic: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((10 * t - 0.75) * c4) + 1;
  },
  inOutElastic: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c5 = (2 * Math.PI) / 4.5;
    return t < 0.5
      ? -Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5) / 2
      : Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5) / 2 + 1;
  },

  // ──────────────── Rebote (bounce) ────────────────
  outBounce: t => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t - 1.5 / d1) ** 2 + 0.75;
    if (t < 2.5 / d1) return n1 * (t - 2.25 / d1) ** 2 + 0.9375;
    return n1 * (t - 2.625 / d1) ** 2 + 0.984375;
  },
  inBounce: t => 1 - EASING.outBounce(1 - t),
  inOutBounce: t => t < 0.5
    ? (1 - EASING.outBounce(1 - 2 * t)) / 2
    : (1 + EASING.outBounce(2 * t - 1)) / 2,

  // ──────────────── Estilo "digital" o experimental ────────────────
  stepped8: t => Math.floor(t * 8) / 8,
  stepped16: t => Math.floor(t * 16) / 16,

  // Oscilación suave al final (para efectos de "asentamiento")
  wobble: t => (t < 1) ? t + 0.05 * Math.sin(20 * Math.PI * t) : 1,
};
