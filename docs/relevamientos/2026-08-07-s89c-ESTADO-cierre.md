# S89 · PISTA C — ESTADO DE CIERRE (6-7 ago 2026)

> Territorio: `apps/prestador`. **Cero dedos de esta pista en todo el turno**
> (régimen de aparato: el único teléfono es del founder; regla 87). Ningún
> emulador levantado — verificado al cerrar: `adb devices` vacío, cero
> procesos `qemu/emulator`. **Árbol limpio sobre `origin/main`**; último hash
> de la pista: **`fad01654`** (mergeado a main en `79a6d82b`), worktree
> adelantado por fast-forward a **`ea798ce5`**.

---

## 1 · LO PAGADO — siete commits, todos en `origin/main`

Verificado por objeto (`merge-base --is-ancestor` contra `origin/main`, los
siete): `96fd21e6` · `d6ee1e4f` · `b93b3105` · `d6a58e5a` · `db14df5e` ·
`ffa2516e` · `fad01654`.

### ① El re-anclaje (apertura)
Los cinco commits del cierre S88-C confirmados ancestros de `origin/main` por
`merge-base`, **no por el acta** — la verdad del objeto. `tsc` y
`verify:diseno` en verde antes de construir encima.

### ② `es.ts:66` — el OCTAVO sitio de P1, con su exención retirada
El único de los ocho sitios de P1 que S88 no reescribió: la voz del empleado
seguía diciendo «tu acceso todavía no está disponible en la app, te avisamos»
con **la puerta abierta desde S75**. Medí antes de tocar: la rama **NO se
retira** (decisión de mesa S75 — cambió de caso, no murió: hoy cubre al
empleado activo de un negocio NO-`activo`, esperando su lector). Así que la
cura es de prosa y de voz: lápida **escrita sin la palabra vigilada a
propósito**, para que la exención del registro se pudiera **retirar** en vez
de mutar. La voz dice el caso real: *lo que falta es que el NEGOCIO esté
activo, no la app* (es+en). De paso cayó otro comentario vencido en el mismo
archivo (`es.ts:111` afirmaba un consumidor «ACEPTADO» que murió por Ley 37).
`verify-censo` brazo ② VERDE: 13 ocurrencias, todas clasificadas.

### ③ D-656 PAGADA — la cáscara vacía se retoma, jamás bloquea
**Regla del literal cumplida: el bloqueo se REPRODUJO antes de curar.**
Fixture in-txn por el camino del JWT: cáscara `pendiente_validacion` con
`datos_bancarios '{}'` → `success=f · «Ya tienes una cuenta comercial
registrada…»` — su único intento, consumido. Recién entonces la cura firmada
(opción 1, founder 4-ago).

- **La forma de «sin uso» no depende del censo (L-169):** el helper
  `_cuenta_comercial_tiene_uso` recorre EN VIVO las FKs entrantes de
  `cuentas_comerciales` contra `pg_constraint` — hoy 21 tablas, y toda FK
  futura entra sola sin re-censar.
- **Fixture post-cura 6/6 con el par del discriminador:** la cáscara se retoma
  con su mismo id · la propia identificación no dispara el guard de duplicado ·
  con-uso rebota · cuenta activa rebota · el INSERT de siempre intacto · el
  duplicado ajeno rebota. Residuo 0.
- **Consecuencia medida sobre las cuentas vivas:** Satori y Carlos tienen uso
  (prestador enganchado) ⇒ **no son cáscaras** y siguen protegidas por el rebote.
- Migración `20260806120000` aplicada y registrada · **reversa escrita ANTES**
  (`2026-08-06-s89c-REVERSA-d656.sql`, avisa que revertir REABRE el bloqueo) ·
  `proacl` limpio (helper sin `anon` ni `authenticated`, L-140) · `gen:types` en
  sync (+4 líneas, solo el helper) · 76(g) NO RIGE (DDL sin backfill) · bundles
  vivos declarados compatibles (firma y RETURNS idénticos).
- **Lo que la paga NO cubre, declarado:** la celda incondicional que OFRECE la
  puerta es superficie y viaja con el lote de roles/barra de tres.

### ④ La voz de la plata — el gemelo en la SUPERFICIE
A contestó el gate en el motor (`6f0738f`) y el tab Datos no se había
re-medido. El gate está bien puesto (lo decide el server: `plata.visible`,
confirmado contra el body vivo — `empleado_es_mostrador_o_gestion`), pero la
voz del hueco decía «Solo el titular ve los ingresos» y **describía de menos**:
titular, admin y recepción ven; el único que lee ese hueco es el profesional, y
le mentía. Curado con **la voz que su hermano del HOY ya fijó** en S88-C — «Los
ingresos los ve quien está en el mostrador» / «Earnings are visible to whoever
runs the front desk» (es+en). *La voz no se re-inventa*; la key conserva su
nombre como el hermano, con su marca ⏪ explicando por qué.

### ⑤ El consumo de la visita — par 3/3
Sobre el contrato v2 de A (`9f72a924`, migración `20260806240000`: asiento por
`(user_id, app)`):
- `(tabs)/index.tsx` → **`hayNovedades('prestador')`** (estado renombrado a
  `novedades`: el nombre dice la semántica nueva).
- `avisos.tsx` → **entrar deposita la visita** (`registrarVisitaCampana`),
  fire-and-forget con su porqué escrito: un fallo no corta la pantalla, la
  huella queda encendida y la próxima entrada reintenta.
- `techo-oficio.tsx` → **sin cambio de semántica propia**: sigue recibiendo un
  booleano y dibujando presencia; solo el prop dejó de mentir su nombre.
- **Par por el camino real del JWT, in-txn, residuo 0:** fixture con el filtro
  REAL del motor (`resuelto_como->>'despacho' = 'para_transporte'`, leído del
  body vivo) → **T1** huella presente · **T2** entrar SIN tocar filas → huella
  ausente **y la fila sigue no-leída** (el discriminador exacto de la letra:
  leído ≠ visto) · **T3** aviso nuevo tras la visita → la huella vuelve (trampa
  L-122a esquivada: `now()` es constante en la txn, el «después» se simuló con
  `+1s` explícito).

### ⑥ La barrida «push» del prestador — VERDE, sin commit
Con el criterio exacto del patrón de D (`7e030b6`): **cero «push» en valores de
string**. Los únicos hits son un comentario que CITA la propia ley (`en.ts:520`)
y tres `case 'push'` en `preferencias.tsx` que son **código de motor** (el
código del canal, que la pantalla ya traduce a la voz firmada «En el
teléfono»). La extensión de la ley ya se cumplía de facto desde S88.
**Sin cambio no hay commit — el verde de una barrida también es resultado.**

### Depósitos de medición (sin código)
- `2026-08-06-s89c-MAPA-destinos-push-prestador.md` — 19 tipos contra el mapeo
  vivo; el fork de `cita_solicitada` a A; el cruce ① reforzado (8 de 13 tipos
  de prestador sin referente natural); la premisa candidata al censo.
- `2026-08-06-s89c-INVENTARIO-contenido-documentos.md` — §2 de este acta.
- `2026-08-06-s89c-LISTA-BUNDLE.md` — superseded por §4 de este acta.

**Dos depósitos míos ya rindieron en main, y lo registro como dato del método,
no como mérito:** el requisito de `cita_solicitada` viajó y A lo adjudicó (la
intención porta su `evento_id`, `be6a3e9`), y **P6 nació en el censo de A desde
mi premisa** de `saldo_pagado` (`0da03c7`, con su contra-caso adentro).

---

## 2 · LA ORDEN 4 (inventario clínico) — DEPOSITADA Y VIVA, **con una
## corrección que la medición obliga**

La orden de cierre pide declararla «depositada y viva para la lámina del arco
en S90». **Lo está — pero declararla solo así sería falso hoy: A la consumió
en la misma sesión y tres de sus hallazgos YA ESTÁN PAGADOS.** A cita el
depósito con todas las letras en
`2026-08-07-s89a-MEDICION-receta-antes-de-construir.md:37`: *«inventario de C, y
acá tiene su medición»*.

**Lo consumido y pagado (medido en `origin/main`, no supuesto):**

| hallazgo del inventario | qué pasó |
|---|---|
| **La credencial y la matrícula viven en el NEGOCIO, no en el profesional** — «en una clínica multi-vet no se puede poner el número del firmante» | **D-676, CURADA EN EL MOTOR** (`35f83f0c`): columna en `prestador_empleados` + gate en los tres puntos de asignación, con transición medida (gracia al 1-sep) y el gate elevado a **VISIBILIDAD** con corte 15-ago (`c2851f5e`) |
| **El hueco de la HC no es de contenido: es de SALIDA** (el producto guarda una consulta más rica que muchos papeles; lo que no sabe es imprimirla) | **CONSTRUIDO** (`8dc8d8f4`): la historia clínica ganó su papel, con posología completa y el null honesto de los vitales; y el papel **DICE LA PERSONA** (nombre + matrícula por consulta, con el negocio como fallback honesto) |
| **La desparasitación no existe y el carnet saldría incompleto** (§4, pregunta 6) | **D-476 ELEVADA con letra nueva y disparo firmado** (`75645a7f`): el carnet emitido la exige |

**Lo que sigue VIVO para la lámina del arco en S90** (nada de esto se tocó):

1. **`evento_certificado_emitido` es un cascarón V0 completo** — 0 filas, **CERO
   productores**, y un contrato sorprendentemente ambicioso ya escrito:
   numeración, vencimiento, **`destino_pais`** (viaje), propósito, revocación y
   renovación. La pregunta de mesa sigue abierta: **¿se ensancha o se rediseña?**
   (L-175 manda ensanchar, pero el contrato es pre-monorepo).
2. **La procedencia del carnet:** las **32 vacunas vivas son TODAS del escaneo**
   (`prestador_id = null` en las 32) ⇒ un carnet emitido hoy re-emite dato
   **declarado**, no verificado. `verificado_por_prestador` sigue tipado y **sin
   productor**. ¿El papel mismo distingue la procedencia? El CHECK de tres
   niveles ya existe para decirlo.
3. **La firma** (imagen o digital) **no existe en ninguna tabla** — y sin ella,
   la pregunta «¿quién firma: el profesional, el negocio, o ambos?» no tiene
   cómo materializarse aunque se decida.
4. **Color / señas particulares de la mascota no existen** en `mascotas` — los
   certificados zoosanitarios los piden.
5. **Las preguntas de mesa que quedan sin resolver:** numeración del certificado
   (¿del negocio o de la plataforma?) · alcance del certificado de VIAJE en v1 ·
   qué papel puede pedir el dueño solo y cuál exige acto del prestador (cruza
   con `BIO_EXPEDIENTE` A3: el ACTO decide qué se muestra).
6. **Nota al pasar, sin dueño:** `prestador_recetas_frecuentes` también es
   cascarón (0 filas) y su único productor es `completar_historia_clinica`, RPC
   del portal legado con **cero consumidores en el monorepo** — clase «huérfanas
   se jubilan» cuando el arco de recetas abra.

---

## 3 · LO QUE NO SE HIZO, sin maquillaje

- **El ancla del OTA vigente NO la verifiqué.** El group vivo del canal
  `preview` del prestador es **`61333306-40f4-4045-9efb-6d0991f20330`, runtime
  1.0.4** (publicado ~18 min antes de este cierre), pero `eas update:list/view`
  **no expone `gitCommitHash`** en el formato que devolvió acá. **Que mi
  `fad01654` viaje en él lo prueba el ancla, no el reloj** — y el reloj es lo
  único que tengo, así que no lo afirmo (L-166). Lo confirma A (la veda y el
  publish son suyos) o el **pie de Cuenta en pantalla** (L-160).
- **⚠️ EL CORTE DE RUNTIME, que gobierna todo dedo que venga:** A cortó el tren
  nativo a **prestador 1.0.4 · cliente 1.0.3** (`c2851f5e`). **Un OTA 1.0.3 es
  INVISIBLE para una APK 1.0.4 y viceversa** — todo dedo del founder empieza
  confirmando qué binario tiene instalado (L-138) y contra qué runtime se
  publicó.
- **Ningún gate del founder está registrado en los 48 depósitos S89.** La orden
  de cierre pide listar «los dedos que el founder ya dio»: **desde mi territorio
  no hay ninguno medible** — grep en cero sobre los depósitos de la sesión. Si
  los dio, no llegaron a papel; la reconciliación es de A, que lleva el acta.
  **Mi lista del bundle sigue vigente ENTERA** y así se declara abajo, en vez de
  tachar por suposición lo que nadie registró.

---

## 4 · LA LISTA DEL BUNDLE — dedos pendientes (supersede al depósito del 6-ago)

> **Ninguno tachado**: ver §3. Régimen: cada ítem trae su paso a paso; las notas
> operativas (emulador, `adb -s`, sonda de credenciales, `eas-cli` desde
> `apps/prestador/`) viven en el estado S88-C §6 y **no se copian: se leen allá**.

**A · Herencia S88 (nunca corrieron — sus 5 commits no estaban en bundle)**
1. **Preferencias** (`/cuenta/preferencias`): 6 filas con sus líneas firmadas ·
   `resumen` ausente · rebote `categoria_no_apagable` · la Hoja de WhatsApp con
   su literal y el rebote `opt_in_sin_evidencia` (**construido y jamás
   ejercitado**) · permiso del SO negado, dicho.
2. **La campana** (`/avisos` + techo del HOY): la lista con los 4 estados · el
   toque lleva al lugar del hecho · vacío honesto · nombre largo y en inglés ·
   el toque en la banda de 20dp no abre lo que no era.
   ⚠️ *Caveat conocido (censo a B, sin cura):* el Badge pinta la huella con
   `accent.active` = el hex del muro del techo — puede ser invisible justo donde
   la lámina la manda. El ojo del founder lo va a ver; no es fallo del fixture.
3. **Viejo:** la voz nueva de GateAjeno vía deep link con el admin.

**B · S89 — lo nuevo de esta pista**
4. **La huella ahora mide LO NUEVO** (el gesto que el founder va a notar):
   con novedades → la huella está · **entrar a `/avisos` y salir SIN tocar
   ninguna fila** → la huella se apagó · las filas siguen marcadas como no
   leídas. *Antes esto exigía leer; ahora basta con haber visto.*
5. **La voz del hueco de plata** (tab Datos): entrar **como profesional con
   chips** → la tarjeta dice **«Los ingresos los ve quien está en el
   mostrador»** (ya no «Solo el titular»). Con titular, admin o recepción: la
   plata SE VE (números, no el hueco).
6. **Preferencias como PRESTADOR — el ojo de la derivación:** dos ausencias y
   una presencia — «Lo que ya pagaste» **NO está** (0 tipos `saldo_pagado` para
   prestador: la firma de mesa, cumplida por el catálogo) · «Resúmenes» **NO
   está** (0 tipos vivos) · «Salud y seguridad» **SÍ está** (2 tipos `ambas`).
   Contra-ojo en el cliente: «Lo que ya pagaste» SÍ se muestra allá.
7. **D-656 en dispositivo** (opcional, el motor ya tiene su par 6/6): una cuenta
   con cáscara `pendiente_validacion` sin uso completa el wizard de cuenta
   comercial y **entra** — donde antes rebotaba para siempre.
8. **SIN DEDO POSIBLE, declarado:** la voz del empleado de negocio no-activo
   (`sesion.empleadoDetalle`). La rama espera su lector y hoy degrada a
   `sinRol`: **no hay camino de pantalla que la alcance**. Verificada por código
   (tsc + Espejo es/en). Entra solo como registro.

**C · Cuentas de prueba — con su advertencia vigente**
- (a) `+s87prof` · (b) `+s87recep` · (c) `demo-prestador` — `S87prueba!2026` ·
  admin `+s88rolpuro` — `S88puro!2026`.
- **Todo recuento excluye `+s87`/`+s88` o miente.**
- ⚠️ **(c) `demo-prestador` sigue bajo investigación de A** (falló login el
  6-ago): **la sonda funcional de credenciales corre ANTES de gastar cualquier
  dedo con esa cuenta** — un curl contra `/auth/v1/token?grant_type=password`
  discrimina credencial muerta de fallo de UI, y una sesión residual puede
  fingir un verde.

---

## 5 · OPERATIVO

- **Migración:** `20260806120000_d656_la_cascara_vacia_se_retoma` — aplicada,
  registrada en el historial remoto, con reversa escrita ANTES.
- **Gates al cierre:** `tsc` EXIT=0 leído del comando (L-191) ·
  `verify:diseno` **VERDE, 25 reglas** (incluida R33 de B: mis dos montajes de
  huella declaran superficie) · `verify-censo` brazo ② verde.
- **Fixtures:** los tres corridos in-txn con `RAISE` como sello de rollback y
  **residuo 0 verificado por conteo** en cada uno.
- **Aparato:** cero dedos, cero emuladores; `adb devices` vacío al cerrar.
- **Árbol limpio sobre `origin/main` (`ea798ce5`). Último hash de la pista:
  `fad01654`.** La veda y el publish son de A.
