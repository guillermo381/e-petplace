/**
 * clips-sesion.ts — la cola LOCAL de clips de la sesión de adiestramiento
 * (S63-B, MODELO_ADIESTRAMIENTO §5/§12.3).
 *
 * TECHO v1 FIRMADO (§12.3, cerrado): clips de 15–30 segundos, máximo 3
 * por sesión. La compresión es EN CAPTURA (CameraView 720p + bitrate
 * acotado) — jamás post-proceso server.
 *
 * PUNTO DE SUBIDA = STUB DECLARADO (pedido S63-B, dependencia declarada):
 * el bucket propio de video (límite de tamaño, MIME declarado) es un
 * PEDIDO SQL A LA SESIÓN A — hasta que exista, los clips viven en esta
 * cola local (estado 'en_dispositivo') y la pantalla LO DECLARA con voz
 * honesta. Cuando el bucket llegue, la subida se conecta en una tanda
 * corta calcando subir-evidencia.ts (dos pasos, huérfano recuperable).
 *
 * Estado de módulo (no React): sobrevive a navegar dentro del proceso;
 * muere con la app — coherente con "captura jamás exigida al cierre"
 * (§12.6): un clip perdido no bloquea nada.
 */

export const CLIP_MIN_S = 15;
export const CLIP_MAX_S = 30;
export const CLIPS_MAX = 3;

export interface ClipLocal {
  uri: string;
  duracionS: number;
  /** El envío espera el bucket de la A — único estado v1. */
  estado: 'en_dispositivo';
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
