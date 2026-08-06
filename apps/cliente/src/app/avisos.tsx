/**
 * LA CAMPANA — la lista de avisos del DUEÑO (S88-D, lámina FIRMADA
 * `docs/laminas/LAMINA_CAMPANA.md`; forma calcada del precedente de C —
 * §6 del método: se comparte la FORMA, el destino y la voz son de cada
 * casa).
 *
 * - Más nuevo arriba; cada aviso con su VOZ HUMANA (viaja como DATO — la
 *   pantalla NO traduce tipos; null honesto cae a genérico digno), su
 *   momento relativo y de qué mascota habla (§2).
 * - Tocar = marcar leído + ir AL LUGAR DEL HECHO (§3). El destino lo arma
 *   `lib/destino-aviso.ts` (cita · expediente/carnet · plan · pagos);
 *   sin destino = la fila se muestra y NO es tocable.
 * - No leídos por PRESENCIA (huella chica), jamás número (LOYALTY §3).
 * - Vacío honesto (§4, literal firmado). El memorial calla ACÁ TAMBIÉN —
 *   lo hereda del motor, esta pantalla no vuelve a decidirlo.
 * - NO hace: marcar todo leído · mostrar descartados · repetir lo
 *   resuelto.
 * - Refetch en focus: al volver del lugar del hecho, el leído se lee de
 *   la fuente, no de la memoria local.
 *
 * TESIS: «Lo que pasó con los tuyos te espera acá, y cada aviso te lleva
 * a donde pasó.» FIRMA: la huella de presencia (la marca de la casa
 * diciendo «hay algo tuyo»). CHANEL: sin encabezados de sección, sin
 * agrupar por día — una lista es una lista. Escalera: peldaño 0/1 por
 * datos; no muestra el expediente.
 */

import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg from 'react-native-svg';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Huella,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { fechaCortaMono } from '@epetplace/i18n';
import {
  marcarAvisoLeido,
  obtenerMisAvisos,
  type AvisoDeCampana,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { destinoDeAviso, type DestinoAviso } from '@/lib/destino-aviso';

/** Lado de la huella-marcador de no leído: presencia, jamás número. */
const LADO_HUELLA = 10;

export default function Avisos() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [avisos, setAvisos] = useState<AvisoDeCampana[]>([]);
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const r = await obtenerMisAvisos();
        if (!vigente) return;
        if (!r.ok) {
          setEstado('error');
          return;
        }
        setAvisos(r.data);
        setEstado('listo');
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  /** El momento relativo — voz corta; lo viejo cae a la fecha del riel. */
  function momento(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const min = Math.floor(ms / 60000);
    if (min < 1) return t('avisos.momentoRecien');
    if (min < 60) return t('avisos.momentoMin', { n: min });
    const horas = Math.floor(min / 60);
    if (horas < 24) return t('avisos.momentoHoras', { n: horas });
    if (horas < 48) return t('avisos.momentoAyer');
    return fechaCortaMono(iso, idioma);
  }

  async function alTocar(a: AvisoDeCampana, destino: Exclude<DestinoAviso, null>) {
    // §3: lo marca leído Y lleva al lugar del hecho. Optimista local; si
    // el marcado falla, el focus-refetch al volver dice la verdad — y el
    // fallo NO le corta el viaje a la persona (el destino es el acto).
    setAvisos((prev) => prev.map((x) => (x.id === a.id ? { ...x, leida: true } : x)));
    void marcarAvisoLeido(a.id).then((r) => {
      if (!r.ok && r.codigo !== 'aviso_no_encontrado') {
        mostrar({ texto: r.mensaje, variante: 'error' });
      }
    });
    if ('params' in destino) {
      router.push({ pathname: destino.pathname, params: destino.params });
    } else {
      router.push(destino.pathname);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('avisos.titulo')} atras onAtras={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6] }}>
        {estado === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={72} />
              <Esqueleto forma="bloque" ancho="100%" alto={72} />
              <Esqueleto forma="bloque" ancho="100%" alto={72} />
            </View>
          </EsqueletoGrupo>
        ) : estado === 'error' ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('avisos.errorCargar')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('cuenta.reintentar')}
                onPress={() => {
                  setEstado('cargando');
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        ) : avisos.length === 0 ? (
          // §4: vacío honesto — sin ilustración triste ni celebración.
          <EstadoVacio registro="seccion" titulo={t('avisos.vacio')} />
        ) : (
          <Tarjeta>
            {avisos.map((a, i) => {
              const destino = destinoDeAviso(a);
              const titulo = a.titulo ?? t('avisos.sinVozTitulo');
              const meta = [momento(a.creadoEn), a.mascotaNombre].filter(Boolean).join(' · ');
              // memorial no porta `active` (degrada a primary) — el guard
              // es el del precedente de C, no un cast a ciegas.
              const acento = 'active' in theme.accent ? (theme.accent as { active: string }).active : theme.accent.primary;
              return (
                <View key={a.id}>
                  {i > 0 ? <Separador /> : null}
                  <Pressable
                    disabled={destino === null}
                    onPress={destino !== null ? () => void alTocar(a, destino) : undefined}
                    accessibilityRole={destino !== null ? 'button' : undefined}
                    accessibilityLabel={a.leida ? titulo : `${titulo}, ${t('avisos.noLeido')}`}
                    style={{ paddingVertical: spacing[3], flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}
                  >
                    <View style={{ flex: 1, gap: spacing[1] }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                        {!a.leida ? (
                          // La huella marca PRESENCIA (jamás número) — la
                          // visual se esconde: el estado viaja en el label.
                          <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                            <Svg width={LADO_HUELLA} height={LADO_HUELLA} viewBox="0 0 24 24">
                              <Huella color={acento} />
                            </Svg>
                          </View>
                        ) : null}
                        <Text
                          style={{
                            flex: 1,
                            fontFamily: a.leida ? typography.family.sans.regular : typography.family.sans.medium,
                            fontSize: typography.size.base,
                            color: theme.text.primary,
                          }}
                        >
                          {titulo}
                        </Text>
                      </View>
                      {a.mensaje !== null ? <Texto variante="apoyo">{a.mensaje}</Texto> : null}
                      {meta !== '' ? <Texto variante="dato">{meta}</Texto> : null}
                    </View>
                    {destino !== null ? (
                      <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.lg, color: theme.text.secondary }}>
                        {'›'}
                      </Text>
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </Tarjeta>
        )}
      </ScrollView>
    </View>
  );
}
