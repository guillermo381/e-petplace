#!/usr/bin/env python3
"""
censar-acento.py — CUÁNTO ACENTO GASTA UNA PANTALLA, Y EN QUÉ (S100b-B).

═══════════════════════════════════════════════════════════════════════════
POR QUÉ EXISTE: el founder lo pidió expreso —*«¿el acento marca la acción
principal, o también decora bordes, íconos, chips y separadores?»*— y **N5 es
ley firmada: UN ACENTO POR PANTALLA.** Hasta hoy esa ley no tenía instrumento:
se cumplía o no se cumplía por criterio de quien construía.

🔴 **MIDE PÍXELES DE UNA CAPTURA REAL, no el código.** Un censo por `grep` de
`accent.` cuenta *declaraciones*; esto cuenta **lo que la pantalla pinta**, que
es lo que el ojo recibe. *Un acento declarado una vez puede ocupar media
pantalla, y diez declaraciones pueden no verse.*

⚠️ **LO QUE NO PUEDE DECIR:** si el reparto está BIEN. Dice cuánto y dónde —
**el juicio es del ojo.** Su verde no existe: no tiene veredicto, tiene números.
═══════════════════════════════════════════════════════════════════════════

USO:
    python3 scripts/censar-acento.py <captura.png> [más capturas...]
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("✖ Falta Pillow.  python3 -m pip install Pillow")
    sys.exit(2)

# ── LOS COLORES DE MARCA, de `palette.ts` ──────────────────────────────────
# Se listan con su nombre para que el reporte diga CUÁL se gastó, no solo
# «hay acento». Si la paleta cambia, esta tabla cambia con ella.
MARCA = {
    "magentaDark #8E1F68": (0x8E, 0x1F, 0x68),
    "pink #FF00AF": (0xFF, 0x00, 0xAF),
    "pinkDark #C4008A": (0xC4, 0x00, 0x8A),
    "pinkVivo #DF00A1": (0xDF, 0x00, 0xA1),
    "ctaOro #FCBC1D": (0xFC, 0xBC, 0x1D),
    "tealDark #0A7268": (0x0A, 0x72, 0x68),
}
# Tolerancia por canal: una captura tiene antialias y compresión, así que el
# hex exacto casi no aparece — pero un tono de marca sí cae cerca.
TOLERANCIA = 26


def cerca(p, ref):
    return all(abs(p[i] - ref[i]) <= TOLERANCIA for i in range(3))


def censa(ruta: Path):
    im = Image.open(ruta).convert("RGB")
    w, h = im.size
    px = im.load()

    # La barra de tabs y la barra del sistema no son "la pantalla": son
    # cromo permanente. Se miden APARTE para que no inflen el porcentaje de
    # una pantalla que quizá no gasta nada de acento en su contenido.
    # (1080x2340 del aparato del gate: barra de tabs desde ~1966.)
    corte_tabs = int(h * 0.84)

    conteo = {k: 0 for k in MARCA}
    conteo_tabs = {k: 0 for k in MARCA}
    distintos = set()
    total_contenido = 0

    paso = 2  # submuestreo: 1 de cada 2 px por eje. Suficiente para %, 4x más rápido.
    for y in range(0, h, paso):
        for x in range(0, w, paso):
            p = px[x, y]
            distintos.add((p[0] // 16, p[1] // 16, p[2] // 16))
            en_tabs = y >= corte_tabs
            if not en_tabs:
                total_contenido += 1
            for nombre, ref in MARCA.items():
                if cerca(p, ref):
                    (conteo_tabs if en_tabs else conteo)[nombre] += 1
                    break

    return {
        "nombre": ruta.name,
        "conteo": conteo,
        "conteo_tabs": conteo_tabs,
        "total_contenido": total_contenido,
        "distintos": len(distintos),
    }


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    for arg in sys.argv[1:]:
        r = censa(Path(arg))
        usados = {k: v for k, v in r["conteo"].items() if v > 0}
        usados_tabs = {k: v for k, v in r["conteo_tabs"].items() if v > 0}
        tinta = sum(usados.values())
        pct = tinta / r["total_contenido"] * 100 if r["total_contenido"] else 0

        print(f"\n═══ {r['nombre']} ═══")
        print(f"  familias de color distintas en pantalla: ~{r['distintos']}")
        print(f"  PÍXELES DE MARCA EN EL CONTENIDO: {pct:.2f} % del área útil")
        if usados:
            for k, v in sorted(usados.items(), key=lambda kv: -kv[1]):
                print(f"     · {k:<22} {v/r['total_contenido']*100:>6.2f} %")
        else:
            print("     · (ninguno — el contenido no gasta color de marca)")
        print(f"  en la BARRA DE TABS (cromo permanente, medido aparte):")
        if usados_tabs:
            for k, v in sorted(usados_tabs.items(), key=lambda kv: -kv[1]):
                print(f"     · {k:<22} {v} px")
        else:
            print("     · (ninguno)")

    print("\n⚠️  Esto dice CUÁNTO y CUÁL, jamás si el reparto está bien.")
    print("   N5 pide UN acento por pantalla: dos familias de marca a la vez")
    print("   en el mismo contenido es la señal a mirar con el ojo.")


if __name__ == "__main__":
    main()
