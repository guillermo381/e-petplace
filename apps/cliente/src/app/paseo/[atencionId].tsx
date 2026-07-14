/**
 * La pantalla del paseo (S45-B5.3; S59 §7.2: DOS CARAS, UNA RUTA) —
 * URL-reconstruible: todo sale de leerDetalleAtencion(atencionId).
 *
 * EN VIVO (estado='en_curso', §7.3): mapa vivo con el tramo acumulado ·
 * inicio + tiempo transcurrido (Cronometro) · novedades con voz de
 * familia · fotos al llegar · GPS honesto (el track vacío HABLA, jamás
 * un mapa muerto — Ley 13). FRESCURA HONESTA (§7.4): sondeo ~30 s SOLO
 * con la pantalla en foco + pull-to-refresh + "Actualizado hace X" —
 * jamás prometemos tiempo real (el GPS escribe ~60 s foreground-only,
 * D-292; realtime = D-377).
 *
 * RECORRIDO (cerrada/terminada): la cara histórica de siempre — murió
 * el detalle rendereando nulls como contenido ("09:14 – --:--").
 *
 * Ley 3 en todo: cero códigos visibles (ni gps_estado ni
 * novedad_codigo — las novedades hablan con el nombre del catálogo).
 * En Expo Go el MapaRecorrido muestra su placeholder digno — ESPERADO.
 *
 * El mensaje de familia es el CIERRE EMOCIONAL: cita en voz humana
 * (DM Sans 300 lg), VERBATIM — es palabra del paseador, no corregimos
 * la voz de otro.
 */

import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Boton,
  CitaEnVivo,
  Cronometro,
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
  obtenerPerfilMascota,
  resolverUrlFoto,
  type DetalleAtencion,
} from '@epetplace/api';
import { fechaLargaHumana } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';

function horaMono(iso: string | null): string {
  if (iso === null) return '--:--';
  const f = new Date(iso);
  return `${String(f.getHours()).padStart(2, '0')}:${String(f.getMinutes()).padStart(2, '0')}`;
}

const LADO_THUMB = 96;
// §7.4 — frescura honesta: sondeo con la pantalla en foco. El GPS del
// paseador escribe ~cada 60 s (D-292): 30 s de sondeo es honesto sin
// martillar el server; el pull-to-refresh cubre la ansiedad puntual.
const SONDEO_MS = 30_000;
const TICK_ETIQUETA_MS = 10_000;

export default function DetallePaseo() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { atencionId } = useLocalSearchParams<{ atencionId: string }>();

  // 'error' (red/backend, reintentable) ≠ 'no_encontrado' (no existe) —
  // auditoría Ley 13 S45: el fallo jamás se disfraza de otra cosa.
  const [detalle, setDetalle] = useState<DetalleAtencion | 'cargando' | 'error' | 'no_encontrado'>('cargando');
  const [nombresNovedades, setNombresNovedades] = useState<Map<string, string>>(new Map());
  const [visorAbierto, setVisorAbierto] = useState(false);
  const [fotoInicial, setFotoInicial] = useState(0);
  const [intento, setIntento] = useState(0);
  // §7.4 — "Actualizado hace X": el momento de la última carga BUENA.
  const [ultimaCarga, setUltimaCarga] = useState<number | null>(null);
  const [refrescando, setRefrescando] = useState(false);
  // tick que solo re-renderiza la etiqueta de frescura (cada 10 s)
  const [, setTick] = useState(0);
  // el sondeo consulta este ref para NO seguir pegando cuando el paseo
  // cerró en caliente (la cara ya cambió a RECORRIDO)
  const enVivoRef = useRef(false);
  // S60 (condición 5): en grooming la MASCOTA preside el hero vivo —
  // avatar + estado en voz de familia (no hay track en una silla de
  // grooming; el hueco del mapa NO deja cicatriz).
  const [mascota, setMascota] = useState<{ nombre: string; fotoUrl?: string } | null>(null);

  // Recarga silenciosa (§7.4): reemplazo directo, jamás re-esqueleto
  // (Ley 13/6 — el sondeo no puede hacer parpadear la pantalla). El
  // catálogo de novedades se pide UNA vez (no cambia durante un paseo).
  const recargar = useCallback(
    async (modo: 'silencioso' | 'pull') => {
      if (typeof atencionId !== 'string' || atencionId.length === 0) return;
      if (modo === 'silencioso' && !enVivoRef.current) return;
      if (modo === 'pull') setRefrescando(true);
      const d = await leerDetalleAtencion(atencionId);
      if (modo === 'pull') setRefrescando(false);
      if (d.ok) {
        setDetalle(d.data);
        setUltimaCarga(Date.now());
        enVivoRef.current = d.data.estado === 'en_curso';
      }
      // fallo del sondeo: silencio — la etiqueta de frescura envejece
      // sola y dice la verdad; el pull o el próximo tick reintentan.
    },
    [atencionId],
  );

  useFocusEffect(
    useCallback(() => {
      if (typeof atencionId !== 'string' || atencionId.length === 0) {
        setDetalle('no_encontrado');
        return;
      }
      let vigente = true;
      let sondeo: ReturnType<typeof setInterval> | null = null;
      let tick: ReturnType<typeof setInterval> | null = null;
      void (async () => {
        const [d, cat] = await Promise.all([
          leerDetalleAtencion(atencionId),
          obtenerCatalogoNovedadesPaseo(),
        ]);
        if (!vigente) return;
        if (cat.ok) setNombresNovedades(new Map(cat.data.map((n) => [n.codigo, n.nombre])));
        setDetalle(d.ok ? d.data : d.codigo === 'no_encontrado' ? 'no_encontrado' : 'error');
        if (d.ok) setUltimaCarga(Date.now());
        enVivoRef.current = d.ok && d.data.estado === 'en_curso';
        // §7.4 — el sondeo vive SOLO con la pantalla en foco y SOLO
        // mientras el paseo está en vivo (la cara RECORRIDO no sondea;
        // si el cierre llega, la propia recarga corta el estado y el
        // próximo montaje ya no arma el intervalo).
        if (d.ok && d.data.estado === 'en_curso') {
          sondeo = setInterval(() => void recargar('silencioso'), SONDEO_MS);
          tick = setInterval(() => setTick((n) => n + 1), TICK_ETIQUETA_MS);
        }
        // S60: el hero del grooming necesita a la mascota (avatar +
        // nombre) — se pide UNA vez; si falla, la voz genérica cubre.
        if (d.ok && d.data.oficio === 'grooming' && d.data.mascota_id !== null) {
          const p = await obtenerPerfilMascota(d.data.mascota_id);
          if (!vigente || !p.ok) return;
          const url = p.data.mascota.foto_url !== null ? await resolverUrlFoto(p.data.mascota.foto_url) : null;
          if (!vigente) return;
          setMascota({ nombre: p.data.mascota.nombre, ...(url !== null ? { fotoUrl: url } : null) });
        }
      })();
      return () => {
        vigente = false;
        if (sondeo !== null) clearInterval(sondeo);
        if (tick !== null) clearInterval(tick);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [atencionId, intento, recargar]),
  );

  // CURA S60-C1: las caras PRE-CARGA no conocen el oficio todavía (el
  // detalle no llegó) — voz NEUTRA de atención, jamás "paseo" a ciegas.
  if (detalle === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('atencion.titulo')} atras onAtras={() => router.back()} />
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo etiqueta={t('atencion.cargando')}>
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
        <Encabezado variante="navegacion" titulo={t('atencion.titulo')} atras onAtras={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={esError ? t('atencion.errorTitulo') : t('atencion.noEncontradoTitulo')}
            descripcion={esError ? t('paseo.errorDetalle') : t('paseo.noEncontradoDetalle')}
            accion={
              esError ? (
                <Boton
                  variante="secundario"
                  etiqueta={t('paseo.reintentar')}
                  onPress={() => {
                    setDetalle('cargando');
                    setIntento((n) => n + 1);
                  }}
                />
              ) : (
                <Boton variante="secundario" etiqueta={t('paseo.volver')} onPress={() => router.back()} />
              )
            }
          />
        </View>
      </View>
    );
  }

  // voz de la familia: nombre_familia del catálogo (D-300), vía wrapper.
  const nombreNovedad = (codigo: string) =>
    nombresNovedades.get(codigo) ?? t('paseo.novedadFallback');

  // §7.2 — DOS CARAS, UNA RUTA: en_curso pinta EN VIVO; todo lo demás
  // (terminada / cerrada_con_calidad / no_show) pinta RECORRIDO.
  const enVivo = detalle.estado === 'en_curso';
  // S60: el oficio bifurca el HERO (paseo = mapa/GPS honesto; grooming =
  // la mascota preside — sin mapa, sin cicatriz) y la voz del título.
  const esGrooming = detalle.oficio === 'grooming';

  // §7.4 — la etiqueta de frescura dice la verdad (envejece si el
  // sondeo falla; se renueva con cada carga buena).
  const frescura = (() => {
    if (!enVivo || ultimaCarga === null) return null;
    const seg = Math.max(0, Math.round((Date.now() - ultimaCarga) / 1000));
    if (seg < 45) return t('paseo.actualizadoRecien');
    return t('paseo.actualizadoHace', { min: Math.max(1, Math.round(seg / 60)) });
  })();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={
          detalle.iniciada_en !== null
            ? t(esGrooming ? 'grooming.vivoTituloConFecha' : 'paseo.tituloConFecha', {
                fecha: fechaLargaHumana(detalle.iniciada_en, idioma),
              })
            : t(esGrooming ? 'grooming.vivoTitulo' : 'paseo.titulo')
        }
        atras
        onAtras={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[4] }}
        refreshControl={
          // §7.4 — pull-to-refresh SOLO en la cara viva
          enVivo ? (
            <RefreshControl refreshing={refrescando} onRefresh={() => void recargar('pull')} tintColor={theme.text.secondary} />
          ) : undefined
        }
      >
        {enVivo ? (
          <>
            {/* ══ CARA EN VIVO (§7.3) — el hero vivo: UNA CitaEnVivo por
                pantalla (Ley 7), envolviendo el mapa del tramo acumulado
                o la voz honesta del GPS (jamás un mapa muerto, Ley 13) */}
            <View style={{ marginTop: spacing[3] }}>
              <CitaEnVivo capa="cuidado">
                <Tarjeta relleno="ninguno">
                  {esGrooming ? (
                    /* S60 (condición 5): la MASCOTA preside — avatar +
                       estado en voz de familia. Nada de contenedor vacío
                       donde iba el track. */
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], paddingBottom: 0 }}>
                      <AvatarMascota nombre={mascota?.nombre ?? ''} fotoUrl={mascota?.fotoUrl} tamano="md" />
                      <Text
                        style={{
                          flex: 1,
                          fontFamily: typography.family.sans.light,
                          fontSize: typography.size.lg,
                          lineHeight: Math.round(typography.size.lg * typography.leading.snug),
                          color: theme.text.primary,
                        }}
                      >
                        {mascota !== null
                          ? t('grooming.vivoEstado', { nombre: mascota.nombre })
                          : t('grooming.vivoEstadoGenerico')}
                      </Text>
                    </View>
                  ) : detalle.track_gps.length > 0 ? (
                    <View style={{ borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, overflow: 'hidden' }}>
                      <MapaRecorrido modo="vivo" puntos={detalle.track_gps} capa="cuidado" alto={200} />
                    </View>
                  ) : (
                    <Text
                      style={{
                        fontFamily: typography.family.sans.regular,
                        fontSize: typography.size.sm,
                        lineHeight: Math.round(typography.size.sm * typography.leading.normal),
                        color: theme.text.secondary,
                        padding: spacing[4],
                        paddingBottom: 0,
                      }}
                    >
                      {t('paseo.vivoSinGps')}
                    </Text>
                  )}
                  {/* inicio + tiempo transcurrido (§7.3) — el Cronometro
                      corre por diferencia contra el server */}
                  <View style={{ padding: spacing[4], gap: spacing[1] }}>
                    {detalle.iniciada_en !== null ? (
                      <>
                        <Cronometro inicioTs={detalle.iniciada_en} />
                        <Text
                          style={{
                            fontFamily: typography.family.mono.regular,
                            fontSize: typography.size.sm,
                            letterSpacing: typography.tracking.mono,
                            color: theme.text.secondary,
                          }}
                        >
                          {t('paseo.vivoEmpezo', { hora: horaMono(detalle.iniciada_en) })}
                        </Text>
                      </>
                    ) : null}
                  </View>
                </Tarjeta>
              </CitaEnVivo>
            </View>

            {/* la frescura, honesta y visible (§7.4) */}
            {frescura !== null ? (
              <Text
                style={{
                  fontFamily: typography.family.mono.regular,
                  fontSize: typography.size.xs,
                  letterSpacing: typography.tracking.mono,
                  color: theme.text.tertiary,
                }}
              >
                {frescura}
              </Text>
            ) : null}
          </>
        ) : (
          <>
            {/* ══ CARA RECORRIDO — lo caminado, con sus dos extremos
                reales (acá los nulls ya no se pintan como contenido) */}
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
          </>
        )}

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
                accessibilityLabel={t('paseo.verFoto', { i: i + 1, total: detalle.fotos.length })}
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

        {/* S61-A2 (D-387): los cuidados de la sesión en VOZ DE FAMILIA —
            chips del catálogo (nombre_familia es/en), jamás el código.
            Pinta también EN VIVO (mismo wrapper — el dueño ve lo que ya
            se hizo mientras la sesión corre, §8 estado y novedades). */}
        {detalle.servicios_aplicados.length > 0 ? (
          <View style={{ gap: spacing[2] }}>
            <Text
              style={{
                fontFamily: typography.family.sans.medium,
                fontSize: typography.size.sm,
                color: theme.text.secondary,
              }}
            >
              {t('grooming.parteCuidados')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
              {detalle.servicios_aplicados.map((s) => (
                <Insignia key={s.codigo} estado="info" etiqueta={idioma === 'en' ? s.voz_en : s.voz} />
              ))}
            </View>
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
                  {t('paseo.deFuente', { fuente: detalle.titulo_fuente })}
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

        {/* S61-A2: la próxima sesión sugerida (§8 — FECHA, jamás cita)
            en voz humana; null honesto = la línea no existe. */}
        {detalle.proxima_sesion_sugerida !== null ? (
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              color: theme.text.secondary,
            }}
          >
            {t('grooming.proximaSugerida', {
              fecha: fechaLargaHumana(detalle.proxima_sesion_sugerida, idioma),
            })}
          </Text>
        ) : null}
      </ScrollView>

      <VisorFoto
        visible={visorAbierto}
        onCerrar={() => setVisorAbierto(false)}
        fotos={detalle.fotos.map((f) => f.url)}
        indiceInicial={fotoInicial}
        etiqueta={t(esGrooming ? 'grooming.fotosDeLaSesion' : 'paseo.fotosDelPaseo')}
      />
    </View>
  );
}
