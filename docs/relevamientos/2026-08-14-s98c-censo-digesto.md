# S98-C · EL CENSO DEL DIGESTO, COMPLETO — y la respuesta cambia la pregunta

**Solo lectura. Cero código tocado.** Mi antecesora dejó este censo a mitad:
tenía el lado de SERVICIOS y le faltaba el del VENDEDOR, y sin ese lado no se
podía decidir cómo se reparte el digesto entre las dos ventanas.

Su voto provisional, escrito sin el dato, era: *«el digesto se parte por mundo
y cada ventana lleva el suyo; hoy las tres fuentes irían enteras a la ventana
de citas»*. **Medido el otro lado, ese voto se sostiene — pero por una razón
distinta de la que suponía, y la diferencia importa.**

---

## 1 · LADO SERVICIOS — un DIGESTO de fuentes heterogéneas

`(tabs)/index.tsx`, bloque «Necesita tu atención». **Cuatro fuentes
declaradas, TRES vivas** tras la mudanza de §3.1bis:

| fuente | destino |
|---|---|
| citas por coordinar | `/veterinaria/coordinar/[citaId]` |
| presupuestos sin respuesta | `/veterinaria/movimiento` |
| atenciones sin cerrar | `/cita/[citaId]` |
| ~~handshakes~~ | ☠️ murió con §3.1bis (se mudó a `ATENDER`) |

Sus dos leyes, que son del bloque y no de las filas:
- **regla de existencia**: sin nada esperando, **el bloque no se monta** — un
  «Necesita tu atención: 0» convierte estar al día en un renglón que hay que
  leer para descartar.
- **una fuente que no pudo leerse NO cuenta como cero**: su fila no se pinta y
  tampoco se afirma que no hay nada. *Decir «estás al día» por un fallo de red
  es esconder trabajo pendiente, y sobre presupuestos eso es plata.*

**Lo que las tres tienen en común:** son de MUNDOS distintos, cada una lleva a
una PANTALLA distinta, y ninguna es la lista sobre la que está parada.

---

## 2 · LADO VENDEDOR — 🔴 NO HAY DIGESTO, Y NO ES UN HUECO

`ventas/index.tsx` (391 líneas). Lo medido:

- **NO existe bloque de «lo que te espera»** con fuentes heterogéneas.
- Lo que hay es **LA LISTA DE PEDIDOS, ordenada por lo que falta hacer** — su
  propia cabecera lo declara como la FIRMA de la pantalla (*«la lista se ordena
  por lo que falta hacer, no por hora; lo que espera acción preside, lo
  entregado se apaga y baja»*), y el código lo cumple: `activos` /
  `terminados` separados y `activos.sort` por un rango de trabajo
  (`index.tsx:77` — *«El orden del trabajo. Menor = más arriba»*).
- **UN solo número**: la cifra del techo (cuántos van sobre cuántos caben hoy).
- Al pie, un grupo de navegación —stock · mostrador · entregas · configuración—
  que es acceso al resto del módulo, **no un digesto**: no cuenta pendientes,
  no desaparece cuando no hay nada, y `entregas` solo se monta si las hay.

---

## 3 · LA CONCLUSIÓN, Y POR QUÉ NO ES LA QUE PARECÍA

La pregunta abierta era *«¿cómo se reparte el digesto entre las dos ventanas?»*.
**La medición la disuelve: no hay nada que repartir.**

> **El vendedor no necesita un digesto porque su pantalla ENTERA es el
> digesto.** Su trabajo es UN solo flujo —pedidos— y la lista ya está ordenada
> por pendencia. Un bloque «Necesita tu atención» encima de una lista que ya
> preside por lo que falta hacer **diría el mismo dato dos veces** (Chanel), y
> además tendría que inventarse fuentes para justificarse.
>
> El de servicios necesita digesto por lo contrario: su trabajo llega por
> TRES puertas que viven en tres pantallas distintas, y ninguna de las tres es
> la que el prestador está mirando. **El digesto existe para el trabajo que NO
> está a la vista.**

**Voto, ahora con el dato:** el digesto se parte por mundo —las tres fuentes
vivas van enteras a la ventana de citas— **y la ventana del vendedor NO lleva
uno.** Si algún día el vendedor gana trabajo que no sea un pedido (una
devolución que aprobar, un documento que subir, un repartidor que confirmar),
ahí nace su digesto — y su primera fila será esa, no una copia de las tres de
servicios.

**Disparo de revisión:** la primera fuente de trabajo del vendedor que NO viva
en la lista de pedidos.

---

## 4 · LO QUE ESTE CENSO NO DECIDE

⚠️ **Sigue en pie que esto va DESPUÉS de D-820**, y no por orden de tareas sino
porque *la ventana de pedidos del dual ES la del vendedor puro, construida una
vez*: mover el digesto antes de que esa ventana esté resuelta sería acomodar
muebles en una pared que todavía se puede correr.

Y no toco **D-820** en sí: mi antecesora dejó escrito que su línea —*«el
vendedor puro no enumera ninguna»*— quedó superada por la firma de doce horas
después (*todos los dueños ven casi lo mismo*), con la FORMA sobreviviendo
entera y cambiando solo su caso del vendedor. **Sigue sin tocar, por orden.**
