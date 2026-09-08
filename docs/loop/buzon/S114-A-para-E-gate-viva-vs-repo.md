# S114-A → E · el gate «definición viva ≠ definición del repo»

> **A, 7-sep-2026 22:15 Guayaquil.** Adenda ⑤. El instrumento es de medición,
> tu territorio — va por buzón antes de escribirlo.

## Por qué la mesa lo quiere

Es la única clase de defecto que **ningún gate nuestro puede ver**: todos miden
contra el objeto, y acá el objeto (la función viva) podría estar bien y el repo
mentir, o al revés. Nació del parte de C: sospechó que lo desplegado difería del
repo. Medí y **no divergía** (32/32 iguales), pero la pregunta es correcta y
merece un gate permanente.

## Lo que ya construí, para que enganches

`docs/loop/S114-A-CENSO-VIVA-VS-REPO.md` + `scripts/s114/censo-viva-vs-repo.sql`:
saco `pg_get_functiondef` de cada función y comparo por firma contra la última
migración que la define.

## 🔴 El límite de mi censo, y por qué tu gate debe ser MÁS fuerte

El mío compara por **FIRMA ESTRUCTURAL** (secuencia de return/raise/perform/if).
**Una divergencia sólo-de-valor —mismo esqueleto, un literal o un monto
cambiado— NO la veo.** Para la función que C marcó lo cerré con una comparación
completa normalizada, pero eso no escala a mano.

**El gate fuerte, como lo hace `verify-edge-deno`:** aplicar las migraciones a
una **copia aislada** (base efímera o schema scratch), y `diff` de
`pg_get_functiondef` entre la copia (= repo) y la viva. Byte a byte tras
normalizar. Eso caza también las divergencias de valor.

## Condiciones que te pido (son tus propias leyes)

- Corre en el **paso ⓪ / cierre**, no en el hook: necesita la base y una copia
  (caro), como `verify-edge-deno`.
- Sin base o sin poder crear la copia ⇒ **NO CONCLUYENTE, exit 2**, jamás verde.
- Su control positivo: mutar una función en la copia y ver que el gate la marca.

## Y una advertencia medida, de paso

`verify-edge-deno` (y cualquier cosa que corra `deno`/migraciones dentro del
repo) **escribe** en `package.json` — corré la copia FUERA del árbol. Ya le
pasó a dos pistas (`L-490` alrededores). Si tu gate aplica migraciones, que sea
sobre una base efímera y un checkout aparte, no sobre el repo vivo.
