/**
 * D-430 (S67) — EL DETALLE CONTEXTUAL DE LA CITA (regla de plataforma,
 * founder S67): el CTA "Ver su cita" de la ficha de mascota aterriza
 * ACÁ — jamás en un hub. El hub sigue siendo el destino del doble-clic
 * del servicio (letra MODELO_PASEO); el contexto de mascota lleva al
 * detalle de SU cita.
 *
 * La pantalla: la PRÓXIMA cita activa de la mascota como detalle —
 * servicio en voz de familia (riel S61-A1) · día y hora · el prestador
 * que atiende · estado honesto (Confirmada / "En vivo" §7.1 conectando
 * con /paseo/[atencionId] / hold vigente D-319). N>1 activas ⇒ "Ver
 * más" despliega las demás EN LA MISMA pantalla; cada fila es
 * navegable a su propio detalle (setParams — misma ruta, Back intacto).
 * Una sola activa ⇒ "Ver más" NO se dibuja (nada apagado).
 *
 * Ley 13: el error jamás se disfraza de vacío ('error' ≠ lista vacía);
 * el vacío honesto existe solo por carrera (el CTA de la ficha ni se
 * dibuja sin cita activa). Back siempre — jamás callejón.
 *
 * DECLARADO (reporte S67): "el prestador navegable a su detalle" queda
 * SIN chevron — el perfil público del prestador no existe en cliente
 * (D-370, mock firmado S61, letra pendiente); cuando nazca, esta fila
 * gana su navegación.
 */

import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Celda,
  CeldaNavegacion,
  CitaEnVivo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Insignia,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import { obtenerCitasActivasMascota, type CitaActivaMascota } from '@epetplace/api';
import { fechaCortaMono, fechaLargaHumana } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import { vozServicio } from '@/lib/voz-servicio';

function iconoDe(tipo: string | null): 'paseo' | 'grooming' | 'training' {
  if (tipo?.startsWith('grooming')) return 'grooming';
  if (tipo === 'adiestramiento') return 'training';
  return 'paseo';
}

export default function CitasDeMascota() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { mascotaId, nombre, citaId } = useLocalSearchParams<{
    mascotaId: string;
    nombre?: string;
    citaId?: string;
  }>();

  const [estado, setEstado] = useState<CitaActivaMascota[] | 'cargando' | 'error'>('cargando');
  const [desplegado, setDesplegado] = useState(false);
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      void (async () => {
        if (typeof mascotaId !== 'string' || mascotaId.length === 0) return;
        const r = await obtenerCitasActivasMascota(mascotaId);
        if (!vivo) return;
        setEstado(r.ok ? r.data : 'error');
      })();
      return () => {
        vivo = false;
      };
    }, [mascotaId, intento]),
  );

  const titulo =
    typeof nombre === 'string' && nombre.length > 0
      ? t('citasMascota.titulo', { nombre })
      : t('citasMascota.tituloSinNombre');

  const citas = Array.isArray(estado) ? estado : [];
  // El detalle es la cita elegida (fila del acordeón) o LA PRÓXIMA.
  const hero = citas.find((c) => c.cita_id === citaId) ?? citas[0];
  const otras = citas.filter((c) => c !== hero);

  const vozEstado = (c: CitaActivaMascota): string =>
    c.estado === 'hold' ? t('hogar.reservandoHorario') : t('citasMascota.estadoConfirmada');

  const detalleHero = (c: CitaActivaMascota) => {
    const servicio = vozServicio(t, c.tipo_servicio) ?? null;
    const cuando = `${fechaLargaHumana(c.fecha, idioma)}${c.hora !== null ? ` · ${c.hora}` : ''}`;
    const tarjeta = (
      <Tarjeta elevacion="reposo">
        <View style={{ gap: spacing[3] }}>
          {servicio !== null ? (
            <Text
              style={{
                fontFamily: typography.family.sans.light,
                fontSize: typography.size.xl,
                color: theme.text.primary,
              }}
            >
              {servicio}
            </Text>
          ) : null}
          <Text
            style={{
              fontFamily: typography.family.mono.regular,
              fontSize: typography.size.md,
              color: theme.text.primary,
            }}
          >
            {cuando}
          </Text>
          {c.estado === 'en_vivo' ? (
            // §7.1 — la voz única "En vivo" la pone el pill de CitaEnVivo;
            // acá solo la invitación a la pantalla de dos caras.
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.sm,
                color: theme.text.secondary,
              }}
            >
              {t('hogar.verEnVivo')}
            </Text>
          ) : (
            <Insignia estado={c.estado === 'hold' ? 'proximo' : 'alDia'} etiqueta={vozEstado(c)} tamaño="sm" />
          )}
          {c.prestador_nombre !== null ? (
            <>
              <Separador />
              <Celda titulo={c.prestador_nombre} subtitulo={t('citasMascota.quienAtiende')} />
            </>
          ) : null}
        </View>
      </Tarjeta>
    );
    if (c.estado === 'en_vivo' && c.atencion_id !== null) {
      const atencionId = c.atencion_id;
      return (
        <CitaEnVivo capa="cuidado">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/paseo/[atencionId]', params: { atencionId } })}
          >
            {tarjeta}
          </Pressable>
        </CitaEnVivo>
      );
    }
    return tarjeta;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg.base }} edges={['top']}>
      <Encabezado variante="navegacion" titulo={titulo} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
        {estado === 'cargando' ? (
          <EsqueletoGrupo>
            <Esqueleto forma="bloque" ancho="100%" alto={140} />
            <Esqueleto forma="linea" ancho="60%" />
          </EsqueletoGrupo>
        ) : estado === 'error' ? (
          // Ley 13: el fallo dice que es fallo — jamás "sin citas".
          <EstadoVacio
            titulo={t('citasMascota.error')}
            descripcion={t('citasMascota.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('citasMascota.reintentar')}
                onPress={() => {
                  setEstado('cargando');
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        ) : hero === undefined ? (
          // Vacío honesto (carrera: la cita expiró/cerró entre la ficha
          // y el tap). Back del Encabezado — jamás callejón.
          <EstadoVacio titulo={t('citasMascota.vacio')} descripcion={t('citasMascota.vacioDetalle')} />
        ) : (
          <>
            {detalleHero(hero)}

            {/* N>1 activas: "Ver más" despliega EN LA MISMA pantalla;
                con una sola, NO se dibuja (nada apagado). */}
            {otras.length > 0 && !desplegado ? (
              <Boton variante="secundario" bloque etiqueta={t('citasMascota.verMas')} onPress={() => setDesplegado(true)} />
            ) : null}
            {otras.length > 0 && desplegado ? (
              <View style={{ gap: spacing[3] }}>
                <Text
                  style={{
                    fontFamily: typography.family.sans.medium,
                    fontSize: typography.size.sm,
                    color: theme.text.secondary,
                  }}
                >
                  {t('citasMascota.otrasActivas')}
                </Text>
                <Tarjeta relleno="ninguno" elevacion="reposo">
                  {otras.map((c, i) => (
                    <View key={c.cita_id}>
                      {i > 0 ? <Separador /> : null}
                      <CeldaNavegacion
                        icono={iconoDe(c.tipo_servicio)}
                        titulo={vozServicio(t, c.tipo_servicio) ?? vozEstado(c)}
                        detalle={`${fechaCortaMono(c.fecha, idioma)}${c.hora !== null ? ` · ${c.hora}` : ''}`}
                        onPress={() => router.setParams({ citaId: c.cita_id })}
                      />
                    </View>
                  ))}
                </Tarjeta>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
