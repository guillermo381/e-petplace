/**
 * EL HILO DE LA SOLICITUD — la conversación que no se pierde (S111-C).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DEL RECORRIDO: *«Después hablamos acá adentro. Veo en qué estado está:
 * recibida · en conversación · aceptada · declinada. **No es un chat perdido en
 * Instagram donde mi mensaje se hunde entre historias.**»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **TESIS (Ley 14):** *tu mensaje llegó, hay alguien del otro lado y esto tiene
 * un estado que podés ver.*
 *
 * **FIRMA (Ley 15):** el estado, dicho en voz humana arriba de todo. Es lo
 * único que la persona vino a saber; los mensajes son la evidencia.
 *
 * **CHANEL (Ley 16):** se quitó la fecha de cada mensaje. *En una conversación
 * de cuatro mensajes, el sello de hora en cada uno es ruido con formato de
 * dato* — la fecha que importa es la del hilo, y está en el estado.
 *
 * ── 🔴 LO QUE NO HACE, Y NO ES RECORTE ──────────────────────────────────
 * · **No deriva el silencio de los 5 días.** §5 dice que si el refugio no
 *   responde en cinco días, e-PetPlace avisa — **y ese reloj es del motor**
 *   (`obtener_solicitudes_en_silencio`). *Si lo recalculara acá con la fecha
 *   del hilo, el día que el motor cuente días hábiles y la pantalla cuente
 *   corridos, las dos dirían cosas distintas sobre el mismo hilo.* El aviso
 *   llega por su canal; acá se muestra el estado.
 * · **No ACEPTA — pero sí DESISTE, y la distinción es del motor.**
 *   ⏪ Acá decía *«no cierra ni acepta: `cerrarSolicitudAdopcion` es del
 *   PUBLICADOR»*, y era **media verdad escrita como verdad entera**. D lo midió
 *   contra el motor y la asimetría es otra: ***sólo el publicador ACEPTA;
 *   declinar pueden los dos*** (`S112-D-para-C-CONTRATO-DEL-HILO` §③).
 *   ⇒ «Aceptar» sigue sin dibujarse de este lado —§10.2: *la plataforma jamás
 *   asigna, aprueba ni puntúa adoptantes*, y el adoptante tampoco se acepta a
 *   sí mismo—, pero **«ya no quiero adoptar» es suyo y ahora está**.
 *   *Un comentario que describe de menos se lee igual que uno que describe de
 *   más: las dos veces el próximo lector cree que el caso no existe.*
 * · **No muestra al solicitante.** Es él: `MiSolicitud` trae `publicadorNombre`
 *   y no trae solicitante, **a propósito** — cada lado ve al otro.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Boton,
  Campo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoSolicitudAdopcion as EscaleraSolicitud,
  EstadoVacio,
  HojaConfirmacionDestructiva,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  caraDeMascota,
  desistirSolicitudAdopcion,
  obtenerMisSolicitudesAdopcion,
  responderSolicitudAdopcion,
  resolverUrlsFotos,
  type MiSolicitud,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'noEsta' }
  | { fase: 'listo'; hilo: MiSolicitud; cara: string | null };

export default function HiloSolicitud() {
  const { solicitudId } = useLocalSearchParams<{ solicitudId: string }>();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [borrador, setBorrador] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [intento, setIntento] = useState(0);
  /** P1: desistir es irreversible (`declinada` es terminal para los dos), así
   *  que pasa por doble confirmación con el sujeto nombrado. */
  const [desistiendo, setDesistiendo] = useState(false);
  const [trabajando, setTrabajando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      setEstado({ fase: 'cargando' });
      void (async () => {
        const r = await obtenerMisSolicitudesAdopcion();
        if (!vigente) return;
        /* Ley 13: el fallo JAMÁS se disfraza de «no existe». *Decirle que su
           solicitud no está cuando lo que falló fue la red es hacerle creer que
           se perdió.* */
        if (!r.ok) {
          setEstado({ fase: 'error' });
          return;
        }
        const hilo = r.data.find((s) => s.solicitudId === solicitudId) ?? null;
        if (hilo === null) {
          setEstado({ fase: 'noEsta' });
          return;
        }
        const caras =
          hilo.mascotaFotoUrl === null
            ? new Map<string, string>()
            : await resolverUrlsFotos([hilo.mascotaFotoUrl]);
        if (!vigente) return;
        const foto = hilo.mascotaFotoUrl === null ? null : (caras.get(hilo.mascotaFotoUrl) ?? null);
        setEstado({ fase: 'listo', hilo, cara: foto });
      })();
      return () => {
        vigente = false;
      };
    }, [solicitudId, intento]),
  );

  /* ⏪ **ACÁ VIVÍA UN MAPEO ESTADO→COLOR ESCRITO A MANO**, y su gemelo idéntico
     en `solicitudes.tsx`: *el mismo criterio de producto, en dos archivos, sin
     nada que los obligue a coincidir.* La pieza de B (`EstadoSolicitudAdopcion`)
     lo lleva ADENTRO y su cabecera nombra el modo de falla exacto: *«una
     pantalla que armara la escalera a mano podría marcar 'declinada' como hecho
     y compilaría perfecto»*. Se monta la pieza y el mapeo muere (Ley 37). */

  const enviar = async () => {
    const cuerpo = borrador.trim();
    if (cuerpo.length === 0 || enviando || estado.fase !== 'listo') return;
    setEnviando(true);
    try {
      const r = await responderSolicitudAdopcion({ solicitudId: estado.hilo.solicitudId, cuerpo });
      if (!r.ok) {
        mostrar({ variante: 'error', texto: r.mensaje });
        return;
      }
      setBorrador('');
      setIntento((n) => n + 1);
    } finally {
      setEnviando(false);
    }
  };

  /**
   * DESISTIR — «ya no quiero adoptar a Luna».
   *
   * 🔴 **No es un botón de cancelar: es una decisión terminal**, y el motor la
   * trata como tal (`declinada` cierra el hilo para los DOS lados). Por eso va
   * con doble confirmación (P1) y **no se ofrece sobre un hilo ya cerrado**
   * (Ley 23: la puerta no ofrece lo que va a rechazar — ahí el motor devuelve
   * `solicitud_terminal`).
   *
   * ⚠️ **Y se queda en la pantalla en vez de volver atrás.** Volver dejaría a la
   * persona en la lista sin ver qué pasó con lo que acaba de decidir; quedarse
   * le muestra el estado nuevo —«No siguió»— dicho por el mismo lugar donde
   * decidió. *La confirmación de un acto es el acto reflejado, no una pantalla
   * distinta.*
   */
  const desistir = async () => {
    if (estado.fase !== 'listo' || trabajando) return;
    setTrabajando(true);
    try {
      /* ⏪ Esto llamaba a `cerrarSolicitudAdopcion({estadoFinal:'declinada'})`,
         que era lo correcto contra el CHECK de entonces. **Hoy `desistida` es un
         estado propio** y tiene su verbo: *declinar es del publicador; desistir
         es de la familia, y reusar el mismo haría que el refugio viera «yo la
         decliné» sobre alguien que se fue solo.* */
      const r = await desistirSolicitudAdopcion(estado.hilo.solicitudId);
      if (!r.ok) {
        mostrar({ variante: 'error', texto: r.mensaje });
        return;
      }
      setDesistiendo(false);
      setIntento((n) => n + 1);
    } finally {
      setTrabajando(false);
    }
  };

  const cerrado = estado.fase === 'listo' && estado.hilo.cerradaEn !== null;

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={estado.fase === 'listo' ? estado.hilo.mascotaNombre : t('hiloAdopcion.titulo')}
        atras
        onAtras={() => router.back()}
      />

      {estado.fase === 'cargando' ? (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={72} />
            <Esqueleto alto={120} />
          </EsqueletoGrupo>
        </View>
      ) : estado.fase === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('hiloAdopcion.errorTitulo')}
            descripcion={t('hiloAdopcion.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('hiloAdopcion.reintentar')}
                onPress={() => setIntento((n) => n + 1)}
              />
            }
          />
        </View>
      ) : estado.fase === 'noEsta' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('hiloAdopcion.noEstaTitulo')}
            descripcion={t('hiloAdopcion.noEstaDetalle')}
          />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              padding: spacing[5],
              gap: spacing[4],
              paddingBottom: insets.bottom + spacing[8],
            }}
          >
            {/* QUIÉN Y EN QUÉ ESTÁ — la firma de la pantalla. */}
            <Tarjeta relleno="normal" elevacion="reposo">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                <AvatarMascota
                  nombre={estado.hilo.mascotaNombre}
                  fotoUrl={
                    caraDeMascota({
                      especie: estado.hilo.mascotaEspecie,
                      razaSlug: null,
                      fotoUri: estado.cara,
                    }) ?? undefined
                  }
                  tamano="md"
                />
                <View style={{ flex: 1, gap: spacing[1] }}>
                  <Texto variante="cuerpo">{estado.hilo.mascotaNombre}</Texto>
                  {estado.hilo.publicadorNombre !== null ? (
                    <Texto variante="apoyo" color="tertiary">
                      {t('hiloAdopcion.de', { refugio: estado.hilo.publicadorNombre })}
                    </Texto>
                  ) : null}
                </View>
              </View>
              {/* EL ESTADO, DEBAJO Y EN ANCHO COMPLETO. La escalera no es una
                  etiqueta: dice DÓNDE va la solicitud, no sólo cómo se llama su
                  momento — y eso es lo único que la persona vino a saber
                  (`FIRMA`, arriba). Apretada al costado del avatar no entra. */}
              <View style={{ marginTop: spacing[4] }}>
                <EscaleraSolicitud
                  estado={estado.hilo.estado}
                  registro="completa"
                  voces={{
                    recibida: t('hiloAdopcion.estado_recibida'),
                    enConversacion: t('hiloAdopcion.estado_en_conversacion'),
                    aceptada: t('hiloAdopcion.estado_aceptada'),
                  }}
                  vozDeclinada={t('hiloAdopcion.estado_declinada')}
                    vozDesistida={t('hiloAdopcion.estado_desistida')}
                    vozNoConcretada={t('hiloAdopcion.estado_no_concretada')}
                />
              </View>
            </Tarjeta>

            {/* LA CONVERSACIÓN. Sin sello de hora por mensaje (Chanel). */}
            {estado.hilo.mensajes.length === 0 ? (
              <Texto variante="apoyo" color="tertiary">
                {t('hiloAdopcion.sinMensajes')}
              </Texto>
            ) : (
              estado.hilo.mensajes.map((m) => (
                <Tarjeta key={m.mensajeId} relleno="normal">
                  <View style={{ gap: spacing[1] }}>
                    {/* 🔴 La automática se DICE. *Un texto que el refugio no
                        escribió, presentado como si lo hubiera escrito, le hace
                        creer a la familia que ya le contestaron* — y el reloj
                        de los cinco días, que la ignora a propósito, seguiría
                        corriendo sin que ella entienda por qué. */}
                    {m.automatica ? (
                      <Texto variante="apoyo" color="tertiary">
                        {t('hiloAdopcion.automatica')}
                      </Texto>
                    ) : null}
                    <Texto variante="cuerpo">{m.cuerpo}</Texto>
                  </View>
                </Tarjeta>
              ))
            )}
          </ScrollView>

          {/* ESCRIBIR — sólo mientras el hilo esté abierto. Ley 23: sobre un
              hilo cerrado el motor rebota, así que no se ofrece el campo; en su
              lugar se dice por qué, con la voz de su estado. */}
          <View
            style={{
              padding: spacing[5],
              paddingBottom: insets.bottom + spacing[4],
              gap: spacing[2],
            }}
          >
            {/* ⭐ **EL HILO ES LA PUERTA DEL ACTA** — letra del founder: *«cuando
                el refugio acepta, el hilo mismo me lleva al final»*. Por eso el
                aviso de «acta lista» apunta acá y no a una pantalla suelta, y
                por eso este camino tiene que existir: *el aviso no saltea el
                hilo, así que si el hilo no llevara, no llegaría nadie.* */}
            {estado.hilo.estado === 'aceptada' ? (
              <Boton
                variante="primario"
                bloque
                etiqueta={t('hiloAdopcion.verActa')}
                onPress={() =>
                  router.push({
                    pathname: '/adoptar/acta/[solicitudId]',
                    params: { solicitudId: estado.hilo.solicitudId },
                  })
                }
              />
            ) : null}
            {cerrado ? (
              <Texto variante="apoyo" color="tertiary">
                {t('hiloAdopcion.cerrado')}
              </Texto>
            ) : (
              <>
                <Campo
                  label={t('hiloAdopcion.escribirEtiqueta')}
                  value={borrador}
                  onChangeText={setBorrador}
                  multilinea={2}
                />
                <Boton
                  variante="primario"
                  bloque
                  etiqueta={t('hiloAdopcion.enviar')}
                  deshabilitado={borrador.trim().length === 0}
                  cargando={enviando}
                  onPress={() => void enviar()}
                />
                {/* DESISTIR — en `ghost` y al final, a propósito: es la salida,
                    no una acción par de «Enviar». *Dos botones del mismo peso
                    convierten «hablá con el refugio» en «hablá o abandoná».* */}
                <Boton
                  variante="ghost"
                  bloque
                  etiqueta={t('hiloAdopcion.desistir')}
                  onPress={() => setDesistiendo(true)}
                />
              </>
            )}
          </View>
        </>
      )}

      {/* ── P1 · LA DOBLE CONFIRMACIÓN, con el SUJETO nombrado ── */}
      <HojaConfirmacionDestructiva
        visible={desistiendo}
        onCerrar={() => setDesistiendo(false)}
        titulo={t('hiloAdopcion.desistirTitulo')}
        sujeto={estado.fase === 'listo' ? estado.hilo.mascotaNombre : ''}
        etiquetaConfirmar={t('hiloAdopcion.desistirConfirmar')}
        etiquetaCancelar={t('hiloAdopcion.cancelar')}
        trabajando={trabajando}
        onConfirmar={() => void desistir()}
      >
        <Texto variante="cuerpo">{t('hiloAdopcion.desistirCuerpo')}</Texto>
      </HojaConfirmacionDestructiva>
    </SafeAreaView>
  );
}
