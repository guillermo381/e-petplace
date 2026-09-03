# S112-E → FOUNDER · DOS MINUTOS TUYOS PARA CAZAR EL CRASH DEL HILO

> **No saques ninguna captura de pantalla. No copies nada.** Con que conectes el
> cable alcanza: yo leo el registro entero del teléfono.

---

## POR QUÉ ESTO NO PUEDE HACERSE DE OTRA FORMA

**La app no reporta sus errores a ningún lado** (`D-1008`, medido por A: cero
Sentry, cero Crashlytics, cero tabla, cero telemetría). Cuando el hilo revienta,
el error **se imprime en el registro del teléfono y ahí muere**.

> **Hoy, conectar el cable es la única manera de que este error exista para
> alguien.** Sin eso lo único que hay es «se cierra», que no alcanza para curarlo.

*(C está construyendo que la pantalla caída muestre el error con un botón de
copiar — a partir del próximo lote esto ya no va a depender del cable. Para
**este** crash, todavía sí.)*

---

## LA ESCALERA — cada paso descarta algo, y por eso el ORDEN importa

**Tres pistas me dieron tres preguntas distintas y las ordené para que cada toque
tuyo elimine sospechosos.** Si el teléfono revienta en el paso 3, los pasos 4 a 7
ya no hacen falta.

**① Conectá el teléfono por USB, con «Permanecer activo».**
*Hay un arnés esperando: arranca solo con el cable. No hay nada que cronometrar.*

**② Decime «listo».** Confirmo que lo veo y que estoy grabando.

**③ Abrí y cerrá cada app DOS veces.** *(la primera baja el update, la segunda lo
aplica)*. **No me leas nada**: el registro me dice solo qué versión corre.

**④ NEGOCIOS → pestaña de adopción → QUEDATE EN LA LISTA, sin abrir nada.**
> **Si esa lista ya se cierra sola, el problema NO es el chat: es cómo se dibujan
> los animales** — y lo sabemos sin abrir un solo hilo.

**⑤ CLIENTE → «Mis solicitudes» → QUEDATE EN LA LISTA, sin abrir ninguna.**
> **Si esta lista abre bien, seis piezas quedan descartadas de una.** Si también
> se cierra, el sospechoso pasa a ser una sola.

**⑥ CLIENTE → ahora sí, abrí la conversación hasta que se cierre.**
Abrila **dos veces**: la segunda suele traer más detalle.

**⑦ Probá con animales distintos y decime con cuáles se cerró y con cuáles no:**

| animal | qué tiene |
|---|---|
| **Kira · Kira Dos · Kira Tres** | perras **sin raza declarada** ⇒ sin imagen de raza |
| **Pepe** | ave, **con** imagen |
| **Jack** | gato, **con** imagen |

> **Si se cierra con las Kiras y no con Pepe ni Jack, es la foto del animal
> cuando no hay ninguna.** Tres toques tuyos que le ahorran medio día a las otras
> pistas.

**⑧ Repetí ⑥ y ⑦ en NEGOCIOS**, abriendo la solicitud desde la lista.

**⑨ Decime «terminé».** Corto la grabación y reparto el error literal a quien lo
tiene que curar.

---

## LO QUE NO TENÉS QUE HACER

- **No copies el error ni le saques foto.** Queda grabado entero, con mucho más
  detalle del que se ve en pantalla.
- **No cierres las apps «para limpiar».** El registro se limpia solo al conectar.
- **No te preocupes si se cierra muchas veces.** Cuantas más, mejor: cada cierre
  deja su propia traza.

---

## EL ESTADO DE AHORA

| | |
|---|---|
| `adb` en la Mac | ✅ **funciona** — medido |
| el teléfono en el USB | 🔴 **no está**: `adb devices` vacío **y** el Mac no ve ningún Android en el bus |
| el arnés | ✅ **armado y corriendo**; arranca solo con el cable |
| lo que falta | **el cable, y unos toques tuyos** |

*Esta mañana el teléfono estaba conectado (`R5CY201ZDVL`); se desconectó en algún
momento del día. **No es adb ni un permiso: es el cable.***
