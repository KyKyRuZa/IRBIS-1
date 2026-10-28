-- Add etn_point column to item_types to store the ETN paragraph per nomenclature position
ALTER TABLE "item_types" ADD COLUMN IF NOT EXISTS "etn_point" VARCHAR(255);

-- Populate etn_point from issue_norms (one distinct value per item_type_id)
UPDATE "item_types" it
SET "etn_point" = sub.etn_point
FROM (
  SELECT DISTINCT ON (item_type_id) item_type_id, etn_point
  FROM issue_norms
  WHERE etn_point IS NOT NULL
) sub
WHERE it.id = sub.item_type_id AND it.etn_point IS NULL;
