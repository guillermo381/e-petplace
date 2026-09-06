/**
 * LA MATRIZ DEL QR — fuente única (S113-A · 1.3 · A5).
 *
 * Nace porque su segundo consumidor la iba a copiar. La edge `pasaporte` la
 * dibuja como SVG y PNG para la chapita; los PDF de la casa la dibujan como
 * rectángulos vectoriales. *Dos dibujos distintos del mismo dato: lo que se
 * comparte es la matriz, jamás el dibujo.*
 *
 * ── LA LIBRERÍA, MEDIDA ANTES DE ELEGIR ─────────────────────────────────────
 * `qrcode-generator@2.0.4` · **MIT** · **CERO dependencias** · 555 kB unpacked.
 * La alternativa (`qrcode@1.5.4`, también MIT) arrastra **tres** —`pngjs`,
 * `yargs`, `dijkstrajs`—, y en una edge cada dependencia es peso de arranque y
 * superficie. *Se eligió por el número de dependencias, no por popularidad.*
 *
 * ⚠️ **Sin red en tiempo de ejecución**: se importa por especificador npm, que
 * Deno resuelve al desplegar y queda dentro del bundle.
 *
 * ⚠️ **Cada edge lleva su propia copia de `_shared`**: tocar este archivo no
 * cambia nada hasta redesplegar CADA una de las edges que lo importan
 * (`pasaporte`, `documento-ficha-identidad`, `documento-carnet`).
 */
import qrcode from 'npm:qrcode-generator@2.0.4';

/**
 * La matriz del QR: `true` = módulo oscuro.
 *
 * Corrección **M** (~15 % de tolerancia a daño) y no la mínima **L**: esto se
 * imprime en una chapita que se raya contra una vereda y en un papel que se
 * dobla. *El nivel de corrección se elige por dónde va a vivir el código, no
 * por cuántos bytes ahorra.*
 */
export function matrizQr(texto: string): boolean[][] {
  const qr = qrcode(0, 'M');
  qr.addData(texto);
  qr.make();
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, f) =>
    Array.from({ length: n }, (_, c) => qr.isDark(f, c)));
}

/** El margen que el estándar pide. Sin él muchos lectores no enganchan. */
export const QUIET = 4;

/** La URL pública de un pasaporte. Vive acá para que los papeles y la edge
 *  del pasaporte no puedan escribirla distinto. */
export function urlPasaporte(token: string): string {
  return `${Deno.env.get('SUPABASE_URL') ?? ''}/functions/v1/pasaporte?t=${token}`;
}

/**
 * El token del pasaporte VIVO de una mascota, **si la familia dejó que salga
 * en los papeles**. Devuelve `null` en los tres casos que no son lo mismo y
 * dan el mismo resultado a propósito: no hay pasaporte · fue revocado · la
 * familia apagó `qr_en_papeles`.
 *
 * ⚠️ Corre con `service_role` porque la edge del papel ya corrió: quien pide
 * llegó con un token de documento de un solo uso, emitido desde la app CON
 * sesión. *La autorización ya pasó; acá sólo se resuelve un dato.*
 */
// deno-lint-ignore no-explicit-any
export async function tokenDePasaporteParaPapel(sb: any, mascotaId: string): Promise<string | null> {
  const { data } = await sb
    .from('pasaporte')
    .select('token')
    .eq('mascota_id', mascotaId)
    .is('revocado_en', null)
    .maybeSingle();
  if (!data?.token) return null;

  const { data: cfg } = await sb
    .from('pasaporte_config')
    .select('qr_en_papeles')
    .eq('mascota_id', mascotaId)
    .maybeSingle();
  // Sin fila de config rige el default de la columna: el QR sale.
  if (cfg && cfg.qr_en_papeles === false) return null;
  return data.token as string;
}
