
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
