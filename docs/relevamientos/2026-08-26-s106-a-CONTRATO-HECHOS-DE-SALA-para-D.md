# CONTRATO · `registrar_hecho_de_sala` — la puerta que espera `video-webhook`

> **A → D · 26-ago-2026 · S106 tanda 2.** Texto autocontenido (76b).
> **Aplicada y verificada contra el objeto**, migración `20260826280000`.

---

## ⚠️ PRIMERO, UN DESAJUSTE QUE HAY QUE RESOLVER ENTRE LOS DOS

Dijiste que `video-webhook` **ya está escrita con gate verde y sin desplegar**.
**Yo no la encontré**: no está en `origin/pista/s106-d` ni en tu worktree en
disco (busqué las dos). Así que **diseñé la RPC desde la letra firmada, no
desde tu contrato** — porque adivinar la firma que tu edge espera y escribir
una que no encaje era el peor de los dos errores posibles.

⇒ **Si tu edge ya asume otra firma, decímelo y la enmiendo.** Cambiar la RPC es
barato ahora (cero filas, cero consumidores); cambiarla cuando el webhook esté
recibiendo tráfico real no lo es.

---

## §1 · LA FIRMA

```sql
public.registrar_hecho_de_sala(
  p_sala         text,          -- obligatorio · el nombre de sala del proveedor, VERBATIM
  p_evento       text,          -- obligatorio · el tipo de evento, VERBATIM
  p_ocurrido_en  timestamptz,   -- obligatorio · el reloj DEL PROVEEDOR
  p_crudo        jsonb,         -- obligatorio · el payload entero
  p_participante text  DEFAULT NULL,  -- la `identity` de LiveKit
  p_evento_id    text  DEFAULT NULL   -- el id del evento → LA IDEMPOTENCIA
) RETURNS jsonb
```

Desde la edge:

```ts
const { data, error } = await admin.rpc('registrar_hecho_de_sala', {
  p_sala:         evento.room?.name,
  p_evento:       evento.event,
  p_ocurrido_en:  new Date(Number(evento.createdAt) * 1000).toISOString(),
  p_crudo:        evento,
  p_participante: evento.participant?.identity ?? null,
  p_evento_id:    evento.id ?? null,
});
```

**Se llama con `service_role`.** Está revocada de `PUBLIC`, `anon` **y
`authenticated`** — las tres, verificado por `has_function_privilege` contra el
objeto, no por leer el `proacl`.

> *La revocación de `authenticated` es decisión, no prolijidad: esta función
> escribe el registro con el que después se resuelve plata. Si la pudiera
> llamar cualquier sesión, cualquiera podría fabricar la evidencia de que
> estuvo en una consulta a la que no entró.*

**NO tiene wrapper en `packages/api`, y es a propósito** — igual que
`puede_entrar_a_videollamada`. Ninguna app la llama; ponerle wrapper sería
publicar una puerta que nadie debe usar.

---

## §2 · QUÉ DEVUELVE

```json
{ "ok": true, "id": "<uuid>", "ya_estaba": false, "cita_resuelta": true }
```

- **`ya_estaba`** distingue *«lo guardé»* de *«tu reintento llegó y ya
  estaba»*. **Las dos son éxito** — devolvé 200 en ambos casos. *Una puerta que
  contesta lo mismo para los dos le impide a quien la llama saber si su
  reintento sirvió de algo.*
- **`cita_resuelta`** dice si la sala se pudo mapear a una cita nuestra.
  **`false` NO es un error** — ver §3.

**Excepciones tipadas** (sólo por parámetros faltantes, que serían defecto de la
edge): `sala_requerida` · `evento_requerido` · `ocurrido_en_requerido`.

---

## §3 · LAS TRES DECISIONES DE DISEÑO QUE TE AFECTAN

### ① `cita_id` es NULLABLE — una sala que no mapea sigue siendo un hecho

`video-token` usa el id de la cita como nombre de sala, así que el camino normal
resuelve. Si no resuelve —una sala de prueba, un cambio de convención, una cita
borrada— **el hecho entra igual con `cita_id = NULL`**.

> *Es la lección del motor de pagos aplicada acá: el analizador lanzó, el evento
> se perdió y del hecho no quedó nada. Rechazar un hecho por no saber a quién
> pertenece es la misma familia de error.*

**⇒ Tu edge NO debe tratar `cita_resuelta: false` como fallo.** Si lo devolvés
como 4xx, LiveKit reintenta para siempre un evento que ya está guardado.

### ② El `evento` NO tiene `CHECK` — entra verbatim

Nada de vocabulario cerrado. *Un `CHECK` convertiría un evento nuevo del
proveedor en un webhook rebotado, y un webhook que rebota no se reintenta para
siempre.*

### ③ CERO CONSECUENCIA — y esto es firma del founder, no criterio mío

La función **no toca la cita, no cambia ningún estado, no dispara ningún
aviso**. Si alguna vez alguien quiere que un `participant_left` marque algo,
**es una decisión de letra** y no entra por acá.

Y la frontera contra §5 de la letra, escrita para que no se corra de a poco:
**presencia no es calidad.** Se registra que alguien entró y a qué hora; **no**
se registra ni se infiere si su video se veía bien, ni su ancho de banda, ni de
quién fue la culpa. *§5 firma que el sistema no mide la calidad de la conexión
de nadie «así que no puede atribuirla» — esa imposibilidad es deliberada y hay
que conservarla.*

---

## §4 · LO QUE PUSE EN LA POLÍTICA DE PRIVACIDAD, para que no diverja

Ya está en `main` (§16.1bis y §18). Si tu implementación se aparta de esto, uno
de los dos está mal:

- **12 meses** de retención de estos metadatos en el proveedor.
- **Sin contenido**: ni imagen ni voz se conservan en ningún lado.
- Textual: *«No medimos ni registramos la calidad de la conexión de nadie, y ese
  registro no atribuye responsabilidad a ninguna de las partes.»*

---

## §5 · VERIFICADO CONTRA EL OBJETO, no contra el «Finished» del push

| qué | resultado |
|---|---|
| tabla `videollamada_hechos` existe | ✅ |
| RLS activa (sólo `is_admin()` lee) | ✅ |
| función existe con la firma de §1 | ✅ |
| `anon` puede ejecutar | ❌ **no** |
| `authenticated` puede ejecutar | ❌ **no** |
| `service_role` puede ejecutar | ✅ |
| índices | 4 |
| residuo del fixture | **0 filas** |

**El cinturón ejerció la idempotencia de verdad**: dos llamadas con el mismo
`p_evento_id`, y contó **una** fila. *Que el `ON CONFLICT` esté escrito no
prueba que funcione — eso lo prueba llamar dos veces y contar.* También ejerció
el caso de la sala que no es uuid, que es justo el que la decisión ① existe para
cubrir.

**Reversa escrita ANTES de aplicar:**
`docs/relevamientos/2026-08-26-s106a-REVERSA-hechos-de-sala.sql`, declarando que
**borra los hechos ya registrados** y que hay que contar filas antes de correrla.
