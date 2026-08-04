# S85-A · ACTA DE TRASPASO — lo que una instancia nueva no puede reconstruir leyendo el repo

> **Para quién:** la pista **A** de la próxima sesión, que **no vivió S85**.
> **No supongo contexto.** Lo que está en el código o en las fichas queda afuera;
> acá viven **el estado de la conducción, las leyes con su porqué, y lo medido
> que no dejó rastro en ningún commit.**
>
> **Rama:** `main` · **último commit de A:** `ca196d7` · **49 commits de A en S85.**

---

## 1 · EL ESTADO DE LA CONDUCCIÓN — lo primero, porque gobierna

### 📱 EL OTA VIGENTE

| | |
|---|---|
| **group** | **`2169f9b8-2750-4be5-a109-1446f92aee09`** |
| **ancla** | **`1ef53eb`** (verificado con `update:view`, las dos plataformas) |
| **hash para el pie de Cuenta** | **`019fcabf`** |
| runtime | **1.0.3** · branch `preview` |

**⚠️ ESPERA EL GATE DEL FOUNDER.** Todo S85 está **publicado, NO firmado** —
regla 84, el cuarto eslabón. *Nada de S85 se hereda como hecho.*

### 🏗️ LA BUILD 1.0.3 — **existe, y NO se re-dispara**

`c2483ed7-4700-4739-9cda-c5a2b67e6dcb` · **FINISHED** 20:32 · runtime **1.0.3** ·
ancla `0419cc8` ·
**APK:** `https://expo.dev/artifacts/eas/CwSmotUV7hX4hgsh16I-Fx1mHvwbIqxVtDACB-pNsPA.apk`

> **POR QUÉ NO SE RE-DISPARA, y es la parte que se olvida:** **un OTA se recibe
> por RUNTIME, no por commit.** La build está en 1.0.3 y **el OTA `2169f9b8`
> también** ⇒ **le llega**. *Re-buildear por commits de JS cuesta un tren entero
> para ganar segundos.* **Solo un cambio NATIVO obliga a build nueva.**

**Su primer intento FALLÓ** (`c241c908`, `EAS_BUILD_UNKNOWN_GRADLE_ERROR`) y la
causa se leyó **del log**, no de una hipótesis: `project ':sonda-manifest' does
not specify compileSdk`. **Curado por C con `useDefaultAndroidSdkVersions()`** —
una llamada en vez de un número. *El log viene comprimido en **brotli**: se baja
de `logFiles[0]` y se descomprime con `brotli -d`.*

### QUÉ FALTA DEL CIERRE

- ✅ **el burn-down (D-630) — CORRIDO**, salida en el acta del método.
- ✅ **el acta de S85** — `2026-08-04-s85-acta-del-metodo.md`.
- ⏳ **el gate del founder sobre `2169f9b8`.**
- ⏳ **D-617 mitad ②:** el founder confirmando su `updateId` desde el pie.

---

## 2 · LAS CINCO MIGRACIONES — todas aplicadas, registradas y con reversa ANTES

| versión | qué |
|---|---|
| `20260803160000` | `certificacion` al CHECK de `prestador_documentos` (la 3ª capa) |
| `20260803180000` | la novena fila del teléfono → `+573208408790` |
| `20260803220000` | `cupo_techo` de `paseo*` **4 → 10** |
| `20260804010000` | **`obtener_plata_del_dia`** — el gate en el servidor |
| `20260804030000` | **cohorte** — columnas + trigger + inmutabilidad + vista |
| `20260804050000` | **`obtener_expediente_modulado`** (D-639) |
| `20260804070000` | **`obtener_familia_de_mascota`** |
| `20260804090000` | **`obtener_atenciones_abiertas`** |

*(Son ocho, no cinco — la orden nombró las cinco de DATOS. Las tres primeras son
del lote Cuenta/cupo.)*

**Las reversas viven en `docs/relevamientos/2026-08-0*-s85a-REVERSA-*.sql`.** Dos
llevan aviso propio:
- **`REVERSA-cohorte`** — *revertir DESTRUYE el emblema de los 7 vivos, y el orden
  importa: **la cláusula de inmutabilidad se retira PRIMERO** o el guard bloquea
  el DDL.*
- **`REVERSA-d639`** — ***reabre el agujero de privacidad*** y pide que D-639
  vuelva a 🔴 en el mismo acto.

**`gen:types` regenerado** tras cada migración. **`registrar` = `INSERT INTO
supabase_migrations.schema_migrations`** — el canal `db query` no lo hace solo.

---

## 3 · LAS LEYES QUE DEPOSITÉ HOY, con su porqué entero

### L-194 — un número de plataforma copiado en un wrapper **rebota bien**

`cupo_techo` subió a 10 y **cuatro guards seguían diciendo `> 4`**. *El motor
permitía y la puerta única no.* **Su modo de falla es el peor: NO revienta —
devuelve un código tipado, con su mensaje, por su camino previsto.** *Nadie
audita un rebote que se ve correcto.*
**⇒ el tope se PREGUNTA al catálogo, jamás se recuerda.**
**➕ ENMIENDA:** **un guard tiene DOS cuerpos —el predicado y su voz— y se curan
juntos.** *La pagué en el commit que depositaba la lección: curé los predicados y
dejé el literal `'entre 1 y 4'`.*

### L-195 — una columna que **existe** no está **poblada**

Afirmé *"el quién ya está en la fila"* leyendo `information_schema`. Al contar:
**`cuenta_comercial_id` poblada en 3 de 177**, `procedencia` **NULL en 134**.
*Verdadera sobre el esquema, falsa sobre el dato.*
**⇒ toda columna sobre la que se apoye una decisión se mide con `count(col)` vs
`count(*)`. Es UNA query, y va antes de la primera línea.**

### L-196 — un módulo *"preparado-apagado"* que nunca pasó por un compilador **está escrito, no preparado**

`sonda-manifest` esperó **doce sesiones**; su primer Gradle fue en S85 y falló.
**⇒ todo pasajero que espera un tren futuro declara QUÉ LO VERIFICA MIENTRAS
ESPERA.** *Si nada lo compila, su estado es **"sin verificar"**, y eso se escribe.*

### L-197 — **un fallo degrada a AUSENCIA, nunca a un VALOR que el consumidor use como cierto**

`techoMaximoDe` devolvía `1` al fallar. **Un catch-all pensado para un fallo
OCASIONAL se volvió el ÚNICO camino** (el embed no tenía FK ⇒ fallaba siempre), y
el taller dijo *"Hasta 1 en simultáneo"* toda la sesión.
> **Convirtió un error VISIBLE en un dato falso CREÍBLE — y me protegió de verlo.**
**El criterio, sin juicio:** *¿el consumidor lo OMITE?* → legítimo *(la URL que no
se firma: el clip no se muestra)*. *¿lo USA como dato?* → **prohibido** — error
tipado o un valor **imposible** que signifique "no sé" (**el `0` del techo**).
**Y un `console.error` NO alcanza: un log en producción no tiene testigo.**

### L-198 — un texto que explica un porqué **vence con el porqué**

**Un porqué viejo se lee con la misma autoridad que uno vigente.** Cinco cobros
en la sesión: el mensaje de un guard · un comentario que describía algo
inexistente · un copy · una ficha · un acta.
**⇒ cuando cambia el hecho, el texto se mueve EN EL MISMO COMMIT.**
**Corolario:** *los que se cazaron fue porque algo MECÁNICO se puso rojo; los que
no tienen guard se descubren de casualidad o porque el founder choca.*

**➕ LA FRONTERA DE B:** *el radio corto y el largo son los dos errores; lo que
los separa es que la pregunta se conteste **MIDIENDO**.* «¿quién más lo necesita
**hoy**?» se mide; «¿quién podría **algún día**?» se imagina. **Si el censo da
CERO, no es alcance corto: es una pieza sin dueño** — y una pieza sin consumidor
es deuda. *Los tres casos de S85 fallaron **midiendo poco**, no imaginando poco.*

**➕ EL COROLARIO DE C:** **«no confíes en que alguien lo lea — ni siquiera vos».**
*C cayó en la trampa que su propio comentario advertía **tres líneas más
arriba**.* **⇒ lo que hace barata a una regla no es escribirla: es que algo la
vigile.** **La prueba: si esto se rompe, ¿algo se pone rojo?** *Si la respuesta es
"alguien va a leer el comentario", no hay defensa: hay una esperanza.*

### L-199 — **el rojo se produce ANTES, o la cura queda sin evidencia para siempre**

> **El "antes" no se puede reconstruir después.**

*Un bug funcional deja rastro; **una fuga de permisos no deja ninguno** — el
sistema funciona igual de bien mostrando de más.*
**Corolario:** **una modulación aproximada es una fuga con forma de ley.**

### #22 — **una orden que nace de una medición declara su ancla** *(FIRMADA)*

**La mesa midió viejo CINCO veces en S85.** *Y su variante peor:* **reenviar una
medición ajena sin su ancla** — *llega con la autoridad de dos y el respaldo de
ninguno.*
**Dos mitades:** ① la mesa declara el ancla · ② **la pista RE-MIDE antes de
ejecutar**. **⇒ quien reenvía reenvía SU ANCLA Y SU HORA, o la re-mide y la firma
como propia.**

### #23 — **el texto que una pista escribe LE HABLA A OTRA PISTA**

*C tenía un comentario que describía un comportamiento inexistente; **A construyó
un contrato contra él**.* **Es #21 con el alcance corrido: no le habla al
usuario, le habla al que va a construir contra vos — y ningún guard lo ve.**

### Regla 85 — **worktree por pista: FIRMADA** *(deja de ser pendiente)*

**Tres veces el árbol se movió entre la declaración y el bundle**, y **la tercera
fue A**. *Una regla que su propio autor incumple con el instrumento en la mano no
falla por falta de rigor: **falla porque el entorno la hace fácil de romper**.*
**Paga también D-586** (`index.lock` mordió tres veces).

### El **QUINTO deber** de la conducción — delta vs acumulado

> **El contenido de un bundle se lee del RANGO, jamás del mensaje que uno mismo
> escribió.** *Un `--message` es una etiqueta que redacta una persona.*

**DOS listas verdaderas:** el **DELTA** (`ancla-anterior..ancla`) es **para la
mesa**; el **ACUMULADO** (desde el último bundle **GATEADO**) es **para el
founder**. **⇒ el anuncio DICE CUÁL está dando.**
*Y decir DE MÁS es peor que de menos: manda al founder a buscar algo que no
existe, y va a concluir que el update no entró.*

### §3.4 — sus dos mitades *(el paso ⓪)*

① **la prueba no es "¿mi escritura fue inocua?" sino "¿EXIMIRLA AHORRA ALGO?"** —
*toda escritura propia parece inocua desde adentro; contestar la primera convierte
una regla mecánica en una de juicio.* **Su límite:** **no aplica sobre una pista
que YA DECLARÓ su posición y la midió.**
② **QUIEN FIJA UN ANCLA DECLARA SI VA A SEGUIR ESCRIBIENDO, O NO LO FIJA
TODAVÍA.**

### D-584 — **cuándo se salta el hook**, con su condición

① **SOLO para commits SIN un `.tsx`** *(el lint mira `.tsx`; un commit que no
aporta ninguno no puede producir ni curar ese rojo)* · ② **SE DECLARA SIEMPRE**
con `SALTAR_GATE="<por qué>"`.
> *Un salto silencioso devuelve el hook a ser un aviso — y uno que ya nadie puede
> auditar.*
**⚠️ El hook ahora MIDE al momento** (aporte de B) y **avisa si citás un rojo que
no existe.** *Me cazó una vez.*

### §6 del método — **se comparte la FORMA, jamás la VOZ** *(aporte de C)*

*El dueño lee «Recibió la vacuna»; el prestador lee el hecho profesional.*
**Clonar una pieza duplica una implementación; compartir una voz duplica una
AUDIENCIA — y ésa no se puede deduplicar.** **La prueba: ¿el texto cambia según
QUIÉN lo lee?** *No autoriza clonar la pieza: la forma se ensancha con una prop.*

---

## 4 · LAS FICHAS ABIERTAS — su estado REAL

| ficha | estado |
|---|---|
| **D-617** 🔴 | **mitad ① PAGADA** (build 1.0.3 FINISHED). **La ② es del FOUNDER:** confirmar su `updateId` desde el pie. *La ① sola es el error que la ficha registra.* |
| **D-635** 🟠 | E.164 en `profiles`: **ley firmada, ejecución DIFERIDA**. El guard exige el formato viejo **a propósito** — endurecerlo rompe `apps/cliente`, que está fuera del reparto. **El backfill quedó CERRADO POR DECISIÓN** (8 de prueba quedan). **Nadie endurece el guard suelto.** |
| **D-638** 🟠 | el default por oficio **no es ejecutable**: 56/56 franjas universales. **(A) cableada como PALIATIVO** (`cupoTechoMaximo`); **la respuesta buena es (d): franjas por servicio.** |
| **D-639** ☠️ | **CURADA** — 84 contenidos ajenos → 0, con el par medido. |
| **D-641** ⚪ | `apps/cliente` **nunca corrió** contra el `packages/api` de S85. **Probar ANTES de buildear.** |
| **A3.5bis-b** | **la puerta del permiso: LETRA SIN MOTOR.** Alcance firmado: **por CASO y por MASCOTA**. Forma **(c)** firmada: *el permiso se ancla al CASO y el caso enumera sus eventos*. **Precondición de S86.** |
| nacidas hoy | **D-634** (panel en 6, asimetría 6/8 **QUEDA** por firma) · **D-636** (12 reglas sin `ancla()` — **B la curó**) · **D-637** (`profiles.nombre` sin superficie, **precio aceptado**) · **D-640** (los tres `null` ambiguos de `titular.ts`) |
| ☠️ muertas | **D-173** (4 meses) · **D-595** · **D-630** · **D-633** · **D-639** |

---

## 5 · LO MEDIDO QUE NO ESTÁ EN NINGÚN COMMIT

**① El cliente está AL DÍA.** Build **1.0.2** (16-jul, `0aecb12`) y canal
`preview` en **1.0.2**; último OTA `f55d65c9` (S82) **ya le llegó**. **No es
D-617: allá el canal servía a un runtime sin build; acá coinciden.**

**② El censo de `catch` que devuelven valores legales** (barrido de L-197):
`adiestramiento-reserva:519` devuelve `{}` y **es legítimo** *(el clip no se
muestra: omite, no inventa)*; **`titular.ts` ×3 devuelven `null` y son ambiguos**
→ **D-640**. *El criterio los separa: la URL que no aparece SE NOTA; el techo que
dice 1 SE OBEDECE.*

**③ El precio en las citas vivas:** **88 vivas, SOLO 2 sin precio**, ambas del
**7-jul**, sueltas, las más viejas del corpus. **Plan 27/27 y paquete 3/3 con
precio.** *El unitario del plan **no es estable entre períodos** pero **dentro del
día es exacto y ya está calculado** — el motor lo estampa al crear la cita, así
que el lector SUMA, no deriva.*

**④ El cuadro de `caso_clinico`:** entidad de primera clase (2 vivos, 5 tablas de
su familia, `caso_clinico_id` en **ocho**, poblado donde importa: hc 3/4,
medicación 4, examen 1). **🔴 Pero `eventos_mascota` NO tiene `caso_clinico_id`**
— vive en las hijas, no en el padre, **y el padre es lo que lee
`obtener_expediente_modulado`**. *Desde donde el permiso tiene que aplicarse, el
caso es invisible.* **Sin la forma (c), "por caso" COLAPSA A "por mascota" sin
que nadie lo note.**

**⑤ Otros números sueltos:** las policies de `familia`/`familia_miembro` **no
nombran al prestador** (0 filas por RLS — el hueco §6.4.5) · **una sola atención
abierta**: Thor, paseo del **15-jul**, **19 días**, $6.00 · `prestador_servicios`
**no tiene FK** a `tipos_servicio` y **3 ofertas usan `'otro'`**, que no existe en
el catálogo.

---

## 6 · QUÉ ESPERA S86

**① NOTIFICACIONES — la sesión nombrada.** SMTP propio · plantillas · Meta.
**🔴 Y el dato de campo del founder: el correo de recuperar NO trae código —
trae un LINK al portal de prestadores ANTIGUO** (D-628). *Un gate visual verde
sobre un camino que no llega.* **`verifyOtp` sigue sin probarse porque nunca
llegó un código que canjear.**

**② EL PERMISO DEL DUEÑO sobre el expediente** (A3.5bis-b). **Alcance y forma
firmados; el canal es notificaciones ⇒ va con ①.** **Y su pieza de fondo: la
forma (c)** — el caso enumera sus eventos.

**③ D-638 (d)** — franjas por servicio. *Hace ejecutable el default por oficio y
mata el paliativo `cupoTechoMaximo`.*

**④ Lo que el founder rebote en el gate de `2169f9b8`.** *Nada de S85 está
firmado.*

**⑤ Arrastres:** **regla 85 — worktree por pista es la PRIMERA decisión** ·
**D-635** con territorio cliente · **D-641** (probar antes de buildear) ·
**D-640**.

---

*Depositada por A al cierre de S85. Nada de acá está firmado: son mediciones,
leyes ya depositadas y estado de conducción. Lo que rige es el canon.*
