# BRIEF — LA SEGUNDA PASADA DE VELOCIDAD

**Escrito al cerrar S94-PERF (9 ago 2026). Su primer bloque NO es medir: es el
aparato.**

---

## ⓪ POR QUÉ ESTE BRIEF EMPIEZA CON UNA ADVERTENCIA

S94-PERF corrió con el founder ausente. Eso no invalidó la sesión —el 80 % de lo
que había que medir se mide desde una terminal— pero **dejó cuatro cosas rojas
que son de una hora con el teléfono en la mano**, y ninguna de ellas se puede
adivinar. *Empezar esta pasada por otro lado sería repetir el error que la
sesión pasada declaró: seguir midiendo lo cómodo cuando lo que falta es lo
incómodo.*

---

## ① LO PRIMERO, EN ORDEN, Y NO SE SALTEA

**1.1 · Publicar el OTA de las dos curas de S94 y mirarlo.**
Las dos tocan bundle y **el aparato del founder no las tiene**:
- la zona en la misma RPC (`packages/api`) — se verifica abriendo el HOY del
  prestador y su ficha de negocio: **tiene que verse igual que siempre**, con el
  mapa de zona donde estaba;
- las fuentes por peso (`packages/ui`) — se verifica mirando **cualquier
  pantalla con texto**: si una tipografía se ve distinta, la cura está mal y se
  revierte. *Es el gate más barato de la lista y el que cubre más superficie.*

**1.2 · El arranque, medido en el teléfono real.**
Tiempo hasta la primera pantalla útil, **declarando modelo, red, y si es build
de desarrollo o de producción**. Esa última declaración no es burocracia: *una
build de desarrollo es varias veces más lenta, y confundirla con la real
invalida el bloque entero.*

**1.3 · El disparo de D-728.**
Es lo único que le falta a esa ficha: **el costo ya está medido** (hasta 28
peticiones y 12 olas por foco). Falta ver el ciclo dispararse. Un contador de
focos al pie de dos pantallas y abrir una Hoja. *Y esta vez el número se lee
antes de retirar la sonda* — el motivo por el que esta ficha lleva dos sesiones
sin cerrar.

**1.4 · Los backups.**
No son visibles por SQL ni por la anon key: se ven en el panel del proyecto
(Database → Backups). **Es del founder** y quedó declarado como pendiente, jamás
como verificado.

---

## ② DESPUÉS, POR LA TABLA PRIORIZADA (acta S94 §⑩)

**D-738 — el prólogo serial del HOY: 622 ms en cuatro viajes encadenados.**
La pantalla que más se abre del producto gasta más de medio segundo solo en
resolver *quién soy*. La cura es una RPC de contexto que devuelva prestador +
fila de empleado + rol en **un viaje**. Ahorro esperado ~430 ms por apertura, y
se paga otra vez en cada foco.
> **Ojo con la trampa:** construir la RPC sin cablear la pantalla sería *motor
> sin puerta*, que esta casa nombra como defecto. **Las dos cosas o ninguna**, y
> con gate en el aparato.

**D-734 — la galería del prestador sube sin redimensionar.**
Una línea (`redimensionarA: 1600`) en dos llamadas de
`(tabs)/cuenta/perfil.tsx`. **No se aplicó en S94 a propósito**: su «después»
exige subir una foto, o sea un aparato, y aplicarla sin eso sería el verde sin
medir que R5 prohíbe. Punto de partida medido: mediana 474 kB, mayor 5,9 MB,
contra 204 kB de los documentos que sí redimensionan.

**D-737 — el bundle de 7,2 MB.** Solo entra si 1.2 muestra que el arranque está
dominado por el JS y no por la red. **Si no, no se toca**: dividir el bundle es
trabajo estructural y caro.

---

## ③ LO QUE ESTA PASADA NO DEBE VOLVER A HACER

Está medido y no cambió. Re-auditarlo es gastar la sesión:

- **No hay consultas lentas.** Ninguna de la app aparece antes del 0,2 % del
  tiempo acumulado. Cero recorridos secuenciales caros. 100 % de caché.
- **No hay sobre-pedido de columnas.** Cero `select('*')` en los 80 wrappers.
- **No hay N+1 de firmas.** Las URLs firmadas tienen cache con TTL y lote.
- **Las fotos de mascota están bien.** Mediana 63 kB, ninguna sobre 300 kB.
- **Realtime no se toca** (D-739): tres webs del legado lo usan de verdad.
- **Los índices sin uso no se borran** (D-736): freno 1, pueden servir a un
  camino estacional.
- **`is_admin()` VOLATILE no se cura acá** (D-725): toca policies ⇒ **FRENO, la
  firma es del founder.**

---

## ④ EL INSTRUMENTAL YA ESTÁ ESCRITO

`scripts/perf/` quedó con ocho instrumentos reutilizables y sus salidas en
disco. **La segunda pasada re-corre, no reconstruye** — y ese es justamente el
valor: los números de S94 son la línea base contra la cual comparar.

- `b0-linea-base` · el podio de consumo, tamaños, y el piso de red
- `b1-censo-focos` · peticiones y **olas** por pantalla (el número que se siente)
- `b2-base-datos` · secuenciales, índices, volatilidad, conexiones
- `b3-reparto` · ¿por fila o por petición? (la medición que define la sesión)
- `b4-cable` · el peso real de lo que se descarga
- `b5-camino-real` / `b6-verde-zona` · el camino con token real y su verde
- `b8-techo` · la aritmética de capacidad con sus supuestos a la vista

> **Una advertencia sobre `b1-censo-focos`, que es el más útil y el que más se
> equivocó:** tuvo dos defectos antes de dar un número creíble, y los dos daban
> resultados verosímiles (ver L-225). **Si se lo modifica, se lo vuelve a probar
> contra un caso conocido antes de creerle.**

---

## ⑤ LA PRUEBA DE CARGA, PARA CUANDO EXISTA DÓNDE

Sigue **prohibida contra producción** (freno 2). Su guion está escrito en el
acta S94 §⑨ y lo único que le falta es **un entorno**: una copia del proyecto.
Sin eso, no corre — y la estimación de **~170 usuarios concurrentes** sigue
siendo una estimación con sus supuestos declarados, no una medición.

---

## ⑥ LO QUE NO HEREDA

Seguridad está cerrada. **D-732 y D-733 siguen 🔒 bloqueadas** por la letra de
retención y son de la sesión de legales. **La landing de S93 sigue intacta.**
