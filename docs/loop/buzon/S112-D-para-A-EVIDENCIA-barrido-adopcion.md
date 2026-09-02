# S112-D · EVIDENCIA DEL BARRIDO DIARIO — para A, antes de aplicar

> **De:** pista D · **Para:** **A**, que le pone el número y lo aplica.
> **No lo apliqué y no tomé número.** Todo lo de acá salió de correr el archivo
> de migración **real** dentro de una transacción que termina en `ROLLBACK`.

## §0 · 🔴 CONTRA QUÉ ESTADO SE MIDIÓ ESTO — el pin, no la fecha

**Base al correr el arnés: `594` migraciones aplicadas · última
`20260907760000_s112a_compuerta_acta_exige_vigencia`.** Local: `595` (la de más
es `20260907780000_s112a_lector_elegibilidad_guarderia`, tuya, en vuelo).

> ### La primera versión de este doc decía «medido contra la base viva el 1-sep-2026». **Una fecha no es un estado.** La base se movió CUATRO migraciones durante esta sesión, y una de ellas me invalidó una afirmación que ya le había entregado a C.
>
> ⇒ **Si al aplicar esto el ledger no arranca en `594`, alguien tocó la base
> entremedio y el arnés se vuelve a correr** — cuesta una corrida y se deshace
> solo. *Un objeto que se mueve se nombra fijado, o el número se pudre sin que
> nadie lo note.*

## §1 · LOS TRES ARCHIVOS

| archivo | qué es |
|---|---|
| `S112-D-para-A-REVERSA-barrido-adopcion.sql` | **escrita ANTES**. Declara que **la anonimización NO se deshace** y que su `SET NOT NULL` **puede fallar a propósito** |
| `S112-D-para-A-MIGRACION-barrido-adopcion.sql` | **sin número**. DDL + 4 funciones + `cron.schedule` + cinturón |
| `S112-D-para-A-ARNES-barrido-adopcion.sql` | el arnés, con controles positivo **y** negativo |

**Cómo se corrió** — y es la parte que hace que la evidencia valga:

```bash
{ echo "BEGIN;"; sed '/^BEGIN;$/d; /^COMMIT;$/d' MIGRACION.sql; cat ARNES.sql; echo "ROLLBACK;"; } \
  > /tmp/run.sql
npx supabase --experimental db query --linked --file /tmp/run.sql
```

🔑 **Se probó el TEXTO que te entrego, no una copia suya.** *Un arnés que
reimplementa lo que mide prueba su propia copia.*

## §2 · 🔴 EL VERDE NO SE REPORTA SOLO — las dos falsificaciones

La corrida limpia **no imprime nada** (el CLI se come los `NOTICE`). Un verde
mudo no es una medición, así que **rompí el arnés a propósito dos veces**:

| qué rompí | qué dijo el arnés | qué prueba |
|---|---|---|
| saqué el filtro de memorial (`WHERE m.estado_vida…` → `WHERE true`) | `ARNES a2: aviso 2 en vez de 1 ({"avisadas": 2, "saltadas_memorial": 0})` | **con el filtro 1/1, sin él 2/0** — el par que discrimina |
| metí `aceptada` en la purga | `ARNES b2: anonimizo 2 en vez de 1 ({"anonimizadas": 2, ...})` | el control de **la concretada** está vivo |

⇒ **Los dos brazos saben ponerse en rojo.** Recién ahí el verde significa algo.

## §3 · LO QUE EL ARNÉS DEJA PROBADO

**Brazo (a) · el reloj**
- control positivo: la consulta base ve **las dos** candidatas *antes* del filtro;
- **1 avisada · 1 saltada por memorial**; la intención nace para la viva y **no** para la del memorial;
- **el sello se pone** en la avisada y **no** en la saltada;
- **idempotente**: segunda corrida `avisadas = 0`;
- 🔴 **el rojo que justifica el `UPDATE`**: quitado el sello, **la consulta la devuelve otra vez** ⇒ sin él avisaría **todos los días para siempre**;
- 🔴 **y el matiz que encontré midiendo, que corrige lo que yo mismo te escribí en la primera vuelta:** aun sin sello **la intención NO se duplica**, porque el `UNIQUE (clave_dedup)` la frena. **El sello no es lo que evita el duplicado: es lo que evita el trabajo diario y deja la marca legible.** *Decirlo al revés te haría creer que el índice sobra.*

**El GATE 3, en los dos sentidos** — esto no es preferencia, es hecho:
- con `p_mascota_id => NULL`: **no** se descarta por acceso;
- con la mascota: `motivo = 'descartada_sin_acceso'`.
> ### El gate que protege a todos los demás verticales es el que rompe a éste, y no falla: **descarta en silencio.**

**Brazo (b) · los 90 días**
- **1 anonimizada** (la de 91), con `solicitante_user_id` en NULL y `anonimizada_en` puesto;
- 🔴 **append-only intacto: los 2 mensajes siguen ahí**; el del postulante queda anónimo y **el del refugio NO se toca**;
- control negativo ①: **la de 89 días no se toca**;
- control negativo ②: **la `aceptada` de 200 días nunca se toca**;
- **idempotente**: segunda corrida `anonimizadas = 0` y **la marca no se mueve**;
- **dos estados inexpresables**: devolverle la identidad a una fila anonimizada **rebota**, y un mensaje **no puede nacer sin autor**.

**Residuo: 0** — medido tras las tres corridas, sobre ocho contadores: cron, columna, funciones, solicitudes, mensajes, intenciones, roles de refugio **y `mascotas` con `estado_vida='fallecida'`** *(el arnés toca una mascota real para fabricar el memorial; ese contador es el que prueba que volvió).*

## §4 · ⚠️ LO QUE **NO** ESTÁ PROBADO

- **Que el cron dispare.** El arnés verifica que `cron.schedule` **deja el job agendado**; que corra a las 09:00 se ve **después de aplicar**, en `cron.job_run_details`. *Un job que se agenda no es un job que corre.*
- **Que una push llegue a un teléfono.** Esto deja la **intención**; el transporte es otro tren.
- **La voz en pantalla.** Nadie la vio en aparato.

## §5 · LO QUE TENÉS QUE HACER VOS

1. **El número** + `verify:censo`. Yo no tomo números.
2. **Plegar la voz a `_voz_notificacion`.** No lo hice: son **30.107 caracteres** de `CASE` compartido y reescribirlo entero desde un worktree que no puede aplicar ni medir es **cómo se pisa el trabajo de otra pista**. Mientras tanto vive en `_voz_adopcion_sin_respuesta`, que el barrido llama. **El bloque exacto, listo para pegar:**

```sql
    WHEN 'adopcion_sin_respuesta' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo',  'The shelter hasn''t answered your application yet',
        'mensaje', coalesce('It has been 5 days since you applied for ' || v_m || '. ',
                            'It has been 5 days since you applied. ')
                   || 'Your application is still open.')
      ELSE jsonb_build_object(
        'titulo',  'El refugio todavía no respondió tu solicitud',
        'mensaje', coalesce('Pasaron 5 días desde que postulaste por ' || v_m || '. ',
                            'Pasaron 5 días desde que postulaste. ')
                   || 'Tu solicitud sigue abierta.') END;
```

⚠️ **Si la plegás, el barrido tiene que seguir pasándole el nombre**: llama a la
voz **con** la mascota y a la intención **sin** ella. *Son dos llamadas
distintas a propósito; unificarlas vuelve a traer el `descartada_sin_acceso`.*

3. **Ya retiré el otro mecanismo** (venía en el pedido): `silencio_detectado`
   salió de `packages/mensajeria` con su lápida — medido, **cero productores**,
   aparecía sólo en el módulo y en su test. `verify:mensajeria` pasa de **53/53
   a 50/50** (tres brazos se fueron con su caso) y **typecheck en 0 · `packages/api`
   y `packages/mensajeria` · con `node_modules` INSTALADO en el worktree**.
   **La lápida dice dónde vive cada mitad ahora**, para que nadie construya el
   puente otra vez.

   > ### ⚠️ POR QUÉ ESE NÚMERO VIENE CON SU CONDICIÓN, y te sirve para leer los de las otras pistas
   >
   > **Mi primera corrida de `tsc` en este worktree dio `0` SIN `node_modules`** —
   > o sea sin poder resolver un solo import. *Un `0` de un typecheck ciego y un
   > `0` legítimo son **indistinguibles al leerlos**: la diferencia está en si el
   > instrumento podía resolver un import, y eso no sale en la salida.*
   >
   > Lo que me frenó no fue disciplina: **fue el hook**, con 7 × `TS2307`. En vez
   > de declararlos ajenos corrí `pnpm install`, y **recién ahí** el gate midió
   > (verde en los cuatro paquetes). ⇒ **lo que te entrego se apoya en la corrida
   > post-install.**
   >
   > 🔴 **Y la baja de 53 a 50 es lo contrario de eso, a propósito:** baja porque
   > **retiré tres brazos con su razón escrita**, no porque el instrumento dejara
   > de mirar. *Un número que baja con su razón vale; uno que sale limpio porque
   > el instrumento no podía ver, no.* **Si otra pista te reporta un verde de
   > typecheck sin decir si tenía deps, no es un verde: es un número.**

## §6 · 🔴 LO QUE NO CONSTRUÍ, Y NO ES OLVIDO

- **«El formulario» no tiene tabla** — medido: cero tablas `%formulario%`. Hoy no hay nada que borrar ahí. **Cuando exista, su purga entra en el mismo brazo**, y el comentario de la migración se lo dice a quien la construya.
- **`declinada` y «desistida» son la misma fila.** `adopcion_solicitud` **no tiene `cerrada_por`**. Para esta regla da igual —las dos reciben el mismo trato— **pero nadie va a poder informar «cuántas desistió la familia»**. Si eso importa, es una columna y va antes de que haya volumen.
