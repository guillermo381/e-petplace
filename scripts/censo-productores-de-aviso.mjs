#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ☠️ LÁPIDA · censo:productores-de-aviso — JUBILADO el 8-sep-2026 (S114-E)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **Lo reemplaza `scripts/s114/verify-aviso-emitio-sin-productor.mjs`
 * (`pnpm censo:productores-de-aviso`), que es la FUENTE ÚNICA.**
 *
 * ── POR QUÉ MUERE, y no es que estuviera mal ─────────────────────────────
 * Este censo nació para curar un ciego declarado del de A: **medía productores
 * por LITERAL en el cuerpo de una función y no veía a los que emiten POR DATO**
 * (una fila de catálogo, no una línea de código). Su aporte fue el **barrido
 * genérico de las 1.407 columnas de texto de `public`**, que encuentra un
 * productor-por-dato **sin saber de antemano qué catálogo mirar**.
 *
 * **Ese aporte ya vive adentro del gate de A** — verificado leyendo su código,
 * no su mensaje: tiene el barrido por lotes, el reintento por conexión, el
 * discriminador causal contra la puerta única de emisión, el control del caso
 * conocido y la clasificación de «contienen el código pero no lo emiten».
 * Su propia cabecera nombra a los dos. ⇒ **no queda parte aditiva que acotar:
 * es redundancia entera.**
 *
 * ── POR QUÉ NO SE DEJA CONVIVIENDO ───────────────────────────────────────
 * Los dos publicaban números distintos sobre lo mismo — este decía «12 sin
 * productor» contando los que **nunca emitieron**, y el de A los separa bien
 * (deuda `D-673`, no rojo). **Dos instrumentos que miden lo mismo y publican
 * números distintos es peor que uno solo:** el que lee elige, sin saber que
 * está eligiendo.
 *
 * ── POR QUÉ EL ARCHIVO SE QUEDA, Y SALE 2 ────────────────────────────────
 * *Un puente que sobrevive a su río manda al próximo a construir otro*
 * (`L-395`). Borrarlo dejaría el nombre libre para que alguien lo reinvente sin
 * enterarse de que la pregunta ya tiene dueño. **Sale 2 —no 0— porque un
 * jubilado que devuelve verde se lee como una medición que pasó.**
 */
console.error('☠️ censo:productores-de-aviso está JUBILADO (S114-E, 8-sep-2026).');
console.error('');
console.error('   Lo reemplaza, y es la FUENTE ÚNICA:');
console.error('     pnpm censo:productores-de-aviso');
console.error('     scripts/s114/verify-aviso-emitio-sin-productor.mjs');
console.error('');
console.error('   Su aporte —el barrido genérico de las columnas de texto de `public`,');
console.error('   que encuentra un productor-por-dato sin saber qué catálogo mirar— ya');
console.error('   está adentro de ese gate, junto con el discriminador y sus controles.');
console.error('   No quedó parte aditiva: era redundancia entera.');
console.error('');
console.error('   Sale 2 y no 0 a propósito: un jubilado en verde se lee como una');
console.error('   medición que pasó.');
process.exit(2);
