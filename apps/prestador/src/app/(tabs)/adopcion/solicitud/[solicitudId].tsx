/**
 * EL HILO, LADO PUBLICADOR — responder, y decidir (S112-C, §5 y §9).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **LA ASIMETRÍA QUE ESTA PANTALLA TIENE QUE RESPETAR, y la midió D:**
 * *sólo el publicador ACEPTA; declinar pueden los dos.* Por eso «Aceptar» vive
 * acá y **no** en la app de la familia. *El motor lo rebota igual con
 * `rol_no_puede`, pero un botón que siempre falla es peor que uno que no está.*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🔑 **`recibida → en_conversacion` NO ES UN BOTÓN.** Lo mueve el motor **en el
 * mismo acto** en que el publicador escribe su primer mensaje, y
 * `responderSolicitudAdopcion` devuelve el estado **ya movido**. No se replica
 * ni se ofrece como acción — *un estado que alguien tiene que acordarse de
 * mover es un estado que va a estar mal.*
 *
 * ── LA DOBLE CONFIRMACIÓN, Y POR QUÉ EN LAS DOS DECISIONES (P1) ─────────
 * `HojaConfirmacionDestructiva` con el **sujeto nombrado**. Declinar es
 * obviamente irreversible; **aceptar también lo es** —cierra el hilo para los
 * dos y el motor no admite volver— y además es la decisión que le cambia la
 * vida a un animal. *La confirmación no está por el riesgo técnico: está
 * porque del otro lado hay una familia esperando una respuesta que no se puede
 * deshacer.*
 *
 * ⚠️ **ACEPTAR NO COMPLETA LA ADOPCIÓN, y la pantalla no lo insinúa.** El acta,
 * la transferencia del expediente y el hito viven en otro arco
 * (`traspasarMascotaAFamilia`), y hoy **el acta no tiene texto cargado**. Por
 * eso el éxito dice *«aceptaste»* y nunca *«adoptado»*: prometer el final que
 * todavía no puede ocurrir es la clase de voz que `L-472` cobra.
 *
 * ── LO QUE NO SE DIBUJA, Y NO ES RECORTE ────────────────────────────────
 * · **No hay adjuntar imagen.** D lo midió en los tres lugares: sin columna,
 *   sin parámetro y sin bucket privado. **Y la trampa señalizada:**
 *   `adopcion-fotos` existe y es **público** — es la vidriera. *Colgar ahí los
 *   adjuntos de una conversación privada los deja a la vista de cualquiera.*
 * · **No se defiende la privacidad en el cliente.** La RLS ya lo hace, y D lo
 *   probó con un tercer usuario dando 0 en las cuatro puertas. *Filtrar acá
 *   sería una segunda ley que puede diverger de la primera.*
 * · **No hay teléfono ni email de la familia.** Nunca viajan en el hilo: *el
 *   canal existe para que no haga falta.*
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Boton,
  Campo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoSolicitudAdopcion as PillEstado,
  EstadoVacio,
  EvitaTeclado,
  Hoja,
  HojaConfirmacionDestructiva,
  MarcaDeAgua,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  cerrarSolicitudAdopcion,
  obtenerSesion,
  obtenerSolicitudesDeMisPublicaciones,
  responderSolicitudAdopcion,
  type SolicitudRecibida,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'noEsTuya' }
  | { fase: 'listo'; hilo: SolicitudRecibida; miUid: string };

export default function HiloDelPublicador() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const aviso = useAviso();
  const params = useLocalSearchParams<{ solicitudId?: string }>();
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [borrador, setBorrador] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [decidiendo, setDecidiendo] = useState<'aceptada' | 'declinada' | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const cargar = useCallback(async () => {
    const id = params.solicitudId;
    if (typeof id !== 'string' || id.length === 0) return setEstado({ fase: 'error' });
    const [r, ses] = await Promise.all([obtenerSolicitudesDeMisPublicaciones(), obtenerSesion()]);
    if (!r.ok) return setEstado({ fase: 'error' });
    const hilo = r.data.find((s) => s.solicitudId === id) ?? null;
    /* **`noEsTuya` es distinto de `error`**, y por eso son dos fases: la RLS
       ya decidió que no lo ves, y decirle «no pudimos cargar» a alguien que
       **no tiene acceso** lo invita a reintentar para siempre (Ley 13). */
    if (hilo === null) return setEstado({ fase: 'noEsTuya' });
    const uid = ses.ok && ses.data !== null ? ses.data.user_id : '';
    setEstado({ fase: 'listo', hilo, miUid: uid });
  }, [params.solicitudId]);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        await cargar();
        if (!vigente) return;
      })();
      return () => {
        vigente = false;
      };
    }, [cargar]),
  );

  const cerrado =
    estado.fase === 'listo' && (estado.hilo.estado === 'aceptada' || estado.hilo.estado === 'declinada');

  async function enviar() {
    if (estado.fase !== 'listo' || enviando) return;
    const cuerpo = borrador.trim();
    if (cuerpo.length === 0) return;
    setEnviando(true);
    const r = await responderSolicitudAdopcion({ solicitudId: estado.hilo.solicitudId, cuerpo });
    setEnviando(false);
    if (!r.ok) return aviso.mostrar({ variante: 'error', texto: r.mensaje });
    setBorrador('');
    /* Se RE-LEE en vez de empujar el mensaje a mano: el motor pudo haber
       movido el estado a `en_conversacion` en el mismo acto, y pintar sólo la
       burbuja dejaría la etiqueta diciendo «recibida» sobre un hilo que ya
       está en conversación. */
    await cargar();
  }

  async function decidir(estadoFinal: 'aceptada' | 'declinada') {
    if (estado.fase !== 'listo' || trabajando) return;
    setTrabajando(true);
    const r = await cerrarSolicitudAdopcion({ solicitudId: estado.hilo.solicitudId, estadoFinal });
    setTrabajando(false);
    setDecidiendo(null);
    if (!r.ok) return aviso.mostrar({ variante: 'error', texto: r.mensaje });
    aviso.mostrar({
      variante: estadoFinal === 'aceptada' ? 'exito' : 'neutro',
      texto: estadoFinal === 'aceptada' ? t('portalHilo.aceptadaOk') : t('portalHilo.declinadaOk'),
    });
    await cargar();
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('portalHilo.titulo')}
        atras
        onAtras={() => (router.canGoBack() ? router.back() : router.replace('/adopcion'))}
      />

      {estado.fase === 'cargando' ? (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={64} />
            <Esqueleto alto={120} />
          </EsqueletoGrupo>
        </View>
      ) : estado.fase === 'noEsTuya' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('portalHilo.noEsTuyaTitulo')}
            descripcion={t('portalHilo.noEsTuyaDetalle')}
          />
        </View>
      ) : estado.fase === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('portalHilo.errorTitulo')}
            descripcion={t('portalHilo.errorDetalle')}
            accion={<Boton etiqueta={t('portalHilo.reintentar')} onPress={() => void cargar()} />}
          />
        </View>
      ) : (
        <EvitaTeclado>
          {/* ── LA CABECERA: el animal, y quién pregunta por él ── */}
          <View style={{ padding: spacing[5], gap: spacing[3] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
              <AvatarMascota nombre={estado.hilo.mascotaNombre} tamano="md" />
              <View style={{ flex: 1, gap: spacing[1] }}>
                <Texto variante="titulo">{estado.hilo.mascotaNombre}</Texto>
                <Texto variante="apoyo">
                  {estado.hilo.solicitanteNombre ?? t('portalHilo.alguienSinNombre')}
                </Texto>
              </View>
              {/* El estado como **etiqueta de clase (N23)**, jamás alarma — ni
                  siquiera en `declinada`: *el color marca clase, no gravedad.* */}
              {/* Las voces son OBLIGATORIAS y la pieza no trae diccionario:
                  la casa que lee escribe sus palabras. **`vozDeclinada` va
                  aparte a propósito** — es la única que cada superficie tiene
                  que poder decir con su tono (§5 · §10.6: *la devolución jamás
                  humilla*), y acá el refugio lee «No siguió», no «rechazada». */}
              <PillEstado
                estado={estado.hilo.estado}
                voces={{
                  recibida: t('portalHilo.estadoRecibida'),
                  enConversacion: t('portalHilo.estadoEnConversacion'),
                  aceptada: t('portalHilo.estadoAceptada'),
                }}
                vozDeclinada={t('portalHilo.estadoDeclinada')}
              />
            </View>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[5], gap: spacing[3] }}>
            {estado.hilo.mensajes.length === 0 ? (
              <EstadoVacio registro="seccion" titulo={t('portalHilo.sinMensajes')} />
            ) : (
              estado.hilo.mensajes.map((m) => {
                /* De qué lado va la burbuja: **no hay campo «mío»** — se compara
                   `autorUserId` contra el uid de la sesión (contrato de D). */
                const mio = m.autorUserId === estado.miUid;
                return (
                  <View key={m.mensajeId} style={{ alignItems: mio ? 'flex-end' : 'flex-start' }}>
                    <Tarjeta>
                      <View style={{ gap: spacing[1], maxWidth: 280 }}>
                        <Texto variante="cuerpo">{m.cuerpo}</Texto>
                      </View>
                    </Tarjeta>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View
            style={{
              padding: spacing[5],
              paddingBottom: insets.bottom + spacing[4],
              gap: spacing[2],
            }}
          >
            {cerrado ? (
              /* Terminal es terminal **para los dos**: el motor rebota
                 `solicitud_terminal`, así que el campo no se ofrece y se dice
                 por qué (Ley 23 — la puerta no ofrece lo que va a rechazar). */
              <Texto variante="apoyo" color="tertiary">
                {t('portalHilo.cerrado')}
              </Texto>
            ) : (
              <>
                <Campo
                  label={t('portalHilo.escribirEtiqueta')}
                  value={borrador}
                  onChangeText={setBorrador}
                  multilinea={2}
                />
                <Boton
                  variante="primario"
                  bloque
                  etiqueta={t('portalHilo.enviar')}
                  deshabilitado={borrador.trim().length === 0}
                  razonDeshabilitado={t('portalHilo.razonSinTexto')}
                  cargando={enviando}
                  onPress={() => void enviar()}
                />
                <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                  <View style={{ flex: 1 }}>
                    <Boton
                      variante="secundario"
                      bloque
                      etiqueta={t('portalHilo.aceptar')}
                      onPress={() => setDecidiendo('aceptada')}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Boton
                      variante="ghost"
                      bloque
                      etiqueta={t('portalHilo.declinar')}
                      onPress={() => setDecidiendo('declinada')}
                    />
                  </View>
                </View>
              </>
            )}
          </View>
        </EvitaTeclado>
      )}

      {/* ⭐ **EL HILO ES LA PUERTA DEL ACTA** — letra del founder: *«aceptada:

          el hilo me lleva al acta»*. El aviso «acta lista» apunta al hilo a

          propósito (decisión de D), así que **si el hilo no llevara, no llegaría

          nadie**. */}

      {estado.fase === 'listo' && estado.hilo.estado === 'aceptada' ? (

        <View style={{ padding: spacing[5] }}>

          <Boton

            variante="primario"

            bloque

            etiqueta={t('portalHilo.verActa')}

            onPress={() =>

              router.push({

                pathname: '/adopcion/acta/[solicitudId]',

                params: { solicitudId: estado.hilo.solicitudId },

              })

            }

          />

        </View>

      ) : null}


      {/* ── P1 · LA DOBLE CONFIRMACIÓN, con el SUJETO nombrado ── */}
      <HojaConfirmacionDestructiva
        visible={decidiendo === 'declinada'}
        onCerrar={() => setDecidiendo(null)}
        titulo={t('portalHilo.declinarTitulo')}
        sujeto={estado.fase === 'listo' ? estado.hilo.mascotaNombre : ''}
        etiquetaConfirmar={t('portalHilo.declinarConfirmar')}
        etiquetaCancelar={t('portalHilo.cancelar')}
        trabajando={trabajando}
        onConfirmar={() => void decidir('declinada')}
      >
        <Texto variante="cuerpo">{t('portalHilo.declinarCuerpo')}</Texto>
      </HojaConfirmacionDestructiva>

      {/* Aceptar NO es destructivo, así que **no usa la Hoja destructiva**: usa
          una Hoja común con su confirmación. *Vestir de rojo la mejor noticia
          del producto sería el color marcando gravedad y no clase (N23).* */}
      <Hoja
        visible={decidiendo === 'aceptada'}
        onCerrar={() => setDecidiendo(null)}
        titulo={t('portalHilo.aceptarTitulo')}
      >
        <View style={{ gap: spacing[3] }}>
          <Texto variante="titulo">
            {estado.fase === 'listo' ? estado.hilo.mascotaNombre : ''}
          </Texto>
          <Texto variante="cuerpo">{t('portalHilo.aceptarCuerpo')}</Texto>
          <Boton
            variante="primario"
            bloque
            etiqueta={t('portalHilo.aceptarConfirmar')}
            cargando={trabajando}
            onPress={() => void decidir('aceptada')}
          />
          <Boton variante="ghost" bloque etiqueta={t('portalHilo.cancelar')} onPress={() => setDecidiendo(null)} />
        </View>
      </Hoja>
    </View>
  );
}
