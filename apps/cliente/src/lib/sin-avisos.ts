/**
 * ⭐ **LA SEÑAL DE QUE ESTÁS SIN SEÑAL** — `D-1057`, firma del founder (9-sep).
 *
 * Una app que no puede avisarle nada a la familia es exactamente lo que la
 * franja del Hogar existe para mostrar: *lo que hay que ver sin buscarlo*.
 *
 * ── POR QUÉ NO ALCANZABA LO QUE YA HABÍA ──────────────────────────────────
 * · `InvitacionAvisos` cubre a quien **todavía no decidió** (`undetermined`) y
 *   **a propósito NO invita con el permiso ya denegado**: el diálogo del SO no
 *   se abre en ese estado —*mandar a un muro*—, así que remite a Preferencias.
 * · Y ahí está el hueco que la firma nombra: **«en Preferencias ya está y nadie
 *   entra»**. La voz `notifPermisoNegado` vive en una pantalla que hay que ir a
 *   buscar, y la persona que no recibe avisos no tiene ningún motivo para ir.
 *
 * ⇒ esto **no duplica la invitación**: cubre el caso que ella deja fuera.
 *
 * ── LO QUE SE MIDE, Y LO QUE NO SE AFIRMA ─────────────────────────────────
 * Sólo `'negado'`. **`'no_medible'` NO se pinta** (`L-197`: lo que no se puede
 * medir vale ausencia, jamás un valor) — y ahí adentro vive también
 * `undetermined`, que es de la invitación y no de acá.
 */

import { useCallback, useState } from 'react';
import { Linking } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { permisoPushDelSistema } from './permiso-push';

/**
 * `true` **sólo** cuando el sistema dice `denied`.
 *
 * 🔴 **Se relee AL FOCO, y eso no es prolijidad: es la mitad ③ de la firma.**
 * *«Se va sola cuando el permiso esté dado»* — la persona sale a los ajustes
 * del sistema, lo enciende y vuelve; si el estado se leyera una sola vez al
 * montar, **la señal seguiría ahí después de resolverla**, que es la forma más
 * rápida de enseñar a ignorarla.
 */
export function useSinAvisos(): boolean {
  const [negado, setNegado] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void permisoPushDelSistema().then((p) => {
        if (vigente) setNegado(p === 'negado');
      });
      return () => {
        vigente = false;
      };
    }, []),
  );

  return negado;
}

/** Los ajustes de ESTA app en el sistema. `openSettings` es la única vía real:
 *  con el permiso denegado, `requestPermissionsAsync` devuelve `denied` en el
 *  acto sin abrir nada. */
export function abrirAjustesDelSistema(): void {
  void Linking.openSettings();
}
