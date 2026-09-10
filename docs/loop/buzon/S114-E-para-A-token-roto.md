# E → A · 🔴 URGENTE: el token de Meta dejó de ser un token · el canal está caído

**9-sep-2026 · Pista E · un solo asunto · medido, no supuesto**

## El hecho

Corrí mis gates de WhatsApp contra el estado nuevo (número verificado). **Todo lo
de Meta rebota 401:**

```
http_debug_token : 401
http_plantillas  : 401 · "Invalid OAuth access token - Cannot parse access token"
http_numero      : 401 · idem
token_valido     : null
permisos         : { messaging: false, management: false }
plantillas_total : 0
```

**Y la forma del secreto dice qué pasó** (la edge la publica sin exponer el valor,
y yo tampoco lo leí):

```
token_forma: { largo: 14, empieza_con_EAA: false, tiene_espacios: true,
               tiene_comillas: false, tiene_salto: false, parece_un_id_numerico: false }
```

**Catorce caracteres, con espacios, sin `EAA`.** Eso no es un token de Meta
truncado: **es otra cosa**. Es el mismo diagnóstico que S91 dejó escrito (*«la
credencial NO es un token de Meta (largo 23, sin `EAA`…) ⇒ no está truncada, es
otra cosa»*), con otra forma.

## Por qué importa el timing

**Ayer, 8-sep, el mismo endpoint respondía `token_valido: true`, los dos permisos
en `true`, `http_plantillas: 200` con las 10 plantillas.** Entre ayer y hoy pasó
la verificación del número. ⇒ **algo se escribió encima del secreto en esa
ventana.** No afirmo qué: los 14 caracteres con espacios son compatibles con
varias cosas que se copian y pegan durante una verificación, y **no voy a
adivinar cuál ni a leer el valor**.

## Qué NO se puede medir mientras esté así

- el `code_verification_status` nuevo del número (queda `null`)
- el `messaging_limit_tier` (el founder dice 2.000 — **sigue sin poder medirse**)
- la categoría viva de las plantillas ⇒ **`verify:plantillas-categoria` sale
  NO CONCLUYENTE, exit 2** (no verde: el gate hace lo que tiene que hacer)
- `par_coherente` queda `null` por una razón NUEVA (el token), no por la
  enumeración vacía de ayer — *dos causas distintas produciendo el mismo `null`*

## Lo que NO cambia

`transporte_vivo = false` para WhatsApp ⇒ **no hay riesgo de que salga nada**. El
canal no está mandando ni podría. **Esto no es una fuga: es una ceguera.** Pero
mientras dure, **ningún gate de WhatsApp puede afirmar nada**, y ese silencio no
se puede leer como salud.

## Lo que pido

Que quien tenga la llave **confirme la forma del secreto** (`largo`,
`empieza_con_EAA`) contra el token real de Meta. No hace falta imprimirlo: la
edge ya publica la forma, que es justamente el instrumento que hace falta acá.

⚠️ **Y una precaución, por precedente propio:** si el valor viejo quedó en algún
transcript durante la verificación, **sacarlo del secreto reduce la superficie
futura; sólo la rotación cierra el pasado** (`L-409`). Eso es del founder.
