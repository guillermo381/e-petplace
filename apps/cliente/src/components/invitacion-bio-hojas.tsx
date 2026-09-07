/**
 * ⭐ **LAS CUATRO PUERTAS DE LA INVITACIÓN** (S113-C · 2.0 · ②).
 *
 * Cada entrada escribe **un evento con procedencia de familia**. Son cuatro
 * Hojas casi iguales a propósito: *la familia está contando algo, no llenando
 * un formulario, y cuatro formas distintas de contar la harían dudar en cada
 * una de cuál es la que corresponde.*
 *
 * 🔴 **Y al guardar se dice DÓNDE quedó.** «Anotado en la vida de Thor» no es
 * una felicitación: es la respuesta a *«¿y esto adónde fue?»* — la pregunta que
 * deja a alguien sin volver a escribir nada. La línea de vida lo muestra al
 * volver, y por eso la pantalla se recarga.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { Boton, Campo, Hoja, SelectorOpcion, Texto, spacing, useAviso } from '@epetplace/ui';
import {
  SEVERIDADES_ALERGIA,
  declararAlergiaFamilia,
  declararCondicionFamilia,
  registrarBitacoraFamilia,
  registrarObservacionComportamiento,
  registrarRecuerdoFamilia,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export type ClaseBio = 'comportamiento' | 'personalidad' | 'medico' | 'recuerdo';

/** Lo médico se parte en dos porque **son dos hechos distintos**: una alergia
 *  tiene alérgeno y severidad; una condición, un nombre y desde cuándo.
 *  *Meterlas en un campo libre las volvería texto que nadie puede leer como
 *  dato — y la franja de seguridad necesita el dato.* */
type SubMedico = 'alergia' | 'condicion';

export function HojaInvitacionBio({
  clase,
  nombre,
  mascotaId,
  onCerrar,
  onGuardado,
}: {
  clase: ClaseBio | null;
  nombre: string;
  mascotaId: string;
  onCerrar: () => void;
  /** La pantalla re-lee: *un dato que se anota y no aparece hasta salir y
   *  volver se lee como que no se guardó.* */
  onGuardado: () => void;
}) {
  const { t } = useTraduccion();
  const aviso = useAviso();
  const [texto, setTexto] = useState('');
  const [sub, setSub] = useState<SubMedico>('alergia');
  /* 🔴 **Las severidades son las del motor, no las que yo supondría.** Medido:
     `SEVERIDADES_ALERGIA = ['leve','moderada','severa','anafilactica']` — yo
     había escrito «grave», que no existe. *Inventar un valor de un vocabulario
     cerrado no falla al compilar si uno lo castea: falla al guardar.* */
  const [severidad, setSeveridad] = useState<(typeof SEVERIDADES_ALERGIA)[number]>('leve');
  const [guardando, setGuardando] = useState(false);

  const cerrar = () => {
    setTexto('');
    onCerrar();
  };

  const guardar = () => {
    if (clase === null || texto.trim() === '' || guardando) return;
    setGuardando(true);
    const v = texto.trim();
    const puerta =
      clase === 'comportamiento'
        ? registrarObservacionComportamiento(mascotaId, { texto: v })
        : clase === 'personalidad'
          /* Su firma pide chips: van vacíos porque **acá la familia cuenta,
             no clasifica** — el vocabulario de chips es del adiestramiento. */
          ? registrarBitacoraFamilia(mascotaId, v, [])
          : clase === 'recuerdo'
            ? registrarRecuerdoFamilia({ mascotaId, texto: v })
            : sub === 'alergia'
              ? declararAlergiaFamilia(mascotaId, { alergeno: v, severidad })
              : declararCondicionFamilia(mascotaId, { condicion: v });

    void puerta
      .then((r) => {
        setGuardando(false);
        if (!r.ok) {
          aviso.mostrar({ variante: 'error', texto: r.mensaje });
          return;
        }
        /* 🔴 **Dónde quedó, con el nombre.** «Guardado» a secas no contesta la
           pregunta que la familia se hace. */
        aviso.mostrar({ variante: 'exito', texto: t('bio.anotado', { nombre }) });
        setTexto('');
        onGuardado();
        onCerrar();
      })
      .catch(() => {
        /* Sin esto la Hoja queda abierta y muda — la clase que ya cacé dos
           veces en esta sesión. */
        setGuardando(false);
        aviso.mostrar({ variante: 'error', texto: t('bio.noSePudo') });
      });
  };

  const vozCampo =
    clase === 'comportamiento'
      ? t('bio.campoComportamiento')
      : clase === 'personalidad'
        ? t('bio.campoPersonalidad')
        : clase === 'recuerdo'
          ? t('bio.campoRecuerdo')
          : sub === 'alergia'
            ? t('bio.campoAlergia')
            : t('bio.campoCondicion');

  return (
    <Hoja visible={clase !== null} onCerrar={cerrar} titulo={t('bio.titulo', { nombre })} conCerrar>
      <View style={{ gap: spacing[4], padding: spacing[4] }}>
        {clase === 'medico' ? (
          <>
            <SelectorOpcion
              acento="control"
              etiqueta={t('bio.queEs')}
              opciones={[
                { codigo: 'alergia', etiqueta: t('bio.esAlergia') },
                { codigo: 'condicion', etiqueta: t('bio.esCondicion') },
              ]}
              seleccionada={sub}
              onSelect={(c) => setSub(c === 'condicion' ? 'condicion' : 'alergia')}
            />
            {sub === 'alergia' ? (
              <SelectorOpcion
                acento="control"
                etiqueta={t('bio.severidad')}
                opciones={[
                  { codigo: 'leve', etiqueta: t('bio.leve') },
                  { codigo: 'moderada', etiqueta: t('bio.moderada') },
                  { codigo: 'severa', etiqueta: t('bio.severa') },
                  { codigo: 'anafilactica', etiqueta: t('bio.anafilactica') },
                ]}
                seleccionada={severidad}
                onSelect={(c) => {
                  const v = SEVERIDADES_ALERGIA.find((x) => x === c);
                  /* Se BUSCA en el vocabulario en vez de castear: un código que
                     no esté no entra, y así el selector no puede inventar uno. */
                  if (v !== undefined) setSeveridad(v);
                }}
              />
            ) : null}
            {/* 🔴 **Lo declarado por la familia nace «sospechada»**, y la voz lo
                dice: *lo que cuenta la familia vale, y no es lo mismo que un
                diagnóstico* — la franja de seguridad lo va a mostrar con su
                «lo dijo la familia». */}
            <Texto variante="apoyo">{t('bio.avisoSospechada')}</Texto>
          </>
        ) : null}

        <Campo label={vozCampo} value={texto} onChangeText={setTexto} multilinea={3} />

        <Boton
          variante="primario"
          bloque
          etiqueta={t('bio.guardar')}
          deshabilitado={texto.trim() === ''}
          razonDeshabilitado={texto.trim() === '' ? t('bio.faltaTexto') : undefined}
          cargando={guardando}
          onPress={guardar}
        />
      </View>
    </Hoja>
  );
}
