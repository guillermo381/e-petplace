/**
 * Detalle del paseo (S45-B5.3) — URL-reconstruible: todo sale de
 * leerDetalleAtencion(atencionId). Ley 3 en todo: cero códigos
 * visibles (ni gps_estado ni novedad_codigo — las novedades hablan
 * con el nombre del catálogo; el mapa habla solo o calla).
 * En Expo Go el MapaRecorrido muestra su placeholder digno — ESPERADO
 * (la dev build de cliente nace en B5.4).
 *
 * El mensaje de familia es el CIERRE EMOCIONAL: cita en voz humana
 * (DM Sans 300 lg), VERBATIM — es palabra del paseador, no corregimos
 * la voz de otro.
 */

import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Insignia,
  MapaRecorrido,
  Separador,
  Tarjeta,
  VisorFoto,
  radius,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import {
  leerDetalleAtencion,
  obtenerCatalogoNovedadesPaseo,
  type DetalleAtencion,
} from '@epetplace/api';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function fechaHumana(iso: string | null): string {
  if (iso === null) return '';
  const f = new Date(iso);
  return `${f.getDate()} de ${MESES[f.getMonth()]}`;
}

function horaMono(iso: string | null): string {
  if (iso === null) return '--:--';
  const f = new Date(iso);
  return `${String(f.getHours()).padStart(2, '0')}:${String(f.getMinutes()).padStart(2, '0')}`;
}

const LADO_THUMB = 96;

export default function DetallePaseo() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { atencionId } = useLocalSearchParams<{ atencionId: string }>();

  // 'error' (red/backend, reintentable) ≠ 'no_encontrado' (no existe) —
  // auditoría Ley 13 S45: el fallo jamás se disfraza de otra cosa.
  const [detalle, setDetalle] = useState<DetalleAtencion | 'cargando' | 'error' | 'no_encontrado'>('cargando');
  const [nombresNovedades, setNombresNovedades] = useState<Map<string, string>>(new Map());
  const [visorAbierto, setVisorAbierto] = useState(false);
  const [fotoInicial, setFotoInicial] = useState(0);
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (typeof atencionId !== 'string' || atencionId.length === 0) {
        setDetalle('no_encontrado');
        return;
      }
      let vigente = true;
      void (async () => {
        const [d, cat] = await Promise.all([
          leerDetalleAtencion(atencionId),
          obtenerCatalogoNovedadesPaseo(),
        ]);
        if (!vigente) return;
        if (cat.ok) setNombresNovedades(new Map(cat.data.map((n) => [n.codigo, n.nombre])));
        setDetalle(d.ok ? d.data : d.codigo === 'no_encontrado' ? 'no_encontrado' : 'error');
      })();
      return () => {
        vigente = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [atencionId, intento]),
  );

  if (detalle === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo="Paseo" atras onAtras={() => router.back()} />
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo etiqueta="Cargando el paseo">
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={180} />
              <Esqueleto forma="linea" ancho="50%" />
              <Esqueleto forma="bloque" ancho="100%" alto={96} />
            </View>
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }

  if (detalle === 'error' || detalle === 'no_encontrado') {
    const esError = detalle === 'error';
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo="Paseo" atras onAtras={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={esError ? 'No pudimos cargar este paseo' : 'No encontramos este paseo'}
            descripcion={esError ? 'Revisá tu conexión y probá de nuevo.' : 'Puede que ya no esté disponible.'}
            accion={
              esError ? (
                <Boton
                  variante="secundario"
                  etiqueta="Reintentar"
                  onPress={() => {
                    setDetalle('cargando');
                    setIntento((n) => n + 1);
                  }}
                />
              ) : (
                <Boton variante="secundario" etiqueta="Volver" onPress={() => router.back()} />
              )
            }
          />
        </View>
      </View>
    );
  }

  // voz humana: nombre del catálogo; 'otro' habla con el detalle del paseador.
  const nombreNovedad = (codigo: string) =>
    codigo === 'otro' ? 'Otra novedad' : nombresNovedades.get(codigo) ?? 'Novedad del paseo';

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={`Paseo · ${fechaHumana(detalle.iniciada_en)}`}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[4] }}>
        {/* Recorrido — en Expo Go: placeholder digno (dev build en B5.4) */}
        {detalle.track_gps.length > 0 ? (
          <View style={{ borderRadius: radius.lg, overflow: 'hidden' }}>
            <MapaRecorrido modo="recorrido" puntos={detalle.track_gps} capa="cuidado" alto={200} />
          </View>
        ) : null}

        {/* horarios y duración — voz de máquina */}
        <Text
          style={{
            fontFamily: typography.family.mono.regular,
            fontSize: typography.size.sm,
            letterSpacing: typography.tracking.mono,
            color: theme.text.secondary,
          }}
        >
          {horaMono(detalle.iniciada_en)} – {horaMono(detalle.terminada_en)}
          {detalle.iniciada_en !== null && detalle.terminada_en !== null
            ? ` · ${Math.round((new Date(detalle.terminada_en).getTime() - new Date(detalle.iniciada_en).getTime()) / 60000)} min`
            : ''}
        </Text>

        {/* novedades del parte — voz humana del catálogo */}
        {detalle.novedades.length > 0 ? (
          <View style={{ gap: spacing[2] }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
              {detalle.novedades.map((n, i) => (
                <Insignia key={i} capa="cuidado" etiqueta={nombreNovedad(n.novedad_codigo)} />
              ))}
            </View>
            {detalle.novedades
              .filter((n) => n.detalle !== null && n.detalle.length > 0)
              .map((n, i) => (
                <Text
                  key={i}
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.sm,
                    color: theme.text.secondary,
                  }}
                >
                  {n.detalle}
                </Text>
              ))}
          </View>
        ) : null}

        {/* fotos → VisorFoto */}
        {detalle.fotos.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
            {detalle.fotos.map((f, i) => (
              <Pressable
                key={f.id}
                onPress={() => {
                  setFotoInicial(i);
                  setVisorAbierto(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Ver foto ${i + 1} de ${detalle.fotos.length}`}
              >
                <Image
                  source={{ uri: f.url }}
                  contentFit="cover"
                  transition={0}
                  style={{ width: LADO_THUMB, height: LADO_THUMB, borderRadius: radius.md }}
                />
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* cierre emocional: la palabra del paseador, VERBATIM */}
        {detalle.mensaje_familia !== null ? (
          <>
            <Separador />
            <Tarjeta relleno="amplio">
              {detalle.titulo_fuente !== null ? (
                <Text
                  style={{
                    fontFamily: typography.family.sans.medium,
                    fontSize: typography.size.sm,
                    color: theme.text.secondary,
                    marginBottom: spacing[2],
                  }}
                >
                  De {detalle.titulo_fuente}:
                </Text>
              ) : null}
              <Text
                style={{
                  // voz humana: DM Sans 300 en lg (regla de voz)
                  fontFamily: typography.family.sans.light,
                  fontSize: typography.size.lg,
                  lineHeight: Math.round(typography.size.lg * typography.leading.snug),
                  color: theme.text.primary,
                }}
              >
                “{detalle.mensaje_familia}”
              </Text>
            </Tarjeta>
          </>
        ) : null}
      </ScrollView>

      <VisorFoto
        visible={visorAbierto}
        onCerrar={() => setVisorAbierto(false)}
        fotos={detalle.fotos.map((f) => f.url)}
        indiceInicial={fotoInicial}
        etiqueta="Fotos del paseo"
      />
    </View>
  );
}
