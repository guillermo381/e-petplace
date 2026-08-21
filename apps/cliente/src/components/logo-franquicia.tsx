/**
 * S101-C · EL LOGO DE FRANQUICIA — la marca de la tarjeta, a la izquierda de
 * su fila (orden del founder ④).
 *
 * ═══ ✅ S101-D · LOS ASSETS LLEGARON, Y CAMBIÓ EL INTERIOR DE LA CAJA ═══════
 *
 * **La promesa de esta pieza se cumplió al pie.** Decía: *«el día que los
 * assets se depositen, cambia el interior de esta caja y nada más — ni la fila,
 * ni la hoja, ni el alto de nada»*. **Eso es exactamente lo que pasó:**
 * `ANCHO_LOGO`, `ALTO_LOGO`, el radio, el fondo y el fallback **siguen
 * idénticos**; lo único nuevo es qué se dibuja adentro cuando la marca tiene
 * archivo.
 *
 * **De dónde salieron:** de la doc de Nuvei (sección *Card Brands*), vendored en
 * `assets/marcas/` con su `PROCEDENCIA.md` — fuente, URLs y fecha. **Jamás
 * hotlink**: un CDN ajeno puede cambiar un archivo sin avisarnos, y pedirle la
 * imagen en cada fila le contaría a un tercero cuándo abre la app cada familia.
 *
 * 🔴 **NO SE REDIBUJÓ NINGUNA A MANO** (orden de mesa). Son marcas registradas:
 * el `.svg` del proveedor es la fuente de verdad y Metro lo compila
 * (`metro.config.js` + `react-native-svg-transformer`, S101-D). *Un logo
 * redibujado a ojo se lee como error, no como marca.*
 *
 * ⇒ **El SET CONSISTENTE sigue siendo lo que esta pieza garantiza**: misma
 *   caja, mismo radio, mismo aire para las cinco, para la desconocida y para la
 *   ausente. **Lo que cambia adentro es el contenido, jamás la caja.**
 *
 * 🔴 **EL FALLBACK DE TEXTO NO SE TOCÓ Y SIGUE SIENDO LEY** (firma vigente):
 *    toda marca **sin archivo** —hoy las 19 restantes del catálogo del
 *    proveedor— dibuja su nombre corto exactamente como antes.
 *
 * 🔴 **JAMÁS UN HUECO**, y está hecho imposible: sin `marca`, la caja dibuja
 *    el glifo `pagos` de la casa. *No existe la rama que devuelve `null`.*
 */

import { View } from 'react-native';
import { Icono, Texto, radius, useTheme } from '@epetplace/ui';

import Visa from '../../assets/marcas/ic_visa.svg';
import Mastercard from '../../assets/marcas/ic_mastercard.svg';
import Diners from '../../assets/marcas/ic_diners.svg';
import Amex from '../../assets/marcas/ic_amex.svg';
import Discover from '../../assets/marcas/ic_discover.svg';

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

/* 🔴 EL ARCHIVO Y SU RELACIÓN DE ASPECTO, MEDIDOS DEL `viewBox` DE CADA SVG —
   no supuestos, y **no son iguales entre sí**: Visa viene `56×18`, Mastercard
   `56×37`, y Amex/Diners/Discover `32×21`.
   *Pasarles un `width` y un `height` fijos a los cinco estiraría tres marcas
   registradas: la deformación no daría error, se vería «casi bien».*
   ⇒ Cada uno se escala **conteniendo**, con la caja como techo. Es el mismo
   principio del `contentFit: contain` de `LogoNegocio`: **un logo estirado a
   sangre grita «acá falló algo»**. */
const ARCHIVOS: Record<string, { Svg: React.FC<{ width: number; height: number }>; w: number; h: number }> = {
  vi: { Svg: Visa, w: 56, h: 18 },
  mc: { Svg: Mastercard, w: 56, h: 37 },
  di: { Svg: Diners, w: 32, h: 21 },
  ax: { Svg: Amex, w: 32, h: 21 },
  dc: { Svg: Discover, w: 32, h: 21 },
};

/* El aire interno es del CONTENIDO, no de la caja: la caja sigue midiendo
   56×32 exactos, y el logo vive adentro sin tocar los bordes. */
const CONTENIDO_ANCHO = 44;
const CONTENIDO_ALTO = 22;

export function LogoFranquicia({ marca }: { marca: string | null }) {
  const { theme } = useTheme();
  const codigo = marca?.toLowerCase() ?? '';
  const archivo = ARCHIVOS[codigo];
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
      {archivo ? (
        /* La marca con archivo: su SVG, contenido en la caja. El orden importa
           — **este brazo va PRIMERO y el de texto queda intacto detrás**: así
           el fallback sigue sirviendo a las 19 marcas del catálogo del
           proveedor que no vendorizamos, sin una sola rama nueva. */
        (() => {
          const escala = Math.min(
            CONTENIDO_ANCHO / archivo.w,
            CONTENIDO_ALTO / archivo.h,
          );
          const { Svg } = archivo;
          /* 🔴 SIN `Math.round`, y lo enseñó el instrumento antes del gate: mi
             v1 redondeaba **las dos dimensiones por separado**, y eso
             DEFORMA — medido, hasta 0,032 de desvío de aspecto en Visa
             (3,111 → 3,143). *Un logo de marca registrada torcido no da error:
             se ve «casi bien», que es justo el criterio que este paso existe
             para juzgar.*
             El SVG escala continuo dentro de su `viewBox`, así que un tamaño
             fraccionario conserva el aspecto EXACTO. */
          return <Svg width={archivo.w * escala} height={archivo.h * escala} />;
        })()
      ) : texto ? (
        <Texto variante="dato" numberOfLines={1}>{texto}</Texto>
      ) : (
        /* Sin marca: el glifo de pagos de la casa. **La rama vacía no existe.** */
        <Icono nombre="pagos" tamano={18} />
      )}
    </View>
  );
}
