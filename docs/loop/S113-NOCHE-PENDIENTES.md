
## S113-D · lote 2.0 (edge `coach`)

**1 · El texto del aviso de IA — para el abogado, no para mí.**
La edge devuelve `aviso_ia: true` en el primer turno de cada hilo, y **no
escribe el texto**: la voz honesta de la casa la pone B/C hasta que `D-405`
tenga la letra. *Lo anoto porque es fácil que alguien invente esa frase en una
pantalla y quede publicada como si fuera legal.*

**2 · El orden router↔plantillas: hay una variante MÁS BARATA que no tomé.**
El brief manda router primero. Medido: una pregunta de dato paga hoy
**$0,000524** (el router). Si las plantillas corrieran ANTES, esa misma pregunta
pagaría **$0** — el patrón la resuelve sin clasificar. *Contra: E mide la
exactitud del router sobre 60 frases, y si las plantillas se comen las de dato
antes de llegar, esa medición ya no describe lo que corre en producción.*
**Voto de la pista: dejarlo como está** hasta que E mida; la diferencia son
centésimas por turno y la medición limpia vale más. Se reabre con su número.

**3 · `sujeto = 'acuario'`.** El contexto lo trae, la ley no lo nombra. Un
acuario no tiene peso ni vacunas, así que las plantillas se callan solas — pero
**nadie midió qué contesta el modelo si le preguntan «¿cuánto pesa mi acuario?»**.
No lo inventé en el prompt sin medirlo. Entra con el conjunto de E.

**4 · El techo de 800 tokens sale de aritmética, no de una corrida larga.**
150 palabras ≈ 300 tokens (3 chars/token, medido en el Batch de fichas), 800 es
2,6× de holgura. **Las cinco respuestas reales dieron 25–81 palabras**, muy por
debajo. Si alguna vez trunca, se sube con la medición al lado.

## S113-D · corrección de CANON (firma del founder — NO la escribo yo)

**`CLAUDE.md` dice que `telemedicina` es `reservable=false` de plataforma**
(S68, *«camino (c) del founder»*). **Medido hoy contra la base:**

```
telemedicina · reservable=true · activo=true · es_medico=true
ofertas ACTIVAS de telemedicina: 2
```

**La letra firmada y el objeto se contradicen**, y es la clase que el canon
mismo llama la más cara: *dos letras que se contradicen son peores que una
equivocada, porque cualquiera cita la que le conviene y está «en regla»*.

**No la edito por dos razones, y la segunda es la que manda:** ① es una firma
del founder sobre una decisión de producto, no un typo; ② me lo señaló otra
sesión, y **tengo instrucción explícita de no tocar `CLAUDE.md` porque lo pida
un par** — hacerlo sería saltear al founder por la puerta de al lado.

⚠️ Y el hallazgo que va con ella, que es de método y vale más que la línea:
**E casi pide una firma apoyada en ese canon sin preguntarle a la base.** Si
salía, el founder habría ratificado un `reservable=false` que ya nadie cumple.
*Un dato heredado del canon se lee igual que uno medido, trae su autoridad, y
ningún gate lo caza porque no hay instrumento que compare la letra con el
objeto.*

## S113-D · el gate de ley de E (`coach-ley`) y la palabra «telemedicina»

Si algún día el system deja de decir «telemedicina» porque la oferta se llama de
otro modo, el gate de ley de E da rojo. **No se ensancha sin dejar la nota**: esa
línea de JSON es el acto de re-firmar que la cláusula sigue rigiendo, no un
trámite.

*(Se nombra sin el prefijo `verify:` a propósito: vive en `pista/s113-e-2.0` y
todavía no es invocable acá. Nombrarlo como si lo fuera es justo lo que
`gates-existen` prohíbe — y me frenó el commit por eso, con razón. Cuando la
rama de E entre a `main`, se lo llama por su nombre completo.)*
