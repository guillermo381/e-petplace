/**
 * EL CHIP DE ENTIDAD — UNO SOLO EN TODA LA CASA (S91-B, junta D-691).
 *
 * LA REFERENCIA ES FIRMADA, no elegida acá: el chip de «Mis paseos»
 * —avatar + nombre + PATA magenta pisando al elegido—. Esta pieza es ESE
 * chip, extraído de `FiltroMascotas` para que deje de haber dos.
 *
 * ── QUÉ SE EXTRAJO Y QUÉ NO, que es la decisión de fondo ─────────────
 * Sube **el CHIP**, no el contenedor. `FiltroMascotas` es una HILERA
 * horizontal; el selector de raza de D es una GRILLA. Si subiera la hilera,
 * D tendría que envolverla o clonarla —y clonar es lo que esto viene a
 * matar—. El seam correcto es la unidad: cada casa dispone sus chips.
 *
 * Consumidores: `FiltroMascotas` (hilera del log · portada del prestador ·
 * filtros del histórico) y el selector de raza del alta (D).
 *
 * ── (a) CRECE UN PUNTO — orden del founder ───────────────────────────
 * «al entrar a la familia de packages/ui como pieza general, crece un
 * punto: el actual quedó chico para su nuevo uso en alta/perfil».
 *
 * Los dos tamaños salen de las ESCALAS DE LA CASA, no de un ojo:
 *   · `compacto` — el de hoy: alto 44 · avatar `xs` 28 · texto `sm` 13.
 *   · `general`  — cada pieza UN PASO arriba en su propia escala: avatar
 *     `xs`→`sm` (28→40) · texto `sm`→`base` (13→15) · y el alto se DERIVA
 *     conservando el aire (hoy 44−28 = 16, o sea 8 por lado ⇒ 40+16 = 56).
 *     **El alto no se eligió: es el que mantiene la respiración del chip
 *     firmado.** Si el founder quiere otro aire, se mueve el aire y el alto
 *     lo sigue — no al revés.
 *
 * ⚠️ `compacto` ES EL DEFAULT a propósito: los consumidores vivos (el log,
 * la portada, los filtros) NO se mueven. El founder pidió que crezca *para
 * su nuevo uso*, y crecer en los viejos sería una regresión que nadie pidió.
 *
 * ── (b) D-691 · LOS NOMBRES LARGOS ──────────────────────────────────
 * El síntoma («Labrador retrie…») **no nacía acá**: nace en
 * `SelectorOpcion:370`, que en grilla fuerza `numberOfLines={1}`. Medido
 * antes de tocar nada — esta hilera no tenía ni `numberOfLines` ni
 * `maxWidth`. Por eso la cura de D-691 es que D CONSUMA esta pieza, no que
 * se parchee un ancho.
 *
 * De las cuatro salidas que D-691 deja abiertas —ensanchar · bajar el
 * cuerpo · envolver · truncar con criterio— acá se toma **ENVOLVER A DOS
 * LÍNEAS**, y el porqué es que las otras tres pierden algo:
 *   · ensanchar sin techo rompe la grilla de dos columnas del alta;
 *   · bajar el cuerpo contradice la orden (a), que dice CRECER;
 *   · truncar deja «Guacamayo Azul y Amarillo» (25) ilegible igual.
 * Dos líneas leen el nombre entero de los 19 caracteres del catálogo y del
 * de 25. **El tope de 2 no es cosmético: sin tope, un nombre absurdo
 * estiraría la fila y rompería la grilla — con él, el corte es una decisión
 * y no un accidente de ancho, que es exactamente lo que D-691 exige.**
 *
 * ⚠️ Lo que esta pieza NO decide: el ANCHO. Lo pone el contenedor (la
 * hilera deja que el contenido mande; una grilla dará su columna). Un chip
 * que se auto-limita no se puede usar en dos disposiciones.
 */

import { Pressable, Text, View } from 'react-native'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import { AvatarMascota } from './AvatarMascota'
import { Icono } from './Icono'
import { MarcaEleccion } from '../brand/MarcaEleccion'

export type ChipEntidadTamano = 'compacto' | 'general'
/** 🔴 `'donacion'` NACE EN S100d-B (punto 15 del gate). No es una entidad
 *  más: es **la única respuesta a «¿para quién es?» que no es un ser**, y
 *  por eso su fallback no es una inicial sino **el glifo del refugio** —
 *  *una «D» en un círculo no dice nada; un refugio dice a dónde va.*
 *  Ver `SelectorDestinoItem` para por qué comparte hilera con las caras. */
export type ChipEntidadSujeto = 'mascota' | 'persona' | 'cosa' | 'donacion'

/** Las dos calibraciones, derivadas de las escalas de la casa. */
const CALIBRE = {
  compacto: { alto: 44, avatar: 'xs' as const, diametro: 28, texto: typography.size.sm },
  general: { alto: 56, avatar: 'sm' as const, diametro: 40, texto: typography.size.base },
}

export interface ChipEntidadProps {
  nombre: string
  fotoUrl?: string
  /** QUÉ MARCA LLEVA **CUANDO NO HAY FOTO** — y solo entonces: con
   *  `fotoUrl` la cara se dibuja siempre, sea cual sea el sujeto.
   *  `mascota` (default) cae a la HUELLA DIGNA de `AvatarMascota`;
   *  `persona` dibuja su INICIAL —una pata sobre el nombre de un humano
   *  diría que es un animal, y el monograma como fallback honesto ya es
   *  letra de `LogoNegocio`—; `cosa` (una raza, un objeto de catálogo)
   *  tampoco lleva huella: lleva su inicial. */
  sujeto?: ChipEntidadSujeto
  tamano?: ChipEntidadTamano
  elegido: boolean
  onPress: () => void
}

export function ChipEntidad({
  nombre,
  fotoUrl,
  sujeto = 'mascota',
  tamano = 'compacto',
  elegido,
  onPress,
}: ChipEntidadProps) {
  const { theme } = useTheme()
  const c = CALIBRE[tamano]
  // ── S91-B · LA CARA SE DIBUJA SIEMPRE QUE EXISTA (pedido de D, firmado).
  // ANTES: `conHuella = sujeto === 'mascota'` — y con eso, un sujeto que NO
  // fuera mascota IGNORABA `fotoUrl` por completo. La combinación que el
  // founder firmó para el chip de raza —«cosa + cara»— era INEXPRESABLE.
  //
  // AHORA los dos ejes se separan, que es lo que siempre debieron ser:
  //   · `fotoUrl` decide SI HAY CARA.
  //   · `sujeto` decide SOLO EL FALLBACK cuando no la hay.
  // Cero cambio para los consumidores vivos: los que traen foto la siguen
  // dibujando, y los que no, caen al mismo fallback de siempre.
  //
  // ⚠️ Y ESTA PIEZA YA HABÍA COBRADO SU PROPIO LÍMITE, que es lo que vuelve
  // el pedido de D una corrección y no un gusto: el filtro de ESPECIE del
  // histórico necesitaba imagen + fallback honesto, y la única forma de
  // tener las dos era declarar la especie como `'mascota'`. Ahí funcionaba
  // —una especie ES un animal, la huella es honesta—, pero fue esquivar el
  // modelo, no usarlo. Con esto deja de hacer falta esquivarlo.
  const conFoto = typeof fotoUrl === 'string' && fotoUrl.length > 0
  const conAvatar = conFoto || sujeto === 'mascota'
  // La donación no tiene cara ni inicial: lleva el glifo de a dónde va.
  const conGlifoRefugio = !conFoto && sujeto === 'donacion'

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: elegido }}
      accessibilityLabel={nombre}
      style={{
        minHeight: c.alto,
        borderRadius: radius.full,
        // ✅ FIRMADO (S85): LA PATA PISA Y EL CHIP CEDE — lo que se hunde no
        // proyecta: pierde la elevación, baja a `bg.hundido` y se ACHICA.
        backgroundColor: elegido ? theme.bg.hundido : theme.bg.card,
        boxShadow: elegido ? 'none' : theme.elevacion.reposo,
        transform: [{ scale: elegido ? 0.98 : 1 }],
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        paddingLeft: spacing[1.5],
        paddingRight: spacing[4],
        // el aire vertical acompaña al alto cuando el nombre envuelve
        paddingVertical: spacing[1],
      }}
    >
      {conAvatar ? (
        <AvatarMascota nombre={nombre} fotoUrl={fotoUrl} tamano={c.avatar} anidadoEn="chip" />
      ) : (
        <View
          style={{
            width: c.diametro,
            height: c.diametro,
            borderRadius: radius.full,
            backgroundColor: theme.bg.overlay,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {conGlifoRefugio ? (
            <Icono
              nombre="refugio"
              tamano={Math.round(c.diametro * 0.6)}
              registro="tinta"
              tinta={theme.text.secondary}
            />
          ) : (
          <Text
            style={{
              fontFamily: typography.family.sans.medium,
              fontSize: c.texto,
              color: theme.text.secondary,
            }}
          >
            {nombre.trim().charAt(0).toUpperCase()}
          </Text>
          )}
        </View>
      )}
      <Text
        // D-691: DOS LÍNEAS, no una. El tope existe para que el corte sea
        // una decisión y no un accidente (ver cabecera).
        numberOfLines={2}
        ellipsizeMode="tail"
        style={{
          flexShrink: 1,
          fontFamily: typography.family.sans.medium,
          fontSize: c.texto,
          // el label acompaña a la marca: en el elegido, el acento.
          color: elegido ? theme.accent.control : theme.text.primary,
        }}
      >
        {nombre}
      </Text>
      {/* LA PATA SOBRE EL CANTO — la MISMA primitiva, jamás una copia:
          adentro competía con la foto en el mismo plano; sobre el canto es
          otro objeto en otro plano. Solo en el elegido, que es lo único que
          la vuelve señal (S80 midió que la huella en TODAS no señala a una). */}
      {elegido ? <MarcaEleccion color={theme.accent.control} /> : null}
    </Pressable>
  )
}
