/**
 * EL COACH v0 — la Hoja anclada a mascota (S53-B2b, DISEÑO_EXPERIENCIA
 * §6 + DIRECCION_ARTE §5.2). La IA es la voz de la app; este es su
 * cuerpo invocable: SIEMPRE anclado a una mascota, jamás chat genérico.
 *
 * v0 HONESTO (el cerebro real es A5): 2-3 preguntas sugeridas que se
 * responden con DATOS REALES del expediente vía wrappers existentes —
 * plantillas con datos verificables, CERO generación, CERO diagnóstico
 * (§8.3). Campo libre: AÚN NO — la voz del pie lo dice. La activación
 * por mérito (§6: presentarse al cerrar la carga del carnet) queda
 * ANOTADA para cuando el Coach conteste de verdad.
 *
 * Física de apertura: Hoja con preset 'marca' (§5.2 — translateY con
 * la curva del prototipo, 340ms, scrim efectivo .4).
 */

import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import {
  AvatarMascota,
  Boton,
  Esqueleto,
  EsqueletoGrupo,
  Hoja,
  SelectorOpcion,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import { obtenerPerfilMascota, type MascotaResumen, type PerfilMascota } from '@epetplace/api';
import { calcularMomentoVital, edadEnMeses, type MomentoVital } from '@epetplace/domain';

import { fechaCortaMono, type IdiomaSoportado } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';

type Traductor = ReturnType<typeof useTraduccion>['t'];
type Pregunta = 'edad' | 'carnet' | 'actividad';


function vozEdad(meses: number, t: Traductor): string {
  if (meses < 12) return meses === 1 ? t('perfil.edadUnMes') : t('perfil.edadMeses', { meses });
  const anios = Math.floor(meses / 12);
  return anios === 1 ? t('perfil.edadUnAnio') : t('perfil.edadAnios', { anios });
}

function vozMomento(momento: MomentoVital, t: Traductor): string | null {
  switch (momento) {
    case 'M1': return t('perfil.momentoM1');
    case 'M2': return t('perfil.momentoM2');
    case 'M3': return t('perfil.momentoM3');
    case 'M4': return t('perfil.momentoM4');
    case 'M5': return t('perfil.momentoM5');
    case 'M6': return null;
  }
}

// Cada respuesta del v0 sale de DATOS VERIFICABLES del perfil (test 5
// del §10) — los null se dicen honestos, jamás se rellenan.
function responder(pregunta: Pregunta, perfil: PerfilMascota, t: Traductor, idioma: IdiomaSoportado): string {
  const { mascota, vacunas, paseos_total, ultimo_paseo_fecha, tiene_condicion_cronica, umbrales } = perfil;
  if (pregunta === 'edad') {
    const meses = mascota.fecha_nacimiento !== null ? edadEnMeses(mascota.fecha_nacimiento, new Date()) : null;
    if (meses === null) return t('coach.rEdadSinFecha');
    const momento =
      umbrales !== null
        ? calcularMomentoVital({
            edadMeses: meses,
            tieneCondicionCronica: tiene_condicion_cronica,
            esMemorial: mascota.estado_vida !== null && mascota.estado_vida !== 'activa',
            umbrales,
          })
        : null;
    const vozM = momento !== null ? vozMomento(momento, t) : null;
    return vozM !== null
      ? t('coach.rEdad', { nombre: mascota.nombre, edad: vozEdad(meses, t), momento: vozM })
      : t('coach.rEdadSinMomento', { nombre: mascota.nombre, edad: vozEdad(meses, t) });
  }
  if (pregunta === 'carnet') {
    if (vacunas.length === 0) return t('coach.rCarnetVacio');
    const ultima = vacunas[0].nombre_vacuna;
    return vacunas.length === 1
      ? t('coach.rCarnetUna', { vacuna: ultima })
      : t('coach.rCarnet', { n: vacunas.length, vacuna: ultima });
  }
  if (paseos_total === 0) return t('coach.rActividadVacia');
  const fecha = ultimo_paseo_fecha !== null ? fechaCortaMono(ultimo_paseo_fecha, idioma) : '';
  return paseos_total === 1
    ? t('coach.rActividadUno', { fecha })
    : t('coach.rActividad', { n: paseos_total, fecha });
}

export function CoachHoja({
  visible,
  onCerrar,
  mascotas,
}: {
  visible: boolean;
  onCerrar: () => void;
  mascotas: MascotaResumen[];
}) {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();

  const [mascotaId, setMascotaId] = useState<string | null>(mascotas[0]?.id ?? null);
  const [perfil, setPerfil] = useState<PerfilMascota | 'cargando' | 'error'>('cargando');
  const [respuesta, setRespuesta] = useState<string | null>(null);

  const mascota = mascotas.find((m) => m.id === mascotaId) ?? mascotas[0];

  useEffect(() => {
    if (!visible || !mascota) return;
    let vigente = true;
    setPerfil('cargando');
    setRespuesta(null);
    void obtenerPerfilMascota(mascota.id).then((r) => {
      if (vigente) setPerfil(r.ok ? r.data : 'error');
    });
    return () => {
      vigente = false;
    };
  }, [visible, mascota?.id]);

  if (!mascota) return null;

  const preguntas: Array<{ clave: Pregunta; texto: string }> = [
    { clave: 'edad', texto: t('coach.pEdad') },
    { clave: 'carnet', texto: t('coach.pCarnet') },
    { clave: 'actividad', texto: t('coach.pActividad') },
  ];

  return (
    <Hoja visible={visible} onCerrar={onCerrar} apertura="marca" conCerrar>
      <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[2], gap: spacing[4] }}>
        {/* anclada: la conversación abre sabiendo de quién hablas */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          <AvatarMascota nombre={mascota.nombre} tamano="sm" />
          <Text
            accessibilityRole="header"
            style={{ flex: 1, fontFamily: typography.family.sans.light, fontSize: typography.size.lg, color: theme.text.primary }}
          >
            {t('coach.preguntaSobre', { nombre: mascota.nombre })}
          </Text>
        </View>

        {mascotas.length > 1 && mascotas.length <= 4 ? (
          <SelectorOpcion
            acento="control"
            etiqueta=""
            opciones={mascotas.map((m) => ({ codigo: m.id, etiqueta: m.nombre }))}
            seleccionada={mascota.id}
            onSelect={(codigo) => setMascotaId(codigo)}
          />
        ) : null}

        <View style={{ gap: spacing[2] }}>
          {preguntas.map((p) => (
            <Boton
              key={p.clave}
              variante="secundario"
              tamaño="sm"
              etiqueta={p.texto}
              bloque
              deshabilitado={perfil === 'cargando' || perfil === 'error'}
              onPress={() => {
                if (perfil !== 'cargando' && perfil !== 'error') setRespuesta(responder(p.clave, perfil, t, idioma));
              }}
            />
          ))}
        </View>

        {perfil === 'cargando' ? (
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="70%" />
          </EsqueletoGrupo>
        ) : respuesta !== null ? (
          <Tarjeta elevacion="plana">
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.base,
                lineHeight: typography.size.base * typography.leading.normal,
                color: theme.text.primary,
              }}
            >
              {respuesta}
            </Text>
          </Tarjeta>
        ) : null}

        {/* la honestidad del v0: el campo libre AÚN NO existe */}
        <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.tertiary }}>
          {t('coach.pie')}
        </Text>
      </View>
    </Hoja>
  );
}
