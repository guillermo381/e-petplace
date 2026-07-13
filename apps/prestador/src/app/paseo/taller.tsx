/**
 * EL ARTE DEL PASEO v3 — WIZARD DE SECCIONES (S58-B, firma founder).
 * TRES pasos + resumen la primera vez (entrada: "Configurar tu oficio");
 * las MISMAS pantallas como secciones sueltas desde los lápices de la
 * portada (paso = sección = editor). El BORRADOR y el GUARDADO ÚNICO
 * quedan intactos: nada persiste hasta "Guardar tu oferta"; el guardado
 * aplica el diff en secuencia por la puerta única y cada éxito
 * actualiza su base (fallo parcial deja el resto dirty y reintentable —
 * RPC atómica de oferta = pedido a la A anotado).
 *
 * TESIS: "Todo tu oficio de paseo se gobierna en un solo lugar — lo
 * ajustas y lo guardas UNA vez." FIRMA: el espejo del artesano responde
 * EN VIVO al borrador en cada paso/sección.
 *
 * Paso 1 — DURACIONES: cada duración ofrecida es una TARJETA APILADA
 *   visible (Interruptor + SliderPrecio + neto + plan y paquete por
 *   salida). El gating por chip MURIÓ. El "+" agrega del menú canónico.
 *   Nombre/descripción: FUERA de la UI (relevamiento L-144: el motor
 *   los sirve al dueño vía COALESCE(nombre_custom, ts.nombre) — la
 *   columna QUEDA; su edición muda al perfil del prestador = deuda
 *   declarada en el reporte).
 * Paso 2 — HORARIOS: 7 días con LETRA SOLA en MULTI-selección (contrato
 *   `multiple` de SelectorOpcion, S56 — cero invento); la franja nueva
 *   (horas + cupo StepperCantidad) aplica a los días marcados; atajo
 *   "Toda la semana". La lista agrupa franjas idénticas y la edición
 *   DICE a qué días pertenece.
 * Paso 3 — ZONAS: país propio como chips + puerta "Otra ciudad" (v2.1).
 *
 * Letra: DISEÑO_EXPERIENCIA §15b v1.5 · FINANCIERO v2.7 7.13/7.15 (neto
 * SIEMPRE de fee_configs) · PASEO v1.4 §2 (menú canónico en CHECK) ·
 * D-354 (presets del paquete EN LETRA). Regla 32: 0=Domingo a DB sin
 * transformaciones. Dosis baja: acento de oficio, CTA en tinta.
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
  StepperCantidad,
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
  obtenerPaisesActivos,
  obtenerZonasDePrestador,
  quitarZonaCobertura,
  type BloquePaseo,
  type CiudadCatalogo,
  type FranjaHorario,
  type OfertaPaseoPropia,
  type PaisActivo,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { EspejoOferta } from '@/components/espejo-oferta';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | {
      estado: 'listo';
      prestadorId: string;
      countryCode: string;
      cuentaActiva: boolean | null;
      comisionPct: number | null;
    };

type Seccion = 'duraciones' | 'horarios' | 'zonas';
const PASOS: readonly Seccion[] = ['duraciones', 'horarios', 'zonas'];

interface DraftOferta {
  base: OfertaPaseoPropia | null;
  ofrecida: boolean;
  precio: string;
  plan: string;
  paquete: string;
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

// zonas v1 DECLARATIVA (contrato D-331: declara, no filtra)
interface DraftZona {
  key: string;
  id: string | null;
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

// el riel del precio: pasos de $0.25 (§15b.5a); techo $40 estirable
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

// el SUGERIDO al encender plan (90%) o paquete (85%): del precio suelto
// de ESA duración, redondeado al paso del riel — jamás un campo vacío
function sugerido(precioTexto: string, factor: number): string {
  const p = Number.parseFloat(precioTexto.replace(',', '.'));
  const base = Number.isFinite(p) && p > 0 ? p : 5;
  const v = Math.max(PASO_PRECIO, Math.round((base * factor) / PASO_PRECIO) * PASO_PRECIO);
  return v.toFixed(2);
}

function leerPrecio(texto: string): number | null {
  const v = Number.parseFloat(texto.replace(',', '.'));
  if (!Number.isFinite(v) || v <= 0) return null;
  return Math.round(v * 100) / 100;
}

// Plan y paquete: vacío = SIN oferta (null honesto) · número · inválido
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
      }
    : { base: null, ofrecida: false, precio: '', plan: '', paquete: '' };
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

// nombre/descripción quedaron FUERA del diff (edición mudada al perfil
// del prestador — deuda declarada; el guardado no las toca)
function ofertaDirty(d: DraftOferta): boolean {
  if (d.base === null) return d.ofrecida;
  const precio = leerPrecio(d.precio);
  const plan = leerPorSalida(d.plan);
  const paquete = leerPorSalida(d.paquete);
  return (
    d.ofrecida !== d.base.activo ||
    (precio !== null && precio !== d.base.precio) ||
    (plan !== 'invalido' && plan !== d.base.precioPlan) ||
    (paquete !== 'invalido' && paquete !== d.base.precioPaquete)
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

export default function TallerPaseo() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const { seccion, modo } = useLocalSearchParams<{ seccion?: string; modo?: string }>();

  const modoWizard = modo === 'wizard';
  const seccionParam: Seccion =
    seccion === 'horarios' ? 'horarios' : seccion === 'zonas' ? 'zonas' : 'duraciones'; // 'planes' = alias

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);
  const [paso, setPaso] = useState(0);
  // la validación puede forzar la sección con el error (modo edición)
  const [seccionForzada, setSeccionForzada] = useState<Seccion | null>(null);
  const seccionVisible: Seccion = modoWizard ? PASOS[paso] : (seccionForzada ?? seccionParam);

  // EL BORRADOR — sobrevive a reintentos de guardado (guardado único)
  const [drafts, setDrafts] = useState<Record<BloquePaseo, DraftOferta> | null>(null);
  const [franjas, setFranjas] = useState<DraftFranja[] | null>(null);
  const [zonas, setZonas] = useState<DraftZona[] | null>(null);
  const [ciudades, setCiudades] = useState<CiudadCatalogo[]>([]);
  const [paises, setPaises] = useState<PaisActivo[]>([]);

  // Hojas
  const [hojaAgregarDuracion, setHojaAgregarDuracion] = useState(false);
  const [hojaGrupo, setHojaGrupo] = useState<string[] | null>(null); // keys del grupo de franjas
  const [confirmandoQuitar, setConfirmandoQuitar] = useState(false);
  const [creandoFranja, setCreandoFranja] = useState(false);
  const [vistaNueva, setVistaNueva] = useState<'form' | 'desde' | 'hasta'>('form');
  const [desdeSel, setDesdeSel] = useState<string | null>(null);
  const [hastaSel, setHastaSel] = useState<string | null>(null);
  const [cupoSel, setCupoSel] = useState(1);
  const [hojaOtraCiudad, setHojaOtraCiudad] = useState(false);

  // Paso 1 (v3.1, boceto founder): el CHIP gobierna el bloque — la
  // duración elegida; cambiar de chip CONSERVA el borrador de cada una
  const [duracionSel, setDuracionSel] = useState<BloquePaseo | null>(null);
  // Paso 2: los días marcados para la PRÓXIMA franja (multi-selección)
  const [diasSel, setDiasSel] = useState<number[]>([]);

  const [guardando, setGuardando] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const contadorNuevas = useRef(0);

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
      const [rOfertas, rFranjas, rZonas, rCiudades, rPaises, rCuenta, rComision] = await Promise.all([
        obtenerOfertasPaseoPropias(prestador.data.id),
        obtenerFranjasHorario(prestador.data.id),
        obtenerZonasDePrestador(prestador.data.id),
        obtenerCatalogoCiudades(),
        obtenerPaisesActivos(),
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
      const primeraOfrecida = BLOQUES_PASEO.find((b) => iniciales[b].ofrecida || iniciales[b].base !== null);
      setDuracionSel(primeraOfrecida ?? null);
      setFranjas(rFranjas.data.map(draftDesdeFranja));
      setZonas(rZonas.data.map((z) => ({ key: z.id, id: z.id, ciudad: z.ciudad, quitar: false })));
      setCiudades(rCiudades.ok ? rCiudades.data : []);
      setPaises(rPaises.ok ? rPaises.data : []);
      setPantalla({
        estado: 'listo',
        prestadorId: prestador.data.id,
        countryCode: prestador.data.country_code,
        cuentaActiva: rCuenta.ok ? rCuenta.data?.estado === 'activa' : null,
        comisionPct: rComision.ok ? rComision.data.porcentaje : null,
      });
    })();
    return () => {
      vigente = false;
    };
  }, [intento]);

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
  const letraDia = (dia: number): string => t(`taller.diaCorto${dia as 0 | 1 | 2 | 3 | 4 | 5 | 6}` as const);
  const vozCupo = (cupo: number): string =>
    cupo === 1 ? t('horarios.cupoUno') : t('horarios.cupoVarios', { cantidad: cupo });

  const actualizarDraft = (b: BloquePaseo, cambios: Partial<DraftOferta>) => {
    setDrafts((prev) => (prev === null ? prev : { ...prev, [b]: { ...prev[b], ...cambios } }));
  };
  const actualizarFranjas = (keys: string[], cambios: Partial<DraftFranja>) => {
    setFranjas((prev) => (prev === null ? prev : prev.map((f) => (keys.includes(f.key) ? { ...f, ...cambios } : f))));
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

  // el riel del precio — techo estable desde las ofertas GUARDADAS
  const pasos = useMemo(() => {
    const techoBase = drafts === null ? 0 : Math.max(0, ...BLOQUES_PASEO.map((b) => drafts[b].base?.precio ?? 0));
    return pasosPrecio(techoBase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts === null]);
  const etiquetasPasos = useMemo(() => pasos.map(monto), [pasos]);
  // el PLAN se muestra EN MENSUAL (corrección founder S58): mes típico de
  // 4 salidas → mismo riel, etiquetas ×4 (paso visible $1). El CONTRATO
  // sigue POR SALIDA (7.14): se guarda pasos[i], jamás el mensual.
  const etiquetasMes = useMemo(() => pasos.map((p) => monto(p * 4)), [pasos]);
  const indicePrecio = (texto: string): number => {
    const v = leerPrecio(texto);
    if (v === null) return Math.round(5 / PASO_PRECIO) - 1;
    return Math.min(Math.max(Math.round(v / PASO_PRECIO) - 1, 0), pasos.length - 1);
  };

  // el espejo VIVO — la firma: deriva del borrador entero en cada paso
  const datosEspejo = useMemo(() => {
    const ofrecidas = drafts === null ? [] : BLOQUES_PASEO.filter((b) => drafts[b].ofrecida && leerPrecio(drafts[b].precio) !== null);
    const precios = drafts === null ? [] : ofrecidas.map((b) => leerPrecio(drafts[b].precio) as number);
    const diasActivos = franjas === null ? [] : ORDEN_DISPLAY.filter((d) => franjas.some((f) => f.diaSemana === d && f.activo && !f.quitar));
    return {
      duraciones: ofrecidas.map(etiquetaCorta),
      desde: precios.length > 0 ? Math.min(...precios) : null,
      conPlan: drafts !== null && ofrecidas.some((b) => typeof leerPorSalida(drafts[b].plan) === 'number'),
      conPaquete: drafts !== null && ofrecidas.some((b) => typeof leerPorSalida(drafts[b].paquete) === 'number'),
      dias: diasActivos.map(vozDia),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts, franjas, t]);

  // grupos de franjas: idénticas en horas+cupo+estado se muestran como UNA
  // (la edición dice a qué días pertenece — mandato v3)
  const grupos = useMemo(() => {
    const vivas = (franjas ?? []).filter((f) => !f.quitar);
    const porClave = new Map<string, DraftFranja[]>();
    for (const f of vivas) {
      const clave = `${f.horaInicio}|${f.horaFin}|${f.cupo}|${f.activo}`;
      porClave.set(clave, [...(porClave.get(clave) ?? []), f]);
    }
    return [...porClave.values()].sort((a, b) => a[0].horaInicio.localeCompare(b[0].horaInicio));
  }, [franjas]);

  const diasDeGrupo = (miembros: DraftFranja[]): string =>
    ORDEN_DISPLAY.filter((d) => miembros.some((f) => f.diaSemana === d))
      .map(letraDia)
      .join(' · ');

  function agregarFranjasDraft() {
    if (franjas === null || desdeSel === null || hastaSel === null || diasSel.length === 0) return;
    // solape local por CADA día marcado (el wrapper re-valida al guardar);
    // se chequea TODO antes de agregar — jamás un alta parcial
    for (const dia of diasSel) {
      const solapa = franjas.some(
        (f) => f.diaSemana === dia && !f.quitar && desdeSel < f.horaFin && f.horaInicio < hastaSel,
      );
      if (solapa) {
        mostrar({ texto: `${vozDia(dia)}: ${t('horarios.solape')}`, variante: 'error' });
        return;
      }
    }
    const nuevas: DraftFranja[] = diasSel.map((dia) => {
      contadorNuevas.current += 1;
      return {
        key: `nueva-${contadorNuevas.current}`,
        id: null,
        diaSemana: dia,
        horaInicio: desdeSel,
        horaFin: hastaSel,
        cupo: cupoSel,
        activo: true,
        quitar: false,
        baseCupo: null,
        baseActivo: null,
      };
    });
    setFranjas([...franjas, ...nuevas]);
    setCreandoFranja(false);
  }

  // EL GUARDADO ÚNICO — el diff entero en secuencia (intacto de v2)
  async function guardarTodo() {
    if (guardando || drafts === null || franjas === null || zonas === null || pantalla.estado !== 'listo') return;

    // v3.2: plan y paquete son sliders — el inválido es imposible por
    // diseño (la validación por texto MURIÓ con los campos)
    setGuardando(true);
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
        actualizarFranjas([f.key], { baseCupo: f.cupo, baseActivo: f.activo });
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
            texto: r.codigo === 'franja_solapada' ? `${vozDia(f.diaSemana)}: ${t('horarios.solape')}` : r.mensaje,
            variante: 'error',
          });
          return;
        }
        actualizarFranjas([f.key], { id: r.data.id, baseCupo: r.data.maxCitasPorSlot, baseActivo: r.data.activo });
      }
    }

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

  const bloquesConCard = drafts === null ? [] : BLOQUES_PASEO.filter((b) => drafts[b].ofrecida || drafts[b].base !== null);
  const bloquesDisponibles = drafts === null ? [] : BLOQUES_PASEO.filter((b) => !bloquesConCard.includes(b));
  const grupoEnHoja = hojaGrupo === null ? null : (franjas ?? []).filter((f) => hojaGrupo.includes(f.key));

  const alAtras = () => {
    if (modoWizard && paso > 0) {
      // atrás conserva el borrador: solo retrocede el paso
      setPaso(paso - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/paseo');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('taller.titulo')} atras onAtras={alAtras} />

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
                  setZonas(null);
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        </View>
      )}

      {listo && drafts !== null && (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10], gap: spacing[5] }}
        >
          {/* progreso del wizard — visible y sereno */}
          {modoWizard && <VozSecundaria texto={t('taller.paso', { n: paso + 1 })} />}

          {pantalla.estado === 'listo' && pantalla.cuentaActiva === false && seccionVisible === 'duraciones' && (
            <VozSecundaria texto={t('servicios.cuentaNoActiva')} />
          )}

          {/* ══ PASO/SECCIÓN 1 — duraciones y precios (tarjetas apiladas) ══ */}
          {seccionVisible === 'duraciones' && (
            <View style={{ gap: spacing[4] }}>
              <TituloBloque texto={t('taller.duracionesTitulo')} />
              {/* S59-B1 cura de copy (founder): la sección abre con SU letra
                  — duracionesIntro (el copy del paquete que vivía acá en
                  S58.3/.4 ya había bajado a su interruptor en v3.2). Con
                  chips visibles la intro ES la etiqueta del grupo
                  (SelectorOpcion exige label visible): el heading
                  "Duraciones y precios" queda UNO — el título de sección. */}
              {bloquesConCard.length === 0 && (
                <>
                  <VozSecundaria texto={t('taller.duracionesIntro')} />
                  <VozSecundaria texto={t('taller.sinDuraciones')} />
                </>
              )}
              {/* v3.1 (boceto firmado founder): EL CHIP GOBIERNA EL BLOQUE —
                  chips tonales de las duraciones ofrecidas + UN bloque con
                  TODA la config de la elegida (las tarjetas apiladas
                  MURIERON — eran letra del arquitecto, corregida). Cambiar
                  de chip conserva el borrador de cada duración. */}
              {bloquesConCard.length > 0 && (
                <SelectorOpcion
                  etiqueta={t('taller.duracionesIntro')}
                  disposicion="grilla"
                  acento="oficio"
                  opciones={bloquesConCard.map((b) => ({ codigo: String(b), etiqueta: etiquetaCorta(b) }))}
                  seleccionada={duracionSel !== null ? String(duracionSel) : undefined}
                  onSelect={(codigo) => setDuracionSel(Number.parseInt(codigo, 10) as BloquePaseo)}
                />
              )}
              {duracionSel !== null && bloquesConCard.includes(duracionSel) && (() => {
                const b = duracionSel;
                const d = drafts[b];
                return (
                  <Tarjeta elevacion="reposo">
                    <View style={{ gap: spacing[4] }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] }}>
                        <Text
                          style={{
                            fontFamily: typography.family.sans.medium,
                            fontSize: typography.size.md,
                            color: theme.text.primary,
                          }}
                        >
                          {etiquetaBloque(b)}
                        </Text>
                        <Interruptor
                          etiqueta={`${t('taller.ofrecer')} · ${etiquetaCorta(b)}`}
                          registro="oficio"
                          encendido={d.ofrecida}
                          onCambio={(v) => {
                            if (!v && d.base === null) {
                              // un bloque que jamás se guardó se despide solo;
                              // el chip pasa al primero que quede
                              actualizarDraft(b, { ofrecida: false, precio: '', plan: '', paquete: '' });
                              const restantes = bloquesConCard.filter((x) => x !== b);
                              setDuracionSel(restantes.length > 0 ? restantes[0] : null);
                              return;
                            }
                            actualizarDraft(b, { ofrecida: v, precio: v && d.precio === '' ? '5.00' : d.precio });
                          }}
                        />
                      </View>
                      {!d.ofrecida ? (
                        <VozSecundaria texto={t('servicios.pausada')} />
                      ) : (
                        <>
                          {d.base === null && <VozSecundaria texto={t('taller.seOfreceAlGuardar')} />}
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
                            etiqueta={`${t('servicios.precio')} · ${etiquetaCorta(b)}`}
                            pasos={etiquetasPasos}
                            indice={indicePrecio(d.precio)}
                            onCambio={(i) => actualizarDraft(b, { precio: pasos[i].toFixed(2) })}
                            registro="aa"
                          />
                          <VozComision pct={pct} precio={leerPrecio(d.precio)} />

                          {/* ── PLAN por interruptor (v3.2: la regla del
                              teclado los alcanzó al fin; el contrato POR
                              SALIDA de 7.14 NO cambia — cambia la ropa).
                              El booleano ES el interruptor: el precio
                              existe solo encendido; el sugerido (90% del
                              suelto al paso $0.25) jamás es campo vacío ── */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] }}>
                            <Text
                              style={{
                                fontFamily: typography.family.sans.regular,
                                fontSize: typography.size.base,
                                color: theme.text.primary,
                              }}
                            >
                              {t('taller.planInterruptor')}
                            </Text>
                            <Interruptor
                              etiqueta={t('taller.planInterruptor')}
                              registro="oficio"
                              encendido={d.plan !== ''}
                              onCambio={(v) => actualizarDraft(b, { plan: v ? sugerido(d.precio, 0.9) : '' })}
                            />
                          </View>
                          {d.plan !== '' && (
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
                                  {t('taller.planRotulo')}
                                </Text>
                                <Text
                                  style={{
                                    fontFamily: typography.family.mono.regular,
                                    fontSize: typography.size.lg,
                                    fontVariant: ['tabular-nums'],
                                    color: theme.text.primary,
                                  }}
                                >
                                  {etiquetasMes[indicePrecio(d.plan)]}
                                </Text>
                              </View>
                              <SliderPrecio
                                etiqueta={t('taller.planRotulo')}
                                pasos={etiquetasMes}
                                indice={indicePrecio(d.plan)}
                                onCambio={(i) => actualizarDraft(b, { plan: pasos[i].toFixed(2) })}
                                registro="aa"
                              />
                              <VozComision pct={pct} precio={(leerPrecio(d.plan) ?? 0) * 4} />
                              {/* la línea VIVA invertida: el contrato sigue POR
                                  SALIDA (7.14) — acá se declara la equivalencia */}
                              <VozSecundaria
                                texto={t('taller.planEquivale', { salida: monto(leerPrecio(d.plan) ?? 0) })}
                              />
                            </>
                          )}
                          {d.base?.precioPlan != null && (
                            // editar o quitar un plan GUARDADO: la voz de
                            // renovación de siempre
                            <VozSecundaria texto={t('servicios.precioPlanAyuda')} />
                          )}

                          {/* ── PAQUETE por interruptor — sugerido 85%;
                              los presets 5/10/15 EN LETRA viven ACÁ (la
                              intro de sección murió, punto 3) ── */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] }}>
                            <Text
                              style={{
                                fontFamily: typography.family.sans.regular,
                                fontSize: typography.size.base,
                                color: theme.text.primary,
                              }}
                            >
                              {t('taller.paqueteInterruptor')}
                            </Text>
                            <Interruptor
                              etiqueta={t('taller.paqueteInterruptor')}
                              registro="oficio"
                              encendido={d.paquete !== ''}
                              onCambio={(v) => actualizarDraft(b, { paquete: v ? sugerido(d.precio, 0.85) : '' })}
                            />
                          </View>
                          {d.paquete !== '' && (
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
                                  {t('taller.paqueteRotulo')}
                                </Text>
                                <Text
                                  style={{
                                    fontFamily: typography.family.mono.regular,
                                    fontSize: typography.size.lg,
                                    fontVariant: ['tabular-nums'],
                                    color: theme.text.primary,
                                  }}
                                >
                                  {etiquetasPasos[indicePrecio(d.paquete)]}
                                </Text>
                              </View>
                              <SliderPrecio
                                etiqueta={t('taller.paqueteRotulo')}
                                pasos={etiquetasPasos}
                                indice={indicePrecio(d.paquete)}
                                onCambio={(i) => actualizarDraft(b, { paquete: pasos[i].toFixed(2) })}
                                registro="aa"
                              />
                              <VozComision pct={pct} precio={leerPrecio(d.paquete)} />
                              <VozSecundaria texto={t('servicios.paqueteExplica')} />
                            </>
                          )}
                          {d.base?.precioPaquete != null && (
                            <VozSecundaria texto={t('servicios.precioPaqueteAyuda')} />
                          )}
                        </>
                      )}
                    </View>
                  </Tarjeta>
                );
              })()}
              {bloquesDisponibles.length > 0 && (
                <Boton
                  variante="secundario"
                  etiqueta={t('taller.agregarDuracion')}
                  bloque
                  onPress={() => setHojaAgregarDuracion(true)}
                />
              )}
            </View>
          )}

          {/* ══ PASO/SECCIÓN 2 — días y horarios (multi-selección) ══ */}
          {seccionVisible === 'horarios' && (
            <View style={{ gap: spacing[3] }}>
              <TituloBloque texto={t('taller.horariosTitulo')} />
              <VozSecundaria texto={t('taller.horariosExplica')} />
              <SelectorOpcion
                etiqueta={t('taller.dias')}
                disposicion="fila"
                acento="oficio"
                multiple
                opciones={ORDEN_DISPLAY.map((dia) => ({ codigo: String(dia), etiqueta: letraDia(dia) }))}
                seleccionadas={diasSel.map(String)}
                onSelect={(codigo) => {
                  const dia = Number.parseInt(codigo, 10);
                  setDiasSel((prev) => (prev.includes(dia) ? prev.filter((x) => x !== dia) : [...prev, dia]));
                }}
              />
              <Boton
                variante="ghost"
                etiqueta={t('taller.todaLaSemana')}
                onPress={() => setDiasSel([...ORDEN_DISPLAY])}
              />
              <Boton
                variante="secundario"
                etiqueta={t('horarios.agregarFranja')}
                bloque
                deshabilitado={diasSel.length === 0}
                onPress={() => {
                  setCreandoFranja(true);
                  setVistaNueva('form');
                  setDesdeSel(null);
                  setHastaSel(null);
                  setCupoSel(1);
                }}
              />
              {grupos.length === 0 ? (
                <VozSecundaria texto={t('taller.sinFranjas')} />
              ) : (
                <Tarjeta relleno="ninguno">
                  {grupos.map((miembros, i) => {
                    const f = miembros[0];
                    const partes = [diasDeGrupo(miembros)];
                    if (!f.activo) partes.push(t('horarios.pausada'));
                    if (miembros.some((x) => x.id === null)) partes.push(t('taller.franjaNueva'));
                    return (
                      <View key={f.key}>
                        {i > 0 && <Separador />}
                        <Celda
                          interactiva
                          accessibilityRole="button"
                          titulo={vozCupo(f.cupo)}
                          subtitulo={partes.join(' · ')}
                          metadataMono={`${f.horaInicio} – ${f.horaFin}`}
                          onPress={() => {
                            setHojaGrupo(miembros.map((x) => x.key));
                            setCupoSel(f.cupo);
                            setConfirmandoQuitar(false);
                          }}
                        />
                      </View>
                    );
                  })}
                </Tarjeta>
              )}
              {/* vacaciones — la celda-puente vive con los horarios (§15b.5a) */}
              <Tarjeta relleno="ninguno">
                <Celda
                  interactiva
                  accessibilityRole="button"
                  titulo={t('negocio.vacaciones')}
                  subtitulo={t('negocio.vacacionesDetalle')}
                  onPress={() => router.push('/vacaciones')}
                />
              </Tarjeta>
            </View>
          )}

          {/* ══ PASO/SECCIÓN 3 — zonas de cobertura ══ */}
          {seccionVisible === 'zonas' && (
            <View style={{ gap: spacing[3] }}>
              <TituloBloque texto={t('taller.zonasTitulo')} />
              <VozSecundaria texto={t('taller.zonasExplica')} />
              <SelectorOpcion
                etiqueta={t('taller.zonasTitulo')}
                disposicion="grilla"
                acento="oficio"
                multiple
                opciones={ciudades
                  .filter(
                    (c) =>
                      (pantalla.estado === 'listo' && c.country_code === pantalla.countryCode) ||
                      (zonas ?? []).some((z) => !z.quitar && z.ciudad.id === c.id),
                  )
                  .map((c) => ({ codigo: c.id, etiqueta: c.nombre }))}
                seleccionadas={(zonas ?? []).filter((z) => !z.quitar).map((z) => z.ciudad.id)}
                onSelect={(ciudadId) => {
                  if (zonas === null) return;
                  const vigente = zonas.find((z) => z.ciudad.id === ciudadId && !z.quitar);
                  if (vigente) {
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
              <Boton variante="ghost" etiqueta={t('taller.otraCiudad')} bloque onPress={() => setHojaOtraCiudad(true)} />
              <VozSecundaria texto={t('taller.ciudadFaltante')} />
            </View>
          )}

          {/* el espejo del artesano — LA FIRMA, en cada paso y sección */}
          <EspejoOferta datos={datosEspejo} />

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

      {/* Hoja: ofrecer otra duración — el menú canónico restante */}
      <Hoja
        visible={hojaAgregarDuracion}
        onCerrar={() => setHojaAgregarDuracion(false)}
        titulo={t('taller.agregarDuracion')}
        altura="media"
      >
        <HojaScroll>
          {bloquesDisponibles.map((b, i) => (
            <View key={b}>
              {i > 0 && <Separador />}
              <Celda
                interactiva
                accessibilityRole="button"
                titulo={etiquetaBloque(b)}
                onPress={() => {
                  actualizarDraft(b, { ofrecida: true, precio: '5.00' });
                  setDuracionSel(b); // el chip nuevo toma el gobierno
                  setHojaAgregarDuracion(false);
                }}
              />
            </View>
          ))}
        </HojaScroll>
      </Hoja>

      {/* Hoja: grupo de franjas — DICE a qué días pertenece (v3) */}
      <Hoja
        visible={grupoEnHoja !== null && grupoEnHoja.length > 0}
        onCerrar={() => setHojaGrupo(null)}
        titulo={
          grupoEnHoja !== null && grupoEnHoja.length > 0
            ? `${grupoEnHoja[0].horaInicio} – ${grupoEnHoja[0].horaFin}`
            : ''
        }
      >
        {grupoEnHoja !== null && grupoEnHoja.length > 0 && (
          <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
            <VozSecundaria texto={t('taller.diasAplica', { dias: diasDeGrupo(grupoEnHoja) })} />
            {!confirmandoQuitar ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] }}>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.base,
                      color: theme.text.primary,
                    }}
                  >
                    {t('horarios.cupo')}
                  </Text>
                  <StepperCantidad
                    etiqueta={t('horarios.cupo')}
                    registro="oficio"
                    valor={cupoSel}
                    min={1}
                    max={4}
                    onCambio={setCupoSel}
                  />
                </View>
                <VozSecundaria texto={t('horarios.cupoAyuda')} />
                <Boton
                  variante="primario"
                  etiqueta={t('taller.listo')}
                  bloque
                  onPress={() => {
                    actualizarFranjas(grupoEnHoja.map((f) => f.key), { cupo: cupoSel });
                    setHojaGrupo(null);
                  }}
                />
                <Boton
                  variante="ghost"
                  etiqueta={grupoEnHoja[0].activo ? t('horarios.pausar') : t('horarios.reactivar')}
                  bloque
                  onPress={() => {
                    actualizarFranjas(grupoEnHoja.map((f) => f.key), { activo: !grupoEnHoja[0].activo });
                    setHojaGrupo(null);
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
                    const keys = grupoEnHoja.map((f) => f.key);
                    setFranjas((prev) =>
                      prev === null
                        ? prev
                        : prev
                            .filter((f) => !(keys.includes(f.key) && f.id === null))
                            .map((f) => (keys.includes(f.key) ? { ...f, quitar: true } : f)),
                    );
                    setHojaGrupo(null);
                    setConfirmandoQuitar(false);
                  }}
                />
                <Boton variante="ghost" etiqueta={t('horarios.cancelar')} bloque onPress={() => setConfirmandoQuitar(false)} />
              </>
            )}
          </View>
        )}
      </Hoja>

      {/* Hoja: OTRA CIUDAD — catálogo agrupado por país con nombre humano */}
      <Hoja visible={hojaOtraCiudad} onCerrar={() => setHojaOtraCiudad(false)} titulo={t('taller.otraCiudad')} altura="media">
        <HojaScroll>
          {paises.map((pais) => {
            const delPais = ciudades.filter(
              (c) => c.country_code === pais.codigo && !(zonas ?? []).some((z) => !z.quitar && z.ciudad.id === c.id),
            );
            if (delPais.length === 0) return null;
            return (
              <View key={pais.codigo} style={{ gap: spacing[2], paddingBottom: spacing[3] }}>
                <TituloBloque texto={pais.nombre} />
                <Tarjeta relleno="ninguno">
                  {delPais.map((c, i) => (
                    <View key={c.id}>
                      {i > 0 && <Separador />}
                      <Celda
                        interactiva
                        accessibilityRole="button"
                        titulo={c.nombre}
                        onPress={() => {
                          contadorNuevas.current += 1;
                          setZonas((prev) =>
                            prev === null
                              ? prev
                              : [...prev, { key: `zona-${contadorNuevas.current}`, id: null, ciudad: c, quitar: false }],
                          );
                          setHojaOtraCiudad(false);
                        }}
                      />
                    </View>
                  ))}
                </Tarjeta>
              </View>
            );
          })}
        </HojaScroll>
      </Hoja>

      {/* Hoja: nueva franja — aplica a los DÍAS MARCADOS (v3) */}
      <Hoja
        visible={creandoFranja}
        onCerrar={() => setCreandoFranja(false)}
        titulo={vistaNueva === 'form' ? t('horarios.nuevaTitulo') : t('horarios.horaElegir')}
        altura="media"
      >
        {vistaNueva === 'form' ? (
          <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
            <VozSecundaria
              texto={t('taller.diasAplica', { dias: ORDEN_DISPLAY.filter((d) => diasSel.includes(d)).map(letraDia).join(' · ') })}
            />
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] }}>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.base,
                  color: theme.text.primary,
                }}
              >
                {t('horarios.cupo')}
              </Text>
              <StepperCantidad
                etiqueta={t('horarios.cupo')}
                registro="oficio"
                valor={cupoSel}
                min={1}
                max={4}
                onCambio={setCupoSel}
              />
            </View>
            <VozSecundaria texto={t('horarios.cupoAyuda')} />
            <Boton
              variante="primario"
              etiqueta={t('taller.agregarFranjaListo')}
              bloque
              deshabilitado={desdeSel === null || hastaSel === null || diasSel.length === 0}
              onPress={agregarFranjasDraft}
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
