# Lote de D — papeles clínicos SINTÉTICOS · S113 fase 3

**Semilla `1130744`.** Generado del generador que dejó el founder, con salida
propia: E arma su lote y su mano, D el suyo, y ninguno lee el del otro.
*Dos manos sobre el mismo lote no son dos mediciones: son una con dos lectores.*

## 🔴 QUÉ ES ESTO Y QUÉ NO — firma del founder, 7-sep-2026

**Son SINTÉTICOS y no hay más. No se pide un papel real: hoy no existe.**

**Mide LA LEY** — que `extract-papel` no interpreta, que transcribe con su
unidad y su referencia, y que **no inventa marcas** — y es **tablero de
regresión**: el día que alguien toque el prompt, esto dice si se rompió algo.

**NO mide la variedad del papel real**: manuscrito, stickers, papel arrugado,
una foto torcida sacada en un mostrador.

🔴 **Ningún porcentaje de acá se cita como exactitud sobre papeles de verdad.**
Es un **PISO**, y se dice cada vez. Medir con papeles reales es **`D-1047`**,
cuando lleguen las primeras familias.

## La vara está CURADA, y por qué hizo falta

Medido sobre las 46 fuentes del generador: `⁶` y `⁹` (bloque Superíndices) en
**0 de 46**; `³` (Latin-1) en **46 de 46**; `↓` en 12 de 46. ⇒ el papel mostraba
un cuadro vacío donde el `ground_truth` declaraba la unidad o la marca.

**Las filas cuya vara el artefacto no puede llevar se corrigen en la vara, no se
le cobran al modelo** (firma del founder). Curado acá:
* superíndices → `^n` en **un solo estilo** — mezclar `x10³` con `x10^6` hacía
  que el modelo normalizara todo a `^` y aparecían 32 diferencias que no lo son;
* la celda de la marca usa una fuente que **sí** tiene la flecha.

Verificado **abriendo la imagen**, no leyendo el código: la `↓` de Albúmina se
dibuja. *Una verdad que nadie contrastó contra el artefacto es una premisa.*

## El piso medido (15 exámenes · 190 analitos · Sonnet · una corrida)

| | |
|---|---|
| filas emparejadas | **190/190** — devolvió exactamente 190 |
| valor | **190/190** (incluida la coma decimal) |
| unidad | **190/190** |
| referencia | **190/190** |
| marca ASCII (`H` `L` `*`) transcrita | **6/6** |
| 🔴 **marcas inventadas** | **0 sobre 178 filas sin marca** |
| 🔴 **adjetivos de juicio** | **0** |
| costo | $0,024 por papel |

Las 178 filas sin marca incluyen **13 fuera de rango que no la llevan**: son las
que delatarían interpretación, y el modelo no puso una sola bandera de más.

## Correrlo

```
LOTE_D=<esta carpeta> deno run --allow-read --allow-net --allow-env --allow-run \
  scripts/ia/papel-real-clinico.ts     # 🔴 MODELO REAL: gasta (~$0,36)
```
Sin filas emparejadas **sale con 2 y dice NO CONCLUYENTE**: un cero sobre cero
no es un aprobado, es la ausencia de la prueba.
