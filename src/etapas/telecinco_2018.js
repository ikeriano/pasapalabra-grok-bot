// Plató Telecinco (2018-2019): todo azul, banda LED curva con 'Pasapalabra' y el bote,
// medallones naranja/rojo con globo, pantalla con collage de letras y logo de globo,
// mesa blanca en C con marcador rojo/azul, cristaleras con letras de neón y suelo con letras.
import * as THREE from 'three';
import * as K from '../lib/kit.js';
import { crearPlato, drawGlobeLogo, dibujaLogoUsuario } from './_base.js';

export const info = { id: 'telecinco-2018', nombre: 'Telecinco', anios: '2018-2019', disponible: true };
export const cameras = {
  general: { label: '🎥 Plano general', pos: [0, 12, 19], target: [0, 1.5, -3] },
  mesa: { label: '🪑 Mesa', pos: [0, 3.4, 7], target: [0, 1.4, -1], mode: 'pruebas' },
  atril: { label: '🔴🔵 Rosco', pos: [0, 3.2, 1.5], target: [0, 3.2, -9], mode: 'rosco' },
  publico: { label: '👏 Público', pos: [-3, 3.2, 1], target: [14, 2.5, 0] },
  salida: { label: '🚪 Salida', pos: [-8, 2.6, 4], target: [-15, 2.2, 4] },
};

export function build(scene, ctx) {
  return crearPlato(scene, ctx, { nombre: 'plato-telecinco-2018', fondo: 0x020a24, especial: ctx.especial, especialOpts: { centro: [0, 0, -2], radio: 10, anios: '19' } }, (root, up) => {
    K.luces(root, { hemi: [0x9fc8ff, 0x0a1a50, 0.9], key: 120, puntos: [[0x2a7bff, 70, 0, 7, -8, 24], [0x3fa0ff, 50, 12, 6, 0], [0x3fa0ff, 50, -12, 6, 0], [0xffffff, 15, 0, 5, 6, 12]] });
    root.add(K.floorLetters({ size: 70, bg: '#0a2a9a', letter: '#e8f4ff', outline: true, glowColor: '#9fd8ff', count: 55, seed: 21, lw: 9, roughness: 0.1, metalness: 0.5, emissiveIntensity: 1.6 }));
    const plat = K.platform(4.8, 0.3, { top: 0xe8eef8, edge: 0x7fd0ff, edgeI: 2.4 }); root.add(plat);
    // mesa blanca en forma de C abierta hacia el presentador
    const mesa = new THREE.Group(); mesa.position.y = 0.3; root.add(mesa);
    const s = new THREE.Shape(); s.absarc(0, 0, 3.0, -Math.PI * 0.15, Math.PI * 1.15, false); s.absarc(0, 0, 2.0, Math.PI * 1.15, -Math.PI * 0.15, true); s.closePath();
    const top = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, curveSegments: 64 }), K.mat(0xf6f8fc, { roughness: 0.25 }));
    top.rotation.x = Math.PI / 2; top.position.y = 1.15; mesa.add(top);
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(2.85, 2.6, 1.05, 96, 1, true, Math.PI * 0.35, Math.PI * 1.3), K.mat(0xdfe5ee, { side: THREE.DoubleSide, roughness: 0.3 }));
    skirt.rotation.y = Math.PI; skirt.position.y = 0.55; mesa.add(skirt);
    // marcador central rojo/azul (rosco de mesa)
    const mk = K.canvasTex(512, 512, (g, w, h, t) => {
      g.fillStyle = '#0a1240'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 4; i++) { g.strokeStyle = i % 2 ? '#2a6bff' : '#ff3030'; g.lineWidth = 26; g.beginPath(); g.arc(w / 2, h / 2, 220 - i * 40, Math.PI * (i % 2), Math.PI * (1 + i % 2)); g.stroke(); }
      g.fillStyle = '#fff'; g.font = '700 54px Arial'; g.textAlign = 'center'; g.fillText('Pasapalabra', w / 2, h / 2 + 18);
    });
    const disp = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.5, 48, 1, true), new THREE.MeshBasicMaterial({ map: mk.tex, toneMapped: false, side: THREE.DoubleSide }));
    disp.position.set(0, 1.0, -0.2); mesa.add(disp);
    K.sentarAlrededor(mesa, [Math.PI, 0.5, 0.0, -0.5, 1.2, -1.2, 1.9], 3.4,
      [{ body: 0x1a1d2a, legs: 0x1a1d2a, hair: 0x2a1a10 }, ...K.ESTILOS_INVITADOS], { chair: { transparent: false, color: 0x2a2e3a } });
    // banda LED curva superior con 'Pasapalabra' y el bote
    const band = K.canvasTex(4096, 256, K.drawBand('Pasapalabra', { bote: '1.024.000 €', bg1: '#0a2fae', bg2: '#1e6aff', font: '700 120px Arial' }));
    root.add(K.ledBand({ radius: 17, height: 1.8, y: 8.3, start: Math.PI * 0.55, len: Math.PI * 0.9, tex: band.tex }));
    // pantalla central con collage de letras + logo de globo
    const scr = K.canvasTex(1280, 640, (g, w, h, t) => {
      g.fillStyle = '#1550e6'; g.fillRect(0, 0, w, h);
      g.font = '700 70px Arial'; for (let i = 0; i < 90; i++) { g.save(); g.translate((i * 151) % w, (i * 97 + t * 20) % h); g.rotate(i); g.fillStyle = `rgba(200,230,255,${0.15 + (i % 5) * 0.08})`; g.fillText('ABCDEFGHIJLMNOPQRSTUVXYZ'[i % 24], 0, 0); g.restore(); }
      if (!dibujaLogoUsuario(g, w, h, ctx, t)) drawGlobeLogo(g, w / 2, h / 2, 190, t, { font: '700 80px Arial' });
    });
    up.push(t => { scr.update(t); });
    const S = K.screen(10, 5, scr, { frame: 0x0a1650 }); S.position.set(0, 3.6, -11); root.add(S);
    const sp = K.platform(5, 0.35, { top: 0x2a4fd0, edge: 0x9fd8ff }); sp.position.set(0, 0, -8.5); root.add(sp);
    // roscos de la final sobre atriles delante de la pantalla
    const rA = K.rosco({ radius: 0.6, bulb: 0.07, base: 0xff6a00 }), rB = K.rosco({ radius: 0.6, bulb: 0.07, base: 0x1450e6 });
    [[rA, -2], [rB, 2]].forEach(([r, x]) => {
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.1, 32), K.mat(0xf2f6fc)); pod.position.set(x, 0.9, -7.8); root.add(pod);
      r.position.set(x, 2.9, -8.2); root.add(r);
      const f = K.figure({ body: x < 0 ? 0xff8a20 : 0x2a5cff, legs: 0x22222a, hair: 0x2a1a10 }); f.position.set(x, 0.35, -8.6); root.add(f);
    });
    const sim = K.roscoSim(rA, rB, ctx); up.push(t => { sim.update(t); band.update(t); });
    // medallones naranja/rojo con globo en las paredes
    for (const [x, z, ry] of [[-13, -6, 0.9], [13, -6, -0.9], [-7, -10.5, 0.3], [7, -10.5, -0.3]]) {
      const m = new THREE.Group(); m.position.set(x, 5, z); m.rotation.y = ry; root.add(m);
      const d1 = new THREE.Mesh(new THREE.CircleGeometry(1.3, 48), K.mat(0xff5a20, { emissive: 0xff3a00, emissiveIntensity: 0.8 })); m.add(d1);
      const d2 = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.55, 48), K.glow(0xffffff, 1.4)); m.add(d2);
      const gl = new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffe0d0, wireframe: true })); gl.position.z = 0.1; gl.scale.z = 0.3; m.add(gl);
      up.push(t => { gl.rotation.y = t * 0.5; });
    }
    // paredes azules con columnas de luz
    for (let i = 0; i < 12; i++) {
      const a = Math.PI * 0.58 + i * 0.075 * Math.PI; const p = new THREE.Mesh(new THREE.BoxGeometry(4.6, 9, 0.3), K.mat(0x1a5cf0, { emissive: 0x0c3ad0, emissiveIntensity: 0.6 }));
      p.position.set(Math.cos(a) * 19, 4.5, -Math.sin(a) * 19 + 2); p.lookAt(0, 4.5, 2); root.add(p);
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 9, 0.32), K.glow(0x9fe0ff, 2)); l.position.copy(p.position); l.quaternion.copy(p.quaternion); l.translateX(2.3); root.add(l);
    }
    // gradas con cristaleras y letras de neón
    const neon = K.neonTextTexture('A B C Ñ G S Y R F', { font: '700 150px Arial', reps: 1 });
    const gR = K.grada({ rows: 6, cols: 22, width: 18, seat: 0x2a5cff, step: 0x0f2a80, rail: 0x9fd8ff, railTex: neon }); gR.position.set(13, 0, -1); gR.rotation.y = Math.PI / 2; root.add(gR);
    const gF = K.grada({ rows: 5, cols: 20, width: 16, seat: 0x2a5cff, step: 0x0f2a80, rail: 0x9fd8ff, railTex: neon }); gF.position.set(0, 0, 11); root.add(gF);
    const st = K.stairs({ steps: 9, width: 2.2, color: 0x1a3ca0, light: 0xffffff }); st.position.set(8, 0, -9); root.add(st);
    root.add(K.movingHeads(up, [[-6, 11, -4], [0, 11, -6], [6, 11, -4], [-4, 11, 4], [4, 11, 4], [0, 11, 0]], [0xffffff, 0x9fd8ff]));
    const sal = K.salida({ style: 'puerta', color: 0x6fc0ff }); sal.position.set(-15, 0, 4); sal.rotation.y = Math.PI / 2; root.add(sal);
    return { rosco: sim, clickables: [sal] };
  });
}
