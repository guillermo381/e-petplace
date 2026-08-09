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

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Texto,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  crearBloqueoAgenda,
  getEstadoOnboardingDueno,
  obtenerMascotasDeFamilia,
  obtenerPaseadoresDisponibles,
  obtenerSaldoPaquete,
  reservarSalidaPaquete,
  resolverUrlFoto,
  type MascotaResumen,
  type PaseadorDisponible,
  mascotasElegibles,
  obtenerPerfilesPublicos,
  type PerfilPublico,
} from '@epetplace/api';
import { PlanHoja } from '@/components/plan-hoja';
import { PaseoSocialHoja } from '@/components/paseo-social-hoja';
import { useTraduccion } from '@/i18n';
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';
import { tomarPedido } from '@/lib/senal-reserva';
import { ofrecibles, useEspeciesElegibles } from '@/lib/especies-elegibles';
import { PreviewPrestador } from '@/components/preview-prestador';

export default function PaseoDisponibles() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
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
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [eligiendoMascota, setEligiendoMascota] = useState<PaseadorDisponible | null>(null);
  const [sinElegibles, setSinElegibles] = useState(false);
  /** P0 (9-ago-2026): el catálogo de especies todavía no llegó (`cargando`) o
   *  no llegó nunca (`error`). **No es lo mismo que no tener perros**, y por
   *  eso no comparte estado con `sinElegibles`: mezclarlos es exactamente el
   *  bug que se está curando. */
  const [catalogoNoLlego, setCatalogoNoLlego] = useState<'cargando' | 'error' | null>(null);
  const [creandoHold, setCreandoHold] = useState(false);
  const [plan, setPlan] = useState<{ paseador: PaseadorDisponible; mascotaId: string } | null>(null);
  // §6bis.3: con saldo del ancla, el dueño ELIGE — reservar contra el
  // paquete o pagar suelto. Opciones PAREJAS, cero dark patterns.
  const [conSaldo, setConSaldo] = useState<{ paseador: PaseadorDisponible; mascotaId: string; saldo: number } | null>(null);
  const [reservando, setReservando] = useState(false);
  /** S91-C · el enriquecimiento del preview, de `v_prestadores_publicos`
   *  (jamás la tabla). Carga SECUNDARIA: la fila se pinta con lo que el
   *  lector de disponibilidad ya trajo y se completa cuando llega — hacer
   *  esperar la disponibilidad por una foto sería D-531 otra vez. */
  const [perfiles, setPerfiles] = useState<Record<string, PerfilPublico>>({});

  // Los perfiles de los que SE ESTÁN OFRECIENDO — ni uno más.
  useEffect(() => {
    if (!Array.isArray(disponibles)) return;
    const ids = [...new Set(disponibles.map((x) => x.prestador_id))];
    if (ids.length === 0) return;
    let vigente = true;
    void obtenerPerfilesPublicos(ids).then((r) => {
      if (!vigente || !r.ok) return;
      setPerfiles(Object.fromEntries(r.data.map((p) => [p.id, p])));
    });
    return () => {
      vigente = false;
    };
  }, [disponibles]);

  // P19 (S59-A4): la pregunta única salta ANTES del checkout cuando la
  // mascota aún no respondió (null); el NO frena con voz honesta con
  // camino — el guard server (paseo_social_no) es el cinturón.
  const [preguntaSocial, setPreguntaSocial] = useState<{ paseador: PaseadorDisponible; mascota: MascotaResumen } | null>(null);
  const [socialNo, setSocialNo] = useState<string | null>(null);

  // S73 (letra de elegibilidad): frontera única — momento vital + especie.
  const faseEspecies = useEspeciesElegibles('paseo');
  const elegibles = ofrecibles(mascotas, faseEspecies);

  const cargar = useCallback(() => {
    setDisponibles('cargando');
    void obtenerPaseadoresDisponibles({ fecha, hora, duracion_minutos: duracion }).then((r) => {
      setDisponibles(r.ok ? r.data : 'error');
    });
  }, [fecha, hora, duracion]);

  // S91-C · EL PEDIDO QUE VUELVE DEL DETALLE. La barra fija de
  // `/prestador/[id]` no reserva: PIDE. Acá se toma UNA vez (la lectura
  // es destructiva) y se ejecuta EL MISMO camino del botón de la fila —
  // un solo flujo de reserva en toda la app.
  useFocusEffect(
    useCallback(() => {
      const pedida = tomarPedido();
      if (pedida === null || !Array.isArray(disponibles)) return;
      const oferta = disponibles.find((p) => p.prestador_servicio_id === pedida);
      // Si la oferta ya no está (se ocupó el slot mientras miraba), no se
      // reserva a ciegas: la lista habla sola en su próximo refresh.
      if (oferta !== undefined) alElegir(oferta);
    }, [disponibles]),
  );

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

  // Reservar CONTRA SALDO: la cita nace firme sin pago (el pago fue el
  // del paquete — invariante ampliado S57). Éxito → Go home (D-430: la
  // salida de reserva aterriza en el Hogar como el suelto, NO en el hub;
  // la regla de §3 queda sin excepciones). El toast dice el saldo.
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
      router.navigate('/hogar');
    },
    [reservando, fecha, hora, cargar, mostrar, t],
  );

  // La continuación real (plan / saldo / hold) — P19 ya resuelta.
  const continuarConMascota = useCallback(
    (p: PaseadorDisponible, mascotaId: string) => {
      if (modoPlan) {
        // S79 + Ley 23: la puerta no ofrece lo que el server va a
        // rechazar — sin precio mensual declarado, contratar rebota
        // plan_no_ofrecido; la Hoja no se abre y la voz da el camino.
        if (p.precio_mensual_plan === null) {
          mostrar({ texto: t('plan.noOfrecido'), variante: 'error' });
          return;
        }
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
      /**
       * §1bis: solo mascotas ELEGIBLES para pasear.
       *
       * ⚠️ SE MIRA LA FASE, JAMÁS EL LARGO — y acá está el bug que el founder
       * cazó en dispositivo (P0, 9-ago-2026): `ofrecibles()` devuelve `[]` en
       * **las tres** fases —`cargando`, `error` y «de verdad no hay»— así que
       * `elegibles.length === 0` significaba tres cosas y las tres se le
       * contestaban al usuario con la misma frase: *«tu hogar todavía no tiene
       * un perro registrado»*. **Con dos perros vivos en el hogar.**
       *
       * Lo dice la propia lib que este archivo consume
       * (`lib/especies-elegibles.ts`): *«la pantalla distingue ese vacío del
       * vacío real mirando la fase, jamás el largo: "no tenés mascotas
       * elegibles" y "todavía no sé" son dos frases distintas y una de las dos
       * sería mentira»*. Las otras cuatro pantallas de servicio ya lo hacían
       * (`faseEspecies.fase === 'listo' && elegibles.length === 0`); esta era
       * la única que no.
       *
       * El motor nunca estuvo en riesgo: el guard `mascota_no_elegible` de la
       * DB devuelve `true` para estos perros. Lo que fallaba era la PUERTA.
       */
      if (faseEspecies.fase === 'cargando' || faseEspecies.fase === 'error') {
        setCatalogoNoLlego(faseEspecies.fase);
        return;
      }
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
    [elegibles, mascotaIdParam, alElegirMascota, faseEspecies.fase],
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('explorar.quienTitulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8], gap: spacing[3] }}>
        {/* la ventana elegida, en voz de máquina — con el PARA QUIÉN
            visible (S61-A3, rasgo 1): la MISMA voz del QUIÉN del
            grooming (grooming.ventanaPara — Ley 17.3, reuso declarado) */}
        {(() => {
          // S73 (letra de elegibilidad, N=1 "no se pregunta pero SE DICE"):
          // sin param y con UNA sola elegible, la auto-elegida del tap
          // (:alElegirMascota) se DICE acá — avatar y nombre visibles ANTES
          // de tocar nada. Auto-seleccionar en silencio era magia (cura b).
          const paraQuien =
            mascotas.find((m) => m.id === mascotaIdParam) ??
            (elegibles.length === 1 ? elegibles[0] : null);
          return (
            <Celda
              inicio={
                paraQuien !== null ? (
                  // xs, no sm: la columna del metadataMono es intocable y con
                  // sm el titulo colapsaba a cero en 420 (hallazgo M3 S73).
                  <AvatarMascota nombre={paraQuien.nombre} fotoUrl={caraDeMascotaPorRuta({ especie: paraQuien.especie, rutaImagen: paraQuien.raza_ruta_imagen, fotoUri: fotos[paraQuien.id] })} tamano="xs" />
                ) : undefined
              }
              titulo={
                paraQuien !== null
                  ? t('grooming.ventanaPara', { nombre: paraQuien.nombre })
                  : t('explorar.paseoTitulo')
              }
              // La ventana APILADA en la zona fin (S44-B4.1): en una sola
              // línea el mono de 26 caracteres exprimía el título a cero
              // con el avatar presente (hallazgo M3 S73).
              metadataMono={fecha}
              fin={<Texto variante="dato">{`${hora} · ${duracion} min`}</Texto>}
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
                <PreviewPrestador
                  prestadorId={p.prestador_id}
                  ofertaId={p.prestador_servicio_id}
                  nombre={p.prestador_nombre}
                  oficio={t('hogar.railPaseos')}
                  contexto={p.servicio_nombre}
                  precio={`$${p.precio.toFixed(2)} · ${p.duracion_minutos} min`}
                  perfil={perfiles[p.prestador_id]}
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
                inicio={<AvatarMascota nombre={m.nombre} fotoUrl={caraDeMascotaPorRuta({ especie: m.especie, rutaImagen: m.raza_ruta_imagen, fotoUri: fotos[m.id] })} tamano="sm" />}
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

      {/* P0: el catálogo de especies no llegó. Es OTRA cosa que no tener
          perros, y por eso tiene su propia voz — decirle «no tenés un perro
          registrado» a alguien que tiene dos es peor que no decir nada
          (Ley 13: el error se dice, y se dice lo que ES). */}
      <Hoja
        visible={catalogoNoLlego !== null}
        titulo={t(catalogoNoLlego === 'cargando' ? 'paquete.catalogoCargandoTitulo' : 'paquete.catalogoErrorTitulo')}
        onCerrar={() => setCatalogoNoLlego(null)}
        conCerrar
      >
        <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
          <Celda
            titulo={t(catalogoNoLlego === 'cargando' ? 'paquete.catalogoCargandoDetalle' : 'paquete.catalogoErrorDetalle')}
          />
        </View>
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
