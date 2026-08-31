# S107-C · EL FLUJO DE GUARDERÍA, COMO QUEDÓ

> **Esto es LA VARA.** El founder caminó el flujo entero y funciona. Si mañana
> se rompe, **se compara contra este documento**, pantalla por pantalla.
>
> **Regla que gobierna todo lo de abajo:** los estados eran ciertos al cerrar
> S107. **Todo dato vivo se re-lee del objeto al usarlo**, y el próximo `D-NNN`
> se verifica **por grep**, jamás desde acá.
>
> ⚠️ **Y una que aprendí a los golpes en esta misma sesión:** *el canon se mide
> contra `main`, jamás contra el árbol de quien escribe.* Medí mi propia rama,
> lo llamé «el estado», y una afirmación verdadera para mí entró al canon como
> falsa para todos los demás.

---

## EL RECORRIDO

```
/hogar/guarderia            ① EL HUB
  └→ /explorar/guarderia    ② MODALIDAD Y DÍA
      └→ …/disponibles      ③ QUIÉN PUEDE
          └→ …/[prestadorId]  ④ LA VITRINA DEL PRESTADOR
              └→ /guarderia/documentos   ⑤ LOS TÉRMINOS (sólo la 1ª vez)
              └→ …/checkout              ⑥ CHECKOUT → ⑦ CONFIRMACIÓN
/hogar/guarderia → ② con su bono          ⓪ EL CAMINO CORTO
```

---

## ① EL HUB · `/hogar/guarderia`

Chips de mascota con foto · **el plan mensual** · **el saldo del paquete** ·
pestañas Próximas/Historial · la lista o su vacío · el CTA al pie.

| firma | por qué |
|---|---|
| **UN botón de paquete por LUGAR, no por bono** | el founder vio **cuatro**: el hogar tenía cuatro bonos de la misma guardería. *No compró cuatro cosas: compró saldo cuatro veces en el mismo lugar.* Se **suman** |
| **el bono que viaja es el que VENCE PRIMERO** | FIFO de la casa. *Consumir el más nuevo dejaría vencer el viejo con saldo adentro* |
| **fila blanca con chevron, no botón amarillo** | competía con el CTA del pie. *Cuando todo grita, nada dirige* |
| **bajo los chips de mascota** | con >1 mascota, arriba **no tendría sujeto** — el motor rebota `mascota_no_determinada` |
| **el plan INFORMA, no navega** | no hay pantalla de plan: *un chevron prometería una que no existe* (Ley 19.7) |
| **el plan va ARRIBA del paquete** | *lo que se renueva solo va antes que lo que se gasta a pulso* |

🔴 **Por qué el plan está acá:** no se veía **en ningún lado**. *Una mensualidad
firmada que no aparece en ninguna pantalla es un cobro que la familia descubre
en su tarjeta.*

---

## ② MODALIDAD Y DÍA · `/explorar/guarderia`

Sin chips de mascota (viene del hub, su nombre bajo el título) · **Día ·
Paquete · Mensual**, con Día preseleccionado · la tira de días · el tamaño ·
los requisitos · al pie, precio y «Ver quién puede».

| firma | por qué |
|---|---|
| **cada día dice su estado SIN tocarlo** | `obtenerDiasGuarderiaDisponibles`. Antes los 14 se veían iguales y **4 eran callejón**: se tocaba un sábado y el botón quedaba apagado. **Es el candidato serio a por qué el founder nunca pudo reservar** |
| **`ningun_lugar_abre` ≠ `sin_cupo`** | *ante el primero se elige otro día; ante el segundo se puede esperar* |
| **HOY jamás se reserva** | la víspera; el motor rebota `fecha_no_ofertable` |
| **la modalidad arranca en «día»** | *no es un default oscuro: es el camino que la familia iba a tomar igual* |
| **fecha ANTES que tamaño** | los precios por tamaño salen de los lugares que abren **ese** día |
| **el chip dice el tamaño; el precio vive al pie** | donde vive el de Día. *Dos superficies para el mismo dato obligan a aprender la pantalla dos veces* |
| **la mensualidad dice su letra** | L-V y cobro mensual hasta cancelar. *Una recurrencia que no se declara antes de contratar se descubre en el segundo cobro* |
| **la causa, visible sin tocar el botón** | Ley 23 |

⚠️ **Límite declarado:** `SelectorDia` toma **una sola** `etiquetaCerrado` y
sólo la usa en el lector de pantalla. Con dos motivos conviviendo se dice el
neutro. ⇒ `S107-C-PEDIDO-A-B-VOZ-POR-DIA.md`, abierto.

---

## ③ QUIÉN PUEDE · `…/disponibles`

**Una `Tarjeta` contenedora** con todos los prestadores · cada uno con portada,
logo, nombre, línea de confianza, **su precio de ESA modalidad**, el cupo del
día y sus dos ventanas.

| firma | por qué |
|---|---|
| **la anatomía es la de grooming** | censada. Acá la mascota se decía **dos veces**, la fecha colgaba suelta y los previews **flotaban sin caja** — de ahí que el cupo y las ventanas «colgaran abajo»: *no había caja de la que colgar* |
| **el precio de CADA prestador, no un «desde» repetido** | `precioModalidad`, resuelto por el server |
| **el precio DESTACADO dentro de su línea** | *es el dato con el que la familia compara*. Cambia el peso, no el lugar: **si todo se destaca, nada destaca** |

---

## ④ LA VITRINA DEL PRESTADOR · `…/[prestadorId]`

Galería a sangre desde el techo con sus puntos · logo sobre el borde · nombre
con su distintivo · ubicación · mapa de zona · y en el `pie` de la ficha: las
dos ventanas, el día y los requisitos. Al pie fijo, el CTA.

| firma | por qué |
|---|---|
| ☠️ **SIN CALENDARIO** | el día se eligió dos pantallas antes. *Un control que pide algo ya decidido es una invitación a contradecirse* |
| **es `FichaPrestador`, la de grooming** | antes eran **bloques apilados**: arrancaba con las ventanas, una foto suelta en el medio, el pago a mitad de pantalla |
| **el mapa es RANGO del sector, jamás el punto** | y sin `geo.API_KEY` **no se monta**: montarlo mata la app en hilo nativo |
| **el precio va SÓLO al pie** | salía dos veces. En ③ la vitrina lo lleva porque ahí se compara; acá ya se eligió |
| **el CTA NAVEGA, no cobra** | el medio de pago, los términos y «Pagar» viven en el checkout |
| **el CTA lleva la fecha adentro** | «Comprar día…» · «Comprar paquete de N…» · «Contratar mensualidad» |
| 🔴 **el `ScrollView` es parte de la pantalla** | al poner la vitrina **me llevé el contenedor de scroll** y la mitad de la pantalla dejó de existir. Su `paddingBottom` **no es estilo**: sin él la barra fija tapa el último bloque |

---

## ⑤ LOS TÉRMINOS · `/guarderia/documentos` (sólo la primera vez)

**UNA casilla** que nombra los seis documentos, con el enlace a leerlos
completos en una `Hoja` · **el contacto de emergencia en acordeón, opcional** ·
el CTA sólo con la casilla marcada.

| firma | por qué |
|---|---|
| **una casilla, no ocho** | *ningún servicio pide ocho aceptaciones para agendar* |
| **el acto sigue siendo real** | jamás pre-marcada, con su texto accesible completo, y **las seis versiones viajan en ese acto**. *Se colapsó la ceremonia, no la prueba* (P23) |
| **el enlace abre SIN marcar** | *si abrirlo marcara, la prueba diría que alguien aceptó cuando sólo fue a leer* |
| **el texto completo en una `Hoja`** | *un muro de seis textos legales arriba del botón no es leerlos: es enterrarlos* |
| **el contacto NO gobierna el botón** | opcional de verdad |
| **el tope de gasto salió del flujo** | es un término del documento |
| **ni una palabra de texto legal en la pantalla** | el nombre sale del riel, **el contenido del server**, versionado |

⚠️ **El acordeón se muestra SIEMPRE, cerrado**: la firma decía «visible cuando
no hay ninguno cargado» y **eso no se puede saber** — no hay lector de
contactos. *No invento un «no tiene» que no puedo medir.*

---

## ⑥ CHECKOUT · `…/checkout`

**Las tres modalidades pagan acá.** Resumen · **la dirección de recogida** ·
el medio de pago (mensual) · el botón.

| firma | por qué |
|---|---|
| **el HOLD DEL DÍA SE CREA ACÁ** | `reservar_dia_guarderia` **congela la dirección al crear la cita**: con el hold naciendo en ④, elegirla después no cambiaba nada. *Un selector que el servidor ya no puede escuchar es un control que no decide* |
| 🔴 **asimetría del hold, declarada** | **día** llega con hold y **su reloj es real**; **paquete y mensual NO tienen hold** —el motor no emite uno— y el acto ocurre al tocar Pagar. *No se inventa un temporizador que ningún servidor honra* |
| **viaja el ID de dirección, jamás un snapshot** | *dejar que el cliente escriba a dónde va el animal sería la peor forma de confiar en el cliente* |
| **`null` es válido: la principal** | no se inventa un default |
| **la mensualidad guarda la dirección en el MANDATO** | sus citas las crea el reloj, sin nadie presente |
| **el paquete dice que su cobro es simulado** | *un cobro simulado presentado como real es la clase de mentira que esta casa persigue*. El día **no** lo dice: el suyo es real |
| **`documentos_sin_aceptar` LLEVA a ⑤** | en **las cuatro** ramas. Vivía en una sola, y las otras tres frenaban sin camino |
| **`ya_tienes_plan_activo` LLEVA al hub** | con su aviso en **toast** —sobrevive a la navegación— y en tono **neutro**: *no se equivocó en nada, ya tiene el plan* |

---

## ⑦ LA CONFIRMACIÓN

La misma de todos los servicios: `EstadoVacio` + glifo del oficio + «Volver al
hogar». **Y el check de imagen.**

| firma | por qué |
|---|---|
| **el consentimiento de imagen va DESPUÉS de pagar** | *ya pagó, así que aceptar no cambia nada de lo que contrató. Uno que se pide antes de cobrar se parece demasiado a un requisito* |
| **apagado por defecto, jamás pre-marcado** | *es el más fácil de invalidar si viene de fábrica* |
| **nombra a la mascota — y sin nombre NO se monta** | *un consentimiento que no puede nombrar a quién protege es sobre nadie* |
| **dice la VÍA de retiro, no «cuando quieras» a secas** | *una promesa de revocación sin camino es la clase de frase que un consentimiento no soporta* |
| **escribe por `fijarRedesAutorizadas`** | usar el aceptador **le firmaba a la familia un documento que no leyó** — medido, era el comportamiento de HOY |
| **paquete y mensual también aterrizan acá** | mostraban un toast. *Un toast se va solo: el acto más caro del recorrido no puede confirmarse con algo que desaparece* |

🔴 **LA DISTINCIÓN QUE SE PIERDE SI NADIE LA ESCRIBE:** las fotos del **durante**
son **privadas y van al hilo de la familia** — **no necesitan esta autorización
y no están bloqueadas**. Ésta gobierna **publicarlas FUERA**.

---

## ⓪ EL CAMINO CORTO · agendar contra saldo

Desde ① → ② **con su bono**: sin modalidad (la decidió la compra), sin tamaño
(ya está comprado), sin «ver quién puede» (**el lugar lo determina el bono**).
El pie **agenda**, no navega. Confirmación por toast con el saldo y la fila
marcada **«Con tu paquete»**.

⚠️ **Su destino cambió al borrar el calendario de ④** — entraba ahí sin día.
*Quien borra una pieza tiene que decir a quién dejó sin ella.*

---

## LO QUE QUEDA VIVO, CON DUEÑO

| | qué | dueño |
|---|---|---|
| `D-982` | **dos orquestaciones de dirección vivas** — despensa no migró a la pieza que salió de su propio diseño | C |
| `D-983` | 🟢 el consentimiento de imagen: **dónde vive y por qué no vuelve** a ⑤ | C, cerrada al montarse |
| **48 horas** | *«escribinos a privacidad@ y en menos de 48 h quedará revocada»* — **alguien tiene que atenderlo**. De cuatro cosas, la única resuelta es el motor. **Modo de falla silencioso** | **operación** |
| `PEDIDO-A-B-VOZ-POR-DIA` | la voz del día cerrado, por día | B |
| `PEDIDO-A-B-GEOMETRIA-DEL-SEMAFORO` | y **mi andamio `paddingHorizontal` muere con él** | B |
| — | **lector de contactos de emergencia** (para que el acordeón sepa si ya hay uno) | A |
| — | **direcciones por USUARIO, no por hogar** — *si la mamá guardó una, el papá no la ve*. **Alcance elegido, no defecto** | firmado |

---

## LAS CUATRO CLASES — de la casa, no de guardería

**Todas producen salida creíble y ninguna deja síntoma.**

1. **La incoherencia entre dos estados que sólo coinciden en pantalla.** *Cada
   mitad correcta; ninguna línea está mal.*
2. **El instrumento que no distingue «no pasó nada» de «no hice nada».**
   → `tocar()`.
3. **El dato que fue cierto y dejó de serlo.** *Cobrada tres veces, dos sobre
   trabajo ajeno y una sobre el canon.*
4. 🆕 **Una decisión que se ve como una ausencia tiene que estar escrita en el
   lugar donde se ve la ausencia.** *Declaré rodeos en cabeceras que el
   prestador no lee, y rompieron igual* — `L-439`, y su corolario, que es el
   que sirve: **un atajo que puede producir un valor equivocado no se declara:
   se hace inexpresable.**

> **Y el patrón que las une: cuando algo salió mal por lo que uno recordó o
> dejó de recordar, la cura no es recordarlo mejor — es que deje de depender de
> recordarlo.** *Seis de las curas de esta pista son mecanismos, no notas:*
> `tocar()` · `porClave()` · `claveAnon()` · `conResiduoCero()` ·
> `verificar-corridas-subtx.sh` · `estado-de-mis-curas.sh`.

---

## LOS INSTRUMENTOS — se corren, no se re-inventan

| script | para qué |
|---|---|
| `estado-de-mis-curas.sh` | **antes de reportar nada**: en qué estado está lo que vas a llamar «curado» |
| `sonda-camino-del-dedo.mjs` | 🔴 **el camino completo**. *El único que caza un tap roto* |
| `sonda-tocar.mjs` | `tocar()` no deja tocar sin verificar · `porClave()` nombra la clave, no la copia · `claveAnon()` elige por el claim · `conResiduoCero()` lanza si quedó residuo |
| `verificar-corridas-subtx.sh` | rechaza toda `corrida-*.sql` que escriba sin `BEGIN … ROLLBACK`. **Rojo producido con control negativo** |
| `corrida-*-subtx.sql` | lo que exige escribir, entre `BEGIN` y `ROLLBACK`, **con residuo medido después** |
| `levantar-cliente-web.sh` | la web con la API viva. Lleva el aviso de la `service_role` |

> 🔴 **Y la regla que las gobierna a todas, firma del founder:** *medir una
> pantalla por su ruta directa responde «¿esta pantalla anda?», no «¿se puede
> comprar?».* **Toda sonda entra por donde entra el dedo.**
