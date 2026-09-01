# BUZÓN · S111-E → A · REPORTE DE CIERRE DE LA PISTA E

> **Asunto único:** reporte de cierre. El pedido de merge va en
> `S111-E-para-A-MERGE.md`.
>
> **🔴 CONTRA QUÉ Y CUÁNDO SE MIDIÓ TODO ESTE DOCUMENTO:** el **OBJETO** (DB
> linkeada) y el **REPO** en `origin/main` = **`67fec425315e202c338f91df834f0dd228a64a8b`**,
> el **1-sep-2026 al cierre**. *La rama sigue caminando después de esto: entre
> mi medición original y hoy entraron **157 commits** y dos de mis cuatro
> veredictos se vencieron. Lo mismo le puede pasar a este documento.*

---

## 🔴 ANTES QUE NADA — CORRECCIÓN DE MIS PROPIOS DATOS VENCIDOS

**Mi lote se midió contra `9443da56`. Hoy `main` es `67fec425`: 157 commits
después.** Re-medido hoy, **dos de mis cuatro veredictos ya no describen la
base**, y **dos de mis seis fichas ya están pagadas**. Se corrige acá porque un
buzón vencido se lee con la misma confianza que uno vigente.

| lo que dije | estado HOY, medido | qué hago |
|---|---|---|
| ③ «no hay mensajería entre dos cuentas» | **VENCIDO** — existe `adopcion_mensaje` + 4 funciones | corregido abajo |
| ④ `chk_destino_excluyente` bloquea la donación con destino | **PAGADO** — el constraint ya no existe | ficha ① se cierra |
| ⑤ `tipo_servicio` cerrado a dos valores | **PAGADO** — entró `padrinazgo_mensual` | ficha ③ se cierra |
| ④ el refugio no es actor de pedido | **VIGENTE** — sin cambio | ficha ② sigue viva |
| ⑤ 4 de 6 escritores sin motivo | **VIGENTE** — `6 estado · 2 motivo` | ficha ④ sigue viva |
| ⑥ tabs derivadas por función pura | **VIGENTE** — sin cambio | — |

**La evidencia de los dos que se pagaron:**

```
chk_destino_excluyente                -> YA NO EXISTE
chk_destino_donacion (el que lo reemplaza):
  CHECK (((NOT es_donacion) AND (refugio_cuenta_comercial_id IS NULL))
      OR (es_donacion AND (NOT ((mascota_id IS NOT NULL) AND (refugio_cuenta_comercial_id IS NOT NULL)))))
pedido_item_destinos gana: refugio_cuenta_comercial_id

suscripciones_servicio_tipo_valido:
  CHECK (tipo_servicio = ANY (ARRAY['guarderia_mensual','paseo_mensual','padrinazgo_mensual']))
```

⚠️ **La cura de la ficha ① salió MEJOR que lo que yo pedí, y conviene notarlo:**
yo pedía enmendar un CHECK; lo que se hizo fue **rehacer la regla entera** — la
donación ahora admite mascota **o** refugio y **prohíbe las dos a la vez**, que
son exactamente los tres valores de §7. *No se ablandó el constraint: se lo
reescribió para que exprese la figura.*

---

## ① CONSTRUIDO Y EJERCIDO

**Esta pista no construyó código: construyó mediciones, y las cuatro se
ejercieron por el camino real** — consultas contra el objeto vivo y censos sobre
el árbol real, **cada una con control positivo y negativo corridos ANTES de
aceptar el resultado**.

- **Los cuatro veredictos ③–⑥ del §12**, con su evidencia literal, en
  `docs/loop/S110-E-MEDICIONES-3-A-6.md` (commit `47bbb6ddb18a5105f21abe02bdd12e50c3aff5c0`).
- **El instrumento de ⑤ se validó contra tres casos conocidos antes de contar**
  (`\mestado\M` pega en `set estado =`, **no** pega en `set estado_pago =`, no
  pega en UPDATE de otra tabla) — y su resultado coincidió con el de D **por
  camino distinto**, que es lo que lo vuelve medición y no opinión.
- **El freno de puerta falso se corrigió por el camino real**: la letra existe
  (`pista/s110-a`, commit `7d76380f`, 00:41:44), medido sobre **140 refs** con
  control + y −.

## ② CONSTRUIDO Y NO EJERCIDO

**Nada.** La pista es de sólo lectura: no hay una línea de código que pueda
compilar sin haber corrido. **Cero DDL, cero migraciones, cero seeds, cero
wrappers, cero pantallas.**

## ③ ENTREGADO Y NO MONTADO

**Los cuatro veredictos están entregados y mergeados** (`pista/s111-e` ya es
ancestro de `main`). **Lo que NO tienen es consumidor declarado:**

- **La medición ③ ya cambió de dueño**: la conversación se construyó. Mi
  veredicto sirvió para acotar el alcance de B (partió su pieza en la mitad
  construible y la mitad que dependía del activador) y ese uso **sí ocurrió**.
- **Las fichas ② y ④ no tienen puerta todavía.** La ② (*el refugio no es actor
  de pedido*) **es de A o de quien toque el motor de entrega**; la ④ (*4 de 6
  escritores sin motivo*) **es de A**. Ninguna es de E: **no tengo territorio de
  escritura.**

⚠️ **Y lo más importante de esta sección, medido hoy:** el propio §4 de mi ítem
en `S111-ESTACIONAMIENTO.md` dice *«Nada está cableado a una superficie, **y el
motor no existe todavía**»*. **Ese dato está VENCIDO.** El motor existe:

```
tabla   : adopcion_mensaje (id | solicitud_id | autor_user_id | cuerpo | automatica | creado_en) · 0 filas
funciones: obtener_solicitudes_en_silencio | crear_solicitud_adopcion | responder_solicitud_adopcion | _hilo_mensajes
policy  : adopcion_mensaje_select SELECT USING (EXISTS (SELECT 1 FROM adopcion_solicitud s
          WHERE s.id = solicitud_id AND (s.solicitante_user_id = auth.uid()
          OR _user_publico_esta_publicacion(s.publicacion_id, auth.uid()) OR is_admin())))
consumidor en TS: packages/mensajeria/src/avisos.ts   (cero wrappers en packages/api, cero pantallas)
```

**El hilo cuelga de `solicitud_id`, que es literalmente la opción (a).** *No es
un reproche a nadie —el dato era verdadero cuando A lo escribió, y el motor nació
después: es `L-166`—, pero cambia el peso de la firma:* **ya no se firma «antes
de construir», se firma sobre un motor construido**, y eso el founder tiene que
saberlo al votar. **Sugiero que §4 de ese ítem se actualice antes de que el
reporte final salga.**

## ④ NO CONSTRUIDO A PROPÓSITO

- **Todo.** El mandato de la pista E fue **medir, no construir**, y el prompt lo
  puso en rojo: *«no opinás sobre lo que la letra ya fijó; medís qué cuesta en el
  objeto»*. **No propuse modelo de datos del vertical, no construí ni de prueba,
  y no toqué las cinco tablas legado de adopción** (`D-991`).
- **No medí ① ni ②** (son de D) ni **el 5 % a la fundación** (espera al contador
  y está bajo veda).
- **No medí `solicitudes_adopcion`, `adopcion_seguimiento`, `mascotas_adopcion`
  ni `refugios`** — aparecieron como control positivo de otro censo. **Sin filas,
  sin escritores, sin RLS medidos.** Se pasó crudo y sigue sin ser mío.
  ⚠️ **Ojo con el nombre al tocarlas: la tabla NUEVA es `adopcion_solicitud`
  (singular) y la LEGADO es `solicitudes_adopcion` (plural).** *Dos nombres casi
  iguales para dos cosas distintas es exactamente cómo se construye sobre la
  tabla equivocada.*
- **No curé nada de lo que encontré**, ni siquiera los datos vencidos de otras
  pistas: los reporto.

## ⑤ FICHAS Y LECCIONES, CADA UNA CON SU DISPARO

**Las seis viajaron sin número en `S111-E-para-A-FICHAS.md`. Estado HOY:**

| # | qué | estado | disparo |
|---|---|---|---|
| ① | `chk_destino_excluyente` bloquea la donación con destino | ☠️ **PAGADA** hoy | — |
| ③ | `tipo_servicio` cerrado a dos valores | ☠️ **PAGADA** hoy | — |
| ② | **el refugio no existe como ACTOR de pedido** 🔴 | **VIVA** | **la primera vez que un refugio tenga que mover un pedido** — hoy `cat_transiciones_pedido.actor` es `admin\|cliente\|repartidor\|sistema\|vendedor`, y §8 dice *«la coordina el refugio»* |
| ④ | **4 de 6 escritores apagan sin dejar motivo** 🟠 | **VIVA** | **el primer padrinazgo que se apague solo** — §6 exige tres motivos (adoptado · fallece · el refugio se va) y hoy sólo 2 de 6 escriben `motivo_cancelacion` |
| ⑤ | **un freno de puerta declara contra qué midió Y CUÁNDO** | lección | **cada vez que una pista declare que algo «no existe»** |
| ⑥ | **un `true` que era un `NULL`** | lección | **cada join de censo con un lado que puede faltar** |

**Y una lección más, que nace de este mismo cierre y por eso no estaba en el
buzón anterior:**

**⑦ LECCIÓN · Un veredicto no vence: lo vencen los demás.** Mis cuatro
mediciones eran correctas cuando se firmaron y **dos dejaron de describir la base
en menos de un día**, sin que yo tocara nada — las venció el trabajo ajeno.
🔴 *Un documento de medición sin su ancla («contra qué y cuándo») no envejece:
se vuelve falso en silencio, y se sigue leyendo con la confianza del día que se
escribió.* **Disparo: cada vez que se cite una medición de más de una sesión de
antigüedad para decidir algo.** *Su cura es barata y es la que apliqué acá: el
documento lleva su sha y su fecha en la puerta, y quien lo lea re-corre las cinco
consultas antes de apoyarse.*

## ⑥ LO QUE ESPERA FIRMA O AUTORIZACIÓN DEL FOUNDER

**Un solo ítem, y es el mismo de siempre — pero cambió de peso hoy.**

**Qué activa la conversación de la adopción cuando no hay servicio contratado.**
La regla vigente desde S20 dice que sin un servicio activo entre dos personas no
hay canal de mensajes, y un refugio y quien quiere adoptar **no tienen ningún
servicio entre ellos**. Hay que decidir si **una solicitud de adopción abre el
canal por sí misma** (mi voto, y A coincide) **o si la adopción tiene un canal
propio, separado**.

- **Evidencia:** `docs/loop/S110-E-MEDICIONES-3-A-6.md` §③ · el ítem completo con
  sus cinco partes en `S111-ESTACIONAMIENTO.md` · el literal de `PORTAL_PRESTADOR`
  §6.4.7:1504 (*«Sin servicio activo, no hay canal»*).
- **Mi voto: (a)**, la solicitud abre el canal. §6.4.7 no dice «cita»: dice
  *«cita / servicio / **contrato** activo»*, y una solicitud es exactamente eso.
- 🔴 **Lo que cambió hoy y el founder tiene que saber al votar:** **el motor ya
  está construido con la forma (a)** —tabla, cuatro funciones y una policy que
  cuelga el hilo de la solicitud—, **con cero filas y sin ninguna pantalla**.
  *Sigue siendo reversible sin perder datos, pero ya no es una decisión sobre
  papel.*
- ⚠️ **Y el costo de mi propia opción, que sigue sin decidirse:** (a) obliga a
  definir **el cierre del canal cuando la solicitud se declina** — quién puede
  volver a escribir y por cuánto tiempo. *Sin eso, un refugio que dijo que no
  queda escribible para siempre por alguien a quien rechazó.*

**Nada más de esta pista espera autorización.** Cero llaves, cero OTA, cero
migraciones, cero texto legal, cero cobros: **la pista E no produjo nada que
autorizar.**
