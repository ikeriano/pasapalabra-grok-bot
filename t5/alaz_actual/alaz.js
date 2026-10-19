/* AlaZ · mecánica actual (Antena 3, desde 19/06/2026). Reglas según antena3.com:
   definiciones de la A a la Z (la respuesta empieza por o contiene la letra), palabra EXACTA rellenando huecos,
   «letra» destapa una letra a cambio de 5 s, quien llega con más segundos elige A→Z o Z→A, 110 s + lo acumulado.
   PENDIENTE (confirmar con un programa actual): orden de turnos, cambio de turno al fallar/pasar, desempate. */
(function () {
  var ABC = 'ABCDEFGHIJLMNÑOPQRSTUVXYZ'.split('');
  var D = {A:['Fruto del olivo','ACEITUNA'],B:['Embarcación pequeña de remos','BARCA'],C:['Utensilio con púas para peinarse','CEPILLO'],D:['Lo que se hace por la noche al dormir y a veces se recuerda','SUEÑO','c'],E:['Animal con trompa','ELEFANTE'],F:['Poste con una lámpara que alumbra las calles','FAROLA'],G:['Planta de flor amarilla que sigue al sol','GIRASOL'],H:['Cuerpo ovalado que ponen las aves','HUEVO'],I:['Masa de hielo flotante en el mar','ICEBERG'],J:['Animal de cuello muy largo','JIRAFA'],L:['Fruto cítrico amarillo y ácido','LIMÓN'],M:['Insecto de alas de colores','MARIPOSA'],N:['Fruta cítrica anaranjada','NARANJA'],Ñ:['Animal de ocho patas que teje telas','ARAÑA','c'],O:['Mamífero grande que hiberna','OSO'],P:['Ave que repite palabras','PAPAGAYO'],Q:['Producto lácteo curado','QUESO'],R:['Anfibio que croa','RANA'],S:['Reptil sin patas','SERPIENTE'],T:['Hortaliza roja de la ensalada','TOMATE'],U:['Fruto de la vid','UVA'],V:['Abertura en la pared que da luz','VENTANA'],X:['Instrumento de láminas que se toca con baquetas','XILÓFONO'],Y:['Parte amarilla del huevo','YEMA'],Z:['Calzado que cubre el pie','ZAPATO']};
  var $ = function (i) { return document.getElementById(i); }, W = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var Q = new URLSearchParams(location.search), nombre = (Q.get('nombre') || 'TÚ').toUpperCase();
  var norm = function (s) { return s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z\u00d1N]/g, '').trim(); };
  function jug(n, bot, acc) { return { n: n, bot: bot, acc: acc, t: (110 + acc) * 1000, st: {}, vis: {}, i: 0, fin: false }; }
  var acH = +(Q.get('acc') || (15 + Math.floor(Math.random() * 30))), acR = +(Q.get('accr') || (15 + Math.floor(Math.random() * 30)));
  var H = jug(nombre, false, acH), R = jug('RIVAL', true, acR), A = H, orden = ABC.slice(), ticker = null, res = null;
  var abc = $('abc'); ABC.forEach(function (l) { var b = document.createElement('b'); b.textContent = l; b.id = 'l_' + l; abc.appendChild(b); });
  for (var k = 0; k < 40; k++) { var s = document.createElement('div'); s.className = 'ltr'; s.textContent = ABC[k % 25]; s.style.cssText = 'left:' + (k * 37 % 100) + 'vw;top:' + (k * 53 % 90) + 'vh;font-size:' + (5 + k % 4 * 3) + 'vh'; $('fondo').appendChild(s); }
  function hueco(J, l) { var p = D[l][1]; return p.split('').map(function (c, i) { return J.vis[l] && J.vis[l].indexOf(i) >= 0 ? c : '_'; }).join(p.length > 6 ? '' : ' '); }
  function pinta() {
    document.body.classList.toggle('nar', A === R); $('fondo').className = A === R ? 'nar' : ''; $('nom').textContent = A.n;
    var sg = Math.max(0, Math.ceil(A.t / 1000)); $('seg').textContent = sg; $('reloj').style.setProperty('--p', Math.min(100, A.t / ((110 + A.acc) * 10)) + '%');
    $('quedan').textContent = orden.filter(function (l) { return !A.st[l] || A.st[l] === 'pa'; }).length;
    ABC.forEach(function (l) { var b = $('l_' + l); b.className = (A.st[l] || '') + (orden[A.i] === l && !A.fin ? ' act' : ''); });
    $('ui').style.visibility = A.bot || A.fin ? 'hidden' : 'visible';
  }
  function sig(J) { for (var g = 0; g < 25; g++) { var x = (J.i + g) % 25, l = orden[x]; if (!J.st[l] || J.st[l] === 'pa') return x; } return -1; }
  function modal(html, bts) { var m = $('modal'); m.innerHTML = html; m.style.display = 'flex'; return new Promise(function (r) { var d = document.createElement('div'); d.style.cssText = 'display:flex;gap:2vh';
    bts.forEach(function (b) { var e = document.createElement('button'); e.className = 'bt ' + (b[2] || ''); e.textContent = b[0]; e.onclick = function () { m.style.display = 'none'; r(b[1]); }; d.appendChild(e); }); m.appendChild(d); }); }
  function tic() { var t0 = Date.now(); clearInterval(ticker); ticker = setInterval(function () { var n = Date.now(); A.t -= n - t0; t0 = n; if (A.t <= 0) { A.t = 0; A.fin = true; clearInterval(ticker); res && res('tiempo'); } pinta(); }, 100); }
  function para() { clearInterval(ticker); }
  $('letra').onclick = function () { var l = orden[A.i], p = D[l][1], oc = []; for (var i = 0; i < p.length; i++) if (!(A.vis[l] || []).includes(i)) oc.push(i);
    if (oc.length <= 1 || A.t <= 5000) return; (A.vis[l] = A.vis[l] || []).push(oc[Math.floor(Math.random() * oc.length)]); A.t -= 5000; $('pal').textContent = hueco(A, l); pinta(); $('r').focus(); };
  $('ok').onclick = function () { var v = $('r').value; if (v.trim() && res) res(v); };
  $('r').onkeydown = function (e) { if (e.key === 'Enter') $('ok').onclick(); };
  $('paso').onclick = function () { res && res('PASO'); };
  $('volver').onclick = function () { parent !== window ? parent.postMessage('pp-menu', '*') : history.back(); };
  async function turno() {
    pinta(); $('msg').textContent = A.bot ? 'Turno del rival' : 'Tu turno, ' + A.n; await W(1400); $('msg').textContent = '';
    while (!A.fin) {
      var x = sig(A); if (x < 0) { A.fin = true; break; } A.i = x; var l = orden[x], d = D[l];
      $('def').textContent = (d[2] === 'c' ? 'Contiene la ' + l + ': ' : '') + d[0]; $('pal').textContent = hueco(A, l); $('pal').style.fontSize = (d[1].length > 6 ? 3.4 : 5) + 'vh'; $('r').value = ''; pinta(); tic();
      var r;
      if (A.bot) { await W(1500 + Math.random() * 2500); r = A.fin ? 'tiempo' : (Math.random() < .7 ? d[1] : Math.random() < .5 ? 'PASO' : 'xx'); }
      else { $('r').focus(); r = await new Promise(function (z) { res = z; }); res = null; }
      para(); if (r === 'tiempo') break;
      if (r === 'PASO') { A.st[l] = 'pa'; A.i = (x + 1) % 25; pinta(); $('msg').textContent = 'PASAPALABRA'; await W(900); $('msg').textContent = ''; return; }
      if (norm(r) === norm(d[1])) { A.st[l] = 'ok'; $('pal').textContent = d[1]; pinta(); await W(700); A.i = (x + 1) % 25; continue; }
      A.st[l] = 'ko'; $('pal').textContent = d[1]; A.i = (x + 1) % 25; pinta(); $('msg').textContent = 'No, era ' + d[1]; await W(1600); $('msg').textContent = ''; return;
    }
  }
  async function empieza() {
    var cv = $('cort'); try { cv.currentTime = 0; await cv.play(); await new Promise(function (r) { cv.onended = r; setTimeout(r, 7500); }); } catch (e) { } cv.remove();
    await modal('<div style="font-size:5vh">AlaZ</div><div>Segundos acumulados en las pruebas: ' + H.n + ' ' + acH + ' s · RIVAL ' + acR + ' s</div><div>Cada uno suma 110 s: ' + H.n + ' ' + (110 + acH) + ' s · RIVAL ' + (110 + acR) + ' s</div>', [['Seguir', 1, 'g']]);
    var quien = H.t >= R.t ? H : R, dir;
    if (quien === H) dir = await modal('<div>Llegas con más segundos: ¿cómo quieres jugar?</div>', [['De la A a la Z', 'az', 'g'], ['De la Z a la A', 'za', 'o']]);
    else { dir = Math.random() < .5 ? 'az' : 'za'; await modal('<div>El rival llega con más segundos y elige ' + (dir === 'az' ? 'de la A a la Z' : 'de la Z a la A') + '.</div>', [['Seguir', 1, 'g']]); }
    if (dir === 'za') orden.reverse(); A = quien;
    while (!(H.fin && R.fin)) { if (A.fin) { A = A === H ? R : H; continue; } await turno(); var O = A === H ? R : H; if (!O.fin) A = O; }
    var ok = function (J) { return Object.values(J.st).filter(function (s) { return s === 'ok'; }).length; }, a = ok(H), b = ok(R);
    await modal('<div style="font-size:5vh">' + (a > b ? '¡Ganas el bote!' : a < b ? 'Gana el rival' : 'Empate') + '</div><div>' + H.n + ' ' + a + ' aciertos · RIVAL ' + b + '</div>', [['Volver', 1, 'g']]); $('volver').onclick();
  }
  window.__alazActual = { H: H, R: R, D: D, orden: orden };
  pinta(); if (Q.get('cap')) { $('cort').remove(); A = H; } else empieza();
})();
