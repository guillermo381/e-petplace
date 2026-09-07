# S113 · A — cierre de sesión

> **`main @ 69bd04a3`** · árbol **0** · A trabajó sobre `main`, sin rama de pista.

---

## 1 · LO PUBLICADO

| | group | ancla | rt | canal |
|---|---|---|---|---|
| **cliente** | `4cd04f55` | **`69bd04a3`** | 1.0.7 | preview |
| **prestador** | `9893351d` | **`69bd04a3`** | 1.0.7 | preview |

`dirty: None` en ambas · **groups, anclas, runtime y canal leídos del OBJETO**
con `update:view --json`, jamás del texto del publish · **árbol medido en 0
antes de bundlear**.

### Las cuatro puntas · pista → SHA

| pista | SHA | |
|---|---|---|
| **C** | `8b57fcce` | ✓ |
| **B** | `7bce15a0` | ✓ |
| **D** | `073b9e3d` | ✓ |
| **E** | `abdac745` | ✓ |

⚠️ **C entró en `8b57fcce`, no en el `e728fc06` que nombró la mesa** — y es el
caso exacto que el censo ② existe para ver: *un censo por nombre detecta
AUSENCIA y no detecta MOVIMIENTO*; `e728fc06` era su punta al momento del
mensaje y la rama avanzó después bajo el mismo nombre. **Entró porque cura un
defecto visible**: sin nombre, la pantalla decía *«Todavía no hay papeles de .»*
— *una interpolación rellenada con vacío no es un default: es una frase rota que
compila*. Dejarlo fuera publicaba el defecto.

**Fuera de `main`, con su razón:** `s113-a-nfc` y `s113-b-nfc` (**nativo — no
entra antes de la build**) · `s113-c-1.0.1`, `s113-c-1.2`, `s113-d-2.0`,
`s113-e-2.0` (lotes viejos, superados por sus puntas).

### Verificación

**4 typechecks en 0** · **`ota:deps` exit 0** · **19 gates medidos con exit y
bytes**: 17 en verde, **2 en rojo y los dos declarados** —
`verify:contador-piezas` (485 B, la skill de B dice 81 y son 171) y
`verify:placas-lote` (417 B, 0 lotes, espera proveedor). **No se forzaron.**

🔴 **Dos hallazgos de método del propio cierre, que valen más que la tabla:**
1. **Mi primer barrido de gates reportó los 19 en verde y era falso**: usé
   `|| true` y leí el exit de `true`, no del gate. **L-191 exacto** — *el exit se
   lee del comando, jamás de lo que venga después.* Re-medido sin él.
2. **8 gates de la casa salen `exit=127` (32 B)** cuando se los corre desde un
   Node sin `tsx` en el PATH: **no fallan, NO CORREN**, y su silencio se lee
   igual que un verde.

---

## 2 · LO ABIERTO, CON DUEÑO

### Mío (A) — los cinco

| | qué | medición |
|---|---|---|
| ✅ | **el `papel` sin juicio en la búsqueda** | **CERRADO**. Ya salía mudo; se volvió **inexpresable** con `verify:papel-sin-valores` (mide la función VIVA, con su control). «Hematocrito» y «Ehrlichia» encuentran sin revelar; «41» y «negativo» no traen nada |
| 🟡 | **cobertura del expediente** | **452 de 633 eventos (71 %) SIN procedencia declarada**. *La procedencia es lo que distingue lo que dijo la familia de lo que verificó un profesional*; hoy toda pantalla que quiera mostrar esa diferencia la muestra sobre un tercio |
| ✅ | **permisos de la bóveda** | **CERRADO** (`20260910320000`): REVOKE de INSERT/UPDATE/DELETE/TRUNCATE. Discriminador: lectura → 2 papeles ✓ · INSERT directo → **HTTP 403** ✓ |
| ✅ | **`estado_de_placa` para un token inexistente** | **CERRADO**: devuelve `no_existe` **sólo con sesión**. ⚠️ *La página pública ya distinguía 200 de 404, medido no explotable: token de 22 caracteres, ~2^132.* **El disparo para revisarlo es que el token se acorte** |
| 🟡→✅ | **el contador del canon** | **las dos filas del canon curadas** (declaran el comando). Queda `SKILL.md:19` y `packages/ui/CLAUDE.md:3`, que **dicen 81 y son 171** — **de B** |

### Otras pistas

| pista | qué | medición |
|---|---|---|
| **B** | el contador de la skill | dice **81**, son **171**. El texto para copiar está en el canon, fila `packages/ui/` |
| **E** | 🔴 `verify:tipos-vivos-vs-diccionario` da **exit=1 con 0 bytes** | *un gate que falla sin decir nada no informa: obliga a leer su código para saber qué encontró* |
| **E** | ✅ **corrijo una medición mía**: dije que `verify:habla-en-presente` no existía en ninguna parte | **era falso, y el error es de método**: censé por `verify-habla-en-presente.*` y su script se llama **`censo-habla-en-presente.mts`**. *Un gate no se llama igual que su archivo, y censar por nombre de archivo mide la convención, no el hecho.* Entró con tu merge |

**`D-1048`** (el barredor del archivo de un papel) y **`D-1049`** (las placas)
siguen abiertas con su ficha.

---

## 3 · EL CALENDARIO FIRMADO — que nadie lo dé por hecho

| | | |
|---|---|---|
| **1º** | **REDISEÑO · S116/117** | **el Hogar y la composición quedan PARADOS** hasta entonces |
| **2º** | **BUILD DE ANDROID**, una sola, con lo nativo acumulado | NFC · permiso de galería · compartir archivos · micrófono de Nexo · selector de PDF. **Lista viva: `S113-NFC-BUILD.md`** |
| **3º** | **PULIDO** | |
| **4º** | **LEGAL** | no depende de nosotros |

🔴 **El NFC de iPhone queda FUERA hasta que exista la cuenta de desarrollador**
(el founder espera el DUNS). *El entitlement se pide desde una cuenta que
todavía no existe* — **no es una casilla que se marca al compilar**, y quien
planifique ese día contando con iPhone lo descubre al final, sin margen.

**Ninguna rama `*-nfc` se mergea antes de la build.**
**Lo nativo se ANOTA en la lista viva; no se instala.**

## 🔒 LA VEDA DE PRODUCCIÓN SIGUE ENTERA

**Todo va a `preview`.** Las dos publicaciones de este cierre están en `preview`,
runtime 1.0.7, verificado del objeto. **Nada pasa a producción sin el «autorizo»
del founder.**
