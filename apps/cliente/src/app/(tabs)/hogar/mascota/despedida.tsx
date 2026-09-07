/**
 * ⭐ **DESPEDIRSE** (S113-C · 1.2 · C11).
 *
 * El acto más grave que la familia puede hacer en la app: **apaga el motor
 * entero** (`MODELO_LOYALTY` §7.1) y el perfil pasa a memorial, donde nada
 * vuelve a pedirle nada (A3.9).
 *
 * ── POR QUÉ VIVE DETRÁS DEL MENÚ DE EDICIÓN, Y NO EN LA FICHA ─────────────
 * Un botón «Despedir» a la vista de una ficha que la familia abre todos los
 * días es una puerta que nadie quiere encontrar sin buscarla. Va donde se
 * cambian los datos de la mascota — **con separador, al final, y sola**.
 *
 * 🔴 **NO PIDE CONFIRMACIÓN MODAL, Y ES A PROPÓSITO.** La pieza de B ya exige
 * dos actos: elegir la fecha y tocar el botón, con la voz de confirmación a la
 * vista. *Un «¿estás seguro?» encima de un duelo es la app dudando de alguien
 * que ya decidió.*
 *
 * ⚠️ **La fecha futura se frena acá**, con la voz de la pieza: no se puede
 * haber despedido mañana. Es Ley 23 — la puerta no ofrece lo que va a rechazar.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Campo,
  CampoFecha,
  type CampoFechaValor,
  Hoja,
  PantallaDespedida,
  useAviso,
} from '@epetplace/ui';
import { fechaLargaHumana } from '@epetplace/i18n';
import { registrarFinDeVida } from '@epetplace/api';
import { useTraduccion } from '@/i18n';

/** Hoy en local, `YYYY-MM-DD`. 🔴 **No `toISOString()`**: en UTC-5 después de
 *  las 19:00 devuelve el día siguiente, y acá la fecha ES el dato. */
function hoyLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function Despedida() {
  const { t, idioma } = useTraduccion();
  const router = useRouter();
  const aviso = useAviso();
  const { mascotaId, nombre } = useLocalSearchParams<{ mascotaId: string; nombre: string }>();

  const hoy = hoyLocal();
  const [valor, setValor] = useState<CampoFechaValor>({ fecha: hoy, precision: 'exacta' });
  const [palabras, setPalabras] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [eligiendoFecha, setEligiendoFecha] = useState(false);

  const despedir = () => {
    if (mascotaId === undefined) {
      /* Sin id no hay a quién despedir. **Se dice**: un guard mudo acá es
         indistinguible de la app colgada — lo aprendí con el botón del
         carnet en el 1.1.2. */
      aviso.mostrar({ variante: 'error', texto: t('despedida.sinMascota') });
      return;
    }
    if (valor.fecha > hoy) {
      aviso.mostrar({ variante: 'error', texto: t('despedida.fechaFutura') });
      return;
    }
    if (enviando) return;
    setEnviando(true);
    void registrarFinDeVida({
      mascotaId,
      fecha: valor.fecha,
      palabras: palabras.trim() === '' ? undefined : palabras.trim(),
    }).then((r) => {
      setEnviando(false);
      if (!r.ok) {
        /* 🔴 **HOY ESTE CAMINO ES EL ÚNICO QUE SE RECORRE**, y no por la app:
           `registrar_fin_de_vida` rebota con `23502` — el INSERT del evento
           `fin_vida` deja `country_code` en NULL y la columna es NOT NULL.
           Medido leyendo la respuesta cruda del servidor, porque el wrapper lo
           traduce a `desconocido` y desde la pantalla no se distingue «error
           que no mapeo» de «forma inesperada». Pedido a A en el parte. */
        aviso.mostrar({ variante: 'error', texto: t('despedida.noSePudo') });
        return;
      }
      /* Se vuelve a la ficha, que ya se lee en memorial. **No se celebra ni se
         confirma con un cartel**: el cambio de la pantalla es la respuesta. */
      router.back();
    }).catch((e: unknown) => {
      /* 🔴 **UN `.then()` SIN `.catch()` DEJA LA PANTALLA CONGELADA Y MUDA.**
         Medido en web: el botón quedaba en «Toca otra vez», sin aviso, sin
         navegar y sin escribir — indistinguible de un toque que no llegó. La
         promesa rechazaba y nadie la escuchaba. *Es la misma clase que el botón
         del carnet en el 1.1.2: un camino de fallo que no habla.* */
      setEnviando(false);
      // eslint-disable-next-line no-console
      console.error('[despedida] falló registrarFinDeVida:', e);
      aviso.mostrar({ variante: 'error', texto: t('despedida.noSePudo') });
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <PantallaDespedida
        titulo={t('despedida.titulo')}
        nombre={nombre ?? ''}
        fecha={valor.fecha}
        hoy={hoy}
        fechaTexto={fechaLargaHumana(valor.fecha, idioma)}
        onCambiarFecha={() => setEligiendoFecha(true)}
        palabras={palabras}
        onPalabras={setPalabras}
        /* El slot de las palabras. **Opcional y sin contador ni mínimo**:
           poner un largo esperado a lo que alguien escribe sobre su animal
           muerto sería pedirle una redacción. */
        campoPalabras={
          <Campo
            label={t('despedida.palabras')}
            value={palabras}
            onChangeText={setPalabras}
            multilinea={4}
            placeholder={t('despedida.palabrasPlaceholder')}
          />
        }
        vozBoton={enviando ? t('despedida.enviando') : t('despedida.boton')}
        /* 🔴 **Sin nombre, la confirmación NO nombra a nadie en vez de nombrar
           el vacío.** «Toca otra vez para despedirte de » es una frase rota en
           la pantalla donde una familia registra que su mascota murió. */
        vozConfirmar={
          nombre !== undefined && nombre !== ''
            ? t('despedida.confirmar', { nombre })
            : t('despedida.confirmarSinNombre')
        }
        vozFechaFutura={t('despedida.fechaFutura')}
        onDespedir={despedir}
      />

      {/* La fecha se elige en su propia Hoja: la pieza muestra el texto y
          delega el «cómo», así que el picker de la casa entra sin que ella
          sepa de fechas. */}
      <Hoja visible={eligiendoFecha} onCerrar={() => setEligiendoFecha(false)} titulo={t('despedida.cuando')}>
        <CampoFecha
          label={t('despedida.cuando')}
          valor={valor}
          onChange={(v) => {
            setValor(v);
            setEligiendoFecha(false);
          }}
          tituloHoja={t('despedida.cuando')}
        />
      </Hoja>
    </View>
  );
}
