/**
 * cola-media.ts — LA COLA DE MEDIA QUE SOBREVIVE AL CIERRE (S107-D).
 *
 * ── POR QUÉ NACE, medido y no supuesto ───────────────────────────────────
 * La casa YA tenía una "cola": `clips-sesion.ts` (S63). Es un `Map` de módulo
 * y su propia cabecera lo dice — *«muere con la app»* — justificado en
 * `MODELO_ADIESTRAMIENTO` §12.6: *«captura jamás exigida al cierre: un clip
 * perdido no bloquea nada»*.
 *
 * 🔴 **Esa justificación NO se traslada a la guardería.** La foto del acta es
 * respaldo legal (`CRITERIO_LEGAL_GUARDERIA` §4: *«las dos actas valen más que
 * el contrato»* — sin foto de entrada, la pregunta de cuándo apareció la
 * lesión no tiene respuesta, y la carga cae sobre quien tenía al animal). Una
 * foto que se pierde al cerrar la app no es una molestia: **es la prueba que
 * faltaba.** Por eso esta cola persiste, y por eso NUNCA descarta sola un
 * ítem que no llegó a publicarse.
 *
 * ── LO QUE HEREDA (no se re-implementa) ──────────────────────────────────
 * El chasis de dos pasos con huérfano recuperable de `subir-evidencia.ts` /
 * `subir-clip.ts` (S44, curado S61): subir bytes → registrar; si el registro
 * falla con la subida hecha, el reintento **entra por `storagePath` y salta al
 * paso 2 — jamás re-sube**. Acá eso es un ESTADO persistido
 * (`subida_sin_registrar`), así que sobrevive también al cierre.
 *
 * ── EL LÍMITE, DECLARADO ─────────────────────────────────────────────────
 * ⚠️ **La cola persiste; NO sube con la app cerrada.** Subir en segundo plano
 * exige un módulo nativo nuevo (background task) ⇒ binario. Lo que esta cola
 * garantiza es que **nada se pierde**: al reabrir, lo pendiente sigue ahí y
 * reintenta solo. *Prometer subida en background sin el módulo sería la clase
 * de voz que L-139 prohíbe: verosímil y falsa.*
 *
 * ── INERTE HASTA QUE EL MOTOR EXISTA (molde S91) ─────────────────────────
 * El registro de media etiquetada **no existe todavía** (pedido D→A ①: hoy
 * `evento_archivo_adjunto.evento_padre_id` es NOT NULL y fuerza una media por
 * animal — medido: 0 paths compartidos en toda la base). Por eso el
 * registrador y el subidor **entran INYECTADOS**: esta pieza no importa ningún
 * wrapper. Sin dependencias cableadas no procesa nada y lo dice
 * (`motor_no_cableado`) — jamás falla en silencio.
 */

/**
 * ── EL ALMACÉN SE INYECTA (y por eso esta cola se puede PROBAR) ───────────
 * `require` en try/catch, patrón de `bloqueo-biometrico.ts` (S104): si el
 * nativo no está en el build, queda `null` y la cola lo DICE en vez de
 * crashear al montar. El mismo hueco permite correr el arnés en node con un
 * almacén en memoria — *una cola cuyo modo de falla es perder trabajo tiene
 * que poder fallar en un banco antes que en la calle* (L-192).
 */
export interface Almacen {
  getItem(clave: string): Promise<string | null>;
  setItem(clave: string, valor: string): Promise<void>;
}

let almacen: Almacen | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  almacen = require('@react-native-async-storage/async-storage').default as Almacen;
} catch {
  almacen = null;
}

/** Solo para el arnés. En la app el default (AsyncStorage) ya está puesto. */
export function configurarAlmacen(a: Almacen): void {
  almacen = a;
}

const CLAVE = 'epp.cola_media.v1';

/** Causa tipada — espejo de la de los uploaders (S61-B10). */
export type CausaFalla = 'lectura' | 'red' | 'servidor' | 'registro' | 'motor_no_cableado';

export type EstadoItem =
  /** capturado, esperando su turno. */
  | 'en_cola'
  /** en vuelo AHORA (no persiste como tal: al releer vuelve a 'en_cola'). */
  | 'subiendo'
  /** los bytes YA están en storage; falta el registro. El reintento salta el paso 1. */
  | 'subida_sin_registrar'
  /** publicada: el dueño la ve. Único estado que autoriza a olvidar el ítem. */
  | 'publicada'
  /** agotó los reintentos automáticos. NO se descarta: espera mano. */
  | 'error';

export interface ItemMedia {
  /** id local — la llave de idempotencia de la cola. */
  id: string;
  uri: string;
  tipo: 'foto' | 'clip';
  /** Las etiquetas. Mínimo 1 (firma ① del founder: la foto llega a CADA animal). */
  mascotaIds: string[];
  /**
   * El día de la estadía, local del lugar (`YYYY-MM-DD`).
   *
   * 🔴 Es **fecha y no `estadia_id`**, y el cambio se hizo al llegar el
   * contrato de A: `publicarMedia` ancla por `(mascota, fecha)` y **el
   * `estadia_id` de cada etiqueta lo resuelve el SERVIDOR**. Mandar un id
   * desde el teléfono sería más ancho —y un id viajando por un campo que se
   * lee como fecha es la clase de defecto que compila perfecto.
   */
  fecha: string;
  /** Solo clips. */
  duracionS?: number;
  /**
   * 🔴 EL PESO REAL DEL BYTE SUBIDO — no una estimación.
   * Nace del `ArrayBuffer` que el subidor YA lee para subir: medirlo aparte
   * sería un segundo número que puede diferir del que viajó. Existe porque el
   * peso que circulaba en la casa («un clip de 30 s pesa ~9 MB») es **prosa
   * heredada**: no hay bitrate configurado en ningún punto de captura, así que
   * lo elige el encoder de cada teléfono. *Un promedio que sale del uso real
   * no se puede heredar equivocado.*
   */
  bytes?: number;
  creadoEn: number;
  estado: EstadoItem;
  /** Subida hecha, registro pendiente. */
  storagePath?: string;
  intentos: number;
  /** epoch ms; el backoff no se recalcula al reabrir — se respeta. */
  proximoIntentoEn?: number;
  causa?: CausaFalla;
  /** El literal del error, para el log y el diagnóstico. Jamás para la pantalla. */
  detalle?: string;
}

/**
 * Backoff: 5s · 15s · 45s · 2m15 · 6m45 · 20m. Después para de reintentar
 * SOLO y queda en 'error' — visible, con reintento a mano.
 *
 * Por qué no reintenta para siempre: una cola que reintenta cada 5 s contra un
 * servidor que rebota gasta batería y datos del prestador sin acercarse a
 * nada. Por qué no descarta: ver la cabecera.
 */
const BASE_MS = 5_000;
const FACTOR = 3;
export const INTENTOS_AUTOMATICOS = 6;

/**
 * Techo del clip, en la PUERTA de la cola y no en un consumidor.
 *
 * El servidor admite **30.9 s** (tolerancia de contenedor declarada en el
 * CHECK del contrato de A §①). Ese margen existe **para que un archivo honesto
 * no rebote, no para grabar de más** — así que la puerta corta ahí: un clip
 * más largo **no entra**, venga de donde venga. *Un techo que vive en la
 * pantalla lo respeta la pantalla que lo conoce; en la puerta lo respetan
 * todas.*
 */
export const CLIP_TECHO_S = 30;
export const CLIP_TOLERANCIA_S = 0.9;

function esperaDe(intentos: number): number {
  return BASE_MS * FACTOR ** Math.min(intentos, INTENTOS_AUTOMATICOS - 1);
}

function esErrorDeRed(mensaje: string): boolean {
  return /network|failed to fetch|fetch failed|timeout/i.test(mensaje);
}

// ══════════════════ PERSISTENCIA ═══════════════════════════════════════════
// Una sola escritura por mutación, y serializada: dos capturas seguidas no
// pueden pisarse (leer-mutar-escribir sin cerrojo pierde la primera).

let cerrojo: Promise<unknown> = Promise.resolve();

function enFila<T>(tarea: () => Promise<T>): Promise<T> {
  const proximo = cerrojo.then(tarea, tarea);
  cerrojo = proximo.catch(() => undefined);
  return proximo;
}

async function leerCrudo(): Promise<ItemMedia[]> {
  try {
    if (!almacen) return [];
    const txt = await almacen.getItem(CLAVE);
    if (!txt) return [];
    const dato: unknown = JSON.parse(txt);
    if (!Array.isArray(dato)) return [];
    // Validación por forma: un ítem malformado se descarta, la cola sobrevive.
    // (El mismo criterio que el track del envío: *una trayectoria a la que le
    // falta un punto sigue siendo la trayectoria*.)
    return dato.filter(
      (i): i is ItemMedia =>
        !!i &&
        typeof i === 'object' &&
        typeof (i as ItemMedia).id === 'string' &&
        typeof (i as ItemMedia).uri === 'string' &&
        Array.isArray((i as ItemMedia).mascotaIds),
    );
  } catch (e) {
    console.error(`[cola-media] LECTURA de la cola falló · ${String(e)}`);
    return [];
  }
}

async function escribir(items: ItemMedia[]): Promise<void> {
  try {
    if (!almacen) throw new Error('cola-media: sin almacén — la media no quedó guardada');
    await almacen.setItem(CLAVE, JSON.stringify(items));
  } catch (e) {
    // Falla de disco: NO se traga. La captura debe poder decir que no quedó
    // guardada — es el único momento en que el cuidador puede repetirla.
    console.error(`[cola-media] ESCRITURA de la cola falló · ${String(e)}`);
    throw e;
  }
}

/** La cola entera, del disco. 'subiendo' se normaliza a 'en_cola': si la app
 *  murió a mitad de una subida, el vuelo no existe más. */
export async function leerCola(): Promise<ItemMedia[]> {
  const items = await leerCrudo();
  return items.map((i) => (i.estado === 'subiendo' ? { ...i, estado: 'en_cola' as const } : i));
}

/** Lo pendiente de una estadía, en orden de captura. */
export async function pendientesDe(fecha: string): Promise<ItemMedia[]> {
  const items = await leerCola();
  return items
    .filter((i) => i.fecha === fecha && i.estado !== 'publicada')
    .sort((a, b) => a.creadoEn - b.creadoEn);
}

async function mutar(id: string, cambios: Partial<ItemMedia>): Promise<void> {
  return enFila(async () => {
    const items = await leerCrudo();
    await escribir(items.map((i) => (i.id === id ? { ...i, ...cambios } : i)));
  });
}

// ══════════════════ ENCOLAR ════════════════════════════════════════════════

export interface AltaMedia {
  uri: string;
  tipo: 'foto' | 'clip';
  /** 🔴 mínimo 1: publicar sin etiquetas dejaría media sin dueño. */
  mascotaIds: string[];
  fecha: string;
  duracionS?: number;
}

/**
 * Encola una captura ya revisada. Devuelve el ítem persistido.
 * Lanza si `mascotaIds` viene vacío — la pantalla no debería ofrecer publicar
 * sin selección (pieza 4 de B: *arranca SIN selección, mínimo 1 para
 * publicar*), y si igual llega, acá se corta.
 */
export async function encolar(alta: AltaMedia): Promise<ItemMedia> {
  if (alta.mascotaIds.length === 0) {
    throw new Error('cola-media: mascotaIds vacío — una media sin etiqueta no tiene a quién llegar');
  }
  if (alta.tipo === 'clip' && (alta.duracionS ?? 0) > CLIP_TECHO_S + CLIP_TOLERANCIA_S) {
    throw new Error(
      `cola-media: clip de ${alta.duracionS}s supera el techo de ${CLIP_TECHO_S}s — el servidor lo rebotaría`,
    );
  }
  const item: ItemMedia = {
    id: `${alta.tipo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    uri: alta.uri,
    tipo: alta.tipo,
    mascotaIds: [...alta.mascotaIds],
    fecha: alta.fecha,
    duracionS: alta.duracionS,
    creadoEn: Date.now(),
    estado: 'en_cola',
    intentos: 0,
  };
  await enFila(async () => {
    const items = await leerCrudo();
    await escribir([...items, item]);
  });
  return item;
}

/**
 * Corrige las etiquetas de un ítem que TODAVÍA no se publicó.
 * (La corrección del ya publicado es del servidor — pedido D→A ①: firma del
 * founder, «el cuidador puede corregir etiquetas durante el mismo día».)
 */
export async function reetiquetar(id: string, mascotaIds: string[]): Promise<void> {
  if (mascotaIds.length === 0) {
    throw new Error('cola-media: reetiquetar a cero deja la media sin dueño — se descarta, no se vacía');
  }
  await mutar(id, { mascotaIds: [...mascotaIds] });
}

/** Descarta un ítem. Acto EXPLÍCITO del cuidador — la cola jamás lo hace sola. */
export async function descartar(id: string): Promise<void> {
  return enFila(async () => {
    const items = await leerCrudo();
    await escribir(items.filter((i) => i.id !== id));
  });
}

/** Reintento a mano de un ítem en 'error': vuelve a la cola, ya. */
export async function reintentar(id: string): Promise<void> {
  await mutar(id, { estado: 'en_cola', intentos: 0, proximoIntentoEn: undefined, causa: undefined });
}

/** Higiene: saca las publicadas. Nunca toca lo pendiente. */
export async function limpiarPublicadas(): Promise<void> {
  return enFila(async () => {
    const items = await leerCrudo();
    await escribir(items.filter((i) => i.estado !== 'publicada'));
  });
}

// ══════════════════ EL PROCESADOR ══════════════════════════════════════════

/**
 * Las dos dependencias, INYECTADAS (molde S91). Mientras el motor de A no
 * exista, la cola guarda y no procesa — y lo dice con `motor_no_cableado`.
 */
export interface MotorDeSubida {
  /** Paso 1 — sube bytes y devuelve el path. Reusa `leerBytes` + el bucket. */
  subir(
    item: ItemMedia,
  ): Promise<
    | { ok: true; storagePath: string; bytes: number }
    | { ok: false; causa: CausaFalla; mensaje: string }
  >;
  /** Paso 2 — registra la media con SUS N etiquetas (pedido D→A ①). */
  registrar(
    item: ItemMedia,
    storagePath: string,
  ): Promise<{ ok: true } | { ok: false; causa: CausaFalla; mensaje: string }>;
}

export interface ResumenCorrida {
  intentados: number;
  publicados: number;
  /** Quedaron para más tarde (backoff vigente o falla recuperable). */
  pendientes: number;
  /** Agotaron los reintentos automáticos en esta corrida. */
  enError: number;
}

/**
 * Procesa lo vencido de la cola, de a uno y en orden de captura.
 *
 * Secuencial a propósito: el paralelo sobre una red mala multiplica timeouts y
 * el orden de captura es el orden en que la familia espera ver las fotos.
 */
export async function procesarCola(
  motor: MotorDeSubida | null,
  opciones?: { fecha?: string; ahora?: number },
): Promise<ResumenCorrida> {
  const ahora = opciones?.ahora ?? Date.now();
  const resumen: ResumenCorrida = { intentados: 0, publicados: 0, pendientes: 0, enError: 0 };

  const todos = await leerCola();
  const listos = todos
    .filter((i) => i.estado === 'en_cola' || i.estado === 'subida_sin_registrar')
    .filter((i) => (opciones?.fecha ? i.fecha === opciones.fecha : true))
    .filter((i) => (i.proximoIntentoEn ?? 0) <= ahora)
    .sort((a, b) => a.creadoEn - b.creadoEn);

  if (listos.length === 0) return resumen;

  if (!motor) {
    // INERTE, y visible: la pantalla puede decir «se enviará cuando haya
    // conexión» sin mentir, porque el ítem sigue guardado.
    for (const i of listos) await mutar(i.id, { causa: 'motor_no_cableado' });
    resumen.pendientes = listos.length;
    return resumen;
  }

  for (const item of listos) {
    resumen.intentados += 1;
    await mutar(item.id, { estado: 'subiendo' });

    let path = item.storagePath;

    // Paso 1 — solo si no está hecho.
    if (!path) {
      const r = await motor.subir(item);
      if (!r.ok) {
        await fallo(item, r.causa, r.mensaje, ahora, resumen);
        continue;
      }
      path = r.storagePath;
      // Se persiste ANTES de registrar: si la app muere entre los dos pasos,
      // el reintento salta el paso 1 en vez de subir el byte otra vez.
      await mutar(item.id, { estado: 'subida_sin_registrar', storagePath: path, bytes: r.bytes });
      console.log(`[cola-media] ${item.tipo} subido · ${(r.bytes / 1_048_576).toFixed(2)} MB${item.duracionS ? ` · ${item.duracionS}s` : ''}`);
    }

    // Paso 2.
    const reg = await motor.registrar(item, path);
    if (!reg.ok) {
      await fallo({ ...item, storagePath: path }, reg.causa, reg.mensaje, ahora, resumen);
      continue;
    }

    await mutar(item.id, { estado: 'publicada', causa: undefined, detalle: undefined });
    resumen.publicados += 1;
  }

  return resumen;
}

async function fallo(
  item: ItemMedia,
  causa: CausaFalla,
  mensaje: string,
  ahora: number,
  resumen: ResumenCorrida,
): Promise<void> {
  const intentos = item.intentos + 1;
  const agotado = intentos >= INTENTOS_AUTOMATICOS;
  const causaFinal: CausaFalla = causa === 'servidor' && esErrorDeRed(mensaje) ? 'red' : causa;

  console.error(
    `[cola-media] ${item.tipo} ${item.id} · intento ${intentos}/${INTENTOS_AUTOMATICOS} · ${causaFinal} · ${mensaje}`,
  );

  await mutar(item.id, {
    // 'subida_sin_registrar' se conserva: dice que el byte YA está arriba.
    estado: agotado ? 'error' : item.storagePath ? 'subida_sin_registrar' : 'en_cola',
    intentos,
    proximoIntentoEn: agotado ? undefined : ahora + esperaDe(intentos),
    causa: causaFinal,
    detalle: mensaje,
    storagePath: item.storagePath,
  });

  if (agotado) resumen.enError += 1;
  else resumen.pendientes += 1;
}


// ══════════════════ EL PESO, PARA DECLARARLO CON NÚMERO ════════════════════

export interface PesoMedido {
  n: number;
  promedioMB: number;
  maxMB: number;
}

/**
 * Lo que el brief pide declarar al cierre — **derivado del uso real**, no de
 * un ensayo aparte ni de la prosa del repo.
 *
 * Devuelve `null` cuando todavía no se subió nada de ese tipo: **el promedio
 * de cero capturas no es cero, es ausencia de dato** — y decir «0 MB» sería
 * exactamente la clase de número verosímil y falso que L-139 nombra.
 */
export async function pesoMedido(tipo: 'foto' | 'clip'): Promise<PesoMedido | null> {
  const items = (await leerCola()).filter((i) => i.tipo === tipo && typeof i.bytes === 'number');
  if (items.length === 0) return null;
  const mb = items.map((i) => (i.bytes as number) / 1_048_576);
  return {
    n: mb.length,
    promedioMB: Number((mb.reduce((a, b) => a + b, 0) / mb.length).toFixed(2)),
    maxMB: Number(Math.max(...mb).toFixed(2)),
  };
}
