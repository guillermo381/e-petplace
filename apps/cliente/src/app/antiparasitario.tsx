/**
 * REGISTRAR ANTIPARASITARIO — la única pantalla nueva del lote 0 (S113-C).
 *
 * Ruta raíz con parámetros, **calcada de `/carnet`** (`{ mascotaId, nombre }`):
 * la abre un dedo de la pata desde cualquier pestaña, así que no puede vivir
 * adentro del stack del Hogar.
 *
 * ── LO QUE GUARDA, Y POR QUÉ NO GUARDA MÁS ─────────────────────────────────
 * Producto · tipo · fecha de aplicación · próxima (opcional). **Y nada más.**
 * 🔴 **LA PLAGA —pulgas, garrapatas, mosquitos, internos— NO ESTÁ ACÁ**: la
 * tabla no tiene esa columna hoy. Medido: `evento_desparasitacion_aplicada`
 * guarda `tipo_desparasitacion` como texto libre y el wrapper lo tipa
 * `interna | externa | mixta`, **que es interna/externa, no especie de
 * plaga**. *Preguntar por algo que la base no guarda es inventar* — llega en
 * el lote 1 con su columna.
 *
 * ── LA PRÓXIMA FECHA NACE VACÍA Y NO SE SUGIERE ────────────────────────────
 * El saber está del lado PRODUCTO (`producto_ficha_dosificacion`, 143 filas
 * con periodicidad) y **esta pantalla no lo lee**. Sugerir «en 30 días» sin
 * saber qué producto es sería exactamente lo que la casa llama
 * verosímil-falso: *plausible, sin fuente, y nadie lo duda porque tiene forma
 * de dato.*
 *
 * ── EL PRODUCTO: TEXTO LIBRE CON SUGERENCIAS, JAMÁS UNA LISTA CERRADA ──────
 * Las sugerencias salen de la vitrina publicada (`listarProductosDespensa`
 * con `familia_codigo: 'antiparasitario'`). **Elegir de la lista nunca es
 * obligatorio** — la caja que la familia tiene en la mano puede no estar
 * publicada acá. ⚠️ Y si la vitrina no devuelve ninguno, **no se dibuja una
 * sección vacía**: no hay sugerencias y no se dice nada. *Vacío por carga y
 * vacío por estado no comparten guard: mientras carga tampoco se dibuja, y
 * son dos decisiones distintas escritas aparte.*
 *
 * ── EL REBOTE ──────────────────────────────────────────────────────────────
 * La fecha futura se ataja en pantalla **y** la rechaza el servidor
 * (`fecha_futura`); el orden de las dos fechas **sólo** lo sabe el servidor
 * (`orden_fechas_invalido`) y su razón se muestra en una línea. *El espejo en
 * pantalla existe para que el rebote se lea antes del viaje, jamás para
 * reemplazar la puerta.* El formulario queda intacto: nada se borra al fallar.
 */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  CampoFecha,
  Encabezado,
  EvitaTeclado,
  SelectorOpcion,
  Texto,
  radius,
  spacing,
  useAviso,
  useTheme,
  type CampoFechaValor,
} from '@epetplace/ui';
import {
  listarProductosDespensa,
  registrarDesparasitacion,
  type TipoDesparasitacion,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/** Hoy en fecha LOCAL por partes literales — **jamás `toISOString()`**, que
 *  corre el día en UTC−5 (D-312, hallazgo S55). */
function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

export default function RegistrarAntiparasitario() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const params = useLocalSearchParams<{ mascotaId?: string; nombre?: string }>();
  const mascotaId = params.mascotaId ?? '';
  const nombre = params.nombre ?? t('alta.tuMascota');

  const [producto, setProducto] = useState('');
  const [tipo, setTipo] = useState<TipoDesparasitacion>('interna');
  const [fecha, setFecha] = useState<CampoFechaValor>({ fecha: hoyLocal(), precision: 'exacta' });
  const [proxima, setProxima] = useState<CampoFechaValor | undefined>(undefined);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  /** `null` = todavía no contestó la vitrina. `[]` = contestó y no hay.
   *  **Los dos se dibujan igual (nada) y se calculan aparte.** */
  const [sugerencias, setSugerencias] = useState<string[] | null>(null);

  useEffect(() => {
    let vigente = true;
    void listarProductosDespensa({ familia_codigo: 'antiparasitario', limite: 12 }).then((r) => {
      if (!vigente) return;
      // Un fallo de lectura deja las sugerencias en `null`: no hay lista y no
      // se miente diciendo que no existen productos (Ley 13).
      if (!r.ok) return;
      setSugerencias([...new Set(r.data.map((p) => p.nombre))].slice(0, 8));
    });
    return () => {
      vigente = false;
    };
  }, []);

  const hoy = hoyLocal();
  const fechaFutura = fecha.fecha > hoy;
  const valido = producto.trim().length > 0 && !fechaFutura && !guardando;

  /* ⚠️ El parámetro es `string` y NO `CodigoErrorSalud`, y es una cura
     medida: el `ResultadoWrapper` de la casa **ensancha** el código con
     `'error_desconocido' | 'datos_inconsistentes'`, así que tipar acá el enum
     angosto compila hasta que alguien lee el `.codigo` de verdad. *El default
     cubre todo lo que no se nombra, que es exactamente lo que tiene que
     hacer.* */
  /** Por qué está apagado Guardar. `undefined` = no lo está. */
  const razonDelFreno: string | undefined = guardando
    ? undefined
    : producto.trim().length === 0
      ? t('antiparasitario.faltaProducto')
      : fechaFutura
        ? t('antiparasitario.fechaFutura')
        : undefined;

  const razonDe = (codigo: string): string => {
    if (codigo === 'producto_requerido') return t('antiparasitario.errProducto');
    if (codigo === 'fecha_futura') return t('antiparasitario.errFechaFutura');
    if (codigo === 'orden_fechas_invalido') return t('antiparasitario.errOrden');
    if (codigo === 'sin_acceso' || codigo === 'sin_sesion') return t('antiparasitario.errAcceso');
    return t('antiparasitario.errGenerico');
  };

  const guardar = async () => {
    if (!valido) return;
    setGuardando(true);
    setError(undefined);
    const r = await registrarDesparasitacion(mascotaId, {
      producto: producto.trim(),
      tipo,
      fecha_aplicada: fecha.fecha,
      ...(proxima !== undefined ? { fecha_proxima: proxima.fecha } : null),
    });
    setGuardando(false);
    if (!r.ok) {
      // El formulario queda INTACTO: sólo aparece la razón.
      setError(razonDe(r.codigo));
      return;
    }
    /* El evento del expediente lo crea el TRIGGER. La línea de vida lo va a
       mostrar en su próxima carga y **acá no se dibuja por adelantado**:
       pintar una fila que todavía no existe es prometer con la pantalla lo
       que el motor no confirmó. */
    mostrar({ variante: 'exito', texto: t('antiparasitario.anotado', { mascota: nombre }) });
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('antiparasitario.titulo', { mascota: nombre })}
        atras
        onAtras={() => router.back()}
      />
      <EvitaTeclado>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[4] }}
        >
          <Campo
            label={t('antiparasitario.productoLabel')}
            value={producto}
            onChangeText={setProducto}
            placeholder={t('antiparasitario.productoPlaceholder')}
            ayuda={t('antiparasitario.productoAyuda')}
          />

          {/* Las sugerencias sólo existen si la vitrina devolvió alguna: sin
              ellas, ni el rótulo se dibuja. */}
          {sugerencias !== null && sugerencias.length > 0 ? (
            <View style={{ gap: spacing[2] }}>
              <Texto variante="apoyo">{t('antiparasitario.sugerencias')}</Texto>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
                {sugerencias.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setProducto(s)}
                    accessibilityRole="button"
                    accessibilityLabel={s}
                    style={{
                      paddingVertical: spacing[2],
                      paddingHorizontal: spacing[3],
                      borderRadius: radius.full,
                      backgroundColor: theme.bg.overlay,
                    }}
                  >
                    <Texto variante="apoyo" color="primary">
                      {s}
                    </Texto>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <SelectorOpcion
            etiqueta={t('antiparasitario.tipoLabel')}
            acento="control"
            opciones={[
              { codigo: 'interna', etiqueta: t('antiparasitario.tipoInterna') },
              { codigo: 'externa', etiqueta: t('antiparasitario.tipoExterna') },
              { codigo: 'mixta', etiqueta: t('antiparasitario.tipoMixta') },
            ]}
            seleccionada={tipo}
            onSelect={(codigo) => setTipo(codigo as TipoDesparasitacion)}
          />

          <CampoFecha
            label={t('antiparasitario.fechaLabel')}
            valor={fecha}
            onChange={setFecha}
            placeholder={t('antiparasitario.fechaPlaceholder')}
            tituloHoja={t('antiparasitario.fechaLabel')}
            error={fechaFutura ? t('antiparasitario.fechaFutura') : undefined}
          />

          <CampoFecha
            label={t('antiparasitario.proximaLabel')}
            valor={proxima}
            onChange={setProxima}
            placeholder={t('antiparasitario.proximaPlaceholder')}
            ayuda={t('antiparasitario.proximaAyuda')}
            tituloHoja={t('antiparasitario.proximaLabel')}
          />

          {error !== undefined ? (
            <Texto variante="apoyo" color="danger">
              {error}
            </Texto>
          ) : null}

          {/* 🔴 EL BOTÓN APAGADO DICE POR QUÉ. *Un freno mudo manda a la persona
              a adivinar cuál de los cuatro campos lo tiene trabado* — y acá
              sólo dos pueden trabarlo, así que la razón es exacta y no un
              «revisá los datos». La pieza dibuja la línea sola. */}
          <Boton
            variante="primario"
            bloque
            etiqueta={t('antiparasitario.guardar')}
            cargando={guardando}
            deshabilitado={!valido}
            razonDeshabilitado={razonDelFreno}
            onPress={() => void guardar()}
          />
        </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
