# S107-A · ACTA DE TRASPASO — la conducción, medida al 29-ago-2026

> # ⏭️ ESTE DOCUMENTO ES LA FOTO DE LA MAÑANA. **EL ESTADO VIVO ESTÁ EN
> # `docs/loop/S107-A-TRASPASO-2.md`.**
> Se conserva por su §⑤ y §⑥ (las trampas y las lecciones, que siguen
> rigiendo) y por sus enmiendas — **no por su cola, que está vencida.**


> ## ✏️ MARCA DE ENMIENDA — LA A QUE RETOMÓ YA EJECUTÓ EL PUNTO 2
> *(depositada por la A siguiente, con el aparato y la base a la vista.)*
>
> **`main` = `6a10fb5c`.** **El merge de C está hecho, verificado y publicado**
> — 4 typechecks en 0 · `verify:diseno` VERDE con 60 reglas · OTA prestador
> group `df533f43-b297-4b13-bdb7-586ece4f34f3` (runtime 1.0.7) y OTA cliente
> group `2d999b9e-387b-4de7-9ed7-437ac138f672` (runtime 1.0.6), **los dos con
> ancla `6a10fb5c`** y `verify-ota` VERDE (los dos con `--binario-local`
> declarado: **ni 1.0.7 ni 1.0.6 tienen build registrada en EAS**).
>
> 🔴 **Y ESTA ACTA SE EQUIVOCABA EN DOS COSAS QUE HABRÍAN ROTO LA PANTALLA.**
> Se corrigen abajo **en su lugar, con lo viejo tachado y no borrado** — el
> precedente de la casa: *un documento vencido se marca donde se lee, porque
> quien lo abra mañana no va a poder medirlo.*
>
> **Lo que SIGUE vivo de esta acta:** el punto 3 (la build de nube), toda la
> §⑤ (las trampas que no se ven en el código) y toda la §⑥.

> **Para quién:** la A que retome. **Se lee ANTES de tocar nada.** Todo lo que
> dice está medido contra el objeto; lo que es decisión lleva su firma.
> **`main` al cerrar: `6e1598e8`** · **último OTA de prestador: group
> `d3649aa9-c532-4d94-ad63-d99ebc60cfe6`** (android `01a04b6b`, ancla
> `6e1598e8`, runtime **1.0.7**, `verify-ota` VERDE).

---

# 🔴 QUÉ HACER APENAS ARRANQUES — tres cosas, en este orden

**1 · PREGUNTALE AL FOUNDER EL ESTADO. No asumas esta cola.**
> En esta sesión **la cola circulante quedó vencida DOS VECES y se trabajó
> contra ella**: se pidieron cosas que ya estaban hechas (`obtenerEstadiasDelDia`
> ya existía cuando volvieron a pedirlo; ⑤ estaba aplicado entero cuando la lista
> todavía lo daba por empezar). **Este documento envejece igual que aquélla** —
> es una foto del 29-ago, no un estado vivo. *Un acta dice lo que pasó; sólo el
> founder dice lo que sigue.*
>
> ✏️ **NOTA AL PIE — esta advertencia se cobró en el PRIMER MINUTO de la A que
> retomó, y de una forma que conviene escribir porque no es obvia:**
>
> > **Medir la rama REMOTA no mide el trabajo de la pista.** La A nueva corrió
> > `git log origin/main..origin/pista/s107-c` y obtuvo **«cero commits fuera»**
> > — o sea, la medición dijo *«C ya está mergeada»* y contradijo a esta acta.
> > **Falso:** los cuatro commits de C **vivían sólo en el disco de su
> > worktree**, sin pushear. `origin/pista/s107-c` estaba viejo.
> >
> > *Un remoto no es el estado de una pista: es el último momento en que a
> > alguien se le ocurrió empujarlo.* ⇒ **el estado de una pista se mide contra
> > su worktree** (`git -C <worktree> rev-parse HEAD` + `status --porcelain`),
> > y lo primero que hace quien mergea es **respaldar esa rama en origin**
> > (L-217: *«todo en origin» y «todo en el canon» son dos afirmaciones
> > distintas* — acá faltaba la primera).

**2 · ~~EL MERGE DE C ES LO PRIMERO QUE SE CONSTRUYE.~~** ✅ **HECHO** — está en
`main` (`6a10fb5c`), con los cuatro sitios adaptados. Se conserva **el mapeo
CORREGIDO**, porque el que decía esta acta estaba mal en dos de cinco:

| prop vieja de C | qué pasa de verdad |
|---|---|
| `precioPaquete` | → **`precio`** |
| `rotuloTamano` | → **`rotulo`** |
| `elegido` | → **`encendido`** |
| `onElegir` | → **`onCambio`** *(firma nueva: recibe el booleano)* |
| `clave` | ☠️ **muere** — única que muere, con su lápida escrita en la pieza |
| **`campoPrecio`** | ✅ **VIVE** — `FichaDeOferta.tsx:202` |
| **`registro`** | ✅ **VIVE** — `FichaDeOferta.tsx:204` |

> 🔴 **ACÁ ESTABA EL ERROR, Y ERA CARO:** esta acta daba por muertas a
> ~~`registro`~~ y ~~`campoPrecio`~~. **Adaptar al pie de la lista habría
> borrado el `campoPrecio` de las TRES fichas del taller** —diario, paquetes y
> mensual— **y con él el `SliderPrecio` de cada una**: el prestador habría
> encendido una oferta y no habría tenido dónde ponerle precio. *Y no lo caza
> ningún typecheck: quitar una prop opcional compila perfecto.*
>
> ⇒ **Por eso la instrucción de leer la pieza ENTERA no era una formalidad.**
> La lápida de `clave` está escrita adentro del archivo, en el lugar donde
> vivía la prop; las otras dos siguen ahí, con su doc. *La lista de una acta es
> un recuerdo; el archivo es el contrato.*

🔴 **Y SI VOLVÉS A TOCAR ESA PANTALLA, LEÉ
`packages/ui/src/components/FichaDeOferta.tsx` ENTERA ANTES:** es la que el
founder camina, y una adaptación a ojo rompe en silencio lo que ningún
typecheck ve. *(El detalle del merge, en §②.)*

**3 · LA BUILD DE NUBE `1.0.7`, cuando resetee la cuota de EAS el 1-sep.** Es
**la que va a familias** y **la única que cierra las tres cadenas de permiso**,
hoy ABIERTAS. La local **no las cierra** y quedó reprobada por su guard.

---

## ⓪ LO PRIMERO, PORQUE SI NO SE SABE SE PIERDE UNA HORA

🔴 **El founder tiene un binario `1.0.7` que NO salió de EAS.** Medido: **12
builds en EAS, ninguna 1.0.7**. Lo cortó él por fuera y **los OTAs le llegan**.

⇒ **`verify-ota` va a dar ROJO en su chequeo ②** («ningún binario registrado en
EAS tiene este runtime») **y ese rojo es del instrumento, no del update.** Se
saltea con su escape declarado, que exige una nota:

```
node scripts/verify-ota.mjs --app prestador --update <id> \
  --binario-local "1.0.7 fuera de EAS, desplegado por el founder el 28-ago"
```

*El guard se enmendó el 29-ago para que diga **qué midió** en vez de concluir
«no le llega a nadie» — que era falso y costó una decisión.*

---

## ① EL ESTADO DE CADA PISTA

| pista | mergeado en `6e1598e8` | qué queda afuera | qué espera de A |
|---|---|---|---|
| **B** | ✅ **todo** (`17a2ee48` → `46e59173`): `SeccionPlegable`, el rename `FichaPaquete` → **`FichaDeOferta`**, `equivalenciaDePaquete`, dos pares de glifos nuevos | — | nada |
| **C** | ✅ **TODO** — `6a10fb5c` (los ~~6~~ **4** commits: `3fa1c4ae` · `525744ba` · `b9910d41` · `2cb9a955`; **eran cuatro, no seis**, y **vivían sólo en su worktree**) | — | nada |
| **D** | su módulo de media, cola y punto vivo (mergeado tandas atrás) | — | **nada: ⑤ está aplicado** (③). Puede cablear sus cuatro puntos |

**Verificado del rename de B:** `FichaPaquete.tsx` **no existe** y
`FichaDeOferta.tsx` sí. **No llegaron las dos.**

---

## ② ~~🔴 EL MERGE DE C ESTÁ ABORTADO~~ → ✅ **HECHO en `6a10fb5c`**

> **✏️ CÓMO SE RESOLVIÓ, porque los tres conflictos NO eran mecánicos:**
>
> · **el import** — el nombre nuevo de B (`FichaDeOferta`) **más
>   `FichaMensualidad`**, que C necesita en el espejo y HEAD no tenía.
> · 🔴 **la carga de la oferta — LAS DOS MITADES, y ninguna sola alcanzaba.**
>   Mi versión seteaba el precio con el guard de nulo (firma del 29-ago); la de
>   C encendía `ofreceDiario`. **El toggle se enciende DENTRO del guard:** con
>   `precio === null` no hay oferta de día que encender, y prenderlo igual haría
>   que el taller mostrara **un día suelto que el lugar no vende**.
> · 🔴 **el espejo del paquete — GANA EL GUARD DE C.** Yo pasaba
>   `PASOS_PRECIO[iPrecio]` **siempre** como día suelto ⇒ *comparaba el paquete
>   contra un precio que el lugar podía no estar ofreciendo.* C lo condiciona a
>   `ofreceDiario` y omite la comparación cuando no hay contra qué comparar.
>
> **En el toggle se conservó la forma FUNCIONAL de C** (`() => set(v => !v)`) en
> vez de usar el booleano que ahora llega. *Medido: `Interruptor` llama
> `onCambio(!encendido)` —o sea manda el valor nuevo, y `(v) => set(v)` habría
> andado— pero depender de eso ataría la pantalla a un detalle interno de la
> pieza. Alternar sobre el estado previo es correcto mande lo que mande.*

**Lo que sigue (registro de por qué se abortó la primera vez):** no era un
conflicto de texto, era **una divergencia de API**.

**Lo medido:** B renombró `FichaPaquete` → `FichaDeOferta` **y le cambió las
props** (`precioPaquete` → `precio`, `rotuloTamano` → `rotulo`, y desaparecen
`clave`, `registro`, `elegido`, `onElegir`, `campoPrecio`). B **migró la llamada
que existía** en `taller.tsx` (`17a2ee48`, cruce declarado y verificado). **Pero
C escribió DESPUÉS cuatro llamadas nuevas contra la API vieja.**

**Los cuatro sitios, con línea (medidos):** `apps/prestador/src/app/guarderia/taller.tsx`
**573 · 663 · 698 · 702**.

> 🔴 **No las adapté, y la razón importa:** adaptar cuatro llamadas a una API
> que no leí entera, minutos antes de compactar, **arriesga romper en silencio
> una pantalla que el founder está por caminar**. *Un merge que no compila no
> puede entrar; y una adaptación a ciegas es peor que un merge pendiente.*

**Lo que resolví bien y hay que conservar al re-mergear** (está en el árbol de
`main`, en `taller.tsx`): la semántica de **C** (`ofreceDiario`) con los
**nombres de B**. C distingue *«no ofrece día»* de *«ofrece a un precio fuera de
la grilla»*, que es mejor que el guard suelto que yo había puesto.

**Dueño:** C adapta sus cuatro llamadas; A mergea. **Hasta entonces las seis de
C no están en main.**

---

## ③ LO QUE **YA ESTÁ HECHO** — y contradice cualquier lista vieja

⚠️ **La cola que circulaba en la mesa al cierre estaba VENCIDA.** Medido contra
la base: **⑤ está aplicado entero**, y los tres retornos que bloqueaban a C
**están en `main`**. *Quien retome no tiene que rehacerlos.*

| firma | estado | dónde |
|---|---|---|
| los **tres retornos** de C | ✅ **hechos** | `bloquea` viaja **dentro** de `evaluarRequisitosGuarderia` · `obtenerOfertaGuarderiaPropia` acepta **precio nulo** · devuelve **`especies`** |
| **⑤ media** | ✅ `20260829100000` | `guarderia_media` + `guarderia_media_etiquetas` · **una media, N etiquetas, un evento por animal a la MISMA media** · `clave_idempotencia` obligatoria, 2º intento = **éxito** · `duracion_s ≤ 30.9` en CHECK · bucket `guarderia-media` |
| **⑤ punto vivo** | ✅ mismo | `guarderia_tramo_punto`, **`tramo_id` PK, UPSERT — nunca acumula** |
| **⑤ documentos y actas** | ✅ `20260829120000` | documentos **versionados** · aceptaciones + autorizaciones de familia · **compuerta fail-closed** · `guarderia_actas` **idempotente**, con **la hora de la puerta** (`cerrada_en` del cliente, `recibida_en` aparte) y **cerrada no se edita** (trigger) |
| **la segunda condición** de `_guarderia_puede_reservar` | ✅ **cableada** | documentos + sanitario |
| **gate sanitario configurable** | ✅ `20260829140000` | `app_config.guarderia_gate_sanitario_duro` = **`false`** |

**Los cinturones de las cinco migraciones corrieron y quedaron en verde**, cada
uno con discriminador y **residuo medido contra línea base** (no contra cero:
ver ⑥).

---

## ④ LA COLA, EN ORDEN, CON LO QUE FALTA DE VERDAD

1. ~~🔴 **Mergear C** — bloqueado por ②.~~ ✅ **HECHO** (`6a10fb5c`), con sus
   dos OTAs publicados. **C y D destrabadas.**
2. 🔴 **La build de nube `1.0.7`, cuando resetee la cuota de EAS (martes 1-sep).**
   Medido el 29-ago: *«This account has used its Android builds from the Free
   plan this month, which will reset in 3 days.»* **Es la que va a familias y
   la ÚNICA que cierra las tres cadenas de permiso** — `photosPermission` en
   prestador y cliente, y `locationWhenInUsePermission` en prestador, **hoy
   ABIERTAS**. *Se hornean en el manifest: no viajan por OTA y no se declaran
   cerradas al commitearlas — se leen EN EL APARATO.*
   ⚠️ **El APK local del 29-ago queda EN EL ESTANTE, no se instala:** el guard
   `verify-manifest-apk` lo reprobó (exit 1) — sin `geo.API_KEY` ni
   `google_app_id`, porque **son secrets que sólo el builder de EAS puede
   leer**.
3. **Encender el gate sanitario** — `D-968`, antes de la salida real.
4. **Consumir un día del paquete al reservar** (hoy `reservarDiaGuarderia` cobra
   el **día suelto**) · **el cobro de la mensualidad**.
5. **Portar la sonda al cliente** — `D-967` mitad abierta (⑤ de la lista de ⑥).

---

## ⑤ LAS DEUDAS Y TRAMPAS QUE **NO SE VEN EN EL CÓDIGO**

1. 🔴 **`prestador_servicios.precio` es NULLABLE pero conserva `DEFAULT 0`.**
   **Quien inserte omitiendo la columna obtiene `0`, que NO es «sin precio»:
   es GRATIS.** No se curó porque el default sirve a los otros cinco oficios y
   quitarlo es su decisión. **Guardería siempre pasa `NULL` explícito.** El
   invariante viejo se conservó con `chk_precio_obligatorio_salvo_guarderia`.
2. **La lista de vacunas es DEUDA ACEPTADA:** hoy corre **sólo con
   antirrábica**. El founder confirma con su veterinario las anuales y los
   desparasitantes, y **se agregan como DATO** (`cat_plan_vacunal.exigida_guarderia`)
   — jamás cableadas.
3. **`D-964`** — cada prestador **debe declarar qué especies atiende antes de
   producción**. El backfill de `D-959` les devolvió visibilidad escribiéndoles
   el universo de su tipo, **pero eso no es la elección de su dueño**.
4. **`D-965`** — «Tu día» vive bajo **Negocio**, desviación aceptada de §15b.
   ☠️ Muere **en un solo acto**: alcanzable desde HOY **y retirado de Negocio en
   el mismo commit** — *dejarlo en los dos lados es la duplicación que `D-645`
   acaba de costar.*
5. **`D-966`** — `VozComision` reintrodujo el `toFixed(2)` que `PrecioText` vino
   a matar. Fichado, no curado.
6. **`D-967`** — **curada en el prestador** (la constante del mapa ahora sale de
   la sonda nativa, fail-closed). 🟠 **`apps/cliente` sigue con `= true`
   literal** y la sonda **no está portada**. 🔴 **No se porta y consume en el
   mismo acto:** en un binario de cliente sin el módulo, la sonda daría `null`
   ⇒ fail-closed ⇒ **el mapa del cliente se apagaría hoy, donde funciona.**
   Molde S91: portar **inerte**, flipear cuando exista binario.
7. **El flag `country_config.services_enabled.guarderia` está en `false`** en
   los dos países, **y se enciende JUNTO con la oferta**: *flag sin oferta = una
   ficha que abre a una lista vacía; oferta sin flag = guarderías que ninguna
   familia alcanza.* **La oferta va primero.**
8. **`D-963`** — la reserva no guardaba **dónde ir**; curada reusando
   `_direccion_hogar_snapshot`. *En un oficio cuyo primer acto es tocar el
   timbre de una casa, eso no era un campo faltante sino la mitad del trabajo.*

---

## ⑥ LO QUE ESTA CONDUCCIÓN APRENDIÓ, y le va a pasar al que siga

- **Y una de B, que es de MÉTODO y no queda en el repo de otra forma:**

  > ### **El censo del protocolo 1c también es de CRITERIOS, no sólo de piezas.**
  >
  > **Se cobró TRES veces en un mismo día:** la huella sobre el documento **ya
  > estaba escrita** en la entrada de documento · la capa del wearable **ya
  > estaba declarada** en `themes/light.ts` · y la resolución del día lleno **ya
  > la había firmado `SelectorVentana`**.
  >
  > **En los tres casos el trabajo era LEER, no inventar.** *Un censo que
  > pregunta «¿existe esta pieza?» y no «¿alguien ya decidió esto?» devuelve
  > vacío sobre un criterio que está escrito a dos archivos de distancia — y
  > entonces se re-decide, y las dos decisiones divergen sin que nadie se
  > entere.*

- **Una migración con DOS transacciones se aplica A MEDIAS.** Me pasó tres
  veces: falla el cinturón, la primera mitad ya commiteó, el ledger no la
  registra, y hay que correr la reversa a mano. **Una sola transacción.**
- **Un cinturón que mide residuo contra CERO se rompe cuando el mundo deja de
  estar vacío** — dio rojo culpando a la configuración viva de C. **Se mide
  contra línea base**, y el sujeto del arnés se elige **sin configurar**.
- **`db push` dice `Finished` sobre cosas que no pasaron.** Se le pregunta al
  objeto: `pg_proc`, `information_schema`, `proacl`.
- **El exit se lee del comando, jamás del pipe** (L-191, cobrada en vivo con
  `verify-manifest-apk`: `EXIT=0` por un `| tail`, y era **1**).
- **Verificá en qué rama estás antes de mergear.** Mergeé dos veces sobre
  `pista/s107-rastro` creyendo que era `main`.
- **Los vocabularios cerrados de esta casa se miden, no se adivinan:**
  `app_config.tipo` es `booleano` (no `boolean`) y `categoria` no admite
  `guarderia`. `cat_tipos_evento` exige **seis** columnas.

---

## ⑦ DÓNDE ESTÁ TODO

`docs/PLAN_S107_GUARDERIA.md` (+ §0bis con las enmiendas) · `docs/BRIEF_S107_GUARDERIA.md` ·
`docs/CRITERIO_LEGAL_GUARDERIA.md` · `docs/loop/S107-A-CENSO.md` ·
**contratos:** `s107-contrato-cupo-franja-estadia.md` · `…-paquetes-guarderia.md` ·
`…-media-durante.md` · `…-documentos-y-actas.md` ·
**pedidos a C:** `S107-A-PEDIDO-A-C-JORNADA.md` · `S107-A-PEDIDO-A-C-PAQUETES.md` ·
**reversas:** `docs/relevamientos/S107-A-REVERSA-*.sql` (una por migración, **escritas antes**).
