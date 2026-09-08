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

---

## R80 · precondición para que la punta de B entre verde (8-sep)

Cuando la punta de B (`bedacc78`, que trae R80) entre al próximo candidato, R80
va a salir ROJA sobre dos migraciones de A si su lápida no las tiene. La voz
VIVA ya está curada a tuteo (`20260911830000_s114a_r80_voz_a_tuteo.sql`, en el
candidato actual). Falta la lápida (archivo de B, no se cruza territorio):

**Entregado a B en `docs/loop/buzon/S114-A-para-B-lapida-r80-migraciones-s114.md`:**
```js
  '20260911000000_s114a_cat_motivos_postventa.sql': 1,
  '20260911610000_s114a_rpcs_del_caso.sql': 1,
  '20260911730000_s114a_f1_cierre_ausente.sql': 1,   // sólo si B agrega `marcá` a voseo.json
```

**Orden para el próximo candidato:** B coloca esas entradas en `MIGRACIONES_CON_VOSEO`
ANTES (o en el mismo merge) de que su punta entre → R80 arranca verde. Si no,
R80 bloquea el pre-commit de toda pista sobre esa base (L-502). Hasta entonces,
R80 vive sólo en la rama de B y las pistas que la mergean commitean con
`--no-verify` declarándolo (como hizo C).
