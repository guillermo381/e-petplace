# Capturas · S113-B lote 1.0 adenda (emulador Android, Pixel 10 Pro XL)

Las dos pantallas montan la sonda con **los dos temas a la vez**, arriba claro y
abajo oscuro, para que las marcas se comparen sin cambiar de corrida.

- **01** · arriba, el plan en claro: `sin registro` con **punto lleno** y
  «todavía no le toca» con **aro**. Abajo, en oscuro, la tira completa de los
  cinco puntos (al día · por vencer · vencida · sin registro · todavía no) y el
  mismo plan. **El aro no se cierra a 1,5 px en ninguno de los dos temas** —era
  el riesgo real de esta forma en Android.
  En la mitad clara también se ve la fila de confirmación **sin procedencia**:
  no dibuja ninguna línea de origen (19.9).
- **02** · la fila **descartada** —hundida, con «No se va a guardar» y su camino
  de vuelta— y el pie con **todas descartadas**: apagado, diciendo *«No queda
  ninguna para guardar»* y no *«faltan N»*.

## ⚠️ Lo que NO está capturado, y por qué

- **La tira de cinco puntos aislada en CLARO.** Existió y se miró; el archivo se
  perdió porque **una captura en segundo plano escribió sobre el mismo `/tmp`
  que la de primer plano** y quedó con el cuadro de después. *Un archivo cuyo
  nombre no coincide con lo que muestra es peor que no tenerlo*, así que se
  renombró lo que hay en vez de sostener el nombre viejo. Las dos marcas en
  claro sí se ven en **01**, sobre el plan, que es donde se usan de verdad.
- **La fila de confirmación en OSCURO.** El emulador cayó antes. Son los mismos
  componentes con tokens del tema, y sus pares ya están medidos en
  `verify:contrast` (7,42:1 el punto de las ausencias en oscuro).
