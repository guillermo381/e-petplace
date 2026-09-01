# EL BUZÓN DE S111 — cómo se coordinan cuatro pistas sin founder

> **Nace:** 1-sep-2026. **Rige mientras el founder esté ausente.**

---

## LA FORMA

**Un archivo por asunto**, en TU rama:

```
docs/loop/buzon/S111-<vos>-para-<destino>.md
```

`<destino>` es `A`, `B`, `C`, `D` o `MESA` (lo que espera al founder).
**A lo mergea en su ronda.** Cada ciclo tuyo arranca con `git fetch` y leer el
buzón **en `origin/main`**, no en tu rama.

**Cada archivo trae, sin excepción:**

1. **UN SOLO ASUNTO.** 🔴 `L-463`: *un sha anunciado dentro de un mensaje sobre
   otra cosa es una posdata, y una posdata no entra en ninguna cola.* Se pagó en
   S110 con **ocho commits** que estuvieron pusheados, anunciados y fuera del
   canon durante horas.
2. **El SHA COMPLETO**, no abreviado, y la rama.
3. **EL ALCANCE DECLARADO**: qué archivos, y si toca código o sólo docs.
4. **CÓMO SE VERIFICA**: qué tiene que dar verde del otro lado.

---

## LAS TRES COSAS QUE SÓLO PUEDE HACER A

- **Escribir `main`** (regla 88). Nadie más mergea.
- **Asignar números `D-NNN` y `L-NNN`.** 🔴 Mandás la ficha **SIN número** por
  buzón y A se lo pone. *La regla 89 —releer el máximo y escribir en el mismo
  acto— no aguanta cuatro manos sin mesa: dos pistas que leen bien el máximo
  con minutos de diferencia colisionan igual.*
- **Escribir `docs/loop/S111-ESTACIONAMIENTO.md`.** Las demás lo alimentan.

---

## PEDIR UN MERGE

Archivo propio, con este cuerpo mínimo:

```
PEDIDO DE MERGE
rama : pista/s111-<x>
sha  : <40 caracteres>
alcance : N archivos · <código | sólo docs>
verificación esperada : <qué gate, con qué número>
```

**Y nada más en ese archivo.** Lo que le debas a A sobre el contenido va en
**otro** archivo del buzón.

⚠️ **A corre el control de ancestría sobre TODAS las ramas de la sesión después
de cada merge** —incluidas las que no pidieron nada— porque *un control que sólo
mira lo que le señalaron tiene el mismo punto ciego que la persona*. Pedir bien
acelera; no pedir **ya no** te deja afuera.

---

## SI ALGO TE FRENA

**Buzón + siguiente ítem del backlog.** Jamás ociosa, jamás construir encima del
freno.

Si lo que falta es una decisión de **PRODUCTO**, va al estacionamiento con sus
cinco partes: qué falta · opciones (a)/(b) · tu voto · **qué construiste
alrededor, fail-closed** · qué se rompe si se elige mal.

> 🔴 *Una entrada sin «qué construiste alrededor» no está estacionada: está
> abandonada.*

---

## LO QUE NO CAMBIA PORQUE EL FOUNDER NO ESTÉ

Medir antes de tocar, con **controles de dos colores** · `L-459`: **el rojo
primero**, y sobre un caso real · **reversa escrita ANTES** de cada migración ·
**entregada ≠ montada** · tokens, jamás hex a mano · **el vocabulario del motor
no sale a la UI**.

Y `L-462`: **todo freno declara contra qué midió Y a qué hora** — *un cero
verdadero caduca, y quien lo cita después no tiene forma de saber que venció.*
