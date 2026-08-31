# S107 · PISTA D — TRASPASO DE CIERRE

> **El módulo de media y el transporte de la guardería.** 28–30 ago 2026.
> Rama `pista/s107-d`. **Autocontenido a propósito:** quien lo lea sin haber
> estado puede retomar sin abrir el parte largo (`docs/loop/S107-D.md`).
>
> 🔴 **LO PRIMERO, PORQUE NO SE DISIMULA: el HECHO de esta pista SIGUE
> ABIERTO.** Todo está construido, cableado y verde — **pero el gate nunca se
> corrió**, y hasta que se corra nadie ha visto una foto llegar a un teléfono.
> La condición exacta está en §④, y **no es la que todos suponían.**

---

## ① LO CONSTRUIDO — y todo verificado contra el objeto, no contra el contrato

| pieza | dónde | estado |
|---|---|---|
| **Captura** (foto + clip, con sus parámetros declarados) | `use-captura-media.ts` | foto **0.7 / 1600 px** (el 1600 es el número que la casa midió en `D-734`); clip **720p en captura** — la vía que hace que todo esto viaje **por OTA** |
| **El encuadre como CÓDIGO, jamás como texto** | `encuadre.ts` | las cuatro reglas del criterio §5 como claves; **la voz la pone C**. Se modula por lugar **salvo las dos duras: menores y personas rigen siempre** |
| **Cola persistente** | `cola-media.ts` | sobrevive al cierre de la app · backoff 5 s→20 m · **nunca descarta sola** lo no publicado · el techo del clip vive **en la puerta** |
| **Subida y publicación** | `motor-media.ts` + `guarderia-cableado.ts` | dos pasos con huérfano recuperable; **una media, N etiquetas** |
| **Acta en la puerta** | `cola-actas.ts` | existe **con o sin señal**, viaja con **la hora de la puerta** |
| **Punto vivo sin traza** | `use-punto-vivo.ts` | capta y **no acumula** |
| **El peso, medido y no estimado** | `pesoMedido()` | sale del byte que **realmente** se subió; sin capturas devuelve **ausencia, no `0 MB`** |

**Verde al cierre:** typecheck `0` · arneses **27/27** y **13/13**, los dos con
**su rojo producido** · `verify:diseno` **60 reglas** · voseo **0**.

**Los cuatro puntos de inyección, cableados y verificados contra la función
viva:** `publicar_media_guarderia` (idempotente, `ya_existia`) ·
`levantar_acta_guarderia` (idempotente por `(estadia, direccion)`) ·
`registrar_punto_vivo` (**`ON CONFLICT` sobre PK `tramo_id`** — pisa, no
acumula).

---

## ② EL RETIRO DE `avisar` — el quinto punto no se cableó

La orden fue cablearlo. **La medición dijo otra cosa y se siguió la medición:**
`encolar_resumen_media_guarderia()` **no recibe argumentos**, la corre un **cron
cada 15 min**, y `20260829190000_s107a_digest_acl` **revocó `authenticated`** de
ella, a propósito.

⇒ **La app no tiene puerta y no debe tenerla.** El disparo desde el cliente no
está cerrado por ahora: **sobra** — *dos teléfonos subiendo media del mismo
animal no pueden coordinar un digest entre ellos; agrupa el servidor o no
agrupa nadie.* **El servidor agrupa.**

☠️ **Retirado con lápida en vez de dejarse en `null`:** *un puente que sobrevive
a su río manda al próximo a construir otro* (`L-395`). Las lápidas viven en
`motor-media.ts` y `guarderia-cableado.ts`, con la medición adentro.

🔑 **Y las dos reglas del aviso quedaron cumplidas POR CONSTRUCCIÓN, no por
disciplina:** el aviso no dice el número y diez fotos son un aviso **porque esta
app no compone ninguna voz ni cuenta nada**. *La forma más segura de no escribir
«3 fotos» es no tener dónde escribirlo.*

---

## ③ LAS FICHAS DE ESTA PISTA

- **`D-958`** 🟠 — **el paseo es grupal por norma desde S59 y su foto de grupo
  llega a un solo dueño.** Salió de medir el motor del paseo para la guardería:
  `evento_padre_id` es NOT NULL y la atención es mono-animal (**4 filas · 4
  paths · `0` compartidos** en toda la base). *No falló nunca porque nadie fue a
  mirar: la estructura no se rompió, no se la ejerció.* **Condición de muerte:
  migra cuando exista `guarderia_media`** — que ya existe.
- **`D-970`** 🟡 — **el default de `resumen` se escribió para otro volumen.**
  Nace de medir que `default_habilitada = false` + `preferencia_efectiva` ⇒ **el
  digest no le llegaba a nadie, en silencio**. Se separó en dos actos a
  propósito: ① habilitar sólo las cuentas del gate · ② la decisión del default, a
  la mesa. ***Un default de privacidad no se cambia para que un gate salga
  verde.***

---

## ④ 🔴 LO QUE FALTA — el gate, con su condición EXACTA

**El gate de `docs/loop/S107-D.md` §⑤duodecies NO SE CORRIÓ.** Está listo:
**ocho pruebas con su discriminador**, **cuatro precondiciones firmadas**, **el
orden adoptado**, y la **prueba ① reetiquetada como de iOS** (en Android el
texto del prompt lo escribe el sistema operativo — no es un pendiente, es otra
plataforma).

> ### 🔴 NO ESPERA UNA BUILD. Eso se midió y era falso.
>
> Durante días el plan dijo que el módulo obligaba a un binario nuevo por el
> **permiso de micrófono**. **Medido:** el micrófono está declarado desde
> **S63** y las builds del 24-ago ya lo llevaban horneado; A verificó además el
> APK instalado del founder — `geo.API_KEY`, `google_app_id`, los seis permisos
> y la sonda nativa. **No falta ninguna build.**

**Lo que el gate espera es DATO, y es lo único que lo separa del HECHO:**

1. **Una estadía real en curso**, con **tramo abierto** (`recogida_en_curso` /
   `retorno_en_curso`) — sin eso el punto vivo devuelve `null` **por diseño**.
2. **DOS animales de DUEÑOS DISTINTOS.** 🔴 *Con dos del mismo dueño la prueba
   de la foto grupal se ve idéntica en el caso bueno y en el malo: **no
   discrimina, y es justo el defecto que busca**.*
3. Esos dueños **entre las cuatro cuentas sembradas** en `resumen`/`in_app`.

**El orden de hoy (Android): 2 → 3 → 6 → 4 → 5 → 8 → 7.** Las capturas **antes**
del modo avión —*matar la app con la cola vacía no prueba nada*— y **la 8 se
dispara temprano y se verifica al final**, porque su reloj son 15 minutos.

**Los tres falsos rojos declarados, para que nadie anote como defecto lo que es
diseño:** el teléfono **no va a sonar** (el aviso llega `in_app`) · fuera de las
cuatro cuentas **el digest no llega a nadie** · y **la cola persiste pero no
sube con la app cerrada** (eso exigiría un módulo nativo).

---

## ⑤ LO QUE SERVÍ Y NO DECIDÍ

- ✅ **El corte de la media por acta — CURADO POR A, verificado hoy contra el
  objeto.** Medido el 30-ago: `obtener_acta_guarderia` devolvía **toda** la
  media de la estadía sin filtro de dirección ni temporal ⇒ **las dos actas
  mostraban las mismas fotos**, y *el acta perdía su único trabajo: decir
  **cuándo** apareció algo.* Se sirvió el corte mínimo —`capturada_en` +
  `cerrada_en`, **sin columna nueva ni tabla puente**— y **así entró**.
- ✅ **La enmienda del aviso al guion:** llega por **`in_app`, no push**, y
  **hasta 15 min después**. *Un gate que espere una push inmediata anota como
  falla la cadencia normal de un digest* — el falso negativo exacto que el
  guion existe para evitar.
- 🟡 **Y una que sigue abierta y es de A/mesa:** `levantar_acta_guarderia`
  resuelve su idempotencia **sin `ON CONFLICT`** (mira antes de insertar) ⇒
  **ventana de carrera** si dos personas levantaran la misma acta a la vez.
  **Para esta cola no aplica** —un teléfono, secuencial— y por eso se **declara
  y no se pide**.

---

## ⑥ PARA QUIEN RETOME

1. **Correr el gate** (§⑤duodecies del parte largo) apenas haya una estadía real
   con dos dueños distintos. **Es lo único entre esta pista y su HECHO.**
2. **`D-958`**: el paseo ya tiene a dónde migrar su foto de grupo.
3. **`D-970`**: la decisión del default de `resumen`, en la mesa.
4. ⚠️ **Las tres cadenas de permiso siguen ABIERTAS** hasta que alguien las lea
   en un prompt nativo **de iOS** — no viajan por OTA y en Android no se leen.
