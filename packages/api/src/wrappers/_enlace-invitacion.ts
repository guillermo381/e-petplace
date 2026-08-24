/**
 * EL FRENO DEL ENLACE DE INVITACIÓN — una sola verdad, no una disciplina.
 *
 * ── POR QUÉ EXISTE (freno de mesa, founder 24-ago-2026) ──────────────────
 * **Las dos páginas del enlace NO EXISTEN.** Medido con control positivo y
 * negativo el 24-ago: `/` · `/legales` · `/terminos` dan **200**;
 * `/invitacion?token=` y `/baja?t=` dan **404**, igual que una ruta inventada.
 *
 * **Y no afecta una vía sino las dos**, que es lo que lo vuelve freno de mesa y
 * no de llave: el correo lo frena `INVITACION_CORREO_VIVO`, pero **el enlace
 * copiable no depende de ninguna llave — sale en cuanto alguien toca
 * «invitar»**. *Copiar al portapapeles una URL que da 404 es peor que no tener
 * el botón: quien invita lo manda por WhatsApp y se entera del error por la
 * cara de la otra persona.*
 *
 * ── POR QUÉ ES UNA CONSTANTE COMPARTIDA Y NO UNA NOTA A LA PANTALLA ──────
 * El freno vive **en el paquete que las dos apps consumen**, para que apagarlo
 * y encenderlo sea **un solo acto medible** y no un acuerdo que hay que
 * recordar en cada superficie nueva. *Un freno que depende de que alguien se
 * acuerde no es un freno: es una intención.*
 *
 * ☠️ **CÓMO SE ENCIENDE, y la condición es un número, no una declaración:**
 * cuando `https://www.epetplace.com/invitacion?token=…` **y** `/baja?t=…`
 * devuelvan **200 medidos con control positivo** (hoy el sitio contesta 404 a
 * todo lo que no existe, así que **un 200 es prueba y un 404 no distingue
 * «no la hicieron» de «la hicieron en otro lado»**). Se cambia acá, en un
 * lugar, y viaja por OTA.
 */
/* ✅ ENCENDIDO el 24-ago-2026, cumpliendo la condición que esta misma constante
   exigía: **200 medido con control positivo**, no declarado.
   Verificado por A contra producción, después de que C desplegara:
     /invitacion?token=  → 200   (era 404 antes del deploy ⇒ el 200 PRUEBA que
                                  la página es nueva; no hay falso verde posible
                                  sobre una ruta que no existía)
     /baja?t=            → 200
     /legales            → 200   ← control positivo
     /ruta-inventada     → 404   ← control negativo: acá 404 sigue significando
                                   «no existe», así que el 200 discrimina
   Y el HTML desplegado trae lo FUNCIONAL, no una cáscara: `/baja` incluye la
   llamada a `functions/v1/baja-correo` y `/invitacion` el esquema
   `cliente://invitacion`. Las dos con `noindex`.

   ⚠️ ESTO ENCIENDE EL ENLACE, NO EL CORREO. El correo a quien no tiene cuenta
   sigue frenado por `INVITACION_CORREO_VIVO`, que es llave del founder y
   decisión aparte. */
export const ENLACE_INVITACION_HABILITADO = true;

/** La base del enlace. `www` directo: el apex responde 308 y —medido— preserva
 *  el query string, pero cada salto en un correo frío es una oportunidad de que
 *  un escáner corporativo lo trate distinto. */
export const APP_BASE_URL =
  process.env.EXPO_PUBLIC_APP_BASE_URL ?? 'https://www.epetplace.com';

/** La ruta la nombró C y se lee de la pantalla que la consume, no de un
 *  mensaje: la invitación usa `?token=`, la baja usa `?t=`. */
export function urlInvitacion(token: string): string | null {
  if (!ENLACE_INVITACION_HABILITADO) return null;
  return `${APP_BASE_URL}/invitacion?token=${encodeURIComponent(token)}`;
}
