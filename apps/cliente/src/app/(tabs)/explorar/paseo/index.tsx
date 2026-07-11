/**
 * PASEO — EL CUÁNDO (S54-B3.2, decisión founder: momento-primero).
 * El dueño primero dice CUÁNDO (día + hora de inicio + duración) y
 * recién ahí ve QUIÉNES pueden (→ /explorar/paseo/disponibles).
 *
 * Piezas 100% del sistema (Ley 11 sin nacimientos): Celdas que abren
 * Hojas de selección (patrón de interacción de CampoFecha compuesto de
 * Celda + Hoja + HojaScroll) y SelectorOpcion para la duración.
 *
 * ESCALERA (§4b, declarada):
 *  · Peldaño 0 — sin oferta activa de paseo: EstadoVacio honesto que
 *    educa (jamás selectores contra un catálogo vacío).
 *  · Peldaño 1 — selectores sobre lo REAL: duraciones derivadas de las
 *    ofertas activas (hoy una sola: 30 min, preseleccionada — jamás
 *    opciones fantasma); 14 días; horas alineadas a 30 min (las de hoy
 *    filtran lo que ya pasó).
 *  · Peldaño 2 — datos del expediente: HOY NO MUESTRA ninguno
 *    (explícito). Cuando el expediente sepa rutinas (B4+), el CUÁNDO
 *    podrá sugerir "su hora habitual" — por dato, no por versión.
 */

import { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  HojaScroll,
  Icono,
  SelectorOpcion,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import { obtenerOfertaPaseo, type OfertaPaseo } from '@epetplace/api';
import { useTraduccion } from '@/i18n';

const HORA_MIN = 6; // 06:00 — primera hora ofrecible del día
const HORA_MAX = 20; // 20:00 — última hora de inicio

function fechaLocalISO(d: Date): string {
  return new Intl.DateTimeFormat('en-CA').format(d);
}

export default function PaseoCuando() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const [oferta, setOferta] = useState<OfertaPaseo[] | 'cargando' | 'error'>('cargando');
  const [dia, setDia] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [duracion, setDuracion] = useState<number | null>(null);
  const [hojaAbierta, setHojaAbierta] = useState<'dia' | 'hora' | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void obtenerOfertaPaseo().then((r) => {
        if (!vigente) return;
        setOferta(r.ok ? r.data : 'error');
        if (r.ok) {
          const unicas = [...new Set(r.data.map((o) => o.duracion_minutos))];
          if (unicas.length === 1) setDuracion(unicas[0]);
        }
      });
      return () => {
        vigente = false;
      };
    }, []),
  );

  // Duraciones REALES de la oferta activa (jamás opciones fantasma).
  const duraciones = useMemo(
    () => (Array.isArray(oferta) ? [...new Set(oferta.map((o) => o.duracion_minutos))].sort((a, b) => a - b) : []),
    [oferta],
  );

  // Horas alineadas a 30 min; para HOY se filtran las que ya pasaron.
  const horasDe = useCallback((fechaISO: string): string[] => {
    const ahora = new Date();
    const esHoy = fechaISO === fechaLocalISO(ahora);
    const todas: string[] = [];
    for (let h = HORA_MIN; h <= HORA_MAX; h++) {
      for (const m of [0, 30]) {
        if (h === HORA_MAX && m > 0) continue;
        if (esHoy && (h < ahora.getHours() || (h === ahora.getHours() && m <= ahora.getMinutes()))) continue;
        todas.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return todas;
  }, []);

  // Próximos 14 días — hoy incluido solo si le quedan horas.
  const dias = useMemo(() => {
    const lista: Array<{ iso: string; etiqueta: string }> = [];
    const fmt = new Intl.DateTimeFormat(idioma === 'es' ? 'es' : 'en', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = fechaLocalISO(d);
      if (i === 0 && horasDe(iso).length === 0) continue;
      const relativo = i === 0 ? t('explorar.cuandoHoy') : i === 1 ? t('explorar.cuandoManana') : null;
      const corta = fmt.format(d).toLowerCase();
      lista.push({ iso, etiqueta: relativo ? `${relativo} · ${corta}` : corta });
    }
    return lista;
  }, [idioma, t, horasDe]);

  const etiquetaDia = dias.find((d) => d.iso === dia)?.etiqueta ?? null;
  const horas = dia ? horasDe(dia) : [];
  const ternaCompleta = dia !== null && hora !== null && duracion !== null;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('explorar.paseoTitulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8], gap: spacing[4] }}>
        {oferta === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
            </View>
          </EsqueletoGrupo>
        ) : oferta === 'error' ? (
          <EstadoVacio
            titulo={t('explorar.paseadoresError')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setOferta('cargando')} />}
          />
        ) : oferta.length === 0 ? (
          // Peldaño 0 — el vacío honesto que educa.
          <EstadoVacio
            icono={<Icono nombre="paseo" tamano={48} />}
            titulo={t('explorar.paseadoresVacio')}
            descripcion={t('explorar.paseadoresVacioDetalle')}
          />
        ) : (
          <>
            <Tarjeta relleno="ninguno">
              <Celda
                titulo={t('explorar.cuandoDia')}
                subtitulo={etiquetaDia ?? t('explorar.cuandoElegir')}
                interactiva
                onPress={() => setHojaAbierta('dia')}
                accessibilityRole="button"
              />
              <Separador />
              <Celda
                titulo={t('explorar.cuandoHora')}
                subtitulo={hora ?? t('explorar.cuandoElegir')}
                interactiva
                onPress={() => {
                  if (dia) setHojaAbierta('hora');
                  else setHojaAbierta('dia');
                }}
                accessibilityRole="button"
              />
            </Tarjeta>

            <SelectorOpcion
              etiqueta={t('explorar.cuandoDuracion')}
              opciones={duraciones.map((d) => ({ codigo: String(d), etiqueta: `${d} min` }))}
              seleccionada={duracion !== null ? String(duracion) : undefined}
              onSelect={(codigo) => setDuracion(Number(codigo))}
            />

            <Boton
              variante="primario"
              etiqueta={t('explorar.verQuienPuede')}
              deshabilitado={!ternaCompleta}
              onPress={() => {
                if (!ternaCompleta) return;
                router.push({
                  pathname: '/explorar/paseo/disponibles',
                  params: { fecha: dia, hora, duracion: String(duracion) },
                });
              }}
            />
          </>
        )}
      </ScrollView>

      <Hoja visible={hojaAbierta === 'dia'} titulo={t('explorar.cuandoDia')} onCerrar={() => setHojaAbierta(null)}>
        <HojaScroll>
          {dias.map((d, i) => (
            <View key={d.iso}>
              {i > 0 ? <Separador /> : null}
              <Celda
                titulo={d.etiqueta}
                interactiva
                accessibilityRole="button"
                onPress={() => {
                  setDia(d.iso);
                  // si la hora elegida ya no existe en el día nuevo, se limpia
                  setHora((h) => (h && horasDe(d.iso).includes(h) ? h : null));
                  setHojaAbierta(null);
                }}
              />
            </View>
          ))}
        </HojaScroll>
      </Hoja>

      <Hoja visible={hojaAbierta === 'hora'} titulo={t('explorar.cuandoHora')} onCerrar={() => setHojaAbierta(null)}>
        <HojaScroll>
          {horas.map((h, i) => (
            <View key={h}>
              {i > 0 ? <Separador /> : null}
              <Celda
                titulo={h}
                interactiva
                accessibilityRole="button"
                onPress={() => {
                  setHora(h);
                  setHojaAbierta(null);
                }}
              />
            </View>
          ))}
        </HojaScroll>
      </Hoja>
    </SafeAreaView>
  );
}
