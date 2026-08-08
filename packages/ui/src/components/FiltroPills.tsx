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

import { Pressable, ScrollView, Text, View } from 'react-native'
import Svg from 'react-native-svg'

import { AvatarMascota } from './AvatarMascota'
import { Icono, type IconoNombre } from './Icono'
import { Texto } from './Texto'
import { Huella } from '../brand/Huella'
import { MarcaEleccion } from '../brand/MarcaEleccion'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
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
}

export function FiltroPills<C extends string>({ opciones, activo, onCambio, onLimpiar }: FiltroPillsProps<C>) {
  const { theme } = useTheme()

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // ⚠️ el aire de ARRIBA no es estético: la pata MONTA el canto y un
      // ScrollView recorta a sus bordes. Con paddingTop 4 (lo que había)
      // la pata se cortaba por la mitad. 12 > MONTA(8), con margen.
      contentContainerStyle={{
        gap: spacing[2.5],
        paddingHorizontal: spacing[4],
        paddingTop: spacing[3],
        paddingBottom: spacing[1],
      }}
    >
      {opciones.map((o) => {
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
      })}
    </ScrollView>
  )
}

// ═══════════════════ EL FILTRO DE MASCOTAS ═══════════════════

export interface FiltroMascotasProps {
  mascotas: { id: string; nombre: string; fotoUrl?: string }[]
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
  const { theme } = useTheme()

  const chip = (
    key: string,
    activo: boolean,
    contenido: React.ReactNode,
    onPress: () => void,
    etiqueta: string,
  ) => (
    <Pressable
      key={key}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={etiqueta}
      style={{
        height: 44,
        borderRadius: radius.full,
        // ✅ FIRMADO: LA PATA PISA Y EL CHIP CEDE. Lo que se hunde no
        // proyecta — pierde la elevación, baja al slot `bg.hundido` y se
        // ACHICA en vez de crecer. Las otras dos candidatas murieron CON
        // SU MAQUINARIA (Ley 37: el gate ocurrió; nada queda "por si
        // acaso").
        backgroundColor: activo ? theme.bg.hundido : theme.bg.card,
        boxShadow: activo ? 'none' : theme.elevacion.reposo,
        transform: [{ scale: activo ? 0.98 : 1 }],
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        paddingLeft: spacing[1.5],
        paddingRight: spacing[4],
      }}
    >
      {contenido}
      {/* LA PATA SOBRE EL CANTO — la MISMA pieza que en FiltroPills, no una
          copia. Su porqué, que es lo que ganó el gate: la huella ADENTRO
          competía con la foto EN EL MISMO PLANO; sobre el canto es otro
          objeto en otro plano. Y aparece SOLO en la elegida, que es lo
          único que la vuelve señal (S80 midió que la huella en TODAS no
          puede señalar a una). */}
      {activo ? <MarcaEleccion color={theme.accent.control} /> : null}
    </Pressable>
  )

  // el label acompaña a la marca: en el elegido, el acento; en el resto,
  // tinta. Sin rama por cantidad — la pata marca igual con 2 que con 8.
  const colorLabel = (activo: boolean) => (activo ? theme.accent.control : theme.text.primary)

  return (
    <ScrollView
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
      {mascotas.map((m) =>
        chip(
          m.id,
          elegida === m.id,
          <>
            <AvatarMascota nombre={m.nombre} fotoUrl={m.fotoUrl} tamano="xs" anidadoEn="chip" />
            <Text
              style={{
                fontFamily: typography.family.sans.medium,
                fontSize: typography.size.sm,
                color: colorLabel(elegida === m.id),
              }}
            >
              {m.nombre}
            </Text>
          </>,
          () => onElegir(elegida === m.id ? null : m.id),
          m.nombre,
        ),
      )}
    </ScrollView>
  )
}
