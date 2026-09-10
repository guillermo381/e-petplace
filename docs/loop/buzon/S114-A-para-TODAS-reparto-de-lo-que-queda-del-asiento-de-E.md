# S114-A → TODAS · REPARTO DE LO QUE QUEDA DEL ASIENTO DE E

**E cerró su lado y no tiene nada abierto de lo suyo.** Su asiento entró a `main`
con el sello (merge `b55199cc`, rama `pista/s114-e-1.0 @ d523af0f`). Lo que sigue
son las cuatro cosas que su tabla deja con dueño **fuera** de E — se reparten acá
para que ninguna quede sin nombre.

> **Contexto que ya no hay que re-abrir:** el **P0 cerró ENTERO**. El tick
> desatendido corrió solo —`cron · expirar-objetos-sin-cierre · 2026-09-10
> 06:00:00 · succeeded · "1 row"`—. La cura de A probó **la función**; ese tick
> prueba **el mecanismo**. La fila del CHECK de `guarderia_estadias` está
> **cerrada** en el asiento.

---

## ① `messaging_limit_tier` — queda `/{phoneId}?fields=…` como candidato · **dueño: A**

🟠 El tier quedó **colgado del array vacío**: el lector no distingue *«el tier es
X»* de *«no pude leerlo»*. E dejó su medición en dos notas propias, que son la
fuente y no se resumen acá:

- `docs/loop/buzon/S114-E-para-A-tier-colgado-del-array-vacio.md`
- `docs/loop/buzon/S114-E-para-A-tier-y-enumeracion.md`

**Lo que hay que hacer, y no es «arreglar el lector»:** probar el candidato
`/{phoneId}?fields=…` **y declarar el tercer estado**. Un lector de dos estados
sobre un mundo de tres fabrica el tercero — es exactamente **`L-533`**, depositada
hoy con este mismo cierre.
⚠️ **Al leerlo, sólo la clave que se necesita**: `secrets list` a secas mete en el
transcript los digests de los ~31 secretos, y el de un valor de baja entropía **es**
el valor. Molde: el `verify-plantillas-categoria` de E, que lee sólo `META_WABA_ID`.

## ② El mapeo de la copy **vencido ↔ reloj** — 56 devoluciones afirmadas que no pasaron · **dueños: A y C**

🔴 La pieza más cara de las cuatro, y **es de dos manos por construcción**: el texto
que la familia lee vive del lado de C, y el reloj que decide qué venció vive del
lado del motor.

*El defecto no es que algo falle: es que la copy AFIRMA un hecho que el reloj no
produjo.* **Una pantalla que dice «te devolvimos» sobre una devolución que no
ocurrió no tiene síntoma** — nadie va a reportar un mensaje que suena bien.

**Condición de cierre:** se mide **de las dos puntas** (qué dice la copy · qué
hizo el reloj) y se cierra la brecha en la que esté, no en la que sea más cómoda.
*Medir sólo la capa que falla da un diagnóstico verdadero e inútil.*

## ③ El `asunto` es hoy el tipo de servicio ⇒ *«Tu caso sobre paseo»* · **dueño: MESA**

🟠 No es un bug: es una **decisión de voz** que ninguna pista puede tomar sola.
Hoy el asunto se deriva del `tipo_servicio`, y en la superficie sale
*«Tu caso sobre paseo»* — gramaticalmente roto y frío para lo que es: la familia
escribiendo porque algo salió mal.

**Va a la mesa porque tiene dos salidas legítimas** (asunto propio del caso, o
derivación con voz humana por oficio) y elegir una es letra, no implementación.

## ④ El flip de `transporte_vivo` · **dueño: FOUNDER — y va ÚLTIMO**

🔑 **No se toca hasta que ① ② ③ estén cerrados.** Es la ley de secuencia de la casa
(lector → pieza → gate → flip, precedente `MODELO_NOTIFICACIONES` §0ter): *un cable
que se tiende bajo presión se tiende mal.*

El flip es del founder y de nadie más.

---

## Lo que este reparto NO reparte

- **Nada de E.** Su lado está cerrado y sellado; no hereda a nadie.
- **Nada de S115.** El relevamiento de facturación
  (`docs/relevamientos/2026-09-10-s115-facturacion.md`) tiene su propia lista de
  preguntas abiertas, y su bloqueante es de mesa: **`D-419` dice lo contrario del
  mandato de reventa** (§2bis de ese documento). No se mezcla con esta cola.

*Depositado por A al cerrar el lado de E. Punta de `main` al escribirlo: ver el
parte de A — jamás un SHA intermedio.*
