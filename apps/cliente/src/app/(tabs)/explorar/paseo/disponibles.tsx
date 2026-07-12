/**
 * PASEO — EL QUIÉN (S54-B3.2): paseadores disponibles para la ventana
 * elegida en el CUÁNDO. Recicla la anatomía de la lista B3.1 (que murió
 * como entrada) y le da el TAP VIVO: elegir paseador → (selector de
 * mascota si el hogar tiene más de una) → crear el hold de 15 min →
 * checkout. slot_ocupado en el tap (carrera real) → Aviso honesto +
 * refresh de la lista.
 *
 * ESCALERA (§4b, declarada):
 *  · Peldaño 0 — nadie puede a esa hora: vacío honesto con vuelta al
 *    CUÁNDO en un toque (jamás relleno).
 *  · Peldaño 1 — disponibles REALES: nombre + servicio + precio y
 *    duración de verdad (snapshot al crear el hold).
 *  · Peldaño 2 — datos del expediente del paseador (paseos cerrados con
 *    calidad, partes): HOY NO MUESTRA ninguno (explícito) — la fila se
 *    enriquece por dato cuando existan, no por versión.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  HojaScroll,
  Icono,
  Separador,
  Tarjeta,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  crearBloqueoAgenda,
  getEstadoOnboardingDueno,
  obtenerMascotasDeFamilia,
  obtenerPaseadoresDisponibles,
  resolverUrlFoto,
  type MascotaResumen,
  type PaseadorDisponible,
} from '@epetplace/api';
import { PlanHoja } from '@/components/plan-hoja';
import { useTraduccion } from '@/i18n';

export default function PaseoDisponibles() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const params = useLocalSearchParams<{ fecha: string; hora: string; duracion: string; plan?: string }>();
  const fecha = typeof params.fecha === 'string' ? params.fecha : '';
  const hora = typeof params.hora === 'string' ? params.hora : '';
  const duracion = Number(params.duracion ?? 0);
  // D-338: modo PLAN — el paseador elegido acá ancla el plan (§6.1 v1.2).
  const modoPlan = params.plan === '1';

  const [disponibles, setDisponibles] = useState<PaseadorDisponible[] | 'cargando' | 'error'>('cargando');
  const [mascotas, setMascotas] = useState<MascotaResumen[]>([]);
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [eligiendoMascota, setEligiendoMascota] = useState<PaseadorDisponible | null>(null);
  const [creandoHold, setCreandoHold] = useState(false);
  const [plan, setPlan] = useState<{ paseador: PaseadorDisponible; mascotaId: string } | null>(null);

  const cargar = useCallback(() => {
    setDisponibles('cargando');
    void obtenerPaseadoresDisponibles({ fecha, hora, duracion_minutos: duracion }).then((r) => {
      setDisponibles(r.ok ? r.data : 'error');
    });
  }, [fecha, hora, duracion]);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      cargar();
      void (async () => {
        const estado = await getEstadoOnboardingDueno();
        if (!vigente || !estado.ok || !estado.data.familia_id) return;
        const r = await obtenerMascotasDeFamilia(estado.data.familia_id);
        if (!vigente || !r.ok) return;
        setMascotas(r.data);
        const conFoto = r.data.filter((m): m is MascotaResumen & { foto_url: string } => m.foto_url !== null);
        if (conFoto.length > 0) {
          const urls = await Promise.all(conFoto.map((m) => resolverUrlFoto(m.foto_url)));
          if (!vigente) return;
          const mapa: Record<string, string> = {};
          conFoto.forEach((m, idx) => {
            const u = urls[idx];
            if (u !== null) mapa[m.id] = u;
          });
          setFotos(mapa);
        }
      })();
      return () => {
        vigente = false;
      };
    }, [cargar]),
  );

  // El hold nace acá: invisible al prestador hasta que el pago confirme.
  const crearHold = useCallback(
    async (p: PaseadorDisponible, mascotaId: string) => {
      if (creandoHold) return;
      setCreandoHold(true);
      const r = await crearBloqueoAgenda({
        prestador_id: p.prestador_id,
        prestador_servicio_id: p.prestador_servicio_id,
        mascota_id: mascotaId,
        fecha,
        hora,
      });
      setCreandoHold(false);
      setEligiendoMascota(null);
      if (!r.ok) {
        mostrar({ texto: r.mensaje, variante: 'error' });
        if (r.codigo === 'slot_ocupado' || r.codigo === 'slot_en_pasado') cargar();
        return;
      }
      router.push({
        pathname: '/explorar/paseo/checkout',
        params: {
          citaId: r.data.cita_id,
          expiraEn: r.data.expira_en,
          precio: String(r.data.precio),
          prestadorNombre: p.prestador_nombre,
          servicioNombre: p.servicio_nombre,
          fecha: r.data.fecha,
          hora: r.data.hora,
          duracion: String(p.duracion_minutos),
        },
      });
    },
    [creandoHold, fecha, hora, cargar, mostrar],
  );

  const alElegirMascota = useCallback(
    (p: PaseadorDisponible, mascotaId: string) => {
      if (modoPlan) {
        setPlan({ paseador: p, mascotaId });
      } else {
        void crearHold(p, mascotaId);
      }
    },
    [modoPlan, crearHold],
  );

  const alElegir = useCallback(
    (p: PaseadorDisponible) => {
      if (mascotas.length === 1) {
        alElegirMascota(p, mascotas[0].id);
      } else {
        setEligiendoMascota(p);
      }
    },
    [mascotas, alElegirMascota],
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('explorar.quienTitulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8], gap: spacing[3] }}>
        {/* la ventana elegida, en voz de máquina */}
        <Celda titulo={t('explorar.paseoTitulo')} metadataMono={`${fecha} · ${hora} · ${duracion} min`} />
        <Separador />

        {disponibles === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        ) : disponibles === 'error' ? (
          <EstadoVacio
            titulo={t('explorar.paseadoresError')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={cargar} />}
          />
        ) : disponibles.length === 0 ? (
          // Peldaño 0 — nadie puede: vuelta barata al CUÁNDO.
          <EstadoVacio
            icono={<Icono nombre="paseo" tamano={48} />}
            titulo={t('explorar.nadiePuede')}
            descripcion={t('explorar.nadiePuedeDetalle')}
            accion={<Boton variante="primario" etiqueta={t('explorar.probarOtroHorario')} onPress={() => router.back()} />}
          />
        ) : (
          <Tarjeta relleno="ninguno">
            {disponibles.map((p, i) => (
              <View key={p.prestador_servicio_id}>
                {i > 0 ? <Separador /> : null}
                <Celda
                  titulo={p.prestador_nombre}
                  subtitulo={p.servicio_nombre}
                  metadataMono={`$${p.precio.toFixed(2)} · ${p.duracion_minutos} min`}
                  interactiva
                  accessibilityRole="button"
                  onPress={() => alElegir(p)}
                />
              </View>
            ))}
          </Tarjeta>
        )}
      </ScrollView>

      {/* La cita es de UNA mascota: con más de una en el hogar, se elige. */}
      <Hoja
        visible={eligiendoMascota !== null}
        titulo={t('explorar.elegirMascota')}
        onCerrar={() => setEligiendoMascota(null)}
      >
        <HojaScroll>
          {mascotas.map((m, i) => (
            <View key={m.id}>
              {i > 0 ? <Separador /> : null}
              <Celda
                titulo={m.nombre}
                inicio={<AvatarMascota nombre={m.nombre} fotoUrl={fotos[m.id]} tamano="sm" />}
                interactiva
                accessibilityRole="button"
                onPress={() => {
                  if (eligiendoMascota) {
                    setEligiendoMascota(null);
                    alElegirMascota(eligiendoMascota, m.id);
                  }
                }}
              />
            </View>
          ))}
        </HojaScroll>
      </Hoja>

      {/* D-338: la Hoja del plan — nace con el paseador ELEGIDO */}
      <Hoja
        visible={plan !== null}
        titulo={t('plan.hojaTitulo')}
        onCerrar={() => setPlan(null)}
        conCerrar
      >
        {plan !== null ? (
          <PlanHoja
            paseador={plan.paseador}
            mascotaId={plan.mascotaId}
            fecha={fecha}
            hora={hora}
            onContratado={(contratado) => {
              setPlan(null);
              mostrar({ texto: t('plan.exito', { n: contratado.citas_generadas }), variante: 'exito' });
              // D-329: el hub vive en el stack del Hogar (otro tab) —
              // se vacía el stack de Explorar y recién ahí se navega.
              if (router.canDismiss()) router.dismissAll();
              router.navigate('/hogar/paseos');
            }}
          />
        ) : null}
      </Hoja>
    </SafeAreaView>
  );
}
