/**
 * ⭐ **S116-C lote 10 · LA PANTALLA DE RAZA — el interludio que se salta solo.**
 *
 * Recorrido 4 del founder: *«después de la foto y antes del formulario, si la
 * raza reconocida tiene ficha en `cat_razas`, una pantalla con la cabecera
 * empujada «{raza}», el personaje de la especie, y dos bloques de texto: de
 * dónde viene y cómo es (los campos de la ficha; si un campo no existe, no se
 * inventa). Botón primario «Continuar» y «Saltar» arriba a la derecha. Sin
 * ficha, se salta sola.»*
 *
 * ── 🔴 POR QUÉ NO LLEVA BARRA DE PASOS, Y ES LA DECISIÓN QUE ORDENA TODO ────
 * Los tres pasos del alta escriben su número A MANO (`total: 3, actual: N`).
 * Si esto fuera un paso, el alta pasaría a cuatro **y el número mentiría justo
 * en el caso normal**: la pantalla se salta sola casi siempre, así que quien
 * no la ve leería «3 de 4» habiendo hecho tres. *Un contador que cambia según
 * si el producto tuvo algo que contarte no es un contador.*
 *
 * ⇒ es un **interludio**: cabecera `empujada` con el nombre de la raza —tal
 * cual la orden lo pide— y **sin `pasos`**. El 1/3 → 2/3 → 3/3 no se toca.
 *
 * ── LO QUE DECIDE SI SE MUESTRA, y son TRES condiciones, no una ────────────
 * ① **Hay ficha.** `obtenerContenidoDeRaza` devuelve `null` cuando la raza no
 *    casa **o cuando casa y su ficha no está publicada** — su propio wrapper
 *    lo dice: *«decirle "el perro es un animal social" a quien tiene un Beagle
 *    sería peor que no decir nada»*.
 * ② **La ficha es DE LA RAZA.** Con `es_de_especie` el texto habla del PERRO,
 *    no del golden de esta familia. **Poner ese texto bajo un título que dice
 *    «Golden Retriever» es afirmar de más sobre el trabajo de otro** — y el
 *    propio tipo del wrapper existe para que la pantalla pueda distinguirlo.
 * ③ **Hay algo que leer.** Si `origen` y `temperamento` vienen los dos en
 *    `null`, queda una pantalla con un título y aire. *Una pantalla vacía no
 *    es «menos contenido»: es un paso de más.*
 *
 * Cualquiera de las tres que falle ⇒ **se salta sola, con `replace`**: si
 * usara `push`, el «atrás» del formulario caería en una pantalla que se vuelve
 * a saltar y el gesto se sentiría roto.
 *
 * ── LA LEY DEL FOUNDER DEL 5-SEP, EN SUS TRES CLÁUSULAS ────────────────────
 * *«hacemos lo mejor que podamos; lo que falta lo completa la familia; y
 * siempre se dice dónde no pudimos»*. Acá manda la tercera: **un campo `null`
 * no se rellena y no se dibuja su bloque** — no hay texto de relleno, no hay
 * «Sin información». El bloque simplemente no existe, que es la forma honesta
 * de decir que ese dato no está.
 */

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  Boton,
  Cabecera,
  EsperaDeMarca,
  HojaContenido,
  Personaje,
  Texto,
  spacing,
  useTheme,
  type EspeciePersonaje,
} from '@epetplace/ui';

import { obtenerContenidoDeRaza } from '@epetplace/api';

import { useAltoDeCabecera } from '@/lib/alto-de-cabecera';
import { useTraduccion } from '@/i18n';
import type { BorradorAlta } from './tipos';

/** Las once especies del catálogo contra las seis que el personaje dibuja.
 *  **La tabla vive acá y no se deriva**: `AvatarMascota` tiene la suya
 *  (`CARA_LOCAL`) y NO la exporta — pedido a B en el buzón del lote 8. *Dos
 *  tablas de lo mismo divergen; ésta se declara como préstamo con su dueño
 *  nombrado, para que el día que B la exporte esto se borre.* */
function personajeDe(especie: string | undefined): EspeciePersonaje {
  switch (especie) {
    case 'perro': return 'perro';
    case 'gato': return 'gato';
    case 'conejo': return 'conejo';
    case 'ave': return 'ave';
    case 'roedor': return 'roedor';
    /* ⚠️ **`pez` NO está en la unión del personaje y cae a `otro`** — son
       ONCE especies en el catálogo contra SEIS dibujos. No es un olvido mío:
       el `Record` de la pieza es completo, así que **una especie sin archivo
       no compila**, y ése es el mecanismo que la mantiene honesta. */
    default: return 'otro';
  }
}

export function PasoRazaFicha({
  borrador,
  onAvanzar,
  onSaltar,
  onAtras,
}: {
  borrador: BorradorAlta;
  onAvanzar: (parcial: BorradorAlta) => void;
  /** Igual que avanzar pero con `replace`: la pantalla que se salta sola no
   *  puede quedar en la pila (ver la cabecera). */
  onSaltar: (parcial: BorradorAlta) => void;
  onAtras: () => void;
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const cabecera = useAltoDeCabecera('empujada');

  const [ficha, setFicha] = useState<
    { origen: string | null; temperamento: string | null } | 'cargando' | null
  >('cargando');

  const especie = borrador.especie;
  const raza = borrador.raza;

  useEffect(() => {
    let vigente = true;
    /* Sin especie no hay a quién preguntarle: el lector la exige. Se salta
       sin viaje — *un viaje que ya se sabe que no puede contestar es latencia
       comprada.* */
    if (especie === undefined || raza === undefined) {
      setFicha(null);
      return;
    }
    void obtenerContenidoDeRaza(especie, raza).then((r) => {
      if (!vigente) return;
      /* Un fallo cae a `null` y la pantalla se salta: *el alta no se frena
         porque un texto de color no se pudo leer.* */
      if (!r.ok || r.data === null || r.data.es_de_especie) { setFicha(null); return; }
      setFicha({ origen: r.data.origen, temperamento: r.data.temperamento });
    });
    return () => { vigente = false; };
  }, [especie, raza]);

  /* EL SALTO AUTOMÁTICO vive en su propio efecto y no dentro del `then`:
     navegar desde una respuesta de red puede llegar con la pantalla ya
     desmontada. Acá corre con el render, que es cuando la pantalla existe. */
  const sinNada =
    ficha !== 'cargando' && (ficha === null || (ficha.origen === null && ficha.temperamento === null));
  useEffect(() => {
    if (sinNada) onSaltar({});
    // `onSaltar` viene del despachador y cambia en cada render: incluirlo
    // dispararía el salto en bucle. Lo que decide es `sinNada`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sinNada]);

  if (ficha === 'cargando' || sinNada) {
    /* La espera de la casa, la MISMA que el resto del acceso y del pasaporte.
       **No es una espera larga** —es una consulta— así que va `EsperaDeMarca`
       y no `EsperaLarga`. */
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, alignItems: 'center', justifyContent: 'center' }}>
        <EsperaDeMarca />
      </View>
    );
  }

  const bloques: { titulo: string; cuerpo: string }[] = [];
  if (ficha.origen !== null) bloques.push({ titulo: t('alta.razaOrigen'), cuerpo: ficha.origen });
  if (ficha.temperamento !== null) bloques.push({ titulo: t('alta.razaComoEs'), cuerpo: ficha.temperamento });

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <HojaContenido
        arranque={cabecera.arranque}
        fondo={
          <View onLayout={cabecera.alMedir}>
            <Cabecera
              variante="empujada"
              presentacion="fondo"
              antetitulo={t('alta.nuevaMascota')}
              /* El título es LA RAZA, tal cual la orden. Y es la que la
                 familia tiene en el borrador —la que la foto sugirió y la
                 persona puede haber corregido—, no el nombre canónico del
                 catálogo: *el título de una pantalla que habla de SU animal
                 tiene que decir lo que ella declaró.* */
              titulo={raza ?? ''}
              onVolver={onAtras}
              etiquetaVolver={t('alta.volver')}
              /* «Saltar» arriba a la derecha, como pide la orden. Es una
                 SALIDA, no un avance: se va sin dejar esta pantalla en la
                 pila, igual que el salto automático. */
              accionDerecha={
                <Boton
                  etiqueta={t('alta.saltar')}
                  variante="ghost"
                  /* `muro` y no la paleta clara: el slot de la acción derecha
                     vive SOBRE la banda ciruela, y un ghost resuelto para
                     lienzo desaparece ahí — es el caso que la prop declara
                     con su número (6.57 sobre el muro). */
                  superficie="muro"
                  onPress={() => onSaltar({})}
                />
              }
            />
          </View>
        }
        scroll={{ contentContainerStyle: { flexGrow: 1 } }}
      >
        <View style={{ padding: spacing[5], paddingTop: spacing[6], gap: spacing[6], flexGrow: 1 }}>
          <View style={{ alignItems: 'center' }}>
            <Personaje especie={personajeDe(especie)} tamano="grande" forma="circulo" />
          </View>

          {bloques.map((b) => (
            <View key={b.titulo} style={{ gap: spacing[2] }}>
              <Texto variante="seccion">{b.titulo}</Texto>
              <Texto variante="apoyo" color="secondary">{b.cuerpo}</Texto>
            </View>
          ))}

          {/* El aire que ancla la acción abajo cuando el texto es corto y
              deja scrollear cuando es largo — el mismo espaciador que los
              otros pasos usan. */}
          <View style={{ flex: 1 }} />

          <Boton etiqueta={t('alta.continuar')} bloque onPress={() => onAvanzar({})} />
        </View>
      </HojaContenido>
    </View>
  );
}
