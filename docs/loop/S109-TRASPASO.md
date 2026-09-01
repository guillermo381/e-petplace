# S109 · TRASPASO — EL COBRO REAL DE LOS SEIS SUJETOS

> **Se lee ANTES que cualquier backlog.** Escrito por S109-A, que conduce merges
> y canon — **pero las partes de B, C y D las escribieron ellas**, en el repo y
> con sus números: `S109-B` (en `docs/loop/S109-B.md`) · `docs/loop/S109-C-PARTE.md`
> · `docs/loop/S109-D-TRASPASO.md`.
> *Una decisión que llega relatada es una decisión que nadie firmó* — por eso este
> documento **cita** y no reemplaza.

---

## ① EL OBJETIVO, CUMPLIDO

**Los SEIS objetos comprables cobran de verdad**, cada uno ejercido contra
`pagos-cobro` **v33**, con id de transacción, acto 2 aplicado y comprobante que
**dice qué se compró**:

| sujeto | tx | comprobante |
|---|---|---|
| cita | `DF-2108486` | «Baño» |
| bono guardería | `DF-2108364` | «Paquete de 5 estadías de guardería» |
| mensualidad | `DF-2108372` | «Plan mensual de guardería» |
| paquete de paseo | `DF-2108366` | «Paquete de 5 salidas de paseo» |
| programa | `DF-2108476` | «Programa de 6 sesiones» |
| plan de paseo | `DF-2108362` | «Plan mensual de paseos» |

**Cómo se supo, y esto importa más que la tabla** (S109-B): consultando
`pagos_intentos`, `webhook_events.resultado='aplicado'` y `notificacion_intencion`
**por sujeto** — *jamás por el `ok:true` de la edge, que es una señal optimista y
no un hecho.*

**Los SIETE textos de simulación en `false`: ningún cobro simula ya.** · **El
doble toque no duplica** en ninguno de los seis. · **El bloqueo permanente,
curado.** · **Todo por mascota**, con `NOT NULL` e índice, y
`mascota_no_determinada` **muerta con su fallback**.

**Publicado:** cliente **`0ba9b6cb`** · prestador **`9a1d408d`** — los dos
**runtime 1.0.7**, **mismo ancla `27e47b5b`**, leídos del objeto.

---

## ② LAS FIRMAS DEL FOUNDER — no se vuelven a decidir

1. **El link mensual de DeUna es NUESTRO** — una ruta de la app a la pantalla del
   código de 6 dígitos. **Exige sesión.** **Vence el CÓDIGO, no el link.**
2. **Si no se paga, el plan NO renueva y queda REACTIVABLE — con ancla NUEVA**,
   el día que la familia vuelve. *Fuera del período pagado es contratar de nuevo.*
3. **TODO se contrata POR MASCOTA**, con su excepción: **lo que es por mascota es
   el USO, no el SALDO.** El bono es del hogar. **Pedidos de despensa quedan
   afuera.** *Medido: 3 mascotas distintas ya consumieron días del mismo bono.*
4. **La mensualidad de guardería es por mascota.**
5. **Adiestramiento es sólo para perros.**
6. **Primero el QUIÉN, después el QUÉ** — la lista muestra prestadores con sus
   ofertas; **el paso del QUÉ murió**.
7. **Guardería entra al HOY del prestador como QUINTO OFICIO**, no como franja.

### 🔴 ⑧ LA OCTAVA NO ENTRA COMO SE DICTÓ — el objeto la contradice

Se dictó como *«recurrente sólo por tarjeta; DeUna en compras sueltas»*.
**Medido en `SujetoDeuna`: `compra · cita · bono · mensualidad · programa`.**
**`mensualidad` está —y es recurrente— y `plan` no está.**

⇒ **Lo que el objeto sostiene: DeUna alcanza a la mensualidad de guardería
(recurrente) y NO alcanza al plan de paseo — y la razón NO es la categoría, es el
SUJETO.**

⚠️ **Y la distinción no es cosmética** (hallazgo de S109-C): escribirla como
categoría **reintroduce el defecto que esta sesión enterró.** El apagado de DeUna
en el plan es **por sujeto** (`deunaCobraEsteSujeto`); *«recurrente sólo por
tarjeta» volvería a justificar por categoría un apagado que es por sujeto* —
exactamente la condición `!recurrente` que se mató, con la razón del propio
founder: **la mensualidad también es recurrente y SÍ se paga por DeUna.**

**QUEDA ESPERANDO LA PALABRA DEL FOUNDER.** *No se escribe de ninguna de las dos
formas en el canon hasta que él elija: dos letras firmadas que se contradicen son
peores que una equivocada.*

---

## ③ EL ESTADO REAL, SIN REDONDEAR

🔴 **CORRECCIÓN DE UN NÚMERO QUE ESTA PISTA REPORTÓ MAL, medida por S109-B y
re-verificada contra el objeto:** *«DeUna nunca corrió (`por_deuna = 0`)»* **es
FALSO.**

```
intentos deuna  12   ·  aprobados 1  ·  $75,86  ·  25-ago  (la compra de Carlos, ya en el canon de S105)
```

**Lo que SÍ nunca corrió, y es más preciso:**
· **el LINK MENSUAL** — `cobro_link_mensual` **0 filas**, `pagos_intentos` con
  `forma='redireccion'` **0**. *Ése es el camino que llegaría a producción sin
  haberse ejercido nunca.*
· **el LAZO RECURRENTE** — `app_config.recurrente_vivo` **no existe como fila** ⇒
  nunca corrió. Construido, desplegado (`pagos-cobro-recurrente` v16) e **inerte
  por diseño**: la llave es del founder.

🔴 **`guarderia_recurrente_vivo` sigue en `false`.** (`pagos_actuador_vivo=true`
es preexistente.)

🔴 **NADA DE LA SUPERFICIE SE VERIFICÓ EN APARATO.** Literal de S109-C:
**ninguna, cero** — todo por typecheck, lectura del motor y gates.
**Y la distinción que hace exacto el renglón es suya:** *«B ejerció el MOTOR de
los seis sujetos con id y comprobante. Que el plan haya cobrado por `DF-2108362`
prueba que el motor cobra; **no prueba que el checkout lo llame bien, ni que la
espera pinte, ni que el rebote se lea**.»*

🔴 **Y LO QUE CIERRA EL CÍRCULO, medido por S109-D: las builds 1.0.7 EXISTEN y NO
LLEVAN NADA DE ESTA SESIÓN.** Ancla `28daa703` (01-sep 02:34), anterior a los dos
OTAs. ⚠️ **Y hay un par ANTERIOR también `1.0.7 FINISHED`, ancla `8b5def5c`, que
salió con la key MUERTA**: *dos builds con el mismo número de versión y distinto
comportamiento de mapas — quien instale «la 1.0.7» sin mirar el ancla puede estar
instalando la que no tiene mapas.* **Las buenas son las de `28daa703`.**

🔴 **Y `28daa703` es de las 21:06: NINGUNO de los ocho commits de S109-D está
adentro** —verificado uno por uno con `merge-base --is-ancestor`—. **Esas APK
llevan la cura de la KEY, no las curas del DÍA.** *Un gate sobre ellas mediría el
binario correcto y el código de ayer* — `L-138` con una vuelta más. **Lo que las
pone al día es el OTA, y está publicado.**

⚠️ **Y las tres entradas de la key en la consola de Google NO están medidas: el
founder dijo que las cargó y nadie lo verificó contra el objeto.** *Su palabra y
una medición no son lo mismo, y en el canon se distinguen.*

> ⇒ **El estado honesto: el motor cobra, la superficie está escrita y tipada, los
> OTAs están publicados — y nadie lo tocó con un dedo todavía.**

### 🔴 LA TRAMPA DE GATE QUE HAY QUE SABER ANTES DE MIRAR EL TELÉFONO

**Los binarios de prueba del founder no tienen `geo.API_KEY`**, así que en su
teléfono **el guard de `MapaPunto` cae y la sección se ve exactamente como
antes**.

> ⚠️ **Ver la sección igual que ayer NO prueba que la pieza esté mal: prueba que
> el guard funciona.** Quien la gatee necesita un binario **con la key**, o no
> está midiendo la pieza. *(S109-D)*

---

## ④ LO QUE ABRE S110, CON DUEÑO

**🔴 EL DURANTE DE GUARDERÍA — el objetivo.** 95 estadías vivas, **todas en
`reservada`**, seis de los siete estados del CHECK **inalcanzables**. Faltan tres
piezas: **el escritor de transición · la puerta del acta del lado prestador · el
wrapper de tramo.** *(medición de S109-D — ver su traspaso)*

**🔴 LOS 37 INTENTOS FUERA DEL BARRIDO · USD 1.490,39.** `aprobado` con el sujeto
sin mover: **plata tomada, nada entregado.** El barrido cubre **6**; el hueco es
**seis veces lo cubierto** y hasta esta sesión **no se veía**. Ya existe
`pagos_aprobados_sin_sujeto_movido()` y `pagos_conciliacion_cobertura()` da las
dos cifras juntas. **Falta quién lo mira y cuándo. HOY son pruebas; el 30-sep son
PLATA.**

**🔴 LA ESPECIE NO SE VALIDA EN LA MENSUALIDAD** *(S109-B, con evidencia viva)*:
`contratar_mensualidad_guarderia` **no llama a `_mascota_elegible_servicio`** — el
plan `20d025ca` **es de Pepe, un AVE**, y guardería es `["perro","gato"]`. *Lo
firmó un arnés y nada lo frenó.* **Disparo: antes de abrir guardería a familias
reales.** La regla correcta: *toda puerta que RECIBE una mascota la aplica*
—`comprar_paquete_salidas` no recibe mascota y no califica—.

**🔴 LA PUERTA DEL PROGRAMA OFRECE FECHAS QUE SU COMPUERTA RECHAZA** *(S109-B)*:
`contratar_programa` computa `vigencia_hasta` y **no rechaza**; el freno vive al
pagar. **Cero lectores de fechas válidas.** *Un guard que sólo contesta después de
que la familia eligió no es una validación: es una corrección.* Falta **un lector
de motor** con la MISMA regla que la compuerta — *una regla duplicada por copia se
cura dos veces o no se cura* — y después el filtro de pantalla.

**DeUna y el slot con Carlos** · **el plan de paseo por DeUna**: no son dos
líneas, la edge tiene **0 ocurrencias** de `suscripcion_servicio_id` en su pata
DeUna. **Dueño compartido B+C; las dos piezas juntas o se emite un sujeto sin
destino.**

**`MapaZona`: CERRADO por B** — eligió el nombre (`zonaLat`/`zonaLon`) y midió
que `FichaPrestador` **ya hablaba ese idioma desde S84 y lo traducía al llamar**:
*el rename le devolvió a la pieza el vocabulario que su consumidor ya usaba.* Dos
sitios, no un barrido. · **Adopción: las seis mediciones del §12**,
que el founder dejó fuera de S109.

**🟡 Deuda con disparo:** *el bono es del hogar y el plan es de quien lo
contrató.* **Antes de que un segundo miembro pueda contratar un plan.**
**🟡 Y su hermana:** las cuatro proyecciones de citas repiten el mismo `select`
palabra por palabra. La quinta (guardería) usa un helper extraído y **las cuatro
no se tocaron**: *el día que alguien cambie ese `select` va a tener que cambiarlo
en cuatro lugares, y ése es el día de extraerlas.*

---

## ⑤ LAS LECCIONES — un solo hilo

Están en canon: **`L-445` → `L-460`**. No se repiten acá. **El hilo que las une es
uno:**

> # UN INSTRUMENTO QUE NO PUEDE PRODUCIR SU ROJO NO ESTÁ MIDIENDO.

**Seis veces, sobre las cuatro pistas, el mismo día:**

| el instrumento | por qué su verde no valía |
|---|---|
| el `grep` sin `--include` | filtraba el CONTENIDO y no la ruta |
| el censo por `import` | seis consumidores no son seis pantallas vivas |
| el guard de huellas | la ruta hardcodeada: verde **por ausencia** |
| `strings` sobre acentos | parte el token en el multibyte |
| el discriminador tautológico | su respuesta ya venía en cómo se obtuvo la entrada |
| el control mutante | mutaba de más y no cazaba la lápida |

**Y la que las corona, `L-459`:**
> **La primera prueba de un guard nuevo no es que dé VERDE: es que dé ROJO sobre
> el primer caso real que aparezca.** *Su fixture lo escribió el mismo que lo
> escribió a él, y comparte sus supuestos.*

**Su correctivo, ya mecanizado en parte:** *contar «no aplica» como verde fue el
bug de nacimiento.* **Censo: 140 gates · 29 declaran lo no medido (20 %) · 111
no.** Y el número que decide **no es el 111: son los que corren en el hook** —
*los 111 corren cuando alguien los llama; los del hook corren en cada commit y su
silencio se lee como salud cada vez.* **Los tres del hook ya lo declaran**
(`verify:frenos` por A; los dos censos de B, curados por B).

### El hilo de las cuatro de S109-D: **cosas CORRECTAS que no frenan**
`L-456` un mapa cerrado que **no falla: omite** · `L-457` una **lápida bien
escrita** que un gate lee como prueba de vida · `L-458` **dos props correctas que
se anulan** y dejan una franja que se lee como diseño · `L-460` **una prop que se
acepta y se ignora**, y por eso la llamada se lee cableada.

> **Ninguna produce un error. Las cuatro producen una lectura tranquila de algo
> que no está pasando** — y por eso **ninguna la encontró un gate**: tres las
> encontró el founder mirando la pantalla, y una la encontró un pliegue.

### La otra clase, que S109-B separó y por eso es útil
> **Un `ELSE` SOBRA y se ve mirando ramas; un campo FALTA y no hay rama que
> mirar.** Cuatro veces la primera; **tres la segunda** (`iva`, `base`,
> `suscripcion_periodo`). *Y la peor fue el período, porque **la base SÍ lo exigía
> por constraint**: no faltó la regla, faltó leerla antes de escribir la rama.*

### Y lo que las tres pistas registraron sobre sí mismas
**La misma clase se cobró TRES veces en un día —A, B y C— y siempre igual: medir
la propia rama y llamarlo «el estado».** Ninguna se resolvió discutiendo: **las
tres las resolvió el objeto.**
> *No hace falta desconfiar del otro para medir: alcanza con que dos lecturas no
> coincidan y preguntarle al objeto cuál es cuál.*

⚠️ **Y el corolario incómodo: las tres veces, quien cayó acababa de citarle esa
misma lección a otro.** *Una lección no protege a quien la enuncia — sólo a quien
la ejecuta sobre su propio trabajo.*
