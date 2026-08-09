/**
 * MIS PASEOS — el HUB del servicio (S56-A, D-338; MODELO_PASEO v1.2
 * §6.1): el DOBLE CLIC del paseo, JAMÁS una tab. Se entra por la
 * tarjeta del Hogar y por Explorar→Paseo. Tres segmentos:
 *   · Próximos — lo que viene + el ESTADO del plan (renovación,
 *     pausa de un toque — P14d).
 *   · Agenda — las salidas del período: Mover (P14a, ≥24 h dentro del
 *     período con el mismo paseador; el server es el juez).
 *   · Historial — lo caminado (sedimento; peldaño por datos).
 *
 * ESCALERA (§4b): peldaño 0 = sin planes, invitación que educa (el
 * chip del CUÁNDO); peldaño 1 = un plan con sus salidas tal cual;
 * peldaño 2 = historial rico por DATOS (paseos cerrados), no por
 * versión.
 *
 * S82-C r12 — ESTA PANTALLA ES **EL LOG** del oficio: la primera que
 * se ve al tocar el servicio en Explorar (ruteo verificado con
 * literal: explorar/index:91 navega ACÁ, no a /explorar/paseo). Es el
 * primer cambio del patrón que después se replica a los otros oficios.
 * SUS TRES EJES: ① la MASCOTA (el PRIMER filtro, con L-b adentro:
 * relleno pleno con 2-3 hermanos, barrido con 4+) · ② el ESTADO
 * (próximos · historial) · ③ la FECHA, **solo en historial** — en
 * próximos no parte los datos y un eje que no parte no se dibuja.
 * El historial es COLAPSABLE con una sola abierta (el diseño del
 * home), y AGENDAR vive en el PIE FIJO, en el slot del CTA sin pintar.
 * D-357 ENMENDADA: el SelectorSegmentado cede a FiltroPills porque acá
 * el eje convive con otros dos de su familia — la gramática de la
 * pantalla manda sobre la del control suelto.
 */

import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Celda,
  CeldaNavegacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FilaDato,
  Hoja,
  HojaScroll,
  Icono,
  Insignia,
  FilaCita,
  PieRevelar,
  SelectorOpcion,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  obtenerMascotasDeFamilia,
  resolverUrlsFotos,
  cancelarCitaSuelta,
  cancelarReservaPaquete,
  configurarRenovacionPlan,
  obtenerCitasDePlan,
  obtenerMisCitasPaseo,
  obtenerMisPaquetesSalidas,
  obtenerMisPlanesPaseo,
  obtenerSlotsDisponibles,
  reagendarCitaSuelta,
  resolverOfertaDeCita,
  saltarCitaPlan,
  type CitaDePlan,
  type CitaPaseoDueno,
  type PaqueteSalidas,
  type PlanPaseo,
  type EstadoVidaMascota,
} from '@epetplace/api';
import { fechaCortaMono, obtenerIdiomaActual } from '@epetplace/i18n';
import { useTraduccion } from '@/i18n';
import { ofrecibles, useEspeciesElegibles } from '@/lib/especies-elegibles';
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';
import { FiltroMascotas, FiltroPills } from '@/components/filtro-pills';
import { CantoCurva } from '@/components/canto-curva';
import { esHistorial, esProxima } from '@/lib/corte-agenda';
import { DetalleCita } from '@/components/detalle-cita';

// S60-A6 pieza 2 (D-366): el tap Agenda MURIÓ fusionado en Próximos —
// enmienda DECLARADA de D-366, no reapertura del servicio cerrado.
type Segmento = 'proximos' | 'historial';

function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

export default function MisPaseos() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const idioma = obtenerIdiomaActual();

  const [segmento, setSegmento] = useState<Segmento>('proximos');
  // r12 · LOS TRES EJES DEL LOG. El de FECHA solo existe en historial:
  // en próximos NO PARTE LOS DATOS (lo que viene es futuro por
  // definición) y un eje que no parte no se dibuja.
  const [filtroMascota, setFiltroMascota] = useState<string | null>(null);
  const [ventanaFecha, setVentanaFecha] = useState<'todos' | 'semana' | 'mes'>('todos');
  const [mascotasHogar, setMascotasHogar] = useState<{ id: string; nombre: string; fotoUrl?: string; especie: string; estado_vida: EstadoVidaMascota | null }[]>([]);
  const faseEspecies = useEspeciesElegibles('paseo');
  const [abierta, setAbierta] = useState<string | null>(null);
  // r12-11: el CTA deshabilitado SIGUE TOCABLE y, al tocarlo, señala la
  // hilera: nunca un botón muerto que no responde.
  const [pidiendoMascota, setPidiendoMascota] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [planes, setPlanes] = useState<PlanPaseo[] | 'cargando' | 'error'>('cargando');
  const [citas, setCitas] = useState<Record<string, CitaDePlan[]>>({});
  // D-343 + P18: los paquetes del dueño y sus paseos fuera del plan
  const [paquetes, setPaquetes] = useState<PaqueteSalidas[]>([]);
  const [citasLibres, setCitasLibres] = useState<CitaPaseoDueno[]>([]);
  const [pausando, setPausando] = useState(false);
  // Mover (P14a): la salida elegida + su plan
  const [moviendo, setMoviendo] = useState<{ cita: CitaDePlan; plan: PlanPaseo } | null>(null);
  const [fechaNueva, setFechaNueva] = useState<string | null>(null);
  const [horasNuevas, setHorasNuevas] = useState<string[] | 'cargando' | null>(null);
  const [guardandoMovida, setGuardandoMovida] = useState(false);
  // P18/P16b: el DETALLE de la cita (suelta o de paquete) con sus acciones
  const [detalle, setDetalle] = useState<CitaPaseoDueno | null>(null);
  // S60-A6: ventana de la lista fusionada (10 + "Cargar más" — patrón
  // del pie de LineaDeVida; jamás lista infinita sin paginar)
  const [ventana, setVentana] = useState(10);
  const [accionando, setAccionando] = useState(false);
  // Reagendar el suelto (P18 a/b): oferta resuelta + día + horas reales
  const [reagendando, setReagendando] = useState<{ cita: CitaPaseoDueno; ofertaId: string } | 'resolviendo' | null>(null);

  const cargar = useCallback(() => {
    setPlanes('cargando');
    // r12: las mascotas del hogar alimentan el PRIMER filtro
    void getEstadoOnboardingDueno().then(async (e) => {
      if (!e.ok || e.data.familia_id === null) return;
      const r = await obtenerMascotasDeFamilia(e.data.familia_id);
      if (!r.ok) return;
      const paths = r.data.map((m) => m.foto_url).filter((x): x is string => typeof x === 'string' && x.length > 0);
      const urls = paths.length > 0 ? await resolverUrlsFotos(paths) : new Map<string, string>();
      setMascotasHogar(
        r.data.map((m) => ({
          id: m.id,
          nombre: m.nombre,
          especie: m.especie,
          estado_vida: m.estado_vida,
          fotoUrl: caraDeMascotaPorRuta({
            especie: m.especie,
            rutaImagen: m.raza_ruta_imagen,
            fotoUri: m.foto_url ? urls.get(m.foto_url) : undefined,
          }),
        })),
      );
    });
    void (async () => {
      const [r, pq, cl] = await Promise.all([
        obtenerMisPlanesPaseo(),
        obtenerMisPaquetesSalidas(),
        obtenerMisCitasPaseo(),
      ]);
      if (pq.ok) setPaquetes(pq.data);
      if (cl.ok) setCitasLibres(cl.data);
      if (!r.ok) {
        setPlanes('error');
        return;
      }
      setPlanes(r.data);
      const porPlan: Record<string, CitaDePlan[]> = {};
      await Promise.all(
        r.data.map(async (p) => {
          const c = await obtenerCitasDePlan(p.id);
          if (c.ok) porPlan[p.id] = c.data;
        }),
      );
      setCitas(porPlan);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  async function alternarRenovacion(plan: PlanPaseo) {
    if (pausando) return;
    setPausando(true);
    const r = await configurarRenovacionPlan({ suscripcion_id: plan.id, auto_renovar: !plan.auto_renovar });
    setPausando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t(r.data.auto_renovar ? 'plan.reanudado' : 'plan.pausado'), variante: 'exito' });
    cargar();
  }

  async function elegirFechaMovida(fecha: string, plan: PlanPaseo) {
    setFechaNueva(fecha);
    setHorasNuevas('cargando');
    if (plan.prestador_servicio_id === null) {
      setHorasNuevas([]);
      return;
    }
    const r = await obtenerSlotsDisponibles({
      prestador_id: plan.prestador_id,
      prestador_servicio_id: plan.prestador_servicio_id,
      desde: fecha,
      hasta: fecha,
    });
    setHorasNuevas(r.ok ? r.data.map((s) => s.hora.slice(0, 5)) : []);
  }

  async function moverSalida(hora: string) {
    if (moviendo === null || fechaNueva === null || guardandoMovida) return;
    setGuardandoMovida(true);
    const r = await saltarCitaPlan({ cita_id: moviendo.cita.id, nueva_fecha: fechaNueva, nueva_hora: hora });
    setGuardandoMovida(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    setMoviendo(null);
    setFechaNueva(null);
    setHorasNuevas(null);
    mostrar({ texto: t('plan.movida'), variante: 'exito' });
    cargar();
  }

  // ── P18(a): cancelar el suelto — reembolso simulado DECLARADO ──
  async function cancelarSuelto(cita: CitaPaseoDueno) {
    if (accionando) return;
    setAccionando(true);
    const r = await cancelarCitaSuelta(cita.id);
    setAccionando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    setDetalle(null);
    mostrar({ texto: t('suelto.cancelado', { monto: r.data.reembolso_monto.toFixed(2) }), variante: 'exito' });
    cargar();
  }

  // ── P16(b): cancelar la reserva del paquete — vuelve al saldo ──
  async function cancelarDePaquete(cita: CitaPaseoDueno) {
    if (accionando) return;
    setAccionando(true);
    const r = await cancelarReservaPaquete(cita.id);
    setAccionando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    setDetalle(null);
    mostrar({ texto: t('paquete.cancelada', { n: r.data.saldo }), variante: 'exito' });
    cargar();
  }

  // ── P18(a)/(b): reagendar el suelto — la oferta se RESUELVE primero ──
  async function abrirReagenda(cita: CitaPaseoDueno) {
    if (cita.prestador_id === null || cita.tipo_servicio === null) return;
    setReagendando('resolviendo');
    setFechaNueva(null);
    setHorasNuevas(null);
    const r = await resolverOfertaDeCita({
      prestador_id: cita.prestador_id,
      tipo_servicio: cita.tipo_servicio,
      duracion_minutos: cita.duracion_minutos,
    });
    if (!r.ok || r.data === null) {
      setReagendando(null);
      // el paseador ya no oferta este bloque: la reagenda no se ofrece
      mostrar({ texto: t('suelto.sinOferta'), variante: 'error' });
      return;
    }
    setDetalle(null);
    setReagendando({ cita, ofertaId: r.data.prestador_servicio_id });
  }

  async function elegirFechaReagenda(fecha: string) {
    if (reagendando === null || reagendando === 'resolviendo') return;
    setFechaNueva(fecha);
    setHorasNuevas('cargando');
    const cita = reagendando.cita;
    if (cita.prestador_id === null) {
      setHorasNuevas([]);
      return;
    }
    const r = await obtenerSlotsDisponibles({
      prestador_id: cita.prestador_id,
      prestador_servicio_id: reagendando.ofertaId,
      desde: fecha,
      hasta: fecha,
    });
    setHorasNuevas(r.ok ? r.data.map((s) => s.hora.slice(0, 5)) : []);
  }

  async function confirmarReagenda(hora: string) {
    if (reagendando === null || reagendando === 'resolviendo' || fechaNueva === null || guardandoMovida) return;
    setGuardandoMovida(true);
    const r = await reagendarCitaSuelta({ cita_id: reagendando.cita.id, nueva_fecha: fechaNueva, nueva_hora: hora });
    setGuardandoMovida(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    setReagendando(null);
    setFechaNueva(null);
    setHorasNuevas(null);
    mostrar({ texto: t('suelto.reagendado'), variante: 'exito' });
    cargar();
  }

  /** Próximos 14 días desde mañana — la tira de la reagenda del suelto. */
  function fechasProximas(): string[] {
    const fechas: string[] = [];
    for (let i = 1; i <= 14; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      fechas.push(new Intl.DateTimeFormat('en-CA').format(d));
    }
    return fechas;
  }

  const hoy = hoyLocal();
  const listaPlanes = Array.isArray(planes) ? planes : [];
  // D-343: los paquetes con saldo vigente (el vencido/agotado va al historial implícito)
  const paquetesVigentes = paquetes.filter(
    (p) => p.estado === 'activo' && p.saldo > 0 && (p.fecha_vencimiento === null || p.fecha_vencimiento >= hoy),
  );
  // r12: el filtro de MASCOTA muerde toda la pantalla; el de FECHA
  // solo el historial (en próximos no parte los datos).
  const porMascota = (c: CitaPaseoDueno) => filtroMascota === null || c.mascota_id === filtroMascota;
  const cortePorVentana = (iso: string) => {
    if (ventanaFecha === 'todos') return true;
    const d = new Date();
    d.setDate(d.getDate() - (ventanaFecha === 'semana' ? 7 : 30));
    return iso >= new Intl.DateTimeFormat('en-CA').format(d);
  };
  // r39 · PASEO TAMBIÉN PASA POR LA FRONTERA. Su corte era el correcto
  // —es del que salió la regla— pero seguía escrito a mano: dejarlo así
  // era conservar el cuarto original del que ya divergieron tres copias.
  // `cerrada` para paseo = el motor la sacó de 'confirmada'.
  const cerradaP = (c: CitaPaseoDueno) => c.estado !== 'confirmada';
  const librasProximas = citasLibres.filter((c) => porMascota(c) && esProxima(c.fecha, cerradaP(c)));
  const librasPasadas = citasLibres.filter(
    (c) => porMascota(c) && esHistorial(c.fecha, cerradaP(c)) && cortePorVentana(c.fecha),
  );
  const hayAlgo = listaPlanes.length > 0 || paquetesVigentes.length > 0 || citasLibres.length > 0;

  // S60-A6 pieza 2 — LA LISTA FUSIONADA (enmienda declarada de D-366):
  // TODAS las citas futuras (suelta / paquete / plan) en UNA cronología
  // con el origen marcado; el tap abre SUS acciones (P18 el detalle del
  // suelto/paquete; P14 el Mover del plan — la acción exclusiva del tap
  // Agenda migró acá, no se perdió). Los PRODUCTOS (saldo del paquete,
  // tarjeta del plan) conservan su lugar arriba: no son citas.
  type CitaFusionada =
    | { clase: 'libre'; cita: CitaPaseoDueno }
    | { clase: 'plan'; cita: CitaDePlan; plan: PlanPaseo };
  const futurasFusionadas: CitaFusionada[] = [
    ...librasProximas.map((c) => ({ clase: 'libre' as const, cita: c })),
    ...listaPlanes.flatMap((p) =>
      (citas[p.id] ?? [])
        .filter((c) => c.estado === 'confirmada' && c.fecha >= hoy)
        .map((c) => ({ clase: 'plan' as const, cita: c, plan: p })),
    ),
  ].sort((a, b) => (`${a.cita.fecha}T${a.cita.hora}` < `${b.cita.fecha}T${b.cita.hora}` ? -1 : 1));

  // r14-1 · LA MITAD QUE FALTABA DE ESA MISMA FUSIÓN. El founder vio
  // DOS listas en el historial: la diseñada (canto + despliegue) y
  // debajo otra plana con hairlines. La plana era LEGADO — S60-A6 fusionó
  // las citas FUTURAS del plan con las sueltas y dejó las PASADAS donde
  // estaban; r12 rediseñó las pasadas SUELTAS y las del plan quedaron
  // otra vez atrás. Dos migraciones a medias, el mismo resto.
  // NO SE BORRA LA LISTA: se FUSIONA. Borrarla a secas se llevaba
  // puesto el historial entero del plan, que es DATO del dueño.
  // Y la fusión cura de paso un desvío real: el filtro de FECHA
  // mordía solo las sueltas — las del plan se pintaban siempre, así
  // que "semana" mostraba meses. Ahora el corte es de la lista, no de
  // media lista.
  // Orden DESCENDENTE: un historial se lee desde lo último que pasó
  // (los próximos suben, el pasado baja — ejes opuestos, a propósito).
  const pasadasFusionadas: CitaFusionada[] = [
    ...librasPasadas.map((c) => ({ clase: 'libre' as const, cita: c })),
    ...listaPlanes.flatMap((p) =>
      (citas[p.id] ?? [])
        .filter((c) => (c.estado !== 'confirmada' || c.fecha < hoy) && cortePorVentana(c.fecha))
        .map((c) => ({ clase: 'plan' as const, cita: c, plan: p })),
    ),
  ].sort((a, b) => (`${a.cita.fecha}T${a.cita.hora}` > `${b.cita.fecha}T${b.cita.hora}` ? -1 : 1));

  function vozEstado(p: PlanPaseo): { etiqueta: string; estado: 'alDia' | 'info' } {
    if (p.estado === 'activa' && p.auto_renovar) return { etiqueta: t('plan.estadoActiva'), estado: 'alDia' };
    if (p.estado === 'activa') return { etiqueta: t('plan.estadoPausada'), estado: 'info' };
    return { etiqueta: t('plan.estadoVencida'), estado: 'info' };
  }

  /** Fechas candidatas para Mover: los próximos 14 días DENTRO del período. */
  function fechasDelPeriodo(p: PlanPaseo): string[] {
    const fechas: string[] = [];
    const desde = new Date();
    desde.setDate(desde.getDate() + 1);
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(desde);
      d.setDate(desde.getDate() + i);
      const iso = new Intl.DateTimeFormat('en-CA').format(d);
      if (iso >= p.periodo_inicio && iso < p.periodo_fin) fechas.push(iso);
    }
    return fechas;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('plan.hubTitulo')} atras onAtras={() => router.back()} />

      {planes === 'cargando' ? (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={44} />
              <Esqueleto forma="bloque" ancho="100%" alto={96} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        </View>
      ) : planes === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('cuenta.errorCargar')}
            accion={<Boton variante="secundario" etiqueta={t('cuenta.reintentar')} onPress={cargar} />}
          />
        </View>
      /* ⚠️ r35 · LA PANTALLA VACÍA COMPLETA MURIÓ. Reemplazaba TODO
         —la hilera de mascotas, los dos ejes, el CTA— por un cartel con
         "Explorar", así que el log vacío no se parecía en nada al log
         lleno: el usuario nuevo aprendía una pantalla distinta de la que
         iba a usar. El patrón correcto es el de VETERINARIA, que el
         founder señaló: la hilera y los ejes SE QUEDAN, y lo que habla es
         un vacío DE SECCIÓN con su glifo y su voz. La composición vive;
         lo que cambia es qué dice la sección. */
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8], gap: spacing[4] }}
        >
          {/* r12 · LOS TRES EJES DEL LOG (el CTA de agendar se fue al
              PIE FIJO — abajo). ① la MASCOTA es el PRIMER filtro (con
              su regla L-b adentro: pleno con 2-3, barrido con 4+). */}
          {mascotasHogar.length > 1 ? (
            <View style={{ marginHorizontal: -spacing[4] }}>
              <FiltroMascotas
                mascotas={ofrecibles(mascotasHogar, faseEspecies)}
                elegida={filtroMascota}
                onElegir={(id) => {
                  setFiltroMascota(id);
                  if (id !== null) setPidiendoMascota(false);
                }}
              />
            </View>
          ) : null}

          {/* r12-11: el mensaje SEÑALA la hilera — vive pegado a ella,
              jamás flotando en el medio de la pantalla. El ojo sabe a
              dónde ir porque el texto está donde está la respuesta. */}
          {pidiendoMascota ? (
            <Texto variante="apoyo" color="danger">{t('plan.elegiMascota')}</Texto>
          ) : null}

          {/* ② el ESTADO — con glifos coherentes (D-357 enmendada: el
              SelectorSegmentado cede a FiltroPills porque acá el eje
              convive con otros dos de la misma familia; la gramática
              de la pantalla manda sobre la del control suelto). */}
          {/* ✅ r18 · FIRMADO: LA HUELLA MARCA EL ELEGIDO. El andamio de
              las dos candidatas murió con el gate (Ley 37 — precedente
              del SwitchGate de r9: era andamio y el gate ya pasó).
              Y el eje conserva su corrección de r17: próximos/historial
              es ESTADO, no categoría — `capa: null`, porque el color de
              capa es de una CLASE DE SERVICIO (Ley 10) y este eje no
              tiene ninguna. Solo el eje de servicio lleva su color. */}
          <View style={{ marginHorizontal: -spacing[4] }}>
            <FiltroPills
              activo={segmento}
              onCambio={(c) => setSegmento(c)}
              opciones={[
                { codigo: 'proximos' as Segmento, etiqueta: t('plan.segProximos'), icono: 'hoy', capa: null },
                { codigo: 'historial' as Segmento, etiqueta: t('plan.segHistorial'), icono: 'paseo', capa: null },
              ]}
            />
          </View>

          {/* ③ la FECHA — SOLO EN HISTORIAL. En próximos no parte los
              datos (lo que viene es futuro por definición) y un eje que
              no parte NO SE DIBUJA. */}
          {segmento === 'historial' ? (
            <View style={{ marginHorizontal: -spacing[4] }}>
              <FiltroPills
                activo={ventanaFecha}
                onCambio={(v) => setVentanaFecha(v)}
                opciones={[
                  { codigo: 'todos' as const, etiqueta: t('plan.filtroTodos'), icono: null, capa: null },
                  { codigo: 'semana' as const, etiqueta: t('perfil.ventanaSemana'), icono: null, capa: null },
                  { codigo: 'mes' as const, etiqueta: t('perfil.ventanaMes'), icono: null, capa: null },
                ]}
              />
            </View>
          ) : null}

          {segmento === 'proximos' ? (
            <View style={{ gap: spacing[4] }}>
              {/* cero finales mudos (§6ter): Próximos vacío OFRECE el
                  camino — la CTA de agendar ya preside la pantalla */}
              {paquetesVigentes.length === 0 && librasProximas.length === 0 && listaPlanes.length === 0 ? (
                <EstadoVacio
                  registro="seccion"
                  icono={<Icono nombre="paseo" tamano={48} />}
                  titulo={t('plan.sinPlanesTitulo')}
                  descripcion={t('plan.sinPlanesDetalle')}
                />
              ) : null}
              {/* D-343: el SALDO del paquete, donde el dueño lo busca. La
                  vigencia en voz llana — sin countdown (P16e). */}
              {paquetesVigentes.map((pq) => (
                <Tarjeta key={pq.id} relleno="ninguno" elevacion="reposo">
                  <Celda
                    titulo={t('paquete.tarjetaTitulo', { min: pq.duracion_minutos ?? 30 })}
                    subtitulo={
                      pq.fecha_vencimiento !== null
                        ? t('paquete.venceEl', { fecha: fechaCortaMono(pq.fecha_vencimiento, idioma) })
                        : undefined
                    }
                  />
                  {/* Hub v2 (S58): la compra es CeldaNavegacion (Ley 19.1)
                      con SUBTÍTULO VIVO del saldo real del bono — la
                      Insignia de saldo murió (decía lo mismo dos veces,
                      Chanel). Ícono despensa = capa consumo (ocre). */}
                  {pq.prestador_servicio_id !== null ? (
                    <>
                      <Separador />
                      <CeldaNavegacion
                        icono="despensa"
                        titulo={t('paquete.comprarMas')}
                        detalle={pq.saldo === 1 ? t('paquete.teQuedaUna') : t('paquete.teQuedan', { n: pq.saldo })}
                        onPress={() =>
                          router.navigate({
                            pathname: '/explorar/paseo/paquete',
                            params: { servicio: pq.prestador_servicio_id },
                          })
                        }
                      />
                    </>
                  ) : null}
                </Tarjeta>
              ))}
              {listaPlanes.map((p) => {
                const estado = vozEstado(p);
                return (
                  <Tarjeta key={p.id} relleno="ninguno">
                    {/* S60-A6: las próximas del plan MIGRARON a la lista
                        fusionada de abajo — la tarjeta queda PRODUCTO
                        puro (estado, renovación, pausa; D-343 intacto). */}
                    <Celda
                      titulo={`${t('explorar.paseoTitulo')} · ${p.duracion_minutos} min`}
                      subtitulo={t(p.auto_renovar && p.estado === 'activa' ? 'plan.renuevaEl' : 'plan.terminaEl', {
                        fecha: fechaCortaMono(p.periodo_fin, idioma),
                      })}
                      fin={<Insignia estado={estado.estado} etiqueta={estado.etiqueta} />}
                    />
                    {p.estado === 'activa' ? (
                      <>
                        <Separador />
                        <View style={{ padding: spacing[3] }}>
                          <Boton
                            variante="compacto"
                            tamaño="sm"
                            etiqueta={t(p.auto_renovar ? 'plan.pausar' : 'plan.reanudar')}
                            cargando={pausando}
                            onPress={() => void alternarRenovacion(p)}
                          />
                        </View>
                      </>
                    ) : null}
                  </Tarjeta>
                );
              })}

              {/* S60-A6 — LA LISTA FUSIONADA: toda cita futura, UNA
                  cronología con el origen marcado; el tap abre SUS
                  acciones (detalle P18 / Mover P14). Ventana de 10 con
                  "Cargar más" — jamás lista infinita sin paginar. */}
              {futurasFusionadas.length > 0 ? (
                <View style={{ gap: spacing[2.5] }}>
                  {/* ✅ r39-5 · LA PIEZA DE LA CASA, CONSUMIDA. `FilaCita`
                      es el componente de DOMINIO de S80-B12: lleva el
                      canto ADENTRO y cero prop de color — la pantalla NO
                      elige el tinte, lo elige el oficio. Por eso se
                      consume y no se reinventa: reinventarla habría sido
                      la quinta copia de un canto que ya tiene dueño.
                      La mascota PRESIDE (es el titulo) y el servicio baja
                      a subtitulo — la lámina del founder, tal cual:
                      "mañana 08:00 · Adiestramiento de Zeus". */}
                  {futurasFusionadas.slice(0, ventana).map((f) => {
                    // 🔴 r40-bis · LA MASCOTA NO PRESIDÍA EN LAS CITAS DE
                    // PLAN, y lo vi EN PANTALLA, no leyendo: el título
                    // decía "Walk" a secas. La causa está medida y es de
                    // contrato — `CitaDePlan` NO TRAE `mascota_id` (a
                    // diferencia de `CitaPaseoDueno`), así que para esas
                    // filas yo pasaba null y caía al fallback genérico.
                    // No hacía falta pedir nada: **el PLAN sí lo trae**
                    // (`PlanPaseo.mascota_id`), y la fila fusionada ya
                    // lleva su plan al lado. Se resuelve por ahí.
                    const idMascota = f.clase === 'libre' ? f.cita.mascota_id : f.plan.mascota_id;
                    const nombre = mascotasHogar.find((m) => m.id === idMascota)?.nombre ?? null;
                    return (
                      <FilaCita
                        key={f.cita.id}
                        oficio="paseo"
                        // ✅ r40-2b · LA VARIANTE DE B, CONSUMIDA. `cara={false}`
                        // porque el log YA FILTRA por mascota arriba y la
                        // fila la nombra en el título: la cara repetida en
                        // cada fila no informa —es la misma en todas— y la
                        // regla Chanel se la lleva. `direccion="abajo"`
                        // porque esta fila DESPLIEGA (abre la Hoja de sus
                        // acciones), no navega. Sin default a propósito:
                        // que cada consumidor lo DECLARE es justo la cura
                        // del defecto que el founder describió — "unas
                        // tienen flecha y otras no, y el usuario no sabe
                        // qué se puede tocar".
                        cara={false}
                        // ✅ FIRMADO r41 · INFORMACIÓN DESPLIEGA (⌄) · ACCIÓN
                        // CON FORMULARIO ABRE HOJA Y LLEVA (›). Yo había
                        // puesto "abajo" y B leyó bien: la Hoja NO hace
                        // crecer la fila —viene del borde y tapa el
                        // contexto—, así que ⌄ prometía algo que no pasa.
                        // Estas filas abren Hoja CON acciones (Mover del
                        // plan · reagendar/cancelar del suelto), o sea que
                        // llevan. La flecha ahora dice la verdad.
                        direccion="derecha"
                        // r40-2 · EL REPARTO DEL DATO. La "segunda columna
                        // que no se lee" es el slot `metadataMono` de
                        // Celda: una columna alineada a la DERECHA, hecha
                        // para dato de máquina CORTO — y yo le metí fecha
                        // + hora + duración (r39-5). Tres datos en una
                        // columna angosta compiten con el título por el
                        // ancho y ninguno gana.
                        // Ahora cada uno en su lugar: el CUÁNDO corto en
                        // la columna (que es lo que la lámina del founder
                        // muestra — "mañana 08:00") y la duración baja al
                        // subtítulo, con el origen, donde hay ancho.
                        titulo={
                          nombre !== null
                            ? t('plan.filaTitulo', { nombre })
                            : t('explorar.paseoTitulo')
                        }
                        subtitulo={`${t(
                          f.clase === 'plan'
                            ? 'plan.citaDePlan'
                            : f.cita.origen === 'paquete'
                              ? 'paquete.citaDePaquete'
                              : 'suelto.citaSuelta',
                        )} · ${f.cita.duracion_minutos} min`}
                        metadataMono={`${fechaCortaMono(f.cita.fecha, idioma)} · ${f.cita.hora.slice(0, 5)}`}
                        mascota={{
                          nombre: nombre ?? t('explorar.paseoTitulo'),
                          fotoUrl: mascotasHogar.find((m) => m.id === idMascota)?.fotoUrl,
                        }}
                        onPress={() => {
                          if (f.clase === 'plan') {
                            setMoviendo({ cita: f.cita, plan: f.plan });
                            setFechaNueva(null);
                            setHorasNuevas(null);
                          } else {
                            setDetalle(f.cita);
                          }
                        }}
                      />
                    );
                  })}
                  {/* S73: ley 19.6 — esto NO es paginación (slice sobre
                      datos YA cargados): es revelar por tandas, y su
                      control canónico es PieRevelar con el número. */}
                  {futurasFusionadas.length > ventana ? (
                    <>
                      <Separador />
                      <View style={{ padding: spacing[3] }}>
                        <PieRevelar
                          n={futurasFusionadas.length - ventana}
                          onPress={() => setVentana((v) => v + 10)}
                        />
                      </View>
                    </>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : (
            /* r14-1 · UNA SOLA LISTA. Todo lo caminado —suelto,
               paquete y plan— en la MISMA cronología y con la MISMA
               pieza. La lista plana de hairlines murió acá (Ley 37);
               lo que mostraba no se perdió: viaja fusionado. */
            <View style={{ gap: spacing[2.5] }}>
              {pasadasFusionadas.length === 0 ? (
                <EstadoVacio
                  registro="seccion"
                  icono={<Icono nombre="paseo" tamano={48} />}
                  titulo={t('plan.vacioSegmento')}
                  descripcion={t('plan.sinPlanesDetalle')}
                />
              ) : (
                pasadasFusionadas.map((f) => {
                  // r12-3: MISMO diseño que el home — canto que pinta
                  // la curva + despliegue en su lugar, UNA SOLA
                  // ABIERTA a la vez (dos abiertas y el resumen deja
                  // de presidir).
                  const c = f.cita;
                  const abierto = abierta === c.id;
                  return (
                    <CantoCurva key={c.id} color={theme.capa.cuidado}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ expanded: abierto }}
                        onPress={() => setAbierta(abierto ? null : c.id)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], minHeight: 58 }}>
                          <View style={{ flex: 1, minWidth: 0, gap: spacing[0.5] }}>
                            <Texto variante="cuerpo" numberOfLines={1}>
                              {t(
                                f.clase === 'plan'
                                  ? 'plan.citaDePlan'
                                  : f.cita.origen === 'paquete'
                                    ? 'paquete.citaDePaquete'
                                    : 'suelto.citaSuelta',
                              )}
                            </Texto>
                            <Texto variante="dato" numberOfLines={1}>
                              {`${fechaCortaMono(c.fecha, idioma)} · ${c.hora.slice(0, 5)} · ${c.duracion_minutos} min`}
                            </Texto>
                          </View>
                          <Insignia
                            estado={c.estado === 'completada' ? 'alDia' : 'info'}
                            etiqueta={t(
                              c.estado === 'completada'
                                ? 'plan.salidaCompletada'
                                : c.estado === 'no_show'
                                  ? 'suelto.salidaPerdida'
                                  : 'plan.salidaCancelada',
                            )}
                            tamaño="sm"
                          />
                        </View>
                      </Pressable>
                      {abierto ? (
                        <DetalleCita
                          // 🔴 `prestador` en NULL y NO es olvido:
                          // `CitaPaseoDueno` es el ÚNICO de los cuatro
                          // tipos SIN `prestador_nombre` (medido) — trae
                          // `prestador_id`, que es un uuid, no una voz.
                          // La pieza no dibuja esa fila. Pedido a A
                          // declarado; traducir el uuid desde la pantalla
                          // sería pagar un viaje POR FILA para lo que se
                          // arregla con un campo en el lector.
                          prestador={null}
                          costo={c.precio}
                          etiquetaPrestador={t('grooming.dondeEtiqueta')}
                          etiquetaCosto={t('presupuesto.total')}
                        />
                      ) : null}
                    </CantoCurva>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* r12-4 · AGENDAR — PIE FIJO, como el "ver quién puede" de la
          pantalla siguiente. EN EL SLOT y SIN PINTAR: el ocre entra por
          token cuando el founder elija su candidato en /gallery.
          Lleva la mascota FILTRADA si hay una (así la reserva no
          vuelve a preguntar — r12-5). */}
      {/* 🔴 r35 · EL CTA YA NO DEPENDE DE QUE HAYA DATOS. Estaba
          condicionado a `hayAlgo`, así que EL LOG VACÍO SE QUEDABA SIN
          BOTÓN DE RESERVAR — desaparecía exactamente cuando es la única
          acción posible. Lo destapó la familia de CUATRO: con dos
          mascotas que ya tenían historia, el caso no existía. Es la
          misma clase que el resto del salvavidas (r34): lo que no se
          camina, no se ve. */}
      {planes !== 'cargando' && planes !== 'error' ? (
        <View
          style={{
            paddingHorizontal: spacing[4],
            paddingTop: spacing[3],
            paddingBottom: Math.max(insets.bottom, spacing[4]),
            backgroundColor: theme.bg.base,
            borderTopWidth: 1,
            borderTopColor: theme.border.subtle,
          }}
        >
          {(() => {
            // r12-11 · EL CTA VIVO (patrón del alta: deshabilitado
            // "Continuar" / con dato "Presentar a {nombre}"): el botón
            // DICE QUÉ FALTA antes de que lo toquen.
            // r12-11b · MI WRAPPER LOCAL MURIÓ: B construyó el patrón en
            // la primitiva (`razonDeshabilitado` + `onRazon`, S82-B) y
            // el clon local se absorbe en su componente — regla 37, y el
            // orden correcto: el toque-en-apagado es de TODOS los
            // botones de la casa, no de esta pantalla.
            // 🔴 r16 · EL CTA MUERTO DEL HOGAR DE UNA SOLA MASCOTA —
            // hallado corriendo el gate en el emulador, NO leyendo.
            // La hilera de chips se monta solo con 2+ (arriba, y está
            // bien: un filtro de uno no filtra nada). Pero r12-11 ató
            // Agendar a que HAYA una elegida en esa hilera — así que en
            // una familia de UNA mascota el chooser no existe,
            // `filtroMascota` se queda en null PARA SIEMPRE, y el botón
            // que abre la reserva no se habilita jamás. El usuario más
            // común del producto —una mascota— no podía agendar desde
            // el log. No lo vi antes porque la familia de prueba del
            // founder tiene dos.
            // Con UNA no hay nada que elegir: la puerta no pregunta lo
            // que ya sabe (Ley 23), y es la MISMA regla que la pantalla
            // de reserva aplica del otro lado. Con 2+ nada cambia: sigue
            // exigiendo elección explícita, que es el punto de r12-11.
            const elegida =
              mascotasHogar.find((m) => m.id === filtroMascota) ??
              (mascotasHogar.length === 1 ? mascotasHogar[0] : null);
            return (
              <Boton
                variante="primario"
                bloque
                // ⚠️ r30 · EL APAGADO DICE QUÉ FALTA EN LA ETIQUETA, no
                // solo en el hint. `razonDeshabilitado` (B, S82) hace que
                // el toque nunca quede muerto y anuncia la razón al
                // ENFOCAR — pero NO reemplaza la forma VISIBLE: el
                // precedente S63-B manda que el apagado diga qué falta
                // SIEMPRE, y la 2ª enmienda de SliderPrecio (S68) fijó
                // que la affordance es VISIBLE, no solo accesible. Una
                // razón que solo aparece al tocar está escondida. Las dos
                // capas conviven: la etiqueta lo dice a la vista, el hint
                // se lo dice al lector de pantalla.
                etiqueta={
                  elegida !== null
                    ? t('plan.agendarDe', { nombre: elegida.nombre })
                    : t('plan.agendarFaltaMascota')
                }
                deshabilitado={elegida === null}
                razonDeshabilitado={t('plan.elegiMascota')}
                onRazon={() => {
                  // la PANTALLA decide cómo se cuenta (el componente no
                  // elige): acá se señala la hilera y se sube hasta ella
                  setPidiendoMascota(true);
                  scrollRef.current?.scrollTo({ y: 0, animated: true });
                }}
                onPress={() => {
                  if (elegida === null) return;
                  router.navigate({ pathname: '/explorar/paseo', params: { mascotaId: elegida.id } });
                }}
              />
            );
          })()}
        </View>
      ) : null}

      {/* Mover una salida (P14a — el server valida ≥24 h, período y cupo) */}
      <Hoja
        visible={moviendo !== null}
        titulo={t('plan.moverTitulo')}
        onCerrar={() => {
          setMoviendo(null);
          setFechaNueva(null);
          setHorasNuevas(null);
        }}
        conCerrar
      >
        <HojaScroll>
          {moviendo !== null ? (
            <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
              <Texto variante="apoyo">{t('plan.moverVoz')}</Texto>
              <SelectorOpcion
                acento="control"
                disposicion="tira"
                etiqueta={t('plan.moverDia')}
                opciones={fechasDelPeriodo(moviendo.plan).map((f) => ({ codigo: f, etiqueta: fechaCortaMono(f, idioma) }))}
                seleccionada={fechaNueva ?? undefined}
                onSelect={(f) => void elegirFechaMovida(f, moviendo.plan)}
              />
              {horasNuevas === 'cargando' ? (
                <EsqueletoGrupo>
                  <Esqueleto forma="bloque" ancho="100%" alto={44} />
                </EsqueletoGrupo>
              ) : horasNuevas !== null && horasNuevas.length === 0 ? (
                <Texto variante="apoyo">{t('plan.moverSinHoras')}</Texto>
              ) : horasNuevas !== null ? (
                <SelectorOpcion
                  acento="control"
                  disposicion="grilla"
                  etiqueta={t('plan.moverHora')}
                  opciones={horasNuevas.map((h) => ({ codigo: h, etiqueta: h }))}
                  seleccionada={undefined}
                  onSelect={(h) => void moverSalida(h)}
                />
              ) : null}
            </View>
          ) : null}
        </HojaScroll>
      </Hoja>

      {/* P18/P16: el DETALLE de la cita — las acciones viven acá, con
          las ventanas dichas en voz honesta. La pantalla de elección de
          destino del reembolso NO existe en v1 (decisión founder S57). */}
      <Hoja
        visible={detalle !== null}
        titulo={t('suelto.detalleTitulo')}
        onCerrar={() => setDetalle(null)}
        conCerrar
      >
        {detalle !== null ? (
          <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            <Celda
              titulo={fechaCortaMono(detalle.fecha, idioma)}
              subtitulo={t(detalle.origen === 'paquete' ? 'paquete.citaDePaquete' : 'suelto.citaSuelta')}
              metadataMono={`${detalle.hora.slice(0, 5)} · ${detalle.duracion_minutos} min${detalle.precio !== null ? ` · $${detalle.precio.toFixed(2)}` : ''}`}
            />
            <Texto variante="apoyo">{t(detalle.origen === 'paquete' ? 'paquete.ventanasVoz' : 'suelto.ventanasVoz')}</Texto>
            {detalle.origen === 'suelta' ? (
              <>
                <Boton
                  variante="primario"
                  bloque
                  etiqueta={t('suelto.reagendar')}
                  deshabilitado={accionando || reagendando === 'resolviendo'}
                  onPress={() => void abrirReagenda(detalle)}
                />
                <Boton
                  variante="destructivo"
                  bloque
                  etiqueta={t('suelto.cancelar')}
                  cargando={accionando}
                  onPress={() => void cancelarSuelto(detalle)}
                />
              </>
            ) : (
              <Boton
                variante="destructivo"
                bloque
                etiqueta={t('paquete.cancelarReserva')}
                cargando={accionando}
                onPress={() => void cancelarDePaquete(detalle)}
              />
            )}
          </View>
        ) : null}
      </Hoja>

      {/* P18(a)/(b): reagendar el suelto — franja REAL del MISMO paseador */}
      <Hoja
        visible={reagendando !== null && reagendando !== 'resolviendo'}
        titulo={t('suelto.reagendarTitulo')}
        onCerrar={() => {
          setReagendando(null);
          setFechaNueva(null);
          setHorasNuevas(null);
        }}
        conCerrar
      >
        <HojaScroll>
          {reagendando !== null && reagendando !== 'resolviendo' ? (
            <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
              <Texto variante="apoyo">{t('suelto.reagendarVoz')}</Texto>
              <SelectorOpcion
                acento="control"
                disposicion="tira"
                etiqueta={t('plan.moverDia')}
                opciones={fechasProximas().map((f) => ({ codigo: f, etiqueta: fechaCortaMono(f, idioma) }))}
                seleccionada={fechaNueva ?? undefined}
                onSelect={(f) => void elegirFechaReagenda(f)}
              />
              {horasNuevas === 'cargando' ? (
                <EsqueletoGrupo>
                  <Esqueleto forma="bloque" ancho="100%" alto={44} />
                </EsqueletoGrupo>
              ) : horasNuevas !== null && horasNuevas.length === 0 ? (
                <Texto variante="apoyo">{t('plan.moverSinHoras')}</Texto>
              ) : horasNuevas !== null ? (
                <SelectorOpcion
                  acento="control"
                  disposicion="grilla"
                  etiqueta={t('plan.moverHora')}
                  opciones={horasNuevas.map((h) => ({ codigo: h, etiqueta: h }))}
                  seleccionada={undefined}
                  onSelect={(h) => void confirmarReagenda(h)}
                />
              ) : null}
            </View>
          ) : null}
        </HojaScroll>
      </Hoja>
    </View>
  );
}
