# COREOGRAFÍA DE LA LLAVE — el procedimiento del gate del recorrido completo

**Pista A · S106 tanda 3 · 26-ago-2026.**
Escrito **ANTES** del gate, por encargo: *«dejá el procedimiento escrito
para que el día que se corra sea leer, no improvisar.»*

---

## §0 · Por qué existe este documento

El gate del recorrido completo exige **reservar de cero**, y la reserva está
frenada por `tipos_servicio.telemedicina.reservable = false` — **la llave del
founder**, que sigue apagada por decisión y va última.

Encender esa llave abre la teleconsulta **a todo el público de la app**, no
sólo al founder. Es una ventana real, corta y medible — y por eso se abre con
un procedimiento, no con un comando suelto.

> *Un encendido sin acta no se puede distinguir después de un encendido
> permanente que alguien olvidó apagar.*

---

## §1 · Lo que ya está medido, y por eso no hay que medirlo el día del gate

Estas tres cosas se midieron el 26-ago contra el objeto. **Se re-verifican el
día del gate igual** (L-166: todo dato vivo se relee al momento de usarlo),
pero se sabe qué esperar:

**① La exposición al público es de UN solo negocio.** Medido: la única oferta
de telemedicina con `prestador_servicios.reservable = true` es **Clínica
Aurora**, que es la clínica demo. Ningún prestador real publica teleconsulta.

⇒ *La ventana no expone el oficio a la cartera de prestadores: expone una
clínica de prueba.* Eso es lo que vuelve aceptable el riesgo, y es un hecho
medido, no una estimación.

**② La cadena entera funciona con sólo la llave.** Ejercido en una transacción
que se deshizo sola, con la mascota real del founder (Thor) y su JWT:

| | llave apagada | llave encendida |
|---|---|---|
| ofertas cobrables | `(vacío)` | `telemedicina@Clínica Aurora $30,00 20min` |
| inicios ofrecidos | — | **30** |
| veterinarios disponibles | — | **1** |

⇒ **No falta motor de reserva.** `_vet_ofertas_cobrables` ya incluye la
categoría `telemedicina` y ya aplica el gate de mínimos §6.

**③ El aviso al vet ya viaja.** `confirmar_cita_pagada` emite `cita_solicitada`
al titular del prestador, sin ninguna rama por tipo de servicio, y **las nueve
citas de telemedicina sembradas tienen su aviso en estado `entregada`**.

---

## §2 · El procedimiento, en tres tiempos

### ① ANTES — la verificación previa

Se corre **y se guarda la salida**. Sin esto, el paso ③ no tiene contra qué
comparar.

```sql
-- ① ¿Quién más publica telemedicina, además del demo?
SELECT pr.nombre_comercial, ps.activo, ps.reservable
FROM prestador_servicios ps JOIN prestadores pr ON pr.id = ps.prestador_id
WHERE ps.tipo_servicio = 'telemedicina';

-- ② El estado de la llave, y la marca de tiempo exacta de la apertura
SELECT codigo, reservable, now() AT TIME ZONE 'America/Guayaquil' AS abre_en
FROM tipos_servicio WHERE codigo = 'telemedicina';

-- ③ Las citas de telemedicina que YA existen (la línea base del paso ③)
SELECT count(*) AS citas_antes, max(created_at) AS ultima
FROM evento_cita_servicio WHERE modalidad = 'telemedicina';
```

🔴 **Si el paso ① devuelve algún prestador que no sea la clínica demo, el gate
NO se corre sin decírselo al founder.** La condición que vuelve aceptable la
ventana es que la exposición sea de una clínica de prueba; si esa premisa
cambió, cambió la decisión.

### ② LA VENTANA — encender, correr, apagar

```sql
UPDATE tipos_servicio SET reservable = true  WHERE codigo = 'telemedicina';
-- … el founder corre el recorrido completo …
UPDATE tipos_servicio SET reservable = false WHERE codigo = 'telemedicina';
```

**Quién lo ejecuta:** el founder, o A **por su orden explícita**. En el segundo
caso, el acta de §3 es obligatoria.

**Cuánto dura:** lo que dure el recorrido. No se deja encendida «hasta mañana»
— *una llave que pasa la noche encendida es una llave que alguien va a
encontrar encendida sin saber por qué.*

### ③ DESPUÉS — la verificación posterior, y son DOS cosas

```sql
-- ① La llave volvió. Se verifica CONTRA EL OBJETO, jamás por «corrí el UPDATE».
SELECT codigo, reservable FROM tipos_servicio WHERE codigo = 'telemedicina';
--    esperado: reservable = false

-- ② ¿Nació alguna cita de telemedicina AJENA al gate durante la ventana?
--    Reemplazar <ABRE> y <CIERRA> por las marcas de tiempo de §2.
SELECT c.id, c.created_at, m.nombre AS mascota, u.email AS quien
FROM evento_cita_servicio c
JOIN mascotas m ON m.id = c.mascota_id
LEFT JOIN auth.users u ON u.id = c.user_id
WHERE c.modalidad = 'telemedicina'
  AND c.created_at BETWEEN '<ABRE>' AND '<CIERRA>';
```

🔴 **Si aparece una cita que no es del gate: se REPORTA y se trata por soporte.
NO se borra en silencio.** Es una familia que pagó una consulta real y espera
que alguien la atienda. *Borrarla para dejar la medición limpia sería
convertir un problema de una persona en un dato que no existe.*

---

## §3 · El acta — qué queda escrito

Cuando A ejecuta la ventana por orden del founder, se deposita en el parte de
la sesión:

- **quién** dio la orden y **cuándo** (literal de la orden, no su resumen)
- las **dos marcas de tiempo** de apertura y cierre, en Guayaquil
- la salida de ① ANTES y de ③ DESPUÉS, pegadas
- si nació alguna cita ajena, **su id y qué se hizo con ella**

---

## §4 · Lo que este procedimiento NO autoriza

**No es el estreno del oficio.** El encendido permanente sigue condicionado a
lo que ya está firmado y no ha llegado:

- el **consentimiento verificado en fila** (que la casilla del aviso §3 quede
  registrada en la base, no sólo tocada en la pantalla)
- la **respuesta del abogado a la pregunta 1** de `LETRA_TELEMEDICINA` §10

⇒ *Esta ventana es una medición con el instrumento encendido un rato, no la
apertura del servicio.* Quien lea este documento después no debe tomar un
encendido de gate como precedente de que la llave «ya se puede prender».
