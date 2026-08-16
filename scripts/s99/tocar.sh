#!/bin/bash
# tocar.sh <texto> — toca el nodo clickable que CONTIENE ese texto.
# Nace porque las coordenadas fijas mienten: el techo del prestador cambia
# de alto según lo que tenga que decir, y un tap a ciegas cae en otro lado
# (o en nada, que es peor: se lee como «la app no responde»).
# uiautomator rebota con «could not get idle state» mientras haya una
# animación corriendo — y esta app entra con fundido. Se REINTENTA en vez
# de fallar: un dump que falla por timing se lee como «no está el botón».
for i in 1 2 3 4 5; do
  if adb shell uiautomator dump /sdcard/_u.xml 2>&1 | grep -q "dumped to"; then break; fi
  sleep 1.5
done
adb pull /sdcard/_u.xml /tmp/_u.xml >/dev/null 2>&1
adb shell rm /sdcard/_u.xml >/dev/null 2>&1
python3 - "$1" <<'PY'
import re, sys, subprocess
texto = sys.argv[1]
x = open('/tmp/_u.xml', encoding='utf-8').read()
nodos = re.findall(r'<node[^>]*>', x)
# el nodo con el texto; si no es clickable, el clickable que lo CONTIENE
cand = None
for n in nodos:
    t = re.search(r'text="([^"]*)"', n)
    if t and texto.lower() in t.group(1).lower():
        b = re.search(r'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', n)
        if b: cand = tuple(map(int, b.groups())); break
if cand is None:
    print(f'✗ no está en pantalla: «{texto}»'); sys.exit(2)
cx, cy = (cand[0]+cand[2])//2, (cand[1]+cand[3])//2
mejor = None
for n in nodos:
    if 'clickable="true"' not in n: continue
    b = re.search(r'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', n)
    if not b: continue
    x1,y1,x2,y2 = map(int, b.groups())
    if x1<=cx<=x2 and y1<=cy<=y2:
        area = (x2-x1)*(y2-y1)
        if mejor is None or area < mejor[0]: mejor = (area, (x1+x2)//2, (y1+y2)//2)
tx, ty = (mejor[1], mejor[2]) if mejor else (cx, cy)
subprocess.run(['adb','shell','input','tap',str(tx),str(ty)])
print(f'✓ «{texto}» → ({tx},{ty})')
PY
