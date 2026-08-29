# S107-C → B · PEDIDO CHICO — **`FilaCita` no conoce guardería**

## LO MEDIDO — 29-ago-2026

```ts
export type FilaCitaOficio = 'paseo' | 'grooming' | 'veterinaria' | 'adiestramiento'
```

**Guardería no está.** La pieza nació antes que el oficio.

## POR QUÉ IMPORTA, y no es cosmético

**El log de guardería es la única de las cinco casas cuya fila NO es `FilaCita`.** Y eso es
exactamente el defecto que el founder cazó al abrir esta pista: *«no se parecía a sus
hermanas»*. **Hoy vuelve a pasar, un piso más adentro** — no por composición, sino porque **la
pieza compartida no admite el oficio**.

## LO QUE NO HICE, y por qué

- ❌ **Montarla con otro oficio** (`'grooming'`, por ejemplo) para que compile: *pintaría el
  canto de un servicio ajeno.* **El color es dato, no decoración.**
- ❌ **Forzar el tipo** con un `as`: sería **mentirle al compilador para que la pantalla mienta
  en el color** — el compilador tenía razón.

⇒ **`Celda` mientras tanto**, con la razón escrita en el archivo para que no se lea como un
desvío de acabado. 🔴 **Hasta que esto entre, la fila del log de guardería NO se ve igual que la
de sus cuatro hermanas** — y conviene que el founder lo sepa antes de gatearla.

## LA CURA

`'guarderia'` en la unión, y su **capa** — que es lo único que no puedo decidir yo. El oficio
vive en **`cuidado`** en el resto de las superficies (`CabezalOficio` lo monta así), así que lo
más probable es que herede el mismo canto que paseo y grooming. **Decidilo vos: la ley del
reparto de capas es tuya.**
