/**
 * cola-actas.ts — EL ACTA SE LEVANTA EN LA PUERTA, CON O SIN SEÑAL (S107-D).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **EL CHOQUE QUE ESTA PIEZA RESUELVE, y no es un detalle de red.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * El contrato de actas pide `levantarActaGuarderia({ …, mediaIds[] })` — o sea
 * **fotos YA publicadas** — y al mismo tiempo firma dos cosas que no se pueden
 * romper:
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
 * Las tres salidas posibles, y por qué queda una:
 *  ① esperar a que la media suba antes de levantar → **frena la recogida**.
 *     Prohibido por el contrato.
 *  ② levantar sin `mediaIds` y completarlos luego → **imposible**: cerrada no
 *     se edita, y esa inmutabilidad es lo que hace que el acta pruebe algo.
 *  ③ **encolar el acta ENTERA junto a sus fotos** y publicarla cuando todas
 *     estén arriba. ⇐ la única que respeta las dos reglas.
 *
 * ⇒ En la puerta, el acta **existe localmente y con su hora**; el viaje al
 * servidor ocurre cuando hay señal. *La hora que vale es la de la puerta, no la
 * de la subida* — por eso `levantadaEn` se sella al crearla acá.
 *
 * ── LO QUE ESTA COLA NO HACE ─────────────────────────────────────────────
 * No confirma nada por el dueño (eso es su app, su sesión — firma ⑥) y **no
 * bloquea nada**: si el acta no llegó a publicarse, la estadía sigue su curso y
 * la pantalla lo dice. *Un acta pendiente de subir es un registro que existe;
 * un acta que frena la operación es un registro que nadie va a querer levantar.*
 */

import { almacenActual, enFila } from './almacen';
import { mediaIdsDe } from './cola-media';

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
 * Lo que la app necesita de A. **`UNIQUE (estadia_id, direccion)` ya es su
 * idempotencia natural** — pero eso solo sirve si el segundo intento **no
 * rebota**.
 *
 * 🔴 **PEDIDO A LA PISTA A, mismo argumento que el ya adoptado para
 * `publicarMedia`:** un reintento tras un timeout ambiguo tiene que devolver
 * **el acta que ya existe** (`ya_existia: true`), no un error de unicidad. *Un
 * reintento que rebota obliga a esta cola a distinguir «falló» de «ya estaba»,
 * y esa distinción es justo la que no puede hacer con un timeout ambiguo.* Si
 * vuelve `23505` pelado, el acta correcta queda marcada en error para siempre
 * — y un guard que vive en un índice **sólo puede negarse** (`L-424`).
 */
export type LevantarActa = (entrada: {
  estadiaId: string;
  direccion: DireccionActa;
  carnetVerificado: boolean;
  objetos?: string;
  observaciones?: string;
  mediaIds: string[];
  /** La hora de la puerta viaja: el servidor no la inventa del INSERT. */
  levantadaEn: string;
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
    const mediaIds = await mediaIdsDe(acta.fotosLocales);
    if (!mediaIds) {
      if (acta.estado !== 'esperando_media') await mutar(acta.id, { estado: 'esperando_media' });
      resumen.esperandoMedia += 1;
      continue;
    }

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
      mediaIds,
      levantadaEn: new Date(acta.levantadaEn).toISOString(),
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
