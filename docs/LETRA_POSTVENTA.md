# LETRA_POSTVENTA — el motor del caso

> **v1.0 — S114, 7-sep-2026. Firmada por el founder (F1–F10 + D8).**
> Gemela de `DIRECCION_POSTVENTA.md` (la experiencia). **Contrastes obligatorios, y se leen ANTES:**
> `MODELO_FINANCIERO` §4.3 · §8.5 · 7.3 · 7.14 · 7.16 · §6.2 · §6.3 (todo lo que toque plata) ·
> `POLITICAS_EPETPLACE` P14(b) · P16(d) · P18 · P24 · `MODELO_NOTIFICACIONES` §3 · §7 · §9 · §10 ·
> `MODELO_LOYALTY` §7 · `PORTAL_PRESTADOR` §6.6.6 · §7.5.3.
> **Regla de unicidad: dos sistemas de postventa en la misma base está prohibido. Este documento
> es EL sistema** — y por eso F9 retira la pantalla de devoluciones del admin legado con lápida.
>
> ### 📌 ENMIENDA ② (founder, 7-sep-2026) — **§8 · el devengo de guardería ancla en la ESTADÍA**
> No en su cita. La estadía es lo contratado y lo pagado, y §6 le pregunta **al objeto** si tiene
> devengo: con el ancla ambigua esa pregunta tiene dos respuestas y **el camino de la plata se
> bifurca sin síntoma**. Letra vieja tachada en §8, no borrada.

> ### 📌 ENMIENDA ①, mesa del 7-sep-2026 — **§14 · `D-888` ya no queda en NULL**
> **La plata de los tres reversos fuera de ventana ($87,65) salió de tarjeta de PRUEBAS**
> (dato del founder). ⇒ **no vuelve a nadie: es deuda de motor**, y se cierra construyendo
> el reverso fuera de ventana como acto humano registrado (§6). *La letra vieja queda
> TACHADA en §14 y no borrada — se marca acá arriba para que nadie tenga que leer la
> sección entera para saber que ese dato ya se firmó.*

> ⚠️ **Contexto que ninguna pista debe olvidar:** al escribirse esta letra **ningún dato de
> servicio en la base es real** — todo es prueba de construcción, y producción es **octubre**.
> **Ningún número del relevamiento sirve como línea base** y ningún umbral se calibra contra ellos.

---

## §1 · Alcance

**El caso nace del OBJETO y muere con él.** Objetos de V1:

| objeto | servicios | quién lo cierra hoy |
|---|---|---|
| **cita** | paseo · grooming · veterinaria · adiestramiento · telemedicina | el prestador |
| **estadía** | guardería (día · paquete · mensualidad) | el prestador, por acta |
| **pedido** | despensa | el vendedor / repartidor, cuarto escalón |

Los comprables recurrentes (plan, paquete, mensualidad, programa) **entran por su cita o su
estadía, jamás por el contrato**. La salida del contrato ya tiene su puerta (P14/P24 y la sección
de pagos recurrentes).

**No abre caso** (y la app lo dice sin abrirlo): la cancelación del dueño en ventana · la reagenda ·
el no-show del dueño · una pregunta de seguimiento. *Un caso abierto sobre algo que no es un caso
ensucia el número que después decide.*

---

## §2 · F1 — LA REGLA DEL CIERRE AUSENTE (la firma que sostiene todo lo demás)

**Cerrar es obligatorio y tiene DOS sabores. El prestador cobra sólo si marca uno:**

| lo que pasó | el acto | consecuencia |
|---|---|---|
| el servicio ocurrió | `cierre_con_calidad` | devenga (§8) |
| la familia no estuvo / no abrió / no entregó al animal | `cierre_no_show` | devenga al precio snapshoteado (Decisión T) |
| **nada marcado** | — | **a las 24 h aviso al prestador · a las 48 h el objeto queda `no_ejecutado`: no devenga y dispara la clase 1** |

- Las dos ventanas cuelgan de la **hora de fin declarada del objeto** (fin de la cita, hora de
  devolución de la estadía, ventana de entrega del pedido). Se computan por **cron con control
  positivo**: el arnés confirma que su sujeto existe antes de medir, y produce su rojo (un objeto
  que debía expirar y no expiró).
- **El paso a `no_ejecutado` es irreversible por el prestador.** Si el prestador aparece después
  diciendo que sí lo hizo, es un caso de clase 2 **suyo**, no un UPDATE.
- **La familia no ve el reloj de 48 h.** Ve su caso cuando existe. *Un countdown sobre el
  incumplimiento ajeno convierte la espera en espectáculo.*

### 🔴 §2bis · La puerta que esta firma abre, y nace con ella

Si el `no_show` **es un acto del prestador y le hace cobrar**, entonces existe el no-show marcado
sobre una familia que sí estuvo. **Nace el motivo `no_show_disputado` (clase 2): «me cobraron una
ausencia que no fue».** Su evidencia es la del objeto (hora del acto, GPS, fotos, acta) y lo
resuelve la casa. *Un acto que mueve plata a favor de quien lo declara necesita su puerta de
reclamo el mismo día que nace.*

---

## §3 · F2 y F3 — lo que las puertas tienen que registrar

- **Las tres funciones que cancelan una cita reciben `p_actor` (`dueño` | `prestador` | `sistema`)
  y `p_motivo` (código del catálogo).** Sin actor no se cancela: la firma vieja
  (`p_cita_id` solo) se retira, no se deja conviviendo. **Rojo:** una cancelación nueva con actor
  NULL.
- **Las cancelaciones históricas quedan con actor NULL y se dice** (son datos de prueba; no se
  backfillea lo que nadie sabe — L de la casa).
- **Guardería gana su motivo del lado del prestador** en `no_recogida`: hoy los cuatro culpan a la
  familia. **Un catálogo que sólo puede culpar a un lado no es un catálogo.**

---

## §4 · El catálogo de motivos — el motivo trae la clase

`cat_motivos_postventa`: `codigo` · `objeto` · `clase` (1|2|3) · `urgente` · `voz` (tuteo) ·
`pide_foto` · `activo`. **La clase jamás la elige una pantalla ni un modelo: viaja en la fila.**

| objeto | código | clase | voz (tuteo) |
|---|---|---|---|
| cita | `no_ejecutado` | 1 | No vino / no me atendieron |
| cita | `cancelado_prestador` | 1 | Lo canceló el prestador |
| cita | `no_show_disputado` | 2 | Me cobraron una ausencia que no fue |
| cita | `calidad` | 2 | El servicio no fue como esperaba |
| cita | `duracion` | 2 | Duró menos de lo que pagué |
| cita | `trato` | 2 | El trato con mi mascota no estuvo bien |
| cita | `cobro` | 2 | Me cobraron distinto de lo que decía |
| cita | `mascota_afectada` | **3** | Mi mascota volvió lastimada o enferma |
| cita | `mascota_extraviada` | **3** | Mi mascota se perdió durante el servicio |
| estadía | *(hereda las de cita)* + `no_recogida_prestador` | 1 | No pasaron a buscarlo |
| estadía | `devolucion_tarde` | 2 | Lo devolvieron fuera de hora |
| pedido | `no_entregado` | 1 | No llegó |
| pedido | `cancelado_vendedor` | 1 | Lo canceló el vendedor |
| pedido | `incompleto` | 2 | Faltaron cosas |
| pedido | `producto_distinto` | 2 | Llegó algo distinto |
| pedido | `producto_danado` | 2 | Llegó dañado |
| pedido | `cobro` | 2 | Me cobraron distinto |
| pedido | `producto_en_mal_estado` | **3** | Mi mascota comió algo en mal estado |
| todos | `otra_cosa` | 2 | Es otra cosa · contame |

**Sin «Otro».** El último invita a contar (§2 de la dirección).

---

## §5 · Las tres clases y su camino

| clase | disparo | plazo | quién resuelve |
|---|---|---|---|
| **1 · falla del prestador** | El objeto lo dice: `no_ejecutado` (§2), cancelación con `p_actor='prestador'`, pedido cancelado por el vendedor o no entregado | ninguno | **el motor**. La familia sólo elige destino |
| **2 · ejecutó, salió distinto** | Lo cuenta la familia | **24 h** al prestador; al vencer o al pedido de cualquiera, entra la casa | prestador o casa |
| **3 · urgente (la mascota)** | Motivo `urgente` | **sin plazo — es ahora** | la casa, y en paralelo NEXO orienta (deriva al vet, no diagnostica, no interpreta exámenes) |

**Ventana para abrir un caso: 7 días** desde el cierre o la entrega (F7). Fuera de ventana: sin
caso, conversación con la casa.

**Estados del caso:** `recibido → con_prestador → con_casa → resuelto → cerrado`, más los finales
`resuelto_entre_partes` · `retirado` · `sin_lugar`. Máquina de estados en catálogo
(`cat_transiciones_caso`), como todo en esta casa; **`sistema` declarado como actor válido Y
aceptado por la puerta** *(la lección del callejón de S105: un actor que el catálogo declara válido
y la puerta no acepta se descubre con plata de por medio).*

---

## §6 · El camino de la plata — se decide MIDIENDO, jamás por clase

🔴 **Al resolver, la RPC le pregunta al objeto si tiene evento económico.**

- **Tiene devengo** → `aplicar_reembolso()` (total o parcial): evento inverso con montos negativos,
  el original a `reversado`, el inverso se descuenta del payout siguiente (§4.3, §8.5, 7.3).
- **No tiene devengo** → **se declara sobre el pago** (estado + `pago_metadata`, patrón 7.14/7.16).
  `aplicar_reembolso()` no se toca.
- **El caso registra por cuál de los dos caminos salió**, y con qué monto.

*Elegir el camino por clase escribiría un reembolso declarado sobre un servicio que sí devengó: la
plata vuelve a la familia, el prestador conserva el devengo y la casa paga la diferencia sin que
nadie lo vea.* **Rojo de E: una devolución declarada sobre un objeto que tiene evento económico.**

**Destino, a elección del dueño, sin discusión** (P14(b)/P16(d)/P18(d)/P24(d)):
1. **Medio de pago original.** Dentro de la ventana del riel (Nuvei mismo día · DeUna 24 h): reverso
   por el motor, con el trigger que mueve el sujeto (D-923). **Fuera de ventana es acto humano:**
   estado `en_camino_manual`, quien la ejecuta la marca en el caso, y la superficie **no promete
   fecha**.
2. **Saldo e-PetPlace** (F6, §7).

### F4 · La comisión
**En falla del prestador, e-PetPlace devuelve también su comisión.** Reembolso total = comisión
entera; parcial = comisión proporcional. *Cobrar comisión por un servicio que no ocurrió es cobrar
por nada.* **Se firma acá porque hasta hoy lo decidía el código, no una letra.**

---

## §7 · F6 · El saldo e-PetPlace — nace en V1

**Es un pasivo del ledger: plata que le debemos al dueño.** Su letra mínima, que 7.16 exigía
«antes del primer crédito real» y cuyo disparo (pasarela fase 1) ya ocurrió:

- **Del HOGAR**, no de la mascota (mismo criterio que el bono de guardería: lo que es por mascota
  es el uso, no el saldo).
- **Se acredita sólo por el motor**, jamás por INSERT de una app. Se consume **FIFO** en cualquier
  comprable, al pagar.
- **No vence en V1** y **no se retira a efectivo** — salvo que sea el destino elegido de una
  devolución, que es plata que ya era suya.
- **Cada movimiento nombra su origen** (caso, compra) y es idempotente.
- **Cura obligatoria heredada de D-314:** sin policy que deje al usuario escribirse el saldo;
  `REVOKE EXECUTE` a `anon` y `PUBLIC`; `SET search_path`.

---

## §8 · D8 y F10 · El ledger — el evento sigue a lo ejecutado

**Medido:** el ledger no se escribe desde el 9-ago; los únicos productores de devengo son los
cierres de paseo, grooming y adiestramiento. **Veterinaria, telemedicina, guardería y despensa
cobran y no devengan.** Sin devengo no hay liquidación, y sin liquidación no hay de dónde
descontar una devolución.

**Los cuatro productores que faltan** (firmados F10), sobre el chasis probado de los tres que
funcionan — `crear_evento_economico()`, como todo:

| servicio | el acto que devenga |
|---|---|
| **veterinaria** y **telemedicina** | el cierre de la atención (mismo patrón que grooming) |
| **guardería** día y paquete | el acta de `entregar` |
| **guardería** mensualidad | **por día ejecutado**, no por mes cobrado |

> ### 🔴 ENMIENDA ② (founder, 7-sep-2026) — **el evento de guardería ANCLA EN LA ESTADÍA**
> ~~*(la letra original no lo decía, y con la cita y la estadía existiendo las dos, el ancla
> quedaba ambigua)*~~ **El `origen_id` del evento económico de guardería es la ESTADÍA, jamás su
> cita.**
>
> **La razón, y no es de prolijidad:** la estadía es lo contratado y lo pagado. Y §6 manda que
> al resolver **se le pregunte AL OBJETO si tiene devengo** — con el ancla ambigua **esa pregunta
> tiene dos respuestas**: preguntada sobre la cita dice «no hay evento» y preguntada sobre la
> estadía dice «sí». *El camino de la plata se bifurcaría sin un solo síntoma: una devolución se
> declararía sobre el pago mientras el prestador conserva su devengo, y la casa paga la
> diferencia sin que nadie lo vea.* Es exactamente el modo de falla que §6 existe para cerrar.
>
> ⚠️ **Consecuencia para E:** su permisividad declarada sobre el ancla de guardería **queda
> cerrada** — el rojo de §8 se mide contra la estadía y sólo contra ella.
| **despensa** | el cuarto escalón, `entregado` |

*La mensualidad devenga por día porque el principio no cambia con la modalidad: el evento
económico nace de lo ejecutado. Devengar el mes al cobrar sería fabricar un evento sobre servicios
que todavía no ocurrieron — y después no habría cómo reversar el día que falla.*

**Rojo de E:** un sujeto pagado y cerrado cuyo objeto no produjo evento económico.

---

## §9 · F5 · Los asientos, y cómo el admin no rompe la puerta única

**El asiento de la casa vive en el admin (firma del founder), y su front se construye como MVP
propio antes de octubre.** Para que eso no abra un agujero:

1. 🔴 **La escritura de postventa es SOLO por función.** `REVOKE INSERT, UPDATE, DELETE` sobre las
   tablas del caso, del saldo y de los motivos a `authenticated`; escriben únicamente las RPCs
   `SECURITY DEFINER`. **El admin no puede escapar aunque quiera** — la puerta única deja de ser
   prosa y pasa a ser permiso. *(La lección de D-889: una ley que vive sólo en prosa da verde y
   silencio.)*
2. **El admin entra con SESIÓN DE USUARIO con rol `casa`, jamás con `service_role` desde un
   navegador.** Un `service_role` en un bundle web bypasea toda RLS y es la misma clase de
   catástrofe que una anon key expuesta. **A lo mide antes de escribir una línea del portal.**
3. **Tres asientos en RLS**, verificados por PostgREST real y no simulado: familia ve sus casos ·
   prestador ve los de sus objetos · casa ve todos · **tercero: cero**.
4. **El asiento provisional, hasta que el portal exista:** las mismas RPCs, llamadas a mano por el
   founder con el snippet documentado que A deja en `docs/`. **La decisión se conversa en la mesa;
   la ejecución la hace la RPC** — que exige `decidido_por` y deja el hecho en el hilo. *Consultar
   en la mesa es cómo se decide, no cómo se ejecuta: una resolución que dependa de una
   conversación no deja rastro.*
5. **Sin asignación de casos en V1** (la casa es una sola persona, firmado).

---

## §10 · Los avisos — el motor existe; faltan los PRODUCTORES

Nueve tipos nuevos, **cada uno con su productor** (la lección D-673: el motor entero, gateado y
vivo, y el aviso más obvio no existe porque nadie toca el timbre). Categoría `operacion` /
`relacional` ⇒ **utility**. Canal: el primero habilitado con `transporte_vivo`; `in_app` es el
piso. Una entrega por intención.

`caso_recibido` · `caso_elegir_devolucion` · `caso_prestador_respondio` · `caso_resuelto` ·
`caso_plata_en_camino` / `caso_saldo_acreditado` · `caso_abierto` (prestador) ·
`caso_sin_cerrar_24h` (prestador) · `caso_no_ejecutado_48h` (prestador) · `caso_urgente` (casa).

**Email de constancia forzado** en: `caso_resuelto`, movimientos de plata, `caso_no_ejecutado_48h`.
**WhatsApp sólo en dos momentos**: cuando la familia tiene que ACTUAR (`caso_elegir_devolucion`) y
cuando la plata se movió (`caso_resuelto` / `caso_saldo_acreditado`) — **porque desde el
1-oct-2026 se cobra por mensaje y Ecuador está en la banda cara** (`FINANCIERO` §11bis).

**Estado medido del canal (7-sep, supersede al canon):** token válido (196 chars, `EAA`, dos
permisos) · **8 plantillas en UTILITY y aprobadas** — la re-categorización crítica ya está hecha ·
**bloqueo vivo: `code_verification_status: EXPIRED` en el número.** `NOTIFICACIONES` §0quater y
`FINANCIERO` §11bis ③ quedan enmendados con la letra vieja **tachada y no borrada**.

---

## §11 · La IA — dónde sí, y dónde jamás

| momento | la IA hace | la regla / el humano hace |
|---|---|---|
| **intake** | lee el texto o el dictado → propone **motivo del catálogo + resumen de una línea + qué evidencia falta** | **la familia confirma**; recién ahí la regla crea el caso con la clase de la fila. Procedencia `ia_intake`, modo `texto\|voz`, `confirmado_por` |
| **clase 1** | nada | el motor mide y resuelve |
| **Hoja del caso** | resume hilo + objeto → **propone resolución con su porqué, marcada «propuesta»** | la casa decide; queda `decidido_por` |
| **redacción** | borradores de los mensajes de la casa, en tuteo, desde plantillas con variables | un humano lee y manda. **Las etiquetas del trámite son plantillas fijas** |
| **clase 3** | NEXO orienta con su regla intacta | la casa atiende ya |

**El disparo nunca es del modelo: una regla determinística decide que algo exista; el modelo
redacta.** Ninguna salida de IA escribe estado, monto ni transición.

**Los rojos de D:** una salida sin `confirmado_por` · un motivo fuera del catálogo · cualquier
campo de estado o de plata en la salida del modelo · NEXO interpretando un valor de laboratorio
dentro de un caso.

---

## §12 · Lo que se mide (E), y con qué comando

Casos por 100 objetos ejecutados · % resueltos por el motor (clase 1) · % resueltos entre partes
antes de la casa · % con la casa · tiempo a resolución (mediana y p90) · prestadores que responden
dentro de las 24 h · objetos que llegan a `no_ejecutado` · reabiertos · plata devuelta **por causa,
por riel y por camino** (declarada vs `aplicar_reembolso`) · casos por familia · costo de WhatsApp
por caso · **«¿Quedó resuelto?»** (un toque al cerrar; no es puntaje, es la única pregunta).

**Cada número nombra el comando que lo produce, o lleva su fecha y su SHA.** Ninguno usa los datos
de hoy como línea base.

---

## §13 · Lo que V1 NO hace, y se dice para que no se infiera

No lee WhatsApp entrante · no decide plata por modelo · no compensa con cupones ni beneficios del
loyalty · no cubre el cobro de mostrador (walk-in) · no tiene apelación · no tiene seguro ni
garantía de plataforma (la garantía es del prestador, firma S107) · no muestra puntajes de casos ·
**no asigna casos entre personas** · no suspende prestadores automáticamente.

**Preparado y apagado para V2** (sin lugar en UI): detección proactiva (la casa abre el caso antes
que la familia) · WhatsApp conversacional · auto-resolución ampliada por regla con auditoría por
muestra · señal de riesgo por historial (**sube a revisión humana, jamás baja a rechazo
automático**) · apelación · holdback por disputas (`FINANCIERO` §6.2, campos ya presentes) ·
consecuencias por acumulación · plazos y textos por país.

---

## §14 · Lo que esta letra NO decide

- **El MVP del portal del admin.** Letra propia, sesión propia. Acá sólo se fija qué tiene que
  poder hacer el asiento y bajo qué candado (§9).
- **La contabilidad fina de la comisión devuelta** en un reembolso parcial: la fórmula la dice
  `MODELO_FINANCIERO`.
- **`D-888`** (los tres reversos fuera de ventana, $87,65): ~~si la plata salió de una
  tarjeta real vuelve por el camino manual de §6; si fue tarjeta de pruebas es deuda de
  motor — dato pendiente del founder, queda NULL hasta que lo diga~~ **la plata salió de
  tarjeta de PRUEBAS (founder, 7-sep) ⇒ no vuelve a nadie: es deuda de motor.** Se cierra
  construyendo el reverso fuera de ventana como acto humano registrado (§6), no
  devolviendo esos tres. *Se escribe para que nadie los lea como plata de una familia
  esperando.*
- **El encendido de WhatsApp.** La llave es del founder y va última (§9 de `NOTIFICACIONES`:
  lector → pieza → gate → flip).

---

## Historial

- **v1.0 · enmienda ② (S114, 7-sep-2026, founder):** §8 fija el ancla del devengo de guardería
  en la **estadía**. *No es una precisión: con dos anclas posibles, la pregunta que §6 le hace al
  objeto devuelve dos respuestas distintas y la plata sale por el camino equivocado sin fallar.*
  Cierra la permisividad que E había declarado.
- **v1.0 · enmienda ① (S114, 7-sep-2026, mesa):** `D-888` sale de NULL. **La plata era de
  tarjeta de pruebas** ⇒ deuda de motor, no plata de una familia. §14 con la letra vieja
  **tachada y no borrada**, y la marca repetida en la puerta del documento. *Depositar
  verbatim y enmendar en su lugar son dos actos distintos, y el segundo tiene que verse.*
- **v1.0 (S114, 7-sep-2026):** redacción inicial sobre el relevamiento `S114-A-RELEVAMIENTO.md`
  (899 líneas, main en `e516a089`). Firmas del founder F1–F10 y D8. F5 firmada en el admin con
  MVP propio antes de octubre. Contexto declarado: ningún dato de servicio es real.
