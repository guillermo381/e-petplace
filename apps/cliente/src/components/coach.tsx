/**
 * ⭐ **S113-C · lote 0 — EL COACH GANA NOMBRE Y CABECERA: acá habla NEXO.**
 *
 * Tres cosas cambian y ninguna toca las respuestas: **la cabecera** (orbe
 * violeta chico + el nombre, la misma receta de gradiente que el destello del
 * Hogar que este lote retira) · **la presentación** (la primera vez que la
 * Hoja se abre en este dispositivo preside sola; después vive abajo, chica,
 * siempre — *es UNA key en dos lugares, no dos frases que algún día
 * divergen*) · y **la mascota inicial la puede fijar quien abre**, porque
 * ahora la puerta es la almohadilla de Nexo desde cualquier pestaña.
 *
 * 🔴 **NINGUNA PROMESA NUEVA.** Las tres preguntas del v0 y sus plantillas
 * quedan tal cual; el pie que dice que el campo libre AÚN NO existe también.
 * *Un nombre no es un cerebro* — lo que este lote agrega es presencia.
 *
 * ⚠️ **`{{nombre}}` significa DOS COSAS entre estos dos bloques de voz** y se
 * declara acá porque ningún typecheck lo ve: en `coach.*` es LA MASCOTA (voz
 * aprobada en S53, intacta); en `nexo.*` es EL COACH.
 *
 * ── lo de S53, íntegro ──────────────────────────────────────────────────────
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
import Svg from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AvatarMascota,
  Boton,
  HUELLA_BOX,
  Huella,
  radius,
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
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';

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

/** 🔴 LA MARCA DE «YA ME PRESENTÉ» — por DISPOSITIVO, igual que
 *  `epp.cliente.tienePedidos`. Monótona a propósito: presentarse dos veces
 *  se lee como que la app no se acuerda de vos. */
const CLAVE_PRESENTADO = 'epp.cliente.nexo.presentado.v1';

export function CoachHoja({
  visible,
  onCerrar,
  mascotas,
  mascotaInicial,
}: {
  visible: boolean;
  onCerrar: () => void;
  mascotas: MascotaResumen[];
  /** Sobre quién abre la conversación. Lo fija quien la abre (la almohadilla
   *  de Nexo ya resolvió el foco); `undefined` = la primera del hogar, que
   *  es el comportamiento de S53. */
  mascotaInicial?: string;
}) {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();

  const [mascotaId, setMascotaId] = useState<string | null>(mascotaInicial ?? mascotas[0]?.id ?? null);
  /* 🔴 TRES ESTADOS Y NO DOS: `null` es «todavía no leí la marca». Arrancar en
     «no se presentó» pintaría la presentación por un frame a quien ya la vio;
     arrancar en «ya» se la escondería para siempre a quien no. *Vacío por
     carga y vacío por estado no comparten guard.* */
  const [presentado, setPresentado] = useState<boolean | null>(null);
  const [perfil, setPerfil] = useState<PerfilMascota | 'cargando' | 'error'>('cargando');
  const [respuesta, setRespuesta] = useState<string | null>(null);

  const mascota = mascotas.find((m) => m.id === mascotaId) ?? mascotas[0];

  /* La marca se lee una vez por montaje del shell, no por apertura. */
  useEffect(() => {
    let vigente = true;
    void AsyncStorage.getItem(CLAVE_PRESENTADO)
      .then((v) => {
        if (vigente) setPresentado(v === '1');
      })
      .catch(() => {
        /* sin marca legible la presentación se muestra: es la opción que no
           esconde la advertencia. */
        if (vigente) setPresentado(false);
      });
    return () => {
      vigente = false;
    };
  }, []);

  /* Quien abre decide de quién se habla. Sin esto, la Hoja se quedaría con la
     mascota de la apertura anterior — y el atajo diría el nombre de otra. */
  useEffect(() => {
    if (visible && mascotaInicial !== undefined) setMascotaId(mascotaInicial);
  }, [visible, mascotaInicial]);

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

  /* LA CABECERA (S113-C) — orbe violeta chico + el nombre. Los dos stops
     violeta→azul del gradiente FIRMA: **la misma receta que el destello que
     este lote retira del Hogar**, para que Nexo no cambie de color al mudarse
     de esquina. */
  const cabecera = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
      <LinearGradient
        colors={[theme.accent.gradient.colors[1], theme.accent.gradient.colors[2]] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 28, height: 28, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' }}
      >
        <Svg width={16} height={16} viewBox={`0 0 ${HUELLA_BOX} ${HUELLA_BOX}`}>
          <Huella color={theme.text.onGradient} />
        </Svg>
      </LinearGradient>
      <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
        {t('coach.nombre')}
      </Text>
    </View>
  );

  const frase = (
    <Text
      style={{
        fontFamily: typography.family.sans.regular,
        fontSize: typography.size.sm,
        lineHeight: typography.size.sm * typography.leading.normal,
        color: theme.text.tertiary,
      }}
    >
      {t('nexo.presentacion', { nombre: t('coach.nombre') })}
    </Text>
  );

  /* 🔴 LA PRIMERA VEZ PRESIDE SOLA. No es una pantalla de bienvenida: es la
     advertencia que la casa le debe a quien habla con una IA por primera vez,
     **antes** de que le conteste nada. Después vive abajo, chica, siempre —
     la MISMA key, para que no haya dos frases que algún día divergen. */
  if (presentado === false) {
    return (
      <Hoja visible={visible} onCerrar={onCerrar} apertura="marca" conCerrar>
        <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[2], gap: spacing[4] }}>
          {cabecera}
          <Text
            style={{
              fontFamily: typography.family.sans.light,
              fontSize: typography.size.lg,
              lineHeight: typography.size.lg * typography.leading.normal,
              color: theme.text.primary,
            }}
          >
            {t('nexo.presentacion', { nombre: t('coach.nombre') })}
          </Text>
          <Boton
            variante="primario"
            bloque
            etiqueta={t('coach.preguntaSobre', { nombre: mascota.nombre })}
            onPress={() => {
              setPresentado(true);
              void AsyncStorage.setItem(CLAVE_PRESENTADO, '1').catch(() => {
                /* sin marca, la próxima apertura la vuelve a mostrar: se
                   repite la advertencia, jamás se pierde. */
              });
            }}
          />
        </View>
      </Hoja>
    );
  }

  return (
    <Hoja visible={visible} onCerrar={onCerrar} apertura="marca" conCerrar>
      <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[2], gap: spacing[4] }}>
        {cabecera}
        {/* anclada: la conversación abre sabiendo de quién hablas */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          {/* C-B (S112-C) · la cara de su especie, jamás la inicial. El Coach
              HABLA DE ESTA MASCOTA — una «J» sobre un círculo dice que falta
              un dato; la cara de su especie dice de quién estamos hablando.
              El dato ya venía en `MascotaResumen`: no faltaba, no se pedía. */}
          <AvatarMascota
            nombre={mascota.nombre}
            fotoUrl={caraDeMascotaPorRuta({ especie: mascota.especie, rutaImagen: mascota.raza_ruta_imagen })}
            tamano="sm"
          />
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
        {/* y la advertencia, SIEMPRE — la misma frase de la presentación */}
        {frase}
      </View>
    </Hoja>
  );
}
