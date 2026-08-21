/**
 * EL CHECKOUT DE LA DESPENSA (S96-D · D-B3 · `LETRA_RECORRIDO_DESPENSA_S96`
 * §6/§7/§8 · `MODELO_DESPENSA` §5.2 puntos 3-4).
 *
 * TESIS (Ley 14): *el precio que ves ES el precio, y la promesa es una
 * ventana que el cupo respalda.*
 *
 * FIRMA (Ley 15): LOS TOTALES DEL MOTOR — el pedido en `creado` ES el
 * carrito con números reales (`crearPedidoDespensa`); esta pantalla jamás
 * suma un centavo. Se muere la divergencia vitrina/checkout que S95
 * celebró al salir de VTEX.
 *
 * CHANEL (Ley 16):
 *  · cero cupones fantasma, cero "aprovechá ahora", cero countdown del
 *    hold (LOYALTY §7.5) — lo único con reloj es la ventana de entrega,
 *    y es una promesa, no una presión.
 *  · el PIN del mapa NO está en esta tanda: la pieza (`PinMovible`) está
 *    en construcción en B — HUECO DECLARADO abajo, no un olvido.
 *
 * ── LAS TRES FASES, y por qué la vuelta CANCELA ─────────────────────────
 * armado → resumen → éxito. El resumen existe porque los totales solo los
 * dice el motor: "Ver el total" CREA el pedido (estado `creado`: sin pago,
 * sin reserva de stock). **Volver a editar CANCELA ese pedido** — la
 * lección de los 137 huérfanos del prototipo está pagada: un pedido
 * `creado` que nadie va a pagar no se abandona, se cancela.
 *
 * ── EL PAGO ES SIMULADO Y SE DICE IMPOSIBLE DE CONFUNDIR (§6.5) ─────────
 * `iniciarPagoPedido` reserva stock y deja el pedido en "Pagando". No hay
 * pasarela (D-764): ningún cobro ocurre, ninguna liquidación nace, y la
 * pantalla lo dice con todas las letras — antes, durante y después.
 *
 * ── HUECOS: DOS MURIERON EL MISMO DÍA, UNO QUEDA Y SE DICE ─────────────
 *  ☠️ `cuentaComercialId` y el pin: cableados (tanda A + PinMovible de B,
 *     12-ago). El único vivo: la recurrencia (§6.1) tiene interruptor y
 *     el primer cobro real espera la pasarela (D-778) — SE DICE.
 *  · El formateo de plata sigue artesanal A PROPÓSITO: es cura de FRENTE
 *    (D-448 enmendada) — el catálogo ya expone país, el seguimiento no;
 *    migrar solo esta pantalla partiría el formato del frente en dos.
 *
 * ESCALERA (§4b): peldaño 0 = retiro en tienda (sin dirección, código en
 * el mostrador) · peldaño 1 = despacho a la dirección del hogar con la
 * próxima ventana · peldaño 2 = fecha programada contra el cupo real del
 * día, con los saltos por cupo DICHOS.
 *
 * TESTS (§10): L-139 en cada número (todo monto viene del motor) · el
 * apagado dice qué falta · error dice qué pasó · voz de familia.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useNavigation } from 'expo-router';
import {
  Boton,
  Campo,
  CeldaNavegacion,
  Encabezado,
  EsperaDeTrabajo,
  EstadoVacio,
  EvitaTeclado,
  GotaUbicacion,
  Hoja,
  Icono,
  Interruptor,
  PantallaConPie,
  SelectorOpcion,
  SelectorVentana,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
  type CampoFechaValor,
  type OpcionVentana,
} from '@epetplace/ui';
import {
  alternarRecurrencia,
  calcularPromesaDespensa,
  cancelarPedidoDespensa,
  configurarRecurrencia,
  crearPedidoDespensa,
  crearCompraDesdePedidos,
  crearIntentoPago,
  verificarCompuertas,
  listarTarjetasGuardadas,
  type TarjetaGuardada,
  COMPUERTAS_DEFECTO_NUESTRO,
  obtenerNombresTiendaPorPedido,
  nuevaClaveIdempotencia,
  listarMisDirecciones,
  obtenerDireccionHogar,
  obtenerMiPerfil,
  type DireccionGuardada,
  type DireccionHogar,
  type PedidoCreado,
  type PromesaEntrega,
} from '@epetplace/api';
import { fechaDiaSemanaHumana, diaSemanaCorto } from '@epetplace/i18n';
import { DireccionHogarForm } from '@/components/direccion-hogar-form';
import { FilaMonto } from '@/components/despensa-piezas';
import { agruparPorVendedor, useCarrito, vaciarCarrito } from '@/lib/despensa/carrito';
import { cobrar } from '@/lib/pagos/cobro';
import {
  BotonPagar, SeccionMedioDePago, useMedioDePago,
} from '@/components/seccion-medio-de-pago';
import { useEsperaDeConfirmacion } from '@/lib/pagos/espera-confirmacion';
import { useTraduccion } from '@/i18n';

/* 🔴 S101-B · FASE 3 — NACE `confirmando`.
   La v1 tenía TRES fases y **la espera no tenía dónde vivir**: el único camino
   desde `resumen` era `exito`, así que la pantalla no podía decir la verdad
   mientras el motor todavía no la sabía.
   *La PANTALLA de espera es Fase 4 — acá entra sólo el estado, que es la
   costura: sin él, la Fase 4 tendría que reformar el tipo antes de empezar.* */
type Fase = 'armado' | 'resumen' | 'confirmando' | 'exito';

/** Las cadencias ofrecidas (§6.1: cada N días, 7–90). Un menú corto y
 *  legible antes que un número libre — mismo criterio que el menú de
 *  duraciones del paseo. */
const CADENCIAS = [7, 15, 30, 60] as const;

/* ☠️ ACÁ VIVÍA `VOZ_COMPUERTA` — **con CERO consumidores** (Ley 37, medido
   por grep antes de borrarlo). Quedó muerto el día que las compuertas pasaron
   a correr server-side dentro de `pagos-cobro` y el código tipado empezó a
   llegar por la respuesta. Hoy la traducción código → frase vive **una sola
   vez**, en `lib/pagos/cobro.ts`, y **la comparten las dos puertas**:
   *un mapa de voces por pantalla es como el paseo y la despensa terminan
   diciendo cosas distintas sobre el mismo rechazo del mismo banco.* */

export default function DespensaCheckout() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { mostrar } = useAviso();

  const items = useCarrito();
  const navigation = useNavigation();

  const [fase, setFase] = useState<Fase>('armado');
  const [metodo, setMetodo] = useState<'despacho' | 'retiro'>('despacho');

  // ── La dirección y quién recibe ────────────────────────────────────────
  const [direccion, setDireccion] = useState<DireccionHogar | null | 'cargando'>('cargando');
  const [hojaDireccion, setHojaDireccion] = useState(false);
  /**
   * 🔴 S100c · LA LIBRETA — «Oficina», «Casa de mamá», además del hogar.
   *
   * Medido antes de construir: `direcciones_guardadas.alias` es NOT NULL y su
   * índice único es PARCIAL (`WHERE es_principal`) ⇒ **la tabla admitía N
   * direcciones desde siempre**; lo que faltaba era la puerta.
   *
   * `hojaLibreta` = elegir entre las guardadas. `hojaAlias` = crear una nueva
   * con nombre. Son DOS hojas y no una con modos: *una hoja que a veces lista
   * y a veces edita es dos pantallas compartiendo un título.*
   */
  const [direcciones, setDirecciones] = useState<DireccionGuardada[]>([]);
  const [hojaLibreta, setHojaLibreta] = useState(false);
  const [hojaAlias, setHojaAlias] = useState(false);
  const [receptor, setReceptor] = useState('');
  const [telefono, setTelefono] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  /** G-11 · quién recibe se EDITA en su Hoja, no en la pantalla de revisar. */
  const [hojaReceptor, setHojaReceptor] = useState(false);

  // ── La ventana de entrega ──────────────────────────────────────────────
  const [promesa, setPromesa] = useState<PromesaEntrega | 'cargando' | { fallo: string } | null>(null);
  const [fechaElegida, setFechaElegida] = useState<CampoFechaValor | undefined>(undefined);
  /** Las opciones del SelectorVentana: la más próxima + los tres días
   *  siguientes, en UNA ola paralela (L-223: olas, jamás cadenas). El día
   *  lleno se DIBUJA con su porqué — no desaparece (Ley 23 al revés: la
   *  puerta tampoco esconde lo que el usuario busca). */
  const [ventanas, setVentanas] = useState<OpcionVentana[] | 'cargando' | null>(null);

  // ── El pedido del motor ────────────────────────────────────────────────
  const clave = useRef(nuevaClaveIdempotencia());
  /** Los N pedidos creados — uno por vendedor (F5). Vacío = todavía no. */
  const [pedidos, setPedidos] = useState<PedidoCreado[]>([]);
  /** La compra que los agrupa: lo que se cobra. */
  const [compraId, setCompraId] = useState<string | null>(null);

  /* 🔴 S101-B · FASE 4 — LA ESPERA MIRA SOLA. Se activa únicamente en
     `confirmando`: pasarle `null` en las otras fases es lo que impide que el
     checkout sondee por existir. *La lección del andamio del alta otra vez:
     las pantallas no hacen cosas por estar abiertas.* */
  /* ☠️ EL ESTADO DE LOS MEDIOS SALE DE ACÁ (orden del founder ⑤): vivía
     copiado entre esta pantalla y el checkout de reserva. Hoy lo tiene
     `useMedioDePago`, una sola vez.
     🔴 Se activa en el RESUMEN y no antes: *mientras no haya un total que
     pagar, «con qué pagás» no es una pregunta.* */
  const medio = useMedioDePago(fase === 'resumen');

  const espera = useEsperaDeConfirmacion(
    fase === 'confirmando' && compraId ? { tipo: 'compra', id: compraId } : null,
  );

  /* ═══ 🔴 EL HOOK SE ESCUCHA — porque antes NO ═══════════════════════════
     **Medido en el aparato el 20-ago:** la compra quedó `pagada` en la base a
     los 34 s y la pantalla seguía diciendo «Estamos confirmando» **a los 78**.
     Causa: `useEsperaDeConfirmacion` se llamaba y **nadie leía su resultado**.

     Es *motor sin puerta* por tercera vez en el día, una capa más arriba cada
     vez. *La pieza estaba bien construida, probada, y desconectada del único
     lugar donde su resultado importa.* */
  useEffect(() => {
    if (espera.fase !== 'resuelta') return;
    /* Solo `pagada` es éxito. Los otros desenlaces **no se dibujan como
       éxito ni como rechazo**: la pantalla los dice con su voz y la compra
       sigue viva donde corresponda. */
    if (espera.estado === 'pagada') setFase('exito');
  }, [espera]);
  /** El total DE LA COMPRA, tal como lo devolvió el motor. Esta pantalla
   *  no lo suma: sumar acá sería el segundo lugar donde se calcula una
   *  plata, y el día que discrepe es en una factura. */
  const [compraTotal, setCompraTotal] = useState<number | null>(null);
  /** F6 · qué tienda prepara cada pedido. Sin entrada = no se pudo leer,
   *  y la línea NO se dibuja: jamás «Lo prepara: —». */
  const [tiendas, setTiendas] = useState<Record<string, string>>({});
  const [trabajando, setTrabajando] = useState(false);

  // ── La recurrencia (éxito) ─────────────────────────────────────────────
  /** 🔴 `null` = TODAVÍA NO ELIGIÓ, y no es lo mismo que 30 (G-13). El 30 que
   *  vivía acá era un default que el interruptor habría comprometido contra el
   *  motor sin que nadie lo dijera — *un default es una decisión que alguien
   *  toma en nombre de otro y no queda registrada.* */
  const [cadencia, setCadencia] = useState<number | null>(null);
  const [recurrenciaId, setRecurrenciaId] = useState<string | null>(null);
  const [activandoRec, setActivandoRec] = useState(false);
  /** La INTENCIÓN, separada del hecho: el interruptor la expresa, la cadencia
   *  la cierra. Sin esta separación el interruptor mentiría en el medio. */
  const [quiereRecurrencia, setQuiereRecurrencia] = useState(false);
  const [hojaRecurrencia, setHojaRecurrencia] = useState(false);

  /**
   * 🔴 S100 · LOS GRUPOS POR VENDEDOR — el cabezal (F5).
   *
   * ☠️ Acá vivía `items[0]?.cuentaComercialId`, **y se le aplicaba AL PEDIDO
   * ENTERO**. Con un carrito de dos vendedores eso creaba UN pedido a nombre
   * del primero **con mercadería del segundo, acreditada al primero** —
   * *plata al comerciante equivocado, sin error y sin traza.* Medido antes de
   * curarlo: **0 ítems mal atribuidos, $0** — el arma estaba cargada y no se
   * había disparado, porque hasta F5 nadie armaba carritos mixtos.
   *
   * Hoy el carrito se parte en **N pedidos independientes, cada uno bajo SU
   * cuenta**, y el motor lo garantiza por construcción: un trigger sobre
   * `pedido_items` rebota la oferta que no es del vendedor del pedido.
   */
  const grupos = useMemo(() => agruparPorVendedor(items), [items]);
  /** La promesa y las ventanas se piden para el PRIMER grupo. Con un vendedor
   *  —el caso de hoy— es exactamente lo de antes. Con varios, cada bloque del
   *  resumen muestra la suya (ver `promesasPorGrupo`). */
  const cuentaComercialId = grupos[0]?.cuentaComercialId ?? null;

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const [dir, perfil, libreta] = await Promise.all([
        obtenerDireccionHogar(),
        obtenerMiPerfil(),
        // Misma ola: el peaje es de la petición, no del volumen (L-223).
        listarMisDirecciones(),
      ]);
      if (libreta.ok) setDirecciones(libreta.data);
      if (!vigente) return;
      setDireccion(dir.ok ? dir.data : null);
      // Prefill honesto: lo que la casa ya sabe se ofrece, jamás se exige
      // de nuevo. Editable siempre — recibe quien el dueño diga.
      if (perfil.ok && perfil.data.nombre !== null) setReceptor((v) => (v === '' ? perfil.data.nombre ?? '' : v));
      const tel = (dir.ok ? dir.data?.telefono : null) ?? (perfil.ok ? perfil.data.telefono : null);
      if (tel !== null && tel !== undefined) setTelefono((v) => (v === '' ? tel : v));
    })();
    return () => {
      vigente = false;
    };
  }, []);

  // La promesa se pide cuando hay vendedor y el método es despacho. La
  // fecha programada re-pregunta contra el cupo de ESE día (§6.2).
  useEffect(() => {
    if (metodo !== 'despacho' || cuentaComercialId === null) {
      setPromesa(null);
      return;
    }
    let vigente = true;
    setPromesa('cargando');
    void calcularPromesaDespensa({
      cuenta_comercial_id: cuentaComercialId,
      fecha_programada: fechaElegida?.fecha,
    }).then((r) => {
      if (vigente) setPromesa(r.ok ? r.data : { fallo: r.codigo });
    });
    return () => {
      vigente = false;
    };
  }, [metodo, cuentaComercialId, fechaElegida]);

  // Las fechas hablan el idioma de la APP, no el del aparato (vara de C:
  // teléfono en inglés + app en español pintaba "Wednesday" en un checkout
  // en español). Día y día-de-semana salen del riel; la HORA no tiene
  // helper en el riel todavía — locale explícito por idioma, mismo par
  // que usa `fechas.ts` (es-EC / en-US).
  const horaLocal = (iso: string) =>
    new Date(iso).toLocaleTimeString(idioma === 'en' ? 'en-US' : 'es-EC', {
      hour: '2-digit',
      minute: '2-digit',
    });
  const diaLocal = (fecha: string) => fechaDiaSemanaHumana(fecha, idioma);
  const diaCorto = (fecha: string) =>
    `${diaSemanaCorto(fecha, idioma)} ${Number(fecha.slice(8, 10))}`;

  /** yyyy-mm-dd LOCAL a n días — jamás `toISOString` (corre el día
   *  después de las 19:00 en UTC-5, hallazgo de harness S55). */
  function fechaLocalMasDias(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Las opciones de ventana: base ("la más próxima") + mañana..+3, todas
  // en paralelo. Un día cuya promesa CORRE a otro día (saltos>0) está
  // lleno: se dibuja sin_cupo con su motivo, jamás se esconde.
  useEffect(() => {
    if (metodo !== 'despacho' || cuentaComercialId === null) {
      setVentanas(null);
      return;
    }
    let vigente = true;
    setVentanas('cargando');
    const dias = [1, 2, 3].map(fechaLocalMasDias);
    void Promise.all([
      calcularPromesaDespensa({ cuenta_comercial_id: cuentaComercialId }),
      ...dias.map((f) =>
        calcularPromesaDespensa({ cuenta_comercial_id: cuentaComercialId, fecha_programada: f }),
      ),
    ]).then(([base, ...porDia]) => {
      if (!vigente) return;
      const opciones: OpcionVentana[] = [];
      if (base.ok) {
        opciones.push({
          clave: 'proxima',
          etiqueta: t('despensa.ventanaProxima'),
          detalle: `${diaCorto(base.data.fecha)} · ${horaLocal(base.data.desde)}–${horaLocal(base.data.hasta)}`,
          estado: 'elegible',
        });
      }
      porDia.forEach((r, i) => {
        const fecha = dias[i];
        // El día que la base ya cubre no se repite.
        if (base.ok && base.data.fecha === fecha) return;
        if (r.ok && r.data.fecha === fecha) {
          opciones.push({
            clave: fecha,
            etiqueta: diaCorto(fecha),
            detalle: `${horaLocal(r.data.desde)}–${horaLocal(r.data.hasta)}`,
            estado: 'elegible',
          });
        } else if ((r.ok && r.data.fecha !== fecha) || (!r.ok && r.codigo === 'sin_cupo_ese_dia')) {
          opciones.push({
            clave: fecha,
            etiqueta: diaCorto(fecha),
            estado: 'sin_cupo',
            motivo: t('despensa.sinLugarEseDia'),
          });
        }
        // Otros errores: el día no se dibuja — dibujarlo como lleno sería
        // afirmar algo que no se midió (L-139).
      });
      setVentanas(opciones);
    });
    return () => {
      vigente = false;
    };
  }, [metodo, cuentaComercialId, t]);

  /** Qué falta para poder ver el total — el apagado DICE (S73-B). */
  const falta: string | null = useMemo(() => {
    if (items.length === 0) return t('despensa.faltaItems');
    if (cuentaComercialId === null) return t('despensa.faltaVendedor');
    if (metodo === 'despacho') {
      if (direccion === 'cargando') return t('despensa.faltaCargando');
      if (direccion === null) return t('despensa.faltaDireccion');
      // §7 — el punto es OBLIGATORIO para el despacho: sin él, el
      // repartidor busca una casa que Places quizás nunca encontró.
      if (direccion.lat === null || direccion.lon === null) return t('despensa.faltaPunto');
      if (receptor.trim() === '') return t('despensa.faltaReceptor');
      if (telefono.trim() === '') return t('despensa.faltaTelefono');
      if (promesa !== null && typeof promesa === 'object' && 'fallo' in promesa) {
        return t('despensa.faltaPromesa');
      }
    } else {
      if (receptor.trim() === '') return t('despensa.faltaReceptor');
      if (telefono.trim() === '') return t('despensa.faltaTelefono');
    }
    return null;
  }, [items, cuentaComercialId, metodo, direccion, receptor, telefono, promesa, t]);

  /**
   * 🔴 UN PEDIDO POR VENDEDOR, Y UNA COMPRA QUE LOS AGRUPA (F5).
   *
   * · Los N pedidos se crean **en paralelo, no encadenados** (L-223 / N16.1:
   *   el peaje por petición es ~150 ms y no depende de cuánto traiga).
   * · **Si alguno falla, se cancelan los que sí entraron** antes de rebotar.
   *   *Dejar medio carrito convertido en pedidos huérfanos es exactamente la
   *   clase de los 137 del prototipo.*
   * · Recién con los N creados nace **la compra**, que es lo que se cobra:
   *   **N pedidos atrás, UN pago adelante.**
   * · La clave de idempotencia es **la misma del intento**, con el índice del
   *   grupo: un reintento reencuentra sus pedidos en vez de duplicarlos.
   */
  async function verTotal() {
    if (trabajando || falta !== null || grupos.length === 0) return;
    setTrabajando(true);
    const dir = direccion !== 'cargando' ? direccion : null;
    const entrega = {
      nombre_receptor: receptor.trim(),
      telefono: telefono.trim(),
      // Retiro: el motor estampa "Retiro en tienda" cuando no hay
      // dirección — acá no se inventa una.
      direccion: metodo === 'despacho' && dir !== null ? dir.direccion : '',
      ciudad: metodo === 'despacho' && dir !== null ? dir.ciudad : '',
      sector: metodo === 'despacho' ? dir?.sector ?? undefined : undefined,
      referencias: metodo === 'despacho' ? dir?.referencias ?? undefined : undefined,
      instrucciones: instrucciones.trim() === '' ? undefined : instrucciones.trim(),
      lat: metodo === 'despacho' ? dir?.lat ?? undefined : undefined,
      lon: metodo === 'despacho' ? dir?.lon ?? undefined : undefined,
    };

    const creados = await Promise.all(
      grupos.map((g, i) =>
        crearPedidoDespensa({
          cuenta_comercial_id: g.cuentaComercialId,
          items: g.items.map((it) => ({
            oferta_id: it.oferta_id,
            cantidad: it.cantidad,
            mascota_id: it.destino?.tipo === 'mascota' ? it.destino.mascotaId : undefined,
            donacion: it.destino?.tipo === 'donacion' ? true : undefined,
          })),
          entrega,
          clave_idempotencia: `${clave.current}:g${i}`,
          metodo_entrega: metodo,
          fecha_programada: fechaElegida?.fecha,
        }),
      ),
    );

    const okIds = creados.filter((r) => r.ok).map((r) => (r as { data: PedidoCreado }).data);
    const fallo = creados.find((r) => !r.ok);
    if (fallo !== undefined && !fallo.ok) {
      // 🔴 CERO HUÉRFANOS: lo que sí entró se cancela antes de rebotar.
      await Promise.all(
        okIds.map((p) => cancelarPedidoDespensa(p.pedido_id, 'grupo_incompleto_en_checkout')),
      );
      setTrabajando(false);
      mostrar({ texto: fallo.mensaje, variante: 'error' });
      return;
    }

    // LA COMPRA: lo que se cobra. Su id es el `dev_reference` de la pasarela.
    const c = await crearCompraDesdePedidos(
      okIds.map((p) => p.pedido_id),
      clave.current,
    );
    setTrabajando(false);
    if (!c.ok) {
      mostrar({ texto: c.mensaje, variante: 'error' });
      return;
    }
    setPedidos(okIds);
    setCompraId(c.data.compra_id);
    setCompraTotal(c.data.total);
    // F6: el nombre de la tienda, en UN viaje para los N pedidos.
    const nom = await obtenerNombresTiendaPorPedido(okIds.map((p) => p.pedido_id));
    if (nom.ok) setTiendas(nom.data);
    setFase('resumen');
  }

  /** Volver a editar CANCELA **los N pedidos** creados — cero huérfanos. */
  async function volverAEditar() {
    if (trabajando) return;
    if (pedidos.length > 0) {
      setTrabajando(true);
      const rs = await Promise.all(
        pedidos.map((p) => cancelarPedidoDespensa(p.pedido_id, 'edicion_en_checkout')),
      );
      setTrabajando(false);
      const fallo = rs.find((r) => !r.ok);
      if (fallo !== undefined && !fallo.ok) {
        mostrar({ texto: fallo.mensaje, variante: 'error' });
        return;
      }
      setPedidos([]);
      setCompraId(null);
      setCompraTotal(null);
      setTiendas({});
      // La clave era de ESE intento: el próximo pedido es otro intento.
      clave.current = nuevaClaveIdempotencia();
    }
    setFase('armado');
  }

  /**
   * 🔴 UN SOLO COBRO PARA LA FAMILIA: se paga **la compra**, no los pedidos.
   * `crearIntentoPago` aparta la mercadería de todos, congela el desglose y
   * devuelve la `referencia` que la pasarela va a llevar como `dev_reference`.
   * **Si a algún pedido no le queda stock, rebota con el nombre del producto y
   * la compra entera no avanza** — una compra que cobra un total no puede
   * quedar medio reservada.
   *
   * ⚠️ Esto es el INTENTO. La confirmación final la da el servidor: que el
   * proveedor conteste «aprobado» es señal optimista, no el hecho.
   */
  /**
   * 🔴 S101-B · FASE 3 — EL ENCHUFE. Acá `pagar()` DEJA DE DECLARAR ÉXITO POR
   * SU CUENTA.
   *
   * Lo que hacía la v1 era correcto **para un cobro simulado** (el método por
   * defecto de `crearIntentoPago` es literalmente `'simulado'`): pasaba a
   * `exito` con el sobre en la mano. **Lo que la vuelve falsa es que el cobro
   * ahora es real.**
   *
   * El orden, y cada paso tiene su porqué:
   *   ① preparar la compra (reserva + desglose congelado) — ya existía
   *   ② **LAS COMPUERTAS, ANTES DE TOCAR LA TARJETA** — *la plata que no se
   *      cobra mal no hay que devolverla, y el reverso es mismo-día*
   *   ③ el débito
   *   ④ `confirmando` — **la respuesta síncrona es SEÑAL OPTIMISTA, jamás
   *      confirmación**: confirma el webhook, o el barrido
   *
   * 🔴 **Nada de esto nace por abrirse ni por re-renderizar.** Corre al TOCAR,
   * y solo al tocar. *Es la lección del andamio del alta —una pantalla que
   * fabricaba estado por abrirse volvió inobservable un vencimiento—, cumplida
   * acá por construcción y no por cuidado.*
   */
  async function pagar() {
    if (trabajando || compraId === null) return;
    setTrabajando(true);

    // ① Preparar la compra. NO cobra: aparta y congela (lápida vigente).
    const r = await crearIntentoPago(compraId);
    if (!r.ok) {
      setTrabajando(false);
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }

    /* ☠️ FASE 5 · «LA MÁS RECIENTE» MURIÓ ACÁ.
       Era regla de ANDAMIO y nació declarándolo: **elegir por la familia cuál
       de sus tarjetas se cobra es exactamente lo que una pantalla de medios de
       pago existe para no hacer.** Ahora se cobra **la que ella eligió**, y si
       no eligió ninguna la pantalla se lo pide antes de tocar nada. */

    /* ═══ 🔴 LAS COMPUERTAS NO SE LLAMAN DESDE ACÁ, Y NO ES POR UN GRANT ═══
       Medido: `verificar_compuertas_pre_cobro` **no es ejecutable por
       `authenticated`** (`has_function_privilege` = false). Mi primera versión
       la llamaba igual desde la app, y por eso el cobro salía con la voz
       genérica: el RPC rebotaba antes de llegar al cobro.

       **Y conceder el permiso habría sido la cura equivocada.** La función es
       DEFINER y **no verifica pertenencia**: con EXECUTE, cualquiera podría
       pasarle ids de compras ajenas y aprender su estado — *un oráculo de
       compras de otros, abierto para ahorrarnos un viaje.*

       ⇒ **Las compuertas corren SERVER-SIDE dentro de `pagos-cobro`**, que sí
       verifica pertenencia, y **devuelve el código tipado**. La app le da voz a
       ESE código. La letra se cumple igual —*cada fallo con su voz antes de
       tocar la tarjeta*— porque **la tarjeta no se toca hasta después de que
       las compuertas corrieron**; lo único que cambia es quién las corre. */

    // ③④ El débito y la espera declarada — **por el cobro de la casa**.
    //    ☠️ El andamio `cobrarConTarjetaGuardada` murió acá: su lápida decía
    //    «muere en la Fase 5», y la Fase 5 cerró.
    const cobro = await cobrar({ tipo: 'compra', id: compraId }, medio.elegido);
    setTrabajando(false);
    if (!cobro.ok) {
      mostrar({ texto: t(cobro.voz), variante: 'error' });
      return;
    }

    vaciarCarrito();
    /* 🔴 `confirmando`, NO `exito`: el proveedor contestó, pero **el hecho lo
       tiene el servidor**. La pantalla de esta espera es Fase 4. */
    setFase('confirmando');
  }

  /** §6.1 — la recurrencia se activa desde el éxito, con el mensaje
   *  honesto VERBATIM de la letra y el cobro real esperando pasarela.
   *  Y SE APAGA EN UN TOQUE, desde donde se prendió (condición ② de la
   *  letra) — el toggle que solo prendía era un defecto, no una versión. */
  async function alternarRec(encendido: boolean) {
    if (activandoRec) return;
    if (!encendido) {
      setQuiereRecurrencia(false);
      setCadencia(null);
      // Apagar con la intención puesta y sin cadencia elegida no toca el
      // motor: nunca se creó nada que apagar.
      if (recurrenciaId === null) return;
      setActivandoRec(true);
      const r = await alternarRecurrencia(recurrenciaId, false);
      setActivandoRec(false);
      if (!r.ok) {
        mostrar({ texto: r.mensaje, variante: 'error' });
        return;
      }
      setRecurrenciaId(null);
      mostrar({ texto: t('despensa.recurrenciaApagada'), variante: 'exito' });
      return;
    }
    // Prender declara la INTENCIÓN y revela las frecuencias. El motor se toca
    // recién cuando la familia dice cada cuánto (G-13).
    setQuiereRecurrencia(true);
  }

  /** Lo que SÍ compromete al motor, con la cadencia que la familia eligió. */
  async function activarRecurrenciaCon(dias: number) {
    if (activandoRec || recurrenciaId !== null) return;
    if (cuentaComercialId === null) return;
    setActivandoRec(true);
    // 🔴 SIEMPRE el ref (vara de C ②): en el éxito el carrito puede
    // REPOBLARSE desde otra tab con esta pantalla montada, y el ternario
    // que caía al carrito vivo configuraría la recurrencia con la compra
    // NUEVA en vez de la hecha. Los refs se congelaron para esto.
    const r = await configurarRecurrencia({
      cuenta_comercial_id: cuentaComercialId,
      items: itemsCompradosRef.current,
      entrega: entregaCompradaRef.current,
      frecuencia_dias: dias,
      metodo_entrega: metodo,
    });
    setActivandoRec(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    setRecurrenciaId(r.data.recurrencia_id);
    mostrar({ texto: t('despensa.recurrenciaActiva'), variante: 'exito' });
  }

  // El éxito vacía el carrito, pero la recurrencia necesita los ítems y la
  // entrega del pedido que se acaba de comprar: se congelan al pagar.
  const itemsCompradosRef = useRef<{ oferta_id: string; cantidad: number; mascota_id?: string; donacion?: boolean }[]>([]);
  const entregaCompradaRef = useRef<{ nombre_receptor: string; telefono: string; direccion: string; ciudad: string; sector?: string; referencias?: string; instrucciones?: string; lat?: number; lon?: number }>({
    nombre_receptor: '',
    telefono: '',
    direccion: '',
    ciudad: '',
  });
  useEffect(() => {
    if (fase !== 'resumen') return;
    const dir = direccion !== 'cargando' ? direccion : null;
    itemsCompradosRef.current = items.map((i) => ({
      oferta_id: i.oferta_id,
      cantidad: i.cantidad,
      mascota_id: i.destino?.tipo === 'mascota' ? i.destino.mascotaId : undefined,
      donacion: i.destino?.tipo === 'donacion' ? true : undefined,
    }));
    entregaCompradaRef.current = {
      nombre_receptor: receptor.trim(),
      telefono: telefono.trim(),
      direccion: metodo === 'despacho' && dir !== null ? dir.direccion : '',
      ciudad: metodo === 'despacho' && dir !== null ? dir.ciudad : '',
      sector: metodo === 'despacho' ? dir?.sector ?? undefined : undefined,
      referencias: metodo === 'despacho' ? dir?.referencias ?? undefined : undefined,
      instrucciones: instrucciones.trim() === '' ? undefined : instrucciones.trim(),
      lat: metodo === 'despacho' ? dir?.lat ?? undefined : undefined,
      lon: metodo === 'despacho' ? dir?.lon ?? undefined : undefined,
    };
  }, [fase, items, receptor, telefono, direccion, metodo, instrucciones]);

  const dinero = (v: number | null) => (v !== null ? `$ ${v.toFixed(2)}` : null);

  /** 🔴 EL BACK POR GESTO NO ESQUIVA LA CANCELACIÓN. El chevron del
   *  encabezado pasa por `volverAEditar`, pero el gesto del sistema y el
   *  botón físico de Android sacan la pantalla SIN pasar por ahí — y eso
   *  dejaba el pedido `creado` huérfano (la clase exacta de los 137).
   *  `beforeRemove` intercepta TODAS las salidas: con pedido vivo y sin
   *  pagar, la salida se convierte en volver-a-editar (que cancela). */
  useEffect(() => {
    const sub = navigation.addListener('beforeRemove', (e) => {
      if (pedidos.length === 0 || fase === 'exito') return;
      e.preventDefault();
      void volverAEditar();
    });
    return sub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, pedidos, fase, trabajando]);

  /** EL PIE POR FASE — el apagado dice qué falta.
   *  `undefined` cuando no hay acción (carrito vacío): la pieza entonces NO
   *  dibuja pie y NO reserva nada. *Antes esa rama pintaba una barra vacía y
   *  le robaba su alto al contenido igual.* */
  const pieDelCta =
    fase === 'armado' && items.length > 0 ? (
      <>
        {falta !== null ? <Texto variante="apoyo">{falta}</Texto> : null}
        <Boton
          etiqueta={t('despensa.verTotal')}
          bloque
          cargando={trabajando}
          deshabilitado={falta !== null}
          onPress={() => void verTotal()}
        />
      </>
    ) : fase === 'resumen' ? (
      /* 🔴 G-12 · UN SOLO SÓLIDO. Eran DOS botones del mismo peso apilados
         —«Pagar (simulado)» y «Volver a editar»—, y B lo dijo con la frase
         justa: *dos bloques del mismo peso significan que nadie decidió cuál
         importa.* Acá importa pagar; volver a editar es la salida, y una
         salida no compite con el destino.
         Ley 19.7 / 22c: EJECUTA (cancela el pedido y vuelve a armado) ⇒
         label sin chevron. */
      <>
        <BotonPagar
          medio={medio}
          trabajando={trabajando}
          onPagar={() => void pagar()}
        />
        {/* ☠️ «VOLVER A EDITAR» MURIÓ ACÁ (founder, 21-ago): *«es redundante
            con la flecha atrás que está arriba y nos tapa de una ojeada el
            medio de pago»*.

            🔴 **Se midió antes de sacarlo, porque no era obvio:** el botón
            **cancela los pedidos creados y libera el stock**, y la flecha
            podría haber sido solo navegación — sacarlo así habría dejado
            pedidos huérfanos reteniendo mercadería, en silencio.
            **La medición lo desactivó: `onAtras` YA llama a `volverAEditar()`
            en la fase `resumen`.** Misma conducta, un control menos.
            *El freno se disuelve contra el objeto, que es como tiene que
            terminar un freno que resultó innecesario.* */}
      </>
    ) : fase === 'exito' ? (
      <Boton
        etiqueta={t('despensa.verTusPedidos')}
        bloque
        onPress={() => router.replace('/pedidos')}
      />
    ) : fase === 'confirmando' ? (
      /* 🔴 La salida existe DESDE EL PRIMER SEGUNDO. *Una espera sin puerta es
         una pantalla que retiene: el pedido avanza igual sin que nadie la
         mire, y decirlo es lo que la vuelve honesta.* */
      <Boton
        etiqueta={t('pago.esperaVerPedidos')}
        bloque
        onPress={() => router.replace('/pedidos')}
      />
    ) : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {fase === 'exito' || fase === 'confirmando' ? (
        /* En el éxito NO hay atrás: el pedido ya vive en el motor y volver
           al checkout de una compra hecha sería una puerta a pagar dos
           veces. La única salida es Tus pedidos. */
        /* Ni en el éxito ni en la espera hay atrás: volver al checkout de una
           compra ya disparada sería una puerta a pagar dos veces. */
        <Encabezado
          variante="navegacion"
          /* 🔴 El título del HEADER es corto a propósito: «Estamos confirmando tu
             pago» **se truncaba en pantalla** («…tu pa…»), y un título cortado
             en el momento en que la familia acaba de entregar su tarjeta es
             peor que uno breve. La frase entera vive en el CUERPO, que es
             donde hay lugar para decirla. */
          titulo={fase === 'confirmando' ? t('pago.esperaTituloCorto') : t('despensa.exitoTitulo')}
        />
      ) : (
        <Encabezado
          variante="navegacion"
          titulo={t('despensa.checkoutTitulo')}
          atras
          onAtras={() => {
            if (fase === 'resumen') {
              void volverAEditar();
              return;
            }
            router.back();
          }}
        />
      )}

      <EvitaTeclado>
      {/* 🔴 H-105 · EL PIE RESERVA SU PROPIO LUGAR (pieza de B).
          Esta pantalla YA derivaba su reserva con un `onLayout` propio, así
          que su solape ③ —«Instrucciones de entrega» debajo del CTA— **no lo
          explicaba la estimación**, que era la causa del carrito. Se monta la
          pieza igual, y por dos razones: deja UNA sola anatomía de pie en la
          despensa (el `barAlto` a mano era el segundo mecanismo, y dos
          mecanismos divergen), y mete el pie DENTRO del `EvitaTeclado`, que es
          la hipótesis viva de ese solape — antes el CTA vivía afuera y no se
          movía con el teclado. **Lo confirma el aparato, no yo**: queda pedido
          a B, que lo tiene. */}
      <PantallaConPie
        scrollProps={{ keyboardShouldPersistTaps: 'handled' }}
        contentContainerStyle={{ paddingTop: spacing[4], gap: spacing[5] }}
        pie={pieDelCta}
      >
        {fase === 'armado' ? (
          items.length === 0 ? (
            <EstadoVacio
              titulo={t('despensa.carritoVacioTitulo')}
              descripcion={t('despensa.carritoVacioDetalle')}
              accion={
                <Boton
                  variante="secundario"
                  etiqueta={t('despensa.carritoVacioIr')}
                  onPress={() => router.back()}
                />
              }
            />
          ) : (
            <>
              {/* 1 · CÓMO TE LLEGA */}
              <View style={{ paddingHorizontal: spacing[5] }}>
                <SelectorOpcion
                  etiqueta={t('despensa.metodoEntrega')}
                  opciones={[
                    { codigo: 'despacho', etiqueta: t('despensa.metodoDespacho') },
                    { codigo: 'retiro', etiqueta: t('despensa.metodoRetiro') },
                  ]}
                  seleccionada={metodo}
                  onSelect={(c) => setMetodo(c as 'despacho' | 'retiro')}
                  acento="control"
                />
              </View>

              {metodo === 'retiro' ? (
                <View style={{ paddingHorizontal: spacing[5] }}>
                  <Texto variante="apoyo">{t('despensa.retiroDetalle')}</Texto>
                </View>
              ) : (
                <View style={{ paddingHorizontal: spacing[5] }}>
                {/* 🔴 PUNTO 17 (S100d) · LA FICHA DE ENTREGA.
                    ═══════════════════════════════════════════════════════════
                    Founder, verbatim: *«Falta el glifo de ubicación —sin huella
                    dentro— y el label necesita soporte: crear una FICHA DE
                    ENTREGA. Lo demás está bien»*.

                    N21 lo autoriza y además nombra estas secciones con todas
                    las letras: *«si el bloque tiene un rótulo que lo nombra
                    («A dónde te lo llevamos», «Quién recibe») ese rótulo está
                    declarando un grupo ⇒ el grupo va en carta. Un rótulo sin
                    superficie es un grupo que se anunció y no se dibujó»*.
                    Acá había CUATRO rótulos y CERO superficies.

                    ⚠️ POR QUÉ **UNA** CARTA Y NO CUATRO, que es la decisión:
                    los puntos 18 («quién recibe») y 19 («cuándo se entrega»)
                    están ✅ APROBADOS por el founder. Cuatro cartas los
                    reestructura; UNA los deja intactos y solo pone el piso que
                    faltaba. *Y son una sola cosa —la entrega—, que es lo que el
                    founder nombró en singular.*

                    ⚠️ `relleno="ninguno"` NO ES DECORACIÓN — es lo que conserva
                    la anatomía de adentro: con relleno normal, la carta metería
                    su propio padding y `CeldaNavegacion` dejaría de salir a
                    sangre, que es el patrón que E14 fijó para la dirección.
                    Con `ninguno`, «a sangre» pasa a significar «al borde de la
                    carta» en vez de «al borde de la pantalla», y la celda sigue
                    siendo el control de ancho completo que era.

                    LA ARITMÉTICA, declarada porque NO SE VIO EN APARATO: los
                    cinco `paddingHorizontal` de adentro bajan de `spacing[5]`
                    (20) a `spacing[3]` (12) — el relleno normal de la casa
                    dentro de una carta. La carta se separa 20 de la pantalla.
                    ⇒ el rótulo queda a **32** del borde de la pantalla contra
                    los 20 de antes, y la celda a **20** contra 0.
                    *Introducir una carta MUEVE cosas: no hay forma de que no lo
                    haga. Los números van escritos para que el ojo del gate
                    juzgue un corrimiento declarado y no una sorpresa.* */}
                <Tarjeta relleno="ninguno">
                <View style={{ gap: spacing[4], paddingVertical: spacing[4] }}>
                  {/* 2 · A DÓNDE (§7) */}
                  <View style={{ gap: spacing[2] }}>
                    {/* 🔴 S100d·bis · LA GOTA JUNTO A LA DIRECCIÓN.
                        Founder: *«la gota con borde grueso ocre fuera del mapa,
                        junto a la dirección»*. Es la otra mitad del punto 17 —
                        *«el label necesita soporte»*: el rótulo deja de ser una
                        línea de texto suelta y pasa a tener una marca que dice
                        de qué habla.

                        ⚠️ NO reemplaza el glifo de la `CeldaNavegacion` de
                        abajo, y es decisión de la pieza (B): son dos trabajos
                        distintos —éste rotula la sección, aquél marca la fila—
                        y por eso `CeldaNavegacion` NO cambió de contrato.

                        ⚠️ Y EL OCRE NO ES UNA EXCEPCIÓN A N26: la ley se
                        ENSANCHÓ. Su primera redacción decía «ocre = acción de
                        compra» y dos pistas llegaron al mismo borde el mismo
                        día (esta gota y la flecha del acordeón de C), ninguna
                        de las dos compra. N26 v2: **«¿ACCIONA o SELECCIONA?»**
                        — comprar era un caso de accionar, no la categoría.
                        *Frené el montaje hasta que la ley lo dijera, en vez de
                        montar un ocre que la contradijera.* */}
                    <View
                      style={{
                        paddingHorizontal: spacing[3],
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing[2],
                      }}
                    >
                      <GotaUbicacion />
                      <Texto variante="seccion">{t('despensa.aDonde')}</Texto>
                    </View>
                    {direccion === 'cargando' ? null : direccion === null ? (
                      <View style={{ paddingHorizontal: spacing[3], gap: spacing[2] }}>
                        <Texto variante="apoyo">{t('despensa.sinDireccion')}</Texto>
                        <Boton
                          variante="secundario"
                          etiqueta={t('despensa.agregarDireccion')}
                          onPress={() => setHojaDireccion(true)}
                        />
                      </View>
                    ) : (
                      /* 🔴 G-11 · LA DIRECCIÓN ES UNA LÍNEA CON CHEVRON, no un
                         botón. Acá vivía un `Boton secundario` de ancho casi
                         completo debajo de la dirección — dos bloques para una
                         cosa. La industria (referencia-laika-direccion) usa la
                         propia línea como el control, y la casa ya tiene esa
                         anatomía: `CeldaNavegacion`.
                         E14 lo autoriza con chevron a la derecha: no navega a
                         otra pantalla, pero **abre el formulario que la
                         resuelve**, que es el mismo criterio. */
                      <CeldaNavegacion
                        /* A-06 (S100c) · el pin, pedido por el founder: *«ahí
                           le falta el pin o el glifo de ubicación»*.
                           ⚠️ Mi arranque decía que el glifo era de B y había que
                           pedírselo. **Falso, medido:** `ubicacion` ya existe en
                           el registry (`Icono.tsx:800`, capa `cuidado`) desde el
                           lote b′. *Pedir una pieza construida cuesta una vuelta
                           de canal y la respuesta es un grep.* */
                        icono="ubicacion"
                        titulo={direccion.direccion}
                        detalle={[direccion.ciudad, direccion.referencias]
                          .filter((x): x is string => x !== null && x !== '')
                          .join(' · ')}
                        /* Con UNA sola dirección la libreta no tiene nada que
                           elegir: el toque va derecho a editarla. Con dos o
                           más, abre la libreta. *Un selector de un elemento es
                           un paso que no decide nada.* */
                        onPress={() =>
                          direcciones.length > 1 ? setHojaLibreta(true) : setHojaDireccion(true)
                        }
                      />
                    )}
                  </View>

                  {/* 3 · QUIÉN RECIBE — SE MUESTRA, NO SE EDITA ACÁ (G-11).
                      ═══════════════════════════════════════════════════════
                      Eran DOS campos de edición abiertos en la pantalla donde
                      la familia REVISA antes de pagar. El gate pidió que se
                      muestren fijos: *editar es otro momento.* Un campo abierto
                      invita a escribir; acá el trabajo es leer y confirmar.

                      LO QUE NO SE PIERDE: se sigue pudiendo cambiar —el dato
                      del perfil no siempre es quien recibe— pero por un toque
                      explícito, no por tener el cursor a mano.

                      Y CUANDO FALTA EL DATO, la línea lo DICE y el toque lo
                      resuelve: mostrar fijo un vacío sería un callejón, que es
                      peor que el campo que se sacó. */}
                  <View style={{ gap: spacing[2] }}>
                    <View style={{ paddingHorizontal: spacing[3] }}>
                      <Texto variante="seccion">{t('despensa.quienRecibe')}</Texto>
                    </View>
                    <CeldaNavegacion
                      titulo={receptor.trim() === '' ? t('despensa.faltaReceptor') : receptor}
                      detalle={
                        telefono.trim() === '' ? t('despensa.faltaTelefono') : telefono
                      }
                      onPress={() => setHojaReceptor(true)}
                    />
                  </View>

                  {/* 4 · LA INSTRUCCIÓN QUE DECIDE (§9.3) — EL ÚNICO CAMPO de
                      la pantalla, tal como pidió el gate. Y es justo el que
                      quedaba tapado por el CTA (medición de B, solape ③). */}
                  <View style={{ paddingHorizontal: spacing[3], gap: spacing[2] }}>
                    <Campo
                      label={t('despensa.instruccionesLabel')}
                      value={instrucciones}
                      onChangeText={(v) => setInstrucciones(v.slice(0, 200))}
                      ayuda={t('despensa.instruccionesAyuda')}
                      autoCapitalize="sentences"
                    />
                  </View>

                  {/* 4 · CUÁNDO — la ventana que el cupo respalda (§6.2/§7.2) */}
                  <View style={{ paddingHorizontal: spacing[3], gap: spacing[2] }}>
                    <Texto variante="seccion">{t('despensa.cuandoLlega')}</Texto>
                    {cuentaComercialId === null ? (
                      /* Hueco declarado #1 — el estado honesto, jamás una
                         ventana inventada (L-139). */
                      <Texto variante="apoyo">{t('despensa.sinVendedorDetalle')}</Texto>
                    ) : promesa === 'cargando' || promesa === null ? (
                      <Texto variante="apoyo">{t('despensa.promesaCargando')}</Texto>
                    ) : 'fallo' in promesa ? (
                      <Texto variante="apoyo" color="warning">
                        {promesa.fallo === 'sin_cupo_ese_dia'
                          ? t('despensa.sinCupoEseDia')
                          : promesa.fallo === 'sin_turnos_de_entrega' || promesa.fallo === 'sin_capacidad_de_reparto'
                            ? t('despensa.vendedorSinReparto')
                            : t('despensa.promesaFallo')}
                      </Texto>
                    ) : (
                      <>
                        <Texto variante="cuerpo">
                          {t('despensa.promesaVentana', {
                            dia: diaLocal(promesa.fecha),
                            desde: horaLocal(promesa.desde),
                            hasta: horaLocal(promesa.hasta),
                          })}
                        </Texto>
                        {promesa.saltos_por_cupo > 0 ? (
                          /* El día pedido estaba lleno y la promesa corrió —
                             SE DICE (§7.3: el excedente no rompe, se corre). */
                          <Texto variante="apoyo">{t('despensa.saltoPorCupo')}</Texto>
                        ) : null}
                      </>
                    )}
                    {/* Las opciones — el día lleno se DIBUJA con su porqué.
                        ☠️ S100b · G-16: NO lleva `onProgramarOtra`. Ver abajo. */}
                    {ventanas === 'cargando' ? null : ventanas !== null && ventanas.length > 0 ? (
                      <SelectorVentana
                        /* 🔴 A-05 (S100c) · LA TIRA. El founder: «cuándo se
                           entrega» es invisible sin deslizar.
                           **B lo midió y es peor que eso:** la sección arranca
                           en **y = 595,9 dp** y el pie fijo empieza en ~**593**
                           ⇒ no es que haya que deslizar, es que **nace debajo
                           del pie**. Cuatro opciones apiladas de hasta tres
                           líneas, después de dirección y quién recibe.
                           El eje no se inventó: `SelectorOpcion` tiene
                           `disposicion` fila/tira/grilla desde S55-B4, y la
                           tira nació justo para esto (el CUÁNDO tipo Teams).
                           ⚠️ LA LEY 23 SIGUE EN PIE Y ES FÁCIL DE ROMPER ACÁ:
                           en `tira` el día lleno **recibe el toque** —hace
                           falta para contar SU motivo cuando hay más de uno—
                           pero **jamás llama a `onElegir`**. El servidor sigue
                           sin poder recibir un día sin cupo. *Si alguien
                           cablea `onElegir` en esa rama, rompe la ley* (aviso
                           de B, dueña de la pieza). */
                        disposicion="tira"
                        opciones={ventanas}
                        elegida={fechaElegida?.fecha ?? 'proxima'}
                        onElegir={(clave) => {
                          if (clave === 'proxima') {
                            setFechaElegida(undefined);
                          } else {
                            setFechaElegida({ fecha: clave, precision: 'exacta' });
                          }
                        }}
                      />
                    ) : null}
                    {/* ═══════════════════════════════════════════════════════
                        ☠️ ACÁ VIVÍA «PROGRAMAR OTRA FECHA» — DEROGADO POR FIRMA
                        DEL FOUNDER (17-ago-2026, gate de S100 · G-16).
                        Murieron: el `onProgramarOtra` del SelectorVentana, el
                        `CampoFecha` que abría, el estado `mostrarCalendario` y
                        las voces `programarFecha` / `programarPlaceholder` /
                        `programarAyuda` / `quitarFecha`.

                        POR QUÉ ESTA LÁPIDA Y NO UN BORRADO LIMPIO: el founder
                        lo pidió quitar REPETIDAMENTE y volvía en cada ronda.
                        No fue desobediencia — la letra decía «Entra» y la letra
                        gana. Hoy `LETRA_RECORRIDO_DESPENSA_S96` §6.2 está
                        tachada con su razón, y `verify:diseno` R52 lo vigila.

                        QUÉ **NO** MURIÓ, para que nadie lo barra de más: el
                        CUPO por día futuro sigue vigente y es lo que respalda
                        la promesa, y `calcular_promesa_despensa` conserva su
                        `p_fecha_programada` — eso es MOTOR. Se quitó la puerta,
                        no el motor: el día que vuelva por decisión, vuelve sin
                        reconstruirse. `SelectorVentana` conserva su prop
                        opcional intacta por el mismo motivo.

                        Y volver a la más próxima NO se perdió: la opción
                        `proxima` del propio selector la devuelve (por eso el
                        botón «quitarFecha» se fue con el bloque y no dejó
                        callejón).
                        ═══════════════════════════════════════════════════════ */}
                  </View>
                </View>
                </Tarjeta>
                </View>
              )}
            </>
          )
        ) : fase === 'resumen' && pedidos.length > 0 ? (
          <>
            {/* 🔴 LA DIVISIÓN SE DECLARA ANTES DE PAGAR (F5 + receta ③ de B).
                N pedidos = N BLOQUES, cada uno con lo suyo. La confirmación
                posterior explica que son independientes.
                *Un total único sobre dos entregas distintas es una promesa
                que la pantalla no puede cumplir.* */}
            {pedidos.length > 1 ? (
              <View style={{ paddingHorizontal: spacing[5], gap: spacing[1] }}>
                <Texto variante="seccion">
                  {t('despensa.divisionTitulo', { n: pedidos.length })}
                </Texto>
                <Texto variante="apoyo">{t('despensa.divisionDetalle')}</Texto>
              </View>
            ) : null}

            {/* 🔴 G-12 · CADA ENTREGA ES UNA CARTA, no un bloque apoyado sobre
                el fondo pelado. Sin superficie, N entregas se leen como una
                lista larga y no como N cosas separadas — que es justo lo que
                la división tiene que comunicar. La carta es el borde que dice
                dónde termina una entrega y empieza la otra. */}
            {pedidos.map((p, i) => (
              <View key={p.pedido_id} style={{ paddingHorizontal: spacing[5] }}>
                <Tarjeta>
                  <View style={{ gap: spacing[2] }}>
                {pedidos.length > 1 ? (
                  <Texto variante="seccion">
                    {t('despensa.bloqueEntrega', { i: i + 1, n: pedidos.length })}
                  </Texto>
                ) : (
                  <Texto variante="seccion">{t('despensa.resumen')}</Texto>
                )}
                {/* F6 · QUIÉN LO PREPARA. Es lo que explica POR QUÉ la compra
                    llegó partida: la razón de la división es que son dos
                    tiendas. Si el nombre no se pudo leer, la línea no se
                    dibuja — jamás «Lo prepara: —». */}
                {tiendas[p.pedido_id] !== undefined ? (
                  <Texto variante="apoyo">
                    {t('despensa.preparaTienda', { tienda: tiendas[p.pedido_id] })}
                  </Texto>
                ) : null}
                {/* QUÉ llega en esta entrega. Va con `Texto` y no con
                    `FilaMonto`: esa pieza NO se dibuja cuando el monto es
                    null —a propósito, para no inventar un "$ 0,00"—, así que
                    usarla acá habría hecho desaparecer los ítems en silencio. */}
                {grupos[i]?.items.map((it) => (
                  <Texto key={it.oferta_id} variante="apoyo">
                    {`${it.cantidad} × ${it.nombre}`}
                  </Texto>
                ))}
                {p.subtotal !== null ? (
                  <FilaMonto etiqueta={t('despensa.subtotal')} monto={dinero(p.subtotal)} />
                ) : null}
                {p.impuesto !== null ? (
                  <FilaMonto etiqueta={t('despensa.impuesto')} monto={dinero(p.impuesto)} />
                ) : null}
                {p.envio !== null ? (
                  <FilaMonto
                    etiqueta={metodo === 'retiro' ? t('despensa.envioRetiro') : t('despensa.envio')}
                    monto={dinero(p.envio)}
                  />
                ) : null}
                  </View>
                </Tarjeta>
              </View>
            ))}

            {/* 🔴 A-02 (S100c) · CÓMO Y CUÁNDO LLEGA, A LA VISTA AL PAGAR.
                Literal del founder: *«lo único que le faltaría al checkout es
                la confirmación de la modalidad de entrega y la fecha probable
                de entrega, para que la persona lo pueda observar desde ahí»*.

                Medido antes de construir: el resumen tenía «Envío $2.50» —que
                dice cuánto CUESTA, no que va a tu casa— y la promesa vivía
                dentro de `fase === 'armado'`, o sea **en la pantalla anterior**:
                se elegía y no se podía releer con el dedo sobre «Pagar».
                La dirección entra en el mismo bloque aunque no estaba en el
                pedido: es la misma pregunta —«¿esto llega bien?»— y omitirla
                dejaba media respuesta.

                ── 🔴 POR QUÉ VA UNA VEZ Y NO ADENTRO DE CADA CARTA ──────────
                El método y la dirección son **de la compra**: hay UN `metodo` y
                UNA dirección para todo. Repetirlos en N cartas sería decir N
                veces lo mismo.
                Y la FECHA no se puede repetir por otra razón, que es de dato:
                `cuentaComercialId` sale de **`grupos[0]`** (:177) ⇒ la promesa
                que hay en pantalla es la del PRIMER vendedor. Pintarla dentro
                de la segunda carta sería **afirmar sobre la entrega del otro
                vendedor un dato que nadie calculó** — la misma frase que ya
                está escrita 60 líneas más arriba: *una promesa que la pantalla
                no puede cumplir*. Con N entregas se dice lo único que sí es
                cierto: que cada una va por su cuenta. */}
            <View style={{ paddingHorizontal: spacing[5], gap: spacing[1] }}>
              <Texto variante="seccion">{t('despensa.resumenComoLlega')}</Texto>
              <Texto variante="cuerpo">
                {metodo === 'retiro' ? t('despensa.metodoRetiro') : t('despensa.metodoDespacho')}
              </Texto>

              {/* La dirección solo con despacho: en retiro no hay dirección de
                  la familia que mostrar, y la de la tienda no se captura. */}
              {metodo === 'despacho' && direccion !== 'cargando' && direccion !== null ? (
                <Texto variante="apoyo">
                  {[direccion.direccion, direccion.ciudad].filter((x) => x !== '').join(' · ')}
                </Texto>
              ) : null}

              {/* La fecha: con UNA entrega es la promesa que se eligió; con
                  varias, el hecho que sí se puede afirmar. Y si la promesa
                  falló o no llegó, **no se inventa una fecha**: no se dibuja
                  nada (L-139 — el nulo honesto). */}
              {pedidos.length > 1 ? (
                <Texto variante="apoyo">{t('despensa.resumenFechaPorEntrega')}</Texto>
              ) : metodo === 'despacho' &&
                promesa !== null &&
                promesa !== 'cargando' &&
                !('fallo' in promesa) ? (
                <Texto variante="cuerpo">
                  {t('despensa.promesaVentana', {
                    dia: diaLocal(promesa.fecha),
                    desde: horaLocal(promesa.desde),
                    hasta: horaLocal(promesa.hasta),
                  })}
                </Texto>
              ) : null}
            </View>

            {/* EL TOTAL ES EL DE LA COMPRA, dicho por el motor — esta
                pantalla no suma los bloques. UN SOLO COBRO para la familia. */}
            <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
              <Separador />
              {compraTotal !== null ? (
                <FilaMonto etiqueta={t('despensa.total')} monto={dinero(compraTotal)} destacada />
              ) : (
                <Texto variante="apoyo">{t('despensa.totalNoLlego')}</Texto>
              )}
            </View>

            {/* ②③④⑤ LA SECCIÓN DE PAGO — **la misma pieza que monta el
                checkout de los cuatro oficios** (orden del founder ⑤).
                ☠️ Acá vivía su copia: mismo texto, misma hoja, misma regla de
                preselección. *Ya no es «igual a»: es LA MISMA, y por eso no hay
                de dónde sacar una versión propia.* */}
            <View style={{ paddingHorizontal: spacing[5] }}>
              <SeccionMedioDePago medio={medio} />
            </View>

            {/* ☠️ S101-B · LA BANDA DE «PAGO SIMULADO» MUERE (Ley 37).
                §6.5 la puso cuando el cobro ERA simulado, y decía la verdad.
                **Con el enchufe de Fase 3 el cobro es real**, así que la banda
                pasó de honesta a falsa de un día para el otro.
                *Una advertencia que dejó de ser cierta no es inofensiva: le
                enseña a la familia a no creerle a las advertencias.* */}
          </>
        ) : fase === 'confirmando' ? (
          /* 🔴 LA PANTALLA NO PUEDE ESTAR VACÍA JUSTO ACÁ. Medido en el
             aparato: título truncado, un botón, y nada más — en el segundo
             exacto en que la familia acabó de entregar su tarjeta.
             *El silencio, en ese momento, se lee como que algo salió mal.* */
          <View style={{ paddingHorizontal: spacing[5], gap: spacing[3] }}>
            <Texto variante="titulo">{t('pago.esperaTitulo')}</Texto>
            <Texto variante="cuerpo">{t('pago.esperaCuerpo')}</Texto>
            {/* ⑦ LA RAMPA QUE TRABAJA — **la misma que el checkout de reserva**.
                Antes acá no había NADA en movimiento y en el paseo respiraba una
                huella: *dos pantallas que dicen la misma frase y se mueven
                distinto son dos productos.* */}
            <EsperaDeTrabajo />
            {/* El tope habla y **no declara desenlace**: la compra sigue viva
                y el barrido la resuelve el mismo día. */}
            {espera.fase === 'sigue_abierta' ? (
              <Texto variante="apoyo">{t('pago.esperaSigueAbierta')}</Texto>
            ) : null}
          </View>
        ) : fase === 'exito' ? (
          <>
            <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
              <Texto variante="titulo">{t('despensa.exitoCuerpo')}</Texto>
              <Texto variante="cuerpo">{t('despensa.exitoDetalle')}</Texto>
              {metodo === 'retiro' ? (
                <Texto variante="cuerpo">{t('despensa.exitoRetiro')}</Texto>
              ) : null}
            </View>

            {/* §6.1 — LA RECURRENCIA, con el mensaje honesto VERBATIM. */}
            <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
              <Separador />
              {/* 🔴 G-13 · EL TÍTULO, LA «i» Y EL INTERRUPTOR — nada más.
                  Acá vivían DOS párrafos explicativos SIEMPRE visibles (60.8 +
                  40.5 dp medidos por B) sobre una pantalla cuyo trabajo es
                  decir «quedó creado». La letra §6.1 exige que el mensaje sea
                  VERBATIM, y lo sigue siendo — cambia DÓNDE se lee, no qué
                  dice: *una condición que hay que leer sí o sí no se borra;
                  se pone donde no le gane a lo que la persona vino a hacer.* */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View
                  style={{
                    flex: 1,
                    paddingRight: spacing[3],
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing[2],
                  }}
                >
                  <Texto variante="seccion">{t('despensa.recurrenciaTitulo')}</Texto>
                  <Pressable
                    onPress={() => setHojaRecurrencia(true)}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel={t('despensa.recurrenciaQueEs')}
                  >
                    <Icono nombre="info" tamano={20} registro="capa" />
                  </Pressable>
                </View>
                <Interruptor
                  encendido={quiereRecurrencia}
                  onCambio={(v) => void alternarRec(v)}
                  etiqueta={t('despensa.recurrenciaTitulo')}
                />
              </View>
              {/* LAS FRECUENCIAS NO EXISTEN HASTA QUE EL INTERRUPTOR ESTÁ
                  ENCENDIDO (G-13). Y el interruptor expresa la INTENCIÓN: lo
                  que cierra el trato es elegir cada cuánto.
                  POR QUÉ ASÍ Y NO «prender y listo con 30 por defecto»: el
                  motor NO es idempotente —`configurar_recurrencia` no toma
                  clave de idempotencia—, así que prender con un default y
                  dejar cambiarlo después crearía DOS recurrencias, o exigiría
                  apagar y volver a crear dejando una fila muerta. *Comprometer
                  al motor con un número que la familia todavía no eligió es
                  inventarle una decisión.* Con este orden se crea UNA, con la
                  cadencia que ella dijo. */}
              {quiereRecurrencia ? (
                recurrenciaId === null ? (
                  <>
                    <SelectorOpcion
                      etiqueta={t('despensa.recurrenciaCada')}
                      opciones={CADENCIAS.map((d) => ({
                        codigo: String(d),
                        etiqueta: t('despensa.recurrenciaDias', { n: d }),
                      }))}
                      seleccionada={cadencia === null ? '' : String(cadencia)}
                      onSelect={(c) => {
                        setCadencia(Number(c));
                        void activarRecurrenciaCon(Number(c));
                      }}
                      acento="control"
                    />
                    {/* El apagado dice qué falta — regla de la casa. */}
                    <Texto variante="apoyo">{t('despensa.recurrenciaElegiCada')}</Texto>
                  </>
                ) : (
                  <Texto variante="apoyo">{t('despensa.recurrenciaLista')}</Texto>
                )
              ) : null}
            </View>
          </>
        ) : null}
      </PantallaConPie>
      </EvitaTeclado>

      {/* ☠️ LA HOJA DE ELECCIÓN SALIÓ DE ACÁ: vive dentro de
          `SeccionMedioDePago`, junto a la fila que la abre. *Una hoja que vive
          a 200 líneas del control que la dispara es la mitad de una pieza.* */}

      {/* LA HOJA DE DIRECCIÓN — la captura es UNA en toda la casa (el
          formulario compartido de S79); agregar sin salir del flujo (§7). */}
      <Hoja
        visible={hojaDireccion}
        onCerrar={() => setHojaDireccion(false)}
        titulo={t('despensa.aDonde')}
        altura="completa"
      >
        <View style={{ gap: spacing[3] }}>
          <DireccionHogarForm
            inicial={direccion !== 'cargando' ? direccion : null}
            exigirPunto
            onGuardada={(d) => {
              setDireccion(d);
              if (telefono === '' && d.telefono !== null) setTelefono(d.telefono);
              setHojaDireccion(false);
            }}
          />
          {/* 🔴 PUNTO 28 (S100d) · ACÁ SE ROMPE EL DEADLOCK DE ARRANQUE.
              ═══════════════════════════════════════════════════════════════
              Founder: *«No tiene opción de guardar la dirección con un alias»*.

              MEDIDO, y la causa NO era que faltara construirlo: el alias estaba
              ENTERO —motor, wrapper, libreta y formulario con `conAlias`— y
              **viajaba en la OTA que el founder miró** (`e9390704` es ancestro
              de `e20113b6`, verificado con `merge-base --is-ancestor`, no de
              memoria). *Lo que faltaba no era la pieza: era poder llegar a ella.*

              EL MECANISMO, que es un candado que se cierra sobre sí mismo:
                · la fila de dirección abría la LIBRETA solo con `length > 1`;
                · con UNA dirección abría el formulario de edición, que no tiene
                  alias ni camino a agregar;
                · y el ÚNICO botón «agregar otra» vivía DENTRO de la libreta.
              ⇒ para llegar a la libreta hacían falta dos direcciones, y para
              tener dos había que pasar por la libreta. **El founder tiene una.
              Nadie con una sola dirección podía salir de ahí jamás.**

              ⚠️ LA REGLA DEL `length > 1` NO ERA EL ERROR Y POR ESO NO LA TOCO.
              Su razón sigue en pie —*«un selector de un elemento es un paso que
              no decide nada»*— y es cierta PARA ELEGIR. Lo que no vio es que la
              libreta hacía DOS trabajos: elegir y agregar. El candado no lo puso
              una regla equivocada: lo puso una regla correcta que era la única
              puerta de otra cosa. *Es la misma forma que la Hoja de S100c: dos
              decisiones buenas que juntas no pueden convivir.*

              LA CURA es dar la segunda salida donde el que tiene UNA dirección
              realmente está, en vez de mandarlo a un selector de un elemento.
              Con dos o más, la libreta sigue presidiendo como siempre. */}
          <Boton
            variante="secundario"
            bloque
            etiqueta={t('direccion.agregarOtra')}
            onPress={() => {
              setHojaDireccion(false);
              setHojaAlias(true);
            }}
          />
        </View>
      </Hoja>

      {/* 🔴 S100c · LA LIBRETA — elegir entre las direcciones guardadas.
          Cada una se lee por su NOMBRE («Oficina»), que es la llave con la
          que la persona la reconoce; la calle va de detalle. La principal
          viene primera del lector, y no se marca con una insignia: *venir
          primera ya lo dice, y una insignia de «principal» compite con el
          nombre que la persona eligió.* */}
      <Hoja
        visible={hojaLibreta}
        onCerrar={() => setHojaLibreta(false)}
        titulo={t('despensa.aDonde')}
      >
        <View style={{ gap: spacing[2] }}>
          {direcciones.map((d) => (
            <CeldaNavegacion
              key={d.id}
              icono="ubicacion"
              titulo={d.alias}
              detalle={[d.direccion, d.ciudad].filter((x) => x !== '').join(' · ')}
              onPress={() => {
                setDireccion(d);
                setHojaLibreta(false);
              }}
            />
          ))}
          <Boton
            variante="secundario"
            bloque
            etiqueta={t('direccion.agregarOtra')}
            onPress={() => {
              setHojaLibreta(false);
              setHojaAlias(true);
            }}
          />
        </View>
      </Hoja>

      {/* La dirección NUEVA con su nombre. Misma captura de siempre —una sola
          en toda la casa— con la bandera `conAlias`: dos formularios de
          dirección divergen, y el día que divergen la mitad de la gente pone
          el punto y la otra mitad no. */}
      <Hoja
        visible={hojaAlias}
        onCerrar={() => setHojaAlias(false)}
        titulo={t('direccion.agregarOtra')}
        altura="completa"
      >
        <DireccionHogarForm
          inicial={null}
          exigirPunto
          conAlias
          onGuardada={(d) => {
            setDireccion(d);
            setHojaAlias(false);
            // La libreta se re-lee del motor, no se parchea en memoria: el
            // alias y el id los decidió el server (L-166 — el dato vivo se
            // lee de su fuente al momento de usarlo).
            void listarMisDirecciones().then((r) => {
              if (r.ok) setDirecciones(r.data);
            });
          }}
        />
      </Hoja>

      {/* G-11 · LOS DATOS DE ENTREGA SE EDITAN ACÁ, en su momento.
          ⚠️ HUECO DECLARADO, no un olvido: el teléfono va con `Campo` y **le
          falta el selector de indicativo** que el gate pidió. La pieza de la
          casa existe (`ControlTelefono`: selector + campo con UN pie, porque
          lo que se valida es el E.164 que forman JUNTOS) pero vive en
          `apps/prestador/src/components/perfil-piezas` — **no está en
          `packages/ui`**, así que este lado no la alcanza.
          Pedido a B: promoverla (precedente D-498, «la casa tiene UNA»).
          NO se clona de este lado: un segundo teléfono con su propia idea de
          E.164 es exactamente lo que esa deuda cerró.
          Y ojo con lo que NO es defecto: un `+57` sobre una dirección de Quito
          está BIEN — P21, la cuenta es global y el país es contexto de
          operación (medición de B en el gate). */}
      <Hoja
        visible={hojaReceptor}
        onCerrar={() => setHojaReceptor(false)}
        titulo={t('despensa.quienRecibe')}
      >
        <View style={{ gap: spacing[3] }}>
          <Campo
            label={t('despensa.receptorLabel')}
            value={receptor}
            onChangeText={setReceptor}
            autoCapitalize="words"
          />
          <Campo
            label={t('despensa.telefonoLabel')}
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            placeholder="+593 99 123 4567"
            ayuda={t('despensa.telefonoAyuda')}
          />
          <Boton
            etiqueta={t('despensa.listoDatos')}
            bloque
            onPress={() => setHojaReceptor(false)}
          />
        </View>
      </Hoja>

      {/* G-13 · LA «i». Los dos mensajes de §6.1 VERBATIM — no se recortaron
          ni se reescribieron al mudarlos: la letra los firmó así, y una
          condición de cobro que se resume deja de ser la condición. */}
      <Hoja
        visible={hojaRecurrencia}
        onCerrar={() => setHojaRecurrencia(false)}
        titulo={t('despensa.recurrenciaTitulo')}
      >
        <View style={{ gap: spacing[3] }}>
          <Texto variante="cuerpo">{t('despensa.recurrenciaHonesta')}</Texto>
          <Texto variante="cuerpo">{t('despensa.recurrenciaSinPasarela')}</Texto>
          <Boton
            etiqueta={t('despensa.listoDatos')}
            bloque
            onPress={() => setHojaRecurrencia(false)}
          />
        </View>
      </Hoja>
    </View>
  );
}
