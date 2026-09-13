import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Boton,
  Cabecera,
  Celda,
  EsperaDeMarca,
  Separador,
  Tarjeta,
  Texto,
  HojaCaptura,
  spacing,
  useTheme,
} from '@epetplace/ui'
import { extraerVacunasDeCarnet, obtenerSesion } from '@epetplace/api'
import { borrarFotoMascota, leerBase64, subirFotoMascota } from '@/lib/subir-avatar'

import { useTraduccion } from '@/i18n'
import { guardarCarnetDelIntento, type VacunaDelCarnet } from '@/lib/alta/carnet-del-intento'
import type { BorradorAlta } from './tipos'

/**
 * 09 · CARNÉ DE VACUNAS — paso 3 de 3 (S116-C lote 3). **Pieza nueva.**
 *
 * ── QUÉ HACE, Y DÓNDE TERMINA ────────────────────────────────────────────
 * Encuadra el carné, lo sube, lo lee con `extract-vacuna` y **muestra lo que
 * leyó**. Lo leído NO se registra acá: la mascota todavía no existe —se crea
 * en 10— y `registrarVacunasDeCarnet` exige `mascota_id`. ⇒ queda esperando
 * en `carnet-del-intento`, cuyo archivo explica el costo de esa espera.
 *
 * ── LAS TRES CLÁUSULAS DE LA LEY DEL FOUNDER, en esta pantalla ───────────
 *  ① **lo mejor que podamos**: se lee el carné entero y se guarda lo que
 *    haya, aunque una fila venga a medias.
 *  ② **lo completa la familia**: lo leído es revisable — se puede **quitar**
 *    una fila acá, y la edición fina vive en el carnet del expediente, que
 *    ya existe. *No se duplica ese formulario: se nombra dónde está.*
 *  ③ **se dice dónde no pudimos**: una fila **sin fecha lo DICE** en vez de
 *    mostrarse como si estuviera completa, y si no se pudo leer nada, la
 *    pantalla lo dice y **deja seguir**.
 *
 * ── OMITIR ESTÁ SIEMPRE ──────────────────────────────────────────────────
 * *Un alta que no se puede terminar sin un papel que capaz no está a mano no
 * es un alta: es un trámite.* El carné se puede cargar después desde el
 * expediente, y esta pantalla lo dice.
 */

type Fase =
  | { t: 'vacio' }
  | { t: 'leyendo' }
  | { t: 'leido'; archivo_url: string; vacunas: VacunaDelCarnet[] }
  | { t: 'sin_vacunas' }
  | { t: 'fallo'; mensaje: string }

export function PasoCarnet({
  borrador,
  onAvanzar,
  onAtras,
}: {
  borrador: BorradorAlta
  onAvanzar: (parcial: BorradorAlta) => void
  onAtras: () => void
}) {
  const { theme } = useTheme()
  const { t } = useTraduccion()
  const insets = useSafeAreaInsets()
  const [fase, setFase] = useState<Fase>({ t: 'vacio' })
  const [hoja, setHoja] = useState(false)

  /* ⭐ **LA PUERTA DE LA FOTO ES `HojaCaptura`, NO DOS BOTONES MÍOS — y me lo
     cazó `R42`.** Mi versión dibujaba «Tomar la foto» y «Elegir de la galería»
     a mano, que es la copia número once de una hoja que ya existe. **Y lo que
     esa copia no tenía es lo que la pieza existe para traer: el CERROJO
     sincrónico contra el doble tap** —dos toques abren dos pickers—, que
     *ocho de las diez copias a mano tampoco tienen*.
     ⚠️ La voz del permiso denegado la dice la PANTALLA (la pieza sólo
     reporta), y eso se conserva abajo. */
  async function conFoto(uri: string) {
    setFase({ t: 'leyendo' })

    const sesion = await obtenerSesion()
    if (!sesion.ok || sesion.data === null) {
      setFase({ t: 'fallo', mensaje: t('alta.carnetFalloSesion') })
      return
    }

    const subida = await subirFotoMascota({
      uri,
      userId: sesion.data.user_id,
      prefijo: 'carnet',
    })
    if (!subida.ok) {
      setFase({ t: 'fallo', mensaje: subida.mensaje })
      return
    }

    let base64: string
    try {
      base64 = await leerBase64(uri)
    } catch {
      /* El objeto subido NO queda colgado si lo que sigue falla — mismo
         cuidado que `carnet.tsx`, que ya lo resolvió así. */
      await borrarFotoMascota(subida.path)
      setFase({ t: 'fallo', mensaje: t('alta.carnetFalloLectura') })
      return
    }

    const ext = await extraerVacunasDeCarnet({ imageBase64: base64, mediaType: 'image/jpeg' })
    if (!ext.ok) {
      await borrarFotoMascota(subida.path)
      setFase({ t: 'fallo', mensaje: ext.mensaje })
      return
    }
    if (ext.data.vacunas.length === 0) {
      await borrarFotoMascota(subida.path)
      setFase({ t: 'sin_vacunas' })
      return
    }

    setFase({
      t: 'leido',
      archivo_url: subida.path,
      /* 🔴 **LAS FILAS SIN NOMBRE NO SE DESCARTAN — y lo corregí acá.**
         Mi primera versión las filtraba, y **eso contradice una firma del
         founder escrita en el propio tipo** (`VacunaExtraida.nombre`,
         S113-D-2.4): *«hay renglones donde HAY una vacuna y su nombre no se
         lee. La fila viaja igual … una fila corregible vale más que una que
         desaparece en silencio»*.
         ⇒ **viajan todas**, la pantalla las muestra diciendo qué les falta,
         y al guardar **sólo se registran las que tienen nombre** (la columna
         es `NOT NULL`). Las otras se dicen y se completan en el carnet del
         expediente, que sí tiene ese formulario. */
      vacunas: ext.data.vacunas.map((v) => ({
        nombre: v.nombre,
        fecha_aplicada: v.fecha_aplicada,
        fecha_proxima: v.fecha_proxima,
        veterinario_nombre_externo: v.veterinario,
        lote: v.lote,
      })),
    })
  }

  /** Sigue al cierre. Si hay filas, quedan esperando a la mascota. */
  function seguir() {
    if (fase.t === 'leido' && borrador.tokenIntento !== undefined) {
      guardarCarnetDelIntento(borrador.tokenIntento, {
        archivo_url: fase.archivo_url,
        vacunas: fase.vacunas,
      })
      onAvanzar({})
      return
    }
    onAvanzar({})
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Cabecera
        variante="empujada"
        antetitulo={t('alta.nuevaMascota')}
        titulo={t('alta.pasoCarnetTitulo')}
        onVolver={onAtras}
        etiquetaVolver={t('alta.volver')}
        pasos={{ total: 3, actual: 3, etiqueta: t('alta.paso', { actual: 3, total: 3 }) }}
        /* «Omitir» vive arriba y SIEMPRE — ver la cabecera de la pieza. */
        accionDerecha={
          <Boton variante="ghost" tamaño="sm" etiqueta={t('alta.omitir')} onPress={() => onAvanzar({})} />
        }
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          paddingBottom: insets.bottom + spacing[10],
          gap: spacing[5],
        }}
      >
        {fase.t === 'leyendo' ? (
          /* La espera de la casa — la nariz respirando. Y la voz dice que
             puede tardar: *un minuto sin explicación se lee como colgado.* */
          <View style={{ alignItems: 'center', gap: spacing[4], paddingVertical: spacing[10] }}>
            <EsperaDeMarca tamano={64} />
            <Texto variante="cuerpo">{t('alta.carnetLeyendo')}</Texto>
            <Texto variante="apoyo" color="secondary">
              {t('alta.carnetLeyendoDetalle')}
            </Texto>
          </View>
        ) : fase.t === 'leido' ? (
          <View style={{ gap: spacing[4] }}>
            <Texto variante="seccion">{t('alta.carnetLeidoTitulo', { n: fase.vacunas.length })}</Texto>
            <Tarjeta>
              {fase.vacunas.map((v, i) => (
                <View key={`${v.nombre}-${i}`}>
                  {i > 0 ? <Separador /> : null}
                  <Celda
                    titulo={v.nombre ?? t('alta.carnetSinNombre')}
                    /* ③ **LO QUE NO SE PUDO LEER, SE DICE.** Una fila sin
                       fecha con el subtítulo vacío se leería como completa. */
                    subtitulo={
                      v.fecha_aplicada ?? t('alta.carnetSinFecha')
                    }
                    fin={
                      <Boton
                        variante="ghost"
                        tamaño="sm"
                        etiqueta={t('alta.carnetQuitar')}
                        onPress={() =>
                          setFase({
                            ...fase,
                            vacunas: fase.vacunas.filter((_, j) => j !== i),
                          })
                        }
                      />
                    }
                  />
                </View>
              ))}
            </Tarjeta>
            <Texto variante="apoyo" color="secondary">
              {t('alta.carnetEditarDespues')}
            </Texto>
          </View>
        ) : (
          <View style={{ gap: spacing[4] }}>
            {/* El marco de encuadre y su instrucción. */}
            <View
              style={{
                height: 200,
                borderWidth: 2,
                borderColor: theme.accent.control,
                borderRadius: spacing[4],
                borderStyle: 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Texto variante="apoyo" color="secondary">
                {t('alta.carnetEncuadre')}
              </Texto>
            </View>

            <Tarjeta tinte="plana">
              <Texto variante="cuerpo">{t('alta.carnetNota')}</Texto>
            </Tarjeta>

            {fase.t === 'sin_vacunas' ? (
              <Texto variante="cuerpo" color="warning">
                {t('alta.carnetSinVacunas')}
              </Texto>
            ) : fase.t === 'fallo' ? (
              <Texto variante="cuerpo" color="danger">
                {fase.mensaje}
              </Texto>
            ) : null}

            <Boton
              variante="primario"
              bloque
              etiqueta={t('alta.carnetTomar')}
              onPress={() => setHoja(true)}
            />
          </View>
        )}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: spacing[5],
          paddingBottom: insets.bottom + spacing[4],
          paddingTop: spacing[3],
        }}
      >
        <Boton
          variante={fase.t === 'leido' ? 'primario' : 'apoyada'}
          bloque
          etiqueta={fase.t === 'leido' ? t('alta.carnetGuardar') : t('alta.carnetSeguirSin')}
          deshabilitado={fase.t === 'leyendo'}
          razonDeshabilitado={fase.t === 'leyendo' ? t('alta.carnetLeyendo') : undefined}
          onPress={seguir}
        />
      </View>

      <HojaCaptura
        visible={hoja}
        titulo={t('alta.pasoCarnetTitulo')}
        onCerrar={() => setHoja(false)}
        onFoto={(f) => void conFoto(f.uri)}
        onPermisoDenegado={() => setFase({ t: 'fallo', mensaje: t('alta.carnetFalloPermiso') })}
      />
    </View>
  )
}
