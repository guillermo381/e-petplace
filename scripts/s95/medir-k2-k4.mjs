// ═══════════════════════════════════════════════════════════════════════════
// S95-K · LAS DOS MEDICIONES QUE VAN ANTES DE CUALQUIER ARREGLO
//
//   K.2 · ¿PUEDE CAPTURARSE UN PAGO ANTES DE QUE LA RESERVA TENGA ÉXITO?
//         De la respuesta depende si esto es experiencia o si es plata.
//   K.4 · ¿`momentos_aplicables` FILTRA? Y si no, ¿por qué las mascotas ven
//         alimento de cachorro.
//
// 🔴 TODA LA SONDA CORRE DENTRO DE UNA TRANSACCIÓN QUE SE REVIERTE. Las sondas
//    de S95-G escribieron pedidos reales mientras otra pista medía y le
//    ensuciaron el conteo. No se repite: acá el ROLLBACK es del mecanismo, no
//    de la prolijidad.
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const TMP = mkdtempSync(join(tmpdir(), 'k-'));
let seq = 0;
function sql(texto) {
  const f = join(TMP, `q${seq++}.sql`);
  writeFileSync(f, texto);
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', '--file', f],
    { encoding: 'utf8' });
  const s = r.stdout || '';
  const i = s.indexOf('{');
  if (r.status !== 0 || i === -1) {
    const crudo = (r.stdout || '') + (r.stderr || '');
    const m = crudo.match(/ERROR:\s*[0-9A-Z]+:\s*([^\\"]+)/);
    throw new Error(m ? m[1].trim() : crudo.slice(0, 400).trim());
  }
  return JSON.parse(s.slice(i)).rows;
}

console.log('\n══════════ K.2 · ¿SE PUEDE COBRAR SIN HABER RESERVADO? ══════════\n');

// ① Lo primero, por estructura: ¿`confirmar_pago_pedido` llama a la reserva?
const llama = sql(`
  SELECT (pg_get_functiondef(p.oid) ~ 'reservar_stock_pedido') llama_reserva,
         (pg_get_functiondef(p.oid) ~ 'stock_reservado') mueve_a_ese_estado
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='confirmar_pago_pedido'`)[0];
console.log(`① confirmar_pago_pedido llama a reservar_stock_pedido : ${llama.llama_reserva}`);
console.log(`   …y mueve el pedido al estado «stock_reservado»      : ${llama.mueve_a_ese_estado}`);

// ② Y ahora el ATAQUE, que es lo que decide: un pedido de un SKU SIN stock.
//    Todo adentro de una transacción que se revierte.
const r = sql(`
BEGIN;
CREATE TEMP TABLE _k2 (que text, valor text) ON COMMIT DROP;
DO $$
DECLARE
  v_cc uuid; v_user uuid; v_of uuid; v_ped uuid; v_sku uuid;
  v_estado text; v_reservas int; v_disp int; v_intentos int; v_err text := 'ninguno';
BEGIN
  SELECT cc.id, cc.owner_profile_id INTO v_cc, v_user
  FROM cuentas_comerciales cc WHERE cc.estado='activa'
    AND EXISTS (SELECT 1 FROM cuenta_roles cr WHERE cr.cuenta_comercial_id=cc.id
                 AND cr.tipo_actor='seller_productos' AND cr.estado='activo') LIMIT 1;
  SELECT o.id, o.sku_id INTO v_of, v_sku FROM ofertas o WHERE o.estado='publicada' LIMIT 1;
  SELECT stock_disponible INTO v_disp FROM vendedor_skus WHERE id=v_sku;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user, 'role','authenticated')::text, true);

  SELECT (crear_pedido_despensa(v_cc,
            jsonb_build_array(jsonb_build_object('oferta_id', v_of, 'cantidad', 1)),
            '{"nombre_receptor":"sonda","telefono":"+593999999999","direccion":"x","ciudad":"Quito"}'::jsonb,
            '__sonda_k2')->>'pedido_id')::uuid INTO v_ped;

  -- El camino REAL del cliente: primero pide pagar.
  PERFORM mover_estado_pedido(v_ped, 'esperando_pago', 'cliente');

  -- La reserva se INTENTA y se espera que falle: el SKU no tiene stock.
  BEGIN
    PERFORM reservar_stock_pedido(v_ped, 5);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  SELECT count(*) INTO v_reservas FROM inventario_reservas
   WHERE pedido_id=v_ped AND estado='vigente';

  -- Y AHORA EL BACKEND CONFIRMA EL PAGO, sin que exista reserva.
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM confirmar_pago_pedido(v_ped,'__sonda','ref','__sonda_k2_pago','{}'::jsonb);

  SELECT estado INTO v_estado FROM pedidos WHERE id=v_ped;
  SELECT count(*) INTO v_intentos FROM pagos_intentos
   WHERE pedido_id=v_ped AND estado='aprobado';

  INSERT INTO _k2 VALUES
    ('stock_disponible', v_disp::text),
    ('error_de_la_reserva', v_err),
    ('reservas_vigentes', v_reservas::text),
    ('estado_final_del_pedido', v_estado),
    ('pagos_APROBADOS', v_intentos::text);
END $$;
SELECT que, valor FROM _k2;
ROLLBACK;`);
console.log(`\n② ${JSON.stringify(r)}`);


console.log('\n══════════ K.4 · ¿FILTRA `momentos_aplicables`? ══════════\n');

// ① ¿La recomendación lo mira siquiera? Se mide en el WRAPPER, que es quien
//    arma el filtro — el motor no tiene función de recomendación.
const { readFileSync } = await import('node:fs');
const wrapper = readFileSync('packages/api/src/wrappers/despensa-catalogo.ts', 'utf8');
const filtra = /momentos_aplicables/.test(
  wrapper.slice(wrapper.indexOf('export async function recomendarParaMascota')),
);
console.log(`① recomendarParaMascota menciona momentos_aplicables: ${filtra}`);

// ② ¿Las mascotas tienen con qué? Si no tienen fecha, no hay etapa que filtrar.
console.log('\n② LAS MASCOTAS DE LA FAMILIA DEMO:');
console.log(JSON.stringify(sql(`
  SELECT m.nombre, m.especie, m.fecha_nacimiento::text nac,
         calcular_etapa_vida(m.fecha_nacimiento, m.especie) etapa
  FROM mascotas m
  JOIN familia_miembro fm ON fm.familia_id=m.familia_id AND fm.hasta IS NULL
  JOIN profiles p ON p.id=fm.user_id
  WHERE p.email='demo-prestador@epetplace.dev' AND m.estado_vida='activa'
  ORDER BY m.nombre`), null, 1));

console.log('\n③ LO QUE DECLARAN LOS SEIS PRODUCTOS:');
console.log(JSON.stringify(sql(`
  SELECT nombre, especies_aplicables::text esp, momentos_aplicables::text mom
  FROM productos ORDER BY nombre`), null, 1));
