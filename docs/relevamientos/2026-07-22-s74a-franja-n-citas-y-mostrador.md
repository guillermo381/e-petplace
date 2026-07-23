# S74-A · DOS RELEVAMIENTOS DEL GATE: la franja con N citas · qué gatea el MOSTRADOR

> Relevamiento literal, **cero construcción** (la franja pide boceto antes —
> es composición, no diccionario). Ambigüedad del dictado **elevada al
> founder, sin resolver** (L-158: no se adivina).

---

## A · LA FRANJA CON N CITAS — qué hace HOY (y son TRES superficies, no una)

**Dictado del founder (letra nueva):** *"Si tiene más de una cita activa,
mostrarlas. Si son del mismo servicio, solo la más reciente."*

**⚠️ AMBIGÜEDAD ELEVADA AL FOUNDER (no resuelta acá):** *"más reciente"* en
citas **FUTURAS** puede ser **(i)** la de CREACIÓN más nueva o **(ii)** la
PRÓXIMA en el tiempo. **La mesa propone (ii) y espera confirmación.** Nota
que agrega el relevamiento: si gana (ii), **"más reciente" es un nombre
engañoso para lo que en el resto de la casa se llama "la próxima"** — y la
voz del producto debería decir *próxima*, no *reciente* (Ley 17.3: una
acción, un nombre, todo el flujo).

**Segunda pregunta que el relevamiento destapa y también es del founder:
¿CUÁL de las tres superficies?** El dictado dice "la franja", pero hay tres
lugares donde N citas activas compiten, con criterios HOY distintos:

| Superficie | Qué hace hoy con N | Criterio literal |
|---|---|---|
| **(1) Ponte al día** (`hogar/index.tsx:700`) | **YA muestra N**: una fila por cita por-coordinar, tope 3 + `PieRevelar` | `porCoordinar.map(...)` — todas las `por_coordinar` del hogar |
| **(2) La ficha de cada mascota** (`hogar/index.tsx:772-818`, dato de `hogar.ts:207`) | **muestra UNA** (`proximaCitaMono`) | `citas.data.find(c => confirmada \|\| holdVigente)` sobre un `.order('fecha' asc).limit(10)` ⇒ **la PRÓXIMA en el tiempo**, ya excluyendo holds vencidos (D-319) |
| **(3) El hub `/citas/[mascotaId]`** (`:157-159`) | **hero + el resto en acordeón** ("Ver más") | `citas.find(cita_id === param) ?? citas[0]`, sobre el orden del wrapper: **fecha asc con `nullsFirst`** ⇒ las `por_coordinar` (sin fecha) PRESIDEN, después la más próxima |

**Lectura del relevamiento:** la (1) ya cumple *"si tiene más de una,
mostrarlas"*; la que muestra UNA sola —y por lo tanto la que el dictado
probablemente apunta— es **la (2), la ficha de la mascota**. La (3) ya
resuelve N con acordeón. **Se eleva: ¿el dictado es sobre la ficha (2)?**

### Contraste con `DISEÑO_EXPERIENCIA` §10ter (regla YA firmada)

**NO hay roce — es OTRO eje, y conviene decirlo para que nadie los mezcle:**
§10ter gobierna **N ÍTEMS DENTRO DE UNA cita** (los ítems del presupuesto de
un `procedimiento`: *1 → su descripción · N → primera + «+N»*, y la asimetría
del fallback vet/dueño). El dictado gobierna **N CITAS distintas en una
superficie**. Uno es "cómo se nombra una cita", el otro "cuántas citas se
muestran".

**Se deposita como COROLARIO, no como enmienda** — y con una advertencia de
composición: si la ficha pasa a mostrar N, **la misma superficie tendría dos
reglas de «+N» apiladas** (la de ítems dentro de la cita y la de citas dentro
de la ficha). El boceto tiene que resolver esa colisión visual **antes** de
construir; el candidato natural es que la ficha muestre las citas y §10ter
siga gobernando el NOMBRE de cada una.

**Regla de agrupación del dictado ("si son del mismo servicio, solo la más
reciente"):** hoy **ninguna** de las tres agrupa por servicio — es
comportamiento NUEVO en las tres. Dato para el boceto: el shape ya trae
`tipo_servicio`, así que agrupar no pide motor.

**Siguiente paso declarado: BOCETO (M1) antes de construir** — es
composición. No se construye nada hasta que el founder resuelva las dos
preguntas (cuál superficie · qué es "más reciente").

---

## B · QUÉ GATEA EL MOSTRADOR HOY (literal, con archivo:línea)

**Respuesta: SERVICIO ACTIVO DE VET. El literal CONFIRMA la lectura de mesa.**

- **La condición del CTA** — `apps/prestador/src/app/(tabs)/index.tsx:906`:
  ```tsx
  {pantalla.estado === 'listo' && vista === 'hoy' && oficiosActivos?.vet && (
     <Boton … etiqueta={t('mostrador.registrarAtencion')}
             onPress={() => router.push('/veterinaria/mostrador')} />
  ```
- **Cómo se computa ese `vet`** — mismo archivo, `:602`:
  ```tsx
  vet: ofVet.ok && ofVet.data.servicios.some((s) => s.activo),
  ```
  ⇒ **oferta vet con al menos un servicio ACTIVO**. El comentario del propio
  bloque ya lo declaraba: *"la entrada del MOSTRADOR — solo para negocio con
  oficio vet activo"*.

**Lo que NO lo gatea (verificado):** **NO** `prestadores.tipo` (el eje muerto
D-487 no aparece en la condición — **el mostrador NO lo resucita**) · **NO**
rol (no hay gate de rol en la entrada) · **NO** está siempre (sin oferta vet
activa, el CTA no se dibuja — ausencia, no candado: Ley 23).

**Sobre el QUIÉN (contraste con la lectura de mesa):** la mesa dice *"el
quién lo ve es el PISO (recepción), o sea todos"* — hoy **no hay gate de rol
y en la práctica solo lo ve el TITULAR**, porque la app del prestador no deja
entrar a nadie más (**D-512**: `obtenerMiPrestador` por `user_id`). O sea: la
posición de mesa y el código **no chocan hoy** y coincidirán solas el día que
D-512 se cure — pero **la coincidencia hay que declararla, no asumirla**:
cuando entren empleados, el mostrador quedará visible para todos los roles
sin escribir una línea. Si eso NO es lo querido, hace falta gate explícito.

**Nota para la letra (de mesa, registrada):** *recibir sin cita NO es
exclusivo de vet* — un groomer también tiene walk-ins. El mostrador
construido **desemboca en consulta clínica**, así que **v1 es vet**; se
declara que **el concepto es más ancho** y que el día que se generalice, el
gate correcto sigue siendo *"tiene oficio X activo"*, jamás el tipo de
negocio.
