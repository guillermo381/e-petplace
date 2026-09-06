# Candidato para el lote 2 — `sugerir-raza` sin catálogo en el prompt

> **Medido antes de proponerlo.** La regla era: *si gana en las dos, es decisión
> de producto; si no, queda escrito.* **No gana en las dos. Queda escrito.**

## La idea

No mandarle el catálogo al modelo. Que devuelva hasta tres **nombres de raza en
español**, y que la edge los case por `nombre_norm` contra `cat_razas`; lo que no
casa, se descarta.

## Lo que se mantuvo igual, para que la comparación valga

Mismo conjunto (146 fotos, misma verdad), mismo modelo (Sonnet 5), `max_tokens`
1000, razonamiento apagado, **y el mismo prompt de D salvo la sección del
catálogo y la forma de la salida**. Una cosa a la vez.

**La precondición, medida antes de escribir una línea: cero colisiones de
`nombre_norm` en las 137 razas de perro y gato.** Si dos razas tuvieran el mismo
nombre normalizado, una quedaría inalcanzable y el experimento estaría midiendo
un empate arbitrario.

## LA TABLA

| | **con catálogo** (hoy) | **sin catálogo** |
|---|---|---|
| **top-1** | **82,9 %** | **68,8 %** |
| **top-3** | 93,8 – 95,9 % | **72,2 %** |
| costo por foto | $0,0072 | **$0,0034** |
| p95 | 2.656 ms | **2.129 ms** |
| respuestas vacías | 0 | 0 |

**Pierde 14,1 puntos de top-1 y ~22 de top-3. Gana 2,1× en costo y medio segundo.**

## Por qué pierde — y es lo que decide, no el número

**91 de los 255 nombres devueltos (36 %) no casan con el catálogo.** Y al
mirarlos, **casi todos son la raza CORRECTA con otro nombre en español**:

```
   Birmano                    (catálogo: «Birmano (Birman)»)
   Ruso azul                  (catálogo: «Azul Ruso»)        ← orden de palabras
   Sphynx                     (catálogo: «Sphynx (Esfinge)»)
   Británico de pelo corto    (catálogo: «British Shorthair»)
   Braco de Weimar            (catálogo: «Weimaraner»)
   Caniche (Poodle)           (catálogo: «Poodle»)
   Pastor Belga Malinois      (catálogo: «Pastor Belga»)
```

**No es que el modelo reconozca peor: es que en español una raza no tiene UN
nombre.** Lo probé aflojando el casamiento todo lo que se puede sin inventar
sinónimos:

| casamiento | top-1 | top-3 |
|---|---|---|
| estricto (`nombre_norm` exacto) | 68,8 % | 72,2 % |
| + aceptar el nombre sin el paréntesis | 71,5 % | 77,1 % |
| + orden de palabras indiferente | **72,2 %** | **77,8 %** |

**Aun con el casamiento más generoso posible sigue 10,7 puntos por debajo**, y
**77 de 255 nombres (30 %) todavía no casan** — todos sinónimos reales.

⇒ **Cerrar esa brecha pide una tabla de sinónimos por raza. Y eso es el catálogo
otra vez, entrando por la puerta de atrás** — con la diferencia de que llegaría
*después* de que el modelo contestó, cuando ya no puede corregirlo, en vez de
*antes*, cuando todavía lo guía.

**La lista cerrada en el prompt no es sobrecarga: es la tabla de sinónimos
haciendo su trabajo en el momento en que sirve.**

## Veredicto

**NO va.** Pierde exactitud donde el producto la necesita —la raza que se le
propone a una familia— y lo que gana es $0,0038 por foto. *Sobre 10.000
sugerencias son 38 dólares contra 14 puntos de acierto.*

## Lo que SÍ deja, y no es poco

1. **Un número para el costo del vocabulario.** Con catálogo: $0,0072 y 82,9 %.
   Sin catálogo: $0,0034 y 68,8 %. **El catálogo cuesta el doble y vale 14
   puntos.** Si algún día hay que recortarlo por plata, ése es el precio.
2. **Los 77 nombres que no casan son un censo de sinónimos gratis** — están en
   `.ia-conjuntos/candidato-sin-catalogo-*.json`. Si alguna vez se quiere que el
   buscador de razas del alta acepte «Caniche» o «Braco de Weimar», la lista ya
   está medida.
3. **Y una advertencia para el diseño de la edge:** casar por nombre y
   **descartar en silencio lo que no casa** significa que el 36 % de lo que el
   modelo dijo desaparece sin dejar rastro. Si alguna vez se hace, **lo
   descartado se registra** — si no, la próxima vez que alguien mida va a ver
   una exactitud baja y no va a poder saber si el modelo falló o si el
   casamiento se comió la respuesta.
