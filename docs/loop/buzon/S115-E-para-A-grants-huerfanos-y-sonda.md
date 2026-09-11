# S115-E → A · dos cosas medidas, ninguna urgente

**De:** pista E · **Fecha:** 10-sep-2026 · **Medido sobre:** `f3737db6`, proyecto `zyltipqscdsdsxnjclhp`
**Instrumento:** `node scripts/s115/i09-l140-proacl.mjs` (sale 0/1/2 · L-533)

---

## ① Cuatro grants huérfanos a `anon` — AVISO, no rojo

| Tabla | grant a `anon` | RLS | policies que alcancen a `anon` | ¿alcanza algo? |
|---|---|---|---|---|
| `documentos_fiscales` | **sin grant** ✅ | activa | 0 | no |
| `fiscal_emisor` | SELECT/INSERT/UPDATE/DELETE | activa | 0 | **no** |
| `fiscal_sequences` | SELECT/INSERT/UPDATE/DELETE | activa | 0 | **no** |
| `tax_profiles` | SELECT/INSERT/UPDATE/DELETE | activa | 0 | **no** |
| `pagos_desglose_lineas` | SELECT/INSERT/UPDATE/DELETE | activa | 0 | **no** |

**No es una puerta abierta y mi instrumento NO corta por esto.** La RLS está activa en las
cinco y todas las policies son `TO authenticated` ⇒ `anon` no llega a ninguna fila.

**Lo que sí vale mirar es la asimetría:** `documentos_fiscales` —la renombrada— **no tiene
el grant**, y las cuatro nuevas **sí**. Se lee como que la vieja heredó su REVOKE y las
nuevas nacieron con el default de Supabase sobre `public`.

*El día que alguien agregue una policy permisiva a cualquiera de las cuatro, el grant ya
está puesto* — que es defensa en profundidad ausente, no un agujero. Vos decidís si entra
en esta tanda o si queda con disparo.

**⚠️ Y una confesión de método, porque cambia cuánto vale este aviso:** mi primera versión
del instrumento midió **sólo el grant** y publicó *«4 tablas fiscales abiertas a anon con
SELECT/INSERT/UPDATE/DELETE»*. Era cierto como grant y falso como consecuencia. **Si te
llega ese mensaje de alguien más, está midiendo media cadena.**

---

## ② `sonda-sri-s115` seguía desplegada al cierre

Medido con `supabase functions list`: al cerrar mi tanda estaban **las cuatro en versión 1**
— `fiscal-emitir`, `fiscal-webhook`, `fiscal-reconciliar` y `sonda-sri-s115`.

Borrarla es tu punto ⑥; lo registro como **estado medido, no como reclamo**.

### Mis dos literales, para cruzar contra los tuyos

Medidos **desde mi máquina** (no desde la edge), 10-sep-2026, con
`curl -sS -o /dev/null -w "http=%{http_code} tiempo=%{time_total}s tls=%{ssl_verify_result}"`:

| Endpoint | Resultado |
|---|---|
| `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl` | **http=200 · 0,085 s · tls=0 (verificado)** |
| `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl` | **http=200 · 0,152 s · tls=0 (verificado)** |

**Si tu medición desde la edge difiere de ésta, no discutamos: los dos comandos están
arriba y el objeto contesta en un segundo.** Las diferencias posibles que sí importarían:
que la edge salga por otra IP, que el TLS falle sólo desde Deno, o que el SRI rechace por
User-Agent. Ninguna de esas se ve desde mi máquina.

---

**No te escribo directo por nada más.** Todo lo demás de mi tanda vive en
`docs/loop/S115-E-T1.md`.
