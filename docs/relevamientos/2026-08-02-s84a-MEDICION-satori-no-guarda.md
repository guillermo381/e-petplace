# S84-A8 ① · POR QUÉ EL PERFIL DE SATORI NO SE PUEDE USAR — medido, sin curar

> **Respuesta corta a la pregunta que la mesa hizo: SÍ, la salida (a) se muerde
> la cola.** Y el bloqueo es más grande que el teléfono.

---

## 1 · LO QUE FALLA, EXACTAMENTE

**El flujo simulado con las funciones LITERALES del archivo** (extraídas de
`cuenta/perfil.tsx`, no reescritas) y el valor REAL de la fila:

```
valor en DB           : 573208408790
partirE164 devuelve   : null  (no empieza con '+' ⇒ no se parte, por diseño)
el campo muestra      : 573208408790          ← con el indicativo ADENTRO
el selector queda en  : EC (el default, porque no se pudo partir)

si el dueño elige EC → se mandaría: +593573208408790   · ¿pasa el formato? false
si el dueño elige CO → se mandaría: +57573208408790    · ¿pasa el formato? false
```

**Elegir el país correcto NO alcanza: DUPLICA el indicativo.** El `57` ya está
dentro del valor guardado, y `componerE164` le antepone otro. Las dos opciones
fallan la validación del país, así que **el botón Guardar rebota antes de mandar
nada**.

**Lo único que funciona hoy es borrar el `57` del campo a mano y elegir CO** →
`+573208408790` ✅. **Y nada en la pantalla se lo dice.** La voz mostraría
*"se guarda +57573208408790"* — visiblemente raro, pero no dice *"borrá el 57"*.

---

## 2 · EL BLOQUEO NO ES DEL TELÉFONO: ES DEL PERFIL ENTERO

**Éste es el hallazgo que cambia la urgencia.** El `guardar()` valida los cuatro
campos de contacto **juntos y antes de mandar** (Ley 23 — la puerta no ofrece lo
que va a rechazar):

```ts
const malos = [ …estadoTelefono(telNegocio) …estadoTelefono(whatsapp) … ];
if (malos.length > 0) { setAbierta('contacto'); mostrar(…); return; }
```

⇒ **Con el WhatsApp legado inválido, NO SE PUEDE GUARDAR NADA DEL PERFIL.** Ni
la descripción, ni el logo, ni la sede, ni el sitio web. **Un dato viejo en un
campo opcional bloquea la pantalla completa.**

**Y la fila de Satori está justamente vacía donde más importa** (medido):

| campo | estado |
|---|---|
| `descripcion` | **NO tiene** |
| `foto_url` (logo) | **NO tiene** |
| `email_contacto` | NULL |
| `whatsapp` | `573208408790` ← el que bloquea |
| estado · cuenta · coords · sitio web | ✅ activo · ✅ · ✅ · `satorilatam.com` |

**El cruce con ② es directo: sin poder guardar, no hay descripción — y sin
descripción no hay nada para que el escriba mejore ni para el pitch de
captación.** El bloqueo del teléfono está tapando el arco que la misma orden
manda arrancar.

---

## 3 · HAY TRES CAPAS BLOQUEANDO LO MISMO, y conviene saber el orden

1. **La pantalla** (`estadoTelefono` contra el `formato` del país) — rebota
   primero, y es la que el founder ve.
2. **El wrapper** (`telefonoValido` → `telefono_invalido`) — rebotaría igual si
   la pantalla no existiera.
3. **El CHECK `NOT VALID`** de la DB — la red final.

**Ninguna de las tres está mal.** Cada una hace lo que se firmó. **El problema
es que el dato legado no tiene camino de salida por ninguna**, y las tres lo
rebotan con la misma cara.

---

## 4 · LO QUE ESTO LE HACE A LA DECISIÓN (a) vs (b)

**(a) "el dueño confirma desde la pantalla" — ROTA COMO ESTÁ.** No porque la
idea sea mala, sino porque **el gesto que la salida asume ("elegí tu país y
guardá") produce un número inválido**. La salida (a) supone un campo que
contiene el número NACIONAL; el dato legado contiene el INTERNACIONAL sin `+`.
**Son dos formas distintas en el mismo campo y la pantalla no las distingue.**

**Las tres salidas, ahora que el cuadro está medido:**

**(a′) LA PANTALLA PROPONE Y EL DUEÑO CONFIRMA — y NO viola P21.**
Si el valor empieza con un prefijo del catálogo, `partirE164` puede partirlo
**proponiendo** ese país en el selector, **con el dueño confirmando al guardar**.
*Eso no es inferir: es ofrecer una lectura que la persona acepta o corrige* — la
diferencia exacta que P21 marca (prohíbe **derivar** el país del `country_code`,
no prohíbe proponerle al dueño lo que el propio número dice).
**Costo:** ~6 líneas en `partirE164` (quitar el `if (!v.startsWith('+'))` y
comparar contra el prefijo sin `+`). **Es territorio de la pantalla.**
**Riesgo declarado:** con `+1` el país propuesto puede ser el equivocado entre
cuatro — pero el **prefijo** sería correcto, y el dueño lo ve antes de guardar.

**(b) PROMOCIÓN MECÁNICA EN DB** — sigue disponible y sigue siendo honesta: cura
4 de 5 sin inferir (el indicativo ya está en el número) y la del seed cae sola.
**Pero no arregla la pantalla:** el próximo prestador con un número legado de
otra fuente choca igual.

**(c) NO HACER NADA** — el founder borra el `57` a mano y guarda. **Funciona
hoy, para él.** No escala y no deja rastro de por qué hubo que hacerlo.

> **Recomendación con su porqué: (a′) + (b).**
> **(a′) cura la CAUSA** —la pantalla deja de tener un modo de falla mudo con
> datos legados— y **(b) cura los DATOS** que ya existen. Una sola de las dos
> deja la mitad viva: con (b) sola, la pantalla sigue rota para el próximo caso;
> con (a′) sola, las cinco filas siguen sin poder editarse hasta que su dueño
> entre.
> **Y el orden importa: (a′) primero.** Si (b) corre antes, las filas quedan
> curadas y **el bug de la pantalla se vuelve invisible** — hasta que aparezca
> un dato legado nuevo y nadie recuerde por qué.

**NO SE EJECUTÓ NINGUNA.** La orden dijo medir y traer; la decisión es de la mesa.
