# S74-A · VARA CRUZADA (M2) — los dos bocetos de B, leídos contra la FUENTE

> Regla madre aplicada (L-158 + refinamiento S73): cada dato del boceto se
> auditó abriendo su fuente — DB viva (defs, constraints, policies, counts),
> PORTAL_PRESTADOR §14, BIO_EXPEDIENTE A3.4, MODELO_PRESENCIA §2, el índice
> de los 39 y mi veredicto T1. Las decisiones de mesa del brief S74 entran
> INCORPORADAS (el boceto se audita contra el alcance vigente, no contra el
> que tenía al dibujarse).

---

## BOCETO 1 — EQUIPO + FIRMA (`fa83e5d`) · VEREDICTO: **APTO CON ENMIENDAS**

La composición es correcta y la tesis se sirve; las enmiendas son de DATO y
de alcance de mesa — ninguna tira la estructura.

**E1 (de MESA, incorporada — obligatoria).** El miembro aceptado SIN rol
**PRESIDE en la lista con su acción al lado** ("Asignar rol"), jamás fila
enterrada. El boceto lo tenía como estado legal DICHO (§3, correcto) pero
como fila más; con el camino v1 que el propio boceto vota (invitar SIN rol —
§4 pedido 2), ese estado es el paso NORMAL de toda invitación aceptada: sin
presidir, el flujo de dos pasos fabrica gente activa que no ve nada y de la
que nadie se entera. *Fuente: enmienda de mesa firmada (brief S74) + el CHECK
literal `rol='empleado'` de `empleado_invitaciones` que fuerza el dos-pasos.*

**E2 (dato).** **"CERO componente nuevo" es FALSO en un elemento: el slot
del LOGO.** Contenedor `contain` + aire + fondo + fallback monograma no
existe en ninguno de los 39 (verificado contra el índice, uno por uno) — y
la trampa del logo (hoy SÍ depositada en `MODELO_PRESENCIA` §2, S74-A) rige
*"en toda superficie que pinte la firma"*: la pieza 2 de PRESENCIA y las
superficies del pet parent son consumidores futuros ciertos. Camino Ley 11:
o nace en `packages/ui` con espec mínima + gate, o se registra candidato con
su primer consumidor — **inline en el app queda prohibido**. La nota L-158
del boceto (§2) quedó además RESUELTA: el literal ya vive en el doc.

**E3 (L-161 — la ruta, no solo la celda).** La puerta por AUSENCIA está bien
para la celda de NEGOCIO, pero **la ruta `negocio/equipo` existirá para
cualquier empleado** (deep link, back stack) y el boceto no declara qué ve el
no-dueño que aterriza ahí. Enmienda: la PANTALLA gatea también — el lector
rebota tipado (p. ej. `no_es_dueño`) y la ruta muestra voz honesta digna
(patrón solo-lectura S60), jamás blanco ni error crudo. Y **la FUENTE del
bool "es dueño" se nombra**: hoy no existe wrapper; el camino barato es que
el propio lector de equipo sea la fuente (celda se dibuja si el lector
responde OK; rebote tipado = ausencia) — decisión declarada al construir.

**E4 (dato, verificado en DB).** El CHECK dice EXACTAMENTE lo que B dice:
`empleado_invitaciones_rol_check = CHECK (rol = 'empleado')` ✓. Matiz: los
RPCs del subsistema son **CINCO**, no tres (`existe_invitacion_pendiente` ·
`crear_empleado_directo` · `aceptar_invitacion_pendiente_login` ·
`rechazar_invitacion_pendiente_login` · `marcar_invitacion_aceptada`) — el
"3 RPCs" venía de la letra §14; para la ventana no cambia nada, se registra
para que el contrato del lector no herede el conteo viejo (L-159). El camino
v1 barato (invitar sin rol) queda RATIFICADO por la fuente; con E1 encima,
es seguro.

**E5 (dato — que B no duplique).** **Ya existe un lector de equipo:**
`obtener_empleados_cuenta(p_cuenta_comercial_id)` — DEFINER, gate
`_user_opera_cuenta_comercial`, devuelve `empleado_id · nombre · activo`
(sirve al selector de "Fijar fecha"). **NO alcanza para la ventana** (sin
roles, sin contacto, sin invitaciones; gate no-dueño), así que el pedido
patrón D-455 sigue en pie — pero la decisión extender-vs-nuevo se toma con
este def a la vista (L-150: una verdad, no dos lectores que se pisen).

**E6 (dato — inconsistencia declarada, no bloquea v1).** Desvincular:
**la policy UPDATE del dueño EXISTE** (`empleados_dueño_actualiza`) — B no
necesita pedir productor nuevo para `activo=false`. PERO su qual gatea por
`prestadores.user_id = auth.uid()` (modelo unipersonal LEGACY), **no por
`empleado_tiene_rol(dueño)`**: un co-dueño por la hija no podría
desvincular. Para v1 (negocio unipersonal, alcance A3) alcanza; la
inconsistencia con la puerta única (§14.4) queda DECLARADA — candidata a
absorberse en la próxima pasada del motor de equipo.

**E7 (datos de la firma, contados en vivo).** `nombre_comercial` **5/5** ·
`ciudad` **4/5** · `direccion` 4/5 · `foto_url` **0/5** — el boceto ACIERTA
en que lo único que la ventana pide es el logo ✓. Dos precisiones: (a) hay
UN prestador con ciudad NULL — el boceto declara ese estado (la línea se
omite y la firma la ofrece editable; jamás un "·" colgando); (b) **la
escritura NO es pedido de motor**: el trigger D-389
(`_prestadores_protege_columnas`, def literal leído) protege
id/user_id/cuenta/estado/aprobación/métricas/created_at — **`foto_url` y
`nombre_comercial` NO están protegidas**; el límite real es la whitelist de
PRODUCTO del wrapper de Cuenta (S60-B2: hoy solo descripción+contacto). La
enmienda es de WRAPPER (sumar `foto_url` a la whitelist), cero SQL.

---

## BOCETO 2 — VISTA DE RECEPCIÓN (`bcf861c`) · VEREDICTO: **APTO CON ENMIENDAS**

La superficie-como-degradación, el Chanel del candado y la firma "se
recuerda por lo que no tiene" quedan firmes. Las enmiendas vienen del
alcance nuevo de mesa y de UN dato leído en la fuente.

**E1 (de MESA, incorporada — obligatoria).** **El bloque del aviso de
emergencia SALE de v1 — no condicionado: FUERA.** Mi T1 lo mató (el flag es
fiable solo por vacuidad; la precondición real es D-502) y la mesa ya
decidió: v1 = identidad completa + etapa destilada. Corolario de contrato:
**`tiene_emergencia_activa` deja de leerse en v1** — leer un dato para un
bloque que jamás se dibuja es lectura muerta (y D-497 cuenta requests).

**E2 (dato — A3.4 literal).** **"Identidad COMPLETA" ≠ avatar+nombre+
especie.** La fila de recepción de `BIO_EXPEDIENTE` A3.4 dice: *"Identidad
COMPLETA (nombre, foto, especie, **raza**, **dueño de contacto**)"*. `raza`
existe en `mascotas` (verificado en types) — se suma barata. **El dueño de
contacto NO tiene lector vivo del lado prestador** (profiles = RLS
solo-miembro, hallazgo S51 vigente): es pedido de motor angosto REAL (patrón
D-455, campos MÍNIMOS) **con decisión de mesa sobre QUÉ campo exacto se
expone** (precedente C4: el contacto exponible es MOTOR — se releva antes de
prometer; Ley 23: no se dibuja hasta que el lector exista). El boceto puede
salir v1 con nombre+foto+especie+raza+etapa **declarando el hueco del
contacto** — lo que no puede es llamarse "completa" sin decirlo.

**E3 (re-anclaje del lugar reservado).** Con el aviso fuera, la declaración
del lugar se re-ancla: **la banda de CUIDADO ESPECIAL entra entre la etapa y
lo operativo; el aviso de emergencia (cuando D-502 le dé motor) entrará
ENCIMA de la banda** — mismo orden de lectura declarado por B (quién es →
qué es urgente → qué necesita a diario → qué hago hoy). Cero píxel hoy,
igual que el boceto ya cumplía ✓ (verificado: §4 no dibuja contenedor).

**E4 (cláusula conservada y GENERALIZADA — pedido de mesa, verificado
vivo).** La cláusula "el error de lector jamás se pinta como sin-alerta"
(§3 del boceto, viva ✓) **se conserva re-anclada a las DOS piezas de v1**:
un error de carga jamás se pinta como estado benigno — ni identidad parcial
muda, ni "sin etapa": el error de pantalla preside (Ley 13). Cuando el aviso
gane motor (D-502), la cláusula original re-entra con él tal cual B la
escribió.

**E5 (dato — el pedido de motor se ACHICA).** Con el alcance nuevo,
`mascota_perfil_vigente` **no se necesita en v1**: identidad+raza salen de
`mascotas` (la policy `mascotas_select_prestador_con_acceso` quedó en el
helper GENERAL post-D-464 — verificada en el censo T2: no está entre las 14
clínicas; todo empleado con acceso la pasa) y la etapa se computa
client-side de `fecha_nacimiento` + `cat_especies_perfil` (el patrón vivo
S51/S52 del momento vital en voz). **El único pedido de motor que queda es
el contacto (E2).** El "lector angosto de perfil_vigente" del boceto se cae
— menos motor, misma pantalla.

---

## Registro de método

- Las cuatro clases de verosímil-falso que esta vara atrapó son TODAS de
  DATO (L-158 confirmada otra vez): "cero componente nuevo" (E2-B1) ·
  "identidad completa" (E2-B2) · "pedido de motor" que era wrapper (E7-B1) ·
  lector que ya existía (E5-B1).
- **El censo T2 de A también cayó bajo L-158 en esta misma tanda:** su
  "única vía anon" era verosímil-falso para `is_admin` — el CINTURÓN de la
  migración D-495 (primer intento, rollback limpio) atrapó **10 policies
  más** alcanzables por anon que lo citan (5 admin legacy `{public}` de
  adopción/tienda/profiles/pedidos + 2 de storage productos-fotos + las 3
  `caso_*_select` de las tipadas de caso, también `{public}`). El censo
  D-495 queda ENMENDADO en su doc; `is_admin` NO se revocó (candidata a
  deuda, número en mesa). La lección operativa: **el cinturón in-migración
  es la vara del censo** — un censo sin assert que lo pruebe es una tabla
  de hallazgos más.
