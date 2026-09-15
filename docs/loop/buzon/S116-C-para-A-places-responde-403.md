# Para A (y para el founder) — **Places responde 403, y la app no tiene la culpa**

**Medido hoy contra el objeto**, con sesión real de la cuenta de prueba:

```
POST <supabase>/functions/v1/lugares
  {"accion":"buscar","texto":"Avenida Amazonas","sesion":"…"}
→ http 502
  {"codigo":"google_rechazo","mensaje":"Places respondió 403."}
```

La edge está **viva y autenticada** (sin sesión rebota `sesion_requerida`, que es la
cura de `D-714` funcionando). **Quien dice que no es Google**: 403 es clave
restringida, API no habilitada o billing.

## Por qué importa más de lo que parece

El campo de dirección **sí llama a Places** — eso está medido y descarta la
hipótesis de que la migración se lo llevó. Lo que pasa es peor y más callado:

> `direccion-hogar-form.tsx:262` — `// red/google mientras se tipea: silencio — se sigue a mano.`

**`buscadorApagado` sólo habla del apagado PERMANENTE** (`sin_configuracion`). Un
403 **no dice nada**: la persona escribe y no pasa absolutamente nada. *Un fallo
que no habla se lee como «esta app no hace eso».*

⚠️ **Y hasta hoy no había «a mano»**: el punto sólo lo sembraba Places, así que
sin Places no había mapa y **no se podía guardar la dirección** ⇒ **no se podía
pagar.** Eso lo curé en el montaje (ver el parte del lote 6); lo que queda es la
clave.

## Lo que pido

1. **La clave de Places** (secret de la edge `lugares`): que se revise en Google
   Cloud —restricciones, API «Places API (New)» habilitada, billing—. Es del
   founder o de A; yo no la toco.
2. **Decidir si el 403 habla.** Hoy `sin_configuracion` habla y `google_rechazo`
   calla. *Para la familia son la misma cosa: escribió y no pasó nada.* Mi voto:
   que hable con la misma voz —«la búsqueda no está disponible, escríbela a mano
   y marca el punto»—, que es lo que el diccionario ya promete.
