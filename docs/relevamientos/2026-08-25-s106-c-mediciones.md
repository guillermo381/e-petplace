# S106-C · MEDICIONES DEL PRIMER TURNO — TELEMEDICINA en `apps/cliente` y `apps/prestador`

> **Pista:** C · **Fecha:** 25-ago-2026 · **Rama:** `pista/s106-c` ·
> **Base:** `main` en `09def031` (*merge: S105-A — cierre documental*).
> **Turno SIN CÓDIGO.** Cero archivos de app tocados, cero migraciones, cero SQL
> ejecutado. Todo lo de acá se midió **contra objetos del repo** (archivos y
> líneas citados), jamás contra memoria ni contra un reporte ajeno.
>
> **Instrumento:** `rg` sobre el worktree. **Todo censo que dio cero lleva su
> control positivo al lado** — un cero de instrumento roto se lee igual que un
> cero real (`L-321`). El primer intento de C-M1 salió vacío por un glob de zsh
> y se descartó por eso, no por su resultado.

---

## §0 · PASO ⓪ — lo verificado antes de medir

| | resultado | objeto |
|---|---|---|
| Worktree | creado en `../e-petplace-s106-c`, rama `pista/s106-c` | `git worktree list` |
| Árbol | **limpio** | `git status --porcelain` → vacío |
| Base | `09def031`, igual a `origin/main` | `git rev-list --left-right --count HEAD...origin/main` → `0 0` |
| Lecturas | `LETRA_TELEMEDICINA` (184 ln, **con su freno**) · `MODELO_VETERINARIA` camino (c) · `S105-A-ACTA-CIERRE` · `CLAUDE.md` | leídas enteras |

### 🔴 `node_modules` — la declaración del corolario de la regla 85

**No estoy enganchado al primario. Tampoco a lo mío: `pnpm install` NO corrió.**

```
apps/cliente/node_modules/@epetplace/ui    → NO EXISTE
apps/prestador/node_modules/@epetplace/ui  → NO EXISTE
node_modules/ (raíz del worktree)          → NO EXISTE
```

**Control, para saber qué debería ver después de instalar** — los worktrees
hermanos que sí instalaron resuelven a *su propio* `packages/ui`:

```
e-petplace-s105-c → .../e-petplace-s105-c/packages/ui      ✅ aislado
e-petplace-s104-c → .../e-petplace-s104-c/packages/ui      ✅ aislado
e-petplace        → .../e-petplace/packages/ui             (primario)
```

⇒ **`pnpm install` es precondición de la tanda 1, y la medición se REPITE
después de instalar** — hoy la pregunta «¿estoy enganchado al primario?» no
tiene respuesta verdadera, tiene una respuesta vacía. Metro siempre con
`--clear`.

---

## §1 · C-M1 — quién nombra telemedicina hoy, y dónde vive la voz honesta

**Control positivo** (`grooming`, oficio vivo): cliente 38 archivos · prestador
41 · ui 16 · api 27. El instrumento imprime.

**Medición** (`telemedicina|teleconsulta|videollamada|videoconsulta`):

| territorio | archivos | qué es |
|---|---|---|
| `apps/cliente` | 5 | **solo «próximamente» + vocabulario**; ninguna superficie propia |
| `apps/prestador` | 5 | **el wizard, y ahí está la voz honesta** |
| `packages/ui` | 2 | el glifo `telemedicina` en `Icono.tsx:1184` (registro `identidad`) |
| `packages/api` | 6 | mapeos del oficio + tipos generados |
| `packages/i18n` | **0** | — |
| `packages/domain` | **0** | — |

### ✅ LA VOZ HONESTA DEL CAMINO (c) EXISTE, y está donde la enmienda v1.2 la pidió

- **El texto:** `apps/prestador/src/i18n/es.ts:2151`
  → *«Configúrala ahora — las familias la verán cuando la videollamada esté
  lista.»* · en `en.ts:1641`.
- **El montaje:** `apps/prestador/src/app/veterinaria/taller.tsx:617`, gateado
  por `esTele` (`:585`), **fuera** del `if (d.ofrecido)` ⇒ *se ve con el toggle
  en cualquier estado*, como dice su propio comentario (`:614-616`,
  «OBLIGATORIA»).

⇒ **`MODELO_VETERINARIA` §6 camino (c) está CUMPLIDO en la superficie.** No hay
nada que construir ahí. *Lo mido y lo digo para que nadie lo re-audite.*

### 🔴 Del lado del CLIENTE no hay voz honesta — hay una ausencia con un solo brazo

Ver §5, que es un choque y va en su sección.

---

## §2 · C-M2 — el camino REAL de reserva vet, archivo por archivo

**La cadena completa, medida:**

| # | archivo | qué hace | acto |
|---|---|---|---|
| 1 | `apps/cliente/src/app/(tabs)/explorar/veterinaria/index.tsx` (490 ln) | **EL CUÁNDO**: mascota → QUÉ → día → hora | pinta la grilla del QUÉ |
| 2 | `.../veterinaria/disponibles.tsx` (223 ln) | **EL QUIÉN** | el tap llama a ③ |
| 3 | `apps/cliente/src/lib/reserva/veterinaria.ts` **`crearHold` (`:73-125`)** | **acá NACE LA CITA** | `crearBloqueoAgenda(…)` `:77` → `router.push('/explorar/veterinaria/checkout', { citaId … })` `:103` |
| 4 | `.../veterinaria/checkout.tsx` (179 ln) | lo propio del vet (EL DÓNDE) | delega en ⑤ |
| 5 | `apps/cliente/src/components/checkout-reserva.tsx` **`pagar` (`:213-248`)** | **EL PAGO, motor S101** | `cobrar({ tipo: 'cita', id: citaId }, medio.idTarjeta)` `:238` |

**Dato que gobierna todo lo demás:** el CUÁNDO **no filtra por tipo** — lo dice
su propia cabecera (`index.tsx:20-22`): *«telemedicina/emergencia existen pero
reservable=false: el motor las deja fuera SOLO — la UI no filtra listas»*.
⇒ **si la plataforma pone `reservable=true`, telemedicina aparece en el QUÉ sin
tocar una línea del cliente.**

### 🔴 DÓNDE ENTRA EL AVISO §3 — hay dos puntos posibles y NO son equivalentes

| punto | archivo/línea | qué cuesta el escape («Ir a urgencias») |
|---|---|---|
| **(a) ANTES del hold** | `lib/reserva/veterinaria.ts`, antes de `:77` | **cero** — la cita todavía no existe |
| **(b) en el checkout, antes de pagar** | `checkout-reserva.tsx`, antes de `:213` | **quema un hold de 15 min** de la agenda del vet |

La letra dice *«antes de que el dueño **confirme**»*. En este motor la cita
**nace con el hold** (③), no con el pago — así que «confirmar» admite las dos
lecturas, y sólo una no le cobra a un tercero el gesto de irse a urgencias.

⚠️ **Además: `checkout-reserva.tsx` es la máquina COMPARTIDA de los cuatro
oficios.** Un aviso puesto ahí toca paseo, grooming y adiestramiento; en (a) el
cambio queda contenido en el flujo vet.

### 🔴 Y EL CONSENTIMIENTO REGISTRADO TIRA PARA EL LADO CONTRARIO

**Antes del hold NO EXISTE `cita_id`** — lo crea el hold (`:106`,
`citaId: r.data.cita_id`).

> **El aviso quiere ir ANTES del hold para no quemar agenda. Un consentimiento
> POR CITA sólo puede registrarse DESPUÉS del hold, porque antes no hay cita a
> la cual atarlo.**

*No es una objeción al pedido: es la forma real del terreno.* Sale gratis si
son dos actos (aviso en (a), consentimiento en el pago) y sale caro si se
asume que son uno.

---

## §3 · C-M3 — el destino de «Ir a urgencias»

**Lo que EXISTE del camino (b) urgencia solo-HOY, y está mejor de lo esperado:**

- Los dos tipos viven con voz: `urgenciaLocal` / `urgenciaDomicilio`
  (`apps/cliente/src/i18n/es.ts:826-827`).
- El CUÁNDO respeta solo-hoy: `esSoloHoy` (`index.tsx:168`), la tira de días
  **no se pinta** (`:400-404`).
- **Y ya existe un vacío honesto que dice casi lo que §3 quiere**
  (`es.ts:838`): *«Hoy no queda lugar para urgencias por la app. **Si es grave,
  contacta a tu veterinario directamente.**»* — y su comentario declara que
  urgencia sin lugar **no ofrece «probar mañana»** (`index.tsx:435-439`).

**Lo que FALTA, medido:**

🔴 **El CUÁNDO acepta UN solo parámetro: `mascotaId`** (`index.tsx:83`).
**No hay parámetro que preseleccione el QUÉ.** ⇒ hoy «Ir a urgencias» no puede
aterrizar con urgencia elegida; aterriza en el paso 1 y el dueño vuelve a
elegir. El costo de agregarlo es chico (un param + un preselect), pero **es
construcción, no un `href`**.

⚠️ **La pregunta que NO puedo contestar desde el repo, y decide si el botón
miente:** ¿hay hoy algún veterinario que ofrezca `urgencia_local`, activo y
cobrable? Si son cero, el botón lleva a un vacío honesto — que es digno, pero
**un botón rotulado «Ir a urgencias» que nunca tiene urgencias es una promesa**.
Va como pedido de SQL a la mesa (§7).

**No decido el destino.** Lo que la medición deja servido: el destino existe y
es honesto; le falta un parámetro y le falta saber si tiene oferta detrás.

---

## §4 · C-M4 — la habilitación del prestador y dónde entra la aceptación de §6

**Dónde vive la configuración:** `apps/prestador/src/app/veterinaria/taller.tsx`
(868 ln) — el wizard del oficio, con `MENU_VETERINARIA` y una tarjeta por
servicio.

**Cómo se «prende» un servicio HOY, en dos actos:**

1. **El toggle** — `Interruptor` (`taller.tsx:601-611`) → `actualizarItem(i,
   { ofrecido: v })`. Es **borrador local**, no persiste nada.
2. **El guardado único** — `guardarTodo()` (`:421`) recorre el menú y por cada
   ítem sucio llama
   **`guardarServicioVeterinaria({ …, tipoServicio: tipo, activo: d.ofrecido, … })`
   (`:431-441`)**.

⇒ **El acto exacto del «prende el servicio» de §8 es
`guardarServicioVeterinaria` con `tipoServicio === 'telemedicina'` y
`activo === true`.** Ahí, y no en el toggle, es donde el sistema se entera.

### ✅ LA PUERTA DEL CONSENTIMIENTO YA EXISTE Y ES LA CORRECTA — no hace falta inventar una

`packages/api/src/wrappers/auth.ts`:

```ts
:336  export type ActoConsentible = 'arbitraje' | 'dictado_voz';
:337  export type TipoRegistrable = DocumentoLegal | ActoConsentible;
:352  export async function registrarConsentimientos(userId, tipo, documentos)
```

Y `DocumentoAceptado.aceptado` (`:346-349`) **admite `false` como valor
legítimo** — *«el arbitraje se puede rechazar… el dictado se puede revocar»*.

⇒ **los mínimos de §6 son un `ActoConsentible` más.** Un valor nuevo en un tipo
que ya existe, escrito por la puerta única que la LEY DE PARIDAD ya puso en
`packages/api`. **Cero tabla nueva, cero mecanismo nuevo.**

### 🔴 PERO ESA PUERTA ESTÁ CONSTRUIDA Y NADIE LA HA ESCRITO NUNCA — y ya tiene ficha

**`D-897 ⑤`** (`DEUDAS_CANONICAS.md:20766`), 🔴 **bloqueante de apertura**, medido
el 24-ago: `consentimientos` tiene `registro` 60 · `terminos_parent` 2 ·
`privacidad` 2 · **cualquier fila de IA, voz o dictado: 0**. Y su diagnóstico es
literal: *«el acto está previsto en el código (`ActoConsentible` contempla
`dictado_voz`) y ningún flujo lo escribe. **Motor sin puerta (`L-318`), en su
versión legal.»***

⇒ **La aceptación de §6 sería el SEGUNDO acto que monta una puerta que todavía
no se estrenó.** No es una objeción —es la puerta correcta— pero **quien la
cablee para telemedicina está estrenando el mecanismo**, y conviene que la mesa
lo sepa antes y no después.

---

## §5 · C-M5 — dónde vive «entrar a la videoconsulta» y el Durante

### El prestador — tiene las dos superficies, y son distintas

| pantalla | ln | qué es | qué recibiría |
|---|---|---|---|
| `veterinaria/cita/[citaId].tsx` | 451 | el detalle / ANTES. Destino del tap del HOY. **Read-only por diseño** (su cabecera lo dice) | **«Entrar a la videoconsulta»** |
| `veterinaria/consulta/[citaId].tsx` | 827 | **EL DURANTE clínico**, 4 fases (antes · dictado · confirmación · después) | **«marcar no realizable» (§5)** + la nota clínica de siempre |

**La nota clínica de §7 no necesita nada nuevo:** el Durante ya sedimenta por
`sedimentar_nota_clinica`, y el aviso de IA de T&C §14 ya rige sobre esa misma
pantalla. *La teleconsulta hereda esto sin tocarlo, que es exactamente lo que
§1 promete.*

### El cliente — no tiene detalle de UNA cita vet

`apps/cliente/src/app/citas/[mascotaId].tsx` (411 ln) está **keyed por
mascota**, no por cita: muestra la próxima activa y despliega las demás en la
misma pantalla (cabecera `:1-15`). ⇒ **«Entrar» del lado familia no tiene
pantalla propia**: vive como acción en esa fila, o pide superficie nueva. *Es
decisión de producto, no la tomo.*

### ☠️ VENCIDO EL 26-AGO — LEER ESTO ANTES QUE LO DE ABAJO

> **El hallazgo que sigue era correcto cuando se midió y HOY YA NO RIGE.** No se
> borra —la medición fue verdadera— **se marca**, que es la regla de la casa.
>
> **Qué cambió:** el abogado se pronunció
> (`docs/legal/2026-08-25-receta-videoconsulta.md`): **el veterinario SÍ puede
> recetar en videoconsulta** — REV telemática (AGROCALIDAD Res. 0227/2024,
> Anexo 9) + firma electrónica (Ley 67, Arts. 2 y 14). El §9 de la letra
> condicionaba la exclusión a *«hasta que el abogado se pronuncie»*, **y se
> pronunció**.
>
> ⇒ **Que la receta se herede en el Durante sin mirar el tipo de servicio es la
> CONDUCTA CORRECTA, no un defecto.** La mesa lo firmó así (S106 tanda 1: *«la
> receta queda, cero obra»*) y lo registró.
>
> **Lo único que sobrevive de abajo es la medición de forma** —los dos montajes
> y sus gates, que siguen siendo exactos— y **una consecuencia NUEVA que sí es
> trabajo**: el Límite 1 del abogado exige diagnóstico obligatorio *«del
> sistema»*, y hay **dos productores de medicación**, no uno. Eso vive en
> `docs/loop/S106-C.md` y es pedido a **A**.

### ~~🔴 EL HALLAZGO DE ESTA MEDICIÓN — la exclusión de §9 NO se cumple sola~~ *(vencido, ver arriba)*

**§9 deja fuera de v1 la «receta a distancia (hasta que el abogado se
pronuncie)».** Medido:

- `RecetaDeLaConsulta` está montada **en las dos** pantallas vet:
  `consulta/[citaId].tsx:805` (gate: `mascotaId ?`) y
  `cita/[citaId].tsx:342` (gate: `cita.mascota && puedeAtender`).
- **Ninguno de los dos gates mira el tipo de servicio.**
  Medición con control:
  `rg -c "citaId" consulta/[citaId].tsx` → **10** (el instrumento imprime)
  `rg -c "tipoServicio|tipo_servicio|servicioNombre" consulta/[citaId].tsx` → **0**
  *Cero real, no cero de instrumento.*

> ### Si la teleconsulta hereda el Durante vet —que es lo que §1 pide— **la receta aparece sola.**
> *No hay que construir la receta a distancia para que exista: hay que
> construir su ausencia para que no exista.* Es el inverso del hueco de
> siempre: acá **no hacer nada es lo que rompe la letra.**

⚠️ Y su hermano, que la letra no menciona: el **certificado** se emite desde la
misma tarjeta (`consulta:806-812`, `cita:349+`). **La letra no dice si un
certificado de salud puede emitirse por teleconsulta.** Lo reporto como
pregunta abierta, no como hallazgo.

---

## §6 · 🔴 CHOQUES CONTRA LETRA — frené y aviso

### ① TRES interruptores para el mismo oficio, y ninguno declara a los otros

| # | interruptor | dónde | estado medido |
|---|---|---|---|
| 1 | `tipos_servicio.reservable` | plataforma | ✅ **el que la letra manda.** El motor lo respeta: `servicio_no_reservable` en `20260717210000…:426` y 4 migraciones más; tipado en `agendamiento.ts:48` y `veterinaria-reserva.ts:31` |
| 2 | `country_config.telemedicine` | país | 🔴 **un solo brazo** (abajo) |
| 3 | `prestadores.acepta_telemedicina` | **negocio** | 🔴 **contradice la letra** (abajo) |

**② tiene un solo brazo, y el que falta es el de encender.** Medido en todo el
repo — un consumidor, una línea:

```
apps/cliente/.../explorar/index.tsx:107
  if (!servicios.telemedicine) proximamente.push({ … })
```

**Control** con un oficio vivo: `servicios.walking` (`:91`) empuja a
`fichasActivas` **con ruta**. Telemedicina **no tiene rama de encendido en
ninguna parte**.

> **Poner `country_config.telemedicine = true` hoy no abre la telemedicina: la
> hace DESAPARECER de «próximamente» y no la pone en ningún lado.** Un
> interruptor que sólo sabe apagar se siente encendido — §0 del plan de mesa,
> en carne.

**③ contradice a `MODELO_VETERINARIA` §6, que dice literal: «el switch es de
plataforma (`tipos_servicio.reservable`), **no del negocio**».** Y sin embargo:

- `prestadores.acepta_telemedicina` existe, nace `false`
  (`20260727200000…:159`, `COALESCE(p_acepta_telemedicina, false)`),
- **y VIAJA en la vista pública al cliente** (`20260802220000_s84_zona_aproximada.sql:106`,
  `20260808100000_s91a_vista_publica_ensanche.sql`),
- **con CERO lectores en `apps` y `packages`** (control: `prestador_servicios`
  da 132 archivos; éste, ninguno fuera de los tipos generados).

*Es inerte, y por eso nadie lo notó. Pero está ahí, en la vista pública, con el
nombre exacto de la decisión que la letra le prohíbe tomar.*

### ② `cita_telemedicina_detalle` — una tabla que ya existe y no la usa nadie

`packages/api/src/database.types.ts:3183` declara la tabla con FKs a cita,
mascota, pet parent y prestador. **Consumidores fuera de los tipos generados:
CERO** (apps, packages y `supabase/` — control positivo pasado). **Ninguna
migración del monorepo la crea** ⇒ es del portal legado.

🔴 **Va a la mesa antes de que nadie escriba una migración de telemedicina:**
*el peor resultado posible sigue siendo crear una tabla al lado de una que ya
existe* (B0.5, `MODELO_DESPENSA`). **Su censo es de la A; yo sólo lo señalo.**

### ③ El plan de mesa dice que esta mesa NO construye telemedicina

`PLAN_MESA_106.md` §2 Frente 3: *«**Son letras, no código.** … Ninguna se
construye en esta mesa: se **escriben**»*, y §4: *«**No construye telemedicina**,
adopción ni guardería — las escribe»*; §5.4 las manda *«en paralelo y en la
mesa, **no en las pistas**»*. Sus cuatro mediciones de §1 son todas de
DeUna/Nuvei/WhatsApp — **ninguna de telemedicina**.

**Mi lectura, y por eso avanzo en vez de frenar del todo:** ese paso ya se
cumplió — `LETRA_TELEMEDICINA` v1.0 **nació hoy**, después del plan. Pasar de
«escribirla» a «medir para construirla» es progresión legítima. **Pero es un
cambio de alcance contra un objeto depositado, y lo digo en vez de asumirlo.**

### ④ 🔴 «El abogado exigió consentimiento por cita» — NO lo pude verificar

Mi encargo lo afirma como hecho. **La letra lo tiene como PREGUNTA ABIERTA**:

> `LETRA_TELEMEDICINA` §10, *«AL ABOGADO, **ANTES DE QUE LLEGUE A UNA
> PANTALLA**»*: **2. ¿El aviso de §3 alcanza como deslinde, o hace falta
> consentimiento expreso registrado?**

Barrido en `docs/` cruzando «abogado» con telemedicina/consentimiento: **las
únicas líneas son las de la propia letra**. **No hay respuesta del abogado
depositada en el repo.**

⇒ **No lo trato como firmado.** Si el abogado respondió hoy, la respuesta vive
fuera del repo y **la mesa la deposita**; si no, el consentimiento **no se
construye todavía** y §10 lo dice con todas las letras. *El texto del aviso §3
sí está firmado verbatim — eso se puede construir; lo que no está resuelto es
si además viaja un consentimiento.*

### ⑤ El freno de depósito de la letra sigue vivo (no es mío, lo transporto)

`LETRA_SALDO` §3 es **lista cerrada** con **≥24 h** para cancelación de cita;
§4 de esta letra dice **30 minutos** para el mismo objeto. **Toca mi
territorio** el día que una pantalla del cliente tenga que decirle a la familia
hasta cuándo puede cancelar: **hoy no hay una ventana, hay dos.** No construyo
esa voz hasta que la mesa firme.

---

## §7 · PEDIDOS DE SQL A LA MESA (76b) — texto completo, la DB la corre A

Los tres son **solo lectura** y ninguno decide nada por sí mismo.

```sql
-- ① ¿El botón «Ir a urgencias» tiene algo detrás? (decide si §3 miente)
SELECT ts.codigo,
       count(*) FILTER (WHERE ps.activo)                        AS ofertas_activas,
       count(DISTINCT ps.prestador_id) FILTER (WHERE ps.activo) AS negocios
FROM   tipos_servicio ts
LEFT   JOIN prestador_servicios ps ON ps.tipo_servicio = ts.codigo
WHERE  ts.codigo IN ('urgencia_local','urgencia_domicilio','telemedicina','consulta')
GROUP  BY ts.codigo
ORDER  BY ts.codigo;

-- ② El estado REAL de los tres interruptores (§6 ①)
SELECT codigo, reservable, reserva_solo_hoy, es_medico, activo
FROM   tipos_servicio
WHERE  codigo IN ('telemedicina','urgencia_local','urgencia_domicilio');

SELECT count(*) AS prestadores,
       count(*) FILTER (WHERE acepta_telemedicina) AS con_flag_true
FROM   prestadores;

SELECT country_code, servicios_activos
FROM   country_config;   -- ver si la clave 'telemedicine' existe y su valor

-- ③ ¿`cita_telemedicina_detalle` es legado muerto? (§6 ②)
SELECT count(*) AS filas FROM cita_telemedicina_detalle;
SELECT c.conname, pg_get_constraintdef(c.oid)
FROM   pg_constraint c
WHERE  c.confrelid = 'public.cita_telemedicina_detalle'::regclass;  -- quién la referencia
```

---

## §8 · PROPUESTA DE TERRITORIO PARA LA TANDA 1 (76h)

**Precondición innegociable:** `pnpm install` en el worktree + **re-medir** el
enganche de `node_modules` (§0). Metro con `--clear`.

**Lo que propongo construir, y es DELIBERADAMENTE poco:** sólo lo que tiene
letra firmada verbatim y no depende del abogado, del transporte de video ni de
una firma de ventana.

### Archivos que reclamo — `apps/cliente`

| archivo | qué |
|---|---|
| `src/lib/reserva/veterinaria.ts` | el aviso §3 **antes** de `crearHold` (punto (a)) — el escape no quema agenda |
| `src/app/(tabs)/explorar/veterinaria/index.tsx` | el param que preselecciona el QUÉ, para que «Ir a urgencias» aterrice |
| `src/i18n/es.ts` · `src/i18n/en.ts` | las keys del aviso §3 **verbatim**, sin resumir (la letra lo prohíbe explícitamente) |
| `src/app/(tabs)/explorar/index.tsx` | **sólo si la mesa lo firma**: el brazo de encendido que le falta al flag de país |

### Archivos que reclamo — `apps/prestador`

| archivo | qué |
|---|---|
| `src/app/veterinaria/taller.tsx` | los mínimos de §6 en el acto de prender |
| `src/i18n/es.ts` · `src/i18n/en.ts` | las keys de §6 |

### Lo que NO reclamo, y por qué

- **`packages/api`** — el `ActoConsentible` nuevo es de quien tenga ese
  territorio. **Lo pido, no lo escribo.**
- **`components/checkout-reserva.tsx`** — máquina compartida de los cuatro
  oficios: si el aviso va en (b), el cambio deja de ser vet.
- **Todo lo de video** — §9: módulo nativo, tren de build de la mesa. **Línea
  roja.**
- **La receta gateada por tipo** (§5) — es la cura de un choque; **la firma la
  mesa**, porque decidir que la receta no se emite por teleconsulta es
  producto, no refactor.
- **Lo abierto de S105**: deploy `pagos-web`, guard del IVA, puerta de retomar,
  las siete piezas del acta §②. Congelado por el encargo.

---

## §9 · LO QUE NO MEDÍ, DECLARADO

- **La base viva.** Todo lo de acá salió de archivos del repo. Los tres censos
  de §7 **no se corrieron** — son de la A.
- **Nada en dispositivo.** Sin `pnpm install` no hay Metro, y sin Metro no hay
  pantalla.
- **Si el abogado respondió hoy** (§6 ④) — no está en el repo y no lo invento.
