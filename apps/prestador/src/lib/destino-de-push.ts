/**
 * ¿ESTA RUTA ES DE ESTA APP? — el filtro que faltaba entre la push y el router.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **EL DEFECTO, MEDIDO EN LOS DOS LADOS, Y CADA APP LO TENÍA DISTINTO.**
 *
 * · **Cliente:** `_layout.tsx` hacía `router.push(ruta as never)` **sin ningún
 *   filtro**. Cualquier ruta interna del sobre entraba.
 * · **Prestador:** tenía UNA lista negra —descartaba `/guarderia/`— y **su
 *   propio comentario la describía como lista blanca**: *«este listener sólo
 *   navega a rutas que ESTA app tiene»*. No: navegaba a todo salvo ese prefijo.
 *
 * *Una lista negra con la descripción de una lista blanca es peor que no tener
 * ninguna: el próximo lector cree que el caso está cubierto y no lo mira.*
 *
 * ⚠️ **Y NO ALCANZA CON MIRAR EL PRIMER SEGMENTO**, que es la cura que parece
 * obvia. Medido contra el árbol de rutas de las dos apps: **`guarderia`,
 * `paseo`, `adiestramiento`, `avisos`, `invitacion` y `login` existen en LAS
 * DOS** y llevan a pantallas distintas. Por eso la lista negra del prestador
 * nombraba `/guarderia/` justamente: alguien ya se había chocado con eso.
 * ⇒ La pregunta no es «¿de qué mundo es?», es **«¿es un destino que un aviso
 * puede nombrar EN ESTA APP?»**.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── POR QUÉ SE PUEDE CERRAR HOY SIN ROMPER NADA ─────────────────────────
 * D lo midió: **`ruta` nunca se usó — 0 intenciones con la clave, sobre 352.**
 * El canal existe entero (motor → edge → parser) y **nadie puso jamás un valor
 * adentro.** ⇒ cerrar la puerta hoy **no puede regresionar un aviso que
 * funcione, porque hoy ninguno navega.** *La ventana para poner el guard es
 * justo antes del primer uso; después, cada aviso vivo es un caso que hay que
 * no romper.*
 *
 * ── SU CONDICIÓN DE CRECIMIENTO, para que no se vuelva un freno ─────────
 * **Un aviso nuevo con destino agrega su prefijo acá, en la app que lo recibe.**
 *
 * 🔴 **GUARDERÍA NO ENTRA ACÁ, Y ESTA VEZ ESTÁ MEDIDO.** `/guarderia/<estadiaId>`
 * lo emite `_guarderia_aplicar_acto` **para el cliente**: es la estadía como la
 * ve la familia. El portal tiene `/guarderia/dia` y `/guarderia/taller`, que son
 * otras pantallas — *el mismo primer segmento en las dos apps, llevando a
 * lugares distintos, que es exactamente por lo que esta lista existe y por lo
 * que mirar el primer segmento no alcanza.*
 *
 * ⚠️ La versión de este archivo en el cliente cuenta el error que casi viaja:
 * yo había dejado guardería afuera **de las dos** apoyándome en un `0` que medía
 * el EFECTO (*ninguna intención con la clave*) y lo leí como un hecho sobre la
 * CAUSA (*ningún productor la emite*). Acá el resultado es el mismo por una
 * razón distinta —esta app no es su destinataria—, y por eso la línea se queda.
 *
 * ⇒ **El día que un aviso del PORTAL lleve ruta, agrega su prefijo acá en el
 * mismo acto.** Si no, llega, no navega, y queda en el log.
 */

/**
 * Los destinos que un aviso puede nombrar EN EL PORTAL DEL PRESTADOR.
 * Fuente: `S112-D-para-C-ADDENDUM-AVISOS-Y-RUTAS` §2 (las dos del refugio, confirmadas por C contra el objeto).
 *
 * 🔴 Con barra final donde lleva id (`/adopcion/solicitud/`): el prefijo tiene
 * que exigir el separador. **Y `/adopcion` va SIN barra**, que acá es igualdad
 * exacta y no prefijo: *si fuera prefijo, `/adopcion` cubriría a
 * `/adopcion/solicitud/` y la lista entera se volvería una sola línea que
 * acepta todo lo que empiece igual.*
 */
export const DESTINOS_DE_PUSH: readonly string[] = [
  '/adopcion/solicitud/',
  '/adopcion',
];

/**
 * `null` = no es de esta app (o no es un destino de aviso) ⇒ **no se navega**.
 * El llamador loguea el descarte: un aviso que no lleva a ningún lado es legal;
 * uno que lleva a una pantalla que no existe, no.
 */
export function destinoDePushDeEstaApp(ruta: string): string | null {
  return DESTINOS_DE_PUSH.some((p) => (p.endsWith('/') ? ruta.startsWith(p) : ruta === p))
    ? ruta
    : null;
}
