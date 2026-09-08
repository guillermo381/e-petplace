/**
 * La instancia i18next del ecosistema — puerta única del riel.
 * Idioma inicial: override persistido > locale del dispositivo > es.
 */

import i18next, { type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { idiomaDelDispositivo } from './deteccion';
import { IDIOMA_FALLBACK, type IdiomaSoportado } from './idiomas';
import { guardarPreferenciaIdioma, leerPreferenciaIdioma } from './persistencia';
import type { RecursosPorIdioma } from './tipos';

/* `__DEV__` lo define el bundler de RN y **este paquete no lo declara**: se
   lee del global con guarda, así que en web, en un test o en cualquier
   entorno que no lo tenga, esto queda apagado en vez de romper. */
const EN_DESARROLLO =
  typeof (globalThis as { __DEV__?: boolean }).__DEV__ === 'boolean'
    ? (globalThis as { __DEV__?: boolean }).__DEV__ === true
    : false;

let instancia: i18n | null = null;

export async function inicializarI18n(recursos: RecursosPorIdioma): Promise<i18n> {
  if (instancia) return instancia;

  const preferencia = await leerPreferenciaIdioma();
  const inicial: IdiomaSoportado = preferencia ?? idiomaDelDispositivo();

  const inst = i18next.createInstance();
  await inst.use(initReactI18next).init({
    lng: inicial,
    fallbackLng: IDIOMA_FALLBACK,
    resources: recursos,
    interpolation: { escapeValue: false }, // React ya escapa
    returnNull: false,
    returnEmptyString: false,

    /* ══ EL ROJO DE LA LLAVE QUE NO EXISTE (S114-C) ═══════════════════════
       🔴 **UNA LLAVE QUE NO ESTÁ EN EL CATÁLOGO NO DEBERÍA PODER LLEGAR A
       PANTALLA — y hasta hoy llegaba, tal cual, con su punto y su guion.**

       El caso que lo parió, medido en el aparato: una familia leyó
       `postventa.final_resuelto_entre_ustedes` en el lugar donde iba «Resuelto
       entre ustedes». *No fue un error: fue la llave, renderizada como si
       fuera copy.*

       ⚠️ **Y las llaves TIPADAS no lo evitan, que es lo que lo vuelve una
       clase y no un descuido.** El riel exige `ClaveDe<D>`… hasta que alguien
       interpola:
       ```ts
       t(`postventa.final_${x}` as 'postventa.final_retirado')
       ```
       La interpolación produce un `string` y **el cast lo deja pasar**. Son
       **64 usos vivos de esa forma** en las dos apps (censados) y **la mayoría
       son correctos**: lo son mientras el dominio de `x` esté cubierto por las
       llaves. El mío no lo estaba —`x` venía del vocabulario de `packages/ui` y
       mis llaves estaban escritas con el de `packages/api`— y **nada lo dijo**.

       ⇒ **`saveMissing` + este handler convierten el string mudo en un rojo
       ruidoso, en el instante en que la pantalla se dibuja.** Es el único
       momento en que el defecto existe: antes no hay llave, y después ya la
       leyó alguien.

       🔴 **SÓLO EN DESARROLLO, y es deliberado.** En producción una llave
       faltante NO puede tumbar la pantalla — *la app rota es peor que la app
       con un texto feo*, y la familia no puede hacer nada con un crash. En
       dev, en cambio, tiene que doler: es cuando alguien puede arreglarlo.

       ⚠️ **Lo que este rojo NO hace, dicho para que su verde no se lea de
       más:** no prueba que las 64 estén bien. Prueba que **la que se dibujó**
       existía. Una rama que nadie caminó sigue sin medirse — que es
       exactamente cómo apareció ésta. */
    saveMissing: EN_DESARROLLO,
    missingKeyHandler: EN_DESARROLLO
      ? (_idiomas, ns, clave) => {
          const donde = `${ns}:${clave}`;
          console.error(
            `🔴 i18n · LLAVE QUE NO EXISTE: ${donde}\n` +
              '   Se dibujó la llave cruda en pantalla, donde iba un texto.\n' +
              '   Casi siempre es una llave INTERPOLADA cuyo dominio no coincide\n' +
              '   con las llaves escritas: el cast la dejó pasar el typecheck.\n' +
              '   La cura es un `Record<Union, ClaveDeI18n>` — con él, un miembro\n' +
              '   sin llave NO COMPILA, que es cuando hay que enterarse.',
          );
        }
      : undefined,
  });

  instancia = inst;
  return inst;
}

/**
 * Cambia el idioma vivo Y persiste el override en dispositivo.
 * Rechaza si la persistencia falla — el caller pone la voz del error.
 */
export async function cambiarIdioma(idioma: IdiomaSoportado): Promise<void> {
  if (!instancia) throw new Error('cambiarIdioma antes de inicializarI18n');
  await instancia.changeLanguage(idioma);
  await guardarPreferenciaIdioma(idioma);
}

/** El idioma vivo de la instancia (S55-B3: la sync D-316 compara contra
 *  esto antes de pisar el cache local con la preferencia de DB). */
export function obtenerIdiomaActual(): IdiomaSoportado {
  const vivo = instancia?.language;
  return vivo === 'en' ? 'en' : IDIOMA_FALLBACK;
}
