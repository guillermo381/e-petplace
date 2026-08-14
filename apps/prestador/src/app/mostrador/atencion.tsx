// ─────────────────────────────────────────────────────────────────────
// M4 + M5 — LA ATENCIÓN DEL MOSTRADOR + EL COBRO-DATO (A1bis, S69-B).
// Desde el tap de una mascota en M2. Dos fases: (1) atención — servicio
// del menú VIVO (solo es_medico activos; el server lo garantiza) +
// persona (N=1 colapsa, sin picker) + precio editable → la cita nace
// FIRME hoy. (2) cobro — monto + medio, DATO puro (cero devengo, cero
// fee, cero checkout). Dosis §15b: densa y rápida.
//
// TESIS: en dos toques la clínica registra lo que pasó — y queda en la
// agenda de hoy y en el expediente.
// FIRMA: la cita aparece en el HOY al volver (comportamiento — el smoke
// de M0). Confirmación de dos mitades.
//
// Vacunación (D-434): cuando el servicio es vacunación, el registrable de
// la vacuna (selector cat_vacunas + "Otra") es la pieza FINAL declarada —
// el RPC/trigger de procedencia ya está (mesa), falta el wrapper de
// lectura cat_vacunas + confirmar el path de inserción del lado prestador.
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Boton,
  Campo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  MarcaDeAgua,
  SelectorOpcion,
  SelectorSegmentado,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  MEDIOS_COBRO,
  obtenerCatalogoVacunas,
  obtenerCatalogoVeterinaria,
  obtenerDetalleMascotaPrestador,
  crearCitaNegocio,
  obtenerEmpleadosCuenta,
  obtenerIniciosVet,
  obtenerMiPrestador,
  obtenerMundoVeterinariaPropio,
  obtenerOfertaAdiestramientoPropia,
  obtenerOfertasGroomingPropias,
  obtenerOfertasPaseoPropias,
  puedoAtenderClinico,
  registrarAtencionMostrador,
  registrarCobroPresencial,
  registrarVacunaMostrador,
  resolverUrlFoto,
  type EmpleadoCuenta,
  type MedioCobro,
  type VacunaCatalogo,
} from '@epetplace/api';

import { EvitaTeclado } from '@/components/evita-teclado';
import { verificarSesion } from '@/lib/api';
import { vozErrorVet } from '@/lib/voz-error-vet';
import { diaSemanaCorto } from '@epetplace/i18n';
import { REGLA_OFICIO, type OficioMostrador } from '@/lib/oficio-mostrador';
import { useTraduccion } from '@/i18n';

/* ⭐ S86-C · el servicio del menú YA SABE de qué oficio es. Sin eso, la
   pantalla tendría que deducirlo, y deducir el oficio de un código de
   servicio es exactamente el acoplamiento que la tabla de reglas vino a
   evitar. */
type ServicioActivo = { codigo: string; nombre: string; precio: number; oficio: OficioMostrador };


export default function AtencionMostrador() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const { mascotaId = '', nombre = '', oficio = '' } = useLocalSearchParams<{
    mascotaId?: string;
    nombre?: string;
    /** ⭐ S98-C · POR QUÉ PUERTA ENTRÓ (la baldosa de `ATENDER`). Vacío =
     *  entró por un camino que no lo dice, y entonces esta pantalla se
     *  comporta como siempre. */
    oficio?: string;
  }>();
  /* 🔴 S98-C · EL DEFECTO QUE ESTE PARÁMETRO CURA, y no es cosmético:
     el menú de esta pantalla es **solo de veterinaria** (lo dice su propia
     carga: los cuatro lectores entran, pero solo el mundo vet arma
     `servicios`). Para un negocio SIN vet eso caía en el vacío
     `sinServicios`, **cuyo botón lleva al taller de VETERINARIA** — o sea
     que a un groomer que venía a registrar una atención de estética el
     producto le ofrecía activar servicios de un oficio que no ejerce.
     *Un camino honesto que termina en la puerta equivocada es peor que un
     camino que no existe: el primero se recorre entero antes de fallar.*
     Con la puerta declarada, el vacío DICE la verdad de ese oficio y no
     ofrece nada que no corresponda (L-197 + Ley 23). */
  const oficioNoVet = oficio !== '' && oficio !== 'veterinaria';

  // S73-B (M2 de A sobre el boceto S72-B §2): LA MÁQUINA DE ESTADOS de la
  // carga — espejo de coordinar/[citaId] (copiar-al-vecino). `null` ya no
  // significa dos cosas: cargando/error/listo son fases DISTINTAS, y un
  // fallo de CUALQUIERA de los cinco fetches (prestador + mundo + catálogo
  // + vacunas + detalle de mascota — el cuarto lo sumó a9b8686 y también
  // se tragaba en silencio) pasa a 'error' con voz y reintento (Ley 13:
  // el error jamás se disfraza de botón muerto).
  type Carga =
    | { fase: 'cargando' }
    | { fase: 'error' }
    | { fase: 'listo'; prestadorId: string; servicios: ServicioActivo[] };
  // S76-B3 (D-524, la ley madre §2): RECIBIR es ventanilla (cualquiera
  // activo — esta pantalla entera); FIRMAR la vacuna es clínico (solo
  // quien atiende). false hasta confirmar — el selector de vacuna no se
  // monta ante la duda (gate de ausencia, jamás candado). "Pendiente de
  // firma" es DERIVABLE (walk-in médico sin su evento): cero estado nuevo.
  const [firmaClinica, setFirmaClinica] = useState(false);
  const [carga, setCarga] = useState<Carga>({ fase: 'cargando' });
  const [reintento, setReintento] = useState(0);
  // S73-B ítem 10 (b): el vet tiene que VER al animal que atiende — la
  // identidad se carga por mascotaId (puerta única, RLS; mismo patrón que
  // mascota/[mascotaId] + resolverUrlFoto), jamás foto por params.
  const [fotoFirmada, setFotoFirmada] = useState<string | null>(null);
  const [nombreMascota, setNombreMascota] = useState<string | null>(null);
  const [servicioCodigo, setServicioCodigo] = useState<string | undefined>(undefined);
  const [precio, setPrecio] = useState('');
  const [fase, setFase] = useState<'atencion' | 'cobro'>('atencion');
  const [citaId, setCitaId] = useState<string | null>(null);
  const [monto, setMonto] = useState('');
  const [medio, setMedio] = useState<MedioCobro>('efectivo');
  const [ocupado, setOcupado] = useState(false);
  // D-434: el registrable de vacuna (solo cuando el servicio es vacunación).
  const [catalogoVacunas, setCatalogoVacunas] = useState<VacunaCatalogo[]>([]);
  const [vacunaSel, setVacunaSel] = useState<string | undefined>(undefined);
  const [vacunaLibre, setVacunaLibre] = useState('');
  const OTRA = '__otra__';
  /* ⭐ S86-C · ② «A LA PIZARRA» ES UN CHIP, NO UN ACCIDENTE (lámina
     firmada del mostrador).
     ⏪ LO QUE PASABA HASTA HOY, medido: esta pantalla llamaba a
     `registrarAtencionMostrador` **sin `empleadoId` NUNCA** ⇒ TODA
     atención de mostrador nacía sin tratante y caía a la pizarra —
     correcto por casualidad, invisible como decisión. Nadie ELEGÍA:
     simplemente no había dónde.
     Ahora la elección es explícita y OBLIGATORIA (ver `puedeRegistrar`):
     una persona, o la pizarra a propósito. *Dejar la cita sin tratante
     es una elección de quien recibe.*
     ⚠️ Y el wrapper YA aceptaba `empleadoId` — no hizo falta motor ni
     pedirle nada a A: faltaba la superficie. */
  const A_LA_PIZARRA = '__pizarra__';
  const [personas, setPersonas] = useState<EmpleadoCuenta[] | null>(null);
  /* S86-C · qué OTROS oficios tiene activos el negocio — para poder decir
     con precisión cuál todavía no puede registrarse acá (ver el bloque
     del menú). */
  const [otrosOficios, setOtrosOficios] = useState<{ paseo: boolean; grooming: boolean; adiestramiento: boolean }>({
    paseo: false,
    grooming: false,
    adiestramiento: false,
  });
  const [tratante, setTratante] = useState<string | undefined>(undefined);

  /* ⭐ S86-C · ① LOS DOS VERBOS, HONESTOS AL MOTOR (lámina firmada).
     «Atender ahora» REGISTRA un hecho (`registrar_atencion_mostrador`).
     «Agendar» RESERVA capacidad con cupo y grilla (`crear_cita_negocio`).

     ⚠️ POR QUÉ VIVEN EN LA MISMA PANTALLA Y NO EN DOS: acá ya están la
     mascota, el servicio, el precio y el tratante — los CUATRO son
     comunes. Agendar solo AGREGA fecha y hora. Partirlo en dos pantallas
     habría duplicado esos cuatro y, con ellos, la oportunidad de que se
     separen.
     ⚠️ Y LA FRONTERA DE ① QUEDA ESTRUCTURAL, no de disciplina: la RPC se
     elige POR EL VERBO, así que **la cita futura no tiene por dónde
     viajar por el registro**. El guard `el_mostrador_registra_no_reserva`
     existe y ahora tiene voz, pero la superficie hace imposible llegar
     ahí — que es lo que la firma pide: *hacer imposible, no confiar en
     el rebote*. */
  const [verbo, setVerbo] = useState<'ahora' | 'agendar'>('ahora');
  const [fecha, setFecha] = useState<string | undefined>(undefined);
  const [hora, setHora] = useState<string | undefined>(undefined);
  /* `null` = la grilla NO SE PUDO LEER (D-653: el acceso a la mascota
     puede caducar entre que se la encuentra y que se la agenda). Es
     DISTINTO de `[]` = «ese día no tiene horas libres», y por eso son
     dos estados y no uno: una grilla vacía por caducidad se lee como
     «no hay horarios» y manda a probar otro día para siempre. */
  const [horas, setHoras] = useState<string[] | null>(null);
  const [cargandoHoras, setCargandoHoras] = useState(false);

  useEffect(() => {
    let vigente = true;
    setCarga({ fase: 'cargando' });
    void (async () => {
      const pr = await obtenerMiPrestador();
      if (!vigente) return;
      if (!pr.ok) {
        setCarga({ fase: 'error' });
        return;
      }
      const [mundo, cat, vac, detalle, firma, gente, ofPaseo, ofGrooming, ofAdi] = await Promise.all([
        obtenerMundoVeterinariaPropio(pr.data.id),
        obtenerCatalogoVeterinaria(),
        obtenerCatalogoVacunas(),
        obtenerDetalleMascotaPrestador(mascotaId, pr.data.id),
        // D-524: ¿quién mira puede FIRMAR? Su fallo NO tumba la carga —
        // devuelve false y la firma simplemente no se ofrece (ventanilla
        // sigue entera: recibir y cobrar no piden rol).
        puedoAtenderClinico(pr.data.id),
        /* S86-C · las personas de la cuenta — el MISMO lector que usa
           «Fijar fecha» (se copia al vecino, no se inventa un tercero).
           ⚠️ Su fallo NO tumba la carga, igual que la firma clínica: la
           VENTANILLA tiene que seguir funcionando (recibir y cobrar no
           piden rol). Sin personas, la elección no se ofrece — y la
           pantalla lo DICE en vez de mandar a la pizarra en silencio. */
        pr.data.cuenta_comercial_id !== null
          ? obtenerEmpleadosCuenta(pr.data.cuenta_comercial_id)
          : Promise.resolve(null),
        /* ⭐ S86-C · LOS OTROS TRES MENÚS, **AL FINAL DEL ARREGLO** — y no
           es capricho: los puse en el medio y desalineé el destructuring
           entero (`gente` pasó a recibir las ofertas de paseo). El tsc lo
           cazó, pero el archivo del HOY ya tenía la advertencia escrita y
           yo la leí después de pagarla. Al final, nada se mueve.
           Se REUSAN los lectores que el HOY ya consume — no nace ninguno
           (L-175). Su fallo NO tumba la pantalla: ese oficio no aporta
           servicios, y si el menú queda vacío la superficie lo DICE. */
        obtenerOfertasPaseoPropias(pr.data.id),
        obtenerOfertasGroomingPropias(pr.data.id),
        obtenerOfertaAdiestramientoPropia(pr.data.id),
      ]);
      if (!vigente) return;
      // Un fallo de CUALQUIERA pasa a error — antes: mundo caído se
      // disfrazaba de "sin servicios", catálogo caído pintaba códigos
      // crudos (Ley 3), vacunas caídas apagaban el registrable en
      // silencio, y el detalle caído escondía a la mascota.
      if (!mundo.ok || !cat.ok || !vac.ok || !detalle.ok) {
        setCarga({ fase: 'error' });
        return;
      }
      setCatalogoVacunas(vac.data);
      setFirmaClinica(firma);
      // null = sin cuenta o lectura caída — los dos casos son «no se puede
      // ofrecer la elección», y ninguno se disfraza de «no hay nadie».
      setPersonas(gente !== null && gente.ok ? gente.data.filter((g) => g.activo) : null);
      setNombreMascota(detalle.data.mascota.nombre);
      // La foto es PATH (S47): se firma por la frontera. Sin foto o si la
      // firma falla, la huella digna de AvatarMascota es la cara válida.
      if (detalle.data.mascota.foto_url !== null) {
        void resolverUrlFoto(detalle.data.mascota.foto_url).then((url) => {
          if (vigente) setFotoFirmada(url);
        });
      }
      const nombres = new Map<string, string>(cat.data.map((c) => [c.codigo, c.nombre]));
      /* ⭐ S86-C · EL MENÚ, Y EL LÍMITE QUE LA MEDICIÓN ENCONTRÓ.
         La ventanilla ya NO es clínica (se mudó fuera de `veterinaria/`)
         y el menú tenía que ser la unión de los oficios activos.
         🔴 **NO SE PUDO, y la causa es de CONTRATO, no de pantalla:**
         `registrar_atencion_mostrador` pide un `tipo_servicio_codigo`, y
         **las ofertas no-vet no exponen el suyo** — medido:
          · `OfertaPaseoPropia` se indexa por `duracionMinutos` y no trae
            código; el catálogo tiene `paseo_30min`/`paseo_60min` pero el
            menú canónico llega a 300' y **no existe código para 120',
            180', 240' ni 300'**. Mapear duración→código inventaría una
            correspondencia que la DB no tiene.
          · `OfertaAdiestramientoPropia` tampoco trae `tipoServicio`.
         Forzarlo con el código genérico haría que un paseo de tres horas
         y uno de treinta minutos se registren IGUAL — un dato plausible
         y falso, que es la clase de defecto que esta sesión persigue.
         ⇒ Se aplica la salida que la propia orden autoriza: **el oficio
         sin menú resuelto DICE que no está disponible todavía**, jamás
         una pantalla vacía sin explicación (L-197). Los oficios activos
         del negocio se guardan para poder decirlo con precisión. */
      const activos: ServicioActivo[] = mundo.data.servicios
        .filter((s) => s.activo)
        .map((s) => ({
          codigo: s.tipoServicio,
          nombre: nombres.get(s.tipoServicio) ?? s.tipoServicio,
          precio: s.precio,
          oficio: 'veterinaria' as const,
        }));
      setOtrosOficios({
        paseo: ofPaseo.ok && ofPaseo.data.some((o) => o.activo),
        grooming: ofGrooming.ok && ofGrooming.data.some((o) => o.activo),
        adiestramiento: ofAdi.ok && (ofAdi.data.oferta?.activo ?? false),
      });
      setCarga({ fase: 'listo', prestadorId: pr.data.id, servicios: activos });
    })();
    return () => {
      vigente = false;
    };
  }, [mascotaId, reintento]);

  // Derivados de la máquina — el resto de la pantalla habla como antes.
  const prestadorId = carga.fase === 'listo' ? carga.prestadorId : null;
  const servicios = carga.fase === 'listo' ? carga.servicios : null;

  function elegirServicio(codigo: string) {
    setServicioCodigo(codigo);
    const s = servicios?.find((x) => x.codigo === codigo);
    if (s) setPrecio(String(s.precio));
  }

  /* Los DÍAS que ofrece «Agendar»: hoy + 13. Fechas LOCALES por partes
     literales — jamás `new Date(iso)` ni `toISOString` (D-312). */
  const dias = useMemo(() => {
    const f = new Intl.DateTimeFormat('en-CA');
    const hoy = f.format(new Date());
    const [a, m, d] = hoy.split('-').map(Number);
    return Array.from({ length: 14 }, (_, i) =>
      f.format(new Date(a ?? 0, (m ?? 1) - 1, (d ?? 1) + i)),
    );
  }, []);

  /* La grilla se relee cuando cambia el DÍA o el SERVICIO — la duración
     del servicio decide qué inicios entran, así que una hora elegida
     antes de cambiar de servicio puede dejar de existir: se limpia. */
  useEffect(() => {
    if (verbo !== 'agendar' || fecha === undefined || servicioCodigo === undefined) {
      setHoras(null);
      return;
    }
    let vigente = true;
    setCargandoHoras(true);
    setHora(undefined);
    void obtenerIniciosVet({ fecha, tipo_servicio: servicioCodigo, mascota_id: mascotaId }).then((r) => {
      if (!vigente) return;
      setCargandoHoras(false);
      // ⚠️ D-653: el fallo NO degrada a lista vacía. `null` es «no se
      // pudo» y tiene su propia voz abajo.
      setHoras(r.ok ? r.data : null);
    });
    return () => {
      vigente = false;
    };
  }, [verbo, fecha, servicioCodigo, mascotaId]);

  const precioNum = Number(precio.replace(',', '.'));
  /* S86-C ② — la elección de tratante se OFRECE solo si hay a quién
     elegir. Sin personas legibles no se exige (la ventanilla no se
     bloquea por un lector caído) y la pantalla lo dice abajo. */
  const ofreceTratante = personas !== null && personas.length > 0;
  const puedeRegistrar =
    prestadorId !== null &&
    servicioCodigo !== undefined &&
    Number.isFinite(precioNum) &&
    precioNum >= 0 &&
    // ⚠️ La elección es OBLIGATORIA cuando se ofrece: así «sin tratante»
    // deja de ser el default silencioso y pasa a ser un toque deliberado.
    (!ofreceTratante || tratante !== undefined) &&
    // Agendar exige día Y hora de la grilla real (Ley 23: la puerta no
    // ofrece lo que va a rechazar).
    (verbo === 'ahora' || (fecha !== undefined && hora !== undefined)) &&
    !ocupado;

  async function registrar() {
    if (!puedeRegistrar || prestadorId === null || servicioCodigo === undefined) return;
    const sesion = await verificarSesion();
    if (!sesion.ok) {
      mostrar({ variante: 'error', texto: sesion.mensaje });
      return;
    }
    setOcupado(true);

    /* ⭐ ① LA BIFURCACIÓN DE LOS DOS VERBOS. `crear_cita_negocio` para lo
       futuro, `registrar_atencion_mostrador` para el hecho de ahora — y
       nunca al revés. */
    if (verbo === 'agendar' && fecha !== undefined && hora !== undefined) {
      const ra = await crearCitaNegocio({
        prestadorId,
        mascotaId,
        tipoServicio: servicioCodigo,
        fecha,
        hora,
        // «A la pizarra» = sin empleado, igual que en el registro. Es el
        // camino que dispara el cupo (`sin_quien_la_tome`).
        empleadoId: tratante === A_LA_PIZARRA ? null : tratante,
        precio: precioNum,
      });
      setOcupado(false);
      if (!ra.ok) {
        /* ⚠️ SLOT_OCUPADO Y SIN_QUIEN_LA_TOME SE DICEN DISTINTO — es la
           distinción que el motor declara y que aplanarla rompe:
           «esa hora ya no está» manda a MOVER LA HORA; «no queda nadie
           que pueda tomarla» es un problema DE GENTE, y mover la hora no
           lo arregla. Colapsarlas deja al mostrador probando horarios
           para siempre contra un problema de agenda del equipo. */
        mostrar({
          variante: 'error',
          texto:
            ra.codigo === 'sin_quien_la_tome'
              ? t('atencionMostrador.sinQuienLaTome')
              : ra.codigo === 'slot_ocupado'
                ? t('atencionMostrador.slotOcupado')
                : t('atencionMostrador.noSePudoAgendar'),
        });
        return;
      }
      /* La cita futura NO entra a la fase de cobro: no hubo atención, y
         cobrar algo que todavía no pasó es la palanca que el motor cierra
         con su gate temporal. Se avisa y se vuelve. */
      mostrar({
        variante: 'exito',
        texto: ra.data.aLaPizarra
          ? t('atencionMostrador.agendadaPizarra')
          : t('atencionMostrador.agendada'),
      });
      router.back();
      return;
    }

    const r = await registrarAtencionMostrador({
      prestadorId,
      mascotaId,
      tipoServicioCodigo: servicioCodigo,
      precio: precioNum,
      /* ⭐ ② EL CIRCUITO QUE ALIMENTA LA PIZARRA, en una línea: «A la
         pizarra» ES no mandar `empleadoId`. La cita nace sin tratante y
         cae en `obtener_pizarra` para que alguien la tome.
         *La elección de arriba y esta ausencia son la MISMA decisión* —
         por eso el chip existe: para que la ausencia se elija. */
      empleadoId: tratante === A_LA_PIZARRA ? undefined : tratante,
    });
    setOcupado(false);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: vozErrorVet(t, 'atencion', r) });
      return;
    }
    setCitaId(r.data);
    setMonto(precio);
    setFase('cobro');
  }

  const montoNum = Number(monto.replace(',', '.'));
  const puedeCobrar = citaId !== null && Number.isFinite(montoNum) && montoNum > 0 && !ocupado;
  const esVacunacion = servicioCodigo === 'vacunacion';
  // La verdad del server (RLS) preside; el param queda de puente de carga.
  const mascota = nombreMascota ?? (nombre || t('agenda.mascotaFallback'));

  // D-434: registra la vacuna si el servicio lo es y hay una elegida.
  // Devuelve false SOLO si el registro falló (frena el cierre).
  async function registrarVacunaSiCorresponde(): Promise<boolean> {
    // D-524: sin firma clínica no hay nada que registrar (el selector no
    // se montó); el walk-in queda como "pendiente de firma" derivable.
    if (!firmaClinica) return true;
    if (!esVacunacion || citaId === null) return true;
    const codigo = vacunaSel && vacunaSel !== OTRA ? vacunaSel : undefined;
    const libre = vacunaSel === OTRA ? vacunaLibre.trim() : undefined;
    if (!codigo && !libre) return true; // sin vacuna elegida — no bloquea
    const r = await registrarVacunaMostrador(citaId, { vacunaCodigo: codigo, nombreLibre: libre });
    if (!r.ok) {
      mostrar({ variante: 'error', texto: vozErrorVet(t, 'vacuna', r) });
      return false;
    }
    mostrar({ variante: 'exito', texto: t('atencionMostrador.vacunaExito', { mascota }) });
    return true;
  }

  async function finalizar(conCobro: boolean) {
    if (citaId === null || ocupado) return;
    if (conCobro && !puedeCobrar) return;
    setOcupado(true);
    if (!(await registrarVacunaSiCorresponde())) {
      setOcupado(false);
      return;
    }
    if (conCobro) {
      const r = await registrarCobroPresencial(citaId, montoNum, medio);
      if (!r.ok) {
        setOcupado(false);
        mostrar({ variante: 'error', texto: vozErrorVet(t, 'cobro', r) });
        return;
      }
    }
    setOcupado(false);
    mostrar({ variante: 'exito', texto: t('atencionMostrador.exito', { mascota }) });
    router.back();
  }

  const medioSegmentos = useMemo(
    () =>
      MEDIOS_COBRO.map((m) => ({
        codigo: m,
        etiqueta:
          m === 'efectivo'
            ? t('atencionMostrador.medioEfectivo')
            : m === 'tarjeta'
              ? t('atencionMostrador.medioTarjeta')
              : t('atencionMostrador.medioTransferencia'),
      })),
    [t],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado variante="navegacion" titulo={t('atencionMostrador.titulo')} atras onAtras={() => router.back()} />
      <EvitaTeclado>
      <ScrollView
        contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[6], gap: spacing[4] }}
        keyboardShouldPersistTaps="handled"
      >
        {/* S73-B ítem 10 (b): a quién se atiende, con su CARA — presente en
            las dos fases (atención y cobro). Foto → huella digna fallback. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          <AvatarMascota nombre={mascota} fotoUrl={fotoFirmada ?? undefined} tamano="md" />
          <Texto variante="titulo">{mascota}</Texto>
        </View>
        {fase === 'atencion' ? (
          carga.fase === 'cargando' ? (
            // Ley 13: esqueleto ESTÁTICO — antes esta espera era una
            // pantalla con botón gris que parecía colgada.
            <EsqueletoGrupo etiqueta={t('atencionMostrador.titulo')}>
              <View style={{ gap: spacing[3] }}>
                <Esqueleto forma="linea" ancho="40%" />
                <Esqueleto forma="bloque" alto={120} />
                <Esqueleto forma="bloque" alto={56} />
              </View>
            </EsqueletoGrupo>
          ) : carga.fase === 'error' ? (
            // El error DIRIGE (17.4) — con su camino de reintento.
            <EstadoVacio
              registro="seccion"
              titulo={t('atencionMostrador.errorCarga')}
              descripcion={t('atencionMostrador.errorCargaDetalle')}
              accion={
                <Boton
                  variante="secundario"
                  etiqueta={t('agenda.reintentar')}
                  onPress={() => setReintento((n) => n + 1)}
                />
              }
            />
          ) : servicios !== null && servicios.length === 0 ? (
            oficioNoVet ? (
              /* El oficio ENTRÓ POR SU PUERTA y todavía no tiene menú acá:
                 la limitación es NUESTRA y se dice como tal — sin ofrecer
                 el taller de otro oficio, que era la puerta equivocada. */
              <EstadoVacio
                registro="seccion"
                titulo={t('atencionMostrador.oficioSinMenu')}
                descripcion={t('atencionMostrador.oficioSinMenuDetalle')}
              />
            ) : (
              // El vacío termina en un CAMINO (17.5, M2 de A): el taller es
              // donde se prenden los servicios.
              <EstadoVacio
                registro="seccion"
                titulo={t('atencionMostrador.sinServicios')}
                accion={
                  <Boton
                    variante="secundario"
                    etiqueta={t('atencionMostrador.sinServiciosCta')}
                    onPress={() => router.push({ pathname: '/veterinaria/taller', params: { seccion: 'servicios' } })}
                  />
                }
              />
            )
          ) : (
            <>
              {/* ⭐ ① LOS DOS VERBOS — arriba de todo porque cambian lo que
                  significa el resto del formulario: el mismo servicio y el
                  mismo precio son un HECHO o una RESERVA según cuál esté
                  elegido. */}
              <SelectorSegmentado
                etiqueta={t('atencionMostrador.verboLabel')}
                segmentos={[
                  { codigo: 'ahora', etiqueta: t('atencionMostrador.verboAhora') },
                  { codigo: 'agendar', etiqueta: t('atencionMostrador.verboAgendar') },
                ]}
                activo={verbo}
                /* `trabajo="eleccion"` y no el default `'vista'`: esto NO
                   cambia de vista, ELIGE QUÉ SE VA A HACER. Y no es
                   cosmético — cambia la semántica de accesibilidad de
                   tablist/tab a radiogroup/radio, que es lo que un lector
                   de pantalla necesita anunciar acá. */
                proposito="eleccion"
                onCambio={(v: string) => setVerbo(v === 'agendar' ? 'agendar' : 'ahora')}
              />
              <Texto variante="apoyo">
                {verbo === 'ahora'
                  ? t('atencionMostrador.verboAhoraDetalle')
                  : t('atencionMostrador.verboAgendarDetalle')}
              </Texto>
              {/* ⭐ S86-C · EL OFICIO SIN MENÚ LO DICE (orden de la mesa,
                  L-197: la ausencia se declara, jamás se disfraza de «no
                  hay nada»). El negocio tiene el oficio ACTIVO y aun así
                  no puede registrarlo acá — eso es una limitación nuestra
                  y se dice como tal, no como si no tuviera servicios. */}
              {(otrosOficios.paseo || otrosOficios.grooming || otrosOficios.adiestramiento) && (
                <Texto variante="apoyo">{t('atencionMostrador.oficioSinMenu')}</Texto>
              )}
              {servicios !== null && (
                <SelectorOpcion
                  etiqueta={t('atencionMostrador.servicioLabel')}
                  disposicion="grilla"
                  opciones={servicios.map((s) => ({ codigo: s.codigo, etiqueta: s.nombre }))}
                  seleccionada={servicioCodigo}
                  onSelect={elegirServicio}
                />
              )}
              {/* ⭐ S86-C ② · ¿QUIÉN LA ATIENDE? — las personas y «A la
                  pizarra», en el mismo selector y al mismo nivel: la
                  pizarra NO es un escape ni un "ninguno", es una opción
                  con el mismo peso que una persona.
                  Va DESPUÉS del servicio y ANTES del precio porque
                  responde a la pregunta del medio del flujo: qué se hace,
                  quién lo hace, cuánto cuesta. */}
              {ofreceTratante && personas !== null && (
                <SelectorOpcion
                  etiqueta={t('atencionMostrador.tratanteLabel')}
                  disposicion="tira"
                  opciones={[
                    ...personas.map((p) => ({ codigo: p.empleadoId, etiqueta: p.nombre })),
                    { codigo: A_LA_PIZARRA, etiqueta: t('atencionMostrador.aLaPizarra') },
                  ]}
                  seleccionada={tratante}
                  onSelect={setTratante}
                />
              )}
              {/* Ley 13 — si no se pudo leer a las personas, se DICE. El
                  registro sigue disponible (la ventanilla no se bloquea
                  por un lector caído), pero nadie queda creyendo que
                  eligió: la cita va a la pizarra y la pantalla lo avisa. */}
              {!ofreceTratante && (
                <Texto variante="apoyo">{t('atencionMostrador.sinPersonas')}</Texto>
              )}

              {/* ⭐ AGENDAR · el DÍA y la HORA. La grilla sale de inicios
                  REALES (`obtenerIniciosVet`) — la puerta no ofrece lo que
                  va a rechazar (Ley 23). */}
              {verbo === 'agendar' && (
                <>
                  <SelectorOpcion
                    etiqueta={t('atencionMostrador.diaLabel')}
                    disposicion="tira"
                    opciones={dias.map((d) => ({
                      codigo: d,
                      etiqueta: `${diaSemanaCorto(d, idioma)} ${d.slice(8, 10)}`,
                    }))}
                    seleccionada={fecha}
                    onSelect={setFecha}
                  />
                  {fecha !== undefined && servicioCodigo !== undefined && (
                    <>
                      {cargandoHoras && <Texto variante="apoyo">{t('atencionMostrador.buscandoHoras')}</Texto>}
                      {/* ⚠️ D-653 — LOS TRES ESTADOS NO SE COLAPSAN:
                          · `null` = NO SE PUDO LEER (el acceso a la
                            mascota puede caducar entre encontrarla y
                            agendarla). **Se DICE.** Mostrar una grilla
                            vacía acá se leería como «no hay horarios» y
                            mandaría a probar otro día para siempre,
                            contra un problema que no es de agenda.
                          · `[]` = ese día no tiene inicios libres.
                          · con horas = la grilla. */}
                      {!cargandoHoras && horas === null && (
                        <Texto variante="apoyo">{t('atencionMostrador.horasNoSePudo')}</Texto>
                      )}
                      {!cargandoHoras && horas !== null && horas.length === 0 && (
                        <Texto variante="apoyo">{t('atencionMostrador.sinHoras')}</Texto>
                      )}
                      {!cargandoHoras && horas !== null && horas.length > 0 && (
                        <SelectorOpcion
                          etiqueta={t('atencionMostrador.horaLabel')}
                          disposicion="grilla"
                          opciones={horas.map((h) => ({ codigo: h, etiqueta: h }))}
                          seleccionada={hora}
                          onSelect={setHora}
                        />
                      )}
                    </>
                  )}
                </>
              )}
              <Campo
                label={t('atencionMostrador.precioLabel')}
                placeholder="0.00"
                value={precio}
                onChangeText={setPrecio}
                keyboardType="decimal-pad"
              />
              <Boton
                variante="primario"
                bloque
                etiqueta={t('atencionMostrador.registrarAtencion')}
                cargando={ocupado}
                deshabilitado={!puedeRegistrar}
                onPress={() => void registrar()}
              />
            </>
          )
        ) : (
          <>
            {/* D-434: el registrable de vacuna, solo en vacunación.
                S76-B3 (D-524, ley madre §2): SOLO para quien FIRMA —
                recepción recibe y cobra (ventanilla) y la pantalla dice
                el flujo de dos personas en una frase; el selector que
                le rebotaría no existe para ella (Ley 23). */}
            {esVacunacion && firmaClinica && (
              <View style={{ gap: spacing[2] }}>
                <SelectorOpcion
                  etiqueta={t('atencionMostrador.vacunaLabel')}
                  disposicion="grilla"
                  opciones={[
                    ...catalogoVacunas.map((v) => ({ codigo: v.codigo, etiqueta: v.nombre })),
                    { codigo: OTRA, etiqueta: t('atencionMostrador.vacunaOtra') },
                  ]}
                  seleccionada={vacunaSel}
                  onSelect={setVacunaSel}
                />
                {vacunaSel === OTRA && (
                  <Campo
                    label={t('atencionMostrador.vacunaLibreLabel')}
                    placeholder={t('atencionMostrador.vacunaLibrePlaceholder')}
                    value={vacunaLibre}
                    onChangeText={setVacunaLibre}
                  />
                )}
              </View>
            )}
            {esVacunacion && !firmaClinica && (
              <Texto variante="apoyo">{t('atencionMostrador.vacunaPendienteFirma')}</Texto>
            )}
            <Texto variante="seccion">
              {t('atencionMostrador.cobroTitulo')}
            </Texto>
            <Campo
              label={t('atencionMostrador.montoLabel')}
              placeholder="0.00"
              value={monto}
              onChangeText={setMonto}
              keyboardType="decimal-pad"
            />
            {/* S83-C25 ② — ELECCIÓN. El medio de cobro SE PERSISTE con el
                cobro presencial: no es una vista del mismo dato, es el
                dato. Y su posición lo confirma — vive entre el Campo del
                monto y el botón "Registrar cobro": es un campo del
                formulario, no un conmutador de pantalla. */}
            <SelectorSegmentado
              proposito="eleccion"
              etiqueta={t('atencionMostrador.medioLabel')}
              segmentos={medioSegmentos}
              activo={medio}
              onCambio={(c) => setMedio(c as MedioCobro)}
            />
            <Boton
              variante="primario"
              bloque
              etiqueta={t('atencionMostrador.registrarCobro')}
              cargando={ocupado}
              deshabilitado={!puedeCobrar}
              onPress={() => void finalizar(true)}
            />
            <Boton
              variante="compacto"
              etiqueta={t('atencionMostrador.sinCobro')}
              deshabilitado={ocupado}
              onPress={() => void finalizar(false)}
            />
          </>
        )}
      </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
