# LETRA DE LA VERIFICACIÓN — v1.0 (PROPUESTA, espera firma)

> **Dictado del founder, 2-ago-2026.** La verificación **deja de ser DE VET y
> pasa a ser DE PLATAFORMA**, con veterinaria como capa extra encima.
>
> **Estatuto:** ⚠️ **PROPUESTA — no rige hasta su firma** (regla 80). Lo que sí
> está medido va marcado como tal; lo que espera decisión, también.
>
> **La pantalla viene DESPUÉS.** Esto es la letra.

---

## §1 · LOS DOS EJES, QUE NO SE MEZCLAN

### ① POR FIGURA JURÍDICA — los cuatro oficios

| figura | documento |
|---|---|
| **empresa** | **RUC** |
| **persona natural** | **cédula** |

### ② POR OFICIO — solo veterinaria, ENCIMA del ①

| quién | documento |
|---|---|
| **clínica / negocio** | **permisos** |
| **vet independiente** | **carnet profesional o equivalente** |

**El ② no reemplaza al ①: se suma.** Una clínica veterinaria constituida como
empresa presenta **RUC (①) + permisos (②)**. Un vet independiente persona
natural presenta **cédula (①) + carnet (②)**.

---

## §2 · LA PUERTA NO PREGUNTA LO QUE YA SABE (Ley 23)

**El documento del eje ① se pide CONTRA EL DATO QUE YA EXISTE, jamás contra uno
nuevo.**

**MEDIDO:** `cuentas_comerciales.tipo_fiscal` — enum **NOT NULL**, ya poblado.
La figura jurídica **ya está declarada** cuando el prestador llega acá: se la
preguntó el wizard de cuenta comercial (§6.5).

> **Volver a preguntarla sería, además de redundante, PEOR: abriría la puerta a
> que las dos respuestas se contradigan.** Y el día que se contradigan, ninguna
> de las dos es la verdad — porque nada dice cuál gana.

### ⚠️ PERO EL MAPEO NO ES 2→2. SON CUATRO FIGURAS, Y LA LETRA TIENE QUE DECIR DÓNDE CAE CADA UNA

**MEDIDO — `tipo_fiscal_enum` tiene CUATRO valores:**

```
persona_natural · persona_natural_obligada · persona_juridica · entidad_sin_fines_lucro
```

**El dictado nombra dos (*"empresa"* / *"persona natural"*). Las otras dos no
caen solas:**

- **`persona_natural_obligada`** — persona natural **obligada a llevar
  contabilidad**. **En Ecuador SÍ tiene RUC.** *Tratarla como "persona natural" y
  pedirle cédula le pediría el documento que no la identifica como negocio.*
- **`entidad_sin_fines_lucro`** — fundaciones y refugios. **Tienen RUC**, y son
  justamente el actor que `EL NORTE` nombra como parte del ecosistema.

**PROPUESTA DE MAPEO, a firmar:**

| `tipo_fiscal` | documento del eje ① | por qué |
|---|---|---|
| `persona_natural` | **cédula** | no tiene RUC |
| `persona_natural_obligada` | **RUC** | lo tiene, y es lo que la identifica como negocio |
| `persona_juridica` | **RUC** | el caso "empresa" del dictado |
| `entidad_sin_fines_lucro` | **RUC** | lo tiene |

> **La regla queda más simple de lo que parece, y conviene escribirla así:
> CÉDULA solo para `persona_natural`; RUC para las otras tres.** *Un binario que
> se decide por lo que el negocio TIENE, no por cómo se lo llama.*

**Distribución hoy (medida):** **6 `persona_natural` · 1 `persona_juridica`.**
Las otras dos figuras **no tienen ni un caso vivo** — se decide para que no
sorprendan, no porque urjan.

---

## §3 · ⚠️ EL PAÍS DEL DOCUMENTO NO ES EL PAÍS DEL NEGOCIO

**Dictado del founder: *"ecuatoriano o de cada país"*.**

> **Un vet colombiano ejerciendo en Quito tiene tarjeta profesional COLOMBIANA.**
> **El país del documento SE DECLARA, jamás se deriva del `country_code`.**

**Es el mismo caso que P21 protege — y que ya nos mordió con el teléfono en S84:**
las siete filas de `prestadores` tienen `country_code='EC'` y **el WhatsApp del
founder es `+57`**. *Derivar el país del perfil habría escrito `+593` sobre un
número colombiano; acá escribiría "cédula ecuatoriana" sobre una tarjeta
colombiana.* **Mismo error, otro campo.**

### 🔴 HUECO MEDIDO: NO EXISTE DÓNDE GUARDARLO

`prestador_documentos` tiene: `tipo · nombre · archivo_url · fecha_emision ·
fecha_vencimiento · estado · revisado_por · revisado_en · notas_revision`.
**Ninguna columna dice de qué país es el documento.**

**Consecuencia para el diseño, no para después:** si la pantalla se construye sin
esa columna, **el país o se pierde o se mete en `nombre`** —que es texto libre y
hoy guarda cosas como *"WhatsApp Image 2026-05-08 at 8…"*—. **Nace con la
columna o nace mintiendo.**

---

## §4 · LO QUE YA EXISTE Y NO HAY QUE CONSTRUIR

**MEDIDO — `prestador_documentos.tipo` ya admite OCHO tipos:**

```
cedula · ruc · titulo_profesional · registro_senescyt
permiso_funcionamiento · certificado_vacunas · seguro · otro
```

> **`cedula` y `ruc` —los dos del eje ①— YA ESTÁN.** El CHECK no hay que tocarlo
> para el eje ①. *Estaban ahí desde antes de que la verificación fuera de
> plataforma: el esquema se adelantó a la letra.*

### Y EL CICLO DE REVISIÓN **SIRVE PARA LOS CUATRO OFICIOS** — respuesta medida

| función | ¿atada a vet? |
|---|---|
| `revisar_documento_prestador` (el veredicto del admin) | **NO** |
| `insertar_documentos_batch` (la carga) | **NO** |
| `trg_..._notif_cambio_estado` (el aviso) | **NO** |
| `_trg_ps_verificacion_profesional` (el **disparador**) | **SÍ** |
| `activar_prestador` | **SÍ** (menciona vet) |

> **El ciclo §14.2 es GENÉRICO. Lo atado a veterinaria es el DISPARADOR, no el
> motor.** ⇒ **No hay que reconstruir el ciclo: hay que ensanchar quién lo
> dispara.** *Es la mejor noticia de esta medición, y es lo que hace que esta
> letra sea barata.*

**En el repo, en cambio, la PANTALLA sí es de vet:** solo
`veterinaria/verificacion.tsx` escribe documentos. **El wrapper
`prestador-documentos.ts` es genérico.** *Confirma la sospecha del dictado: está
atado a vet en la pantalla, no en el motor.*

---

## §5 · SIN VERIFICACIÓN, EL PRESTADOR OPERA IGUAL

**DECISIÓN DE LA MESA, declarada y a firmar:**

> **Lo que falta sin verificar es el SELLO, no la OPERACIÓN.**

**Su fundamento es letra ya firmada:** `MODELO_PRESENCIA` §8 — **la presencia es
palanca, no peaje**. Verificar **da un sello**; no verificar **no cierra la
puerta**.

**Y hay un argumento de negocio que apunta igual:** el prestador que no puede
operar hasta que un admin le revise un papel **es un prestador que abandona el
onboarding**. *La verificación tiene que ser algo que el prestador QUIERA, no un
peaje que soporte.*

> **⚠️ SI EL FOUNDER QUIERE LO CONTRARIO, ES ENMIENDA DE §8 CON FIRMA — no un
> detalle de esta letra.** Se dice así para que la decisión no se cuele por la
> puerta de atrás: bloquear la operación sería **derogar una ley firmada**, y eso
> se hace de frente.

---

## §6 · LO QUE ESTA LETRA **NO** DECIDE

1. **Qué documento vale como *"carnet profesional o equivalente"* fuera de
   Ecuador.** El dictado dice *"o equivalente"* y **eso no es un catálogo**:
   hasta que exista un vet no-ecuatuoriano real, cualquier lista sería inventada
   (L-180).
2. **Los vencimientos.** `fecha_vencimiento` existe y `estado` admite `vencido`,
   **pero nadie los computa**. Es `LETRA_PERFIL_S79` §7, que sigue en propuesta
   con su disparo: *el primer documento real con fecha*.
3. **La pantalla.** Viene después, en S85.

---

## §7 · LO QUE HACE FALTA PARA CONSTRUIR — el orden

1. **FIRMAR** el mapeo de §2 (las cuatro figuras) y la decisión de §5.
2. **La columna de PAÍS del documento** (§3) — **antes de la pantalla**, o el dato
   nace perdido.
3. **Ensanchar el DISPARADOR** (§4): hoy solo dispara con oferta médica.
4. **La pantalla**, que deja de vivir en `veterinaria/` y pasa a Cuenta.

> **El orden importa: 2 antes de 4.** Construir la pantalla primero obligaría a
> re-tocarla cuando aparezca la columna — y peor, **los documentos cargados
> mientras tanto no tendrían país**, que es exactamente el dato que §3 protege.
