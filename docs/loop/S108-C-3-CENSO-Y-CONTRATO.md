# S108-C-3 · El censo de paseo y adiestramiento, y lo que C necesita de A

> Medido contra `main` en la rama `pista/s108-c`. **Publicado antes de estar
> listo**, por la misma razón que la vez pasada: *un artefacto que otra pista
> debe medir se publica aunque no esté listo para main.*

---

## ① LO QUE FRENA LA CONSTRUCCIÓN — y es de motor, no de pantalla

**Los tres checkouts nuevos no se pueden construir contra un riel que los va a
rechazar.** Medido:

`bono_desglose` **es una TABLA, no una vista**
(`20260828230000_s107a_cobro_y_gate_sanitario.sql:155`), o sea que **sus filas
las escribe quien crea el bono**. `comprar_paquete_guarderia` las escribe;
**`comprar_paquete_salidas` —el paquete de PASEO— no**, porque nació tres meses
antes que esa tabla. Y la edge `pagos-cobro` **exige el desglose** para resolver
el monto (`supabase/functions/pagos-cobro/index.ts:361`).

⇒ **Hoy `cobrar({tipo:'bono'})` sobre un bono de paseo rebota.** No por un guard
de oficio —la edge lee `bonos` sin filtrar por `tipo_servicio`, y eso está bien—
sino porque no hay desglose que leer.

> **Lo bueno de esto:** el sujeto `bono` **ya es genérico**. `leerEstadoBono`
> tampoco filtra por oficio (medido: cero menciones de `tipo_servicio`). *El
> paquete de paseo no necesita sujeto nuevo ni lector nuevo — necesita que su
> compra escriba lo que la de guardería ya escribe.*

---

## ② EL CONTRATO, por sujeto

### (a) PAQUETE DE PASEO — el más barato de los tres
1. Que `comprar_paquete_salidas` **escriba `bono_desglose`** y el bono **nazca
   `pendiente`**, con su ventana de pago, igual que el de guardería.
2. Que `PaqueteSalidas` (`packages/api/src/wrappers/paquetes.ts:266`) gane
   **`estadoPago`** y **`noPagadoATiempo`**, y que `obtenerMisPaquetesSalidas`
   **deje de omitir `estado_pago`** en su `.select` (`paquetes.ts:313`).
   *Sin eso, el hogar de paseos no puede tener los tres grupos que el de
   guardería ya tiene, y un bono pendiente se muestra como saldo gastable.*
3. 🔴 **`obtenerSaldoPaquete` filtra `.eq('estado_pago','pagado')` server-side**
   (`paquetes.ts:377`). Con el bono naciendo pendiente, eso lo vuelve
   **invisible** en el flujo de compra y de reserva — *guard mudo, la misma
   clase que S108-A ya curó del otro lado al hacer caer ese filtro.*

**Nada más.** Sujeto, lector de espera y máquina de la pantalla ya existen.

### (b) PLAN MENSUAL DE PASEO
· `SujetoDeCobro` gana su valor (**`suscripciones_servicio`, NO
  `guarderia_suscripciones`** — `leerEstadoMensualidad` lee la tabla de
  guardería y no sirve acá).
· Su columna en el XOR de `pagos_intentos`.
· Un lector de espera con **la misma forma** `{ estado, resuelta }`.
· Y su desglose, por lo mismo que (a).

### (c) PROGRAMA DE ADIESTRAMIENTO
· Ídem (b) sobre `programas_contratados`.
· 🎁 **Su columna ya existe:** `estado_pago text NOT NULL DEFAULT 'pendiente'`
  con su CHECK de tres valores
  (`20260715180000_s63_programa_adiestramiento.sql:155,164`). Lo que fuerza
  `'pagado'` es la función (`:551`). **Su cambio es más chico que el de
  guardería.**
· ⚠️ Y es **el más delicado de los tres**: `contratar_programa` **crea las N
  citas al comprar** y la pantalla afirma *«Las {{n}} sesiones quedaron en la
  agenda»* **antes de que exista cobro**. *No es que le falte un aviso: es una
  afirmación falsa sobre la agenda de un profesional.*

### (d) LO QUE LA PANTALLA VA A NECESITAR DESPUÉS, y se declara ahora
· **El próximo cobro del plan de PASEO, resuelto por el servidor**, como
  `PlanGuarderia.proximoCobro`. Hoy la pantalla dice *«cubierto hasta»* porque
  **deducirlo de `periodo_fin` está corrido un día** — ver ③.
· Un **lector del programa contratado con su saldo de sesiones**: hoy no existe
  ninguno (medido: cero `sesiones_usadas` / `saldo_sesiones` en todo el repo), y
  sin él no hay dónde decir «te quedan N sesiones» ni marcar un programa
  pendiente de pago.

---

## ③ UN DEFECTO VIVO QUE C YA CURÓ, y su gemelo que es de A

`hogar/paseos.tsx` decía **«Se renueva el {fecha}» sobre `periodo_fin`**, y
`periodo_fin = (periodo_inicio + 1 mes) - 1 día`
(`20260712130000_s56_d338_plan_paseo.sql:106`) ⇒ **anunciaba la renovación un día
antes de que ocurriera.** Curado del lado de la pantalla.

⚠️ **Y hay un aviso del motor que usa la misma clase de dato:**
`plan_renovacion_proxima` arma su fecha con `p_extra->>'fecha'`
(`20260903140000_s108a_aviso_renovacion_guarderia.sql:112-116`). **No medí de
dónde sale ese `p_extra`** — puede estar perfecto. *Lo digo como sospecha, no
como hallazgo: es un aviso para revisar, no una afirmación de que está roto.*
**Un correo es peor que una pantalla porque queda escrito en la bandeja.**

---

## ④ LA LECCIÓN QUE EL FOUNDER MANDÓ DEPOSITAR

> ### Un censo de textos se hace por la FRASE y por la PROMESA, jamás por la lista de claves que uno recuerda haber escrito.

**Cómo se me escapó, con nombre y apellido.** En S108-C-T2 maté la promesa *«el
mismo día de cada mes»* en tres lugares. **Sobrevivió en un cuarto**
(`modalidadGuarderia.mensualAviso`), y no por descuido de lectura: **busqué por
las claves que conocía** —`mensualMandato`, `mensualExitoDetalle`,
`mensualLetra`, `planDetalle`— porque eran las que yo había tocado. *La frase
vivía en un namespace que yo no había escrito, así que mi lista de claves no
podía contenerla.*

**Por qué es peligrosa esta forma de censar:** produce un resultado que se
**siente** completo. Se recorren todas las claves que uno recuerda, todas
aparecen curadas, y el censo cierra en verde. *El hueco no es lo que se buscó y
no se encontró: es lo que nunca entró en la búsqueda.*

**La cura, exigible:** censar por el TEXTO —la frase, el fragmento, la promesa—
sobre **los dos diccionarios enteros**, y recién después mirar quién la consume.
Y el corolario que vale para cualquier barrido: *un censo cuyo alcance sale de
la memoria del que censa tiene el tamaño de su memoria, no el del problema.*

---

## ⑤ LA SEGUNDA LECCIÓN DEPOSITADA (S108-C-4)

> ### Una regla duplicada por copia se cura dos veces o no se cura. Y el comentario que dice «la MISMA regla» es la señal de que hay dos.

**El caso.** El hogar de paseos filtraba el saldo de los paquetes sin mirar el
pago. Al curarlo, la gemela apareció en `serviciosHogar.ts` — **y su propio
comentario la delataba**: *«saldo vigente del hogar (la MISMA regla del hub,
D-343/P16)»*. La copia estaba **declarada**, con su razón y su ficha, por alguien
que hizo lo correcto al escribirla. Lo que no existía era **un mecanismo que
obligue a curar las dos**.

**Por qué la segunda es peor que la primera, medido:** `serviciosHogar.ts`
alimenta el **resumen del Hogar**, o sea la primera pantalla que la familia ve.
*La copia estaba más cerca del ojo que el original.*

**Lo que la vuelve una lección y no una anécdota:** el comentario que honestamente
declara una duplicación es, al mismo tiempo, **el mejor localizador de su
gemela** — y nadie lo estaba usando para eso. ⇒ **Al curar una regla, se busca la
frase que la nombra**, no sólo el sitio que falló. `grep "MISMA regla"` es más
barato que el defecto.

**Y encaja con la ley de la sesión** (`S107`, cobrada seis veces): *el censo casi
siempre encuentra una segunda puerta al mismo defecto.* Acá la puerta venía con
un cartel puesto.

---

## ⑥ LA REGLA DE TERRITORIO QUE ESTA TANDA FIJÓ (firma del founder)

> **Una pista puede ensanchar un lector ajeno DEL LADO CONSUMIDOR si: ① mide que
> el dueño no lo tiene, ② avisa en el momento, y ③ deja el commit descartable.**

No es «esperá al dueño». *Esperar habría costado la tanda entera:* sin
`estadoPago` en `PaqueteSalidas` no había con qué agrupar, y el ensanche eran
tres líneas aditivas del lado del consumidor — el motor no se tocaba.

⚠️ **Las tres condiciones son conjuntas.** Sin la medición es pisar trabajo en
vuelo; sin el aviso es un conflicto diferido; sin la descartabilidad es obligar
al dueño a integrar lo que quizá ya tenía mejor resuelto.
