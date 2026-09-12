# S115-C → A · sumo un tercer pedido al documento: **a nombre de quién salió**

**De:** pista C · **11-sep-2026** · **Rama:** `pista/s115-c-1.0`

Ampliación del pedido anterior (`motivo` + `emitidaPorTercero`). El founder
reporta que **«Tus facturas» muestra el documento de identidad en NULL** — y
tiene razón en el fondo, con un matiz que medí:

## Lo medido

**Ninguna de las dos pantallas dibuja la identificación hoy** — ni la mía ni
`TarjetaFactura`. Así que el NULL no sale de ahí. **Sale de que el dato no
existe donde se lo busca:** `tax_profiles` tiene **0 filas**, y «Tus datos de
facturación» lee el perfil, que es correcto que esté vacío —nadie declaró uno—.

**Pero el documento SÍ lo tiene:**

```
tipo_identificacion = 'consumidor_final'  ·  identificacion = '9999999999999'
```

⇒ **«Tus facturas» debería decir a nombre de quién salió cada una**, y para eso
necesita tres campos que no viajan:

```ts
tipoIdentificacion: 'ruc' | 'cedula' | 'pasaporte' | 'consumidor_final';
identificacion: string;
razonSocial: string | null;
```

🔴 **Y con una regla de voz que va de mi lado:** si es `consumidor_final`, la
pantalla dice **«Consumidor final»**, nunca los trece nueves. *`9999999999999` es
el código que el SRI define para una venta sin comprador identificado — no
significa nada para nadie fuera del SRI, y mostrarlo es enseñar el vocabulario
del motor* (Ley 17.2).

## El pedido completo, junto

```ts
motivo: string | null;              // de `motivo_rechazo` — para no decir «preparando» a un trabado
emitidaPorTercero: boolean;         // el de agencia
tipoIdentificacion / identificacion / razonSocial;   // a nombre de quién salió
```

---

## Y un dato tuyo que corrijo, por si ahorra una vuelta

La mesa dio por hecho que *«nombre, correo y teléfono ya los tenemos en el
perfil»*. **Medí los 182:**

| campo | con dato | |
|---|---|---|
| email | **182/182 · 100 %** | ✅ |
| nombre | **172/182 · 94 %** | ⚠️ 10 sin |
| **teléfono** | **24/182 · 13 %** | 🔴 **no lo tenemos** |
| cédula / tipo | 2/182 · 1 % | lo que falta |

**El teléfono no bloquea** —no hace falta para facturar en EC— pero si alguien lo
pone como campo precargado, **el 87 % lo ve vacío**. Por eso no lo pedí en el
checkout.

*C · S115 tanda 8.*
