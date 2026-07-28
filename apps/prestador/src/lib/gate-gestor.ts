/**
 * GATE DE ROL DE RUTA (S75-B, D-513 — la mitad UI del gate de gestión;
 * REESCRITO S79-B tras el blanco del gate del founder).
 *
 * EL BUG QUE LO REESCRIBIÓ (S79, medido estático + diagnóstico de A):
 * `empleado_tiene_rol` devuelve false cuando el negocio NO TIENE fila de
 * titular (obtenerTitularId → NULL, el dato roto que A mide) — y la
 * versión vieja convertía ese dato ENVENENADO en una denegación
 * CONFIRMADA: el TITULAR real era expulsado por `<Redirect/>` mudo, y la
 * cadena taller → negocio → tabs (todos redirigiendo a la vez) dejaba la
 * pantalla EN BLANCO. Sin crash — por eso ninguna frontera lo atrapó:
 * era un render legítimo de nada (Ley 13/D-541: el peor estado fabricado).
 *
 * LA LEY NUEVA DEL HOOK: **la denegación exige lectura COHERENTE.**
 * rol=false se CONTRASTA con el titular del negocio: un negocio sin
 * titular es IMPOSIBLE (backfill S73, 5/5; toda alta crea la fila dueño)
 * ⇒ si titular es NULL, el dato está ROTO y el gate lo DICE — jamás
 * deniega. Con titular presente, la denegación es real y la ausencia
 * (Redirect) sigue siendo la forma correcta (Ley 23).
 *
 * Estados:
 *  · 'verificando' — no bloquea (igual que siempre: el titular renderiza
 *    su carga normal; solo se actúa al confirmar).
 *  · 'permitido'  — gestor confirmado, o lectura caída (ante la duda NO
 *    se fabrica denegación; el server sigue siendo la autoridad de
 *    escritura — D-490/D-513).
 *  · 'denegado'   — confirmación COHERENTE de no-gestor → el consumidor
 *    redirige (ausencia, Ley 23).
 *  · 'roto'       — los datos se contradicen (rol=false y titular=null):
 *    el consumidor muestra una superficie que HABLA con reintento
 *    (components/gate-roto.tsx), jamás nada.
 */
import { useCallback, useEffect, useState } from 'react';
import { empleadoTieneRol, obtenerMiEmpleadoId, obtenerMiPrestador, obtenerTitularId } from '@epetplace/api';

export type GateGestor = 'verificando' | 'permitido' | 'denegado' | 'roto';

export function useGateGestor(): { gate: GateGestor; reintentarGate: () => void } {
  const [gate, setGate] = useState<GateGestor>('verificando');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setGate('verificando');
    void (async () => {
      const prestador = await obtenerMiPrestador();
      if (!vigente) return;
      // sin prestador resuelto: el propio taller ya rebota (estado error) —
      // no es trabajo de este gate decidir sobre un contexto que no existe.
      if (!prestador.ok) {
        setGate('permitido');
        return;
      }
      const rol = await empleadoTieneRol(prestador.data.id, ['dueño', 'administrador']);
      if (!vigente) return;
      // lectura caída ≠ denegación: no se fabrica estado (D-521); la
      // escritura la sigue protegiendo el server.
      if (!rol.ok) {
        setGate('permitido');
        return;
      }
      if (rol.data) {
        setGate('permitido');
        return;
      }
      // rol=false: ANTES de denegar, la coherencia. obtenerTitularId
      // devuelve null tanto si no hay titular como si la lectura falla —
      // en ambos casos NO hay base coherente para expulsar: se dice.
      const titular = await obtenerTitularId(prestador.data.id);
      if (!vigente) return;
      if (titular === null) {
        // S80-B3 — EL FALSO ROTO, medido en campo (el founder como
        // empleado leyó "los datos se contradicen" con un Reintentar que
        // jamás cura): titular=null NO distingue "no hay titular" de "la
        // RLS me lo esconde" — `empleados_self` oculta las filas ajenas,
        // así que TODO empleado activo caía acá. La coherencia gana el
        // dato que la RLS SÍ garantiza: MI fila. Empleado activo sin rol
        // de gestión ⇒ la denegación ES coherente (ausencia, Ley 23).
        // Sin fila propia (roto real o lectura caída) ⇒ 'roto' se
        // conserva tal cual — la protección S79 del titular expulsado
        // queda intacta (un negocio sin fila dueño se DICE, jamás se
        // deniega).
        const miFila = await obtenerMiEmpleadoId(prestador.data.id);
        if (!vigente) return;
        if (miFila !== null) {
          setGate('denegado');
          return;
        }
        console.error('[gate-gestor] datos rotos: rol=false y titular=null — no se deniega, se dice');
        setGate('roto');
        return;
      }
      setGate('denegado');
    })();
    return () => {
      vigente = false;
    };
  }, [intento]);

  const reintentarGate = useCallback(() => setIntento((n) => n + 1), []);
  return { gate, reintentarGate };
}
