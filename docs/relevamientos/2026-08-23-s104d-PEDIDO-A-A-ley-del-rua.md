# S104-D · PEDIDO A A — DEPOSITAR UNA LEY FIRMADA POR EL FOUNDER

**23-ago-2026 · pista D.** `docs/DEUDAS_CANONICAS.md` es territorio de A, así que
**no lo escribo yo**: mando el literal autocontenido para que A lo deposite.

**Número medido por grep contra el archivo, no de memoria:** la lección más alta
real es **`L-409`** ⇒ **siguiente libre `L-410`**. *(`L-714` aparece en el grep y
**no es una lección**: es un typo de `D-714` que el propio archivo declara
descartado en su línea 12512. Se dice acá para que A no lo tome como techo.)*
**A verifica antes de depositar — el número es suyo, no mío.**

---

## EL LITERAL, PARA DEPOSITAR VERBATIM

### L-410 — UN CANAL DE REPORTE SE APUNTA A UNA DIRECCIÓN QUE SE VIO RECIBIR, JAMÁS A UNA QUE FIGURA EN UN PANEL

**Firmada por el founder (23-ago-2026), sobre el caso del `rua` de DMARC.**

**El caso que la funda:** el registro `_dmarc` de `epetplace.com` iba a apuntar
sus reportes a `privacidad@epetplace.com`, una dirección que el founder iba a
crear por el mismo camino que `hola@`. **Medido contra los dos NS autoritativos
antes de cargarlo: el dominio no tiene MX, y el fallback al registro `A` tiene
los puertos 25, 587 y 465 cerrados** ⇒ ninguna de las dos direcciones puede
recibir correo de afuera. **El registro se habría cargado bien formado y los
reportes se habrían caído en silencio.**

> **La ley: una dirección que va a RECIBIR algo que nos importa se verifica
> recibiendo — con un correo de prueba que llegó y se vio llegar. Que figure
> creada en un panel no es evidencia de que recibe: es evidencia de que alguien
> la escribió.**

**Por qué es una clase y no un caso:** vale para todo destino de reporte, alerta
o rebote — `rua` y `ruf` de DMARC, la casilla de errores de un cron, el correo
de un webhook, el destinatario de un aviso de sistema. **Todos comparten el modo
de falla más caro que hay: fallan hacia el silencio.** *Un canal de reporte roto
no avisa que está roto — deja de avisar, que es lo mismo que un canal sano en un
día tranquilo.*

**El discriminador, y es barato:** mandar un correo a esa dirección y **verlo
llegar**. Si rebota, no existe. **La prueba la corre quien tiene acceso al buzón
de destino, no quien configura el registro** — porque el rebote llega del lado
que recibe.

**Hermanas:** `L-402` (*no basta «¿está alcanzable desde afuera?» — hace falta
«¿CORRIÓ ALGUNA VEZ?»*) y `L-321` (*se prueba la defensa, no la lista*). **Esta
es la misma familia aplicada a un canal de salida en vez de a una puerta de
entrada.**

**☠️ Condición de muerte:** ninguna. Es regla de método, no deuda.

---

## POR QUÉ VALE LA PENA QUE ENTRE AL CANON Y NO SE QUEDE EN UN PARTE

El día que se cargó el `_dmarc` que hoy está vivo (`v=DMARC1; p=none;`) **nadie
puso `rua`**, y por eso el registro nunca reportó a nadie. *Nadie decidió eso:
quedó así.* **Esta ley existe para que la próxima vez que alguien lo complete,
lo complete hacia una dirección que contesta.**
