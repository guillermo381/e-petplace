/**
 * D-717 · ¿ALGUIEN LLAMA A `chat-ayuda`? — medir antes de dar de baja.
 *
 * Orden del founder: **medir, no borrar**. Freno 3, y sin fuente en el repo un
 * borrado mal hecho no se deshace.
 *
 * Este script contesta el punto ② (¿la llama alguien desde el código?) barriendo
 * **todos** los repos y worktrees, no una lista escrita a mano — el censo de
 * `.env` de esta misma sesión ya se equivocó por usar una lista a mano y dejar
 * ocho worktrees afuera.
 *
 * Se buscan las CUATRO formas de invocar una edge function:
 *   · `functions.invoke('chat-ayuda')` (supabase-js)
 *   · la URL `/functions/v1/chat-ayuda`
 *   · el slug suelto `chat-ayuda`
 *   · `chat_ayuda` / `chatAyuda` (por si el nombre viaja en una constante)
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { guardarSeg2, linea } from './lib-seg2.mjs';

const ejecutar = promisify(execFile);
const BASE = '/Users/guillo381gmail.com/proyectos/ePetPlace';

// todos los repos git bajo ~/proyectos/ePetPlace, sin lista a mano
const repos = readdirSync(BASE, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(BASE, d.name, '.git')))
  .map((d) => join(BASE, d.name));

const PATRONES = ['chat-ayuda', 'chat_ayuda', 'chatAyuda'];
const hallazgos = [];

for (const repo of repos) {
  for (const p of PATRONES) {
    let salida = '';
    try {
      const { stdout } = await ejecutar('git', ['grep', '-n', '-I', '--', p], {
        cwd: repo,
        maxBuffer: 32 * 1024 * 1024,
      });
      salida = stdout;
    } catch {
      continue; // sin coincidencias
    }
    for (const l of salida.split('\n').filter(Boolean)) {
      const archivo = l.split(':')[0];
      const esInvocacion = /functions\.invoke|\/functions\/v1\//.test(l);
      const esDoc = /\.(md|txt)$/i.test(archivo);
      const esLaFuente = archivo.includes('supabase/functions/chat-ayuda');
      hallazgos.push({
        repo: repo.split('/').pop(),
        archivo,
        clase: esInvocacion ? 'INVOCACIÓN' : esLaFuente ? 'la fuente misma' : esDoc ? 'doc' : 'mención',
        linea: l.slice(0, 150),
      });
    }
  }
}

linea('\n══ D-717 · ¿QUIÉN LLAMA A `chat-ayuda`? ══\n');
linea(`  repos barridos: ${repos.length}  (todos los que tienen .git bajo ~/proyectos/ePetPlace)`);
for (const r of repos) linea(`     · ${r.split('/').pop()}`);

const invocaciones = hallazgos.filter((h) => h.clase === 'INVOCACIÓN');
linea(`\n  🔶 INVOCACIONES REALES: ${invocaciones.length}`);
for (const i of invocaciones) linea(`     · ${i.repo} · ${i.linea}`);
if (invocaciones.length === 0) linea('     (ninguna — nadie la llama desde ningún código versionado)');

const otras = hallazgos.filter((h) => h.clase !== 'INVOCACIÓN');
linea(`\n  otras menciones: ${otras.length}`);
const porClase = {};
for (const o of otras) (porClase[`${o.repo} · ${o.clase}`] ??= []).push(o.archivo);
for (const [k, v] of Object.entries(porClase)) {
  linea(`     ${k}: ${[...new Set(v)].length} archivo(s)`);
  for (const a of [...new Set(v)].slice(0, 4)) linea(`        ${a}`);
}

guardarSeg2('d717-chat-ayuda.json', { repos: repos.length, invocaciones, otras: otras.length });
linea('');
