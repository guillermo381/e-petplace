# S84-A15 / A16 · DOS MEDICIONES, SIN CURAR

---

# A15 · EL GPS EN PASEO SIMULTÁNEO — **SIGUE VIVO**

## ① La ficha existe: **D-595**, 🔴 ALTA, **abierta**

*"El GPS asume UN paseo por vez, y el oficio real es SIMULTÁNEO — CONTRA UNA
VERDAD DE PRODUCTO."* Origen: **el gate del founder sobre el lote S81**, en S83.
**Su condición de muerte NO se cumplió** — exige *un seed de dos paseos
simultáneos del mismo paseador* y que el track de cada uno se lea separado en el
teléfono. **Ese seed no existe.** La ficha lo declara como parte de la cura, no
como paso previo opcional: *sin dos atenciones vivas no hay forma de producir el
rojo*.

## ② Verificado contra el CÓDIGO VIVO — y es peor que "solo la primera"

`apps/prestador/src/lib/track-gps-fondo.ts`, literal:

```js
export const TAREA_TRACK_GPS = 'epetplace-track-paseo';   // UNA tarea, nombre global
const STORAGE_SESION = 'track-gps-sesion-activa';          // UNA clave, singular
let sesion: SesionTrack | null = null;                     // UN singleton de módulo

export async function iniciarCapturaFondo(...) {
  const s = sesion;
  await AsyncStorage.setItem(STORAGE_SESION, JSON.stringify({ eventoAtencionId: s.eventoAtencionId }));
  const yaCorre = await Location.hasStartedLocationUpdatesAsync(TAREA_TRACK_GPS);
  if (yaCorre) return;                                     // ← el segundo paseo NO arranca nada
  await Location.startLocationUpdatesAsync(TAREA_TRACK_GPS, {...});
}
```

**Las tres piezas son singulares por construcción:** una tarea con nombre fijo,
una clave de storage, un `let sesion` de módulo. **No hay dónde poner un segundo
paseo.**

### La secuencia exacta con dos paseos vivos

1. **Paseo A arranca** → `sesion = {A}` · storage `{A}` · la tarea arranca.
2. **Paseo B arranca** → `sesion = {B}` **(pisa el singleton)** · storage `{B}`
   **(pisa)** · `yaCorre === true` ⇒ **`return`, no arranca nada**.
3. La tarea —**la única**— sigue viva y ahora entrega sus puntos al
   `eventoAtencionId` de **B**.

> **⚠️ MATIZ SOBRE EL REPORTE DEL FOUNDER, y conviene decirlo:** él registró que
> *"el GPS solo funciona en la primera que se activa"*. **Lo que el código
> muestra es lo contrario: el track sobreviviente es el de la ÚLTIMA**, porque
> ambas escrituras (`sesion` y el storage) pisan. **El síntoma visible puede ser
> el mismo** —una de las dos mascotas queda sin recorrido— y por eso el reporte
> es válido; **cuál de las dos queda huérfana cambia según cuál se abrió
> segunda.** Se anota porque **el seed de la cura tiene que probar las dos
> direcciones**, no solo una.

### Y un segundo defecto que la ficha no nombraba

```js
export async function detenerCapturaFondo(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_SESION);
  if (corre) await Location.stopLocationUpdatesAsync(TAREA_TRACK_GPS);
}
```

**Terminar UNO de los dos paseos apaga la captura de los DOS.** No hay conteo de
sesiones vivas: el primer `terminar` mata el servicio. **Es la mitad simétrica
del bug de arranque**, y hay que curarlas juntas — arreglar solo el arranque
dejaría dos tracks que mueren con el primer cierre.

## ③ Estado

**La deuda sigue viva, el código lo confirma, y NO se curó nada** — la orden lo
prohibía y además el motor del paseo es lo más caro de romper que tiene la app.
**D-595 queda abierta**, con estas dos precisiones sumadas a su ficha.

---

# A16 · LOS HECHOS VERIFICADOS — **SÍ SE PUEDE DISTINGUIR** (el freno NO se cumple)

## Lo que guarda el resultado del ciclo §14.2

| tabla · columna | qué guarda |
|---|---|
| `prestador_documentos.estado` | `aprobado` · `pendiente` · `rechazado` |
| `prestador_documentos.revisado_por` | **uuid del admin que lo miró** |
| `prestador_documentos.revisado_en` | cuándo |
| `prestador_documentos.notas_revision` | su veredicto en texto |
| `prestadores.aprobado_en` / `aprobado_por` | la aprobación del prestador entero |

**El predicado es inequívoco y no hay que inventarlo:**
`estado = 'aprobado' AND revisado_por IS NOT NULL`.
**Hay rastro de QUIÉN revisó y CUÁNDO** — eso es exactamente lo que §4 pide para
poder decir "verificado" sin que la plataforma avale lo que no miró.

## ⚠️ PERO LOS NÚMEROS CAMBIAN EL ALCANCE, y son la parte útil de esta medición

```
prestador_documentos : 9 filas · 6 'aprobado' · pero revisado_por NO NULO en solo 2
prestadores          : 7 filas · 3 con aprobado_en
prestador_especialidades : 1 fila
```

**Seis documentos están en `aprobado` y solo DOS tienen revisor.** Los otros
cuatro llegaron a `aprobado` **sin dejar rastro de quién los aprobó** — son de
Satori (3) y un `[DEMO S68]` de Clínica Aurora.

> **ESTO ES EL FRENO DE LA ORDEN, aunque no en la forma que anticipaba.** No es
> que *no se pueda* distinguir: **se puede**. Es que **el estado `aprobado` NO
> ALCANZA como criterio** — usarlo solo etiquetaría como verificadas cuatro
> filas que nadie registró haber revisado. **La distinción existe en
> `revisado_por`, no en `estado`.** *Preferimos cero hechos verificados antes que
> uno falso: con el predicado completo quedan **2**, y con el flojo quedarían 6.*

## Lo que HAY hoy como hecho verificado real (las 2 filas)

Las dos son de **Clínica Los Shyris**: `registro_senescyt` ("Registro SENESCYT")
y `titulo_profesional` ("Título profesional").

> ⚠️ **Y acá está el límite honesto de esta medición: el `nombre` es el nombre
> del ARCHIVO, no el contenido de la credencial.** Los otros documentos lo
> muestran crudo: *"WhatsApp Image 2026-05-08 at 8…"*, *"Screenshot 2026-05-08
> at 8.32…"*. **No hay número de registro, ni emisor, ni titular en columnas
> legibles** — están dentro del archivo, que nadie parsea.
>
> **Consecuencia directa sobre §5:** el escriba puede citar **"tiene su registro
> SENESCYT verificado"**, pero **NO puede citar el número** como hizo en mi
> prueba de A8 — **ese `SENESCYT 1234567890` lo inventé yo en el `curl`, y el
> dato no existe en ninguna columna.** *Lo verificado que se puede CITAR hoy es
> el HECHO de la verificación, no su contenido.*

## Respuesta a la orden

**SÍ se puede distinguir** ⇒ **no freno**. Los hechos verificados pueden viajar
etiquetados, **con dos condiciones que salen de la medición**:

1. **El predicado es `estado='aprobado' AND revisado_por IS NOT NULL`**, nunca
   `estado` solo — o cuatro filas sin revisor entrarían como avaladas.
2. **El hecho que viaja es la EXISTENCIA de la credencial verificada, no su
   número** — porque el número no está en ninguna columna. Prometer más sería
   inventar, que es el primer muro.

**Alcance real hoy: UN prestador (Clínica Los Shyris) con DOS hechos
verificables.** Los demás tendrían cero — y eso está bien: §3 dice que el perfil
nace compuesto y el prestador lo mejora.

**NO SE CONSTRUYÓ NADA.** El caller de los hechos es de C.
