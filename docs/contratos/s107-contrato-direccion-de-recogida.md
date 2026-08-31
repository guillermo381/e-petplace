# CONTRATO · LA DIRECCIÓN DE RECOGIDA LA ELIGE LA FAMILIA

> **Nace:** 31-ago-2026, hallazgo de C + firma del founder. **Migración:**
> `20260831200000_s107a_direccion_elegida.sql` — aplicada, cinturón **4/4**.

---

## ① Las tres puertas reciben la dirección

```ts
reservarDiaGuarderia({ prestadorId, mascotaId, fecha, direccionId? })
reservarDiaDePaqueteGuarderia({ bonoId, fecha, mascotaId?, direccionId? })
contratarMensualidadGuarderia({ prestadorId, tarjetaId, ..., direccionId? })
```

**Omitirlo = la principal.** Compatible hacia atrás: lo que hay montado hoy
sigue funcionando igual.

🔴 **Mandás un ID, no un snapshot.** El server valida y arma el snapshot él
mismo. *Aceptar un snapshot armado por la pantalla sería dejar que el cliente
escriba a dónde va el animal.*

**Código nuevo:** `direccion_no_valida` → *«Esa dirección no está entre las
tuyas.»*

---

## ② 🔑 Lo que el cinturón mide, y por qué esos brazos

«Acepta una dirección» no prueba nada — **una puerta que ignorara el parámetro y
siguiera usando la principal también "aceptaría"**. Medido:

```
🔑 con la SEGUNDA (no principal) -> guarda ÉSA, no la principal
   una direccion AJENA           -> direccion_no_valida
   NULL                          -> guarda la principal
   el MANDATO                    -> la guarda al firmar
```

---

## ③ En la mensualidad es un dato DEL MANDATO, no de la sesión

🟢 Firma del founder: **las citas del plan las crea el reloj, sin nadie
presente.** No puede preguntar a dónde pasar a buscar.

⇒ `guarderia_suscripciones.direccion_id` se resuelve **AL FIRMAR, jamás al
cobrar.** Si viene `null` se guarda la principal **de ese momento** — *no se
deja vacía para que el reloj resuelva después: eso volvería la dirección un
dato de la sesión del reloj, y la familia habría autorizado una dirección que
puede haber cambiado.*

**Cambiarla después afecta las citas futuras del plan, no las ya creadas** — y
eso sale solo del diseño, no hace falta código extra.

---

## ④ ⚠️ UNA NOTA QUE ES DECISIÓN DE PRODUCTO, NO DE MOTOR

**Las direcciones son de la PERSONA, no del hogar.** `direcciones_guardadas` es
por `user_id` y su RLS también (`dir_own`: `user_id = auth.uid()`).

⇒ **La validación usa ese mismo criterio, copiado de la RLS viva y no
inventado.** Consecuencia concreta: *si la mamá guardó la dirección y el papá
reserva, él no la ve.*

🟢 **FIRMADO POR EL FOUNDER (31-ago): NO se ensancha en esta tanda** — ficha
**`D-981`**, con su razón:

> **El bono es del hogar y las mascotas también, así que hay precedente para
> compartir** — pero **ensanchar quién ve la dirección de casa de otra persona
> es una decisión de privacidad con su propio peso, y no sale de paso en una
> tanda de guardería.**

⚠️ **Para la pantalla:** *si la mamá guardó la dirección y el papá reserva, él
agrega la suya.* **No es un defecto: es el alcance elegido**, y la duplicación
de una dirección de la misma casa es el costo aceptado.
