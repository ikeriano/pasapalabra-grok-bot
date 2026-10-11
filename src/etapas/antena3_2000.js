// Etapa 1: Antena 3 (2000-2006). Plató recreado con geometría procedural.
import * as THREE from 'three';
import { mat, glow, text3D, letterTexture, starWallTexture, figure, ROSCO_LETRAS } from '../lib/helpers.js';
import { salida } from '../lib/kit.js';
import { addEspecial } from '../lib/especiales.js';

export const info = {
  id: 'antena3-2000',
  nombre: 'Antena 3',
  anios: '2000-2006',
  disponible: true,
};

export const cameras = {
  general: { label: '🎥 Plano general', pos: [0, 6.8, 21], target: [0, 3.2, -4], mode: null },
  atril:   { label: '🔴🔵 Atril / Rosco', pos: [0, 2.4, 7.2], target: [0, 1.9, -3], mode: 'rosco' },
  mesa:    { label: '🪑 Mesa', pos: [0.5, 3.4, 8.5], target: [0, 2.2, -4], mode: 'pruebas' },
  salida:  { label: '🚪 Salida', pos: [-7, 2.6, 8], target: [-16, 2.2, 8], mode: null },
  publico: { label: '👏 Público', pos: [6, 3.6, 6], target: [-15, 3.0, 5], mode: null },
};

const C = {
  azulOscuro: 0x081a5c, azul: 0x1746d6, azulClaro: 0x3fa0ff, naranja: 0xff7a00, amarillo: 0xffc21a,
  rojo: 0xe0141e, blanco: 0xffffff, verde: 0x18b37a, marron: 0x8a5a2b,
};

export function build(scene, ctx) {
  const root = new THREE.Group(); root.name = 'plato-antena3-2000';
  scene.add(root);
  const updaters = [];

  scene.background = new THREE.Color(0x02030a);
  scene.fog = new THREE.Fog(0x02030a, 35, 80);

  // ---------- LUCES ----------
  root.add(new THREE.HemisphereLight(0x6f8cff, 0x101020, 0.55));
  root.add(new THREE.AmbientLight(0x404060, 0.35));
  const key = new THREE.SpotLight(0xfff2e0, 120, 40, Math.PI / 7, 0.5, 1.4);
  key.position.set(0, 14, 10); key.target.position.set(0, 1, -2);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0005;
  root.add(key, key.target);
  const addPoint = (c, i, x, y, z, d = 18) => { const l = new THREE.PointLight(c, i, d, 1.6); l.position.set(x, y, z); root.add(l); return l; };
  addPoint(0x2a6bff, 60, 0, 6, -8, 20);
  addPoint(0xff7a10, 45, -9, 4, -6);
  addPoint(0xff7a10, 45, 9, 4, -6);
  addPoint(0x4a7dff, 35, -14, 6, 4, 22);
  addPoint(0x4a7dff, 35, 14, 6, 4, 22);
  addPoint(0xffffff, 8, 0, 4, 6, 14);

  // ---------- SUELO Y PLATAFORMAS ----------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), mat(0x0a1440, { roughness: 0.22, metalness: 0.4 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; root.add(floor);

  // Plataforma circular central (escenario)
  const plat = new THREE.Group(); plat.position.set(0, 0, -2.5); root.add(plat);
  const platTop = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.6, 0.32, 96), [mat(0xeef2ff, { roughness: 0.3 }), mat(0x10257a, { roughness: 0.25, metalness: 0.35 }), mat(0x10257a)]);
  platTop.position.y = 0.16; platTop.receiveShadow = true; plat.add(platTop);
  const underGlow = new THREE.Mesh(new THREE.TorusGeometry(7.62, 0.04, 8, 160), glow(C.naranja, 2));
  underGlow.rotation.x = Math.PI / 2; underGlow.position.y = 0.03; plat.add(underGlow);
  const topRing = new THREE.Mesh(new THREE.TorusGeometry(7.45, 0.035, 8, 160), glow(0xffffff, 2));
  topRing.rotation.x = Math.PI / 2; topRing.position.y = 0.33; plat.add(topRing);
  // anillos decorativos en el suelo de la plataforma
  for (let i = 0; i < 4; i++) {
    const r = new THREE.Mesh(new THREE.RingGeometry(2 + i * 1.3, 2.05 + i * 1.3, 96), glow(i % 2 ? C.azulClaro : 0x6fd0ff, 0.9, { side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
    r.rotation.x = -Math.PI / 2; r.position.y = 0.325; plat.add(r);
  }
  // Escalón trasero blanco curvo (base de la pantalla)
  const bs = new THREE.Shape();
  const a0 = Math.PI * 0.22, a1 = Math.PI * 0.78; // arco detrás de la plataforma
  bs.absarc(0, 0, 10, a0, a1, false); bs.absarc(0, 0, 8.4, a1, a0, true); bs.closePath();
  const backStep = new THREE.Mesh(new THREE.ExtrudeGeometry(bs, { depth: 0.55, bevelEnabled: false, curveSegments: 64 }), [mat(0xf4f6ff, { roughness: 0.3 }), mat(0xdfe6ff, { roughness: 0.3 })]);
  backStep.rotation.x = -Math.PI / 2; backStep.position.set(0, 0, 0.5); backStep.receiveShadow = true; root.add(backStep);
  const backStepGlow = new THREE.Mesh(new THREE.TorusGeometry(8.4, 0.035, 6, 120, a1 - a0), glow(C.naranja, 2));
  backStepGlow.rotation.set(-Math.PI / 2, 0, a0); backStepGlow.position.set(0, 0.05, 0.5); root.add(backStepGlow);

  // ---------- PARED DE FONDO ----------
  const wallTex = starWallTexture(2048, 1024, 3);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 16, 96, 1, true, Math.PI * 0.62, Math.PI * 0.76), new THREE.MeshStandardMaterial({ map: wallTex, emissive: 0xffffff, emissiveMap: wallTex, emissiveIntensity: 0.35, side: THREE.BackSide, roughness: 0.8 }));
  wall.position.set(0, 8, 11); root.add(wall);

  // ---------- PANTALLA CENTRAL ----------
  const scr = new THREE.Group(); scr.position.set(0, 0, -10.6); root.add(scr);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(9.4, 5.6, 0.5), mat(0x9fb3d8, { metalness: 0.7, roughness: 0.25 }));
  frame.position.y = 4.3; scr.add(frame);
  const frameInner = new THREE.Mesh(new THREE.BoxGeometry(8.9, 5.1, 0.1), mat(0x1a2c66, { metalness: 0.5 }));
  frameInner.position.set(0, 4.3, 0.26); scr.add(frameInner);
  const screenCanvas = document.createElement('canvas'); screenCanvas.width = 1024; screenCanvas.height = 576;
  const screenTex = new THREE.CanvasTexture(screenCanvas); screenTex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 4.84), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  screen.position.set(0, 4.3, 0.32); scr.add(screen);
  const screenGlow = new THREE.PointLight(0x3a7bff, 30, 12, 1.5); screenGlow.position.set(0, 4.3, 2); scr.add(screenGlow);
  // patas/peana de la pantalla
  const scrBase = new THREE.Mesh(new THREE.BoxGeometry(9.4, 1.5, 0.8), mat(0x0e1f6b, { metalness: 0.4, roughness: 0.3 }));
  scrBase.position.y = 0.75; scr.add(scrBase);
  const scrBaseGlow = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.06, 0.05), glow(C.azulClaro, 3));
  scrBaseGlow.position.set(0, 1.4, 0.42); scr.add(scrBaseGlow);

  // Cartel 'PASAPALABRA' luminoso
  const sign = new THREE.Group(); sign.position.set(0, 7.9, 0.1); scr.add(sign);
  const signBox = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.5, 0.5), mat(0x0a1650, { roughness: 0.4, metalness: 0.4 }));
  sign.add(signBox);
  const signEdge = new THREE.Mesh(new THREE.BoxGeometry(8.35, 1.62, 0.4), glow(0x7fb6ff, 1.2));
  signEdge.position.z = -0.08; sign.add(signEdge);
  const signText = text3D('PASAPALABRA', { size: 0.95, depth: 0.18, material: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.0, roughness: 0.3 }) });
  signText.position.set(0, -0.48, 0.3); sign.add(signText);
  // rayos de luz sobre el cartel
  const rays = new THREE.Group(); sign.add(rays);
  const rayMat = glow(0xffffff, 1.4);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const len = 0.7 + (i % 2) * 0.6 + Math.random() * 0.3;
      const ray = new THREE.Mesh(new THREE.BoxGeometry(0.07, len, 0.05), rayMat);
      const ang = side * (0.15 + i * 0.22);
      const px = side * 3.8, py = 0.55;
      ray.position.set(px + Math.sin(-ang) * -(0.5 + len / 2) * side * side, py + Math.cos(ang) * (0.5 + len / 2), 0.1);
      ray.position.x = px - Math.sin(ang) * (0.6 + len / 2);
      ray.rotation.z = ang;
      ray.userData.phase = Math.random() * 6;
      rays.add(ray);
    }
  }
  updaters.push(t => rays.children.forEach(r => { r.scale.y = 0.75 + 0.25 * Math.sin(t * 4 + r.userData.phase); }));

  // Paneles naranjas a los lados de la pantalla con letras 'e' luminosas
  for (const side of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.8, 7.5, 0.4), mat(C.naranja, { emissive: 0xff5a00, emissiveIntensity: 0.35 }));
    p.position.set(side * 5.7, 3.75, 0); scr.add(p);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 7.5, 0.42), glow(C.amarillo, 1.6));
    stripe.position.set(side * 5.7 - side * 0.8, 3.75, 0); scr.add(stripe);
    for (let i = 0; i < 6; i++) {
      const e = text3D(i % 3 === 2 ? 'c' : 'e', { size: 0.42, depth: 0.05, bevel: false, material: glow(0xfff0a0, 2.2) });
      e.position.set(side * 5.7 + (i % 2 ? 0.35 : -0.35), 1.2 + i * 1.05, 0.22);
      scr.add(e);
    }
  }
  // Triángulos de contorno blancos flotando sobre la pared azul
  const triMat = glow(0xffffff, 1.8, { side: THREE.DoubleSide });
  const triPos = [[-7.4, 6.5], [-7.0, 3.5], [-6.5, 8.6], [7.2, 6.9], [7.6, 4.1], [6.6, 9], [-8.4, 5.2], [8.5, 2.8]];
  triPos.forEach(([x, y], i) => {
    const tri = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.29, 3), triMat);
    tri.position.set(x, y, -10.2); tri.rotation.z = i * 0.7; tri.userData.s = 0.3 + Math.random() * 0.5;
    root.add(tri);
    updaters.push(t => { tri.rotation.z += 0.004 * tri.userData.s; tri.position.y = y + Math.sin(t * tri.userData.s + i) * 0.08; });
  });

  // ---------- COLUMNA CON 'A' GIGANTE (izquierda) ----------
  const colA = new THREE.Group(); colA.position.set(-8.6, 0, -9.2); colA.rotation.y = 0.35; root.add(colA);
  const colBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 9, 0.9), mat(0x1c5cff, { emissive: 0x0a2a99, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.2 }));
  colBody.position.y = 4.5; colA.add(colBody);
  const colTop = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.4, 32, 1, false, 0, Math.PI), mat(0x2b74ff));
  colTop.rotation.set(Math.PI / 2, 0, Math.PI / 2); colTop.position.set(0, 9, 0); colA.add(colTop);
  const bigA = text3D('A', { size: 5.2, depth: 0.5, material: new THREE.MeshStandardMaterial({ color: 0x4fb4ff, emissive: 0x2c8cff, emissiveIntensity: 1.1, transparent: true, opacity: 0.92, roughness: 0.15, metalness: 0.3 }) });
  bigA.position.set(0, 1.1, 0.6); colA.add(bigA);
  const aOutline = text3D('A', { size: 5.35, depth: 0.08, bevel: false, material: glow(0xbfe6ff, 1.4) });
  aOutline.position.set(0, 1.0, 0.45); colA.add(aOutline);

  // Pared curva verde-azul con arco de letras PASAPALABRA y 'D' (izquierda fondo)
  const leftWall = new THREE.Group(); leftWall.position.set(-15.5, 0, -9.5); leftWall.rotation.y = 0.75; root.add(leftWall);
  const lwMesh = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 9, 48, 1, true, -Math.PI / 2.6, Math.PI / 1.3), mat(0x1f8f8a, { emissive: 0x0d4f6a, emissiveIntensity: 0.6, side: THREE.BackSide }));
  lwMesh.position.set(0, 4.5, 4.4); leftWall.add(lwMesh);
  'PASAPALABRA'.split('').forEach((ch, i, arr) => {
    const a = Math.PI * 0.95 - (i / (arr.length - 1)) * Math.PI * 0.55;
    const l = text3D(ch, { size: 0.55, depth: 0.12, material: mat(0xf2ead2, { emissive: 0x554f3a, emissiveIntensity: 0.4 }) });
    l.position.set(Math.cos(a) * 3.2, 4.2 + Math.sin(a) * 3.2, 0.2);
    l.rotation.z = a - Math.PI / 2;
    leftWall.add(l);
  });
  const bigD = text3D('D', { size: 2.2, depth: 0.35, material: mat(0xe9e3cc, { emissive: 0x403a28, emissiveIntensity: 0.5 }) });
  bigD.position.set(-2.4, 5.6, 0.4); leftWall.add(bigD);

  // ---------- LETRAS GIGANTES DE COLORES ----------
  const giant = (ch, color, x, z, ry, size = 3.6, emi = 0.25) => {
    const m = text3D(ch, { size, depth: 0.8, material: mat(color, { emissive: color, emissiveIntensity: emi, roughness: 0.35 }) });
    m.position.set(x, 0, z); m.rotation.y = ry; m.castShadow = true; root.add(m); return m;
  };
  giant('F', 0xf4f4f4, -12.6, -2.4, 0.8, 3.4, 0.12);
  giant('R', C.rojo, -10.6, -5.2, 0.6, 4.2, 0.25);
  giant('P', C.naranja, -12.2, 1.4, 1.1, 2.6, 0.3);
  giant('S', C.amarillo, 12.4, -2.6, -0.8, 3.6, 0.25);
  giant('Z', 0x37c3ff, 10.6, -5.4, -0.6, 4.0, 0.3);
  giant('M', C.naranja, 12.0, 1.4, -1.1, 2.6, 0.3);
  // telón naranja detrás de las letras (como en la foto)
  for (const side of [-1, 1]) {
    const back = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 7, 32, 1, true, 0, Math.PI), mat(C.naranja, { emissive: 0xff4a00, emissiveIntensity: 0.4, side: THREE.DoubleSide }));
    back.position.set(side * 11.6, 3.5, -7.6); back.rotation.y = side < 0 ? Math.PI * 0.85 : -Math.PI * 0.85 + Math.PI;
    root.add(back);
  }
  // Columna derecha azul con letra 'B'
  const colB = colA.clone(); colB.position.set(8.6, 0, -9.2); colB.rotation.y = -0.35; root.add(colB);
  colB.remove(colB.children[2], colB.children[3]);
  const bigB = text3D('B', { size: 5.2, depth: 0.5, material: bigA.material });
  bigB.position.set(0, 1.1, 0.6); colB.add(bigB);
  const bOutline = text3D('B', { size: 5.35, depth: 0.08, bevel: false, material: aOutline.material });
  bOutline.position.set(0, 1.0, 0.45); colB.add(bOutline);

  // ---------- ATRIL DOBLE (ROSCO) ----------
  const atril = buildAtril(updaters, ctx);
  atril.position.set(0, 0.32, 0.6);
  root.add(atril);
  // concursantes (figuras estilizadas sin rostro) detrás del atril
  const riser = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.3, 1.4), mat(0x0e2470));
  riser.position.set(0, 0.47, -1.05); atril.add(riser);
  const cRed = figure({ body: 0xf1d6c8, legs: 0x22243a, hair: 0x1d140c, scale: 1.12 });
  cRed.position.set(-1.25, 0.15, -1.1); atril.add(cRed);
  const cBlue = figure({ body: 0xe8e8f0, legs: 0x2b2b3d, hair: 0x2b1c10, scale: 1.12 });
  cBlue.position.set(1.25, 0.15, -1.1); atril.add(cBlue);
  // cuñas de color del equipo
  const tagR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.02), glow(C.rojo, 2)); tagR.position.set(-1.33, 1.38, -0.95); atril.add(tagR);
  const tagB = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.02), glow(0x2a6bff, 2)); tagB.position.set(1.17, 1.38, -0.95); atril.add(tagB);

  // ---------- MESA SEMICIRCULAR DE INVITADOS ----------
  const mesa = buildMesa(updaters);
  mesa.position.set(0, 0.32, -3.2);
  root.add(mesa);

  // ---------- GRADAS Y PÚBLICO ----------
  root.add(buildGradas(-1));
  root.add(buildGradas(1));

  // ---------- TECHO: TRUSS Y FOCOS ----------
  root.add(buildTecho(updaters));

  // ---------- SALIDA HACIA LOS ESTUDIOS ----------
  const sal = salida({ style: 'puerta', color: 0xff7a00 }); sal.position.set(-17, 0, 8); sal.rotation.y = Math.PI / 2; root.add(sal);
  if (ctx.especial && ctx.especial !== 'normal') addEspecial(root, ctx.especial, updaters, { centro: [0, 0, -3], radio: 10, anios: '5' });

  // ---------- PANTALLA ANIMADA ----------
  updaters.push((t) => drawScreen(screenCanvas, t, ctx.screenMode, ctx.logoPantalla));
  updaters.push(() => { screenTex.needsUpdate = true; });

  // ---------- MODOS: rosco (atril) / pruebas (mesa) ----------
  let mode = 'rosco';
  const anim = { atril: 0, mesa: -4.5 };
  mesa.position.y = anim.mesa; mesa.visible = false;
  function setMode(m) { mode = m; ctx.screenMode = m; }
  setMode('rosco');
  updaters.push((t, dt) => {
    const tA = mode === 'rosco' ? 0.32 : -4.5, tM = mode === 'pruebas' ? 0.32 : -4.5;
    const k = 1 - Math.pow(0.002, dt);
    atril.position.y += (tA - atril.position.y) * k;
    mesa.position.y += (tM - mesa.position.y) * k;
    atril.visible = atril.position.y > -4.3; mesa.visible = mesa.position.y > -4.3;
  });

  return {
    root, clickables: [sal],
    setMode,
    getMode: () => mode,
    rosco: atril.userData.rosco,
    update(t, dt) { for (const u of updaters) u(t, dt); },
    dispose() { scene.remove(root); },
  };
}

// =====================================================================
function peanutShape(c = 1.35, r = 1.08, w = 0.62, th = 0.95) {
  const s = new THREE.Shape();
  s.moveTo(-c + r * Math.cos(th), r * Math.sin(th));
  s.quadraticCurveTo(0, w, c - r * Math.cos(th), r * Math.sin(th));
  s.absarc(c, 0, r, Math.PI - th, -(Math.PI - th), true);
  s.quadraticCurveTo(0, -w, -c + r * Math.cos(th), -r * Math.sin(th));
  s.absarc(-c, 0, r, -th, th, true);
  return s;
}

function buildAtril(updaters, ctx) {
  const g = new THREE.Group(); g.name = 'atril';
  const body = new THREE.Group(); body.position.y = 1.5; body.rotation.x = -0.12; g.add(body);
  const shape = peanutShape();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.45, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 4, curveSegments: 48 });
  const faceM = mat(0xf0b400, { emissive: 0xff8800, emissiveIntensity: 0.08, roughness: 0.5 });
  const sideM = mat(0xff8a00, { emissive: 0xff5a00, emissiveIntensity: 0.3, roughness: 0.4 });
  const shell = new THREE.Mesh(geo, [faceM, sideM]); shell.position.z = -0.45; shell.castShadow = true; body.add(shell);
  const zf = 0.081; // superficie frontal
  // borde de bombillitas amarillas
  const pts = shape.getSpacedPoints(110);
  const bulbGeo = new THREE.SphereGeometry(0.028, 8, 6);
  const borderBulbs = new THREE.InstancedMesh(bulbGeo, glow(0xfff4c0, 1.2), pts.length - 1);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i], a = pts[(i + pts.length - 2) % (pts.length - 1)], b = pts[i + 1];
    const tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty);
    const nx = -ty / l, ny = tx / l; // normal hacia dentro (forma antihoraria)
    m4.makeTranslation(p.x + nx * 0.07, p.y + ny * 0.07, zf);
    borderBulbs.setMatrixAt(i, m4);
  }
  body.add(borderBulbs);
  // línea central vertical
  const mid = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.15, 0.01), mat(0xb36a00)); mid.position.set(0, 0, zf); body.add(mid);

  const roscos = {};
  for (const [team, cx, col, dark] of [['rojo', -1.35, 0xe3141c, 0x7a0008], ['azul', 1.35, 0x1450e6, 0x061e70]]) {
    const rg = new THREE.Group(); rg.position.set(cx, 0, zf + 0.002); body.add(rg);
    const ringOuter = new THREE.Mesh(new THREE.CircleGeometry(0.95, 64), mat(0xfff0b0, { emissive: 0xffe08a, emissiveIntensity: 0.2 }));
    rg.add(ringOuter);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.9, 64), mat(col, { emissive: col, emissiveIntensity: 0.3, roughness: 0.3 }));
    disc.position.z = 0.003; rg.add(disc);
    const inner = new THREE.Mesh(new THREE.CircleGeometry(0.5, 48), mat(dark, { emissive: col, emissiveIntensity: 0.35 }));
    inner.position.z = 0.006; rg.add(inner);
    // globo terráqueo estilizado (rejilla)
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), new THREE.MeshBasicMaterial({ color: 0xdfe6ff, wireframe: true, transparent: true, opacity: 0.8 }));
    globe.scale.z = 0.25; globe.position.z = 0.04; rg.add(globe);
    updaters.push((t) => { globe.rotation.y = t * 0.6; });
    // anillo de 25 letras iluminables
    const bulbs = [];
    ROSCO_LETRAS.forEach((ch, i) => {
      const a = Math.PI / 2 - (i / ROSCO_LETRAS.length) * Math.PI * 2;
      const bm = glow(0xffffff, 0.9);
      const b = new THREE.Mesh(new THREE.CircleGeometry(0.088, 20), bm);
      b.position.set(Math.cos(a) * 0.71, Math.sin(a) * 0.71, 0.01);
      const lm = new THREE.MeshBasicMaterial({ map: letterTexture(ch), transparent: true, color: 0x0a1650, depthWrite: false });
      const lp = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.15), lm); lp.position.z = 0.003; b.add(lp);
      rg.add(b);
      bulbs.push({ mesh: b, mat: bm, letter: ch, state: 'idle' });
    });
    roscos[team] = bulbs;
  }
  // flechas roja (izq.) y azul (dcha.)
  const arrowShape = new THREE.Shape(); arrowShape.moveTo(0, 0.13); arrowShape.lineTo(0.2, 0); arrowShape.lineTo(0, -0.13); arrowShape.closePath();
  const aGeo = new THREE.ExtrudeGeometry(arrowShape, { depth: 0.03, bevelEnabled: false });
  const arR = new THREE.Mesh(aGeo, glow(0xff1a1a, 1.6)); arR.rotation.z = Math.PI; arR.position.set(-0.14, 0.12, zf); body.add(arR);
  const arB = new THREE.Mesh(aGeo, glow(0x23c8ff, 1.6)); arB.position.set(0.14, 0.12, zf); body.add(arB);
  // marcador inferior
  const mc = document.createElement('canvas'); mc.width = 512; mc.height = 96;
  const mTex = new THREE.CanvasTexture(mc); mTex.colorSpace = THREE.SRGBColorSpace;
  const marcBox = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.28, 0.12), mat(0x5a3a10, { metalness: 0.5 }));
  marcBox.position.set(0, -0.86, zf + 0.02); body.add(marcBox);
  const marc = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.2), new THREE.MeshBasicMaterial({ map: mTex, toneMapped: false }));
  marc.position.set(0, -0.86, zf + 0.081); body.add(marc);
  // peana
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 0.45, 24), mat(0x0e2470, { metalness: 0.5, roughness: 0.3 }));
  base.position.set(0, 0.22, -0.2); g.add(base);
  const baseGlow = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.03, 6, 48), glow(C.naranja, 3)); baseGlow.rotation.x = Math.PI / 2; baseGlow.position.set(0, 0.02, -0.2); g.add(baseGlow);
  // lógica del rosco
  const rosco = {
    playing: false, idx: 0, timer: 150, nextAt: 0,
    reset() { for (const t of ['rojo', 'azul']) roscos[t].forEach(b => b.state = 'idle'); this.idx = 0; this.timer = 150; },
    toggle() { this.playing = !this.playing; if (this.playing) this.reset(); return this.playing; },
  };
  g.userData.rosco = rosco;
  const COL = { idle: [0xffffff, 0.6], cur: [0xffd400, 1.8], ok: [0x19e05a, 1.4], ko: [0xff2020, 1.4], pasa: [0x2a8bff, 1.0] };
  updaters.push((t, dt) => {
    for (const team of ['rojo', 'azul']) {
      const bulbs = roscos[team];
      bulbs.forEach((b, i) => {
        let st = b.state;
        if (!rosco.playing) {
          // persecución de luces en reposo
          const ph = (t * 6 + (team === 'azul' ? 12 : 0)) % bulbs.length;
          const d = Math.min(Math.abs(i - ph), bulbs.length - Math.abs(i - ph));
          b.mat.emissive.setHex(0xffffff); b.mat.emissiveIntensity = 0.5 + Math.max(0, 1.3 - d * 0.5);
          return;
        }
        if (team === 'rojo' && i === rosco.idx % 25 && st === 'idle') st = 'cur';
        if (team === 'azul' && i === (rosco.idx + 7) % 25 && st === 'idle') st = 'cur';
        const [c, k] = COL[st];
        b.mat.emissive.setHex(c);
        b.mat.emissiveIntensity = st === 'cur' ? k * (0.6 + 0.4 * Math.sin(t * 12)) : k;
      });
    }
    if (rosco.playing && t > rosco.nextAt) {
      rosco.nextAt = t + 0.6;
      const r = Math.random();
      for (const [team, off] of [['rojo', 0], ['azul', 7]]) {
        const b = roscos[team][(rosco.idx + off) % 25];
        if (b.state === 'idle') b.state = r < 0.6 ? 'ok' : r < 0.8 ? 'ko' : 'pasa';
        if (team === 'rojo' && ctx.onRosco) ctx.onRosco(b.state);
      }
      rosco.idx++; rosco.timer = Math.max(0, rosco.timer - 3);
      if (rosco.idx > 25) rosco.reset();
    }
    drawMarcador(mc, t, rosco);
    mTex.needsUpdate = true;
  });
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function drawMarcador(c, t, rosco) {
  const g = c.getContext('2d');
  g.fillStyle = '#120600'; g.fillRect(0, 0, c.width, c.height);
  g.font = 'bold 64px "Courier New", monospace'; g.textBaseline = 'middle';
  g.shadowColor = '#ff9a00'; g.shadowBlur = 16; g.fillStyle = '#ffb020';
  if (rosco.playing) {
    g.textAlign = 'left'; g.fillText(String(Math.ceil(rosco.timer)).padStart(3, '0'), 20, 52);
    g.textAlign = 'right'; g.fillText(String(Math.ceil(rosco.timer * 0.9)).padStart(3, '0'), c.width - 20, 52);
  } else {
    const msg = '  PASAPALABRA  ·  ANTENA 3  ·  2000-2006  ';
    const w = g.measureText(msg).width; const x = -((t * 120) % w);
    g.textAlign = 'left'; g.fillText(msg + msg, x, 52);
  }
  g.shadowBlur = 0;
  // rejilla de puntos LED
  g.fillStyle = 'rgba(0,0,0,0.35)';
  for (let y = 0; y < c.height; y += 6) g.fillRect(0, y, c.width, 2);
}

function drawScreen(c, t, mode, logoImg) {
  const g = c.getContext('2d'); const W = c.width, H = c.height;
  const grd = g.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.7);
  grd.addColorStop(0, '#3d8cff'); grd.addColorStop(0.55, '#1238b8'); grd.addColorStop(1, '#06135a');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  // letras flotando de fondo
  g.font = 'bold 54px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 0; i < 26; i++) {
    const x = (i * 97 + t * 30 * (1 + (i % 3))) % (W + 100) - 50, y = (i * 173) % H;
    g.fillStyle = `rgba(160,200,255,${0.12 + (i % 4) * 0.04})`;
    g.save(); g.translate(x, y); g.rotate(Math.sin(t + i) * 0.6); g.fillText(String.fromCharCode(65 + (i % 26)), 0, 0); g.restore();
  }
  // globo giratorio
  const cx = W / 2 - 40, cy = H / 2 - 20, R = 190;
  const gg = g.createRadialGradient(cx - 50, cy - 60, 20, cx, cy, R);
  gg.addColorStop(0, '#9fd2ff'); gg.addColorStop(1, '#1a5be0');
  g.fillStyle = gg; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 2;
  for (let k = -3; k <= 3; k++) { g.beginPath(); g.ellipse(cx, cy + k * R / 4, Math.sqrt(1 - (k / 4) ** 2) * R, 6, 0, 0, Math.PI * 2); g.stroke(); }
  for (let k = 0; k < 6; k++) {
    const ph = ((t * 0.5 + k / 6) % 1) * Math.PI;
    g.beginPath(); g.ellipse(cx, cy, Math.abs(Math.cos(ph)) * R, R, 0, 0, Math.PI * 2); g.stroke();
  }
  // logo aportado por el usuario (logos/antena3_2000.png o subido): se usa tal cual
  if (logoImg && logoImg.complete && logoImg.naturalWidth) {
    const sc = Math.min(W * 0.7 / logoImg.naturalWidth, H * 0.6 / logoImg.naturalHeight) * (1 + 0.03 * Math.sin(t * 3));
    const w = logoImg.naturalWidth * sc, h = logoImg.naturalHeight * sc;
    g.drawImage(logoImg, (W - w) / 2, (H - h) / 2, w, h);
    return;
  }
  // logotipo original: palabra en cinta inclinada con letras que botan
  g.save(); g.translate(W / 2 + 30, H / 2 + 10); g.rotate(-0.12);
  const word = mode === 'pruebas' ? 'PALABRA' : 'PASAPALABRA';
  g.font = 'italic 900 96px Arial Black, Arial, sans-serif';
  const total = g.measureText(word).width;
  g.fillStyle = 'rgba(10,30,90,0.75)'; g.fillRect(-total / 2 - 30, -62, total + 60, 124);
  g.strokeStyle = '#ffe14a'; g.lineWidth = 4; g.strokeRect(-total / 2 - 30, -62, total + 60, 124);
  let x = -total / 2;
  for (let i = 0; i < word.length; i++) {
    const ch = word[i], w = g.measureText(ch).width;
    const y = Math.sin(t * 5 - i * 0.6) * 10;
    g.lineWidth = 10; g.strokeStyle = '#0b5a1f'; g.strokeText(ch, x + w / 2, y);
    const lg = g.createLinearGradient(0, y - 40, 0, y + 40); lg.addColorStop(0, '#f4ff6a'); lg.addColorStop(1, '#5fd31f');
    g.fillStyle = lg; g.fillText(ch, x + w / 2, y);
    x += w;
  }
  g.restore();
  // destello
  const sx = ((t * 260) % (W * 2)) - W / 2;
  const sg = g.createLinearGradient(sx - 80, 0, sx + 80, 0);
  sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.18)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = sg; g.fillRect(0, 0, W, H);
}

function buildMesa(updaters) {
  const g = new THREE.Group(); g.name = 'mesa';
  const Rin = 1.7, Rout = 2.9, top = 1.05;
  // tablero (sector de corona, convexo hacia el público)
  const s = new THREE.Shape();
  s.absarc(0, 0, Rout, Math.PI, Math.PI * 2, false);
  s.absarc(0, 0, Rin, Math.PI * 2, Math.PI, true);
  s.closePath();
  const topGeo = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 64 });
  const topMesh = new THREE.Mesh(topGeo, mat(0x3a4fc8, { roughness: 0.25, metalness: 0.3 }));
  topMesh.rotation.x = -Math.PI / 2; topMesh.position.y = top; topMesh.castShadow = topMesh.receiveShadow = true; g.add(topMesh);
  // borde naranja luminoso
  const edge = new THREE.Mesh(new THREE.TorusGeometry(Rout + 0.03, 0.06, 8, 96, Math.PI), glow(0xff8a10, 1.8));
  edge.rotation.x = Math.PI / 2; edge.position.y = top + 0.06; g.add(edge);
  const edgeIn = new THREE.Mesh(new THREE.TorusGeometry(Rin - 0.02, 0.04, 8, 64, Math.PI), glow(0xffb020, 1.4));
  edgeIn.rotation.x = Math.PI / 2; edgeIn.position.y = top + 0.06; g.add(edgeIn);
  // faldón frontal amarillo-naranja
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(Rout - 0.15, Rout - 0.25, top, 64, 1, true, -Math.PI / 2, Math.PI), mat(0xffb000, { emissive: 0xff7a00, emissiveIntensity: 0.45, side: THREE.DoubleSide }));
  skirt.position.y = top / 2; g.add(skirt);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(Rout - 0.13, Rout - 0.13, 0.16, 64, 1, true, -Math.PI / 2, Math.PI), mat(0xff6a00, { emissive: 0xff4a00, emissiveIntensity: 0.7 }));
  band.position.y = top - 0.12; g.add(band);
  const skirtIn = new THREE.Mesh(new THREE.CylinderGeometry(Rin + 0.1, Rin + 0.1, top, 48, 1, true, -Math.PI / 2, Math.PI), mat(0x1a2a7a, { side: THREE.DoubleSide }));
  skirtIn.position.y = top / 2; g.add(skirtIn);
  // rejilla metálica central
  const gc = document.createElement('canvas'); gc.width = gc.height = 128;
  const gx = gc.getContext('2d'); gx.fillStyle = '#c9d0dc'; gx.fillRect(0, 0, 128, 128); gx.fillStyle = '#6d7686';
  for (let y = 4; y < 128; y += 8) for (let x = (y / 8 % 2) * 4 + 2; x < 128; x += 8) { gx.beginPath(); gx.arc(x, y, 2.2, 0, 7); gx.fill(); }
  const gtex = new THREE.CanvasTexture(gc); gtex.wrapS = gtex.wrapT = THREE.RepeatWrapping; gtex.repeat.set(3, 3);
  const grille = new THREE.Mesh(new THREE.CylinderGeometry(Rout - 0.13, Rout - 0.13, top * 0.75, 24, 1, true, -0.28, 0.56), mat(0xffffff, { map: gtex, metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide }));
  grille.position.y = top * 0.38; g.add(grille);
  // micrófonos y papeles
  const micMat = mat(0x111111, { metalness: 0.6 });
  for (const a of [-1.15, -0.75, -0.35, 0.35, 0.75, 1.15, 0]) {
    const r = a === 0 ? Rin + 0.25 : Rout - 0.35;
    const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.45, 6), micMat);
    mic.position.set(Math.sin(a) * r, top + 0.3, Math.cos(a) * r); mic.rotation.x = a === 0 ? -0.5 : 0.5; mic.rotation.z = -a * 0.3;
    g.add(mic);
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.01, 0.22), mat(0xf6f6f0));
    paper.position.set(Math.sin(a) * (r - 0.05), top + 0.11, Math.cos(a) * (r - 0.05)); paper.rotation.y = a; g.add(paper);
  }
  // sillas altas marrones + invitados (estilizados, sin rostro)
  const chairs = [];
  const guestStyles = [
    { body: 0xc93a3a, hair: 0x3a2412 }, { body: 0x2a2a2a, hair: 0x6a3b1c }, { body: 0x1c1c22, hair: 0x2a1a0e },
    { body: 0xf3efe6, hair: 0x2a1a0e }, { body: 0x5a1f3a, hair: 0x111111 }, { body: 0x2c2c3a, hair: 0xb8b8b8 },
  ];
  const angles = [-1.55, -1.18, -0.82, 0.82, 1.18, 1.55];
  angles.forEach((a, i) => {
    const r = Rout + 0.55;
    const chair = makeChair(i < 3 ? 0x4a3a8a : 0xb07a3a);
    chair.position.set(Math.sin(a) * r, 0, Math.cos(a) * r);
    chair.lookAt(0, 0, 0); g.add(chair);
    const guest = figure({ ...guestStyles[i], legs: 0x1e1e28, seated: true, scale: 1.05 });
    guest.position.set(0, 0.78, 0.02); chair.add(guest);
    chairs.push(chair);
  });
  // presentadora en el centro (dentro de la mesa)
  const host = figure({ body: 0x111118, legs: 0x111118, hair: 0x241408, seated: true, scale: 1.05 });
  host.position.set(0, 0.78, Rin - 0.75); g.add(host);
  const hostChair = makeChair(0x3a2a1a); hostChair.position.set(0, 0, Rin - 0.8); g.add(hostChair);
  hostChair.remove(hostChair.getObjectByName('back'));
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function makeChair(color) {
  const c = new THREE.Group();
  const seatM = mat(color, { roughness: 0.55 }), metal = mat(0xb8bcc8, { metalness: 0.9, roughness: 0.25 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.04, 24), metal); base.position.y = 0.02; c.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 8), metal); pole.position.y = 0.38; c.add(pole);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 6, 24), metal); ring.rotation.x = Math.PI / 2; ring.position.y = 0.35; c.add(ring);
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.09, 24), seatM); seat.position.y = 0.76; c.add(seat);
  const back = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.42, 24, 1, true, Math.PI * 0.7, Math.PI * 0.6), mat(color, { side: THREE.DoubleSide, roughness: 0.55 }));
  back.position.set(0, 1.0, 0); back.name = 'back'; c.add(back);
  return c;
}

function buildGradas(side) {
  const g = new THREE.Group(); g.name = 'gradas';
  const rows = 7, perRow = 20, z0 = -3, z1 = 13;
  const stepMat = mat(0x0c1a55, { roughness: 0.6 });
  for (let r = 0; r < rows; r++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5 * (r + 1), z1 - z0 + 1), stepMat);
    step.position.set(side * (14 + r * 1.1), 0.25 * (r + 1), (z0 + z1) / 2); step.receiveShadow = true; g.add(step);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, z1 - z0 + 1), glow(r % 2 ? 0x3f8cff : 0xff8a20, 1.4));
    lip.position.set(side * (14 + r * 1.1 - 0.55), 0.5 * (r + 1), (z0 + z1) / 2); g.add(lip);
  }
  // barandilla frontal
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, z1 - z0 + 1), mat(0xdfe6ff, { metalness: 0.7, roughness: 0.3 }));
  rail.position.set(side * 13.3, 0.45, (z0 + z1) / 2); g.add(rail);
  const railGlow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, z1 - z0 + 1), glow(0x37a0ff, 2.5));
  railGlow.position.set(side * 13.3, 0.92, (z0 + z1) / 2); g.add(railGlow);
  // público instanciado
  const n = rows * perRow;
  const bodyGeo = new THREE.CapsuleGeometry(0.2, 0.35, 3, 8);
  const headGeo = new THREE.SphereGeometry(0.12, 10, 8);
  const bodies = new THREE.InstancedMesh(bodyGeo, mat(0xffffff, { roughness: 0.8 }), n);
  const heads = new THREE.InstancedMesh(headGeo, mat(0xffffff, { roughness: 0.9 }), n);
  const palette = [0xd23b3b, 0x2f5fd0, 0xf0f0f0, 0x222228, 0xe8a020, 0x2aa060, 0x8a3ab0, 0x5a5a6a, 0xe86aa0, 0x3ac0d0];
  const skins = [0xe0b48a, 0xc8986e, 0x9a6a46, 0xf0c8a0, 0x7a4e30];
  const hair = [0x1a1008, 0x3a2412, 0x6a4020, 0xb8b0a0, 0xd0a050];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), col = new THREE.Color();
  let k = 0;
  for (let r = 0; r < rows; r++) for (let i = 0; i < perRow; i++) {
    const x = side * (14 + r * 1.1) + side * 0.1, y = 0.5 * (r + 1);
    const z = z0 + (i + 0.5) * (z1 - z0) / perRow + (Math.random() - 0.5) * 0.15;
    p.set(x, y + 0.5, z); m.compose(p, q, sc); bodies.setMatrixAt(k, m);
    bodies.setColorAt(k, col.setHex(palette[(Math.random() * palette.length) | 0]));
    p.set(x, y + 1.0, z); m.compose(p, q, sc); heads.setMatrixAt(k, m);
    heads.setColorAt(k, col.setHex(Math.random() < 0.6 ? hair[(Math.random() * hair.length) | 0] : skins[(Math.random() * skins.length) | 0]));
    k++;
  }
  g.add(bodies, heads);
  return g;
}

function buildTecho(updaters) {
  const g = new THREE.Group(); g.name = 'techo';
  const trussM = mat(0x9aa0aa, { metalness: 0.85, roughness: 0.35 });
  const Y = 12.5;
  for (let z = -10; z <= 14; z += 4) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(34, 0.25, 0.25), trussM); b.position.set(0, Y, z); g.add(b);
    const b2 = b.clone(); b2.position.y = Y + 0.6; g.add(b2);
  }
  for (let x = -16; x <= 16; x += 4) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 24), trussM); b.position.set(x, Y + 0.3, 2); g.add(b);
  }
  // focos con lente emisiva y conos volumétricos
  const bodyM = mat(0x18181c, { metalness: 0.6, roughness: 0.4 });
  const colors = [0xffffff, 0x6fa8ff, 0xff9a30, 0xffffff, 0xff4fd0, 0x5affc8];
  let i = 0;
  for (let z = -10; z <= 14; z += 4) for (let x = -14; x <= 14; x += 4) {
    i++;
    const head = new THREE.Group(); head.position.set(x, Y - 0.35, z); g.add(head);
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.55, 12), bodyM); head.add(can);
    const c = colors[i % colors.length];
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.26, 16), glow(c, 3)); lens.rotation.x = Math.PI / 2; lens.position.y = -0.28; head.add(lens);
    if (i % 4 === 0) {
      const coneH = 11;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.2, coneH, 24, 1, true),
        new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.018, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      cone.position.y = -coneH / 2 - 0.3; head.add(cone);
      const ph = i * 0.7;
      updaters.push(t => { head.rotation.z = Math.sin(t * 0.5 + ph) * 0.35; head.rotation.x = Math.cos(t * 0.4 + ph) * 0.25; });
    }
  }
  return g;
}
