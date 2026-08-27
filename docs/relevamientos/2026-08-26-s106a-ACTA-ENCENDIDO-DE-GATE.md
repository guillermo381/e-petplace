# ACTA · ENCENDIDO DE LA LLAVE PARA EL GATE DEL RECORRIDO COMPLETO

**26-ago-2026 · Pista A · S106 tanda 3.**
Procedimiento: `docs/relevamientos/2026-08-26-s106a-COREOGRAFIA-DE-LA-LLAVE.md`.

---

## §1 · La orden

**Firma del founder**, por la mesa, 26-ago ~21:40 Guayaquil, cambiando una orden
anterior:

> *«NO acuñes cita de prueba. Quiere hacerlo LITERAL como lo haría un prestador
> y un cliente, de punta a punta, con la llave encendida.»*

Ejecuta **A**, por esa orden explícita ⇒ **esta acta es obligatoria** (§3 de la
coreografía).

---

## §2 · Verificación previa — medida, no heredada

Re-corrida contra el objeto a las **21:45**, no reusada de la medición de la
tarde (L-166):

| | |
|---|---|
| **quién publica telemedicina** | **`Clínica Aurora` y nadie más** — `activo=true`, `reservable=true` |
| la llave, antes | `tipos_servicio.telemedicina.reservable = **false**` |
| línea base | **9** citas con `modalidad='telemedicina'`, la última 26/08 20:18 |
| verificación profesional de Aurora | `true` (tiene `titulo_profesional` y `registro_senescyt` aprobados) |

🟢 **La premisa que vuelve aceptable la ventana se sostiene:** ningún prestador
real publica teleconsulta. La exposición es de una clínica de prueba.

---

## §3 · Lo que se tocó, con su estado previo entero

Además de la llave hubo que **preparar el terreno**, porque el recorrido que el
founder quiere caminar no era caminable tal como estaba. Todo queda acá con su
valor anterior para poder restaurarlo.

### ① LA LLAVE
```
tipos_servicio.telemedicina.reservable :  false → true      (21:48)
```

### ② La franja de esta noche — **fila AGREGADA, nada modificado**
Aurora cierra **22:00** y eran las **21:46**: una teleconsulta de 20 min ya no
entraba hoy. *Se agregó una fila en vez de estirar las existentes, para que
revertir sea borrar una fila y no recordar tres valores.*

```
prestador_horarios  +1 fila:  Aurora · dia_semana=3 · 22:00 → 23:59
                              (duración de slot y cupo copiados de sus otras filas del miércoles)
```

Medido después de agregarla, con el JWT real del founder:
**inicios de hoy disponibles → `22:00` · `22:30` · `23:00`.**

### ③ 🔴 El estado del VET, retrocedido — y esto es lo delicado

El founder pidió caminar *«ve los mínimos §6, los acepta, activa el servicio»*.
**Medido: los tres pasos ya estaban hechos** ⇒ habría encontrado telemedicina
prendida y esos pasos no habrían existido.

*No es un dato de prueba que estorba: es el residuo de que la mesa ya usó esa
clínica. Dejarlo habría convertido el gate en una lectura de pantalla en vez de
un recorrido.*

**Filas capturadas ENTERAS antes de tocarlas:**

```json
minimos_aceptados = {"id":"a513b807-c39c-4bd9-bba2-14f07aabd4ba",
  "version":"letra-telemedicina-v1.1",
  "aceptado_en":"2026-08-26T16:23:30.47994+00:00",
  "aceptado_por":"4f572081-26a5-4d3b-9d80-25ea751fdc9c",
  "prestador_id":"de680000-0000-4000-8000-0000000000e5",
  "servicio_codigo":"telemedicina"}

oferta = {"id":"13733856-f23a-4e18-82ab-a0a74cf91b18","activo":true,
  "precio":30.00,"reservable":true,"duracion_minutos":20,
  "atiende_local":true,"atiende_domicilio":false,
  "prestador_id":"de680000-0000-4000-8000-0000000000e5",
  "tipo_servicio":"telemedicina", …}
```

**Cambios:**
```
prestador_servicios.activo (Aurora · telemedicina) :  true → false
prestador_minimos_aceptados (Aurora · telemedicina):  1 fila → BORRADA
```

⚠️ **La fila de mínimos borrada era una aceptación de la versión
`letra-telemedicina-v1.1`, del 26/08 11:23.** *Se borra a sabiendas de que es
una declaración y no un dato cualquiera* — la reemplaza la aceptación real que
el founder haga ahora, del mismo profesional y sobre la misma versión. Si el
recorrido no se completa, **se restaura desde el JSON de arriba.**

---

## §4 · 🔴 LA VENTANA SE CANCELA — LA LLAVE QUEDA ENCENDIDA

**Firma del founder, 26-ago ~22:30 Guayaquil.** Deroga la §4 anterior y **el
criterio de apagado de toda la coreografía**.

```
ABRE  : 2026-08-26 21:48 Guayaquil
CIERRA: ~~al terminar el gate~~  →  **CUANDO HAYA USUARIOS REALES**
```

**Lo que decía y ya no rige** (tachado, no borrado, para que se vea qué cambió):

> ~~«Cuánto dura: lo que dure el recorrido. No se deja encendida "hasta mañana"
> — una llave que pasa la noche encendida es una llave que alguien va a
> encontrar encendida sin saber por qué.»~~

**Por qué se deroga, y la razón es de hecho, no de preferencia:** *la app no
tiene usuarios reales hasta el friends-and-family de octubre.* La coreografía
suponía que encender exponía el oficio a terceros; **medido, no hay terceros a
quién exponer.** El único negocio que publica teleconsulta es la clínica demo,
y quien reserva es el founder.

⇒ **`tipos_servicio.telemedicina.reservable` QUEDA EN `true`**, y **la franja
de esta noche también**. El founder sigue probando.

### 🔴 EL NUEVO CRITERIO DE APAGADO

> **La llave se apaga cuando haya usuarios reales** — el friends-and-family de
> octubre, o antes si entra cualquier familia que no sea del equipo.

**Y en ese momento vuelven a regir las precondiciones del estreno**, que esta
firma NO toca (§6): consentimiento verificado en fila + respuesta del abogado a
la pregunta 1 de `LETRA_TELEMEDICINA` §10.

⚠️ **Esto se escribe acá, en el acta, y NO sólo en el parte** — *un
procedimiento que dice «apagá al terminar» lo obedece la próxima sesión sin
saber que la mesa lo derogó, y apagaría la llave en medio de las pruebas del
founder.* Misma disciplina que las enmiendas del canon: la letra derogada se
saca de la sección que alguien lee.

---

## §5 · Limpieza para la vuelta siguiente (26-ago 22:38)

Pedido: dejar libre el horario para reservar de cero otra vez.

**Lo que se hizo, y lo que NO se pudo hacer:**

🔴 **Las citas NO se pueden borrar, y la razón es correcta:**
`pagos_intentos_cita_id_fkey` es `NO ACTION` ⇒ el `DELETE` rebota con `23503`.
*Es traza de plata, y la casa la protege a propósito.* El intento de borrado se
hizo en transacción y **rebotó entero: nada se borró.**

⇒ **Se CANCELÓ la única cita que estorbaba**, `7390a25b` (23:00,
`consulta_general`), con `metadata.motivo = 'limpieza_gate_s106'`.

⚠️ **Y TRES citas NO se tocan por decisión, no por olvido:**

| cita | hora | hechos de sala |
|---|---|---|
| `911c80c3` | 20:00 | **32** |
| `b17db650` | 20:30 | 14 |
| `36ded7d9` | 22:30 | 14 |

`videollamada_hechos_cita_id_fkey` es **`SET NULL`** ⇒ borrar esas citas
**dejaría 60 hechos huérfanos**, y son *la única evidencia de que el circuito
corrió de punta a punta con dos aparatos reales.* **Se conservan.**

**Horas libres al cerrar esta entrada:** `23:00`. ⚠️ **`23:30` no se ofrece, y
no es un defecto:** la franja de esta noche termina a las 23:59 y un slot de 30
minutos terminaría a las 24:00, así que **el motor no lo ofrece — la puerta no
ofrece lo que va a rechazar** (Ley 23).

---

## §6 · Lo que esta firma NO cambia

El **estreno** del oficio sigue condicionado a lo mismo de siempre:

- el **consentimiento verificado en fila**
- la **respuesta del abogado** a la pregunta 1 de `LETRA_TELEMEDICINA` §10

*Que la llave esté encendida para probar no significa que el servicio esté
abierto.* Son dos cosas distintas y esta acta las mantiene separadas.

---

## §7 · El terreno preparado, pendiente de restaurar

Lo de §3 sigue vivo mientras la llave lo esté:

- la **franja de esta noche** (miércoles 22:00→23:59) — **queda**, por firma
- el **estado del vet retrocedido** — lo restaura el propio founder al caminar
  la activación; si no la completa, se restaura desde el JSON de §3③
