/**
 * S91-D · LA HOJA DEL CENSO — «Quiénes viven acá».
 *
 * Se elige la ESPECIE de un catálogo con cara (el mismo `ChipEntidad` del
 * selector de raza: sujeto `cosa`, tamaño `general`, el ancho lo pone la
 * grilla) y se declara CUÁNTOS con el stepper. **Nunca un pez con nombre** —
 * letra firmada: *el pez se mira; el sistema se cuida*.
 *
 * ⚠️ EL CATÁLOGO ES EL DE RAZAS DE `pez`, y no uno nuevo: son las mismas diez
 * filas con las mismas caras que el alta ya ofrece. Un segundo catálogo de
 * «especies de acuario» sería la clase de duplicado que se separa el día que
 * alguien firma un pez nuevo en uno solo.
 *
 * ── EL TEXTO LIBRE NO ES UN EXTRA (ley S59, ratificada por la mesa) ─────────
 * La especie entra por catálogo **O** por texto libre, XOR. Diez filas no
 * cubren un acuario real, y un dueño con un pez que el catálogo no tiene no
 * puede quedarse sin declarar — es la misma letra que impide validar la raza
 * de un perro contra una lista.
 *
 * ── UNA LLAMADA POR ESPECIE, Y SOLO POR LO QUE CAMBIÓ ──────────────────────
 * La puerta del motor declara UNA especie a la vez. Al confirmar se manda el
 * DIFF contra lo que ya había: sin diff, ajustar un número reenviaría todo el
 * censo y N-1 de esas llamadas serían `sinCambio`. `cantidad: 0` es la forma
 * de sacar una especie —el motor conserva que estuvo—, así que quitar un chip
 * es declarar cero, jamás omitirlo.
 */

import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  Boton,
  Campo,
  ChipEntidad,
  EvitaTeclado,
  Hoja,
  HojaScroll,
  Separador,
  StepperCantidad,
  Texto,
  spacing,
} from '@epetplace/ui';
import {
  declararCensoDelAcuario,
  obtenerRazasDeEspecie,
  type HabitanteDelCenso,
  type RazaCatalogo,
} from '@epetplace/api';

import { urlDeRutaGaleria } from '@/lib/cara-mascota';
import { useTraduccion } from '@/i18n';

/** Tope por especie: un número, no un infinito. 200 guppys es un criadero, y
 *  a esa altura el dato deja de ser un censo de acuario. */
const TOPE = 200;

/** La llave local de una fila: el slug del catálogo, o su nombre si es libre.
 *  El motor resuelve la identidad; acá solo hace falta no pisar dos filas. */
const llave = (h: { razaSlug: string | null; nombre: string }) => h.razaSlug ?? `libre:${h.nombre}`;

export function HabitantesAcuarioHoja({
  visible,
  mascotaId,
  nombre,
  actuales,
  onCerrar,
  onDeclarado,
}: {
  visible: boolean;
  mascotaId: string;
  nombre: string;
  actuales: HabitanteDelCenso[];
  onCerrar: () => void;
  onDeclarado: () => void;
}) {
  const { t } = useTraduccion();
  const [catalogo, setCatalogo] = useState<RazaCatalogo[] | null>(null);
  const [elegidos, setElegidos] = useState<HabitanteDelCenso[]>(actuales);
  const [libre, setLibre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // Al reabrir, el borrador arranca de lo que HAY: una Hoja que olvida lo
  // declarado obliga a re-declarar todo para cambiar un número.
  useEffect(() => {
    if (visible) {
      setElegidos(actuales);
      setLibre('');
      setError(undefined);
    }
  }, [visible, actuales]);

  useEffect(() => {
    let vigente = true;
    void obtenerRazasDeEspecie('pez').then((r) => {
      // Un fallo NO se degrada a lista vacía (L-178): sin catálogo no se puede
      // elegir del catálogo, pero el texto libre sigue vivo — por eso el fallo
      // no cierra la Hoja.
      if (vigente && r.ok) setCatalogo(r.data);
    });
    return () => {
      vigente = false;
    };
  }, []);

  const porLlave = useMemo(() => new Set(elegidos.map(llave)), [elegidos]);

  const alternar = (r: RazaCatalogo) => {
    setError(undefined);
    setElegidos((prev) =>
      prev.some((h) => h.razaSlug === r.slug)
        ? prev.filter((h) => h.razaSlug !== r.slug)
        : [
            ...prev,
            {
              razaSlug: r.slug,
              nombre: r.nombre,
              rutaImagen: r.ruta_imagen,
              esDelCatalogo: true,
              cantidad: 1,
              declaradoEn: '',
            },
          ],
    );
  };

  const agregarLibre = () => {
    const texto = libre.trim();
    if (texto.length === 0) return;
    setError(undefined);
    setLibre('');
    setElegidos((prev) =>
      prev.some((h) => h.nombre.toLowerCase() === texto.toLowerCase())
        ? prev
        : [
            ...prev,
            {
              razaSlug: null,
              nombre: texto,
              rutaImagen: null,
              esDelCatalogo: false,
              cantidad: 1,
              declaradoEn: '',
            },
          ],
    );
  };

  const guardar = async () => {
    if (guardando) return;
    setGuardando(true);
    setError(undefined);

    const antes = new Map(actuales.map((h) => [llave(h), h.cantidad]));
    const ahora = new Map(elegidos.map((h) => [llave(h), h]));

    /** El DIFF: lo que cambió de cantidad, más lo que se sacó (cantidad 0). */
    const aDeclarar: { especie: { razaSlug: string } | { nombreLibre: string }; cantidad: number }[] = [];
    for (const h of elegidos) {
      if (antes.get(llave(h)) !== h.cantidad) {
        aDeclarar.push({
          especie: h.razaSlug !== null ? { razaSlug: h.razaSlug } : { nombreLibre: h.nombre },
          cantidad: h.cantidad,
        });
      }
    }
    for (const h of actuales) {
      if (!ahora.has(llave(h))) {
        aDeclarar.push({
          especie: h.razaSlug !== null ? { razaSlug: h.razaSlug } : { nombreLibre: h.nombre },
          cantidad: 0,
        });
      }
    }

    for (const d of aDeclarar) {
      const r = await declararCensoDelAcuario(mascotaId, d.cantidad, d.especie);
      if (!r.ok) {
        setGuardando(false);
        // El rebote del motor se dice tal cual: es el único que sabe por qué
        // (siete códigos tipados). Traducirlo a un genérico acá perdería la
        // única información útil que tiene el dueño para arreglarlo.
        setError(r.mensaje);
        return;
      }
      // `sinCambio: true` NO es un error: la cantidad ya era ésa y el motor no
      // escribió. Tratarlo como fallo haría que confirmar dos veces se sienta
      // roto.
    }

    setGuardando(false);
    onDeclarado();
    onCerrar();
  };

  return (
    <Hoja visible={visible} onCerrar={onCerrar} titulo={t('perfil.habitantesHojaTitulo', { nombre })} altura="completa">
      <EvitaTeclado>
        <View style={{ flex: 1, gap: spacing[4] }}>
          <HojaScroll contentContainerStyle={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            <Texto variante="apoyo">{t('perfil.habitantesHojaAyuda')}</Texto>

            <View
              accessibilityRole="radiogroup"
              accessibilityLabel={t('perfil.habitantesHojaElegir')}
              style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}
            >
              {(catalogo ?? []).map((r) => {
                const url = urlDeRutaGaleria(r.ruta_imagen);
                return (
                  <View key={r.slug} style={{ flexBasis: '47%', flexGrow: 1 }}>
                    <ChipEntidad
                      nombre={r.nombre}
                      {...(url !== undefined ? { fotoUrl: url } : null)}
                      sujeto="cosa"
                      tamano="general"
                      elegido={porLlave.has(r.slug)}
                      onPress={() => alternar(r)}
                    />
                  </View>
                );
              })}
            </View>

            {/* La que el catálogo no tiene (ley S59) */}
            <Campo
              label={t('perfil.habitantesOtraLabel')}
              placeholder={t('perfil.habitantesOtraPlaceholder')}
              value={libre}
              onChangeText={setLibre}
              autoCapitalize="words"
              onSubmitEditing={agregarLibre}
            />
            <Boton
              variante="ghost"
              bloque
              etiqueta={t('perfil.habitantesOtraAgregar')}
              deshabilitado={libre.trim().length === 0}
              onPress={agregarLibre}
            />

            {elegidos.length > 0 ? (
              <>
                <Separador />
                {elegidos.map((h) => (
                  <StepperCantidad
                    key={llave(h)}
                    etiqueta={h.nombre}
                    valor={h.cantidad}
                    min={1}
                    max={TOPE}
                    onCambio={(v) =>
                      setElegidos((prev) => prev.map((x) => (llave(x) === llave(h) ? { ...x, cantidad: v } : x)))
                    }
                  />
                ))}
              </>
            ) : null}
          </HojaScroll>

          {error !== undefined ? (
            <Texto variante="apoyo" color="danger">
              {error}
            </Texto>
          ) : null}
          <Boton
            etiqueta={t('perfil.habitantesHojaGuardar')}
            bloque
            cargando={guardando}
            onPress={() => void guardar()}
          />
        </View>
      </EvitaTeclado>
    </Hoja>
  );
}
