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
import { ScrollView, Text, View } from 'react-native';
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
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  crearBloqueoAgenda,
  getEstadoOnboardingDueno,
  obtenerEspeciesElegibles,
  obtenerMascotasDeFamilia,
  obtenerPaseadoresDisponibles,
  obtenerSaldoPaquete,
  reservarSalidaPaquete,
  resolverUrlFoto,
  type MascotaResumen,
  type PaseadorDisponible,
} from '@epetplace/api';
import { PlanHoja } from '@/components/plan-hoja';
import { PaseoSocialHoja } from '@/components/paseo-social-hoja';
import { useTraduccion } from '@/i18n';

export default function PaseoDisponibles() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const params = useLocalSearchParams<{ fecha: string; hora: string; duracion: string; plan?: string; mascotaId?: string }>();
  const fecha = typeof params.fecha === 'string' ? params.fecha : '';
  const hora = typeof params.hora === 'string' ? params.hora : '';
  const duracion = Number(params.duracion ?? 0);
  // D-338: modo PLAN — el paseador elegido acá ancla el plan (§6.1 v1.2).
  const modoPlan = params.plan === '1';
  // S61-A3 (gramática canónica): la mascota YA viene elegida del paso 0
  // del CUÁNDO. La Hoja de elección de abajo queda de CINTURÓN (deep
  // link viejo sin param — el flujo no se rompe).
  const mascotaIdParam =
    typeof params.mascotaId === 'string' && params.mascotaId.length > 0 ? params.mascotaId : null;

  const [disponibles, setDisponibles] = useState<PaseadorDisponible[] | 'cargando' | 'error'>('cargando');
  const [mascotas, setMascotas] = useState<MascotaResumen[]>([]);
  // §1bis (v1.4): las especies que PUEDEN pasear — de la DB, jamás un if
  // por pantalla (null = todas mientras carga o sin config).
  const [especies, setEspecies] = useState<string[] | null>(null);
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [eligiendoMascota, setEligiendoMascota] = useState<PaseadorDisponible | null>(null);
  const [sinElegibles, setSinElegibles] = useState(false);
  const [creandoHold, setCreandoHold] = useState(false);
  const [plan, setPlan] = useState<{ paseador: PaseadorDisponible; mascotaId: string } | null>(null);
  // §6bis.3: con saldo del ancla, el dueño ELIGE — reservar contra el
  // paquete o pagar suelto. Opciones PAREJAS, cero dark patterns.
  const [conSaldo, setConSaldo] = useState<{ paseador: PaseadorDisponible; mascotaId: string; saldo: number } | null>(null);
  const [reservando, setReservando] = useState(false);
  // P19 (S59-A4): la pregunta única salta ANTES del checkout cuando la
  // mascota aún no respondió (null); el NO frena con voz honesta con
  // camino — el guard server (paseo_social_no) es el cinturón.
  const [preguntaSocial, setPreguntaSocial] = useState<{ paseador: PaseadorDisponible; mascota: MascotaResumen } | null>(null);
  const [socialNo, setSocialNo] = useState<string | null>(null);

  const elegibles =
    especies === null ? mascotas : mascotas.filter((m) => especies.includes(m.especie));

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
      void obtenerEspeciesElegibles('paseo').then((r) => {
        if (vigente && r.ok) setEspecies(r.data);
      });
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

  // Reservar CONTRA SALDO: la cita nace firme sin pago (el pago fue el
  // del paquete — invariante ampliado S57). Éxito → el hub, donde vive.
  const reservarConSaldo = useCallback(
    async (p: PaseadorDisponible, mascotaId: string) => {
      if (reservando) return;
      setReservando(true);
      const r = await reservarSalidaPaquete({
        prestador_id: p.prestador_id,
        prestador_servicio_id: p.prestador_servicio_id,
        mascota_id: mascotaId,
        fecha,
        hora,
      });
      setReservando(false);
      setConSaldo(null);
      if (!r.ok) {
        mostrar({ texto: r.mensaje, variante: 'error' });
        if (r.codigo === 'slot_ocupado' || r.codigo === 'slot_en_pasado') cargar();
        return;
      }
      mostrar({ texto: t('paquete.reservada', { n: r.data.saldo_restante }), variante: 'exito' });
      if (router.canDismiss()) router.dismissAll();
      router.navigate('/hogar/paseos');
    },
    [reservando, fecha, hora, cargar, mostrar, t],
  );

  // La continuación real (plan / saldo / hold) — P19 ya resuelta.
  const continuarConMascota = useCallback(
    (p: PaseadorDisponible, mascotaId: string) => {
      if (modoPlan) {
        setPlan({ paseador: p, mascotaId });
        return;
      }
      // ¿hay saldo de paquete DEL HOGAR con este ancla? El dueño elige (§6bis.3).
      void (async () => {
        const saldo = await obtenerSaldoPaquete({
          prestador_id: p.prestador_id,
          prestador_servicio_id: p.prestador_servicio_id,
        });
        if (saldo.ok && saldo.data !== null && saldo.data.saldo > 0) {
          setConSaldo({ paseador: p, mascotaId, saldo: saldo.data.saldo });
        } else {
          void crearHold(p, mascotaId);
        }
      })();
    },
    [modoPlan, crearHold],
  );

  // P19 — la puerta: sin responder = pregunta única; NO = voz honesta
  // con camino y la reserva NO avanza (el guard server es el cinturón).
  const alElegirMascota = useCallback(
    (p: PaseadorDisponible, mascotaId: string) => {
      const m = mascotas.find((x) => x.id === mascotaId);
      if (m !== undefined && m.paseo_social_ok === null) {
        setPreguntaSocial({ paseador: p, mascota: m });
        return;
      }
      if (m !== undefined && m.paseo_social_ok === false) {
        setSocialNo(m.nombre);
        return;
      }
      continuarConMascota(p, mascotaId);
    },
    [mascotas, continuarConMascota],
  );

  const alElegir = useCallback(
    (p: PaseadorDisponible) => {
      // §1bis: solo mascotas ELEGIBLES para pasear; hogar sin ninguna =
      // voz honesta con camino (jamás oferta vacía ni final mudo).
      if (elegibles.length === 0) {
        setSinElegibles(true);
        return;
      }
      // S61-A3: la gramática canónica ya trae la mascota del paso 0.
      if (mascotaIdParam !== null && elegibles.some((m) => m.id === mascotaIdParam)) {
        alElegirMascota(p, mascotaIdParam);
        return;
      }
      if (elegibles.length === 1) {
        alElegirMascota(p, elegibles[0].id);
      } else {
        setEligiendoMascota(p);
      }
    },
    [elegibles, mascotaIdParam, alElegirMascota],
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('explorar.quienTitulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8], gap: spacing[3] }}>
        {/* la ventana elegida, en voz de máquina — con el PARA QUIÉN
            visible (S61-A3, rasgo 1): la MISMA voz del QUIÉN del
            grooming (grooming.ventanaPara — Ley 17.3, reuso declarado) */}
        {(() => {
          const paraQuien = mascotas.find((m) => m.id === mascotaIdParam) ?? null;
          return (
            <Celda
              titulo={
                paraQuien !== null
                  ? t('grooming.ventanaPara', { nombre: paraQuien.nombre })
                  : t('explorar.paseoTitulo')
              }
              metadataMono={`${fecha} · ${hora} · ${duracion} min`}
            />
          );
        })()}
        {/* P19: la norma DECLARADA en el flujo de reserva — serena, no
            letra chica (la misma voz vive en la pregunta única) */}
        <Text
          style={{
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.sm,
            lineHeight: Math.round(typography.size.sm * typography.leading.normal),
            color: theme.text.secondary,
          }}
        >
          {t('paseoSocial.declaracion')}
        </Text>
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
          {elegibles.map((m, i) => (
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

      {/* §1bis: hogar sin mascotas elegibles — voz honesta CON CAMINO */}
      <Hoja
        visible={sinElegibles}
        titulo={t('paquete.sinPerrosTitulo')}
        onCerrar={() => setSinElegibles(false)}
        conCerrar
      >
        <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
          <Celda titulo={t('paquete.sinPerrosDetalle')} />
          <Boton
            variante="primario"
            bloque
            etiqueta={t('paquete.sinPerrosAccion')}
            onPress={() => {
              setSinElegibles(false);
              if (router.canDismiss()) router.dismissAll();
              router.navigate('/hogar/agregar');
            }}
          />
        </View>
      </Hoja>

      {/* P19: la pregunta única — SÍ sigue al flujo; NO frena con la voz */}
      <PaseoSocialHoja
        visible={preguntaSocial !== null}
        mascota={preguntaSocial?.mascota ?? null}
        onCerrar={() => setPreguntaSocial(null)}
        onRespondida={(ok) => {
          if (preguntaSocial === null) return;
          const { paseador, mascota } = preguntaSocial;
          setMascotas((prev) => prev.map((m) => (m.id === mascota.id ? { ...m, paseo_social_ok: ok } : m)));
          setPreguntaSocial(null);
          if (ok) {
            continuarConMascota(paseador, mascota.id);
          } else {
            setSocialNo(mascota.nombre);
          }
        }}
      />

      {/* P19: el NO — voz honesta CON CAMINO, jamás final mudo. La
          respuesta queda registrada y es editable desde el perfil. */}
      <Hoja
        visible={socialNo !== null}
        titulo={t('paseoSocial.celdaTitulo')}
        onCerrar={() => setSocialNo(null)}
        conCerrar
      >
        {socialNo !== null ? (
          <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            <Text
              style={{
                fontFamily: typography.family.sans.light,
                fontSize: typography.size.lg,
                lineHeight: Math.round(typography.size.lg * typography.leading.snug),
                color: theme.text.primary,
              }}
            >
              {t('paseoSocial.noVoz', { nombre: socialNo })}
            </Text>
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.sm,
                lineHeight: Math.round(typography.size.sm * typography.leading.normal),
                color: theme.text.secondary,
              }}
            >
              {t('paseoSocial.noVozCamino')}
            </Text>
            <Boton variante="primario" bloque etiqueta={t('paseoSocial.entendido')} onPress={() => setSocialNo(null)} />
          </View>
        ) : null}
      </Hoja>

      {/* §6bis.3: hay saldo con este paseador — el dueño ELIGE, parejo */}
      <Hoja
        visible={conSaldo !== null}
        titulo={t('paquete.eleccionTitulo')}
        onCerrar={() => setConSaldo(null)}
        conCerrar
      >
        {conSaldo !== null ? (
          <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            <Celda
              titulo={t('paquete.eleccionVoz', { n: conSaldo.saldo })}
              metadataMono={`${fecha} · ${hora} · ${duracion} min`}
            />
            <Boton
              variante="primario"
              bloque
              etiqueta={t('paquete.reservarConPaquete')}
              cargando={reservando}
              onPress={() => void reservarConSaldo(conSaldo.paseador, conSaldo.mascotaId)}
            />
            <Boton
              variante="secundario"
              bloque
              etiqueta={t('paquete.pagarSuelto')}
              deshabilitado={reservando}
              onPress={() => {
                const elegido = conSaldo;
                setConSaldo(null);
                void crearHold(elegido.paseador, elegido.mascotaId);
              }}
            />
          </View>
        ) : null}
      </Hoja>
    </SafeAreaView>
  );
}
