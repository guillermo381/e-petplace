# S89-A · ORDEN 10 ② — LA RECETA: MEDIDO ANTES DE CONSTRUIR

> **La orden dice «medí antes de construir» y eso es lo que hay acá.** La
> medición es contra el objeto vivo (`information_schema`, conteos reales).
> **Lo que no depende de decisiones ya está construido y anda: la medicación
> con posología completa YA SE IMPRIME** — en la historia clínica (orden 10 ①,
> `documento-historia-clinica`, verificada con las 4 consultas de Thor).

---

## 1 · LO QUE UN PAPEL DE PRESCRIPCIÓN EXIGE, contra lo que el motor TIENE

| lo que exige una receta | fuente viva | estado |
|---|---|---|
| Medicamento: nombre · principio activo · concentración · forma | `evento_medicacion_prescrita` | ✅ EXISTE |
| Posología: dosis · frecuencia · duración · vía · **cantidad** · indicaciones | mismas columnas (un evento POR medicamento, S70) | ✅ EXISTE — **ya se imprime hoy** |
| Paciente identificado (nombre · especie · sexo · nacimiento) | `mascotas` | ✅ EXISTE |
| Fecha de prescripción | `evento_medicacion_prescrita.created_at` / `fecha_inicio` | ✅ EXISTE |
| **Identidad del NEGOCIO que prescribe** (nombre · dirección · teléfono) | `prestadores.nombre_comercial · direccion · telefono` | ✅ EXISTE |
| **Registro profesional** | `prestadores.matricula_profesional` | 🔶 **EXISTE PERO ES DEL NEGOCIO, NO DE LA PERSONA** |
| **Identidad del PROFESIONAL que firma** (nombre) | `prestador_empleados.nombre` · `profiles.nombre` vía `veterinario_user_id` (4/4 HC lo tienen) | ✅ EXISTE el NOMBRE |
| **Matrícula/registro DEL PROFESIONAL** | — (`prestador_empleados` no tiene ninguna columna de credencial: medido, sus 16 columnas están abajo) | ❌ **NO EXISTE** |
| Firma (manuscrita, digital o sello) | — | ❌ NO EXISTE |
| Folio / numeración | — | ❌ NO EXISTE (misma pregunta abierta que el certificado) |
| Vigencia de la receta | — | ❌ NO EXISTE |

**Columnas medidas de `prestador_empleados`:** id · prestador_id · user_id ·
rol · nombre · descripcion · foto_url · especialidades · activo ·
modelo_pago · porcentaje_comision · datos_bancarios · invitado_en ·
activado_en · created_at · created_by. **Ninguna de credencial.**

**El corolario que ordena todo:** una receta la firma **una PERSONA con
matrícula**, no un negocio. Hoy la casa captura la matrícula **en el
prestador** (alta S79) — sirve para un consultorio unipersonal y **miente en
cuanto una clínica tiene dos veterinarios**: el papel diría la matrícula del
negocio bajo el nombre de otro profesional. *Es exactamente la pregunta 2 del
inventario de C, y acá tiene su medición.*

## 2 · LO QUE YA ESTÁ CONSTRUIDO (y no esperaba decisiones)

La **prescripción completa vive impresa** en la historia clínica: bloque
MEDICACIÓN con nombre + concentración + forma en negrita y la posología
entera debajo (principio activo · dosis · frecuencia · duración · vía ·
cantidad · indicaciones). El vet dicta, el motor guarda, el papel lo dice.

**Lo que falta para que exista LA RECETA como papel aparte no es contenido
clínico: es la IDENTIDAD DE QUIEN FIRMA.**

## 3 · LA TANDA DE DECISIONES — a mesa

1. **¿La matrícula es del NEGOCIO o de la PERSONA?** (la decisión madre; sin
   ella la receta no puede emitirse honesta con dos vets). Voto de esta
   pista: **de la persona** — `prestador_empleados` gana `matricula_profesional`
   + `pais_emisor`, y la del negocio queda para el consultorio unipersonal.
   Es una columna y su captura en la Hoja del miembro.
2. **¿Qué es «firmar» en v1?** Voto: **el nombre + matrícula impresos**, con
   la procedencia declarada («Prescrita por {profesional}, matrícula {n}, en
   {negocio}») — sin firma criptográfica ni imagen de firma. Una firma
   escaneada en un PDF descargable es peor que ninguna: se recorta.
3. **¿Folio y vigencia?** Voto: **v1 sin folio** (como el carnet, declarado en
   el papel) y **sin vigencia** — ninguna de las dos se puede inventar.
4. **¿La receta la descarga el DUEÑO o solo el prestador la emite?** Voto: el
   dueño, con la misma puerta del expediente — es su papel, va a la farmacia.
5. **¿Receta = un papel por consulta, o por medicamento?** Voto: **por
   consulta** (el molde ya está: es un recorte del bloque MEDICACIÓN).

## 4 · LO QUE ARRANCA SIN ESPERAR (y ya arrancó)

- La medicación **se imprime hoy** dentro de la historia clínica.
- El molde del papel (token quemable → pdf-lib → banda de emisor → alcance
  declarado) **es el mismo** y está probado dos veces: agregar `receta` es
  un tipo en el CHECK, una función y un botón — **medio día una vez que la
  decisión 1 esté firmada**.

> **La única que BLOQUEA es la 1.** Las otras cuatro tienen voto y se pueden
> construir contra el voto si la mesa prefiere velocidad — pero la matrícula
> del profesional es dato que **no se puede inventar ni derivar**: o se
> captura, o el papel miente.
