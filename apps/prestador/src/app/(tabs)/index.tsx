// ─────────────────────────────────────────────────────────────────────
// Agenda — raíz de tab del prestador (S44-B4.1). Primera pantalla real
// sobre el design system. Dosis BAJA (Ley 4): un acento de capa, CTA
// en tinta, sin gradiente UI. Carga por Ley 13 (Esqueleto estático).
// La cita en_curso va envuelta en CitaEnVivo — UNA por pantalla (Ley 7).
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Celda,
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
  type AvatarMascotaEspecie,
  type InsigniaEstado,
} from '@epetplace/ui';
import { obtenerCitasPaseoDelDia, obtenerMiPrestador, resolverUrlsFotos, type CitaAgendaPaseo } from '@epetplace/api';

import { asegurarSesionDev } from '@/lib/api';
// Riel i18n (S51-B1a): hook tipado del namespace prestador.
import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; citas: CitaAgendaPaseo[] };

// Fecha local del dispositivo, YYYY-MM-DD (en-CA da ese formato).
function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

function fechaHumana(): string {
  const s = new Intl.DateTimeFormat('es-EC', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Estado de cita → Insignia (en_curso no lleva: CitaEnVivo porta el canal).
// El tratamiento visual sale del estado de la ATENCIÓN si existe
// (B4.1-fix), y si no, del estado de la cita.
const INSIGNIA_POR_ESTADO: Record<string, { estado: InsigniaEstado; etiqueta: string }> = {
  // atención
  terminada:            { estado: 'proximo', etiqueta: 'Por cerrar' },
  cerrada_con_calidad:  { estado: 'alDia',   etiqueta: 'Cerrado' },
  // cita
  pendiente:  { estado: 'proximo', etiqueta: 'Por confirmar' },
  confirmada: { estado: 'info',    etiqueta: 'Confirmada' },
  completada: { estado: 'alDia',   etiqueta: 'Completada' },
  no_show:    { estado: 'atencion', etiqueta: 'No show' },
};

// El "estado efectivo" de la fila: prioridad a la atención (en_curso lo
// maneja aparte con CitaEnVivo; el resto va a Insignia).
function estadoEfectivo(cita: CitaAgendaPaseo): string | null {
  return cita.atencion?.estado ?? cita.estado;
}

function esEspecie(v: string | null): v is AvatarMascotaEspecie {
  return v !== null;
}

function FilaCita({ cita, enVivo, fotoUrl }: { cita: CitaAgendaPaseo; enVivo: boolean; fotoUrl?: string }) {
  const router = useRouter();
  const hora = cita.hora ? cita.hora.slice(0, 5) : '—';
  const dur = cita.tipo.duracion_default_minutos;
  // enVivo = esta fila es LA destacada con CitaEnVivo (no lleva Insignia).
  // Una atención en_curso que NO es la destacada lleva "En curso" (Ley 7:
  // un solo glow). El resto, su estado efectivo.
  const ef = estadoEfectivo(cita);
  const insignia = enVivo
    ? undefined
    : ef === 'en_curso'
      ? ({ estado: 'info', etiqueta: 'En curso' } as const)
      : ef
        ? INSIGNIA_POR_ESTADO[ef]
        : undefined;

  return (
    <Celda
      interactiva
      onPress={() => router.push({ pathname: '/cita/[citaId]', params: { citaId: cita.id } })}
      accessibilityRole="button"
      titulo={cita.mascota?.nombre ?? 'Mascota'}
      subtitulo={cita.tipo.nombre}
      inicio={
        <AvatarMascota
          nombre={cita.mascota?.nombre ?? 'Mascota'}
          fotoUrl={fotoUrl}
          especie={cita.mascota && esEspecie(cita.mascota.especie) ? cita.mascota.especie : undefined}
          tamano="sm"
        />
      }
      metadataMono={`${hora}${dur ? ` · ${dur} min` : ''}`}
      fin={insignia ? <Insignia estado={insignia.estado} etiqueta={insignia.etiqueta} tamaño="sm" /> : undefined}
    />
  );
}

export default function Agenda() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [refrescando, setRefrescando] = useState(false);
  // foto_url guarda PATH (S47-B0.2): firma en batch (1 round-trip por
  // Agenda); un path no firmable cae a la huella digna.
  const [urlsFotos, setUrlsFotos] = useState<Map<string, string>>(new Map());

  const cargar = useCallback(async (esRefresh = false) => {
    if (!esRefresh) setPantalla({ estado: 'cargando' });
    const sesion = await asegurarSesionDev();
    if (!sesion.ok) {
      setPantalla({ estado: 'error', mensaje: sesion.mensaje });
      return;
    }
    const prestador = await obtenerMiPrestador();
    if (!prestador.ok) {
      setPantalla({ estado: 'error', mensaje: prestador.mensaje });
      return;
    }
    const r = await obtenerCitasPaseoDelDia({ prestador_id: prestador.data.id, fecha: hoyLocal() });
    if (!r.ok) {
      setPantalla({ estado: 'error', mensaje: r.mensaje });
      return;
    }
    const paths = r.data
      .map((c) => c.mascota?.foto_url)
      .filter((p): p is string => typeof p === 'string' && p.length > 0);
    if (paths.length > 0) setUrlsFotos(await resolverUrlsFotos(paths));
    setPantalla({ estado: 'listo', citas: r.data });
  }, []);

  // Refetch en focus (fix gate B4.4): al volver del Cierre la lista se
  // actualiza sola. Silencioso = reemplazo directo (Ley 13) — el primer
  // focus es el montaje y pantalla ya nace 'cargando' (esqueleto solo ahí).
  useFocusEffect(
    useCallback(() => {
      void cargar(true);
    }, [cargar]),
  );

  async function refrescar() {
    setRefrescando(true);
    await cargar(true);
    setRefrescando(false);
  }

  // CitaEnVivo destaca UNA (Ley 7): la atención en_curso de iniciada_en
  // más reciente. Las demás en_curso caen al resto con Insignia "En curso".
  const citas = pantalla.estado === 'listo' ? pantalla.citas : [];
  const enCurso = citas.filter((c) => c.atencion?.estado === 'en_curso');
  const enVivo = enCurso.length
    ? enCurso.reduce((a, b) => ((b.atencion?.iniciada_en ?? '') > (a.atencion?.iniciada_en ?? '') ? b : a))
    : undefined;
  const resto = citas.filter((c) => c.id !== enVivo?.id);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10], gap: spacing[4] }}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} />}
      >
        <Encabezado variante="portada" saludo={t('agenda.saludo')} subtitulo={fechaHumana()} />

        {pantalla.estado === 'cargando' && (
          <Tarjeta elevacion="plana">
            <EsqueletoGrupo>
              <View style={{ gap: spacing[4] }}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                    <Esqueleto forma="circulo" alto={40} />
                    <View style={{ flex: 1, gap: spacing[2] }}>
                      <Esqueleto forma="linea" ancho="60%" />
                      <Esqueleto forma="linea" ancho="40%" />
                    </View>
                  </View>
                ))}
              </View>
            </EsqueletoGrupo>
          </Tarjeta>
        )}

        {pantalla.estado === 'error' && (
          <Tarjeta tinte="danger" relleno="amplio">
            <View style={{ gap: spacing[3] }}>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.base,
                  lineHeight: typography.size.base * 1.4,
                  color: theme.status.dangerText,
                }}
              >
                {pantalla.mensaje}
              </Text>
              <View style={{ alignSelf: 'flex-start' }}>
                <Boton variante="secundario" tamaño="sm" etiqueta="Reintentar" onPress={() => void cargar()} />
              </View>
            </View>
          </Tarjeta>
        )}

        {pantalla.estado === 'listo' && pantalla.citas.length === 0 && (
          <EstadoVacio
            titulo="Hoy no tenés paseos"
            descripcion="Cuando una familia agende un paseo, va a aparecer acá."
          />
        )}

        {pantalla.estado === 'listo' && enVivo && (
          <CitaEnVivo capa="cuidado">
            <Tarjeta elevacion="plana" relleno="ninguno">
              <FilaCita cita={enVivo} enVivo fotoUrl={enVivo.mascota?.foto_url ? urlsFotos.get(enVivo.mascota.foto_url) : undefined} />
            </Tarjeta>
          </CitaEnVivo>
        )}

        {pantalla.estado === 'listo' && resto.length > 0 && (
          <Tarjeta elevacion="sm" relleno="ninguno">
            {resto.map((c, i) => (
              <View key={c.id}>
                {i > 0 && <Separador indentacion={spacing[3] + 40 + spacing[3]} />}
                <FilaCita cita={c} enVivo={false} fotoUrl={c.mascota?.foto_url ? urlsFotos.get(c.mascota.foto_url) : undefined} />
              </View>
            ))}
          </Tarjeta>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
