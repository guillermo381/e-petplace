# S113 · LO QUE ENTRA CON LA BUILD NATIVA

Todo lo de acá comparte una sola razón: **es una dependencia o un permiso
nativo, y eso no viaja por OTA**. Se junta en un archivo para que no haya que
pedir una build por cada cosa — *y para que el día que se pida, no falte
ninguna*.

⚠️ **Nada de esto se dibuja hoy.** Un control que promete algo que la app no
puede hacer es peor que su ausencia: el ausente no promete.

---

## ① NFC · grabar la chapita (C6 del 1.3)

**No arrancado.** Vive en `pista/s113-c-nfc`, que **no se mergea a `main`** por
diseño — y `ota:deps` tiene que dar **rojo** en esa rama: es el control de que
no se mezcló.

Lo que pide: el módulo nativo, detección de capacidad **en runtime** (el módulo
existe **y** el aparato tiene NFC), y si no, **el botón no se monta**. iOS sólo
escribe con la app en primer plano, y **eso se dice en la voz**.

## ② Guardar el QR en la galería (C2 del 1.3)

**Medido: no existe permiso de escritura a galería en la app.** Por eso el botón
**no se dibuja** — no está apagado ni con un cartel: no está.

Hoy la acción se llama **«Compartir el QR»** (firma del founder) y manda la
imagen al share del sistema, que ya ofrece WhatsApp, Gmail y Archivos **sin
pedir un solo permiso**.

## ③ Compartir el ARCHIVO del QR, no su enlace

Y acá está el matiz que hay que saber antes de la build, porque **cambia lo que
la gente ve en la hoja de compartir**:

| | hoy (sin build) | con la build |
|---|---|---|
| qué se comparte | **el enlace** a la imagen | **el archivo** |
| aparece «Fotos» | no | sí |
| WhatsApp / Gmail | sí, con el enlace | sí, con la imagen |

**Medido:** `Share` de React Native lleva `message` y `url`, y **`url` la
respeta iOS mientras Android la ignora**. Para poner el archivo en la hoja del
sistema hace falta **`expo-sharing`**, que **no está instalado** (verificado en
`node_modules`) y es nativo.

⇒ Con la build: instalar `expo-sharing`, bajar el PNG con `expo-file-system`
—que **sí** está— y compartir el archivo local.

---

## Cómo se cierra esto

Una sola build las lleva a las tres. **El orden importa**: `expo-sharing` y el
permiso de galería son de la misma pantalla (el pasaporte), así que salen
juntos; NFC es su propia rama y se mergea **sólo cuando esa build exista**.
