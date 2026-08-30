# CONTRATO · EL ACTO ÚNICO DE ACEPTACIÓN

> **Nace:** 30-ago-2026, firma del founder. **Migración:**
> `20260831080000_s107a_acto_unico_aceptacion.sql` — aplicada, cinturón **3/3**,
> residuo 0.

---

## ① El motor no necesitaba nada — y está medido

`p_aceptaciones` **siempre fue un array**: la pantalla ya mandaba las seis en
UNA llamada. La evidencia viva lo prueba — las 6 aceptaciones de la familia real
tienen **el mismo `aceptado_en` al segundo** (30-ago 16:34:45).

> **Lo que había eran seis casillas en la pantalla, no seis llamadas al motor.**

⇒ **El acto único es cambio de superficie.** Es tuyo, C, y no espera nada mío.

---

## ② Lo que sí cambió, y es POR el acto único

**`p_aceptaciones => NULL` ⇒ el SERVIDOR resuelve los vigentes.**

```ts
aceptarDocumentosGuarderia({ familiaId, aceptaciones: null, ... })
```

🔴 **Por qué:** con seis casillas, mandar cinco era **una elección de la
familia**. Con un solo acto, mandar cinco es **un bug** — y su síntoma es una
familia a la que le dijimos que sí y **queda en `faltan` sin entender por qué**.
Con `NULL`, quién decide cuáles son los seis deja de ser el bundle.

**Y hace la prueba más fuerte:** queda registrado exactamente **lo que estaba
vigente en ese timestamp**, no lo que el bundle creía.

## ③ El retorno dejó de ser un contador

```jsonc
{ "ok": true, "aceptadas": 6, "al_dia": true, "faltantes": [] }
```

*Antes devolvía sólo `aceptadas`. **`aceptadas: 5` se lee como éxito** — y la
pantalla decía que sí mientras la familia quedaba trabada.* **Un contador no es
un veredicto.**

⚠️ **La pantalla lee `al_dia`, no `aceptadas`.**

---

## ④ Compatible hacia atrás

Con lista explícita se comporta igual que siempre. `NULL` antes no hacía nada
útil (caía a `[]` = cero aceptadas), así que **ningún llamador vivo cambia de
comportamiento**.

---

## ⑤ 🔴 EL TOPE DE URGENCIA **NO SE AFLOJÓ** — y es a propósito

Sigue obligatorio: guard en la función, columna `NOT NULL`, `CHECK > 0`.

**Retirarlo choca con `CRITERIO_LEGAL_GUARDERIA` §4**, que nombra el documento
como *«autorización de urgencia veterinaria **con tope de gasto y cadena de
contactos**»* — no es un detalle del flujo, es uno de los dos elementos que el
abogado nombra de ese documento.

**Y son dos cosas distintas que conviene no confundir:**

| | ¿lo pide el criterio? |
|---|---|
| que el tope **exista en la autorización** | **sí, explícitamente** |
| que la familia **lo tipee para terminar el flujo** | **no dice nada** |

⇒ **Sacarlo de la PANTALLA no choca. Sacarlo del CONTRATO sí.** La decisión está
servida al founder; hasta que firme, el motor lo sigue exigiendo. **C: no lo
saques de la pantalla todavía** — hoy rebota `tope_de_urgencia_invalido`.

## ⑥ El contacto alternativo YA es opcional

`contacto_alternativo` es `nullable` y `p_contactos` cae a `[]`. **Cero cambio de
motor.** Lo único que hace falta es de texto: **sin contacto alternativo, el
animal se entrega sólo al dueño** — la prohibición 5 se apoya en esa lista.
