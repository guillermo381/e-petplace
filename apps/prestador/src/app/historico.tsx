// ─────────────────────────────────────────────────────────────────────
// EL HISTÓRICO NAVEGABLE — /historico (S91-B, firma del founder 8-ago-2026)
//
// POR QUÉ NACIÓ, y es un hallazgo de gate: la relectura de la receta quedó
// bien montada y **INALCANZABLE POR NAVEGACIÓN**. Medido entonces: la única
// entrada a `/veterinaria/cita/[citaId]` era el HOY, que lee `hoy-3..hoy+6`;
// el historial del expediente lista atenciones pero sus filas son `Celda`
// SIN `onPress` ⇒ **cero caminos a una cita de más de 3 días atrás**. El
// techo era más ancho que la receta: el CERTIFICADO de S90-D vive tras las
// mismas puertas. Esta pantalla destapa los dos papeles.
// ✅ GATE DEL FOUNDER PASADO (8-ago-2026): entra, re-imprime, y «Tu
//    histórico» queda firmado como nombre.
//
// TESIS: el trabajo que ya hiciste sigue estando, y se llega caminando
//   hacia atrás.
// FIRMA: la CONTINUIDAD — la lista no termina, se sigue pidiendo hacia
//   atrás (comportamiento, no color: dosis baja del prestador).
// CHANEL: **no hay buscador de texto** (letra del founder, v1) — un archivo
//   que exige escribir supone que ya sabés qué buscás. Ni dropdowns: la
//   casa elige con chips.
//
// ── CERO MOTOR NUEVO, relevado antes de escribir (orden del founder) ──
// Los cuatro lectores del HOY toman RANGO y **no clampean a hoy**:
// `.gte('fecha', input.fecha).lte('fecha', input.fecha_hasta ?? input.fecha)`
// — literal de `obtenerCitasVetDelDia`, y sus tres hermanos son el espejo.
// La VERDAD FIRME la siguen poniendo ellos (lista positiva de estados): acá
// no se re-implementa ningún filtro de estado.
//
// ── LOS FILTROS (letra fina del founder, 8-ago-2026) ─────────────────
// **ANIDADOS (Y, jamás O):** cada filtro reduce sobre el resultado del
// anterior. «Thor + veterinaria + julio» achica en cada paso.
//
// **DÓNDE FILTRA CADA UNO, y por qué esto NO miente:** la regla del founder
// es que filtrar solo lo cargado mentiría —diría «no hay» habiendo—. Acá:
//   · **El RANGO ES LA CONSULTA**: cambiarlo RE-CONSULTA a los cuatro
//     lectores con la ventana nueva. No hay filtrado de fechas en memoria.
//   · **Mascota y oficio PARTICIONAN el resultado COMPLETO de la ventana.**
//     Y es completo, medido: **los cuatro lectores no tienen `.limit()`**
//     (grep = 0 en los cuatro archivos), y esta pantalla no pagina dentro
//     de la ventana — «ver más» ENSANCHA la ventana y vuelve a consultar.
//     Sobre un conjunto completo, particionar no puede decir «no hay»
//     habiendo. *Si algún día un lector gana `.limit()`, esta premisa cae
//     y mascota/oficio tienen que viajar como condición al lector.*
//   · Derivar los chips EXIGE el conjunto completo igual: sin él no se
//     puede saber qué mascotas hay para ofrecer.
//
// **LOS CHIPS SALEN DE LO QUE HAY, y cruzado:** las mascotas se derivan de
// lo que queda tras el filtro de OFICIO, y los oficios de lo que queda tras
// el de MASCOTA. Así ninguna opción ofrecida da cero — que es la letra.
//
// ── ENMIENDA DE LETRA (founder, 8-ago-2026, tras el gate de la mecánica) ──
// El v1 pasó pero **no escala de decenas a cientos de clientes**. La regla
// que gobierna desde ahora, y es lo que hay que leer antes de agregar un
// filtro nuevo:
//
//   ### ENUMERABLE → CHIPS · SIN TECHO → TIPEO
//
// · **Mascota NO tiene techo** ⇒ el chip-menú deja de listarlas todas: la
//   puerta es un CAMPO, y los chips quedan como SELLO de lo elegido, como
//   lo que el tipeo filtró, o como accesos recientes cuando son pocas.
//   Gramática del alta: tipear filtra → chip presenta → elegir sella.
// · **Oficio y servicio SÍ enumeran** dentro de un rango ⇒ siguen en chips.
//
// ⚠️ **EL CORREO DEL PET PARENT: NO SE CONSTRUYÓ, SE ELEVA** — la orden
// pedía sugerir por nombre de mascota **y por correo**. El nombre viaja; el
// correo NO, y se midió por las dos puntas: el SELECT de los lectores trae
// `mascota:mascotas(id, nombre, especie, foto_url, familia_id)` —cero
// correo—, y el único lector de contacto que existe devuelve
// `nombre · telefono · telefono_codigo_pais`, verificado en el wrapper Y en
// la firma viva del motor (`pg_get_function_result`).
//   **Y no es «que A agregue una columna».** Ese lector angosto nació en
//   S74 con gate de rol a propósito: qué del pet parent puede ver un
//   prestador es decisión de LETRA, no de wrapper. Un correo es contacto
//   directo, y hoy la casa expone teléfono bajo gate. **Va a la mesa.**
//
// ⚠️ **ESPECIE: NO SE CONSTRUYÓ, SE ELEVA** (regla del propio founder: lo
// que exige algo que no existe se declara, no se hace en silencio). El dato
// SÍ viaja (`mascota.especie`), pero la firma pide **especie con su imagen
// de la galería especies-razas**, y eso hoy no existe en ninguna capa:
// `especies-razas` tiene **CERO consumidores** en `packages/api` y en las
// dos apps (grep), así que falta (a) un resolver de URL pública —territorio
// de A, hermano de los dos que ya viven en `prestador.ts`— y (b) un chip de
// filtro con IMAGEN: `FiltroPills` toma glifo y `FiltroMascotas` toma
// avatar de mascota. Construirlo con un glifo cualquiera habría cumplido
// la lista y roto la firma. **Nota de alcance, no excusa:** elegir a Thor
// ya fija su especie, así que el hueco muerde en el caso «todos mis gatos»,
// no en el del gate.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton,
  Campo,
  CampoFecha,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FilaCita,
  FiltroMascotas,
  FiltroPills,
  Hoja,
  Icono,
  MarcaDeAgua,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  sugerir,
  useTheme,
  type AvatarMascotaEspecie,
  type CampoFechaValor,
  type FilaCitaOficio,
  type OpcionFiltro,
} from '@epetplace/ui';
import {
  obtenerCitasAdiestramientoDelDia,
  obtenerCitasGroomingDelDia,
  obtenerCitasPaseoDelDia,
  obtenerCitasVetDelDia,
  obtenerMiPrestador,
  resolverUrlFoto,
  type CitaAgendaPaseo,
} from '@epetplace/api';
import { fechaCortaMono, fechaDiaSemanaHumana, type IdiomaSoportado } from '@epetplace/i18n';

import { verificarSesion } from '@/lib/api';
import { useTraduccion } from '@/i18n';

const PASO_DIAS = 30;

/** Suma días en fecha LOCAL por partes literales — jamás `new Date(iso)`,
 *  que interpreta UTC y corre el día en UTC-5 (la trampa que S55 midió). */
function sumarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  const base = new Date(a, m - 1, d);
  base.setDate(base.getDate() + dias);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${base.getFullYear()}-${p(base.getMonth() + 1)}-${p(base.getDate())}`;
}
function hoyLocal(): string {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}
function primeroDelMes(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

type Oficio = FilaCitaOficio;
type CitaConOficio = { cita: CitaAgendaPaseo; oficio: Oficio; fotoUrl?: string };
type AtajoRango = 'mes' | 'd30' | 'd90' | 'aMedida';
type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'listo'; citas: CitaConOficio[] };

function esEspecie(v: string | null | undefined): v is AvatarMascotaEspecie {
  return v !== null && v !== undefined;
}

export default function Historico() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, idioma } = useTraduccion();
  const lang = idioma as IdiomaSoportado;

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [pidiendo, setPidiendo] = useState(false);
  // La ventana VIGENTE — es la consulta, no un filtro de vista.
  const [desde, setDesde] = useState(() => sumarDias(hoyLocal(), -PASO_DIAS));
  const [hasta, setHasta] = useState(() => hoyLocal());
  const [atajo, setAtajo] = useState<AtajoRango>('d30');
  const [aMedidaAbierta, setAMedidaAbierta] = useState(false);
  const [borradorDesde, setBorradorDesde] = useState<CampoFechaValor | undefined>();
  const [borradorHasta, setBorradorHasta] = useState<CampoFechaValor | undefined>();
  // Los ejes que particionan.
  const [oficio, setOficio] = useState<Oficio | null>(null);
  const [servicio, setServicio] = useState<string | null>(null);
  const [mascotaId, setMascotaId] = useState<string | null>(null);
  /** EL TIPEO — la puerta principal de lo que NO tiene techo (enmienda de
   *  letra del founder, 8-ago-2026: «enumerable → chips; sin techo → tipeo»).
   *  Las mascotas de un negocio crecen de decenas a cientos: un chip-menú
   *  que las lista todas deja de ser un menú y pasa a ser una pared. */
  const [busqueda, setBusqueda] = useState('');

  const traer = useCallback(async (d: string, h: string) => {
    const sesion = await verificarSesion();
    if (!sesion.ok) return null;
    const pr = await obtenerMiPrestador();
    if (!pr.ok) return null;
    const rango = { prestador_id: pr.data.id, fecha: d, fecha_hasta: h };
    const [paseo, grooming, vet, adiestramiento] = await Promise.all([
      obtenerCitasPaseoDelDia(rango),
      obtenerCitasGroomingDelDia(rango),
      obtenerCitasVetDelDia(rango),
      obtenerCitasAdiestramientoDelDia(rango),
    ]);
    if (!paseo.ok && !grooming.ok && !vet.ok && !adiestramiento.ok) return null;
    const juntas: CitaConOficio[] = [
      ...(paseo.ok ? paseo.data.map((c) => ({ cita: c, oficio: 'paseo' as const })) : []),
      ...(grooming.ok ? grooming.data.map((c) => ({ cita: c, oficio: 'grooming' as const })) : []),
      ...(vet.ok ? vet.data.map((c) => ({ cita: c, oficio: 'veterinaria' as const })) : []),
      ...(adiestramiento.ok
        ? adiestramiento.data.map((c) => ({ cita: c, oficio: 'adiestramiento' as const }))
        : []),
    ];
    // MÁS RECIENTE PRIMERO: un archivo se lee hacia atrás.
    juntas.sort((x, y) => {
      const f = (y.cita.fecha ?? '').localeCompare(x.cita.fecha ?? '');
      return f !== 0 ? f : (y.cita.hora ?? '').localeCompare(x.cita.hora ?? '');
    });
    return await Promise.all(
      juntas.map(async (j) => ({
        ...j,
        fotoUrl: j.cita.mascota?.foto_url
          ? ((await resolverUrlFoto(j.cita.mascota.foto_url)) ?? undefined)
          : undefined,
      })),
    );
  }, []);

  const consultar = useCallback(
    (d: string, h: string) => {
      setEstado({ fase: 'cargando' });
      void traer(d, h).then((r) =>
        setEstado(r === null ? { fase: 'error' } : { fase: 'listo', citas: r }),
      );
    },
    [traer],
  );

  useFocusEffect(
    useCallback(() => {
      consultar(desde, hasta);
    }, [consultar, desde, hasta]),
  );

  /** Cambiar el RANGO re-consulta: es la ventana, no una vista. */
  const aplicarRango = (a: AtajoRango) => {
    const h = hoyLocal();
    setAtajo(a);
    if (a === 'aMedida') {
      setBorradorDesde({ fecha: desde, precision: 'exacta' });
      setBorradorHasta({ fecha: hasta, precision: 'exacta' });
      setAMedidaAbierta(true);
      return;
    }
    const d = a === 'mes' ? primeroDelMes(h) : sumarDias(h, a === 'd30' ? -30 : -90);
    setDesde(d);
    setHasta(h);
  };

  const verMasAtras = async () => {
    if (pidiendo) return;
    setPidiendo(true);
    const d = sumarDias(desde, -PASO_DIAS);
    const r = await traer(d, hasta);
    setPidiendo(false);
    if (r !== null) {
      setDesde(d);
      setAtajo('aMedida');
      setEstado({ fase: 'listo', citas: r });
    }
  };

  const todas = estado.fase === 'listo' ? estado.citas : [];

  // LOS CHIPS SALEN DE LO QUE HAY, Y CRUZADO: las mascotas se derivan de lo
  // que sobrevive al filtro de oficio y viceversa — así ninguna opción
  // ofrecida daría cero (letra del founder).
  /** UN SOLO SITIO DECIDE QUÉ PASA CADA EJE — y las opciones de cada uno se
   *  derivan aplicando TODOS MENOS ÉL MISMO. Con dos ejes se podía escribir
   *  a mano; con tres, hacerlo a mano es cómo aparece la opción que da cero
   *  (la letra: «ninguna opción ofrecida da cero»). */
  const pasa = useCallback(
    (j: CitaConOficio, ejes: { oficio?: boolean; servicio?: boolean; mascota?: boolean }) =>
      (ejes.oficio === false || oficio === null || j.oficio === oficio) &&
      (ejes.servicio === false || servicio === null || (j.cita.tipo?.nombre ?? null) === servicio) &&
      (ejes.mascota === false || mascotaId === null || j.cita.mascota?.id === mascotaId),
    [oficio, servicio, mascotaId],
  );

  const opcionesMascota = useMemo(() => {
    const vistas = new Map<string, { id: string; nombre: string; fotoUrl?: string }>();
    for (const j of todas.filter((x) => pasa(x, { mascota: false }))) {
      const m = j.cita.mascota;
      if (m && !vistas.has(m.id)) vistas.set(m.id, { id: m.id, nombre: m.nombre, fotoUrl: j.fotoUrl });
    }
    return [...vistas.values()];
  }, [todas, pasa]);

  const opcionesOficio = useMemo(() => {
    const vistos = new Set<Oficio>(todas.filter((x) => pasa(x, { oficio: false })).map((j) => j.oficio));
    const ORDEN: Oficio[] = ['veterinaria', 'grooming', 'paseo', 'adiestramiento'];
    return ORDEN.filter((o) => vistos.has(o)).map<OpcionFiltro<Oficio>>((o) => ({
      codigo: o,
      etiqueta: t(`historico.oficio_${o}`),
      icono: o === 'adiestramiento' ? 'training' : o,
      // Ley 10 — SALUD es identidad; el resto, cuidado.
      capa: o === 'veterinaria' ? 'identidad' : 'cuidado',
    }));
  }, [todas, pasa, t]);

  /** EL SERVICIO FINO (enmienda del founder): «consulta vs control · corte
   *  vs baño». VIAJA HOY —`tipo:tipos_servicio!inner(nombre)` en el SELECT
   *  de los cuatro lectores—, así que es cero motor: se agrupa lo vivo.
   *  Enumera bien dentro de un rango (un negocio no tiene cientos de tipos)
   *  ⇒ por la regla firmada le corresponden CHIPS, no tipeo. */
  const opcionesServicio = useMemo(() => {
    const vistos = new Set<string>();
    for (const j of todas.filter((x) => pasa(x, { servicio: false }))) {
      const n = j.cita.tipo?.nombre;
      if (n) vistos.add(n);
    }
    return [...vistos].sort().map<OpcionFiltro<string>>((n) => ({
      codigo: n,
      etiqueta: n,
      icono: null,
      capa: null,
    }));
  }, [todas, pasa]);

  /** LAS MASCOTAS QUE SE DIBUJAN — la letra: el chip-menú deja de listarlas
   *  todas. Queda el SELLO de lo elegido, lo que el tipeo filtró, o los
   *  accesos recientes cuando son pocos. */
  const TECHO_CHIPS = 6;
  const chipsMascota = useMemo(() => {
    if (mascotaId !== null) return opcionesMascota.filter((m) => m.id === mascotaId);
    if (busqueda.trim().length > 0) {
      // La pieza de packages/ui, con las perillas que nacieron para esto:
      // «Th» son DOS letras (el default 4 no la vería) y `empieza` evita
      // que matchee en el medio de cualquier nombre.
      return sugerir(opcionesMascota, {
        texto: busqueda,
        vozDe: (m) => m.nombre,
        minimoDeLetras: 2,
        modo: 'empieza',
        tope: 6,
      });
    }
    return opcionesMascota.length <= TECHO_CHIPS ? opcionesMascota : [];
  }, [opcionesMascota, mascotaId, busqueda]);

  // ANIDADOS (Y, jamás O) — los tres ejes a la vez.
  const visibles = useMemo(() => todas.filter((j) => pasa(j, {})), [todas, pasa]);

  const hayFiltro = oficio !== null || servicio !== null || mascotaId !== null;
  const limpiarTodo = () => {
    setOficio(null);
    setServicio(null);
    setMascotaId(null);
    setBusqueda('');
  };

  const porFecha = useMemo(
    () =>
      visibles.reduce<Array<{ fecha: string; items: CitaConOficio[] }>>((acc, j) => {
        const f = j.cita.fecha ?? '';
        const ultimo = acc[acc.length - 1];
        if (ultimo && ultimo.fecha === f) ultimo.items.push(j);
        else acc.push({ fecha: f, items: [j] });
        return acc;
      }, []),
    [visibles],
  );

  const rutaDe = (j: CitaConOficio) =>
    j.oficio === 'grooming'
      ? ({ pathname: '/grooming/cita/[citaId]', params: { citaId: j.cita.id } } as const)
      : j.oficio === 'adiestramiento'
        ? ({ pathname: '/adiestramiento/cita/[citaId]', params: { citaId: j.cita.id } } as const)
        : j.oficio === 'veterinaria'
          ? ({ pathname: '/veterinaria/cita/[citaId]', params: { citaId: j.cita.id } } as const)
          : ({ pathname: '/cita/[citaId]', params: { citaId: j.cita.id } } as const);

  const ATAJOS: OpcionFiltro<AtajoRango>[] = [
    { codigo: 'mes', etiqueta: t('historico.rangoMes'), icono: 'mes', capa: null },
    { codigo: 'd30', etiqueta: t('historico.rango30'), icono: 'mes', capa: null },
    { codigo: 'd90', etiqueta: t('historico.rango90'), icono: 'mes', capa: null },
    { codigo: 'aMedida', etiqueta: t('historico.rangoAMedida'), icono: 'lapiz', capa: null },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('historico.titulo')}
        atras
        onAtras={() => router.back()}
      />

      {/* ── LOS EJES. Van FUERA del scroll de resultados: son el control de
          la pantalla, no contenido. Cada uno es una fila de chips con el
          selector de la casa (pata + acento pisando al elegido). ── */}
      <View style={{ gap: spacing[1] }}>
        <FiltroPills opciones={ATAJOS} activo={atajo} onCambio={aplicarRango} />
        {opcionesOficio.length > 1 ? (
          <FiltroPills
            opciones={opcionesOficio}
            activo={oficio}
            onCambio={setOficio}
            onLimpiar={() => setOficio(null)}
          />
        ) : null}
        {opcionesServicio.length > 1 ? (
          <FiltroPills
            opciones={opcionesServicio}
            activo={servicio}
            onCambio={setServicio}
            onLimpiar={() => setServicio(null)}
          />
        ) : null}
        {/* EL TIPEO — puerta principal de la mascota. Va SIEMPRE, no bajo un
            umbral: la regla firmada es «sin techo → tipeo», y esconderlo
            cuando hoy hay pocas lo volvería una puerta que aparece sola el
            día que ya no se necesita descubrirla. Los chips de abajo son el
            atajo, no la puerta. */}
        <View style={{ paddingHorizontal: spacing[4], paddingTop: spacing[2] }}>
          <Campo
            label={t('historico.buscarLabel')}
            placeholder={t('historico.buscarPlaceholder')}
            ayuda={t('historico.buscarAyuda')}
            value={busqueda}
            onChangeText={setBusqueda}
            autoCapitalize="none"
          />
        </View>
        {chipsMascota.length > 0 ? (
          <FiltroMascotas
            mascotas={chipsMascota}
            elegida={mascotaId}
            onElegir={(id) => {
              setMascotaId(id);
              // Elegir SELLA: el tipeo ya hizo su trabajo y el campo se
              // vacía para que el chip quede como la única marca del estado
              // (dos marcas para un mismo estado es el peso que no informa).
              if (id !== null) setBusqueda('');
            }}
          />
        ) : busqueda.trim().length > 0 ? (
          <View style={{ paddingHorizontal: spacing[4], paddingTop: spacing[1] }}>
            <Texto variante="apoyo" color="tertiary">
              {t('historico.buscarSinCoincidencia', { texto: busqueda.trim() })}
            </Texto>
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing[4],
          gap: spacing[4],
          paddingBottom: insets.bottom + spacing[8],
        }}
      >
        {/* ESTADO VIVO SIEMPRE VISIBLE (letra del founder): qué ventana se
            está mirando, cuántas quedan, y la limpieza a un toque. Decir
            DESDE CUÁNDO evita confundir «no hay más» con «no pedí más» —
            que es exactamente el error que trajo esta pantalla al mundo. */}
        {estado.fase === 'listo' ? (
          <View style={{ gap: spacing[2] }}>
            <Texto variante="dato" color="tertiary">
              {t('historico.estado', {
                n: visibles.length,
                desde: fechaCortaMono(desde, lang),
                hasta: fechaCortaMono(hasta, lang),
              })}
            </Texto>
            {hayFiltro ? (
              <Boton
                variante="compacto"
                etiqueta={t('historico.limpiar')}
                onPress={limpiarTodo}
              />
            ) : null}
          </View>
        ) : null}

        {estado.fase === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" alto={96} />
              <Esqueleto forma="bloque" alto={96} />
            </View>
          </EsqueletoGrupo>
        ) : estado.fase === 'error' ? (
          // Ley 13: el fallo dice que es fallo — jamás «no hay atenciones».
          <EstadoVacio
            registro="seccion"
            titulo={t('historico.errorTitulo')}
            descripcion={t('historico.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('historico.reintentar')}
                onPress={() => consultar(desde, hasta)}
              />
            }
          />
        ) : visibles.length === 0 ? (
          // CERO RESULTADOS HABLA, y dice QUÉ SOLTAR (letra del founder):
          // con filtros puestos el camino es soltarlos; sin filtros, el
          // camino es mirar más atrás. Nunca un vacío mudo.
          <EstadoVacio
            registro="seccion"
            icono={<Icono nombre="mes" tamano={48} />}
            titulo={hayFiltro ? t('historico.sinCoincidenciasTitulo') : t('historico.vacioTitulo')}
            descripcion={
              hayFiltro
                ? t('historico.sinCoincidenciasDetalle')
                : t('historico.vacioDetalle', { fecha: fechaDiaSemanaHumana(desde, lang) })
            }
            accion={
              hayFiltro ? (
                <Boton
                  variante="secundario"
                  etiqueta={t('historico.limpiar')}
                  onPress={limpiarTodo}
                />
              ) : (
                <Boton
                  variante="secundario"
                  etiqueta={t('historico.verMas', { n: PASO_DIAS })}
                  cargando={pidiendo}
                  onPress={() => void verMasAtras()}
                />
              )
            }
          />
        ) : (
          <>
            {porFecha.map((grupo) => (
              <View key={grupo.fecha} style={{ gap: spacing[2] }}>
                <Texto variante="seccion">{fechaDiaSemanaHumana(grupo.fecha, lang)}</Texto>
                <Tarjeta relleno="ninguno">
                  {grupo.items.map((j, i) => (
                    <View key={j.cita.id}>
                      {i > 0 ? <Separador /> : null}
                      <FilaCita
                        oficio={j.oficio}
                        titulo={j.cita.mascota?.nombre ?? t('agenda.mascotaFallback')}
                        subtitulo={j.cita.tipo?.nombre ?? undefined}
                        metadataMono={j.cita.hora ? j.cita.hora.slice(0, 5) : undefined}
                        mascota={{
                          nombre: j.cita.mascota?.nombre ?? t('agenda.mascotaFallback'),
                          fotoUrl: j.fotoUrl,
                          especie: esEspecie(j.cita.mascota?.especie)
                            ? j.cita.mascota.especie
                            : undefined,
                        }}
                        // Con la mascota ya elegida arriba, repetir su cara en
                        // cada fila es decir dos veces lo mismo (regla Chanel
                        // — el mismo criterio del log).
                        cara={mascotaId === null}
                        direccion="derecha"
                        fin={
                          <Icono
                            nombre={j.oficio === 'adiestramiento' ? 'training' : j.oficio}
                            registro="aa"
                            tamano={21}
                          />
                        }
                        onPress={() => router.push(rutaDe(j))}
                      />
                    </View>
                  ))}
                </Tarjeta>
              </View>
            ))}
            {/* NO es `PieRevelar`: la 19.6 lo acota a revelar un N CONOCIDO y
                dice que no aplica a paginación. Acá no se sabe cuántas hay
                más atrás — se pide otro tramo (patrón «cargar más», S60). */}
            <Boton
              variante="secundario"
              bloque
              etiqueta={t('historico.verMas', { n: PASO_DIAS })}
              cargando={pidiendo}
              onPress={() => void verMasAtras()}
            />
          </>
        )}
      </ScrollView>

      {/* EL RANGO A MEDIDA — la puerta que NO es la única (letra del
          founder: los atajos son la puerta principal; el calendario doble
          vive detrás de su chip). */}
      <Hoja
        visible={aMedidaAbierta}
        onCerrar={() => setAMedidaAbierta(false)}
        titulo={t('historico.rangoAMedida')}
        conCerrar
      >
        <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
          <CampoFecha
            label={t('historico.desdeLabel')}
            valor={borradorDesde}
            onChange={setBorradorDesde}
          />
          <CampoFecha
            label={t('historico.hastaLabel')}
            valor={borradorHasta}
            onChange={setBorradorHasta}
          />
          <Boton
            variante="primario"
            bloque
            etiqueta={t('historico.aplicar')}
            deshabilitado={
              borradorDesde === undefined ||
              borradorHasta === undefined ||
              borradorDesde.fecha > borradorHasta.fecha
            }
            onPress={() => {
              if (borradorDesde === undefined || borradorHasta === undefined) return;
              setDesde(borradorDesde.fecha);
              setHasta(borradorHasta.fecha);
              setAMedidaAbierta(false);
            }}
          />
        </View>
      </Hoja>
    </View>
  );
}
