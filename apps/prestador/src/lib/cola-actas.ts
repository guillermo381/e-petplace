/**
 * cola-actas.ts — EL ACTA SE LEVANTA EN LA PUERTA, CON O SIN SEÑAL (S107-D).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ **ENMENDADO AL CABLEAR (29-ago): EL ACTA YA NO ESPERA A SUS FOTOS.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **Medido contra la función viva, no contra el contrato:**
 * `levantar_acta_guarderia(p_estadia_id, p_direccion, p_carnet_verificado,
 * p_objetos, p_observaciones, p_cerrada_en, p_clave_idempotencia)` — **no
 * recibe `mediaIds[]`**, aunque el contrato escrito los pedía.
 *
 * ⇒ **El choque que esta pieza nació para resolver dejó de existir**, y la
 * pieza queda igual de necesaria por la otra mitad: *el acta se levanta en la
 * puerta, donde puede no haber señal, y no puede perderse.* Lo que cambia es la
 * dependencia — **el acta viaja apenas puede; sus fotos viajan por su cuenta**,
 * y ninguna espera a la otra. *Menos acoplamiento del que había diseñado: la
 * medición achicó la pieza en vez de agrandarla.*
 *
 * 🔴 **Lo que la enmienda deja ABIERTO, y va declarado a A (no lo decide D):**
 * si el acta no referencia sus fotos, **qué las ata al acta es (estadía, día)**
 * — y ese conjunto incluye también la media del durante. En un registro cuyo
 * valor es probatorio (*«el estado del animal con fotografías fechadas»*,
 * criterio §4), *«las fotos de ese día»* no es lo mismo que *«las fotos de esta
 * acta»*. Puede ser deliberado y suficiente; **no lo asumo ni lo arreglo por mi
 * cuenta.** Las fotos igual quedan atadas localmente (`fotosLocales`) para que
 * la pantalla sepa cuáles mostró.
 *
 * ── LO QUE SIGUE RIGIENDO IGUAL ──────────────────────────────────────────
 * El contrato firma dos cosas que no se pueden romper:
 *
 *  · *«las fotos del estado son media etiquetada»* (una sola forma para los dos
 *    lados), y
 *  · 🔴 *«si no confirma en el momento, **la recogida NO se frena**»* — el
 *    espíritu entero del §④: *un animal esperando en la puerta mientras alguien
 *    busca el teléfono es peor que un acta sin conformar.*
 *
 * Y el acta **nace cerrada**: un trigger rechaza todo `UPDATE` salvo la
 * conformidad. ⇒ **no se puede levantar sin fotos y agregarlas después.**
 *
 ⇒ En la puerta, el acta **existe localmente y con su hora**; el viaje al
 * servidor ocurre cuando hay señal. *La hora que vale es la de la puerta, no la
 * de la subida* — por eso `levantadaEn` se sella al crearla acá y **viaja** en
 * `p_cerrada_en`: el servidor no la inventa del `INSERT`.
 *
 * ── LO QUE ESTA COLA NO HACE ─────────────────────────────────────────────
 * No confirma nada por el dueño (eso es su app, su sesión — firma ⑥) y **no
 * bloquea nada**: si el acta no llegó a publicarse, la estadía sigue su curso y
 * la pantalla lo dice. *Un acta pendiente de subir es un registro que existe;
 * un acta que frena la operación es un registro que nadie va a querer levantar.*
 */

import { almacenActual, enFila } from './almacen';

const CLAVE = 'epp.cola_actas.v1';

export type DireccionActa = 'recogida' | 'devolucion';

export type EstadoActa =
  /** falta que suban sus fotos. */
  | 'esperando_media'
  /** fotos arriba: lista para viajar. */
  | 'lista'
  | 'levantando'
  | 'levantada'
  | 'error';

export interface ActaLocal {
  id: string;
  estadiaId: string;
  direccion: DireccionActa;
  carnetVerificado: boolean;
  objetos?: string;
  observaciones?: string;
  /** ids LOCALES de la cola de media — se traducen a `mediaIds` al viajar. */
  fotosLocales: string[];
  /** 🔴 La hora de la PUERTA, no la de la subida. */
  levantadaEn: number;
  estado: EstadoActa;
  /** id de servidor, cuando llegó. */
  actaId?: string;
  intentos: number;
  detalle?: string;
}

/**
 * ✅ **El pedido entró:** medido contra la función viva, `levantar_acta_guarderia`
 * **devuelve `ya_existia`** en vez de un `23505` pelado, y `guarderia_actas`
 * lleva su `UNIQUE (estadia_id, direccion)`. *Un reintento que rebota obligaría
 * a esta cola a distinguir «falló» de «ya estaba», que es justo lo que no puede
 * saber con un timeout ambiguo.*
 *
 * ⚠️ **Un matiz medido y anotado, no bloqueante:** la función resuelve la
 * idempotencia **sin `ON CONFLICT`** (mira antes de insertar), así que **queda
 * una ventana de carrera** si dos cuidadores levantaran la misma acta en el
 * mismo instante. Para esta cola no aplica —un teléfono, secuencial—, y por eso
 * se declara en vez de pedirse.
 */
export type LevantarActa = (entrada: {
  estadiaId: string;
  direccion: DireccionActa;
  carnetVerificado: boolean;
  objetos?: string;
  observaciones?: string;
  /** La hora de la puerta viaja: el servidor no la inventa del INSERT. */
  levantadaEn: string;
  claveIdempotencia: string;
}) => Promise<
  | { ok: true; actaId: string; ya_existia?: boolean }
  | { ok: false; codigo: string; mensaje: string }
>;

// ══════════════════ PERSISTENCIA ═══════════════════════════════════════════

async function leerCrudo(): Promise<ActaLocal[]> {
  try {
    const a = almacenActual();
    if (!a) return [];
    const txt = await a.getItem(CLAVE);
    if (!txt) return [];
    const dato: unknown = JSON.parse(txt);
    if (!Array.isArray(dato)) return [];
    return dato.filter(
      (x): x is ActaLocal =>
        !!x && typeof x === 'object' && typeof (x as ActaLocal).id === 'string' && Array.isArray((x as ActaLocal).fotosLocales),
    );
  } catch (e) {
    console.error(`[cola-actas] LECTURA falló · ${String(e)}`);
    return [];
  }
}

async function escribir(actas: ActaLocal[]): Promise<void> {
  const a = almacenActual();
  if (!a) throw new Error('cola-actas: sin almacén — el acta no quedó guardada');
  await a.setItem(CLAVE, JSON.stringify(actas));
}

export async function leerActas(): Promise<ActaLocal[]> {
  return (await leerCrudo()).map((x) => (x.estado === 'levantando' ? { ...x, estado: 'lista' as const } : x));
}

async function mutar(id: string, cambios: Partial<ActaLocal>): Promise<void> {
  return enFila(async () => {
    const actas = await leerCrudo();
    await escribir(actas.map((x) => (x.id === id ? { ...x, ...cambios } : x)));
  });
}

// ══════════════════ LEVANTAR ═══════════════════════════════════════════════

export interface AltaActa {
  estadiaId: string;
  direccion: DireccionActa;
  carnetVerificado: boolean;
  objetos?: string;
  observaciones?: string;
  /** ids locales de las fotos ya encoladas para esta estadía. */
  fotosLocales: string[];
}

/**
 * Levanta el acta **en la puerta**. Devuelve al instante: no espera red, no
 * espera fotos, no espera al dueño.
 *
 * 🔴 **Sin fotos no se levanta.** El criterio §4 es explícito: *«sin foto de
 * entrada la pregunta de cuándo apareció la lesión no tiene respuesta, y la
 * carga cae sobre quien tenía al animal»*. Un acta sin fotos no es un acta más
 * pobre: es la que no sirve para lo único que existe.
 */
export async function levantarActaLocal(alta: AltaActa): Promise<ActaLocal> {
  if (alta.fotosLocales.length === 0) {
    throw new Error('cola-actas: un acta sin fotos de estado no prueba nada (criterio §4)');
  }
  const acta: ActaLocal = {
    id: `acta-${alta.direccion}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    estadiaId: alta.estadiaId,
    direccion: alta.direccion,
    carnetVerificado: alta.carnetVerificado,
    objetos: alta.objetos,
    observaciones: alta.observaciones,
    fotosLocales: [...alta.fotosLocales],
    levantadaEn: Date.now(),
    estado: 'esperando_media',
    intentos: 0,
  };
  await enFila(async () => {
    const actas = await leerCrudo();
    await escribir([...actas, acta]);
  });
  return acta;
}

export async function pendientesDeEstadia(estadiaId: string): Promise<ActaLocal[]> {
  return (await leerActas()).filter((x) => x.estadiaId === estadiaId && x.estado !== 'levantada');
}

/**
 * Empuja las actas que ya tienen todas sus fotos arriba.
 *
 * El orden importa y por eso esta cola corre **después** de la de media: sin
 * `mediaIds` reales el acta no puede viajar, y `mediaIdsDe` devuelve `null`
 * mientras falte una — *un acta con la mitad de sus fotos no es un acta a
 * medias: dice algo distinto del que se levantó en la puerta.*
 */
export async function procesarActas(
  levantar: LevantarActa | null,
): Promise<{ levantadas: number; esperandoMedia: number; enError: number }> {
  const resumen = { levantadas: 0, esperandoMedia: 0, enError: 0 };
  const pendientes = (await leerActas()).filter((x) => x.estado !== 'levantada' && x.estado !== 'error');

  for (const acta of pendientes) {
    // ⚠️ ENMIENDA 29-ago: ya NO se espera a que suban las fotos. La función
    // viva no recibe `mediaIds`, así que hacerla esperar sería inventar un
    // acoplamiento que el motor no pide — y dejaría el acta en el teléfono
    // por una razón que dejó de existir.
    if (!levantar) {
      await mutar(acta.id, { estado: 'lista', detalle: 'levantarActaGuarderia todavía no existe' });
      resumen.esperandoMedia += 1;
      continue;
    }

    await mutar(acta.id, { estado: 'levantando' });
    const r = await levantar({
      estadiaId: acta.estadiaId,
      direccion: acta.direccion,
      carnetVerificado: acta.carnetVerificado,
      objetos: acta.objetos,
      observaciones: acta.observaciones,
      levantadaEn: new Date(acta.levantadaEn).toISOString(),
      claveIdempotencia: acta.id,
    });

    if (!r.ok) {
      const intentos = acta.intentos + 1;
      console.error(`[cola-actas] ${acta.direccion} ${acta.id} · intento ${intentos} · ${r.codigo} · ${r.mensaje}`);
      // 🔴 El acta NUNCA se descarta sola, y nunca queda 'error' definitivo por
      // reintentos: es prueba. Queda 'lista' y vuelve a intentar — el que
      // decide rendirse es soporte, con el registro delante.
      await mutar(acta.id, { estado: 'lista', intentos, detalle: `${r.codigo}: ${r.mensaje}` });
      resumen.enError += 1;
      continue;
    }

    await mutar(acta.id, { estado: 'levantada', actaId: r.actaId, detalle: undefined });
    resumen.levantadas += 1;
  }

  return resumen;
}
