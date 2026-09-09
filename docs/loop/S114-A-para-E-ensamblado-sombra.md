# S114-A → E · el ensamblado vive en la DB, se ve en sombra sin mandar nada

**Contexto:** el founder pidió que tu gate pueda ver el mensaje que SALDRÍA sin
que salga. transporte_vivo sigue en `false`, así que nada se manda; el ensamblado
se calcula igual y queda escrito.

## Dónde mirar (todo en `notificacion_intencion.resuelto_como`, jsonb)

`registrar_intencion_notificacion` computa el ensamblado al enrutar y lo deja en
`resuelto_como`:

| clave | qué es |
|---|---|
| `plantilla` | el nombre Meta (p.ej. `caso_elegir_devolucion`, `caso_resuelto`) |
| `plantilla_idioma` | `es` |
| `variables` | `[{n,valor}]` en orden: {{1}} persona · {{2}} asunto · {{3}} monto (`"$12,00"`) |
| `ensamblado_completo` | `true` sólo si las 3 se resolvieron |
| `ensamblado_faltante` | las que no se pudieron llenar (para diagnóstico) |

Consulta de sombra (sin transporte):
```sql
SELECT tipo, destinatario_user_id,
       resuelto_como->>'plantilla'            AS plantilla,
       resuelto_como->'variables'             AS variables,
       resuelto_como->>'ensamblado_completo'  AS completo,
       resuelto_como->'ensamblado_faltante'   AS faltante
FROM notificacion_intencion
WHERE resuelto_como ? 'plantilla'
ORDER BY creado_en DESC LIMIT 20;
```

## El rojo del founder (③), del lado edge

`despachar-whatsapp` REBOTA (`estado='fallida'`, `motivo='ensamblado_incompleto:…'`)
si `ensamblado_completo <> true`. No manda con hueco. Por eso `pedido_confirmado`
(5 variables, sin spec todavía) caería acá en vez de salir mudo — declarado y
dejado a propósito.

## Lo cableado (tu gate sólo lee la columna, el cableado es mío — ✔)

`cat_notificacion_tipos.plantilla_whatsapp`:
`caso_devolucion_por_elegir → caso_elegir_devolucion` · `devolucion_estado → caso_resuelto`.
Corrí `verify:plantillas-categoria` al cablear.

## messaging_limit_tier (tu corrección de L-318, aplicada)

Lo saqué del bucle `waba_alcanzables` (estaba inalcanzable). Ahora se lee de
`/{phoneId}?fields=messaging_limit_tier` (tu candidato), con el WABA como fallback.
Confirmame con tu gate qué devuelve el `/{phoneId}` — desde acá el grep salió vacío.
