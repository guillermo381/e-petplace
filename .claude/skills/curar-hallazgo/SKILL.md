---
name: curar-hallazgo
description: >-
  Cura UN hallazgo de seguridad, con rojo producido antes y reversa escrita
  antes. Un hallazgo por invocación.
---

# CURAR UN HALLAZGO — el método que no rompe lo que funciona

## UNO POR VEZ
Una invocación = un hallazgo. Si el censo trae ocho, son ocho
invocaciones. Curar en lote es cómo se rompe lo que funcionaba.

## EL ORDEN, Y NO ES PREFERENCIA

**① REPRODUCIR EL HUECO — el ROJO PRODUCIDO.**
Antes de escribir la cura, probá que el hueco EXISTE: un fixture que
ejercita el camino abierto y PASA (porque el hueco está vivo).
Si no podés producir el rojo, PARÁ: o el hallazgo no existe, o no lo
entendiste. Una cura sin rojo previo es fe, no ingeniería.

**② LA REVERSA, ESCRITA ANTES QUE LA CURA.**
Si no sabés cómo volver, no salgas. Y declará qué NO deshace la reversa.

**③ LA CURA, MÍNIMA.**
Solo el hueco. Nada de "de paso mejoro esto". Una cura que toca cuatro
cosas es cuatro riesgos con un solo gate.

**④ EL PAR DISCRIMINADOR.**
Dos brazos como mínimo: el camino abierto ahora REBOTA · el camino
legítimo SIGUE FUNCIONANDO. **El segundo brazo es el que importa** — es
el que prueba que no rompiste lo que andaba.
Fixture in-txn con ROLLBACK, residuo 0.

**⑤ EL CENSO DE LO QUE SIGUE VIVO.**
Antes de cerrar, corré lo que ya existe: typecheck, verify:diseno, los
fixtures vecinos. Una cura de seguridad que rompe una función es un
incidente, no una mejora.

## LAS REGLAS DE LA CASA QUE NO SE SUSPENDEN
- **Escritor único de DB.** Si no sos esa pista, tu migración viaja como
  SQL LITERAL COMPLETO y la aplica quien escribe.
- **Territorio por lista real de archivos**, declarada antes del commit.
- **`git add -A` y `git add .` PROHIBIDOS.** Staging por ruta explícita.
- **Regla 77:** si el runbook no cerró entero, el veredicto es PARCIAL
  con lo que falta nombrado. Jamás "pasado" con asteriscos mentales.

## LO QUE NUNCA HACE ESTA SKILL
- Curar más de un hallazgo.
- Tocar producción sin reversa escrita.
- Relajar un gate para que un test pase.
- Declarar verde sin el segundo brazo del par.
