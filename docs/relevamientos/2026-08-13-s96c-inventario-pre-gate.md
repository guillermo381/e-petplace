# INVENTARIO PRE-GATE · La despensa del vendedor, medida (13-ago, S96-C)

> **Una página, medida contra el objeto** (base viva + código en HEAD),
> con la cuenta que el founder va a usar: `guillo381+duenodes@gmail.com`.
> **Medido en base:** 0 filas de prestador · 0 vínculos de empleado ·
> cuenta `Despensa S97 (borrable)` ACTIVA · `seller_productos` activo ·
> 1 SKU `DES-CORD-1` aceptado con oferta publicada · 1 repartidor ·
> 1 recurso · 2 turnos · 1 pedido vivo. **Es el vendedor puro real** —
> la firma «sin fila fantasma» se cumple en los datos.

## 1 · Adherirse a un producto del maestro y cargarle stock

| Camino | Estado |
|---|---|
| **Ajustar stock de un SKU ya adherido** | ✅ **EXISTE Y FUNCIONA** — Pedidos → Stock: `DES-CORD-1` aparece; ajuste entraron/salieron con motivo obligatorio, por RPC |
| **Adherirse a un producto del maestro** (crear el vínculo, proponer precio) | ❌ **NO EXISTE EN LA APP.** La puerta del motor (`proponer_sku_vendedor`) existe y la usó la siembra — hoy la oferta solo nace por base (A/admin). Cero wrapper, cero pantalla (grep: la función solo vive en `database.types.ts`) |

## 2 · Proponer un producto nuevo

❌ **NO EXISTE EN LA APP.** Misma puerta de motor (crea el producto en
`propuesto` si no está en el maestro) — sin superficie ni wrapper. Si el
founder busca dónde proponer, no hay dónde: se dice acá y no con el dedo.

## 3 · Configurar el negocio — el vendedor puro, medido

| Qué | Estado |
|---|---|
| **Entrada** | ✅ El puro aterriza por Redirect en Pedidos como su casa (código en `(tabs)/_layout`; primera caminata en dispositivo es este gate) |
| **Datos fiscales + bancarios** | ✅ **ABRE SIN PRESTADOR** — Configuración → «Datos de facturación»: la cuenta resuelve por el brazo owner; fiscal y banco no tocan prestador |
| **Documentos** | ❌ **NO HAY CAMINO para el puro** — la sección de documentos exige prestador y LO DICE (ausencia declarada, no crash). Subir documentos de identidad del vendedor puro: no existe |
| **Nombre del negocio / perfil público** (descripción, logo, vitrina) | ❌ **NO EXISTE para el puro** — el perfil es del PRESTADOR (`v_prestadores_publicos`); el `nombre_comercial` se fija en el alta y no hay edición |
| ⚠️ **Efecto del Redirect** | El puro **no tiene tab Cuenta**: sin selector de idioma y **sin el pie del updateId** — la verificación del OTA (L-160) se hace con OTRA cuenta o por logcat, no con `duenodes`. Cerrar sesión vive en Configuración (a propósito) |

## 4 · Los cuartos de la configuración

| Cuarto | Estado |
|---|---|
| ⑥ Estado arriba + modal | ✅ VIVO («Activa» para duenodes) · «¿Qué significa?» al lado = 🟡 ANDAMIO (el chip tocable espera pieza de B) |
| ① Qué vendo (familias) | ❌ NO EXISTE — la activación por vendedor no tiene esquema (A-1). Cinco familias firmadas; el punto de inserción monta lo que el lector devuelva |
| ② Cómo entrego | ❌ NO EXISTE (A-2) |
| ③ Cobertura por radio | ❌ NO EXISTE (A-3) |
| ④ Cuándo — cortes | ✅ VIVO (2 turnos sembrados; lista + alta) · horarios de atención ❌ (A-4) |
| ⑤ Quién — repartidores | ✅ VIVO como PADRÓN (1 sembrado; alta por nombre/documento) = 🟡 ANDAMIO: la forma cambia a chip del equipo con la costura (A-5, ya destrabada: cuelga de la cuenta) |
| Capacidad por recurso | ✅ VIVO (1 recurso) |
| Contador «cuánto te falta» | ❌ NO EXISTE — sin ①②③ contaría aire (declarado) |

## 5 · La ley del cambio — dónde habla y dónde queda muda

- ✅ **HABLA en la Hoja del corte**: `duenodes` tiene un pedido vivo con
  ventana ⇒ el founder VA A VER la línea («El pedido ya prometido
  conserva su ventana…») antes del CTA.
- ✅ **HABLA en la Hoja de capacidad** si hay entregas prometidas hoy.
- ❌ **MUDA al apagar un repartidor** — falta el dato (envíos vivos por
  repartidor, A-8). La letra depositada además define que la baja queda
  pendiente y se cumple sola: ese comportamiento es del MOTOR y tampoco
  existe; hoy el toggle apaga sin voz ni diferimiento.
- Nota de letra: la ley depositada pide declarar «hasta cuándo»; la voz
  actual dice QUÉ queda comprometido (su ventana) sin fecha explícita —
  fino a ajustar cuando el founder la vea.

**En una línea: el DURANTE (panel, escalera, repartidor, stock) está
entero; del ANTES viven el estado, los cortes, los recursos y la ley del
cambio — y NO existen todavía: adherirse/proponer producto, familias,
método, radio, ni el perfil/documentos del vendedor puro.**
