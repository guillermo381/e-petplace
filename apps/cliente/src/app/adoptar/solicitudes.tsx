/**
 * TUS SOLICITUDES — la vuelta al hilo (S111-C).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **POR QUÉ EXISTE, y es el mismo hueco que `D-990`:** al postular se entra
 * al hilo, y **si la familia cerraba la app no tenía cómo volver.** *Una
 * conversación a la que sólo se llega en el instante de crearla es una
 * conversación perdida* — exactamente el «mensaje que se hunde entre historias»
 * que §5 vino a evitar.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **TESIS:** *tus conversaciones siguen acá, y podés ver en qué quedó cada una.*
 *
 * **CHANEL:** sin contador en el título. *El número de conversaciones propias no
 * es trabajo pendiente* — el contador que cuenta es el del publicador (§9), y
 * es suyo.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { leerEscalera } from '@epetplace/domain';
import {
  AvatarMascota,
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  EscaleraSolicitud,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  caraDeMascota,
  obtenerMisSolicitudesAdopcion,
  resolverUrlsFotos,
  type MiSolicitud,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'listo'; lista: MiSolicitud[]; caras: Map<string, string> };

export default function MisSolicitudes() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      setEstado({ fase: 'cargando' });
      void (async () => {
        const r = await obtenerMisSolicitudesAdopcion();
        if (!vigente) return;
        if (!r.ok) {
          setEstado({ fase: 'error' });
          return;
        }
        const paths = r.data
          .map((s) => s.mascotaFotoUrl)
          .filter((x): x is string => typeof x === 'string' && x.length > 0);
        const caras = paths.length > 0 ? await resolverUrlsFotos(paths) : new Map<string, string>();
        if (!vigente) return;
        setEstado({ fase: 'listo', lista: r.data, caras });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  /* ⏪ El mapeo estado→color vivía acá **y en el hilo, escrito dos veces**. Lo
     lleva la pieza de B; se monta en su registro `compacta` —*la tira, para una
     FILA de lista*— y las dos copias mueren juntas (Ley 37). */

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('misSolicitudes.titulo')}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          gap: spacing[4],
          paddingBottom: insets.bottom + spacing[8],
        }}
      >
        {estado.fase === 'cargando' ? (
          <EsqueletoGrupo>
            <Esqueleto alto={88} />
            <Esqueleto alto={88} />
          </EsqueletoGrupo>
        ) : estado.fase === 'error' ? (
          <EstadoVacio
            titulo={t('misSolicitudes.errorTitulo')}
            descripcion={t('misSolicitudes.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('misSolicitudes.reintentar')}
                onPress={() => setIntento((n) => n + 1)}
              />
            }
          />
        ) : estado.lista.length === 0 ? (
          /* Vacío con camino (Ley 17.5): quien todavía no postuló tiene a dónde
             ir, y es la misma vidriera de la que vino. */
          <EstadoVacio
            registro="seccion"
            titulo={t('misSolicitudes.vacioTitulo')}
            descripcion={t('misSolicitudes.vacioDetalle')}
            accion={
              <Boton
                variante="primario"
                etiqueta={t('misSolicitudes.verAdoptables')}
                onPress={() => router.replace('/adoptar')}
              />
            }
          />
        ) : (
          estado.lista.map((s) => {
            const foto = s.mascotaFotoUrl === null ? null : (estado.caras.get(s.mascotaFotoUrl) ?? null);
            const cara = caraDeMascota({ especie: s.mascotaEspecie, razaSlug: null, fotoUri: foto });
            /* El último mensaje NO automático: es lo último que una PERSONA
               dijo. *La automática arriba haría parecer que el refugio contestó
               cuando el reloj de los cinco días la ignora a propósito.* */
            const ultimo = [...s.mensajes].reverse().find((m) => !m.automatica) ?? null;
            return (
              <Tarjeta
                key={s.solicitudId}
                relleno="normal"
                elevacion="reposo"
                interactiva
                accessibilityRole="button"
                /* La etiqueta accesible la exige el TIPO cuando la tarjeta es
                   interactiva (patrón Boton): quien no ve la pantalla tiene que
                   saber a dónde lleva el toque, no sólo que hay uno. */
                etiqueta={t('misSolicitudes.abrirHilo', { nombre: s.mascotaNombre })}
                onPress={() =>
                  router.push({
                    pathname: '/adoptar/solicitud/[solicitudId]',
                    params: { solicitudId: s.solicitudId },
                  })
                }
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                  <AvatarMascota nombre={s.mascotaNombre} fotoUrl={cara ?? undefined} tamano="md" />
                  <View style={{ flex: 1, gap: spacing[1] }}>
                    <Texto variante="cuerpo">{s.mascotaNombre}</Texto>
                    {ultimo !== null ? (
                      <Texto variante="apoyo" color="tertiary" numberOfLines={1}>
                        {ultimo.cuerpo}
                      </Texto>
                    ) : null}
                  </View>
                </View>
                {/* LA TIRA, debajo y en ancho completo: N24 — el control no
                    cambia el tamaño de lo que lo contiene, y una escalera
                    metida a la derecha del nombre le comería el renglón. */}
                {/* ⏪ **LA ESCALERA CAMBIÓ DE CONTRATO** (B1): `estado` →
                    `etapa` + `final`, porque son **dos hechos a la vez** — una
                    declinada tiene la fila congelada donde llegó **y** su
                    etiqueta. La derivación vive en `leerEscalera`
                    (`packages/domain`) y no acá: *si esta lista y el hilo
                    mostraran etapas distintas para la misma solicitud, una de
                    las dos estaría mintiendo y no habría forma de saber cuál.*

                    🔴 **Con memorial no se dibuja nada**, ni siquiera en la
                    lista: es la misma decisión, y acá pesa igual. */}
                {(() => {
                  const esc = leerEscalera(s.estado, { huboMensajes: s.mensajes.length > 0 });
                  if (esc.etapa === null) return null;
                  return (
                    <View style={{ marginTop: spacing[3] }}>
                      <EscaleraSolicitud
                        etapa={esc.etapa}
                        final={
                          esc.final === null
                            ? undefined
                            : {
                                tipo: esc.final,
                                etiqueta:
                                  esc.final === 'declinada'
                                    ? t('hiloAdopcion.estado_declinada')
                                    : esc.final === 'desistida'
                                      ? t('hiloAdopcion.estado_desistida')
                                      : t('hiloAdopcion.estado_otra_familia', {
                                          nombre: s.mascotaNombre,
                                        }),
                              }
                        }
                        voces={{
                          enviada: t('hiloAdopcion.etapa_enviada'),
                          en_conversacion: t('hiloAdopcion.etapa_en_conversacion'),
                          aceptada: t('hiloAdopcion.etapa_aceptada'),
                          acta_firmada: t('hiloAdopcion.etapa_acta_firmada'),
                          una_vida_nueva: t('hiloAdopcion.etapa_una_vida_nueva'),
                        }}
                        vozEstado={t('hiloAdopcion.estasEn', {
                          etapa: t(
                            `hiloAdopcion.etapa_${esc.etapa}` as 'hiloAdopcion.etapa_enviada',
                          ),
                        })}
                        /* 🔴 **EN LA LISTA VA SIEMPRE COLAPSADA Y NO SE ABRE.**
                           Una tarjeta de lista es un resumen: desplegar cinco
                           pasos ahí adentro le roba el renglón a la vista previa
                           del último mensaje, que es lo que hace escaneable la
                           lista. *El detalle vive en el hilo, a un toque.* */
                        abierta={false}
                        onAlternar={() =>
                          router.push({
                            pathname: '/adoptar/solicitud/[solicitudId]',
                            params: { solicitudId: s.solicitudId },
                          })
                        }
                        etiquetaAlternar={t('misSolicitudes.abrirHilo', { nombre: s.mascotaNombre })}
                        acento="control"
                      />
                    </View>
                  );
                })()}
              </Tarjeta>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
