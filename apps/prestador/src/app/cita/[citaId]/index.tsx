// ─────────────────────────────────────────────────────────────────────
// Detalle/Preparar — /cita/[citaId] (S44-B4.2). Dosis baja.
//
// Principio 7.5: la URL rinde la verdad. Al montar se consulta el
// estado real (obtenerPaseoPorCita) y se redirige: en_curso → durante,
// terminada/cerrada → cierre. Deep-link y refresh caen bien parados.
//
// Datos: SOLO los contratos existentes (obtenerPaseoPorCita +
// obtenerCitasPaseoDelDia). Notas de la familia y raza/edad NO están
// en los contratos → secciones omitidas en esta pasada (reporte B4.2).
// La cita se resuelve contra la lista de HOY: un deep-link a una cita
// de otro día cae en "ya no disponible" (limitación F1 reportada).
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Insignia,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
  type AvatarMascotaEspecie,
  type InsigniaEstado,
} from '@epetplace/ui';
import {
  iniciarAtencionPaseo,
  obtenerCitasPaseoDelDia,
  obtenerMiPrestador,
  obtenerPaseoPorCita,
  type CitaAgendaPaseo,
} from '@epetplace/api';

import { asegurarSesionDev } from '@/lib/api';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'no_existe' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; cita: CitaAgendaPaseo };

function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

const INSIGNIA_POR_ESTADO: Record<string, { estado: InsigniaEstado; etiqueta: string }> = {
  pendiente:  { estado: 'proximo', etiqueta: 'Por confirmar' },
  confirmada: { estado: 'info',    etiqueta: 'Confirmada' },
  completada: { estado: 'alDia',   etiqueta: 'Completada' },
  no_show:    { estado: 'atencion', etiqueta: 'No show' },
};

function esEspecie(v: string | null): v is AvatarMascotaEspecie {
  return v !== null;
}

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function DetalleCita() {
  const { theme } = useTheme();
  const router = useRouter();
  const { mostrar } = useAviso();
  const { citaId = '' } = useLocalSearchParams<{ citaId: string }>();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [iniciando, setIniciando] = useState(false);
  const iniciandoRef = useRef(false);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setPantalla({ estado: 'cargando' });
    const sesion = await asegurarSesionDev();
    if (!sesion.ok) {
      setPantalla({ estado: 'error', mensaje: sesion.mensaje });
      return;
    }

    // 1. La verdad del estado (7.5): redirect si la atención ya avanzó.
    const paseo = await obtenerPaseoPorCita(citaId);
    if (!paseo.ok) {
      if (paseo.codigo === 'cita_no_encontrada') setPantalla({ estado: 'no_existe' });
      else setPantalla({ estado: 'error', mensaje: paseo.mensaje });
      return;
    }
    if (paseo.data.estado === 'en_curso') {
      router.replace({ pathname: '/cita/[citaId]/durante', params: { citaId } });
      return;
    }
    if (paseo.data.estado === 'terminada' || paseo.data.estado === 'cerrada_con_calidad') {
      router.replace({ pathname: '/cita/[citaId]/cierre', params: { citaId } });
      return;
    }

    // 2. sin_iniciar: datos de la cita desde la lista de HOY.
    const prestador = await obtenerMiPrestador();
    if (!prestador.ok) {
      setPantalla({ estado: 'error', mensaje: prestador.mensaje });
      return;
    }
    const dia = await obtenerCitasPaseoDelDia({ prestador_id: prestador.data.id, fecha: hoyLocal() });
    if (!dia.ok) {
      setPantalla({ estado: 'error', mensaje: dia.mensaje });
      return;
    }
    const cita = dia.data.find((c) => c.id === citaId);
    if (!cita) {
      setPantalla({ estado: 'no_existe' });
      return;
    }
    setPantalla({ estado: 'listo', cita });
  }, [citaId, router]);

  // Focus-back re-consulta (7.5 también al volver, no solo al montar).
  useFocusEffect(
    useCallback(() => {
      void cargar(true);
    }, [cargar]),
  );

  async function iniciar() {
    if (iniciandoRef.current) return;
    iniciandoRef.current = true;
    setIniciando(true);
    const r = await iniciarAtencionPaseo({ cita_id: citaId });
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      setIniciando(false);
      iniciandoRef.current = false;
      return;
    }
    router.replace({ pathname: '/cita/[citaId]/durante', params: { citaId } });
    // lock se queda: la pantalla se desmonta
  }

  const cita = pantalla.estado === 'listo' ? pantalla.cita : null;
  const nombre = cita?.mascota?.nombre ?? 'Mascota';
  const insignia = cita?.estado ? INSIGNIA_POR_ESTADO[cita.estado] : undefined;
  const hora = cita?.hora ? cita.hora.slice(0, 5) : '—';
  const dur = cita?.tipo.duracion_default_minutos;
  const conCta = cita?.estado === 'confirmada';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10], gap: spacing[4] }}>
        <Encabezado
          variante="navegacion"
          titulo={cita ? `Paseo de ${nombre}` : 'Paseo'}
          atras
          onAtras={() => router.back()}
        />

        {pantalla.estado === 'cargando' && (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <View style={{ alignItems: 'center', gap: spacing[3], paddingVertical: spacing[4] }}>
                <Esqueleto forma="circulo" alto={96} />
                <Esqueleto forma="linea" ancho="40%" />
              </View>
              <Esqueleto forma="bloque" alto={96} />
              <Esqueleto forma="bloque" alto={48} />
            </View>
          </EsqueletoGrupo>
        )}

        {pantalla.estado === 'no_existe' && (
          <EstadoVacio
            titulo="Esta cita ya no está disponible"
            descripcion="Puede haberse movido o cancelado. Volvé a la agenda para ver tus paseos de hoy."
            accion={<Boton variante="secundario" etiqueta="Volver a la agenda" onPress={() => router.back()} />}
          />
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

        {cita && (
          <>
            {/* La mascota — voz humana */}
            <View style={{ alignItems: 'center', gap: spacing[3], paddingVertical: spacing[4] }}>
              <AvatarMascota
                nombre={nombre}
                fotoUrl={cita.mascota?.foto_url ?? undefined}
                especie={cita.mascota && esEspecie(cita.mascota.especie) ? cita.mascota.especie : undefined}
                tamano="lg"
              />
              <View style={{ alignItems: 'center', gap: spacing[1] }}>
                <Text
                  style={{
                    fontFamily: typography.family.sans.light,
                    fontSize: typography.size.xl,
                    color: theme.text.primary,
                  }}
                >
                  {nombre}
                </Text>
                {cita.mascota?.especie ? (
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.sm,
                      color: theme.text.secondary,
                    }}
                  >
                    {capitalizar(cita.mascota.especie)}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* La cita */}
            <Tarjeta elevacion="plana" relleno="amplio">
              <View style={{ gap: spacing[2] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.medium,
                      fontSize: typography.size.base,
                      color: theme.text.primary,
                    }}
                  >
                    {cita.tipo.nombre}
                  </Text>
                  {insignia ? <Insignia estado={insignia.estado} etiqueta={insignia.etiqueta} tamaño="sm" /> : null}
                </View>
                <Text
                  style={{
                    fontFamily: typography.family.mono.regular,
                    fontSize: typography.size.sm,
                    letterSpacing: typography.tracking.mono,
                    color: theme.text.secondary,
                  }}
                >
                  {`hoy · ${hora}${dur ? ` · ${dur} min` : ''}`}
                </Text>
              </View>
            </Tarjeta>

            {/* CTA único — solo confirmada y sin iniciar (dosis baja: tinta) */}
            {conCta && (
              <Boton
                variante="primario"
                etiqueta="Iniciar paseo"
                bloque
                cargando={iniciando}
                onPress={() => void iniciar()}
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
