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
 * 🔴 **ESTA NOTA DECÍA QUE GUARDERÍA QUEDABA AFUERA, Y ERA UN DEFECTO REAL QUE
 * CASI VIAJA.** Decía: *«`/guarderia/<estadiaId>` es ruta viva y sin embargo no
 * está acá, porque ningún aviso de guardería emite `ruta`»*. **Falso.**
 * `_guarderia_aplicar_acto` emite esa ruta **en código vivo**, y su productor es
 * anterior a los de adopción. Antes de este archivo el cliente navegaba a
 * cualquier ruta, así que ese aviso habría funcionado; **con mi lista sin el
 * prefijo, habría dejado de funcionar el día que alguien lo tocara** — una
 * regresión que sólo se descubre tocando una push.
 *
 * ⚠️ **Y el error de razonamiento importa más que el prefijo que faltaba, porque
 * es reusable:** el número que lo produjo (`0 intenciones con la clave `ruta`,
 * sobre 352`) es una medición del EFECTO, y se leyó como un hecho sobre la
 * CAUSA. *«Ningún productor CORRIÓ y emitió una» no es «ningún productor emite
 * una».* Un censo de productores se hace sobre los PRODUCTORES. El de verdad,
 * hecho después por D con dos controles (`_voz_notificacion` excluido a mano por
 * mencionar rutas sin emitirlas · cero escritores de `notificacion_intencion`
 * fuera del motor ⇒ el censo CIERRA, no acota), da exactamente dos: guardería y
 * los cinco de adopción.
 *
 * ⚠️ **EL RESIDUO QUE ESTE PREFIJO NO CIERRA, declarado en vez de disimulado:**
 * `/guarderia/` acepta también `/guarderia/dia` y `/guarderia/taller`, que son
 * **pantallas del PORTAL**. Hoy no llegan —ningún aviso del portal lleva ruta— y
 * el único productor de este prefijo emite un uuid de estadía. *No se cierra con
 * una lista negra adentro de la lista blanca ni adivinando la forma de un uuid:
 * si esas rutas llegaran al cliente, el defecto sería del motor mandándole un
 * aviso a quien no es su destinatario, y ese guard no vive acá.* Se declara para
 * que quien lo encuentre sepa que se miró y se decidió, no que se pasó por alto.
 *
 * ⇒ **El día que un vertical nuevo le ponga `ruta` a un aviso, agrega su prefijo
 * acá en el mismo acto.** Si no, el aviso llega, no navega, y queda en el log —
 * que es cómo se descubre en una tarde y no en un reporte de campo.
 */

/**
 * Los destinos que un aviso puede nombrar EN EL CLIENTE.
 * Fuente: `S112-D-para-C-ADDENDUM-AVISOS-Y-RUTAS` §2 (los cinco del vertical).
 *
 * 🔴 Con barra final donde lleva id (`/adoptar/solicitud/`): el prefijo tiene
 * que exigir el separador. *Sin la barra, `/adoptar/solicitudes` entraría por
 * la puerta de `/adoptar/solicitud` — y son dos pantallas distintas.*
 */
export const DESTINOS_DE_PUSH: readonly string[] = [
  /* GUARDERÍA — su productor es ANTERIOR a los de adopción y está vivo:
     `_guarderia_aplicar_acto` emite `'/guarderia/' || p_estadia_id` en el cuerpo
     de la función, no en un comentario (D lo verificó con `L-170` en la mano).
     Su nota decía *«se deja la ruta AQUÍ para que el día que la app monte su
     listener no haya que tocar el motor»* — **ese día es hoy.** */
  '/guarderia/',
  /* ADOPCIÓN — `S112-D-para-C-ADDENDUM-AVISOS-Y-RUTAS` §2. */
  '/adoptar/solicitud/',
  '/adoptar/solicitudes',
  '/hogar/mascota/',
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
