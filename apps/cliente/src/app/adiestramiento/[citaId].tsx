/**
 * EL PARTE DE LA SESIÓN DE ADIESTRAMIENTO (S63-A Bloque 3 — el DESPUÉS
 * del dueño, MODELO_ADIESTRAMIENTO v1.1 §5/§6). Ruta PROPIA (declarado:
 * el parte narrativo por cita es otro dato que la atención compartida
 * de /paseo/[atencionId] — la tercera cara hubiera doblado esa vista).
 * Consume obtener_parte_adiestramiento TAL CUAL.
 *
 * MODELO_LOYALTY §2/§3 rige LITERAL: la progresión es UNA frase de
 * vínculo en voz humana — cero barras, cero score, cero checklist. Los
 * objetivos son chips en voz de familia (Insignia: alDia = lo logró,
 * info = lo trabajaron; jamás casillas). MEMORIAL: progresion llega
 * NULL del motor (§7.1 estructural) y la sección NO EXISTE — sin
 * hueco, sin placeholder, sin "sin datos"; el parte factual queda.
 *
 * El VIDEO es el medio del oficio (§5): clips ≤3 (techo del motor) con
 * ClipSesion de packages/ui (componente 34, espec aprobada S63 — este
 * parte es su primer consumidor real; el Durante del prestador es el
 * segundo).
 *
 * TESIS: "Esto fue lo que tu perro aprendió hoy — y así vas vos con él."
 * FIRMA: la frase de vínculo de la progresión (voz humana DM Sans
 * light, §6: 'Zeus ya domina 3 de los 5 comandos de su programa.').
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  ClipSesion,
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
import {
  obtenerParteAdiestramiento,
  resolverUrlsClips,
  type ParteAdiestramiento,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';

export default function ParteAdiestramientoPantalla() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, idioma } = useTraduccion();
  const params = useLocalSearchParams<{ citaId: string; mascotaNombre?: string }>();
  const citaId = typeof params.citaId === 'string' ? params.citaId : '';
  const nombre =
    typeof params.mascotaNombre === 'string' && params.mascotaNombre.length > 0
      ? params.mascotaNombre
      : t('onboarding.tuMascota');

  const [parte, setParte] = useState<ParteAdiestramiento | 'cargando' | 'error'>('cargando');
  const [clipUrls, setClipUrls] = useState<Record<string, string>>({});
  // S71-A CURA-3 🟠 — el botón de reintento hacía `setParte('cargando')` y
  // el efecto NO dependía de `parte`: no se re-consultaba nada y la
  // pantalla quedaba en esqueleto PERMANENTE. Con el error de red aún
  // vivo, el reintento era un callejón sin salida. `intento` es el
  // disparador explícito — patrón del vecino (`parte/[eventoId]`).
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      setParte('cargando');
      void (async () => {
        const r = await obtenerParteAdiestramiento(citaId);
        if (!vigente) return;
        if (!r.ok) {
          setParte('error');
          return;
        }
        setParte(r.data);
        if (r.data.clips.length > 0) {
          const urls = await resolverUrlsClips(r.data.clips.map((c) => c.storage_path));
          if (vigente) setClipUrls(urls);
        }
      })();
      return () => {
        vigente = false;
      };
    }, [citaId, intento]),
  );

  // §6 — la frase de vínculo: narrativa, jamás número expuesto como score
  const fraseProgresion = (p: NonNullable<ParteAdiestramiento['progresion']>): string => {
    if (p.dominados_n === 0) return t('adiestramiento.progresionFraseCero', { nombre });
    if (p.del_programa_n === null) {
      return t('adiestramiento.progresionFraseSinTotal', { nombre, n: String(p.dominados_n) });
    }
    return t('adiestramiento.progresionFrase', {
      nombre,
      n: String(p.dominados_n),
      total: String(p.del_programa_n),
    });
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('adiestramiento.parteTitulo')}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8], gap: spacing[5] }}>
        {parte === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="60%" alto={24} />
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={180} />
            </View>
          </EsqueletoGrupo>
        ) : parte === 'error' ? (
          <EstadoVacio
            titulo={t('adiestramiento.parteError')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setIntento((n) => n + 1)} />}
          />
        ) : (
          <>
            {/* Sesión k de N — identidad del programa (§1), voz de máquina */}
            {parte.sesion !== null ? (
              <Text
                style={{
                  fontFamily: typography.family.mono.regular,
                  fontSize: typography.size.sm,
                  color: theme.text.secondary,
                }}
              >
                {t('adiestramiento.sesionKdeN', {
                  k: String(parte.sesion.numero),
                  n: String(parte.sesion.de),
                }).toLowerCase()}
              </Text>
            ) : null}

            {/* LA FIRMA — la frase de vínculo (§6). Memorial: progresion
                llega NULL y esta sección NO existe — sin hueco. */}
            {parte.progresion !== null ? (
              <Text
                style={{
                  fontFamily: typography.family.sans.light,
                  fontSize: typography.size.xl,
                  lineHeight: Math.round(typography.size.xl * 1.3),
                  color: theme.text.primary,
                }}
              >
                {fraseProgresion(parte.progresion)}
              </Text>
            ) : null}

            {/* Lo que trabajaron — chips en voz de familia; el logrado
                se distingue (alDia), jamás checklist */}
            {parte.objetivos.length > 0 ? (
              <View style={{ gap: spacing[2] }}>
                <Text
                  style={{
                    fontFamily: typography.family.sans.medium,
                    fontSize: typography.size.sm,
                    color: theme.text.secondary,
                  }}
                >
                  {t('adiestramiento.parteObjetivos')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
                  {parte.objetivos.map((o) => (
                    <Insignia
                      key={o.codigo}
                      estado={o.alcanzado ? 'alDia' : 'info'}
                      etiqueta={idioma === 'en' ? o.nombre_familia_en : o.nombre_familia}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/* Los clips — el medio del oficio (§5); ≤3, techo del motor */}
            {parte.clips.length > 0 ? (
              <View style={{ gap: spacing[3] }}>
                <Text
                  style={{
                    fontFamily: typography.family.sans.medium,
                    fontSize: typography.size.sm,
                    color: theme.text.secondary,
                  }}
                >
                  {t('adiestramiento.parteClips')}
                </Text>
                {parte.clips.map((c) => {
                  const url = clipUrls[c.storage_path];
                  return url !== undefined ? (
                    <ClipSesion
                      key={c.storage_path}
                      uri={url}
                      duracionSegundos={c.duracion_segundos}
                      descripcion={c.descripcion}
                    />
                  ) : null;
                })}
              </View>
            ) : null}

            {/* La nota conductual */}
            {parte.notas.length > 0 ? (
              <View style={{ gap: spacing[2] }}>
                <Text
                  style={{
                    fontFamily: typography.family.sans.medium,
                    fontSize: typography.size.sm,
                    color: theme.text.secondary,
                  }}
                >
                  {t('adiestramiento.parteNotas')}
                </Text>
                {parte.notas.map((n, i) => (
                  <Text
                    key={i}
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.md,
                      lineHeight: Math.round(typography.size.md * 1.45),
                      color: theme.text.primary,
                    }}
                  >
                    {n.texto}
                  </Text>
                ))}
              </View>
            ) : null}

            {/* Para practicar en casa (§5 founder S62) — sección propia */}
            {parte.instrucciones_familia !== null ? (
              <Tarjeta tinte="cuidado">
                <View style={{ gap: spacing[2] }}>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.medium,
                      fontSize: typography.size.sm,
                      color: theme.text.secondary,
                    }}
                  >
                    {t('adiestramiento.parteInstrucciones')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.md,
                      lineHeight: Math.round(typography.size.md * 1.45),
                      color: theme.text.primary,
                    }}
                  >
                    {parte.instrucciones_familia}
                  </Text>
                </View>
              </Tarjeta>
            ) : null}

            {/* El mensaje a la familia — cierre emocional VERBATIM
                (patrón del parte del paseo) */}
            {parte.mensaje_familia !== null ? (
              <>
                <Separador />
                <View style={{ gap: spacing[2] }}>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.medium,
                      fontSize: typography.size.sm,
                      color: theme.text.secondary,
                    }}
                  >
                    {t('adiestramiento.parteMensajeTitulo')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.light,
                      fontSize: typography.size.lg,
                      lineHeight: Math.round(typography.size.lg * 1.4),
                      color: theme.text.primary,
                    }}
                  >
                    {parte.mensaje_familia}
                  </Text>
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
