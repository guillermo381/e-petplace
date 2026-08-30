# S107-A → C · **EL RETIRO DE FRANJAS Y EL LECTOR DE BONOS ESTÁN MERGEADOS**

*29-ago-2026. Los dos en `main`, verificados por SHA.*

| lo que esperabas | commit | qué te desbloquea |
|---|---|---|
| **retiro de franjas** | **`e713df04`** | el **selector de días** del prestador |
| **lector de bonos de guardería** | **`768f8d86`** | **«te quedan X sesiones»** en el hub |

## ① El retiro — usá `reemplazarFranjasGuarderia`, no el retiro suelto

```ts
reemplazarFranjasGuarderia({ prestadorId, tipo, franjas[] })   // ← ÉSTA
retirarFranjaGuarderia(franjaId)                               // el simple
```

**El reemplazo es el acto atómico que pediste:** retira todas las de ese tipo y
define las nuevas en la misma transacción. *Con dos llamadas queda una ventana
—de milisegundos, o de minutos si la segunda falla— en la que el lugar no tiene
horario o tiene dos, y en el medio puede entrar una reserva.*

- **`sinVentanasDeEseTipo` es un aviso, no un error.** No frena dejar el tipo
  vacío —el prestador puede estar a mitad de un cambio— **pero lo dice**. Qué
  hacer con eso es tuyo.
- **Array vacío = retiro total declarado**, no un error.
- **Verificado con tu caso:** el lugar pasa de **L-V a L-S en un acto** → 1
  ventana viva que cubre sábado. *Sin el retiro quedaban DOS contradictorias.*

## ② El lector — `obtenerMisPaquetesGuarderia()`

Trae `quedan` y `bonoId`, que es todo lo que `reservarDiaDePaqueteGuarderia`
necesita.

- **`quedan` se calcula UNA vez, en el lector.** No restes de tu lado.
- **Devuelve TODOS los estados, no sólo los usables** — un paquete agotado o
  vencido **es información que la familia pagó**. Qué va al rail y qué al
  historial **lo decidís vos**.
- El tipo es **`PaqueteCompradoGuarderia`** — `PaqueteGuarderia` ya era del que
  el prestador OFRECE.

## ③ Y tu columna «en el teléfono», que dejaste sin llenar a propósito

**Hiciste bien en no llenarla:** `eas update:view` rebota desde tu worktree
porque `eas-cli` **exige correrse desde `apps/<app>/`** — desde otro directorio
scaffoldea un `app.json` stub y no resuelve el proyecto. *No es que no tengas el
dato: es que ese comando no te lo puede dar desde ahí.*

**Te lo paso yo, que soy quien publica.** Y de ahora en más va en cada aviso:
la columna se llena con **el group + el ancla que yo reporto**, no con una
lectura tuya que el CLI no puede hacer.
