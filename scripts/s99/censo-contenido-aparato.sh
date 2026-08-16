#!/bin/bash
# CENSO DE «CONTENIDO PINTADO» — S99-C · C4 · Carril R (complemento del cold)
#
# El `am start -W` mide hasta el PRIMER FRAME (el splash). Este mide hasta que
# el CONTENIDO REAL está en pantalla: sondea el árbol de accesibilidad hasta
# que aparece un texto que **solo existe con datos cargados**.
#
# 🔴 SU GRANULARIDAD SE DECLARA Y NO SE ESCONDE: cada sondeo cuesta lo que
# cuesta un `uiautomator dump` (se mide y se imprime). El número que sale es
# un TECHO — el contenido apareció en algún momento entre el sondeo anterior y
# éste. Se reporta el techo y el paso; promediarlos sería inventar precisión.
#
# Uso: bash censo-contenido-aparato.sh "<texto ancla>" <n_corridas> [ruta_tap]
set -u
PKG=com.epetplace.prestador
ACT=$PKG/.MainActivity
ANCLA=${1:?falta el texto ancla}
N=${2:-3}

echo "corrida;t_contenido_techo_ms;paso_sondeo_ms;sondeos"
for i in $(seq 1 "$N"); do
  adb shell am force-stop $PKG >/dev/null 2>&1
  sleep 2
  T0=$(python3 -c 'import time;print(int(time.time()*1000))')
  adb shell am start -n $ACT >/dev/null 2>&1
  ENCONTRADO=""; K=0; PASO=0
  while [ $K -lt 40 ]; do
    A=$(python3 -c 'import time;print(int(time.time()*1000))')
    if adb shell uiautomator dump /sdcard/_s.xml >/dev/null 2>&1 && \
       adb shell cat /sdcard/_s.xml 2>/dev/null | grep -q "$ANCLA"; then
      ENCONTRADO=$(python3 -c 'import time;print(int(time.time()*1000))')
      PASO=$(( ENCONTRADO - A ))
      break
    fi
    B=$(python3 -c 'import time;print(int(time.time()*1000))')
    PASO=$(( B - A ))
    K=$(( K + 1 ))
  done
  if [ -n "$ENCONTRADO" ]; then
    echo "$i;$(( ENCONTRADO - T0 ));$PASO;$(( K + 1 ))"
  else
    echo "$i;NO_APARECIO;$PASO;$K"
  fi
done
adb shell rm -f /sdcard/_s.xml >/dev/null 2>&1
