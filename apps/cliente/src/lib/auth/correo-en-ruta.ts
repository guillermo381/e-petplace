/**
 * EL CORREO QUE VIAJA POR LA RUTA — 05 ⇄ 05b.
 *
 * 🔴 POR QUÉ EXISTE, y es un defecto MEDIDO, no una precaución: un correo con
 * `+` —`ana+casa@correo.com`, la forma que usa media internet para etiquetar su
 * bandeja— llegaba a 05b como `ana casa@correo.com`. En una query string el `+`
 * SIGNIFICA espacio, así que el decodificador hace exactamente su trabajo y el
 * dato llega roto. Visto en el aparato el 13-sep-2026: la pantalla decía
 * «Te enviamos un enlace a …» con una dirección **que no es a la que se envió**.
 *
 * Es la clase que no tiene síntoma: no falla, no lanza, no rompe el tipo — pinta
 * una dirección verosímil y equivocada, y la persona la lee como un hecho.
 *
 * LA CURA VIVE EN UN SOLO LUGAR a propósito: son TRES saltos (05→05b, 05b→05, y
 * el reenvío), y una regla que hay que acordarse de aplicar en tres lugares es
 * una que alguien va a olvidar en el cuarto.
 */

/** Del dato a la ruta: `+` deja de ser un carácter de la query. */
export function correoARuta(email: string): string {
  return encodeURIComponent(email);
}

/**
 * De la ruta al dato. Se decodifica UNA vez sobre lo que el router ya entregó:
 * un correo normal no tiene secuencias `%`, así que esto es un no-op para él;
 * el que traía `+` vuelve entero. Si el valor viniera mal formado
 * (`decodeURIComponent` lanza con un `%` suelto) se devuelve tal cual: una
 * dirección cruda es mejor que una pantalla caída.
 */
export function correoDeRuta(valor: unknown): string {
  if (typeof valor !== 'string') return '';
  try {
    return decodeURIComponent(valor);
  } catch {
    return valor;
  }
}
