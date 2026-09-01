# S111 · C → MESA · REPORTE FINAL DE LA PISTA C

**Rama:** `pista/s111-c` — **A mergea la rama entera** (su HEAD).
**Alcance:** `apps/cliente` + `docs/loop`. **Cero `packages/`, cero `supabase/`,
cero `apps/prestador`.**

---

## ✅ CONSTRUIDO — y dónde

| qué | dónde |
|---|---|
| **`D-990` cerrada** · la familia se entera de que no se pudo recoger | `(tabs)/hogar/guarderia.tsx` |
| **El hogar sin nadie deja de ser un callejón** · su vacío gana camino | `(tabs)/hogar/index.tsx` |
| 5 claves nuevas, espejo `es`/`en` completo | `i18n/{es,en}.ts` |

**Verificado:** typecheck cliente y prestador **en 0** · `verify:diseno` **VERDE
con 62 reglas** · `verify:sin-byte-nul` verde · **typecheck con control
negativo** (una clave inexistente rompe sobre mi archivo y vuelve a verde) ·
árbol limpio.

## 📝 ESCRITO — los recorridos, antes de construir

`docs/loop/S111-C-RECORRIDOS.md`: los **tres bloques** en voz de usuario, con
sus caminos tristes. *Cuando el motor llegue, la construcción no va a tener que
inventar el QUÉ.*

## 🅿️ ESTACIONADO — una sola, con voto y números

**¿«quiero adoptar» crea la familia vacía?** (a) sí · (b) no crea nada.
**Voto: (a)** — con **(b)**, 24 superficies de `apps/cliente` que cuelgan de
`familia_id` tendrían que aprender a tolerar `null`, y **ninguna lo tolera hoy**.
Detalle en `S111-C-para-A-ESTACIONAMIENTO.md`.

## 🔴 FRENADO — todo por lo mismo, y no es de esta pista

**La vidriera pública · el portal del publicador · el arco del cliente
(solicitud, conversación, acta, transferencia, padrinazgo, donación).**

**Motivo único, medido:** **cero motor de adopción** — 0 funciones
`adopc*`/`adoptable*`/`padrinazgo*`/`refugio*` sobre **369 migraciones** con
`CREATE FUNCTION`, y 0 wrappers en `packages/api`.

⚠️ **Y las piezas de las otras pistas YA ESTÁN esperando:** `Convivencia` de B
—los tres estados, con el tercero con voz propia— y `packages/mensajeria` de D.
*Las dos existen y ninguna tiene de qué hablar todavía.* **El motor es el único
eslabón que falta para que tres bloques arranquen a la vez.**

## ⏳ LO QUE ESPERA AL FOUNDER

1. **El recorrido en aparato — nada de guardería se ejerció.** La veda de
   publish se sostiene: entrega → merge → APK de nube → su recorrido con dos
   animales de dueños distintos y los dos lados → recién ahí publish.
2. **El día de guardería lo opera el TITULAR**, no el cuidador empleado
   (gate `user_gestiona_prestador`). Decisión de producto, no defecto — y la
   razón técnica de A la cierra: *dos gates distintos en un acto único
   autorizan la mitad de una transacción.*
3. **El estacionamiento de arriba**, si quiere decidirlo él en vez de la mesa.

## 🧭 LO QUE ESTA PISTA APRENDIÓ, y sirve fuera de ella

**Una ficha que declara un hueco se mide contra el objeto antes de tomarla,
aunque la haya escrito uno mismo.** `D-990` decía *«nadie lo construyó»* y media
pieza existía desde S107-C. Era verdadera desde mi perímetro de S110 —que
excluía el lado familia— y **falsa como descripción del producto**. *Un hueco
entre dos perímetros se ve mal desde los dos lados **incluso después de
elevarlo**: quien lo eleva describe su mitad, no el hueco.*

Y su gemela chica, cobrada dos veces el mismo día: **un censo por texto lee prosa
como si fuera código.** `mascotas_count` daba 1 consumidor y **ese 1 era un
comentario que había escrito yo media hora antes.**


---

# ⏩ ACTUALIZACIÓN AL CIERRE — después de que el motor de adopción llegó

## ✅ CONSTRUIDO (se suma a lo de arriba)

**La vidriera vive.** `/adoptar` era un «próximamente honesto» de S73 y **el
motor lo volvió falso el mismo día**; se retiró en el acto que lo volvió falso,
con sus dos claves. Alcanzable desde el Hogar, medido. Un solo filtro —especie—
porque es lo único que el contrato acepta.

## 🔴 LA PUERTA SIN CUENTA: ABIERTA A MEDIAS, Y POR ESO NO SE CABLEÓ

A abrió `obtener_adoptables` a `anon` (tomó mi voto). **Pero las fotos no.**

```
bucket 'mascotas'   → public = false
única policy SELECT → "mascotas_select_dueno_o_acceso" ... TO AUTHENTICATED
```

`resolverUrlsFotos` firma con `createSignedUrl`, que necesita ese SELECT ⇒ **un
anónimo no obtiene ninguna firma y la vidriera sería una grilla de huellas
grises con nombres.**

**No se abrió la puerta, y el motivo es de producto:** §4 dice *«se presentan
vidas, no inventario»*, y una grilla de siluetas **es** inventario. *Quien llega
de una foto en Instagram y encuentra doce huellas se va peor que si nunca
hubiéramos ofrecido la puerta.* La firma de esa pantalla es la cara.

⚠️ **Y la cura obvia sería un agujero:** ese bucket tiene las fotos de **todas**
las mascotas, no sólo las publicadas. Voto una policy de `anon` **acotada a
mascotas con publicación viva** — mismo predicado que ya usa la función, para
que las dos no puedan divergir. **Está con A.**

## 🅿️ ESTACIONADO — ahora son tres

1. **Qué crea «quiero adoptar»** (voto (a), con el 24).
2. **El orden de la vidriera** — §4 pide «Llevan más tiempo esperando» y dice
   explícito que **no es antigüedad pura**. El criterio vive en el servidor o no
   vive: ordenar por `creadaEn` en la pantalla es justo lo que la letra prohíbe.
3. **El modelo de convivencia** — bloquea a B. `Convivencia` está **entregada y
   no montada**, y sigue así hasta que se firme cuántas dimensiones tiene y qué
   significa «no se sabe». *`paseo_social_ok` no sirve: es un booleano de otra
   cosa y no tiene el tercer estado.*

## 🔴 FRENADO — el portal del publicador y el arco del cliente

Medido con control (766 `CREATE FUNCTION`): **cero funciones de solicitud,
padrinazgo o donación**. El Home del publicador es *«una sola cosa cuenta: las
solicitudes por revisar»* — **sin ese motor, su Home es la pantalla vacía de lo
que le da sentido**, y las otras dos tabs no hacen un «tercer eje» solas.
**No se construyó a medias.**

## 🧭 Y UNA MÁS QUE APRENDIÓ ESTA PISTA, cobrada en carne propia

**Afirmé que A había mergeado con squash, y era falso.** Su medición lo desarmó
en dos comandos. **La corregí a la vista, tachada y con su causa real.**

*Lo que la hizo barata de corregir —y esto es de A— es que declaré el
MECANISMO que suponía, no sólo el resultado.* Si hubiera escrito «el control
falla» sin decir «por squash», **nadie habría podido medirlo**: una afirmación
sin mecanismo no se puede falsar, sólo creer.

**Y su gemela del mismo día, del lado del instrumento:** censé policies de
storage con un regex que exigía el nombre sin comillas y me dio **9 sobre todo
el repo**. El número era absurdo y el control lo delató: **son 330.** *Un censo
por patrón acota, no cierra* — y lo que lo salvó fue mirar si el total tenía
sentido, no el patrón.
