// Plató Telecinco (2007-2018): suelo oscuro con letras grises gigantes, mesa redonda
// central blanca con anillo naranja/azul, pantalla grande con logo de globo, gradas con
// barandillas metálicas, escaleras y luces azules.
import * as THREE from 'three';
import * as K from '../lib/kit.js';
import { crearPlato, drawGlobeLogo, dibujaLogoUsuario } from './_base.js';

export const info = { id: 'telecinco-2007', nombre: 'Telecinco', anios: '2007-2018', disponible: true };
export const cameras = {
  general: { label: '🎥 Plano general', pos: [14, 13, 18], target: [0, 1, -2] },
  mesa: { label: '🪑 Mesa', pos: [0, 3.2, 7.5], target: [0, 1.4, -1], mode: 'pruebas' },
  atril: { label: '🔴🔵 Rosco', pos: [-6, 3, 2.5], target: [-9, 2.4, -8], mode: 'rosco' },
  publico: { label: '👏 Público', pos: [-2, 3, 2], target: [12, 3, -2] },
  salida: { label: '🚪 Salida', pos: [-8, 2.6, 5], target: [-15, 2.2, 5] },
};

export function build(scene, ctx) {
  return crearPlato(scene, ctx, { nombre: 'plato-telecinco-2007', fondo: 0x03050c, especial: ctx.especial, especialOpts: { centro: [0, 0, -2], radio: 10, anios: '10' } }, (root, up) => {
    K.luces(root, { hemi: [0x8fb4ff, 0x0a0f20, 0.6], key: 140, puntos: [[0x2a5bff, 60, -8, 6, -6], [0x3f7dff, 50, 10, 6, -2], [0x6f8cff, 30, 0, 8, 8], [0xff9a40, 15, 0, 3, 0, 8]] });
    // suelo oscuro con letras grises
    const floor = K.floorLetters({ size: 70, bg: '#1b1e27', letter: '#8a8f9c', outline: false, count: 60, seed: 11, roughness: 0.35, metalness: 0.3, emissiveIntensity: 0.25 });
    root.add(floor);
    // focos azules en el suelo (manchas de luz)
    for (const [x, z] of [[-6, 4], [-3, -6], [4, -5], [6, 3], [-8, -1], [1, 7]]) {
      const s = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), new THREE.MeshBasicMaterial({ color: 0x3050ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
      s.rotation.x = -Math.PI / 2; s.position.set(x, 0.02, z); root.add(s);
    }
    // plataforma central y mesa redonda
    const plat = K.platform(4.6, 0.3, { top: 0xd8dce6, edge: 0x4f7dff, edgeI: 2.4 }); root.add(plat);
    const mesa = new THREE.Group(); mesa.position.y = 0.3; root.add(mesa);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.55, 16, 96), K.mat(0xf2f4f8, { roughness: 0.3 })); ring.rotation.x = Math.PI / 2; ring.scale.z = 0.45; ring.position.y = 1.0; mesa.add(ring);
    const topO = new THREE.Mesh(new THREE.RingGeometry(1.75, 2.85, 96, 1, Math.PI * 0.05, Math.PI * 0.9), K.mat(0xff7a10, { emissive: 0xff5a00, emissiveIntensity: 0.35, side: THREE.DoubleSide }));
    topO.rotation.x = -Math.PI / 2; topO.position.y = 1.26; mesa.add(topO);
    const topB = new THREE.Mesh(new THREE.RingGeometry(1.75, 2.85, 96, 1, Math.PI * 1.05, Math.PI * 0.9), K.mat(0x2a5cff, { emissive: 0x1a3cff, emissiveIntensity: 0.35, side: THREE.DoubleSide }));
    topB.rotation.x = -Math.PI / 2; topB.position.y = 1.26; mesa.add(topB);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.2, 0.8, 64, 1, true), K.mat(0xc8ccd8, { side: THREE.DoubleSide })); ped.position.y = 0.4; mesa.add(ped);
    K.sentarAlrededor(mesa, [Math.PI, 0.55, 0.0, -0.55, 1.6, -1.6, 2.3], 3.3,
      [{ body: 0x1c1c22, legs: 0x1c1c22, hair: 0x3a2412 }, ...K.ESTILOS_INVITADOS], { chair: { transparent: false, color: 0x30343e } });
    // pantalla grande a la izquierda con logo de globo
    const scrTex = K.canvasTex(1024, 576, (g, w, h, t) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1f6fff'); gr.addColorStop(1, '#0a2a9a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      if (!dibujaLogoUsuario(g, w, h, ctx, t)) drawGlobeLogo(g, w / 2, h / 2, 200, t, { font: '700 86px Arial' });
    });
    up.push(t => scrTex.update(t));
    const scr = K.screen(7, 3.94, scrTex, { frame: 0x9aa4b8 }); scr.position.set(-9, 4.2, -9); scr.rotation.y = 0.55; root.add(scr);
    const scrPlat = K.platform(4, 0.5, { top: 0x1a2140, edge: 0x3f7dff, edgeI: 2.4 }); scrPlat.position.set(-9, 0, -7.5); root.add(scrPlat);
    // atriles de la prueba final con roscos sobre la plataforma
    const rA = K.rosco({ radius: 0.62, bulb: 0.07, base: 0xff6a00 }), rB = K.rosco({ radius: 0.62, bulb: 0.07, base: 0x1450e6 });
    [[rA, -10.6, 0x0], [rB, -7.6, 0x0]].forEach(([r, x]) => {
      const pod = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 0.6), K.mat(0xe8ecf4, { roughness: 0.3 })); pod.position.set(x, 1.05, -6.4); pod.rotation.y = 0.55; root.add(pod);
      r.position.set(x + 0.45, 2.6, -6.1); r.rotation.y = 0.55; r.scale.setScalar(0.9); root.add(r);
      const f = K.figure({ body: x < -9 ? 0xff8a20 : 0x2a5cff, legs: 0x22222a, hair: 0x2a1a10 }); f.position.set(x - 0.3, 0.5, -7.0); f.rotation.y = 0.55; root.add(f);
    });
    const sim = K.roscoSim(rA, rB, ctx); up.push(t => sim.update(t));
    // gradas con barandillas metálicas (derecha y frente)
    const railTex = null;
    const gR = K.grada({ rows: 7, cols: 22, width: 18, seat: 0xdfe3ea, step: 0x2a2f3c, rail: 0xb8c0d0, railTex }); gR.position.set(13, 0, -2); gR.rotation.y = Math.PI / 2; root.add(gR);
    const gF = K.grada({ rows: 6, cols: 20, width: 16, seat: 0xdfe3ea, step: 0x2a2f3c, rail: 0xb8c0d0 }); gF.position.set(1, 0, 11); root.add(gF);
    // barandilla metálica tubular delante de las gradas
    const tubeM = K.mat(0xd0d6e0, { metalness: 0.9, roughness: 0.2 });
    for (let i = 0; i < 18; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6), tubeM); p.position.set(12.0, 0.55, -10.5 + i); root.add(p); }
    // escaleras al fondo
    const st = K.stairs({ steps: 8, width: 2.4, color: 0x2a3042, light: 0x9fc0ff }); st.position.set(3, 0, -10); root.add(st);
    // paneles de fondo
    for (let i = 0; i < 9; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(3, 7, 0.3), K.mat(i % 2 ? 0x1a2550 : 0x2a3c80, { emissive: 0x0a1a60, emissiveIntensity: 0.5 }));
      const a = Math.PI * 0.62 + i * 0.12; p.position.set(Math.cos(a) * 20, 3.5, -Math.sin(a) * 20 + 2); p.lookAt(0, 3.5, 2); root.add(p);
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 7, 0.32), K.glow(0x6f9cff, 1.6)); l.position.copy(p.position); l.quaternion.copy(p.quaternion); l.translateX(1.5); root.add(l);
    }
    root.add(K.movingHeads(up, [[-6, 12, -4], [0, 12, -6], [6, 12, -4], [-4, 12, 4], [4, 12, 4], [0, 12, 1]]));
    // salida
    const sal = K.salida({ style: 'puerta', color: 0x4f7dff }); sal.position.set(-15, 0, 5); sal.rotation.y = Math.PI / 2; root.add(sal);
    return { rosco: sim, clickables: [sal] };
  });
}
