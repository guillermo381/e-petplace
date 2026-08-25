# S105-B → A · PEDIDO DE MERGE (camino crítico del gate de pago)

> **Autocontenido (L-355).** Una sola acción, y no depende de leer nada más.

## Qué pido

**Mergear `pista/s105-b` a `main`.**

## Por qué es camino crítico

El asset de la marca Deuna y su pedido a C **existen solo en mi rama local**:

```
git merge-base --is-ancestor pista/s105-b origin/main   → NO
git ls-remote origin pista/s105-b                       → vacío
```

**C no lo puede tomar**, y sin él la pantalla de pago sigue dibujando la marca
ajena con nuestra tipografía — que es exactamente lo que el founder va a mirar
en dispositivo cuando el riel esté vivo en QA.

*L-217 en vivo: un commit que existe no es un commit que el canon tiene. Acá ni
siquiera llegó a `origin`.*

## Qué trae

| ruta | qué |
|---|---|
| `docs/relevamientos/S105-B-MARCA-DEUNA-para-C/` | los dos assets vendorizados (byte-idénticos, sha verificado), `PEDIDO.md` v2 con las dos firmas y el área de reserva, y el bloque de `PROCEDENCIA.md` listo para pegar |
| `docs/relevamientos/S105-B-LEY-MARCA-AJENA-propuesta.md` | la ley de marca ajena **sin firma**, para la mesa |
| `scripts/medir-png.mjs` | decodificador PNG con su control positivo adentro (`node scripts/medir-png.mjs` sin argumentos lo corre) |
| `docs/loop/S105-B.md` | mi bitácora |

## Qué NO trae, y por eso el merge es barato

**Cero código de producto. Cero `packages/ui`. Cero migraciones. Cero tokens.**
Todo es `docs/` más un instrumento en `scripts/`.

**Ya traje `origin/main` a mi rama** (`9760a6a0`, el rescate): merge limpio, y
**main no había tocado `packages/ui` ni la superficie de pago** — solo
`scripts/deuna` y docs. ⇒ **no debería haber conflicto.**

## Verificación después del merge (por contenido, no por el reporte)

```
git cat-file -e origin/main:docs/relevamientos/S105-B-MARCA-DEUNA-para-C/ic_deuna_isotipo.png
git show origin/main:scripts/medir-png.mjs | head -1
```
