import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Boton,
  Cabecera,
  Campo,
  CampoFecha,
  EvitaTeclado,
  HojaContenido,
  Personaje,
  caraDePersonaje,
  SelectorOpcion,
  Texto,
  spacing,
  useTheme,
  type CampoFechaValor,
  type EspeciePersonaje,
} from '@epetplace/ui'
import { obtenerEspeciesActivas, obtenerRazasDeEspecie, sugerirRaza } from '@epetplace/api'

import { leerBase64 } from '@/lib/subir-avatar'
import { useAltoDeCabecera } from '@/lib/alto-de-cabecera'
import { useTraduccion } from '@/i18n'
import { CODIGO_NO_SE, SelectorDeRaza, type RazaElegida } from '@/components/selector-de-raza'
import { esAcuario, esOrigen, TIPOS_DE_AGUA, type BorradorAlta, type ModoAlta } from './tipos'

/**
 * 07 · DATOS BÁSICOS — **paso 2 de 3** (S116-C lote 6: el alta se invirtió;
 *      antes era el 1). La foto ya está tomada cuando esta pantalla se monta,
 *      y eso es lo que le devuelve el insumo a la sugerencia de raza.
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
 * ── ⭐ S116-C lote 6 · LA SUGERENCIA DE RAZA VUELVE ──────────────────────
 * ⏪ **Acá vivía su lápida**, escrita por mí en el lote 3: *«su condición era
 * el orden viejo —sin foto no hay nada que mirar—; el encargo firma raza en 07
 * y foto en 08 ⇒ esa sugerencia se queda sin insumo»*. Era cierto, y era el
 * costo del orden anterior.
 *
 * **El alta se invirtió** (foto 1/3 → datos 2/3) ⇒ **cuando esta pantalla se
 * monta, la foto YA existe**. La sugerencia no se reescribe: se vuelve a
 * enchufar. *La lápida se conserva convertida en su propia resurrección, para
 * que se lea por qué murió y por qué volvió.*
 *
 * ── CÓMO SE COMPORTA, y cada regla es una decisión ──────────────────────
 *   · **Dispara al ELEGIR LA ESPECIE, no al montar.** El motor la EXIGE
 *     (`sugerirRaza` la manda en el cuerpo y la edge filtra `cat_razas` con
 *     ella): sin especie no hay nada que preguntar.
 *   · **PRE-SELECCIONA, jamás decide.** Escribe la candidata en el mismo
 *     estado que el selector — o sea que se ve exactamente igual que si la
 *     hubiera elegido la persona, y se cambia igual. *Una sugerencia que no
 *     se puede tocar es una imposición con buenos modales.*
 *   · **No pisa lo que la persona ya eligió**: si vuelve atrás y cambia de
 *     especie, la anterior sugerencia se limpia; si YA escribió una raza, la
 *     sugerencia no la toca.
 *   · **Sólo con confianza `alta`.** El motor devuelve candidatas con su
 *     confianza; pre-seleccionar una `baja` es poner en el formulario un dato
 *     que probablemente hay que corregir, y **corregir cuesta más que
 *     elegir**. Con `media`/`baja` no se pre-selecciona nada.
 *   · **`mestizo` y `sin_animal` NO pre-seleccionan.** Son respuestas
 *     legítimas del motor y ninguna de las dos es una raza del catálogo.
 *   · **El fallo es MUDO a propósito, y es la única mudez legítima de esta
 *     pantalla.** El camino principal —el selector con autocompletado— sigue
 *     entero; un aviso de que «no pudimos mirar la foto» le pediría a la
 *     familia que se haga cargo de algo que no pidió. *Distinto del catálogo
 *     de especies, que sí habla al caer: ahí sin el dato no hay pantalla.*
 *
 * ⚠️ **LA ESPECIE NO SE SUGIERE, y no es un olvido:** la edge la EXIGE como
 * entrada (su prompt dice *«la especie está DECLARADA por la persona»*), así
 * que sabe decir «eso no es un perro» pero no qué es. Pedido a A/D en
 * `docs/loop/buzon/S116-C-para-A-la-especie-tambien-desde-la-foto.md`.
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
  /* El inset SIGUE HACIENDO FALTA: el CTA fijo vive FUERA de la hoja, y
     quien está fuera de la hoja paga su propio inset. Lo que se retiró es el
     del scroll, que ahora paga `HojaContenido`. */
  const insets = useSafeAreaInsets()
  const cabecera = useAltoDeCabecera('empujada')

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

  /* ⭐ **LA SUGERENCIA DE RAZA POR FOTO** (ver la cabecera). `undefined` = no
     se preguntó; `'mirando'` = está en vuelo; `null` = se preguntó y no hubo
     candidata utilizable. **Son tres estados y no dos**: «todavía no» y «no
     hay» se dibujan distinto, y colapsarlos pondría la línea de la sugerencia
     sobre una foto que nadie miró (`L-178` en su forma chica). */
  const [sugerida, setSugerida] = useState<'mirando' | { raza: string; slug: string } | null | undefined>(
    undefined,
  )

  useEffect(() => {
    /* Las tres condiciones son de DATO, no de piel:
         · la especie la exige el motor;
         · sin foto no hay nada que mirar (la razón original, S113-C);
         · el acuario no tiene raza — su campo dos es el tipo de agua. */
    if (especie === undefined || borrador.fotoUri === undefined || esAcuario(especie)) {
      setSugerida(undefined)
      return
    }
    let vigente = true
    setSugerida('mirando')
    void (async () => {
      try {
        const base64 = await leerBase64(borrador.fotoUri as string)
        const r = await sugerirRaza({ imageBase64: base64, especie })
        if (!vigente) return
        /* `mestizo` y `sin_animal` son respuestas legítimas y ninguna es una
           raza del catálogo ⇒ no pre-seleccionan. */
        if (!r.ok || r.data.mestizo || r.data.sin_animal) {
          setSugerida(null)
          return
        }
        /* **Sólo `alta`.** Ver la cabecera: corregir cuesta más que elegir. */
        const mejor = r.data.candidatas.find((c) => c.confianza === 'alta')
        if (mejor === undefined) {
          setSugerida(null)
          return
        }
        /* El NOMBRE sale del catálogo de la especie, no de un diccionario
           paralelo: el motor devuelve un CÓDIGO y la voz es de la DB. */
        const cat = await obtenerRazasDeEspecie(especie)
        if (!vigente) return
        /* ⚠️ `raza_codigo` de la edge **ES el slug del catálogo** — medido en
           `sugerir-raza/index.ts:235` (`select('slug, nombre')`) y en el
           prompt, que le muestra al modelo los slugs. *El nombre del campo
           dice «codigo» y la columna se llama `slug`: se cruza por el valor,
           no por el nombre.* */
        const fila = cat.ok ? cat.data.find((x) => x.slug === mejor.raza_codigo) : undefined
        if (fila === undefined) {
          setSugerida(null)
          return
        }
        setSugerida({ raza: fila.nombre, slug: fila.slug })
      } catch {
        /* Mudo A PROPÓSITO — el selector con autocompletado sigue entero.
           Es la única mudez legítima de esta pantalla, y su razón está en la
           cabecera para que nadie la lea como un `catch` vacío de descuido. */
        if (vigente) setSugerida(null)
      }
    })()
    return () => {
      vigente = false
    }
  }, [especie, borrador.fotoUri])

  /* **La sugerencia PRE-SELECCIONA; no decide.** Escribe en el MISMO estado
     que el selector ⇒ se ve y se cambia exactamente igual que una elección
     propia. Y **no pisa lo que la persona ya puso**: si ya hay raza, se
     respeta. */
  useEffect(() => {
    if (sugerida === undefined || sugerida === null || sugerida === 'mirando') return
    if (raza.raza !== undefined) return
    setRaza({ raza: sugerida.raza, slug: sugerida.slug, elegido: sugerida.slug })
  }, [sugerida, raza.raza])

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
      {/* ⭐ **LA ESTRUCTURA NUEVA — S116-C lote 3g.** Ciruela de FONDO y el
          contenido en una hoja del lienzo que desliza encima.
          🔴 El paso **deja de pagar `insets.bottom`**: lo paga la hoja. */}
      <EvitaTeclado>
        <HojaContenido
          arranque={cabecera.arranque}
          fondo={
            <View onLayout={cabecera.alMedir}>
              <Cabecera
                variante="empujada"
                presentacion="fondo"
                antetitulo={t('alta.nuevaMascota')}
                titulo={t('alta.pasoDatosTitulo')}
                onVolver={onAtras}
                etiquetaVolver={t('alta.volver')}
                /* La barra de pasos la dibuja la propia `Cabecera`. 1-based. */
                pasos={{ total: 3, actual: 2, etiqueta: t('alta.paso', { actual: 2, total: 3 }) }}
              />
            </View>
          }
          scroll={{ contentContainerStyle: { flexGrow: 1 }, keyboardShouldPersistTaps: 'handled' }}
        >
          <View style={{ padding: spacing[5], gap: spacing[6], flexGrow: 1 }}>
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
              <View style={{ gap: spacing[2] }}>
                <SelectorDeRaza especie={especie} valor={raza} onCambio={setRaza} />
                {/* ⭐ **LA SUGERENCIA SE DICE, y por eso se puede confirmar.**
                    Una raza que aparece sola en el campo sin decir de dónde
                    salió no es una sugerencia: es un dato que la app se
                    inventó. **La línea existe para que el acto de dejarla sea
                    una CONFIRMACIÓN y no una distracción.**

                    Se dibuja sólo mientras la raza elegida SIGA SIENDO la
                    sugerida: en cuanto la persona la cambia, la línea se va —
                    ya no describe lo que hay en el campo. */}
                {typeof sugerida === 'object' && sugerida !== null && raza.slug === sugerida.slug ? (
                  <Texto variante="apoyo">{t('alta.razaSugeridaPorFoto')}</Texto>
                ) : null}
              </View>
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
          </View>
        </HojaContenido>
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
