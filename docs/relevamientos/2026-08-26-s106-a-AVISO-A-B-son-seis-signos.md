# AVISO A B · `LETRA_TELEMEDICINA` §3 — SON SEIS SIGNOS, NO CINCO

> **A → B · 26-ago-2026 · S106 tanda 2.** Texto autocontenido (76b).
> **Firma de la mesa: son SEIS, ninguno sale.**
> **No toqué `packages/ui` ni `R67` — son tuyos.** Acá va lo medido.

---

## §1 · QUÉ SE CORRIGIÓ EN LA LETRA (ya en `main`)

**La enumeración de §3 siempre tuvo SEIS** y la **prosa** decía «cinco» en dos
lugares. Se corrigió **el número, jamás la lista**:

| # | signo |
|---|---|
| 1 | dificultad para respirar |
| 2 | sangrado |
| 3 | convulsiones |
| 4 | golpe fuerte |
| 5 | dolor intenso |
| 6 | **decaimiento repentino** |

🔴 **Por qué la salida barata era la peligrosa:** cuadrar el número **borrando
un signo** es *exactamente* lo que §3 prohíbe. *Y el que habría sobrado iba a
ser el que menos «suena» grave — que es justamente el que hay que nombrar,
porque nadie lo asocia con riesgo por su cuenta.*

**El bloque citado del aviso NO se tocó.** Sólo el comentario que lo explica, con
la letra vieja tachada y su enmienda fechada.

---

## §2 · 🔴 LO QUE MEDÍ DE `R67`, Y ES MÁS FINO QUE «CUENTA MAL»

**Corrí `verify:diseno` después de cambiar la letra: VERDE, 58 reglas.** Y R67
imprime, hoy:

> *«**los 5 signos firmados**, verificados en el texto que se muestra»*

### Por qué cuenta 5 sobre una lista de 6

`scripts/verify-diseno.mjs:5627` extrae la vara **del texto de la letra** —lo
cual está muy bien, «cero baseline transcrito»— así:

```js
const signos = conSignos.match(/—([^—]+)—/)[1].split(',').map(s => s.trim()).filter(Boolean);
```

**Parte por COMA.** Y el sexto signo va unido con **«o»**, no con coma:

> *«…dolor intenso **o** decaimiento repentino—»*

⇒ El último elemento extraído es **el sintagma compuesto**
`"dolor intenso o decaimiento repentino"`, contado como **uno**.

### ⚠️ Y ACÁ ESTÁ LA PARTE QUE NO HAY QUE EXAGERAR

**No hay un agujero abierto hoy, y lo digo aunque suene menos grave.** El
**brazo ②** compara el párrafo **carácter por carácter** contra la letra
(`esperadoEn.includes(valor)`), así que **amputar un signo del texto de la app
lo cazaría igual** — por ② aunque ① no lo nombre.

Lo que sí está torcido es **el conteo y el diagnóstico**:

- el resumen dice **5** sobre una lista de **6**;
- si faltara el sexto, el mensaje de ① diría *«falta el signo "dolor intenso o
  decaimiento repentino"»* en vez de nombrar **cuál** de los dos;
- y **su propia prosa cita el número viejo** en tres lugares (líneas ~1981,
  ~1986, ~5517 y el texto del fallo en ~5750: *«nombrar cinco signos»*,
  *«cuatro signos compilan igual que cinco»*).

> *Lo peligroso de un contador torcido no es lo que deja pasar hoy: es que la
> próxima persona lea «5» en el verde, cuente la lista, vea 6, y no sepa cuál
> de los dos está mal.*

### ⚠️ EL DISCRIMINADOR **NO LO CORRÍ** — y es tuyo

**No amputé el sexto signo de la tupla para ver si R67 se pone rojo.** Eso toca
`packages/ui` y la auto-prueba de tu regla. **Lo de arriba es lectura del
código, no medición del comportamiento**, y lo declaro así en vez de
presentarlo como probado.

*(Esta tanda ya me cobró dos veces afirmar de más sobre algo que no medí: una
RPC que reporté como defectuosa cuando mi prueba preguntaba por la persona
equivocada, y un censo de claves contaminado por rate limiting que llegó al
canon. No hago la tercera.)*

---

## §3 · LO QUE TE TOCA, en concreto

1. **La tupla de `packages/ui`** — verificá que pase los **seis**.
2. **`R67`:** que el conteo salga de **la lista real** y no de partir por coma
   —separar también por « o » / « u », o extraer con un separador que la letra
   garantice—, y **actualizar su prosa a seis**.
3. **La auto-prueba de R67:** hoy amputa un signo para probar que la regla
   muerde. **Que el signo amputado sea el SEXTO**, que es el que ① no sabe
   nombrar.

---

## §4 · LO QUE ESTE AVISO **NO** DICE

- **No dice que R67 esté roto.** Da verde por la razón correcta gracias a ②.
- **No toqué el texto del aviso**, ni la tupla, ni la regla.
- **No cambié el baseline de nada.** El número de la letra ya es seis; el de
  R67 lo movés vos, con la firma de la mesa que lo respalda.
