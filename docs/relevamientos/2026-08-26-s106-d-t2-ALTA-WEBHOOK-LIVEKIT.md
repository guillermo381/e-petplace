# PEDIDO AL FOUNDER · DAR DE ALTA EL WEBHOOK EN LIVEKIT

> **De:** pista D · S106 tanda 2 · 26-ago-2026 · **autocontenido.**
> **Dos minutos en el panel.** Todo lo de acá está **copiado del objeto**, no
> armado de memoria.
>
> **De mi lado está listo:** `video-webhook` figura **`ACTIVE`** en el
> proyecto, con **`verify_jwt: false`** —leído de `functions list`— y un POST
> sin firma devuelve `{"ok":false,"codigo":"firma_invalida"}` **401**, que es
> *mi* código y no el del gateway.

---

## ① LA URL — copiala tal cual

```
https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/video-webhook
```

*(Verificada contra `supabase functions list`: slug **`video-webhook`**,
status **ACTIVE**, versión 1.)*

---

## ② DÓNDE SE DA DE ALTA

1. Entrar a **https://cloud.livekit.io** e iniciar sesión.
2. Elegir el proyecto — **el nuestro es `epetplace-ilqza4vl`**.
   *(Medido: es el host que devuelve `video-token` en su campo `url`,
   `wss://epetplace-ilqza4vl.livekit.cloud`. Si ves más de un proyecto, ese
   es.)*
3. En el menú lateral: **Settings → Webhooks**.
4. **Add webhook** / **Create webhook**.
5. **URL:** la de ①.
6. **Signing key:** ver ③ — **es el punto que importa.**

**Sobre marcar eventos:** ⚠️ **la doc de LiveKit no menciona selección de
eventos** en el alta — describe URL + signing key y nada más. **Si el panel
igual te ofrece elegir, marcá TODOS.**

🔴 *No filtres ahí.* Mi function **entrega los doce eventos** a la base sin
filtrar, por la firma **REGISTRAR SIN JUZGAR** (`D-931`): *decidir cuál hecho
importa es de la puerta, no del transporte.* **Filtrar en el panel movería esa
decisión a un lugar donde nadie la va a ir a buscar.**

---

## ③ 🔴 LA MISMA API KEY — y acá está cuál, sin adivinar

**Elegí la key cuyo ID es:**

```
APIVwiwRPKxvXze
```

**Cómo lo sé, y por qué es seguro que esté escrito acá:** es el claim `iss`
del token que `video-token` emitió hoy — **el key *ID* es público**, viaja
dentro de cada token que le damos a la app. **El *secret* no aparece en
ningún lado de este documento.**

> ### **Si elegís otra key, TODOS los eventos van a rebotar como `firma_invalida`.**
> 🔴 *Y ése es el peor modo de falla posible para diagnosticar: mi function
> verifica con el secreto que tiene en `Deno.env`, así que un webhook firmado
> con otra key **se ve exactamente igual que alguien golpeando la puerta**.
> Buscaríamos un atacante donde hay un desplegable mal elegido.*

**Si en el panel figura más de una key y ninguna dice `APIVwiwRPKxvXze`**,
frená y avisame: querría decir que el secret cargado en Supabase pertenece a
una key que ya no existe, y eso **hay que arreglarlo antes** del alta.

---

## ④ QUÉ PASA DESPUÉS — y qué NO pasa

**Empieza a registrar hechos de sala**: quién entró, quién salió, cuándo
terminó una llamada. Se guardan en **`public.videollamada_hechos`**.

🔴 **Y nada más, por tu propia firma (`D-931`): REGISTRAR SIN JUZGAR.**
No cancela nada · no marca nada · no cobra · no devuelve plata · **no dice de
quién fue la culpa de un corte**.
*`LETRA_TELEMEDICINA` §5 intacto: si el sistema decidiera quién faltó, estaría
decidiendo quién paga.*

---

## ⑤ CÓMO SE VERIFICA — lo hago yo, vos sólo entrás una vez

Con que **entres a una sala y esté alguien más** —el cable `cable-quito`
alcanza— LiveKit dispara `room_started` y `participant_joined`.

**Avisame y yo verifico contra la base** que la fila llegó a
`videollamada_hechos`. **No me voy a quedar en «devolvió 200»: miro la fila.**

⚠️ **Hasta entonces esto queda declarado NO EJERCIDO.** Mi function
**rechaza bien** lo que no tiene firma —eso sí está medido— pero **jamás
procesó un evento legítimo**. *Que una puerta cierre no prueba que abra.*

---

## ⑥ LO QUE ESTE PRIMER EVENTO CIERRA, y no se puede cerrar leyendo

Hay una **contradicción dentro del propio SDK** que dejé declarada:

> `livekit-server-sdk@2.18.0` **exporta** una constante
> `authorizeHeader = "Authorize"` **que no usa en ningún lado**, mientras el
> JSDoc de su propio `receive()` dice «**`Authorization`** header from the
> request». **Los dos salen del mismo archivo.**

**Mi edge lee los dos**, `Authorization` primero — *elegir uno a ciegas y
errar produce «firma inválida» sobre webhooks legítimos, indistinguible de un
ataque.*

⇒ **Con el primer evento real veo cuál manda de verdad y lo reporto con el
literal.** Es la clase de detalle que **la próxima versión del SDK puede
mover**, así que queda anotado en vez de simplificado a la ligera.

---

## ⑦ LO QUE NO TE PIDO

- ❌ **Ninguna key nueva** — se usa la que ya cargaste.
- ❌ **Ningún cambio en la app** — el webhook es servidor a servidor.
- ❌ **Nada de `pagos-*`** ni de S105.
