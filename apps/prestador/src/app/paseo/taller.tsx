/**
 * EL ARTE DEL PASEO — el taller (S58-B B1b, adenda FIRMADA del founder).
 * UNA pantalla con scroll, todo el oficio: duraciones/precios · plan y
 * paquete · días y horarios (cupo POR FRANJA — el motor _agenda_ocupacion
 * es la verdad, jamás un cupo global) · celda-puente a Vacaciones · CTA
 * único "Guardar tu oferta" en tinta. Absorbe /servicios y /horarios
 * (S55-B B2), que MUEREN con esta pantalla.
 *
 * TESIS: "Todo tu oficio de paseo se gobierna en un solo lugar — lo
 * ajustas y lo guardas UNA vez."
 * FIRMA (comportamiento, dosis prestador): el espejo "Así lo ve el dueño"
 * al pie responde EN VIVO a cada ajuste del borrador — consecuencia
 * visible antes de guardar (patrón Kaxo).
 *
 * MODELO DE BORRADOR: nada persiste hasta el CTA. El guardado aplica el
 * diff en secuencia por la puerta única; cada operación que entra
 * actualiza su base en el borrador — un fallo parcial deja el resto
 * DIRTY y el CTA vivo (nada se pierde, se reintenta lo que falta).
 * Sin RPC atómica de oferta completa (pedido a la A anotado), la
 * honestidad es esa: lo guardado quedó, lo fallido se dice.
 *
 * MATERIALES: SliderPrecio VIVO (comp. 31, registro 'aa' — §15b.1, la
 * háptica llega por su hook onStep cuando expo-haptics entre con build
 * L-134) · ZONAS DE COBERTURA VIVA (contrato D-331 v1 declarativa de la
 * A: cat_ciudades solo-admin + prestador_zonas; declara, no filtra).
 * PENDIENTES DECLARADOS (armado en estructura, L-143 — el COPIAR NIVEL
 * fino llega con el PNG patrón):
 *   · stepper del cupo → hoy SelectorOpcion 1-4 (patrón aprobado).
 *   · interruptor (toggle) → hoy Boton ghost Ofrecer/Pausar.
 *   · el acento tealDark en SelectorOpcion/controles de packages/ui es
 *     territorio A (los componentes no exponen registro) — anotado.
 *
 * Letra leída (regla de piedra): DISEÑO_EXPERIENCIA §15b v1.5 (la dosis)
 * · MODELO_FINANCIERO v2.7 §7.13/§7.15 (neto SIEMPRE de fee_configs vía
 * fees.ts) · MODELO_PASEO v1.4 §2 (menú canónico en CHECK de DB —
 * BLOQUES_PASEO es su espejo).
 * Regla 32: 0=Domingo viaja a DB sin transformaciones.
 * Dosis baja (test 7): cero acento de capa, CTA en tinta, sin gradiente.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Boton,
  Campo,
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
  BLOQUES_PASEO,
  actualizarFranjaHorario,
  actualizarOfertaPaseo,
  agregarZonaCobertura,
  crearFranjaHorario,
  crearOfertaPaseo,
  eliminarFranjaHorario,
  obtenerCatalogoCiudades,
  obtenerComisionVigenteCita,
  obtenerFranjasHorario,
  obtenerMiCuentaComercial,
  obtenerMiPrestador,
  obtenerOfertasPaseoPropias,
  obtenerZonasDePrestador,
  quitarZonaCobertura,
  type BloquePaseo,
  type CiudadCatalogo,
  type FranjaHorario,
  type OfertaPaseoPropia,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { EspejoOferta } from '@/components/espejo-oferta';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; prestadorId: string; cuentaActiva: boolean | null; comisionPct: number | null };

interface DraftOferta {
  base: OfertaPaseoPropia | null;
  ofrecida: boolean;
  precio: string;
  plan: string;
  paquete: string;
  nombre: string;
  descripcion: string;
}

interface DraftFranja {
  key: string;
  id: string | null; // null = nace al guardar
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  cupo: number;
  activo: boolean;
  quitar: boolean;
  baseCupo: number | null;
  baseActivo: boolean | null;
}

// zonas v1 DECLARATIVA (contrato D-331 de la A: declara, no filtra;
// catálogo solo-admin — ciudad faltante = pedido, jamás texto libre)
interface DraftZona {
  key: string;
  id: string | null; // null = nace al guardar
  ciudad: CiudadCatalogo;
  quitar: boolean;
}

// display lunes-primero; el ÍNDICE que viaja a DB sigue siendo 0=Domingo
const ORDEN_DISPLAY = [1, 2, 3, 4, 5, 6, 0] as const;

// grilla v1: pasos de 30 min, 05:00–22:00 (heredada de /horarios S55-B)
const HORAS: string[] = [];
for (let m = 5 * 60; m <= 22 * 60; m += 30) {
  HORAS.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
}

// el riel del precio: pasos de $0.25 (letra §15b.5a). Piso $0.25; techo
// $40 que se estira si una oferta real ya lo supera (decisión de rango
// declarada al gate — la letra fija el PASO, no el techo).
const PASO_PRECIO = 0.25;
function pasosPrecio(techo: number): number[] {
  const max = Math.max(40, Math.ceil(techo));
  const pasos: number[] = [];
  for (let v = PASO_PRECIO; v <= max + 1e-9; v += PASO_PRECIO) {
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

// Plan y paquete distinguen tres estados: vacío = SIN oferta (null
// honesto), número válido, o inválido (bloquea el guardado con voz).
function leerPorSalida(texto: string): number | null | 'invalido' {
  if (texto.trim() === '') return null;
  const v = Number.parseFloat(texto.replace(',', '.'));
  if (!Number.isFinite(v) || v <= 0) return 'invalido';
  return Math.round(v * 100) / 100;
}

function draftDesdeBase(o: OfertaPaseoPropia | null): DraftOferta {
  return o
    ? {
        base: o,
        ofrecida: o.activo,
        precio: o.precio.toFixed(2),
        plan: o.precioPlan !== null ? o.precioPlan.toFixed(2) : '',
        paquete: o.precioPaquete !== null ? o.precioPaquete.toFixed(2) : '',
        nombre: o.nombre ?? '',
        descripcion: o.descripcion ?? '',
      }
    : { base: null, ofrecida: false, precio: '', plan: '', paquete: '', nombre: '', descripcion: '' };
}

function draftDesdeFranja(f: FranjaHorario): DraftFranja {
  return {
    key: f.id,
    id: f.id,
    diaSemana: f.diaSemana,
    horaInicio: f.horaInicio,
    horaFin: f.horaFin,
    cupo: f.maxCitasPorSlot,
    activo: f.activo,
    quitar: false,
    baseCupo: f.maxCitasPorSlot,
    baseActivo: f.activo,
  };
}

function ofertaDirty(d: DraftOferta): boolean {
  if (d.base === null) return d.ofrecida;
  const precio = leerPrecio(d.precio);
  const plan = leerPorSalida(d.plan);
  const paquete = leerPorSalida(d.paquete);
  return (
    d.ofrecida !== d.base.activo ||
    (precio !== null && precio !== d.base.precio) ||
    (plan !== 'invalido' && plan !== d.base.precioPlan) ||
    (paquete !== 'invalido' && paquete !== d.base.precioPaquete) ||
    d.nombre !== (d.base.nombre ?? '') ||
    d.descripcion !== (d.base.descripcion ?? '')
  );
}

function franjaDirty(f: DraftFranja): boolean {
  if (f.id === null) return !f.quitar;
  return f.quitar || f.cupo !== f.baseCupo || f.activo !== f.baseActivo;
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

// la comisión visible donde se pone el precio (financiero 7.15: el % viene
// del dato leído de fee_configs, jamás hardcodeado; sin dato = voz honesta)
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

// la voz de un PRECIO POR SALIDA (plan o paquete — S56/S57, heredada):
// vacío = voz honesta del null; con valor = neto 7.15 + comparación sin juzgar
function VozPorSalida({
  pct,
  texto,
  suelto,
  vozVacia,
  comparar,
}: {
  pct: number | null;
  texto: string;
  suelto: number | null;
  vozVacia: string;
  comparar: (suelto: string, valor: string) => string;
}) {
  if (texto.trim() === '') return <VozSecundaria texto={vozVacia} />;
  const v = leerPorSalida(texto);
  if (v === null || v === 'invalido') return null;
  return (
    <View style={{ gap: spacing[1] }}>
      <VozComision pct={pct} precio={v} />
      {suelto !== null ? <VozSecundaria texto={comparar(monto(suelto), monto(v))} /> : null}
    </View>
  );
}

export default function TallerPaseo() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const { seccion } = useLocalSearchParams<{ seccion?: string }>();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);

  // EL BORRADOR — null hasta la primera carga; sobrevive a los reintentos
  // de guardado (solo un guardado COMPLETO o un reintento de carga lo re-arma)
  const [drafts, setDrafts] = useState<Record<BloquePaseo, DraftOferta> | null>(null);
  const [franjas, setFranjas] = useState<DraftFranja[] | null>(null);
  const [zonas, setZonas] = useState<DraftZona[] | null>(null);
  const [ciudades, setCiudades] = useState<CiudadCatalogo[]>([]);

  const [duracionSel, setDuracionSel] = useState<BloquePaseo>(30);
  const [diaSel, setDiaSel] = useState<number>(1);
  const [errorPlan, setErrorPlan] = useState<string | undefined>(undefined);
  const [errorPaquete, setErrorPaquete] = useState<string | undefined>(undefined);

  // Hojas
  const [hojaNombre, setHojaNombre] = useState(false);
  const [hojaPlanPaquete, setHojaPlanPaquete] = useState<BloquePaseo | null>(null);
  const [hojaFranja, setHojaFranja] = useState<string | null>(null);
  const [confirmandoQuitar, setConfirmandoQuitar] = useState(false);
  const [creandoFranja, setCreandoFranja] = useState(false);
  const [vistaNueva, setVistaNueva] = useState<'form' | 'desde' | 'hasta'>('form');
  const [desdeSel, setDesdeSel] = useState<string | null>(null);
  const [hastaSel, setHastaSel] = useState<string | null>(null);
  const [cupoSel, setCupoSel] = useState('1');

  const [guardando, setGuardando] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const anclas = useRef<Record<string, number>>({});
  const anclado = useRef(false);
  const contadorNuevas = useRef(0);

  // carga ÚNICA (editor de borrador: el refetch-en-focus clobbearía el
  // draft al volver de /vacaciones — decisión declarada)
  useEffect(() => {
    let vigente = true;
    void (async () => {
      const prestador = await obtenerMiPrestador();
      if (!vigente) return;
      if (!prestador.ok) {
        setPantalla({ estado: 'error' });
        return;
      }
      const [rOfertas, rFranjas, rZonas, rCiudades, rCuenta, rComision] = await Promise.all([
        obtenerOfertasPaseoPropias(prestador.data.id),
        obtenerFranjasHorario(prestador.data.id),
        obtenerZonasDePrestador(prestador.data.id),
        obtenerCatalogoCiudades(),
        obtenerMiCuentaComercial(),
        obtenerComisionVigenteCita(),
      ]);
      if (!vigente) return;
      if (!rOfertas.ok || !rFranjas.ok || !rZonas.ok) {
        setPantalla({ estado: 'error' });
        return;
      }
      const iniciales = {} as Record<BloquePaseo, DraftOferta>;
      for (const b of BLOQUES_PASEO) {
        iniciales[b] = draftDesdeBase(rOfertas.data.find((o) => o.duracionMinutos === b) ?? null);
      }
      setDrafts(iniciales);
      setFranjas(rFranjas.data.map(draftDesdeFranja));
      setZonas(rZonas.data.map((z) => ({ key: z.id, id: z.id, ciudad: z.ciudad, quitar: false })));
      setCiudades(rCiudades.ok ? rCiudades.data : []);
      const primeraOfrecida = BLOQUES_PASEO.find((b) => iniciales[b].ofrecida);
      if (primeraOfrecida !== undefined) setDuracionSel(primeraOfrecida);
      const primerDia = ORDEN_DISPLAY.find((d) => rFranjas.data.some((f) => f.diaSemana === d));
      if (primerDia !== undefined) setDiaSel(primerDia);
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

  // ancla ?seccion= — un solo scroll, cuando la sección ya midió
  useEffect(() => {
    if (pantalla.estado !== 'listo' || anclado.current || !seccion) return;
    const y = anclas.current[seccion];
    if (y !== undefined) {
      anclado.current = true;
      scrollRef.current?.scrollTo({ y, animated: false });
    }
  });

  const listo = pantalla.estado === 'listo' && drafts !== null && franjas !== null && zonas !== null;
  const pct = pantalla.estado === 'listo' ? pantalla.comisionPct : null;

  const etiquetaCorta = (b: BloquePaseo): string => t(`taller.d${b}` as const);
  const etiquetaBloque = (duracion: number): string => {
    switch (duracion) {
      case 30: return t('servicios.bloque30');
      case 60: return t('servicios.bloque60');
      case 120: return t('servicios.bloque120');
      case 180: return t('servicios.bloque180');
      case 240: return t('servicios.bloque240');
      case 300: return t('servicios.bloque300');
      default: return `${duracion} min`;
    }
  };
  const vozDia = (dia: number): string => t(`horarios.dia${dia as 0 | 1 | 2 | 3 | 4 | 5 | 6}` as const);
  const vozCupo = (cupo: number): string =>
    cupo === 1 ? t('horarios.cupoUno') : t('horarios.cupoVarios', { cantidad: cupo });

  const actualizarDraft = (b: BloquePaseo, cambios: Partial<DraftOferta>) => {
    setDrafts((prev) => (prev === null ? prev : { ...prev, [b]: { ...prev[b], ...cambios } }));
  };
  const actualizarFranjaDraft = (key: string, cambios: Partial<DraftFranja>) => {
    setFranjas((prev) => (prev === null ? prev : prev.map((f) => (f.key === key ? { ...f, ...cambios } : f))));
  };

  const zonaDirty = (z: DraftZona): boolean => (z.id === null ? !z.quitar : z.quitar);

  const hayCambios = useMemo(() => {
    if (drafts === null || franjas === null || zonas === null) return false;
    return (
      BLOQUES_PASEO.some((b) => ofertaDirty(drafts[b])) ||
      franjas.some(franjaDirty) ||
      zonas.some(zonaDirty)
    );
  }, [drafts, franjas, zonas]);

  // el espejo VIVO: deriva del borrador — la firma de la pantalla
  const datosEspejo = useMemo(() => {
    const ofrecidas = drafts === null ? [] : BLOQUES_PASEO.filter((b) => drafts[b].ofrecida && leerPrecio(drafts[b].precio) !== null);
    const precios = drafts === null ? [] : ofrecidas.map((b) => leerPrecio(drafts[b].precio) as number);
    const diasActivos = franjas === null ? [] : ORDEN_DISPLAY.filter((d) => franjas.some((f) => f.diaSemana === d && f.activo && !f.quitar));
    return {
      duraciones: ofrecidas.map(etiquetaCorta),
      desde: precios.length > 0 ? Math.min(...precios) : null,
      conPlan: drafts !== null && ofrecidas.some((b) => leerPorSalida(drafts[b].plan) !== null && leerPorSalida(drafts[b].plan) !== 'invalido'),
      conPaquete: drafts !== null && ofrecidas.some((b) => leerPorSalida(drafts[b].paquete) !== null && leerPorSalida(drafts[b].paquete) !== 'invalido'),
      dias: diasActivos.map(vozDia),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts, franjas, t]);

  function agregarFranjaDraft() {
    if (franjas === null || desdeSel === null || hastaSel === null) return;
    // solape local contra el borrador del día (el wrapper re-valida al guardar)
    const solapa = franjas.some(
      (f) => f.diaSemana === diaSel && !f.quitar && desdeSel < f.horaFin && f.horaInicio < hastaSel,
    );
    if (solapa) {
      mostrar({ texto: t('horarios.solape'), variante: 'error' });
      return;
    }
    contadorNuevas.current += 1;
    setFranjas([
      ...franjas,
      {
        key: `nueva-${contadorNuevas.current}`,
        id: null,
        diaSemana: diaSel,
        horaInicio: desdeSel,
        horaFin: hastaSel,
        cupo: Number.parseInt(cupoSel, 10),
        activo: true,
        quitar: false,
        baseCupo: null,
        baseActivo: null,
      },
    ]);
    setCreandoFranja(false);
  }

  // EL GUARDADO — el diff entero en secuencia; cada éxito actualiza su
  // base (un fallo parcial deja el resto dirty y reintentabile)
  async function guardarTodo() {
    if (guardando || drafts === null || franjas === null || zonas === null || pantalla.estado !== 'listo') return;

    // validación previa con voz por duración (el precio suelto no puede
    // ser inválido: el slider solo produce pasos del riel)
    for (const b of BLOQUES_PASEO) {
      const d = drafts[b];
      if (!ofertaDirty(d)) continue;
      if (d.ofrecida && leerPrecio(d.precio) === null) {
        // red imposible-por-diseño: si pasa, se apunta la duración
        setDuracionSel(b);
        scrollRef.current?.scrollTo({ y: anclas.current.duraciones ?? 0, animated: true });
        return;
      }
      if (leerPorSalida(d.plan) === 'invalido' || leerPorSalida(d.paquete) === 'invalido') {
        setHojaPlanPaquete(b);
        setErrorPlan(leerPorSalida(d.plan) === 'invalido' ? t('servicios.precioPlanInvalido') : undefined);
        setErrorPaquete(leerPorSalida(d.paquete) === 'invalido' ? t('servicios.precioPaqueteInvalido') : undefined);
        return;
      }
    }

    setGuardando(true);
    // ofertas por duración
    for (const b of BLOQUES_PASEO) {
      const d = drafts[b];
      if (!ofertaDirty(d)) continue;
      if (d.base === null) {
        const precio = leerPrecio(d.precio);
        if (precio === null) continue;
        const plan = leerPorSalida(d.plan);
        const paquete = leerPorSalida(d.paquete);
        const r = await crearOfertaPaseo({
          prestadorId: pantalla.prestadorId,
          duracionMinutos: b,
          precio,
          precioPlan: plan === 'invalido' ? null : plan,
          precioPaquete: paquete === 'invalido' ? null : paquete,
          nombre: d.nombre || undefined,
          descripcion: d.descripcion || undefined,
        });
        if (!r.ok) {
          setGuardando(false);
          mostrar({ texto: r.mensaje, variante: 'error' });
          return;
        }
        actualizarDraft(b, { base: r.data });
      } else {
        const precio = leerPrecio(d.precio);
        const plan = leerPorSalida(d.plan);
        const paquete = leerPorSalida(d.paquete);
        const r = await actualizarOfertaPaseo({
          id: d.base.id,
          precio: precio ?? undefined,
          precioPlan: plan === 'invalido' ? undefined : plan,
          precioPaquete: paquete === 'invalido' ? undefined : paquete,
          nombre: d.nombre,
          descripcion: d.descripcion,
          activo: d.ofrecida,
        });
        if (!r.ok) {
          setGuardando(false);
          mostrar({ texto: r.mensaje, variante: 'error' });
          return;
        }
        actualizarDraft(b, { base: r.data, ofrecida: r.data.activo });
      }
    }

    // franjas: quitar → actualizar → crear
    for (const f of franjas) {
      if (!franjaDirty(f)) continue;
      if (f.id !== null && f.quitar) {
        const r = await eliminarFranjaHorario(f.id);
        if (!r.ok) {
          setGuardando(false);
          mostrar({ texto: r.mensaje, variante: 'error' });
          return;
        }
        setFranjas((prev) => (prev === null ? prev : prev.filter((x) => x.key !== f.key)));
      } else if (f.id !== null) {
        const r = await actualizarFranjaHorario({ id: f.id, maxCitasPorSlot: f.cupo, activo: f.activo });
        if (!r.ok) {
          setGuardando(false);
          mostrar({ texto: r.mensaje, variante: 'error' });
          return;
        }
        actualizarFranjaDraft(f.key, { baseCupo: f.cupo, baseActivo: f.activo });
      } else if (!f.quitar) {
        const r = await crearFranjaHorario({
          prestadorId: pantalla.prestadorId,
          diaSemana: f.diaSemana,
          horaInicio: f.horaInicio,
          horaFin: f.horaFin,
          maxCitasPorSlot: f.cupo,
        });
        if (!r.ok) {
          setGuardando(false);
          mostrar({
            texto: r.codigo === 'franja_solapada' ? t('horarios.solape') : r.mensaje,
            variante: 'error',
          });
          return;
        }
        actualizarFranjaDraft(f.key, { id: r.data.id, baseCupo: r.data.maxCitasPorSlot, baseActivo: r.data.activo });
      }
    }

    // zonas: quitar → agregar (v1 declarativa, contrato D-331)
    for (const z of zonas) {
      if (!zonaDirty(z)) continue;
      if (z.id !== null && z.quitar) {
        const r = await quitarZonaCobertura(z.id);
        if (!r.ok) {
          setGuardando(false);
          mostrar({ texto: r.mensaje, variante: 'error' });
          return;
        }
        setZonas((prev) => (prev === null ? prev : prev.filter((x) => x.key !== z.key)));
      } else if (z.id === null && !z.quitar) {
        const r = await agregarZonaCobertura({ prestador_id: pantalla.prestadorId, ciudad_id: z.ciudad.id });
        if (!r.ok) {
          setGuardando(false);
          mostrar({ texto: r.mensaje, variante: 'error' });
          return;
        }
        setZonas((prev) => (prev === null ? prev : prev.map((x) => (x.key === z.key ? { ...x, id: r.data.id } : x))));
      }
    }

    setGuardando(false);
    mostrar({ texto: t('taller.guardado'), variante: 'exito' });
    if (router.canGoBack()) router.back();
    else router.replace('/paseo');
  }

  const d = drafts?.[duracionSel] ?? null;
  const franjaEnHoja = franjas?.find((f) => f.key === hojaFranja) ?? null;
  // el riel del precio — techo estable desde las ofertas GUARDADAS (el
  // borrador no estira el riel mientras se arrastra)
  const pasos = useMemo(() => {
    const techoBase = drafts === null ? 0 : Math.max(0, ...BLOQUES_PASEO.map((b) => drafts[b].base?.precio ?? 0));
    return pasosPrecio(techoBase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts === null]);
  const etiquetasPasos = useMemo(() => pasos.map(monto), [pasos]);
  const indicePrecio = (texto: string): number => {
    const v = leerPrecio(texto);
    if (v === null) return Math.round(5 / PASO_PRECIO) - 1;
    return Math.min(Math.max(Math.round(v / PASO_PRECIO) - 1, 0), pasos.length - 1);
  };
  const ofrecidasParaPlan = drafts === null ? [] : BLOQUES_PASEO.filter((b) => drafts[b].ofrecida || drafts[b].base !== null);
  const franjasDelDia = franjas === null ? [] : franjas.filter((f) => f.diaSemana === diaSel && !f.quitar);

  const resumenPlanPaquete = (b: BloquePaseo): string => {
    if (drafts === null) return '';
    const plan = leerPorSalida(drafts[b].plan);
    const paquete = leerPorSalida(drafts[b].paquete);
    const partes: string[] = [];
    if (typeof plan === 'number') partes.push(t('taller.planResumen', { precio: monto(plan) }));
    if (typeof paquete === 'number') partes.push(t('taller.paqueteResumen', { precio: monto(paquete) }));
    return partes.length > 0 ? partes.join(' · ') : t('taller.sinPlanNiPaquete');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('taller.titulo')}
        atras
        onAtras={() => (router.canGoBack() ? router.back() : router.replace('/paseo'))}
      />

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
                  setFranjas(null);
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        </View>
      )}

      {listo && d !== null && (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10], gap: spacing[6] }}
        >
          {pantalla.estado === 'listo' && pantalla.cuentaActiva === false && (
            <VozSecundaria texto={t('servicios.cuentaNoActiva')} />
          )}

          {/* ── duraciones y precios ─────────────────────────────── */}
          <View
            style={{ gap: spacing[3] }}
            onLayout={(e) => {
              anclas.current.duraciones = e.nativeEvent.layout.y;
            }}
          >
            <TituloBloque texto={t('taller.duracionesTitulo')} />
            <SelectorOpcion
              etiqueta={t('taller.duracionesTitulo')}
              disposicion="grilla"
              acento="oficio"
              opciones={BLOQUES_PASEO.map((b) => ({ codigo: String(b), etiqueta: etiquetaCorta(b) }))}
              seleccionada={String(duracionSel)}
              onSelect={(codigo) => setDuracionSel(Number.parseInt(codigo, 10) as BloquePaseo)}
            />
            <Tarjeta>
              <View style={{ gap: spacing[4] }}>
                {/* Ley 22: el binario dice su nombre — Interruptor SÓLIDO
                    oficio (el botón Ofrecer/Pausar/Reactivar MURIÓ) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] }}>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.base,
                      color: theme.text.primary,
                    }}
                  >
                    {t('taller.ofrecer')}
                  </Text>
                  <Interruptor
                    etiqueta={t('taller.ofrecer')}
                    registro="oficio"
                    encendido={d.ofrecida}
                    onCambio={(v) =>
                      actualizarDraft(duracionSel, {
                        ofrecida: v,
                        // el slider necesita un valor en el riel; nace visible
                        // y ajustable, jamás oculto
                        precio: v && d.precio === '' ? '5.00' : d.precio,
                      })
                    }
                  />
                </View>
                {!d.ofrecida && d.base === null ? (
                  <VozSecundaria texto={t('taller.noOfrecida')} />
                ) : (
                  <>
                    {!d.ofrecida && <VozSecundaria texto={t('servicios.pausada')} />}
                    {d.ofrecida && d.base === null && <VozSecundaria texto={t('taller.seOfreceAlGuardar')} />}
                    {/* el precio se DESLIZA (regla del teclado §15b.4):
                        label de pantalla + valor en mono + SliderPrecio 'aa' */}
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
                        {etiquetasPasos[indicePrecio(d.precio)]}
                      </Text>
                    </View>
                    <SliderPrecio
                      etiqueta={t('servicios.precio')}
                      pasos={etiquetasPasos}
                      indice={indicePrecio(d.precio)}
                      onCambio={(i) => actualizarDraft(duracionSel, { precio: pasos[i].toFixed(2) })}
                      registro="aa"
                    />
                    <VozComision pct={pct} precio={leerPrecio(d.precio)} />
                    {/* nombre/descripción DETRÁS de celda (regla del teclado) */}
                    <Celda
                      interactiva
                      accessibilityRole="button"
                      titulo={t('taller.nombreDescripcion')}
                      subtitulo={d.nombre || t('taller.nombreDescripcionVacio')}
                      onPress={() => setHojaNombre(true)}
                    />
                  </>
                )}
              </View>
            </Tarjeta>
          </View>

          {/* ── plan y paquete ───────────────────────────────────── */}
          <View
            style={{ gap: spacing[3] }}
            onLayout={(e) => {
              anclas.current.planes = e.nativeEvent.layout.y;
            }}
          >
            <TituloBloque texto={t('taller.planPaqueteTitulo')} />
            <VozSecundaria texto={t('taller.planPaqueteExplica')} />
            {ofrecidasParaPlan.length === 0 ? (
              <VozSecundaria texto={t('taller.planPaqueteSinDuraciones')} />
            ) : (
              <Tarjeta relleno="ninguno">
                {ofrecidasParaPlan.map((b, i) => (
                  <View key={b}>
                    {i > 0 && <Separador />}
                    <Celda
                      interactiva
                      accessibilityRole="button"
                      titulo={etiquetaBloque(b)}
                      subtitulo={resumenPlanPaquete(b)}
                      onPress={() => {
                        setHojaPlanPaquete(b);
                        setErrorPlan(undefined);
                        setErrorPaquete(undefined);
                      }}
                    />
                  </View>
                ))}
              </Tarjeta>
            )}
          </View>

          {/* ── días y horarios (cupo POR FRANJA — la verdad del motor) ── */}
          <View
            style={{ gap: spacing[3] }}
            onLayout={(e) => {
              anclas.current.horarios = e.nativeEvent.layout.y;
            }}
          >
            <TituloBloque texto={t('taller.horariosTitulo')} />
            <SelectorOpcion
              etiqueta={t('taller.horariosTitulo')}
              disposicion="tira"
              acento="oficio"
              opciones={ORDEN_DISPLAY.map((dia) => ({ codigo: String(dia), etiqueta: vozDia(dia) }))}
              seleccionada={String(diaSel)}
              onSelect={(codigo) => setDiaSel(Number.parseInt(codigo, 10))}
            />
            {franjasDelDia.length === 0 ? (
              <VozSecundaria texto={t('taller.sinFranjasDia')} />
            ) : (
              <Tarjeta relleno="ninguno">
                {franjasDelDia.map((f, i) => (
                  <View key={f.key}>
                    {i > 0 && <Separador />}
                    <Celda
                      interactiva
                      accessibilityRole="button"
                      titulo={vozCupo(f.cupo)}
                      subtitulo={
                        f.id === null ? t('taller.franjaNueva') : !f.activo ? t('horarios.pausada') : undefined
                      }
                      metadataMono={`${f.horaInicio} – ${f.horaFin}`}
                      onPress={() => {
                        setHojaFranja(f.key);
                        setCupoSel(String(f.cupo));
                        setConfirmandoQuitar(false);
                      }}
                    />
                  </View>
                ))}
              </Tarjeta>
            )}
            <Boton
              variante="secundario"
              etiqueta={t('horarios.agregarFranja')}
              bloque
              onPress={() => {
                setCreandoFranja(true);
                setVistaNueva('form');
                setDesdeSel(null);
                setHastaSel(null);
                setCupoSel('1');
              }}
            />
          </View>

          {/* ── zonas de cobertura (contrato D-331 v1: declara, no filtra;
              ciudad faltante = pedido al equipo, jamás texto libre) ── */}
          <View
            style={{ gap: spacing[3] }}
            onLayout={(e) => {
              anclas.current.zonas = e.nativeEvent.layout.y;
            }}
          >
            <TituloBloque texto={t('taller.zonasTitulo')} />
            <VozSecundaria texto={t('taller.zonasExplica')} />
            {/* Ley 22 (adenda founder): las ciudades del catálogo como
                chips TONALES multi-selección — elegir varias o ninguna es
                legal (19.3); las Hojas de agregar/quitar MURIERON (Chanel) */}
            <SelectorOpcion
              etiqueta={t('taller.zonasTitulo')}
              disposicion="grilla"
              acento="oficio"
              multiple
              opciones={ciudades.map((c) => ({ codigo: c.id, etiqueta: c.nombre }))}
              seleccionadas={(zonas ?? []).filter((z) => !z.quitar).map((z) => z.ciudad.id)}
              onSelect={(ciudadId) => {
                if (zonas === null) return;
                const vigente = zonas.find((z) => z.ciudad.id === ciudadId && !z.quitar);
                if (vigente) {
                  // apagar: la nueva se va del borrador; la guardada se marca
                  setZonas(
                    vigente.id === null
                      ? zonas.filter((z) => z.key !== vigente.key)
                      : zonas.map((z) => (z.key === vigente.key ? { ...z, quitar: true } : z)),
                  );
                  return;
                }
                const marcada = zonas.find((z) => z.ciudad.id === ciudadId && z.quitar);
                if (marcada) {
                  setZonas(zonas.map((z) => (z.key === marcada.key ? { ...z, quitar: false } : z)));
                  return;
                }
                const ciudad = ciudades.find((c) => c.id === ciudadId);
                if (!ciudad) return;
                contadorNuevas.current += 1;
                setZonas([...zonas, { key: `zona-${contadorNuevas.current}`, id: null, ciudad, quitar: false }]);
              }}
            />
            <VozSecundaria texto={t('taller.ciudadFaltante')} />
          </View>

          {/* ── vacaciones (celda-puente; el motor D-341 intacto) ── */}
          <Tarjeta relleno="ninguno">
            <Celda
              interactiva
              accessibilityRole="button"
              titulo={t('negocio.vacaciones')}
              subtitulo={t('negocio.vacacionesDetalle')}
              onPress={() => router.push('/vacaciones')}
            />
          </Tarjeta>

          {/* ── el espejo del artesano — LA FIRMA: responde al borrador ── */}
          <EspejoOferta datos={datosEspejo} />

          <Boton
            variante="primario"
            etiqueta={t('taller.guardar')}
            bloque
            cargando={guardando}
            deshabilitado={!hayCambios}
            onPress={() => void guardarTodo()}
          />
        </ScrollView>
      )}

      {/* Hoja: nombre y descripción del bloque (edita el borrador) */}
      <Hoja
        visible={hojaNombre}
        onCerrar={() => setHojaNombre(false)}
        titulo={etiquetaBloque(duracionSel)}
      >
        {d !== null && (
          <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            <Campo
              label={t('servicios.nombre')}
              value={d.nombre}
              onChangeText={(v) => actualizarDraft(duracionSel, { nombre: v })}
              ayuda={t('servicios.nombreAyuda')}
            />
            <Campo
              label={t('servicios.descripcion')}
              value={d.descripcion}
              onChangeText={(v) => actualizarDraft(duracionSel, { descripcion: v })}
            />
            <Boton variante="primario" etiqueta={t('taller.listo')} bloque onPress={() => setHojaNombre(false)} />
          </View>
        )}
      </Hoja>

      {/* Hoja: plan y paquete de un bloque (edita el borrador) */}
      <Hoja
        visible={hojaPlanPaquete !== null}
        onCerrar={() => setHojaPlanPaquete(null)}
        titulo={hojaPlanPaquete !== null ? etiquetaBloque(hojaPlanPaquete) : ''}
      >
        {hojaPlanPaquete !== null && drafts !== null && (
          <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            <Campo
              label={t('servicios.precioPlan')}
              value={drafts[hojaPlanPaquete].plan}
              onChangeText={(v) => {
                actualizarDraft(hojaPlanPaquete, { plan: v });
                setErrorPlan(undefined);
              }}
              keyboardType="decimal-pad"
              ayuda={t('servicios.precioPlanAyuda')}
              error={errorPlan}
            />
            <VozPorSalida
              pct={pct}
              texto={drafts[hojaPlanPaquete].plan}
              suelto={leerPrecio(drafts[hojaPlanPaquete].precio)}
              vozVacia={t('servicios.planVacio')}
              comparar={(s, v) => t('servicios.planComparacion', { suelto: s, plan: v })}
            />
            {/* presets 5/10/15 EN LETRA en la superficie de config (D-354) */}
            <VozSecundaria texto={t('servicios.paqueteExplica')} />
            <Campo
              label={t('servicios.precioPaquete')}
              value={drafts[hojaPlanPaquete].paquete}
              onChangeText={(v) => {
                actualizarDraft(hojaPlanPaquete, { paquete: v });
                setErrorPaquete(undefined);
              }}
              keyboardType="decimal-pad"
              ayuda={t('servicios.precioPaqueteAyuda')}
              error={errorPaquete}
            />
            <VozPorSalida
              pct={pct}
              texto={drafts[hojaPlanPaquete].paquete}
              suelto={leerPrecio(drafts[hojaPlanPaquete].precio)}
              vozVacia={t('servicios.paqueteVacio')}
              comparar={(s, v) => t('servicios.paqueteComparacion', { suelto: s, paquete: v })}
            />
            <Boton variante="primario" etiqueta={t('taller.listo')} bloque onPress={() => setHojaPlanPaquete(null)} />
          </View>
        )}
      </Hoja>

      {/* Hoja: editar franja del borrador — cupo (stepper pendiente), pausar, quitar */}
      <Hoja
        visible={franjaEnHoja !== null}
        onCerrar={() => setHojaFranja(null)}
        titulo={
          franjaEnHoja !== null
            ? `${vozDia(franjaEnHoja.diaSemana)} · ${franjaEnHoja.horaInicio} – ${franjaEnHoja.horaFin}`
            : ''
        }
      >
        {franjaEnHoja !== null && (
          <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
            {!confirmandoQuitar ? (
              <>
                <SelectorOpcion
                  etiqueta={t('horarios.cupo')}
                  acento="oficio"
                  opciones={[
                    { codigo: '1', etiqueta: '1' },
                    { codigo: '2', etiqueta: '2' },
                    { codigo: '3', etiqueta: '3' },
                    { codigo: '4', etiqueta: '4' },
                  ]}
                  seleccionada={cupoSel}
                  onSelect={setCupoSel}
                />
                <VozSecundaria texto={t('horarios.cupoAyuda')} />
                <Boton
                  variante="primario"
                  etiqueta={t('taller.listo')}
                  bloque
                  onPress={() => {
                    actualizarFranjaDraft(franjaEnHoja.key, { cupo: Number.parseInt(cupoSel, 10) });
                    setHojaFranja(null);
                  }}
                />
                <Boton
                  variante="ghost"
                  etiqueta={franjaEnHoja.activo ? t('horarios.pausar') : t('horarios.reactivar')}
                  bloque
                  onPress={() => {
                    actualizarFranjaDraft(franjaEnHoja.key, { activo: !franjaEnHoja.activo });
                    setHojaFranja(null);
                  }}
                />
                <Boton variante="destructivo" etiqueta={t('horarios.quitar')} bloque onPress={() => setConfirmandoQuitar(true)} />
              </>
            ) : (
              <>
                <Text
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.base,
                    lineHeight: typography.size.base * typography.leading.normal,
                    color: theme.text.secondary,
                  }}
                >
                  {t('horarios.quitarConfirmacion')}
                </Text>
                <Boton
                  variante="destructivo"
                  etiqueta={t('horarios.quitarConfirmar')}
                  bloque
                  onPress={() => {
                    if (franjaEnHoja.id === null) {
                      setFranjas((prev) => (prev === null ? prev : prev.filter((x) => x.key !== franjaEnHoja.key)));
                    } else {
                      actualizarFranjaDraft(franjaEnHoja.key, { quitar: true });
                    }
                    setHojaFranja(null);
                    setConfirmandoQuitar(false);
                  }}
                />
                <Boton variante="ghost" etiqueta={t('horarios.cancelar')} bloque onPress={() => setConfirmandoQuitar(false)} />
              </>
            )}
          </View>
        )}
      </Hoja>

      {/* Hoja: nueva franja — el día lo eligió la píldora (Chanel: el
          sub-selector de día de /horarios MURIÓ con la tira a la vista) */}
      <Hoja
        visible={creandoFranja}
        onCerrar={() => setCreandoFranja(false)}
        titulo={vistaNueva === 'form' ? `${t('horarios.nuevaTitulo')} · ${vozDia(diaSel)}` : t('horarios.horaElegir')}
        altura="media"
      >
        {vistaNueva === 'form' ? (
          <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
            <Tarjeta relleno="ninguno">
              <Celda
                interactiva
                accessibilityRole="button"
                titulo={t('horarios.desde')}
                metadataMono={desdeSel ?? undefined}
                subtitulo={desdeSel === null ? t('horarios.horaElegir') : undefined}
                onPress={() => setVistaNueva('desde')}
              />
              <Separador />
              <Celda
                interactiva
                accessibilityRole="button"
                titulo={t('horarios.hasta')}
                metadataMono={hastaSel ?? undefined}
                subtitulo={hastaSel === null ? t('horarios.horaElegir') : undefined}
                onPress={() => setVistaNueva('hasta')}
              />
            </Tarjeta>
            <SelectorOpcion
              etiqueta={t('horarios.cupo')}
              acento="oficio"
              opciones={[
                { codigo: '1', etiqueta: '1' },
                { codigo: '2', etiqueta: '2' },
                { codigo: '3', etiqueta: '3' },
                { codigo: '4', etiqueta: '4' },
              ]}
              seleccionada={cupoSel}
              onSelect={setCupoSel}
            />
            <VozSecundaria texto={t('horarios.cupoAyuda')} />
            <Boton
              variante="primario"
              etiqueta={t('taller.agregarFranjaListo')}
              bloque
              deshabilitado={desdeSel === null || hastaSel === null}
              onPress={agregarFranjaDraft}
            />
          </View>
        ) : (
          <HojaScroll>
            {HORAS.filter((h) => (vistaNueva === 'hasta' && desdeSel !== null ? h > desdeSel : true)).map((h, i) => (
              <View key={h}>
                {i > 0 && <Separador />}
                <Celda
                  interactiva
                  accessibilityRole="button"
                  titulo={h}
                  onPress={() => {
                    if (vistaNueva === 'desde') {
                      setDesdeSel(h);
                      if (hastaSel !== null && hastaSel <= h) setHastaSel(null);
                    } else {
                      setHastaSel(h);
                    }
                    setVistaNueva('form');
                  }}
                />
              </View>
            ))}
          </HojaScroll>
        )}
      </Hoja>
    </View>
  );
}
