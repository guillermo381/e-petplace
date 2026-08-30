> ☠️ **CUMPLIDO — verificado contra el objeto el 29-ago.** A lo publicó y C lo consume. **Se conserva como registro; NO es un pedido vivo.**

# S107-C → A · **EL HUB NO PUEDE SABER QUE LA FAMILIA TIENE UN PAQUETE**

> Lo bloquea la mitad del recorrido que el founder pidió caminar: *«y después agendar una segunda
> desde el hub contra el saldo»*.

## LO MEDIDO

**No hay lector de bonos de guardería del lado de la familia.** El del paseo
(`obtenerMisPaquetesSalidas`, `paquetes.ts:300`) **está clavado en su oficio**:

```ts
.eq('tipo_servicio', 'paseo')
```

⇒ **el hub de guardería no puede pintar ni el botón «Reservar estadía de tu paquete» ni el
«7 de 10 disponibles»** que el founder firmó, porque **no sabe que el bono existe.**

## LA FORMA

```ts
obtenerMisPaquetesGuarderia() → PaqueteDeGuarderia[]

interface PaqueteDeGuarderia {
  bonoId: string;
  prestadorId: string;
  prestadorNombre: string;   // el paquete es DE UN LUGAR: el hub lo nombra
  saldo: number;             // ← el número del «7»
  total: number;             // ← el «de 10»
  venceEl: string | null;
}
```

🔴 **`saldo` y `total` los da el MOTOR, no la resta de la pantalla.** *Si dos superficies
restaran por su cuenta, podrían decir números distintos del mismo bono.*

⚠️ **Sólo los VIGENTES** — activo, con saldo y sin vencer. *El vencido no es un paquete con cero:
es un paquete que ya no está, y mostrarlo en cero invita a tocarlo.*

## LO QUE YA ESTÁ DE MI LADO

✅ **La compra entera**, con su primera sesión en el mismo acto (firma del founder) y **el pago
simulado declarado en pantalla** — medido: el bono nace `estado_pago='pagado'` con
`pago_simulado: true`.
✅ **`reservarDiaDePaqueteGuarderia` consumido**, con `mascotaId` viajando en la primera compra
para no chocar con `mascota_no_determinada` justo donde la familia no lo entendería.
🔴 **Falta sólo esto para cerrar el círculo:** que el hub SEPA.

## ⚠️ Y UNA DECISIÓN QUE NO TOMO — es tuya o de la mesa

**Con dos o más mascotas elegibles, agendar contra saldo exige preguntarla** (`mascota_no_determinada`).
El hub **ya tiene los chips de mascota**, así que la pregunta está resuelta **si el botón vive
debajo de ellos**. *Lo digo porque el orden que firmó el founder los pone arriba de las pestañas
—y arriba de los chips el botón no tendría sujeto.* **Decide la mesa; yo no lo muevo solo.**
