#!/bin/bash
# gesto-hoja.sh — MIDE SI LA HOJA RESPONDE AL GESTO (S116-B lote 16).
# Mismo guion antes y después de la cura: un instrumento que cambia entre
# las dos mediciones no compara nada.
#
# Los tres actos, y son los del buzón de C:
#   ① arrastre hacia ARRIBA sobre el contenido        ⇒ tiene que SCROLLEAR
#   ② arrastre hacia ABAJO desde el borde superior    ⇒ tiene que CERRAR
#   ③ FLING rápido hacia arriba (150 ms)              ⇒ tiene que SCROLLEAR
#
# 🔴 EL CONTROL QUE COSTÓ CUATRO MEDICIONES FALSAS: antes de medir hay que
# PROBAR que la hoja está abierta, y el brillo NO sirve para eso — el papel
# de la casa es casi blanco y pasa cualquier umbral de «claro». El
# discriminador real es el SCRIM: con la hoja abierta el TECHO se oscurece
# (medido: 112 contra 228). *Sin este control, «no se movió» y «no había
# hoja» dan exactamente el mismo número, y el segundo se lee como el primero.*
S=${S:-emulator-5578}
R=${1:-/tmp/gesto}
mkdir -p "$R"
cd "$(dirname "$0")/.."

# Devuelve la luminancia de la franja MÁS ALTA de la pantalla. <170 ⇒ hay
# scrim ⇒ hay hoja.
# ⚠️ La franja es angosta y va arriba de todo A PROPÓSITO: con
# `altura="completa"` la hoja tapa casi la pantalla entera, y un detector que
# mirara más abajo vería el papel blanco de la hoja y diría «no hay hoja»
# justo cuando hay la más grande. *Medido: 241 con la hoja completa abierta.*
techo() {
  node -e "
const {PNG}=require('pngjs');const fs=require('fs');
const p=PNG.sync.read(fs.readFileSync('$1'));
let s=0,n=0;
for(let y=150;y<205;y+=2)for(let x=100;x<1000;x+=4){const i=(p.width*y+x)<<2;s+=0.2126*p.data[i]+0.7152*p.data[i+1]+0.0722*p.data[i+2];n++;}
console.log((s/n).toFixed(1));"
}
hay_hoja() { [ "$(echo "$(techo "$1") < 170" | bc -l)" = "1" ]; }

# Cierra la hoja si quedó abierta y toca el chip. **No renavega**: con
# `?solo=` la sección cabe entera, así que la galería NO scrollea y el chip
# no se mueve — medido. Renavegar dejaba la app recargando y el tap caía en
# la pantalla de carga: tres intentos fallidos que se leían como «la hoja no
# abre».
abrir() {
  for intento in 1 2 3; do
    adb -s $S exec-out screencap -p > "$R/_probe.png"
    if hay_hoja "$R/_probe.png"; then
      adb -s $S shell input keyevent 4 >/dev/null 2>&1; sleep 2
    fi
    adb -s $S shell input tap 559 1020; sleep 3
    adb -s $S exec-out screencap -p > "$R/_probe.png"
    if hay_hoja "$R/_probe.png"; then return 0; fi
    adb -s $S shell am start -a android.intent.action.VIEW \
      -d "cliente:///gallery?solo=el%20modal%20del%20sistema" >/dev/null 2>&1
    sleep 8
  done
  echo "  ✗ NO SE PUDO ABRIR LA HOJA — no se mide (techo=$(techo "$R/_probe.png"))"
  return 1
}

medir() { # $1 nombre  $2 y0  $3 y1  $4 dur
  abrir || return 1
  adb -s $S exec-out screencap -p > "$R/$1-antes.png"
  echo "  antes:   hoja ABIERTA (techo $(techo "$R/$1-antes.png"))"
  adb -s $S shell input swipe 540 $2 540 $3 $4
  sleep 3
  adb -s $S exec-out screencap -p > "$R/$1-despues.png"
  if hay_hoja "$R/$1-despues.png"; then
    echo "  después: hoja ABIERTA (techo $(techo "$R/$1-despues.png"))"
  else
    echo "  después: hoja CERRADA (techo $(techo "$R/$1-despues.png"))"
  fi
  node scripts/desplazamiento.mjs "$R/$1-antes.png" "$R/$1-despues.png" 1400 2250 60 1020 | tail -2
}

echo "① ARRASTRE HACIA ARRIBA sobre el contenido (debe SCROLLEAR) · 400 ms"
medir arriba 2050 1450 400
echo
echo "② ARRASTRE HACIA ABAJO desde el borde superior (debe CERRAR) · 400 ms"
medir cerrar 1300 2250 400
echo
echo "③ FLING rápido hacia arriba (debe SCROLLEAR) · 150 ms"
medir fling 2050 1450 150
