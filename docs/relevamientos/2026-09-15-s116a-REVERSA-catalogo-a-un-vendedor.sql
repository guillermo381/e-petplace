-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260915220000_s116a_catalogo_a_un_vendedor.sql`
-- ESCRITA ANTES DE APLICAR, **con el mapa adentro porque es su única fuente**.
--
-- 🔴 POR QUÉ EL MAPA VA EMBEBIDO: mover 69 ofertas de tres cuentas a una es una
-- operación que **pierde su origen** — después del `UPDATE` ninguna columna dice
-- de quién venía cada fila. Se buscó dónde anotarlo y **ni `ofertas` ni
-- `vendedor_skus` tienen columna `metadata`** (medido), así que la alternativa
-- era agregar una columna de schema para llevar la contabilidad de una mudanza.
-- ⇒ el mapa se generó ANTES de mover y vive acá, en git. *Precedente S79: una
-- reversa embebe el cuerpo vivo cuando es su única fuente.*
--
-- ⚠️ LO QUE NO DESHACE: si alguien editó precio o stock de una oferta movida
-- después de la mudanza, eso NO vuelve — esta reversa mueve el dueño, no el
-- contenido.
-- ⚠️ Y NO toca las 24 que NO se movieron: siguen donde estaban.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TEMP TABLE _mapa(oferta uuid, desde uuid, sku uuid) ON COMMIT DROP;
INSERT INTO _mapa(oferta, desde, sku) VALUES
    ('09448335-9d1a-4de1-9079-4f3bd33ee98c','61a28501-9d09-4bef-b23c-7c102e0fb3e7','e345654b-7384-4cec-ad43-671a51e2c55a'),
    ('0e26d917-8085-4a90-9e87-ff0723501ce2','054f23aa-c453-4a41-9d7f-1668eac6ff5f','f896d84d-65ee-40fe-b02f-91af2ff3cc80'),
    ('177a7a00-0f8f-4ca2-80b6-4ba131e27631','61a28501-9d09-4bef-b23c-7c102e0fb3e7','c13f8859-5951-4266-bcaf-ca3470929dc7'),
    ('1e434436-cb5d-44a6-bd26-46c46ed5bc51','054f23aa-c453-4a41-9d7f-1668eac6ff5f','41d6de25-e010-471d-ba23-7feb6a7a260a'),
    ('2150365b-d48e-41c5-b706-db5357660c44','44efec32-16d0-4fb5-bd6d-2170ac92a97c','23cabfd6-e42a-4dd2-8acf-633fe57c7b90'),
    ('217989c3-ab70-45ce-a48f-6f1bc37ac075','44efec32-16d0-4fb5-bd6d-2170ac92a97c','cfa78828-9a9e-43f2-ae38-591f45f1d268'),
    ('2355edc7-8ce4-4ed1-b186-23ae406409a6','44efec32-16d0-4fb5-bd6d-2170ac92a97c','262bd7ee-17e6-48cd-ad63-4287238f0296'),
    ('252c36ea-2ff8-4956-99ea-4de63a260ba6','61a28501-9d09-4bef-b23c-7c102e0fb3e7','253a56ad-7e5e-4cd2-a79b-2d459491caee'),
    ('2e2b3c57-5c3d-4292-afc2-b176e4e5cefb','054f23aa-c453-4a41-9d7f-1668eac6ff5f','44064dc2-2d38-40cf-b494-142b3abdce84'),
    ('36248a8b-e12f-45ee-8317-430eec17c81a','44efec32-16d0-4fb5-bd6d-2170ac92a97c','fb2ac04e-d916-47f4-943a-e7a62cf7e7ec'),
    ('39006a6b-b64d-4bbd-870f-34e3705c7915','61a28501-9d09-4bef-b23c-7c102e0fb3e7','74e725b5-78dc-4e83-98b4-19edde67b0bc'),
    ('397d2897-3464-4227-b371-53244a935ab3','44efec32-16d0-4fb5-bd6d-2170ac92a97c','8f4e9bea-c2ae-4ef5-9751-46f3ded9a6c8'),
    ('3aa076c6-04e0-4bb9-bc44-fa29a7eeebbe','61a28501-9d09-4bef-b23c-7c102e0fb3e7','0d85d3f8-9327-45b0-93da-800e24c8247a'),
    ('4086ab12-8dd5-4b72-85b3-da2056522b60','61a28501-9d09-4bef-b23c-7c102e0fb3e7','9e0cb21f-dd96-4122-99f1-ea4243fe3c29'),
    ('429ac37b-aab0-40d7-ae04-246165c1eab7','054f23aa-c453-4a41-9d7f-1668eac6ff5f','d67292f0-7587-4485-8625-5e6def2d6f7f'),
    ('42d1ea01-4c8e-44ee-aed3-ca56fa419b3b','61a28501-9d09-4bef-b23c-7c102e0fb3e7','4852d01f-2de0-48f1-9d4a-af7ef75d70a5'),
    ('452d0755-c11f-473f-898a-d215caab7226','44efec32-16d0-4fb5-bd6d-2170ac92a97c','056e0206-5e61-40c9-8033-23e169e030c2'),
    ('559fd349-f1f7-4614-9bc4-7a7341884c7c','054f23aa-c453-4a41-9d7f-1668eac6ff5f','3d908c62-9917-4109-be01-b6ccfb66feaf'),
    ('592e619a-2751-4da6-bef6-ff3eb6230744','054f23aa-c453-4a41-9d7f-1668eac6ff5f','57ef1ff9-8775-4176-9db3-870842d712a6'),
    ('59c3a92e-28ae-431f-91c5-bb48cb54c3aa','61a28501-9d09-4bef-b23c-7c102e0fb3e7','320e932c-db73-4651-9aff-1f5bd297ddef'),
    ('5f3ee632-493b-4d86-a067-69ff87608a80','44efec32-16d0-4fb5-bd6d-2170ac92a97c','6c9bd7e3-630f-4d08-b271-aca81105f420'),
    ('61df9562-ca37-474d-8d93-cc46ae28ff04','61a28501-9d09-4bef-b23c-7c102e0fb3e7','b2d4c132-aac7-4c18-8655-ca7b234e683b'),
    ('65f6fca5-1b6d-4692-9561-cfafdb155278','61a28501-9d09-4bef-b23c-7c102e0fb3e7','4fc1ffed-c696-4413-930f-cd592dca8fd2'),
    ('702ef08f-c0f1-433e-8b80-49072154a4ff','44efec32-16d0-4fb5-bd6d-2170ac92a97c','df353a5f-21c4-4d62-bef0-528bcdba2c8e'),
    ('78a93b5e-1d49-4370-99bb-d5ace2cafaef','61a28501-9d09-4bef-b23c-7c102e0fb3e7','c128c92a-2a36-45f3-8069-9ed1a991c395'),
    ('793a2217-9201-42e0-876b-872a8ea6f9d3','44efec32-16d0-4fb5-bd6d-2170ac92a97c','c31f0118-f650-45ec-a1ca-94c544537fb9'),
    ('7c79ecfe-5359-4285-9795-9aad3b6a998f','61a28501-9d09-4bef-b23c-7c102e0fb3e7','c8ef63e3-0035-435c-be5f-ef16a057f4bc'),
    ('7ca3c70c-7e24-4c19-87f7-47ffdb579d59','61a28501-9d09-4bef-b23c-7c102e0fb3e7','6a7c6c42-0393-4030-ba45-3751724244a7'),
    ('81b6d6ea-67fa-4d2e-9692-c25bb8da6932','44efec32-16d0-4fb5-bd6d-2170ac92a97c','75fde8a3-6e44-4db4-a9cd-ba11940fdf9f'),
    ('843edc39-f7f7-4cad-b226-b46ca2c8a92c','054f23aa-c453-4a41-9d7f-1668eac6ff5f','c5021494-5abb-4651-ac1f-f801b9f3393b'),
    ('8505aa3e-410e-4659-b60b-9c3f05ce5ac0','61a28501-9d09-4bef-b23c-7c102e0fb3e7','d4a694f8-bc02-4520-85b6-fce5c6bf30ea'),
    ('87d06ed8-eded-4f63-90ce-7858aa4b1a47','44efec32-16d0-4fb5-bd6d-2170ac92a97c','9647beda-73f7-45ad-a507-d9e3cf7583c9'),
    ('8946cb52-67d4-419c-af2f-d06c18a4099e','61a28501-9d09-4bef-b23c-7c102e0fb3e7','c768c134-a01a-4700-a011-abb0cf4c4985'),
    ('8c126528-ac8d-485c-bab6-2fa5705b5d58','054f23aa-c453-4a41-9d7f-1668eac6ff5f','a420f9bb-1d6b-4f32-a872-0390e613d4c4'),
    ('99e0b444-6605-4510-9039-c1cd3eadd677','44efec32-16d0-4fb5-bd6d-2170ac92a97c','8715ca9e-71ea-4db6-8fe1-d8ebb2992329'),
    ('9cdf39b9-f6c2-40e6-9f49-8fe8abcb75c3','44efec32-16d0-4fb5-bd6d-2170ac92a97c','dfe2b0a7-d73e-4022-9097-fa2c4fb9b770'),
    ('9d7df643-42b5-46b5-a192-021e8fa6b617','054f23aa-c453-4a41-9d7f-1668eac6ff5f','0f50d482-4d51-4d57-aff3-4d00cc119a5e'),
    ('a3511d14-3fbc-4cb0-8b50-e857eee84fd6','61a28501-9d09-4bef-b23c-7c102e0fb3e7','e0b5818b-9d11-409b-9255-93b2d444c276'),
    ('b1ab67c1-5122-4a40-8942-6b0bc01cfdb1','61a28501-9d09-4bef-b23c-7c102e0fb3e7','d282f1f3-eee6-4e1a-9095-a3c54e20d2b2'),
    ('b1f4d17d-8286-4a84-9ec5-790f27f4e566','61a28501-9d09-4bef-b23c-7c102e0fb3e7','03d01bd0-6849-4448-bc5c-221887d1d174'),
    ('b33a6904-390d-4b0b-8d97-811b96c7b71a','61a28501-9d09-4bef-b23c-7c102e0fb3e7','cb56c568-8d8e-43eb-a48e-8fcafff9b3db'),
    ('b4424cff-e389-46c0-9921-42533d07f880','054f23aa-c453-4a41-9d7f-1668eac6ff5f','75d48f95-3df4-4ced-9f3f-cc998a682a32'),
    ('bddb3d2a-eb52-43aa-a6b9-e98a61e74333','61a28501-9d09-4bef-b23c-7c102e0fb3e7','18fddad8-4a24-4bb3-80b5-036fdd88e124'),
    ('be924189-f33c-4404-89c5-ed354fd9915c','054f23aa-c453-4a41-9d7f-1668eac6ff5f','701dd85b-3f02-40ef-a364-44aa35a422bb'),
    ('bfc6e30a-f2cd-42b1-b969-a62eb7f47552','054f23aa-c453-4a41-9d7f-1668eac6ff5f','b80dcfc2-88c7-464f-bd73-83d973f2dd2a'),
    ('c1dd5831-1112-4a26-8c8e-0ebab76980d6','054f23aa-c453-4a41-9d7f-1668eac6ff5f','1972605f-0673-4aad-a62f-1351bca9ca03'),
    ('c970f836-2041-4b84-a04c-848fa7e7e33a','054f23aa-c453-4a41-9d7f-1668eac6ff5f','6a8b9793-13ca-4b7b-abe4-d733081f3fdf'),
    ('c9c18f76-6a38-4332-9811-f6efeb7c4a72','44efec32-16d0-4fb5-bd6d-2170ac92a97c','ce375339-59df-47ef-9944-0f35910086a0'),
    ('caddacdd-5ef1-4b10-b9b6-84b731295511','44efec32-16d0-4fb5-bd6d-2170ac92a97c','cc5e39b5-9b63-4e39-a591-b6cfc95ef648'),
    ('cb48d24b-ac66-4374-9dae-48fa1882e8ce','61a28501-9d09-4bef-b23c-7c102e0fb3e7','1ea233f3-8191-41b2-a312-cf1d2b917366'),
    ('cb7f05a7-61cf-4af4-9c99-964011e9c702','44efec32-16d0-4fb5-bd6d-2170ac92a97c','3ffe6a45-5fb9-4eca-9bea-e707e358771d'),
    ('cda0693a-5fb0-4ee9-b4e5-f0491975da81','054f23aa-c453-4a41-9d7f-1668eac6ff5f','71ca2d1c-1586-45ed-89fe-3736a637cd1f'),
    ('ce0daa51-7ebc-4c01-940d-aa695de0f487','44efec32-16d0-4fb5-bd6d-2170ac92a97c','0fd3933b-94b0-4e8a-b8e4-5b29d9e410bc'),
    ('cf4eedd5-2fa3-42e2-872f-3fb95987bd63','61a28501-9d09-4bef-b23c-7c102e0fb3e7','6b753b90-9cc0-497d-8c27-98fa9bab5716'),
    ('d07f7904-df2f-416a-a81f-376acf88eba8','054f23aa-c453-4a41-9d7f-1668eac6ff5f','be3f00d7-b273-4c6c-b5d2-bb467e0befd3'),
    ('d0dc7f95-0395-48a0-a859-917f4c1da9c8','44efec32-16d0-4fb5-bd6d-2170ac92a97c','f657ea04-f397-47b0-98d4-e375ea977e22'),
    ('d2387001-ac04-4938-9df7-4c5c2ee89a78','44efec32-16d0-4fb5-bd6d-2170ac92a97c','877167d9-de3c-43cf-8b04-ef0b916a6b57'),
    ('da2b6ae9-571e-4d95-9961-3f849e508654','61a28501-9d09-4bef-b23c-7c102e0fb3e7','4a880bdd-9a41-44bd-99cb-40e11988e296'),
    ('da508e27-6936-48e9-91fa-7d22fe9be456','61a28501-9d09-4bef-b23c-7c102e0fb3e7','e78b4045-c715-4d62-bd3d-90a110c99735'),
    ('dc0e30aa-43ee-4c94-88ee-5c11e76f5d1f','44efec32-16d0-4fb5-bd6d-2170ac92a97c','1986d75d-12cf-4b48-af3a-1cd0458f5b52'),
    ('e3f65428-7a4f-4d6d-a7c0-7454d4678e54','44efec32-16d0-4fb5-bd6d-2170ac92a97c','598bcc5a-7373-414a-8a98-01f5c4021de0'),
    ('e5b72b70-d295-4751-b440-08e9f83e7a69','44efec32-16d0-4fb5-bd6d-2170ac92a97c','8e998c70-76b2-426e-9954-4e30df4e0790'),
    ('eab9c497-aaaa-4fb6-b8af-b3019667d8ce','61a28501-9d09-4bef-b23c-7c102e0fb3e7','df2dd57e-ab69-407e-bb3e-f0c21a75e60d'),
    ('eafb93bb-2542-4fbe-9681-c387fb122ccd','61a28501-9d09-4bef-b23c-7c102e0fb3e7','adc6154b-4dba-424e-bb3d-76a97a80601c'),
    ('ef56fc4d-43a2-4b2c-9135-373018807831','054f23aa-c453-4a41-9d7f-1668eac6ff5f','957ee955-6487-4416-b280-bbf3c652e2aa'),
    ('eff25686-4f0f-48e2-8e9d-6f55042d643e','44efec32-16d0-4fb5-bd6d-2170ac92a97c','96aba1b7-8225-4247-b543-7ae29a718cf1'),
    ('f63e2c35-efc7-46b6-b6f8-f6ae2e166597','44efec32-16d0-4fb5-bd6d-2170ac92a97c','1aa784c7-1e2a-41e8-a9fb-db3f593d8022'),
    ('fe1d6e2f-415c-4bed-a68c-527485464d07','44efec32-16d0-4fb5-bd6d-2170ac92a97c','af497c1f-08c6-479a-8f5d-7c1121eab54b'),
    ('fef2b347-30af-428d-ab81-7ebb8582a374','44efec32-16d0-4fb5-bd6d-2170ac92a97c','2457d7f4-28c5-472e-a264-1fb456b903c0');

-- ① las 5 que viajaron con su sku: el sku vuelve a su cuenta
UPDATE vendedor_skus vs SET cuenta_comercial_id = m.desde
  FROM _mapa m WHERE vs.id = m.sku
    AND vs.cuenta_comercial_id <> m.desde;

-- ② las 69 ofertas vuelven a su cuenta y a su sku original
UPDATE ofertas o SET cuenta_comercial_id = m.desde, sku_id = m.sku
  FROM _mapa m WHERE o.id = m.oferta;

DO $cint$
DECLARE v int;
BEGIN
  SELECT count(*) INTO v FROM ofertas o JOIN cuentas_comerciales cc ON cc.id=o.cuenta_comercial_id
   WHERE o.estado='publicada' AND cc.creado_por_sistema IS NOT NULL;
  IF v <> 93 THEN
    RAISE EXCEPTION 'reversa: las cuentas marcadas quedaron con % ofertas publicadas (eran 93)', v;
  END IF;
  RAISE NOTICE 'reversa verde — las 69 volvieron: las tres cuentas tienen otra vez sus 93';
END $cint$;

COMMIT;
