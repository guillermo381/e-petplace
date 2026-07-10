/**
 * DETALLE DE MASCOTA — la pantalla icónica, v1 vista prestador
 * (S51-B3.3, sobre el alma §6.4.4): la mascota como ser completo, no
 * ficha clínica. LA VISIBILIDAD PARCIAL MANDA (relevada S51 en RLS
 * viva): identidad ✓ (mascotas_select_prestador_con_acceso), señales
 * de cuidado ✓ (perfil_vigente/vacunas vía user_tiene_acceso_a_mascota),
 * historial SOLO con este prestador ✓ — y la FAMILIA HUMANA NO
 * (policies familia/familia_miembro/profiles son solo-miembro): su
 * lugar nace cuando exista el canal interno (B5), sin datos de
 * contacto directos (§6.4.5 del alma). Las 5 dimensiones de identidad
 * personal son D-110 (sin UI aún) — no se inventan.
 *
 * Dosis baja (test 7): un acento, sin gradiente. Solo lo REAL (L-139).
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Celda,
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
  type AvatarMascotaEspecie,
} from '@epetplace/ui';
import {
  obtenerDetalleMascotaPrestador,
  obtenerMiPrestador,
  resolverUrlFoto,
  type DetalleMascotaPrestador,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

function esEspecie(v: string | null): v is AvatarMascotaEspecie {
  return v !== null;
}

const MESES_MONO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fechaMono(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!a || !m || m < 1 || m > 12 || !d) return iso.slice(0, 10);
  return `${String(d).padStart(2, '0')} ${MESES_MONO[m - 1]} ${a}`;
}

function TituloModulo({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: typography.family.sans.medium,
        fontSize: typography.size.sm,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        color: theme.text.tertiary,
      }}
    >
      {texto}
    </Text>
  );
}

export default function DetalleMascota() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mascotaId } = useLocalSearchParams<{ mascotaId: string }>();

  const [detalle, setDetalle] = useState<DetalleMascotaPrestador | 'cargando' | 'error'>('cargando');
  const [fotoFirmada, setFotoFirmada] = useState<string | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      if (typeof mascotaId !== 'string') {
        router.back();
        return;
      }
      let vigente = true;
      void (async () => {
        const prestador = await obtenerMiPrestador();
        if (!vigente) return;
        if (!prestador.ok) {
          setDetalle('error');
          return;
        }
        const r = await obtenerDetalleMascotaPrestador(mascotaId, prestador.data.id);
        if (!vigente) return;
        if (!r.ok) {
          setDetalle('error');
          return;
        }
        setDetalle(r.data);
        if (r.data.mascota.foto_url) {
          void resolverUrlFoto(r.data.mascota.foto_url).then((url) => {
            if (vigente) setFotoFirmada(url ?? undefined);
          });
        }
      })();
      return () => {
        vigente = false;
      };
    }, [mascotaId, router]),
  );

  if (detalle === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo="" atras onAtras={() => router.back()} />
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <View style={{ alignItems: 'center', gap: spacing[3] }}>
              <Esqueleto forma="circulo" alto={96} />
              <Esqueleto forma="linea" ancho="40%" />
              <View style={{ height: spacing[6] }} />
              <Esqueleto forma="bloque" ancho="100%" alto={100} />
            </View>
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }

  if (detalle === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo="" atras onAtras={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('detalleMascota.error')}
            descripcion={t('mascotas.errorDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('agenda.reintentar')} onPress={() => setDetalle('cargando')} />}
          />
        </View>
      </View>
    );
  }

  const { mascota, atenciones, vacunas_total } = detalle;
  // señales de cuidado: SOLO lo real del expediente
  const senales: string[] = [];
  if (detalle.tiene_emergencia_activa) senales.push(t('detalleMascota.emergenciaActiva'));
  if (detalle.tiene_condicion_cronica) senales.push(t('detalleMascota.condicionCronica'));
  if (detalle.tiene_alergias) senales.push(t('detalleMascota.alergias'));

  const datosIdentidad: Array<{ etiqueta: string; valor: string }> = [];
  if (mascota.raza !== null && mascota.raza.length > 0) datosIdentidad.push({ etiqueta: t('detalleMascota.raza'), valor: mascota.raza });
  if (mascota.sexo === 'macho' || mascota.sexo === 'hembra') {
    datosIdentidad.push({
      etiqueta: t('detalleMascota.sexo'),
      valor: mascota.sexo === 'macho' ? t('detalleMascota.sexoMacho') : t('detalleMascota.sexoHembra'),
    });
  }
  if (mascota.fecha_nacimiento !== null) datosIdentidad.push({ etiqueta: t('detalleMascota.nacimiento'), valor: fechaMono(mascota.fecha_nacimiento) });
  if (detalle.peso_clinico_kg !== null) datosIdentidad.push({ etiqueta: t('detalleMascota.peso'), valor: `${detalle.peso_clinico_kg} kg` });
  if (mascota.microchip !== null && mascota.microchip.length > 0) datosIdentidad.push({ etiqueta: t('detalleMascota.microchip'), valor: mascota.microchip });

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo="" atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: spacing[8], gap: spacing[6] }}>
        {/* ── cabecera con presencia (§6.4.4) ── */}
        <View style={{ alignItems: 'center', gap: spacing[2] }}>
          <AvatarMascota
            nombre={mascota.nombre}
            fotoUrl={fotoFirmada}
            especie={esEspecie(mascota.especie) ? mascota.especie : undefined}
            tamano="lg"
          />
          <Text
            accessibilityRole="header"
            style={{ fontFamily: typography.family.sans.light, fontSize: typography.size['2xl'], color: theme.text.primary }}
          >
            {mascota.nombre}
          </Text>
          {senales.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], justifyContent: 'center' }}>
              {senales.map((s) => (
                <Insignia key={s} estado="atencion" etiqueta={s} tamaño="sm" />
              ))}
            </View>
          ) : (
            <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
              {t('detalleMascota.sinSenales')}
            </Text>
          )}
        </View>

        {/* ── carnet (señal de cuidado del expediente) ── */}
        <View style={{ gap: spacing[3] }}>
          <TituloModulo texto={t('detalleMascota.carnet')} />
          <Tarjeta>
            <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
              {vacunas_total === 0
                ? t('detalleMascota.carnetVacio')
                : vacunas_total === 1
                  ? t('detalleMascota.unaVacuna')
                  : t('detalleMascota.vacunas', { n: vacunas_total })}
            </Text>
          </Tarjeta>
        </View>

        {/* ── tu historial con la mascota (visibilidad parcial) ── */}
        <View style={{ gap: spacing[3] }}>
          <TituloModulo texto={t('detalleMascota.historial', { nombre: mascota.nombre })} />
          <Tarjeta relleno="ninguno">
            {atenciones.map((a, i) => (
              <View key={a.atencion_id}>
                {i > 0 ? <Separador /> : null}
                <Celda
                  titulo={a.estado === 'en_curso' ? t('detalleMascota.atencionEnCurso') : t('detalleMascota.atencionCerrada')}
                  metadataMono={a.cerrada_en !== null ? fechaMono(a.cerrada_en) : a.iniciada_en !== null ? fechaMono(a.iniciada_en) : undefined}
                />
              </View>
            ))}
          </Tarjeta>
        </View>

        {/* ── identidad (progresiva; las 5 dimensiones son D-110) ── */}
        {datosIdentidad.length > 0 ? (
          <View style={{ gap: spacing[3] }}>
            <TituloModulo texto={t('detalleMascota.identidad')} />
            <Tarjeta relleno="ninguno">
              {datosIdentidad.map((d, i) => (
                <View key={d.etiqueta}>
                  {i > 0 ? <Separador /> : null}
                  <Celda titulo={d.etiqueta} metadataMono={d.valor} />
                </View>
              ))}
            </Tarjeta>
          </View>
        ) : null}

        {/* ═══ FAMILIA HUMANA: hueco estructural. La RLS de hoy no le
            muestra la familia al prestador (relevado S51); cuando el
            canal interno (B5) exista, acá nace su lugar — nombre, rol
            y vínculo mediado, JAMÁS contacto directo (§6.4.5). ═══ */}
      </ScrollView>
    </View>
  );
}
