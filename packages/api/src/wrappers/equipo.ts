// EQUIPO DEL NEGOCIO (S74-B, LETRA_EQUIPO — PORTAL_PRESTADOR §14): la
// ventana v1 compuesta sobre lo VIVO, cero motor nuevo.
//
// Decisión E5 de la vara (extender-vs-nuevo, DECLARADA): NO se ensancha
// `obtener_empleados_cuenta` — sirve a OTRO trabajo (el selector de
// "Fijar fecha") con OTRO gate (`_user_opera_cuenta_comercial`, cualquier
// operador); ensancharlo cambiaría su gate o forzaría a su consumidor a
// descartar campos. La verdad única es la TABLA + `empleado_tiene_rol`
// (§14.4), no el lector: este wrapper COMPONE el RPC vivo + las lecturas
// RLS de `empleado_roles` (las tres policies dueño-only por la puerta
// única, enmienda v3). El pedido D-455 que QUEDA para el lector server-side
// es contacto de miembros + lista de invitaciones (huecos declarados v1).
//
// E6 (vara A, declarada NO curada acá): `empleados_dueño_actualiza` gatea
// por `prestadores.user_id = auth.uid()` (modelo unipersonal LEGACY, la
// misma clase de columna que D-485) — un co-dueño por la hija no podría
// desvincular. v1 unipersonal alcanza; la absorbe la próxima pasada del
// motor de equipo.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

// S75-B: `administrador` NACE como valor aparte en el CHECK de
// `empleado_roles` (migración de A, decisión de mesa firmada) — `dueño`
// queda RESERVADO al titular, jamás asignable. El tipo del UI lo refleja
// para razonar el gate ['dueño','administrador'].
export type RolEquipo = 'dueño' | 'administrador' | 'profesional' | 'recepcion';

const ROLES_VIVOS: readonly RolEquipo[] = ['dueño', 'administrador', 'profesional', 'recepcion'];

function esRolEquipo(v: string): v is RolEquipo {
  return (ROLES_VIVOS as readonly string[]).includes(v);
}

export interface MiembroEquipo {
  empleadoId: string;
  nombre: string;
  activo: boolean;
  roles: RolEquipo[];
}

export interface EquipoNegocio {
  /** DERIVACIÓN DECLARADA (E3 de la vara — la fuente del bool es-dueño):
   *  la policy SELECT de `empleado_roles` es dueño-only por
   *  `empleado_tiene_rol(…, ['dueño'])` y TODO negocio tiene al menos la
   *  fila del backfill S73 (5/5 titulares) — quien lee ≥1 fila ES dueño;
   *  cero filas = no-dueño (si lo fueras, verías tu propia fila). */
  esDueno: boolean;
  miembros: MiembroEquipo[];
}

// S77-A: `estado_no_confirmado` NO es un error de lectura más — es el único
// caso en que la ESCRITURA YA OCURRIÓ y lo que falló es confirmarla. Sale
// aparte porque su voz es distinta: `error_lectura` dice "no pasó nada,
// probá de nuevo"; éste tiene que decir "se quitó, pero no pudimos confirmar
// cómo quedó". Meterlos en el mismo código hacía que la Hoja mintiera con
// los chips ya borrados (hallazgo de la vara de B).
export type CodigoErrorEquipo =
  | 'error_lectura'
  | 'error_escritura'
  | 'sin_sesion'
  | 'estado_no_confirmado';

type R<T> = Promise<ResultadoWrapper<T, CodigoErrorEquipo>>;

export async function obtenerEquipoNegocio(cuentaComercialId: string): R<EquipoNegocio> {
  const cliente = getClient();
  const empleados = await cliente.rpc('obtener_empleados_cuenta', {
    p_cuenta_comercial_id: cuentaComercialId,
  });
  if (empleados.error) {
    return { ok: false, codigo: 'error_lectura', mensaje: empleados.error.message };
  }
  const filas = empleados.data ?? [];
  const ids = filas.map((f) => f.empleado_id);
  // RLS decide: dueño ve las filas de su negocio; no-dueño ve cero.
  const roles = ids.length
    ? await cliente.from('empleado_roles').select('empleado_id, rol').in('empleado_id', ids)
    : { data: [] as Array<{ empleado_id: string; rol: string }>, error: null };
  if (roles.error) {
    return { ok: false, codigo: 'error_lectura', mensaje: roles.error.message };
  }
  const porEmpleado = new Map<string, RolEquipo[]>();
  for (const r of roles.data ?? []) {
    if (!esRolEquipo(r.rol)) continue; // rol desconocido: jamás se pinta crudo (Ley 3)
    const lista = porEmpleado.get(r.empleado_id) ?? [];
    lista.push(r.rol);
    porEmpleado.set(r.empleado_id, lista);
  }
  return {
    ok: true,
    data: {
      esDueno: (roles.data ?? []).length > 0,
      miembros: filas.map((f) => ({
        empleadoId: f.empleado_id,
        nombre: f.nombre,
        activo: f.activo,
        roles: porEmpleado.get(f.empleado_id) ?? [],
      })),
    },
  };
}

/** Asignar un rol = INSERT en la hija (auditable de nacimiento, §14.2).
 *  `asignado_por` es NOT NULL sin default: viaja el user de la sesión. */
export async function asignarRolEmpleado(
  empleadoId: string,
  rol: Exclude<RolEquipo, 'dueño'>,
): R<null> {
  const cliente = getClient();
  const { data: auth } = await cliente.auth.getUser();
  if (!auth.user) return { ok: false, codigo: 'sin_sesion', mensaje: 'No hay sesión activa.' };
  const { error } = await cliente
    .from('empleado_roles')
    .insert({ empleado_id: empleadoId, rol, asignado_por: auth.user.id });
  if (error) return { ok: false, codigo: 'error_escritura', mensaje: error.message };
  return { ok: true, data: null };
}

export async function quitarRolEmpleado(
  empleadoId: string,
  rol: Exclude<RolEquipo, 'dueño'>,
): R<null> {
  const { error } = await getClient()
    .from('empleado_roles')
    .delete()
    .eq('empleado_id', empleadoId)
    .eq('rol', rol);
  if (error) return { ok: false, codigo: 'error_escritura', mensaje: error.message };
  return { ok: true, data: null };
}

/** Desvincular = `activo=false` (el mecanismo probado de la desactivación
 *  S73). La procedencia preserva los actos (§14.1) — el acceso muere, lo
 *  hecho queda. Policy: `empleados_dueño_actualiza` (E6 arriba). */
export async function desvincularEmpleado(empleadoId: string): R<null> {
  const { error } = await getClient()
    .from('prestador_empleados')
    .update({ activo: false })
    .eq('id', empleadoId);
  if (error) return { ok: false, codigo: 'error_escritura', mensaje: error.message };
  return { ok: true, data: null };
}

/** Los rebotes SUAVES de `crear_empleado_directo` — el RPC devuelve
 *  `{ok:false, mensaje:'<literal>'}` SIN campo código (estilo portal
 *  legado). CURA D-508 (S74-B): antes este wrapper solo miraba el error
 *  de PostgREST y los 4 rebotes viajaban como ÉXITO — el founder vio
 *  "éxito" de un rebote en campo. DECLARADO (tensión regla 35): el
 *  motor no da código, así que el mapeo es por el LITERAL del mensaje —
 *  única discriminación posible sin tocar motor; la enmienda del RPC
 *  (campo `codigo` o RAISE tipado, patrón de la casa) es pedido a A y
 *  viaja con D-509. Literales verificados contra `prosrc` vivo (L-141). */
export type CodigoInvitar =
  | 'no_es_dueno'
  | 'email_sin_cuenta'
  | 'email_es_prestador'
  | 'ya_es_empleado'
  | 'rebote_desconocido'
  | 'error_escritura';

export const REBOTES_INVITAR: ReadonlyArray<{ literal: string; codigo: CodigoInvitar }> = [
  { literal: 'No sos dueño de este prestador', codigo: 'no_es_dueno' },
  { literal: 'El email no existe en la plataforma', codigo: 'email_sin_cuenta' },
  { literal: 'Este email pertenece a otro prestador', codigo: 'email_es_prestador' },
  { literal: 'Esta persona ya es empleado de este prestador', codigo: 'ya_es_empleado' },
];

/** Invitar SIN rol (camino v1 ratificado por E4: el CHECK de
 *  `empleado_invitaciones.rol` solo admite 'empleado'). El rol se asigna
 *  cuando la persona aparece en la lista (E1: preside con su acción).
 *  VERIFICADO S74-B (por comportamiento, no por nombre): el handshake
 *  "al próximo login" NO OCURRE por ningún camino — cero consumidores de
 *  aceptar/rechazar/marcar, cero triggers, cero edge. La fila queda
 *  activo=false para siempre. La invitación HOY solo REGISTRA; el
 *  handshake es pedido de motor BLOQUEANTE (sin él no sirve ni por mail
 *  ni por link). La voz de la pantalla dice ESA verdad angosta.
 *  *(Nota S75: el handshake B1 existe desde S75 — /invitacion; la voz
 *  angosta de arriba es histórico del nacimiento.)*
 *  S76-B4 (enmienda de contrato, único consumidor equipo.tsx): el éxito
 *  devuelve el `empleado_id` que el RPC ya traía y el wrapper tiraba —
 *  los CHIPS AL INVITAR lo necesitan (B0: el camino existe por RLS). */
export async function invitarEmpleado(
  prestadorId: string,
  email: string,
  nombre: string,
): Promise<ResultadoWrapper<{ empleadoId: string }, CodigoInvitar>> {
  const { data, error } = await getClient().rpc('crear_empleado_directo', {
    p_prestador_id: prestadorId,
    p_email: email,
    p_nombre: nombre,
  });
  if (error) return { ok: false, codigo: 'error_escritura', mensaje: error.message };
  // El jsonb SE LEE (cura D-508): ok:false = rebote suave tipificado.
  const fila = (typeof data === 'object' && data !== null ? data : {}) as {
    ok?: boolean;
    mensaje?: string;
    empleado_id?: string;
  };
  if (fila.ok !== true || typeof fila.empleado_id !== 'string') {
    const mensaje = typeof fila.mensaje === 'string' ? fila.mensaje : '';
    const rebote = REBOTES_INVITAR.find((r) => mensaje.startsWith(r.literal));
    return {
      ok: false,
      codigo: rebote?.codigo ?? 'rebote_desconocido',
      // el mensaje del motor queda de fallback (jamás mudo — Ley 13);
      // la voz humana la pone la pantalla por código (Ley 3).
      mensaje: mensaje.length > 0 ? mensaje : 'La invitación no se pudo crear.',
    };
  }
  return { ok: true, data: { empleadoId: fila.empleado_id } };
}

// ── S76-B4 · LOS CHIPS AL INVITAR (B0 dio APTO + decisión founder) ──────
// El selector de dos toggles (LETRA_RECEPCION §1) escribe SOLO chips de
// servicio (decisión founder S76: la fila `recepcion` del piso la concede
// el RPC de aceptación — migración A2bis, tanda de A; `profesional` es
// DERIVADO de tener ≥1 chip y NO se escribe; el toggle administrador NO
// se ofrece hasta que su motor exista — §5, Ley 23).

/** Los cuatro oficios del chip (§6: grano de OFICIO en pantalla). */
export type OficioChip = 'veterinaria' | 'grooming' | 'paseo' | 'adiestramiento';

export interface OficioNegocio {
  oficio: OficioChip;
  /** Las ofertas ACTIVAS de ese oficio — lo que la tabla guarda cuando
   *  la pantalla escribe el oficio (§6: el motor es grano de OFERTA). */
  servicioIds: string[];
}

/** Los oficios que el negocio TIENE (ofertas activas, legibles por
 *  `ps_public`), agrupados por el eje de la casa: es_medico=true ⇒
 *  veterinaria (canon S69 — emergencia/telemedicina son vet, la
 *  categoría no manda en lo clínico); si no, la categoría en
 *  {paseo, grooming, adiestramiento}. hospedaje/otro no son oficio del
 *  selector v1 — quedan fuera DECLARADO (no hay chip que darles). */
export async function obtenerOficiosNegocio(prestadorId: string): R<OficioNegocio[]> {
  const cliente = getClient();
  const ofertas = await cliente
    .from('prestador_servicios')
    .select('id, tipo_servicio')
    .eq('prestador_id', prestadorId)
    .eq('activo', true);
  if (ofertas.error) {
    return { ok: false, codigo: 'error_lectura', mensaje: ofertas.error.message };
  }
  const filas = ofertas.data ?? [];
  if (filas.length === 0) return { ok: true, data: [] };
  const slugs = [...new Set(filas.map((f) => f.tipo_servicio))];
  const tipos = await cliente
    .from('tipos_servicio')
    .select('codigo, categoria, es_medico')
    .in('codigo', slugs);
  if (tipos.error) {
    return { ok: false, codigo: 'error_lectura', mensaje: tipos.error.message };
  }
  const oficioDe = new Map<string, OficioChip>();
  for (const t of tipos.data ?? []) {
    if (t.es_medico === true) oficioDe.set(t.codigo, 'veterinaria');
    else if (t.categoria === 'paseo' || t.categoria === 'grooming' || t.categoria === 'adiestramiento') {
      oficioDe.set(t.codigo, t.categoria);
    }
  }
  const porOficio = new Map<OficioChip, string[]>();
  for (const f of filas) {
    const oficio = oficioDe.get(f.tipo_servicio);
    if (oficio === undefined) continue; // hospedaje/otro: fuera del v1
    porOficio.set(oficio, [...(porOficio.get(oficio) ?? []), f.id]);
  }
  const ORDEN: OficioChip[] = ['veterinaria', 'grooming', 'paseo', 'adiestramiento'];
  return {
    ok: true,
    data: ORDEN.filter((o) => porOficio.has(o)).map((o) => ({
      oficio: o,
      servicioIds: porOficio.get(o) ?? [],
    })),
  };
}

/** Escribir los chips = INSERT batch en `prestador_empleado_servicios`
 *  (policy `empleado_servicios_dueño_inserta`, titularidad — B0 punto 3).
 *  Legal sobre la fila recién invitada (`activo=false`): los chips nacen
 *  INERTES — las 8 lectoras exigen `pe.activo` (B0 punto 4) y el
 *  interruptor sigue siendo la aceptación. */
export async function asignarServiciosEmpleado(
  empleadoId: string,
  servicioIds: string[],
): R<null> {
  if (servicioIds.length === 0) return { ok: true, data: null };
  const { error } = await getClient()
    .from('prestador_empleado_servicios')
    .insert(servicioIds.map((servicioId) => ({ empleado_id: empleadoId, servicio_id: servicioId })));
  if (error) return { ok: false, codigo: 'error_escritura', mensaje: error.message };
  return { ok: true, data: null };
}

// ── S77-A · LA EDICIÓN DEL CHIP PARA QUIEN YA ESTÁ ADENTRO ──────────────
// LETRA_EDICION_VINCULO_S77 §4 y §10.2. Puerta única, CERO motor nuevo: la
// policy `empleado_servicios_dueño_elimina` (titularidad) autoriza el DELETE
// desde que la tabla existe — `packages/api` nunca lo expuso, así que la
// superficie no tenía por dónde. Esto abre la puerta que ya estaba abierta.
//
// L13 (S77-A, declarada): `asignarServiciosEmpleado` NO necesita hermano —
// su firma es (empleadoId, servicioIds) y su cuerpo no lee `activo` ni
// invitación; lo que asume la invitación es su JSDoc, no su código, y la
// policy de INSERT gatea SOLO por titularidad. Se usa tal cual para dar
// chips a quien ya está adentro.

/** Un chip vivo de la persona, con lo que la pantalla necesita para hablar
 *  ANTES de tocar nada: qué oficio es y si ese oficio es CLÍNICO. */
export interface ChipEmpleado {
  servicioId: string;
  tipoServicio: string;
  oficio: OficioChip;
  /** `tipos_servicio.es_medico` — la llave del gate clínico (S76-A4b).
   *  Es lo que convierte "quitar un chip" en un acto clínico (§4). */
  esMedico: boolean;
}

/** EL BORDE, DECLARADO (§4): quitar el ÚLTIMO chip médico le saca a esa
 *  persona EL EXPEDIENTE — deja de pasar `empleado_tiene_capacidad_clinica`
 *  y con ella los 6 sitios clínicos + los 2 helpers de caso (D-532). No es
 *  una preferencia de vitrina: es acceso a la historia de las mascotas.
 *  **Por eso este lector existe: la pantalla lo dice ANTES, no después.** */
export async function obtenerChipsEmpleado(empleadoId: string): R<ChipEmpleado[]> {
  // DOS VIAJES, NO TRES — Y NO UNO, CON SU PORQUÉ MEDIDO (S77-A, desvío D1
  // de la vara M2: la versión anterior hacía TRES round-trips encadenados y
  // el boceto los contaba como "1 llamada"). Es la lección de D-531 aplicada
  // antes de que duela: una Hoja que abre con una cascada en serie es la
  // misma forma que allá costó 579 ms.
  //
  // POR QUÉ NO SE PUEDE UNO SOLO (verificado, no supuesto): **no existe FK
  // `prestador_servicios.tipo_servicio → tipos_servicio.codigo`** — la tienen
  // `evento_cita_servicio` y `presupuesto_item`, ésta no. Sin FK, PostgREST
  // no puede anidar el embed (`could not find the relation between
  // prestador_servicios and tipos_servicio`, atrapado por el typecheck) y el
  // segundo viaje es OBLIGATORIO. Es la misma razón por la que su hermano
  // `obtenerOficiosNegocio` también lee `tipos_servicio` aparte. Colapsar a
  // uno exige una migración que agregue esa FK — no viaja escondida acá.
  //
  // PRECONDICIÓN VERIFICADA ANTES DE COLAPSAR (L-167 — un embed lo recorta la
  // RLS de la tabla embebida, y un colapso que devuelve MENOS con cara de
  // dato es peor que tres viajes):
  //   · `prestador_servicios`: el titular las ve TODAS por
  //     `prestador_servicios_own` (ALL, `prestador_id IN (mis prestadores)`),
  //     activas o no — que es justo lo que este lector necesita (el chip
  //     sobre oferta apagada SIGUE dando expediente, S76).
  //   · `tipos_servicio`: solo `ts_public` (`activo = true OR is_admin()`).
  // BORDE DECLARADO Y MEDIDO: un `tipos_servicio` con `activo = false` es
  // INVISIBLE al titular ⇒ su chip se omite. **Hoy no puede pasar: 0 de 30
  // tipos inactivos, 0 ofertas y 0 chips afectados** (medido S77-A). El
  // recorte es idéntico en las dos formas —la versión de 3 viajes lo tenía
  // igual—, así que el colapso no lo introduce ni lo cura; queda escrito para
  // que el día que un tipo se desactive se sepa dónde mirar.
  const cliente = getClient();
  // Viaje 1: los chips CON su oferta embebida (esa FK sí existe:
  // `prestador_empleado_servicios_servicio_id_fkey`).
  const conOferta = await cliente
    .from('prestador_empleado_servicios')
    .select('servicio_id, oferta:prestador_servicios(id, tipo_servicio)')
    .eq('empleado_id', empleadoId);
  if (conOferta.error) {
    return { ok: false, codigo: 'error_lectura', mensaje: conOferta.error.message };
  }
  const ofertas = (conOferta.data ?? [])
    .map((f) => f.oferta)
    .filter((o): o is { id: string; tipo_servicio: string } => o !== null);
  if (ofertas.length === 0) return { ok: true, data: [] };

  // Viaje 2 (obligatorio, ver arriba): los tipos.
  const slugs = [...new Set(ofertas.map((o) => o.tipo_servicio))];
  const tipos = await cliente
    .from('tipos_servicio')
    .select('codigo, categoria, es_medico')
    .in('codigo', slugs);
  if (tipos.error) return { ok: false, codigo: 'error_lectura', mensaje: tipos.error.message };

  // Mismo criterio de oficio que `obtenerOficiosNegocio` (canon S69: lo
  // médico manda sobre la categoría). Un tipo fuera del selector v1
  // (hospedaje/otro) no tiene chip que mostrar y se OMITE, jamás se pinta
  // crudo (Ley 3).
  const oficioDe = new Map<string, OficioChip>();
  const medicoDe = new Map<string, boolean>();
  for (const t of tipos.data ?? []) {
    medicoDe.set(t.codigo, t.es_medico === true);
    if (t.es_medico === true) oficioDe.set(t.codigo, 'veterinaria');
    else if (t.categoria === 'paseo') oficioDe.set(t.codigo, 'paseo');
    else if (t.categoria === 'grooming') oficioDe.set(t.codigo, 'grooming');
    else if (t.categoria === 'adiestramiento') oficioDe.set(t.codigo, 'adiestramiento');
  }
  const chips: ChipEmpleado[] = [];
  for (const o of ofertas) {
    const oficio = oficioDe.get(o.tipo_servicio);
    if (oficio === undefined) continue; // tipo no legible o fuera del v1
    chips.push({
      servicioId: o.id,
      tipoServicio: o.tipo_servicio,
      oficio,
      esMedico: medicoDe.get(o.tipo_servicio) === true,
    });
  }
  return { ok: true, data: chips };
}

/** Lo que la pantalla necesita DESPUÉS de quitar, para no re-leer a ciegas
 *  ni afirmar de más: cuántos chips médicos quedaron y si el acto le sacó
 *  el expediente a esa persona. */
export interface ResultadoQuitarChips {
  /** S77-A (pedido de B): los chips SOBREVIVIENTES, no solo su conteo. La
   *  Hoja repinta con esto y NO vuelve a leer — un viaje menos y, sobre
   *  todo, **una ventana de desincronía menos** (entre el re-read del
   *  wrapper y el de la pantalla, otro titular puede haber tocado). */
  chips: ChipEmpleado[];
  chipsRestantes: number;
  chipsMedicosRestantes: number;
  /** true ⟺ tenía capacidad clínica POR CHIP y ya no la tiene.
   *  LÍMITE DECLARADO: se computa sobre CHIPS, que es el brazo que este
   *  wrapper mueve. `empleado_tiene_capacidad_clinica` tiene además brazo
   *  de TITULARIDAD (y `is_admin()` en su versión de un argumento): un
   *  titular no pierde el expediente por quedarse sin chips, y este campo
   *  NO lo contempla — la Hoja del titular no monta chips (equipo.tsx),
   *  así que ese caso no es alcanzable hoy por esta puerta. */
  perdioCapacidadClinicaPorChip: boolean;
}

/** Quitar chips = DELETE en `prestador_empleado_servicios` (policy
 *  `empleado_servicios_dueño_elimina`, TITULARIDAD — el administrador NO
 *  puede, y la pantalla ya gatea por eso, Ley 23).
 *
 *  El chip es presencia/ausencia de fila: la tabla es (empleado_id,
 *  servicio_id, created_at), sin columna `activo` y sin policy de UPDATE —
 *  **no hay estado intermedio y no queda historia de cuándo se quitó**
 *  (declarado en L2, S77-A; si esa historia hiciera falta, es motor nuevo).
 *
 *  Devuelve el estado resultante para cerrar el lazo sin re-leer, y en
 *  particular `perdioCapacidadClinicaPorChip` — el hecho que §4 obliga a
 *  decir. **La advertencia va ANTES, con `obtenerChipsEmpleado`; esto es
 *  la confirmación de lo que pasó, no el aviso.** */
export async function quitarServiciosEmpleado(
  empleadoId: string,
  servicioIds: string[],
): R<ResultadoQuitarChips> {
  // (1) Estado previo. Si ESTO falla, no se tocó nada: `error_lectura`
  //     honesto, la Hoja puede reintentar sin consecuencias.
  const antes = await obtenerChipsEmpleado(empleadoId);
  if (!antes.ok) return antes;
  const teniaClinico = antes.data.some((c) => c.esMedico);

  // (2) El DELETE. Si falla, tampoco se quitó nada: `error_escritura`.
  if (servicioIds.length > 0) {
    const { error } = await getClient()
      .from('prestador_empleado_servicios')
      .delete()
      .eq('empleado_id', empleadoId)
      .in('servicio_id', servicioIds);
    if (error) return { ok: false, codigo: 'error_escritura', mensaje: error.message };
  }

  // (3) Se RE-LEE, no se resta de memoria: el DELETE pudo no alcanzar filas
  //     (id ajeno, ya borrado, carrera con otra sesión) y un conteo calculado
  //     mentiría con cara de dato (L-166 — el dato vivo se lee al usarlo).
  //
  //     SI ESTE READ FALLA, EL BORRADO YA OCURRIÓ. Devolver `error_lectura`
  //     acá era el bug que la vara de B destapó: la Hoja decía "no se pudo"
  //     con los chips ya borrados, y el titular reintentaba sobre un estado
  //     que ya había cambiado. Sale con código PROPIO para que la voz pueda
  //     decir la verdad incómoda: se quitó, no sabemos cómo quedó, recargá.
  const despues = await obtenerChipsEmpleado(empleadoId);
  if (!despues.ok) {
    return {
      ok: false,
      codigo: 'estado_no_confirmado',
      mensaje: despues.mensaje,
    };
  }

  const medicosRestantes = despues.data.filter((c) => c.esMedico).length;
  return {
    ok: true,
    data: {
      chips: despues.data,
      chipsRestantes: despues.data.length,
      chipsMedicosRestantes: medicosRestantes,
      perdioCapacidadClinicaPorChip: teniaClinico && medicosRestantes === 0,
    },
  };
}

/** LA JORNADA DE UNA PERSONA — el lector que §4bis necesita para que su
 *  aviso sea INFORMACIÓN y no ruido permanente.
 *
 *  POR QUÉ NACE (pedido de B, S77): `obtenerFranjasHorario`
 *  (`configuracionPaseo.ts:297`) resuelve por TITULAR — su literal filtra
 *  `.eq('empleado_id', titularId)` con el id que `obtenerTitularId`
 *  devuelve — y **no puede responder por otra persona**. Sin este lector, el
 *  aviso "el chip no promete disponibilidad" tendría que dibujarse SIEMPRE,
 *  y un aviso incondicional deja de ser información: es ruido que se
 *  aprende a ignorar, justo sobre el hueco que más importa.
 *
 *  DECISIÓN extender-vs-nuevo, DECLARADA (misma que E5 de este archivo): NO
 *  se ensancha `obtenerFranjasHorario` — sirve al wizard de paseo con OTRO
 *  contrato (`FranjaHorario[]` completo para editar) y ensancharlo forzaría
 *  a su consumidor a descartar campos o cambiaría su resolución. Esto es un
 *  lector nuevo, mínimo y de otro trabajo: la Hoja del miembro.
 *
 *  RLS verificada antes de escribirlo (L-167): el titular lee las franjas de
 *  SU gente por `prestador_horarios_own` (ALL, `prestador_id IN (mis
 *  prestadores)`) — `ph_empleado_own` alcanza solo a las propias, pero no es
 *  la única puerta. Sin ese literal, este lector habría devuelto 0 franjas
 *  con cara de dato y el aviso habría mentido al revés. */
export interface JornadaEmpleado {
  /** Franjas con `activo = true` — las únicas que las 8 lectoras de
   *  disponibilidad miran (todas exigen `h.activo`). */
  franjasActivas: number;
  /** Incluye las pausadas: una persona con franjas TODAS pausadas no es lo
   *  mismo que una que nunca cargó jornada, y la voz puede distinguirlo. */
  franjasTotales: number;
  /** El dato que el aviso consume: `franjasActivas === 0` ⟹ esta persona
   *  NO va a aparecer en ninguna reserva, tenga los chips que tenga. */
  tieneJornada: boolean;
}

export async function obtenerJornadaEmpleado(empleadoId: string): R<JornadaEmpleado> {
  const { data, error } = await getClient()
    .from('prestador_horarios')
    .select('id, activo')
    .eq('empleado_id', empleadoId);
  if (error) return { ok: false, codigo: 'error_lectura', mensaje: error.message };
  const filas = data ?? [];
  const activas = filas.filter((f) => f.activo === true).length;
  return {
    ok: true,
    data: { franjasActivas: activas, franjasTotales: filas.length, tieneJornada: activas > 0 },
  };
}

// ── S75-B · GATE DE ROL DE NAVEGACIÓN (D-513, la mitad UI) ──────────────
// Los gates son INERTES hasta que la puerta abra (B3): hoy solo el dueño
// resuelve prestador (obtenerMiPrestador por user_id — D-512), y el dueño
// SIEMPRE pasa ['dueño','administrador'] por la rama de titular del helper.
// Cuando A abra el resolvedor de empleados, este mismo código gatea al
// profesional/recepción sin tocarse — es el switch armado (D-512).

/** ¿El user de la sesión puede gestionar el NEGOCIO de este prestador?
 *  Delega en el helper único `empleado_tiene_rol` (§14.4 — la verdad de
 *  rol es del motor, la UI no la recomputa): true para el TITULAR (rama
 *  de dueño del helper) y para el empleado con rol en `p_roles`. El gate
 *  de PRODUCTO de la UI; el gate de ESCRITURA vive en el server (D-490/
 *  D-513, territorio A). Falla de red = false HONESTO — el gate cierra
 *  ante la duda (nunca abre lo que no pudo confirmar; Ley 23). */
export async function empleadoTieneRol(
  prestadorId: string,
  roles: readonly RolEquipo[],
): R<boolean> {
  const { data, error } = await getClient().rpc('empleado_tiene_rol', {
    p_prestador_id: prestadorId,
    p_roles: roles as string[],
  });
  if (error) return { ok: false, codigo: 'error_lectura', mensaje: error.message };
  return { ok: true, data: data === true };
}

/** El vínculo de empleado ACTIVO del user, si existe — para la VOZ de la
 *  puerta (S75-B): cuando `obtenerMiPrestador` falla (no sos titular,
 *  D-512) el raíz cae en `sin_rol`; esta sonda distingue al EMPLEADO
 *  ACTIVO (te sumaron y aceptaste, pero la puerta aún no abre) del user
 *  sin negocio alguno. Lee `prestador_empleados` por la policy
 *  `empleados_self` (user_id = auth.uid()) — CERO motor. Devuelve el
 *  nombre del negocio para la voz honesta; null = no hay vínculo activo.
 *  HERMANA de la sonda del handshake B1 (esa mira `activo=false`, esta
 *  `activo=true`) — por eso no colisionan. MUERE cuando la puerta abra:
 *  entonces el empleado activo entra a (tabs) y nunca ve esta rama. */
export async function obtenerNegocioEmpleadoActivo(): R<string | null> {
  const cliente = getClient();
  const { data: auth } = await cliente.auth.getUser();
  if (!auth.user) return { ok: true, data: null };
  const { data, error } = await cliente
    .from('prestador_empleados')
    .select('prestador_id, created_at, prestadores(nombre_comercial)')
    .eq('user_id', auth.user.id)
    .eq('activo', true)
    // Enmienda (a) de la vara S75: `invitado_en` es NULLABLE — el orden
    // determinista es `created_at` (NOT NULL), alineado con el criterio de
    // R1. El vínculo más antiguo preside; mismo orden en los dos pisos.
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, codigo: 'error_lectura', mensaje: error.message };
  if (data === null) return { ok: true, data: null };
  // el embed puede venir objeto u array según cardinalidad inferida;
  // el nombre puede ser null si el prestador no es legible (jamás inventa)
  const p = data.prestadores as { nombre_comercial: string | null } | { nombre_comercial: string | null }[] | null;
  const nombre = Array.isArray(p) ? (p[0]?.nombre_comercial ?? null) : (p?.nombre_comercial ?? null);
  return { ok: true, data: nombre };
}

// ── S75-B1 · EL HANDSHAKE DE PRODUCTO (D-514 (a)) ──────────────────────
// El invitado INACTIVO (crear_empleado_directo dejó su fila activo=false)
// no tiene camino a entrar: obtenerMiPrestador falla (no es titular) y el
// raíz lo mandaría a "sin negocio" — MENTIRA, sí tiene, lo invitaron.
// Esta sonda + su pantalla cierran el handshake. CERO motor nuevo: la
// sonda lee su propia fila por `empleados_self`; el aceptador es el RPC
// vivo `aceptar_invitacion_pendiente_login` (clase ok:false, D-511).

export interface InvitacionPendiente {
  /** el argumento del RPC — NO se renderiza. */
  empleadoId: string;
  /** nombre del negocio que invitó; null si el prestador no es legible
   *  (Ley 13/L-139: la pantalla dice "un equipo", jamás inventa nombre). */
  negocioNombre: string | null;
  /** S76-B1 (D-505): el PATH del logo del negocio que invitó — la FIRMA
   *  de /invitacion deja de ser monograma cuando el logo existe. null =
   *  sin logo o prestador no legible (LogoNegocio degrada solo). */
  negocioLogoPath: string | null;
  /** el nombre con que se te sumó (línea de apoyo de la pantalla). */
  nombreInvitado: string;
}

/** ¿El user tiene una invitación de equipo SIN aceptar? Lee su fila
 *  `activo=false` por `empleados_self` (CERO motor). Orden `created_at`
 *  (enmienda (a): `invitado_en` es nullable) — el vínculo más antiguo
 *  preside, alineado con R1. null = no hay handshake pendiente (el guard
 *  no redirige — Ley 23). HERMANA de `obtenerNegocioEmpleadoActivo`
 *  (esa mira `activo=true`): por eso no colisionan. */
export async function obtenerInvitacionPendiente(): R<InvitacionPendiente | null> {
  const cliente = getClient();
  const { data: auth } = await cliente.auth.getUser();
  if (!auth.user) return { ok: true, data: null };
  const { data, error } = await cliente
    .from('prestador_empleados')
    .select('id, nombre, created_at, prestadores(nombre_comercial, foto_url)')
    .eq('user_id', auth.user.id)
    .eq('activo', false)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, codigo: 'error_lectura', mensaje: error.message };
  if (data === null) return { ok: true, data: null };
  type PrestadorEmbed = { nombre_comercial: string | null; foto_url: string | null };
  const p = data.prestadores as PrestadorEmbed | PrestadorEmbed[] | null;
  const fila = Array.isArray(p) ? (p[0] ?? null) : p;
  return {
    ok: true,
    data: {
      empleadoId: data.id,
      negocioNombre: fila?.nombre_comercial ?? null,
      negocioLogoPath: fila?.foto_url ?? null,
      nombreInvitado: data.nombre,
    },
  };
}

/** Los rebotes suaves de `aceptar_invitacion_pendiente_login` — jsonb
 *  `{ok:false, mensaje:'<literal>'}` sin campo código (clase D-511, mismo
 *  patrón que `invitarEmpleado`). Literales verificados contra `prosrc`
 *  vivo (L-141). */
export type CodigoAceptar =
  | 'sin_sesion'
  | 'ya_activado'
  | 'no_es_tuya'
  | 'rebote_desconocido'
  | 'error_escritura';

const REBOTES_ACEPTAR: ReadonlyArray<{ literal: string; codigo: CodigoAceptar }> = [
  { literal: 'Sin sesión', codigo: 'sin_sesion' },
  { literal: 'Empleado no encontrado o ya activado', codigo: 'ya_activado' },
  { literal: 'No tenés permiso para aceptar esta invitación', codigo: 'no_es_tuya' },
];

/** Aceptar = el motor pone `activo=true` y marca la invitación aceptada.
 *  Éxito NO significa acceso a (tabs): la puerta (B3) sigue cerrada — la
 *  pantalla dice esa verdad honesta (L-139), jamás promete entrar. */
export async function aceptarInvitacionEquipo(
  empleadoId: string,
): Promise<ResultadoWrapper<null, CodigoAceptar>> {
  const { data, error } = await getClient().rpc('aceptar_invitacion_pendiente_login', {
    p_empleado_id: empleadoId,
  });
  if (error) return { ok: false, codigo: 'error_escritura', mensaje: error.message };
  const fila = (typeof data === 'object' && data !== null ? data : {}) as {
    ok?: boolean;
    mensaje?: string;
  };
  if (fila.ok !== true) {
    const mensaje = typeof fila.mensaje === 'string' ? fila.mensaje : '';
    const rebote = REBOTES_ACEPTAR.find((r) => mensaje.startsWith(r.literal));
    return {
      ok: false,
      codigo: rebote?.codigo ?? 'rebote_desconocido',
      mensaje: mensaje.length > 0 ? mensaje : 'No pudimos confirmar tu ingreso.',
    };
  }
  return { ok: true, data: null };
}
