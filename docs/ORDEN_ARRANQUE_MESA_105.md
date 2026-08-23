# ORDEN_ARRANQUE_MESA_105.md — e-PetPlace · «la cuenta, la identidad y la voz que sale por correo»

> **Qué es:** la orden de arranque de la Mesa 105, escrita sobre `PLAN_MESA_105.md`
> (mesa 104) **después de contrastarlo contra el canon subido** (`CLAUDE.md`,
> `POLITICAS` P1·P2·P5·P15·P21·P23, `MODELO_NOTIFICACIONES` §0ter/§0bis/§7/§10bis,
> `BIO_EXPEDIENTE` Bloque 9, `CONTRATO_TRABAJO` reglas 75·76·85·88).
> **Precedencia:** el repo y su bitácora ganan sobre este documento y sobre el plan.
> **Escrito:** 22-ago-2026 · **Autor:** la mesa (Claude Web) · **Rige entero** lo
> que el plan de la mesa 104 declara en su cabecera.

---

## §0 · TRES COSAS DEL PLAN QUE EL CANON YA CONTESTA — se corrigen antes de abrir

El plan de la mesa 104 pide tres mediciones en §1. **Dos de las tres ya tienen
respuesta escrita en el canon, y el plan las leyó de una foto vieja.** Es
exactamente la ley que el propio plan cita: *lo que dejó de ser cierto no se nota,
porque nunca fue falso al escribirse.*

### 0.1 · Las push NO son un conflicto: el «relevamiento previo» caducó hace 15 días

| | fuente | fecha | dice |
|---|---|---|---|
| el relevamiento que el plan cita | brief S82 §2bis (`CLAUDE.md` bloque S82) | 29-jul | `expo-notifications` inerte · `push_tokens` 0 filas · vía de envío sin firma |
| **lo vigente** | `MODELO_NOTIFICACIONES` **§0ter (S90)** | **7-ago** | **transporte `despachar-push` desplegado contra FCM v1 · cron job 8 `* * * * *` (65/65 `succeeded` en la primera hora) · `transporte_vivo=true` para push · tokens registrados por `registrar_push_token` · los dos teléfonos VIBRARON por camino real** |

⇒ **El founder tiene razón y la pista E no nace.** Lo que D mide en el turno 1 no
es *«¿funcionan?»* sino *«¿SIGUEN funcionando después de S103?»* (dos OTAs nuevas,
binarios re-horneados para DeUna, secretos movidos al `vault` en S103 — cualquiera
pudo cortar el cable). **Si el cron sigue en verde y hay entregas con
`estado=entregada` posteriores al 7-ago, el frente de avisos es corto.**

### 0.2 · El dominio YA está autenticado para Resend — el hueco es OTRO

`MODELO_NOTIFICACIONES` §⑤ (S89): **apex `epetplace.com` verificado en Resend,
remitente `hola@epetplace.com`, `transporte_vivo=true`, 31 entregas ese día.** Resend
no verifica un dominio sin SPF y DKIM en el DNS ⇒ **esos dos ya están.** Lo que hay
que medir en §1.2 se reduce a **DMARC** (`_dmarc.epetplace.com`).

**El hueco real, y es más grave que el DMARC:** los correos de **Supabase Auth**
(verificación · recuperación · cambio de correo · invitación) **no salen por
Resend**: salen por el SMTP por defecto de Supabase, con remitente ajeno, en inglés
y sin marca. *Ninguna plantilla lo arregla: hay que cambiar el tren.* La cura son
**dos piezas en el dashboard** (SMTP custom apuntando a Resend + Site URL, §10bis ④)
y **una en el repo** (`redirectTo` explícito en el wrapper de recuperación, que hoy
no existe). **Y D-299 sigue: la verificación de correo está APAGADA** (config de un
click, brief S82).

### 0.3 · El «documento completo de familia» EXISTE: es `MODELO_PRODUCTO.md` §4

Ubicado (mesa, 22-ago): nació en la sesión **«ALMA» del 13-may-2026**, la que
escribió `MODELO_PRODUCTO.md` v1.1. Su **§4 — el modelo humano** es la letra de
familia: **§4.2 co-dueños simétricos** (privacidad individual, doble confirmación
destructiva, co-dueños no convivientes) · **§4.3 familiares autorizados** —
**adulto** con permisos *configurables* (lectura completa o filtrada · autorizar
prestadores en emergencia · programar citas sí/no · qué notificaciones · postear
hitos) y una lista de lo que **jamás** puede (acciones destructivas, cambiar
visibilidad, transferir) · **menor** (P5: hitos y fotos, notificaciones afectivas y
no administrativas, cero transacciones, moderación) · **cuidador externo** (sitter,
vecino: lectura básica + emergencia por default) · **§4.4 transferencias** (la
historia viaja con la mascota). **Está en `docs/` y es lectura OBLIGATORIA de toda
sesión de producto** (`CLAUDE.md`, EL NORTE).

Lo que el sistema YA honra de esa letra: **Bloque 9 de `BIO_EXPEDIENTE`** (`familia`
· `familia_miembro` · `mascota_codueño` · `mascota_familiar_autorizado` · helpers
`_user_es_*` · triggers `validar_codueño_es_titular` y
`validar_familiar_no_es_codueño` · los 18 tipos de evento `codueño_agregado`,
`familiar_autorizado_agregado`, `transferencia_familia`…) + **P1/P2/P5** + la
pantalla **Tu familia** de Cuenta v1 (S55-B3: *invitar = hueco P1, D-335*).

**Lo que el relevamiento de A tiene que contestar, ya con el objeto correcto:** los
permisos *configurables* de §4.3 ¿tienen columna? (`familia_miembro.permisos_jsonb`
se **eliminó** del INSERT en S19 — puede que la configurabilidad sea letra sin
motor) · ¿existe la distinción adulto / menor / cuidador externo en el esquema o solo
en el doc? · ¿qué default hereda el invitado si nada está configurado? **Esa tabla es
el insumo de §5.1 y nada del frente 4 se construye antes.**

---

## §1 · PISTAS, TERRITORIOS Y ARCHIVOS DECLARADOS (regla 76(h) · regla 85)

**CUATRO pistas. E muere** (salvo que D mida lo contrario en el turno 1 — §0.1).
Cada pista abre en **su worktree** (regla 85) y **declara su lista real de archivos**
al abrir tanda, no el territorio genérico.

| pista | territorio | declara al abrir | gates |
|---|---|---|---|
| **A** (conductora) | `main` · `supabase/migrations` · `packages/api` · `packages/domain` · `docs/` · merge/push/OTA (regla 88: el merge es de una sola mano) | migraciones nuevas con **reversa escrita ANTES y 76(g) declarada** · wrappers de cuenta · `docs/loop/S10X-*` · bitácora | **pide todos los gates al founder; nadie más los toma** |
| **B** | `packages/ui` · tokens · `scripts/verify-*` · jueces | piezas de cuenta (Hoja de confirmación destructiva · pantalla «qué se va y qué queda» · lista de sesiones · tarjeta de invitación/onboarding corto) · **R63: ninguna promesa de cuenta apunta a superficie inexistente** | gate visual por pieza, en dispositivo, vía A |
| **C** | `apps/cliente` · `apps/prestador` | `app/(cuenta)/*` cliente · simetría `/recuperar` y proveedores en prestador · lámina de onboarding del invitado | E2E por pantalla, vía A |
| **D** | `supabase/functions/*` · Resend · plantillas de Auth · DNS/SMTP (con el founder) · push | `despachar-*` · plantillas · `docs/relevamientos/2026-08-2X-s10X-CORREO-Y-PUSH.md` | el correo se gatea **en la bandeja de entrada real** (Gmail + un segundo proveedor), no en el log de Resend |

**Freno del aparato (vigente de S103):** un solo teléfono ⇒ los gates se **piden a
A** y se serializan. Ninguna pista da por pasado un gate que no corrió el founder.

---

## §2 · TURNO 0 (solo A) y TURNO 1 (las cuatro, SIN CÓDIGO)

### Turno 0 — A

1. Deposita `PLAN_MESA_105.md` + este documento en `docs/`; abre bitácora con **el
   número que la bitácora asigne**.
2. 🔴 **Relevamiento de familia** (§0.3): encuentra el documento o declara que la
   letra vigente es Bloque 9 + P1/P2/P5. Entrega una tabla de UNA página:
   *escalón · qué ve · qué puede hacer · cómo entra hoy · qué falta para que entre
   por invitación*. **Contrasta el trigger `validar_familiar_no_es_codueño` contra la
   firma «por ahora, que entre»** — el modelo ya prohíbe ser las dos cosas, así que
   «que entre» exige elegir escalón (§5.1).

### Turno 1 — las cuatro en paralelo, cada medición con su objeto declarado

**A — base y dashboard (con el founder al lado para §1.3):**
- `profiles.email` vs `auth.users.email`: ¿cuántas filas divergen HOY? (control
  positivo: la query cuenta; se espera 0). Quién escribe `profiles.email` (grep en
  `packages/api`, triggers sobre `profiles`, la function que la creó).
- Lectores de `profiles.email`: todos los callers, no solo `miPerfil.ts:37`.
- **Dashboard Auth → «Secure email change» (`double_confirm_changes`)**: estado en
  PRODUCCIÓN, leído de la pantalla, con captura. Site URL y Redirect URLs vigentes.
- Proveedores habilitados en el proyecto (Google sí — ¿Apple?).
- `empleado_invitaciones`: las RPCs vivas, cuántas y cuáles (el plan dice seis,
  `PORTAL_PRESTADOR` dice tres — **se cuenta, no se cita**), y si alguna corrió
  alguna vez (`pg_stat_user_functions` o huellas).

**D — push y correo:**
- Push: `cron.job_run_details` del job 8 desde el 7-ago (¿sigue `succeeded`?) ·
  `push_tokens` (cuántos, de qué cuentas, `updated_at`) · última entrega
  `estado=entregada` por push · ¿los OTAs de S103 (`3e8a45fc` / `3031d595`) tocaron
  `registrar_push_token` o el manifest? Veredicto en UNA línea: *corto* o *frente*.
- DNS: `dig TXT epetplace.com` (SPF) · `dig TXT _dmarc.epetplace.com` (DMARC) · los
  selectores DKIM que Resend declara. Tres líneas literales.
- **Supabase Auth → SMTP Settings**: ¿custom o por defecto? (con el founder).
- Inventario de plantillas: las **6 de Auth** (Confirm signup · Invite user · Magic
  link · Change email · Reset password · Reauthentication) — idioma, remitente,
  marca, `{{ .ConfirmationURL }}` hacia dónde — y las de Resend que ya existen
  (comprobante S101, avisos). Tabla **plantilla · existe · idioma · remitente ·
  quién la dispara · corrió alguna vez**.
- **D-628** (aviso en inglés) y **D-884** (recurrencia promete saltar/mover):
  ubicación exacta del texto.

**C — censo de superficies de cuenta en las DOS apps:**
- Tabla por pantalla: *existe · promete · hace de verdad · a qué wrapper llama*. Hoy
  se sabe: cliente tiene cambiar clave + `/recuperar` (S103-C), «eliminar cuenta» con
  voz y sin motor (D-337), «Tu familia → invitar» en «Pronto» (D-335), email
  read-only. Prestador: cambiar clave y `/recuperar` — **verificar simetría** con el
  login de proveedores.
- Login: ¿botón de Google en alguna app? (S82: **8 cuentas solo-Google sin camino**,
  Satori incluida). ¿Apple?
- La familia solo-Google: ¿puede crearse una clave desde la app?

**B — las piezas que faltan y el juez:**
- Contra el censo de C: qué pieza existe en `packages/ui` y cuál no (Hoja de
  confirmación en dos pasos con texto de consecuencias · lista de sesiones · tarjeta
  «copiá el enlace» · lámina de onboarding corto).
- Diseño del juez **R63** (en la familia de `verify:diseno`): toda ruta prometida
  en una superficie de cuenta (`router.push('/cuenta/...')`, deep link de invitación)
  resuelve a un archivo existente. **Rojo producido antes de declararlo verde.**

---

## §3 · CHECKPOINT 1 — la mesa contrasta, el founder firma

Entrega de cada pista: **una tabla, un veredicto, cero código.** La mesa contrasta
las cuatro y el founder firma lo de §5 que todavía no esté firmado. Recién ahí se
autoriza la tanda 1.

---

## §4 · LAS TANDAS

### Tanda 1 — los cimientos (A · D · B), C arranca superficie sin motor

**A — Frente 1, la copia que miente (bloquea al 3).** Decisión técnica de la mesa,
regla 3, se informa y no se vota:
- `auth.users.email` es LA fuente. `profiles.email` pasa a **espejo de solo lectura**
  mantenido por trigger sobre `auth.users` (`AFTER UPDATE OF email`), con backfill
  único y declarado (76(g)). Ningún wrapper la escribe (REVOKE + juez).
- `miPerfil.ts` y todo lector: leen `auth` primero; `profiles.email` queda como
  cache para listados/RLS, jamás como verdad.
- Migración con reversa escrita antes · assert «divergencia = 0» antes y después.

**D — el tren del correo, en orden:**
1. **SMTP custom de Supabase → Resend** (con el founder, §7). Se prueba mandando un
   Reset Password a una cuenta real y leyéndolo **en Gmail**: remitente, carpeta
   (bandeja o spam), enlace.
2. **DMARC** si falta: `p=none` con `rua` a `privacidad@` primero; subir a
   `quarantine` después de dos semanas limpias.
3. Las **6 plantillas de Auth** rehechas con la casa heredada de la plantilla de
   Resend (isotipo hosted, wordmark fallback, tapiz, CTA). **Idioma: §5.4.**
4. `redirectTo` explícito en el wrapper de recuperación (la mitad del repo de
   §10bis ④) + Site URL correcto en el dashboard (la mitad del founder).

**B —** las piezas del censo, de a una, con gate visual.

**C —** las superficies de cuenta del cliente sobre wrappers que A ya entregó
(cambiar correo, sesiones), con voz honesta donde el motor todavía no llegó.

### Tanda 2 — identidad, entrada y la invitación (Frentes 2 y 4)

- **A:** motor de invitación **heredando el molde de `empleado_invitaciones`, jamás
  su alcance**: `familia_invitaciones` (correo · token · escalón invitado · expira 30
  días como P13 · quién invitó · aceptada_por). RPCs: `invitar_a_familia` (solo
  titular) · `aceptar_invitacion_familia` (activa `familia_miembro` +
  `mascota_familiar_autorizado` o `mascota_codueño` según §5.1) · `revocar`. Al
  aceptar, el evento queda en el sedimento. **Cero escritura a tablas desde la app**
  (puerta única).
- **A:** Google/Apple: si Apple falta, se declara **bloqueante de publicación, no de
  piloto**, y entra a `D-NNN` con disparo «antes de la compuerta B6».
- **A:** «cerrar sesión en todos los dispositivos» = `signOut({scope:'global'})`,
  barato y honesto; **listar sesiones** se construye sólo si C lo pide con pantalla
  (vive en `auth.sessions` vía RPC DEFINER).
- **D:** el **correo de invitación** (nace acá: plantilla, idioma, remitente) y el
  **enlace copiable** — un deep link que hoy apunta a **www.epetplace.com/invitacion/
  {token}** con texto honesto («la app todavía no está en tiendas; te avisamos») y
  **deuda declarada** para el día que exista la tienda. *Se publica lo incompleto,
  jamás lo falso.*
- **C:** «Tu familia → Invitar» deja de decir «Pronto»: correo + botón «copiar
  enlace» (para WhatsApp, lo manda la persona) · pantalla del invitado: **onboarding
  corto de lo que existe** (qué es esto, qué puede ver, qué puede hacer) — tres
  láminas, no la app entera.
- **B:** tarjeta de invitación · lámina de onboarding · el juez R63 vigilando los dos
  enlaces nuevos.

### Tanda 3 — cerrar cuenta y exportar (Frente 3, la pieza grande)

**Precondición:** la letra de §5.2 firmada en el Checkpoint 2. Sin ella no se escribe
una línea. Luego:

- **A:** `solicitar_cierre_cuenta` (DEFINER, puerta única) con los cuatro actos de
  P15 en ORDEN: ① pre-chequeo (titular con otros vigentes ⇒ exige transferencia de
  titularidad primero; único adulto ⇒ destino de las mascotas según firma) · ②
  **exportación** generada y entregada ANTES (archivo en bucket privado, URL firmada
  por correo) · ③ cierre de vínculos **con motivo `cierre_cuenta`** — jamás por
  CASCADE, que es el arrastre callado que P15 teme · ④ inalcanzabilidad (§5.2).
  Reversa escrita antes; ensayo **sobre una cuenta de sonda**, nunca sobre la del
  founder.
- **D:** correo «confirmación de cierre» (qué se fue, qué queda y por qué — la
  cláusula ④ de P15, en texto) + correo con la copia.
- **C:** la pantalla dice EXACTAMENTE eso antes de confirmar (P15 ④); doble paso; voz
  honesta; el «Pronto» muere.
- **B:** la Hoja de consecuencias, el estado «cierre en curso».
- **El prestador que se va: NO se construye.** A escribe el **borrador de letra** con
  los tres obstáculos medidos (17 citas futuras pagadas de terceros · 27 empleados con
  acceso · 36 eventos sin liquidar) y tres caminos por obstáculo; el founder firma
  otra mesa.

### Tanda 4 — lo que falta de la voz (Frente 5)

- Correos faltantes: **bienvenida** (con verificación si §5.5 la enciende) ·
  **aviso de recurrencia** con monto y medio (hoy en sombra y sin monto — D-886 lo
  frena: el plan no registra con qué medio renueva; **se corrige el texto al alcance
  real** — cancelar — y saltar/mover NO se construyen, D-884).
- **D-628** al idioma del usuario.
- Push: lo que §0.1 haya dejado corto.

---

## §5 · DECISIONES DE MESA — con opciones y voto (regla 5)

**5.1 · Con qué escalón entra el invitado («por ahora, que entre»)**
(a) Entra como **familiar autorizado** (Bloque 9: notas limitadas, vista limitada);
ascender a co-dueño es un acto posterior del titular. (b) Entra como co-dueño
directo. **Mi voto: (a).** Co-dueño es el escalón que P1 vuelve irreversible sin
consenso; darlo por un enlace compartido por WhatsApp es prometer más de lo que el
que invita entendió. **Y es lo que `MODELO_PRODUCTO` §4.3 ya dice**: el familiar
autorizado adulto es el escalón de entrada con permisos configurables; co-dueño es
titularidad plena. **Default v1 del invitado, tomado de §4.3 (hasta que el titular
configure):** lectura completa del expediente · notificaciones · postear hitos
familiares · **sin** programar citas ni autorizar prestadores. Si A mide que la
configurabilidad no tiene columna (§0.3), el default es lo ÚNICO que entra en v1 y
la configuración fina es deuda con disparo declarado.

**5.2 · Qué significa «inalcanzable» en la base** — la letra que falta en P15.
P15 firmada dice *«no destruye el registro»*, pero su lista «lo que la implementación
todavía tiene que resolver», ítem 5, dice *«auth.users se elimina de verdad»*. **Las
dos no pueden regir**: el censo midió 24 FKs que rebotan el DELETE y 21 CASCADE que
harían daño callado. (a) **La fila de `auth.users` QUEDA**: `banned_until`
indefinido · identidades externas (Google) removidas · sesiones revocadas · correo
reescrito a un tombstone por uid · `profiles` anonimizado (nombre, teléfono, foto) ·
objetos del bucket `{uid}/…` borrados de verdad. Consentimientos, plata y eventos
intactos y desligados. (b) Borrado duro de `auth.users` pasando FKs a SET NULL.
**Mi voto: (a).** Es la única forma coherente con la firma, con P23 y con el
precedente de las 64 sondas de S92. Ítem 5 de P15 se enmienda a «la fila queda
inalcanzable; el storage sí se borra».

**5.3 · Ventana de arrepentimiento.** (a) 30 días: pierde acceso hoy, la anonimización
corre a los 30 (cron) y en el medio se reactiva por `privacidad@`. (b) Inmediato.
**Mi voto: (a)** — y el cron nace INERTE con llave en `app_config`, como el
recurrente.

**5.4 · Idioma de los correos de Auth.** Supabase Auth manda UNA plantilla por tipo,
sin idioma por usuario. (a) Plantillas **bilingües en un cuerpo** (español arriba,
inglés abajo, breve). (b) Send Email Hook → edge function → Resend con idioma por
usuario (control total, pero un fallo deja a alguien sin poder recuperar su clave).
**Mi voto: (a) para v1, (b) como deuda con disparo «primer usuario que no lea
español»**. Los correos de Resend (los nuestros) ya siguen al usuario — se mantiene.

**5.5 · Verificación de correo (D-299).** (a) Encenderla **después** de que el SMTP
custom y la plantilla en español estén gateados en Gmail — nunca antes (hoy mandaría
un correo ajeno en inglés). (b) Dejarla apagada hasta tiendas. **Mi voto: (a),
condicionada al gate**: una cuenta con correo no verificado no puede recibir su copia
ni su cierre con seguridad.

**5.6 · Sesiones.** (a) v1 = «cerrar sesión en todos los dispositivos» + «cambiar
clave cierra las demás». (b) Lista de dispositivos con fecha. **Mi voto: (a)**; (b) es
pantalla sin dato útil hasta que haya más de un aparato por persona.

---

## §6 · LO QUE ESTA MESA NO HACE (hereda §4 del plan y suma)

No toca pagos salvo lo que traiga el `pointOfSale` · no enciende el cron del
recurrente ni el de anonimización · no redacta materia legal (D-405) · no construye
saltar ni mover · no construye el cierre del prestador · no decide el escalón fino del
invitado contra el documento de familia si éste aparece · no enciende la verificación
de correo antes de su gate · no renumera sesiones · **no abre la pista E sin la
medición de D.**

---

## §7 · LO QUE NECESITO DE VOS (founder) — en orden, con QUÉ · DÓNDE · CÓMO

| # | qué | dónde | cómo sé que está |
|---|---|---|---|
| 1 | ~~Nombrar el documento de familia~~ ✅ **RESUELTO 22-ago**: es `MODELO_PRODUCTO.md` §4 (§0.3). A releva sobre ese objeto | — | — |
| 2 | ~~Firmar 5.1 a 5.6~~ ✅ **FIRMADAS 22-ago** sobre la lectura en una línea de cada una (abajo, §7bis). Se reabren solo si el relevamiento de A contradice §4.3 | — | la tanda 1 queda autorizada al cierre del Checkpoint 1 |
| 3 | **Acceso al dashboard de Supabase** para tres lecturas: Auth → «Secure email change» · Site URL / Redirect URLs · SMTP Settings | `supabase.com/dashboard` → proyecto → Authentication | capturas de las tres pantallas pegadas en la bitácora |
| 4 | **Cargar el SMTP custom**: host `smtp.resend.com`, usuario `resend`, contraseña = una API key de Resend creada SOLO para esto, remitente `hola@epetplace.com` | Supabase → Project Settings → Auth → SMTP | D manda un «recuperar clave» a tu cuenta y lo leés en Gmail desde `hola@epetplace.com`, en bandeja de entrada |
| 5 | **El registro DMARC** si D mide que falta: TXT en `_dmarc.epetplace.com` con el valor que D te pasa | el panel del DNS de epetplace.com | `dig TXT _dmarc.epetplace.com` devuelve la línea |
| 6 | **El mapa de remitentes**, una sola vez. Propuesta: `hola@` = cuenta, invitaciones y avisos · `privacidad@` = cierre de cuenta, copia de datos y LOPDP · soporte = enlace a WhatsApp en el cuerpo · lo comercial, el día que exista, **sale de un subdominio propio** (la regla de §7 del modelo: transaccional y comercial jamás en el mismo dominio) | esta mesa | D construye plantillas con remitente fijo |
| 7 | ~~Apple~~ ✅ **CONTESTADO 22-ago: no hay cuenta; el D-U-N-S está pedido y no llega.** Consecuencias en §7ter. Lo que sigue pidiendo acción tuya: **reclamar el estado del D-U-N-S a Dun & Bradstreet** (el pedido gratuito demora hasta 30 días; si fue por el formulario de Apple, Apple lo acelera a ~5 días hábiles) y **verificar si Satori Latam (Colombia, NIT 901579644) ya tiene D-U-N-S** — muchas sociedades lo tienen sin saberlo, y se puede publicar bajo la entidad que lo tenga | buscador D-U-N-S de Apple (`developer.apple.com/enroll/duns-lookup`) con cada razón social | un número de nueve dígitos para alguna de las dos entidades |
| 8 | **Los gates en dispositivo**, serializados por A, uno por pieza | tu teléfono, por A | cada gate cierra con tu ojo, como siempre |
| 9 | Las llaves que ya estaban: rotación del secreto de despacho (D-885, después de S103) · encender el recurrente (después de las tres claves de `app_config`) · abogado/contador · `pointOfSale` del lunes | — | sin cambio |

## §7bis · LAS SEIS DECISIONES, en una línea cada una (lo que el founder firmó)

1. **Quien entra por invitación entra como familiar autorizado**, no como co-dueño: ve todo, recibe avisos, puede postear hitos; no agenda ni autoriza prestadores. Ascenderlo es un acto aparte del titular.
2. **Cerrar cuenta no borra la fila de la persona: la vuelve inalcanzable** (sin poder entrar, sin Google, sin sesiones, nombre y teléfono anonimizados, fotos borradas de verdad). Consentimientos, plata y eventos quedan, desligados.
3. **30 días de arrepentimiento**: pierde acceso hoy, la anonimización corre al día 30, y en el medio se recupera escribiendo a `privacidad@`.
4. **Los correos de Auth salen bilingües en un solo cuerpo** (español arriba, inglés corto abajo); el correo por idioma de usuario es deuda declarada.
5. **La verificación de correo se enciende DESPUÉS de que el correo salga de nuestra casa y en español**, gateado en tu Gmail; nunca antes.
6. **Sesiones v1 = un botón «cerrar sesión en todos los dispositivos»** (y cambiar la clave cierra las demás). La lista de dispositivos, después.

## §7ter · SIN CUENTA DE APPLE NI D-U-N-S — lo que cambia en el plan

- **Sign in with Apple deja de ser deuda de esta mesa**: no existe hasta que exista la cuenta. Se registra con disparo «cuando llegue el D-U-N-S» y no se construye nada para iOS.
- ⚠️ **El D-U-N-S bloquea probablemente las DOS tiendas, no una**: Google Play también lo exige para cuentas de organización (regla vigente desde 2023). **D lo verifica en el turno 1** contra la consola de Play, porque el brief S82 ya decía que `production` no existe en `eas.json` y la cuenta Play estaba sin medir. *Si se confirma, el soft launch de octubre es por APK directa (Android) y enlace de instalación, no por tienda — y eso hay que decirlo en el plan, no descubrirlo el 1-oct.*
- **El enlace de invitación apunta a instrucciones de instalación, no a una tienda**, por más tiempo del que el plan suponía. La deuda ya estaba declarada; lo que cambia es su fecha, que ahora depende de D&B.
- **P15 / D-337 pierde su apuro de tiendas y conserva el de producto**: se construye igual en la tanda 3, porque la política ya rige y la pantalla promete.

*Lo que trae el lunes —DeUna, el `pointOfSale`— lo toma D y no esta orden; hasta
entonces D es del correo. Si la respuesta de DeUna llega antes, el founder decide si
D suelta el correo o si el correo espera: no se hacen las dos a medias.*
