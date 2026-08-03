/**
 * LOS PAÍSES DE LA APP DEL PRESTADOR (S84-C33) — UNA lista, dos usos.
 *
 * ☠️ NACE POR MUDANZA, NO POR INVENCIÓN. Los 23 vivían como `const` local
 * dentro de `cuenta/perfil.tsx`, y la pantalla de documentos necesitaba
 * exactamente la misma lista para preguntar **qué país emitió** el
 * documento. Copiarla habría sido el clon de 23 filas que L-175 persigue
 * —y el peor tipo: el día que se agregue un país, uno de los dos
 * selectores queda viejo y nadie se entera—. Se mueve y los dos la
 * consumen.
 *
 * ⚠️ POR QUÉ NO SALE DE `obtenerPaisesParaRegistro()`, que es la pregunta
 * obvia y tiene respuesta MEDIDA: ese lector filtra `.eq('activo', true)`
 * —los países habilitados para ABRIR una cuenta comercial, hoy solo EC—
 * y **el país que EMITIÓ un documento no tiene por qué ser uno de ésos**.
 * El caso canónico es el que P21 ya nombró: *un profesional colombiano
 * operando en Quito tiene documento colombiano*. Con el lector de
 * registro, ese caso real sería IMPOSIBLE de declarar. La lista de
 * emisores es más ancha que la de operación, y por eso son dos cosas.
 *
 * `pre` y `formato` son del teléfono y no le sirven a documentos; se
 * conservan acá porque son de la misma fila y partirla en dos tablas por
 * consumidor sería el mismo error al revés.
 */

export type Pais = { iso: string; nombre: string; pre: string; formato?: string };

/* `formato` sale de `formato_telefono` de `cat_paises`, MEDIDO contra el
   proyecto vivo: **9 de 23 lo declaran, 14 no.** Los nueve validan de
   verdad; los catorce se eligen y lo DICEN — *"el que no lo tenga
   declarado, no valida (no inventes uno)"*. Inventar una regex por país
   sería exactamente el dato inventado de L-180: números plausibles,
   typecheck verde, el significado mal.

   ⚠️ COLOMBIA VALIDA — es el caso del founder, y no queda exento. */
export const PAISES: Pais[] = [
  { iso: 'AR', nombre: 'Argentina', pre: '+54', formato: '^\\+54\\d{10,11}$' },
  { iso: 'BO', nombre: 'Bolivia', pre: '+591' },
  { iso: 'BR', nombre: 'Brasil', pre: '+55' },
  { iso: 'CA', nombre: 'Canadá', pre: '+1', formato: '^\\+1\\d{10}$' },
  { iso: 'CL', nombre: 'Chile', pre: '+56', formato: '^\\+56\\d{9}$' },
  { iso: 'CO', nombre: 'Colombia', pre: '+57', formato: '^\\+57\\d{7,10}$' },
  { iso: 'CR', nombre: 'Costa Rica', pre: '+506' },
  { iso: 'CU', nombre: 'Cuba', pre: '+53' },
  { iso: 'DO', nombre: 'República Dominicana', pre: '+1' },
  { iso: 'EC', nombre: 'Ecuador', pre: '+593', formato: '^\\+593\\d{8,9}$' },
  { iso: 'ES', nombre: 'España', pre: '+34', formato: '^\\+34\\d{9}$' },
  { iso: 'GT', nombre: 'Guatemala', pre: '+502' },
  { iso: 'HN', nombre: 'Honduras', pre: '+504' },
  { iso: 'MX', nombre: 'México', pre: '+52', formato: '^\\+52\\d{10}$' },
  { iso: 'NI', nombre: 'Nicaragua', pre: '+505' },
  { iso: 'PA', nombre: 'Panamá', pre: '+507' },
  { iso: 'PE', nombre: 'Perú', pre: '+51', formato: '^\\+51\\d{9}$' },
  { iso: 'PR', nombre: 'Puerto Rico', pre: '+1' },
  { iso: 'PY', nombre: 'Paraguay', pre: '+595' },
  { iso: 'SV', nombre: 'El Salvador', pre: '+503' },
  { iso: 'US', nombre: 'Estados Unidos', pre: '+1', formato: '^\\+1\\d{10}$' },
  { iso: 'UY', nombre: 'Uruguay', pre: '+598' },
  { iso: 'VE', nombre: 'Venezuela', pre: '+58' },
];

/** El default del selector de TELÉFONO — el país donde opera la mayoría.
 *  NO es un techo: cualquiera de los 23 se elige.
 *  ⚠️ **Documentos NO lo usa**, y es a propósito: ahí el país se DECLARA
 *  y arrancar preseleccionado sería declarar por el prestador (P21 · el
 *  mismo patrón del radio de la sede, que arranca sin declarar). */
export const PAIS_DEFAULT = 'EC';

/** La bandera sale del `codigo_iso2` — cada letra a su indicador
 *  regional (FIRMADA S83-C10; el Android del founder las dibuja). */
export const bandera = (iso: string): string =>
  String.fromCodePoint(...[...iso].map((c) => (c.codePointAt(0) ?? 0) + 127397));

/** El nombre humano del país, o su ISO si no está en la lista — un país
 *  guardado que no reconocemos se DICE por su código en vez de
 *  desaparecer (Ley 13: el dato existe, la voz lo admite). */
export const nombrePais = (iso: string): string =>
  PAISES.find((p) => p.iso === iso)?.nombre ?? iso;
