/**
 * ⭐ **TRAER PAPELES DE OTRA CLÍNICA** (S113-C · fase 3 · C2).
 *
 * El estado compartido del flujo, para que **las dos puertas** —la bóveda y el
 * alta de la mascota— abran exactamente lo mismo. *Quién lo abrió da igual; lo
 * que hace adentro es idéntico.*
 *
 * ── EL CAMINO ──────────────────────────────────────────────────────────────
 *   foto o PDF → `leerPapel` (extract-papel, D) → **confirmación fila por
 *   fila** → `registrarPapelExtraido` → `confirmarPapel`
 *
 * 🔴 **DOS ACTOS, Y EL EVENTO NACE EN EL SEGUNDO.** A lo hizo así a propósito y
 * la pantalla lo respeta: el primero deja el papel guardado *sin* tocar el
 * expediente; el segundo, después del toque humano, es el que sedimenta.
 * *Un examen que entra al expediente antes de que alguien lo mire es una
 * transcripción con autoridad de diagnóstico.*
 *
 * ── LO QUE ESTA PIEZA NO HACE, y es deliberado ────────────────────────────
 * **No interpreta.** Ni «alto», ni «bajo», ni un nombre de enfermedad. Si el
 * laboratorio imprimió un rango, viaja como texto; si marcó algo, esa marca
 * viaja como texto. *La casa transcribe: el juicio es del veterinario.*
 */
import { useCallback, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { hayQueCompletar, useAviso, type EstadoTraer } from '@epetplace/ui';
/* `ContenidoLeido` vive en la pieza y **no está en el índice de `ui`** — se
   importa de su archivo en vez de agregarlo al índice, que es de B. */
import type { ContenidoLeido } from '@epetplace/ui/src/components/papeles-boveda';
import {
  BUCKET_PAPELES,
  confirmarPapel,
  leerPapel,
  pathDePapel,
  registrarPapelExtraido,
  type ClaseEnBoveda,
  type LecturaDePapel,
  type ValorDePapel,
} from '@epetplace/api';

import { leerBase64, subirPapel } from '@/lib/subir-avatar';
import { useTraduccion } from '@/i18n';

/** El papel a medio camino: leído y todavía no guardado. */
type EnVuelo = {
  lectura: LecturaDePapel;
  base64: string;
  mediaType: string;
  contenido: ContenidoLeido;
};

/** 🔴 La clase la dice la extracción; **`otro` es el destino honesto** cuando
 *  no la sabe. *Sin él, lo que no encaja se clasifica mal con tal de entrar.* */
function claseDe(c: string | null): ClaseEnBoveda {
  switch (c) {
    case 'laboratorio':
    case 'imagen':
    case 'receta':
    case 'informe':
    case 'certificado':
      return c;
    default:
      return 'otro';
  }
}

/** De lo que la extracción leyó a lo que la pieza dibuja. **Cero
 *  interpretación**: cada campo viaja tal cual, y `dudosa` de la edge decide
 *  qué se marca — la pantalla no vuelve a juzgar (`confirmable.ts`, misma
 *  regla que el carnet: *una sola cuenta*). */
function aContenido(l: LecturaDePapel): ContenidoLeido {
  if (l.clase === 'receta') {
    return {
      tipo: 'receta',
      medicacion: l.filas.map((f: LecturaDePapel['filas'][number], i: number) => ({
        id: `f${i}`,
        nombre: f.nombre ?? '',
        dosis: f.dosis ?? undefined,
        duracion: f.hasta_cuando ?? f.frecuencia ?? undefined,
        confianza: f.confianza,
        /* `falta` = lo que la familia tiene que completar. Sale de la edge
           (`dudosa`) y del hecho de que sin nombre no hay medicamento. */
        falta:
          f.nombre === null || f.nombre.trim() === ''
            ? 'nombre'
            : f.dudosa !== null
              ? 'dosis'
              : undefined,
      })),
    };
  }
  return {
    tipo: 'examen',
    valores: l.filas.map((f: LecturaDePapel['filas'][number], i: number) => ({
      id: `f${i}`,
      analito: f.nombre ?? '',
      valor: f.valor ?? '',
      /* `null` → `undefined`: la extracción dice «no venía impreso» con
         `null`, la pieza lo espera como ausencia. **Son la misma cosa dicha en
         dos dialectos**, y traducirlo acá evita que cada consumidor invente su
         propia conversión. */
      unidad: f.unidad ?? undefined,
      referencia: f.referencia ?? undefined,
      literal: f.literal ?? undefined,
      confianza: f.confianza,
      falta:
        f.nombre === null || f.nombre.trim() === ''
          ? 'analito'
          : f.valor === null || f.valor.trim() === ''
            ? 'valor'
            : undefined,
    })),
  };
}

/** Los valores tal como los espera la bóveda. */
function aValores(c: ContenidoLeido): ValorDePapel[] {
  if (c.tipo === 'receta') {
    return c.medicacion.map((m: (typeof c.medicacion)[number]) => ({
      analito: m.nombre,
      valor: m.dosis ?? '',
      literal: m.duracion,
    }));
  }
  return c.valores.map((v: (typeof c.valores)[number]) => ({
    analito: v.analito,
    valor: v.valor,
    unidad: v.unidad,
    referencia: v.referencia,
    /* La pieza no lleva `literal` en su valor: lo que el laboratorio marcó
       viaja en `referencia`. *No se inventa un campo para que el mapa cierre.* */
    literal: null,
  }));
}

export function useTraerPapeles(mascotaId: string, alGuardar: () => void) {
  const { t } = useTraduccion();
  const aviso = useAviso();
  const [visible, setVisible] = useState(false);
  const [enVuelo, setEnVuelo] = useState<EnVuelo | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  /* Un guard contra el doble toque mientras el archivo viaja: *dos lecturas
     del mismo papel son dos papeles en la bóveda.* */
  const guardando = useRef(false);

  const cerrar = useCallback(() => {
    setVisible(false);
    setEnVuelo(null);
    setLeyendo(false);
  }, []);

  const leer = useCallback(
    async (base64: string, mediaType: string) => {
      setLeyendo(true);
      const r = await leerPapel({ imageBase64: base64, mediaType });
      setLeyendo(false);
      if (!r.ok) {
        aviso.mostrar({ variante: 'error', texto: r.mensaje });
        return;
      }
      /* 🔴 **Sin filas no se pasa a confirmar.** *Una pantalla de confirmación
         vacía le pide a la familia que apruebe la nada* — y guardar eso
         dejaría un papel sin contenido en su bóveda. */
      if (r.data.filas.length === 0) {
        aviso.mostrar({ variante: 'neutro', texto: t('traerPapeles.nadaQueLeer') });
        return;
      }
      setEnVuelo({ lectura: r.data, base64, mediaType, contenido: aContenido(r.data) });
    },
    [aviso, t],
  );

  const desdeFoto = useCallback(async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: false,
    });
    if (res.canceled || res.assets[0] === undefined) return;
    const b64 = await leerBase64(res.assets[0].uri);
    if (b64 === null) {
      aviso.mostrar({ variante: 'error', texto: t('traerPapeles.noPudeAbrir') });
      return;
    }
    await leer(b64, res.assets[0].mimeType ?? 'image/jpeg');
  }, [leer, aviso, t]);

  /* 🔴 **EL PDF ESPERA LA BUILD, y no es una omisión.** Su selector
     (`expo-document-picker`) **no está instalado** —medido en el package.json
     del cliente— y una dependencia nativa nueva no viaja por OTA (`L-134`).
     *Instalarla hoy dejaría la app rota en el teléfono que ya está en la calle,
     que es peor que no ofrecer el PDF.*
     Queda anotado con el permiso de galería y el micrófono en
     `S113-NFC-BUILD.md`: entra en el mismo tren. Mientras tanto la foto
     alcanza — un examen fotografiado se lee igual. */
  const desdeArchivo = useCallback(() => {
    aviso.mostrar({ variante: 'neutro', texto: t('traerPapeles.pdfEspera') });
  }, [aviso, t]);

  const guardar = useCallback(() => {
    if (enVuelo === null || guardando.current) return;
    guardando.current = true;
    void (async () => {
      try {
        /* ① El archivo entero al bucket privado de la mascota: *el valor
           transcrito vale por su papel; sin él, nadie puede verificarlo.* */
        const nombre = `${Date.now()}.${enVuelo.mediaType === 'application/pdf' ? 'pdf' : 'jpg'}`;
        const path = pathDePapel(mascotaId, nombre);
        const sub = await subirPapel({ base64: enVuelo.base64, path, mediaType: enVuelo.mediaType });
        if (!sub.ok) {
          aviso.mostrar({ variante: 'error', texto: sub.mensaje });
          return;
        }
        /* ② ACTO 1 — el papel queda guardado y **el expediente no se toca**. */
        const reg = await registrarPapelExtraido({
          mascotaId,
          clase: claseDe(enVuelo.lectura.clase),
          archivoPath: path,
          fechaPapel: enVuelo.lectura.fecha_documento ?? undefined,
          origen: enVuelo.lectura.emisor ?? undefined,
          valores: aValores(enVuelo.contenido),
        });
        if (!reg.ok) {
          aviso.mostrar({ variante: 'error', texto: reg.mensaje });
          return;
        }
        /* ③ ACTO 2 — **acá nace el evento**, después del toque humano. */
        const conf = await confirmarPapel(reg.data.papel_id, aValores(enVuelo.contenido));
        if (!conf.ok) {
          aviso.mostrar({ variante: 'error', texto: conf.mensaje });
          return;
        }
        /* Dice DÓNDE quedó — la misma ley que el «cuéntanos». */
        aviso.mostrar({ variante: 'exito', texto: t('traerPapeles.guardado') });
        cerrar();
        alGuardar();
      } finally {
        guardando.current = false;
      }
    })();
  }, [enVuelo, mascotaId, aviso, t, cerrar, alGuardar]);

  const estado: EstadoTraer = leyendo
    ? { fase: 'leyendo' }
    : enVuelo !== null
      ? {
          fase: 'confirmar',
          contenido: enVuelo.contenido,
          onGuardar: guardar,
          vozIncompleto: t('traerPapeles.faltaAlgo'),
        }
      : {
          fase: 'elegir',
          onFoto: () => {
            void desdeFoto();
          },
          onArchivo: desdeArchivo,
        };

  return {
    visible,
    abrir: () => setVisible(true),
    cerrar,
    estado,
    /** Para que la pantalla sepa si el guardar está habilitado sin recalcularlo. */
    completo: enVuelo === null ? false : !hayQueCompletar(enVuelo.contenido),
  };
}
