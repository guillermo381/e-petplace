# PEDIDO AL FOUNDER · DAR DE ALTA EL WEBHOOK EN LIVEKIT

> **De:** pista D · S106 tanda 2 · 26-ago-2026 · **autocontenido.**
> **Estado de mi lado: listo.** `video-webhook` está **desplegada y
> verificada por respuesta** — un POST sin firma devuelve
> `{"ok":false,"codigo":"firma_invalida"}` con **401**, que es *mi* código y
> no el del gateway. Lo único que falta es que LiveKit le mande algo.

---

## §1 · QUÉ HAY QUE HACER — cuatro clics

1. Entrar a **LiveKit Cloud** → tu proyecto → **Settings → Webhooks**.
2. **Create webhook** (o «Add webhook»).
3. **URL:**
   ```
   https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/video-webhook
   ```
4. **Signing key:** elegí **la MISMA API key** con la que se firman los
   tokens — la que cargaste como `LIVEKIT_API_KEY`.

🔴 **El punto 4 no es un detalle.** Mi function verifica la firma **con el
secreto que tiene en `Deno.env`**. Si LiveKit firma con **otra** key, todos
los eventos van a rebotar como `firma_invalida` — *y eso se ve idéntico a un
ataque, no a una mala configuración.* **Misma key en los dos lados.**

---

## §2 · QUÉ VA A PASAR CUANDO LO ACTIVES

**Nada visible, y es lo correcto.** El webhook empieza a registrar hechos de
sala en la base — *quién entró, quién salió, cuándo terminó una llamada*.

🔴 **Y nada más que eso, por firma tuya (`D-931`): REGISTRAR SIN JUZGAR.**
Cero consecuencia automática. **No cancela nada, no marca nada, no cobra, no
devuelve plata, y no dice de quién fue la culpa de un corte.**
*`LETRA_TELEMEDICINA` §5 sigue intacto: si el sistema decidiera quién faltó,
estaría decidiendo quién paga.*

---

## §3 · CÓMO SE VERIFICA QUE QUEDÓ BIEN — y lo hago yo, no vos

Con que **entres a una sala una vez** (aunque sea el cable de prueba,
`cable-quito`), LiveKit ya dispara `room_started` y `participant_joined`.

**Avisame y yo verifico contra la base** que el hecho quedó registrado.

⚠️ **Hasta entonces, esto está declarado como NO EJERCIDO:** mi function
**rechaza bien** lo que no tiene firma —eso sí está medido— pero **jamás
procesó un evento legítimo**. *Que una puerta cierre no prueba que abra.*

---

## §4 · LO QUE ESTE PRIMER EVENTO CIERRA, y no es menor

Hay una **ambigüedad en la propia fuente** que sólo la resuelve un webhook
real:

> `livekit-server-sdk@2.18.0` **exporta** una constante
> `authorizeHeader = "Authorize"` **que no usa en ningún lado**, mientras el
> JSDoc de su propio `receive()` dice «**`Authorization`** header from the
> request». **Los dos salen del mismo archivo.**

**Mi edge lee los dos**, `Authorization` primero — *elegir uno a ciegas y
errar produce «firma inválida» sobre webhooks legítimos, que es
indistinguible de un ataque.*

⇒ **Cuando llegue el primero, se ve cuál usa de verdad y esa línea se puede
simplificar.** Es la clase de cosa que no se cierra leyendo.

---

## §5 · LO QUE NO TE PIDO

- ❌ **Ninguna key nueva.** Se usa la que ya cargaste.
- ❌ **Ningún cambio en la app.** El webhook es servidor a servidor.
- ❌ **No hace falta tocar `pagos-*`** ni nada de S105.
