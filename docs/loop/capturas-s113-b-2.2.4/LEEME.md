# Capturas S113-B · 2.2.4 «El glifo de Pasaporte y QR» — GATE PENDIENTE

Receta: Metro en el puerto propio de B (**8092**), `Android Bundled … (2995
modules)`, emulador `5554` (el `5556` es `s113_A`, intacto). Sonda retirada,
`apps/` en cero, `router.d.ts` regenerado.

## ✅ Lo confirmado primero: `documentos` EXISTE

`Icono.tsx:1679` — dos rectángulos apilados + huella, en la unión y con su
capa. **Se ve en las capturas, tercero de la fila de acciones.**

## 🔴 La forma la decidió la ARITMÉTICA, antes de dibujar

Vara `vacuna` = **46,4** · banda ±15 % = **39,4–53,4** · Ley 9 = interior
≥ **2,5 px** a 21.

| candidata | veredicto | número |
|---|---|---|
| **QR de TRES esquinas** | ☠️ **INCONSTRUIBLE** | masa exige `s ≤ 4,45` · Ley 9 exige `s ≥ 4,76` — **intervalo vacío** |
| **tarjeta con QR adentro** | ✗ descartada dos veces | la tarjeta sola pesa **64 (+38 %)**; achicada, el QR de adentro tendría interior **0,26 px** |
| **V1 · dos esquinas + la pata de tercera** | ✅ en el registry | masa **41,6 (−10 %)** · **2 trazos** · interior **2,89 px** |
| **V2 · macizo (esquinas rellenas)** | 🕐 en la hoja, hasta el gate | masa **46,4 (0 %)** — *pero ver el límite de abajo* |

*No es que los números estuvieran mal calibrados: la forma de tres esquinas no
admite las dos leyes a la vez* (`L-283`, la anatomía incapaz). Se descubrió con
una cuenta **antes** de dibujar, no con tres calibraciones fallidas.

## ⚠️ El límite declarado de la medición

La masa mide **largo de path**, que es proxy de tinta **sólo si todo va trazado
a 1.9**. La tinta de un relleno es su **área**. ⇒ **el 46,4 de V2 no es
comparable al 41,6 de V1**, y por eso no decidí por ese número.

## 🔴 Lo que decide, y lo dijo el aparato: a 21 px

**V1 sobrevive; V2 se vuelve ruido** — sus módulos rellenos de 1,6 casi
desaparecen y quedan como suciedad al lado de la pata. Por eso V1 está en el
registry. **V2 queda montada en la hoja hasta el gate y muere con él** (Ley 37).

⚠️ **Y lo digo entero: ninguna de las dos lee inequívocamente «QR».** Las
esquinas de un QR real son cuadrados ANIDADOS, y eso a 21 px no entra en el
lenguaje de trazo de la casa — es la misma pared que hizo inconstruible el de
tres esquinas. **El gate es del founder** (§6b.5, y es de a uno).

## Dos iteraciones que el ojo rechazó, para que no se repitan

1. **Con dos módulos sueltos**: a 44 px se leían como suciedad y a 21 px como
   una mancha.
2. **Con la pata lejos del vértice**: quedaba como nota al pie, no como la
   tercera esquina. Hoy su centro cae en la MISMA columna que el cuadrado de
   arriba — *un QR tiene tres esquinas, y la cuarta vacía es parte de la forma.*

## El índice

| archivo | qué prueba |
|---|---|
| `01-pasaporte-claro` | V1 y V2 a 21 y 44 px, sus cinco vecinos, y la fila donde vive |
| `02-pasaporte-oscuro` | lo mismo en oscuro |
