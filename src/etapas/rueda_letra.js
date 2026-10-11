// Plató 'Rueda la letra' (Telecinco, 2026-): pantallas LED con círculos concéntricos
// turquesa-morado, aros de luz azul y morado, atriles cilíndricos negros, suelo LED con
// espirales, grada con butacas azules, pared salmón con círculos y franjas LED, mesa de
// invitados de 6 atriles cilíndricos con encimera de cristal. Equipos morado y azul.
import * as THREE from 'three';
import * as K from '../lib/kit.js';
import { crearPlato, dibujaLogoUsuario } from './_base.js';

export const info = { id: 'rueda-letra', nombre: 'Rueda la letra', anios: 'Telecinco 2026-', disponible: true };
export const cameras = {
  general: { label: '🎥 Plano general', pos: [0, 7.5, 13.5], target: [0, 2.2, -5] },
  mesa: { label: '🪑 Mesa', pos: [0, 3, 6], target: [0, 1.4, 0], mode: 'pruebas' },
  atril: { label: '🔵🟣 Final La Rueda', pos: [0, 2.6, 0], target: [0, 2.4, -9], mode: 'rosco' },
  publico: { label: '👏 Público', pos: [0, 3, -3], target: [0, 3, 14] },
  salida: { label: '🚪 Salida', pos: [-8, 2.6, 2], target: [-15, 2.2, 2] },
};

// Logo (a): rosco de bolitas turquesa/rosa alrededor de 'RUEDA LA LETRA'
export function drawLogoRosco(g, cx, cy, R, t) {
  const L = K.ROSCO_LETRAS;
  for (let i = 0; i < 25; i++) {
    const a = -Math.PI / 2 + i / 25 * Math.PI * 2 + t * 0.2;
    const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
    const gr = g.createRadialGradient(x - 5, y - 5, 2, x, y, 22); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, i % 2 ? '#2ee8d0' : '#ff5fb0');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, 20, 0, 7); g.fill();
    g.fillStyle = '#1a1040'; g.font = '700 22px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(L[i], x, y + 1);
  }
  g.fillStyle = '#fff'; g.strokeStyle = '#2a1060'; g.lineWidth = 10; g.font = '900 78px Arial Black, Arial'; g.textAlign = 'center';
  for (const [txt, dy] of [['RUEDA', -55], ['LA', 10], ['LETRA', 75]]) { g.strokeText(txt, cx, cy + dy); g.fillText(txt, cx, cy + dy); }
}
// Logo (b): esfera de letras plateadas con 'Rueda la letra'
export function drawLogoEsfera(g, cx, cy, R, t) {
  for (let i = 0; i < 90; i++) {
    const lat = Math.acos(1 - 2 * (i + 0.5) / 90), lon = i * 2.39996 + t * 0.5;
    const x = Math.sin(lat) * Math.cos(lon), z = Math.sin(lat) * Math.sin(lon), y = Math.cos(lat);
    if (z < -0.05) continue;
    const v = Math.round(150 + 105 * z); g.fillStyle = `rgb(${v},${v},${v + 10})`;
    g.font = `700 ${Math.round(18 + 22 * z)}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(K.ROSCO_LETRAS[i % 25], cx + x * R, cy - y * R);
  }
  g.fillStyle = '#fff'; g.font = '700 84px Arial'; g.shadowColor = '#40106a'; g.shadowBlur = 20; g.fillText('Rueda la letra', cx, cy + 10); g.shadowBlur = 0;
}

// Fondo (c): espirales azul/morado, bolas 3D de letras rosas y turquesa y «LA LETRA» grande en relieve
export function drawFondoLaLetra(g, w, h, t) {
  const cx = w / 2, cy = h * 0.62; g.fillStyle = '#2a2adc'; g.fillRect(0, 0, w, h);
  for (let r = Math.hypot(w, h); r > 10; r -= 26) { const k = (r / 26 + Math.floor(t * 3)) % 4; g.strokeStyle = ['#3a5cff', '#8a3ae8', '#2aa0ff', '#c040e0'][k]; g.globalAlpha = 0.55; g.lineWidth = 12; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); }
  g.globalAlpha = 1;
  const bolas = [[0.06, 0.42, 'Q', 1], [0.15, 0.58, 'P', 0], [0.25, 0.7, 'O', 1], [0.8, 0.4, 'J', 1], [0.72, 0.56, 'K', 0], [0.88, 0.2, 'H', 0], [0.92, 0.04, 'G', 1], [0.02, 0.2, 'R', 0]];
  for (const [x, y, L, rosa] of bolas) {
    const X = x * w, Y = y * h + Math.sin(t * 1.5 + x * 9) * 6, R = h * 0.075;
    g.fillStyle = 'rgba(0,0,30,.35)'; g.beginPath(); g.ellipse(X + 5, Y + R * 0.9, R * 0.8, R * 0.25, 0, 0, 7); g.fill();
    const gr = g.createRadialGradient(X - R * 0.35, Y - R * 0.4, R * 0.1, X, Y, R); gr.addColorStop(0, rosa ? '#ffb8f0' : '#a8fff0'); gr.addColorStop(0.55, rosa ? '#d63ab8' : '#1fb8a8'); gr.addColorStop(1, rosa ? '#6a0a6a' : '#0a5a5a');
    g.fillStyle = gr; g.beginPath(); g.arc(X, Y, R, 0, 7); g.fill();
    g.fillStyle = '#f4f0ff'; g.font = `900 ${Math.round(R * 1.05)}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(L, X, Y + 2);
  }
  g.font = `900 ${Math.round(h * 0.3)}px 'Arial Black', Arial`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  for (let d = 12; d > 0; d -= 2) { g.fillStyle = `rgb(${60 + d * 4},${60 + d * 4},${70 + d * 4})`; g.fillText('LA LETRA', cx + d * 0.6, h * 0.3 + d); }
  const tg = g.createLinearGradient(0, 0, 0, h * 0.3); tg.addColorStop(0, '#f2efe6'); tg.addColorStop(1, '#bdb7a8'); g.fillStyle = tg; g.fillText('LA LETRA', cx, h * 0.3);
}

export function build(scene, ctx) {
  return crearPlato(scene, ctx, { nombre: 'plato-rueda-letra', fondo: 0x07041a, especial: ctx.especial, especialOpts: { centro: [0, 0, -3], radio: 10, anios: '1' } }, (root, up) => {
    K.luces(root, { hemi: [0xd0b0ff, 0x10082a, 0.8], key: 110, puntos: [[0x2ee8d0, 50, -8, 5, -6], [0xb050ff, 50, 8, 5, -6], [0xff8a60, 40, 0, 6, 10, 22], [0xffffff, 15, 0, 5, 4, 12]] });
    // suelo LED con espirales turquesa/morado
    const fl = K.canvasTex(1024, 1024, (g, w, h, t) => {
      g.fillStyle = '#0a0628'; g.fillRect(0, 0, w, h);
      for (let k = 0; k < 3; k++) { g.lineWidth = 14; for (let i = 0; i < 260; i++) { const a = i * 0.09 + t * 0.4 + k * 2.09, r = i * 1.9;
        g.strokeStyle = `hsla(${175 + (i / 260) * 110},90%,55%,${0.6 - i / 600})`; g.beginPath(); g.arc(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, 6, 0, 7); g.stroke(); } }
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(32, 96), new THREE.MeshStandardMaterial({ map: fl.tex, emissive: 0xffffff, emissiveMap: fl.tex, emissiveIntensity: 0.6, roughness: 0.15, metalness: 0.4 }));
    floor.rotation.x = -Math.PI / 2; root.add(floor);
    // tarima blanca con LEDs y dos atriles cilíndricos (azul / morado)
    const tar = new THREE.Mesh(new THREE.BoxGeometry(9, 0.5, 4), K.mat(0xf2f2f6, { roughness: 0.2 })); tar.position.set(0, 0.25, -8); root.add(tar);
    for (const y of [0.1, 0.45]) { const l = new THREE.Mesh(new THREE.BoxGeometry(9.05, 0.04, 0.04), K.glow(0xffffff, 2.4)); l.position.set(0, y, -5.98); root.add(l); }
    const aA = K.atrilCilindro({ color: 0x2a8bff }); aA.position.set(-1.6, 0.5, -8); root.add(aA);
    const aB = K.atrilCilindro({ color: 0xb050ff }); aB.position.set(1.6, 0.5, -8); root.add(aB);
    const fA = K.figure({ body: 0x2a6bff, legs: 0x22222a, hair: 0x2a1a10 }); fA.position.set(-1.6, 0.5, -8.6); root.add(fA);
    const fB = K.figure({ body: 0x8a3ad0, legs: 0x22222a, hair: 0x3a2412 }); fB.position.set(1.6, 0.5, -8.6); root.add(fB);
    // aros de luz arriba
    for (const [x, c] of [[-2.4, 0x2ab8ff], [2.4, 0xc050ff]]) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.07, 10, 64), K.glow(c, 2.6)); r.rotation.x = Math.PI / 2.4; r.position.set(x, 8.2, -9.6); root.add(r); }
    // pantallas LED: centro (logo alterno a/b) y laterales
    const ruedaRA = K.rosco({ radius: 0.62, bulb: 0.07, base: 0x0c2a8a, bulbColor: 0x9ff5ec }), ruedaRB = K.rosco({ radius: 0.62, bulb: 0.07, base: 0x3a0c6a, bulbColor: 0xffb0e0 });
    const centro = K.canvasTex(1280, 720, (g, w, h, t) => {
      K.drawConcentric({ c1: '#3a1080', c2: '#18c8c0', ring: 'rgba(200,255,250,0.6)', letras: true })(g, w, h, t);
      if (dibujaLogoUsuario(g, w, h, ctx, t)) return;
      const fase = Math.floor(t / 8) % 3; if (fase === 2) return drawFondoLaLetra(g, w, h, t);
      if (fase === 0) drawLogoRosco(g, w / 2, h / 2, 240, t); else drawLogoEsfera(g, w / 2, h / 2, 230, t);
    });
    const SC = K.screen(10, 5.6, centro, { frame: 0x05040c }); SC.position.set(0, 4.2, -10.2); root.add(SC);
    const lat = K.canvasTex(720, 900, K.drawConcentric({ c1: '#4a10a0', c2: '#20d8c8', ring: 'rgba(220,255,250,0.6)' }));
    for (const s of [-1, 1]) { const L = K.screen(5.4, 6.8, lat, { frame: 0x05040c }); L.position.set(s * 8.6, 3.9, -9.2); L.rotation.y = -s * 0.25; root.add(L); }
    ruedaRA.position.set(-1.6, 2.35, -7.68); ruedaRA.scale.setScalar(0.35); root.add(ruedaRA);
    ruedaRB.position.set(1.6, 2.35, -7.68); ruedaRB.scale.setScalar(0.35); root.add(ruedaRB);
    const sim = K.roscoSim(ruedaRA, ruedaRB, ctx);
    up.push(t => { sim.update(t); centro.update(t); lat.update(t); fl.update(t); if (globalThis.__ledRueda !== ledAnt) { ledAnt = globalThis.__ledRueda; strip.update(t); } });
    // mesa de invitados: 6 atriles cilíndricos negros con encimera de cristal
    const mesa = new THREE.Group(); mesa.position.set(0, 0, 0); root.add(mesa);
    const glassTop = new THREE.Mesh(new THREE.BoxGeometry(9, 0.05, 1.1), new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.35, roughness: 0.05 }));
    glassTop.position.y = 1.18; mesa.add(glassTop);
    const ledTop = new THREE.Mesh(new THREE.BoxGeometry(9.05, 0.03, 1.12), K.glow(0x3a7bff, 1.6)); ledTop.position.y = 1.15; mesa.add(ledTop);
    const est = [{ body: 0x2a6bff }, { body: 0x2a6bff }, { body: 0x2a6bff }, { body: 0x8a3ad0 }, { body: 0x8a3ad0 }, { body: 0x8a3ad0 }];
    for (let i = 0; i < 6; i++) {
      const x = -3.9 + i * 1.56 + (i >= 3 ? 0.3 : -0.3);
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.15, 32), K.mat(0x0a1250, { metalness: 0.6, roughness: 0.18 })); c.position.set(x, 0.575, 0); mesa.add(c);
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), K.glow(0xff4ae8, 2.2)); d.position.set(x, 0.62, 0.425); mesa.add(d);
      const f = K.figure({ ...est[i], legs: 0x22222a, hair: [0x2a1a10, 0x6a4020, 0x111111][i % 3] }); f.position.set(x, 0, -0.75); mesa.add(f);
    }
    // presentador en pie, delante (personaje original)
    const host = K.figure({ body: 0x2a2a34, legs: 0x1a1a22, hair: 0x8a8a90 }); host.position.set(0, 0, 2.2); host.rotation.y = Math.PI; root.add(host);
    { const at = new THREE.Group(); at.position.set(0, 0, 2.95); root.add(at);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 1.0, 40), K.mat(0x1a2a6a, { metalness: 0.7, roughness: 0.2 })); col.position.y = 0.5; at.add(col);
      const aro = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.025, 8, 48), K.glow(0xffffff, 2.2)); aro.rotation.x = Math.PI / 2; aro.position.y = 0.9; at.add(aro);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.04, 48), new THREE.MeshPhysicalMaterial({ color: 0xd8ecff, transparent: true, opacity: 0.35, roughness: 0.04, metalness: 0.1 })); top.position.y = 1.08; at.add(top);
      const tabTexDe = col => K.canvasTex(512, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.font = '900 86px Arial Black, Arial'; g.textAlign = 'center'; g.save(); g.translate(w / 2, h / 2); g.rotate(-0.12); g.fillText('RUEDA', 0, -18); g.fillText('LA LETRA', 0, 70); g.restore(); });
      for (const [x, c, cs] of [[-0.55, 0xb04cf0, '#b04cf0'], [0.55, 0x2cd0e4, '#2cd0e4']]) { const tb = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.03), [K.mat(c), K.mat(c), K.mat(c), K.mat(c), new THREE.MeshStandardMaterial({ map: tabTexDe(cs).tex, roughness: 0.4 }), K.mat(c)]);
        tb.position.set(x, 1.28, 0.1); tb.rotation.set(-0.35, x < 0 ? 0.25 : -0.25, 0); at.add(tb); } }
    // grada con butacas azules y pared salmón con círculos y franjas LED
    const gr = K.grada({ rows: 5, cols: 26, width: 22, seat: 0x3a8bff, step: 0x1a1a3a }); gr.position.set(0, 0, 9); root.add(gr);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 12, 96, 1, true, -Math.PI * 0.42, Math.PI * 0.84), K.mat(0xff8a70, { emissive: 0xff5a40, emissiveIntensity: 0.35, side: THREE.BackSide }));
    wall.position.set(0, 6, -3); root.add(wall);
    for (let i = 0; i < 40; i++) { const a = -Math.PI * 0.4 + Math.random() * Math.PI * 0.8; const d = new THREE.Mesh(new THREE.CircleGeometry(0.15 + Math.random() * 0.25, 20), K.mat(0x221018));
      d.position.set(Math.sin(a) * 19.9, 9 + Math.random() * 2.6, Math.cos(a) * 19.9 - 3); d.lookAt(0, d.position.y, -3); root.add(d); }
    const bandaN = K.drawBand('RUEDA LA LETRA', { bg1: '#111018', bg2: '#1a1828', color: '#f4e6c8', font: '700 110px Arial', n: 4 });
    const bandaHD = K.drawBand('¡HE DICHO!', { bg1: '#5a1ac0', bg2: '#8a2ae0', color: '#ffffff', font: '900 120px Arial Black, Arial', n: 4 });
    let ledAnt = null; const strip = K.canvasTex(4096, 192, (g, w, h, t) => (globalThis.__ledRueda === '¡HE DICHO!' ? bandaHD : bandaN)(g, w, h, t));
    for (const y of [5.4, 6.9]) { const b = K.ledBand({ radius: 19.5, height: 1.1, y, start: -Math.PI * 0.4, len: Math.PI * 0.8, tex: strip.tex }); b.position.z = -3; b.rotation.y = 0; root.add(b); }
    const arcs = new THREE.Mesh(new THREE.TorusGeometry(3, 0.04, 6, 64, Math.PI), K.glow(0xffffff, 2)); arcs.position.set(0, 8.3, 16); arcs.rotation.y = Math.PI; root.add(arcs);
    root.add(K.movingHeads(up, [[-6, 11, -4], [0, 11, -6], [6, 11, -4], [-5, 11, 4], [5, 11, 4]], [0x2ee8d0, 0xc050ff, 0xffffff]));
    const sal = K.salida({ style: 'puerta', color: 0xc050ff }); sal.position.set(-15, 0, 2); sal.rotation.y = Math.PI / 2; root.add(sal);
    return { rosco: sim, clickables: [sal] };
  });
}
