-- Change cascade delete to restrict for issue_records to preserve history
-- Deleting an employee or item_type should not wipe issue_records history

-- Drop existing FK constraints with CASCADE
ALTER TABLE "issue_records" DROP CONSTRAINT IF EXISTS "issue_records_employee_id_fkey";
ALTER TABLE "issue_records" DROP CONSTRAINT IF EXISTS "issue_records_item_type_id_fkey";

-- Re-add with RESTRICT to prevent accidental data loss
ALTER TABLE "issue_records" ADD CONSTRAINT "issue_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "issue_records" ADD CONSTRAINT "issue_records_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "item_types" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
