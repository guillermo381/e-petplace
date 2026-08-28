/**
 * S101-B · ABRIR EL ALTA DE TARJETA.
 *
 * 🔴 EMBEBIDA, y el porqué está medido en el aparato (firma del founder,
 *    19-ago): con `expo-web-browser` el retorno viajaba por `cliente://…` y
 *    **falló DOS veces en el teléfono del founder** — «página no encontrada»
 *    al volver. *Un mecanismo cuyo último tramo depende de que el sistema
 *    operativo resuelva un esquema es un mecanismo con una puerta que no
 *    controlamos.* Embebido, el retorno no sale de la app.
 *
 *    Costo asumido y declarado: `react-native-webview` es **dependencia
 *    nativa** ⇒ version bump y **build nueva** (L-134). Se paga a propósito.
 *
 * 🔴 LO QUE NO CAMBIA: el handle lo emite el servidor, y **el desenlace se lee
 *    del servidor**. La pantalla del WebView es el contenedor; la verdad sigue
 *    estando en la fila del alta.
 */

import { router, type Href } from 'expo-router';
import { crearAltaTarjeta } from '@epetplace/api';

/** Dónde vive la página del alta. Sale de la config, no de acá. */
const BASE = process.env.EXPO_PUBLIC_PAGOS_ALTA_URL ?? '';

export type AperturaAlta =
  | { ok: true; altaId: string }
  | { ok: false; motivo: string };

/**
 * Emite el handle y abre la pantalla embebida.
 *
 * **No devuelve el desenlace**, y es a propósito: el desenlace lo resuelve la
 * pantalla releyendo el servidor cuando la vista se cierra —por mensaje de la
 * página o porque la persona salió—. *Devolverlo acá obligaría a esta función
 * a esperar un evento que puede no llegar nunca, que es exactamente el cuelgue
 * que esta sesión ya pagó una vez.*
 */
export async function abrirAltaDeTarjeta(): Promise<AperturaAlta> {
  if (!BASE) return { ok: false, motivo: 'sin_url_configurada' };

  const alta = await crearAltaTarjeta('nuvei');
  if (!alta.ok) return { ok: false, motivo: alta.codigo };

  /* ⚠️ El cast existe porque los tipos de ruta de expo-router son GENERADOS
     (`.expo/types/router.d.ts`) y esta pantalla es nueva: el union todavía no
     la conoce. Se regenera al correr metro/build. *Se declara para que nadie
     lo copie creyendo que los `Href` se castean por costumbre.* */
  /* 🔴 S107 · PIEZA ② DE `D-921` — EL UID ESTABLE VIAJA EN LA URL.
     Antes iba SOLO `alta`, y la pagina tokenizaba con el id del alta ⇒ **Nuvei
     veia una persona distinta por cada alta** (probado desde SU base el 27-ago:
     `user.id = f7a7001e...`, que es un id de alta). Y despues de curar el
     escritor, el cobro rebotaba con `uid does not match`: nosotros guardabamos
     el uid estable y el proveedor conocia la tarjeta por el del alta.
     El wrapper ya EXIGE el uid (no lo tolera ausente), asi que aca siempre hay. */
  router.push(
    `/pagos/alta-tarjeta?alta=${encodeURIComponent(alta.data.altaId)}` +
      `&uid=${encodeURIComponent(alta.data.uid)}` as Href,
  );
  return { ok: true, altaId: alta.data.altaId };
}
