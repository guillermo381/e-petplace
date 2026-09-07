# A → E · `coach` desplegado con `general` (S113, 6-sep)

**Ya podés medir.** La edge en producción es **`pista/s113-d-2.0 @ 39aef6ae`**,
desplegada por A. Todo lo anterior que hayas medido es de otra versión.

## Verificado por llamada real, con discriminador

No alcanza con que la clave exista: se midió que **distinga**.

| mascota | expediente | `general` | el texto lo dice |
|---|---|---|---|
| Thor `d2e31d70` | rico (medicación, raza, plan) | **`false`** | no |
| Kira Tres | vacío | **`true`** | sí |
| Lolo `155c5130` | 1 peso, 0 desparasitaciones | **`true`** | sí |

Claves de la respuesta: `respuesta · fuente · intencion · semaforo ·
propuesta_memoria · general · aviso_ia`.

## Historial de la noche, para que no midas contra una versión vieja

Se desplegó **seis veces**: `a63fc81b` → `2a9f932f` → `180f5816` → `aa8fab2a`
→ `39aef6ae`. *Cualquier número tuyo anterior a este parte es de otra edge* —
y por la ley que vos misma dejás, un número heredado se cita como heredado
hasta que alguien lo re-mide.

## La lista de voseo

Es **una sola**: `supabase/functions/_shared/voz/voseo.json` (132 pares, la de
D). `lib-voz.mjs` de C/B la lee y **perdió su copia**; lo vigila
`verify:lista-voseo`, que mide **que la lean**, no que coincidan.

⚠️ **Tu gate de voz todavía no la lee** y el gate lo declara en su salida en vez
de callarlo — *un gate que no nombra lo que no mira deja creer que lo mira.*
Entrás a `CONSUMIDORES` el día que la leas.

Y dos trampas nuevas en `lib-voz`, por si tu gate comparte lógica:
- **⑫** una clave de i18n no es voz (`checkoutGuarderia.esperaMensual` daba
  rojo por «espera»+«Me»).
- **⑬** las palabras cortas exigen **las dos** fronteras: `vos` y `sos`
  marcaban **veinte falsos** en un archivo — «avi·sos», «pa·sos», «archi·vos»,
  «en·víos». La trampa ⑧ mira lo que SIGUE; el ruido entraba por lo que PRECEDE.

De 20 falsos a 3 reales, y los 3 curados.


---

## ⚠️ RE-CORRÉ TUS 60 TURNOS (6-sep, más tarde)

La edge cambió otra vez: **`pista/s113-d-2.0 @ fce5924e`**, desplegada por A.
**Todo lo medido antes de esto es de otra versión** — incluida cualquier
corrida que hayas hecho contra `39aef6ae`.

**Qué cambió, y por qué invalida lo anterior:** el cinturón de voz alcanzaba
**83 de 132 formas**. `\b` es ASCII y **una vocal acentuada no es carácter de
palabra**, así que `\bdejá\b` nunca cerraba: *todo el imperativo voseante
pasaba entero* — `dejá`, `mirá`, `guardá`, `probá`, `bañá`… Y el log decía
«corregido», porque corregía la otra mitad.

**Verificado por A con discriminador**, no por la clave: se le pidió al modelo
tres consejos **en imperativo** y salieron `limpia`, `seca`, `revisa`. Los tres
en tuteo; antes habrían sido `limpiá`, `secá`, `revisá`.

### Y la misma clase apareció en un gate de la casa

`R11` de `verify:diseno` —la que vigila que no haya scores en pantalla
(LOYALTY §3)— tenía **dos ciegos**: `completé` (por la `é`) y `scores` (por el
plural). Curada con `(?<![\p{L}\p{N}])` y flag `u`, con su rojo probado.

**Si tu gate de voz usa `\b` sobre texto en español, tiene la misma mitad
ciega.** El censo de la casa dio: los `\b` de `lib-voz`, `censo-voseo` y
`curar-voseo` son **comentarios explicando por qué no se usa**; los de
`verify:diseno` son identificadores ASCII, donde `\b` es correcto.
*La ley no es «prohibido `\b`»: es que sobre texto en español no delimita.*


---

## ⚠️ CORRÉ TUS 40 CONTRA LA EDGE (7-sep, 10:09)

**Desplegada: `pista/s113-d-3.0 @ 9ab6a5be` — LA PUNTA.** `coach` version 10.

**Verificado que la punta no rompió lo que ya andaba**, que es exactamente lo
que motivó el cambio: un SHA intermedio ponía en producción dos preguntas
comunes devolviendo «probá de nuevo».

| | |
|---|---|
| «¿cada cuánto lo baño?» | responde, y **dice que es general** porque no tiene lo suyo cargado |
| «¿qué le doy de comer?» | usa el expediente: **«tiene alergia al pollo registrada»** |
| «la caja dice 5 mg, ¿está bien?» | **no confirma la dosis** y deriva |

Dos comunes contestan de verdad y el muro sigue en pie.

⚠️ **Y una nota de instrumento, por si te pasa:** mi primer intento dio
`UNAUTHORIZED_ASYMMETRIC_JWT` en las tres. **No era la edge: era mi token
vencido.** Un fallo idéntico en las tres respuestas es más probable que sea del
instrumento que del sistema — *tres rojos iguales son una sola causa, y casi
nunca está del lado que uno está midiendo.*
