# S114-E → D · EL CASO ABIERTO ESTÁ, con el hilo que pediste

> **UN SOLO ASUNTO.** **Rama:** `pista/s114-e-1.0` · **script:**
> `scripts/s114/sembrar-casos-postventa.mjs` (paso ④ y ⑤) · **por RPCs, cero
> `INSERT`.** Sembrado el 8-sep-2026 ~05:09 Guayaquil.

---

## EL CASO

```
de6015a1-7aeb-4cc5-be8c-2e475a08ba48
```

| requisito | cómo quedó |
|---|---|
| `con_casa` **o** `con_prestador` | **`con_prestador`**, con su plazo de 24 h corriendo |
| **clase 2** | ✅ clase 2 · motivo `duracion` · objeto **cita** |
| **≥3 turnos con la voz del prestador** | ✅ **4 turnos**, voces: **`casa, familia, prestador`** |
| **algo sin resolver** | ✅ **sin resolver**: la decisión NO está en el hilo |

**Familia** `guillo381+8@gmail.com` (llavero `epetplace-siembra-s97`) ·
**prestador** `demo-prestador@epetplace.dev` (llavero `epetplace-cuenta-prueba`)
⇒ **las dos caras se pueden caminar**.

### El hilo, y por qué está armado así

1. **casa** — «Recibimos tu caso.» (lo escribe `abrir_caso`: no hay hilo vacío)
2. **familia** — aporta un dato duro: *«Fueron 22 minutos, lo tengo en el GPS. Reservé 45.»*
3. **prestador** — **su versión, que es la que faltaba**: *«el paseador cortó antes porque el perro se resistía… no lo cargamos como incidente y debí avisarte»*
4. **familia** — responde a eso y **deja la pregunta abierta**: *«¿Cómo lo resolvemos?»*

**Ninguno de los cuatro trae la solución, a propósito.** *Si el hilo ya la
trajera, la Hoja volvería a medir lectura* — y con el resumen apoyado sólo en el
relato de la familia sería **un eco**, no una propuesta: la voz del prestador es
justo la que obliga a sintetizar dos versiones que no coinciden.

⚠️ **El autor NO se pasa por parámetro:** `caso_responder` lo **deriva de la
sesión** (*«un autor que el llamador declara es un autor que el llamador
elige»*), así que cada turno se escribió desde la sesión de quien habla.

---

## LA OTRA FORMA ABIERTA, por si te sirve

```
272ee7a3-7699-422b-a990-632da94abf29 · clase 3 · pedido · `con_casa` · 1 turno
```

Es **urgente** (`producto_en_mal_estado`) y va directo a la casa, **sin plazo**.
*No cumple el ≥3 turnos* —lo dejo como está— pero es la **otra forma abierta**, y
en pantalla no se ve igual que la de clase 2: no tiene contraparte a la que
esperar.

---

## ES SIEMBRA, NO TRÁFICO

Marca `[SIEMBRA S114-E]` en `relato` **y en cada turno del hilo**:

```sql
select count(*) from casos_postventa where relato like '[SIEMBRA S114-E]%';
```

**Ningún número que salga de estas filas es línea base** — ningún dato de
servicio de esta base es real y producción es octubre.

## SI LO RESOLVÉS AL EJERCERLO, VOLVÉ A CORRER EL SEMBRADOR

```
node scripts/s114/sembrar-casos-postventa.mjs
```

**Es idempotente y repone lo que falte:** si el clase-2 abierto quedó resuelto,
abre otro sobre un objeto libre y le arma el hilo de nuevo. *Ya pasó una vez —
`e06d4b5e` quedó `resuelto_entre_partes` entre dos corridas mías y el sembrador
lo repuso solo.* **No hace falta pedirme nada.**

⚠️ **Lo que el sembrador NO puede reponer:** objetos libres en la ventana de 7
días. Si se agotan, lo dice (`sin objeto libre en ventana`) en vez de fallar.

---

## Y para el comando que mencionaste

`scripts/postventa/ejercer-postventa-E.mjs` **todavía no existe en `main`**
(medido: en `scripts/postventa/` hay `correr-nexo-caso.mjs` y `nexo-caso-E.mts`).
Si lo estás escribiendo, el `5` que le pasás puede apuntar a este caso por id —
**te dejo el id arriba para que no dependa de un índice**, que cambia con cada
caso nuevo.
