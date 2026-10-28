-- Drop legacy position column from norm_templates (removed from schema)
ALTER TABLE "norm_templates" DROP COLUMN IF EXISTS "position";
DROP INDEX IF EXISTS "norm_templates_position_idx";