/**
 * LAS PIEZAS DE LA DESPENSA (S95-I) — anatomías LOCALES del cliente,
 * declaradas como tales.
 *
 * POR QUÉ VIVEN ACÁ Y NO EN `packages/ui`: precedente EXACTO de
 * `reserva-piezas.tsx` (CabezalOficio · GrillaElegir · DiaSinHorarios) y
 * de `GateRoto`/`PantallaCaida` en el prestador — una anatomía nace
 * local, pasa el gate en dispositivo, y RECIÉN ENTONCES se promueve con
 * su método completo (Ley 11: espec + WCAG + galería + gate). Promoverla
 * antes del gate sería congelar en la casa una forma que el founder
 * todavía no vio. **La promoción se coordina; nadie la copia** (L-175: se
 * lee el registry, y si no alcanza se ENSANCHA — D-645: promover NO es
 * migrar, el código viejo queda vivo y nada lo señala).
 *
 * Lo que NO hay acá y es a propósito: la fila del producto es `Celda` de
 * la casa (`inicio` = lienzo · `titulo` = nombre · `subtitulo` =
 * presentación · `metadataMono` = precio). Se relevó ANTES de escribir
 * (§1c pregunta 2) y cubre el trabajo entero: crear una fila propia
 * habría sido inventar teniendo la pieza.
 */

import { View } from 'react-native';
import { Image } from 'expo-image';
import {
  AvatarMascota,
  Icono,
  Texto,
  radius,
  spacing,
  useTheme,
} from '@epetplace/ui';

/* ─────────────────────────────────────────────────────────────────────
 * LIENZO — la superficie de la foto del producto
 *
 * 🔴 HOY DIBUJA SIEMPRE EL FALLBACK, Y NO ES UN DEFECTO DE ESTA PIEZA:
 * `productos.imagen_url` e `imagenes` EXISTEN en la tabla (medido) pero
 * los wrappers de S95-E **no las seleccionan** — ni `SELECT_VITRINA` ni
 * `obtenerFichaProducto` las traen. La foto no viaja, así que la
 * pantalla no la puede pintar. Elevado a la mesa; `packages/api` es
 * territorio de otra pista y no se toca desde acá.
 *
 * La pieza nace CON su prop `fotoUrl` igual: el día que el wrapper la
 * traiga se cablea un argumento y nada más se mueve. Lo que NO se hizo
 * es inventar una imagen para que la pantalla se vea llena — un
 * placeholder decorativo haría creer que el catálogo tiene fotos.
 *
 * El fallback es el glifo del oficio contenido con aire, JAMÁS recortado
 * (misma ley que `LogoNegocio`: `contain` + aire; el recorte circular es
 * de caras). No lleva huella: la huella es de MASCOTA (Ley 12), y una
 * bolsa de alimento no es una mascota. */
export function LienzoProducto({
  fotoUrl = null,
  lado,
}: {
  fotoUrl?: string | null;
  /** Cuadrado. La pantalla decide la escala: 56 en fila, ~200 en ficha. */
  lado: number;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        width: lado,
        height: lado,
        borderRadius: radius.suave,
        backgroundColor: theme.bg.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {fotoUrl !== null ? (
        <Image
          source={{ uri: fotoUrl }}
          // `contain` + aire: un envase alto y una bolsa ancha entran
          // enteros. `cover` recortaría justo la etiqueta, que es lo
          // único que la familia usa para reconocer el producto.
          contentFit="contain"
          style={{ width: lado - spacing[2], height: lado - spacing[2] }}
          // Ley 13: nada se anima al llegar el dato.
          transition={0}
          accessibilityRole="image"
        />
      ) : (
        <Icono nombre="despensa" tamano={Math.round(lado * 0.42)} registro="capa" />
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * CRITERIO — 🔴 LA FIRMA DE LA PANTALLA (Ley 15)
 *
 * Es el foso hecho píxeles: la mascota REAL preside la recomendación y
 * la razón se DICE con palabras. `MODELO_DESPENSA` §4.1 — *"si la app
 * conoce a la mascota y aun así muestra siete opciones, está admitiendo
 * que no sabe"*: acá se muestra lo contrario, que sí sabe, y POR QUÉ.
 *
 * SIN CAJA (A6, `DIRECCION_ARTE` §9bis.1, FIRMADA). La presencia la dan
 * la cara y la jerarquía tipográfica, no un marco.
 *
 * 🔴 LO QUE ESTA PIEZA NO DICE, Y ES DELIBERADO: **cuántos productos se
 * excluyeron**. El wrapper devuelve lo que PASÓ el filtro, no lo que
 * quedó afuera — contar los ausentes sería inventar un número. Se nombra
 * el ALÉRGENO (que sí es dato del expediente) y jamás la cuenta.
 * Tampoco dice "quedan 2" ni nada por el estilo: `MODELO_LOYALTY` §7.5,
 * cero urgencia artificial, cero FOMO. */
export function CriterioMascota({
  nombre,
  fotoUrl,
  linea,
  razon,
}: {
  nombre: string;
  /** Ya resuelta por `caraDeMascotaPorRuta` — la MISMA escalera que el
   *  Hogar y el perfil (foto real → cara de su raza → genérico de su
   *  especie). `undefined` pide el escalón ③ y `AvatarMascota` cae solo
   *  a la huella; **`null` no compila a propósito**, su prop no lo
   *  acepta. Que la despensa mostrara otra cara de la misma mascota es
   *  el defecto que el founder ya marcó dos veces en S91. */
  fotoUrl: string | undefined;
  /** "Para Thor" — la voz la arma la pantalla (el riel, jamás acá). */
  linea: string;
  /** El porqué, ya resuelto por la pantalla desde `criterio`. `null` =
   *  no hay nada verdadero que decir todavía, y entonces NO se dice:
   *  un hueco del expediente no se rellena con una frase amable. */
  razon: string | null;
}) {
  return (
    <View style={{ gap: spacing[2], paddingHorizontal: spacing[5] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        {/* `especie` NO se pasa: está declarada en el tipo de
            `AvatarMascota` pero su cuerpo no la destructura (medido) —
            queda reservada al set ilustrado D-288. Pasarla haría creer
            que hace algo. */}
        <AvatarMascota nombre={nombre} fotoUrl={fotoUrl} tamano="md" />
        <View style={{ flex: 1, gap: 2 }}>
          <Texto variante="titulo">{linea}</Texto>
        </View>
      </View>
      {razon !== null ? <Texto variante="apoyo">{razon}</Texto> : null}
    </View>
  );
}
