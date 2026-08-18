#!/usr/bin/env python3
"""
censar-superficies.py — EL INSTRUMENTO DE LA LEY DE SUPERFICIES (S100c-B).

QUÉ MIDE, y por qué existe:
El founder nombró el mismo defecto en tres pantallas — *«como toda la pantalla
está sin fondo, todo está escrito directamente sobre el fondo, sin tener bordes
blancos, se pierde… el código se pierde porque queda entre colores»*. La casa
tiene el MATERIAL de superficies (`tokens/elevacion.ts`: dos niveles, halo, luz,
la regla Chanel del marco) y NO tiene la LEY de cuándo algo va en carta y cuándo
va apoyado sobre el fondo. Ninguna de N1–N20 la dice.

Una ley de superficies escrita en prosa es exactamente lo que S99 pagó con ocho
gates (cuatro traducciones de una referencia mandaron a construir un bulto que
la referencia no tenía). Por eso esto MIDE.

CÓMO MIDE — el método, declarado para que se pueda repetir y para que se sepa
qué NO ve:

  1. Recorta el cromo del sistema (barra de estado arriba, barra de gestos
     abajo) por porcentaje del alto, declarado por parámetro.
  2. MÁSCARA DE PLANITUD: un píxel cuenta solo si su vecindario local es
     uniforme (rango por canal ≤ `--plano`). Una foto, un degradado y una
     antialias de texto NO pasan. Esto se hace ANTES de contar, y es lo que
     evita que el ruido de una foto contamine el área y la caja de una carta.
  3. Cuantiza SOLO PARA AGRUPAR, y reporta el color EXACTO más frecuente de
     cada grupo. El contraste se calcula sobre el color exacto, jamás sobre la
     esquina del cubo.
  4. Reporta cada plano con su área, su caja, y su contraste WCAG contra el
     plano de FONDO (= el plano que toca los bordes laterales con más frecuencia).

🔴 LAS DOS TRAMPAS QUE ESTE INSTRUMENTO YA SE COBRÓ A SÍ MISMO — quien las
quite las reintroduce sin verlas:
  · Sin el color exacto (paso 3), `#FAF9F7` se reportaba como `#F8F8F0` y su
    contraste contra `#FFFFFF` salía **1.005** cuando el valor verdadero es
    **1.052**: un error de 10× en el único número que la ley usa. *Un contraste
    cuantizado no es un contraste aproximado: es otro número.*
  · Sin la máscara de planitud (paso 2), la caja de la carta blanca se comía la
    región de ruido de al lado, porque el ruido tiene píxeles que caen en el
    mismo cubo. *El área salía plausible y la caja, falsa.*

🔴 LOS DOS CEROS NO SON EL MISMO CERO — y por eso existe el segundo paso.
Medido el 18-ago-2026: `referencia-laika-resumen-pedido.jpeg` da **0 planos** y
nuestro detalle de pedido también. **No significan lo mismo.** Laika tiene SIETE
cartas ahí, separadas por un **hairline** sobre fondo casi-blanco: el relleno no
las distingue y el instrumento no las veía. Lo nuestro es un solo color al
88,5 %. *Apoyar la ley en esa equivalencia habría sido una conclusión correcta
sobre una premisa falsa.* ⇒ el censo cuenta TAMBIÉN las **reglas** (líneas finas
largas), y reporta los dos números juntos: **planos + reglas = separadores**.
Una pantalla con 0 planos y 12 reglas está separada; una con 0 y 0, no.

QUÉ NO VE — el límite, escrito antes de que alguien confíe de más:
  · No ve SOMBRAS. Dos superficies separadas solo por sombra siguen dándole
    contraste ~1.0 y cero reglas. Si el censo da 0/0, hay que mirar la captura
    antes de concluir — el reporte lo dice en vez de sentenciar.
  · No ve jerarquía: dice cuántos separadores hay, no si están bien repartidos.
  · Sobre un fondo con degradado (el Hogar) el «fondo» no es UN plano y el
    instrumento lo dice en vez de inventar uno.
  · 🔴 **EL CONTEO DE `reglas` NO ES COMPARABLE ENTRE FORMATOS.** Medido: las
    referencias JPEG de 540 px dan 22–36 reglas donde una captura PNG de 1080 px
    de la MISMA clase de pantalla da 4–11. La causa es el ringing del JPEG, que
    fabrica filas que diferen de sus dos vecinas. ⇒ `reglas` se compara
    **live-contra-live** (mismo aparato, mismo formato, mismo recorte) y jamás
    contra una referencia comprimida. **El número que sí cruza formatos es el
    ÁREA DE FONDO en %**, y por eso es el titular de la ley.

🔴 LO QUE ESTE INSTRUMENTO **NO** SIRVE PARA AUDITAR, y hay que decirlo acá
porque su compañero natural en una sesión con aparato es `uiautomator dump`:
**NINGUNA AUDITORÍA DE BLANCOS DE 44 (N8) SE HACE DESDE EL ÁRBOL SOLO** (L-299).
`uiautomator` **no reporta `hitSlop`**: las `bounds` son las del `View`, no las
del área táctil, así que **sub-reporta por exactamente `2 × hitSlop`**. Medido
el 18-ago-2026: el carrito del encabezado sale `23,8 dp` en el árbol y su
blanco real es **48 dp** (`hitSlop={spacing[3]}`), o sea que **cumple N8 con
margen**. Esta casa usa `hitSlop` como recurso firmado —es la forma de cumplir
N8 sin agrandar el píxel—, así que el falso positivo es la norma, no la
excepción. **Todo blanco se verifica contra la FUENTE, o contra el árbol MÁS
su `hitSlop`.**

USO:
  python3 scripts/censar-superficies.py <captura.png> [--recorte-sup 0.05]
         [--recorte-inf 0.06] [--min-area 0.012] [--json]

Dependencia declarada: Pillow (la misma que ya usa `auditar-imagenes.py`).
"""

import argparse
import json
import sys
from collections import Counter

try:
    from PIL import Image
except ImportError:
    print("falta Pillow: pip install Pillow", file=sys.stderr)
    sys.exit(2)


def luminancia_relativa(rgb):
    """WCAG 2.1 relative luminance."""
    def canal(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (canal(v) for v in rgb[:3])
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contraste(a, b):
    """Razón de contraste WCAG entre dos colores. 1.0 = idénticos."""
    la, lb = luminancia_relativa(a), luminancia_relativa(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def censar(ruta, recorte_sup, recorte_inf, min_area, granularidad=8, tol_plano=3):
    im = Image.open(ruta).convert("RGB")
    W, H = im.size
    y0 = int(H * recorte_sup)
    y1 = int(H * (1 - recorte_inf))
    util = im.crop((0, y0, W, y1))
    UW, UH = util.size
    px = util.load()
    paso = 3
    r_vec = 3  # radio del vecindario de planitud, en píxeles

    def es_plano_local(x, y):
        """El píxel cuenta solo si su vecindario es uniforme. Mata foto,
        degradado y antialias de texto ANTES de contar."""
        lo = [255, 255, 255]
        hi = [0, 0, 0]
        for dy in (-r_vec, 0, r_vec):
            yy = y + dy
            if yy < 0 or yy >= UH:
                return False
            for dx in (-r_vec, 0, r_vec):
                xx = x + dx
                if xx < 0 or xx >= UW:
                    return False
                c = px[xx, yy]
                for i in range(3):
                    if c[i] < lo[i]:
                        lo[i] = c[i]
                    if c[i] > hi[i]:
                        hi[i] = c[i]
        return max(hi[i] - lo[i] for i in range(3)) <= tol_plano

    # 1) máscara de planitud + conteo por cubo, guardando el color EXACTO
    q = granularidad
    cuenta = Counter()
    exactos = {}          # cubo -> Counter de colores exactos
    puntos = {}           # cubo -> lista de (x, y) de píxeles planos
    total = 0
    for y in range(0, UH, paso):
        for x in range(0, UW, paso):
            total += 1
            if not es_plano_local(x, y):
                continue
            c = px[x, y]
            cubo = (c[0] // q * q, c[1] // q * q, c[2] // q * q)
            cuenta[cubo] += 1
            exactos.setdefault(cubo, Counter())[c] += 1
            puntos.setdefault(cubo, []).append((x, y))

    candidatos = [(c, n) for c, n in cuenta.most_common(24) if n / total >= min_area]

    # 2) para cada candidato: color exacto modal, caja y contacto con bordes
    planos = []
    for cubo, n in candidatos:
        color = exactos[cubo].most_common(1)[0][0]   # ← EXACTO, no la esquina del cubo
        pts = puntos[cubo]
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        por_fila = {}
        for x, y in pts:
            f = por_fila.setdefault(y, [UW, 0])
            if x < f[0]:
                f[0] = x
            if x > f[1]:
                f[1] = x
        bordes_izq = sum(1 for f in por_fila.values() if f[0] <= paso * 2)
        bordes_der = sum(1 for f in por_fila.values() if f[1] >= UW - paso * 3)
        caja = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
        planos.append({
            "color": color,
            "hex": "#%02X%02X%02X" % color,
            "area_pct": round(100 * n / total, 2),
            "caja": caja,
            "toca_ambos_bordes": min(bordes_izq, bordes_der),
            "filas_presentes": len(por_fila),
        })

    # 3) el FONDO es el plano que más veces toca los dos bordes laterales.
    #    Criterio medible, no "el más grande": una carta a ancho completo
    #    puede ganar en área y no ser el fondo.
    if not planos:
        return None
    fondo = max(planos, key=lambda p: (p["toca_ambos_bordes"], p["area_pct"]))

    for p in planos:
        p["contraste_vs_fondo"] = round(contraste(p["color"], fondo["color"]), 3)
        p["es_fondo"] = p is fondo

    # cobertura: qué fracción del área útil es plano reconocido. Lo que falta
    # es foto, texto, degradado o icono — y se declara en vez de esconderse.
    cobertura = round(sum(p["area_pct"] for p in planos), 2)

    # 4) LAS REGLAS — el segundo tipo de separador. Una fila cuenta como regla
    #    si difiere de la fila de arriba y de la de abajo por encima del umbral
    #    de ruido, a lo largo de al menos `min_ancho` del ancho. Es lo que
    #    distingue «0 planos porque nada separa» de «0 planos porque separa un
    #    hairline» — los dos ceros que este instrumento confundió una vez.
    reglas = []
    min_ancho = 0.40
    y = 2
    while y < UH - 3:
        distintas = 0
        for x in range(0, UW, 2):
            c = px[x, y]
            arr = px[x, y - 2]
            aba = px[x, y + 2]
            d_arr = max(abs(c[i] - arr[i]) for i in range(3))
            d_aba = max(abs(c[i] - aba[i]) for i in range(3))
            # una regla difiere de AMBOS lados: eso la separa de un borde de
            # plano, que difiere de uno solo.
            if d_arr > tol_plano + 2 and d_aba > tol_plano + 2:
                distintas += 1
        if distintas / (UW / 2) >= min_ancho:
            reglas.append(y)
            y += 4   # no contar la misma línea dos veces
        else:
            y += 1

    return {
        "archivo": ruta,
        "tamano": [W, H],
        "area_util": [UW, UH],
        "recorte": [recorte_sup, recorte_inf],
        "fondo": fondo["hex"],
        "cobertura_plana_pct": cobertura,
        "reglas": len(reglas),
        "planos": sorted(planos, key=lambda p: -p["area_pct"]),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("capturas", nargs="+")
    ap.add_argument("--recorte-sup", type=float, default=0.05,
                    help="fracción del alto a recortar arriba (barra de estado)")
    ap.add_argument("--recorte-inf", type=float, default=0.06,
                    help="fracción del alto a recortar abajo (barra de gestos)")
    ap.add_argument("--min-area", type=float, default=0.012,
                    help="área mínima (fracción) para que un color cuente como plano")
    ap.add_argument("--plano", type=int, default=3,
                    help="rango por canal admitido en el vecindario para contar como plano")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    salida = []
    for ruta in args.capturas:
        r = censar(ruta, args.recorte_sup, args.recorte_inf, args.min_area,
                   tol_plano=args.plano)
        if r is None:
            print(f"{ruta}: sin planos por encima del umbral", file=sys.stderr)
            continue
        salida.append(r)
        if args.json:
            continue
        print(f"\n═══ {ruta}")
        print(f"    útil {r['area_util'][0]}×{r['area_util'][1]} · FONDO {r['fondo']}")
        print(f"    cobertura plana {r['cobertura_plana_pct']}% (el resto: foto, texto, degradado)")
        print(f"    {'hex':>9}  {'área%':>6}  {'contraste':>9}  caja")
        for p in r["planos"]:
            marca = " ← FONDO" if p["es_fondo"] else ""
            print(f"    {p['hex']:>9}  {p['area_pct']:>6}  "
                  f"{p['contraste_vs_fondo']:>9}  {p['caja']}{marca}")
        niveles = [p for p in r["planos"] if not p["es_fondo"] and p["contraste_vs_fondo"] > 1.0]
        sep = len(niveles) + r["reglas"]
        print(f"    ⇒ planos distintos del fondo: {len(niveles)}  ·  reglas: {r['reglas']}"
              f"  ·  SEPARADORES: {sep}")
        if sep == 0:
            print("    ⚠️  0/0 — o no hay separación, o separa una SOMBRA que este "
                  "instrumento no ve. Mirar la captura antes de concluir.")

    if args.json:
        print(json.dumps(salida, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
