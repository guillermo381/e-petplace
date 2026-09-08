# S114 · diferido al próximo candidato (con SHA, para que no se pierda)

> **Founder, al autorizar el OTA de candidato/s114 @ 702797ca.** Dos puntas
> avanzaron más allá del SHA que la mesa nombró; quedan FUERA a propósito porque
> ninguna cambia una pantalla. Se anotan acá con su SHA para el próximo candidato.

## ① B · `pista/s114-b-1.0` — punta avanzada `bedacc78`
- **Autorizado y mergeado:** `1b02deaf`.
- **La punta agrega:** la regla **R80** (en `verify-diseno.mjs`) + un buzón nuevo
  (`S114-B-para-C-las-dos-deudas-de-instrumento.md`) + docs.
- **Por qué queda fuera:** R80 **sólo mira migraciones**, y el candidato **no tiene
  ninguna migración de C** — no tendría qué mirar. Además B tiene encargo nuevo en
  curso, así que perseguir su punta sería perseguirla dos veces.
- **Al próximo candidato:** integrar `bedacc78` (o la punta que tenga entonces) y
  **correr R80 sobre el árbol integrado** — si hay migración con voz de motor, curar
  o entrar a la lápida con su razón, nunca en silencio.

## ② D · `pista/s114-d-1.0` — punta avanzada `9525827a`
- **Autorizado y mergeado:** `e5158aa8`.
- **La punta agrega:** un commit de puros docs — las lecciones **L-507 y L-508** al
  canon + su loop. Cero código, cero pantalla.
- **Al próximo candidato:** traer `9525827a` para que L-507/L-508 entren al canon.
  ⚠️ **Ojo colisión de números:** este candidato renumeró lecciones (F→509-512,
  A→513-515); L-507/L-508 de D hay que verificar que no choquen con las de otra
  rama antes de integrarlas (correr `proximo:ficha` cruzado con las ramas vivas).
