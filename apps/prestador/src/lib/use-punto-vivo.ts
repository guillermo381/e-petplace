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
 * ── LA PRIVACIDAD SE CURA EN EL ESCRITOR, NO SÓLO EN EL LECTOR ───────────
 * A le pedí un lector que devuelva un punto y nada más (pedido D→A ②), y esa
 * mitad **sigue haciendo falta**. Pero un lector prudente sobre un escritor
 * que guarda todo deja la traza escrita, esperando a que alguien la lea con
 * otra consulta. **Si el escritor no acumula, no hay traza que recortar.**
 * *Curar la puerta de entrada y no seguir hasta donde el dato se escribe deja
 * la mitad de una cura mirando a la otra* (la lección de `D-921`).
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
 * El escritor. **Inyectado**: la tabla del tramo todavía no existe (pedido
 * D→A ②), así que sin él el hook capta y no publica — y lo dice con su estado
 * en vez de fingir que emitió.
 *
 * 🔴 Su contrato es «**pisá** el último punto», nunca «agregá uno»: si A lo
 * implementa como INSERT en una tabla de puntos, la traza vuelve a existir por
 * la puerta de atrás. **UPDATE de una fila por tramo.**
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
