# S112-D · EL CONTRATO DEL HILO — para C, para montar sin adivinar

> **De:** pista D (`packages/mensajeria`) · **Para:** **C**, que monta las dos
> superficies · **Rama:** `pista/s112-d` · base `main` `cc55348b`.
> **Todo lo de acá está MEDIDO contra la base viva el 1-sep-2026**, no leído de
> un reporte. Donde algo no existe, lo digo con su número y su control.

---

## §0 · LO PRIMERO, PORQUE CAMBIA TU PLAN

**El motor y los siete wrappers YA ESTÁN.** No espera nada de mí para que
empieces: A los construyó en `cea76e36`. Lo que te faltaba era esta hoja.

🔴 **Y hay DOS cosas que tu pantalla NO va a poder hacer**, medidas, con su
razón y su número — están en §5. **Se dicen acá arriba para que no las
descubras a mitad de una pantalla:**
- **el adjunto de imagen NO EXISTE** — ni columna, ni parámetro, ni bucket privado;
- **la respuesta automática al postular NO SE INSERTA** — su configuración no existe.

---

## §1 · LOS CUATRO ESTADOS Y LA REGLA DE ESCRITURA

```
recibida ──► en_conversacion ──► aceptada
    │              │                 │
    └──────────────┴────────────► declinada
```

| estado | ¿se escribe? | ¿se lee? |
|---|---|---|
| `recibida` | **sí** | sí |
| `en_conversacion` | **sí** | sí |
| `aceptada` | **no** | **sí, siempre** |
| `declinada` | **no** | **sí, siempre** |

🔑 **`recibida → en_conversacion` NO es un botón.** Lo mueve el motor **en el
mismo acto** en que el publicador escribe su primer mensaje. **No lo pidas, no
lo muestres como acción, no lo repliques en el cliente** — `responder…` te
devuelve el `estado` ya movido. *Un estado que alguien tiene que acordarse de
mover es un estado que va a estar mal.*

⚠️ **Terminal es terminal para LOS DOS.** Medido: con el hilo `declinada`,
**tanto el solicitante como el publicador** reciben `solicitud_terminal`. No
dibujes el campo de escritura en un hilo cerrado — y si lo dibujás deshabilitado,
la razón es *«esta conversación ya se cerró»*, no un error.

---

## §2 · LAS SIETE FUNCIONES — firma, error tipado, ejemplo

Todas viven en `@epetplace/api` (`packages/api/src/wrappers/adopcion.ts`) y
devuelven `ResultadoWrapper<T, CodigoErrorAdopcion>`:
`{ ok: true; data: T }` | `{ ok: false; codigo; mensaje; detalle? }`.

> **Regla 35, sin excepción:** ramificás por **`codigo`**, jamás por `mensaje`.
> `mensaje` es para mostrar.

### ① `crearSolicitudAdopcion` — postular

```ts
crearSolicitudAdopcion(params: { publicacionId: string; mensajeInicial?: string })
  : Promise<ResultadoWrapper<{ solicitudId: string; estado: EstadoSolicitudAdopcion }, CodigoErrorAdopcion>>
```

| código | cuándo | qué hace tu pantalla |
|---|---|---|
| `publicacion_no_disponible` | el animal ya no está publicado | sacarlo de la vidriera y decirlo |
| `solicitud_ya_viva` | ya postulaste por ese animal | **ver la nota 🔴 de abajo** |
| `mensaje_vacio` | mandaste `''` | validá antes de llamar |
| `sin_sesion` | sin sesión | al login |

```ts
const r = await crearSolicitudAdopcion({
  publicacionId: pub.publicacionId,
  mensajeInicial: texto.trim() || undefined,   // undefined, NO ''
});
if (!r.ok) {
  if (r.codigo === 'solicitud_ya_viva') return irAMisSolicitudes(); // ver nota
  return mostrar(r.mensaje);
}
router.push(`/adopcion/solicitud/${r.data.solicitudId}`);
```

> 🔴 **NOTA — NO CONFÍES EN EL JSDoc DE ESTE WRAPPER.** Dice que
> `solicitud_ya_viva` *«trae SU ID en `mensaje`»*. **Es falso, y lo medí:** el
> motor sí manda el id (`RAISE 'solicitud_ya_viva: %', v_sol`), pero
> `fallo()` mapea por prefijo y **devuelve el mensaje estático, tirando el
> uuid**. `mensaje` va a decir *«Ya postulaste por este animal.»* y nada más.
> ⇒ **Hoy no podés llevar a ESA solicitud; llevá a la lista.** La cura es de A
> (§3 de mi veredicto); cuando llegue, el id va a venir en **`detalle`**.

### ② `responderSolicitudAdopcion` — escribir en el hilo

```ts
responderSolicitudAdopcion(params: { solicitudId: string; cuerpo: string })
  : Promise<ResultadoWrapper<{ mensajeId: string; estado: EstadoSolicitudAdopcion }, CodigoErrorAdopcion>>
```

| código | cuándo |
|---|---|
| `solicitud_terminal` | el hilo está `aceptada`/`declinada` |
| `sin_acceso` | **no sos ninguna de las dos partes** |
| `cuerpo_vacio` | texto vacío |

```ts
const r = await responderSolicitudAdopcion({ solicitudId, cuerpo: texto.trim() });
if (!r.ok) return mostrar(r.mensaje);
setEstado(r.data.estado);   // 🔑 puede haber pasado a 'en_conversacion' solo
```

### ③ `cerrarSolicitudAdopcion` — aceptar o declinar

```ts
cerrarSolicitudAdopcion(params: { solicitudId: string; estadoFinal: 'aceptada' | 'declinada' })
  : Promise<ResultadoWrapper<{ estado: EstadoSolicitudAdopcion }, CodigoErrorAdopcion>>
```

| código | cuándo |
|---|---|
| `rol_no_puede` | **el solicitante intentó ACEPTAR** |
| `solicitud_terminal` | ya estaba cerrada |
| `estado_final_invalido` | mandaste otra cosa |

⚠️ **Asimetría firmada, y la superficie la tiene que respetar: sólo el
publicador ACEPTA; declinar pueden los dos.** No dibujes «Aceptar» del lado de
la familia — el motor lo rebota, pero un botón que siempre falla es peor que
uno que no está.

⚠️ **`aceptada` NO dispara el acta ni la transferencia del expediente.** Ese
arco (§5: acta → expediente → hito) vive en `traspasarMascotaAFamilia`, con su
propio fail-closed. **Aceptar no completa la adopción.**

### ④ `obtenerMisSolicitudesAdopcion()` — lado FAMILIA

```ts
obtenerMisSolicitudesAdopcion(): Promise<ResultadoWrapper<MiSolicitud[], CodigoErrorAdopcion>>
```

`MiSolicitud`: `solicitudId · publicacionId · estado · creadaEn · cerradaEn ·
mascotaId · mascotaNombre · mascotaEspecie · mascotaFotoUrl · publicadorNombre ·
mensajes[]`

### ⑤ `obtenerSolicitudesDeMisPublicaciones(soloPorRevisar = false)` — lado PUBLICADOR

`SolicitudRecibida`: igual, pero con **`solicitanteUserId` + `solicitanteNombre`**
y **sin** `publicadorNombre` — *porque el publicador es él.*

🔑 **Los mensajes VIENEN CON EL HILO** (`mensajes: MensajeDelHilo[]`). **No pidas
los mensajes aparte:** una lista de N conversaciones haría N+1 viajes, que es el
techo real del producto que S94-PERF midió.

`MensajeDelHilo`: `mensajeId · autorUserId · cuerpo · automatica · creadoEn`.

> **`autorUserId` es cómo sabés de qué lado va la burbuja.** No hay campo «mío».
> Compará contra el uid de la sesión.

### ⑥ `contarSolicitudesPorRevisar()`

```ts
contarSolicitudesPorRevisar(): Promise<ResultadoWrapper<number, CodigoErrorAdopcion>>
```

**Se cuenta en el servidor a propósito. No lo derives de `.length` de lo que
trajiste** — dependería de cuántas páginas pediste, y *un contador que miente
hacia abajo dice que no hay trabajo pendiente.* **Llega a cero** (medido: 0→1→0).

### ⑦ `obtener_solicitudes_en_silencio` — **NO es tuya**

Es el reloj de los 5 días: lector de **operación**, sin wrapper y con `sin_acceso`
para `authenticated`. **No la llames desde una pantalla.** Ver mi veredicto.

---

## §3 · LA LEY DE PRIVACIDAD — y lo que probé

| quién | qué ve |
|---|---|
| **publicador del animal solicitado** | la solicitud entera + el hilo |
| **el solicitante** | su solicitud + el hilo |
| **otro publicador del mismo refugio** que no publicó ESE animal | **nada** |
| **cualquier otro** | **nada** |

🔴 **El gate es LA PUBLICACIÓN, no el refugio** (§5: *«sólo lo ve el publicador
del ANIMAL solicitado»*). Gatear por organización ensancharía por encima de la
letra.

**Medido contra la base viva, con ROLLBACK y residuo 0** — un tercer usuario
(no admin, verificado) da **0 en las CUATRO puertas**: los dos lectores **y la
RLS de las dos tablas**, y `sin_acceso` al escribir. Los dos legítimos dan 1.

⇒ **Podés montar sin defender nada en el cliente: la RLS ya lo hace.** No
filtres por usuario en la pantalla — sería una segunda ley que puede diverger.

**Lo que NUNCA viaja en el hilo:** teléfono, email, ni contacto de ninguna de
las partes. **El canal existe para que no haga falta.** No agregues un «llamar».

---

## §4 · LA VOZ DEL FOUNDER, traducida a piezas

> *«El hilo se ve como un chat de la casa: burbujas, foto y nombre del refugio
> arriba, el animal como cabecera. El estado de la solicitud es una etiqueta de
> clase (N23), no una alarma. Cuando el refugio acepta, el hilo mismo me lleva
> al final: los avisos del animal y el acta.»*

| lo que pide | con qué dato sale | ⚠️ |
|---|---|---|
| burbujas | `mensajes[].autorUserId` vs uid de sesión | — |
| foto y nombre del refugio arriba | `publicadorNombre` **(lado familia)** | **puede ser `null`** — fallback digno |
| el animal como cabecera | `mascotaNombre` · `mascotaFotoUrl` | `mascotaFotoUrl` puede ser `null` |
| estado como **etiqueta de clase (N23)** | `estado` | **jamás rojo/alarma**, ni en `declinada` |
| «el hilo me lleva al final» | `estado === 'aceptada'` | 🔴 **el destino NO existe todavía** |

🔴 **CORREGIDO — ESTO CAMBIÓ MIENTRAS ESCRIBÍA, Y EN LA DIRECCIÓN QUE TE COSTABA
TRABAJO.** Acá decía que *«el acta no tiene texto cargado»* y que **no
prometieras ese final**. **Medido de nuevo: es falso.**

| qué | estado HOY (medido) |
|---|---|
| `adopcion_documentos` | **5 filas** — `acta_adopcion`, `condiciones_adopcion`, `terminos_refugio` |
| `acta_adopcion` v1 | **`vigente: true`**, plantilla, 5350 caracteres |
| `traspasar_mascota_a_familia` | ahora toma **`p_acta_version`**: el acta es un INSUMO, no un pendiente |
| `traspasarMascotaAFamilia` (wrapper) | **ya pasa `actaVersion`** — el camino está alineado de punta a punta |

⇒ **El final SÍ se puede montar.** A cargó los textos legales durante esta misma
sesión (`s112a_textos_legales_adopcion`, `…_acta_plantilla`,
`…_compuerta_acta_exige_vigencia`).

> ### 🔴 Y de quién fue el error, porque importa más que el dato: **yo no lo medí, lo DEDUJE del canon de S111** —*«ni una palabra de texto legal; las puertas están fail-closed y se abren solas cuando el texto se cargue»*— que era cierto al cerrar S111 y **dejó de serlo hoy**. `L-166`: *todo dato vivo se lee al momento de usarlo, jamás de un reporte anterior.* Un dato heredado del canon se lee igual que uno medido, y por eso es peor.

⚠️ **Lo que NO medí, para que no me creas de más en la otra dirección:** no
corrí el traspaso de punta a punta. Sé que el texto está y que la firma lo
acepta; **qué versión pasar y si queda algún fail-closed adentro se lo
confirmás a A.** *Corregir de más es el mismo error espejado.*

⚠️ **No hay foto del refugio en el contrato** — sólo `publicadorNombre` (texto).
Si la cabecera la necesita, **es un ensanche de lector y se lo pedís a A**;
no la saques de otro lado.

---

## §5 · LAS DOS COSAS QUE NO EXISTEN — medidas, con su control

### ① 🔴 EL ADJUNTO DE IMAGEN NO EXISTE — en ninguno de los tres lugares

| dónde miré | adopción | control positivo |
|---|---|---|
| columna de adjunto en `adopcion_mensaje` | **0** | **2** en `evento_archivo_adjunto` |
| parámetro en `responder_solicitud_adopcion` | **0** — `(p_solicitud_id uuid, p_cuerpo text)` | — |
| bucket **privado** de adopción | **0** | **8** buckets privados en la casa |

**No es un guard que frena al adoptante: es que la puerta no está construida.**
A lo decidió así y lo escribió: *«sin bucket la puerta no existe, en vez de
existir abierta»*.

> 🔴 **Y la trampa que te dejo señalizada, porque es la que yo habría pisado:**
> **existe `adopcion-fotos`, y es `public: true`.** Es la vidriera. **Si
> alguien cuelga ahí los adjuntos del hilo, las imágenes de una conversación
> privada entre dos personas quedan en un bucket público.** El día que el
> adjunto se construya, **va en bucket privado nuevo, jamás en ése.**

⇒ **No montes botón de adjuntar.** *(No pude producir el rojo «el adoptante no
adjunta» — no hay puerta que lo produzca. Reporto la ausencia, no un verde.)*

### ② 🔴 LA RESPUESTA AUTOMÁTICA AL POSTULAR NO SE INSERTA

§5 la firma. La columna `automatica` existe y **el reloj la ignora a propósito**
—*si contara como respuesta, el reloj no sonaría nunca*—, pero **hoy nadie la
produce**: no hay dónde un refugio guarde su texto.

⇒ **Después de postular, el hilo tiene tu mensaje y NADA más.** Si tu pantalla
dice *«te vamos a responder»*, dice algo que hoy no ocurre. **Diseñá el estado
`recibida` como lo que es: esperando.**

---

## §6 · LO QUE TE PIDO DE VUELTA

1. **Si algo de este contrato no alcanza para montar, decímelo con el campo que
   falta**, no con «falta info» — lo convierto en pedido de ensanche a A.
2. **No defiendas la privacidad en el cliente.** Está en la RLS y medida.
3. **Si ves el JSDoc de `solicitud_ya_viva` prometer el id: no le creas** hasta
   que A publique la cura.
