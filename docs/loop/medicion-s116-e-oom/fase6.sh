#!/bin/bash
# FASE 6: 66 rutas UNICAS, sin repetir ninguna. Es el diseno del barrido original,
# que es el que cayo. La fase 3 (20 rutas repetidas) NO reproduce: es ciclica y estable.
SP="$(dirname "$0")"; D=emulator-5560
RUTAS=(); while IFS= read -r l; do [ -n "$l" ] && RUTAS+=("$l"); done < "$SP/rutas-unicas.txt"   # mapfile NO existe en bash 3.2 (macOS): daba 0 rutas y el log decia "sin caer"
echo "CONTROL: ${#RUTAS[@]} rutas unicas (esperado 66)"
adb -s $D shell am force-stop com.epetplace.cliente </dev/null >/dev/null 2>&1; sleep 2
adb -s $D shell am start -a android.intent.action.VIEW -d "cliente://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" </dev/null >/dev/null 2>&1
echo "app relanzada, bundle 45 s"; sleep 45
PID0=$(adb -s $D shell pidof com.epetplace.cliente </dev/null | tr -d '\r'); echo "PID fresco: $PID0"
echo "nav,etiqueta,pid,dalvik_pss_kb,dalvik_alloc_kb,native_pss_kb,native_alloc_kb,total_pss_kb,views,viewroot,activities,appcontexts,assets,bitmap_n,bitmap_kb,hilos,okhttp_disp,okhttp_task" > "$SP/fase6.csv"
printf "0," >> "$SP/fase6.csv"; "$SP/muestra.sh" "00-fresco" >> "$SP/fase6.csv"
N=0
for r in "${RUTAS[@]}"; do
  N=$((N+1))
  adb -s $D shell am start -a android.intent.action.VIEW -d "cliente:///$r" </dev/null >/dev/null 2>&1
  sleep 3
  L=$("$SP/muestra.sh" "${r//\//_}"); echo "$N,$L" >> "$SP/fase6.csv"
  P=$(echo "$L" | cut -d, -f2)
  if [ "$P" = "MUERTO" ] || [ "$P" != "$PID0" ]; then
    echo ">>> CAYO EN NAV $N · ruta=$r · pid=$P"; echo "$N|$r" > "$SP/murio_en.txt"; exit 0
  fi
  [ $((N % 10)) -eq 0 ] && echo "  nav $N · dAlloc $(echo "$L"|cut -d, -f5)kB · views $(echo "$L"|cut -d, -f9) · nPSS $(echo "$L"|cut -d, -f6)kB"
done
echo ">>> LAS $N RUTAS UNICAS SIN CAER"
