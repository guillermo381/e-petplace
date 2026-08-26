// Lectura del prestador propio (S44-B4.1). Puerta única: la RLS de
// prestadores (SELECT propio por user_id) es el guard.
//
// S75-A1 (R1) — EL RESOLVEDOR DEJA DE SER SOLO-TITULAR. Hasta S74 este
// wrapper resolvía EXCLUSIVAMENTE por `prestadores.user_id`, y por eso
// las 26 pantallas que cuelgan de él le decían "no tenés prestador" a
// un empleado real del negocio (D-512: el motor entiende de empleados;
// la app todavía no). Dos pasos, CERO cambio de RLS:
//   (1) titularidad — la fila propia por `user_id` (lo de siempre);
//   (2) si no hay, el VÍNCULO ACTIVO: `prestador_empleados` por
//       `user_id` + `activo = true` → `prestador_id` → la fila por `id`.
// La RLS ya cubre las dos patas y se verificó con el literal de las
// policies (no se dedujo):
//   · `empleados_self` [SELECT] USING (user_id = auth.uid()) — el
//     empleado lee SUS propias filas de vínculo.
//   · `prestadores_public` [SELECT] USING (estado = 'activo' OR
//     user_id = auth.uid() OR is_admin()) — el empleado lee la fila
//     del negocio porque está ACTIVO, no porque sea suya.
// BORDE DECLARADO (consecuencia del literal de arriba, no del código):
// un empleado de un negocio que NO está en estado 'activo' (hoy vive
// uno: "Carlos", en_revision) cae en `sin_prestador`. Es honesto — ese
// negocio todavía no opera —, y curarlo sería tocar RLS, que este paso
// NO hace.
// ORDEN DETERMINISTA: titularidad primero; después, el vínculo activo
// MÁS ANTIGUO (`created_at ASC`, columna NOT NULL). v1 asume UN negocio
// por persona; el borde de dos negocios NO rompe (elige el más antiguo,
// siempre el mismo) pero pide una superficie de selección — v2.
// LO QUE ESTE PASO NO HACE: no resuelve `obtenerMiCuentaComercial` (R2,
// por `owner_profile_id`, fuera del v1 por decisión founder) y no
// gatea nada por rol — la identidad no es permiso (D-490/D-513).

import { getClient, uidActual } from '../client';
import type { ResultadoWrapper } from '../resultado';
import type { Database } from '../database.types';

const CODIGOS_ERROR_PRESTADOR = ['sin_sesion', 'sin_prestador'] as const;
export type CodigoErrorPrestador = (typeof CODIGOS_ERROR_PRESTADOR)[number];

// S79-T4.1: los códigos de la SEDE son del camino de ESCRITURA — viven
// en su propio union para no ensanchar el de lectura (fees.ts subsume
// los códigos de R1 como subconjunto; agrandar el de lectura rompería
// esa relación por un error que la lectura jamás produce).
export type CodigoErrorPerfilPrestador =
  | CodigoErrorPrestador
  | 'coordenadas_invalidas'
  | 'radio_invalido'
  // S84-A1bis: el teléfono mal formado REBOTA TIPADO. El CHECK de la DB
  // (`chk_prestadores_*_e164`) es la RED, jamás la voz: un constraint
  // crudo llega a la pantalla como ruido de motor.
  | 'telefono_invalido';

const MENSAJES: Record<CodigoErrorPerfilPrestador | 'error_desconocido' | 'datos_inconsistentes', string> = {
  sin_sesion:            'No hay sesión activa.',
  sin_prestador:         'Tu usuario no tiene un prestador asociado.',
  coordenadas_invalidas: 'La ubicación no es válida. Busca la dirección de nuevo.',
  radio_invalido:        'El radio de cobertura no es válido.',
  // dice QUÉ falta, no "es inválido": el caso real es un número sin país.
  telefono_invalido:     'El número tiene que incluir el país (por ejemplo +593 …).',
  datos_inconsistentes:  'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:     'Ocurrió un error inesperado. Prueba de nuevo.',
};

/**
 * E.164 ENTERO, con su '+' — **regla 28 del CONTRATO, enmendada el
 * 2-ago-2026** (firma founder + arquitecto). El país viaja DENTRO del
 * número: no hay columna de indicativo que pueda contradecirlo, y
 * derivarlo del `country_code` del perfil está PROHIBIDO (P21 — el caso
 * canónico es un negocio en EC con línea CO).
 *
 * La regla vieja ("E.164 sin '+'") se derogó **por incompleta, no por
 * equivocada**: funcionaba si el país vivía en otro lado, y en
 * `prestadores` esa columna nunca se construyó.
 *
 * Espejo EXACTO del CHECK de la DB (`^\+[1-9][0-9]{6,14}$`): '+' obligatorio,
 * primer dígito ≠ 0, 7 a 15 dígitos. **Si los dos divergen, gana la DB y
 * el usuario ve un error de motor** — por eso se escriben juntos y con el
 * literal a la vista.
 */
const E164 = /^\+[1-9][0-9]{6,14}$/;

/** El campo es OPCIONAL: vacío pasa. Lo que se exige es que si HAY valor,
 *  sea E.164 — nunca se completa ni se corrige un número a medias. */
function telefonoValido(v: string | null | undefined): boolean {
  if (v === undefined || v === null) return true;
  const limpio = v.trim();
  return limpio.length === 0 || E164.test(limpio);
}

// S58-B (hunk aditivo): country_code entra al contrato — la fuente ya
// era clara (fees.ts lo lee de la MISMA tabla); las zonas del taller
// filtran el catálogo por el país del prestador.
// S59-B5 (hunk aditivo): direccion/ciudad (la fila "Dónde" del mundo
// grooming — solo lectura de la sede) + grooming_extra_pelaje_largo
// (UN extra del prestador, NULL honesto — fundación S59-A3).
// S60-B2 (hunk aditivo): la sección ENTIDAD de Cuenta·Tu perfil (P17
// v1.1, visto del arquitecto): descripcion + contacto (editables) y
// estado (solo lectura; el admin lo gobierna).
// S61 domicilio v1 (hunk aditivo): grooming_recargo_domicilio — el
// espejo del extra de pelaje (numeric NULL honesto, CHECK >= 0).
// S75-A1 (hunk aditivo): cuenta_comercial_id — lo que `fees.ts` leía
// con su PROPIA consulta por `user_id`; al entrar acá, C1 pasa a
// CONSUMIR este resolvedor en vez de duplicarlo (L-150: una sola
// verdad; si no, el empleado resolvería su negocio en 26 pantallas y
// seguiría sin comisión en el taller).
// S76-B1 (hunk aditivo, D-505): foto_url — el PATH del logo en el
// bucket público `avatars` (identidad pública del negocio; el path se
// resuelve con `resolverUrlLogoNegocio`, jamás se persiste una URL).
export type MiPrestador = Pick<
  Database['public']['Tables']['prestadores']['Row'],
  | 'id'
  | 'nombre_comercial'
  | 'tipo'
  | 'country_code'
  | 'cuenta_comercial_id'
  | 'direccion'
  | 'ciudad'
  // S79-T4.1: la SEDE completa entra al shape — el editor de B necesita
  // leer lo que la whitelist de abajo deja escribir (LETRA_PERFIL §1
  // registro 2). null = no declarado (firma §2.2: sin datos, sin
  // oferta geográfica — jamás un default).
  | 'sector'
  | 'lat'
  | 'lon'
  | 'radio_cobertura_km'
  | 'grooming_extra_pelaje_largo'
  | 'grooming_recargo_domicilio'
  | 'descripcion'
  | 'telefono'
  | 'whatsapp'
  | 'email_contacto'
  | 'sitio_web'
  | 'estado'
  | 'foto_url'
  // S84-A6 (hunk aditivo): el CLIP de la vitrina — UNO solo, PATH en el
  // bucket `prestador-galeria` (CHECK `..._es_path` en la tabla). Ganó
  // `SELECT (clip_url)` en `20260802180000`: hasta esa migración la
  // columna existía y NO era legible por `authenticated`.
  | 'clip_url'
  // S78-B (LETRA_VITRINA): el estado del toggle — la escritura tiene su
  // writer propio abajo; el flip a encendido lo gatea el trigger MECANICO
  // de A7 (rebota `aviso_reasignacion_no_existe` hasta que el aviso exista).
  | 'expone_personas'
  /* ── S85 · EL EMBLEMA DE COHORTE ──────────────────────────────────────
     `'fundador' | 'pionero'` + el año del alta. **Firma del founder
     (3-ago-2026):** ventana fundacional hasta el **30-mar-2027 inclusive**;
     el 1-oct es el LANZAMIENTO OFICIAL, **no** el inicio de la ventana —
     **las altas previas también son fundadoras** (§4.4bis).

     **Se ESTAMPA al alta por trigger e INMUTABLE en el motor: ni el
     prestador ni el admin lo editan.** *Un emblema que alguien con permisos
     puede escribirse deja de ser un emblema y pasa a ser un campo de texto.*
     Corregirlo exige una migración — un acto versionado, no un click.

     Ganó su `GRANT SELECT` por columna en `20260804030000`: en `prestadores`
     toda columna nueva nace SIN grant (§3bis). **Y viaja también en
     `v_prestadores_publicos`**, porque el emblema se ve en la página
     pública — es parte de lo que la familia lee al elegir. */
  | 'cohorte_anio'
> & {
  /**
   * EL EMBLEMA, **ESTRECHADO A SU UNIÓN** (pedido de C, S85).
   *
   * Sale del `Pick` a propósito: Supabase **no lee los CHECK**, así que el tipo
   * generado lo da como `string | null` y la pieza de `packages/ui` pide
   * `'fundador' | 'pionero' | null`. **Acá se declara la unión que la DB YA
   * GARANTIZA** (`chk_prestadores_cohorte`), en el mismo bloque de intersección
   * donde vive la zona (S84-A26).
   *
   * ⚠️ **POR QUÉ NO UN CAST EN LA PANTALLA** —y C tenía razón en no hacerlo—:
   * un `as` **aceptaría en silencio un código futuro que la unión no cubre**.
   * *El día que la cohorte gane un tercer valor, el cast lo dejaría pasar y la
   * pieza recibiría algo que no sabe pintar; la unión declarada rompe el
   * typecheck, que es exactamente lo que uno quiere que pase.*
   *
   * **Estrechar acá COPIA lo que la DB garantiza — y eso es una duplicación
   * declarada, no un descuido:** si el CHECK gana un valor, esta unión hay que
   * moverla en el MISMO commit (L-198). *La alternativa era que cada consumidor
   * lo estrechara por su cuenta, que es la misma copia repartida en N casas.*
   */
  cohorte: 'fundador' | 'pionero' | null;
  /* ── S84-A26 · LA ZONA, LEÍDA DE LA MISMA VISTA QUE VE LA FAMILIA ──
     Estas TRES no salen de `prestadores`: salen de `v_prestadores_publicos`,
     y por eso el tipo es una intersección y no un `Pick` más largo.

     **EL PORQUÉ ES DE PRODUCTO, no de tipos** (pedido de C, firmado): el
     espejo muestra LO QUE VE LA FAMILIA. Si el wrapper le pasara la sede
     EXACTA, el prestador creería que la familia ve su ubicación real —
     justo lo que la vista dejó de exponer en D-624. **El espejo pasaría de
     mostrar la verdad a CERTIFICAR UNA MENTIRA.**

     Y se leen DE LA VISTA en vez de recalcular la fórmula sobre la fila
     propia, aunque recalcular sea más barato: **dos derivaciones del mismo
     dato se separan un día y nadie se entera.** Mismo criterio que la
     portada derivada del orden — una sola verdad en vez de dos que pueden
     contradecirse.

     ⚠️ NULL LEGÍTIMO EN DOS CASOS, y los dos son la verdad:
       · el prestador NO tiene coordenadas cargadas;
       · el prestador **no está `activo`** ⇒ no está en la vista. Medido:
         Carlos (`en_revision`) queda fuera. **Y está bien: la familia
         tampoco lo ve.** El espejo de un negocio que no se muestra no
         debería inventarle una zona. */
  zona_lat: number | null;
  zona_lon: number | null;
  zona_radio_m: number | null;
};

// ☠️ S96: murieron `COLUMNAS_MI_PRESTADOR` y `leerZona` — vivían solo para
// el brazo (2) del select directo, que estaba MUERTO desde S91 (grants por
// columna) y se retiró con la M22. La RPC trae fila y zona en un viaje.

/** Estrecha `cohorte` de `string | null` (lo que Supabase genera, porque **no
 *  lee los CHECK**) a su unión real. **Se valida en RUNTIME y no con un cast**:
 *  un `as` daría por buena cualquier cadena, y el día que la DB gane un tercer
 *  valor la pieza de `ui` recibiría algo que no sabe pintar. *Un valor fuera de
 *  la unión cae a `null` — que es "no sé", no un emblema inventado* (L-197). */
function estrecharCohorte(v: unknown): 'fundador' | 'pionero' | null {
  return v === 'fundador' || v === 'pionero' ? v : null;
}

/**
 * El negocio del user logueado — por TITULARIDAD o por VÍNCULO ACTIVO
 * (S75-A1). Ver el encabezado del archivo para el porqué, el literal de
 * las policies que lo sostienen y los bordes declarados.
 */
export async function obtenerMiPrestador(): Promise<
  ResultadoWrapper<MiPrestador, CodigoErrorPrestador>
> {
  const uid = await uidActual();
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };

  // (1) Titularidad — MISMA fila que siempre, por OTRA PUERTA.
  //
  // 🔴 S91: la lectura directa de `prestadores` MURIÓ para clientes. La
  // tabla entregaba a cualquier autenticado la lat/lon EXACTA, la dirección
  // y el email de negocios ajenos, salteando el ofuscado que S84 firmó
  // (rojo reproducido: 4 · 5 · 1 filas). Se cerró por columna — y un grant
  // por columna NO distingue dueño de ajeno, porque los dos son
  // `authenticated`. De ahí esta RPC: el dueño necesitaba una puerta propia.
  //
  // `obtener_mi_prestador()` es DEFINER y gatea por `user_gestiona_prestador`
  // — el MISMO predicado de la policy del dueño, así que titular Y equipo
  // activo entran: la puerta del arco de equipo de S75 no se cierra con esto.
  // Devuelve TABLE, así que llega como array de 0 o 1.
  const { data: filas, error } = await getClient().rpc('obtener_mi_prestador');

  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  const data = Array.isArray(filas) && filas.length > 0 ? filas[0] : null;
  /* ⚡ S94-PERF: la zona VIENE EN LA MISMA RPC — acá vivía un
     `...(await leerZona(data.id))`, o sea un SEGUNDO viaje encadenado que no
     podía empezar hasta que el primero devolviera el id.
     Medido con token real por la misma puerta que la app: 316,1 ms los dos
     viajes contra 157,7 ms el viaje único ⇒ **156 ms menos por llamada**. Y
     este wrapper aparece en **28 de los efectos de foco** del monorepo, que lo
     vuelve el viaje más repetido que existe: hasta ~4,4 s de red en un
     recorrido completo de la app.
     El dato es el MISMO (verificado valor contra valor, `b6-verde-zona.mjs`
     4/4): la RPC hace `LEFT JOIN v_prestadores_publicos`, así que conserva el
     ofuscado de S84 **y** su `WHERE estado='activo'` — un prestador no activo
     sigue recibiendo NULL, como antes.
     S96: el brazo (2) murió con la M22 — la RPC cubre titular Y vínculo. */
  if (data !== null) {
    return { ok: true, data: { ...data, cohorte: estrecharCohorte(data.cohorte) } };
  }

  // ☠️ S96 (12-ago, hallazgo BLOQUEANTE del gate): acá vivía el brazo (2) —
  // resolver el vínculo activo leyendo `prestadores` DIRECTO con
  // COLUMNAS_MI_PRESTADOR. **Estaba MUERTO desde S91**: la cirugía de
  // grants por columna dejó `direccion`/`lat`/`email_contacto` sin grant y
  // el select rebotaba 42501 (medido en web con la cuenta real:
  // `403 permission denied for table prestadores`) — todo empleado raso
  // caía a `error_desconocido` y la raíz quedaba en el loop de reintento.
  // La RPC `obtener_mi_prestador` ganó el brazo del VÍNCULO ACTIVO en la
  // FUENTE (M22, titularidad primero), así que la rama (1) de arriba cubre
  // a los dos actores. Cero filas de la RPC = de verdad no hay negocio.
  return { ok: false, codigo: 'sin_prestador', mensaje: MENSAJES.sin_prestador };
}

// ── S60-B2 (hunk aditivo): edición ACOTADA del perfil de la entidad ─────────
// WHITELIST EXPLÍCITA (visto del arquitecto): SOLO descripcion +
// contacto. El payload se arma clave por clave — jamás spread del form.
// nombre_comercial/foto_url = identidad PÚBLICA (sesión D-370);
// direccion/ciudad = sede operativa; estado/aprobado_* = del admin;
// fiscal = cuentas_comerciales (regla 25). La RLS (prestadores_own,
// fila entera) NO acota columnas: esta whitelist es la capa de
// PRODUCTO — la protección del motor la registra la A como deuda 🔴.

export interface InputActualizarPerfilPrestador {
  /** '' o solo espacios ⇒ NULL honesto en DB. */
  descripcion?: string;
  /** **E.164 ENTERO, con su '+'** — regla 28 ENMENDADA (S84-A1bis,
   *  2-ago-2026). Vacío es legal; con valor, `telefonoValido` o rebota
   *  `telefono_invalido`. Ya NO se le quita el '+' al guardar: el país
   *  vive dentro del número. */
  telefono?: string;
  /** Mismo contrato que `telefono`. Ojo: la columna es NOT NULL en DB,
   *  así que su vacío es `''` y no NULL (relevado). */
  whatsapp?: string;
  email_contacto?: string;
  sitio_web?: string;
  /** S84-A6: el PATH del CLIP en `prestador-galeria`. '' ⇒ NULL honesto
   *  (quitar el clip). UNO solo por negocio — por eso es columna y no
   *  tabla. **La duración ≤30 s NO se valida acá**: ver la nota en
   *  `subir-clip.ts` — sin módulo de video no es medible, y prometer un
   *  techo que no se comprueba sería peor que declararlo. */
  clip_url?: string;
  /** S76-B1 (D-505): el PATH del logo en el bucket `avatars` — la firma
   *  gana productor. '' ⇒ NULL honesto (quitar el logo). El trigger
   *  D-389 NO protege esta columna (relevado S74-A, vara E7): esta
   *  whitelist es la capa de PRODUCTO que la habilita a propósito. */
  foto_url?: string;
  // ── S79-T4.1 — LA SEDE entra a la whitelist (LETRA_PERFIL_S79 §1
  // registro 2, firmada v1.1). Las DOS leyes de A4 rigen acá igual:
  //   · lat/lon PAR-O-REBOTA (`coordenadas_invalidas`), rango validado.
  //   · LA COORDENADA MUERE CON EL TEXTO (§2.2): si viaja `direccion`
  //     SIN lat/lon, el wrapper escribe lat/lon NULL — una coordenada
  //     vieja pegada a un texto nuevo describe OTRA puerta.
  //   lat/lon SOLO salen del LugarResuelto de resolverLugar (contrato
  //   lugares.ts) — jamás tipeadas a mano.
  /** '' ⇒ NULL honesto. Cambiarla sin lat/lon MATA las coordenadas. */
  direccion?: string;
  ciudad?: string;
  sector?: string;
  /** Par obligatorio con lon; null explícito = borrar la ubicación. */
  lat?: number | null;
  lon?: number | null;
  /** km. null = el prestador deja de declarar radio ⇒ deja de ofertarse
   *  por geografía (firma §2.2 — decisión suya, jamás un default). El
   *  15 sugerido vive en el FORMULARIO (§2.1), no acá. */
  radio_cobertura_km?: number | null;
}

function aNull(v: string | undefined): string | null | undefined {
  if (v === undefined) return undefined; // no viajó: no se toca
  const limpio = v.trim();
  return limpio.length === 0 ? null : limpio;
}

export async function actualizarPerfilPrestador(
  input: InputActualizarPerfilPrestador,
): Promise<ResultadoWrapper<null, CodigoErrorPerfilPrestador>> {
  const uid = await uidActual();
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };

  /* S84-A1bis — LA PUERTA NO OFRECE LO QUE VA A RECHAZAR (Ley 23): los dos
     números se miran ANTES de armar el payload, y JUNTOS, para que quien
     tenga los dos mal no descubra el segundo después de arreglar el
     primero. El CHECK de la DB queda como red de último recurso: si esto
     no estuviera, el rebote llegaría como constraint crudo. */
  if (!telefonoValido(input.telefono) || !telefonoValido(input.whatsapp)) {
    return { ok: false, codigo: 'telefono_invalido', mensaje: MENSAJES.telefono_invalido };
  }

  const payload: Partial<Database['public']['Tables']['prestadores']['Update']> = {};
  const descripcion = aNull(input.descripcion);
  const telefono = aNull(input.telefono);
  const emailContacto = aNull(input.email_contacto);
  const sitioWeb = aNull(input.sitio_web);
  const fotoUrl = aNull(input.foto_url);
  if (descripcion !== undefined) payload.descripcion = descripcion;
  if (telefono !== undefined) payload.telefono = telefono;
  // whatsapp es NOT NULL en DB (legacy): el "sin dato" es '' — relevado.
  if (input.whatsapp !== undefined) payload.whatsapp = input.whatsapp.trim();
  if (emailContacto !== undefined) payload.email_contacto = emailContacto;
  if (sitioWeb !== undefined) payload.sitio_web = sitioWeb;
  if (fotoUrl !== undefined) payload.foto_url = fotoUrl;
  const clipUrl = aNull(input.clip_url);
  if (clipUrl !== undefined) payload.clip_url = clipUrl;

  // ── la sede (S79-T4.1) ────────────────────────────────────────────
  const direccionSede = aNull(input.direccion);
  const ciudadSede = aNull(input.ciudad);
  const sectorSede = aNull(input.sector);
  if (direccionSede !== undefined) payload.direccion = direccionSede;
  if (ciudadSede !== undefined) payload.ciudad = ciudadSede;
  if (sectorSede !== undefined) payload.sector = sectorSede;

  const latViajo = input.lat !== undefined;
  const lonViajo = input.lon !== undefined;
  if (latViajo !== lonViajo) {
    // media coordenada = relleno plausible (L-139): rebota.
    return { ok: false, codigo: 'coordenadas_invalidas', mensaje: MENSAJES.coordenadas_invalidas };
  }
  if (latViajo && lonViajo) {
    const lat = input.lat ?? null;
    const lon = input.lon ?? null;
    if ((lat === null) !== (lon === null)) {
      return { ok: false, codigo: 'coordenadas_invalidas', mensaje: MENSAJES.coordenadas_invalidas };
    }
    if (lat !== null && lon !== null) {
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        return { ok: false, codigo: 'coordenadas_invalidas', mensaje: MENSAJES.coordenadas_invalidas };
      }
    }
    payload.lat = lat;
    payload.lon = lon;
  } else if (direccionSede !== undefined) {
    // LA COORDENADA MUERE CON EL TEXTO (§2.2): la dirección cambió sin
    // resolución Places ⇒ las coordenadas viejas se pisan con NULL.
    payload.lat = null;
    payload.lon = null;
  }

  if (input.radio_cobertura_km !== undefined) {
    const radio = input.radio_cobertura_km;
    if (radio !== null && (!Number.isInteger(radio) || radio < 1 || radio > 500)) {
      return { ok: false, codigo: 'radio_invalido', mensaje: MENSAJES.radio_invalido };
    }
    payload.radio_cobertura_km = radio;
  }

  if (Object.keys(payload).length === 0) return { ok: true, data: null };

  const { data, error } = await getClient()
    .from('prestadores')
    .update(payload)
    .eq('user_id', uid)
    .select('id')
    .maybeSingle();

  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  if (data === null) return { ok: false, codigo: 'sin_prestador', mensaje: MENSAJES.sin_prestador };
  return { ok: true, data: null };
}

// ── S79-T4.6 (hunk aditivo): la ceremonia del primer ingreso ────────────────
// LETRA_PERFIL §4 (firmada) + LETRA_ALTA §2 fase 4: la marca en MOTOR que
// reemplaza el puente AsyncStorage de la bienvenida (declarado como puente
// por B en su boceto — muere consumiendo esto). La RPC es idempotente y
// atómica: el PRIMER caller de la vida del negocio recibe true; estampa
// SOLO al TITULAR y SOLO con estado='activo' (la sala de espera no quema
// la ceremonia). El empleado o quien no tiene negocio recibe respuesta
// normal {esPrimerIngreso:false, …null} — jamás un error (v1.1).

export interface PrimerIngreso {
  esPrimerIngreso: boolean;
  /** ISO timestamp del primer ingreso — null si todavía no ocurrió (o no hay negocio propio). */
  primerIngresoEn: string | null;
  /** LETRA §3bis: el propósito NO viaja por PostgREST — esta RPC es su
   *  lector canónico; la bienvenida lo recibe acá. null honesto. */
  proposito: string | null;
}

export async function registrarPrimerIngreso(): Promise<
  ResultadoWrapper<PrimerIngreso, CodigoErrorPrestador>
> {
  const { data, error } = await getClient().rpc('registrar_primer_ingreso');
  if (error) {
    const codigo = error.message.startsWith('auth_required') ? 'sin_sesion' : 'error_desconocido';
    return codigo === 'sin_sesion'
      ? { ok: false, codigo, mensaje: MENSAJES.sin_sesion }
      : { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  const o = data as Record<string, unknown> | null;
  if (o === null || typeof o !== 'object' || o.ok !== true || typeof o.es_primer_ingreso !== 'boolean') {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.datos_inconsistentes };
  }
  return {
    ok: true,
    data: {
      esPrimerIngreso: o.es_primer_ingreso,
      primerIngresoEn: typeof o.primer_ingreso_en === 'string' ? o.primer_ingreso_en : null,
      proposito: typeof o.proposito === 'string' && o.proposito.length > 0 ? o.proposito : null,
    },
  };
}

// ── S76-B1 (hunk aditivo, D-505): la URL del logo del negocio ──────────────
// El logo vive en el bucket PÚBLICO `avatars` (relevado S76-B: public=true,
// lectura por policy "Avatar read" para todos) — identidad PÚBLICA del
// negocio: la ve el titular, el invitado (/invitacion) y mañana el pet
// parent en toda superficie con firma. Por eso NO se firma URL efímera
// (patrón mascotas, bucket privado): la pública es derivable del path,
// síncrona e infalible. Se persiste el PATH (la casa jamás guarda URLs).

const BUCKET_LOGOS = 'avatars';

/** URL pública del logo a partir del PATH persistido en
 *  `prestadores.foto_url`. null entra, null sale (sin logo → el
 *  monograma honesto de LogoNegocio). */
export function resolverUrlLogoNegocio(path: string | null): string | null {
  if (path === null || path.length === 0) return null;
  return getClient().storage.from(BUCKET_LOGOS).getPublicUrl(path).data.publicUrl;
}

// ── S84-A7: LA GEMELA DE LA GALERÍA, al lado de la del logo ────────────────
// C la tenía en su lib y **pidió bien que viviera acá**: dos resolvedores de
// URL en dos casas es como nacen las divergencias silenciosas — el día que uno
// cambie de bucket, de forma de firma o de manejo del null, el otro sigue igual
// y nadie se entera hasta que una foto sale rota. **Misma casa, misma forma, y
// una sola cosa que mantener.**
//
// `prestador-galeria` nació PÚBLICO (S84-A4) por la misma razón que `avatars`:
// la vitrina es pública y una URL firmada efímera sería fricción sin secreto
// que proteger. Por eso esto es síncrono e infalible, igual que su gemela.
//
// Sirve para las fotos Y para el clip: **los dos viven en el mismo bucket**, y
// lo que se persiste en ambos casos es el PATH (CHECK `..._es_path` en la tabla
// y en la columna). Un resolvedor por tipo de archivo sería la misma
// duplicación que esto viene a cerrar.

const BUCKET_GALERIA = 'prestador-galeria';

/** URL pública de una foto de galería o del clip, a partir del PATH
 *  persistido (`prestador_fotos.url` / `prestadores.clip_url`).
 *  null entra, null sale — la superficie decide su vacío honesto. */
export function resolverUrlGaleriaPrestador(path: string | null): string | null {
  if (path === null || path.length === 0) return null;
  return getClient().storage.from(BUCKET_GALERIA).getPublicUrl(path).data.publicUrl;
}

/** S78-B — el writer del toggle de vitrina (LETRA_VITRINA A1bis). El
 *  FLIP a encendido lo intercepta el trigger mecánico de A7: mientras
 *  `notificar_reasignacion_cita` no exista, rebota
 *  `aviso_reasignacion_no_existe` — el error viaja TIPADO para que la
 *  superficie nunca lo ofrezca a ciegas (Ley 23). RLS: titular-only
 *  (la escritura de negocio es del titular — S75 A3). */
export async function actualizarExponePersonas(
  prestadorId: string,
  valor: boolean,
): Promise<ResultadoWrapper<{ exponePersonas: boolean }, 'aviso_reasignacion_no_existe' | 'error_escritura'>> {
  const { data, error } = await getClient()
    .from('prestadores')
    .update({ expone_personas: valor })
    .eq('id', prestadorId)
    .select('expone_personas')
    .maybeSingle();
  if (error) {
    if (error.message.includes('aviso_reasignacion_no_existe')) {
      return { ok: false, codigo: 'aviso_reasignacion_no_existe', mensaje: error.message };
    }
    return { ok: false, codigo: 'error_escritura', mensaje: error.message };
  }
  if (data === null) return { ok: false, codigo: 'error_escritura', mensaje: 'sin_fila' };
  return { ok: true, data: { exponePersonas: data.expone_personas } };
}


/**
 * ¿SE PUEDE ENCENDER LA VITRINA? (S78-A8, pedido de B — el lector del gate.)
 *
 * ESPEJO EXACTO del predicado del trigger `trg_prestadores_gate_vitrina`
 * (la misma expresión `to_regprocedure` sobre la misma firma, en la RPC
 * `puede_encender_vitrina`): el día que `notificar_reasignacion_cita`
 * exista, el trigger deja pasar Y este lector devuelve `true` — en el
 * mismo instante, sin que nadie toque nada. Si divergen, el bug es la
 * divergencia, no este lector.
 *
 * B lo usa para NO dibujar el toggle mientras el gate rebote (Ley 23: un
 * toggle que rebota al guardar es peor que un toggle ausente). El fallo
 * de lectura NO se degrada a `false` con cara de dato — sale tipado, y
 * la pantalla decide (hoy: no dibujar, que coincide con el estado real).
 */
export async function puedeEncenderVitrina(): Promise<ResultadoWrapper<boolean, CodigoErrorPrestador | 'error_desconocido'>> {
  const { data, error } = await getClient().rpc('puede_encender_vitrina');
  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  return { ok: true, data: data === true };
}

// ─────────────────────────────────────────────────────────────────────────
// S85-A · EL NOMBRE COMERCIAL — UN NOMBRE, DOS CASAS
//
// Firma: *"la portada edita el nombre; el fiscal lo exhibe."*
// Adjudicación de mesa (S85): gana la salida (a) de C — **el acto escribe LAS
// DOS columnas, nunca una sola.**
//
// ⚠️ POR QUÉ VIVE ACÁ Y NO EN `cuentaComercial.ts`, que es la duda razonable
// porque toca su tabla: **el editor es la PORTADA**, y la portada es del
// prestador. *El wrapper vive donde vive su llamador; que además escriba en la
// casa fiscal es implementación, y por eso está escondida en una RPC y no
// repartida en dos llamadas desde la pantalla.*
//
// ⚠️ NO HAY UN `actualizarNombreComercial` EN `cuentaComercial.ts` Y NO DEBE
// HABERLO. Si alguien agrega uno "para el lado fiscal", vuelve a existir el
// camino que escribe UNA sola columna — y la divergencia que esta pieza vuelve
// inexpresable pasa a ser expresable otra vez, por la puerta de al lado.
// ─────────────────────────────────────────────────────────────────────────

const CODIGOS_NOMBRE = [
  'sin_sesion',
  'nombre_vacio',
  'no_es_titular',
  'sin_cuenta_comercial',
  'no_es_owner_de_la_cuenta',
  'error_desconocido',
] as const;
export type CodigoErrorNombreComercial = (typeof CODIGOS_NOMBRE)[number];

const MENSAJES_NOMBRE: Record<CodigoErrorNombreComercial, string> = {
  sin_sesion:               'No hay sesión activa.',
  // NO dice "inválido": las dos columnas son NOT NULL, así que vaciarlo no es
  // una opción que exista. Se dice qué hacer, no qué se hizo mal.
  nombre_vacio:             'El nombre de tu negocio no puede quedar vacío.',
  no_es_titular:            'Solo el titular del negocio puede cambiar su nombre.',
  // estado REAL del alta, no teórico: la cuenta puede no existir todavía.
  sin_cuenta_comercial:     'Todavía no tienes una cuenta comercial. Créala antes de cambiar el nombre.',
  no_es_owner_de_la_cuenta: 'Solo quien es titular de la cuenta comercial puede cambiar el nombre.',
  error_desconocido:        'Ocurrió un error inesperado. Prueba de nuevo.',
};

/**
 * Cambia el nombre comercial en **`prestadores` Y `cuentas_comerciales`**, en
 * una sola transacción del server (RPC `actualizar_nombre_comercial`).
 *
 * **La atomicidad es el punto, no un detalle:** dos UPDATE desde acá **pueden
 * fallar por separado**, y el resultado —la portada con el nombre nuevo y el
 * documento fiscal con el viejo— **no da error, no rompe nada y nadie lo
 * descubre**, porque cada pantalla lee su propia columna y las dos se ven
 * correctas. *Una transacción lo vuelve inexpresable.*
 *
 * Medido al construir: las 7 filas vivas **coincidían**. Esto no repara una
 * divergencia — **impide la primera**.
 */
export async function actualizarNombreComercial(
  nombre: string,
): Promise<ResultadoWrapper<{ nombre: string }, CodigoErrorNombreComercial>> {
  const { data, error } = await getClient().rpc('actualizar_nombre_comercial', {
    p_nombre: nombre,
  });

  if (error) {
    /* Normalizado por `startsWith` y no por igualdad: la RPC levanta
       `RAISE EXCEPTION '<codigo>'` y PostgREST puede envolverlo con detalle
       (L-115). Un `===` acá haría caer TODO al genérico y la pantalla diría
       "error inesperado" sobre un rebote perfectamente explicable. */
    const raw = error.message ?? '';
    const codigo =
      CODIGOS_NOMBRE.find((c) => c !== 'error_desconocido' && raw.startsWith(c)) ??
      (raw.startsWith('auth_required') ? 'sin_sesion' : 'error_desconocido');
    return { ok: false, codigo, mensaje: MENSAJES_NOMBRE[codigo] };
  }

  /* Guard de shape contra el RETURNS real (`jsonb` con ok/nombre) — L-124.
     Si el server devuelve otra cosa, NO se inventa el eco del input: eso
     pintaría como guardado algo que no sabemos que se guardó. */
  const d = data as { ok?: unknown; nombre?: unknown } | null;
  if (d === null || typeof d.nombre !== 'string') {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES_NOMBRE.error_desconocido };
  }
  return { ok: true, data: { nombre: d.nombre } };
}

// ── S91 · EL NOMBRE DE QUIEN RESERVÓ, POR CITA (pedido de B) ──────────
// Alimenta el chip de PERSONA del histórico del prestador.
//
// POR QUÉ ES UNA RPC Y NO UN EMBED, que es lo que cualquiera probaría
// primero: `profiles_select` es `auth.uid() = id` —cada quien lee SOLO su
// propia fila—, así que `profiles(nombre)` desde el lector del histórico
// devolvería **VACÍO, no un nombre**. Un dato ausente que parece un dato
// ausente es el modo de falla más difícil de diagnosticar. B lo midió; por
// eso S74 hizo DEFINER y por eso esto es función.
//
// LA FRONTERA DE S74 SE CONSERVA ENTERA: **solo el nombre.** Sin teléfono y
// sin correo — qué del pet parent ve un prestador es decisión de LETRA, y
// está elevada a la mesa. Hay un cinturón en la migración que rebota si el
// cuerpo de la función llegara a nombrar `telefono` o `email`.

/** Union PROPIO y angosto, mismo criterio que los códigos de la sede
 *  (S79-T4.1): no se ensancha el de lectura de `prestadores` para un
 *  lector que no lee `prestadores`. */
const CODIGOS_RESERVADOR = ['error', 'datos_inconsistentes'] as const;
export type CodigoReservador = (typeof CODIGOS_RESERVADOR)[number];

const MENSAJE_RESERVADOR = 'No pudimos cargar los nombres. Prueba de nuevo.';

export interface NombreReservador {
  cita_id: string;
  /** null HONESTO en dos casos distintos que la fila NO distingue a
   *  propósito, porque para el chip son el mismo: walk-in (la cita no tiene
   *  reservador) y perfil sin nombre. La ausencia de FILA, en cambio, sí
   *  significa otra cosa: esa cita no es de un negocio donde tengas rol. */
  nombre: string | null;
}

/** Nombres de quienes reservaron, por lote de citas.
 *  El gate es POR CITA: las de otro negocio se OMITEN (no rebotan el lote
 *  entero, que lo volvería inútil, ni se devuelven, que sería la fuga). */
export async function obtenerNombresReservadorPorCita(
  citaIds: readonly string[],
): Promise<ResultadoWrapper<NombreReservador[], CodigoReservador>> {
  if (citaIds.length === 0) return { ok: true, data: [] };
  const { data, error } = await getClient().rpc('obtener_nombres_reservador_por_cita', {
    p_cita_ids: [...citaIds],
  });
  if (error) return { ok: false, codigo: 'error', mensaje: MENSAJE_RESERVADOR };
  if (!Array.isArray(data)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJE_RESERVADOR };
  }
  return {
    ok: true,
    data: data.map((f) => ({
      cita_id: String(f.cita_id),
      nombre: typeof f.nombre === 'string' && f.nombre.length > 0 ? f.nombre : null,
    })),
  };
}

// ── S91 · LA FICHA PÚBLICA (pedido de C) ──────────────────────────────
// Lee `v_prestadores_publicos` y **JAMÁS la tabla `prestadores`**: desde S91
// la tabla no es legible por clientes (cerró una fuga que entregaba la
// lat/lon exacta, la dirección y el email de negocios ajenos), y la vista es
// LA única puerta pública. *Si algún día esto necesita un campo que la vista
// no tiene, se ensancha la VISTA — no se vuelve a la tabla.*

export interface PerfilPublico {
  id: string;
  nombre_comercial: string;
  foto_url: string | null;
  ciudad: string | null;
  sector: string | null;
  descripcion: string | null;
  cohorte: 'fundador' | 'pionero' | null;
  cohorte_anio: number | null;
  /** La ZONA aproximada, no la coordenada: centro desplazado estable por id
   *  (S84). Un ofuscado que variara no ofuscaría — promediaría. */
  zona_lat: number | null;
  zona_lon: number | null;
  zona_radio_m: number | null;
  calificacion_promedio: number | null;
  total_resenas: number | null;
  total_citas: number | null;
  /** Cada servicio trae su `categoria` (de `tipos_servicio`), que es lo que
   *  permite componer la voz de oficio SIN re-implementar el mapa de 29
   *  códigos en el cliente — la segunda verdad que diverge sola. */
  servicios: ServicioPublico[];
  /** En el orden de `orden`: **[0] es la portada** (contrato de
   *  `listarFotosGaleria`; acá se respeta, no se re-decide). */
  portadas: string[];
  clip_url: string | null;
}

export interface ServicioPublico {
  id: string;
  tipo: string;
  nombre: string;
  precio: number | null;
  duracion_minutos: number | null;
  /** `veterinaria` · `paseo` · `grooming` · `adiestramiento` … */
  categoria: string | null;
}

/** Fichas públicas por lote. Lote vacío = lista vacía, sin viaje.
 *  Un id que no está en la vista (negocio no activo) simplemente NO viene:
 *  su ausencia es la respuesta, no un error. */
export async function obtenerPerfilesPublicos(
  ids: readonly string[],
): Promise<ResultadoWrapper<PerfilPublico[], CodigoReservador>> {
  if (ids.length === 0) return { ok: true, data: [] };
  const { data, error } = await getClient()
    .from('v_prestadores_publicos')
    // ⚠️ EN UNA SOLA CADENA LITERAL, no concatenada: supabase-js infiere el
    // tipo de la fila PARSEANDO el string en tiempo de tipos, y una
    // concatenación lo vuelve `string` genérico ⇒ toda la fila cae a
    // `GenericStringError` y se pierde el chequeo entero. (Medido: el primer
    // intento partía el select en tres líneas con `+` y tsc marcó las 17
    // propiedades como inexistentes.)
    .select(
      'id, nombre_comercial, foto_url, ciudad, sector, descripcion, cohorte, cohorte_anio, zona_lat, zona_lon, zona_radio_m, calificacion_promedio, total_resenas, total_citas, servicios, portadas, clip_url',
    )
    .in('id', [...ids]);
  if (error) return { ok: false, codigo: 'error', mensaje: MENSAJE_RESERVADOR };
  if (!Array.isArray(data)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJE_RESERVADOR };
  }
  return {
    ok: true,
    data: data.map((f) => ({
      id: String(f.id),
      nombre_comercial: String(f.nombre_comercial ?? ''),
      foto_url: f.foto_url ?? null,
      ciudad: f.ciudad ?? null,
      sector: f.sector ?? null,
      descripcion: f.descripcion ?? null,
      // Estrechada con la MISMA pieza que el resto del archivo, no con un
      // cast: un cast diría «confío», `estrecharCohorte` VERIFICA.
      cohorte: estrecharCohorte(f.cohorte),
      cohorte_anio: typeof f.cohorte_anio === 'number' ? f.cohorte_anio : null,
      zona_lat: typeof f.zona_lat === 'number' ? f.zona_lat : null,
      zona_lon: typeof f.zona_lon === 'number' ? f.zona_lon : null,
      zona_radio_m: typeof f.zona_radio_m === 'number' ? f.zona_radio_m : null,
      calificacion_promedio:
        typeof f.calificacion_promedio === 'number' ? f.calificacion_promedio : null,
      total_resenas: typeof f.total_resenas === 'number' ? f.total_resenas : null,
      total_citas: typeof f.total_citas === 'number' ? f.total_citas : null,
      // Guard de shape sobre jsonb (L-124): una fila con forma inesperada se
      // OMITE en vez de viajar a medias y romper la ficha del consumidor.
      servicios: (Array.isArray(f.servicios) ? f.servicios : []).flatMap((s) => {
        const o = s as Record<string, unknown>;
        if (typeof o?.id !== 'string' || typeof o?.tipo !== 'string') return [];
        return [{
          id: o.id,
          tipo: o.tipo,
          nombre: typeof o.nombre === 'string' ? o.nombre : o.tipo,
          precio: typeof o.precio === 'number' ? o.precio : null,
          duracion_minutos: typeof o.duracion_minutos === 'number' ? o.duracion_minutos : null,
          categoria: typeof o.categoria === 'string' ? o.categoria : null,
        }];
      }),
      portadas: (Array.isArray(f.portadas) ? f.portadas : []).filter(
        (u): u is string => typeof u === 'string' && u.length > 0,
      ),
      clip_url: f.clip_url ?? null,
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// S99-A · LOTE #0 — EL CONTEXTO DE ARRANQUE EN UN VIAJE (D-738, cura reina).
//
// Reemplaza la cadena de identidad del arranque (obtenerMiPrestador →
// contextoVentas → roles+moneda ≈ 3 olas + la sonda del HOY = 4 esperas,
// ~620 ms medidos por d0) por UNA RPC que COMPONE los gates existentes —
// obtener_mi_prestador · empleado_tiene_rol · obtener_mi_posicion_en_prestador
// — sin re-derivar un solo predicado. La composición por capacidad (§2.0,
// adjudicación 15-ago) se alimenta de acá: una fuente, N consumidores
// (barra · HOY · la ventana hermana de L4).
// ═══════════════════════════════════════════════════════════════════════════

import type { ConfigMonedaPais } from './paisConfig';

export interface CuentaComercialDeContexto {
  id: string;
  estado: string;
  nombreComercial: string;
  countryCode: string;
}

export interface ContextoArranque {
  /** La MISMA fila que `obtenerMiPrestador` (titularidad o vínculo), o null. */
  prestador: MiPrestador | null;
  /** `empleado_tiene_rol(['dueño','administrador'])` — false sin prestador. */
  esGestor: boolean;
  /** La mitad "posición" de montaAtender (jsonb de posición del motor). */
  esMostradorOGestion: boolean;
  /** La mitad "capacidad de local": oferta activa con atiende_local en un
   *  oficio cuya modalidad admite atención local. DERIVADO de
   *  `oficiosLocales` en el motor (una fuente) — se conserva por compat. */
  hayOficioLocal: boolean;
  /** S99 (dictado founder ④): LA LISTA de oficios con local — los tres
   *  escalones de ATENDER cuentan y nombran (0 → sin tab · 1 → pantalla
   *  directa · 2+ → baldosas; L-251: un menú de una opción es un peaje).
   *  Capacidades de ATENDER = oficiosLocales ∪ (esVendedora &&
   *  ventaMostradorActiva ? mostrador : ∅). Fail-closed: motor viejo → []. */
  oficiosLocales: string[];
  /** S99 (dictado founder ④): «atiendo en mi local» para VENTA DE
   *  PRODUCTOS — la perilla de la cuenta, SIEMPRE FRESCA. Apagada, la
   *  baldosa de mostrador NO existe. Fail-closed: motor viejo → false. */
  ventaMostradorActiva: boolean;
  cuentaComercial: CuentaComercialDeContexto | null;
  /** El veredicto SIEMPRE FRESCO (D-821): rol seller_productos activo. */
  esVendedora: boolean;
  /** El discriminador del vacío (letra 15-ago): ¿alguna vez ENTREGÓ un
   *  pedido? false → voz de arranque · true → voz de serenidad. */
  haVendido: boolean;
  /** La config ENTERA (D-448) del país de la cuenta, o null sin cuenta. */
  moneda: ConfigMonedaPais | null;
  /** S99 Gate 2 ④ — EL LECTOR DE IDENTIDAD del repartidor: las casas donde
   *  este usuario tiene vínculo SELLADO (aceptó el reclamo; `activo`). Dice
   *  QUIÉN ES — jamás derivarlo de `misEntregasAsignadas`, que devuelve
   *  vacío tanto para «no es repartidor» como para «hoy sin entregas»
   *  (L-218, medición de C). `[]` = no es repartidor en ninguna casa.
   *  El pendiente-sin-aceptar NO aparece acá: vive en
   *  `misVinculosRepartidorPendientes` (el reclamo). */
  repartidorDe: { repartidor_id: string; cuenta_comercial_id: string; negocio: string }[];
}

export async function obtenerContextoArranque(): Promise<
  ResultadoWrapper<ContextoArranque, CodigoErrorPrestador>
> {
  const uid = await uidActual();
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };

  const { data, error } = await getClient().rpc('obtener_contexto_arranque');
  if (error) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }

  // Guard de shape contra el retorno REAL (L-124): jsonb con ok:true.
  const r = data as {
    ok?: unknown;
    prestador?: Record<string, unknown> | null;
    es_gestor?: unknown;
    posicion?: { es_mostrador_o_gestion?: unknown } | null;
    hay_oficio_local?: unknown;
    oficios_locales?: unknown;
    venta_mostrador_activa?: unknown;
    cuenta_comercial?: {
      id?: unknown;
      estado?: unknown;
      nombre_comercial?: unknown;
      country_code?: unknown;
    } | null;
    es_vendedora?: unknown;
    ha_vendido?: unknown;
    moneda?: {
      currency_code?: unknown;
      currency_symbol?: unknown;
      currency_decimals?: unknown;
    } | null;
    repartidor_de?: unknown;
  } | null;
  if (!r || r.ok !== true) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }

  // El prestador llega como la MISMA fila del RETURNS TABLE de
  // obtener_mi_prestador (to_jsonb del row) — mismo estrechado de cohorte
  // que el wrapper original, para que los dos caminos digan lo mismo.
  const p = r.prestador ?? null;
  const prestador: MiPrestador | null =
    p && typeof p.id === 'string'
      ? ({
          ...(p as unknown as MiPrestador),
          cohorte: estrecharCohorte((p as { cohorte?: unknown }).cohorte as string | null),
        } as MiPrestador)
      : null;

  const cc = r.cuenta_comercial ?? null;
  const cuentaComercial: CuentaComercialDeContexto | null =
    cc && typeof cc.id === 'string'
      ? {
          id: cc.id,
          estado: typeof cc.estado === 'string' ? cc.estado : '',
          nombreComercial: typeof cc.nombre_comercial === 'string' ? cc.nombre_comercial : '',
          countryCode: typeof cc.country_code === 'string' ? cc.country_code : '',
        }
      : null;

  const m = r.moneda ?? null;
  const moneda: ConfigMonedaPais | null =
    m &&
    typeof m.currency_code === 'string' &&
    typeof m.currency_symbol === 'string' &&
    typeof m.currency_decimals === 'number'
      ? { codigo: m.currency_code, simbolo: m.currency_symbol, decimales: m.currency_decimals }
      : null;

  return {
    ok: true,
    data: {
      prestador,
      esGestor: r.es_gestor === true,
      esMostradorOGestion: r.posicion?.es_mostrador_o_gestion === true,
      hayOficioLocal: r.hay_oficio_local === true,
      oficiosLocales: Array.isArray(r.oficios_locales)
        ? (r.oficios_locales as unknown[]).filter((x): x is string => typeof x === 'string')
        : [],
      ventaMostradorActiva: r.venta_mostrador_activa === true,
      cuentaComercial,
      esVendedora: r.es_vendedora === true,
      haVendido: r.ha_vendido === true,
      moneda,
      // Fail-closed: un bundle contra el motor viejo (campo ausente) lee []
      // — el repartidor degrada al callejón, jamás a un crash ni a un rol falso.
      repartidorDe: Array.isArray(r.repartidor_de)
        ? (r.repartidor_de as unknown[]).flatMap((v) => {
            const o = v as {
              repartidor_id?: unknown;
              cuenta_comercial_id?: unknown;
              negocio?: unknown;
            };
            return typeof o.repartidor_id === 'string' &&
              typeof o.cuenta_comercial_id === 'string' &&
              typeof o.negocio === 'string'
              ? [{
                  repartidor_id: o.repartidor_id,
                  cuenta_comercial_id: o.cuenta_comercial_id,
                  negocio: o.negocio,
                }]
              : [];
          })
        : [],
    },
  };
}
