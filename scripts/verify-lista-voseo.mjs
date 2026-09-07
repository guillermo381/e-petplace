/**
 * GATE · UNA SOLA LISTA DE VOSEO, Y LOS TRES LA LEEN (S113-A · 2.2).
 *
 * ── SU ROJO REAL ────────────────────────────────────────────────────────────
 * Había TRES copias de la misma lista —`lib-voz.mjs` (C/B, R66), el cinturón de
 * D en `supabase/functions`, y el gate de voz de E— y las tres divergían. A la
 * de C le faltaban **16 formas**, entre ellas `bañalo`, `mostrame` y `avisame`,
 * que E midió **saliendo a una familia**. *Tres copias de un vocabulario no son
 * redundancia: son tres verdades distintas, y la que falla es siempre la que
 * nadie miró.*
 *
 * 🔴 MIDE QUE LA LEAN, NO QUE COINCIDAN. Comparar contenidos volvería a exigir
 * que alguien mantenga tres cosas parecidas; lo que este gate exige es que
 * NINGUNO tenga contenido propio. *Si un consumidor deja de leerla, su copia
 * vuelve a nacer y nadie se entera hasta que una voz sale mal.*
 *
 * ⚠️ EL TRINQUETE DE R66 NO SE TOCA: la lista puede CRECER —y este gate no lo
 * impide— pero el baseline de R66 sigue siendo solo-baja. Una lista más larga
 * puede destapar voseos viejos; eso es trabajo, no permiso para subir el número.
 *
 *   node scripts/verify-lista-voseo.mjs [--control]
 */
import { readFileSync, existsSync } from 'node:fs'

/* La fuente vive donde la puso D. Medido: `scripts/` y `supabase/` comparten
   el repo, así que los tres consumidores la alcanzan con una ruta relativa —
   no hacía falta un cuarto lugar «neutral». */
const FUENTE = 'supabase/functions/_shared/voz/voseo.json'

/** Cada consumidor, con CÓMO se prueba que la lee. */
const CONSUMIDORES = [
  { quien: 'lib-voz.mjs (C/B · R66)', archivo: 'scripts/lib-voz.mjs',
    lee: (s) => /voz\/voseo\.json/.test(s),
    propia: (s) => /export const (CON_TILDE|ENCL|PRON)\s*=\s*\['/.test(s) },
  { quien: 'el cinturón de D (coach)', archivo: 'supabase/functions/coach/index.ts',
    lee: (s) => /voz\/voseo\.json/.test(s) || /voseo/.test(s),
    propia: (s) => /const \w*VOSEO\w*\s*=\s*\[\s*'/.test(s) },
]

if (process.argv.includes('--control')) {
  /* 🔴 El fixture del control usaba `lib-voseo.json` —la ruta VIEJA— mientras
     el detector busca `voz/voseo.json`, adonde se mudó la lista. **El gate medía
     bien y su control no podía producir su verde**, o sea que este gate estuvo
     corriendo sin nadie que probara que discrimina. *Un fixture apunta a donde
     el archivo estaba el día que se escribió, y no se entera de la mudanza.* */
  const c = CONSUMIDORES[0]
  const ok = c.lee("JSON.parse(leer(new URL('../supabase/functions/_shared/voz/voseo.json', import.meta.url)))")
    && !c.lee('const X = 1')
    && c.propia("export const CON_TILDE = ['probá','tocá']")
    && !c.propia('export const CON_TILDE = _VOSEO.con_tilde')
  console.log(ok
    ? '✅ control: distingue «la lee» de «tiene su copia», en las dos direcciones'
    : '🔴 control: el detector no discrimina — no está midiendo')
  process.exit(ok ? 0 : 2)
}

if (!existsSync(FUENTE)) {
  console.log(`🔴 NO CONCLUYENTE: falta ${FUENTE} — sin fuente única no hay nada que medir.`)
  process.exit(2)
}
const lista = JSON.parse(readFileSync(FUENTE, 'utf8'))
const n = lista.pares?.length ?? 0
const sinCura = (lista.pares ?? []).filter((p) => !p[1]).length
if (n === 0) {
  console.log('🔴 NO CONCLUYENTE: la lista está vacía — un gate sobre cero formas da verde por nada.')
  process.exit(2)
}

console.log(`lista-voseo · ${n} par(es) en ${FUENTE} · ${CONSUMIDORES.length} consumidor(es) medido(s)`)
if (sinCura) console.log(`  · ${sinCura} detectan pero NO curan (tuteo sin derivar: la raíz puede diptongar)`)
let rojo = 0
for (const c of CONSUMIDORES) {
  if (!existsSync(c.archivo)) {
    console.log(`  ✗ ${c.quien}: no existe ${c.archivo}`); rojo++; continue
  }
  const src = readFileSync(c.archivo, 'utf8')
  if (!c.lee(src)) { console.log(`  ✗ ${c.quien} NO lee ${FUENTE}`); rojo++; continue }
  if (c.propia(src)) { console.log(`  ✗ ${c.quien} la lee PERO conserva su copia — dos verdades`); rojo++; continue }
  console.log(`  ✅ ${c.quien}`)
}

/* ⚠️ LO NO MEDIDO, declarado: el cinturón de D (`supabase/functions`) y el gate
   de voz de E todavía tienen su propia lista. Se declaran acá para que su
   ausencia no se lea como que ya cumplen — *un gate que no nombra lo que no
   mira deja creer que lo mira.* Entran a CONSUMIDORES el día que lean el JSON. */
console.log('\n  ⚠️ TODAVÍA NO MEDIDO, declarado: el gate de voz de E.')
console.log('     Entra el día que lea el JSON; hoy no se mide y se dice —')
console.log('     *un gate que no nombra lo que no mira deja creer que lo mira.*')

process.exit(rojo ? 1 : 0)
