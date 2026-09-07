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
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Linking } from 'react-native';
import {
  Encabezado,
  HojaTraerPapeles,
  Hoja,
  PantallaDocumentos,
  Separador,
  Tarjeta,
  spacing,
  Texto,
  type GrupoDePapeles,
} from '@epetplace/ui';
import {
  obtenerPapelesDeMascota,
  type ConsultaConReceta,
  type PapelDeMascota,
  type TipoDocumentoExpediente,
} from '@epetplace/api';

/* La fila vive en el cliente, no en `ui` — es la misma que usaba el plegable. */
import { FilaDocumento } from '@/components/fila-documento';

import {
  PAPELES_DE_MASCOTA,
  type Papel,
} from '@/lib/papeles';
import { abrirReceta, resolverDescarga, type Descarga } from '@/lib/descarga-papel';
import { useTraerPapeles } from '@/components/traer-papeles';
import { useTraduccion } from '@/i18n';

export default function RutaDocumentos() {
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
  const [viendo, setViendo] = useState<PapelDeMascota | null>(null);

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

  /* ⭐ **LOS PAPELES TRAÍDOS** (fase 3 · C2). Su sección dejó de ser un lugar
     reservado: la puerta de A existe y la bóveda se lee. */
  const [traidos, setTraidos] = useState<PapelDeMascota[] | null>(null);
  const recargar = useCallback(() => {
    void obtenerPapelesDeMascota(mascotaId).then((r) => {
      /* Un fallo deja `null` y **la lista no se monta**: *media bóveda con
         papeles y media sin es peor que ninguna — la que falta se lee como «no
         tiene», no como «no cargó»*. */
      if (r.ok) setTraidos(r.data);
    });
  }, [mascotaId]);
  useEffect(recargar, [recargar]);

  const traer = useTraerPapeles(mascotaId, recargar);

  /* 🔴 **Los cuatro grupos de la pieza, y el mapa es del DATO al GRUPO.** La
     bóveda guarda seis clases y la pantalla muestra cuatro cajones: *un cajón
     por clase haría que «certificado» y «otro» tuvieran su propio rótulo con
     una fila cada uno.* Lo que la casa emite va aparte, en «propios». */
  const grupos: readonly GrupoDePapeles[] = [
    {
      grupo: 'examenes' as const,
      rotulo: t('documentos.grupoExamenes'),
      papeles: (traidos ?? [])
        .filter((p) => p.clase === 'laboratorio' || p.clase === 'imagen')
        .map((p) => ({
          id: p.id,
          grupo: 'examenes' as const,
          titulo: p.titulo ?? t('documentos.examenSinTitulo'),
          origen: p.origen ?? undefined,
          fecha: p.fecha_papel ?? undefined,
          onPress: () => setViendo(p),
        })),
    },
    {
      grupo: 'recetas' as const,
      rotulo: t('documentos.grupoRecetas'),
      papeles: (traidos ?? [])
        .filter((p) => p.clase === 'receta')
        .map((p) => ({
          id: p.id,
          grupo: 'recetas' as const,
          titulo: p.titulo ?? t('documentos.recetaSinTitulo'),
          origen: p.origen ?? undefined,
          fecha: p.fecha_papel ?? undefined,
          onPress: () => setViendo(p),
        })),
    },
    {
      grupo: 'informes' as const,
      rotulo: t('documentos.grupoInformes'),
      papeles: (traidos ?? [])
        .filter((p) => p.clase === 'informe' || p.clase === 'certificado' || p.clase === 'otro')
        .map((p) => ({
          id: p.id,
          grupo: 'informes' as const,
          titulo: p.titulo ?? t('documentos.informeSinTitulo'),
          origen: p.origen ?? undefined,
          fecha: p.fecha_papel ?? undefined,
          onPress: () => setViendo(p),
        })),
    },
    {
      grupo: 'propios' as const,
      rotulo: t('documentos.deLaCasa'),
      papeles: deLaCasa.map((papel) => ({
        id: papel.tipo,
        grupo: 'propios' as const,
        titulo: t(`documentos.nombre${papel.claveVoz}` as 'documentos.nombreCarnetVacunas'),
        onPress: () => {
          void bajar(papel.tipo);
        },
      })),
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <Encabezado
        variante="navegacion"
        titulo={t('documentos.titulo')}
        atras
        onAtras={() => router.back()}
      />
      {/* ⭐ **LA PIEZA DE B, con la bóveda viva** (fase 3 · C2).
          Acá vivía una composición propia con dos secciones a mano. *La pieza
          hace lo mismo y además agrupa, oculta los grupos vacíos y trae su
          vacío* — mantener la mía sería una segunda forma de lo mismo que
          alguien tendría que mantener sincronizada.

          ⛔ **En memorial el «traer» no se ofrece**: `A3.9` apaga los pedidos,
          no las lecturas. La pieza exige el slot, así que se le pasa con su
          voz de memorial y sin acto — *un botón que no hace nada es peor que
          no tenerlo*, y por eso la voz lo dice en vez de fingir. */}
      <PantallaDocumentos
        grupos={grupos}
        traer={{
          voz: esMemorial ? t('documentos.traerMemorial') : t('traerPapeles.titulo'),
          onPress: esMemorial ? () => undefined : traer.abrir,
        }}
        /* 🔴 **SIN NOMBRE, LA VOZ NO LO NOMBRA** (`verify:voz-sin-hueco`, y el
           gate lo cazó en el cierre). `nombre` viene por parámetro de ruta y
           puede faltar: con `?? ''` la pantalla decía *«Todavía no hay papeles
           de .»* — *es el defecto exacto que A me encontró en aparato con «Lo
           que sé de » y por el que existe este gate.*
           Sin nombre se usa la voz sin sujeto, que es correcta igual: la
           mascota ya está en el encabezado. */
        vozVacio={
          esMemorial || nombre === undefined || nombre.trim() === ''
            ? t('documentos.vacioMemorial')
            : t('documentos.vacio', { nombre })
        }
      />

      {/* El flujo de traer: **la misma Hoja desde las dos puertas** (C2). */}
      <HojaTraerPapeles
        visible={traer.visible}
        onCerrar={traer.cerrar}
        titulo={t('traerPapeles.titulo')}
        estado={traer.estado}
        vozFoto={t('traerPapeles.foto')}
        vozArchivo={t('traerPapeles.archivo')}
        vozLeyendo={t('traerPapeles.leyendo')}
        vozLeyendoLarga={t('traerPapeles.leyendoLarga')}
        vozGuardar={t('traerPapeles.guardar')}
      />

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
