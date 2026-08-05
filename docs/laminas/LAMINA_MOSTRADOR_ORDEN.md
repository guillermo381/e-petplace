# LÁMINA — EL ORDEN DEL MOSTRADOR

> **✅ FIRMADA POR EL FOUNDER — 5 de agosto de 2026.**
> **Archivo propio, y no enmienda de `LAMINA_BARRA_DE_TRES`, a propósito:**
> esta regla **aplica a TODOS los roles**. Enterrarla en la lámina del
> no-gestor la volvería invisible para quien busque la composición del
> mostrador, y haría creer que es una regla de ese actor. *Una lámina de una
> casa no puede llevar una ley de toda la calle.*
> **C construye contra ella junto con el lote de roles.**

---

## 1. EL ORDEN, firmado

```
┌─────────────────────────────┐
│  SELECTOR DE FECHA          │   ← qué día estoy mirando
├─────────────────────────────┤
│  ▸ REGISTRAR ATENCIÓN       │   ← LA ACCIÓN, pegada a la fecha
├─────────────────────────────┤
│  filtros                    │   ← acomodan lo que viene abajo
├─────────────────────────────┤
│  la lista                   │
└─────────────────────────────┘
```

## 2. EL PORQUÉ — y es lo que hay que conservar aunque la pantalla cambie

> ### **El registro es LA ACCIÓN del mostrador, no un resultado del filtro.**

- **Vive pegado a la fecha** porque lo que se registra es *una atención de este
  día*. La fecha es su contexto, no su filtro.
- **Los filtros acomodan la lista que viene abajo** — su alcance es lo que
  sigue, no lo que está arriba.

*Si el botón queda debajo de los filtros, la pantalla sugiere que registrar es
algo que se hace **sobre lo filtrado**. No lo es: se registra a quien está
parado en el mostrador, y esa persona no está en ninguna lista todavía.*

**Aplica a todos los roles.** No es una regla de recepción: es la composición
de la superficie.

---

## 3. EL DELTA MEDIDO — para que C no busque a ciegas

**Hoy** (`apps/prestador/src/components/agenda-recepcion.tsx`, medido 5-ago):

| línea | qué hay |
|---|---|
| ~338 | `<Boton etiqueta={t('recepcion.registrarAtencion')}` |
| ~346 | `<SelectorSegmentado` con `hoy` / `adelante` |
| ~380+ | la lista |

⇒ **El botón está ARRIBA del selector de fecha. La letra lo pone DEBAJO.**
El cambio es de orden, no de piezas: **se mueven dos bloques, no se construye
ninguno.**

> **⚠️ Una precisión que C tiene que resolver en pantalla, no acá:** el
> `SelectorSegmentado` de `hoy`/`adelante` **es el selector de FECHA**, no un
> filtro — por eso va primero. **Si además existieran filtros propios** (por
> persona, por estado), esos van **debajo del botón**. *Hoy no los medí como
> piezas separadas; que las haya o no lo confirma quien tenga la pantalla
> delante* (L-143: las leyes se firman sobre píxeles).

---

## 4. Lo que esta lámina NO decide

- **El acabado del botón** (variante, ancho, tono): `DIRECCION_ARTE` y §15b.
- **Qué filtros existen.** Esta lámina ordena; no inventa filtros
  (`agenda-recepcion.tsx` declara en su cabecera que **no se inventa ningún
  filtro** — eso sigue rigiendo).
- **Qué ve cada rol en el mostrador.** Eso es de
  `LAMINA_BARRA_DE_TRES` §1 y de la letra de recepción que la mesa dibuja
  aparte.
