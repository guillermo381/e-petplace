# S74-A · T3 — Re-medición del arranque del Hogar (D-497) + las tres letras candidatas

> **Método (reproducible, L-159):** `node scripts/medir-arranque-hogar.mjs`
> — sesión demo por login de UI, recarga fresca del Hogar, cuenta TODOS los
> requests al host de Supabase hasta networkidle + 8s de colas. El número
> ya no vive tipeado: lo imprime el script.

## 1 · El número literal de HOY (22-jul-2026, demo = UNA mascota)

**TOTAL: 34 requests** (S73-A midió 31 — el delta +3 son las ramas nuevas
del rail S73 y una duplicación de RPC que la medición destapó):

```
  6 × GET  rest/v1/evento_cita_servicio
  4 × GET  rest/v1/evento_atencion
  4 × GET  rest/v1/tipos_servicio
  3 × GET  rest/v1/mascotas
  3 × GET  rest/v1/prestadores
  2 × POST rest/v1/rpc/get_estado_onboarding_dueno   ← DUPLICADA (hallazgo nuevo)
  1 × GET  user_preferencias · user_notificacion_prefs · evento_vacuna_aplicada
      · mascota_perfil_vigente · suscripciones_servicio · bonos · presupuesto
      · eventos_mascota · profiles · programas_contratados · evento_archivo_adjunto
  1 × POST rest/v1/rpc/obtener_solicitudes_pendientes_dueno
```

Los dos ×N por mascota (confirmados en código S73-A: `obtenerCitasActivasMascota`
con el embed D-474 adentro + `leerTimelineMascota`) siguen vivos — con la
familia real del founder (2 mascotas) el arranque proyecta ~38-40.

## 2 · LAS TRES LETRAS CANDIDATAS (con números; van a la mesa del arco S74)

**(a) EL PRESUPUESTO DE ARRANQUE DEL HOGAR.** Candidata: *"el arranque del
Hogar tiene un presupuesto de requests INDEPENDIENTE DE N mascotas; el gate
lo mide el script (`medir-arranque-hogar.mjs`) y un arranque sobre
presupuesto es falla de gate, no observación."* Los números de hoy para
calibrar: 34 con N=1; las curas de (c) + la dedup de la RPC duplicada
proyectan **~28-30 con N=1 e independiente de N** en los dos ×N. La
aritmética del techo razonable: 6 lecturas de `evento_cita_servicio` y 4 de
`evento_atencion` son zonas distintas leyendo LA MISMA tabla — una
composición hogar-wide por tabla dejaría el piso estructural en **~15-18**.
**El N del presupuesto SE FIRMA DESPUÉS de las curas, no antes** (mandato
S74): estas cifras son el rango para esa firma, no la firma.

**(b) LA REGLA LECTOR-NACE-CON-TECHO.** Candidata: *"todo lector de LISTA
nace con `limit`/cursor, o declara su techo natural en un comentario
marcado (`// techo natural: <por qué>`); el juez es un grep exigible"* —
sinergia directa con D-481 (`verify:diseno`): lo que exige juicio se
incumple, lo que atrapa un grep se cumple (L-156). Números que la
justifican: `serviciosHogar` compone sobre listas COMPLETAS sin límite
(citas 73 totales, máx 55 en UNA mascota; eventos 121, máx 78) y la query
vet del rail nació S73 sin límite declarado (7 filas hoy, techo sin
declarar). Con techo hoy: `leerTimelineMascota` (cursor) · `citasMascota`
(limit 50).

**(c) EL PLAN DE LOS DOS ×N → PATRÓN HOGAR-WIDE.** El patrón ya está
PROBADO en la casa: la rama vet del rail (S73, `serviciosHogar.ts`) hace
UNA query hogar-wide en dos pasos, cero embed (la clase PGRST201 no se
invita de vuelta). Plan: (1) `obtenerCitasActivasMascota` ×N → una query
hogar-wide con el embed D-474 conservado (o dos pasos si el embed
multiplica), consumida por las fichas; (2) `leerTimelineMascota` ×N en
`cargarTimelineHogar` → una query `mascota_id IN (…)` con el límite que la
zona necesita. Ahorro: −2 requests por mascota extra (N=2: −2 · N=4: −6);
convierte el arranque en O(1) respecto de la familia. (3) De regalo de esta
medición: **dedup de `get_estado_onboarding_dueno` ×2** — dos zonas la
piden por separado; una sola verdad compartida = −1 request para todos.

## 3 · Nota de alcance

El punto (b) de D-497 (expo-updates ON_LOAD, 5.1MB por publish) no se
re-midió acá — es decisión de mesa sobre `checkAutomatically`, sin cura de
código previa; queda en la deuda tal cual.
