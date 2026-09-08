/**
 * verify:postventa-contrato — LOS ROJOS DE §11, PROBADOS UNO POR UNO.
 * (S114-D, lote 0.)
 *
 * ── QUÉ MIDE ────────────────────────────────────────────────────────────────
 * Los cuatro rojos que la letra le encarga a D, menos el de NEXO (que vive en
 * `verify-postventa-nexo.mts` porque su sujeto es otro):
 *   ① una salida con `confirmado_por`      → la confirmación fabricada
 *   ② un motivo fuera del catálogo
 *   ③ cualquier campo de estado, monto o transición en la salida del modelo
 *   ④ (control) la clase del modelo se IGNORA y se copia de la fila
 *
 * ── LO PRIMERO QUE ESTE ARNÉS TIENE QUE PROBAR NO ES EL VERDE ──────────────
 * 🔴 `L-459`: la primera prueba de un guard nuevo es que dé ROJO. Un guard que
 * rechaza todo también rechaza los ataques, y su verde no dice nada. Por eso
 * cada rojo viene con su **control positivo**: la misma salida SIN el defecto
 * tiene que pasar. Si el bloque de controles falla, el arnés sale en rojo
 * aunque los ataques hayan sido todos rechazados.
 *
 * ── CONTRA QUÉ CATÁLOGO MIDE, Y SE DICE ────────────────────────────────────
 * ⚠️ Prefiere el catálogo VIVO de la base. Si no hay credencial, usa un fixture
 * y **lo declara en la salida** — nunca calla con cuál midió. Y cuando hay
 * credencial, además **compara el fixture contra la base y avisa si divergió**:
 * un fixture copiado de una tabla viva se vuelve falso solo, sin que nada falle.
 */
import { execFileSync } from 'node:child_process'
import {
  CAMPOS_DE_CONFIRMACION,
  CAMPOS_QUE_DECIDEN,
  type MotivoCatalogo,
  validarIntake,
} from '../supabase/functions/_shared/postventa/contrato.ts'

/** FIXTURE — declarado como tal, y es el conjunto RESUELTO de `cita` (lo que la
 *  vista devuelve para ese objeto), no una muestra de la tabla entera. */
const FIXTURE: MotivoCatalogo[] = [
  { codigo: 'no_ejecutado', objeto: 'cita', clase: 1, urgente: false, voz: 'No vino / no me atendieron', pide_foto: false },
  { codigo: 'calidad', objeto: 'cita', clase: 2, urgente: false, voz: 'El servicio no fue como esperaba', pide_foto: false },
  { codigo: 'mascota_afectada', objeto: 'cita', clase: 3, urgente: true, voz: 'Mi mascota volvió lastimada o enferma', pide_foto: true },
  { codigo: 'otra_cosa', objeto: 'todos', clase: 2, urgente: false, voz: 'Es otra cosa · contame', pide_foto: false },
]

/* 🔴 SE LEE EL MISMO OBJETO QUE LEE LA EDGE: `v_motivos_resueltos` filtrada
   por `objeto_resuelto`, no la tabla cruda. Antes el arnés cargaba las 19 filas
   de los tres objetos y esperaba que `validarIntake` filtrara — o sea que
   medía una responsabilidad que la función ya no tiene (la herencia la resuelve
   la vista de A). *Un arnés que le da a la función una entrada que el producto
   nunca le va a dar mide otra cosa que el producto.* */
function catalogoVivo(): { filas: MotivoCatalogo[]; fuente: string } {
  try {
    const salida = execFileSync('npx', [
      'supabase', '--experimental', 'db', 'query', '--linked',
      "select codigo, objeto_origen as objeto, clase, urgente, voz, pide_foto, true as activo from public.v_motivos_resueltos where objeto_resuelto = 'cita';",
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 120_000, cwd: process.env.EPP_RAIZ ?? process.cwd() })
    const json = JSON.parse(salida.slice(salida.indexOf('{')))
    if (!Array.isArray(json.rows) || json.rows.length === 0) throw new Error('sin filas')
    return { filas: json.rows as MotivoCatalogo[], fuente: `v_motivos_resueltos · objeto_resuelto='cita' (${json.rows.length} filas)` }
  } catch {
    return { filas: FIXTURE, fuente: `FIXTURE de ${FIXTURE.length} filas — SIN credencial, no se midió contra la base` }
  }
}

const { filas: CAT, fuente } = catalogoVivo()

/* 🔴 EL FIXTURE SE COTEJA CONTRA LA BASE CUANDO HAY BASE. Un fixture copiado de
   una tabla viva se vuelve falso solo y nada falla — el arnés seguiría en verde
   midiendo un catálogo que ya no existe. Acá no se compara la tabla entera (no
   es su trabajo: eso lo hace el cinturón de la migración de A), sólo **las filas
   que el fixture dice conocer**: si alguna cambió de clase, de urgencia o de
   foto, este arnés estaba midiendo contra una copia vencida. */
const divergencias: string[] = []
if (fuente.startsWith('BASE VIVA')) {
  for (const f of FIXTURE) {
    const viva = CAT.find((m) => m.codigo === f.codigo && m.objeto === f.objeto)
    if (viva === undefined) { divergencias.push(`\`${f.codigo}/${f.objeto}\` está en el fixture y NO en la base`); continue }
    for (const k of ['clase', 'urgente', 'pide_foto', 'voz'] as const) {
      if (viva[k] !== f[k]) divergencias.push(`\`${f.codigo}/${f.objeto}\`.${k}: fixture=${JSON.stringify(f[k])} base=${JSON.stringify(viva[k])}`)
    }
  }
}

let rojos = 0
let verdes = 0
const fallas: string[] = []

function debeRechazar(nombre: string, crudo: unknown, esperado: string, objeto = 'cita') {
  const r = validarIntake(crudo, CAT, objeto, 'texto')
  if (r.ok) {
    fallas.push(`✗ ${nombre}: PASÓ y debía caer (esperado ${esperado})`)
  } else if (r.rechazo !== esperado) {
    fallas.push(`✗ ${nombre}: cayó por \`${r.rechazo}\`, se esperaba \`${esperado}\``)
  } else { rojos++; return }
}

function debePasar(nombre: string, crudo: unknown, objeto = 'cita') {
  const r = validarIntake(crudo, CAT, objeto, 'texto')
  if (!r.ok) fallas.push(`✗ CONTROL ${nombre}: cayó por \`${r.rechazo}\` (${r.detalle}) y debía pasar`)
  else verdes++
}

const BUENA = { motivo: 'calidad', resumen: 'El paseo duró menos de lo acordado.', evidencia_falta: ['hora_del_hecho'] }

console.log(`\n  catálogo: ${fuente}\n`)

// ── ROJO ① · LA CONFIRMACIÓN FABRICADA ──────────────────────────────────────
for (const campo of CAMPOS_DE_CONFIRMACION) {
  debeRechazar(`① confirmación · \`${campo}\``, { ...BUENA, [campo]: 'usuario-123' }, 'confirmacion_fabricada')
}

// ── ROJO ② · MOTIVO FUERA DEL CATÁLOGO ──────────────────────────────────────
debeRechazar('② motivo inventado', { ...BUENA, motivo: 'servicio_pesimo' }, 'motivo_fuera_de_catalogo')
debeRechazar('② motivo vacío', { ...BUENA, motivo: '   ' }, 'forma_invalida')
debeRechazar('② salida que no es objeto', 'calidad', 'forma_invalida')

// ── ROJO ③ · CAMPOS QUE DECIDEN — CADA UNO, NO UNA MUESTRA ──────────────────
for (const campo of CAMPOS_QUE_DECIDEN) {
  debeRechazar(`③ decide · \`${campo}\``, { ...BUENA, [campo]: 'lo que sea' }, 'campo_que_decide')
}
// Y con MAYÚSCULAS y con tilde, que es como el modelo los escribe de verdad.
debeRechazar('③ decide · `Monto` (mayúscula)', { ...BUENA, Monto: 45 }, 'campo_que_decide')
debeRechazar('③ decide · `resolución` (con tilde)', { ...BUENA, 'resolución': 'reembolso' }, 'campo_que_decide')

// ── CONTROLES POSITIVOS · sin esto, el arnés no mide: sólo dice que no ───────
debePasar('salida limpia', BUENA)
debePasar('sin evidencia', { motivo: 'calidad', resumen: 'No fue como esperaba.' })
debePasar('motivo `todos` sobre cita', { motivo: 'otra_cosa', resumen: 'Es otra cosa.' })
/* La herencia ya no la resuelve `validarIntake` — la resuelve la vista de A
   desde `cat_motivos_herencia`. Lo que se mide acá es que un motivo que NO está
   en el conjunto que la edge recibió cae, sin importar de qué objeto sea: es la
   propiedad que queda del lado de esta función. */
debeRechazar('② motivo que no está en el conjunto recibido',
  { ...BUENA, motivo: 'devolucion_tarde' }, 'motivo_fuera_de_catalogo')

// ── ROJO ④ · LA CLASE LA TRAE LA FILA, NUNCA EL MODELO ──────────────────────
// Es el control de §4, y **su alcance está medido, no supuesto** — el control
// negativo del lote lo obligó a reescribirse:
//
// 🔴 ③ DOMINA A ④, Y SE MIDIÓ. Se aplicó a propósito la rotura «la clase sale
//    del modelo si la manda» (`clase: (o.clase as number) ?? fila.clase`) y el
//    arnés dio VERDE. Sonda directa: una entrada con `clase: 1` **cae por
//    `campo_que_decide` antes de llegar a ese renglón** — con la rotura puesta
//    y sin ella, el mismo resultado. *La rotura era inalcanzable, así que el
//    verde era correcto y mi caso ④ no medía lo que su nombre decía.*
//
// ✅ PERO LA SEGUNDA CAPA EXISTE, y también se midió: sacando `clase` de la
//    lista negra —el «alguien limpia el guard» que sí puede pasar— la propuesta
//    **siguió saliendo con la clase de la fila (3, no la 1 del modelo)**. Con
//    las dos capas rotas a la vez, recién ahí salió 1. *Son dos capas de
//    verdad, y la de abajo es que la propuesta se construye campo por campo
//    desde `fila` y nunca con un spread del crudo.*
//
// Lo que este bloque mide, entonces, es lo alcanzable: que los cuatro campos de
// la fila **salgan de la fila y discriminen** — sin eso, un guard que devolviera
// siempre clase 3 pasaría igual.
{
  const r = validarIntake({ motivo: 'mascota_afectada', resumen: 'Volvió lastimada.' }, CAT, 'cita', 'texto')
  if (!r.ok) fallas.push(`✗ ④ clase: la salida limpia cayó por \`${r.rechazo}\``)
  else if (r.propuesta.clase !== 3 || r.propuesta.urgente !== true) {
    fallas.push(`✗ ④ clase: \`mascota_afectada\` dio clase=${r.propuesta.clase} urgente=${r.propuesta.urgente}, la fila dice 3/true`)
  } else verdes++
}
// Y su discriminador: un motivo de clase 2 NO puede salir urgente. Sin este
// caso, un guard que devolviera siempre `clase: 3` pasaría el de arriba.
{
  const r = validarIntake({ motivo: 'calidad', resumen: 'No fue como esperaba.' }, CAT, 'cita', 'texto')
  if (!r.ok) fallas.push('✗ ④ discriminador: cayó')
  else if (r.propuesta.clase !== 2 || r.propuesta.urgente !== false) {
    fallas.push(`✗ ④ discriminador: \`calidad\` dio clase=${r.propuesta.clase} urgente=${r.propuesta.urgente}, la fila dice 2/false`)
  } else verdes++
}

// ── `pide_foto` SALE DE LA FILA, NO DE LA CLASE ─────────────────────────────
// El discriminador no lo inventé: lo dejó escrito A en el COMMENT de la tabla.
// `mascota_extraviada` es clase 3 y **no** pide foto —«no se fotografía una
// ausencia»— así que es el único caso que separa «pide_foto viene de la fila»
// de «clase 3 ⇒ foto». Sin él, las dos reglas dan el mismo resultado siempre.
{
  const conExtraviada = [...CAT, {
    codigo: 'mascota_extraviada', objeto: 'cita', clase: 3, urgente: true,
    voz: 'Mi mascota se perdió durante el servicio', pide_foto: false,
  }]
  const a = validarIntake({ motivo: 'mascota_afectada', resumen: 'x' }, conExtraviada, 'cita', 'texto')
  const b = validarIntake({ motivo: 'mascota_extraviada', resumen: 'x' }, conExtraviada, 'cita', 'texto')
  if (!a.ok || !b.ok) fallas.push('✗ pide_foto: alguno de los dos cayó')
  else if (a.propuesta.pide_foto !== true || b.propuesta.pide_foto !== false) {
    fallas.push(`✗ pide_foto: afectada=${a.propuesta.pide_foto} extraviada=${b.propuesta.pide_foto}, las filas dicen true/false`)
  } else if (a.propuesta.clase !== 3 || b.propuesta.clase !== 3) {
    fallas.push('✗ pide_foto: el discriminador no discrimina — las dos deben ser clase 3')
  } else verdes++
}

// ── LA VOZ DEL CATÁLOGO ES LA DEL FOUNDER, NO LA DEL MODELO ─────────────────
{
  const r = validarIntake({ motivo: 'calidad', resumen: 'algo que escribió el modelo' }, CAT, 'cita', 'texto')
  const dice = CAT.find((m) => m.codigo === 'calidad')!.voz
  if (!r.ok) fallas.push('✗ voz: cayó')
  else if (r.propuesta.voz_catalogo !== dice) {
    fallas.push(`✗ voz: salió "${r.propuesta.voz_catalogo}", la fila dice "${dice}"`)
  } else verdes++
}

// ── `confirmado_por` NO EXISTE en ninguna salida ok ─────────────────────────
{
  const r = validarIntake(BUENA, CAT, 'cita', 'texto')
  if (r.ok && Object.keys(r.propuesta).some((k) => k.startsWith('confirmado'))) {
    fallas.push('✗ la propuesta trae un campo `confirmado*`')
  } else verdes++
}

if (divergencias.length > 0) {
  fallas.push(...divergencias.map((d) => `✗ FIXTURE VENCIDO · ${d}`))
}

console.log(`  ataques rechazados: ${rojos}`)
console.log(`  controles en verde: ${verdes}`)
if (fallas.length > 0) {
  console.error(`\n  🔴 ROJO — ${fallas.length} fallas:\n${fallas.map((f) => '   ' + f).join('\n')}\n`)
  process.exit(1)
}
console.log(`\n  ✅ VERDE · ${rojos} ataques rechazados con su nombre · ${verdes} controles positivos\n`)
