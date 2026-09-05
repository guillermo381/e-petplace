# D → E · la `service_role` del llavero está truncada (y la de Anthropic anda)

**4-sep, S113-D-2.1.** El founder dejó dos llaves en el llavero de esta Mac,
cuenta `medicion`. **Una anda y la otra no**, y lo digo antes de que pierdas una
hora bajando los carnets.

## Cómo se leen (las dos, igual)

```bash
security find-generic-password -a medicion -s anthropic-medicion     -w
security find-generic-password -a medicion -s epetplace-service-role -w
```

## ✅ `anthropic-medicion` — VIVA

Largo **108**, prefijo `sk-ant-…`. Probada con `count_tokens` (que es gratis y
no consume salida): **HTTP 200**, `{"input_tokens":9}`.

## 🔴 `epetplace-service-role` — NO SIRVE. Está truncada.

**Medido, en dos servicios distintos:**

| prueba | resultado |
|---|---|
| `POST /storage/v1/object/list/mascotas` | **403** · `{"error":"Unauthorized","message":"Invalid Compact JWS","code":"AccessDenied"}` |
| `GET /rest/v1/cat_razas?select=slug` | **401** · `{"message":"Invalid API key"}` |

**Y la forma lo explica:** largo **128**, **UN solo punto**. Un JWT tiene **dos**
(header · payload · firma). Le falta la firma, y con ella ~90 caracteres. *«Invalid
Compact JWS» es literalmente el servidor diciendo «esto no es un JWT completo».*

⚠️ **Y una trampa que casi me come:** mi primera prueba dio **400** con
`body must have required property 'prefix'` — un error de FORMA del request, que
llega **antes** de que se evalúe la credencial. **Con ese 400 escribí «service_role
VIVA» y estaba equivocado.** Recién al mandar un request bien formado apareció el
403 real. *Un 400 de forma tapa un 403 de auth: no alcanza con «no dio 401».*

### Mientras tanto, cómo bajás los carnets igual

La vía de tu propio `lib-conjuntos.mjs` **sigue funcionando** — resuelve la
`service_role` del CLI autenticado, no del llavero:

```bash
node scripts/ia-conjuntos/construir-carnets.mjs --verificar-legibles
```

Yo bajé los cinco así. **No hace falta que el founder rote nada para que
avances**; lo que sí hace falta es que reponga la del llavero completa si la
quiere como vía oficial.

## Y lo que te toca del protocolo

`docs/loop/verdad-vista/DOCUMENTOS.md`. **Antes de abrir mis JSON**: son **DOS
documentos**, no cinco carnets — el plegable vertical está fotografiado cuatro
veces. Y el del `1 → 12` tiene **quince** vacunas, no una.

*No te digo más para no contaminarte la lectura: ésa es toda la gracia de que
seas la segunda mano.*
