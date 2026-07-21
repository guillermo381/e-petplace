/**
 * LÁMINA S73 — el gate en dispositivo de TRES firmas en uno (mesa 21-Jul):
 *   Hoja 1 · la anatomía 19.7: chevron QUE GIRA (A) vs derecho siempre (B)
 *   Hoja 2 · el selector de mascota EN SU PANTALLA: acento control (hoy)
 *            vs capa.identidad (letra) CONVIVIENDO con los selectores de valor
 *   Hoja 3 · el N=1 que se dice (la ventana de disponibles con la cara)
 *
 * ESPÉCIMEN DE GALERÍA: `FilaLabel` y `Chevron` de acá son BOCETO del gate,
 * NO componentes del producto — la anatomía se congela en packages/ui recién
 * con la firma del founder (Ley 11 corre DESPUÉS del gate). Tokens reales,
 * glifos b′ reales (Icono), componentes reales donde ya existen.
 *
 * La lámina de mesa usó glifos suplentes y hexes aproximados (declarado en
 * ENMIENDA_19_7_S73 §7) — esta la reemplaza con la verdad de packages/ui.
 */

import { Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { ThemeProvider, useTheme } from '../ThemeProvider'
import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { AvatarMascota } from '../components/AvatarMascota'
import { Boton } from '../components/Boton'
import { Celda } from '../components/Celda'
import { Icono } from '../components/Icono'
import { SelectorOpcion } from '../components/SelectorOpcion'
import { Separador } from '../components/Separador'
import { Tarjeta } from '../components/Tarjeta'
import { Texto } from '../components/Texto'

const sans = typography.family.sans

// El chevron canónico de CeldaNavegacion (M9 18l6-6-6-6 = ›), girado por
// dirección: navega › · revela ⌄ · pliega ⌃. Mismo trazo, misma tinta.
function Chevron({ dir }: { dir: 'navega' | 'revela' | 'pliega' }) {
  const { theme } = useTheme()
  const d = dir === 'navega' ? 'M9 18l6-6-6-6' : dir === 'revela' ? 'M6 9l6 6 6-6' : 'M6 15l6-6 6 6'
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <Path d={d} stroke={theme.text.tertiary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

// BOCETO de la anatomía 19.7 enmendada: [glifo si varía] + texto + chevron,
// target 44. Estructural, no cromático (en el cliente el CTA es tinta —
// el label no tiene color del que agarrarse).
function FilaLabel({
  glifo,
  texto,
  dir,
}: {
  glifo?: 'paseo' | 'veterinaria'
  texto: string
  dir: 'navega' | 'revela' | 'pliega'
}) {
  const { theme } = useTheme()
  return (
    <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
      {glifo ? <Icono nombre={glifo} tamano={21} registro="capa" /> : null}
      <Text style={{ fontFamily: sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
        {texto}
      </Text>
      <Chevron dir={dir} />
    </View>
  )
}

function NotaHoja({ children }: { children: string }) {
  const { theme } = useTheme()
  return (
    <Text
      style={{
        fontFamily: sans.regular,
        fontSize: typography.size.xs,
        lineHeight: Math.round(typography.size.xs * 1.5),
        color: theme.text.secondary,
        marginBottom: spacing[3],
      }}
    >
      {children}
    </Text>
  )
}

function PanelLamina({
  etiqueta,
  children,
  ancho = 360,
}: {
  etiqueta: string
  children: React.ReactNode
  /** La Hoja 3 pide 420 (el ancho real del teléfono): la Celda pone su
   *  metadataMono a la DERECHA y a 360 el título quedaba exprimido a
   *  cero — hallazgo de la 1ª captura M3. */
  ancho?: number
}) {
  const { theme } = useTheme()
  return (
    <View
      style={{
        backgroundColor: theme.bg.base,
        borderRadius: radius.md,
        padding: spacing[4],
        borderWidth: 1,
        borderColor: theme.border.default,
        flexGrow: 1,
        flexBasis: 300,
        maxWidth: ancho,
      }}
    >
      <Text style={{ fontFamily: sans.medium, fontSize: typography.size.xs, color: theme.text.secondary, marginBottom: spacing[3] }}>
        {etiqueta}
      </Text>
      {children}
    </View>
  )
}

// El espécimen de la Hoja 1: UNA tarjeta con el sólido (la primaria), una
// fila-entre-filas que NAVEGA (glifo: los destinos varían) y el pie de
// sección que REVELA/PLIEGA (sin glifo: no tiene hermanos — Chanel).
function EspecimenAnatomia({ gira }: { gira: boolean }) {
  return (
    <Tarjeta elevacion="reposo">
      <View style={{ gap: spacing[2] }}>
        <Texto variante="cuerpo">Aprobaste el presupuesto de Thor.</Texto>
        <Texto variante="apoyo">La clínica va a coordinar la fecha contigo.</Texto>
        <View style={{ alignItems: 'flex-start', marginTop: spacing[1] }}>
          <Boton etiqueta="Aprobar y continuar" tamaño="sm" onPress={() => {}} />
        </View>
        <Separador />
        <FilaLabel glifo="veterinaria" texto="Ver su cita" dir="navega" />
        <FilaLabel glifo="paseo" texto="Ver el parte del paseo" dir="navega" />
        <Separador />
        <View style={{ alignItems: 'center', gap: spacing[1] }}>
          <FilaLabel texto="Ver 5 más" dir={gira ? 'revela' : 'navega'} />
          <FilaLabel texto="Ocultar" dir={gira ? 'pliega' : 'navega'} />
        </View>
      </View>
    </Tarjeta>
  )
}

// La Hoja 2: el fragmento de pantalla REAL del CUÁNDO — el selector de
// mascota (QUIÉN) conviviendo con duración y día (VALOR, control desde S58).
function EspecimenSelector({ acentoMascota }: { acentoMascota: 'capa' | 'control' }) {
  return (
    <View style={{ gap: spacing[4] }}>
      <SelectorOpcion
        acento={acentoMascota}
        etiqueta="¿Para quién es?"
        opciones={[
          { codigo: 'zeus', etiqueta: 'Zeus', adorno: <AvatarMascota nombre="Zeus" tamano="xs" /> },
          { codigo: 'thor', etiqueta: 'Thor', adorno: <AvatarMascota nombre="Thor" tamano="xs" /> },
        ]}
        seleccionada="zeus"
        onSelect={() => {}}
      />
      <SelectorOpcion
        acento="control"
        etiqueta="¿Cuánto tiempo?"
        opciones={[
          { codigo: '30', etiqueta: '30 min' },
          { codigo: '60', etiqueta: '1 hora' },
          { codigo: '120', etiqueta: '2 horas' },
        ]}
        seleccionada="60"
        onSelect={() => {}}
      />
      <SelectorOpcion
        acento="control"
        disposicion="tira"
        etiqueta="¿Qué día?"
        opciones={[
          { codigo: 'hoy', etiqueta: 'Hoy' },
          { codigo: 'mar', etiqueta: 'mar 22' },
          { codigo: 'mie', etiqueta: 'mié 23' },
          { codigo: 'jue', etiqueta: 'jue 24' },
        ]}
        seleccionada="mie"
        onSelect={() => {}}
      />
    </View>
  )
}

// La Hoja 3: el header de disponibles con el N=1 auto-elegido QUE SE DICE
// (avatar + nombre — la voz real grooming.ventanaPara del riel).
function EspecimenN1() {
  return (
    <Tarjeta relleno="ninguno">
      <Celda
        inicio={<AvatarMascota nombre="Zeus" tamano="xs" />}
        titulo="La cita de Zeus"
        metadataMono="2026-07-24"
        fin={<Texto variante="dato">09:00 · 60 min</Texto>}
      />
    </Tarjeta>
  )
}

function Hoja1() {
  return (
    <View testID="lamina-s73-hoja1" style={{ marginBottom: spacing[8] }}>
      <Texto variante="seccion">Hoja 1 — la anatomía 19.7: ¿el chevron GIRA o va derecho?</Texto>
      <NotaHoja>
        La fila con glifo NAVEGA (destinos que varían → glifo b′). El pie de sección no lleva glifo (no
        tiene hermanos). En A, la dirección dice el trabajo: › te vas · ⌄ se abre abajo · ⌃ se pliega. En
        B, el chevron es siempre › y la ley pierde su discriminador navega/ejecuta.
      </NotaHoja>
      {(['A · chevron QUE GIRA (propuesta de mesa)', 'B · chevron derecho SIEMPRE'] as const).map((titulo, i) => (
        <View key={titulo} style={{ marginBottom: spacing[5] }}>
          <NotaHoja>{titulo}</NotaHoja>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
            <ThemeProvider defaultMode="light" cta="tinta">
              <PanelLamina etiqueta="CLIENTE · claro (CTA tinta — el label es estructural)">
                <EspecimenAnatomia gira={i === 0} />
              </PanelLamina>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark" cta="tinta">
              <PanelLamina etiqueta="CLIENTE · oscuro">
                <EspecimenAnatomia gira={i === 0} />
              </PanelLamina>
            </ThemeProvider>
            <ThemeProvider defaultMode="light" cta="oficio">
              <PanelLamina etiqueta="PRESTADOR · claro (CTA tealDark — misma gramática, otra dosis)">
                <EspecimenAnatomia gira={i === 0} />
              </PanelLamina>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark" cta="oficio">
              <PanelLamina etiqueta="PRESTADOR · oscuro">
                <EspecimenAnatomia gira={i === 0} />
              </PanelLamina>
            </ThemeProvider>
          </View>
        </View>
      ))}
    </View>
  )
}

function Hoja2() {
  return (
    <View testID="lamina-s73-hoja2" style={{ marginBottom: spacing[8] }}>
      <Texto variante="seccion">Hoja 2 — el selector de mascota, en su pantalla</Texto>
      <NotaHoja>
        Lectura de mesa (declarada, no firmada): la distinción del canon es QUIÉN vs VALOR — elegir
        identidad (SelectorEspecie, la espec original) siempre fue capa.identidad; lo que S58 migró a
        control fueron los selectores de VALOR (duración/día/hora). Bajo esa lectura no hay acento
        duplicado: son dos trabajos con dos vestidos. Juzgala VIENDO la convivencia.
      </NotaHoja>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
        <ThemeProvider defaultMode="light" cta="tinta">
          <PanelLamina etiqueta="A · mascota en CONTROL (hoy) · claro — un solo acento para todo">
            <EspecimenSelector acentoMascota="control" />
          </PanelLamina>
        </ThemeProvider>
        <ThemeProvider defaultMode="light" cta="tinta">
          <PanelLamina etiqueta="B · mascota en CAPA.IDENTIDAD (letra) · claro — el QUIÉN se distingue del VALOR">
            <EspecimenSelector acentoMascota="capa" />
          </PanelLamina>
        </ThemeProvider>
        <ThemeProvider defaultMode="dark" cta="tinta">
          <PanelLamina etiqueta="A · control · oscuro">
            <EspecimenSelector acentoMascota="control" />
          </PanelLamina>
        </ThemeProvider>
        <ThemeProvider defaultMode="dark" cta="tinta">
          <PanelLamina etiqueta="B · capa.identidad · oscuro">
            <EspecimenSelector acentoMascota="capa" />
          </PanelLamina>
        </ThemeProvider>
      </View>
    </View>
  )
}

function Hoja3() {
  return (
    <View testID="lamina-s73-hoja3" style={{ marginBottom: spacing[8] }}>
      <Texto variante="seccion">Hoja 3 — el N=1 que se dice</Texto>
      <NotaHoja>
        Con UNA sola elegible no se pregunta, pero SE DICE: la auto-elegida visible con avatar y nombre
        antes de tocar nada (la cura del :254 de disponibles — antes elegía en silencio).
      </NotaHoja>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
        <ThemeProvider defaultMode="light" cta="tinta">
          <PanelLamina etiqueta="claro" ancho={420}>
            <EspecimenN1 />
          </PanelLamina>
        </ThemeProvider>
        <ThemeProvider defaultMode="dark" cta="tinta">
          <PanelLamina etiqueta="oscuro" ancho={420}>
            <EspecimenN1 />
          </PanelLamina>
        </ThemeProvider>
      </View>
    </View>
  )
}

/** La lámina entera — se monta como PRIMERA sección de la galería para el
 *  gate en dispositivo (viaja por OTA). Muere de la galería con la firma. */
export function LaminaS73() {
  const { theme } = useTheme()
  return (
    <View style={{ marginBottom: spacing[10] }}>
      <Text
        style={{
          fontFamily: sans.bold,
          fontSize: typography.size.md,
          color: theme.text.primary,
          marginBottom: spacing[2],
        }}
      >
        LÁMINA S73 — tres firmas en un gate
      </Text>
      <NotaHoja>
        (1) chevron que gira vs derecho · (2) acento del selector de mascota · (3) la voz del N=1. Tokens
        y componentes reales de packages/ui; los especímenes de anatomía son boceto del gate, no producto.
      </NotaHoja>
      <Hoja1 />
      <Hoja2 />
      <Hoja3 />
    </View>
  )
}
