/**
 * PASO ① DEL WIZARD — TU NEGOCIO (S97-C · `LA_CASA_DEL_PRESTADOR` §4.1).
 *
 * ── TESIS ──────────────────────────────────────────────────────────────
 * «El nombre con el que las familias te van a encontrar.»
 *
 * ── FIRMA ──────────────────────────────────────────────────────────────
 * **El único paso que no se saltea, y la pantalla lo dice sin regañar.**
 * Sin nombre el destape no tiene qué mostrar y la casa no tiene título.
 *
 * ── CHANEL ─────────────────────────────────────────────────────────────
 * Se quitó **el logo**, y se declara en vez de omitirse: `LogoNegocio`
 * existe y el destape lo consume, pero **no hay motor de carga de logo
 * para la cuenta comercial** — ni bucket, ni columna, ni wrapper (medido).
 * Montar un selector que no puede guardar sería un formulario muerto, que
 * es peor que su ausencia (precedente de `ventas/configuracion.tsx`: los
 * cuartos sin esquema NO se montan). El destape cae al monograma, que es
 * exactamente para lo que la pieza de B tiene ese camino.
 * También se quitaron los datos fiscales: §4.1 los nombra, y ya viven
 * enteros en `cuenta-comercial/nueva` — el wizard REORGANIZA, no duplica.
 *
 * ── EL MOTOR ───────────────────────────────────────────────────────────
 * `actualizarNombreCuentaComercial` (S97-A): puerta DEFINER gateada por
 * owner — un operador no-titular rebota `solo_el_titular_corrige_el_nombre`
 * y la pantalla lo DICE con la voz del servidor, sin traducirlo a un
 * genérico.
 */

import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  Campo,
  Entrada,
  EvitaTeclado,
  Texto,
  spacing,
  useAviso,
} from '@epetplace/ui';
import { actualizarNombreCuentaComercial } from '@epetplace/api';

import { rechazoDeNombre } from '@/lib/validacion-alta';

import { useTraduccion } from '@/i18n';

export interface PasoNegocioProps {
  cuentaComercialId: string;
  nombreInicial: string;
  /** Avisa al contenedor que el nombre cambió — el contador lo DERIVA de
   *  la base, así que lo único que hace falta es recargar. */
  alGuardar: () => void;
  /** ⭐ S98-C · el paso REGISTRA su confirmación y el pie la ejecuta
   *  («Guardar» murió, §4.1 · firma de la mesa 14-ago). Devuelve si se
   *  puede avanzar; la VOZ del rechazo la pone este paso, en su campo. */
  registrarConfirmacion: (fn: (() => Promise<boolean>) | null) => void;
}

export function PasoNegocio({
  cuentaComercialId,
  nombreInicial,
  alGuardar,
  registrarConfirmacion,
}: PasoNegocioProps) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [nombre, setNombre] = useState(nombreInicial);
  const [guardando, setGuardando] = useState(false);
  /** La voz del rechazo vive EN EL CAMPO, jamás en un toast: un toast dice
   *  «algo salió mal» a media pantalla de distancia del campo que lo dijo,
   *  y se va solo antes de que el dedo llegue. `Campo` ya tiene el slot
   *  con altura reservada y `liveRegion` — la pieza estaba lista. */
  const [errorNombre, setErrorNombre] = useState<string | null>(null);

  /** LA REGLA VIVE EN `lib/validacion-alta` (dos pasos la usan); LA VOZ es
   *  de esta pantalla (Ley 3): «el nombre de tu negocio» y «el nombre de
   *  la persona» son la misma regla y dos frases distintas. */
  const VOZ_RECHAZO = {
    vacio: 'alta.paso1.errorVacio',
    corto: 'alta.paso1.errorCorto',
    sinLetras: 'alta.paso1.errorSinLetras',
  } as const;

  /** Validar → guardar → decir si se puede avanzar. */
  const confirmar = useCallback(async (): Promise<boolean> => {
    const valor = nombre.trim();
    const rechazo = rechazoDeNombre(valor);
    if (rechazo !== null) {
      setErrorNombre(t(VOZ_RECHAZO[rechazo]));
      return false;
    }
    setErrorNombre(null);
    // Sin cambios no hay nada que guardar — y avanzar es correcto: el
    // nombre que ya está en la base es el mismo que se validó recién.
    // *Un PATCH que escribe lo mismo no es prolijidad: es una escritura
    // que puede fallar por una razón ajena y frenar un paso que estaba bien.*
    if (valor === nombreInicial.trim()) return true;

    setGuardando(true);
    const res = await actualizarNombreCuentaComercial(cuentaComercialId, valor);
    setGuardando(false);
    if (!res.ok) {
      // La voz del servidor viaja tal cual: `solo_el_titular_corrige_el_nombre`
      // dice algo que un genérico no puede decir. Va al CAMPO —es sobre
      // este dato— y además al aviso, porque un rechazo de permisos no es
      // un error de tipeo y merece que la pantalla lo levante.
      setErrorNombre(res.mensaje);
      mostrar({ texto: res.mensaje, variante: 'error' });
      return false;
    }
    alGuardar();
    return true;
  }, [nombre, nombreInicial, cuentaComercialId, alGuardar, mostrar, t]);

  /* El registro se rehace cuando cambia `confirmar` — o sea con cada
     tecla. Es a propósito: una closure vieja acá guardaría el nombre de
     hace tres letras, que es el defecto exacto de L-221 (el closure
     obsoleto que se fabrica al sacar algo de las deps). */
  useEffect(() => {
    registrarConfirmacion(confirmar);
    return () => registrarConfirmacion(null);
  }, [confirmar, registrarConfirmacion]);

  return (
    <EvitaTeclado>
      <View style={{ gap: spacing[8] }}>
        <Entrada orden={0}>
          <View style={{ gap: spacing[2] }}>
            <Texto variante="titulo">{t('alta.paso1.titulo')}</Texto>
            <Texto variante="apoyo">{t('alta.paso1.bajada')}</Texto>
          </View>
        </Entrada>

        <Entrada orden={1}>
          <View style={{ gap: spacing[4] }}>
            <Campo
              label={t('alta.paso1.nombre')}
              value={nombre}
              onChangeText={(v) => {
                setNombre(v);
                // El error se BORRA al tipear, no se re-valida en vivo:
                // corregir mientras la persona escribe es regañarla por
                // no haber terminado. Vuelve a mirarse en Continuar.
                if (errorNombre !== null) setErrorNombre(null);
              }}
              error={errorNombre ?? undefined}
              deshabilitado={guardando}
            />
            {/* ☠️ ACÁ VIVÍA «Guardar». Murió con la firma del 14-ago: un
                paso, un botón — el del pie valida, guarda y avanza. */}
          </View>
        </Entrada>
      </View>
    </EvitaTeclado>
  );
}
