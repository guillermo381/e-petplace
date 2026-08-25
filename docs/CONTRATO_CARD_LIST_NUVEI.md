# CONTRATO — `card/list` de Nuvei/Paymentez

> **Depositado:** 25-ago-2026 · **Fuente:** medición real contra el ambiente de
> staging, pasada por el founder. **No es doc de papel: es una respuesta.**
> **Se cita con su fecha y su canal (`L-418`)** — este proveedor ya dio dos
> respuestas opuestas a la misma pregunta con dos días de diferencia.
>
> **Qué fija:** la forma del endpoint que dice **qué tarjetas siguen válidas**.
> **Qué NO fija:** cuándo se consulta ni qué se hace con el resultado — eso es
> `D-921` y todavía no está decidido.

---

## §1 · EL CONTRATO, VERBATIM

```
GET https://ccapi-stg.paymentez.com/v2/card/list?uid=<proveedor_uid>
```

```json
{
  "result_size": 1,
  "cards": [
    {
      "holder_name": "Luis G",
      "number": "1111",
      "bin": "411111",
      "type": "vi",
      "transaction_reference": "DF-2102170",
      "status": "valid",
      "token": "18045595990663272225",
      "expiry_month": "3",
      "expiry_year": "2030"
    }
  ]
}
```

**La regla del founder sobre este dato, firmada:**

> ### **Al usuario se le muestran SOLO las tarjetas que el proveedor tiene en `status: "valid"`.**
> **El caso que la motiva:** *alguien que abre el alta y no completa el OTP no
> debería ver esa tarjeta en su lista.*

---

## §2 · LO QUE ABARATA CONSTRUIRLO — medido, no supuesto

**El host ya está en uso.** `ccapi.paymentez.com` y `ccapi-stg.paymentez.com`
aparecen **ya cableados en nuestras edge functions**, con su par
producción/staging resuelto y su autenticación funcionando.

⇒ **No hay integración nueva que abrir: es una ruta más sobre un cliente que ya
existe y ya autentica.** *El costo está en el diseño, no en la plomería.*

⚠️ **Nota de nombre, para que nadie la lea como un proveedor distinto:** el
dominio dice **`paymentez`** porque es la plataforma que Nuvei adquirió. **Es el
mismo proveedor.** *Quien lo «corrija» a un dominio de Nuvei rompe la llamada* —
mismo cuidado que el typo `idTransacionReference` de DeUna.

---

## §3 · 🔴 NO SE PUEDE CONSTRUIR TODAVÍA, Y LA RAZÓN ES `D-921`

**El endpoint consulta POR `uid`.** Y hoy **cada alta genera un uid nuevo**
(`D-921`), así que:

> ### **Hoy una consulta a `card/list` devuelve UNA tarjeta, jamás las de la persona. `result_size: 1` no es una casualidad del caso medido: es lo único que este endpoint puede devolver mientras el uid sea por alta.**

**Para listar las 8 tarjetas de ese usuario harían falta 8 llamadas, una por
uid** — y **habría que conocer los 8 uid de antemano**, que es exactamente el
dato que `D-921` dice que no debería existir.

⇒ **LOS DOS DEFECTOS SON EL MISMO Y SE CURAN EN ORDEN:**

| | |
|---|---|
| **1º** | **el uid estable por persona** (`D-921`) |
| **2º** | **el listado contra el proveedor** (este documento) |

*Construir el 2º primero produciría un listado que consulta ocho veces para
armar lo que una sola llamada debería traer — y que además dejaría de funcionar
al curar el 1º.*

✅ **Y el 1º ya contempla este consumo, por diseño:** el uid estable es
`(user_id, proveedor)` UNIQUE ⇒ **cuando exista, UNA sola llamada trae todas las
tarjetas de la persona**, que es justo la forma que este endpoint pide.

---

## §4 · 🔴 QUÉ OTROS VALORES TOMA `status` — **NO MEDIDO, y no se inventa**

**Medido contra nuestro repo: CERO menciones de cualquier valor de `status` de
tarjeta.** Ni `valid`, ni ningún otro, en ninguna edge, wrapper, migración o
letra. **Nuestro esquema no tiene dónde guardarlo** (`D-921` §measurement: no
existe columna de status del proveedor).

⇒ **`valid` es el único valor que conocemos, y lo conocemos porque lo vimos una
vez.** *No hay base para enumerar los otros.*

> **Filtrar por `status == "valid"` es FAIL-CLOSED y por eso es correcto aunque
> no conozcamos el resto** — lo que no se conoce, no se muestra.
> **Pero «es seguro» y «sabemos qué esconde» son dos cosas distintas**, y hoy
> solo la primera está cubierta.

**Pregunta abierta al proveedor (Erick), y es de las que se contestan una vez:**

1. **¿Cuál es el conjunto completo de valores de `status`?**
2. **¿Alguno significa «recuperable»** —pendiente de verificación, en revisión—
   **en vez de «muerta»?** *Un filtro que esconde una tarjeta que el usuario
   podría reactivar es un filtro que le oculta una salida.*
3. **¿Nuvei NOTIFICA cuando una tarjeta deja de ser válida, o solo se sabe
   preguntando?** ⚠️ **De esto depende el diseño entero de §5.**

---

## §5 · LA DECISIÓN DE DISEÑO — las dos vías, con su costo

**No está decidida. Se sirve completa para que la mesa elija.**

### (a) CONSULTAR AL PROVEEDOR CADA VEZ

**El listado pregunta a `card/list` en el momento de mostrarse.**

| | |
|---|---|
| ✅ **una sola verdad** | la del proveedor, siempre fresca. **Es lo que este hallazgo vino a lograr** |
| ✅ | **no hay nada que sincronizar**, ni cron, ni deriva posible |
| 🔴 **más lento** | una llamada a un tercero **en el camino de una pantalla que la persona abre para pagar** |
| 🔴 **depende de que responda** | y hay que decidir **qué se muestra si no responde**. *Y las dos salidas son malas:* mostrar la lista vieja **reintroduce la segunda verdad** justo cuando no se puede verificar; no mostrar nada **deja a alguien sin poder pagar porque un tercero está lento** |

### (b) SINCRONIZAR Y GUARDAR SU STATUS

**Guardamos `status` en una columna y el listado lee la nuestra.**

| | |
|---|---|
| ✅ **rápido** | el listado no sale de casa |
| ✅ | sobrevive a que el proveedor no responda |
| 🔴 **DOS VERDADES OTRA VEZ** | **y es exactamente el defecto que este hallazgo vino a cerrar.** *Entre sincronización y sincronización, nuestra copia puede estar mintiendo — que es la frase con la que empezó todo esto* |
| 🔴 | **exige decidir cuándo se sincroniza**, y toda ventana elegida es una ventana de divergencia |

### 🔴 LO QUE INCLINA LA DECISIÓN, Y NO ES LA VELOCIDAD

**Depende de la pregunta 3 de §4:**

- **Si Nuvei NOTIFICA** cuando una tarjeta se invalida ⇒ **(b) deja de tener
  ventana de divergencia**: la copia se actualiza por evento, no por reloj, y
  pasa a ser la mejor de las dos. *Es la misma forma que ya rige en la casa para
  los pagos: el webhook manda, no el barrido.*
- **Si NO notifica** ⇒ **(b) es una copia que envejece sin aviso**, y la
  elección real es entre *lento pero cierto* y *rápido pero posiblemente falso*.

> ### **La decisión no se toma comparando (a) contra (b): se toma sabiendo si existe un webhook. Preguntarle eso a Erick es más barato que elegir.**

⚠️ **Y una tercera vía que no hay que descartar sin mirarla:** consultar al
proveedor **solo en el momento de cobrar** —no al listar—, dejando la lista
rápida y poniendo la verdad donde el error importa. *Su costo: la persona elige
una tarjeta y recibe el rechazo un paso después, que es peor experiencia pero
cero riesgo de cobro fallido.* **Se declara porque el binario (a)/(b) la
esconde.**

---

## §6 · LO QUE ESTE DOCUMENTO NO DECIDE

Cuándo se consulta · qué se muestra si el proveedor no responde · si la copia se
guarda · qué pasa con las tarjetas que el proveedor ya no lista pero nosotros
tenemos en `guardada` *(hoy son hasta 7 de las 8 — solo una uid fue verificada)*.

**Todo eso es de mesa, y su precondición es `D-921`.**
