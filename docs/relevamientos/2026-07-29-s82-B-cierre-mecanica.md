# S82-B · EL CIERRE DEL EJE MECÁNICA — packages/ui EXCLUSIVO

**Sesión B · 29-jul-2026.** Archivos declarados al abrir (76h):
`packages/ui/src/components/MapaRecorrido.{tsx,web.tsx,tipos.ts}` ·
`scripts/verify-diseno.mjs` (de B desde S81) · este reporte. **Cero
pantallas tocadas** — el territorio se respetó al pie: todo cierre entró
por el componente o por el lint.

## 1. EL NÚMERO DEL EJE: **99 de 102** (base medida 88, no el ~90 del canon)

La base se RE-MIDIÓ contra el árbol (el brief no es fuente, L-166): el
canon decía ~90; el árbol dice **88 con capa · 14 sin capa** — de las 14,
**3 son herramientas** (gallery ×2 + `lamina-fusion`, las tres "1ª sem:
no" en C3) y **11 son pantallas reales**. Las 11 cerraron ENTERAS sin
tocar una sola, por la única vía legal del territorio: **darle vigilancia
a leyes que Boton y EstadoVacio ya EMBODIAN por construcción.**

| Vía | Ley (firmada, con sesión de firma) | Pantallas que cierran |
|---|---|---|
| **Boton** | Ley 21 (CTA por SLOT, S63 — "nadie re-resuelve por pantalla") + 22c target 44 (S58) — ambas POR CONSTRUCCIÓN en el componente; ahora VIGILADAS (R5) | agregar/cierre · agregar/foto · autorizacion · index (cliente) · onboarding/cierre · onboarding/foto · bienvenida-dia1 = **7** |
| **EstadoVacio** | Ley 13 "el vacío JAMÁS se anima" — por construcción desde S43; el modo de fallo es REAL y casi ocurrió (veto L-c a envolver el vacío de adoptar en Entrada, S81-B②); ahora VIGILADA (R8) | adoptar · negocio/casos-heredados · negocio/estadisticas · negocio/resenas = **4** |

**Burn-down final por componente vigilado:** Tarjeta 69 · SelectorOpcion
27 · SelectorEspecie 4 · Entrada 10 · EvitaTeclado 27 · **Boton 90 ·
EstadoVacio 64** (unión = 99). Las 3 restantes son herramientas de
sesión, no superficies del founder (L-161) — quedan declaradas, no
maquilladas. *(Nota de honestidad L-141: el contador informativo de
Entrada osciló 8→10 entre dos corridas del mismo script; la LISTA de
sin-capa — que es de donde sale el número del eje — fue idéntica en
todas las corridas: 14 antes, 3 después.)*

## 2. verify:diseno — de 4 a 9 reglas, TODAS con auto-prueba o declaradas

**El guard estructural nuevo (mismo espíritu L-192):** toda regla tiene
que estar en FIXTURES o en INFORMATIVAS — exactamente en una; una regla
que escapa de ambas es el silencio que L-192 existe para matar, y el
lint entero se declara inválido. **Su rojo fue PRODUCIDO** (sabotaje:
R9 sacada de INFORMATIVAS → `ESTRUCTURA ✗ R9 escapó de la auto-prueba` ·
exit 1), no supuesto.

- **R3 DEJÓ DE SER INFORMATIVA** — la regla que no podía salir roja se
  ARREGLÓ (mandato de sesión): ganó el contrato de valores de
  `elevacion` (plana|reposo|elevada; sm/md deprecadas CONTADAS aparte —
  hoy 2, solo pueden bajar). El censo de adopción se conserva como info.
- **R5 (Ley 21/Boton):** `cta=` fuera del `_layout` raíz = DURA EN 0 ·
  `accent.cta*` directo = ratchet baseline 1. **El estreno mordió:**
  `negocio/equipo.tsx:719` (`colorCheck={theme.accent.ctaTexto}`) —
  hallazgo real pre-existente, dueño la pista de pantallas del
  prestador, migra al tocarse (D-318).
- **R6 (D-498/EvitaTeclado):** `KeyboardAvoidingView` crudo en apps —
  DURA EN 0 (el barrido S81 dejó las apps limpias, medido).
- **R7 (§5/Entrada):** `FadeIn*` artesanal en apps — ratchet baseline 2
  (el escalonado S52 de `hogar/index`, pre-portador; migra al tocarse).
- **R8 (Ley 13/EstadoVacio):** vacío dentro de `<Entrada>` = DURA EN 0
  (la vía del veto L-c) · vacío bajo `entering=` = ratchet baseline 2.
  **El estreno mordió dos veces:** `hogar/index.tsx:913` y `:1164` — las
  zonas escalonadas S52 llevan sus vacíos adentro (MISMO archivo y misma
  deuda pre-§5 que el baseline de R7); dueño la pista del cliente.
- **R9 (Ley 17.5) — INFORMATIVA DECLARADA con porqué de LETRA:** "todo
  vacío termina en un camino" CHOCA con el precedente FIRMADO del
  próximamente-sereno (S52; `adoptar` S73 declara en su CHANEL "cero CTA
  decorativo"). Un DURA fabricaría falsos rojos sobre composiciones
  firmadas. Censo servido: **82 con camino · 49 sin camino** — ⚖️
  arbitraje founder.

Corrida final: **VERDE, exit real 0** (L-191) · auto-prueba 8/8
encendieron · typecheck de `packages/ui` exit 0.

**Descartada con porqué (que no se resucite):** "un primario por
pantalla" (Ley 19.2) como regla estática — medida contra el árbol da 33
falsos rojos (estados condicionales legales: vacío/error/lista montan
primarios EXCLUYENTES en el mismo archivo). Un lint que no puede
distinguir superficie de archivo ahí no vigila: fabrica. Queda para el
gate humano.

## 3. LA PROMOCIÓN — MapaRecorrido `aSangre` (y dos verificadas ya-hechas)

- **`aSangre` PROMOVIDO** (tipos + nativo + web): el override LOCAL
  declarado de la cara MAPA del cliente (`paseo/[atencionId]:593` —
  probado en pantalla real y OTA, regla 80) entra al componente como
  modo: mata la caja propia (radius.md) y el mapa pinta a sangre (A6
  §9bis.1; M1 §9 "se ensancha, no se duplica"). La gimnasia del
  desborde negativo MUERE cuando el consumidor migre — **lo ejecuta A
  al tocarse (D-318), esta sesión no tocó la pantalla.** Default false.
- **FilaDato horizontal y Campo `sinCaja`: YA EXISTÍAN** (S81) —
  verificado contra el literal antes de crear (L-175/protocolo 1c.2);
  cero duplicación. CantoMarca sigue esperando su primer consumidor
  migrado (C, al tocar `bienvenida-dia1`).

## 3bis. RONDA 2 (orden founder, mientras se espera el gate)

- **D-482 PAGADA:** `Texto.cuerpo` md/18 → **base/15** (decisión FIRMADA
  S72-A; desbloquea la migración del carnet de A). Re-censo al pagar
  (L-141): los "3 consumidores" de la ficha eran **71** hoy — y **cero
  `<Texto>` sin variante** (nadie hereda a ciegas). De los de S72 solo
  el Hogar y la galería: la galería sigue al token por definición; el
  del Hogar (título de tarjeta de Ponte al día, cuerpo sobre apoyo)
  conserva jerarquía por color+2px — **señalado para la captura
  claro/oscuro del gate**. Los 68 post-S72 adoptaron `cuerpo` como
  "prosa por default", que es exactamente lo que la firma corrige a 15.
- **Los 3 hallazgos del estreno, COBRADOS (adjudicación founder — fuera
  de territorio autorizada explícita):** `equipo.tsx:719` — el check
  sobre fill SÓLIDO pasa de `accent.ctaTexto` (slot de Boton, Ley 21) a
  `palette.white` (Ley 22: "contenido en blanco/papel", el canon del
  thumb del Interruptor) · `hogar/index` 913 — la rama de error del rail
  a `View` plano (el error aparece CON la pantalla) · `hogar/index` 1164
  — la zona de la vida decide su envoltorio por estado: monta en
  vacío/error = QUIETA, monta con historia = entrada escalonada (la
  composición interna no cambió). **Baselines R5 y R8 al PISO: 0/0** —
  de cero no se sube jamás. Lint VERDE exit 0; typechecks ui/prestador
  exit 0; **cliente exit 2 por WIP AJENO** (`EncuadreFoto.tsx` de la
  pista A, archivo nuevo sin commit — cero errores en mis archivos,
  atribución verificada).
- **Las promociones de C (canto-curva → FilaCita · marca de agua al
  fondo compartido): ARMADAS, NO EJECUTADAS** — la orden las condiciona
  al gate ("después del gate, no antes"). Nota de coordinación: C
  publicó el OTA del gate con ancla `b22c83d`; esta ronda queda DESPUÉS
  del ancla — el lote que el founder juzga no la incluye, D-482 viaja
  en el próximo publish.

## 4. Pendientes con dueño

- **Founder:** el ⚖️ 17.5 vs próximamente-sereno (49 censados) · el
  arbitraje A6/Campo (sigue de S81) · el hallazgo `equipo.tsx:719`.
- **Pista cliente (A):** migrar `paseo/[atencionId]` a `aSangre` ·
  los 2+2 baselines de `hogar/index` (FadeIn + vacíos bajo entering) —
  todo al tocarse, D-318.
- **Pista prestador (C):** `equipo.tsx:719` al tocarse · CantoMarca en
  `bienvenida-dia1`.
- **B (yo):** el lint se ensancha con cada ley nueva; los baselines
  (hex 4 · FadeIn 2 · accent.cta 1 · vacíos-entering 2) solo bajan.
