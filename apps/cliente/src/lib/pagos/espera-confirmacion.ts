/**
 * S101-B · FASE 4 · LA ESPERA — el sondeo que confirma el pago.
 *
 * ═══ LA DECISIÓN: POLLING, NO REALTIME — con su doble check ═══════════════
 *
 * **Realtime:** medido **CERO `.channel(`** en todo el monorepo (S94-PERF, y
 * re-medido en el censo de esta sesión) ⇒ **no hay un solo precedente
 * construido**. Y `D-739` mide su costo: el poller de WAL **ya suma 60,6 %**
 * del tiempo de la base sirviendo a tres webs del legado.
 *
 * **Polling:** ya corre en producción — `paseo/[atencionId].tsx`, con la letra
 * de **frescura honesta** de S59: sondeo **solo en foco**, **solo mientras hace
 * falta**, y se corta solo cuando el estado cambia.
 *
 * ⇒ **Gana polling**, y no por inercia — por tres razones que son de ESTE caso:
 *   ① la espera del cobro dura **segundos**, no horas: una conexión viva para
 *      eso es maquinaria cara para una ventana corta;
 *   ② la pantalla está **en primer plano** — no hay que despertar a nadie;
 *   ③ es **una compra**, no un flujo continuo: el sondeo muere con ella.
 *
 * *Y la asimetría que lo cierra: el precedente vivo resuelve el MISMO problema
 * —una pantalla que cambia sola mientras un proceso ajeno avanza— sin realtime,
 * y lleva sesiones corriendo así.*
 *
 * 🔴 **DÓNDE SE APARTA DEL PRECEDENTE, Y POR QUÉ:** el paseo sondea cada 30 s
 * fijos porque su dato se mueve cada 60. **Acá la confirmación puede llegar en
 * dos segundos o en treinta**, así que el sondeo **arranca rápido y se abre**
 * (backoff). *Un intervalo fijo obliga a elegir entre martillar el server o
 * hacer esperar de más a la familia; el backoff no tiene que elegir.*
 */

import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  leerEstadoCompra, leerEstadoCita, leerEstadoBono, leerEstadoMensualidad, leerEstadoPrograma,
  leerEstadoPlan,
  type EstadoCompra, type EstadoCita,
  type EsperaBonoEstado, type EstadoMensualidad, type EsperaProgramaEstado,
  type EstadoPlan,
} from '@epetplace/api';

/** Arranca a 2 s y se abre hasta 15 s. */
const PASOS_MS = [2_000, 3_000, 5_000, 8_000, 12_000, 15_000] as const;

/**
 * 🔴 EL TOPE. Pasado esto, la pantalla **deja de mirar y lo dice** — pero
 *    **NO declara ningún desenlace**: la compra sigue viva y el barrido
 *    mismo-día la va a resolver. *Un tope que se dibuja como «rechazado» hace
 *    que la familia vuelva a pagar algo que quizá ya pagó.*
 *
 * 🔴 **QUÉ MIDE, y por eso se exporta (S105-C):** *cuánto esperamos al webhook
 *    DESPUÉS de que la plata se movió.* Con tarjeta el débito ya ocurrió
 *    cuando esta espera arranca, así que 90 s es todo el margen que hace
 *    falta. **Con DeUna la plata todavía NO se movió**: la persona está
 *    cambiando de app y tecleando seis dígitos. *El mismo número mediría dos
 *    cosas distintas.* Por eso el riel de DeUna lo usa como **margen**, no
 *    como tope — ver `topeDeEspera` en `deuna-estado`.
 */
export const TOPE_MS = 90_000;

/**
 * 🔴 QUÉ SE ESPERA — **el sujeto, explícito** (S101-C). La compra de despensa y
 *    la cita de servicio esperan **con esta misma pieza**.
 *
 *    *Un segundo hook para el segundo sujeto habría sido el lugar exacto donde
 *    las dos puertas empiezan a comportarse distinto: el backoff de una se
 *    afina, el de la otra no, y un día el paseo tarda más que la despensa sin
 *    que nadie sepa por qué.*
 */
/**
 * ⭐ **S108-C · LOS CUATRO SUJETOS.** El paquete y la mensualidad de guardería
 * entran por la MISMA pieza que la compra de despensa y la cita de servicio.
 *
 * *Un cuarto hook para el cuarto sujeto habría sido el lugar exacto donde las
 * puertas empiezan a comportarse distinto: el backoff de una se afina, el de la
 * otra no, y un día el paquete tarda más que el paseo sin que nadie sepa por
 * qué.* La razón que ya estaba escrita para el segundo vale igual para el
 * cuarto — y por eso acá sólo crece la unión y el `switch` de abajo.
 */
export type SujetoEnEspera =
  | { tipo: 'compra'; id: string }
  | { tipo: 'cita'; id: string }
  | { tipo: 'bono'; id: string }
  /* 🔴 **`mensualidad`, no `suscripcion`** — es el nombre que le puso
     `SujetoDeCobro` (S108-B) y el que usa el discriminador del motor. *Dos
     palabras para el mismo sujeto es el lugar exacto donde una pieza empieza a
     esperar algo que otra no cobró.* */
  | { tipo: 'mensualidad'; id: string }
  /** S109 · El programa de adiestramiento: sujeto propio porque sus sesiones
   *  están numeradas y siguen un currículum — un bono es fungible. */
  | { tipo: 'programa'; id: string }
  /**
   * ⭐ **S109 · EL PLAN DE PASEOS — sujeto propio, y NO es «la mensualidad del
   * otro oficio».** Las dos se cobran una vez por mes y **se leen distinto**:
   * la mensualidad de guardería es un **MANDATO** —no tiene `estado_pago`, su
   * prueba de vida es `periodo_desde`— y el plan **sí lo tiene**, porque desde
   * S109 nace `pendiente` como los demás comprables.
   * *Dos sujetos que se cobran igual no se leen igual, y meterlos en el mismo
   * brazo haría que esta pieza consultara la columna del otro.* (Medido por A.)
   */
  | { tipo: 'plan'; id: string };

export type Espera =
  | { fase: 'mirando' }
  /** 🔴 El estado viaja **en el vocabulario de su sujeto**, sin traducirse.
   *  *«pagada» es la única palabra que los dos comparten, y es la única que
   *  esta pantalla necesita comparar.* */
  | {
      fase: 'resuelta';
      estado: EstadoCompra | EstadoCita | EsperaBonoEstado | EstadoMensualidad | EsperaProgramaEstado | EstadoPlan | null;
    }
  | { fase: 'sigue_abierta' };

/**
 * Mira hasta que el sujeto se resuelva, se acabe el tope, o la pantalla pierda
 * el foco. **No escribe nada** — solo lee.
 *
 * @param topeMs **cuánto más, DESDE AHORA, tiene sentido seguir mirando.** Por
 *        omisión `TOPE_MS`, que es la conducta de tarjeta y **no cambia**.
 *
 * 🔴 **ES UN MARGEN DESDE AHORA, NO UNA DURACIÓN TOTAL — y la diferencia la
 * encontré trazando el reloj, no leyendo el código.** Mi primera versión lo
 * comparaba contra *el tiempo transcurrido desde que la espera arrancó*,
 * mientras `topeDeEspera` lo calcula *desde ahora*: **dos orígenes distintos
 * para el mismo número.** Con tarjeta coincidían (la espera arranca cuando la
 * plata ya se movió); con DeUna **el tope se disparaba justo al vencer el
 * código**, porque el valor iba encogiendo mientras el reloj de comparación
 * iba creciendo, y los dos se cruzaban ahí. *Compilaba, y el error era de
 * aritmética del tiempo — la clase que solo aparece si uno se sienta a
 * trazarla minuto a minuto.*
 *
 * ⇒ **Se guarda un INSTANTE LÍMITE absoluto, y SOLO SE MUEVE HACIA ADELANTE.**
 * Anclado a `venceEn`, `Date.now() + topeMs` da **el mismo instante en cada
 * render** aunque el margen encoja — o sea que el límite queda quieto solo
 * mientras el código sea el mismo, y **se corre de verdad cuando nace uno
 * nuevo.** *Un tope que puede retroceder deja a la pantalla rindiéndose antes
 * que la persona.*
 *
 * 🔴 **Y va por REF, no por dependencia del efecto**: si `topeMs` remontara el
 * sondeo, cada regeneración volvería el backoff a 2 s y el reloj a cero.
 * *Sondear más rápido porque la persona pidió otro código es castigar al
 * servidor por un gesto de ella.*
 *
 * ⚠️ Se escribe en un efecto y no en el render: *escribir una ref durante el
 * render es de las cosas que funcionan hasta que StrictMode las mira.* Los
 * efectos corren mucho antes del primer tick (2 s), así que el límite ya está
 * puesto cuando se lo compara por primera vez.
 *
 * ⚠️ **LÍMITE CONOCIDO, declarado en vez de curado (S105-C):** si la persona
 * **regenera el código DESPUÉS** de que el tope ya se cumplió, el sondeo ya se
 * cortó y **no vuelve** — mover el límite no lo resucita. Medido qué cuesta:
 * **nada de plata.** El pago se registra igual server-side y la pantalla
 * conserva su salida; lo que se pierde es que **celebre sola**. Curarlo pide
 * que el sondeo se REARME con cada código nuevo, y eso **no se construye a
 * ciegas**: hoy el camino real no corre y no habría con qué probarlo.
 */
export function useEsperaDeConfirmacion(
  sujeto: SujetoEnEspera | null,
  topeMs: number = TOPE_MS,
): Espera {
  const [espera, setEspera] = useState<Espera>({ fase: 'mirando' });
  const vivo = useRef(true);
  /** El INSTANTE en que se deja de mirar. **Solo avanza**, dentro de una espera. */
  const limite = useRef(0);
  /** El último margen conocido — lo lee el arranque, que no puede depender de él. */
  const margen = useRef(topeMs);
  useEffect(() => {
    margen.current = topeMs;
    const propuesto = Date.now() + topeMs;
    if (propuesto > limite.current) limite.current = propuesto;
  }, [topeMs]);
  /* Las dos identidades por separado: son las dependencias reales del efecto.
     Pasar el objeto lo remontaría en cada render —un literal nuevo cada vez—
     y el sondeo arrancaría de cero para siempre, sin cerrar nunca. */
  const tipo = sujeto?.tipo ?? null;
  const sujetoId = sujeto?.id ?? null;

  useEffect(() => {
    if (sujetoId === null || tipo === null) return;
    /* El `null` ya se descartó arriba; se fija en una const para que el
       closure no dependa de una prop que TS ve como nullable. */
    const id: string = sujetoId;
    vivo.current = true;
    /* ☠️ Acá vivía `const desde = Date.now()`: el origen contra el que se medía
       el tope viejo. **Murió con él** — hoy el corte es un INSTANTE absoluto
       (`limite`) y no una duración, así que no hay desde qué contar.

       🔴 **PERO EL LÍMITE SE ANCLA ACÁ, Y ESO NO ES OPCIONAL.** «Solo avanza»
       vale DENTRO de una espera; **cada espera arranca con el suyo fresco.**
       *Sin esto, un resumen que quedó abierto cinco minutos antes de que
       alguien tocara «Pagar» heredaba un límite del MONTAJE —ya vencido— y la
       pantalla decía «está tardando más de lo normal» **en el primer tick**,
       sobre un cobro que acababa de empezar.* El defecto lo abrió el cambio de
       duración a instante: *mover un origen de tiempo mueve todo lo que colgaba
       de él, y lo que colgaba no avisa.* */
    limite.current = Date.now() + margen.current;
    let paso = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function mirar() {
      if (!vivo.current) return;

      /* 🔴 En segundo plano NO se sondea: la letra de S59 y el sentido común —
         *nadie necesita que la app trabaje mientras no la están mirando*. Al
         volver al foco, el efecto se remonta y el sondeo arranca de nuevo. */
      if (AppState.currentState !== 'active') {
        timer = setTimeout(mirar, 3_000);
        return;
      }

      /* 🔴 **`switch` EXHAUSTIVO, no una cadena de ternarios.** Con dos sujetos
         un ternario alcanzaba; con cuatro, *un sujeto nuevo que nadie agregue
         acá caería en el brazo de otro y esta pieza sondearía la tabla
         equivocada sin fallar* — devolvería el estado de un objeto ajeno y la
         pantalla lo leería como veredicto. El `never` obliga a que el
         compilador lo cace. */
      const r =
        tipo === 'compra' ? await leerEstadoCompra(id)
        : tipo === 'cita' ? await leerEstadoCita(id)
        : tipo === 'bono' ? await leerEstadoBono(id)
        : tipo === 'mensualidad' ? await leerEstadoMensualidad(id)
        : tipo === 'programa' ? await leerEstadoPrograma(id)
        : tipo === 'plan' ? await leerEstadoPlan(id)
        : ((): never => { throw new Error(`sujeto no contemplado: ${String(tipo)}`); })();
      if (!vivo.current) return;

      if (r.ok && r.data.resuelta) {
        setEspera({ fase: 'resuelta', estado: r.data.estado });
        return;                       // se corta solo, como el precedente
      }

      if (Date.now() > limite.current) {
        /* 🔴 NO es un desenlace. La compra sigue viva y el barrido la resuelve
           el mismo día. La pantalla lo dice con su voz y ofrece salida. */
        setEspera({ fase: 'sigue_abierta' });
        return;
      }

      /* Un fallo de lectura **no corta la espera**: puede ser un bache de red,
         y cortar acá dibujaría un final que el servidor no dijo. */
      paso = Math.min(paso + 1, PASOS_MS.length - 1);
      timer = setTimeout(mirar, PASOS_MS[paso]);
    }

    timer = setTimeout(mirar, PASOS_MS[0]);
    return () => { vivo.current = false; if (timer) clearTimeout(timer); };
  }, [tipo, sujetoId]);

  return espera;
}
