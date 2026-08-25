# S105-D · DISEÑO — matar un intento vencido

> **Diseño, no construcción.** Pedido del founder: *«¿qué se necesitaría del
> lado nuestro, suponiendo que el proveedor SÍ dé un mecanismo de anulación?
> Quiero saber el tamaño antes de decidir si entra en esta mesa.»*
> **Supuesto declarado, y todo esto cuelga de él:** que DeUna dé una anulación
> **por transacción**. **Si su anulación es por punto de venta, este diseño no
> sirve y hay que rehacerlo entero** — es la pregunta 3 que está con el founder.
> **Medido contra el objeto** el 24-ago-2026: base del proyecto
> `zyltipqscdsdsxnjclhp`, `main` en `2fc15bb5`.

---

## 1 · LA BUENA NOTICIA: EL VOCABULARIO YA EXISTE

```
pagos_intentos_estado_check → 'iniciado' · 'pendiente' · 'aprobado' ·
                              'rechazado' · 'expirado' · 'reversado' ·
                              'reverso_fallido'
```

**`'expirado'` ya está en el CHECK.** ⇒ **cero migración de vocabulario, cero
decisión de nombre.**

⚠️ **Y su contracara, que es lo que obliga al censo:** medido, **hay CERO filas
en `'expirado'`** — el valor existe y **nunca se usó**. *Un estado declarado sin
productor jamás fue visto por ningún lector, así que «está en el CHECK» no
prueba que alguien sepa qué hacer con él.* **Es la ley de S101 en su forma
literal: agregar un valor obliga a censar TODOS los consumidores, porque el que
no lo conoce no falla — lo ignora.**

## 2 · EL CENSO DE LECTORES — once funciones, y una sola muerde

Se censó toda función de la base que menciona `pagos_intentos`, línea por línea
donde aparece `estado`.

**🟢 CERO lectores negativos.** Ninguno usa `NOT IN` ni `<>` sobre
`pagos_intentos.estado` ⇒ **`'expirado'` no se cuela en ningún conjunto por
omisión.** *Ése era el riesgo caro y no está.*

| lector | cómo lee | efecto de `'expirado'` |
|---|---|---|
| **`verificar_compuertas_pre_cobro`** | `estado IN ('iniciado','pendiente')` | ✅ **queda afuera — ES LA CURA** |
| `verificar_compuertas_recurrencia` | idem | ✅ igual, y correcto |
| `crear_pedido_de_recurrencia_cobrada` · `planes_vencidos_pendientes` · `recurrencias_vencidas_pendientes` · `renovar_plan_cobrado` | `estado = 'aprobado'` | ✅ indiferentes |
| `confirmar_pago_pedido` | **escribe** `'aprobado'` | ✅ indiferente |
| `pagos_pendientes_de_conciliar` · `confirmar_pago_compra` · `resolver_consulta_activa` | leen el estado de **`compras`**, no del intento | ✅ no aplican |
| 🔴 **`aplicar_evento_de_pago`** | **`i.estado IN ('iniciado','pendiente','aprobado')`** | 🔴 **queda afuera — y eso es el defecto** |

## 3 · 🔴 LA RESTRICCIÓN QUE DEFINE EL DISEÑO

> ### Marcar un intento `'expirado'` sin tocar el actuador **reproduce D-912 exactamente**: el actuador dejaría de aplicar ese pago, sin error y sin log.

**El escenario, y no es raro:** la persona tiene el código viejo **ya tecleado
en su app Deuna**. El código venció **de nuestro lado**; del lado del proveedor
la transacción sigue `PENDING` y **se puede pagar**. Paga. El webhook llega. El
actuador busca su intento, lo encuentra en `'expirado'`, **no está en su lista,
y no hace nada.**

**Plata cobrada que la casa no registra** — el mismo daño de `D-912`, por otra
puerta y con la misma firma: sin síntoma.

⇒ **De acá salen las dos leyes de este diseño, y ninguna es opcional:**

**LEY ①  ·  Primero se ANULA con el proveedor; recién si el proveedor confirma
la anulación se marca `'expirado'`.** *Expirar es dejar de escuchar, y no se
puede dejar de escuchar por un código que todavía alguien puede pagar.* **Si la
anulación falla, el intento NO se expira** — fail-closed: *un cliente trabado se
queja; una plata perdida no avisa.*

**LEY ②  ·  Aun anulado, el actuador tiene que seguir aceptando `'expirado'`.**
Entre que pedimos la anulación y el proveedor la ejecuta hay una carrera, y la
persona puede pagar en el medio. **Un pago que llega tarde sobre un intento
expirado es un pago igual.**

## 4 · LAS PIEZAS, CON SU TAMAÑO Y SU DUEÑO

| # | pieza | tamaño | dueño |
|---|---|---|---|
| ① | **`aplicar_evento_de_pago` acepta `'expirado'`** en su lista | **una línea** + cinturón con su rojo producido | **A** (DB) |
| ② | **La puerta anula-y-expira antes de crear el nuevo**: si hay intento `pendiente` con `codigo_expira_en` pasado → anular con DeUna → si confirma, marcar `'expirado'` → seguir | **el grueso**: ~40-60 líneas en `pagos-deuna-solicitud`, con su camino de fallo | **D** |
| ③ | **El barrido sigue mirando los `'expirado'` recientes** — hoy solo levanta `pendiente` | chico, pero **es la red de la LEY ②** | **D** |
| ④ | **La voz del rebote cuando la anulación falla** | **decisión de letra + código nuevo en el contrato con C** | **mesa → C** |
| ⑤ | Vocabulario de estado | **CERO** — ya existe | — |
| ⑥ | Migración de CHECK | **CERO** | — |

### El detalle de ④, porque es el que no es de código

**Hoy el cliente recibe `pago_en_proceso`, que es falso.** Con la cura aplicada
sigue siendo falso en el caso de anulación fallida: no hay un pago en proceso,
hay un código que no se pudo matar. **Hace falta un código propio** —
`codigo_vencido_no_anulable` o el que la mesa firme — y su voz. *Sin eso, la
cura arregla el camino feliz y **deja la mentira intacta en el camino triste**,
que es donde el cliente ya está frustrado.*

## 5 · EL TAMAÑO, EN UNA LÍNEA

**Chico en la base (una línea y su cinturón), mediano en la puerta (el grueso
del trabajo, con su camino de fallo), y una decisión de letra que no es de
código.** Nada de esto es una migración estructural: **el modelo ya previó este
estado y solo le faltó el productor.**

⚠️ **Pero NO entra en esta mesa mientras la pregunta 3 no tenga respuesta**, y
la razón no es de esfuerzo: **si la anulación de DeUna resulta ser por punto de
venta y no por transacción, la LEY ① es inaplicable** y el diseño entero cambia
de forma. *Construir ② antes de esa respuesta es construir sobre un supuesto del
proveedor — exactamente lo que la v1.1 de `LETRA_DEUNA` hizo y esta casa pasó
una sesión corrigiendo.*

## 6 · LO QUE SE PUEDE HACER YA, SIN LA RESPUESTA

**① no depende del proveedor.** `aplicar_evento_de_pago` aceptando `'expirado'`
es correcto **hoy**, tenga o no anulación DeUna: hace que un pago tardío sobre
un intento expirado se aplique en vez de ignorarse. **Es una línea que cierra un
agujero que ya existe** —cualquier futuro productor de `'expirado'`, de este
riel o de otro, lo destaparía— **y no habilita nada por sí sola**, porque hoy
nadie produce ese estado.

*Es la forma barata de esta casa: **dejar el motor listo y la puerta cerrada**,
como el cron del recurrente que nace inerte.* **Dueño A; esta pista no lo toca.**
