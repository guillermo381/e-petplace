/**
 * EL TALLER DE VETERINARIA — /veterinaria/taller (S68-B, P0/P1).
 *
 * TESIS: "Armas tu consultorio en minutos: prendes lo que ofreces y
 * cada servicio queda con su duración, su precio y su horario."
 * FIRMA: el menú de toggles del oficio — cada interruptor prendido
 * DESPLIEGA su config inline (comportamiento, no color; dosis baja).
 * CHANEL: cero espejo nuevo, cero sección de especies visible (el techo
 * lo declara el catálogo por tipo — no se le pregunta al vet lo que la
 * DB ya sabe).
 *
 * EL MENÚ (orden firmado S68): Cita regular · Vacunación · Cita
 * especializada · Urgencia en local · Urgencia a domicilio ·
 * Telemedicina. Defaults de duración = tipos_servicio.
 * duracion_default_minutos (DB viva, regla 21); pasos de 15'.
 * Telemedicina porta su voz honesta OBLIGATORIA (letra del pedido).
 * La especializada suma chips (6 del catálogo + "Otra" con Hoja de
 * texto libre) — su PERSISTENCIA espera el contrato de la migración de
 * la Sesión A (CONECTAR-A: ver wrapper veterinaria-oferta).
 *
 * HORARIOS (P1, B2): default sereno "usa tu horario general" en la fila
 * de cada servicio; la sección COMPARTIDA SeccionHorarios porta la
 * elección de modo D-386 (S62) — el primer horario propio de un
 * servicio pasa por esa elección, réplica día×servicio incluida.
 *
 * Guardado único por diff (mecánica grooming): urgencia en local y a
 * domicilio son DOS filas del tipo 'emergencia' distinguidas por
 * modalidad (atiende_*); el CHECK de DB exige una modalidad por fila.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  VozComision,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  MENU_VETERINARIA,
  TIPO_POR_ITEM,
  guardarEspecialidadesVeterinaria,
  guardarServicioVeterinaria,
  obtenerCatalogoEspecialidadesVet,
  obtenerCatalogoVeterinaria,
  obtenerComisionVigenteCita,
  obtenerEspecialidadesPrestador,
  obtenerFranjasDeServicios,
  obtenerFranjasHorario,
  obtenerMiCuentaComercial,
  obtenerMiPrestador,
  obtenerModoHorarios,
  obtenerMundoVeterinariaPropio,
  type EspecialidadCatalogo,
  type ItemMenuVeterinaria,
  type ModoHorarios,
  type OfertaVeterinariaPropia,
  type TipoVeterinariaCatalogo,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import {
  SeccionHorarios,
  aplicarDiffFranjas,
  draftDesdeFranja,
  franjaDirty,
  type DraftFranja,
  type OfertaParaHorarios,
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

// el riel del precio (pasos discretos, regla del teclado §15b) — rangos
// razonables SIN calibración founder (familia D-413, declarado)
const PASO_PRECIO = 0.5;
const PISO_PRECIO = 5;
const TECHO_PRECIO = 150;

// duración en pasos de 15' (letra del pedido); el default por servicio
// es DATO del catálogo (tipos_servicio.duracion_default_minutos)
const DURACIONES: number[] = [];
for (let d = 15; d <= 240; d += 15) DURACIONES.push(d);
const DURACION_FALLBACK = 60;

interface DraftItem {
  base: OfertaVeterinariaPropia | null;
  ofrecido: boolean;
  precio: string; // '' = jamás tocado → el piso del riel
  duracion: number;
}

function monto(valor: number): string {
  return `$${valor.toFixed(2)}`;
}

function leerPrecio(texto: string): number | null {
  const v = Number.parseFloat(texto.replace(',', '.'));
  if (!Number.isFinite(v) || v <= 0) return null;
  return Math.round(v * 100) / 100;
}

// la fila guardada que corresponde a cada ítem del menú — las urgencias
// comparten tipo 'emergencia' y se distinguen por MODALIDAD
function baseDeItem(item: ItemMenuVeterinaria, servicios: OfertaVeterinariaPropia[]): OfertaVeterinariaPropia | null {
  switch (item) {
    case 'cita_regular':
      return servicios.find((s) => s.tipoServicio === 'consulta_general') ?? null;
    case 'vacunacion':
      return servicios.find((s) => s.tipoServicio === 'vacunacion') ?? null;
    case 'telemedicina':
      return servicios.find((s) => s.tipoServicio === 'telemedicina') ?? null;
    case 'urgencia_local':
      return servicios.find((s) => s.tipoServicio === 'urgencia_local') ?? null;
    case 'urgencia_domicilio':
      return servicios.find((s) => s.tipoServicio === 'urgencia_domicilio') ?? null;
    case 'cita_especializada':
      // S68-B6: el comprable propio (A6); los chips van aparte al puente
      return servicios.find((s) => s.tipoServicio === 'consulta_especializada') ?? null;
  }
}

// la modalidad que se ESCRIBE por ítem (el CHECK exige una por fila);
// telemedicina lleva local=true SOLO por el CHECK — es virtual
function modalidadDeItem(item: ItemMenuVeterinaria): {
  atiendeLocal: boolean;
  atiendeDomicilio: boolean;
} {
  if (item === 'urgencia_domicilio') return { atiendeLocal: false, atiendeDomicilio: true };
  return { atiendeLocal: true, atiendeDomicilio: false };
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

export default function TallerVeterinaria() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const { seccion, modo, item } = useLocalSearchParams<{ seccion?: string; modo?: string; item?: string }>();

  const modoWizard = modo === 'wizard';
  const seccionParam: Seccion = seccion === 'horarios' ? 'horarios' : 'servicios';

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);
  const [paso, setPaso] = useState(0);
  const [seccionForzada, setSeccionForzada] = useState<Seccion | null>(null);
  const seccionVisible: Seccion = modoWizard ? PASOS[paso] : (seccionForzada ?? seccionParam);

  // EL BORRADOR (guardado único; sobrevive a reintentos de guardado)
  const [drafts, setDrafts] = useState<Record<ItemMenuVeterinaria, DraftItem> | null>(null);
  const [catalogo, setCatalogo] = useState<TipoVeterinariaCatalogo[] | null>(null);
  // la especializada (CONECTADO S68-B5): chips = ids del catálogo vivo
  // cat_especialidades_vet; "Otra" = nombres libres del puente. El diff
  // contra la base guardada viaja en el guardado único.
  const [catalogoEsp, setCatalogoEsp] = useState<EspecialidadCatalogo[] | null>(null);
  const [especialidadesSel, setEspecialidadesSel] = useState<string[]>([]);
  const [otras, setOtras] = useState<string[]>([]);
  const [espBase, setEspBase] = useState<{ ids: string[]; libres: string[] }>({ ids: [], libres: [] });
  const [hojaOtra, setHojaOtra] = useState(false);
  const [otraTexto, setOtraTexto] = useState('');
  // horarios (sección compartida + D-386)
  const [franjas, setFranjas] = useState<DraftFranja[] | null>(null);
  const [modoHorarios, setModoHorarios] = useState<ModoHorarios>('universal');
  const [ofertasHorarios, setOfertasHorarios] = useState<OfertaParaHorarios[]>([]);
  const [hojaDuracion, setHojaDuracion] = useState<ItemMenuVeterinaria | null>(null);
  const [guardando, setGuardando] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  // el ancla del lápiz del resumen: y de cada tarjeta del menú
  const posiciones = useRef<Partial<Record<ItemMenuVeterinaria, number>>>({});
  // S68-B7 (hallazgo founder: "quiero vacunación y me abren todos"):
  // con ?item= la tarjeta destino nace desplegada y las demás PLEGADAS;
  // sin ?item=, null = comportamiento de siempre (todas según su toggle)
  const [desplegadas, setDesplegadas] = useState<ItemMenuVeterinaria[] | null>(() =>
    typeof item === 'string' && (MENU_VETERINARIA as readonly string[]).includes(item)
      ? [item as ItemMenuVeterinaria]
      : null,
  );
  const estaDesplegada = (i: ItemMenuVeterinaria): boolean => desplegadas === null || desplegadas.includes(i);
  const desplegar = (i: ItemMenuVeterinaria) =>
    setDesplegadas((prev) => (prev === null || prev.includes(i) ? prev : [...prev, i]));

  const vozItem = (i: ItemMenuVeterinaria): string =>
    ({
      cita_regular: t('tallerVeterinaria.itemCitaRegular'),
      vacunacion: t('tallerVeterinaria.itemVacunacion'),
      cita_especializada: t('tallerVeterinaria.itemEspecializada'),
      urgencia_local: t('tallerVeterinaria.itemUrgenciaLocal'),
      urgencia_domicilio: t('tallerVeterinaria.itemUrgenciaDomicilio'),
      telemedicina: t('tallerVeterinaria.itemTelemedicina'),
    })[i];

  const duracionDefault = (i: ItemMenuVeterinaria, cat: TipoVeterinariaCatalogo[]): number =>
    cat.find((c) => c.codigo === TIPO_POR_ITEM[i])?.duracionDefaultMinutos ?? DURACION_FALLBACK;

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
      const [rCat, rMundo, rFranjas, rModo, rCuenta, rComision, rCatEsp, rEspPropias] = await Promise.all([
        obtenerCatalogoVeterinaria(),
        obtenerMundoVeterinariaPropio(prestador.data.id),
        obtenerFranjasHorario(prestador.data.id),
        obtenerModoHorarios(prestador.data.id),
        obtenerMiCuentaComercial(),
        obtenerComisionVigenteCita(),
        obtenerCatalogoEspecialidadesVet(),
        obtenerEspecialidadesPrestador(prestador.data.id),
      ]);
      if (!vigente) return;
      if (!rCat.ok || !rMundo.ok || !rFranjas.ok || !rModo.ok || !rCatEsp.ok || !rEspPropias.ok) {
        setPantalla({ estado: 'error' });
        return;
      }
      setCatalogoEsp(rCatEsp.data);
      const idsGuardados = rEspPropias.data
        .map((f) => f.especialidadId)
        .filter((v): v is string => v !== null);
      const libresGuardados = rEspPropias.data
        .map((f) => f.nombreLibre)
        .filter((v): v is string => v !== null);
      setEspecialidadesSel(idsGuardados);
      setOtras(libresGuardados);
      setEspBase({ ids: idsGuardados, libres: libresGuardados });
      const iniciales = {} as Record<ItemMenuVeterinaria, DraftItem>;
      for (const i of MENU_VETERINARIA) {
        const base = baseDeItem(i, rMundo.data.servicios);
        // la especializada sin fila guardada todavía: su tarjeta abre
        // con especialidades declaradas (la verdad del puente); con
        // fila (S68-B6), manda base.activo como en todo toggle
        const abierta = i === 'cita_especializada' && rEspPropias.data.length > 0;
        iniciales[i] = base
          ? { base, ofrecido: base.activo, precio: base.precio.toFixed(2), duracion: base.duracionMinutos ?? duracionDefault(i, rCat.data) }
          : { base: null, ofrecido: abierta, precio: '', duracion: duracionDefault(i, rCat.data) };
      }
      setDrafts(iniciales);
      setCatalogo(rCat.data);
      // D-386: las ofertas del oficio para la réplica día×servicio —
      // solo las GUARDADAS pueden portar franjas propias
      const ofertasVet: OfertaParaHorarios[] = MENU_VETERINARIA.flatMap((i) => {
        const base = baseDeItem(i, rMundo.data.servicios);
        return base ? [{ id: base.id, etiqueta: vozItem(i) }] : [];
      });
      setModoHorarios(rModo.data);
      setOfertasHorarios(ofertasVet);
      if (rModo.data === 'por_servicio' && ofertasVet.length > 0) {
        const rEsp = await obtenerFranjasDeServicios(
          prestador.data.id,
          ofertasVet.map((o) => o.id),
        );
        if (!vigente) return;
        if (!rEsp.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        setFranjas(rEsp.data.map((f) => draftDesdeFranja(f, f.servicioId)));
      } else {
        setFranjas(rFranjas.data.map((f) => draftDesdeFranja(f)));
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento]);

  const listo =
    pantalla.estado === 'listo' && drafts !== null && catalogo !== null && franjas !== null && catalogoEsp !== null;
  const pct = pantalla.estado === 'listo' ? pantalla.comisionPct : null;

  // el ancla del lápiz (?item=): al quedar listo, la tarjeta ya midió
  useEffect(() => {
    if (!listo || typeof item !== 'string') return;
    const y = posiciones.current[item as ItemMenuVeterinaria];
    if (y !== undefined) {
      const timer = setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y - spacing[4]), animated: false }), 0);
      return () => clearTimeout(timer);
    }
  }, [listo, item]);

  // S68-B7 (decisión founder del gate, asentada): el riel de VACUNACIÓN
  // arranca en $2 — muchas veterinarias no cobran la aplicación, solo
  // la vacuna. SOLO ese riel; el resto espera la calibración D-413.
  const pisoDe = (i: ItemMenuVeterinaria): number => (i === 'vacunacion' ? 2 : PISO_PRECIO);
  const rielDesde = (piso: number): number[] => {
    const pasos: number[] = [];
    for (let v = piso; v <= TECHO_PRECIO + 1e-9; v += PASO_PRECIO) pasos.push(Math.round(v * 100) / 100);
    return pasos;
  };
  const pasosPrecio = useMemo(() => rielDesde(PISO_PRECIO), []);
  const pasosVacunacion = useMemo(() => rielDesde(2), []);
  const pasosDe = (i: ItemMenuVeterinaria): number[] => (i === 'vacunacion' ? pasosVacunacion : pasosPrecio);
  const etiquetasPrecio = useMemo(() => pasosPrecio.map(monto), [pasosPrecio]);
  const etiquetasVacunacion = useMemo(() => pasosVacunacion.map(monto), [pasosVacunacion]);
  const etiquetasDe = (i: ItemMenuVeterinaria): string[] =>
    i === 'vacunacion' ? etiquetasVacunacion : etiquetasPrecio;
  const indicePrecio = (i: ItemMenuVeterinaria, texto: string): number => {
    const pasos = pasosDe(i);
    const v = leerPrecio(texto);
    if (v === null) return 0; // sin sugeridos: el piso del riel, visible
    const exacto = pasos.findIndex((p) => Math.abs(p - v) < 1e-9);
    if (exacto >= 0) return exacto;
    return Math.min(Math.max(Math.round((v - pisoDe(i)) / PASO_PRECIO), 0), pasos.length - 1);
  };
  const precioDe = (i: ItemMenuVeterinaria, d: DraftItem): number => leerPrecio(d.precio) ?? pisoDe(i);

  const actualizarItem = (i: ItemMenuVeterinaria, cambios: Partial<DraftItem>) => {
    setDrafts((prev) => (prev === null ? prev : { ...prev, [i]: { ...prev[i], ...cambios } }));
  };

  const itemDirty = (i: ItemMenuVeterinaria, d: DraftItem): boolean => {
    if (d.base === null) return d.ofrecido;
    return (
      d.ofrecido !== d.base.activo ||
      precioDe(i, d) !== d.base.precio ||
      d.duracion !== (d.base.duracionMinutos ?? DURACION_FALLBACK)
    );
  };

  // un ítem PERSISTE solo si su tipo ya vive en el catálogo — jamás un
  // código rebotado a ciegas (S68-B6: los 6 ítems del menú, completos)
  const tipoDisponible = (i: ItemMenuVeterinaria): boolean =>
    catalogo?.some((c) => c.codigo === TIPO_POR_ITEM[i]) ?? false;

  // el diff de las especialidades contra la base guardada del puente
  const mismoSet = (a: string[], b: string[]): boolean => a.length === b.length && a.every((x) => b.includes(x));
  const espDirty = !mismoSet(especialidadesSel, espBase.ids) || !mismoSet(otras, espBase.libres);

  const hayCambios = useMemo(() => {
    if (drafts === null || franjas === null) return false;
    return (
      MENU_VETERINARIA.some((i) => tipoDisponible(i) && itemDirty(i, drafts[i])) ||
      espDirty ||
      franjas.some(franjaDirty)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts, franjas, catalogo, especialidadesSel, otras, espBase]);

  // franjas propias de una oferta (para la voz de la fila Horario)
  const franjasDeOferta = (ofertaId: string | null): number =>
    ofertaId === null || franjas === null
      ? 0
      : franjas.filter((f) => f.servicioId === ofertaId && !f.quitar).length;

  // EL GUARDADO ÚNICO — diff en secuencia por la puerta única
  async function guardarTodo() {
    if (guardando || !listo || drafts === null || catalogo === null || franjas === null || pantalla.estado !== 'listo') return;
    setGuardando(true);
    for (const i of MENU_VETERINARIA) {
      if (!tipoDisponible(i)) continue;
      const d = drafts[i];
      if (!itemDirty(i, d)) continue;
      if (d.base === null && !d.ofrecido) continue;
      const tipo = TIPO_POR_ITEM[i];
      const cat = catalogo.find((c) => c.codigo === tipo);
      const r = await guardarServicioVeterinaria({
        prestadorId: pantalla.prestadorId,
        ofertaId: d.base?.id ?? null,
        tipoServicio: tipo,
        activo: d.ofrecido,
        precio: precioDe(i, d),
        duracionMinutos: d.duracion,
        ...modalidadDeItem(i),
        // el techo de especies lo declara el catálogo del tipo
        especies: cat?.especies ?? [],
      });
      if (!r.ok) {
        setGuardando(false);
        mostrar({ texto: r.mensaje, variante: 'error' });
        return;
      }
      actualizarItem(i, {
        base: r.data,
        ofrecido: r.data.activo,
        precio: r.data.precio.toFixed(2),
        duracion: r.data.duracionMinutos ?? d.duracion,
      });
    }

    // las especialidades — el diff del puente (CONECTADO S68-B5)
    if (espDirty) {
      const r = await guardarEspecialidadesVeterinaria({
        prestadorId: pantalla.prestadorId,
        especialidadIds: especialidadesSel,
        nombresLibres: otras,
      });
      if (!r.ok) {
        setGuardando(false);
        mostrar({ texto: r.mensaje, variante: 'error' });
        return;
      }
      const ids = r.data.map((f) => f.especialidadId).filter((v): v is string => v !== null);
      const libres = r.data.map((f) => f.nombreLibre).filter((v): v is string => v !== null);
      setEspecialidadesSel(ids);
      setOtras(libres);
      setEspBase({ ids, libres });
    }

    const rf = await aplicarDiffFranjas(pantalla.prestadorId, franjas);
    setFranjas(rf.franjas);
    if (!rf.ok) {
      setGuardando(false);
      mostrar({
        texto:
          rf.error.tipo === 'solape'
            ? `${t(`horarios.dia${rf.error.diaSemana as 0 | 1 | 2 | 3 | 4 | 5 | 6}` as const)}: ${t('horarios.solape')}`
            : rf.error.mensaje,
        variante: 'error',
      });
      return;
    }

    setGuardando(false);
    mostrar({ texto: t('taller.guardado'), variante: 'exito' });
    if (router.canGoBack()) router.back();
    else router.replace('/veterinaria');
  }

  const alAtras = () => {
    if (modoWizard && paso > 0) {
      setPaso(paso - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/veterinaria');
  };

  const irAHorarios = () => {
    if (modoWizard) setPaso(PASOS.indexOf('horarios'));
    else setSeccionForzada('horarios');
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('tallerVeterinaria.titulo')} atras onAtras={alAtras} />

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5], gap: spacing[4] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="45%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={120} />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={120} />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={120} />
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
                  setCatalogo(null);
                  setFranjas(null);
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        </View>
      )}

      {listo && drafts !== null && catalogo !== null && (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            padding: spacing[4],
            // safe-area (requisito duro S65): nada bajo la barra del sistema
            paddingBottom: spacing[10] + insets.bottom,
            gap: spacing[5],
          }}
        >
          {modoWizard && <VozSecundaria texto={t('tallerVeterinaria.paso', { n: paso + 1 })} />}

          {pantalla.estado === 'listo' && pantalla.cuentaActiva === false && seccionVisible === 'servicios' && (
            <VozSecundaria texto={t('servicios.cuentaNoActiva')} />
          )}

          {/* ══ PASO/SECCIÓN 1 — el menú del oficio ══ */}
          {seccionVisible === 'servicios' && (
            <View style={{ gap: spacing[4] }}>
              <TituloBloque texto={t('tallerVeterinaria.serviciosTitulo')} />
              <VozSecundaria texto={t('tallerVeterinaria.serviciosIntro')} />

              {MENU_VETERINARIA.map((i) => {
                const d = drafts[i];
                const esEspecializada = i === 'cita_especializada';
                const esTele = i === 'telemedicina';
                return (
                  <View key={i} onLayout={(e) => (posiciones.current[i] = e.nativeEvent.layout.y)}>
                    <Tarjeta elevacion="reposo">
                      <View style={{ gap: spacing[4] }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: spacing[3],
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: typography.family.sans.medium,
                              fontSize: typography.size.md,
                              color: theme.text.primary,
                            }}
                          >
                            {vozItem(i)}
                          </Text>
                          <Interruptor
                            etiqueta={`${t('tallerVeterinaria.ofrecerServicio')} · ${vozItem(i)}`}
                            registro="oficio"
                            encendido={d.ofrecido}
                            onCambio={(v) => {
                              actualizarItem(i, { ofrecido: v });
                              // prender un servicio plegado lo despliega
                              // (la config recién prendida tiene que verse)
                              if (v) desplegar(i);
                            }}
                          />
                        </View>

                        {/* la voz honesta de la telemedicina — OBLIGATORIA
                            (letra del pedido S68), visible con el toggle
                            en cualquier estado */}
                        {esTele && <VozSecundaria texto={t('tallerVeterinaria.telemedicinaHonesta')} />}

                        {!d.ofrecido ? (
                          d.base !== null && <VozSecundaria texto={t('servicios.pausada')} />
                        ) : !estaDesplegada(i) ? (
                          // plegada por ?item= — se abre con su porqué a
                          // un toque, nada se pierde (los borradores
                          // conservan su estado)
                          <View style={{ alignSelf: 'flex-start' }}>
                            <Boton
                              variante="compacto"
                              etiqueta={t('tallerVeterinaria.desplegar')}
                              onPress={() => desplegar(i)}
                            />
                          </View>
                        ) : (
                          <>
                            {d.base === null && tipoDisponible(i) && (
                              <VozSecundaria texto={t('taller.seOfreceAlGuardar')} />
                            )}

                            {/* especialidades: los chips del catálogo
                                VIVO (bilingüe) + "Otra" con texto libre
                                — persisten al puente en el guardado
                                único (CONECTADO S68-B5) */}
                            {esEspecializada && (
                              <>
                                <SelectorOpcion
                                  etiqueta={t('tallerVeterinaria.especialidades')}
                                  disposicion="grilla"
                                  acento="oficio"
                                  multiple
                                  opciones={[
                                    ...(catalogoEsp ?? []).map((e) => ({
                                      codigo: e.id,
                                      etiqueta: idioma === 'en' ? e.nombreEn : e.nombre,
                                    })),
                                    ...otras.map((nombre) => ({ codigo: `otra:${nombre}`, etiqueta: nombre })),
                                    { codigo: '__otra__', etiqueta: t('tallerVeterinaria.especialidadOtra') },
                                  ]}
                                  seleccionadas={[...especialidadesSel, ...otras.map((n) => `otra:${n}`)]}
                                  onSelect={(codigo) => {
                                    if (codigo === '__otra__') {
                                      setOtraTexto('');
                                      setHojaOtra(true);
                                      return;
                                    }
                                    if (codigo.startsWith('otra:')) {
                                      const nombre = codigo.slice(5);
                                      setOtras((prev) => prev.filter((n) => n !== nombre));
                                      return;
                                    }
                                    setEspecialidadesSel((prev) =>
                                      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo],
                                    );
                                  }}
                                />
                              </>
                            )}

                            {/* urgencias pre-migración: el tipo aún no
                                vive en el catálogo — se dice sereno,
                                nada se persiste a ciegas */}
                            {!esEspecializada && !tipoDisponible(i) && (
                              <VozSecundaria texto={t('tallerVeterinaria.pendienteCatalogo')} />
                            )}

                            {/* precio — riel discreto + neto en vivo (7.15).
                                S68-B7: el valor vive DENTRO del slider
                                (tap → edición numérica) — el display
                                duplicado murió (Chanel) */}
                            <Text
                              style={{
                                fontFamily: typography.family.sans.regular,
                                fontSize: typography.size.sm,
                                color: theme.text.secondary,
                              }}
                            >
                              {t('servicios.precio')}
                            </Text>
                            <SliderPrecio
                              etiqueta={`${t('servicios.precio')} · ${vozItem(i)}`}
                              pasos={etiquetasDe(i)}
                              indice={indicePrecio(i, d.precio)}
                              onCambio={(idx) => actualizarItem(i, { precio: pasosDe(i)[idx].toFixed(2) })}
                              registro="aa"
                            />
                            <VozComision pct={pct} precio={precioDe(i, d)} />

                            {/* duración — pasos de 15', default del catálogo */}
                            <Separador />
                            <Celda
                              interactiva
                              accessibilityRole="button"
                              titulo={t('tallerVeterinaria.duracion')}
                              subtitulo={t('tallerVeterinaria.duracionAyuda')}
                              metadataMono={t('tallerVeterinaria.minutos', { n: d.duracion })}
                              onPress={() => setHojaDuracion(i)}
                            />

                            {/* horario — default sereno: el general; el
                                propio vive en la sección de horarios
                                (elección de modo D-386 incluida) */}
                            <Separador />
                            <Celda
                              interactiva
                              accessibilityRole="button"
                              titulo={t('tallerVeterinaria.horario')}
                              subtitulo={
                                modoHorarios === 'universal'
                                  ? t('tallerVeterinaria.horarioGeneral')
                                  : franjasDeOferta(d.base?.id ?? null) === 1
                                    ? t('tallerVeterinaria.horarioPropiaUna')
                                    : t('tallerVeterinaria.horarioPropio', {
                                        n: franjasDeOferta(d.base?.id ?? null),
                                      })
                              }
                              onPress={irAHorarios}
                            />
                          </>
                        )}
                      </View>
                    </Tarjeta>
                  </View>
                );
              })}
            </View>
          )}

          {/* ══ PASO/SECCIÓN 2 — horarios (sección COMPARTIDA + D-386) ══ */}
          {seccionVisible === 'horarios' && franjas !== null && pantalla.estado === 'listo' && (
            <SeccionHorarios
              franjas={franjas}
              onCambio={setFranjas}
              oficio="veterinaria"
              titulo={<TituloBloque texto={t('taller.horariosTitulo')} />}
              prestadorId={pantalla.prestadorId}
              modo={modoHorarios}
              ofertas={ofertasHorarios}
              onModoCambiado={() => setIntento((n) => n + 1)}
              // S68-B8 (mitad UI D-409): la Hoja avisa si hay borrador vivo
              hayBorradorExterno={hayCambios}
            />
          )}

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

      {/* Hoja: duración del servicio — pasos de 15' */}
      <Hoja
        visible={hojaDuracion !== null}
        onCerrar={() => setHojaDuracion(null)}
        titulo={t('tallerVeterinaria.duracion')}
        altura="media"
      >
        <HojaScroll>
          {DURACIONES.map((dur, idx) => (
            <View key={dur}>
              {idx > 0 && <Separador />}
              <Celda
                interactiva
                accessibilityRole="button"
                titulo={t('tallerVeterinaria.minutos', { n: dur })}
                onPress={() => {
                  if (hojaDuracion !== null) actualizarItem(hojaDuracion, { duracion: dur });
                  setHojaDuracion(null);
                }}
              />
            </View>
          ))}
        </HojaScroll>
      </Hoja>

      {/* Hoja: "Otra" especialidad — texto libre (draft, CONECTAR-A) */}
      <Hoja visible={hojaOtra} onCerrar={() => setHojaOtra(false)} titulo={t('tallerVeterinaria.otraTitulo')}>
        <View style={{ padding: spacing[4], paddingBottom: spacing[4] + insets.bottom, gap: spacing[4] }}>
          <Campo
            label={t('tallerVeterinaria.otraTitulo')}
            value={otraTexto}
            onChangeText={setOtraTexto}
            placeholder={t('tallerVeterinaria.otraPlaceholder')}
          />
          <Boton
            variante="primario"
            bloque
            etiqueta={t('tallerVeterinaria.otraAgregar')}
            deshabilitado={otraTexto.trim() === ''}
            onPress={() => {
              const nombre = otraTexto.trim();
              if (nombre !== '' && !otras.includes(nombre)) setOtras((prev) => [...prev, nombre]);
              setHojaOtra(false);
            }}
          />
        </View>
      </Hoja>
    </View>
  );
}
