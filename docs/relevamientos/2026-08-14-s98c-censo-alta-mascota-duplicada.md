# S98-C · CENSO — EL ALTA DE MASCOTA DUPLICADA (hallazgo del founder)

> **Estatuto: CENSO. No cura nada.** Se deposita antes de tocar una línea,
> por orden de la mesa. Todo lo de acá está medido contra el árbol y la
> base viva el 14-ago-2026, con archivo y línea; nada de memoria.

**El literal del founder:** *«El registrar mascota desde recepción no trae
las tildes con los cambios que hicimos en cliente — quiere decir que ese
componente está duplicado y no heredó los ajustes.»*

**Veredicto del censo: tenía razón, y es peor que una divergencia de
forma. Hay divergencia de DATO, en cuatro puntos, y una de ellas
contradice una letra firmada.**

---

## 1 · DÓNDE VIVE CADA UNO — y son **CUATRO** implementaciones, no dos

| | el del **cliente** | el del **mostrador** |
|---|---|---|
| ruta | `apps/cliente/src/components/alta/` (6 archivos, **1519 líneas**) | `apps/prestador/src/app/mostrador/nueva.tsx` (**270 líneas**) |
| entradas | `/onboarding/[paso]` · `/(tabs)/hogar/agregar/[paso]` | `/mostrador/nueva` |
| forma | **5 pasos** (especie · raza · historia · foto · cierre) | **1 pantalla** |
| motor | `crear_familia_con_primera_mascota` · `agregar_mascota_a_familia` | `crear_alta_asistida_pendiente` / `_existente` |

**⚠️ Y el dato que ordena todo lo demás: el lado del cliente YA RESOLVIÓ
ESTA MISMA CLASE una vez.** Su propio `tipos.ts:5-13` lo cuenta:

> *«Hasta S90 el alta eran OCHO archivos: cuatro pantallas del onboarding y
> sus cuatro calcos en `/hogar/agregar`, divergiendo 42·27·24·50 líneas
> (medido). ⇒ UNA pieza, DOS entradas.»*

**El mostrador es la TERCERA implementación, y quedó fuera de aquella
unificación.** *No es que el mostrador se haya desactualizado: nunca
estuvo en la mesa cuando se unificó.*

**Y hay una CUARTA, que se declara copia a sí misma en su cabecera:**
`/mostrador/autorizar` (el alta dentro del handshake) dice literal
*«Espejo del alta fantasma (nueva.tsx)»* (`autorizar.tsx:6`) y
*«Espejo del filtro de nueva.tsx»* (`autorizar.tsx:60`). **El propio
código nombra la duplicación** — no hacía falta encontrarla, hacía falta
leerla.

**No comparten NADA de nivel alta.** Lo único común son primitivas sueltas
de `@epetplace/ui` (`SelectorEspecie`, `Campo`) y el lector de especies
(`obtenerEspeciesActivas` + `esEspecieUi`) — o sea **el catálogo sí es
uno; el formulario no.**

---

## 2 · 🔴 EL MOTOR NO ES EL LÍMITE — y esto cambia el tamaño de la cura

Medido con `pg_get_function_arguments` contra la base viva:

```
crear_alta_asistida_pendiente(
  p_email, p_nombre_cliente, p_telefono, p_prestador_id,
  p_nombre_mascota, p_especie, p_country_code,
  p_raza            DEFAULT NULL,      ← ACEPTADO
  p_sexo            DEFAULT NULL,      ← ACEPTADO
  p_fecha_nacimiento DEFAULT NULL,     ← ACEPTADO
  p_microchip       DEFAULT NULL,      ← ACEPTADO
  p_foto_url        DEFAULT NULL)      ← ACEPTADO
```

**Las dos RPC ya aceptan cinco campos más de los que la pantalla pide.**

**Y el estrechamiento ocurre DOS VECES, no una** — el wrapper también los
deja afuera: `veterinaria-mostrador.ts:252-262` arma el `rpc(...)` con
siete parámetros y **ninguno de los cinco opcionales**.

> ⇒ *La pantalla no está limitada por el motor: está pidiendo menos de lo
> que el motor sabe guardar, y el wrapper lo confirma un piso más abajo.*
> **Eso abarata la cura de dato y la vuelve exigible.**

---

## 3 · 🔴 LA PREGUNTA QUE DECIDE: ¿SUPERFICIE O DATO? — **ES DE DATO, EN CUATRO PUNTOS**

### 3.1 · La RAZA — y contradice una letra FIRMADA

`LA_CASA_DEL_PRESTADOR` §6.1, literal: *«El prestador crea datos básicos
—**nombre, especie, raza**— asociados al CORREO DEL CLIENTE»*.

**El mostrador no pide raza.** El cliente sí, y con catálogo de 105 razas
que **sugiere sin imponer** (`PasoRaza.tsx`, D-379).

⇒ **La misma mascota entra al mismo expediente con o sin raza según por
qué puerta entró.** No es cosmético: es el expediente teniendo dos
calidades de dato según quién lo abrió.

### 3.2 · 🔴 EL TOKEN DEL INTENTO — la anti-duplicación NO viajó

`tipos.ts:79-101` documenta por qué existe, con su medición:

> *«los 19 duplicados vivos crearon 19 FAMILIAS distintas — una clave
> natural no habría cazado ninguno. Y la re-sumisión humana fue a 1-2
> minutos, así que una ventana de segundos tampoco los ve.»*

**El mostrador no tiene token de intento.** Su único candado es
`enviando` — un booleano de proceso, que es exactamente lo que **no**
alcanzó del lado del cliente.

⇒ **La misma clase de duplicado es alcanzable por esta puerta.** Y acá
es peor en una cosa: del lado del mostrador cada duplicado crea una
familia `pendiente_completar` **atada a un correo real**, o sea que el
día que esa persona active su cuenta encuentra dos.

*Ésta es la divergencia que convierte el hallazgo del founder de estético
en estructural: el cliente aprendió algo que le costó 19 filas y el
mostrador no se enteró.*

### 3.3 · 🔴 LA CLÁUSULA DEL PEZ — el acuario no es expresable por esta puerta

Firma de mesa (S91, opción A): *la especie «pez» registra el ACUARIO como
sujeto, no un individuo*.

Medido en la base:

```
mascotas.sujeto     NOT NULL  DEFAULT 'individuo'
mascotas.tipo_agua  NULL
```

Y **ninguna de las dos RPC de alta asistida recibe `sujeto` ni
`tipo_agua`**. Mientras tanto, el `SelectorEspecie` del mostrador **ofrece
pez** (lee las especies activas sin filtrar).

⇒ **Un pez dado de alta en el mostrador entra como `individuo`**, contra
la firma. *Y no falla: guarda bien, en el modelo equivocado* — la familia
exacta de defecto que esta jornada viene cazando.

### 3.3bis · LOS TRES CLONES DEL GUARD DE ESPECIE — **latente, no vivo (y la corrección es mía)**

El mismo predicado, escrito **tres veces**, con **dos listas distintas**:

```
apps/cliente/src/lib/params.ts:12       11 códigos  (+ 'otro', 'equino')
apps/prestador/…/mostrador/nueva.tsx:55  9 códigos
apps/prestador/…/mostrador/autorizar.tsx:57  9 códigos  ← clon del clon
```

**Iba a reportar esto como defecto vivo —«un equino se puede dar de alta
desde el cliente y no desde el mostrador»— y lo medí antes de decirlo:**

```
cat_especies: equino → activo = FALSE ·  otro → activo = FALSE
```

Y los tres lugares filtran sobre `obtenerEspeciesActivas`, que **solo trae
activas**. ⇒ **hoy las tres listas producen el MISMO resultado y no hay
defecto visible.**

**Queda como LATENTE, con su disparo medido: el día que alguien active
`equino` u `otro`, el cliente las ofrece y las dos pantallas del mostrador
no** — sin error, sin aviso, y con dos listas que nadie va a recordar
tocar. *Un clon inerte no es inofensivo: es un defecto con fecha de
activación en manos de otro.*

### 3.4 · El ORIGEN — divergencia menor, declarada

El cliente ofrece **5 de los 9** del CHECK y tiene guard propio
(`esOrigen`, `tipos.ts:196-205`) para que *«el alta no pueda mandar un
origen que nunca ofreció»*. El mostrador no pregunta: queda el que ponga
la RPC (`alta_asistida`, que es **correcto** para este camino).

**No es defecto: es la diferencia legítima del contexto.** Se lista para
que la cura no la borre por prolijidad.

---

## 4 · LO QUE EL CLIENTE TIENE Y EL MOSTRADOR NO — la tabla

| | cliente | mostrador | ¿es dato? |
|---|---|---|---|
| nombre · especie | ✅ | ✅ | — |
| **raza** (catálogo 105, sugiere) | ✅ `PasoRaza` | ❌ | **sí** (§6.1) |
| fecha de nacimiento **+ precisión** | ✅ `PasoHistoria` | ❌ | sí (el motor la acepta) |
| sexo | ✅ | ❌ | sí (idem) |
| origen | ✅ 5 ofrecidos | ❌ | no — legítimo |
| foto **+ encuadre** | ✅ `PasoFoto` | ❌ | sí (idem) |
| microchip | ❌ | ❌ | — (el motor lo acepta y **nadie** lo manda) |
| **acuario** (sujeto + tipo de agua) | ✅ `esAcuario` | ❌ | **sí — contra firma** |
| **token de intento** | ✅ | ❌ | **sí — duplicados** |
| contacto del cliente (email XOR tel) | ❌ | ✅ | **legítimo del mostrador** |
| handshake si la cuenta existe | ❌ | ✅ | **legítimo del mostrador** |

---

## 5 · LA DIRECCIÓN DE CURA — y el costo, para que la mesa elija

**La doctrina rige y no la re-litigo:** *dos copias sincronizadas se
desincronizan; una sola no puede.* **Emparejar la copia sería re-abrir
esta ficha en seis meses** — y el propio `tipos.ts` es la prueba de que
esta casa ya pagó ese precio una vez.

**Pero la unificación entera NO es barata y el número importa:** el arco
del cliente son **1519 líneas en 6 archivos**, viaja por **params con
rutas tipadas del app cliente**, y su voz vive en el diccionario del
CLIENTE. Mudarlo a `packages/ui` arrastra la voz (que es por app) y las
rutas (que son por app). **Y cruza territorio: `apps/cliente` no es mío.**

### Propuesta EN ETAPAS, con el corte donde cambia la naturaleza del daño

**Etapa 1 — cerrar la divergencia de DATO (mi territorio, cero cruce):**
raza · fecha+precisión · sexo · foto al wrapper y a la pantalla del
mostrador (el motor **ya los acepta**) · **el token de intento** ·
**la cláusula del pez** (o, si el acuario no entra por esta puerta,
**dejar de ofrecer `pez` en el mostrador**, que es Ley 23: la puerta no
ofrece lo que no puede guardar bien).

*Por qué esta etapa primero: es la que hace que las dos puertas escriban
el mismo expediente con las mismas reglas. La forma puede seguir siendo
distinta un tiempo; el DATO no.*

**Etapa 2 — la pieza única (mesa + coordinación con el cliente):** el
formulario como una sola pieza parametrizada por contexto, con lo del
mostrador —el correo como identidad, el modo asistido, el handshake—
**como parámetros y no como fork**.

> ⚠️ **Y una advertencia sobre la etapa 1 que hay que decir ahora:**
> completarla **reduce** la divergencia y **no la cierra**. Mientras haya
> dos implementaciones, la próxima mejora del alta del cliente volverá a
> no llegar al mostrador. **La etapa 1 compra tiempo; la 2 es la cura.**
> *Declararlo es lo que impide que la etapa 1 se lea como «resuelto».*

---

## 6 · LO QUE ESTE CENSO NO MIDIÓ

- **Si el founder vio otra cosa además de los campos.** El literal dice
  «las tildes… los ajustes de campos/selectores»; este censo compara
  **campos, validaciones y dato**. Si su hallazgo incluía algo visual
  concreto (un selector con otra forma), eso se ve en dispositivo y no
  está acá.
- **El alta del handshake** (`/mostrador/autorizar`) se midió por ENCIMA:
  se confirmó que es una copia —lo dice su propia cabecera— y que clona el
  guard de especie. **No se auditó campo por campo.** Lo que sí se puede
  afirmar: **cualquier cura que toque solo `nueva.tsx` deja esta cuarta
  puerta atrás**, y sería el mismo error que produjo este censo.
