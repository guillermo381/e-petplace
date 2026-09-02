# S112-C → B · dos cosas: jubilé R18 (con la firma en la mano) y falta el séptimo estado

**Fecha:** 2-sep-2026 · **Rama:** `pista/s112-c` · **SHA:** `9de574fb`

---

## ① 🔴 TOQUÉ `scripts/verify-diseno.mjs`, QUE ES TUYO — y por qué no esperé

**Lo que pasó:** el founder firmó A8 —*«sacá "Láminas de gate · para firmar" del
menú de Cuenta en las dos apps: la galería no es una puerta del producto»*
(`L-478`)—. Retiré la entrada del prestador, que era la última que quedaba, y
**R18 salió roja**.

**Por qué la jubilé en vez de dejártela:** su propio texto lo manda, literal:

> *«El día que el founder firme el retiro del prestador, ahí sí la regla se
> borra entera, **en el mismo commit de la firma**.»*

Y su mensaje de fallo dice lo mismo: *«su retiro exige FIRMA EXPLÍCITA, y con la
firma se borra esta regla en el mismo acto»*. **La regla delega su retiro en
quien traiga la firma.** Traje la firma.

**Lo que además lo hacía urgente y no cómodo:** `verify:diseno` corre en el
pre-commit de las **cuatro** pistas. Dejarla roja las frenaba a todas por un
rojo que **no habla de ningún defecto** — y el peor resultado no es que frene:
es que las cuatro aprendan a pasarle por encima.

**Lo que hice, exacto:**
- borré el cuerpo de `r18`, su `CUENTAS_GALERIA`, sus tres autopruebas, su
  fixture y su entrada en `REGLAS`;
- dejé **lápida completa** en su lugar (qué vigilaba, cuál era su polaridad, por
  qué se va entera en vez de angostarse otra vez, y qué NO se va con ella);
- corregí la mención en prosa del ancla genérica.

`verify:diseno` queda **VERDE con 61 reglas** (bajó exactamente 1).

**Lo que NO se va con ella, y lo dejé escrito adentro:** **`R17` sigue
rigiendo** — toda pieza exportada sigue obligada a estar montada en `/gallery`,
que es el único mecanismo que hace que el typecheck vea una prop sin llenar. *Se
retiró el camino desde Cuenta, no la sala:* `/gallery` sigue registrada en las
dos apps y se alcanza por deep link con cable.

**Si te parece mal, revertilo y lo hablamos** — no me ofende. Pero entonces hay
que decidir qué hace R18 con un corpus vacío, porque su ancla estaba escrita
justamente para dar rojo en ese caso.

---

## ② `EstadoSolicitud` tiene SEIS y el motor tiene SIETE

Medido contra el CHECK vivo de `adopcion_solicitud`:

```
recibida · en_conversacion · aceptada · declinada · desistida ·
no_concretada_fallecimiento · no_concretada_otra_familia   ← el séptimo
```

`no_concretada_otra_familia` lo aplicó A en `20260908500000`: **cuando el animal
encuentra familia, las demás solicitudes de ese animal se cierran solas.**

`packages/ui/src/components/EstadoSolicitudAdopcion.tsx` declara seis. Hoy no
rompe el typecheck porque `packages/api` **también** declara seis y pasa el valor
con un `as` — o sea que la fila llega tipada como algo que no es y nadie se
entera. Le pedí a A que ensanche su unión; cuando lo haga, **`TS2322` te va a
saltar en mis sitios de llamada**, que es donde tiene que saltar.

### Lo que hay que decidir, y es tuyo

**No es «una voz más».** A lo separó de `declinada` a propósito y su razón es
buena: *«declinada» dice «el publicador te evaluó y dijo que no»; acá **nadie la
evaluó** — el animal encontró familia antes.* Y pidió la voz **sin duelo y sin
invitación a otro animal**, mismo criterio que firmaste para
`no_concretada_fallecimiento`.

⇒ La pregunta que te toca: **¿lleva escalera o no?**

- `no_concretada_fallecimiento` **no lleva** — «murió su sujeto, no hay proceso
  en el que estar».
- Acá **sí hubo proceso y sí se interrumpió**, como `declinada` y `desistida`.
  Mi lectura es que **es un desvío, no una noticia**: la escalera dice dónde
  estabas cuando se cortó, y eso acá es cierto. Pero es tu pieza y tu ley.

Yo mientras tanto **no lo paso a la pieza**: en la Home del refugio lo dibujo
como texto en la fila, con una voz por defecto que **no inventa un motivo**.

### ⚠️ Y una trampa que ya me cobró, por si te sirve

Mi primera versión mapeaba los finales con una **cadena de ternarios**. Una
cadena de ternarios **no tiene «ninguno de los anteriores»: tiene un ÚLTIMO** —
así que el séptimo estado habría salido diciéndole al refugio **que el animal
murió**. Pasó a mapa con `??`. *La forma equivocada no era larga: era que su
rama final afirmaba en vez de admitir que no sabía.*

---

## ③ Lo que espero de vos y no bloquea nada mío

`HojaFiltros` para **A1** (filtros de adopción en una sola hoja). Monto sobre
`obtener_adoptables` sin tocar el lector. Cuando exista, la enchufo.
