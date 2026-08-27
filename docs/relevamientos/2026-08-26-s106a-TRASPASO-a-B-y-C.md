# TRASPASO DE A → B y C · S106 tanda 3

**26-ago-2026.** Todo lo de acá está **en `main`** y verificado por contenido.
Si algo de esto se midió antes de los shas que se citan, la medición era
correcta **y ya está vieja**.

---

## 🟢 PARA C — cuatro cosas que ya no bloquean

### ① Los consejos de preparación: **DEPOSITADOS** (`a55c6886`)

Viven en **`docs/LETRA_TELEMEDICINA.md` §3bis**, verbatim, con sus tres reglas
al lado. C construyó contra el prompt y el objeto ya lo tiene — **coinciden**,
pero de ahora en más la fuente es la letra.

⚠️ Una regla que conviene no perder al montar: **NO lleva casilla.** El
consentimiento ya tiene su acto propio por firma legal; *una segunda casilla
diluye la única que importa jurídicamente.*

### ② El código tipado de certificación: **YA EXISTÍA** (`f977b38b`)

🔴 **No nace uno nuevo, y C hizo bien en no rodearlo** — inferir «no estás
verificado» de un `acceso_denegado` es adivinar por qué se cerró una puerta.

Lo que el censo encontró es que **el gate era ley desde S79**, de punta a punta:

| pieza | estado |
|---|---|
| `trg_ps_verificacion_profesional` | cableado, BEFORE INSERT OR UPDATE OF `activo, tipo_servicio` |
| `tipos_servicio.telemedicina.requiere_validacion_admin` | `true` |
| `guardarServicioVeterinaria` | **ya mapea** `verificacion_profesional_pendiente` |
| `voz-error-vet.ts:152` | **ya tiene la voz** |

**El código a consumir es `verificacion_profesional_pendiente`.**

Y lo que faltaba —y es lo que se construyó— es **poder preguntar antes de
chocar**:

```ts
import { prestadorTieneVerificacionProfesional } from '@epetplace/api';
```

- su **`false` es un requisito pendiente, JAMÁS un permiso denegado**: la voz
  nombra el camino («subí tu título o tu registro»), nunca «no tienes acceso».
  *Confundir un trámite con una prohibición manda al vet a discutir permisos
  que nadie le quitó.*
- su **`true` dice «tiene el documento aprobado»**, jamás «puede activar»: los
  mínimos §6 son otra condición, y la mide `prestadorAceptoMinimos`.
- un `null` del server **no se degrada a `false`** — el wrapper devuelve
  `datos_inconsistentes`.

### ③ `modalidad`, en los **tres** lectores (`f11155c6` · `9110c1ac`)

- `leerCitaResuelta` → `modalidad: ModalidadCita | null`
- `leerTimelineMascota` / `leerTimelineHogar` → `ItemTimeline.modalidad`
- `obtenerParteConsulta` → `ParteConsulta.modalidad`

🔴 **Los tres devuelven el código del MOTOR (`'telemedicina'`), no el de la
pieza (`'teleconsulta'`).** La voz es de la pantalla (Ley 3), igual que
`tipoServicio` y `vacuna_nombre`. El mapeo es de C.

Vocabulario completo del motor: `presencial · telemedicina · domicilio ·
emergencia_movil · local`. **`null` es legítimo** (citas viejas sin modalidad):
*pintar `presencial` por ellas sería inventar.*

### ④ `tipos_servicio.telemedicina.nombre` = **«Teleconsulta»**

Medido. Es la palabra de la letra, no un tecnicismo ni un provisorio.
Descripción: *«Consulta veterinaria virtual»*. **No hay que corregir nada
antes del gate.**

---

## 🟢 PARA LA MESA — ④ del encargo anterior: **el vet SÍ se entera**

`confirmar_cita_pagada` emite **dos** avisos del mismo instante, y el segundo
es al negocio: `cita_solicitada` → `prestadores.user_id`. **Sin ninguna rama
por tipo de servicio** ⇒ la teleconsulta viaja por el mismo camino.

Y ejercido, no supuesto (L-402):

- `cat_notificacion_tipos.cita_solicitada` → `en_sombra = **false**`,
  `activo = true`, `audiencia = prestador`
- `notificacion_config` → `despacho_activo = true` en los 8 alcances
- **las NUEVE citas de telemedicina sembradas tienen su aviso en `entregada`**,
  la última hoy 20:18

⚠️ **La prosa del motor está vencida:** el comentario dentro de
`confirmar_cita_pagada` dice *«los dos tipos siguen EN SOMBRA»* — es cierto
para S89 y **falso hoy**. Se declara acá; no se toca el cuerpo en esta tanda.

⚠️ **El límite real, medido, y NO es de telemedicina:** el aviso va a
`pr.user_id`, o sea **al TITULAR y a nadie más**. En una clínica con varios
veterinarios, el que va a atender no recibe nada si no es el titular. Vale
igual para los cinco oficios. → **`D-939`**.

---

## 🔴 PARA B — el discriminador de «girar cámara», y descarta tu hipótesis

**Tu hipótesis era: la voz vive en el namespace `veterinaria` y la pantalla es
del cliente ⇒ si `t('veterinaria.vcVozGirar')` no resuelve, un control con
etiqueta vacía podría no montarse.**

Medido contra `main`, y **es falsa**:

| | |
|---|---|
| `apps/cliente/src/i18n/es.ts:992` | `vcVozGirar: 'Girar cámara'` ✅ |
| `apps/prestador/src/i18n/es.ts:2745` | `vcVozGirar: 'Girar cámara'` ✅ |

Y hay un argumento estructural encima del grep: **el riel tiene keys tipadas
exigibles** — una clave inexistente rompe el typecheck, y los cuatro están en
0. *Una voz que no resuelve no podía haber llegado a compilar.*

Lo demás del camino, también medido:

- `SuperficieLlamada.tsx:231` dibuja el control **sin condicional** — no hay
  `&&`, y `onGirarCamara` es prop **obligatoria**, no opcional.
- `ControlLlamada` lo pinta con `backgroundColor: sobreVideo.disco` + anillo, y
  el glifo con `fill` y `stroke` que son **dos colores reales** (`contenido`
  sobre `disco`): no es un dibujo transparente.
- El literal del path viaja: `M8.5 13.2a3.6 3.6 0 0 1 6.2-2.2` está en
  `ControlLlamada.tsx` en `main`. *(El APK del gate ya no está en disco y el
  teléfono no está conectado, así que el grep sobre el bundle instalado no se
  pudo repetir hoy — el de la sesión anterior dio **1 ocurrencia**.)*

### 🔴 Y lo que sí encontré, que es nuevo y es medible

En **`apps/prestador/src/app/videollamada/[citaId].tsx`**, `ModalDosAlturas` se
monta como **hermano de `SuperficieLlamada` y DESPUÉS de ella**. Los controles
viven en `position: absolute; bottom: 0` ⇒ **el modal pinta encima de la fila
de controles.**

> *No es una hipótesis sobre el render: es el orden de montaje, y se lee en
> veinte líneas del archivo.*

Lo que **no** explica todavía —y por eso te lo paso a vos en vez de curarlo—:
el founder sí pudo colgar, y `colgar` está en esa misma fila. Puede ser que el
modal en altura `medio` tape sólo parte del ancho, o que el reporte sea del
cliente y no del prestador. **Eso lo discrimina una captura, no un grep.**

---

## Números y fichas

- **`D-939`** — el aviso de cita nueva llega **sólo al titular**, no al
  profesional que va a atender. Transversal a los cinco oficios, no de
  telemedicina. *(Reservada por A; C ya anotó `D-940` respetándola.)*
- Migraciones de esta tanda: `20260826400000` · `410000` · `420000` · `430000`,
  las cuatro con reversa escrita antes y cinturón que **ejerce**.
