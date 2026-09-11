# S115-E → A · 🔴 la edge consume numeración y no persiste

**Medido:** 10-sep-2026 · **Arnés:** `scripts/s115/e2e-cupo.mjs` (contra `fiscal-emitir` REAL)
**Sujeto:** pago `52e143f9…` · documento `8aed2547…`

---

## Lo que pasó, en dos pases

```
contador de facturas ANTES: 0

① cupo agotado (fiscal_simular_cupo_agotado = true)
   edge → {"hechos":[{"secuencial":"000000001","estado":"emitiendo"}]}
   fila → estado=borrador · secuencial=NULL · clave=NULL · motivo=NULL

② reactivado (bandera = false)
   edge → {"hechos":[{"secuencial":"000000002","estado":"emitiendo"}]}
   fila → estado=borrador · secuencial=NULL

contador de facturas DESPUÉS: 2
```

## Los tres hechos

1. **La respuesta de la edge afirma un estado que la fila no tiene.** Dice
   `secuencial 000000001 · emitiendo`; la fila quedó `borrador` con `secuencial NULL`.
   *Ese `hechos[]` se arma con las variables locales (`sec`, `reintentable`), no leyendo
   la fila — así que su «ok» no prueba que algo se haya guardado.*
2. **Cada pase toma un secuencial nuevo.** El segundo tomó `000000002` — porque `d.secuencial`
   seguía NULL, o sea que la protección del comentario ② (*«un reintento que toma número
   nuevo no es un reintento»*) **no se activó**, no porque esté mal escrita sino porque no
   había número que reusar.
3. **El contador subió 2 y ninguna fila los tiene.** Son huecos en la numeración fiscal.

## Lo que descarté midiendo

- **No es el CHECK.** Reproduje el UPDATE exacto con una clave bien derivada y **pasa**:
  `estado='emitiendo'` + est/pto/secuencial/clave/ruc/`sri_ambiente='pruebas'`/fecha.
- **No es una clave mal derivada.** `fiscal_clave_acceso` con los datos del emisor
  (`ambiente 1 → 'pruebas'`) devuelve una clave que el CHECK acepta.
- **No quedó en `no_autorizada`**, así que el `catch` tampoco corrió.

⇒ **El UPDATE de persistencia no llegó a la fila y nadie se enteró.** Mi hipótesis —tuya
para confirmar— es que afecta 0 filas y eso no es un `error` en supabase-js, igual que el
caso que tu propio comentario ④ describe para el rebote de CHECK.

## Y un defecto MÍO en el mismo arnés, para que no te confunda

Mi primera versión comparó `e1.secuencial === e2.secuencial` y publicó **🟢 REUSÓ su
secuencial** — comparando **`null === null`**. *Un falso verde sobre el defecto más grave
que este e2e vino a buscar.* Ya está curado: ahora exige que haya habido número.

## Residuo

Documento borrado, líneas borradas, bandera de vuelta en `false`, `documentos_fiscales` en
0. **Lo único que NO se puede devolver son los 2 secuenciales**, y por eso van declarados
acá en vez de escondidos: el contador de facturas está en **2** y ninguna fila los usa.
