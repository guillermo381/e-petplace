#!/bin/bash
# CENSO DE TIEMPOS EN APARATO — S99-C · C4 · Carril R
#
# QUÉ MIDE, y qué NO (declarado adentro para que el después sea comparable):
#  · T_PRIMER_FRAME — de la intención al primer frame de la Activity
#    (`am start -W` → TotalTime). En una app React Native **esto NO es la app
#    usable**: es la ventana nativa arriba, casi siempre el splash. Reportarlo
#    como «abre en X ms» sería el número bonito y falso.
#  · T_JS — de la intención al primer log de JS (`[update]`): el bundle
#    cargado y corriendo.
#  · T_SESION — de la intención a `[sesion] raíz prestador`: el guard resolvió
#    quién sos, o sea el momento en que las tabs pueden montarse. **Es el
#    proxy más honesto de «la app sirve»** que existe sin instrumentar la app.
#
# LOS ANCLAS SON LOGS DE LA PROPIA APP: si un día dejan de emitirse, este
# script no miente — deja el campo vacío y se ve.
#
# Uso: bash scripts/s99/censo-tiempos-aparato.sh <n_corridas>
set -u
PKG=com.epetplace.prestador
ACT=$PKG/.MainActivity
N=${1:-3}

echo "corrida;t_primer_frame_ms;t_js_ms;t_sesion_ms"
for i in $(seq 1 "$N"); do
  adb shell am force-stop $PKG >/dev/null 2>&1
  adb logcat -c >/dev/null 2>&1
  sleep 2
  TF=$(adb shell am start -W -n $ACT 2>/dev/null | awk -F': ' '/TotalTime/{print $2}')
  sleep 8
  # el reloj cero es la línea START del sistema; los otros dos son de la app
  L=$(adb logcat -d -v epoch "ActivityTaskManager:I" "ReactNativeJS:V" "*:S" 2>/dev/null)
  T0=$(echo "$L" | grep -m1 "START u0 {act=android.intent.action.MAIN" | awk '{print $1}')
  [ -z "$T0" ] && T0=$(echo "$L" | grep -m1 "START u0" | awk '{print $1}')
  TJS=$(echo "$L" | grep -m1 "\[update\]" | awk '{print $1}')
  TSE=$(echo "$L" | grep -m1 "\[sesion\] raíz prestador" | awk '{print $1}')
  d() { [ -n "$1" ] && [ -n "$T0" ] && echo "$1 $T0" | awk '{printf "%.0f", ($1-$2)*1000}' || echo ""; }
  echo "$i;${TF:-};$(d "$TJS");$(d "$TSE")"
done
