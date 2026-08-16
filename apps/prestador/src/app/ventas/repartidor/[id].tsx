/**
 * LA FICHA DEL REPARTIDOR (S99-C · L2) — alta Y edición, UNA pantalla.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * LA FRASE QUE ORDENA TODO, de la receta de forma (toque 1 de B):
 * ***no es un formulario — es la ficha de la persona que toca el timbre
 * de una familia.***
 *
 * Y la vara firmada por el founder, en su orden:
 * **FUNCIONA · SEGURO · EFICIENTE · ELEGANTE · ESPECTACULAR.** Ninguna se
 * salta y la primera no basta.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── §3 · POR QUÉ ES PANTALLA Y NO HOJA ─────────────────────────────────
 * Dos razones, y ninguna es de tamaño: ① una Hoja es para una DECISIÓN,
 * una pantalla es para un SUJETO —y acá hay una persona con identidad,
 * papeles, vehículos e historia; el precedente literal de la casa es el
 * alta de mascota, que son CUATRO pantallas—; ② la Hoja monta un `Modal`
 * nativo y su desmontaje se lleva el foco y el teclado, que con doce
 * controles y dos capturas encima es la superficie equivocada.
 *
 * ── UNA PIEZA, DOS ENTRADAS (`nuevo` y `[id]`) ─────────────────────────
 * D-791 lo dice con todas las letras: *«reconstruir la sección sin
 * caminos de edición sería reconstruir el defecto»*. **Lo único que
 * cambia entre las dos entradas es que con `[id]` la cabecera ya tiene
 * cara.** *Si aparece un segundo `if (esNuevo)`, el clon está volviendo
 * por la ventana.*
 *
 * ── ① LA CABECERA ES UN ESPEJO, y es el gesto ESPECTACULAR ─────────────
 * Es **N17 aplicada a una persona**: el vendedor da de alta a alguien
 * VIENDO la tarjeta que va a ver la familia (foto · nombre · vehículo ·
 * placa — firma del founder, punto 11: *«Estándar Rappi Uber, sí»*). Por
 * eso sabe, sin que nadie se lo explique, si esa foto sirve para
 * reconocer a quien toca el timbre. *Una foto contra un fondo negro se
 * descubre en la puerta de una casa, o se descubre acá.* **Y es gratis:
 * esa tarjeta hay que dibujarla igual.**
 *
 * ── 🔴 LAS DOS FOTOS NO SON LA MISMA COSA (§4.1) ───────────────────────
 * Hoy pesan igual —dos bloques idénticos, uno debajo del otro— y son dos
 * naturalezas distintas:
 *   · la de la PERSONA es **identidad**: vive en la cabecera, grande.
 *   · la del DOCUMENTO es **evidencia**: vive en ③, en **miniatura**, y
 *     se abre entera solo por acto deliberado (`VisorFoto`).
 * **Y la asimetría tiene mitad de SEGURIDAD, que es la vara ②:** el
 * documento es dato de identidad de un tercero en bucket privado.
 * *Mostrarlo a tamaño completo por default es exponerlo cada vez que
 * alguien abre la ficha en un mostrador con gente al lado.* Miniatura no
 * es preferencia estética: es la dosis correcta de un dato que solo hay
 * que poder **verificar**, no **contemplar**.
 *
 * ── 🔴 EL TELÉFONO MUERE Y EL SELECTOR SE MUDA, NO SE VA CON ÉL ────────
 * La firma dice *«teléfonos convencionales no pedimos, solo WhatsApp»*.
 * **El campo que muere es el ÚNICO que tenía el selector de indicativo, y
 * el que sobrevive es el que no lo tenía.** Un borrado prolijo dejaría
 * exactamente lo que la firma prohíbe: un WhatsApp obligatorio sin
 * indicativo, componiendo un E.164 que la fuente rebota.
 * *Nadie lo iba a ver: el diff de un borrado se lee como una resta.*
 * ⇒ acá WhatsApp usa `ControlTelefono`, con el selector heredado.
 *
 * ── EFICIENTE (N16) ────────────────────────────────────────────────────
 * Las lecturas van **en paralelo, jamás encadenadas** (N16.1) · la espera
 * es `Esqueleto`, no spinner (N16.2) · la foto de la cabecera tiene
 * **medidas explícitas** para que la pantalla no salte al cargar (N16.3).
 *
 * ── ⑤ LOS VIAJES: NO SE MONTAN, Y ES DECISIÓN MEDIDA ───────────────────
 * La receta los pide derivados (§4.6). **El dato existe en la base**
 * (`envios.repartidor_id` + `envios.entregado_en`, medido) **pero no hay
 * lector**: `misEntregasAsignadas()` es del repartidor logueado, no del
 * vendedor mirándolo. Montar la sección hoy obligaría a pintar un cero
 * fijo, y **un cero fijo miente sobre un repartidor que sí entregó**
 * (L-139). Las voces ya viven en el diccionario para que el día que el
 * lector llegue no haya que inventarlas con apuro. **Pedido a A,
 * declarado en el parte.**
 */

import { useCallback, useMemo, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  EvitaTeclado,
  Hoja,
  HojaCaptura,
  HojaScroll,
  MarcaDeAgua,
  SelectorOpcion,
  Separador,
  Tarjeta,
  Texto,
  VisorFoto,
  radius,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  actualizarRepartidor,
  eliminarVehiculoRepartidor,
  obtenerPaisesDelMundo,
  listarRepartidores,
  registrarRepartidor,
  registrarVehiculoRepartidor,
  type PaisDelMundo,
  type Repartidor,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { ControlTelefono } from '@/components/perfil-piezas';
import { contextoVentas } from '@/lib/cuenta-ventas';
import { resolverUrlFotoCuenta } from '@/lib/foto-cuenta';
import { PAIS_DEFAULT, bandera, componerE164, paisDe } from '@/lib/paises';
import {
  normalizarPlaca,
  tecladoDeDocumento,
  validarPlaca,
  type FalloPlaca,
  type TipoVehiculo,
} from '@/lib/placa-vehiculo';
import { subirImagenDeCuenta } from '@/lib/subir-documento';

type TipoDoc = 'CEDULA' | 'PASAPORTE' | 'RUC';

/** Un vehículo EN EDICIÓN. `id` presente = ya vive en la base. */
interface VehiculoBorrador {
  /** null = nuevo, todavía sin fila. */
  id: string | null;
  tipo: TipoVehiculo;
  placa: string;
  /** El fallo se guarda POR VEHÍCULO: validar al salir del campo (N12.3)
   *  exige recordar cuál falló, no un booleano global. */
  fallo: FalloPlaca | null;
}

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; cuentaComercialId: string };

export default function FichaRepartidor() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  /** La ÚNICA bifurcación legal entre las dos entradas (§3). */
  const esNuevo = id === 'nuevo';

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);

  // ── la persona ───────────────────────────────────────────────────────
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [tipoDoc, setTipoDoc] = useState<TipoDoc | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [correo, setCorreo] = useState('');
  const [correoTocado, setCorreoTocado] = useState(false);
  const [paisIso, setPaisIso] = useState(PAIS_DEFAULT);
  const [paises, setPaises] = useState<PaisDelMundo[]>([]);
  const [eligiendoPais, setEligiendoPais] = useState(false);

  // ── las fotos ────────────────────────────────────────────────────────
  /** `uri` local recién elegida · `url` firmada de lo ya guardado. Se
   *  distinguen porque la local hay que SUBIRLA y la firmada no. */
  const [fotoUriLocal, setFotoUriLocal] = useState<string | null>(null);
  const [fotoUrlGuardada, setFotoUrlGuardada] = useState<string | null>(null);
  const [docUriLocal, setDocUriLocal] = useState<string | null>(null);
  const [docUrlGuardada, setDocUrlGuardada] = useState<string | null>(null);
  const [capturando, setCapturando] = useState<'persona' | 'documento' | null>(null);
  const [viendoDoc, setViendoDoc] = useState(false);

  // ── los vehículos ────────────────────────────────────────────────────
  const [vehiculos, setVehiculos] = useState<VehiculoBorrador[]>([]);

  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    const ctx = await contextoVentas();
    if (!ctx.ok || ctx.data === null || !ctx.data.esVendedora) {
      setPantalla({ estado: 'error' });
      return;
    }
    const cuentaId = ctx.data.cuentaComercialId;

    /* N16.1 — EN PARALELO, jamás encadenadas. El catálogo de países y la
       lista de repartidores no dependen entre sí; encadenarlas sumaría un
       viaje entero a la primera pantalla. */
    const [rPaises, rReps] = await Promise.all([
      obtenerPaisesDelMundo(),
      esNuevo
        ? Promise.resolve({ ok: true as const, data: [] as Repartidor[] })
        : listarRepartidores(cuentaId),
    ]);

    if (rPaises.ok) setPaises(rPaises.data);

    if (!esNuevo) {
      if (!rReps.ok) {
        setPantalla({ estado: 'error' });
        return;
      }
      const yo = rReps.data.find((r) => r.repartidor_id === id);
      if (yo === undefined) {
        // Un id que no está en MI casa no es un error de red: es una ficha
        // que no me pertenece. Se dice, no se pinta vacía (Ley 13).
        setPantalla({ estado: 'error' });
        return;
      }
      setNombre(yo.nombre);
      setDocumento(yo.documento ?? '');
      setTipoDoc((yo.tipo_documento as TipoDoc | null) ?? null);
      /* 🔴 EL CORREO NO SE PRE-LLENA, Y NO ES OLVIDO: `listarRepartidores`
         **no lo devuelve** (medido contra el tipo `Repartidor`). Por eso en
         EDICIÓN el campo nace vacío y **solo viaja si la persona escribe
         algo** — mandarlo vacío lo BORRARÍA, que es exactamente el modo de
         falla que el contrato del wrapper advierte: *«si un campo ausente
         vaciara, corregir el nombre le borraría la foto del documento y
         nadie se enteraría hasta necesitarla»*. Y por eso tampoco se EXIGE
         al editar: obligaría a re-tipearlo cada vez que se corrige el
         nombre. **Pedido a A: que el lector lo traiga.** */
      /* El WhatsApp guardado viene E.164 ENTERO (`+593…`). El campo lo
         muestra SIN prefijo porque el indicativo vive a su izquierda —
         mostrarlo dos veces enseñaría a escribirlo dos veces. */
      const guardadoWa = yo.whatsapp ?? '';
      const prefijoPais = paisDe(rPaises.ok ? rPaises.data : [], PAIS_DEFAULT)?.prefijo ?? '';
      setWhatsapp(
        prefijoPais.length > 0 && guardadoWa.startsWith(prefijoPais)
          ? guardadoWa.slice(prefijoPais.length)
          : guardadoWa,
      );
      setVehiculos(
        yo.vehiculos.map((v) => ({
          id: v.vehiculo_id,
          tipo: v.tipo as TipoVehiculo,
          placa: v.placa,
          fallo: null,
        })),
      );
      /* Las dos firmas, EN PARALELO (N16.1). `null` = no se pudo firmar y
         la pantalla lo dice con el hueco, jamás con una imagen rota. */
      const [uFoto, uDoc] = await Promise.all([
        yo.foto_path !== null ? resolverUrlFotoCuenta(yo.foto_path) : Promise.resolve(null),
        yo.documento_foto_path !== null
          ? resolverUrlFotoCuenta(yo.documento_foto_path)
          : Promise.resolve(null),
      ]);
      setFotoUrlGuardada(uFoto);
      setDocUrlGuardada(uDoc);
    }

    setPantalla({ estado: 'listo', cuentaComercialId: cuentaId });
  }, [esNuevo, id]);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        if (!vigente) return;
        await cargar();
      })();
      return () => {
        vigente = false;
      };
    }, [cargar, intento]),
  );

  /** Lo que se PINTA en la cabecera y en la miniatura: lo recién elegido
   *  gana sobre lo guardado — es lo que la persona acaba de hacer. */
  const fotoAMostrar = fotoUriLocal ?? fotoUrlGuardada;
  const docAMostrar = docUriLocal ?? docUrlGuardada;

  /** El vehículo que la familia ve es el PRIMERO (§2: foto·nombre·
   *  vehículo·placa). Con dos, la tarjeta no crece: la familia recibe una
   *  entrega, no un inventario. */
  const vehiculoEspejo = vehiculos[0] ?? null;

  const correoValido = useMemo(() => {
    const v = correo.trim();
    // Piso honesto, no una validación de RFC: hay algo, un @ en el medio y
    // un punto después. Rechazar direcciones raras pero válidas sería peor
    // que aceptar una mal tipeada — el motor normaliza y el vendedor mira.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }, [correo]);

  /** QUÉ FALTA — en el orden en que se lee la pantalla, para que el aviso
   *  apunte a lo primero que hay que arreglar y no a lo último. */
  const loQueFalta = useMemo((): string | null => {
    if (fotoAMostrar === null) return t('fichaRepartidor.faltaFoto');
    if (nombre.trim().length === 0) return t('fichaRepartidor.faltaNombre');
    if (whatsapp.trim().length === 0) return t('fichaRepartidor.faltaWhatsapp');
    /* EL CORREO SE EXIGE EN EL ALTA Y NO EN LA EDICIÓN, y la asimetría
       está medida, no elegida: el lector no lo devuelve (ver la carga), así
       que al editar el campo nace vacío y exigirlo obligaría a re-tipearlo
       para corregir un nombre. En el alta la firma manda: es obligatorio y
       punto. Lo que SÍ se valida en las dos: si escribió algo, que sirva. */
    if (esNuevo && correo.trim().length === 0) return t('fichaRepartidor.faltaCorreo');
    if (correo.trim().length > 0 && !correoValido) return t('fichaRepartidor.correoInvalido');
    if (documento.trim().length === 0) return t('fichaRepartidor.faltaDocumento');
    return null;
  }, [esNuevo, fotoAMostrar, nombre, whatsapp, correo, correoValido, documento, t]);

  /** Una placa a medio escribir NO bloquea el guardado del resto: el
   *  vehículo se agrega aparte y su rebote se dice en su propia fila. */
  const puedeGuardar = loQueFalta === null && !guardando;

  function alElegirFoto(cual: 'persona' | 'documento', uri: string): void {
    if (cual === 'persona') setFotoUriLocal(uri);
    else setDocUriLocal(uri);
  }

  function validarVehiculo(indice: number): void {
    setVehiculos((prev) =>
      prev.map((v, i) => (i === indice ? { ...v, fallo: validarPlaca(v.placa, v.tipo) } : v)),
    );
  }

  function vozDeFallo(fallo: FalloPlaca): string {
    return fallo === 'vacia'
      ? t('fichaRepartidor.placaVacia')
      : fallo === 'formato_moto'
        ? t('fichaRepartidor.placaFormatoMoto')
        : t('fichaRepartidor.placaFormatoCarro');
  }

  async function guardar(): Promise<void> {
    if (pantalla.estado !== 'listo' || !puedeGuardar) return;
    setGuardando(true);
    const cuentaId = pantalla.cuentaComercialId;

    /* LAS FOTOS PRIMERO, y el orden importa: si una subida falla, NO se
       toca la ficha. Al revés dejaría una persona a medias. */
    let fotoPath: string | undefined;
    let docPath: string | undefined;
    for (const [uri, prefijo, set] of [
      [fotoUriLocal, 'repartidor-persona', (p: string) => (fotoPath = p)],
      [docUriLocal, 'repartidor-doc', (p: string) => (docPath = p)],
    ] as const) {
      if (uri === null) continue;
      const sub = await subirImagenDeCuenta({ uri, cuentaComercialId: cuentaId, prefijo });
      if (!sub.ok) {
        setGuardando(false);
        mostrar({ texto: t('fichaRepartidor.fotoFallo'), variante: 'error' });
        return;
      }
      set(sub.path);
    }

    const whatsappE164 = componerE164(paises, whatsapp, paisIso);

    /* ⚠️ EN LA EDICIÓN, `undefined` = NO TOCA (contrato del wrapper). Por
       eso las fotos solo viajan si se eligió una nueva: mandarlas siempre
       con el path viejo sería reescribir lo mismo, y mandarlas vacías le
       borraría la foto al repartidor sin que nadie se entere. */
    const r = esNuevo
      ? await registrarRepartidor({
          cuenta_comercial_id: cuentaId,
          nombre: nombre.trim(),
          documento: documento.trim(),
          tipo_documento: tipoDoc ?? undefined,
          whatsapp: whatsappE164.length > 0 ? whatsappE164 : undefined,
          correo: correo.trim(),
          foto_path: fotoPath,
          documento_foto_path: docPath,
        })
      : await actualizarRepartidor({
          repartidor_id: id,
          nombre: nombre.trim(),
          documento: documento.trim(),
          tipo_documento: tipoDoc ?? undefined,
          whatsapp: whatsappE164.length > 0 ? whatsappE164 : undefined,
          /* `undefined` = NO TOCA. Vacío BORRARÍA (contrato del wrapper). */
          correo: correo.trim().length > 0 ? correo.trim() : undefined,
          foto_path: fotoPath,
          documento_foto_path: docPath,
        });

    if (!r.ok) {
      setGuardando(false);
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }

    const repartidorId = esNuevo && 'repartidor_id' in r.data ? r.data.repartidor_id : id;

    /* LOS VEHÍCULOS, DESPUÉS — la persona ya existe y su id es la llave.
       Un vehículo que rebota NO tumba el guardado: se dice cuál falló. */
    for (const v of vehiculos) {
      if (v.id !== null) continue; // ya vive: su edición es otra puerta
      const placa = normalizarPlaca(v.placa);
      if (placa.length === 0) continue;
      const rv = await registrarVehiculoRepartidor({
        repartidor_id: repartidorId,
        tipo: v.tipo,
        placa,
      });
      if (!rv.ok) mostrar({ texto: rv.mensaje, variante: 'error' });
    }

    setGuardando(false);
    mostrar({ texto: t('fichaRepartidor.guardado'), variante: 'exito' });
    router.back();
  }

  async function quitarVehiculo(indice: number): Promise<void> {
    const v = vehiculos[indice];
    if (v === undefined) return;
    if (v.id !== null) {
      const r = await eliminarVehiculoRepartidor(v.id);
      if (!r.ok) {
        mostrar({ texto: r.mensaje, variante: 'error' });
        return;
      }
    }
    setVehiculos((prev) => prev.filter((_, i) => i !== indice));
  }

  // ── PANTALLA ─────────────────────────────────────────────────────────

  if (pantalla.estado === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado
          variante="navegacion"
          titulo={esNuevo ? t('fichaRepartidor.tituloNuevo') : t('fichaRepartidor.tituloEditar')}
          atras
          onAtras={() => router.back()}
        />
        {/* N16.2 — el spinner muere: el esqueleto dice la FORMA de lo que
            viene, y por eso la pantalla no salta cuando llega. */}
        <View style={{ padding: spacing[5], gap: spacing[4] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="bloque" ancho="100%" alto={140} />
            <View style={{ height: spacing[4] }} />
            <Esqueleto forma="linea" ancho="45%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={72} />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={72} />
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }

  if (pantalla.estado === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado
          variante="navegacion"
          titulo={esNuevo ? t('fichaRepartidor.tituloNuevo') : t('fichaRepartidor.tituloEditar')}
          atras
          onAtras={() => router.back()}
        />
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('fichaRepartidor.noSePudoCargar')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('fichaRepartidor.reintentar')}
                onPress={() => {
                  setPantalla({ estado: 'cargando' });
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={esNuevo ? t('fichaRepartidor.tituloNuevo') : t('fichaRepartidor.tituloEditar')}
        atras
        onAtras={() => router.back()}
      />
      <EvitaTeclado>
        <ScrollView
          contentContainerStyle={{
            padding: spacing[4],
            paddingBottom: insets.bottom + spacing[8],
            /* N2 — el aire entre bloques hace el trabajo que hoy hacen
               doce cajas apiladas. N3: máximo 3 separadores por pantalla
               ⇒ acá CERO líneas: separan el aire y el título de sección. */
            gap: spacing[8],
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ═══ ① LO QUE VE LA FAMILIA — la cabecera ES el espejo ═══ */}
          <View style={{ gap: spacing[3] }}>
            <Texto variante="apoyo">{t('fichaRepartidor.espejoRotulo')}</Texto>
            <Tarjeta relleno="normal" elevacion="reposo">
              <View style={{ flexDirection: 'row', gap: spacing[4], alignItems: 'center' }}>
                {/* N16.3 — MEDIDAS EXPLÍCITAS: el hueco ocupa exactamente
                    lo mismo que la foto, así que la pantalla no salta
                    cuando la imagen llega. */}
                {fotoAMostrar !== null ? (
                  <Image
                    source={{ uri: fotoAMostrar }}
                    style={{ width: 88, height: 88, borderRadius: radius.lg }}
                    accessibilityLabel={t('fichaRepartidor.fotoTitulo')}
                  />
                ) : (
                  <View
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: radius.lg,
                      backgroundColor: theme.bg.hundido,
                    }}
                  />
                )}
                <View style={{ flex: 1, gap: spacing[1] }}>
                  <Texto variante="seccion">
                    {nombre.trim().length > 0
                      ? nombre.trim()
                      : t('fichaRepartidor.espejoSinNombre')}
                  </Texto>
                  {vehiculoEspejo !== null &&
                  normalizarPlaca(vehiculoEspejo.placa).length > 0 ? (
                    <Texto variante="dato">
                      {`${
                        vehiculoEspejo.tipo === 'moto'
                          ? t('ventas.config.vehiculo.moto')
                          : t('ventas.config.vehiculo.carro')
                      } · ${normalizarPlaca(vehiculoEspejo.placa)}`}
                    </Texto>
                  ) : (
                    <Texto variante="apoyo">{t('fichaRepartidor.espejoSinVehiculo')}</Texto>
                  )}
                </View>
              </View>
            </Tarjeta>
            <Boton
              variante="secundario"
              bloque
              etiqueta={
                fotoAMostrar === null
                  ? t('fichaRepartidor.fotoTomar')
                  : t('fichaRepartidor.fotoCambiar')
              }
              onPress={() => setCapturando('persona')}
              deshabilitado={guardando}
            />
            <Texto variante="apoyo">{t('fichaRepartidor.fotoAyuda')}</Texto>
            <Campo
              label={t('fichaRepartidor.nombre')}
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
              deshabilitado={guardando}
            />
          </View>

          {/* ═══ ② CÓMO SE LO ALCANZA ═══ */}
          <View style={{ gap: spacing[4] }}>
            <Texto variante="seccion">{t('fichaRepartidor.seccionContacto')}</Texto>
            {/* 🔴 EL SELECTOR SE MUDÓ ACÁ desde el teléfono que murió — ver
                la cabecera. Sin él, el E.164 sale sin indicativo y la
                fuente lo rebota. */}
            <ControlTelefono
              label={t('fichaRepartidor.whatsapp')}
              placeholder={t('ventas.config.repartidorTelefonoPlaceholder')}
              valor={whatsapp}
              onCambio={setWhatsapp}
              bandera={bandera(paisIso)}
              prefijo={paisDe(paises, paisIso)?.prefijo ?? ''}
              onElegirPais={() => setEligiendoPais(true)}
              ayuda={t('fichaRepartidor.whatsappAyuda')}
            />
            <Campo
              label={t('fichaRepartidor.correo')}
              value={correo}
              onChangeText={setCorreo}
              onBlur={() => setCorreoTocado(true)}
              keyboardType="email-address"
              autoCapitalize="none"
              /* N12.3 — se valida AL SALIR del campo, jamás al enviar: un
                 formulario que reprocha al final hace escribir dos veces. */
              ayuda={t('fichaRepartidor.correoAyuda')}
              error={
                correoTocado && correo.trim().length > 0 && !correoValido
                  ? t('fichaRepartidor.correoInvalido')
                  : undefined
              }
              deshabilitado={guardando}
            />
          </View>

          {/* ═══ ③ QUIÉN RESPONDE POR ÉL ═══ */}
          <View style={{ gap: spacing[4] }}>
            <Texto variante="seccion">{t('fichaRepartidor.seccionIdentidad')}</Texto>
            <SelectorOpcion
              etiqueta={t('fichaRepartidor.tipoDocumento')}
              disposicion="fila"
              acento="oficio"
              seleccionada={tipoDoc ?? undefined}
              opciones={[
                { codigo: 'CEDULA', etiqueta: t('ventas.config.tipoDoc.cedula') },
                { codigo: 'PASAPORTE', etiqueta: t('ventas.config.tipoDoc.pasaporte') },
                { codigo: 'RUC', etiqueta: t('ventas.config.tipoDoc.ruc') },
              ]}
              onSelect={(c) => setTipoDoc(c as TipoDoc)}
            />
            <Campo
              label={t('fichaRepartidor.documento')}
              value={documento}
              onChangeText={setDocumento}
              /* N12.2 — EL TECLADO SE DERIVA DEL TIPO. Hoy está fijo en
                 numérico y **un pasaporte lleva letras**: no es incomodidad,
                 es un dato que la pantalla vuelve imposible de ingresar. */
              keyboardType={tecladoDeDocumento(tipoDoc)}
              autoCapitalize="characters"
              deshabilitado={guardando}
            />
            {/* LA MINIATURA — evidencia, no póster (§4.1 · vara SEGURO). */}
            <View style={{ gap: spacing[2] }}>
              <Texto variante="apoyo">{t('fichaRepartidor.documentoFoto')}</Texto>
              <View style={{ flexDirection: 'row', gap: spacing[3], alignItems: 'center' }}>
                {docAMostrar !== null && (
                  <Boton
                    variante="compacto"
                    etiqueta={t('fichaRepartidor.documentoFotoVer')}
                    onPress={() => setViendoDoc(true)}
                    deshabilitado={guardando}
                  />
                )}
                <Boton
                  variante="compacto"
                  etiqueta={
                    docAMostrar === null
                      ? t('fichaRepartidor.documentoFotoAgregar')
                      : t('fichaRepartidor.documentoFotoCambiar')
                  }
                  onPress={() => setCapturando('documento')}
                  deshabilitado={guardando}
                />
              </View>
              {docAMostrar !== null && (
                <Image
                  source={{ uri: docAMostrar }}
                  style={{ width: 72, height: 72, borderRadius: radius.md }}
                  accessibilityLabel={t('fichaRepartidor.documentoFoto')}
                />
              )}
            </View>
          </View>

          {/* ═══ ④ CON QUÉ LLEGA ═══ */}
          <View style={{ gap: spacing[4] }}>
            <Texto variante="seccion">{t('fichaRepartidor.seccionVehiculos')}</Texto>
            {vehiculos.map((v, i) => (
              <View key={v.id ?? `nuevo-${i}`} style={{ gap: spacing[3] }}>
                <SelectorOpcion
                  etiqueta={t('fichaRepartidor.vehiculoTipo')}
                  disposicion="fila"
                  acento="oficio"
                  seleccionada={v.tipo}
                  opciones={[
                    { codigo: 'moto', etiqueta: t('ventas.config.vehiculo.moto') },
                    { codigo: 'carro', etiqueta: t('ventas.config.vehiculo.carro') },
                  ]}
                  /* Al cambiar de tipo cambia LA MÁSCARA (N12.1) ⇒ el fallo
                     viejo deja de valer: se limpia en vez de dejar un error
                     que ya no describe nada. */
                  onSelect={(codigo) =>
                    setVehiculos((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, tipo: codigo as TipoVehiculo, fallo: null } : x,
                      ),
                    )
                  }
                />
                <Campo
                  label={t('fichaRepartidor.vehiculoPlaca')}
                  value={v.placa}
                  onChangeText={(texto) =>
                    setVehiculos((prev) =>
                      prev.map((x, j) => (j === i ? { ...x, placa: texto, fallo: null } : x)),
                    )
                  }
                  /* N12.3 — al SALIR del campo. Y jamás mientras se tipea:
                     reescribir bajo los dedos mueve el cursor. */
                  onBlur={() => validarVehiculo(i)}
                  autoCapitalize="characters"
                  error={v.fallo !== null ? vozDeFallo(v.fallo) : undefined}
                  deshabilitado={guardando}
                />
                <Boton
                  variante="compacto"
                  etiqueta={t('fichaRepartidor.vehiculoQuitar')}
                  onPress={() => void quitarVehiculo(i)}
                  deshabilitado={guardando}
                />
              </View>
            ))}
            {/* N12.5 — EL TOPE ES POR CONSTRUCCIÓN Y JAMÁS SE ESCRIBE EN
                PANTALLA: la puerta deja de ofrecer, y su mitad dura vive en
                el motor (`vehiculo_tope_alcanzado`). */}
            {vehiculos.length < 2 && (
              <Boton
                variante="secundario"
                etiqueta={t('fichaRepartidor.vehiculoAgregar')}
                onPress={() =>
                  setVehiculos((prev) => [...prev, { id: null, tipo: 'moto', placa: '', fallo: null }])
                }
                deshabilitado={guardando}
              />
            )}
          </View>

          {/* EL CTA APAGADO DICE QUÉ FALTA, SIEMPRE (precedente S73): un
              botón gris sin explicación manda a adivinar. */}
          <View style={{ gap: spacing[3] }}>
            {loQueFalta !== null && <Texto variante="apoyo">{loQueFalta}</Texto>}
            <Boton
              variante="primario"
              bloque
              cargando={guardando}
              deshabilitado={!puedeGuardar}
              etiqueta={t('fichaRepartidor.guardar')}
              onPress={() => void guardar()}
            />
          </View>
        </ScrollView>
      </EvitaTeclado>

      {/* LA PUERTA DE LA FOTO — pieza única con su cerrojo (R42). */}
      <HojaCaptura
        visible={capturando !== null}
        titulo={
          capturando === 'documento'
            ? t('fichaRepartidor.documentoFoto')
            : t('fichaRepartidor.fotoTitulo')
        }
        onCerrar={() => setCapturando(null)}
        onFoto={(foto) => {
          if (capturando !== null) alElegirFoto(capturando, foto.uri);
          setCapturando(null);
        }}
        onPermisoDenegado={() =>
          mostrar({ texto: t('fichaRepartidor.permisoCamara'), variante: 'error' })
        }
        /* 1600 es el número que la casa ya usa para carnet y documentos —
           el que hace que una cédula se lea. */
        opciones={{ redimensionarA: 1600, calidad: 0.8 }}
      />

      {/* El documento se abre entero SOLO por acto deliberado (§4.1). */}
      <VisorFoto
        visible={viendoDoc && docAMostrar !== null}
        onCerrar={() => setViendoDoc(false)}
        fotos={docAMostrar !== null ? [docAMostrar] : []}
        etiqueta={t('fichaRepartidor.documentoFoto')}
      />

      {/* EL PAÍS DEL WHATSAPP — misma anatomía que la del perfil y la de
          configuración: bandera + nombre + indicativo en mono, y la elegida
          se DICE. Los países sin formato declarado NO se apagan: se aceptan
          igual y su subtítulo avisa que nadie va a validar la forma — el
          dato honesto ocupa el lugar donde un «todavía no» mentiría. */}
      <Hoja
        visible={eligiendoPais}
        onCerrar={() => setEligiendoPais(false)}
        titulo={t('ventas.config.repartidorPaisTitulo')}
      >
        <HojaScroll>
          {paises.map((p, i) => (
            <View key={p.codigo}>
              {i > 0 ? <Separador /> : null}
              <Celda
                titulo={`${bandera(p.codigo)}  ${p.nombre}`}
                subtitulo={
                  p.formato === null ? t('ventas.config.repartidorPaisSinFormato') : undefined
                }
                metadataMono={p.prefijo ?? undefined}
                interactiva
                accessibilityRole="button"
                onPress={() => {
                  setPaisIso(p.codigo);
                  setEligiendoPais(false);
                }}
                fin={
                  p.codigo === paisIso ? (
                    <Texto variante="dato">{t('ventas.config.repartidorPaisElegido')}</Texto>
                  ) : undefined
                }
              />
            </View>
          ))}
        </HojaScroll>
      </Hoja>
    </View>
  );
}
