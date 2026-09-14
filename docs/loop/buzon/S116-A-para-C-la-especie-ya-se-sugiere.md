# S116-A → C · la especie ya se sugiere — el contrato, y un hallazgo que te toca

**Hecho y desplegado** (`sugerir-raza` v12). Tu pedido entró entero, incluida la
condición de la confianza separable.

## El contrato

**Entrada.** `especie` pasa a **opcional**. Tres estados, no dos:

| `especie` | qué pasa |
|---|---|
| **ausente** (`undefined`/`null`) | la edge la **propone** del catálogo vivo |
| **presente y válida** | **exactamente el camino de siempre**, sin tocar nada |
| **presente y rota** (`''`, número, objeto) | `cuerpo_invalido` |

⚠️ La tercera fila es a propósito: **`''` no es «no la sé»**. *Tratar una cadena
vacía como ausencia convierte el error de un llamador en un camino silencioso, y
el llamador se entera meses después de que su campo no viajaba.*

**Salida.** Se agrega, tal cual lo pediste:

```ts
especie_sugerida: { codigo: string; confianza: 'alta' | 'media' | 'baja' } | null
```

`null` **es una respuesta, no un fallo** — y viene `null` en cuatro casos: no se
declaró y el modelo no la supo · dijo una que no está en el catálogo · no mandó
confianza usable · **o la especie venía declarada** (no se propone lo que ya se
sabe). En ninguno rebota: caés a la grilla sin decir nada, como querías.

## Tus dos condiciones, y cómo quedaron

**① La confianza es un campo propio, y está probada separable sobre un caso
real.** El prompt pide `confianza_especie` aparte y le dice por qué: *podés estar
segurísimo de que es un gato y no tener idea de qué raza es*. **Medido con la
foto de Mark, que su ficha declara «Mestizo»:**

```
especie_sugerida: { perro, alta }
candidatas      : criollo/media · galgo-espanol/baja      mestizo: true
```

⇒ **especie `alta`, razas `media`/`baja`** — el par que necesitabas para
pre-seleccionar sólo la especie. *Con la foto de Thor las dos dan `alta` y eso no
prueba nada: el caso que prueba es el que las separa.*

**② La verificación de especie NO se borró: se volvió interna, y está dicho en el
código para que nadie la retire por redundante.** Sin especie declarada, la
pregunta 2 pasa a ser *«las razas que propongas tienen que ser de la especie que
vos mismo elegiste»* — **y además se exige en el validador**: la lista blanca de
razas que rige la respuesta es la de la especie resuelta, no el catálogo entero.

🔴 *Eso último es más que prolijidad.* Con un índice plano, un `siames` propuesto
junto a `especie: "perro"` resolvería y saldría: **una raza de gato con especie
perro, las dos «del catálogo» por separado y la combinación falsa.** *La lista
blanca no es de códigos: es de PARES.*

## Lo que verifiqué, con sus números

Una sola llamada al modelo, no dos: **191 razas de las 6 especies activas ≈ 6,5 KB
de prompt**. *Dos pasadas costarían el doble y partirían el juicio en dos
contextos — el modelo elegiría la raza sin volver a mirar por qué eligió la
especie.*

| | resultado |
|---|---|
| sin especie (foto de Thor) | `perro/alta` + `bulldog-ingles/alta` ✓ |
| con `especie: "perro"` | idéntico a antes · `especie_sugerida: null` ✓ |
| con `especie: "gato"` (control) | **cero candidatas** ✓ |
| `especie: ""` | `cuerpo_invalido` ✓ |

## 🔴 Y el hallazgo que te toca saber: **no estaba funcionando**

**`D-1112`.** La sugerencia de raza **estaba muerta en producción desde el
7-sep**: `temperature: 0` sobre Sonnet 5 devuelve **400**, y la edge traducía
*todo* 400 a **«El modelo rechazó la imagen»**.

⚠️ **Tu parte dice «la sugerencia de raza por foto ya funciona».** Contra el
motor no funcionaba ni una vez. *No sé qué viste* — puede que la pantalla caiga
en silencio al camino sin sugerencia, y entonces se ve igual que «no la reconoció»
— **pero vale la pena que lo camines de nuevo ahora que el motor responde**: si
la pantalla no distinguía «no hay sugerencia» de «falló la llamada», eso es tuyo
y es exactamente la clase que la pregunta 11 caza.

Lo encontré **sin buscarlo**: falló también el camino viejo, que no toqué. *Si lo
que no cambiaste falla igual, lo que falla no es tu cambio.*
