/* ═══════════════════════════════════════════════════════════════════════════
   S109-B · EL COMPROBANTE DEL PROGRAMA — y el tercer `ELSE` del mismo día

   🔴 HALLADO EJERCIENDO, NO LEYENDO. Cobro real `DF-2108273`, $160: el débito
   salió, el acto 2 aplicó (programa activo, `estado_pago='pagado'`) **y el
   comprobante reventó**:

     `null value in column "destinatario_user_id" ... violates not-null`

   LA CAUSA, medida sobre el cuerpo vivo — la resolución del destinatario decía:

     CASE WHEN i.bono_id IS NOT NULL THEN (…bonos…)
          ELSE (…guarderia_suscripciones…) END

   **Con dos sujetos ese `ELSE` es un XOR. Con tres pasa a significar «todo lo
   que no sea un bono».** Un intento de programa se resolvía contra la
   guardería, daba NULL, y el JOIN a `prestadores` —que usa el mismo COALESCE—
   no encontraba fila: se perdían destinatario Y negocio de una sola vez.

   > **Es el TERCER `else` de esta clase en la misma jornada** —los dos de
   > `pagos-cobro`, pertenencia y desglose— **y éste es mío, escrito después de
   > haber curado los otros dos.** *Curar la ocurrencia y no censar la clase deja
   > la puerta abierta en el archivo de al lado; acá quedó abierta en el MISMO
   > bloque, un sujeto después.*

   🟢 LO QUE SALVÓ LA MEDICIÓN: el actuador **nombra** el fallo
   (`comprobante NO emitido: <causa>`) y sostiene `acto2=true`. *La plata y el
   sujeto quedaron bien; faltó el respaldo — y el sistema lo dijo en vez de
   callarlo.* Sin la cura de S107 esto se leía como éxito.

   LA CURA, en dos movimientos:
   ① Las dos ramas del programa: destinatario (`programas_contratados.user_id`)
      y negocio (`.prestador_id`).
   ② **El `ELSE` muere.** Cada sujeto con su arma explícita, sin rama de
      descarte: un sujeto nuevo da NULL en vez de resolverse contra el vecino.

   ⚠️ LO QUE NO HACE, DECLARADO: no agrega un guard que NOMBRE el sujeto cuando
   el destinatario sea NULL. Se intentó y se retiró — el `not-null` ya llega al
   `detalle` del evento, así que el fallo suena; lo único que no dice es CUÁL
   sujeto. *Envolver en un `IF` un `PERFORM` cuyo literal exacto no pude fijar
   habría sido editar a ciegas, que es peor que el hueco.* Queda nombrado para
   quien abra el próximo sujeto.

   Veda 76(g): NO RIGE — sin backfill, sin anclas, sin datos tocados.
   ═══════════════════════════════════════════════════════════════════════════ */

DO $mig$
DECLARE
  v_src text; v_nuevo text;
  v_viejo_user CONSTANT text := 'COALESCE(i.pagador_user_id,
            CASE WHEN i.bono_id IS NOT NULL
                 THEN (SELECT b.user_id FROM bonos b WHERE b.id = i.bono_id)
                 ELSE (SELECT g.autorizada_por FROM guarderia_suscripciones g
                        WHERE g.id = i.guarderia_suscripcion_id) END)';
  v_nuevo_user CONSTANT text := 'COALESCE(i.pagador_user_id,
            /* 🔴 SIN `ELSE`: un arma por sujeto. Con dos sujetos el `ELSE` era
               un XOR; con tres pasó a significar «todo lo que no sea un bono» y
               un programa se resolvía contra la guardería ⇒ NULL ⇒ el
               comprobante no salía (medido: `DF-2108273`). */
            CASE
              WHEN i.bono_id IS NOT NULL
                THEN (SELECT b.user_id FROM bonos b WHERE b.id = i.bono_id)
              WHEN i.guarderia_suscripcion_id IS NOT NULL
                THEN (SELECT g.autorizada_por FROM guarderia_suscripciones g
                       WHERE g.id = i.guarderia_suscripcion_id)
              WHEN i.programa_contratado_id IS NOT NULL
                THEN (SELECT pc.user_id FROM programas_contratados pc
                       WHERE pc.id = i.programa_contratado_id)
            END)';
  v_viejo_join CONSTANT text := 'JOIN prestadores pr ON pr.id = COALESCE(
               (SELECT b.prestador_id FROM bonos b WHERE b.id = i.bono_id),
               (SELECT g.prestador_id FROM guarderia_suscripciones g
                 WHERE g.id = i.guarderia_suscripcion_id))';
  v_nuevo_join CONSTANT text := 'JOIN prestadores pr ON pr.id = COALESCE(
               (SELECT b.prestador_id FROM bonos b WHERE b.id = i.bono_id),
               (SELECT g.prestador_id FROM guarderia_suscripciones g
                 WHERE g.id = i.guarderia_suscripcion_id),
               (SELECT pc.prestador_id FROM programas_contratados pc
                 WHERE pc.id = i.programa_contratado_id))';
BEGIN
  SELECT pg_get_functiondef(oid) INTO v_src
    FROM pg_proc WHERE proname = 'aplicar_evento_de_pago';
  IF v_src IS NULL THEN RAISE EXCEPTION 'aplicar_evento_de_pago no existe'; END IF;

  IF position(v_viejo_user in v_src) = 0 THEN
    RAISE EXCEPTION 'el bloque del destinatario cambió: se aborta en vez de adivinar';
  END IF;
  IF position(v_viejo_join in v_src) = 0 THEN
    RAISE EXCEPTION 'el join de prestadores cambió: se aborta en vez de adivinar';
  END IF;

  v_nuevo := replace(v_src, v_viejo_user, v_nuevo_user);
  v_nuevo := replace(v_nuevo, v_viejo_join, v_nuevo_join);

  /* Cinturón de la propia edición. *Un `replace` que no encuentra su texto no
     falla: devuelve el original — y una migración así corre verde sin haber
     cambiado nada.* Ya cobró una vez en esta misma migración. */
  IF position('WHEN i.programa_contratado_id IS NOT NULL' in v_nuevo) = 0
     OR position('pc.prestador_id FROM programas_contratados' in v_nuevo) = 0
     OR position(' ELSE (SELECT g.autorizada_por' in v_nuevo) > 0 THEN
    RAISE EXCEPTION 'algún reemplazo no entró o el ELSE sobrevivió: se aborta';
  END IF;

  EXECUTE v_nuevo;
  RAISE NOTICE 'aplicar_evento_de_pago: comprobante del programa cableado';
END $mig$;
