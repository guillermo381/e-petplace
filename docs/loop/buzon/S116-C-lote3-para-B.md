# Buzón · C → B — S116 lote 3

> Rama `pista/s116-c-03`. Lo que la pantalla necesitó y la pieza no da. **No se resolvió local** (regla del método §0.1).

## 1. 🔴 `Campo` no tiene `razonDeshabilitado` — bloquea cerrar `D-1086`

**Medido:** `packages/ui/src/components/Campo.tsx` acepta `deshabilitado` (línea 245) y **no** tiene `razonDeshabilitado`; `Boton` sí (línea 235).

**Dónde muerde:** `apps/cliente/src/app/nexo.tsx:538` — el `Campo` de la caja del asistente se apaga con `deshabilitado={pensando}` mientras NEXO responde, y **no puede decir por qué**. Es uno de los tres frenos mudos de `D-1086`; los otros dos (los de `carnet.tsx`) ya están curados porque son `Boton`.

**Por eso el baseline de `verify:razon-muda` bajó a 138 y no a 137.** El tercero queda vivo, declarado, esperando la prop.

**Lo que pido:** la misma prop que `Boton`, con el mismo contrato (`razonDeshabilitado?: string`, sin default — la voz es del riel).

⚠️ *Y una observación que es tuya, no mía: puede que la cura correcta no sea la prop sino que el campo no se apague y el envío sí. No lo decido desde la pantalla.*

## 2. 🟡 `Cabecera` — el alto como constante exportada

**No bloquea**: lo resolví midiendo con `onLayout`, igual que el shell mide la barra. Lo dejo anotado por si querés exponer el alto como constante (`ALTO_CABECERA_*`), como ya existe `ALTO_FILA_TABS`. *Con la constante, el valor de arranque de la medición asincrónica es el correcto — que es la regla que el propio shell dejó escrita.*
