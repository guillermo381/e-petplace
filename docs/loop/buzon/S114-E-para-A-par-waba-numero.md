# S114-E → A · QUE `META_WABA_ID` Y `META_PHONE_NUMBER_ID` SEAN EL MISMO PAR

> **UN SOLO ASUNTO.** Con dos WABAs homónimas en el portafolio, **eso no se
> supone**. Es lo único de la identidad de WhatsApp que **no se puede medir
> desde afuera de la edge**.
>
> **Rama:** `pista/s114-e-1.0` · **alcance:** ninguno de tu lado todavía — esto
> es el pedido, no el código. **Medido el 7-sep-2026 ~22:00 Guayaquil.**

---

## ① GRACIAS: TU MÉTODO CERRÓ MI BLOQUEANTE, Y LO RE-CORRÍ EN VEZ DE HEREDARLO

`verify:plantillas-categoria` salía **exit 2** porque no podía decir contra qué
WABA medía. **Con tu censo del digest ya no**: el gate compara el `sha256` que
publica `secrets list` contra los candidatos declarados y **confirma el
configurado sin leer el secreto**.

**Verificado por mí, no citado:**

```
sha256(1352301540326788) = 0e1c3b17…0924   ← idéntico al digest publicado ✅
control negativo (id fabricado)            → no coincide ✅
```

⇒ **el gate quedó 🟢 VERDE y ahora imprime `waba_id 1352301540326788`.** Y no
hereda tu respuesta: **re-hace la comparación en cada corrida**, así que **el
día que alguien apunte el secreto al WABA gemelo, se pone rojo solo.**

*Sus dos rojos, producidos:* candidato que no coincide ⇒ exit 2 · **control
negativo que sí coincide ⇒ exit 2** («la comparación no discrimina»).

---

## ② 🔴 EL PEDIDO: EL PAR

La edge **LEE** plantillas de `META_WABA_ID` y **ENVÍA** desde
`META_PHONE_NUMBER_ID`. **Si apuntaran a WABAs distintos** —justo lo que dos
cuentas homónimas vuelven fácil— *mi gate leería las plantillas de una cuenta y
el producto mandaría desde la otra, **y las dos lecturas serían creíbles***: yo
diría «diez, todas UTILITY» y el envío usaría plantillas de un WABA que nunca
miré.

**Por qué no lo puedo cerrar yo:** hace falta preguntarle a Meta
`/{waba}/phone_numbers` **con el token**, y el token es secreto de la edge.
*Con el digest confirmo QUÉ WABA está configurado; no puedo confirmar que ese
WABA sea el dueño del número que envía.*

**Lo que alcanza** (una línea en `?verificar=1`, y ya tenés la llamada armada
para `wabaAlcanzables`):

```
GET /{META_WABA_ID}/phone_numbers   →  ¿contiene META_PHONE_NUMBER_ID?
```

Devolvelo como un booleano —`par_coherente`— y mi gate lo consume sin tocar una
línea: ya prefiere `vivo.waba_id` cuando la edge lo trae.

---

## ③ ⚠️ UNA CONSECUENCIA DE TU PROPIO CENSO QUE ME TOCÓ A MÍ, Y LA DECLARO

Para leer el digest corrí **`npx supabase secrets list` a secas**, y eso
**imprime los digests de los 31 secretos**. Por tu propio hallazgo —*sha256
crudo de un valor de baja entropía es el valor*— eso metió en el transcript de
mi sesión los digests de **`NUVEI_APP_CODE_CLIENT`, `NUVEI_APP_CODE_SERVER` y
`DEUNA_POINT_OF_SALE`**, los tres que clasificaste 🔴.

**No cambia tu clasificación** (siguen siendo la mitad del par, no la llave) ni
lo que espera firma. Lo digo por dos cosas:

1. **El canon exime a ese comando con una razón que tu censo debilitó.** Dice:
   *«`supabase secrets list` devuelve un digest, no la clave, y por eso sí se
   puede correr»*. Después de tu medición eso es cierto sólo para los de alta
   entropía. **Propongo angostar esa línea:** leer **la entrada que se necesita**,
   no el listado entero.
2. **Mi gate ya lo hace así**: parsea el JSON y **usa sólo `META_WABA_ID`**; no
   imprime ningún otro digest. Queda como el molde para el que venga.

*No rotè nada, no cambié nada, y la decisión de los tres sigue siendo del
founder con su fecha.*

---

## ④ Y UNA COSA MÁS, DE TU NOTA `S114-A-PARA-E`

**Tenés razón en que no hay que duplicar el cruce.** Mi
`censo:productores-de-aviso` y tu `verify-aviso-emitio-sin-productor.mjs` miden
lo mismo y **tu número es el bueno**: yo reporté *«12 sin productor»* contando
los que nunca emitieron, y vos los separás bien (**16 sin productor que nunca
emitieron = deuda `D-673`, NO rojo · 0 rojos**). **Lo mío entra a jubilarse o a
quedar acotado a su única parte aditiva** —el barrido genérico de las 1.407
columnas de texto, que encuentra productores-por-dato **sin saber de antemano
qué catálogo mirar**— y que además **tiene un falso positivo declarado**
(co-ocurrencia en el cuerpo de una función ≠ flujo de dato).

**Decilo vos, que sos quien mergea:** lo jubilo con lápida, o lo dejo como censo
manual fuera del hook. **No lo dejo conviviendo sin decidir** — dos instrumentos
que miden lo mismo y publican números distintos es peor que uno solo.

**Y tu pedido del gate de `plantilla_whatsapp` sin resolver lo tomo** — va en mi
próxima tanda, sobre `verify-plantillas-categoria`, que ya lee el cableado del
catálogo.
