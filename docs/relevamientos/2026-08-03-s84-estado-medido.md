# S84 · EL ESTADO MEDIDO — BORRADOR (no cerrado)

> **Todo lo de acá salió de una medición registrada.** Donde no hay medición, se
> declara el hueco en vez de completarlo.
> **⚠️ BORRADOR:** falta el último lote de C y su gate.

---

## 1 · OPERATIVO

**SEIS migraciones**, todas aplicadas **y registradas**:

| | qué |
|---|---|
| `20260802120000` | el teléfono E.164 (los dos CHECK) |
| `20260802140000` | la galería: bucket, tabla, RLS, clip, y el homónimo muerto |
| `20260802160000` | `reordenar_fotos_prestador` (atómica, dos pasadas) |
| `20260802180000` | `GRANT SELECT (clip_url)` |
| `20260802220000` | la zona aproximada — `lat`/`lon` fuera de la vista |
| `20260803000000` | la promoción E.164, con su traza |

**Reversas escritas ANTES en las cuatro que lo pedían.** *La de la zona lleva un
aviso propio: **correrla reabre un agujero de privacidad**, y por eso pide que
D-624 vuelva a 🔴 en el mismo acto.*

**CINCO OTAs de S84**, todos runtime 1.0.3, **los cinco con `dirty = None`**:
`7848147c` · `19302cc9` · `bcb549ad` · `d139b9c0` · `d4c20a64`.

**DIECISIETE fichas nuevas:** D-613 → D-629, más **D-630** (el burn-down).

## 2 · LO QUE CERRÓ, y con qué

| ficha | cómo cerró |
|---|---|
| **D-613** | los tres cuerpos movidos juntos + **validada en dispositivo** |
| **D-619** | `VALIDATE CONSTRAINT` en verde — **de un comando**, como su ficha exigía |
| **D-622** | **por medición**: la causa era el propio guard, no la migración |
| **D-624** | la vista ya no expone `lat`/`lon`; grants acotados a `SELECT` |

## 3 · EL TELÉFONO — estado final, medido

**Las cinco filas legado pasan el CHECK.** Los dos constraints quedaron
`convalidated = true`.

**El país salió del propio número en cada caso:** CO para Satori, EC para las
otras tres promovidas. **`country_code` es `EC` en las siete** — la prueba de que
P21 se respetó **está en el resultado**, no en la intención.

## 4 · LA GALERÍA — lo que existe y lo que no

**Existe:** bucket `prestador-galeria` (público, **10 MB**, 5 mime) con **las
cuatro policies** · `prestador_fotos` con RLS de nacimiento · `clip_url` · la
frontera `subir-imagen.ts` con **tres consumidores** (logo · galería · clip) · el
borrado que **borra bytes**.

**Los números del bucket son medidos, no elegidos:** fotos reales 131 kB de
promedio / **327 kB** de máximo; el único clip real **6.7 MB** ⇒ techo de 10 MB,
**el mismo que `cita-archivos` y `grooming-archivos` ya usan**.

> **NO EXISTE, y se declara:** el **tope de fotos** no se puso. **Y hay una razón
> medida que lo vuelve más que una omisión:** un tope en la TABLA **no es un tope
> de almacenamiento** mientras el borrado deje huérfanos. *Hoy la galería sí
> borra bytes, así que el tope volvió a ser una decisión de producto y no una
> promesa vacía — pero nadie la tomó.*

## 5 · LO QUE SIGUE VIVO — con su gravedad

**🔴 D-617 — sin build EAS en runtime 1.0.3.** Los cinco OTAs de S84 **solo
alcanzan la APK local del founder**. **Su mitad ① está pagada** (él confirmó
`updateId` en dispositivo); **la que queda es la que importa**: el canal sirve a
**un solo teléfono**, y **S79 declaró que al cierre el founder sale a reclutar**.
*Reclutar es un segundo teléfono, y hoy no hay build que darle.*

**🔴 D-595 — el GPS en paseo simultáneo.** Medido contra el código y **sin
tocar**: `TAREA_TRACK_GPS`, `STORAGE_SESION` y `sesion` son **singulares por
construcción**. Y un segundo defecto que la ficha no nombraba: **terminar UNO de
los dos paseos apaga la captura de los DOS**.

**🟠 D-627 — el `en` del escriba se genera y no se persiste**, a propósito: la
columna nacería sin lector y **con una mentira dormida**.

**🟠 D-621 — `anon` tiene grants sobre las 39 columnas de `prestadores`.** Ganó
evidencia nueva en S84: **la vista recreada nació con seis privilegios de
escritura** que ninguna migración concedió. *No es de `prestadores`: es del
esquema.*

**🟠 D-628 — el correo de recuperación llega en inglés** hasta S86.

## 6 · SEGURIDAD — el reparto, con su freno

| | dónde | por qué |
|---|---|---|
| cambiar contraseña | **hecho, en el OTA** | JS puro |
| recuperar por **código** | **hecho, en el OTA** | cero link, cero scheme |
| recuperar por **enlace** | **S85** | **cero `intentFilters`** = App Links exige build |

> **⚠️ NO PROBADO CONTRA UN CORREO REAL:** `verifyOtp('recovery')` devuelve sesión
> **según el contrato**, y de eso depende que el `updateUser` posterior funcione.
> **Probarlo exige la plantilla, que es de S86.** *Si al probarlo no alcanzara, el
> camino del código se cae y el reparto vuelve a la mesa.* **Está escrito en el
> código, no solo acá.**

**El borde que la medición destapó:** `auth.users` tiene **137 con proveedor
`email` y OCHO sin él**. Para esas ocho, cambiar contraseña es imposible —**y
decirles "la contraseña actual no coincide" sería mentirles**—; pero **recuperar
por código las SACA del callejón** en que están desde S81.

---

## APÉNDICE · LOS HUECOS DECLARADOS

1. **El burn-down de la regla 81** — tercera sesión sin medirse (**D-630**), ahora
   con condición que dice **quién** y **cuándo**, y **hecha script** para que deje
   de competir contra construir.
2. **El conteo total de frenos** — **nueve censados** (los de A). Los de B y C
   **no se censaron**; el "once" era número de la mesa, no medición.
3. **La candidata del barrido case-sensitive NO EXISTE** — la mesa la nombró sin
   verificar; **es de C y está pedida**.
4. **La config remota de Supabase Auth** (plantillas, idioma, remitente) **no es
   medible desde el repo**. Se ve en el dashboard en dos minutos.
5. **`public._traza_promocion_e164` sigue viva** — es la evidencia que cerró
   D-619 y D-622. **Se retira cuando el acta esté cerrada.**
