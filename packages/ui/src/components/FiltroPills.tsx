/**
 * FiltroPills · FiltroMascotas — LOS CHIPS DE FILTRO CON PATA.
 *
 * PROMOVIDOS desde `apps/cliente/src/components/filtro-pills.tsx` en
 * S85-B7, por LA REGLA DE LAS PIEZAS: apareció el segundo consumidor (la
 * portada del prestador). Hasta hoy eran un override LOCAL del cliente
 * declarado como tal —R10 vigilaba su marcador `@override-s82c`
 * justamente para que nadie los generalizara desde una pantalla— y su
 * promoción estaba escrita como trabajo de B post-gate. Esto es esa
 * promoción, por su puerta.
 *
 * LO QUE NO CAMBIÓ, y es la condición del pedido: el comportamiento del
 * cliente. La anatomía, los números, las ramas por tema y las leyes
 * aplicadas viajaron VERBATIM. Lo único que se movió es de dónde se
 * importan y de qué tema resuelven.
 *
 * ⚠️ LO QUE SÍ CAMBIÓ, DECLARADO: la marca del elegido deja de ser el
 * clon local `MarcaElegido` y pasa a ser la primitiva canónica
 * `MarcaEleccion` (S82 r37). Los números son byte-idénticos —PATA 24,
 * MONTA = PATA/3, −14°, huella a 0.95 con offset 0.6—, así que en
 * píxeles no se mueve nada; pero la canónica trae además
 * `accessibilityElementsHidden` + `importantForAccessibility`, que el
 * clon NO tenía. O sea: en el cliente, un lector de pantalla dejaba de
 * anunciar el chip elegido DOS VECES —una por el `selected` del control
 * y otra por la marca sin nombre— y ahora anuncia una. Es una mejora de
 * a11y, no un cambio de diseño, y se declara porque el pedido decía "sin
 * cambiar el comportamiento".
 *
 * CADA CASA LA VISTE CON SU TEMA, y sale gratis porque estas piezas ya
 * estaban bien construidas: todo lo cromático resuelve de SLOTS
 * (`accent.control`, `capa.*`, `bg.hundido`, `bg.card`, `elevacion.*`),
 * jamás de un hex. `accent.control` ya se resuelve por casa desde S83-B17
 * —tealDark en el prestador claro, teal puro en su oscuro, magentaDark /
 * violetText en el cliente— y R27 lo vigila. No hubo que replumbar nada:
 * la pieza pregunta por su acento y cada tema contesta el suyo.
 *
 * ── ANATOMÍA (heredada, firmada en S82-C r6 por corrección del founder
 * sobre la r4: el chip NO va sin caja — lleva contenedor RELLENO suave
 * con la placa del glifo adentro; "A6 mata el CONTORNO, no el relleno").
 * Chip = píldora RELLENA (papel de tarjeta sobre el fondo de la casa;
 * para separarse en claro lleva la elevación de reposo, y el consumidor
 * la APOYA EN EL FONDO, jamás dentro de una Tarjeta) · placa del glifo 30
 * rectángulo suave adentro. Reposo: placa TENUE (bg.overlay) + glifo en
 * trazo secundario + label gris. Elegido: la placa se rellena con el
 * color de su CATEGORÍA (Ley 10; sin categoría —todo/tiempo— tinta) +
 * glifo INVERTIDO (papel) + label pleno. NUNCA contorno. 44 de alto, 10
 * de separación, scroll horizontal.
 *
 * ⚠️ LA HILERA SIN GLIFO, y por qué sigue sin glifo (heredado r14-2): el
 * set de VENTANA TEMPORAL no existe en el registry —«todos · semana ·
 * mes»— y repetir un mismo glifo en los tres es lo que la Ley 12
 * enmendada prohíbe. Queda como pedido de set, no como deuda de esta
 * pieza. Con la promoción, ese pedido ya no cruza frontera: el registry y
 * esta pieza viven en la misma casa.
 */

import { Pressable, View } from 'react-native'
import { HojaScroll } from './Hoja'
import Svg from 'react-native-svg'

import { Icono, type IconoNombre } from './Icono'
import { Texto } from './Texto'
import { Huella } from '../brand/Huella'
import { MarcaEleccion } from '../brand/MarcaEleccion'
import { ChipEntidad } from './ChipEntidad'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export type OpcionFiltro<C extends string> = {
  codigo: C
  etiqueta: string
  /** Glifo del set b′, 'huella' (la primitiva canónica) o null (solo texto). */
  icono: IconoNombre | 'huella' | null
  /** La CATEGORÍA del filtro (Ley 10) — pinta la placa del elegido;
   *  null (todo / tiempo) = tinta. */
  capa?: 'identidad' | 'cuidado' | null
}

export interface FiltroPillsProps<C extends string> {
  opciones: OpcionFiltro<C>[]
  /** S91-B: acepta `null` = NINGUNO elegido. Nació para el histórico, donde
   *  un eje puede estar SIN filtrar — el mismo estado que `FiltroMascotas`
   *  ya expresaba con `elegida: null` cuando mató el chip «Todas». Los
   *  consumidores que pasan `C` no cambian: es un ensanche, no un cambio. */
  activo: C | null
  onCambio: (c: C) => void
  /** S91-B · LIMPIAR DE A UNO (letra del founder). Si se pasa, tocar el chip
   *  YA ELEGIDO lo suelta en vez de re-elegirlo. Es OPCIONAL a propósito:
   *  sin ella el componente se comporta como siempre —un eje donde algo
   *  SIEMPRE está activo (el log) no debe poder quedarse sin nada—, y con
   *  ella el eje se puede apagar. La diferencia es del consumidor, no de
   *  la pieza. */
  onLimpiar?: () => void
  /**
   * 🔴 DÓNDE CAEN LOS CHIPS — `'tira'` (default, cero cambio) · `'envuelve'`
   * (S100d-B · punto 4 del gate, pedido por la pista C **con su número**).
   *
   * **El literal del founder:** *«modal de filtro genial. PERO chips sin
   * visibilidad horizontal»*. **Y lo que lo vuelve una decisión y no una
   * queja son los cinco ejes que C midió en aparato (384 dp, 18-ago):**
   *
   * | eje | opciones | se ve | queda fuera |
   * |---|---|---|---|
   * | Categoría | 3 | 89 % | 42 dp |
   * | Especie | 5 | 78 % | 97 dp |
   * | **Marca** | **13** | **22 %** | **1254 dp** |
   * | **Presentación** | **15** | **23 %** | **1149 dp** |
   * | Precio | 4 | 77 % | 106 dp |
   *
   * ⚠️ **Y C hizo lo que vuelve creíble el número: trató de falsar la causa
   * fácil primero.** Probó si la tira scrollea (**las 5 sí**) y si el evento
   * de rueda la mueve (**las 5 sí**) ⇒ **la tira NO está rota.** *La mitad
   * obvia de la cura era la que no hacía falta, y decirlo le ahorró a esta
   * pieza un arreglo sobre algo que funciona.*
   *
   * ⇒ **El defecto que queda es de FORMA:** en una hoja dedicada a filtrar,
   * un riel horizontal **esconde el 78 % de un eje y no dice cuánto
   * esconde**. Aunque el dedo llegue, encontrar una marca son **1254 dp de
   * arrastre** — *eso no es filtrar, es buscar a ciegas.*
   *
   * **La ANATOMÍA NO CAMBIA** — mismos chips, misma pata, mismo
   * `MarcaEleccion`, mismos gaps. **Cambia dónde caen.** Es el mismo ensanche
   * que `SelectorOpcion` tiene firmado desde S55 (`fila | tira | grilla |
   * columnas`), y por eso entra acá en vez de nacer un chip local: *una tira
   * de chips propia en la pantalla sería la copia que L-175 prohíbe.*
   *
   * ⚠️ **La segunda mitad, declarada por C SIN veredicto y conservada acá:**
   * `Hoja` monta su contenido en un `ScrollView` de gesture-handler con un
   * `Gesture.Pan` que arrastra la hoja, y esta pieza usa un `ScrollView` de
   * react-native a secas ⇒ **en el teléfono ese pan podría ganarle al
   * arrastre horizontal.** RN-web no reproduce ese gesto. *No se afirma que
   * pase.* **Pero si pasa, `'envuelve'` lo mata de raíz: sin gesto horizontal
   * no hay con qué competir.**
   */
  disposicion?: 'tira' | 'envuelve'
}

export function FiltroPills<C extends string>({
  opciones,
  activo,
  onCambio,
  onLimpiar,
  disposicion = 'tira',
}: FiltroPillsProps<C>) {
  const { theme } = useTheme()

  /* El aire es EL MISMO en las dos disposiciones — es lo que hace que esto
     sea un ensanche y no una segunda pieza. ⚠️ El `paddingTop` no es
     estético en ninguna de las dos: la pata MONTA el canto del chip. En la
     tira lo recorta el `ScrollView`; envolviendo lo recortaría el `overflow`
     de la Hoja. Mismo número, misma razón. */
  const aire = {
    gap: spacing[2.5],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
  }

  const chips = opciones.map((o) => {
        const elegido = o.codigo === activo
        const colorPlaca =
          o.capa === 'identidad' ? theme.capa.identidad : o.capa === 'cuidado' ? theme.capa.cuidado : theme.text.primary
        const tintaGlifo = elegido ? theme.bg.card : theme.text.secondary
        // ☠️ EL RELLENO PLENO DEL CHIP MURIÓ CON (a), S82-C r18. Nació como
        // SUSTITUTO: la hilera sin glifo no tenía placa que rellenar, así
        // que se rellenaba el chip entero. Con la pata —una marca que no
        // depende del glifo— el sustituto sobra: dos marcas para un mismo
        // estado es el tercer peso que no informa (Ley 18 + Chanel).
        return (
          <Pressable
            key={o.codigo}
            onPress={() => (elegido && onLimpiar ? onLimpiar() : onCambio(o.codigo))}
            accessibilityRole="radio"
            accessibilityState={{ selected: elegido }}
            accessibilityLabel={o.etiqueta}
            style={{
              height: 44,
              borderRadius: radius.full,
              // ✅ EL CHIP SE HUNDE BAJO LA PATA, POR SLOT. Lo que se hunde
              // NO PROYECTA: pierde la elevación y baja de superficie.
              // ⚠️ EN MEMORIAL EL SLOT NO DA PASO (1.00 — el MISMO valor
              // que la tarjeta), y se declara en vez de pisarlo: memorial
              // tiene UNA sola superficie a propósito, así que un hueco por
              // color ahí no existe. El hundimiento lo cargan la elevación
              // perdida y la escala — que es cómo memorial dice las cosas
              // (Ley 8: degrada, no celebra).
              backgroundColor: elegido ? theme.bg.hundido : theme.bg.card,
              boxShadow: elegido ? 'none' : theme.elevacion.reposo,
              transform: [{ scale: elegido ? 0.98 : 1 }],
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[2],
              paddingLeft: o.icono !== null ? spacing[1.5] : spacing[4],
              paddingRight: spacing[4],
            }}
          >
            {o.icono !== null ? (
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: radius.suave,
                  backgroundColor: elegido ? colorPlaca : theme.bg.overlay,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {o.icono === 'huella' ? (
                  <Svg width={16} height={16} viewBox="0 0 24 24">
                    <Huella color={tintaGlifo} escala={0.85} x={1.8} y={1.8} />
                  </Svg>
                ) : (
                  <Icono nombre={o.icono} tamano={16} registro="tinta" tinta={tintaGlifo} />
                )}
              </View>
            ) : null}
            {/* ⚠️ EL LABEL — la nota del chip invisible en oscuro se CONSERVA
                aunque el relleno haya muerto, porque su lección sobrevive al
                código: NO era un negro hardcodeado (sospecha del founder,
                descartada midiendo). El que mentía era el label con
                `text.onGradient`, blanco en claro Y en oscuro a propósito.
                Medido: claro 16.94 ✓ · oscuro 1.15 ✗ · memorial 1.31 ✗. Si
                algún día vuelve un relleno de chip, el label va en `bg.base`
                (15.40 / 17.73 / 14.35), jamás en onGradient. */}
            <Texto variante="apoyo" color={elegido ? 'primary' : 'secondary'}>
              {o.etiqueta}
            </Texto>
            {/* LA MARCA DEL ELEGIDO — HERMANA DEL LABEL, JAMÁS HIJA DE LA
                PLACA. Su posición es la ley, no el layout: los glifos b′ ya
                contienen una huella, así que adentro de la placa la marca es
                una huella entre huellas y deja de señalar. Las tres
                condiciones viven en la primitiva. */}
            {elegido ? <MarcaEleccion color={theme.accent.control} /> : null}
          </Pressable>
        )
  })

  /* 'envuelve' — un `View` con `flexWrap`: mismos chips, mismo aire, sin
     riel. **No hay `ScrollView`, y ésa es la cura**: lo que no entra a lo
     ancho baja de renglón en vez de esconderse a la derecha. */
  if (disposicion === 'envuelve') {
    return <View style={{ ...aire, flexDirection: 'row', flexWrap: 'wrap' }}>{chips}</View>
  }

  /* 🔴 LA TIRA CEDE EL GESTO — S100d·bis, contra el rojo medido por C.
     ⏪ Era un `ScrollView` de react-native a secas: **adentro de una Hoja, el
     `Gesture.Pan` del swipe-to-close le ganaba el arrastre y la tira no se
     movía ni un píxel** (los cuatro chips en las mismas x antes y después).
     `HojaScroll` es la pieza que la casa YA tenía para este arbitraje —solo
     resolvía el eje vertical— y **fuera de una Hoja degrada a scroll común**,
     que es la restricción que C puso y que esta pieza necesita: vive también
     en la vitrina y en la portada del prestador. */
  return (
    <HojaScroll horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={aire}>
      {chips}
    </HojaScroll>
  )
}

// ═══════════════════ EL FILTRO DE MASCOTAS ═══════════════════

export interface FiltroMascotasProps {
  /** ⚠️ EL NOMBRE DEL PROP ES HISTÓRICO y se conserva a propósito: desde
   *  S91-B la hilera puede llevar PERSONAS además de mascotas (el tipeo del
   *  histórico sugiere de los dos mundos por firma del founder). Renombrarlo
   *  tocaría a sus consumidores vivos sin ganar nada, y partir la pieza en
   *  dos sería el clon que §6 prohíbe — la FORMA es la misma hilera de chips
   *  elegibles; lo que cambia es la marca del sujeto, y eso es una prop. */
  mascotas: {
    id: string
    nombre: string
    fotoUrl?: string
    /** QUÉ MARCA LLEVA EL CHIP. Default `'mascota'` — cero consumidor
     *  existente cambia. `'persona'` dibuja la INICIAL en vez del avatar,
     *  y no es cosmético: `AvatarMascota` sin foto cae a la HUELLA DIGNA,
     *  y una pata sobre el nombre de un humano dice que es un animal. El
     *  monograma como fallback honesto ya es la letra de `LogoNegocio`
     *  ("jamás huella") — acá se aplica el mismo criterio al sujeto. */
    sujeto?: 'mascota' | 'persona'
  }[]
  /** null = NINGUNA elegida (el log entra sin filtro y muestra todo). Se
   *  LEE porque ningún chip queda activo — el chip "Todas" murió, el
   *  comportamiento no. */
  elegida: string | null
  onElegir: (id: string | null) => void
}

/** LOS CHIPS DE MASCOTA (S82-C r12, rediseño del founder).
 *
 *  ☠️ L-b DEJA DE COMPUTARSE ACÁ, y no porque la ley se derogue: porque
 *  esta hilera YA NO RELLENA. L-b es una ley de DOSIS —dice CUÁNTO
 *  relleno tolera una fila según cuántos hermanos tenga— y con la marca
 *  por FORMA no hay relleno que dosificar. La ley sigue rigiendo donde
 *  haya relleno; acá no hay. */
export function FiltroMascotas({ mascotas, elegida, onElegir }: FiltroMascotasProps) {
  return (
    /* Misma pieza que la tira de arriba, por la misma razón: si algún día esta
       hilera se monta adentro de una Hoja, el pan del swipe-to-close le ganaría
       el arrastre sin avisar. **Hoy vive FUERA de una Hoja y por eso degrada a
       scroll común** — que es exactamente lo que hace `HojaScroll` sin `pan` en
       el contexto. *Se migra ahora, con la de al lado, para que las dos hileras
       de chips de la casa no envejezcan distinto.* */
    <HojaScroll
      horizontal
      showsHorizontalScrollIndicator={false}
      // ⚠️ el aire de ARRIBA no es estético (ver FiltroPills): la pata
      // MONTA el canto y un ScrollView recorta a sus bordes.
      contentContainerStyle={{
        gap: spacing[2.5],
        paddingHorizontal: spacing[4],
        paddingTop: spacing[3],
        paddingBottom: spacing[1],
      }}
    >
      {/* S91-B · CONSUME `ChipEntidad` — LA CASA TIENE UN SOLO CHIP.
          Acá vivía la copia; el chip se extrajo tal cual (la referencia
          firmada de «Mis paseos» ES este dibujo) y esta hilera pasó a ser
          lo único que le queda de propio: LA DISPOSICIÓN. Sigue en
          `compacto`, el tamaño de siempre — el founder pidió que el chip
          creciera para su USO NUEVO (alta/perfil), no acá. */}
      {mascotas.map((m) => (
        <ChipEntidad
          key={m.id}
          nombre={m.nombre}
          fotoUrl={m.fotoUrl}
          sujeto={m.sujeto ?? 'mascota'}
          elegido={elegida === m.id}
          onPress={() => onElegir(elegida === m.id ? null : m.id)}
        />
      ))}
    </HojaScroll>
  )
}
