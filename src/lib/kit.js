// Kit de piezas procedurales reutilizables para los platós modernos.
import * as THREE from 'three';
import { mat, glow, text3D, letterTexture, figure, ROSCO_LETRAS } from './helpers.js';
export { mat, glow, text3D, figure, ROSCO_LETRAS };

/** Textura de canvas animable: draw(g, w, h, t) */
export function canvasTex(w, h, draw, { repeatX = 1 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  if (repeatX !== 1) { tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = repeatX; }
  const api = { tex, canvas: c, update(t) { draw(g, w, h, t); tex.needsUpdate = true; } };
  api.update(0);
  return api;
}

/** Banda LED curva (cilindro abierto mirando hacia el centro) */
export function ledBand({ radius = 14, height = 1.6, y = 8, start = Math.PI * 0.6, len = Math.PI * 0.8, tex, emissive = 1.1 }) {
  const geo = new THREE.CylinderGeometry(radius, radius, height, 128, 1, true, start, len);
  // visto desde dentro (BackSide) el texto saldría en espejo: se invierte la U
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
  const m = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, toneMapped: false });
  m.color.setScalar(emissive);
  const mesh = new THREE.Mesh(geo, m); mesh.position.y = y;
  const frame = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.05, radius + 0.05, height + 0.2, 128, 1, true, start, len), mat(0x111622, { side: THREE.DoubleSide, metalness: 0.6 }));
  frame.position.y = y; const g = new THREE.Group(); g.add(frame, mesh); return g;
}

/** Dibujo típico de banda: texto repetido + bote */
export function drawBand(texto, { bg1 = '#0c3fd8', bg2 = '#1b6dff', color = '#ffffff', font = '700 64px Arial', bote = null, every = 3, n: nCeldas = 6 } = {}) {
  return (g, w, h, t) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, bg1); gr.addColorStop(1, bg2);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2;
    for (let x = 0; x < w; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.fillStyle = color; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = nCeldas;
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * w / n;
      const s = (bote && i % every === 1) ? bote : texto;
      g.shadowColor = 'rgba(255,255,255,0.8)'; g.shadowBlur = 12; g.fillText(s, x, h / 2 + 4); g.shadowBlur = 0;
    }
  };
}

/** Círculos concéntricos animados (pantallas) */
export function drawConcentric({ c1 = '#0a2fae', c2 = '#40a8ff', ring = 'rgba(160,220,255,0.55)', letras = true, texto = null, txtColor = '#fff', font = '700 90px Arial' } = {}) {
  return (g, w, h, t) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.7);
    gr.addColorStop(0, c2); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.lineWidth = 10;
    for (let i = 0; i < 14; i++) {
      const r = ((i * 45 + t * 40) % 640);
      g.strokeStyle = ring.replace(/[\d.]+\)$/, `${0.6 * (1 - r / 640)})`);
      g.beginPath(); g.arc(w / 2, h / 2, r, 0, Math.PI * 2); g.stroke();
    }
    if (letras) {
      g.font = '700 40px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let i = 0; i < 16; i++) {
        const a = i * 0.9 + t * 0.15, r = 160 + (i * 37) % 260;
        g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillText(ROSCO_LETRAS[(i * 7) % 25], w / 2 + Math.cos(a) * r * 1.4, h / 2 + Math.sin(a) * r * 0.8);
      }
    }
    if (texto) { g.font = font; g.fillStyle = txtColor; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#000'; g.shadowBlur = 20; g.fillText(texto, w / 2, h / 2); g.shadowBlur = 0; }
  };
}

export function screen(w, h, ctex, { frame = 0x10141f } = {}) {
  const g = new THREE.Group();
  const f = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, h + 0.3, 0.25), mat(frame, { metalness: 0.6, roughness: 0.35 }));
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: ctex.tex, toneMapped: false }));
  s.position.z = 0.13; g.add(f, s); return g;
}

/** Suelo con letras gigantes (contorno o relleno) dibujadas en canvas */
export function floorLetters({ size = 60, bg = '#0a2a8a', letter = '#3ff0e0', glowColor = null, outline = true, count = 26, seed = 7, lw = 10, roughness = 0.12, metalness = 0.5, emissiveIntensity = 0.9 }) {
  const c = document.createElement('canvas'); c.width = c.height = 2048; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 2048, 2048);
  let s = seed; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  g.font = '700 260px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = lw;
  for (let i = 0; i < count; i++) {
    g.save(); g.translate(rnd() * 2048, rnd() * 2048); g.rotate(rnd() * 6.28);
    if (glowColor) { g.shadowColor = glowColor; g.shadowBlur = 30; }
    const ch = ROSCO_LETRAS[Math.floor(rnd() * 25)];
    if (outline) { g.strokeStyle = letter; g.strokeText(ch, 0, 0); } else { g.fillStyle = letter; g.fillText(ch, 0, 0); }
    g.restore();
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: emissiveIntensity * 0.35, roughness, metalness });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(size / 2, 96), m); mesh.rotation.x = -Math.PI / 2; mesh.receiveShadow = true;
  return mesh;
}

/** Plataforma circular con borde de luz */
export function platform(r, h = 0.3, { top = 0xeef2ff, edge = 0x4fa8ff, edgeI = 2 } = {}) {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 96), [mat(0xdfe6f5, { roughness: 0.3 }), mat(top, { roughness: 0.2, metalness: 0.2 }), mat(top)]);
  p.position.y = h / 2; p.receiveShadow = true; g.add(p);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.01, 0.03, 6, 128), glow(edge, edgeI)); ring.rotation.x = Math.PI / 2; ring.position.y = h * 0.5; g.add(ring);
  return g;
}

/** Grada recta con público instanciado; rotY 0 = público mirando hacia -Z */
export function grada({ rows = 6, cols = 18, width = 16, seat = 0x2a5cff, step = 0x1a2340, rail = null, railTex = null, colorsPublico } = {}) {
  const g = new THREE.Group();
  for (let r = 0; r < rows; r++) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(width, 0.45 * (r + 1), 1.0), mat(step, { roughness: 0.5 }));
    st.position.set(0, 0.225 * (r + 1), r * 1.0); g.add(st);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(width, 0.03, 0.03), glow(0x9fd0ff, 1.2)); lip.position.set(0, 0.45 * (r + 1), r - 0.5); g.add(lip);
  }
  const n = rows * cols;
  const seats = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.5, 0.12), mat(seat, { roughness: 0.4 }), n);
  const bodies = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.2, 0.35, 3, 8), mat(0xffffff, { roughness: 0.8 }), n);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 10, 8), mat(0xffffff, { roughness: 0.9 }), n);
  const pal = colorsPublico || [0xd23b3b, 0x2f5fd0, 0xf0f0f0, 0x222228, 0xe8a020, 0x2aa060, 0x8a3ab0, 0x5a5a6a, 0xe86aa0, 0x3ac0d0];
  const hair = [0x1a1008, 0x3a2412, 0x6a4020, 0xb8b0a0, 0xd0a050, 0xe0b48a, 0x9a6a46];
  const m = new THREE.Matrix4(), col = new THREE.Color(); let k = 0;
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) {
    const x = -width / 2 + (i + 0.5) * width / cols, y = 0.45 * (r + 1), z = r;
    m.makeTranslation(x, y + 0.3, z + 0.35); seats.setMatrixAt(k, m);
    const ocupado = Math.random() < 0.85;
    m.makeTranslation(x, y + 0.45, z + 0.1); if (!ocupado) m.scale(new THREE.Vector3(0, 0, 0)); bodies.setMatrixAt(k, m);
    bodies.setColorAt(k, col.setHex(pal[(Math.random() * pal.length) | 0]));
    m.makeTranslation(x, y + 0.95, z + 0.1); if (!ocupado) m.scale(new THREE.Vector3(0, 0, 0)); heads.setMatrixAt(k, m);
    heads.setColorAt(k, col.setHex(hair[(Math.random() * hair.length) | 0]));
    k++;
  }
  g.add(seats, bodies, heads);
  if (rail) {
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(width, 1.1), new THREE.MeshStandardMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.2, side: THREE.DoubleSide, map: railTex || null, emissive: railTex ? 0xffffff : 0x000000, emissiveMap: railTex || null, emissiveIntensity: 1.2 }));
    glass.position.set(0, 0.55, -0.9); glass.rotation.y = Math.PI; g.add(glass);
    const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, 0.06), glow(rail, 1.6)); top.position.set(0, 1.1, -0.9); g.add(top);
  }
  return g;
}

/** Textura de neón para barandillas: texto en contorno */
export function neonTextTexture(texto, { color = '#ffffff', glowC = '#9fd8ff', w = 2048, h = 256, font = '700 170px Arial', reps = 2 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.clearRect(0, 0, w, h); g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 6; g.strokeStyle = color; g.shadowColor = glowC; g.shadowBlur = 25;
  for (let i = 0; i < reps; i++) g.strokeText(texto, (i + 0.5) * w / reps, h / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Cabezas móviles en el techo */
export function movingHeads(updaters, positions, colors = [0xffffff, 0x7fc8ff, 0xb070ff]) {
  const g = new THREE.Group();
  const bodyM = mat(0x15161a, { metalness: 0.6, roughness: 0.4 });
  positions.forEach(([x, y, z], i) => {
    const head = new THREE.Group(); head.position.set(x, y, z); g.add(head);
    const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.3), bodyM); yoke.position.y = 0.25; head.add(yoke);
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.5, 12), bodyM); head.add(can);
    const c = colors[i % colors.length];
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), glow(c, 3)); lens.rotation.x = Math.PI / 2; lens.position.y = -0.26; head.add(lens);
    const coneH = y - 0.3;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.1, coneH, 20, 1, true), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.02, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    cone.position.y = -coneH / 2 - 0.26; head.add(cone);
    updaters.push(t => { head.rotation.z = Math.sin(t * 0.6 + i) * 0.4; head.rotation.x = Math.cos(t * 0.5 + i * 1.3) * 0.3; });
  });
  return g;
}

/** Escalera iluminada */
export function stairs({ steps = 8, width = 2.2, rise = 0.3, run = 0.45, color = 0x1a2240, light = 0xffffff }) {
  const g = new THREE.Group();
  for (let i = 0; i < steps; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(width, rise * (i + 1), run), mat(color, { roughness: 0.4 }));
    s.position.set(0, rise * (i + 1) / 2, -i * run); g.add(s);
    const l = new THREE.Mesh(new THREE.BoxGeometry(width * 0.95, 0.03, 0.03), glow(light, 1.8)); l.position.set(0, rise * (i + 1) - 0.03, -i * run + run / 2 + 0.01); g.add(l);
  }
  return g;
}

/** Rosco de 25 letras (disco plano mirando +Z) con API de iluminación */
export function rosco({ radius = 1, bulb = 0.09, base = 0x1450e6, letterColor = 0x0a1650, bulbColor = 0xffffff, disc = true, letras = ROSCO_LETRAS } = {}) {
  const g = new THREE.Group();
  if (disc) {
    const d = new THREE.Mesh(new THREE.CircleGeometry(radius * 1.22, 64), mat(base, { emissive: base, emissiveIntensity: 0.35 }));
    d.position.z = -0.01; g.add(d);
  }
  const bulbs = letras.map((ch, i) => {
    const a = Math.PI / 2 - (i / letras.length) * Math.PI * 2;
    const bm = glow(bulbColor, 0.7);
    const b = new THREE.Mesh(new THREE.CircleGeometry(bulb, 20), bm);
    b.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.005);
    const lp = new THREE.Mesh(new THREE.PlaneGeometry(bulb * 1.7, bulb * 1.7), new THREE.MeshBasicMaterial({ map: letterTexture(ch), transparent: true, color: letterColor, depthWrite: false }));
    lp.position.z = 0.003; b.add(lp); g.add(b);
    return { mat: bm, letter: ch, state: 'idle' };
  });
  const COL = { idle: [bulbColor, 0.7], cur: [0xffd400, 1.8], ok: [0x19e05a, 1.4], ko: [0xff2020, 1.4], pasa: [0x2a8bff, 1.0] };
  g.userData.bulbs = bulbs;
  g.userData.paint = (t, chase = true) => bulbs.forEach((b, i) => {
    if (b.state === 'idle' && chase) {
      const ph = (t * 6) % bulbs.length; const d = Math.min(Math.abs(i - ph), bulbs.length - Math.abs(i - ph));
      b.mat.emissive.setHex(bulbColor); b.mat.emissiveIntensity = 0.5 + Math.max(0, 1.3 - d * 0.5); return;
    }
    const [c, k] = COL[b.state]; b.mat.emissive.setHex(c); b.mat.emissiveIntensity = b.state === 'cur' ? k * (0.6 + 0.4 * Math.sin(t * 12)) : k;
  });
  return g;
}

/** Simulador de rosco compartido (dos roscos) */
export function roscoSim(rA, rB, ctx) {
  const sim = {
    playing: false, idx: 0, nextAt: 0,
    reset() { [rA, rB].forEach(r => r.userData.bulbs.forEach(b => b.state = 'idle')); this.idx = 0; },
    toggle() { this.playing = !this.playing; if (this.playing) this.reset(); return this.playing; },
    update(t) {
      if (this.playing && t > this.nextAt) {
        this.nextAt = t + 0.6; const r = Math.random();
        [[rA, 0], [rB, 7]].forEach(([ro, off], k) => {
          const b = ro.userData.bulbs[(this.idx + off) % 25];
          if (b.state === 'idle' || b.state === 'cur') { b.state = r < 0.6 ? 'ok' : r < 0.8 ? 'ko' : 'pasa'; if (k === 0 && ctx.onRosco) ctx.onRosco(b.state); }
        });
        this.idx++; if (this.idx > 25) this.reset();
        [[rA, 0], [rB, 7]].forEach(([ro, off]) => { const b = ro.userData.bulbs[(this.idx + off) % 25]; if (b.state === 'idle') b.state = 'cur'; });
      }
      rA.userData.paint(t, !this.playing); rB.userData.paint(t + 2, !this.playing);
    },
  };
  return sim;
}

/** Silla alta (transparente u opaca) */
export function highChair({ color = 0xbfe6ff, transparent = true } = {}) {
  const c = new THREE.Group();
  const seatM = transparent ? new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity: 0.35, roughness: 0.05, transmission: 0.0, side: THREE.DoubleSide }) : mat(color, { roughness: 0.5 });
  const metal = mat(0xc0c4cc, { metalness: 0.9, roughness: 0.25 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.04, 24), metal); base.position.y = 0.02; c.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.74, 8), metal); pole.position.y = 0.38; c.add(pole);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 6, 24), metal); ring.rotation.x = Math.PI / 2; ring.position.y = 0.33; c.add(ring);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.44), seatM); seat.position.y = 0.78; c.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.5, 0.04), seatM); back.position.set(0, 1.05, -0.22); c.add(back);
  return c;
}

/** Atril cilíndrico (Rueda la letra) */
export function atrilCilindro({ color = 0x2a6bff, h = 1.15, r = 0.28 } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32), mat(0x0a0a12, { metalness: 0.7, roughness: 0.15 }));
  body.position.y = h / 2; g.add(body);
  const disk = new THREE.Mesh(new THREE.CircleGeometry(r * 0.6, 32), glow(color, 2.2)); disk.position.set(0, h * 0.62, r + 0.003); g.add(disk);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.06, r + 0.06, 0.04, 32), mat(0x202028, { metalness: 0.8 })); top.position.y = h + 0.02; g.add(top);
  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(r + 0.05, 0.025, 6, 32), glow(color, 2)); baseRing.rotation.x = Math.PI / 2; baseRing.position.y = 0.03; g.add(baseRing);
  return g;
}

/** Puerta/portal de salida hacia los Estudios (clicable). style: 'portal' | 'puerta' */
export function salida({ label = 'SALIDA · ESTUDIOS GROK BOT', style = 'puerta', color = 0x4fa8ff } = {}) {
  const g = new THREE.Group(); g.userData.salida = true; g.name = 'salida';
  if (style === 'portal') {
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(2.2 + i * 0.28, 0.06, 10, 96), glow(i === 1 ? 0x6fc0ff : 0xffffff, 2.2));
      r.position.y = 2.4; g.add(r);
    }
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.42, 3.6, 0.1), mat(0x0a0f22, { emissive: 0x0a0f22 }));
      p.position.set(-1.25 + i * 0.5, 2.0, -0.6); g.add(p);
      for (let k = 0; k < 10; k++) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.035, 8), glow(0xffffff, 2)); d.position.set(-1.25 + i * 0.5 + (k % 2 ? 0.08 : -0.08), 0.6 + k * 0.32, -0.54); g.add(d); }
    }
  } else {
    const fr = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.25), mat(0xd8dde8, { metalness: 0.5 })); fr.position.y = 1.6; g.add(fr);
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.9, 0.28), mat(0x1a2a5a, { emissive: color, emissiveIntensity: 0.15 })); door.position.y = 1.45; g.add(door);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.06, 0.3), glow(color, 2)); edge.position.y = 3.22; g.add(edge);
  }
  const sign = textoPlano(label, { w: 4.2, h: 0.5, color: '#ffffff', bg: 'rgba(0,10,40,0.85)', font: '700 46px Arial' });
  sign.position.set(0, style === 'portal' ? 5.2 : 3.6, 0.2); g.add(sign);
  g.traverse(o => { o.userData.salida = true; });
  return g;
}

/** Cartel plano con texto en canvas */
export function textoPlano(texto, { w = 4, h = 1, color = '#fff', bg = null, font = '700 80px Arial', emissive = true } = {}) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / w); const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); }
  g.fillStyle = color; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = parseInt(font.match(/(\d+)px/)[1]);
  while (g.measureText(texto).width > c.width * 0.92 && size > 10) { size -= 4; g.font = font.replace(/\d+px/, size + 'px'); }
  g.fillText(texto, c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !bg, toneMapped: !emissive, side: THREE.DoubleSide }));
}

/** Base común de luces de un plató moderno */
export function luces(root, { hemi = [0x9fc8ff, 0x101830, 0.7], key = 120, puntos = [] } = {}) {
  root.add(new THREE.HemisphereLight(...hemi));
  const k = new THREE.SpotLight(0xffffff, key, 45, Math.PI / 6, 0.5, 1.4);
  k.position.set(0, 15, 10); k.target.position.set(0, 0, -2); k.castShadow = true; k.shadow.mapSize.set(1024, 1024); k.shadow.bias = -0.0005;
  root.add(k, k.target);
  for (const [c, i, x, y, z, d = 20] of puntos) { const l = new THREE.PointLight(c, i, d, 1.6); l.position.set(x, y, z); root.add(l); }
}

/** Mesa circular de cristal con borde LED y rosco central (2020-2026) */
export function mesaCristal({ r = 3.2, led = 0x2a7bff, centro = null } = {}) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.06, 96), new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.1 }));
  top.position.y = 1.08; g.add(top);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.02, r + 0.02, 0.32, 96, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, toneMapped: false }));
  band.position.y = 0.92; g.add(band); g.userData.band = band;
  const ringT = new THREE.Mesh(new THREE.TorusGeometry(r + 0.02, 0.025, 6, 128), glow(led, 2.5)); ringT.rotation.x = Math.PI / 2; ringT.position.y = 1.1; g.add(ringT);
  const ringB = ringT.clone(); ringB.position.y = 0.76; g.add(ringB);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.55, 0.76, 48), mat(0xe8ecf4, { roughness: 0.3 })); ped.position.y = 0.38; g.add(ped);
  if (centro) { const c = new THREE.Mesh(new THREE.CircleGeometry(r * 0.42, 64), new THREE.MeshBasicMaterial({ map: centro, toneMapped: false })); c.rotation.x = -Math.PI / 2; c.position.y = 1.115; g.add(c); }
  return g;
}

/** Invitados y presentador sentados alrededor de una mesa (ángulos desde +Z) */
export function sentarAlrededor(g, angulos, r, estilos, { chair = { transparent: true }, center = [0, 0] } = {}) {
  angulos.forEach((a, i) => {
    const ch = highChair(chair); ch.position.set(center[0] + Math.sin(a) * r, 0, center[1] + Math.cos(a) * r);
    ch.rotation.y = a + Math.PI; g.add(ch);
    if (estilos[i]) { const f = figure({ ...estilos[i], seated: true, scale: 1.05 }); f.position.set(0, 0.8, 0.02); ch.add(f); }
  });
}
export const ESTILOS_INVITADOS = [
  { body: 0x2c3e8a, legs: 0x1e1e28, hair: 0x3a2412 }, { body: 0xd04a4a, legs: 0x22222a, hair: 0x111111 }, { body: 0xf2f2f2, legs: 0x334, hair: 0x6a4020 },
  { body: 0xff8a20, legs: 0x22222a, hair: 0x2a1a0e }, { body: 0x1c1c22, legs: 0x1c1c22, hair: 0xb8b8b8 }, { body: 0x2aa080, legs: 0x22222a, hair: 0xd0a050 },
];
