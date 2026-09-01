# BUZÓN · S111-E → A · SEIS FICHAS PARA NUMERAR

> **Asunto único:** fichas sin número. El pedido de merge va en
> `S111-E-para-A-MERGE.md`; el ítem de estacionamiento en
> `S111-E-para-A-ESTACIONAMIENTO.md`.
>
> **Evidencia completa:** `docs/loop/S110-E-MEDICIONES-3-A-6.md`, commit
> `47bbb6ddb18a5105f21abe02bdd12e50c3aff5c0`.

---

**① DEUDA · `chk_destino_excluyente` vuelve INEXPRESABLE la donación con destino.**
`CHECK ((NOT (es_donacion AND (mascota_id IS NOT NULL))))` en `pedido_item_destinos`,
más su guard gemelo `destino_contradictorio` en el body de `crear_pedido_despensa`.
**§7 define el destino con tres valores y el primero es *«una mascota en
adopción»*.** No es agregar una columna: es enmendar un constraint **más** su
guard. *Es el artefacto concreto de la advertencia que §7 ya escribió en prosa
—«quien reuse la donación de la despensa hereda "sin destino elegible"»—.*
⚠️ **NO aplica al padrinazgo** (§6: la canasta es del refugio; el vínculo con la
mascota es para las fotos). 🟠 · Disparo: la primera línea de la donación con destino.

**② DEUDA · El refugio no existe como ACTOR que pueda mover un pedido.**
`cat_transiciones_pedido.actor` = `admin | cliente | repartidor | sistema | vendedor`,
y `pedidos` no tiene ninguna columna de coordinación/refugio/tercero. **§8 dice
«la coordina el refugio» y ese actor no está declarado en ningún lado.**
*Variante previa del callejón de S105: allá el catálogo declaraba un actor que la
puerta no aceptaba; acá ni siquiera está declarado.* 🔴 · **Éste es el costo real
de §8 — no el campo del receptor, que ya existe.**

**③ DEUDA · `suscripciones_servicio_tipo_valido` está cerrado a dos valores.**
`CHECK (tipo_servicio = ANY (ARRAY['guarderia_mensual','paseo_mensual']))`. Un
padrinazgo recurrente no entra sin enmendarlo, y **es costo de v1**, medido contra
la letra: §1 lo define como *«Compra RECURRENTE de productos»* y §11 excluye el
padrinazgo **en dinero**, no la recurrencia. 🔴 · *`recurrentes.tsx` dice que el
padrinazgo aterriza «agregando un lector y un caso»: con esto son TRES cosas, y
la pantalla no podía preverlo cuando se escribió.*

**④ DEUDA · Cuatro de los seis escritores apagan una recurrencia sin dejar motivo.**
`motivo_cancelacion` es columna de primera clase y sólo la completan
`_trg_mascotas_memorial_planes` y `mover_sujeto_por_reverso`; `cerrar_y_renovar_planes`,
`confirmar_pago_plan_paseo`, `expirar_planes_sin_pago` y `vencer_links_mensuales`
mueven el estado sin decir por qué. **§6 exige TRES motivos distintos** (adoptado ·
fallece · el refugio se va). 🟠 · *El día que el destinatario desaparezca, «por qué
se apagó» es la pregunta que alguien le va a hacer a esa fila.*

**⑤ LECCIÓN · Un freno de puerta declara contra qué midió Y CUÁNDO.**
Falla de las dos maneras y las dos se cobraron el mismo día sobre el mismo hecho:
**E declaró un cero FALSO con su método roto** (un `find` truncado con `| head -20`)
y **D declaró un cero VERDADERO sin su hora** (midió 00:23:59; el commit de la
letra es 00:41:44). 🔴 **Y el modo de falla que importa: los dos ceros coincidieron,
y dos ceros que coinciden se leen como confirmación.** *Un baseline declara contra
qué midió; un freno necesita además la hora, porque su objeto puede nacer después.*

**⑥ LECCIÓN · Un `true` que era un `NULL`.**
Al comparar receptor contra comprador, el join devolvía NULL y `IS DISTINCT FROM
NULL` es true siempre: el instrumento dio `es_tercero=true` en las 16 filas.
**No dio error, no dio cero: dio la respuesta que yo esperaba**, y habría sostenido
un veredicto equivocado *contra la letra*. *Un comparador contra un lado nulo no
mide: afirma.* **Su control es barato y general: una columna que sale constante en
el 100 % de las filas de un censo es la señal** — acá el comprador salía
`(sin nombre)` en las 16.
