/**
 * EL ARTE DEL GROOMING — WIZARD DE SECCIONES (S59-B5, FASE 2).
 * Mapa S59-B5 FASE 1 APROBADO por el arquitecto con enmiendas (1)–(6):
 * DOS pasos (el Dónde bajó a fila informativa de la portada) + las
 * mismas pantallas como secciones sueltas desde los lápices.
 *
 * TESIS: "Eliges qué ofreces y a quién; el precio de cada combinación
 * se pone en segundos, sin teclado." FIRMA: el espejo del artesano
 * responde EN VIVO al borrador (la firma del estándar §15b).
 *
 * Paso 1 — SERVICIOS Y PRECIOS: especies globales de la oferta (chips
 *   multi sobre el techo perro/gato, enmienda 3) · Baño y Baño+corte
 *   por Interruptor (el booleano ES el interruptor, patrón v3.2) · EL
 *   CHIP DE TALLA GOBIERNA el bloque (S/M/L, borradores conservados) ·
 *   SliderPrecio $5–$60 paso $0.25 SIN sugeridos (arranca en el piso,
 *   jamás campo vacío; rieles recalibrados en gate S59-B6) + neto 7.15
 *   vivo · DURACIÓN por
 *   combinación (30–240 en pasos de 15', CHECK de DB) por Celda-selector
 *   con Hoja — StepperCantidad no porta paso (±1, pedido a la A) · UN
 *   extra por pelaje largo GLOBAL (enmienda 2): Interruptor + slider
 *   $0.25–$15 (el $0 del riel ES el interruptor apagado).
 * Paso 2 — DÍAS Y HORARIOS: la sección COMPARTIDA con el paseo
 *   (seccion-horarios): las franjas GENERALES del prestador — el motor
 *   las lee para TODO servicio (una agenda, dos lápices).
 *
 * GUARDADO por sección, mecánica del paseo: borrador + guardado único
 * en secuencia por la puerta única. El invariante "3 tallas si activa"
 * (constraint triggers diferidos) se respeta POR ORDEN dentro de
 * guardarServicioGrooming: la fila nace INACTIVA → tallas → activo.
 * RPC atómica = D-369 (misma deuda).
 *
 * Letra: MODELO_GROOMING v1.0 §2/§5/§6 · estructura S59-A3 (reporte
 * literal de la A) · FINANCIERO 7.13/7.15. Dosis baja, acento oficio.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  HojaScroll,
  Interruptor,
  SelectorOpcion,
  Separador,
  SliderPrecio,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  SERVICIOS_GROOMING,
  TALLAS_GROOMING,
  actualizarExtraPelajeLargo,
  guardarServicioGrooming,
  obtenerComisionVigenteCita,
  obtenerFranjasHorario,
  obtenerMiCuentaComercial,
  obtenerMiPrestador,
  obtenerOfertasGroomingPropias,
  type OfertaGroomingPropia,
  type ServicioGrooming,
  type TallaGrooming,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { EspejoGrooming, type ServicioEspejoGrooming } from '@/components/espejo-grooming';
import {
  ORDEN_DISPLAY,
  SeccionHorarios,
  aplicarDiffFranjas,
  draftDesdeFranja,
  franjaDirty,
  type DraftFranja,
} from '@/components/seccion-horarios';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | {
      estado: 'listo';
      prestadorId: string;
      cuentaActiva: boolean | null;
      comisionPct: number | null;
    };

type Seccion = 'servicios' | 'horarios';
const PASOS: readonly Seccion[] = ['servicios', 'horarios'];

// el techo de plataforma (tipos_servicio.especies_elegibles, S59-A3) —
// el recorte del groomer vive en especies_compatibles de su oferta
const ESPECIES_TECHO = ['perro', 'gato'] as const;

interface DraftTalla {
  precio: string; // '' = jamás tocado → el piso del riel
  duracion: number;
}

interface DraftServicio {
  base: OfertaGroomingPropia | null;
  ofrecido: boolean;
  tallas: Record<TallaGrooming, DraftTalla>;
}

// rieles de UI: nacieron $5-$120/$0-$30 (enmienda 4) y el GATE EN
// DISPOSITIVO los recalibró (S59-B6, L-146 cumplida: el pulgar mandó)
const PASO_PRECIO = 0.25;
const PISO_SERVICIO = 5;
const TECHO_SERVICIO = 60;
const PISO_EXTRA = 0.25; // el $0 del riel ES el interruptor apagado
const TECHO_EXTRA = 15;

// duración por combinación: letra dura de DB (30–240, pasos de 15')
const DURACIONES: number[] = [];
for (let d = 30; d <= 240; d += 15) DURACIONES.push(d);
const DURACION_DEFAULT: Record<ServicioGrooming, number> = {
  grooming: 60, // Baño (enmienda 4)
  grooming_completo: 90, // Baño y corte
};

function rielPrecios(piso: number, techo: number): number[] {
  const pasos: number[] = [];
  for (let v = piso; v <= techo + 1e-9; v += PASO_PRECIO) {
    pasos.push(Math.round(v * 100) / 100);
  }
  return pasos;
}

function monto(valor: number): string {
  return `$${valor.toFixed(2)}`;
}

function leerPrecio(texto: string): number | null {
  const v = Number.parseFloat(texto.replace(',', '.'));
  if (!Number.isFinite(v) || v <= 0) return null;
  return Math.round(v * 100) / 100;
}

function draftServicioDesdeBase(base: OfertaGroomingPropia | null, servicio: ServicioGrooming): DraftServicio {
  const tallas = {} as Record<TallaGrooming, DraftTalla>;
  for (const talla of TALLAS_GROOMING) {
    const t = base?.tallas[talla];
    tallas[talla] = t
      ? { precio: t.precio.toFixed(2), duracion: t.duracionMinutos }
      : { precio: '', duracion: DURACION_DEFAULT[servicio] };
  }
  return { base, ofrecido: base?.activo ?? false, tallas };
}

function TituloBloque({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: typography.family.sans.medium,
        fontSize: typography.size.md,
        color: theme.text.primary,
      }}
    >
      {texto}
    </Text>
  );
}

function VozSecundaria({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return (
    <Text
      style={{
        fontFamily: typography.family.sans.regular,
        fontSize: typography.size.sm,
        lineHeight: typography.size.sm * typography.leading.normal,
        color: theme.text.secondary,
      }}
    >
      {texto}
    </Text>
  );
}

// comisión visible donde se pone el precio (7.15: el % es DATO leído)
function VozComision({ pct, precio }: { pct: number | null; precio: number | null }) {
  const { t } = useTraduccion();
  const texto =
    pct === null
      ? t('servicios.comisionNoDisponible')
      : precio === null
        ? t('servicios.comisionRetiene', { pct })
        : t('servicios.comisionNeto', { pct, neto: monto(precio * (1 - pct / 100)) });
  return <VozSecundaria texto={texto} />;
}

export default function TallerGrooming() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const { seccion, modo } = useLocalSearchParams<{ seccion?: string; modo?: string }>();

  const modoWizard = modo === 'wizard';
  const seccionParam: Seccion = seccion === 'horarios' ? 'horarios' : 'servicios';

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);
  const [paso, setPaso] = useState(0);
  const [seccionForzada, setSeccionForzada] = useState<Seccion | null>(null);
  const seccionVisible: Seccion = modoWizard ? PASOS[paso] : (seccionForzada ?? seccionParam);

  // EL BORRADOR — sobrevive a reintentos (guardado único)
  const [drafts, setDrafts] = useState<Record<ServicioGrooming, DraftServicio> | null>(null);
  const [especies, setEspecies] = useState<string[] | null>(null);
  const [especiesBase, setEspeciesBase] = useState<string[]>([]);
  const [extraActivo, setExtraActivo] = useState(false);
  const [extraMonto, setExtraMonto] = useState('');
  const [extraBase, setExtraBase] = useState<number | null>(null);
  const [franjas, setFranjas] = useState<DraftFranja[] | null>(null);

  // el chip de TALLA gobierna el bloque de cada servicio (patrón v3.1)
  const [tallaSel, setTallaSel] = useState<Record<ServicioGrooming, TallaGrooming>>({
    grooming: 'M',
    grooming_completo: 'M',
  });
  const [hojaDuracion, setHojaDuracion] = useState<{ servicio: ServicioGrooming; talla: TallaGrooming } | null>(null);

  const [guardando, setGuardando] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // carga ÚNICA (editor de borrador — el refetch-en-focus clobbearía)
  useEffect(() => {
    let vigente = true;
    void (async () => {
      const prestador = await obtenerMiPrestador();
      if (!vigente) return;
      if (!prestador.ok) {
        setPantalla({ estado: 'error' });
        return;
      }
      const [rOfertas, rFranjas, rCuenta, rComision] = await Promise.all([
        obtenerOfertasGroomingPropias(prestador.data.id),
        obtenerFranjasHorario(prestador.data.id),
        obtenerMiCuentaComercial(),
        obtenerComisionVigenteCita(),
      ]);
      if (!vigente) return;
      if (!rOfertas.ok || !rFranjas.ok) {
        setPantalla({ estado: 'error' });
        return;
      }
      const iniciales = {} as Record<ServicioGrooming, DraftServicio>;
      for (const s of SERVICIOS_GROOMING) {
        iniciales[s] = draftServicioDesdeBase(rOfertas.data.find((o) => o.tipoServicio === s) ?? null, s);
      }
      setDrafts(iniciales);
      // especies GLOBALES de la oferta (enmienda 3): la unión de lo
      // guardado; sin nada guardado, el techo entero (invitación)
      const declaradas = [...new Set(rOfertas.data.flatMap((o) => o.especies))].filter((e) =>
        (ESPECIES_TECHO as readonly string[]).includes(e),
      );
      const inicialesEspecies = declaradas.length > 0 ? declaradas : [...ESPECIES_TECHO];
      setEspecies(inicialesEspecies);
      setEspeciesBase(declaradas);
      const extra = prestador.data.grooming_extra_pelaje_largo;
      setExtraBase(extra);
      setExtraActivo(extra !== null);
      setExtraMonto(extra !== null ? extra.toFixed(2) : '');
      setFranjas(rFranjas.data.map(draftDesdeFranja));
      setPantalla({
        estado: 'listo',
        prestadorId: prestador.data.id,
        cuentaActiva: rCuenta.ok ? rCuenta.data?.estado === 'activa' : null,
        comisionPct: rComision.ok ? rComision.data.porcentaje : null,
      });
    })();
    return () => {
      vigente = false;
    };
  }, [intento]);

  const listo = pantalla.estado === 'listo' && drafts !== null && especies !== null && franjas !== null;
  const pct = pantalla.estado === 'listo' ? pantalla.comisionPct : null;

  const vozServicio = (s: ServicioGrooming): string =>
    s === 'grooming' ? t('tallerGrooming.servicioBano') : t('tallerGrooming.servicioBanoCorte');
  const vozTalla = (talla: TallaGrooming): string => t(`tallerGrooming.talla${talla}` as const);
  const tallaCorta = (talla: TallaGrooming): string => t(`tallerGrooming.tallaCorta${talla}` as const);
  const vozDia = (dia: number): string => t(`horarios.dia${dia as 0 | 1 | 2 | 3 | 4 | 5 | 6}` as const);

  // los rieles (enmienda 4)
  const pasosServicio = useMemo(() => rielPrecios(PISO_SERVICIO, TECHO_SERVICIO), []);
  const etiquetasServicio = useMemo(() => pasosServicio.map(monto), [pasosServicio]);
  const pasosExtra = useMemo(() => rielPrecios(PISO_EXTRA, TECHO_EXTRA), []);
  const etiquetasExtra = useMemo(() => pasosExtra.map(monto), [pasosExtra]);
  const indiceEn = (pasos: number[], texto: string): number => {
    const v = leerPrecio(texto);
    if (v === null) return 0; // SIN sugeridos: el piso del riel, visible
    const i = pasos.findIndex((p) => Math.abs(p - v) < 1e-9);
    if (i >= 0) return i;
    return Math.min(Math.max(Math.round((v - pasos[0]) / PASO_PRECIO), 0), pasos.length - 1);
  };

  const precioDe = (d: DraftTalla): number => leerPrecio(d.precio) ?? PISO_SERVICIO;

  const actualizarTalla = (s: ServicioGrooming, talla: TallaGrooming, cambios: Partial<DraftTalla>) => {
    setDrafts((prev) =>
      prev === null
        ? prev
        : {
            ...prev,
            [s]: { ...prev[s], tallas: { ...prev[s].tallas, [talla]: { ...prev[s].tallas[talla], ...cambios } } },
          },
    );
  };
  const actualizarServicio = (s: ServicioGrooming, cambios: Partial<DraftServicio>) => {
    setDrafts((prev) => (prev === null ? prev : { ...prev, [s]: { ...prev[s], ...cambios } }));
  };

  const mismasEspecies = (a: string[], b: string[]): boolean =>
    a.length === b.length && a.every((e) => b.includes(e));

  const servicioDirty = (d: DraftServicio): boolean => {
    if (d.base === null) return d.ofrecido;
    if (d.ofrecido !== d.base.activo) return true;
    if (especies !== null && !mismasEspecies(especies, d.base.especies)) return true;
    return TALLAS_GROOMING.some((talla) => {
      const base = d.base?.tallas[talla];
      const draft = d.tallas[talla];
      if (!base) return draft.precio !== '' || true; // fila sin talla guardada = dirty
      return precioDe(draft) !== base.precio || draft.duracion !== base.duracionMinutos;
    });
  };

  const extraDraft = (): number | null => (extraActivo ? (leerPrecio(extraMonto) ?? PISO_EXTRA) : null);
  const extraDirty = extraDraft() !== extraBase;

  const hayCambios = useMemo(() => {
    if (drafts === null || franjas === null || especies === null) return false;
    return (
      SERVICIOS_GROOMING.some((s) => servicioDirty(drafts[s])) ||
      extraDirty ||
      franjas.some(franjaDirty) ||
      !mismasEspecies(especies, especiesBase)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts, franjas, especies, especiesBase, extraActivo, extraMonto, extraBase]);

  // el espejo VIVO — la firma: los 6 precios + extra + duraciones
  const datosEspejo = useMemo(() => {
    const servicios: ServicioEspejoGrooming[] = [];
    if (drafts !== null) {
      for (const s of SERVICIOS_GROOMING) {
        const d = drafts[s];
        if (!d.ofrecido) continue;
        servicios.push({
          nombre: vozServicio(s),
          tallas: TALLAS_GROOMING.map((talla) => `${tallaCorta(talla)} ${monto(precioDe(d.tallas[talla]))}`).join(' · '),
          duraciones: TALLAS_GROOMING.map((talla) => d.tallas[talla].duracion).join(' · '),
        });
      }
    }
    const diasActivos =
      franjas === null ? [] : ORDEN_DISPLAY.filter((dia) => franjas.some((f) => f.diaSemana === dia && f.activo && !f.quitar));
    return {
      servicios,
      extra: servicios.length > 0 && extraActivo ? monto(leerPrecio(extraMonto) ?? PISO_EXTRA) : null,
      dias: diasActivos.map(vozDia),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts, franjas, extraActivo, extraMonto, t]);

  // EL GUARDADO ÚNICO — el diff en secuencia (mecánica del paseo)
  async function guardarTodo() {
    if (guardando || !listo || drafts === null || especies === null || franjas === null || pantalla.estado !== 'listo') return;

    const algunoOfrecido = SERVICIOS_GROOMING.some((s) => drafts[s].ofrecido);
    if (algunoOfrecido && especies.length === 0) {
      // la validación apunta la sección con el error
      if (!modoWizard) setSeccionForzada('servicios');
      else setPaso(0);
      mostrar({ texto: t('tallerGrooming.especiesMinima'), variante: 'error' });
      return;
    }

    setGuardando(true);
    for (const s of SERVICIOS_GROOMING) {
      const d = drafts[s];
      if (!servicioDirty(d) && (d.base === null || mismasEspecies(especies, d.base.especies))) continue;
      if (d.base === null && !d.ofrecido) continue;
      const r = await guardarServicioGrooming({
        prestadorId: pantalla.prestadorId,
        tipoServicio: s,
        ofertaId: d.base?.id ?? null,
        activo: d.ofrecido,
        especies,
        tallas: {
          S: { precio: precioDe(d.tallas.S), duracionMinutos: d.tallas.S.duracion },
          M: { precio: precioDe(d.tallas.M), duracionMinutos: d.tallas.M.duracion },
          L: { precio: precioDe(d.tallas.L), duracionMinutos: d.tallas.L.duracion },
        },
      });
      if (!r.ok) {
        setGuardando(false);
        mostrar({ texto: r.mensaje, variante: 'error' });
        return;
      }
      actualizarServicio(s, draftServicioDesdeBase(r.data, s));
    }
    setEspeciesBase(especies);

    if (extraDirty) {
      const r = await actualizarExtraPelajeLargo(pantalla.prestadorId, extraDraft());
      if (!r.ok) {
        setGuardando(false);
        mostrar({ texto: r.mensaje, variante: 'error' });
        return;
      }
      setExtraBase(r.data.valor);
    }

    const rf = await aplicarDiffFranjas(pantalla.prestadorId, franjas);
    setFranjas(rf.franjas);
    if (!rf.ok) {
      setGuardando(false);
      mostrar({
        texto:
          rf.error.tipo === 'solape'
            ? `${vozDia(rf.error.diaSemana)}: ${t('horarios.solape')}`
            : rf.error.mensaje,
        variante: 'error',
      });
      return;
    }

    setGuardando(false);
    mostrar({ texto: t('taller.guardado'), variante: 'exito' });
    if (router.canGoBack()) router.back();
    else router.replace('/grooming');
  }

  const alAtras = () => {
    if (modoWizard && paso > 0) {
      setPaso(paso - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/grooming');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('tallerGrooming.titulo')} atras onAtras={alAtras} />

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5], gap: spacing[4] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="45%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={140} />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={100} />
          </EsqueletoGrupo>
        </View>
      )}

      {pantalla.estado === 'error' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('taller.error')}
            descripcion={t('taller.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('taller.reintentar')}
                onPress={() => {
                  setPantalla({ estado: 'cargando' });
                  setDrafts(null);
                  setEspecies(null);
                  setFranjas(null);
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        </View>
      )}

      {listo && drafts !== null && especies !== null && (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10], gap: spacing[5] }}
        >
          {/* progreso del wizard — visible y sereno */}
          {modoWizard && <VozSecundaria texto={t('tallerGrooming.paso', { n: paso + 1 })} />}

          {pantalla.estado === 'listo' && pantalla.cuentaActiva === false && seccionVisible === 'servicios' && (
            <VozSecundaria texto={t('servicios.cuentaNoActiva')} />
          )}

          {/* ══ PASO/SECCIÓN 1 — servicios y precios ══ */}
          {seccionVisible === 'servicios' && (
            <View style={{ gap: spacing[4] }}>
              <TituloBloque texto={t('tallerGrooming.serviciosTitulo')} />
              <VozSecundaria texto={t('tallerGrooming.serviciosIntro')} />

              {/* ESPECIES — globales de la oferta (enmienda 3), dentro
                  del techo de plataforma perro/gato (§5) */}
              <SelectorOpcion
                etiqueta={t('tallerGrooming.especies')}
                disposicion="fila"
                acento="oficio"
                multiple
                opciones={[
                  { codigo: 'perro', etiqueta: t('tallerGrooming.especiePerro') },
                  { codigo: 'gato', etiqueta: t('tallerGrooming.especieGato') },
                ]}
                seleccionadas={especies}
                onSelect={(codigo) =>
                  setEspecies((prev) =>
                    prev === null ? prev : prev.includes(codigo) ? prev.filter((e) => e !== codigo) : [...prev, codigo],
                  )
                }
              />
              {especies.length === 0 && <VozSecundaria texto={t('tallerGrooming.especiesMinima')} />}

              {/* LOS DOS SERVICIOS — el Interruptor ES el booleano (v3.2) */}
              {SERVICIOS_GROOMING.map((s) => {
                const d = drafts[s];
                const talla = tallaSel[s];
                const dt = d.tallas[talla];
                return (
                  <Tarjeta key={s} elevacion="reposo">
                    <View style={{ gap: spacing[4] }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] }}>
                        <Text
                          style={{
                            fontFamily: typography.family.sans.medium,
                            fontSize: typography.size.md,
                            color: theme.text.primary,
                          }}
                        >
                          {vozServicio(s)}
                        </Text>
                        <Interruptor
                          etiqueta={`${t('tallerGrooming.ofrecerServicio')} · ${vozServicio(s)}`}
                          registro="oficio"
                          encendido={d.ofrecido}
                          onCambio={(v) => actualizarServicio(s, { ofrecido: v })}
                        />
                      </View>
                      {!d.ofrecido ? (
                        d.base !== null && <VozSecundaria texto={t('servicios.pausada')} />
                      ) : (
                        <>
                          {d.base === null && <VozSecundaria texto={t('taller.seOfreceAlGuardar')} />}
                          {/* EL CHIP DE TALLA GOBIERNA (patrón v3.1): el
                              borrador de cada talla se conserva al saltar */}
                          <SelectorOpcion
                            etiqueta={t('tallerGrooming.talla')}
                            disposicion="fila"
                            acento="oficio"
                            opciones={TALLAS_GROOMING.map((tl) => ({ codigo: tl, etiqueta: vozTalla(tl) }))}
                            seleccionada={talla}
                            onSelect={(codigo) => setTallaSel((prev) => ({ ...prev, [s]: codigo as TallaGrooming }))}
                          />
                          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                            <Text
                              style={{
                                fontFamily: typography.family.sans.regular,
                                fontSize: typography.size.sm,
                                color: theme.text.secondary,
                              }}
                            >
                              {t('servicios.precio')}
                            </Text>
                            <Text
                              style={{
                                fontFamily: typography.family.mono.regular,
                                fontSize: typography.size.lg,
                                fontVariant: ['tabular-nums'],
                                color: theme.text.primary,
                              }}
                            >
                              {etiquetasServicio[indiceEn(pasosServicio, dt.precio)]}
                            </Text>
                          </View>
                          <SliderPrecio
                            etiqueta={`${t('servicios.precio')} · ${vozServicio(s)} · ${vozTalla(talla)}`}
                            pasos={etiquetasServicio}
                            indice={indiceEn(pasosServicio, dt.precio)}
                            onCambio={(i) => actualizarTalla(s, talla, { precio: pasosServicio[i].toFixed(2) })}
                            registro="aa"
                          />
                          <VozComision pct={pct} precio={precioDe(dt)} />
                          {/* duración POR COMBINACIÓN (§6): letra dura de
                              DB 30–240 paso 15' — Celda-selector con Hoja
                              (regla del teclado; StepperCantidad no porta
                              paso — pedido a la A anotado) */}
                          <Separador />
                          <Celda
                            interactiva
                            accessibilityRole="button"
                            titulo={t('tallerGrooming.duracion')}
                            subtitulo={t('tallerGrooming.duracionAyuda')}
                            metadataMono={t('tallerGrooming.minutos', { n: dt.duracion })}
                            onPress={() => setHojaDuracion({ servicio: s, talla })}
                          />
                        </>
                      )}
                    </View>
                  </Tarjeta>
                );
              })}

              {/* EL EXTRA POR PELAJE LARGO — UNO, global (enmienda 2) */}
              <Tarjeta elevacion="reposo">
                <View style={{ gap: spacing[4] }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] }}>
                    <Text
                      style={{
                        fontFamily: typography.family.sans.regular,
                        fontSize: typography.size.base,
                        color: theme.text.primary,
                      }}
                    >
                      {t('tallerGrooming.extraInterruptor')}
                    </Text>
                    <Interruptor
                      etiqueta={t('tallerGrooming.extraInterruptor')}
                      registro="oficio"
                      encendido={extraActivo}
                      onCambio={setExtraActivo}
                    />
                  </View>
                  {extraActivo && (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing[3] }}>
                        <Text
                          style={{
                            flex: 1,
                            fontFamily: typography.family.sans.regular,
                            fontSize: typography.size.sm,
                            color: theme.text.secondary,
                          }}
                        >
                          {t('tallerGrooming.extraRotulo')}
                        </Text>
                        <Text
                          style={{
                            fontFamily: typography.family.mono.regular,
                            fontSize: typography.size.lg,
                            fontVariant: ['tabular-nums'],
                            color: theme.text.primary,
                          }}
                        >
                          {etiquetasExtra[indiceEn(pasosExtra, extraMonto)]}
                        </Text>
                      </View>
                      <SliderPrecio
                        etiqueta={t('tallerGrooming.extraRotulo')}
                        pasos={etiquetasExtra}
                        indice={indiceEn(pasosExtra, extraMonto)}
                        onCambio={(i) => setExtraMonto(pasosExtra[i].toFixed(2))}
                        registro="aa"
                      />
                      <VozSecundaria texto={t('tallerGrooming.extraAyuda')} />
                    </>
                  )}
                </View>
              </Tarjeta>
            </View>
          )}

          {/* ══ PASO/SECCIÓN 2 — días y horarios (sección COMPARTIDA) ══ */}
          {seccionVisible === 'horarios' && franjas !== null && (
            <SeccionHorarios
              franjas={franjas}
              onCambio={setFranjas}
              oficio="grooming"
              titulo={<TituloBloque texto={t('taller.horariosTitulo')} />}
            />
          )}

          {/* el espejo del artesano — LA FIRMA, en cada paso y sección */}
          <EspejoGrooming datos={datosEspejo} />

          {modoWizard && paso < PASOS.length - 1 ? (
            <Boton
              variante="primario"
              etiqueta={t('taller.continuar')}
              bloque
              onPress={() => {
                setPaso(paso + 1);
                scrollRef.current?.scrollTo({ y: 0, animated: false });
              }}
            />
          ) : (
            <Boton
              variante="primario"
              etiqueta={t('taller.guardar')}
              bloque
              cargando={guardando}
              deshabilitado={!hayCambios}
              onPress={() => void guardarTodo()}
            />
          )}
        </ScrollView>
      )}

      {/* Hoja: duración de la combinación — las opciones del CHECK de DB */}
      <Hoja
        visible={hojaDuracion !== null}
        onCerrar={() => setHojaDuracion(null)}
        titulo={t('tallerGrooming.duracion')}
        altura="media"
      >
        <HojaScroll>
          {DURACIONES.map((dur, i) => (
            <View key={dur}>
              {i > 0 && <Separador />}
              <Celda
                interactiva
                accessibilityRole="button"
                titulo={t('tallerGrooming.minutos', { n: dur })}
                onPress={() => {
                  if (hojaDuracion !== null) {
                    actualizarTalla(hojaDuracion.servicio, hojaDuracion.talla, { duracion: dur });
                  }
                  setHojaDuracion(null);
                }}
              />
            </View>
          ))}
        </HojaScroll>
      </Hoja>
    </View>
  );
}
