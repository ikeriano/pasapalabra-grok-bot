import * as THREE from 'three';
import { addEspecial, ESPECIALES } from '../lib/especiales.js';

/** Envoltorio común de un plató: devuelve la API que espera main.js */
export function crearPlato(scene, ctx, { nombre, fondo = 0x02040c, niebla = [40, 90], especial = null, especialOpts = {} }, fn) {
  const root = new THREE.Group(); root.name = nombre; scene.add(root);
  scene.background = new THREE.Color(fondo); scene.fog = new THREE.Fog(fondo, niebla[0], niebla[1]);
  const updaters = [];
  let mode = 'rosco';
  const res = fn(root, updaters) || {};
  const E = ESPECIALES[especial];
  if (E && E.deco) addEspecial(root, E.deco, updaters, { ...especialOpts, ...(E.anios ? { anios: E.anios } : {}) });
  root.traverse(o => { if (o.isMesh && !o.material.transparent) o.castShadow = o.castShadow || false; });
  return {
    root, rosco: res.rosco, clickables: res.clickables || [],
    setMode(m) { mode = m; ctx.screenMode = m; res.onMode && res.onMode(m); },
    getMode: () => mode,
    update(t, dt) { for (const u of updaters) u(t, dt); },
    dispose() { scene.remove(root); root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); },
  };
}

/** Logo "Pasapalabra" estilo globo de letras (dibujo original en canvas) */
export function drawGlobeLogo(g, cx, cy, R, t, { texto = 'Pasapalabra', colorTexto = '#ffffff', font = '700 72px Arial', colores = ['#ffffff', '#ff8a20', '#9fd0ff'] } = {}) {
  g.save();
  const gr = g.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 5, cx, cy, R);
  gr.addColorStop(0, 'rgba(180,220,255,0.6)'); gr.addColorStop(1, 'rgba(20,60,160,0.15)');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 6.29); g.fill();
  g.font = `700 ${Math.round(R * 0.22)}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const L = 'ABCDEFGHIJLMNOPQRSTUVXYZ';
  for (let i = 0; i < 60; i++) {
    const lat = Math.acos(1 - 2 * (i + 0.5) / 60), lon = i * 2.39996 + t * 0.6;
    const x = Math.sin(lat) * Math.cos(lon), z = Math.sin(lat) * Math.sin(lon), y = Math.cos(lat);
    if (z < -0.1) continue;
    g.globalAlpha = 0.35 + 0.65 * z; g.fillStyle = colores[i % colores.length];
    g.fillText(L[i % L.length], cx + x * R * 0.9, cy - y * R * 0.9);
  }
  g.globalAlpha = 1; g.font = font; g.fillStyle = colorTexto; g.shadowColor = 'rgba(0,0,40,0.9)'; g.shadowBlur = 18;
  g.fillText(texto, cx, cy + 4); g.restore();
}

/** Si el usuario aportó un logo, se dibuja en lugar del logo procedural */
export function dibujaLogoUsuario(g, w, h, ctx, t) {
  const img = ctx.logoPantalla;
  if (img && img.complete && img.naturalWidth) {
    const sc = Math.min(w * 0.6 / img.naturalWidth, h * 0.6 / img.naturalHeight) * (1 + 0.02 * Math.sin(t * 3));
    g.drawImage(img, (w - img.naturalWidth * sc) / 2, (h - img.naturalHeight * sc) / 2, img.naturalWidth * sc, img.naturalHeight * sc);
    return true;
  }
  return false;
}
