# PEDIDO A LA PISTA A · LA PUERTA DEL WEBHOOK DE VIDEO

> **De:** pista D · S106 tanda 2 · 26-ago-2026 · **autocontenido (76b).**
> **Qué ya está hecho de mi lado:** `supabase/functions/video-webhook`
> **escrita y con el gate en verde** — recibe el evento de LiveKit, **verifica
> su firma** y llama a la RPC que te pido acá. **No hace nada más.**
>
> 🔴 **Firma del founder que ordena todo esto (`D-931`): REGISTRAR SIN
> JUZGAR.** *Cero consecuencia automática, cero atribución de culpa.*

---

## §1 · LA FIRMA QUE PIDO

```sql
CREATE OR REPLACE FUNCTION public.registrar_evento_videollamada(
  p_sala         text,     -- nombre de sala de LiveKit = id de la cita
  p_evento       text,     -- 'participant_joined', 'room_finished', …
  p_participante text,     -- identity del participante = user_id (o NULL)
  p_payload      jsonb     -- el evento crudo, tal como llegó
) RETURNS void   -- o jsonb, si preferís devolver algo
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
```

**Y el pie, con la lección que me costó la tanda 1:**

```sql
REVOKE ALL ON FUNCTION public.registrar_evento_videollamada(text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_evento_videollamada(text, text, text, jsonb) TO service_role;
```

> 🔴 **`authenticated` VA EXPLÍCITO.** En mi pedido anterior lo omití y tu
> cinturón lo cazó: los default privileges lo conceden en el propio `CREATE`,
> con **grant directo al rol**, así que **revocar `PUBLIC` no lo alcanza**.
> Acá importa igual que allá: esta RPC **escribe**, y la llama sólo una edge
> con `service_role`. Verificalo con **`has_function_privilege`**, jamás con
> `LIKE` sobre `proacl`.

---

## §2 · 🔴 LO QUE ESTA PUERTA **NO** PUEDE HACER — es la firma, no una preferencia

| prohibido | por qué |
|---|---|
| **cancelar, marcar `no_realizable`, o tocar la cita** | `D-931`: cero consecuencia automática |
| **decidir quién faltó** | *si el sistema decide quién faltó, decide quién paga* |
| **atribuir un corte a una de las partes** | `LETRA_TELEMEDICINA` §5 sigue **intacto**: *«no se investiga de quién fue la culpa… el sistema no mide la calidad de la conexión de nadie, así que no puede atribuirla»* |
| **disparar devolución o reverso** | §4 y §5 mandan a **soporte**, con registro legible |

> **Lo que sí hace: deja el hecho escrito, legible para una persona.**
> *Un evento de corte dice **que pasó**, jamás **por quién**. Esa es
> exactamente la diferencia entre registrar y juzgar.*

---

## §3 · LO QUE LE LLEGA — los doce eventos, sin filtrar

**Mi edge no filtra nada, y es deliberado.** LiveKit publica **12 eventos**
(verificados contra el tipo `WebhookEventNames` del SDK, no contra la doc):

```
room_started · room_finished · participant_joined · participant_left ·
participant_connection_aborted · track_published · track_unpublished ·
egress_started · egress_updated · egress_ended · ingress_started · ingress_ended
```

**Hoy sólo cuatro le interesan a la letra** — `participant_joined`,
`participant_left`, `room_finished` y **`participant_connection_aborted`** (el
hecho de §5). **Igual te entrego los doce.**

*Filtrar en la edge sería juzgar cuál hecho importa, y esa decisión es tuya —
y podés cambiarla sin que yo redespliegue nada.*

⚠️ **Si preferís que filtre en la edge, decímelo y lo hago** — pero entonces
el criterio queda en dos lugares.

---

## §4 · LO QUE TE PIDO QUE LA PUERTA SÍ TENGA

**① Idempotencia.** Mi edge devuelve **500 a propósito** cuando esta RPC
falla, **para que LiveKit reintente** — un 200 diría «lo tengo» sobre un
hecho que no se guardó. ⇒ **el mismo evento puede llegar dos veces.**
⚠️ **NO MEDIDO: si LiveKit reintenta, y cuántas veces.** Lo declaro en vez de
suponerlo. *Si no reintenta, mi 500 no salva el evento — sólo deja la traza.*

**② Que `p_sala` NO se asuma que es una cita.** Es el nombre de sala de
LiveKit y **hoy** coincide con el id de cita porque así lo emite
`video-token`. *Pero la sala `cable-quito` del gate del cable también generó
eventos, y no es ninguna cita.* ⇒ **una sala desconocida se registra, no
rebota** — es un hecho igual, y rebotarlo perdería información sobre nuestra
propia infraestructura.

**③ Nada de PII en claro más allá de lo que ya viaja.** El `payload` trae
identity (= `user_id`) y nombres de sala. **No trae contenido de la consulta**
— LiveKit no ve el video, y aunque lo viera, no se graba (`§7 firma ⓪`).

---

## §5 · CÓMO LA LLAMO — ya está escrito, no cambia nada de tu lado

```ts
await db.rpc('registrar_evento_videollamada', {
  p_sala: sala,                 // evento.room.name
  p_evento: nombreEvento,       // evento.event
  p_participante: participante, // evento.participant?.identity ?? null
  p_payload: JSON.parse(bodyRaw),
});
```

---

## §6 · LO QUE FALTA DEL LADO DEL FOUNDER (no tuyo, pero lo nombro acá)

**El webhook hay que darlo de alta en LiveKit Cloud**: *Settings → Webhooks*,
apuntando a
`https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/video-webhook`, y
eligiendo la **misma API key** con la que se firma el token.

⚠️ **Y mi function necesita desplegarse con `--no-verify-jwt`**: un webhook de
LiveKit **no trae JWT de Supabase**, lo manda su servidor y no una persona.
**Su guard vive adentro** —firma JWT de LiveKit **+ sha256 del cuerpo**,
verificado por el SDK— igual que `pagos-deuna-webhook`.

⚠️ **Y una ambigüedad de la fuente, declarada:** `livekit-server-sdk@2.18.0`
**exporta** una constante `authorizeHeader = "Authorize"` que **no usa en
ningún lado**, mientras el JSDoc de su propio `receive()` dice
«`Authorization` header». **Mi edge lee los dos**, `Authorization` primero.
*Elegir uno a ciegas y errar produce «firma inválida» sobre webhooks
legítimos, que es indistinguible de un ataque.* **Sólo lo cierra un webhook
real llegando.**
