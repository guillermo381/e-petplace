# S89-B · EL ÁRBOL DE MONTAJE — la cura del pareo por ventana/archivo (R32 · M2)

> **Orden de apertura S89-B ③** — la deuda de instrumento sin dueño desde el
> brief de S87. **Instrumento puro: no toca producto, no enmienda ley.**
> Vive en `scripts/lib-arbol-montaje.mjs`; consumidores cableados:
> `burn-down.mjs` (M2) y `verify-diseno.mjs` (R32).

---

## Qué es

Un grafo de montaje **POR SÍMBOLO**: cada archivo se parte en sus
declaraciones top-level capitalizadas (componentes), cada símbolo conoce qué
tags JSX monta, y los tags se resuelven contra los imports del archivo
(relativos · alias `@/` por app · `@epetplace/ui` por nombre) o contra
símbolos del mismo archivo. Sobre el grafo se caminan **CADENAS
ruta→…→símbolo** (ruta = default-export bajo `src/app/`).

Sobre el repo real: **288 archivos · 0 imports locales sin resolver.**

## Por qué SÍMBOLO y no archivo — el hallazgo que ordenó la forma

Medido ANTES de construir: `perfil-piezas.tsx` exporta CUATRO componentes y
el `<Campo>` vive **solo en `ControlTelefono`** (l.185).

**La medición de S86 que fundó la deuda queda FALSADA en su ejemplo:** el
«mixto» decía que `cuenta-comercial/index.tsx` era anfitriona DESCUBIERTA de
`perfil-piezas` — pero esa ruta importa **solo `SeccionDesplegable`**, que no
monta ningún campo. El pareo por ARCHIVO fabricaba una cadena que no existe;
el guard por archivo ni la veía ni la refutaba. El árbol por símbolo dice la
verdad en los dos sentidos: **no fabrica esa cadena** (y su auto-prueba tiene
el contra-caso de que la ausencia sea por precisión y no por muerte del
parser) **y encuentra las descubiertas reales** cuando existan.

*(La deuda era real igual: el instrumento no podía distinguir. Lo que cambia
es el veredicto del caso concreto — hoy NO hay cadena descubierta.)*

## Lo que M2 dice ahora (corrido sobre el repo)

```
4 RUTAS con deuda propia · 0 CADENAS descubiertas · 4 símbolos cubiertos por su cadena · 0 sin anfitriona
🔴 apps/cliente/src/app/(tabs)/hogar/bitacora.tsx
🔴 apps/cliente/src/app/carnet.tsx
🔴 apps/prestador/src/app/grooming/taller.tsx
🔴 apps/prestador/src/app/paseo/taller.tsx
·  escriba-historia.tsx#EscribaHistoria — 1 cadena, cubierta
·  perfil-piezas.tsx#ControlTelefono — 1 cadena, cubierta   ← el ex-«mixto»
·  seccion-sede.tsx#SeccionSede — 2 cadenas, cubiertas
·  direccion-hogar-form.tsx#DireccionHogarForm — 4 cadenas, cubiertas
```

- Las 4 rutas rojas son las MISMAS de antes (el árbol no las mueve — eran
  deuda propia legible por archivo). Lo que cambió de naturaleza: los 4
  «componentes con anfitriona» pasaron de **afirmación sin verificar** a
  **cadenas contadas y verificadas**.
- **Divergencia de unidad, declarada:** el pedido S86 contaba «5 anfitrionas»
  para `direccion-hogar-form`; el árbol cuenta **4 cadenas a RUTA**. La
  unidad vieja era «archivos que lo importan» (incluía no-rutas); la nueva es
  caminos reales a pantalla. No es un hueco: es la medida correcta.
- `sinAnfitriona` se DECLARA cuando aparezca (galería, código muerto o límite
  de resolución) — jamás verde por omisión.

## Lo que R32 gana

El brazo del **hitSlop** dejó de ser ciego al otro lado de la extracción: los
componentes referenciados en la ventana (±25) se resuelven por el árbol
(mismo archivo o un salto de import, ui incluido) y sus hitSlop **numéricos**
entran al mínimo `2×hitSlop`. La ventana sigue rigiendo para gap y absoluto
(geometría de la FILA — la convención de extraer la fila ya existe).

Dos cinturones L-192 en el brazo nuevo:
- si `autoPruebaArbol()` falla, R32 sale **ROJO** («no se mide con un
  instrumento roto») en vez de medir de menos;
- **el ancla de paths**: un montaje REAL que el árbol no conozca = rojo
  hablado — el modo de falla silencioso (vecinos vacíos para todo archivo)
  no puede ocurrir calladamente.

Hoy: los 2 montajes reales pasan igual que antes (sus vecinos no portan
hitSlop numérico mayor); el mecanismo queda probado por la auto-prueba.

## La auto-prueba (corre en burn-down Y en R32 antes de creerle al grafo)

Árbol VIRTUAL (fixtures en memoria, cero disco) con: el mixto real
(dos exports, el Campo en uno) · la ruta cubierta · la ruta descubierta ·
**el discriminador del pareo por archivo** (cuenta-comercial NO debe aparecer
para `ControlTelefono`) · **el contra-caso anti-verde-vacío** (cuenta-comercial
SÍ debe aparecer para `SeccionDesplegable` — si no, la precisión de arriba
sería muerte del parser disfrazada) · la cosecha del hitSlop de un vecino
extraído.

## Límites declarados (en el propio archivo, L-197)

Resolución estática por regex: sin re-exports (`export { X } from`), sin
imports dinámicos, sin componentes pasados como valor; `@epetplace/ui` por
nombre de archivo; símbolos = top-level capitalizados; `hitSlop={expr}` no
legible no baja el mínimo.

---

## Declarado al cierre, fuera de mi territorio

- **`verify:censo` P3 en ROJO por el MUNDO, no por esta pista:** el canon
  declara 186 migraciones y el historial remoto tiene 187 — el contador de
  `CLAUDE.md` volvió a decaer (cuarta vez). Dueño: **A** (docs maestros).
  El instrumento está haciendo exactamente su trabajo.
