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

## §4 · La ventana

```
ABRE : 2026-08-26 21:48 Guayaquil
CIERRA: (se completa al apagar)
```

---

## §5 · Verificación posterior

*(Se completa al cerrar la ventana. Las dos cosas que hay que medir contra el
objeto, no declarar: `reservable = false`, y cero citas de telemedicina nacidas
en la ventana que no sean del gate.)*

```
reservable al cerrar   :
citas nacidas en la ventana:
restauración del terreno   :
```
