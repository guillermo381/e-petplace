/**
 * 🪦 LÁPIDA — `D-1101` · ACÁ VIVIÓ LA BIFURCACIÓN DE ENTRADA.
 *
 * ── QUÉ HABÍA ────────────────────────────────────────────────────────────
 * `/onboarding` preguntaba **«¿Tienes una mascota o quieres adoptar?»** con dos
 * tarjetas (`BifurcacionDeEntrada`, S112-C), y era **lo primero que veía toda
 * cuenta nueva**: el raíz, `registro` y `verificar-correo` mandaban ahí.
 *
 * ── POR QUÉ MUERE (firma del founder, 13-sep-2026) ───────────────────────
 * **La cuenta sin familia ve el HOGAR, no una bifurcación.** Esa pregunta era
 * una pantalla de más entre confirmar el correo y tener a alguien adentro —y el
 * hogar vacío ya la hacía mejor: ofrece **primero a los que esperan adopción y
 * después la invitación a registrar**, con su «i» del porqué. *Dos superficies
 * para la misma pregunta, y la de abajo era la buena.*
 *
 * Y el recorrido real la encontró rota además: título contra la barra de
 * estado, engranaje encima, dos barras blancas vacías, glifos fuera de caja
 * (captura `docs/loop/capturas-s116-c/06b-onboarding-roto.png`).
 * *Se entierra la pantalla, no se arregla una que no debía existir.*
 *
 * ── LO QUE MURIÓ CON ELLA ────────────────────────────────────────────────
 * `components/alta/BifurcacionDeEntrada.tsx` — **tenía UN solo consumidor: este
 * archivo** (medido antes de borrarla), así que no queda huérfana en ningún
 * otro lado. Con ella se van las siete voces `bifurcacion.*`.
 *
 * ── ⚠️ LO QUE **NO** MUERE, y es la mitad que se puede romper por descuido ──
 * **`/onboarding/[paso]` SIGUE VIVA: es el ALTA de la primera mascota.** Esa
 * ruta llama a `crear_familia_con_primera_mascota`, mientras `/hogar/agregar`
 * llama a `agregar_mascota_a_familia`, que **exige una familia que todavía no
 * existe**. *Quien borre el directorio entero «para limpiar» va a dejar sin
 * camino a toda cuenta nueva, y el typecheck no lo va a decir.*
 *
 * ── POR QUÉ REDIRIGE Y NO SE BORRA EL ARCHIVO ────────────────────────────
 * Había cuatro navegaciones a `/onboarding` en el árbol —las cuatro migradas a
 * `/hogar` en este mismo commit— **pero una ruta viva sobrevive en pilas
 * guardadas, en deep links y en la memoria de quien la escribió.** El redirect
 * cuesta una línea y convierte un «esta pantalla no existe» en llegar a donde
 * se quería ir.
 */
import { Redirect } from 'expo-router';

export default function OnboardingRedirige() {
  return <Redirect href="/hogar" />;
}
