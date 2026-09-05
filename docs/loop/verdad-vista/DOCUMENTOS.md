# La verdad vista — protocolo de las TRES FIRMAS

> **La verdad no la escribe una sola mano.** D transcribe a ojo, E transcribe
> los mismos documentos **por separado y sin ver la de D**, y lo que no coincida
> **lo dirime el founder mirando la foto**. La referencia queda firmada por tres
> y **es anterior a toda corrida contra el modelo**.

---

## 🔴 Primero: NO son cinco carnets. Son DOS documentos.

Medido mirando las cinco fotos, una por una:

| documento | fotos | filas de «verdad» en el conjunto |
|---|---|---|
| **A** — tabla de dos páginas, MVZ Enrique López Sánchez | `carnet-1783564367515.jpg` | **1** |
| **B** — carnet plegable vertical, Clínica Protectora de Animales | `carnet-1785354131272.jpg` · `carnet-1783694984605.jpg` · `carnet-1783632653859.jpg` · `carnet-1783633828265.jpg` | **8 + 7 + 8 + 8 = 31** |

**El documento B está fotografiado CUATRO veces y cargado CUATRO veces.** Sus
cuatro cargas describen las mismas 8 vacunas y **se contradicen en 6 de ellas**:

```
DIFIERE nobivaclep | 2023-06-04 | 2023-06-05 | 2023-05-10 | 2023-04-19
DIFIERE nobivacdhp | 2023-05-05 | 2023-06-26 | 2023-06-05 | 2023-06-26
DIFIERE vanguardda | lote 56288 | lote 562887 | lote 56288.7 | —
DIFIERE procyondog | 02031203  | 02031203   | 18KL10-01   | 190L-01
DIFIERE nobivackc  | 2023-08-03| 2023-08-03 | 2023-08-13  | 2023-08-03
DIFIERE canigenlr  | 2024-07-06| —          | 2023-06-26  | 2024-07-06
```

⇒ **«5 carnets · 32 filas de verdad» es, en realidad, 2 documentos · ~23 vacunas
distintas · 32 lecturas humanas que no coinciden entre sí.**

---

## Los archivos

```
documento-A--D.json   ← transcripción de D (15 filas)
documento-B--D.json   ← transcripción de D (8 filas)
documento-A--E.json   ← LA ESCRIBE E, sin leer la de D
documento-B--E.json   ← LA ESCRIBE E, sin leer la de D
documento-A--FIRMADA.json   ← la que sale del arbitraje del founder
documento-B--FIRMADA.json   ← ídem
```

## La orden para E

1. **No abras `*--D.json` hasta haber escrito los tuyos.** Si los leés primero,
   la segunda mano deja de ser una segunda mano y el protocolo no mide nada.
2. Bajá las fotos: `node scripts/ia-conjuntos/construir-carnets.mjs --verificar-legibles`
   (deja las imágenes; el script ya las abre para el control de legibilidad).
3. Transcribí **mirando**, con el mismo esquema de campos que usé yo. Regla que
   los dos seguimos igual, o el cotejo no significa nada:
   - **Lo que no está escrito en el carnet va `null`.** Sin día, mes Y año ⇒
     `null`. **No completes el año desde la fila de al lado.**
   - Cada fila lleva `evidencia` y `confianza`.
   - Si dos stickers son **una dosis**, es **una** fila; si son dos productos
     distintos, son dos. Cuando dudes, **anotalo en `nota` en vez de decidir**.
   - Todo lo que no puedas leer va a `lo_que_NO_pude_leer`, con su razón.
4. `node scripts/ia/cotejar-verdad.mjs --doc B` cuando los dos existan.

## El arbitraje del founder

El cotejo saca **sólo los desacuerdos**, con la foto y el campo. El founder
mira y firma. Lo que los dos leímos igual **no se somete a arbitraje**: se da
por bueno y se dice que se dio por bueno *porque coincidimos*, que no es lo
mismo que *porque es verdad* — dos lectores pueden equivocarse igual.

## Recién entonces

La matriz completa: **prompt v1 y v2 × Sonnet 5 y Haiku 4.5**, medida contra la
referencia firmada. Y las tres hipótesis **si hacen falta** — con la vara
corregida puede que ninguna haga falta.
