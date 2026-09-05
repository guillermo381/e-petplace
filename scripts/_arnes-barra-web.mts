/* CONTROL DE LA BARRA EN WEB (S113-B · 1.0 adenda 2) — el corrimiento del
   cuerpo, LEÍDO DEL DOM y no del código.

   🔴 **Por qué existe:** el cuerpo de la barra se corría con `translateY` como
   PROP del `AnimatedPath`. Nada falla si esa prop se pierde: el `<path>` se
   dibuja igual, sólo que `DISCO_ASOMA` px más arriba, y el disco deja de
   asomar. *Un defecto que no lanza, no loguea y compila perfecto sólo lo ve
   quien mire el atributo.*

   Corre contra el dev server de `apps/cliente` (puerto por argumento, 8093 por
   defecto) y **lee el `transform` del `<path>` real**.
   Uso: npx tsx scripts/_arnes-barra-web.mts [puerto] */
import { chromium } from 'playwright-core'

const puerto = process.argv[2] ?? '8093'
/* Chrome del sistema: el shell headless que trae `playwright-core` no está
   descargado en esta máquina, y bajarlo es una dependencia nueva. */
const nav = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })
const pag = await nav.newPage({ viewport: { width: 430, height: 932 } })
const errores: string[] = []
pag.on('pageerror', (e) => errores.push(String(e)))

await pag.goto(`http://localhost:${puerto}/gallery`, { waitUntil: 'domcontentloaded', timeout: 90000 })
await pag.waitForTimeout(12000)

/* La barra vive en un `<svg>` cuyo `<path>` tiene `fill-rule="evenodd"` — es
   la firma del cuerpo con su hueco, y no la comparte ninguna otra pieza. */
const cuerpos = await pag.$$eval('svg path[fill-rule="evenodd"]', (ns) =>
  ns.map((n) => {
    const svg = n.closest('svg')!
    /* 🔴 EL EFECTO, no el atributo: cuánto BAJA el cuerpo dentro de su lienzo.
       Un `transform` presente que el navegador ignorara daría 0 acá, y un
       corrimiento que llegara por cualquier otra vía daría el número igual.
       *Lo que se mide es dónde terminó el dibujo.* */
    const bajada = n.getBoundingClientRect().top - svg.getBoundingClientRect().top
    return {
      transform: n.getAttribute('transform'),
      translateY: n.getAttribute('translateY') ?? n.getAttribute('translatey'),
      bajada: Math.round(bajada * 100) / 100,
      d: (n.getAttribute('d') ?? '').slice(0, 30),
    }
  }),
)

console.log(`\n── EL CUERPO DE LA BARRA EN EL DOM (${cuerpos.length} encontrado(s)) ──`)
for (const c of cuerpos)
  console.log(`   bajada=${c.bajada}px · transform=${JSON.stringify(c.transform)} · translateY=${JSON.stringify(c.translateY)} · d="${c.d}…"`)
if (errores.length) console.log(`\n⚠️ errores de página: ${errores.slice(0, 3).join(' | ')}`)

let mal = 0
const t = (n: string, real: unknown, esp: unknown) => {
  const a = JSON.stringify(real), b = JSON.stringify(esp)
  if (a === b) console.log(`  ✓ ${n}`)
  else { mal++; console.log(`  ✗ ${n}\n     esperado ${b}\n     real     ${a}`) }
}

console.log('\n── EL CONTROL ──')
t('la barra está en la página', cuerpos.length > 0, true)
/* 🔴 EL PUNTO: el `<path>` tiene que LLEVAR el corrimiento en el DOM. Da igual
   por qué prop entró — lo que se mide es lo que llegó. */
t('🔴 el `<path>` lleva un `transform` con el corrimiento',
  cuerpos.every((c) => c.transform !== null && /translate\(\s*0\s*[, ]/.test(c.transform)), true)
/* 🔴 Y EL QUE DECIDE: el dibujo BAJÓ dentro de su lienzo. `DISCO_ASOMA` es
   `DISCO_RADIO - DISCO_CY`; se compara contra el número que el propio DOM
   reporta en el `transform`, no contra uno tecleado acá — *un control con la
   constante adentro mide su copia, no la pieza.* */
const esperado = Number((cuerpos[0]?.transform ?? '').match(/translate\(\s*0\s*[, ]\s*([\d.]+)/)?.[1] ?? NaN)
t('el corrimiento declarado se pudo leer del DOM', Number.isFinite(esperado) && esperado > 0, true)
t('🔴 …y el dibujo BAJÓ ese tanto de verdad (si no, el disco no asoma)',
  cuerpos.every((c) => Math.abs(c.bajada - esperado) < 0.6), true)
t('CONTROL NEGATIVO · sin corrimiento la bajada sería 0, y no lo es',
  cuerpos.every((c) => c.bajada > 0.5), true)

await nav.close()
console.log(`\n${mal === 0 ? '✓ CONTROL VERDE' : '✗ CONTROL ROJO'} · ${mal} fallo(s)`)
process.exit(mal === 0 ? 0 : 1)
