/**
 * Cuenta · TUS DATOS DE FACTURACIÓN (S115-C · la mitad de ① que tiene puerta).
 *
 * **TESIS (Ley 14):** *dejá dichos tus datos una vez y tus facturas salen bien
 * siempre.*
 *
 * **FIRMA (Ley 15):** el tilde en vivo de `CampoIdentificacion` — la cédula se
 * confirma mientras se escribe, sin botón de por medio. No suma acento: es la
 * pieza de B con su `successText`.
 *
 * **CHANEL (Ley 16):** se quitó el switch de «recordar estos datos». Esta
 * pantalla ES el lugar donde se recuerdan — preguntarlo acá sería el control
 * que hace doble turno (Ley 17.6). Vive en `SelectorFacturacion`, que es donde
 * tiene sentido: dentro de una compra.
 *
 * ───────────────────────────────────────────────────────────────────────
 * **POR QUÉ ESTA PANTALLA Y NO LA DEL CHECKOUT.** El mandato pide la captura
 * *en el checkout*, y ahí `SelectorFacturacion` necesita el TOPE
 * (`fiscal_tope_consumidor_final`) para decidir si «Consumidor final» sigue
 * disponible. **El tope existe como dato y NO tiene lector en la puerta
 * única** — escribir `50` acá sería el número de plata en el cliente que la
 * casa prohíbe. Pedido a A en el buzón.
 *
 * *Fuera de una compra no hay total, así que no hay tope que consultar: la
 * captura entera se sostiene con `fiscalObtenerTaxProfile`/`fiscalGuardarTaxProfile`,
 * que ya están exportados.* Y ataca el mismo cuello: **hoy todo pago sobre $50
 * queda en `esperando_receptor` porque nadie puede declarar su cédula** — con
 * esto, la familia la deja cargada antes de comprar.
 *
 * 🔴 **NO se re-valida la identificación acá.** Los cuatro rechazos
 * (`ruc_invalido` · `cedula_invalida` · `ruc_sin_razon_social` ·
 * `tipo_identificacion_invalido`) **rebotan del servidor** y se leen de su
 * código (buzón de A §4). `CampoIdentificacion` da su aviso mientras se
 * escribe; **la autoridad sigue siendo el motor** — dos validaciones en dos
 * lugares se separan un día y nadie se entera.
 *
 * ⚠️ **El formulario en blanco NO afirma nada.** El buzón de A avisa que
 * `tipo_identificacion` dejó de tener default y que *«una pantalla que muestre
 * "Cédula" sobre un NULL vuelve a inventar el dato»*. Acá el tipo inicial es el
 * estado de un CONTROL que la persona va a tocar, no un dato leído: cuando no
 * hay perfil guardado, la identificación arranca **vacía** y la pantalla no
 * dice que tengas cédula. Son dos cosas distintas y por eso esto es legal.
 */
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  CampoIdentificacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Texto,
  useAviso,
  useTheme,
  spacing,
  type DatosIdentificacion,
} from '@epetplace/ui';
import { fiscalObtenerTaxProfile, fiscalGuardarTaxProfile } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

const VACIO: DatosIdentificacion = {
  tipo: 'cedula',
  identificacion: '',
  razonSocial: '',
  direccion: '',
  email: '',
};

/** Los rechazos del servidor, a su voz. Cualquier otro cae en el genérico —
 *  jamás string matching sobre el mensaje (regla 35).
 *
 *  🔴 Es un `switch` y no un mapa: las claves de i18n son **literales
 *  tipadas** (riel S51), así que un `Record<string, string>` no compila —
 *  el tsc exige que la clave exista. *El instrumento hizo su trabajo: un mapa
 *  dinámico habría dejado pasar una clave inventada hasta la pantalla.* */
function vozDeRechazo(codigo: string) {
  switch (codigo) {
    case 'ruc_invalido':
      return 'datosFacturacion.rucInvalido' as const;
    case 'cedula_invalida':
      return 'datosFacturacion.cedulaInvalida' as const;
    case 'ruc_sin_razon_social':
      return 'datosFacturacion.rucSinRazonSocial' as const;
    case 'tipo_identificacion_invalido':
      return 'datosFacturacion.tipoInvalido' as const;
    default:
      return 'datosFacturacion.errorGuardar' as const;
  }
}

type Carga = 'cargando' | 'error' | 'listo';

export default function DatosFacturacionScreen() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const [carga, setCarga] = useState<Carga>('cargando');
  const [datos, setDatos] = useState<DatosIdentificacion>(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    (async () => {
      const r = await fiscalObtenerTaxProfile();
      if (!vigente) return;
      if (!r.ok) {
        setCarga('error');
        return;
      }
      /* `null` = todavía no declaró ninguno. El formulario queda en blanco;
         NO se rellena con nada «probable». */
      /* 🔴 `consumidor_final` vive en `TaxProfile` (A) y NO en
         `TipoIdentificacion` (B) — y el desajuste es CORRECTO de los dos
         lados: consumidor final no se ESCRIBE, se elige en
         `SelectorFacturacion`. Acá significa «no declaró una identificación
         propia» ⇒ el formulario queda en blanco, que es la verdad. Pedido a B
         en el buzón por si prefiere expresarlo. */
      if (r.data !== null && r.data.tipoIdentificacion !== 'consumidor_final') {
        setDatos({
          tipo: r.data.tipoIdentificacion,
          identificacion: r.data.identificacion,
          razonSocial: r.data.razonSocial ?? '',
          direccion: r.data.direccion ?? '',
          email: r.data.email ?? '',
        });
      }
      setCarga('listo');
    })();
    return () => {
      vigente = false;
    };
  }, [intento]);

  const guardar = async () => {
    setGuardando(true);
    const r = await fiscalGuardarTaxProfile({
      tipoIdentificacion: datos.tipo,
      identificacion: datos.identificacion,
      /* Los opcionales viajan como `null` cuando están vacíos: una cadena
         vacía es un dato declarado, y «no lo dijo» no es «lo dejó en blanco». */
      razonSocial: datos.razonSocial.trim() || null,
      direccion: datos.direccion.trim() || null,
      email: datos.email.trim() || null,
      predeterminado: true,
    });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: t(vozDeRechazo(r.codigo)) });
      return;
    }
    mostrar({ variante: 'exito', texto: t('datosFacturacion.guardado') });
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('datosFacturacion.titulo')}
        atras
        onAtras={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          paddingBottom: insets.bottom + spacing[6],
          gap: spacing[5],
        }}
      >
        {carga === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={72} />
              <Esqueleto forma="bloque" ancho="100%" alto={72} />
            </View>
          </EsqueletoGrupo>
        ) : carga === 'error' ? (
          <EstadoVacio
            titulo={t('datosFacturacion.errorTitulo')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('datosFacturacion.reintentar')}
                onPress={() => {
                  setCarga('cargando');
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        ) : (
          <>
            <Texto variante="apoyo">{t('datosFacturacion.intro')}</Texto>
            <CampoIdentificacion valor={datos} onCambiar={setDatos} acento="control" />
            <Boton
              variante="primario"
              etiqueta={t('datosFacturacion.guardar')}
              bloque
              cargando={guardando}
              onPress={guardar}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
