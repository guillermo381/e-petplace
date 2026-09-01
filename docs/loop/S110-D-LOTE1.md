# S110-D · LOTE 1 — LAS DOS MEDICIONES QUE DECIDEN LA FORMA

> **Pista D de S110 · SOLO LECTURA.** Cero DDL, cero backfill, cero seeds, cero
> pantallas, cero propuesta de modelo. No se tocó el motor de pagos.
> **Fecha:** 1-sep-2026 · **Rama:** `pista/s110-d` · **Base:** `main` `202ff494`.
> **Objeto medido:** proyecto Supabase `zyltipqscdsdsxnjclhp`, vía
> `supabase --experimental db query --linked` (rol `postgres`).

---


---

## 🔴 CORRECCIÓN A LA VISTA — EL FRENO DE PUERTA DE ABAJO YA NO RIGE (1-sep, 3ª pasada)

**`docs/LETRA_ADOPCION.md` v1.0 EXISTE.** Vive en `refs/heads/pista/s110-a`,
commit **`7d76380f`** — *«S110-A · registra LETRA_ADOPCION v1.0 y archiva la de
padrinazgo, en el mismo acto»*, 346 líneas, md5 `53031ac9…`.
Lo trajo la pista E; **lo verifiqué yo antes de aceptarlo**:
```
refs totales: 141
LETRA_ADOPCION.md            -> 1 ref  (refs/heads/pista/s110-a)
CONTROL+ PADRINAZGO.md       -> 72 refs
CONTROL- LETRA_ZZZ_INEXISTENTE.md -> 0 refs
```

**Y el discriminador que decide de quién fue el error, porque no es el mismo en
los dos casos:**
```
commit de la letra : 2026-09-01 00:41:44 -05
mi commit del lote1: 2026-09-01 00:23:59 -05   (y la medición fue ANTES)
```
⇒ **mi cero era VERDADERO en el momento en que lo medí.** No se rompió el
instrumento: **se puso viejo.** La letra se registró dieciocho minutos después
de que yo publicara. *(La pista E llegó al mismo cero por otra causa —un
`find … | head -20` que truncó la salida—: el suyo fue instrumento, el mío fue
reloj. Dos ceros iguales con causas distintas.)*

**Es `L-166` en su forma exacta** —*todo dato vivo se lee al momento de usarlo,
jamás de un reporte anterior*— **y el error que sí es mío es de FORMA: publiqué
un freno como hecho permanente cuando era una observación con hora.** Un freno
sin su timestamp se lee como una propiedad del mundo. *Corolario que dejo
escrito: un freno de puerta declara la hora en que midió, igual que un baseline
declara contra qué midió.*

**⚠️ Y un segundo error mío, éste sin atenuante:** el freno de abajo dice *«las
41 ramas locales y remotas»*. **Nunca medí 41** — lo inferí del listado de
worktrees. Son **141 refs**. Es `L-141` cometida por mí en el mismo párrafo
donde invocaba el rigor: *un número escrito en vez de medido*.

### Lo que la letra real dice, y qué le pasa a este documento

**Nada de ① ni de ② se cae.** El §12 real coincide con los seis enunciados que
viajaban en mi mandato, y **§0 pide exactamente esta medición**, literal:

> *«⚠️ **Su precondición es de objeto y hay que medirla ANTES de construir**
> (§12 ①): la casa entera trata `familia_id` como la llave del dueño. **Si no
> admite vacío, la figura no cambia pero su forma sí: el refugio es la familia
> hasta la entrega**, y la adopción es la transferencia. *Esta letra firma el
> QUÉ; la forma la decide la medición, no una preferencia.*»*

⇒ **El veredicto de ① es la respuesta a esa pregunta: no admite vacío, así que
rige la segunda rama — el refugio es la familia hasta la entrega.**

**Y la contradicción que denuncié abajo está CURADA por el propio objeto:** §0
deroga la firma ③ del 25-ago con todas las letras, y el mismo commit de A
**archiva** la letra vieja. *La casa hizo lo correcto: no dejó las dos
conviviendo.* **La denuncia era correcta como riesgo y ya no describe el
presente — se conserva abajo tachada en su encuadre, no borrada.**

---

## ~~⚠️ FRENO DE PUERTA~~ — VENCIDO, ver la corrección de arriba (se conserva como registro de lo que era cierto a las 00:23)

**Medido contra el REPO, en las 41 ramas locales y remotas:**

```
$ for b in $(git branch -a --format='%(refname:short)' | grep -v HEAD); do
    git cat-file -e "$b:docs/LETRA_ADOPCION.md" 2>/dev/null && echo "$b"; done
(ninguna)
$ git log --oneline --all -- docs/LETRA_ADOPCION.md
(vacío)
```

**`docs/LETRA_ADOPCION.md` v1.0 no existe en ninguna rama, ni existió nunca.**
Lo que esta pista obedece es el **§12 transcrito literalmente en su mandato** y
la decisión de §0 también transcrita ahí. **No se midió contra el documento**,
porque no hay documento. Es el precedente del freno 76(b) / **L-142**: la letra
se anunció y su literal no viajó.

🔴 **Y hay una segunda letra, ésta sí en el repo, que dice lo contrario.**
`docs/LETRA_ADOPCION_PADRINAZGO.md` **v1.0, 25-ago-2026**, firmada:

> **§3** *«Lo que se crea es una cuenta de e-PetPlace con los datos de la
> mascota. Eso es todo lo que hace v1.»*
> *«`MODELO_PRODUCTO` §4.4 ya contempla que una adopción **es** una
> transferencia entre familias… **El motor lo soporta; esta letra no lo activa
> en v1** — se declara para que nadie lo dé por construido ni lo dé por
> descartado.»*
> **§4 · LO QUE NO ENTRA EN v1:** *«…transferencia del expediente del refugio a
> la familia · qué pasa con el expediente si la adopción se cae.»*

**Mi mandato (firma del 31-ago) dice que el expediente empieza en el rescate y
que la adopción CAMBIA la familia. La letra del 25-ago dice que eso NO entra en
v1.** La del 31 es posterior y manda; **la del 25 sigue en el repo sin
enmendar.** No lo resuelvo — no es mío. Lo declaro porque el canon ya se cobró
tres veces el mismo precedente (*el magenta S83, la plata S83, la plata S88*):
***dos letras firmadas que se contradicen son peores que una equivocada, porque
cualquiera cita la que le conviene y está «en regla».***

---

## 🔴 HALLAZGO DE INSTRUMENTO — HAY ARCHIVOS FUENTE QUE **TODO** `grep` DE ESTA CASA SALTA EN SILENCIO

**Esto va primero porque invalida mediciones ajenas, no sólo las mías.**

Durante ② afirmé, con `grep`, que `crearFamiliaConPrimeraMascota` **no tenía un
solo llamador en `apps/`**. Era **falso**. El discriminador:

```
ugrep(shadow) archivo directo:    (vacío)
grep REAL     archivo directo:    3
ugrep(shadow) -rn apps/:          0
git ls-files apps/cliente/src/components/alta/PasoCierre.tsx
  -> apps/cliente/src/components/alta/PasoCierre.tsx     (TRACKEADO)
```

**Causa, medida en dos pasos.** ① `grep` no es el binario: es una función de
shell del snapshot de la sesión, que lo shadowea con `ugrep` y la bandera
**`-I` (saltar binarios)**:

```
42: function grep {
51:   ARGV0=ugrep "$_cc_bin" -G --ignore-files --hidden -I --exclude-dir=.git ...
```

② El archivo **contiene un byte NUL**, así que grep lo clasifica como binario:

```
$ command grep -n crearFamiliaConPrimeraMascota .../PasoCierre.tsx
Binary file apps/cliente/src/components/alta/PasoCierre.tsx matches
```

⇒ el binario real dice *«matches»* y **suprime las líneas**; el shadow con `-I`
**lo salta entero y devuelve CERO, sin una palabra.**

**Alcance, censado sobre los archivos trackeados (no sobre el disco):**

```
archivos .ts/.tsx trackeados: 743
que grep ve como BINARIO   : 2
    apps/cliente/src/components/alta/PasoCierre.tsx   | NUL
    supabase/functions/video-consumo/index.ts          | NUL
```

**Son dos, y los dos importan:** el primero es **el cierre del alta de mascota**
—el archivo exacto que decide ②— y el segundo es una edge function de video.
*Cualquier censo por `grep` que los haya tocado devolvió un cero limpio,
confiado y falso.* Es la clase de **`L-459`** en su forma más cara: **un
instrumento que no puede producir su rojo**, y que además **presenta su ceguera
como resultado**.

**Cura de esta pista (no se cura la casa: no es mi territorio):** todo lo que
sigue del lado repo se midió con un buscador propio a nivel de bytes sobre
`git ls-files`, **validado con control positivo y negativo antes de usarlo**:

```
CONTROL+ 'crearFamiliaConPrimeraMascota' en apps/ -> 3 líneas  (grep daba 0)
CONTROL- 'funcionQueNoExisteControlNegativo'      -> 0 líneas
```

📌 **Queda servido a A como ficha:** el shadow de `grep` con `-I` convierte un
archivo fuente con un NUL en un cero silencioso, **en todas las pistas a la
vez**. Los dos archivos son trackeados y el NUL no debería estar ahí.

---

## ✅ RE-VERIFICACIÓN ORDENADA POR LA MESA (1-sep, posterior a la publicación)

**Orden:** re-verificar SOLO contra los dos archivos con NUL, con buscador a
nivel de bytes; no re-correr el censo entero. **Hecho.** Los patrones que este
censo corrió con `grep` sobre `.ts/.tsx`, pasados byte a byte por
`PasoCierre.tsx` y `video-consumo/index.ts`:

```
CONTROL+ crearFamiliaConPrimeraMascota   3 hits en PasoCierre · 0 en video-consumo  ✅
CONTROL- patronQueNoExisteJamas          0 · 0                                      ✅

familia_id / familiaId          0 · 0     -> ①e NO estaba subcontado
tiene_familia / tieneFamilia    0 · 0     -> ② el censo del guard NO estaba subcontado
mascotas_count / mascotasCount  0 · 0     -> ② «ninguna pantalla lo lee» SOBREVIVE
onboarding                      0 · 0     -> el censo de redirects NO estaba subcontado
obtenerMascotasDeFamilia        0 · 0     ·  receptor/entrega_  0 · 0
Tabs.Screen 0 · 0               ·  suscripcion/recurrent 0 · 0
```

**NINGÚN VEREDICTO CAMBIA.** Y lo que importa de esto es lo que confirma: **②
se apoya en un CERO** —*«`mascotas_count` viaja y nadie lo lee»*— **y un cero
era exactamente lo que el instrumento defectuoso fabricaba.** Ahora ese cero
está verificado con un instrumento que produce sus dos colores, en vez de
heredado del que no podía.

**Dos cosas que la re-verificación sí destapó, y se anotan en vez de taparse:**

1. **Hubo un SEGUNDO cero falso del mismo grep**, ya superado por lectura
   directa pero no registrado hasta ahora: el barrido
   `crear|agregar|await .*Familia` sobre `components/alta/` devolvió vacío, y
   **`agregarMascotaAFamilia` tiene 3 hits ahí** (`:6`, `:34`, `:238`).
   *Fueron dos ceros falsos del mismo archivo, no uno.*
2. **`PasoCierre.tsx` tiene 4 `router.replace`/`push` que el censo de redirects
   nunca vio** — pero **cero ocurrencias de `onboarding`**: no redirige HACIA el
   onboarding, es la SALIDA de él (`salir(MODO[modo].salida)` en `:115-118`,
   `:244`, `:359`, `:386`, después de `crearFamiliaConPrimeraMascota` en
   `:230`). ⇒ **refuerza ② en vez de cambiarlo**: la única salida del
   onboarding corre después de crear la mascota, y ahora está medida en el
   archivo que la ejecuta.

**Regla que esta pista adopta de acá en adelante (punto 2 de la mesa):** todo
barrido de repo corre con **control positivo y negativo** — un patrón cuyo hit
ya conozco y uno cuyo cero ya conozco. *Un instrumento que no puede producir su
rojo no está midiendo.*

---

# ① ¿PUEDE EXISTIR UNA MASCOTA SIN FAMILIA?

## VEREDICTO

> **NO — `mascotas.familia_id` es NOT NULL. Pero eso NO cierra la rama del
> refugio: «familia» hace rato que no significa «hogar humano». El objeto ya
> tiene TRES tipos de familia sin persona, DOS corren en producción, y el
> valor `virtual_refugio` YA ESTÁ EN EL CHECK — con cero escritores y cero
> filas. La rama B de la letra no es construcción nueva: es la máquina del
> walk-in con otro valor de `tipo`.**

### a) La columna — medido contra el OBJETO

```
attnum  columna      tipo   not_null  default
20      familia_id   uuid   true      (ninguno)
 2      user_id      uuid   false     (ninguno)     <- legacy, nullable
17      refugio_id   uuid   false     (ninguno)
15      origen       text   true      (ninguno)
```
```
mascotas_familia_id_fkey   FOREIGN KEY (familia_id) REFERENCES familia(id) ON DELETE RESTRICT
mascotas_user_id_fkey      FOREIGN KEY (user_id)    REFERENCES auth.users(id) ON DELETE SET NULL
mascotas_refugio_id_fkey   FOREIGN KEY (refugio_id) REFERENCES refugios(id) ON DELETE SET NULL
```

**Control del instrumento:** `BIO_EXPEDIENTE` afirma que `origen` es *«NOT NULL
sin default»*. La consulta lo devuelve así, y devuelve `microchip` como
nullable ⇒ **discrimina**, no dice `true` a todo.

⚠️ **Divergencia doc↔objeto, de paso:** `BIO_EXPEDIENTE` línea 1265 dice *«Si
`origen='refugio'`, `refugio_id` NOT NULL»*. **El CHECK vivo no lo exige** —
sólo la implicación inversa:
```
mascotas_origen_coherencia_check
  CHECK (((criadero_id IS NULL) OR (origen='criadero'))
     AND ((refugio_id  IS NULL) OR (origen='refugio'))
     AND (NOT ((criadero_id IS NOT NULL) AND (refugio_id IS NOT NULL))))
```
Y el dato lo confirma: **1 mascota con `origen='refugio'` y 0 con `refugio_id`
no nulo.** La tabla `refugios` tiene **0 filas**. *El doc describe de más.*

### b) LO QUE CUELGA DE ESO — 23 policies en 15 tablas

Las 9 de `mascotas`, literales. **Ninguna lectura ni escritura humana esquiva
estas cinco funciones:**

```
mascotas_insert_due            [INSERT] CHECK: ((user_id = auth.uid())
                                          OR ((familia_id IS NOT NULL)
                                          AND _user_es_titular_familia(familia_id, auth.uid())))
mascotas_select_codueño        [SELECT] USING: _user_es_codueño_mascota(id, auth.uid())
mascotas_select_prestador_con_acceso [SELECT] USING: user_tiene_acceso_a_mascota(id)
mascotas_select_admin          [SELECT] USING: is_admin()
mascotas_update_familia        [UPDATE] USING/CHECK: user_es_familiar_adulto_de_mascota(id)
mascotas_update_codueño        [UPDATE] USING/CHECK: _user_es_codueño_mascota(id, auth.uid())
mascotas_update_admin          [UPDATE] USING/CHECK: is_admin()
mascotas_delete_codueño        [DELETE] USING: _user_es_codueño_mascota(id, auth.uid())
mascotas_delete_admin          [DELETE] USING: is_admin()
```

**Control:** las tres tablas que el canon declara sin RLS salen sin RLS
(`cat_bancos`, `cat_paises`, `cat_tipos_documento_titular`: `rls_on=false`,
`0 policies`), y `mascotas`/`familia`/`refugios` salen con 9/6/5 ⇒ el
instrumento discrimina.

🔴 **La bisagra, y es la policy más cargada del bloque:**

```
familia_miembro_insert_titular_o_primero  [INSERT]
CHECK: (_user_es_titular_familia(familia_id, auth.uid())
        OR ((NOT _familia_tiene_miembros_vigentes(familia_id))
            AND (user_id = auth.uid())
            AND (rol = 'adulto_titular')))
```

**Leída literal: cualquier usuario autenticado que conozca el `familia_id` de
una familia sin miembros vigentes puede insertarse como su titular.** Es
exactamente el gesto que la adopción necesita — *y también el que hay que
gatear.* **Hoy hay 67 familias en ese estado** (ver (f)).

⚠️ **NO EJERCIDO, y lo declaro en vez de afirmarlo:** no probé si un
`familia_id` ajeno es alcanzable por un no-miembro (la `SELECT` de `familia`
está gateada por `_user_es_miembro_familia`). **Ejercerlo exigía escribir, y
esta pista no escribe.** Queda como pregunta con dueño, no como puerta abierta.

### c) Los bodies (regla 40 — jamás el nombre)

**Control:** la consulta incluyó un nombre inventado; devolvió **4 filas para
las 4 reales y 0 para la falsa**.

```sql
-- _user_es_titular_familia
SELECT EXISTS (SELECT 1 FROM familia_miembro
  WHERE familia_id=p_familia_id AND user_id=p_user_id
    AND rol='adulto_titular' AND hasta IS NULL);

-- user_es_familiar_adulto_de_mascota   ← DOS BRAZOS
SELECT auth.uid() IS NOT NULL AND (
  EXISTS (SELECT 1 FROM mascotas m JOIN familia_miembro fm ON fm.familia_id=m.familia_id
          WHERE m.id=p_mascota_id AND fm.user_id=auth.uid()
            AND fm.rol IN ('adulto_titular','adulto_autorizado') AND fm.hasta IS NULL)
  -- dueño directo (legacy/walk-in sin familia armada): sigue pudiendo
  OR EXISTS (SELECT 1 FROM mascotas m WHERE m.id=p_mascota_id AND m.user_id=auth.uid()));
```

🔴 **El brazo del prestador NO menciona `familia` en ninguna línea.** Va entero
por `mascota_acceso_prestador`:

```sql
-- user_tiene_acceso_a_mascota_como (extracto literal)
IF EXISTS (SELECT 1 FROM mascota_acceso_prestador map
   WHERE map.mascota_id = p_mascota_id
     AND map.revocado_en IS NULL
     AND (map.expira_en IS NULL OR map.expira_en > now())
     AND map.cuenta_comercial_id IN (
        SELECT cuenta_comercial_id FROM prestadores WHERE user_id = v_user_id
        UNION
        SELECT p.cuenta_comercial_id FROM prestador_empleados pe
        JOIN prestadores p ON p.id = pe.prestador_id
        WHERE pe.user_id = v_user_id AND pe.activo = true)
     AND (map.metodo_otorgamiento <> 'cita_automatica' OR EXISTS (...ventana N meses...)))
THEN RETURN true; END IF;
```

⇒ **un refugio ya puede LEER y ESCRIBIR el expediente de una mascota sin tocar
la familia.** Lo que la familia gatea es la **existencia de la fila**, no el
acceso del prestador.

### 🔑 LO QUE DA VUELTA LA PREGUNTA — `familia` YA NO ES «UN HOGAR HUMANO»

```
chk_familia_tipo
  CHECK (tipo = ANY (ARRAY['estandar','virtual_prestador','virtual_refugio','pendiente_completar']))
chk_familia_virtual_tiene_cuenta
  CHECK (((tipo='estandar') AND (cuenta_comercial_id IS NULL))
      OR ((tipo = ANY (ARRAY['virtual_prestador','virtual_refugio','pendiente_completar']))
          AND (cuenta_comercial_id IS NOT NULL)))
```

**`familia` no tiene NINGUNA columna NOT NULL que exija una persona.**
`created_by_user_id` es nullable y `created_by_sistema` también (XOR entre los
dos). **Y `virtual_refugio` ya es un valor legal.**

**Los dos escritores que ya corren, literales:**

```sql
-- crear_mascota_walkin  (DEFINER) — el prestador crea una mascota SIN humano
INSERT INTO familia (tipo, cuenta_comercial_id, country_code, nombre, created_by_user_id)
VALUES ('virtual_prestador', v_cuenta_comercial_id, p_country_code,
        'Walk-in: ' || v_razon_social, v_auth_uid);
INSERT INTO mascotas (id, user_id, familia_id, ...) VALUES (v_mascota_id, NULL, v_familia_id, ...);
INSERT INTO mascota_acceso_prestador (..., metodo_otorgamiento) VALUES (..., 'walkin_origen');
```

```sql
-- crear_alta_asistida_pendiente (DEFINER) — para alguien que NO tiene cuenta
INSERT INTO familia (id, nombre, tipo, country_code, cuenta_comercial_id, created_by_user_id, ...)
VALUES (v_familia_id, 'Familia de '||p_nombre_cliente, 'pendiente_completar', ..., v_cuenta_comercial_id, ...);
INSERT INTO mascotas (..., familia_id, user_id, origen, ...) VALUES (..., v_familia_id, NULL, 'alta_asistida', ...);
```

🔴 **Y LA ENTREGA YA EXISTE, CORRIENDO, CON SU NOMBRE PROPIO** — el trigger que
convierte una familia del negocio en la familia de la persona el día que se
registra:

```sql
-- _trg_completar_pendiente_registro (DEFINER), literal
UPDATE familia SET tipo='estandar', cuenta_comercial_id=NULL, updated_at=now()
WHERE id = v_pendiente.familia_id_placeholder;

INSERT INTO familia_miembro (familia_id, user_id, rol, desde)
VALUES (v_pendiente.familia_id_placeholder, NEW.id, 'adulto_titular', now());

FOR v_mascota_id IN SELECT id FROM mascotas WHERE familia_id = v_pendiente.familia_id_placeholder
LOOP
  INSERT INTO mascota_codueño (mascota_id, user_id, familia_id, desde, agregado_por_user_id) ...
  UPDATE mascotas SET user_id = NEW.id WHERE id = v_mascota_id;
  INSERT INTO eventos_mascota (..., tipo, ...) VALUES (..., 'alta_asistida_completada_por_cliente', ...);
END LOOP;
```

***El traspaso de una mascota desde una cuenta de negocio a una familia humana,
con su evento en el expediente, no hay que inventarlo: está escrito, aplicado y
tiene 4 mascotas de `origen='alta_asistida'` que pasaron por su puerta.***

### d) Las FK que apuntan a `mascotas` (regla 41 — todas)

```
TOTAL: 84    CASCADE 35 · RESTRICT 32 · SET NULL 10 · NO ACTION 7
```
`RESTRICT` incluye `eventos_mascota` ⇒ **una mascota con expediente no se puede
borrar.** Y `mascotas_familia_id_fkey` es `ON DELETE RESTRICT` ⇒ **una familia
con mascotas tampoco.** Para la adopción eso es bueno y no malo: **el camino no
puede ser borrar; tiene que ser mover o mutar.**

🔴 **Y ACÁ ESTÁ EL ÚNICO HUECO REAL DE ①: NADA MUEVE `mascotas.familia_id`.**

```
CONTROL+ (mascotas SET user_id, sé que existe)  -> _trg_mascotas_espejar_user_id_a_titular,
                                                   _trg_completar_pendiente_registro
CONTROL+ (familia SET tipo, sé que existe)      -> _trg_completar_pendiente_registro
MEDICIÓN (mascotas SET familia_id)              -> (NINGUNA)
```
*El mismo regex, tres columnas: devuelve filas en dos y cero en la tercera.*
**El instrumento produce su rojo, así que el cero es real.**

Y su gemelo, con el mismo molde:
```
escribe 'virtual_prestador' (control+) -> crear_mascota_walkin, registrar_rasgo_identidad_personal,
                                          crear_presupuesto_borrador
escribe 'virtual_refugio'              -> (NINGUNA)
menciona 'transferencia_familia'       -> (NINGUNA)
cat_tipos_evento                       -> transferencia_familia/activo=true
                                          transferencia_dueno/activo=true
```
⇒ **`transferencia_familia` es un tipo de evento ACTIVO en el catálogo, sin un
solo productor.** Y `virtual_refugio` es un valor legal sin un solo escritor.
*Los dos slots están reservados y vacíos: alguien ya vio venir esto.*

### e) Wrappers TS y pantallas — medido contra el REPO (git ls-files), buscador propio

```
packages/api/src/client.ts:129   .select('familia_id')          <- helper "mis familias vigentes"
packages/api/src/wrappers/paseo.ts:283   'id'|'nombre'|'especie'|'foto_url'|'familia_id'
packages/api/src/wrappers/paquetes.ts:265  familia_id.in.(...)  <- la pata familia del saldo
packages/api/src/wrappers/veterinaria-presupuesto.ts:33  familiaId?: string | null
packages/api/src/wrappers/guarderia-documentos.ts  (4 firmas con p_familia_id)
```
El comentario de `paseo.ts:261-283` es el que hay que leer antes de tocar nada:
> *«`familia_id` (S85): **la llave de VIDAS del paseador** … un `familia_id:
> null` significa **dos cosas distintas**: "esta mascota no tiene familia" y
> "este oficio no lo pidió". Es exactamente la ambigüedad que L-197 prohíbe.»*

⚠️ **NO MEDIDO, y lo declaro:** si `mascotas_update_familia` valida de verdad el
`familia_id` NUEVO. Su `WITH CHECK` llama a `user_es_familiar_adulto_de_mascota(id)`,
que **hace su propio SELECT sobre `mascotas`** — comprobar contra qué snapshot
lo evalúa **exige ejecutar un UPDATE**, y esta pista no escribe. *Si la rama
elegida es «mover la mascota de familia», esto se mide ANTES de escribir el
motor: un WITH CHECK que revalida la fila vieja no valida nada.*

### f) EL COSTO DE CADA RAMA, sobre el objeto que acabo de medir

**Estado del dato hoy:**
```
mascotas 83 · familias 86
familia por tipo:  estandar 83 · pendiente_completar 3 · virtual_prestador 0 · virtual_refugio 0
familias sin NINGÚN miembro: 67 de 86
mascotas con user_id NULL:   51 de 83
origen: desconocido 38 · adoptado 21 · encontrado 15 · alta_asistida 4 · nacido_en_casa 3
        comprado_particular 1 · refugio 1
refugios (tabla): 0 filas
```
*(Las 67 familias sin miembro son residuo medible de la purga de sondas de S92:
`familia_miembro_user_id_fkey` es `ON DELETE CASCADE` a `auth.users`, así que
borrar las 64 cuentas dejó sus familias huérfanas. **No es un diseño: es una
cicatriz** — y hoy son 67 filas que la policy `..._titular_o_primero` deja
reclamables.)*

**RAMA «admite vacío» (el adoptable vive sin familia) — CARA:**
`familia_id` NOT NULL hay que aflojarlo, y con él caen **23 policies en 15
tablas** que hoy asumen que hay familia, más los dos brazos de
`user_es_familiar_adulto_de_mascota`, más `familia_id` como tipo NO opcional en
`MascotaAgenda` de los cuatro oficios. **Y reintroduce exactamente el null de
dos significados que `paseo.ts` documenta como prohibido.**

**RAMA «el refugio ES la familia» (la que §0 firma) — BARATA, Y YA CONSTRUIDA A
MEDIAS:** `familia.tipo='virtual_refugio'` + `cuenta_comercial_id` del refugio
**ya es expresable sin una sola migración de esquema** — los dos CHECK lo
admiten hoy. Lo que falta es **una puerta, no un modelo**:
1. un escritor tipo `crear_mascota_walkin` con `'virtual_refugio'` (0 hoy);
2. el acto de entrega — y tiene **precedente aplicado y corriendo**
   (`_trg_completar_pendiente_registro`), en su forma *mutar la familia en su
   lugar*;
3. si en cambio se elige **mover** la mascota a la familia del adoptante
   (lectura literal de *«la adopción cambia la familia»*), eso **no existe**:
   cero funciones tocan `mascotas.familia_id`, y su policy de UPDATE tiene el
   `WITH CHECK` sin medir de arriba.

> **Las dos formas del traspaso son distintas y la letra no eligió entre ellas:**
> **(i) mutar la familia** (el refugio suelta: `tipo → 'estandar'`,
> `cuenta_comercial_id → NULL`, entra el adoptante como titular) — **tiene
> precedente vivo, conserva el `familia_id` y por lo tanto el expediente entero
> sin tocar una FK**; **(ii) mover la mascota** a la familia que el adoptante ya
> tenía — **no tiene una sola línea escrita**, y es la única que necesita que
> alguien resuelva qué pasa con las demás mascotas del refugio en esa familia.
> *(i) es gratis y (ii) es el vertical. Lo anoto y sigo: elegir no es mío.*

---

# ② ¿PUEDE EXISTIR UN USUARIO SIN MASCOTA?

## VEREDICTO

> **SÍ, y no es hipotético: 152 de 170 usuarios están así hoy, y el motor tiene
> ese estado como ciudadano de primera clase. Lo que NO existe es el CAMINO —
> el guard del cliente ramifica por `tiene_familia` y el onboarding sólo se sale
> creando una mascota, así que «tengo cuenta y todavía no tengo mascota» es un
> estado legal del que la app no deja salir sin dar de alta un animal.**

### a) El alta NO exige mascota — medido contra el OBJETO

```sql
-- handle_new_user (trigger de alta), literal
insert into public.profiles (id, email, nombre) values (new.id, new.email, v_nombre)
on conflict (id) do nothing;
return new;
```
**Crea `profiles` y nada más: ni familia, ni mascota.** ⇒ *todo usuario, en el
instante posterior a registrarse, es un usuario sin mascota.*

```sql
-- get_estado_onboarding_dueno, literal
return jsonb_build_object(
  'tiene_familia', v_familia_id is not null,
  'familia_id',    v_familia_id,
  'mascotas_count', v_mascotas);
```
**El motor REPRESENTA el estado**: devuelve `mascotas_count` explícito.

**El dato (control: `users sin id` = 0, `auth.users` = 170 ⇒ el contador cuenta):**
```
auth.users total                                   170
profiles total                                     170
users CON >=1 mascota (vía familia_miembro)         18
users SIN ninguna mascota (ni familia ni user_id)  152
```

🔴 **Pero el guard del cliente no mira ese número. Mira el otro:**
```
apps/cliente/src/app/index.tsx:64
  router.replace(estado.data.tiene_familia ? '/hogar' : '/onboarding');
apps/cliente/src/app/registro.tsx:109      setTimeout(() => router.replace('/onboarding'), 460);
apps/cliente/src/app/verificar-correo.tsx:111  setTimeout(() => router.replace('/onboarding'), 460);
apps/cliente/src/app/(tabs)/hogar/index.tsx:783
  if (!estado.ok || !estado.data.tiene_familia || estado.data.familia_id === null) {
    router.replace('/');
```
⇒ **sin familia: `/` → `/onboarding`, y `hogar` rebota a `/`. Es un lazo
cerrado.** Y la única salida del onboarding crea una mascota:
```
apps/cliente/src/app/onboarding/index.tsx:7   return <AltaMascota modo="primera" pasoFijo="especie" />;
apps/cliente/src/components/alta/PasoCierre.tsx:230   ? await crearFamiliaConPrimeraMascota({
```
*(Esa última línea es la que el `grep` de la casa no ve — ver el hallazgo de
instrumento arriba.)*

**`mascotas_count` viaja del motor al wrapper y NINGUNA pantalla lo lee:**
```
packages/api/src/wrappers/onboarding.ts:349   mascotas_count: number;
(consumidores en apps/: 0 — medido con el buscador validado)
```
**Motor sin puerta, en su forma exacta (`L-318`): el número que contestaría esta
pregunta existe, viaja, y nadie lo mira.**

### b) LAS CUATRO SUPERFICIES CON CERO MASCOTAS

⚠️ **DECLARACIÓN DE CONTRA QUÉ MEDÍ, y el mandato pedía otra cosa:** esto está
medido contra el **REPO** (fuente trackeada, con el buscador validado), **NO
contra el bundle corriendo**. Correrlo en el bundle exigía una sesión de un
usuario con cero mascotas, y **crear esa cuenta es escribir** — lo que esta
pista tiene prohibido. **No lo presento como medición de bundle y no lo redondeo:
prueba qué código hay, jamás qué se ve.** *Un verde de repo sobre una pantalla
es exactamente lo que `L-459` manda no confundir con un gate.*

| Superficie | Con 0 mascotas | Evidencia |
|---|---|---|
| **hogar** | **vacío honesto** | `hogar/index.tsx:971` |
| **expediente** | **inalcanzable** (no hay ficha que tocar) | vive bajo el stack de hogar |
| **explorar** | **la tab existe y no depende de mascota**; el bloqueo aparece en la reserva, con voz | `explorar/adiestramiento/index.tsx:120` |
| **coach** | **inalcanzable — y no es una tab** | `hogar/index.tsx:110,1566` |

```tsx
// hogar/index.tsx:958-977 — literal
  if (mascotas === 'error') {
    // el error JAMÁS se disfraza de vacío (Ley 13)
    ...
  }

  if (mascotas.length === 0) {
    return (
      <View style={{ flex:1, backgroundColor: theme.bg.base, justifyContent:'center', padding: spacing[5] }}>
        <EstadoVacio titulo={t('hogar.sinMascotas')} descripcion={t('hogar.sinMascotasDetalle')} />
      </View>
    );
  }
```
**El vacío del hogar es honesto y distingue error de ausencia.** *Pero es un
vacío terminal: dice que no hay mascotas y no ofrece ningún camino que no sea
dar de alta una.*

🔴 **El Coach NO es una tab.** Las tabs medidas son cinco:
```
(tabs)/_layout.tsx:383,391,392,393,394  ->  hogar · explorar · despensa · pedidos · cuenta
```
El Coach vive **dentro** de hogar (`CoachHoja`, importado en `:110`, abierto en
`:1566`), y **el retorno de `:971` corta antes de llegar ahí** ⇒ con cero
mascotas el Coach no se monta. Igual el techo: `:726` `const techoPintado =
Array.isArray(mascotas) && mascotas.length > 0;`.

### c) ¿Existe hoy un camino de cuenta sin mascota?

**No.** Medido: cero ocurrencias de un alta que no cree mascota, cero
consumidores de `mascotas_count`, y el único constructor cliente de familia es
`crear_familia_con_primera_mascota` — **cuyo nombre es su contrato**: sus
parámetros `p_nombre_mascota` y `p_especie` no tienen default.

*Lo que sí existe, y es el precedente que importa: el camino donde **otro** crea
la mascota por vos (`crear_alta_asistida_pendiente`) y vos la recibís al
registrarte. Hoy ese «otro» es un prestador. La letra quiere que también pueda
ser un refugio.*

---

## LO QUE ESTA PISTA NO MIDIÓ (declarado, no omitido)

1. **Si `mascotas_update_familia` valida el `familia_id` nuevo** — exige un
   UPDATE. **Bloqueante de la rama (ii).**
2. **Si un `familia_id` ajeno es alcanzable por un no-miembro** — exige ejercer
   la policy. Decide si `familia_miembro_insert_titular_o_primero` necesita
   gate antes de que existan familias de refugio.
3. **Las cuatro superficies en el BUNDLE** — exige una cuenta con cero
   mascotas, que es escribir.
4. Las mediciones ③–⑥ del §12 van en el segundo lote.

## PREGUNTAS QUE LA LETRA DEJÓ ABIERTAS (anotadas, no resueltas — no son mías)

- **Mutar la familia vs. mover la mascota** (①f). La letra dice «cambia la
  familia»; el objeto admite las dos y sólo una tiene precedente.
- **Qué pasa con las 67 familias sin miembro vigente** el día que reclamarlas
  sea un gesto de producto y no un residuo.
- **La contradicción con `LETRA_ADOPCION_PADRINAZGO` §3/§4** (freno de puerta).
