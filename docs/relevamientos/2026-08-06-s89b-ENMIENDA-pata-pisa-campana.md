# S89-B · orden 7 — LA PATA PISA LA CAMPANA: propuesta con números, medición R32, y el oro donde pisa

> **Enmienda de lámina FIRMADA por el founder EN DISPOSITIVO** (bundle
> `019fd7ef`/`019fd7f0`): la huella va **superpuesta** al glifo (no al lado)
> y **apenas más grande** («muy poco»). Este depósito es la propuesta
> ejecutada por el riel + las dos mediciones que la orden pidió. Las tres
> condiciones intactas: jamás número · jamás rojo · jamás anima.
> Láminas actualizadas: `LAMINA_CAMPANA.md` (la enmienda) y
> `LAMINA_ESQUINA_CAMPANA.md` (la nota vecina).

---

## ① El solape y la escala — con números, sobre la geometría real del glifo

La campana del registry (viewBox 24): domo con tope en `y=2`, hombro derecho
por el arco `(12,2)→(18,8)` y la caída `(18,8)→(21,17)`; trazo 1.9dp.

| | ANTES | PROPUESTA (ejecutada) |
|---|---|---|
| lado de la huella | 12dp | **14dp** — «apenas más grande»: el TERCER escalón del estudio 10/12/14 ya servido en galería (el ojo del founder lo vio; un 13 sería un número que nadie gateó). +17% de lado |
| posición (absoluta en el contenedor del glifo) | `top:-3 / right:-5` | **`top:-1 / right:0`** |
| dónde queda | mayormente FUERA del glifo (caja `x:[17,29]` — el centro a 23, fuera del viewBox) | **centrada en el hombro derecho del domo** (caja `x:[10,24] · y:[-1,13]`, centro `(17,6)`) |
| cuánto PISA | roce (el arco toca el borde izquierdo de la caja) | **~62% del área de la pata sobre el bbox del glifo** — pisa el arco del domo y el arranque de la caída |
| cuánto asoma del contenedor | **5dp a la derecha** (hacia el gap de la esquina) + 3 arriba | **0 a la derecha** · 1 arriba |

## ② Qué pasa con R32 — medido, y el guard queda intacto

El 20dp de la lámina de la esquina **siempre midió zonas TÁCTILES entre
HERMANOS** (campana↔Coach, campana↔insignia). **La huella no es zona táctil**
— vive dentro del MISMO `Pressable` y está oculta del árbol de a11y — así que
la superposición **no cambia nada de lo que R32 mide**: cero brazos nuevos,
cero número nuevo.

**Y el hallazgo lateral que la medición destapó:** la posición VIEJA asomaba
**5dp de tinta hacia el gap** — invisible para R32 porque el absoluto de la
pieza no afecta el layout que el guard lee (el gap de flex quedaba en 20dp
mientras la tinta real dejaba ~15dp visuales). La superposición (`right:0`)
**devuelve los 20dp visuales completos**. La enmienda no solo obedece la
firma: limpia la esquina.

*Actualizado en:* la nota vecina de `LAMINA_ESQUINA_CAMPANA.md` + una línea
en el header de R32 (`verify-diseno.mjs`).

## ③ El oro DONDE PISA — el contraste se mide en la zona de solape

La pata es **OPACA**: cubre el trazo que pisa (occlusión v1). Lo que queda
medible son sus FRONTERAS:

| frontera | ratio | lectura |
|---|---|---|
| oro / muro claro (el fondo alrededor y dentro del solape) | **3.41** | ✓ la silueta de la pata se lee |
| oro / muro noche | **5.95** | ✓ |
| oro / trazo papel — **en los 2–3 cruces** del trazo (1.9dp) con el BORDE de la pata | **1.62** | ✗ **borde blando LOCAL** — segmentos de ~2dp donde el trazo entra/sale de la pata |
| clara (cliente): pink / trazo tinta | 4.63 | ✓ |
| clara (prestador): tealDark / trazo tinta | **2.86** | declarado — hoy NO hay montaje clara en el prestador (su campana vive en el muro); si un día lo hay, se mide con su caso |

### El FOSO — propuesto, decide la mesa (no se ejecutó)

**2dp de recorte del trazo bajo la pata** volvería TODA frontera ≥3:
oro/muro 3.41 · muro/trazo 5.51 — la pata jamás tocaría el trazo. **El costo
que lo manda a la mesa:** exige integración misma-SVG (enmienda de `Icono` —
máscara sobre el trazo), porque un foso PINTADO de un sólido remendaría sobre
el **degradado del cliente**, donde no hay color de foso posible. Si en el
gate el ojo del founder pide más definición que la occlusión, ese es el
camino nombrado.

## ④ Lo ejecutado (riel) y lo que espera

- `Badge`: lado 12→14 · posición superpuesta · comentarios con la enmienda.
  El color no se toca (el oro firmado de la orden 4 rige igual).
- Galería: el estudio 10/12/14 marca **14 como la elegida**; el par del
  defecto y la fila del oro re-renderizan solos con la geometría nueva.
- Capturas re-tomadas para el ojo (`scripts/capturas/s89-b-gate-campana/`).
- **Espera:** el gate del ojo sobre bundle (la veda es de A) — y la decisión
  del foso si la occlusión no alcanza.
