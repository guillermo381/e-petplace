# S74-B · BOCETO M1-M5 — LA VISTA DESTILADA DE RECEPCIÓN (D-489a)

> **Estado: BOCETO. CERO código hasta la vara.** Fuentes: D-489 (letra
> literal) · PORTAL_PRESTADOR §14.5 ("lo que recepción SÍ ve: destilado
> A3 §4 — identidad + etapa + alerta de seguridad") · BIO_EXPEDIENTE A3
> (la ley madre acto/rol). **Precondición declarada del aviso:** A está
> verificando si `tiene_emergencia_activa` es FIABLE — si vuelve que no,
> **el aviso NO SE DIBUJA** (un aviso de seguridad que puede mentir es
> peor que ninguno; L-139).

## 0 · Tesis y superficie

**TESIS:** *La recepcionista ve QUIÉN es la mascota y QUÉ necesita saber
para recibirla — y ni una línea de su historia clínica.*

**SUPERFICIE:** no es pantalla nueva — es **la degradación POR ROL de las
superficies de mascota que ya existen** (el detalle de Mascotas y el
Antes de la cita). Tras el gate D-464, para un usuario sin rol clínico
los lectores clínicos ya devuelven vacío de MOTOR; este boceto define qué
se DIBUJA en su lugar. La ley madre A3: el ROL decide qué se PUEDE
mostrar (RLS, ya cerrado en S73) · el ACTO decide qué se MUESTRA
(producto — esto).

**El principio rector (letra §14.5):** *"mejor una recepcionista que pide
ayuda al vet que una que lee la HC de todos"* — la vista destilada no es
una HC recortada: es OTRA vista, completa en sí misma.

## 1 · Las 7 preguntas §1c

1. **Trabajo de cada elemento:** identidad = composición existente
   (`AvatarMascota` md + nombre `Texto titulo` + especie) · etapa =
   momento vital EN VOZ (el patrón del perfil del cliente S52-P4: voz
   bajo el nombre, jamás chip) · aviso de emergencia = `Tarjeta` tinte
   danger con voz corta (estado, no acción — cero botón) · el resto de la
   pantalla: lo NO clínico que el empleado activo ya puede (agenda del
   día, registrar atención — sus policies no cambiaron).
2. **¿Ya existe?** Todo: `AvatarMascota` · `Texto` · `Tarjeta` ·
   `FilaDato` · `EstadoVacio registro="seccion"`. CERO componente nuevo.
3. **¿La casa recorrida?** La vecina directa es el "solo-lectura DIGNO"
   de Cuenta S60-B2 (dice su porqué en voz humana) y el detalle icónico
   de Mascotas S51 (visibilidad parcial REAL por RLS — la familia humana
   no visible). El mismo idioma: lo que no se ve tiene un porqué dicho,
   jamás un hueco mudo.
4. **¿Sirve la tesis?** Cada bloque responde "recibir bien a esta
   mascota". Lo clínico no la sirve — no aparece NI como candado.
5. **Capa/dosis:** prestador, dosis baja. El único acento posible es el
   danger del aviso — y solo si el dato existe y es fiable.
6. **Temas/es-en/estados:** §3.
7. **Chanel:** se quitó (a) el candado visual ("🔒 historia clínica" —
   mostrar la cerradura invita a querer la llave y convierte la vista en
   una HC censurada); (b) el conteo "N vacunas" (el callejón P3 probó que
   un dato sin destino es un callejón — y acá el destino está PROHIBIDO
   por diseño); (c) toda fila vacía "por si acaso".

## 2 · La pantalla (la degradación, de arriba a abajo)

```
[identidad]  AvatarMascota md · Nombre · especie
[etapa]      la voz del momento vital (una línea, p.ej.
             "Años dorados" en voz, no chip)
[⚠ aviso]    SOLO si tiene_emergencia_activa === true Y el
             dato es fiable (veredicto de A):
             Tarjeta danger: "Tiene una emergencia activa —
             avísale al equipo médico."
[cuidado]    ← LA BANDA DE CUIDADO ESPECIAL: DECLARADA, NO
             DIBUJADA (ver §4)
[lo operativo] lo no-clínico que ya tiene: la cita de hoy,
             registrar atención (sin cambio)
[el porqué]  UNA línea serena al pie del bloque de identidad:
             "El expediente clínico es del equipo médico."
             (el solo-lectura digno S60 — dice el porqué UNA
             vez, no un candado por dato)
```

## 3 · Estados declarados

- **CARGANDO:** esqueleto estático (identidad + 1 bloque).
- **ERROR:** voz que dirige + Reintentar. **CRÍTICO Ley 13:** el error de
  carga JAMÁS se disfraza de "sin emergencia" — si el lector del aviso
  falla, el bloque de aviso NO decide (no se muestra "todo bien"): se
  muestra el error de la pantalla. Un falso "sin alerta" acá es la
  mentira más cara de la casa.
- **VACÍO:** no aplica a la identidad (la mascota existe si llegaste
  acá). Sin emergencia = el bloque NO SE MONTA (la firma es la
  desaparición — patrón Ponte al día S71).
- **Deshabilitado:** no existe — el rol ya decidió QUÉ pantalla es (la
  puerta, no el candado).

## 4 · LA BANDA DE CUIDADO ESPECIAL — declarada SIN dibujar

**Dónde entrará el día que exista:** entre el aviso de emergencia y lo
operativo (el orden de lectura de una recepcionista: quién es → qué es
urgente → qué necesita a diario → qué hago hoy). **HOY NO SE DIBUJA
NADA** — ni contenedor vacío, ni "próximamente": una banda vacía es
exactamente lo que la casa prohíbe (Ley 18, estructura decorativa; regla
de existencia). Esta declaración existe para que el día que el dato nazca
(temperamento/manejo — el linaje de `nervioso_otros_perros` S46), la
banda se AGREGUE en su lugar declarado y no se rehaga la pantalla. El
contrato M4 de abajo ya le reserva el nombre.

## 5 · Contrato de datos M4

**Se renderiza:** nombre · especie · foto · momento vital EN VOZ (de la
etapa del perfil) · `tiene_emergencia_activa` (bool → el bloque existe
solo en true, condicionado al veredicto de fiabilidad de A) · lo
operativo no-clínico ya existente (cita/agenda — sin cambio de contrato).

**Se DESCARTA a propósito:** TODA la historia clínica (eventos, vacunas,
medicación, condiciones, casos, partes) — no es omisión: ES el punto de
D-464 · los conteos clínicos ("N vacunas") · la familia humana (RLS
solo-miembro, S51 — sin cambio) · cualquier dato de
`mascota_perfil_vigente` más allá de etapa+alerta (el wrapper que exista
puede traer más campos: la pantalla los descarta y este contrato lo deja
escrito).

**PEDIDO DE MOTOR (declarado, cero SQL acá):** el lector destilado —
`mascota_perfil_vigente` quedó GATEADO (ventana declarada S73→S74), así
que recepción necesita un lector angosto patrón D-455: DEFINER keyed por
mascota accesible, campos MÍNIMOS (identidad + etapa + alerta), gate
`empleado_tiene_rol(negocio, ['dueño','profesional','recepcion'])` +
acceso a la mascota. Es exactamente el lector que D-489 describe para el
caso veto ("solo-alerta") ensanchado a los 3 campos de la promesa A3 §4 —
si el founder VETÓ la ventana antes de esta superficie, el lector
solo-alerta nace primero y este boceto lo consume después.

## 6 · Pasada M5

Ley 3 (momento vital en voz, cero enums) ✓ · Ley 13 (el error jamás
disfraza la alerta) ✓ · Ley 18 (cero banda vacía) ✓ · regla de existencia
(sin emergencia = sin bloque) ✓ · dosis baja, danger solo con dato real ✓
· voz del porqué UNA vez (S60 digno) ✓ · sin campos de texto en esta
vista → L-162 no exige captura doble ✓.

**FIRMA (Ley 15):** la vista se recuerda por lo que NO tiene — una
pantalla de recepción que se siente COMPLETA sin una sola fila clínica
(la composición identidad→etapa→hoy). El test anti-genérico: ninguna app
de servicios tiene "la vista de la recepcionista que no puede leer la HC
y no se siente castigada".
