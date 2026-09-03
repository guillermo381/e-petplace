/* CENSO · MÓDULOS QUE RESUELVEN POR HOISTING SIN ESTAR DECLARADOS.
 *
 * ── EL RESULTADO, medido en S112-C (2-sep-2026) ────────────────────────────
 * **CERO nativos sin declarar en las dos apps**, salvo `expo-modules-core`,
 * que es transitiva de `expo` y está garantizada en todo runtime Expo.
 * La población de la clase era **UNA**: `expo-clipboard` en el prestador —
 * creada y curada en el mismo commit.
 *
 * ⭐ **Y su verde está probado en ROJO** (control positivo, corrido antes de
 * confiar en el número): sacando la declaración recién agregada, el censo
 * dice `🔴 expo-clipboard — declarado en cliente (~57.0.1): hoisting`.
 * *Un censo que devuelve cero no vale nada hasta que produce su rojo sobre
 * un caso conocido.*
 *
 * ⚠️ LO QUE NO VE, declarado: un módulo declarado en la app pero **no
 * horneado en el APK instalado** (versión vieja del binario). Eso no lo
 * contesta el repo — lo contesta el aparato. Este censo mide DECLARACIÓN,
 * jamás presencia en el binario.
 *
 * La clase: un paquete NATIVO importado por una app que NO lo declara en su
 * package.json resuelve igual —pnpm lo hoistea a la raíz— ⇒ compila, corre
 * en dev, pasa los cuatro typechecks... y el APK no lo tiene.
 *
 * El instrumento: los imports REALES del código de cada app contra sus
 * dependencias DECLARADAS. No mira node_modules a propósito: node_modules es
 * justo lo que miente (ahí está todo, venga de donde venga). */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

/**
 * Nativos que se toleran sin declarar, **cada uno con su razón**. Una entrada
 * sin razón es una excepción que nadie puede auditar después.
 */
const TOLERADOS = new Set([
  // transitiva de `expo` y garantizada en todo runtime Expo: ninguna app la
  // declara y **ninguna debería** — declararla fijaría una versión que el SDK
  // ya resuelve.
  'expo-modules-core',
]);

const APPS = ['cliente', 'prestador'];
/* NATIVO = trae código de plataforma ⇒ exige build. El resto viaja por OTA.
   La lista es de FORMA, no de nombres: todo `expo-*` y `react-native-*` es
   candidato salvo los que son JS puro y están declarados como excepción. */
const JS_PURO = new Set(['react-native-web', 'react-native-url-polyfill', 'expo-router', 'expo-constants']);
const esNativo = (m) =>
  (m.startsWith('expo-') || m.startsWith('react-native-') || m === 'expo' || m.startsWith('@react-native')) &&
  !JS_PURO.has(m);

let hallazgos = 0;
for (const app of APPS) {
  const pkg = JSON.parse(readFileSync(`apps/${app}/package.json`, 'utf8'));
  const declaradas = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]);
  const crudo = execSync(
    `grep -rhoE "from '(@?[a-z0-9@/-]+)'|require\\('(@?[a-z0-9@/-]+)'\\)" apps/${app}/src || true`,
  ).toString();
  const usados = new Set();
  for (const l of crudo.split('\n')) {
    const m = l.match(/'(.+)'/);
    if (!m || m[1].startsWith('.') || m[1].startsWith('@/')) continue;
    // el paquete, no la subruta: `expo-foo/bar` → `expo-foo` (y `@a/b/c` → `@a/b`)
    const p = m[1].split('/');
    usados.add(m[1].startsWith('@') ? `${p[0]}/${p[1]}` : p[0]);
  }
  const huerfanos = [...usados]
    .filter((m) => esNativo(m) && !declaradas.has(m) && !TOLERADOS.has(m))
    .sort();
  console.log(`\n── ${app}: ${usados.size} paquetes usados · ${declaradas.size} declarados`);
  if (huerfanos.length === 0) console.log('   ✅ cero nativos sin declarar');
  else {
    hallazgos += huerfanos.length;
    for (const h of huerfanos) {
      const otra = APPS.find((a) => a !== app);
      const enLaOtra = JSON.parse(readFileSync(`apps/${otra}/package.json`, 'utf8')).dependencies?.[h];
      console.log(`   🔴 ${h}  —  ${enLaOtra ? `declarado en ${otra} (${enLaOtra}): hoisting` : 'no está en ninguna app'}`);
    }
  }
}
console.log(`\n${hallazgos === 0 ? '✅' : '🔴'} TOTAL fuera de declaración: ${hallazgos}`);

/* ═══ S112-A · DE CENSO A GATE ═══════════════════════════════════════════════
   🔴 **Salía con exit 0 SIEMPRE**, así que como gate habría dicho que sí pase
   lo que pase — *un guard cuyo silencio no se distingue de su verde no es un
   guard*. Ahora corta.

   Y por eso hizo falta la lista de TOLERADOS: sin ella el gate salía rojo hoy
   mismo sobre `expo-modules-core`, que **todos aceptamos**. Es `L-488` en su
   forma operativa: *el censo nombra los casos y los clasifica quien conoce la
   letra* — **la clasificación se escribe, no se deja en la cabeza del que
   corrió el censo**.

   ⚠️ **LO QUE ESTE GATE NO VE, DECLARADO — son TRES, no una:**
   ① **No abre el APK.** Un módulo declarado y ausente del binario le pasa por
      al lado; eso lo mide `verify-manifest-apk`.
   ② 🔴 **Sólo escanea `apps/<app>/src`.** Un nativo que una app usa **a través
      de `packages/ui`** es invisible acá — y ésa es la ruta de la mayoría de
      las piezas de la casa. *Su verde dice «ninguna app importa un nativo sin
      declararlo DIRECTAMENTE», jamás «el APK los tiene todos».*
   ③ Un paquete declarado y **no importado por nadie** tampoco se ve: no es su
      pregunta, pero conviene saberlo antes de leer un verde como limpieza.

   🔴 **Y su rojo se probó, con un control que primero salió MAL:** el primer
   intento quitó `expo-image-picker` y el gate siguió verde — porque **ese
   paquete no se importa en ningún código, sólo se declara**. *El instrumento
   tenía razón y el control estaba mal.* Repetido con `expo-image`, que sí se
   importa en 11 archivos: **exit 1, con el nombre del paquete y de dónde
   viene el hoisting.* */
process.exit(hallazgos === 0 ? 0 : 1);
