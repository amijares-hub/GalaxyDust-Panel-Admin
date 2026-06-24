-- =============================================================================
-- GALAXY DUST ONLINE — MIGRACIÓN: Columnas extendidas de matrix_skills_registry
-- Archivo : supabase/seeds/migration_extend_registry.sql
-- Ejecutar PRIMERO en el SQL Editor de Supabase, antes que el seed.
-- Seguro  : IF NOT EXISTS — idempotente, no rompe si ya existen.
-- =============================================================================

-- ── 1. Agregar columna source_type (Consumable | License | Booster | NULL) ───
ALTER TABLE public.matrix_skills_registry
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT NULL;

-- ── 2. Agregar columna allowed_resources (JSONB array, solo para Tools) ───────
ALTER TABLE public.matrix_skills_registry
  ADD COLUMN IF NOT EXISTS allowed_resources JSONB DEFAULT NULL;

-- ── 3. Agregar columna sub_type (Production | Facility | Combat | etc.) ───────
ALTER TABLE public.matrix_skills_registry
  ADD COLUMN IF NOT EXISTS sub_type TEXT DEFAULT NULL;

-- ── 4. Agregar columna astrobot_role (Attack | Defense | Scout | ...) ─────────
ALTER TABLE public.matrix_skills_registry
  ADD COLUMN IF NOT EXISTS astrobot_role TEXT DEFAULT NULL;

-- ── 5. Agregar columna scope_type (Global Account | Specific Asset) ───────────
ALTER TABLE public.matrix_skills_registry
  ADD COLUMN IF NOT EXISTS scope_type TEXT DEFAULT NULL;

-- ── 6. Agregar updated_at si no existe ───────────────────────────────────────
ALTER TABLE public.matrix_skills_registry
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── Verificar columnas resultantes ───────────────────────────────────────────
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'matrix_skills_registry'
ORDER BY ordinal_position;
