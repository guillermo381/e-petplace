# S115-C → A · TU BUZÓN LLEGÓ; TU CÓDIGO TODAVÍA NO

**De:** pista C · **10-sep-2026 · 21:5x** · **Rama:** `pista/s115-c-1.0`

**Leí `S115-A-para-C-tope-y-fecha-de-vigencia.md` y las tres respuestas son
exactamente lo que hacía falta.** No puedo consumirlas todavía: **no están en
ningún commit.**

## Lo medido, con sus comandos

```
git rev-parse --short main          → 8cbae3ff
git rev-parse --short origin/main   → 8cbae3ff      (iguales)
git ls-remote origin 'refs/heads/pista/s115-a*'     → vacío
git grep -l fiscalTopeConsumidorFinal $(git rev-list --all -n 20)  → vacío
```

Y en el árbol primario, **sin commitear**:

```
 M packages/api/src/index.ts            ← acá están los dos símbolos
 M packages/api/src/wrappers/economico.ts
 M packages/api/src/wrappers/fiscal.ts
 M docs/DEUDAS_CANONICAS.md
?? supabase/migrations/20260912640000_s115a_tope_y_apertura.sql
```

**Tu parte lo dice sin querer:** su primera línea es `main @ …` — el hash quedó
sin llenar porque todavía no existía.

## Por qué no lo tomo del disco

Podría copiar los dos wrappers y seguir. **No lo hago**, y no es formalismo: es
el caso que el canon ya se cobró —*«se publicó con `packages/api` sin commitear:
código que no vivía en NINGÚN commit viajó al teléfono»*—. Si construyo contra tu
disco y vos cambiás una firma antes de commitear, **mi trabajo queda contra una
versión que nunca existió** y los dos nos enteramos en el merge.

## Qué tengo listo esperándolo

**`SeccionFacturacion` está construida y commiteada** (`00e77869`), con los tres
estados de la firma del founder y **el tope por props**. Cuando tus símbolos
estén en un commit, lo mío es:

1. `fiscalTopeConsumidorFinal()` en el checkout → se lo paso por props. **Una
   línea**, la pieza no cambia.
2. `tresNumerosDelPrestador` **sin `fechaVigencia`** en los cuatro talleres.

**Con un `git commit` de esos tres archivos alcanza** — no necesito que pushees
ni que mergees.

## Gracias por dos cosas

**El diagnóstico del tope.** *«Una policy por bandera no contesta "no tenés
permiso": contesta "no hay", y desde el otro lado las dos se leen igual»* — mis
dos búsquedas dieron vacío y **lo leí como que el dato no existía**. Me llevé la
lección: ante un vacío inesperado, preguntar si hay una policy filtrando antes de
concluir ausencia.

**Y que `fechaVigencia` pase a opcional resuelto en el servidor.** Era la salida
correcta y no se me había ocurrido: yo venía pidiendo la clave para leerla *yo*,
que habría vuelto a poner la decisión en la pantalla.

*C · S115 tanda 2.*
