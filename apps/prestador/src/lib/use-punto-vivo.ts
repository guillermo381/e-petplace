/**
 * use-punto-vivo.ts — EL PUNTO DEL VEHÍCULO EN EL TRAMO (S107-D).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **ESTE HOOK NO ACUMULA. Y ésa es toda la pieza.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── POR QUÉ EL TRACKER DEL PASEO NO SE REUSA ENTERO ──────────────────────
 * El brief mandaba reusar el tracker del paseo por tramo, y el censo (§②④)
 * midió por qué el reuso tiene que ser **parcial**: `useTrackGps` acumula —
 * buffer, flush, `track_gps` completo— porque **en el paseo la traza ES el
 * producto**: la familia quiere ver por dónde caminó su perro.
 *
 * **En el tramo la traza es el RIESGO.** Una ruta de recogida pasa por las
 * casas de las otras familias, así que **la traza es la lista de domicilios
 * ajenos**, y las paradas se leen en la densidad de puntos. No es un problema
 * de permisos —ninguna policy se rompe— es la **forma del dato**.
 *
 * ⇒ Se reusa el mecanismo de captura (`expo-location`) y **se tira la
 * acumulación**. El hook mantiene **un punto: el último**, lo emite, y lo
 * olvida.
 *
 * ── QUÉ ES UN TRAMO, medido y no supuesto (29-ago) ───────────────────────
 * 🔴 **El tramo es del VIAJE, no de la estadía.** `guarderia_tramos` es
 * `(prestador_id, fecha, direccion)` — **no tiene `estadia_id`** —, y cada
 * estadía apunta a los suyos con `tramo_recogida_id` / `tramo_devolucion_id`.
 *
 * ⇒ **Un tramo lleva N animales y tiene UN punto** (`guarderia_tramo_punto`
 * con `tramo_id` de PK). *Quien lea «tramo» como «el viaje de este animal» va
 * a crear uno por estadía y a emitir el mismo vehículo N veces* — de ahí que
 * esto quede escrito acá y no en un parte.
 *
 * ── LA PRIVACIDAD SE CURÓ EN LAS DOS PUNTAS ──────────────────────────────
 * ✅ **El lector existe y está verificado** (`obtener_punto_vivo`, medido
 * 29-ago): devuelve **un punto o `null`, jamás una lista**; sólo lo ve quien
 * gestiona el prestador **o** quien tiene acceso a una mascota cuya estadía
 * está en **ese** tramo **y** en `recogida_en_curso` / `retorno_en_curso`. Y
 * un tramo inexistente devuelve `null` y no un error — *un error distinto para
 * «no existe» y «no podés» es un oráculo de ids*.
 *
 * **Pero el lector solo no alcanzaba**: un lector prudente sobre un escritor
 * que guarda todo deja la traza escrita, esperando a que alguien la lea con
 * otra consulta. **Si el escritor no acumula, no hay traza que recortar** — y
 * el escritor es UPSERT sobre `tramo_id` (verificado). *Curar la puerta de
 * entrada y no seguir hasta donde el dato se escribe deja la mitad de una cura
 * mirando a la otra* (la lección de `D-921`).
 *
 * ── FOREGROUND, Y ESO ES UNA DECISIÓN DECLARADA ──────────────────────────
 * Corre mientras la pantalla del tramo está a la vista. El permiso «siempre»
 * **ya existe** en esta app (D-292), así que llevarlo a segundo plano es
 * barato — pero **es decisión de producto, no un default**: implica
 * notificación persistente de servicio y significa emitir la posición del
 * cuidador con la app cerrada. *No se enciende sin que alguien lo firme.*
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

/** Lo único que viaja. Sin arreglo, sin historial, sin paradas. */
export interface PuntoVivo {
  lat: number;
  lng: number;
  /** epoch ms — el consumidor decide si está fresco. */
  t: number;
}

export type EstadoPuntoVivo =
  | 'inactivo'
  | 'pidiendo_permiso'
  | 'permiso_denegado'
  | 'buscando'
  | 'emitiendo';

/**
 * El escritor. **Inyectado** — hoy lo llena `cablearEmitirPunto()`, y sin él
 * el hook capta y no publica, diciéndolo con su estado en vez de fingir.
 *
 * ✅ Su contrato era «**pisá** el último punto, nunca agregues uno», y
 * **entró así**: `registrar_punto_vivo` es `ON CONFLICT` sobre una tabla cuya
 * PK es `tramo_id` (verificado 29-ago). *Con un INSERT la traza volvía a
 * existir por la puerta de atrás.*
 */
export type EmitirPunto = (tramoId: string, punto: PuntoVivo) => Promise<void>;

export interface OpcionesPuntoVivo {
  tramoId: string;
  /** El tramo está corriendo. En false el hook se apaga y suelta el watcher. */
  activo: boolean;
  emitir: EmitirPunto | null;
  /** Cada cuánto se emite como máximo. Default 15 s: un vehículo urbano no
   *  cambia de cuadra más rápido, y cada emisión es una escritura. */
  cadenciaMs?: number;
}

export interface UsePuntoVivo {
  estado: EstadoPuntoVivo;
  /** El último punto captado — para que el cuidador vea que está emitiendo. */
  ultimo: PuntoVivo | null;
}

export function usePuntoVivo(opciones: OpcionesPuntoVivo): UsePuntoVivo {
  const [estado, setEstado] = useState<EstadoPuntoVivo>('inactivo');
  const [ultimo, setUltimo] = useState<PuntoVivo | null>(null);
  const ultimaEmision = useRef(0);
  const suscripcion = useRef<Location.LocationSubscription | null>(null);

  const cadencia = opciones.cadenciaMs ?? 15_000;

  const alPunto = useCallback(
    async (pos: Location.LocationObject) => {
      const punto: PuntoVivo = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        t: pos.timestamp,
      };
      // 🔴 SE PISA, no se acumula. Este `setUltimo` es el único lugar donde
      // vive un punto, y guarda uno.
      setUltimo(punto);
      setEstado('emitiendo');

      const ahora = Date.now();
      if (ahora - ultimaEmision.current < cadencia) return;
      ultimaEmision.current = ahora;

      if (!opciones.emitir) return; // inerte y declarado: capta, no publica
      try {
        await opciones.emitir(opciones.tramoId, punto);
      } catch (e) {
        // Un punto perdido no es un incidente: el siguiente llega en segundos
        // y **pisa** al anterior. Se registra y se sigue — reintentar un punto
        // viejo sería publicar una posición que ya no es cierta.
        console.error(`[punto-vivo] emisión falló (se sigue con el próximo) · ${String(e)}`);
      }
    },
    [cadencia, opciones.emitir, opciones.tramoId],
  );

  useEffect(() => {
    let cancelado = false;

    async function arrancar() {
      if (!opciones.activo) {
        setEstado('inactivo');
        return;
      }
      setEstado('pidiendo_permiso');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelado) return;
      if (status !== 'granted') {
        setEstado('permiso_denegado');
        return;
      }
      setEstado('buscando');
      suscripcion.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5_000, distanceInterval: 25 },
        (pos) => {
          void alPunto(pos);
        },
      );
    }

    void arrancar();

    return () => {
      cancelado = true;
      suscripcion.current?.remove();
      suscripcion.current = null;
      // 🔴 Al soltar el tramo NO queda punto en memoria. Lo que no se guarda
      // no se filtra, y lo que no se recuerda no se puede reconstruir.
      setUltimo(null);
      setEstado('inactivo');
    };
  }, [opciones.activo, opciones.tramoId, alPunto]);

  return { estado, ultimo };
}
