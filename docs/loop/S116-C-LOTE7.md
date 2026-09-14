# S116-C · LOTE 7 — el parte

**Rama** `pista/s116-c-05` · **SHA** al pie · emulador `s114_C` **con barra de
tres botones** (`navbar.threebutton`, la del aparato del founder).

---

## LAS CAPTURAS, UNA POR PUNTO — todas con la pantalla USADA

| # | captura | qué se ve |
|---|---|---|
| ① | `lote7-1-flecha-03-usada.png` | 03 con su flecha · y 01 después de tocarla |
| ① | `lote7-1-flecha-05-usada.png` | 05 con su flecha · y 01 después de tocarla |
| ② | `lote7-2-despensa-tres-botones.png` | última fila de la Despensa, con barra de tres botones: los «Agregar» enteros |
| ③ | `lote7-3-hoja-de-atajos-y-esperalarga.png` | la hoja del asistente con los cuatro dedos · `EsperaLarga` en el pago seguro |
| ③ | `lote7-3-atajo-carne-usado.png` | el atajo «Cargar su carné» USADO: abrió el carné |
| ④ | `lote7-4-alta-paso2-cargado.png` | 2/3 con **Perro elegido** y **«Golden retriever» escrito**, sólo faltan nombre/nacimiento/sexo/origen/peso |
| ⑤ | `lote7-5-esperalarga-centrada.png` | `EsperaLarga` a pantalla completa, con su título bajo el reloj y la rueda centrada |
| ⑦ | `lote7-7-beneficios-cuatro-tarjetas.png` | 02 con cuatro tarjetas blancas, glifo en círculo ciruela |
| ⑥ | — | **esperando el SHA de B** (Confeti y el carrito en cabeceras) |

---

## ① Las flechas — la causa, medida

Tocada en el aparato: no pasaba nada. El volcado sobre el punto de la flecha, en
orden de render: `View [0,136][221,357]` y **después** `ScrollView
[0,0][1080,2400]`. El slot `fondo` de `HojaContenido` se montaba ANTES de la
hoja ⇒ **el scroll lo tapaba entero**. *No estaba rota ni desconectada: estaba
debajo.* Es la misma clase que el founder sospechó.

Cura: el fondo pasa después con `pointerEvents="box-none"` — la técnica que el
pie fijo de esa misma pieza ya usaba. **Alcanza a toda pantalla que ponga algo
tocable en `fondo`**, no a dos. Cruce de territorio declarado y pedido a B.

## ② La Despensa en barra de tres botones

Levanté el emulador con `navbar.threebutton` (la configuración del founder). Con
`AIRE_RAIZ + insets.bottom` **la última fila queda entera**, con la línea del pie
y aire antes de la barra. *El sospechoso que nombraste era el correcto: la
reserva vieja no sumaba el inset, y con tres botones el inset es más grande.*

## ③ Las tres piezas de B

· **HojaAsistente** — el botón abre los cuatro dedos y el campo, en vez de
  empujar a `/nexo`. Los atajos salen de `ORDEN_DE_PATA`, del objeto.
  `vacuna → carné` · `foto → recuerdo` · `antiparasitario → su pantalla` ·
  `peso → su Hoja` (no tiene ruta). **Usado**: «Cargar su carné» abrió el carné.
· **EsperaLarga** — montada y usada. Ver ⑤.
· **Confirmacion** — montada, con el total como dato, la línea fiscal y **dos
  acciones** (antes había una). ⚠️ **NO la pude usar de punta a punta, y lo
  digo**: la cuenta de prueba **no tiene tarjeta guardada**, así que el único
  riel disponible es DeUna — y DeUna no pasa por `Confirmacion` ni por la espera
  de tarjeta: su confirmación depende de una app externa que no tengo. Llegué
  hasta la pantalla del código. **Lo que destrabaría el gate: una tarjeta de
  prueba del sandbox de Nuvei.** Entré al alta de tarjeta y la página del
  proveedor carga (ahí está la captura de `EsperaLarga`), pero **no invento un
  número de tarjeta**.

## ④ El alta llega cargada

La identificación se mudó de 2/3 a 1/3: se mira la foto al salir del paso de la
foto. **Especie y raza llegan puestas**, y quedan pendientes exactamente los
cinco que pediste. Sin foto, todo vacío como antes. Usa la edge v12 de A
(`especie` opcional) — el wrapper estaba en el contrato viejo y lo ensanché, con
su pedido en el buzón.

## ⑤ EL CENSO DE ESPERAS LARGAS — archivo y línea

**Convertidas a `EsperaLarga`:**

| dónde | archivo | qué esperaba |
|---|---|---|
| carné del alta | `components/alta/PasoCarnet.tsx` ~206 | la lectura del carné |
| carné suelto | `app/carnet.tsx` ~466 | la lectura del carné |
| identificación de la foto | `components/alta/PasoFoto.tsx` ~210 | **nueva** |
| pago · despensa | `app/(tabs)/despensa/checkout.tsx` ~1575 | confirmación del pago |
| pago · reserva | `components/checkout-reserva.tsx` ~305 | confirmación del pago |
| pago · paquete | `app/(tabs)/explorar/paseo/checkout-paquete.tsx` ~174 | confirmación |
| pago · plan | `app/(tabs)/explorar/paseo/checkout-plan.tsx` ~206 | confirmación |
| pago · guardería | `app/(tabs)/explorar/guarderia/checkout.tsx` ~622 | confirmación / agendado |
| pago · programa | `app/(tabs)/explorar/adiestramiento/confirmar-programa.tsx` ~174 | confirmación |
| pasaporte | `app/(tabs)/hogar/mascota/pasaporte.tsx` ~205 | generación del QR |
| alta de tarjeta | `app/pagos/alta-tarjeta.tsx` ~116 | la página del proveedor |

☠️ Con eso **muere `EsperaDeTrabajo`** —la línea de progreso con degradado— en
sus seis pagos.

**Censadas y NO convertidas, con su razón:**

| dónde | archivo | por qué no |
|---|---|---|
| carga del pasaporte | `pasaporte.tsx` ~157 | es la LECTURA de la pantalla, no la generación: dura lo que una consulta. *Montar la espera larga ahí sería anunciar un minuto para algo que tarda menos que el dedo en soltarse.* |
| videollamada `pidiendo` | `app/videollamada/[citaId].tsx` ~250 | pide un token y entra; no es larga |
| DeUna | los seis checkouts | **no es una espera: la familia TRABAJA** (teclea el código en otra app). Su lugar lo ocupa `EsperaDeUna` con la cuenta regresiva, que es información. *Una rampa que dice «estamos trabajando» mientras la persona teclea afirma algo falso.* |

**El duplicado del carné tenía productor, no descuido:** el CTA del pie seguía
montado, deshabilitado, mostrando su `razonDeshabilitado` — el mismo texto, abajo
a la izquierda y fuera de la hoja. Murió con su fase.

⚠️ **Dos cosas de la pieza, medidas y pagadas desde el montaje** (pedido a B):
no trae inset —su título se metía bajo el reloj— y es `flex: 1`, así que dentro
de un scroll colapsa a cero.

## ⑦ 02 con cuatro tarjetas

`FilaBeneficio` ×4. **No es `Celda` sin `onPress`** y su cabecera explica por
qué: una celda anuncia toque y sin `onPress` queda «una puerta que no abre».

---

## Lo que queda abierto

1. **⑥ el Confeti y el carrito en cabeceras** — esperando el SHA de B. *Anotado:
   el confeti cae como serpentina y confeti **desde el borde superior**, una sola
   vez al entrar a ¡Listo!.*
2. **`Confirmacion` sin gate de aparato** — necesita una tarjeta de prueba del
   sandbox.
3. **El estado apagado por atajo en `HojaAsistente`** (el caso del acuario):
   `razonDeApagado` existe y hoy la pieza no puede dibujarlo. Pedido a B.
4. **Pedido a A**: marcar `creado_por_sistema` en los **tres** «Thor» de prueba.
