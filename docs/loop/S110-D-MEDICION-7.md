# S110-D · MEDICIÓN ⑦ — ¿QUÉ CUELGA DE `familia_id`?

> **Pista D de S110 · SOLO LECTURA.** Cero DDL, cero backfill, cero seeds.
> **Fecha:** 1-sep-2026 · **Rama:** `pista/s110-d` · **Base:** `main` `202ff494`.
> **Medido contra el OBJETO** (`zyltipqscdsdsxnjclhp`) salvo donde se diga.
> **Complementa** `S110-D-LOTE1.md` (① y ②), que separó las dos formas del
> traspaso sin poder votarlas.
>
> **No propongo el diseño.** La forma la vota la mesa.

---

## VEREDICTO

> **MOVER CONSERVA EL EXPEDIENTE. De las 83 tablas que cuelgan de una mascota,
> 75 no tienen ninguna atadura a familia, y `eventos_mascota` —el expediente—
> no tiene FK ni columna de familia: sus 536 filas viajan con la mascota
> hagas lo que hagas con el hogar. Las 8 restantes no son historia: son
> DINERO, PERMISOS Y TRÁMITE DEL HOGAR, y son exactamente lo que NO debe
> seguir a la mascota en una adopción. ⚠️ Con un costo medido que hay que
> pagar explícitamente: `_user_es_codueño_mascota` NO mira `familia_id`, así
> que mover la mascota no le quita el acceso a la familia vieja — hay que
> cerrarlo, y la columna para cerrarlo (`hasta`) ya existe.**

---

## ⚠️ PRIMERO, EL INSTRUMENTO — EL CENSO POR NOMBRE SOBRECUENTA, Y FEO

Buscar columnas cuyo nombre contenga `familia` da **33 filas**, y la mayoría
**no habla del hogar**:

```
evento_atencion.familia            <- el OFICIO (paseo/grooming/vet/adiestramiento)
cat_servicios_grooming.nombre_familia · nombre_familia_en
cat_objetivos_adiestramiento.nombre_familia · cat_conductas_bitacora.nombre_familia
cat_productos_oficio.familias_aplicables · productos.familia_codigo
cat_restricciones_servicio.familia_servicio · restricciones_mascota_activas.familia_servicio
cat_estados_pedido.visible_familia · busquedas_sin_resultado.familia_filtro
evento_atencion.mensaje_familia · eventos_mascota_adiestramiento.instrucciones_familia
```

**«Familia» en esta casa nombra DOS cosas distintas: el hogar humano y la
familia taxonómica de un servicio o producto.** Un censo por nombre las mezcla
⇒ **el criterio es estructural: FK real a `familia(id)`.**

**Control del instrumento (positivo, positivo y negativo):**
```
CONTROL+ mascotas presente        : True
CONTROL+ familia_miembro presente : True
CONTROL- evento_atencion presente : False   <- su .familia es el OFICIO ✅
```
*El control negativo es el que vale: prueba que el criterio estructural
descarta lo que el criterio por nombre había metido.*

---

## a) TODO LO QUE REFERENCIA FAMILIA — 14 FK reales, con su ON DELETE

```
tabla                                  ON DELETE    tiene mascota_id   columna
------------------------------------------------------------------------------------
cliente_pendiente_registro             NO ACTION    False              familia_id_placeholder
familia_invitaciones                   CASCADE      False              familia_id
familia_miembro                        CASCADE      False              familia_id
guarderia_aceptaciones                 CASCADE      False              familia_id
guarderia_autorizaciones_familia       CASCADE      False              familia_id
mascotas                               RESTRICT     False              familia_id
"mascota_codueño"                      RESTRICT     True               familia_id
accion_destructiva_pendiente           CASCADE      True               familia_id
bonos                                  RESTRICT     True               familia_id
guarderia_suscripciones                CASCADE      True               familia_id
mascota_familiar_autorizado            RESTRICT     True               familia_id
paseo_social_negativas                 CASCADE      True               familia_id
presupuesto                            SET NULL     True               familia_id
solicitud_autorizacion_mostrador       SET NULL     True               familia_id
```

**Filas vivas hoy** *(control: una fila `WHERE false` no aparece en el
resultado ⇒ el contador cuenta)*:
```
eventos_mascota (EXPEDIENTE)      536      bonos                              25
solicitud_autorizacion_mostrador   12      guarderia_aceptaciones             16
guarderia_suscripciones             6      familia_invitaciones                5
cliente_pendiente_registro          4      presupuesto                         4
mascota_codueño                     2      mascota_familiar_autorizado         0
paseo_social_negativas              0      accion_destructiva_pendiente        0
```

---

## b) ¿ATADO A LA FAMILIA O A LA MASCOTA? — EL NÚMERO QUE DECIDE

```
tablas con FK a mascotas                   83
de esas, CON FK también a familia           8
de esas, SIN ninguna atadura a familia     75

CONTROL+ ¿eventos_mascota tiene FK a familia?   NO
CONTROL+ ¿bonos tiene FK a familia?             SI
columnas de eventos_mascota que digan familia   (NINGUNA)
```

🔑 ***El expediente entero cuelga de `mascota_id` y de nada más.*** `eventos_mascota`
—la tabla madre, 536 filas— **no tiene FK a familia ni una columna que la
nombre**, y las ~30 tablas tipadas de evento (`evento_vacuna_aplicada`,
`evento_historia_clinica_registrada`, `evento_peso_medicion`,
`evento_grooming_*`, `evento_adiestramiento_*`, `caso_clinico`,
`mascota_perfil_vigente`, `documento_token`…) tampoco: **son 75 de 83.**

### Las 8 que sí, clasificadas por lo que son

| Tabla | Qué es | ¿Debe seguir a la mascota en una adopción? |
|---|---|---|
| `mascota_codueño` | **PERMISO** — quién puede leer/escribir la mascota | 🔴 **No**, y hoy sigue igual (ver abajo) |
| `mascota_familiar_autorizado` | **PERMISO** — familiar con acceso | 🔴 **No** |
| `bonos` | **DINERO** — el saldo, que es del hogar | **No** — la letra ya firmó *«el bono es del hogar»* |
| `guarderia_suscripciones` | **DINERO** — recurrente del hogar | **No** |
| `presupuesto` | dinero/trámite | **No** (`SET NULL` en familia: ya lo tolera) |
| `solicitud_autorizacion_mostrador` | trámite | **No** (`SET NULL`) |
| `paseo_social_negativas` | preferencia del hogar | decisión de producto, 0 filas |
| `accion_destructiva_pendiente` | operativo | **No**, 0 filas |

***Ninguna de las 8 es historia de la mascota. Las 8 son del hogar: plata,
permisos y trámite.*** *Que se queden atrás no es una pérdida: es lo correcto —
el saldo del refugio no puede viajar al adoptante.*

### 🔴 EL COSTO QUE HAY QUE PAGAR EXPLÍCITAMENTE, y sale del body

```sql
-- _user_es_codueño_mascota  (el gate de SELECT, UPDATE y DELETE de mascotas)
SELECT EXISTS (
  SELECT 1 FROM mascota_codueño
  WHERE mascota_id = p_mascota_id
    AND user_id    = p_user_id
    AND hasta IS NULL          -- ⚠️ NO mira familia_id
);
```
**El permiso se evalúa por `(mascota, usuario)` y NO por familia.** ⇒ **mover
`mascotas.familia_id` NO revoca nada**: quien tenga una fila de codueño abierta
sigue leyendo y escribiendo la mascota después de la adopción.
*No es un defecto: es que el permiso y la pertenencia son ejes distintos.* **La
herramienta para cerrarlo ya existe y no hay que inventarla: `hasta` +
`motivo_cierre`.** Hoy son **2 filas** en toda la base.

⚠️ **Y su gemela silenciosa:** `user_es_familiar_adulto_de_mascota` tiene su
segundo brazo `m.user_id = auth.uid()` ⇒ **si la mascota conserva `user_id`,
esa persona sigue siendo familiar adulto sin importar la familia.** En la
adopción hay que decidir qué pasa con `user_id`, que hoy es NULL en 51 de 83.

---

## c) QUÉ HACE HOY EL TRASPASO QUE YA CORRE — body literal (regla 40)

```sql
CREATE OR REPLACE FUNCTION public._trg_completar_pendiente_registro()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
...
  UPDATE cliente_pendiente_registro
  SET completado_en = now(), completado_por_user_id = NEW.id
  WHERE id = v_pendiente.id;

  UPDATE familia                                     -- ① LA FAMILIA MUTA
  SET tipo = 'estandar', cuenta_comercial_id = NULL, updated_at = now()
  WHERE id = v_pendiente.familia_id_placeholder;

  INSERT INTO familia_miembro (familia_id, user_id, rol, desde)   -- ② ENTRA EL HUMANO
  VALUES (v_pendiente.familia_id_placeholder, NEW.id, 'adulto_titular', now());

  FOR v_mascota_id IN
    SELECT id FROM mascotas WHERE familia_id = v_pendiente.familia_id_placeholder
  LOOP
    INSERT INTO mascota_codueño (mascota_id, user_id, familia_id, desde, agregado_por_user_id)
    VALUES (v_mascota_id, NEW.id, v_pendiente.familia_id_placeholder, now(), NEW.id);   -- ③ PERMISO

    UPDATE mascotas SET user_id = NEW.id WHERE id = v_mascota_id;                        -- ④ user_id

    v_evento_id := gen_random_uuid();
    INSERT INTO eventos_mascota (                                                        -- ⑤ EL EVENTO
      id, mascota_id, tipo, eje_jtbd, fecha_evento, creado_por_user_id, datos, country_code
    ) VALUES (
      v_evento_id, v_mascota_id, 'alta_asistida_completada_por_cliente', 'administrativo', now(),
      NEW.id, jsonb_build_object('pendiente_id', v_pendiente.id,
                                 'prestador_origen', v_pendiente.creado_por_prestador_id),
      v_pendiente.country_code
    );
  END LOOP;
  ... (dos avisos: al prestador dueño y al operador que hizo el alta) ...
  RETURN NEW;
END;
$function$
```

**Qué toca de las 14 tablas de (a): `familia` (muta), `familia_miembro`
(inserta), `mascota_codueño` (inserta), `cliente_pendiente_registro` (cierra).
Y de las de mascota: `mascotas.user_id` y `eventos_mascota` (un evento POR
mascota).**

**Qué NO toca, y es lo interesante: `bonos`, `presupuesto`,
`guarderia_suscripciones`, `solicitud_autorizacion_mostrador` — ninguna.**
*Porque en su caso no hacen falta: la familia `pendiente_completar` se creó hace
poco y no acumuló nada.* ⚠️ **Una familia de refugio con meses de operación SÍ
acumula** — y ahí la forma «mutar» arrastraría el saldo y las suscripciones del
refugio hacia el adoptante, **que es justo lo que la tabla de (b) dice que no
debe pasar.**

***El precedente resuelve el traspaso de UNA familia recién nacida. No resuelve
el traspaso de UNA mascota desde una familia que sigue viva con otras adentro.***

---

## d) VEREDICTO, Y LO QUE CUESTA CADA FORMA

> **MOVER CONSERVA EL EXPEDIENTE.** No lo deja atrás: 75 de 83 tablas de la
> mascota no saben qué es una familia, y `eventos_mascota` no tiene ni FK ni
> columna. **La afirmación «mover lo deja atrás» es falsa, medida.**

**Y por eso las dos formas se invierten respecto de lo que parecía en el lote 1:**

**MUTAR LA FAMILIA** *(lo que ya corre)* — barato **sólo si el refugio tiene UNA
mascota y ninguna historia de hogar**. Con un refugio real:
`chk_familia_virtual_tiene_cuenta` exige `cuenta_comercial_id` para
`virtual_refugio` y lo prohíbe para `estandar` ⇒ **mutar obliga a soltar la
cuenta comercial del refugio**, y con ella se va la familia entera — **todas
las demás mascotas del refugio quedarían dentro de la familia del adoptante**,
más su saldo (`bonos`, 25 filas vivas) y sus suscripciones. *Mutar sirve para
una familia de UNA mascota; un refugio es lo contrario de eso.*

**MOVER LA MASCOTA** — **conserva el expediente completo sin tocar una sola FK**
(RESTRICT no se dispara: no hay DELETE), deja atrás exactamente lo que debe
quedarse, y su costo es **acotado y nombrable**:
1. **no existe** — cero funciones escriben `mascotas.familia_id` (lote 1,
   medido con control positivo en dos columnas hermanas);
2. ✅ **MEDIDO POR S110-A (1-sep, posterior a este documento): el `WITH CHECK`
   de `mascotas_update_familia` es PUERTA ABIERTA** — `D-989` 🔴. Evalúa
   `user_es_familiar_adulto_de_mascota(id)`, que **toma el `id` de la mascota y
   no ve a dónde va la fila**: pasa hacia la familia propia **y hacia una
   ajena**. ⇒ *lo que yo había dejado como sospecha razonada —«un WITH CHECK que
   revalida la fila vieja no valida nada»— está confirmado ejerciéndolo, que es
   lo que yo no podía hacer sin escribir.*
   ⚠️ **Con el límite que A declara de su propia sonda:** su actor era además el
   `user_id` de la mascota, así que **no aísla cuál de los dos brazos pasó** —el
   de `familia_miembro` o el legacy `m.user_id = auth.uid()`—. *La puerta está
   abierta; cuál de las dos hojas, no se midió.*
   🔑 **Y esto no agranda el costo de «mover»: lo vuelve exigible.** Mover no
   sólo hay que construirlo — hay que **cerrar la puerta en el mismo acto**, y
   mi *«cero funciones escriben `mascotas.familia_id`»* es justo lo que hace que
   cerrarla no rompa nada: **no hay escritor legítimo que quede afuera**;
3. **hay que cerrar los permisos a mano**: `mascota_codueño.hasta` y
   `mascota_familiar_autorizado.hasta`, porque el gate no mira familia;
4. **hay que decidir qué pasa con `mascotas.user_id`**, por el segundo brazo de
   `user_es_familiar_adulto_de_mascota`.

> **En una línea para la mesa: mover conserva el expediente y deja atrás lo que
> debe quedarse; mutar sólo funciona para una familia de una sola mascota, y un
> refugio no lo es. Lo que falta para mover son cuatro piezas nombradas, no un
> modelo.**

---

## LO QUE NO SE MIDIÓ (declarado)

1. ~~El `WITH CHECK` de `mascotas_update_familia`~~ — **YA NO: medido por
   S110-A, es puerta abierta (`D-989`).** Ver el punto 2 del veredicto. *Queda
   sin aislar cuál de los dos brazos la abre.*
2. **Si `familia` con `tipo='virtual_refugio'` puede convivir con mascotas de
   varios adoptantes futuros** — no hay dato: cero filas de ese tipo.
3. **Nada en bundle corriendo.**
