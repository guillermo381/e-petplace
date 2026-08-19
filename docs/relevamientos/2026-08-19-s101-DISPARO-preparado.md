# S101-A · EL DISPARO, PREPARADO — falta pegar la tarjeta y ejecutar

> 19-ago-2026, noche. **NO se disparó**: falta la tarjeta de prueba de la doc de Nuvei.
> Frenos vigentes: **solo sandbox**; lo real pide firma aparte.

## La compra fresca — creada POR LAS PUERTAS REALES

No se insertó a mano: se pasó por `crear_pedido_despensa` → `crear_compra_desde_pedidos`
→ `crear_intento_pago` (que aparta el stock y **congela el desglose**). *Un escenario
armado a mano prueba la función, no el camino.*

| | |
|---|---|
| **compra_id** | `a2efd9b7-eac4-4e6e-baed-956554e7215c` |
| pedido_id | `3824b0e3-7f28-4420-8945-3a3175c8f523` |
| **total** | **4,14 USD** (la oferta publicada más barata con stock) |
| estado | `esperando_pago` · desglose **1 línea** · reserva **vigente** |
| clave | `s101-gate-<timestamp>` — identificable para el corte semilla/real |

**No es una de las semillas clavadas.** Nació hoy, por el camino real, para este gate.

### Compuertas verificadas sobre ella

```json
{ "ok": true, "pedidos": 1, "monto_verificado": 4.14,
  "evaluadas": ["0_intento_en_vuelo","1_reserva","2_monto","4_vendedor","5_token"],
  "no_evaluables": ["cobertura"] }
```

⚠️ **La reserva de stock vence a los 30 minutos.** Si el disparo tarda más, la compuerta
1 va a rebotar `reserva_vencida` — **y eso es correcto, no un bug**. Se rearma corriendo
`crear_intento_pago` de nuevo sobre la misma compra (es idempotente por PK del desglose).

## El cuerpo del POST — ARMADO Y LISTO

**La tarjeta es la oficial de `developers.paymentez.com/api/#test-cards`, escenario ÉXITO.**

```bash
curl -s -X POST \
  https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/pagos-arnes-sandbox \
  -H "Content-Type: application/json" \
  -H "x-arnes-secret: <ARNES_SECRET>" \
  -d '{
    "compra_id": "a2efd9b7-eac4-4e6e-baed-956554e7215c",
    "email": "arnes-s101@epetplace.test",
    "tarjeta": {
      "number":       "4111111111111111",
      "holder_name":  "ARNES S101",
      "expiry_month": 12,
      "expiry_year":  2030,
      "cvc":          "123",
      "type":         "vi"
    }
  }' | python3 -m json.tool
```

🔴 **Lo ejecuta el founder, no la pista.** `ARNES_SECRET` vive **solo** en los secrets
de la función — no está en el árbol local ni debe estarlo. *Que la pista no pueda
disparar sola es la puerta funcionando, no un obstáculo.*

### Dos precisiones de la doc, ya respetadas

**① No se combina tarjeta de escenario con `order.description` de escenario.** El arnés
manda `description: "e-PetPlace compra <8 chars>"` — una descripción **común**, no un
disparador de escenario. Con la tarjeta de éxito, la combinación es legal.

**② El `user.id` que va en el débito es el que entra al `stoken`.** El arnés usa
**el mismo** `arnes-<compra_id[0:8]>` en la tokenización y en el débito, y el buzón lo
lee del payload (`user.id`, con caída a `transaction.user_id`). *Si registráramos uno y
mandáramos otro, el `stoken` daría false por una razón que no es la fórmula — y
habríamos quemado la observación de un solo tiro diagnosticando el problema equivocado.*

## Qué mirar después, en orden

**1 · La respuesta del arnés** trae `paso[]` con los seis tramos. El `5_debito` dice
`status`, `status_detail`, `transaction_id` y `authorization_code`.
**Es SEÑAL OPTIMISTA: el pedido NO está confirmado por esto.**

**2 · La fila del webhook** — la que cierra la pregunta del `stoken`:

```sql
SELECT recibido_en, resultado, stoken_valido, transaction_id, detalle, payload
FROM webhook_events ORDER BY recibido_en DESC LIMIT 1;
```

**Los tres casos, escritos de antemano:**

| lo que diga la fila | qué significa | qué se hace |
|---|---|---|
| `stoken_valido = true` (la doc trae el ejemplo con el stoken en `transaction.stoken` — **nuestro primer candidato**) | **fórmula y lugar confirmados** | se fija el lugar que dice `stoken_de`, se borran los otros dos candidatos, y el buzón pasa a **actuador** (transición idempotente vía `confirmar_pago_compra`, `p_monto` siempre poblado) |
| `false` con `stoken_de` poblado | el lugar es ése ⇒ **falla la FÓRMULA** (orden de campos, o `user_id` no es el que creemos) | **se frena y se reporta la fila entera.** No se cablea actuador sobre fórmula no confirmada |
| `stoken_de = ninguno de los tres` | viene en un **cuarto lugar** | se lee el `payload` crudo, que está guardado entero |

**Ninguno de los tres exige un segundo evento de Nuvei.**
