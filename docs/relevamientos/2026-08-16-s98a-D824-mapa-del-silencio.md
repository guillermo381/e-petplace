# D-824 · EL MAPA DEL SILENCIO — para firmar por tandas, no por catálogo

**Nada encendido acá. Esto es la lista para que la firma se dé mirando, no
adivinando.** Todo medido contra el objeto (`cat_notificacion_tipos`,
`pg_get_functiondef` de las 5 puertas y de `_voz_notificacion`,
`notificacion_intencion`), no leído de la ficha.

**46 tipos en total · 25 hablan bien · 21 no.**

---

## 0 · 🔴 LA FICHA DESCRIBÍA DOS EJES QUE SE CRUZAN. SON OTRA COSA.

D-824 decía *«13 en sombra · 15 sin productor · los conjuntos se cruzan»*.
Medido, el cruce es un **anidamiento**, y aparece un estado que la ficha no
tenía:

| lo que la ficha decía | lo medido |
|---|---|
| dos conjuntos que se cruzan | **`sin productor` ⊂ `en sombra`** — hay **CERO** tipos sin productor que no estén además en sombra |
| 13 en sombra | **21** |
| 15 sin productor | **14** |
| — | **🔴 5 tipos que YA hablan y dicen el genérico** — ni mudos ni apagados: mal dichos |

**Por qué el anidamiento simplifica la firma:** no hay que preguntarse las dos
cosas por cada tipo. Alcanza con **una** pregunta —*¿tiene productor?*— porque
todo lo que no lo tiene está apagado igual. Quedan **dos grupos limpios**, y
encenderlos cuesta cosas muy distintas.

**Y por qué el tercer estado importa más que los otros dos:** los grupos A y B
son silencio, y el silencio no molesta a nadie. **El grupo C ya le está
llegando a clientes reales sin decir nada útil.**

---

## 1 · GRUPO A — **EN SOMBRA, CON PRODUCTOR** (7)

> **Encenderlos cuesta un `UPDATE`.** El productor ya existe y ya corre: hoy
> nace la intención y el despachador la descarta por la bandera.
> **Son los que pueden hacer ruido mañana**, así que son los que más merecen
> firmarse de a uno.

| tipo | audiencia | categoría | qué diría | a quién le sirve |
|---|---|---|---|---|
| `prestador_en_revision` | prestador | operación | «Recibimos tu solicitud, la estamos mirando» | **Alto.** Hoy manda su alta y no pasa nada visible: el silencio se lee como *«no llegó»*, y vuelve a mandarla |
| `prestador_aprobado` | prestador | operación | «Ya podés empezar a recibir clientes» | **El más alto del grupo.** Es la noticia que la persona está esperando; hoy se entera entrando a mirar |
| `alta_asistida_completada_por_cliente` | cliente | operación | «Tu ficha quedó completa» | Medio — cierra un trámite que el cliente empezó |
| `alta_asistida_vencida_soporte` | prestador | operación | «Un alta que empezaste venció sin completarse» | Medio — es recuperable si se avisa a tiempo |
| `pedido_estado` | cliente | operación | *(genérico de estado)* | **Bajo, y probablemente NO deba encenderse:** la familia `pedido_*` ya tiene avisos específicos. Este es el que sobra |
| `pedido_recurrente` | cliente | operación | «Tu pedido de siempre sale en X días» | Medio — **pero D-778: la recurrencia depende de la pasarela** |
| `sistema` | ambas | seguridad_cuenta | *(comodín)* | **NO se enciende como tipo:** es un cajón sin evento propio. Encenderlo es abrir un canal sin dueño |

**Recomendación de tanda:** los dos de `prestador_*` juntos —son el mismo
momento de la misma persona y se leen como una conversación—. El resto, cada
uno cuando su superficie exista.

---

## 2 · GRUPO B — **EN SOMBRA Y SIN PRODUCTOR** (14)

> **Acá encender no es una bandera: es construir.** Cada uno necesita
> productor, voz y sombra. Y **ninguno se puede firmar sin saber de dónde sale
> el hecho** — varios dependen de motores que todavía no existen.

| tipo | audiencia | qué diría | 🔴 de qué depende |
|---|---|---|---|
| `pago_confirmado` | cliente | «Recibimos tu pago» | **La pasarela (D-764).** Hoy el pago es simulado: avisar de un cobro que no ocurrió sería mentir |
| `liquidacion_disponible` | prestador | «Tenés plata lista para cobrar» | **2ª ola** — ya declarado fuera |
| `mensaje_nuevo` | ambas | «Te escribieron» | **No hay mensajería** — ya declarado fuera |
| `cita_completada` | ambas | «La cita terminó» | **FUERA A PROPÓSITO** — *quien atendió ya lo sabe* (declarado) |
| `cita_no_show` | ambas | «No se presentó» | Toca plata (devengo). Necesita su letra antes que su aviso |
| `cita_rechazada` | cliente | «El prestador no pudo tomar tu cita» | **Alto valor**, y su productor es barato: la puerta del rechazo ya existe |
| `cita_calificada` | prestador | «Te calificaron» | Medio. ⚠️ Ojo con la reputación: avisar cada estrella puede volverse ansiedad |
| `vacuna_vencida` | ambas | «A Thor le vence una vacuna» | **El más alineado con EL NORTE** — es el producto persiguiendo el bienestar. Necesita el reloj que lo dispare |
| `wearable_alerta` | ambas | «Algo cambió en sus signos» | **No hay wearable** (hueco M-WEAR) |
| `promocion` | cliente | *(comercial)* | Categoría `comercial` = **`default_habilitada = FALSE`**: opt-in. Encenderlo no hace que llegue |
| `devolucion_estado` | cliente | «Tu devolución avanzó» | **No hay motor de devoluciones** (declarado fuera de v1) |
| `prestador_rechazado` | prestador | «No pudimos aprobar tu solicitud» | **Necesita letra antes que código:** un rechazo sin motivo ni camino es peor que el silencio |
| `prestador_suspendido` | prestador | «Tu cuenta quedó suspendida» | Ídem, y más grave |
| `alta_asistida_pendiente_enviar_email` | cliente | *(interno de un flujo)* | Parece de operación interna, no de familia. **Candidato a morir en vez de encenderse** |

---

## 3 · 🔴 GRUPO C — **YA HABLAN Y DICEN EL GENÉRICO** (5)

> **Esto NO es parte de la decisión de encendido. Ya están encendidos.**

`pedido_confirmado` · `pedido_en_camino` · `pedido_hacia_destino` ·
`pedido_entregado` · `pedido_entrega_fallida`

**La medición, que es lo que lo vuelve urgente:**

```
pedido_confirmado : 10 intenciones · 1 entregada · 0 con título
pedido_en_camino  :  2 intenciones · 2 entregadas · 0 con título
```

⇒ **Tres avisos ya llegaron a un teléfono sin decir qué pasó.**

**La causa, medida en los dos lugares donde podría estar la voz y no está:**
`_voz_notificacion` no tiene rama para ellos **y** su productor
(`_trg_pedido_avisa_familia`) no hornea `datos.titulo`. `despachar-push` lee
`datos.titulo` y cae al genérico — que es exactamente el modo de falla que
S97 documentó y curó para los cinco del negocio.

> ***Un tipo mudo no molesta a nadie; un tipo que habla mal gasta la atención
> de la familia y le enseña a ignorar el próximo aviso.*** Y la despensa es
> justo donde esos avisos tienen que valer: son los cinco de §5 de la letra
> del recorrido.

**Esto se cura sin firma de encendido** — no enciende nada, le pone voz a algo
que ya suena. **Es mi recomendación de que vaya primero, antes que cualquier
tanda del grupo A.**

---

## 4 · LO QUE ESTE MAPA **NO** DICE

- **No propone un orden de encendido.** Las columnas «qué diría» y «a quién le
  sirve» son insumo, no dictamen: la firma es del founder, tipo por tipo o por
  tanda.
- **Las voces escritas acá son borradores de una línea**, no letra. La voz
  final se escribe al construir cada uno, con el tono de la casa.
- **No mide si alguien las querría.** Mide qué hecho existe y qué canal falta.
  *Que un aviso sea posible no lo hace deseable* — el criterio que abrió D-822
  sigue rigiendo: **el canal nace útil, no ruidoso.**
- **No toca `default_habilitada` ni `apagable_existencia`.** Un tipo encendido
  en una categoría opt-in sigue sin llegar, y eso es correcto: son dos
  perillas distintas y confundirlas haría creer que algo se encendió cuando no.
