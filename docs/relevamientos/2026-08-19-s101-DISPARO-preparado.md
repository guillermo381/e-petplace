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

## 🔴 EL CAMINO CAMBIÓ — server-to-server MURIÓ POR MEDICIÓN

El disparo del 19-ago rebotó en la tokenización con **`401 Application is not PCI`**:
Nuvei **no acepta PAN server-to-server de una app no-PCI, ni en sandbox**. La advertencia
de la cabecera del arnés resultó literal.

⇒ **El disparo va por el Add Card real**, que es camino del producto y no descartable.

### Paso 1 · cargar las credenciales CLIENT (una vez)

```bash
npx supabase secrets set NUVEI_APP_CODE_CLIENT=...
npx supabase secrets set NUVEI_APP_KEY_CLIENT=...
# opcional, si la doc da otra URL de SDK:
# npx supabase secrets set NUVEI_SDK_URL=...
npx supabase functions deploy pagos-addcard-stg --no-verify-jwt --use-api
```

### Paso 2 · rearmar la reserva (vence a los 30 min)

```bash
npx supabase --experimental db query --linked \
  --file docs/relevamientos/2026-08-19-s101-REARMAR-compra-del-gate.sql
```

Verde: `2_compuertas` con `"ok": true` y `3_reserva` con `vigentes=1`.

### Paso 3 · abrir la página y tokenizar

```
https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/pagos-addcard-stg?k=<ARNES_SECRET>&compra=a2efd9b7-eac4-4e6e-baed-956554e7215c
```

La página trae la **4111 1111 1111 1111** precargada (vto 12/2030, CVC 123). El botón
tokeniza **en el navegador** y el **servidor** dispara el débito — el navegador nunca
conoce `ARNES_SECRET`.

⚠️ El secreto viaja en la URL y **queda en el historial del navegador**. Proporcionado
para un ensayo de sandbox; **muere con la letra del Add Card real**, donde la puerta es
la sesión del usuario.

### Si Erick habilita PCI en staging

El arnés **no cambió** por ese lado: el `curl` con `tarjeta` sigue sirviendo tal cual.

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
