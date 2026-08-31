/* ═══════════════════════════════════════════════════════════════════════════
   LOS DOCUMENTOS DE GUARDERÍA — la puerta que faltaba
   ═══════════════════════════════════════════════════════════════════════════
   Las tres RPC vivían en la base **sin wrapper**, y una pantalla que las llame
   directo salta la puerta única de la casa: sin unión discriminada, sin códigos
   tipados, sin normalizar el error. *No es prolijidad — es que el día que el
   motor cambie un código, la pantalla se entera por un `error_desconocido`.*

   🔴 **ESTE MÓDULO NO REDACTA NI UNA LÍNEA DE TEXTO LEGAL.** El `contenido` de
   cada documento **sale de la base**, donde lo pone quien tiene la firma
   (`PLAN_S107_GUARDERIA` §0: *ninguna pista redacta texto legal, ni siquiera un
   placeholder*). Lo que hay acá son mensajes de **producto** para errores de
   producto.
   ═══════════════════════════════════════════════════════════════════════════ */

import { getClient } from '../client';
import type { Json } from '../database.types';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  no_sos_de_esta_familia:    'Esto es de otra familia.',
  tope_de_urgencia_invalido: 'Ese tope de urgencia no es válido.',
  familia_no_existe:         'No encontramos esa familia.',
  sin_sesion:                'Tu sesión expiró. Vuelve a entrar.',
  datos_inconsistentes:      'No pudimos leer la respuesta. Prueba de nuevo.',
  error_desconocido:         'No pudimos completar la acción. Prueba de nuevo.',
} as const;

export type CodigoErrorGuarderiaDocumentos = keyof typeof MENSAJES;
const CODIGOS = Object.keys(MENSAJES) as CodigoErrorGuarderiaDocumentos[];

function fallaCodigo<T>(c: CodigoErrorGuarderiaDocumentos): ResultadoWrapper<T, CodigoErrorGuarderiaDocumentos> {
  return { ok: false, codigo: c, mensaje: MENSAJES[c] };
}
function fallo<T>(raw: string): ResultadoWrapper<T, CodigoErrorGuarderiaDocumentos> {
  if (raw === 'auth_required') return fallaCodigo('sin_sesion');
  // L-115: el motor levanta `codigo: detalle` — se normaliza por prefijo.
  for (const codigo of CODIGOS) if (raw.startsWith(codigo)) return fallaCodigo(codigo);
  return fallaCodigo('error_desconocido');
}

export interface DocumentoGuarderia {
  codigo: string;
  /** La versión VIGENTE. Se acepta una versión concreta, jamás «el documento». */
  version: number;
  /** 🔴 El texto, tal cual vive en la base. **Esta capa no lo compone.** */
  contenido: string;
}

/**
 * El estado de los documentos de una familia.
 *
 * 🔴 **`documentos_no_disponibles` NO es `al_dia`** — significa que **no hay
 * documentos cargados**, y por lo tanto no hay nada que aceptar. *Tratarlo como
 * «al día» dejaría reservar sin que la familia haya aceptado nada: es
 * fail-OPEN, y acá el default tiene que ser el contrario.* La pantalla lo dice
 * y no ofrece continuar.
 */
export type EstadoDocumentos = 'al_dia' | 'faltan' | 'documentos_no_disponibles';

export interface EvaluacionDocumentos {
  estado: EstadoDocumentos;
  /** Qué falta aceptar, con su versión. Vacío cuando `al_dia`. */
  faltantes: { codigo: string; version: number }[];
}

export async function obtenerDocumentosGuarderia(): Promise<
  ResultadoWrapper<DocumentoGuarderia[], CodigoErrorGuarderiaDocumentos>
> {
  const { data, error } = await getClient().rpc('obtener_documentos_guarderia');
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  const salida: DocumentoGuarderia[] = [];
  for (const d of data) {
    if (typeof d !== 'object' || d === null) return fallaCodigo('datos_inconsistentes');
    const r = d as Record<string, unknown>;
    if (typeof r.codigo !== 'string' || typeof r.version !== 'number') {
      return fallaCodigo('datos_inconsistentes');
    }
    /* El contenido vacío NO se rellena con nada: si un documento llegó sin
       texto, la pantalla lo dice — **jamás se muestra un legal a medias.** */
    salida.push({
      codigo: r.codigo,
      version: r.version,
      contenido: typeof r.contenido === 'string' ? r.contenido : '',
    });
  }
  return { ok: true, data: salida };
}

export async function evaluarDocumentosGuarderia(
  familiaId: string,
): Promise<ResultadoWrapper<EvaluacionDocumentos, CodigoErrorGuarderiaDocumentos>> {
  const { data, error } = await getClient().rpc('evaluar_documentos_guarderia', {
    p_familia_id: familiaId,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  const e = r.estado;
  if (e !== 'al_dia' && e !== 'faltan' && e !== 'documentos_no_disponibles') {
    return fallaCodigo('datos_inconsistentes');
  }
  const faltantes: { codigo: string; version: number }[] = [];
  if (Array.isArray(r.faltantes)) {
    for (const f of r.faltantes) {
      if (typeof f !== 'object' || f === null) continue;
      const x = f as Record<string, unknown>;
      if (typeof x.codigo === 'string' && typeof x.version === 'number') {
        faltantes.push({ codigo: x.codigo, version: x.version });
      }
    }
  }
  return { ok: true, data: { estado: e, faltantes } };
}

/**
 * Acepta las versiones que la familia leyó, y de paso registra lo que la letra
 * pide junto: el tope de urgencia, los contactos y la autorización de imagen.
 *
 * 🔴 **Se acepta una VERSIÓN, no «el documento».** El día que el texto cambie,
 * la aceptación vieja **deja de contar** — que es el punto de versionarlos.
 *
 * **Idempotente:** aceptar dos veces la misma versión no duplica ni falla
 * (`ON CONFLICT DO NOTHING` en el motor). *Un reintento de red no puede
 * convertirse en un error para el que ya aceptó.*
 */
export interface AutorizacionGuarderia {
  redesAutorizadas: boolean;
  /** `null` = **el tope del documento vigente**, no «sin tope». */
  urgenciaTopeMonto: number | null;
  urgenciaTopeMoneda: string;
  contactos: Json;
  contactoAlternativo: Json | null;
  actualizadoEn: string;
}

/**
 * Lo que la familia autorizó. **`null` cuando NUNCA autorizó nada.**
 *
 * 🔴 **`null` NO es `false`, y la diferencia es la razón de este lector:**
 * *«no hay fila» y «dijo que no» son dos verdades distintas.* Un interruptor
 * que las confunde **muestra «no» sobre alguien que nunca eligió** — y encima
 * lo invita a re-autorizar algo que quizá ya autorizó.
 *
 * Antes de esto **se podía escribir y no se podía leer**: cero lectores de
 * `guarderia_autorizaciones_familia`. *Un interruptor sin lector arranca
 * siempre en «no».*
 */
export async function obtenerAutorizacionGuarderia(
  familiaId: string,
): Promise<ResultadoWrapper<AutorizacionGuarderia | null, CodigoErrorGuarderiaDocumentos>> {
  const { data, error } = await getClient().rpc('obtener_autorizacion_guarderia', {
    p_familia_id: familiaId,
  });
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  if (data.length === 0) return { ok: true, data: null };
  const r = data[0] as Record<string, unknown>;
  if (typeof r.redes_autorizadas !== 'boolean' || typeof r.actualizado_en !== 'string') {
    return fallaCodigo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      redesAutorizadas: r.redes_autorizadas,
      urgenciaTopeMonto: typeof r.urgencia_tope_monto === 'number' ? r.urgencia_tope_monto : null,
      urgenciaTopeMoneda: typeof r.urgencia_tope_moneda === 'string' ? r.urgencia_tope_moneda : 'USD',
      contactos: (r.contactos ?? []) as Json,
      contactoAlternativo: (r.contacto_alternativo ?? null) as Json | null,
      actualizadoEn: r.actualizado_en,
    },
  };
}

/**
 * Prende o apaga la autorización de publicar imágenes. **Puerta propia.**
 *
 * 🔴 **NO se usa `aceptarDocumentosGuarderia` para esto, y la razón está
 * MEDIDA, no argumentada:** con un documento nuevo vigente, re-llamar al
 * aceptador para mover este booleano **aceptaba el documento solo**
 * (`aceptaciones 10 → 11`, medido en subtransacción). *Cambiar una preferencia
 * de imagen habría firmado un contrato legal que la familia no leyó.*
 *
 * Esta puerta toca **sólo el booleano** — ni aceptaciones, ni tope, ni
 * contactos — y crea la fila si no existe.
 */
export async function fijarRedesAutorizadas(params: {
  familiaId: string;
  autorizadas: boolean;
}): Promise<ResultadoWrapper<{ redesAutorizadas: boolean }, CodigoErrorGuarderiaDocumentos>> {
  const { data, error } = await getClient().rpc('fijar_redes_autorizadas', {
    p_familia_id: params.familiaId,
    p_autorizadas: params.autorizadas,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.redes_autorizadas !== 'boolean') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { redesAutorizadas: r.redes_autorizadas } };
}

export interface AceptacionResultado {
  aceptadas: number;
  /** **Lo único que la pantalla debe mirar** para decidir si sigue. */
  alDia: boolean;
  faltantes: { codigo: string; version: number }[];
}

export async function aceptarDocumentosGuarderia(params: {
  familiaId: string;
  /**
   * Las versiones leídas. **Omitirlo (o `null`) es EL ACTO ÚNICO**: el servidor
   * resuelve los vigentes al momento del acto.
   *
   * 🔴 Preferí omitirlo. Con seis casillas, mandar cinco era una elección de la
   * familia; **con un solo acto, mandar cinco es un bug** — y su síntoma es una
   * familia a la que le dijiste que sí y queda en `faltan` sin entender por qué.
   */
  aceptaciones?: { codigo: string; version: number }[] | null;
  /**
   * ✏️ **AFLOJADOS EL 31-AGO — y en el orden que este mismo comentario pedía.**
   * Decía: *«si algún día el motor los vuelve opcionales, acá se aflojan
   * después, no antes»*. Ese día llegó: firma del founder — **el tope salió de
   * la pantalla y vive como término del texto** (el documento dice USD 150,
   * editable después desde la cuenta).
   *
   * 🔴 **Omitir el tope NO es «sin tope»: es «el del documento vigente».** Y es
   * lo correcto, porque *cualquier número que mandara la pantalla sería una
   * autorización que la familia no dio.*
   *
   * ⚠️ Mandar un número explícito es **la familia editándolo**, y entonces se
   * guarda. Volver a aceptar sin número **no se lo borra**.
   */
  urgenciaTopeMonto?: number;
  urgenciaTopeMoneda?: string;
  contactos?: Json;
  /** Éste SÍ es opcional en el motor (`p_contacto_alternativo?`). */
  contactoAlternativo?: Json;
  /** La autorización de imagen. **Ausente = NO autorizada**, jamás al revés. */
  redesAutorizadas?: boolean;
}): Promise<ResultadoWrapper<AceptacionResultado, CodigoErrorGuarderiaDocumentos>> {
  const { data, error } = await getClient().rpc('aceptar_documentos_guarderia', {
    p_familia_id: params.familiaId,
    /* Tipado, no forzado: `as never` habría silenciado al compilador en el
       único lugar donde su opinión sirve (regla 34). */
    p_aceptaciones: (params.aceptaciones ?? null) as Json,
    p_urgencia_tope_monto: params.urgenciaTopeMonto ?? undefined,
    p_urgencia_tope_moneda: params.urgenciaTopeMoneda ?? undefined,
    p_contactos: params.contactos ?? undefined,
    p_contacto_alternativo: params.contactoAlternativo,
    /* 🔴 FAIL-CLOSED: sin decisión explícita, la imagen NO se autoriza.
       *Un default `true` acá autorizaría a publicar la foto de un animal
       porque alguien no tocó un interruptor.* */
    p_redes_autorizadas: params.redesAutorizadas === true,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.aceptadas !== 'number' || typeof r.al_dia !== 'boolean') {
    return fallaCodigo('datos_inconsistentes');
  }
  /* 🔴 LA PANTALLA LEE `alDia`, NO `aceptadas`. *Un contador no es un
     veredicto*: `aceptadas: 5` se lee como éxito mientras la familia queda
     trabada. */
  return {
    ok: true,
    data: {
      aceptadas: r.aceptadas,
      alDia: r.al_dia,
      faltantes: Array.isArray(r.faltantes) ? (r.faltantes as { codigo: string; version: number }[]) : [],
    },
  };
}
