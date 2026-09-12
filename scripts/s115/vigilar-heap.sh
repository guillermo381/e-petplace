#!/usr/bin/env bash
# VIGÍA DE HEAP EN VIVO — `D-1074`
#
# 🔴 UNA SOLA CORRIDA PARA TODAS LAS FASES. Anoche se perdió la ventana dos
#    veces por tomar la medición con un `sleep` fijo: o llega tarde y la app ya
#    murió, o llega temprano y el culpable no se ve. Esto vigila continuo y
#    dispara el volcado SOLO cuando el heap cruza el umbral.
#
# 🔴 MIDE CUATRO COSAS Y NO UNA, porque el Java Heap solo no discrimina:
#      Java Heap   → objetos Java (el puente, OkHttp, AsyncStorage, Views)
#      Native Heap → WebRTC, imágenes decodificadas, buffers nativos
#      Views       → si SUBE sin parar es un bucle de render/layout
#      Activities  → si sube, algo no se destruye al navegar
#    *Con los cuatro, el resultado dice EN QUÉ CAPA está antes de abrir el dump.*
#
# Uso:  bash scripts/s115/vigilar-heap.sh [umbral_MB]
# Fase: echo "paso 3 · abro despensa" > /tmp/epp-fase   ← se anota en el log

P=com.epetplace.cliente
UMBRAL=${1:-170}
LOG=~/Downloads/epp-heap-$(date +%H%M%S).log
: > /tmp/epp-fase

echo "vigía · umbral ${UMBRAL} MB · log: $LOG"
printf "%-9s %-10s %-11s %-8s %-7s %-6s %s\n" hora java native totalPSS views acts fase | tee "$LOG"

t0=$(date +%s)
while true; do
  M=$(adb shell dumpsys meminfo $P 2>/dev/null)
  if [ -z "$M" ]; then
    printf "%-9s %s\n" "$(date +%H:%M:%S)" "— el proceso NO está vivo (¿murió?)" | tee -a "$LOG"
    sleep 3; continue
  fi
  JAVA=$(  echo "$M" | awk '/Java Heap:/   {print int($3/1024); exit}')
  NAT=$(   echo "$M" | awk '/Native Heap:/ {print int($3/1024); exit}')
  PSS=$(   echo "$M" | awk '/TOTAL PSS:/   {print int($3/1024); exit}')
  VIEWS=$( echo "$M" | awk '/^ *Views:/    {print $2; exit}')
  ACTS=$(  echo "$M" | awk '/Activities:/  {print $2; exit}')
  FASE=$(cat /tmp/epp-fase 2>/dev/null)
  printf "%-9s %-10s %-11s %-8s %-7s %-6s %s\n" \
    "$(date +%H:%M:%S)" "${JAVA:-?}MB" "${NAT:-?}MB" "${PSS:-?}MB" "${VIEWS:-?}" "${ACTS:-?}" "$FASE" | tee -a "$LOG"

  if [ "${JAVA:-0}" -ge "$UMBRAL" ]; then
    echo "  🔴 ${JAVA}MB ≥ ${UMBRAL} — VOLCANDO" | tee -a "$LOG"
    adb shell am dumpheap $P /data/local/tmp/epp.hprof
    sleep 12
    adb pull /data/local/tmp/epp.hprof ~/Downloads/epp.hprof && ls -lh ~/Downloads/epp.hprof | tee -a "$LOG"
    echo "  listo. Avisá y lo leo." | tee -a "$LOG"
    break
  fi
  sleep 3
done
