// Ajustes persistentes (mismas filas que las Opciones del APK de referencia)
const DEF = { music: true, musicVol: 0.7, sfx: true, sfxVol: 0.9, publico: true, publicoVol: 0.8, voz: true, lee: false, leeVel: 'normal', chistes: true, monologo: false,
  cabecera: '3d', etapa: 'antena3-2020', especial: 'normal', quality: 'media', nombre: '', profesion: '', presentaciones: true, misSonidos: true, normas: false, t5: false, alazA: false };
export const VERSION = '1.2';
export const cfg = Object.assign({}, DEF, JSON.parse(localStorage.getItem('ppj_cfg') || '{}'));
export function guardarCfg() { localStorage.setItem('ppj_cfg', JSON.stringify(cfg)); }
