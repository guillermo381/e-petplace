# MESA 104 · PISTA B · TANDA 0 — CENSO DEL TEXTO LEGAL Y DEL SITIO

> **Nace:** 21-ago-2026 · **Pista B** (páginas legales y jueces) · **TANDA 0 = CENSO, CERO CONSTRUCCIÓN**
>
> **Qué es:** lo que HAY, medido contra el objeto (repo del sitio + sitio vivo + fichas + POLITICAS).
> **Qué NO es:** no redacta ni enmienda una línea de texto legal. Transcribe y declara huecos.
> **Regla de precedencia:** si este censo contradice al repo o a una letra firmada, gana la fuente.

---

## §0 · FRENO DE APERTURA — `PLAN_MESA_104.md` NO EXISTE

El encargo ordena leer `PLAN_MESA_104.md` §1-§2. **Medido: el archivo no existe**, ni en
`e-petplace/docs/`, ni en ningún worktree, ni en los repos vecinos (búsqueda por nombre y
por contenido `MESA_104`/`S104` sobre todo el ecosistema).

Lo que SÍ existe y acota esta mesa, con su literal:

- **`docs/PLAN_MESA_103.md` v1.1** declara en su cabecera que la mesa 103 **NO autoriza**
  *«redactar política de privacidad o materia legal (D-405)»* y que **S104** es
  *«certificación y corte real»*. En su §267 repite: *«**S104** · no construye D-856 antes
  de su letra firmada · no redacta privacidad ni…»* (línea truncada en el original).
- **`docs/INSUMO_D405_PRIVACIDAD.md`** (62 líneas, nace 21-ago-2026 en mesa 103) **es el
  insumo pre-legal explícitamente dirigido a D-405** y declara su destino verbatim:
  *«la sesión de LEGALES: T&C completos · política de privacidad · aviso de IA · P20 custodia»*.

**Lectura de esta pista, declarada como lectura y no como hecho:** el encargo de B coincide
exactamente con el inventario de D-405 y con el destino del insumo. Se ejecuta la tanda 0
contra **D-405 + el insumo** como fuentes, y **se pide a la mesa que confirme o corrija el
encuadre** antes de abrir tanda 1. *No se inventa un plan que no existe.*

⚠️ **Nota de numeración heredada (PLAN_MESA_103):** «104» es numeración de MESAS del founder;
el número de sesión del repo lo asigna la bitácora. **Nada se renumera acá.**

---

## §1 · STACK Y DESPLIEGUE DEL SITIO — medido

**Repo:** `../epetplace-web` (fuera de este monorepo, territorio propio). Rama `main`,
HEAD `8cf485b`.

| | Medido | Fuente |
|---|---|---|
| **Framework** | **Astro 5.14.1**, `output: 'static'`, `build.format: 'directory'` (URL limpia sin `.html`) | `package.json` · `astro.config.mjs` |
| **Hosting** | **Vercel**, proyecto `epetplace-web` (`prj_Yj5wr67xUcheYPf5D3LGsUVeROSN`) | `.vercel/project.json` · `vercel.json` |
| **DNS y registrador** | **Hostinger — SOLO eso.** No aloja | `CLAUDE.md` del sitio |
| **Despliegue** | **Automático: cada push a `main` publica.** Gate propio: nada se publica sin él | `CLAUDE.md` §Despliegue y §TERRITORIO |
| **Dominio** | `www.epetplace.com` canónica; ápice `epetplace.com` redirige 308 | `vercel.json` redirects |
| **i18n** | `es` en la raíz, `en` bajo `/en/` (`prefixDefaultLocale: false`) | `astro.config.mjs` |
| **Backend** | Solo leads: schema `marketing` + edge function. **Cero cliente Supabase en el bundle** (guard `verify:sin-supabase`) | `CLAUDE.md` Ley ① |
| **Jueces vivos** | `verify:sin-supabase` · `verify:contraste` · `verify:huerfanas` · `verify:sitemap` · `verify:iconos` | `package.json` scripts |

**⚠️ Desvío documental medido (no curado — es tanda 1 o de la mesa):** el comentario de
cabecera de `astro.config.mjs` dice *«Hostinger sirve HTML plano»*. **Es letra vieja**: el
propio `CLAUDE.md` del sitio declara que Hostinger quedó descartado como hosting en S93-H.
El comentario no cambia comportamiento (el build es estático igual), pero **nombra mal a
quien aloja** — y ese es exactamente el dato que la política de privacidad existe para dar
(ver §2, corrección ① ya aplicada en `legales.ts` y **no** en el config).

---

## §2 · INVENTARIO DEL TEXTO LEGAL EXISTENTE

### 2.1 · Lo que EXISTE y está PUBLICADO

**Fuente única:** `src/legales.ts` (222 líneas) — dos documentos exportados, `PRIVACIDAD` y
`TERMINOS`, como arreglos de secciones. Se montan por `src/paginas/Legal.astro` desde cuatro
rutas: `/privacidad`, `/terminos`, `/en/privacidad`, `/en/terminos`. Enlazados desde el pie
(`src/components/Pie.astro`).

| Documento | Versión declarada | Estado | Verificado vivo |
|---|---|---|---|
| **Política de privacidad** | *«Última actualización: 10 de agosto de 2026»* | **BORRADOR** — la página lo dice en voz alta arriba de todo | `HTTP 200` en `/privacidad` |
| **Términos y condiciones** | *«Última actualización: 10 de agosto de 2026»* | **BORRADOR** — mismo aviso | `HTTP 200` en `/terminos` |

**El aviso publicado, verbatim** (`Legal.astro`): *«Borrador de trabajo, pendiente de revisión
por un abogado antes del lanzamiento público. Responsable del tratamiento: Satori Latam S.A.S.
(Colombia). Marco aplicable: Ley 1581 de 2012 de Colombia.»*

**Decisiones de construcción ya tomadas y vigentes** (se transcriben porque atan la tanda 1):

- **El texto sale en ESPAÑOL en las dos rutas a propósito.** Literal del archivo: *«es el
  idioma del marco legal aplicable, y una traducción no revisada de un texto legal es una
  fuente de problemas, no una cortesía.»* Por eso vive en `.ts` y **no** en el diccionario
  i18n: meterlo al espejo es/en obligaría a traducirlo.
- **Los `[[huecos]]` se resaltan, no se disimulan** (`<mark class="hueco">`). Literal:
  *«Un legal con un dato inventado es peor que uno incompleto, porque el incompleto se nota.»*
  Los siete huecos del borrador se completaron el 10-ago-2026 con datos del founder; **el
  mecanismo se conserva vivo** para cuando reaparezca uno.
- **Alcance declarado: EL SITIO, JAMÁS LA APP.** Literal: *«La app maneja historia clínica
  veterinaria, geolocalización de paseos, fotos y datos del hogar: es otra categoría de
  sensibilidad y necesita su propio documento. No se anticipa acá.»*

### 2.2 · 🔴 EL HALLAZGO DE LA TANDA — el responsable publicado quedó vencido

`src/legales.ts` declara su propia condición de vencimiento, verbatim:

> *«Mientras no exista entidad ecuatoriana, la responsable es **Satori Latam S.A.S.**
> (Colombia, NIT 901579644). Eso cambia el marco entero y no solo un nombre: rige la
> **Ley 1581 de 2012** […], la autoridad de control es la **Superintendencia de Industria y
> Comercio**, y la jurisdicción es **Bogotá**. **El día que exista la sociedad ecuatoriana
> cambian responsable, marco (LOPDP), autoridad y jurisdicción — se actualiza este archivo Y
> su fecha.**»*

**Ese día ya llegó.** `docs/INSUMO_D405_PRIVACIDAD.md` §1.1 declara como *dato ya existente*:
**SATORI INOV LATAM S.A.S., RUC 1793240435001, Quito, constituida 14-ago-2026.**

**Medido contra el sitio VIVO el 21-ago-2026** (`curl` sobre `https://www.epetplace.com/privacidad`):

| Buscado | Ocurrencias |
|---|---|
| `Satori Latam S.A.S` | **3** |
| `NIT 901579644` | **1** |
| `Ley 1581` | **1** |
| `Superintendencia de Industria` | **1** |
| `Bogotá` | **2** |
| `SATORI INOV` · `1793240435001` · `LOPDP` | **0** |

⇒ **Las cuatro cosas que el archivo dijo que cambiarían el día que existiera la sociedad
ecuatoriana —responsable, marco, autoridad y jurisdicción— siguen publicadas con el valor
viejo, siete días después de la constitución.** Los T&C además someten las controversias a
*«los jueces competentes de la ciudad de Bogotá»*.

**No se cura en tanda 0** (es materia legal y el encargo lo excluye). **Se declara como el
primer ítem de firma de la mesa**, porque no es una imprecisión de redacción: es el dato que
la política existe para dar, y hoy nombra a una sociedad distinta bajo una ley distinta.
*La condición de vencimiento estaba escrita; lo que faltó fue ejecutarla.*

### 2.3 · Lo que FALTA — declarado, no redactado

Contrastado contra el inventario de **D-405** (`DEUDAS_CANONICAS.md:1786`, 🔴 ALTA):

| # (D-405) | Pieza | Estado medido |
|---|---|---|
| 1 | **T&C de la plataforma** (marketplace dueño ↔ prestador ↔ plataforma) | ❌ **NO EXISTE.** Los T&C publicados son **del sitio informativo** y lo dicen: *«Este sitio no es la plataforma […] se rigen por sus propios términos, que vas a poder leer antes de usarlas.»* La promesa está publicada y el documento no existe |
| 2 | **P20 — Custodia y responsabilidad** | ❌ **RESERVADA SIN LETRA.** `POLITICAS_EPETPLACE` v1.10 la nombra tres veces solo para decir que el número está reservado a custodia (D-405). **Cero texto.** Bloqueante declarado de abrir a prestadores reales; rige TAMBIÉN al paseo |
| 3 | **Privacidad de la APP** | ❌ **NO EXISTE.** La del sitio se excluye a sí misma explícitamente. Requisito de tiendas (§3.4) |
| 4 | **Aviso de uso de IA** | ❌ **NO EXISTE — cero ocurrencias** de «inteligencia artificial» en todo `src/`. ⚠️ Y hay una **tensión medida**: la privacidad publicada afirma *«No tomamos decisiones automatizadas sobre vos.»* Es cierto **para el sitio** (que solo recoge formularios), pero la app corre IA viva: `extract-vacuna` (Sonnet), `estructurar-nota-clinica` (Sonnet) y el Coach. El insumo D-405 §2 fila 4 ya lo marca como brecha |
| 5 | **Páginas estáticas que sirvan todo lo anterior** | 🟡 **PARCIAL.** La infra existe y funciona (Astro + Vercel + push publica + rutas + pie + jueces). Lo que falta es el **contenido** de 1–4 |

**Dentro del producto (medido, no supuesto):** `apps/cliente/src/app/(tabs)/cuenta/ayuda.tsx`
monta términos y privacidad con **placeholder declarado** (`t('cuenta.legalPlaceholder')`) —
ficha **D-336** 🟡 ALTA. **Grep de `epetplace.com` en `apps/`: CERO resultados** ⇒ hoy ninguna
app enlaza a ninguna URL legal.

---

## §3 · QUÉ URL EXIGE LA TIENDA — medido

**Lo que la tienda exige** (`D-405` ítem 3, verbatim): *«Manejo de datos / política de
privacidad — **requisito de tiendas (URL obligatoria)** + P5 menores + la bitácora de la
familia como dato conductual nuevo.»* Gemelo en `DEFINICION_SOFTLAUNCH` §3.5
(*«Compuerta de salida: cumplimiento de tiendas + beta gate»*) y en las fichas **D-336**
(*«las reviews de tienda los exigen; sin ellos no hay submit»*) y **D-337** (eliminación de
cuenta funcional, *«requisito de tiendas»*).

**Estado medido de la pata de tiendas:**

- `apps/cliente/eas.json` y `apps/prestador/eas.json`: **cero `privacy` / `policy`**.
- **No existe perfil `production`** en `eas.json` (consistente con el canon S81).
- **No existe `store.config.json`** en ninguna app ⇒ no hay metadata de tienda declarada.
- **Ninguna URL legal configurada en ningún lado del producto.**

**Las URL que el sitio YA sirve y son candidatas naturales** (existen, responden 200 y son
canónicas en `src/i18n/index.ts` → `RUTAS.privacidad = '/privacidad'`, `RUTAS.terminos = '/terminos'`):

- `https://www.epetplace.com/privacidad` · `https://www.epetplace.com/terminos`
- `https://www.epetplace.com/en/privacidad` · `https://www.epetplace.com/en/terminos`

⚠️ **Lo que NO se declara resuelto, y es decisión de la mesa:** esas URL sirven hoy el
documento **del sitio**, que se excluye a sí mismo de la app. **Apuntar la ficha de tienda a
esa URL sería declarar ante Apple y Google una política que dice no cubrir la aplicación.**
La decisión —URL nueva para la app (p. ej. `/privacidad-app`), o un documento único que cubra
ambos— **es de D-405 con abogado, no de esta pista.** Se sirve medida, sin voto.

---

## §4 · LO QUE ESTA TANDA NO HIZO, sin maquillar

- **No redactó ni enmendó una línea de texto legal** (encargo explícito).
- **No curó el responsable vencido de §2.2** — es materia legal y de firma.
- **No curó el comentario de `astro.config.mjs`** que nombra Hostinger como hosting (§1);
  es territorio del repo del sitio y va con su gate de despliegue.
- **No tocó `POLITICAS_EPETPLACE`** — P20 sigue reservada y sin letra.
- **No desplegó nada.** Cero push, cero build, cero cambio en ningún repo salvo este parte.

## §5 · LO QUE LA TANDA 1 NECESITA ANTES DE ABRIR (pedidos a la mesa)

1. **Confirmar el encuadre** — `PLAN_MESA_104.md` no existe (§0). ¿Rige D-405 + el insumo?
2. **Firma sobre el responsable vencido** (§2.2): ¿la sociedad ecuatoriana pasa a ser
   responsable, con LOPDP, autoridad y jurisdicción de Ecuador? **Es firma del founder con
   abogado, no adivinable desde el repo.** Hasta que se firme, el sitio publica el marco viejo.
3. **Decisión de la URL de tiendas** (§3): documento propio de la app, o único que cubra ambos.
4. **Confirmar el alcance de B**: ¿B redacta con abogado, o B solo construye las páginas y
   los jueces sobre texto que la mesa entrega? El encargo dice *«No redactes texto legal»*
   para la tanda 0; **no dice qué pasa en la tanda 1.**

---

**Método:** todo dato de este parte se midió del objeto (archivos, `curl` al sitio vivo,
`grep` sobre el repo), jamás de un resumen. Las citas van entre comillas y con su archivo.
