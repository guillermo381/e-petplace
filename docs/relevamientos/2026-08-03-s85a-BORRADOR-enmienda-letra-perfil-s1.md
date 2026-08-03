# BORRADOR — ENMIENDA A `LETRA_PERFIL_S79` §1 · el enlace del registro fiscal

> # ⚠️ BORRADOR. **NO RIGE. NO DEPOSITADO EN LA LETRA.**
>
> `LETRA_PERFIL_S79` está **FIRMADA** (27-jul-2026). Enmendarla exige **firma
> escrita del founder** — regla 80. Este archivo es el texto propuesto para que
> la firma tenga sobre qué caer, no la enmienda.
>
> **Todo lo marcado MEDIDO se verificó contra el árbol vivo de `main` (`c2f8d65`)
> y contra la DB. Lo que no se midió se declara como hueco, no se completa.**

---

## 1 · QUÉ CAMBIA, en una línea

**El registro 1 (el fiscal) deja de enlazarse desde el PERFIL y pasa a
enlazarse desde la puerta que gobierna lo comercial**, dentro de la IA de
cuatro puertas de Cuenta.

**LO QUE NO CAMBIA — y se pone primero porque es lo que una enmienda de acceso
puede romper sin querer:**

> ### EL RÉGIMEN DE ACCESO NO SE TOCA. **Owner-only. El muro D-517, INTACTO.**

La regla del §1 —*el registro fiscal se **ENLAZA**, jamás se dibuja inline*—
**sobrevive entera**. Lo único que se mueve es **desde dónde cuelga el enlace**.
*Un cambio de IA que se lleve por delante un muro de RLS sería exactamente la
clase de daño que nadie ve hasta que un empleado abre la pantalla.*

---

## 2 · LO MEDIDO — el estado de HOY, antes de proponer nada

| qué | dónde | medido |
|---|---|---|
| el enlace a lo fiscal | `(tabs)/cuenta/perfil.tsx:1323` y `:1346` | **dos** `router.push('/cuenta-comercial')` |
| su etiqueta | `i18n/es.ts:347` | **"Datos comerciales"** · *"Tus datos fiscales, tu cuenta de cobro y tu identificación."* |
| las cuatro puertas de Cuenta | `(tabs)/cuenta/index.tsx:292-295` | **Tu perfil · Tus datos · Seguridad · Preferencias** |
| lo comercial, adentro | `cuenta-comercial/index.tsx:202-226` + `:270` | **tres hermanas**: Datos fiscales · Datos bancarios · **Documentos** (`SeccionDocumentos`) |
| otras entradas a lo comercial | `liquidaciones.tsx:210` · `sala-espera.tsx:213` | **dos, VIVAS y de otro contexto** |

### ⚠️ DOS HUECOS QUE LA FIRMA TIENE QUE RESOLVER, y por eso van acá y no en una nota al pie

**① LA PUERTA "TU NEGOCIO" NO EXISTE HOY CON ESE NOMBRE.** La orden de la mesa
la nombra así; **lo medido dice "Tu perfil"** (`miCuenta.perfil`, es.ts:422).
Las dos lecturas son posibles y **no las elijo yo**:

- **(a)** la firma incluye el **rename** de "Tu perfil" → "Tu negocio", y esta
  enmienda lo transpone; o
- **(b)** "Tu negocio" es una puerta **nueva** y las cuatro pasan a ser cinco.

*Se declara en vez de asumir (a) porque (a) es lo que suena más barato, y elegir
por costo es cómo una letra firmada termina diciendo algo que nadie firmó.*

**② EL ENLACE NO ES UNO: SON TRES, y dos NO son del perfil.**
`liquidaciones` y `sala-espera` empujan al mismo lugar **desde otro contexto**
—cobrar y entrar— y **C ya midió que no son duplicados, son contextos**
(acta S84-C §4). **Mover el del perfil NO los toca**, y esta enmienda **no
propone tocarlos**. *Se dice porque "el enlace se muda" leído sin esta línea
sonaría a que queda uno solo, y quedan tres.*

---

## 3 · EL TEXTO PROPUESTO — reemplaza el último párrafo de §1

> **La regla del registro 1 — se ENLAZA, jamás se dibuja inline.** El enlace
> vive en **la puerta comercial de Cuenta** *(ver §1bis: qué puerta, y por qué
> no el perfil)*, con un chevron hacia las pantallas de cuenta comercial
> (owner-only, gateadas de facto — D-517 CLASE 2); **jamás** renderiza RUC,
> razón social o bancarios dentro del perfil. Dos porqués medidos, **los dos
> intactos**: (a) el muro D-517 es RLS deliberada — para un empleado no-owner R2
> devuelve null, y una pantalla que mezcla registros rompería para él; (b)
> privacidad multi-actor — la casa ya decidió que la plata no se le muestra a
> quien no gestiona (S72-P1a).

### §1bis NUEVO — POR QUÉ EL ENLACE SALE DEL PERFIL

**El perfil es el registro 2: LA SEDE.** Su dueño de dato es el negocio, su
lector es **el cliente** (es la vitrina) y su editor es **el titular**. El
registro 1 es fiscal: su lector es **solo el owner**.

> **Colgar la puerta de lo owner-only desde la pantalla de lo público-a-la-
> familia mezcla los dos regímenes de acceso en el mismo camino** — y §1 existe
> justamente para que ninguna pantalla los mezcle. **La letra lo prohibía en el
> RENDER y lo permitía en la NAVEGACIÓN.**

*Es la misma distinción que la propia §1 hace entre las cuatro filas de su
tabla: cada registro tiene un dueño de dato **y** un régimen de acceso. El
enlace es parte del régimen, no del contenido.*

**Y el argumento de uso, que apunta igual:** con lo comercial unificado en tres
hermanas (fiscal · bancario · documentos, S84-C34), **el perfil era la cuarta
puerta al mismo lugar** — que es exactamente lo que esa unificación existió
para matar.

---

## 4 · LO QUE ESTA ENMIENDA **NO** DECIDE

1. **El nombre de la puerta** (hueco ①). Sin eso, el texto de §1bis dice *"la
   puerta comercial de Cuenta"* y **no la nombra** — genérico y verdadero, en
   vez de específico y posiblemente falso. *Es la misma salida que C32 firmó
   para el nombre del documento fiscal, aplicada acá.*
2. **Las otras dos entradas** (`liquidaciones`, `sala-espera`). Siguen vivas y
   fuera de alcance.
3. **El régimen de acceso.** No se toca, y se repite en §1 para que nadie lea la
   mudanza como un relajamiento.

---

## 5 · LO QUE HACE FALTA PARA DEPOSITARLA

1. **Firma escrita del founder** sobre §3 (regla 80).
2. **Resolver el hueco ①** — (a) rename o (b) puerta nueva.
3. Recién entonces A la transpone a `LETRA_PERFIL_S79` §1 + §1bis, sube la
   versión a **v1.2** y lo asienta en el Historial de la letra.

> **El orden importa: 2 antes de 3.** Depositar con la puerta sin nombre dejaría
> a la letra citando una pantalla que puede no existir — *y una letra firmada
> que nombra mal es peor que una sin escribir: cualquiera la cita y está "en
> regla".*

---

*Borrador de la pista A, S85. Hallazgos, no veredictos. Nada de acá rige.*
