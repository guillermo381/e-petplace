/**
 * LA GUARDERÍA · CONFIGURACIÓN (S107-C, tanda 3).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * EL RECORRIDO QUE ESTA PANTALLA TIENE QUE CUMPLIR (plan §6, verbatim):
 * *«Abro mi portal y doy de alta la guardería: cuántos animales recibo por día
 * (8), en qué franja recojo (7:00–9:00), en cuál devuelvo (16:30–18:30)…»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── LO QUE ESTA PANTALLA HACE, Y LO QUE NO ───────────────────────────────
 * HACE: la **capacidad por día** y **las dos ventanas**. Las dos mitades
 * tienen su motor publicado por A (`guarderia-config`) y se guardan de verdad.
 *
 * 🔴 **NO HACE el precio, ni el paquete, ni la mensualidad, y no es un
 * recorte de diseño: no existe la puerta.** Medido — hay
 * `veterinaria-oferta` y `adiestramiento-oferta`, y **no hay
 * `guarderia-oferta`**; la oferta vive en `prestador_servicios` y ningún
 * wrapper la escribe para este oficio. *Montar un campo de precio que no
 * guarda sería la pantalla mintiendo.* Entra cuando A publique esa puerta —
 * y con ella entra el *«quedo visible para reservas»* del recorrido, que **es
 * la oferta, no la capacidad**.
 *
 * ── LOS DÍAS DE LA FRANJA NO SE EDITAN EN v1, Y LA RAZÓN ES DE MOTOR ─────
 * `definir_franja_guarderia` upserta por `(prestador, tipo, dias_semana)` y
 * **no hay camino para retirar una franja** (la tabla tiene `activo`, el
 * wrapper no lo expone). ⇒ si la pantalla dejara mover el patrón de días,
 * cambiar de L-V a L-S **crearía una segunda franja y dejaría viva la
 * primera**, sin forma de matarla. *Se usa el default del motor (L-V) para
 * que la clave del upsert sea estable.* **Hueco declarado, no inventado:
 * cuando exista el retiro, el patrón se abre.**
 *
 * ── EL ORDEN DE GUARDADO NO ES ARBITRARIO ───────────────────────────────
 * Recogida primero, devolución después. El motor valida que **la recogida
 * termine antes de que empiece la devolución** contra las filas VIVAS, así
 * que guardar al revés puede rebotar contra la franja vieja. El rebote es
 * correcto y su voz lo dice; el orden simplemente evita el falso choque.
 *
 * ── LA CAPACIDAD SE LEE DEL CUPO, PORQUE NO HAY LECTOR DE ESPACIOS ──────
 * ⚠️ A publicó `definirEspacioGuarderia` (escritura) y **ningún lector de
 * espacios**. La capacidad de hoy se deriva de `obtenerCupoGuarderia` — que
 * devuelve la SUMA de los espacios confirmados. Alcanza para v1 (un lugar,
 * un número, que es lo que el recorrido pide) y **se declara para que nadie
 * lea esto como el modelo final**: con dos salas hace falta el lector.
 *
 * El espacio se guarda siempre con el MISMO nombre (`NOMBRE_ESPACIO`), que es
 * la clave del upsert del motor: re-guardar edita, jamás duplica.
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  FichaFranja,
  Hoja,
  HojaScroll,
  FichaDeOferta,
  SeccionPlegable,
  Interruptor,
  SelectorOpcion,
  SliderPrecio,
  StepperCantidad,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  definirEspacioGuarderia,
  definirFranjaGuarderia,
  definirOfertaGuarderia,
  definirPaqueteGuarderia,
  obtenerPaquetesGuarderia,
  type TamanoPaquete,
  obtenerCupoGuarderia,
  obtenerFranjasGuarderia,
  obtenerMiPrestador,
  obtenerOfertaGuarderiaPropia,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { useGateGestor } from '@/lib/gate-gestor';
import { GateAjeno } from '@/components/gate-ajeno';
import { GateRoto } from '@/components/gate-roto';
import { HORAS } from '@/components/seccion-horarios';

/** La clave del upsert del motor. Estable a propósito: re-guardar EDITA. */
const NOMBRE_ESPACIO = 'Principal';

const CAP_MIN = 1;
const CAP_MAX = 60;

/* El riel del precio del día. Arranca en el piso y jamás en vacío — el
   precedente del grooming (S59-B6). Paquete y mensualidad NO usan slider: son
   múltiplos de esto (diez días, un mes) y un riel de $5–$60 no los cubre. */
/**
 * Los tamaños que el lugar puede ofrecer. 🔴 **La lista está acá una sola vez
 * y NO PUEDE DESINCRONIZARSE EN SILENCIO**: `satisfies` prueba que cada valor
 * es un `TamanoPaquete` válido, y el guard de exhaustividad de abajo **no
 * compila** si el tipo gana un tamaño que esta lista no tiene.
 *
 * *Los tamaños son DATO en el motor (un `CHECK`, no columnas) — un cuarto
 * tamaño es un `INSERT`. Esta pantalla no puede leer el `CHECK`, así que lo
 * que hace es imposible quedarse atrás de él sin que el typecheck lo grite.*
 */
const TAMANOS = [5, 10, 15] as const satisfies readonly TamanoPaquete[];
type _FaltaAlgunTamano = Exclude<TamanoPaquete, (typeof TAMANOS)[number]>;
/* Si el motor suma un tamaño y esta lista no, acá rompe el build. */
const _GUARD_TAMANOS: _FaltaAlgunTamano extends never ? true : never = true;
void _GUARD_TAMANOS;

/**
 * ── LOS RIELES, CALIBRADOS A PROPÓSITO ──────────────────────────────────
 * 🔴 **El paso es una decisión, no un default.** Con pasos finos el riel tiene
 * cientos de posiciones repartidas en el ancho de la pantalla: **cada posición
 * mide dos o tres píxeles y un roce cambia el precio.** *Un control de plata
 * que se mueve sin que el prestador quiera moverlo es peor que uno tosco.*
 *
 * Los tres se calibran para que **un paso sea un salto que alguien quiso dar**,
 * y el número exacto queda alcanzable igual: las tres fichas montan el riel con
 * `edicionNumerica`, así que **se puede tipear**. *El riel explora el rango; el
 * teclado fija el número.*
 */
/** Día: $5–$60 de a $1. Un día de guardería no se decide en centavos. */
const PASOS_PRECIO: string[] = [];
for (let c = 500; c <= 6000; c += 100) PASOS_PRECIO.push((c / 100).toFixed(2));

/** Paquete: $20–$600 de a $10 — es un múltiplo de días, se mueve en decenas. */
const PASOS_PAQUETE: string[] = [];
for (let c = 2000; c <= 60000; c += 1000) PASOS_PAQUETE.push((c / 100).toFixed(2));

/** Mensual: $50–$900 de a $25 — el salto más grande, porque es el monto más grande. */
const PASOS_MENSUAL: string[] = [];
for (let c = 5000; c <= 90000; c += 2500) PASOS_MENSUAL.push((c / 100).toFixed(2));

/**
 * 🔴 EL ÍNDICE CAE AL PASO MÁS CERCANO, JAMÁS A CERO.
 *
 * Con `indexOf` un valor que no está en la grilla —$12,50 guardado cuando el
 * riel ahora salta de a $1— **caía al índice 0**, o sea al piso del rango: el
 * prestador abría su taller y **veía $5,00 donde había guardado $12,50**, y al
 * guardar lo perdía sin un solo error. *Cambiar el paso de un riel puede
 * reescribir precios ya guardados, y eso no se ve.*
 */
function indiceMasCercano(pasos: string[], v: number): number {
  let mejor = 0;
  let dist = Infinity;
  for (let i = 0; i < pasos.length; i += 1) {
    const d = Math.abs(Number(pasos[i]) - v);
    if (d < dist) {
      dist = d;
      mejor = i;
    }
  }
  return mejor;
}
const indiceDePrecio = (v: number): number => indiceMasCercano(PASOS_PRECIO, v);
const indiceDePaquete = (v: number): number => indiceMasCercano(PASOS_PAQUETE, v);
const indiceDeMensual = (v: number): number => indiceMasCercano(PASOS_MENSUAL, v);


/** 'HH:MM:SS' del motor → 'HH:MM' de la grilla. El motor manda la verdad; la
 *  pantalla sólo la recorta para mostrarla (jamás la reinterpreta). */
function aHoraCorta(h: string): string {
  return h.slice(0, 5);
}

type Estado =
  | { fase: 'cargando' }
  | { fase: 'roto' }
  | {
      fase: 'listo';
      prestadorId: string;
      sobrevendidoHoy: boolean;
      /** null = todavía no publicó. **No es un error**: es el camino de alta. */
      publicada: boolean;
      /** 🔴 DERIVADA de las franjas por el motor — jamás se teclea. */
      jornadaMinutos: number | null;
    };

type QueHora = null | 'recogidaDesde' | 'recogidaHasta' | 'devolucionDesde' | 'devolucionHasta';

export default function TallerGuarderia() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const { gate, reintentarGate } = useGateGestor();

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [intento, setIntento] = useState(0);
  const [guardando, setGuardando] = useState(false);

  // EL BORRADOR — sobrevive a los reintentos de carga.
  const [capacidad, setCapacidad] = useState(8);
  const [recogidaDesde, setRecogidaDesde] = useState('07:00');
  const [recogidaHasta, setRecogidaHasta] = useState('09:00');
  const [devolucionDesde, setDevolucionDesde] = useState('16:30');
  const [devolucionHasta, setDevolucionHasta] = useState('18:30');
  const [queHora, setQueHora] = useState<QueHora>(null);
  const [iPrecio, setIPrecio] = useState(indiceDePrecio(12));
  /**
   * Los tres tamaños con su estado. 🔴 **`existe` y `activo` son cosas
   * distintas** (contrato §): *no estar en la respuesta* = **nunca se
   * encendió**; *estar con `activo:false`* = **apagado con su precio
   * guardado**. La pantalla los distingue sin preguntarle nada a nadie: el
   * segundo muestra su precio, el primero no tiene ninguno que mostrar.
   */
  const [paquetes, setPaquetes] = useState<
    Record<number, { existe: boolean; activo: boolean; iPrecio: number }>
  >({});
  const [ofreceMensual, setOfreceMensual] = useState(false);
  const [iMensual, setIMensual] = useState(indiceDeMensual(200));
  /* 🔴 El diario nace PRENDIDO: es la unidad base del oficio, y arrancar
     apagado le pediría al prestador que encienda lo obvio. */
  const [ofreceDiario, setOfreceDiario] = useState(true);
  /* Arranca con el universo del servicio; si la oferta existe, gana lo suyo. */
  const [especies, setEspecies] = useState<string[]>(['perro', 'gato']);
  /* Los horarios ya están guardados y no hacen falta para tocar precios;
     los precios sí son a lo que se viene. */
  const [horariosAbierto, setHorariosAbierto] = useState(false);
  const [preciosAbierto, setPreciosAbierto] = useState(true);
  /** El modal de guardar: 'informa' (un botón) · 'pregunta' (dos). */
  const [aviso, setAviso] = useState<null | 'informa' | 'pregunta'>(null);

  useEffect(() => {
    if (gate !== 'permitido') return;
    let vigente = true;
    setEstado({ fase: 'cargando' });
    void (async () => {
      const p = await obtenerMiPrestador();
      if (!vigente) return;
      if (!p.ok || p.data === null) {
        setEstado({ fase: 'roto' });
        return;
      }
      const prestadorId = p.data.id;

      /* Hoy en fecha LOCAL, jamás `toISOString()`: eso da UTC y después de las
         19:00 en Guayaquil devuelve el día siguiente (el defecto que S55 midió
         en su harness). El motor cuenta por fecha local del lugar. */
      const ahora = new Date();
      const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;

      const [franjas, cupo, oferta, paqs] = await Promise.all([
        obtenerFranjasGuarderia(prestadorId),
        obtenerCupoGuarderia(prestadorId, hoy, hoy),
        obtenerOfertaGuarderiaPropia(prestadorId),
        obtenerPaquetesGuarderia(prestadorId),
      ]);
      if (!vigente) return;

      /* 🔴 Un fallo de lectura JAMÁS se disfraza de «todavía no configuraste»
         (Ley 13 / L-178): si el servidor no contestó, la pantalla lo dice y
         ofrece reintentar — no pinta un formulario vacío que, al guardarse,
         pisaría una configuración que sí existe. */
      if (!franjas.ok || !cupo.ok || !oferta.ok || !paqs.ok) {
        setEstado({ fase: 'roto' });
        return;
      }

      const r = franjas.data.find((f) => f.tipo === 'recogida');
      const d = franjas.data.find((f) => f.tipo === 'devolucion');
      if (r !== undefined) {
        setRecogidaDesde(aHoraCorta(r.desde));
        setRecogidaHasta(aHoraCorta(r.hasta));
      }
      if (d !== undefined) {
        setDevolucionDesde(aHoraCorta(d.desde));
        setDevolucionHasta(aHoraCorta(d.hasta));
      }
      const hoyCupo = cupo.data[0];
      if (hoyCupo !== undefined && hoyCupo.capacidad > 0) setCapacidad(hoyCupo.capacidad);

      const o = oferta.data;
      if (o !== null) {
        /* ✏️ S107-A + S107-C, LAS DOS MITADES (cruce resuelto en el merge):
           · de A — `precio` puede ser null: el día dejó de ser obligatorio
             (firma 29-ago). Sin precio, el riel arranca donde arrancaba;
             **no se inventa un 0, que sería «gratis»**.
           · de C — `ofreceDiario` es lo que distingue *«no ofrece día»* de
             *«ofrece a un precio fuera de la grilla»*. Por eso se enciende
             DENTRO del guard: con precio null no hay oferta de día que
             encender, y prenderlo igual haría que el taller mostrara un día
             suelto que el lugar no vende. */
        if (o.precio !== null) {
          setIPrecio(indiceDePrecio(o.precio));
          setOfreceDiario(true);
        }
        setOfreceMensual(o.precioMensual !== null);
        if (o.precioMensual !== null) setIMensual(indiceDeMensual(o.precioMensual));
      }

      /* Lo que NO vino en la respuesta queda `existe:false` — nunca se
         encendió — y por eso arranca sin precio: no hay ninguno que mostrar. */
      const mapa: Record<number, { existe: boolean; activo: boolean; iPrecio: number }> = {};
      for (const tam of TAMANOS) mapa[tam] = { existe: false, activo: false, iPrecio: 0 };
      for (const pq of paqs.data) {
        mapa[pq.tamano] = { existe: true, activo: pq.activo, iPrecio: indiceDePaquete(pq.precio) };
      }
      setPaquetes(mapa);

      setEstado({
        fase: 'listo',
        prestadorId,
        sobrevendidoHoy: hoyCupo?.sobrevendido ?? false,
        publicada: o !== null && o.activo,
        jornadaMinutos: o?.jornadaMinutos ?? null,
      });
    })();
    return () => {
      vigente = false;
    };
  }, [gate, intento]);

  /** ¿Hay alguna modalidad con precio encendida? */
  const hayAlgunPrecio =
    ofreceDiario || ofreceMensual || TAMANOS.some((tam) => paquetes[tam]?.activo === true);

  /**
   * El botón de guardar **no guarda directo**: primero decide si hay algo que
   * decir. Dos avisos y sólo dos (firma de la mesa):
   * · **sin ningún precio** → PREGUNTA, dos botones. *Guardar sin publicar es
   *   una decisión, no un accidente, y por eso se confirma.*
   * · **con precio pero sin el diario** → INFORMA, un botón. *No se pregunta
   *   lo que no tiene alternativa: sólo se dice qué va a pasar.*
   */
  /** Lo que queda encendido, nombrado — «no se publica» sin decir QUÉ queda
   *  deja al prestador adivinando qué configuró. */
  const modalidadesEncendidas = [
    ...(TAMANOS.filter((tam) => paquetes[tam]?.activo === true).map((tam) =>
      t('tallerGuarderia.estadias', { n: tam }),
    )),
    ...(ofreceMensual ? [t('tallerGuarderia.mensual')] : []),
  ].join(' · ');

  /* 🔴 SIN `useCallback` A PROPÓSITO: memorizarlo con deps
     `[hayAlgunPrecio, ofreceDiario]` capturaría un `guardar` VIEJO —el de un
     render anterior, con precios anteriores— y guardaría lo que ya no está en
     pantalla. *Es el closure obsoleto que costó tres diagnósticos en S92
     (L-221), y acá el síntoma sería peor: no falla, guarda otra cosa.* */
  const alGuardar = () => {
    if (!hayAlgunPrecio) {
      setAviso('pregunta');
      return;
    }
    if (!ofreceDiario) {
      setAviso('informa');
      return;
    }
    void guardar();
  };

  const guardar = useCallback(async () => {
    if (estado.fase !== 'listo' || guardando) return;
    setAviso(null);
    setGuardando(true);

    const espacio = await definirEspacioGuarderia({
      prestadorId: estado.prestadorId,
      nombre: NOMBRE_ESPACIO,
      capacidadPorDia: capacidad,
    });
    if (!espacio.ok) {
      mostrar({ texto: espacio.mensaje, variante: 'error' });
      setGuardando(false);
      return;
    }

    /* Recogida ANTES que devolución: ver el encabezado. */
    const rec = await definirFranjaGuarderia({
      prestadorId: estado.prestadorId,
      tipo: 'recogida',
      desde: recogidaDesde,
      hasta: recogidaHasta,
    });
    if (!rec.ok) {
      mostrar({ texto: rec.mensaje, variante: 'error' });
      setGuardando(false);
      return;
    }

    const dev = await definirFranjaGuarderia({
      prestadorId: estado.prestadorId,
      tipo: 'devolucion',
      desde: devolucionDesde,
      hasta: devolucionHasta,
    });
    if (!dev.ok) {
      /* 🔴 La capacidad y la recogida YA se guardaron. La voz lo dice en vez
         de sugerir que no pasó nada: *un «no se pudo guardar» sobre algo que
         se guardó a medias manda al prestador a re-hacer lo que ya está.* */
      mostrar({ texto: t('tallerGuarderia.devolucionNoGuardo', { motivo: dev.mensaje }), variante: 'error' });
      setGuardando(false);
      return;
    }

    /* 🔴 LA OFERTA VA ÚLTIMA, Y NO ES ORDEN DE CONVENIENCIA: publicar EXIGE
       franjas Y capacidad, y el motor lo rebota hablado
       (`franjas_no_configuradas` / `sin_espacios_configurados`). Guardarla
       antes rebotaría contra lo que esta misma pantalla está por escribir. */
    /* ⭐ LA OFERTA SE GUARDA SIEMPRE — la ruta sin precio del día quedó
       abierta. Antes esta llamada era condicional porque el motor exigía
       `precio_dia` **y su lector rechazaba un precio nulo**: guardar sin día
       dejaba el taller imposible de volver a abrir. **Las dos mitades están
       curadas** (`precioDia?: number | null` + `precio: number | null` en el
       retorno), así que el día suelto pasa a ser una modalidad más.
       🔴 `null` y jamás `0`: **cero sería «gratis»**. */
    const oferta = await definirOfertaGuarderia({
      prestadorId: estado.prestadorId,
      precioDia: ofreceDiario ? Number(PASOS_PRECIO[iPrecio]) : null,
      precioMensual: ofreceMensual ? Number(PASOS_MENSUAL[iMensual]) : null,
      especies,
    });
    if (!oferta.ok) {
      /* Los rebotes de la firma llegan con SU voz desde el wrapper: dicen QUÉ
         falta, así el prestador sabe adónde ir. */
      mostrar({ texto: oferta.mensaje, variante: 'error' });
      setGuardando(false);
      setIntento((n) => n + 1);
      return;
    }

    /* Los paquetes, después de la oferta. Se guarda **sólo lo que el
       prestador tocó alguna vez** (`existe` o encendido ahora): un tamaño que
       nunca prendió **no se escribe**, para que su ausencia siga significando
       «nunca lo ofrecí» y no «lo ofrecí en cero». */
    for (const tam of TAMANOS) {
      const pq = paquetes[tam];
      if (pq === undefined || (!pq.existe && !pq.activo)) continue;
      const r = await definirPaqueteGuarderia({
        prestadorId: estado.prestadorId,
        tamano: tam,
        precio: Number(PASOS_PAQUETE[pq.iPrecio]),
        activo: pq.activo,
      });
      if (!r.ok) {
        mostrar({ texto: r.mensaje, variante: 'error' });
        setGuardando(false);
        setIntento((n) => n + 1);
        return;
      }
    }

    setGuardando(false);
    mostrar({ texto: t('taller.guardado'), variante: 'exito' });
    /* ⭐ Vuelve a la portada del mundo, no se queda en edición. *Quedarse en
       el formulario después de guardar deja al prestador sin saber si pasó
       algo* — y la portada es justamente la que muestra el resultado: su
       resumen se recarga con `useFocusEffect`. */
    router.replace('/guarderia');
  }, [estado, guardando, capacidad, recogidaDesde, recogidaHasta, devolucionDesde, devolucionHasta,
      iPrecio, paquetes, ofreceDiario, ofreceMensual, iMensual, especies, mostrar, t]);

  if (gate === 'verificando' || estado.fase === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('tallerGuarderia.titulo')} atras onAtras={() => router.back()} />
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={72} />
            <Esqueleto alto={120} />
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }
  if (gate === 'denegado') return <GateAjeno />;
  if (gate === 'roto') return <GateRoto onReintentar={reintentarGate} />;
  if (estado.fase === 'roto') return <GateRoto onReintentar={() => setIntento((n) => n + 1)} />;

  const horaElegida =
    queHora === 'recogidaDesde' ? recogidaDesde
    : queHora === 'recogidaHasta' ? recogidaHasta
    : queHora === 'devolucionDesde' ? devolucionDesde
    : queHora === 'devolucionHasta' ? devolucionHasta
    : null;

  const elegirHora = (h: string) => {
    if (queHora === 'recogidaDesde') setRecogidaDesde(h);
    else if (queHora === 'recogidaHasta') setRecogidaHasta(h);
    else if (queHora === 'devolucionDesde') setDevolucionDesde(h);
    else if (queHora === 'devolucionHasta') setDevolucionHasta(h);
    setQueHora(null);
  };

  /* El mínimo de la grilla: una ventana no puede terminar antes de empezar.
     La puerta ya lo rebota (`franja_invertida`); acá la puerta NO OFRECE lo
     que va a rechazar (Ley 23 — el principio de la puerta, S72-B). */
  const minimoDeLaGrilla =
    queHora === 'recogidaHasta' ? recogidaDesde
    : queHora === 'devolucionHasta' ? devolucionDesde
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('tallerGuarderia.titulo')} atras onAtras={() => router.back()} />

      <ScrollView
        contentContainerStyle={{ padding: spacing[5], gap: spacing[6], paddingBottom: insets.bottom + spacing[8] }}
      >
        {/* ── LA CAPACIDAD ── */}
        <View style={{ gap: spacing[3] }}>
          <Texto variante="titulo">{t('tallerGuarderia.capacidadTitulo')}</Texto>
          <Texto variante="apoyo">{t('tallerGuarderia.capacidadApoyo')}</Texto>
          <StepperCantidad
            etiqueta={t('tallerGuarderia.capacidadEtiqueta')}
            valor={capacidad}
            min={CAP_MIN}
            max={CAP_MAX}
            onCambio={setCapacidad}
            registro="oficio"
          />
          {/* 🔴 El día sobrevendido se DECLARA y no se resuelve solo: el motor
              nunca cancela una reserva por bajar la capacidad. Si no se
              mostrara, el prestador bajaría el número y no se enteraría de que
              hoy tiene más animales que lugares. */}
          {estado.sobrevendidoHoy ? (
            <Tarjeta relleno="normal" elevacion="reposo">
              <Texto variante="cuerpo">{t('tallerGuarderia.sobrevendido')}</Texto>
            </Tarjeta>
          ) : null}
        </View>

        {/* ── ESPECIES QUE RECIBES — arriba de todo ──
            El patrón es el de grooming, **reusado y no reconstruido**: el
            mismo `SelectorOpcion` en fila, múltiple, con acento de oficio.
            🔴 **El universo es del TIPO y la elección es del PRESTADOR** (la
            ley de las dos capas): perro y gato es lo que la guardería admite,
            y él se queda con lo suyo dentro de eso. **El server recorta igual**
            — la pantalla ofrece, no autoriza. */}
        <View style={{ gap: spacing[3] }}>
          <Texto variante="seccion">{t('tallerGuarderia.especiesTitulo')}</Texto>
          <SelectorOpcion
            etiqueta={t('tallerGuarderia.especiesTitulo')}
            etiquetaVisible={false}
            disposicion="fila"
            acento="oficio"
            multiple
            opciones={[
              { codigo: 'perro', etiqueta: t('tallerGuarderia.especiePerro') },
              { codigo: 'gato', etiqueta: t('tallerGuarderia.especieGato') },
            ]}
            seleccionadas={especies}
            onSelect={(codigo) =>
              setEspecies((prev) =>
                prev.includes(codigo) ? prev.filter((e) => e !== codigo) : [...prev, codigo],
              )
            }
          />
          {/* Quedarse sin ninguna no es un error de tipeo: es una oferta que
              no puede recibir a nadie, y se dice antes de guardar. */}
          {especies.length === 0 ? (
            <Texto variante="apoyo">{t('tallerGuarderia.especiesMinima')}</Texto>
          ) : null}
        </View>

        {/* ── HORARIOS — cerrado al entrar: ya están guardados y no hace falta
            verlos para tocar los precios, que es a lo que se viene. ── */}
        <SeccionPlegable
          titulo={t('tallerGuarderia.franjasTitulo')}
          detalle={t('tallerGuarderia.franjasResumen', {
            recogeDesde: recogidaDesde, recogeHasta: recogidaHasta,
            devuelveDesde: devolucionDesde, devuelveHasta: devolucionHasta,
          })}
          abierta={horariosAbierto}
          onCambiar={setHorariosAbierto}
        >
          <Texto variante="apoyo">{t('tallerGuarderia.franjasApoyo')}</Texto>
          <FichaFranja
            recogida={{ rotulo: t('tallerGuarderia.recogida'), desde: recogidaDesde, hasta: recogidaHasta }}
            devolucion={{ rotulo: t('tallerGuarderia.devolucion'), desde: devolucionDesde, hasta: devolucionHasta }}
            conSuperficie
          />
          <Celda interactiva accessibilityRole="button" titulo={t('tallerGuarderia.recogidaDesde')} metadataMono={recogidaDesde} onPress={() => setQueHora('recogidaDesde')} />
          <Celda interactiva accessibilityRole="button" titulo={t('tallerGuarderia.recogidaHasta')} metadataMono={recogidaHasta} onPress={() => setQueHora('recogidaHasta')} />
          <Celda interactiva accessibilityRole="button" titulo={t('tallerGuarderia.devolucionDesde')} metadataMono={devolucionDesde} onPress={() => setQueHora('devolucionDesde')} />
          <Celda interactiva accessibilityRole="button" titulo={t('tallerGuarderia.devolucionHasta')} metadataMono={devolucionHasta} onPress={() => setQueHora('devolucionHasta')} />
        </SeccionPlegable>

        {/* ── TUS PRECIOS — abierto al entrar: es a lo que se viene. EN PLURAL,
            porque adentro viven tres modalidades y no una. ── */}
        <SeccionPlegable
          titulo={t('tallerGuarderia.preciosTitulo')}
          abierta={preciosAbierto}
          onCambiar={setPreciosAbierto}
        >
          {/* ① DIARIO — prendido por defecto: es la unidad base del oficio. */}
          <FichaDeOferta
            /* `tamano: 1` es honesto —un día— y sólo alimenta el espejo, que
               esta ficha no dibuja (sin `vozEquivalente`). */
            /* `null` = **sin unidad**: un día suelto y un mes no se miden en
               «estadías», y la pieza ya lo admite. Antes iba un `1` inventado
               que sólo alimentaba un espejo que estas dos no dibujan. */
            tamano={null}
            registro="oficio"
            rotulo={t('tallerGuarderia.diario')}
            precio={ofreceDiario ? Number(PASOS_PRECIO[iPrecio]) : null}
            precioDiaSuelto={null}
            encendido={ofreceDiario}
            /* Se conserva la forma FUNCIONAL (`v => !v`) y no `(v) => set(v)`:
               el toggle nuevo manda el valor nuevo, pero depender de eso ataría
               esta pantalla a un detalle del `Interruptor`. Alternar sobre el
               estado previo es correcto mande lo que mande. */
            onCambio={setOfreceDiario}
            campoPrecio={
              ofreceDiario ? (
                /* ☠️ S107-C · EL RESUMEN DE «CUÁNTO VAS A RECIBIR», RETIRADO
                   (firma del founder). e-PetPlace cobra 10 %, **pero el
                   prestador asume además la comisión del motor de pagos y la
                   bancaria**: el número mostraba un neto que no es el que le
                   llega. *Mejor no decirlo que fijarle una expectativa
                   errada* — y un número de plata equivocado no se corrige
                   después: se corrige cuando cobra menos de lo que leyó. */
                <SliderPrecio
                  etiqueta={t('tallerGuarderia.precioDia')}
                  pasos={PASOS_PRECIO}
                  indice={iPrecio}
                  onCambio={setIPrecio}
                  registro="aa"
                  edicionNumerica
                />
              ) : undefined
            }
          />

          {/* ② PAQUETES — los tres se pintan siempre; cada toggle enciende Y
              expande en el mismo acto. */}
          <Texto variante="seccion">{t('tallerGuarderia.paquetesTitulo')}</Texto>
          <Texto variante="apoyo">{t('tallerGuarderia.paquetesApoyo')}</Texto>
          {TAMANOS.map((tam) => {
            const pq = paquetes[tam] ?? { existe: false, activo: false, iPrecio: 0 };
            return (
              <FichaDeOferta
                key={tam}
                tamano={tam}
                registro="oficio"
                rotulo={t('tallerGuarderia.estadias', { n: tam })}
                /* `null` = nunca encendido. El apagado CON precio lo manda
                   igual, y por eso se distingue del que nunca existió. */
                precio={pq.existe || pq.activo ? Number(PASOS_PAQUETE[pq.iPrecio]) : null}
                /* 🔴 EL GUARD ES DE C Y GANA (merge S107-A): el espejo compara
                   contra el día suelto SOLO si hay día suelto. Sin él, la pieza
                   omite la comparación en vez de inventar un 0 %. *Mi versión
                   pasaba `PASOS_PRECIO[iPrecio]` siempre — o sea comparaba
                   contra un precio que el lugar podía no estar ofreciendo.*
                   La cuenta la hace la pieza; acá sólo se dice. **El número es
                   uno solo o no sirve**, y por eso no se recalcula. */
                precioDiaSuelto={ofreceDiario ? Number(PASOS_PRECIO[iPrecio]) : null}
                vozEquivalente={(e) =>
                  e.deltaPct === null || e.direccion === 'sin_comparacion'
                    ? t('tallerGuarderia.equivalenteSimple', { porDia: e.porDia.toFixed(2) })
                    : e.direccion === 'igual'
                      ? t('tallerGuarderia.equivalenteIgual', { porDia: e.porDia.toFixed(2) })
                      : t(
                          e.direccion === 'menos'
                            ? 'tallerGuarderia.equivalenteMenos'
                            : 'tallerGuarderia.equivalenteMas',
                          { porDia: e.porDia.toFixed(2), pct: e.deltaPct.toFixed(0) },
                        )
                }
                encendido={pq.activo}
                /* La pieza reporta el estado NUEVO; se usa ese y no se
                   invierte el propio — invertir a ciegas se desincroniza si la
                   pieza alguna vez decide no alternar. */
                onCambio={(encendido) =>
                  setPaquetes((m) => ({
                    ...m,
                    [tam]: { ...(m[tam] ?? { existe: false, iPrecio: 0 }), activo: encendido },
                  }))
                }
                campoPrecio={
                  pq.activo ? (
                    <SliderPrecio
                      etiqueta={t('tallerGuarderia.precioDelPaquete', { n: tam })}
                      pasos={PASOS_PAQUETE}
                      indice={pq.iPrecio}
                      onCambio={(i) =>
                        setPaquetes((m) => ({ ...m, [tam]: { ...(m[tam] ?? { existe: false, activo: true }), iPrecio: i } }))
                      }
                      registro="aa"
                      edicionNumerica
                    />
                  ) : undefined
                }
              />
            );
          })}

          {/* ③ MENSUAL — la misma ficha, con su precio adentro. Antes tenía un
              `Campo` suelto fuera de toda ficha; ahora vive como sus hermanas. */}
          <FichaDeOferta
            tamano={1}
            registro="oficio"
            rotulo={t('tallerGuarderia.mensual')}
            precio={ofreceMensual ? Number(PASOS_MENSUAL[iMensual]) : null}
            precioDiaSuelto={null}
            encendido={ofreceMensual}
            onCambio={setOfreceMensual}
            campoPrecio={
              ofreceMensual ? (
                <SliderPrecio
                  etiqueta={t('tallerGuarderia.precioMensual')}
                  pasos={PASOS_MENSUAL}
                  indice={iMensual}
                  onCambio={setIMensual}
                  registro="aa"
                  edicionNumerica
                />
              ) : undefined
            }
          />
        </SeccionPlegable>

        {/* ── ASÍ LO VE EL DUEÑO — el espejo, patrón de grooming.
            🔴 **Son LAS MISMAS PIEZAS que monta la familia**, no una maqueta:
            si fueran otras, el prestador estaría mirando algo que nadie ve. */}
        <View style={{ gap: spacing[3] }}>
          <Texto variante="seccion">{t('tallerGuarderia.espejoTitulo')}</Texto>
          <Texto variante="apoyo">{t('tallerGuarderia.espejoApoyo')}</Texto>
          <FichaFranja
            recogida={{ rotulo: t('tallerGuarderia.recogida'), desde: recogidaDesde, hasta: recogidaHasta }}
            devolucion={{ rotulo: t('tallerGuarderia.devolucion'), desde: devolucionDesde, hasta: devolucionHasta }}
            conSuperficie
          />
          {ofreceDiario ? (
            <FichaDeOferta tamano={null} rotulo={t('tallerGuarderia.diario')}
              precio={Number(PASOS_PRECIO[iPrecio])} precioDiaSuelto={null} />
          ) : null}
          {TAMANOS.filter((tam) => paquetes[tam]?.activo === true).map((tam) => (
            <FichaDeOferta key={`e-${tam}`} tamano={tam}
              rotulo={t('tallerGuarderia.estadias', { n: tam })}
              precio={Number(PASOS_PAQUETE[paquetes[tam]!.iPrecio])}
              precioDiaSuelto={ofreceDiario ? Number(PASOS_PRECIO[iPrecio]) : null}
              vozEquivalente={(e) =>
                e.deltaPct === null || e.direccion === 'sin_comparacion'
                  ? t('tallerGuarderia.equivalenteSimple', { porDia: e.porDia.toFixed(2) })
                  : t('tallerGuarderia.equivalenteSimple', { porDia: e.porDia.toFixed(2) })
              }
            />
          ))}
          {/* 🔴 LA MENSUALIDAD USA LA MISMA PIEZA QUE SUS HERMANAS.
              Con `FichaMensualidad` su precio se veía **más grande** que el del
              día y el de los paquetes: son dos piezas distintas con dos
              jerarquías distintas, puestas una al lado de la otra. *Tres
              precios que se comparan tienen que pesar igual — el que se ve más
              grande se lee como el importante, y acá ninguno lo es.* */}
          {ofreceMensual ? (
            <FichaDeOferta
              tamano={null}
              rotulo={t('tallerGuarderia.mensual')}
              precio={Number(PASOS_MENSUAL[iMensual])}
              precioDiaSuelto={null}
            />
          ) : null}
          {/* Sin ningún precio encendido, la familia no vería nada — y se dice
              acá, que es donde el prestador está mirando. */}
          {!ofreceDiario && !ofreceMensual && TAMANOS.every((tam) => paquetes[tam]?.activo !== true) ? (
            <Texto variante="apoyo">{t('tallerGuarderia.espejoVacio')}</Texto>
          ) : null}
        </View>

        {/* ── ESTÁS VISIBLE, O NO, Y POR QUÉ ──
            🔴 «Visible» es la palabra más peligrosa de esta pantalla: si la
            dijera sin que sea cierta, el prestador esperaría clientes que no
            pueden llegar. Por eso se dice el estado REAL que devolvió el motor
            —publicada o no— y, cuando lo está, la JORNADA DERIVADA de sus
            franjas: el dato que prueba que el motor leyó lo que él configuró. */}
        <Tarjeta relleno="normal" elevacion="reposo">
          <View style={{ gap: spacing[2] }}>
            <Texto variante="cuerpo">
              {estado.publicada ? t('tallerGuarderia.visibleSi') : t('tallerGuarderia.visibleNo')}
            </Texto>
            {estado.publicada && estado.jornadaMinutos !== null ? (
              <Texto variante="apoyo">
                {t('tallerGuarderia.jornadaDerivada', {
                  horas: (estado.jornadaMinutos / 60).toFixed(1),
                })}
              </Texto>
            ) : (
              <Texto variante="apoyo">{t('tallerGuarderia.visibleNoApoyo')}</Texto>
            )}
          </View>
        </Tarjeta>

        <Boton
          etiqueta={t('tallerGuarderia.guardar')}
          bloque
          cargando={guardando}
          onPress={alGuardar}
        />
      </ScrollView>

      {/* ── LOS DOS AVISOS DE GUARDAR ──
          Uno pregunta y el otro informa, y la diferencia no es de tono: **se
          pregunta cuando hay alternativa; se informa cuando no la hay.**
          *Preguntar lo que no se puede cambiar entrena a tocar «seguir» sin
          leer, y ese hábito se paga en el aviso que sí importaba.* */}
      <Hoja
        visible={aviso !== null}
        onCerrar={() => setAviso(null)}
        titulo={aviso === 'pregunta' ? t('tallerGuarderia.avisoSinPrecioTitulo') : t('tallerGuarderia.avisoSinDiarioTitulo')}
      >
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Texto variante="cuerpo">
            {aviso === 'pregunta'
              ? t('tallerGuarderia.avisoSinPrecio')
              : t('tallerGuarderia.avisoSinDiario', { modalidades: modalidadesEncendidas })}
          </Texto>
          {aviso === 'pregunta' ? (
            <>
              {/* Dos botones: volver es lo primero, y por eso va primero. */}
              <Boton etiqueta={t('tallerGuarderia.avisoVolver')} bloque onPress={() => setAviso(null)} />
              <Boton
                variante="secundario"
                etiqueta={t('tallerGuarderia.avisoGuardarAsi')}
                bloque
                onPress={() => void guardar()}
              />
            </>
          ) : (
            <Boton etiqueta={t('tallerGuarderia.avisoEntendido')} bloque onPress={() => void guardar()} />
          )}
        </View>
      </Hoja>

      <Hoja visible={queHora !== null} onCerrar={() => setQueHora(null)} titulo={t('tallerGuarderia.elegiHora')}>
        <HojaScroll>
          <SelectorOpcion
            etiqueta={t('tallerGuarderia.elegiHora')}
            etiquetaVisible={false}
            acento="oficio"
            disposicion="grilla"
            opciones={HORAS.filter((h) => (minimoDeLaGrilla !== null ? h > minimoDeLaGrilla : true)).map((h) => ({
              codigo: h,
              etiqueta: h,
            }))}
            seleccionada={horaElegida ?? undefined}
            onSelect={elegirHora}
          />
        </HojaScroll>
      </Hoja>
    </View>
  );
}
