#!/usr/bin/env python3
"""medir-s100dbis-b.py — el instrumento de las TRES regresiones (S100d·bis, pista B).

Vuelca el árbol de uiautomator y reporta nodos por regex, con sus cajas en dp.

🔴 LOS DOS GUARDS QUE TRAE, y los dos salen de errores medidos hoy y ayer:

  ① **declara SIEMPRE en qué pantalla midió** (el paquete + la actividad + una
     huella del texto visible). *C casi invierte un veredicto porque su arrastre
     había NAVEGADO y el Δ correcto contestaba otra pregunta.*
  ② **el árbol mide LAYOUT, no PINTADO.** Un nodo presente con su caja entera
     puede verse cortado si algo lo tapa. ⇒ toda medición de "¿se ve?" se
     acompaña de captura. *La señal de verificación de la vuelta pasada dio
     verde sobre un control cortado.*

Uso:
    python3 scripts/medir-s100dbis-b.py <regex> [<regex> ...]
    python3 scripts/medir-s100dbis-b.py --arbol        # vuelca todo el texto
"""
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

# 1080 × 2340 @ 450 dpi ⇒ 2.8125 px por dp (medido en S100c, mismo aparato)
PX_POR_DP = 450 / 160.0


def sh(cmd: str) -> str:
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout


def dp(v: int) -> float:
    return round(v / PX_POR_DP, 1)


def volcar() -> str:
    sh("adb shell uiautomator dump /sdcard/w.xml >/dev/null 2>&1")
    return sh("adb shell cat /sdcard/w.xml")


def donde() -> str:
    """Guard ①: en qué pantalla estamos. Se imprime SIEMPRE, antes de todo."""
    foco = sh("adb shell dumpsys window 2>/dev/null | grep -E 'mCurrentFocus'").strip()
    return foco or "(sin foco legible)"


def main() -> None:
    args = sys.argv[1:]
    xml = volcar()
    print(f"PANTALLA: {donde()}")
    try:
        raiz = ET.fromstring(xml)
    except ET.ParseError as e:
        print(f"⚠️ árbol ilegible: {e}")
        return

    nodos = []
    for n in raiz.iter("node"):
        b = n.get("bounds") or ""
        m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", b)
        if not m:
            continue
        x1, y1, x2, y2 = (int(g) for g in m.groups())
        etiqueta = " ".join(
            filter(None, [n.get("text") or "", n.get("content-desc") or "", n.get("resource-id") or ""])
        ).strip()
        nodos.append((etiqueta, n.get("class") or "", x1, y1, x2, y2, n.get("clickable")))

    if not args or args == ["--arbol"]:
        for etiqueta, clase, x1, y1, x2, y2, clic in nodos:
            if etiqueta:
                print(
                    f"  {etiqueta[:60]:60s} | {clase.split('.')[-1]:14s} "
                    f"x[{dp(x1):6.1f},{dp(x2):6.1f}] y[{dp(y1):6.1f},{dp(y2):6.1f}] "
                    f"{dp(x2 - x1):5.1f}×{dp(y2 - y1):5.1f} clic={clic}"
                )
        return

    for patron in args:
        rx = re.compile(patron, re.I)
        print(f"\n── /{patron}/ ──")
        hallados = 0
        for etiqueta, clase, x1, y1, x2, y2, clic in nodos:
            if rx.search(etiqueta) or rx.search(clase):
                hallados += 1
                print(
                    f"  {etiqueta[:52]:52s} | {clase.split('.')[-1]:12s} "
                    f"x[{dp(x1):6.1f},{dp(x2):6.1f}] y[{dp(y1):6.1f},{dp(y2):6.1f}] "
                    f"{dp(x2 - x1):5.1f}×{dp(y2 - y1):5.1f} clic={clic}"
                )
        if hallados == 0:
            print("  (0 nodos) ⚠️ ausencia del ÁRBOL — puede ser recorte de layout o pantalla equivocada")


if __name__ == "__main__":
    main()
