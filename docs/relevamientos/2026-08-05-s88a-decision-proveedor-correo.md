# S88-A · DECISIÓN DE PROVEEDOR DE CORREO — con doble check

> **La decisión que §13 del modelo delega:** *"el proveedor de WhatsApp y de
> email: decisión técnica de Code con doble check, sobre este diseño."*
> Acá va la de EMAIL. Con esta firma, **el founder carga los DNS en Hostinger
> y el motor gana su primera voz.**
>
> ⚠️ **Caveat declarado:** los números de precio son a mi corte de conocimiento
> (may-2026) y se re-verifican al crear la cuenta. **No son el driver: al
> volumen de hoy (6 prestadores, ~10 familias) todos los candidatos cuestan
> cero o casi.** La decisión es ESTRUCTURAL, no de precio.

---

## 1. LO QUE SE LE PIDIÓ A CADA CANDIDATO — el literal

Los cinco criterios salen del diseño firmado (`MODELO_NOTIFICACIONES` §7 + el
dispatch de S87), no de una lista genérica:

| # | criterio | de dónde sale |
|---|---|---|
| C1 | **API HTTP llamable desde una Edge Function (Deno)** — sin SMTP | el dispatch firmado: *la Edge Function es la única voz al exterior* |
| C2 | **Dominio propio con SPF/DKIM/DMARC** por registros DNS simples | §7: *la entregabilidad se gana y se pierde de golpe* — y el founder los carga en Hostinger |
| C3 | **Separación transaccional/comercial estructural** | §7: *nunca se mezcla el transaccional con el comercial en el mismo dominio de envío* |
| C4 | **La llave vive como secret de la Edge Function** | la custodia que el founder ya sostiene (S81 R4, camino (a)) |
| C5 | **Costo ~cero al volumen real, sin cuenta nueva de infraestructura** | `MODELO_FINANCIERO` se lee antes de cualquier número por mensaje |

## 2. LOS CANDIDATOS, contra los cinco

| | Resend | Postmark | AWS SES | SendGrid / Brevo |
|---|---|---|---|---|
| C1 API desde Deno | ✅ nativa — SDK y ejemplos oficiales **con Supabase Edge Functions** | ✅ API limpia | ✅ pero firma SigV4 (más fricción en Deno) | ✅ |
| C2 DNS simples | ✅ 3-4 registros por subdominio | ✅ | ✅ + configuración de reputación **propia** | ✅ |
| C3 separación | **por SUBDOMINIO** (uno por tráfico) | ✅✅ **Message Streams**: la separación es del producto, no una convención | por identidad/config-set, manual | por subusuario, manual |
| C4 secret simple | ✅ API key | ✅ server token | ⚠️ credenciales AWS (par + región) | ✅ |
| C5 costo/fricción | ✅ free tier ~3k/mes; cero infra nueva | ✅ ~100/mes free, luego ~$15/mes | ✅ el más barato por unidad, **pero exige cuenta AWS + salir del sandbox** | ✅ / ⚠️ SendGrid arrastra reputación de IP compartida variable |

## 3. LA DECISIÓN

> ### **RESEND** — con Postmark como el plan B nombrado.

**Los porqués, cada uno atado a un criterio:**

1. **C1 es donde vivimos.** El transporte es una Edge Function de Supabase, y
   Resend es el proveedor con integración de primera clase documentada para
   exactamente ese runtime — menos código propio en la única pieza que habla
   con el exterior.
2. **C4 exacto:** una API key como secret de la función. SES habría metido un
   par de credenciales AWS y una cuenta nueva de infraestructura que nadie más
   de la casa opera (contra C5).
3. **C3 se cumple por SUBDOMINIO, y hoy es barato ser estricto:** lo
   transaccional sale de un subdominio dedicado, y **`comercial` no existe como
   tráfico** — es opt-in apagado con cero productores. El día que exista,
   nace en OTRO subdominio, jamás en el de constancia. *La regla de §7 queda
   cumplida por estructura de DNS, que es donde no se puede violar por
   descuido.*

### El doble check — dónde podría estar equivocada, y por qué se sostiene

- **Postmark es objetivamente superior en C3** (streams separados por producto)
  y es el estándar de entregabilidad transaccional. **No gana porque C3 lo
  cubrimos por subdominio a costo cero, y C1/C4/C5 favorecen a Resend** en el
  runtime que ya tenemos. *Si la entregabilidad medida decepciona o el volumen
  comercial algún día lo amerita, Postmark es el plan B —*
  **y migrar es barato POR DISEÑO: la Edge Function es la frontera exacta
  donde se cambia de proveedor sin tocar el motor** (§13). El doble check no es
  "elegimos perfecto": es *"elegir mal cuesta una función, no un arco"*.
- **SES sería el correcto si el volumen fuera 100×.** No lo es, y su costo real
  hoy es operativo (cuenta, sandbox, reputación propia), no monetario.

## 4. LO QUE EL FOUNDER CARGA EN HOSTINGER — cuando cree la cuenta

**Subdominio de envío propuesto: `avisos.<dominio>`** (el dominio exacto lo
confirma el founder — no lo doy por sabido). Resend genera los valores al
verificar el dominio; la FORMA va a ser:

| tipo | host | apunta a |
|---|---|---|
| TXT | `avisos` | SPF (`v=spf1 include:…`) |
| TXT / CNAME | `resend._domainkey.avisos` | DKIM (la llave que Resend genera) |
| TXT | `_dmarc.avisos` | `v=DMARC1; p=quarantine; …` — **se arranca en `p=none` solo si hay dudas, y se sube; nunca se queda ahí** |
| MX (opcional) | `avisos` | para los bounces/feedback del proveedor |

> **Regla que queda escrita:** el subdominio `avisos.*` es **SOLO constancia y
> operación**. El primer correo comercial que salga de ahí rompe §7 — y por eso
> el día que `comercial` despierte, **su subdominio se crea primero y su
> remitente jamás comparte el de constancia.**

## 5. El orden de encendido (cuando la mesa lo dispare)

1. Cuenta Resend + dominio verificado (los DNS de §4, founder en Hostinger).
2. La API key entra como **secret de la Edge Function** (`supabase secrets set` —
   jamás por chat, L-130; el founder la custodia).
3. Nace la Edge Function `despachar-correo` — **enchufada en la ÚNICA rama que
   hoy hace `RAISE transporte_no_existe`** (el despachador de ④ la nombró:
   *"el correo va acá"*).
4. `pg_net` se instala y `pg_cron` toca el timbre (el dispatch firmado de S87).
5. **El primer tipo sale de sombra con gate del founder** (§10.2) — el candidato
   natural es `pago_confirmado` o `plan_renovado`: **constancia**, el tráfico
   para el que el canal existe (§7).
