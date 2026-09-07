/**
 * ⭐ **LA BÓVEDA DE PAPELES** (S113-C · fase 3 · C1).
 *
 * Corrección del founder: *Documentos gana pantalla propia, y la bóveda vive
 * adentro.* Deja de ser un plegable de «Identidad y papeles» y pasa a ser **el
 * lugar donde la familia guarda y consulta los papeles de su mascota** — los
 * que trae de otra clínica y los que la casa emite.
 *
 * ── POR QUÉ UNA PANTALLA Y NO UN PLEGABLE ─────────────────────────────────
 * El plegable tenía sitio para cinco filas y ninguna más. *Una bóveda que sólo
 * puede mostrar lo que ya existe no es una bóveda: es un índice.* Con papeles
 * traídos de otra clínica la lista crece sin techo, se agrupa por tipo y cada
 * fila necesita decir de dónde vino y cuándo — nada de eso entra en un
 * desplegable bajo el último rótulo del perfil.
 *
 * ── QUÉ SE TRAJO DEL PLEGABLE, ENTERO ─────────────────────────────────────
 * Los cinco papeles de la casa con su descarga (`resolverDescarga`), **la
 * elección de consulta para la receta** —que tiene N candidatas y por eso abre
 * su propia Hoja—, el estado de carga por fila y **la voz del fallo**, que en
 * el plegable estaba y no se pierde: *un papel que no baja lo dice* (Ley 13).
 *
 * ── ⛔ MEMORIAL: SE LEE ENTERO, NO SE TRAE ────────────────────────────────
 * Firma del founder (C5): *de quien ya no está se siguen leyendo sus papeles*
 * — la lista completa, la descarga, todo. **Lo que no se ofrece es traer más**:
 * pedirle a una familia en duelo que busque papeles de otra clínica es pedirle
 * una gestión, y `A3.9` apaga los pedidos, no las lecturas.
 *
 * ── LO QUE ESTA PANTALLA TODAVÍA NO TIENE, dicho por nombre ───────────────
 * 🔴 **La lista de papeles TRAÍDOS.** `papeles_familia` y `papel_valor` son de
 * A y **no están publicados** — medido contra `main` y contra mi árbol al
 * escribir esto. La pantalla ya reserva su lugar y su vacío; el día que la
 * puerta exista, entra la lista y **el botón de traer se enciende**.
 * *Prefiero una pantalla que declara su mitad faltante a una que la simula.*
 */
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Linking } from 'react-native';
import {
  Encabezado,
  EstadoVacio,
  Hoja,
  Separador,
  Tarjeta,
  Texto,
  spacing,
} from '@epetplace/ui';
import type { ConsultaConReceta, TipoDocumentoExpediente } from '@epetplace/api';

/* La fila vive en el cliente, no en `ui` — es la misma que usaba el plegable. */
import { FilaDocumento } from '@/components/fila-documento';

import {
  PAPELES_DE_MASCOTA,
  type Papel,
} from '@/lib/papeles';
import { abrirReceta, resolverDescarga, type Descarga } from '@/lib/descarga-papel';
import { useTraduccion } from '@/i18n';

export default function PantallaDocumentos() {
  const { mascotaId, nombre, memorial } = useLocalSearchParams<{
    mascotaId: string;
    nombre?: string;
    memorial?: string;
  }>();
  const { t } = useTraduccion();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [bajando, setBajando] = useState<TipoDocumentoExpediente | null>(null);
  const [falla, setFalla] = useState<string | null>(null);
  const [neutro, setNeutro] = useState<string | null>(null);
  const [eligiendoReceta, setEligiendoReceta] = useState<ConsultaConReceta[] | null>(null);

  /* ⛔ El «traer» se apaga en memorial. La lista NO: se lee entera. */
  const esMemorial = memorial === '1';

  /* La misma mecánica que tenía el plegable, con su voz propia.
     🔴 `sinActos` NO es un fallo: *«todavía no hay recetas» no es un error del
     que disculparse* — va en voz neutra y fuera de la línea roja. */
  const ejecutar = async (d: Descarga) => {
    if (d.modo === 'abrir') await Linking.openURL(d.url);
    else if (d.modo === 'falla') setFalla(d.mensaje);
    else if (d.modo === 'sinActos') setNeutro(t('documentos.recetaSinConsultas'));
  };

  const bajar = async (tipo: TipoDocumentoExpediente) => {
    setFalla(null);
    setNeutro(null);
    setBajando(tipo);
    const d = await resolverDescarga(mascotaId, tipo);
    setBajando(null);
    /* La receta puede tener N consultas: **la pantalla no elige por la
       familia**, abre su Hoja. Es la misma mecánica que tenía el plegable. */
    if (d.modo === 'elegir') {
      setEligiendoReceta(d.consultas);
      return;
    }
    await ejecutar(d);
  };

  const elegirConsulta = async (citaId: string) => {
    setEligiendoReceta(null);
    setFalla(null);
    setBajando('receta');
    const d = await abrirReceta(mascotaId, citaId);
    setBajando(null);
    await ejecutar(d);
  };

  const deLaCasa: readonly Papel[] = PAPELES_DE_MASCOTA;

  return (
    <View style={{ flex: 1 }}>
      <Encabezado
        variante="navegacion"
        titulo={t('documentos.titulo')}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8], gap: spacing[6] }}
      >
        {/* 🔴 **EL «TRAER» VA ARRIBA Y HOY NO SE DIBUJA.** Su puerta
            (`papeles_familia`, A) todavía no existe: *un botón que no puede
            guardar nada no es una promesa, es una mentira con un toque de
            distancia* (`L-318` — motor sin puerta, del lado de la superficie).
            Entra en C2, en el mismo acto que su flujo. */}

        <View style={{ paddingHorizontal: spacing[5], gap: spacing[3] }}>
          <Texto variante="seccion">{t('documentos.deLaCasa')}</Texto>
          {/* Los cinco que e-PetPlace emite. **Marcados como propios** para
              distinguirlos de los traídos el día que convivan: *un informe de
              otra clínica y un carnet que emitimos nosotros no tienen la misma
              autoridad, y la fila tiene que dejarlo ver.* */}
          <Tarjeta relleno="ninguno" elevacion="reposo">
            {deLaCasa.map((papel, i) => (
              <View key={papel.tipo}>
                {i > 0 ? <Separador /> : null}
                <FilaDocumento
                  icono={papel.icono}
                  nombre={t(`documentos.nombre${papel.claveVoz}` as 'documentos.nombreCarnetVacunas')}
                  apoyo={t('documentos.descargar')}
                  cargando={bajando === papel.tipo}
                  onPress={() => {
                    void bajar(papel.tipo);
                  }}
                />
              </View>
            ))}
          </Tarjeta>
          {/* Ley 13: el fallo DICE que es fallo, jamás silencio. */}
          {falla !== null ? <Texto variante="dato" color="danger">{falla}</Texto> : null}
          {neutro !== null ? <Texto variante="apoyo">{neutro}</Texto> : null}
        </View>

        {/* ⭐ **EL LUGAR DE LOS PAPELES TRAÍDOS, con su vacío ya escrito.**
            Hoy dice la verdad —no hay ninguno, y no hay cómo traerlos— y el
            día que la puerta de A exista, la lista entra acá agrupada por tipo.
            ⛔ En memorial el vacío **no invita**: sería pedir una gestión. */}
        <View style={{ paddingHorizontal: spacing[5], gap: spacing[3] }}>
          <Texto variante="seccion">{t('documentos.deOtrasClinicas')}</Texto>
          <EstadoVacio
            registro="seccion"
            titulo={
              esMemorial
                ? t('documentos.vacioMemorial')
                : t('documentos.vacio', { nombre: nombre ?? '' })
            }
          />
        </View>
      </ScrollView>

      {/* La Hoja de la receta: N consultas, la familia elige cuál. */}
      <Hoja
        visible={eligiendoReceta !== null}
        onCerrar={() => setEligiendoReceta(null)}
        titulo={t('documentos.quéReceta')}
      >
        <Tarjeta relleno="ninguno" elevacion="reposo">
          {(eligiendoReceta ?? []).map((c, i) => (
            <View key={c.citaId}>
              {i > 0 ? <Separador /> : null}
              <FilaDocumento
                icono="receta"
                nombre={c.negocio ?? c.fecha}
                apoyo={t('documentos.recetaMedicamentos', { n: c.medicamentos })}
                cargando={false}
                onPress={() => {
                  void elegirConsulta(c.citaId);
                }}
              />
            </View>
          ))}
        </Tarjeta>
      </Hoja>
    </View>
  );
}
