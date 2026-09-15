# -*- coding: utf-8 -*-
"""
LOTE 8 · la mitad que compone y MIDE. La rasterización la hace Chrome
(`rasterizar.mjs`); acá se recorta a la tinta, se escala contra la zona segura
firmada por B, se aplana lo que no puede llevar alfa, y **se imprime cada
número que decide algo** — un asset que nadie puede reproducir es un asset que
nadie puede corregir.
"""
import math
import sys
from PIL import Image

tmp, destino, zona_segura = sys.argv[1], sys.argv[2], float(sys.argv[3])
LADO = 1024


def tinta(im, umbral=8):
    """bbox de lo que se VE (alfa >= umbral), no de lo que el archivo declara."""
    return im.getchannel('A').point(lambda v: 255 if v >= umbral else 0).getbbox()


def radio_max(im, umbral=8):
    """El radio de tinta más lejano al centro del lienzo. Es lo que decide si
    un recorte redondo se lleva algo puesto — el bbox sobreestima."""
    w, h = im.size
    px = im.load()
    cx, cy, r = w / 2, h / 2, 0.0
    for y in range(h):
        for x in range(w):
            if px[x, y][3] >= umbral:
                d = math.hypot(x + 0.5 - cx, y + 0.5 - cy)
                if d > r:
                    r = d
    return r


def recortar_a_tinta(im):
    return im.crop(tinta(im))


def centrar_en_zona_segura(silueta, lado, zona):
    """Escala el dibujo hasta que **la diagonal de su tinta** mida `zona` del
    lado, y lo centra. El criterio es de B y no se re-discute acá: el lado
    engaña con un dibujo ancho, la diagonal no."""
    d = recortar_a_tinta(silueta)
    diag = math.hypot(*d.size)
    k = (lado * zona) / diag
    d = d.resize((max(1, round(d.width * k)), max(1, round(d.height * k))), Image.LANCZOS)
    lienzo = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    lienzo.paste(d, ((lado - d.width) // 2, (lado - d.height) // 2), d)
    return lienzo, d.size


salida = []

# ── ① EL ÍCONO DE iOS — sin alfa, por regla de la App Store ─────────────────
ic = Image.open(f'{tmp}/icono-1024.png').convert('RGBA')
opaco = Image.new('RGB', ic.size, (38, 6, 46))          # la ciruela de B
opaco.paste(ic, (0, 0), ic)
opaco.save(f'{destino}/icon.png')
salida.append(('icon.png (iOS + legado Android)', f'{LADO}x{LADO} RGB, SIN canal alfa'))

# ── ② EL FOREGROUND DEL ADAPTATIVO ──────────────────────────────────────────
fg = Image.open(f'{tmp}/icono-foreground.png').convert('RGBA')
bb = tinta(fg)
r = radio_max(fg)
fg.save(f'{destino}/android-icon-foreground.png')
salida.append(('android-icon-foreground.png', f'{LADO}x{LADO} RGBA, sin fondo'))
print(f'  · foreground — tinta {bb[2]-bb[0]}x{bb[3]-bb[1]} px  ({(bb[2]-bb[0])/LADO*100:.1f}% x {(bb[3]-bb[1])/LADO*100:.1f}% del lienzo)')
print(f'    radio de tinta MÁS LEJANO: {r:.1f} px ⇒ diámetro {2*r/LADO*100:.1f}% del lado '
      f'(la zona segura de B es {zona_segura*100:.0f}%) → {"CABE" if 2*r <= LADO*zona_segura + 1 else "🔴 SE SALE"}')

# ── ③ EL MONOCROMO (ícono con tema de Android 13+) ──────────────────────────
# Es una MÁSCARA ALFA: el sistema le pone el color. Por eso NO se deriva del
# isotipo sino de la silueta que B dibujó para 24 px — el lote 1 midió que la
# silueta del isotipo se cierra sobre sí misma y entrega una mancha.
mono, tam = centrar_en_zona_segura(Image.open(f'{tmp}/silueta-2048.png').convert('RGBA'), LADO, zona_segura)
mono.save(f'{destino}/android-icon-monochrome.png')
salida.append(('android-icon-monochrome.png', f'{LADO}x{LADO} RGBA, silueta blanca'))
print(f'  · monocromo   — silueta {tam[0]}x{tam[1]} px, diagonal {math.hypot(*tam):.0f} = {zona_segura*100:.0f}% del lado')

# ── ④ EL ÍCONO DE NOTIFICACIÓN ──────────────────────────────────────────────
nt = Image.open(f'{tmp}/notif-192.png').convert('RGBA')
px = nt.load()
no_blanco = [(x, y) for y in range(nt.height) for x in range(nt.width)
             if px[x, y][3] > 0 and px[x, y][:3] != (255, 255, 255)]
nt.save(f'{destino}/notification-icon.png')
salida.append(('notification-icon.png', f'{nt.width}x{nt.height} RGBA, blanco+transparente'))
print(f'  · notificación — cuadrado {nt.width}x{nt.height} (el plugin recorta con «cover»: un origen no cuadrado saldría cortado)')
print(f'    píxeles opacos que NO son blancos: {len(no_blanco)} (Android la usa como máscara: el color lo pone el sistema)')

# ── ⑤ EL SPLASH NATIVO ──────────────────────────────────────────────────────
# La MISMA nariz que dibuja el splash JS, recortada a su tinta igual que el
# PNG que la app ya monta — mismo dibujo, más resolución.
gr = Image.open(f'{tmp}/nariz-oscuro-grande.png').convert('RGBA')
bbg = tinta(gr)
print(f'  · splash — el SVG mide {gr.width}x{gr.height} y su tinta ocupa '
      f'{bbg[2]-bbg[0]}x{bbg[3]-bbg[1]} ({(bbg[2]-bbg[0])/gr.width*100:.1f}% del ancho), '
      f'centro ({(bbg[0]+bbg[2])/2:.0f},{(bbg[1]+bbg[3])/2:.0f}) vs lienzo ({gr.width//2},{gr.height//2})')
sp = recortar_a_tinta(gr)
ANCHO_SPLASH = 1440
sp = sp.resize((ANCHO_SPLASH, max(1, round(sp.height * ANCHO_SPLASH / sp.width))), Image.LANCZOS)
sp.save(f'{destino}/splash-icon.png')
salida.append(('splash-icon.png', f'{sp.width}x{sp.height} RGBA'))
rel = sp.width / sp.height
print(f'    recortado y reescalado a {sp.width}x{sp.height} · proporción {rel:.4f}')
ref = Image.open('packages/ui/assets/marca/isotipo-sobre-oscuro@3x.png')
print(f'    el PNG que el splash JS monta hoy: {ref.width}x{ref.height} · proporción {ref.width/ref.height:.4f} '
      f'⇒ diferencia {abs(rel - ref.width/ref.height)/(ref.width/ref.height)*100:.2f}% (mismo dibujo, más resolución)')
rs = radio_max(sp, 8) / sp.width
print(f'    círculo que lo circunscribe: {2*rs:.3f} × el ancho dibujado '
      f'⇒ con la máscara redonda de Android 12 (192 dp) el tope es {192/(2*rs):.1f} dp de ancho')

print('\n  LO ESCRITO:')
for n, d in salida:
    print(f'    {destino}/{n:32s} {d}')
