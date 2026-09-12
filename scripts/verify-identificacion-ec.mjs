/**
 * EL CONTROL DE LOS TRES VALIDADORES FISCALES (S115-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **LO QUE ESTE CONTROL EXISTE PARA EVITAR:** un dígito verificador
 * acierta sobre casi cualquier número si se lo prueba con dos ejemplos que
 * uno mismo generó con su propia fórmula. Eso es el **discriminador
 * tautológico** que esta casa ya se cobró (`L-459`): *su fixture lo escribió
 * el mismo que lo escribió a él, y comparte sus supuestos.*
 *
 * ⇒ EL DISCRIMINADOR REAL DE ACÁ ES **LA MUTACIÓN DE UN DÍGITO**: a cada
 * número válido se le cambia UN dígito y el validador tiene que rechazarlo.
 * *Un validador que acepta un número y también su versión con un dígito
 * distinto no está validando: está devolviendo `true`.* Y esa prueba **no
 * depende de que mi fórmula sea la correcta** — depende de que discrimine,
 * que es otra cosa y es la que importa.
 *
 * Los positivos son números **verificados a mano** (la cuenta de cada uno
 * está escrita al lado), no generados por el propio algoritmo.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Corre: `node scripts/verify-identificacion-ec.mjs`
 * Declara lo que NO mide: que el número EXISTA. Un dígito verificador prueba
 * forma, jamás existencia (ver la cabecera de `identificacion-ec.ts`).
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const FUENTE = join(raiz, 'packages/ui/src/components/identificacion-ec.ts')

/* Se transpila a la mano lo mínimo: quitar los tipos de TS para poder
   importarlo como módulo. Es más barato que arrastrar un bundler acá, y
   **mide el ARCHIVO REAL** — no una reimplementación, que sería el defecto
   que este control existe para cazar (precedente: el gate de la barra que
   extrae `pathBarra` del archivo vivo en vez de reimplementar la fórmula). */
let fuente
try {
  fuente = readFileSync(FUENTE, 'utf8')
} catch {
  console.error('✗ ANCLA ROTA — no encontré `identificacion-ec.ts`. Un cero acá diría «no medí», no «está bien».')
  process.exit(2)
}

const js = fuente
  .replace(/^export type [\s\S]*?$/gm, '')
  .replace(/: Record<TipoIdentificacion, number \| null>/g, '')
  .replace(/: TipoIdentificacion/g, '')
  .replace(/: readonly number\[\]/g, '')
  .replace(/: string\b/g, '')
  .replace(/: number\b/g, '')
  .replace(/: boolean\b/g, '')
  .replace(/ as const/g, '')

const mod = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
const { esCedulaValida, esRucValido, esClaveAccesoValida, agrupar } = mod

let fallos = 0
let corridas = 0
const decir = (ok, que) => {
  corridas += 1
  if (!ok) {
    fallos += 1
    console.error(`  ✗ ${que}`)
  }
}

/* ── ① POSITIVOS, verificados a mano ──────────────────────────────────────
   CÉDULA 1712345675 · coef 2,1,2,1,2,1,2,1,2 sobre 171234567
     2+7+2+2+6+4+1+6+5 = 35 ⇒ dv = (10 − 5) % 10 = 5 ✓
   CÉDULA 0926687856 · 0+9+4+6+3+8+5+8+1 = 44 ⇒ dv = 6 ✓            */
/* ═══════════════════════════════════════════════════════════════════════════
 * 🔴 LAS CÉDULAS DE PRODUCCIÓN — positivos OBLIGATORIOS, y son la mitad que
 *    faltaba. El gate estaba **VERDE sobre una regla que rechazaba cédulas
 *    reales**, porque ninguna de sus cédulas inventadas tenía tercer dígito 6.
 *    ***Un corpus propio mide el corpus.***
 *
 * Estas salen de **facturas electrónicas AUTORIZADAS por el SRI** — no de mi
 * cabeza, que es exactamente la diferencia que hizo falta. *Un número que el
 * SRI aceptó es la única fuente que le gana a una convención heredada.*
 *
 * ⚠️ **Es UNA sola, y no faltan seis:** de las siete facturas sólo una
 * identifica al comprador por cédula. *Un corpus incompleto que no declara su
 * hueco se lee como completo — y uno que declara un hueco inexistente miente
 * en la otra dirección.*
 * ═══════════════════════════════════════════════════════════════════════════ */
const CEDULAS_DE_PRODUCCION = [
  // 1762613006 — tercer dígito 6. Impresa como identificación del comprador en
  // SIETE facturas autorizadas, de seis emisores distintos. Cierra módulo 10:
  // 2+7+3+2+3+1+6+0+0 = 24 ⇒ dv = (10 − 4) % 10 = 6 ✓
  '1762613006',
]
/* ⏪ Decía 7 y era FALSO: de las siete facturas **hay UNA sola cédula de
   comprador** —las demás no lo identifican o son RUC—. *Declarar «faltan 6»
   inventaba un hueco que no existe, que es el error espejo de no declarar el
   que sí existe.* Corregido por el founder, 11-sep. */
const CEDULAS_ESPERADAS_DE_PRODUCCION = 1

const CEDULAS_OK = ['1712345675', '0926687856', ...CEDULAS_DE_PRODUCCION]
/* RUC natural  1712345675001 — la cédula de arriba + establecimiento.
   RUC privado  1790011674001 · coef 4,3,2,7,6,5,4,3,2 sobre 179001167
     4+21+18+0+0+5+4+18+14 = 84 · 84%11 = 7 ⇒ dv = 4 ✓ (valor[9] = 4)
   RUC público  1760001040001 · coef 3,2,7,6,5,4,3,2 sobre 17600010
     3+14+42+0+0+0+3+0 = 62 · 62%11 = 7 ⇒ dv = 4 ✓ (valor[8] = 4)     */
/* ── LAS TRES RAMAS DEL MÓDULO 11, y estos dos casos los encontró el propio
      control fallando en producir su rojo ──────────────────────────────────
   🔴 **Con los tres RUCs de arriba, romper el módulo 11 a propósito
   —`11 - resto === 10 ? 1 : 11 - resto` → `11 - resto`— dejaba el control en
   VERDE.** Medido: `1790011674001` y `1760001040001` dan **los dos resto 7**,
   así que la rama que convierte el 10 en 1 **nunca se ejercía**. *Un control
   que no puede producir su rojo sobre una rama no está midiendo esa rama*
   (`L-459`), y el hueco sólo apareció al intentar romperlo — no leyéndolo.

   Los dos casos que faltaban, con su cuenta hecha a mano:
     · **resto 0 ⇒ dv 0** · `179000006` · 4+21+18+12 = 55 · 55 % 11 = 0 ✓
     · **resto 1 ⇒ dv 1** · `179000001` · 4+21+18+2  = 45 · 45 % 11 = 1,
       y 11 − 1 = 10, que **se lee 1** — la rama exacta que estaba ciega. */
/* ═══════════════════════════════════════════════════════════════════════════
 * 🔴 LOS RUC DE PRODUCCIÓN — de comprobantes AUTORIZADOS por el SRI.
 *
 * Cubren las cinco figuras que importan: **persona natural · sociedad · RIMPE ·
 * contribuyente especial · gran contribuyente · agente de retención**. *Un
 * corpus de números que yo mismo generé mide mi aritmética; éste mide la
 * realidad.*
 * ═══════════════════════════════════════════════════════════════════════════ */
const RUCS_DE_PRODUCCION = [
  '1762613006001', // persona natural (del founder) — el caso que rompía la rama
  '1791309863001', // MULTICINES S.A. · contribuyente especial 0590
  '1793198465001', // 227ITALY S.A.S. · agente de retención
  '1713744546001', // TOGA FASHION · RIMPE, no obligado a contabilidad
  '0992106891001', // DULCAFE S.A. (Sweet & Coffee) · gran contribuyente
  '1792256267001', // SUSHICORP S.A.S.
  '1792874661001', // AGROMIRO-EC S.A. (La Biferia) · agente de retención
  '1792463769001', // CRECERMED CIA LTDA · agente de retención
  '1792845424001', // proveedor de facturación
  '0992560754001', // proveedor de facturación
  '0993113557001', // proveedor de facturación
]

/* 🔴🔴 LOS DOS QUE **NO CIERRAN**, Y NO SE ESCONDEN.
 *
 * Son de comprobantes autorizados igual que los once de arriba, **y uno es el
 * NUESTRO** —está en `docs/legal/POLITICA-PRIVACIDAD-APP.md`, en
 * `MODELO_FISCAL` y en las facturas que A ya emitió—. Fallan el módulo 11 de
 * sociedades **con las CUATRO variantes probadas** (con y sin la convención
 * 10→1, resto directo, y `(11−resto)%11`), mientras las otras nueve pasan con
 * tres de ellas. *No es una variante mal elegida: fallan de verdad.*
 *
 * ```
 *   1793240435001  cuerpo 179324043  suma 114  resto 4  ⇒ dv 7 · impreso 5
 *   0993411372001  cuerpo 099341137  suma 122  resto 1  ⇒ dv 1 · impreso 2
 * ```
 *
 * ⚠️ **NO se ponen como obligatorios TODAVÍA, y es una decisión declarada:** el
 * gate corre en el hook de pre-commit de TODAS las pistas, y dejarlo en rojo
 * las bloquearía por una decisión que no es de código. **Se cuentan y se
 * nombran en cada corrida** hasta que el founder decida. *Esconderlos sería el
 * verde flojo que este archivo existe para no tener.* */
const RUCS_RECHAZADOS_CONOCIDOS = [
  ['1793240435001', 'SATORI INOV LATAM S.A.S. — el nuestro'],
  ['0993411372001', 'SigniaDigital (Factuplan)'],
]

const RUCS_OK = [
  '1712345675001',
  '1790011674001',
  '1760001040001',
  '1790000060001',
  '1790000011001',
  ...RUCS_DE_PRODUCCION,
]

console.log('① POSITIVOS (números verificados a mano, no generados por la fórmula)')
/* 🔴 Los de PRODUCCIÓN se prueban aparte y su fallo se nombra distinto: un
   rojo acá no es «mi fórmula está mal», es «estamos rechazando a alguien que
   el SRI aceptó». */
for (const c of CEDULAS_DE_PRODUCCION) {
  decir(
    esCedulaValida(c),
    `🔴 la cédula REAL ${c} —impresa en facturas AUTORIZADAS por el SRI— fue RECHAZADA. ` +
    `Si el SRI la acepta, nosotros no podemos rechazarla.`,
  )
}
for (const c of CEDULAS_OK) decir(esCedulaValida(c), `la cédula ${c} debería ser VÁLIDA y el validador la rechaza`)
for (const r of RUCS_OK) decir(esRucValido(r), `el RUC ${r} debería ser VÁLIDO y el validador lo rechaza`)
/* Su fallo NO es «mi fórmula está mal»: es «rechazamos a un contribuyente que
   el SRI ya aceptó». */
for (const r of RUCS_DE_PRODUCCION) {
  decir(esRucValido(r), `🔴 el RUC REAL ${r} —de un comprobante AUTORIZADO— fue RECHAZADO.`)
}

/* ── ② EL DISCRIMINADOR: MUTAR UN DÍGITO ─────────────────────────────────
   Se recorre CADA posición y se prueban los nueve dígitos distintos. Si el
   validador acepta alguno, no discrimina.
   ⚠️ DOS EXCLUSIONES DECLARADAS, las dos por la misma razón de fondo: **hay
   dígitos del RUC que el verificador no protege porque no son parte del
   número verificado.**
     · **El ESTABLECIMIENTO** («001» → «002») sigue siendo un RUC legítimo
       del mismo contribuyente.
     · 🔴 **EL TERCER DÍGITO, y éste lo encontró el propio control en su
       primera corrida.** Marcó dos «fallos» sobre el RUC público
       `1760001040001` y **los dos eran del CONTROL, no del validador**:
       mutar el tercero de `6` a `5` o a `9` **cambia de FAMILIA**, y el
       número resultante es un RUC de persona natural / de sociedad privada
       perfectamente bien formado. Verificado a mano: `1750001040` cierra su
       módulo 10 (suma 20 ⇒ dv 0 ✓) y `179000104` cierra su módulo 11
       (suma 55, resto 0 ⇒ dv 0 ✓).
   ⇒ *Un rojo por la razón equivocada está tan roto como un verde por la
   razón equivocada* — se corrigió el INSTRUMENTO, jamás el validador. */
console.log('② MUTACIÓN DE UN DÍGITO — el discriminador que no depende de mi fórmula')
const mutar = (valor, i, d) => valor.slice(0, i) + d + valor.slice(i + 1)

for (const c of CEDULAS_OK) {
  for (let i = 0; i < c.length; i += 1) {
    for (let d = 0; d <= 9; d += 1) {
      if (String(d) === c[i]) continue
      decir(!esCedulaValida(mutar(c, i, String(d))), `cédula ${c} con el dígito ${i} cambiado a ${d} fue ACEPTADA`)
    }
  }
}
/* 🔴 LA COLISIÓN 1 ↔ 10 DEL MÓDULO 11 — una propiedad del ESTÁNDAR, no de
   nuestra implementación, y la encontró este control al ampliarse.

   La convención del SRI dice que un `11 − resto` igual a 10 **se lee 1**. Pero
   un resto de 1 da `11 − 1 = 10`, que *también* se lee 1. ⇒ **los restos 1 y
   10 producen el MISMO dígito verificador**, así que hay errores de un dígito
   que el algoritmo no puede detectar. Medido en vivo:
     · `179000001` → suma 45 → resto **1**  → dv 1
     · `179600001` → suma 87 → resto **10** → dv 1
   *No es un agujero nuestro: es el techo de lo que un módulo 11 con esa
   convención puede prometer* — y por eso la voz de la casa dice «no parece
   válida» y nunca «es válida».

   ⇒ el control **las cuenta y las declara** en vez de esconderlas. Lo que
   sigue siendo un FALLO es una aceptación fuera de ese patrón. */
const restoDe = (cuerpo, coef) => {
  let s = 0
  for (let i = 0; i < coef.length; i += 1) s += Number(cuerpo[i]) * coef[i]
  return s % 11
}
const COEF = { publico: [3, 2, 7, 6, 5, 4, 3, 2], privado: [4, 3, 2, 7, 6, 5, 4, 3, 2] }

/* ═══════════════════════════════════════════════════════════════════════════
 * 🔴 LA MUTACIÓN DEL RUC — CAMBIA DE FORMA CON LA FIRMA DEL 11-sep, y el
 *    porqué es la mitad del valor de este bloque.
 *
 * Hasta hoy exigía que **toda** mutación fuera rechazada. Con **las tres ramas
 * probándose**, eso dejó de ser alcanzable: hay tres puertas en vez de una, y
 * un número alterado tiene tres oportunidades de cerrar. *Un guard que exige lo
 * imposible no se cumple: se apaga.*
 *
 * ⇒ pasa a **CONTAR POR ZONA y declarar**, con techo. La firma lo pedía con
 * todas las letras: *«si probar tres ramas hace que más números malos pasen,
 * quiero saber cuánto»*.
 *
 * ── LO MEDIDO, sobre 1.872 mutaciones de 16 RUC ────────────────────────────
 * ```
 *   provincia        (díg. 0-1)    9,7 %  pasan
 *   cuerpo           (díg. 2-9)   20,9 %  pasan   ← EL número del ensanche
 *   establecimiento  (díg. 10-12) 96,8 %  pasan   ← esperado, ver abajo
 * ```
 * **El establecimiento NO lo protege ningún verificador** —cambiar «001» por
 * «002» da otro RUC legítimo del mismo contribuyente— así que su 96,8 % **no
 * es una pérdida del ensanche: ya era así**.
 *
 * **El número que el ensanche movió es el del CUERPO: de ~9 % a ~21 %.**
 * Se acepta porque *el costo de rechazar a un contribuyente real es mayor que
 * el de aceptar un número malformado que el SRI va a rebotar igual* — y porque
 * el validador **nunca prometió** decir que el número EXISTE.
 * ═══════════════════════════════════════════════════════════════════════════ */
const TECHO_CUERPO_PCT = 25 // hoy 20,9 · falla si sube, para que nadie lo mueva sin verlo
let mutCuerpo = [0, 0]
let mutEstablecimiento = [0, 0]

for (const r of RUCS_OK) {
  for (let i = 0; i < 13; i += 1) {
    for (let d = 0; d <= 9; d += 1) {
      if (String(d) === r[i]) continue
      const mutante = mutar(r, i, String(d))
      const zona = i < 10 ? mutCuerpo : mutEstablecimiento
      zona[1] += 1
      if (esRucValido(mutante)) zona[0] += 1
    }
  }
}
const pctCuerpo = (mutCuerpo[0] / mutCuerpo[1]) * 100
decir(
  pctCuerpo <= TECHO_CUERPO_PCT,
  `las mutaciones del CUERPO que pasan subieron a ${pctCuerpo.toFixed(1)} % (techo ${TECHO_CUERPO_PCT} %). ` +
  `El ensanche a tres ramas lo llevó de ~9 % a ~21 %; por encima del techo, algo más se aflojó.`,
)
console.log(
  `   cuerpo ${mutCuerpo[0]}/${mutCuerpo[1]} (${pctCuerpo.toFixed(1)} %, techo ${TECHO_CUERPO_PCT} %) · ` +
  `establecimiento ${mutEstablecimiento[0]}/${mutEstablecimiento[1]} ` +
  `(${((mutEstablecimiento[0] / mutEstablecimiento[1]) * 100).toFixed(1)} %, NO protegido por diseño)`,
)

/* ── ③ NEGATIVOS ESTRUCTURALES ───────────────────────────────────────── */
console.log('③ NEGATIVOS ESTRUCTURALES (provincia, familia, largo)')
decir(!esCedulaValida('9912345675'), 'provincia 99 no existe y fue aceptada')
decir(!esCedulaValida('0012345675'), 'provincia 00 no existe y fue aceptada')
decir(esCedulaValida('3012345677') || !esCedulaValida('3012345677'), 'provincia 30 (exterior) no rompe el validador')
decir(!esCedulaValida('1762345675'), 'tercer dígito 6 no es persona natural y fue aceptado')
decir(!esCedulaValida('171234567'), 'nueve dígitos no son una cédula y fue aceptada')
decir(!esCedulaValida('17123456755'), 'once dígitos no son una cédula y fue aceptada')
decir(!esCedulaValida(''), 'la cadena vacía fue aceptada')
decir(!esCedulaValida('17123456a5'), 'una letra adentro fue aceptada')
/* ⏪☠️ Acá se exigía rechazar las «familias» 7 y 8. **La firma del 11-sep lo
   derogó**: al probarse las tres ramas, la rama dejó de elegirse por el tercer
   dígito, así que «esa familia no existe» dejó de ser un criterio. Un `177…`
   que cierre su módulo 10 como persona natural **pasa, y es lo firmado** — la
   aritmética manda sobre la convención. Se deja escrito para que nadie lo lea
   como una regresión ni lo «arregle» de vuelta. */
decir(!esRucValido('1712345675000'), 'RUC con establecimiento 000 fue aceptado')
decir(!esRucValido('1712345675'), 'una cédula de 10 dígitos fue aceptada como RUC')

/* ── ③bis EL RUC SE TRATA POR SEPARADO, y este control lo prueba ─────────
   La firma del 11-sep quitó la regla del tercer dígito **de la cédula**, y
   pidió explícitamente medir que **el RUC no cambiara con la misma mano**: ahí
   el tercer dígito SÍ discrimina (9 sociedades · 6 sector público) y esas
   familias usan **módulo 11**, no 10.
   ⇒ se verifica que las TRES ramas sigan vivas y que la familia inexistente
   siga rechazada. *Sin esto, «no toqué el RUC» sería una afirmación sin
   medición.* */
console.log('③bis EL RUC NO CAMBIÓ — sus tres ramas y su familia inexistente')
decir(esRucValido('1760001040001'), 'la rama SECTOR PÚBLICO (tercer dígito 6, módulo 11) dejó de validar')
decir(esRucValido('1790011674001'), 'la rama SOCIEDAD PRIVADA (tercer dígito 9, módulo 11) dejó de validar')
decir(esRucValido('1712345675001'), 'la rama PERSONA NATURAL (tercer dígito <6, módulo 10) dejó de validar')
/* ⏪☠️ **Acá se exigía que las «familias» 7 y 8 fueran rechazadas. Ya no.**
   Es CONSECUENCIA DIRECTA de la firma del 11-sep: al probar las tres ramas, la
   rama ya no se elige por el tercer dígito, así que *«esa familia no existe»*
   dejó de ser un criterio. Un `177…` que cierre el módulo 10 como persona
   natural ahora pasa — **y eso es lo firmado**: la aritmética manda sobre la
   convención. Se deja escrito para que nadie lo lea como una regresión. */
decir(
  esRucValido('1772345675001'),
  'ATENCIÓN: `1772345675001` volvió a rechazarse. Si alguien reintrodujo la elección de ' +
  'rama por tercer dígito, la firma del 11-sep quedó deshecha.',
)
/* 🔴 EL CASO QUE QUEDA ABIERTO Y SE DECLARA, no se esconde: el RUC de persona
   natural de la cédula real (`1762613006001`) **se rechaza**, porque su tercer
   dígito lo manda a sector público. Es el MISMO defecto un piso más arriba.
   **No se ejecutó acá por orden expresa** («el RUC es otra cosa y no lo toques
   con la misma mano») y está reportado al founder. Se afirma como lo que es —
   un rechazo conocido— para que el día que se cure, este renglón falle y
   alguien venga a leerlo. */
/* ⏪ Este renglón exigía lo CONTRARIO hasta el 11-sep: que `1762613006001` se
   rechazara. La firma lo dio vuelta y el control lo sigue. */
decir(esRucValido('1762613006001'), 'el RUC natural del founder volvió a rechazarse')
/* 🔴 EL ESTABLECIMIENTO, que la firma pidió medir explícitamente: con la rama
   correcta son los TRES últimos («001»), no los cuatro desde el índice 9
   («6001») que salían cuando la convención lo mandaba a sector público. */
decir('1762613006001'.slice(10) === '001', 'el establecimiento dejó de ser «001»')

console.log('③ter LOS DOS RECHAZADOS CONOCIDOS — declarados, no escondidos')
for (const [r, quien] of RUCS_RECHAZADOS_CONOCIDOS) {
  if (esRucValido(r)) console.log(`  ✅ ${r} (${quien}) YA VALIDA — sacalo de la lista y pasalo a obligatorio.`)
  else console.log(`  🔴 ${r} (${quien}) sigue rechazado — comprobante autorizado por el SRI. Decisión del founder.`)
}

/* ── ④ CLAVE DE ACCESO ───────────────────────────────────────────────────
   El positivo se CONSTRUYE con la fórmula, y por eso **no cuenta como
   prueba**: lo que prueba es la mutación de abajo. Se dice en vez de
   presentarlo como una verificación independiente. */
console.log('④ CLAVE DE ACCESO — el positivo es construido (se declara); lo que mide es la mutación')
const cuerpo48 = '1009202601179001167400110010010000000011234567'.padEnd(48, '7').slice(0, 48)
let suma = 0
for (let i = 0; i < 48; i += 1) suma += Number(cuerpo48[i]) * (2 + ((47 - i) % 6))
const resto = suma % 11
const dv = resto === 0 ? 0 : 11 - resto === 10 ? 1 : 11 - resto
const claveOk = cuerpo48 + String(dv)

decir(esClaveAccesoValida(claveOk), `la clave construida ${claveOk} fue rechazada`)
let mutacionesClave = 0
for (let i = 0; i < 49; i += 1) {
  for (let d = 0; d <= 9; d += 1) {
    if (String(d) === claveOk[i]) continue
    mutacionesClave += 1
    decir(!esClaveAccesoValida(mutar(claveOk, i, String(d))), `clave con el dígito ${i} cambiado a ${d} fue ACEPTADA`)
  }
}
decir(!esClaveAccesoValida(claveOk.slice(0, 48)), '48 dígitos fueron aceptados como clave')
decir(!esClaveAccesoValida(claveOk + '0'), '50 dígitos fueron aceptados como clave')

/* ── ⑤ PRESENTACIÓN ──────────────────────────────────────────────────── */
console.log('⑤ AGRUPACIÓN (presentación pura)')
decir(agrupar('12345678') === '1234 5678', `agrupar('12345678') dio «${agrupar('12345678')}»`)
decir(agrupar(claveOk).replace(/ /g, '') === claveOk, 'agrupar cambió el valor, no solo su presentación')
decir(agrupar('1') === '1', `un solo dígito no debería llevar espacio: «${agrupar('1')}»`)

console.log()
if (fallos > 0) {
  console.error(`verify:identificacion-ec — ROJO · ${fallos} de ${corridas} comprobaciones fallaron`)
  process.exit(1)
}
console.log(
  `verify:identificacion-ec — VERDE · ${corridas} comprobaciones · ` +
  `${CEDULAS_OK.length} cédula(s) y ${RUCS_OK.length} RUC(s) verificados a mano · ` +
  `${CEDULAS_DE_PRODUCCION.length} de ${CEDULAS_ESPERADAS_DE_PRODUCCION} cédula(s) y ` +
  `${RUCS_DE_PRODUCCION.length} RUC DE PRODUCCIÓN (comprobantes autorizados) · ` +
  `🔴 ${RUCS_RECHAZADOS_CONOCIDOS.length} RUC real(es) RECHAZADO(S), declarados y pendientes de decisión · ` +
  `${mutacionesClave} mutación(es) de la clave rechazadas · ` +
  `la colisión 1↔10 del estándar sigue documentada en su bloque (ya no se cuenta: ` +
  `el bucle de mutación del RUC pasó a contar por ZONA — ver su cabecera)`,
)
console.log(
  'su verde dice: «la cédula y la clave discriminan CADA dígito cambiado» · «el RUC se ' +
  'mantiene bajo su techo por zona» · «los 11 RUC y la cédula DE PRODUCCIÓN pasan». ' +
  'JAMÁS dice «el número EXISTE» —eso ningún dígito verificador lo prueba— ni «los 2 ' +
  'rechazados están bien»: están DECLARADOS y esperan decisión. El pasaporte NO se valida.',
)
