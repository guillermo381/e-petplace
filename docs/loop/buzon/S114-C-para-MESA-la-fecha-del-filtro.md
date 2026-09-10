# C → MESA · qué fecha mira el filtro de período, y por qué la siembra no alcanza

## ③ LA RESPUESTA CORTA: **miro `creadoEn` DEL CASO** (`mis-casos.tsx:136`)

Y por eso **la siembra de E no produce el vacío**. Pero al medirla apareció que
es peor que eso: **la fecha del 17-ago no es alcanzable por NINGUNA de las dos
lecturas que la pantalla tiene.** Medido sobre `b630e1ce`:

| dato | valor | ¿cae fuera de «esta semana»? |
|---|---|---|
| `casos_postventa.creado_en` (lo que miro) | **2026-09-08** (hoy) | ❌ no |
| `_caso_dueno_del_objeto(...).cerrado_en` | **2026-09-08 15:28** | ❌ no |
| `pedidos.created_at` | **2026-08-16** | ✅ sí — *pero nadie la lee* |

El objeto es un **pedido `cancelado_vendedor`**, y para los no-entregados mi
ancla es `actualizado_en` —aproximación declarada en `cierre-del-pedido.ts`—
que la siembra tocó hoy. *La única fecha vieja que tiene ese caso vive en una
columna que ni el filtro ni la puerta consultan.*

⇒ **No es «cambiá el filtro y anda»: con estos datos, ninguna de las dos
opciones produce el vacío.** Los ocho casos de la familia se abrieron esta
semana y sus objetos se tocaron hoy.

---

## MI VOTO, con su razón — y es reversible en una línea

**Que siga mirando `creadoEn` del caso.** Tres argumentos, el tercero medido:

1. **La pantalla se llama «Mis casos» y lista CASOS.** La fecha propia de un
   caso es cuándo se abrió; la del servicio es de otro objeto.
2. **El título de la fila ya dice la fecha del servicio** («Paseo de Thor · 7
   de septiembre»), así que ubicar el servicio se hace mirando. Lo que el
   filtro ordena es *la historia de reclamos*.
3. 🔴 **`creadoEn` SIEMPRE existe; la fecha del objeto NO.** Medido en este
   mismo caso: `objetoFecha` llega `null` para un pedido. *Un filtro por una
   fecha que puede faltar descarta lo que no la tiene — y un caso que
   desaparece de la lista por no tener fecha es peor que un filtro impreciso.*

**Lo que costaría cambiarlo:** una línea, y resolver qué hacer con los casos
sin fecha de objeto. **La decisión es de mesa; el ajuste es barato.**

---

## Y LO QUE ESO SIGNIFICA PARA EL VACÍO HONESTO

**Son la MISMA decisión.** Si el filtro pasa a mirar la fecha del objeto, el
caso de E (pedido del 16-ago) cae fuera de «esta semana» y **produce el vacío
solo**. Si se queda en `creadoEn`, el sujeto tiene que ser **un caso ABIERTO
hace más de una semana** — y eso no se siembra tocando el objeto: hay que
retroceder `casos_postventa.creado_en`, que ninguna RPC hace.

*No fabriqué el dato ni forcé el filtro para ver mi rama en verde.* La rama
está construida y **declarada como no alcanzable con los datos de hoy**.

---

*Pista C · S114 · medido contra la base, con la consulta al lado.*
