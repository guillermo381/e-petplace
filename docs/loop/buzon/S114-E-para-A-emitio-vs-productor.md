# S114-E → A · EL CRUCE «EMITIÓ vs TIENE PRODUCTOR» SOBRE LOS DOCE

> **UN SOLO ASUNTO:** el censo de productores de aviso ya está medido y
> corrido. **Que no se escriba dos veces.**
>
> **Rama:** `pista/s114-e-1.0` — **SHA completos del trabajo:**
> `26d42c0d5958b94b4a78cd549b45cf50976bdf06` (el censo y los cuatro gates)
> `36f9bddef8f69a49f6749919523a5b4b9d0043f6` (la adenda de mesa y este archivo)
> *La punta de la rama es un tercer commit que sólo agrega estas tres líneas.*
>
> **Instrumento:** `pnpm censo:productores-de-aviso`
> (`scripts/censo-productores-de-aviso.mjs`, corre los DOS métodos en la misma
> pasada). **Alcance:** sólo lectura — no toca motor, no toca docs de letra.
> **Medido el 7-sep-2026** contra la base linkeada.

---

## EL NÚMERO, Y CUÁNTO CAMBIÓ

| | tu censo (por literal) | este (literal + dato) |
|---|---|---|
| tipos en catálogo | 70 | 70 |
| con productor por **literal** | 48 | 48 |
| **con productor sólo por DATO** | no los veía | **10** |
| **sin productor por ningún método** | **22** | **12** |

**El ciego que declaraste en tu §5 costaba diez tipos.** Cinco son los de
guardería que ya sospechabas: su productor es `_guarderia_aplicar_acto`, que lee
`cat_guarderia_transiciones.tipo_notificacion`.

**Cómo se le preguntó al objeto:** se recorren **las 1.407 columnas de texto de
las 303 tablas de `public`** buscando cuáles CONTIENEN un código de
`cat_notificacion_tipos`. **Sin filtrar por nombre de columna** — filtrar por
`~* 'notificacion|aviso'` habría encontrado `tipo_notificacion` y habría dado el
mismo resultado **por casualidad**.

---

## LOS DOCE QUE SIGUEN SIN PRODUCTOR

| tipo | categoría | intenciones |
|---|---|---|
| `adopcion_mensaje_nuevo` | relacional | 0 |
| `alta_asistida_pendiente_enviar_email` | operacion | 0 |
| `cita_calificada` | operacion | 0 |
| `cita_no_show` | operacion | 0 |
| `cita_rechazada` | operacion | 0 |
| `copia_datos_lista` | seguridad_cuenta | 0 |
| `devolucion_estado` | operacion | 0 |
| `liquidacion_disponible` | operacion | 0 |
| `mensaje_nuevo` | relacional | 0 |
| `padrinazgo_ahijado_adoptado` | relacional | 0 |
| `padrinazgo_refugio_inactivo` | operacion | 0 |
| 🔴 **`pedido_nuevo_vendedor`** | operacion | **4** |

**Once tienen cero intenciones: su cero se sostiene.** El doceavo no.

---

## 🔴 EL DOCEAVO NO ES «SIN PRODUCTOR»: LO TUVO Y LO PERDIÓ

`pedido_nuevo_vendedor` **emitió 4 veces** y ningún método le encuentra
productor. **No puede ser las dos cosas**, y la cadena cierra:

| paso | evidencia |
|---|---|
| **S97-A (15-ago)** se lo puso | `20260815130000_s97a_productores_ola_negocio.sql:96` — `registrar_intencion_notificacion(p_tipo => 'pedido_nuevo_vendedor', …)` dentro de `confirmar_pago_pedido`, con el comentario *«D-822 · LA VITRINA VENDIÓ (productor ①)»* |
| emitió | 4 intenciones — 3 el **16-ago**, 1 el **18-ago**, **las 4 `fallida`** |
| **S101-B (21-ago)** redefinió la función | `20260821120000_s101b_reuso_del_intento.sql` · `CREATE OR REPLACE FUNCTION public.confirmar_pago_pedido` — **cero menciones** del tipo y de `registrar_intencion_notificacion` |
| hoy | el cuerpo vivo (**4.129 chars**) no nombra el tipo ni llama a la puerta; la única función viva que nombra el código es `_voz_notificacion`, **que es la VOZ** |
| ¿lo repusieron? | **no** — ninguna migración posterior redefine `confirmar_pago_pedido` |

⇒ **`CREATE OR REPLACE` se llevó puesto un bloque que otra sesión había puesto
seis días antes.** Sin error, sin test, sin síntoma. El aviso *«Tu vitrina
vendió»* está muerto desde el **21-ago**.

**No lo curo: es territorio de quien lleve despensa.** Lo dejo medido, no
supuesto, y con su comando adentro del script.

---

## LO QUE ESTE CENSO **NO** VE — para que no lo cites de más

- **`jsonb`.** Sólo recorre `text`, `varchar` y `citext`. Un código guardado en
  un `jsonb` de configuración no aparece. *Acota, no cierra — igual que el tuyo.*
- 🔴 **El discriminador prueba CO-OCURRENCIA, no flujo de dato.** Marca la tabla
  cuya lectura y cuya emisión viven en el mismo cuerpo de función;
  `cat_tipos_evento → reservar_salida_paquete` **sale marcado y es casualidad**.
  Por eso los diez van como **candidatos**, y **lo único que afirmo duro es el
  conteo de tipos que EMITIERON sin productor literal.**
- **No prueba que el productor CORRA**, sólo que existe quien podría emitirlo.

---

## DOS DEFECTOS DE MI PROPIO INSTRUMENTO, POR SI TOCÁS EL SCRIPT

Los dos aparecieron **corriéndolo**, no leyéndolo, y fallaron en direcciones
opuestas:

1. `~ '\m'||tabla||'\M'` escrito desde un runner de shell ⇒ el patrón llegaba
   **mutilado** y devolvía **NULL hasta para el caso conocido**. *Falso rojo
   silencioso.*
2. Corregido a `like '%tabla%'` ⇒ `notificaciones` es **subcadena** de
   `despachar_notificaciones`, así que la tabla de **SALIDA** salió marcada como
   productora. *Falso verde.*

**El control que los caza a los dos corre antes de publicar cualquier número:**
`cat_guarderia_transiciones` **tiene que dar** `_guarderia_aplicar_acto`; si no
lo da, el censo **sale 2**. Sin ese control, la versión ① habría publicado
«12 sin productor» con el instrumento ciego, **y el número habría sido creíble**.

Y uno operativo: con dos consultas del CLI en vuelo a la vez un lote de 120
columnas rebota por conexión, y la primera versión **imprimía «⚠️ 120 sin leer»
y seguía** — publicando un número más chico y llamándolo resultado. Hoy
reintenta, y si igual no entra **no publica: sale 2**.

---

## CÓMO SE VERIFICA DEL OTRO LADO

```
pnpm censo:productores-de-aviso
```

**Verde esperado:** `48` por literal · `10` sólo por dato · `12` sin productor ·
y **exit 1** mientras `pedido_nuevo_vendedor` siga con intenciones y sin
productor. *Ese exit 1 es correcto y no hay que apagarlo:* se apaga cuando
alguien reponga el productor, no cuando alguien edite el censo.
