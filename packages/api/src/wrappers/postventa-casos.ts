// ═══════════════════════════════════════════════════════════════════════════
// S114-A · A3 · EL MOTOR DEL CASO — la puerta única.
//
// Contrato: `LETRA_POSTVENTA` §§1-6 + `S114-C-PEDIDO-A-A-EL-MOTOR-DEL-CASO.md`.
// Cada firma de acá responde a un renglón de ese pedido.
//
// 🔴 LAS TABLAS NO SE ESCRIBEN DIRECTO. `casos_postventa` y `caso_mensajes`
// tienen INSERT/UPDATE/DELETE revocados a `authenticated` (F5): escriben SOLO
// estas RPCs `SECURITY DEFINER`. La puerta única dejó de ser prosa y pasó a
// ser permiso — el admin tampoco puede escapar aunque quiera.
// ═══════════════════════════════════════════════════════════════════════════

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';
import type { ObjetoPostventa } from './postventa-motivos';

const ERR = 'No pudimos completar la acción. Prueba de nuevo.';

// 🔴 FUENTE ÚNICA de las etapas del caso — son los CÓDIGOS del motor
// (`cat_estados_caso`), y la DB manda (regla de la casa). `packages/ui` NO
// define su propio EtapaCaso: importa éste, y sus etiquetas humanas
// («e-PetPlace», «entre ustedes») viven en sus VOCES de display, no en el tipo.
// Unificado en S114-A (tanda de tipos ratificada) — antes B tenía un tipo
// paralelo con `con_epetplace`/`resuelto_entre_ustedes`, que son voces, no
// valores. Dos tipos del mismo nombre y distinto contenido es lo que el
// compilador cazó y esta unificación cierra.
export type EtapaCaso =
  | 'recibido' | 'con_prestador' | 'con_casa' | 'resuelto' | 'cerrado'
  | 'resuelto_entre_partes' | 'retirado' | 'sin_lugar';

/** Las cinco etapas que dibuja la escalera (§3.1). Los otros tres son finales
 *  alternos: reemplazan la línea, no son un paso. Se deriva del motor
 *  (`cat_estados_caso.en_escalera`) — se expone acá para que la UI no lo
 *  reinvente. */
export const ETAPAS_EN_ESCALERA = [
  'recibido', 'con_prestador', 'con_casa', 'resuelto', 'cerrado',
] as const satisfies readonly EtapaCaso[];

export type FinalAlterno = 'resuelto_entre_partes' | 'retirado' | 'sin_lugar';

export type AsientoCaso = 'familia' | 'prestador' | 'casa';

export interface MensajeCaso {
  id: string;
  /** §3.3 · tres asientos. Los de `familia` van a la derecha. */
  autor: AsientoCaso;
  /** `hecho` son las etiquetas centradas del trámite. Se distingue EN LA FILA
   *  y no por el texto: un hecho que hay que reconocer por su redacción se
   *  rompe al traducirlo. */
  tipo: 'mensaje' | 'hecho';
  cuerpo: string;
  creadoEn: string;
}

/** Un objeto puede tener UN caso abierto. `null` = no hay. */
export async function obtenerCasoDeObjeto(
  objeto: ObjetoPostventa,
  objetoId: string,
): Promise<ResultadoWrapper<{ casoId: string; etapa: EtapaCaso; vozEstado: string } | null, 'error_lectura'>> {
  const { data, error } = await getClient().rpc('obtener_caso_de_objeto', {
    p_tipo: objeto, p_id: objetoId,
  });
  if (error) return { ok: false, codigo: 'error_lectura', mensaje: ERR };
  if (!data) return { ok: true, data: null };
  const d = data as Record<string, unknown>;
  return { ok: true, data: {
    casoId: d.caso_id as string,
    etapa: d.etapa as EtapaCaso,
    vozEstado: d.voz_estado as string,
  } };
}

/**
 * §5 · F7 — los días de ventana para abrir un caso.
 *
 * 🔴 C pidió computar la ventana en la app y **tiene razón en el riesgo**: si
 * el corte vive en dos lados, un día divergen. La conclusión es la contraria:
 * **el motor TIENE que exigirla** —un guard que vive sólo en la pantalla no es
 * un guard, y éste decide si una familia puede reclamar plata—. La divergencia
 * se cierra publicando el número en vez de escribirlo dos veces: **la app lo
 * LEE de acá y no lo hardcodea.**
 */
export async function obtenerVentanaCasoDias(): Promise<ResultadoWrapper<number, 'error_lectura'>> {
  const { data, error } = await getClient().rpc('caso_ventana_dias');
  if (error) return { ok: false, codigo: 'error_lectura', mensaje: ERR };
  return { ok: true, data: Number(data) };
}

export type CodigoAbrirCaso =
  | 'fuera_de_ventana' | 'motivo_no_pertenece' | 'caso_ya_abierto'
  | 'objeto_no_es_tuyo' | 'objeto_no_existe' | 'mascota_en_memorial' | 'sin_sesion';

/**
 * El acto que crea el caso (§2 de la dirección).
 *
 * 🔴 `clase` NO se manda y no se puede mandar: viene de la fila del motivo
 * (§4). Y `caso_ya_abierto` devuelve el `casoId` del que ya existe — `L-424`:
 * un guard que sólo sabe negarse manda a «probá de nuevo» sobre algo que va a
 * fallar siempre; con el id, la pantalla lleva al caso.
 */
export async function abrirCaso(p: {
  objeto: ObjetoPostventa;
  objetoId: string;
  motivo: string;
  relato?: string;
  procedencia?: 'familia' | 'ia_intake';
  modo?: 'texto' | 'voz';
  confirmadoPor?: string;
  resumenConfirmado?: string;
  fotoUrl?: string | null;
}): Promise<ResultadoWrapper<
  { casoId: string; etapa: EtapaCaso; claseResuelta: 1 | 2 | 3; urgente: boolean },
  CodigoAbrirCaso
> & { casoExistente?: string }> {
  const { data, error } = await getClient().rpc('abrir_caso', {
    p_objeto_tipo: p.objeto, p_objeto_id: p.objetoId, p_motivo: p.motivo,
    // Los parámetros con DEFAULT en SQL se omiten con `undefined`, no con
    // `null`: un `null` explícito PISA el default del motor.
    p_relato: p.relato ?? undefined, p_procedencia: p.procedencia ?? 'familia',
    p_modo: p.modo ?? undefined, p_confirmado_por: p.confirmadoPor ?? undefined,
    p_resumen_confirmado: p.resumenConfirmado ?? undefined,
    p_foto_url: p.fotoUrl ?? undefined,
  });
  if (error) return { ok: false, codigo: 'sin_sesion', mensaje: ERR };
  const d = (data ?? {}) as Record<string, unknown>;
  if (d.ok !== true) {
    return {
      ok: false,
      codigo: (d.codigo as CodigoAbrirCaso) ?? 'sin_sesion',
      mensaje: ERR,
      // 🔴 el id del que ya existe viaja, para que la pantalla pueda LLEVAR ahí
      ...(d.caso_id ? { casoExistente: d.caso_id as string } : {}),
    };
  }
  return { ok: true, data: {
    casoId: d.caso_id as string,
    etapa: d.etapa as EtapaCaso,
    claseResuelta: d.clase_resuelta as 1 | 2 | 3,
    urgente: d.urgente === true,
  } };
}

/** La forma tipada del caso que devuelve el motor (§3 de la dirección). El
 *  retorno dejó de ser `Record<string, unknown>` para que el compilador vea
 *  un campo que el motor renombre — antes un rename dibujaba un hueco en
 *  silencio (observación ④ de C). */
export interface CasoDetalle {
  casoId: string;
  etapa: EtapaCaso;
  clase: 1 | 2 | 3;
  motivo: string;
  enEscalera: boolean;
  /** El paso que la escalera dibuja: la etapa actual, o —si el caso cayó a un
   *  final alterno— el paso previo congelado (C1bis · C②). */
  etapaEnEscalera: EtapaCaso | null;
  final: FinalAlterno | null;
  cerrado: boolean;
  plazoHasta: string | null;
  objeto: { tipo: ObjetoPostventa; id: string; titulo: string | null; fecha: string | null;
            total: number | null; disponibleDevolver: number | null };
  resolucion: {
    alcance: 'total' | 'parcial' | 'sin_devolucion' | null;
    monto: number | null;
    camino: 'aplicar_reembolso' | 'declarado_sobre_pago' | null;
    destino: 'banco' | 'saldo' | null;
    destinoEstado: 'aplicado' | 'en_camino_manual' | null;
  };
  accionPendiente: 'elegir_devolucion' | null;
}

export async function leerCaso(casoId: string): Promise<ResultadoWrapper<CasoDetalle, 'no_existe' | 'no_es_tuyo'>> {
  const { data, error } = await getClient().rpc('leer_caso', { p_caso_id: casoId });
  if (error) return { ok: false, codigo: 'no_existe', mensaje: ERR };
  const d = (data ?? {}) as Record<string, unknown>;
  if (d.ok !== true) return { ok: false, codigo: (d.codigo as 'no_existe' | 'no_es_tuyo') ?? 'no_existe', mensaje: ERR };
  const o = (d.objeto ?? {}) as Record<string, unknown>;
  const r = (d.resolucion ?? {}) as Record<string, unknown>;
  return { ok: true, data: {
    casoId: d.caso_id as string,
    etapa: d.etapa as EtapaCaso,
    clase: d.clase as 1 | 2 | 3,
    motivo: d.motivo as string,
    enEscalera: d.en_escalera === true,
    etapaEnEscalera: (d.etapa_en_escalera as EtapaCaso | null) ?? null,
    final: (d.final as FinalAlterno | null) ?? null,
    cerrado: d.cerrado === true,
    plazoHasta: (d.plazo_hasta as string | null) ?? null,
    objeto: {
      tipo: o.tipo as ObjetoPostventa, id: o.id as string,
      titulo: (o.titulo as string | null) ?? null, fecha: (o.fecha as string | null) ?? null,
      total: o.total != null ? Number(o.total) : null,
      disponibleDevolver: o.disponible_devolver != null ? Number(o.disponible_devolver) : null,
    },
    resolucion: {
      alcance: (r.alcance as CasoDetalle['resolucion']['alcance']) ?? null,
      monto: (r.monto as number | null) ?? null,
      camino: (r.camino as CasoDetalle['resolucion']['camino']) ?? null,
      destino: (r.destino as 'banco' | 'saldo' | null) ?? null,
      destinoEstado: (r.destino_estado as 'aplicado' | 'en_camino_manual' | null) ?? null,
    },
    accionPendiente: (d.accion_pendiente as 'elegir_devolucion' | null) ?? null,
  } };
}

/**
 * El hilo, paginado con **cursor compuesto**, jamás con offset.
 *
 * Con offset, la página siguiente se saltea filas cuando llega un mensaje
 * nuevo — es el defecto exacto que S99 midió en la línea de vida (55 de 62 —
 * se perdían 7, y el que falta no se ve).
 */
export async function leerMensajesDeCaso(
  casoId: string, cursor?: string | null, limite = 50,
): Promise<ResultadoWrapper<{ mensajes: MensajeCaso[]; cursor: string | null }, 'error_lectura'>> {
  const [ts, id] = cursor ? cursor.split('|') : [null, null];
  const { data, error } = await getClient().rpc('leer_mensajes_caso', {
    p_caso_id: casoId, p_cursor_ts: ts ?? undefined, p_cursor_id: id ?? undefined, p_limite: limite,
  });
  if (error) return { ok: false, codigo: 'error_lectura', mensaje: ERR };
  const d = (data ?? {}) as Record<string, unknown>;
  const filas = (d.mensajes ?? []) as Record<string, unknown>[];
  return { ok: true, data: {
    mensajes: filas.map((m) => ({
      id: m.id as string, autor: m.autor as AsientoCaso,
      tipo: m.tipo as 'mensaje' | 'hecho', cuerpo: m.cuerpo as string,
      creadoEn: m.creado_en as string,
    })),
    cursor: (d.cursor as string | null) ?? null,
  } };
}

export async function enviarMensajeDeCaso(
  casoId: string, texto: string,
): Promise<ResultadoWrapper<{ mensajeId: string; autor: AsientoCaso }, 'caso_cerrado' | 'no_es_tuyo' | 'texto_vacio'>> {
  const { data, error } = await getClient().rpc('caso_responder', { p_caso_id: casoId, p_texto: texto });
  if (error) return { ok: false, codigo: 'no_es_tuyo', mensaje: ERR };
  const d = (data ?? {}) as Record<string, unknown>;
  if (d.ok !== true) return { ok: false, codigo: (d.codigo as 'caso_cerrado') ?? 'no_es_tuyo', mensaje: ERR };
  return { ok: true, data: { mensajeId: d.mensaje_id as string, autor: d.autor as AsientoCaso } };
}

export async function leerOpcionesDeDevolucion(
  casoId: string,
): Promise<ResultadoWrapper<{
  monto: number; parcial: boolean;
  banco: { disponible: boolean; manual: boolean };
  saldo: { disponible: boolean; nota?: string };
}, 'no_es_tuyo'>> {
  const { data, error } = await getClient().rpc('leer_opciones_devolucion', { p_caso_id: casoId });
  if (error) return { ok: false, codigo: 'no_es_tuyo', mensaje: ERR };
  const d = (data ?? {}) as Record<string, unknown>;
  if (d.ok !== true) return { ok: false, codigo: 'no_es_tuyo', mensaje: ERR };
  return { ok: true, data: {
    monto: Number(d.monto ?? 0),
    parcial: d.parcial === true,
    // 🔴 `manual` viene del SERVIDOR: depende de la ventana del riel y la
    // pantalla no puede saberlo. Si C lo dedujera de la fecha, prometería una
    // fecha que el motor no cumple — lo único que §4 prohíbe con todas las letras.
    banco: (d.banco ?? { disponible: true, manual: true }) as { disponible: boolean; manual: boolean },
    saldo: (d.saldo ?? { disponible: false }) as { disponible: boolean; nota?: string },
  } };
}

export async function elegirDestinoDevolucion(
  casoId: string, destino: 'banco' | 'saldo',
): Promise<ResultadoWrapper<{ estado: 'aplicado' | 'en_camino_manual' }, 'ya_elegido' | 'caso_sin_resolver' | 'saldo_todavia_no_existe' | 'no_es_tuyo'>> {
  const { data, error } = await getClient().rpc('caso_elegir_destino', { p_caso_id: casoId, p_destino: destino });
  if (error) return { ok: false, codigo: 'no_es_tuyo', mensaje: ERR };
  const d = (data ?? {}) as Record<string, unknown>;
  if (d.ok !== true) return { ok: false, codigo: (d.codigo as 'ya_elegido') ?? 'no_es_tuyo', mensaje: ERR };
  return { ok: true, data: { estado: d.estado as 'aplicado' | 'en_camino_manual' } };
}

// ── EL ASIENTO DEL PRESTADOR (C7) ──────────────────────────────────────────
export interface CasoEnBandeja {
  casoId: string; objetoTipo: ObjetoPostventa; objetoId: string;
  motivo: string; clase: 1 | 2 | 3; etapa: EtapaCaso;
  plazoHasta: string | null; creadoEn: string;
  // §5 · de qué servicio hablan — la app pone la voz del servicio y el formato
  // de fecha ("Paseo de Thor · martes 9"). El motor entrega los datos, no la voz.
  servicio: string | null; mascotaNombre: string | null;
  objetoFecha: string | null; pedidoNumero: string | null;
}

function mapearBandeja(c: Record<string, unknown>): CasoEnBandeja {
  return {
    casoId: c.caso_id as string, objetoTipo: c.objeto_tipo as ObjetoPostventa,
    objetoId: c.objeto_id as string, motivo: c.motivo as string,
    clase: c.clase as 1 | 2 | 3, etapa: c.etapa as EtapaCaso,
    plazoHasta: (c.plazo_hasta as string | null) ?? null, creadoEn: c.creado_en as string,
    servicio: (c.servicio as string | null) ?? null,
    mascotaNombre: (c.mascota_nombre as string | null) ?? null,
    objetoFecha: (c.objeto_fecha as string | null) ?? null,
    pedidoNumero: (c.pedido_numero as string | null) ?? null,
  };
}

export async function obtenerCasosDelPrestador(): Promise<ResultadoWrapper<CasoEnBandeja[], 'error_lectura'>> {
  const { data, error } = await getClient().rpc('obtener_casos_del_prestador');
  if (error) return { ok: false, codigo: 'error_lectura', mensaje: ERR };
  const filas = (data ?? []) as Record<string, unknown>[];
  return { ok: true, data: filas.map(mapearBandeja) };
}

/**
 * Los casos de la familia (C6 · «Mis casos» en Cuenta > Ayuda).
 *
 * Misma forma que `obtenerCasosDelPrestador` con el asiento cambiado: la
 * familia ve los SUYOS, **abiertos primero** (el orden lo hace el motor, no la
 * pantalla). Era omisión del primer pedido de C, no del motor.
 */
export async function obtenerMisCasos(): Promise<ResultadoWrapper<CasoEnBandeja[], 'error_lectura'>> {
  const { data, error } = await getClient().rpc('obtener_mis_casos');
  if (error) return { ok: false, codigo: 'error_lectura', mensaje: ERR };
  const filas = (data ?? []) as Record<string, unknown>[];
  return { ok: true, data: filas.map(mapearBandeja) };
}

/**
 * C8 · «Lo que te espera» del prestador (Negocios · Hoy): los servicios pasados
 * su hora de fin que todavía no cerró. Espejo del reloj de F1.
 *   · vencido=false → aún cerrable: si lo cierra, cobra.
 *   · vencido=true  → pasó 48 h: perdió el cobro (el reloj lo hará no_ejecutado).
 * Los «vencidos» de C4/C8 son `items.filter(i => i.vencido)`.
 */
export interface ServicioSinCerrar {
  objetoId: string; objetoTipo: ObjetoPostventa; servicio: string;
  mascotaNombre: string | null; fecha: string; vencido: boolean;
}

export async function obtenerServiciosSinCerrar(): Promise<
  // `cantidad`/`items` son SÓLO lo accionable (fin >= el corte de F1, lo que el
  // reloj puede tocar). `fueraDeCorte` es el backlog viejo, aparte, para
  // diagnóstico — NUNCA se mezcla en el número que ve el prestador (S114-A ⑥).
  ResultadoWrapper<{ cantidad: number; items: ServicioSinCerrar[]; fueraDeCorte: number }, 'error_lectura'>
> {
  const { data, error } = await getClient().rpc('obtener_servicios_sin_cerrar');
  if (error) return { ok: false, codigo: 'error_lectura', mensaje: ERR };
  const d = (data ?? {}) as { cantidad?: number; items?: Record<string, unknown>[]; fuera_de_corte?: number };
  return { ok: true, data: {
    cantidad: d.cantidad ?? 0,
    fueraDeCorte: d.fuera_de_corte ?? 0,
    items: (d.items ?? []).map((i) => ({
      objetoId: i.objeto_id as string, objetoTipo: i.objeto_tipo as ObjetoPostventa,
      servicio: i.servicio as string, mascotaNombre: (i.mascota_nombre as string | null) ?? null,
      fecha: i.fecha as string, vencido: i.vencido === true,
    })),
  } };
}

export async function responderCaso(casoId: string, texto: string) {
  return enviarMensajeDeCaso(casoId, texto);
}

/**
 * El prestador reconoce y resuelve (§5 de la dirección).
 *
 * 🔴 El camino de la plata lo decide el SERVIDOR midiendo: le pregunta al
 * objeto si tiene evento económico. Con devengo va por `aplicar_reembolso()`;
 * sin devengo se declara sobre el pago. **Jamás por clase** — elegir por clase
 * escribiría un reembolso declarado sobre un servicio que sí devengó, y la
 * casa pagaría la diferencia sin que nadie lo vea.
 */
export async function reconocerYResolver(
  casoId: string, p: { alcance: 'total' | 'parcial' | 'sin_devolucion'; monto?: number; motivo?: string },
): Promise<ResultadoWrapper<{ camino: string | null; teniaDevengo: boolean; etapa: EtapaCaso }, 'no_podes_resolver' | 'alcance_invalido' | 'monto_requerido_en_parcial' | 'monto_supera_total' | 'razon_requerida_en_parcial'>> {
  const { data, error } = await getClient().rpc('caso_reconocer_y_resolver', {
    p_caso_id: casoId, p_alcance: p.alcance,
    p_monto: p.monto ?? undefined,
    p_motivo: p.motivo ?? undefined,
  });
  if (error) return { ok: false, codigo: 'no_podes_resolver', mensaje: ERR };
  const d = (data ?? {}) as Record<string, unknown>;
  if (d.ok !== true) return { ok: false, codigo: (d.codigo as 'no_podes_resolver') ?? 'no_podes_resolver', mensaje: ERR };
  return { ok: true, data: {
    camino: (d.camino as string | null) ?? null,
    teniaDevengo: d.tenia_devengo === true,
    etapa: d.etapa as EtapaCaso,
  } };
}

export async function pedirACasa(casoId: string): Promise<ResultadoWrapper<{ etapa: EtapaCaso }, 'no_es_tuyo' | 'transicion_inexistente' | 'actor_no_puede'>> {
  const { data, error } = await getClient().rpc('caso_pedir_casa', { p_caso_id: casoId });
  if (error) return { ok: false, codigo: 'no_es_tuyo', mensaje: ERR };
  const d = (data ?? {}) as Record<string, unknown>;
  if (d.ok !== true) return { ok: false, codigo: (d.codigo as 'no_es_tuyo') ?? 'no_es_tuyo', mensaje: ERR };
  return { ok: true, data: { etapa: d.hasta as EtapaCaso } };
}
