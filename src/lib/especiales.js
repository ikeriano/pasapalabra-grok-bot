// Decoración temática para "Programas especiales"
import * as THREE from 'three';
import { mat, glow, text3D, figure } from './helpers.js';

export const ESPECIALES = {
  normal: { nombre: 'Normal', emoji: '⭐', deco: null, hashtag: '#Pasapalabra' },
  primetime: { nombre: 'Especial Prime Time', emoji: '🌟', deco: 'famosos', banner: 'ESPECIAL PRIME TIME', hashtag: '#PasapalabraPrimeTime', saludo: '¡Bienvenidos a esta gala especial en prime time! Esta noche el bote se juega a lo grande.' },
  navidad: { nombre: 'Navidad', emoji: '🎄', deco: 'navidad', banner: 'ESPECIAL NAVIDAD', hashtag: '#PasapalabraNavidad', saludo: '¡Feliz Navidad! Bienvenidos a un Pasapalabra muy especial, con turrón y muchas palabras.' },
  nochevieja: { nombre: 'Fin de Año', emoji: '🥂', deco: 'nochevieja', banner: 'ESPECIAL FIN DE AÑO', hashtag: '#PasapalabraFinDeAño', saludo: '¡Bienvenidos al especial de fin de año! Despedimos el año letra a letra.' },
  famosos: { nombre: 'Famosos', emoji: '🎤', deco: 'famosos', banner: 'ESPECIAL FAMOSOS', hashtag: '#PasapalabraFamosos', saludo: '¡Bienvenidos al especial de famosos! Hoy los invitados son estrellas… inventadas, eso sí.' },
  aniversario: { nombre: 'Aniversario', emoji: '🎂', deco: 'aniversario', banner: 'ESPECIAL ANIVERSARIO', hashtag: '#PasapalabraAniversario', saludo: '¡Feliz aniversario! Celebramos muchos años de roscos con todos vosotros.' },
  especial300: { nombre: 'Especial 300 suscriptores', emoji: '🏆', deco: 'aniversario', anios: '300', banner: 'ESPECIAL 300 SUSCRIPTORES', hashtag: '#Pasapalabra300', saludo: '¡Bienvenidos a este Pasapalabra dedicado a los suscriptores del canal de YouTube «Ikeriano el campeón 2»! ¡Ya sois 300!' },
};
// Famosos virtuales FICTICIOS (no representan a personas reales)
export const FAMOSOS_FICTICIOS = [
  'Lola Marquina (cantante)', 'Bruno Tejada (actor)', 'Cata Ribas (humorista)', 'Iker Solano (chef)',
  'Maribel Ondas (locutora)', 'Rubén Faro (deportista)', 'Nerea Vals (bailarina)', 'Teo Pizarra (mago)',
  'Alma Reyes (escritora)', 'Quique Brío (youtuber)', 'Sonia Lince (presentadora)', 'Pablo Cometa (músico)',
];

export function addEspecial(root, tipo, updaters, { centro = [0, 0, -2], radio = 9, anios = '20' } = {}) {
  const g = new THREE.Group(); g.name = 'especial-' + tipo; root.add(g);
  const [cx, cy, cz] = centro;
  if (tipo === 'navidad' || tipo === 'nochevieja') {
    // nieve / confeti
    const n = 1500, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = cx + (Math.random() - 0.5) * 40; pos[i * 3 + 1] = Math.random() * 14; pos[i * 3 + 2] = cz + (Math.random() - 0.5) * 30;
      const c = new THREE.Color(tipo === 'navidad' ? 0xffffff : [0xffd700, 0xff3b6b, 0x3bd1ff, 0xffffff][i % 4]); col.set([c.r, c.g, c.b], i * 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: tipo === 'navidad' ? 0.09 : 0.12, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }));
    g.add(pts);
    updaters.push((t, dt) => { const a = geo.attributes.position.array; for (let i = 0; i < n; i++) { a[i * 3 + 1] -= dt * (tipo === 'navidad' ? 0.6 : 1.4); a[i * 3] += Math.sin(t + i) * dt * 0.2; if (a[i * 3 + 1] < 0) a[i * 3 + 1] = 14; } geo.attributes.position.needsUpdate = true; });
  }
  if (tipo === 'navidad') {
    for (const s of [-1, 1]) {
      const tree = new THREE.Group(); tree.position.set(cx + s * radio, 0, cz - 2); g.add(tree);
      for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.6 - i * 0.32, 1.6, 16), mat(0x0f6a35, { roughness: 0.8 })); c.position.y = 1.2 + i * 0.9; tree.add(c); }
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.6, 8), mat(0x5a3a1a)); trunk.position.y = 0.3; tree.add(trunk);
      const star = text3D('*', { size: 1.0, depth: 0.15, material: glow(0xffd700, 2.5) }); star.position.y = 4.4; tree.add(star);
      for (let k = 0; k < 40; k++) { const h = Math.random() * 3.4, r = (1.6 - h * 0.38) * 0.95, a = Math.random() * 6.28;
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), glow([0xff2020, 0xffd700, 0x2a8bff, 0xffffff][k % 4], 2)); b.position.set(Math.cos(a) * r, 0.9 + h, Math.sin(a) * r); tree.add(b);
        updaters.push(t => { b.material.emissiveIntensity = 1 + Math.sin(t * 3 + k) * 1; }); }
    }
    // guirnalda de luces
    for (let i = 0; i < 60; i++) { const a = Math.PI * 0.15 + i / 59 * Math.PI * 0.7; const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), glow([0xff2020, 0x20ff60, 0xffd700][i % 3], 2));
      b.position.set(cx + Math.cos(a) * radio * 1.2, 7 + Math.sin(i * 0.5) * 0.25, cz - Math.sin(a) * radio * 1.2); g.add(b); }
    const txt = text3D('FELIZ NAVIDAD', { size: 0.7, depth: 0.12, material: glow(0xff3030, 1.6) }); txt.position.set(cx, 9.6, cz - radio); g.add(txt);
  }
  if (tipo === 'nochevieja') {
    const clock = new THREE.Group(); clock.position.set(cx, 9.5, cz - radio); g.add(clock);
    const face = new THREE.Mesh(new THREE.CircleGeometry(1.3, 48), mat(0xfff8e0, { emissive: 0xffeecc, emissiveIntensity: 0.6 })); clock.add(face);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.08, 8, 48), glow(0xffd700, 1.5)); clock.add(rim);
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.0, 0.03), mat(0x111111)); hand.geometry.translate(0, 0.5, 0); hand.position.z = 0.03; clock.add(hand);
    const hand2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.03), mat(0x111111)); hand2.geometry.translate(0, 0.35, 0); hand2.position.z = 0.04; hand2.rotation.z = -0.02; clock.add(hand2);
    updaters.push(t => { hand.rotation.z = -t * 0.5; });
    const y = text3D('FELIZ AÑO NUEVO', { size: 0.6, depth: 0.1, material: glow(0xffd700, 1.8) }); y.position.set(cx, 7.4, cz - radio); g.add(y);
    for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), mat([0xffd700, 0xc0c0c0, 0xff3b6b][i % 3], { metalness: 0.8, roughness: 0.2 })); b.position.set(cx + (Math.random() - 0.5) * radio * 2.2, 8 + Math.random() * 3, cz + (Math.random() - 0.5) * radio); g.add(b); }
  }
  if (tipo === 'famosos') {
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2.4, radio * 1.6), mat(0xb0101a, { roughness: 0.9 })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(cx, 0.36, cz + radio * 0.9); g.add(carpet);
    for (let i = 0; i < 8; i++) { const s = text3D('*', { size: 1.2, depth: 0.1, material: glow(0xffd24a, 2) }); s.position.set(cx + (i % 2 ? 1 : -1) * radio * 0.9, 1 + (i >> 1) * 1.8, cz - radio * 0.7); g.add(s);
      updaters.push(t => { s.rotation.y = t + i; }); }
    const t = text3D('ESPECIAL FAMOSOS', { size: 0.6, depth: 0.1, material: glow(0xffd24a, 1.6) }); t.position.set(cx, 9.4, cz - radio); g.add(t);
  }
  if (tipo === 'aniversario') {
    const num = text3D(anios, { size: 2.6, depth: 0.6, material: mat(0xffd24a, { metalness: 0.9, roughness: 0.2, emissive: 0x664400, emissiveIntensity: 0.6 }) });
    num.position.set(cx, 6.8, cz - radio); g.add(num);
    const t = text3D('ANIVERSARIO', { size: 0.6, depth: 0.1, material: glow(0xffffff, 1.4) }); t.position.set(cx, 6.0, cz - radio + 0.4); g.add(t);
    for (let i = 0; i < 24; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), mat([0xff3b6b, 0x3bd1ff, 0xffd24a, 0x7dff6b][i % 4], { roughness: 0.3 }));
      b.scale.y = 1.2; const x = cx + (Math.random() - 0.5) * radio * 2.4, z = cz + (Math.random() - 0.5) * radio * 1.6; b.position.set(x, 3 + Math.random() * 6, z); g.add(b);
      updaters.push(tt => { b.position.y += Math.sin(tt + i) * 0.003; }); }
  }
  return g;
}
