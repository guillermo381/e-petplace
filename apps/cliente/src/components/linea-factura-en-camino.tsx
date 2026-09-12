/**
 * S115-C · «TU FACTURA LLEGA APARTE» — la línea del momento en que todavía mira.
 *
 * 🔴 **EL HUECO, con el literal del founder:** la familia paga, recibe su
 * comprobante de pago, *y no tiene forma de saber que hay un segundo correo en
 * camino con su factura del SRI*. **Si no lo decimos, quien necesita la factura
 * escribe preguntando, o cree que no se la vamos a mandar.**
 *
 * **Por qué acá y no sólo en «Tus facturas»:** éste es **el momento en que la
 * persona todavía está mirando**. Una explicación que vive dos pantallas más
 * allá llega cuando ya se hizo la pregunta.
 *
 * ⚠️ **Son DOS correos y se dice que son dos.** El de pago llega ya; el del SRI
 * tarda unos minutos. *Decir sólo «te mandamos tu factura» sobre un comprobante
 * que ya está en la bandeja hace pensar que ése ES la factura* — y quien la
 * necesite para su contabilidad va a mandar el papel equivocado.
 *
 * **CHANEL (Ley 16):** UNA línea. La tentación era explicar el SRI, la
 * autorización y el plazo; nada de eso le sirve a alguien que acaba de pagar y
 * sólo necesita saber que hay algo más en camino.
 *
 * *No dice «en 5 minutos»: el plazo lo pone el SRI y no lo controlamos. «Unos
 * minutos» es lo que sabemos, y prometer un número exacto es fabricar un
 * incumplimiento.*
 */
import { Texto } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export function LineaFacturaEnCamino() {
  const { t } = useTraduccion();
  return <Texto variante="apoyo">{t('facturaEnCamino.llega')}</Texto>;
}
