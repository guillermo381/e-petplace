/** Stub de `expo-location` para el discriminador de D-595. Solo lo que el
 *  módulo bajo prueba usa — y lleva la cuenta de arranques/paradas del
 *  servicio, que es justo lo que el defecto ② rompía. */

export const Accuracy = { High: 6 } as const;
export const ActivityType = { Fitness: 3 } as const;

export const espia = {
  corriendo: false,
  arranques: 0,
  paradas: 0,
  reset(): void {
    this.corriendo = false;
    this.arranques = 0;
    this.paradas = 0;
  },
};

export async function hasStartedLocationUpdatesAsync(_tarea: string): Promise<boolean> {
  return espia.corriendo;
}

export async function startLocationUpdatesAsync(_tarea: string, _opts: unknown): Promise<void> {
  espia.corriendo = true;
  espia.arranques += 1;
}

export async function stopLocationUpdatesAsync(_tarea: string): Promise<void> {
  espia.corriendo = false;
  espia.paradas += 1;
}
