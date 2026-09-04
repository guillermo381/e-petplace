/**
 * EL ROJO QUE VIVE EN EL COMPILADOR (S113-B · lote 0).
 *
 * 🔴 **No es un archivo de ejemplos: es un GATE.** Cada `@ts-expect-error` de
 * acá **falla el typecheck si el error deja de ocurrir** — o sea, si alguien
 * ablanda los tipos de `PresenciaCoach`, este archivo se pone rojo en el mismo
 * `pnpm typecheck` de siempre. *Un rojo que hay que acordarse de correr no es
 * un gate; éste corre en cada commit porque es parte de la compilación.*
 *
 * No se importa desde ninguna parte y no viaja en el bundle: sólo declara
 * tipos y `void`ea las constantes. **Su valor entero está en los errores que
 * NO ocurren cuando todo está bien.**
 */
import type { AtajoCoach, AtajosCoach } from './PresenciaCoach'

const ir = () => {}

/* ── LO QUE SÍ SE PUEDE ESCRIBIR ─────────────────────────────────────── */
const vivo: AtajoCoach = { id: 'a', icono: 'paseo', etiqueta: 'Paseo', onPress: ir }
const apagadoConRazon: AtajoCoach = {
  id: 'b', icono: 'despensa', etiqueta: 'Despensa',
  razonApagado: 'Todavía no hay tiendas cerca tuyo',
}
void vivo
void apagadoConRazon

/* ── ① UN BOTÓN APAGADO Y MUDO NO SE PUEDE ESCRIBIR ───────────────────
 * Es el defecto que el encargo nombró: *«un botón apagado sin razón a la
 * vista es el defecto»*. Sin `onPress` y sin `razonApagado` no compila. */
// @ts-expect-error — apagado y mudo: falta `razonApagado`
const mudo: AtajoCoach = { id: 'c', icono: 'carnet', etiqueta: 'Carnet' }
void mudo

/* ── ② NI VIVO NI APAGADO A LA VEZ ────────────────────────────────────
 * Con los dos, no se sabe qué hace el toque: ¿ejecuta o explica? */
// @ts-expect-error — `onPress` y `razonApagado` juntos son contradictorios
const ambiguo: AtajoCoach = {
  id: 'd', icono: 'ayuda', etiqueta: 'Ayuda', onPress: ir, razonApagado: 'no',
}
void ambiguo

/* ── ③ SON CUATRO DEDOS. NI TRES NI CINCO ────────────────────────────
 * *La pieza no inventa el quinto — y el compilador no la deja.* */
// @ts-expect-error — tres no alcanzan
const tres: AtajosCoach = [vivo, vivo, vivo]
void tres

// @ts-expect-error — cinco sobran
const cinco: AtajosCoach = [vivo, vivo, vivo, vivo, vivo]
void cinco

const cuatro: AtajosCoach = [vivo, vivo, apagadoConRazon, vivo]
void cuatro

/* ── ④ EL ÍCONO SALE DEL REGISTRY ────────────────────────────────────
 * Un glifo inventado acá se saltearía §6b y su gate por ícono. */
// @ts-expect-error — 'orbe' no existe en el registry de la casa
const inventado: AtajoCoach = { id: 'e', icono: 'orbe', etiqueta: 'x', onPress: ir }
void inventado

/* ── ⑤ LOS TRES DEL COACH SÍ ENTRAN, Y ES LA OTRA MITAD DEL ROJO ──────
 * 🔴 **Un gate que sólo prueba que algo falla no prueba que lo correcto
 * pase.** Si `IconoNombre` se rompiera entera, ④ seguiría verde —el error
 * seguiría ocurriendo— y nadie se enteraría de que el registry quedó
 * inservible. Estas tres líneas son su control positivo: **compilan si y
 * sólo si los glifos existen de verdad en el registry.** */
const conPeso: AtajoCoach = { id: 'p', icono: 'peso', etiqueta: 'Peso', onPress: ir }
const conAnti: AtajoCoach = { id: 'a', icono: 'antiparasitario', etiqueta: 'Antipulgas', onPress: ir }
const conFoto: AtajoCoach = { id: 'f', icono: 'foto', etiqueta: 'Foto', onPress: ir }
void conPeso
void conAnti
void conFoto

/* Y su vecino falso, para que el control positivo no pase por casualidad:
   un nombre PARECIDO al nuevo tampoco entra. */
// @ts-expect-error — 'pesos' (en plural) no existe: el registry no adivina
const casiPeso: AtajoCoach = { id: 'g', icono: 'pesos', etiqueta: 'x', onPress: ir }
void casiPeso
