/**
 * S105-C · **CUANDO UNA CITA NO RESUELVE** — y la conjetura se vuelve hecho si
 * el servidor puede probarlo.
 *
 * ── EL DEFECTO QUE CURA ───────────────────────────────────────────────────
 *
 * Las **cinco** pantallas de cita del prestador tienen la misma rama
 * `no_existe` y todas decían lo mismo: *«Puede haberse movido o cancelado»*.
 * **Dos límites, medidos:** es **conjetural** —no afirma nada— y **solo
 * aparece si él TOCA la cita**; si el turno se libera mientras mira su día,
 * desaparece en el próximo refresco y nada lo dice.
 *
 * 🔴 **La conjetura NO se retira: se ASCIENDE cuando hay con qué.**
 * `leerCitaResuelta` resuelve por id **sin filtrar por estado** ⇒ si dice
 * `cancelada`, la pantalla afirma. Si no puede probarlo —la cita de verdad no
 * existe, o es de otro— **cae en la voz de siempre, que sigue siendo honesta
 * para ese caso.** *Una conjetura es correcta mientras uno no sepa; lo que
 * está mal es conjeturar teniendo el dato.*
 *
 * ── POR QUÉ ES UNA PIEZA Y NO CINCO COPIAS ────────────────────────────────
 *
 * Cinco pantallas con el mismo árbol de decisión es cómo dos oficios empiezan
 * a decir cosas distintas sobre el mismo hecho. *Y el defecto no daría error:
 * daría dos voces.*
 *
 * ── 🔴 LO QUE ESTA PIEZA NO DICE, Y ES DECISIÓN ───────────────────────────
 *
 * **NUNCA nombra la causa — ni siquiera cuando es un reverso.** El lector la
 * trae (`causaCancelacion`), y aun así **no viaja a esta pantalla**: decirle al
 * prestador *«se revirtió el pago»* **expondría un movimiento financiero del
 * cliente**. Lo que él necesita saber es que **su horario quedó libre**, y eso
 * es cierto para las cuatro causas. *La ramificación por causa es de la
 * familia; acá sería contar algo ajeno sin que sirva para nada.*
 *
 * ⚠️ **Coherente con el aviso que ya le llega** (`pago_reversado`, S105-A): ese
 * sí nombra al banco, y no es contradicción — *el aviso llega cuando pasa; esta
 * pantalla contesta cuando él pregunta.* Lo que ninguno de los dos hace es
 * decirle que perdió plata: **no la perdió, porque si el horario se liberó el
 * servicio no ocurrió.**
 *
 * ⚠️ **NO EJERCIDO CONTRA UN REVERSO REAL.** Medido por A: **cero citas
 * canceladas por reverso** en la base — las que hay son de `cierre_periodo_plan`.
 * ⇒ esta pieza está probada contra el caso que existe, **y su gate contra un
 * reverso de verdad queda pendiente** (`L-402`: *no basta con que corra; hace
 * falta que haya corrido*).
 */

import { useEffect, useState } from 'react';
import { EstadoVacio } from '@epetplace/ui';
import { leerCitaResuelta } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export type CitaNoDisponibleProps = {
  citaId: string;
  /** `registro` de `EstadoVacio` — la de vet monta 'pantalla'. */
  registro?: 'pantalla' | 'seccion';
  /** La voz de SIEMPRE — la conjetura del oficio. Se usa mientras no se pueda
   *  probar otra cosa, y por eso cada pantalla trae la suya. */
  titulo: string;
  descripcion?: string;
  /** El botón de vuelta, que cada oficio nombra a su manera. **Opcional: la
   *  pantalla de vet no lo tiene, y no se le inventa uno.** */
  accion?: React.ReactNode;
};

export function CitaNoDisponible({ citaId, registro, titulo, descripcion, accion }: CitaNoDisponibleProps) {
  const { t } = useTraduccion();
  /* `null` = todavía no sabemos. **No es `false`**: mientras la consulta viaja,
     afirmar que no está cancelada sería adelantar un veredicto. */
  const [cancelada, setCancelada] = useState<boolean | null>(null);

  useEffect(() => {
    let vigente = true;
    void leerCitaResuelta(citaId).then((r) => {
      if (!vigente) return;
      /* 🔴 Un fallo NO se dibuja como «no cancelada»: se cae a la conjetura,
         que es exactamente lo que la conjetura existe para cubrir. *Tratar un
         error de red como un veredicto es la forma más silenciosa de mentir.* */
      setCancelada(r.ok ? r.data.cancelada : false);
    });
    return () => {
      vigente = false;
    };
  }, [citaId]);

  const probada = cancelada === true;

  return (
    <EstadoVacio
      registro={registro}
      titulo={probada ? t('cita.canceladaTitulo') : titulo}
      descripcion={probada ? t('cita.canceladaDetalle') : descripcion}
      accion={accion}
    />
  );
}
