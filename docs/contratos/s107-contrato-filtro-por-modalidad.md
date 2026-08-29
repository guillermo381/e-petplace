# CONTRATO · EL FILTRO POR MODALIDAD — *«ver quién puede»*

> **Publicado por A el 29-ago-2026, en cuanto existió.** Todo lo de acá está
> **medido contra el objeto**, no leído de un plan. **C construye contra esto.**

## ⓪ LA FIRMA QUE LO ORDENA (founder)

> ### **LA MODALIDAD ES UN FILTRO, y va PRIMERO.**
>
> **modalidad → día → ver quién puede → elegir lugar → pagar.**

La familia elige **Día · Paquete · Mensual** *antes* de ver lugares. «Ver quién
puede» devuelve **las guarderías que ofrecen ESA modalidad**, con cupo elegible
y cobertura.

🔴 **El filtro corre en el SERVIDOR. La pantalla jamás filtra por su cuenta.**
*Si la pantalla filtrara, dos superficies podrían mostrar listas distintas del
mismo día — y la que se equivoca manda a la familia a un lugar que no puede
tomarla.*

---

## ① LA FORMA

```
obtenerGuarderiasDisponibles({
  modalidad: 'dia' | 'paquete' | 'mensual',   // ← NUEVO, obligatorio
  fecha:     'YYYY-MM-DD',
  mascotaId: uuid,
  lat?, lon?
}) → ResultadoWrapper<LugarDeGuarderia[]>
```

**Qué es `fecha` según la modalidad — firma del founder:**

| modalidad | qué significa `fecha` |
|---|---|
| **día** | el día a agendar |
| **paquete** | **el PRIMER día a agendar** (la primera sesión se agenda al comprar) |
| **mensual** | **el día de INICIO** del período |

**Cada lugar devuelve el precio DE ESA MODALIDAD**, no los tres:

```ts
type LugarDeGuarderia = {
  prestadorId: string
  prestadorServicioId: string
  nombre: string
  precio: number          // ← el de la modalidad pedida, ya resuelto
  modalidad: 'dia' | 'paquete' | 'mensual'
  jornadaMinutos: number
  direccion: string | null
  ciudad: string | null
  disponible: number      // lugares libres ese día
  sobrevendido: boolean
}
```

🔴 **`precio` es UNO y ya viene resuelto.** *Devolver los tres y que la pantalla
elija sería pedirle a la superficie que repita una decisión que el server ya
tomó — y el día que difieran, la familia ve un precio y paga otro.*

⚠️ **Para `paquete`, `precio` es el del paquete COMPLETO**, no el del día. La
equivalencia por día la calcula `FichaDeOferta` (pieza de B), que ya existe y ya
la hace: **no se recalcula acá ni en la pantalla** — *el número es uno solo o no
sirve.*

---

## ② LO QUE EL FILTRO YA RESPETA — medido, no prometido

Estas cuatro ya viven en `obtener_guarderias_disponibles` y **no se tocan**:

| | dónde |
|---|---|
| **la víspera — jamás HOY** | `IF p_fecha <= hoy_local() THEN RETURN` |
| **cupo del día** | `cupo_guarderia_del_dia`, exige `disponible > 0` |
| **día operativo del lugar** | `_guarderia_dia_operativo` |
| **cobertura geográfica** | haversine contra `radio_cobertura_km` |
| **especie elegible** | `_mascota_elegible_servicio` + `especies_compatibles` |
| **quien no puede cobrar no se oferta** | `cuentas_comerciales.estado = 'activa'` (regla founder S54 / 7.13) |

### ✏️ LOS ESTADOS DEL CUPO SON **CINCO**, no seis — medido
`pasado` · `mismo_dia` · `no_opera` · `sin_lugar` · `elegible`.
**`sobrevendido` NO es un estado**: es un `boolean` aparte, que puede venir
`true` junto con cualquiera de los cinco. *Se declara acá porque el pedido decía
«los 6 estados» y un contrato que repite un número sin medirlo lo vuelve
permanente.*

---

## ③ 🔴 EL DEFECTO QUE ESTE CONTRATO DESTAPA — hay que curarlo ANTES

**`_guarderia_ofertas_cobrables` exige `ps.precio IS NOT NULL AND ps.precio > 0`.**

Pero la mesa **firmó el 29-ago que el precio del día es OPCIONAL** (migración
`20260829080000`, con `chk_precio_obligatorio_salvo_guarderia`).

> ### ⇒ **Un lugar que ofrezca SÓLO paquete, o SÓLO mensual, hoy no aparece en
> ninguna parte** — ni siquiera para la modalidad que sí ofrece.

*Y no da error: devuelve una lista más corta. **El lugar simplemente no existe
para nadie**, que es la clase de defecto que esta sesión viene cazando: el que
no falla, el que omite.* Hoy no se ve porque el único lugar publicado tiene los
tres precios.

**La cura va en la misma migración que el filtro:** el guard de precio pasa a ser
**por modalidad** — se exige el precio de la modalidad pedida, no el del día.

---

## ④ CÓMO SE FILTRA CADA MODALIDAD — medido contra el esquema

| modalidad | condición | de dónde sale el precio |
|---|---|---|
| **día** | `ps.precio IS NOT NULL AND ps.precio > 0` | `ps.precio` |
| **paquete** | existe ≥1 fila en `guarderia_paquetes` con `activo` | el paquete elegido *(hoy: 1 activo, 5 días / $40)* |
| **mensual** | `ps.precio_mensual_plan IS NOT NULL AND > 0` | `ps.precio_mensual_plan` |

⚠️ **`prestador_servicios.precio_paquete` existe como columna Y existe la tabla
`guarderia_paquetes` con `(tamano, precio)`.** **Manda la TABLA** — es la que el
taller escribe y la que admite los tres tamaños firmados (5 · 10 · 15). *La
columna es del molde viejo de otro oficio y no se usa acá; se declara para que
nadie la lea creyendo que es la fuente.*

---

## ⑤ LO QUE ESTE CONTRATO **NO** HACE

- **No reserva.** Sólo dice quién puede.
- **No compromete cupo.** Mirar no reserva; el cupo se toma al pagar.
- **No decide el tamaño del paquete** — eso es la pantalla siguiente, y el
  precio de la ficha sale de `guarderia_paquetes`.
- **No mira si la familia ya tiene saldo** de un bono: eso es el hub, otro
  lector (contrato ④).
