# `D-1029` 🟠 La frontera del carnet es el CONJUNTO, no el prompt

**Nace:** S113-E, 5-sep-2026, midiendo la v2.1 contra la referencia firmada.
**Dueño: D.** **Número pedido con `pnpm proximo:ficha`** (tope `D-1028`).
*La ficha no está depositada en `DEUDAS_CANONICAS.md` — ese archivo es de A.*

## El número

Prompt v2.1, Sonnet 5, por la edge desplegada (v72), contra la referencia
firmada por las dos manos + el founder — **47 filas**:

```
recall de filas   78,7 %   (37/47)
INVENCIÓN         22,9 %   (11 de 48 devueltas)
```

Esas dos son la próxima frontera. Lo demás ya está: `nombre` 100 %,
`fecha_próxima` 100 %, `veterinario` 100 %, `fecha_aplicada` 85,7 %.

## 🔴 Y piden MÁS DOCUMENTOS REALES, no más prompt — con dos mediciones que lo prueban

### ① El conjunto entero son **DOS documentos**, y difieren en 18 puntos

```
doc A (1 imagen,  15 filas)   recall 66,7 %   invención 28,6 %
doc B (4 imágenes, 8 filas)   recall 84,4 %   invención 20,6 %
```

*Las cinco imágenes no son cinco casos: cuatro son el mismo carnet fotografiado
cuatro veces.* El 78,7 % agregado es el promedio ponderado de **dos** cosas que
no se parecen, y está **dominado por la repetición de B**. Pesado por documento
en vez de por fila da 75,6 %.

⇒ **agregar o sacar un documento mueve el número más que cualquier cambio de
prompt.** Con n=2, el conjunto no mide al prompt: mide a esos dos carnets.

### ② El ruido entre corridas es **±3,6 puntos**, con TODO igual

Dos corridas con la **misma referencia, el mismo prompt y el mismo modelo**:

```
nombre            97,3 %  →  100,0 %   (+2,7)
fecha_aplicada    89,3 %  →   85,7 %   (−3,6)
lote, próxima, veterinario, invención, recall  →  sin cambio
```

⇒ **un cambio de prompt que mueva menos de ~4 puntos por campo es
indistinguible del ruido de tirar dos veces.** Iterar el prompt sobre estos dos
documentos va a producir mejoras que no se pueden separar del azar — y peor:
*se van a poder «confirmar» corriendo de nuevo hasta que salga el número que uno
espera.*

## Lo que sí paga, en orden

1. **Más documentos reales y DISTINTOS.** No más fotos de los mismos: **más
   carnets de otras clínicas, con otras plantillas.** Los dos que hay ya
   muestran 18 puntos de diferencia entre sí; el tercero y el cuarto son los que
   dicen si 78,7 % es el número del modelo o el de estos dos papeles.
2. **Antes de tocar el prompt, fijar el piso de ruido**: 3 corridas de la
   configuración actual sobre el mismo conjunto. Sin esa banda, ninguna mejora
   es reportable.
3. **El sintético sirve de tablero de regresión y NO de vara.** Ahí Sonnet da
   ~100 % y Haiku parece pasable; sobre los reales Haiku se cae a 10 % en
   `fecha_aplicada`. *Un cambio que mejora el sintético y no toca los reales no
   mejoró nada.*

## Y dos cosas que la firma del founder destrabó, por si ayudan a leer el resto

- **`FECHAS FABRICADAS: 2 de 8.`** Una fila cuya fecha tiene día y mes sin año
  tiene **una sola respuesta correcta: `null`**. Antes eso se contaba como «sin
  verdad» y no se puntuaba ⇒ **inventar el año no costaba nada, y el modelo lo
  hizo dos veces sin que se viera.** Es un contador nuevo, no un empeoramiento.
- **`evidencia` sigue sin puntuarse.** Las dos manos nos partimos **4 a 0** en
  las mismas filas: en este carnet el sticker no trae la fecha de aplicación y
  la fecha está manuscrita al costado, y el vocabulario no tiene un valor para
  ese caso. **El modelo lo declaró `sticker_con_fecha` en 43 de 48 filas** — o
  sea que eligió un lado de una ambigüedad que ni dos lectores humanos con la
  misma regla resolvieron igual. *Si ese campo va a decidir algo, primero hay
  que decidir qué significa.*

## Dónde está todo

- referencia firmada · `~/.epetplace/ia-conjuntos/manos/documento-{A,B}--FIRMADA.json`
  (git local, sin remoto — `52f010e`)
- `pnpm verify:cotejo --doc A` · `--doc B`
- la corrida · `node scripts/ia-conjuntos/medir-carnet.mjs --prompt=v2 --conjunto=carnets-referencia`
