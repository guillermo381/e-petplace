/** Stub de `expo-task-manager`: captura la tarea definida en global scope
 *  para poder invocarla a mano (el camino headless de D-595). */

type TareaFn = (arg: { data?: unknown; error?: { message: string } | null }) => void | Promise<void>;

export const tareas = new Map<string, TareaFn>();

export function defineTask(nombre: string, fn: TareaFn): void {
  tareas.set(nombre, fn);
}
