#!/usr/bin/env node
/**
 * S109-A · EL TYPECHECK NO CORRE CIEGO A LAS RUTAS.
 *
 * `.expo/types/router.d.ts` lo GENERA Metro y está en `.gitignore`: **no viaja
 * con el merge.** En un worktree donde Metro nunca corrió no existe — y sin él
 * `tsc` **deja de medir las rutas de expo-router**: `router.replace(unString)`
 * compila y el typecheck sale **VERDE**.
 *
 * 🔴 **El verde no dice «las rutas están bien»: dice «no hay rutas que mirar».**
 * Un verde por ausencia del insumo es indistinguible de uno por corrección, y es
 * peor que un rojo porque nadie lo va a ir a buscar.
 *
 * ⚠️ **Lo caro no es el defecto: es la conversación que produce.** El síntoma no
 * es un error, es *«a mí me da verde»* — dos pistas discutiendo sobre un estado
 * que ninguna mide igual. **El 07-09 mordió a las TRES pistas** y `R63` ya lo
 * declaraba: *una advertencia dentro de la salida de un gate protege a quien lee
 * el gate, no a quien lee su verde.*
 *
 * ⇒ Por eso este guard **corre pegado al `tsc`**, no en un documento. Sale ROJO
 * antes de que `tsc` pueda mentir. Detalle y control negativo: `L-450`.
 */
import { existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const RUTA = '.expo/types/router.d.ts';
const app = basename(process.cwd());

if (!existsSync(resolve(process.cwd(), RUTA))) {
  process.stdout.write(
    `\n🔴 ${app}: falta ${RUTA} — es GENERADO y no está en git.\n` +
    `   Sin él \`tsc\` NO MIDE las rutas de expo-router y sale VERDE POR AUSENCIA.\n` +
    `   Un verde que no puede producir su rojo no es una medición (L-450).\n\n` +
    `   Curalo con UNA de las dos:\n` +
    `     npx expo start        # en apps/${app}, y cortá cuando termine de generar\n` +
    `     cp ../../<worktree-que-lo-tenga>/apps/${app}/${RUTA} ${RUTA}\n\n`,
  );
  process.exit(1);
}
