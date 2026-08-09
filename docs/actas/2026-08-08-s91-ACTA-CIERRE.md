# ACTA DE CIERRE · S91 (7-8 Ago 2026) — EL ALTA, EL PERFIL, LA VITRINA Y EL ACUARIO CON SUJETO PROPIO

> **Escrita por A** (escritora única de `docs/`). Lo de B, C y D se cita de sus
> commits y volcados; lo que A no midió, se dice que no lo midió.

---

## ✅ LOS DOS GATES DEL FOUNDER — PASADOS EN VERDE. S91 CERRADA.

| app | group | runtime | update id del gate | ancla (`gitCommitHash` del OBJETO) |
|---|---|---|---|---|
| **CLIENTE** | `53d18a98-9aae-4ef4-a20b-5fce9a14527f` | **1.0.3** | android `019fe42a-d483-73ce-ba16-5d911b38586e` · ios `019fe42a-d483-7896-85b6-6dc3d507e493` | `c4c92933745d6dc816354170633666fba17ee3cf` |
| **PRESTADOR** | `364f353b-6967-4dfb-84d3-a952e82e2b93` | **1.0.4** | android `019fe42b-6d93-7c40-8917-480032861c94` · ios `019fe42b-6d93-70d9-8e28-c3e6e1f75025` | `c4c92933745d6dc816354170633666fba17ee3cf` |

**Mismo ancla en los dos, a propósito:** el carrusel es pieza compartida y su
gate necesitaba las dos superficies para probar que **el espejo sigue siendo
espejo**. Los dos publishes salieron **limpios, sin asterisco**.

---

## ① LO CERRADO

### El ALTA y el PERFIL (arco de D sobre motor de A)

- **D-379 · el catálogo de razas** (`cat_razas`, 105 filas verbatim con acentos
  verdaderos) — **SUGIERE, jamás impone**: `mascotas.raza` sigue texto libre y
  «Mestizo / No sé» son respuesta de primera clase (letra S59). Un cinturón
  **aborta cualquier migración futura que le ponga un FK desde `mascotas`**:
  *la ausencia del FK ES la letra, no un olvido.*
- **La cláusula del pez → el ACUARIO CON SUJETO PROPIO** (ver ③).
- **`evento_hito_narrativo`** con su catálogo y su clave de idempotencia
  (`_clave_hito_alta`), emitida desde las dos RPCs del alta.
- **El perfil:** serie de peso, `fecha_montaje`, edición de raza, chip con cara,
  A8 con su lib de pendientes, y **las puertas del perfil** con su censo.
- **El token de intento (mitad de D, cableada e INERTE):** nace en el primer
  avance y viaja en los params. **Hoy no se manda** — su puerta es de A y no se
  construyó (ver ②).

### La VITRINA (C sobre motor de A, pieza de B)

- **`v_prestadores_publicos` ensanchada**: `categoria` por servicio, `portadas`
  ordenadas, `clip_url`. **La fuente es la VISTA, jamás la tabla.**
- **`/prestador/[id]` del cliente** + **«Cómo te ven» del prestador** montando
  **la misma pieza** · carrusel **a sangre 4:3** · escalera de portada
  (imagen → poster → logo centrado → monograma) · la voz del mapa ausente.
- **`FichaPrestador` y `ChipEntidad` ensanchados** (B): la portada gana
  RELACIÓN en vez de alto fijo; el chip separa **foto = cara** de
  **sujeto = fallback**.

### La BITÁCORA UNIVERSAL — el Eje 6 con productor

25 conductas con **gestos propios por especie** y **4 de acuario**;
aplicabilidad por `especies_aplicables`/`sujetos_aplicables` con rebote tipado;
**muere el guard `sin_contexto_activo`** — *era la razón por la que el dueño solo
podía anotar si tenía un servicio contratado.*

### Las TRES REGRESIONES DEL DÍA — cazadas y curadas con rojo reproducido

1. **🔴 La fuga de `prestadores`** (39 columnas legibles por cualquiera) →
   cerrada: SELECT de tabla revocado, grants por columna, vista con
   `security_invoker=false`, `obtener_mi_prestador()` DEFINER.
2. **🔴 El 42501 de «Tu negocio»** — **causado por (1)**: `cuenta_comercial_id`
   se coló en la lista de «veredictos internos» siendo un **FK estructural**, y
   **rompió OCHO policies** (entre ellas el INSERT de caso clínico del vet).
   Curado con re-grant; las ocho sensibles siguen cerradas.
3. **🔴 El hub de grooming** — misma raíz, otra columna (`direccion`).
   **Medido: la vista pública NO la expone ⇒ el grant habría sido exposición
   nueva**, deshaciendo S84. Curado con **lector angosto**
   (`obtener_sedes_de_mis_citas`, molde D-455): los ids son **filtro y jamás
   permiso**.

### 🔴 Y UNA QUE NO ERA REGRESIÓN: EL ORÁCULO DE ENUMERACIÓN

`debug_estado_user(email)` — `SECURITY DEFINER`, **sin migración que la creara**,
**ejecutable por `anon`**. Rojo reproducido: con un email devolvía uuid,
`email_confirmed_at`, estado de onboarding, cuentas comerciales, prestadores y
roles. **La clave anon viaja en el bundle.** Cerrada con REVOKE (D-701).
*Apareció barriendo residuos, no auditando features.*

---

## ② LO DIFERIDO, CON DUEÑO Y DISPARO

| ficha | qué | dueño | disparo |
|---|---|---|---|
| **D-694** | el acuario no se oferta por **ausencia de oferta**, no por diseño (22 filas del catálogo listan `pez` o son NULL) | A | arco del acuario **o** primera oferta reservable |
| **D-695** | el glifo de **historia clínica** (el préstamo apuntaba al revés) | B | próximo arco de papeles o registry |
| **D-696** | orientación de fotos del prestador (marco 4:3 ya fijo; falta promover `EncuadreFoto` a `packages/ui`) | C + B | próxima sesión de features |
| **D-697** | `poster_url` del video — **hoy SIN SUJETO** (ninguna portada es video) | C + tren de build | S92+, jamás una build sola por él |
| **D-698** | la ficha sin mapa: **Wizard** sin coordenadas (dato) · **Aurora las tiene** (pregunta abierta de C) | founder + C | reclutamiento de la cohorte |
| **D-699** | los dos ejes de «Tu negocio» (`user_id` vs `owner_profile_id`) | C + A | próximo arco de cuenta comercial o roles |
| **D-700** | **el helper `SECURITY DEFINER` para las 37 policies** + **su instrumento** | A | **S92** |
| **D-701** | **59 DEFINER con `anon`/PUBLIC** en `proacl` | A | **S92** |
| **idempotencia del alta** | la puerta de A para el token de D (contrato servido, no construido) | A | S92+ |

---

## ③ EL ACUARIO — la enmienda que ACHICÓ la deuda dos veces

**Firma founder:** *«el pez se mira; el sistema se cuida»*, y después **el CENSO
POR ESPECIE reemplazando a la «identidad ligera»**.

**Las dos trampas que el arco tenía escritas murieron sin pagarse:** una
identidad ligera **no podía ser fila de `mascotas`** sin dar lo que la letra
niega, y **un pez que muere no podía usar `estado_vida`** (es del acuario). *Con
el censo, si un neón muere el número baja de 5 a 4: no hay registro de vida que
cerrar.* **El censo no contesta las preguntas: las hace desaparecer.**

Construido de motor a pantalla el mismo día: `acuario_composicion` append-only,
puerta única con siete rebotes tipados, lector, wrappers y la Hoja «Quiénes
viven acá» de D.

---

## ④ LOS CUATRO ASTERISCOS, CON SU RELOJ

> **⚠️ ESTA SECCIÓN ES SU ÚNICA MEMORIA.** Medido en S91: **`eas update:view` NO
> expone el estado del árbol** — un publish sucio es **inauditable después**. Si
> no se transcribe en el momento, se pierde.

| # | app | ancla | qué estaba sucio | ¿entraba al bundle? |
|---|---|---|---|---|
| ① | cliente | `5f2af691…*` | `supabase/dev/galeria-curas/**` (C, 11:57:01 vs ancla 11:55:54) | **NO** |
| ② | prestador | `38aed580*` | `apps/cliente/src/components/preview-prestador.tsx` (C, 13:40) | **NO** — probado: cero `import` de `apps/cliente` desde `apps/prestador` |
| ③ | — | — | *el choque que ocurrió CON el guard puesto*: la veda salió verde, otra pista commiteó en la ventana, el bundle salió de otro commit | — |
| ④ | — | — | *el mismo patrón, otra vez* | — |

**LA CAUSA ESTRUCTURAL, medida y no supuesta:** `git worktree list` tiene
worktrees de **B** y **D** y **no tiene una de C** — **C trabaja en el
directorio primario, sobre `main`, el mismo árbol desde el que A publica.**

*El acto único (`scripts/publicar-ota.mjs`) cierra la ventana entre verificar y
bundlear, pero **no puede cerrar la de una pista que ESCRIBE mientras Metro
lee**.* **Los cuatro publishes del cierre salieron limpios porque las cuatro
pistas estaban en cero al mismo tiempo — no por el guard.** La cura pendiente
es la `worktree-detached` que la regla 82 dejó CANDIDATA desde S81.

---

## ⑤ EL RESIDUO — DECISIÓN PENDIENTE DEL FOUNDER, NO OLVIDO

**Quedan 64 cuentas `s91d-*@epetplace.dev`** de las sondas de D.

**Ya limpiado:** las 19 mascotas de las altas de prueba (19 familias distintas,
residuo 0) · las 2 cuentas `s91d-groom-*` con sus 2 familias y 5 mascotas ·
los 2 fixtures de mi propia corrida del verify.

**Lo que falta es una decisión, no un trabajo:** ¿se borran hoy o en S92?
**No las toqué sin orden:** borrar 64 usuarios de `auth` el día del gate, sin
que nadie lo pidiera, no es una decisión de A.

---

## ⑥ OPERATIVO

- **234 migraciones** local = remoto (medido: `ls` / `migration list --linked`).
  **25 son de S91-A** (`20260807170000` → `20260808150000`), **todas con reversa
  escrita ANTES**, veda 76(g) declarada, cinturones in-txn y fixtures con
  ROLLBACK.
- **Dos migraciones nacieron aplicadas y sin registrar** — lo cazó la medición
  del contador, no un aviso. Reparadas con `migration repair`.
- **Los cuatro typechecks y `verify:diseno` en 0** sobre árbol quieto.
- **Lecciones nuevas: L-211 → L-215.** **Deudas: D-692 → D-701.**

---

## ⑦ LOS ERRORES DE ESTA MESA Y DE ESTA PISTA, DECLARADOS

1. **Mío, el más caro:** metí `cuenta_comercial_id` en la lista de columnas
   sensibles **por vecindad en una lista**, no por decisión. Rompió ocho
   policies y tardó horas en aparecer, lejos de donde nació.
2. **Mío:** un cinturón que buscaba PUBLIC con `LIKE '%=X/%'` **abortó una
   migración de seguridad con el agujero abierto**.
3. **Mío:** reporté un hash (`d4bfe5f5`) que **no es objeto del repo** — el pipe
   cortó la línea y llené el hueco (L-200).
4. **Mío:** tres identificadores comidos por backticks en un `git commit -m`
   (zsh los ejecuta). Corregido con un commit encima, no con force-push.
5. **De la mesa, tres veces:** listas de commits pendientes **desactualizadas**
   (doce que eran uno, seis que eran uno, tres que eran cero). Ninguna causó
   daño porque el `merge-base` se corrió igual. *Un merge que nombra commits ya
   fusionados sale verde y deja el acta afirmando algo falso.*
6. **De todos, y por eso es L-214:** tres hipótesis cruzando territorio, las tres
   razonables, las tres parcialmente equivocadas.
