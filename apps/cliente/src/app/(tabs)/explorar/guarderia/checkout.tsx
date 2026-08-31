/**
 * CHECKOUT DE GUARDERÍA (S107-C, tanda 7).
 *
 * 🔴 **NO ES UN CHECKOUT NUEVO: es el de la casa con otros datos.** Monta
 * `CheckoutReserva`, la MISMA pieza que paseo y grooming — la superficie de
 * pago es UNA (S101, vigilada por `R57`). *Un segundo checkout sería una
 * segunda forma de equivocarse con la plata.*
 *
 * ── LA ESPERA CON VOZ ES DE LA PIEZA, Y ESO ES LO CORRECTO ──────────────
 * La reserva llegó `pendiente_pago` con hold de 15 minutos y **el desglose se
 * congeló solo** en el motor. Esta pantalla **no declara nada**: la pieza
 * espera la verdad del servidor y **`confirmada` sólo cuando el motor
 * confirma** (`LETRA_PAGO_CITAS` §3). *Una pantalla que se adelanta al motor
 * le dice a la familia que pagó antes de que exista el cobro.*
 *
 * ── ⭐ TRES MODALIDADES, UNA SOLA PANTALLA DE PAGO (30-ago) ─────────────
 * Firma del founder: *«el medio de pago, los términos y el botón Pagar viven
 * en el checkout»*. La pantalla 4 **navega acá** con su modalidad.
 *
 * · **día** — llega con HOLD (`citaId` + `expiraEn` + precio congelado) y va
 *   por `CheckoutReserva` tal cual. **Su reloj es real.**
 * · **paquete** y **mensual** — 🔴 **NO TIENEN HOLD: el motor no emite uno
 *   para ellos.** Llegan por parámetro y el acto ocurre al tocar Pagar.
 *   *No se inventa un temporizador que ningún servidor está honrando: un
 *   reloj falso apura a la familia por nada.* Se declara: estas dos **no
 *   expiran**, y la pantalla no promete que expiren.
 *
 * ⚠️ Las dos comparten la MISMA `SeccionMedioDePago` que `CheckoutReserva`
 * monta adentro (`R57`): la superficie de pago sigue siendo una.
 *
 * ── LA HORA NO SE INVENTA ───────────────────────────────────────────────
 * Una estadía-día **no tiene hora**: tiene dos ventanas. Por eso `hora` viaja
 * con la ventana de recogida en voz de la casa y no con un `00:00` que no
 * significa nada — *un dato vacío con forma de dato es peor que su ausencia.*
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, Celda, Encabezado, EstadoVacio, Icono, Tarjeta, Texto, spacing, useAviso, useTheme } from '@epetplace/ui';
import {
  comprarPaqueteGuarderia,
  getEstadoOnboardingDueno,
  obtenerMisPlanesGuarderia,
  obtenerPaquetesGuarderia,
  reservarDiaGuarderia,
  contratarMensualidadGuarderia,
  reservarDiaDePaqueteGuarderia,
} from '@epetplace/api';
import { TAMANOS_PAQUETE, type TamanoPaqueteGuarderia } from '@/lib/guarderia-modalidad';

import { CheckoutReserva } from '@/components/checkout-reserva';
import { SeccionMedioDePago, useMedioDePago } from '@/components/seccion-medio-de-pago';
import { SeccionDireccion, useDireccionEntrega } from '@/components/seccion-direccion';
import { CheckImagenes } from '@/components/check-imagenes';
import { fechaLargaHumana, obtenerIdiomaActual } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';

export default function CheckoutGuarderia() {
  const { t } = useTraduccion();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mostrar } = useAviso();
  const params = useLocalSearchParams();

  const texto = (k: string): string => (typeof params[k] === 'string' ? (params[k] as string) : '');
  const modalidad = texto('modalidad');
  const esPaquete = modalidad === 'paquete';
  const esMensual = modalidad === 'mensual';

  /* La sección de pago sólo se activa donde hace falta elegir tarjeta. */
  const medio = useMedioDePago(esMensual);
  /**
   * ⭐ **DE DÓNDE LO PASAN A BUSCAR.** La pieza extraída de despensa — la
   * pregunta es la misma (a qué dirección va alguien) y sólo cambia la voz.
   *
   * 🔴 Viaja el **ID**, jamás un snapshot: el server valida contra las
   * direcciones de quien reserva y arma el snapshot él mismo. Y `null` es
   * válido: significa **la principal**, y no se inventa un default.
   */
  /* Los TRES eligen dirección — el día también, desde que su hold se crea acá. */
  const dir = useDireccionEntrega(true);


  /**
   * ⭐ **EL TOTAL DEL PAQUETE SE LEE ACÁ, NO SE HEREDA (S108-C · T1).**
   *
   * ⏪ **Lo que estaba mal, y es la cuarta puerta de un defecto ya conocido.**
   * El total salía de `texto('precio')` — **una cadena preformateada que viaja
   * por la URL** desde la lista, y que para paquete era `min(gp.precio)`: *el
   * paquete más barato del lugar, no el que la familia eligió.* El literal del
   * hub lo dice con todas las letras desde S107: **«La familia veía $40 y
   * pagaba $75. En la superficie donde se decide pagar.»** Se había curado en
   * los chips y en la tarjeta de la lista, **y sobrevivió justo en la
   * superficie que esa frase nombra.**
   *
   * 🔴 **Por eso no alcanza con arreglar el parámetro aguas arriba.** Un número
   * que llega por la URL es un número que nadie puede volver a verificar: entra
   * igual por un deep link, sobrevive a un back y no envejece. *La pantalla
   * donde se decide pagar resuelve su propio precio* — el mismo principio por
   * el que el motor lee el monto del desglose congelado y no del cliente.
   *
   * ⚠️ **Y mientras no lo sepa, no deja pagar.** No se pinta un total viejo ni
   * un «—»: *pagar a ciegas es peor que esperar dos segundos.*
   */
  type PrecioPaquete =
    | { fase: 'noAplica' }
    | { fase: 'cargando' }
    | { fase: 'noPudimos' }
    /** El lugar ya no vende ESE tamaño — la compra rebotaría igual. */
    | { fase: 'noVende' }
    | { fase: 'listo'; precio: number };
  const [precioPaquete, setPrecioPaquete] = useState<PrecioPaquete>({ fase: 'noAplica' });

  /* El tamaño se valida contra el catálogo, jamás se confía del `Number()`. */
  const tamanoElegido: TamanoPaqueteGuarderia | null = (() => {
    if (!esPaquete) return null;
    const n = Number(params.tamano);
    return TAMANOS_PAQUETE.find((x) => x === n) ?? null;
  })();

  useEffect(() => {
    if (!esPaquete) { setPrecioPaquete({ fase: 'noAplica' }); return; }
    const prestadorId = texto('prestadorId');
    if (tamanoElegido === null || prestadorId === '') { setPrecioPaquete({ fase: 'noPudimos' }); return; }
    let vigente = true;
    setPrecioPaquete({ fase: 'cargando' });
    void (async () => {
      const r = await obtenerPaquetesGuarderia(prestadorId);
      if (!vigente) return;
      /* Ley 13: un fallo de lectura no se disfraza de «no lo vende». */
      if (!r.ok) { setPrecioPaquete({ fase: 'noPudimos' }); return; }
      const pq = r.data.find((x) => x.tamano === tamanoElegido && x.activo);
      setPrecioPaquete(pq === undefined ? { fase: 'noVende' } : { fase: 'listo', precio: pq.precio });
    })();
    return () => { vigente = false; };
  }, [esPaquete, tamanoElegido]);

  const [enviando, setEnviando] = useState(false);
  const [rebote, setRebote] = useState<string | null>(null);
  /**
   * ⭐ **LA CONFIRMACIÓN ES LA MISMA QUE LA DE TODOS LOS SERVICIOS.**
   * Firma del founder: *«después de pagar va a la pantalla de confirmación
   * que ya usan todos los servicios — reusala, no la construyas»*.
   *
   * ⏪ Paquete y mensual mostraban **un toast y volvían al hogar**. *Un toast
   * se va solo: el acto más caro del recorrido no puede confirmarse con algo
   * que desaparece.* Ahora aterrizan en el mismo `EstadoVacio` con el glifo
   * del oficio y el «volver al hogar» que usan las cuatro hermanas.
   */
  const [exito, setExito] = useState<{ titulo: string; detalle: string } | null>(null);
  /* La familia, para el check de imagen: se resuelve una vez y sirve a las
     tres confirmaciones. */
  const [familiaId, setFamiliaId] = useState<string | null>(null);
  useEffect(() => {
    void getEstadoOnboardingDueno().then((r) => { if (r.ok) setFamiliaId(r.data.familia_id); });
  }, []);

  /**
   * ⭐ El check de imagen, en la confirmación de las TRES modalidades.
   * *Se monta sólo con familia y nombre resueltos: un consentimiento que no
   * puede nombrar a la mascota es un consentimiento sobre nadie.*
   */
  const checkImagenes =
    familiaId !== null && texto('mascotaNombre') !== ''
      ? <CheckImagenes familiaId={familiaId} mascotaNombre={texto('mascotaNombre')} />
      : null;

  const rebotar = useCallback(
    (codigo: string, mensaje: string) => {
      setRebote(mensaje);
      /* Nombrar el rebote es la mitad; la otra es que lleve a donde se
         resuelve — la misma cura que las cuatro ramas de la pantalla 4. */
      if (codigo === 'documentos_sin_aceptar') router.push('/guarderia/documentos');
      /* ⭐ **«YA TENÉS UN PLAN» NO ES UN ERROR: ES UN DESTINO.**
         Esto es lo que el founder vivió como *«no me deja pagar»*: su primer
         toque **sí firmó el mandato** y el segundo rebotaba con el mensaje
         crudo de un índice. *No era «no se pudo»: era «ya lo tenés y no supe
         explicártelo».*
         🔴 Y llevar al hub sólo sirve **desde que el plan se ve ahí** — lo
         monté en la misma tanda. *Llevar a una pantalla que no muestra lo que
         se fue a buscar es la mitad de la cura otra vez.* */
      if (codigo === 'ya_tienes_plan_activo') {
        /* 🔴 **EL MENSAJE VIAJA EN UN TOAST, NO EN LA PANTALLA.** Medido: con
           `setRebote` solo, la explicación se pintaba y **se iba con la
           navegación** — la familia aparecía en el hub sin saber por qué la
           movieron. *Llevarla al lugar correcto sin decirle qué pasó es
           cambiar un error mudo por una mudanza muda.* Un toast sobrevive al
           cambio de pantalla; el texto de la pantalla no. */
        /* `neutro`, no `error`: **no se equivocó en nada** — ya tiene el
           plan. *Pintar de error un estado correcto le enseña a la familia a
           desconfiar de lo que hizo bien.* */
        mostrar({ texto: mensaje, variante: 'neutro' });
        if (router.canDismiss()) router.dismissAll();
        router.navigate('/hogar/guarderia');
      }
    },
    [router, mostrar],
  );

  /**
   * ⭐ **EL HOLD DEL DÍA SE CREA ACÁ, no en la pantalla 4.**
   * `reservar_dia_guarderia` **congela la dirección al crear la cita**, así
   * que si el hold naciera antes, elegir la dirección después no cambiaría
   * nada — *un selector que el servidor ya no puede escuchar es un control que
   * no decide.*
   *
   * `null` = todavía no se reservó; con la cita, se monta `CheckoutReserva`
   * con su hold, su reloj real y su precio congelado por el motor.
   */
  const [holdDia, setHoldDia] = useState<{ citaId: string; expiraEn: string; precio: number } | null>(null);

  const reservarElDia = useCallback(async () => {
    if (enviando) return;
    setEnviando(true);
    setRebote(null);
    const r = await reservarDiaGuarderia({
      prestadorId: texto('prestadorId'),
      mascotaId: texto('mascotaId'),
      fecha: texto('fecha'),
      direccionId: dir.direccionId ?? undefined,
    });
    setEnviando(false);
    if (!r.ok) { rebotar(r.codigo, r.mensaje); return; }
    setHoldDia({ citaId: r.data.citaId, expiraEn: r.data.expiraEn, precio: r.data.precio });
  }, [enviando, dir.direccionId, rebotar]);

  const pagar = useCallback(async () => {
    if (enviando) return;
    setEnviando(true);
    setRebote(null);
    const prestadorId = texto('prestadorId');
    const mascotaId = texto('mascotaId');
    const fecha = texto('fecha');

    if (esMensual) {
      if (medio.idTarjeta === null) { setEnviando(false); setRebote(t('lugarGuarderia.faltaTarjeta')); return; }
      /* 🔴 EN LA MENSUALIDAD LA DIRECCIÓN VA EN EL MANDATO, igual que el
         medio de pago: **las citas del plan las crea el reloj, sin nadie
         presente.** Se resuelve AL FIRMAR y jamás al cobrar — dejarla para
         después la volvería un dato de la sesión del reloj, y la familia
         habría autorizado una dirección que puede haber cambiado. */
      const r = await contratarMensualidadGuarderia({
        prestadorId, tarjetaId: medio.idTarjeta, mascotaId, direccionId: dir.direccionId ?? undefined,
      });
      setEnviando(false);
      if (!r.ok) { rebotar(r.codigo, r.mensaje); return; }
      /* ⭐ **LA FECHA DEL PRÓXIMO COBRO SE PREGUNTA, NO SE CALCULA.**
         Con «pagar es arrancar» la familia tiene que salir de acá sabiendo
         cuándo vuelve a salir plata. **Pero calcularlo en la pantalla obliga a
         replicar la regla de anclaje del motor** —incluido qué pasa con un 31
         en un mes de 30—, y *una fecha que la pantalla calcula y el motor no
         honra es exactamente el defecto que esta tanda vino a cerrar.*

         ⇒ Se lee el período del plan recién firmado. Mientras el motor no lo
         llene (`periodo_desde`/`periodo_hasta` son NULL hasta que haya cobro,
         por su propia letra), se dice **la regla**, que sí es cierta, en vez de
         una fecha inventada. **El día que el motor lo llene, esta pantalla
         empieza a decir la fecha sola** — sin tocar una línea. */
      const plan = await obtenerMisPlanesGuarderia();
      const mio = plan.ok ? plan.data.find((x) => x.suscripcionId === r.data.suscripcionId) : undefined;
      const proximo = mio?.periodoHasta ?? null;
      setExito({
        titulo: t('checkoutGuarderia.mensualExito'),
        detalle: proximo === null
          ? t('checkoutGuarderia.mensualExitoDetalleSinFecha')
          : t('checkoutGuarderia.mensualExitoDetalle', { fecha: fechaLargaHumana(proximo, obtenerIdiomaActual()) }),
      });
      return;
    }

    /* PAQUETE — dos llamadas, un solo acto: comprar el bono y agendar su
       primera estadía. *Meterlas en una sola RPC habría atado el paquete a un
       día, y el paquete es del HOGAR.* */
    const compra = await comprarPaqueteGuarderia({ prestadorId, tamano: Number(params.tamano ?? 0) });
    if (!compra.ok) { setEnviando(false); rebotar(compra.codigo, compra.mensaje); return; }
    const primera = await reservarDiaDePaqueteGuarderia({
      bonoId: compra.data.bonoId, fecha, mascotaId, direccionId: dir.direccionId ?? undefined,
    });
    setEnviando(false);
    if (!primera.ok) {
      /* 🔴 EL BONO YA EXISTE. *Decir sólo «no se pudo» sobre una compra que SÍ
         ocurrió dejaría a la familia creyendo que perdió la plata.* */
      rebotar(primera.codigo, t('lugarGuarderia.paqueteSinPrimera', { mensaje: primera.mensaje }));
      return;
    }
    setExito({
      titulo: t('checkoutGuarderia.paqueteExito'),
      detalle: t('lugarGuarderia.paqueteListo', { n: primera.data.saldoRestante }),
    });
  }, [enviando, esMensual, medio.idTarjeta, params.tamano, mostrar, rebotar, router, t]);

  if (exito !== null) {
    return (
      <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            icono={<Icono nombre="guarderia" tamano={48} />}
            titulo={exito.titulo}
            descripcion={exito.detalle}
            accion={
              <Boton
                variante="primario"
                etiqueta={t('checkout.volverHogar')}
                onPress={() => {
                  /* D-329: `dismissTo` sólo busca en el stack ACTUAL. */
                  if (router.canDismiss()) router.dismissAll();
                  router.navigate('/hogar/guarderia');
                }}
              />
            }
          />
          {checkImagenes}
        </View>
      </SafeAreaView>
    );
  }

  if (esPaquete || esMensual || holdDia === null) {
    return (
      <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" atras titulo={t('checkout.titulo')} onAtras={() => router.back()} />
        <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4], paddingBottom: insets.bottom + spacing[8] }}>
          <Texto variante="seccion">{t('checkout.resumen')}</Texto>
          <Tarjeta relleno="ninguno">
            <Celda
              titulo={
                esMensual
                  ? t('checkoutGuarderia.mensualServicio')
                  : esPaquete
                    ? t('checkoutGuarderia.paqueteServicio', { n: texto('tamano') })
                    : t('checkoutGuarderia.servicio')
              }
              subtitulo={texto('prestadorNombre')}
              /* ☠️ **LA FECHA DE INICIO, DEROGADA (S108-C · T2).** Para la
                 mensualidad esta línea pintaba el día que la familia había
                 elegido *como si fuera el arranque del plan* — y con «pagar es
                 arrancar» el arranque es hoy. *Dejar un día ahí sería seguir
                 prometiendo el modelo viejo en la superficie donde se firma.*
                 Las otras dos conservan su fecha: para ellas ES la estadía. */
              metadataMono={esMensual ? undefined : texto('fecha')}
            />
            {/* ⭐ **EL TOTAL DEL PAQUETE SALE DEL PAQUETE, no de la URL.**
                Las otras dos siguen con su parámetro **y eso es correcto,
                medido**: para día `precioModalidad` es `ps.precio` y para
                mensual `ps.precio_mensual_plan` — los dos exactos y del lugar.
                *El único que era un mínimo era el paquete.*
                🔴 Mientras no se resuelve **no se pinta ningún número**: un
                total viejo o un «—» en la pantalla de pago se leen como dato. */}
            <Celda
              titulo={t('checkout.total')}
              metadataMono={
                esPaquete
                  ? precioPaquete.fase === 'listo'
                    ? `$ ${precioPaquete.precio.toFixed(2)}`
                    : undefined
                  : texto('precio')
              }
            />
          </Tarjeta>

          {/* ═══ ⭐ LA AUSENCIA ESCRITA (S108-C · T2) ═══════════════════════
              🔴 **Acá se elegía el día en que empezaba el plan.** El founder lo
              derogó el 31-ago: *pagar es arrancar.* **Y una decisión que se ve
              como una ausencia se escribe en el lugar donde se ve la ausencia**
              — si no, el hueco se lee como un dato que falta, y la familia
              autoriza un cobro que se repite sin saber cuándo cae.

              Las tres cosas, y ninguna es decorativa: **cuándo se cobra la
              primera vez** (hoy — lo que cambió), **cuándo se repite** (el
              ancla de la recurrencia) y **cómo se sale** (sin eso, un cobro
              mensual es una puerta de entrada sin salida). */}
          {esMensual ? (
            <View style={{ gap: spacing[2] }}>
              <Texto variante="seccion">{t('checkoutGuarderia.mensualCuando')}</Texto>
              <Texto variante="cuerpo">{t('checkoutGuarderia.mensualCuandoPrimera')}</Texto>
              <Texto variante="cuerpo">{t('checkoutGuarderia.mensualCuandoRepite')}</Texto>
              <Texto variante="cuerpo">{t('checkoutGuarderia.mensualCuandoCancela')}</Texto>
            </View>
          ) : null}

          {/* A DÓNDE PASAN A BUSCARLO — antes del medio de pago: primero
              dónde, después con qué. */}
          <SeccionDireccion
            dir={dir}
            rotulo={t('checkoutGuarderia.dondeRecogen')}
            apoyo={esMensual ? t('checkoutGuarderia.dondeRecogenMensual') : undefined}
          />

          {esMensual ? (
            <>
              <SeccionMedioDePago medio={medio} />
              <Texto variante="apoyo">{t('lugarGuarderia.mensualMandato')}</Texto>
            </>
          ) : esPaquete ? (
            /* 🔴 EL PAQUETE NO ELIGE TARJETA: el cobro es SIMULADO y la
               pantalla lo dice. *Un cobro simulado que la superficie presenta
               como real es la clase de mentira que esta casa persigue.*
               ⏪ **Esta línea se colaba en el DÍA**: al unificar los cuerpos
               quedó como el `else` de «¿es mensual?», y el día no es paquete.
               *El día sí tiene cobro real, con su hold — decirle que es
               simulado era mentirle al revés.* */
            <Texto variante="apoyo">{t('checkoutGuarderia.paqueteSimulado')}</Texto>
          ) : null}

          {rebote !== null ? <Texto variante="cuerpo">{rebote}</Texto> : null}
        </ScrollView>
        <View style={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[4] }}>
          <Boton
            variante="primario"
            bloque
            /* El día todavía no reservó: su botón CONTINÚA al pago con el
               hold recién creado. Los otros dos pagan acá mismo. */
            etiqueta={esPaquete || esMensual ? t('checkout.pagar') : t('checkoutGuarderia.continuar')}
            cargando={enviando}
            /* ⭐ **NO SE PAGA UN TOTAL QUE LA PANTALLA NO PUDO LEER.** Y el
                apagado DICE qué falta, cada causa con su frase — *una pared
                muda hace creer que el producto está roto.* */
            deshabilitado={
              (esMensual && medio.idTarjeta === null) ||
              (esPaquete && precioPaquete.fase !== 'listo')
            }
            razonDeshabilitado={
              esMensual
                ? t('lugarGuarderia.faltaTarjeta')
                : precioPaquete.fase === 'noVende'
                  ? t('checkoutGuarderia.paqueteYaNoSeVende')
                  : precioPaquete.fase === 'noPudimos'
                    ? t('checkoutGuarderia.precioNoLeido')
                    : t('checkoutGuarderia.precioCargando')
            }
            onPress={() => void (esPaquete || esMensual ? pagar() : reservarElDia())}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <CheckoutReserva
      citaId={holdDia.citaId}
      expiraEn={holdDia.expiraEn}
      precio={holdDia.precio}
      prestadorNombre={texto('prestadorNombre')}
      servicioNombre={t('checkoutGuarderia.servicio')}
      fecha={texto('fecha')}
      /* Sin hora: la estadía ocupa el día entre las dos ventanas. */
      hora={t('checkoutGuarderia.sinHora')}
      duracion={t('checkoutGuarderia.duracion')}
      exitoIcono="guarderia"
      resumenEtiqueta={t('checkout.resumen')}
      exitoTitulo={t('checkoutGuarderia.exitoTitulo')}
      exitoDetalle={t('checkoutGuarderia.exitoDetalle')}
      /* El slot que la pieza ya tenía para esto — y que además hace que su
         éxito pase a `ScrollView`, así el check no empuja el botón fuera. */
      exitoExtra={checkImagenes}
      /* No hay dirección que elegir: pasan a buscarlo por su casa. */
      puedePagar
    />
  );
}
