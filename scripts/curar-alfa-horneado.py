#!/usr/bin/env python3
"""
CURAR UN FONDO HORNEADO — el alfa derivado de DOS rasterizados.

── QUÉ CURA ─────────────────────────────────────────────────────────────
Un PNG de marca exportado con su fondo (blanco o negro) OPACO adentro. Se
ve bien sobre el fondo con el que lo exportaron y como un rectángulo sobre
cualquier otro. **No es un defecto que falle: es uno que se ve.**

── POR QUÉ EXISTE COMO SCRIPT (S116-B lote 5) ───────────────────────────
Es la SEGUNDA vez que esta casa hace esta cura —el isotipo sobre oscuro fue
la primera— y la fórmula no es evidente. *Derivarla de nuevo cada vez es la
misma clase de deuda que un número tecleado dos veces: la tercera se hace
distinta y nadie se entera.*

── LA FÓRMULA, y por qué hacen falta DOS rasterizados ───────────────────
`qlmanage` es el único rasterizador de esta máquina y **NO preserva alfa**:
todo lo que devuelve es opaco. Así que el alfa no se lee — se DESPEJA.

Compuesto sobre negro:   Cn = α·C
Compuesto sobre blanco:  Cb = α·C + (1 − α)
                    ⇒    Cb − Cn = 1 − α   ⇒   α = 1 − (Cb − Cn)
                    ⇒    C = Cn / α        (donde α > 0)

Los dos rasterizados salen del MISMO SVG envuelto con un `<rect>` de fondo,
así que la geometría es idéntica píxel a píxel — condición del despeje.

⚠️ **LO QUE ESTE MÉTODO NO PUEDE HACER, declarado:** donde α ≈ 0 el color
es indeterminado (dividir por casi cero), así que esos píxeles quedan en
negro transparente. Es correcto —no se ven— pero si alguien vuelve a
componer sobre un fondo claro con un filtro que ignore el alfa, van a
aparecer. *No se disimula con un color plausible: un color inventado ahí es
exactamente lo que hace que el próximo no sepa que es indeterminado.*

── EL CASO QUE ESTE SCRIPT NO PUEDE CURAR SOLO, y hay que saber cuál es ─
Si el fondo **está dibujado adentro del SVG como una forma opaca**, los dos
rasterizados lo ven igual y el despeje da α = 1: la cura corre, no falla, y
devuelve exactamente lo mismo que entró. *Un resultado idéntico al original
es el síntoma, y es fácil confundirlo con «ya estaba bien».*

Para eso está `--quitar-fondo <#hex>`: saca el grupo cuyo path tiene ese
relleno y **empieza con un rectángulo que cubre el lienzo entero**. No
adivina por color: exige las dos cosas, y **dice qué sacó y de qué tamaño**
para que la decisión quede auditable. Si no encuentra ninguno, lo dice y
sigue — y ahí la respuesta honesta es que el fondo NO es separable.

⚠️ **No toca el SVG en disco.** El original es lo que entregó el
ilustrador; el recorte vive en memoria durante la corrida. *Un segundo SVG
«sin fondo» al lado del bueno es un archivo que alguien va a tener que
mantener sincronizado, y no lo va a hacer.*

── USO ──────────────────────────────────────────────────────────────────
    python3 scripts/curar-alfa-horneado.py <fuente.svg> <destino-sin-sufijo> \
        [--tamanos 200x144,400x289,600x433] [--quitar-fondo "#ffffff"]

Escribe `<destino>.png`, `<destino>@2x.png`, `<destino>@3x.png` — **en ese
orden de sufijos porque es el que Metro entiende**: el archivo BASE tiene
que existir o no resuelve ninguna variante (ver la nota de `Personaje`).
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

LADO_RASTER = 1600  # el lado del rasterizado de trabajo; se recorta y baja después


def quitar_fondo(texto: str, color: str) -> str:
    """Saca el grupo del fondo horneado. Ver la nota de la cabecera."""
    caja = re.search(r'viewBox="[\d.\-]+ [\d.\-]+ ([\d.]+) ([\d.]+)"', texto)
    if caja is None:
        raise SystemExit('El SVG no declara viewBox — no puedo saber qué es «todo el lienzo».')
    ancho, alto = float(caja.group(1)), float(caja.group(2))

    for m in re.finditer(rf'<path fill="{re.escape(color)}" d="M ([^"]{{0,200}})', texto):
        numeros = [float(v) for v in re.findall(r'-?\d+\.?\d*', m.group(1)[:120])]
        if len(numeros) < 6:
            continue
        xs, ys = numeros[0::2][:4], numeros[1::2][:4]
        # ¿Arranca con un rectángulo de FONDO? Las dos varas son distintas y
        # la diferencia no es arbitraria: **un fondo de marca ocupa TODO el
        # ancho y sólo la banda que la marca necesita de alto**. El logo
        # claro es el caso: 1254 de ancho (100 %) y 903 de alto (72 %).
        # ⏪ Con 95 % en los dos ejes este detector NO lo encontró y dijo
        # «no es una forma aparte» — una respuesta falsa que se lee como
        # medición. El eje horizontal es el que discrimina; el vertical sólo
        # descarta una línea fina.
        # ⚠️ Y se exige que sea RECTÁNGULO (dos x y dos y distintos): un
        # dibujo ancho y alto no es un fondo, y sin esta condición el primer
        # trazo grande del logo se llevaría el premio.
        if (max(xs) - min(xs)) < ancho * 0.95 or (max(ys) - min(ys)) < alto * 0.4:
            continue
        if len(set(round(v, 1) for v in xs)) > 2 or len(set(round(v, 1) for v in ys)) > 2:
            continue
        gi = texto.rfind('<g ', 0, m.start())
        gf = texto.find('</g>', m.start()) + 4
        print(f'  ⏏ fondo {color} sacado · rectángulo {max(xs)-min(xs):.0f}×{max(ys)-min(ys):.0f} '
              f'sobre lienzo {ancho:.0f}×{alto:.0f} · bloque de {gf-gi} caracteres')
        return texto[:gi] + texto[gf:]

    print(f'  ⚠️ NO hay un path {color} que cubra el lienzo: el fondo NO es una forma aparte.')
    return texto


def rasterizar(texto: str, fondo: str, carpeta: Path) -> Image.Image:
    """Rasteriza el SVG (ya en memoria) con un rect de fondo a pantalla completa."""
    corte = texto.index('>') + 1  # justo después del <svg ...>
    rect = f'<rect x="0" y="0" width="100%" height="100%" fill="{fondo}"/>'
    envuelto = texto[:corte] + rect + texto[corte:]
    temporal = carpeta / f'_envuelto-{fondo.strip("#")}.svg'
    temporal.write_text(envuelto)
    subprocess.run(
        ['qlmanage', '-t', '-s', str(LADO_RASTER), '-o', str(carpeta), str(temporal)],
        check=True, capture_output=True,
    )
    salida = carpeta / f'{temporal.name}.png'
    im = Image.open(salida).convert('RGB')
    im.load()
    temporal.unlink()
    salida.unlink()
    return im


def despejar(sobre_negro: Image.Image, sobre_blanco: Image.Image) -> Image.Image:
    if sobre_negro.size != sobre_blanco.size:
        raise SystemExit(
            f'Los dos rasterizados difieren en tamaño ({sobre_negro.size} vs '
            f'{sobre_blanco.size}) — el despeje exige geometría idéntica.'
        )
    ancho, alto = sobre_negro.size
    pn, pb = sobre_negro.load(), sobre_blanco.load()
    fuera = Image.new('RGBA', (ancho, alto))
    pf = fuera.load()
    for y in range(alto):
        for x in range(ancho):
            rn, gn, bn = pn[x, y]
            rb, gb, bb = pb[x, y]
            # El alfa se despeja por canal y se promedia: los tres tienen que
            # dar lo mismo, y promediar absorbe el ruido del rasterizador.
            a = 1.0 - ((rb - rn) + (gb - gn) + (bb - bn)) / (3 * 255.0)
            a = max(0.0, min(1.0, a))
            if a < 0.004:  # ~1/255: indeterminado, ver la nota de arriba
                pf[x, y] = (0, 0, 0, 0)
                continue
            pf[x, y] = (
                min(255, round(rn / a)),
                min(255, round(gn / a)),
                min(255, round(bn / a)),
                round(a * 255),
            )
    return fuera


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    svg = Path(sys.argv[1])
    destino = Path(sys.argv[2])
    tamanos = '200x144,400x289,600x433'
    if '--tamanos' in sys.argv:
        tamanos = sys.argv[sys.argv.index('--tamanos') + 1]

    texto = svg.read_text()
    if '--quitar-fondo' in sys.argv:
        texto = quitar_fondo(texto, sys.argv[sys.argv.index('--quitar-fondo') + 1])

    with tempfile.TemporaryDirectory() as tmp:
        trabajo = Path(tmp)
        negro = rasterizar(texto, '#000000', trabajo)
        blanco = rasterizar(texto, '#ffffff', trabajo)

    limpio = despejar(negro, blanco)
    caja = limpio.getbbox()  # el recorte lo dicta el ALFA, no el ojo
    if caja is None:
        raise SystemExit('El despeje dio TODO transparente — revisá el SVG.')
    limpio = limpio.crop(caja)
    print(f'  despejado · {negro.size} → recorte por alfa {limpio.size}')

    for i, dim in enumerate(tamanos.split(',')):
        w, h = (int(v) for v in dim.split('x'))
        sufijo = '' if i == 0 else f'@{i + 1}x'
        salida = destino.with_name(f'{destino.name}{sufijo}.png')
        limpio.resize((w, h), Image.LANCZOS).save(salida)
        print(f'  escrito {salida.name} · {w}x{h}')


if __name__ == '__main__':
    main()
