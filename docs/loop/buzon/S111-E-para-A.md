# BUZÓN · S111-E → A · cierre de la pista E

> **Rama:** `pista/s111-e` · **base:** `9443da56`
> **Commit del entregable:** `47bbb6ddb18a5105f21abe02bdd12e50c3aff5c0`
> **Archivo:** `docs/loop/S110-E-MEDICIONES-3-A-6.md` (366 líneas)
>
> **ALCANCE DECLARADO (L-463):** este buzón toca **UN solo archivo nuevo** en
> `docs/loop/` más este propio buzón. **Cero DDL, cero migraciones, cero seeds,
> cero `packages/`, cero `apps/`.** Nada que mergear fuera de `docs/`.

## ESTADO

**Backlog de la pista E: AGOTADO.** Las cuatro mediciones (③–⑥ del §12 de
`LETRA_ADOPCION`) están medidas, firmadas y depositadas. **Re-verificadas al
depositar** contra `9443da56` (A movió tres migraciones y `packages/api` entre
la medición y el depósito): **los cuatro veredictos siguen en pie.**

| | veredicto | qué le hace a la letra |
|---|---|---|
| ③ | **No existe**, y §6.4.7 la excluye para este caso | confirma §12.3: superficie nueva |
| ④ | **Admite** destinatario distinto, **nunca lo ejerció** | **ACOTA** §8 (no la corrige) |
| ⑤ | **Sí**, y el caso corre; faltan **dos** piezas, no una | confirma §6 y **agrega** costo de v1 |
| ⑥ | **Sí, ya se hace**; eje = rol + capacidad | confirma §9 |

⚠️ **Lo primero que conviene que leas es el freno de puerta corregido:** esta
pista y D declararon que `LETRA_ADOPCION.md` no existía. **Era falso** — está en
`pista/s110-a`, commit `7d76380f`, 00:41:44. Dos causas distintas (E: un `find`
truncado con `head -20`; D: midió 18 minutos antes del commit). **Los dos ceros
coincidieron, y dos ceros que coinciden se leen como confirmación.**

## FICHAS PARA NUMERAR — sin número, como manda la regla

**① DEUDA · `chk_destino_excluyente` vuelve inexpresable la donación con destino.**
`CHECK ((NOT (es_donacion AND (mascota_id IS NOT NULL))))` en `pedido_item_destinos`,
más su guard gemelo `destino_contradictorio` en `crear_pedido_despensa`. §7 define
el destino con tres valores y el primero es *«una mascota en adopción»*. **No es
agregar una columna: es enmendar un constraint más su guard.** *Es el artefacto
concreto de la advertencia que §7 ya escribió en prosa.* 🟠 · Disparo: la primera
línea de código de la donación con destino.

**② DEUDA · El refugio no existe como ACTOR que pueda mover un pedido.**
`cat_transiciones_pedido.actor` = `admin | cliente | repartidor | sistema | vendedor`;
y `pedidos` no tiene ninguna columna de coordinación/refugio/tercero. **§8 dice
«la coordina el refugio» y ese actor no está declarado.** *Variante previa del
callejón de S105: allá el catálogo declaraba un actor que la puerta no aceptaba;
acá ni siquiera está declarado.* 🔴 · **Éste es el costo real de §8, no el campo
del receptor.**

**③ DEUDA · `suscripciones_servicio_tipo_valido` está cerrado a dos valores.**
`CHECK (tipo_servicio = ANY (ARRAY['guarderia_mensual','paseo_mensual']))`. Un
padrinazgo recurrente no entra sin enmendarlo, y **es costo de v1**, medido: §1 lo
define como *«Compra RECURRENTE de productos»* y §11 excluye el padrinazgo **en
dinero**, no la recurrencia. 🔴 · *`recurrentes.tsx` dice que el padrinazgo
aterriza «agregando un lector y un caso»: con esto son tres cosas, y la pantalla
no podía preverlo.*

**④ DEUDA · Cuatro de los seis escritores apagan una recurrencia sin dejar motivo.**
`motivo_cancelacion` es columna de primera clase y sólo la completan
`_trg_mascotas_memorial_planes` y `mover_sujeto_por_reverso`. **§6 exige tres
motivos distintos** (adoptado · fallece · el refugio se va). 🟠 · *El día que el
destinatario desaparezca, «por qué se apagó» es la pregunta que alguien le va a
hacer a esa fila.*

**⑤ LECCIÓN · Un freno de puerta declara contra qué midió Y cuándo.** Falla de las
dos maneras y las dos se cobraron el mismo día: **E declaró un cero falso con su
método roto; D declaró un cero verdadero sin su hora.** *Un baseline declara
contra qué midió; un freno necesita además la hora, porque su objeto puede nacer
después.*

**⑥ LECCIÓN · Un `true` que era un `NULL`.** Al comparar receptor contra comprador,
el join devolvía NULL y `IS DISTINCT FROM NULL` es true siempre: el instrumento
dio `es_tercero=true` en las 16 filas. **No dio error, no dio cero: dio la
respuesta que yo esperaba**, y habría sostenido un veredicto equivocado contra la
letra. *Un comparador contra un lado nulo no mide: afirma.* Cura: el control fue
mirar la columna del lado ausente, que salía `(sin nombre)` en el 100 % de las
filas — **una columna constante en un censo es la señal.**

## PARA EL ESTACIONAMIENTO — decisión de producto que falta

**QUÉ FALTA: qué activa el canal de conversación cuando NO hay servicio.**
§5 pide una conversación entre publicador y solicitante con estados (recibida ·
en conversación · aceptada · declinada). **§6.4.7 —decisión cerrada S20— dice
literal: *«Sin servicio activo, no hay canal»*.** Refugio y adoptante **no
comparten cita**, así que la regla vigente, aplicada al pie, deja la conversación
de §5 sin poder existir.

- **(a)** La **solicitud de adopción** es un activador de canal de pleno derecho,
  igual que una cita: se abre al postular y se cierra con el desenlace.
- **(b)** El canal de adopción es una **superficie propia**, separada del canal
  prestador↔familia de §6.4.7, con su propia regla de vida.

**MI VOTO: (a).** §6.4.7 no dice «cita»: dice *«cita / servicio / **contrato**
activo»*, y una solicitud de adopción es exactamente un vínculo acotado entre dos
cuentas con principio y fin. **Ensancha el vocabulario del activador sin tocar el
principio** —privacidad, trazabilidad, no llevarse al otro fuera del ecosistema—,
mientras que (b) crea un segundo canal cuya divergencia hay que sostener para
siempre. ⚠️ **Y (a) tiene un costo que (b) no tiene y hay que decirlo: obliga a
definir el cierre del canal cuando la solicitud es declinada** — quién puede
volver a escribir y por cuánto tiempo.

**QUÉ CONSTRUÍ ALREDEDOR: NADA, y es fail-closed por construcción** — la pista E
es de sólo lectura y no tocó una línea de código. **No hay nada que revertir ni
que apagar.**

## LO QUE ESPERA FIRMA O AUTORIZACIÓN

1. **La decisión de estacionamiento de arriba** (qué activa el canal sin
   servicio) — **es del founder**: toca una decisión cerrada en S20.
2. **Nada más de esta pista.** No hay llaves, no hay OTA, no hay migraciones, no
   hay texto legal, no hay cobros. **La pista E no produjo nada que autorizar.**

## LO QUE PASO CRUDO Y NO ES MÍO

`solicitudes_adopcion`, `adopcion_seguimiento`, `mascotas_adopcion` y `refugios`
existen como tablas base de `public`. **Aparecieron como control positivo de otro
censo; no medí filas, escritores ni RLS.** Cruza con `D-991` (no construir sobre
ellas, no DROPearlas). Es lote de D o tuyo, no mío.

## NOTA OPERATIVA PARA TU RONDA

Los dos archivos con byte NUL (`PasoCierre.tsx`, `video-consumo/index.ts`)
**siguen con NUL** en `9443da56`, aunque `scripts/verify-sin-byte-nul.mjs` ya
existe. *Lo anoto como dato, no como reproche: el gate primero y la cura después
es el orden correcto de la casa. Si el gate nació con baseline 2, conviene que su
ficha lo diga, porque un baseline en 2 se lee como salud cada vez que corre.*
