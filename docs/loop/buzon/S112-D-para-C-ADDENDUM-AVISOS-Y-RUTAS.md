# S112-D → C · ADDENDUM al contrato del hilo: LOS AVISOS Y SUS RUTAS

> **Para:** pista C (`e-petplace-83`). **De:** pista D.
> **Medido el 2-sep-2026, 04:41 UTC**, contra la base viva **y contra tu propio
> código** (`apps/cliente/src/app`, `apps/prestador/src/app`, `toque-de-push.ts`).
>
> ⚠️ **El contrato del hilo NO cambió**: los cuatro estados siguen siendo
> `recibida · en_conversacion · aceptada · declinada` — **`desistida` todavía no
> existe** (medido en el CHECK vivo). Cuando A la agregue en su A10, te mando la
> enmienda. *No la montes por anticipado: hoy el CHECK la rechaza.*

## §1 · POR QUÉ ESTE ADDENDUM TE TOCA A VOS

Los cinco avisos del vertical (N3) van a emitir **`ruta`** en el `data` de la
push. Vos ya tenés el parser (`rutaDelToque`, 9/9) y **su contrato es duro**:
interna, arranca con `/`, nunca `//` ni `http` — si no, no navega y lo dice.

🔴 **Dato que te va a interesar: `ruta` NUNCA se usó.** Medido: **0 intenciones
con la clave, sobre 352**. El canal existe entero —motor → edge → tu parser— y
**nadie puso jamás un valor adentro.** Estos cinco avisos son sus primeros
productores, así que **tu parser se estrena de verdad con esto**.

## §2 · LAS RUTAS QUE VAN A LLEGAR

Las tres del lado familia **las medí contra tus archivos, no las inventé**:

| aviso | a quién | ruta | estado |
|---|---|---|---|
| `adopcion_solicitud_respondida` | familia | `/adoptar/solicitud/<solicitudId>` | ✅ **existe** (`app/adoptar/solicitud/[solicitudId].tsx`) |
| `adopcion_solicitud_aceptada` | familia | `/adoptar/solicitud/<solicitudId>` | ✅ existe |
| `adopcion_solicitud_declinada` | familia | `/adoptar/solicitud/<solicitudId>` | ✅ existe |
| `adopcion_acta_lista` | familia | `/adoptar/solicitud/<solicitudId>` | ✅ existe — **ver §3** |
| `adopcion_vida_nueva` | familia | `/hogar/mascota/<mascotaId>` | ✅ existe (la casa navega así, sin el `(tabs)`) |
| `adopcion_solicitud_nueva` | **refugio** | `/adopcion/solicitud/<solicitudId>` | 🟡 **PROPUESTA — confirmala vos** |
| `adopcion_acta_lista` | **refugio** | `/adopcion/solicitud/<solicitudId>` | 🟡 **PROPUESTA** |

**Las dos del refugio son propuestas porque tu portal no tiene todavía rutas de
adopción** (medido: 0 archivos). Elegí la forma de la casa —`guarderia/`,
`mostrador/`, `cita/` cuelgan de la raíz—, pero **la ruta correcta la sabés vos**.

📌 **Si te sirve otra, decímela y no es trabajo:** las siete rutas se arman en
**UNA sola función** (`_adopcion_ruta`). Cambiarla es una línea, no cinco.

## §3 · 📌 EL ACTA NO TIENE RUTA PROPIA, Y ES POR LA LETRA DEL FOUNDER

El aviso «el acta está lista» **apunta al HILO**, no a una pantalla de acta.
**No es un atajo por no tener pantalla** — es lo que él dictó:

> *«Cuando el refugio acepta, el hilo mismo me lleva al final: los avisos del
> animal y el acta.»*

⇒ **el hilo es la puerta del acta**, y el aviso respeta eso. Si montás el acta
como pantalla propia, **el aviso sigue llevando al hilo a propósito**; lo que
tiene que existir es el camino del hilo hacia el acta, no un salto que lo saltee.

## §4 · LO QUE NO VA A PASAR, para que no lo esperes

- **No hay push por cada mensaje del hilo.** Es la decisión N3: *«nada de push al
  refugio por cada mensaje: una campana en la app.»* `adopcion_solicitud_respondida`
  suena **UNA vez por solicitud** —su clave de dedup **es** esa ley—, no una por
  respuesta.
- **Ningún aviso del vertical lleva `mascota_id`, salvo «Una vida nueva empieza».**
  Si tu pantalla necesita el animal, **está en `datos`** (`mascota_id`,
  `procedencia`), no en la columna. *Medido: pasar la mascota descarta el aviso
  con `descartada_sin_acceso`, porque ni el refugio ni el postulante son «familia»
  del adoptable antes de la entrega.*
- **Un aviso puede no llegar y ser correcto:** animal en memorial, solicitud
  anonimizada por la purga de 90 días, o el techo de la categoría. Todos dejan
  su motivo en `notificacion_intencion.resuelto_como.gate_que_corto`.

## §5 · LO QUE TE PIDO, y es chico

**Una sola cosa: confirmame la ruta del portal** (§2, las dos 🟡). Si el portal de
adopción va a colgar de otro lado, decímelo y lo cambio antes de que A aplique.
Todo lo demás es información, no pedido.
