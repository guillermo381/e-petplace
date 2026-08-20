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
import { leerEstadoCompra, type EstadoCompra } from '@epetplace/api';

/** Arranca a 2 s y se abre hasta 15 s. */
const PASOS_MS = [2_000, 3_000, 5_000, 8_000, 12_000, 15_000] as const;

/**
 * 🔴 EL TOPE. Pasado esto, la pantalla **deja de mirar y lo dice** — pero
 *    **NO declara ningún desenlace**: la compra sigue viva y el barrido
 *    mismo-día la va a resolver. *Un tope que se dibuja como «rechazado» hace
 *    que la familia vuelva a pagar algo que quizá ya pagó.*
 */
const TOPE_MS = 90_000;

export type Espera =
  | { fase: 'mirando' }
  | { fase: 'resuelta'; estado: EstadoCompra }
  | { fase: 'sigue_abierta' };

/**
 * Mira hasta que la compra se resuelva, se acabe el tope, o la pantalla pierda
 * el foco. **No escribe nada** — solo lee.
 */
export function useEsperaDeConfirmacion(compraId: string | null): Espera {
  const [espera, setEspera] = useState<Espera>({ fase: 'mirando' });
  const vivo = useRef(true);

  useEffect(() => {
    if (compraId === null) return;
    /* El `null` ya se descartó arriba; se fija en una const para que el
       closure no dependa de una prop que TS ve como nullable. */
    const id: string = compraId;
    vivo.current = true;
    const desde = Date.now();
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

      const r = await leerEstadoCompra(id);
      if (!vivo.current) return;

      if (r.ok && r.data.resuelta) {
        setEspera({ fase: 'resuelta', estado: r.data.estado });
        return;                       // se corta solo, como el precedente
      }

      if (Date.now() - desde > TOPE_MS) {
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
  }, [compraId]);

  return espera;
}
