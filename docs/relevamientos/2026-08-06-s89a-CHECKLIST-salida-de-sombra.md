# S89-A · ORDEN 5 ④ — LA SALIDA DE SOMBRA: checklist por tipo, listo para el transporte verde

**Precondición ÚNICA pendiente:** el dominio verificado (el founder lo está
cerrando). Medido hoy: el tick ya responde `transporte_vivo` (la
`RESEND_API_KEY` existe) — con el remitente firmado `hola@epetplace.com`, cada
envío fallará HONESTO (`resend_4xx` por fila) hasta que ese dominio verifique
en Resend. **Cuando la sonda de abajo dé verde, esta secuencia se ejecuta tal
cual, un tipo por vez, con el ojo del founder en cada primer envío real.**

**La secuencia firmada:** `cita_confirmada` → `cita_solicitada` →
`cita_recordatorio`.

**La vara que rige (S89, sin atajos):** nada sale de sombra sin su voz
FIRMADA · la salida se verifica **mirando la sombra del productor real**
(L-207) · el primer envío real de cada tipo lleva **el ojo del founder** ·
un tipo por vez — si algo miente, vuelve a sombra con un UPDATE y se mira.

---

## 0 · La sonda del transporte (antes del primer tipo)

```bash
# el tick declara su modo — se espera transporte_vivo:
curl -s -X POST "https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/despachar-correo" \
  -H "Content-Type: application/json" -H "Authorization: Bearer <ANON>" \
  -d '{"origen":"sonda_salida_sombra"}'
# y el envío de humo: registrar una intención de tipo NO-sombra a una cuenta
# demo con correo real y verla llegar CON LA PLANTILLA (cara S89-B) — si
# llega texto plano viejo o falla resend_4xx, el dominio no está listo.
```

## Checklist POR TIPO (se repite tres veces, en la secuencia)

**① La voz está firmada.** El lote (`2026-08-06-s89a-lote-voces-cita-PARA-FIRMA.md`)
tiene la firma del founder para ESTE tipo — sin firma no hay paso ②.

**② Se mira la sombra del productor real ANTES de abrir (L-207).**
```sql
SELECT created_at, estado, en_sombra, datos->>'titulo' AS titulo,
       datos->>'mensaje' AS mensaje, resuelto_como->>'canal_elegido' AS canal
FROM notificacion_intencion
WHERE tipo = '<TIPO>' ORDER BY created_at DESC LIMIT 10;
```
Se lee: la voz es la firmada · el destinatario es el correcto (dueño en
confirmada/recordatorio, titular en solicitada) · el referente viaja
(mascota_id + mascota_nombre; evento_id en solicitada). **Si la sombra
muestra algo distinto de lo firmado, NO se abre.**

**③ La salida — UN UPDATE de una fila.**
```sql
UPDATE cat_notificacion_tipos SET en_sombra = false WHERE codigo = '<TIPO>';
```

**④ El hecho real, producido por el founder (jamás fixture — L-207/L-202):**
- `cita_confirmada`: el founder reserva y PAGA una cita real desde el cliente.
- `cita_solicitada`: el MISMO acto — el aviso le cae al titular del negocio
  (dos audiencias, un instante: los dos tipos se pueden mirar en el mismo dedo
  si ambos ya salieron; la secuencia manda igual: primero se abre confirmada,
  se mira, después solicitada).
- `cita_recordatorio`: con una cita confirmada para mañana, el toque previo
  sale a la próxima corrida posterior a las 08:00 (o el toque día si la cita
  es hoy) — el scan corre cada 15'.

**⑤ El ojo del founder en el primer envío:** llegó el correo con LA CARA
(cabecera texto, magentaDark, pie con hola@epetplace.com) · la campana lo
muestra · la voz dice lo firmado · la huella de novedades enciende.

**⑥ El registro en frío:**
```sql
SELECT estado, motivo, resuelto_como->>'proveedor_id' AS proveedor
FROM notificacion_intencion WHERE tipo='<TIPO>' ORDER BY created_at DESC LIMIT 3;
```
`entregada` con proveedor_id = verde. `fallida` con `resend_*` = se lee el
error (jamás se supone) y el tipo NO avanza.

**⑦ La vuelta atrás, si algo miente:** `UPDATE ... SET en_sombra = true` —
una fila, y a mirar. Nada más se toca.

---

*Nota de alcance: `procedimiento_agendado` y los tipos de plan/paquete tienen
su propia salida cuando su voz se firme — misma checklist, otra secuencia; el
recordatorio con DOS toques usa el mismo tipo y sale entero de una vez.*
