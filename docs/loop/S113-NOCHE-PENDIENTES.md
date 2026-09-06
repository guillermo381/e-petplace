# S113 · lo que espera al founder

Nadie se frenó por ninguno de estos. Cada uno dice **qué**, **por qué es del
founder**, **las opciones** y **el voto de la pista** — para que decidir sea
leer un párrafo, no reconstruir el problema.

---

## 1 · Las cinco mascotas de prueba marcadas como reales

**Qué.** En la familia `guillo381+8` hay cinco `PruebaC*` (todas Beagle, todas
en memorial) que quedaron con `creado_por_sistema = 'real'`: `PruebaC12896`,
`PruebaC24772`, `PruebaC37493`, `PruebaC76663`, `PruebaC82896`. El parte
anterior decía **dos**; medido, son **cinco**.

**Por qué importa.** El canon ya manda excluir la marca de fixture de todo
censo de «mascotas reales». Estas cinco **pasan el filtro**, así que hoy
inflan cualquier número de producto — el mismo agujero que S92 midió cuando
descubrió que el 80 % de las familias eran sonda.

**Opciones.** (a) marcarlas `fixture_founder_s113`, como Sombra y Bruma ·
(b) borrarlas · (c) dejarlas.

**Voto de la pista: (a).** Son el sujeto vivo de la despedida que C ejerció;
borrarlas no rompe un test, lo vuelve irreproducible, y eso no se nota. La
marca cuesta un UPDATE y arregla el censo.

## 2 · La placa: proveedor y precio

**Qué.** El motor del pasaporte está vivo y la página pública también. Falta
decidir con quién se fabrican las chapitas y a cuánto.

**Por qué es suyo.** Es una decisión comercial, y el modo nocturno la veda.

**Sin bloquear nada:** la rama `pista/s113-a-nfc` ya deja la build lista y
`docs/loop/S113-NFC-BUILD.md` tiene el procedimiento del día que se decida.

## 3 · NFC en iOS

**Qué.** Leer un tag NFC en iPhone exige un *entitlement* propio en la cuenta
de Apple. **No está medido si la cuenta lo tiene.**

**Voto de la pista:** arrancar sólo con Android y con el QR, que ya funciona en
los dos sistemas sin pedir nada. *El QR no necesita permiso de nadie.*

## 4 · El aviso legal de IA (`D-405`)

**Qué.** Cuando Nexo hable, la app tiene que decir que es IA y qué no hace.
La letra la escribe un abogado; hasta entonces rige la voz honesta de la casa.

**Por qué ahora.** El lote 2 pone a Nexo a contestar. El texto no bloquea la
construcción, pero **sí bloquea que se encienda para gente real**.

## 5 · Las fichas de raza que faltan

**Qué.** Publicadas con firma: **10** (labrador, loro yaco, beagle,
californian, persa, pug, chinchilla, schnauzer miniatura, gato común, criollo).
Cargadas y esperando lectura: el resto del Batch. **118 razas** del catálogo
ampliado todavía sin ficha.

**Ritmo firmado:** tandas de cinco por semana, perro primero, y en el día
cuando una mascota nueva declara una raza cuya ficha existe sin publicar.

## 6 · Lo que NO es del founder pero conviene que sepa

- **Dos defectos de voz** hallados caminando el 1.2.1 (ver `S113-NOCHE.md` §5):
  «etapa adulto» y una fecha ISO cruda en el carnet. **Son de C**, están
  anotados en su parte, y ninguno rompe nada — se leen mal, nada más.
- **El prestador del emulador está en 1.0.3** (agosto): no recibe los OTAs de
  runtime 1.0.7. Es del emulador, no del teléfono del founder.


## B · el gate de gates YA EXISTE, y me cazó a mí (S113-B, 2.0)

**Lo que iba a escribir acá estaba mal, y lo corrige el objeto.** Iba a
proponer que el corredor de gates enumerara los `verify:*` y saliera 2 si
alguno no existe. **Ya está construido**: `verify:gates-existen` frenó mi
propio commit por nombrar `verify:pasaporte` —que vive en `b-1.3`, sin
mergear— con el argumento exacto: *«un gate nombrado y ausente no da rojo: NO
CORRE; su silencio se lee como salud, y esa lectura la hace el que confía en
el canon»*.

**Lo que sí queda descubierto, y es angosto:** el gate protege **el canon**
(las menciones en docs), no **la consola**. Corrido a mano, `pnpm -s
verify:pasaporte` sobre un script inexistente **sale 0 y no imprime nada** —
así que una batería corrida a mano puede leerse como siete verdes cuando uno
de los siete no existe. Me pasó esta noche.

**Opciones.** (a) nada: el gate del canon alcanza, porque lo que se publica
pasa por ahí · (b) que el parte declare **contra qué rama** corrió cada gate,
que no cuesta código · (c) un `verify:todo` que enumere y falle si falta uno.

**Mi voto: (b).** (a) deja el hueco de la lectura a mano y (c) duplica lo que
`verify:gates-existen` ya hace. Y (b) además cubre un caso que ninguna de las
otras dos ve: **un gate que existe pero está midiendo otra rama** — que es
el caso real de esta noche, no una hipótesis.

**Dueño:** convención de partes (mesa). **No me frena**: lo declaro en cada
parte mientras tanto.
