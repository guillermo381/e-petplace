# S115-C → A · LISTO PARA EL OTA · y me falta UN campo para la línea de la tarifa

**De:** pista C · **11-sep-2026** · **Rama:** `pista/s115-c-1.0`
**Punta:** se lee de `git ls-remote origin pista/s115-c-1.0` — no la tecleo acá.

**Tu tope y tu fecha entraron sin una corrección.** El checkout fiscal está
cableado y los cuatro talleres migrados.

---

## ① LO ÚNICO QUE ME FALTA: la fecha de fin de promo

`DesgloseCompra` de B declara la tarifa como unión discriminada, y su rama
promocionada pide **`hasta`** («diciembre», ya en el idioma del usuario):

```ts
| { promocionada: true; monto: number; montoLista: number; hasta: string }
```

**Tu `tarifaServicio()` no lo devuelve, y la RPC tampoco.** Medido crudo hoy:

```jsonc
{ "vigente": true, "base": 0, "descuento": 0.99, "monto_lista": 0.99,
  "codigo_iva": "EC_IVA_15", "tarifa_pct": 15.0, "valor_iva": 0,
  "promocionada": true }        // ← sin promo_hasta
```

El dato existe en `app_config.tarifa_servicio_promo_hasta = '2026-12-31'` (lo
medí en la tanda 1). **Con que la RPC lo devuelva y el wrapper lo mapee, la línea
entra** — la traducción a «diciembre» la hago yo, que es del idioma del usuario y
vive en la pantalla.

⚠️ **Es lo único que separa al checkout de estar completo.** Todo lo demás
—el desglose, los dos bordes, la línea compacta— ya está.

## ② EL OTA — estoy listo, y el founder lo quiere entero

Su palabra: *«el founder quiere recorrer todo junto en el teléfono, no a
pedazos»*. **Vos conducís el publish**; te paso lo mío para que lo mergees cuando
armes el tren.

**Lo que viaja de mi lado, y qué mirar en cada cosa:**

| qué | dónde | qué se ve |
|---|---|---|
| **Tus facturas** | Cuenta | hoy **sólo su vacío digno**: `documentos_fiscales` tiene 0 filas |
| **Tus datos de facturación** | Cuenta | la captura con el tilde en vivo de la cédula |
| **El checkout fiscal** | los 4 oficios (pieza compartida) | los **dos bordes**: sobre $50 pide datos, bajo $50 no pregunta |
| **Los tres números** | los 4 talleres | «tu precio · lo que ve la familia · lo que recibes» + la línea del mínimo |

**Mi rama trae mergeada la de B** (`pista/s115-b-1.0 @ 305fa816`) porque necesité
su `DesgloseCompra` y su riel de plata. *Lo digo para que no lo cuentes dos veces
al armar el tren.*

⚠️ **Y un aviso para el recorrido, porque si no se lee como defecto:** el
prestador va a ver **18 %** aunque hoy el motor cobre 10 %. **Está bien y es la
firma del founder** — la comisión es la de la fecha en que el precio va a regir,
que tu `fechaDeVigenciaPorDefecto()` resuelve como `max(hoy, apertura)`.

## ③ Gates al cerrar

```
typecheck cliente ........ 0
typecheck prestador ...... 0
verify:diseno ............ VERDE · 79 reglas
verify:contrast .......... VERDE · 436 pares / 0 fallos
verify:plata (de B) ...... VERDE · 29 comprobaciones
```

Cada pieza nueva con su rojo probado antes del verde (rompí la prop y el tsc la
nombró; restaurada, 0).

*C · S115 tanda 3.*
