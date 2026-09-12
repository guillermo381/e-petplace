/**
 * CENSO DE ASYNCSTORAGE DESDE ADENTRO — `D-1074`.
 *
 * 🔴 POR QUÉ EXISTE: el APK de producción **no es `debuggable`**, así que
 *    `adb run-as` no puede leer `databases/RKStorage`. *El binario nos impide
 *    medir por primera vez en toda la sesión* — y la evidencia de los cinco
 *    episodios se borra en cuanto alguien desinstale.
 *
 *    ⇒ **la app se mide a sí misma y lo dice por el log.** Viaja por OTA, no
 *    necesita build nativa, y corre sobre el teléfono que TIENE el defecto.
 *
 * 🔴 NO LEE LOS VALORES DE UNA: `getAllKeys` es barato; traer todo junto sobre
 *    un almacenamiento de decenas de megas **provocaría el OOM que vino a
 *    diagnosticar**. Va por tandas de 50 y **nunca retiene los valores**: suma
 *    el largo y los suelta.
 *
 * ⚠️ Y NO IMPRIME NINGÚN VALOR, sólo claves y tamaños: la sesión de Supabase
 *    vive acá y su valor es una credencial. *Un diagnóstico que filtra un token
 *    al logcat cambia un defecto por otro peor.*
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const TANDA = 50;

/** Recorta la clave para el log: prefijo reconocible, sin ids completos. */
function prefijo(k: string): string {
  return k.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, '<uuid>').slice(0, 48);
}

export async function censarAlmacenamiento(): Promise<void> {
  try {
    const claves = await AsyncStorage.getAllKeys();
    console.log(`[censo-storage] claves=${claves.length}`);

    let total = 0;
    const porPrefijo = new Map<string, { n: number; bytes: number }>();
    const mayores: Array<{ k: string; b: number }> = [];

    for (let i = 0; i < claves.length; i += TANDA) {
      const pares = await AsyncStorage.multiGet(claves.slice(i, i + TANDA));
      for (const [k, v] of pares) {
        const b = v === null ? 0 : v.length;
        total += b;
        const p = prefijo(k);
        const a = porPrefijo.get(p) ?? { n: 0, bytes: 0 };
        porPrefijo.set(p, { n: a.n + 1, bytes: a.bytes + b });
        mayores.push({ k: p, b });
      }
      /* Se ordena y recorta EN CADA TANDA: guardar los pares de todas las
         tandas para ordenar al final sería retener el almacenamiento entero en
         memoria, que es justo lo que no se puede hacer acá. */
      mayores.sort((x, y) => y.b - x.b);
      mayores.length = Math.min(mayores.length, 10);
    }

    console.log(`[censo-storage] TOTAL=${(total / 1048576).toFixed(2)}MB en ${claves.length} claves`);
    for (const m of mayores) {
      console.log(`[censo-storage] mayor ${(m.b / 1024).toFixed(1)}KB · ${m.k}`);
    }
    const grupos = [...porPrefijo.entries()].sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 10);
    for (const [p, g] of grupos) {
      console.log(`[censo-storage] grupo ${(g.bytes / 1024).toFixed(1)}KB · n=${g.n} · ${p}`);
    }
  } catch (e) {
    /* Que el censo falle NO puede tumbar la app: es un diagnóstico. */
    console.log(`[censo-storage] no se pudo censar: ${String(e).slice(0, 160)}`);
  }
}
