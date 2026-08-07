#!/usr/bin/env node
/**
 * verify-bimi.mjs — el guard del SVG Tiny PS (S89-B orden 9).
 *
 * POR QUÉ EXISTE, y es exactamente la familia L-192: **un SVG que incumple
 * el perfil BIMI no rompe nada — simplemente NO SE MUESTRA.** El correo
 * sale, el remitente es correcto, y el logo no aparece jamás sin que nadie
 * sepa por qué. Un formato cuyo modo de falla es el silencio necesita su
 * verificación mecánica, no "lo revisé".
 *
 * LAS REGLAS DURAS (perfil SVG Tiny 1.2 Portable/Secure, spec BIMI):
 *  ① version="1.2" y baseProfile="tiny-ps" en el root
 *  ② <title> presente y no vacío (es el nombre accesible de la marca)
 *  ③ viewBox presente, empezando en 0 0, y CUADRADO
 *  ④ sin x/y en el root svg
 *  ⑤ prohibidos: <script> <a> <image> <foreignObject> <use> <style>,
 *     cualquier elemento de animación, y todo `xlink:`/href externo
 *  ⑥ sin CSS externo ni `@import`
 *  ⑦ peso razonable (BIMI recomienda ≤ 32 KB)
 *  ⑧ fondo no transparente — un avatar transparente se pierde sobre el
 *     fondo del cliente (acá: el rect a sangre que la firma pidió negro)
 *
 * AUTO-PRUEBA (L-192, la misma doctrina del resto de los guards): cada
 * regla corre contra un fixture que la VIOLA antes de mirar el archivo
 * real. Una regla que no puede salir roja es decoración.
 *
 * Correr: node scripts/verify-bimi.mjs
 */

import { readFileSync, existsSync } from 'node:fs'

const ARCHIVO = 'packages/ui/assets/brand/isotipo-bimi.svg'

/** Cada regla: id · qué mira · fixture que la viola (para la auto-prueba). */
const REGLAS = [
  {
    id: '① perfil tiny-ps',
    mide: (s) => (/version="1\.2"/.test(s) && /baseProfile="tiny-ps"/.test(s)
      ? null
      : 'el root debe declarar version="1.2" y baseProfile="tiny-ps" — sin eso el validador BIMI lo rechaza'),
    fixtureRojo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>x</title><rect fill="#000" width="512" height="512"/></svg>',
  },
  {
    id: '② <title>',
    mide: (s) => (/<title>\s*\S[^<]*<\/title>/.test(s)
      ? null
      : '<title> ausente o vacío — es obligatorio y es el nombre accesible de la marca'),
    fixtureRojo: '<svg version="1.2" baseProfile="tiny-ps" viewBox="0 0 512 512"><rect fill="#000" width="512" height="512"/></svg>',
  },
  {
    id: '③ viewBox cuadrado desde 0 0',
    mide: (s) => {
      const m = s.match(/viewBox="([^"]+)"/)
      if (m === null) return 'sin viewBox'
      const [x, y, w, h] = m[1].trim().split(/\s+/).map(Number)
      if (x !== 0 || y !== 0) return `el viewBox debe empezar en "0 0" y empieza en "${x} ${y}"`
      return w === h ? null : `el viewBox debe ser CUADRADO y mide ${w}×${h} (el avatar se recorta a círculo: un lienzo apaisado sale mutilado)`
    },
    fixtureRojo: '<svg version="1.2" baseProfile="tiny-ps" viewBox="0 0 471 324"><title>x</title><rect fill="#000" width="471" height="324"/></svg>',
  },
  {
    id: '④ sin x/y en el root',
    mide: (s) => {
      const root = s.match(/<svg\b[^>]*>/)
      return root !== null && /\s(x|y)="/.test(root[0]) ? 'el root <svg> no puede llevar x/y' : null
    },
    fixtureRojo: '<svg version="1.2" baseProfile="tiny-ps" x="0" y="0" viewBox="0 0 512 512"><title>x</title><rect fill="#000" width="512" height="512"/></svg>',
  },
  {
    id: '⑤ elementos prohibidos',
    mide: (s) => {
      const prohibidos = ['script', 'a', 'image', 'foreignObject', 'use', 'style', 'animate', 'animateTransform', 'animateMotion', 'set', 'switch']
      const hallados = prohibidos.filter((t) => new RegExp(`<${t}[\\s/>]`, 'i').test(s))
      if (hallados.length > 0) return `elemento(s) prohibido(s) por el perfil: <${hallados.join('> <')}>`
      return /xlink:|href=/.test(s) ? 'referencias externas (xlink:/href) prohibidas: el SVG debe ser autocontenido' : null
    },
    fixtureRojo: '<svg version="1.2" baseProfile="tiny-ps" viewBox="0 0 512 512"><title>x</title><script>1</script><rect fill="#000" width="512" height="512"/></svg>',
  },
  {
    id: '⑥ sin CSS externo',
    mide: (s) => (/@import|<\?xml-stylesheet/.test(s) ? 'CSS externo prohibido' : null),
    fixtureRojo: '<svg version="1.2" baseProfile="tiny-ps" viewBox="0 0 512 512"><title>x</title><defs>@import url(x)</defs><rect fill="#000" width="512" height="512"/></svg>',
  },
  {
    id: '⑦ peso ≤ 32 KB',
    mide: (s) => {
      const kb = Buffer.byteLength(s) / 1024
      return kb <= 32 ? null : `pesa ${kb.toFixed(1)} KB y el techo recomendado es 32 KB`
    },
    fixtureRojo: `<svg version="1.2" baseProfile="tiny-ps" viewBox="0 0 512 512"><title>x</title><rect fill="#000" width="512" height="512"/><!--${'x'.repeat(34000)}--></svg>`,
  },
  {
    id: '⑧ fondo opaco a sangre',
    mide: (s) => {
      const m = s.match(/viewBox="([^"]+)"/)
      const lado = m !== null ? Number(m[1].trim().split(/\s+/)[2]) : 0
      const rect = s.match(/<rect\b[^>]*>/g) ?? []
      const cubre = rect.some((r) => {
        const w = Number((r.match(/width="([\d.]+)"/) ?? [])[1])
        const h = Number((r.match(/height="([\d.]+)"/) ?? [])[1])
        const fill = (r.match(/fill="([^"]+)"/) ?? [])[1]
        return w >= lado && h >= lado && fill !== undefined && fill !== 'none' && !/transparent/.test(fill)
      })
      return cubre ? null : 'no hay un rect de fondo OPACO que cubra el lienzo — un avatar transparente se pierde sobre el fondo del cliente'
    },
    fixtureRojo: '<svg version="1.2" baseProfile="tiny-ps" viewBox="0 0 512 512"><title>x</title><path d="M0 0h10v10z" fill="#fff"/></svg>',
  },
]

// ── AUTO-PRUEBA: cada regla contra su fixture que la viola ────────────
const mudas = []
for (const r of REGLAS) {
  if (r.mide(r.fixtureRojo) === null) mudas.push(`${r.id}: su fixture NO la dispara — regla decorativa (L-192)`)
}
// contra-caso: un archivo VÁLIDO no puede disparar ninguna
const VALIDO = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny-ps" viewBox="0 0 512 512">
  <title>marca</title><rect x="0" y="0" width="512" height="512" fill="#050508"/><path d="M0 0h10v10z" fill="#fff"/></svg>`
for (const r of REGLAS) {
  const v = r.mide(VALIDO)
  if (v !== null) mudas.push(`${r.id}: dispara sobre un SVG VÁLIDO ("${v}") — falso positivo constante`)
}
if (mudas.length > 0) {
  console.error('\n🔴 verify:bimi — AUTO-PRUEBA ROTA (no se mide con un instrumento roto):')
  for (const m of mudas) console.error(`   ✗ ${m}`)
  process.exit(2)
}

// ── el archivo real ──────────────────────────────────────────────────
if (!existsSync(ARCHIVO)) {
  console.error(`\n🔴 verify:bimi — no existe ${ARCHIVO}. Generalo con: node scripts/gen-bimi.mjs\n`)
  process.exit(1)
}
const svg = readFileSync(ARCHIVO, 'utf8')
const fallos = []
console.log(`\nverify:bimi — ${ARCHIVO} (auto-prueba: ${REGLAS.length} reglas encendieron)\n`)
for (const r of REGLAS) {
  const f = r.mide(svg)
  console.log(`  ${f === null ? '✓' : '✗'} ${r.id}${f === null ? '' : ` — ${f}`}`)
  if (f !== null) fallos.push(`${r.id}: ${f}`)
}
console.log(
  `\n  alcance declarado: valida el PERFIL del archivo. NO valida lo que BIMI ` +
    `además exige y vive fuera del repo — DMARC en p=quarantine|reject · el registro ` +
    `default._bimi con su URL HTTPS · y el VMC/CMC (sin certificado, Gmail y Apple ` +
    `NO muestran el logo aunque el SVG sea perfecto).`,
)
if (fallos.length > 0) {
  console.error(`\n🔴 verify:bimi — ${fallos.length} fallo(s)\n`)
  process.exit(1)
}
console.log('\nverify:bimi — VERDE\n')
