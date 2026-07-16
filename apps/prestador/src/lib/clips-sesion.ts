/**
 * clips-sesion.ts — la cola LOCAL de clips de la sesión de adiestramiento
 * (S63-B, MODELO_ADIESTRAMIENTO §5/§12.3).
 *
 * TECHO v1 FIRMADO (§12.3, cerrado): clips de 15–30 segundos, máximo 3
 * por sesión. La compresión es EN CAPTURA (CameraView 720p + bitrate
 * acotado) — jamás post-proceso server.
 *
 * COLA CONECTADA (tanda corta S63-B): el stub murió — "Usar clip" en
 * una sesión REAL sube al bucket adiestramiento-clips y registra
 * (subir-clip.ts, dos pasos). Los estados dicen la verdad de cada
 * clip: 'registrado' ya está en el parte del dueño; 'en_dispositivo' /
 * 'error' siguen SOLO en este teléfono y la voz honesta lo declara
 * (retiro condicional, patrón "pantalla encendida").
 *
 * Estado de módulo (no React): sobrevive a navegar dentro del proceso;
 * muere con la app — coherente con "captura jamás exigida al cierre"
 * (§12.6): un clip perdido no bloquea nada.
 */

export const CLIP_MIN_S = 15;
export const CLIP_MAX_S = 30;
export const CLIPS_MAX = 3;

export type EstadoClip = 'en_dispositivo' | 'subiendo' | 'registrado' | 'error';

export interface ClipLocal {
  uri: string;
  duracionS: number;
  estado: EstadoClip;
  /** Subida hecha, registro pendiente: el reintento salta al paso 2. */
  storagePath?: string;
}

const colas = new Map<string, ClipLocal[]>();

export function clipsDeSesion(sesionId: string): ClipLocal[] {
  return [...(colas.get(sesionId) ?? [])];
}

/** false = techo alcanzado (la pantalla ya no debería ofrecer grabar). */
export function agregarClip(sesionId: string, clip: { uri: string; duracionS: number }): boolean {
  const cola = colas.get(sesionId) ?? [];
  if (cola.length >= CLIPS_MAX) return false;
  colas.set(sesionId, [...cola, { ...clip, estado: 'en_dispositivo' }]);
  return true;
}

export function quitarClip(sesionId: string, uri: string): void {
  const cola = colas.get(sesionId) ?? [];
  colas.set(
    sesionId,
    cola.filter((c) => c.uri !== uri),
  );
}

export function actualizarClip(sesionId: string, uri: string, cambios: Partial<ClipLocal>): void {
  const cola = colas.get(sesionId) ?? [];
  colas.set(
    sesionId,
    cola.map((c) => (c.uri === uri ? { ...c, ...cambios } : c)),
  );
}
