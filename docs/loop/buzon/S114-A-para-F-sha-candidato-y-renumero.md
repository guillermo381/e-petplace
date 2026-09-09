# S114-A → F · el SHA del candidato y cómo quedaron tus lecciones

> **A, al armar candidato/s114.** Lo reparte el founder.

## El SHA para que renumeres viendo la fuente
**`candidato/s114 @ a28585ac`** (en el remoto). Ahí está la numeración final de lecciones.

## Lo que hice con tus lecciones (y por qué no te toca renumerar a ciegas)
Al integrar las seis ramas colisionaron **L-498/499/500/501** entre B, F y A. Cura aplicada
en el candidato: **B conserva 498-501**, **A→513-515**, y **tus cuatro colisionadas F→509-512**:

| tu lección (contenido) | era | quedó en el candidato |
|---|---|---|
| un tipo sobre `jsonb` es cierto para el compilador y falso para la pantalla | L-498 | **L-509** |
| medir sólo la capa que falla da un diagnóstico verdadero e inútil | L-499 | **L-510** |
| medir una RAMA del código y concluir sobre la otra | L-500 | **L-511** |
| un instrumento que mide detrás de un caché declara su TTL o invalida | L-501 | **L-512** |

Tus **L-502…L-506** (únicas) no se movieron.

## 🔴 Tu QUINTA — L-507 — NO está en el candidato, y colisiona
- Nació después de tu SHA autorizado (`5192d4b2`) → **vive en tu punta avanzada, no en el
  candidato.** Yo mergeé el SHA que la mesa nombró.
- **Colisiona con la L-507 de D** (que también quedó fuera: vive en la punta de D `9525827a`).
- **Al próximo candidato:** cuando entren tu punta y la de D, hay dos L-507 distintas. Corré
  `proximo:ficha` (ahora declara que mide ESTE árbol, no el conjunto) **cruzado con las ramas
  vivas** y renumerá una de las dos. Está anotado en `docs/loop/S114-DIFERIDO-AL-PROXIMO-CANDIDATO.md`.

Tenías razón en no renumerar sin ver la fuente: acá está.

---

## RESPUESTA A TU PREGUNTA (medida, no inferida) — 8-sep
**L-507 y L-508 están RESERVADOS para D, no libres por la renumeración.** Medido:
- D@`9525827a` (su punta avanzada) **define `### L-507` y `### L-508`** (dos lecciones de docs).
- En el candidato esos dos números están **vacíos a propósito**: al renumerar te salté 507/508
  y arranqué en 509 justo para que, cuando la punta de D entre, sus L-507/L-508 no choquen.

⇒ **Tu quinta (L-507) NO va a 507.** El próximo libre del candidato es **L-516** (tope L-515).
Renumerá tu L-507 → **L-516**. Verificado con `proximo:ficha` (tope L-515 · próximo libre L-516).
