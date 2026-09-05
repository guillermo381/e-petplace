# Capturas · los filtros de la línea de vida (emulador Android)

Claro arriba, oscuro abajo, en la misma pantalla.

**Lo que estas capturas contestan y el gate no puede:** *¿cuántas filas se
dibujan?* El gate mide el reparto —quién va en cada fila y cuántos caen en
cada una—, pero el reparto es una intención hasta que alguien la ve con los
textos reales.

## 01 · los ocho — dos filas, 4 y 4

Con «Antiparasitario» y «Adiestramiento», los dos más largos, **las dos filas
cerraban limpias en los dos temas.** El subconjunto de tres monta una sola
fila: la vacía no deja una línea de aire.

## 02 · 🔴 el noveno no entraba en dos — y ahí se ve la forma de hoy

Con `guarderia` y el reparto en 4 y 5, **«Recuerdos» bajaba a una tercera línea
visual**, en claro y en oscuro. El `flexWrap` interno hizo su trabajo —nada se
recortó— pero eran dos filas declaradas y tres dibujadas.

La cuenta, medida sobre la captura en claro (430 pt):

| | px |
|---|---|
| ancho útil de la fila | 816 |
| usado hasta «Guardería» | 738 |
| aire que queda | 78 |
| «Recuerdos» + su gap | 192 |
| **faltaban** | **114** |

### ⚠️ Y lo que esta captura muestra es EXACTAMENTE el reparto de hoy

Mirala de nuevo: **clínico (4) · oficios (4) · «Recuerdos» solo.** Es el mismo
agrupamiento que el founder declaró después — el `flexWrap` lo produjo por
desborde, y hoy está escrito. **La imagen no cambia; cambia que era un
accidente del ancho y ahora es una decisión.**

*Que la forma coincida no reemplaza verla con el reparto puesto* — lo que falta
es confirmar que sale igual, no descubrir cómo se ve. Ver abajo.

## 🔴 Lo que NO está capturado, y por qué

**Las tres filas DECLARADAS no se pudieron ver.** Seis intentos, cinco
mecanismos distintos —recargar, dev menu, `--clear`, puerto nuevo, `pm clear`
del dev client—: el bundle **nunca llegó** (`Bundled` en cero en el log de
Metro) y la app siguió mostrando su pantalla de bienvenida.

**Hallazgo del intento, que sirve para la próxima:** `expo start` con el puerto
ocupado **saltea el dev server y sigue corriendo** —imprime *«Skipping dev
server»* y no falla—. Ahí Metro parece vivo, responde 200 en otro puerto, y el
aparato muestra un bundle viejo sin que nada avise. *Antes de capturar,
verificar que el log diga `Bundled` al menos una vez: un dev server que
saltea es un instrumento que miente por el entorno.*
