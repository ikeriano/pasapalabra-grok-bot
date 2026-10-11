// Cabecera 3D (intro) de 'Rueda la letra' (~10 s + fundido al plató). Todo procedural, sin
// rótulos de emisión ni logos de cadena. Si el usuario sube un logo, aparece en lugar del texto.
// Audio: SOLO la música que aporte el usuario; de respaldo, whooshes/golpes/campanita sintetizados.
import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { font } from '../lib/helpers.js';
import { synth } from '../lib/media.js';

export const DURACION = 10.4;
const ABC = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
const TURQ = 0x22e0d0, ROSA = 0xff3fa8, MORADO = 0x8a3ad8, PLATA = 0xdfe4ee;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp01 = x => Math.min(1, Math.max(0, x));
const rnd = (() => { let s = 12345; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

// Momentos de llegada de cada letra del título (para los golpes metálicos)
const TITULO = [['RUEDA', 2.25], ['LA', 0], ['LETRA', -2.25]];
export const LLEGADAS = (() => { const r = []; let k = 0; TITULO.forEach(([w]) => [...w].forEach(() => { r.push(5.35 + k * 0.17 + 0.55); k++; })); return r; })();

function letraTex(ch, { fg = '#ffffff', bg = null, size = 128, silver = false } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.beginPath(); g.arc(size / 2, size / 2, size / 2, 0, 7); g.fill(); }
  g.font = `900 ${size * 0.62}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (silver) { const gr = g.createLinearGradient(0, 0, 0, size); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#9aa3b4'); gr.addColorStop(1, '#f0f4ff'); g.fillStyle = gr; }
  else g.fillStyle = fg;
  g.fillText(ch, size / 2, size / 2 + size * 0.04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function haloTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}
function estrellaGeo(R = 3, r = 1.25, depth = 0.8) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.35, bevelSize: 0.3, bevelSegments: 4 }); g.center(); return g;
}

export function crearCabecera(renderer, { logoUrl = null } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, renderer.domElement.width / renderer.domElement.height, 0.1, 800);
  const pmrem = new THREE.PMREMGenerator(renderer); const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  renderer.toneMappingExposure = 0.9; scene.environment = envRT.texture;
  scene.add(new THREE.HemisphereLight(0xc0d8ff, 0x400a50, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(3, 6, 8); scene.add(key);
  const camL = new THREE.PointLight(0xbfe8ff, 8, 30, 1.6); scene.add(camL);

  // ---- fondo: degradado azul real -> magenta/púrpura ----
  const bg = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uT: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vP; uniform float uT;
      void main(){ float h = vP.y*0.5+0.5 + 0.15*sin(vP.x*3.0+uT*0.4);
        vec3 a = vec3(0.02,0.05,0.38), b = vec3(0.36,0.02,0.38), c = vec3(0.12,0.01,0.22);
        vec3 col = mix(c, mix(a, b, smoothstep(0.25,0.85,h)), smoothstep(0.0,0.4,h));
        gl_FragColor = vec4(col,1.0); }`,
  }));
  scene.add(bg);
  // bokeh
  const hT = haloTex(); const bokeh = new THREE.Group(); scene.add(bokeh);
  for (let i = 0; i < 90; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: hT, color: [0x7fd8ff, 0xff7fd0, 0xffffff, 0xb080ff][i % 4], transparent: true, opacity: 0.04 + rnd() * 0.09, blending: THREE.AdditiveBlending, depthWrite: false }));
    sp.position.set((rnd() - 0.5) * 120, (rnd() - 0.5) * 80, 30 - rnd() * 200); sp.scale.setScalar(3 + rnd() * 12); bokeh.add(sp);
  }
  // pequeñas letras blancas 3D flotando
  const silverMat = new THREE.MeshStandardMaterial({ color: PLATA, metalness: 1, roughness: 0.2, envMapIntensity: 0.8 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.05 });
  const flot = [];
  const geoCache = {};
  const gLetra = (ch, size, depth, bevel = true) => {
    const k = ch + size + depth; if (geoCache[k]) return geoCache[k];
    const g = new TextGeometry(ch, { font, size, depth, curveSegments: 5, bevelEnabled: bevel, bevelThickness: depth * 0.25, bevelSize: size * 0.05, bevelSegments: 3 }); g.center(); return (geoCache[k] = g);
  };
  for (let i = 0; i < 70; i++) {
    const m = new THREE.Mesh(gLetra(ABC[i % 26], 0.6, 0.15), whiteMat);
    m.position.set((rnd() - 0.5) * 50, (rnd() - 0.5) * 30, 20 - rnd() * 160); m.userData.rv = new THREE.Vector3(rnd(), rnd(), rnd()).multiplyScalar(1.5);
    m.userData.p0 = m.position.clone(); scene.add(m); flot.push(m);
  }

  // ===================== FASE 1 (0-4.5 s) =====================
  const f1 = new THREE.Group(); scene.add(f1);
  // bolitas con letras que explotan hacia la cámara
  const ballColors = [TURQ, ROSA, PLATA];
  const balls = [];
  const ballGeo = new THREE.SphereGeometry(0.55, 24, 16);
  for (let i = 0; i < 70; i++) {
    const c = ballColors[i % 3];
    const b = new THREE.Mesh(ballGeo, new THREE.MeshStandardMaterial({ color: c, metalness: c === PLATA ? 1 : 0.2, roughness: 0.2, emissive: c === PLATA ? 0x000000 : c, emissiveIntensity: 0.25 }));
    const lt = new THREE.Sprite(new THREE.SpriteMaterial({ map: letraTex(ABC[i % 27]), transparent: true, depthTest: true }));
    lt.scale.setScalar(0.75); lt.position.z = 0.56; b.add(lt);
    const dir = new THREE.Vector3((rnd() - 0.5) * 1.6, (rnd() - 0.5) * 1.0, 0.6 + rnd() * 0.8).normalize();
    b.userData = { dir, speed: 22 + rnd() * 30, delay: rnd() * 0.25 };
    f1.add(b); balls.push(b);
  }
  // espiral/túnel de letras planas plateadas
  const planas = [];
  for (let i = 0; i < 160; i++) {
    const a = i * 0.42, z = -12 - i * 0.75, r = 5.5 + Math.sin(i * 0.3) * 0.8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshStandardMaterial({ map: letraTex(ABC[i % 27], { silver: true, size: 128 }), transparent: true, metalness: 0.6, roughness: 0.3, side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: 0.15, emissiveMap: null }));
    m.position.set(Math.cos(a) * r, Math.sin(a) * r, z); m.lookAt(0, 0, z + 4); m.userData.a = a; m.userData.r = r;
    f1.add(m); planas.push(m);
  }
  // 'A' grande plateada (aparece a los 2 s)
  const bigA = new THREE.Mesh(gLetra('A', 4.2, 1.2), silverMat); bigA.position.set(2.4, 0.4, -36); f1.add(bigA);
  // discos tipo moneda apilados con letras
  const discoGeo = new THREE.CylinderGeometry(1, 1, 0.28, 40);
  const columnas = [];
  const colDefs = [[-4.5, -40, 9], [4.2, -68, 14], [-3.6, -85, 10], [3.0, -100, 40]];
  colDefs.forEach(([x, z, n], ci) => {
    const col = new THREE.Group(); col.position.set(x, -6, z); f1.add(col); columnas.push(col);
    for (let k = 0; k < n; k++) {
      const c = [TURQ, ROSA, MORADO][(k + ci) % 3];
      const d = new THREE.Mesh(discoGeo, [new THREE.MeshStandardMaterial({ color: c, metalness: 0.5, roughness: 0.25, emissive: c, emissiveIntensity: 0.2 }),
        new THREE.MeshStandardMaterial({ map: letraTex(ABC[(k * 5 + ci) % 27], { bg: '#' + new THREE.Color(c).getHexString() }), metalness: 0.3, roughness: 0.3 }),
        new THREE.MeshStandardMaterial({ color: c })]);
      d.position.y = k * 0.34; d.rotation.y = k * 0.3; d.rotation.x = 0.05 * Math.sin(k); col.add(d);
    }
  });
  // estrella plateada biselada (wipe 4-5 s)
  const star = new THREE.Mesh(estrellaGeo(), new THREE.MeshStandardMaterial({ color: 0xeef2fa, metalness: 1, roughness: 0.15, envMapIntensity: 0.9 }));
  scene.add(star);

  // ===================== FASE 2 (4.5-10.4 s) =====================
  const f2 = new THREE.Group(); f2.position.set(0, 0, -400); scene.add(f2); // lejos: zona propia
  const titulo = [];
  const brillo = new THREE.MeshStandardMaterial({ color: 0xd0d6e4, metalness: 1, roughness: 0.16, envMapIntensity: 0.9 });
  let k = 0;
  TITULO.forEach(([w, y]) => {
    const geos = [...w].map(ch => { const g = new TextGeometry(ch, { font, size: 1.7, depth: 0.7, curveSegments: 6, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.08, bevelSegments: 4 }); g.computeBoundingBox(); return g; });
    const ws = geos.map(g => g.boundingBox.max.x - g.boundingBox.min.x + 0.18); const total = ws.reduce((a, b) => a + b, 0);
    let x = -total / 2;
    geos.forEach((g, i) => {
      g.center(); const m = new THREE.Mesh(g, brillo); const tx = x + ws[i] / 2; x += ws[i];
      m.userData = { target: new THREE.Vector3(tx, y, 0), from: new THREE.Vector3((rnd() - 0.5) * 16, (rnd() - 0.5) * 10, 30 + rnd() * 6), t0: 5.35 + k * 0.17, spin: (rnd() - 0.5) * 6 };
      f2.add(m); titulo.push(m); k++;
    });
  });
  let logoMesh = null;
  if (logoUrl) {
    const tex = new THREE.TextureLoader().load(logoUrl); tex.colorSpace = THREE.SRGBColorSpace;
    logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })); logoMesh.position.z = 0.8; f2.add(logoMesh);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(6.3, 0.12, 16, 160), new THREE.MeshBasicMaterial({ color: 0x5ff8ff, transparent: true, toneMapped: false }));
  ring.position.z = -1.5; f2.add(ring);
  const ringGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: hT, color: 0x40e8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  ringGlow.scale.setScalar(20); ringGlow.position.z = -2; f2.add(ringGlow);
  const ringBalls = ABC.map((ch, i) => {
    const a = Math.PI / 2 - i / ABC.length * Math.PI * 2;
    const c = i % 2 ? ROSA : TURQ;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 14), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.3, roughness: 0.25 }));
    const lt = new THREE.Sprite(new THREE.SpriteMaterial({ map: letraTex(ch), transparent: true })); lt.scale.setScalar(0.62); lt.position.z = 0.43; b.add(lt);
    b.position.set(Math.cos(a) * 6.3, Math.sin(a) * 6.3, -1.3); b.userData.t0 = 6.9 + i * 0.055; f2.add(b); return b;
  });
  // letras translúcidas que salen hacia cámara (9-10 s)
  const ghostMat = new THREE.MeshStandardMaterial({ color: 0xeaf0ff, metalness: 0.9, roughness: 0.15, transparent: true, opacity: 0.45, depthWrite: false });
  const ghosts = Array.from({ length: 40 }, (_, i) => { const m = new THREE.Mesh(gLetra(ABC[(i * 7) % 27], 1.4, 0.4), ghostMat); m.userData = { dir: new THREE.Vector3((rnd() - 0.5) * 1.4, (rnd() - 0.5) * 1.0, 1).normalize(), d: rnd() * 0.4, rv: rnd() * 4 }; f2.add(m); return m; });

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(renderer.domElement.width, renderer.domElement.height), 0.28, 0.35, 0.93));
  composer.addPass(new OutputPass());

  function update(t) {
    bg.material.uniforms.uT.value = t;
    const fase2 = t >= 4.55;
    f1.visible = !fase2; f2.visible = fase2;
    // --- cámara ---
    if (!fase2) {
      let z = 10, y = 0;
      if (t > 1) { const u = t - 1; z = 10 - (u * 22 + u * u * 6); }
      if (t > 3) y = smooth(3, 4.3, t) * 10 + (t - 3) * 1.5;
      camera.position.set(Math.sin(t * 1.3) * 0.4, y, z);
      const look = new THREE.Vector3(Math.sin(t * 0.9) * 0.6, y + (t > 3 ? 1.8 + smooth(3, 4, t) * 2 : 0), z - 10);
      camera.lookAt(look); camera.rotateZ(Math.sin(t * 1.7) * 0.06 + (t > 1 ? (t - 1) * 0.12 : 0));
    } else {
      const u = smooth(4.55, 10.4, t);
      camera.position.set(0.3 * Math.sin(t * 0.7), 0.2, -400 + 17 - u * 5);
      camera.lookAt(0, 0.1, -400); camera.rotation.z = 0;
    }
    camL.position.copy(camera.position);
    bg.position.copy(camera.position);
    // bokeh y letras flotantes siguen la zona de la cámara
    bokeh.position.set(0, 0, fase2 ? -400 : 0);
    flot.forEach((m, i) => { m.rotation.x = t * m.userData.rv.x; m.rotation.y = t * m.userData.rv.y; m.position.copy(m.userData.p0); if (fase2) m.position.z = -400 - 6 - (i % 30) * 2; });
    // --- fase 1 ---
    if (!fase2) {
      balls.forEach(b => { const tt = Math.max(0, t - b.userData.delay); const d = tt * b.userData.speed; b.position.copy(b.userData.dir).multiplyScalar(d); b.position.z += -16; b.visible = t < 1.8; b.rotation.y = tt * 3; const s = smooth(0, 0.25, tt); b.scale.setScalar(Math.max(0.001, s)); });
      planas.forEach((m, i) => { const a = m.userData.a + t * 0.9; m.position.x = Math.cos(a) * m.userData.r; m.position.y = Math.sin(a) * m.userData.r; m.rotation.z += 0.0; m.visible = t > 0.6; });
      bigA.visible = t > 1.6; bigA.rotation.y = -0.6 + t * 0.5; bigA.scale.setScalar(Math.max(0.001, smooth(1.6, 2.1, t)));
      columnas.forEach((c, i) => { c.rotation.y = t * (i % 2 ? 0.8 : -0.8); });
    }
    // estrella: barrido de abajo-izquierda a arriba-derecha tapando la cámara
    const su = clamp01((t - 3.95) / 1.0);
    star.visible = t > 3.9 && t < 5.0;
    if (star.visible) {
      const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
      const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize(); const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
      const off = THREE.MathUtils.lerp(-9, 9, su);
      star.position.copy(camera.position).addScaledVector(fwd, 4.2 - Math.sin(su * Math.PI) * 1.6).addScaledVector(right, off).addScaledVector(up, off * 0.65);
      star.quaternion.copy(camera.quaternion); star.rotateZ(-su * 2.4); star.rotateY(0.35);
      star.scale.setScalar(0.9 + Math.sin(su * Math.PI) * 0.9);
    }
    // --- fase 2 ---
    if (fase2) {
      titulo.forEach(m => {
        const { target, from, t0, spin } = m.userData; const u = clamp01((t - t0) / 0.55); const e = 1 - Math.pow(1 - u, 3);
        m.visible = t > t0 && !logoMesh; m.position.lerpVectors(from, target, e);
        m.rotation.set((1 - e) * spin, (1 - e) * spin * 0.7, 0);
        const bump = u >= 1 ? 1 + Math.exp(-(t - t0 - 0.55) * 9) * 0.12 : 1; m.scale.setScalar(bump);
        if (t > 9.0) { const g = clamp01((t - 9.0) / 0.9); m.position.z = target.z + g * 2; }
      });
      if (logoMesh) { const u = smooth(5.6, 6.4, t); logoMesh.scale.setScalar(Math.max(0.001, u)); }
      const rv = smooth(6.3, 6.9, t); ring.material.opacity = rv; ring.scale.setScalar(0.6 + 0.4 * rv); ringGlow.material.opacity = 0.12 * rv;
      ring.rotation.z = t * 0.1;
      ringBalls.forEach((b, i) => { const u = smooth(b.userData.t0, b.userData.t0 + 0.3, t); b.visible = u > 0; b.scale.setScalar(Math.max(0.001, u * (1 + 0.25 * Math.sin(Math.PI * u)))); });
      ghosts.forEach(g => { const tt = t - 9.0 - g.userData.d; g.visible = tt > 0; if (tt > 0) { g.position.copy(g.userData.dir).multiplyScalar(tt * 28); g.position.z += 1; g.rotation.set(tt * g.userData.rv, tt * 2, 0); } });
    }
  }

  function overlay(t) {
    const flash = Math.max(t < 0.5 ? 1 - t / 0.5 : 0, 0.7 * Math.exp(-Math.pow((t - 4.55) / 0.12, 2)), 0.5 * Math.exp(-Math.pow((t - 9.9) / 0.2, 2)));
    const streak = 0; // destello central (no horizontal)
    const fade = smooth(9.9, 10.35, t);
    return { streak, flash, fade };
  }

  return {
    scene, camera, update, overlay,
    render(t) { update(t); composer.render(); },
    resize(w, h) { camera.aspect = w / h; camera.updateProjectionMatrix(); composer.setSize(w, h); },
    dispose() { renderer.toneMappingExposure = 1; scene.traverse(o => { if (o.geometry) o.geometry.dispose(); }); envRT.dispose(); pmrem.dispose(); composer.dispose?.(); },
  };
}

/** Audio de RESPALDO (si el usuario no aporta música): solo efectos sintetizados,
 *  sin melodía: whooshes, golpes metálicos por letra, campanita a los 8 s y aplausos. */
export function programarAudioRespaldo(c, dest, t0) {
  const m = c.createGain(); m.gain.value = 0.85; m.connect(dest);
  const golpe = (t, vol = 0.18) => { [523, 1187, 1810, 2650].forEach((f, i) => synth.tone(c, m, t, f * (1 + rnd() * 0.01), 0.5 - i * 0.08, i ? 'sine' : 'triangle', vol / (i + 1))); synth.kick(c, m, t, 0.15); };
  synth.whoosh(c, m, t0 + 0.0, 0.9, 0, 0, 0.55);              // explosión inicial
  synth.kick(c, m, t0 + 0.05, 0.5);
  [1.1, 1.8, 2.5, 3.1].forEach((tt, i) => synth.whoosh(c, m, t0 + tt, 0.7, i % 2 ? 0.8 : -0.8, i % 2 ? -0.8 : 0.8, 0.3)); // túnel / 'A' / discos
  synth.whoosh(c, m, t0 + 3.9, 1.0, -1, 1, 0.55);              // estrella (abajo-izq. -> arriba-dcha.)
  LLEGADAS.forEach(tt => golpe(t0 + tt));                      // golpe metálico por letra
  [1568, 2093, 3136].forEach((f, i) => synth.tone(c, m, t0 + 8.0 + i * 0.02, f, 1.8, 'sine', 0.12 / (i + 1))); // campanita
  synth.whoosh(c, m, t0 + 8.9, 1.2, 0, 0, 0.5);                // salida hacia cámara
  synth.applause(c, m, t0 + 9.7, 3.5, 0.45);                   // aplausos al fundir al plató
}
