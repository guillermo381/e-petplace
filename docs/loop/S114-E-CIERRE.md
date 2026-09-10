# S114 · PISTA E — POSTVENTA: LOS INSTRUMENTOS · asiento de cierre

**10-sep-2026 · rama `pista/s114-e-1.0` · el parte completo vive en `docs/loop/S114-E.md`**

> ⚠️ **NINGÚN dato de servicio de esta base es real y producción es octubre.**
> **Ningún número de este asiento es línea base ni calibra un umbral.** Donde hay
> una cifra, es el estado de un objeto de prueba en una fecha, y sirve para
> decidir si un instrumento mide — jamás para decir cuánto pasa en el producto.
>
> ⚠️ **El pedido de cierre de A (`S114-A-PIDE-CIERRE-A-CADA-PISTA.md`) y el acta
> (`S114-CIERRE.md`) NO están publicados** — verificado en `origin/main`
> (`814a06c1`), `origin/candidato/s114` y `origin/pista/s114-a-1.0`. Este asiento
> se escribe sin su plantilla; si tenía una forma pedida, se adapta cuando el
> archivo exista. *No bloqueo el cierre por un archivo que no está.*

---

## LO QUE SE CONSTRUYÓ · seis instrumentos, cada uno con su rojo PRODUCIDO

El mandato fue explícito: *«un instrumento que no puede producir su rojo no está
midiendo»* y *«¿mi instrumento perdona algo que el producto no perdona?»*.

| gate | qué mide | estado al cierre |
|---|---|---|
| `verify:postventa-plata` | §6 · devolución declarada sobre un objeto CON evento económico | 🟢 |
| `verify:cierre-ausente` | §2/F1 · pasadas 48 h sin cerrar ni `no_ejecutado` | 🔴 **y su rojo destapó el reloj caído** |
| `verify:asientos-caso` | §9 · los seis asientos por PostgREST real + candado del saldo | 🟢 |
| `verify:devengo-por-sujeto` | §8 · ejecutado sin evento económico, sobre los siete comprables | 🟢 **19 → 0** |
| `verify:plantillas-categoria` | la deriva silenciosa de Meta (utility→marketing) | 🟢 |
| `verify:pase-de-lista` | que ningún gate del hook esté mudo o ausente, con dueño | 🟢 |

**Ninguno se cableó sin ver su rojo antes.** Los controles corren **en cada
invocación**, no una vez: un control que se corrió el día que se escribió mide
el día que se escribió.

---

## 🔴 EL HALLAZGO DEL CIERRE · el reloj de F1 está caído, y lo encontró el gate que nació mudo

```
cron · expirar-objetos-sin-cierre · 2026-09-10 05:00 · FAILED
"guarderia_estadias_estado_check"  ·  UPDATE … SET estado = 'no_ejecutado'
```

**`no_ejecutado` está en el CHECK de `evento_cita_servicio` y NO en el de
`guarderia_estadias`.** La cura cubrió una tabla de las dos, y la rama de
estadías escribe un valor que su propio CHECK prohíbe.

**Tres cosas lo vuelven grave y ninguna es la estadía sin marcar:** la excepción
**aborta la función entera** (los avisos de citas dejan de salir) · **se repite
cada hora** mientras las 4 estadías existan · y **no tiene síntoma visible** —
vive en `cron.job_run_details`, que nadie lee, mientras la pantalla del prestador
se ve normal.

**Cómo apareció es el argumento de toda la pista:** `verify:cierre-ausente`
**nació MUDO** y quedó naranja con su bloqueante nombrado toda la sesión. **Se
destrabó solo, por el paso del tiempo** — que es exactamente el sujeto que se le
eligió al curarlo. *Su primer rojo real no fue un objeto sin cerrar: fue el reloj
caído.* Fue a A en `S114-E-para-A-URGENTE-reloj-f1-caido.md`.

### ✅ CURADO Y VERIFICADO POR MÍ EL MISMO DÍA (migración `20260912160000`, main `5d0194c2`)

**Verificado contra el objeto, no contra el mensaje** —es mi P0, así que
comprobarlo es mi trabajo—:

```
CHECK … 'no_recogida', 'no_ejecutado'          ← el hermano, agregado
las 4 estadías                                  → estado = no_ejecutado
verify:cierre-ausente                           → 🟢 VERDE, exit 0
avisos servicio_sin_cerrar                      → 3 → 16 (los que el abort suprimía)
```

Y el verde conserva su honestidad: *«no dice "se procesó todo": dice "se procesó
todo lo que el corte deja tocar"»* — los 111 fuera por corte siguen declarados
como decisión de mesa.

⚠️ **Una distinción que queda viva y es de una hora:** A ejercitó la función **a
mano** (`ok:true`), lo que prueba **la función**. La última entrada del cron
sigue siendo la fallida de las 05:00 ⇒ **el tick desatendido de las 06:00 es lo
que prueba el LAZO.** Debería pasar —las 4 salieron del universo del reloj al
quedar `no_ejecutado`—, pero *«corrió a mano» y «el cron corre» son dos
afirmaciones distintas*, y ésta es justo la clase que esta pista pasó la sesión
separando.

---

## LAS TRES LECCIONES QUE DEJA LA PISTA

**① Un instrumento que necesita que algo esté roto para medir se apaga solo el
día que se arregla — y ese día nadie lo nota, porque todo está verde.**
`verify:postventa-plata` construía su control positivo con **una cita real sin
evento**; cuando A llevó los 19 a 0, **se quedó mudo justo cuando el sistema se
puso sano**. Curado con un uuid fabricado.

**② De ahí sale la forma, que hoy es regla de casa:** ① el control que prueba que
el instrumento ENCUENTRA es **real** · ② el que prueba que no marca de más es
**sintético** · ③ **el universo se define por algo que no se arregla nunca**. La
tercera es la que más se olvida, y es la que hizo que `verify:cierre-ausente`
siguiera vivo hasta encontrar el reloj caído.

**③ Un rojo sobre una lista vacía se ve idéntico a un rojo sobre una lista que no
coincide.** Casi publico *«el WABA y el número apuntan a cuentas distintas»*
sobre una enumeración que nunca se llenó. De ahí salió el tristate de A, y mi
consumidor tiene sus tres ramas con el rojo producido (`PAR_FORZADO`).

---

## LO QUE SE MIDIÓ Y CAMBIÓ DECISIONES AJENAS

- **`pedido_nuevo_vendedor` tenía productor y lo perdió:** un `CREATE OR REPLACE`
  de S101-B se llevó puesto el bloque que S97-A había puesto seis días antes.
  Cuatro intenciones, todas `fallida`, después silencio. **Ningún gate lo veía.**
- **53 de 91 worktrees no tenían el link de la base** ⇒ un gate del pre-commit
  estaba **estructuralmente mudo** para la mayoría de las pistas. Curado en
  `lib-db.mjs`, aditivo: si el árbol local tiene su `.temp`, byte-idéntico.
- **`waba_configurado_alcanzable: false` era un falso negativo**, con la prueba en
  la misma respuesta (`http_plantillas: 200`).
- **El `messaging_limit_tier` colgaba del único array que sabíamos vacío** —
  `L-318` con otra ropa. Curado por A; hoy viene `null`, lo que **confirma cuál
  de los dos candidatos era**: el field no vive en el WABA.
- **La copy del prestador afirma devoluciones que no ocurrieron:** de 62 servicios
  sin cerrar, 56 se muestran como *«la familia recibió su devolución»* y medí
  **0 casos y 0 eventos económicos** sobre ellos. El lector no conoce el corte de
  F1; el reloj sí. Va a A y a C, sin curar: elegir entre los tres caminos es
  decisión de producto.

---

## LAS SIEMBRAS · sujetos para otras pistas, todas por las RPCs y marcadas

**Ninguna por `INSERT`.** *Un INSERT fabrica filas que ninguna regla tocó, y
después se miden como si las hubieran pasado.*

| script | qué dejó | marca / censo |
|---|---|---|
| `sembrar-casos-postventa.mjs` | uno de cada clase + abiertos con hilo de ≥3 turnos | `relato like '[SIEMBRA S114-E]%'` |
| `sembrar-mensualidad-guarderia.mjs` | mensualidad + 22 estadías | por sus ids |
| `sembrar-servicio-sin-cerrar.mjs` | cita accionable para la línea del HOY | `metadata->>'siembra'='S114-E'` |
| `sembrar-saldo-hogar.mjs` | saldo por `caso_elegir_destino`, **nunca por la primitiva** | `origen_tipo='caso'` |
| `ejercer-productores-devolucion.mjs` | los dos tipos de devolución **emitiendo** | `[SIEMBRA S114-E]` |

**La regla que las gobierna:** un sembrador **sólo gasta un sujeto del que haya
más de uno de su forma**, y **se niega y lo dice** si es el único. *Gastar una
forma de la que hay dos no le quita el sujeto a nadie; gastar la única sí.*

---

## LO QUE QUEDA ABIERTO, CON DUEÑO

| | dueño |
|---|---|
| ~~el CHECK de `guarderia_estadias`~~ ✅ **CURADO Y VERIFICADO** el mismo día (`20260912160000`) — queda mirar el tick de las 06:00 | A / cerrado |
| 🔴 el mapeo de la copy vencido↔reloj (56 devoluciones afirmadas que no pasaron) | A y C |
| 🟠 `messaging_limit_tier` — queda `/{phoneId}?fields=…` como candidato | A |
| 🟠 `asunto` es hoy el tipo de servicio ⇒ *«Tu caso sobre paseo»* | mesa |
| 🟢 `transporte_vivo` de WhatsApp en `false` — el flip es del founder y va último | founder |

**Del canal, lo que sí quedó cerrado:** número **VERIFIED** · 10/10 plantillas
**APPROVED en UTILITY** (la deriva que el gate existe para cazar **no ocurrió**) ·
par waba↔número **COHERENTE** · el mapeo de las dos de postventa **cableado por A
y comprobado por mí** — manos distintas · y los dos productores de devolución
**emitieron**, con `monto` y `asunto` en `datos`, que es lo que llena {{2}} y {{3}}.
