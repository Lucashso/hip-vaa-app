-- ============================================================
-- SEED DEMO COMPLETO — Hip Va'a Sede (tenant a0000000...)
-- Aplica via: supabase db query --linked < docs/seed_demo.sql
-- ou cole no SQL Editor do Supabase Studio
-- Idempotente (WHERE NOT EXISTS) — pode rodar várias vezes
-- ============================================================

DO $$
DECLARE
  v_tenant uuid := 'a0000000-0000-0000-0000-000000000001';
  v_venue_praia uuid;
  v_venue_pier uuid;
  v_venue_itapoa uuid;
  v_boat_hoku uuid;
  v_boat_aloha uuid;
  v_partner_acai uuid;
  v_partner_kuna uuid;
  v_partner_mahalo uuid;
  v_student uuid;
  v_workout_tpl uuid;
BEGIN
  -- ============= VENUES =============
  INSERT INTO venues (tenant_id, name, address, geo_lat, geo_lng, radius_m, timezone, default_capacity, active)
  SELECT v_tenant, 'Praia da Costa', 'Av. Antônio Gil Veloso, s/n · Vila Velha/ES', -20.34361, -40.28778, 150, 'America/Sao_Paulo', 30, true
  WHERE NOT EXISTS (SELECT 1 FROM venues WHERE tenant_id = v_tenant AND name = 'Praia da Costa');
  SELECT id INTO v_venue_praia FROM venues WHERE tenant_id = v_tenant AND name = 'Praia da Costa';

  INSERT INTO venues (tenant_id, name, address, geo_lat, geo_lng, radius_m, timezone, default_capacity, active)
  SELECT v_tenant, 'Píer Municipal', 'Rua das Garoupas, 200 · Vila Velha/ES', -20.32500, -40.30000, 120, 'America/Sao_Paulo', 20, true
  WHERE NOT EXISTS (SELECT 1 FROM venues WHERE tenant_id = v_tenant AND name = 'Píer Municipal');
  SELECT id INTO v_venue_pier FROM venues WHERE tenant_id = v_tenant AND name = 'Píer Municipal';

  INSERT INTO venues (tenant_id, name, address, geo_lat, geo_lng, radius_m, timezone, default_capacity, active)
  SELECT v_tenant, 'Praia de Itapoã', 'Itapoã · Vila Velha/ES', -20.31000, -40.29500, 150, 'America/Sao_Paulo', 25, true
  WHERE NOT EXISTS (SELECT 1 FROM venues WHERE tenant_id = v_tenant AND name = 'Praia de Itapoã');
  SELECT id INTO v_venue_itapoa FROM venues WHERE tenant_id = v_tenant AND name = 'Praia de Itapoã';

  -- ============= BOATS =============
  INSERT INTO boats (tenant_id, name, type, capacity, status, venue_id)
  SELECT v_tenant, 'Hōkūleʻa', 'oc6'::boat_type, 6, 'active'::boat_status, v_venue_praia
  WHERE NOT EXISTS (SELECT 1 FROM boats WHERE tenant_id = v_tenant AND name = 'Hōkūleʻa');
  SELECT id INTO v_boat_hoku FROM boats WHERE tenant_id = v_tenant AND name = 'Hōkūleʻa';

  INSERT INTO boats (tenant_id, name, type, capacity, status, venue_id)
  SELECT v_tenant, 'Aloha', 'oc6'::boat_type, 6, 'active'::boat_status, v_venue_praia
  WHERE NOT EXISTS (SELECT 1 FROM boats WHERE tenant_id = v_tenant AND name = 'Aloha');
  SELECT id INTO v_boat_aloha FROM boats WHERE tenant_id = v_tenant AND name = 'Aloha';

  INSERT INTO boats (tenant_id, name, type, capacity, status, venue_id)
  SELECT v_tenant, 'Náhia', 'oc6'::boat_type, 6, 'maintenance'::boat_status, v_venue_pier
  WHERE NOT EXISTS (SELECT 1 FROM boats WHERE tenant_id = v_tenant AND name = 'Náhia');

  INSERT INTO boats (tenant_id, name, type, capacity, status, venue_id)
  SELECT v_tenant, 'Maui', 'oc1'::boat_type, 1, 'active'::boat_status, v_venue_praia
  WHERE NOT EXISTS (SELECT 1 FROM boats WHERE tenant_id = v_tenant AND name = 'Maui');

  INSERT INTO boats (tenant_id, name, type, capacity, status, venue_id)
  SELECT v_tenant, 'Mahina', 'oc1'::boat_type, 1, 'active'::boat_status, v_venue_pier
  WHERE NOT EXISTS (SELECT 1 FROM boats WHERE tenant_id = v_tenant AND name = 'Mahina');

  INSERT INTO boats (tenant_id, name, type, capacity, status, venue_id)
  SELECT v_tenant, 'Honu', 'oc1'::boat_type, 1, 'active'::boat_status, v_venue_itapoa
  WHERE NOT EXISTS (SELECT 1 FROM boats WHERE tenant_id = v_tenant AND name = 'Honu');

  -- ============= PRODUCTS =============
  INSERT INTO products (tenant_id, name, description, type, price_cents, stock_quantity, active, sizes)
  SELECT v_tenant, 'Camiseta dry-fit cyan', 'Tecido leve, anti-suor, logo Hip Va''a no peito', 'stock', 12900, 24, true, '[{"size":"P","quantity":6},{"size":"M","quantity":10},{"size":"G","quantity":6},{"size":"GG","quantity":2}]'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE tenant_id = v_tenant AND name = 'Camiseta dry-fit cyan');
  INSERT INTO products (tenant_id, name, description, type, price_cents, stock_quantity, active, sizes)
  SELECT v_tenant, 'Camiseta dry-fit navy', 'Versão escura · mesma malha', 'stock', 12900, 18, true, '[{"size":"P","quantity":4},{"size":"M","quantity":8},{"size":"G","quantity":4},{"size":"GG","quantity":2}]'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE tenant_id = v_tenant AND name = 'Camiseta dry-fit navy');
  INSERT INTO products (tenant_id, name, description, type, price_cents, stock_quantity, active)
  SELECT v_tenant, 'Boné navy bordado', 'Bordado oficial · ajustável', 'stock', 8000, 12, true
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE tenant_id = v_tenant AND name = 'Boné navy bordado');
  INSERT INTO products (tenant_id, name, description, type, price_cents, stock_quantity, active)
  SELECT v_tenant, 'Garrafa térmica 750ml', 'Inox · mantém gelo por 12h', 'stock', 6000, 30, true
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE tenant_id = v_tenant AND name = 'Garrafa térmica 750ml');
  INSERT INTO products (tenant_id, name, description, type, price_cents, stock_quantity, active)
  SELECT v_tenant, 'Mochila técnica 25L', 'Resistente à água · vários compartimentos', 'stock', 20000, 8, true
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE tenant_id = v_tenant AND name = 'Mochila técnica 25L');
  INSERT INTO products (tenant_id, name, description, type, price_cents, stock_quantity, active)
  SELECT v_tenant, 'Toalha microfibra', 'Seca rápido · 40x80cm', 'stock', 6000, 5, true
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE tenant_id = v_tenant AND name = 'Toalha microfibra');
  INSERT INTO products (tenant_id, name, description, type, price_cents, stock_quantity, active)
  SELECT v_tenant, 'Remo Vaa Pro Carbono', 'Lâmina importada · ajustável', 'order', 128000, 0, true
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE tenant_id = v_tenant AND name = 'Remo Vaa Pro Carbono');
  INSERT INTO products (tenant_id, name, description, type, price_cents, stock_quantity, active)
  SELECT v_tenant, 'Remo Steerer carbono', 'Modelo direção · profissional', 'order', 189000, 0, true
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE tenant_id = v_tenant AND name = 'Remo Steerer carbono');
  INSERT INTO products (tenant_id, name, description, type, price_cents, stock_quantity, active)
  SELECT v_tenant, 'Bag Hip Va''a 30L', 'Bag impermeável · alça reforçada', 'stock', 32000, 6, true
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE tenant_id = v_tenant AND name = 'Bag Hip Va''a 30L');
  INSERT INTO products (tenant_id, name, description, type, price_cents, stock_quantity, active)
  SELECT v_tenant, 'Colete salva-vidas', 'Modelo náutico · 3 tamanhos', 'stock', 18000, 15, true
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE tenant_id = v_tenant AND name = 'Colete salva-vidas');
  INSERT INTO products (tenant_id, name, description, type, price_cents, stock_quantity, active)
  SELECT v_tenant, 'Protetor solar 50FPS', 'Resistente à água · 120ml', 'stock', 4500, 40, true
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE tenant_id = v_tenant AND name = 'Protetor solar 50FPS');
  INSERT INTO products (tenant_id, name, description, type, price_cents, stock_quantity, active)
  SELECT v_tenant, 'Bermuda Hip Va''a', 'Secagem rápida · 4 cores', 'stock', 14900, 20, true, NULL
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE tenant_id = v_tenant AND name = 'Bermuda Hip Va''a');

  -- ============= PARTNERS =============
  INSERT INTO partners (tenant_id, name, description, active, display_order, is_global)
  SELECT v_tenant, 'Açaí Ohana', '−20% em qualquer combo · todas as unidades', true, 1, false WHERE NOT EXISTS (SELECT 1 FROM partners WHERE tenant_id = v_tenant AND name = 'Açaí Ohana');
  SELECT id INTO v_partner_acai FROM partners WHERE tenant_id = v_tenant AND name = 'Açaí Ohana';
  INSERT INTO partners (tenant_id, name, description, active, display_order, is_global)
  SELECT v_tenant, 'Hari Surf', '1 aula experimental grátis · Praia da Costa', true, 2, false WHERE NOT EXISTS (SELECT 1 FROM partners WHERE tenant_id = v_tenant AND name = 'Hari Surf');
  INSERT INTO partners (tenant_id, name, description, active, display_order, is_global)
  SELECT v_tenant, 'Kuna Café', 'Café duplo na faixa após check-in', true, 3, false WHERE NOT EXISTS (SELECT 1 FROM partners WHERE tenant_id = v_tenant AND name = 'Kuna Café');
  SELECT id INTO v_partner_kuna FROM partners WHERE tenant_id = v_tenant AND name = 'Kuna Café';
  INSERT INTO partners (tenant_id, name, description, active, display_order, is_global)
  SELECT v_tenant, 'Mahalo Spa', 'Massagem 50min por R$ 89', true, 4, false WHERE NOT EXISTS (SELECT 1 FROM partners WHERE tenant_id = v_tenant AND name = 'Mahalo Spa');
  SELECT id INTO v_partner_mahalo FROM partners WHERE tenant_id = v_tenant AND name = 'Mahalo Spa';
  INSERT INTO partners (tenant_id, name, description, active, display_order, is_global)
  SELECT v_tenant, 'Ola Wear', '15% off em camisetas técnicas', true, 5, false WHERE NOT EXISTS (SELECT 1 FROM partners WHERE tenant_id = v_tenant AND name = 'Ola Wear');
  INSERT INTO partners (tenant_id, name, description, active, display_order, is_global)
  SELECT v_tenant, 'Decathlon', 'Frete grátis acima de R$ 200', true, 6, false WHERE NOT EXISTS (SELECT 1 FROM partners WHERE tenant_id = v_tenant AND name = 'Decathlon');

  -- ============= PARTNER ACTIONS =============
  INSERT INTO partner_actions (partner_id, label, action_type, value, is_primary, display_order)
  SELECT v_partner_acai, 'Pedir agora', 'whatsapp', '5527999000001', true, 1
  WHERE v_partner_acai IS NOT NULL AND NOT EXISTS (SELECT 1 FROM partner_actions WHERE partner_id = v_partner_acai AND label = 'Pedir agora');
  INSERT INTO partner_actions (partner_id, label, action_type, value, is_primary, display_order, whatsapp_message)
  SELECT v_partner_acai, 'Cupom REMA20', 'coupon', 'REMA20', false, 2, 'Quero usar o cupom REMA20'
  WHERE v_partner_acai IS NOT NULL AND NOT EXISTS (SELECT 1 FROM partner_actions WHERE partner_id = v_partner_acai AND label = 'Cupom REMA20');
  INSERT INTO partner_actions (partner_id, label, action_type, value, is_primary, display_order)
  SELECT v_partner_kuna, 'Resgatar café', 'whatsapp', '5527999000002', true, 1
  WHERE v_partner_kuna IS NOT NULL AND NOT EXISTS (SELECT 1 FROM partner_actions WHERE partner_id = v_partner_kuna AND label = 'Resgatar café');
  INSERT INTO partner_actions (partner_id, label, action_type, value, is_primary, display_order)
  SELECT v_partner_mahalo, 'Agendar massagem', 'link', 'https://wa.me/5527999000003', true, 1
  WHERE v_partner_mahalo IS NOT NULL AND NOT EXISTS (SELECT 1 FROM partner_actions WHERE partner_id = v_partner_mahalo AND label = 'Agendar massagem');

  -- ============= BANNERS =============
  INSERT INTO banners (tenant_id, title, description, image_url, link_url, link_label, active, starts_at, ends_at, display_order, is_global)
  SELECT v_tenant, 'Travessia Anchieta · 18 mai', 'Inscrições abertas pra travessia anual', '/logo-source.png', '/passeios', 'Quero ir', true, now() - interval '1 day', now() + interval '15 days', 1, false
  WHERE NOT EXISTS (SELECT 1 FROM banners WHERE tenant_id = v_tenant AND title = 'Travessia Anchieta · 18 mai');
  INSERT INTO banners (tenant_id, title, description, image_url, link_url, link_label, active, starts_at, ends_at, display_order, is_global)
  SELECT v_tenant, 'Indique e ganhe R$ 50', 'Cada amigo que se inscrever vira crédito', '/logo-source.png', '/indicacao', 'Compartilhar', true, now() - interval '5 days', now() + interval '30 days', 2, false
  WHERE NOT EXISTS (SELECT 1 FROM banners WHERE tenant_id = v_tenant AND title = 'Indique e ganhe R$ 50');
  INSERT INTO banners (tenant_id, title, description, image_url, link_url, link_label, active, starts_at, ends_at, display_order, is_global)
  SELECT v_tenant, 'Nova loja oficial', 'Coleção dry-fit chegou', '/logo-source.png', '/loja', 'Ver produtos', true, now() - interval '2 days', now() + interval '60 days', 3, false
  WHERE NOT EXISTS (SELECT 1 FROM banners WHERE tenant_id = v_tenant AND title = 'Nova loja oficial');

  -- ============= ANNOUNCEMENTS =============
  INSERT INTO announcements (tenant_id, title, content, active, priority, starts_at, ends_at)
  SELECT v_tenant, 'Mar agitado nesta sexta', 'Previsão de vento sul forte. Aulas das 06h podem ser canceladas.', true, 'high', now(), now() + interval '3 days'
  WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE tenant_id = v_tenant AND title = 'Mar agitado nesta sexta');
  INSERT INTO announcements (tenant_id, title, content, active, priority, starts_at, ends_at)
  SELECT v_tenant, 'Travessia Anchieta · inscrições abertas', 'Travessia 18/05 · 22km · vagas limitadas. Inscreva-se no app.', true, 'normal', now(), now() + interval '15 days'
  WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE tenant_id = v_tenant AND title = 'Travessia Anchieta · inscrições abertas');
  INSERT INTO announcements (tenant_id, title, content, active, priority, starts_at, ends_at)
  SELECT v_tenant, 'Confraternização do clube · 25 mai', 'Sábado, 18h, na sede. Convide a família!', true, 'low', now(), now() + interval '20 days'
  WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE tenant_id = v_tenant AND title = 'Confraternização do clube · 25 mai');
  INSERT INTO announcements (tenant_id, title, content, active, priority, starts_at, ends_at)
  SELECT v_tenant, 'Manutenção sistema · 11/05 03h', 'O app pode ficar fora do ar por 30 minutos.', true, 'low', now() - interval '1 day', now() + interval '2 days'
  WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE tenant_id = v_tenant AND title = 'Manutenção sistema · 11/05 03h');

  -- ============= EXERCISE LIBRARY (30 exercícios) =============
  INSERT INTO exercise_library (tenant_id, name, exercise_type, muscle_group, description)
  SELECT v_tenant, x.n, x.t, x.m, x.d FROM (VALUES
    ('Remada na barra fixa','strength','costas','Pegada pronada, controle excêntrico'),
    ('Flexão de braço','strength','peito','Mãos largura ombros'),
    ('Desenvolvimento militar','strength','ombros','Halteres ou barra'),
    ('Rosca direta','strength','bíceps','Cotovelos colados ao corpo'),
    ('Tríceps testa','strength','tríceps','Decúbito banco'),
    ('Agachamento livre','strength','pernas','Pés ombros, joelhos alinhados'),
    ('Levantamento terra','strength','posterior','Costas neutra, quadril leva'),
    ('Prancha isométrica','strength','core','3x40s'),
    ('Bird-dog','strength','core','Estabilidade contralateral'),
    ('Crunch oblíquo','strength','core','Sem puxar pescoço'),
    ('Burpee','crossfit','full body','Cadência 30/min'),
    ('Box jump 60cm','crossfit','pernas','Aterrissagem joelhos macios'),
    ('Mountain climber','crossfit','core','Tempo: 1 min'),
    ('Catch técnica V1','tecnica','remada','Entrada vertical, sem splash'),
    ('Phase de propulsão','tecnica','remada','Empurrar com tronco'),
    ('Recovery alto','tecnica','remada','Lâmina rente à água no retorno'),
    ('Mudança de lado','tecnica','remada','Cadência 8 remadas por lado'),
    ('Mobilidade torácica','mobilidade','tronco','Foam roller 5min'),
    ('Alongamento cadeia posterior','mobilidade','pernas','Holds de 30s'),
    ('Rotação de quadril','mobilidade','quadril','Círculos amplos'),
    ('Sprint 200m vogado','cardio','remada','RPE 9'),
    ('Resistência 60min','cardio','remada','RPE 6 contínuo'),
    ('Intervalado 4x500m','cardio','remada','Pausa 1 min entre'),
    ('Pirâmide 100-200-400','cardio','remada','Aquecer 5min antes'),
    ('Corrida 5k base','cardio','pernas','Ritmo conversa'),
    ('Pliometria salto frontal','duration','pernas','3x10 saltos'),
    ('Equilíbrio em prancha','duration','core','Tempo: 1 min'),
    ('Yoga sequência sol','duration','full body','12 ásanas'),
    ('Respiração ujjayi','duration','pulmonar','10 min'),
    ('Meditação foco corpo','duration','mental','15 min')
  ) AS x(n, t, m, d)
  WHERE NOT EXISTS (SELECT 1 FROM exercise_library WHERE tenant_id = v_tenant AND name = x.n);

  -- ============= WORKOUT TEMPLATES =============
  INSERT INTO workout_templates (tenant_id, name, description)
  SELECT v_tenant, 'Força — membros superiores', 'Treino de força 45-60min focado em peito/costas/ombros'
  WHERE NOT EXISTS (SELECT 1 FROM workout_templates WHERE tenant_id = v_tenant AND name = 'Força — membros superiores');
  INSERT INTO workout_templates (tenant_id, name, description)
  SELECT v_tenant, 'Cardio — resistência aeróbica', 'Treino contínuo 60min RPE 6'
  WHERE NOT EXISTS (SELECT 1 FROM workout_templates WHERE tenant_id = v_tenant AND name = 'Cardio — resistência aeróbica');
  INSERT INTO workout_templates (tenant_id, name, description)
  SELECT v_tenant, 'Técnica V1', 'Foco em catch + phase + recovery, 45min'
  WHERE NOT EXISTS (SELECT 1 FROM workout_templates WHERE tenant_id = v_tenant AND name = 'Técnica V1');
  INSERT INTO workout_templates (tenant_id, name, description)
  SELECT v_tenant, 'Pré-travessia', 'Preparação 90min · 3 sprints + base longa'
  WHERE NOT EXISTS (SELECT 1 FROM workout_templates WHERE tenant_id = v_tenant AND name = 'Pré-travessia');
  INSERT INTO workout_templates (tenant_id, name, description)
  SELECT v_tenant, 'Mobilidade e recovery', '30min low-impact pós treino pesado'
  WHERE NOT EXISTS (SELECT 1 FROM workout_templates WHERE tenant_id = v_tenant AND name = 'Mobilidade e recovery');

  -- Exercícios do template "Força — membros superiores"
  SELECT id INTO v_workout_tpl FROM workout_templates WHERE tenant_id = v_tenant AND name = 'Força — membros superiores';
  IF v_workout_tpl IS NOT NULL AND NOT EXISTS (SELECT 1 FROM workout_template_exercises WHERE template_id = v_workout_tpl) THEN
    INSERT INTO workout_template_exercises (template_id, exercise_name, exercise_type, sets, reps, weight_kg, rest_seconds, sort_order, notes) VALUES
      (v_workout_tpl, 'Remada na barra fixa', 'strength', 4, 10, NULL, 90, 1, 'Pegada pronada'),
      (v_workout_tpl, 'Flexão de braço', 'strength', 4, 12, NULL, 60, 2, 'Cadência 2-0-2'),
      (v_workout_tpl, 'Desenvolvimento militar', 'strength', 4, 8, 22, 90, 3, NULL),
      (v_workout_tpl, 'Rosca direta', 'strength', 3, 12, 14, 60, 4, NULL),
      (v_workout_tpl, 'Tríceps testa', 'strength', 3, 12, 12, 60, 5, NULL),
      (v_workout_tpl, 'Prancha isométrica', 'duration', 3, NULL, NULL, 30, 6, 'Hold 40s');
  END IF;

  -- ============= COMMUNITY POSTS (8 posts) =============
  SELECT id INTO v_student FROM students WHERE tenant_id = v_tenant LIMIT 1;
  IF v_student IS NOT NULL THEN
    INSERT INTO community_posts (tenant_id, student_id, author_id, caption, is_approved, likes_count, comments_count, image_url)
    SELECT v_tenant, v_student, v_student, x.cap, true, x.likes, x.coms, '/logo-source.png'
    FROM (VALUES
      ('Que treino épico hoje no OC6 Avançado! 🌊 Mar liso e tripulação em sincronia.', 24, 6),
      ('Lembrete: passeio para Anchieta no sábado tem 4 vagas. Quem topa? 🛶', 18, 12),
      ('Camiseta nova chegou na loja do clube! 👕', 31, 9),
      ('OC6 raça hoje. 7am sai a primeira. Bom dia tribo!', 15, 4),
      ('Sunset no píer ontem 🌅 obrigada Manu pela companhia', 27, 8),
      ('Quem vai treinar amanhã às 6? Conta nos comentários', 12, 14),
      ('Marcando meus 100 check-ins hoje! 🔥', 42, 18),
      ('Travessia Anchieta confirmada · vamos brilhar 💪', 19, 5)
    ) AS x(cap, likes, coms)
    WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE tenant_id = v_tenant AND caption = x.cap);
  END IF;

  -- ============= CREW TEMPLATES =============
  INSERT INTO crew_templates (tenant_id, name, boat_id, description)
  SELECT v_tenant, 'Tripulação Avançado · Travessia', v_boat_hoku, 'Time titular pras travessias longas'
  WHERE v_boat_hoku IS NOT NULL AND NOT EXISTS (SELECT 1 FROM crew_templates WHERE tenant_id = v_tenant AND name = 'Tripulação Avançado · Travessia');
  INSERT INTO crew_templates (tenant_id, name, boat_id, description)
  SELECT v_tenant, 'Iniciante manhã', v_boat_aloha, 'Tripulação de iniciantes 6h ter/qui/sáb'
  WHERE v_boat_aloha IS NOT NULL AND NOT EXISTS (SELECT 1 FROM crew_templates WHERE tenant_id = v_tenant AND name = 'Iniciante manhã');

  -- ============= TRAINING SESSIONS (3 sessões pro aluno teste) =============
  IF v_student IS NOT NULL THEN
    INSERT INTO training_sessions (student_id, tenant_id, session_date, title, description, status, results_json, student_feedback)
    SELECT v_student, v_tenant, CURRENT_DATE - 3, 'Força em terra · membros superiores', 'Treino completo de força', 'completed',
      '{"perceived_effort": 8, "total_time_seconds": 2820, "athlete_confirmed_at": "2026-05-08T07:00:00Z"}'::jsonb,
      'Senti bem cansado nos últimos sets de barra fixa'
    WHERE NOT EXISTS (SELECT 1 FROM training_sessions WHERE student_id = v_student AND session_date = CURRENT_DATE - 3);
    INSERT INTO training_sessions (student_id, tenant_id, session_date, title, description, status)
    SELECT v_student, v_tenant, CURRENT_DATE + 1, 'Pré-travessia · intervalado V1', 'Sprints 4x500m com pausa de 1min', 'pending'
    WHERE NOT EXISTS (SELECT 1 FROM training_sessions WHERE student_id = v_student AND session_date = CURRENT_DATE + 1);
    INSERT INTO training_sessions (student_id, tenant_id, session_date, title, description, status)
    SELECT v_student, v_tenant, CURRENT_DATE + 3, 'Resistência aeróbica longa', '60min contínuos RPE 6', 'pending'
    WHERE NOT EXISTS (SELECT 1 FROM training_sessions WHERE student_id = v_student AND session_date = CURRENT_DATE + 3);
  END IF;

  -- ============= PHYSICAL ASSESSMENTS (2 avaliações) =============
  IF v_student IS NOT NULL THEN
    INSERT INTO physical_assessments (student_id, tenant_id, assessed_at, weight_kg, height_cm, body_fat_pct, vo2max, resting_hr, notes)
    SELECT v_student, v_tenant, now() - interval '30 days', 78.5, 178, 14.2, 48, 58, 'Boa evolução desde out/24'
    WHERE NOT EXISTS (SELECT 1 FROM physical_assessments WHERE student_id = v_student AND assessed_at::date = (now() - interval '30 days')::date);
    INSERT INTO physical_assessments (student_id, tenant_id, assessed_at, weight_kg, height_cm, body_fat_pct, vo2max, resting_hr, notes)
    SELECT v_student, v_tenant, now() - interval '120 days', 81.0, 178, 16.8, 46, 62, 'Linha base — início do plano'
    WHERE NOT EXISTS (SELECT 1 FROM physical_assessments WHERE student_id = v_student AND assessed_at::date = (now() - interval '120 days')::date);
  END IF;

END $$;
