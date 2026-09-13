#!/bin/bash
# FASE 5 (CONTROL DEFINITIVO): navegacion por TOQUE de la barra de tabs.
# Si aca la memoria queda plana y por deep link crece => el crecimiento es del METODO,
# porque la poda (popToTop) esta atada al onCambiar de BarraTabs, que solo dispara el press.
SP="$(dirname "$0")"; D=emulator-5560
W=$1; H=$2                       # ancho y alto en px
Y=$(( H - 110 ))               # la barra de tabs vive SOBRE la gesture bar (~48 px): H-60 caeria en el sistema
# 5 tabs => centros en W/10, 3W/10, 5W/10, 7W/10, 9W/10
XS=($(( W/10 )) $(( 3*W/10 )) $(( W/2 )) $(( 7*W/10 )) $(( 9*W/10 )))
adb -s $D shell am force-stop com.epetplace.cliente </dev/null >/dev/null 2>&1; sleep 2
adb -s $D shell am start -a android.intent.action.VIEW -d "cliente://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" </dev/null >/dev/null 2>&1
sleep 45
echo "n,etiqueta,pid,dalvik_pss_kb,dalvik_alloc_kb,native_pss_kb,native_alloc_kb,total_pss_kb,views,viewroot,activities,appcontexts,assets,bitmap_n,bitmap_kb,hilos,okhttp_disp,okhttp_task" > "$SP/fase5.csv"
printf "0," >> "$SP/fase5.csv"; "$SP/muestra.sh" "fresco" >> "$SP/fase5.csv"
N=0
for ciclo in $(seq 1 8); do
  for i in 0 1 2 3 4; do
    N=$((N+1))
    adb -s $D shell input tap ${XS[$i]} $Y </dev/null >/dev/null 2>&1
    sleep 2
    printf "%s," "$N" >> "$SP/fase5.csv"; "$SP/muestra.sh" "tap-tab$i" >> "$SP/fase5.csv"
  done
  [ $((ciclo % 4)) -eq 0 ] && echo "  ciclo $ciclo · $N taps"
done
echo "FASE 5 LISTA: $N taps de tab"
