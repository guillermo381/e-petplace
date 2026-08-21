/**
 * S101-C · EL LOGO DE FRANQUICIA — la marca de la tarjeta, a la izquierda de
 * su fila (orden del founder ④).
 *
 * ═══ 🔴 LO QUE ESTA PIEZA **NO** TIENE, dicho antes que nada ════════════════
 *
 * **No hay assets oficiales de franquicia en el repo.** Se midió: cero
 * archivos de marca de Visa / Mastercard / Diners / Amex / Discover, y el
 * registry de `Icono` tiene 45 glifos, **ninguno de ellos una franquicia**.
 *
 * La orden dice: *«activos estándar de franquicia (set consistente), **fallback
 * a texto si la marca no tiene ícono conocido — jamás un hueco**»*. Hoy
 * **ninguna** tiene ícono conocido en la casa ⇒ **por la propia regla de la
 * orden, todas caen al fallback de texto.** *Dibujar a mano un logo de
 * franquicia sería peor que el texto por dos motivos a la vez: es artwork con
 * dueño, y a 28 px un logo mal redibujado se lee como error, no como marca.*
 *
 * ⇒ **Lo que sí garantiza esta pieza es el SET CONSISTENTE**: misma caja,
 *   mismo radio, mismo aire, misma tipografía para las cinco y para la
 *   desconocida. **Lo único que cambia adentro es el texto.**
 *   *El día que los assets se depositen, cambia el interior de esta caja y
 *   nada más — ni la fila, ni la hoja, ni el alto de nada.*
 *
 * 🔴 **JAMÁS UN HUECO**, y está hecho imposible: sin `marca`, la caja dibuja
 *    el glifo `pagos` de la casa. *No existe la rama que devuelve `null`.*
 */

import { View } from 'react-native';
import { Icono, Texto, radius, useTheme } from '@epetplace/ui';

/** Los códigos que devuelve el proveedor → el nombre corto que se dibuja.
 *  **Corto a propósito**: en 40 px de ancho, «American Express» no entra y
 *  «AMEX» sí — y es como la llama la gente. */
const NOMBRE_CORTO: Record<string, string> = {
  vi: 'VISA',
  mc: 'MC',
  di: 'DINERS',
  ax: 'AMEX',
  dc: 'DISC',
};

/* 🔴 EL ANCHO SALE DE LA PALABRA MÁS LARGA, MEDIDO EN EL APARATO — no de un
   número redondo. Con 44 px, «DINERS» **envolvía a dos líneas y el recuadro
   quedaba partido** («DINER / S»).
   *Un recuadro roto ES el hueco que la orden prohíbe: no importa que haya
   contenido si lo que se ve es un accidente.*
   Con 56 px entran las seis letras del nombre más largo del set, y el
   `numberOfLines={1}` garantiza que **ninguna marca futura pueda volver a
   partirlo** — si no entra, trunca; jamás envuelve. */
export const ANCHO_LOGO = 56;
const ALTO_LOGO = 32;

export function LogoFranquicia({ marca }: { marca: string | null }) {
  const { theme } = useTheme();
  const codigo = marca?.toLowerCase() ?? '';
  /* Una marca que el proveedor manda y no conocemos **se dibuja igual**, con
     su propio código en mayúsculas. *Es más honesto que un genérico: dice
     exactamente lo que sabemos.* */
  const texto = NOMBRE_CORTO[codigo] ?? (marca ? marca.toUpperCase().slice(0, 6) : null);

  return (
    <View
      style={{
        width: ANCHO_LOGO,
        height: ALTO_LOGO,
        borderRadius: radius.xs,
        backgroundColor: theme.bg.hundido,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {texto ? (
        <Texto variante="dato" numberOfLines={1}>{texto}</Texto>
      ) : (
        /* Sin marca: el glifo de pagos de la casa. **La rama vacía no existe.** */
        <Icono nombre="pagos" tamano={18} />
      )}
    </View>
  );
}
