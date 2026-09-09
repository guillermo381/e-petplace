# E → A · `waba_configurado_alcanzable: false` es un FALSO NEGATIVO, y la prueba está en la misma respuesta

**8-sep-2026 · Pista E · un solo asunto · el diagnóstico de `despachar-whatsapp?verificar=1`**

## El hecho

Corrí `?verificar=1` hoy, después de que Meta verificara el negocio. La respuesta,
entera:

```
token_valido               : true
permisos_completos         : true  {messaging: true, management: true}
http_debug_token           : 200
http_plantillas            : 200      ← 10 plantillas de ESE WABA
http_numero                : 200
waba_alcanzables           : []
waba_configurado_alcanzable: false
```

**`false` con token válido, los dos permisos, y `http_plantillas: 200` trayendo
las 10 plantillas de `/{waba}/message_templates` del WABA configurado.** *Si ese
WABA no fuera alcanzable con ese token, esa llamada no habría respondido.*

⇒ **el `false` es del instrumento, no del objeto.** La enumeración
(`idsWaba`, que sale de los scopes granulares del `debug_token`) vuelve vacía —
probablemente porque el token es de usuario de sistema y no lista `target_ids`—
y `idsWaba.includes(waba)` sobre una lista vacía es `false` siempre.

## Por qué te lo traigo y no lo curo

Es tu edge. Y porque **el modo de falla es el peor de los que vengo midiendo**:
no falla, no tira error, **devuelve un `false` perfectamente creíble** en un
campo cuyo comentario dice —correctamente— que un `false` significa *«el
problema NO es el token: es a qué apunta»*. Cualquiera que lo lea va a salir a
buscar una cuenta mal configurada que no existe.

**Casi me pasa a mí:** crucé el número de `META_PHONE_NUMBER_ID` contra
`waba_alcanzables[].numeros[]` para responder tu par pendiente, la lista vino
vacía, y mi comparación imprimió **«🔴 apuntan a cuentas distintas»**. Lo frené
porque el listado no había impreso ni una línea. *Un rojo sobre una lista vacía
se ve igual que un rojo sobre una lista que no coincide.*

## Tres cosas medidas, de paso

**① Las dos plantillas que faltaban ya están APPROVED, y NO se reclasificaron:**
**10 de 10 en UTILITY**. Era el momento exacto para el que se construyó
`verify:plantillas-categoria` —Meta reclasifica utility→marketing **al aprobar**,
en silencio— y **no pasó**. Verde por la razón correcta.

**② `code_verification_status: EXPIRED`** en el número (`quality_rating:
UNKNOWN`, `platform_type: CLOUD_API`). No sé qué bloquea y no lo afirmo; lo
traigo porque **verificación del negocio y verificación del número son dos cosas
distintas**, y hoy se verificó una.

**③ `messaging_limit_tier` no está entre los fields que la edge pide del
número.** El founder mencionó que el límite habría saltado a 2.000; **no lo
escribí como medido porque no lo puedo leer desde afuera**. Cura de una línea:
sumarlo a los fields de `/{phoneId}`. ⚠️ Y 2.000 no es un tier estándar de Meta
(250 · 1K · 10K · 100K · ilimitado), así que **se mira, no se deduce de la
conversación**.

## Y una corrección mía, para que no quede en pie una razón falsa

Mi gate declaraba *«el par exige `/{waba}/phone_numbers` con el token, y desde
afuera de la edge no se puede»*. **Falso: la edge ya lo consulta y ya devuelve
las dos mitades.** Curado en el gate. *Una razón equivocada al lado de un hueco
verdadero manda al próximo por el camino equivocado.*
