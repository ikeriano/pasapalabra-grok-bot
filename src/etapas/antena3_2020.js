// Plató segunda etapa de Antena 3 (2020-2026): tira curva de pantallas LED con 'pasapalabra'
// y el bote, tres paneles naranjas con letras, pantalla de círculos concéntricos, mesa circular
// de cristal con LED azul y rosco central, sillas transparentes, atriles en plataformas
// circulares, suelo azul reflectante con letras turquesa, grada con cristal y neón, portal de entrada.
import * as THREE from 'three';
import * as K from '../lib/kit.js';
import { crearPlato, dibujaLogoUsuario } from './_base.js';

export const info = { id: 'antena3-2020', nombre: 'Antena 3', anios: '2020-2026', disponible: true };
export const cameras = {
  general: { label: '🎥 Plano general', pos: [-4, 9, 19], target: [0, 2, -3] },
  mesa: { label: '🪑 Mesa', pos: [0, 3.6, 8], target: [0, 1.3, 0], mode: 'pruebas' },
  atril: { label: '🔴🔵 Atriles / Final', pos: [-3, 3, 1], target: [-7, 2.2, -8], mode: 'rosco' },
  publico: { label: '👏 Público', pos: [-2, 3, 2], target: [14, 3, 1] },
  salida: { label: '🚪 Portal (salida)', pos: [4, 2.6, 0], target: [10, 2.6, -9] },
};
const BOTE = '760.000 €';

export function build(scene, ctx) {
  return crearPlato(scene, ctx, { nombre: 'plato-antena3-2020', fondo: 0x030a22, especial: ctx.especial, especialOpts: { centro: [0, 0, -2], radio: 10, anios: '25' } }, (root, up) => {
    K.luces(root, { hemi: [0xbfe0ff, 0x0a2060, 1.0], key: 120, puntos: [[0x3a8bff, 70, 0, 7, -8, 24], [0x6fc0ff, 50, 12, 6, 0], [0x6fc0ff, 40, -12, 6, 0], [0xffffff, 20, 0, 5, 6, 14]] });
    // suelo azul brillante con letras turquesa/blancas gigantes
    root.add(K.floorLetters({ size: 70, bg: '#0b3cc0', letter: '#5ff5e8', outline: false, glowColor: '#5ff5e8', count: 40, seed: 5, roughness: 0.06, metalness: 0.55, emissiveIntensity: 1.2 }));
    // plataforma central + mesa de cristal con rosco
    const plat = K.platform(5.2, 0.32, { top: 0xf2f6ff, edge: 0x5fb0ff, edgeI: 2.6 }); root.add(plat);
    const centro = K.canvasTex(512, 512, (g, w, h, t) => {
      g.fillStyle = '#071a5a'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 25; i++) { const a = -Math.PI / 2 + i / 25 * Math.PI * 2; g.fillStyle = (Math.floor(t * 4) % 25) === i ? '#ffd400' : '#3fa0ff';
        g.beginPath(); g.arc(w / 2 + Math.cos(a) * 200, h / 2 + Math.sin(a) * 200, 20, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '700 24px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(K.ROSCO_LETRAS[i], w / 2 + Math.cos(a) * 200, h / 2 + Math.sin(a) * 200 + 1); }
      g.fillStyle = '#fff'; g.font = '700 58px Arial'; g.fillText('pasapalabra', w / 2, h / 2);
    });
    const mesa = K.mesaCristal({ r: 3.2, led: 0x2a7bff, centro: centro.tex }); mesa.position.y = 0.32; root.add(mesa);
    const bandMesa = K.canvasTex(2048, 128, K.drawBand('pasapalabra', { bg1: '#0a3bd0', bg2: '#1a6aff', font: '700 80px Arial' }));
    mesa.userData.band.material.map = bandMesa.tex; mesa.userData.band.material.needsUpdate = true;
    K.sentarAlrededor(mesa, [Math.PI, 0.45, 0.0, -0.45, 1.25, -1.25, 2.0], 3.7,
      [{ body: 0xf0f0e0, legs: 0x5577aa, hair: 0x2a1a10 }, ...K.ESTILOS_INVITADOS]);
    // tira curva de pantallas LED en lo alto: 'pasapalabra' + bote
    const band = K.canvasTex(4096, 256, K.drawBand('pasapalabra', { bote: BOTE, bg1: '#0a39c8', bg2: '#1f74ff', font: '700 130px Arial', every: 2 }));
    root.add(K.ledBand({ radius: 18, height: 2.2, y: 8.8, start: Math.PI * 0.5, len: Math.PI, tex: band.tex }));
    // pantalla grande con círculos concéntricos azules
    const conc = K.canvasTex(1280, 720, (g, w, h, t) => { K.drawConcentric({ c1: '#0a2fae', c2: '#3fa8ff', texto: 'pasapalabra', font: '700 110px Arial' })(g, w, h, t); dibujaLogoUsuario(g, w, h, ctx, t); });
    const S = K.screen(9, 5.06, conc, { frame: 0x0b1440 }); S.position.set(-9.5, 3.8, -9); S.rotation.y = 0.5; root.add(S);
    // tres paneles verticales naranjas con letras
    const panelTex = ['P', 'H', 'D'].map((L, i) => K.canvasTex(256, 768, (g, w, h, t) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ff9a20'); gr.addColorStop(1, '#ff5a00'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(255,220,150,0.5)'; g.lineWidth = 6; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(w / 2, h / 2, 40 + k * 40 + (t * 20) % 40, 0, 7); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = '700 150px Arial'; g.textAlign = 'center'; g.fillText(L, w / 2, h * 0.75);
    }));
    panelTex.forEach((pt, i) => { const p = K.screen(1.8, 5.4, pt, { frame: 0x10141f }); p.position.set(-3 + i * 2.3, 3.4, -11); root.add(p); });
    // atriles en plataformas circulares (final)
    const rA = K.rosco({ radius: 0.55, bulb: 0.065, base: 0xff6a00 }), rB = K.rosco({ radius: 0.55, bulb: 0.065, base: 0x1450e6 });
    [[rA, -8.5, -6], [rB, -5.5, -7.2]].forEach(([r, x, z], k) => {
      const pp = K.platform(1.3, 0.3, { top: 0xeaf2ff, edge: 0x5fb0ff }); pp.position.set(x, 0, z); root.add(pp);
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 1.1, 24), K.mat(0xdfe8f8, { metalness: 0.3 })); pod.position.set(x, 0.85, z + 0.4); root.add(pod);
      const ledT = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.02, 6, 32), K.glow(0x4fb0ff, 2.5)); ledT.rotation.x = Math.PI / 2; ledT.position.set(x, 1.4, z + 0.4); root.add(ledT);
      r.position.set(x, 2.9, z + 0.6); r.rotation.y = 0.4; root.add(r);
      const f = K.figure({ body: k ? 0x2a5cff : 0xff8a20, legs: 0x22222a, hair: 0x2a1a10 }); f.position.set(x, 0.3, z - 0.1); f.rotation.y = 0.4; root.add(f);
    });
    const sim = K.roscoSim(rA, rB, ctx);
    up.push(t => { sim.update(t); band.update(t); conc.update(t); centro.update(t); bandMesa.update(t); panelTex.forEach(p => p.update(t)); });
    // grada a la derecha con barandilla de cristal y 'pasapalabra' en neón
    const neon = K.neonTextTexture('pasapalabra', { font: '700 150px Arial', reps: 2 });
    const gR = K.grada({ rows: 6, cols: 24, width: 20, seat: 0xf2f4f8, step: 0x123a9a, rail: 0xbfe6ff, railTex: neon }); gR.position.set(13, 0, 0); gR.rotation.y = Math.PI / 2; root.add(gR);
    // escaleras iluminadas
    const st1 = K.stairs({ steps: 8, width: 2.2, color: 0x16224a, light: 0xffffff }); st1.position.set(7.2, 0, -9.5); root.add(st1);
    const st2 = K.stairs({ steps: 8, width: 2.2, color: 0x16224a, light: 0xffffff }); st2.position.set(12.8, 0, -9.5); root.add(st2);
    // portal circular de entrada (salida hacia los Estudios)
    const portal = K.salida({ style: 'portal', label: 'ESTUDIOS GROK BOT ▸' }); portal.position.set(10, 0, -10.5); root.add(portal);
    const ps = K.textoPlano('pasapalabra', { w: 6, h: 1.1, color: '#ffffff', font: '700 160px Arial' }); ps.position.set(10, 6.3, -10.4); root.add(ps);
    // paredes con pantallas y paneles de puntos
    for (let i = 0; i < 12; i++) {
      const a = Math.PI * 0.55 + i * 0.08 * Math.PI; const p = new THREE.Mesh(new THREE.BoxGeometry(4.8, 7.5, 0.3), K.mat(0x2a6cff, { emissive: 0x1a4ce0, emissiveIntensity: 0.55 }));
      p.position.set(Math.cos(a) * 20, 3.75, -Math.sin(a) * 20 + 2); p.lookAt(0, 3.75, 2); root.add(p);
    }
    root.add(K.movingHeads(up, [[-7, 11.5, -5], [-2, 11.5, -7], [3, 11.5, -7], [8, 11.5, -5], [-5, 11.5, 4], [5, 11.5, 4], [0, 11.5, 1]], [0xffffff, 0x9fd8ff, 0x7f9cff]));
    return { rosco: sim, clickables: [portal] };
  });
}
