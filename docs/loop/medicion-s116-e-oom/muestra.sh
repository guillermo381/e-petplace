#!/bin/bash
# Muestra una linea CSV del estado de memoria del proceso cliente.
# Uso: muestra.sh <etiqueta>
D=emulator-5560
PID=$(adb -s $D shell pidof com.epetplace.cliente </dev/null | tr -d '\r')
if [ -z "$PID" ]; then echo "$1,MUERTO,,,,,,,,,,,,,,"; exit 0; fi
M=$(adb -s $D shell dumpsys meminfo $PID </dev/null 2>/dev/null)
# PSS: la linea "Dalvik Heap" col 2 = PSS Total ; "TOTAL PSS" al final
DPSS=$(echo "$M"   | awk '/^ *Dalvik Heap/ {print $3; exit}')
DALLOC=$(echo "$M" | awk '/^ *Dalvik Heap/ {print $9; exit}')   # $9 = Heap Alloc (la que corre contra el growth limit de 192m). $NF es Heap FREE: ese era el bug.
NALLOC=$(echo "$M" | awk '/^ *Native Heap/ {print $9; exit}')
NPSS=$(echo "$M"   | awk '/^ *Native Heap/ {print $3; exit}')
TPSS=$(echo "$M"   | awk '/^ *TOTAL PSS:/ {print $3; exit}')
VIEWS=$(echo "$M"  | awk '/Views:/ {print $2; exit}')
VRI=$(echo "$M"    | awk '/ViewRootImpl:/ {print $4; exit}')
ACT=$(echo "$M"    | awk '/Activities:/ {print $4; exit}')
APPC=$(echo "$M"   | awk '/AppContexts:/ {print $2; exit}')
ASSETS=$(echo "$M" | awk '/Assets:/ {print $2; exit}')
BMPC=$(echo "$M"   | awk '/Bitmap \(malloced\)/ {print $3; exit}')
BMPKB=$(echo "$M"  | awk '/Bitmap \(malloced\)/ {print $4; exit}')
THR=$(adb -s $D shell ls /proc/$PID/task </dev/null 2>/dev/null | wc -l | tr -d ' ')
OKD=$(adb -s $D shell "for t in /proc/$PID/task/*; do cat \$t/comm 2>/dev/null; done" </dev/null 2>/dev/null | grep -c "OkHttp Dispatch")
OKT=$(adb -s $D shell "for t in /proc/$PID/task/*; do cat \$t/comm 2>/dev/null; done" </dev/null 2>/dev/null | grep -c "OkHttp TaskRunn")
echo "$1,$PID,$DPSS,$DALLOC,$NPSS,$NALLOC,$TPSS,$VIEWS,$VRI,$ACT,$APPC,$ASSETS,$BMPC,$BMPKB,$THR,$OKD,$OKT"
