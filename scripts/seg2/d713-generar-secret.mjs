/**
 * D-713 · paso 1 — GENERAR Y SETEAR EL SECRETO DE DESPACHO.
 *
 * ── LA PREGUNTA DEL FOUNDER, CONTESTADA ANTES DE TOCAR ───────────────────────
 * *«¿Quién llama a cada despachador legítimamente y cómo va a autenticar
 * después de la cura? Si la cura pone un secreto que termina viajando en el
 * bundle, no es cura.»*
 *
 *   · **`despachar-push`** — lo llama **`pg_cron` job #8** (`despachar-push-tick`,
 *     cada minuto) por `net.http_post` DESDE LA BASE.
 *   · **`despachar-whatsapp`** — **no lo llama ningún job** (medido: los 7 jobs
 *     son 1,2,3,4,6,7,8 y ninguno lo nombra). Congelado; su llamador es el curl
 *     manual del retome.
 *
 * **Dónde vive el secreto después de la cura, y por qué NO llega al bundle:**
 *   ① en los **secrets de la edge function** (server-side, Supabase);
 *   ② en el **comando del cron job**, que vive en `cron.job` — y B3 midió que
 *      ese schema **no está expuesto por PostgREST** (404 a anónimo Y a
 *      autenticado) y tiene **cero grants** a roles de cliente.
 *
 * **El bundle no lo toca nunca:** la app no despacha, el cron sí. *Un secreto
 * que viaja al cliente no es un secreto — por eso el llamador es la base y no
 * la app.*
 *
 * El valor se genera acá, se setea y **no se transcribe** (R6): solo su huella.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { huella, linea, RAIZ } from './lib-seg2.mjs';

const ejecutar = promisify(execFile);
const secreto = randomBytes(24).toString('base64url'); // 32 chars

linea('\n══ D-713 · paso 1 — EL SECRETO ══\n');
linea(`  generado: ${huella(secreto)}`);

const { stdout } = await ejecutar(
  'npx',
  ['supabase', 'secrets', 'set', `DESPACHO_SECRET=${secreto}`, '--project-ref', 'zyltipqscdsdsxnjclhp'],
  { cwd: RAIZ, maxBuffer: 8 * 1024 * 1024 },
);
linea(`  ${stdout.trim().split('\n').pop()}`);

/**
 * Se deja en el scratchpad de la sesión —NO en el repo— para que el paso de la
 * migración del cron lo pueda leer. El archivo vive fuera del árbol versionado.
 */
const RUTA = '/private/tmp/claude-501/-Users-guillo381gmail-com-proyectos-ePetPlace-e-petplace/54d5cc9f-58fb-44a3-bbfb-fe9d556a7d77/scratchpad/despacho-secret.txt';
writeFileSync(RUTA, secreto);
linea(`\n  valor guardado FUERA del repo, en el scratchpad de la sesión.`);
linea('  (el repo nunca lo ve: .gitignore no hace falta porque está fuera del árbol)\n');
