# S89-D · ESTADO DE CIERRE — la pista del cliente

> **Territorio:** `apps/cliente` + su canal OTA. **Rama:** `pista/s87-d`
> · worktree `../e-petplace-s87-D`. **Árbol limpio · pusheada.**
> **Último hash: `841d027b`** (este depósito).
>
> **La sesión en una línea:** el motor de avisos ganó su cara en el
> cliente —campana con semántica de novedades, preferencias con voz
> firmada, permiso con lámina— y los papeles ganaron su casa.

---

## 1 · LO CONSTRUIDO (commit por commit, cada hash con su asunto — regla 79)

| commit | qué |
|---|---|
| `23d6e30a` | **Relevamiento D-539**: los dos mecanismos de voz medidos en el vivo (9 bilingües en `_voz_notificacion` · 6 inline solo-es en dos triggers), el costo de unificar en tres pasos, y **el hallazgo de los DOS ACENTOS con firma en ambos lados** · + el lote de voces del cliente censado para firma |
| `b4b0cc86` | **Re-verificación C1-C4** (§2.6 de la directiva de craft): **C1/C2/C4 son NÚMEROS SIN LETRA** —el Bloque C nació condensado en `bef6afd`, el acta hermana no existe: se pide el literal, no se inventa el defecto (patrón A7)— · **C3 SUPERADA** en la voz propia del flujo (0 en tres clases × cuatro ubicaciones) **con el residuo MUTADO** al canal `r.mensaje`, adjudicado a D-539/S86 (6 sitios listados) |
| `083c0f5f` | **El mapa de destinos** para la lámina de push: 24 tipos de audiencia cliente contra el mapeo vivo, con el dato que cada aviso debe portar y **cinco cruces servidos** (el de `tiene_destino` por REFERENTE vs destinos por TIPO, con `pago_confirmado` como su caso limpio) |
| `4aa67454` | **LA PASADA ÚNICA DE FIRMA** — un solo documento: los reemplazos del acento lado a lado (lo viejo muere a la vista), las tres voces de cita de A citadas con su literal, la decisión `updates`/`notices`, el lote A-F y el checklist. El lote anterior queda SUPERSEDED con puntero |
| `7e030b6a` | **El lote firmado, EJECUTADO** en los dos diccionarios (es+en juntos): «No tienes avisos» **en su lugar** del literal de lámina · los porqués a «Eliges» · **«updates» unificado** · el permiso sin jerga · WhatsApp fuera de borrador. **Ley nueva verificada por grep**: cero «push» en valores de cara al cliente |
| `d2ef9d12` | **Lámina del pedido de permiso** (propuesta): la invitación propia protege **el único tiro del SO**, cuatro guardas —la sonda nativa gobierna—, voces sin jerga, el «ahora no» con camino vivo, y **re-invitación SIN nagging** (solo build nativa · una por versión · dos noes = silencio definitivo) |
| `3c985c71` | La **nota de semántica** de `LAMINA_CAMPANA` (la huella = novedades **no vistas**; dos estados, dos verdades) **con su freno declarado** · + la lámina del permiso a **FIRMADA** y a la cola del tren nativo |
| `58e62eee` | **El consumo del contrato v2 de la huella**: la esquina pasa a `hayNovedades('cliente')` (estado renombrado a `conNovedades`), `/avisos` deposita la visita al entrar. **PAR 4/4** in-txn con JWT real: presente → la visita apaga **sin tocar filas** (no-leídas 7=7, el discriminador) → aviso nuevo re-enciende |
| `428006f4` | **LA CASA DE LOS PAPELES**: ① el perfil gana sección **desplegable** con filas (☠️ **muere el botón tapiz**) · ② nace **Cuenta → Documentos del hogar** con `FiltroMascotas` (la pata, pieza viva) · **el candado «jamás a mano» con su rojo PRODUCIDO** |
| `841d027b` | Este acta + **el glifo `descargar` MONTADO** (pedido pagado por B el mismo día) + **el retiro de los fixtures D-671** |

## 2 · EL CANDADO «JAMÁS A MANO», PROBADO (no afirmado)

La letra pedía derivar del catálogo de papeles. **Medí que el catálogo
de motor NO EXISTE** (`cat_tipos_documento_titular` es del titular; el
vocabulario vive en un **CHECK** de `documento_token`), así que la
derivación posible es por TIPO y se hizo **exhaustiva**:

```
Brazo 1 · inyectado 'receta' en el union del contrato de A:
  src/lib/papeles.ts(40,7): error TS2741: Property 'receta' is missing…
Brazo 2 · contrato restaurado byte a byte (git diff vacío):  tsc EXIT=0
```

> **Un papel nuevo no puede llegar mudo ni sin glifo: el build se
> planta.** Eso es lo que «jamás a mano» tenía que garantizar — no que
> nadie escriba, sino que **nadie se olvide**.

**Pedido a A vivo:** `cat_documentos_mascota` con **disparo firmado —
el TERCER papel** (A ya lo anotó al arco de la receta: *«con dos,
enumerar es más honesto que abstraer»* — coincidimos midiendo por
separado).

## 3 · 🧹 FIXTURES D-671 — **RETIRADOS**, con la condición medida antes de tocar

**La condición literal de la deuda era objetiva y se cumplió:**

```
transporte vivo ......... email=true · in_app=TRUE · push=false · whatsapp=false
avisos REALES de +8 ..... 29 transportables (no-fixture)
fixtures ................ 20  →  DELETE  →  residuo 0
la campana de +8 queda .. 29 avisos REALES
```

*«Se ejecuta cuando `in_app` gane transporte: desde ese momento los
avisos reales llegan solos y el fixture pasaría a ser ruido
indistinguible»* — es exactamente el estado medido: **20 filas falsas
mezcladas con 29 reales en la campana del founder.**

> **Y el precedente inverso quedó respetado:** en S88 el gate se cayó
> porque A **vació la campana antes del dedo** (`dae04cf`). Acá el
> retiro deja la campana **con 29 avisos reales** — no vacía. *La
> lección no era «no borres», era «no dejes al founder mirando una
> pantalla vacía».*

## 4 · LO QUE QUEDA MÍO PARA S90

### (a) 🔴 PRIORIDAD 1 — EL ARCO DE MASCOTA: rediseño del alta y del perfil

Llega **con lámina** (la ley de la casa: la lámina antes de la
pantalla). Lo que esta sesión deja servido para esa lámina, medido:

- El perfil **ya tiene** su sección de papeles plegada (§1) — el
  rediseño la hereda, no la re-inventa.
- El alta (`onboarding/mascota.tsx`) sigue con la composición de S45 +
  las curas S82: **es la superficie más vieja del cliente sin pasar por
  el rediseño de oficios.**

### (b) Las curas de UI que el founder firmó (sin construir — llegaron al cierre)

| cura | dónde |
|---|---|
| **tarjeta blanca + chevron** en la fila del perfil | perfil de mascota |
| **«›» en las filas del hogar** | Hogar |

*No se ejecutaron a propósito: llegaron con el cierre en curso y una
cura de craft sin pantalla real que mirarla es exactamente lo que la
regla 80 prohíbe. Van primeras en S90, y son baratas.*

### (c) El agrupado por categoría — **CON SU DISPARO ESCRITO: PAPEL 8**

Documentos del hogar hoy agrupa **por mascota** (con filtro de pata).
El agrupado **por categoría** (salud · identidad · legales…) **dispara
en el papel 8** — antes, agrupar dos o tres papeles inventa jerarquía
donde no hay. *Mismo criterio que el catálogo: con pocos, enumerar es
más honesto que abstraer.*

### (d) Vivo de esta sesión, sin dueño nuevo

- **El gate en dispositivo** de todo lo construido (campana con
  semántica nueva · Preferencias · las dos superficies de papeles ·
  el desplegable con el pulgar) — **ningún dedo del founder tocó estas
  pantallas todavía.**
- **Las voces `documentos.*`** (es+en construidas) son **candidatas** al
  próximo lote de firma.
- **La rama «autorización»** del mapeo de destinos: sigue bloqueada (el
  lector no porta `solicitudId`; el dato es de A).
- **El label del `Badge` con huella** dice «sin leer» y la semántica es
  «novedades» — **nombrado a B**, es voz de `packages/ui`.
- **El literal de C1/C2/C4** (pedido a la mesa; sin él, el Bloque C de
  la directiva puede enmendarse a lo medido — la enmienda es de A).

## 5 · NOTAS OPERATIVAS

- **Cruce de territorio declarado (sin reproche, para el registro):**
  S89-A construyó la sección Documentos en `apps/cliente`
  (`8dc8d8f4`). La tomé como base y la reemplacé por la letra firmada;
  **el cruce existió y queda escrito.**
- **Los typed routes de expo son artefacto local, CONFIRMADO por
  medición** (no heredado de S88-B): el rojo de `/cuenta/documentos`
  venía de un `router.d.ts` generado el 6-ago 00:43, anterior al
  archivo. **Se regeneró levantando el dev server** (puerto 8099, 25 s)
  → verde. *Un rojo de andamio se resuelve, no se declara.*
- **Regla 87 ejercida:** el dev server del 8099 **muerto y verificado**
  (`lsof -ti:8099` → 0 ocupantes; cero procesos míos vivos). No levanté
  emuladores. El worktree sigue sin heredar el link de Supabase
  (`supabase/.temp/`) — las consultas corrieron desde el repo principal
  por `--file`, como en S88.
- **Coordinación que funcionó en el día:** pedí el glifo `descargar` a
  B en la lámina (76b, texto autocontenido) **y B lo entregó el mismo
  día** (`9d2776b0`); está **montado** como default de la fila. A
  construyó su pantalla de permiso **sobre mi lámina firmada**
  (`ea798ce5`). *Dos pedidos autocontenidos, dos entregas — el
  mecanismo del método pagó en las dos direcciones.*
- Verificaciones vivas archivadas en `/tmp` de esta máquina (se pierden
  con el reinicio; lo que prueba algo está citado en los commits y en
  el par depositado `2026-08-06-s89d-PAR-huella-novedades.sql`).

**Origen: S89-D · orden de cierre · 7-ago-2026.**
