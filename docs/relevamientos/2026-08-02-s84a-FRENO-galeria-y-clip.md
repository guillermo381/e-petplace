# S84-A2 · LA GALERÍA Y EL CLIP — FRENO CON NÚMEROS

> **Estado: NADA ESCRITO.** La orden puso el freno en dos condiciones —
> *"si el bucket exige política nueva o el pipeline no se extiende sin
> reescribirlo"*— y **se cumplen las dos**. Este documento las trae medidas.
>
> Todo lo de acá salió de una query contra la DB viva o de leer el archivo.
> **Donde no hay medición, se declara el hueco en vez de completarlo.**

---

## 1 · EL FRENO DEL BUCKET — `avatars` es el único bucket de imagen que no sabe borrar

Censo de policies de `storage.objects`, por bucket y comando:

| bucket | comandos con policy | DELETE |
|---|---|---|
| `adiestramiento-clips` | DELETE · INSERT · SELECT | ✅ |
| `adopcion-fotos` | DELETE · INSERT | ✅ |
| `cita-archivos` | DELETE · INSERT · SELECT · UPDATE | ✅ |
| `grooming-archivos` | DELETE · INSERT · SELECT | ✅ |
| `mascotas` | DELETE · INSERT · SELECT | ✅ |
| `productos-fotos` | DELETE · INSERT · SELECT | ✅ |
| **`avatars`** | **INSERT · SELECT · UPDATE** | **❌ NO** |
| `prestador-documentos` | ALL · SELECT | ❌ (cubierto por ALL) |

**Seis de ocho tienen DELETE. El que la galería usaría, no.** La orden pide
*"múltiples + orden + **borrado**"*: **el borrado no es implementable hoy sin
policy nueva.** Freno ①, cumplido literalmente.

### 1bis · Y hay algo peor que la ausencia — el INSERT no valida carpeta

Las tres policies vivas de `avatars`, literales:

```
INSERT  "Avatar upload"  WITH CHECK (bucket_id='avatars' AND auth.role()='authenticated')
SELECT  "Avatar read"    USING      (bucket_id='avatars')
UPDATE  "Avatar update"  USING      (bucket_id='avatars' AND auth.uid()::text = (storage.foldername(name))[1])
```

**El UPDATE valida carpeta propia. El INSERT no.** Cualquier usuario autenticado
puede **crear** objetos en la carpeta de cualquier otro.

**Con UN logo por prestador eso era un daño acotado y visible** — te pisan el
logo, se nota, se vuelve a subir. **Con una galería de N fotos deja de serlo:**
un tercero puede **inyectar fotos en la vitrina pública de otro negocio**, y la
vitrina es justamente la superficie que el cliente mira para decidir. **La
feature nueva convierte un agujero tolerable en uno que no lo es.**

*No es un hallazgo aislado: es la clase de D-556 (buckets públicos heredados con
policies laxas). Lo que cambia es que ahora tiene consecuencia de producto.*

### 1ter · El bucket tampoco tiene techo propio

```
avatars → file_size_limit: NULL · allowed_mime_types: NULL · public: true
```

**Sin límite de tamaño y sin lista de mime, a nivel bucket.** Todo el control
vive en el cliente (`MAX_BYTES = 5MB` y los magic numbers de `subir-logo.ts`).
Un cliente modificado —o un token en otras manos— sube lo que quiera, del tamaño
que quiera.

Comparar con los que sí se cuidan: `mascotas` (5 MB + 3 mime),
`grooming-archivos` (10 MB + 5 mime), `adiestramiento-clips` (50 MB).
**`avatars` es de los dos únicos con ambos campos en NULL.**

Para fotos eso ya era flojo. **Para el CLIP —un video— es otra cosa**: sin techo
de bucket, el único freno a un archivo de 1 GB es una constante de JavaScript.

---

## 2 · EL FRENO DEL PIPELINE — no se extiende, y el motivo no es el tamaño

`subir-logo.ts` está **bien hecho** para lo suyo: dos pasos con huérfano
recuperable, lectura por la frontera de `packages/ui` (L-137), formato detectado
por **magic numbers** y no por extensión, causa literal en el log + tipada para
la voz. **Nada de eso se tira: es el molde.**

Lo que no se extiende es su **forma**, en tres puntos concretos:

**① El paso 2 está soldado a la columna.** Termina en
`actualizarPerfilPrestador({ foto_url: path })`. Para la galería el paso 2 es un
`INSERT INTO prestador_fotos`. No es un parámetro: es otro destino.

**② `quitarLogoNegocio` NO borra bytes** — y lo declara en su propio comentario:
*"El objeto viejo queda en el bucket (huérfano conocido, clase D-303 — jamás se
borra identidad por las dudas)."*

> **La consecuencia que esto tiene sobre el tope, y es el punto fino de todo
> este documento: un tope de fotos en la TABLA no es un tope de
> ALMACENAMIENTO.** Si borrar solo quita la fila, un prestador que sube 6 fotos,
> las borra y sube 6 nuevas deja **12 objetos** en el bucket. Repetido, no tiene
> techo. **El tope que la orden pide sería una promesa que el bucket no cumple.**

**③ El único que sabe de orden es nadie.** No hay pieza que reordene, ni que
mueva, ni que devuelva "la primera". Es lógica nueva, no una prop.

**Diagnóstico honesto:** no hay que reescribirlo **por malo** — hay que
**extraer su mitad buena** (leer → validar formato → subir con nombre único →
causa tipada) a una frontera reusable, y que logo y galería sean **dos
consumidores** de esa frontera con paso 2 distinto. *Es exactamente lo que la
casa hizo con `leerBytes`/`leerBase64` en S61-B10.* Eso es trabajo real, y es la
segunda condición de freno cumplida.

---

## 3 · EL TOPE DE FOTOS — lo que sí está medido y lo que no

**Medido (`storage.objects`, peso real de lo que la casa ya guarda):**

| bucket | objetos | promedio | el más grande |
|---|---|---|---|
| `avatars` | 10 | **131 kB** | **327 kB** |
| `mascotas` | 14 | 100 kB | 240 kB |
| `adiestramiento-clips` | 1 | **6.7 MB** | 6.7 MB |

**La propuesta, con su aritmética a la vista: 6 fotos.**
A peor caso real (327 kB), **6 × 327 kB ≈ 1.9 MB** por vitrina. Es una carga de
pantalla que la casa ya sabe pagar; a 10 fotos serían **3.3 MB**, y D-497 ya
midió que este producto es sensible al peso de arranque.

> **⚠️ LO QUE NO ESTÁ MEDIDO, Y NO LO VOY A COMPLETAR: cuántas fotos quiere un
> negocio real.** No hay un solo prestador real con galería — **no existe el dato
> y no se puede inferir del peso de los archivos.** El 6 de arriba está fundado
> en lo que el pipeline aguanta, **no en lo que el oficio necesita**, y son dos
> preguntas distintas. Si el founder tiene la referencia de Fluvi/Kaxo, esa gana
> sobre este número — la aritmética solo dice que 6 no duele.

**El clip, en cambio, sí tiene respaldo:** los **≤30 s** que la orden fija
**coinciden con el precedente vivo** de la casa (adiestramiento: techo duro
3 × 30 s, S63). Y el único clip real medido pesa **6.7 MB** — ese es el orden de
magnitud para el `file_size_limit` del bucket, no un número inventado.

**El clip no tiene casa, y es decisión:** `adiestramiento-clips` es **privado**
(`public=false`) y de otro dominio. Un clip de vitrina **pública** necesita
bucket público o URL firmada con su renovación. **No lo elijo yo.**

---

## 4 · LA TABLA — la adjudicación se sostiene, con dos precedentes que hay que nombrar

**La casa ya resolvió "galería" TRES veces, y con jsonb, no con tabla:**
`refugios.fotos_galeria`, `productos.imagenes` y **`prestadores.fotos_galeria`**.

**Y las tres están muertas:**

| columna | filas de la tabla | con datos | lectores en el repo |
|---|---|---|---|
| `refugios.fotos_galeria` | 0 | 0 | 0 |
| `productos.imagenes` | 0 | 0 | 0 |
| **`prestadores.fotos_galeria`** | **7** | **0** | **0** |

> **⚠️ EL TERCERO ES EL GRAVE, Y NO LO HABÍA CENSADO — lo midió B.**
> `prestadores.fotos_galeria` **vive en la MISMA TABLA donde va la galería
> nueva.** Los otros dos están en tablas vacías de dominios que no tocamos; éste
> está en la fila que el prestador edita todos los días, **con 7 filas reales
> detrás y cero datos adentro**.
>
> **Si `prestador_fotos` nace y esta columna sigue ahí, cualquiera que abra
> `prestadores` va a ver una columna que se llama "fotos_galeria" y no es la
> galería.** No es un duplicado lejano: es un homónimo en el mismo lugar. **La
> Ley 37 aplica: muere con la migración que crea la tabla, no "después".**
>
> *(Confirmado contra la DB al recibirlo, no citado del reporte — L-166.)*

Son esquema del legado sin un solo consumidor. **No compiten como precedente
vivo**, y por eso la adjudicación de la mesa (tabla, orden mínimo = portada) no
tiene que discutir con ellas.

**Se nombran igual, a propósito:** si nace `prestador_fotos` sin decir que
existen, la casa pasa a tener **tres** modelos de galería y el próximo que
busque va a encontrar el jsonb primero. *Dos letras que se contradicen son
peores que una equivocada* — vale igual para dos esquemas.

**Y a favor de la tabla, más allá de Fluvi:** el jsonb no tiene FK, ni RLS por
fila, ni CHECK. La orden pide **RLS desde el nacimiento** (punto 4), y sobre una
columna jsonb eso no existe: se gatea la fila entera del prestador o nada.

---

## 5 · LO QUE HACE FALTA PARA DESTRABAR — cuatro decisiones, todas de la mesa

1. **¿Bucket nuevo (`prestador-galeria`) o se cura `avatars`?**
   *Con voto:* **bucket nuevo.** Curar `avatars` significa tocar policies que
   hoy sostienen el logo del negocio, los avatares de perfil y lo que sea que el
   portal legado guarde ahí — **10 objetos vivos y consumidores que no censé**.
   Un bucket nuevo nace con techo, mime y las 4 policies correctas, **sin tocar
   nada vivo**, y deja el saneo de `avatars` como su propia ficha.
2. **El INSERT por carpeta propia** — en el bucket nuevo es gratis; en `avatars`
   es una policy que hay que reemplazar en caliente.
3. **Dónde vive el clip** (público vs firmado) y con qué techo.
4. **El tope**: si el 6 medido vale, o si manda la referencia de Fluvi/Kaxo.

**Lo que NO necesita decisión y puedo hacer apenas se destrabe:** la tabla con su
RLS, el orden mínimo como portada, la frontera extraída del pipeline, y el
borrado que borra bytes de verdad.

---

## 6 · EL COSTO DE D-615, que la orden pidió medir y no ejecutar

**La cura obvia —cablear `get_paises_para_telefono()` y matar el array— tiene un
costo que no es de líneas.**

En líneas es chico: un wrapper de ~40 (molde exacto de `paises.ts`), borrar 25
del array, y una carga en la pantalla.

**El costo real es un modo de falla nuevo.** Hoy `PAISES` es una **constante
síncrona**: está disponible en el primer render y **no puede fallar**. Con RPC,
el selector de país pasa a depender de la red **en el camino de escritura del
perfil** — y si esa lectura falla, el usuario **no puede elegir prefijo y no
puede guardar su teléfono**. Hoy eso es imposible.

**Y la trampa de la cura:** lo que uno pone para taparlo —un fallback de países
embebido— **es el array otra vez**, ahora con la desventaja de estar en dos
lugares y de que nadie sepa cuál se está usando.

**Por eso hay una salida más barata, y la propia ficha ya la contempla: dejar el
array y mecanizar la comparación.** Un `verify-paises.mjs` en el lint que
extraiga las 23 filas del código y las diffee contra `cat_paises` — **es lo que
hice a mano hoy, y dio idénticas byte a byte**. Cierra el silencio (que es el
problema real de D-615: no que estén mal, sino que nadie las compare) **sin
meter red en el camino de guardado**, y cuesta ~50 líneas de script.

**Costo comparado, para que la mesa elija con el número:**

| | líneas | riesgo nuevo | qué cierra |
|---|---|---|---|
| **(a)** cablear la RPC, matar el array | ~65 | **dependencia de red en el guardado del perfil** | la duplicación entera |
| **(b)** guard que compara las dos fuentes | ~50 | ninguno | **el silencio** — que es el daño real |

*Mi voto es (b) por ahora y (a) el día que la pantalla ya cargue algo de red en
ese paso* — porque entonces el modo de falla ya existe y la RPC no agrega uno.
**Pero es voto, no medición: la decisión es de la mesa.**
