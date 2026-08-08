/**
 * LOS PAPELES DE LA FAMILIA — el catálogo DERIVADO (S89-D orden 7).
 *
 * La letra firmada dice: «los documentos crecen (receta, certificados
 * vienen): la lista se deriva del catálogo de papeles, JAMÁS a mano».
 *
 * ⚠️ EL CATÁLOGO DE MOTOR NO EXISTE — medido contra la DB viva
 * (6-ago-2026): no hay `cat_documentos_mascota`; `cat_tipos_documento_titular`
 * es OTRA COSA (CEDULA · PASAPORTE · RUC, identidad del titular) y
 * `prestador_documentos`/`criadero_documentos`/`seller_documentos` son de
 * otros actores. El vocabulario de papeles vive HOY en un CHECK de
 * `documento_token` (`carnet_vacunas` · `historia_clinica`) y, del lado
 * TS, en el union `TipoDocumento` del contrato de A.
 *
 * ⇒ **La derivación posible hoy es POR TIPO, y se hace EXHAUSTIVA a
 * propósito:** el `Record<TipoDocumento, …>` obliga al compilador a
 * exigir una entrada por cada tipo del contrato. **El día que A sume
 * `receta` al union, ESTE ARCHIVO ROMPE EL TYPECHECK** hasta que el
 * papel nuevo tenga su voz y su glifo — que es exactamente lo que «jamás
 * a mano» tiene que garantizar: no que nadie escriba, sino que **nadie
 * pueda olvidarse**. Una lista suelta habría callado.
 *
 * Su rojo está PRODUCIDO (par de esta orden, brazo 1): con un tipo
 * agregado al union, `tsc` falla nombrando este archivo.
 */

// S90 (merge de D, resolución de A declarada): la lista deriva del subtipo
// EXPEDIENTE — los papeles POR ACTO (certificado_salud) no entran acá como
// fila: hay N por mascota y su descarga nombra UN acto (letra de D en el
// wrapper). El tripwire exhaustivo sigue vivo, ahora sobre el subtipo.
import type { TipoDocumentoExpediente } from '@epetplace/api';
import type { IconoNombre } from '@epetplace/ui';

export interface Papel {
  tipo: TipoDocumentoExpediente;
  /** Sufijo de la key i18n (`documentos.nombre<Sufijo>`) — la voz vive en
   *  el diccionario, jamás acá (Ley 3: la pieza no habla). */
  claveVoz: 'CarnetVacunas' | 'HistoriaClinica' | 'Receta' | 'FichaIdentidad';
  /** El glifo del OBJETO (el papel), jamás el del acto. */
  icono: IconoNombre;
}

/** EXHAUSTIVO POR CONSTRUCCIÓN: un tipo nuevo sin entrada = tsc rojo. */
const PAPELES: Record<TipoDocumentoExpediente, Omit<Papel, 'tipo'>> = {
  carnet_vacunas: { claveVoz: 'CarnetVacunas', icono: 'carnet' },
  historia_clinica: { claveVoz: 'HistoriaClinica', icono: 'documento' },
  // ✅ S91-C — EL PRÉSTAMO DE LA RECETA SE RETIRA (firma del founder,
  // 7-ago-2026: «GLIFO RECETA FIRMADO — el préstamo receta→'caso' se
  // retira»; pedido literal de A en
  // `docs/relevamientos/2026-08-07-s91a-FIRMAS-DE-MESA.md` §②).
  // La receta tiene su DIBUJO PROPIO: la cápsula que B construyó en S90-B,
  // ya viva en el registry. El riesgo que B declaró sin disimular —«puede
  // leerse *medicación* antes que *receta*»— era justo lo que el gate a
  // 21px tenía que mirar, y lo miró: por eso hay firma y no supuesto.
  // `'caso'` NO queda huérfano (Ley 37 no dispara): medido, sigue con tres
  // consumidores propios en `apps/prestador`.
  //
  // ⚠️ LA TENSIÓN QUE **NO** CIERRA CON ESTA FIRMA, con su cuenta RE-MEDIDA
  // contra el objeto (la anterior decía «documento ya es doble» y estaba
  // corta): CUATRO filas, TRES dibujos distintos — `documento` hace triple
  // turno (`historia_clinica` acá · `ficha_identidad` acá ·
  // `cuenta/index.tsx:62`, la entrada a Documentos del hogar). Retirar este
  // préstamo deja **UNO** vivo, no cero:
  //   · ficha_identidad → 'documento': el objeto EXACTO del registry
  //     («identificación», cédula con RETRATO — y la ficha lleva foto). Que
  //     quede VECINA de historia_clinica con el mismo dibujo es Ley 12 en su
  //     forma vecina: PROVISIONAL A PROPÓSITO, la alternativa era mentir el
  //     objeto. Se resuelve cuando B entregue el glifo que falta.
  receta: { claveVoz: 'Receta', icono: 'receta' },
  ficha_identidad: { claveVoz: 'FichaIdentidad', icono: 'documento' },
};

/** El RESPALDO de tiempo de compilación, en el orden del Record. Se usa
 *  mientras el catálogo vivo no llegó (carga) o no pudo llegar (sin red):
 *  a la fecha del build dice lo mismo que el catálogo — no es una mentira,
 *  es la foto de compilación, y se declara. */
export const PAPELES_DE_MASCOTA: readonly Papel[] = (
  Object.keys(PAPELES) as TipoDocumentoExpediente[]
).map((tipo) => ({ tipo, ...PAPELES[tipo] }));

/** S90 (firma founder): LA LISTA DERIVA DEL CATÁLOGO VIVO
 *  (`cat_documentos_mascota`, vía `listarPapelesDeMascota`) — qué papeles y
 *  en qué orden lo dice el MOTOR; la voz y el glifo los pone este archivo
 *  (Ley 3: la voz vive en la casa). Un código del catálogo que este bundle
 *  no conoce se SALTEA (un bundle viejo no puede inventarle voz ni glifo a
 *  un papel nuevo — D-662: el papel aparece con el OTA que lo conoce); los
 *  papeles POR ACTO (certificado) no entran: son N emisiones por mascota y
 *  un botón por tipo no sirve para seis emisiones (letra de D).
 *
 *  ⚠️ NOTA FIRMADA DEL DESTINO (founder, 7-ago-2026): esta lista PLANA va a
 *  MUTAR A AGRUPADA POR CATEGORÍA — D-683 lo ata al PAPEL NÚMERO OCHO. El
 *  catálogo HOY no tiene columna de categoría (medido S90: codigo · voz ·
 *  funcion_edge · requiere_ref · activo · orden · created_at): la columna
 *  nace con el agrupador, jamás antes — agrupar sin ella es inventar
 *  categorías. Quien llegue acá el día 8: la costura es este mismo punto
 *  (componerPapeles ya recibe el catálogo entero; agrupar es un groupBy
 *  sobre la columna nueva, no una re-arquitectura). */
export function componerPapeles(
  catalogo: ReadonlyArray<{ codigo: string; orden: number }> | null,
): readonly Papel[] {
  if (catalogo === null) return PAPELES_DE_MASCOTA;
  const lista: Papel[] = [];
  for (const fila of [...catalogo].sort((a, b) => a.orden - b.orden)) {
    const entrada = (PAPELES as Record<string, Omit<Papel, 'tipo'> | undefined>)[fila.codigo];
    if (!entrada) continue; // acto (certificado) o papel que este bundle no conoce
    lista.push({ tipo: fila.codigo as TipoDocumentoExpediente, ...entrada });
  }
  // Un catálogo vacío o sin intersección no borra los papeles del bundle:
  // el respaldo de compilación es más verdadero que una lista vacía.
  return lista.length > 0 ? lista : PAPELES_DE_MASCOTA;
}
