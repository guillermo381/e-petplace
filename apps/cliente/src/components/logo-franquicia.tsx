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
import { Image } from 'expo-image';
import { Icono, Texto, palette, radius, useTheme } from '@epetplace/ui';

import Visa from '../../assets/marcas/ic_visa.svg';
import Mastercard from '../../assets/marcas/ic_mastercard.svg';
import Diners from '../../assets/marcas/ic_diners.svg';
import Amex from '../../assets/marcas/ic_amex.svg';
import Discover from '../../assets/marcas/ic_discover.svg';

/**
 * 🔴 **DEUNA ES EL PRIMER PNG DEL SET, Y POR ESO PIDE RAMA PROPIA.** El
 * proveedor entregó raster; los cinco de tarjeta son SVG que Metro compila a
 * componente. *Un PNG no se monta como componente: se monta con `<Image>`.*
 *
 * `require(...) as number` es **el camino que la casa ya usa** para assets
 * raster (`lamina-fusion.tsx`) — no hace falta un `*.png.d.ts` nuevo.
 *
 * ⚠️ **VA EL ISOTIPO `d!`, NO EL WORDMARK `deuna!`, y no es gusto: es norma del
 * proveedor.** Su mínimo de reproducción para la versión principal es **50**, y
 * en esta caja el wordmark se dibuja a **44 de ancho** ⇒ **queda fuera de
 * norma.** El mínimo del símbolo es **16** y el isotipo da **24,5 × 22,0**.
 * *La elección estuvo abierta hasta que llegó el dato del proveedor, y el dato
 * la cerró solo — no la cerró una preferencia de diseño.*
 *
 * `ic_deuna.png` (el wordmark) **queda vendorizado y sin montar a propósito**:
 * es la marca principal N1 y es el archivo del día que exista una superficie
 * donde entren sus 50 —un pie, un comprobante—. *No se borra por prolijidad ni
 * se monta por costumbre.*
 *
 * ⚠️ **Si el proveedor entrega SVG, esta rama puede morir** y el pipeline
 * vectorial ya existe. **No bloquea nada** (firma del founder, 25-ago): se
 * monta con el PNG, que está medido y entra. **El swap lo decide B después de
 * re-medir** — el asset cambia de formato, y con él cambia lo único que acá
 * importa, que es la geometría.
 */
const DEUNA_ISOTIPO = require('../../assets/marcas/ic_deuna_isotipo.png') as number;

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
type Archivo = { w: number; h: number; /** dp libres que su manual exige a cada lado. */ resguardo?: number } & (
  | { clase: 'svg'; Svg: React.FC<{ width: number; height: number }> }
  | { clase: 'png'; fuente: number }
);

const ARCHIVOS: Record<string, Archivo> = {
  vi: { clase: 'svg', Svg: Visa, w: 56, h: 18 },
  mc: { clase: 'svg', Svg: Mastercard, w: 56, h: 37 },
  di: { clase: 'svg', Svg: Diners, w: 32, h: 21 },
  ax: { clase: 'svg', Svg: Amex, w: 32, h: 21 },
  dc: { clase: 'svg', Svg: Discover, w: 32, h: 21 },
  /* 🔴 468×420 son el LIENZO **y también el CUERPO**: el asset no trae un solo
     píxel de padding. Medido por B decodificando el canal alfa, y el lienzo
     re-verificado acá leyendo el `IHDR` — *dos instrumentos distintos sobre el
     mismo archivo, que es lo que vuelve al número una medición y no una cita.*
     ⇒ se le pasan `w`/`h` tal cual, igual que el `viewBox` de cada SVG. */
  deuna: { clase: 'png', fuente: DEUNA_ISOTIPO, w: 468, h: 420, resguardo: 4.4 },
};

/**
 * 🔴 **LAS MARCAS CUYO MANUAL EXIGE SU PROPIO FONDO.** Sin entrada acá, la caja
 * hereda `bg.hundido` y cambia con el tema, que es lo correcto para las cinco
 * tarjetas.
 *
 * **Deuna no puede heredarlo, y está medido:** su morado oficial `#4C1D80` da
 * **1,74:1** sobre el hundido oscuro y **1,51:1** en memorial —*prácticamente
 * invisible*— **y, lo que decide, ninguno de esos dos fondos está entre los que
 * su lámina de usos autoriza.** Blanco es su fila ✅ más literal, y da 11,70:1.
 *
 * ⚠️ **Va `palette.white` y no un hex crudo**, por dos razones que coinciden:
 * `R2 · Ley 1` prohíbe hexes en `apps/` con ratchet, **y** la casa ya tiene el
 * precedente exacto para esta clase — las marcas de mapa de `palette.ts` viven
 * fuera de los slots de tema con su razón escrita: *«no son colores de tema, y
 * por eso no viven en un slot»*. **Un fondo que un tercero dicta no es una
 * superficie nuestra.**
 *
 * ⚠️ **Alcance: SOLO esta marca.** Pasar las cinco tarjetas a blanco fijo
 * —también son marcas registradas con manuales que piden lo mismo— **sigue
 * abierto y es del founder.** *No se resuelve por coherencia interna: cada una
 * tiene su propio manual, y ninguna se reportó rota.*
 */
const FONDO_DE_MARCA: Record<string, string> = {
  deuna: palette.white,
};

/* El aire interno es del CONTENIDO, no de la caja: la caja sigue midiendo
   56×32 exactos, y el logo vive adentro sin tocar los bordes. */
const CONTENIDO_ANCHO = 44;
const CONTENIDO_ALTO = 22;

/**
 * 🔴 **EL ÁREA DE RESERVA DE DEUNA — un invariante que hoy se cumple SOLO, y
 * por eso hay que escribirlo.**
 *
 * Su manual exige **1X libre a cada lado**, donde **X = el grosor del punto del
 * signo de exclamación**, y **ningún elemento puede invadir ese espacio: ni un
 * borde, ni texto, ni el fondo de otra tarjeta.**
 *
 * La cuenta, contra esta geometría:
 *
 * | | |
 * |---|---|
 * | escala | `min(44/468, 22/420)` = **0,052381 dp/px** |
 * | render | **24,514 × 22,000 dp** |
 * | aire al borde — horizontal | `(56 − 24,514)/2` = **15,743 dp** |
 * | aire al borde — **vertical** | `(32 − 22,000)/2` = **5,000 dp** ← **liga** |
 * | **X medido por B** | **4,40 dp** |
 *
 * ⇒ **Entra, con 0,60 dp de sobra por lado.** No hace falta padding: la caja ya
 * lo deja. *Liga UN solo eje, no dos — el pedido original hablaba de «6 dp
 * horizontales y 5 verticales», pero esos 6 son el aire alrededor de un
 * contenido de 44 de ancho **y el isotipo no llena esos 44**: se dibuja a 24,5,
 * así que del lado horizontal sobran 15,7.*
 *
 * 🔴 **LO QUE ESTO PONE EN RIESGO, dicho para que se vea antes de romperlo:**
 * el margen vive en `ALTO_LOGO − CONTENIDO_ALTO = 10` dp. **Bajar `ALTO_LOGO` a
 * 31, o subir `CONTENIDO_ALTO` a 23, deja el resguardo en 4,5 y 4,0 dp** — el
 * segundo ya lo viola. *No da error, no se ve mal, y nos pone fuera del manual
 * de un tercero: la clase de defecto que solo aparece cuando alguien lo
 * reclama.* **Si estos dos números se tocan, se recalcula esta tabla.**
 *
 * 🔴 **Y POR ESO EL RESGUARDO NO VIVE EN ESTE COMENTARIO: ENTRA EN LA ESCALA.**
 * Se suma como **un techo más** al `Math.min` de abajo, así que el logo **no
 * puede crecer hasta el tamaño donde su resguardo dejaría de entrar** — el
 * estado malo se vuelve inexpresable en vez de quedar vigilado por atención.
 * *Un invariante que solo vive en prosa se sostiene por que alguien la lea, y
 * eso no es un mecanismo.*
 *
 * **Hoy es no-op y está medido: liga `CONTENIDO_ALTO` (0,052381) y el techo del
 * resguardo daría 0,055238** ⇒ el render no se mueve ni un dp. *Nace inerte a
 * propósito: si algún día cambia la caja, el clamp aparece solo y el logo se
 * achica en vez de salirse de norma.*
 */

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
        /* El fondo es del TEMA salvo que el manual de la marca diga otra cosa
           — ver `FONDO_DE_MARCA`. Las cinco tarjetas siguen heredando. */
        backgroundColor: FONDO_DE_MARCA[codigo] ?? theme.bg.hundido,
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
          /* 🔴 CUATRO TECHOS, y el logo se queda con el más chico.
             Los dos primeros son el contenido de siempre. **Los dos últimos son
             el ÁREA DE RESERVA** (ver el bloque de `CONTENIDO_ALTO`): sin
             `resguardo` valen `Infinity` y no participan, que es el caso de las
             cinco tarjetas. *Así el resguardo no es una promesa escrita: es un
             techo que el logo no puede pasar.* */
          const aire = archivo.resguardo ?? 0;
          const escala = Math.min(
            CONTENIDO_ANCHO / archivo.w,
            CONTENIDO_ALTO / archivo.h,
            archivo.resguardo === undefined ? Infinity : (ANCHO_LOGO - 2 * aire) / archivo.w,
            archivo.resguardo === undefined ? Infinity : (ALTO_LOGO - 2 * aire) / archivo.h,
          );
          /* 🔴 SIN `Math.round`, y lo enseñó el instrumento antes del gate: mi
             v1 redondeaba **las dos dimensiones por separado**, y eso
             DEFORMA — medido, hasta 0,032 de desvío de aspecto en Visa
             (3,111 → 3,143). *Un logo de marca registrada torcido no da error:
             se ve «casi bien», que es justo el criterio que este paso existe
             para juzgar.*
             El SVG escala continuo dentro de su `viewBox`, así que un tamaño
             fraccionario conserva el aspecto EXACTO. **Y el PNG llega con
             resolución de sobra** —el isotipo tiene 420 px de alto y se dibuja
             a 22 dp: a densidad ×3 son 66 px reales, factor 6— *así que siempre
             downsamplea, que es donde el raster se ve bien.* */
          const ancho = archivo.w * escala;
          const alto = archivo.h * escala;
          if (archivo.clase === 'png') {
            /* `contentFit="contain"` es cinturón, no motor: el tamaño ya viene
               con el aspecto exacto. *Si algún día un asset trae padding que
               nadie midió, prefiero que sobre aire a que la marca se estire.* */
            return (
              <Image
                source={archivo.fuente}
                style={{ width: ancho, height: alto }}
                contentFit="contain"
                /* Sin leyenda de atribución: el proveedor confirmó que no la
                   exige (25-ago). **El isotipo va solo, nada lo acompaña.** */
                accessible={false}
              />
            );
          }
          const { Svg } = archivo;
          return <Svg width={ancho} height={alto} />;
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
