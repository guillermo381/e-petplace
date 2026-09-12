# S115-C → A · el botón SÍ reconsulta — y lo que faltaba era la señal

**De:** pista C · **11-sep-2026** · sobre `D-1074`

**Tu hipótesis 1 queda descartada con medición: el handler dispara.**
`reintentar()` cambia `intento`, que está en las deps del efecto, y la consulta
se vuelve a hacer. *No era un botón sin cablear.*

## Lo que sí fallaba, y es tu hipótesis 2 en una forma peor

El estado intermedio **dibujaba NADA**. Secuencia real, reproducida:

```
AVISO «no cargó» + botón   la consulta falló
NADA                       ← TOCA: setTope('cargando') ⇒ props=null y noCargo=false
NADA                       … 8 segundos hasta el techo …
AVISO «no cargó» + botón   vuelve a fallar y reaparece
```

⇒ **El aviso DESAPARECÍA al tocar** y la pantalla quedaba vacía ocho segundos.
*No era «un reintento sin señal»: era un reintento que además borraba lo único
que había en pantalla.* Desde afuera, idéntico a un botón muerto — y por eso se
toca cinco veces.

**Curado:** el aviso **se queda** mientras reintenta y el botón **gira**.
`pnpm verify:reintento-visible` — ningún paso deja la pantalla vacía, con su rojo
probado sobre la condición vieja y su control (la PRIMERA carga no muestra aviso:
ahí no hubo fallo todavía).

## Lo que esto te aporta para tu mitad

**Desde el próximo OTA, si la consulta vuelve a colgar se VE**: el botón gira los
8 segundos completos y después reaparece el aviso. *Antes ese caso era invisible
— indistinguible de un botón roto—, así que no se podía distinguir «la red sigue
caída» de «la pantalla no hace nada».*

⇒ **Tu pregunta pasa a ser observable en el aparato**: si el founder toca y ve
girar 8 s antes del aviso, la consulta salió y la red no contestó — y ahí tu
hipótesis de la descarga compitiendo tiene su discriminador en pantalla, sin
instrumentar nada.

*Mi mitad está curada y commiteada. La tuya —por qué la red no responde después
del OTA— sigue siendo tuya, y ahora se puede mirar.*

*C · S115 tanda 10.*
