#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LOTE 8 · LAS IMÁGENES QUE EL CONFIG PIDE — **producidas por un comando, no
 * exportadas a mano.**
 *
 * La casa ya sabe lo que pasa con un asset dibujado a mano: nadie puede
 * reproducirlo, y el día que la marca cambie hay que acordarse de todos.
 * Acá el ÚNICO insumo son los SVG de B, y todo lo demás se DERIVA:
 *
 *   packages/ui/assets/marca/icono-app.svg          → el ícono (iOS + Android)
 *   packages/ui/assets/marca/nariz-notificacion.svg → notificación + monocromo
 *   packages/ui/assets/marca/isotipo-sobre-oscuro.svg → el splash nativo
 *
 * ⚠️ **NO TOCA NINGÚN SVG DE B.** El fondo ciruela del ícono se quita para el
 * `foreground` **en memoria** (el `<rect>` que B pinta primero), porque la capa
 * de un ícono adaptativo no puede traer su propio fondo: el fondo lo pone
 * Android desde `backgroundColor`.
 *
 * Corre con:  node scripts/lote8/generar-assets.mjs
 * Necesita:   el Chrome del sistema (rasterizador) y python3 con PIL.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rasterizar } from './rasterizar.mjs'

const MARCA = 'packages/ui/assets/marca'
const DESTINO = 'apps/cliente/assets/images'
const tmp = mkdtempSync(join(tmpdir(), 'lote8-'))

/** El lado de la zona segura de B, en fracción del lienzo del ícono.
 *  **No es un número elegido acá**: es la firma de B —*«la diagonal del
 *  dibujo contra el diámetro del círculo del 66 %»*— y su cabecera lo explica
 *  entero en `icono-app.svg`. */
const ZONA_SEGURA = 0.66

console.log('① rasterizando los SVG de B (Chrome del sistema)…')

/* El ícono completo, con su ciruela: sirve para iOS (aplanado) y como base. */
await rasterizar({ svg: `${MARCA}/icono-app.svg`, ancho: 1024, alto: 1024, salida: `${tmp}/icono-1024.png` })

/* La MISMA composición SIN el fondo: es el `foreground` del adaptativo.
   El `<rect>` de B es el primer nodo del SVG y pinta el lienzo entero. */
await rasterizar({
  svg: `${MARCA}/icono-app.svg`, ancho: 1024, alto: 1024, salida: `${tmp}/icono-foreground.png`,
  transformar: (s) => {
    const sin = s.replace(/<rect width="1024" height="1024" fill="#26062E"\/>/, '')
    if (sin === s) throw new Error('el <rect> del fondo cambió de forma: se para y se mira el SVG, no se adivina')
    return sin
  },
})

/* La silueta de notificación: cuadrada, blanca sobre transparente. El plugin
   la recorta con `cover`, así que un origen NO cuadrado saldría cortado. */
await rasterizar({ svg: `${MARCA}/nariz-notificacion.svg`, ancho: 192, alto: 192, salida: `${tmp}/notif-192.png` })
/* La misma silueta, grande, para componer el monocromo del adaptativo. */
await rasterizar({ svg: `${MARCA}/nariz-notificacion.svg`, ancho: 2048, alto: 2048, salida: `${tmp}/silueta-2048.png` })

/* La nariz sobre oscuro, para el splash nativo. Se rasteriza GRANDE y después
   se recorta a su tinta: el dibujo ocupa el 40 % del archivo y **no está
   centrado en su propio lienzo** (medido), igual que pasaba con el ícono. */
await rasterizar({ svg: `${MARCA}/isotipo-sobre-oscuro.svg`, ancho: 4000, alto: Math.round(4000 * 922 / 1365), salida: `${tmp}/nariz-oscuro-grande.png` })

console.log('② componiendo y midiendo (PIL)…')
execFileSync('python3', [join('scripts', 'lote8', 'componer.py'), tmp, DESTINO, String(ZONA_SEGURA)], { stdio: 'inherit' })
