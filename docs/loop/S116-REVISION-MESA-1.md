# S116 · REVISIÓN DE MESA 1 — láminas de los lotes 1 y 2

Mesa, 13-sep-2026. Contra el sketch (versión morada) y `LETRA_REDISENO_S116`. Lo que sigue son hallazgos con dueño; las decisiones nuevas van marcadas **[firma]** y quedan firmadas salvo que el founder las revierta.

## 1. Glifos (hoja de contacto y hoja de vecinos) — dueño B, ahora

- **La huella se va de todos los glifos.** Letra §1: los glifos no llevan huella. Hoy la llevan laboratorio, alimento, alergia, microchip, medicamento, receta, papel, documentos, vacuna, despensa, seguros y ayuda. Se quita de los doce sin excepción; a 21 px es suciedad, lo dijo la propia hoja con urgencias.
- **Trazo desigual.** agregar/quitar/favorito/calificación van gruesos; hora/microfono/salir van finos. Un solo trazo (1,8) y un solo tamaño óptico para todo el set: un ícono no puede pesar más que su vecino.
- **Cuatro no se leen o se confunden:**
  - *personalidad* (círculo con cruces) se lee como globo o mira. Redibujar.
  - *ayuda* y *personalidad* son casi el mismo dibujo. Ayuda = signo de pregunta en círculo (mock).
  - *receta / papel / documentos / copiar* son cuatro rectángulos. Receta = «Rx» como el mock; documentos y copiar se diferencian por la esquina doblada vs. dos hojas; papel se retira si no tiene consumidor propio.
  - *microchip* es una mancha densa. Cuadrado con cuatro patas por lado, nada adentro.
- *seguros*: escudo con check (mock «Verificado»), sin huella. *alergia*: triángulo con signo, sin huella. *alimento*: el cuenco solo.
- La hoja de contacto vuelve a correr sobre el set corregido, a 21 y 48, y viene en el parte.

## 2. Ícono de la app y silueta de notificación — dueño B, ahora

- **[firma] Ícono de la app = la nariz del ilustrador tal cual (magenta con contorno negro), sobre ciruela.** De las cuatro vías, a 48 px es la única que se lee nítida; sin placa se funde, en blanco es una mancha. Zona segura 66 % para Android adaptativo.
- **La silueta de notificación se rehace.** Lo que hay lee como polilla a 24 px porque conserva bigotes y comisuras. Silueta = el corazón-nariz relleno con las dos fosas como hueco, y nada más. Se prueba a 24 y 48 sobre ciruela y sobre gris de barra.

## 3. Lo que las cuatro pantallas dicen del lote 1 (piel nueva sobre estructura vieja)

Lo importante: **Baloo no aparece en ninguna pantalla.** Sin los títulos en Baloo la app no se parece al sketch aunque los colores estén. Los títulos siguen en un token de tipografía viejo (fino, PJS 400). Hay que medir por qué: si el token `titulo` no apunta a Baloo, es del lote 1 y lo corrige B; si las pantallas usan un token propio, es de C en su lote.

**[firma] Mueren en el cliente, con lápida, cuando cada lote toque su pantalla:**
- **La fuente mono** («domingo, 13 de septiembre», «1 cosa», «$6.00», «14:49», «2026-09-13 · 15:00 · 30 min»). Los metadatos van en PJS; las cifras en Baloo.
- **La serif del nombre de la mascota** («Zeus» en Expediente). Baloo.
- **Los círculos decorativos translúcidos** en la cabecera y **la marca de agua** del isotipo detrás de «Buscar en tu familia». El sketch no los tiene; son ruido.
- **Las tarjetas con contorno negro grueso** (las tres «Kira · En vivo»). En el lenguaje nuevo la tarjeta es blanca con hairline y sombra; el estado va en pastilla.
- **La esfera ocre** de la alerta de leptospirosis y **el canto ocre** de esa tarjeta: el ocre murió con la 3(a). Alerta = tarjeta base + pastilla ámbar «Pendiente» + botón terciario.
- **El orbe morado del coach** que flota sobre el contenido (tapa «Ver cómo va»). Lo reemplaza el botón del asistente en el lote 3.
- **El isotipo en línea fina** arriba a la izquierda del Hogar: no se reconoce. Va el logo nuevo chico, o nada.

**[firma] Reglas de estructura que salen de ver estas cuatro:**
- **Las pantallas empujadas no llevan barra de tabs** (Confirmar y pagar la tiene hoy). En el sketch, detalle, agendar y pago no la tienen: el CTA fijo abajo es lo único. C lo aplica en el lote 3 para todo el cliente.
- **Los títulos de sección del cuerpo** («Su salud», «A nombre de», «Sesión y cuenta») van en título 2 Baloo, no en PJS bold ni en PJS regular grande.
- **El texto del CTA** va PJS 700 16 blanco; en «Pagar» se ve fino. Verificar el token.
- **Las herramientas de sesión no se ven en producto** («Lámina S74 · la fusión del avatar» en Cuenta). Solo en dev, o fuera.
- El avatar del hogar es un cuadrado redondeado; el sketch usa círculo con anillo. Círculo (lote 4).
- «Pasaporte y QR» rompe en dos líneas bajo su círculo: los accesos rápidos llevan una palabra o el círculo crece (lote 4).

## 4. Un rojo que no es de diseño — dueño A, medir ahora

En «Confirmar y pagar» el total dice **`$6.00`** con punto decimal. La ley de S115 es coma decimal y una sola fuente (`moneda.ts`). O esa pantalla no pasa por la fuente única, o la fuente está mal. Se mide, no se supone; si es un bypass, es ficha roja porque la veda de producción no lo cubre. Y la fecha «2026-09-13 · 15:00 · 30 min» es formato de máquina: la familia lee «sáb 13 sep · 3:00 p. m. · 30 min» (lote 5).

## 5. Lo que está bien y se queda

La barra de tabs con el círculo elevado se ve como el sketch. La pastilla «Necesita atención» y la de «Pronto» funcionan. Los cuatro accesos rápidos en círculos blancos funcionan. El «Ponte al día» con «1 cosa» es la narrativa de loyalty bien hecha (solo cambia la fuente del número). Los campos con halo se ven bien. El CTA magenta en pantalla convive con la nariz.
