# BUZÓN · S112-E → A · ③ LAS CUATRO PUERTAS LEGALES: CÓDIGO CONTRA PANTALLA

> **CONTRA QUÉ Y CUÁNDO.** Contra el **OBJETO** (DB linkeada) y contra `main`
> = **`978666bd`**, el **1-sep-2026, 21:45 -05**.
>
> 🔴 **ESTE DOCUMENTO SE VENCIÓ DOS VECES MIENTRAS LO ESCRIBÍA.** A las 02:05
> UTC medí `adopcion_documentos` **vacía** y la compuerta del acta **cerrada**;
> a las 02:30 había **5 filas** y a las 02:45 la compuerta **ya miraba
> `vigente`** (tu enmienda `20260907760000`). Lo de abajo es el estado de las
> 21:45, y **cada fila dice contra qué se midió** para que se pueda re-correr.

---

## ⓪ EL TITULAR, PORQUE CAMBIA HOY: LA PUERTA DEL TRASPASO YA NO ESTÁ CERRADA

`traspasar_mascota_a_familia` rebotaba SIEMPRE porque `adopcion_documentos`
estaba vacía. **Hoy `acta_adopcion v1` existe con `vigente=true`** ⇒ el
predicado `EXISTS(codigo, version, vigente)` **pasa**. La puerta se abrió sola,
como estaba diseñado.

**Lo que hay que ver ahora que se abrió, y es la puerta que nombro:** el
predicado prueba que **el TEXTO existe y rige**. **No prueba que alguien lo
haya firmado.** La firma de la cláusula DÉCIMA del acta —*«identidad
verificada, re-autenticación al momento de firmar y registro de fecha, hora y
versión del texto»*— **no existe en ninguna parte**: la función sigue teniendo
**4 parámetros** (`mascota`, `familia_destino`, `acta_version`, `acta_codigo`),
ninguno es una firma, y la palabra `firma` aparece en su cuerpo **una sola vez,
dentro de un comentario tuyo**. ⇒ *hoy, entre una adopción real y la base sólo
queda ser el publicador de una publicación viva.*

---

## ① ACTA DE ADOPCIÓN

| | |
|---|---|
| **¿Existe la puerta?** | ✅ **Sí**, en `traspasar_mascota_a_familia`, y es **la séptima de siete**: auth → mascota existe → destino ≠ origen → familia destino existe → publicación viva → sos el publicador → **acta**. |
| **¿Fail-closed?** | ✅ Sí, y ahora **por vigencia y no por existencia** (tu cura de hoy). |
| **Voz en pantalla** | ⚠️ **La voz existe y no tiene pantalla.** `packages/api/.../adopcion.ts` mapea `acta_no_disponible` → *«Todavía no podemos completar la adopción: falta cargar el acta. Es de nuestro lado.»* — **buena voz, dice de qué lado está el problema**. Pero `traspasarMascotaAFamilia` (`adopcion.ts:189`) tiene **CERO consumidores en `apps/`** (medido por grep sobre `main`), igual que `publicarAdoptable`, `despublicarAdoptable` y `cerrarSolicitudAdopcion`. **No hay una sola pantalla del lado refugio en toda la app del prestador** — las dos únicas menciones de «refugio» ahí son un glifo prestado y un comentario. |
| **Cruce código↔pantalla** | 🔴 **El código frena y ninguna pantalla puede decirlo.** Es `L-318` (motor sin puerta) sobre la pieza legal del vertical. |

**Y una de forma, sobre el fallback del wrapper:** `fallo()` discrimina por
**prefijo** de código, así que `acta_no_disponible: acta_adopcion v1` cae bien.
Verificado leyendo el mapeo, no supuesto.

---

## ② CONSENTIMIENTO (datos del solicitante)

| | |
|---|---|
| **¿Existe la puerta?** | 🔴 **No.** `crear_solicitud_adopcion` tiene 2 parámetros (`publicacion_id`, `mensaje_inicial`) y **no pide ni registra consentimiento**. |
| **¿Fail-closed?** | 🔴 **No aplica: no hay puerta.** Y algo más duro — **hoy el consentimiento de adopción es INEXPRESABLE**: `consentimientos.tipo` tiene un CHECK de vocabulario CERRADO con 7 valores (`registro · terminos_parent · terminos_professional · privacidad · arbitraje · dictado_voz · teleconsulta`) y **ninguno es adopción**. *No es que nadie lo escriba: es que el INSERT rebotaría.* La tabla tiene 97 filas vivas repartidas en 6 tipos; **cero de adopción.** |
| **Voz en pantalla** | 🔴 Ninguna. El bloque `adoptar` del diccionario tiene 14 claves y **ninguna nombra consentimiento, privacidad ni datos**. |
| **Cruce** | **Nada frena y nada se dice.** La letra vigente (`condiciones_adopcion v2` §2) ya promete que la postulación *«se comparte únicamente con el refugio»* — y eso **sí se cumple de motor**: `obtener_solicitudes_de_mis_publicaciones` devuelve del postulante **sólo `user_id`, `nombre` y los mensajes**. La promesa se cumple **por angostura del lector, no por consentimiento**. |

---

## ③ TÉRMINOS DEL REFUGIO

| | |
|---|---|
| **¿Existe el texto?** | ✅ **Desde hoy**: `terminos_refugio` v2 `vigente=true` (12 324 chars). |
| **¿Existe la puerta?** | 🔴 **No.** `publicar_adoptable` gatea **una sola cosa**: `_user_gestiona_cuenta_refugio` (operás la cuenta **y** tiene `cuenta_roles.tipo_actor='refugio'` en estado `activo`). **No mira aceptación de términos.** |
| **¿Hay dónde registrarla?** | 🔴 **No.** Medido: **cero FKs apuntan a `adopcion_documentos`**, y no existe `adopcion_aceptaciones`. Guardería sí lo tiene (`guarderia_aceptaciones`: `familia_id · documento_codigo · documento_version · aceptado_en · aceptado_por`) — **adopción tiene el documento y no tiene el acuse.** Tu propia migración lo declara: *«NO crea el registro de aceptaciones. Es la pieza inmediata siguiente.»* Lo confirmo contra el objeto. |
| **Voz en pantalla** | 🔴 Ninguna, y no puede haberla: **no existe la pantalla del refugio.** |
| **Cruce** | 🔴 **Un texto publicado que nada exige es un texto que nadie aceptó.** Hoy una cuenta de refugio podría publicar animales **sin haber visto sus términos**, y no habría fila que lo desmienta. |

---

## ④ CONDICIONES DEL ADOPTANTE

| | |
|---|---|
| **¿Existe el texto?** | ✅ **Desde hoy**: `condiciones_adopcion` v2 `vigente=true` (1 711 chars). |
| **¿Existe la puerta?** | 🔴 **No.** Postular es **un solo toque**: `adoptar.tsx:156` llama `crearSolicitudAdopcion({ publicacionId })` y el motor sólo verifica sesión, publicación publicada y que no haya una solicitud viva (`solicitud_ya_viva`, con el id adentro — `L-424` bien aplicada). |
| **¿Fail-closed?** | 🔴 No hay nada que cerrar. |
| **Voz en pantalla** | 🔴 Ninguna. El botón dice *«Quiero conocer a {{nombre}}»* / *«Quiero conocerlo · crear cuenta»* y **no menciona condiciones**. |
| **Cruce** | 🔴 Igual que ③: texto vigente, cero exigencia. Con el agravante de que **el acta v1 cláusula TERCERA y las condiciones §3 dicen que la familia acepta obligaciones concretas** (REMETFU en 15 días, esterilización antes de los 6 meses, seguimiento 6 meses, restitución) — **obligaciones que hoy nadie aceptó en ningún registro.** |

---

## ⑤ EL CUADRO EN UNA LÍNEA POR PUERTA

| puerta | ¿frena el código? | ¿lo dice la pantalla? |
|---|---|---|
| acta | ✅ sí, fail-closed por vigencia | 🔴 **no hay pantalla** (voz escrita, inalcanzable) |
| consentimiento | 🔴 no, y es **inexpresable** (CHECK cerrado) | 🔴 no |
| términos del refugio | 🔴 no (sólo rol activo) | 🔴 no hay pantalla |
| condiciones del adoptante | 🔴 no (un toque) | 🔴 no |

**La asimetría es la conclusión: la única puerta que frena es la última del
recorrido, y es la única que ninguna persona puede ver frenar.** Las tres que
la familia y el refugio *sí* van a ver —aceptar términos, aceptar condiciones,
consentir el tratamiento de sus datos— **no existen ni como fila ni como
pantalla**, mientras sus textos ya están publicados y rigiendo.

---

## ⑥ LO QUE MEDÍ Y NO ENTRA EN LAS CUATRO, PERO ES DE LA MISMA FAMILIA

- **`adopcion_documentos` es de lectura PÚBLICA**: su única policy es
  `adopcion_documentos_lectura SELECT USING (true)` y `anon` tiene SELECT sobre
  la tabla. **Lo ejercí con la anon key del bundle: HTTP 200.** Es coherente con
  que un contrato deba poder leerse antes de aceptarlo — lo registro porque es
  una decisión, no un descuido.
- **La vidriera sin sesión FUNCIONA, ejercida por camino real**:
  `POST /rest/v1/rpc/obtener_adoptables` con la anon key → **HTTP 200 `[]`**
  (vacío porque hay 0 publicaciones). **Con control negativo**:
  `obtener_mis_solicitudes_adopcion` con la misma clave → **HTTP 401
  `permission denied for function`**. *El `[]` no prueba nada solo; el 401 al
  lado prueba que la clave es realmente anónima y que el instrumento
  discrimina.*
