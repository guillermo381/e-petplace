# S83 · EL ESTADO MEDIDO — para que S84 no re-mida

> **Todo lo de acá salió de una medición registrada.** Cada bloque dice quién la
> hizo: **(A)** esta pista · **(B)/(C)** la pista que la midió y la reportó.
> **Donde no hay medición, se declara el hueco en vez de completarlo.**

---

## 1 · EL MAPA DE FAMILIAS DEL PRESTADOR *(A — señales estructurales archivo por archivo)*

**54 pantallas → 9 familias. CINCO cubren 42 (78%). TRES cubren 33 (61%).**

| # | familia | n |
|---|---|---|
| **F3** | **EL CICLO DE LA ATENCIÓN** | **12** |
| **F5** | **CAPTURA** (formulario) | **12** |
| **F4** | **LISTA CON EJES** | **9** |
| **F1** | **EL TALLER** | **5** |
| **F2** | **PORTADA DE OFICIO** | **4** |
| F7 · F8 | puerta/momento · vacío puro | 4 · 4 |
| F6 · F9 | menú · ficha de entidad | 3 · 1 |

**El detalle con la evidencia de cada familia vive en
`2026-07-31-s83-mapa-de-familias-prestador.md`.** Acá van solo las correcciones
y precisiones posteriores.

### 1bis · LA PARTICIÓN DE F3 Y F2 *(C — no medida por A)*

- **F3 no son 12 homogéneas: son 9 + 3.** **Los tres oficios de campo (paseo ·
  grooming · adiestramiento) comparten anatomía**, y **veterinaria tiene su ciclo
  clínico propio**. **El arquetipo de campo se firma sobre 9; vet queda afuera.**
- **F2 multiplica ×3, no ×4** — **vet es otra pantalla**.

**⚠️ Procedencia declarada: esta partición la midió C.** El mapa de A agrupó F3
en 12 (5 Antes · 4 Durante · 3 Cierre) **sin distinguir vet**, y **A no re-midió
la partición**. Se cita como de C porque cambia el alcance del arquetipo, y
conviene que quede claro de quién es el dato.

## 2 · EL ARQUETIPO DEL CICLO DE CAMPO — medido y listo para construir *(C, con los números de líneas y Tarjetas verificados por A)*

**3 momentos × 3 oficios. Vet afuera.**

- **El Durante de paseo es la pantalla de firma:** **691 líneas · 11 `Boton` ·
  GPS · track** (A).
- **Los tres Durante tienen exactamente 3 `Tarjeta`** (A: `cita/durante` 3 ·
  `adiestramiento/durante` 3 · `grooming/durante` 3). **Es la coincidencia que
  vuelve creíble el arquetipo: no comparten tamaño (530–691) pero sí
  estructura.**

## 3 · EL BURN-DOWN, Y SU DECLARACIÓN HONESTA *(A)*

**7 de 54 (13%)** montan alguna pieza del patrón S82/S83.

**La lectura útil no es el 13%: el patrón entró casi entero por UNA familia** —
6 de las 7 son `<Entrada>` en las puertas (F7). **No está repartido: está
concentrado.** Las cinco familias grandes están en **cero o casi** (F3 **0** ·
F5 **1** · F1 **0** · F2 **0**).

**Es buena noticia disfrazada de mala: no hay que deshacer nada.** Están
uniformemente pre-S82, así que un arquetipo firmado **baja limpio**, sin el
trabajo caro de reconciliar pantallas a medio migrar.

> **🔴 DECLARACIÓN — EL EJE COMPOSICIÓN DE LA REGLA 81 SIGUE SIN TABLA, POR
> SEGUNDA SESIÓN SEGUIDA.** El inventario C3 tiene UNA columna, no dos, y se
> escribió antes de que la regla se partiera. **Y el mapa de familias NO lo
> reemplaza: mide ANATOMÍA, no composición.** Que 12 pantallas sean de la misma
> familia **no dice que estén bien ni mal** — dice que **una decisión de
> composición las alcanza a las 12**. Se declara para que S84 no lo herede como
> hecho.

## 4 · EL CENSO DE `text.tertiary` *(A)*

**~52 usos de producto** (12 `packages/ui` · 10 prestador · 30 cliente). La
galería aporta 28 más y **no cuenta** (herramienta, L-161).

| clase | ≈ | |
|---|---|---|
| **A** apagado/deshabilitado | 8 | ✅ lo que la espec B3.7 contempla |
| **B** placeholder | 2 | ✅ legítimo |
| **C** glifo/affordance | ~10 | 🟠 **no es texto**: mínimo 3:1 → **D-606** |
| **D** **texto que se lee** | **~20** | 🔴 **D-605** |

**Los cuatro grupos de la clase D:** los 4 checkouts del cliente · `plan-hoja`
(6) · los 3 educativos del prestador · **los 2 helpers de `packages/ui`**.

**PAGADO EN S83: los 2 helpers** (`Campo` + `CampoFecha`) — eran **el sitio de
máximo alcance**: los hereda **cada `Campo` de la casa, en las dos apps**.

**Los números, del medidor (no calculados a mano):** LIGHT **2.18** · DARK
**3.18** · MEMORIAL **2.90**.

## 5 · LO QUE ESCALA EN EL PRESTADOR *(B, con el alcance reportado por B)*

> **El prestador escala por PIEZAS y TOKENS, no por pantallas.**

**Las tres cosas que tocaron todo no tocaron ninguna pantalla:**

| cambio | alcance reportado |
|---|---|
| el halo | ≈ **112** |
| el sexto slot (`accent.active`) | **58** |
| la herencia del ancla | **78** |

**⚠️ Procedencia: los tres números son de B. A no los re-midió.** Se citan como
suyos, y **la conclusión que sostienen sí es verificable y vale**: en esta app,
**una línea en un token rinde más que un barrido de pantallas** — y por eso el
orden de trabajo de S84 debería empezar por piezas.

## 6 · LA VITRINA — lo que hay y lo que no *(C midió ①②③④; A verificó las 18 columnas y los 4 campos)*

- **`v_prestadores_publicos`: 18 columnas.** **No expone** `telefono` ·
  `whatsapp` · `email_contacto` · `sitio_web` (A, medido contra la DB) → **D-601**.
- **NO hay tabla de fotos del prestador** — solo `foto_url` (el logo).
- **NO EXISTE "la ficha del prestador" como componente.** El cliente **pinta con
  `Celda` genérica**. **Consecuencia directa: el espejo *"Así te ven"* NO tiene
  pieza que reusar** (L-175 no aplica: no hay registry que leer).
- **El pipeline de imagen es de UN archivo** (`subir-logo.ts`). Una galería exige
  **múltiples · orden · portada marcada · borrado**.

## 7 · EL MODELO DE FLUVI COMO CRITERIO *(C)*

```
fotos_sede(id, sede_id, url, orden, creado_en)   +   clip_url ≤30s
```

**LA PORTADA ES EL ORDEN MÍNIMO — una sola verdad en vez de dos que se
contradicen.** *(Un flag `es_portada` separado del `orden` permite el estado
imposible «dos portadas» o «portada que no es la primera»; derivarla del orden lo
vuelve inexpresable.)*

**CERO PORTE DE CSS** — es criterio, no fuente (§10 + el acta del método §1.1).

## 8 · EL ORDEN DE PLANOS *(C)*

- **El glow existe con 1.511 en el núcleo y llega CERO: lo tapan 73 fondos
  opacos.**
- **El agua se montó 65 veces curando el síntoma** — cada monta es una
  compensación de que el plano de abajo no se ve.
- **El experimento de dos archivos (C38, en el OTA `19f8b87c`) decide si se
  barren las 71 restantes.** Si sale limpio: **el glow aparece y el agua vuelve a
  UNA sola monta**. Si se ensucia: **se revierte con dos líneas**.

**⚠️ Procedencia: los tres números (1.511 · 73 · 65) son de C. A no los
re-midió.**

---

## APÉNDICE · LOS HUECOS DECLARADOS (no medidos por nadie)

1. **El eje COMPOSICIÓN por pantalla** (§3) — regla 81, segunda sesión sin tabla.
2. **El asterisco de C17 no aparece en EAS**: A revisó 14 groups y **ninguno
   tiene `dirty=true`**. Los ocho de S83 salieron limpios (medido); **el
   contraste con C17 viene del reporte de la mesa, no de una medición**.
3. **`D-610` es un hueco de numeración** — 0 ocurrencias en todo el repo. **Queda
   libre; no se rellena.**
4. **El tamaño de `EncuadreFoto`** (componente + 142 líneas + copy + 4
   consumidores) **lo reportó la mesa; A no lo verificó.**
