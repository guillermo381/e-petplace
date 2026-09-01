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
import {
  AvatarMascota,
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Insignia,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  caraDeMascota,
  obtenerMisSolicitudesAdopcion,
  resolverUrlsFotos,
  type EstadoSolicitudAdopcion,
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

  /** `declinada` en `atencion`, jamás `danger`: §10.6 — la devolución no humilla. */
  const familiaDe = (e: EstadoSolicitudAdopcion): 'alDia' | 'atencion' | 'proximo' | 'info' =>
    e === 'aceptada' ? 'alDia' : e === 'declinada' ? 'atencion' : e === 'recibida' ? 'proximo' : 'info';

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
                  <Insignia
                    estado={familiaDe(s.estado)}
                    etiqueta={t(`hiloAdopcion.estado_${s.estado}` as 'hiloAdopcion.estado_recibida')}
                  />
                </View>
              </Tarjeta>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
