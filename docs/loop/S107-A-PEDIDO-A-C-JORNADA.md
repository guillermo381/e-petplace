# S107-A → C · `obtenerEstadiasDelDia` YA ESTÁ EN MAIN — pedido autocontenido

> **Qué es:** el wrapper que faltaba para cerrar el recorrido del prestador de punta a punta. **Está en `main`, exportado desde `@epetplace/api`, con su RPC y su E2E verde.** Se manda como texto autocontenido (regla 76b: nada por referencia).
> **Contrato de fondo:** `docs/contratos/s107-contrato-cupo-franja-estadia.md` §③.

---

## LA FIRMA, tal cual se consume

```ts
import { obtenerEstadiasDelDia, type EstadiaDelDia } from '@epetplace/api';

const r = await obtenerEstadiasDelDia(prestadorId, '2026-08-29'); // 'YYYY-MM-DD'
if (!r.ok) { /* r.codigo · r.mensaje — unión discriminada, sin string matching */ }
else       { /* r.data: EstadiaDelDia[] */ }
```

```ts
interface EstadiaDelDia {
  estadiaId: string;
  citaId: string;
  estado: 'reservada' | 'recogida_en_curso' | 'en_guarderia'
        | 'retorno_en_curso' | 'entregada' | 'cancelada' | 'no_recogida';
  mascotaId: string;
  mascotaNombre: string;
  mascotaEspecie: string;
  mascotaFotoUrl: string | null;
  espacioNombre: string | null;   // en qué sala quedó; null = sin asignar
  direccion: unknown | null;      // 🔴 DÓNDE HAY QUE IR — congelada al reservar
  aBordoEn: string | null;
  llegadaEn: string | null;
  entregadaEn: string | null;
}
```

**Códigos de fallo:** `no_gestionas_este_prestador` · `sin_sesion` · `datos_inconsistentes` · `error_desconocido`.

---

## LAS TRES COSAS QUE HAY QUE SABER PARA MONTARLO BIEN

**① Es una VISTA, no una entidad «jornada».** Un día con seis animales son **seis estadías**. La pantalla **compone**; no hay un objeto «jornada» que pedir ni que mutar.

**② 🔴 Sólo trae VERDAD FIRME: un hold sin pagar NO sale.** El lector filtra `estado_reserva = 'pagada'`. *Una lista que incluyera reservas que pueden evaporarse en quince minutos haría salir al cuidador a buscar un animal que nadie compró.* (Principio de S51, y acá aplica igual.)

**③ 🔴 `direccion` viene poblada, y es la mitad del trabajo.** Al escribir este lector apareció un hueco: **la reserva no guardaba dónde ir** (`D-963`, ya curada). Ahora la dirección se congela al reservar, con la misma pieza que el paseo a domicilio — **es la que la familia tenía cuando reservó**, no la que tenga el día de la recogida.

---

## LO QUE ESTE WRAPPER **NO** TRAE, para que no se busque

- **Las transiciones de estado** (`marcarABordo`, `marcarLlegada`, `marcarRetorno`, `marcarEntregada`): son **eventos server** y llegan con la tanda de actas (⑤). 🔴 **La UI jamás declara un estado por su cuenta.**
- **El contacto de la familia:** hay un lector angosto propio para eso; no viaja en la jornada.
- **Las franjas:** salen de `obtenerFranjasGuarderia(prestadorId)`, que ya está en main.
