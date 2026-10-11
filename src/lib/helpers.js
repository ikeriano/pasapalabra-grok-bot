import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import fontJson from '../fonts/helvetiker_bold.typeface.json';

export const font = new FontLoader().parse(fontJson);

// Letras del rosco español (25 letras: sin K ni W)
export const ROSCO_LETRAS = 'ABCDEFGHIJLMNÑOPQRSTUVXYZ'.split('');

export function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.1, ...opts });
}
export function glow(color, intensity = 1.5, opts = {}) {
  return new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: intensity, roughness: 0.6, ...opts });
}

/** Texto 3D extruido y centrado */
export function text3D(str, { size = 1, depth = 0.2, bevel = true, material, curveSegments = 6 } = {}) {
  const geo = new TextGeometry(str, {
    font, size, depth, curveSegments,
    bevelEnabled: bevel, bevelThickness: depth * 0.15, bevelSize: size * 0.02, bevelSegments: 2,
  });
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  geo.translate(-(bb.max.x + bb.min.x) / 2, -bb.min.y, -(bb.max.z + bb.min.z) / 2);
  return new THREE.Mesh(geo, material || mat(0xffffff));
}

/** Textura canvas con una letra (para las bombillas del rosco) */
const letterTexCache = {};
export function letterTexture(ch) {
  if (letterTexCache[ch]) return letterTexCache[ch];
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.font = 'bold 92px Arial, Helvetica, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(ch, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (letterTexCache[ch] = t);
}

/** Pared azul con estrellas y letras tenues */
export function starWallTexture(w = 2048, h = 1024, seed = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, '#06104a'); grd.addColorStop(0.6, '#0c2a9a'); grd.addColorStop(1, '#1b46c9');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  let s = seed * 9301;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  g.font = 'bold 90px Arial'; g.fillStyle = 'rgba(120,170,255,0.10)';
  for (let i = 0; i < 40; i++) g.fillText(ROSCO_LETRAS[Math.floor(rnd() * 25)], rnd() * w, rnd() * h);
  for (let i = 0; i < 500; i++) {
    const x = rnd() * w, y = rnd() * h * 0.85, r = rnd() * 2.2 + 0.4;
    g.fillStyle = `rgba(255,255,255,${0.4 + rnd() * 0.6})`;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  // estrellas de 4 puntas grandes
  for (let i = 0; i < 25; i++) {
    const x = rnd() * w, y = rnd() * h * 0.7, r = 6 + rnd() * 14;
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r * 0.2, y - r * 0.2); g.lineTo(x + r, y); g.lineTo(x + r * 0.2, y + r * 0.2);
    g.lineTo(x, y + r); g.lineTo(x - r * 0.2, y + r * 0.2); g.lineTo(x - r, y); g.lineTo(x - r * 0.2, y - r * 0.2); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Figura estilizada sin rostro (maniquí) */
export function figure({ body = 0x3355aa, legs = 0x222233, skin = 0xc8a07a, hair = 0x2a1a10, seated = false, scale = 1 } = {}) {
  const g = new THREE.Group();
  const mB = mat(body, { roughness: 0.7 }), mL = mat(legs, { roughness: 0.8 }), mS = mat(skin, { roughness: 0.8 }), mH = mat(hair, { roughness: 0.9 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.45, 4, 12), mB);
  torso.scale.set(1.05, 1, 0.7);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), mS);
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.138, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), mH);
  hairM.rotation.x = -0.35;
  const armGeo = new THREE.CapsuleGeometry(0.06, 0.45, 3, 8);
  const armL = new THREE.Mesh(armGeo, mB), armR = new THREE.Mesh(armGeo, mB);
  const legGeo = new THREE.CapsuleGeometry(0.08, 0.6, 3, 8);
  const legL = new THREE.Mesh(legGeo, mL), legR = new THREE.Mesh(legGeo, mL);
  if (!seated) {
    legL.position.set(-0.1, 0.4, 0); legR.position.set(0.1, 0.4, 0);
    torso.position.y = 1.05; head.position.y = 1.5; hairM.position.y = 1.52;
    armL.position.set(-0.28, 1.05, 0); armR.position.set(0.28, 1.05, 0);
    armL.rotation.z = 0.12; armR.rotation.z = -0.12;
  } else {
    legL.position.set(-0.1, 0.05, 0.25); legR.position.set(0.1, 0.05, 0.25);
    legL.rotation.x = legR.rotation.x = Math.PI / 2;
    torso.position.y = 0.4; head.position.y = 0.86; hairM.position.y = 0.88;
    armL.position.set(-0.28, 0.42, 0.15); armR.position.set(0.28, 0.42, 0.15);
    armL.rotation.x = armR.rotation.x = -0.9;
  }
  g.add(torso, head, hairM, armL, armR, legL, legR);
  g.scale.setScalar(scale);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  return g;
}
