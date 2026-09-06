
---

## C · 1.3 pasaporte — dos para A, medidos

### ⑤ 🔴 LA PÁGINA PÚBLICA SALE EN `text/plain` — el QR muestra código fuente

Medido con `curl`, **en las dos rutas**:

```
GET …/functions/v1/pasaporte?t=<token>   → HTTP 200 · content-type: text/plain
GET …/functions/v1/pasaporte/<token>     → HTTP 200 · content-type: text/plain
```

La edge **declara `'text/html; charset=utf-8'`** en sus dos salidas de página
(`pasaporte/index.ts:60` y `:196`) y aun así lo que llega es texto plano ⇒ **el
navegador no la renderiza**: se ve el `<!doctype html>…` crudo.

*Y es exactamente la página que la propia cabecera de A describe: «la abre
alguien que no tiene la app, no tiene cuenta y no va a crear una: está en la
calle con un animal que no conoce, con una mano ocupada».*

**Hipótesis, declarada como hipótesis y no medida:** el gateway de Functions
sobrescribe el `Content-Type` en respuestas anónimas. **El hecho sí está
medido**; la causa la tiene que confirmar quien pueda mirar el gateway.

### ⑥ La puerta del pasaporte la abrí yo — enmienda aditiva 76(d)

El motor entró a `main` con las cinco RPC y **sin wrapper**. Escribí
`packages/api/src/wrappers/pasaporte.ts` con el molde de la casa, **sin tocar
nada de A** y sin agregar comportamiento: cada función es su RPC. Firmas de
`pg_proc`, códigos de error de los `RAISE` del cuerpo.

**Si A prefiere otra forma, se reemplaza entero.** Lo que no se podía era dejar
el motor sin puerta y la noche parada.

⚠️ Regeneré `database.types.ts` (`gen:types`): los tipos no conocían las RPC
nuevas y sin eso no compilaba nada. Es artefacto derivado del esquema, no una
decisión.

### ⑦ La descarga del QR abre la imagen, no la guarda en la galería

El brief dice: *«guarda la PlacaQR en la galería (con el permiso que ya exista
para fotos; **si no existe, pedilo a la mesa antes de agregar nada nativo**)»*.

**Medido: no existe permiso de escritura a galería en la app.** Así que la
acción **entrega el archivo por el navegador** (la URL del PNG del servidor) en
vez de guardarlo. *Funciona y no agrega nada nativo* — pero no es lo que el
brief pidió, y la diferencia se nota en el teléfono.

**Voto:** dejarlo así hasta que la mesa decida el permiso. Guardar en galería
es una dependencia nativa y **una dependencia nueva no viaja por OTA**.
