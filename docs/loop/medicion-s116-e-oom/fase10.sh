#!/bin/bash
# FASE 10: LA CORRIDA LARGA, HASTA LA CAIDA.
# La proyeccion de la fase 6 (0,80-1,01 MB/nav) pone el techo de 192 MB a ~218 navegaciones.
# El barrido original no reiniciaba el proceso entre pasadas, asi que su acumulado real
# era MUCHO mayor que las ~67 de la pasada en que se vio caer.
# Recorre las 89 unicas y despues sigue ciclando: mide cada 2 navegaciones.
SP="$(dirname "$0")"; D=emulator-5560
RUTAS=(); while IFS= read -r l; do [ -n "$l" ] && RUTAS+=("$l"); done < "$SP/rutas-todas.txt"
echo "CONTROL: ${#RUTAS[@]} rutas (esperado 89)"
adb -s $D shell am force-stop com.epetplace.cliente </dev/null >/dev/null 2>&1; sleep 2
adb -s $D shell am start -a android.intent.action.VIEW -d "cliente://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" </dev/null >/dev/null 2>&1
sleep 45
PID0=$(adb -s $D shell pidof com.epetplace.cliente </dev/null | tr -d '\r'); echo "PID fresco: $PID0"
echo "nav,etiqueta,pid,dalvik_pss_kb,dalvik_alloc_kb,native_pss_kb,native_alloc_kb,total_pss_kb,views,viewroot,activities,appcontexts,assets,bitmap_n,bitmap_kb,hilos,okhttp_disp,okhttp_task" > "$SP/fase10.csv"
printf "0," >> "$SP/fase10.csv"; "$SP/muestra.sh" "00-fresco" >> "$SP/fase10.csv"
N=0; PASADA=0
while [ $N -lt 300 ]; do
  PASADA=$((PASADA+1))
  for r in "${RUTAS[@]}"; do
    N=$((N+1))
    adb -s $D shell am start -a android.intent.action.VIEW -d "cliente:///$r" </dev/null >/dev/null 2>&1
    sleep 3
    # PID barato en cada paso; muestra completa cada 2
    P=$(adb -s $D shell pidof com.epetplace.cliente </dev/null | tr -d '\r')
    if [ -z "$P" ] || [ "$P" != "$PID0" ]; then
      printf "%s," "$N" >> "$SP/fase10.csv"; "$SP/muestra.sh" "CAIDA-${r//\//_}" >> "$SP/fase10.csv"
      echo ">>> CAYO EN NAV $N · pasada $PASADA · ruta=$r · pid=$P"; echo "$N|$PASADA|$r" > "$SP/murio_en.txt"; exit 0
    fi
    if [ $((N % 2)) -eq 0 ]; then
      L=$("$SP/muestra.sh" "p${PASADA}-${r//\//_}"); echo "$N,$L" >> "$SP/fase10.csv"
      [ $((N % 20)) -eq 0 ] && echo "  nav $N (pasada $PASADA) · dAlloc $(echo "$L"|cut -d, -f5)kB · Views $(echo "$L"|cut -d, -f9)"
    fi
  done
done
echo ">>> $N NAVEGACIONES SIN CAER (tope del script)"
