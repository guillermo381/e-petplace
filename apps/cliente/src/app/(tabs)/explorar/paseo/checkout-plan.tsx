/**
 * EL CHECKOUT DEL PLAN MENSUAL DE PASEO — S109-C · ②.
 *
 * ═══ 🔴 POR QUÉ ES UNA PANTALLA Y NO SIGUE SIENDO UNA HOJA ════════════════
 *
 * Firma del founder: **una Hoja se arrastra hacia abajo.** Mientras la plata se
 * mueve, la familia puede cerrarla con el dedo y no hay a dónde volver — *y esto
 * es una espera que cambia sola.* Además el checkout de la casa ya sostiene
 * espera, reintento y reanudación para cuatro sujetos: **ensanchar la Hoja sería
 * reimplementar todo eso en algo más angosto.**
 *
 * ⇒ La Hoja **configura** (días, hora, frecuencia, renovación) y esta pantalla
 * **cobra**. Es el mismo corte que guardería: la pantalla 4 elige, el checkout
 * paga.
 *
 * ═══ ⚠️ LO QUE HOY NO PUEDE HACER, DECLARADO ══════════════════════════════
 *
 * **Todavía no cobra**, y no por falta de pantalla: medido contra el repo en
 * `59816672`, `SujetoDeCobro` **no tiene un valor para `suscripciones_servicio`**
 * y la edge `pagos-cobro` **no lee ese sujeto** (cero menciones de
 * `suscripcion_servicio`). *Construir el `cobrar()` contra un riel que no existe
 * sería escribir una llamada que nadie puede atender.*
 *
 * Por eso la banda de simulación **se queda y dice la verdad**, y la fase de
 * espera existe con la voz de lo que de verdad está pasando hoy —armar el
 * plan—. **El día que el sujeto exista, el cambio es: `cobrar()` antes de la
 * fase, `useEsperaDeConfirmacion` adentro, y la voz pasa a hablar del banco.**
 * La pantalla, sus tres avisos y su éxito no se tocan.
 *
 * ═══ LOS TRES AVISOS, ANTES DE PAGAR ══════════════════════════════════════
 * Firma del founder, y van **en esta misma pantalla sin abrir nada más**:
 * qué día se cobra cada mes · que se avisa 3 días antes por correo · y que
 * **este plan SE PAUSA, NO SE CANCELA.**
 *
 * 🔴 **La asimetría se dice con todas las letras.** El plan de guardería se
 * cancela; éste se pausa y se puede volver a encender. *Un «gestionar» ambiguo
 * que disimule la diferencia es peor que no decir nada: hace creer que las dos
 * cosas son la misma, y la familia descubre cuál tiene el día que quiere irse.*
 */

import { useCallback, useState, useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton, Celda, Encabezado, EsperaDeTrabajo, EstadoVacio, Icono,
  PantallaConPie, Separador, Tarjeta, Texto, spacing, useAviso, useTheme,
} from '@epetplace/ui';
import { contratarPlanPaseo } from '@epetplace/api';

/* El vocabulario del motor, tal cual (`planes.ts:117`). No se exporta desde el
   paquete, así que se declara acá con su fuente citada — *inventarlo más ancho
   dejaría pasar una frecuencia que el server rebota.* */
type Frecuencia = 'semanal' | 'quincenal' | 'mensual';

import { simula } from '@/lib/pagos/simulado';
import { cobrar } from '@/lib/pagos/cobro';
import { useEsperaDeConfirmacion } from '@/lib/pagos/espera-confirmacion';
import { useMedioDePago, SeccionMedioDePago } from '@/components/seccion-medio-de-pago';
import { useTraduccion } from '@/i18n';

export default function CheckoutPlanPaseo() {
  const { t } = useTraduccion();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const params = useLocalSearchParams();
  const texto = (k: string): string => (typeof params[k] === 'string' ? (params[k] as string) : '');

  const dias = texto('dias').split(',').filter((x) => x.length > 0).map(Number);
  const precio = Number(texto('precioMensual'));

  /* `procesando` NO es el vuelo de la RPC: es la fase que la familia mira. Hoy
     dice que estamos armando el plan —que es lo que pasa—; el día que haya
     cobro, dice que estamos confirmando con el banco. */
  const [fase, setFase] = useState<'resumen' | 'procesando' | 'exito'>('resumen');
  const [rebote, setRebote] = useState<string | null>(null);
  /** El plan en vuelo: nace ANTES del cobro y lo espera la máquina. */
  const [planEnVuelo, setPlanEnVuelo] = useState<string | null>(null);
  /* ⭐ **ACTIVO SIEMPRE EN EL RESUMEN, TAMBIÉN MIENTRAS SIMULA — y esto lo
     cambió una medición de A, no una preferencia.**

     ⏪ Lo tenía condicionado a `!simula(...)` con el argumento de que «pedir
     tarjetas para una pantalla que no va a cobrar es un viaje que nadie
     necesita». **Falso, y el motor lo dice:** `contratar_plan_paseo` exige
     declarar el riel *para firmar el mandato*, no para cobrarlo — sin medio
     rebota `riel_no_declarado` **también en simulado**.

     🔴 *El mandato existe desde que se firma; lo que todavía no existe es el
     débito.* Son dos cosas distintas y la banda dice exactamente la segunda. */
  const medio = useMedioDePago(fase === 'resumen');

  /* ⭐ **S109-C · UN SOLO INTERRUPTOR GOBIERNA LA BANDA Y EL COBRO.**
     *Si el cobro se enciende antes que la banda se apague, la pantalla cobra de
     verdad diciendo que simula — que es la misma mentira al revés y peor,
     porque nadie la busca.* Por eso `simula('plan_paseo')` no decora: DECIDE.
     El día del deploy de B se cambia UNA palabra en `simulado.ts` y las dos
     superficies se mueven juntas, por construcción. */
  const simulado = simula('plan_paseo');
  const espera = useEsperaDeConfirmacion(
    fase === 'procesando' && !simulado && planEnVuelo !== null
      ? { tipo: 'plan', id: planEnVuelo }
      : null,
  );

  useEffect(() => {
    if (espera.fase !== 'resuelta') return;
    const e = espera.estado;
    if (e === 'activa') { setFase('exito'); return; }
    setFase('resumen');
    setPlanEnVuelo(null);
    /* Cada final con su frase. `esperando_pago` NO es rechazo: el cobro puede
       seguir en camino, y decir «no entró» mandaría a pagar dos veces. */
    setRebote(
      e === 'cancelada' ? t('checkoutPlan.canceladoVoz')
      : e === 'fallida' ? t('checkoutPlan.noEntroVoz')
      : t('checkoutPlan.sigueEnCaminoVoz'),
    );
  }, [espera, t]);

  const contratar = useCallback(async () => {
    if (fase !== 'resumen') return;
    /* 🔴 **ACÁ EL MEDIO ES SIEMPRE TARJETA, y el guard lo dice sin excepción.**
       DeUna no se puede elegir en esta pantalla (`deunaCobraEsteSujeto={false}`,
       medido abajo), así que **no hay rama de DeUna y no debe haberla**: *una
       rama inalcanzable que firmara el mandato por DeUna y después cobrara por
       tarjeta con `null` es peor que no tenerla* — el día que alguien encienda
       la prop, el compilador tiene que traerlo acá, no dejarlo pasar. */
    if (medio.idTarjeta === null) { setRebote(t('pago.cobroElegiMedio')); return; }
    setFase('procesando');
    setRebote(null);

    /* El plan nace **una sola vez**, aunque el cobro se reintente: sin esto,
       cada reintento tras un rechazo dejaría otro plan pendiente. */
    let planId = planEnVuelo;
    if (planId === null) {
      const r = await contratarPlanPaseo({
        prestador_id: texto('prestadorId'),
        prestador_servicio_id: texto('prestadorServicioId'),
        mascota_id: texto('mascotaId'),
        dias,
        hora: texto('hora'),
        frecuencia: texto('frecuencia') as Frecuencia,
        auto_renovar: texto('renueva') === '1',
        /* ⭐ **EL RIEL VIAJA EN EL MISMO ACTO QUE LA TARJETA, y eso no es
           prolijidad: es lo que el motor exige.** `chk_susc_riel_valido` pide
           que si el riel es `tarjeta` haya tarjeta, y un `riel` NULL significa
           *nadie lo declaró* (hay uno vivo así en la base, medido por B).
           *Contratar primero y guardar el riel después dejaría una ventana con
           el plan existiendo sin poder cobrarse* — por eso van juntos en una
           sola llamada y no en dos.

           🔴 **Acá es SIEMPRE tarjeta, y el guard de arriba lo garantiza sin
           excepción:** DeUna no puede cobrar este sujeto
           (`deunaCobraEsteSujeto={false}`, medido abajo). *Caer a DeUna «porque
           no hay tarjeta» sería elegir por la familia el compromiso más caro de
           los dos —el que hay que ir a pagar a mano cada mes— por un descarte.*

           ⚠️ **Esta línea llegó por el compilador, y así tenía que ser.** A
           cambió `p_riel` a `DEFAULT NULL` (el silencio gana su nombre:
           `riel_no_declarado`) y el wrapper a esta unión ⇒ *lo que sólo existía
           en runtime pasó a existir en build.* La pantalla estaba rota desde
           antes: contratar rebotaba siempre y nadie lo veía. */
        medio: { riel: 'tarjeta', tarjetaId: medio.idTarjeta },
      });
      if (!r.ok) {
        /* 🔴 Se queda en el resumen con TODO lo elegido — *lo que la familia
           quiere después de un rebote es corregir, no rehacer.* Y la razón se
           lee en palabras: el wrapper ya trae su mensaje tipado. */
        setFase('resumen');
        setRebote(r.mensaje);
        return;
      }
      planId = r.data.suscripcion_id;
      setPlanEnVuelo(planId);
    }

    /* ☠️ **MIENTRAS SIMULA, EL ÉXITO SE DECLARA ACÁ — y eso es exactamente lo
       que la banda anuncia.** No hay cobro que esperar. */
    if (simulado) { setFase('exito'); return; }

    const cobro = await cobrar({ tipo: 'plan', id: planId }, medio.idTarjeta);
    if (!cobro.ok) {
      setFase('resumen');
      mostrar({ texto: t(cobro.voz), variante: 'error' });
      return;
    }
    /* La fase NO cambia: ya está en `procesando`, y ahora la máquina mira.
       *Un `ok` del wrapper significa «el proveedor contestó», jamás «pagado».* */
  }, [fase, dias, simulado, medio.idTarjeta, planEnVuelo, mostrar, t]);

  if (fase === 'procesando') {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[4], padding: spacing[6] }}>
          {/* El nombre de lo que se está comprando, quieto y centrado. */}
          <Texto variante="titulo">{t('checkoutPlan.esperaTitulo')}</Texto>
          <Texto variante="cuerpo">{t('checkoutPlan.esperaCuerpo')}</Texto>
          {/* La rampa que trabaja — la MISMA de la casa: pulso sobrio, sin
              rebotes ni confeti, y sin botón de reintentar en los primeros
              segundos (no hay ninguno acá: la pantalla cambia sola). */}
          <EsperaDeTrabajo />
        </View>
      </SafeAreaView>
    );
  }

  if (fase === 'exito') {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[4] }}>
          <EstadoVacio
            icono={<Icono nombre="paseo" tamano={48} />}
            titulo={t('checkoutPlan.exitoTitulo')}
            /* El comprobante en palabras de familia: qué compró, no un id. */
            descripcion={t('checkoutPlan.exitoDetalle', { precio: precio.toFixed(2) })}
            accion={
              <Boton
                variante="primario"
                etiqueta={t('checkout.volverHogar')}
                onPress={() => {
                  if (router.canDismiss()) router.dismissAll();
                  router.navigate('/hogar/paseos');
                }}
              />
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" atras titulo={t('checkout.titulo')} onAtras={() => router.back()} />
      <PantallaConPie
        contentContainerStyle={{ padding: spacing[4], gap: spacing[4], paddingBottom: insets.bottom + spacing[4] }}
        pie={
          <Boton
            variante="primario"
            bloque
            /* El sufijo «(simulado)» **sale del mismo mapa que la banda**: no
               puede quedar uno sin el otro, que es exactamente lo que me pasó
               con el programa. */
            etiqueta={`${t('plan.contratar')}${simula('plan_paseo') ? t('pago.sufijoSimulado') : ''}`}
            onPress={() => void contratar()}
          />
        }
      >
        <Texto variante="seccion">{t('checkout.resumen')}</Texto>
        <Tarjeta relleno="ninguno">
          <Celda
            titulo={t('checkoutPlan.servicio')}
            subtitulo={t('checkout.conPrestador', { prestador: texto('prestadorNombre') })}
            metadataMono={`${dias.length}×/sem · ${texto('hora').slice(0, 5)}`}
          />
          <Separador />
          <Celda titulo={t('checkout.total')} metadataMono={`$${precio.toFixed(2)}`} />
        </Tarjeta>

        {/* ═══ 🔴 LOS TRES AVISOS — en esta pantalla, sin abrir nada más ═══ */}
        <View style={{ gap: spacing[2] }}>
          <Texto variante="seccion">{t('checkoutPlan.antesDePagar')}</Texto>
          <Texto variante="cuerpo">{t('checkoutPlan.cuandoSeCobra')}</Texto>
          <Texto variante="cuerpo">{t('checkoutPlan.avisoPrevio')}</Texto>
          {/* La asimetría, con todas las letras. */}
          <Texto variante="cuerpo">{t('checkoutPlan.sePausaNoSeCancela')}</Texto>
        </View>

        {/* ⭐ **YA NO SE ESCRIBE A MANO: SE DERIVA.** El día que el plan cobre,
            `simula('plan_paseo')` pasa a `false` y **esta banda desaparece sola**
            — junto con el sufijo del botón, desde la misma línea. */}
        {/* ⭐ **EL MEDIO SE MONTA SIEMPRE**, también mientras simula: el motor
            exige declarar el riel para FIRMAR, no para cobrar.
            🔴 `recurrente`: los dos medios prometen cosas distintas —uno se
            cobra solo, al otro hay que ir a pagarlo— y las dos promesas van
            ANTES de elegir. */}
        {/* 🔴 `deunaCobraEsteSujeto={false}` — **MEDIDO, no supuesto**:
            `SujetoDeuna` (`pagos-deuna.ts:66-79`) tiene compra · cita · bono ·
            mensualidad · programa, **y no `plan`**. El riel no sabe nombrar
            este sujeto ⇒ *dejar la fila tocable sería ofrecer un medio que la
            pantalla siguiente no puede honrar* (Ley 23).
            ⚠️ **Y NO es «porque es recurrente»**: la mensualidad de guardería
            también lo es y SÍ se paga por DeUna, con link mensual. La razón es
            del SUJETO, y por eso se declara acá y no en la pieza.
            ⭐ El día que `plan` entre a `SujetoDeuna`, esto es borrar una prop
            — y `cobro_link_mensual` ya tiene `suscripcion_servicio_id` en su
            XOR, así que el destino del link existe. Reportado a B. */}
        <SeccionMedioDePago medio={medio} recurrente deunaCobraEsteSujeto={false} />
        {/* ☠️ **LA BANDA SE SUMA, NO REEMPLAZA — y no se contradice con la
            sección de arriba**: el mandato se firma hoy, el débito todavía no
            sale. *Decir «simulado» al lado de un selector de tarjeta sólo sería
            confuso si las dos frases hablaran de lo mismo, y no lo hacen.*
            El día del deploy de B, `plan_paseo` pasa a `false` en
            `simulado.ts` y **esta banda y el sufijo del CTA desaparecen a la
            vez**, sin tocar esta pantalla. */}
        {simula('plan_paseo') ? <Texto variante="apoyo">{t('checkout.simuladoAviso')}</Texto> : null}

        {rebote !== null ? <Texto variante="cuerpo">{rebote}</Texto> : null}
      </PantallaConPie>
    </SafeAreaView>
  );
}
