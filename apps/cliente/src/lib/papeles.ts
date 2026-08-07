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

import type { TipoDocumento } from '@epetplace/api';
import type { IconoNombre } from '@epetplace/ui';

export interface Papel {
  tipo: TipoDocumento;
  /** Sufijo de la key i18n (`documentos.nombre<Sufijo>`) — la voz vive en
   *  el diccionario, jamás acá (Ley 3: la pieza no habla). */
  claveVoz: 'CarnetVacunas' | 'HistoriaClinica' | 'Receta' | 'FichaIdentidad';
  /** El glifo del OBJETO (el papel), jamás el del acto. */
  icono: IconoNombre;
}

/** EXHAUSTIVO POR CONSTRUCCIÓN: un tipo nuevo sin entrada = tsc rojo. */
const PAPELES: Record<TipoDocumento, Omit<Papel, 'tipo'>> = {
  carnet_vacunas: { claveVoz: 'CarnetVacunas', icono: 'carnet' },
  historia_clinica: { claveVoz: 'HistoriaClinica', icono: 'documento' },
  // S90-A (orden 5, aplicado por A con la firma del founder sobre las VOCES;
  // el tripwire de arriba sonó y esto lo apaga). LOS GLIFOS SON PROVISIONALES
  // Y SU TENSIÓN ESTÁ MEDIDA, no escondida: la lista tiene CUATRO filas y el
  // set vivo ofrece TRES dibujos viables en esta app — presupuesto ya vive en
  // hogar/index.tsx:931, bitacora en adiestramiento.tsx:215, documento ya es
  // doble (acá + cuenta/index.tsx:62). El casillero no da: falta UN glifo y
  // dibujarlo es de B (hoja de contacto pedida en el reporte S90-A orden 5).
  //   · receta → 'caso': la carpeta clínica — la receta nace de esa consulta;
  //     libre en el cliente, préstamo declarado.
  //   · ficha_identidad → 'documento': el objeto EXACTO del registry
  //     («identificación», cédula con RETRATO — y la ficha lleva foto). Que
  //     quede VECINA de historia_clinica con el mismo dibujo es Ley 12 en su
  //     forma vecina: PROVISIONAL A PROPÓSITO, la alternativa era mentir el
  //     objeto. Se resuelve cuando B entregue el glifo que falta.
  receta: { claveVoz: 'Receta', icono: 'caso' },
  ficha_identidad: { claveVoz: 'FichaIdentidad', icono: 'documento' },
};

/** La lista, en el orden del catálogo. Consumidores: el perfil de la
 *  mascota (sección desplegable) y Documentos del hogar. */
export const PAPELES_DE_MASCOTA: readonly Papel[] = (
  Object.keys(PAPELES) as TipoDocumento[]
).map((tipo) => ({ tipo, ...PAPELES[tipo] }));
