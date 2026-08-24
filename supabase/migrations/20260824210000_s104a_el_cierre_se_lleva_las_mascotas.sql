-- ═══════════════════════════════════════════════════════════════════════════
-- S104-A · EL CIERRE SE LLEVA LAS MASCOTAS — el brazo de familia sale
-- Firma del founder, 24-ago-2026, sobre `D-903`, `D-904` y el freno de `D-905`.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── QUÉ SE FIRMÓ Y POR QUÉ ES ESTO Y NO OTRA COSA ────────────────────────
-- **Tener mascotas deja de ser causa de camino asistido para el titular único:
-- es el CASO NORMAL.** Medido antes de la firma: **de 19 usuarios con mascota,
-- rebotaban 19 — el 100 %.** *El backstop pensado como excepción era la puerta.*
--
-- **Y el flujo que lo vuelve honesto NO es motor, es orden:** la pregunta *«¿va
-- a seguir alguien más cuidándolas?»* se hace **ANTES de confirmar**, no como
-- espera posterior. **Si dice que sí, el cierre NO SE SOLICITA todavía** — la
-- persona invita, y cierra después, cuando la otra ya está adentro.
--
-- 🔴 **Esa inversión mata un limbo que ninguna cláusula habría podido arreglar,
-- y conviene que quede escrito por qué:** el diseño anterior dejaba el cierre
-- *«en espera»* hasta que alguien aceptara — **pero la persona pierde el acceso
-- el día 1**. ⇒ habría quedado **baneada, sin poder entrar a cancelar, ni a
-- re-invitar, ni a ver qué pasó**. *Un estado de espera que no se puede observar
-- ni abandonar no es una espera: es un limbo.* **Nada queda en espera porque
-- nada se solicitó.**
--
-- ── LO QUE ESTA MIGRACIÓN HACE, Y ES POCO A PROPÓSITO ────────────────────
-- **Solo saca el brazo de familia del pre-chequeo.** El resto del flujo es
-- SUPERFICIE —la pregunta previa y la segunda confirmación— y vive en la app.
-- *Un motor que intentara forzar ese orden estaría adivinando qué pantalla se
-- mostró, y eso no lo puede saber.*
--
-- ⚠️ **QUÉ NO SE TOCA, y es la mitad que sigue viva:** el brazo del **NEGOCIO
-- ACÉFALO** queda entero. *Un negocio con citas pagadas de terceros, empleados
-- con acceso y eventos sin liquidar sigue sin cerrarse con un botón* — esa es la
-- excepción ② de la LEY DE PARIDAD y **sigue siendo trámite asistido**.
--
-- ⚠️ **Y lo que el usuario TIENE que haber leído antes**, porque el motor deja
-- de frenarlo: sus expedientes **dejan de estar disponibles, NO se borran**
-- (`§19.4`: la historia le pertenece a la mascota · `§18`: se conservan
-- seudonimizados) **y no va a poder verlos ni recuperarlos pasados los 30 días.**
-- *El motor ya no protege ese caso — lo protege el texto de la segunda
-- confirmación, y por eso ese texto es parte de la firma y no decoración.*
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public._cierre_requiere_camino_asistido(p_user uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  v_negocio_acefalo boolean;
begin
  -- ── EL ÚNICO BRAZO QUE QUEDA: el negocio que quedaría sin dueño ─────────
  -- Titular de un prestador que tiene OTRA gente activa con acceso.
  select exists (
    select 1
    from public.prestador_empleados yo
    join public.prestador_empleados otros
      on otros.prestador_id = yo.prestador_id
     and otros.user_id is distinct from yo.user_id
     and otros.activo
    where yo.user_id = p_user
      and yo.activo
      and yo.rol = 'dueño'
  ) into v_negocio_acefalo;

  /* ☠️ EL BRAZO DE FAMILIA MURIÓ ACÁ (24-ago-2026, firma del founder).
     Decía: «único adulto_titular de una familia que tiene mascotas» → true.

     **No se retira por estar mal: se retira porque la decisión que lo
     justificaba se tomó del otro lado.** Su premisa era que dejar un
     expediente sin nadie es inaceptable; la firma responde que **el cierre se
     lleva las mascotas**, con la persona avisada antes de confirmar.

     ⚠️ **Si alguien lo quiere devolver, que lea esto primero:** con este brazo
     vivo **el 100 % de los usuarios con mascota quedaba fuera del cierre** —19
     de 19, medido— y el onboarding **obliga** a crear una mascota (`D-903`), que
     además **no se puede eliminar** (`D-904`). *Tres reglas razonables por
     separado cerraban la puerta entera.* **Devolverlo sin resolver esas dos la
     cierra otra vez.** */

  return coalesce(v_negocio_acefalo, false);
end;
$$;

comment on function public._cierre_requiere_camino_asistido(uuid) is
  'TRUE solo si el cierre personal dejaría un NEGOCIO sin titular. El brazo de '
  'familia se retiró el 24-ago-2026 por firma: el cierre se lleva las mascotas, '
  'y a la persona se le pregunta ANTES de confirmar si alguien más va a '
  'cuidarlas. Es el BACKSTOP DEL SERVIDOR de la excepción ② de la LEY DE '
  'PARIDAD — un cliente no se cree, y acá el error no se corrige con una OTA.';

revoke all on function public._cierre_requiere_camino_asistido(uuid) from public, anon;
