/**
 * TokenGallery — herramienta de VERIFICACIÓN de B2 (no pantalla de producto).
 * Montada en /gallery de ambos apps. Muestra: paleta con hex, escala
 * tipográfica con la REGLA DE VOZ demostrada, espaciado/radios/sombras,
 * los 3 temas con toggle, isotipo en variantes y las dos cards de dosis.
 */

import { Pressable, ScrollView, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { useState } from 'react'

import { palette, gradients } from '../tokens/palette'
import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { useTheme } from '../ThemeProvider'
import { Isotipo } from '../brand/Isotipo'
import { Boton, type BotonVariante } from '../components/Boton'
import { Tarjeta, type TarjetaTinte } from '../components/Tarjeta'
import { Campo } from '../components/Campo'
import { Celda } from '../components/Celda'
import { Separador } from '../components/Separador'
import { Insignia } from '../components/Insignia'
import { Encabezado } from '../components/Encabezado'
import type { ThemeMode } from '../themes'

const sans = typography.family.sans
const mono = typography.family.mono

// ── swatch ────────────────────────────────────────────────────────────────────
function Swatch({ name, hex, border }: { name: string; hex: string; border?: boolean }) {
  const { theme } = useTheme()
  return (
    <View style={{ width: 104, marginBottom: spacing[3] }}>
      <View
        style={{
          height: 56,
          borderRadius: radius.sm,
          backgroundColor: hex,
          borderWidth: border ? 1 : 0,
          borderColor: theme.border.default,
        }}
      />
      <Text style={{ fontFamily: sans.medium, fontSize: typography.size.xs, color: theme.text.primary, marginTop: 4 }}>
        {name}
      </Text>
      <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>
        {hex.toLowerCase()}
      </Text>
    </View>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const { theme } = useTheme()
  return (
    <View style={{ marginBottom: spacing[10] }}>
      <Text
        style={{
          fontFamily: sans.bold,
          fontSize: typography.size.md,
          color: theme.text.primary,
          marginBottom: spacing[4],
        }}
      >
        {titulo}
      </Text>
      {children}
    </View>
  )
}

function Fila({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>{children}</View>
}

// campana de demo para la portada dueño (el slot accionDer es del consumidor)
function CampanaDemo() {
  const { theme } = useTheme()
  return (
    <View accessibilityLabel="Notificaciones — hay novedades">
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"
          stroke={theme.text.primary}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <View style={{ position: 'absolute', top: -1, right: -2 }}>
        <Insignia capa="comunidad" soloPunto etiqueta="Notificaciones nuevas" />
      </View>
    </View>
  )
}

// ── galería ───────────────────────────────────────────────────────────────────
export function TokenGallery() {
  const { theme, mode, setMode } = useTheme()
  const [cargandoDemo, setCargandoDemo] = useState(false)
  const esDark = mode === 'dark'
  const esMemorial = mode === 'memorial'
  // Capturados fuera de los callbacks: el narrowing de `in` no sobrevive closures
  const shadowLg = 'lg' in theme.shadow ? theme.shadow.lg : null
  const shadowGlow = 'glow' in theme.shadow ? theme.shadow.glow : null
  // B2.1 — dos registros: capaText para etiquetas; memorial (intacto) no lo tiene
  const capaTexto = 'capaText' in theme ? theme.capaText : theme.capa
  const accentActive = 'active' in theme.accent ? theme.accent.active : theme.accent.primary

  const modos: { key: ThemeMode; label: string }[] = [
    { key: 'light', label: 'Claro' },
    { key: 'dark', label: 'Oscuro' },
    { key: 'memorial', label: 'Memorial' },
  ]

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg.base }} contentContainerStyle={{ padding: spacing[6], paddingBottom: spacing[16] }}>
      <View style={{ width: '100%', maxWidth: 720, alignSelf: 'center' }}>

        {/* Header + toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[8], flexWrap: 'wrap', gap: spacing[4] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
            <Isotipo size={32} variant={esDark || esMemorial ? 'blanco' : 'tinta'} />
            <View>
              <Text style={{ fontFamily: sans.bold, fontSize: typography.size.lg, color: theme.text.primary }}>
                Design Tokens v4
              </Text>
              <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>
                s43-b2 · galería de verificación
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: theme.bg.elevated, borderRadius: radius.full, padding: 3, borderWidth: 1, borderColor: theme.border.default }}>
            {modos.map((m) => (
              <Pressable
                key={m.key}
                onPress={() => setMode(m.key)}
                style={{
                  paddingHorizontal: spacing[4],
                  paddingVertical: spacing[1.5],
                  borderRadius: radius.full,
                  backgroundColor: mode === m.key ? theme.text.primary : 'transparent',
                }}
              >
                <Text style={{ fontFamily: sans.medium, fontSize: typography.size.sm, color: mode === m.key ? theme.text.inverse : theme.text.secondary }}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Paleta */}
        <Seccion titulo="Paleta — marca canonizada (SVG del logo)">
          <Fila>
            <Swatch name="pink" hex={palette.pink} />
            <Swatch name="teal" hex={palette.teal} />
            <Swatch name="verdeVital" hex={palette.verdeVital} />
            <Swatch name="menta*" hex={palette.verde} />
            <Swatch name="amarillo*" hex={palette.amarillo} />
          </Fila>
          <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary, marginBottom: spacing[4] }}>
            *menta y amarillo = SOLO marca/logo. La capa Vida es verdeVital (B2.1).
          </Text>
          <Fila>
            <Swatch name="pinkDark" hex={palette.pinkDark} />
            <Swatch name="tealDark" hex={palette.tealDark} />
            <Swatch name="verdeVitalDark" hex={palette.verdeVitalDark} />
          </Fila>
          <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary, marginBottom: spacing[4] }}>
            Variantes AA para claro — validadas por scripts/verify-contrast.ts
          </Text>
          <Fila>
            <Swatch name="coral" hex={palette.coral} />
            <Swatch name="ochre" hex={palette.ochre} />
            <Swatch name="violet" hex={palette.violet} />
            <Swatch name="terracotta" hex={palette.terracotta} />
            <Swatch name="cream" hex={palette.cream} border />
            <Swatch name="sage" hex={palette.sage} />
            <Swatch name="rose" hex={palette.rose} />
          </Fila>
        </Seccion>

        {/* Tipografía */}
        <Seccion titulo="Tipografía — DM Sans única familia UI">
          {(
            [
              ['display', 'light'],
              ['hero', 'light'],
              ['4xl', 'light'],
              ['3xl', 'regular'],
              ['2xl', 'regular'],
              ['xl', 'regular'],
              ['lg', 'regular'],
              ['md', 'medium'],
              ['base', 'regular'],
              ['sm', 'regular'],
              ['xs', 'medium'],
            ] as const
          ).map(([size, weight]) => (
            <View key={size} style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing[3], marginBottom: spacing[2] }}>
              <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary, width: 64 }}>
                {size} · {typography.size[size]}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: sans[weight],
                  fontSize: typography.size[size],
                  lineHeight: typography.size[size] * typography.leading.tight,
                  color: theme.text.primary,
                  flexShrink: 1,
                }}
              >
                Zeus volvió feliz
              </Text>
            </View>
          ))}

          {/* Regla de voz demostrada */}
          <View style={{ backgroundColor: theme.bg.card, borderRadius: radius.md, padding: spacing[5], marginTop: spacing[5], borderWidth: 1, borderColor: theme.border.default }}>
            <Text style={{ fontFamily: sans.light, fontSize: typography.size.lg, lineHeight: typography.size.lg * typography.leading.snug, color: theme.text.primary }}>
              Buenos días, Guillermo. Zeus tuvo una gran semana.
            </Text>
            <Text style={{ fontFamily: mono.regular, fontSize: typography.size.sm, letterSpacing: typography.tracking.mono, color: theme.text.secondary, marginTop: spacing[3] }}>
              paseo #8f3a · 14:30 · 2.4 km · $12.50
            </Text>
            <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * typography.leading.normal, color: theme.text.secondary, marginTop: spacing[3] }}>
              Regla de voz: lo vivo habla en DM Sans (arriba: voz humana, 300 en lg). Lo que generó una
              máquina va en JetBrains Mono — minúsculas, tracking suave, sin transform. El vocabulario
              interno del modelo (M1..M7, IDs de capa) jamás se muestra.
            </Text>
          </View>
        </Seccion>

        {/* Espaciado */}
        <Seccion titulo="Espaciado — base 4, múltiplos estrictos">
          {([1, 2, 3, 4, 6, 8, 12, 16] as const).map((k) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginBottom: spacing[1.5] }}>
              <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary, width: 64 }}>
                {k} · {spacing[k]}px
              </Text>
              <View style={{ height: 12, width: spacing[k] * 3, backgroundColor: theme.accent.primary, borderRadius: radius.xs, opacity: 0.85 }} />
            </View>
          ))}
        </Seccion>

        {/* Radios */}
        <Seccion titulo="Radios">
          <Fila>
            {(['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full'] as const).map((k) => (
              <View key={k} style={{ alignItems: 'center', gap: spacing[1] }}>
                <View style={{ width: 64, height: 64, borderRadius: radius[k], backgroundColor: theme.bg.card, borderWidth: 1.5, borderColor: theme.accent.primaryBorder }} />
                <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>
                  {k} · {radius[k]}
                </Text>
              </View>
            ))}
          </Fila>
        </Seccion>

        {/* Sombras */}
        <Seccion titulo={esDark ? 'Sombras + glow (glow solo existe en dark)' : 'Sombras (sin glow fuera de dark)'}>
          <Fila>
            {(['sm', 'md'] as const).map((k) => (
              <View key={k} style={[{ width: 120, height: 72, borderRadius: radius.md, backgroundColor: theme.bg.card, alignItems: 'center', justifyContent: 'center' }, theme.shadow[k]]}>
                <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>{k}</Text>
              </View>
            ))}
            {shadowLg ? (
              <View style={[{ width: 120, height: 72, borderRadius: radius.md, backgroundColor: theme.bg.card, alignItems: 'center', justifyContent: 'center' }, shadowLg]}>
                <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>lg</Text>
              </View>
            ) : null}
            {shadowGlow
              ? (['teal', 'pink', 'verde'] as const).map((g) => (
                  <View key={g} style={[{ width: 120, height: 72, borderRadius: radius.md, backgroundColor: theme.bg.card, alignItems: 'center', justifyContent: 'center' }, shadowGlow[g]]}>
                    <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>glow {g}</Text>
                  </View>
                ))
              : null}
          </Fila>
        </Seccion>

        {/* Status — Insignia estado (B3.5) */}
        <Seccion titulo="Status — Insignia · familia estado">
          <Fila>
            <Insignia estado="alDia" etiqueta="Al día" />
            <Insignia estado="proximo" etiqueta="Vacuna próxima" />
            <Insignia estado="atencion" etiqueta="Atención" />
            <Insignia estado="info" etiqueta="Nota del vet" />
          </Fila>
          <View style={{ marginTop: spacing[3] }}>
            <Fila>
              <Insignia estado="alDia" etiqueta="sm" tamaño="sm" />
              <Insignia estado="info" etiqueta="md (default)" />
            </Fila>
          </View>
        </Seccion>

        {/* Capas — Insignia capa (B3.5) */}
        <Seccion titulo="Capas — Insignia · familia capa (dos registros cableados)">
          <Fila>
            <Insignia capa="vida" etiqueta="Vida" />
            <Insignia capa="cuidado" etiqueta="Cuidado" />
            <Insignia capa="comunidad" etiqueta="Comunidad" />
            <Insignia capa="comunidadAmplia" etiqueta="Comunidad amplia" />
          </Fila>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginTop: spacing[3] }}>
            <Insignia capa="vida" soloPunto etiqueta="Capa vida" />
            <Insignia capa="cuidado" soloPunto etiqueta="Capa cuidado" />
            <Insignia capa="comunidad" soloPunto etiqueta="Capa comunidad" />
            <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
              soloPunto — para celdas densas; la etiqueta sigue obligatoria (a11y)
            </Text>
          </View>
        </Seccion>

        {/* accentActive */}
        <Seccion titulo="Estado activo — accent.active (pink puro, un solo elemento por vista)">
          <View style={{ backgroundColor: theme.bg.card, borderRadius: radius.md, borderWidth: 1, borderColor: theme.border.default, padding: spacing[4] }}>
            <View style={{ flexDirection: 'row', gap: spacing[6] }}>
              {(['Hoy', 'Agenda', 'Perfil'] as const).map((tab, i) => (
                <View key={tab} style={{ alignItems: 'center', gap: spacing[1.5] }}>
                  <Text
                    style={{
                      fontFamily: i === 0 ? sans.medium : sans.regular,
                      fontSize: typography.size.base,
                      color: i === 0 ? theme.text.primary : theme.text.secondary,
                    }}
                  >
                    {tab}
                  </Text>
                  <View style={{ height: 3, alignSelf: 'stretch', borderRadius: radius.full, backgroundColor: i === 0 ? accentActive : 'transparent' }} />
                </View>
              ))}
            </View>
            <Text style={{ fontFamily: sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary, marginTop: spacing[3] }}>
              Subrayado de tab, selección, paso actual — registro gráfico, no porta texto.
            </Text>
          </View>
        </Seccion>

        {/* Botón — B3.1 */}
        <Seccion titulo="Botón — variantes × estados (presioná de verdad)">
          <View style={{ backgroundColor: theme.bg.card, borderRadius: radius.md, borderWidth: 1, borderColor: theme.border.default, padding: spacing[5], gap: spacing[5] }}>
            {(
              [
                ['primario', 'Iniciar atención'],
                ['marca', 'Agendar un paseo'],
                ['secundario', 'Ver detalle'],
                ['ghost', 'Cancelar'],
                ['destructivo', 'Eliminar mascota'],
              ] as const satisfies ReadonlyArray<readonly [BotonVariante, string]>
            ).map(([v, etiqueta]) => (
              <View key={v} style={{ gap: spacing[2] }}>
                <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary }}>
                  {v}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], alignItems: 'center' }}>
                  <Boton variante={v} etiqueta={etiqueta} onPress={() => {}} />
                  <Boton variante={v} etiqueta={etiqueta} deshabilitado onPress={() => {}} />
                  <Boton variante={v} etiqueta={etiqueta} cargando={cargandoDemo} onPress={() => {}} />
                </View>
              </View>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
              <Boton
                variante="secundario"
                tamaño="sm"
                etiqueta={cargandoDemo ? 'Apagar loading' : 'Prender loading'}
                onPress={() => setCargandoDemo((x) => !x)}
              />
              <Text style={{ fontFamily: sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary, flexShrink: 1 }}>
                default · disabled · loading (el spinner respeta la regla de 150ms y no mueve el layout)
              </Text>
            </View>
            <View style={{ gap: spacing[3] }}>
              <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary }}>
                tamaños · sm 36 / md 48 / lg 56
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], alignItems: 'center' }}>
                <Boton variante="primario" tamaño="sm" etiqueta="Pequeño" onPress={() => {}} />
                <Boton variante="primario" tamaño="md" etiqueta="Mediano" onPress={() => {}} />
                <Boton variante="primario" tamaño="lg" etiqueta="Grande" onPress={() => {}} />
              </View>
              <Boton variante="primario" etiqueta="Bloque — full width" bloque onPress={() => {}} />
            </View>
          </View>
        </Seccion>

        {/* Tarjeta — B3.2 */}
        <Seccion titulo="Tarjeta — superficie contenedora">
          <View style={{ gap: spacing[4] }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4] }}>
              {(['plana', 'sm', 'md'] as const).map((e) => (
                <Tarjeta key={e} elevacion={e}>
                  <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>
                    elevacion {e}
                  </Text>
                  <Text style={{ fontFamily: sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
                    Contenido libre
                  </Text>
                </Tarjeta>
              ))}
            </View>

            {(
              [
                ['warning', 'Vacuna próxima', theme.status.warningText],
                ['danger', 'Necesita atención', theme.status.dangerText],
                ['success', 'Todo al día', theme.status.successText],
                ['vida', 'Salud de Zeus', capaTexto.identidad],
                ['cuidado', 'Paseo agendado', capaTexto.cuidado],
                ['comunidad', '3 amigos nuevos', capaTexto.comunidad],
              ] as const satisfies ReadonlyArray<readonly [TarjetaTinte, string, string]>
            ).map(([tinte, texto, colorTexto]) => (
              <Tarjeta key={tinte} tinte={tinte}>
                <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: colorTexto, opacity: 0.7 }}>
                  tinte {tinte}
                </Text>
                <Text style={{ fontFamily: sans.medium, fontSize: typography.size.base, color: colorTexto }}>
                  {texto}
                </Text>
              </Tarjeta>
            ))}

            <Tarjeta interactiva onPress={() => {}} accessibilityRole="button" etiqueta="Abrir la atención de Zeus">
              <Text style={{ fontFamily: sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
                Interactiva — presioname
              </Text>
              <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                Scale 0.99 con la misma receta del Boton
              </Text>
            </Tarjeta>

            <Tarjeta relleno="ninguno">
              <View style={{ height: 96, backgroundColor: theme.capa.cuidado, opacity: 0.35 }} />
              <View style={{ padding: spacing[3] }}>
                <Text style={{ fontFamily: sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
                  relleno=ninguno — imagen edge-to-edge (el bloque simula la foto)
                </Text>
              </View>
            </Tarjeta>
          </View>
        </Seccion>

        {/* Campo — B3.3 */}
        <Seccion titulo="Campo — tocá para ver el foco (nada se anima al tipear)">
          <View style={{ backgroundColor: theme.bg.card, borderRadius: radius.md, borderWidth: 1, borderColor: theme.border.default, padding: spacing[5] }}>
            <Campo label="Nombre de la mascota" placeholder="ej: Zeus" />
            <Campo label="Con ayuda" placeholder="ej: 8 kg" ayuda="El peso aparece en el carnet" keyboardType="numeric" />
            <Campo label="Con error" defaultValue="zeus@" error="Ese correo no parece completo" />
            <Campo label="Deshabilitado" defaultValue="No editable" deshabilitado />
            <Campo label="Contraseña" placeholder="mínimo 8 caracteres" secure />
            <Campo
              label="Con iconos"
              placeholder="Buscar veterinaria"
              iconoIzq={<View style={{ width: 16, height: 16, borderRadius: radius.full, borderWidth: 2, borderColor: theme.text.tertiary }} />}
            />
            <Campo label="Notas (multilínea, alto fijo)" placeholder="Observaciones del paseo…" multilinea={3} />
          </View>

          {/* Tercer ensamble del sistema: Campo + Boton dentro de Tarjeta */}
          <View style={{ marginTop: spacing[4] }}>
            <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary, marginBottom: spacing[2] }}>
              ensamble · registrar mascota
            </Text>
            <Tarjeta elevacion="sm" relleno="amplio">
              <Text style={{ fontFamily: sans.bold, fontSize: typography.size.lg, color: theme.text.primary, marginBottom: spacing[4] }}>
                Registrá a tu mascota
              </Text>
              <Campo label="Nombre" placeholder="ej: Zeus" autoCapitalize="words" />
              <Campo label="Notas" placeholder="Lo que su cuidador debería saber…" multilinea={3} />
              <Boton variante="primario" etiqueta="Guardar" bloque onPress={() => {}} />
            </Tarjeta>
          </View>
        </Seccion>

        {/* Celda — B3.4 */}
        <Seccion titulo="Celda — la fila de lista (el pressed resalta, no escala)">
          <View style={{ gap: spacing[4] }}>
            <Tarjeta relleno="ninguno">
              <Celda
                titulo="Normal con punto de capa"
                subtitulo="Subtítulo en secondary"
                inicio={<Insignia capa="cuidado" soloPunto etiqueta="Capa cuidado" />}
                fin={<Insignia estado="alDia" etiqueta="Al día" tamaño="sm" />}
              />
              <Separador indentacion={spacing[3] + 10 + spacing[3]} />
              <Celda titulo="Con metadata mono" subtitulo="La voz de máquina, cableada" metadataMono="17:30 · 45 MIN" />
              <Separador indentacion={spacing[3]} />
              <Celda densidad="compacta" titulo="Compacta (mín 48)" metadataMono="#8f3a" />
              <Separador indentacion={spacing[3]} />
              <Celda
                interactiva
                onPress={() => {}}
                accessibilityRole="button"
                titulo="Interactiva — mantené presionado"
                subtitulo="El fondo resalta con bg.overlay, la fila no escala"
              />
              <Separador indentacion={spacing[3]} />
              <Celda
                titulo="Un título absurdamente largo que tiene que truncar en una sola línea sin romper nada"
                subtitulo="Y un subtítulo igual de charlatán que puede usar hasta dos líneas completas antes de cortarse con ellipsis como corresponde en una lista real"
                metadataMono="10:00"
              />
            </Tarjeta>
          </View>
        </Seccion>

        {/* Ensamble: Agenda de hoy — la pantalla del prestador en embrión */}
        <Seccion titulo="Ensamble — Agenda de hoy (dosis baja, componentes 100% reales)">
          <Tarjeta elevacion="sm" relleno="ninguno">
            <View style={{ padding: spacing[4], paddingBottom: spacing[2] }}>
              <Text style={{ fontFamily: sans.bold, fontSize: typography.size.lg, color: theme.text.primary }}>
                Agenda de hoy
              </Text>
              <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary }}>
                mar 7 jul · 3 citas
              </Text>
            </View>
            <Celda
              interactiva
              onPress={() => {}}
              accessibilityRole="button"
              titulo="Zeus"
              subtitulo="Paseo · familia González"
              inicio={<Insignia capa="cuidado" soloPunto etiqueta="Capa cuidado" />}
              metadataMono="17:30 · 45 min"
            />
            <Separador indentacion={spacing[3] + 10 + spacing[3]} />
            <Celda
              interactiva
              onPress={() => {}}
              accessibilityRole="button"
              titulo="Pati"
              subtitulo="Grooming · baño y corte"
              inicio={<Insignia capa="cuidado" soloPunto etiqueta="Capa cuidado" />}
              metadataMono="jue · 10:00"
            />
            <Separador indentacion={spacing[3] + 10 + spacing[3]} />
            <Celda
              interactiva
              onPress={() => {}}
              accessibilityRole="button"
              titulo="Rocky"
              subtitulo="Primera visita — la familia pide que el paseador tenga experiencia con perros grandes y ansiosos"
              inicio={<Insignia capa="cuidado" soloPunto etiqueta="Capa cuidado" />}
              metadataMono="vie · 09:15"
            />
            <View style={{ padding: spacing[4], paddingTop: spacing[3] }}>
              <Boton variante="primario" etiqueta="Ver toda la agenda" bloque onPress={() => {}} />
            </View>
          </Tarjeta>
        </Seccion>

        {/* Encabezado — B3.6 */}
        <Seccion titulo="Encabezado — navegación y portada">
          <View style={{ gap: spacing[4] }}>
            {[
              { k: 'solo', atras: false, accion: false, divisor: false, titulo: 'Solo título' },
              { k: 'atras', atras: true, accion: false, divisor: false, titulo: 'Con atrás (centrado óptico)' },
              { k: 'ambos', atras: true, accion: true, divisor: false, titulo: 'Atrás + acción' },
              { k: 'divisor', atras: false, accion: false, divisor: true, titulo: 'Con divisor' },
            ].map((c) => (
              <View key={c.k} style={{ borderWidth: 1, borderColor: theme.border.default, borderRadius: radius.md, overflow: 'hidden' }}>
                {c.atras ? (
                  <Encabezado
                    variante="navegacion"
                    titulo={c.titulo}
                    atras
                    onAtras={() => {}}
                    divisor={c.divisor}
                    accionDer={c.accion ? <Insignia estado="info" etiqueta="2" tamaño="sm" /> : undefined}
                  />
                ) : (
                  <Encabezado variante="navegacion" titulo={c.titulo} divisor={c.divisor} />
                )}
              </View>
            ))}

            <View style={{ borderWidth: 1, borderColor: theme.border.default, borderRadius: radius.md, overflow: 'hidden' }}>
              <Encabezado
                variante="portada"
                isotipo={esDark || esMemorial ? 'gradiente' : 'tinta'}
                saludo="Buen día, Marcela."
                subtitulo="Dos atenciones hoy."
              />
            </View>
            <View style={{ borderWidth: 1, borderColor: theme.border.default, borderRadius: radius.md, overflow: 'hidden' }}>
              <Encabezado
                variante="portada"
                isotipo="gradiente"
                saludo="Zeus está listo."
                subtitulo="Su paseo empieza en 20 minutos."
                accionDer={<CampanaDemo />}
              />
            </View>
          </View>
        </Seccion>

        {/* ENSAMBLE MAYOR — pantalla embrión del prestador */}
        <Seccion titulo="Pantalla embrión — prestador (portada + agenda + CTA)">
          <View style={{ borderWidth: 1, borderColor: theme.border.default, borderRadius: radius['2xl'], overflow: 'hidden', backgroundColor: theme.bg.base }}>
            <Encabezado
              variante="portada"
              isotipo="tinta"
              saludo="Buen día, Marcela."
              subtitulo="Dos atenciones hoy."
            />
            <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[6], gap: spacing[4] }}>
              <Tarjeta elevacion="sm" relleno="ninguno">
                <View style={{ padding: spacing[4], paddingBottom: spacing[2] }}>
                  <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary }}>
                    hoy · 2 citas
                  </Text>
                </View>
                <Celda
                  interactiva
                  onPress={() => {}}
                  accessibilityRole="button"
                  titulo="Zeus"
                  subtitulo="Paseo · familia González"
                  inicio={<Insignia capa="cuidado" soloPunto etiqueta="Capa cuidado" />}
                  metadataMono="17:30 · 45 min"
                />
                <Separador indentacion={spacing[3] + 10 + spacing[3]} />
                <Celda
                  interactiva
                  onPress={() => {}}
                  accessibilityRole="button"
                  titulo="Pati"
                  subtitulo="Grooming · baño y corte"
                  inicio={<Insignia capa="cuidado" soloPunto etiqueta="Capa cuidado" />}
                  metadataMono="19:00"
                />
              </Tarjeta>
              <Boton variante="primario" etiqueta="Iniciar la primera atención" bloque onPress={() => {}} />
            </View>
          </View>
          <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary, marginTop: spacing[3] }}>
            Portada + Tarjeta + Celdas + Separador + Insignia + Boton — todo real, cero Views a mano.
          </Text>
        </Seccion>

        {/* Isotipo */}
        <Seccion titulo="Isotipo — 24 / 32 / 48 / 96">
          <View style={{ backgroundColor: theme.bg.card, borderRadius: radius.md, padding: spacing[5], borderWidth: 1, borderColor: theme.border.default, gap: spacing[5] }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing[6], flexWrap: 'wrap' }}>
              {[24, 32, 48, 96].map((s) => (
                <Isotipo key={s} size={s} variant={esDark || esMemorial ? 'blanco' : 'tinta'} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing[6], flexWrap: 'wrap' }}>
              {[24, 32, 48, 96].map((s) => (
                <Isotipo key={s} size={s} variant="gradiente" />
              ))}
            </View>
            <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
              Gradiente de 6 stops = SOLO splash/logo (gradientLogo). En UI, el gradiente firma v2 es de 3 stops (violeta dominante al centro).
            </Text>
          </View>
        </Seccion>

        {/* Dosis */}
        <Seccion titulo="Dosificación asimétrica — una marca, dos dosis">
          <View style={{ gap: spacing[5] }}>
            {/* Prestador — dosis baja: primer ensamble Tarjeta+Boton del sistema */}
            <Tarjeta elevacion="sm" relleno="amplio">
              <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary, marginBottom: spacing[2] }}>
                prestador · dosis baja
              </Text>
              <View style={{ marginBottom: spacing[3] }}>
                <Insignia capa="cuidado" etiqueta="Grooming · hoy" />
              </View>
              <Text style={{ fontFamily: sans.bold, fontSize: typography.size.lg, color: theme.text.primary, marginBottom: spacing[1] }}>Zeus — 15:00</Text>
              <Text style={{ fontFamily: sans.regular, fontSize: typography.size.base, color: theme.text.secondary, marginBottom: spacing[4] }}>
                Baño y corte · familia González
              </Text>
              <Boton variante="primario" etiqueta="Iniciar atención" bloque onPress={() => {}} />
              <Text style={{ fontFamily: sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary, marginTop: spacing[2] }}>
                Un acento de capa por vista · CTA en tinta · Tarjeta plana+sm real
              </Text>
            </Tarjeta>

            {/* Dueño — dosis alta: tintes reales en las mini-cards */}
            <Tarjeta elevacion="sm" relleno="amplio">
              <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary, marginBottom: spacing[2] }}>
                dueño · dosis alta
              </Text>
              <Text style={{ fontFamily: sans.light, fontSize: typography.size.xl, lineHeight: typography.size.xl * typography.leading.snug, color: theme.text.primary, marginBottom: spacing[3] }}>
                Zeus tuvo una gran semana
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing[2], marginBottom: spacing[4], flexWrap: 'wrap' }}>
                <Insignia capa="vida" etiqueta="Salud al día" />
                <Insignia capa="cuidado" etiqueta="Paseo hoy" />
                <Insignia capa="comunidad" etiqueta="3 amigos nuevos" />
              </View>
              <Boton
                variante="marca"
                etiqueta={esMemorial ? 'Recordar a Zeus' : 'Agendar un paseo'}
                bloque
                onPress={() => {}}
              />
              <Text style={{ fontFamily: sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary, marginTop: spacing[2] }}>
                Capas visibles · gradiente firma solo en contextos cerrados{esMemorial ? ' · en memorial el gradiente no existe' : ''}
              </Text>
            </Tarjeta>
          </View>
        </Seccion>

        <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary }}>
          tema activo: {mode} · gradiente ui: {gradients.firmaUILight.angle}deg
        </Text>
      </View>
    </ScrollView>
  )
}
