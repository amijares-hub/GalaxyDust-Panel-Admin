-- =============================================================================
-- GALAXY DUST ONLINE — PASO 6: SEED AVANZADO DE matrix_skills_registry
-- Archivo : supabase/seeds/seed_advanced_assets.sql
-- 
-- ⚠️  PRE-REQUISITO: ejecutar primero migration_extend_registry.sql
-- Seguro  : ON CONFLICT (skill_code) DO UPDATE — idempotente.
-- =============================================================================

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │  1. MATERIALIZADORES MAESTROS                                               │
-- │     asset_tab: general_effects | source_type: Consumable                   │
-- └─────────────────────────────────────────────────────────────────────────────┘

INSERT INTO public.matrix_skills_registry (
  skill_code, base_name, asset_tab, target_entity,
  rarity, stat_affected, modifier_value, math_operator,
  duration_type, duration_value, license_group,
  source_type, outcome_config
)
VALUES
  -- Master Materializer: 100 % éxito, consume blueprint
  (
    'mat_master_v1',
    'Master Materializer',
    'general_effects', 'general_effects',
    'Legendary', NULL, NULL, 'add',
    'transaction_based', 1, NULL,
    'Consumable',
    '{
      "config_type": "materializer_matrix",
      "outcomes": [
        {
          "chance_pct": 100,
          "asset_multiplier": 1,
          "consume_resources": false,
          "consume_blueprint": true,
          "reward_item_code": null
        }
      ]
    }'::jsonb
  ),

  -- Semi-Master Materializer: 50 % éxito / 50 % fallo, consume blueprint siempre
  (
    'mat_semimaster_v1',
    'Semi-Master Materializer',
    'general_effects', 'general_effects',
    'Epic', NULL, NULL, 'add',
    'transaction_based', 1, NULL,
    'Consumable',
    '{
      "config_type": "materializer_matrix",
      "outcomes": [
        {
          "chance_pct": 50,
          "asset_multiplier": 1,
          "consume_resources": false,
          "consume_blueprint": true,
          "reward_item_code": null
        },
        {
          "chance_pct": 50,
          "asset_multiplier": 0,
          "consume_resources": false,
          "consume_blueprint": true,
          "reward_item_code": null
        }
      ]
    }'::jsonb
  )

ON CONFLICT (skill_code) DO UPDATE SET
  base_name      = EXCLUDED.base_name,
  rarity         = EXCLUDED.rarity,
  duration_type  = EXCLUDED.duration_type,
  duration_value = EXCLUDED.duration_value,
  source_type    = EXCLUDED.source_type,
  outcome_config = EXCLUDED.outcome_config;


-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │  2. MATERIALIZADOR PREMIUM (árbol de 6 resultados)                         │
-- │     Suma de chance_pct = 60+10+3+7+10+10 = 100 ✅                          │
-- └─────────────────────────────────────────────────────────────────────────────┘

INSERT INTO public.matrix_skills_registry (
  skill_code, base_name, asset_tab, target_entity,
  rarity, stat_affected, modifier_value, math_operator,
  duration_type, duration_value, license_group,
  source_type, outcome_config
)
VALUES
  (
    'mat_premium_v1',
    'Premium Materializer',
    'general_effects', 'general_effects',
    'Epic', NULL, NULL, 'add',
    'transaction_based', 1, NULL,
    'Consumable',
    '{
      "config_type": "materializer_matrix",
      "outcomes": [
        {
          "chance_pct": 60,
          "asset_multiplier": 1,
          "consume_resources": false,
          "consume_blueprint": true,
          "reward_item_code": null
        },
        {
          "chance_pct": 10,
          "asset_multiplier": 1,
          "consume_resources": false,
          "consume_blueprint": false,
          "reward_item_code": null
        },
        {
          "chance_pct": 3,
          "asset_multiplier": 2,
          "consume_resources": false,
          "consume_blueprint": false,
          "reward_item_code": null
        },
        {
          "chance_pct": 7,
          "asset_multiplier": 0,
          "consume_resources": false,
          "consume_blueprint": true,
          "reward_item_code": null
        },
        {
          "chance_pct": 10,
          "asset_multiplier": 0,
          "consume_resources": false,
          "consume_blueprint": false,
          "reward_item_code": null
        },
        {
          "chance_pct": 10,
          "asset_multiplier": 0,
          "consume_resources": false,
          "consume_blueprint": false,
          "reward_item_code": "materializer_s1"
        }
      ]
    }'::jsonb
  )

ON CONFLICT (skill_code) DO UPDATE SET
  base_name      = EXCLUDED.base_name,
  rarity         = EXCLUDED.rarity,
  duration_type  = EXCLUDED.duration_type,
  duration_value = EXCLUDED.duration_value,
  source_type    = EXCLUDED.source_type,
  outcome_config = EXCLUDED.outcome_config;


-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │  3. KITS DE REPARACIÓN DE CAMPO                                            │
-- │     asset_tab: general_effects | source_type: Consumable                   │
-- └─────────────────────────────────────────────────────────────────────────────┘

INSERT INTO public.matrix_skills_registry (
  skill_code, base_name, asset_tab, target_entity,
  rarity, stat_affected, modifier_value, math_operator,
  duration_type, duration_value, license_group,
  source_type, outcome_config
)
VALUES
  (
    'kit_repair_small',
    'Small Repair Kit',
    'general_effects', 'general_effects',
    'Common', 'fleet_health_restore', 0.2500, 'add',
    'instant_use', NULL, NULL,
    'Consumable', NULL
  ),
  (
    'kit_repair_medium',
    'Medium Repair Kit',
    'general_effects', 'general_effects',
    'Uncommon', 'fleet_health_restore', 0.5000, 'add',
    'instant_use', NULL, NULL,
    'Consumable', NULL
  ),
  (
    'kit_repair_large',
    'Large Repair Kit',
    'general_effects', 'general_effects',
    'Rare', 'fleet_health_restore', 1.0000, 'add',
    'instant_use', NULL, NULL,
    'Consumable', NULL
  )

ON CONFLICT (skill_code) DO UPDATE SET
  base_name      = EXCLUDED.base_name,
  rarity         = EXCLUDED.rarity,
  stat_affected  = EXCLUDED.stat_affected,
  modifier_value = EXCLUDED.modifier_value,
  math_operator  = EXCLUDED.math_operator,
  duration_type  = EXCLUDED.duration_type,
  source_type    = EXCLUDED.source_type;


-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │  4. SEGUROS DE EXPEDICIÓN — QMP & QMC                                      │
-- └─────────────────────────────────────────────────────────────────────────────┘

INSERT INTO public.matrix_skills_registry (
  skill_code, base_name, asset_tab, target_entity,
  rarity, stat_affected, modifier_value, math_operator,
  duration_type, duration_value, license_group,
  source_type, outcome_config
)
VALUES
  (
    'exp_qmp_platform',
    'Quantum Miniaturizer Platform',
    'general_effects', 'general_effects',
    'Rare', 'ship_recovery_rate', 1.0000, 'add',
    'expedition_bound', NULL, NULL,
    'Consumable', NULL
  ),
  (
    'exp_qmc_cube',
    'Quantum Miniaturizer Cube',
    'general_effects', 'general_effects',
    'Epic', 'special_loot_permit', 1.0000, 'override',
    'expedition_bound', NULL, NULL,
    'Consumable', NULL
  )

ON CONFLICT (skill_code) DO UPDATE SET
  base_name      = EXCLUDED.base_name,
  rarity         = EXCLUDED.rarity,
  stat_affected  = EXCLUDED.stat_affected,
  modifier_value = EXCLUDED.modifier_value,
  math_operator  = EXCLUDED.math_operator,
  duration_type  = EXCLUDED.duration_type,
  source_type    = EXCLUDED.source_type;


-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │  5. LICENCIAS Y PERMISOS                                                   │
-- │     asset_tab: general_effects | source_type: License                      │
-- └─────────────────────────────────────────────────────────────────────────────┘

INSERT INTO public.matrix_skills_registry (
  skill_code, base_name, asset_tab, target_entity,
  rarity, stat_affected, modifier_value, math_operator,
  duration_type, duration_value, license_group,
  source_type, outcome_config
)
VALUES
  (
    'lic_refinery_permit_t1',
    'Station Refinery Permit',
    'general_effects', 'general_effects',
    'Rare', 'production_rate', 0.2000, 'multiply',
    'time_limited', 72,
    'refinery_permit',
    'License', NULL
  )

ON CONFLICT (skill_code) DO UPDATE SET
  base_name      = EXCLUDED.base_name,
  rarity         = EXCLUDED.rarity,
  stat_affected  = EXCLUDED.stat_affected,
  modifier_value = EXCLUDED.modifier_value,
  math_operator  = EXCLUDED.math_operator,
  duration_type  = EXCLUDED.duration_type,
  duration_value = EXCLUDED.duration_value,
  license_group  = EXCLUDED.license_group,
  source_type    = EXCLUDED.source_type;


-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │  6. TOOLS DE MINERÍA EXÓTICA                                               │
-- │     asset_tab: tools                                                        │
-- └─────────────────────────────────────────────────────────────────────────────┘

INSERT INTO public.matrix_skills_registry (
  skill_code, base_name, asset_tab, target_entity,
  rarity, stat_affected, modifier_value, math_operator,
  duration_type, duration_value, license_group,
  source_type, allowed_resources, outcome_config
)
VALUES
  (
    'tool_dark_matter_drill',
    'Dark Matter Plasma Drill',
    'tools', 'tools',
    'Legendary', 'mining_yield_multiplier', 2.5000, 'multiply',
    'permanent', NULL, NULL,
    NULL,
    '["Metal", "Crystal", "Deuterium", "Dark Matter"]'::jsonb,
    NULL
  )

ON CONFLICT (skill_code) DO UPDATE SET
  base_name         = EXCLUDED.base_name,
  rarity            = EXCLUDED.rarity,
  stat_affected     = EXCLUDED.stat_affected,
  modifier_value    = EXCLUDED.modifier_value,
  math_operator     = EXCLUDED.math_operator,
  duration_type     = EXCLUDED.duration_type,
  allowed_resources = EXCLUDED.allowed_resources;


-- =============================================================================
-- ✅ VERIFICACIÓN FINAL — ejecuta esto para confirmar los registros insertados
-- =============================================================================
SELECT
  skill_code,
  base_name,
  rarity,
  asset_tab,
  source_type,
  duration_type,
  jsonb_array_length(outcome_config->'outcomes') AS num_outcomes
FROM public.matrix_skills_registry
WHERE skill_code IN (
  'mat_master_v1','mat_semimaster_v1','mat_premium_v1',
  'kit_repair_small','kit_repair_medium','kit_repair_large',
  'exp_qmp_platform','exp_qmc_cube',
  'lic_refinery_permit_t1',
  'tool_dark_matter_drill'
)
ORDER BY asset_tab, skill_code;
