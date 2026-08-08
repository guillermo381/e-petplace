# S91-D → A · PEDIDO AUTOCONTENIDO: el token de intento en `agregar_mascota_a_familia`

> Regla 76b: esto es el pedido completo, no una referencia. Mi lado ya está
> cableado y commiteado — falta la puerta.

## Qué necesito

Que `agregar_mascota_a_familia` acepte **`p_token_intento text DEFAULT NULL`** y
sea **idempotente sobre él**: si ya existe una mascota creada con ese token para
ese caller, **devuelve esa mascota** en vez de crear otra.

## El contrato que mi cliente ya espera

* Lo mando como **`p_token_intento`**, un `text` opaco de ~20 caracteres
  (`reloj36-azar36`, p. ej. `m3k8x1p-a7f2b9c1`). No es secreto ni autoriza nada:
  su único trabajo es decir *«éste es el mismo intento»*.
* **Si no viaja** (bundle viejo, o el flujo entró por un camino que no lo
  genera), el comportamiento tiene que ser **exactamente el de hoy**. Ningún
  cliente publicado puede romperse por esto.
* El retorno de la vía idempotente **es el mismo shape** que el de la creación:
  la pantalla no debería tener que distinguirlos para navegar. Si querés
  distinguirlos igual, un `ya_existia boolean` me sirve y **lo trataría como
  éxito**, no como error (precedente: `sinCambio` del censo del acuario).

## Por qué TOKEN y no clave natural — la medición manda

Es tu propia medición y la cito para que no se re-discuta:

* **Los 19 duplicados vivos crearon 19 FAMILIAS distintas.** Una clave natural
  (`familia_id + nombre + especie`) **no habría cazado ninguno**.
* **La re-sumisión humana ocurrió a 1-2 minutos.** Una ventana de deduplicación
  de segundos **tampoco los ve**.

Lo único estable entre las dos escrituras es que **son el mismo intento**, y eso
no se deduce de los datos: hay que decirlo explícito.

## Lo que YA está de mi lado (commiteado)

* `BorradorAlta.tokenIntento` — nace en el **primer avance** del flujo y viaja
  en los params hasta el cierre (`components/alta/tipos.ts`, `AltaMascota.tsx`).
* Nace ahí y no en el cierre a propósito: en el cierre cada re-montaje generaría
  uno nuevo y no habría nada que reconocer. Y vive en los **params** y no en un
  `useRef` porque un ref muere con el re-montaje, que es justo el evento contra
  el que existe.
* En cuanto el wrapper acepte el parámetro, **lo mando en `comunes`**: es una
  línea en `PasoCierre.tsx`.

## Lo que mi cura de cliente NO cubre, y por eso hace falta la tuya

Hoy tengo dos redes, y las dos son de cliente:

1. `dismissAll` + `replace(salida)` + `push(destino)` — cierra **el camino** que
   el founder recorrió.
2. Un `Map` a nivel de módulo con la clave del contenido — cierra **el daño**
   cuando el componente se re-monta.

**Ninguna sobrevive a que la app se cierre y se reabra**, ni a dos dispositivos,
ni a un reintento manual del dueño diez minutos después. La idempotencia real
solo puede vivir donde vive el dato. Lo mío es la red; la puerta es tuya.

## Nota de alcance

`crear_familia_con_primera_mascota` **ya está protegida** (medición tuya), así
que esto es solo para la segunda mascota en adelante. Cuando llegue, lo cableo
y lo verifico con el fixture del alta.
