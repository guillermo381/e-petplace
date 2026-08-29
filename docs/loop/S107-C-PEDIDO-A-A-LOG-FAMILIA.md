# S107-C → A · PEDIDO AUTOCONTENIDO — el lector de estadías del lado de la FAMILIA

> **Qué destraba:** el **log** del hub de guardería — la mitad que los otros cuatro oficios tienen y guardería no. **Firma de la mesa:** *«el LOG se construye, no se pospone: una familia que reserva y no tiene dónde ver sus estadías es lo que hace que el oficio se sienta ajeno.»*
> **Por qué a A:** es un lector nuevo. **C tiene su mitad construida e inerte** (el hub ya monta las piezas del patrón; le falta con qué llenar la lista).

---

## ① POR QUÉ NO ALCANZA LO QUE YA EXISTE — medido

`obtenerEstadiasDelDia(prestadorId, fecha)` **no sirve acá**, y no es cuestión de permisos:

| | el que existe | el que hace falta |
|---|---|---|
| **eje** | **por PRESTADOR y por DÍA** | **por MASCOTA/FAMILIA, a lo largo del tiempo** |
| **quién pregunta** | el cuidador: *«¿a quiénes recibo hoy?»* | la familia: *«¿cuándo va Thor, y cuándo fue?»* |
| **verdad** | sólo firme (sin holds) — correcto para salir a buscar | 🔴 **la familia SÍ necesita ver su reserva sin pagar**: es la que tiene que ir a pagarla |

*Son dos preguntas distintas sobre la misma tabla, y la segunda no se puede componer llamando N veces a la primera.*

---

## ② LA FORMA QUE C CONSUME

```ts
obtenerMisEstadias(params: {
  mascotaId?: string | null;   // null = todas las de la familia
  desde?: string; hasta?: string;  // 'YYYY-MM-DD'; por defecto, ventana razonable
}): Promise<ResultadoWrapper<EstadiaDeLaFamilia[], CodigoError…>>

interface EstadiaDeLaFamilia {
  estadiaId: string;
  citaId: string;
  fecha: string;                 // 'YYYY-MM-DD'
  estado: EstadoEstadia;         // el vocabulario que ya existe
  /** 🔴 Para que la familia sepa si le falta pagar. */
  estadoReserva: 'pendiente_pago' | 'pagada' | 'expirada' | 'cancelada';
  expiraEn: string | null;       // el hold, si sigue vivo
  prestadorId: string;
  prestadorNombre: string;
  mascotaId: string;
  mascotaNombre: string;
  /** Las dos ventanas del lugar ESE día, congeladas o vigentes — la familia
   *  pregunta «¿a qué hora pasan?» y hoy sólo lo sabe entrando al lugar. */
  recogeDesde: string | null; recogeHasta: string | null;
}
```

🔴 **`estadoReserva` es la diferencia que importa.** Sin él, una reserva con el hold vivo **se vería igual que una pagada**, y la familia no sabría que tiene quince minutos para pagar. *El lector del prestador filtra los holds a propósito; el de la familia no puede.*

---

## ③ QUÉ HACE C CUANDO LLEGUE

El hub pasa a tener **el esqueleto de sus cuatro hermanas**, que ya está censado y firmado: `Encabezado` → **`FiltroMascotas`** → **`FiltroPills`** (próximos / historial) → **`FilaCita`** → **CTA al pie** hacia el flujo.
**Hoy el hub monta las piezas de selección y le falta exactamente esto: la lista.**

---

## ④ UNA PREGUNTA QUE ES DE MESA Y NO DE CÓDIGO

**¿La estadía entra a la Línea de Vida del expediente?** Los otros cuatro oficios sedimentan. **Guardería todavía no**, y no lo decido yo. *Si entra, el evento nace al entregar —como el paseo— y no al reservar.*
