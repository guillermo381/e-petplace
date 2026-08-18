#!/usr/bin/env python3
"""
auditar-imagenes.py — MIDE UN LOTE DE IMÁGENES DE CATÁLOGO CONTRA EL ESTÁNDAR.

═══════════════════════════════════════════════════════════════════════════
POR QUÉ EXISTE: las galerías de marca no vienen normalizadas — en la misma
carpeta llegan packshots sobre blanco, PNG transparentes, fotos de ambiente y
resoluciones de 400 a 4000 px. **Con quinientas imágenes el ojo no alcanza y
el criterio se afloja en la número cincuenta.**

🔴 **NO PROCESA: MIDE.** No recorta, no convierte, no escribe nada. Su trabajo
es decir **cuáles van a quedar mal ANTES de que estén adentro** — porque una
vez cargadas, el costo de sacarlas es otro.

El estándar que aplica vive en `docs/diseno/ESTANDAR-DE-IMAGEN-Y-NOMBRE.md`.
Si esa letra cambia, **este archivo cambia con ella** (los umbrales están
todos juntos abajo, con su fuente).
═══════════════════════════════════════════════════════════════════════════

USO:
    python3 scripts/auditar-imagenes.py <carpeta>
    python3 scripts/auditar-imagenes.py <carpeta> --detalle

⚠️ DEPENDENCIA DECLARADA: usa **Pillow (PIL)**, que no está en el `package.json`
del repo — es una herramienta de escritorio para quien carga el catálogo, no
parte del build. Si falta:  python3 -m pip install Pillow
"""

import sys
import os
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("✖ Falta Pillow.  Instalalo con:  python3 -m pip install Pillow")
    sys.exit(2)

# ── LOS UMBRALES, con su fuente ────────────────────────────────────────────
# Instacart [SPEC]: 1:1 · mín 600×600 · fondo blanco · producto al 85 % del área.
# eBay Playbook [SPEC]: 1:1 «our dominant and recommended ratio».
LADO_MINIMO = 600
LADO_RECOMENDADO = 1000
TOLERANCIA_CUADRADA = 0.05      # ±5 % se considera cuadrada
OCUPACION_OBJETIVO = 0.85
OCUPACION_MINIMA = 0.60         # menos: el producto se pierde
OCUPACION_MAXIMA = 0.95         # más: pegado al borde
PESO_MAXIMO_KB = 400
BLANCO_MINIMO = 245             # un canal ≥ esto cuenta como blanco

EXTENSIONES = {".jpg", ".jpeg", ".png", ".webp"}


def analiza(ruta: Path):
    """Devuelve las medidas de UNA imagen. Nada de veredictos todavía."""
    im = Image.open(ruta)
    w, h = im.size
    peso_kb = ruta.stat().st_size / 1024
    tiene_alfa = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)

    # ── EL FONDO: se mira el BORDE, no el centro ──────────────────────────
    # El centro es el producto. Lo que dice si el fondo sirve es el marco.
    rgba = im.convert("RGBA")
    px = rgba.load()
    borde = []
    paso = max(1, w // 60)
    for x in range(0, w, paso):
        borde.append(px[x, 0])
        borde.append(px[x, h - 1])
    for y in range(0, h, max(1, h // 60)):
        borde.append(px[0, y])
        borde.append(px[w - 1, y])

    transparentes = sum(1 for p in borde if p[3] < 20)
    blancos = sum(1 for p in borde if p[3] >= 20 and p[0] >= BLANCO_MINIMO and p[1] >= BLANCO_MINIMO and p[2] >= BLANCO_MINIMO)
    n = len(borde)
    if transparentes / n > 0.9:
        fondo = "transparente"
    elif blancos / n > 0.9:
        fondo = "blanco"
    else:
        fondo = "otro"

    # ── CUÁNTO OCUPA EL PRODUCTO ──────────────────────────────────────────
    # El producto es lo que NO es fondo. Se busca su caja envolvente.
    chico = rgba.resize((min(w, 300), min(h, 300)))
    cw, ch = chico.size
    cp = chico.load()

    def es_fondo(p):
        if fondo == "transparente":
            return p[3] < 20
        if fondo == "blanco":
            return p[0] >= BLANCO_MINIMO and p[1] >= BLANCO_MINIMO and p[2] >= BLANCO_MINIMO
        return False  # fondo 'otro': no se puede separar con confianza

    if fondo == "otro":
        ocupacion = None
    else:
        xs, ys = [], []
        for x in range(cw):
            for y in range(ch):
                if not es_fondo(cp[x, y]):
                    xs.append(x)
                    ys.append(y)
        if not xs:
            ocupacion = 0.0
        else:
            ancho_prod = (max(xs) - min(xs) + 1) / cw
            alto_prod = (max(ys) - min(ys) + 1) / ch
            # el lado mayor del producto contra el lado de la imagen: es lo
            # que decide si "llena" o "flota"
            ocupacion = max(ancho_prod, alto_prod)

    return {
        "w": w, "h": h, "peso_kb": peso_kb, "alfa": tiene_alfa,
        "fondo": fondo, "ocupacion": ocupacion,
        "relacion": w / h,
    }


def veredicto(m):
    """entra / trabajo / no-entra, con TODOS los motivos (no solo el primero)."""
    motivos = []
    grave = False

    if min(m["w"], m["h"]) < LADO_MINIMO:
        motivos.append(f"resolución {m['w']}×{m['h']} < {LADO_MINIMO} mínimo")
        grave = True
    elif min(m["w"], m["h"]) < LADO_RECOMENDADO:
        motivos.append(f"resolución {m['w']}×{m['h']} (recomendado {LADO_RECOMENDADO})")

    if abs(m["relacion"] - 1) > TOLERANCIA_CUADRADA:
        motivos.append(f"no es cuadrada ({m['w']}×{m['h']}, relación {m['relacion']:.2f})")

    if m["fondo"] == "otro":
        motivos.append("el fondo no es blanco ni transparente")

    if m["ocupacion"] is None:
        motivos.append("no se pudo medir cuánto ocupa el producto (fondo no separable)")
    elif m["ocupacion"] < OCUPACION_MINIMA:
        motivos.append(f"el producto ocupa {m['ocupacion']*100:.0f} % (objetivo ~{OCUPACION_OBJETIVO*100:.0f} %): queda chico")
    elif m["ocupacion"] > OCUPACION_MAXIMA:
        motivos.append(f"el producto ocupa {m['ocupacion']*100:.0f} %: pegado al borde")

    if m["peso_kb"] > PESO_MAXIMO_KB:
        motivos.append(f"pesa {m['peso_kb']:.0f} kB (máx {PESO_MAXIMO_KB})")

    if not motivos:
        return "entra", []
    return ("no-entra" if grave else "trabajo"), motivos


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    detalle = "--detalle" in sys.argv
    if not args:
        print(__doc__)
        sys.exit(1)

    carpeta = Path(args[0])
    if not carpeta.is_dir():
        print(f"✖ No es una carpeta: {carpeta}")
        sys.exit(2)

    imagenes = sorted(p for p in carpeta.rglob("*") if p.suffix.lower() in EXTENSIONES)
    if not imagenes:
        print(f"✖ No hay imágenes en {carpeta}")
        sys.exit(2)

    cuentas = {"entra": 0, "trabajo": 0, "no-entra": 0}
    filas = []
    for ruta in imagenes:
        try:
            m = analiza(ruta)
        except Exception as e:  # una imagen rota es un dato, no una excepción
            cuentas["no-entra"] += 1
            filas.append(("no-entra", ruta.name, [f"no se pudo abrir: {e}"]))
            continue
        v, motivos = veredicto(m)
        cuentas[v] += 1
        filas.append((v, ruta.name, motivos))

    icono = {"entra": "✅", "trabajo": "⚠️ ", "no-entra": "❌"}
    for v in ("no-entra", "trabajo", "entra"):
        de_este = [f for f in filas if f[0] == v]
        if not de_este:
            continue
        print(f"\n── {v.upper()} ({len(de_este)}) ──")
        for _, nombre, motivos in de_este:
            if v == "entra" and not detalle:
                print(f"  {icono[v]} {nombre}")
            else:
                print(f"  {icono[v]} {nombre}")
                for mo in motivos:
                    print(f"       · {mo}")

    total = len(imagenes)
    print(f"\n═══ {total} imagen(es) · ✅ {cuentas['entra']} entra(n) · "
          f"⚠️  {cuentas['trabajo']} necesita(n) trabajo · ❌ {cuentas['no-entra']} no entra(n) ═══")
    print("El estándar: docs/diseno/ESTANDAR-DE-IMAGEN-Y-NOMBRE.md")
    # Código de salida: 0 si NINGUNA es grave. Las de 'trabajo' no frenan una
    # carga — la avisan. *Un auditor que aborta por un margen de más obliga a
    # ignorarlo, y un instrumento que se ignora no mide nada.*
    sys.exit(1 if cuentas["no-entra"] else 0)


if __name__ == "__main__":
    main()
