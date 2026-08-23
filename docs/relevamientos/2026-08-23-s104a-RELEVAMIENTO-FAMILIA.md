# S104-A · RELEVAMIENTO DEL MODELO DE FAMILIA

> **Ordenado por:** `ORDEN_ARRANQUE_MESA_105.md` §0.3 y §2 Turno 0 — *primer acto de
> la mesa, antes de cualquier otra cosa; nada del frente 4 se construye antes.*
> **Corrido por:** pista A · **Fecha:** 23-ago-2026
> **Objeto medido:** la base de PRODUCCIÓN (`zyltipqscdsdsxnjclhp`) vía
> `supabase db query --linked`, y `main` local en `eebe4975` (árbol limpio,
> `HEAD == origin/main` verificado por `merge-base --is-ancestor`).
> **Lo que NO es:** un censo de superficies (eso es de C) ni de correos (de D).

---

## ① LA LETRA EXISTE Y LA ORDEN LA UBICÓ BIEN

`docs/MODELO_PRODUCTO.md` **§4 — Modelo humano transversal**, líneas 2114-2353.
Siete sub-secciones: 4.1 familia · 4.2 co-dueños · 4.3 familiares autorizados ·
4.4 transferencias · 4.5 hitos privados · **4.6 implicancias técnicas** ·
4.7 señales prácticas. Es lectura obligatoria de toda sesión de producto
(`CLAUDE.md`, EL NORTE) ⇒ **no hay documento perdido: había un documento no leído.**

**Y §4.6 ya declara su propio drift, desde S19** — el bloque *«Drift documental
detectado en S19 (no cerrado)»* dice, textual, que `familia_miembro.permisos_jsonb`
*«está documentado arriba pero NO existe en la tabla en DB»*, que
`mascota_familiar_autorizado.permisos_jsonb` *«no fue auditado en S19»*, y deja la
decisión abierta entre (a) agregar la columna cuando haga falta o (b) borrar la
referencia y operar solo por `rol`.

*El propio documento venía avisando hace quince sesiones que una parte de él no era
cierta. La orden lo sospechó; el drift ya estaba escrito.*

---

## ② LA TABLA DE UNA PÁGINA (lo que §2 Turno 0 pide)

Medido contra el CHECK, contra los cuerpos de las funciones, contra las policies y
contra las filas vivas — **las cuatro preguntas por separado, porque las cuatro dan
respuestas distintas.**

| escalón | ¿en el CHECK? | filas vivas | ¿el motor lo distingue? | qué ve / qué puede hoy | cómo entra hoy | qué falta para entrar por invitación |
|---|---|---|---|---|---|---|
| **`adulto_titular`** | ✅ | **15 de 15** | ✅ **muy vivo** — 18 funciones + 2 policies lo nombran citado (`_user_es_titular_familia`, `crear_familia_con_primera_mascota`, `responder_solicitud_autorizacion`…) | todo: crea la familia, agrega mascotas, agenda, autoriza prestadores, renombra la familia | **onboarding** (`crear_familia_con_primera_mascota`) o **alta asistida** del prestador | — (es el que ya entra) |
| **`adulto_autorizado`** | ✅ | **0** | ✅ **existe** — 5 funciones (`user_es_familiar_adulto_de_mascota`, `_user_es_familia_de_mascota`, `agregar_mascota_a_familia`, `actualizar_raza_mascota`, `declarar_composicion_acuario`) + 1 policy (`presupuesto_select_familia`) | *sin filas, sin ejercicio*: por código, cuenta como familia adulta para acceso y presupuestos | **por ningún camino de producto** | la tabla `familia_invitaciones` (**no existe**) + RPC de invitar/aceptar |
| **`menor`** | ✅ | **0** | 🟡 **motor parcial y real**: `registrar_bitacora_familia` lo nombra citado y usa `v_menor` **5 veces** | *sin filas*: por código, la bitácora lo trata distinto | **por ningún camino** | lo de arriba **+ `fecha_nacimiento`, que la tabla NO tiene** (§③) |
| **`cuidador_externo`** | ✅ | **0** | ❌ **CERO** funciones y **CERO** policies lo nombran | nada lo distingue de `adulto_autorizado` | **por ningún camino** | lo de arriba + decidir si se diferencia o se colapsa |

**Los cuatro escalones de §4.3 SÍ están en el esquema** (`chk_familia_miembro_rol`
los enumera). **La orden sospechaba que podían vivir «solo en el doc» y se
equivocaba** — pero el matiz importa más que el titular: *existir en un CHECK no es
existir en el motor*, y los cuatro dan cuatro respuestas distintas a esa segunda
pregunta.

**Falso positivo cazado (L-170 en su forma exacta):** el primer censo por `LIKE
'%menor%'` devolvió cuatro funciones. Tres eran la palabra española en un comentario
o un mensaje — `crear_bloqueo_agenda` dice *«a igualdad, **menor** carga del día»* y
`leer_sombra_notificaciones` la usa dentro de una frase. **Solo una nombra el rol
citado.** Y `registrar_intencion_notificacion` tiene `v_por_menor` usada 3 veces
**pero no nombra `'menor'`**: su booleano sale del catálogo del tipo de aviso, no de
leer el rol de nadie. *Un censo por texto lee los comentarios como código.*

---

## ③ LOS CUATRO HALLAZGOS QUE CAMBIAN EL FRENTE 4

### 🔴 1 · `permisos` EXISTE — en la tabla que S19 nunca auditó — Y NADIE LO LEE

- `familia_miembro` **no tiene** `permisos_jsonb`. Confirmado: drift de S19, cerrado
  como hecho.
- **`mascota_familiar_autorizado` SÍ tiene `permisos jsonb DEFAULT '{}'`** — la
  mitad que §4.6 dejó marcada como *«no auditado en S19»*. **Ya está auditada: existe.**
- **`permisos` no tiene CHECK, no tiene vocabulario de claves, y su default es el
  objeto vacío.**
- **CERO funciones y CERO policies lo leen.** Las únicas dos funciones que tocan la
  tabla son el trigger de exclusión y `_user_es_familiar_autorizado_mascota`, que
  devuelve **booleano**.

⇒ **`mascota_familiar_autorizado` hoy es BINARIO: se entra o no se entra.** Los cinco
permisos configurables que §4.3 promete (lectura completa o filtrada · autorizar en
emergencia · programar citas sí/no · qué notificaciones · postear hitos) **no tienen
lector.** Es **puerta sin motor** en su forma de manual: *la columna acepta lo que le
escribas, typechequea, y nadie la consulta.*

**Consecuencia directa sobre la firma 5.1 del founder:** el *default v1* que la orden
describe (*«lectura completa · notificaciones · postear hitos · sin agendar ni
autorizar»*) **no es configurable hoy — y tampoco es exactamente lo que el motor
hace.** El default no se escribe en `permisos`: se obtiene **eligiendo el escalón**,
porque el escalón es lo único que el motor mira. La orden ya previó este caso
(*«si A mide que la configurabilidad no tiene columna, el default es lo ÚNICO que
entra en v1»*) — **se confirma, con el matiz de que la columna sí existe y lo que
falta es el lector.**

### 🔴 2 · `familia_invitaciones` NO EXISTE — y el molde que se hereda es de CINCO RPCs, no seis ni tres

`familia_invitaciones`: **no existe la tabla.** `hito_narrativo_privado_humano`
(§4.5, Decisión D16.9): **tampoco existe.**

`empleado_invitaciones` sí existe (17 filas) con `rol · token · expira_en · estado`,
y su `estado` admite seis valores incluido `pendiente_aceptacion_login`. **Las RPCs
vivas que la nombran son CINCO, contadas contra `pg_proc`:**
`aceptar_invitacion_pendiente_login` · `crear_empleado_directo` ·
`existe_invitacion_pendiente` · `marcar_invitacion_aceptada` ·
`rechazar_invitacion_pendiente_login`.

⇒ **el plan decía seis, `PORTAL_PRESTADOR` decía tres, y son cinco.** Ninguna de las
dos fuentes acertó. *Se cuenta, no se cita* — la orden lo pedía así y por eso se hizo.

⚠️ **Y falta una en el molde:** ninguna de las cinco **crea** la invitación. El INSERT
vive fuera de ese conjunto (`packages/api/src/wrappers/equipo.ts` la nombra). **Quien
herede el molde hereda un molde incompleto**: el acto de invitar es justamente el que
no tiene RPC. Se mide antes de copiar.

### 🟡 3 · EL ESCALÓN `menor` NO PUEDE VALIDARSE: no hay dato de edad

§4.6 declara `familia_miembro` con *«`permisos_jsonb` + `fecha_nacimiento` (requerida
para menores)»*. **Las columnas reales son:** `id · familia_id · user_id · rol ·
desde · hasta · motivo_alta · motivo_baja · invitado_por_user_id · created_at ·
updated_at`. **No hay `fecha_nacimiento`** — y §4.6 solo declaró el drift de
`permisos_jsonb`, no el de la fecha.

⇒ **el rol `menor` se puede escribir, pero nada puede verificar que la persona lo
sea.** P5 (menores) rige sobre un escalón que hoy es una declaración sin respaldo.
No bloquea la tanda 2 si el invitado v1 entra como `adulto_autorizado` (firma 5.1),
**pero sí bloquea invitar menores**, que es un caso que §4.3 trata como central
(*«muchas mascotas son adoptadas con/por niños»*).

### 🟡 4 · LA EXCLUSIÓN ES MUTUA Y EN LAS DOS DIRECCIONES — y eso ORDENA la firma 5.1

Hay **dos** triggers, no uno: `trg_codueño_no_es_familiar` sobre `mascota_codueño` y
`trg_familiar_no_es_codueño` sobre `mascota_familiar_autorizado`. **El modelo
prohíbe ser las dos cosas a la vez, desde los dos lados.** (Más
`trg_codueño_es_titular`, que exige que el co-dueño sea `adulto_titular` activo de
la familia.)

⇒ **la firma 5.1 (*«entra como familiar autorizado»*) es la única compatible con el
motor tal como está**, y «ascender a co-dueño» **no es agregar una fila: es cerrar la
de familiar y abrir la de co-dueño**, y además exige que el ascendido sea
`adulto_titular` en `familia_miembro`. *Es una transición, no un alta* — y quien la
construya sin medir esto va a chocar con un trigger.

---

## ④ EL CHOQUE ENTRE LO QUE LA PANTALLA PROMETE Y LO QUE EL FOUNDER FIRMÓ

`apps/cliente/src/app/(tabs)/cuenta/familia.tsx` — su propia cabecera dice, textual:
*«invitar **co-dueño** como hueco declarado con "Pronto"»*, y la clave del texto es
`cuenta.familiaInvitar` + `cuenta.familiaInvitarPronto`, bajo el comentario
*«hueco P1 declarado»*.

**La pantalla promete invitar CO-DUEÑO. La firma 5.1 dice que el invitado entra como
FAMILIAR AUTORIZADO.** Los dos no pueden regir.

**Voto de A:** gana la firma (es posterior y es la única que el motor soporta —§③.4),
y **la pantalla cambia su promesa**, no al revés. Pero es decisión de producto, no
técnica: *invitar a alguien a ser co-dueño y invitarlo a acompañar el cuidado son dos
invitaciones distintas, y la persona que las manda tiene que entender cuál mandó.*
**Se sirve al founder en el Checkpoint 1; C no toca ese texto antes.**

---

## ⑤ LO QUE ESTE RELEVAMIENTO **NO** MIDIÓ (declarado, no omitido)

- **Si `_user_es_familiar_autorizado_mascota` tiene consumidores vivos** — se midió
  que existe y que no lee `permisos`; **no** se censó quién la llama. Entra al turno 1.
- **`user_tiene_acceso_a_mascota`**: no se abrió su cuerpo. Es el helper que §4.6
  dice reescrito para consultar las tres patas; **su composición real está sin medir.**
- **Las 82 familias contra 15 miembros activos.** El desbalance es grande y no se
  explicó: la hipótesis razonable son las `virtual_prestador` / `virtual_refugio`
  (walk-in, P3) más el residuo marcado de las sondas de S92, **pero es hipótesis y se
  declara como tal.** No es de este frente; se anota para que nadie lo lea como dato
  de producto.
- **Los 18 tipos de evento** (`codueño_agregado`, `familiar_autorizado_agregado`,
  `transferencia_familia`) que la orden cita desde `BIO_EXPEDIENTE`: **no verificados
  contra `cat_tipos_evento`.** Importan para la tanda 2 (el alta deja sedimento).

---

## ⑥ VEREDICTO EN CUATRO LÍNEAS

1. **La letra existe, es `MODELO_PRODUCTO` §4, y ya venía declarando su propio drift
   desde S19.** No hace falta escribir letra nueva de familia para la tanda 2.
2. **El vocabulario de cuatro escalones está en el esquema; el motor distingue dos y
   medio** (`adulto_titular` muy vivo · `adulto_autorizado` con lector real ·
   `menor` parcial · `cuidador_externo` en cero).
3. **La configurabilidad de §4.3 es puerta sin motor**: la columna `permisos` existe
   y nadie la lee ⇒ **en v1 el permiso ES el escalón**, y eso hay que decirlo en la
   pantalla en vez de prometer una configuración que no existe.
4. **Falta la tabla de invitación entera**, el molde que se hereda no incluye el acto
   de invitar, y **la pantalla promete un escalón distinto al que el founder firmó.**

*Nada de esto bloquea la tanda 2 bajo la firma 5.1 — la vuelve más chica y más
honesta: un escalón, un default fijo, y la configuración fina como deuda con disparo.*
