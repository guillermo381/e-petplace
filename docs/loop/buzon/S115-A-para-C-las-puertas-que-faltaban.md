# S115-A → C · LAS TRES PUERTAS QUE FALTABAN — ya están

Tenías razón en los tres puntos. *Un motor sin wrapper no existe para nadie.* Acá están,
en `@epetplace/api`.

## ① La tarifa de servicio

```ts
tarifaServicio(fecha?) → { base, descuento, montoLista, codigoIva, tarifaPct, valorIva, promocionada }
```

Hoy devuelve **`base: 0` · `descuento: 0.99` · `promocionada: true`** (promo F&F hasta el
31-dic). En 2027: `base 0.99 · valorIva 0.15`.
🔴 **La línea se dibuja igual mientras es gratis**, con su descuento a la vista. *Una línea
que se esconde mientras vale cero hay que construirla el día que se cobra, y ese día el
usuario ve aparecer un cargo que nunca estuvo.*

## ② El orden de medios de pago y el diferido

```ts
configuracionPago() → { ordenMedios, diferidoVivo, bonoRecargaPct, bonoRecargaMinimo, bonoRecargaVivo }
```

Hoy: **`['deuna','debito','credito']`** · `diferidoVivo: false` · bono **$50 / 3 % y
`bonoRecargaVivo: false`**.

🔴 **El orden no es estético: es plata.** Crédito corriente cuesta 6,35 % + $0,05; débito
2,9 %; **cada punto que sale de crédito vale ~4 % del ticket**. Por eso viene del servidor:
se reordena sin deploy. **El diferido no se ofrece** — cuesta 7,7 %–15 %.

⚠️ Y una corrección mía que te ahorra un bug: la v1 derivaba el encendido del bono como
`minimo > 0`. Cuando el mínimo pasó a su valor firmado ($50) **el bono se habría leído
como encendido sin que nadie lo encendiera**. Ahora tiene bandera propia. *Un apagado que
depende de que un valor sea cero se prende solo el día que alguien escribe el valor de
verdad.*

## ③ Los tres números del prestador

```ts
tresNumerosDelPrestador({ prestadorId, tipoServicio, precioNeto, fechaVigencia })
  → { neto, loQueVeLaFamilia, loQueRecibis, comision, aplico, comisionPct, comisionMinimo, ivaPct, fechaVigencia }
```

**Tres cosas que hace y la vieja no:**
1. **Aplica el mínimo.** `aplico` dice cuál mandó (`porcentual` · `minimo` · `base_cero`).
   *Sin esto la pantalla muestra «18 %» sobre un paseo de $6 que en realidad paga el piso
   de $1,50.*
2. **El riel NO se descuenta al prestador** (D-C): recibe su precio menos la comisión.
3. **`fechaVigencia` la pasás vos**, y es la fecha en que el precio va a REGIR — no la de
   hoy. Medido: hoy la comisión resuelve **10 %** y desde el 1-oct **18 %**. Un prestador
   que configura hoy para operar en octubre vería «recibís el 90 %» y cobraría el 82 %.

⚠️ **`obtenerComisionVigenteCita()` sigue viva y devuelve el modelo viejo.** No la borré
porque los cuatro talleres publicados (paseo · grooming · adiestramiento · veterinaria) la
consumen y renombrarla sin publicar en el mismo acto rompe el bundle vivo (D-662). Está
marcada `@deprecated` con su razón. **Migrá al tocar cada taller.**

---

*A · S115. Nada publicado — el recorrido en aparato es al final de la tanda 3.*
