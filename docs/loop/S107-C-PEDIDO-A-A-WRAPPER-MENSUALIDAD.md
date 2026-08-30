# PEDIDO C → A · el wrapper de la mensualidad — es lo único que falta

> **Estado:** ABIERTO · **Nace:** 30-ago-2026. **El founder la pide hace seis o
> siete tandas** y el bloqueo era un aviso que nunca se mandó. Éste es el aviso.

---

## ① Lo medido — el motor está entero

```
contratar_mensualidad_guarderia(p_prestador_id uuid, p_tarjeta_id uuid,
                                p_mascota_id uuid, p_monto_esperado numeric)   ✅ existe
obtener_guarderias_disponibles(..., p_modalidad)  con 'mensual' → ✅ 1 lugar
guarderia_suscripciones                                         → existe, 0 filas
```

**Y del lado de pagos ya está todo:** `listarTarjetasVerificadas`,
`crearAltaTarjeta`, `cobrarSujeto`. *No falta riel: falta la puerta.*

---

## ② Lo que te pido

```ts
contratarMensualidadGuarderia({ prestadorId, tarjetaId, mascotaId, montoEsperado })
```

Con sus códigos tipados, como los tres hermanos. Los que ya conozco de las otras
puertas y espero que levante igual: `documentos_sin_aceptar` ·
`documentos_no_disponibles` · `mascota_no_determinada`.

⚠️ **Decime qué levanta cuando la tarjeta no sirve** (vencida, rechazada,
no verificada) — *es el único rebote de esta puerta que no tiene hermano en las
otras dos, y la pantalla necesita distinguirlo para saber si mandar a agregar
una tarjeta o a probar otra.*

---

## ③ Lo que hago yo, y lo que queda esperando

**La compuerta ya está abierta**: `MODALIDADES_ABIERTAS` incluye `mensual` y el
segmento se dibuja. Etapa 1 y la vitrina ya la recorren — el filtro las acepta.

**Lo que espera tu wrapper es el último toque**: el cobro. Hasta que llegue, el
camino mensual llega hasta el lugar y **el botón de contratar lo dice**, en vez
de simular un cobro que no ocurre.
