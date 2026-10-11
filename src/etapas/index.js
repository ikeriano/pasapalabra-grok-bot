// Registro de épocas/platós. Arquitectura modular: un módulo por plató en src/etapas/
// (exporta { info, cameras, build(scene, ctx) }) y, opcionalmente, una cabecera en src/cabeceras/.
import * as antena3_2000 from './antena3_2000.js';
import * as telecinco_2007 from './telecinco_2007.js';
import * as telecinco_2018 from './telecinco_2018.js';
import * as antena3_2020 from './antena3_2020.js';
import * as rueda from './rueda_letra.js';
import * as cabTelecinco from '../cabeceras/telecinco.js';
import * as cabRueda from '../cabeceras/rueda.js';

export const ETAPAS = [
  { ...antena3_2000.info, modulo: antena3_2000, cabecera: cabTelecinco, color: 0xff7a00, especiales: false,
    archivosMusica: ['cabecera_a3_2000', 'cabecera_antena3_2000'], archivosLogo: ['antena3_2000'] },
  { ...telecinco_2007.info, modulo: telecinco_2007, cabecera: cabTelecinco, color: 0x3f7dff, especiales: true,
    archivosMusica: ['cabecera_t5_2007', 'cabecera_telecinco_2007', 'cabecera_telecinco'], archivosLogo: ['telecinco_2007', 'telecinco'] },
  { ...telecinco_2018.info, modulo: telecinco_2018, cabecera: cabTelecinco, color: 0x2ab8ff, especiales: true,
    archivosMusica: ['cabecera_t5_2018', 'cabecera_telecinco_2018', 'cabecera_telecinco'], archivosLogo: ['telecinco_2018', 'telecinco'] },
  { ...antena3_2020.info, modulo: antena3_2020, cabecera: cabTelecinco, color: 0x1f74ff, especiales: true,
    archivosMusica: ['cabecera_a3_2020', 'cabecera_antena3_2020'], archivosLogo: ['antena3_2020'] },
  { ...rueda.info, modulo: rueda, cabecera: cabRueda, color: 0xc050ff, especiales: false,
    archivosMusica: ['cabecera_rueda', 'cabecera_rueda_letra'], archivosLogo: ['rueda_letra'] },
];
export const HUB = null;
