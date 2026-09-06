# S113 · modo nocturno — bitácora de A

Nadie pide «sí». Cada acto queda acá con lo que se midió y lo que quedó abierto.

---

## 1 · Seguridad ② — las invitaciones dejan de ser públicas

**`pista/s113-a-1.3 @ 0f6389d4`**

🔴 **El rojo:** `anon` leía **5 invitaciones con los cinco emails y los cinco
tokens**, incluidas las revocadas. La causa tiene nombre y **el nombre miente**:
la policy se llama `familia_inv_publica_por_token` y su `USING` es literalmente
`true`. *Prometía filtrar por token y no filtraba nada* — misma clase que
`cat_razas_select_publica`. **Un nombre de policy es documentación, y la
documentación miente cuando nadie la contrasta con su cuerpo.**

Y `anon` tenía además **INSERT, UPDATE, DELETE y TRUNCATE**. Sin policies para
esos comandos la RLS los frenaba — *pero el día que alguien agregue una policy de
INSERT «para el flujo de aceptar», el grant ya está puesto y nadie lo va a mirar.*

**Cura:** `mirar_invitacion(token)` DEFINER con su límite, que devuelve **el
nombre de la familia y el rol, y nada más**. La tabla de límite guarda el **hash**
y no el token: *una tabla de límite que guarda las llaves que protege es una copia
del problema.*

**7/7** · anon no lee la tabla · sin email ni token en la respuesta · inventado
`null` · revocada `null` · límite en el intento 21 · guarda hash.

## 2 · Seguridad ③ — el mapa de PostgREST (`D-1041`)

🔴 Cada intento fallido le devuelve a `anon` **un nombre real del esquema**
(`"Perhaps you meant the table 'public.…'"`).
🟢 **Pero la raíz OpenAPI está cerrada** (`401 · only service_role`), que era el
peor caso. *La diferencia entre «se adivina de a uno» y «se descarga completo» es
la diferencia entre una molestia y un incidente.*
**No se cura desde el repo**: es config del dashboard. Ficha con el riesgo
acotado — conocer un nombre no da acceso, la RLS sigue en el medio.

`D-1042`: el `REVOKE` del panel legado queda como ficha por firma. El portal
entra con `anon` (S95-F); la cura es pasarlo a sesión, y es del portal.

---

## 3 · Candidato 1.2.1 — PUBLICADO

**`main @ 5fe9bea8`** = `A-1.3 @ 0f6389d4` + `B-1.2.1 @ b12d731f` + `C @ 942f913c`

| | exit | |
|---|---|---|
| 4 typechecks | 0 | |
| `verify:diseno` | 0 | 61 reglas |
| `verify:vocabularios` | 0 | 17 verdes |
| `verify:vistas-invoker` | 0 | 25 vistas, 0 sin invoker |
| `verify:pide-en-memorial` | 0 | |
| `verify:puerta-unica` | 0 | |
| `ota:deps` | 0 | cero cambios de dependencia desde `f4c90213` |

**Censo ② corrido justo antes de bundlear.** Árbol en **0 sucios**.

**Leído del objeto, no del texto del publish:**

| app | group | ancla | runtime | canal | árbol |
|---|---|---|---|---|---|
| cliente | `1cdb8ec8` | `5fe9bea85e23` | 1.0.7 | preview | `dirty=None` |
| prestador | `390ac72c` | `5fe9bea85e23` | 1.0.7 | preview | `dirty=None` |

**Mismo ancla en las dos, cero asteriscos.**

⚠️ **El emulador NO se caminó en este tramo, y se dice.** Publiqué con los gates
en verde y el censo hecho; *el recorrido en aparato es otra medición y no la
tuve.* Queda como lo primero del próximo tramo, con la cuenta del llavero.

---

## 4 · Sublote 1.3 «Pasaporte» — motor y página vivos

**El pasaporte de Thor, abierto sin sesión y sin llave:**

```
https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/pasaporte?t=0lbVHLdzZl7qbY903miZpw
```

`HTTP 200 · 3.215 bytes · CERO JavaScript · x-robots-tag noindex · cache 60 s`

Dice: **Thor · Bulldog inglés · 6 años · Macho**, el botón **«Llamar a
Guillermo»** (un `tel:`, no un número para transcribir con una mano ocupada), el
mensaje de la familia, **«Cuidado con pollo · moderada»** y las cinco
medicaciones con su dosis.

**El QR, generado en el servidor** (ni la app ni el PDF agregan nada al bundle):
- `…/pasaporte/0lbVHLdzZl7qbY903miZpw.svg` → 11,6 kB
- `…/pasaporte/0lbVHLdzZl7qbY903miZpw.png` → 5,5 kB, 588×588

Un token inventado → **404**.

**16/16 con rollback:** revocado `null` · anon no lee ninguna de las dos tablas ·
límite en la lectura 31 · la config apaga cada campo · perdida cambia la
respuesta · reemitir revoca la anterior · tokens únicos.

### Lo que falta del 1.3, declarado
- **A5** — el QR en el PDF de la ficha de identidad y en el carnet. La ruta ya
  existe y devuelve la imagen; falta que los dos PDF la pidan.
- **A6** — la rama `pista/s113-a-nfc` y `docs/loop/S113-NFC-BUILD.md`.
- **La URL corta.** Medido: hoy **no existe dominio propio** sirviendo contenido
  público. Los papeles se sirven como `…/functions/v1/<edge>?t=<token>` y lo
  único en Vercel es la página de pago, **sin rewrites**. La URL de arriba
  funciona hoy; una `epetplace.com/p/<token>` exige un dominio que no medí que
  exista.

---

## 5 · El recorrido en emulador que quedaba debiendo — HECHO

Cuenta del founder del llavero (`epetplace-cuenta-founder`), Metro propio en
8123 con **`Android Bundled 9913ms … (2968 modules)`** en el log antes de
capturar. Capturas en `docs/loop/capturas-s113-a/`.

⚠️ **Y empezó confirmando el binario, que es lo que la ley pide (`L-138`).**
Casi camino sobre la app equivocada: en el emulador hay **tres** paquetes y
`com.epetplace` (versionName **1.0**, ajena) no es ninguna de las mías. Además
`com.epetplace.cliente` resultó ser la **dev build**, no la preview — la
reemplazó al instalarse. *Y había un Metro ajeno vivo en `192.168.1.92:8082`,
de otra pista: usarlo habría servido otro árbol con la pantalla viéndose
perfecta.*

| paso | resultado |
|---|---|
| Hogar con la cuenta real | ✅ 4 mascotas, «Ponte al día · 16 cosas», el orbe de Nexo |
| **FichaRaza (A8)** en el perfil de Zor · Pug | ✅ «Ver más sobre la raza ›» despliega el texto que el founder firmó |
| **Memorial** (Sombra) | ✅ sin gradiente, sin pendientes, sin CTAs — **y sin orbe**: el Coach apagado |
| **Carnet** de Thor | ✅ 8 vacunas, «Su plan» con vencida y «No figura en su carnet» |

### 🔴 Dos defectos que sólo aparecen caminando — para C

1. **«Zor está en su etapa adulto»** (perfil). Es el código crudo del enum
   metido en una frase: sin concordancia («adulta») y **contra la orden del
   founder de rotular con el momento vital de la especie**
   (`cat_especies_perfil`), no con el valor interno.
2. **«Según su plan, tocaría el 2025-07-06»** (carnet). Fecha **ISO cruda** en
   una frase de familia; toda la casa escribe «06 jul 2025».

*Los dos son la misma clase —un valor de máquina que se filtró a una oración—
y ninguno lo ve un typecheck: las dos frases compilan perfecto.*

### Y una medición que corrige un número heredado

El parte decía «dos mascotas de prueba quedan en memorial». **Son CINCO**
(`PruebaC12896`, `PruebaC24772`, `PruebaC37493`, `PruebaC76663`,
`PruebaC82896`), las cinco Beagle y las cinco **marcadas `real`** — la marca de
fixture no se les aplicó, así que **hoy cuentan como mascotas reales en
cualquier censo**. No se borran (firma del founder: sólo si él lo pide), pero
la marca sí hace falta. Anotado en `S113-NOCHE-PENDIENTES.md`.

---

## 6 · Lote 2 · el motor de Nexo (`main @ a8820c26`)

**A1 contexto · A2 búsqueda · A3 memoria · A4 hilo · A5 placas · A6 avisos** —
los seis con su cinturón y sus rojos reales. Declarados por nombre para C en
`docs/loop/S113-A-PARA-C.md`.

**Medido, no supuesto:** el contexto de Thor son **4.650 bytes** en un viaje ·
la búsqueda tarda **7,6–59,7 ms** (techo 200) · el filtro de menores se ejerce
sembrando un menor real y su evento · «con el opt-in apagado el generador
produce CERO».

### 🔴 Tres desajustes de contrato con las edges de D, hallados LLAMANDO

Las edges estaban desplegadas y devolvían 403 y 204 sobre datos que mi RPC
entregaba perfecto. **Ninguno lo ve un typecheck: las dos mitades compilan.**

1. La edge corre con `service_role` y resuelve el uid ella misma ⇒ `auth.uid()`
   es NULL adentro. Las puertas aceptan `p_user_id` **con el guard que impide
   que un logueado se haga pasar por otro**: *un parámetro de identidad que el
   llamador elige no es identidad, es un formulario de suplantación.*
2. La edge lee el contexto **plano**; el mío agrupaba. Se sirven las dos formas.
3. `coach-parte` hace `Array.isArray` y filtra por `titulo`; yo devolvía un
   objeto ⇒ **204 SIEMPRE con seis avisos reales en la tabla**. Y ése es el peor
   modo de falla: *el silencio de esa pieza es indistinguible de «hoy no hay
   nada que decir». No se descubre: se hereda.*

### Y dos reconciliaciones que no son cosméticas

- **El memorial deja de rebotar en la LECTURA del contexto.** D ya había
  escrito la respuesta correcta —voz serena, **sin llamar al modelo**— y mi
  rebote la volvía inalcanzable: la familia recibía «no pudimos leer el
  expediente». *Leer el expediente de una mascota que murió es lo que hace la
  app entera; lo prohibido es hablar sobre él.*
- **`estado_vida` viaja como `'memorial'`, no `'fallecida'`.** La edge compara
  contra esa palabra: con el valor crudo su guard no dispararía y **el modelo
  hablaría de una mascota muerta**.

### Las tres llamadas reales, con la cuenta del founder

| | resultado |
|---|---|
| «¿cuándo le toca la vacuna?» | 200 · **`fuente: plantilla`** · el modelo de redacción **no se llamó** |
| «¿cómo lo ves por su etapa?» | 200 · **`fuente: modelo`** · con su medicación real · Sonnet 1×, 50 in / 175 out, **USD 0,006045** |
| parte del día, **dos avisos** | 200 · hilado y **sin inventar**: la leptospirosis vencida y el paseo de mañana 17:30, los dos reales |

Router (Haiku) 2× · **USD 0,001050**. Una pregunta de dato paga sólo el router.

---

## 7 · La caída del arranque era mía

Medido por E con un deep link durante el arranque: **3 caídas de 4**. La causa
vivía en `adopcion-hilo-vivo.ts`, con dos mitades que se necesitan: el canal se
llamaba **`'mis-hilos'`, fijo** —y `supabase-js` indexa por nombre, así que dos
montajes tocan el MISMO objeto— y `void removeChannel` **no espera a nadie**.
*Una limpieza que no se espera no es una limpieza: es una carrera.*

Curado volviendo el estado **inexpresable**: nombre único por montaje y una
cadena de promesas del módulo. Aplicado a **los dos** canales del archivo, no
sólo al que falló.

## 8 · El pasaporte en la calle — 🔴 BLOQUEADO POR PLATAFORMA

C midió que la página llega como `text/plain`. **Reproducido y acotado:**

| | GET |
|---|---|
| `text/html` (en cualquier forma) | → **`text/plain`** |
| `application/xhtml+xml` | → **`text/plain`** |
| `image/svg+xml` · `image/png` | → **pasan intactos** |

⇒ **Supabase degrada todo lo que pueda renderizar HTML**; no es un bug mío ni
el gateway pisando todo (el QR conserva su tipo). Es política de plataforma
para que nadie sirva páginas desde `*.supabase.co`. **La cura es un dominio
propio** y eso es del founder — anotado.

**Lo que sí se curó:** la foto va transformada a 264 px / calidad 60 →
**62.582 bytes → 9.362 (−85 %)**. La página entera pesa **12.669 bytes** contra
un techo de 60.000. *La original sola ya lo rompía.*

## 9 · Estado para el candidato 2.0

`main @ a8820c26` con **B-2.0, C-1.3, C-2.0, D-2.0 y E-2.0** mergeados.
4 typechecks **0** · `verify:diseno` **0** · `verify:puerta-unica` **0**.

⏸️ **No publiqué.** El candidato espera la cura de C del arranque: *no sale un
OTA con un crash conocido en el camino del QR.* Mi mitad (el canal) está
curada y en `main`; falta la del shell.

---

## 10 · El pasaporte se sirve desde `www.epetplace.com`

**El repo, medido y no supuesto:** `~/proyectos/ePetPlace/epetplace-web` ·
**Astro 5.18** (no Next) · `output: 'static'` · enruta por `src/pages/` ·
despliega en Vercel con `buildCommand: pnpm build`. Todo en la rama
**`pasaporte-publico`**, nunca en `main`.

### La causa, acotada con su control

| content-type que la edge declara | lo que llega en GET |
|---|---|
| `text/html` (en cualquier forma) | **`text/plain`** |
| `application/xhtml+xml` | **`text/plain`** |
| `image/svg+xml` · `image/png` | **pasan intactos** |

⇒ No es el gateway pisando todo —el QR conserva su tipo—: **Supabase degrada
lo que pueda renderizar HTML**. 🔴 Y la trampa: **`curl -I` devuelve
`text/html`**. La diferencia sólo aparece en GET, así que un HEAD da verde
sobre una página rota.

### Lo hecho

- **① La edge expone `?formato=json`** con los campos de la lista, más las URLs
  del SVG y el PNG. **1.468 bytes, sin ninguna credencial.** La foto viaja ya
  firmada y transformada: el bucket es privado y el sitio no tiene —ni debe
  tener— llaves. El 404, el 429 y la placa libre también hablan JSON.
- **② `/p/[token]`** en el sitio, `prerender = false`. Cero JS · sin cookies ·
  sin analítica · `noindex` · `tel:` y `wa.me` tocables · cache 60 s ·
  revocado, placa libre y límite con voz propia.
  Medido en local: **HTTP 200 `text/html`, 3.915 bytes**; con la foto, ~13 kB
  contra el techo de 60.
- **③ El QR y el NFC apuntan a `https://www.epetplace.com/p/<token>`**, y la
  URL vive en **un solo lugar** porque *este texto se graba en metal*.
  Verificado **decodificando**, no suponiendo: la matriz que sirve la edge es
  la de la URL nueva.
- **④ `D-1044`**: el dominio propio de Supabase deja de hacer falta; queda como
  alternativa escrita, con su «no está medido» declarado.

### Dos cosas que aparecieron al hacerlo

- **`@astrojs/vercel@11` pide Astro 7** y pnpm la instaló sin frenar por el
  peer; la serie 8.x es la de Astro 5. El build lo dijo, el instalador no.
- 🔴 **El adapter movió el estático a `dist/client/` y SEIS gates del sitio
  empezaron a medir el árbol equivocado** (reportaban huérfanas como
  `/client/veterinaria/quito`). *Un gate atado a una ruta mide la convención
  de ayer, no el hecho.* Curados con **detección**, no con una ruta nueva, así
  funcionan con y sin adapter — y a `verify:sin-supabase` se le corrió su
  **control positivo** (un JWT falso en lo publicado ⇒ rojo) para probar que
  sigue viendo.
- Y `vercel.json` perdió `outputDirectory: dist`: con el adapter, Vercel lee
  `.vercel/output`. Forzarlo habría servido sólo lo estático y `/p/<token>`
  daría **404 en silencio** — el sitio se ve entero y la ruta nueva no está.

### 🔗 La vista previa

```
https://epetplace-r19ijtyp3-guillo381-8993s-projects.vercel.app/p/bNRqRhMOj7Bo_LELT97Swg
```

`status ● Ready`. ⚠️ **Pide sesión de Vercel**: el proyecto tiene *Deployment
Protection* y devuelve 302 a `vercel.com/sso-api`. **Con tu cuenta abre**; en
un teléfono sin sesión, no.

⇒ **El rojo del brief —el QR abriendo desde un teléfono sin la app— NO se pudo
ejercer**, y no por la página: por la protección del proyecto. Las dos salidas,
y las dos son tuyas: **levantar la protección de previews** (ajuste del
proyecto, no lo toco solo) o **autorizar el merge a `main`**.
