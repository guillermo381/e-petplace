/**
 * GATE DE ROL DE RUTA (S75-B, D-513 — la mitad UI del gate de gestión).
 *
 * "La puerta va última" (D-512): hoy `obtenerMiPrestador` solo resuelve
 * para el TITULAR (por `prestadores.user_id`), así que ningún empleado
 * llega a estas rutas — el gate es INERTE. Cuando A abra el resolvedor
 * de empleados (B3), este hook empieza a rebotar al profesional/recepción
 * que intente deep-linkear a un taller de configuración de oferta, sin
 * tocarse: es el switch armado.
 *
 * Este es el gate de NAVEGACIÓN, y su porqué es HONESTIDAD DE SUPERFICIE
 * (mesa S75): el censo de A probó que TODA escritura de negocio ya es
 * titular-only en el server (D-490 ✓; D-513 salió — no hay entrega de
 * escritura al abrir la puerta). Sin este gate, un empleado vería editores
 * de oferta/precio que le REBOTAN en cada guardar — Ley 23 pura: no se
 * ofrece lo que el server va a rechazar. El server sigue siendo la
 * autoridad; esta es la cortesía que evita la promesa falsa.
 *
 * NO BLOQUEANTE a propósito: mientras verifica NO redirige (deja al taller
 * renderizar su carga normal — cero cambio para el titular, que es el
 * único que llega hoy). Solo redirige cuando CONFIRMA que el user no es
 * gestor. Falla de red = `empleadoTieneRol` cierra en false (Ley 23: ante
 * la duda, se cierra).
 */
import { useEffect, useState } from 'react';
import { empleadoTieneRol, obtenerMiPrestador } from '@epetplace/api';

/** true SOLO cuando se confirmó que el user NO puede gestionar el negocio.
 *  false mientras verifica o si es gestor — el consumidor redirige con true. */
export function useSoloGestorDenegado(): boolean {
  const [denegado, setDenegado] = useState(false);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const prestador = await obtenerMiPrestador();
      if (!vigente) return;
      // sin prestador resuelto: el propio taller ya rebota (estado error) —
      // no es trabajo de este gate decidir sobre un contexto que no existe.
      if (!prestador.ok) return;
      const rol = await empleadoTieneRol(prestador.data.id, ['dueño', 'administrador']);
      if (!vigente) return;
      // permitido = ok && true. denegado = confirmación explícita de NO rol.
      if (rol.ok && !rol.data) setDenegado(true);
    })();
    return () => {
      vigente = false;
    };
  }, []);

  return denegado;
}
