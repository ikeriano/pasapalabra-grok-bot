// Cabecera 3D (intro) estilo etapa Telecinco: enjambre/túnel de letras, anillos,
// cometa, "átomo", globo de letras y choque final del texto 'Pasa' + 'palabra'.
// Duración ~15 s. Todo procedural (sin logos de cadenas).
import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { font } from '../lib/helpers.js';
import { synth } from '../lib/media.js';

export const DURACION = 15.6;
const GLYPHS = 'PASALBRCDEFGHIJMNOQTUVXYZ'.split('');
const PER_GLYPH = 24;
const COLORS = [0xff7a00, 0xf6f6f6, 0x0b1d5c];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp01 = x => Math.min(1, Math.max(0, x));

// ---- trayectoria de la cámara (distancia recorrida integrando la velocidad) ----
function dist(t) {
  if (t <= 1) return 70 * t;
  if (t <= 6) return 70 + 45 * (t - 1);
  if (t <= 7) return 295 + 25 * (t - 6);
  if (t <= 10) { const u = t - 7; return 320 + 25 * u - 25 * u * u / 6; }
  return 357.5;
}
const camZ = t => 10 - dist(t);
const G = new THREE.Vector3(0, 0, camZ(10) - 16); // centro del globo final
const ATOM_Z = camZ(8.5);

function haloTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function crearCabecera(renderer, { logoUrl = null } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020b30);
  scene.fog = new THREE.FogExp2(0x041548, 0.013);
  const camera = new THREE.PerspectiveCamera(62, renderer.domElement.width / renderer.domElement.height, 0.1, 600);

  scene.add(new THREE.HemisphereLight(0xbfe0ff, 0x081040, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 8, 6); scene.add(key, key.target);
  const camLightC = new THREE.PointLight(0x7fe8ff, 14, 30, 1.8); scene.add(camLightC);
  const camLightO = new THREE.PointLight(0xffa040, 10, 25, 1.8); scene.add(camLightO);

  // ---- halos volumétricos de fondo ----
  const hTex = haloTexture();
  const halos = new THREE.Group(); scene.add(halos);
  for (let i = 0; i < 70; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: hTex, color: i % 3 ? 0x9fe9ff : 0xffffff, transparent: true, opacity: 0.06 + Math.random() * 0.12, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 50;
    s.position.set(Math.cos(a) * r, Math.sin(a) * r, 20 - Math.random() * 420);
    s.scale.setScalar(20 + Math.random() * 45); halos.add(s);
  }

  // ---- enjambre de letras (InstancedMesh por glifo) ----
  const letterMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.22, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08 });
  const letters = []; const meshes = [];
  const globeIdx = [];
  GLYPHS.forEach((ch, gi) => {
    const geo = new TextGeometry(ch, { font, size: 1, depth: 0.42, curveSegments: 4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.06, bevelSegments: 3 });
    geo.center();
    const im = new THREE.InstancedMesh(geo, letterMat, PER_GLYPH);
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false;
    for (let i = 0; i < PER_GLYPH; i++) {
      const n = gi * PER_GLYPH + i;
      im.setColorAt(i, new THREE.Color(COLORS[n % 3]));
      // reparto: túnel (0-6 s), claro vacío (6-7 s), segundo enjambre (7-10 s)
      const second = Math.random() < 0.36;
      const z = second ? -312 - Math.random() * 36 : -20 - Math.random() * 262;
      const minR = second ? 2.8 : 3.4;
      const L = {
        mesh: im, i, z, r: minR + Math.pow(Math.random(), 0.7) * 11, a: Math.random() * Math.PI * 2,
        dir: Math.random() < 0.5 ? 1 : -1, scale: 0.7 + Math.random() * 0.9,
        axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        spin: 0.8 + Math.random() * 2.5, q0: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6)),
        globe: second || z < -205,
      };
      letters.push(L); if (L.globe) globeIdx.push(letters.length - 1);
    }
    meshes.push(im); scene.add(im);
  });
  // posiciones del globo hueco (esfera de Fibonacci)
  const N = globeIdx.length, R = 5.2;
  globeIdx.forEach((li, k) => {
    const y = 1 - (k + 0.5) / N * 2, rr = Math.sqrt(1 - y * y), th = k * Math.PI * (3 - Math.sqrt(5));
    letters[li].sphereDir = new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr);
  });

  // ---- anillos que pasan (naranja/amarillo y luego blanco/cian) ----
  const rings = [];
  [[1.5, 0xff8a00], [2.0, 0xffc21a], [2.5, 0xff8a00], [3.0, 0xffd84a], [3.6, 0xffffff], [4.3, 0x7fe8ff], [4.9, 0xffffff], [5.5, 0x7fe8ff]].forEach(([tt, c], i) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.14, 12, 96), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.z = camZ(tt) - 2; m.rotation.set((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, 0);
    m.userData.tilt = (i % 2 ? 1 : -1) * 0.4; rings.push(m); scene.add(m);
  });

  // ---- cometa con estela ----
  const comet = new THREE.Group(); scene.add(comet);
  const cometHead = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const cometGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: hTex, color: 0xcff6ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  cometGlow.scale.setScalar(5); cometHead.add(cometGlow); comet.add(cometHead);
  const trail = [];
  for (let i = 0; i < 26; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: hTex, color: 0xbfefff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 * (1 - i / 26) }));
    s.scale.setScalar(2.4 * (1 - i / 30)); trail.push(s); comet.add(s);
  }
  const cometPos = (t, out) => {
    const u = clamp01((t - 3.6) / 1.2);
    const cz = camZ(t);
    return out.set(-11 + 22 * u, -7 + 14 * u + Math.sin(u * Math.PI) * 1.5, cz - 20 - 3 * u);
  };

  // ---- "átomo": dos anillos blancos orbitando cruzados ----
  const atom = new THREE.Group(); atom.position.set(0, 0, ATOM_Z); scene.add(atom);
  const atomMat = new THREE.MeshBasicMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.09, 12, 128), atomMat);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.09, 12, 128), atomMat);
  atom.add(ring1, ring2);
  const atomCore = new THREE.Sprite(new THREE.SpriteMaterial({ map: hTex, color: 0xdff8ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.7 }));
  atomCore.scale.setScalar(3); atom.add(atomCore);

  // ---- texto final 'Pasa' + 'palabra' (o logo subido por el usuario) ----
  const textMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.18, clearcoat: 1, emissive: 0x000000, emissiveIntensity: 0 });
  const mkWord = (w) => {
    const g = new TextGeometry(w, { font, size: 1.35, depth: 0.5, curveSegments: 8, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.05, bevelSegments: 4 });
    g.computeBoundingBox(); const bb = g.boundingBox; g.translate(-bb.min.x, -(bb.max.y + bb.min.y) / 2, -bb.max.z / 2);
    return { mesh: new THREE.Mesh(g, textMat), w: bb.max.x - bb.min.x };
  };
  const wA = mkWord('Pasa'), wB = mkWord('palabra');
  const totalW = wA.w + wB.w + 0.06;
  const xA = -totalW / 2, xB = -totalW / 2 + wA.w + 0.06;
  const textZ = G.z + 7.2;
  wA.mesh.position.set(-40, 0, textZ); wB.mesh.position.set(40, 0, textZ);
  scene.add(wA.mesh, wB.mesh);
  // sombra suave proyectada sobre el globo
  const shadowTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
    const r = g.createRadialGradient(128, 32, 4, 128, 32, 120); r.addColorStop(0, 'rgba(0,0,20,0.85)'); r.addColorStop(1, 'rgba(0,0,20,0)');
    g.fillStyle = r; g.fillRect(0, 0, 256, 64); return new THREE.CanvasTexture(c); })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(totalW * 1.25, 2.6), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0 }));
  shadow.position.set(0.4, -0.5, G.z + 5.4); scene.add(shadow);

  let logo = null;
  if (logoUrl) {
    const tex = new THREE.TextureLoader().load(logoUrl, (t) => {
      const asp = t.image.width / t.image.height; logo.scale.set(asp, 1, 1);
    });
    tex.colorSpace = THREE.SRGBColorSpace;
    logo = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
    logo.position.set(0, 0, textZ); logo.visible = false;
    const holder = new THREE.Group(); holder.add(logo); scene.add(holder);
    wA.mesh.visible = wB.mesh.visible = false;
  }

  // ---- postproceso ----
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(renderer.domElement.width, renderer.domElement.height), 0.45, 0.4, 0.88);
  composer.addPass(bloom); composer.addPass(new OutputPass());

  const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), qs = new THREE.Quaternion(), sc = new THREE.Vector3(), tmp = new THREE.Vector3();
  const look = new THREE.Vector3(), lookM = new THREE.Matrix4(), up = new THREE.Vector3(0, 1, 0);
  const hist = [];

  function update(t) {
    // ---- cámara ----
    const cz = camZ(t);
    const tilt = smooth(5.8, 6.4, t) * (1 - smooth(6.8, 7.4, t)) * 0.42; // inclinación hacia arriba en el claro
    const roll = (smooth(1, 1.6, t) * (1 - smooth(5.6, 6.2, t))) * 0.16 * Math.sin(t * 1.4) + (t > 7 && t < 10 ? 0.06 * Math.sin(t * 2) : 0);
    if (t < 10) {
      camera.position.set(Math.sin(t * 0.9) * 0.6 * (t > 1 ? 1 : 0), Math.cos(t * 0.7) * 0.4 * (t > 1 ? 1 : 0), cz);
      look.set(camera.position.x * 0.3, Math.tan(tilt) * 10, cz - 10);
    } else {
      const u = smooth(10, 12, t);
      camera.position.set(0, 0.6 * u, cz + 0.0);
      look.set(0, 0, cz - 10).lerp(G, u);
    }
    // sacudida al chocar el texto
    const shake = t > 13.2 && t < 13.8 ? (1 - (t - 13.2) / 0.6) * 0.12 : 0;
    camera.position.x += Math.sin(t * 90) * shake; camera.position.y += Math.cos(t * 77) * shake;
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(look);
    camLightC.position.copy(camera.position).add(tmp.set(-3, 2, -4));
    camLightO.position.copy(camera.position).add(tmp.set(3, -2, -6));

    // ---- letras ----
    const s = smooth(10, 12.2, t);          // espiral hacia el globo
    const globeRot = new THREE.Quaternion().setFromAxisAngle(up, t * 0.45);
    for (const L of letters) {
      const ang = L.a + L.dir * t * 0.55;  // vórtice
      p.set(Math.cos(ang) * L.r, Math.sin(ang) * L.r, L.z);
      q.setFromAxisAngle(L.axis, t * L.spin).multiply(L.q0);
      sc.setScalar(L.scale);
      if (L.globe && s > 0) {
        const target = tmp.copy(L.sphereDir).applyQuaternion(globeRot).multiplyScalar(R).add(G);
        const e = s;
        const off = p.sub(G).lerp(target.clone().sub(G), e);
        off.applyAxisAngle(new THREE.Vector3(0, 0, 1), (1 - e) * 3.2); // giro en espiral
        p.copy(off).add(G);
        lookM.lookAt(target.clone().sub(G).normalize().add(p), p, up);
        qs.setFromRotationMatrix(lookM);
        q.slerp(qs, e);
        sc.setScalar(THREE.MathUtils.lerp(L.scale, 0.85, e));
      } else if (!L.globe && t > 10) {
        sc.multiplyScalar(1 - smooth(10, 11.5, t)); // las que quedan atrás desaparecen
      }
      const dz = camera.position.z - p.z; if (t < 10.5 && dz < 1.5 && dz > -3) sc.multiplyScalar(Math.max(0, (dz + 3) / 4.5)); // evita letras pegadas a la lente
      m4.compose(p, q, sc); L.mesh.setMatrixAt(L.i, m4);
    }
    meshes.forEach(m => { m.instanceMatrix.needsUpdate = true; });

    // ---- anillos ----
    rings.forEach((r, i) => { r.rotation.z = t * 0.8 * (i % 2 ? 1 : -1); r.rotation.x = r.userData.tilt * Math.sin(t); r.material.opacity = 0.55 * (1 - smooth(5.6, 6.2, t)); });

    // ---- cometa ----
    comet.visible = t > 3.5 && t < 5.2;
    if (comet.visible) {
      cometPos(t, cometHead.position);
      trail.forEach((tr, i) => cometPos(t - (i + 1) * 0.022, tr.position));
    }

    // ---- átomo ----
    atom.visible = t > 6.6 && t < 10.6;
    atomMat.opacity = 0.9 * smooth(6.6, 7.4, t) * (1 - smooth(9.9, 10.5, t));
    ring1.rotation.set(t * 1.6, t * 0.9, 0.5); ring2.rotation.set(-t * 1.3, 0.8 + t * 1.1, -0.5);
    atomCore.material.opacity = 0.35 * atomMat.opacity;

    // ---- texto / logo ----
    const hit = 13.2;
    if (!logo) {
      const u = clamp01((t - 12.1) / (hit - 12.1));
      const ease = u * u * u;
      const recoil = t > hit ? Math.exp(-(t - hit) * 7) * Math.sin((t - hit) * 30) * 0.35 : 0;
      wA.mesh.position.x = THREE.MathUtils.lerp(-34, xA, ease) - recoil;
      wB.mesh.position.x = THREE.MathUtils.lerp(34, xB, ease) + recoil;
      wA.mesh.rotation.y = (1 - ease) * 0.9; wB.mesh.rotation.y = -(1 - ease) * 0.9;
      wA.mesh.visible = wB.mesh.visible = t > 12;
      shadow.material.opacity = 0.75 * smooth(12.6, hit, t);
    } else {
      logo.visible = t > 12.6;
      const u = clamp01((t - 12.6) / 0.6);
      const k = u < 1 ? u * u * (1 + 1.7 * (1 - u)) : 1 + Math.exp(-(t - hit) * 6) * Math.sin((t - hit) * 25) * 0.08;
      logo.parent.scale.setScalar(Math.max(0.001, k));
      shadow.material.opacity = 0.6 * smooth(12.8, hit, t);
    }
  }

  /** Capas 2D de destellos/fundidos (0..1) */
  function overlay(t) {
    const streak = t < 1.1 ? Math.exp(-Math.pow((t - 0.15) / 0.25, 2)) : 0;
    const flash = Math.max(
      t < 0.4 ? 1 - t / 0.4 : 0,
      Math.exp(-Math.pow((t - 10.05) / 0.18, 2)),
      0.55 * Math.exp(-Math.pow((t - 13.22) / 0.08, 2)),
      0.35 * Math.exp(-Math.pow((t - 6.5) / 0.4, 2)), // brillo difuso del claro
    );
    const fade = smooth(14.7, 15.3, t);
    return { streak, flash, fade };
  }

  return {
    scene, camera, update, overlay,
    render(t) { update(t); composer.render(); },
    resize(w, h) { camera.aspect = w / h; camera.updateProjectionMatrix(); composer.setSize(w, h); },
    dispose() {
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      composer.dispose?.();
    },
  };
}

/** Banda sonora de RESPALDO (solo si el usuario no aporta audio): pulso
 *  electrónico genérico a 135 BPM, whooshes panoramizados, acorde final y aplausos.
 *  Funciona con AudioContext u OfflineAudioContext (para exportar el MP4). */
export function programarAudioRespaldo(c, dest, t0) {
  const master = c.createGain(); master.gain.value = 0.8; master.connect(dest);
  const beat = 60 / 135;
  for (let b = 0; b * beat < 13.0; b++) {
    const t = t0 + 0.9 + b * beat;
    if (t - t0 > 9.8 && t - t0 < 10.6) continue;
    synth.kick(c, master, t, 0.45);
    synth.hat(c, master, t + beat / 2, 0.05);
  }
  // pulso de bajo
  for (let b = 0; b * beat < 13.0; b++) {
    const t = t0 + 0.9 + b * beat + beat / 2;
    synth.tone(c, master, t, b % 8 < 4 ? 55 : 49, beat * 0.45, 'sawtooth', 0.05);
  }
  synth.whoosh(c, master, t0 + 0.0, 1.0, 0, 0, 0.5);              // arranque
  [1.5, 2.0, 2.5, 3.0, 3.6, 4.3, 4.9, 5.5].forEach((tt, i) =>    // anillos
    synth.whoosh(c, master, t0 + tt - 0.35, 0.6, i % 2 ? 0.8 : -0.8, i % 2 ? -0.8 : 0.8, 0.28));
  synth.whoosh(c, master, t0 + 3.6, 1.2, -1, 1, 0.45);             // cometa (izq.→dcha.)
  synth.whoosh(c, master, t0 + 8.0, 1.0, 0.6, -0.6, 0.35);         // átomo
  synth.whoosh(c, master, t0 + 9.9, 2.2, -1, 1, 0.5);              // espiral
  synth.whoosh(c, master, t0 + 12.3, 0.9, -1, 0, 0.35);            // 'Pasa'
  synth.whoosh(c, master, t0 + 12.3, 0.9, 1, 0, 0.35);             // 'palabra'
  synth.kick(c, master, t0 + 13.2, 0.9);
  synth.chord(c, master, t0 + 13.2, [130.8, 196, 261.6, 329.6, 392], 2.6, 0.06); // acorde de impacto
  synth.applause(c, master, t0 + 13.6, 3.2, 0.45);
}
