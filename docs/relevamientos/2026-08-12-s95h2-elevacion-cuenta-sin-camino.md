# S95-H2 · ELEVACIÓN — la cuenta del vendedor no tiene cómo activarse

> **12 ago 2026 · Pista H (continuación).** Territorio:
> `tools/carga-catalogo` · `docs/relevamientos`. **Cero migraciones.**
>
> **Qué pasó, en una línea:** las tres puertas que la Pista G construyó
> funcionan, pero **la cadena sigue rota un eslabón más arriba** — y esta vez
> el eslabón lo rompió la propia cura de G. Se frena y se eleva, como la vez
> pasada.

---

## 1. 🔴 EL CALLEJÓN, MEDIDO ANTES DE CHOCAR

El brief pedía medir la cuarta puerta antes de estrellarse contra ella. Se
midió, y el resultado es peor que «te va a frenar»: **no hay salida.**

| Paso | Qué exige | Medido |
|---|---|---|
| ① Crear la cuenta | `crear_cuenta_comercial_inicial()` | Nace en **`pendiente_validacion`** — el cuerpo lo dice y no menciona `activa` |
| ② Otorgar el rol | `otorgar_rol_vendedor()` | 🔴 **Rechaza si la cuenta no está `activa`** (`cuenta_no_activa`) |
| ③ Activar la cuenta | *¿qué función?* | 🔴 **NINGUNA**, salvo una que no aplica — ver abajo |

**La única función de toda la base que pone `cuentas_comerciales.estado =
'activa'` es `activar_prestador(p_prestador_id, p_veredicto, p_motivo)`**, y su
cuerpo —leído, no supuesto— exige:

```
IF NOT EXISTS (… prestador_documentos d
               WHERE d.prestador_id = p_prestador_id
                 AND d.tipo IN ('titulo_profesional','registro_senescyt')
                 AND d.estado = 'aprobado')
  THEN RAISE 'verificacion_profesional_pendiente'
```

> 🔴 **Para activar la cuenta de un vendedor de alimento habría que darle un
> título profesional y un registro SENESCYT.** No es un rodeo incómodo: es
> **cruzar el cinturón que `MODELO_DESPENSA` §7.4 existe para sostener** —
> crear una fila en `prestadores` para alguien que no presta servicios, solo
> para que una función de servicios le active la cuenta.

### 1.1 De dónde salió el callejón, sin buscar culpables

**La cuarta puerta la agregó S95-G2, y es correcta.** Su razón está medida: el
motor exige cuenta `activa` en diecisiete funciones, entre ellas
`generar_liquidacion` —la que paga—, y sin ese filtro un pedido tomado por una
cuenta suspendida se cobra y después no se puede liquidar.

**Lo que faltó fue el otro lado.** Se cerró la puerta de venta sin verificar
que existiera un camino para activar la cuenta de un vendedor **puro**, que es
el único que este frente va a tener. *El eje de servicios ya tenía su camino
—`activar_prestador`— y por eso el hueco no se ve mirando desde ahí.*

### 1.2 Lo que hace falta, y el voto de esta pista

**Una quinta puerta**, o el ensanche de la segunda. Dos formas:

**(a) `otorgar_rol_vendedor()` activa la cuenta en el mismo acto** cuando está
en `pendiente_validacion` — **voto de esta pista.** Ya es admin-only, y el
precedente literal es `activar_prestador`, que hace exactamente eso: valida y
activa en un solo acto. *El admin que decide que alguien puede vender es el
mismo que está validando la cuenta; separarlo en dos funciones es pedirle dos
actos por una decisión.*

**(b) `activar_cuenta_comercial(p_cuenta_id, p_motivo)` aparte**, admin-only.
Más limpia conceptualmente, una puerta más que mantener.

**Lo que NO se hizo:** activar la cuenta con un `UPDATE` por CLI. Es D-762 otra
vez, y además dejaría el alta del vendedor real sin camino — que es
exactamente el problema que esta elevación viene a resolver.

---

## 2. LO QUE SÍ SE HIZO — y desbloquea la carga cuando la cuenta exista

### 2.1 🔴 Los dos CHECK nuevos: el CSV rebotaba entero

Medido **antes de correr**, como pedía el brief:

```
tallas en el CSV      : pequeno · mediano · grande
válidos               : S · M · L
momentos en el CSV    : cachorro · adulto          ← estos sí eran válidos
```

**Las seis filas habrían rebotado**, y el rebote habría llegado como
`check_violation` cruda — porque `proponer_sku_vendedor` inserta esas columnas
sin validar.

**Curado en el cargador, que es territorio de esta pista:**

- **`pequeño|mediano|grande` se TRADUCE a `S|M|L`.** No se rechaza: es la misma
  talla con otro nombre. *Hacer que el vendedor reescriba su catálogo para
  hablar nuestro idioma sería trasladarle a él un problema nuestro.*
- **`todas` → array VACÍO.** El catálogo del vendedor escribe «todas» para decir
  «sirve para cualquier talla», y en la base eso se dice con la lista vacía —que
  además es el DEFAULT—. **Meter la palabra «todas» haría que el producto no
  matchee con NINGUNA mascota y quede invisible sin que nadie sepa por qué.**
- **Lo inválido rebota ANTES de viajar, con mensaje que dice qué hacer.**
  Verificado con un discriminador:

```
↳ tallas "XL" no existe(n). Válidas: S · M · L (o pequeño/mediano/grande,
  que se traducen). Para "sirve para cualquier talla", escribí "todas" o
  dejalo vacío
↳ momento_vital "M6" no existe(n). Válidos: cachorro · joven · adulto ·
  senior. Ojo: M1…M6 son del EXPEDIENTE, no del catálogo — un producto
  declara la etapa de vida para la que sirve, no el momento del vínculo
  con la mascota
```

### 2.2 El Royal Canin salió de la semilla

Firma del founder ②, y la razón que esta pista ya había marcado: **los otros
seis declaran una PRESENCIA derivada del nombre; ése declara una AUSENCIA
apoyada en el diseño de la línea.** Son dos clases distintas de afirmación y
solo una se defiende leyendo la etiqueta.

**Quedan SEIS**, todos con `NO VERIFICADO CONTRA ENVASE`.

### 2.3 El ensayo, corrido contra la semilla corregida

```
válidos 0 · rechazados 6   (ENSAYO: no se escribió nada)
↳ falta presentacion · falta codigo_variante · falta sku_vendedor · falta precio_venta
```

**Las tallas ya no aparecen entre los motivos** — la traducción funciona. Lo
único que falta son **las cuatro columnas del vendedor**.

---

## 3. 🔴 LO QUE NO SE PUDO CARGAR, Y POR QUÉ NO SE INVENTÓ

El brief dice que `presentacion`, `peso`, `precio_venta` y `sku_vendedor` salen
del **catálogo del vendedor, que está en el PDF**.

**El PDF no está en el repo.** Se buscó: los tres únicos PDF del árbol son
certificados de S90, y no hay ninguna mención de presentaciones, pesos ni PVP de
Pro Pac o Taste of the Wild en `docs/` ni en `tools/`.

> **Sin esas cuatro columnas no hay producto publicable**, y no por prolijidad:
> `producto_variantes.presentacion` y `ofertas.precio` son NOT NULL, y **sin
> `peso_kg` el motor no puede cotizar el envío** — el producto entraría al
> catálogo y no se podría vender.
>
> El propio brief lo ordena: *«Nada de esto se inventa: sale del catálogo que
> el vendedor mandó. Si algún dato no está en el PDF, la fila no entra y lo
> decís.»* **La fila no entra y se dice.**

**Lo que hace falta:** que el PDF del vendedor llegue al repo, o que sus cuatro
columnas se peguen en el CSV. Con eso, la carga es un comando.

---

## 4. LA COBERTURA FIRMADA — escrita donde se carga

Firma del founder, y **queda acá porque los dos últimos no son Quito**:

```
Quito urbano · Cumbayá · Tumbaco · Puembo · Pifo · Tababela · Yaruquí ·
El Quinche · Checa · Conocoto · Amaguaña · Alangasí · La Merced · Píntag ·
Calderón · Llano Chico · Pomasqui · San Antonio de Pichincha · Calacalí ·
Sangolquí · San Rafael
```

> 🔴 **Sangolquí y San Rafael pertenecen al cantón Rumiñahui, no a Quito.**
> Entran por **decisión explícita del founder**, no por pertenencia
> administrativa. Quien mañana «limpie» la lista dejando solo el DMQ va a
> quitar dos zonas que el founder puso a propósito.

La lista se carga con `definir_regla_envio_vendedor(…, p_ciudades_cubiertas)`.
**El cotizador la usa como frontera**: un destino fuera rebota
`fuera_de_cobertura` **antes de mostrar precio**, y el acento no decide
—«Cumbayá» y «cumbaya» son el mismo lugar—. Las dos cosas están probadas por el
cinturón de la migración de G y por el invariante 28 del juez.

---

## 5. QUÉ NO SE PUDO MEDIR

1. **Si la cuenta de pruebas se puede activar de alguna forma que no vi.** Se
   buscó por CUERPO de función con dos patrones distintos (`UPDATE
   cuentas_comerciales` y `SET estado`); apareció una sola y no aplica.
2. **La forma real de `imagenes`.** Sigue sin poder medirse: no se cargó ningún
   producto, así que la primera carga real sigue siendo la que lo va a decir.
   El wrapper de J acepta `["url"]` y `[{"url":…}]`.
3. **El E2E con catálogo real.** Bloqueado por §1 y §3 — es el mismo pendiente
   que la elevación anterior, un eslabón más arriba.
4. **El tratamiento tributario de los seis.** `EC_IVA_0` por criterio del brief,
   sin verificar contra factura del vendedor.
5. **Si los alérgenos coinciden con el envase.** Los seis siguen marcados
   `NO VERIFICADO CONTRA ENVASE` a propósito.
