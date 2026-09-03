# S112-E → FOUNDER · DOS MINUTOS TUYOS PARA CAZAR EL CRASH DEL HILO

> **No hace falta que saques ninguna captura de pantalla ni que copies nada.**
> Con que conectes el cable alcanza: yo leo el registro del teléfono entero.

---

## POR QUÉ ESTO NO PUEDE ESPERAR NI HACERSE DE OTRA FORMA

**La app no reporta sus errores a ningún lado** (`D-1008`, medido por A: cero
Sentry, cero Crashlytics, cero tabla, cero telemetría). Cuando el hilo revienta,
el error **se imprime en el registro del teléfono y ahí muere**.

> **Hoy, conectar el cable es la única manera de que este error exista para
> alguien.** Sin eso, lo único que hay es «se cierra», que no alcanza para
> curarlo.

---

## LO QUE TE PIDO, EN ORDEN

**① Conectá el teléfono por USB, con «Permanecer activo» encendido.**
*Ya dejé un arnés esperando: en cuanto el cable entre, arranca solo y empieza a
grabar. No hay ventana que perder ni nada que cronometrar.*

**② Decime «listo».** Yo confirmo que lo veo y que estoy grabando.

**③ Antes de tocar nada: abrí `Cuenta` en la app CLIENTE y leeme el pie.**
Tiene que decir **`01a06586`**. En la app de NEGOCIOS tiene que decir
**`01a06587`**.
> *Si dice otra cosa, el teléfono está corriendo un bundle viejo y el error que
> capturemos va a mandarnos a código que ya no existe. Son diez segundos que
> evitan perder la pasada entera.*

**④ En la app CLIENTE: abrí el hilo de adopción hasta que se cierre.**
Andá a tus solicitudes y abrí la conversación. **Si se cierra, abrila de nuevo y
que se cierre otra vez** — la segunda vez suele traer más detalle.

**⑤ Y ACÁ ESTÁ LA PARTE QUE MÁS SIRVE, y te lleva un minuto más:**
probá con **animales distintos**, y decime **con cuáles se cerró y con cuáles
no**:

| animal | qué tiene |
|---|---|
| **Kira · Kira Dos · Kira Tres** | perras **sin raza declarada** ⇒ sin imagen de raza |
| **Pepe** | ave, **con** imagen de raza |
| **Jack** | gato, **con** imagen de raza |

> **Si se cierra con las Kiras y NO con Pepe ni Jack, el problema no es el chat:
> es la foto del animal cuando no hay ninguna.** Esa sola respuesta le ahorra a
> las otras pistas medio día de buscar en el lugar equivocado — y la das vos con
> tres toques.

**⑥ Repetí ④ y ⑤ en la app de NEGOCIOS**, abriendo la solicitud desde Home.

**⑦ Decime «terminé».** Yo corto la grabación y reparto el error a quien lo
tiene que curar.

---

## LO QUE NO TENÉS QUE HACER

- **No copies el error ni le saques foto.** Queda grabado entero, con muchísimo
  más detalle del que se ve en pantalla.
- **No cierres las apps «para limpiar».** El registro se limpió al conectar.
- **No te preocupes si se cierra varias veces.** Cuantas más, mejor: cada cierre
  deja su propia traza.

---

## EL ESTADO DE AHORA

| | |
|---|---|
| `adb` en la Mac | ✅ **funciona** (medido) |
| el teléfono en el USB | 🔴 **no está** — `adb devices` vacío y el Mac no ve ningún Android en el bus |
| el arnés | ✅ **armado y esperando**; arranca solo con el cable |
| lo que falta | **el cable, y tres toques tuyos** |

*Esta mañana el teléfono estaba conectado (`R5CY201ZDVL`); se desconectó en algún
momento del día.*
