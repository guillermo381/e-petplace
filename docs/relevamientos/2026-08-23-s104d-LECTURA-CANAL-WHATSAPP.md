# S104-D · LECTURA DEL CANAL DE WHATSAPP — cinco preguntas, cero cambios

**23-ago-2026 · pista D.** Solo lectura. **Cero deploys, cero migraciones, cero
código.** La llamada de sombra del punto 5 se pega **sin ejecutar**.

---

## ⓿ EL TITULAR, PORQUE CAMBIA LA PREGUNTA 3

**El founder va a renombrar las 6 plantillas en Meta y quiere saber dónde se
actualiza. La respuesta medida es: EN NINGÚN LADO — porque hoy los nombres no
están escritos en ninguna parte.**

El transporte lee `resuelto_como->>'plantilla'` de la base. **Nadie lo escribe.**
Medido por tres vías independientes:

| Vía | Resultado |
|---|---|
| Filas de `notificacion_intencion` con la clave `plantilla` | **0 de 215** |
| Funciones de la base que nombran «plantilla» | **0** |
| Migraciones que escriben `resuelto_como.plantilla` | **0** |

**Las claves que `resuelto_como` sí trae hoy** (censadas sobre las 215 filas):
`canal_elegido · canales_habilitados · despacho · despacho_en · evaluado_en ·
forzado_por · gate_que_corto · proveedor_id`. **`plantilla` no está.**

> ⇒ **Buena noticia para el renombre: no hay nada que actualizar del lado
> nuestro.** El founder renombra en Meta y no rompe nada, porque **no hay ningún
> lugar del sistema que todavía apunte a los nombres viejos.**
>
> ⇒ **Y la de fondo: el mapeo tipo-de-aviso → plantilla no existe.** Es una pieza
> **por construir**, no por actualizar. Hoy toda intención de WhatsApp rebotaría
> con `sin_plantilla_resuelta` (`despachar-whatsapp/index.ts:266-273`) — no llega
> a Meta.

**Y la casa ya lo sabía, escrito hace tres semanas.** El comentario de
`_voz_notificacion` (`20260805310000_d667_voz_plan_renovado.sql:78`), verbatim:

> `'para 37 tipos — el día que las plantillas sean TABLA, cambia esta función y '`

*«El día que las plantillas sean TABLA» — o sea que todavía no lo son, y quien lo
escribió lo sabía.* **Es un motor sin puerta declarado en su propio comentario**
(`L-318`): el transporte quedó listo para consumir un dato que nunca tuvo
productor. **No hubo síntoma porque nunca hubo tráfico** — `transporte_vivo=false`
y cola en 0 (`L-402`: no basta «¿existe?», hace falta «¿corrió alguna vez?»).

---

## ① EL RETOME QUE DEJÓ S91 — TEXTUAL

`MODELO_NOTIFICACIONES` **§0quater**, bloque 🧊 (líneas 201-223). El retome, tal
cual está escrito:

> «**EL RETOME:** recargar token → correr la sombra (la llamada está en el
> volcado de A) → leer plantillas/verificación/tres números → **decisión de
> encendido con datos**.»

Y las esperas que lo condicionan, también verbatim del mismo bloque:

> «**Las esperas, TODAS externas o del founder:** (a) **Meta resuelve su problema
> con las plantillas**, (b) **re-categorización marketing→utility — CRÍTICA antes
> de encender**: un aviso de cita como marketing es para Meta marketing no
> solicitado, y **un número pausado se recupera por apelación, no por
> corrección**, (c) el token bueno al secret, (d) el **go del founder con
> destinatario de prueba propio**. `transporte_vivo = false`, cola en 0, **nada
> puede salir**.»

⚠️ **Dos advertencias que el propio § deja escritas y conviene no perder:**

1. **«Vale el cierre, no la apertura.»** El § abre con *«Meta aprobó las
   plantillas»* y **cierra con que Meta tiene un problema con ellas**. Son dos
   momentos del mismo día; **rige el cierre**.
2. **El diagnóstico del token, para no re-descubrirlo:** el valor cargado en
   `META_WHATSAPP_TOKEN` **no es un token de Meta** — largo 23, no empieza con
   `EAA`, sin comillas ni salto ⇒ **no está truncado, se cargó otra cosa**. Meta
   contesta 401 «Cannot parse access token» para plantillas **y** para número.

---

## ② `despachar-whatsapp` — QUÉ NOMBRES USA Y DÓNDE ESTÁN

| Pregunta | Respuesta medida |
|---|---|
| ¿Nombres de plantilla hoy? | **Ninguno.** No hay un solo nombre escrito en el sistema |
| ¿Constante en el código? | **NO** — y a propósito, está declarado |
| ¿Tabla? | **NO** |
| ¿En el catálogo de tipos? | **NO** — `cat_notificacion_tipos` es `codigo, categoria, descripcion, en_sombra, activo, audiencia, canal_forzado, ignora_techo`: **sin columna de plantilla** |
| ¿De dónde los lee el transporte? | `resuelto_como->>'plantilla'` y `->>'plantilla_idioma'` de `notificacion_intencion` |
| ¿Qué tipo mapea a cada una? | **No existe el mapeo.** Es la pieza que falta |

**El contrato, verbatim del transporte** (`index.ts:261-273`):

```ts
// La plantilla la dice la DB (`resuelto_como`), jamás esta función: el
// nombre y el idioma de la plantilla son dato de negocio aprobado por
// Meta, y hardcodearlos acá sería la segunda verdad.
const plantilla = (i.resuelto_como as Record<string, unknown> | null)?.plantilla;
const idioma    = (i.resuelto_como as Record<string, unknown> | null)?.plantilla_idioma;
if (typeof plantilla !== 'string' || typeof idioma !== 'string') {
  await supabase
    .from('notificacion_intencion')
    .update({ estado: 'fallida', motivo: 'sin_plantilla_resuelta' })
    .eq('id', i.id);
  fallidas++;
  continue;
}
```

y el envío (`:278-283`): `template: { name: plantilla, language: { code: idioma } }`.

> **La decisión de diseño es correcta y conviene defenderla, no revertirla:** el
> nombre de una plantilla es **dato de negocio aprobado por Meta**, no constante
> de ingeniería. Hardcodearlo sería una segunda verdad que se desincroniza el
> día que Meta rechace o renombre una. **Lo que falta no es cambiar el diseño:
> es construir el productor que ese diseño espera.**

---

## ③ DÓNDE SE ACTUALIZA CUANDO EL FOUNDER RENOMBRE EN META

**Hoy: en ningún lado.** Renombrar en Meta es **seguro** — no hay referencia
nuestra que quede colgada.

**El día que exista el productor, el lugar canónico es una columna nueva en
`cat_notificacion_tipos`** (`codigo` es la PK del tipo de aviso), con su idioma:

| Dónde | Qué | Estado |
|---|---|---|
| `public.cat_notificacion_tipos` | fila por tipo de aviso — **ya existe** | 🟢 |
| ↳ columna `plantilla_whatsapp` | **no existe** | 🔴 por construir |
| ↳ columna `plantilla_idioma` | **no existe** | 🔴 por construir |
| El resolutor que copie ese par a `resuelto_como` al registrar la intención | **no existe** | 🔴 por construir |

*Esto es el lugar que la letra ya insinuaba —«el día que las plantillas sean
TABLA»— y **no está firmado**: se anota como el camino coherente con lo
construido, no como decisión tomada.*

---

## ④ L-201 — TELÉFONOS FUERA DE E.164 · **SOLO CUENTA**

Medido en `profiles.telefono` **con el MISMO regex que usa el transporte**
(`/^\+[1-9][0-9]{7,14}$/`, `index.ts:44-46`) — misma vara, no una propia.

| | n |
|---|---|
| Perfiles totales | **165** |
| Sin teléfono (null o vacío) | **141** |
| **En E.164, válidos** | **15** |
| **🔴 NO están en E.164** | **9** |

**Los 9, por FORMA** *(caracterizados por forma; **ningún número se transcribe** —
P21 y el precedente de S92, que purgó 14 teléfonos sin copiar uno solo a un
documento):*

| Forma | Largo | n | de los cuales parecen cuenta de prueba |
|---|---|---|---|
| **SIN `+`** | 8 | **5** | 1 |
| **SIN `+`** | 9 | **2** | 2 |
| **SIN `+`** | 10 | **1** | 1 |
| **CON `+`** pero inválido | **3** | **1** | 0 |

- **8 de los 9 son «le falta el prefijo»** — y **ahí es donde P21 muerde**:
  ponerles un `+593` es **inventar el país de alguien**. `MODELO_NOTIFICACIONES`
  lo dice en el comentario del propio validador: *«arreglar un teléfono en el
  transporte es inventar el país de alguien».*
- **El noveno no es un teléfono**: `+` y dos dígitos. Ése no es deuda de
  backfill, es **basura de captura** — y se puede tratar aparte sin tocar P21,
  porque no hay país que inventar donde no hay número.

**No se arregló nada. No se propone backfill.** *La cura no es de datos: es de
captura — el día que el alta pida país explícito, estos 9 dejan de nacer.*

---

## ⑤ LA LLAMADA DE SOMBRA — TAL CUAL, **NO EJECUTADA**

De `docs/relevamientos/2026-08-08-s91a-VOLCADO-CIERRE.md`, bloque ④, línea 95:

```
curl -s -X POST "$URL/functions/v1/despachar-whatsapp?verificar=1" -H "Authorization: Bearer $ANON_KEY"
```

Con su contexto verbatim del mismo bloque:

> **El bloqueo tiene nombre: la credencial cargada NO es un token de Meta**
> (forma medida sin exponer el valor: largo 23, sin `EAA`, sin comillas, sin
> salto ⇒ no está truncada, **es otra cosa**). Meta contesta 401 «Cannot parse
> access token».
>
> **El retome es UNA llamada:**

⚠️ **Dos notas antes de que alguien la corra:**

1. **Hoy devolvería 401 en las dos patas** (plantillas y número): el token sigue
   sin recargarse. *Correrla antes de la recarga no mide el canal — mide el token.*
2. **`?verificar=1` es solo-GET contra Meta** (pide `message_templates` y el
   estado del número); **no manda ningún mensaje.** Es segura por construcción,
   y aun así **no se ejecutó acá**: la orden era leer.

---

## ⓺ RESUMEN EN UNA TABLA

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | Retome de S91 | recargar token → correr la sombra → leer plantillas/verificación/números → **decidir con datos**. Rige el **cierre** del §, no su apertura |
| 2 | Nombres de plantilla | **ninguno escrito**. El transporte los lee de `resuelto_como`; **nadie los escribe**. Mapeo tipo→plantilla **inexistente** |
| 3 | Dónde se actualiza | **hoy en ningún lado** ⇒ renombrar en Meta es seguro. El lugar futuro: **columna nueva en `cat_notificacion_tipos`**, por construir |
| 4 | Teléfonos no-E.164 | **9** (de 165 perfiles; 141 sin teléfono, 15 válidos). 8 sin prefijo, 1 es basura. **Contados, no tocados** |
| 5 | Llamada de sombra | pegada arriba, **no ejecutada**. Daría 401 hasta que se recargue el token |

**Cero cambios. Cero deploys. Cero migraciones.** Único artefacto: este archivo.
