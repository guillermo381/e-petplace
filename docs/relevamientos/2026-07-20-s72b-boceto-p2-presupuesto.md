# S72-B · M1 — BOCETO: el armado del presupuesto (P2)

> **Estado: M1 — BOCETO. NO construido.** Sale a **vara cruzada (M2)** junto
> con el boceto de P3, en la misma pasada de la A. Recién después se construye.
>
> Ruta: `apps/prestador/src/app/veterinaria/presupuesto/nuevo.tsx` (existe hoy,
> se re-compone).
>
> Origen: los **cuatro hallazgos del founder en el gate S71**, relevados con
> literales en S72-B0. Este boceto los resuelve en composición.

---

## 1 · LAS SIETE PREGUNTAS DEL §1c

**1. ¿Qué TRABAJO hace cada elemento?** Tres trabajos distintos, hoy
confundidos: **elegir de un catálogo** (agregar un procedimiento), **crear un
ítem nuevo** (línea libre), y **quitar un ítem del carrito**. El diccionario
que aplica: 19.1 (celda de navegación — NO, ninguno navega), **19.4/22c**
(acción de fila), 19.7 (contorno transparente). El pecado actual es que
**elegir del catálogo se hizo con una `Celda`** (19.1), que promete navegar.

**2. ¿Ya existe en la casa?** Todo. `SliderPrecio` (con edición numérica) vive
en `procedimientos.tsx:299`. La validación campo-por-campo vive en
`consulta/[citaId].tsx:581/588`. `StepperCantidad`, `Campo`, `Insignia`,
`Texto`, `Boton`. **Cero componentes nuevos.**

**3. ¿Recorriste la casa?** La vecina que ya lo hace bien es
**`procedimientos.tsx`** — el MISMO oficio, el MISMO dato (`prestador_servicios`
tipo `'otro'`), con `SliderPrecio registro="aa"` y Hoja de alta. El presupuesto
**tomó otro camino para el mismo material**. Copiar al vecino (L-155).

**4. ¿Tesis, y sirve a la firma?** ↓ §2.

**5. ¿Capa y dosis?** Dosis **PRESTADOR = BAJA**. CTA en `accent.cta`
(tealDark). El total, que es la firma, no suma acento — es composición.

**6. ¿3 temas, es/en, estados?** ↓ §5.

**7. Chanel:** ↓ §3.

---

## 2 · TESIS · FIRMA

**TESIS** (heredada del comentario del archivo, ratificada): *"En unos toques
la clínica arma lo que cuesta, y la familia decide — con el precio congelado
desde ya."*

**FIRMA (de comportamiento):** **el total SIEMPRE visible mientras se arma.**
Ya está declarada en el archivo (`:9`), y es la correcta — el vet ve crecer el
número con cada ítem, sin scrollear. Se conserva y se refuerza: hoy el total
vive dentro de la misma `Tarjeta` de ítems (`:218`), como una fila más; el
boceto lo eleva a **barra fija al pie** (patrón 19.5, hero de posición
consolidada) para que respire y no compita con las filas.

---

## 3 · LOS CUATRO HALLAZGOS, RESUELTOS EN COMPOSICIÓN

### (a) LA CELDA QUE MUTA EL CARRITO — `:175-181`

Hoy: el catálogo de procedimientos son `Celda interactiva accessibilityRole="button"`
cuyo `onPress` **agrega un ítem al carrito**. Una `Celda` promete NAVEGAR
(19.1); acá tapear muta el carrito sin ninguna señal.

**El hallazgo real no es "falta un +": es un rol equivocado.** La cura es
elegir el control correcto, no decorar el incorrecto.

**Resuelto:** el catálogo pasa a una **fila de selección con affordance de
agregar explícita** — el patrón es el chip/fila que suma, con un glifo `+` en
el borde derecho que **dice** que ejecuta (no un chevron que miente navegar).
La fila entera es tapeable (área grande), pero su **fin** es un `+` sólido
chico, no un chevron. Cada tap **agrega uno**; si ya hay N de ese
procedimiento en el carrito, la fila muestra un contador discreto («×2»)
para que el vet vea que su tap tuvo efecto — hoy la única señal es el ítem
apareciendo abajo del fold.

> **Nota de diccionario:** esto es un trabajo que el diccionario NO nombra
> todavía — "agregar desde catálogo a un carrito". No es 19.1 (no navega), no
> es 22c (no es una acción suelta de pantalla). **Lo declaro como candidato a
> entrada de diccionario** (patrón Ley 11): si M2/gate lo bendice, nace su
> regla. Mientras tanto el boceto propone la forma; NO invento un componente.

### (b) SliderPrecio EN VEZ DE Campo decimal — `:194-200`

Hoy: la línea libre pide el precio con `Campo keyboardType="decimal-pad"` —
contra la regla del teclado (§15b: lo que se ajusta no se digita).

**Resuelto:** copiar la vara del vecino — `procedimientos.tsx:299` usa
`SliderPrecio registro="aa"` con `edicionNumerica` (S68-B7: tap en el valor →
teclado decimal clampeado al paso). Es la EXCEPCIÓN firmada a la regla del
teclado, y ya está resuelta en la casa. La línea libre del presupuesto la
adopta idéntica: mismo `PASO_PRECIO`/`PISO`/`TECHO` que
`procedimientos.tsx:57-59` (5 / 5 / 500), cero constante nueva inventada.

### (c) VALIDACIÓN CAMPO POR CAMPO — `:101`

Hoy: `agregarLinea()` hace `return` **en silencio** si el nombre está vacío o
el precio no parsea. El vet toca "Agregar" y no pasa nada, sin saber por qué.
Viola 17.4 (los errores dirigen).

**Resuelto:** la vara viva y bien hecha está en **mi propia app** —
`consulta/[citaId].tsx:581/588` pone `error={falta ? t('...requerido') : undefined}`
en el `Campo`. La línea libre lo adopta: el `Campo` del nombre muestra su error
cuando está vacío al intentar agregar; con `SliderPrecio` el precio ya no puede
ser inválido (el riel garantiza un valor legal), así que **el único error
posible es el nombre vacío** — y ese se dirige, no se traga. El botón "Agregar
línea" se deshabilita hasta que el nombre tenga contenido (espejo de
`puedeConfirmar`).

### (d) LOS TÍTULOS DE SECCIÓN — absorbidos por el punto 1

`:168`, `:190`, `:221` eran `Text` a mano con `sans.medium`. **Ya migrados a
`Texto variante="seccion"` en el commit M5 de esta tanda** (`10e809f`). El
boceto los da por hechos.

---

## 4 · GLIFOS — declarados como RESTRICCIÓN, no esquivados

El mandato S71-P2 pedía "glifo POR TIPO de procedimiento". **Este boceto NO
pide glifos, y declara por qué:**

- El procedimiento es `prestador_servicios` con `tipo_servicio='otro'` y
  **`nombre_custom` de texto libre** (relevado S72-B0). **No existe taxonomía
  de tipos** sobre la cual colgar un set POR TIPO.
- La regla de economía de `DIRECCION_ARTE` §6b es explícita: *"un glifo que
  nadie va a montar no se pide"*. Sin taxonomía, un set de glifos de
  procedimiento no tiene dónde montarse.
- La enmienda de la Ley 12 (S71) lo confirma: *"si un set necesita el MISMO
  glifo repetido por fila, lo que falta es un set POR TIPO — no más
  repeticiones del genérico"*. Y el corolario nombra este caso exacto como
  mandato **pendiente de decisión de producto**.

**Consecuencia para el boceto:** las filas del catálogo van **sin glifo** (Ley
12 enmendada: filas del mismo tipo dentro de una sección → sin glifo; el header
"Tus procedimientos" ya dijo de qué son todas). Si algún día nace la taxonomía
de tipos, nace el set — es decisión de founder, no de esta tanda.

---

## 5 · CONTRATO DE DATOS DE PANTALLA (M4)

Lectores: `obtenerMundoVeterinariaPropio(prestadorId)` (catálogo) +
`obtenerMiCuentaComercial()` + `obtenerMiPrestador()`. Escritores:
`crearPresupuestoBorrador` → `enviarPresupuesto` → (`registrarAprobacionPresencial`).

### 5.1 · De `ProcedimientoVeterinaria` (el catálogo)

| Campo | Destino | Nota |
|---|---|---|
| `id` | key de fila + dedupe del contador «×N» | |
| `nombre` | título de la fila del catálogo | |
| `precio` | metadata mono de la fila + precio del ítem al agregar | |
| `activo` | **filtro**: sólo `activo` se muestra (ya lo hace `:87`) | los ocultos no se ofrecen para armar |

### 5.2 · Del ítem local del carrito (`ItemLocal`)

| Campo | Destino |
|---|---|
| `nombre` | título de la fila del carrito |
| `precio × cantidad` | metadata mono de la fila |
| `cantidad` | **hoy siempre 1** — ver 5.4 |
| `key` | dedupe + quitar |

### 5.3 · De `cuentaComercial` / `prestador`

| Campo | Destino |
|---|---|
| `cuentaComercial.id` | requerido para enviar (deshabilita si null) |
| `cuentaComercial.countryCode` | viaja al borrador |
| **todo lo demás del prestador** | ❌ **DESCARTADO** — esta pantalla arma precios, no muestra identidad de negocio |

### 5.4 · DESCARTADO A PROPÓSITO / hueco declarado

- **`cantidad` > 1 no tiene UI hoy.** El tipo `ItemLocal` la porta (`:46`) y el
  total la respeta (`:94`), pero **nada la incrementa** — cada tap agrega una
  fila nueva. El boceto propone: el contador «×N» de la fila del catálogo (§3a)
  agrupa; **o** un `StepperCantidad` en la fila del carrito. **Es una decisión
  chica que dejo al gate** — las dos son baratas, y meter `StepperCantidad`
  ahora sería composición no pedida por el founder. Lo declaro, no lo fuerzo.
- **`descripcionLibre` vs `procedimientoId`:** el wrapper recibe todos los ítems
  como `descripcionLibre` (`:121`) — es decir, **el presupuesto NO guarda el
  vínculo al procedimiento del catálogo**, ni siquiera cuando salió de él. Es
  un aplanamiento a propósito (el precio se congela, el catálogo puede cambiar
  después). Lo declaro para que M2 confirme que es intención y no pérdida.
- **`venceEn` = 7 días hardcodeado** (`:132`). Es un default del negocio
  declarado en el código. El boceto no le agrega UI (no fue hallazgo del
  founder) pero lo señala como candidato futuro.

---

## 6 · LOS CINCO ESTADOS

### 6.1 · CARGANDO
El catálogo llega async (`:74-92`). Hoy **no hay estado de carga** — la lista
de procedimientos aparece de golpe o no aparece. El boceto suma `EsqueletoGrupo`
estático mientras carga el catálogo (Ley 13). La línea libre y el total **no
esperan** — se pueden usar sin catálogo (armar todo a mano es legal).

### 6.2 · ERROR
Si `obtenerMundoVeterinariaPropio` falla, hoy **el catálogo simplemente no se
monta** y el vet no sabe si no tiene procedimientos o si falló la carga — eso
viola Ley 13 (el error se disfraza de vacío). El boceto: banda de error con
reintento sobre la sección del catálogo, **sin bloquear la línea libre** (se
puede armar a mano igual). El error de ENVÍO ya está bien manejado (`:127`,
toast con `mostrar`).

### 6.3 · VACÍO — dos vacíos distintos
- **Catálogo vacío** (el vet no cargó procedimientos): la sección del catálogo
  no se monta, y una voz breve invita a la línea libre («Armá la primera línea»).
  **No** se monta un `EstadoVacio` de pantalla — la pantalla no está vacía,
  tiene la línea libre.
- **Carrito vacío:** hoy `:220-224` ya lo dice bien («armá agregando…»). Se
  conserva. El botón "Enviar a la familia" se deshabilita con 0 ítems (`:233`)
  — correcto, se conserva.

### 6.4 · PARCIAL
No aplica fuertemente — la pantalla no depende de RLS de otra mascota. El único
"parcial" es cuenta comercial no activa: hoy el envío se deshabilita si
`cuentaId === null` (`:233`). El boceto añade **la voz** de por qué está
deshabilitado (17.4) — hoy el botón gris no dice nada.

### 6.5 · MEMORIAL
El presupuesto es un acto administrativo del prestador — **no se arma un
presupuesto sobre una mascota en memorial** (no hay servicio futuro que
cotizar). El boceto declara: si la mascota está en memorial, esta pantalla
**no es alcanzable** (la puerta de entrada — desde la cita/consulta — ya no
existe en memorial). No hay estado memorial que dibujar acá; se declara la
ausencia, que es la decisión honesta.

---

## 7 · LO QUE ESTE BOCETO PIDE DE M2

1. **§3a — el patrón "agregar desde catálogo"** no está en el diccionario.
   Confirmá que ninguno de los existentes (19.1/22c/19.7) lo cubre, y si el
   candidato de forma (fila tapeable + `+` sólido en el fin + contador) es
   sano o si hay una vara viva que no vi.
2. **§5.4 — el aplanamiento a `descripcionLibre`** (el presupuesto no guarda el
   vínculo al procedimiento). Confirmá contra el wrapper que es intención.
3. **`cantidad > 1`** — ratificá el voto (dejarlo al gate) o marcá que
   `StepperCantidad` debe entrar ya.

---

## 8 · DECLARACIÓN DE TERRITORIO (76)

- **Nada de este boceto se construyó.** Los cuatro hallazgos esperan turno.
- **Los títulos (d)** ya se migraron en el commit M5 de esta tanda — es lo
  único tocado, y fue diccionario, no composición.
- **`money()` / `SliderPrecio` / `StepperCantidad`** son de `packages/ui` o su
  formateo es del riel (D-448) → territorio de la **A**. El boceto los consume,
  no los toca.
- **76(g):** este boceto no escribe DB.
