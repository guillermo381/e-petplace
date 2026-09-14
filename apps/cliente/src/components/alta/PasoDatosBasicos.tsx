import { useEffect, useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Boton,
  Cabecera,
  Campo,
  CampoFecha,
  EvitaTeclado,
  Personaje,
  caraDePersonaje,
  SelectorOpcion,
  Texto,
  spacing,
  useTheme,
  type CampoFechaValor,
  type EspeciePersonaje,
} from '@epetplace/ui'
import { obtenerEspeciesActivas } from '@epetplace/api'

import { useTraduccion } from '@/i18n'
import { CODIGO_NO_SE, SelectorDeRaza, type RazaElegida } from '@/components/selector-de-raza'
import { esAcuario, esOrigen, TIPOS_DE_AGUA, type BorradorAlta, type ModoAlta } from './tipos'

/**
 * 07 · DATOS BÁSICOS — paso 1 de 3 (S116-C lote 3).
 *
 * ☠️ **ABSORBE `PasoEspecie`, `PasoRaza` y `PasoHistoria`**, que mueren con
 * lápida. *Los tres preguntaban lo mismo —quién es este animal— repartido en
 * tres pantallas, y ninguna sola justificaba un paso.*
 *
 * ── LO QUE SE CONSERVA DE LOS TRES, y es la mitad del trabajo ─────────────
 *   · **el catálogo vivo de especies** (`obtenerEspeciesActivas`) y su voz
 *     cuando cae — *una grilla vacía sería un dato ausente disfrazado*.
 *   · **la cláusula del pez**: con acuario el «campo dos» es el TIPO DE AGUA
 *     en espejo de la raza, y el nombre es el del acuario.
 *   · **el selector de raza con autocompletado** sobre `cat_razas`, con su
 *     «No sé» — la raza es libre: el catálogo sugiere, el dueño confirma.
 *   · **la fecha con PRECISIÓN** (día · mes/año · sólo año) y **`sexo` y
 *     `origen`**, que la RPC recibe (`p_sexo`/`p_origen`, medido).
 *
 * ── 🔴 LO QUE SE PIERDE, DICHO ───────────────────────────────────────────
 * **La sugerencia de raza por foto.** Su condición era el orden viejo
 * (*«sin foto no hay nada que mirar»*, S113-C): la foto iba antes que la raza.
 * El encargo firma raza en 07 y foto en 08 ⇒ **en el alta, esa sugerencia se
 * queda sin insumo.** El selector con autocompletado —que siempre fue el
 * camino principal— no cambia. *Se declara en vez de dejar el hueco.*
 *
 * ── LA LEY DEL FOUNDER SOBRE LO QUE NO SE SABE, en esta pantalla ─────────
 * El nacimiento acepta **día, mes/año o sólo año** y la fila dice lo que
 * tiene; el peso y la raza son **opcionales** y lo que no se sabe **viaja
 * NULL**. *Nada se rellena con un valor plausible para que el formulario se
 * vea completo.*
 */
/* ✅ **LA TABLA DE B REEMPLAZA A MI GUARD** (pedido 7 del buzón).
   `caraDePersonaje` vive en `packages/ui` y es la MISMA que usa el avatar, así
   que el dato dejó de estar en dos lugares — que era el punto del pedido.

   🔴 **Devuelve `undefined` y NO `'otro'`, a propósito, y B tenía razón en no
   ponerle el fallback adentro:** las especies sin cara propia siguen al
   MONOGRAMA, no a la nariz —*«un pez con cara de nariz genérica afirmaría
   menos que su propia inicial»*—, y un `?? 'otro'` escondido en la pieza
   borraba ese criterio para todos sus llamadores, incluido el avatar.
   ⇒ **acá el fallback es legítimo y va a la vista**: esta grilla es un
   SELECTOR y cada opción necesita una imagen tocable; un monograma sin nombre
   todavía no tiene qué decir. */
export function PasoDatosBasicos({
  modo,
  borrador,
  onAvanzar,
  onAtras,
}: {
  modo: ModoAlta
  borrador: BorradorAlta
  onAvanzar: (parcial: BorradorAlta) => void
  onAtras: () => void
}) {
  const { theme } = useTheme()
  const { t } = useTraduccion()
  const insets = useSafeAreaInsets()

  const [especie, setEspecie] = useState<string | undefined>(borrador.especie)
  const [nombre, setNombre] = useState(borrador.nombre ?? '')
  const [raza, setRaza] = useState<RazaElegida>({
    raza: borrador.raza,
    slug: borrador.razaSlug,
    elegido: borrador.razaSlug,
  })
  const [agua, setAgua] = useState<string | undefined>(borrador.raza)
  const [fecha, setFecha] = useState<CampoFechaValor | undefined>(
    borrador.fecha !== undefined &&
      (borrador.precision === 'exacta' ||
        borrador.precision === 'aproximada' ||
        borrador.precision === 'estimada')
      ? { fecha: borrador.fecha, precision: borrador.precision }
      : undefined,
  )
  const [peso, setPeso] = useState(borrador.peso ?? '')
  const [sexo, setSexo] = useState<string | undefined>(borrador.sexo)
  const [origen, setOrigen] = useState<string | undefined>(borrador.origen)

  /** Las especies vienen del catálogo, no de una lista escrita acá. */
  const [especies, setEspecies] = useState<{ codigo: string; nombre: string }[] | null>(null)
  const [errorCatalogo, setErrorCatalogo] = useState<string | undefined>(undefined)

  useEffect(() => {
    let vigente = true
    void (async () => {
      const r = await obtenerEspeciesActivas()
      if (!vigente) return
      /* 🔴 **ACÁ EL SILENCIO NO ES LEGÍTIMO** y por eso habla: sin catálogo la
         grilla queda vacía, y una grilla vacía se lee como «no hay especies»
         —un dato ausente disfrazado de respuesta— (`L-178`). */
      if (!r.ok) {
        setErrorCatalogo(r.mensaje)
        return
      }
      /* El NOMBRE sale del catálogo, no de un diccionario paralelo: la DB ya
         tiene su voz y dos listas de lo mismo divergen. */
      setEspecies(r.data.map((e) => ({ codigo: e.codigo, nombre: e.nombre })))
    })()
    return () => {
      vigente = false
    }
  }, [])

  const acuario = esAcuario(especie)

  /** El campo dos: raza para todos, tipo de agua para el acuario. */
  const campoDosListo = acuario ? agua !== undefined : true
  const puedeAvanzar = especie !== undefined && nombre.trim().length > 0 && campoDosListo

  const razon = useMemo(() => {
    if (especie === undefined) return t('alta.razonEspecie')
    if (nombre.trim().length === 0) return t('alta.razonNombre')
    if (!campoDosListo) return t('alta.razonAgua')
    return undefined
  }, [especie, nombre, campoDosListo, t])

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Cabecera
        variante="empujada"
        antetitulo={t('alta.nuevaMascota')}
        titulo={t('alta.pasoDatosTitulo')}
        onVolver={onAtras}
        etiquetaVolver={t('alta.volver')}
        /* La barra de pasos la dibuja la propia `Cabecera` — no se redibuja
           acá (su contrato lo dice). 1-based: el paso, no el índice. */
        pasos={{ total: 3, actual: 1, etiqueta: t('alta.paso', { actual: 1, total: 3 }) }}
      />

      <EvitaTeclado>
        <ScrollView
          contentContainerStyle={{
            padding: spacing[5],
            paddingBottom: insets.bottom + spacing[10],
            gap: spacing[6],
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── ESPECIE ─────────────────────────────────────────────────── */}
          <View style={{ gap: spacing[3] }}>
            <Texto variante="antetitulo">{t('alta.especieRotulo')}</Texto>
            {errorCatalogo !== undefined ? (
              <Texto variante="cuerpo" color="danger">
                {errorCatalogo}
              </Texto>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
                {(especies ?? []).map((e) => (
                  <View key={e.codigo} style={{ alignItems: 'center', gap: spacing[1], width: '30%' }}>
                    <Personaje
                      especie={caraDePersonaje(e.codigo) ?? 'otro'}
                      tamano="selector"
                      fondo="rosa"
                      elegido={especie === e.codigo}
                    />
                    <Boton
                      variante={especie === e.codigo ? 'primario' : 'apoyada'}
                      tamaño="sm"
                      etiqueta={e.nombre}
                      onPress={() => setEspecie(e.codigo)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── DATOS ───────────────────────────────────────────────────── */}
          <View style={{ gap: spacing[4] }}>
            <Texto variante="antetitulo">{t('alta.datosRotulo')}</Texto>

            <Campo
              label={acuario ? t('alta.nombreAcuarioLabel') : t('alta.nombreLabel')}
              placeholder={t('alta.nombrePlaceholder')}
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
            />

            {/* El campo dos, modulado por la cláusula del pez. */}
            {acuario ? (
              <View style={{ gap: spacing[2] }}>
                <SelectorOpcion
                  etiqueta={t('alta.aguaLabel')}
                  opciones={TIPOS_DE_AGUA.map((a) => ({
                    codigo: a,
                    etiqueta: t(`alta.agua_${a}` as 'alta.agua_dulce'),
                  }))}
                  seleccionada={agua}
                  onSelect={setAgua}
                />
              </View>
            ) : especie !== undefined ? (
              <SelectorDeRaza especie={especie} valor={raza} onCambio={setRaza} />
            ) : null}

            {/* La fecha con su precisión — la pieza ya resuelve los tres
                registros (día · mes/año · año) y dice lo que tiene. */}
            <CampoFecha
              label={t('alta.nacimientoLabel')}
              valor={fecha}
              onChange={setFecha}
              tituloHoja={t('alta.nacimientoLabel')}
            />

            <Campo
              label={t('alta.pesoLabel')}
              ayuda={t('alta.pesoAyuda')}
              placeholder={t('alta.pesoPlaceholder')}
              value={peso}
              onChangeText={setPeso}
              keyboardType="decimal-pad"
            />

            <View style={{ gap: spacing[2] }}>
              <SelectorOpcion
                etiqueta={t('alta.sexoLabel')}
                opciones={[
                  { codigo: 'macho', etiqueta: t('alta.sexoMacho') },
                  { codigo: 'hembra', etiqueta: t('alta.sexoHembra') },
                ]}
                seleccionada={sexo}
                onSelect={setSexo}
              />
            </View>

            <View style={{ gap: spacing[2] }}>
              <SelectorOpcion
                etiqueta={t('alta.origenLabel')}
                disposicion="tira"
                opciones={[
                  { codigo: 'adoptado', etiqueta: t('alta.origen_adoptado') },
                  { codigo: 'refugio', etiqueta: t('alta.origen_refugio') },
                  { codigo: 'nacido_en_casa', etiqueta: t('alta.origen_nacido_en_casa') },
                  { codigo: 'encontrado', etiqueta: t('alta.origen_encontrado') },
                  { codigo: 'criadero', etiqueta: t('alta.origen_criadero') },
                ]}
                seleccionada={origen}
                onSelect={setOrigen}
              />
            </View>
          </View>

          <Texto variante="apoyo" color="secondary">
            {t('alta.datosNota')}
          </Texto>
        </ScrollView>
      </EvitaTeclado>

      {/* EL CTA FIJO ABAJO — lo único fijo en una empujada (firma de mesa). */}
      <View
        style={{
          paddingHorizontal: spacing[5],
          paddingBottom: insets.bottom + spacing[4],
          paddingTop: spacing[3],
        }}
      >
        <Boton
          variante="primario"
          bloque
          etiqueta={t('alta.guardarYCrear')}
          deshabilitado={!puedeAvanzar}
          razonDeshabilitado={razon}
          onPress={() =>
            onAvanzar({
              especie,
              nombre: nombre.trim(),
              /* El acuario guarda el tipo de agua en el MISMO campo que la
                 raza: el cierre lo traduce a `tipo_agua`. Es el contrato que
                 ya existía y no se cambia. */
              ...(acuario
                ? agua !== undefined
                  ? { raza: agua }
                  : null
                : raza.raza !== undefined && raza.raza !== CODIGO_NO_SE
                  ? { raza: raza.raza, ...(raza.slug ? { razaSlug: raza.slug } : null) }
                  : null),
              ...(fecha ? { fecha: fecha.fecha, precision: fecha.precision } : null),
              ...(peso.trim().length > 0 ? { peso: peso.trim() } : null),
              ...(sexo !== undefined ? { sexo } : null),
              ...(esOrigen(origen) ? { origen } : null),
            })
          }
        />
      </View>
    </View>
  )
}
