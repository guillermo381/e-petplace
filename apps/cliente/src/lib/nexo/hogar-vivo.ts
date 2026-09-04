/**
 * NEXO · EL HOGAR QUE EL SHELL NECESITA SABER (S113-C · lote 0).
 *
 * Molde exacto de `lib/despensa/carrito.ts` y `lib/pendientes-adopcion.ts`:
 * estado de módulo + `useSyncExternalStore`. **Es el precedente de la casa
 * para estado que vive en el shell**, y acá hace falta porque Nexo tiene que
 * saber tres cosas en CUALQUIER pantalla: si el hogar es memorial, cuántas
 * mascotas hay, y si la de turno es un acuario.
 *
 * ── EL COSTO, DECLARADO ─────────────────────────────────────────────────────
 * Es **una lectura más al arrancar** (estado de onboarding + mascotas), y se
 * declara porque `D-497` mide el piso de performance de esta app. Lo que NO
 * hace: **no se pide por pantalla**. Medido: hoy hay **más de diez** pantallas
 * que repiten `getEstadoOnboardingDueno` + `obtenerMascotasDeFamilia`; ésta es
 * **una por sesión**, y el día que alguien quiera cobrar ese ahorro, este
 * módulo ya es el lugar donde vive la respuesta.
 *
 * ⚠️ **`null` = todavía no contestó, y NO se colapsa a `[]`.** Un hogar que
 * carga y un hogar sin mascotas activas se dibujan distinto (§2.3): el primero
 * conserva la burbuja, el segundo la conserva **por memorial**. Son dos
 * hechos con la misma pinta y por eso el tipo los separa.
 *
 * ⚠️ **UN FALLO DE LECTURA DEJA EL VALOR DONDE ESTABA** (Ley 13, igual que
 * `recontarPendientes`): un `[]` por error de red diría «no tenés mascotas» y
 * apagaría la pata sobre una familia que tiene tres.
 */

import { useSyncExternalStore } from 'react';
import { getEstadoOnboardingDueno, obtenerMascotasDeFamilia, type MascotaResumen } from '@epetplace/api';

let mascotas: MascotaResumen[] | null = null;
const oyentes = new Set<() => void>();

function emitir(lista: MascotaResumen[]): void {
  mascotas = lista;
  for (const o of oyentes) o();
}

function suscribir(o: () => void): () => void {
  oyentes.add(o);
  return () => oyentes.delete(o);
}

const leer = (): MascotaResumen[] | null => mascotas;

/** Las mascotas del hogar, reactivas. `null` mientras no se sabe. */
export function useHogarVivo(): MascotaResumen[] | null {
  return useSyncExternalStore(suscribir, leer, leer);
}

/** Relee del servidor. **Silencioso: si falla, el valor no se mueve.** */
export async function recargarHogar(): Promise<void> {
  const estado = await getEstadoOnboardingDueno();
  if (!estado.ok || !estado.data.tiene_familia || estado.data.familia_id === null) return;
  const r = await obtenerMascotasDeFamilia(estado.data.familia_id);
  if (!r.ok) return;
  emitir(r.data);
}
