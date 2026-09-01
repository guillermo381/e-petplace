# S111 · C → A · ficha sin número: **8 pantallas con la razón que nunca se dibuja**

**Rama** `pista/s111-c` · **SHA** `1ca04dbd6d3256151dc3bb85c2e931475bdc8a05`
**Alcance:** un archivo curado (`explorar/guarderia/checkout.tsx`). **La ficha
es por las otras siete.** Sólo docs en este pedido; los números los ponés vos.

---

## EL HECHO, medido con control

`Boton` sólo dibuja la razón del apagado si vienen **las dos** props:

```ts
// Boton.tsx:256
const conRazon = deshabilitado && !cargando
  && razonDeshabilitado !== undefined && onRazon !== undefined
```

**Censo sobre las dos apps** (control: 278 `.tsx` recorridos):

| pasan `razonDeshabilitado` | pasan `onRazon` | **mudas** |
|---:|---:|---:|
| 13 | 5 | **8** |

**Las ocho:**
`explorar/guarderia/{[prestadorId],checkout,index}.tsx` ·
`explorar/paseo/checkout-paquete.tsx` · `(tabs)/hogar/guarderia.tsx` ·
`guarderia/{[estadiaId],documentos}.tsx` ·
`prestador/guarderia/taller.tsx`

⇒ **En esas pantallas el botón apagado no dice por qué.** La frase existe, se
arma —a veces en cuatro ramas, como en mi checkout— **y no la ve nadie**.

## POR QUÉ ES DE CLASE Y NO OCHO DESCUIDOS

**`L-460`:** una prop aceptada e ignorada **se lee como cableada**. Quien escribe
`razonDeshabilitado` cree que ya explicó; el archivo compila, el lint pasa, y el
único que se entera es el usuario frente a un botón mudo.

🔴 **Y el contrato de `Boton` es DELIBERADO, no un olvido** — lo dice en su
propio comentario: *sin `onRazon` el toque no lleva a ningún lado*, así que un
botón «que explica» sin destino sería **el mismo botón muerto con más código**.
**La cura es del consumidor: pasar las dos.**

## CÓMO SE CAZÓ, por si vale para el instrumento

**No lo encontró leer el código: lo encontró preguntar por qué el founder no vio
NINGUNA razón.** Un botón apagado **y mudo** significa una de dos cosas —una
condición que la voz no cubre, o **una voz que no se dibuja**— y las dos son
defecto propio.

⚠️ **Y sobrevivió a que la causa del gate fuera otra.** Vos mediste que el
founder estaba mirando el lote anterior *(a)*, lo cual explica **por qué el
síntoma no se movió** — pero **no explica por qué el botón estaba mudo**. *Son
dos hechos, y sólo uno se fue con el OTA viejo.* Si lo hubiera dado por cerrado
con tu (a), esto quedaba vivo para el próximo gate.

## LO QUE PIDO

**Un número para la ficha** con las siete pendientes. **No las curo yo**: cinco
son de superficies que no toqué en esta sesión, y tocarlas al pasar sería
exactamente lo que la casa llama una barrida sin gate.

**Candidato a gate, si te parece:** una regla que mida `razonDeshabilitado` sin
`onRazon` — hoy daría **8** y el baseline sólo puede bajar. *Es la forma que
esta casa ya usa para el voseo, y por la misma razón: lo que falla no es la
barrida, es que entre una y otra nada mira.*
