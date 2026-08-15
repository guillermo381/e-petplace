/**
 * LA CONFIGURACIÓN DE LA DESPENSA (S96-C reabierta · MODELO_DESPENSA
 * §8.6bis, firmas del founder 13-ago-2026 · antes: LETRA_RECORRIDO §2).
 *
 * BOCETO M1:
 *  · TESIS: «Completás tu negocio a tu ritmo; e-PetPlace lo revisa y lo
 *    hace visible.» (§2.1 — las dos mitades: escalable Y curado.)
 *  · FIRMA: LOS CUARTOS EN ORDEN FIRMADO — ① qué vendo · ② cómo entrego ·
 *    ③ cobertura · ④ cuándo · ⑤ quién — con el ESTADO (⑥) como chip
 *    chico arriba que abre su explicación.
 *  · CHANEL: lo que vive en otra casa NO se duplica (§8.6bis: catálogo y
 *    precio = puerta de carga · stock = panel · fiscal/bancario = Cuenta
 *    comercial — acá solo punteros) · la LIQUIDACIÓN se difiere al motor
 *    de pagos y la nota vive en la vista de facturación.
 *  · ESTADOS: cargando · error · listo (con vacíos honestos por sección).
 *
 * ⚠️ CUARTOS SIN ESQUEMA — NO SE MONTAN (precedente de esta misma
 * cabecera: un formulario muerto es peor que su ausencia; pedido a A del
 * 13-ago con los contratos exactos, `2026-08-13-s96c-pedido-a-A-…`):
 *  · ① QUÉ VENDO (familias activables — el nombre de las tres lo pone la
 *    carga del catálogo, jamás esta pantalla; guard de la letra: activar
 *    NO publica, filtra lo que el vendedor ve).
 *  · ② CÓMO ENTREGO (envío/retiro/las dos; sin envío no se ven los
 *    campos de reparto).
 *  · ③ COBERTURA por radio (default 15 · máx 50, CHECK en la fuente).
 *  · ④ la mitad "horarios de atención" (los CORTES sí están montados).
 *  · el CONTADOR (ley S91: narrativa más un paso, llega a cero, lo de
 *    e-PetPlace no entra) — sin ①②③ cableados contaría aire.
 *
 * ✅ D-791 (superficie): CORTES y RECURSOS se REABREN en el mismo
 * formulario que los creó — tap en la fila → Hoja precargada → la misma
 * puerta (upsert MEDIDO en el motor: turno por (cuenta, codigo) ·
 * recurso por (cuenta, nombre)). La LLAVE del upsert va fija al reabrir
 * y la ayuda dice por qué: editable, cambiarla crearía OTRO en silencio.
 * Repartidor y regla de envío NO reabren (sus puertas no upsertean —
 * mitad de motor de D-791, cola de A).
 *
 * 🔴 LA LEY DEL CAMBIO (guard 4 de la orden de mesa del 13-ago): «al
 * guardar un cambio con compromisos vivos, la app dice qué queda
 * comprometido. No rechaza, no oculta.» Cableada donde hay dato HOY:
 *  · CORTES: con pedidos vivos ya prometidos (`!es_terminal` y con
 *    promesa), la Hoja del corte lo dice ANTES del CTA — conservan su
 *    ventana; el corte nuevo rige para lo que entra desde ahora.
 *  · RECURSOS: con entregas ya prometidas hoy (`cupoRepartoDelDia`
 *    consumido > 0), la Hoja de capacidad lo dice igual.
 *  · ⑤ repartidores: SIN dato — decir «qué queda comprometido» al apagar
 *    un repartidor exige el lector de envíos vivos POR repartidor, que
 *    no existe (va en el pedido a A). No se inventa la voz sin el dato.
 * ✅ La letra ATERRIZÓ (13-ago, cabecera de §8.6bis — depositada verbatim
 * del literal de C) y AGREGA dos cosas que esta pantalla aún NO cumple,
 * declaradas en el inventario pre-gate:
 *  · «declara qué queda comprometido Y HASTA CUÁNDO» — la voz dice la
 *    ventana que se conserva, no una fecha explícita (fino post-gate);
 *  · la baja del repartidor «queda pendiente y se cumple sola» — es
 *    comportamiento del MOTOR y no existe (A-5/A-8); hoy el toggle apaga
 *    sin voz ni diferimiento.
 *
 * 🔴 CHOQUE DECLARADO (⑤ QUIÉN): la letra manda repartidor como chip del
 * EQUIPO QUE YA EXISTE («un equipo, un lugar»); el alta de abajo es el
 * padrón propio de S96. Se conserva VIVO hasta que la costura
 * repartidor↔equipo de A exista (A-5 del pedido) — matar la única alta
 * funcionando antes de su reemplazo deja al vendedor sin repartidores.
 * El swap es de esta pantalla y está declarado, no diferido en silencio.
 *
 * ✅ EL CORTE, COMPLETO (S98-C) — la firma del founder entera, campo por campo:
 * nombre con placeholder nativo · hora de corte con **ⓘ que abre modal**
 * (patrón general firmado: los campos que necesiten explicación llevan su ⓘ,
 * **no párrafos permanentes** — el que ya sabe qué es un corte no lo relee cada
 * vez que corrige la hora) · franja desde/hasta en UNA fila · **chips de días
 * L·M·X·J·V·S·D + toggle de festivos**.
 *
 * ⏪ ESTOS DOS ÚLTIMOS NACIERON BLOQUEADOS Y EL PORQUÉ SE CONSERVA, porque es
 * la regla y no la anécdota: `entrega_turnos` tenía las columnas desde
 * `20260815100000`, **pero la PUERTA no las tomaba** — `definir_turno_entrega`
 * sin sus parámetros y el lector sin los campos en su `select`. Con eso, los
 * dos campos solo podían valer su default y una Hoja reabierta ni siquiera
 * podía PRECARGAR lo que la fila tenía. *Montarlos ahí habría sido estado
 * local que se guarda y vuelve apagado: un control que promete estado y no lo
 * tiene es peor que su ausencia.* Llegó la puerta (`20260815110000`,
 * verificada contra `pg_proc`: una sola sobrecarga, sin duplicados) y se
 * montaron.
 *
 * 🔴 LAS DOS REGLAS DE LOS DÍAS, que no son de pantalla sino de operación:
 *  · **0=domingo … 6=sábado** — la convención NO se re-deriva acá: salió de
 *    `EXTRACT(DOW)` medido, y la casa ya la usa en `prestador_horarios`. La
 *    otra elección da una tabla que valida perfecto y entrega los pedidos un
 *    día corrido: no falla, **acierta seis de siete veces**.
 *  · **el default L–V es SOLO del ALTA.** Al EDITAR se precarga lo que la fila
 *    TIENE (las vivas quedaron L–D por el backfill honesto de A): imponerle
 *    L–V a quien hoy entrega sábados sería cambiarle la operación sin
 *    preguntarle — justo lo que ese backfill existió para evitar.
 *
 * ⚠️ EL REPARTIDOR NO SE TOCA EN ESTA VENTANA, y también es medición:
 * su spec pide foto del documento, foto de la persona, tipo de documento,
 * WhatsApp no opcional y **hasta dos vehículos (tipo + placa) DENTRO del
 * repartidor** — y `repartidores` no tiene ninguna de esas columnas ni existe
 * tabla de vehículos. **Y hay un choque que decide A, no esta pantalla:**
 * `recursos_reparto` existe, está CABLEADA (`cupo_reparto_del_dia` la lee) y su
 * semántica es CAPACIDAD del NEGOCIO, no identidad de un vehículo — montar
 * «tipo + placa» encima le cambiaría el significado a la tabla que alimenta el
 * cupo del día. El alta de hoy (nombre · documento · teléfono) **queda viva y
 * sin tocar**: es la única que funciona, y matarla antes de su reemplazo deja
 * al vendedor sin repartidores (el mismo criterio del choque ⑤ de abajo).
 *
 *  · Repartidores: alta con nombre y documento (decisión del arranque);
 *    idempotente por documento — repetir no duplica, y se dice.
 *  · Recursos: la capacidad es DEL RECURSO (§7.3) — la voz lo enseña.
 *  · Cortes horarios: parámetro, jamás número en el código (§7.1).
 *  · Estado (⑥): el mapeo del enum vive en `estadoDespensa()` abajo —
 *    `pendiente_validacion` = «En revisión» (§2.1: el vendedor propone,
 *    e-PetPlace publica). ✅ EL CHIP MISMO abre la explicación (S97-B:
 *    `onPress` en la familia estado); el interim del «¿Qué significa?»
 *    murió con el ensanche, como estaba declarado.
 *  · Radio (③): la ESCALA firmada (5–50 de a 5, default 15, índice 2)
 *    vive lista en `lib/escala-radio.ts` para `SliderPrecio`
 *    `registro="aa"`. El cuarto NO se monta: el radio de la CUENTA no
 *    tiene esquema (A-3) — montarlo sería un formulario muerto para la
 *    propia cuenta del gate (vendedor puro, 0 filas de prestador).
 */

import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Celda,
  CeldaNavegacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  EvitaTeclado,
  Hoja,
  HojaScroll,
  Icono,
  Insignia,
  Interruptor,
  MarcaDeAgua,
  SelectorOpcion,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerMiPrestador,
  actualizarRepartidor,
  cerrarSesion,
  cupoRepartoDelDia,
  definirRecursoReparto,
  definirTurnoEntrega,
  listarPedidosDelVendedor,
  listarRecursosReparto,
  listarRepartidores,
  listarTurnosEntrega,
  obtenerPaisesDelMundo,
  registrarRepartidor,
  type PaisDelMundo,
  type RecursoReparto,
  type Repartidor,
  type TurnoEntrega,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { ControlTelefono } from '@/components/perfil-piezas';
import { contextoVentas, type ContextoVentas } from '@/lib/cuenta-ventas';
import { PAIS_DEFAULT, bandera, componerE164, paisDe } from '@/lib/paises';
import { horaDeSql, hoyLocalISO } from '@/lib/ventas-formato';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | {
      estado: 'listo';
      contexto: ContextoVentas;
      /** ⭐ S98-C · `true` = esta persona NO tiene otra casa (vendedor
       *  puro: sin fila de prestador ⇒ sin tabs). Solo para ella se dibuja
       *  el puntero a sus datos fiscales — para el resto vive en Cuenta, y
       *  dos puertas al mismo sitio envejecen distinto (S84-C34). */
      sinOtraCasa: boolean;
      repartidores: Repartidor[];
      recursos: RecursoReparto[];
      turnos: TurnoEntrega[];
      /** LEY DEL CAMBIO — pedidos vivos con ventana prometida: lo que un
       *  corte nuevo NO mueve. Se lee junto con el resto (un fallo acá es
       *  fallo de pantalla: la ley exige DECIR, y sin dato no se dice). */
      comprometidos: number;
      /** Entregas ya prometidas HOY (consumido del cupo) — lo que una
       *  capacidad nueva no mueve. null = no se pudo leer (mismo trato
       *  tolerante que la cifra del techo en la lista: la línea del guard
       *  no se monta — ausencia, jamás un número inventado). */
      cupoHoy: { capacidad: number; consumido: number } | null;
    };

const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Los días de la semana del corte, en el ORDEN EN QUE SE LEEN (L→D), que no
 *  es el orden del código (0=domingo). El valor es el de la convención de la
 *  casa —medida contra `EXTRACT(DOW)`, no inventada—; la posición es la de un
 *  calendario. Separarlos es a propósito: si la tira se ordenara por el
 *  número, el domingo abriría la semana. */
const DIAS_SEMANA: { codigo: string; valor: number }[] = [
  { codigo: 'lun', valor: 1 },
  { codigo: 'mar', valor: 2 },
  { codigo: 'mie', valor: 3 },
  { codigo: 'jue', valor: 4 },
  { codigo: 'vie', valor: 5 },
  { codigo: 'sab', valor: 6 },
  { codigo: 'dom', valor: 0 },
];
/** El default del ALTA (firma del founder). Jamás el de la edición. */
const L_A_V = [1, 2, 3, 4, 5];

/* ☠️ S98-C · MURIÓ `GlifoInfo` LOCAL — el glifo vive en el registry como
   `info` (B lo promovió a pedido mío, y conservó el razonamiento en su
   comentario: el `ayuda` es un salvavidas, éste no).
   🔴 Y EL DUPLICADO NO LO CREÓ NINGUNA DE LAS DOS PISTAS: yo dibujé inline
   PORQUE el glifo no existía, y B lo promovió PORQUE se lo pedí. Cada mitad
   era correcta sola — **el re-dibujo nació EN EL MERGE**, el instante en que
   las dos llegaron a la misma rama. Es exactamente el caso que R30 existe
   para cazar, y lo cazó: puso `main` en rojo antes de que nadie lo viera. */

/** ⑥ EL ESTADO — mapeo del enum vivo (`estado_cuenta_comercial_enum`:
 *  pendiente_validacion · activa · suspendida · cerrada, medido en
 *  `database.types.ts`) a la voz de la letra («en revisión» → «activa»,
 *  §8.6bis ⑥). Un valor que el enum gane mañana cae al caso que NO afirma
 *  visibilidad que nadie midió: en revisión. Suspendida/cerrada no se
 *  disfrazan de revisión — cada una dice su verdad (Ley 13). */
function estadoDespensa(estadoCuenta: string): {
  insignia: 'info' | 'alDia' | 'atencion';
  clave: 'enRevision' | 'activa' | 'suspendida' | 'cerrada';
} {
  switch (estadoCuenta) {
    case 'activa':
      return { insignia: 'alDia', clave: 'activa' };
    case 'suspendida':
      return { insignia: 'atencion', clave: 'suspendida' };
    case 'cerrada':
      return { insignia: 'atencion', clave: 'cerrada' };
    default:
      return { insignia: 'info', clave: 'enRevision' };
  }
}

export default function ConfiguracionVentas() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  // ⑥ la explicación del estado (el modal que el chip abre)
  const [modalEstado, setModalEstado] = useState(false);

  // hoja repartidor
  const [altaRepartidor, setAltaRepartidor] = useState(false);
  const [repNombre, setRepNombre] = useState('');
  const [repDocumento, setRepDocumento] = useState('');
  const [repTelefono, setRepTelefono] = useState('');
  /* 🔴 EL PAÍS DEL TELÉFONO — el indicativo NO se deduce: se ELIGE (P21,
     «proponer no es deducir»). Arranca en el default del selector, que es
     una preselección visible y cambiable, jamás un país escrito a espaldas
     del vendedor. La lista es ASÍNCRONA desde D-633 y viaja en la MISMA ola
     que el resto — cero espera nueva (la lentitud de esta casa son olas
     encadenadas, no consultas caras). */
  const [paises, setPaises] = useState<PaisDelMundo[]>([]);
  const [repPaisIso, setRepPaisIso] = useState(PAIS_DEFAULT);
  const [eligiendoPais, setEligiendoPais] = useState(false);

  // hoja recurso — `editandoRecurso` = la fila se REABRIÓ (D-791): mismo
  // formulario, misma puerta (upsert por (cuenta, nombre) — MEDIDO en el
  // motor); el NOMBRE es la llave del upsert y va fijo al reabrir:
  // editable, cambiarlo crearía OTRO recurso en silencio.
  const [altaRecurso, setAltaRecurso] = useState(false);
  const [editandoRecurso, setEditandoRecurso] = useState(false);
  const [recNombre, setRecNombre] = useState('');
  const [recCapacidad, setRecCapacidad] = useState('');

  // hoja turno — ídem: upsert por (cuenta, codigo), el CÓDIGO fijo al
  // reabrir.
  const [altaTurno, setAltaTurno] = useState(false);
  const [editandoTurno, setEditandoTurno] = useState(false);
  // la explicación de la hora de corte (el ⓘ la abre)
  const [modalCorte, setModalCorte] = useState(false);
  const [turCodigo, setTurCodigo] = useState('');
  const [turCorte, setTurCorte] = useState('');
  const [turDesde, setTurDesde] = useState('');
  const [turHasta, setTurHasta] = useState('');
  const [turDiaSiguiente, setTurDiaSiguiente] = useState(false);
  /* Los días del corte. 0=domingo … 6=sábado — la convención NO se re-deriva:
     salió de `EXTRACT(DOW)` medido por A, y la casa ya la usa en
     `prestador_horarios.dia_semana`. Elegir la otra da una tabla que valida
     perfecto y entrega los pedidos un día corrido: no falla, acierta seis de
     siete veces.
     🔴 EL DEFAULT L–V ES SOLO DEL ALTA. Al EDITAR se muestra lo que la fila
     TIENE (las vivas quedaron L–D por el backfill honesto de A): imponerle
     L–V a quien hoy entrega sábados sería cambiarle la operación sin
     preguntarle, que es justo lo que ese backfill evitó. */
  const [turDias, setTurDias] = useState<number[]>(L_A_V);
  const [turFestivos, setTurFestivos] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const ctx = await contextoVentas();
        if (!vigente) return;
        if (!ctx.ok || ctx.data === null) {
          setPantalla({ estado: 'error' });
          return;
        }
        const id = ctx.data.cuentaComercialId;
        /* ⚠️ POSICIONAL: lo nuevo se agrega AL FINAL y su nombre también.
           Sacar o intercalar en el medio desalinea el destructuring en
           silencio — ya costó una corrida en esta misma pista. */
        const [reps, recursos, turnos, pedidos, cupo, pres, rPaises] = await Promise.all([
          listarRepartidores(id),
          listarRecursosReparto(id),
          listarTurnosEntrega(id),
          listarPedidosDelVendedor(id),
          cupoRepartoDelDia(id, hoyLocalISO()),
          /* ⭐ S98-C · ¿esta persona tiene OTRA casa? El vendedor puro no
             tiene fila de prestador y por eso no tiene tabs: para él, esta
             pantalla es el único camino a sus datos fiscales. Viaja en la
             misma ola — cero espera nueva. */
          obtenerMiPrestador(),
          /* El catálogo de indicativos (D-633: la lista NO se copia, se
             carga). Va en esta ola y no en una propia. */
          obtenerPaisesDelMundo(),
        ]);
        if (!vigente) return;
        if (!reps.ok || !recursos.ok || !turnos.ok || !pedidos.ok || !rPaises.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        /* Entra al GATE junto con los demás, y es a propósito: sin
           indicativos el alta de repartidor compondría un teléfono sin `+`
           que la fuente rebota (`repartidores_telefono_check`) con un
           mensaje de Postgres. Prefiero un error honesto de pantalla antes
           que un formulario que acepta y revienta al guardar. Y el costo
           real es bajo: viajan en la MISMA ola, así que si esto falla solo,
           es un problema de `cat_paises`, no de red. */
        setPaises(rPaises.data);
        setPantalla({
          estado: 'listo',
          contexto: ctx.data,
          sinOtraCasa: !pres.ok && pres.codigo === 'sin_prestador',
          repartidores: reps.data,
          recursos: recursos.data,
          turnos: turnos.data,
          // lo comprometido: vivo Y con ventana prometida (un retiro sin
          // promesa no lo mueve ningún corte)
          comprometidos: pedidos.data.filter(
            (p) => !p.es_terminal && p.promesa_desde !== null,
          ).length,
          cupoHoy: cupo.ok
            ? { capacidad: cupo.data.capacidad, consumido: cupo.data.consumido }
            : null,
        });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  const recargar = () => setIntento((n) => n + 1);

  /* ⑥ — las claves van LITERALES, jamás armadas por concatenación: el
     diccionario tipado rompe con una key inexistente y un template lo
     apagaría con un cast (misma regla que el techo del HOY). */
  const estadoCfg =
    pantalla.estado === 'listo' ? estadoDespensa(pantalla.contexto.estadoCuenta) : null;
  const etiquetaEstado =
    estadoCfg === null
      ? ''
      : estadoCfg.clave === 'activa'
        ? t('ventas.config.estado.activa')
        : estadoCfg.clave === 'suspendida'
          ? t('ventas.config.estado.suspendida')
          : estadoCfg.clave === 'cerrada'
            ? t('ventas.config.estado.cerrada')
            : t('ventas.config.estado.enRevision');
  const modalEstadoVoz =
    estadoCfg === null
      ? ''
      : estadoCfg.clave === 'activa'
        ? t('ventas.config.estado.modalActiva')
        : estadoCfg.clave === 'suspendida'
          ? t('ventas.config.estado.modalSuspendida')
          : estadoCfg.clave === 'cerrada'
            ? t('ventas.config.estado.modalCerrada')
            : t('ventas.config.estado.modalEnRevision');

  /* 🔴 LA VALIDACIÓN QUE MI PROPIA CURA NECESITABA — y la encontró el
     instrumento, no el razonamiento (S98-C).
     Componer el indicativo NO alcanza: tipeando `0988777666` —como se escribe
     un celular en Ecuador— salía **`+5930988777666`**, con el `0` de tránsito
     adentro. Trece dígitos: **el CHECK lo ACEPTA** (`^\+[1-9][0-9]{6,14}$`) y
     la fila nace con un número que no existe. *Eso es peor que el defecto que
     vine a curar: el original fallaba fuerte, éste guarda mal en silencio.*
     Y la cura NO es sacar el `0` a mano: el prefijo de tránsito no es
     universal —Italia lo CONSERVA en su E.164— así que una regla propia
     corrompería otros países. Se valida contra el `formato` que declara el
     CATÁLOGO, que es el mismo criterio que ya usa el perfil. Los países que
     no declaran formato NO validan **y lo dicen**: callarse se leería como
     «está bien». */
  function estadoTelefonoRep(): { ok: boolean; voz: string } | null {
    const crudo = repTelefono.replace(/[\s-]/g, '');
    if (crudo.length === 0) return null; // opcional: vacío no es un error
    const pais = paisDe(paises, repPaisIso);
    if (pais?.prefijo == null) return null;
    const e164 = componerE164(paises, repTelefono, repPaisIso);
    if (pais.formato === null) {
      return { ok: true, voz: t('perfilNegocio.telSinFormato', { e164, pais: pais.nombre }) };
    }
    if (new RegExp(pais.formato).test(e164)) {
      return { ok: true, voz: t('perfilNegocio.telSeGuarda', { e164 }) };
    }
    // El error DIRIGE: cuántos dígitos van, sacados del formato REAL del país.
    const rango = /\\d\{(\d+)(?:,(\d+))?\}/.exec(pais.formato);
    const min = rango?.[1];
    const max = rango?.[2];
    const cuantos =
      min === undefined
        ? t('perfilNegocio.telDigitosSinDato')
        : max === undefined
          ? t('perfilNegocio.telDigitos', { min })
          : t('perfilNegocio.telDigitosRango', { min, max });
    return {
      ok: false,
      voz: t('perfilNegocio.telLargoMal', {
        pais: pais.nombre,
        cuantos,
        pre: pais.prefijo,
        van: crudo.length,
      }),
    };
  }

  async function guardarRepartidor() {
    if (guardando || pantalla.estado !== 'listo') return;
    if (repNombre.trim().length === 0 || repDocumento.trim().length === 0) return;
    // Un teléfono que no cumple el formato de su país NO se manda: la puerta
    // no ofrece lo que va a rechazar (Ley 23), y acá la fuente NO lo rechaza
    // —lo acepta mal—, así que el guard tiene que estar de este lado.
    if (estadoTelefonoRep()?.ok === false) return;
    setGuardando(true);
    /* 🔴 LA CURA (S98-C, rojo reproducido antes): acá se mandaba
       `repTelefono.trim()` CRUDO. `repartidores_telefono_check` exige
       `^\+[1-9][0-9]{6,14}$`, y `registrar_repartidor` NO normaliza —lo
       inserta tal cual (medido en su cuerpo)—, así que un vendedor que
       tipeaba `0988888888`, que es como se escribe un celular en Ecuador,
       recibía el texto de un CHECK de Postgres. Ahora el número se COMPONE
       con el indicativo del país elegido. */
    const telefonoE164 = componerE164(paises, repTelefono, repPaisIso);
    const r = await registrarRepartidor({
      cuenta_comercial_id: pantalla.contexto.cuentaComercialId,
      nombre: repNombre.trim(),
      documento: repDocumento.trim(),
      telefono: telefonoE164.length > 0 ? telefonoE164 : undefined,
    });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({
      texto: r.data.ya_existia
        ? t('ventas.config.repartidorYaExistia')
        : t('ventas.config.repartidorExito'),
      variante: 'exito',
    });
    setAltaRepartidor(false);
    recargar();
  }

  async function alternarRepartidor(rep: Repartidor, encendido: boolean) {
    if (guardando) return;
    setGuardando(true);
    const r = await actualizarRepartidor({ repartidor_id: rep.repartidor_id, activo: encendido });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    recargar();
  }

  async function guardarRecurso() {
    if (guardando || pantalla.estado !== 'listo') return;
    const capacidad = Number(recCapacidad);
    if (recNombre.trim().length === 0 || !Number.isInteger(capacidad) || capacidad <= 0) return;
    setGuardando(true);
    const r = await definirRecursoReparto({
      cuenta_comercial_id: pantalla.contexto.cuentaComercialId,
      nombre: recNombre.trim(),
      capacidad_por_dia: capacidad,
    });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('ventas.config.recursoExito'), variante: 'exito' });
    setAltaRecurso(false);
    recargar();
  }

  async function guardarTurno() {
    if (guardando || pantalla.estado !== 'listo') return;
    if (
      turCodigo.trim().length === 0 ||
      !HORA_RE.test(turCorte) ||
      !HORA_RE.test(turDesde) ||
      !HORA_RE.test(turHasta) ||
      // Un corte sin días no es un corte apagado: es uno que no se puede
      // evaluar. La fuente lo rechaza igual; frenarlo acá evita el rebote.
      turDias.length === 0
    ) {
      return;
    }
    setGuardando(true);
    const r = await definirTurnoEntrega({
      cuenta_comercial_id: pantalla.contexto.cuentaComercialId,
      codigo: turCodigo.trim(),
      corte: turCorte,
      entrega_desde: turDesde,
      entrega_hasta: turHasta,
      dia_offset: turDiaSiguiente ? 1 : 0,
      /* Se mandan SIEMPRE, y es a propósito. La puerta de A trata `NULL`
         como «no lo toques» (semántica que pedí en el contrato y que adoptó
         literal), así que omitirlos sería correcto para una corrección de
         hora — pero acá la pantalla SÍ tiene los días a la vista y el
         vendedor los pudo cambiar en la misma Hoja. Mandar lo que se ve es
         lo único que no puede desincronizarse de lo que se muestra. */
      dias_semana: turDias,
      incluye_festivos: turFestivos,
    });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('ventas.config.turnoExito'), variante: 'exito' });
    setAltaTurno(false);
    recargar();
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('ventas.config.titulo')}
        atras
        onAtras={() => router.back()}
      />

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="90%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={72} />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={72} />
          </EsqueletoGrupo>
        </View>
      )}

      {pantalla.estado === 'error' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('ventas.comunes.errorTitulo')}
            descripcion={t('ventas.comunes.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('ventas.comunes.reintentar')}
                onPress={() => {
                  setPantalla({ estado: 'cargando' });
                  recargar();
                }}
              />
            }
          />
        </View>
      )}

      {pantalla.estado === 'listo' && (
        <ScrollView
          contentContainerStyle={{
            padding: spacing[4],
            paddingBottom: insets.bottom + spacing[10],
            gap: spacing[5],
          }}
        >
          {/* ── ⑥ EL ESTADO — el chip chico arriba; EL CHIP MISMO abre su
              explicación (S97-B: `onPress` en la familia estado — el
              blanco táctil y el rol viven en la pieza, no se re-deciden
              acá). El interim del «¿Qué significa?» murió con el
              ensanche, como estaba declarado. */}
          {estadoCfg !== null && (
            <View style={{ gap: spacing[2] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Insignia
                  estado={estadoCfg.insignia}
                  etiqueta={etiquetaEstado}
                  tamaño="sm"
                  onPress={() => setModalEstado(true)}
                />
              </View>
              <Texto variante="apoyo">{t('ventas.config.detalle')}</Texto>
            </View>
          )}

          {/* ── ① QUÉ VENDO · ② CÓMO ENTREGO · ③ COBERTURA — NO SE MONTAN:
              sin lector ni escritor, un formulario muerto es peor que su
              ausencia (cabecera). Los contratos exactos viven en el pedido
              a A del 13-ago; al llegar el esquema entran ACÁ, en este
              orden, antes del ④.
              ⚠️ S97 + FIRMA DE MESA (13-ago, 3ª vuelta): son CINCO
              familias, no tres — `dieta_prescripcion` firmada como familia
              propia y `accesorio` en el esquema aunque sin carga v1. Este
              punto de inserción NO asume cantidad: la sección se monta
              sobre LO QUE EL LECTOR DEVUELVA (map, cero constantes de
              código ni de conteo) — cinco hoy, N mañana, sin cambio de
              código acá. La carga ya corrió (442 productos, códigos
              medidos en 2026-08-13-s97a-esquema-catalogo-maestro.md); lo
              que falta sigue siendo la ACTIVACIÓN por vendedor (A-1). */}

          {/* ── ④ CUÁNDO — los cortes horarios (la mitad «horarios de
              atención» espera esquema: pedido A-4) ── */}
          <View style={{ gap: spacing[2] }}>
            <Texto variante="seccion">{t('ventas.config.turnosTitulo')}</Texto>
            <Texto variante="apoyo">{t('ventas.config.turnosDetalle')}</Texto>
            {pantalla.turnos.length > 0 && (
              <Tarjeta relleno="ninguno">
                {pantalla.turnos.map((tur, i) => (
                  <View key={tur.turno_id}>
                    {i > 0 && <Separador />}
                    {/* D-791: la fila REABRE el mismo formulario que la
                        creó — la puerta upsertea por (cuenta, codigo). */}
                    <Celda
                      titulo={tur.codigo}
                      subtitulo={tur.dia_offset === 1 ? t('ventas.config.turnoDiaSiguiente') : undefined}
                      metadataMono={`${horaDeSql(tur.corte)} → ${horaDeSql(tur.entrega_desde)}–${horaDeSql(tur.entrega_hasta)}`}
                      interactiva
                      accessibilityRole="button"
                      onPress={() => {
                        setTurCodigo(tur.codigo);
                        setTurCorte(horaDeSql(tur.corte));
                        setTurDesde(horaDeSql(tur.entrega_desde));
                        setTurHasta(horaDeSql(tur.entrega_hasta));
                        setTurDiaSiguiente(tur.dia_offset === 1);
                        /* EDITAR muestra LO QUE LA FILA TIENE — nunca el
                           default del alta. Sin esta línea, abrir un corte
                           L–D para corregirle la hora se lo dejaría en L–V. */
                        setTurDias(tur.dias_semana);
                        setTurFestivos(tur.incluye_festivos);
                        setEditandoTurno(true);
                        setAltaTurno(true);
                      }}
                    />
                  </View>
                ))}
              </Tarjeta>
            )}
            <Boton
              variante="secundario"
              bloque
              etiqueta={t('ventas.config.turnoNuevoCta')}
              onPress={() => {
                setTurCodigo('');
                setTurCorte('');
                setTurDesde('');
                setTurHasta('');
                setTurDiaSiguiente(false);
                // CREAR arranca en L–V (firma del founder) — y se RESETEA
                // acá: sin esto, abrir el alta después de editar un corte
                // L–D heredaría sus días como si fueran el default.
                setTurDias(L_A_V);
                setTurFestivos(false);
                setEditandoTurno(false);
                setAltaTurno(true);
              }}
            />
          </View>

          {/* ── ⑤ QUIÉN — repartidores (🔴 choque declarado en la cabecera:
              padrón propio hasta la costura repartidor↔equipo de A) ── */}
          <View style={{ gap: spacing[2] }}>
            <Texto variante="seccion">{t('ventas.config.repartidoresTitulo')}</Texto>
            {pantalla.repartidores.length === 0 ? (
              <Texto variante="apoyo">{t('ventas.config.sinRepartidores')}</Texto>
            ) : (
              <Tarjeta relleno="ninguno">
                {pantalla.repartidores.map((rep, i) => (
                  <View key={rep.repartidor_id}>
                    {i > 0 && <Separador />}
                    <Celda
                      titulo={rep.nombre}
                      subtitulo={rep.activo ? undefined : t('ventas.config.repartidorInactivo')}
                      metadataMono={rep.documento}
                      fin={
                        <Interruptor
                          encendido={rep.activo}
                          onCambio={(v) => void alternarRepartidor(rep, v)}
                          etiqueta={t('ventas.config.repartidorActivar')}
                          registro="oficio"
                        />
                      }
                    />
                  </View>
                ))}
              </Tarjeta>
            )}
            <Boton
              variante="secundario"
              bloque
              etiqueta={t('ventas.config.repartidorNuevoCta')}
              onPress={() => {
                setRepNombre('');
                setRepDocumento('');
                setRepTelefono('');
                setAltaRepartidor(true);
              }}
            />
          </View>

          {/* capacidad por recurso */}
          <View style={{ gap: spacing[2] }}>
            <Texto variante="seccion">{t('ventas.config.recursosTitulo')}</Texto>
            <Texto variante="apoyo">{t('ventas.config.recursosDetalle')}</Texto>
            {pantalla.recursos.length === 0 ? (
              <Texto variante="apoyo">{t('ventas.config.sinRecursos')}</Texto>
            ) : (
              <Tarjeta relleno="ninguno">
                {pantalla.recursos.map((rec, i) => (
                  <View key={rec.recurso_id}>
                    {i > 0 && <Separador />}
                    {/* D-791: la fila REABRE el mismo formulario — la
                        puerta upsertea por (cuenta, nombre). */}
                    <Celda
                      titulo={rec.nombre}
                      subtitulo={rec.activo ? undefined : t('ventas.config.repartidorInactivo')}
                      metadataMono={t('ventas.config.capacidadPorDia', { n: rec.capacidad_por_dia })}
                      interactiva
                      accessibilityRole="button"
                      onPress={() => {
                        setRecNombre(rec.nombre);
                        setRecCapacidad(String(rec.capacidad_por_dia));
                        setEditandoRecurso(true);
                        setAltaRecurso(true);
                      }}
                    />
                  </View>
                ))}
              </Tarjeta>
            )}
            <Boton
              variante="secundario"
              bloque
              etiqueta={t('ventas.config.recursoNuevoCta')}
              onPress={() => {
                setRecNombre('');
                setRecCapacidad('');
                setEditandoRecurso(false);
                setAltaRecurso(true);
              }}
            />
          </View>

          {/* ── ⭐ S98-C · LA FACTURACIÓN SE VA DE ACÁ (firma del founder:
              *«deben ir donde corresponde, no es de acá»*) ──────────────

              **☠️ «Tu facturación» se mudó a NEGOCIO**, a la sección Cobros,
              que es donde ya vive la plata del negocio. *La facturación es
              del NEGOCIO, no del canal de venta* — y por la frontera
              firmada (DATOS consulta · NEGOCIO configura) su vecino natural
              son las liquidaciones, no los turnos de reparto.

              **«Datos de facturación» NO se muda: se GATEA.** Su destino
              —`/cuenta-comercial`— **ya vive en Cuenta**, así que para
              quien tiene tabs esto era una segunda puerta al mismo sitio,
              exactamente lo que S84-C34 firmó que no se hace. Pero el
              VENDEDOR PURO no tiene tabs (todavía: D-820), y sin este
              puntero se queda **sin ningún camino a sus datos fiscales**.
              ⇒ se dibuja solo para él, y **muere solo el día que D-820 le
              dé su barra**. *Retirarlo hoy para todos habría cumplido la
              firma dejando a alguien sin puerta.* */}
          {pantalla.sinOtraCasa && (
            <Tarjeta relleno="ninguno">
              <CeldaNavegacion
                registro="tinta"
                titulo={t('ventas.config.facturacionTitulo')}
                detalle={t('ventas.config.facturacionDetalle')}
                onPress={() => router.push('/cuenta-comercial')}
              />
            </Tarjeta>
          )}

          {/* S96-C: para el VENDEDOR PURO (raíz → /ventas, sin tabs) esta
              es su única superficie estable — sin esto no tiene forma de
              cerrar sesión en ningún lado. Al salir, el guard raíz
              re-evalúa y aterriza en la bienvenida; el caché del contexto
              se invalida solo (escucha de auth en cuenta-ventas). */}
          <Boton
            variante="ghost"
            bloque
            cargando={cerrando}
            etiqueta={t('sesion.cerrarSesion')}
            onPress={() => {
              if (cerrando) return;
              setCerrando(true);
              void cerrarSesion().then(() => {
                setCerrando(false);
                router.replace('/(tabs)');
              });
            }}
          />
        </ScrollView>
      )}

      {/* ── ⑥ el modal del estado — qué significa (§8.6bis) ── */}
      <Hoja
        visible={modalEstado}
        onCerrar={() => setModalEstado(false)}
        titulo={t('ventas.config.estado.modalTitulo')}
        altura="media"
      >
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Texto variante="cuerpo">{modalEstadoVoz}</Texto>
        </View>
      </Hoja>

      {/* ── el modal del ⓘ de la hora de corte ──
          Vive FUERA de la Hoja del corte a propósito: una Hoja adentro de otra
          Hoja monta un `<Modal>` sobre otro y en Android el gesto de cierre
          queda ambiguo. Acá la de arriba se apila y el corte conserva su
          estado — lo tipeado no se pierde por leer qué significa. */}
      <Hoja
        visible={modalCorte}
        onCerrar={() => setModalCorte(false)}
        titulo={t('ventas.config.turnoCorteInfoTitulo')}
        altura="media"
      >
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Texto variante="cuerpo">{t('ventas.config.turnoCorteInfoCuerpo')}</Texto>
        </View>
      </Hoja>

      {/* ── hoja: repartidor nuevo ── */}
      <Hoja
        visible={altaRepartidor}
        onCerrar={() => {
          if (!guardando) setAltaRepartidor(false);
        }}
        titulo={t('ventas.config.repartidorNuevoCta')}
        altura="media"
      >
        <HojaScroll>
          <EvitaTeclado>
            <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
              <Campo
                label={t('ventas.config.repartidorNombre')}
                value={repNombre}
                onChangeText={setRepNombre}
                deshabilitado={guardando}
              />
              <Campo
                label={t('ventas.config.repartidorDocumento')}
                value={repDocumento}
                onChangeText={setRepDocumento}
                keyboardType="number-pad"
                deshabilitado={guardando}
              />
              {/* El teléfono con su indicativo — pieza de la casa, no una
                  caja nueva: `ControlTelefono` ya resuelve el par
                  selector+campo con UN solo pie, porque lo que se valida es
                  el E.164 que forman JUNTOS. El placeholder va SIN prefijo:
                  el indicativo está a la izquierda y repetirlo enseñaría a
                  escribirlo dos veces. */}
              <ControlTelefono
                label={t('ventas.config.repartidorTelefono')}
                placeholder={t('ventas.config.repartidorTelefonoPlaceholder')}
                valor={repTelefono}
                onCambio={setRepTelefono}
                bandera={bandera(repPaisIso)}
                prefijo={paisDe(paises, repPaisIso)?.prefijo ?? ''}
                onElegirPais={() => setEligiendoPais(true)}
                /* La voz EN VIVO muestra el E.164 que se va a guardar — el
                   vendedor VE `+593988777666` antes de tocar Guardar, que es
                   justo lo que habría destapado el `0` de más sin necesidad
                   de un instrumento. Sin nada tipeado, la ayuda genérica. */
                ayuda={estadoTelefonoRep()?.voz ?? t('ventas.config.repartidorTelefonoAyuda')}
                error={
                  estadoTelefonoRep()?.ok === false ? estadoTelefonoRep()?.voz : undefined
                }
              />
              <Boton
                variante="primario"
                bloque
                cargando={guardando}
                deshabilitado={
                  repNombre.trim().length === 0 ||
                  repDocumento.trim().length === 0 ||
                  estadoTelefonoRep()?.ok === false
                }
                etiqueta={t('ventas.config.repartidorGuardarCta')}
                onPress={() => void guardarRepartidor()}
              />
            </View>
          </EvitaTeclado>
        </HojaScroll>
      </Hoja>

      {/* ── el país del teléfono del repartidor ──
          Misma anatomía que la del perfil: bandera + nombre + indicativo en
          mono, y la elegida se DICE. Los países sin `formato_telefono`
          declarado no se apagan —se aceptan igual— pero su subtítulo avisa
          que nadie va a validar la forma: el dato honesto ocupa el lugar
          donde un «todavía no» mentiría. */}
      <Hoja
        visible={eligiendoPais}
        onCerrar={() => setEligiendoPais(false)}
        titulo={t('ventas.config.repartidorPaisTitulo')}
      >
        <HojaScroll>
          {paises.map((p, i) => (
            <View key={p.codigo}>
              {i > 0 ? <Separador /> : null}
              <Celda
                titulo={`${bandera(p.codigo)}  ${p.nombre}`}
                subtitulo={
                  p.formato === null ? t('ventas.config.repartidorPaisSinFormato') : undefined
                }
                metadataMono={p.prefijo ?? undefined}
                interactiva
                accessibilityRole="button"
                onPress={() => {
                  setRepPaisIso(p.codigo);
                  setEligiendoPais(false);
                }}
                fin={
                  p.codigo === repPaisIso ? (
                    <Texto variante="dato">{t('ventas.config.repartidorPaisElegido')}</Texto>
                  ) : undefined
                }
              />
            </View>
          ))}
        </HojaScroll>
      </Hoja>

      {/* ── hoja: recurso nuevo ── */}
      <Hoja
        visible={altaRecurso}
        onCerrar={() => {
          if (!guardando) setAltaRecurso(false);
        }}
        titulo={
          editandoRecurso
            ? t('ventas.config.recursoEditarTitulo')
            : t('ventas.config.recursoNuevoCta')
        }
        altura="media"
      >
        <HojaScroll>
          <EvitaTeclado>
            <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
              {/* el NOMBRE es la llave del upsert: fijo al reabrir —
                  editable crearía OTRO recurso en silencio (D-791) */}
              <Campo
                label={t('ventas.config.recursoNombre')}
                value={recNombre}
                onChangeText={setRecNombre}
                ayuda={editandoRecurso ? t('ventas.config.recursoNombreFijo') : undefined}
                deshabilitado={guardando || editandoRecurso}
              />
              <Campo
                label={t('ventas.config.recursoCapacidad')}
                value={recCapacidad}
                onChangeText={setRecCapacidad}
                keyboardType="number-pad"
                deshabilitado={guardando}
              />
              {/* LEY DEL CAMBIO: lo ya prometido hoy no se mueve — se dice
                  ANTES de guardar, no se rechaza ni se oculta. */}
              {pantalla.estado === 'listo' &&
                pantalla.cupoHoy !== null &&
                pantalla.cupoHoy.consumido > 0 && (
                  <Texto variante="apoyo">
                    {pantalla.cupoHoy.consumido === 1
                      ? t('ventas.config.cambio.recursoEntrega1')
                      : t('ventas.config.cambio.recursoEntregas', {
                          n: pantalla.cupoHoy.consumido,
                        })}
                  </Texto>
                )}
              <Boton
                variante="primario"
                bloque
                cargando={guardando}
                deshabilitado={recNombre.trim().length === 0 || !(Number(recCapacidad) > 0)}
                etiqueta={t('ventas.config.recursoGuardarCta')}
                onPress={() => void guardarRecurso()}
              />
            </View>
          </EvitaTeclado>
        </HojaScroll>
      </Hoja>

      {/* ── hoja: corte nuevo ── */}
      <Hoja
        visible={altaTurno}
        onCerrar={() => {
          if (!guardando) setAltaTurno(false);
        }}
        titulo={
          editandoTurno ? t('ventas.config.turnoEditarTitulo') : t('ventas.config.turnoNuevoCta')
        }
        altura="media"
      >
        <HojaScroll>
          <EvitaTeclado>
            <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
              {/* el CÓDIGO es la llave del upsert: fijo al reabrir —
                  editable crearía OTRO corte en silencio (D-791) */}
              <Campo
                label={t('ventas.config.turnoCodigo')}
                value={turCodigo}
                onChangeText={setTurCodigo}
                placeholder={t('ventas.config.turnoCodigoPlaceholder')}
                ayuda={editandoTurno ? t('ventas.config.turnoCodigoFijo') : undefined}
                deshabilitado={guardando || editandoTurno}
              />
              {/* ⓘ EN EL CAMPO, no un párrafo permanente bajo él (patrón
                  general firmado): el que ya sabe qué es un corte no lee una
                  explicación cada vez que corrige la hora. Va en `iconoDer`
                  —el slot que `Campo` ya expone y que el toggle de contraseña
                  estrena con un `Pressable`— así que no nace anatomía nueva. */}
              <Campo
                label={t('ventas.config.turnoCorte')}
                value={turCorte}
                onChangeText={setTurCorte}
                placeholder={t('ventas.config.turnoHoraPlaceholder')}
                deshabilitado={guardando}
                iconoDer={
                  <Pressable
                    onPress={() => setModalCorte(true)}
                    accessibilityRole="button"
                    accessibilityLabel={t('ventas.config.turnoCorteInfoA11y')}
                    hitSlop={12}
                  >
                    <Icono nombre="info" tamano={18} registro="tinta" tinta={theme.text.secondary} />
                  </Pressable>
                }
              />
              {/* La franja es UN dato con dos extremos: el grupo lo rotula y
                  los campos se llaman Desde/Hasta — en una fila, dos labels
                  largos envolverían (firma del founder). */}
              <View style={{ gap: spacing[2] }}>
                <Texto variante="apoyo">{t('ventas.config.turnoFranja')}</Texto>
                <View style={{ flexDirection: 'row', gap: spacing[3] }}>
                  <View style={{ flex: 1 }}>
                    <Campo
                      label={t('ventas.config.turnoDesde')}
                      value={turDesde}
                      onChangeText={setTurDesde}
                      placeholder={t('ventas.config.turnoDesdePlaceholder')}
                      deshabilitado={guardando}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Campo
                      label={t('ventas.config.turnoHasta')}
                      value={turHasta}
                      onChangeText={setTurHasta}
                      placeholder={t('ventas.config.turnoHastaPlaceholder')}
                      deshabilitado={guardando}
                    />
                  </View>
                </View>
              </View>
              {/* LOS DÍAS — tira de 7, selección múltiple. La pieza ya existe
                  y nació para esto: `SelectorOpcion multiple` se construyó en
                  S56 para los siete chips L·M·X·J·V·S·D del plan de paseo.
                  Cero componente nuevo. */}
              <SelectorOpcion
                etiqueta={t('ventas.config.turnoDias')}
                disposicion="tira"
                acento="oficio"
                multiple
                seleccionadas={turDias.map(String)}
                opciones={DIAS_SEMANA.map((d) => ({
                  codigo: String(d.valor),
                  etiqueta: t(`ventas.config.dia.${d.codigo}` as 'ventas.config.dia.lun'),
                }))}
                onSelect={(codigo) => {
                  const v = Number(codigo);
                  setTurDias((prev) =>
                    prev.includes(v) ? prev.filter((d) => d !== v) : [...prev, v],
                  );
                }}
              />
              {/* Sin días el corte no se puede EVALUAR — y la fuente lo
                  rechaza (CHECK de A: entre 1 y 7). Se dice acá en vez de
                  dejar que rebote: apagar un corte es `activo=false`, no
                  dejarlo sin días. */}
              {turDias.length === 0 && (
                <Texto variante="apoyo">{t('ventas.config.turnoSinDias')}</Texto>
              )}
              {/* Los festivos NO son un día de la semana — por eso viven
                  aparte y no adentro de la tira (misma razón por la que A los
                  puso en su propia columna). */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Texto variante="cuerpo">{t('ventas.config.turnoFestivos')}</Texto>
                <Interruptor
                  encendido={turFestivos}
                  onCambio={setTurFestivos}
                  etiqueta={t('ventas.config.turnoFestivos')}
                  registro="oficio"
                />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Texto variante="cuerpo">{t('ventas.config.turnoDiaSiguiente')}</Texto>
                <Interruptor
                  encendido={turDiaSiguiente}
                  onCambio={setTurDiaSiguiente}
                  etiqueta={t('ventas.config.turnoDiaSiguiente')}
                  registro="oficio"
                />
              </View>
              {/* LEY DEL CAMBIO: los pedidos ya prometidos conservan su
                  ventana — se dice ANTES de guardar el corte. */}
              {pantalla.estado === 'listo' && pantalla.comprometidos > 0 && (
                <Texto variante="apoyo">
                  {pantalla.comprometidos === 1
                    ? t('ventas.config.cambio.cortePedido1')
                    : t('ventas.config.cambio.cortePedidos', { n: pantalla.comprometidos })}
                </Texto>
              )}
              <Boton
                variante="primario"
                bloque
                cargando={guardando}
                deshabilitado={
                  turCodigo.trim().length === 0 ||
                  !HORA_RE.test(turCorte) ||
                  !HORA_RE.test(turDesde) ||
                  !HORA_RE.test(turHasta) ||
                  turDias.length === 0
                }
                etiqueta={t('ventas.config.turnoGuardarCta')}
                onPress={() => void guardarTurno()}
              />
            </View>
          </EvitaTeclado>
        </HojaScroll>
      </Hoja>
    </View>
  );
}
