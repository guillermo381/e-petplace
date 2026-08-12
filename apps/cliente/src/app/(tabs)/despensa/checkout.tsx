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
 * ── HUECOS DECLARADOS (con dueño y en vuelo) ────────────────────────────
 *  1. `cuentaComercialId` llega null del catálogo de hoy: sin él no se
 *     puede crear el pedido. La tanda de A (12-ago) lo trae en la oferta;
 *     esta pantalla ya lo consume del carrito y solo muestra su estado
 *     honesto mientras tanto.
 *  2. El punto del mapa movible (§7) llega con `PinMovible` de B.
 *  3. La recurrencia vive en la pantalla de éxito (§6.1) — el interruptor
 *     existe; el primer cobro real espera la pasarela (D-778) y SE DICE.
 *
 * ESCALERA (§4b): peldaño 0 = retiro en tienda (sin dirección, código en
 * el mostrador) · peldaño 1 = despacho a la dirección del hogar con la
 * próxima ventana · peldaño 2 = fecha programada contra el cupo real del
 * día, con los saltos por cupo DICHOS.
 *
 * TESTS (§10): L-139 en cada número (todo monto viene del motor) · el
 * apagado dice qué falta · error dice qué pasó · voz de familia.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Boton,
  Campo,
  CampoFecha,
  Celda,
  Encabezado,
  EstadoVacio,
  Hoja,
  Interruptor,
  SelectorOpcion,
  Separador,
  Texto,
  spacing,
  useAviso,
  useTheme,
  type CampoFechaValor,
} from '@epetplace/ui';
import {
  calcularPromesaDespensa,
  cancelarPedidoDespensa,
  configurarRecurrencia,
  crearPedidoDespensa,
  iniciarPagoPedido,
  nuevaClaveIdempotencia,
  obtenerDireccionHogar,
  obtenerMiPerfil,
  type DireccionHogar,
  type PedidoCreado,
  type PromesaEntrega,
} from '@epetplace/api';
import { DireccionHogarForm } from '@/components/direccion-hogar-form';
import { useCarrito, vaciarCarrito } from '@/lib/despensa/carrito';
import { useTraduccion } from '@/i18n';

type Fase = 'armado' | 'resumen' | 'exito';

/** Las cadencias ofrecidas (§6.1: cada N días, 7–90). Un menú corto y
 *  legible antes que un número libre — mismo criterio que el menú de
 *  duraciones del paseo. */
const CADENCIAS = [7, 15, 30, 60] as const;

export default function DespensaCheckout() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const items = useCarrito();

  const [fase, setFase] = useState<Fase>('armado');
  const [metodo, setMetodo] = useState<'despacho' | 'retiro'>('despacho');

  // ── La dirección y quién recibe ────────────────────────────────────────
  const [direccion, setDireccion] = useState<DireccionHogar | null | 'cargando'>('cargando');
  const [hojaDireccion, setHojaDireccion] = useState(false);
  const [receptor, setReceptor] = useState('');
  const [telefono, setTelefono] = useState('');
  const [instrucciones, setInstrucciones] = useState('');

  // ── La ventana de entrega ──────────────────────────────────────────────
  const [promesa, setPromesa] = useState<PromesaEntrega | 'cargando' | { fallo: string } | null>(null);
  const [fechaElegida, setFechaElegida] = useState<CampoFechaValor | undefined>(undefined);

  // ── El pedido del motor ────────────────────────────────────────────────
  const clave = useRef(nuevaClaveIdempotencia());
  const [pedido, setPedido] = useState<PedidoCreado | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  // ── La recurrencia (éxito) ─────────────────────────────────────────────
  const [cadencia, setCadencia] = useState<number>(30);
  const [recurrenciaId, setRecurrenciaId] = useState<string | null>(null);
  const [activandoRec, setActivandoRec] = useState(false);

  /** El vendedor del pedido — del carrito. Hueco declarado #1: hoy puede
   *  ser null; la tanda de A lo vuelve imposible. */
  const cuentaComercialId = items.find((i) => i.cuentaComercialId !== null)?.cuentaComercialId ?? null;

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const [dir, perfil] = await Promise.all([obtenerDireccionHogar(), obtenerMiPerfil()]);
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

  const horaLocal = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const diaLocal = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  /** Qué falta para poder ver el total — el apagado DICE (S73-B). */
  const falta: string | null = useMemo(() => {
    if (items.length === 0) return t('despensa.faltaItems');
    if (cuentaComercialId === null) return t('despensa.faltaVendedor');
    if (metodo === 'despacho') {
      if (direccion === 'cargando') return t('despensa.faltaCargando');
      if (direccion === null) return t('despensa.faltaDireccion');
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

  async function verTotal() {
    if (trabajando || falta !== null || cuentaComercialId === null) return;
    setTrabajando(true);
    const dir = direccion !== 'cargando' ? direccion : null;
    const r = await crearPedidoDespensa({
      cuenta_comercial_id: cuentaComercialId,
      items: items.map((i) => ({
        oferta_id: i.oferta_id,
        cantidad: i.cantidad,
        mascota_id: i.destino?.tipo === 'mascota' ? i.destino.mascotaId : undefined,
        donacion: i.destino?.tipo === 'donacion' ? true : undefined,
      })),
      entrega: {
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
      },
      clave_idempotencia: clave.current,
      metodo_entrega: metodo,
      fecha_programada: fechaElegida?.fecha,
    });
    setTrabajando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    setPedido(r.data);
    setFase('resumen');
  }

  /** Volver a editar CANCELA el pedido creado — cero huérfanos. */
  async function volverAEditar() {
    if (trabajando) return;
    if (pedido !== null) {
      setTrabajando(true);
      const r = await cancelarPedidoDespensa(pedido.pedido_id, 'edicion_en_checkout');
      setTrabajando(false);
      if (!r.ok) {
        mostrar({ texto: r.mensaje, variante: 'error' });
        return;
      }
      setPedido(null);
      // La clave era de ESE intento: el próximo pedido es otro intento.
      clave.current = nuevaClaveIdempotencia();
    }
    setFase('armado');
  }

  async function pagar() {
    if (trabajando || pedido === null) return;
    setTrabajando(true);
    const r = await iniciarPagoPedido(pedido.pedido_id);
    setTrabajando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    vaciarCarrito();
    setFase('exito');
  }

  /** §6.1 — la recurrencia se activa desde el éxito, con el mensaje
   *  honesto VERBATIM de la letra y el cobro real esperando pasarela. */
  async function alternarRec(encendido: boolean) {
    if (activandoRec) return;
    if (!encendido || cuentaComercialId === null) return; // apagar sin id = no-op local
    setActivandoRec(true);
    const r = await configurarRecurrencia({
      cuenta_comercial_id: cuentaComercialId,
      items: items.length > 0 ? items.map((i) => ({
        oferta_id: i.oferta_id,
        cantidad: i.cantidad,
        mascota_id: i.destino?.tipo === 'mascota' ? i.destino.mascotaId : undefined,
        donacion: i.destino?.tipo === 'donacion' ? true : undefined,
      })) : itemsCompradosRef.current,
      entrega: entregaCompradaRef.current,
      frecuencia_dias: cadencia,
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

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {fase === 'exito' ? (
        /* En el éxito NO hay atrás: el pedido ya vive en el motor y volver
           al checkout de una compra hecha sería una puerta a pagar dos
           veces. La única salida es Tus pedidos. */
        <Encabezado variante="navegacion" titulo={t('despensa.exitoTitulo')} />
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

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: spacing[4],
          paddingBottom: insets.bottom + spacing[8] + 96,
          gap: spacing[5],
        }}
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
                <>
                  {/* 2 · A DÓNDE (§7) */}
                  <View style={{ gap: spacing[2] }}>
                    <View style={{ paddingHorizontal: spacing[5] }}>
                      <Texto variante="seccion">{t('despensa.aDonde')}</Texto>
                    </View>
                    {direccion === 'cargando' ? null : direccion === null ? (
                      <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
                        <Texto variante="apoyo">{t('despensa.sinDireccion')}</Texto>
                        <Boton
                          variante="secundario"
                          etiqueta={t('despensa.agregarDireccion')}
                          onPress={() => setHojaDireccion(true)}
                        />
                      </View>
                    ) : (
                      <>
                        <Celda
                          titulo={direccion.direccion}
                          subtitulo={[direccion.ciudad, direccion.referencias]
                            .filter((x): x is string => x !== null && x !== '')
                            .join(' · ')}
                        />
                        <View style={{ paddingHorizontal: spacing[5] }}>
                          <Boton
                            variante="secundario"
                            etiqueta={t('despensa.cambiarDireccion')}
                            onPress={() => setHojaDireccion(true)}
                          />
                        </View>
                      </>
                    )}
                  </View>

                  {/* 3 · QUIÉN RECIBE + LA INSTRUCCIÓN QUE DECIDE (§9.3) */}
                  <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
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
                    />
                    <Campo
                      label={t('despensa.instruccionesLabel')}
                      value={instrucciones}
                      onChangeText={(v) => setInstrucciones(v.slice(0, 200))}
                      ayuda={t('despensa.instruccionesAyuda')}
                      autoCapitalize="sentences"
                    />
                  </View>

                  {/* 4 · CUÁNDO — la ventana que el cupo respalda (§6.2/§7.2) */}
                  <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
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
                    <CampoFecha
                      label={t('despensa.programarFecha')}
                      valor={fechaElegida}
                      onChange={setFechaElegida}
                      placeholder={t('despensa.programarPlaceholder')}
                      ayuda={t('despensa.programarAyuda')}
                      tituloHoja={t('despensa.programarFecha')}
                    />
                    {fechaElegida !== undefined ? (
                      <Boton
                        variante="secundario"
                        etiqueta={t('despensa.quitarFecha')}
                        onPress={() => setFechaElegida(undefined)}
                      />
                    ) : null}
                  </View>
                </>
              )}
            </>
          )
        ) : fase === 'resumen' && pedido !== null ? (
          <>
            {/* EL RESUMEN — números del MOTOR, tal cual llegaron. */}
            <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
              <Texto variante="seccion">{t('despensa.resumen')}</Texto>
              {pedido.subtotal !== null ? (
                <FilaMonto etiqueta={t('despensa.subtotal')} monto={dinero(pedido.subtotal)} />
              ) : null}
              {pedido.impuesto !== null ? (
                <FilaMonto etiqueta={t('despensa.impuesto')} monto={dinero(pedido.impuesto)} />
              ) : null}
              {pedido.envio !== null ? (
                <FilaMonto
                  etiqueta={metodo === 'retiro' ? t('despensa.envioRetiro') : t('despensa.envio')}
                  monto={dinero(pedido.envio)}
                />
              ) : null}
              <Separador />
              {pedido.total !== null ? (
                <FilaMonto etiqueta={t('despensa.total')} monto={dinero(pedido.total)} destacada />
              ) : (
                <Texto variante="apoyo">{t('despensa.totalNoLlego')}</Texto>
              )}
            </View>

            {/* §6.5 — EL PAGO ES SIMULADO, imposible de confundir. */}
            <View style={{ paddingHorizontal: spacing[5], gap: spacing[1] }}>
              <Texto variante="seccion" color="warning">
                {t('despensa.pagoSimuladoTitulo')}
              </Texto>
              <Texto variante="apoyo">{t('despensa.pagoSimuladoDetalle')}</Texto>
            </View>
          </>
        ) : fase === 'exito' ? (
          <>
            <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
              <Texto variante="titulo">{t('despensa.exitoCuerpo')}</Texto>
              <Texto variante="cuerpo">{t('despensa.exitoDetalle')}</Texto>
              <Texto variante="apoyo" color="warning">
                {t('despensa.pagoSimuladoRecordatorio')}
              </Texto>
              {metodo === 'retiro' ? (
                <Texto variante="cuerpo">{t('despensa.exitoRetiro')}</Texto>
              ) : null}
            </View>

            {/* §6.1 — LA RECURRENCIA, con el mensaje honesto VERBATIM. */}
            <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
              <Separador />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1, paddingRight: spacing[3] }}>
                  <Texto variante="seccion">{t('despensa.recurrenciaTitulo')}</Texto>
                </View>
                <Interruptor
                  encendido={recurrenciaId !== null}
                  onCambio={(v) => void alternarRec(v)}
                  etiqueta={t('despensa.recurrenciaTitulo')}
                />
              </View>
              {/* El mensaje de la letra, verbatim (decisión ⑤ de la mesa). */}
              <Texto variante="apoyo">{t('despensa.recurrenciaHonesta')}</Texto>
              <Texto variante="apoyo">{t('despensa.recurrenciaSinPasarela')}</Texto>
              {recurrenciaId === null ? (
                <SelectorOpcion
                  etiqueta={t('despensa.recurrenciaCada')}
                  opciones={CADENCIAS.map((d) => ({
                    codigo: String(d),
                    etiqueta: t('despensa.recurrenciaDias', { n: d }),
                  }))}
                  seleccionada={String(cadencia)}
                  onSelect={(c) => setCadencia(Number(c))}
                  acento="control"
                />
              ) : (
                <Texto variante="apoyo">{t('despensa.recurrenciaLista')}</Texto>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* LA BARRA DEL CTA por fase — el apagado dice qué falta. */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: spacing[5],
          paddingTop: spacing[3],
          paddingBottom: insets.bottom + spacing[3],
          backgroundColor: theme.bg.base,
          gap: spacing[2],
        }}
      >
        {fase === 'armado' && items.length > 0 ? (
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
          <>
            <Boton
              etiqueta={t('despensa.pagarSimulado')}
              bloque
              cargando={trabajando}
              onPress={() => void pagar()}
            />
            <Boton
              variante="secundario"
              bloque
              etiqueta={t('despensa.volverAEditar')}
              onPress={() => void volverAEditar()}
            />
          </>
        ) : fase === 'exito' ? (
          <Boton
            etiqueta={t('despensa.verTusPedidos')}
            bloque
            onPress={() => router.replace('/despensa/pedidos')}
          />
        ) : null}
      </View>

      {/* LA HOJA DE DIRECCIÓN — la captura es UNA en toda la casa (el
          formulario compartido de S79); agregar sin salir del flujo (§7). */}
      <Hoja
        visible={hojaDireccion}
        onCerrar={() => setHojaDireccion(false)}
        titulo={t('despensa.aDonde')}
        altura="completa"
      >
        <DireccionHogarForm
          inicial={direccion !== 'cargando' ? direccion : null}
          onGuardada={(d) => {
            setDireccion(d);
            if (telefono === '' && d.telefono !== null) setTelefono(d.telefono);
            setHojaDireccion(false);
          }}
        />
      </Hoja>
    </View>
  );
}

/** Fila de monto del resumen — etiqueta a la izquierda, número en mono a
 *  la derecha (Ley 3: la plata es dato de máquina). Anatomía local mínima;
 *  `FilaDato` de la casa es vertical y esta lectura exige la horizontal
 *  (el candidato "FilaDato compacta" sigue registrado desde S71). */
function FilaMonto({
  etiqueta,
  monto,
  destacada = false,
}: {
  etiqueta: string;
  monto: string | null;
  destacada?: boolean;
}) {
  if (monto === null) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Texto variante={destacada ? 'seccion' : 'cuerpo'}>{etiqueta}</Texto>
      <Texto variante={destacada ? 'datoMd' : 'dato'}>{monto}</Texto>
    </View>
  );
}
