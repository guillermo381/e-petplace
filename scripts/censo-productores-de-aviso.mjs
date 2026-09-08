#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * censo:productores-de-aviso — S114-E · el ciego que A declaró, curado
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **El ciego, con las palabras de A** (`S114-A-RELEVAMIENTO` §5):
 * *«Mi censo mide productores por LITERAL en el cuerpo de una función, y eso
 * no ve a los que emiten POR DATO.»* `guarderia_entregada` y
 * `guarderia_no_recogida` salieron «SIN PRODUCTOR» **y tienen intenciones
 * reales**: su productor es `_guarderia_aplicar_acto`, que lee
 * `cat_guarderia_transiciones.tipo_notificacion` y emite lo que el catálogo
 * diga. **Su productor es una fila, no una línea.**
 *
 * ── CÓMO SE LE PREGUNTA AL OBJETO ─────────────────────────────────────────
 * No se busca la tabla que uno ya sabe que existe — eso mide la memoria del
 * que escribe el censo. Se recorren **TODAS las columnas de texto de todas las
 * tablas de `public`** y se pregunta cuáles CONTIENEN un código de
 * `cat_notificacion_tipos`. Una columna que guarda códigos de aviso **es** un
 * productor por dato, se llame como se llame y esté en la tabla que esté.
 *
 * 🔴 **Por qué no se filtra por nombre de columna:** filtrar por
 * `~* 'notificacion|aviso'` habría encontrado `tipo_notificacion` y habría
 * dado el mismo resultado **por casualidad**. Un censo atado a un nombre mide
 * la convención, no el hecho (`L-489` de la casa) — y la convención se rompe
 * en la primera tabla que llame `evento` a lo que otra llama `notificacion`.
 *
 * ── LOS DOS CENSOS CORREN JUNTOS, A PROPÓSITO ─────────────────────────────
 * El script reproduce **el censo por literal de A** y corre **el censo por
 * dato** en la misma pasada, y reporta la diferencia. *No se trata de
 * reemplazar el instrumento de A: se trata de medir cuánto no veía* — y eso
 * sólo se puede decir si los dos números salen de la misma corrida.
 *
 * ── LO QUE ESTE CENSO TAMPOCO VE, DECLARADO ───────────────────────────────
 * · **`jsonb`.** Sólo recorre `text`, `varchar` y `citext`. Un código de aviso
 *   guardado dentro de un `jsonb` de configuración **no lo encuentra**, y esta
 *   casa guarda mucha cosa en `jsonb`. *Acota, no cierra* — igual que el de A.
 * · **Un productor por dato cuya fila todavía no existe.** Si el catálogo está
 *   vacío, el tipo sale sin productor aunque el código sepa leerlo.
 * · **No prueba que el productor CORRA.** Prueba que existe quien podría
 *   emitirlo. El contador de intenciones es otra medición, y va al lado.
 *
 * Salida: tabla por tipo con `literal` · `dato` · `intenciones`, y el delta.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   ☠️ JUBILADO — S114-A ④ (adenda 14③). El censo duplicaba el cruce
   «emitió vs productor» que A ya tenía, y su parte aditiva —el barrido general
   por DATO de todas las columnas de texto + el discriminador causal— SE MUDÓ,
   ENTERA, a: scripts/s114/verify-aviso-emitio-sin-productor.mjs
   El instrumento consolidado se corre igual que antes: `pnpm censo:productores-de-aviso`.
   Este archivo queda de lápida: su razonamiento arriba es el registro de cómo se
   midió (los dos defectos del propio instrumento y el discriminador). No corre. */

console.error('☠️  JUBILADO — el censo vive en scripts/s114/verify-aviso-emitio-sin-productor.mjs');
console.error('   corré:  pnpm censo:productores-de-aviso');
process.exit(2);
