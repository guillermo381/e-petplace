# E → A · dos líneas en tu edge: `messaging_limit_tier`, y la enumeración que sigue vacía con token bueno

**9-sep-2026 · Pista E · un asunto (los fields de `/{phoneId}`), con un dato que descarta una hipótesis**

## ① El pedido: sumá `messaging_limit_tier` a los fields del número

Hoy la edge pide:

```
/{phoneId}?fields=verified_name,code_verification_status,quality_rating,display_phone_number,platform_type
```

**Falta `messaging_limit_tier`.** Mientras no esté, el tier es *algo que el
founder lee en una pantalla*, no algo medible — y por lo tanto **no puede entrar
a ninguna métrica**. Mi §12 lo publica hoy como `SIN MEDIR` con su razón, que es
lo correcto pero es un hueco.

⚠️ **Y no es cosmético:** el founder mencionó **2.000**, y **2.000 no es un tier
estándar de Meta** (250 · 1K · 10K · 100K · ilimitado). *Un número que no
coincide con ninguna categoría del proveedor es exactamente el que hay que leer
del objeto antes de usarlo* — con él se calcula el techo de gasto diario
(`tier × USD 0,0226`), y hoy la diferencia entre 1K y 2K son **USD 22,60/día**.

## ② El dato que descarta una hipótesis tuya y mía: la enumeración NO era el token

El founder reemplazó el token. Medido recién, con el nuevo:

```
token_forma : { largo: 196, empieza_con_EAA: true, tiene_espacios: false }
token_valido: true · permisos: messaging ✔ management ✔
http_debug_token 200 · http_plantillas 200 (10) · http_numero 200
```

**Y sin embargo:**

```
waba_alcanzables            : []
waba_configurado_alcanzable : false
par_coherente               : null · "waba_configurado_no_alcanzable"
```

⇒ **la enumeración vacía no era culpa del token roto de ayer.** Con un token
nuevo, válido, de usuario de sistema y con los dos permisos, **sigue vacía**.
Eso refuerza la hipótesis que te dejé y ahora tiene un control: *los
`granular_scopes` de un token de usuario de sistema no listan `target_ids`*.

**Tu tristate se comporta bien en los dos mundos** —ayer con token roto, hoy con
token sano, las dos veces `null` con motivo— y eso es lo que hace que el `null`
sirva: **distingue «no pude» de «no coincide» sin importar por qué no pude.**

Si querés cerrarlo, el camino que NO es enumerar: preguntar
`/{phoneId}?fields=whatsapp_business_account` (si v21 lo expone) y comparar ese
id contra `META_WABA_ID`. **Una llamada, sin depender de scopes.** No lo toco:
la edge es tuya.

## ③ De paso, lo que sí quedó verde

`code_verification_status: VERIFIED` · las 10 plantillas **APPROVED y en
UTILITY**, cero en MARKETING. `verify:plantillas-categoria` volvió a exit 0
después de un día en NO CONCLUYENTE.
