/**
 * S101-B · ABRIR EL ALTA DE TARJETA Y VOLVER.
 *
 * 🔴 POR QUÉ `expo-web-browser` Y NO UN WebView EMBEBIDO — dos razones, y la
 *    segunda no es de costo:
 *
 *    ① `react-native-webview` NO está instalado en el monorepo (medido,
 *       S101-B Fase 1) ⇒ sería dep nativa nueva y **build nativa** con todo
 *       su tren de distribución. `expo-web-browser` entró en el scaffold del
 *       5-jul ⇒ **está horneado en el binario vigente**: cero build.
 *
 *    ② El navegador del sistema le muestra a la familia **la URL real** del
 *       formulario donde va a tipear su tarjeta. Un WebView embebido no.
 *       *Para la única pantalla del producto donde se escribe un número de
 *       tarjeta, que se pueda ver de quién es el dominio no es un detalle de
 *       implementación.*
 *
 * ⚠️ `expo-web-browser` está instalado desde el scaffold y **nunca se
 *    ejercitó** (cero consumidores en 45 días). Este es su primer uso: el
 *    ensayo en dispositivo **es el gate del mecanismo entero**, y si el
 *    retorno no cierra limpio se frena y se escala — pasar al WebView
 *    embebido es build nativa, y esa decisión no es de la pista.
 */

import * as WebBrowser from 'expo-web-browser';
import { crearAltaTarjeta, obtenerAltaTarjeta, type EstadoAlta } from '@epetplace/api';

/** Dónde vive la página del alta. Sale de la config de la app, no de acá. */
const BASE = process.env.EXPO_PUBLIC_PAGOS_ALTA_URL ?? '';

/** El esquema propio al que el navegador devuelve el control. */
const VOLVER = 'cliente://pagos/alta';

export type ResultadoAlta =
  | { estado: EstadoAlta; altaId: string }
  | { estado: 'no_se_pudo_abrir'; motivo: string };

/**
 * Abre el alta, espera a que el navegador vuelva, y **confirma contra el
 * servidor**.
 *
 * 🔴 EL RETORNO DEL NAVEGADOR NO DECIDE NADA. Ni el `?desenlace=` de la URL,
 *    ni el `type` que devuelve `openAuthSessionAsync`. Los dos son PISTAS.
 *    El hecho lo tiene la fila del alta, y por eso siempre se relee.
 *
 *    *Deducir el desenlace del retorno confundiría tres cosas distintas: que
 *    la familia cerró la ventana, que el navegador falló, y que el alta de
 *    verdad venció. Solo la fila que expiró es un hecho* (enmienda de mesa,
 *    19-ago).
 */
export async function abrirAltaDeTarjeta(): Promise<ResultadoAlta> {
  if (!BASE) {
    return { estado: 'no_se_pudo_abrir', motivo: 'sin_url_configurada' };
  }

  // ① El handle nace en el servidor, atado a la sesión. La app no lo inventa.
  const alta = await crearAltaTarjeta('nuvei');
  if (!alta.ok) return { estado: 'no_se_pudo_abrir', motivo: alta.codigo };

  const url =
    `${BASE}?alta=${encodeURIComponent(alta.data.altaId)}` +
    `&volver=${encodeURIComponent(VOLVER)}`;

  // ② El navegador del sistema. `openAuthSessionAsync` vuelve solo cuando la
  //    página redirige a nuestro esquema **o** cuando la persona lo cierra —
  //    y los dos casos se tratan igual: releyendo el servidor.
  try {
    await WebBrowser.openAuthSessionAsync(url, VOLVER);
  } catch (e) {
    // Que el navegador no abra NO cancela el alta: la fila sigue viva hasta
    // su TTL, y si la persona no vuelve, vencerá como `abandonada`. Se
    // devuelve el alta igual para poder releerla.
    return { estado: 'no_se_pudo_abrir', motivo: String(e) };
  }

  // ③ 🔴 LA FUENTE DE VERDAD. Siempre, en todos los caminos.
  const leida = await obtenerAltaTarjeta(alta.data.altaId);
  if (!leida.ok) return { estado: 'no_se_pudo_abrir', motivo: leida.codigo };

  return { estado: leida.data.estado, altaId: leida.data.altaId };
}
