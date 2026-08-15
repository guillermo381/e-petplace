# S98-D — HANDOFF DE CIERRE (14 Ago 2026)

**Pista D · ramas `pista/s98-d` (mergeada) y `pista/s98-d-enmienda` (en origin,
esperando merge de A) · territorio `apps/prestador`: el HOY, las superficies de
roles, y `negocio/` solo en lo que toca «Prepará tu espacio».**
Worktree `e-petplace-s97-d`, `node_modules` PROPIO (el symlink no volvió).
Árbol limpio. Cierra con su lote entregado.

---

## 1 · LO CONSTRUIDO, CERRADO Y VERDE

| bloque | estado |
|---|---|
| **① Las tres acciones muertas de «Prepará tu espacio»** — deep link a la sección exacta | ✅ **mergeado a main** |
| **② La fila de despacho del HOY** — gateada por primera vez | ✅ **mergeado a main** |
| **③ El barrido del guard a filas cargadas** | ✅ **mergeado a main** |
| **④ El aviso §6** — no escrito (esperaba firma); la regla que lo frena la construyó B como **R40** | ✅ |
| **⑤ El verbo de llegada** — composición condicional, encendida | ☠️ **retirada por D-818** |
| **⑥ El borde firmado** — `LETRA_RECEPCION_S76` **§7bis** | ✅ + enmienda pendiente de merge |

---

## 2 · LA HERENCIA — EL GUARD, QUE ES LO QUE MÁS VALE

### `scripts/verify-colision-fila.mjs` — ahora **BARRE**, ya no solo mide

```bash
# modo BARRIDO: mide TODAS las filas cargadas sin nombrar un ancla
node scripts/verify-colision-fila.mjs --barrer \
  --email <cuenta> --keychain epetplace-siembra-s97 [--dia 14] [--tolerancia 8]

# modo ANCLA (el original, intacto)
node scripts/verify-colision-fila.mjs --ancla "<texto>" --email … --keychain …
```

**Cobertura medida al cierre:** HOY `duenovet` **28 filas / 59 pisos** · HOY
`duenotodo` **23 / 50** · `veterinaria/consulta` **5 / 10**. **Las 3 filas en
riesgo del censo de B, cubiertas y verdes.**

**Definición de fila, que es lo que lo hace general:** *el elemento MÁS CHICO
que contiene N textos* (`--min-pisos`, default 2). **No** `[role="button"]`:
una fila cargada no es una fila tocable.

### 🔴 SUS SEIS TRAMPAS — las tres primeras son de S97-D, las otras tres mías

1. **Desborde ≠ colisión** — píxeles idénticos, curas opuestas.
2. **El vecino se mide, no se asume** — uno de otra fila da un verde perfecto y falso.
3. **La intersección va en los DOS ejes** — solo X reporta padre e hijo.
4. **El vecindario es el DOCUMENTO** — acotarlo a la fila dio VERDE con un bloque dibujado encima de la fila entera (era HERMANO de la fila). *Lo que tapa una fila casi nunca es de la fila.*
5. **Cada fila se centra antes de medirse** — sin eso el guard es función del scroll: la misma pantalla daba rojo o verde según cuánto se hubiera bajado (la barra de tabs es `absolute; bottom:0` sobre el área de scroll).
6. **Se mide la TINTA, no la caja con padding** — la caja incluye padding y hacía gritar sobre **la pata de selección de E6**, que monta el borde del chip **a propósito** y no toca una letra. *Un guard que grita sobre una geometría firmada enseña a ignorarlo.*

**Sus límites, sin cambio:** no corre en pre-commit (necesita Metro + sesión) ·
**mide RN-web, no el dispositivo** (L-153) · el roce residual de marcas que
montan el borde se pasa con `--tolerancia 8` **declarado**, jamás bajando la
vara por defecto.

**Discriminador re-probado TRES veces** — una por cada cambio de geometría.
*Cada cambio invalidaba el rojo anterior; quedarse con el primero habría sido
archivar un verde que ya no cubría el código.*

### `scripts/captura-s98d-despacho.mjs` — el circuito del lote
Capturas del HOY, «Prepará tu espacio» y la fila de despacho, con la rueda
corrida al día del pedido. **No mide**: el veredicto es del guard.

---

## 3 · LO VIVO, POR DUEÑO

### De A (conducción / motor)
1. **`pista/s98-d-enmienda` (`aeaa8b59`) espera merge.** Marca §7bis como
   **SUPERADA por D-818**. **No bloquea a nadie** — su riesgo es de lectura
   futura: la sección quedó con estatuto «✅ FIRMADA» apuntando a
   `VERBO_LLEGADA_SOLO_RECEPCION` y `hayRecepcionActiva`, **dos identificadores
   borrados**. *Una letra firmada que apunta a código inexistente se lee como
   un bug, y el lector honesto lo «arregla» reponiendo lo que la firma quitó.*
2. **🔴 El trigger es ahora PUNTO ÚNICO.** Con el verbo muerto para todos,
   `trg_cita_llegada_al_atender` (`20260814200000`) es **lo único que estampa
   `llegada_en` por el camino real**. Antes había respaldo manual; ya no.
   **No se revierte sin devolver antes algún escritor.**

### Del founder
3. **El aviso §6 del toggle Administrador** sigue en placeholder
   (`equipo.adminAvisoPENDIENTE`), esperando su segunda firma. **Ya no puede
   escaparse en silencio: R40 de B lo vigila** (contador solo-baja + paridad
   es↔en, que es el modo de falla que el contador no ve).
4. **Servicios y precios con MÁS DE UN OFICIO no tienen destino único.** La
   cura del ① resuelve exacto con un oficio; con varios cae a la lista de
   mundos, que es el paso que de verdad sigue. **Declarado, no disfrazado** —
   de los 5 negocios que ven el módulo, **2 tienen ≥2 oficios y 2 tienen cero**.

### De la mesa
5. **El `overflow` de `Celda` de B** (157 montajes). B lo frenó **bien**: la
   adjudicación fue explícita de la mesa y *un peer no la reemplaza*. **La
   premisa que la fundó cambió con números** (de «el guard mira dos filas» a
   56 filas / 119 pisos y las 3 del censo cubiertas). Elevado por B; decide la
   mesa.
6. **La convención de teléfono, medida y sin curar:** **9 columnas PROHÍBEN el
   `+` contra 4 que lo EXIGEN**, una fuera de `public`
   (`marketing.leads.whatsapp`). Son la **regla 28 sobreviviendo a su
   derogación** (S84, `CONTRATO` v1.26). **Nadie lo cura y con razón:** es
   migración con backfill sobre tablas con datos, y **decisión de letra —cuál
   gana— antes que de código**, porque la convención vieja es la MAYORÍA y la
   derogación no dice qué pasa con lo ya escrito. La frontera operativa vive
   en la ficha del helper de C.

### Sin dueño asignado
7. **El peor caso de `veterinaria/consulta` sigue sin verificarse cargado.** El
   censo de B lo describe con 2 chips + glifo + mono; **en el estado de cita
   que se pudo montar rindió 2 pisos**. Está verde *en el estado que existe
   hoy* — **es un dato sobre qué cubre el verde**, no un pendiente.
8. **Ningún gate en dispositivo.** Todo el lote es **RN-web**. El guard, las
   capturas y los discriminadores miden el navegador; **Android puede repartir
   distinto** (L-153).

---

## 4 · LO QUE ME COBRÓ, PARA QUE NO SE REPITA

> **De ocho defectos de la jornada, SEIS eran de mis propios instrumentos.**
> Ninguno lo vio leer código: salieron de producir el rojo a propósito y de que
> dos pistas fueran a verificar mis números.

- **🔴 UNA AUSENCIA VALE LO QUE VALE EL UNIVERSO DONDE SE BUSCÓ.** Me pasó
  **dos veces la misma tarde**: el vecindario recortado a la fila (verde con un
  bloque encima) y el conteo de teléfonos recortado por nombre. *Un «no
  encontré nada» sobre un conjunto recortado se lee idéntico a un «no hay
  nada», y no hay forma de distinguirlos leyendo el resultado.*
- **Medí por NOMBRE en vez de por lo que la cosa HACE** (`conname ilike
  '%telefono%'`): conté 3 tablas y eran 6, y por columna 9 contra 4. Es la
  lección de S95-F, **cometida en el mismo mensaje en que se la explicaba a
  otro**.
- **Un número raro no es un dato.** Mi `Range` dio 42 px de alto para una línea
  de texto; no concluí de ahí, fui a la captura. *Fue lo único que hice bien de
  esa serie.*
- **Casi reporto que rompía el chip de llegada** con una sonda que contaba la
  etiqueta del propio botón. Lo cazó cruzarla con la base: la cuenta que medía
  no tenía ninguna cita llegada, así que ese chip no podía existir.
- **Un reporte de colisión que no dice el PARENTESCO del vecino** manda al
  lector a adivinar dónde mirar — mandé «el chip Todos solapa con un glifo» sin
  decir de qué contenedor era, y B dedujo lo razonable y equivocado. *La
  ambigüedad la puse yo.* **Queda como pedido para la próxima pasada del
  guard:** que la salida diga si el vecino comparte fila con el ancla.
- **Le dije a B «podés retirar el `overflow`» y no me correspondía.** Mi
  medición es insumo; la adjudicación es de la mesa. B lo frenó bien.

**Y lo que salió bien y conviene repetir:** verificar la entrega de A **antes**
de encender —el dato del que dependía mi interruptor era MÍO, y *un número
prestado no se puede defender*— y frenar la mitad de motor midiendo en vez de
suponer: **encender sin el escritor habría dejado a los negocios sin recepción
sin ninguna forma de registrar una llegada.**

---

## 5 · OPERATIVO

- **`pista/s98-d`** (5 commits) **mergeada a main** por A (`b10dd4ef`).
- **`pista/s98-d-enmienda`** (`aeaa8b59`) en origin, **esperando merge**.
- **typecheck** `apps/prestador` **0** · **`verify:diseno` VERDE 31 reglas**
  (32 con la R40 de B).
- **Cero migraciones, cero SQL de escritura.** Solo lectura para medir.
- **Metro en :8082** (C usa :8081) · capturas en
  `scripts/capturas/s98-d-despacho/`.
- **Direcciones verificadas por tráfico real:** A `e-petplace-51 [873fec]` ·
  B `e-petplace-81 [6afd3a]` · C `e-petplace-3b [0b313d]`. *Hubo tres mensajes
  mal ruteados en la jornada; los tres declaraban su destinatario en la primera
  línea, y por eso no se perdió nada.*
