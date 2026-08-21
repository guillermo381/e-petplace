# ACTA DE CIERRE — S101-B / S101-C · **EL MOTOR DE PAGOS, DE PUNTA A PUNTA**

> **19 → 21 de agosto de 2026 · UNA SOLA PISTA · gate del founder VERDE COMPLETO.**
> Bitácora: `docs/loop/S101-B.md` (**contiene las dos**: S101-C nació sin corte
> de sesión y su relato vive ahí).
> **Esta acta se lee ANTES que el bloque de estado del canon, que es su resumen.**

---

## 🟢 EL VEREDICTO, con sus palabras

> **«se siente igual — una casa, un motor, dos puertas.»**

Paseo · despensa · los siete cambios de superficie · la animación **queda**.

---

## §1 · QUÉ QUEDÓ VIVO

| pieza | estado |
|---|---|
| Alta de tarjeta | ✅ página propia + Nuvei · alias · vencimiento · **3DS/OTP** |
| Cobro de **despensa** | ✅ punta a punta |
| Cobro de **servicios** | ✅ **los cuatro oficios** por el mismo motor |
| `confirmar_cita_pagada` | ☠️ **REVOCADA** — el rebote medido: `42501` |
| Buzón del webhook | ✅ **persiste antes de analizar** · `stoken` HMAC-SHA256 |
| Actuador | ✅ encendido · **conoce los dos sujetos** · solo `SERVER` + autenticado |
| Consulta activa + barrido | ✅ 12:00 y 16:15 America/Guayaquil · **confirma o escala, jamás rechaza** |
| Comprobante | ✅ email forzado · `ignora_techo` · **dice el concepto** · los dos códigos de certificación |
| Superficie de pago | ✅ **una pieza, dos puertas** — vigilada por `R57` |

**Operativo:** 375 migraciones **local = remoto, cero desemparejadas** · 4
typechecks en 0 · `verify:diseno` **VERDE con 49 reglas** · `verify-edge-simbolos`
**22 funciones, 0 símbolos sin importar** · WCAG **368/0**.

---

## §2 · LO QUE ESTA SESIÓN DEJA COMO MÉTODO

**Los frenos valieron más que el trabajo que frenaron.** Siete, y su reparto es
la parte interesante: **tres se disolvieron al medirlos y no costaron nada**;
los otros cuatro evitaron defectos **que no habrían tenido síntoma**.

| freno | qué evitó |
|---|---|
| el tiro único del `stoken` | quemar la única observación disponible |
| el `REVOKE` sin reemplazo | dejar a los cuatro oficios sin poder reservar |
| `medios[0]` como preselección | **resucitar el andamio de «la más reciente»** por la puerta de una cura de coherencia |
| «Volver a editar» | *se disolvió*: la flecha ya cancelaba los pedidos |
| la banda de «simulado» | **tres avisos honestos** convertidos en tres silencios falsos |
| la firma inventada de `crear_bloqueo_agenda` | un verde flojo **dentro del assert que existe para que no haya verdes flojos** |
| el instrumento mudo | creer que un `RAISE NOTICE` sin salida había medido algo |

> **Ninguno lo encontró leer código.** Los encontró **correr el camino real y
> abrir el crudo**.

**Las lecciones, depositadas con su literal:** `L-318` (motor sin puerta, las
cuatro apariciones **+ la variante del sujeto que se ignora**) · `L-319` (el
artefacto vs la materia prima) · `L-320` (el arnés que rodea un guard) ·
`L-321` (se prueba la defensa, no la lista) · `L-322` (sin baseline no hay «no
cambió») · `L-323` (`is_nullable` al censo) · `L-324` (un agregado siempre
contesta) · `L-325` (vocabulario cerrado no se amplía de paso) · `L-326`
(cuando el orden importa se escribe como cinturón).

---

## §3 · EL TABLERO

**Cierran:** `D-851` · `D-852` (**su premisa era falsa: el `vat` era nuestro**) ·
`D-853` · `D-854` · `D-855`.

**Quedan abiertas, con dueño:**

- **`D-856` 🟡 — plan · paquete · programa siguen simulados, y lo dicen.**
  *No es la deuda de `D-855`*: ahí la puerta se declaraba pagada con el motor
  real vivo al lado y sin decirlo; acá el aviso es cierto. **La letra la abre la
  mesa** — el enchufe técnico es el mismo motor, lo que no está resuelto es
  **qué se cobra cuándo** (un período, no una reserva).
- **`D-857` 🟢 — diez líneas de voseo**, medidas y sin tocar a propósito.

---

## §4 · SEGURIDAD — LA LISTA, EJECUTADA

| ítem | estado |
|---|---|
| `ARNES_SECRET` (filtrado en S101-A) | ☠️ **BORRADO de la plataforma** — verificado por listado |
| `pagos-addcard-stg` · `pagos-arnes-sandbox` | ☠️ **BORRADAS** (desplegadas y en el repo) |
| `.env.local` con `VERCEL_OIDC_TOKEN` | ☠️ **BORRADO** — estaba gitignored y **nunca trackeado** |
| Sesión CLI de Vercel | ✅ **cerrada** (`vercel whoami` → «Logged out») |
| Barrido de secretos en repo y bitácora | ✅ **0** JWT, **0** secretos literales |

🔴 **POR QUÉ SE BORRÓ EN VEZ DE ROTARSE:** `pagos-addcard-stg` era **un endpoint
público vivo, ya muerto** (el alta vive en la página de Vercel desde S101-B) y
**gateado solo por el secreto filtrado**. *Un secreto que no existe no se puede
filtrar, y un endpoint que no existe no se puede sondear.* Rotar habría dejado
las dos superficies en pie.

### 🔑 Pendiente de terceros — **NO ejecutable por la pista**

- **Rotación de `NUVEI_APP_KEY_SERVER`.** Firma cobros. **Dueño: founder con
  Erick.** *La clave CLIENT es pública por diseño y no entra acá.*
- **Credenciales de PRODUCCIÓN** (código y llaves nuevos). **Dueño: Erick, por
  correo**, cuando las funcionalidades cierren.

---

## §5 · LAS LLAVES EXTERNAS VIVAS

| qué | dueño | reloj |
|---|---|---|
| **Visto de Erick al comprobante** (los dos códigos ya van adentro) | Erick | requisito de **certificación** |
| **Rotación key SERVER** | founder + Erick | antes de producción |
| **Alexandra** — bloque comercial + contactos de reversos | founder | reloj real |
| **DeUna** | founder | **corte 11-sep** |
| **Ambiente productivo + host** | founder + Erick | **cuando las funcionalidades cierren** |

---

## §6 · SEMILLA DE APERTURA — LA SESIÓN SIGUIENTE

**Alcance decidido por el founder:**

### ① LA PASADA DE DISEÑO
- el **ocre** (la marca ② de la cola)
- **assets de franquicia** — ⚠️ hoy **no hay ninguno en el repo** y, por la regla
  de la orden, **todas las marcas caen al texto**. La pieza está hecha para que
  *el día que se depositen cambie el interior de la caja y nada más*.
- **las columnas del comprobante**, que se desalinean cuando el valor envuelve
- **`D-857`** — las diez de voseo
- lo que quede de la cola visual: la elegida inconfundible (L-b) · la sección
  que nace bajo el fold · la voz vieja del éxito

### ② `D-856` CON SU LETRA DE MESA
Plan · paquete · programa. **Letra antes que código.**

### ③ PRODUCCIÓN
Ambiente + credenciales nuevas + host. **Se abre cuando las funcionalidades
cierren y Erick mande las llaves por correo.** Hasta entonces: **sandbox de
punta a punta**, y eso está declarado en `DEFINICION_SOFTLAUNCH`.

---

## §7 · LO QUE HIZO POSIBLE LA SESIÓN

**El protocolo del founder, estrenado y sostenido:** *ninguna convocatoria sin
que la pista haya corrido antes el camino entero EN EL DISPOSITIVO.*

Se cumplió en las dos direcciones: **evitó traer defectos al gate** —el recuadro
partido, el botón disfrazado de campo, la fila que fingía— y **evitó frenar de
más**: tres de los siete frenos se disolvieron contra el objeto en cuanto se
midieron.

> *Un freno que resulta innecesario se disuelve contra el objeto, que es como
> tiene que terminar. Y uno que resulta necesario ahorra una sesión.*
