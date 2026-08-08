/**
 * La voz humana de UN hecho del timeline (S82-C — extraída de
 * hogar/index cuando el perfil de mascota la necesitó; regla 37: el
 * diccionario vive UNA vez). Ley 3: el código del evento jamás sale de
 * acá; desconocido degrada digno — 'Momento de cuidado' (precedente
 * LineaDeVida). Las keys viven en el namespace hogar.* del cliente.
 */

import type { useTraduccion } from '@/i18n';

type Traductor = ReturnType<typeof useTraduccion>['t'];

/**
 * S91 · LOS TRES HITOS NARRATIVOS — voces FIRMADAS por el founder (8-ago).
 *
 * Se resuelven por `hito_clave` y NO por `tipo`: los tres comparten
 * `tipo = 'hito_narrativo'`, así que el tipo no discrimina. Es la misma
 * excepción que ya vivía acá para `vacuna_aplicada`.
 *
 * ⚠️ LAS CLAVES SALIERON DEL OBJETO, NO DE UN DOCUMENTO. La orden de mesa
 * nombró «llegada»; la fila viva de `cat_hitos_narrativos` es
 * `llego_a_la_familia` (medido: las tres claves activas). Manda la fuente.
 *
 * ⚠️ Y LA DEGRADACIÓN ES PARTE DEL CONTRATO: una clave que este bundle no
 * conozca cae al genérico. No se agrega un fallback que adivine — un bundle
 * viejo no puede inventarle voz a un hito nuevo (mismo criterio que D-662 con
 * los papeles). El nodo genérico es feo y es honesto.
 */
const VOZ_HITO: Record<string, 'hogar.hechoHitoVidaNueva' | 'hogar.hechoHitoLlegoALaFamilia' | 'hogar.hechoHitoMundoNuevo'> = {
  vida_nueva_empieza: 'hogar.hechoHitoVidaNueva',
  llego_a_la_familia: 'hogar.hechoHitoLlegoALaFamilia',
  mundo_nuevo_empieza: 'hogar.hechoHitoMundoNuevo',
};

/**
 * `nombreMascota` es OBLIGATORIO y no opcional a propósito: solo una de las
 * tres voces lo usa, pero si fuera opcional el llamador que se olvidara
 * pintaría «llegó a la familia» sin sujeto — y eso no lo caza ningún
 * typecheck. Exigirlo mueve el error de runtime a compilación (L-192: un modo
 * de falla silencioso no es un modo de falla aceptable).
 */
export function vozHecho(
  item: { tipo: string; vacuna_nombre: string | null; hito_clave?: string | null },
  t: Traductor,
  nombreMascota: string,
): string {
  const claveHito = item.hito_clave ? VOZ_HITO[item.hito_clave] : undefined;
  if (claveHito !== undefined) return t(claveHito, { nombre: nombreMascota });

  switch (item.tipo) {
    case 'atencion_paseo_registrada': return t('hogar.hechoPaseo');
    case 'atencion_grooming_registrada': return t('hogar.hechoGrooming');
    case 'atencion_adiestramiento_registrada': return t('hogar.hechoAdiestramiento');
    case 'vacuna_aplicada':
      return item.vacuna_nombre !== null
        ? t('hogar.hechoVacuna', { nombre: item.vacuna_nombre })
        : t('hogar.hechoVacunaSinNombre');
    case 'historia_clinica_registrada': return t('hogar.hechoConsulta');
    default: return t('hogar.hechoMomento');
  }
}

/** La familia del hecho (el eje del filtro y del canto — Ley 3). */
export const FAMILIA_DE_TIPO: Record<
  string,
  'paseos' | 'estetica' | 'adiestramiento' | 'salud' | 'bitacora'
> = {
  // S91 · P4 — la bitácora es familia PROPIA del filtro. No entra a 'salud'
  // ni a un oficio: lo que la familia observa no es un servicio, y meterlo en
  // una casilla ajena haría que el chip de ese oficio mintiera sobre lo que
  // agrupa.
  // ⚠️ EL CÓDIGO ES `bitacora_familia`, SIN sufijo — medido contra la DB viva
  // (`select tipo … where tipo ilike '%bitacora%'` → `bitacora_familia`, 2
  // filas). Acá decía `bitacora_familia_registrada` por simetría con sus
  // vecinos (`atencion_paseo_registrada`, `vacuna_aplicada`…), y esa simetría
  // era una SUPOSICIÓN, no un dato.
  //
  // Lo que costó, y es lo que vale registrar: un tipo que no está en el mapa
  // devuelve `undefined`, y `undefined` **no rompe nada** — el color cae a
  // `null` y la fila se dibuja SIN canto, y su chip de filtro no matchea
  // nunca. Dos defectos silenciosos de una sola letra. **Ningún typecheck lo
  // ve, porque el índice es `Record<string, …>`**: la clave inventada es un
  // string válido. Es L-192 en su forma más barata de producir y más cara de
  // encontrar.
  bitacora_familia: 'bitacora',
  atencion_paseo_registrada: 'paseos',
  atencion_grooming_registrada: 'estetica',
  atencion_adiestramiento_registrada: 'adiestramiento',
  vacuna_aplicada: 'salud',
  historia_clinica_registrada: 'salud',
};

/**
 * EL CANTO DE UNA FILA DE VIDA — DERIVADO DEL EJE, NO DE UN MAPA DE TIPOS.
 *
 * ── EL DEFECTO QUE ESTO CIERRA ──────────────────────────────────────────────
 * El color del canto salía de `FAMILIA_DE_TIPO`, que es un mapa a mano de SEIS
 * tipos. Medido contra la DB viva: hay **catorce** tipos, y el timeline sirve
 * trece (solo excluye `cita_servicio`). O sea que **siete tipos vivos caían al
 * `undefined` y se dibujaban SIN canto** — `peso_medicion` (4) ·
 * `medicacion_prescrita` (4) · `alta_asistida_pendiente_creada` (3) ·
 * `caso_clinico_abierto` (2) · `alta_asistida_completada_por_cliente` (1) ·
 * `examen_diagnostico` (1) · `hito_narrativo` (1). El founder vio uno de ellos
 * («Momento de cuidado» sin borde) y tenía razón: era la punta de siete.
 *
 * ── POR QUÉ NO SE AGREGAN SIETE FILAS AL MAPA ───────────────────────────────
 * Porque el defecto no son los siete: **es que el mapa envejece por TIPO**, y
 * los tipos los crea el motor. Agregar siete entradas deja el mismo agujero
 * abierto para el octavo, y su modo de falla es el silencio — `undefined` en un
 * `Record<string, …>` no rompe ningún typecheck, solo dibuja una fila sin canto
 * (mi propio hallazgo con `bitacora_familia`, que costó una letra).
 *
 * **El eje YA VIENE EN LA FILA**: `eventos_mascota.eje_jtbd`, que el lector
 * selecciona y `ItemTimeline` expone. Es un dato que el motor estampa al nacer
 * el evento — un tipo nuevo llega con su eje puesto y su canto sale solo. Se
 * cura la CAUSA, no los siete sitios (L-185).
 *
 * ⚠️ `FAMILIA_DE_TIPO` NO MUERE y no es duplicación: gobierna los CHIPS DE
 * FILTRO, que son categorías de PRODUCTO (paseos · estética · adiestramiento ·
 * salud · bitácora) y no ejes del expediente. Dos preguntas distintas, dos
 * mapas — lo que estaba mal era usar el de filtros para pintar.
 *
 * ⚠️ CAMBIO DE COLOR DECLARADO: la bitácora pasa de `cuidado` a `identidad`.
 * No es un ajuste al pasar: su eje es `identidad` y el propio perfil ya la
 * declara así («lo que la familia observa es del EXPEDIENTE, no de un
 * servicio»). El Home era el que discrepaba.
 */
const CAPA_DE_EJE: Record<string, 'identidad' | 'cuidado'> = {
  // El expediente: lo que la mascota ES y lo que le pasó a su cuerpo.
  salud: 'identidad',
  identidad: 'identidad',
  // Lo que alguien HACE por ella.
  cuidado_externo: 'cuidado',
  comportamiento: 'cuidado',
  // Los papeles del vínculo (altas asistidas): son de identidad — cuentan cómo
  // esta mascota entró al expediente, no un servicio prestado.
  administrativo: 'identidad',
};

/**
 * `null` = sin canto, y es una respuesta honesta: un evento sin eje (la columna
 * es nullable) no tiene de dónde sacar su capa, y **inventarle una sería peor
 * que no pintarla** — el canto significa algo. Medido hoy: cero filas vivas sin
 * eje, así que este `null` es una red, no un caso.
 */
export function capaDeHecho(ejeJtbd: string | null): 'identidad' | 'cuidado' | null {
  if (ejeJtbd === null) return null;
  return CAPA_DE_EJE[ejeJtbd] ?? null;
}
