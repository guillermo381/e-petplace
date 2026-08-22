# PLAN_MESA_104.md — e-PetPlace · DeUna + cobro recurrente + páginas legales

> **Mesa:** 104 (Claude Web) · **Abre:** 21-ago-2026 · **Autor:** la mesa.
> **Precedencia:** el repo y su bitácora ganan sobre este plan. La pista A lo
> deposita en `docs/` y abre la bitácora con el número que la bitácora asigne
> (**S101-D y S102 no se renumeran**; las sesiones nuevas toman el siguiente).
> **Rige entero:** `CLAUDE.md` · `CONTRATO_TRABAJO` (76·80·82·84·85) ·
> `METODO_TRES_PISTAS` · `LETRA_MOTOR_PAGOS_S101` v1.4 · `LETRA_PUERTA_DE_PAGO_S101B` ·
> `LETRA_PAGO_CITAS` v1.1 · `LETRA_SALDO` v1.1 · `LETRA_DEUNA` v1.1 ·
> `LETRA_COBRO_RECURRENTE` v1.1 · `POLITICAS` · `MODELO_NOTIFICACIONES` ·
> las leyes de instrumento del brief de cierre de la mesa 103 (§2).

---

## §0 · LO QUE CAMBIÓ DESDE EL BRIEF

1. **Las credenciales QA de DeUna LLEGARON** (comercio SATORI INOV LATAM S.A.S.,
   api-key + api-secret). ⇒ El Frente 2 deja de estar bloqueado y `LETRA_DEUNA`
   §13 manda: **censo contra QA primero, cada afirmación del §2 re-verificada.**
   Las credenciales viven **solo en secrets de Edge Functions** (`DEUNA_API_KEY`,
   `DEUNA_API_SECRET`, ambiente `qa`). Jamás en el repo, jamás en `.env`
   commiteable, jamás en logs, jamás en la bitácora. El founder las carga; la
   pista verifica que existen sin leerlas.
2. **El founder suma un tercer entregable: las páginas estáticas legales.**
   Esto toca **D-405**. Regla de esta mesa: se construye la **superficie**
   (rutas, páginas, enchufe desde «Ayuda y legales» de la app); el **contenido**
   se publica con el texto que ya exista como letra de la casa y marcado con su
   estado real. **Se publica lo incompleto, jamás lo falso.** La mesa no redacta
   materia legal nueva; lo que falte queda declarado con dueño (abogado).
3. **Cuatro pistas**, no tres. Los territorios del método se respetan y la
   cuarta nace sobre un repo que hoy no tiene dueño: el sitio público.

## §1 · TERRITORIOS DE ESTA MESA

| pista | territorio | frente |
|---|---|---|
| **A** (conductora) | `main` · DB (migraciones/RPC) · `packages/api` · `packages/domain` · `docs/` · merge y publish | **Cobro recurrente** (motor + cron + avisos) · tanda S102 pendiente · actas |
| **B** | `packages/ui` · tokens · lint y jueces · **repo del sitio público `www.epetplace.com`** | **Páginas legales estáticas** + jueces que las otras necesiten |
| **C** | `apps/cliente` · `apps/prestador` | **Superficies**: fila «Deuna» + pantalla del código · pantalla de la serie recurrente · enchufe «Ayuda y legales» |
| **D** | **Edge functions de pago** (`supabase/functions/pagos-*`) · buzón DeUna · generador de referencia corta | **DeUna** (riel completo, contra QA) |

Reglas de frontera que evitan el choque que S84 vio tres veces:
- **El motor y su wrapper son un solo contrato:** la migración de DeUna (fila
  del medio · columnas de proveedor · UNIQUE del candado · tabla de referencia)
  la **escribe D y la deposita A** — D redacta, A numera al depositar (L-331).
  Lo mismo para la serie recurrente: la escribe A.
- **C no inventa contratos:** consume lo que A y D declaren en la puerta
  (`pagos-cobro` o hermana). Mientras no exista, C trabaja contra el contrato
  de la letra y marca el enchufe como pendiente con nombre.
- **B no escribe texto legal:** transcribe. Si no hay texto, la página dice
  «en preparación» con fecha y nada más.
- Worktree por pista, commit por pathspec, una app por commit (76 f2).
  **Nadie publica salvo A.**

## §2 · ORDEN DE TANDAS

### Tanda 0 — CENSOS (las cuatro, en el mismo turno, sin escribir código)

Cada medición con su control declarado (L-330). El reporte es crudo.

- **A · recurrente:** (1) la pantalla de despensa «que llegue solo»: **texto
  literal**, frecuencias ofrecidas, qué botón hay y a qué llama hoy
  (`LETRA_RECORRIDO_DESPENSA_S96` §6.1 y D-778 son el piso); (2) objetos de
  suscripción/serie en la base, si existen; (3) crones vivos y el precedente de
  hora declarada del barrido; (4) canal que `MODELO_NOTIFICACIONES` ya tiene
  para avisos de cobro; (5) **estado real de la tanda de S102** (firmada, sin
  aplicar, snapshot vencido) y **acta del gate S101-D** (③ y ⑥: ¿hay
  veredicto?). Contraste de divergencias pantalla ↔ letra, una por fila.
- **D · DeUna:** contra `apis-merchant.qa.deunalab.com` con las credenciales en
  secrets: (1) `payment/request` con `qrType:"dynamic"`, `format:"5"`, monto
  de prueba, referencia <20 — ¿devuelve `transactionId` + `numericCode` + QR +
  deeplink? (2) `payment/info` por `idType 0` y `1` — estados reales; (3) qué
  pasa al regenerar (pregunta §12.6 — **se mide, no se pregunta**); (4) refund
  mismo día sobre una transacción QA aprobada si el ambiente lo permite
  (§12.5); (5) cómo se registra el webhook y sus headers (§12.3 — si es portal
  del comercio, el founder lo hace). Cada afirmación del §2 de la letra sale
  con ✅ verificada / ❌ falsa / ⚪ no medible en QA. **Lo no medible se pregunta
  a `support@deunamerchant.zendesk.com`** con la lista §12 depurada.
- **C · superficies:** (1) la hoja «Cómo quieres pagar» hoy: qué filas, qué
  componente, cómo entra un medio nuevo; (2) la pantalla de espera con voz:
  dónde vive, cómo se inyectan voces por estado; (3) «Ayuda y legales»
  (D-336): qué hay, a qué apunta; (4) la pantalla de la serie recurrente del
  lado cliente (comparte el censo de A, pero C mide **componentes y rutas**, A
  mide **promesa y datos**).
- **B · sitio y legales:** (1) el repo del sitio público: stack, rutas, cómo se
  despliega a Vercel, si hay layout de página de texto; (2) **inventario del
  texto legal que existe en la casa**: T&C (borrador S80-S101 — dónde está,
  versión, qué secciones tienen firma), P20 custodia, aviso de IA, privacidad;
  (3) qué exige Play/App Store como URL pública (privacidad es obligatoria
  para la ficha de tienda); (4) estado de §9.2 de T&C (suspendido por Nuvei —
  se deja declarado).

**Checkpoint 1:** los cuatro censos en la mesa. La mesa contrasta, corrige
letra si una promesa viva difiere, y **el founder autoriza la tanda 1**.

### Tanda 1 — MIGRACIONES SIN APLICAR + puertas

- **A:** objeto de la serie (autorización guardada: quién, cuándo, medio,
  cadencia, monto esperado) · candado de idempotencia **por período** (UNIQUE de
  base) · puntero de `pagos_intentos` al sujeto «período de serie» honrando el
  invariante «exactamente uno» · reversa escrita antes · guard de snapshot bajo
  veda. Cron (hora declarada) + puerta server-side con `pagador_user_id`
  explícito y las compuertas E3 enteras.
- **D:** migración DeUna (fila del medio · `proveedor='deuna'` · persistencia
  de `transactionId`/`transferNumber`/`transactionReverseId` · tabla de
  referencia corta con UNIQUE · UNIQUE (proveedor, transactionId, sujeto)) ·
  edge `pagos-deuna-solicitud` (crea intento → `payment/request` → persiste →
  devuelve código + vencimiento) · buzón `pagos-deuna-webhook` con **secreto
  propio en header + consulta activa obligatoria antes de alimentar al
  actuador** (§7, dos capas). Registro crudo con cédula **solo en el buzón**,
  jamás en logs (§9).
- **C:** fila «Deuna» en la hoja · pantalla del código de 6 dígitos (grande,
  cuenta regresiva de 3 min fijos, «Generar un código nuevo» mientras el hold
  viva) · voces de la tabla §6 de `LETRA_DEUNA` · pantalla de la serie
  recurrente con la verdad completa de §2 de su letra (qué, cuándo, a qué
  medio, **cómo se corta**: un botón, sin soporte). Todo en TUTEO.
- **B:** rutas `/terminos`, `/privacidad`, `/custodia` (P20), `/aviso-ia` y el
  índice `/legales` en el sitio público, con layout de lectura (DIRECCION_ARTE
  rige: tipografía, tinta, sin adornos). Contenido: el que exista, con
  **versión y fecha visibles**, y una franja honesta cuando el texto sea
  borrador. Página de privacidad: si no hay texto, **no se publica como
  política** — se publica «en preparación» + contacto.

### Tanda 2 — AVISOS + ARNÉS CAMINO REAL

- **A:** aviso 48 h (informa, no pide permiso; monto = monto del cobro) · aviso
  día 0 de fallo · reintentos días 1-2 · pausa día 3 sin deuda hacia atrás ·
  salto de entrega por falta de stock (§7: **jamás sustitución**). Arnés:
  **una serie que cobra sola + una que falla a propósito y recorre los tres
  días hasta la pausa.** Sin ese caso, §6 no está probada.
  🔴 La voz por causa (§6) queda **con voz genérica declarada** hasta la tabla
  `status_detail` de Erick — se construye el cajón, no se adivina la etiqueta.
- **D:** arnés camino real contra QA: la familia elige Deuna, ve el código,
  paga en la app Deuna QA, la pantalla pasa sola a pagada, llega el
  comprobante con `transactionId` + `transferNumber`. El discriminador es
  **la verdad verificada por `payment/info`**, no el webhook. Barrido que gana
  los intentos `deuna` pendientes dentro de 7 días; `huerfano_deuna_vencido`
  con nombre.
- **C:** enchufe «Ayuda y legales» → las URLs públicas de B (WebView o
  navegador, lo que el censo diga) · pantallas contra las puertas reales.
- **B:** jueces: un verificador de que cada página legal declara versión y
  fecha, y de que ninguna URL del enchufe de C devuelve 404.

### Tanda 3 — GATES FOUNDER (en el aparato, por paso)

Code corre todo en el teléfono del founder antes de convocarlo. Veredicto
textual por paso, captura si difiere. Orden sugerido de gates: **DeUna** (el
que más depende de QA) → **serie recurrente** (alta, aviso, pausa) →
**páginas legales** (en el teléfono y en escritorio).

## §3 · LO QUE NO HACE ESTA MESA

No aplica la tanda de S102 sin autorización explícita del founder (se re-mide
bajo veda declarando hora cuando él lo pida) · no toca producción · no escribe
la letra financiera v3.0 en las pistas (es de la mesa, después) · no redacta
privacidad ni T&C nuevos (D-405) · no construye recurrencia sobre DeUna (§8 de
su letra: es push) · no decide §9.2 de T&C (espera a Nuvei) · no renumera.

## §4 · PROMPTS DE APERTURA (uno por pista — citan, no repiten)

**Pista A**
> Sos la pista A de la mesa 104 (conductora). Leé `CLAUDE.md`,
> `METODO_TRES_PISTAS`, `LETRA_COBRO_RECURRENTE` v1.1, `LETRA_MOTOR_PAGOS_S101`
> v1.4, `LETRA_PAGO_CITAS` v1.1 y `PLAN_MESA_104.md`. Depositá el plan en
> `docs/` y abrí la bitácora con el número que corresponda. Ejecutá la **tanda
> 0** de A del plan (§2): censo de la pantalla de despensa recurrente (texto
> literal), objetos de serie en la base, crones, canal de avisos, estado real
> de la tanda S102 y acta del gate S101-D. Cada medición con su control
> declarado (L-330). No escribas código ni migraciones hasta que la mesa
> autorice la tanda 1. Reportá crudo.

**Pista D**
> Sos la pista D de la mesa 104: el riel DeUna. Leé `LETRA_DEUNA` v1.1 entera,
> `LETRA_MOTOR_PAGOS_S101` v1.4 (§7 voces, el buzón de Nuvei como patrón),
> `PLAN_MESA_104.md` y el código de `pagos-cobro` y del webhook de Nuvei.
> Verificá que existen los secrets `DEUNA_API_KEY` / `DEUNA_API_SECRET` sin
> imprimirlos. Ejecutá la **tanda 0** de D: cada afirmación del §2 de la letra
> contra el ambiente QA, con ✅/❌/⚪ y el control que corriste. Medí la
> regeneración de código y el refund si QA lo permite. Lo no medible va a una
> lista de preguntas para soporte DeUna. Ninguna edge function hasta que la
> mesa autorice la tanda 1. Las migraciones que redactes viajan **sin número**
> a A.

**Pista C**
> Sos la pista C de la mesa 104: las superficies. Leé `LETRA_PUERTA_DE_PAGO_S101B`,
> `LETRA_DEUNA` §5-§6, `LETRA_COBRO_RECURRENTE` §2-§3, `DIRECCION_ARTE`,
> `DIRECCION_DISENO_S99` y `PLAN_MESA_104.md`. Ejecutá la **tanda 0** de C:
> hoja «Cómo quieres pagar», pantalla de espera con voz, «Ayuda y legales»
> (D-336), pantalla de la serie recurrente (componentes y rutas). Toda voz nueva
> en tuteo neutro. No construyas hasta la tanda 1; cuando construyas, consumí
> los contratos que A y D declaren — jamás inventes uno.

**Pista B**
> Sos la pista B de la mesa 104: páginas legales y jueces. Leé
> `PLAN_MESA_104.md` §1-§2, `DIRECCION_ARTE`, la ficha D-405 y el repo del
> sitio `www.epetplace.com`. Ejecutá la **tanda 0** de B: stack y despliegue del
> sitio, inventario del texto legal existente (T&C, P20, aviso de IA,
> privacidad) con versión y estado, y qué URL exige la tienda. No redactes
> texto legal: transcribís lo que existe y declarás lo que falta. Construcción
> recién en tanda 1.

---

*La mesa 104 hereda un motor que cobra solo y dos letras que rigen sin
pendientes. Su trabajo: que DeUna entre contra QA de verdad, que la serie
recurrente nazca sobre la promesa que la pantalla ya hizo, y que las legales
tengan dirección pública honesta. El founder firma cada gate con el ojo.*

---

## Nota de depósito (pista A, **22-ago-2026, 08:42 -05**)

> **La fecha del depósito no es la del plan, y se declara:** la mesa fechó este
> plan el **21-ago**; la pista lo deposita el **22-ago por la mañana**. *Un
> documento que hereda en silencio la fecha de su autor deja de poder decir
> cuánto tardó en llegar al repo.*

**Depositado VERBATIM. Ninguna coma del plan se editó** — el plan es de la
mesa, no de la pista. Lo único que la pista agrega es esta nota, con **lo que
el plan delegó explícitamente a la bitácora**:

### ① EL NÚMERO DE SESIÓN — medido, no elegido

El plan dice: *«abrí la bitácora con el número que la bitácora asigne (S101-D y
S102 no se renumeran; las sesiones nuevas toman el siguiente)»*. **Medido
contra el objeto** (jamás contra el canon de `CLAUDE.md`, que es derivado):

| medición | comando | resultado |
|---|---|---|
| bitácoras existentes | `ls docs/loop/` | la más alta es **`S102.md`** (antes: `S101-A` · `S101-B` · `S101-D`) |
| ¿existe S103? | `ls docs/loop/ \| grep -i s103` | **vacío** |
| ¿rama S103? | `git branch -a \| grep -i s103` | **vacío** |
| ¿acta S103? | `ls docs/actas/ \| grep -i s103` | **vacío** |

> **Control positivo declarado y CORRIDO (L-330):** el mismo `grep -i` con
> `s102` sobre los tres devuelve `S102.md` · `pista/s102-b` (+ su remoto) · y
> **nada** en actas — S102 cerró sin acta, en estado declarado, que es lo que su
> propia bitácora dice. *Un grep que devuelve vacío tres veces seguidas es
> sospechoso antes que tranquilizador; el control prueba que el instrumento ve
> lo que existe.*
>
> **⚠️ Y LA VENTANA EN QUE ESTA MEDICIÓN VALE, declarada porque ya se cerró:**
> las cuatro filas se midieron **ANTES de crear el worktree de A**. Corrido
> **después**, `git branch -a | grep -i s103` devuelve **`pista/s103-a`** — la
> mía. *No invalida nada: el número estaba libre cuando se eligió.* Queda
> escrito porque es el mismo caso que S101-D registró con `L-999` — **el acto de
> medir puede crear el objeto que se medía**, y quien re-corra este grep mañana
> va a encontrar una rama y no tiene por qué adivinar de dónde salió.

**⇒ Esta mesa es la sesión `S103`.** Las cuatro pistas escriben
`docs/loop/S103-A.md` · `S103-B.md` · `S103-C.md` · `S103-D.md`.
**«104» es numeración de MESAS del founder y no entra al repo** — mismo
precedente que la mesa 103, cuya sesión de la plata fue `S102`.

### ② WORKTREE DE A — la primera decisión (regla 85)

`/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s103-a` · rama
`pista/s103-a` · nacida de `main` en **`17b0ff3c`**.

**Las TRES piezas del arranque, medidas y no deducidas** (la tercera **POR
APP**, corrección de S102-B — `L-332`, superficie equivocada):

| pieza | estado | qué se hizo |
|---|---|---|
| `node_modules` | ausente | **no se instala** — la tanda 0 es lectura de DB y `grep`; no monta app ni corre typecheck |
| `supabase/.temp` | ausente | **copiada** — verificado que apunta a `zyltipqscdsdsxnjclhp` |
| `apps/cliente/.env.local` · `apps/prestador/.env.local` | ausentes | **copiados los dos** (9 y 6 líneas). La raíz **no** tiene `.env.local`, y ése es exactamente el dato que hizo falsa la fila de S102-B |

**Por qué A abre worktree y no trabaja en el primario:** `METODO_TRES_PISTAS`
§S91-③ — *una pista sin worktree envenena la ventana de todas*. `main` queda
limpio para que cualquier publish salga con ancla sin asterisco; A mergea a
demanda desde su rama con `--no-ff` (regla 86).
