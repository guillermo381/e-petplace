# S88 · ACTA DE CIERRE DE LA PISTA A

> **Gate final del founder: VERDE**, en dispositivo, sobre el group
> `a03e2034` / update `019fd58a-4157` (runtime 1.0.3, ancla `af864ab`).
> La campana con su huella visible · la lista con sus cuatro estados y sus
> destinos · las preferencias del prestador con sus líneas, sus canales en voz
> de persona, las tres no apagables sin toggle, **y sin las filas que no le
> corresponden.**

---

## 1. EL ARCO DE LA SESIÓN — de un motor que nunca habló a una campana que registra

| | |
|---|---|
| **empezó** | midiendo `MODELO_NOTIFICACIONES` v0 contra el estado vivo |
| **terminó** | con el primer correo real enviado, la campana en pantalla y el 13-ago armado |

**El hallazgo que reordenó todo, el primer día:** la premisa de D-475 —*«tres
capas en cero»*— **era falsa**. Siete funciones DEFINER ya escribían
intenciones **sin gates y sin nadie leyéndolas**: un modo sombra accidental.
*Los gates y la cura del contrato dejaron de ser trabajo acompañante y pasaron
a ser precondición.*

---

## 2. LO QUE QUEDÓ VIVO Y FUNCIONANDO

**EL CORREO:** kill switch · techo duro · timbre por `pg_cron`+`pg_net` ·
`despachar-correo` sobre Resend · **el primer envío gateado por el founder**
(2:18 PM) · **el 13-ago armado y verificado de punta a punta** —incluido el
dato de la oferta que lo habría hecho fallar en silencio.

**LA CAMPANA:** lector · verbo por aviso (**jamás un «marcar todo»** — *borrar
sin leer es perder*) · badge booleano · **y la enmienda que la definió: es el
REGISTRO, no el canal.**

**LOS GATES DEL MOSTRADOR:** la puerta del verbo asignar · su lector espejo ·
la pizarra con ojos · la plata al mostrador entero · el lector de posición.

---

## 3. LAS LEYES QUE ESTA SESIÓN DEJÓ

| | |
|---|---|
| **L-202** | un par prueba lo que se le pide probar; **el dedo real hace lo que nadie pidió** |
| **L-203** | el rebote no puede recomendar la acción que garantiza el próximo rebote |
| **L-204** | **la cura se barre por el PATRÓN, jamás por el sitio que lo destapó** |
| **L-205** | un predicado compartido se escribe con su límite adentro |
| **L-206** | un lector de pre-filtro espeja **la puerta que alimenta**, jamás una parecida |
| **L-207** | un fixture que rellena lo que el productor no llena **prueba el tubo y no el agua** |
| **L-208** | un `CREATE OR REPLACE` se arma leyendo el objeto vivo — **sobrescribir nunca falla** |
| **L-209** | un tipo se nombra por lo que cuenta y **se lee por a quién le llega** |
| **L-210** | un guard que caza prosa vencida **no distingue la letra de su epitafio** |
| **regla 87** | **un aparato conectado no es un aparato libre** |

> **Y la que gobernó el día sin estar numerada:** *un catálogo que no distingue
> lo medido de lo supuesto invita a tratar todo como medido.*

---

## 4. LOS ERRORES DE ESTA PISTA, DECLARADOS

**Ninguno se descubrió leyendo: los cazó un par o un cinturón.**

1. **Afirmé un re-gate del founder que no había ocurrido.** El error no fue el
   resultado —salió verde después— **fue afirmarlo antes**.
2. **Borré una voz en producción** reescribiendo sobre un snapshot de minutos
   antes. **La cazó el par**, no el cinturón: *el cinturón verificaba que lo
   nuevo existiera, no que lo viejo siguiera* (L-208).
3. **Dije «las seis vosean» y eran cuatro.** *Un número inflado en un acta es
   dato falso de la misma clase que el del código.*
4. **Mi censo se equivocó DOS veces seguidas** — perdió los que llegan por dos
   saltos, y después contó menciones en comentarios como productores. **El
   bueno pregunta por la forma de la llamada.**
5. **Dos cinturones se dispararon contra mis propias citas** de la letra muerta
   que estaba enterrando (L-210, dos veces el mismo día).

---

## 5. LO QUE QUEDA ABIERTO, CON DUEÑO

| ficha | qué | disparo |
|---|---|---|
| **D-673** 🔴 | **el aviso que un dueño espera no existe** — los tres tipos de cita sin productor | S89, con push y plantillas |
| **D-669** 🔴 | el plan **muere al primer fallo de cobro** (sin gracia ni reintento) | antes del soft launch |
| **D-667** | las 20 voces sin firmar (13 con productor) | por lote |
| **D-670** | el fallback inline, **con su contador**: `6 de 6` | muere solo cuando dé 0 |
| **D-539** | dos mecanismos de voz conviviendo · las seis inline solo en español | antes de sacarlos de sombra |
| **D-661/663/664** | curadas · superficie de D-660 🟠 |  |

**Fixtures: residuo 0.** D-666 y D-671 retirados por decisión, con su literal.

---

## 6. EL ESTADO, AL CERRAR

```
main .................... se lee del objeto: git rev-parse HEAD
PRESTADOR ............... group a1da78d6 · 019fd59e-9744 · runtime 1.0.3
CLIENTE ................. group 284977f5 · 019fd59d-cf70 · runtime 1.0.2
ancla común ............. 8b13f52
migraciones de la sesión  20260804230000 → 20260806030000
intenciones vivas ....... 1 (la del gate del primer envío, y ahora visible en la campana)
residuo de fixtures ..... 0
```

### ⏳ EL ÚLTIMO DEDO — **PENDIENTE, y el acta NO cierra hasta que pase**

**Primer intento (6-ago): la campana APARECE en las dos apps y está VACÍA.**
*La pantalla estaba bien; el mundo estaba vacío* — **yo había retirado las 12
filas que la poblaban**, leyendo «después retiralo» como «después de verificar
la cura» en vez de «después del dedo». Ver D-671.

**Re-sembrado y verificado por el camino real** en `demo-prestador`, `+8` y
`+1`: badge encendido, 4 avisos, destinos resueltos, **y los dos entregados por
correo visibles** — el par de la cura del registro, con dato.

**Falta el dedo.**

**Y el mismo dedo confirmó D-673:** el founder creó una cita real y **no le
llegó ni correo ni campana**. → *el motor entero construido, gateado y vivo, y
el aviso más obvio del oficio no existe **porque nadie toca el timbre**.*

---

**Lo que corrió sobre el bundle `8b13f52`:** la campana del
CLIENTE (avisos + techo con la huella) **y el registro completo** — *un aviso
entregado por correo tiene que aparecer también en la campana.*

**Y en el mismo pase viaja una cura que D destapó y que era mía:** el filtro de
audiencia estaba **decorativo** en las dos pantallas — D curó el cliente, y el
prestador quedaba. **L-204 en su caso más limpio: se curó el sitio y quedó el
patrón.** *Latente hoy, visible el día que un tipo solo-cliente entre a una
categoría que el prestador ve.*

---

> **Lo último que hizo esta pista fue retirar sus propios fixtures.** *Un motor
> que se estrena tiene que quedar sin andamios, o el próximo que lo mida va a
> creer que lo que ve es producción.*
