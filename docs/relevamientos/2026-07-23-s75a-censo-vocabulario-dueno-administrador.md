# S75-A0 · CENSO DE VOCABULARIO `dueño` / `administrador` — POR SUPERFICIE, CON LITERAL

> **Estado: ENTREGADO A LA MESA. LA SESIÓN FRENA ACÁ.**
> La decisión (renombrar / convivir / aparte) es de mesa con el literal a la
> vista — ninguna sesión la deduce. **Bloquea A3 (D-513)**, que necesita saber
> con qué nombre nace su gate. **No bloquea A2 (D-490)**, que gatea por
> `profesional`.
> Método: por SUPERFICIE, jamás por helper (L-164 candidata, espíritu). Todo lo
> de abajo es literal relevado contra la DB viva y el árbol de hoy — cero
> deducción, cero memoria (L-141).

---

## 1. EL HALLAZGO QUE ORDENA LA DECISIÓN

**`dueño` no nombra una cosa: nombra TRES, en tres ejes distintos.** Cualquier
opción que la mesa elija tiene que decir qué hace con las tres, no con "el rol
dueño".

| # | Qué nombra | Dónde vive | Cómo se sabe |
|---|---|---|---|
| **(a)** | El **rol administrativo acumulable** del vínculo persona×negocio | fila en `empleado_roles` | `CHECK (rol = ANY (ARRAY['dueño','profesional','recepcion']))` |
| **(b)** | El **TITULAR** — quien creó la cuenta | **NO es una fila**: es un *fallback hardcodeado* dentro de `empleado_tiene_rol` | `'dueño' = ANY (p_roles) AND EXISTS (SELECT 1 FROM prestadores p WHERE p.id = p_prestador_id AND p.user_id = auth.uid())` |
| **(c)** | Un **eje LEGACY distinto**, congelado en S73 | columna `prestador_empleados.rol` | `CHECK (rol = ANY (ARRAY['dueño','empleado']))` — `COMMENT`: *"CONGELADA S73 (LETRA_EQUIPO §2)"* |

**Y la letra firmada YA rompió el amalgama que el motor mantiene.**
`LETRA_ROLES_EQUIPO_S74` §4 separa explícitamente los dos primeros:

> *"Los administradores son poderosos y **removibles**; el titular no aparece
> como opción del selector."* · *"El titular no se quita desde la app."*

En el motor de hoy, (a) y (b) son **el mismo string**. Consecuencia literal, y
es una que conviene mirar antes de decidir: **quitarle al titular su fila
`dueño` de `empleado_roles` NO le quita el poder** — el brazo (b) del helper lo
repone solo. Es decir: *el motor ya cumple la regla del titular irreducible de
la letra §4, por el fallback, sin que nadie lo haya diseñado para eso.*

**Lo que la mesa decide, entonces, no es "cómo se llama el rol": es si (a) y
(b) siguen compartiendo nombre.**

---

## 2. LA TABLA — POR SUPERFICIE

### 2.1 · MOTOR — dónde el valor está en piedra (CHECKs)

| Superficie | Literal | Nota |
|---|---|---|
| `empleado_roles.rol` | `CHECK (rol = ANY (ARRAY['dueño','profesional','recepcion']))` | **`administrador` NO EXISTE como valor.** Eje (a) |
| `prestador_empleados.rol` | `CHECK (rol = ANY (ARRAY['dueño','empleado']))` | Eje (c), **CONGELADA S73** — pero con lector TS vivo (§2.4) |
| `empleado_invitaciones.rol` | `CHECK (rol = 'empleado')` | **Un solo valor.** La letra §5.2 quiere elegir rol AL invitar: eso pide tocar este CHECK |

### 2.2 · MOTOR — la puerta única y sus consumidores

| Superficie | Literal | Nota |
|---|---|---|
| `empleado_tiene_rol(p_prestador_id, p_roles[])` | brazo 1: `er.rol = ANY (p_roles)` · brazo 2: `'dueño' = ANY (p_roles) AND EXISTS(… prestadores.user_id = auth.uid())` | **LA puerta.** El brazo 2 es el eje (b) |
| `user_acceso_clinico_a_mascota(p_mascota_id)` | `empleado_tiene_rol(pe.prestador_id, ARRAY['dueño','profesional'])` | El gate D-464 de S73 |
| `obtener_contacto_reserva_cita(p_cita_id)` | `ARRAY['dueño','profesional','recepcion']` | S74. **La única función de todo `public` que nombra `recepcion`** |
| `empleado_roles_select` [SELECT] | `… empleado_tiene_rol(pe.prestador_id, ARRAY['dueño'])` | |
| `empleado_roles_insert_duenio` [INSERT] | `… ARRAY['dueño']` | *quien asigna roles* |
| `empleado_roles_delete_duenio` [DELETE] | `… ARRAY['dueño']` | *quien quita roles* |

**Las 14 policies clínicas NO nombran ningún rol**: llaman a
`user_acceso_clinico_a_mascota` y heredan su `ARRAY['dueño','profesional']`.
Renombrar el valor en el helper las mueve a las 14 sin tocarlas. Son:
`alergia_select` · `caso_abierto_select` · `caso_cerrado_select` ·
`caso_transferido_select` · `certificado_select` · `condicion_select` ·
`examen_select` · `hc_select` · `intervencion_select` ·
`medicacion_adm_select` · `medicacion_select` · `vacuna_select` ·
`eventos_mascota_select` · `perfil_vigente_select`.

**Superficie total del literal `'dueño'` como valor de rol en el motor: 3 CHECKs
+ 1 helper + 2 funciones + 3 policies = 9 lugares en piedra.** (Las otras ~40
funciones cuyo body dice "dueño" lo usan como PROSA o como nombre de variable —
`v_dueño_user_id`, *"Solo dueños de prestador pueden…"* —, o pertenecen al
dominio `codueño`; ver §3.)

### 2.3 · DATOS — las filas de hoy

```
empleado_roles:        dueño → 5      (profesional → 0, recepcion → 0)
prestador_empleados:   dueño/activo=true  → 5
                       empleado/activo=false → 5
```

Las 5 filas `dueño` de `empleado_roles` **son el backfill de S73**
(`20260721210000`, `INSERT … WHERE pe.rol = 'dueño'`), y en las 5 se cumple
`prestador_empleados.user_id = prestadores.user_id` (verificado en S74): **son
titulares, 5/5**. O sea: **hoy NO existe en la DB un solo `dueño` que no sea
titular** — la distinción (a)/(b) todavía no tiene un caso vivo que la fuerce.
Esto abarata cualquiera de las tres opciones, y es la razón por la que decidir
ahora es más barato que decidir después.

### 2.4 · APP — TypeScript

| Archivo:línea | Literal | Eje |
|---|---|---|
| `packages/api/src/wrappers/equipo.ts:23` | `export type RolEquipo = 'dueño' \| 'profesional' \| 'recepcion';` | (a) |
| `packages/api/src/wrappers/equipo.ts:25` | `const ROLES_VIVOS: readonly RolEquipo[] = ['dueño','profesional','recepcion'];` | (a) |
| `packages/api/src/wrappers/equipo.ts:94` | `rol: Exclude<RolEquipo, 'dueño'>` *(asignar)* | (a) |
| `packages/api/src/wrappers/equipo.ts:108` | `rol: Exclude<RolEquipo, 'dueño'>` *(quitar)* | (a) |
| `apps/prestador/src/app/negocio/equipo.tsx:120` | `rol === 'dueño' ? t('equipo.rolDueno') : …` | (a) |
| `apps/prestador/src/app/negocio/equipo.tsx:122` | `rol: Exclude<RolEquipo, 'dueño'>` | (a) |
| `apps/prestador/src/app/negocio/equipo.tsx:295` | `miembro.roles.includes('dueño') ? …` | (a) |
| `packages/api/src/wrappers/titular.ts:21` | `.eq('rol', 'dueño')` **sobre `prestador_empleados`** | **(c)** |

**Ojo con la última fila — es un hallazgo, no una entrada más:** `titular.ts`
resuelve el titular leyendo la columna que S73 declaró **CONGELADA**. Funciona
hoy (5/5 filas lo sostienen) y no es urgente, pero significa que el eje (c) no
está muerto: tiene un lector vivo, y ese lector es el que le da su `empleado_id`
a **toda franja de horario** del negocio (V0, S67).

### 2.5 · APP — strings (la voz)

| Archivo:línea | Literal |
|---|---|
| `apps/prestador/src/i18n/es.ts:1556` | `rolDueno: 'Dueño'` |
| `apps/prestador/src/i18n/en.ts:1414` | `rolDueno: 'Owner'` |

**`administrador` tiene CERO ocurrencias en todo el código** (`packages/` +
`apps/`, `.ts`/`.tsx`). Existe **solo en la letra firmada** y en los docs. Hoy
la app le dice **"Dueño"** a la persona que la letra §2 llama
**"Administrador"** — la divergencia voz↔letra ya está viva en pantalla.

---

## 3. LO QUE **NO** ES (para que la mesa no lo confunda)

El grep de `dueño` en la DB devuelve ~40 funciones y ~20 policies más. **Casi
todas son de otro dominio y NO entran a esta decisión:**

- **`codueño`** — co-propietario de una MASCOTA (`mascota_codueño`,
  `mascotas_select_codueño`, `_user_es_codueño_mascota`, `accion_destructiva_*`).
  Otro eje, otro sujeto: es familia, no equipo. **Fuera de alcance.**
- **`dueño` como prosa o nombre de variable** — `v_dueño_user_id`,
  `_notificar_dueño_prestador`, *"Solo dueños de prestador pueden consultar
  email status"*. No es un valor de rol; renombrarlo sería cosmética.
- **`dueño` = el pet parent** — en decenas de comentarios y voces de producto
  (*"el dueño ve el parte"*). **Es la palabra más cargada del ecosistema**, y
  eso es en sí un argumento a mirar: hoy `dueño` significa *pet parent* en el
  producto entero y *administrador del negocio* en el motor de equipo.

---

## 4. LAS TRES OPCIONES, CON SU COSTO LITERAL

Ninguna es recomendación de la sesión: es lo que cuesta cada una.

### (1) RENOMBRAR — `'dueño'` → `'administrador'` en el eje (a)
- **Toca:** 1 CHECK (`empleado_roles`) + el brazo 1 del helper + 2 funciones +
  3 policies + 8 líneas TS + 2 strings. Las 14 clínicas viajan solas.
- **Migración:** sí, y con backfill de las 5 filas.
- **El punto fino:** el brazo 2 del helper (el titular) **necesita quedarse con
  un nombre**. O el titular pasa a portar `'administrador'` — y entonces (a) y
  (b) siguen amalgamados con otro nombre, no se resolvió nada —, o el fallback
  se separa (`empleado_es_titular()`), que es la única variante que **cumple la
  letra §4 de verdad**.
- **Gana:** una sola palabra, motor y letra hablando igual. Muere la
  colisión `dueño`=pet parent.

### (2) CONVIVIR — el valor sigue siendo `'dueño'`, la VOZ dice "Administrador"
- **Toca:** 2 strings. Cero motor, cero migración.
- **Cuesta:** el precedente `'otro'` de S72 — *una palabra, dos significados*.
  Toda sesión futura que lea el CHECK va a creer que `dueño` = titular (que es
  lo que hoy significa, 5/5). **Es exactamente el error que la letra §3 declaró
  PROHIBIDO** al matar `especialista`.

### (3) APARTE — `'administrador'` nace como CUARTO valor, `'dueño'` queda como titular
- **Toca:** 1 CHECK (agregar valor) + los gates que quieran incluirlo + TS +
  strings. **Sin backfill destructivo.**
- **Gana:** (a) y (b) quedan separados **por construcción** — `dueño` pasa a
  significar *titular* (que es lo que ya significa en los datos) y
  `administrador` nombra el rol removible de la letra.
- **Cuesta:** todo gate administrativo pasa a escribirse
  `ARRAY['dueño','administrador']` — más largo, y hay que revisar los 3
  gates de `empleado_roles` uno por uno (¿el administrador asigna roles? **la
  letra §10.2 dice que NO: solo el titular nombra administradores** → esos 3
  gates se quedarían en `ARRAY['dueño']` tal cual están, y eso es un argumento
  fuerte a favor de esta opción: **el motor de hoy ya implementa la regla
  firmada, sin tocarlo**).

---

## 5. LO QUE LA MESA TIENE QUE RESPONDER

1. **¿(a) y (b) comparten nombre, sí o no?** Es la pregunta madre; las tres
   opciones son consecuencia de ésta.
2. Si van separados: ¿`dueño` se queda con el titular (opción 3, cero backfill)
   o el titular se muda a un helper propio (opción 1 + `empleado_es_titular`)?
3. **`empleado_invitaciones.rol` está clavado en `'empleado'`** — elegir rol al
   invitar (letra §5.2) pide tocar ese CHECK. ¿Entra en esta decisión o va con
   la superficie de invitar de B?
4. **`titular.ts` lee la columna congelada** (§2.4). ¿Se deja (funciona, 5/5) o
   se migra a `empleado_roles` cuando se toque?

---

## 6. VERIFICACIÓN

Todo el literal de este censo salió de la DB viva del proyecto linkeado
(`information_schema`, `pg_constraint`, `pg_policies`, `pg_proc`,
`pg_get_functiondef`) y de grep sobre el árbol en `3591db2`. Cero escritura:
el censo es solo lectura.
