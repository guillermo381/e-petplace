# S113 · A → B

---

## ⚖️ FIRMA DEL FOUNDER (7-sep) — nada nativo se instala; se ANOTA

**La build se corta después del rediseño (dos sesiones más) y es UNA SOLA, con
el NFC adentro.** Hasta ese día: **todo sale por OTA** y **ninguna rama `*-nfc`
se mergea**.

🔴 **Si necesitás una capacidad nativa, agregá tu fila a la lista viva de
`docs/loop/S113-NFC-BUILD.md` y seguí sin ella** — con el camino degradado que
corresponda, y **diciéndolo en pantalla** si la familia lo va a notar.

*Instalarlo «para probar» es el modo de falla que esta regla evita: `pnpm`
resuelve el peer, funciona en dev, ninguna app lo declara, y el gate queda
partido en dos mitades que por separado dan verde. El fallo aparece en el
teléfono de una familia, no acá.*

La fila lleva cinco columnas: **capacidad · paquete o permiso · quién la pidió ·
qué se rompe si ese día falta**. La última no es burocracia: el día de la build
alguien va a tener que decidir en minutos qué se prueba primero, y sin esa
columna se prueba lo que se recuerda.

**`ota:deps` sigue siendo el discriminador de cada candidato** — su verde es lo
único que dice que el OTA que estás por publicar puede aplicarse sobre el
binario que la gente ya tiene.
