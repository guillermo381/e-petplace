// ─────────────────────────────────────────────────────────────────────
// Agenda — raíz de tab del prestador (S44-B4.1). Primera pantalla real
// sobre el design system. Dosis BAJA (Ley 4): un acento de capa, CTA
// en tinta, sin gradiente UI. Carga por Ley 13 (Esqueleto estático).
// La cita en_curso va envuelta en CitaEnVivo — UNA por pantalla (Ley 7).
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
import { obtenerCitasPaseoDelDia, obtenerMiPrestador, type CitaAgendaPaseo } from '@epetplace/api';

import { asegurarSesionDev } from '@/lib/api';

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
const INSIGNIA_POR_ESTADO: Record<string, { estado: InsigniaEstado; etiqueta: string }> = {
  pendiente:  { estado: 'proximo', etiqueta: 'Por confirmar' },
  confirmada: { estado: 'info',    etiqueta: 'Confirmada' },
  completada: { estado: 'alDia',   etiqueta: 'Completada' },
  no_show:    { estado: 'atencion', etiqueta: 'No show' },
};

function esEspecie(v: string | null): v is AvatarMascotaEspecie {
  return v !== null;
}

// Zona fin compuesta: hora en la voz de máquina (mismos tokens que
// metadataMono de Celda) + Insignia de estado apilada. FLAG B4.1: Celda
// fuerza fin XOR metadataMono y la espec pide ambos — propuesta de
// enmienda a Celda pendiente de gate (ver reporte).
function FinCita({ hora, dur, insignia }: {
  hora: string;
  dur: number | null;
  insignia?: { estado: InsigniaEstado; etiqueta: string };
}) {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: 'flex-end', gap: spacing[1] }}>
      <Text
        style={{
          fontFamily: typography.family.mono.regular,
          fontSize: typography.size.sm,
          letterSpacing: typography.tracking.mono,
          color: theme.text.secondary,
        }}
      >
        {`${hora}${dur ? ` · ${dur} min` : ''}`.toLowerCase()}
      </Text>
      {insignia ? <Insignia estado={insignia.estado} etiqueta={insignia.etiqueta} tamaño="sm" /> : null}
    </View>
  );
}

function FilaCita({ cita, enVivo }: { cita: CitaAgendaPaseo; enVivo: boolean }) {
  const router = useRouter();
  const hora = cita.hora ? cita.hora.slice(0, 5) : '—';
  const dur = cita.tipo.duracion_default_minutos;
  const insignia = !enVivo && cita.estado ? INSIGNIA_POR_ESTADO[cita.estado] : undefined;

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
          fotoUrl={cita.mascota?.foto_url ?? undefined}
          especie={cita.mascota && esEspecie(cita.mascota.especie) ? cita.mascota.especie : undefined}
          tamano="sm"
        />
      }
      fin={<FinCita hora={hora} dur={dur} insignia={insignia} />}
    />
  );
}

export default function Agenda() {
  const { theme } = useTheme();
  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [refrescando, setRefrescando] = useState(false);

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
    setPantalla({ estado: 'listo', citas: r.data });
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function refrescar() {
    setRefrescando(true);
    await cargar(true);
    setRefrescando(false);
  }

  const enVivo = pantalla.estado === 'listo' ? pantalla.citas.find((c) => c.estado === 'en_curso') : undefined;
  const resto = pantalla.estado === 'listo' ? pantalla.citas.filter((c) => c.estado !== 'en_curso') : [];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10], gap: spacing[4] }}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} />}
      >
        <Encabezado variante="portada" saludo="Tus paseos de hoy" subtitulo={fechaHumana()} />

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
              <FilaCita cita={enVivo} enVivo />
            </Tarjeta>
          </CitaEnVivo>
        )}

        {pantalla.estado === 'listo' && resto.length > 0 && (
          <Tarjeta elevacion="sm" relleno="ninguno">
            {resto.map((c, i) => (
              <View key={c.id}>
                {i > 0 && <Separador indentacion={spacing[3] + 40 + spacing[3]} />}
                <FilaCita cita={c} enVivo={false} />
              </View>
            ))}
          </Tarjeta>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
