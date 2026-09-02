# S112-E · EL ESCENARIO DEL FOUNDER — el recorrido de §0, paso a paso

> **Para qué es esto:** que el founder agarre el teléfono y camine el vertical
> **sin preguntar nada** — qué cuenta, qué animal, qué toca, qué tiene que ver.
>
> **CONTRA QUÉ:** base viva + repo `main f704daa2`. **CUÁNDO:** **2-sep-2026,
> 00:55–01:20**. 🔴 **Este documento se vence:** A y C están construyendo
> mientras lo escribo. **La columna «qué pasa hoy» es del 2-sep a la 01:20** y se
> re-mide antes del lote.
>
> **No propongo curas. Cada paso que hoy no camina lleva LA PUERTA con nombre.**

---

## §0 · ANTES DE EMPEZAR — las cuatro cosas que tienen que ser verdad

*Sin estas cuatro el recorrido no arranca, y conviene saberlo antes de tener el
teléfono en la mano y no después.*

| # | qué | cómo se verifica | estado hoy |
|---|---|---|---|
| 1 | **el lote publicado** con `ADOPCION_ALCANZABLE` encendido | el pie de **Cuenta** dice `update <8 chars> · preview` y el id coincide con el group del lote | 🔴 **hoy el flag está en `false`** (`apps/cliente/src/lib/gate-adopcion.ts`) |
| 2 | **el teléfono lo aplicó** | abrir y cerrar la app **dos veces**; el pie de Cuenta cambia | ⚪ el aparato corre hoy el update `01a0600a…`, `embedded=false`, canal `preview` |
| 3 | **la cuenta de refugio existe y publica** | ver §1 | ✅ **existe**: `Refugio de prueba Satori`, cuenta `80c41ac7`, **activa**, rol refugio **activo** |
| 4 | **hay animales publicados** | la vidriera devuelve filas | ✅ **los cinco, sembrados el 2-sep por las puertas reales**: Luna · Nube · Tito (urgente) · Bruno publicados, **Kira en borrador**. 🔴 **pero NINGUNO tiene foto** — ver §2 paso 9 |

---

## §1 · LAS DOS CUENTAS Y EL ANIMAL

**Como refugio — app `e-PetPlace Negocios` (`com.epetplace.prestador`):**
- correo **`guillo381+refugio@gmail.com`**
- ⚠️ **tiene clave PROPIA, no la compartida de las cuentas de prueba** — medido:
  `+8`, `+7` y `+9` entran con la compartida, **el refugio rebota `Invalid login
  credentials`**. *La dictó el founder y A la tiene; verificada por camino real
  (login OK, user `632727a3`).* **No se transcribe acá a propósito: una clave
  viva escrita en un documento del repo es el defecto que `D-712` ya cobró en
  esta casa.**
- es titular de la cuenta comercial **`Refugio de prueba Satori`** (`80c41ac7-c39e-44b2-9d70-fd4f9816b521`), **estado `activa`**, con **rol `refugio` activo** — *medido, no supuesto.*

**Como familia — app cliente (`com.epetplace.cliente`):**
- **una cuenta NUEVA**, creada durante el recorrido en el paso 10. **No reusar
  `guillo381+8`**: ya tiene mascotas y 27 consentimientos, y **el paso 11 (aceptar
  las condiciones «una sola vez en la vida de la cuenta») no se puede ver dos
  veces.** *Una cuenta usada esconde justo el paso que hay que mirar.*

**El animal: LUNA**, la que A siembra en A6. *§0 la nombra en los pasos 3, 9, 10
y 15; el recorrido entero cuelga de que sea la misma en los cinco lugares.*

---

## §2 · EL RECORRIDO — 20 pasos

### Como refugio (app de negocios)

| # | qué hace el founder | qué tiene que ver | **qué pasa hoy · LA PUERTA** |
|---|---|---|---|
| 1 | Entra con `guillo381+refugio@gmail.com` | la pantalla de **sus** términos (los del refugio), con «Acepto» apagado hasta ver todo | ✅ **MOTOR VERDE (2-sep 14:40)** — `obtener_contexto_alarranque` devuelve la rama `refugio` (`tipo:organizacion · estado:activa · puede_publicar:true`) y **`obtener_mi_cuenta_refugio` existe y responde**. Falta la **pantalla** de sus términos — C. *(lo de abajo quedó vencido y se conserva para que se vea qué cambió)* ~~🔴 `obtener_contexto_arranque` no menciona «refugio» en sus 4 757 caracteres~~ ⇒ la cuenta no cae en ninguna rama y aterriza en *«Tu cuenta no tiene un negocio asociado»* con «Cerrar sesión» como única acción. **PUERTA: la rama refugio del arranque + `obtener_mi_cuenta_refugio` (no existe) — A.** ✅ *El motor de la aceptación sí está listo:* `aceptar_documento_adopcion('terminos_refugio')` corre, y `terminos_refugio v2` está vigente |
| 2 | Ve **tres tabs: Home · Mascotas · Cuenta**, y Home dice cuántas solicitudes hay | tres tabs, ni una más | 🔴 hoy el prestador dibuja **siete** (`index · mascotas · atender · negocio · cuenta · pedidos · gallery`). **PUERTA: la composición por rol de `(tabs)/_layout.tsx` — C.** |
| 3 | En **Mascotas** ve a Luna, Nube, Tito, Bruno publicados y **Kira en borrador con su razón** | la razón visible: *«adulta sin esterilizar»* | ⛔ la tab Mascotas del refugio no existe. **PUERTA: B las piezas, C la pantalla.** |
| 4 | **Publica un sexto animal**: ficha completa, fotos, interruptor «publicado» | la ficha con sus 14 campos | 🟡 **el motor está**: `publicar_adoptable(mascota, cuenta, ingresado_en, ficha)` acepta zona, señas, origen, vacunal, desparasitado, urgente, bono, historia y convivencia ×3. **Faltan: la pantalla (C) y la subida de fotos** — 🔴 **`adopcion-fotos` tiene INSERT y DELETE en `is_admin()`: un refugio NO puede subir una foto ahí. PUERTA: las policies de ese bucket — A.** |
| 5 | Le carga **una vacuna con lote** al expediente **antes de que tenga familia** | el evento en la línea de vida del animal | 🟡 N6 ya es real en el motor: `publicar_adoptable` **exige que la mascota tenga familia** (`mascota_sin_familia` rebota) ⇒ *el refugio es la familia hasta la entrega*, que es la forma que N6 firmó. **Falta la puerta de «Cargar al expediente» desde la ficha del refugio — C.** |
| 6 | Recibe una solicitud, abre el hilo, conversa, **acepta** | el solicitante, sus respuestas, el hilo, y aceptar con doble confirmación | 🟡 **el motor del hilo está entero** (7 funciones de D, RLS probada en rojo). **Faltan las pantallas — C.** ⛔ **y las «respuestas del formulario» no existen todavía**: `crear_solicitud_adopcion` sigue tomando 2 parámetros y `adopcion_solicitud` no tiene ninguna columna de respuestas. **PUERTA: el formulario — A → C.** |
| 7 | Ve el acta con **todos los datos puestos**, pide el código, lo recibe en su correo, **firma** | el acta renderizada y el estado *«Firmaste · falta la firma de la familia»* | ⛔ **nada de esto existe**: no hay `adopcion_firma`, no hay `adopcion_acta`, **no hay ninguna tabla con «firma» en el nombre**, y no existen `obtener_acta_adopcion`, `solicitar_codigo_firma` ni `firmar_acta_adopcion`. **PUERTA: la firma probatoria — A → C.** ✅ *Lo que sí está: la plantilla `acta_adopcion v1`, vigente, `sha256 f788d883…`, con sus 22 variables — de las cuales **7 no tienen de dónde salir** (ver `S112-E-para-A-CENSO-ACTA.md`).* |

### Como familia (app cliente)

| # | qué hace el founder | qué tiene que ver | **qué pasa hoy · LA PUERTA** |
|---|---|---|---|
| 8 | **Sin cuenta**, desde el login toca «Ver mascotas en adopción» | la lista: arriba los que más esperan con su porqué, abajo el resto | ✅ **el botón existe y NO está detrás de `ADOPCION_ALCANZABLE`** (`login.tsx:307`, va a `/adoptar`) ⇒ **viaja vivo en el próximo lote sin que el flag lo cubra.** *Se declara para que nadie lo descubra en el aparato.* ✅ el motor responde a `anon`: **3 destacados + 2 resto, con cursor** |
| 9 | Abre la ficha de Luna: **fotos**, semáforo, convivencia, historia, ubicación, quién publica con nombre y cara, «Apadrinar» con su «pronto» | fotos grandes deslizables | 🔴 **NO VA A VER NINGUNA FOTO — y la causa CAMBIÓ (2-sep 15:00).** La policy **se curó y funciona** (probada con su par: anon baja la portada de un publicado, se le niega la de un no-publicado). Lo que falta ahora es otra cosa: **los cinco animales no tienen ninguna foto cargada** (`foto_url` nulo y galería en 0). *Dos causas distintas con el mismo síntoma: si sólo se recuerda «la policy se curó», esto va a fallar igual y va a parecer que la cura no sirvió.* **PUERTA: cargarle fotos a la siembra — A**, y el acto de subir ya funciona (probado como el refugio). *(vencido, se conserva)* ~~la policy no puede dar verdadero nunca~~ La policy `mascotas_select_vidriera_anon` **no puede dar verdadero nunca**: gatea a `anon` preguntando por filas de tres tablas que `anon` no puede leer, así que el `EXISTS` se evalúa bajo RLS y da falso. *Medido desde los dos asientos: `true` como superusuario, `false` como anon.* **PUERTA: esa policy — A.** 🟠 y aun curada, **hoy sólo hay UNA foto por animal** (`mascotas.foto_url`): la galería deslizable no tiene motor |
| 10 | Toca «Quiero adoptar a Luna» → crea cuenta → elige «no tengo mascota, quiero adoptar» → **vuelve a donde estaba**, no al home | volver a la ficha de Luna | 🟡 `/adoptar` existe; la vuelta al punto de partida es de C |
| 11 | Lee y **acepta las condiciones** (una sola vez en la vida de la cuenta) | «Acepto y continúo» apagado con razón hasta ver todo | ✅ **el motor está y es el ejemplar de la casa**: `aceptar_documento_adopcion` toma la IP **del servidor**, la guarda **hasheada**, y si el header no llega **deja NULL y lo dice** (`ip_capturada:false`); guarda `documento_sha256` + versión; es idempotente. `condiciones_adopcion v2` vigente. **Falta la pantalla — C.** |
| 12 | Llena el formulario (**hogar por rangos de edad, sin nombres de menores**), marca el consentimiento, envía | «Enviada» y la promesa del reloj | ✅ **EL MOTOR ESTÁ (2-sep):** `crear_solicitud_adopcion(publicacion, respuestas, aceptacion_id, mensaje)` con **esquema cerrado ejercido** — `hogar.nombre_menor`, `hogar.edad_menor` y cualquier clave de más rebotan **nombrando la clave**, y el formulario válido pasa (control positivo corrido primero). **Y el techo N1: la cuarta solicitud rebota con `tope_de_solicitudes: 3`.** ✅ el reloj de 5 días **ya corrió**: cron 48, 2-sep 14:00 UTC, `succeeded`. **Falta la PANTALLA — C** |
| 13 | Recibe el aviso de que el refugio respondió; conversa | el aviso y el hilo | 🟡 motor de D listo; los cinco avisos de N3 son de D |
| 14 | Cuando el refugio acepta, ve el acta, pide su código, **carga cédula y domicilio si faltan**, firma | la lista de faltantes con nombre: «Falta tu cédula» | ⛔ como el paso 7 |
| 15 | **Con las dos firmas:** hito «Una vida nueva empieza», Luna en su familia **con la vacuna que cargó el refugio**, y **procedencia: Refugio X** | los tres hechos | ✅ **EL MOTOR ESTÁ VERDE (2-sep 16:00), ejercido sobre Luna por camino real:** el traspaso completa · `user_id` reapunta al titular destino · **la familia la ve** · **ve sus 2 eventos** (la vacuna del refugio + la procedencia) · **el refugio deja de verla** · y **un tercero tampoco** (control negativo). **`D-485` curado.** 🔴 **Lo que falta para que el founder llegue acá es la FIRMA** — sin motor: no existen `obtener_acta_adopcion`, `solicitar_codigo_firma` ni `firmar_acta_adopcion`, y el traspaso lo dispara la segunda firma, no la pantalla |

### Los rojos que el founder también tiene que ver

| # | qué | **qué pasa hoy · LA PUERTA** |
|---|---|---|
| 16 | **Kira no se puede publicar y el interruptor dice por qué** | ⛔ la tab Mascotas no existe. ✅ el motor **sí sabe negarse hablando**: `publicar_adoptable` rebota `cuenta_no_activa`, `mascota_sin_familia`, `ingresado_en_requerido` — **pero la regla «adulta sin esterilizar» no la vi en su cuerpo. PUERTA: A.** |
| 17 | **Un código vencido o equivocado no firma y lo dice** | ⛔ no hay firma. *Los seis rojos de §5.5 están escritos con sus fixtures en `S112-E-para-A-TRASPASO-ESTADO.md` §③ — **no se re-inventan**.* |
| 18 | **Desde una segunda cuenta de familia no ve la solicitud de la primera ni su hilo** | 🟡 D lo probó en rojo para el hilo. **Yo no lo repito de memoria**: lo corro cuando exista una solicitud viva |
| 19 | **Sin sesión, la vidriera no muestra teléfono ni dirección de ningún refugio** | ✅ **VERDE MEDIDO.** Las 37 claves de la tarjeta y las 36 de la vista: **ninguna prohibida**. Control negativo al lado: `anon` sobre `adopcion_publicacion`, `mascotas`, `cuentas_comerciales` y `prestadores` → **0 filas en las cuatro** |
| 20 | **El botón apagado dice siempre por qué; nunca hay un botón gris mudo** | 🟡 es el gate `razon-muda` a 141 por ocurrencia — de A y C |

---

## §3 · EL RESUMEN QUE EL FOUNDER NECESITA EN UNA LÍNEA

**De los 20 pasos, hoy caminan tres y medio:** el botón del login (8), el motor
de la lista sin sesión (8-9 **sin fotos**), la aceptación de documentos (11) y la
promesa del reloj (12, con su cron sin estrenar).

**Los tres que bloquean el recorrido entero, en orden:**

1. **La rama refugio del arranque** (paso 1) — sin eso **el founder no entra** y
   los pasos 1-7 no existen.
2. **La policy de las fotos** (paso 9) — sin eso la vidriera es **una grilla de
   huellas grises**, que es exactamente lo que §4 prohíbe.
3. **`D-485`** (paso 15) — sin eso **la adopción no termina**: la familia no ve a
   su mascota y el refugio la sigue viendo.

*Los otros nueve pasos que faltan son piezas por construir, con dueño y sin
sorpresas. Estos tres son distintos: los tres están **construidos y no funcionan**,
y los tres se ven bien desde el asiento equivocado.*

---

## §4 · CÓMO SE VUELVE A CORRER ESTO

Cuando A cierre A9 y C cierre C8, **este documento se re-mide entero** y cada
🔴 se vuelve a probar por camino real. **El aparato está disponible**: `adb`
responde, el teléfono del founder está conectado por USB
(`R5CY201ZDVL · SM-S938B`), **`screencap` e `input` funcionan**, y las dos apps
están instaladas en **1.0.7** ⇒ **E3 y E4 se pueden correr en el aparato con una
captura por paso**, sin que el founder tenga que ir describiendo lo que ve.
