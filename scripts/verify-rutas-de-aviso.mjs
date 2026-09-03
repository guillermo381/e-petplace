#!/usr/bin/env node
/**
 * verify:rutas-de-aviso — LA LISTA BLANCA SE DERIVA DE LO QUE EL SERVIDOR PUEDE
 * EMITIR, NO DE LO QUE SE VIO LLEGAR.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 POR QUÉ EXISTE, con su costo medido (S112, 2-sep-2026).
 *
 * Las apps filtran la `ruta` de una push contra una lista blanca. Esa lista se
 * escribió a partir de lo que se había OBSERVADO llegar — y lo observado era
 * cero, porque ningún productor había corrido todavía. **De ahí salió una lista
 * que dejaba afuera a guardería**, cuyo productor (`_guarderia_aplicar_acto`)
 * emite `/guarderia/<estadiaId>` en código vivo desde antes.
 *
 * *Una ruta emitible que ninguna app acepta no falla en el servidor ni deja
 * error: la push llega, la persona toca, y no pasa nada.* Del lado del usuario
 * es indistinguible de una app colgada; del lado del log es una línea que nadie
 * lee.
 *
 * ⇒ **Este gate mueve esa falla del TOQUE al COMMIT.**
 *
 * ── POR QUÉ VIVE DEL LADO SERVIDOR ────────────────────────────────────────
 * Porque el que sabe qué es emitible es el motor. Preguntárselo a la app sería
 * preguntarle justamente al que no puede saberlo — que es el defecto que este
 * gate viene a cerrar, no a mudar de archivo.
 *
 * ── SALIDAS ───────────────────────────────────────────────────────────────
 *   0 — verde: toda ruta emitible está aceptada por alguna app.
 *   1 — ROJO: hay rutas emitibles que ninguna app acepta (o cruzadas).
 *   2 — FUENTE AUSENTE: falta algo de AFUERA (una lista que no está o no
 *       parsea). No es culpa de quien commitea y puede ser un estado
 *       transitorio del repo ⇒ el hook avisa y **deja pasar**.
 *   3 — 🔴 EL INSTRUMENTO NO ENTIENDE LO QUE VE: el censo salió vacío, el
 *       control positivo cayó, o **hay un productor que emite una ruta en una
 *       forma que el extractor no sabe leer**. ⇒ el hook **FRENA**.
 *
 * 🔴 POR QUÉ 2 Y 3 SON DISTINTOS, y no es prolijidad: **«no encuentro tu
 *    archivo» y «encontré algo que no entiendo» son dos hechos opuestos.** El
 *    primero es una ausencia; el segundo es un HALLAZGO — el gate viendo un
 *    productor nuevo cuya ruta no puede clasificar. Dejarlo pasar con un aviso
 *    sería *omitir en silencio lo que no se conoce*, que es exactamente el
 *    defecto que este gate y la purga de adopción existen para matar. **Un gate
 *    que se calla ante lo que no entiende deja de proteger sin decirlo, y su
 *    silencio se lee como salud.**
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { readFileSync, existsSync } from 'node:fs';
import { dbQuery } from './lib-db.mjs';

/* Alias con nombre propio: deja a la vista que ESTA llamada es la que puede
   no tener base, y que su fallo es «no pude mirar», no «encontré algo». */
const dbQueryRutas = dbQuery;

/* `RUTAS_BASE` existe SÓLO para poder ejercer este gate contra copias de las
   listas antes de que estén mergeadas — no es configuración de producción. Sin
   ella se leen del repo, que es lo que corre en el hook. *Un gate que no se
   puede ejercer antes de que su fuente exista no se puede probar en rojo.* */
const BASE = process.env.RUTAS_BASE ?? '.';
const LISTAS = {
  cliente: `${BASE}/apps/cliente/src/lib/destino-de-push.ts`,
  prestador: `${BASE}/apps/prestador/src/lib/destino-de-push.ts`,
};

/* 🔴 EL CONTROL POSITIVO, Y NO COMPARTE EL SUPUESTO DEL EXTRACTOR.
   Este valor NO salió de correr el extractor: salió de leer a mano el cuerpo de
   `_guarderia_aplicar_acto` (su línea `'ruta', '/guarderia/' || p_estadia_id`,
   verificada como código y no como comentario). Si el regex de abajo se rompe o
   se vuelve más angosto, este control cae y el gate sale NO CONCLUYENTE en vez
   de verde por no haber encontrado nada. *Una auto-prueba que se apoya en lo
   que el propio extractor produjo no verifica el instrumento: lo duplica.* */
const CONTROL_POSITIVO = '/guarderia/';

const salir = (codigo, ...lineas) => { for (const l of lineas) console.log(l); process.exit(codigo); };

// ── ① EL CENSO DEL SERVIDOR: qué rutas PUEDE emitir el motor ───────────────
function censarEmitibles() {
  /* 🔴 S112-A · SIN BASE, ESTE GATE NO PUEDE MEDIR — y hasta hoy salía 1.
     `lib-db` LANZA en un worktree sin linkear, y una excepción no atrapada da
     exit 1 ⇒ el hook lo leía como *«UNA PUSH LLEVA A NINGUNA PARTE»*, que **no
     es lo que pasó**. Medido por C: `s112-d` y `s112-e` tienen link, `s112-b`
     y `s112-c` no ⇒ B iba a chocar con esto y a leer que tiene una ruta
     huérfana.

     *Un gate que acusa de otra cosa es peor que uno que no corre: manda a
     curar lo que no está roto.* Su propia cabecera lo dice — **un gate que no
     puede medir no se pone en el hook, se declara** — y hoy se ponía sin
     declararse. Sale **2**, que el hook ya sabe tratar: avisa y deja pasar. */
  let filas;
  try {
    filas = dbQueryRutas(`
    SELECT p.proname, p.prosrc
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND (
         (p.prosrc LIKE '%registrar_intencion_notificacion%' AND p.prosrc LIKE '%''ruta''%')
         OR p.proname LIKE '%\\_ruta'
       )
       AND p.proname <> 'registrar_intencion_notificacion'
     ORDER BY p.proname;`);
  } catch (e) {
    salir(2, `NO CONCLUYENTE · no se pudo consultar la base: ${String(e).slice(0, 120)}`,
      '   (no es que haya una ruta huérfana: es que este árbol no puede mirar el motor.',
      '    Un worktree sin `supabase link` no ve `pg_proc`. El commit SIGUE.)');
  }

  const rutas = new Map();          // ruta -> [funciones]
  const mudos = [];                 // productores que hablan de ruta y no rindieron ninguna
  for (const { proname, prosrc } of filas) {
    const halladas = new Set();
    /* Forma (a): la ruta inline al lado de su clave — `'ruta', '/x/' || id`. */
    for (const m of prosrc.matchAll(/'ruta'\s*,\s*'(\/[^']*)'/g)) halladas.add(m[1]);
    /* Forma (b): un CONSTRUCTOR de rutas (`%_ruta`) — sus literales de ruta. */
    if (/_ruta$/.test(proname)) {
      for (const m of prosrc.matchAll(/'(\/[^']*)'/g)) halladas.add(m[1]);
    }
    for (const r of halladas) {
      if (!rutas.has(r)) rutas.set(r, []);
      rutas.get(r).push(proname);
    }
    /* 🔴 EL PUNTO CIEGO SE VUELVE RUIDOSO. Un productor que nombra `'ruta'` y
       del que no se pudo extraer ninguna es exactamente el caso que este gate
       no puede ver — y callarlo lo volvería un gate que da verde por no mirar.
       *Un censo por patrón acota; lo que lo hace cerrar es negarse a devolver
       nada sobre algo que evidentemente existe.* */
    /* Forma (c): el productor DELEGA en un constructor (`'ruta', _x_ruta(...)`).
       No es mudo: sus rutas se censan en la función que las arma. Medido con el
       caso real — los emisores de adopción tienen exactamente esta forma, así
       que sin esta rama el gate diría NO CONCLUYENTE el día que se apliquen. */
    const delega = /'ruta'\s*,\s*(?:public\.)?\w*_ruta\s*\(/.test(prosrc);
    if (halladas.size === 0 && /'ruta'/.test(prosrc) && !/_ruta$/.test(proname) && !delega) {
      mudos.push(proname);
    }
  }
  return { rutas, mudos };
}

// ── ② LO ACEPTADO: las listas blancas de las apps ──────────────────────────
function leerLista(ruta) {
  if (!existsSync(ruta)) return null;
  const txt = readFileSync(ruta, 'utf8');
  const bloque = txt.match(/DESTINOS_DE_PUSH[^=]*=\s*\[([\s\S]*?)\]/);
  if (!bloque) return null;
  return [...bloque[1].matchAll(/'(\/[^']*)'/g)].map((m) => m[1]);
}

// ── ③ LA COMPARACIÓN ───────────────────────────────────────────────────────
function main() {
  const rojoSintetico = process.argv.includes('--probar-rojo');

  const NO_ENTIENDE = 3;   // hallazgo del instrumento ⇒ frena
  const listas = {};
  for (const [app, ruta] of Object.entries(LISTAS)) {
    const l = leerLista(ruta);
    if (l === null) {
      salir(2, `NO CONCLUYENTE · no se pudo leer la lista blanca de ${app}: ${ruta}`,
               '  (¿todavía no está mergeada? el gate no da verde sin sus dos fuentes)');
    }
    if (l.length === 0) {
      salir(2, `NO CONCLUYENTE · la lista de ${app} parseó VACÍA.`,
               '  Con una lista vacía "todo estaría rechazado" y el verde sería por no mirar.');
    }
    listas[app] = l;
  }

  const { rutas, mudos } = censarEmitibles();
  if (mudos.length) {
    salir(NO_ENTIENDE, '🔴 EL EXTRACTOR NO ENTIENDE UN PRODUCTOR · nombra `ruta` y no se pudo leer cuál:',
             ...mudos.map((f) => `  · ${f}`),
             '  Se declara en vez de ignorarse: un punto ciego callado da verde por no mirar.');
  }
  if (rutas.size === 0) {
    salir(NO_ENTIENDE, '🔴 EL CENSO DEL SERVIDOR SALIÓ VACÍO · ninguna ruta emitible.',
             '  Con cero rutas la comparación pasa por vacío. El extractor está roto.');
  }
  if (rojoSintetico) {
    /* Ejercita la CADENA de extracción, no sólo la comparación: se le da al
       extractor un cuerpo con la forma real de un productor. */
    const sintetico = "PERFORM registrar_intencion_notificacion(..., jsonb_build_object('ruta', '/inventada/' || x), ...)";
    const halladas = [...sintetico.matchAll(/'ruta'\s*,\s*'(\/[^']*)'/g)].map((m) => m[1]);
    if (halladas.length !== 1) {
      salir(NO_ENTIENDE, '🔴 la prueba de rojo no pudo extraer su propia ruta sintética.');
    }
    rutas.set(halladas[0], ['(sintética · --probar-rojo)']);
  }
  if (!rutas.has(CONTROL_POSITIVO)) {
    salir(NO_ENTIENDE, `🔴 EL CONTROL POSITIVO CAYÓ · el censo NO encontró ${CONTROL_POSITIVO}.`,
             '  Ese valor se leyó A MANO del cuerpo de `_guarderia_aplicar_acto`, no del extractor.',
             '  Si no aparece, lo que está roto es el extractor — no el mundo.');
  }

  const aceptadas = new Set([...listas.cliente, ...listas.prestador]);
  const acepta = (r) => [...aceptadas].some((a) => r === a || r.startsWith(a) || a.startsWith(r));

  const huerfanas = [...rutas.keys()].filter((r) => !acepta(r));
  const cruzadas = listas.cliente.filter((r) => listas.prestador.includes(r));

  console.log(`rutas emitibles: ${rutas.size} · aceptadas por las apps: ${aceptadas.size}`);
  if (huerfanas.length === 0 && cruzadas.length === 0) {
    salir(0, `verify:rutas-de-aviso VERDE · ${rutas.size} emitibles, todas con destino.`);
  }
  const lineas = ['verify:rutas-de-aviso ROJO'];
  for (const r of huerfanas) {
    lineas.push(`  · EMITIBLE Y SIN DESTINO: ${r}  (la emite: ${rutas.get(r).join(', ')})`);
    lineas.push('    ⇒ la push va a llegar, la persona va a tocar, y no va a pasar nada.');
  }
  for (const r of cruzadas) {
    lineas.push(`  · EN LAS DOS LISTAS: ${r} — cada app la llevaría a una pantalla distinta.`);
  }
  salir(1, ...lineas);
}

main();
