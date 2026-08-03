# LETRA DE LA BUILD 1.0.3 — v1.0

> **Estatuto:** transpone decisiones ya firmadas por el founder (3-ago-2026) y
> adjudicaciones de mesa de S85. **No abre ninguna.** Lo medido va marcado como
> tal; lo que espera, también.
>
> **Qué contesta:** por qué esta build existe, **qué viaja adentro congelado**,
> qué viaja **sabiendo que está roto**, y **en qué orden** se hace — que es la
> parte que se improvisa mal bajo presión.

---

## §1 · POR QUÉ EXISTE — el canal sirve a UN teléfono

**MEDIDO (D-617):** `apps/prestador` declara `version: 1.0.3` en `app.json`, y
por la policy `appVersion` eso fija el runtime. **La build EAS más nueva es
`987a0047`, runtime 1.0.2, del 16-jul.** Builds en 1.0.3: **CERO**.

> **Un OTA solo lo recibe una APK con su MISMO runtime.** ⇒ **los nueve OTAs de
> S84 y todo lo que se publique en S85 llegan a exactamente un aparato: la APK
> local que el founder construyó en S78** (`eas build --local`, instalada por
> `adb` porque la cuota de EAS había rebotado).

**Y por qué eso es 🔴 y no una nota operativa:** `S79` declaró que al cierre
**el founder sale a reclutar**. *Reclutar es un segundo teléfono, y hoy no hay
build que darle.* Mientras tanto, todo el craft de S83 y S84 vive colgando de
que ese aparato **no se reinstale** — si vuelve a EAS por cualquier motivo, cae
a 1.0.2 y **no ve nada**, y lo va a leer como *"el cambio no llegó"*, no como
*"mi APK es vieja"*.

> **Es L-138 en su forma más cara: un founder mirando una pantalla sin cambios y
> una mesa creyendo que publicó.**

---

## §2 · QUÉ VIAJA ADENTRO — el contenido esperado, y su estado

| pieza | commit | estado |
|---|---|---|
| **cura GPS** (D-595: dos paseos simultáneos; terminar uno dejaba de matar al otro) | `d2ff86e` | ✅ **en `main`** |
| **la flecha del `acento`** — el rebote del founder, con las dos lecturas de su literal | `913a93b` | ✅ **en `main`** |
| **el lote Cuenta** | — | 🟡 **EN VUELO (C)** |
| **la perilla B de R12** (radio angosto; no toca color firmado, rename incluido) | — | 🟡 **si B la commitea a tiempo** |

**R12, con su condición escrita para que no se cuele:** va al founder **en el
gate del lote, EN DISPOSITIVO**. **No se aplica antes.** *El tinte queda más
sutil y eso lo juzga su ojo, no un ratio.* Si B no la commitea antes de la veda,
**la build sale sin ella y se dice** — no se espera y no se mete después.

---

## §3 · ⚠️ *"OLVIDÉ MI CONTRASEÑA"* VIAJA **VISIBLE**, Y SE SABE QUE NO FUNCIONA

**FIRMA DEL FOUNDER (3-ago): riesgo asumido, equipo avisado.**

**El control está vivo** (`login.tsx:108` → `/recuperar`) **y viaja así.** Lo que
hay del otro lado, **medido en campo por el founder** (D-628):

> **El correo NO trae el código. Trae un LINK, y el link redirige al PORTAL DE
> PRESTADORES ANTIGUO.** Remitente genérico de Supabase.

**⇒ Quien toque ese botón hoy no puede recuperar su contraseña.** La pantalla
pide un código que **nunca va a llegar**.

### Por qué viaja igual, y no es descuido

Las **ocho cuentas solo-Google del legado** están en callejón desde S81, y
`auth.users` tiene **8 sin proveedor `email`** para las que cambiar contraseña es
imposible. **Esconder el botón no las desbloquea: solo esconde el único camino
que va a existir.** *Y esconderlo obligaría a re-mostrarlo en la build
siguiente, con el costo de otra build nativa.*

> **LA CONDICIÓN DE ESTA FIRMA — es lo que la vuelve un riesgo asumido y no una
> apuesta:** **el equipo está avisado.** El día que alguien de la cohorte lo
> toque y no reciba nada, **hay una persona que sabe por qué y puede resolverlo
> a mano.** *Un botón roto con alguien detrás es fricción; un botón roto sin
> nadie detrás es una cuenta perdida.*

**La cura es de S86, entera** — plantilla con el token del código + redirect al
destino correcto + SMTP propio. **Las tres son config remota, no repo.** *Por eso
no bloquea esta build: no hay nada que compilar.*

### ⚠️ Y una pregunta que sigue abierta, para que nadie la dé por contestada

`verifyOtp('recovery')` **nunca se probó contra un correo real** — no por
descuido, sino **porque jamás llegó un código que canjear**. S84 lo declaró como
*"lo único que puede REVERTIR una decisión, no solo pedir un retoque"*. **Sigue
sin contestarse**, y ahora se sabe por qué no se pudo.

---

## §4 · EL ORDEN — la build va **DESPUÉS** del gate del OTA, no antes

> ### **EL FOUNDER FIRMA PRIMERO LO QUE LA BUILD VA A LLEVAR CONGELADO.**

**La secuencia, en piedra:**

| # | paso | quién |
|---|---|---|
| ① | **C reporta el lote Cuenta** | C |
| ② | **MERGE** — `git show --name-only --pretty=""` **por commit**, jamás `diff --stat` entre puntas | **A** |
| ③ | **VEDA, paso ⓪ DESDE CERO** — ver §5 | **A** |
| ④ | **OTA ÚNICO** — GPS + flecha + lote (+ R12 si llegó) | **A** |
| ⑤ | **GATE DEL FOUNDER EN DISPOSITIVO** | founder |
| ⑥ | **curas del gate**, si las hay → vuelve a ③ | quien corresponda |
| ⑦ | **BUILD 1.0.3** | **A** |

**Por qué este orden y no el cómodo:** un OTA se corrige publicando otro; **una
build nativa cuesta un tren entero** —cuota de EAS, descarga, reinstalación por
`adb`, y el founder parado esperando—. *Hornear craft sin firmar significa que
el primer rebote del gate obliga a repetir el paso más caro de la cadena.*

> **Y hay un segundo motivo, que es el que ya nos cobró:** la build queda
> instalada. **Un OTA malo se supersede; una APK mala se queda en el teléfono
> hasta que alguien la reinstale a mano.**

---

## §5 · EL PASO ⓪, DESDE CERO — y por qué las confirmaciones de hoy NO sirven

**Adjudicación de mesa (S85):** el publish anterior se pospuso. **Las
confirmaciones de congelación de hoy se descartan y se re-piden.**

**Es el punto 4 del método al pie:** *una confirmación que sobrevive a una
escritura no confirma nada.* **Entre aquellas confirmaciones y este bundle hubo
escrituras de las tres pistas** — incluidas las mías. *Reusarlas sería tener el
papel sin el hecho.*

**El paso ⓪ completo, con los puntos que más veces se perdieron marcados:**

1. **Nombrar a B y a C.** *Un "congelen" sin destinatarios no congela a nadie.*
2. **Verificar por CONTENIDO contra el ancla**, jamás por ref:
   `git merge-base --is-ancestor <sha> HEAD`, con **`git fetch` antes** de
   cualquier comparación con `origin/main` — *tiene forma de ref remoto y
   naturaleza de dato en caché.*
3. **Reenviar las confirmaciones TEXTUALES, con su hora.** *Una confirmación sin
   hora no es una confirmación: es un recuerdo.*
4. **Si alguien —incluida A— escribe después de recibirlas, se descartan y se
   re-piden.**
5. **La veda no se levanta sola por urgencia.** Si la mesa necesita que una
   pista trabaje, **la levanta explícitamente y después se RE-PIDE**.
6. **⚠️ ÁRBOL LIMPIO ANTES DE BUNDLEAR, no después** — *el ancla se lee al
   bundlear.* **Precedente vivo de S85:** el publish anterior frenó acá, con
   `Boton.tsx` de B sin commitear. **El freno fue correcto y queda registrado.**
7. **Group verificado con `update:view`, NUNCA `update:list`** — no muestra el
   `gitCommitHash`.
8. **Cierre anunciado a TODOS, mesa incluida**, con **el hash corto del update**
   para que el founder lo confirme en el pie de Cuenta.

> **Nueve de nueve OTAs limpios en S84** (`isGitWorkingTreeDirty = None`). **Eso
> no se rompe en S85** — y no se sostuvo por suerte: lo sostuvieron las tres
> pistas, ocho veces.

---

## §6 · LO QUE LA BUILD **NO** RESUELVE

1. **La recuperación por correo** (§3). Config remota, S86.
2. **`apps/cliente`** — fuera del reparto de S85. La build es del prestador.
3. **D-635** — el guard de E.164 en `profiles` no viaja curado, por decisión.
4. **El re-gate del `acento`.** La flecha viaja; **que quedó bien lo dice el
   founder en el gate ⑤**, no esta letra.

---

## §7 · CÓMO SE VERIFICA QUE MURIÓ D-617

**Las dos mitades, y ninguna sola alcanza:**

1. **`eas build:list` muestra una build FINISHED en runtime 1.0.3.**
2. **El founder confirma desde el PIE DE CUENTA** que su `update {8 chars} ·
   canal` coincide con el group vigente — o que dice `bundle embebido` si acaba
   de instalar.

> **La ① sin la ② es exactamente el error que D-617 registra:** *una build que
> existe en EAS y un teléfono que sigue con otra cosa.* **El gate empieza
> confirmando el binario** (L-138), y el marcador se lee **en pantalla**, no en
> `logcat` — que presupone cable, y la ley de los gates alcanzables tenía
> inalcanzable su propio instrumento hasta que S74 lo curó.

---

## Historial

- **v1.0 (3-ago-2026, S85-A8):** depositada. Transpone: la firma del botón
  visible con riesgo asumido · el contenido esperado del bundle · el orden
  build-después-del-gate · el paso ⓪ desde cero con las confirmaciones de hoy
  descartadas. **Ninguna decisión nueva.**
