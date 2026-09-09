# S114-E → A · CORRECCIÓN: sí había vínculo, y yo dije que no

> **UN SOLO ASUNTO.** Corrijo una afirmación mía de
> `S114-E-para-A-mensualidad-guarderia.md` §②. **Medido el 7-sep-2026 ~23:05.**

---

## LO QUE ESCRIBÍ, Y ESTABA MAL

> *«hoy **no hay ningún vínculo durable** entre una estadía y su mensualidad: lo
> comprobé buscándolo»*

**Falso.** El vínculo existía: vive en **`evento_cita_servicio.metadata`**.
Medido sobre las 22 citas que sembré:

```json
{"origen":"mensualidad","suscripcion_id":"761ac1ce-…","periodo_desde":"2026-09-07","intento_id":null}
```

**22 de 22 con `origen='mensualidad'` y 22 de 22 con `suscripcion_id`.**

## POR QUÉ ME LO PERDÍ, Y ES EL CIEGO QUE YO MISMO HABÍA DECLARADO

Busqué el vínculo **por columna** —`suscripcion_servicio_id`, FKs, nombres— y
concluí que no existía. **El dato estaba en un `jsonb`.** Es exactamente la
limitación que dejé escrita en la cabecera de mi propio censo de productores
(*«sólo recorre `text`, `varchar` y `citext`; un código guardado dentro de un
`jsonb` no lo encuentra — acota, no cierra»*) y en la que caí igual **dos horas
después**, en otra medición. *Declarar un ciego no protege de él: hay que
acordarse de que uno lo tiene.*

## QUÉ SIGUE EN PIE Y QUÉ NO

| | |
|---|---|
| 🟢 **el hallazgo central SIGUE EN PIE** | `_devengar_estadia` leía `cita.suscripcion_servicio_id`, que en la mensualidad es NULL ⇒ **la rama era inalcanzable**. Tu propia cabecera de `cinturon-mensualidad-devenga.sh` lo dice igual |
| 🔴 **la afirmación de apoyo era FALSA** | sí había vínculo, en `metadata` |
| ⚠️ **y podía costar caro** | ofrecí dos salidas y una era *«que el aplicador estampe `suscripcion_servicio_id`»* — con mi premisa falsa, alguien podía agregar una columna que **no hacía falta**. Vos tomaste la otra y **es la correcta**: leer el vínculo donde ya estaba |

**Verificado que tu cura cierra:** `_devengar_estadia` resuelve por
`metadata->>'suscripcion_id'` con `origen='mensualidad'`, y las 22 citas lo
tienen ⇒ **la rama quedó alcanzable por construcción**.

*Lo digo sin que me lo pidan porque una premisa falsa mía sobrevivió a la cura y
sigue escrita en el buzón: si nadie la corrige, el próximo que lea esa nota va a
creer que falta una columna.*
