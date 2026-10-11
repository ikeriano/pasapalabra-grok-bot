#!/usr/bin/env python3
"""Pregenera las voces Piper TTS de un juego (como el APK ¡Ahora Caigo! 3D).
Uso: gen_voces.py frases.json <carpeta_juego> [<carpeta_modelos>]
frases.json = [{"v": "davefx", "t": "texto", "q": false}, ...]  (lo devuelve window.__frases() del juego)
Crea <juego>/voz/<hash>.mp3 y <juego>/voz/q/<hash>.mp3 con sus index.json {hash: duración}."""
import json, os, sys, wave, subprocess, tempfile
from piper import PiperVoice
MODELOS = {'davefx': 'es_ES-davefx-medium', 'sharvard': 'es_ES-sharvard-medium', 'carlfm': 'es_ES-carlfm-x_low', 'ald': 'es_MX-ald-medium', 'daniela': 'es_AR-daniela-high'}
def fnv(s):
    h = 0x811c9dc5
    for b in s.encode('utf-8'):
        h ^= b; h = (h * 0x01000193) & 0xffffffff
    return '%08x' % h
frases, juego = json.load(open(sys.argv[1])), sys.argv[2]
modelos = sys.argv[3] if len(sys.argv) > 3 else '/workspace/piper'
cache = {}
idx = {}
for sub in ('', 'q'):
    d = os.path.join(juego, 'voz', sub); os.makedirs(d, exist_ok=True)
    p = os.path.join(d, 'index.json'); idx[sub] = json.load(open(p)) if os.path.exists(p) else {}
hechas = 0
for f in frases:
    v, t, q = f['v'], f['t'].strip(), bool(f.get('q'))
    if not t: continue
    sub = 'q' if q else ''; h = fnv(v + '|' + t); out = os.path.join(juego, 'voz', sub, h + '.mp3')
    if h in idx[sub] and os.path.exists(out): continue
    if v not in cache: cache[v] = PiperVoice.load(os.path.join(modelos, MODELOS[v] + '.onnx'))
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp: wav = tmp.name
    with wave.open(wav, 'wb') as w: cache[v].synthesize_wav(t, w)
    with wave.open(wav, 'rb') as w: dur = w.getnframes() / w.getframerate()
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-ac', '1', '-ar', '22050', '-b:a', '40k', out], check=True); os.unlink(wav)
    idx[sub][h] = round(dur, 2); hechas += 1
    if hechas % 25 == 0: print(hechas, 'frases…', flush=True)
for sub in ('', 'q'):
    json.dump(idx[sub], open(os.path.join(juego, 'voz', sub, 'index.json'), 'w'))
print('nuevas', hechas, 'total', len(idx['']), '+', len(idx['q']))
